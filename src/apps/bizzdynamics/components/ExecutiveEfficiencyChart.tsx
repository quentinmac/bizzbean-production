import React, { useState } from 'react';

export interface EfficiencyChartDataPoint {
  year: number;
  label: string;
  ros: number;        // Return on Sales (%)
  roa: number;        // Return on Net Operating Assets (%)
  assetTurn: number;  // Asset Turn (x)
}

interface ExecutiveEfficiencyChartProps {
  data: EfficiencyChartDataPoint[];
  isDark?: boolean;
  title?: string;
}

export const ExecutiveEfficiencyChart: React.FC<ExecutiveEfficiencyChartProps> = ({
  data,
  isDark = false,
  title = 'EFFICIENCY TRAJECTORY: RETURN ON SALES & ROA VS ASSET TURN',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        No efficiency data available.
      </div>
    );
  }

  // Chart Dimensions
  const svgWidth = 860;
  const svgHeight = 320;
  const margin = { top: 30, right: 75, bottom: 40, left: 75 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // Left Y-Axis: ROS (%) and ROA (%)
  const pctValues = data.flatMap((d) => [d.ros, d.roa]);
  const rawPctMin = Math.min(0, ...pctValues);
  const rawPctMax = Math.max(10, ...pctValues);
  // Add 15% padding
  const pctMin = rawPctMin < 0 ? Math.floor(rawPctMin * 1.15) : 0;
  const pctMax = Math.ceil(rawPctMax * 1.15) || 10;
  const pctRange = pctMax - pctMin || 1;

  // Right Y-Axis: Asset Turn (x)
  const turnValues = data.map((d) => d.assetTurn);
  const rawTurnMin = Math.min(0, ...turnValues);
  const rawTurnMax = Math.max(1, ...turnValues);
  const turnMin = 0;
  const turnMax = Math.max(1, Number((rawTurnMax * 1.25).toFixed(1)));
  const turnRange = turnMax - turnMin || 1;

  // Coordinate Helpers
  const getX = (index: number) => {
    if (data.length === 1) return margin.left + plotWidth / 2;
    return margin.left + (index / (data.length - 1)) * plotWidth;
  };

  const getPctY = (val: number) => {
    const clamped = Math.max(pctMin, Math.min(pctMax, val));
    const ratio = (clamped - pctMin) / pctRange;
    return margin.top + plotHeight - ratio * plotHeight;
  };

  const getTurnY = (val: number) => {
    const clamped = Math.max(turnMin, Math.min(turnMax, val));
    const ratio = (clamped - turnMin) / turnRange;
    return margin.top + plotHeight - ratio * plotHeight;
  };

  // Axis Ticks
  const tickCount = 4;
  const pctTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const val = pctMin + (i / tickCount) * pctRange;
    return {
      value: Number(val.toFixed(1)),
      y: margin.top + plotHeight - (i / tickCount) * plotHeight,
    };
  });

  const turnTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const val = turnMin + (i / tickCount) * turnRange;
    return {
      value: Number(val.toFixed(2)),
      y: margin.top + plotHeight - (i / tickCount) * plotHeight,
    };
  });

  // SVG Paths for Lines
  const rosPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getPctY(d.ros)}`)
    .join(' ');

  const roaPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getPctY(d.roa)}`)
    .join(' ');

  const turnPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getTurnY(d.assetTurn)}`)
    .join(' ');

  // Colors
  const rosColor = '#38BDF8';      // Sky Blue (ROS)
  const roaColor = '#10B981';      // Emerald (ROA)
  const turnColor = '#F59E0B';     // Amber (Asset Turn)

  return (
    <div
      className={`rounded-2xl border overflow-hidden font-mono ${
        isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
      }`}
    >
      {/* 1. Header with title & badges */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2">
        <div>
          <span className="font-bold uppercase text-xs tracking-wide text-slate-900 dark:text-white block">
            {title}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Dual-Axis Trajectory: ROS &amp; ROA (Left Axis %) vs. Asset Turn (Right Axis x)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: rosColor }} />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Return on Sales (ROS %)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md" style={{ backgroundColor: roaColor }} />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Return on Assets (ROA %)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: turnColor }} />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Asset Turn (turns x)</span>
          </div>
        </div>
      </div>

      {/* 2. SVG Chart Area */}
      <div className="p-2 sm:p-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[620px] select-none"
        >
          {/* Horizontal Grid lines */}
          {pctTicks.map((tick, i) => (
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
              {/* Left Y-Axis Tick Label (Percentage) */}
              <text
                x={margin.left - 10}
                y={tick.y + 4}
                textAnchor="end"
                className={`text-[10px] font-mono ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}
              >
                {tick.value.toFixed(1)}%
              </text>
            </g>
          ))}

          {/* Right Y-Axis Tick Labels (Asset Turn x) */}
          {turnTicks.map((tick, i) => (
            <text
              key={i}
              x={margin.left + plotWidth + 10}
              y={tick.y + 4}
              textAnchor="start"
              className={`text-[10px] font-mono ${isDark ? 'fill-amber-400' : 'fill-amber-600'}`}
            >
              {tick.value.toFixed(2)}x
            </text>
          ))}

          {/* Zero baseline for % if applicable */}
          {pctMin < 0 && (
            <line
              x1={margin.left}
              y1={getPctY(0)}
              x2={margin.left + plotWidth}
              y2={getPctY(0)}
              stroke={isDark ? '#475569' : '#94A3B8'}
              strokeWidth={1.5}
            />
          )}

          {/* Asset Turn Line (Dashed Orange Line) */}
          <path
            d={turnPath}
            fill="none"
            stroke={turnColor}
            strokeWidth={3}
            strokeDasharray="6 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Return on Assets (ROA) Line (Emerald) */}
          <path
            d={roaPath}
            fill="none"
            stroke={roaColor}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Return on Sales (ROS) Line (Sky Blue) */}
          <path
            d={rosPath}
            fill="none"
            stroke={rosColor}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points & Hover Targets */}
          {data.map((d, i) => {
            const x = getX(i);
            const rosY = getPctY(d.ros);
            const roaY = getPctY(d.roa);
            const turnY = getTurnY(d.assetTurn);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Vertical hover crosshair */}
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

                {/* Asset Turn Diamond Dot */}
                <rect
                  x={x - 4}
                  y={turnY - 4}
                  width={8}
                  height={8}
                  transform={`rotate(45 ${x} ${turnY})`}
                  fill={turnColor}
                  stroke={isDark ? '#101626' : '#FFFFFF'}
                  strokeWidth={2}
                />

                {/* ROA Square Dot */}
                <rect
                  x={x - 4.5}
                  y={roaY - 4.5}
                  width={9}
                  height={9}
                  rx={2}
                  fill={roaColor}
                  stroke={isDark ? '#101626' : '#FFFFFF'}
                  strokeWidth={2}
                />

                {/* ROS Circle Dot */}
                <circle
                  cx={x}
                  cy={rosY}
                  r={5}
                  fill={rosColor}
                  stroke={isDark ? '#101626' : '#FFFFFF'}
                  strokeWidth={2}
                />

                {/* Bottom X-Axis Label */}
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

      {/* 3. Metric Footer Cards with Hover Insights */}
      <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 text-xs text-center bg-slate-50/50 dark:bg-[#0E1322]">
        {/* ROS */}
        <div className="p-3">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
            {hoveredIndex !== null ? `${data[hoveredIndex].label} ROS` : 'Latest (Y5) ROS'}
          </span>
          <span className="text-sm font-bold text-[#38BDF8] block mt-0.5">
            {hoveredIndex !== null
              ? `${data[hoveredIndex].ros.toFixed(2)}%`
              : `${data[data.length - 1]?.ros.toFixed(2)}%`}
          </span>
          <span className="text-[10px] text-slate-400">Net Operating Profit / Revenue</span>
        </div>

        {/* ROA */}
        <div className="p-3">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
            {hoveredIndex !== null ? `${data[hoveredIndex].label} ROA` : 'Latest (Y5) ROA'}
          </span>
          <span className="text-sm font-bold text-emerald-500 block mt-0.5">
            {hoveredIndex !== null
              ? `${data[hoveredIndex].roa.toFixed(2)}%`
              : `${data[data.length - 1]?.roa.toFixed(2)}%`}
          </span>
          <span className="text-[10px] text-slate-400">Net Operating Profit / NOA</span>
        </div>

        {/* Asset Turn */}
        <div className="p-3">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
            {hoveredIndex !== null ? `${data[hoveredIndex].label} Asset Turn` : 'Latest (Y5) Asset Turn'}
          </span>
          <span className="text-sm font-bold text-amber-500 block mt-0.5">
            {hoveredIndex !== null
              ? `${data[hoveredIndex].assetTurn.toFixed(2)}x`
              : `${data[data.length - 1]?.assetTurn.toFixed(2)}x`}
          </span>
          <span className="text-[10px] text-slate-400">Revenue / Net Operating Assets</span>
        </div>
      </div>
    </div>
  );
};
