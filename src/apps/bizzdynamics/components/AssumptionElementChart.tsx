import React, { useState } from 'react';
import { AssumptionRateItem } from '../types';
import { Sliders, TrendingUp, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface AssumptionElementChartProps {
  theme?: 'light' | 'dark';
  item: AssumptionRateItem;
  yearFilter: number | 'all'; // 1-5 or 'all'
  startDate?: string; // e.g. "2026-02"
  onQuickAdjust?: (monthIndex: number, newValue: number) => void;
  onSelectForAdjustment?: () => void;
}

export const AssumptionElementChart: React.FC<AssumptionElementChartProps> = ({
  theme = 'light',
  item,
  yearFilter,
  startDate = '2026-02',
  onQuickAdjust,
  onSelectForAdjustment,
}) => {
  const isDark = theme === 'dark';
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Parse start date for realistic month labels
  const [startYearStr, startMonthStr] = startDate.split('-');
  const startYear = parseInt(startYearStr, 10) || 2026;
  const startMonthNum = parseInt(startMonthStr, 10) || 2; // 1-indexed

  // Ensure 60 values exist
  const full60Values = React.useMemo(() => {
    const arr = new Array(60).fill(item.baseRate);
    if (item.monthlyValues) {
      item.monthlyValues.forEach((v, idx) => {
        if (idx < 60) arr[idx] = v;
      });
    }
    return arr;
  }, [item.monthlyValues, item.baseRate]);

  // Sliced data based on yearFilter
  const displayMonths = React.useMemo(() => {
    const dayNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    if (yearFilter === 'all') {
      return full60Values.map((val, idx) => {
        const absoluteMonth = idx + 1; // 1-60
        const yrOffset = Math.floor((startMonthNum - 1 + idx) / 12);
        const mthOffset = (startMonthNum - 1 + idx) % 12;
        const calYear = startYear + yrOffset;
        const calMonthName = dayNames[mthOffset];
        const isModified = Math.abs(val - item.baseRate) > 0.0001;

        return {
          monthIndex: idx,
          absoluteMonth,
          yearIndex: Math.floor(idx / 12) + 1,
          monthInYear: (idx % 12) + 1,
          label: `m${absoluteMonth}`,
          fullLabel: `${calMonthName} '${String(calYear).slice(2)}`,
          shortLabel: idx % 3 === 0 ? `m${absoluteMonth}` : '',
          value: val,
          isModified,
        };
      });
    }

    // Single Year: 12 months
    const startIdx = (yearFilter - 1) * 12;
    return Array.from({ length: 12 }, (_, i) => {
      const idx = startIdx + i;
      const absoluteMonth = idx + 1;
      const yrOffset = Math.floor((startMonthNum - 1 + idx) / 12);
      const mthOffset = (startMonthNum - 1 + idx) % 12;
      const calYear = startYear + yrOffset;
      const calMonthName = dayNames[mthOffset];
      const val = full60Values[idx] ?? item.baseRate;
      const isModified = Math.abs(val - item.baseRate) > 0.0001;

      return {
        monthIndex: idx,
        absoluteMonth,
        yearIndex: yearFilter,
        monthInYear: i + 1,
        label: `${calMonthName}`,
        fullLabel: `${calMonthName} '${String(calYear).slice(2)} (m${absoluteMonth})`,
        shortLabel: calMonthName,
        value: val,
        isModified,
      };
    });
  }, [full60Values, yearFilter, startYear, startMonthNum, item.baseRate]);

  // Statistics for this filter horizon
  const values = displayMonths.map((m) => m.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const avgVal = values.reduce((s, v) => s + v, 0) / (values.length || 1);
  const modifiedCount = displayMonths.filter((m) => m.isModified).length;

  // Chart max scale (ensure visible headroom)
  const chartMax = Math.max(maxVal * 1.25, item.baseRate * 1.3, 1);

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
        isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
      }`}
    >
      {/* Top Header: Assumption Name, COA reference & Summary Statistics */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white lowercase">
              {item.name}
            </h3>
            {item.coaReference && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                COA {item.coaReference}
              </span>
            )}
            {modifiedCount > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold lowercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{modifiedCount} dynamic {modifiedCount === 1 ? 'override' : 'overrides'}</span>
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold lowercase">
                flat baseline
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 lowercase mt-0.5 max-w-xl truncate">
            {item.description}
          </p>
        </div>

        {/* Quick jump to adjustment tool */}
        {onSelectForAdjustment && (
          <button
            type="button"
            onClick={onSelectForAdjustment}
            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#2E5E88]/10 hover:bg-[#2E5E88]/20 border border-[#2E5E88]/30 text-[#2E5E88] dark:text-[#5584B4] transition-all flex items-center gap-1.5 lowercase"
            title="Open in dynamic base rate adjustment tool"
          >
            <Sliders className="h-3 w-3" />
            <span>adjust in tool</span>
          </button>
        )}
      </div>

      {/* Summary KPI Badges (BizzCalc Summary Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 pb-2 text-xs font-mono">
        <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
          <div className="text-[10px] text-slate-500 lowercase">base rate</div>
          <div className="text-xs font-bold text-[#2E5E88] dark:text-[#5584B4]">
            {item.baseRate.toFixed(2)}{item.unit === '%' ? '%' : ''}
          </div>
        </div>

        <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
          <div className="text-[10px] text-slate-500 lowercase">
            {yearFilter === 'all' ? '5-yr avg rate' : `y${yearFilter} avg rate`}
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            {avgVal.toFixed(2)}{item.unit === '%' ? '%' : ''}
          </div>
        </div>

        <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
          <div className="text-[10px] text-slate-500 lowercase">min / max</div>
          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
            {minVal.toFixed(1)}{item.unit === '%' ? '%' : ''} – {maxVal.toFixed(1)}{item.unit === '%' ? '%' : ''}
          </div>
        </div>

        <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
          <div className="text-[10px] text-slate-500 lowercase">active horizon</div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            {yearFilter === 'all' ? 'all 5 years (60m)' : `year ${yearFilter} (12m)`}
          </div>
        </div>
      </div>

      {/* Main Bar Chart Container (Authentic BizzCalc Signature Chart Aesthetics) */}
      <div className="pt-2">
        <div className="text-center text-xs font-normal text-slate-500 lowercase mb-1">
          {item.name} — {yearFilter === 'all' ? '5-year monthly projection (m1 – m60)' : `year ${yearFilter} monthly rate`}
        </div>

        {/* Chart Viewport */}
        <div className="h-48 sm:h-56 flex items-end justify-between gap-1 pt-6 px-1 relative">
          {/* Baseline guide line */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-[#2E5E88]/40 pointer-events-none z-0 flex items-center justify-end pr-1"
            style={{
              bottom: `${Math.min(90, Math.max(10, Math.round((item.baseRate / chartMax) * 68) + 26))}px`,
            }}
          >
            <span className="text-[8px] font-mono text-[#2E5E88] dark:text-[#5584B4] bg-white/80 dark:bg-[#0E1322]/80 px-1 rounded">
              base: {item.baseRate.toFixed(1)}{item.unit === '%' ? '%' : ''}
            </span>
          </div>

          {displayMonths.map((m) => {
            // Height calculation relative to chartMax, clamped
            const heightPct = Math.min(68, Math.max(6, Math.round((m.value / chartMax) * 65)));
            const isHovered = hoveredMonth === m.monthIndex;
            const deltaVsBase = m.value - item.baseRate;

            return (
              <div
                key={m.monthIndex}
                onMouseEnter={() => setHoveredMonth(m.monthIndex)}
                onMouseLeave={() => setHoveredMonth(null)}
                className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group relative cursor-pointer z-10"
                title={`${m.fullLabel}: ${m.value.toFixed(2)}${item.unit === '%' ? '%' : ''} ${
                  m.isModified ? `(${deltaVsBase >= 0 ? '+' : ''}${deltaVsBase.toFixed(2)}% vs base)` : '(baseline)'
                }`}
              >
                {/* Value displayed vertically rotated (270deg) matching BizzCalc */}
                <div className="h-8 w-full flex items-center justify-center shrink-0 mb-1">
                  <span
                    className={`text-[8px] sm:text-[9px] font-mono select-none whitespace-nowrap leading-none inline-block origin-center transform transition-colors ${
                      m.isModified
                        ? 'text-amber-500 font-bold'
                        : isHovered
                        ? 'text-slate-700 dark:text-slate-200'
                        : 'text-slate-400'
                    }`}
                    style={{ transform: 'rotate(270deg)' }}
                  >
                    {m.value.toFixed(1)}{item.unit === '%' ? '%' : ''}
                  </span>
                </div>

                {/* Vertical Bar */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[20px] rounded-t transition-all duration-150 shrink-0 ${
                    m.isModified
                      ? 'bg-[#D97757] ring-1 ring-[#D97757] hover:brightness-110 shadow-2xs'
                      : 'bg-[#2E5E88] hover:bg-[#356ca0]'
                  } ${isHovered ? 'opacity-100 scale-y-105 origin-bottom' : 'opacity-90'}`}
                />

                {/* Bottom Month Label */}
                <span
                  className={`text-[9px] sm:text-[10px] font-medium lowercase mt-1.5 shrink-0 select-none truncate ${
                    m.isModified ? 'text-[#D97757] font-bold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {yearFilter === 'all' ? (m.monthIndex % 4 === 0 ? `m${m.absoluteMonth}` : '') : m.label}
                </span>

                {/* Interactive Tooltip on Hover */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none whitespace-nowrap">
                    <div className="px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-[10px] font-mono shadow-xl border border-slate-700 space-y-0.5 text-center">
                      <div className="font-bold text-[#5584B4]">{m.fullLabel}</div>
                      <div className="text-xs font-bold">
                        {m.value.toFixed(2)}{item.unit === '%' ? '%' : ''}
                      </div>
                      {m.isModified ? (
                        <div className="text-amber-400 text-[9px] space-y-0.5">
                          <div>change rate: {deltaVsBase >= 0 ? '+' : ''}{deltaVsBase.toFixed(2)}%</div>
                          <div className="text-slate-300 text-[8px] font-sans">formula: ({item.baseRate.toFixed(2)}% base {deltaVsBase >= 0 ? '+' : '-'} {Math.abs(deltaVsBase).toFixed(2)}% change)</div>
                        </div>
                      ) : (
                        <div className="text-slate-400 text-[9px]">matches base ({item.baseRate.toFixed(2)}% · 0.00% change)</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default AssumptionElementChart;
