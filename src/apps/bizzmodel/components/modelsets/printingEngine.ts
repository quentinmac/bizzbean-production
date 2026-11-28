import {
  PrintingCapacityMode,
  PrintingFullResult,
  PrintingProcess,
  PrintingProcessResult,
  PrintingProductConfig,
  PrintingProductionSummaryResult,
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
 * 1. PRINTING PRODUCTION CALCULATOR (Multi-Process per Product)
 * Faithful to printing.xlsx (Rows 22–43):
 * - productionHoursPerDay (R31) = numberOfWorkstreams * shiftHours * shiftsPerDay
 * - allocatedUnitsPerBatch (R34) = unitsPerBatch * (IF(alloc=0, 100%, alloc))
 * - batchTotalTimeHours (R37) = (batchRunTimeMinutes + batchSetupTimeMinutes) / 60
 * - batchesPerDay (R38) = IF(batchTotalTimeHours=0, productionHoursPerDay, productionHoursPerDay / batchTotalTimeHours)
 * - grossUnitsPerDay (R39) = allocatedUnitsPerBatch * batchesPerDay
 * - outputPerDay (R41) = ROUNDDOWN(grossUnitsPerDay * (1 - shrinkagePct/100), 0)
 * - outputPerMonth (R42) = productionDaysPerMonth * outputPerDay
 * - employeesRequiredStandard (R43) = numberOfWorkstreams * employeesPerLine * shiftsPerDay
 *
 * Supports multiple processes per product in either:
 * - 'bottleneck' mode: sequential stages (e.g. Printing Press -> Guillotine/Cutting -> Binding/Finishing; capacity = slowest stage MIN)
 * - 'sum' mode: parallel printing presses / production lines (capacity = combined SUM)
 */
export function calculatePrintingProductionSummary(
  processes: PrintingProcess[],
  capacityMode: PrintingCapacityMode,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number,
  outputUnit = 'sheets'
): PrintingProductionSummaryResult {
  const daysMonth = Math.max(1, safeNum(productionDaysPerMonth, 19));
  const daysYear = Math.max(1, safeNum(productionDaysPerAnnum, daysMonth * 12));
  const mode: PrintingCapacityMode = capacityMode === 'sum' ? 'sum' : 'bottleneck';
  const unitText = (outputUnit || 'sheets').trim() || 'sheets';

  const rawResults = processes.map((proc) => {
    const workstreams = Math.max(0, safeNum(proc.numberOfWorkstreams, 0));
    const empPerLine = Math.max(0, safeNum(proc.employeesPerLine, 0));
    const shiftHrs = Math.max(0, safeNum(proc.shiftHours, 0));
    const shifts = Math.max(0, safeNum(proc.shiftsPerDay, 0));
    const unitsPerBatch = Math.max(0, safeNum(proc.unitsPerBatch, 0));
    const rawAlloc = safeNum(proc.productionTimeAllocationPct, 100);
    const effectiveAllocationPct = rawAlloc <= 0 ? 100 : Math.min(100, rawAlloc);
    const runMins = Math.max(0, safeNum(proc.batchRunTimeMinutes, 0));
    const setupMins = Math.max(0, safeNum(proc.batchSetupTimeMinutes, 0));
    const shrinkagePct = Math.min(100, Math.max(0, safeNum(proc.shrinkagePct, 0)));

    // Excel R31: =E25*E28*24*E29
    const productionHoursPerDay = workstreams * shiftHrs * shifts;

    // Excel R34: =IF(E33=0, E32*100%, E32*E33)
    const allocatedUnitsPerBatch = unitsPerBatch * (effectiveAllocationPct / 100);

    // Excel R37: =SUM(E35:E36)
    const batchTotalTimeMinutes = runMins + setupMins;
    const batchTotalTimeHours = batchTotalTimeMinutes / 60;

    // Excel R38: =IFERROR(IF(E37=0, E31, (E31/E37/24)), 0)
    const batchesPerDay =
      batchTotalTimeHours <= 0
        ? productionHoursPerDay
        : productionHoursPerDay / batchTotalTimeHours;

    // Excel R39: =E34*E38
    const grossUnitsPerDay = allocatedUnitsPerBatch * batchesPerDay;

    // Excel R41: =IF(F40=0, ROUNDDOWN(F39,0), ROUNDDOWN(F39-(F39*F40),0))
    const outputPerDay =
      shrinkagePct === 0
        ? Math.floor(grossUnitsPerDay)
        : Math.floor(grossUnitsPerDay - grossUnitsPerDay * (shrinkagePct / 100));

    // Excel R42: =F24*F41
    const outputPerMonth = Math.round(daysMonth * outputPerDay);
    const outputPerAnnum = Math.round(daysYear * outputPerDay);

    // Excel R43: =F25*F27*F29
    const employeesRequiredStandard = Math.round(workstreams * empPerLine * shifts);

    return {
      id: proc.id,
      name: proc.name || 'Printing Press',
      productionHoursPerDay,
      effectiveAllocationPct,
      allocatedUnitsPerBatch,
      batchTotalTimeMinutes,
      batchTotalTimeHours,
      batchesPerDay,
      grossUnitsPerDay,
      shrinkagePct,
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

  const computedProcesses: PrintingProcessResult[] = rawResults.map((p) => {
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
  let effectiveUnitsPerBatch = 0;
  let effectiveBatchesPerDay = 0;
  let grossDailyUnits = 0;
  let effectiveShrinkagePct = 0;

  if (mode === 'sum') {
    effectiveHoursPerDay = computedProcesses.reduce(
      (sum, p) => sum + p.productionHoursPerDay,
      0
    );
    effectiveBatchesPerDay = computedProcesses.reduce(
      (sum, p) => sum + p.batchesPerDay,
      0
    );
    grossDailyUnits = computedProcesses.reduce(
      (sum, p) => sum + p.grossUnitsPerDay,
      0
    );
    effectiveUnitsPerBatch =
      effectiveBatchesPerDay > 0 ? grossDailyUnits / effectiveBatchesPerDay : 0;
    effectiveShrinkagePct =
      grossDailyUnits > 0
        ? Math.max(0, ((grossDailyUnits - dailyOutputCapacity) / grossDailyUnits) * 100)
        : 0;
  } else {
    const primaryBottleneck = bottleneckList[0] || computedProcesses[0];
    effectiveHoursPerDay = primaryBottleneck?.productionHoursPerDay ?? 0;
    effectiveUnitsPerBatch = primaryBottleneck?.allocatedUnitsPerBatch ?? 0;
    effectiveBatchesPerDay = primaryBottleneck?.batchesPerDay ?? 0;
    grossDailyUnits = primaryBottleneck?.grossUnitsPerDay ?? 0;
    effectiveShrinkagePct = primaryBottleneck?.shrinkagePct ?? 0;
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
    effectiveHoursPerDay,
    effectiveUnitsPerBatch,
    effectiveBatchesPerDay,
    grossDailyUnits,
    effectiveShrinkagePct,
    dailyOutputCapacity,
    monthlyOutputCapacity,
    annualOutputCapacity,
    bottleneckProcessIds: bottleneckList.map((p) => p.id),
    bottleneckProcessNames: bottleneckList.map((p) => p.name),
    totalEmployeesStandard,
    productionDaysPerMonth: daysMonth,
    productionDaysPerAnnum: daysYear,
  };
}

/**
 * Adapter converting PrintingProductionSummaryResult into ProductionSummaryResult
 * so shared EmployeeCalculatorPanel, BillOfMaterialsPanel, ProductionVariableCostsPanel,
 * and UnitCostDynamicsPanel operate seamlessly with printing.xlsx semantics:
 * - Excel R58 (BOM units required per day) = E39 (grossDailyUnits, e.g. 320,000 sheets/day)
 *   -> bottleneckCyclesPerDay = grossDailyUnits (so qty per sheet × 320,000 gross sheets = daily material demand)
 * - Saleable daily output (Excel R41) = 288,000 sheets/day (absorbs 10% press spoilage into saleable unit cost)
 * - Variable Costs batch quantity = effectiveUnitsPerBatch (e.g. 20,000 sheets/batch), overridable per user
 */
function buildProductionBridge(
  printing: PrintingProductionSummaryResult
): ProductionSummaryResult {
  return {
    processes: printing.processes.map((p) => ({
      id: p.id,
      name: p.name,
      productionHoursPerDay: p.productionHoursPerDay,
      allocatedUnitsPerBatch: p.allocatedUnitsPerBatch,
      batchTotalTimeMinutes: p.batchTotalTimeMinutes,
      batchTotalTimeHours: p.batchTotalTimeHours,
      cyclesPerDay: p.batchesPerDay,
      grossDailyUnits: p.grossUnitsPerDay,
      netDailyCapacity: p.outputPerDay,
      monthlyCapacity: p.outputPerMonth,
      annualCapacity: p.outputPerAnnum,
      employeesRequiredStandard: p.employeesRequiredStandard,
      isBottleneck: p.isBottleneck,
      spareDailyUnits: p.spareDailyOutput,
    })),
    bottleneckDailyCapacity: printing.dailyOutputCapacity,
    bottleneckProcessIds: printing.bottleneckProcessIds,
    bottleneckProcessNames: printing.bottleneckProcessNames,
    bottleneckCyclesPerDay: printing.grossDailyUnits,
    bottleneckUnitsPerBatch: printing.effectiveUnitsPerBatch,
    monthlyCapacity: printing.monthlyOutputCapacity,
    annualCapacity: printing.annualOutputCapacity,
    totalEmployeesStandard: printing.totalEmployeesStandard,
    productionDaysPerMonth: printing.productionDaysPerMonth,
    productionDaysPerAnnum: printing.productionDaysPerAnnum,
  };
}

/**
 * FULL 6-CALCULATOR PRINTING ENGINE (printing.xlsx)
 * 1. Production Calculator (multi-process press runs, run+setup times, allocation %, shrinkage/spoilage %)
 * 2. Employee Calculator (advisory only — zero impact on production)
 * 3. Bill of Materials (dynamic substrate, ink, plates & finishing materials costing)
 * 4. Packaging Costs (multi-level hierarchy supporting 2+ dynamic levels)
 * 5. Production Variable Costs (electricity, gas, fuel, water, press maintenance & custom charges)
 * 6. Unit Cost Dynamics (consolidates materials + packaging + variable -> transfers to Results tab)
 */
export function calculatePrintingFull(
  config: PrintingProductConfig,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): PrintingFullResult {
  const printingProduction = calculatePrintingProductionSummary(
    config.processes,
    config.capacityMode ?? 'bottleneck',
    productionDaysPerMonth,
    productionDaysPerAnnum,
    config.outputUnit || 'sheets'
  );

  const productionBridge = buildProductionBridge(printingProduction);

  // 2. Employee Calculator (Strictly advisory — zero impact on production!)
  const employees = calculateEmployeeIndicator(
    config.employeeAssumptions,
    productionBridge
  );

  // 3. Bill of Materials (Excel R56–R69)
  const bom = calculateBillOfMaterials(config.bomComponents, productionBridge);

  // 4. Packaging Costs (Multi-level, Excel R70–R77+)
  const packaging = calculatePackagingCosts(config.packagingLevels);

  // 5. Production Variable Costs (Excel R78–R99)
  const variableCosts = calculateProductionVariableCosts(
    config.variableCosts,
    productionBridge,
    config.dynamicsOverrides?.referenceBatchSizeOverride
  );

  // 6. Unit Cost Dynamics (Excel R105–R114)
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
    dailyCapacity: printingProduction.dailyOutputCapacity,
    monthlyCapacity: printingProduction.monthlyOutputCapacity,
    employeesIndicated: employees.employeesAdjusted,
  };

  return {
    printingProduction,
    productionBridge,
    employees,
    bom,
    packaging,
    variableCosts,
    dynamics,
  };
}

/**
 * Default starter configuration modelled directly on printing.xlsx:
 * - Production Machine A: 2 workstreams, 1 emp/line, 8h shift, 1 shift/day -> 16 hrs/day
 *   20,000 units/batch × 100% allocation, 55 min run + 5 min setup = 60 min (1 hr/batch) -> 16 batches/day
 *   -> 320,000 gross units/day -> less 10% shrinkage/spoilage -> 288,000 net units/day (5,472,000/mo at 19 days)
 *   -> 2 standard employees
 * - Employee Calculator: 8 hrs/day, 100% efficiency, 0% tolerance -> 2 std, 0 additional, 2 adjusted
 * - BOM: Print Paper / Substrate (1 sheet/unit, divider 1, pack size 1,000 sheets, pack cost R100, surplus wasted Yes)
 *   -> 320 packs/day = R32,000/day -> R0.1111/saleable sheet (absorbing 10% make-ready spoilage; R0.1000 gross)
 * - Packaging: empty by default (R0.00, supports 2+ dynamic levels)
 * - Production Variable Costs: Electricity (10 kW × R10 = R100 / 20,000-unit batch = R0.0050/unit) + Gas/Fuel/Water/Maintenance (0)
 */
export function createDefaultPrintingConfig(): PrintingProductConfig {
  return {
    outputUnit: 'sheets',
    processes: [
      {
        id: 'print-proc-1',
        name: 'Production Machine A',
        numberOfWorkstreams: 2,
        employeesPerLine: 1,
        shiftHours: 8,
        shiftsPerDay: 1,
        unitsPerBatch: 20000,
        productionTimeAllocationPct: 100,
        batchRunTimeMinutes: 55,
        batchSetupTimeMinutes: 5,
        shrinkagePct: 10,
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
        id: 'print-bom-1',
        name: 'Print Paper / Substrate Stock',
        unitOfMeasure: 'sheets',
        unitsRequiredPerBatch: 1,
        unitDivider: 1,
        packSizeUnits: 1000,
        packCost: 100,
        batchConsumablesCost: 0,
        surplusWasted: true,
      },
    ],
    packagingLevels: [],
    variableCosts: [
      {
        id: 'print-var-elec',
        name: 'Electricity',
        basis: 'per_batch',
        usage: 10,
        usageUnit: 'kW',
        unitRate: 10,
      },
      {
        id: 'print-var-gas',
        name: 'Gas',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'kg',
        unitRate: 0,
      },
      {
        id: 'print-var-fuel',
        name: 'Fuel',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'L',
        unitRate: 0,
      },
      {
        id: 'print-var-water',
        name: 'Water',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'kL',
        unitRate: 0,
      },
      {
        id: 'print-var-maint',
        name: 'Maintenance',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'batch',
        unitRate: 0,
      },
    ],
    dynamicsOverrides: {
      estimatedUnitCost: 0,
      referenceBatchSizeOverride: 0,
    },
  };
}
