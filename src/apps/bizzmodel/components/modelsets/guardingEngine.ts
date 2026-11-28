import {
  GuardingProcess,
  GuardingProcessResult,
  GuardingProductConfig,
  GuardingProductionSummaryResult,
  GuardingFullResult,
  GuardingMonthResult,
  GuardingYearGridResult,
  ProductionSummaryResult,
} from './modelSetTypes';
import { calculateEmployeeIndicator } from './batchLotsEngine';
import { RevenueItem } from '../../constants';

function safeNum(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * 1. GUARDING PRODUCTION CALCULATOR (Site / Workstream Shift Staffing)
 * Faithful to guarding.xlsx (R22-R29):
 *   R25: number of workstreams (per site template, default 1)
 *   R26: guards per workstream (per shift, default 1)
 *   R27: shift hours (default 8.0 hrs = 08:00)
 *   R28: shifts per day (default 1)
 *   R29: guards per day = numberOfWorkstreams * guardsPerWorkstream * shiftsPerDay
 * Supports multiple guard post tiers per site (summed into standardGuardsPerWorkstream).
 */
export function calculateGuardingProductionSummary(
  config: GuardingProductConfig,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): GuardingProductionSummaryResult {
  const daysMonth = Math.max(0, safeNum(productionDaysPerMonth, 19));
  const daysYear = Math.max(0, safeNum(productionDaysPerAnnum, daysMonth * 12));
  const guardLabel = (config.guardUnitLabel || 'guards').trim() || 'guards';
  const siteLabel = (config.siteUnitLabel || 'workstreams').trim() || 'workstreams';

  const processes =
    config.processes && config.processes.length > 0
      ? config.processes
      : [createDefaultGuardingProcess()];

  const computedProcesses: GuardingProcessResult[] = processes.map((proc) => {
    const numberOfWorkstreams = Math.max(0, safeNum(proc.numberOfWorkstreams, 1));
    const guardsPerWorkstream = Math.max(0, safeNum(proc.guardsPerWorkstream, 1));
    const shiftHours = Math.min(24, Math.max(0, safeNum(proc.shiftHours, 8)));
    const shiftsPerDay = Math.max(0, safeNum(proc.shiftsPerDay, 1));

    // Excel R29: =F25*F26*F28
    const guardsPerDay = Number(
      (numberOfWorkstreams * guardsPerWorkstream * shiftsPerDay).toFixed(2)
    );
    const dailyCoverageHours = Number((guardsPerDay * shiftHours).toFixed(2));

    return {
      id: proc.id,
      name: proc.name || 'Guard Post',
      numberOfWorkstreams,
      guardsPerWorkstream,
      shiftHours,
      shiftsPerDay,
      guardsPerDay,
      dailyCoverageHours,
    };
  });

  const standardGuardsPerWorkstream = Number(
    computedProcesses.reduce((sum, p) => sum + p.guardsPerDay, 0).toFixed(2)
  );
  const totalDailyCoverageHours = Number(
    computedProcesses.reduce((sum, p) => sum + p.dailyCoverageHours, 0).toFixed(2)
  );

  return {
    guardLabel,
    siteLabel,
    processes: computedProcesses,
    standardGuardsPerWorkstream,
    totalDailyCoverageHours,
    productionDaysPerMonth: daysMonth,
    productionDaysPerAnnum: daysYear,
  };
}

/**
 * 2. FULL GUARDING CALCULATION
 * Connects Production Calculator (R22-R29) -> Relief Guard / Employee Calculator (R30-R41)
 * -> Trading Dynamics (R42-R57) -> Trading Account (R58-R72).
 *
 * Unlike advisory-only model-sets, in Guarding Services:
 *   R45 (guards per workstream) = R41 (employees required - adjusted)
 *   R46 (guards sold)           = R43 (active workstreams) * R45 (guards per workstream)
 *   R60 (revenue)               = R46 * R47 (guard selling price)
 *   R62 (variable COS)          = R46 * R49 (unit cost per guard)
 */
export function calculateGuardingFull(
  config: GuardingProductConfig,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): GuardingFullResult {
  const production = calculateGuardingProductionSummary(
    config,
    productionDaysPerMonth,
    productionDaysPerAnnum
  );

  // Adapter matching ProductionSummaryResult so calculateEmployeeIndicator & EmployeeCalculatorPanel work seamlessly
  const productionBridge: ProductionSummaryResult = {
    processes: production.processes.map((p) => ({
      id: p.id,
      name: p.name,
      productionHoursPerDay: p.dailyCoverageHours,
      allocatedUnitsPerBatch: p.guardsPerWorkstream,
      batchTotalTimeMinutes: p.shiftHours * 60,
      batchTotalTimeHours: p.shiftHours,
      cyclesPerDay: p.shiftsPerDay,
      grossDailyUnits: p.guardsPerDay,
      netDailyCapacity: p.guardsPerDay,
      monthlyCapacity: p.guardsPerDay,
      annualCapacity: p.guardsPerDay * 12,
      employeesRequiredStandard: p.guardsPerDay,
      isBottleneck: false,
      spareDailyUnits: 0,
    })),
    bottleneckDailyCapacity: production.standardGuardsPerWorkstream,
    bottleneckProcessIds: [],
    bottleneckProcessNames: [],
    bottleneckCyclesPerDay: production.processes[0]?.shiftsPerDay ?? 1,
    bottleneckUnitsPerBatch: production.processes[0]?.guardsPerWorkstream ?? 1,
    monthlyCapacity: production.standardGuardsPerWorkstream,
    annualCapacity: production.standardGuardsPerWorkstream * 12,
    totalEmployeesStandard: production.standardGuardsPerWorkstream,
    productionDaysPerMonth: production.productionDaysPerMonth,
    productionDaysPerAnnum: production.productionDaysPerAnnum,
  };

  const employees = calculateEmployeeIndicator(config.employeeCalc, productionBridge);

  // R45 = R41 (standard guards + relief guards per workstream)
  const guardsPerWorkstreamAdjusted = Math.max(0, employees.employeesAdjusted);
  const baseWorkstreams = Math.max(0, safeNum(config.workstreamsBase, 20));
  const baseGuardsSold = Number((baseWorkstreams * guardsPerWorkstreamAdjusted).toFixed(2));
  const guardSellingPrice = Math.max(0, safeNum(config.guardSellingPriceBase, 12000));
  const unitCostPerGuard = Math.max(0, safeNum(config.unitCostPerGuardBase, 7500));
  const commissionPct = Math.max(0, safeNum(config.commissionOnSalesPct, 1.0));
  const otherIncome = safeNum(config.otherIncomeMonthlyBase, 2000);

  const baseMonthlyRevenue = Math.round(baseGuardsSold * guardSellingPrice);
  const baseMonthlyVariableCos = Math.round(baseGuardsSold * unitCostPerGuard);
  const baseUnitGrossProfit = Number((guardSellingPrice - unitCostPerGuard).toFixed(2));
  const baseGrossProfitMarginPct =
    guardSellingPrice > 0
      ? Number(((baseUnitGrossProfit / guardSellingPrice) * 100).toFixed(2))
      : 0;
  const baseMonthlyGrossProfit = baseMonthlyRevenue - baseMonthlyVariableCos;
  const baseMonthlyCommission = Math.round(baseMonthlyRevenue * (commissionPct / 100));

  return {
    production,
    productionBridge,
    employees,
    guardsPerWorkstreamAdjusted,
    baseWorkstreams,
    baseGuardsSold,
    baseMonthlyRevenue,
    baseMonthlyVariableCos,
    baseUnitGrossProfit,
    baseGrossProfitMarginPct,
    baseMonthlyGrossProfit,
    baseMonthlyCommission,
    baseMonthlyOtherIncome: Math.round(otherIncome),
  };
}

export function createDefaultGuardingProcess(
  name = 'Standard Guard Post',
  idx = 1
): GuardingProcess {
  return {
    id: `grd-proc-${idx}-${Date.now()}`,
    name,
    numberOfWorkstreams: 1, // R25 = 1
    guardsPerWorkstream: 1, // R26 = 1
    shiftHours: 8,          // R27 = 08:00
    shiftsPerDay: 1,        // R28 = 1 -> R29 = 1 guard/day
  };
}

/**
 * Default Guarding configuration matching guarding.xlsx exactly:
 * - Production: 1 workstream * 1 guard * 1 shift (8h) = 1 guard/day
 * - Relief Calculator: 8h/day, 85% efficiency, 0% tolerance -> +1 relief = 2 guards/workstream
 * - Trading: 20 active workstreams * 2 guards = 40 guards sold
 * - Selling price: R12,000/guard/mo -> Revenue R480,000/mo (R5,760,000/yr)
 * - Unit cost: R7,500/guard/mo -> Variable COS R300,000/mo (R3,600,000/yr)
 * - Commission: 1.00% (-R4,800/mo) | Other income: R2,000/mo
 */
export function createDefaultGuardingConfig(
  workstreamsBase = 20,
  guardSellingPriceBase = 12000,
  unitCostPerGuardBase = 7500,
  commissionOnSalesPct = 1.0,
  otherIncomeMonthlyBase = 2000
): GuardingProductConfig {
  return {
    guardUnitLabel: 'guards',
    siteUnitLabel: 'workstreams',
    processes: [
      {
        id: 'grd-proc-1',
        name: 'Standard Guard Post',
        numberOfWorkstreams: 1,
        guardsPerWorkstream: 1,
        shiftHours: 8,
        shiftsPerDay: 1,
      },
    ],
    employeeCalc: {
      hoursPaidPerDay: 8,
      labourEfficiencyPct: 85,
      tolerancePct: 0, // R39 = 0.00% in guarding.xlsx (posts cannot be left unmanned)
    },
    workstreamsBase,
    workstreamsMonthly: new Array(60).fill(workstreamsBase),
    guardSellingPriceBase,
    guardSellingPriceMonthly: new Array(60).fill(guardSellingPriceBase),
    unitCostPerGuardBase,
    unitCostPerGuardMonthly: new Array(60).fill(unitCostPerGuardBase),
    commissionOnSalesPct,
    otherIncomeMonthlyBase,
  };
}

/**
 * Resolve 60-month active workstreams (client sites) series (R43)
 */
export function getGuardingWorkstreamsSeries60(item: RevenueItem): number[] {
  const cfg = item.guardingConfig;
  const base = cfg?.workstreamsBase ?? 20;
  if (cfg?.workstreamsMonthly && cfg.workstreamsMonthly.length >= 60) {
    return cfg.workstreamsMonthly.slice(0, 60);
  }
  return new Array(60).fill(base);
}

/**
 * Resolve 60-month guard selling price series (R47)
 */
export function getGuardingSellingPriceSeries60(item: RevenueItem): number[] {
  const cfg = item.guardingConfig;
  const base =
    cfg?.guardSellingPriceBase ?? (item.unitPrice > 0 ? item.unitPrice : 12000);
  if (cfg?.guardSellingPriceMonthly && cfg.guardSellingPriceMonthly.length >= 60) {
    return cfg.guardSellingPriceMonthly.slice(0, 60);
  }
  return new Array(60).fill(base);
}

/**
 * Resolve 60-month direct unit cost per guard series (R49)
 */
export function getGuardingUnitCostSeries60(item: RevenueItem): number[] {
  const cfg = item.guardingConfig;
  const base =
    cfg?.unitCostPerGuardBase ??
    (item.unitCost !== undefined && item.unitCost > 0 ? item.unitCost : 7500);
  if (cfg?.unitCostPerGuardMonthly && cfg.unitCostPerGuardMonthly.length >= 60) {
    return cfg.unitCostPerGuardMonthly.slice(0, 60);
  }
  return new Array(60).fill(base);
}

/**
 * Compute single-month guarding metrics (used by both the 60-month 3-Statement engine
 * in revenueCalc.ts and the Results/Charts views so numbers match to the exact Rand).
 */
export function calculateGuardingMonthMetrics(
  item: RevenueItem,
  absIdx: number,
  daysWorked: number
): {
  isLaunched: boolean;
  workstreams: number;
  guardsPerWorkstream: number;
  guardsSold: number;
  guardSellingPrice: number;
  unitCostPerGuard: number;
  unitGrossProfit: number;
  revenue: number;
  variableCostOfSalesPositive: number;
  variableGrossProfit: number;
  commissionOnSalesPct: number;
  gpAdjustmentsCommissionPositive: number;
  otherIncome: number;
} {
  const absMonth = absIdx + 1;
  const launchMonth = Math.max(1, item.startMonth || 1);
  const isLaunched = absMonth >= launchMonth;

  const cfg = item.guardingConfig || createDefaultGuardingConfig();
  const effectiveDays = Math.max(1, safeNum(daysWorked, 19));
  const full = calculateGuardingFull(cfg, effectiveDays, effectiveDays * 12);
  const guardsPerWorkstream = full.guardsPerWorkstreamAdjusted;

  const workstreamsArr = getGuardingWorkstreamsSeries60(item);
  const sellPriceArr = getGuardingSellingPriceSeries60(item);
  const unitCostArr = getGuardingUnitCostSeries60(item);

  const workstreams = Math.max(0, safeNum(workstreamsArr[absIdx], cfg.workstreamsBase));
  const guardSellingPrice = Math.max(
    0,
    safeNum(sellPriceArr[absIdx], cfg.guardSellingPriceBase)
  );
  const unitCostPerGuard = Math.max(
    0,
    safeNum(unitCostArr[absIdx], cfg.unitCostPerGuardBase)
  );
  const commissionOnSalesPct = Math.max(
    0,
    safeNum(item.salesCommissionPctMonthly?.[absIdx], cfg.commissionOnSalesPct ?? 1.0)
  );
  const otherIncome = Math.round(
    safeNum(item.otherIncomeMonthly?.[absIdx], cfg.otherIncomeMonthlyBase ?? 2000)
  );

  if (!isLaunched) {
    return {
      isLaunched: false,
      workstreams: 0,
      guardsPerWorkstream,
      guardsSold: 0,
      guardSellingPrice,
      unitCostPerGuard,
      unitGrossProfit: Number((guardSellingPrice - unitCostPerGuard).toFixed(2)),
      revenue: 0,
      variableCostOfSalesPositive: 0,
      variableGrossProfit: 0,
      commissionOnSalesPct,
      gpAdjustmentsCommissionPositive: 0,
      otherIncome,
    };
  }

  // Excel R46: guardsSold = workstreams * guardsPerWorkstream
  const guardsSold = Number((workstreams * guardsPerWorkstream).toFixed(2));
  // Excel R60: revenue = guardsSold * guardSellingPrice
  const revenue = Math.round(guardsSold * guardSellingPrice);
  // Excel R62: variable COS = guardsSold * unitCostPerGuard (direct guard wages)
  const variableCostOfSalesPositive = Math.round(guardsSold * unitCostPerGuard);
  const variableGrossProfit = revenue - variableCostOfSalesPositive;
  // Excel R53/R69: commission on sales
  const gpAdjustmentsCommissionPositive = Math.round(
    revenue * (commissionOnSalesPct / 100)
  );

  return {
    isLaunched: true,
    workstreams,
    guardsPerWorkstream,
    guardsSold,
    guardSellingPrice,
    unitCostPerGuard,
    unitGrossProfit: Number((guardSellingPrice - unitCostPerGuard).toFixed(2)),
    revenue,
    variableCostOfSalesPositive,
    variableGrossProfit,
    commissionOnSalesPct,
    gpAdjustmentsCommissionPositive,
    otherIncome,
  };
}

/**
 * 12-Month Grid for Guarding Results & Charts (Years 1-5)
 * Faithful to guarding.xlsx Rows 42-71.
 */
export function calculateGuardingProductYearGrid(
  item: RevenueItem,
  daysWorked60: number[],
  activeYear: number
): GuardingYearGridResult {
  const cfg = item.guardingConfig || createDefaultGuardingConfig();
  const startIdx = Math.max(0, (activeYear - 1) * 12);
  const avgDaysYear =
    daysWorked60
      .slice(startIdx, startIdx + 12)
      .reduce((s, d) => s + (d || 19), 0) / 12 || 19;

  const fullSummary = calculateGuardingFull(cfg, avgDaysYear, avgDaysYear * 12);

  const workstreamsArr = getGuardingWorkstreamsSeries60(item);
  const sellPriceArr = getGuardingSellingPriceSeries60(item);
  const unitCostArr = getGuardingUnitCostSeries60(item);

  const months: GuardingMonthResult[] = [];
  for (let m = 0; m < 12; m++) {
    const absIdx = startIdx + m;
    const absMonth = absIdx + 1;
    const daysWorked = daysWorked60[absIdx] ?? 19;
    const metrics = calculateGuardingMonthMetrics(item, absIdx, daysWorked);

    const prevWorkstreams =
      absIdx > 0
        ? safeNum(workstreamsArr[absIdx - 1], cfg.workstreamsBase)
        : cfg.workstreamsBase;
    const workstreamsDelta = metrics.isLaunched
      ? Number((metrics.workstreams - prevWorkstreams).toFixed(2))
      : 0;

    const prevPrice =
      absIdx > 0
        ? safeNum(sellPriceArr[absIdx - 1], cfg.guardSellingPriceBase)
        : cfg.guardSellingPriceBase;
    const sellingPriceDelta = metrics.isLaunched
      ? Number((metrics.guardSellingPrice - prevPrice).toFixed(2))
      : 0;

    const prevUnitCost =
      absIdx > 0
        ? safeNum(unitCostArr[absIdx - 1], cfg.unitCostPerGuardBase)
        : cfg.unitCostPerGuardBase;
    const unitCostAdjustmentPct =
      metrics.isLaunched && prevUnitCost > 0
        ? Number((((metrics.unitCostPerGuard - prevUnitCost) / prevUnitCost) * 100).toFixed(2))
        : 0;

    const prevOther =
      absIdx > 0
        ? safeNum(item.otherIncomeMonthly?.[absIdx - 1], cfg.otherIncomeMonthlyBase ?? 2000)
        : cfg.otherIncomeMonthlyBase ?? 2000;
    const otherIncomeAdjustmentPct =
      prevOther !== 0
        ? Number((((metrics.otherIncome - prevOther) / Math.abs(prevOther)) * 100).toFixed(2))
        : 0;

    const grossProfitAdjustments = -metrics.gpAdjustmentsCommissionPositive;
    const remainingGrossProfit = metrics.variableGrossProfit + grossProfitAdjustments;
    const netTradingContribution = remainingGrossProfit + metrics.otherIncome;
    const unitGrossProfitMarginPct =
      metrics.guardSellingPrice > 0
        ? Number(((metrics.unitGrossProfit / metrics.guardSellingPrice) * 100).toFixed(2))
        : 0;

    months.push({
      monthNum: m + 1,
      absMonth,
      daysWorked,
      isLaunched: metrics.isLaunched,
      workstreams: metrics.workstreams,
      workstreamsDelta,
      guardsPerWorkstream: metrics.guardsPerWorkstream,
      guardsSold: metrics.guardsSold,
      guardSellingPrice: metrics.guardSellingPrice,
      sellingPriceDelta,
      unitCostPerGuard: metrics.unitCostPerGuard,
      unitCostAdjustmentPct,
      unitGrossProfit: metrics.unitGrossProfit,
      unitGrossProfitMarginPct,
      revenue: metrics.revenue,
      variableCostOfSales: metrics.variableCostOfSalesPositive,
      variableGrossProfit: metrics.variableGrossProfit,
      commissionOnSalesPct: metrics.commissionOnSalesPct,
      grossProfitAdjustments,
      remainingGrossProfit,
      otherIncome: metrics.otherIncome,
      otherIncomeAdjustmentPct,
      netTradingContribution,
    });
  }

  const launchedMonths = months.filter((m) => m.isLaunched);
  const totalDaysWorked = months.reduce((s, m) => s + m.daysWorked, 0);
  const sumGuardMonthsSold = Number(
    months.reduce((s, m) => s + m.guardsSold, 0).toFixed(2)
  );
  const avgWorkstreams =
    launchedMonths.length > 0
      ? Number(
          (
            launchedMonths.reduce((s, m) => s + m.workstreams, 0) /
            launchedMonths.length
          ).toFixed(1)
        )
      : 0;
  const endWorkstreams =
    launchedMonths.length > 0
      ? launchedMonths[launchedMonths.length - 1].workstreams
      : 0;
  const avgGuardsSold =
    launchedMonths.length > 0
      ? Number((sumGuardMonthsSold / launchedMonths.length).toFixed(1))
      : 0;

  const sumRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const sumVariableCos = months.reduce((s, m) => s + m.variableCostOfSales, 0);
  const sumVariableGrossProfit = sumRevenue - sumVariableCos;
  const sumGrossProfitAdjustments = months.reduce(
    (s, m) => s + m.grossProfitAdjustments,
    0
  );
  const sumRemainingGrossProfit = sumVariableGrossProfit + sumGrossProfitAdjustments;
  const sumOtherIncome = months.reduce((s, m) => s + m.otherIncome, 0);
  const sumNetTradingContribution = sumRemainingGrossProfit + sumOtherIncome;

  const avgGuardSellingPrice =
    sumGuardMonthsSold > 0
      ? Number((sumRevenue / sumGuardMonthsSold).toFixed(2))
      : cfg.guardSellingPriceBase;
  const avgUnitCostPerGuard =
    sumGuardMonthsSold > 0
      ? Number((sumVariableCos / sumGuardMonthsSold).toFixed(2))
      : cfg.unitCostPerGuardBase;
  const avgUnitGrossProfit = Number(
    (avgGuardSellingPrice - avgUnitCostPerGuard).toFixed(2)
  );
  const avgGrossProfitMarginPct =
    sumRevenue > 0
      ? Number(((sumVariableGrossProfit / sumRevenue) * 100).toFixed(2))
      : 0;
  const avgCommissionPct =
    sumRevenue > 0
      ? Number(((Math.abs(sumGrossProfitAdjustments) / sumRevenue) * 100).toFixed(2))
      : cfg.commissionOnSalesPct;

  return {
    guardLabel: fullSummary.production.guardLabel,
    siteLabel: fullSummary.production.siteLabel,
    standardGuardsPerWorkstream: fullSummary.production.standardGuardsPerWorkstream,
    reliefGuardsPerWorkstream: fullSummary.employees.employeesAdditional,
    guardsPerWorkstreamAdjusted: fullSummary.guardsPerWorkstreamAdjusted,
    months,
    totals: {
      totalDaysWorked,
      avgWorkstreams,
      endWorkstreams,
      avgGuardsSold,
      sumGuardMonthsSold,
      avgGuardSellingPrice,
      avgUnitCostPerGuard,
      avgUnitGrossProfit,
      avgGrossProfitMarginPct,
      sumRevenue,
      sumVariableCos,
      sumVariableGrossProfit,
      avgCommissionPct,
      sumGrossProfitAdjustments,
      sumRemainingGrossProfit,
      sumOtherIncome,
      sumNetTradingContribution,
    },
  };
}
