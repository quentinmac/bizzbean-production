import { RevenueItem } from '../../constants';
import {
  RevenueShareCategory,
  RevenueShareCategorySummary,
  RevenueShareComputedCosCategory,
  RevenueShareCosCategory,
  RevenueShareMonthResult,
  RevenueShareProductConfig,
  RevenueShareYearGridResult,
} from './modelSetTypes';

/**
 * Default Product Categories for TRADING — REVENUE SHARE.
 * Category 1 mirrors the exact Cost of Sales categories and partner expense/service items
 * from revenue share.PNG (10.00% + 10.00% + 10.00% = 30.00% total revenue share Cost of Sales).
 */
export const DEFAULT_REVENUE_SHARE_CATEGORIES: RevenueShareCategory[] = [
  {
    id: 'rs-cat-1',
    name: 'Core Partner-Fulfilled Lines',
    description: 'Standard risk-sharing model across platform, marketing, and fulfilment partners (30.00% total revenue share)',
    cosCategories: [
      {
        id: 'rs-cos-1-1',
        name: 'Platform & Administration',
        items: [
          { id: 'rs-exp-1-1-1', name: 'royalties', sharePct: 2.0 },
          { id: 'rs-exp-1-1-2', name: 'administration', sharePct: 2.0 },
          { id: 'rs-exp-1-1-3', name: 'hosting services', sharePct: 2.0 },
          { id: 'rs-exp-1-1-4', name: 'payment gateway', sharePct: 2.0 },
          { id: 'rs-exp-1-1-5', name: 'other', sharePct: 2.0 },
        ],
      },
      {
        id: 'rs-cos-1-2',
        name: 'Marketing & Digital',
        items: [
          { id: 'rs-exp-1-2-1', name: 'social media', sharePct: 5.0 },
          { id: 'rs-exp-1-2-2', name: 'other', sharePct: 5.0 },
        ],
      },
      {
        id: 'rs-cos-1-3',
        name: 'Fulfilment & Logistics',
        items: [
          { id: 'rs-exp-1-3-1', name: 'warehousing', sharePct: 5.0 },
          { id: 'rs-exp-1-3-2', name: 'logistics', sharePct: 5.0 },
        ],
      },
    ],
  },
  {
    id: 'rs-cat-2',
    name: 'Managed Partner Services',
    description: 'Higher partner-share lines with joint licensing and external service delivery',
    cosCategories: [
      {
        id: 'rs-cos-2-1',
        name: 'Platform & Licensing',
        items: [
          { id: 'rs-exp-2-1-1', name: 'royalties', sharePct: 10.0 },
          { id: 'rs-exp-2-1-2', name: 'hosting & payment gateway', sharePct: 5.0 },
        ],
      },
      {
        id: 'rs-cos-2-2',
        name: 'Service Delivery Partners',
        items: [
          { id: 'rs-exp-2-2-1', name: 'delivery partners', sharePct: 20.0 },
          { id: 'rs-exp-2-2-2', name: 'account support', sharePct: 5.0 },
        ],
      },
    ],
  },
];

export function cloneRevenueShareCategories(
  categories: RevenueShareCategory[]
): RevenueShareCategory[] {
  return categories.map((cat) => ({
    ...cat,
    cosCategories: (cat.cosCategories || []).map((cos) => ({
      ...cos,
      items: (cos.items || []).map((item) => ({ ...item })),
    })),
  }));
}

export function createDefaultRevenueShareCategories(): RevenueShareCategory[] {
  return cloneRevenueShareCategories(DEFAULT_REVENUE_SHARE_CATEGORIES);
}

export function createDefaultRevenueShareConfig(
  categoryId = 'rs-cat-1',
  dailyValueSalesBase = 20000,
  otherIncomeMonthlyBase = 10000
): RevenueShareProductConfig {
  return {
    categoryId,
    dailyValueSalesBase,
    dailyValueSalesMonthly: new Array(60).fill(dailyValueSalesBase),
    otherIncomeMonthlyBase,
  };
}

/**
 * Sum of sharePct for a single Cost of Sales category.
 */
export function getCosCategorySubtotalPct(cosCat: RevenueShareCosCategory): number {
  const sum = (cosCat.items || []).reduce(
    (acc, item) => acc + Math.max(0, Number(item.sharePct) || 0),
    0
  );
  return Number(sum.toFixed(2));
}

/**
 * Aggregate revenue share % (Cost of Sales %) governed by a Product Category.
 */
export function getRevenueShareCategoryTotalPct(category: RevenueShareCategory): number {
  const sum = (category.cosCategories || []).reduce(
    (acc, cosCat) => acc + getCosCategorySubtotalPct(cosCat),
    0
  );
  return Number(sum.toFixed(2));
}

/**
 * Resolves the governing Product Category for a Revenue Share product.
 */
export function resolveRevenueShareCategory(
  product: RevenueItem,
  categories: RevenueShareCategory[]
): RevenueShareCategory {
  const safeCats =
    categories.length > 0 ? categories : DEFAULT_REVENUE_SHARE_CATEGORIES;
  const targetId =
    product.revenueShareCategoryId || product.revenueShareConfig?.categoryId;
  return safeCats.find((c) => c.id === targetId) || safeCats[0];
}

/**
 * Resolves the 60-month daily value sales array for a Revenue Share product.
 */
export function getRevenueShareDailySalesSeries60(product: RevenueItem): number[] {
  const series = product.revenueShareConfig?.dailyValueSalesMonthly;
  if (Array.isArray(series) && series.length >= 60) {
    return series;
  }
  const base = product.revenueShareConfig?.dailyValueSalesBase ?? 20000;
  return new Array(60).fill(base);
}

/**
 * Computes exact aggregate Cost of Sales (positive magnitude) for a single month's value sales,
 * by summing rounded partner expense shares across all Cost of Sales categories in the Product Category.
 * This guarantees 100% tie-out between Results table item rows, subtotals, totals, and the Trading Account.
 */
export function calculateRevenueShareMonthlyCosPositive(
  valueSales: number,
  category: RevenueShareCategory
): number {
  if (valueSales <= 0) return 0;
  let totalCos = 0;
  for (const cosCat of category.cosCategories || []) {
    for (const item of cosCat.items || []) {
      const pct = Math.max(0, Number(item.sharePct) || 0);
      totalCos += Math.round(valueSales * (pct / 100));
    }
  }
  return totalCos;
}

/**
 * Computes the authentic Revenue Share 12-month grid for a single product & active year (1..5),
 * matching revenue share.PNG:
 * - Revenue: value sales = daysWorked * dailyValueSales (0 before startMonth)
 * - Cost of Sales Categories: each category lists partner expense/service items with governing %
 *   -> each item = -round(valueSales * sharePct / 100)
 *   -> category sub total = sum of its items
 * - Revenue Share Total (= Cost of Sales): aggregate of all Cost of Sales categories (transferred to Trading Account as Cost of Sales)
 * - Retained Gross Profit = valueSales + totalCostOfSales (margin = 100% - totalRevenueSharePct)
 * - Other Income = otherIncomeMonthly[absIdx] (applies across all months)
 */
export function calculateRevenueShareProductYearGrid(
  product: RevenueItem,
  categories: RevenueShareCategory[],
  daysWorked60: number[],
  activeYear: number
): RevenueShareYearGridResult {
  const category = resolveRevenueShareCategory(product, categories);
  const totalRevenueSharePct = getRevenueShareCategoryTotalPct(category);
  const retainedGrossMarginPct = Number((100 - totalRevenueSharePct).toFixed(2));
  const launchMonth = product.startMonth || 1;

  const dailySeries = getRevenueShareDailySalesSeries60(product);
  const otherIncSeries =
    Array.isArray(product.otherIncomeMonthly) && product.otherIncomeMonthly.length >= 60
      ? product.otherIncomeMonthly
      : new Array(60).fill(product.revenueShareConfig?.otherIncomeMonthlyBase ?? 0);

  const startMoIdx = (Math.max(1, Math.min(5, activeYear)) - 1) * 12;

  // Step 1: Compute monthly revenue & launch status for the 12 months
  const rawMonthMeta = Array.from({ length: 12 }, (_, i) => {
    const absIdx = startMoIdx + i;
    const absMonth = absIdx + 1;
    const daysWorked = daysWorked60[absIdx] ?? 21;
    const isLaunched = absMonth >= launchMonth;

    const rawDaily = Math.max(0, Number(dailySeries[absIdx]) || 0);
    const prevRawDaily =
      absIdx > 0 ? Math.max(0, Number(dailySeries[absIdx - 1]) || 0) : rawDaily;
    const prevWasLaunched = absMonth - 1 >= launchMonth;

    const dailyValueSales = isLaunched ? rawDaily : 0;
    const dailyValueSalesGrowthPct =
      isLaunched && prevWasLaunched && prevRawDaily > 0
        ? Number((((rawDaily - prevRawDaily) / prevRawDaily) * 100).toFixed(2))
        : 0;

    const valueSales = isLaunched ? Math.round(daysWorked * dailyValueSales) : 0;

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
      dailyValueSales,
      dailyValueSalesGrowthPct,
      valueSales,
      otherIncome,
      otherIncomeAdjustmentPct,
    };
  });

  // Step 2: Compute each Cost of Sales Category and its partner expense/service rows across the 12 months
  const computedCosCategories: RevenueShareComputedCosCategory[] = (
    category.cosCategories || []
  ).map((cosCat) => {
    const subtotalPct = getCosCategorySubtotalPct(cosCat);
    const computedItems = (cosCat.items || []).map((item) => {
      const pct = Math.max(0, Number(item.sharePct) || 0);
      const monthlyAmounts = rawMonthMeta.map((m) =>
        m.isLaunched && m.valueSales > 0 ? -Math.round(m.valueSales * (pct / 100)) : 0
      );
      const yearTotal = monthlyAmounts.reduce((s, v) => s + v, 0);
      return {
        id: item.id,
        name: item.name,
        sharePct: pct,
        monthlyAmounts,
        yearTotal,
      };
    });

    const monthlySubtotals = Array.from({ length: 12 }, (_, mIdx) =>
      computedItems.reduce((s, row) => s + row.monthlyAmounts[mIdx], 0)
    );
    const yearSubtotal = monthlySubtotals.reduce((s, v) => s + v, 0);

    return {
      id: cosCat.id,
      name: cosCat.name,
      subtotalPct,
      items: computedItems,
      monthlySubtotals,
      yearSubtotal,
    };
  });

  // Step 3: Build final 12-month results where Cost of Sales = exact sum of all Cost of Sales categories
  const months: RevenueShareMonthResult[] = rawMonthMeta.map((m, idx) => {
    const totalCostOfSales = computedCosCategories.reduce(
      (s, c) => s + c.monthlySubtotals[idx],
      0
    );
    const grossProfit = m.valueSales + totalCostOfSales;
    const grossMarginPct =
      m.valueSales > 0
        ? Number(((grossProfit / m.valueSales) * 100).toFixed(2))
        : retainedGrossMarginPct;

    return {
      monthNum: m.monthNum,
      absMonth: m.absMonth,
      daysWorked: m.daysWorked,
      isLaunched: m.isLaunched,
      dailyValueSales: m.dailyValueSales,
      dailyValueSalesGrowthPct: m.dailyValueSalesGrowthPct,
      valueSales: m.valueSales,
      totalRevenueSharePct,
      totalCostOfSales,
      grossProfit,
      grossMarginPct,
      otherIncome: m.otherIncome,
      otherIncomeAdjustmentPct: m.otherIncomeAdjustmentPct,
    };
  });

  const totalDaysWorked = months.reduce((s, m) => s + m.daysWorked, 0);
  const activeMonths = months.filter((m) => m.isLaunched && m.dailyValueSales > 0);
  const avgDailyValueSales =
    activeMonths.length > 0
      ? Math.round(
          activeMonths.reduce((s, m) => s + m.dailyValueSales, 0) / activeMonths.length
        )
      : 0;
  const sumValueSales = months.reduce((s, m) => s + m.valueSales, 0);
  const sumCostOfSales = months.reduce((s, m) => s + m.totalCostOfSales, 0);
  const sumGrossProfit = sumValueSales + sumCostOfSales;
  const effectiveRevenueSharePct =
    sumValueSales > 0
      ? Number(((Math.abs(sumCostOfSales) / sumValueSales) * 100).toFixed(2))
      : totalRevenueSharePct;
  const effectiveGrossMarginPct =
    sumValueSales > 0
      ? Number(((sumGrossProfit / sumValueSales) * 100).toFixed(2))
      : retainedGrossMarginPct;
  const sumOtherIncome = months.reduce((s, m) => s + m.otherIncome, 0);

  return {
    categoryName: category.name,
    totalRevenueSharePct,
    retainedGrossMarginPct,
    cosCategories: computedCosCategories,
    months,
    totals: {
      totalDaysWorked,
      avgDailyValueSales,
      sumValueSales,
      sumCostOfSales,
      effectiveRevenueSharePct,
      sumGrossProfit,
      effectiveGrossMarginPct,
      sumOtherIncome,
    },
  };
}

/**
 * Computes portfolio-level Product Category breakdown & totals for a given year (1..5).
 */
export function calculateRevenueShareCategoryBreakdown(
  products: RevenueItem[],
  categories: RevenueShareCategory[],
  daysWorked60: number[],
  activeYear: number
): {
  categorySummaries: RevenueShareCategorySummary[];
  totalRevenue: number;
  totalCostOfSales: number;
  totalGrossProfit: number;
  weightedRevenueSharePct: number;
  weightedGrossMarginPct: number;
  totalOtherIncome: number;
} {
  const safeCats =
    categories.length > 0 ? categories : DEFAULT_REVENUE_SHARE_CATEGORIES;

  const accMap = new Map<
    string,
    {
      category: RevenueShareCategory;
      totalRevenueSharePct: number;
      retainedGrossMarginPct: number;
      productCount: number;
      yearRevenue: number;
      yearCostOfSales: number;
      yearGrossProfit: number;
      yearOtherIncome: number;
    }
  >();

  safeCats.forEach((cat) => {
    const sharePct = getRevenueShareCategoryTotalPct(cat);
    accMap.set(cat.id, {
      category: cat,
      totalRevenueSharePct: sharePct,
      retainedGrossMarginPct: Number((100 - sharePct).toFixed(2)),
      productCount: 0,
      yearRevenue: 0,
      yearCostOfSales: 0,
      yearGrossProfit: 0,
      yearOtherIncome: 0,
    });
  });

  products.forEach((prod) => {
    const cat = resolveRevenueShareCategory(prod, safeCats);
    const grid = calculateRevenueShareProductYearGrid(
      prod,
      safeCats,
      daysWorked60,
      activeYear
    );
    const entry = accMap.get(cat.id);
    if (entry) {
      entry.productCount += 1;
      entry.yearRevenue += grid.totals.sumValueSales;
      entry.yearCostOfSales += grid.totals.sumCostOfSales;
      entry.yearGrossProfit += grid.totals.sumGrossProfit;
      entry.yearOtherIncome += grid.totals.sumOtherIncome;
    }
  });

  let totalRevenue = 0;
  let totalCostOfSales = 0;
  let totalGrossProfit = 0;
  let totalOtherIncome = 0;

  accMap.forEach((entry) => {
    totalRevenue += entry.yearRevenue;
    totalCostOfSales += entry.yearCostOfSales;
    totalGrossProfit += entry.yearGrossProfit;
    totalOtherIncome += entry.yearOtherIncome;
  });

  const weightedRevenueSharePct =
    totalRevenue > 0
      ? Number(((Math.abs(totalCostOfSales) / totalRevenue) * 100).toFixed(2))
      : 0;
  const weightedGrossMarginPct =
    totalRevenue > 0
      ? Number(((totalGrossProfit / totalRevenue) * 100).toFixed(2))
      : 0;

  const categorySummaries: RevenueShareCategorySummary[] = Array.from(
    accMap.values()
  ).map((entry) => ({
    ...entry,
    revenueShareOfPortfolioPct:
      totalRevenue > 0
        ? Number(((entry.yearRevenue / totalRevenue) * 100).toFixed(1))
        : 0,
  }));

  return {
    categorySummaries,
    totalRevenue,
    totalCostOfSales,
    totalGrossProfit,
    weightedRevenueSharePct,
    weightedGrossMarginPct,
    totalOtherIncome,
  };
}
