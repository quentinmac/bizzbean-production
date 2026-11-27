import { RevenueItem } from '../../constants';
import {
  ProductionSummaryResult,
  TimeUnitsCapacityMode,
  TimeUnitsFullResult,
  TimeUnitsMonthResult,
  TimeUnitsProcess,
  TimeUnitsProcessResult,
  TimeUnitsProductConfig,
  TimeUnitsProductionSummaryResult,
  TimeUnitsYearGridResult,
} from './modelSetTypes';
import { calculateEmployeeIndicator } from './batchLotsEngine';

const safeNum = (val: unknown, fallback = 0): number => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * 1. TIME UNITS PRODUCTION CALCULATOR (Multi-Process)
 * Faithful to time units.xlsx (R22-R32):
 * - hoursAvailablePerDay = numberOfWorkstreams * employeesPerWorkstream * shiftHours * shiftsPerDay (R29)
 * - effectiveUtilizationPct = IF(workstreamUtilizationPct <= 0, 100, workstreamUtilizationPct) (R30)
 * - productionHoursPerDay = hoursAvailablePerDay * (effectiveUtilizationPct / 100) (R31)
 * - employeesRequiredStandard = numberOfWorkstreams * employeesPerWorkstream * shiftsPerDay (R32)
 *
 * Multi-process aggregation:
 * - 'sum' (default for parallel service workstreams): dailyProductionCapacity = SUM(productionHoursPerDay)
 * - 'bottleneck' (for sequential dependent service stages): dailyProductionCapacity = MIN(active productionHoursPerDay)
 */
export function calculateTimeUnitsProductionSummary(
  processes: TimeUnitsProcess[],
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number,
  capacityMode: TimeUnitsCapacityMode = 'sum'
): TimeUnitsProductionSummaryResult {
  const daysMonth = Math.max(1, safeNum(productionDaysPerMonth, 21));
  const daysYear = Math.max(1, safeNum(productionDaysPerAnnum, daysMonth * 12));

  const rawResults = (processes || []).map((proc) => {
    const workstreams = Math.max(0, safeNum(proc.numberOfWorkstreams, 0));
    const empPerWorkstream = Math.max(0, safeNum(proc.employeesPerWorkstream, 0));
    const shiftHrs = Math.max(0, safeNum(proc.shiftHours, 0));
    const shifts = Math.max(0, safeNum(proc.shiftsPerDay, 0));
    const rawUtil = Math.min(100, Math.max(0, safeNum(proc.workstreamUtilizationPct, 0)));

    // Excel R29: =F25*F26*F27*24*F28
    const hoursAvailablePerDay = Number(
      (workstreams * empPerWorkstream * shiftHrs * shifts).toFixed(4)
    );

    // Excel R30: =IF($E30=0, 100%, $E30)
    const effectiveUtilizationPct = rawUtil <= 0 ? 100 : rawUtil;

    // Excel R31: =IF(F30=0, F29, F29*F30)
    const productionHoursPerDay = Number(
      (hoursAvailablePerDay * (effectiveUtilizationPct / 100)).toFixed(4)
    );

    const monthlyProductionHours = Number((daysMonth * productionHoursPerDay).toFixed(2));
    const annualProductionHours = Number((daysYear * productionHoursPerDay).toFixed(2));

    // Excel R32: =F25*F26*F28
    const employeesRequiredStandard = Math.round(workstreams * empPerWorkstream * shifts);

    return {
      id: proc.id,
      name: proc.name || 'Workstream',
      hoursAvailablePerDay,
      effectiveUtilizationPct,
      productionHoursPerDay,
      monthlyProductionHours,
      annualProductionHours,
      employeesRequiredStandard,
    };
  });

  const activeProcesses = rawResults.filter((p) => p.productionHoursPerDay > 0);
  const minDailyHours =
    activeProcesses.length > 0
      ? Math.min(...activeProcesses.map((p) => p.productionHoursPerDay))
      : 0;
  const sumDailyHours = Number(
    rawResults.reduce((s, p) => s + p.productionHoursPerDay, 0).toFixed(4)
  );
  const totalHoursAvailablePerDay = Number(
    rawResults.reduce((s, p) => s + p.hoursAvailablePerDay, 0).toFixed(4)
  );

  const dailyProductionCapacity =
    capacityMode === 'bottleneck' ? Number(minDailyHours.toFixed(4)) : sumDailyHours;

  const computedProcesses: TimeUnitsProcessResult[] = rawResults.map((p) => {
    const isBottleneck =
      activeProcesses.length > 0 && p.productionHoursPerDay === minDailyHours;
    const spareDailyHours =
      capacityMode === 'bottleneck'
        ? Number(Math.max(0, p.productionHoursPerDay - minDailyHours).toFixed(2))
        : 0;
    return {
      ...p,
      isBottleneck,
      spareDailyHours,
    };
  });

  const bottleneckList = computedProcesses.filter((p) => p.isBottleneck);
  const totalEmployeesStandard = computedProcesses.reduce(
    (sum, p) => sum + p.employeesRequiredStandard,
    0
  );

  return {
    processes: computedProcesses,
    capacityMode,
    totalHoursAvailablePerDay,
    dailyProductionCapacity,
    monthlyCapacityHours: Number((dailyProductionCapacity * daysMonth).toFixed(2)),
    annualCapacityHours: Number((dailyProductionCapacity * daysYear).toFixed(2)),
    bottleneckProcessIds: bottleneckList.map((p) => p.id),
    bottleneckProcessNames: bottleneckList.map((p) => p.name),
    totalEmployeesStandard,
    productionDaysPerMonth: daysMonth,
    productionDaysPerAnnum: daysYear,
  };
}

/**
 * 2. FULL TIME UNITS PRODUCTION + ADVISORY EMPLOYEE INDICATOR ENGINE
 * Note: Employee Calculator is strictly advisory and has ZERO impact on production capacity.
 */
export function calculateTimeUnitsFull(
  config: TimeUnitsProductConfig,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): TimeUnitsFullResult {
  const production = calculateTimeUnitsProductionSummary(
    config.processes,
    productionDaysPerMonth,
    productionDaysPerAnnum,
    config.capacityMode || 'sum'
  );

  // Bridge summary so shared EmployeeCalculatorPanel works natively
  const productionBridge: ProductionSummaryResult = {
    processes: production.processes.map((p) => ({
      id: p.id,
      name: p.name,
      productionHoursPerDay: p.productionHoursPerDay,
      allocatedUnitsPerBatch: p.productionHoursPerDay,
      batchTotalTimeMinutes: 60,
      batchTotalTimeHours: 1,
      cyclesPerDay: p.productionHoursPerDay,
      grossDailyUnits: p.hoursAvailablePerDay,
      netDailyCapacity: p.productionHoursPerDay,
      monthlyCapacity: p.monthlyProductionHours,
      annualCapacity: p.annualProductionHours,
      employeesRequiredStandard: p.employeesRequiredStandard,
      isBottleneck: p.isBottleneck,
      spareDailyUnits: p.spareDailyHours,
    })),
    bottleneckDailyCapacity: production.dailyProductionCapacity,
    bottleneckProcessIds: production.bottleneckProcessIds,
    bottleneckProcessNames: production.bottleneckProcessNames,
    bottleneckCyclesPerDay: production.dailyProductionCapacity,
    bottleneckUnitsPerBatch: production.dailyProductionCapacity,
    monthlyCapacity: production.monthlyCapacityHours,
    annualCapacity: production.annualCapacityHours,
    totalEmployeesStandard: production.totalEmployeesStandard,
    productionDaysPerMonth: production.productionDaysPerMonth,
    productionDaysPerAnnum: production.productionDaysPerAnnum,
  };

  const employees = calculateEmployeeIndicator(
    config.employeeAssumptions,
    productionBridge
  );

  return {
    production,
    productionBridge,
    employees,
  };
}

/**
 * Default starter configuration modelled directly on time units.xlsx:
 * - 1 workstream × 1 employee/workstream × 8 shift hrs × 2 shifts/day = 16.0 hrs available/day
 * - 80% workstream utilization -> 12.8 production hours/day; 2 standard employees
 * - Employee Calculator: 8 hrs paid/day, 85% labour efficiency, 0% tolerance -> +1 relief staff = 3 adjusted
 * - Trading Dynamics: 100% production factor, unit selling price 100, commission 1%, other income 0
 */
export function createDefaultTimeUnitsConfig(
  unitSellingPriceBase = 100,
  commissionOnSalesPct = 1.0,
  otherIncomeMonthlyBase = 0
): TimeUnitsProductConfig {
  return {
    processes: [
      {
        id: `tu-proc-${Date.now()}-a`,
        name: 'Service Process A',
        numberOfWorkstreams: 1,
        employeesPerWorkstream: 1,
        shiftHours: 8,
        shiftsPerDay: 2,
        workstreamUtilizationPct: 80,
      },
    ],
    capacityMode: 'sum',
    employeeAssumptions: {
      hoursPaidPerDay: 8,
      labourEfficiencyPct: 85,
      tolerancePct: 0,
    },
    unitSellingPriceBase,
    unitSellingPriceMonthly: new Array(60).fill(unitSellingPriceBase),
    productionFactorBasePct: 100,
    productionFactorMonthly: new Array(60).fill(100),
    commissionOnSalesPct,
    otherIncomeMonthlyBase,
  };
}

/**
 * Resolve 60-month production factor % series for a Time Units product.
 */
export function getTimeUnitsProductionFactorSeries60(item: RevenueItem): number[] {
  const cfg = item.timeUnitsConfig;
  if (
    cfg &&
    Array.isArray(cfg.productionFactorMonthly) &&
    cfg.productionFactorMonthly.length >= 60
  ) {
    return cfg.productionFactorMonthly.slice(0, 60);
  }
  const base = cfg?.productionFactorBasePct ?? 100;
  return new Array(60).fill(base);
}

/**
 * Resolve 60-month unit selling price (rate per time unit) series for a Time Units product.
 */
export function getTimeUnitsSellingPriceSeries60(item: RevenueItem): number[] {
  const cfg = item.timeUnitsConfig;
  if (
    cfg &&
    Array.isArray(cfg.unitSellingPriceMonthly) &&
    cfg.unitSellingPriceMonthly.length >= 60
  ) {
    return cfg.unitSellingPriceMonthly.slice(0, 60);
  }
  const base = cfg?.unitSellingPriceBase ?? (item.unitPrice > 0 ? item.unitPrice : 100);
  return new Array(60).fill(base);
}

/**
 * Resolve daily production capacity (production hours per day) directly from the product's
 * multi-process Production Calculator (zero impact from Employee Calculator).
 */
export function getTimeUnitsDailyCapacityHours(item: RevenueItem): number {
  const cfg = item.timeUnitsConfig;
  if (cfg && Array.isArray(cfg.processes) && cfg.processes.length > 0) {
    const summary = calculateTimeUnitsProductionSummary(
      cfg.processes,
      21,
      252,
      cfg.capacityMode || 'sum'
    );
    return summary.dailyProductionCapacity;
  }
  return Math.max(0, safeNum(item.dailyCapacity, 12.8));
}

/**
 * Single-month Time Units trading calculation shared by both the Results/Charts UI
 * and the 60-month 3-Statement financial projection engine (revenueCalc.ts).
 */
export function calculateTimeUnitsMonthMetrics(
  item: RevenueItem,
  absIdx: number,
  daysWorked: number
): {
  isLaunched: boolean;
  dailyCapacityHours: number;
  monthlyCapacityHours: number;
  productionFactorPct: number;
  hoursPerMonth: number;
  unitSellingPrice: number;
  revenue: number;
  variableCostOfSales: number;
  commissionOnSalesPct: number;
  gpAdjustmentsCommissionPositive: number;
  otherIncome: number;
} {
  const launchMonth = item.startMonth || 1;
  const absMonthNum = absIdx + 1;
  const isLaunched = absMonthNum >= launchMonth;

  const dailyCapacityHours = getTimeUnitsDailyCapacityHours(item);
  const monthlyCapacityHours = Number((daysWorked * dailyCapacityHours).toFixed(2));

  const factorSeries = getTimeUnitsProductionFactorSeries60(item);
  const priceSeries = getTimeUnitsSellingPriceSeries60(item);

  const productionFactorPct = Math.max(0, safeNum(factorSeries[absIdx], 100));
  const unitSellingPrice = Math.max(0, safeNum(priceSeries[absIdx], 100));

  const commPct =
    item.salesCommissionPctMonthly?.[absIdx] ??
    item.timeUnitsConfig?.commissionOnSalesPct ??
    1.0;

  const otherIncome = Math.round(
    item.otherIncomeMonthly?.[absIdx] ??
      item.timeUnitsConfig?.otherIncomeMonthlyBase ??
      0
  );

  if (!isLaunched) {
    return {
      isLaunched: false,
      dailyCapacityHours,
      monthlyCapacityHours,
      productionFactorPct: 0,
      hoursPerMonth: 0,
      unitSellingPrice,
      revenue: 0,
      variableCostOfSales: 0,
      commissionOnSalesPct: commPct,
      gpAdjustmentsCommissionPositive: 0,
      otherIncome,
    };
  }

  const hoursPerMonth = Number(
    (monthlyCapacityHours * (productionFactorPct / 100)).toFixed(2)
  );
  const revenue = Math.round(hoursPerMonth * unitSellingPrice);
  const gpAdjustmentsCommissionPositive = Math.round(revenue * (commPct / 100));

  return {
    isLaunched: true,
    dailyCapacityHours,
    monthlyCapacityHours,
    productionFactorPct,
    hoursPerMonth,
    unitSellingPrice,
    revenue,
    variableCostOfSales: 0,
    commissionOnSalesPct: commPct,
    gpAdjustmentsCommissionPositive,
    otherIncome,
  };
}

/**
 * Builds the 12-month Results & Charts grid for a Time Units product for a selected year (1..5).
 */
export function calculateTimeUnitsProductYearGrid(
  item: RevenueItem,
  daysWorked60: number[],
  activeYear: number
): TimeUnitsYearGridResult {
  const startMoIdx = (Math.max(1, Math.min(5, activeYear)) - 1) * 12;
  const yearDays = daysWorked60.slice(startMoIdx, startMoIdx + 12);
  const totalYearDays = yearDays.reduce((s, d) => s + (d || 0), 0) || 252;
  const avgDaysPerMonth = Math.round(totalYearDays / 12) || 21;

  const cfg = item.timeUnitsConfig || createDefaultTimeUnitsConfig();
  const full = calculateTimeUnitsFull(cfg, avgDaysPerMonth, totalYearDays);
  const dailyCapacityHours = full.production.dailyProductionCapacity;

  const factorSeries = getTimeUnitsProductionFactorSeries60(item);
  const priceSeries = getTimeUnitsSellingPriceSeries60(item);
  const otherIncSeries =
    Array.isArray(item.otherIncomeMonthly) && item.otherIncomeMonthly.length >= 60
      ? item.otherIncomeMonthly
      : new Array(60).fill(cfg.otherIncomeMonthlyBase ?? 0);

  const months: TimeUnitsMonthResult[] = Array.from({ length: 12 }, (_, i) => {
    const absIdx = startMoIdx + i;
    const daysWorked = daysWorked60[absIdx] ?? 21;
    const m = calculateTimeUnitsMonthMetrics(item, absIdx, daysWorked);

    const prevFactor = absIdx > 0 ? safeNum(factorSeries[absIdx - 1], m.productionFactorPct) : m.productionFactorPct;
    const productionGrowthFactorPct =
      m.isLaunched && absIdx > 0 && absIdx + 1 > (item.startMonth || 1)
        ? Number((m.productionFactorPct - prevFactor).toFixed(2))
        : 0;

    const prevPrice = absIdx > 0 ? safeNum(priceSeries[absIdx - 1], m.unitSellingPrice) : m.unitSellingPrice;
    const sellingPriceAdjustment =
      m.isLaunched && absIdx > 0
        ? Number((m.unitSellingPrice - prevPrice).toFixed(2))
        : 0;

    const prevOtherInc = absIdx > 0 ? safeNum(otherIncSeries[absIdx - 1], m.otherIncome) : m.otherIncome;
    const otherIncomeAdjustmentPct =
      absIdx > 0 && prevOtherInc !== 0
        ? Number((((m.otherIncome - prevOtherInc) / Math.abs(prevOtherInc)) * 100).toFixed(2))
        : 0;

    return {
      monthNum: i + 1,
      absMonth: absIdx + 1,
      daysWorked,
      isLaunched: m.isLaunched,
      dailyCapacityHours,
      monthlyCapacityHours: m.monthlyCapacityHours,
      productionFactorPct: m.productionFactorPct,
      productionGrowthFactorPct,
      hoursPerMonth: m.hoursPerMonth,
      unitSellingPrice: m.unitSellingPrice,
      sellingPriceAdjustment,
      unitCostPrice: 0,
      unitGrossProfit: m.unitSellingPrice,
      revenue: m.revenue,
      variableCostOfSales: 0,
      grossProfit: m.revenue,
      commissionOnSalesPct: m.commissionOnSalesPct,
      grossProfitAdjustments: -m.gpAdjustmentsCommissionPositive,
      otherIncome: m.otherIncome,
      otherIncomeAdjustmentPct,
    };
  });

  const activeMonths = months.filter((m) => m.isLaunched);
  const totalDaysWorked = months.reduce((s, m) => s + m.daysWorked, 0);
  const sumCapacityHours = Number(
    months.reduce((s, m) => s + m.monthlyCapacityHours, 0).toFixed(2)
  );
  const sumHoursSold = Number(
    months.reduce((s, m) => s + m.hoursPerMonth, 0).toFixed(2)
  );
  const sumRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const sumGrossProfitAdjustments = months.reduce((s, m) => s + m.grossProfitAdjustments, 0);
  const sumOtherIncome = months.reduce((s, m) => s + m.otherIncome, 0);

  const avgProductionFactorPct =
    activeMonths.length > 0
      ? Number(
          (
            activeMonths.reduce((s, m) => s + m.productionFactorPct, 0) /
            activeMonths.length
          ).toFixed(2)
        )
      : 0;

  const avgUnitSellingPrice =
    activeMonths.length > 0
      ? Number(
          (
            activeMonths.reduce((s, m) => s + m.unitSellingPrice, 0) /
            activeMonths.length
          ).toFixed(2)
        )
      : cfg.unitSellingPriceBase;

  const avgCommissionPct =
    activeMonths.length > 0
      ? Number(
          (
            activeMonths.reduce((s, m) => s + m.commissionOnSalesPct, 0) /
            activeMonths.length
          ).toFixed(2)
        )
      : cfg.commissionOnSalesPct;

  const utilizationOfCapacityPct =
    sumCapacityHours > 0 ? Number(((sumHoursSold / sumCapacityHours) * 100).toFixed(1)) : 0;

  return {
    dailyCapacityHours,
    employeesStandard: full.employees.employeesStandard,
    employeesAdjusted: full.employees.employeesAdjusted,
    months,
    totals: {
      totalDaysWorked,
      sumCapacityHours,
      avgProductionFactorPct,
      sumHoursSold,
      avgUnitSellingPrice,
      sumRevenue,
      sumVariableCos: 0,
      sumGrossProfit: sumRevenue,
      avgCommissionPct,
      sumGrossProfitAdjustments,
      sumOtherIncome,
      utilizationOfCapacityPct,
    },
  };
}
