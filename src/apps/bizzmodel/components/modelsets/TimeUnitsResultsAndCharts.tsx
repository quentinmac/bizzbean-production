import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sliders,
  BarChart2,
  Clock,
  Users,
  Layers,
} from 'lucide-react';
import { RevenueItem } from '../../constants';
import { AssumptionRateItem } from '../../../bizzdynamics/types';
import { BaseRateAdjustmentTool } from '../../../bizzdynamics/components/BaseRateAdjustmentTool';
import {
  calculateTimeUnitsProductYearGrid,
  createDefaultTimeUnitsConfig,
  getTimeUnitsProductionFactorSeries60,
  getTimeUnitsSellingPriceSeries60,
} from './timeUnitsEngine';

type TimeUnitsAdjustableKey =
  | 'productionFactorPct'
  | 'unitSellingPrice'
  | 'commissionOnSalesPct'
  | 'otherIncome';

const TIME_UNITS_ADJUSTABLE_META: Array<{
  key: TimeUnitsAdjustableKey;
  name: string;
  description: string;
  unit: '%' | 'currency' | 'number';
  changeType: 'percentage' | 'value';
}> = [
  {
    key: 'productionFactorPct',
    name: 'production factor %',
    description:
      'percentage of available production hours billed each month — adjust via ADJUSTMENT SLIDER for ramp-up or seasonality',
    unit: '%',
    changeType: 'percentage',
  },
  {
    key: 'unitSellingPrice',
    name: 'unit selling price (rate / hr)',
    description:
      'charge-out rate per time unit (hour) changed by ADJUSTMENT SLIDER across the 60-month forecast',
    unit: 'currency',
    changeType: 'percentage',
  },
  {
    key: 'commissionOnSalesPct',
    name: 'commission on sales %',
    description:
      'sales commission percentage of revenue transferred to gross profit adjustments via ADJUSTMENT SLIDER',
    unit: '%',
    changeType: 'percentage',
  },
  {
    key: 'otherIncome',
    name: 'other income',
    description:
      'monthly ancillary other income changed by ADJUSTMENT SLIDER - % adjustment over previous month',
    unit: 'currency',
    changeType: 'percentage',
  },
];

interface TimeUnitsResultsViewProps {
  theme?: 'light' | 'dark';
  products: RevenueItem[];
  activeProductIdx: number;
  onSelectProductIdx: (idx: number) => void;
  activeYear: number;
  onSelectYear: (yr: number) => void;
  daysWorked60: number[];
  onUpdateProduct: (productIndex: number, patch: Partial<RevenueItem>) => void;
  onGoToAssumptions?: () => void;
}

export const TimeUnitsResultsView: React.FC<TimeUnitsResultsViewProps> = ({
  theme = 'light',
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
  const [selectedKey, setSelectedKey] = useState<TimeUnitsAdjustableKey>('productionFactorPct');

  const safeIdx = Math.min(activeProductIdx, Math.max(0, products.length - 1));
  const currentProduct = products[safeIdx];

  const grid = useMemo(() => {
    if (!currentProduct) return null;
    return calculateTimeUnitsProductYearGrid(currentProduct, daysWorked60, activeYear);
  }, [currentProduct, daysWorked60, activeYear]);

  const activeSliderItem = useMemo<AssumptionRateItem | null>(() => {
    if (!currentProduct) return null;
    const meta =
      TIME_UNITS_ADJUSTABLE_META.find((m) => m.key === selectedKey) ||
      TIME_UNITS_ADJUSTABLE_META[0];
    const cfg = currentProduct.timeUnitsConfig || createDefaultTimeUnitsConfig();

    let series: number[];
    let baseRate: number;

    if (selectedKey === 'productionFactorPct') {
      series = getTimeUnitsProductionFactorSeries60(currentProduct);
      baseRate = series[0] ?? cfg.productionFactorBasePct ?? 100;
    } else if (selectedKey === 'unitSellingPrice') {
      series = getTimeUnitsSellingPriceSeries60(currentProduct);
      baseRate = series[0] ?? cfg.unitSellingPriceBase ?? 100;
    } else if (selectedKey === 'commissionOnSalesPct') {
      series =
        Array.isArray(currentProduct.salesCommissionPctMonthly) &&
        currentProduct.salesCommissionPctMonthly.length >= 60
          ? currentProduct.salesCommissionPctMonthly
          : new Array(60).fill(cfg.commissionOnSalesPct ?? 1.0);
      baseRate = series[0] ?? 1.0;
    } else {
      series =
        Array.isArray(currentProduct.otherIncomeMonthly) &&
        currentProduct.otherIncomeMonthly.length >= 60
          ? currentProduct.otherIncomeMonthly
          : new Array(60).fill(cfg.otherIncomeMonthlyBase ?? 0);
      baseRate = series[0] ?? 0;
    }

    return {
      id: `${currentProduct.id}-tu-${meta.key}`,
      stepId: 2,
      stepName: 'revenue calculator (time units)',
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
    const existingCfg = currentProduct.timeUnitsConfig || createDefaultTimeUnitsConfig();
    if (selectedKey === 'productionFactorPct') {
      onUpdateProduct(safeIdx, {
        modelType: 'time units',
        timeUnitsConfig: {
          ...existingCfg,
          productionFactorBasePct: updatedValues[0] ?? 100,
          productionFactorMonthly: updatedValues,
        },
      });
    } else if (selectedKey === 'unitSellingPrice') {
      onUpdateProduct(safeIdx, {
        modelType: 'time units',
        unitPrice: updatedValues[0] ?? 100,
        timeUnitsConfig: {
          ...existingCfg,
          unitSellingPriceBase: updatedValues[0] ?? 100,
          unitSellingPriceMonthly: updatedValues,
        },
      });
    } else if (selectedKey === 'commissionOnSalesPct') {
      onUpdateProduct(safeIdx, {
        salesCommissionPctMonthly: updatedValues,
        timeUnitsConfig: {
          ...existingCfg,
          commissionOnSalesPct: updatedValues[0] ?? 1.0,
        },
      });
    } else {
      onUpdateProduct(safeIdx, {
        otherIncomeMonthly: updatedValues,
        timeUnitsConfig: {
          ...existingCfg,
          otherIncomeMonthlyBase: updatedValues[0] ?? 0,
        },
      });
    }
  };

  const handleSliderUpdateBaseRate = (itemId: string, newBaseRate: number) => {
    handleSliderUpdateMonthlyValues(itemId, new Array(60).fill(newBaseRate));
  };

  const handleCycleSlider = (direction: 'prev' | 'next') => {
    const keys: TimeUnitsAdjustableKey[] = [
      'productionFactorPct',
      'unitSellingPrice',
      'commissionOnSalesPct',
      'otherIncome',
    ];
    const cur = keys.indexOf(selectedKey);
    const next =
      direction === 'next' ? (cur + 1) % keys.length : (cur - 1 + keys.length) % keys.length;
    setSelectedKey(keys[next]);
  };

  const fmtInt = (n: number) => Math.round(n).toLocaleString();
  const fmtHrs = (n: number) => (Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1));

  return (
    <div className="space-y-6 animate-in fade-in duration-150 font-mono">
      {/* Main Time Units Results Table */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  RESULTS · SERVICES (TIME UNITS)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#7EB2E2] border border-[#2E5E88]/25">
                  capacity: {fmtHrs(grid.dailyCapacityHours)} hrs/day
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                  advisory staff: {grid.employeesAdjusted} (no production impact)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Daily production capacity flows from the multi-process Production Calculator; revenue transfers to the Trading Account with zero variable COS.
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
              {products.map((prod, idx) => (
                <option key={prod.id} value={idx}>
                  {prod.name}
                </option>
              ))}
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

        {/* 12-Month Results Grid matching time units.xlsx R45-R69 */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#121A2F] border-b border-slate-200 dark:border-slate-800 font-bold">
                <th className="py-2.5 px-3.5 text-left w-[270px] min-w-[270px] text-slate-800 dark:text-slate-200">
                  month for year selected
                </th>
                {grid.months.map((m) => (
                  <th
                    key={m.absMonth}
                    className="py-2.5 px-2.5 min-w-[66px] text-right text-slate-800 dark:text-slate-200"
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

              {/* Trading / Production Days */}
              <tr className="bg-slate-50 dark:bg-[#0E1528] border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <td className="py-2 px-3.5 text-left font-bold">
                  production days (start M{currentProduct.startMonth || 1})
                </td>
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
              {/* SECTION 1: TRADING DYNAMICS (Excel R45-R52) */}
              <tr className="bg-[#2E5E88]/10 border-b border-slate-200 dark:border-slate-800">
                <td
                  colSpan={15}
                  className="py-1.5 px-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#2E5E88] dark:text-[#7EB2E2]"
                >
                  TIME UNIT CAPACITY &amp; TRADING DYNAMICS
                </td>
              </tr>

              {/* Daily Production Capacity */}
              <tr className="border-b border-slate-100 dark:border-slate-800/70 text-slate-600 dark:text-slate-400">
                <td className="py-2 px-3.5 text-left">
                  <div className="flex items-center gap-1.5">
                    <span>daily production capacity (hrs/day)</span>
                    {onGoToAssumptions && (
                      <button
                        type="button"
                        onClick={onGoToAssumptions}
                        className="text-[9px] font-bold text-[#2E5E88] dark:text-[#7EB2E2] hover:underline cursor-pointer"
                        title="Edit multi-process production calculator on Assumptions tab"
                      >
                        edit
                      </button>
                    )}
                  </div>
                </td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-2 px-2.5 tabular-nums">
                    {fmtHrs(m.dailyCapacityHours)}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums font-bold">
                  {fmtHrs(grid.dailyCapacityHours)}
                </td>
                <td className="py-2 px-3 text-center text-slate-400">-</td>
              </tr>

              {/* Monthly Capacity Hours */}
              <tr className="border-b border-slate-100 dark:border-slate-800/70 text-slate-500">
                <td className="py-1.5 px-3.5 text-left text-[11px]">
                  capacity hours per month
                </td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-1.5 px-2.5 tabular-nums text-[11px]">
                    {fmtHrs(m.monthlyCapacityHours)}
                  </td>
                ))}
                <td className="py-1.5 px-3 tabular-nums text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  {fmtHrs(grid.totals.sumCapacityHours)}
                </td>
                <td className="py-1.5 px-3 text-center text-slate-300 dark:text-slate-700">-</td>
              </tr>

              {/* Production Factor % (ADJUSTABLE) */}
              <tr
                onClick={() => setSelectedKey('productionFactorPct')}
                className={`border-b border-slate-100 dark:border-slate-800/70 cursor-pointer transition-colors ${
                  selectedKey === 'productionFactorPct'
                    ? 'bg-[#2E5E88]/10 dark:bg-[#2E5E88]/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <td className="py-2 px-3.5 text-left font-bold text-slate-800 dark:text-slate-200">
                  production factor %
                </td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-2 px-2.5 tabular-nums font-bold text-slate-900 dark:text-white">
                    {m.isLaunched ? `${m.productionFactorPct.toFixed(1)}%` : '—'}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums font-bold text-slate-900 dark:text-white">
                  {grid.totals.avgProductionFactorPct.toFixed(1)}%{' '}
                  <span className="text-[9px] text-slate-400 font-normal">avg</span>
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="radio"
                    name="tu-adjust-row"
                    checked={selectedKey === 'productionFactorPct'}
                    onChange={() => setSelectedKey('productionFactorPct')}
                    className="accent-[#2E5E88] cursor-pointer"
                  />
                </td>
              </tr>

              {/* Hours per Month (Unit Sales) */}
              <tr className="border-b border-slate-100 dark:border-slate-800/70 bg-slate-50/70 dark:bg-[#0E1528] font-bold">
                <td className="py-2 px-3.5 text-left text-[#2E5E88] dark:text-[#7EB2E2]">
                  hours per month (billed time units)
                </td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-2 px-2.5 tabular-nums text-slate-900 dark:text-white">
                    {m.isLaunched ? fmtHrs(m.hoursPerMonth) : '—'}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums text-slate-900 dark:text-white">
                  {fmtHrs(grid.totals.sumHoursSold)}
                </td>
                <td className="py-2 px-3 text-center text-slate-400">-</td>
              </tr>

              {/* Unit Selling Price (ADJUSTABLE) */}
              <tr
                onClick={() => setSelectedKey('unitSellingPrice')}
                className={`border-b border-slate-100 dark:border-slate-800/70 cursor-pointer transition-colors ${
                  selectedKey === 'unitSellingPrice'
                    ? 'bg-[#2E5E88]/10 dark:bg-[#2E5E88]/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <td className="py-2 px-3.5 text-left font-bold text-emerald-700 dark:text-emerald-400">
                  unit selling price (rate / hr)
                </td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-2 px-2.5 tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                    {m.isLaunched ? m.unitSellingPrice.toFixed(2) : '—'}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                  {grid.totals.avgUnitSellingPrice.toFixed(2)}{' '}
                  <span className="text-[9px] text-slate-400 font-normal">avg</span>
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="radio"
                    name="tu-adjust-row"
                    checked={selectedKey === 'unitSellingPrice'}
                    onChange={() => setSelectedKey('unitSellingPrice')}
                    className="accent-[#2E5E88] cursor-pointer"
                  />
                </td>
              </tr>

              {/* Unit Cost Price (0.00 for Time Units) */}
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <td className="py-1.5 px-3.5 text-left text-[11px]">
                  unit cost price (variable · fixed COS from Steps 3–5)
                </td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-1.5 px-2.5 tabular-nums text-[11px]">
                    0.00
                  </td>
                ))}
                <td className="py-1.5 px-3 tabular-nums text-[11px]">0.00</td>
                <td className="py-1.5 px-3 text-center text-slate-300 dark:text-slate-700">-</td>
              </tr>

              {/* SECTION 2: TRADING ACCOUNT TRANSFER */}
              <tr className="bg-emerald-500/10 border-b border-slate-200 dark:border-slate-800">
                <td
                  colSpan={15}
                  className="py-1.5 px-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400"
                >
                  TRADING VALUES TRANSFERRED TO TRADING ACCOUNT
                </td>
              </tr>

              <tr className="border-b border-slate-100 dark:border-slate-800/70 bg-emerald-500/5 font-bold">
                <td className="py-2.5 px-3.5 text-left text-emerald-800 dark:text-emerald-300">
                  revenue
                </td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-2.5 px-2.5 tabular-nums text-emerald-700 dark:text-emerald-300">
                    {m.isLaunched ? fmtInt(m.revenue) : '—'}
                  </td>
                ))}
                <td className="py-2.5 px-3 tabular-nums text-emerald-700 dark:text-emerald-300">
                  {fmtInt(grid.totals.sumRevenue)}
                </td>
                <td className="py-2.5 px-3 text-center text-slate-400">-</td>
              </tr>

              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <td className="py-1.5 px-3.5 text-left text-[11px]">
                  cost of sales - variable
                </td>
                {grid.months.map((m) => (
                  <td key={m.absMonth} className="py-1.5 px-2.5 tabular-nums text-[11px]">
                    0
                  </td>
                ))}
                <td className="py-1.5 px-3 tabular-nums text-[11px]">0</td>
                <td className="py-1.5 px-3 text-center text-slate-300 dark:text-slate-700">-</td>
              </tr>

              {/* SECTION 3: GROSS PROFIT ADJUSTMENTS */}
              <tr className="bg-amber-500/10 border-b border-slate-200 dark:border-slate-800">
                <td
                  colSpan={15}
                  className="py-1.5 px-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400"
                >
                  GROSS PROFIT ADJUSTMENTS
                </td>
              </tr>

              <tr
                onClick={() => setSelectedKey('commissionOnSalesPct')}
                className={`border-b border-slate-100 dark:border-slate-800/70 cursor-pointer transition-colors ${
                  selectedKey === 'commissionOnSalesPct'
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
                    name="tu-adjust-row"
                    checked={selectedKey === 'commissionOnSalesPct'}
                    onChange={() => setSelectedKey('commissionOnSalesPct')}
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

              {/* SECTION 4: OTHER INCOME */}
              <tr className="bg-sky-500/10 border-b border-slate-200 dark:border-slate-800">
                <td
                  colSpan={15}
                  className="py-1.5 px-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400"
                >
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
                    name="tu-adjust-row"
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

      {/* EMBEDDED ADJUSTMENT SLIDER */}
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
// SERVICES: TIME UNITS CHARTS VIEW
// ============================================================================

interface TimeUnitsChartsViewProps {
  theme?: 'light' | 'dark';
  products: RevenueItem[];
  activeProductIdx: number;
  onSelectProductIdx: (idx: number) => void;
  activeYear: number;
  onSelectYear: (yr: number) => void;
  daysWorked60: number[];
}

export const TimeUnitsChartsView: React.FC<TimeUnitsChartsViewProps> = ({
  theme = 'light',
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
    return calculateTimeUnitsProductYearGrid(currentProduct, daysWorked60, activeYear);
  }, [currentProduct, daysWorked60, activeYear]);

  const portfolioSummaries = useMemo(() => {
    const items = products.map((prod) => {
      const g = calculateTimeUnitsProductYearGrid(prod, daysWorked60, activeYear);
      return {
        id: prod.id,
        name: prod.name,
        dailyCapacityHours: g.dailyCapacityHours,
        yearHoursSold: g.totals.sumHoursSold,
        yearCapacityHours: g.totals.sumCapacityHours,
        yearRevenue: g.totals.sumRevenue,
        employeesStandard: g.employeesStandard,
        employeesAdjusted: g.employeesAdjusted,
      };
    });
    const totalRev = items.reduce((s, i) => s + i.yearRevenue, 0);
    const totalStaff = items.reduce((s, i) => s + i.employeesAdjusted, 0);
    return {
      items: items.map((i) => ({
        ...i,
        revenueSharePct: totalRev > 0 ? (i.yearRevenue / totalRev) * 100 : 0,
      })),
      totalRev,
      totalStaff,
    };
  }, [products, daysWorked60, activeYear]);

  if (!currentProduct || !grid) return null;

  const maxHoursVal = Math.max(
    1,
    ...grid.months.map((m) => Math.max(m.hoursPerMonth, m.monthlyCapacityHours))
  );
  const maxMoneyVal = Math.max(
    1,
    ...grid.months.map((m) =>
      Math.max(m.revenue, Math.abs(m.grossProfitAdjustments), m.otherIncome)
    )
  );

  const fmtHrs = (n: number) => (Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1));

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

        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#7EB2E2] border border-[#2E5E88]/25">
          {currentProduct.name} · {fmtHrs(grid.dailyCapacityHours)} hrs/day · Year {activeYear}
        </span>
      </div>

      {/* Chart 1: Billed Time Units vs Production Capacity */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#2E5E88] dark:text-[#6BA3D6]" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              BILLED TIME UNITS VS PRODUCTION CAPACITY (YEAR {activeYear})
            </h3>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              grid.totals.utilizationOfCapacityPct > 100
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
            }`}
          >
            Utilization: {grid.totals.utilizationOfCapacityPct.toFixed(1)}% ({fmtHrs(grid.totals.sumHoursSold)} / {fmtHrs(grid.totals.sumCapacityHours)} hrs)
          </span>
        </div>

        <div className="pt-2 space-y-3">
          <div className="relative h-64 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="grid grid-flow-col auto-cols-fr gap-2 sm:gap-3 items-end h-full">
              {grid.months.map((m) => {
                const capH = (m.monthlyCapacityHours / (maxHoursVal * 1.15)) * 100;
                const soldH = (m.hoursPerMonth / (maxHoursVal * 1.15)) * 100;
                const isOverCap = m.hoursPerMonth > m.monthlyCapacityHours + 0.01;

                return (
                  <div key={m.monthNum} className="flex flex-col items-center h-full justify-end group relative">
                    <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg whitespace-nowrap pointer-events-none z-20 font-bold shadow-lg space-y-0.5">
                      <div>Month {m.monthNum} ({m.daysWorked} days):</div>
                      <div className="text-sky-300">Billed: {fmtHrs(m.hoursPerMonth)} hrs ({m.productionFactorPct.toFixed(0)}%)</div>
                      <div className="text-amber-300">Capacity: {fmtHrs(m.monthlyCapacityHours)} hrs</div>
                    </div>

                    <span className="text-[9px] font-bold tabular-nums mb-1 text-slate-700 dark:text-slate-300">
                      {fmtHrs(m.hoursPerMonth)}
                    </span>

                    <div className="flex items-end justify-center gap-1 w-full max-w-[48px] h-full">
                      <div
                        style={{ height: `${Math.max(m.hoursPerMonth > 0 ? 4 : 0, soldH)}%` }}
                        className={`w-1/2 rounded-t-sm transition-all ${
                          isOverCap
                            ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                            : 'bg-gradient-to-t from-[#2E5E88] to-[#5584B4]'
                        }`}
                      />
                      <div
                        style={{ height: `${Math.max(m.monthlyCapacityHours > 0 ? 4 : 0, capH)}%` }}
                        className="w-1/2 rounded-t-sm bg-amber-400/50 dark:bg-amber-500/40 border border-amber-500/50"
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

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-xs bg-[#2E5E88]" /> Billed Time Units (hrs)
              </span>
              <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                <span className="w-3 h-3 rounded-xs bg-amber-400/60 border border-amber-500" /> Monthly Capacity (hrs)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 lowercase">
              capacity driven exclusively by production calculator ({fmtHrs(grid.dailyCapacityHours)} hrs/day)
            </span>
          </div>
        </div>
      </div>

      {/* Chart 2: Monthly Revenue, GP Adjustments & Other Income */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              MONTHLY REVENUE, GP ADJUSTMENTS &amp; OTHER INCOME (YEAR {activeYear})
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
            Year {activeYear} Revenue: {grid.totals.sumRevenue.toLocaleString()}
          </span>
        </div>

        <div className="pt-2 space-y-3">
          <div className="relative h-64 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="grid grid-flow-col auto-cols-fr gap-2 sm:gap-3 items-end h-full">
              {grid.months.map((m) => {
                const revH = (m.revenue / (maxMoneyVal * 1.15)) * 100;
                const adjH = (Math.abs(m.grossProfitAdjustments) / (maxMoneyVal * 1.15)) * 100;
                const othH = (Math.max(0, m.otherIncome) / (maxMoneyVal * 1.15)) * 100;

                return (
                  <div key={m.monthNum} className="flex flex-col items-center h-full justify-end group relative">
                    <div className="absolute -top-20 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg whitespace-nowrap pointer-events-none z-20 font-bold shadow-lg space-y-0.5">
                      <div className="text-slate-300">Month {m.monthNum} ({fmtHrs(m.hoursPerMonth)} hrs):</div>
                      <div className="text-emerald-300">Revenue: {m.revenue.toLocaleString()}</div>
                      <div className="text-amber-300">GP Adj.: {m.grossProfitAdjustments.toLocaleString()}</div>
                      <div className="text-sky-300">Other Income: {m.otherIncome.toLocaleString()}</div>
                    </div>

                    <span className="text-[9px] font-bold tabular-nums mb-1 text-emerald-700 dark:text-emerald-400">
                      {m.revenue >= 1000 ? `${Math.round(m.revenue / 1000)}k` : m.revenue}
                    </span>

                    <div className="flex items-end justify-center gap-0.5 sm:gap-1 w-full max-w-[56px] h-full">
                      <div
                        style={{ height: `${Math.max(m.revenue > 0 ? 4 : 0, revH)}%` }}
                        className="w-1/3 rounded-t-xs sm:rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400"
                      />
                      <div
                        style={{ height: `${Math.max(Math.abs(m.grossProfitAdjustments) > 0 ? 4 : 0, adjH)}%` }}
                        className="w-1/3 rounded-t-xs sm:rounded-t-sm bg-gradient-to-t from-amber-600 to-amber-400"
                      />
                      <div
                        style={{ height: `${Math.max(m.otherIncome > 0 ? 4 : 0, othH)}%` }}
                        className="w-1/3 rounded-t-xs sm:rounded-t-sm bg-gradient-to-t from-[#2E5E88] to-[#5584B4]"
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

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-xs bg-emerald-500" /> Revenue (0 Variable COS)
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-xs bg-amber-500" /> GP Adjustments
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-xs bg-[#2E5E88]" /> Other Income
              </span>
            </div>
            <span className="text-[11px] text-slate-400 lowercase">
              avg billing rate: {grid.totals.avgUnitSellingPrice.toFixed(2)}/hr · {fmtHrs(grid.totals.sumHoursSold)} billed hrs
            </span>
          </div>
        </div>
      </div>

      {/* Chart 3: Portfolio Service Lines & Advisory Staffing Overview */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#2E5E88] dark:text-[#6BA3D6]" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              SERVICE LINE MIX &amp; ADVISORY PRODUCTIVE STAFFING (YEAR {activeYear})
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#7EB2E2]">
            Total Advisory Productive Staff: {portfolioSummaries.totalStaff}
          </span>
        </div>

        <div className="space-y-3">
          {portfolioSummaries.items.map((item) => (
            <div key={item.id} className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#2E5E88] dark:text-[#7EB2E2]" />
                  <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#7EB2E2] font-bold">
                    {fmtHrs(item.dailyCapacityHours)} hrs/d
                  </span>
                  <span className="text-[11px] text-slate-500">
                    advisory staff: {item.employeesAdjusted} ({item.employeesStandard} std)
                  </span>
                </div>
                <div className="text-right tabular-nums">
                  <span className="text-slate-500 mr-2">
                    {fmtHrs(item.yearHoursSold)} hrs
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {Math.round(item.yearRevenue).toLocaleString()} ({item.revenueSharePct.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="h-3 rounded-full bg-slate-100 dark:bg-[#0B1020] overflow-hidden flex">
                <div
                  style={{ width: `${Math.max(item.revenueSharePct > 0 ? 2 : 0, item.revenueSharePct)}%` }}
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
