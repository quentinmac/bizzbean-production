import React, { useState } from 'react';

export interface LiquidityDataPoint {
  id: string;
  label: string;
  bank_balance_closing: number;
  term_loan_balance: number;
  isTotal?: boolean;
}

interface LiquidityVsDebtChartProps {
  data: LiquidityDataPoint[];
  isDark: boolean;
  currencyPrefix?: string;
  title?: string;
}

export const LiquidityVsDebtChart: React.FC<LiquidityVsDebtChartProps> = ({
  data,
  isDark,
  currencyPrefix = 'R',
  title = 'LIQUIDITY VS DEBT DUAL-AXIS TRAJECTORY',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        No projection data available for the selected period.
      </div>
    );
  }

  // Chart dimensions
  const svgWidth = 920;
  const svgHeight = 340;
  const margin = { top: 30, right: 85, bottom: 45, left: 85 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // Left Y-Axis: Bank Balance (Cash) - Can be negative (overdraft) or positive
  const rawCashMin = Math.min(...data.map((d) => d.bank_balance_closing));
  const rawCashMax = Math.max(...data.map((d) => d.bank_balance_closing));
  const cashMin = rawCashMin < 0 ? Math.floor(rawCashMin * 1.15) : 0;
  const cashMax = Math.max(10000, Math.ceil(rawCashMax * 1.15));
  const cashRange = cashMax - cashMin || 1;

  // Right Y-Axis: Interest-Bearing Debt (IBD) - Always >= 0
  const rawDebtMax = Math.max(...data.map((d) => Math.abs(d.term_loan_balance)));
  const debtMin = 0;
  const debtMax = Math.max(10000, Math.ceil(rawDebtMax * 1.2));
  const debtRange = debtMax - debtMin || 1;

  // Coordinates mapping
  const getX = (index: number) => {
    if (data.length === 1) return margin.left + plotWidth / 2;
    return margin.left + (index / (data.length - 1)) * plotWidth;
  };

  const getCashY = (val: number) => {
    const clamped = Math.max(cashMin, Math.min(cashMax, val));
    const ratio = (clamped - cashMin) / cashRange;
    return margin.top + plotHeight - ratio * plotHeight;
  };

  const getDebtY = (val: number) => {
    const clamped = Math.max(0, Math.min(debtMax, Math.abs(val)));
    const ratio = (clamped - debtMin) / debtRange;
    return margin.top + plotHeight - ratio * plotHeight;
  };

  const zeroCashY = getCashY(0);

  // Column / Bar Width
  const colWidth = Math.min(48, Math.max(16, (plotWidth / data.length) * 0.55));

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
    if (abs >= 1_000_000) return `${sign}${currencyPrefix}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}${currencyPrefix}${(abs / 1_000).toFixed(0)}k`;
    return `${sign}${currencyPrefix}${abs}`;
  };

  // Build SVG path for Debt line
  const debtPoints = data.map((d, i) => ({
    x: getX(i),
    y: getDebtY(d.term_loan_balance),
  }));

  const debtLinePath = debtPoints
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
            DUAL-AXIS
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3 rounded-xs bg-[#00d4b6] shadow-xs inline-block" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              Bank Balance (Cash) <span className="text-emerald-500 font-bold">[Left Axis]</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#f43f5e] relative inline-flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-[#f43f5e] absolute shadow-xs" />
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold ml-1">
              Interest-Bearing Debt (IBD) <span className="text-rose-400 font-bold">[Right Axis]</span>
            </span>
          </div>
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

            {/* Overdraft Red Gradient */}
            <linearGradient id="roseBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="0.6" />
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

          {/* Emerald Bars (Bank Balance) */}
          {data.map((d, i) => {
            const cx = getX(i);
            const isNegative = d.bank_balance_closing < 0;
            const barY = isNegative ? zeroCashY : getCashY(d.bank_balance_closing);
            const barHeight = Math.max(3, Math.abs(getCashY(d.bank_balance_closing) - zeroCashY));
            const isHovered = hoveredIndex === i;

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

          {/* Rose Line (Interest-Bearing Debt) */}
          <path
            d={debtLinePath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="filter drop-shadow(0 1px 3px rgba(244,63,94,0.4))"
          />

          {/* Rose Points on Debt Line */}
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
                  r={isHovered ? 6.5 : 4.5}
                  fill="#f43f5e"
                  stroke={isDark ? '#0A0D14' : '#ffffff'}
                  strokeWidth={isHovered ? 2.5 : 2}
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
            className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl border shadow-lg font-mono text-xs z-10 flex items-center gap-4 bg-white/95 dark:bg-[#0E1322]/95 backdrop-blur-md border-[#2E5E88]/40"
          >
            <div className="border-r border-slate-200 dark:border-slate-800 pr-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Period
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {activePoint.label}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-500 block">
                Bank Balance (Cash)
              </span>
              <span
                className={`font-bold ${
                  activePoint.bank_balance_closing >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {currencyPrefix} {activePoint.bank_balance_closing.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 block">
                Interest-Bearing Debt
              </span>
              <span className="font-bold text-rose-500">
                {currencyPrefix} {Math.abs(activePoint.term_loan_balance).toLocaleString()}
              </span>
            </div>

            <div className="border-l border-slate-200 dark:border-slate-800 pl-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Net Position (Cash - IBD)
              </span>
              <span
                className={`font-bold ${
                  activePoint.bank_balance_closing - Math.abs(activePoint.term_loan_balance) >= 0
                    ? 'text-emerald-500'
                    : 'text-rose-500'
                }`}
              >
                {currencyPrefix}{' '}
                {(
                  activePoint.bank_balance_closing - Math.abs(activePoint.term_loan_balance)
                ).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
