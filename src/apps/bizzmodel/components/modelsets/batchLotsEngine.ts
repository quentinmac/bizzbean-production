import {
  BatchLotsFullResult,
  BatchLotsProductConfig,
  BomComponent,
  BomComponentResult,
  BomSummaryResult,
  EmployeeCalcAssumptions,
  EmployeeCalcResult,
  PackagingLevel,
  PackagingLevelResult,
  PackagingSummaryResult,
  ProcessResult,
  ProductionProcess,
  ProductionSummaryResult,
  ProductionVariableCostItem,
  UnitCostDynamicsOverrides,
  UnitCostDynamicsResult,
  VariableCostItemResult,
  VariableCostSummaryResult,
} from './modelSetTypes';

const safeNum = (val: unknown, fallback = 0): number => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

export function formatMinutesAsHHMM(totalMinutes: number): string {
  const mins = Math.max(0, Math.round(safeNum(totalMinutes, 0)));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatHoursAsHHMM(hours: number): string {
  return formatMinutesAsHHMM(safeNum(hours, 0) * 60);
}

/**
 * 1. PRODUCTION CALCULATOR (Multi-Process with Bottleneck Constraint)
 * Faithful to production calculator.xlsx (R24-R44) & production constraint.PNG:
 * "Produce as much as the slowest process" -> Daily Capacity = MIN(active processes)
 */
export function calculateProductionSummary(
  processes: ProductionProcess[],
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): ProductionSummaryResult {
  const daysMonth = Math.max(1, safeNum(productionDaysPerMonth, 21));
  const daysYear = Math.max(1, safeNum(productionDaysPerAnnum, daysMonth * 12));

  const rawResults = processes.map((proc) => {
    const lines = Math.max(0, safeNum(proc.numberOfLines, 0));
    const empPerLine = Math.max(0, safeNum(proc.employeesPerLine, 0));
    const shiftHrs = Math.max(0, safeNum(proc.shiftHours, 0));
    const shifts = Math.max(0, safeNum(proc.shiftsPerDay, 0));
    const allocPct = safeNum(proc.timeAllocationPct, 100);
    const unitsPerBatch = Math.max(0, safeNum(proc.unitsPerBatch, 0));
    const runMins = Math.max(0, safeNum(proc.batchRunTimeMinutes, 0));
    const setupMins = Math.max(0, safeNum(proc.batchSetupTimeMinutes, 0));
    const shrinkagePct = Math.min(100, Math.max(0, safeNum(proc.shrinkagePct, 0)));

    // Excel R32: =F26*F29*24*F30
    const productionHoursPerDay = lines * shiftHrs * shifts;

    // Excel R35: =IF(F34=0, F33*100%, F33*F34)
    const effectiveAllocFactor = allocPct <= 0 ? 1 : allocPct / 100;
    const allocatedUnitsPerBatch = unitsPerBatch * effectiveAllocFactor;

    // Excel R38: =SUM(F36:F37)
    const batchTotalTimeMinutes = runMins + setupMins;
    const batchTotalTimeHours = batchTotalTimeMinutes / 60;

    // Excel R39: =IFERROR(IF(F38=0, F32, (F32/F38/24)), 0)
    const cyclesPerDay =
      batchTotalTimeHours <= 0
        ? productionHoursPerDay
        : productionHoursPerDay / batchTotalTimeHours;

    // Excel R40: =F35*F39
    const grossDailyUnits = allocatedUnitsPerBatch * cyclesPerDay;

    // Excel R42: =IF(F41=0, ROUNDDOWN(F40,0), ROUNDDOWN(F40-(F40*F41),0))
    const netDailyCapacity =
      shrinkagePct === 0
        ? Math.floor(grossDailyUnits)
        : Math.floor(grossDailyUnits - grossDailyUnits * (shrinkagePct / 100));

    // Excel R43: =F25*F42
    const monthlyCapacity = Math.round(daysMonth * netDailyCapacity);
    const annualCapacity = Math.round(daysYear * netDailyCapacity);

    // Excel R44: =F26*F28*F30
    const employeesRequiredStandard = Math.round(lines * empPerLine * shifts);

    return {
      id: proc.id,
      name: proc.name || 'Process',
      productionHoursPerDay,
      allocatedUnitsPerBatch,
      batchTotalTimeMinutes,
      batchTotalTimeHours,
      cyclesPerDay,
      grossDailyUnits,
      netDailyCapacity,
      monthlyCapacity,
      annualCapacity,
      employeesRequiredStandard,
    };
  });

  // Bottleneck constraint: slowest active process determines product daily capacity
  const activeProcesses = rawResults.filter((p) => p.netDailyCapacity > 0);
  const bottleneckDailyCapacity =
    activeProcesses.length > 0
      ? Math.min(...activeProcesses.map((p) => p.netDailyCapacity))
      : 0;

  const computedProcesses: ProcessResult[] = rawResults.map((p) => {
    const isBottleneck =
      activeProcesses.length > 0 && p.netDailyCapacity === bottleneckDailyCapacity;
    const spareDailyUnits = Math.max(0, p.netDailyCapacity - bottleneckDailyCapacity);
    return {
      ...p,
      isBottleneck,
      spareDailyUnits,
    };
  });

  const bottleneckList = computedProcesses.filter((p) => p.isBottleneck);
  const primaryBottleneck = bottleneckList[0] || computedProcesses[0];

  const totalEmployeesStandard = computedProcesses.reduce(
    (sum, p) => sum + p.employeesRequiredStandard,
    0
  );

  return {
    processes: computedProcesses,
    bottleneckDailyCapacity,
    bottleneckProcessIds: bottleneckList.map((p) => p.id),
    bottleneckProcessNames: bottleneckList.map((p) => p.name),
    bottleneckCyclesPerDay: primaryBottleneck?.cyclesPerDay ?? 0,
    bottleneckUnitsPerBatch: primaryBottleneck?.allocatedUnitsPerBatch ?? 0,
    monthlyCapacity: Math.round(bottleneckDailyCapacity * daysMonth),
    annualCapacity: Math.round(bottleneckDailyCapacity * daysYear),
    totalEmployeesStandard,
    productionDaysPerMonth: daysMonth,
    productionDaysPerAnnum: daysYear,
  };
}

/**
 * 2. EMPLOYEE CALCULATOR (Informational Only — Zero Impact on Production!)
 * Faithful to production calculator.xlsx (R45-R56)
 */
export function calculateEmployeeIndicator(
  assumptions: EmployeeCalcAssumptions,
  production: ProductionSummaryResult
): EmployeeCalcResult {
  const productionDays = production.productionDaysPerMonth;
  const hoursPaidPerDay = Math.max(0, safeNum(assumptions.hoursPaidPerDay, 8));
  const labourEfficiencyPct = Math.min(100, Math.max(0, safeNum(assumptions.labourEfficiencyPct, 100)));
  const tolerancePct = Math.max(0, safeNum(assumptions.tolerancePct, 0));
  const employeesStandard = production.totalEmployeesStandard;

  // Excel R48: =F46*F47*24 (per employee)
  const hoursBoughtPerEmployee = productionDays * hoursPaidPerDay;
  const totalHoursBought = hoursBoughtPerEmployee * employeesStandard;

  // Excel R50: =IF(F49=0, F48, F48*F49)
  const hoursForSale =
    labourEfficiencyPct === 0
      ? totalHoursBought
      : totalHoursBought * (labourEfficiencyPct / 100);

  // Excel R51: =F48
  const hoursRequired = totalHoursBought;

  // Excel R52 & R53: variance = hoursForSale - hoursRequired; variancePct = -variance / hoursRequired
  const varianceHours = hoursForSale - hoursRequired;
  const variancePct =
    hoursRequired > 0 ? (-varianceHours / hoursRequired) * 100 : 0;

  // Excel R55: =IFERROR(IF(F53<F54, 0, ROUNDUP(-F52/hoursBoughtPerEmployee, 0)), 0)
  const employeesAdditional =
    hoursBoughtPerEmployee > 0 && variancePct > 0 && variancePct >= tolerancePct
      ? Math.ceil(-varianceHours / hoursBoughtPerEmployee)
      : 0;

  // Excel R56: =F44+F55
  const employeesAdjusted = employeesStandard + employeesAdditional;

  return {
    productionDays,
    hoursPaidPerDay,
    hoursBoughtPerEmployee,
    totalHoursBought,
    labourEfficiencyPct,
    hoursForSale,
    hoursRequired,
    varianceHours,
    variancePct,
    tolerancePct,
    employeesStandard,
    employeesAdditional,
    employeesAdjusted,
  };
}

/**
 * 3. BILL OF MATERIALS (Dynamic Product Costing Calculator)
 * Faithful to production calculator.xlsx (R57-R72) with full pack rounding,
 * unit divider conversion, batch consumables, and surplus-waste absorption.
 */
export function calculateBillOfMaterials(
  components: BomComponent[],
  production: ProductionSummaryResult
): BomSummaryResult {
  const cyclesPerDay = Math.max(0, production.bottleneckCyclesPerDay);
  const dailyOutputUnits = Math.max(0, production.bottleneckDailyCapacity);

  const items: BomComponentResult[] = components.map((comp) => {
    const qtyPerBatch = Math.max(0, safeNum(comp.unitsRequiredPerBatch, 0));
    const divider = Math.max(0.0001, safeNum(comp.unitDivider, 1));
    const packSize = Math.max(0, safeNum(comp.packSizeUnits, 0));
    const packCost = Math.max(0, safeNum(comp.packCost, 0));
    const consumablesPerBatch = Math.max(0, safeNum(comp.batchConsumablesCost, 0));

    // Excel R61: =F59*F60
    const dailyUnitsRequired = cyclesPerDay * qtyPerBatch;

    // Effective pack size in batch units = packSize * divider
    const effectivePackCapacityInBatchUnits = packSize * divider;

    // Excel R64: =IFERROR(ROUNDUP((F61/F62)/((F63*F62)/F62),0),0)
    const packsRequiredPerDay =
      effectivePackCapacityInBatchUnits > 0 && dailyUnitsRequired > 0
        ? Math.ceil(dailyUnitsRequired / effectivePackCapacityInBatchUnits)
        : 0;

    // Excel R66-R70
    const dailyPurchaseCost = packsRequiredPerDay * packCost;
    const dailyConsumablesCost = cyclesPerDay * consumablesPerBatch;
    const dailyTotalCost = dailyPurchaseCost + dailyConsumablesCost;
    const quantityAvailable = effectivePackCapacityInBatchUnits * packsRequiredPerDay;
    const surplusQuantity = Math.max(0, quantityAvailable - dailyUnitsRequired);

    // If surplus is wasted, full purchased packs are absorbed by today's output.
    // If surplus is NOT wasted, unused material carries over to inventory, so only the consumed fraction is charged.
    const consumedFraction =
      quantityAvailable > 0 ? Math.min(1, dailyUnitsRequired / quantityAvailable) : 0;
    const effectiveDailyCost = comp.surplusWasted
      ? dailyTotalCost
      : dailyPurchaseCost * consumedFraction + dailyConsumablesCost;

    const unitCost = dailyOutputUnits > 0 ? effectiveDailyCost / dailyOutputUnits : 0;
    const batchCost = cyclesPerDay > 0 ? effectiveDailyCost / cyclesPerDay : 0;

    return {
      id: comp.id,
      name: comp.name || 'Material',
      unitOfMeasure: comp.unitOfMeasure || 'units',
      cyclesPerDay,
      dailyUnitsRequired,
      packsRequiredPerDay,
      dailyPurchaseCost,
      dailyConsumablesCost,
      dailyTotalCost,
      effectiveDailyCost,
      quantityAvailable,
      surplusQuantity,
      surplusWasted: comp.surplusWasted,
      unitCost,
      batchCost,
    };
  });

  const totalDailyMaterialsCost = items.reduce((s, i) => s + i.effectiveDailyCost, 0);
  const totalBatchMaterialsCost = items.reduce((s, i) => s + i.batchCost, 0);
  const totalMaterialsUnitCost = items.reduce((s, i) => s + i.unitCost, 0);

  return {
    items,
    totalDailyMaterialsCost,
    totalBatchMaterialsCost,
    totalMaterialsUnitCost,
  };
}

/**
 * 4. PACKAGING COSTS (Multi-Level Hierarchy: Supports 1, 2, 3, 4+ Dynamic Levels)
 * Extends production calculator.xlsx (R73-R80) to arbitrary N cascading levels:
 * Level 1 (Primary) -> Level 2 (Inner/Case) -> Level 3 (Outer Carton) -> Level 4 (Pallet) -> ...
 */
export function calculatePackagingCosts(levels: PackagingLevel[]): PackagingSummaryResult {
  let cumulativeUnits = 1;
  const computedLevels: PackagingLevelResult[] = levels.map((lvl, idx) => {
    const contains = Math.max(1, safeNum(lvl.containsCount, 1));
    cumulativeUnits = idx === 0 ? contains : cumulativeUnits * contains;

    const rawCost = Math.max(0, safeNum(lvl.componentCost, 0));
    const wastePct = Math.min(100, Math.max(0, safeNum(lvl.wastePct, 0)));
    const effectiveComponentCost = rawCost * (1 + wastePct / 100);
    const unitCostContribution =
      cumulativeUnits > 0 ? effectiveComponentCost / cumulativeUnits : 0;

    return {
      id: lvl.id,
      levelNumber: idx + 1,
      name: lvl.name || `Level ${idx + 1} Packaging`,
      containsCount: contains,
      cumulativeUnitsPacked: cumulativeUnits,
      componentCost: rawCost,
      wastePct,
      effectiveComponentCost,
      unitCostContribution,
    };
  });

  const topLevelUnitsPacked =
    computedLevels.length > 0
      ? computedLevels[computedLevels.length - 1].cumulativeUnitsPacked
      : 0;

  const totalPackagingUnitCost = computedLevels.reduce(
    (sum, l) => sum + l.unitCostContribution,
    0
  );

  const totalTopLevelPackCost = totalPackagingUnitCost * topLevelUnitsPacked;

  return {
    levels: computedLevels,
    topLevelUnitsPacked,
    totalTopLevelPackCost,
    totalPackagingUnitCost,
  };
}

/**
 * 5. PRODUCTION VARIABLE COSTS
 * Faithful to production calculator.xlsx (R81-R103) + custom variable cost items
 * (per-batch utilities/maintenance or direct per-unit variable charges).
 */
export function calculateProductionVariableCosts(
  items: ProductionVariableCostItem[],
  production: ProductionSummaryResult,
  referenceBatchSizeOverride?: number
): VariableCostSummaryResult {
  const fallbackBatch = Math.max(1, production.bottleneckUnitsPerBatch || 100);
  const referenceBatchUnits =
    referenceBatchSizeOverride && referenceBatchSizeOverride > 0
      ? referenceBatchSizeOverride
      : fallbackBatch;

  const computedItems: VariableCostItemResult[] = items.map((item) => {
    const usage = Math.max(0, safeNum(item.usage, 0));
    const rate = Math.max(0, safeNum(item.unitRate, 0));

    if (item.basis === 'per_unit') {
      const unitCost = usage * rate;
      const batchCost = unitCost * referenceBatchUnits;
      return {
        id: item.id,
        name: item.name || 'Variable Cost',
        basis: item.basis,
        usage,
        usageUnit: item.usageUnit || 'unit',
        unitRate: rate,
        batchCost,
        unitCost,
      };
    }

    // Default: per_batch (Excel R84-R103)
    const batchCost = usage * rate;
    const unitCost = referenceBatchUnits > 0 ? batchCost / referenceBatchUnits : 0;
    return {
      id: item.id,
      name: item.name || 'Variable Cost',
      basis: item.basis,
      usage,
      usageUnit: item.usageUnit || 'batch',
      unitRate: rate,
      batchCost,
      unitCost,
    };
  });

  const totalBatchVariableCost = computedItems.reduce((s, i) => s + i.batchCost, 0);
  const totalVariableUnitCost = computedItems.reduce((s, i) => s + i.unitCost, 0);

  return {
    referenceBatchUnits,
    items: computedItems,
    totalBatchVariableCost,
    totalVariableUnitCost,
  };
}

/**
 * 6. UNIT COSTS DYNAMICS (Summary & Transfer to Results Tab)
 * Faithful to production calculator.xlsx (R111-R120)
 */
export function calculateBatchLotsFull(
  config: BatchLotsProductConfig,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): BatchLotsFullResult {
  const production = calculateProductionSummary(
    config.processes,
    productionDaysPerMonth,
    productionDaysPerAnnum
  );
  const employees = calculateEmployeeIndicator(config.employeeAssumptions, production);
  const bom = calculateBillOfMaterials(config.bomComponents, production);
  const packaging = calculatePackagingCosts(config.packagingLevels);
  const variableCosts = calculateProductionVariableCosts(
    config.variableCosts,
    production,
    config.dynamicsOverrides?.referenceBatchSizeOverride
  );

  const materialsUnitCost = bom.totalMaterialsUnitCost;
  const packagingUnitCost = packaging.totalPackagingUnitCost;
  const productionVariableUnitCost = variableCosts.totalVariableUnitCost;

  // Excel R117: =F112+F114+F116
  const calculatedUnitCost =
    materialsUnitCost + packagingUnitCost + productionVariableUnitCost;

  const estimatedUnitCost = Math.max(
    0,
    safeNum(config.dynamicsOverrides?.estimatedUnitCost, 0)
  );

  // Excel R120: =IF(F118=0, F117, F118)
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
    dailyCapacity: production.bottleneckDailyCapacity,
    monthlyCapacity: production.monthlyCapacity,
    employeesIndicated: employees.employeesAdjusted,
  };

  return {
    production,
    employees,
    bom,
    packaging,
    variableCosts,
    dynamics,
  };
}

/**
 * Default starter configuration modelled directly on production constraint.PNG
 * (3 processes A/B/C with bottleneck = 800 units/day & 4 standard employees)
 * and production calculator.xlsx (BOM, 3-level packaging, 5 variable cost streams).
 */
export function createDefaultBatchLotsConfig(): BatchLotsProductConfig {
  return {
    processes: [
      {
        id: 'proc-a',
        name: 'Process A',
        numberOfLines: 1,
        employeesPerLine: 1,
        shiftHours: 8,
        shiftsPerDay: 1,
        timeAllocationPct: 100,
        unitsPerBatch: 100,
        batchRunTimeMinutes: 55,
        batchSetupTimeMinutes: 5,
        shrinkagePct: 0,
      },
      {
        id: 'proc-b',
        name: 'Process B',
        numberOfLines: 1,
        employeesPerLine: 1,
        shiftHours: 8,
        shiftsPerDay: 1,
        timeAllocationPct: 100,
        unitsPerBatch: 200,
        batchRunTimeMinutes: 110,
        batchSetupTimeMinutes: 10,
        shrinkagePct: 0,
      },
      {
        id: 'proc-c',
        name: 'Process C',
        numberOfLines: 2,
        employeesPerLine: 1,
        shiftHours: 8,
        shiftsPerDay: 1,
        timeAllocationPct: 100,
        unitsPerBatch: 200,
        batchRunTimeMinutes: 170,
        batchSetupTimeMinutes: 10,
        shrinkagePct: 0,
      },
    ],
    employeeAssumptions: {
      hoursPaidPerDay: 8,
      labourEfficiencyPct: 85,
      tolerancePct: 5,
    },
    bomComponents: [
      {
        id: 'bom-1',
        name: 'Base Raw Material',
        unitOfMeasure: 'kg',
        unitsRequiredPerBatch: 25,
        unitDivider: 1,
        packSizeUnits: 50,
        packCost: 900,
        batchConsumablesCost: 15,
        surplusWasted: false,
      },
      {
        id: 'bom-2',
        name: 'Active Compound',
        unitOfMeasure: 'L',
        unitsRequiredPerBatch: 8,
        unitDivider: 1,
        packSizeUnits: 20,
        packCost: 480,
        batchConsumablesCost: 10,
        surplusWasted: true,
      },
      {
        id: 'bom-3',
        name: 'Finishing Additive',
        unitOfMeasure: 'kg',
        unitsRequiredPerBatch: 4,
        unitDivider: 1,
        packSizeUnits: 10,
        packCost: 320,
        batchConsumablesCost: 5,
        surplusWasted: false,
      },
    ],
    packagingLevels: [
      {
        id: 'pkg-1',
        name: 'Primary Unit Pack',
        containsCount: 1,
        componentCost: 1.25,
        wastePct: 0,
      },
      {
        id: 'pkg-2',
        name: 'Secondary Inner Case',
        containsCount: 6,
        componentCost: 3.60,
        wastePct: 0,
      },
      {
        id: 'pkg-3',
        name: 'Tertiary Outer Carton',
        containsCount: 4,
        componentCost: 12.00,
        wastePct: 0,
      },
    ],
    variableCosts: [
      {
        id: 'var-elec',
        name: 'Electricity',
        basis: 'per_batch',
        usage: 12,
        usageUnit: 'kWh',
        unitRate: 3.50,
      },
      {
        id: 'var-gas',
        name: 'Gas',
        basis: 'per_batch',
        usage: 4,
        usageUnit: 'kg',
        unitRate: 11.00,
      },
      {
        id: 'var-fuel',
        name: 'Fuel',
        basis: 'per_batch',
        usage: 2,
        usageUnit: 'litres',
        unitRate: 22.00,
      },
      {
        id: 'var-water',
        name: 'Water',
        basis: 'per_batch',
        usage: 0.5,
        usageUnit: 'kL',
        unitRate: 24.00,
      },
      {
        id: 'var-maint',
        name: 'Maintenance',
        basis: 'per_batch',
        usage: 1,
        usageUnit: 'batch',
        unitRate: 18.00,
      },
    ],
    dynamicsOverrides: {
      estimatedUnitCost: 0,
      referenceBatchSizeOverride: 0,
    },
  };
}
