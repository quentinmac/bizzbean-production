import {
  TimeSlotsCapacityMode,
  TimeSlotsFullResult,
  TimeSlotsProcess,
  TimeSlotsProcessResult,
  TimeSlotsProductConfig,
  TimeSlotsProductionSummaryResult,
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
 * 1. TIME SLOTS PRODUCTION CALCULATOR (Multi-Process per Product)
 * Faithful to time slots.xlsx (Rows 22–39):
 * - hoursAvailablePerDay (R29) = numberOfWorkstreams * employeesPerWorkstream * shiftHours * shiftsPerDay
 * - sessionTimeMinutes (R32) = productionTimeMinutes + travelOrSetupTimeMinutes
 * - sessionsPerDay (R33) = floor(hoursAvailablePerDay / (sessionTimeMinutes / 60))
 * - clientOpportunitiesPerDay (R35) = sessionsPerDay * clientsPerSession
 * - clientOpportunitiesPerMonth (R36) = productionDaysPerMonth * clientOpportunitiesPerDay
 * - effectiveOccupancyPct (R37) = IF(occupancyPct <= 0, 100%, occupancyPct)
 * - clientsPerDay = clientOpportunitiesPerDay * (effectiveOccupancyPct / 100)
 * - clientsPerMonth (R38) = clientOpportunitiesPerMonth * (effectiveOccupancyPct / 100)
 * - employeesRequiredStandard (R39) = numberOfWorkstreams * employeesPerWorkstream * shiftsPerDay
 *
 * Supports multiple processes per product in either:
 * - 'sum' mode: parallel rooms / studios / bays / time-slot streams (capacity = combined SUM)
 * - 'bottleneck' mode: sequential stages (e.g. intake -> main session -> debrief; capacity = slowest stage MIN)
 */
export function calculateTimeSlotsProductionSummary(
  processes: TimeSlotsProcess[],
  capacityMode: TimeSlotsCapacityMode,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number,
  clientLabel = 'clients'
): TimeSlotsProductionSummaryResult {
  const daysMonth = Math.max(1, safeNum(productionDaysPerMonth, 19));
  const daysYear = Math.max(1, safeNum(productionDaysPerAnnum, daysMonth * 12));
  const mode: TimeSlotsCapacityMode = capacityMode === 'bottleneck' ? 'bottleneck' : 'sum';
  const unitText = (clientLabel || 'clients').trim() || 'clients';

  const rawResults = processes.map((proc) => {
    const workstreams = Math.max(0, safeNum(proc.numberOfWorkstreams, 0));
    const empPerStream = Math.max(0, safeNum(proc.employeesPerWorkstream, 0));
    const shiftHrs = Math.max(0, safeNum(proc.shiftHours, 0));
    const shifts = Math.max(0, safeNum(proc.shiftsPerDay, 0));
    const prodMins = Math.max(0, safeNum(proc.productionTimeMinutes, 0));
    const setupMins = Math.max(0, safeNum(proc.travelOrSetupTimeMinutes, 0));
    const clientsPerSess = Math.max(0, safeNum(proc.clientsPerSession, 0));
    const rawOccupancy = Math.min(100, Math.max(0, safeNum(proc.occupancyPct, 0)));

    // Excel R29: =E25*E26*E27*24*E28
    const hoursAvailablePerDay = workstreams * empPerStream * shiftHrs * shifts;

    // Excel R32: =SUM(E30:E31)
    const sessionTimeMinutes = prodMins + setupMins;
    const sessionTimeHours = sessionTimeMinutes / 60;

    // Excel R33: =IFERROR(ROUNDDOWN((E29/E32)/24, 0), 0)
    const sessionsPerDay =
      sessionTimeHours > 0 ? Math.floor(hoursAvailablePerDay / sessionTimeHours + 1e-9) : 0;

    // Excel R35: =E33*E34
    const clientOpportunitiesPerDay = sessionsPerDay * clientsPerSess;

    // Excel R36: =F24*F35
    const clientOpportunitiesPerMonth = Math.round(daysMonth * clientOpportunitiesPerDay);

    // Excel R37: =IF($E37=0, 100%, $E37)
    const effectiveOccupancyPct = rawOccupancy <= 0 ? 100 : rawOccupancy;

    // Effective booked clients per day & per month (Excel R38: =F36*F37)
    const clientsPerDay = clientOpportunitiesPerDay * (effectiveOccupancyPct / 100);
    const clientsPerMonth = Math.round(clientOpportunitiesPerMonth * (effectiveOccupancyPct / 100));
    const clientsPerAnnum = Math.round(daysYear * clientsPerDay);

    // Excel R39: =F25*F26*F28
    const employeesRequiredStandard = Math.round(workstreams * empPerStream * shifts);

    return {
      id: proc.id,
      name: proc.name || 'Time-Slot Stream',
      hoursAvailablePerDay,
      sessionTimeMinutes,
      sessionTimeHours,
      sessionsPerDay,
      clientsPerSession: clientsPerSess,
      clientOpportunitiesPerDay,
      clientOpportunitiesPerMonth,
      effectiveOccupancyPct,
      clientsPerDay,
      clientsPerMonth,
      clientsPerAnnum,
      employeesRequiredStandard,
    };
  });

  const activeProcesses = rawResults.filter((p) => p.clientsPerDay > 0);
  const minDailyClients =
    activeProcesses.length > 0
      ? Math.min(...activeProcesses.map((p) => p.clientsPerDay))
      : 0;
  const sumDailyClients = rawResults.reduce((s, p) => s + p.clientsPerDay, 0);

  const dailyClientsCapacity = mode === 'bottleneck' ? minDailyClients : sumDailyClients;

  const computedProcesses: TimeSlotsProcessResult[] = rawResults.map((p) => {
    const isBottleneck =
      mode === 'bottleneck' &&
      activeProcesses.length > 0 &&
      Math.abs(p.clientsPerDay - minDailyClients) < 1e-9;
    const spareDailyClients =
      mode === 'bottleneck' ? Math.max(0, p.clientsPerDay - minDailyClients) : 0;

    return {
      ...p,
      isBottleneck,
      spareDailyClients,
    };
  });

  const bottleneckList = computedProcesses.filter((p) => p.isBottleneck);

  let effectiveHoursPerDay = 0;
  let effectiveSessionsPerDay = 0;
  let effectiveSessionTimeMinutes = 0;
  let dailyClientOpportunities = 0;
  let effectiveOccupancyPct = 0;

  if (mode === 'sum') {
    effectiveHoursPerDay = computedProcesses.reduce((s, p) => s + p.hoursAvailablePerDay, 0);
    effectiveSessionsPerDay = computedProcesses.reduce((s, p) => s + p.sessionsPerDay, 0);
    dailyClientOpportunities = computedProcesses.reduce((s, p) => s + p.clientOpportunitiesPerDay, 0);
    effectiveSessionTimeMinutes =
      effectiveSessionsPerDay > 0
        ? computedProcesses.reduce((s, p) => s + p.sessionTimeMinutes * p.sessionsPerDay, 0) /
          effectiveSessionsPerDay
        : computedProcesses[0]?.sessionTimeMinutes ?? 0;
    effectiveOccupancyPct =
      dailyClientOpportunities > 0
        ? (dailyClientsCapacity / dailyClientOpportunities) * 100
        : 0;
  } else {
    const primaryBottleneck = bottleneckList[0] || computedProcesses[0];
    effectiveHoursPerDay = primaryBottleneck?.hoursAvailablePerDay ?? 0;
    effectiveSessionsPerDay = primaryBottleneck?.sessionsPerDay ?? 0;
    effectiveSessionTimeMinutes = primaryBottleneck?.sessionTimeMinutes ?? 0;
    dailyClientOpportunities = primaryBottleneck?.clientOpportunitiesPerDay ?? 0;
    effectiveOccupancyPct = primaryBottleneck?.effectiveOccupancyPct ?? 0;
  }

  const monthlyClientOpportunities = Math.round(dailyClientOpportunities * daysMonth);
  const monthlyClientsCapacity = Math.round(dailyClientsCapacity * daysMonth);
  const annualClientsCapacity = Math.round(dailyClientsCapacity * daysYear);
  const totalEmployeesStandard = computedProcesses.reduce(
    (sum, p) => sum + p.employeesRequiredStandard,
    0
  );

  return {
    clientLabel: unitText,
    processes: computedProcesses,
    capacityMode: mode,
    effectiveHoursPerDay,
    effectiveSessionsPerDay,
    effectiveSessionTimeMinutes,
    dailyClientOpportunities,
    monthlyClientOpportunities,
    effectiveOccupancyPct,
    dailyClientsCapacity,
    monthlyClientsCapacity,
    annualClientsCapacity,
    bottleneckProcessIds: bottleneckList.map((p) => p.id),
    bottleneckProcessNames: bottleneckList.map((p) => p.name),
    totalEmployeesStandard,
    productionDaysPerMonth: daysMonth,
    productionDaysPerAnnum: daysYear,
  };
}

/**
 * Adapter converting TimeSlotsProductionSummaryResult into ProductionSummaryResult
 * so shared EmployeeCalculatorPanel, BillOfMaterialsPanel, ProductionVariableCostsPanel,
 * and UnitCostDynamicsPanel work natively with exact time slots.xlsx math:
 * - bottleneckDailyCapacity = dailyClientsCapacity (e.g. 40 clients/day -> 760/mo in Results tab)
 * - bottleneckCyclesPerDay = dailyClientsCapacity (BOM qty / client × 40 clients/day)
 * - bottleneckUnitsPerBatch = dailyClientOpportunities (Excel R53 = E35 = 80 -> R100 / 80 = R1.25/client)
 */
function buildProductionBridge(
  timeSlots: TimeSlotsProductionSummaryResult
): ProductionSummaryResult {
  return {
    processes: timeSlots.processes.map((p) => ({
      id: p.id,
      name: p.name,
      productionHoursPerDay: p.hoursAvailablePerDay,
      allocatedUnitsPerBatch: p.clientsPerSession,
      batchTotalTimeMinutes: p.sessionTimeMinutes,
      batchTotalTimeHours: p.sessionTimeHours,
      cyclesPerDay: p.sessionsPerDay,
      grossDailyUnits: p.clientOpportunitiesPerDay,
      netDailyCapacity: p.clientsPerDay,
      monthlyCapacity: p.clientsPerMonth,
      annualCapacity: p.clientsPerAnnum,
      employeesRequiredStandard: p.employeesRequiredStandard,
      isBottleneck: p.isBottleneck,
      spareDailyUnits: p.spareDailyClients,
    })),
    bottleneckDailyCapacity: timeSlots.dailyClientsCapacity,
    bottleneckProcessIds: timeSlots.bottleneckProcessIds,
    bottleneckProcessNames: timeSlots.bottleneckProcessNames,
    bottleneckCyclesPerDay: timeSlots.dailyClientsCapacity,
    bottleneckUnitsPerBatch: timeSlots.dailyClientOpportunities,
    monthlyCapacity: timeSlots.monthlyClientsCapacity,
    annualCapacity: timeSlots.annualClientsCapacity,
    totalEmployeesStandard: timeSlots.totalEmployeesStandard,
    productionDaysPerMonth: timeSlots.productionDaysPerMonth,
    productionDaysPerAnnum: timeSlots.productionDaysPerAnnum,
  };
}

/**
 * FULL TIME SLOTS ENGINE
 * 1. Production Calculator (multi-process sessions, client opportunities, occupancy & daily clients capacity)
 * 2. Employee Calculator (advisory only — zero impact on production)
 * 3. Bill of Materials (dynamic product costing per client / booking)
 * 4. Production Variable Costs (direct utilities, energy, water & maintenance per daily opportunities batch or unit)
 * 5. Unit Cost Dynamics (consolidates materials + variable costs -> transfers to Results tab)
 */
export function calculateTimeSlotsFull(
  config: TimeSlotsProductConfig,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): TimeSlotsFullResult {
  const timeSlotsProduction = calculateTimeSlotsProductionSummary(
    config.processes,
    config.capacityMode ?? 'sum',
    productionDaysPerMonth,
    productionDaysPerAnnum,
    config.clientLabel || 'clients'
  );

  const productionBridge = buildProductionBridge(timeSlotsProduction);

  // 2. Employee Calculator (Strictly advisory — zero impact on production!)
  const employees = calculateEmployeeIndicator(
    config.employeeAssumptions,
    productionBridge
  );

  // 3. Bill of Materials (Dynamic per-client product costing)
  const bom = calculateBillOfMaterials(config.bomComponents, productionBridge);

  // Packaging is not part of Time Slots; keep empty result for shared Dynamics interface
  const packaging = calculatePackagingCosts([]);

  // 4. Production Variable Costs (Excel R52–R73)
  const variableCosts = calculateProductionVariableCosts(
    config.variableCosts,
    productionBridge,
    config.dynamicsOverrides?.referenceBatchSizeOverride
  );

  // 5. Unit Cost Dynamics (Excel R79–R88)
  const materialsUnitCost = bom.totalMaterialsUnitCost;
  const packagingUnitCost = 0;
  const productionVariableUnitCost = variableCosts.totalVariableUnitCost;

  const calculatedUnitCost = materialsUnitCost + productionVariableUnitCost;

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
  const packagingSharePct = 0;
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
    dailyCapacity: timeSlotsProduction.dailyClientsCapacity,
    monthlyCapacity: timeSlotsProduction.monthlyClientsCapacity,
    employeesIndicated: employees.employeesAdjusted,
  };

  return {
    timeSlotsProduction,
    productionBridge,
    employees,
    bom,
    packaging,
    variableCosts,
    dynamics,
  };
}

/**
 * Default starter configuration modelled directly on time slots.xlsx:
 * - Production: 2 workstreams, 1 emp/stream, 8h shift, 1 shift/day -> 16 hrs/day;
 *   60 min session + 60 min travel/setup = 120 min (2h) -> 8 sessions/day × 10 clients/session = 80 client opportunities/day (1,520/mo);
 *   50% occupancy -> 40 clients/day (760 clients/mo); 2 standard employees
 * - Employee Calculator: 8 hrs/day, 100% efficiency, 0% tolerance -> 2 std, 0 relief, 2 adjusted
 * - Bill of Materials: empty by default (R0.00/client; user can add dynamic per-client consumables/materials)
 * - Production Variable Costs: Electricity (10 kW × R10 = R100 / 80 opportunities = R1.25/client) + Gas/Fuel/Water/Maintenance (0)
 * - Total Modeled Unit Cost: R1.25/client (matches time slots.xlsx F84 = 1.25)
 */
export function createDefaultTimeSlotsConfig(): TimeSlotsProductConfig {
  return {
    clientLabel: 'clients',
    processes: [
      {
        id: 'timeslots-proc-1',
        name: 'Studio / Time-Slot Stream A',
        numberOfWorkstreams: 2,
        employeesPerWorkstream: 1,
        shiftHours: 8,
        shiftsPerDay: 1,
        productionTimeMinutes: 60,
        travelOrSetupTimeMinutes: 60,
        clientsPerSession: 10,
        occupancyPct: 50,
      },
    ],
    capacityMode: 'sum',
    employeeAssumptions: {
      hoursPaidPerDay: 8,
      labourEfficiencyPct: 100,
      tolerancePct: 0,
    },
    bomComponents: [],
    variableCosts: [
      {
        id: 'timeslots-var-elec',
        name: 'Electricity',
        basis: 'per_batch',
        usage: 10,
        usageUnit: 'kW',
        unitRate: 10,
      },
      {
        id: 'timeslots-var-gas',
        name: 'Gas',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'kg',
        unitRate: 0,
      },
      {
        id: 'timeslots-var-fuel',
        name: 'Fuel',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'L',
        unitRate: 0,
      },
      {
        id: 'timeslots-var-water',
        name: 'Water',
        basis: 'per_batch',
        usage: 0,
        usageUnit: 'kL',
        unitRate: 0,
      },
      {
        id: 'timeslots-var-maint',
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
