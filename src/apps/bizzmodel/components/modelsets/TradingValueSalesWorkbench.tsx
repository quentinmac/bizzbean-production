import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Percent,
  TrendingUp,
  ArrowRight,
  FolderOpen,
  DollarSign,
  Tag,
} from 'lucide-react';
import { RevenueItem } from '../../constants';
import { ValueSalesCategory } from './modelSetTypes';
import {
  calculateValueSalesCategoryBreakdown,
  calculateValueSalesProductYearGrid,
  getDailyValueSalesSeries60,
  resolveValueSalesCategory,
} from './valueSalesEngine';

interface TradingValueSalesWorkbenchProps {
  theme?: 'light' | 'dark';
  categories: ValueSalesCategory[];
  products: RevenueItem[];
  daysWorked60: number[];
  isPredetermined?: boolean;
  onAddCategory: () => void;
  onUpdateCategory: (categoryId: string, patch: Partial<ValueSalesCategory>) => void;
  onRemoveCategory: (categoryId: string) => void;
  onAddProductToCategory: (categoryId: string) => void;
  onUpdateProduct: (productIndex: number, patch: Partial<RevenueItem>) => void;
  onRemoveProduct: (productIndex: number) => void;
  onOpenResultsTab: (productIndex: number) => void;
}

export const TradingValueSalesWorkbench: React.FC<TradingValueSalesWorkbenchProps> = ({
  theme = 'light',
  categories,
  products,
  daysWorked60,
  isPredetermined = false,
  onAddCategory,
  onUpdateCategory,
  onRemoveCategory,
  onAddProductToCategory,
  onUpdateProduct,
  onRemoveProduct,
  onOpenResultsTab,
}) => {
  const isDark = theme === 'dark';
  const [categoriesTableOpen, setCategoriesTableOpen] = useState<boolean>(true);
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<Record<string, boolean>>({});

  // Compute Year 1 portfolio & category summaries
  const portfolioY1 = useMemo(
    () => calculateValueSalesCategoryBreakdown(products, categories, daysWorked60, 1),
    [products, categories, daysWorked60]
  );

  // Map product index -> Year 1 grid for fast display
  const productGridsY1 = useMemo(
    () =>
      products.map((prod) =>
        calculateValueSalesProductYearGrid(prod, categories, daysWorked60, 1)
      ),
    [products, categories, daysWorked60]
  );

  // Group products (with their original array index) under their governing Product Category
  const productsByCategory = useMemo(() => {
    const grouped = new Map<string, Array<{ product: RevenueItem; idx: number }>>();
    categories.forEach((cat) => grouped.set(cat.id, []));

    products.forEach((product, idx) => {
      const cat = resolveValueSalesCategory(product, categories);
      const list = grouped.get(cat.id);
      if (list) {
        list.push({ product, idx });
      } else if (categories[0]) {
        grouped.get(categories[0].id)?.push({ product, idx });
      }
    });

    return grouped;
  }, [products, categories]);

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategoryIds((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleProductDailySalesBaseChange = (idx: number, prod: RevenueItem, nextBase: number) => {
    const safeBase = Math.max(0, Number.isFinite(nextBase) ? nextBase : 0);
    const existingCfg = prod.valueSalesConfig;
    const prevSeries = getDailyValueSalesSeries60(prod);
    const prevBase = prevSeries[0] || existingCfg?.dailyValueSalesBase || 0;

    // Preserve any relative growth curve created via the Results slider if prevBase > 0
    const nextSeries =
      prevBase > 0
        ? prevSeries.map((v) => Number(((v / prevBase) * safeBase).toFixed(2)))
        : new Array(60).fill(safeBase);

    const cat = resolveValueSalesCategory(prod, categories);

    onUpdateProduct(idx, {
      modelType: 'value sales',
      valueSalesCategoryId: cat.id,
      valueSalesConfig: {
        categoryId: cat.id,
        dailyValueSalesBase: safeBase,
        dailyValueSalesMonthly: nextSeries,
        commissionOnSalesPct:
          existingCfg?.commissionOnSalesPct ?? prod.salesCommissionPctMonthly?.[0] ?? 1.0,
        otherIncomeMonthlyBase:
          existingCfg?.otherIncomeMonthlyBase ?? prod.otherIncomeMonthly?.[0] ?? 0,
      },
    });
  };

  const handleProductCommissionChange = (idx: number, prod: RevenueItem, nextPct: number) => {
    const safePct = Math.max(0, Math.min(100, Number.isFinite(nextPct) ? nextPct : 0));
    const cat = resolveValueSalesCategory(prod, categories);
    const dailySeries = getDailyValueSalesSeries60(prod);

    onUpdateProduct(idx, {
      modelType: 'value sales',
      salesCommissionPctMonthly: new Array(60).fill(safePct),
      valueSalesConfig: {
        categoryId: cat.id,
        dailyValueSalesBase: prod.valueSalesConfig?.dailyValueSalesBase ?? dailySeries[0] ?? 20000,
        dailyValueSalesMonthly: dailySeries,
        commissionOnSalesPct: safePct,
        otherIncomeMonthlyBase:
          prod.valueSalesConfig?.otherIncomeMonthlyBase ?? prod.otherIncomeMonthly?.[0] ?? 0,
      },
    });
  };

  const handleProductOtherIncomeChange = (idx: number, prod: RevenueItem, nextOtherInc: number) => {
    const safeVal = Number.isFinite(nextOtherInc) ? nextOtherInc : 0;
    const cat = resolveValueSalesCategory(prod, categories);
    const dailySeries = getDailyValueSalesSeries60(prod);

    onUpdateProduct(idx, {
      modelType: 'value sales',
      otherIncomeMonthly: new Array(60).fill(safeVal),
      valueSalesConfig: {
        categoryId: cat.id,
        dailyValueSalesBase: prod.valueSalesConfig?.dailyValueSalesBase ?? dailySeries[0] ?? 20000,
        dailyValueSalesMonthly: dailySeries,
        commissionOnSalesPct:
          prod.valueSalesConfig?.commissionOnSalesPct ?? prod.salesCommissionPctMonthly?.[0] ?? 1.0,
        otherIncomeMonthlyBase: safeVal,
      },
    });
  };

  const handleProductCategoryChange = (idx: number, prod: RevenueItem, nextCategoryId: string) => {
    const nextCat = categories.find((c) => c.id === nextCategoryId) || categories[0];
    if (!nextCat) return;
    const dailySeries = getDailyValueSalesSeries60(prod);

    onUpdateProduct(idx, {
      modelType: 'value sales',
      category: nextCat.name,
      valueSalesCategoryId: nextCat.id,
      costOfSalesPct: Number((100 - nextCat.grossProfitMarginPct).toFixed(2)),
      grossProfitMarginPctMonthly: new Array(60).fill(nextCat.grossProfitMarginPct),
      valueSalesConfig: {
        categoryId: nextCat.id,
        dailyValueSalesBase: prod.valueSalesConfig?.dailyValueSalesBase ?? dailySeries[0] ?? 20000,
        dailyValueSalesMonthly: dailySeries,
        commissionOnSalesPct:
          prod.valueSalesConfig?.commissionOnSalesPct ?? prod.salesCommissionPctMonthly?.[0] ?? 1.0,
        otherIncomeMonthlyBase:
          prod.valueSalesConfig?.otherIncomeMonthlyBase ?? prod.otherIncomeMonthly?.[0] ?? 0,
      },
    });
  };

  const formatMoney = (val: number) => Math.round(val).toLocaleString();

  return (
    <div className="space-y-5 font-mono">
      {/* =================================================================== */}
      {/* 1. PORTFOLIO VALUE SALES SUMMARY STRIP (YEAR 1)                     */}
      {/* =================================================================== */}
      <div
        className={`p-4 rounded-2xl border grid grid-cols-2 lg:grid-cols-5 gap-3 ${
          isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50/80 border-[#D8CEBC]'
        }`}
      >
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Categories / Products
          </span>
          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {categories.length}{' '}
            <span className="text-xs font-normal text-slate-500">
              cat · {products.length} {products.length === 1 ? 'product' : 'products'}
            </span>
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Year 1 Value Sales
          </span>
          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tabular-nums">
            {formatMoney(portfolioY1.totalValueSales)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">
            Year 1 Cost of Sales
          </span>
          <span className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatMoney(portfolioY1.totalCostOfSales)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
            Year 1 Gross Profit ({portfolioY1.weightedGpMarginPct.toFixed(2)}%)
          </span>
          <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {formatMoney(portfolioY1.totalGrossProfit)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-[#2E5E88] dark:text-[#7EB2E2] block">
            Y1 GP Adj. / Other Inc.
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#2E5E88] dark:text-[#7EB2E2] tabular-nums block">
            {formatMoney(portfolioY1.totalGpAdjustments)} / +{formatMoney(portfolioY1.totalOtherIncome)}
          </span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. PRODUCT CATEGORIES MANAGER (GOVERNS GROSS PROFIT MARGIN %)       */}
      {/* =================================================================== */}
      <div
        className={`rounded-2xl border overflow-hidden transition-all ${
          isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        {/* Collapsible Header */}
        <div
          onClick={() => setCategoriesTableOpen(!categoriesTableOpen)}
          className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none border-b border-slate-200/80 dark:border-slate-800"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#7EB2E2] flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold uppercase text-slate-900 dark:text-white">
                  PRODUCT CATEGORIES
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                  governs gross profit margin %
                </span>
              </div>
              <p className="text-[11px] text-slate-500 lowercase mt-0.5">
                define product categories and their target gross profit margin % — all products listed under a category inherit its margin automatically.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddCategory();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold lowercase shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>add category</span>
            </button>
            <button
              type="button"
              aria-label="Toggle product categories"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              {categoriesTableOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Category Table */}
        {categoriesTableOpen && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-slate-500">
                  <th className="py-2 px-3 font-bold">Product Category</th>
                  <th className="py-2 px-3 font-bold text-right">GP Margin (%)</th>
                  <th className="py-2 px-3 font-bold text-right">Cost of Sales (%)</th>
                  <th className="py-2 px-3 font-bold text-center">Products</th>
                  <th className="py-2 px-3 font-bold text-right">Y1 Value Sales</th>
                  <th className="py-2 px-3 font-bold">Description / Notes</th>
                  <th className="py-2 px-2 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {categories.map((cat) => {
                  const summary = portfolioY1.categorySummaries.find(
                    (s) => s.category.id === cat.id
                  );
                  const cosPct = Math.max(0, 100 - (Number(cat.grossProfitMarginPct) || 0));

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/25 transition-colors"
                    >
                      <td className="py-2 px-3 min-w-[180px]">
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) => onUpdateCategory(cat.id, { name: e.target.value })}
                          placeholder="Category name..."
                          className="w-full font-bold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-[#2E5E88] focus:outline-none py-1 text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            min="0"
                            max="99.9"
                            step="0.5"
                            value={cat.grossProfitMarginPct}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              onUpdateCategory(cat.id, {
                                grossProfitMarginPct: Number.isFinite(val)
                                  ? Math.max(0, Math.min(99.9, val))
                                  : 0,
                              });
                            }}
                            className={`w-20 p-1.5 text-right font-bold rounded-lg border text-xs ${
                              isDark
                                ? 'bg-[#141A2E] border-[#252E4A] text-emerald-400'
                                : 'bg-emerald-50/60 border-emerald-300 text-emerald-800'
                            }`}
                          />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">%</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums font-bold text-rose-600 dark:text-rose-400">
                        {cosPct.toFixed(2)}%
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {summary?.productCount ?? 0}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums font-bold text-slate-800 dark:text-slate-200">
                        {formatMoney(summary?.yearValueSales ?? 0)}
                      </td>
                      <td className="py-2 px-3 min-w-[200px]">
                        <input
                          type="text"
                          value={cat.description || ''}
                          onChange={(e) =>
                            onUpdateCategory(cat.id, { description: e.target.value })
                          }
                          placeholder="Margin rationale or merchandising notes..."
                          className="w-full text-[11px] text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-[#2E5E88] focus:outline-none py-1"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        {categories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onRemoveCategory(cat.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete product category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 3. PRODUCTS LISTED WITHIN THEIR RESPECTIVE PRODUCT CATEGORIES       */}
      {/* =================================================================== */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const catProducts = productsByCategory.get(cat.id) || [];
          const catSummary = portfolioY1.categorySummaries.find((s) => s.category.id === cat.id);
          const isCollapsed = Boolean(collapsedCategoryIds[cat.id]);
          const cosPct = Math.max(0, 100 - (Number(cat.grossProfitMarginPct) || 0));

          return (
            <div
              key={cat.id}
              className={`rounded-2xl border overflow-hidden transition-all ${
                isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}
            >
              {/* Category Group Header */}
              <div
                className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
                  isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#F7F3EC] border-[#D8CEBC]'
                }`}
              >
                <div
                  onClick={() => toggleCategoryCollapse(cat.id)}
                  className="flex flex-wrap items-center gap-2.5 cursor-pointer select-none"
                >
                  <FolderOpen className="w-4 h-4 text-[#2E5E88] dark:text-[#7EB2E2] shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {cat.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                    GP Margin: {Number(cat.grossProfitMarginPct).toFixed(2)}%
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                    COS: {cosPct.toFixed(2)}%
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    ({catProducts.length} {catProducts.length === 1 ? 'product' : 'products'})
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right text-[11px] hidden sm:block">
                    <span className="text-slate-500">Y1 Sales: </span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatMoney(catSummary?.yearValueSales ?? 0)}
                    </span>
                    <span className="text-slate-400 mx-1.5">|</span>
                    <span className="text-slate-500">Y1 GP: </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {formatMoney(catSummary?.yearGrossProfit ?? 0)}
                    </span>
                  </div>

                  {!isPredetermined && (
                    <button
                      type="button"
                      onClick={() => onAddProductToCategory(cat.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white text-[11px] font-bold lowercase transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>add product</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleCategoryCollapse(cat.id)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    aria-label="Toggle category products"
                  >
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Products Inside This Category */}
              {!isCollapsed && (
                <div className="p-4 space-y-3">
                  {catProducts.length === 0 ? (
                    <div
                      className={`p-5 rounded-xl border border-dashed text-center space-y-2 ${
                        isDark ? 'border-[#253252] bg-[#0B1020]' : 'border-[#D8CEBC] bg-slate-50/50'
                      }`}
                    >
                      <p className="text-xs text-slate-500 lowercase">
                        no products assigned to <strong>{cat.name}</strong> yet.
                      </p>
                      {!isPredetermined && (
                        <button
                          type="button"
                          onClick={() => onAddProductToCategory(cat.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2E5E88] text-[#2E5E88] dark:text-[#7EB2E2] hover:bg-[#2E5E88] hover:text-white text-xs font-bold lowercase transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>add first product to {cat.name}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    catProducts.map(({ product: prod, idx }) => {
                      const grid = productGridsY1[idx];
                      const dailyBase =
                        prod.valueSalesConfig?.dailyValueSalesBase ??
                        prod.valueSalesConfig?.dailyValueSalesMonthly?.[0] ??
                        20000;
                      const commPct =
                        prod.valueSalesConfig?.commissionOnSalesPct ??
                        prod.salesCommissionPctMonthly?.[0] ??
                        1.0;
                      const otherIncBase =
                        prod.valueSalesConfig?.otherIncomeMonthlyBase ??
                        prod.otherIncomeMonthly?.[0] ??
                        0;

                      return (
                        <div
                          key={prod.id}
                          className={`p-4 rounded-xl border space-y-3.5 transition-all ${
                            isDark
                              ? 'bg-[#101626] border-[#222F4C] hover:border-[#344A73]'
                              : 'bg-[#FCFBF8] border-[#E3DACB] hover:border-[#2E5E88]/50'
                          }`}
                        >
                          {/* Product Top Row */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                              <input
                                type="text"
                                value={prod.name}
                                disabled={isPredetermined}
                                onChange={(e) => onUpdateProduct(idx, { name: e.target.value })}
                                placeholder="Product / Department Line Name"
                                className={`w-full max-w-md p-1.5 rounded-lg border text-xs font-bold lowercase ${
                                  isDark
                                    ? 'bg-[#141A2E] border-[#252E4A] text-white'
                                    : 'bg-white border-[#D8CEBC] text-slate-900'
                                }`}
                              />
                              {!isPredetermined && products.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveProduct(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                  title="Remove product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                                governed GP: {cat.grossProfitMarginPct.toFixed(2)}% (COS {cosPct.toFixed(2)}%)
                              </span>
                              <button
                                type="button"
                                onClick={() => onOpenResultsTab(idx)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#2E5E88] text-[#2E5E88] dark:text-[#7EB2E2] hover:bg-[#2E5E88] hover:text-white text-[11px] font-bold lowercase transition-colors cursor-pointer"
                              >
                                <span>results &amp; growth slider</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Product Inputs Grid (Matching value sales.PNG) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                            {/* 1. Product Category */}
                            <div className="space-y-1">
                              <label className="text-slate-500 lowercase block font-bold flex items-center gap-1 text-[11px]">
                                <Layers className="h-3 w-3 text-[#2E5E88] dark:text-[#7EB2E2]" />
                                <span>product category:</span>
                              </label>
                              <select
                                value={cat.id}
                                onChange={(e) =>
                                  handleProductCategoryChange(idx, prod, e.target.value)
                                }
                                className={`w-full p-2 rounded-xl border text-xs font-bold cursor-pointer ${
                                  isDark
                                    ? 'bg-[#141A2E] border-[#252E4A] text-white'
                                    : 'bg-white border-[#D8CEBC] text-slate-900'
                                }`}
                              >
                                {categories.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} ({c.grossProfitMarginPct.toFixed(1)}% GP)
                                  </option>
                                ))}
                              </select>
                              <span className="text-[10px] text-slate-400 block">
                                determines GP margin %
                              </span>
                            </div>

                            {/* 2. Start Month */}
                            <div className="space-y-1">
                              <label className="text-slate-500 lowercase block font-bold flex items-center gap-1 text-[11px]">
                                <Calendar className="h-3 w-3 text-[#2E5E88] dark:text-[#7EB2E2]" />
                                <span>start month:</span>
                              </label>
                              <select
                                value={prod.startMonth || 1}
                                onChange={(e) =>
                                  onUpdateProduct(idx, { startMonth: Number(e.target.value) })
                                }
                                className={`w-full p-2 rounded-xl border text-xs font-bold cursor-pointer ${
                                  isDark
                                    ? 'bg-[#141A2E] border-[#252E4A] text-white'
                                    : 'bg-white border-[#D8CEBC] text-slate-900'
                                }`}
                              >
                                {Array.from({ length: 12 }).map((_, mIdx) => (
                                  <option key={mIdx + 1} value={mIdx + 1}>
                                    Month {mIdx + 1} (M{mIdx + 1})
                                  </option>
                                ))}
                              </select>
                              <span className="text-[10px] text-slate-400 block">
                                trading launch month
                              </span>
                            </div>

                            {/* 3. Value Sales - Per Day */}
                            <div className="space-y-1">
                              <label className="text-slate-500 lowercase block font-bold flex items-center gap-1 text-[11px]">
                                <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                <span>value sales - per day:</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="500"
                                value={dailyBase}
                                onChange={(e) =>
                                  handleProductDailySalesBaseChange(
                                    idx,
                                    prod,
                                    parseFloat(e.target.value)
                                  )
                                }
                                className={`w-full p-2 rounded-xl border text-xs font-bold text-right ${
                                  isDark
                                    ? 'bg-[#141A2E] border-[#252E4A] text-white'
                                    : 'bg-white border-[#D8CEBC] text-slate-900'
                                }`}
                              />
                              <span className="text-[10px] text-slate-400 block">
                                × working days = monthly sales
                              </span>
                            </div>

                            {/* 4. Commission on Sales % */}
                            <div className="space-y-1">
                              <label className="text-slate-500 lowercase block font-bold flex items-center gap-1 text-[11px]">
                                <Percent className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                <span>commission on sales %:</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.25"
                                value={commPct}
                                onChange={(e) =>
                                  handleProductCommissionChange(
                                    idx,
                                    prod,
                                    parseFloat(e.target.value)
                                  )
                                }
                                className={`w-full p-2 rounded-xl border text-xs font-bold text-right ${
                                  isDark
                                    ? 'bg-[#141A2E] border-[#252E4A] text-white'
                                    : 'bg-white border-[#D8CEBC] text-slate-900'
                                }`}
                              />
                              <span className="text-[10px] text-slate-400 block">
                                gross profit adjustment
                              </span>
                            </div>

                            {/* 5. Other Income (Monthly) */}
                            <div className="space-y-1">
                              <label className="text-slate-500 lowercase block font-bold flex items-center gap-1 text-[11px]">
                                <DollarSign className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                                <span>other income (monthly):</span>
                              </label>
                              <input
                                type="number"
                                step="500"
                                value={otherIncBase}
                                onChange={(e) =>
                                  handleProductOtherIncomeChange(
                                    idx,
                                    prod,
                                    parseFloat(e.target.value)
                                  )
                                }
                                className={`w-full p-2 rounded-xl border text-xs font-bold text-right ${
                                  isDark
                                    ? 'bg-[#141A2E] border-[#252E4A] text-white'
                                    : 'bg-white border-[#D8CEBC] text-slate-900'
                                }`}
                              />
                              <span className="text-[10px] text-slate-400 block">
                                adjustable via results slider
                              </span>
                            </div>
                          </div>

                          {/* Product Live Year 1 Trading Mini-Strip */}
                          {grid && (
                            <div
                              className={`px-3 py-2 rounded-lg border flex flex-wrap items-center justify-between gap-3 text-[11px] ${
                                isDark
                                  ? 'bg-[#0B1020] border-[#1F2C4A]'
                                  : 'bg-slate-50 border-slate-200/80'
                              }`}
                            >
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span>
                                  <span className="text-slate-500">Y1 Value Sales: </span>
                                  <strong className="text-slate-900 dark:text-white tabular-nums">
                                    {formatMoney(grid.totals.sumValueSales)}
                                  </strong>
                                </span>
                                <span>
                                  <span className="text-slate-500">Y1 COS: </span>
                                  <strong className="text-rose-600 dark:text-rose-400 tabular-nums">
                                    {formatMoney(grid.totals.sumCostOfSales)}
                                  </strong>
                                </span>
                                <span>
                                  <span className="text-slate-500">Y1 GP: </span>
                                  <strong className="text-emerald-700 dark:text-emerald-400 tabular-nums">
                                    {formatMoney(grid.totals.sumGrossProfit)}
                                  </strong>
                                </span>
                                <span>
                                  <span className="text-slate-500">Y1 GP Adj.: </span>
                                  <strong className="text-amber-700 dark:text-amber-400 tabular-nums">
                                    {formatMoney(grid.totals.sumGrossProfitAdjustments)}
                                  </strong>
                                </span>
                                <span>
                                  <span className="text-slate-500">Y1 Other Inc.: </span>
                                  <strong className="text-[#2E5E88] dark:text-[#7EB2E2] tabular-nums">
                                    {formatMoney(grid.totals.sumOtherIncome)}
                                  </strong>
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                starts M{prod.startMonth || 1}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
