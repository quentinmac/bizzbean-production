import {
  LaundryCapacityMode,
  LaundryFullResult,
  LaundryProcess,
  LaundryProcessResult,
  LaundryProductConfig,
  LaundryProductionSummaryResult,
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
 * 1. LAUNDRY PRODUCTION CALCULATOR (Multi-Process per Product)
 * Faithful to laundry.xlsx (Rows 22–39):
 * - productionHoursPerDay (R31) = numberOfWorkstreams * shiftHours * shiftsPerDay
 * - cycleTotalTime (R35) = cycleRunTimeMinutes + cycleSetupTimeMinutes
 * - cyclesPerDay (R36) = productionHoursPerDay / (cycleTotalTimeMinutes / 60)
 * - outputPerDay (R37) = kgPerWashCycle * cyclesPerDay
 * - outputPerMonth (R38) = productionDaysPerMonth * outputPerDay
 * - employeesRequiredStandard (R39) = numberOfWorkstreams * employeesPerLine * shiftsPerDay
 *
 * Supports multiple processes per product in either:
 * - 'bottleneck' mode: sequential stages (e.g. Washing -> Drying -> Ironing/Folding; capacity = slowest stage MIN)
 * - 'sum' mode: parallel laundry machines/bays (capacity = combined SUM)
 */
export function calculateLaundryProductionSummary(
  processes: LaundryProcess[],
  capacityMode: LaundryCapacityMode,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number,
  outputUnit = 'kg'
): LaundryProductionSummaryResult {
  const daysMonth = Math.max(1, safeNum(productionDaysPerMonth, 19));
  const daysYear = Math.max(1, safeNum(productionDaysPerAnnum, daysMonth * 12));
  const mode: LaundryCapacityMode = capacityMode === 'sum' ? 'sum' : 'bottleneck';
  const unitText = (outputUnit || 'kg').trim() || 'kg';

  const rawResults = processes.map((proc) => {
    const workstreams = Math.max(0, safeNum(proc.numberOfWorkstreams, 0));
    const empPerLine = Math.max(0, safeNum(proc.employeesPerLine, 0));
    const shiftHrs = Math.max(0, safeNum(proc.shiftHours, 0));
    const shifts = Math.max(0, safeNum(proc.shiftsPerDay, 0));
    const kgPerCycle = Math.max(0, safeNum(proc.kgPerWashCycle, 0));
    const runMins = Math.max(0, safeNum(proc.cycleRunTimeMinutes, 0));
    const setupMins = Math.max(0, safeNum(proc.cycleSetupTimeMinutes, 0));

    // Excel R31: =E25*E28*24*E29
    const productionHoursPerDay = workstreams * shiftHrs * shifts;

    // Excel R35: =SUM(E33:E34)
    const cycleTotalTimeMinutes = runMins + setupMins;
    const cycleTotalTimeHours = cycleTotalTimeMinutes / 60;

    // Excel R36: =(E31/E35)/24
    const cyclesPerDay =
      cycleTotalTimeHours > 0 ? productionHoursPerDay / cycleTotalTimeHours : 0;

    // Excel R37: =E32*E36
    const outputPerDay = kgPerCycle * cyclesPerDay;

    // Excel R38: =F24*F37
    const outputPerMonth = Math.round(daysMonth * outputPerDay);
    const outputPerAnnum = Math.round(daysYear * outputPerDay);

    // Excel R39: =F25*F27*F29
    const employeesRequiredStandard = Math.round(workstreams * empPerLine * shifts);

    return {
      id: proc.id,
      name: proc.name || 'Laundry Process',
      productionHoursPerDay,
      kgPerWashCycle: kgPerCycle,
      cycleTotalTimeMinutes,
      cycleTotalTimeHours,
      cyclesPerDay,
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

  const computedProcesses: LaundryProcessResult[] = rawResults.map((p) => {
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

  let effectiveCyclesPerDay = 0;
  let effectiveHoursPerDay = 0;

  if (mode === 'sum') {
    effectiveCyclesPerDay = computedProcesses.reduce(
      (sum, p) => sum + p.cyclesPerDay,
      0
    );
    effectiveHoursPerDay = computedProcesses.reduce(
      (sum, p) => sum + p.productionHoursPerDay,
      0
    );
  } else {
    const primaryBottleneck = bottleneckList[0] || computedProcesses[0];
    effectiveCyclesPerDay = primaryBottleneck?.cyclesPerDay ?? 0;
    effectiveHoursPerDay = primaryBottleneck?.productionHoursPerDay ?? 0;
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
    effectiveCyclesPerDay,
    effectiveHoursPerDay,
    bottleneckProcessIds: bottleneckList.map((p) => p.id),
    bottleneckProcessNames: bottleneckList.map((p) => p.name),
    totalEmployeesStandard,
    productionDaysPerMonth: daysMonth,
    productionDaysPerAnnum: daysYear,
  };
}

/**
 * Adapter converting LaundryProductionSummaryResult into ProductionSummaryResult
 * so shared EmployeeCalculatorPanel, BillOfMaterialsPanel, ProductionVariableCostsPanel,
 * and UnitCostDynamicsPanel work natively with exact laundry.xlsx R52–R110 math:
 * - Excel R54 (BOM units required per day) = E37 (dailyOutputCapacity = 320 kg/day)
 *   -> bottleneckCyclesPerDay = dailyOutputCapacity (so qty / kg × 320 kg = daily material units required)
 * - Excel R75 (Variable costs batch quantity) = F54 (dailyOutputCapacity = 320 kg/day)
 *   -> bottleneckUnitsPerBatch = dailyOutputCapacity (so R100 / 320 kg = R0.3125/kg)
 */
function buildProductionBridge(
  laundry: LaundryProductionSummaryResult
): ProductionSummaryResult {
  return {
    processes: laundry.processes.map((p) => ({
      id: p.id,
      name: p.name,
      productionHoursPerDay: p.productionHoursPerDay,
      allocatedUnitsPerBatch: p.kgPerWashCycle,
      batchTotalTimeMinutes: p.cycleTotalTimeMinutes,
      batchTotalTimeHours: p.cycleTotalTimeHours,
      cyclesPerDay: p.cyclesPerDay,
      grossDailyUnits: p.outputPerDay,
      netDailyCapacity: p.outputPerDay,
      monthlyCapacity: p.outputPerMonth,
      annualCapacity: p.outputPerAnnum,
      employeesRequiredStandard: p.employeesRequiredStandard,
      isBottleneck: p.isBottleneck,
      spareDailyUnits: p.spareDailyOutput,
    })),
    bottleneckDailyCapacity: laundry.dailyOutputCapacity,
    bottleneckProcessIds: laundry.bottleneckProcessIds,
    bottleneckProcessNames: laundry.bottleneckProcessNames,
    bottleneckCyclesPerDay: laundry.dailyOutputCapacity,
    bottleneckUnitsPerBatch: laundry.dailyOutputCapacity,
    monthlyCapacity: laundry.monthlyOutputCapacity,
    annualCapacity: laundry.annualOutputCapacity,
    totalEmployeesStandard: laundry.totalEmployeesStandard,
    productionDaysPerMonth: laundry.productionDaysPerMonth,
    productionDaysPerAnnum: laundry.productionDaysPerAnnum,
  };
}

/**
 * FULL 6-CALCULATOR LAUNDRY ENGINE
 * 1. Production Calculator (multi-process wash/dry/press cycles & daily kg throughput)
 * 2. Employee Calculator (advisory only — zero impact on production)
 * 3. Bill of Materials (dynamic product costing per kg / output unit)
 * 4. Packaging Costs (multi-level hierarchy supporting 2+ levels)
 * 5. Production Variable Costs (direct utilities, energy, water & maintenance per daily batch or unit)
 * 6. Unit Cost Dynamics (consolidates materials + packaging + variable -> transfers to Results tab)
 */
export function calculateLaundryFull(
  config: LaundryProductConfig,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): LaundryFullResult {
  const laundryProduction = calculateLaundryProductionSummary(
    config.processes,
    config.capacityMode ?? 'bottleneck',
    productionDaysPerMonth,
    productionDaysPerAnnum,
    config.outputUnit || 'kg'
  );

  const productionBridge = buildProductionBridge(laundryProduction);

  // 2. Employee Calculator (Strictly advisory — zero impact on production!)
  const employees = calculateEmployeeIndicator(
    config.employeeAssumptions,
    productionBridge
  );

  // 3. Bill of Materials (Excel R52–R65)
  const bom = calculateBillOfMaterials(config.bomComponents, productionBridge);

  // 4. Packaging Costs (Multi-level, Excel R66–R73+)
  const packaging = calculatePackagingCosts(config.packagingLevels);

  // 5. Production Variable Costs (Excel R74–R95)
  const variableCosts = calculateProductionVariableCosts(
    config.variableCosts,
    productionBridge,
    config.dynamicsOverrides?.referenceBatchSizeOverride
  );

  // 6. Unit Cost Dynamics (Excel R101–R110)
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
    dailyCapacity: laundryProduction.dailyOutputCapacity,
    monthlyCapacity: laundryProduction.monthlyOutputCapacity,
    employeesIndicated: employees.employeesAdjusted,
  };

  return {
    laundryProduction,
    productionBridge,
    employees,
    bom,
    packaging,
    variableCosts,
    dynamics,
  };
}

/**
 * Default starter configuration modelled directly on laundry.xlsx:
 * - Production: 4 machines/workstreams, 1 emp/line, 8h shift, 1 shift/day, 10 kg/cycle, 55m run + 5m setup = 60m -> 32 cycles/day -> 320 kg/day, 4 std employees
 * - Employee Calculator: 8 hrs/day, 100% efficiency, 0% tolerance -> 4 std, 0 relief, 4 adjusted
 * - BOM: Detergent & Wash Chemicals (1 unit/kg, divider 1, pack size 1, pack cost R1, consumables 0, surplus wasted Yes) -> R1.00/kg
 * - Packaging: empty by default (R0.00, supports 2+ dynamic levels)
 * - Production Variable Costs: Electricity (10 kW × R10 = R100 / 320 kg = R0.3125/kg) + Gas/Fuel/Water/Maintenance (0) -> R0.3125/kg
 * - Total Modeled Unit Cost: R1.00 + R0.00 + R0.3125 = R1.3125/kg
 */
export function createDefaultLaundryConfig(): LaundryProductConfig {
  return {
    outputUnit: 'kg',
    processes: [
      {
        id: 'laundry-proc-1',
        name: 'Washing Machine Line A',
        numberOfWorkstreams: 4,
        employeesPerLine: 1,
        shiftHours: 8,
        shiftsPerDay: 1,
        kgPerWashCycle: 10,
        cycleRunTimeMinutes: 55,
        cycleSetupTimeMinutes: 5,
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
        id: 'laundry-bom-1',
        name: 'Detergent & Wash Chemicals',
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
        id: 'laundry-var-elec',
        name: 'Electricity',
        basis: 'per_batch',
        usage: 10,
        usageUnit: 'kW',
        unitRate: 10,
      },
      {
        id: 'laundry-var-gas',
        name: 'Gas',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'kg',
        unitRate: 0,
      },
      {
        id: 'laundry-var-fuel',
        name: 'Fuel',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'L',
        unitRate: 0,
      },
      {
        id: 'laundry-var-water',
        name: 'Water',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'kL',
        unitRate: 0,
      },
      {
        id: 'laundry-var-maint',
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
