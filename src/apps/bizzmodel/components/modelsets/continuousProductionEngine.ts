import {
  BomComponentResult,
  BomSummaryResult,
  ContinuousBomComponent,
  ContinuousProcessResult,
  ContinuousProductionFullResult,
  ContinuousProductionProcess,
  ContinuousProductionProductConfig,
  ContinuousProductionSummaryResult,
  ProductionSummaryResult,
  ProductionVariableCostItem,
  UnitCostDynamicsResult,
  VariableCostItemResult,
  VariableCostSummaryResult,
} from './modelSetTypes';
import {
  calculateEmployeeIndicator,
  calculatePackagingCosts,
} from './batchLotsEngine';

const safeNum = (val: unknown, fallback = 0): number => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Smart unit cost formatter: preserves 2 decimals for standard unit costs (>= 1)
 * and displays 4 decimals for high-volume sub-unit costs (e.g. 0.0408 or 0.0050).
 */
export function formatUnitCostValue(val: number): string {
  const n = safeNum(val, 0);
  if (Math.abs(n) > 0 && Math.abs(n) < 1) {
    return n.toFixed(4);
  }
  return n.toFixed(2);
}

/**
 * 1. CONTINUOUS PRODUCTION CALCULATOR (Multi-Process with Bottleneck Constraint)
 * Faithful to continuous production.xlsx (R22-R40):
 * - hoursAvailablePerDay = numberOfWorkstreams * shiftHours * shiftsPerDay (R32)
 * - allocatedUnitsPerHour = IF(timeAllocationPct=0, unitCapacityPerHour, unitCapacityPerHour * timeAllocationPct/100) (R35)
 * - grossDailyUnits = allocatedUnitsPerHour * hoursAvailablePerDay (R36)
 * - netDailyCapacity = floor(grossDailyUnits * (1 - shrinkagePct/100)) (R38)
 * - monthlyCapacity = productionDaysPerMonth * netDailyCapacity (R39)
 * - employeesRequiredStandard = numberOfWorkstreams * employeesPerWorkstream * shiftsPerDay (R40)
 * Bottleneck rule: slowest active process governs product daily capacity.
 */
export function calculateContinuousProductionSummary(
  processes: ContinuousProductionProcess[],
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): ContinuousProductionSummaryResult {
  const daysMonth = Math.max(1, safeNum(productionDaysPerMonth, 21));
  const daysYear = Math.max(1, safeNum(productionDaysPerAnnum, daysMonth * 12));

  const rawResults = (processes || []).map((proc) => {
    const workstreams = Math.max(0, safeNum(proc.numberOfWorkstreams, 0));
    const empPerWorkstream = Math.max(0, safeNum(proc.employeesPerWorkstream, 0));
    const shiftHrs = Math.max(0, safeNum(proc.shiftHours, 0));
    const shifts = Math.max(0, safeNum(proc.shiftsPerDay, 0));
    const unitCapacityPerHour = Math.max(0, safeNum(proc.unitCapacityPerHour, 0));
    const allocPct = safeNum(proc.timeAllocationPct, 100);
    const shrinkagePct = Math.min(100, Math.max(0, safeNum(proc.shrinkagePct, 0)));

    // Excel R32: =F26*F29*24*F30
    const hoursAvailablePerDay = workstreams * shiftHrs * shifts;

    // Excel R35: =IF(F34=0, F33*100%, F33*F34)
    const effectiveAllocFactor = allocPct <= 0 ? 1 : allocPct / 100;
    const allocatedUnitsPerHour = unitCapacityPerHour * effectiveAllocFactor;

    // Excel R36: =F35*F32
    const grossDailyUnits = allocatedUnitsPerHour * hoursAvailablePerDay;

    // Excel R38: =IF(F37=0, ROUNDDOWN(F36,0), ROUNDDOWN(F36-(F36*F37),0))
    const netDailyCapacity =
      shrinkagePct === 0
        ? Math.floor(grossDailyUnits)
        : Math.floor(grossDailyUnits - grossDailyUnits * (shrinkagePct / 100));

    // Excel R39: =F25*F38
    const monthlyCapacity = Math.round(daysMonth * netDailyCapacity);
    const annualCapacity = Math.round(daysYear * netDailyCapacity);

    // Excel R40: =F26*F28*F30
    const employeesRequiredStandard = Math.round(workstreams * empPerWorkstream * shifts);

    return {
      id: proc.id,
      name: proc.name || 'Workstream',
      hoursAvailablePerDay,
      allocatedUnitsPerHour,
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

  const computedProcesses: ContinuousProcessResult[] = rawResults.map((p) => {
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
    bottleneckGrossDailyUnits: primaryBottleneck?.grossDailyUnits ?? 0,
    bottleneckHoursPerDay: primaryBottleneck?.hoursAvailablePerDay ?? 0,
    bottleneckUnitsPerHour: primaryBottleneck?.allocatedUnitsPerHour ?? 0,
    bottleneckProcessIds: bottleneckList.map((p) => p.id),
    bottleneckProcessNames: bottleneckList.map((p) => p.name),
    monthlyCapacity: Math.round(bottleneckDailyCapacity * daysMonth),
    annualCapacity: Math.round(bottleneckDailyCapacity * daysYear),
    totalEmployeesStandard,
    productionDaysPerMonth: daysMonth,
    productionDaysPerAnnum: daysYear,
  };
}

/**
 * 3. CONTINUOUS PRODUCTION BILL OF MATERIALS (Excel R53-R69)
 * Driven by units required per finished item × daily items produced,
 * with hourly consumables (consumablesCostPerHour × hoursAvailablePerDay),
 * pack rounding, and surplus-waste absorption.
 */
export function calculateContinuousBillOfMaterials(
  components: ContinuousBomComponent[],
  production: ContinuousProductionSummaryResult
): BomSummaryResult {
  const hoursPerDay = Math.max(0, production.bottleneckHoursPerDay);
  // Daily gross items processed through the line consume raw material (Excel R56 = E36)
  const grossItemsPerDay = Math.max(0, production.bottleneckGrossDailyUnits);
  // Sellable net output absorbs daily material cost (accounts for shrinkage loss accurately)
  const netOutputUnitsPerDay = Math.max(0, production.bottleneckDailyCapacity);

  const items: BomComponentResult[] = (components || []).map((comp) => {
    const qtyPerItem = Math.max(0, safeNum(comp.unitsRequiredPerItem, 0));
    const divider = Math.max(0.0001, safeNum(comp.unitDivider, 1));
    const packSize = Math.max(0, safeNum(comp.packSizeUnits, 0));
    const packCost = Math.max(0, safeNum(comp.packCost, 0));
    const consumablesPerHour = Math.max(0, safeNum(comp.consumablesCostPerHour, 0));

    // Total raw material required for the day's continuous production run (in component units)
    const dailyUnitsRequired = grossItemsPerDay * qtyPerItem;

    // Effective pack capacity expressed in component units
    const effectivePackCapacity = packSize * divider;

    // Full purchase packs required per day
    const packsRequiredPerDay =
      effectivePackCapacity > 0 && dailyUnitsRequired > 0
        ? Math.ceil(dailyUnitsRequired / effectivePackCapacity)
        : 0;

    // Daily purchase cost & hourly consumables cost (Excel R64: =F32*F63)
    const dailyPurchaseCost = packsRequiredPerDay * packCost;
    const dailyConsumablesCost = hoursPerDay * consumablesPerHour;
    const dailyTotalCost = dailyPurchaseCost + dailyConsumablesCost;

    const quantityAvailable = effectivePackCapacity * packsRequiredPerDay;
    const surplusQuantity = Math.max(0, quantityAvailable - dailyUnitsRequired);

    // Excel R68-R69: If surplus is wasted, full purchase packs are absorbed; otherwise surplus carries to inventory
    const consumedFraction =
      quantityAvailable > 0 ? Math.min(1, dailyUnitsRequired / quantityAvailable) : 0;
    const effectiveDailyCost = comp.surplusWasted
      ? dailyTotalCost
      : dailyPurchaseCost * consumedFraction + dailyConsumablesCost;

    const unitCost =
      netOutputUnitsPerDay > 0 ? effectiveDailyCost / netOutputUnitsPerDay : 0;
    const hourlyCost = hoursPerDay > 0 ? effectiveDailyCost / hoursPerDay : 0;

    return {
      id: comp.id,
      name: comp.name || 'Material',
      unitOfMeasure: comp.unitOfMeasure || 'units',
      cyclesPerDay: hoursPerDay, // Operating hours/day in continuous mode
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
      batchCost: hourlyCost, // Hourly cost readout in continuous mode
    };
  });

  const totalDailyMaterialsCost = items.reduce((s, i) => s + i.effectiveDailyCost, 0);
  const totalBatchMaterialsCost = items.reduce((s, i) => s + i.batchCost, 0); // Total hourly materials cost
  const totalMaterialsUnitCost = items.reduce((s, i) => s + i.unitCost, 0);

  return {
    items,
    totalDailyMaterialsCost,
    totalBatchMaterialsCost,
    totalMaterialsUnitCost,
  };
}

/**
 * 5. CONTINUOUS PRODUCTION VARIABLE COSTS (Excel R78-R100)
 * Supports:
 * - 'per_day' (or legacy 'per_batch'): daily run usage × rate ÷ reference daily run quantity (Excel R80-R100)
 * - 'per_hour': hourly usage × rate × daily operating hours ÷ reference daily run quantity
 * - 'per_unit': direct per finished unit charge
 */
export function calculateContinuousVariableCosts(
  items: ProductionVariableCostItem[],
  production: ContinuousProductionSummaryResult,
  referenceDailyQtyOverride?: number
): VariableCostSummaryResult {
  // Excel R80: =E56 (gross daily production quantity of constraining process)
  const fallbackDailyQty = Math.max(
    1,
    production.bottleneckGrossDailyUnits || production.bottleneckDailyCapacity || 1000
  );
  const referenceBatchUnits =
    referenceDailyQtyOverride && referenceDailyQtyOverride > 0
      ? referenceDailyQtyOverride
      : fallbackDailyQty;
  const hoursPerDay = Math.max(0, production.bottleneckHoursPerDay);

  const computedItems: VariableCostItemResult[] = (items || []).map((item) => {
    const usage = Math.max(0, safeNum(item.usage, 0));
    const rate = Math.max(0, safeNum(item.unitRate, 0));

    if (item.basis === 'per_unit') {
      const unitCost = usage * rate;
      const dailyCost = unitCost * referenceBatchUnits;
      return {
        id: item.id,
        name: item.name || 'Variable Cost',
        basis: item.basis,
        usage,
        usageUnit: item.usageUnit || 'unit',
        unitRate: rate,
        batchCost: dailyCost,
        unitCost,
      };
    }

    if (item.basis === 'per_hour') {
      const hourlyCost = usage * rate;
      const dailyCost = hourlyCost * hoursPerDay;
      const unitCost = referenceBatchUnits > 0 ? dailyCost / referenceBatchUnits : 0;
      return {
        id: item.id,
        name: item.name || 'Variable Cost',
        basis: item.basis,
        usage,
        usageUnit: item.usageUnit || 'hr',
        unitRate: rate,
        batchCost: dailyCost,
        unitCost,
      };
    }

    // Default: 'per_day' (or 'per_batch' mapped to daily run, matching Excel R80-R100)
    const dailyCost = usage * rate;
    const unitCost = referenceBatchUnits > 0 ? dailyCost / referenceBatchUnits : 0;
    return {
      id: item.id,
      name: item.name || 'Variable Cost',
      basis: item.basis,
      usage,
      usageUnit: item.usageUnit || 'day',
      unitRate: rate,
      batchCost: dailyCost,
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
 * 6. FULL MANUFACTURING — CONTINUOUS PRODUCTION ENGINE
 * Combines all 6 calculators and emits live dynamics transferred to the Results tab.
 */
export function calculateContinuousProductionFull(
  config: ContinuousProductionProductConfig,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): ContinuousProductionFullResult {
  const continuousProduction = calculateContinuousProductionSummary(
    config.processes,
    productionDaysPerMonth,
    productionDaysPerAnnum
  );

  // Bridge summary so shared EmployeeCalculatorPanel, ProductionVariableCostsPanel & UnitCostDynamicsPanel work seamlessly
  const productionBridge: ProductionSummaryResult = {
    processes: continuousProduction.processes.map((p) => ({
      id: p.id,
      name: p.name,
      productionHoursPerDay: p.hoursAvailablePerDay,
      allocatedUnitsPerBatch: p.grossDailyUnits,
      batchTotalTimeMinutes: 60,
      batchTotalTimeHours: 1,
      cyclesPerDay: p.hoursAvailablePerDay,
      grossDailyUnits: p.grossDailyUnits,
      netDailyCapacity: p.netDailyCapacity,
      monthlyCapacity: p.monthlyCapacity,
      annualCapacity: p.annualCapacity,
      employeesRequiredStandard: p.employeesRequiredStandard,
      isBottleneck: p.isBottleneck,
      spareDailyUnits: p.spareDailyUnits,
    })),
    bottleneckDailyCapacity: continuousProduction.bottleneckDailyCapacity,
    bottleneckProcessIds: continuousProduction.bottleneckProcessIds,
    bottleneckProcessNames: continuousProduction.bottleneckProcessNames,
    bottleneckCyclesPerDay: continuousProduction.bottleneckHoursPerDay,
    bottleneckUnitsPerBatch: continuousProduction.bottleneckGrossDailyUnits,
    monthlyCapacity: continuousProduction.monthlyCapacity,
    annualCapacity: continuousProduction.annualCapacity,
    totalEmployeesStandard: continuousProduction.totalEmployeesStandard,
    productionDaysPerMonth: continuousProduction.productionDaysPerMonth,
    productionDaysPerAnnum: continuousProduction.productionDaysPerAnnum,
  };

  const employees = calculateEmployeeIndicator(
    config.employeeAssumptions,
    productionBridge
  );
  const bom = calculateContinuousBillOfMaterials(
    config.bomComponents,
    continuousProduction
  );
  const packaging = calculatePackagingCosts(config.packagingLevels);
  const variableCosts = calculateContinuousVariableCosts(
    config.variableCosts,
    continuousProduction,
    config.dynamicsOverrides?.referenceBatchSizeOverride
  );

  const materialsUnitCost = bom.totalMaterialsUnitCost;
  const packagingUnitCost = packaging.totalPackagingUnitCost;
  const productionVariableUnitCost = variableCosts.totalVariableUnitCost;

  // Excel R114: =F109+F111+F113
  const calculatedUnitCost =
    materialsUnitCost + packagingUnitCost + productionVariableUnitCost;

  const estimatedUnitCost = Math.max(
    0,
    safeNum(config.dynamicsOverrides?.estimatedUnitCost, 0)
  );

  // Excel R117: =IF(F115=0, F114, F115)
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
    dailyCapacity: continuousProduction.bottleneckDailyCapacity,
    monthlyCapacity: continuousProduction.monthlyCapacity,
    employeesIndicated: employees.employeesAdjusted,
  };

  return {
    continuousProduction,
    productionBridge,
    employees,
    bom,
    packaging,
    variableCosts,
    dynamics,
  };
}

/**
 * Default starter configuration modelled directly on continuous production.xlsx:
 * - Multi-process line where Machine A runs at 1,000 units/hr × 16 hrs/day = 16,000 gross units/day,
 *   10% shrinkage -> 14,400 net units/day (bottleneck), alongside downstream Process B.
 * - BOM with per-item material quantities, pack rounding, and hourly consumables.
 * - 3-level cascading packaging hierarchy (50 primary × 20 outer = 1,000 + pallet tier).
 * - 5 daily variable cost streams (Electricity, Gas, Fuel, Water, Maintenance = 653/day).
 */
export function createDefaultContinuousProductionConfig(): ContinuousProductionProductConfig {
  return {
    processes: [
      {
        id: 'cont-proc-a',
        name: 'Production Machine A',
        numberOfWorkstreams: 1,
        employeesPerWorkstream: 1,
        shiftHours: 8,
        shiftsPerDay: 2,
        unitCapacityPerHour: 1000,
        timeAllocationPct: 100,
        shrinkagePct: 10,
      },
      {
        id: 'cont-proc-b',
        name: 'Finishing & Packing Line B',
        numberOfWorkstreams: 1,
        employeesPerWorkstream: 1,
        shiftHours: 8,
        shiftsPerDay: 2,
        unitCapacityPerHour: 1200,
        timeAllocationPct: 100,
        shrinkagePct: 5,
      },
    ],
    employeeAssumptions: {
      hoursPaidPerDay: 8,
      labourEfficiencyPct: 85,
      tolerancePct: 5,
    },
    bomComponents: [
      {
        id: 'cont-bom-1',
        name: 'Component A — Base Raw Material',
        unitOfMeasure: 'g',
        unitsRequiredPerItem: 25,
        unitDivider: 1000,
        packSizeUnits: 50,
        packCost: 420,
        consumablesCostPerHour: 10,
        surplusWasted: false,
      },
      {
        id: 'cont-bom-2',
        name: 'Component B — Secondary Compound',
        unitOfMeasure: 'g',
        unitsRequiredPerItem: 10,
        unitDivider: 1000,
        packSizeUnits: 25,
        packCost: 310,
        consumablesCostPerHour: 10,
        surplusWasted: true,
      },
      {
        id: 'cont-bom-3',
        name: 'Component C — Surface Additive',
        unitOfMeasure: 'ml',
        unitsRequiredPerItem: 5,
        unitDivider: 1000,
        packSizeUnits: 20,
        packCost: 260,
        consumablesCostPerHour: 10,
        surplusWasted: false,
      },
    ],
    packagingLevels: [
      {
        id: 'cont-pkg-1',
        name: 'Primary Inner Unit',
        containsCount: 50,
        componentCost: 1.0,
        wastePct: 0,
      },
      {
        id: 'cont-pkg-2',
        name: 'Secondary Outer Carton',
        containsCount: 20,
        componentCost: 4.0,
        wastePct: 0,
      },
      {
        id: 'cont-pkg-3',
        name: 'Tertiary Pallet Wrap',
        containsCount: 24,
        componentCost: 48.0,
        wastePct: 0,
      },
    ],
    variableCosts: [
      {
        id: 'cont-var-elec',
        name: 'Electricity',
        basis: 'per_day',
        usage: 10,
        usageUnit: 'kWh',
        unitRate: 10.0,
      },
      {
        id: 'cont-var-gas',
        name: 'Gas',
        basis: 'per_day',
        usage: 12,
        usageUnit: 'kg',
        unitRate: 11.0,
      },
      {
        id: 'cont-var-fuel',
        name: 'Fuel',
        basis: 'per_day',
        usage: 15,
        usageUnit: 'litres',
        unitRate: 12.0,
      },
      {
        id: 'cont-var-water',
        name: 'Water',
        basis: 'per_day',
        usage: 20,
        usageUnit: 'kL',
        unitRate: 12.0,
      },
      {
        id: 'cont-var-maint',
        name: 'Maintenance',
        basis: 'per_day',
        usage: 1,
        usageUnit: 'day',
        unitRate: 1.0,
      },
    ],
    dynamicsOverrides: {
      estimatedUnitCost: 0,
      referenceBatchSizeOverride: 0,
    },
  };
}
