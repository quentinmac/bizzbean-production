import { RevenueItem } from '../../constants';
import {
  ValueSalesCategory,
  ValueSalesCategorySummary,
  ValueSalesMonthResult,
  ValueSalesProductConfig,
  ValueSalesYearGridResult,
} from './modelSetTypes';

export const DEFAULT_VALUE_SALES_CATEGORIES: ValueSalesCategory[] = [
  {
    id: 'vs-cat-1',
    name: 'Core Trading Lines',
    grossProfitMarginPct: 20.0,
    description: 'Primary high-turnover merchandise lines (20.00% target gross profit margin)',
  },
  {
    id: 'vs-cat-2',
    name: 'Specialty & Value-Add Lines',
    grossProfitMarginPct: 35.0,
    description: 'Higher-margin specialty products, accessories & branded lines',
  },
  {
    id: 'vs-cat-3',
    name: 'Promotional / Bulk Lines',
    grossProfitMarginPct: 15.0,
    description: 'Volume-driven promotional or wholesale contract lines',
  },
];

export function createDefaultValueSalesCategories(): ValueSalesCategory[] {
  return DEFAULT_VALUE_SALES_CATEGORIES.map((c) => ({ ...c }));
}

export function createDefaultValueSalesConfig(
  categoryId = 'vs-cat-1',
  dailyValueSalesBase = 20000,
  commissionOnSalesPct = 1.0,
  otherIncomeMonthlyBase = 10000
): ValueSalesProductConfig {
  return {
    categoryId,
    dailyValueSalesBase,
    dailyValueSalesMonthly: new Array(60).fill(dailyValueSalesBase),
    commissionOnSalesPct,
    otherIncomeMonthlyBase,
  };
}

/**
 * Resolves the governing Product Category for a Value Sales product.
 */
export function resolveValueSalesCategory(
  product: RevenueItem,
  categories: ValueSalesCategory[]
): ValueSalesCategory {
  const safeCats = categories.length > 0 ? categories : DEFAULT_VALUE_SALES_CATEGORIES;
  const targetId = product.valueSalesCategoryId || product.valueSalesConfig?.categoryId;
  return safeCats.find((c) => c.id === targetId) || safeCats[0];
}

/**
 * Resolves the 60-month daily value sales array for a product.
 */
export function getDailyValueSalesSeries60(product: RevenueItem): number[] {
  const series = product.valueSalesConfig?.dailyValueSalesMonthly;
  if (Array.isArray(series) && series.length >= 60) {
    return series;
  }
  const base = product.valueSalesConfig?.dailyValueSalesBase ?? 20000;
  return new Array(60).fill(base);
}

/**
 * Computes the authentic Value Sales 12-month grid for a single product & active year (1..5),
 * matching value sales.PNG:
 * - Value Sales = daysWorked * dailyValueSales (0 before startMonth)
 * - Cost of Sales = -round(valueSales * (1 - category.grossProfitMarginPct / 100))
 * - Gross Profit = valueSales + costOfSales
 * - Margin = category.grossProfitMarginPct (governed by Product Category)
 * - Gross Profit Adjustments = -round(valueSales * commissionPct / 100)
 * - Other Income = otherIncomeMonthly[absIdx] (active across all months per value sales.PNG)
 */
export function calculateValueSalesProductYearGrid(
  product: RevenueItem,
  categories: ValueSalesCategory[],
  daysWorked60: number[],
  activeYear: number
): ValueSalesYearGridResult {
  const category = resolveValueSalesCategory(product, categories);
  const gpMarginPct = Math.max(0, Math.min(99.9, Number(category.grossProfitMarginPct) || 0));
  const cosPct = Number((100 - gpMarginPct).toFixed(2));
  const launchMonth = product.startMonth || 1;

  const dailySeries = getDailyValueSalesSeries60(product);
  const commSeries =
    Array.isArray(product.salesCommissionPctMonthly) && product.salesCommissionPctMonthly.length >= 60
      ? product.salesCommissionPctMonthly
      : new Array(60).fill(product.valueSalesConfig?.commissionOnSalesPct ?? 1.0);
  const otherIncSeries =
    Array.isArray(product.otherIncomeMonthly) && product.otherIncomeMonthly.length >= 60
      ? product.otherIncomeMonthly
      : new Array(60).fill(product.valueSalesConfig?.otherIncomeMonthlyBase ?? 0);

  const startMoIdx = (Math.max(1, Math.min(5, activeYear)) - 1) * 12;

  const months: ValueSalesMonthResult[] = Array.from({ length: 12 }, (_, i) => {
    const absIdx = startMoIdx + i;
    const absMonth = absIdx + 1;
    const daysWorked = daysWorked60[absIdx] ?? 21;
    const isLaunched = absMonth >= launchMonth;

    const rawDaily = Math.max(0, Number(dailySeries[absIdx]) || 0);
    const prevRawDaily = absIdx > 0 ? Math.max(0, Number(dailySeries[absIdx - 1]) || 0) : rawDaily;
    const prevWasLaunched = absMonth - 1 >= launchMonth;

    const dailyValueSales = isLaunched ? rawDaily : 0;
    const dailyValueSalesGrowthPct =
      isLaunched && prevWasLaunched && prevRawDaily > 0
        ? Number((((rawDaily - prevRawDaily) / prevRawDaily) * 100).toFixed(2))
        : 0;

    const valueSales = isLaunched ? Math.round(daysWorked * dailyValueSales) : 0;
    const costOfSales = isLaunched ? -Math.round(valueSales * (1 - gpMarginPct / 100)) : 0;
    const grossProfit = isLaunched ? valueSales + costOfSales : 0;

    const commissionOnSalesPct = Number(commSeries[absIdx] ?? 1.0);
    const grossProfitAdjustments = isLaunched
      ? -Math.round(valueSales * (commissionOnSalesPct / 100))
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
      dailyValueSales,
      dailyValueSalesGrowthPct,
      valueSales,
      costOfSalesPct: cosPct,
      costOfSales,
      grossProfit,
      grossProfitMarginPct: gpMarginPct,
      commissionOnSalesPct,
      grossProfitAdjustments,
      otherIncome,
      otherIncomeAdjustmentPct,
    };
  });

  const totalDaysWorked = months.reduce((s, m) => s + m.daysWorked, 0);
  const activeMonths = months.filter((m) => m.isLaunched && m.dailyValueSales > 0);
  const avgDailyValueSales =
    activeMonths.length > 0
      ? Math.round(activeMonths.reduce((s, m) => s + m.dailyValueSales, 0) / activeMonths.length)
      : 0;
  const sumValueSales = months.reduce((s, m) => s + m.valueSales, 0);
  const sumCostOfSales = months.reduce((s, m) => s + m.costOfSales, 0);
  const sumGrossProfit = sumValueSales + sumCostOfSales;
  const effectiveGpMarginPct =
    sumValueSales > 0 ? Number(((sumGrossProfit / sumValueSales) * 100).toFixed(2)) : gpMarginPct;
  const avgCommissionPct =
    Number((months.reduce((s, m) => s + m.commissionOnSalesPct, 0) / 12).toFixed(2));
  const sumGrossProfitAdjustments = months.reduce((s, m) => s + m.grossProfitAdjustments, 0);
  const sumOtherIncome = months.reduce((s, m) => s + m.otherIncome, 0);

  return {
    categoryName: category.name,
    categoryGpMarginPct: gpMarginPct,
    months,
    totals: {
      totalDaysWorked,
      avgDailyValueSales,
      sumValueSales,
      sumCostOfSales,
      sumGrossProfit,
      effectiveGpMarginPct,
      avgCommissionPct,
      sumGrossProfitAdjustments,
      sumOtherIncome,
    },
  };
}

/**
 * Computes portfolio-level Category breakdown & totals for a given year (1..5).
 */
export function calculateValueSalesCategoryBreakdown(
  products: RevenueItem[],
  categories: ValueSalesCategory[],
  daysWorked60: number[],
  activeYear: number
): {
  categorySummaries: ValueSalesCategorySummary[];
  totalValueSales: number;
  totalCostOfSales: number;
  totalGrossProfit: number;
  weightedGpMarginPct: number;
  totalGpAdjustments: number;
  totalOtherIncome: number;
} {
  const safeCats = categories.length > 0 ? categories : DEFAULT_VALUE_SALES_CATEGORIES;
  const accMap = new Map<
    string,
    {
      category: ValueSalesCategory;
      productCount: number;
      yearValueSales: number;
      yearCostOfSales: number;
      yearGrossProfit: number;
      yearGpAdjustments: number;
      yearOtherIncome: number;
    }
  >();

  safeCats.forEach((cat) => {
    accMap.set(cat.id, {
      category: cat,
      productCount: 0,
      yearValueSales: 0,
      yearCostOfSales: 0,
      yearGrossProfit: 0,
      yearGpAdjustments: 0,
      yearOtherIncome: 0,
    });
  });

  products.forEach((prod) => {
    const cat = resolveValueSalesCategory(prod, safeCats);
    const grid = calculateValueSalesProductYearGrid(prod, safeCats, daysWorked60, activeYear);
    const entry = accMap.get(cat.id);
    if (entry) {
      entry.productCount += 1;
      entry.yearValueSales += grid.totals.sumValueSales;
      entry.yearCostOfSales += grid.totals.sumCostOfSales;
      entry.yearGrossProfit += grid.totals.sumGrossProfit;
      entry.yearGpAdjustments += grid.totals.sumGrossProfitAdjustments;
      entry.yearOtherIncome += grid.totals.sumOtherIncome;
    }
  });

  let totalValueSales = 0;
  let totalCostOfSales = 0;
  let totalGrossProfit = 0;
  let totalGpAdjustments = 0;
  let totalOtherIncome = 0;

  accMap.forEach((entry) => {
    totalValueSales += entry.yearValueSales;
    totalCostOfSales += entry.yearCostOfSales;
    totalGrossProfit += entry.yearGrossProfit;
    totalGpAdjustments += entry.yearGpAdjustments;
    totalOtherIncome += entry.yearOtherIncome;
  });

  const categorySummaries: ValueSalesCategorySummary[] = Array.from(accMap.values()).map(
    (entry) => ({
      ...entry,
      revenueSharePct:
        totalValueSales > 0
          ? Number(((entry.yearValueSales / totalValueSales) * 100).toFixed(1))
          : 0,
    })
  );

  const weightedGpMarginPct =
    totalValueSales > 0
      ? Number(((totalGrossProfit / totalValueSales) * 100).toFixed(2))
      : safeCats[0]?.grossProfitMarginPct ?? 20;

  return {
    categorySummaries,
    totalValueSales,
    totalCostOfSales,
    totalGrossProfit,
    weightedGpMarginPct,
    totalGpAdjustments,
    totalOtherIncome,
  };
}
