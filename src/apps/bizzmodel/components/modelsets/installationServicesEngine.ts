import {
  InstallationCapacityMode,
  InstallationProcess,
  InstallationProcessResult,
  InstallationProductionSummaryResult,
  InstallationServicesFullResult,
  InstallationServicesProductConfig,
  ProductionSummaryResult,
  UnitCostDynamicsResult,
  VariableCostItemResult,
  VariableCostSummaryResult,
} from './modelSetTypes';
import {
  calculateBillOfMaterials,
  calculateEmployeeIndicator,
  calculatePackagingCosts,
  calculateProductionVariableCosts,
} from './batchLotsEngine';
import {
  calculateVehicleLogisticsCost,
  createDefaultVehicleLogisticsConfig,
} from './vehicleLogisticsEngine';

const safeNum = (val: unknown, fallback = 0): number => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * 1. INSTALLATION SERVICES PRODUCTION CALCULATOR (Multi-Process per Product)
 * Faithful to installations services.xlsx (Rows 22–38):
 * - hoursAvailablePerDay (R29) = numberOfWorkstreams * employeesPerWorkstream * shiftHours * shiftsPerDay
 * - operationTime (R32) = productionTime + travelOrSetupTime
 * - operationsPerDay (R33) = floor(hoursAvailablePerDay / operationTimeHours)
 * - operationsPerMonth (R34) = productionDaysPerMonth * operationsPerDay
 * - kilometersPerDay (R36) = operationsPerDay * kilometersPerOperation
 * - kilometersPerMonth (R37) = kilometersPerDay * productionDaysPerMonth
 * - employeesRequiredStandard (R38) = numberOfWorkstreams * employeesPerWorkstream * shiftsPerDay
 *
 * Supports multiple processes per product in either:
 * - 'bottleneck' mode: sequential installation stages (daily capacity = slowest active stage; daily km = dailyCap * sum of stage kms/operation)
 * - 'sum' mode: parallel installation teams (daily capacity = sum of operations/day; daily km = sum of team daily kms)
 */
export function calculateInstallationProductionSummary(
  processes: InstallationProcess[],
  capacityMode: InstallationCapacityMode,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): InstallationProductionSummaryResult {
  const daysMonth = Math.max(1, safeNum(productionDaysPerMonth, 19));
  const daysYear = Math.max(1, safeNum(productionDaysPerAnnum, daysMonth * 12));
  const mode: InstallationCapacityMode = capacityMode === 'sum' ? 'sum' : 'bottleneck';

  const rawResults = processes.map((proc) => {
    const workstreams = Math.max(0, safeNum(proc.numberOfWorkstreams, 0));
    const empPerWorkstream = Math.max(0, safeNum(proc.employeesPerWorkstream, 0));
    const shiftHrs = Math.max(0, safeNum(proc.shiftHours, 0));
    const shifts = Math.max(0, safeNum(proc.shiftsPerDay, 0));
    const prodMins = Math.max(0, safeNum(proc.productionTimeMinutes, 0));
    const travelMins = Math.max(0, safeNum(proc.travelOrSetupTimeMinutes, 0));
    const kmPerOp = Math.max(0, safeNum(proc.kilometersPerOperation, 0));

    // Excel R29: =E25*E26*E27*24*E28
    const hoursAvailablePerDay = workstreams * empPerWorkstream * shiftHrs * shifts;

    // Excel R32: =SUM(E30:E31)
    const operationTimeMinutes = prodMins + travelMins;
    const operationTimeHours = operationTimeMinutes / 60;

    // Excel R33: =IFERROR(ROUNDDOWN((E29/E32)/24, 0), 0)
    const operationsPerDay =
      operationTimeHours > 0
        ? Math.floor(hoursAvailablePerDay / operationTimeHours)
        : 0;

    // Excel R34: =F24*F33
    const operationsPerMonth = Math.round(daysMonth * operationsPerDay);
    const operationsPerAnnum = Math.round(daysYear * operationsPerDay);

    // Excel R36 & R37
    const kilometersPerDay = operationsPerDay * kmPerOp;
    const kilometersPerMonth = kilometersPerDay * daysMonth;

    // Excel R38: =F25*F26*F28
    const employeesRequiredStandard = Math.round(workstreams * empPerWorkstream * shifts);

    return {
      id: proc.id,
      name: proc.name || 'Installation Process',
      hoursAvailablePerDay,
      operationTimeMinutes,
      operationTimeHours,
      operationsPerDay,
      operationsPerMonth,
      operationsPerAnnum,
      kilometersPerOperation: kmPerOp,
      kilometersPerDay,
      kilometersPerMonth,
      employeesRequiredStandard,
      shiftHours: shiftHrs,
    };
  });

  const activeProcesses = rawResults.filter((p) => p.operationsPerDay > 0);
  const minDailyOps =
    activeProcesses.length > 0
      ? Math.min(...activeProcesses.map((p) => p.operationsPerDay))
      : 0;
  const sumDailyOps = rawResults.reduce((s, p) => s + p.operationsPerDay, 0);

  const dailyOperationsCapacity = mode === 'sum' ? sumDailyOps : minDailyOps;

  const computedProcesses: InstallationProcessResult[] = rawResults.map((p) => {
    const isBottleneck =
      mode === 'bottleneck' &&
      activeProcesses.length > 0 &&
      p.operationsPerDay === minDailyOps;
    const spareDailyOperations =
      mode === 'bottleneck' ? Math.max(0, p.operationsPerDay - minDailyOps) : 0;

    return {
      id: p.id,
      name: p.name,
      hoursAvailablePerDay: p.hoursAvailablePerDay,
      operationTimeMinutes: p.operationTimeMinutes,
      operationTimeHours: p.operationTimeHours,
      operationsPerDay: p.operationsPerDay,
      operationsPerMonth: p.operationsPerMonth,
      operationsPerAnnum: p.operationsPerAnnum,
      kilometersPerOperation: p.kilometersPerOperation,
      kilometersPerDay: p.kilometersPerDay,
      kilometersPerMonth: p.kilometersPerMonth,
      employeesRequiredStandard: p.employeesRequiredStandard,
      isBottleneck,
      spareDailyOperations,
    };
  });

  const bottleneckList = computedProcesses.filter((p) => p.isBottleneck);

  // Daily km travelled:
  // - In 'bottleneck' (sequential stages), every completed installation incurs the sum of all active stages' km/operation.
  // - In 'sum' (parallel teams), total daily km is the sum of each team's daily km.
  const totalKmPerSequentialOperation = rawResults.reduce(
    (sum, p) => sum + p.kilometersPerOperation,
    0
  );
  const dailyKilometersTravelled =
    mode === 'sum'
      ? rawResults.reduce((sum, p) => sum + p.kilometersPerDay, 0)
      : dailyOperationsCapacity * totalKmPerSequentialOperation;

  const monthlyKilometersTravelled = dailyKilometersTravelled * daysMonth;
  const monthlyOperationsCapacity = Math.round(dailyOperationsCapacity * daysMonth);
  const annualOperationsCapacity = Math.round(dailyOperationsCapacity * daysYear);

  const totalEmployeesStandard = computedProcesses.reduce(
    (sum, p) => sum + p.employeesRequiredStandard,
    0
  );

  // Reference shift hours for Vehicle service provision (Excel F27*24)
  const firstShiftHours = rawResults.find((p) => p.shiftHours > 0)?.shiftHours ?? 8;

  return {
    processes: computedProcesses,
    capacityMode: mode,
    dailyOperationsCapacity,
    monthlyOperationsCapacity,
    annualOperationsCapacity,
    dailyKilometersTravelled,
    monthlyKilometersTravelled,
    referenceShiftHours: firstShiftHours,
    bottleneckProcessIds: bottleneckList.map((p) => p.id),
    bottleneckProcessNames: bottleneckList.map((p) => p.name),
    totalEmployeesStandard,
    productionDaysPerMonth: daysMonth,
    productionDaysPerAnnum: daysYear,
  };
}

/**
 * Adapter converting InstallationProductionSummaryResult into ProductionSummaryResult
 * so shared EmployeeCalculatorPanel, BillOfMaterialsPanel, and UnitCostDynamicsPanel work natively.
 * Because each installation is 1 operation (1 unit/operation, cyclesPerDay = dailyOperationsCapacity),
 * Excel R53–R66 BOM formulas match calculateBillOfMaterials() down to the cent.
 */
function buildProductionBridge(
  inst: InstallationProductionSummaryResult
): ProductionSummaryResult {
  return {
    processes: inst.processes.map((p) => ({
      id: p.id,
      name: p.name,
      productionHoursPerDay: p.hoursAvailablePerDay,
      allocatedUnitsPerBatch: 1,
      batchTotalTimeMinutes: p.operationTimeMinutes,
      batchTotalTimeHours: p.operationTimeHours,
      cyclesPerDay: p.operationsPerDay,
      grossDailyUnits: p.operationsPerDay,
      netDailyCapacity: p.operationsPerDay,
      monthlyCapacity: p.operationsPerMonth,
      annualCapacity: p.operationsPerAnnum,
      employeesRequiredStandard: p.employeesRequiredStandard,
      isBottleneck: p.isBottleneck,
      spareDailyUnits: p.spareDailyOperations,
    })),
    bottleneckDailyCapacity: inst.dailyOperationsCapacity,
    bottleneckProcessIds: inst.bottleneckProcessIds,
    bottleneckProcessNames: inst.bottleneckProcessNames,
    bottleneckCyclesPerDay: inst.dailyOperationsCapacity,
    bottleneckUnitsPerBatch: 1,
    monthlyCapacity: inst.monthlyOperationsCapacity,
    annualCapacity: inst.annualOperationsCapacity,
    totalEmployeesStandard: inst.totalEmployeesStandard,
    productionDaysPerMonth: inst.productionDaysPerMonth,
    productionDaysPerAnnum: inst.productionDaysPerAnnum,
  };
}

/**
 * FULL 6-CALCULATOR INSTALLATION SERVICES ENGINE
 * 1. Production Calculator (multi-process, installations/day + daily/monthly km)
 * 2. Employee Calculator (advisory only — zero impact on production)
 * 3. Bill of Materials (dynamic product costing per installation)
 * 4. Packaging Costs (multi-level hierarchy supporting 2+ levels)
 * 5. Production Variable Costs (reusable Vehicle / Logistics calculator + optional extra variable items)
 * 6. Unit Cost Dynamics (consolidates materials + packaging + variable/logistics -> transfers to Results tab)
 */
export function calculateInstallationServicesFull(
  config: InstallationServicesProductConfig,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): InstallationServicesFullResult {
  const installationProduction = calculateInstallationProductionSummary(
    config.processes,
    config.capacityMode ?? 'bottleneck',
    productionDaysPerMonth,
    productionDaysPerAnnum
  );

  const productionBridge = buildProductionBridge(installationProduction);

  // 2. Employee Calculator (Strictly advisory — no impact on production!)
  const employees = calculateEmployeeIndicator(
    config.employeeAssumptions,
    productionBridge
  );

  // 3. Bill of Materials (Excel R51–R66)
  const bom = calculateBillOfMaterials(config.bomComponents, productionBridge);

  // 4. Packaging Costs (Multi-level, Excel R67–R74+)
  const packaging = calculatePackagingCosts(config.packagingLevels);

  // 5a. Reusable Vehicle / Logistics Cost Calculator (Excel R75–R101)
  const vehicleLogistics = calculateVehicleLogisticsCost(
    config.vehicleLogistics,
    installationProduction.dailyKilometersTravelled,
    installationProduction.dailyOperationsCapacity,
    installationProduction.productionDaysPerMonth,
    installationProduction.referenceShiftHours
  );

  // 5b. Optional additional non-vehicle production variable costs (per installation)
  const extraVariableCosts = calculateProductionVariableCosts(
    config.extraVariableCosts || [],
    productionBridge,
    1
  );

  // Combined variable summary so UnitCostDynamicsPanel displays logistics + extra variable items cleanly
  const kmPerOperationEffective =
    installationProduction.dailyOperationsCapacity > 0
      ? vehicleLogistics.kilometerBaseDaily /
        installationProduction.dailyOperationsCapacity
      : 0;

  const vehicleLineItem: VariableCostItemResult = {
    id: 'vehicle-logistics-summary',
    name: `${config.vehicleLogistics.vehicleLabel || 'Vehicle / Logistics'} (${vehicleLogistics.totalCostPerKm.toFixed(2)}/km)`,
    basis: 'per_unit',
    usage: Number(kmPerOperationEffective.toFixed(2)),
    usageUnit: 'km / installation',
    unitRate: vehicleLogistics.totalCostPerKm,
    batchCost: vehicleLogistics.costPerUnit,
    unitCost: vehicleLogistics.costPerUnit,
  };

  const combinedItems: VariableCostItemResult[] = [
    vehicleLineItem,
    ...extraVariableCosts.items,
  ];
  const combinedVariableUnitCost =
    vehicleLogistics.costPerUnit + extraVariableCosts.totalVariableUnitCost;

  const combinedVariableCosts: VariableCostSummaryResult = {
    referenceBatchUnits: 1,
    items: combinedItems,
    totalBatchVariableCost: combinedVariableUnitCost,
    totalVariableUnitCost: combinedVariableUnitCost,
  };

  // 6. Unit Cost Dynamics (Excel R107–R116)
  const materialsUnitCost = bom.totalMaterialsUnitCost;
  const packagingUnitCost = packaging.totalPackagingUnitCost;
  const productionVariableUnitCost = combinedVariableCosts.totalVariableUnitCost;

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
    dailyCapacity: installationProduction.dailyOperationsCapacity,
    monthlyCapacity: installationProduction.monthlyOperationsCapacity,
    employeesIndicated: employees.employeesAdjusted,
  };

  return {
    installationProduction,
    productionBridge,
    employees,
    bom,
    packaging,
    vehicleLogistics,
    extraVariableCosts,
    combinedVariableCosts,
    dynamics,
  };
}

/**
 * Default starter configuration modelled directly on installations services.xlsx:
 * - Production: 1 workstream, 1 emp, 8h shift, 1 shift/day, 60m install + 60m travel = 2h/op -> 4 installations/day, 100 km/op -> 400 km/day
 * - Employee Calculator: 8 hrs/day, 100% efficiency, 0% tolerance -> 1 std, 0 relief, 1 adjusted
 * - BOM: Component 1 (R1,000 + R1 consumables = R1,001) + Component 2 (R2,000 + R1 consumables = R2,001) -> R3,002/installation
 * - Packaging: empty by default (R0.00, supports 2+ dynamic levels)
 * - Vehicle / Logistics: R7.75/km * 400 km/day / 4 jobs/day -> R775.00/installation
 * - Total Modeled Unit Cost: R3,002 + R0 + R775 = R3,777.00/installation
 */
export function createDefaultInstallationServicesConfig(): InstallationServicesProductConfig {
  return {
    processes: [
      {
        id: 'inst-proc-1',
        name: 'Installation Team A',
        numberOfWorkstreams: 1,
        employeesPerWorkstream: 1,
        shiftHours: 8,
        shiftsPerDay: 1,
        productionTimeMinutes: 60,
        travelOrSetupTimeMinutes: 60,
        kilometersPerOperation: 100,
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
        id: 'inst-bom-1',
        name: 'Core Equipment / Hardware Unit',
        unitOfMeasure: 'unit',
        unitsRequiredPerBatch: 1,
        unitDivider: 1,
        packSizeUnits: 1,
        packCost: 1000,
        batchConsumablesCost: 1,
        surplusWasted: true,
      },
      {
        id: 'inst-bom-2',
        name: 'Mounting Kit & Cabling Assembly',
        unitOfMeasure: 'kit',
        unitsRequiredPerBatch: 1,
        unitDivider: 1,
        packSizeUnits: 1,
        packCost: 2000,
        batchConsumablesCost: 1,
        surplusWasted: true,
      },
    ],
    packagingLevels: [],
    vehicleLogistics: createDefaultVehicleLogisticsConfig('Service / Installation Vehicle'),
    extraVariableCosts: [],
    dynamicsOverrides: {
      estimatedUnitCost: 0,
      referenceBatchSizeOverride: 0,
    },
  };
}
