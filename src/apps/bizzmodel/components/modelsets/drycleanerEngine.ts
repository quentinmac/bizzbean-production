import {
  DrycleanerCapacityMode,
  DrycleanerFullResult,
  DrycleanerProcess,
  DrycleanerProcessResult,
  DrycleanerProductConfig,
  DrycleanerProductionSummaryResult,
  ProductionSummaryResult,
  UnitCostDynamicsResult,
} from './modelSetTypes';
import {
  calculateBillOfMaterials,
  calculateEmployeeIndicator,
  calculatePackagingCosts,
  calculateProductionVariableCosts,
} from './batchLotsEngine';

const safeNum = (val: unknown, fallback = 0): number => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * 1. DRYCLEANER PRODUCTION CALCULATOR (Multi-Process per Product)
 * Faithful to drycleaner.xlsx (Rows 22–35):
 * - productionHoursPerDay (R31) = numberOfWorkstreams * shiftHours * shiftsPerDay
 * - piecesPerHour (R32) = hourly throughput per machine/station
 * - outputPerDay (R33) = productionHoursPerDay * piecesPerHour
 * - outputPerMonth (R34) = productionDaysPerMonth * outputPerDay
 * - employeesRequiredStandard (R35) = numberOfWorkstreams * employeesPerLine * shiftsPerDay
 *
 * Supports multiple processes per product in either:
 * - 'bottleneck' mode: sequential stages (e.g. Dry-Cleaning -> Steam Pressing -> Inspection/Bagging; capacity = slowest stage MIN)
 * - 'sum' mode: parallel dry-cleaning machines / pressing stations (capacity = combined SUM)
 */
export function calculateDrycleanerProductionSummary(
  processes: DrycleanerProcess[],
  capacityMode: DrycleanerCapacityMode,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number,
  outputUnit = 'pieces'
): DrycleanerProductionSummaryResult {
  const daysMonth = Math.max(1, safeNum(productionDaysPerMonth, 19));
  const daysYear = Math.max(1, safeNum(productionDaysPerAnnum, daysMonth * 12));
  const mode: DrycleanerCapacityMode = capacityMode === 'sum' ? 'sum' : 'bottleneck';
  const unitText = (outputUnit || 'pieces').trim() || 'pieces';

  const rawResults = processes.map((proc) => {
    const workstreams = Math.max(0, safeNum(proc.numberOfWorkstreams, 0));
    const empPerLine = Math.max(0, safeNum(proc.employeesPerLine, 0));
    const shiftHrs = Math.max(0, safeNum(proc.shiftHours, 0));
    const shifts = Math.max(0, safeNum(proc.shiftsPerDay, 0));
    const piecesHr = Math.max(0, safeNum(proc.piecesPerHour, 0));

    // Excel R31: =E25*E28*24*E29
    const productionHoursPerDay = workstreams * shiftHrs * shifts;

    // Excel R33: =F31*F32
    const outputPerDay = productionHoursPerDay * piecesHr;

    // Excel R34: =F24*F33
    const outputPerMonth = Math.round(daysMonth * outputPerDay);
    const outputPerAnnum = Math.round(daysYear * outputPerDay);

    // Excel R35: =F25*F27*F29
    const employeesRequiredStandard = Math.round(workstreams * empPerLine * shifts);

    return {
      id: proc.id,
      name: proc.name || 'Dry-Cleaning Process',
      productionHoursPerDay,
      piecesPerHour: piecesHr,
      outputPerDay,
      outputPerMonth,
      outputPerAnnum,
      employeesRequiredStandard,
    };
  });

  const activeProcesses = rawResults.filter((p) => p.outputPerDay > 0);
  const minDailyOutput =
    activeProcesses.length > 0
      ? Math.min(...activeProcesses.map((p) => p.outputPerDay))
      : 0;
  const sumDailyOutput = rawResults.reduce((s, p) => s + p.outputPerDay, 0);

  const dailyOutputCapacity = mode === 'sum' ? sumDailyOutput : minDailyOutput;

  const computedProcesses: DrycleanerProcessResult[] = rawResults.map((p) => {
    const isBottleneck =
      mode === 'bottleneck' &&
      activeProcesses.length > 0 &&
      Math.abs(p.outputPerDay - minDailyOutput) < 1e-9;
    const spareDailyOutput =
      mode === 'bottleneck' ? Math.max(0, p.outputPerDay - minDailyOutput) : 0;

    return {
      ...p,
      isBottleneck,
      spareDailyOutput,
    };
  });

  const bottleneckList = computedProcesses.filter((p) => p.isBottleneck);

  let effectiveHoursPerDay = 0;
  let effectivePiecesPerHour = 0;

  if (mode === 'sum') {
    effectiveHoursPerDay = computedProcesses.reduce(
      (sum, p) => sum + p.productionHoursPerDay,
      0
    );
    effectivePiecesPerHour =
      effectiveHoursPerDay > 0 ? dailyOutputCapacity / effectiveHoursPerDay : 0;
  } else {
    const primaryBottleneck = bottleneckList[0] || computedProcesses[0];
    effectiveHoursPerDay = primaryBottleneck?.productionHoursPerDay ?? 0;
    effectivePiecesPerHour = primaryBottleneck?.piecesPerHour ?? 0;
  }

  const monthlyOutputCapacity = Math.round(dailyOutputCapacity * daysMonth);
  const annualOutputCapacity = Math.round(dailyOutputCapacity * daysYear);
  const totalEmployeesStandard = computedProcesses.reduce(
    (sum, p) => sum + p.employeesRequiredStandard,
    0
  );

  return {
    outputUnit: unitText,
    processes: computedProcesses,
    capacityMode: mode,
    dailyOutputCapacity,
    monthlyOutputCapacity,
    annualOutputCapacity,
    effectiveHoursPerDay,
    effectivePiecesPerHour,
    bottleneckProcessIds: bottleneckList.map((p) => p.id),
    bottleneckProcessNames: bottleneckList.map((p) => p.name),
    totalEmployeesStandard,
    productionDaysPerMonth: daysMonth,
    productionDaysPerAnnum: daysYear,
  };
}

/**
 * Adapter converting DrycleanerProductionSummaryResult into ProductionSummaryResult
 * so shared EmployeeCalculatorPanel, BillOfMaterialsPanel, ProductionVariableCostsPanel,
 * and UnitCostDynamicsPanel work natively with exact drycleaner.xlsx R48–R106 math:
 * - Excel R50 (BOM units required per day) = E33 (dailyOutputCapacity = 80 pieces/day)
 *   -> bottleneckCyclesPerDay = dailyOutputCapacity (so qty / piece × 80 pieces = daily material units required)
 * - Excel R71 (Variable costs batch quantity) = E50 (dailyOutputCapacity = 80 pieces/day)
 *   -> bottleneckUnitsPerBatch = dailyOutputCapacity (so R100 / 80 pieces = R1.25/piece)
 */
function buildProductionBridge(
  drycleaner: DrycleanerProductionSummaryResult
): ProductionSummaryResult {
  return {
    processes: drycleaner.processes.map((p) => ({
      id: p.id,
      name: p.name,
      productionHoursPerDay: p.productionHoursPerDay,
      allocatedUnitsPerBatch: p.piecesPerHour,
      batchTotalTimeMinutes: 60,
      batchTotalTimeHours: 1,
      cyclesPerDay: p.productionHoursPerDay,
      grossDailyUnits: p.outputPerDay,
      netDailyCapacity: p.outputPerDay,
      monthlyCapacity: p.outputPerMonth,
      annualCapacity: p.outputPerAnnum,
      employeesRequiredStandard: p.employeesRequiredStandard,
      isBottleneck: p.isBottleneck,
      spareDailyUnits: p.spareDailyOutput,
    })),
    bottleneckDailyCapacity: drycleaner.dailyOutputCapacity,
    bottleneckProcessIds: drycleaner.bottleneckProcessIds,
    bottleneckProcessNames: drycleaner.bottleneckProcessNames,
    bottleneckCyclesPerDay: drycleaner.dailyOutputCapacity,
    bottleneckUnitsPerBatch: drycleaner.dailyOutputCapacity,
    monthlyCapacity: drycleaner.monthlyOutputCapacity,
    annualCapacity: drycleaner.annualOutputCapacity,
    totalEmployeesStandard: drycleaner.totalEmployeesStandard,
    productionDaysPerMonth: drycleaner.productionDaysPerMonth,
    productionDaysPerAnnum: drycleaner.productionDaysPerAnnum,
  };
}

/**
 * FULL 6-CALCULATOR DRYCLEANER ENGINE
 * 1. Production Calculator (multi-process hourly pieces throughput & daily capacity)
 * 2. Employee Calculator (advisory only — zero impact on production)
 * 3. Bill of Materials (dynamic product costing per piece / garment)
 * 4. Packaging Costs (multi-level hierarchy supporting 2+ levels)
 * 5. Production Variable Costs (direct utilities, energy, water & maintenance per daily batch or unit)
 * 6. Unit Cost Dynamics (consolidates materials + packaging + variable -> transfers to Results tab)
 */
export function calculateDrycleanerFull(
  config: DrycleanerProductConfig,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): DrycleanerFullResult {
  const drycleanerProduction = calculateDrycleanerProductionSummary(
    config.processes,
    config.capacityMode ?? 'bottleneck',
    productionDaysPerMonth,
    productionDaysPerAnnum,
    config.outputUnit || 'pieces'
  );

  const productionBridge = buildProductionBridge(drycleanerProduction);

  // 2. Employee Calculator (Strictly advisory — zero impact on production!)
  const employees = calculateEmployeeIndicator(
    config.employeeAssumptions,
    productionBridge
  );

  // 3. Bill of Materials (Excel R48–R61)
  const bom = calculateBillOfMaterials(config.bomComponents, productionBridge);

  // 4. Packaging Costs (Multi-level, Excel R62–R69+)
  const packaging = calculatePackagingCosts(config.packagingLevels);

  // 5. Production Variable Costs (Excel R70–R91)
  const variableCosts = calculateProductionVariableCosts(
    config.variableCosts,
    productionBridge,
    config.dynamicsOverrides?.referenceBatchSizeOverride
  );

  // 6. Unit Cost Dynamics (Excel R97–R106)
  const materialsUnitCost = bom.totalMaterialsUnitCost;
  const packagingUnitCost = packaging.totalPackagingUnitCost;
  const productionVariableUnitCost = variableCosts.totalVariableUnitCost;

  const calculatedUnitCost =
    materialsUnitCost + packagingUnitCost + productionVariableUnitCost;

  const estimatedUnitCost = Math.max(
    0,
    safeNum(config.dynamicsOverrides?.estimatedUnitCost, 0)
  );
  const isUsingEstimatedOverride = estimatedUnitCost > 0;
  const modeledUnitCost = isUsingEstimatedOverride
    ? estimatedUnitCost
    : calculatedUnitCost;

  const denom = calculatedUnitCost > 0 ? calculatedUnitCost : 1;
  const materialsSharePct =
    calculatedUnitCost > 0 ? (materialsUnitCost / denom) * 100 : 0;
  const packagingSharePct =
    calculatedUnitCost > 0 ? (packagingUnitCost / denom) * 100 : 0;
  const variableSharePct =
    calculatedUnitCost > 0 ? (productionVariableUnitCost / denom) * 100 : 0;

  const dynamics: UnitCostDynamicsResult = {
    materialsUnitCost,
    packagingUnitCost,
    productionVariableUnitCost,
    calculatedUnitCost,
    estimatedUnitCost,
    modeledUnitCost,
    isUsingEstimatedOverride,
    materialsSharePct,
    packagingSharePct,
    variableSharePct,
    dailyCapacity: drycleanerProduction.dailyOutputCapacity,
    monthlyCapacity: drycleanerProduction.monthlyOutputCapacity,
    employeesIndicated: employees.employeesAdjusted,
  };

  return {
    drycleanerProduction,
    productionBridge,
    employees,
    bom,
    packaging,
    variableCosts,
    dynamics,
  };
}

/**
 * Default starter configuration modelled directly on drycleaner.xlsx:
 * - Production: 1 workstream/machine, 1 emp/line, 8h shift, 1 shift/day, 10 pieces/hr -> 8 hrs/day -> 80 pieces/day (1,520/mo), 1 std employee
 * - Employee Calculator: 8 hrs/day, 100% efficiency, 0% tolerance -> 1 std, 0 relief, 1 adjusted
 * - BOM: Dry-Cleaning Solvent & Spotting Chemicals (1 unit/piece, divider 1, pack size 1, pack cost R1, consumables 0, surplus wasted Yes) -> R1.00/piece
 * - Packaging: empty by default (R0.00, supports 2+ dynamic levels)
 * - Production Variable Costs: Electricity (10 kW × R10 = R100 / 80 pieces = R1.25/piece) + Gas/Fuel/Water/Maintenance (0) -> R1.25/piece
 * - Total Modeled Unit Cost: R1.00 + R0.00 + R1.25 = R2.25/piece
 */
export function createDefaultDrycleanerConfig(): DrycleanerProductConfig {
  return {
    outputUnit: 'pieces',
    processes: [
      {
        id: 'dryclean-proc-1',
        name: 'Dry-Cleaning Machine A',
        numberOfWorkstreams: 1,
        employeesPerLine: 1,
        shiftHours: 8,
        shiftsPerDay: 1,
        piecesPerHour: 10,
      },
    ],
    capacityMode: 'bottleneck',
    employeeAssumptions: {
      hoursPaidPerDay: 8,
      labourEfficiencyPct: 100,
      tolerancePct: 0,
    },
    bomComponents: [
      {
        id: 'dryclean-bom-1',
        name: 'Dry-Cleaning Solvent & Spotting Chemicals',
        unitOfMeasure: 'dose',
        unitsRequiredPerBatch: 1,
        unitDivider: 1,
        packSizeUnits: 1,
        packCost: 1,
        batchConsumablesCost: 0,
        surplusWasted: true,
      },
    ],
    packagingLevels: [],
    variableCosts: [
      {
        id: 'dryclean-var-elec',
        name: 'Electricity',
        basis: 'per_batch',
        usage: 10,
        usageUnit: 'kW',
        unitRate: 10,
      },
      {
        id: 'dryclean-var-gas',
        name: 'Gas',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'kg',
        unitRate: 0,
      },
      {
        id: 'dryclean-var-fuel',
        name: 'Fuel',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'L',
        unitRate: 0,
      },
      {
        id: 'dryclean-var-water',
        name: 'Water',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'kL',
        unitRate: 0,
      },
      {
        id: 'dryclean-var-maint',
        name: 'Maintenance',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'day',
        unitRate: 0,
      },
    ],
    dynamicsOverrides: {
      estimatedUnitCost: 0,
      referenceBatchSizeOverride: 0,
    },
  };
}
