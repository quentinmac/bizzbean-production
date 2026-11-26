import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sliders,
  BarChart2,
  Lock,
  Layers,
  Share2,
} from 'lucide-react';
import { RevenueItem } from '../../constants';
import { AssumptionRateItem } from '../../../bizzdynamics/types';
import { BaseRateAdjustmentTool } from '../../../bizzdynamics/components/BaseRateAdjustmentTool';
import { RevenueShareCategory } from './modelSetTypes';
import {
  calculateRevenueShareCategoryBreakdown,
  calculateRevenueShareProductYearGrid,
  getRevenueShareDailySalesSeries60,
  resolveRevenueShareCategory,
} from './revenueShareEngine';

type RevenueShareAdjustableKey = 'dailyValueSales' | 'otherIncome';

const RS_ADJUSTABLE_META: Array<{
  key: RevenueShareAdjustableKey;
  name: string;
  description: string;
  unit: '%' | 'currency' | 'number';
  changeType: 'percentage' | 'value';
}> = [
  {
    key: 'dailyValueSales',
    name: 'value sales - per day',
    description: 'daily value sales changed by ADJUSTMENT SLIDER - % growth over previous month',
    unit: 'currency',
    changeType: 'percentage',
  },
  {
    key: 'otherIncome',
    name: 'other income',
    description: 'monthly other income changed by ADJUSTMENT SLIDER - % adjustment over previous month',
    unit: 'currency',
    changeType: 'percentage',
  },
];

interface RevenueShareResultsViewProps {
  theme?: 'light' | 'dark';
  categories: RevenueShareCategory[];
  products: RevenueItem[];
  activeProductIdx: number;
  onSelectProductIdx: (idx: number) => void;
  activeYear: number;
  onSelectYear: (yr: number) => void;
  daysWorked60: number[];
  onUpdateProduct: (productIndex: number, patch: Partial<RevenueItem>) => void;
  onGoToAssumptions: () => void;
}

export const RevenueShareResultsView: React.FC<RevenueShareResultsViewProps> = ({
  theme = 'light',
  categories,
  products,
  activeProductIdx,
  onSelectProductIdx,
  activeYear,
  onSelectYear,
  daysWorked60,
  onUpdateProduct,
  onGoToAssumptions,
}) => {
  const isDark = theme === 'dark';
  const [selectedAdjustableKey, setSelectedAdjustableKey] =
    useState<RevenueShareAdjustableKey>('dailyValueSales');

  const safeIdx = Math.min(activeProductIdx, Math.max(0, products.length - 1));
  const currentProduct = products[safeIdx] || products[0];

  const category = useMemo(
    () =>
      currentProduct
        ? resolveRevenueShareCategory(currentProduct, categories)
        : categories[0],
    [currentProduct, categories]
  );

  const grid = useMemo(() => {
    if (!currentProduct) return null;
    return calculateRevenueShareProductYearGrid(
      currentProduct,
      categories,
      daysWorked60,
      activeYear
    );
  }, [currentProduct, categories, daysWorked60, activeYear]);

  const activeSliderItem: AssumptionRateItem | null = useMemo(() => {
    if (!currentProduct) return null;
    const meta =
      RS_ADJUSTABLE_META.find((m) => m.key === selectedAdjustableKey) ||
      RS_ADJUSTABLE_META[0];

    let series: number[];
    if (selectedAdjustableKey === 'dailyValueSales') {
      series = getRevenueShareDailySalesSeries60(currentProduct);
    } else {
      series =
        Array.isArray(currentProduct.otherIncomeMonthly) &&
        currentProduct.otherIncomeMonthly.length >= 60
          ? currentProduct.otherIncomeMonthly
          : new Array(60).fill(
              currentProduct.revenueShareConfig?.otherIncomeMonthlyBase ?? 0
            );
    }

    const baseRate = series[0] ?? 0;

    return {
      id: `${currentProduct.id}-rs-${meta.key}`,
      stepId: 2,
      stepName: 'revenue calculator (revenue share)',
      name: `${meta.name} (${currentProduct.name})`,
      description: meta.description,
      baseRate,
      unit: meta.unit,
      changeType: meta.changeType,
      monthlyValues: series,
    };
  }, [currentProduct, selectedAdjustableKey]);

  const handleSliderUpdateMonthlyValues = (_id: string, newMonthlyValues: number[]) => {
    if (!currentProduct) return;
    if (selectedAdjustableKey === 'dailyValueSales') {
      const existingCfg = currentProduct.revenueShareConfig;
      onUpdateProduct(safeIdx, {
        modelType: 'revenue share',
        revenueShareCategoryId: category.id,
        revenueShareConfig: {
          categoryId: category.id,
          dailyValueSalesBase: newMonthlyValues[0] ?? existingCfg?.dailyValueSalesBase ?? 20000,
          dailyValueSalesMonthly: newMonthlyValues,
          otherIncomeMonthlyBase: existingCfg?.otherIncomeMonthlyBase ?? 0,
        },
      });
    } else {
      const existingCfg = currentProduct.revenueShareConfig;
      const dailySeries = getRevenueShareDailySalesSeries60(currentProduct);
      onUpdateProduct(safeIdx, {
        otherIncomeMonthly: newMonthlyValues,
        revenueShareConfig: {
          categoryId: category.id,
          dailyValueSalesBase: existingCfg?.dailyValueSalesBase ?? dailySeries[0] ?? 20000,
          dailyValueSalesMonthly: dailySeries,
          otherIncomeMonthlyBase: newMonthlyValues[0] ?? 0,
        },
      });
    }
  };

  const handleSliderUpdateBaseRate = (_id: string, newBaseRate: number) => {
    handleSliderUpdateMonthlyValues(_id, new Array(60).fill(newBaseRate));
  };

  const handleCycleSliderItem = (direction: 'prev' | 'next') => {
    const idx = RS_ADJUSTABLE_META.findIndex((m) => m.key === selectedAdjustableKey);
    const nextIdx =
      direction === 'next'
        ? (idx + 1) % RS_ADJUSTABLE_META.length
        : (idx - 1 + RS_ADJUSTABLE_META.length) % RS_ADJUSTABLE_META.length;
    setSelectedAdjustableKey(RS_ADJUSTABLE_META[nextIdx].key);
  };

  const fmtInt = (val: number) => {
    if (val === 0) return '0';
    const abs = Math.abs(Math.round(val));
    return val < 0 ? `-${abs.toLocaleString()}` : abs.toLocaleString();
  };

  if (!currentProduct || !grid) return null;

  const baseDailySales =
    currentProduct.revenueShareConfig?.dailyValueSalesBase ??
    getRevenueShareDailySalesSeries60(currentProduct)[0] ??
    20000;
  const baseOtherIncome =
    currentProduct.otherIncomeMonthly?.[0] ??
    currentProduct.revenueShareConfig?.otherIncomeMonthlyBase ??
    0;

  return (
    <div className="space-y-6 animate-in fade-in duration-150 font-mono">
      {/* 1. AUTHENTIC REVENUE SHARE CALCULATION TABLE (matching revenue share.PNG) */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                RESULTS — REVENUE SHARE
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Revenue shared with service providers transfers to Trading Account as Cost of Sales. Select any radio button on the right to adjust that row with the ADJUSTMENT SLIDER below.
              </p>
            </div>

            {/* Product Dropdown */}
            <select
              value={safeIdx}
              onChange={(e) => onSelectProductIdx(Number(e.target.value))}
              className={`py-1.5 px-3 rounded-xl border text-xs font-bold lowercase cursor-pointer ${
                isDark
                  ? 'bg-[#0E1322] border-[#222F4C] text-white'
                  : 'bg-white border-[#D8CEBC] text-slate-900 shadow-2xs'
              }`}
            >
              {products.map((prod, idx) => {
                const pCat = resolveRevenueShareCategory(prod, categories);
                return (
                  <option key={prod.id} value={idx}>
                    {prod.name} ({pCat.name})
                  </option>
                );
              })}
            </select>

            {/* Year Selector */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => onSelectYear(yr)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    activeYear === yr
                      ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                      : isDark
                      ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                      : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
                  }`}
                >
                  yr {yr}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onGoToAssumptions}
              className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-full border border-rose-500/25 transition-colors cursor-pointer"
              title="Edit Product Category & Cost of Sales Categories on Assumptions tab"
            >
              <Share2 className="h-3 w-3" />
              <span>
                {grid.categoryName} · COS {grid.totalRevenueSharePct.toFixed(2)}%
              </span>
            </button>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <RefreshCw className="h-3 w-3" />
              <span>Live 2-Way Sync</span>
            </div>
          </div>
        </div>

        {/* Revenue Share 12-Month Matrix matching revenue share.PNG */}
        <div className="overflow-x-auto pb-2">
          <table className="w-full text-right text-[11px] border-collapse min-w-[1160px]">
            <thead>
              <tr
                className={`border-b-2 text-[10px] font-bold uppercase ${
                  isDark
                    ? 'bg-[#121A2F] border-[#222F4C] text-slate-300'
                    : 'bg-[#F8F5EE] border-[#D8CEBC] text-slate-700'
                }`}
              >
                <th className="py-2.5 px-3 text-left sticky left-0 z-10 min-w-[230px] bg-inherit">
                  revenue calculator · {currentProduct.name}
                </th>
                <th className="py-2.5 px-2 text-right min-w-[90px] border-r border-slate-300 dark:border-slate-700">
                  base / rate
                </th>
                {grid.months.map((m) => (
                  <th key={m.monthNum} className="py-2.5 px-1.5 text-right min-w-[74px]">
                    <div>M{m.monthNum}</div>
                    <div className="text-[9px] font-normal text-slate-400">
                      {m.daysWorked}d
                    </div>
                  </th>
                ))}
                <th className="py-2.5 px-2.5 text-right min-w-[92px] border-l border-slate-300 dark:border-slate-700">
                  yr {activeYear} total
                </th>
                <th className="py-2.5 px-2 text-center min-w-[54px]">slider</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 tabular-nums">
              {/* SECTION 1: REVENUE */}
              <tr className={isDark ? 'bg-[#141D34]' : 'bg-slate-100/90'}>
                <td
                  colSpan={16}
                  className="py-1.5 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#2E5E88] dark:text-[#6BA3D6]"
                >
                  revenue
                </td>
              </tr>

              {/* Start Month */}
              <tr>
                <td className="py-1.5 px-3 text-left text-slate-600 dark:text-slate-300 sticky left-0 bg-inherit">
                  start month
                </td>
                <td className="py-1.5 px-2 text-right font-bold bg-sky-500/10 text-[#2E5E88] dark:text-[#6BA3D6] border-r border-slate-200 dark:border-slate-700">
                  {currentProduct.startMonth || 1}
                </td>
                {grid.months.map((m) => (
                  <td key={m.monthNum} className="py-1.5 px-1.5 text-slate-400">
                    {m.absMonth === (currentProduct.startMonth || 1) ? 'launch' : ''}
                  </td>
                ))}
                <td className="py-1.5 px-2.5 text-slate-400 border-l border-slate-200 dark:border-slate-700">
                  {grid.totals.totalDaysWorked}d
                </td>
                <td className="py-1.5 px-2 text-center text-slate-300 dark:text-slate-700">
                  —
                </td>
              </tr>

              {/* Value Sales - Per Day (Base) */}
              <tr>
                <td className="py-1.5 px-3 text-left text-slate-600 dark:text-slate-300 sticky left-0 bg-inherit">
                  value sales - per day (base)
                </td>
                <td className="py-1.5 px-2 text-right font-semibold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">
                  {fmtInt(baseDailySales)}
                </td>
                {grid.months.map((m) => (
                  <td key={m.monthNum} className="py-1.5 px-1.5 text-slate-400">
                    {m.absMonth === (currentProduct.startMonth || 1)
                      ? fmtInt(baseDailySales)
                      : ''}
                  </td>
                ))}
                <td className="py-1.5 px-2.5 text-slate-400 border-l border-slate-200 dark:border-slate-700">
                  —
                </td>
                <td className="py-1.5 px-2 text-center text-slate-300 dark:text-slate-700">
                  —
                </td>
              </tr>

              {/* Value Sales - Per Day (Monthly Slider Row) */}
              <tr
                onClick={() => setSelectedAdjustableKey('dailyValueSales')}
                className={`cursor-pointer transition-colors ${
                  selectedAdjustableKey === 'dailyValueSales'
                    ? 'bg-[#2E5E88]/10'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <td className="py-2 px-3 text-left font-bold text-slate-900 dark:text-white sticky left-0 bg-inherit">
                  value sales - per day
                </td>
                <td className="py-2 px-2 text-right font-bold bg-sky-500/10 text-[#2E5E88] dark:text-[#6BA3D6] border-r border-slate-200 dark:border-slate-700">
                  {fmtInt(baseDailySales)}
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.monthNum}
                    className={`py-2 px-1.5 ${
                      m.isLaunched
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  >
                    {m.isLaunched ? fmtInt(m.dailyValueSales) : '—'}
                  </td>
                ))}
                <td className="py-2 px-2.5 font-bold text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700">
                  {fmtInt(grid.totals.avgDailyValueSales)} avg
                </td>
                <td className="py-2 px-2 text-center">
                  <input
                    type="radio"
                    name="rs-slider-row"
                    checked={selectedAdjustableKey === 'dailyValueSales'}
                    onChange={() => setSelectedAdjustableKey('dailyValueSales')}
                    className="accent-[#2E5E88] cursor-pointer"
                  />
                </td>
              </tr>

              {/* Value Sales - Per Day Growth % */}
              <tr>
                <td className="py-1.5 px-3 text-left text-slate-500 sticky left-0 bg-inherit">
                  value sales - per day growth %
                </td>
                <td className="py-1.5 px-2 text-right text-slate-400 border-r border-slate-200 dark:border-slate-700">
                  —
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.monthNum}
                    className={`py-1.5 px-1.5 text-[10px] ${
                      m.dailyValueSalesGrowthPct > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : m.dailyValueSalesGrowthPct < 0
                        ? 'text-rose-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {m.isLaunched && m.dailyValueSalesGrowthPct !== 0
                      ? `${m.dailyValueSalesGrowthPct > 0 ? '+' : ''}${m.dailyValueSalesGrowthPct.toFixed(1)}%`
                      : ''}
                  </td>
                ))}
                <td className="py-1.5 px-2.5 text-slate-400 border-l border-slate-200 dark:border-slate-700">
                  —
                </td>
                <td className="py-1.5 px-2 text-center text-slate-300 dark:text-slate-700">
                  —
                </td>
              </tr>

              {/* Value Sales (Total Monthly Revenue) */}
              <tr
                className={
                  isDark
                    ? 'bg-[#121C35] font-bold'
                    : 'bg-[#EEF4FA] font-bold'
                }
              >
                <td className="py-2 px-3 text-left text-[#2E5E88] dark:text-[#6BA3D6] sticky left-0 bg-inherit">
                  value sales
                </td>
                <td className="py-2 px-2 text-right text-slate-400 border-r border-slate-200 dark:border-slate-700">
                  —
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.monthNum}
                    className="py-2 px-1.5 text-[#2E5E88] dark:text-[#6BA3D6]"
                  >
                    {m.isLaunched ? fmtInt(m.valueSales) : '—'}
                  </td>
                ))}
                <td className="py-2 px-2.5 text-[#2E5E88] dark:text-[#6BA3D6] border-l border-slate-200 dark:border-slate-700">
                  {fmtInt(grid.totals.sumValueSales)}
                </td>
                <td className="py-2 px-2 text-center text-slate-400">—</td>
              </tr>

              {/* SECTION 2: COST OF SALES CATEGORIES & PARTNER EXPENSE/SERVICE ITEMS */}
              {grid.cosCategories.map((cosCat) => (
                <React.Fragment key={cosCat.id}>
                  {/* Cost of Sales Category Header */}
                  <tr className={isDark ? 'bg-[#141D34]' : 'bg-slate-100/90'}>
                    <td
                      colSpan={16}
                      className="py-1.5 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400"
                    >
                      {cosCat.name}
                    </td>
                  </tr>

                  {/* Expense / Service Items inside this Cost of Sales Category */}
                  {cosCat.items.map((expRow) => (
                    <tr
                      key={expRow.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/20"
                    >
                      <td className="py-1.5 px-3 text-left text-slate-700 dark:text-slate-300 sticky left-0 bg-inherit lowercase">
                        {expRow.name}
                      </td>
                      <td className="py-1.5 px-2 text-right font-bold bg-sky-500/10 text-rose-700 dark:text-rose-300 border-r border-slate-200 dark:border-slate-700">
                        {expRow.sharePct.toFixed(2)}%
                      </td>
                      {expRow.monthlyAmounts.map((amt, mIdx) => (
                        <td
                          key={mIdx}
                          className="py-1.5 px-1.5 text-rose-600/90 dark:text-rose-400/90"
                        >
                          {grid.months[mIdx].isLaunched ? fmtInt(amt) : '—'}
                        </td>
                      ))}
                      <td className="py-1.5 px-2.5 font-semibold text-rose-600 dark:text-rose-400 border-l border-slate-200 dark:border-slate-700">
                        {fmtInt(expRow.yearTotal)}
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <span title="Governed by Product Category on Assumptions tab">
                          <Lock className="h-3 w-3 text-slate-400 inline" />
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Cost of Sales Category Sub Total */}
                  <tr
                    className={
                      isDark
                        ? 'bg-rose-500/5 font-bold'
                        : 'bg-rose-50/50 font-bold'
                    }
                  >
                    <td className="py-1.5 px-3 text-left text-slate-800 dark:text-slate-200 sticky left-0 bg-inherit">
                      sub total
                    </td>
                    <td className="py-1.5 px-2 text-right text-rose-700 dark:text-rose-400 border-r border-slate-200 dark:border-slate-700">
                      {cosCat.subtotalPct.toFixed(2)}%
                    </td>
                    {cosCat.monthlySubtotals.map((sub, mIdx) => (
                      <td
                        key={mIdx}
                        className="py-1.5 px-1.5 text-rose-700 dark:text-rose-400"
                      >
                        {grid.months[mIdx].isLaunched ? fmtInt(sub) : '—'}
                      </td>
                    ))}
                    <td className="py-1.5 px-2.5 text-rose-700 dark:text-rose-400 border-l border-slate-200 dark:border-slate-700">
                      {fmtInt(cosCat.yearSubtotal)}
                    </td>
                    <td className="py-1.5 px-2 text-center text-slate-400">—</td>
                  </tr>
                </React.Fragment>
              ))}

              {/* SECTION 3: REVENUE SHARE TOTAL (AGGREGATE COST OF SALES) */}
              <tr className={isDark ? 'bg-[#141D34]' : 'bg-slate-100/90'}>
                <td
                  colSpan={16}
                  className="py-1.5 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400"
                >
                  revenue share (cost of sales → trading account)
                </td>
              </tr>

              <tr
                className={
                  isDark
                    ? 'bg-rose-500/15 font-bold'
                    : 'bg-rose-100/70 font-bold'
                }
              >
                <td className="py-2 px-3 text-left text-rose-700 dark:text-rose-300 sticky left-0 bg-inherit">
                  total (cost of sales)
                </td>
                <td className="py-2 px-2 text-right text-rose-700 dark:text-rose-300 border-r border-slate-200 dark:border-slate-700">
                  {grid.totalRevenueSharePct.toFixed(2)}%
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.monthNum}
                    className="py-2 px-1.5 text-rose-700 dark:text-rose-300"
                  >
                    {m.isLaunched ? fmtInt(m.totalCostOfSales) : '—'}
                  </td>
                ))}
                <td className="py-2 px-2.5 text-rose-700 dark:text-rose-300 border-l border-slate-200 dark:border-slate-700">
                  {fmtInt(grid.totals.sumCostOfSales)}
                </td>
                <td className="py-2 px-2 text-center">
                  <span title="Aggregate of partner revenue shares across Cost of Sales categories">
                    <Lock className="h-3 w-3 text-rose-500 inline" />
                  </span>
                </td>
              </tr>

              {/* RETAINED GROSS PROFIT SUMMARY */}
              <tr
                className={
                  isDark
                    ? 'bg-emerald-500/10 font-bold'
                    : 'bg-emerald-50/80 font-bold'
                }
              >
                <td className="py-2 px-3 text-left text-emerald-700 dark:text-emerald-400 sticky left-0 bg-inherit">
                  gross profit (retained)
                </td>
                <td className="py-2 px-2 text-right text-emerald-700 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-700">
                  {grid.retainedGrossMarginPct.toFixed(2)}%
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.monthNum}
                    className="py-2 px-1.5 text-emerald-700 dark:text-emerald-400"
                  >
                    {m.isLaunched ? fmtInt(m.grossProfit) : '—'}
                  </td>
                ))}
                <td className="py-2 px-2.5 text-emerald-700 dark:text-emerald-400 border-l border-slate-200 dark:border-slate-700">
                  {fmtInt(grid.totals.sumGrossProfit)}
                </td>
                <td className="py-2 px-2 text-center text-slate-400">—</td>
              </tr>

              {/* SECTION 4: OTHER INCOME */}
              <tr className={isDark ? 'bg-[#141D34]' : 'bg-slate-100/90'}>
                <td
                  colSpan={16}
                  className="py-1.5 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400"
                >
                  other income
                </td>
              </tr>

              <tr
                onClick={() => setSelectedAdjustableKey('otherIncome')}
                className={`cursor-pointer transition-colors ${
                  selectedAdjustableKey === 'otherIncome'
                    ? 'bg-[#2E5E88]/10'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <td className="py-2 px-3 text-left font-bold text-slate-900 dark:text-white sticky left-0 bg-inherit">
                  other income
                </td>
                <td className="py-2 px-2 text-right font-bold bg-sky-500/10 text-indigo-600 dark:text-indigo-400 border-r border-slate-200 dark:border-slate-700">
                  {fmtInt(baseOtherIncome)}
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.monthNum}
                    className="py-2 px-1.5 text-indigo-600 dark:text-indigo-400"
                  >
                    {fmtInt(m.otherIncome)}
                  </td>
                ))}
                <td className="py-2 px-2.5 font-bold text-indigo-600 dark:text-indigo-400 border-l border-slate-200 dark:border-slate-700">
                  {fmtInt(grid.totals.sumOtherIncome)}
                </td>
                <td className="py-2 px-2 text-center">
                  <input
                    type="radio"
                    name="rs-slider-row"
                    checked={selectedAdjustableKey === 'otherIncome'}
                    onChange={() => setSelectedAdjustableKey('otherIncome')}
                    className="accent-[#2E5E88] cursor-pointer"
                  />
                </td>
              </tr>

              <tr>
                <td className="py-1.5 px-3 text-left text-slate-500 sticky left-0 bg-inherit">
                  adjustment %
                </td>
                <td className="py-1.5 px-2 text-right text-slate-400 border-r border-slate-200 dark:border-slate-700">
                  —
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.monthNum}
                    className={`py-1.5 px-1.5 text-[10px] ${
                      m.otherIncomeAdjustmentPct > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : m.otherIncomeAdjustmentPct < 0
                        ? 'text-rose-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {m.otherIncomeAdjustmentPct !== 0
                      ? `${m.otherIncomeAdjustmentPct > 0 ? '+' : ''}${m.otherIncomeAdjustmentPct.toFixed(1)}%`
                      : ''}
                  </td>
                ))}
                <td className="py-1.5 px-2.5 text-slate-400 border-l border-slate-200 dark:border-slate-700">
                  —
                </td>
                <td className="py-1.5 px-2 text-center text-slate-300 dark:text-slate-700">
                  —
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. ADJUSTMENT SLIDER PANEL */}
      {activeSliderItem && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#2E5E88] dark:text-[#6BA3D6]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                ADJUSTMENT SLIDER — {activeSliderItem.name}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 lowercase mr-1">cycle rates:</span>
              <button
                type="button"
                onClick={() => handleCycleSliderItem('prev')}
                className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Previous adjustable rate"
              >
                <ChevronLeft className="h-4 w-4 text-slate-700 dark:text-slate-200" />
              </button>
              <button
                type="button"
                onClick={() => handleCycleSliderItem('next')}
                className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Next adjustable rate"
              >
                <ChevronRight className="h-4 w-4 text-slate-700 dark:text-slate-200" />
              </button>
            </div>
          </div>

          <BaseRateAdjustmentTool
            theme={theme}
            item={activeSliderItem}
            selectedYear={activeYear}
            onSelectYear={onSelectYear}
            onUpdateMonthlyValues={handleSliderUpdateMonthlyValues}
            onUpdateBaseRate={handleSliderUpdateBaseRate}
            onPrevItem={() => handleCycleSliderItem('prev')}
            onNextItem={() => handleCycleSliderItem('next')}
          />
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* REVENUE SHARE CHARTS VIEW                                                 */
/* ========================================================================= */

interface RevenueShareChartsViewProps {
  theme?: 'light' | 'dark';
  categories: RevenueShareCategory[];
  products: RevenueItem[];
  activeProductIdx: number;
  onSelectProductIdx: (idx: number) => void;
  activeYear: number;
  onSelectYear: (yr: number) => void;
  daysWorked60: number[];
}

export const RevenueShareChartsView: React.FC<RevenueShareChartsViewProps> = ({
  theme = 'light',
  categories,
  products,
  activeProductIdx,
  onSelectProductIdx,
  activeYear,
  onSelectYear,
  daysWorked60,
}) => {
  const isDark = theme === 'dark';
  const safeIdx = Math.min(activeProductIdx, Math.max(0, products.length - 1));
  const currentProduct = products[safeIdx] || products[0];

  const grid = useMemo(() => {
    if (!currentProduct) return null;
    return calculateRevenueShareProductYearGrid(
      currentProduct,
      categories,
      daysWorked60,
      activeYear
    );
  }, [currentProduct, categories, daysWorked60, activeYear]);

  const portfolio = useMemo(
    () =>
      calculateRevenueShareCategoryBreakdown(
        products,
        categories,
        daysWorked60,
        activeYear
      ),
    [products, categories, daysWorked60, activeYear]
  );

  const fmtShort = (val: number) => {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}k`;
    return `${sign}${Math.round(abs)}`;
  };

  if (!currentProduct || !grid) return null;

  const maxMonthlyVal = Math.max(
    1,
    ...grid.months.map((m) =>
      Math.max(m.valueSales, Math.abs(m.totalCostOfSales), Math.max(0, m.grossProfit))
    )
  );

  const maxCatVal = Math.max(
    1,
    ...portfolio.categorySummaries.map((c) => c.yearRevenue)
  );

  const cosCategoryPalette = [
    'bg-rose-500',
    'bg-amber-500',
    'bg-violet-500',
    'bg-sky-500',
    'bg-teal-500',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150 font-mono">
      {/* Top Controls */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-xs ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold lowercase text-slate-700 dark:text-slate-300">
            filter charts:
          </span>

          <select
            value={safeIdx}
            onChange={(e) => onSelectProductIdx(Number(e.target.value))}
            className={`py-1.5 px-3 rounded-xl border text-xs font-bold lowercase cursor-pointer ${
              isDark
                ? 'bg-[#0E1322] border-[#222F4C] text-white'
                : 'bg-white border-[#D8CEBC] text-slate-900'
            }`}
          >
            {products.map((prod, idx) => (
              <option key={prod.id} value={idx}>
                {prod.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => onSelectYear(yr)}
                className={`py-1 px-3 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  activeYear === yr
                    ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                    : isDark
                    ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                    : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
                }`}
              >
                year {yr}
              </button>
            ))}
          </div>
        </div>

        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25">
          {currentProduct.name} · {grid.categoryName} ({grid.totalRevenueSharePct.toFixed(2)}% COS) · Year {activeYear}
        </span>
      </div>

      {/* CHART 1: MONTHLY VALUE SALES VS PARTNER REVENUE SHARE (COS) VS RETAINED GROSS PROFIT */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-[#2E5E88] dark:text-[#6BA3D6]" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              VALUE SALES, REVENUE SHARE (COS) &amp; RETAINED GROSS PROFIT (YEAR {activeYear})
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            COS: {grid.totals.effectiveRevenueSharePct.toFixed(2)}% · Retained GP: {grid.totals.effectiveGrossMarginPct.toFixed(2)}%
          </span>
        </div>

        <div className="relative h-64 border-b border-slate-200 dark:border-slate-800 pb-2 pt-4">
          <div className="grid grid-flow-col auto-cols-fr gap-2 sm:gap-3 items-end h-full">
            {grid.months.map((m) => {
              const revH = (m.valueSales / maxMonthlyVal) * 100;
              const cosH = (Math.abs(m.totalCostOfSales) / maxMonthlyVal) * 100;
              const gpH = (Math.max(0, m.grossProfit) / maxMonthlyVal) * 100;

              return (
                <div
                  key={m.monthNum}
                  className="flex flex-col items-center h-full justify-end group relative"
                >
                  <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg whitespace-nowrap pointer-events-none z-20 font-bold shadow-lg space-y-0.5">
                    <div className="text-slate-300">
                      Month {m.monthNum} ({m.daysWorked}d)
                    </div>
                    <div className="text-sky-300">
                      Value Sales: {m.valueSales.toLocaleString()}
                    </div>
                    <div className="text-rose-400">
                      Rev Share (COS): {m.totalCostOfSales.toLocaleString()} ({m.totalRevenueSharePct.toFixed(2)}%)
                    </div>
                    <div className="text-emerald-400">
                      Retained GP: {m.grossProfit.toLocaleString()} ({m.grossMarginPct.toFixed(2)}%)
                    </div>
                  </div>

                  <span className="text-[9px] font-bold tabular-nums mb-1 text-slate-600 dark:text-slate-300">
                    {m.valueSales > 0 ? fmtShort(m.valueSales) : '—'}
                  </span>

                  <div className="flex items-end justify-center gap-0.5 sm:gap-1 w-full max-w-[56px] h-full">
                    <div
                      style={{ height: `${Math.max(m.valueSales > 0 ? 4 : 0, revH)}%` }}
                      className="w-1/3 rounded-t-xs bg-gradient-to-t from-[#2E5E88] to-[#5584B4]"
                    />
                    <div
                      style={{
                        height: `${Math.max(Math.abs(m.totalCostOfSales) > 0 ? 4 : 0, cosH)}%`,
                      }}
                      className="w-1/3 rounded-t-xs bg-gradient-to-t from-rose-600 to-rose-400"
                    />
                    <div
                      style={{ height: `${Math.max(m.grossProfit > 0 ? 4 : 0, gpH)}%` }}
                      className="w-1/3 rounded-t-xs bg-gradient-to-t from-emerald-600 to-emerald-400"
                    />
                  </div>

                  <span className="text-[10px] font-bold text-slate-500 mt-2">
                    M{m.monthNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#2E5E88]" />
              <span className="text-slate-600 dark:text-slate-300 font-bold">Value Sales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-300 font-bold">
                Revenue Share (Cost of Sales)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300 font-bold">
                Retained Gross Profit
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 lowercase">
            y{activeYear} total sales: {grid.totals.sumValueSales.toLocaleString()} · partner cos: {grid.totals.sumCostOfSales.toLocaleString()} · retained gp: {grid.totals.sumGrossProfit.toLocaleString()}
          </span>
        </div>
      </div>

      {/* CHART 2: PARTNER REVENUE SHARE BREAKDOWN BY COST OF SALES CATEGORY */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-rose-500" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              COST OF SALES PARTNER SHARE DISTRIBUTION — {grid.categoryName} (YEAR {activeYear})
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            Total Shared: {grid.totalRevenueSharePct.toFixed(2)}% ({Math.abs(grid.totals.sumCostOfSales).toLocaleString()})
          </span>
        </div>

        {/* Proportional 100% Revenue Allocation Bar */}
        <div className="space-y-2">
          <div className="w-full h-6 rounded-xl overflow-hidden flex border border-slate-200 dark:border-slate-700">
            {grid.cosCategories.map((cosCat, cIdx) => {
              const widthPct = Math.max(0, Math.min(100, cosCat.subtotalPct));
              if (widthPct <= 0) return null;
              return (
                <div
                  key={cosCat.id}
                  style={{ width: `${widthPct}%` }}
                  className={`${cosCategoryPalette[cIdx % cosCategoryPalette.length]} h-full flex items-center justify-center text-[10px] font-bold text-white truncate px-1`}
                  title={`${cosCat.name}: ${cosCat.subtotalPct.toFixed(2)}% (${cosCat.yearSubtotal.toLocaleString()})`}
                >
                  {widthPct >= 6 ? `${cosCat.subtotalPct.toFixed(1)}%` : ''}
                </div>
              );
            })}
            {grid.retainedGrossMarginPct > 0 && (
              <div
                style={{ width: `${Math.min(100, grid.retainedGrossMarginPct)}%` }}
                className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-bold text-white truncate px-2"
                title={`Retained Gross Profit: ${grid.retainedGrossMarginPct.toFixed(2)}%`}
              >
                Retained GP ({grid.retainedGrossMarginPct.toFixed(1)}%)
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {grid.cosCategories.map((cosCat, cIdx) => (
              <div
                key={cosCat.id}
                className={`p-3 rounded-xl border space-y-2 ${
                  isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-xs ${cosCategoryPalette[cIdx % cosCategoryPalette.length]}`}
                    />
                    <span className="text-slate-900 dark:text-white">{cosCat.name}</span>
                  </div>
                  <span className="text-rose-600 dark:text-rose-400 tabular-nums">
                    {cosCat.subtotalPct.toFixed(2)}%
                  </span>
                </div>
                <div className="space-y-1 text-[11px]">
                  {cosCat.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-slate-600 dark:text-slate-300 tabular-nums"
                    >
                      <span className="lowercase truncate pr-2">{item.name}</span>
                      <span>
                        {item.sharePct.toFixed(2)}% ·{' '}
                        <strong className="text-rose-600 dark:text-rose-400">
                          {item.yearTotal.toLocaleString()}
                        </strong>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold tabular-nums">
                  <span className="text-slate-500 lowercase">yr {activeYear} subtotal</span>
                  <span className="text-rose-700 dark:text-rose-400">
                    {cosCat.yearSubtotal.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHART 3: PORTFOLIO CONTRIBUTION BY PRODUCT CATEGORY */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              PORTFOLIO BREAKDOWN BY PRODUCT CATEGORY (YEAR {activeYear})
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#6BA3D6] border border-[#2E5E88]/25">
            Weighted COS: {portfolio.weightedRevenueSharePct.toFixed(2)}% · Weighted GP: {portfolio.weightedGrossMarginPct.toFixed(2)}%
          </span>
        </div>

        <div className="space-y-3">
          {portfolio.categorySummaries.map((cs) => {
            const revWidth = (cs.yearRevenue / maxCatVal) * 100;
            const cosWidth = (Math.abs(cs.yearCostOfSales) / maxCatVal) * 100;
            const gpWidth = (Math.max(0, cs.yearGrossProfit) / maxCatVal) * 100;

            return (
              <div
                key={cs.category.id}
                className={`p-3 rounded-xl border space-y-2 ${
                  isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {cs.category.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 font-bold">
                      {cs.totalRevenueSharePct.toFixed(2)}% COS
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ({cs.productCount} product{cs.productCount === 1 ? '' : 's'} · {cs.revenueShareOfPortfolioPct.toFixed(1)}% of sales)
                    </span>
                  </div>
                  <div className="flex items-center gap-4 tabular-nums text-[11px]">
                    <span className="text-[#2E5E88] dark:text-[#6BA3D6] font-bold">
                      Sales: {cs.yearRevenue.toLocaleString()}
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                      COS: {cs.yearCostOfSales.toLocaleString()}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      GP: {cs.yearGrossProfit.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(cs.yearRevenue > 0 ? 2 : 0, revWidth)}%` }}
                      className="h-full bg-gradient-to-r from-[#2E5E88] to-[#5584B4] rounded-full"
                    />
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.max(Math.abs(cs.yearCostOfSales) > 0 ? 2 : 0, cosWidth)}%`,
                      }}
                      className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full"
                    />
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(cs.yearGrossProfit > 0 ? 2 : 0, gpWidth)}%` }}
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
