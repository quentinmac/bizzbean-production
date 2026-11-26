import { RevenueItem } from '../../constants';
import {
  CommissionCategory,
  CommissionCategorySummary,
  CommissionMonthResult,
  CommissionProductConfig,
  CommissionYearGridResult,
} from './modelSetTypes';

export const DEFAULT_COMMISSION_CATEGORIES: CommissionCategory[] = [
  {
    id: 'comm-cat-1',
    name: 'Core Agency & Brokerage Lines',
    commissionRatePct: 10.0,
    description: 'Standard third-party agency / brokerage lines earning 10.00% commission on principal sales',
  },
  {
    id: 'comm-cat-2',
    name: 'Exclusive & Advisory Mandates',
    commissionRatePct: 15.0,
    description: 'Higher-rate specialist mandates and exclusive representation agreements',
  },
  {
    id: 'comm-cat-3',
    name: 'High-Volume / Institutional Accounts',
    commissionRatePct: 5.0,
    description: 'Large-ticket or bulk principal volume agreements at negotiated brokerage rates',
  },
];

export function createDefaultCommissionCategories(): CommissionCategory[] {
  return DEFAULT_COMMISSION_CATEGORIES.map((c) => ({ ...c }));
}

export function createDefaultCommissionConfig(
  categoryId = 'comm-cat-1',
  dailyPrincipalSalesBase = 20000,
  commissionOnSalesPct = 1.0,
  otherIncomeMonthlyBase = 10000
): CommissionProductConfig {
  return {
    categoryId,
    dailyPrincipalSalesBase,
    dailyPrincipalSalesMonthly: new Array(60).fill(dailyPrincipalSalesBase),
    commissionOnSalesPct,
    otherIncomeMonthlyBase,
  };
}

/**
 * Resolves the governing Product Category for a Commission product/service.
 */
export function resolveCommissionCategory(
  product: RevenueItem,
  categories: CommissionCategory[]
): CommissionCategory {
  const safeCats = categories.length > 0 ? categories : DEFAULT_COMMISSION_CATEGORIES;
  const targetId = product.commissionCategoryId || product.commissionConfig?.categoryId;
  return safeCats.find((c) => c.id === targetId) || safeCats[0];
}

/**
 * Resolves the 60-month daily principal value sales array for a commission line.
 */
export function getCommissionDailyPrincipalSeries60(product: RevenueItem): number[] {
  const series = product.commissionConfig?.dailyPrincipalSalesMonthly;
  if (Array.isArray(series) && series.length >= 60) {
    return series;
  }
  const base = product.commissionConfig?.dailyPrincipalSalesBase ?? 20000;
  return new Array(60).fill(base);
}

/**
 * Computes the authentic Commission 12-month grid for a single product/service & active year (1..5),
 * matching commission.PNG:
 * - Principal Value Sales = daysWorked * dailyPrincipalSales (0 before startMonth)
 * - Commission Revenue = round(principalValueSales * (category.commissionRatePct / 100))
 *   (Transferred to Trading Account as Revenue with ZERO Cost of Sales)
 * - Gross Profit Adjustments = -round(principalValueSales * (commissionOnSalesPct / 100))
 * - Other Income = otherIncomeMonthly[absIdx] (applies across all months)
 */
export function calculateCommissionProductYearGrid(
  product: RevenueItem,
  categories: CommissionCategory[],
  daysWorked60: number[],
  activeYear: number
): CommissionYearGridResult {
  const category = resolveCommissionCategory(product, categories);
  const commissionRatePct = Math.max(0, Math.min(100, Number(category.commissionRatePct) || 0));
  const launchMonth = product.startMonth || 1;

  const dailySeries = getCommissionDailyPrincipalSeries60(product);
  const commOnSalesSeries =
    Array.isArray(product.salesCommissionPctMonthly) && product.salesCommissionPctMonthly.length >= 60
      ? product.salesCommissionPctMonthly
      : new Array(60).fill(product.commissionConfig?.commissionOnSalesPct ?? 1.0);
  const otherIncSeries =
    Array.isArray(product.otherIncomeMonthly) && product.otherIncomeMonthly.length >= 60
      ? product.otherIncomeMonthly
      : new Array(60).fill(product.commissionConfig?.otherIncomeMonthlyBase ?? 0);

  const startMoIdx = (Math.max(1, Math.min(5, activeYear)) - 1) * 12;

  const months: CommissionMonthResult[] = Array.from({ length: 12 }, (_, i) => {
    const absIdx = startMoIdx + i;
    const absMonth = absIdx + 1;
    const daysWorked = daysWorked60[absIdx] ?? 21;
    const isLaunched = absMonth >= launchMonth;

    const rawDaily = Math.max(0, Number(dailySeries[absIdx]) || 0);
    const prevRawDaily = absIdx > 0 ? Math.max(0, Number(dailySeries[absIdx - 1]) || 0) : rawDaily;
    const prevWasLaunched = absMonth - 1 >= launchMonth;

    const dailyPrincipalSales = isLaunched ? rawDaily : 0;
    const dailyPrincipalSalesGrowthPct =
      isLaunched && prevWasLaunched && prevRawDaily > 0
        ? Number((((rawDaily - prevRawDaily) / prevRawDaily) * 100).toFixed(2))
        : 0;

    const principalValueSales = isLaunched ? Math.round(daysWorked * dailyPrincipalSales) : 0;
    const commissionRevenue = isLaunched
      ? Math.round(principalValueSales * (commissionRatePct / 100))
      : 0;

    const commissionOnSalesPct = Number(commOnSalesSeries[absIdx] ?? 1.0);
    const grossProfitAdjustments = isLaunched
      ? -Math.round(principalValueSales * (commissionOnSalesPct / 100))
      : 0;

    const otherIncome = Math.round(Number(otherIncSeries[absIdx]) || 0);
    const prevOtherIncome =
      absIdx > 0 ? Math.round(Number(otherIncSeries[absIdx - 1]) || 0) : otherIncome;
    const otherIncomeAdjustmentPct =
      absIdx > 0 && prevOtherIncome !== 0
        ? Number((((otherIncome - prevOtherIncome) / Math.abs(prevOtherIncome)) * 100).toFixed(2))
        : 0;

    return {
      monthNum: i + 1,
      absMonth,
      daysWorked,
      isLaunched,
      dailyPrincipalSales,
      dailyPrincipalSalesGrowthPct,
      principalValueSales,
      commissionRatePct,
      commissionRevenue,
      commissionOnSalesPct,
      grossProfitAdjustments,
      otherIncome,
      otherIncomeAdjustmentPct,
    };
  });

  const totalDaysWorked = months.reduce((s, m) => s + m.daysWorked, 0);
  const activeMonths = months.filter((m) => m.isLaunched && m.dailyPrincipalSales > 0);
  const avgDailyPrincipalSales =
    activeMonths.length > 0
      ? Math.round(activeMonths.reduce((s, m) => s + m.dailyPrincipalSales, 0) / activeMonths.length)
      : 0;
  const sumPrincipalValueSales = months.reduce((s, m) => s + m.principalValueSales, 0);
  const sumCommissionRevenue = months.reduce((s, m) => s + m.commissionRevenue, 0);
  const effectiveCommissionRatePct =
    sumPrincipalValueSales > 0
      ? Number(((sumCommissionRevenue / sumPrincipalValueSales) * 100).toFixed(2))
      : commissionRatePct;
  const avgCommissionOnSalesPct = Number(
    (months.reduce((s, m) => s + m.commissionOnSalesPct, 0) / 12).toFixed(2)
  );
  const sumGrossProfitAdjustments = months.reduce((s, m) => s + m.grossProfitAdjustments, 0);
  const sumOtherIncome = months.reduce((s, m) => s + m.otherIncome, 0);

  return {
    categoryName: category.name,
    categoryCommissionRatePct: commissionRatePct,
    months,
    totals: {
      totalDaysWorked,
      avgDailyPrincipalSales,
      sumPrincipalValueSales,
      sumCommissionRevenue,
      effectiveCommissionRatePct,
      avgCommissionOnSalesPct,
      sumGrossProfitAdjustments,
      sumOtherIncome,
    },
  };
}

/**
 * Computes portfolio-level Category breakdown & totals for a given year (1..5).
 */
export function calculateCommissionCategoryBreakdown(
  products: RevenueItem[],
  categories: CommissionCategory[],
  daysWorked60: number[],
  activeYear: number
): {
  categorySummaries: CommissionCategorySummary[];
  totalPrincipalSales: number;
  totalCommissionRevenue: number;
  weightedCommissionRatePct: number;
  totalGpAdjustments: number;
  totalOtherIncome: number;
} {
  const safeCats = categories.length > 0 ? categories : DEFAULT_COMMISSION_CATEGORIES;
  const accMap = new Map<
    string,
    {
      category: CommissionCategory;
      productCount: number;
      yearPrincipalSales: number;
      yearCommissionRevenue: number;
      yearGpAdjustments: number;
      yearOtherIncome: number;
    }
  >();

  safeCats.forEach((cat) => {
    accMap.set(cat.id, {
      category: cat,
      productCount: 0,
      yearPrincipalSales: 0,
      yearCommissionRevenue: 0,
      yearGpAdjustments: 0,
      yearOtherIncome: 0,
    });
  });

  products.forEach((prod) => {
    const cat = resolveCommissionCategory(prod, safeCats);
    const grid = calculateCommissionProductYearGrid(prod, safeCats, daysWorked60, activeYear);
    const entry = accMap.get(cat.id);
    if (entry) {
      entry.productCount += 1;
      entry.yearPrincipalSales += grid.totals.sumPrincipalValueSales;
      entry.yearCommissionRevenue += grid.totals.sumCommissionRevenue;
      entry.yearGpAdjustments += grid.totals.sumGrossProfitAdjustments;
      entry.yearOtherIncome += grid.totals.sumOtherIncome;
    }
  });

  let totalPrincipalSales = 0;
  let totalCommissionRevenue = 0;
  let totalGpAdjustments = 0;
  let totalOtherIncome = 0;

  accMap.forEach((entry) => {
    totalPrincipalSales += entry.yearPrincipalSales;
    totalCommissionRevenue += entry.yearCommissionRevenue;
    totalGpAdjustments += entry.yearGpAdjustments;
    totalOtherIncome += entry.yearOtherIncome;
  });

  const categorySummaries: CommissionCategorySummary[] = Array.from(accMap.values()).map(
    (entry) => ({
      ...entry,
      revenueSharePct:
        totalCommissionRevenue > 0
          ? Number(((entry.yearCommissionRevenue / totalCommissionRevenue) * 100).toFixed(1))
          : 0,
    })
  );

  const weightedCommissionRatePct =
    totalPrincipalSales > 0
      ? Number(((totalCommissionRevenue / totalPrincipalSales) * 100).toFixed(2))
      : safeCats[0]?.commissionRatePct ?? 10;

  return {
    categorySummaries,
    totalPrincipalSales,
    totalCommissionRevenue,
    weightedCommissionRatePct,
    totalGpAdjustments,
    totalOtherIncome,
  };
}
