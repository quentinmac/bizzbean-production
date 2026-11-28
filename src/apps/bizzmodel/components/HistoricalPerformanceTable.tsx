import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  History,
  Upload,
  Download,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import {
  HistoricalPerformanceData,
  HistoricalPerformanceYear,
  createDefaultHistoricalPerformanceData,
} from '../constants';

interface HistoricalPerformanceTableProps {
  data?: HistoricalPerformanceData;
  forecastStartYear?: number;
  theme?: 'light' | 'dark';
  onChange: (next: HistoricalPerformanceData) => void;
  contextLabel?: string;
}

type NumericFieldKey = Exclude<keyof HistoricalPerformanceYear, 'id' | 'yearLabel'>;

interface RowSpec {
  key?: NumericFieldKey;
  label: string;
  kind: 'input' | 'calc' | 'percent' | 'ratio';
  compute?: (y: HistoricalPerformanceYear) => number;
  highlight?: boolean;
  section?: 'income' | 'balance' | 'cashflow';
}

export function computeHistoricalYearMetrics(y: HistoricalPerformanceYear) {
  const grossProfit = (y.revenue || 0) - (y.costOfSales || 0);
  const grossMarginPct = y.revenue > 0 ? (grossProfit / y.revenue) * 100 : 0;
  const ebitda = grossProfit - (y.operatingExpenses || 0);
  const ebit = ebitda - (y.depreciationAndAmortisation || 0);
  const operatingMarginPct = y.revenue > 0 ? (ebit / y.revenue) * 100 : 0;
  const netProfit = ebit - (y.interestAndFinance || 0) - (y.taxation || 0);
  const netMarginPct = y.revenue > 0 ? (netProfit / y.revenue) * 100 : 0;

  const totalAssets = (y.fixedAssets || 0) + (y.currentAssets || 0) + (y.cashAndBank || 0);
  const totalLiabilities = (y.longTermDebt || 0) + (y.currentLiabilities || 0);
  const totalEquityAndLiabilities = (y.equity || 0) + totalLiabilities;
  const debtToEquity = y.equity > 0 ? totalLiabilities / y.equity : 0;

  const netCashMovement =
    (y.operatingCashFlow || 0) + (y.investingCashFlow || 0) + (y.financingCashFlow || 0);

  return {
    grossProfit,
    grossMarginPct,
    ebitda,
    ebit,
    operatingMarginPct,
    netProfit,
    netMarginPct,
    totalAssets,
    totalLiabilities,
    totalEquityAndLiabilities,
    debtToEquity,
    netCashMovement,
  };
}

export function getActiveHistoricalYears(
  data?: HistoricalPerformanceData,
  forecastStartYear: number = 2026
): HistoricalPerformanceYear[] {
  const base = data && Array.isArray(data.years) && data.years.length >= 3
    ? data
    : createDefaultHistoricalPerformanceData(forecastStartYear, 3);
  const count = base.yearsCount || 3;
  // Take the most recent `count` years in chronological order (e.g. last 3, 4, or 5)
  const sliceStart = Math.max(0, base.years.length - count);
  return base.years.slice(sliceStart);
}

const INCOME_ROWS: RowSpec[] = [
  { key: 'revenue', label: 'revenue / turnover', kind: 'input' },
  { key: 'costOfSales', label: 'cost of sales', kind: 'input' },
  {
    label: 'gross profit',
    kind: 'calc',
    highlight: true,
    compute: (y) => computeHistoricalYearMetrics(y).grossProfit,
  },
  {
    label: 'gross profit margin %',
    kind: 'percent',
    compute: (y) => computeHistoricalYearMetrics(y).grossMarginPct,
  },
  { key: 'operatingExpenses', label: 'operating expenses (excl. d&a)', kind: 'input' },
  {
    label: 'ebitda',
    kind: 'calc',
    highlight: true,
    compute: (y) => computeHistoricalYearMetrics(y).ebitda,
  },
  { key: 'depreciationAndAmortisation', label: 'depreciation & amortisation', kind: 'input' },
  {
    label: 'operating profit (ebit)',
    kind: 'calc',
    highlight: true,
    compute: (y) => computeHistoricalYearMetrics(y).ebit,
  },
  { key: 'interestAndFinance', label: 'net interest & finance costs', kind: 'input' },
  { key: 'taxation', label: 'corporate taxation', kind: 'input' },
  {
    label: 'net profit after tax',
    kind: 'calc',
    highlight: true,
    compute: (y) => computeHistoricalYearMetrics(y).netProfit,
  },
  {
    label: 'net profit margin %',
    kind: 'percent',
    compute: (y) => computeHistoricalYearMetrics(y).netMarginPct,
  },
];

const BALANCE_ROWS: RowSpec[] = [
  { key: 'fixedAssets', label: 'fixed & non-current assets', kind: 'input' },
  { key: 'currentAssets', label: 'current assets (excl. cash)', kind: 'input' },
  { key: 'cashAndBank', label: 'cash & bank balances', kind: 'input' },
  {
    label: 'total assets',
    kind: 'calc',
    highlight: true,
    compute: (y) => computeHistoricalYearMetrics(y).totalAssets,
  },
  { key: 'equity', label: 'total shareholders equity', kind: 'input' },
  { key: 'longTermDebt', label: 'long-term debt & term loans', kind: 'input' },
  { key: 'currentLiabilities', label: 'current liabilities', kind: 'input' },
  {
    label: 'total equity & liabilities',
    kind: 'calc',
    highlight: true,
    compute: (y) => computeHistoricalYearMetrics(y).totalEquityAndLiabilities,
  },
  {
    label: 'debt / equity ratio (x)',
    kind: 'ratio',
    compute: (y) => computeHistoricalYearMetrics(y).debtToEquity,
  },
];

const CASHFLOW_ROWS: RowSpec[] = [
  { key: 'operatingCashFlow', label: 'operating cash flow', kind: 'input' },
  { key: 'investingCashFlow', label: 'investing cash flow (capex)', kind: 'input' },
  { key: 'financingCashFlow', label: 'financing cash flow', kind: 'input' },
  {
    label: 'net cash movement',
    kind: 'calc',
    highlight: true,
    compute: (y) => computeHistoricalYearMetrics(y).netCashMovement,
  },
  { key: 'closingCashBalance', label: 'closing cash balance', kind: 'input' },
];

const IMPORT_ROW_MAP: Array<{ match: RegExp; field: NumericFieldKey }> = [
  { match: /^revenue|turnover|sales/i, field: 'revenue' },
  { match: /cost of sales|cogs|direct cost/i, field: 'costOfSales' },
  { match: /operating exp|opex|overheads/i, field: 'operatingExpenses' },
  { match: /depreciation|amortis|d&a/i, field: 'depreciationAndAmortisation' },
  { match: /interest|finance cost/i, field: 'interestAndFinance' },
  { match: /taxation|income tax|corporate tax/i, field: 'taxation' },
  { match: /fixed|non-current asset|ppe/i, field: 'fixedAssets' },
  { match: /current asset/i, field: 'currentAssets' },
  { match: /cash\s*&?\s*bank|cash balance/i, field: 'cashAndBank' },
  { match: /shareholders?\s*equity|^equity$/i, field: 'equity' },
  { match: /long-?term debt|term loan/i, field: 'longTermDebt' },
  { match: /current liabilit/i, field: 'currentLiabilities' },
  { match: /operating cash/i, field: 'operatingCashFlow' },
  { match: /investing cash|capex/i, field: 'investingCashFlow' },
  { match: /financing cash/i, field: 'financingCashFlow' },
  { match: /closing cash/i, field: 'closingCashBalance' },
];

export const HistoricalPerformanceTable: React.FC<HistoricalPerformanceTableProps> = ({
  data,
  forecastStartYear = 2026,
  theme = 'light',
  onChange,
  contextLabel = 'Synced automatically to Business Plan Page 2 & Page 6',
}) => {
  const isDark = theme === 'dark';
  const [isExpanded, setIsExpanded] = useState(true);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalized: HistoricalPerformanceData = useMemo(() => {
    if (data && Array.isArray(data.years) && data.years.length === 5) {
      return data;
    }
    const base = createDefaultHistoricalPerformanceData(forecastStartYear, data?.yearsCount || 3);
    if (data && Array.isArray(data.years) && data.years.length > 0) {
      const merged = [...base.years];
      const offset = Math.max(0, 5 - data.years.length);
      data.years.slice(0, 5).forEach((yr, idx) => {
        merged[offset + idx] = { ...merged[offset + idx], ...yr };
      });
      return { ...base, ...data, years: merged };
    }
    return base;
  }, [data, forecastStartYear]);

  const activeCount = normalized.yearsCount || 3;
  const startIndex = 5 - activeCount;
  const visibleYears = normalized.years.slice(startIndex);

  const updateYearsCount = (count: 3 | 4 | 5) => {
    onChange({ ...normalized, yearsCount: count });
  };

  const updateYearField = (visibleIdx: number, field: NumericFieldKey, rawVal: string) => {
    const absIdx = startIndex + visibleIdx;
    const parsed = rawVal.trim() === '' || rawVal === '-' ? 0 : Number(rawVal);
    const safeVal = Number.isFinite(parsed) ? parsed : 0;
    const nextYears = normalized.years.map((yr, i) =>
      i === absIdx ? { ...yr, [field]: safeVal } : yr
    );
    onChange({ ...normalized, years: nextYears });
  };

  const updateYearLabel = (visibleIdx: number, label: string) => {
    const absIdx = startIndex + visibleIdx;
    const nextYears = normalized.years.map((yr, i) =>
      i === absIdx ? { ...yr, yearLabel: label.slice(0, 20) } : yr
    );
    onChange({ ...normalized, years: nextYears });
  };

  const handleReset = () => {
    onChange(createDefaultHistoricalPerformanceData(forecastStartYear, activeCount));
    setImportNotice('Historical performance table reset to zero.');
    setImportError(null);
    setTimeout(() => setImportNotice(null), 3000);
  };

  const handleDownloadTemplate = () => {
    const headers = ['Line Item', ...visibleYears.map((y) => y.yearLabel)];
    const rows: Array<Array<string | number>> = [
      headers,
      ['--- HI-LEVEL INCOME STATEMENT ---', ...visibleYears.map(() => '')],
      ...INCOME_ROWS.filter((r) => r.kind === 'input' && r.key).map((r) => [
        r.label,
        ...visibleYears.map((y) => y[r.key!]),
      ]),
      ['--- HI-LEVEL BALANCE SHEET ---', ...visibleYears.map(() => '')],
      ...BALANCE_ROWS.filter((r) => r.kind === 'input' && r.key).map((r) => [
        r.label,
        ...visibleYears.map((y) => y[r.key!]),
      ]),
      ['--- HI-LEVEL CASH FLOW STATEMENT ---', ...visibleYears.map(() => '')],
      ...CASHFLOW_ROWS.filter((r) => r.kind === 'input' && r.key).map((r) => [
        r.label,
        ...visibleYears.map((y) => y[r.key!]),
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historical Performance');
    XLSX.writeFile(wb, 'bizzforecasta_historical_performance_template.xlsx');
  };

  const handleImportSpreadsheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportNotice(null);

    try {
      const arrayBuf = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuf, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const grid: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

      if (!grid || grid.length < 2) {
        setImportError('Spreadsheet appears empty. Download the template to see the expected layout.');
        return;
      }

      // Detect header row containing year columns
      const headerRow = grid[0] || [];
      const detectedHeaders = headerRow
        .slice(1)
        .map((c) => String(c || '').trim())
        .filter(Boolean);
      const importCount = Math.min(5, Math.max(3, detectedHeaders.length || activeCount)) as 3 | 4 | 5;
      const targetStart = 5 - importCount;
      const nextYears = normalized.years.map((y) => ({ ...y }));

      for (let col = 0; col < importCount; col++) {
        if (detectedHeaders[col]) {
          nextYears[targetStart + col].yearLabel = detectedHeaders[col].slice(0, 20);
        }
      }

      let matchedRows = 0;
      for (let r = 1; r < grid.length; r++) {
        const label = String(grid[r]?.[0] || '').trim();
        if (!label) continue;
        const matcher = IMPORT_ROW_MAP.find((m) => m.match.test(label));
        if (!matcher) continue;
        matchedRows += 1;
        for (let col = 0; col < importCount; col++) {
          const rawCell = grid[r]?.[col + 1];
          const cleaned =
            typeof rawCell === 'number'
              ? rawCell
              : Number(String(rawCell || '').replace(/[^0-9.-]/g, ''));
          if (Number.isFinite(cleaned)) {
            nextYears[targetStart + col][matcher.field] = cleaned;
          }
        }
      }

      if (matchedRows === 0) {
        setImportError(
          'No matching Income Statement, Balance Sheet, or Cash Flow rows were detected. Use the template for guaranteed mapping.'
        );
        return;
      }

      onChange({
        ...normalized,
        yearsCount: importCount,
        years: nextYears,
      });
      setImportNotice(`Imported ${matchedRows} financial line items from "${file.name}".`);
      setTimeout(() => setImportNotice(null), 5000);
    } catch (err: any) {
      setImportError(err?.message || 'Failed to parse spreadsheet file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatNum = (val: number) =>
    new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 }).format(Math.round(val || 0));

  const renderSectionTable = (title: string, rows: RowSpec[]) => (
    <div className="space-y-1.5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#2E5E88] dark:text-[#7FAADC] px-1">
        {title}
      </div>
      <div
        className={`overflow-x-auto rounded-xl border ${
          isDark ? 'border-[#222F4C]' : 'border-[#D8CEBC]'
        }`}
      >
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr
              className={`border-b ${
                isDark
                  ? 'bg-[#141A2E] border-[#222F4C] text-slate-300'
                  : 'bg-[#F4EFE6] border-[#D8CEBC] text-slate-600'
              }`}
            >
              <th className="py-2 px-3 text-left font-bold lowercase min-w-[210px]">
                line item
              </th>
              {visibleYears.map((yr, idx) => (
                <th key={yr.id} className="py-1.5 px-2 text-right min-w-[120px]">
                  <input
                    type="text"
                    value={yr.yearLabel}
                    onChange={(e) => updateYearLabel(idx, e.target.value)}
                    aria-label={`Historical year ${idx + 1} label`}
                    className={`w-full text-right px-2 py-1 rounded-lg border text-[11px] font-bold uppercase focus:outline-none ${
                      isDark
                        ? 'bg-[#0E1322] border-[#252E4A] text-white focus:border-[#5584B4]'
                        : 'bg-white border-[#D8CEBC] text-[#2E5E88] focus:border-[#2E5E88]'
                    }`}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
            {rows.map((row) => (
              <tr
                key={row.label}
                className={
                  row.highlight
                    ? isDark
                      ? 'bg-[#161E35] font-bold'
                      : 'bg-[#FAF8F5] font-bold'
                    : isDark
                    ? 'bg-[#101626]'
                    : 'bg-white'
                }
              >
                <td
                  className={`py-2 px-3 text-left lowercase ${
                    row.highlight
                      ? 'text-slate-900 dark:text-white font-bold'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {row.label}
                </td>
                {visibleYears.map((yr, idx) => {
                  if (row.kind === 'input' && row.key) {
                    const currentVal = yr[row.key];
                    return (
                      <td key={yr.id} className="py-1.5 px-2 text-right">
                        <input
                          type="number"
                          step="any"
                          value={currentVal === 0 ? '' : currentVal}
                          placeholder="0"
                          onChange={(e) => updateYearField(idx, row.key!, e.target.value)}
                          className={`w-full text-right px-2.5 py-1 rounded-lg border text-xs tabular-nums focus:outline-none ${
                            isDark
                              ? 'bg-[#0A0F1D] border-[#252E4A] text-white placeholder:text-slate-600 focus:border-[#5584B4]'
                              : 'bg-[#FCFBF9] border-[#D8CEBC] text-slate-900 placeholder:text-slate-300 focus:border-[#2E5E88]'
                          }`}
                        />
                      </td>
                    );
                  }

                  const computedVal = row.compute ? row.compute(yr) : 0;
                  const formatted =
                    row.kind === 'percent'
                      ? `${computedVal.toFixed(1)}%`
                      : row.kind === 'ratio'
                      ? `${computedVal.toFixed(2)}x`
                      : formatNum(computedVal);

                  return (
                    <td
                      key={yr.id}
                      className={`py-2 px-3 text-right tabular-nums ${
                        computedVal < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : row.highlight
                          ? 'text-[#2E5E88] dark:text-[#7FAADC]'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {formatted}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div
      className={`rounded-2xl border overflow-hidden shadow-xs font-mono ${
        isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
      }`}
    >
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-3 cursor-pointer ${
          isDark ? 'bg-[#141A2E] border-[#222F4C]' : 'bg-[#F4EFE6]/80 border-[#D8CEBC]'
        }`}
      >
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <History className="w-4 h-4 text-[#2E5E88] dark:text-[#7FAADC]" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white">
              HISTORICAL PERFORMANCE (3–5 YEARS)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold lowercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              {contextLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter 3 to 5 years of hi-level Income Statement, Balance Sheet, and Cash Flow figures to populate Section 2 (Proven Traction) and Section 6 (Financial Projections & Unit Economics).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-5">
          {/* Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Years Count Switcher */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold lowercase text-slate-500 dark:text-slate-400 mr-1">
                historical window:
              </span>
              {([3, 4, 5] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => updateYearsCount(cnt)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold lowercase border transition-all cursor-pointer ${
                    activeCount === cnt
                      ? 'bg-[#2E5E88] text-white border-[#2E5E88]'
                      : isDark
                      ? 'bg-[#0E1322] border-[#252E4A] text-slate-400 hover:text-white'
                      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cnt} years
                </button>
              ))}
            </div>

            {/* Import / Export / Reset */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportSpreadsheet}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E5E88] hover:bg-[#244c70] text-white text-[11px] font-bold lowercase transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>import excel / csv</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold lowercase transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#141A2E] border-[#252E4A] text-slate-200 hover:border-[#5584B4]'
                    : 'bg-white border-[#D8CEBC] text-[#2E5E88] hover:border-[#2E5E88]'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>template (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-[11px] font-bold lowercase transition-colors cursor-pointer"
                title="Clear all historical figures"
              >
                <RotateCcw className="w-3 h-3" />
                <span>clear</span>
              </button>
            </div>
          </div>

          {importNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{importNotice}</span>
            </div>
          )}

          {importError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {/* 3 Hi-Level Historical Tables */}
          <div className="space-y-6">
            {renderSectionTable('1. hi-level income statement (historical)', INCOME_ROWS)}
            {renderSectionTable('2. hi-level balance sheet (historical)', BALANCE_ROWS)}
            {renderSectionTable('3. hi-level cash flow statement (historical)', CASHFLOW_ROWS)}
          </div>

          {/* Optional Footnote / Audit Readiness Note */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#2E5E88]" />
              <span>historical accounts basis / audit notes (optional)</span>
            </label>
            <input
              type="text"
              value={normalized.notes || ''}
              onChange={(e) => onChange({ ...normalized, notes: e.target.value })}
              placeholder="e.g. Extracted from signed Annual Financial Statements (IFRS for SMEs), FY2023–FY2025 audited..."
              className={`w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none ${
                isDark
                  ? 'bg-[#0E1322] border-[#252E4A] text-white placeholder:text-slate-600 focus:border-[#5584B4]'
                  : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#2E5E88]'
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalPerformanceTable;
