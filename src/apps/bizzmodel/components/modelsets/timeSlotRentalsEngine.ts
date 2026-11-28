import { RevenueItem } from '../../constants';
import {
  ProductionSummaryResult,
  TimeSlotRentalsCapacityMode,
  TimeSlotRentalsFullResult,
  TimeSlotRentalsMonthResult,
  TimeSlotRentalsProcess,
  TimeSlotRentalsProcessResult,
  TimeSlotRentalsProductConfig,
  TimeSlotRentalsProductionSummaryResult,
  TimeSlotRentalsYearGridResult,
} from './modelSetTypes';
import { calculateEmployeeIndicator } from './batchLotsEngine';

const safeNum = (val: unknown, fallback = 0): number => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * 1. TIME SLOT RENTALS PRODUCTION CALCULATOR (Multi-Process per Service Line)
 * Faithful to time slot rentals.xlsx (Rows 22–34):
 * - workstreamHoursAvailablePerDay (R29) = numberOfWorkstreams * workstreamsPerEmployee * shiftHours * shiftsPerDay
 * - rentalTimeHours (R30) = workstreamRentalTimeMinutes / 60
 * - grossRentalsPerDay (R31) = workstreamHoursAvailablePerDay / rentalTimeHours
 * - effectiveRentalsPerDay (R32) = grossRentalsPerDay * (utilizationPct / 100)
 * - rentalsPerMonth (R33) = effectiveRentalsPerDay * productionDaysPerMonth
 * - employeesRequiredStandard (R34) = workstreamsPerEmployee * shiftsPerDay
 *
 * Multi-process aggregation:
 * - 'sum' (default for parallel rental zones / workstation banks / booths): combined SUM
 * - 'bottleneck' (for sequential dependent stages): constraining MIN
 */
export function calculateTimeSlotRentalsProductionSummary(
  processes: TimeSlotRentalsProcess[],
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number,
  capacityMode: TimeSlotRentalsCapacityMode = 'sum',
  rentalLabel = 'rentals'
): TimeSlotRentalsProductionSummaryResult {
  const daysMonth = Math.max(1, safeNum(productionDaysPerMonth, 19));
  const daysYear = Math.max(1, safeNum(productionDaysPerAnnum, daysMonth * 12));
  const mode: TimeSlotRentalsCapacityMode =
    capacityMode === 'bottleneck' ? 'bottleneck' : 'sum';
  const unitText = (rentalLabel || 'rentals').trim() || 'rentals';

  const rawResults = (processes || []).map((proc) => {
    const workstreams = Math.max(0, safeNum(proc.numberOfWorkstreams, 0));
    const workstreamsPerEmp = Math.max(0, safeNum(proc.workstreamsPerEmployee, 0));
    const shiftHrs = Math.max(0, safeNum(proc.shiftHours, 0));
    const shifts = Math.max(0, safeNum(proc.shiftsPerDay, 0));
    const rentalTimeMinutes = Math.max(0, safeNum(proc.workstreamRentalTimeMinutes, 0));
    const utilizationPct = Math.min(100, Math.max(0, safeNum(proc.utilizationPct, 0)));

    // Excel R29: =F25*F26*F27*24*F28
    const workstreamHoursAvailablePerDay = Number(
      (workstreams * workstreamsPerEmp * shiftHrs * shifts).toFixed(4)
    );

    // Excel R30: workstream rental time (h:mm)
    const rentalTimeHours = rentalTimeMinutes / 60;

    // Excel R31: =(F29/F30)/24
    const grossRentalsPerDay =
      rentalTimeHours > 0
        ? Number((workstreamHoursAvailablePerDay / rentalTimeHours).toFixed(4))
        : 0;

    // Excel R32: =F31*$E32
    const effectiveRentalsPerDay = Number(
      (grossRentalsPerDay * (utilizationPct / 100)).toFixed(4)
    );

    // Excel R33: =F32*F24
    const rentalsPerMonth = Number((effectiveRentalsPerDay * daysMonth).toFixed(2));
    const rentalsPerAnnum = Number((effectiveRentalsPerDay * daysYear).toFixed(2));

    // Excel R34: =F26*F28
    const employeesRequiredStandard = Math.round(workstreamsPerEmp * shifts);

    return {
      id: proc.id,
      name: proc.name || 'Rental Zone',
      workstreamHoursAvailablePerDay,
      rentalTimeMinutes,
      rentalTimeHours,
      grossRentalsPerDay,
      utilizationPct,
      effectiveRentalsPerDay,
      rentalsPerMonth,
      rentalsPerAnnum,
      employeesRequiredStandard,
    };
  });

  const activeProcesses = rawResults.filter((p) => p.effectiveRentalsPerDay > 0);
  const minDailyRentals =
    activeProcesses.length > 0
      ? Math.min(...activeProcesses.map((p) => p.effectiveRentalsPerDay))
      : 0;
  const sumDailyRentals = Number(
    rawResults.reduce((s, p) => s + p.effectiveRentalsPerDay, 0).toFixed(4)
  );

  const dailyRentalsCapacity =
    mode === 'bottleneck' ? Number(minDailyRentals.toFixed(4)) : sumDailyRentals;

  const computedProcesses: TimeSlotRentalsProcessResult[] = rawResults.map((p) => {
    const isBottleneck =
      mode === 'bottleneck' &&
      activeProcesses.length > 0 &&
      Math.abs(p.effectiveRentalsPerDay - minDailyRentals) < 1e-9;
    const spareDailyRentals =
      mode === 'bottleneck'
        ? Number(Math.max(0, p.effectiveRentalsPerDay - minDailyRentals).toFixed(2))
        : 0;

    return {
      ...p,
      isBottleneck,
      spareDailyRentals,
    };
  });

  const bottleneckList = computedProcesses.filter((p) => p.isBottleneck);

  let totalWorkstreamHoursAvailablePerDay = 0;
  let grossDailyRentalsCapacity = 0;
  let effectiveRentalTimeMinutes = 0;
  let effectiveUtilizationPct = 0;

  if (mode === 'sum') {
    totalWorkstreamHoursAvailablePerDay = Number(
      computedProcesses
        .reduce((s, p) => s + p.workstreamHoursAvailablePerDay, 0)
        .toFixed(4)
    );
    grossDailyRentalsCapacity = Number(
      computedProcesses.reduce((s, p) => s + p.grossRentalsPerDay, 0).toFixed(4)
    );
    effectiveRentalTimeMinutes =
      grossDailyRentalsCapacity > 0
        ? computedProcesses.reduce(
            (s, p) => s + p.rentalTimeMinutes * p.grossRentalsPerDay,
            0
          ) / grossDailyRentalsCapacity
        : computedProcesses[0]?.rentalTimeMinutes ?? 60;
    effectiveUtilizationPct =
      grossDailyRentalsCapacity > 0
        ? Number(((dailyRentalsCapacity / grossDailyRentalsCapacity) * 100).toFixed(2))
        : 0;
  } else {
    const primary = bottleneckList[0] || computedProcesses[0];
    totalWorkstreamHoursAvailablePerDay = primary?.workstreamHoursAvailablePerDay ?? 0;
    grossDailyRentalsCapacity = primary?.grossRentalsPerDay ?? 0;
    effectiveRentalTimeMinutes = primary?.rentalTimeMinutes ?? 60;
    effectiveUtilizationPct = primary?.utilizationPct ?? 0;
  }

  const monthlyRentalsCapacity = Number((dailyRentalsCapacity * daysMonth).toFixed(2));
  const annualRentalsCapacity = Number((dailyRentalsCapacity * daysYear).toFixed(2));
  const totalEmployeesStandard = computedProcesses.reduce(
    (sum, p) => sum + p.employeesRequiredStandard,
    0
  );

  return {
    rentalLabel: unitText,
    processes: computedProcesses,
    capacityMode: mode,
    totalWorkstreamHoursAvailablePerDay,
    effectiveRentalTimeMinutes,
    grossDailyRentalsCapacity,
    effectiveUtilizationPct,
    dailyRentalsCapacity,
    monthlyRentalsCapacity,
    annualRentalsCapacity,
    bottleneckProcessIds: bottleneckList.map((p) => p.id),
    bottleneckProcessNames: bottleneckList.map((p) => p.name),
    totalEmployeesStandard,
    productionDaysPerMonth: daysMonth,
    productionDaysPerAnnum: daysYear,
  };
}

/**
 * 2. FULL TIME SLOT RENTALS PRODUCTION + ADVISORY EMPLOYEE INDICATOR ENGINE
 * Note: Employee Calculator is strictly advisory and has ZERO impact on production capacity.
 */
export function calculateTimeSlotRentalsFull(
  config: TimeSlotRentalsProductConfig,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): TimeSlotRentalsFullResult {
  const production = calculateTimeSlotRentalsProductionSummary(
    config.processes,
    productionDaysPerMonth,
    productionDaysPerAnnum,
    config.capacityMode || 'sum',
    config.rentalLabel || 'rentals'
  );

  const productionBridge: ProductionSummaryResult = {
    processes: production.processes.map((p) => ({
      id: p.id,
      name: p.name,
      productionHoursPerDay: p.workstreamHoursAvailablePerDay,
      allocatedUnitsPerBatch: 1,
      batchTotalTimeMinutes: p.rentalTimeMinutes,
      batchTotalTimeHours: p.rentalTimeHours,
      cyclesPerDay: p.grossRentalsPerDay,
      grossDailyUnits: p.grossRentalsPerDay,
      netDailyCapacity: p.effectiveRentalsPerDay,
      monthlyCapacity: p.rentalsPerMonth,
      annualCapacity: p.rentalsPerAnnum,
      employeesRequiredStandard: p.employeesRequiredStandard,
      isBottleneck: p.isBottleneck,
      spareDailyUnits: p.spareDailyRentals,
    })),
    bottleneckDailyCapacity: production.dailyRentalsCapacity,
    bottleneckProcessIds: production.bottleneckProcessIds,
    bottleneckProcessNames: production.bottleneckProcessNames,
    bottleneckCyclesPerDay: production.grossDailyRentalsCapacity,
    bottleneckUnitsPerBatch: production.grossDailyRentalsCapacity,
    monthlyCapacity: production.monthlyRentalsCapacity,
    annualCapacity: production.annualRentalsCapacity,
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
 * Default starter configuration modelled directly on time slot rentals.xlsx:
 * - Production: 10 workstreams, 10 workstreams/employee, 8h shift, 2 shifts/day -> 1,600 hrs available/day;
 *   60 min (1:00) rental time -> 1,600 gross rentals/day; 90% utilization -> 1,440 rentals/day (27,360/mo @ 19d);
 *   20 standard employees (= 10 × 2)
 * - Employee Calculator: 8 hrs paid/day, 85% labour efficiency, 16% tolerance -> 0 additional, 20 adjusted
 * - Trading Dynamics: 100% production factor, unit selling price 20.00, commission 1%, other income 1,000
 *   (Monthly Revenue: 27,360 × 20 = 547,200; Variable COS: 0)
 */
export function createDefaultTimeSlotRentalsConfig(
  unitSellingPriceBase = 20,
  commissionOnSalesPct = 1.0,
  otherIncomeMonthlyBase = 1000
): TimeSlotRentalsProductConfig {
  return {
    rentalLabel: 'rentals',
    processes: [
      {
        id: `tsr-proc-${Date.now()}-a`,
        name: 'Rental Zone / Bank A',
        numberOfWorkstreams: 10,
        workstreamsPerEmployee: 10,
        shiftHours: 8,
        shiftsPerDay: 2,
        workstreamRentalTimeMinutes: 60,
        utilizationPct: 90,
      },
    ],
    capacityMode: 'sum',
    employeeAssumptions: {
      hoursPaidPerDay: 8,
      labourEfficiencyPct: 85,
      tolerancePct: 16,
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
 * Resolve 60-month production factor % series for a Time Slot Rentals product.
 */
export function getTimeSlotRentalsProductionFactorSeries60(item: RevenueItem): number[] {
  const cfg = item.timeSlotRentalsConfig;
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
 * Resolve 60-month unit selling price (rate per rental slot) series.
 */
export function getTimeSlotRentalsSellingPriceSeries60(item: RevenueItem): number[] {
  const cfg = item.timeSlotRentalsConfig;
  if (
    cfg &&
    Array.isArray(cfg.unitSellingPriceMonthly) &&
    cfg.unitSellingPriceMonthly.length >= 60
  ) {
    return cfg.unitSellingPriceMonthly.slice(0, 60);
  }
  const base = cfg?.unitSellingPriceBase ?? (item.unitPrice > 0 ? item.unitPrice : 20);
  return new Array(60).fill(base);
}

/**
 * Resolve daily rental capacity (effective rentals/day) directly from the product's
 * multi-process Production Calculator (zero impact from Employee Calculator).
 */
export function getTimeSlotRentalsDailyCapacity(item: RevenueItem): number {
  const cfg = item.timeSlotRentalsConfig;
  if (cfg && Array.isArray(cfg.processes) && cfg.processes.length > 0) {
    const summary = calculateTimeSlotRentalsProductionSummary(
      cfg.processes,
      19,
      228,
      cfg.capacityMode || 'sum',
      cfg.rentalLabel || 'rentals'
    );
    return summary.dailyRentalsCapacity;
  }
  return Math.max(0, safeNum(item.dailyCapacity, 1440));
}

/**
 * Single-month Time Slot Rentals trading calculation shared by both the Results/Charts UI
 * and the 60-month 3-Statement financial projection engine (revenueCalc.ts).
 */
export function calculateTimeSlotRentalsMonthMetrics(
  item: RevenueItem,
  absIdx: number,
  daysWorked: number
): {
  isLaunched: boolean;
  dailyRentalsCapacity: number;
  monthlyRentalsCapacity: number;
  productionFactorPct: number;
  rentalsPerMonth: number;
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

  const dailyRentalsCapacity = getTimeSlotRentalsDailyCapacity(item);
  const monthlyRentalsCapacity = Number((daysWorked * dailyRentalsCapacity).toFixed(2));

  const factorSeries = getTimeSlotRentalsProductionFactorSeries60(item);
  const priceSeries = getTimeSlotRentalsSellingPriceSeries60(item);

  const productionFactorPct = Math.max(0, safeNum(factorSeries[absIdx], 100));
  const unitSellingPrice = Math.max(0, safeNum(priceSeries[absIdx], 20));

  const commPct =
    item.salesCommissionPctMonthly?.[absIdx] ??
    item.timeSlotRentalsConfig?.commissionOnSalesPct ??
    1.0;

  const otherIncome = Math.round(
    item.otherIncomeMonthly?.[absIdx] ??
      item.timeSlotRentalsConfig?.otherIncomeMonthlyBase ??
      1000
  );

  if (!isLaunched) {
    return {
      isLaunched: false,
      dailyRentalsCapacity,
      monthlyRentalsCapacity,
      productionFactorPct: 0,
      rentalsPerMonth: 0,
      unitSellingPrice,
      revenue: 0,
      variableCostOfSales: 0,
      commissionOnSalesPct: commPct,
      gpAdjustmentsCommissionPositive: 0,
      otherIncome,
    };
  }

  const rentalsPerMonth = Number(
    (monthlyRentalsCapacity * (productionFactorPct / 100)).toFixed(2)
  );
  const revenue = Math.round(rentalsPerMonth * unitSellingPrice);
  const gpAdjustmentsCommissionPositive = Math.round(revenue * (commPct / 100));

  return {
    isLaunched: true,
    dailyRentalsCapacity,
    monthlyRentalsCapacity,
    productionFactorPct,
    rentalsPerMonth,
    unitSellingPrice,
    revenue,
    variableCostOfSales: 0,
    commissionOnSalesPct: commPct,
    gpAdjustmentsCommissionPositive,
    otherIncome,
  };
}

/**
 * Builds the 12-month Results & Charts grid for a Time Slot Rentals product for a selected year (1..5).
 */
export function calculateTimeSlotRentalsProductYearGrid(
  item: RevenueItem,
  daysWorked60: number[],
  activeYear: number
): TimeSlotRentalsYearGridResult {
  const startMoIdx = (Math.max(1, Math.min(5, activeYear)) - 1) * 12;
  const yearDays = daysWorked60.slice(startMoIdx, startMoIdx + 12);
  const totalYearDays = yearDays.reduce((s, d) => s + (d || 0), 0) || 228;
  const avgDaysPerMonth = Math.round(totalYearDays / 12) || 19;

  const cfg = item.timeSlotRentalsConfig || createDefaultTimeSlotRentalsConfig();
  const full = calculateTimeSlotRentalsFull(cfg, avgDaysPerMonth, totalYearDays);
  const dailyRentalsCapacity = full.production.dailyRentalsCapacity;

  const factorSeries = getTimeSlotRentalsProductionFactorSeries60(item);
  const priceSeries = getTimeSlotRentalsSellingPriceSeries60(item);
  const otherIncSeries =
    Array.isArray(item.otherIncomeMonthly) && item.otherIncomeMonthly.length >= 60
      ? item.otherIncomeMonthly
      : new Array(60).fill(cfg.otherIncomeMonthlyBase ?? 1000);

  const months: TimeSlotRentalsMonthResult[] = Array.from({ length: 12 }, (_, i) => {
    const absIdx = startMoIdx + i;
    const daysWorked = daysWorked60[absIdx] ?? 19;
    const m = calculateTimeSlotRentalsMonthMetrics(item, absIdx, daysWorked);

    const prevFactor =
      absIdx > 0
        ? safeNum(factorSeries[absIdx - 1], m.productionFactorPct)
        : m.productionFactorPct;
    const productionGrowthFactorPct =
      m.isLaunched && absIdx > 0 && absIdx + 1 > (item.startMonth || 1)
        ? Number((m.productionFactorPct - prevFactor).toFixed(2))
        : 0;

    const prevPrice =
      absIdx > 0
        ? safeNum(priceSeries[absIdx - 1], m.unitSellingPrice)
        : m.unitSellingPrice;
    const sellingPriceAdjustment =
      m.isLaunched && absIdx > 0
        ? Number((m.unitSellingPrice - prevPrice).toFixed(2))
        : 0;

    const prevOtherInc =
      absIdx > 0
        ? safeNum(otherIncSeries[absIdx - 1], m.otherIncome)
        : m.otherIncome;
    const otherIncomeAdjustmentPct =
      absIdx > 0 && prevOtherInc !== 0
        ? Number((((m.otherIncome - prevOtherInc) / Math.abs(prevOtherInc)) * 100).toFixed(2))
        : 0;

    return {
      monthNum: i + 1,
      absMonth: absIdx + 1,
      daysWorked,
      isLaunched: m.isLaunched,
      dailyRentalsCapacity,
      monthlyRentalsCapacity: m.monthlyRentalsCapacity,
      productionFactorPct: m.productionFactorPct,
      productionGrowthFactorPct,
      rentalsPerMonth: m.rentalsPerMonth,
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
  const sumCapacityRentals = Number(
    months.reduce((s, m) => s + m.monthlyRentalsCapacity, 0).toFixed(2)
  );
  const sumRentalsSold = Number(
    months.reduce((s, m) => s + m.rentalsPerMonth, 0).toFixed(2)
  );
  const sumRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const sumGrossProfitAdjustments = months.reduce(
    (s, m) => s + m.grossProfitAdjustments,
    0
  );
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
    sumCapacityRentals > 0
      ? Number(((sumRentalsSold / sumCapacityRentals) * 100).toFixed(1))
      : 0;

  return {
    rentalLabel: full.production.rentalLabel,
    dailyRentalsCapacity,
    grossDailyRentalsCapacity: full.production.grossDailyRentalsCapacity,
    effectiveUtilizationPct: full.production.effectiveUtilizationPct,
    employeesStandard: full.employees.employeesStandard,
    employeesAdjusted: full.employees.employeesAdjusted,
    months,
    totals: {
      totalDaysWorked,
      sumCapacityRentals,
      avgProductionFactorPct,
      sumRentalsSold,
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
