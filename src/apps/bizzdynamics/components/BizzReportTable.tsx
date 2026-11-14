import React from 'react';

export interface BizzReportTableRow {
  id?: string;
  label: string;
  highlight?: boolean;
  indent?: boolean;
  isSectionHeader?: boolean;
  values?: (number | string | null | undefined)[];
  formatValue?: (val: any, yearIndex: number) => string;
}

interface BizzReportTableProps {
  title: string;
  firstColumnLabel?: string;
  years?: number[];
  columns?: string[];
  rows: BizzReportTableRow[];
  isDark?: boolean;
  className?: string;
  extraHeaderContent?: React.ReactNode;
}

export const formatReportNumber = (val: any): string => {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'string') return val;
  if (isNaN(val) || Math.abs(val) < 0.0001) return '0';
  return Math.round(val).toLocaleString();
};

export const formatReportPercent = (val: any): string => {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'string') return val;
  if (isNaN(val) || Math.abs(val) < 0.00001) return '0.00%';
  return `${Number(val).toFixed(2)}%`;
};

export const BizzReportTable: React.FC<BizzReportTableProps> = ({
  title,
  firstColumnLabel = 'account line',
  years = [1, 2, 3, 4, 5],
  columns,
  rows,
  isDark = false,
  className = '',
  extraHeaderContent,
}) => {
  const effectiveColumns = columns && columns.length > 0 ? columns : years.map((y) => `year ${y}`);

  return (
    <div className={`space-y-0 font-mono ${className}`}>
      {/* 1. V1 Dark Navy Banner Header */}
      <div className="rounded-t-xl bg-[#162238] dark:bg-[#0D1525] text-white px-5 py-3 text-sm font-bold lowercase tracking-wide flex items-center justify-between border-t border-x border-[#2E5E88]/40 dark:border-[#223354]">
        <span>{title}</span>
        {extraHeaderContent && <div>{extraHeaderContent}</div>}
      </div>

      {/* 2. Structured Grid Table Container */}
      <div className="overflow-x-auto rounded-b-xl border border-[#2E5E88]/30 dark:border-[#223354] bg-white dark:bg-[#101626] shadow-xs">
        <table className="w-full text-left text-xs font-mono border-collapse min-w-[650px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#121A2E] border-b border-[#2E5E88]/30 dark:border-[#223354]">
              <th className="p-2.5 pl-4 border-r border-[#2E5E88]/30 dark:border-[#223354] text-[#2E5E88] dark:text-[#60A5FA] font-bold lowercase w-1/3 min-w-[220px]">
                {firstColumnLabel}
              </th>
              {effectiveColumns.map((colLabel, idx) => (
                <th
                  key={idx}
                  className={`p-2.5 px-3 text-right border-r border-[#2E5E88]/30 dark:border-[#223354] text-[#2E5E88] dark:text-[#60A5FA] font-bold lowercase whitespace-nowrap min-w-[75px] ${
                    idx === effectiveColumns.length - 1 ? 'border-r-0' : ''
                  }`}
                >
                  {colLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E5E88]/20 dark:divide-[#223354]/60">
            {rows.map((row, rIdx) => {
              // Section Header Row (e.g., "financed by")
              if (row.isSectionHeader) {
                return (
                  <tr
                    key={rIdx}
                    className="bg-slate-50/70 dark:bg-[#121A2E]/70 border-b border-[#2E5E88]/30 dark:border-[#223354]"
                  >
                    <td
                      colSpan={effectiveColumns.length + 1}
                      className="p-2.5 pl-4 text-[#2E5E88] dark:text-[#60A5FA] font-bold lowercase text-xs"
                    >
                      {row.label}
                    </td>
                  </tr>
                );
              }

              const isHighlight = !!row.highlight;
              const isIndent = !!row.indent;

              return (
                <tr
                  key={rIdx}
                  className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40 ${
                    isHighlight
                      ? 'bg-[#2E5E88]/5 dark:bg-[#2E5E88]/15 font-bold'
                      : ''
                  }`}
                >
                  {/* Account / Line Title */}
                  <td
                    className={`p-2 border-r border-[#2E5E88]/25 dark:border-[#223354] lowercase ${
                      isIndent ? 'pl-8 text-slate-600 dark:text-slate-400' : 'pl-4'
                    } ${
                      isHighlight
                        ? 'text-[#2E5E88] dark:text-[#60A5FA] font-bold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {row.label}
                  </td>

                  {/* Period Values */}
                  {effectiveColumns.map((_, colIdx) => {
                    const rawVal = row.values ? row.values[colIdx] : undefined;
                    const displayVal = row.formatValue
                      ? row.formatValue(rawVal, colIdx)
                      : formatReportNumber(rawVal);

                    return (
                      <td
                        key={colIdx}
                        className={`p-2 px-3 text-right border-r border-[#2E5E88]/25 dark:border-[#223354] tabular-nums whitespace-nowrap ${
                          colIdx === effectiveColumns.length - 1 ? 'border-r-0' : ''
                        } ${
                          isHighlight
                            ? 'text-[#2E5E88] dark:text-[#60A5FA] font-bold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
