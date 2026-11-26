import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sliders,
  BarChart2,
  Lock,
  Layers,
  Tag,
} from 'lucide-react';
import { RevenueItem } from '../../constants';
import { AssumptionRateItem } from '../../../bizzdynamics/types';
import { BaseRateAdjustmentTool } from '../../../bizzdynamics/components/BaseRateAdjustmentTool';
import { ValueSalesCategory } from './modelSetTypes';
import {
  calculateValueSalesCategoryBreakdown,
  calculateValueSalesProductYearGrid,
  getDailyValueSalesSeries60,
  resolveValueSalesCategory,
} from './valueSalesEngine';

type ValueSalesAdjustableKey = 'dailyValueSales' | 'commissionPct' | 'otherIncome';

const VS_ADJUSTABLE_META: Array<{
  key: ValueSalesAdjustableKey;
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
    key: 'commissionPct',
    name: 'commission on sales %',
    description: 'sales commission % of value sales changed by ADJUSTMENT SLIDER',
    unit: '%',
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

interface ValueSalesResultsViewProps {
  theme?: 'light' | 'dark';
  categories: ValueSalesCategory[];
  products: RevenueItem[];
  activeProductIdx: number;
  onSelectProductIdx: (idx: number) => void;
  activeYear: number;
  onSelectYear: (yr: number) => void;
  daysWorked60: number[];
  onUpdateProduct: (productIndex: number, patch: Partial<RevenueItem>) => void;
  onGoToAssumptions?: () => void;
}

export const ValueSalesResultsView: React.FC<ValueSalesResultsViewProps> = ({
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
  const [selectedKey, setSelectedKey] = useState<ValueSalesAdjustableKey>('dailyValueSales');

  const safeIdx = Math.min(activeProductIdx, Math.max(0, products.length - 1));
  const currentProduct = products[safeIdx];

  const grid = useMemo(() => {
    if (!currentProduct) return null;
    return calculateValueSalesProductYearGrid(currentProduct, categories, daysWorked60, activeYear);
  }, [currentProduct, categories, daysWorked60, activeYear]);

  const activeCategory = useMemo(() => {
    if (!currentProduct) return categories[0];
    return resolveValueSalesCategory(currentProduct, categories);
  }, [currentProduct, categories]);

  const activeSliderItem = useMemo<AssumptionRateItem | null>(() => {
    if (!currentProduct) return null;
    const meta = VS_ADJUSTABLE_META.find((m) => m.key === selectedKey) || VS_ADJUSTABLE_META[0];
    let series: number[];
    let baseRate: number;

    if (selectedKey === 'dailyValueSales') {
      series = getDailyValueSalesSeries60(currentProduct);
      baseRate = series[0] ?? currentProduct.valueSalesConfig?.dailyValueSalesBase ?? 20000;
    } else if (selectedKey === 'commissionPct') {
      series =
        Array.isArray(currentProduct.salesCommissionPctMonthly) &&
        currentProduct.salesCommissionPctMonthly.length >= 60
          ? currentProduct.salesCommissionPctMonthly
          : new Array(60).fill(currentProduct.valueSalesConfig?.commissionOnSalesPct ?? 1.0);
      baseRate = series[0] ?? 1.0;
    } else {
      series =
        Array.isArray(currentProduct.otherIncomeMonthly) &&
        currentProduct.otherIncomeMonthly.length >= 60
          ? currentProduct.otherIncomeMonthly
          : new Array(60).fill(currentProduct.valueSalesConfig?.otherIncomeMonthlyBase ?? 0);
      baseRate = series[0] ?? 0;
    }

    return {
      id: `${currentProduct.id}-vs-${meta.key}`,
      stepId: 2,
      stepName: 'revenue calculator (value sales)',
      name: meta.name,
      description: meta.description,
      baseRate,
      unit: meta.unit,
      changeType: meta.changeType,
      monthlyValues: series,
    };
  }, [currentProduct, selectedKey]);

  if (!currentProduct || !grid) return null;

  const handleSliderUpdateMonthlyValues = (_itemId: string, updatedValues: number[]) => {
    const cat = activeCategory;
    if (selectedKey === 'dailyValueSales') {
      onUpdateProduct(safeIdx, {
        modelType: 'value sales',
        valueSalesCategoryId: cat?.id,
        valueSalesConfig: {
          categoryId: cat?.id || 'vs-cat-1',
          dailyValueSalesBase: updatedValues[0] ?? 20000,
          dailyValueSalesMonthly: updatedValues,
          commissionOnSalesPct:
            currentProduct.valueSalesConfig?.commissionOnSalesPct ??
            currentProduct.salesCommissionPctMonthly?.[0] ??
            1.0,
          otherIncomeMonthlyBase:
            currentProduct.valueSalesConfig?.otherIncomeMonthlyBase ??
            currentProduct.otherIncomeMonthly?.[0] ??
            0,
        },
      });
    } else if (selectedKey === 'commissionPct') {
      onUpdateProduct(safeIdx, {
        salesCommissionPctMonthly: updatedValues,
        valueSalesConfig: {
          categoryId: cat?.id || 'vs-cat-1',
          dailyValueSalesBase:
            currentProduct.valueSalesConfig?.dailyValueSalesBase ??
            getDailyValueSalesSeries60(currentProduct)[0] ??
            20000,
          dailyValueSalesMonthly: getDailyValueSalesSeries60(currentProduct),
          commissionOnSalesPct: updatedValues[0] ?? 1.0,
          otherIncomeMonthlyBase:
            currentProduct.valueSalesConfig?.otherIncomeMonthlyBase ??
            currentProduct.otherIncomeMonthly?.[0] ??
            0,
        },
      });
    } else {
      onUpdateProduct(safeIdx, {
        otherIncomeMonthly: updatedValues,
        valueSalesConfig: {
          categoryId: cat?.id || 'vs-cat-1',
          dailyValueSalesBase:
            currentProduct.valueSalesConfig?.dailyValueSalesBase ??
            getDailyValueSalesSeries60(currentProduct)[0] ??
            20000,
          dailyValueSalesMonthly: getDailyValueSalesSeries60(currentProduct),
          commissionOnSalesPct:
            currentProduct.valueSalesConfig?.commissionOnSalesPct ??
            currentProduct.salesCommissionPctMonthly?.[0] ??
            1.0,
          otherIncomeMonthlyBase: updatedValues[0] ?? 0,
        },
      });
    }
  };

  const handleSliderUpdateBaseRate = (itemId: string, newBaseRate: number) => {
    handleSliderUpdateMonthlyValues(itemId, new Array(60).fill(newBaseRate));
  };

  const handleCycleSlider = (direction: 'prev' | 'next') => {
    const keys: ValueSalesAdjustableKey[] = ['dailyValueSales', 'commissionPct', 'otherIncome'];
    const cur = keys.indexOf(selectedKey);
    const next = direction === 'next' ? (cur + 1) % keys.length : (cur - 1 + keys.length) % keys.length;
    setSelectedKey(keys[next]);
  };

  const fmtInt = (n: number) => Math.round(n).toLocaleString();

  return (
    <div className="space-y-6 animate-in fade-in duration-150 font-mono">
      {/* Main Value Sales Results Table */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  RESULTS · VALUE SALES
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                  {grid.categoryName} ({grid.categoryGpMarginPct.toFixed(2)}% GP)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Select any radio button on the right to adjust daily value sales growth %, commission %, or other income via the ADJUSTMENT SLIDER below.
              </p>
            </div>

            {/* Product Selector */}
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
                const pCat = resolveValueSalesCategory(prod, categories);
                return (
                  <option key={prod.id} value={idx}>
                    {prod.name} [{pCat.name} · {pCat.grossProfitMarginPct.toFixed(1)}% GP]
                  </option>
                );
              })}
            </select>

            {/* Year Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#141A2E] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 lowercase px-1.5">year:</span>
              {[1, 2, 3, 4, 5].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => onSelectYear(yr)}
                  className={`py-1 px-3 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    activeYear === yr
                      ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                      : isDark
                      ? 'bg-transparent text-slate-400 hover:text-white border-transparent'
                      : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent'
                  }`}
                >
                  Year {yr}
                </button>
              ))}
            </div>
          </div>

          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '8s' }} />
            <span>TWO WAY Synchronization</span>
          </span>
        </div>

        {/* Table matching value sales.PNG */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#121A2F] border-b border-slate-200 dark:border-slate-800 font-bold">
                <th className="py-2.5 px-3.5 text-left w-[260px] min-w-[260px] text-slate-800 dark:text-slate-200">
                  month for year selected
                </th>
                {grid.months.map((m) => (
                  <th
                    key={m.absMonth}
                    className="py-2.5 px-2.5 min-w-[68px] text-right text-slate-800 dark:text-slate-200"
                  >
                    <span className="block font-bold">{m.absMonth}</span>
                    <span className="block text-[9px] text-slate-400 font-normal">m{m.monthNum}</span>
                  </th>
                ))}
                <th className="py-2.5 px-3 min-w-[115px] text-right font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center justify-end gap-1.5 select-none">
                    <button
                      type="button"
                      onClick={() => onSelectYear(Math.max(1, activeYear - 1))}
                      disabled={activeYear <= 1}
                      className="p-1 rounded-md hover:bg-[#2E5E88]/20 disabled:opacity-25 cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span>YEAR {activeYear}</span>
                    <button
                      type="button"
                      onClick={() => onSelectYear(Math.min(5, activeYear + 1))}
                      disabled={activeYear >= 5}
                      className="p-1 rounded-md hover:bg-[#2E5E88]/20 disabled:opacity-25 cursor-pointer"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
                <th className="py-2.5 px-3 font-bold uppercase text-center text-[#2E5E88] dark:text-[#5584B4] w-[60px]">
                  Adjust
                </th>
              </tr>

              {/* Days Worked */}
              <tr className="bg-slate-50 dark:bg-[#0E1528] border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <td className="py-2 px-3.5 text-left font-bold">days worked (start M{currentProduct.startMonth || 1})</td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-2 px-2.5 font-bold text-slate-700 dark:text-slate-300">
                    {m.daysWorked}
                  </td>
                ))}
                <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">
                  {grid.totals.totalDaysWorked}
                </td>
                <td className="py-2 px-3 text-center text-slate-400">-</td>
              </tr>
            </thead>

            <tbody>
              {/* SECTION: REVENUE */}
              <tr className="bg-[#2E5E88]/10 border-b border-slate-200 dark:border-slate-800">
                <td colSpan={15} className="py-1.5 px-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#2E5E88] dark:text-[#7EB2E2]">
                  REVENUE
                </td>
              </tr>

              {/* Row: value sales - per day (ADJUSTABLE) */}
              <tr
                onClick={() => setSelectedKey('dailyValueSales')}
                className={`border-b border-slate-100 dark:border-slate-800/70 cursor-pointer transition-colors ${
                  selectedKey === 'dailyValueSales'
                    ? 'bg-[#2E5E88]/10 dark:bg-[#2E5E88]/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <td className="py-2 px-3.5 text-left font-bold text-slate-800 dark:text-slate-200">
                  value sales - per day
                </td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-2 px-2.5 tabular-nums text-slate-700 dark:text-slate-300">
                    {m.isLaunched ? fmtInt(m.dailyValueSales) : '—'}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums font-bold text-slate-800 dark:text-slate-200">
                  {fmtInt(grid.totals.avgDailyValueSales)} <span className="text-[9px] text-slate-400 font-normal">avg</span>
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="radio"
                    name="vs-adjust-row"
                    checked={selectedKey === 'dailyValueSales'}
                    onChange={() => setSelectedKey('dailyValueSales')}
                    className="accent-[#2E5E88] cursor-pointer"
                  />
                </td>
              </tr>

              {/* Row: value sales - per day growth % */}
              <tr className="border-b border-slate-100 dark:border-slate-800/70 text-slate-500">
                <td className="py-1.5 px-3.5 text-left text-[11px]">value sales - per day growth %</td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-1.5 px-2.5 tabular-nums text-[11px]">
                    {m.isLaunched ? `${m.dailyValueSalesGrowthPct.toFixed(1)}%` : '—'}
                  </td>
                ))}
                <td className="py-1.5 px-3 text-[11px] text-slate-400">slider</td>
                <td className="py-1.5 px-3 text-center text-slate-300 dark:text-slate-700">-</td>
              </tr>

              {/* Row: value sales (Monthly Revenue) */}
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0E1528] font-bold">
                <td className="py-2.5 px-3.5 text-left text-slate-900 dark:text-white">value sales</td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-2.5 px-2.5 tabular-nums text-slate-900 dark:text-white">
                    {m.isLaunched ? fmtInt(m.valueSales) : '—'}
                  </td>
                ))}
                <td className="py-2.5 px-3 tabular-nums text-slate-900 dark:text-white">
                  {fmtInt(grid.totals.sumValueSales)}
                </td>
                <td className="py-2.5 px-3 text-center text-slate-400">-</td>
              </tr>

              {/* SECTION: COST OF SALES */}
              <tr className="bg-rose-500/10 border-b border-slate-200 dark:border-slate-800">
                <td colSpan={15} className="py-1.5 px-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  COST OF SALES · GOVERNED BY CATEGORY ({(100 - grid.categoryGpMarginPct).toFixed(2)}% OF VALUE SALES)
                </td>
              </tr>

              <tr className="border-b border-slate-200 dark:border-slate-800">
                <td className="py-2.5 px-3.5 text-left font-bold text-rose-700 dark:text-rose-400">
                  cost of sales
                </td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-2.5 px-2.5 tabular-nums text-rose-600 dark:text-rose-400 font-semibold">
                    {m.isLaunched ? fmtInt(m.costOfSales) : '—'}
                  </td>
                ))}
                <td className="py-2.5 px-3 tabular-nums font-bold text-rose-600 dark:text-rose-400">
                  {fmtInt(grid.totals.sumCostOfSales)}
                </td>
                <td className="py-2.5 px-3 text-center text-slate-400">-</td>
              </tr>

              {/* SECTION: GROSS PROFIT */}
              <tr className="bg-emerald-500/10 border-b border-slate-200 dark:border-slate-800">
                <td colSpan={15} className="py-1.5 px-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  GROSS PROFIT
                </td>
              </tr>

              <tr className="border-b border-slate-100 dark:border-slate-800/70 bg-emerald-500/5 font-bold">
                <td className="py-2.5 px-3.5 text-left text-emerald-800 dark:text-emerald-300">gross profit</td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-2.5 px-2.5 tabular-nums text-emerald-700 dark:text-emerald-300">
                    {m.isLaunched ? fmtInt(m.grossProfit) : '—'}
                  </td>
                ))}
                <td className="py-2.5 px-3 tabular-nums text-emerald-700 dark:text-emerald-300">
                  {fmtInt(grid.totals.sumGrossProfit)}
                </td>
                <td className="py-2.5 px-3 text-center text-slate-400">-</td>
              </tr>

              <tr className="border-b border-slate-200 dark:border-slate-800">
                <td className="py-2 px-3.5 text-left text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span>margin</span>
                    <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                      <Lock className="w-2.5 h-2.5" />
                      {grid.categoryName}
                    </span>
                  </div>
                </td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-2 px-2.5 tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                    {m.isLaunched ? `${m.grossProfitMarginPct.toFixed(2)}%` : '—'}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                  {grid.totals.effectiveGpMarginPct.toFixed(2)}%
                </td>
                <td className="py-2 px-3 text-center">
                  {onGoToAssumptions ? (
                    <button
                      type="button"
                      onClick={onGoToAssumptions}
                      className="text-[9px] font-bold text-[#2E5E88] dark:text-[#7EB2E2] hover:underline cursor-pointer"
                      title="Edit GP margin in Product Categories on Assumptions tab"
                    >
                      cat
                    </button>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
              </tr>

              {/* SECTION: GROSS PROFIT ADJUSTMENTS */}
              <tr className="bg-amber-500/10 border-b border-slate-200 dark:border-slate-800">
                <td colSpan={15} className="py-1.5 px-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  GROSS PROFIT ADJUSTMENTS
                </td>
              </tr>

              <tr
                onClick={() => setSelectedKey('commissionPct')}
                className={`border-b border-slate-100 dark:border-slate-800/70 cursor-pointer transition-colors ${
                  selectedKey === 'commissionPct'
                    ? 'bg-[#2E5E88]/10 dark:bg-[#2E5E88]/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <td className="py-2 px-3.5 text-left font-bold text-slate-700 dark:text-slate-200">
                  commission on sales %
                </td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-2 px-2.5 tabular-nums text-slate-600 dark:text-slate-300">
                    {m.isLaunched ? `${m.commissionOnSalesPct.toFixed(2)}%` : '—'}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums font-bold text-slate-700 dark:text-slate-200">
                  {grid.totals.avgCommissionPct.toFixed(2)}%
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="radio"
                    name="vs-adjust-row"
                    checked={selectedKey === 'commissionPct'}
                    onChange={() => setSelectedKey('commissionPct')}
                    className="accent-[#2E5E88] cursor-pointer"
                  />
                </td>
              </tr>

              <tr className="border-b border-slate-200 dark:border-slate-800 font-bold">
                <td className="py-2 px-3.5 text-left text-amber-700 dark:text-amber-400">
                  gross profit adjustments
                </td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-2 px-2.5 tabular-nums text-amber-700 dark:text-amber-400">
                    {m.isLaunched ? fmtInt(m.grossProfitAdjustments) : '—'}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums text-amber-700 dark:text-amber-400">
                  {fmtInt(grid.totals.sumGrossProfitAdjustments)}
                </td>
                <td className="py-2 px-3 text-center text-slate-400">-</td>
              </tr>

              {/* SECTION: OTHER INCOME */}
              <tr className="bg-sky-500/10 border-b border-slate-200 dark:border-slate-800">
                <td colSpan={15} className="py-1.5 px-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                  OTHER INCOME
                </td>
              </tr>

              <tr
                onClick={() => setSelectedKey('otherIncome')}
                className={`border-b border-slate-100 dark:border-slate-800/70 cursor-pointer transition-colors ${
                  selectedKey === 'otherIncome'
                    ? 'bg-[#2E5E88]/10 dark:bg-[#2E5E88]/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <td className="py-2 px-3.5 text-left font-bold text-slate-800 dark:text-slate-200">
                  other income
                </td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-2 px-2.5 tabular-nums text-sky-700 dark:text-sky-300 font-semibold">
                    {fmtInt(m.otherIncome)}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums font-bold text-sky-700 dark:text-sky-300">
                  {fmtInt(grid.totals.sumOtherIncome)}
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="radio"
                    name="vs-adjust-row"
                    checked={selectedKey === 'otherIncome'}
                    onChange={() => setSelectedKey('otherIncome')}
                    className="accent-[#2E5E88] cursor-pointer"
                  />
                </td>
              </tr>

              <tr className="text-slate-500">
                <td className="py-1.5 px-3.5 text-left text-[11px]">adjustment %</td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-1.5 px-2.5 tabular-nums text-[11px]">
                    {m.otherIncomeAdjustmentPct.toFixed(1)}%
                  </td>
                ))}
                <td className="py-1.5 px-3 text-[11px] text-slate-400">slider</td>
                <td className="py-1.5 px-3 text-center text-slate-300 dark:text-slate-700">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUSTMENT SLIDER */}
      {activeSliderItem && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                ADJUSTMENT SLIDER · {activeSliderItem.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleCycleSlider('prev')}
                className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Previous adjustable metric"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCycleSlider('next')}
                className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Next adjustable metric"
              >
                <ChevronRight className="h-4 w-4" />
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
            onPrevItem={() => handleCycleSlider('prev')}
            onNextItem={() => handleCycleSlider('next')}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// VALUE SALES CHARTS VIEW
// ============================================================================

interface ValueSalesChartsViewProps {
  theme?: 'light' | 'dark';
  categories: ValueSalesCategory[];
  products: RevenueItem[];
  activeProductIdx: number;
  onSelectProductIdx: (idx: number) => void;
  activeYear: number;
  onSelectYear: (yr: number) => void;
  daysWorked60: number[];
}

export const ValueSalesChartsView: React.FC<ValueSalesChartsViewProps> = ({
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
  const currentProduct = products[safeIdx];

  const grid = useMemo(() => {
    if (!currentProduct) return null;
    return calculateValueSalesProductYearGrid(currentProduct, categories, daysWorked60, activeYear);
  }, [currentProduct, categories, daysWorked60, activeYear]);

  const portfolio = useMemo(
    () => calculateValueSalesCategoryBreakdown(products, categories, daysWorked60, activeYear),
    [products, categories, daysWorked60, activeYear]
  );

  if (!currentProduct || !grid) return null;

  const maxMonthlyVal = Math.max(
    1,
    ...grid.months.map((m) => Math.max(m.valueSales, Math.abs(m.costOfSales), m.grossProfit))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150 font-mono">
      {/* Filter Header */}
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
              isDark ? 'bg-[#0E1322] border-[#222F4C] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
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

        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
          {currentProduct.name} · {grid.categoryName} ({grid.categoryGpMarginPct.toFixed(1)}% GP) · Year {activeYear}
        </span>
      </div>

      {/* Chart 1: Monthly Value Sales, Cost of Sales & Gross Profit */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-[#2E5E88] dark:text-[#7EB2E2]" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              VALUE SALES, COST OF SALES &amp; GROSS PROFIT (YEAR {activeYear})
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
            Category GP Margin: {grid.categoryGpMarginPct.toFixed(2)}%
          </span>
        </div>

        <div className="pt-2 space-y-3">
          <div className="relative h-64 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="grid grid-flow-col auto-cols-fr gap-2 sm:gap-3 items-end h-full">
              {grid.months.map((m) => {
                const salesH = (m.valueSales / (maxMonthlyVal * 1.15)) * 100;
                const cosH = (Math.abs(m.costOfSales) / (maxMonthlyVal * 1.15)) * 100;
                const gpH = (m.grossProfit / (maxMonthlyVal * 1.15)) * 100;

                return (
                  <div key={m.monthNum} className="flex flex-col items-center h-full justify-end group relative">
                    <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg whitespace-nowrap pointer-events-none z-20 font-bold shadow-lg space-y-0.5">
                      <div className="text-slate-300">Month {m.monthNum} ({m.daysWorked} days):</div>
                      <div className="text-sky-300">Value Sales: {m.valueSales.toLocaleString()}</div>
                      <div className="text-rose-300">Cost of Sales: {m.costOfSales.toLocaleString()}</div>
                      <div className="text-emerald-300">Gross Profit: {m.grossProfit.toLocaleString()} ({m.grossProfitMarginPct.toFixed(1)}%)</div>
                    </div>

                    <span className="text-[9px] font-bold tabular-nums mb-1 text-slate-600 dark:text-slate-300">
                      {m.valueSales >= 1000 ? `${Math.round(m.valueSales / 1000)}k` : m.valueSales}
                    </span>

                    <div className="flex items-end justify-center gap-0.5 sm:gap-1 w-full max-w-[56px] h-full">
                      <div
                        style={{ height: `${Math.max(m.valueSales > 0 ? 4 : 0, salesH)}%` }}
                        className="w-1/3 rounded-t-xs sm:rounded-t-sm bg-gradient-to-t from-[#2E5E88] to-[#5584B4]"
                      />
                      <div
                        style={{ height: `${Math.max(Math.abs(m.costOfSales) > 0 ? 4 : 0, cosH)}%` }}
                        className="w-1/3 rounded-t-xs sm:rounded-t-sm bg-gradient-to-t from-rose-600 to-rose-400"
                      />
                      <div
                        style={{ height: `${Math.max(m.grossProfit > 0 ? 4 : 0, gpH)}%` }}
                        className="w-1/3 rounded-t-xs sm:rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400"
                      />
                    </div>

                    <span className="text-[10px] font-bold text-slate-500 mt-2 block text-center">
                      M{m.monthNum}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-xs bg-[#2E5E88]" /> Value Sales
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-xs bg-rose-500" /> Cost of Sales
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-xs bg-emerald-500" /> Gross Profit
              </span>
            </div>
            <span className="text-[11px] text-slate-400 lowercase">
              year {activeYear} total: sales {grid.totals.sumValueSales.toLocaleString()} · gp {grid.totals.sumGrossProfit.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Chart 2: Product Category Mix & Margin Contribution */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              PRODUCT CATEGORY MIX &amp; MARGIN CONTRIBUTION (YEAR {activeYear})
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#7EB2E2]">
            Weighted Portfolio GP: {portfolio.weightedGpMarginPct.toFixed(2)}%
          </span>
        </div>

        <div className="space-y-3">
          {portfolio.categorySummaries.map((cs) => (
            <div key={cs.category.id} className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#2E5E88] dark:text-[#7EB2E2]" />
                  <span className="font-bold text-slate-900 dark:text-white">{cs.category.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                    {cs.category.grossProfitMarginPct.toFixed(2)}% GP
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({cs.productCount} {cs.productCount === 1 ? 'product' : 'products'})
                  </span>
                </div>
                <div className="text-right tabular-nums">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {Math.round(cs.yearValueSales).toLocaleString()}
                  </span>
                  <span className="text-slate-400 mx-1.5">({cs.revenueSharePct.toFixed(1)}%)</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    GP: {Math.round(cs.yearGrossProfit).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="h-3 rounded-full bg-slate-100 dark:bg-[#0B1020] overflow-hidden flex">
                <div
                  style={{ width: `${Math.max(cs.revenueSharePct > 0 ? 2 : 0, cs.revenueSharePct)}%` }}
                  className="h-full bg-gradient-to-r from-[#2E5E88] to-emerald-500 rounded-full transition-all duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
