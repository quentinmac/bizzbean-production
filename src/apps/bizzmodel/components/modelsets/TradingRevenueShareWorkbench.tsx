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
  AlertTriangle,
  Share2,
} from 'lucide-react';
import { RevenueItem } from '../../constants';
import {
  RevenueShareCategory,
  RevenueShareCosCategory,
  RevenueShareExpenseItem,
} from './modelSetTypes';
import {
  calculateRevenueShareCategoryBreakdown,
  calculateRevenueShareProductYearGrid,
  getCosCategorySubtotalPct,
  getRevenueShareCategoryTotalPct,
  getRevenueShareDailySalesSeries60,
  resolveRevenueShareCategory,
} from './revenueShareEngine';

interface TradingRevenueShareWorkbenchProps {
  theme?: 'light' | 'dark';
  categories: RevenueShareCategory[];
  products: RevenueItem[];
  daysWorked60: number[];
  isPredetermined?: boolean;
  onAddCategory: () => void;
  onUpdateCategory: (categoryId: string, patch: Partial<RevenueShareCategory>) => void;
  onRemoveCategory: (categoryId: string) => void;
  onAddProductToCategory: (categoryId: string) => void;
  onUpdateProduct: (productIndex: number, patch: Partial<RevenueItem>) => void;
  onRemoveProduct: (productIndex: number) => void;
  onOpenResultsTab: (productIndex: number) => void;
}

export const TradingRevenueShareWorkbench: React.FC<TradingRevenueShareWorkbenchProps> = ({
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
  const [categoriesPanelOpen, setCategoriesPanelOpen] = useState<boolean>(true);
  const [collapsedProductGroups, setCollapsedProductGroups] = useState<Record<string, boolean>>({});
  const [expandedCosConfigIds, setExpandedCosConfigIds] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    if (categories[0]) init[categories[0].id] = true;
    return init;
  });

  // Compute Year 1 portfolio & category summaries
  const portfolioY1 = useMemo(
    () => calculateRevenueShareCategoryBreakdown(products, categories, daysWorked60, 1),
    [products, categories, daysWorked60]
  );

  const fmtCurrency = (val: number) => {
    const abs = Math.abs(Math.round(val));
    return val < 0 ? `-${abs.toLocaleString()}` : abs.toLocaleString();
  };

  // Group products with their original index under their governing Product Category
  const groupedByCategory = useMemo(() => {
    const map = new Map<string, Array<{ product: RevenueItem; idx: number }>>();
    categories.forEach((cat) => map.set(cat.id, []));

    products.forEach((prod, idx) => {
      const resolved = resolveRevenueShareCategory(prod, categories);
      const bucket = map.get(resolved.id);
      if (bucket) {
        bucket.push({ product: prod, idx });
      } else if (categories[0]) {
        map.get(categories[0].id)?.push({ product: prod, idx });
      }
    });

    return categories.map((cat) => ({
      category: cat,
      items: map.get(cat.id) || [],
    }));
  }, [categories, products]);

  // Nested Cost of Sales Category & Expense/Service Item CRUD helpers
  const handleAddCosCategory = (cat: RevenueShareCategory) => {
    const nextIdx = (cat.cosCategories || []).length + 1;
    const newCosCat: RevenueShareCosCategory = {
      id: `rs-cos-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `revenue share category ${nextIdx}`,
      items: [
        {
          id: `rs-exp-${Date.now()}-1`,
          name: 'partner service item',
          sharePct: 5.0,
        },
      ],
    };
    onUpdateCategory(cat.id, {
      cosCategories: [...(cat.cosCategories || []), newCosCat],
    });
    setExpandedCosConfigIds((prev) => ({ ...prev, [cat.id]: true }));
  };

  const handleRenameCosCategory = (
    cat: RevenueShareCategory,
    cosCatId: string,
    name: string
  ) => {
    onUpdateCategory(cat.id, {
      cosCategories: (cat.cosCategories || []).map((c) =>
        c.id === cosCatId ? { ...c, name } : c
      ),
    });
  };

  const handleRemoveCosCategory = (cat: RevenueShareCategory, cosCatId: string) => {
    if ((cat.cosCategories || []).length <= 1) return;
    onUpdateCategory(cat.id, {
      cosCategories: (cat.cosCategories || []).filter((c) => c.id !== cosCatId),
    });
  };

  const handleAddExpenseItem = (cat: RevenueShareCategory, cosCatId: string) => {
    const newExp: RevenueShareExpenseItem = {
      id: `rs-exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: 'new partner service',
      sharePct: 2.0,
    };
    onUpdateCategory(cat.id, {
      cosCategories: (cat.cosCategories || []).map((c) =>
        c.id === cosCatId ? { ...c, items: [...(c.items || []), newExp] } : c
      ),
    });
  };

  const handleUpdateExpenseItem = (
    cat: RevenueShareCategory,
    cosCatId: string,
    itemId: string,
    patch: Partial<RevenueShareExpenseItem>
  ) => {
    onUpdateCategory(cat.id, {
      cosCategories: (cat.cosCategories || []).map((c) =>
        c.id === cosCatId
          ? {
              ...c,
              items: (c.items || []).map((it) =>
                it.id === itemId ? { ...it, ...patch } : it
              ),
            }
          : c
      ),
    });
  };

  const handleRemoveExpenseItem = (
    cat: RevenueShareCategory,
    cosCatId: string,
    itemId: string
  ) => {
    onUpdateCategory(cat.id, {
      cosCategories: (cat.cosCategories || []).map((c) => {
        if (c.id !== cosCatId) return c;
        if ((c.items || []).length <= 1) return c;
        return {
          ...c,
          items: (c.items || []).filter((it) => it.id !== itemId),
        };
      }),
    });
  };

  // Product-level update helpers
  const handleUpdateDailyBase = (
    prod: RevenueItem,
    idx: number,
    newBase: number
  ) => {
    const safeBase = Math.max(0, Number(newBase) || 0);
    const resolvedCat = resolveRevenueShareCategory(prod, categories);
    const totalSharePct = getRevenueShareCategoryTotalPct(resolvedCat);
    const existingCfg = prod.revenueShareConfig;

    onUpdateProduct(idx, {
      modelType: 'revenue share',
      revenueShareCategoryId: resolvedCat.id,
      costOfSalesPct: totalSharePct,
      grossProfitMarginPctMonthly: new Array(60).fill(
        Number((100 - totalSharePct).toFixed(2))
      ),
      revenueShareConfig: {
        categoryId: resolvedCat.id,
        dailyValueSalesBase: safeBase,
        dailyValueSalesMonthly: new Array(60).fill(safeBase),
        otherIncomeMonthlyBase: existingCfg?.otherIncomeMonthlyBase ?? 0,
      },
    });
  };

  const handleUpdateOtherIncomeBase = (
    prod: RevenueItem,
    idx: number,
    newOther: number
  ) => {
    const safeOther = Number(newOther) || 0;
    const resolvedCat = resolveRevenueShareCategory(prod, categories);
    const existingCfg = prod.revenueShareConfig;
    const dailySeries = getRevenueShareDailySalesSeries60(prod);

    onUpdateProduct(idx, {
      modelType: 'revenue share',
      revenueShareCategoryId: resolvedCat.id,
      otherIncomeMonthly: new Array(60).fill(safeOther),
      revenueShareConfig: {
        categoryId: resolvedCat.id,
        dailyValueSalesBase: existingCfg?.dailyValueSalesBase ?? dailySeries[0] ?? 20000,
        dailyValueSalesMonthly: dailySeries,
        otherIncomeMonthlyBase: safeOther,
      },
    });
  };

  const handleChangeProductCategory = (
    prod: RevenueItem,
    idx: number,
    newCategoryId: string
  ) => {
    const targetCat = categories.find((c) => c.id === newCategoryId) || categories[0];
    if (!targetCat) return;
    const totalSharePct = getRevenueShareCategoryTotalPct(targetCat);
    const existingCfg = prod.revenueShareConfig;
    const dailySeries = getRevenueShareDailySalesSeries60(prod);

    onUpdateProduct(idx, {
      category: targetCat.name,
      modelType: 'revenue share',
      revenueShareCategoryId: targetCat.id,
      costOfSalesPct: totalSharePct,
      grossProfitMarginPctMonthly: new Array(60).fill(
        Number((100 - totalSharePct).toFixed(2))
      ),
      revenueShareConfig: {
        categoryId: targetCat.id,
        dailyValueSalesBase: existingCfg?.dailyValueSalesBase ?? dailySeries[0] ?? 20000,
        dailyValueSalesMonthly: dailySeries,
        otherIncomeMonthlyBase: existingCfg?.otherIncomeMonthlyBase ?? 0,
      },
    });
  };

  return (
    <div className="space-y-6 font-mono">
      {/* =================================================================== */}
      {/* 1. YEAR 1 PORTFOLIO SUMMARY STRIP                                   */}
      {/* =================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div
          className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-[#D8CEBC]'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            product categories
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
            {categories.length}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {products.length} product{products.length === 1 ? '' : 's'} assigned
          </span>
        </div>

        <div
          className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-[#D8CEBC]'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            year 1 value sales
          </span>
          <span className="text-lg font-bold text-[#2E5E88] dark:text-[#6BA3D6] tabular-nums">
            {fmtCurrency(portfolioY1.totalRevenue)}
          </span>
          <span className="text-[10px] text-slate-500 block">
            gross trading revenue
          </span>
        </div>

        <div
          className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-[#D8CEBC]'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            y1 revenue share (cos)
          </span>
          <span className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {fmtCurrency(portfolioY1.totalCostOfSales)}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {portfolioY1.weightedRevenueSharePct.toFixed(2)}% paid to partners
          </span>
        </div>

        <div
          className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-[#D8CEBC]'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            year 1 gross profit
          </span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {fmtCurrency(portfolioY1.totalGrossProfit)}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {portfolioY1.weightedGrossMarginPct.toFixed(2)}% retained margin
          </span>
        </div>

        <div
          className={`p-3.5 rounded-xl border col-span-2 lg:col-span-1 ${
            isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-[#D8CEBC]'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            year 1 other income
          </span>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
            {fmtCurrency(portfolioY1.totalOtherIncome)}
          </span>
          <span className="text-[10px] text-slate-500 block">
            transfers to trading account
          </span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. PRODUCT CATEGORIES & NESTED COST OF SALES CATEGORIES MANAGER     */}
      {/* =================================================================== */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
        }`}
      >
        <div
          className={`px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b ${
            isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#F8F5EE] border-[#D8CEBC]'
          }`}
        >
          <button
            type="button"
            onClick={() => setCategoriesPanelOpen(!categoriesPanelOpen)}
            className="flex items-center gap-2 text-left cursor-pointer"
          >
            <Share2 className="h-4 w-4 text-[#2E5E88] dark:text-[#6BA3D6]" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                PRODUCT CATEGORIES &amp; COST OF SALES STRUCTURE (GOVERNS REVENUE SHARE %)
              </span>
              <span className="text-[10px] text-slate-500 lowercase block">
                add cost of sales categories &amp; partner expense/service items inside each product category — their aggregate % governs cost of sales for all products listed in that category
              </span>
            </div>
            {categoriesPanelOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-400 ml-1" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={onAddCategory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold lowercase shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>add product category</span>
          </button>
        </div>

        {categoriesPanelOpen && (
          <div className="p-4 space-y-4">
            {categories.map((cat, catIdx) => {
              const totalSharePct = getRevenueShareCategoryTotalPct(cat);
              const retainedGpPct = Number((100 - totalSharePct).toFixed(2));
              const isOver100 = totalSharePct > 100;
              const summary = portfolioY1.categorySummaries.find(
                (s) => s.category.id === cat.id
              );
              const assignedCount = summary?.productCount ?? 0;
              const isCosExpanded = !!expandedCosConfigIds[cat.id];
              const totalServiceItems = (cat.cosCategories || []).reduce(
                (acc, c) => acc + (c.items || []).length,
                0
              );

              return (
                <div
                  key={cat.id}
                  className={`rounded-xl border overflow-hidden ${
                    isDark
                      ? 'bg-[#101626] border-[#222F4C]'
                      : 'bg-slate-50/70 border-[#D8CEBC]'
                  }`}
                >
                  {/* Product Category Header Row */}
                  <div
                    className={`p-3.5 flex flex-wrap items-center justify-between gap-3 border-b ${
                      isDark
                        ? 'bg-[#141D34] border-[#222F4C]'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2.5 flex-grow min-w-[260px]">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#6BA3D6] uppercase">
                        cat {catIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) =>
                          onUpdateCategory(cat.id, { name: e.target.value })
                        }
                        placeholder="Product Category Name"
                        className={`flex-grow max-w-xs p-1.5 rounded-lg border text-xs font-bold ${
                          isDark
                            ? 'bg-[#0E1322] border-[#252E4A] text-white'
                            : 'bg-white border-[#D8CEBC] text-slate-900'
                        }`}
                      />
                      <input
                        type="text"
                        value={cat.description || ''}
                        onChange={(e) =>
                          onUpdateCategory(cat.id, { description: e.target.value })
                        }
                        placeholder="Optional category notes..."
                        className={`flex-grow max-w-sm p-1.5 rounded-lg border text-[11px] ${
                          isDark
                            ? 'bg-[#0E1322] border-[#252E4A] text-slate-300'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      />
                    </div>

                    {/* Governing Totals + Expand/Delete Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border tabular-nums ${
                          isOver100
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                        }`}
                      >
                        {isOver100 && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                        Rev Share (COS): {totalSharePct.toFixed(2)}%
                      </span>

                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
                        Retained GP: {retainedGpPct.toFixed(2)}%
                      </span>

                      <span className="text-[10px] text-slate-500 tabular-nums px-1">
                        {(cat.cosCategories || []).length} COS cats · {totalServiceItems} items · {assignedCount} prod{assignedCount === 1 ? '' : 's'}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCosConfigIds((prev) => ({
                            ...prev,
                            [cat.id]: !prev[cat.id],
                          }))
                        }
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold lowercase transition-colors cursor-pointer ${
                          isCosExpanded
                            ? 'bg-[#2E5E88] text-white border-[#2E5E88]'
                            : isDark
                            ? 'bg-[#0E1322] text-slate-300 border-[#252E4A] hover:text-white'
                            : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <span>{isCosExpanded ? 'hide cos breakdown' : 'edit cos categories'}</span>
                        {isCosExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>

                      {categories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveCategory(cat.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete product category (re-assigns products to first remaining category)"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Nested Cost of Sales Categories & Expense/Service Items */}
                  {isCosExpanded && (
                    <div className="p-3.5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          COST OF SALES CATEGORIES FOR “{cat.name}”
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddCosCategory(cat)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold lowercase transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-[#141D34] border-[#2A3B60] text-[#6BA3D6] hover:bg-[#1B2644]'
                              : 'bg-white border-[#2E5E88]/40 text-[#2E5E88] hover:bg-[#2E5E88]/10'
                          }`}
                        >
                          <Plus className="h-3 w-3" />
                          <span>add cost of sales category</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                        {(cat.cosCategories || []).map((cosCat, cosIdx) => {
                          const subPct = getCosCategorySubtotalPct(cosCat);
                          return (
                            <div
                              key={cosCat.id}
                              className={`rounded-xl border flex flex-col justify-between ${
                                isDark
                                  ? 'bg-[#0E1322] border-[#222F4C]'
                                  : 'bg-white border-slate-200 shadow-2xs'
                              }`}
                            >
                              <div>
                                {/* Cost of Sales Category Header */}
                                <div
                                  className={`px-3 py-2 flex items-center justify-between gap-2 border-b ${
                                    isDark
                                      ? 'bg-[#121A2F] border-[#222F4C]'
                                      : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 flex-grow">
                                    <span className="text-[10px] font-bold text-slate-400">
                                      #{cosIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={cosCat.name}
                                      onChange={(e) =>
                                        handleRenameCosCategory(
                                          cat,
                                          cosCat.id,
                                          e.target.value
                                        )
                                      }
                                      placeholder="Cost of Sales Category"
                                      className={`w-full px-1.5 py-1 rounded border text-xs font-bold ${
                                        isDark
                                          ? 'bg-[#0E1322] border-[#252E4A] text-white'
                                          : 'bg-white border-slate-300 text-slate-900'
                                      }`}
                                    />
                                  </div>
                                  {(cat.cosCategories || []).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveCosCategory(cat, cosCat.id)
                                      }
                                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                      title="Remove cost of sales category"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>

                                {/* Expense / Service Items List */}
                                <div className="p-2.5 space-y-1.5">
                                  <div className="grid grid-cols-12 gap-1.5 text-[10px] font-bold uppercase text-slate-400 px-1">
                                    <span className="col-span-7">expense / service item</span>
                                    <span className="col-span-4 text-right">share %</span>
                                    <span className="col-span-1"></span>
                                  </div>

                                  {(cosCat.items || []).map((expItem) => (
                                    <div
                                      key={expItem.id}
                                      className="grid grid-cols-12 gap-1.5 items-center"
                                    >
                                      <input
                                        type="text"
                                        value={expItem.name}
                                        onChange={(e) =>
                                          handleUpdateExpenseItem(
                                            cat,
                                            cosCat.id,
                                            expItem.id,
                                            { name: e.target.value }
                                          )
                                        }
                                        placeholder="service / partner"
                                        className={`col-span-7 px-2 py-1 rounded-lg border text-xs lowercase ${
                                          isDark
                                            ? 'bg-[#141A2E] border-[#252E4A] text-slate-200'
                                            : 'bg-slate-50 border-slate-200 text-slate-800'
                                        }`}
                                      />
                                      <div className="col-span-4 relative">
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          step="0.25"
                                          value={expItem.sharePct}
                                          onChange={(e) => {
                                            const raw = parseFloat(e.target.value);
                                            const clamped = isNaN(raw)
                                              ? 0
                                              : Math.max(0, Math.min(100, raw));
                                            handleUpdateExpenseItem(
                                              cat,
                                              cosCat.id,
                                              expItem.id,
                                              { sharePct: clamped }
                                            );
                                          }}
                                          className={`w-full px-2 py-1 pr-5 rounded-lg border text-xs font-bold text-right tabular-nums ${
                                            isDark
                                              ? 'bg-[#141A2E] border-[#252E4A] text-rose-300'
                                              : 'bg-sky-50/70 border-sky-200 text-rose-700'
                                          }`}
                                        />
                                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                                          %
                                        </span>
                                      </div>
                                      <div className="col-span-1 flex justify-center">
                                        {(cosCat.items || []).length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRemoveExpenseItem(
                                                cat,
                                                cosCat.id,
                                                expItem.id
                                              )
                                            }
                                            className="p-0.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                            title="Remove expense/service item"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Cost of Sales Category Footer: Add Item + Sub Total */}
                              <div
                                className={`px-3 py-2 border-t flex items-center justify-between text-xs ${
                                  isDark
                                    ? 'bg-[#121A2F]/60 border-[#222F4C]'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleAddExpenseItem(cat, cosCat.id)}
                                  className="flex items-center gap-1 text-[11px] font-bold lowercase text-[#2E5E88] dark:text-[#6BA3D6] hover:underline cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>add service item</span>
                                </button>
                                <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                  sub total: {subPct.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Aggregate Governance Bar */}
                      <div
                        className={`px-3.5 py-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
                          isOver100
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                            : isDark
                            ? 'bg-[#121A2F] border-[#222F4C] text-slate-200'
                            : 'bg-[#F8F5EE] border-[#D8CEBC] text-slate-800'
                        }`}
                      >
                        <span className="font-bold lowercase">
                          aggregate revenue share paid to partners (cost of sales for “{cat.name}”):
                        </span>
                        <div className="flex items-center gap-4 tabular-nums font-bold">
                          <span className="text-rose-600 dark:text-rose-400">
                            total revenue share: {totalSharePct.toFixed(2)}%
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            retained GP margin: {retainedGpPct.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <p className="text-[11px] text-slate-500 lowercase">
              * each product category’s cost of sales categories and partner expense/service items automatically govern the revenue share % (cost of sales) for every product listed inside it.
            </p>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 3. PRODUCTS LISTED WITHIN THEIR RESPECTIVE PRODUCT CATEGORIES       */}
      {/* =================================================================== */}
      <div className="space-y-4">
        {groupedByCategory.map(({ category, items }) => {
          const isCollapsed = !!collapsedProductGroups[category.id];
          const totalSharePct = getRevenueShareCategoryTotalPct(category);
          const retainedGpPct = Number((100 - totalSharePct).toFixed(2));
          const catSummary = portfolioY1.categorySummaries.find(
            (s) => s.category.id === category.id
          );

          return (
            <div
              key={category.id}
              className={`rounded-2xl border overflow-hidden ${
                isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
              }`}
            >
              {/* Category Group Header */}
              <div
                className={`px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b ${
                  isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedProductGroups((prev) => ({
                      ...prev,
                      [category.id]: !prev[category.id],
                    }))
                  }
                  className="flex flex-wrap items-center gap-2.5 text-left cursor-pointer"
                >
                  <FolderOpen className="h-4 w-4 text-[#2E5E88] dark:text-[#6BA3D6]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {category.name}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25">
                    Revenue Share (COS): {totalSharePct.toFixed(2)}%
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                    Retained GP: {retainedGpPct.toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ({items.length} product{items.length === 1 ? '' : 's'})
                  </span>
                  {isCollapsed ? (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </button>

                <div className="flex items-center gap-3">
                  {catSummary && catSummary.yearRevenue > 0 && (
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tabular-nums hidden sm:inline">
                      Y1 Sales: {fmtCurrency(catSummary.yearRevenue)} · COS:{' '}
                      <span className="text-rose-600 dark:text-rose-400">
                        {fmtCurrency(catSummary.yearCostOfSales)}
                      </span>{' '}
                      · GP:{' '}
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {fmtCurrency(catSummary.yearGrossProfit)}
                      </span>
                    </span>
                  )}
                  {!isPredetermined && (
                    <button
                      type="button"
                      onClick={() => onAddProductToCategory(category.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold lowercase transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-[#141D34] border-[#2A3B60] text-[#6BA3D6] hover:bg-[#1B2644]'
                          : 'bg-white border-[#2E5E88]/40 text-[#2E5E88] hover:bg-[#2E5E88]/10'
                      }`}
                    >
                      <Plus className="h-3 w-3" />
                      <span>add product to category</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Products Inside This Category */}
              {!isCollapsed && (
                <div className="p-4 space-y-3">
                  {items.length === 0 ? (
                    <div
                      className={`p-4 rounded-xl border border-dashed text-center text-xs text-slate-400 lowercase ${
                        isDark ? 'border-[#222F4C]' : 'border-slate-200'
                      }`}
                    >
                      no products assigned to “{category.name}” yet. click “add product to category” above or reassign an existing product below.
                    </div>
                  ) : (
                    items.map(({ product: prod, idx }) => {
                      const y1Grid = calculateRevenueShareProductYearGrid(
                        prod,
                        categories,
                        daysWorked60,
                        1
                      );
                      const dailySeries = getRevenueShareDailySalesSeries60(prod);
                      const dailyBase =
                        prod.revenueShareConfig?.dailyValueSalesBase ??
                        dailySeries[0] ??
                        20000;
                      const otherIncomeBase =
                        prod.otherIncomeMonthly?.[0] ??
                        prod.revenueShareConfig?.otherIncomeMonthlyBase ??
                        0;

                      return (
                        <div
                          key={prod.id}
                          className={`p-4 rounded-xl border space-y-3 transition-all ${
                            isDark
                              ? 'bg-[#101626] border-[#222F4C]'
                              : 'bg-slate-50/70 border-slate-200'
                          }`}
                        >
                          {/* Product Top Row */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 flex-grow max-w-md">
                              <Layers className="h-3.5 w-3.5 text-[#2E5E88] dark:text-[#6BA3D6] shrink-0" />
                              {isPredetermined ? (
                                <span className="text-xs font-bold lowercase text-slate-900 dark:text-white">
                                  {prod.name}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  value={prod.name}
                                  onChange={(e) =>
                                    onUpdateProduct(idx, { name: e.target.value })
                                  }
                                  placeholder="Product / Revenue Stream Name"
                                  className={`w-full p-1.5 rounded-lg border text-xs font-bold lowercase ${
                                    isDark
                                      ? 'bg-[#141A2E] border-[#252E4A] text-white'
                                      : 'bg-white border-[#D8CEBC] text-slate-900'
                                  }`}
                                />
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* Move Product to Another Product Category */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 lowercase">
                                  category:
                                </span>
                                <select
                                  value={category.id}
                                  onChange={(e) =>
                                    handleChangeProductCategory(prod, idx, e.target.value)
                                  }
                                  className={`py-1 px-2 rounded-lg border text-[11px] font-bold cursor-pointer ${
                                    isDark
                                      ? 'bg-[#141A2E] border-[#252E4A] text-white'
                                      : 'bg-white border-[#D8CEBC] text-slate-900'
                                  }`}
                                >
                                  {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name} ({getRevenueShareCategoryTotalPct(c).toFixed(2)}% COS)
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => onOpenResultsTab(idx)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2E5E88]/15 hover:bg-[#2E5E88]/25 text-[#2E5E88] dark:text-[#6BA3D6] text-[11px] font-bold lowercase transition-colors cursor-pointer"
                              >
                                <span>results &amp; slider</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>

                              {!isPredetermined && products.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveProduct(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                  title="Remove product"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Product Inputs Grid (matching revenue share.PNG assumptions) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            {/* 1. Start Month */}
                            <div className="space-y-1">
                              <label className="text-slate-500 lowercase block font-bold flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-[#2E5E88] dark:text-[#6BA3D6]" />
                                <span>start month:</span>
                              </label>
                              <select
                                value={prod.startMonth || 1}
                                onChange={(e) =>
                                  onUpdateProduct(idx, {
                                    startMonth: Number(e.target.value),
                                  })
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
                                launch month (1–12)
                              </span>
                            </div>

                            {/* 2. Value Sales - Per Day */}
                            <div className="space-y-1">
                              <label className="text-slate-500 lowercase block font-bold flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-[#2E5E88] dark:text-[#6BA3D6]" />
                                <span>value sales - per day:</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="500"
                                value={dailyBase}
                                onChange={(e) =>
                                  handleUpdateDailyBase(
                                    prod,
                                    idx,
                                    parseFloat(e.target.value)
                                  )
                                }
                                className={`w-full p-2 rounded-xl border text-xs font-bold text-right tabular-nums ${
                                  isDark
                                    ? 'bg-[#141A2E] border-[#252E4A] text-white'
                                    : 'bg-white border-[#D8CEBC] text-slate-900'
                                }`}
                              />
                              <span className="text-[10px] text-slate-400 block">
                                base daily revenue (adjustable on results)
                              </span>
                            </div>

                            {/* 3. Governed Total Revenue Share % (Read-Only from Category) */}
                            <div className="space-y-1">
                              <label className="text-slate-500 lowercase block font-bold flex items-center gap-1">
                                <Tag className="h-3 w-3 text-rose-500" />
                                <span>revenue share % (cos):</span>
                              </label>
                              <div
                                className={`w-full p-2 rounded-xl border text-xs font-bold text-right tabular-nums flex items-center justify-between ${
                                  isDark
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                                }`}
                              >
                                <span className="text-[10px] font-normal lowercase opacity-80">
                                  from category
                                </span>
                                <span>{totalSharePct.toFixed(2)}%</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block">
                                {(category.cosCategories || []).length} COS categories · GP {retainedGpPct.toFixed(2)}%
                              </span>
                            </div>

                            {/* 4. Other Income (Monthly Base) */}
                            <div className="space-y-1">
                              <label className="text-slate-500 lowercase block font-bold flex items-center gap-1">
                                <Percent className="h-3 w-3 text-indigo-500" />
                                <span>other income / mo:</span>
                              </label>
                              <input
                                type="number"
                                step="500"
                                value={otherIncomeBase}
                                onChange={(e) =>
                                  handleUpdateOtherIncomeBase(
                                    prod,
                                    idx,
                                    parseFloat(e.target.value)
                                  )
                                }
                                className={`w-full p-2 rounded-xl border text-xs font-bold text-right tabular-nums ${
                                  isDark
                                    ? 'bg-[#141A2E] border-[#252E4A] text-white'
                                    : 'bg-white border-[#D8CEBC] text-slate-900'
                                }`}
                              />
                              <span className="text-[10px] text-slate-400 block">
                                monthly base (adjustable on results)
                              </span>
                            </div>
                          </div>

                          {/* Derived Year 1 Preview Bar */}
                          <div
                            className={`px-3 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px] ${
                              isDark
                                ? 'bg-[#0B101D] border border-[#1E2A45]'
                                : 'bg-white border border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <TrendingUp className="h-3.5 w-3.5 text-[#2E5E88]" />
                              <span className="lowercase font-bold">year 1 preview:</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 tabular-nums">
                              <span>
                                <span className="text-slate-400">value sales: </span>
                                <strong className="text-slate-900 dark:text-white">
                                  {fmtCurrency(y1Grid.totals.sumValueSales)}
                                </strong>
                              </span>
                              <span>
                                <span className="text-slate-400">revenue share (cos): </span>
                                <strong className="text-rose-600 dark:text-rose-400">
                                  {fmtCurrency(y1Grid.totals.sumCostOfSales)}
                                </strong>
                              </span>
                              <span>
                                <span className="text-slate-400">gross profit: </span>
                                <strong className="text-emerald-600 dark:text-emerald-400">
                                  {fmtCurrency(y1Grid.totals.sumGrossProfit)}
                                </strong>
                              </span>
                              <span>
                                <span className="text-slate-400">other income: </span>
                                <strong className="text-indigo-600 dark:text-indigo-400">
                                  {fmtCurrency(y1Grid.totals.sumOtherIncome)}
                                </strong>
                              </span>
                            </div>
                          </div>
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
