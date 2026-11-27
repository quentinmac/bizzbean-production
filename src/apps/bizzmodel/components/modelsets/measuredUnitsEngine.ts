import {
  MeasuredUnitsCapacityMode,
  MeasuredUnitsFullResult,
  MeasuredUnitsProcess,
  MeasuredUnitsProcessResult,
  MeasuredUnitsProductConfig,
  MeasuredUnitsProductionSummaryResult,
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
 * 1. MEASURED UNITS PRODUCTION CALCULATOR (Multi-Process per Product)
 * Faithful to measured units.xlsx (Rows 22–33):
 * - hoursAvailablePerDay (R29) = numberOfWorkstreams * operatorsPerWorkstream * shiftHours * shiftsPerDay
 * - unitsPerDay (R31) = hoursAvailablePerDay * unitsPerHourPerEmployee
 * - unitsPerMonth (R32) = productionDaysPerMonth * unitsPerDay
 * - employeesRequiredStandard (R33) = numberOfWorkstreams * operatorsPerWorkstream * shiftsPerDay
 *
 * Supports multiple processes per product in either:
 * - 'bottleneck' mode: sequential service stages (daily capacity = slowest active stage MIN)
 * - 'sum' mode: parallel service crews (daily capacity = combined SUM of units/day)
 */
export function calculateMeasuredUnitsProductionSummary(
  processes: MeasuredUnitsProcess[],
  capacityMode: MeasuredUnitsCapacityMode,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number,
  measurementUnit = 'units'
): MeasuredUnitsProductionSummaryResult {
  const daysMonth = Math.max(1, safeNum(productionDaysPerMonth, 19));
  const daysYear = Math.max(1, safeNum(productionDaysPerAnnum, daysMonth * 12));
  const mode: MeasuredUnitsCapacityMode = capacityMode === 'sum' ? 'sum' : 'bottleneck';
  const unitText = (measurementUnit || 'units').trim() || 'units';

  const rawResults = processes.map((proc) => {
    const workstreams = Math.max(0, safeNum(proc.numberOfWorkstreams, 0));
    const operators = Math.max(0, safeNum(proc.operatorsPerWorkstream, 0));
    const shiftHrs = Math.max(0, safeNum(proc.shiftHours, 0));
    const shifts = Math.max(0, safeNum(proc.shiftsPerDay, 0));
    const unitsPerHr = Math.max(0, safeNum(proc.unitsPerHourPerEmployee, 0));

    // Excel R29: =E25*E26*E27*24*E28
    const hoursAvailablePerDay = workstreams * operators * shiftHrs * shifts;

    // Excel R31: =E29*E30
    const unitsPerDay = hoursAvailablePerDay * unitsPerHr;

    // Excel R32: =F24*F31
    const unitsPerMonth = Math.round(daysMonth * unitsPerDay);
    const unitsPerAnnum = Math.round(daysYear * unitsPerDay);

    // Excel R33: =F25*F26*F28
    const employeesRequiredStandard = Math.round(workstreams * operators * shifts);

    return {
      id: proc.id,
      name: proc.name || 'Service Process',
      hoursAvailablePerDay,
      unitsPerHourPerEmployee: unitsPerHr,
      unitsPerDay,
      unitsPerMonth,
      unitsPerAnnum,
      employeesRequiredStandard,
    };
  });

  const activeProcesses = rawResults.filter((p) => p.unitsPerDay > 0);
  const minDailyUnits =
    activeProcesses.length > 0
      ? Math.min(...activeProcesses.map((p) => p.unitsPerDay))
      : 0;
  const sumDailyUnits = rawResults.reduce((s, p) => s + p.unitsPerDay, 0);

  const dailyUnitsCapacity = mode === 'sum' ? sumDailyUnits : minDailyUnits;

  const computedProcesses: MeasuredUnitsProcessResult[] = rawResults.map((p) => {
    const isBottleneck =
      mode === 'bottleneck' &&
      activeProcesses.length > 0 &&
      p.unitsPerDay === minDailyUnits;
    const spareDailyUnits =
      mode === 'bottleneck' ? Math.max(0, p.unitsPerDay - minDailyUnits) : 0;

    return {
      ...p,
      isBottleneck,
      spareDailyUnits,
    };
  });

  const bottleneckList = computedProcesses.filter((p) => p.isBottleneck);

  // Reference operator-hours/day & units/op-hr so BOM (R48-R61) and Variable Costs (R71-R91) stay exact:
  // In both modes, effectiveHoursPerDay * referenceUnitsPerHour === dailyUnitsCapacity.
  let effectiveHoursPerDay = 0;
  let referenceUnitsPerHour = 0;

  if (mode === 'sum') {
    effectiveHoursPerDay = computedProcesses.reduce(
      (sum, p) => sum + p.hoursAvailablePerDay,
      0
    );
    referenceUnitsPerHour =
      effectiveHoursPerDay > 0 ? dailyUnitsCapacity / effectiveHoursPerDay : 0;
  } else {
    const primaryBottleneck = bottleneckList[0] || computedProcesses[0];
    effectiveHoursPerDay = primaryBottleneck?.hoursAvailablePerDay ?? 0;
    referenceUnitsPerHour = primaryBottleneck?.unitsPerHourPerEmployee ?? 0;
  }

  const monthlyUnitsCapacity = Math.round(dailyUnitsCapacity * daysMonth);
  const annualUnitsCapacity = Math.round(dailyUnitsCapacity * daysYear);
  const totalEmployeesStandard = computedProcesses.reduce(
    (sum, p) => sum + p.employeesRequiredStandard,
    0
  );

  return {
    measurementUnit: unitText,
    processes: computedProcesses,
    capacityMode: mode,
    effectiveHoursPerDay,
    referenceUnitsPerHour,
    dailyUnitsCapacity,
    monthlyUnitsCapacity,
    annualUnitsCapacity,
    bottleneckProcessIds: bottleneckList.map((p) => p.id),
    bottleneckProcessNames: bottleneckList.map((p) => p.name),
    totalEmployeesStandard,
    productionDaysPerMonth: daysMonth,
    productionDaysPerAnnum: daysYear,
  };
}

/**
 * Adapter converting MeasuredUnitsProductionSummaryResult into ProductionSummaryResult
 * so shared EmployeeCalculatorPanel, BillOfMaterialsPanel, ProductionVariableCostsPanel,
 * and UnitCostDynamicsPanel work natively with exact Excel R48–R106 math:
 * - bottleneckCyclesPerDay = effectiveHoursPerDay (Excel E48 = E29 = 8 operator-hours/day)
 * - bottleneckUnitsPerBatch = referenceUnitsPerHour (Excel F71 = F30 = 100 units/op-hr)
 * - bottleneckDailyCapacity = dailyUnitsCapacity (Excel E31 = 800 units/day)
 */
function buildProductionBridge(
  mu: MeasuredUnitsProductionSummaryResult
): ProductionSummaryResult {
  return {
    processes: mu.processes.map((p) => ({
      id: p.id,
      name: p.name,
      productionHoursPerDay: p.hoursAvailablePerDay,
      allocatedUnitsPerBatch: p.unitsPerHourPerEmployee,
      batchTotalTimeMinutes: 60,
      batchTotalTimeHours: 1,
      cyclesPerDay: p.hoursAvailablePerDay,
      grossDailyUnits: p.unitsPerDay,
      netDailyCapacity: p.unitsPerDay,
      monthlyCapacity: p.unitsPerMonth,
      annualCapacity: p.unitsPerAnnum,
      employeesRequiredStandard: p.employeesRequiredStandard,
      isBottleneck: p.isBottleneck,
      spareDailyUnits: p.spareDailyUnits,
    })),
    bottleneckDailyCapacity: mu.dailyUnitsCapacity,
    bottleneckProcessIds: mu.bottleneckProcessIds,
    bottleneckProcessNames: mu.bottleneckProcessNames,
    bottleneckCyclesPerDay: mu.effectiveHoursPerDay,
    bottleneckUnitsPerBatch: mu.referenceUnitsPerHour,
    monthlyCapacity: mu.monthlyUnitsCapacity,
    annualCapacity: mu.annualUnitsCapacity,
    totalEmployeesStandard: mu.totalEmployeesStandard,
    productionDaysPerMonth: mu.productionDaysPerMonth,
    productionDaysPerAnnum: mu.productionDaysPerAnnum,
  };
}

/**
 * FULL 6-CALCULATOR MEASURED UNITS ENGINE
 * 1. Production Calculator (multi-process measured units/day & units/month)
 * 2. Employee Calculator (advisory only — zero impact on production)
 * 3. Bill of Materials (dynamic product costing linked to operator-hours/day & units/day)
 * 4. Packaging Costs (multi-level hierarchy supporting 2+ levels)
 * 5. Production Variable Costs (direct utilities, energy & maintenance per hourly batch or unit)
 * 6. Unit Cost Dynamics (consolidates materials + packaging + variable -> transfers to Results tab)
 */
export function calculateMeasuredUnitsFull(
  config: MeasuredUnitsProductConfig,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): MeasuredUnitsFullResult {
  const measuredProduction = calculateMeasuredUnitsProductionSummary(
    config.processes,
    config.capacityMode ?? 'bottleneck',
    productionDaysPerMonth,
    productionDaysPerAnnum,
    config.measurementUnit || 'units'
  );

  const productionBridge = buildProductionBridge(measuredProduction);

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

  // 6. Unit Cost Dynamics (Excel R92–R106)
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
    dailyCapacity: measuredProduction.dailyUnitsCapacity,
    monthlyCapacity: measuredProduction.monthlyUnitsCapacity,
    employeesIndicated: employees.employeesAdjusted,
  };

  return {
    measuredProduction,
    productionBridge,
    employees,
    bom,
    packaging,
    variableCosts,
    dynamics,
  };
}

/**
 * Default starter configuration modelled directly on measured units.xlsx:
 * - Production: 1 workstream, 1 operator, 8h shift, 1 shift/day, 100 units/op-hr -> 8 hrs/day, 800 units/day, 1 std employee
 * - Employee Calculator: 8 hrs/day, 100% efficiency, 0% tolerance -> 1 std, 0 relief, 1 adjusted
 * - BOM: Primary Material (100 units/op-hr, divider 1, pack size 1, pack cost 10, consumables 0, surplus wasted Yes) -> R10.00/unit
 * - Packaging: empty by default (R0.00, supports 2+ dynamic levels)
 * - Production Variable Costs: Electricity (10 kW/batch × R10 = R100 / 100 units = R1.00/unit) + Gas/Fuel/Water/Maintenance (0) -> R1.00/unit
 * - Total Modeled Unit Cost: R10.00 + R0.00 + R1.00 = R11.00/unit
 */
export function createDefaultMeasuredUnitsConfig(): MeasuredUnitsProductConfig {
  return {
    measurementUnit: 'units',
    processes: [
      {
        id: 'mu-proc-1',
        name: 'Primary Output Process',
        numberOfWorkstreams: 1,
        operatorsPerWorkstream: 1,
        shiftHours: 8,
        shiftsPerDay: 1,
        unitsPerHourPerEmployee: 100,
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
        id: 'mu-bom-1',
        name: 'Primary Service Material',
        unitOfMeasure: 'unit',
        unitsRequiredPerBatch: 100,
        unitDivider: 1,
        packSizeUnits: 1,
        packCost: 10,
        batchConsumablesCost: 0,
        surplusWasted: true,
      },
    ],
    packagingLevels: [],
    variableCosts: [
      {
        id: 'mu-var-elec',
        name: 'Electricity',
        basis: 'per_batch',
        usage: 10,
        usageUnit: 'kW',
        unitRate: 10,
      },
      {
        id: 'mu-var-gas',
        name: 'Gas',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'kg',
        unitRate: 0,
      },
      {
        id: 'mu-var-fuel',
        name: 'Fuel',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'L',
        unitRate: 0,
      },
      {
        id: 'mu-var-water',
        name: 'Water',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'kL',
        unitRate: 0,
      },
      {
        id: 'mu-var-maint',
        name: 'Maintenance',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'job',
        unitRate: 0,
      },
    ],
    dynamicsOverrides: {
      estimatedUnitCost: 0,
      referenceBatchSizeOverride: 0,
    },
  };
}
