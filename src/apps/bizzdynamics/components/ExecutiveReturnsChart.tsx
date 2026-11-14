import React, { useState } from 'react';

export interface ReturnsChartDataPoint {
  year: number;
  label: string;
  roe: number;         // Return on Equity (%)
  debtEquity: number;  // Debt / Equity Ratio (x or ratio)
  eps: number;         // Earnings Per Share (currency per share)
}

interface ExecutiveReturnsChartProps {
  data: ReturnsChartDataPoint[];
  isDark?: boolean;
  currencyPrefix?: string;
  title?: string;
}

export const ExecutiveReturnsChart: React.FC<ExecutiveReturnsChartProps> = ({
  data,
  isDark = false,
  currencyPrefix = '',
  title = 'CAPITAL STRUCTURE & SHAREHOLDER RETURNS',
}) => {
  // View mode selector: All elements vs individually
  const [activeElement, setActiveElement] = useState<'all' | 'roe' | 'debtEquity' | 'eps'>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        No shareholder returns data available.
      </div>
    );
  }

  // Dimensions
  const svgWidth = 860;
  const svgHeight = 320;
  const margin = { top: 30, right: 75, bottom: 40, left: 75 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // Left Axis: ROE (%) or Individual Value
  const roeValues = data.map((d) => d.roe);
  const rawRoeMin = Math.min(0, ...roeValues);
  const rawRoeMax = Math.max(10, ...roeValues);
  const roeMin = rawRoeMin < 0 ? Math.floor(rawRoeMin * 1.15) : 0;
  const roeMax = Math.ceil(rawRoeMax * 1.15) || 10;
  const roeRange = roeMax - roeMin || 1;

  // Right Axis: Debt/Equity ratio or EPS
  const deValues = data.map((d) => d.debtEquity);
  const rawDeMin = 0;
  const rawDeMax = Math.max(1, ...deValues);
  const deMin = 0;
  const deMax = Math.max(1, Number((rawDeMax * 1.25).toFixed(2)));
  const deRange = deMax - deMin || 1;

  const epsValues = data.map((d) => d.eps);
  const rawEpsMin = Math.min(0, ...epsValues);
  const rawEpsMax = Math.max(1, ...epsValues);
  const epsMin = rawEpsMin < 0 ? Math.floor(rawEpsMin * 1.15) : 0;
  const epsMax = Math.ceil(rawEpsMax * 1.2) || 1;
  const epsRange = epsMax - epsMin || 1;

  // Coordinate Helpers
  const getX = (index: number) => {
    if (data.length <= 1) return margin.left + plotWidth / 2;
    const res = margin.left + (index / (data.length - 1)) * plotWidth;
    return isNaN(res) ? margin.left : res;
  };

  const getRoeY = (val: number) => {
    const num = isNaN(val) || val === null || val === undefined ? 0 : Number(val);
    const clamped = Math.max(roeMin, Math.min(roeMax, num));
    const range = Math.max(1, roeRange);
    const ratio = (clamped - roeMin) / range;
    const res = margin.top + plotHeight - ratio * plotHeight;
    return isNaN(res) ? margin.top + plotHeight : res;
  };

  const getDeY = (val: number) => {
    const num = isNaN(val) || val === null || val === undefined ? 0 : Number(val);
    const clamped = Math.max(deMin, Math.min(deMax, num));
    const range = Math.max(1, deRange);
    const ratio = (clamped - deMin) / range;
    const res = margin.top + plotHeight - ratio * plotHeight;
    return isNaN(res) ? margin.top + plotHeight : res;
  };

  const getEpsY = (val: number) => {
    const num = isNaN(val) || val === null || val === undefined ? 0 : Number(val);
    const clamped = Math.max(epsMin, Math.min(epsMax, num));
    const range = Math.max(1, epsRange);
    const ratio = (clamped - epsMin) / range;
    const res = margin.top + plotHeight - ratio * plotHeight;
    return isNaN(res) ? margin.top + plotHeight : res;
  };

  // Ticks
  const tickCount = 4;
  const roeTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const val = roeMin + (i / tickCount) * roeRange;
    return {
      value: Number(val.toFixed(1)),
      y: margin.top + plotHeight - (i / tickCount) * plotHeight,
    };
  });

  const deTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const val = deMin + (i / tickCount) * deRange;
    return {
      value: Number(val.toFixed(2)),
      y: margin.top + plotHeight - (i / tickCount) * plotHeight,
    };
  });

  const epsTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const val = epsMin + (i / tickCount) * epsRange;
    return {
      value: Number(val.toFixed(2)),
      y: margin.top + plotHeight - (i / tickCount) * plotHeight,
    };
  });

  // Path for EPS Line
  const epsPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getEpsY(d.eps)}`)
    .join(' ');

  const roeColor = '#8B5CF6';    // Purple (ROE)
  const deColor = '#EC4899';     // Rose/Pink (Debt/Equity)
  const epsColor = '#10B981';    // Emerald (EPS)

  return (
    <div
      className={`rounded-2xl border overflow-hidden font-mono ${
        isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
      }`}
    >
      {/* 1. Header with Element Selector Tabs */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
        <div>
          <span className="font-bold uppercase text-xs tracking-wide text-slate-900 dark:text-white block">
            {title}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Key Financial Elements: Return on Equity (Bar), Debt / Equity (Bar) &amp; EPS (Line)
          </span>
        </div>

        {/* View Mode Selector Tabs (All vs Individual Elements) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#161F38] border border-slate-200 dark:border-slate-800 text-[11px]">
          {[
            { id: 'all', label: 'All 3 Elements' },
            { id: 'roe', label: 'Return on Equity (Bar)' },
            { id: 'debtEquity', label: 'Debt / Equity (Bar)' },
            { id: 'eps', label: 'Earnings Per Share' },
          ].map((tab) => {
            const isSelected = activeElement === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveElement(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  isSelected
                    ? 'bg-[#2E5E88] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SVG Chart Canvas */}
      <div className="p-2 sm:p-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[620px] select-none"
        >
          {/* Grid lines and Left Axis */}
          {(activeElement === 'all' || activeElement === 'roe'
            ? roeTicks
            : activeElement === 'debtEquity'
            ? deTicks
            : epsTicks
          ).map((tick, i) => (
            <g key={i}>
              <line
                x1={margin.left}
                y1={tick.y}
                x2={margin.left + plotWidth}
                y2={tick.y}
                stroke={isDark ? '#1F2A44' : '#E2E8F0'}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <text
                x={margin.left - 10}
                y={tick.y + 4}
                textAnchor="end"
                className={`text-[10px] font-mono ${
                  activeElement === 'debtEquity'
                    ? 'fill-rose-500'
                    : activeElement === 'eps'
                    ? 'fill-emerald-500'
                    : 'fill-purple-400'
                }`}
              >
                {activeElement === 'debtEquity'
                  ? `${tick.value.toFixed(2)}x`
                  : activeElement === 'eps'
                  ? `${currencyPrefix}${tick.value.toFixed(2)}`
                  : `${tick.value.toFixed(1)}%`}
              </text>
            </g>
          ))}

          {/* Right Y-Axis in 'all' mode: Debt/Equity ratio */}
          {activeElement === 'all' &&
            deTicks.map((tick, i) => (
              <text
                key={i}
                x={margin.left + plotWidth + 10}
                y={tick.y + 4}
                textAnchor="start"
                className={`text-[10px] font-mono ${isDark ? 'fill-rose-400' : 'fill-rose-500'}`}
              >
                {tick.value.toFixed(2)}x
              </text>
            ))}

          {/* Zero baseline for ROE if applicable */}
          {roeMin < 0 && (activeElement === 'all' || activeElement === 'roe') && (
            <line
              x1={margin.left}
              y1={getRoeY(0)}
              x2={margin.left + plotWidth}
              y2={getRoeY(0)}
              stroke={isDark ? '#475569' : '#94A3B8'}
              strokeWidth={1.5}
            />
          )}

          {/* =================================================================== */}
          {/* BARS: Return on Equity (Purple) & Debt/Equity (Rose)                 */}
          {/* =================================================================== */}
          {data.map((d, i) => {
            const x = getX(i);
            const isHovered = hoveredIndex === i;

            if (activeElement === 'all') {
              // Dual side-by-side bars
              const barW = Math.max(7, Math.min(20, (plotWidth / data.length) * 0.28));
              const gap = 2;

              // ROE Bar
              const roeZeroY = getRoeY(0);
              const roeValY = getRoeY(d.roe);
              const roeBarY = d.roe >= 0 ? roeValY : roeZeroY;
              const roeBarH = Math.max(2, Math.abs(roeZeroY - roeValY));

              // Debt / Equity Bar
              const baselineY = margin.top + plotHeight;
              const deValY = getDeY(d.debtEquity);
              const deBarH = Math.max(2, baselineY - deValY);

              return (
                <g key={`bars-${i}`}>
                  {/* ROE Bar */}
                  <rect
                    x={x - barW - gap / 2}
                    y={roeBarY}
                    width={barW}
                    height={roeBarH}
                    rx={2}
                    fill={roeColor}
                    fillOpacity={isHovered ? 0.95 : 0.75}
                    stroke={roeColor}
                    strokeWidth={isHovered ? 2 : 1}
                    className="transition-all"
                  />
                  {/* Debt / Equity Bar */}
                  <rect
                    x={x + gap / 2}
                    y={deValY}
                    width={barW}
                    height={deBarH}
                    rx={2}
                    fill={deColor}
                    fillOpacity={isHovered ? 0.95 : 0.75}
                    stroke={deColor}
                    strokeWidth={isHovered ? 2 : 1}
                    className="transition-all"
                  />
                </g>
              );
            }

            if (activeElement === 'roe') {
              // Centered ROE bar
              const barW = Math.max(12, Math.min(36, (plotWidth / data.length) * 0.45));
              const roeZeroY = getRoeY(0);
              const roeValY = getRoeY(d.roe);
              const roeBarY = d.roe >= 0 ? roeValY : roeZeroY;
              const roeBarH = Math.max(2, Math.abs(roeZeroY - roeValY));

              return (
                <rect
                  key={`roe-bar-${i}`}
                  x={x - barW / 2}
                  y={roeBarY}
                  width={barW}
                  height={roeBarH}
                  rx={3}
                  fill={roeColor}
                  fillOpacity={isHovered ? 0.95 : 0.75}
                  stroke={roeColor}
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-all"
                />
              );
            }

            if (activeElement === 'debtEquity') {
              // Centered Debt/Equity bar
              const barW = Math.max(12, Math.min(36, (plotWidth / data.length) * 0.45));
              const baselineY = margin.top + plotHeight;
              const deValY = getDeY(d.debtEquity);
              const deBarH = Math.max(2, baselineY - deValY);

              return (
                <rect
                  key={`de-bar-${i}`}
                  x={x - barW / 2}
                  y={deValY}
                  width={barW}
                  height={deBarH}
                  rx={3}
                  fill={deColor}
                  fillOpacity={isHovered ? 0.95 : 0.75}
                  stroke={deColor}
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-all"
                />
              );
            }

            return null;
          })}

          {/* EPS Line (Emerald) on top of bars */}
          {(activeElement === 'all' || activeElement === 'eps') && (
            <path
              d={epsPath}
              fill="none"
              stroke={epsColor}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points and Interactivity */}
          {data.map((d, i) => {
            const x = getX(i);
            const epsY = getEpsY(d.eps);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {isHovered && (
                  <line
                    x1={x}
                    y1={margin.top}
                    x2={x}
                    y2={margin.top + plotHeight}
                    stroke={isDark ? '#475569' : '#CBD5E1'}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                )}

                {/* EPS Dot */}
                {(activeElement === 'all' || activeElement === 'eps') && (
                  <circle
                    cx={x}
                    cy={epsY}
                    r={5}
                    fill={epsColor}
                    stroke={isDark ? '#101626' : '#FFFFFF'}
                    strokeWidth={2}
                  />
                )}

                {/* X-Axis Label */}
                <text
                  x={x}
                  y={margin.top + plotHeight + 22}
                  textAnchor="middle"
                  className={`text-[11px] font-mono font-bold ${
                    isHovered
                      ? isDark
                        ? 'fill-white'
                        : 'fill-slate-900'
                      : isDark
                      ? 'fill-slate-400'
                      : 'fill-slate-600'
                  }`}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 3. Metric Indicator Footer */}
      <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 text-xs text-center bg-slate-50/50 dark:bg-[#0E1322]">
        {/* ROE */}
        <div className={`p-3 ${activeElement === 'roe' ? 'bg-[#8B5CF6]/10' : ''}`}>
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
            {hoveredIndex !== null ? `${data[hoveredIndex].label} ROE` : 'Latest (Y5) ROE'}
          </span>
          <span className="text-sm font-bold text-[#8B5CF6] block mt-0.5">
            {hoveredIndex !== null
              ? `${data[hoveredIndex].roe.toFixed(2)}%`
              : `${data[data.length - 1]?.roe.toFixed(2)}%`}
          </span>
          <span className="text-[10px] text-slate-400">Taxed Profits / Shareholders Equity</span>
        </div>

        {/* Debt / Equity */}
        <div className={`p-3 ${activeElement === 'debtEquity' ? 'bg-[#EC4899]/10' : ''}`}>
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
            {hoveredIndex !== null ? `${data[hoveredIndex].label} Debt / Equity` : 'Latest (Y5) D/E'}
          </span>
          <span className="text-sm font-bold text-[#EC4899] block mt-0.5">
            {hoveredIndex !== null
              ? `${data[hoveredIndex].debtEquity.toFixed(2)}x`
              : `${data[data.length - 1]?.debtEquity.toFixed(2)}x`}
          </span>
          <span className="text-[10px] text-slate-400">Interest-Bearing Debt / Equity</span>
        </div>

        {/* EPS */}
        <div className={`p-3 ${activeElement === 'eps' ? 'bg-[#10B981]/10' : ''}`}>
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
            {hoveredIndex !== null ? `${data[hoveredIndex].label} EPS` : 'Latest (Y5) EPS'}
          </span>
          <span className="text-sm font-bold text-emerald-500 block mt-0.5">
            {hoveredIndex !== null
              ? `${currencyPrefix}${data[hoveredIndex].eps.toFixed(2)}`
              : `${currencyPrefix}${data[data.length - 1]?.eps.toFixed(2)}`}
          </span>
          <span className="text-[10px] text-slate-400">Taxed Profits / Shares in Issue</span>
        </div>
      </div>
    </div>
  );
};
