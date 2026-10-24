import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

export interface ReportTabItem {
  id: string;
  number: number;
  label: string;
  shortLabel: string;
}

export const REPORT_SEQUENCE: ReportTabItem[] = [
  { id: 'liquidity-funding', number: 1, label: '1. LIQUIDITY VS DEBT', shortLabel: 'liquidity vs debt' },
  { id: 'summary', number: 2, label: '2. EXECUTIVE SUMMARY', shortLabel: 'executive summary' },
  { id: 'trading-account', number: 3, label: '3. TRADING ACCOUNT', shortLabel: 'trading account' },
  { id: 'trading-distribution', number: 4, label: '4. TRADING ACCOUNT DISTRIBUTION', shortLabel: 'trading account distribution' },
  { id: 'income-statement', number: 5, label: '5. INCOME STATEMENT', shortLabel: 'income statement' },
  { id: 'balance-sheet', number: 6, label: '6. BALANCE SHEET', shortLabel: 'balance sheet' },
  { id: 'cash-flow', number: 7, label: '7. CASH FLOW', shortLabel: 'cash flow' },
];

interface ReportsCarouselProps {
  theme?: 'light' | 'dark';
  activeReportTab: string;
  onSelectReportTab: (tabId: any) => void;
  reportHorizonYear: number | 'summary';
  onSelectHorizonYear: (year: number | 'summary') => void;
}

export const ReportsCarousel: React.FC<ReportsCarouselProps> = ({
  theme = 'light',
  activeReportTab,
  onSelectReportTab,
  reportHorizonYear,
  onSelectHorizonYear,
}) => {
  const isDark = theme === 'dark';
  const trackRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll boundary to enable/disable arrow buttons & gradient masks
  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = trackRef.current;
    if (!el) return;

    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  // Center active tab into view when it changes
  useEffect(() => {
    if (activeTabRef.current && trackRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
    // Re-evaluate scroll boundaries
    setTimeout(checkScroll, 300);
  }, [activeReportTab, checkScroll]);

  const handleScrollLeft = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const foundIndex = REPORT_SEQUENCE.findIndex((t) => t.id === activeReportTab);
  const currentIndex = foundIndex !== -1 ? foundIndex : 0;
  const currentItem = REPORT_SEQUENCE[currentIndex] || REPORT_SEQUENCE[0];

  const handlePrevReport = () => {
    if (currentIndex > 0) {
      onSelectReportTab(REPORT_SEQUENCE[currentIndex - 1].id);
    }
  };

  const handleNextReport = () => {
    if (currentIndex < REPORT_SEQUENCE.length - 1) {
      onSelectReportTab(REPORT_SEQUENCE[currentIndex + 1].id);
    }
  };

  return (
    <div className="space-y-3 font-mono">
      {/* 1. Carousel Header: Report tabs inside scrollable track with controls */}
      <div
        className={`relative rounded-2xl border p-2 sm:p-2.5 transition-all shadow-xs ${
          isDark
            ? 'bg-[#101626] border-[#222F4C]'
            : 'bg-white border-[#D8CEBC]'
        }`}
      >
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handleScrollLeft}
            disabled={!canScrollLeft}
            aria-label="Scroll left to view preceding reports"
            className={`p-1.5 sm:p-2 rounded-xl border transition-all shrink-0 ${
              canScrollLeft
                ? isDark
                  ? 'bg-[#1C2642] text-white border-[#33446E] hover:bg-[#253359] shadow-xs active:scale-95'
                  : 'bg-slate-100 text-slate-800 border-[#D8CEBC] hover:bg-slate-200 shadow-xs active:scale-95'
                : 'opacity-30 cursor-not-allowed border-transparent text-slate-400'
            }`}
          >
            <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Carousel Scroll Track Container */}
          <div className="relative flex-1 overflow-hidden min-w-0">
            {/* Left Edge Gradient Fade */}
            {canScrollLeft && (
              <div
                className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 transition-opacity bg-gradient-to-r ${
                  isDark ? 'from-[#101626]' : 'from-white'
                } to-transparent`}
              />
            )}

            {/* Scrollable Track */}
            <div
              ref={trackRef}
              onScroll={checkScroll}
              tabIndex={0}
              role="region"
              aria-label="Financial reports carousel"
              className="flex items-center gap-2 overflow-x-auto scroll-smooth py-1 px-1 scrollbar-none select-none focus:outline-hidden"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {REPORT_SEQUENCE.map((tab) => {
                const isSelected = activeReportTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    ref={isSelected ? activeTabRef : null}
                    type="button"
                    onClick={() => onSelectReportTab(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border uppercase tracking-wider flex items-center gap-2 ${
                      isSelected
                        ? isDark
                          ? 'bg-[#356593] text-white border-[#5584B4] shadow-sm ring-1 ring-[#5584B4]/50'
                          : 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-sm ring-1 ring-[#2E5E88]/40'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-300 hover:text-white border-[#252E4A] hover:border-[#384873] hover:bg-[#1A233D]'
                        : 'bg-[#FAF8F5] text-slate-700 hover:text-slate-900 border-[#E2D9CB] hover:border-[#2E5E88]/50 hover:bg-slate-50'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Edge Gradient Fade */}
            {canScrollRight && (
              <div
                className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 transition-opacity bg-gradient-to-l ${
                  isDark ? 'from-[#101626]' : 'from-white'
                } to-transparent`}
              />
            )}
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleScrollRight}
            disabled={!canScrollRight}
            aria-label="Scroll right to view subsequent reports"
            className={`p-1.5 sm:p-2 rounded-xl border transition-all shrink-0 ${
              canScrollRight
                ? isDark
                  ? 'bg-[#1C2642] text-white border-[#33446E] hover:bg-[#253359] shadow-xs active:scale-95'
                  : 'bg-slate-100 text-slate-800 border-[#D8CEBC] hover:bg-slate-200 shadow-xs active:scale-95'
                : 'opacity-30 cursor-not-allowed border-transparent text-slate-400'
            }`}
          >
            <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>

      {/* 2. Secondary Row: Year Period Filter (Y1–Y5, 5-Year Summary) + Sequential Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        {/* Year Filter: Y1, Y2, Y3, Y4, Y5, 5-Year Summary */}
        <div className="flex items-center p-0.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1322] text-xs shadow-2xs">
          {[1, 2, 3, 4, 5].map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => onSelectHorizonYear(yr)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                reportHorizonYear === yr
                  ? isDark
                    ? 'bg-[#356593] text-white shadow-xs'
                    : 'bg-[#2E5E88] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Y{yr}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onSelectHorizonYear('summary')}
            className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all ${
              reportHorizonYear === 'summary'
                ? isDark
                  ? 'bg-[#356593] text-white shadow-xs'
                  : 'bg-[#2E5E88] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            5-Year Summary
          </button>
        </div>

        {/* Carousel Progress & Next/Prev Shortcuts */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <LayoutGrid className="w-3.5 h-3.5 text-[#2E5E88] dark:text-[#5584B4]" />
            <span>
              report {currentItem.number} of {REPORT_SEQUENCE.length}:
            </span>
            <span className="text-[#2E5E88] dark:text-[#5584B4] font-bold uppercase">
              {currentItem.shortLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-300 dark:border-slate-700 pl-2">
            <button
              type="button"
              onClick={handlePrevReport}
              disabled={currentIndex === 0}
              title="Previous report"
              className={`p-1 rounded-lg border transition-all ${
                currentIndex > 0
                  ? 'bg-white dark:bg-[#101626] border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'opacity-30 cursor-not-allowed border-transparent text-slate-400'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextReport}
              disabled={currentIndex === REPORT_SEQUENCE.length - 1}
              title="Next report"
              className={`p-1 rounded-lg border transition-all ${
                currentIndex < REPORT_SEQUENCE.length - 1
                  ? 'bg-white dark:bg-[#101626] border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'opacity-30 cursor-not-allowed border-transparent text-slate-400'
              }`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
