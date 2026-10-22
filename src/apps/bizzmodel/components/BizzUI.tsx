import React from 'react';

// Styling & Container Utilities matching V1 BizzUI standard
export const BizzTableContainerClass = 'divide-y divide-slate-100 dark:divide-slate-800/60';

export const BizzTableClass = 'w-full text-left text-xs font-mono overflow-x-auto';

export const BizzTableHeaderClass =
  'grid grid-cols-[minmax(200px,2fr)_repeat(5,minmax(85px,1fr))] items-center px-4 py-2.5 border-b border-bizz-blue/10 bg-slate-50 dark:bg-[#0E1322] text-[11px] font-bold text-slate-600 dark:text-slate-400';

export const BizzTableHeaderCellClass =
  'text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400';

export const BizzTableRowClass =
  'grid grid-cols-[minmax(200px,2fr)_repeat(5,minmax(85px,1fr))] items-center px-4 py-2.5 text-xs transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 border-b border-slate-100/50 dark:border-slate-800/40';

export const BizzTableCellClass =
  'text-xs truncate text-slate-700 dark:text-slate-300';

interface BizzReportSectionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'blue' | 'rose';
  isDark?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const BizzReportSection: React.FC<BizzReportSectionProps> = ({
  title,
  subtitle,
  badge,
  badgeColor = 'blue',
  isDark = false,
  className = '',
  children,
}) => {
  const badgeClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    blue: 'bg-[#5584B4]/20 text-[#5584B4] border-[#5584B4]/40',
    rose: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  }[badgeColor];

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-colors ${
        isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
      } ${className}`}
    >
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2 text-xs">
        <div>
          <span className="font-bold uppercase text-slate-900 dark:text-white block tracking-wide">
            {title}
          </span>
          {subtitle && (
            <span className="text-slate-400 text-[11px] block mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
        {badge && (
          <span
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badgeClasses}`}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
};
