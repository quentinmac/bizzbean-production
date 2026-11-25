import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { RotateCcw, BarChart3, Table2, Info } from 'lucide-react';
import {
  ExecSummary6ColRow,
  ExecSummary6ColStatements,
} from '../budgetEngine';

interface ExecutiveSummary6ColPanelProps {
  scopeTitle: string;
  scopeSubtitle: string;
  canEditAdjustments: boolean;
  statements: ExecSummary6ColStatements;
  onUpdateAdjustment: (rowId: string, value: number) => void;
  onResetAdjustments: () => void;
  theme?: 'light' | 'dark';
}

const fmtCurrency = (val: number): string => {
  if (!Number.isFinite(val)) return '0';
  const rounded = Math.round(val);
  const abs = Math.abs(rounded).toLocaleString('en-ZA');
  return rounded < 0 ? `-${abs}` : abs;
};

const fmtCompactR = (val: number): string => {
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}R${(abs / 1_000_000).toFixed(1)}m`;
  if (abs >= 1_000) return `${sign}R${Math.round(abs / 1_000)}k`;
  return `${sign}R${Math.round(abs)}`;
};

const fmtPct = (val: number | null): string => {
  if (val === null || !Number.isFinite(val)) return 'n/a';
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
};

export const ExecutiveSummary6ColPanel: React.FC<ExecutiveSummary6ColPanelProps> = ({
  scopeTitle,
  scopeSubtitle,
  canEditAdjustments,
  statements,
  onUpdateAdjustment,
  onResetAdjustments,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [viewMode, setViewMode] = useState<'both' | 'tables' | 'charts'>('both');
  const [activeStatementFilter, setActiveStatementFilter] = useState<
    'all' | 'trading' | 'income' | 'balance-sheet' | 'cash-flow'
  >('all');

  const m = statements.summaryMetrics;

  // Charts built directly from the 6-column Executive Summary values (Col 3 Adjusted Forecast vs Col 4 Budget)
  const tradingChartData = useMemo(
    () => [
      { metric: 'Revenue', adjustedForecast: m.adjRevenue, budget: m.budRevenue },
      { metric: 'Gross Profit', adjustedForecast: m.adjGrossProfit, budget: m.budGrossProfit },
      { metric: 'Total Income', adjustedForecast: m.adjTotalIncome, budget: m.budTotalIncome },
      { metric: 'Total Expenses', adjustedForecast: m.adjTotalExpenses, budget: m.budTotalExpenses },
      { metric: 'Net Op Profit', adjustedForecast: m.adjNop, budget: m.budNop },
      { metric: 'Taxed Profits', adjustedForecast: m.adjTaxedProfits, budget: m.budTaxedProfits },
    ],
    [m]
  );

  const balanceSheetChartData = useMemo(
    () => [
      { metric: 'Fixed Assets', adjustedForecast: m.adjFixedAssets, budget: m.budFixedAssets },
      { metric: 'Inv. (3-2-1-29)', adjustedForecast: m.adjInvestment32129, budget: m.budInvestment32129 },
      { metric: 'Current Assets', adjustedForecast: m.adjCurrentAssets, budget: m.budCurrentAssets },
      { metric: 'Total Assets', adjustedForecast: m.adjTotalAssets, budget: m.budTotalAssets },
      { metric: 'Net Op Assets', adjustedForecast: m.adjNoa, budget: m.budNoa },
      { metric: 'SH Equity', adjustedForecast: m.adjShEquity, budget: m.budShEquity },
      { metric: 'Net IBD', adjustedForecast: m.adjIbd, budget: m.budIbd },
    ],
    [m]
  );

  const cashFlowChartData = useMemo(
    () => [
      { metric: 'Ops Cash', adjustedForecast: m.adjCashOps, budget: m.budCashOps },
      { metric: 'Working Cap', adjustedForecast: m.adjCashWc, budget: m.budCashWc },
      { metric: 'Capex / Assets', adjustedForecast: m.adjCashCapex, budget: m.budCashCapex },
      { metric: 'Funding', adjustedForecast: m.adjCashFunding, budget: m.budCashFunding },
      { metric: 'Net Cashflow', adjustedForecast: m.adjNetCashflow, budget: m.budNetCashflow },
      { metric: 'Closing Bank', adjustedForecast: m.adjClosingBank, budget: m.budClosingBank },
    ],
    [m]
  );

  const ratiosData = useMemo(() => {
    const safePct = (num: number, den: number) =>
      Math.abs(den) > 0.5 ? Number(((num / Math.abs(den)) * 100).toFixed(1)) : 0;
    const safeTurn = (num: number, den: number) =>
      Math.abs(den) > 0.5 ? Number((num / Math.abs(den)).toFixed(2)) : 0;

    return [
      {
        label: 'gross profit margin %',
        adj: `${safePct(m.adjGrossProfit, m.adjRevenue)}%`,
        bud: `${safePct(m.budGrossProfit, m.budRevenue)}%`,
        diff: `${(safePct(m.budGrossProfit, m.budRevenue) - safePct(m.adjGrossProfit, m.adjRevenue)).toFixed(1)} pp`,
      },
      {
        label: 'return on sales (ros %)',
        adj: `${safePct(m.adjNop, m.adjRevenue)}%`,
        bud: `${safePct(m.budNop, m.budRevenue)}%`,
        diff: `${(safePct(m.budNop, m.budRevenue) - safePct(m.adjNop, m.adjRevenue)).toFixed(1)} pp`,
      },
      {
        label: 'asset turn (x)',
        adj: `${safeTurn(m.adjRevenue, m.adjNoa)}x`,
        bud: `${safeTurn(m.budRevenue, m.budNoa)}x`,
        diff: `${(safeTurn(m.budRevenue, m.budNoa) - safeTurn(m.adjRevenue, m.adjNoa)).toFixed(2)}x`,
      },
      {
        label: 'return on noa (ronoa %)',
        adj: `${safePct(m.adjNop, m.adjNoa)}%`,
        bud: `${safePct(m.budNop, m.budNoa)}%`,
        diff: `${(safePct(m.budNop, m.budNoa) - safePct(m.adjNop, m.adjNoa)).toFixed(1)} pp`,
      },
    ];
  }, [m]);

  const cardBg = isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]';
  const gridStroke = isDark ? '#1E293B' : '#E5DEC9';
  const tickFill = isDark ? '#94A3B8' : '#475569';

  const render6ColTable = (title: string, badge: string, rows: ExecSummary6ColRow[]) => (
    <div className={`rounded-2xl border overflow-hidden shadow-xs ${cardBg}`}>
      <div
        className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${
          isDark ? 'bg-[#151D33] border-[#222F4C]' : 'bg-[#F4EFE6]/90 border-[#D8CEBC]'
        }`}
      >
        <div className="flex items-center gap-2">
          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            {title}
          </h4>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#7EB2E2] uppercase">
            {badge}
          </span>
        </div>
        <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
          Col 3 = Col 1 + Col 2 · Col 5 = Col 4 − Col 3
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr
              className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                isDark ? 'bg-[#0D1322] border-[#222F4C] text-slate-400' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-500'
              }`}
            >
              <th className="py-2.5 px-3 text-left min-w-[210px]">line item</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">1. current ye forecast</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">2. adjustments (+/-)</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">3. adjusted ye forecast</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">4. budget year end</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">5. variance (4 − 3)</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">6. variance %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-[#1E293B]">
            {rows.map((row) => {
              if (row.isSectionHeader) {
                return (
                  <tr
                    key={row.id}
                    className={isDark ? 'bg-[#141C30]' : 'bg-[#F4EFE6]/60'}
                  >
                    <td
                      colSpan={7}
                      className="py-2 px-3 text-[10.5px] font-bold uppercase tracking-widest text-[#2E5E88] dark:text-[#7EB2E2]"
                    >
                      {row.label}
                    </td>
                  </tr>
                );
              }

              const isPosVar = row.col5Variance > 0;
              const isNegVar = row.col5Variance < 0;

              return (
                <tr
                  key={row.id}
                  className={
                    row.highlight
                      ? isDark
                        ? 'bg-[#162038]/80 font-bold text-white'
                        : 'bg-[#F4EFE6]/70 font-bold text-slate-900'
                      : isDark
                      ? 'hover:bg-[#141D32]/60 text-slate-200'
                      : 'hover:bg-[#FAF8F5] text-slate-700'
                  }
                >
                  <td className={`py-2 px-3 whitespace-nowrap ${row.indent ? 'pl-7 text-slate-500 dark:text-slate-400' : ''}`}>
                    <span>{row.label}</span>
                    {row.coaCode && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#5584B4]/15 text-[#2E5E88] dark:text-[#7EB2E2]">
                        {row.coaCode}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap">
                    {fmtCurrency(row.col1Forecast)}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums whitespace-nowrap">
                    {row.editable && canEditAdjustments ? (
                      <input
                        type="number"
                        value={row.col2Adjustment === 0 ? '' : row.col2Adjustment}
                        placeholder="0"
                        onChange={(e) => {
                          const parsed = e.target.value === '' ? 0 : Number(e.target.value);
                          onUpdateAdjustment(row.id, Number.isFinite(parsed) ? parsed : 0);
                        }}
                        className={`w-24 px-2 py-1 text-right text-xs rounded border outline-none tabular-nums ${
                          row.col2Adjustment !== 0
                            ? isDark
                              ? 'bg-sky-950/60 border-sky-500/60 text-sky-200 font-bold'
                              : 'bg-sky-50 border-sky-400 text-sky-900 font-bold'
                            : isDark
                            ? 'bg-[#0A0F1D] border-[#252E4A] text-slate-300'
                            : 'bg-white border-[#D8CEBC] text-slate-700'
                        }`}
                      />
                    ) : (
                      <span className={row.col2Adjustment !== 0 ? 'text-[#00A3E0] font-bold' : 'text-slate-400'}>
                        {fmtCurrency(row.col2Adjustment)}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap font-semibold">
                    {fmtCurrency(row.col3Adjusted)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap font-semibold text-[#2E5E88] dark:text-[#7EB2E2]">
                    {fmtCurrency(row.col4Budget)}
                  </td>
                  <td
                    className={`py-2 px-3 text-right tabular-nums whitespace-nowrap font-semibold ${
                      isPosVar
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isNegVar
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {isPosVar ? `+${fmtCurrency(row.col5Variance)}` : fmtCurrency(row.col5Variance)}
                  </td>
                  <td
                    className={`py-2 px-3 text-right tabular-nums whitespace-nowrap font-bold ${
                      isPosVar
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isNegVar
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {fmtPct(row.col6VariancePct)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 font-mono">
      {/* Header & Controls */}
      <div className={`rounded-2xl border p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${cardBg}`}>
        <div>
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#5584B4] dark:text-[#7EB2E2]">
            Executive Summary · 6-Column Forecast vs. Budget Analysis
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {scopeTitle}
          </h3>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400">{scopeSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className={`inline-flex p-1 rounded-xl border ${isDark ? 'bg-[#0B1020] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
            {[
              { id: 'both', label: 'charts + tables', icon: BarChart3 },
              { id: 'tables', label: '6-col tables', icon: Table2 },
              { id: 'charts', label: 'charts only', icon: BarChart3 },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setViewMode(item.id as any)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold lowercase transition-colors cursor-pointer ${
                  viewMode === item.id
                    ? 'bg-[#2E5E88] text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {canEditAdjustments && (
            <button
              type="button"
              onClick={onResetAdjustments}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer lowercase ${
                isDark
                  ? 'bg-[#141A2E] border-[#252E4A] text-slate-300 hover:border-rose-400 hover:text-rose-300'
                  : 'bg-white border-[#D8CEBC] text-slate-600 hover:border-rose-400 hover:text-rose-600'
              }`}
              title="Clear all Column 2 forecast adjustments for this branch"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>reset adjustments</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Banner when viewing consolidated Region/Group adjustments */}
      {!canEditAdjustments && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs flex items-center gap-2 ${
            isDark
              ? 'bg-[#111B33] border-[#2B3E66] text-sky-200'
              : 'bg-sky-50 border-sky-200 text-sky-900'
          }`}
        >
          <Info className="w-4 h-4 shrink-0 text-[#00A3E0]" />
          <span>
            Column 2 adjustments shown here are the consolidated sum of each constituent branch&apos;s adjustments. Switch consolidation scope to <strong>Branch Level</strong> to edit adjustments on an individual branch.
          </span>
        </div>
      )}

      {/* Key Ratios Strip derived from 6-Column Executive Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ratiosData.map((r) => (
          <div key={r.label} className={`rounded-xl border p-3.5 ${cardBg}`}>
            <div className="text-[10.5px] font-bold uppercase text-slate-500 dark:text-slate-400">
              {r.label}
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <div>
                <div className="text-[10px] text-slate-400">adj. forecast</div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  {r.adj}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#5584B4]">budget ye</div>
                <div className="text-base font-bold text-[#2E5E88] dark:text-[#7EB2E2] tabular-nums">
                  {r.bud}
                </div>
              </div>
            </div>
            <div className="mt-1 pt-1 border-t border-slate-200/60 dark:border-[#1E293B] text-[10.5px] text-slate-500 flex justify-between">
              <span>variance</span>
              <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">{r.diff}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Executive Summary Charts (Driven directly by Col 3 Adjusted Forecast vs Col 4 Budget) */}
      {(viewMode === 'both' || viewMode === 'charts') && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Chart 1: Trading & Profitability */}
          <div className={`rounded-2xl border p-4 ${cardBg}`}>
            <div className="mb-3">
              <div className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                1. Trading &amp; Profitability
              </div>
              <div className="text-[10.5px] text-slate-500">
                Adjusted YE Forecast (Col 3) vs Budget YE (Col 4)
              </div>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tradingChartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="metric" tick={{ fontSize: 10, fill: tickFill }} interval={0} angle={-18} textAnchor="end" height={46} />
                  <YAxis tickFormatter={fmtCompactR} tick={{ fontSize: 10, fill: tickFill }} width={58} />
                  <Tooltip
                    formatter={(value: any) => [`R ${fmtCurrency(Number(value))}`, '']}
                    contentStyle={{
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#D8CEBC',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <ReferenceLine y={0} stroke={tickFill} strokeOpacity={0.4} />
                  <Bar dataKey="adjustedForecast" name="Adj. YE Forecast" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="budget" name="Budget Year-End" fill="#2E5E88" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Balance Sheet & Investment (3-2-1-29) */}
          <div className={`rounded-2xl border p-4 ${cardBg}`}>
            <div className="mb-3">
              <div className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                2. Balance Sheet &amp; Capital
              </div>
              <div className="text-[10.5px] text-slate-500">
                Assets (incl. 3-2-1-29), NOA, Equity &amp; IBD
              </div>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={balanceSheetChartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="metric" tick={{ fontSize: 10, fill: tickFill }} interval={0} angle={-18} textAnchor="end" height={46} />
                  <YAxis tickFormatter={fmtCompactR} tick={{ fontSize: 10, fill: tickFill }} width={58} />
                  <Tooltip
                    formatter={(value: any) => [`R ${fmtCurrency(Number(value))}`, '']}
                    contentStyle={{
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#D8CEBC',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <ReferenceLine y={0} stroke={tickFill} strokeOpacity={0.4} />
                  <Bar dataKey="adjustedForecast" name="Adj. YE Forecast" fill="#C59B63" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="budget" name="Budget Year-End" fill="#5584B4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Cash Flow & Liquidity */}
          <div className={`rounded-2xl border p-4 ${cardBg}`}>
            <div className="mb-3">
              <div className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                3. Cash Flow &amp; Closing Bank
              </div>
              <div className="text-[10.5px] text-slate-500">
                Adjusted YE Forecast vs Budget Cash Movement
              </div>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowChartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="metric" tick={{ fontSize: 10, fill: tickFill }} interval={0} angle={-18} textAnchor="end" height={46} />
                  <YAxis tickFormatter={fmtCompactR} tick={{ fontSize: 10, fill: tickFill }} width={58} />
                  <Tooltip
                    formatter={(value: any) => [`R ${fmtCurrency(Number(value))}`, '']}
                    contentStyle={{
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#D8CEBC',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <ReferenceLine y={0} stroke={tickFill} strokeOpacity={0.4} />
                  <Bar dataKey="adjustedForecast" name="Adj. YE Forecast" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="budget" name="Budget Year-End" fill="#9FC754" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Statement Filter Pills for the 6-Column Tables */}
      {(viewMode === 'both' || viewMode === 'tables') && (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'all 4 statements' },
              { id: 'trading', label: '1. trading account' },
              { id: 'income', label: '2. income statement' },
              { id: 'balance-sheet', label: '3. balance sheet' },
              { id: 'cash-flow', label: '4. cash flow' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStatementFilter(st.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer lowercase ${
                  activeStatementFilter === st.id
                    ? 'bg-[#2E5E88] text-white border-[#2E5E88]'
                    : isDark
                    ? 'bg-[#141A2E] text-slate-300 border-[#252E4A] hover:border-[#5584B4]'
                    : 'bg-white text-slate-700 border-[#D8CEBC] hover:border-[#2E5E88]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            {(activeStatementFilter === 'all' || activeStatementFilter === 'trading') &&
              render6ColTable('1. Trading Account', '6-column executive', statements.tradingAccount)}
            {(activeStatementFilter === 'all' || activeStatementFilter === 'income') &&
              render6ColTable('2. Income Statement', '6-column executive', statements.incomeStatement)}
            {(activeStatementFilter === 'all' || activeStatementFilter === 'balance-sheet') &&
              render6ColTable('3. Balance Sheet (incl. Investment 3-2-1-29)', '6-column executive', statements.balanceSheet)}
            {(activeStatementFilter === 'all' || activeStatementFilter === 'cash-flow') &&
              render6ColTable('4. Cash Flow Statement', '6-column executive', statements.cashFlow)}
          </div>
        </>
      )}
    </div>
  );
};
