import React, { useState } from 'react';

export interface LiquidityDataPoint {
  id: string;
  label: string;
  bank_balance_closing: number;
  term_loan_balance: number;
  whatif_bank_balance_closing?: number;
  whatif_term_loan_balance?: number;
  isTotal?: boolean;
}

interface LiquidityVsDebtChartProps {
  data: LiquidityDataPoint[];
  isDark: boolean;
  currencyPrefix?: string;
  title?: string;
  showWhatIfComparison?: boolean;
}

export const LiquidityVsDebtChart: React.FC<LiquidityVsDebtChartProps> = ({
  data,
  isDark,
  currencyPrefix = '',
  title = 'LIQUIDITY VS DEBT DUAL-AXIS TRAJECTORY',
  showWhatIfComparison,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        No projection data available for the selected period.
      </div>
    );
  }

  const hasWhatIf =
    showWhatIfComparison ??
    data.some((d) => d.whatif_bank_balance_closing !== undefined);

  // Chart dimensions
  const svgWidth = 920;
  const svgHeight = 350;
  const margin = { top: 32, right: 85, bottom: 45, left: 85 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // Left Y-Axis: Bank Balance (Cash) - Can be negative (overdraft) or positive
  const allCashValues = data.flatMap((d) =>
    hasWhatIf && d.whatif_bank_balance_closing !== undefined
      ? [d.bank_balance_closing, d.whatif_bank_balance_closing]
      : [d.bank_balance_closing]
  );
  const rawCashMin = Math.min(...allCashValues);
  const rawCashMax = Math.max(...allCashValues);
  const cashMin = rawCashMin < 0 ? Math.floor(rawCashMin * 1.15) : 0;
  const cashMax = Math.max(10000, Math.ceil(rawCashMax * 1.15));
  const cashRange = cashMax - cashMin || 1;

  // Right Y-Axis: Interest-Bearing Debt (IBD) - Always >= 0
  const allDebtValues = data.flatMap((d) =>
    hasWhatIf && d.whatif_term_loan_balance !== undefined
      ? [Math.abs(d.term_loan_balance), Math.abs(d.whatif_term_loan_balance)]
      : [Math.abs(d.term_loan_balance)]
  );
  const rawDebtMax = Math.max(...allDebtValues);
  const debtMin = 0;
  const debtMax = Math.max(10000, Math.ceil(rawDebtMax * 1.2));
  const debtRange = debtMax - debtMin || 1;

  // Coordinates mapping
  const getX = (index: number) => {
    if (data.length <= 1) return margin.left + plotWidth / 2;
    const res = margin.left + (index / (data.length - 1)) * plotWidth;
    return isNaN(res) ? margin.left : res;
  };

  const getCashY = (val: number) => {
    const num = isNaN(val) || val === null || val === undefined ? 0 : Number(val);
    const clamped = Math.max(cashMin, Math.min(cashMax, num));
    const range = Math.max(1, cashRange);
    const ratio = (clamped - cashMin) / range;
    const res = margin.top + plotHeight - ratio * plotHeight;
    return isNaN(res) ? margin.top + plotHeight : res;
  };

  const getDebtY = (val: number) => {
    const num = isNaN(val) || val === null || val === undefined ? 0 : Number(val);
    const clamped = Math.max(0, Math.min(debtMax, Math.abs(num)));
    const range = Math.max(1, debtRange);
    const ratio = (clamped - debtMin) / range;
    const res = margin.top + plotHeight - ratio * plotHeight;
    return isNaN(res) ? margin.top + plotHeight : res;
  };

  const zeroCashY = getCashY(0);

  // Column / Bar Width
  const colWidth = Math.min(48, Math.max(16, (plotWidth / data.length) * 0.55));
  const subBarWidth = hasWhatIf ? Math.max(6, colWidth * 0.44) : colWidth;

  // Ticks calculation
  const tickCount = 5;
  const cashTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const val = cashMin + (i / tickCount) * cashRange;
    return {
      value: Math.round(val),
      y: margin.top + plotHeight - (i / tickCount) * plotHeight,
    };
  });

  const debtTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const val = debtMin + (i / tickCount) * debtRange;
    return {
      value: Math.round(val),
      y: margin.top + plotHeight - (i / tickCount) * plotHeight,
    };
  });

  const formatShortNumber = (val: number) => {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    const prefix = currencyPrefix ? `${currencyPrefix} ` : '';
    if (abs >= 1_000_000) return `${sign}${prefix}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}${prefix}${(abs / 1_000).toFixed(0)}k`;
    return `${sign}${prefix}${abs}`;
  };

  // Build SVG path for Base Debt line
  const debtPoints = data.map((d, i) => ({
    x: getX(i),
    y: getDebtY(d.term_loan_balance),
  }));

  const debtLinePath = debtPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  // Build SVG path for What-If Debt line
  const whatIfDebtPoints = hasWhatIf
    ? data.map((d, i) => ({
        x: getX(i),
        y: getDebtY(d.whatif_term_loan_balance ?? d.term_loan_balance),
      }))
    : [];

  const whatIfDebtLinePath = whatIfDebtPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  const activePoint = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="space-y-3">
      {/* Chart Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 pt-3 pb-1 border-b border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {title}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#5584B4] border border-[#2E5E88]/30">
            {hasWhatIf ? 'DUAL-AXIS COMPARISON' : 'DUAL-AXIS'}
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
          {/* Base Forecast Cash */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#00d4b6] shadow-xs inline-block" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
              {hasWhatIf ? 'Forecast Cash (L)' : 'Bank Balance (Cash) [Left Axis]'}
            </span>
          </div>

          {/* What-If Cash */}
          {hasWhatIf && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#38bdf8] shadow-xs inline-block" />
              <span className="text-sky-600 dark:text-sky-400 font-bold text-[11px]">
                What-If Cash (L)
              </span>
            </div>
          )}

          {/* Base Debt */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#f43f5e] relative inline-flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-[#f43f5e] absolute shadow-xs" />
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold ml-1 text-[11px]">
              {hasWhatIf ? 'Forecast Debt (R)' : 'Interest-Bearing Debt [Right Axis]'}
            </span>
          </div>

          {/* What-If Debt */}
          {hasWhatIf && (
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-[#f59e0b] border-t border-dashed border-[#f59e0b] relative inline-flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b] absolute shadow-xs" />
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-bold ml-1 text-[11px]">
                What-If Debt (R)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[650px] font-mono text-[11px]"
        >
          <defs>
            {/* Emerald Bar Gradient */}
            <linearGradient id="emeraldBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00d4b6" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.75" />
            </linearGradient>

            {/* What-If Cyan/Sky Bar Gradient */}
            <linearGradient id="whatIfCyanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.75" />
            </linearGradient>

            {/* Overdraft Red Gradient */}
            <linearGradient id="roseBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="0.6" />
            </linearGradient>

            {/* What-If Overdraft Purple Gradient */}
            <linearGradient id="purpleBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#9f1239" stopOpacity="0.65" />
            </linearGradient>

            {/* Hover column glow */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Gridlines */}
          {cashTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={margin.left}
                y1={tick.y}
                x2={svgWidth - margin.right}
                y2={tick.y}
                stroke={isDark ? '#1e293b' : '#f1f5f9'}
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            </g>
          ))}

          {/* Zero Cash Baseline */}
          <line
            x1={margin.left}
            y1={zeroCashY}
            x2={svgWidth - margin.right}
            y2={zeroCashY}
            stroke={isDark ? '#475569' : '#cbd5e1'}
            strokeWidth="1.5"
          />

          {/* Left Y-Axis (Bank Balance - Emerald) */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={margin.top + plotHeight}
            stroke="#00d4b6"
            strokeWidth="1.5"
          />
          {cashTicks.map((tick, i) => (
            <text
              key={`left-tick-${i}`}
              x={margin.left - 10}
              y={tick.y + 3.5}
              textAnchor="end"
              fill={tick.value >= 0 ? '#00d4b6' : '#f43f5e'}
              className="text-[10px] font-bold"
            >
              {formatShortNumber(tick.value)}
            </text>
          ))}
          <text
            x={margin.left - 60}
            y={margin.top - 12}
            textAnchor="start"
            fill="#00d4b6"
            className="text-[9px] font-bold uppercase tracking-wider"
          >
            Bank Cash (L)
          </text>

          {/* Right Y-Axis (Interest-Bearing Debt - Rose) */}
          <line
            x1={svgWidth - margin.right}
            y1={margin.top}
            x2={svgWidth - margin.right}
            y2={margin.top + plotHeight}
            stroke="#f43f5e"
            strokeWidth="1.5"
          />
          {debtTicks.map((tick, i) => (
            <text
              key={`right-tick-${i}`}
              x={svgWidth - margin.right + 10}
              y={tick.y + 3.5}
              textAnchor="start"
              fill="#f43f5e"
              className="text-[10px] font-bold"
            >
              {formatShortNumber(tick.value)}
            </text>
          ))}
          <text
            x={svgWidth - margin.right + 8}
            y={margin.top - 12}
            textAnchor="start"
            fill="#f43f5e"
            className="text-[9px] font-bold uppercase tracking-wider"
          >
            IBD Debt (R)
          </text>

          {/* Hover highlight background column */}
          {hoveredIndex !== null && (
            <rect
              x={getX(hoveredIndex) - colWidth}
              y={margin.top}
              width={colWidth * 2}
              height={plotHeight}
              fill={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}
              rx="6"
            />
          )}

          {/* Bars Rendering */}
          {data.map((d, i) => {
            const cx = getX(i);
            const isHovered = hoveredIndex === i;

            if (hasWhatIf) {
              // Paired Bar 1: Base Forecast Cash
              const isBaseNegative = d.bank_balance_closing < 0;
              const baseBarY = isBaseNegative ? zeroCashY : getCashY(d.bank_balance_closing);
              const baseBarHeight = Math.max(3, Math.abs(getCashY(d.bank_balance_closing) - zeroCashY));
              const baseBarX = cx - subBarWidth - 1;

              // Paired Bar 2: What-If Cash
              const wiVal = d.whatif_bank_balance_closing ?? d.bank_balance_closing;
              const isWiNegative = wiVal < 0;
              const wiBarY = isWiNegative ? zeroCashY : getCashY(wiVal);
              const wiBarHeight = Math.max(3, Math.abs(getCashY(wiVal) - zeroCashY));
              const wiBarX = cx + 1;

              return (
                <g
                  key={`paired-bar-${d.id}`}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Forecast Bar */}
                  <rect
                    x={baseBarX}
                    y={baseBarY}
                    width={subBarWidth}
                    height={baseBarHeight}
                    fill={isBaseNegative ? 'url(#roseBarGrad)' : 'url(#emeraldBarGrad)'}
                    rx={Math.min(3, subBarWidth / 3)}
                    className={`transition-all duration-150 ${
                      isHovered ? 'filter drop-shadow(0 0 6px rgba(0,212,182,0.6))' : 'opacity-90'
                    }`}
                  />
                  {/* What-If Bar */}
                  <rect
                    x={wiBarX}
                    y={wiBarY}
                    width={subBarWidth}
                    height={wiBarHeight}
                    fill={isWiNegative ? 'url(#purpleBarGrad)' : 'url(#whatIfCyanGrad)'}
                    rx={Math.min(3, subBarWidth / 3)}
                    className={`transition-all duration-150 ${
                      isHovered ? 'filter drop-shadow(0 0 6px rgba(56,189,248,0.7))' : 'opacity-95'
                    }`}
                  />
                </g>
              );
            }

            // Single Bar (Dynamics mode)
            const isNegative = d.bank_balance_closing < 0;
            const barY = isNegative ? zeroCashY : getCashY(d.bank_balance_closing);
            const barHeight = Math.max(3, Math.abs(getCashY(d.bank_balance_closing) - zeroCashY));

            return (
              <g
                key={`bar-${d.id}`}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <rect
                  x={cx - colWidth / 2}
                  y={barY}
                  width={colWidth}
                  height={barHeight}
                  fill={isNegative ? 'url(#roseBarGrad)' : 'url(#emeraldBarGrad)'}
                  rx={Math.min(4, colWidth / 3)}
                  className={`transition-all duration-150 ${
                    isHovered ? 'filter drop-shadow(0 0 6px rgba(0,212,182,0.6))' : 'opacity-90'
                  }`}
                />
              </g>
            );
          })}

          {/* Base Rose Line (Interest-Bearing Debt) */}
          <path
            d={debtLinePath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="filter drop-shadow(0 1px 3px rgba(244,63,94,0.4))"
          />

          {/* What-If Amber Dashed Line (Interest-Bearing Debt) */}
          {hasWhatIf && whatIfDebtLinePath && (
            <path
              d={whatIfDebtLinePath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.4"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="filter drop-shadow(0 1px 3px rgba(245,158,11,0.4))"
            />
          )}

          {/* Rose Points on Base Debt Line */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getDebtY(d.term_loan_balance);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={`dot-${d.id}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill="#f43f5e"
                  stroke={isDark ? '#0A0D14' : '#ffffff'}
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}

          {/* Amber Points on What-If Debt Line */}
          {hasWhatIf &&
            data.map((d, i) => {
              const cx = getX(i);
              const cy = getDebtY(d.whatif_term_loan_balance ?? d.term_loan_balance);
              const isHovered = hoveredIndex === i;

              return (
                <g
                  key={`widot-${d.id}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5.5 : 3.5}
                    fill="#f59e0b"
                    stroke={isDark ? '#0A0D14' : '#ffffff'}
                    strokeWidth={isHovered ? 2 : 1.5}
                    className="transition-all duration-150"
                  />
                </g>
              );
            })}

          {/* X-Axis Labels */}
          {data.map((d, i) => {
            const cx = getX(i);
            const isHovered = hoveredIndex === i;

            return (
              <text
                key={`x-label-${d.id}`}
                x={cx}
                y={svgHeight - margin.bottom + 22}
                textAnchor="middle"
                fill={
                  isHovered
                    ? isDark
                      ? '#ffffff'
                      : '#0f172a'
                    : d.isTotal
                    ? '#2E5E88'
                    : isDark
                    ? '#94a3b8'
                    : '#64748b'
                }
                className={`text-[10px] font-mono ${
                  d.isTotal || isHovered ? 'font-bold' : 'font-medium'
                }`}
              >
                {d.label}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {activePoint && hoveredIndex !== null && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl border shadow-xl font-mono text-xs z-10 flex flex-wrap items-center gap-4 bg-white/95 dark:bg-[#0E1322]/95 backdrop-blur-md border-[#2E5E88]/40"
          >
            <div className="border-r border-slate-200 dark:border-slate-800 pr-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Period
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {activePoint.label}
              </span>
            </div>

            {/* Cash Comparison */}
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-500 block">
                {hasWhatIf ? 'Forecast Cash' : 'Bank Balance (Cash)'}
              </span>
              <span
                className={`font-bold ${
                  activePoint.bank_balance_closing >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {currencyPrefix ? `${currencyPrefix} ` : ''}
                {activePoint.bank_balance_closing.toLocaleString()}
              </span>
            </div>

            {hasWhatIf && activePoint.whatif_bank_balance_closing !== undefined && (
              <div className="border-l border-slate-200 dark:border-slate-800 pl-3">
                <span className="text-[10px] uppercase font-bold text-sky-500 block">
                  What-If Cash
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-bold ${
                      activePoint.whatif_bank_balance_closing >= 0 ? 'text-sky-500' : 'text-rose-500'
                    }`}
                  >
                    {currencyPrefix ? `${currencyPrefix} ` : ''}
                    {activePoint.whatif_bank_balance_closing.toLocaleString()}
                  </span>
                  {activePoint.whatif_bank_balance_closing !== activePoint.bank_balance_closing && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        activePoint.whatif_bank_balance_closing >= activePoint.bank_balance_closing
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {activePoint.whatif_bank_balance_closing >= activePoint.bank_balance_closing ? '+' : ''}
                      {(
                        activePoint.whatif_bank_balance_closing - activePoint.bank_balance_closing
                      ).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Debt Comparison */}
            <div className="border-l border-slate-200 dark:border-slate-800 pl-3">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">
                {hasWhatIf ? 'Forecast Debt' : 'Interest-Bearing Debt'}
              </span>
              <span className="font-bold text-rose-500">
                {currencyPrefix ? `${currencyPrefix} ` : ''}
                {Math.abs(activePoint.term_loan_balance).toLocaleString()}
              </span>
            </div>

            {hasWhatIf && activePoint.whatif_term_loan_balance !== undefined && (
              <div className="border-l border-slate-200 dark:border-slate-800 pl-3">
                <span className="text-[10px] uppercase font-bold text-amber-500 block">
                  What-If Debt
                </span>
                <span className="font-bold text-amber-500">
                  {currencyPrefix ? `${currencyPrefix} ` : ''}
                  {Math.abs(activePoint.whatif_term_loan_balance).toLocaleString()}
                </span>
              </div>
            )}

            {/* Net Position (Cash - Debt) */}
            <div className="border-l border-slate-200 dark:border-slate-800 pl-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {hasWhatIf ? 'What-If Net Position' : 'Net Position (Cash - IBD)'}
              </span>
              {hasWhatIf && activePoint.whatif_bank_balance_closing !== undefined ? (
                <span
                  className={`font-bold ${
                    activePoint.whatif_bank_balance_closing -
                      Math.abs(activePoint.whatif_term_loan_balance ?? activePoint.term_loan_balance) >=
                    0
                      ? 'text-sky-500'
                      : 'text-rose-500'
                  }`}
                >
                  {currencyPrefix ? `${currencyPrefix} ` : ''}
                  {(
                    activePoint.whatif_bank_balance_closing -
                    Math.abs(activePoint.whatif_term_loan_balance ?? activePoint.term_loan_balance)
                  ).toLocaleString()}
                </span>
              ) : (
                <span
                  className={`font-bold ${
                    activePoint.bank_balance_closing - Math.abs(activePoint.term_loan_balance) >= 0
                      ? 'text-emerald-500'
                      : 'text-rose-500'
                  }`}
                >
                  {currencyPrefix ? `${currencyPrefix} ` : ''}
                  {(
                    activePoint.bank_balance_closing - Math.abs(activePoint.term_loan_balance)
                  ).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

