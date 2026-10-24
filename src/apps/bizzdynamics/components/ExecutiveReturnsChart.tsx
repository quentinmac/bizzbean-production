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
  currencyPrefix = 'R ',
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
    if (data.length === 1) return margin.left + plotWidth / 2;
    return margin.left + (index / (data.length - 1)) * plotWidth;
  };

  const getRoeY = (val: number) => {
    const clamped = Math.max(roeMin, Math.min(roeMax, val));
    const ratio = (clamped - roeMin) / roeRange;
    return margin.top + plotHeight - ratio * plotHeight;
  };

  const getDeY = (val: number) => {
    const clamped = Math.max(deMin, Math.min(deMax, val));
    const ratio = (clamped - deMin) / deRange;
    return margin.top + plotHeight - ratio * plotHeight;
  };

  const getEpsY = (val: number) => {
    const clamped = Math.max(epsMin, Math.min(epsMax, val));
    const ratio = (clamped - epsMin) / epsRange;
    return margin.top + plotHeight - ratio * plotHeight;
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

  // Paths
  const roePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getRoeY(d.roe)}`)
    .join(' ');

  const dePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getDeY(d.debtEquity)}`)
    .join(' ');

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
            Key Financial Elements: Return on Equity, Debt / Equity Ratio &amp; EPS
          </span>
        </div>

        {/* View Mode Selector Tabs (All vs Individual Elements) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#161F38] border border-slate-200 dark:border-slate-800 text-[11px]">
          {[
            { id: 'all', label: 'All 3 Elements' },
            { id: 'roe', label: 'Return on Equity' },
            { id: 'debtEquity', label: 'Debt / Equity' },
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

          {/* Lines based on active mode */}
          {(activeElement === 'all' || activeElement === 'debtEquity') && (
            <path
              d={dePath}
              fill="none"
              stroke={deColor}
              strokeWidth={3}
              strokeDasharray={activeElement === 'all' ? '6 3' : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {(activeElement === 'all' || activeElement === 'roe') && (
            <path
              d={roePath}
              fill="none"
              stroke={roeColor}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {(activeElement === 'all' || activeElement === 'eps') && (
            <path
              d={epsPath}
              fill="none"
              stroke={epsColor}
              strokeWidth={3}
              strokeDasharray={activeElement === 'all' ? '3 3' : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points and Interactivity */}
          {data.map((d, i) => {
            const x = getX(i);
            const roeY = getRoeY(d.roe);
            const deY = getDeY(d.debtEquity);
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

                {/* Debt / Equity Dot */}
                {(activeElement === 'all' || activeElement === 'debtEquity') && (
                  <rect
                    x={x - 4}
                    y={deY - 4}
                    width={8}
                    height={8}
                    transform={`rotate(45 ${x} ${deY})`}
                    fill={deColor}
                    stroke={isDark ? '#101626' : '#FFFFFF'}
                    strokeWidth={2}
                  />
                )}

                {/* ROE Dot */}
                {(activeElement === 'all' || activeElement === 'roe') && (
                  <circle
                    cx={x}
                    cy={roeY}
                    r={5}
                    fill={roeColor}
                    stroke={isDark ? '#101626' : '#FFFFFF'}
                    strokeWidth={2}
                  />
                )}

                {/* EPS Dot */}
                {(activeElement === 'all' || activeElement === 'eps') && (
                  <rect
                    x={x - 4}
                    y={epsY - 4}
                    width={8}
                    height={8}
                    rx={2}
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
