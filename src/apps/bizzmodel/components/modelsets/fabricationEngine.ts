import {
  BomComponent,
  BomComponentResult,
  BomSummaryResult,
  FabricationFullResult,
  FabricationProcess,
  FabricationProcessResult,
  FabricationProductConfig,
  FabricationProductionSummaryResult,
  ProductionSummaryResult,
  UnitCostDynamicsResult,
} from './modelSetTypes';
import {
  calculateEmployeeIndicator,
  calculatePackagingCosts,
  calculateProductionVariableCosts,
} from './batchLotsEngine';

const safeNum = (val: unknown, fallback = 0): number => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Formats Fabrication quantities cleanly, preserving fractional daily/monthly output
 * (e.g. 0.50 units/day or 9.50 units/month) while keeping whole numbers crisp.
 */
export function formatFabricationQuantity(val: number): string {
  const n = safeNum(val, 0);
  if (Math.abs(n) < 0.00005) return '0';
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, {
    minimumFractionDigits: Math.abs(n) < 10 ? 2 : 1,
    maximumFractionDigits: 2,
  });
}

/**
 * 1. FABRICATION PRODUCTION CALCULATOR (Multi-Process with Bottleneck Constraint)
 * Faithful to fabrication.xlsx (R22-R38):
 * - productionHoursPerDay = numberOfWorkstreams * shiftHours * shiftsPerDay (R32)
 * - hoursPerBatch = shiftHours * daysPerBatch (R35: e.g. 8h * 2 days = 16h/batch)
 * - batchesPerDay = productionHoursPerDay / hoursPerBatch (e.g. 8 / 16 = 0.5 batches/day)
 * - grossDailyUnits = batchesPerDay * allocatedUnitsPerBatch (e.g. 0.5 * 1 = 0.5 units/day)
 * - netDailyCapacity = grossDailyUnits * (1 - shrinkagePct/100) (R36: preserves fractional units/day)
 * - monthlyCapacity = productionDaysPerMonth * netDailyCapacity (R37: e.g. 19 * 0.5 = 9.5/month)
 * - employeesRequiredStandard = numberOfWorkstreams * employeesPerLine * shiftsPerDay (R38)
 * Bottleneck rule: slowest active process determines product daily capacity.
 */
export function calculateFabricationProductionSummary(
  processes: FabricationProcess[],
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): FabricationProductionSummaryResult {
  const daysMonth = Math.max(1, safeNum(productionDaysPerMonth, 21));
  const daysYear = Math.max(1, safeNum(productionDaysPerAnnum, daysMonth * 12));

  const rawResults = (processes || []).map((proc) => {
    const workstreams = Math.max(0, safeNum(proc.numberOfWorkstreams, 0));
    const empPerLine = Math.max(0, safeNum(proc.employeesPerLine, 0));
    const shiftHrs = Math.max(0, safeNum(proc.shiftHours, 0));
    const shifts = Math.max(0, safeNum(proc.shiftsPerDay, 0));
    const unitsPerBatch = Math.max(0, safeNum(proc.unitsPerBatch, 0));
    const daysPerBatch = Math.max(0, safeNum(proc.daysPerBatch, 0));
    const allocPct = safeNum(proc.timeAllocationPct, 100);
    const shrinkagePct = Math.min(100, Math.max(0, safeNum(proc.shrinkagePct, 0)));

    // Excel R32: =F26*F29*24*F30
    const productionHoursPerDay = workstreams * shiftHrs * shifts;

    // Effective units per batch after optional time allocation %
    const effectiveAllocFactor = allocPct <= 0 ? 1 : allocPct / 100;
    const allocatedUnitsPerBatch = unitsPerBatch * effectiveAllocFactor;

    // Excel R35: hours required per single fabrication batch
    const hoursPerBatch = shiftHrs * daysPerBatch;

    // Batches completed per day (can be < 1 for multi-day fabrication jobs, e.g. 0.5 batches/day)
    const batchesPerDay =
      hoursPerBatch > 0 ? productionHoursPerDay / hoursPerBatch : 0;

    // Excel R36: production per day (gross & net — preserves fractional output like 0.5 units/day)
    const grossDailyUnits = batchesPerDay * allocatedUnitsPerBatch;
    const rawNetDaily =
      shrinkagePct === 0
        ? grossDailyUnits
        : grossDailyUnits * (1 - shrinkagePct / 100);
    const netDailyCapacity = Number(rawNetDaily.toFixed(4));

    // Excel R37: =F25*F36
    const monthlyCapacity = Number((daysMonth * netDailyCapacity).toFixed(2));
    const annualCapacity = Number((daysYear * netDailyCapacity).toFixed(2));

    // Excel R38: =F26*F28*F30
    const employeesRequiredStandard = Math.round(workstreams * empPerLine * shifts);

    return {
      id: proc.id,
      name: proc.name || 'Fabrication Process',
      productionHoursPerDay,
      allocatedUnitsPerBatch,
      daysPerBatch,
      hoursPerBatch,
      batchesPerDay,
      grossDailyUnits,
      netDailyCapacity,
      monthlyCapacity,
      annualCapacity,
      employeesRequiredStandard,
      shrinkagePct,
    };
  });

  // Bottleneck constraint: slowest active process determines product daily capacity
  const activeProcesses = rawResults.filter((p) => p.netDailyCapacity > 0);
  const bottleneckDailyCapacity =
    activeProcesses.length > 0
      ? Math.min(...activeProcesses.map((p) => p.netDailyCapacity))
      : 0;

  const computedProcesses: FabricationProcessResult[] = rawResults.map((p) => {
    const isBottleneck =
      activeProcesses.length > 0 && p.netDailyCapacity === bottleneckDailyCapacity;
    const spareDailyUnits = Number(
      Math.max(0, p.netDailyCapacity - bottleneckDailyCapacity).toFixed(4)
    );
    return {
      id: p.id,
      name: p.name,
      productionHoursPerDay: p.productionHoursPerDay,
      allocatedUnitsPerBatch: p.allocatedUnitsPerBatch,
      daysPerBatch: p.daysPerBatch,
      hoursPerBatch: p.hoursPerBatch,
      batchesPerDay: p.batchesPerDay,
      grossDailyUnits: p.grossDailyUnits,
      netDailyCapacity: p.netDailyCapacity,
      monthlyCapacity: p.monthlyCapacity,
      annualCapacity: p.annualCapacity,
      employeesRequiredStandard: p.employeesRequiredStandard,
      isBottleneck,
      spareDailyUnits,
    };
  });

  const bottleneckList = computedProcesses.filter((p) => p.isBottleneck);
  const primaryBottleneck = bottleneckList[0] || computedProcesses[0];
  const primaryRaw = rawResults.find((r) => r.id === primaryBottleneck?.id);

  const totalEmployeesStandard = computedProcesses.reduce(
    (sum, p) => sum + p.employeesRequiredStandard,
    0
  );

  return {
    processes: computedProcesses,
    bottleneckDailyCapacity,
    bottleneckUnitsPerBatch: primaryBottleneck?.allocatedUnitsPerBatch ?? 0,
    bottleneckDaysPerBatch: primaryBottleneck?.daysPerBatch ?? 0,
    bottleneckHoursPerBatch: primaryBottleneck?.hoursPerBatch ?? 0,
    bottleneckBatchesPerDay: primaryBottleneck?.batchesPerDay ?? 0,
    bottleneckShrinkagePct: primaryRaw?.shrinkagePct ?? 0,
    bottleneckProcessIds: bottleneckList.map((p) => p.id),
    bottleneckProcessNames: bottleneckList.map((p) => p.name),
    monthlyCapacity: Number((bottleneckDailyCapacity * daysMonth).toFixed(2)),
    annualCapacity: Number((bottleneckDailyCapacity * daysYear).toFixed(2)),
    totalEmployeesStandard,
    productionDaysPerMonth: daysMonth,
    productionDaysPerAnnum: daysYear,
  };
}

/**
 * 3. FABRICATION BILL OF MATERIALS (Excel R51-R66)
 * Evaluates pack rounding and surplus absorption PER FABRICATION BATCH
 * so multi-day jobs (where batchesPerDay < 1, e.g. 0.5 batches/day) never double-count packs.
 */
export function calculateFabricationBillOfMaterials(
  components: BomComponent[],
  production: FabricationProductionSummaryResult
): BomSummaryResult {
  const unitsPerBatch = Math.max(0, production.bottleneckUnitsPerBatch);
  const shrinkageFactor = Math.max(0, 1 - production.bottleneckShrinkagePct / 100);
  const netUnitsPerBatch = unitsPerBatch * shrinkageFactor;
  const batchesPerDay = Math.max(0, production.bottleneckBatchesPerDay);

  const items: BomComponentResult[] = (components || []).map((comp) => {
    const qtyPerBatch = Math.max(0, safeNum(comp.unitsRequiredPerBatch, 0));
    const divider = Math.max(0.0001, safeNum(comp.unitDivider, 1));
    const packSize = Math.max(0, safeNum(comp.packSizeUnits, 0));
    const packCost = Math.max(0, safeNum(comp.packCost, 0));
    const consumablesPerBatch = Math.max(0, safeNum(comp.batchConsumablesCost, 0));

    // Effective pack capacity expressed in component units
    const effectivePackCapacity = packSize * divider;

    // Excel R58: packs required per single fabrication batch
    const packsRequiredPerBatch =
      effectivePackCapacity > 0 && qtyPerBatch > 0
        ? Math.ceil(qtyPerBatch / effectivePackCapacity)
        : 0;

    // Excel R60-R64: batch purchase cost, consumables, total batch materials cost, surplus
    const batchPurchaseCost = packsRequiredPerBatch * packCost;
    const batchTotalCost = batchPurchaseCost + consumablesPerBatch;
    const quantityAvailable = effectivePackCapacity * packsRequiredPerBatch;
    const surplusQuantity = Math.max(0, quantityAvailable - qtyPerBatch);

    // Excel R65-R66: If surplus is wasted, full purchased packs are absorbed into the batch cost.
    // Otherwise, unused partial-pack surplus carries forward to inventory.
    const consumedFraction =
      quantityAvailable > 0 ? Math.min(1, qtyPerBatch / quantityAvailable) : 0;
    const effectiveBatchCost = comp.surplusWasted
      ? batchTotalCost
      : batchPurchaseCost * consumedFraction + consumablesPerBatch;

    const unitCost =
      netUnitsPerBatch > 0 ? effectiveBatchCost / netUnitsPerBatch : 0;
    const effectiveDailyCost = effectiveBatchCost * batchesPerDay;

    return {
      id: comp.id,
      name: comp.name || 'Material',
      unitOfMeasure: comp.unitOfMeasure || 'units',
      cyclesPerDay: batchesPerDay,
      dailyUnitsRequired: qtyPerBatch * batchesPerDay,
      packsRequiredPerDay: packsRequiredPerBatch, // Displayed as packs/batch in per_batch BOM mode
      dailyPurchaseCost: batchPurchaseCost * batchesPerDay,
      dailyConsumablesCost: consumablesPerBatch * batchesPerDay,
      dailyTotalCost: batchTotalCost * batchesPerDay,
      effectiveDailyCost,
      quantityAvailable,
      surplusQuantity,
      surplusWasted: comp.surplusWasted,
      unitCost,
      batchCost: effectiveBatchCost,
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
 * 6. FULL MANUFACTURING — FABRICATION ENGINE
 * Combines all 6 calculators and emits live dynamics transferred to the Results tab.
 */
export function calculateFabricationFull(
  config: FabricationProductConfig,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): FabricationFullResult {
  const fabricationProduction = calculateFabricationProductionSummary(
    config.processes,
    productionDaysPerMonth,
    productionDaysPerAnnum
  );

  // Bridge summary so shared Employee, BOM, Variable & Unit Cost Dynamics panels work seamlessly
  const productionBridge: ProductionSummaryResult = {
    processes: fabricationProduction.processes.map((p) => ({
      id: p.id,
      name: p.name,
      productionHoursPerDay: p.productionHoursPerDay,
      allocatedUnitsPerBatch: p.allocatedUnitsPerBatch,
      batchTotalTimeMinutes: Math.round(p.hoursPerBatch * 60),
      batchTotalTimeHours: p.hoursPerBatch,
      cyclesPerDay: p.batchesPerDay,
      grossDailyUnits: p.grossDailyUnits,
      netDailyCapacity: p.netDailyCapacity,
      monthlyCapacity: p.monthlyCapacity,
      annualCapacity: p.annualCapacity,
      employeesRequiredStandard: p.employeesRequiredStandard,
      isBottleneck: p.isBottleneck,
      spareDailyUnits: p.spareDailyUnits,
    })),
    bottleneckDailyCapacity: fabricationProduction.bottleneckDailyCapacity,
    bottleneckProcessIds: fabricationProduction.bottleneckProcessIds,
    bottleneckProcessNames: fabricationProduction.bottleneckProcessNames,
    bottleneckCyclesPerDay: fabricationProduction.bottleneckBatchesPerDay,
    bottleneckUnitsPerBatch: fabricationProduction.bottleneckUnitsPerBatch,
    monthlyCapacity: fabricationProduction.monthlyCapacity,
    annualCapacity: fabricationProduction.annualCapacity,
    totalEmployeesStandard: fabricationProduction.totalEmployeesStandard,
    productionDaysPerMonth: fabricationProduction.productionDaysPerMonth,
    productionDaysPerAnnum: fabricationProduction.productionDaysPerAnnum,
  };

  const employees = calculateEmployeeIndicator(
    config.employeeAssumptions,
    productionBridge
  );
  const bom = calculateFabricationBillOfMaterials(
    config.bomComponents,
    fabricationProduction
  );
  const packaging = calculatePackagingCosts(config.packagingLevels);
  const variableCosts = calculateProductionVariableCosts(
    config.variableCosts,
    productionBridge,
    config.dynamicsOverrides?.referenceBatchSizeOverride
  );

  const materialsUnitCost = bom.totalMaterialsUnitCost;
  const packagingUnitCost = packaging.totalPackagingUnitCost;
  const productionVariableUnitCost = variableCosts.totalVariableUnitCost;

  // Excel R111: =F106+F108+F110
  const calculatedUnitCost =
    materialsUnitCost + packagingUnitCost + productionVariableUnitCost;

  const estimatedUnitCost = Math.max(
    0,
    safeNum(config.dynamicsOverrides?.estimatedUnitCost, 0)
  );

  // Excel R114: =IF(F112=0, F111, F112)
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
    dailyCapacity: fabricationProduction.bottleneckDailyCapacity,
    monthlyCapacity: fabricationProduction.monthlyCapacity,
    employeesIndicated: employees.employeesAdjusted,
  };

  return {
    fabricationProduction,
    productionBridge,
    employees,
    bom,
    packaging,
    variableCosts,
    dynamics,
  };
}

/**
 * Default starter configuration modelled directly on fabrication.xlsx:
 * - Multi-process fabrication line where Bay A produces 1 unit per batch over 2 days (0.50 units/day bottleneck)
 *   alongside downstream Assembly & Finishing Bay B (1 unit per batch over 1 day = 1.00 units/day).
 * - Per-batch Bill of Materials with pack rounding, batch consumables, and surplus handling.
 * - Multi-level protective/crating packaging hierarchy (3 levels).
 * - 5 batch variable cost streams matching fabrication.xlsx R78-R97 (Electricity, Gas, Fuel, Water, Maintenance = 653/batch).
 */
export function createDefaultFabricationConfig(): FabricationProductConfig {
  return {
    processes: [
      {
        id: 'fab-proc-a',
        name: 'Fabrication Machine A',
        numberOfWorkstreams: 1,
        employeesPerLine: 2,
        shiftHours: 8,
        shiftsPerDay: 1,
        unitsPerBatch: 1,
        daysPerBatch: 2,
        timeAllocationPct: 100,
        shrinkagePct: 0,
      },
      {
        id: 'fab-proc-b',
        name: 'Assembly & Finishing Bay B',
        numberOfWorkstreams: 1,
        employeesPerLine: 1,
        shiftHours: 8,
        shiftsPerDay: 1,
        unitsPerBatch: 1,
        daysPerBatch: 1,
        timeAllocationPct: 100,
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
        id: 'fab-bom-1',
        name: 'Structural Steel Plate',
        unitOfMeasure: 'sheets',
        unitsRequiredPerBatch: 4,
        unitDivider: 1,
        packSizeUnits: 5,
        packCost: 1250,
        batchConsumablesCost: 180,
        surplusWasted: false,
      },
      {
        id: 'fab-bom-2',
        name: 'Precision Hardware & Fasteners',
        unitOfMeasure: 'kits',
        unitsRequiredPerBatch: 2,
        unitDivider: 1,
        packSizeUnits: 2,
        packCost: 460,
        batchConsumablesCost: 65,
        surplusWasted: true,
      },
      {
        id: 'fab-bom-3',
        name: 'Industrial Primer & Coating',
        unitOfMeasure: 'L',
        unitsRequiredPerBatch: 6,
        unitDivider: 1,
        packSizeUnits: 20,
        packCost: 1400,
        batchConsumablesCost: 95,
        surplusWasted: false,
      },
    ],
    packagingLevels: [
      {
        id: 'fab-pkg-1',
        name: 'Primary Protective Wrap',
        containsCount: 1,
        componentCost: 85.0,
        wastePct: 0,
      },
      {
        id: 'fab-pkg-2',
        name: 'Secondary Timber Crate',
        containsCount: 1,
        componentCost: 320.0,
        wastePct: 0,
      },
      {
        id: 'fab-pkg-3',
        name: 'Tertiary Export Pallet Base',
        containsCount: 2,
        componentCost: 240.0,
        wastePct: 0,
      },
    ],
    variableCosts: [
      {
        id: 'fab-var-elec',
        name: 'Electricity',
        basis: 'per_batch',
        usage: 10,
        usageUnit: 'kWh',
        unitRate: 10.0,
      },
      {
        id: 'fab-var-gas',
        name: 'Gas',
        basis: 'per_batch',
        usage: 12,
        usageUnit: 'kg',
        unitRate: 11.0,
      },
      {
        id: 'fab-var-fuel',
        name: 'Fuel',
        basis: 'per_batch',
        usage: 15,
        usageUnit: 'litres',
        unitRate: 12.0,
      },
      {
        id: 'fab-var-water',
        name: 'Water',
        basis: 'per_batch',
        usage: 20,
        usageUnit: 'kL',
        unitRate: 12.0,
      },
      {
        id: 'fab-var-maint',
        name: 'Maintenance',
        basis: 'per_batch',
        usage: 1,
        usageUnit: 'batch',
        unitRate: 1.0,
      },
    ],
    dynamicsOverrides: {
      estimatedUnitCost: 0,
      referenceBatchSizeOverride: 0,
    },
  };
}
