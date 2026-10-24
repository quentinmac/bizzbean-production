import React, { useState, useMemo } from 'react';
import { Calendar, Briefcase, Coffee, AlertCircle, ChevronRight, Info } from 'lucide-react';

export interface DaysWorkedMonthData {
  monthIndex: number; // 1 to 60
  yearIndex: number;  // 1 to 5
  monthInYear: number; // 1 to 12
  monthLabel: string;  // e.g. "feb '26"
  monthShort: string;  // e.g. "feb"
  year: number;
  month: number;
  daysInMonth: number;
  workingDaysCount: number;
  holidaysOnWorkingDays: number;
  holidaysInMonthTotal: number;
  netDaysWorked: number;
}

interface DaysWorkedChartProps {
  theme?: 'light' | 'dark';
  monthlyCalendar: DaysWorkedMonthData[];
  businessName?: string;
  startDate?: string;
  workingDays?: Record<string, boolean>;
  deductHolidays?: boolean;
}

export const DaysWorkedChart: React.FC<DaysWorkedChartProps> = ({
  theme = 'light',
  monthlyCalendar,
  businessName = 'bizzbean learning enterprise',
  startDate = '2026-02',
  workingDays = {},
  deductHolidays = true,
}) => {
  const isDark = theme === 'dark';

  // Year filter: 1 to 5, or 'all'
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(1);
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

  // Sliced data based on selected year
  const filteredMonths = useMemo(() => {
    if (selectedYear === 'all') {
      return monthlyCalendar;
    }
    const startIdx = (selectedYear - 1) * 12;
    return monthlyCalendar.slice(startIdx, startIdx + 12);
  }, [monthlyCalendar, selectedYear]);

  // Aggregate metrics for selected horizon
  const totalCalendarDays = useMemo(
    () => filteredMonths.reduce((sum, m) => sum + m.daysInMonth, 0),
    [filteredMonths]
  );
  const totalDaysWorked = useMemo(
    () => filteredMonths.reduce((sum, m) => sum + m.netDaysWorked, 0),
    [filteredMonths]
  );
  const totalHolidaysDeducted = useMemo(
    () => filteredMonths.reduce((sum, m) => sum + m.holidaysOnWorkingDays, 0),
    [filteredMonths]
  );
  const totalDaysNotWorked = totalCalendarDays - totalDaysWorked;
  const avgDaysWorkedPerMonth =
    filteredMonths.length > 0 ? (totalDaysWorked / filteredMonths.length).toFixed(1) : '0.0';

  // Work percentage of total calendar days
  const workRatioPct =
    totalCalendarDays > 0 ? ((totalDaysWorked / totalCalendarDays) * 100).toFixed(1) : '0';

  // Max scale for bar chart height (31 calendar days max per month)
  const maxDayScale = 31;

  // Active working days label
  const activeWorkingDaysList = Object.entries(workingDays)
    .filter(([, active]) => active)
    .map(([day]) => day.slice(0, 3))
    .join(', ');

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 space-y-4 font-mono ${
        isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
      }`}
    >
      {/* 1. Header with Title & Year Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-[#D97757]" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white lowercase">
              operating rhythm — days worked monthly chart
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D97757]/15 text-[#D97757] border border-[#D97757]/30 font-bold lowercase">
              bizzcalc engine
            </span>
          </div>
          <p className="text-[11px] text-slate-500 lowercase mt-0.5 font-sans">
            net productive days worked per month after deducting scheduled non-working days & observed public holidays
          </p>
        </div>

        {/* Filter by Years Tabs */}
        <div className="flex items-center p-0.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F1C] text-xs">
          {[1, 2, 3, 4, 5].map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => setSelectedYear(yr)}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all lowercase ${
                selectedYear === yr
                  ? 'bg-[#2E5E88] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              year {yr}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedYear('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all lowercase ${
              selectedYear === 'all'
                ? 'bg-[#2E5E88] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            all 5 years (60m)
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Metric Cards (BizzCalc Standard) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div
          className={`p-3 rounded-xl border ${
            isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
          }`}
        >
          <div className="text-[10px] text-slate-500 lowercase">total days worked</div>
          <div className="text-base sm:text-lg font-bold text-[#D97757] mt-0.5">
            {totalDaysWorked} <span className="text-xs font-normal text-slate-400">days</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 lowercase font-sans">
            {workRatioPct}% of period
          </div>
        </div>

        <div
          className={`p-3 rounded-xl border ${
            isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
          }`}
        >
          <div className="text-[10px] text-slate-500 lowercase">monthly average</div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {avgDaysWorkedPerMonth} <span className="text-xs font-normal text-slate-400">days/mo</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 lowercase font-sans">
            working rhythm baseline
          </div>
        </div>

        <div
          className={`p-3 rounded-xl border ${
            isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
          }`}
        >
          <div className="text-[10px] text-slate-500 lowercase">holidays deducted</div>
          <div className="text-base sm:text-lg font-bold text-amber-500 mt-0.5">
            {totalHolidaysDeducted} <span className="text-xs font-normal text-slate-400">days</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 lowercase font-sans">
            {deductHolidays ? 'statutory deduction on' : 'holidays ignored'}
          </div>
        </div>

        <div
          className={`p-3 rounded-xl border ${
            isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
          }`}
        >
          <div className="text-[10px] text-slate-500 lowercase">calendar & off days</div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {totalDaysNotWorked} <span className="text-xs font-normal text-slate-400">off / {totalCalendarDays} cal</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 lowercase font-sans">
            {activeWorkingDaysList || 'mon-fri'} roster
          </div>
        </div>
      </div>

      {/* 3. Bar Chart Viewport (BizzCalc Terracotta Aesthetics with 270deg Rotated Numbers) */}
      <div className="pt-2">
        <div className="text-center text-xs font-normal text-slate-500 lowercase mb-1">
          {businessName} — {selectedYear === 'all' ? '5-year monthly days worked (m1 – m60)' : `year ${selectedYear} monthly days worked`}
        </div>

        <div className="h-48 sm:h-56 flex items-end justify-between gap-1 pt-6 px-1 relative">
          {/* Reference Guideline for Average Working Month (~21.5 days) */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-[#D97757]/40 pointer-events-none z-0 flex items-center justify-end pr-1"
            style={{
              bottom: `${Math.round((21.5 / maxDayScale) * 65) + 26}px`,
            }}
          >
            <span className="text-[8px] font-mono text-[#D97757] bg-white/80 dark:bg-[#0E1322]/80 px-1 rounded">
              avg ~21.5 days
            </span>
          </div>

          {filteredMonths.map((m) => {
            // Height calculation relative to max 31 days
            const heightPct = Math.min(68, Math.max(6, Math.round((m.netDaysWorked / maxDayScale) * 65)));
            const isHovered = hoveredMonthIndex === m.monthIndex;
            const daysOff = m.daysInMonth - m.netDaysWorked;

            return (
              <div
                key={m.monthIndex}
                onMouseEnter={() => setHoveredMonthIndex(m.monthIndex)}
                onMouseLeave={() => setHoveredMonthIndex(null)}
                className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group relative cursor-pointer z-10"
              >
                {/* Value displayed vertically rotated (270deg) matching BizzCalc */}
                <div className="h-8 w-full flex items-center justify-center shrink-0 mb-1">
                  <span
                    className={`text-[8px] sm:text-[9px] font-mono select-none whitespace-nowrap leading-none inline-block origin-center transform transition-colors ${
                      isHovered
                        ? 'text-slate-900 dark:text-white font-bold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                    style={{ transform: 'rotate(270deg)' }}
                  >
                    {m.netDaysWorked}
                  </span>
                </div>

                {/* Vertical Bar styled with authentic BizzCalc Terracotta / Coral */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[20px] rounded-t transition-all duration-150 shrink-0 ${
                    isHovered
                      ? 'bg-[#E2886A] shadow-md ring-1 ring-[#D97757] scale-y-105 origin-bottom'
                      : 'bg-[#D97757] hover:brightness-110'
                  }`}
                />

                {/* Bottom Month Label */}
                <span
                  className={`text-[9px] sm:text-[10px] font-medium lowercase mt-1.5 shrink-0 select-none truncate ${
                    isHovered ? 'text-[#D97757] font-bold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {selectedYear === 'all'
                    ? m.monthIndex % 4 === 0
                      ? `m${m.monthIndex}`
                      : ''
                    : m.monthShort}
                </span>

                {/* Interactive Tooltip on Hover */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none whitespace-nowrap">
                    <div className="px-3 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-mono shadow-xl border border-slate-700 space-y-1 text-center">
                      <div className="font-bold text-[#E2886A] uppercase">
                        {m.monthLabel} (Month {m.monthIndex})
                      </div>
                      <div className="text-xs font-bold text-white">
                        {m.netDaysWorked} days worked
                      </div>
                      <div className="text-[9px] text-slate-300 font-sans space-y-0.5 text-left pt-0.5 border-t border-slate-700">
                        <div>• Calendar days: {m.daysInMonth}</div>
                        <div>• Scheduled working: {m.workingDaysCount}</div>
                        <div>• Holidays deducted: {m.holidaysOnWorkingDays}</div>
                        <div>• Weekend/Off days: {daysOff}</div>
                      </div>
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

export default DaysWorkedChart;
