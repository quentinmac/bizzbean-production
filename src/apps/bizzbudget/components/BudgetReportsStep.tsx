import React, { useMemo, useState } from 'react';
import {
  Building2,
  MapPin,
  Layers,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  BizzBudgetWorkspaceState,
  ConsolidationLevel,
} from '../types';
import {
  aggregateScopeAdjustments,
  BudgetPeriodRow,
  buildConsolidatedBundle,
  buildExecutiveSummary6Col,
  computeAllBranchBundles,
} from '../budgetEngine';
import { ExecutiveSummary6ColPanel } from './ExecutiveSummary6ColPanel';

interface BudgetReportsStepProps {
  workspace: BizzBudgetWorkspaceState;
  onUpdateWorkspace: (updater: (prev: BizzBudgetWorkspaceState) => BizzBudgetWorkspaceState) => void;
  theme?: 'light' | 'dark';
}

type ReportTabId =
  | 'executive-summary'
  | 'trading-account'
  | 'income-statement'
  | 'balance-sheet'
  | 'cash-flow'
  | 'consolidation-matrix';

const fmtNum = (val: number): string => {
  if (!Number.isFinite(val)) return '0';
  const rounded = Math.round(val);
  const abs = Math.abs(rounded).toLocaleString('en-ZA');
  return rounded < 0 ? `-${abs}` : abs;
};

interface MatrixLineDef {
  label: string;
  coaCode?: string;
  indent?: boolean;
  highlight?: boolean;
  isSectionHeader?: boolean;
  getter: (r: BudgetPeriodRow) => number;
}

export const BudgetReportsStep: React.FC<BudgetReportsStepProps> = ({
  workspace,
  onUpdateWorkspace,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<ReportTabId>('executive-summary');

  const isMultiBranch = workspace.structureMode === 'multi-branch';
  const effectiveLevel: ConsolidationLevel = isMultiBranch ? workspace.consolidationLevel : 'branch';

  // Compute all 12-month Budget bundles & Preceding-Year Current YE Forecast bundles
  const budgetBundles = useMemo(
    () => computeAllBranchBundles(workspace.branches, workspace.structureMode, 'budget'),
    [workspace.branches, workspace.structureMode]
  );

  const priorForecastBundles = useMemo(
    () => computeAllBranchBundles(workspace.branches, workspace.structureMode, 'prior-forecast'),
    [workspace.branches, workspace.structureMode]
  );

  const consolidatedBudget = useMemo(
    () =>
      buildConsolidatedBundle(
        workspace.branches,
        workspace.regions,
        budgetBundles,
        workspace.structureMode,
        effectiveLevel,
        workspace.selectedReportBranchId || workspace.activeBranchId,
        workspace.selectedRegionId,
        workspace.groupName
      ),
    [
      workspace.branches,
      workspace.regions,
      budgetBundles,
      workspace.structureMode,
      effectiveLevel,
      workspace.selectedReportBranchId,
      workspace.activeBranchId,
      workspace.selectedRegionId,
      workspace.groupName,
    ]
  );

  const consolidatedForecast = useMemo(
    () =>
      buildConsolidatedBundle(
        workspace.branches,
        workspace.regions,
        priorForecastBundles,
        workspace.structureMode,
        effectiveLevel,
        workspace.selectedReportBranchId || workspace.activeBranchId,
        workspace.selectedRegionId,
        workspace.groupName
      ),
    [
      workspace.branches,
      workspace.regions,
      priorForecastBundles,
      workspace.structureMode,
      effectiveLevel,
      workspace.selectedReportBranchId,
      workspace.activeBranchId,
      workspace.selectedRegionId,
      workspace.groupName,
    ]
  );

  const scopeAdjustments = useMemo(
    () =>
      aggregateScopeAdjustments(
        workspace.branches,
        workspace.structureMode,
        effectiveLevel,
        workspace.selectedReportBranchId || workspace.activeBranchId,
        workspace.selectedRegionId
      ),
    [
      workspace.branches,
      workspace.structureMode,
      effectiveLevel,
      workspace.selectedReportBranchId,
      workspace.activeBranchId,
      workspace.selectedRegionId,
    ]
  );

  const execSummary6Col = useMemo(
    () =>
      buildExecutiveSummary6Col(
        consolidatedForecast.yearEnd,
        consolidatedBudget.yearEnd,
        scopeAdjustments
      ),
    [consolidatedForecast.yearEnd, consolidatedBudget.yearEnd, scopeAdjustments]
  );

  const canEditAdjustments = effectiveLevel === 'branch';
  const targetBranchIdForAdj = workspace.selectedReportBranchId || workspace.activeBranchId;

  const handleUpdateAdjustment = (rowId: string, value: number) => {
    if (!canEditAdjustments) return;
    onUpdateWorkspace((prev) => ({
      ...prev,
      branches: prev.branches.map((b) =>
        b.id === targetBranchIdForAdj
          ? {
              ...b,
              execAdjustments: {
                ...(b.execAdjustments || {}),
                [rowId]: value,
              },
            }
          : b
      ),
    }));
  };

  const handleResetAdjustments = () => {
    if (!canEditAdjustments) return;
    onUpdateWorkspace((prev) => ({
      ...prev,
      branches: prev.branches.map((b) =>
        b.id === targetBranchIdForAdj ? { ...b, execAdjustments: {} } : b
      ),
    }));
  };

  const columns12PlusTotal = useMemo(
    () => [...consolidatedBudget.months, consolidatedBudget.yearEnd],
    [consolidatedBudget]
  );

  const tradingLines: MatrixLineDef[] = [
    { label: 'unit sales', getter: (r) => r.unitSales },
    { label: 'revenue', highlight: true, getter: (r) => r.revenue },
    { label: 'cost of sales - variable', indent: true, getter: (r) => -r.cos_variable },
    { label: 'cos - employment', indent: true, getter: (r) => -r.cos_employment },
    { label: 'cos - depreciation', indent: true, getter: (r) => -r.cos_depreciation },
    { label: 'cos - lease', indent: true, getter: (r) => -r.cos_lease },
    { label: 'cos - overheads', indent: true, getter: (r) => -r.cos_overheads },
    { label: 'total cost of sales', highlight: true, getter: (r) => -r.total_cos },
    { label: 'gross profit', highlight: true, getter: (r) => r.gross_profit },
    { label: 'gross profit adjustments', getter: (r) => -r.gp_adjustments },
    { label: 'remaining gross profit', highlight: true, getter: (r) => r.remaining_gp },
    { label: 'other income', getter: (r) => r.other_inc },
    { label: 'total income', highlight: true, getter: (r) => r.total_income },
    { label: 'expenses - variable', indent: true, getter: (r) => -r.ex_variable },
    { label: 'expenses - employment', indent: true, getter: (r) => -r.ex_employment },
    { label: 'expenses - depreciation', indent: true, getter: (r) => -r.ex_depreciation },
    { label: 'expenses - lease', indent: true, getter: (r) => -r.ex_lease },
    { label: 'expenses - overheads', indent: true, getter: (r) => -r.ex_overheads },
    { label: 'total operating expenses', highlight: true, getter: (r) => -r.ex_total },
    { label: 'net operating profit', highlight: true, getter: (r) => r.net_operating_profit },
  ];

  const incomeLines: MatrixLineDef[] = [
    { label: 'net operating profit', highlight: true, getter: (r) => r.net_operating_profit },
    { label: 'interest - bank / overdraft', indent: true, getter: (r) => r.interest_other },
    { label: 'interest - term loan', indent: true, getter: (r) => -r.interest_tl },
    { label: 'net finance charges', highlight: true, getter: (r) => -r.interest_total },
    { label: 'net profit before taxation', highlight: true, getter: (r) => r.net_profit_before_tax },
    { label: 'taxation', getter: (r) => -r.taxation },
    { label: 'taxed profits', highlight: true, getter: (r) => r.taxed_profits },
    { label: 'dividends', getter: (r) => -r.dividends },
    { label: 'retained earnings', highlight: true, getter: (r) => r.retained_earnings },
  ];

  const balanceSheetLines: MatrixLineDef[] = [
    { label: 'fixed assets', getter: (r) => r.fixed_assets_net },
    { label: 'investment', coaCode: '3-2-1-29', getter: (r) => r.investment_32129 },
    { label: 'inventory', indent: true, getter: (r) => r.inventory },
    { label: 'accounts receivables', indent: true, getter: (r) => r.accounts_receivable },
    { label: 'other assets', indent: true, getter: (r) => r.other_assets },
    { label: 'vat receivable', indent: true, getter: (r) => r.vat_receivable },
    { label: 'current assets', highlight: true, getter: (r) => r.current_assets },
    { label: 'total assets', highlight: true, getter: (r) => r.total_assets },
    { label: 'accounts payables', indent: true, getter: (r) => r.accounts_payable },
    { label: 'vat payable', indent: true, getter: (r) => r.vat_payable },
    { label: 'taxation payable', indent: true, getter: (r) => r.taxation_payable },
    { label: 'non-interest bearing debt', highlight: true, getter: (r) => r.non_interest_bearing_debt },
    { label: 'net operating assets', highlight: true, getter: (r) => r.net_operating_assets },
    { label: 'financed by', isSectionHeader: true, getter: () => 0 },
    { label: 'shares in issue', getter: (r) => r.shares_in_issue },
    { label: "shareholders' capital", getter: (r) => r.shareholders_capital },
    { label: 'equity loan', getter: (r) => r.equity_loan },
    { label: 'retained earnings - prior', getter: (r) => r.retained_earnings_prior },
    { label: 'retained earnings - current', getter: (r) => r.retained_earnings_current },
    { label: "shareholders' equity", highlight: true, getter: (r) => r.shareholders_equity },
    { label: 'bank balance', getter: (r) => r.bank_balance_closing },
    { label: 'term loan', getter: (r) => r.term_loan_balance },
    { label: 'interest bearing debt', highlight: true, getter: (r) => r.interest_bearing_debt },
    { label: 'capital employed', highlight: true, getter: (r) => r.capital_employed },
  ];

  const cashFlowLines: MatrixLineDef[] = [
    { label: 'bank balance - opening', getter: (r) => r.bank_balance_opening },
    { label: 'cash from operations', getter: (r) => r.cash_from_operations },
    { label: 'change in working capital', getter: (r) => r.change_in_working_capital },
    { label: 'application to capital assets', getter: (r) => r.application_to_capital_assets },
    { label: 'investment movement (3-2-1-29)', getter: (r) => r.change_in_investment },
    { label: 'share capital movement', indent: true, getter: (r) => r.share_capital_change },
    { label: 'equity loan movement', indent: true, getter: (r) => r.equity_loan_change },
    { label: 'term loan movement', indent: true, getter: (r) => r.loan_change },
    { label: 'change in funding', highlight: true, getter: (r) => r.change_in_funding },
    { label: 'net cashflow', highlight: true, getter: (r) => r.cashflow },
    { label: 'bank balance - closing', highlight: true, getter: (r) => r.bank_balance_closing },
  ];

  const cardBg = isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]';
  const inputSurface = isDark
    ? 'bg-[#0A0F1D] border-[#2B3759] text-slate-100'
    : 'bg-white border-[#D8CEBC] text-slate-900';

  const render12MonthStatementTable = (title: string, lines: MatrixLineDef[]) => (
    <div className={`rounded-2xl border overflow-hidden shadow-xs ${cardBg}`}>
      <div
        className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${
          isDark ? 'bg-[#151D33] border-[#222F4C]' : 'bg-[#F4EFE6]/90 border-[#D8CEBC]'
        }`}
      >
        <div>
          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            {title} — {consolidatedBudget.title}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {consolidatedBudget.subtitle} · 12-Month Budget Period ({workspace.budgetYearLabel})
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11.5px] border-collapse">
          <thead>
            <tr
              className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                isDark ? 'bg-[#0D1322] border-[#222F4C] text-slate-400' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-500'
              }`}
            >
              <th className="py-2.5 px-3 text-left sticky left-0 z-10 min-w-[205px] bg-inherit">
                line item
              </th>
              {columns12PlusTotal.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-2.5 px-2.5 text-right whitespace-nowrap ${
                    col.isTotal
                      ? 'bg-[#2E5E88]/10 text-[#2E5E88] dark:text-[#7EB2E2] font-extrabold'
                      : ''
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-[#1E293B]">
            {lines.map((line, idx) => {
              if (line.isSectionHeader) {
                return (
                  <tr key={idx} className={isDark ? 'bg-[#141C30]' : 'bg-[#F4EFE6]/60'}>
                    <td
                      colSpan={columns12PlusTotal.length + 1}
                      className="py-2 px-3 text-[10.5px] font-bold uppercase tracking-widest text-[#2E5E88] dark:text-[#7EB2E2]"
                    >
                      {line.label}
                    </td>
                  </tr>
                );
              }
              return (
                <tr
                  key={idx}
                  className={
                    line.highlight
                      ? isDark
                        ? 'bg-[#162038]/80 font-bold text-white'
                        : 'bg-[#F4EFE6]/70 font-bold text-slate-900'
                      : isDark
                      ? 'hover:bg-[#141D32]/60 text-slate-200'
                      : 'hover:bg-[#FAF8F5] text-slate-700'
                  }
                >
                  <td
                    className={`py-2 px-3 sticky left-0 z-10 whitespace-nowrap bg-inherit ${
                      line.indent ? 'pl-7 text-slate-500 dark:text-slate-400' : ''
                    }`}
                  >
                    <span>{line.label}</span>
                    {line.coaCode && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#5584B4]/15 text-[#2E5E88] dark:text-[#7EB2E2]">
                        {line.coaCode}
                      </span>
                    )}
                  </td>
                  {columns12PlusTotal.map((col, cIdx) => {
                    const val = line.getter(col);
                    return (
                      <td
                        key={cIdx}
                        className={`py-2 px-2.5 text-right tabular-nums whitespace-nowrap ${
                          col.isTotal
                            ? 'bg-[#2E5E88]/5 font-bold text-[#2E5E88] dark:text-[#7EB2E2]'
                            : ''
                        } ${val < 0 ? 'text-rose-600 dark:text-rose-400' : ''}`}
                      >
                        {fmtNum(val)}
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

  // Group Consolidation Side-by-Side Matrix (Holding Co + Every Branch + Eliminations + Group Total)
  const groupMatrixBundle = useMemo(
    () =>
      buildConsolidatedBundle(
        workspace.branches,
        workspace.regions,
        budgetBundles,
        workspace.structureMode,
        'group',
        workspace.activeBranchId,
        workspace.selectedRegionId,
        workspace.groupName
      ),
    [workspace, budgetBundles]
  );

  const renderGroupEliminationAuditBanner = () => {
    if (!isMultiBranch || effectiveLevel !== 'group') return null;
    const el = consolidatedBudget.eliminationsYearEnd;
    return (
      <div
        className={`rounded-2xl border p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
          isDark
            ? 'bg-[#0F1B33] border-[#2C4775] text-slate-100'
            : 'bg-[#EEF5FC] border-[#BDD4EB] text-slate-900'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#2E5E88] dark:text-[#7EB2E2] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#2E5E88] dark:text-[#7EB2E2]">
              Group Consolidation · 100% Ownership Intercompany Elimination Check
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
              Holding Company owns 100.00% of all operating branches. On consolidation, the debit balance on the Equity Loan / Investment (3-2-1-29) eliminates exactly against the aggregate negative credit Equity Loan balances of the branches.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 shrink-0 text-right text-xs">
          <div className={`px-3 py-2 rounded-xl border ${isDark ? 'bg-[#0A1020] border-[#253658]' : 'bg-white border-[#D0E0F0]'}`}>
            <div className="text-[10px] text-slate-400">branches eq. loans (cr)</div>
            <div className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              R {fmtNum(el.branchEquityLoansAggregateCredit)}
            </div>
          </div>
          <div className={`px-3 py-2 rounded-xl border ${isDark ? 'bg-[#0A1020] border-[#253658]' : 'bg-white border-[#D0E0F0]'}`}>
            <div className="text-[10px] text-slate-400">holding debit (3-2-1-29)</div>
            <div className="font-bold text-[#2E5E88] dark:text-[#7EB2E2] tabular-nums">
              +R {fmtNum(el.equityLoanDebitElimination)}
            </div>
          </div>
          <div className={`px-3 py-2 rounded-xl border ${isDark ? 'bg-[#0A1020] border-[#253658]' : 'bg-white border-[#D0E0F0]'}`}>
            <div className="text-[10px] text-slate-400">net intercompany</div>
            <div className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums flex items-center justify-end gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>R {fmtNum(el.netEliminationCheck)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 font-mono max-w-[1600px] mx-auto">
      {/* 1. CONSOLIDATION SCOPE BAR (Branch / Region / Group) */}
      <div className={`rounded-2xl border p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${cardBg}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            consolidation level:
          </span>

          <div
            className={`inline-flex p-1 rounded-xl border ${
              isDark ? 'bg-[#0A0F1D] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
            }`}
          >
            <button
              type="button"
              onClick={() =>
                onUpdateWorkspace((prev) => ({ ...prev, consolidationLevel: 'branch' }))
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold lowercase transition-colors cursor-pointer ${
                effectiveLevel === 'branch'
                  ? 'bg-[#2E5E88] text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>branch</span>
            </button>

            {isMultiBranch && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateWorkspace((prev) => ({ ...prev, consolidationLevel: 'region' }))
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold lowercase transition-colors cursor-pointer ${
                    effectiveLevel === 'region'
                      ? 'bg-[#2E5E88] text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>region</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateWorkspace((prev) => ({ ...prev, consolidationLevel: 'group' }))
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold lowercase transition-colors cursor-pointer ${
                    effectiveLevel === 'group'
                      ? 'bg-[#2E5E88] text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>group</span>
                </button>
              </>
            )}
          </div>

          {/* Scope Entity Picker */}
          {effectiveLevel === 'branch' && (
            <select
              value={workspace.selectedReportBranchId || workspace.activeBranchId}
              onChange={(e) =>
                onUpdateWorkspace((prev) => ({
                  ...prev,
                  selectedReportBranchId: e.target.value,
                }))
              }
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold outline-none cursor-pointer ${inputSurface}`}
            >
              {(isMultiBranch
                ? workspace.branches
                : workspace.branches.filter((b) => !b.isHoldingCompany).slice(0, 1)
              ).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.isHoldingCompany ? `★ ${b.name} [Holding Co]` : b.name}
                </option>
              ))}
            </select>
          )}

          {effectiveLevel === 'region' && isMultiBranch && (
            <select
              value={workspace.selectedRegionId}
              onChange={(e) =>
                onUpdateWorkspace((prev) => ({
                  ...prev,
                  selectedRegionId: e.target.value,
                }))
              }
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold outline-none cursor-pointer ${inputSurface}`}
            >
              {workspace.regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Report Section Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'executive-summary', label: 'executive summary (6-col)' },
            { id: 'trading-account', label: 'trading account' },
            { id: 'income-statement', label: 'income statement' },
            { id: 'balance-sheet', label: 'balance sheet' },
            { id: 'cash-flow', label: 'cash flow' },
            ...(isMultiBranch
              ? [{ id: 'consolidation-matrix', label: 'group matrix' }]
              : []),
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as ReportTabId)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold lowercase border transition-colors cursor-pointer ${
                activeTab === t.id
                  ? 'bg-[#2E5E88] text-white border-[#2E5E88]'
                  : isDark
                  ? 'bg-[#141A2E] text-slate-300 border-[#252E4A] hover:border-[#5584B4]'
                  : 'bg-[#FAF8F5] text-slate-700 border-[#D8CEBC] hover:border-[#2E5E88]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Group Elimination Audit Strip */}
      {renderGroupEliminationAuditBanner()}

      {/* 2. ACTIVE REPORT VIEW */}
      {activeTab === 'executive-summary' && (
        <ExecutiveSummary6ColPanel
          scopeTitle={consolidatedBudget.title}
          scopeSubtitle={consolidatedBudget.subtitle}
          canEditAdjustments={canEditAdjustments}
          statements={execSummary6Col}
          onUpdateAdjustment={handleUpdateAdjustment}
          onResetAdjustments={handleResetAdjustments}
          theme={theme}
        />
      )}

      {activeTab === 'trading-account' &&
        render12MonthStatementTable('Trading Account', tradingLines)}

      {activeTab === 'income-statement' &&
        render12MonthStatementTable('Income Statement', incomeLines)}

      {activeTab === 'balance-sheet' &&
        render12MonthStatementTable('Balance Sheet (incl. Investment 3-2-1-29)', balanceSheetLines)}

      {activeTab === 'cash-flow' &&
        render12MonthStatementTable('Cash Flow Statement', cashFlowLines)}

      {activeTab === 'consolidation-matrix' && isMultiBranch && (
        <div className="space-y-5">
          {[
            { title: 'Group Consolidation Matrix · Trading Account (FY Budget)', lines: tradingLines },
            { title: 'Group Consolidation Matrix · Income Statement (FY Budget)', lines: incomeLines },
            { title: 'Group Consolidation Matrix · Balance Sheet (Year-End)', lines: balanceSheetLines, showEliminations: true },
            { title: 'Group Consolidation Matrix · Cash Flow (FY Budget)', lines: cashFlowLines },
          ].map((sec) => (
            <div key={sec.title} className={`rounded-2xl border overflow-hidden shadow-xs ${cardBg}`}>
              <div
                className={`px-4 py-3 border-b ${
                  isDark ? 'bg-[#151D33] border-[#222F4C]' : 'bg-[#F4EFE6]/90 border-[#D8CEBC]'
                }`}
              >
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {sec.title}
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr
                      className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                        isDark ? 'bg-[#0D1322] border-[#222F4C] text-slate-400' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-500'
                      }`}
                    >
                      <th className="py-2.5 px-3 text-left min-w-[205px]">line item</th>
                      {groupMatrixBundle.branchSummaries.map((bs) => (
                        <th key={bs.branchId} className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div>{bs.branchCode}</div>
                          <div className="text-[9px] font-normal text-slate-400 lowercase">
                            {bs.regionName}
                          </div>
                        </th>
                      ))}
                      {sec.showEliminations && (
                        <th className="py-2.5 px-3 text-right whitespace-nowrap text-amber-600 dark:text-amber-400">
                          eliminations
                        </th>
                      )}
                      <th className="py-2.5 px-3 text-right whitespace-nowrap bg-[#2E5E88]/10 text-[#2E5E88] dark:text-[#7EB2E2]">
                        group consolidated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-[#1E293B]">
                    {sec.lines.map((line, idx) => {
                      if (line.isSectionHeader) {
                        return (
                          <tr key={idx} className={isDark ? 'bg-[#141C30]' : 'bg-[#F4EFE6]/60'}>
                            <td
                              colSpan={groupMatrixBundle.branchSummaries.length + (sec.showEliminations ? 3 : 2)}
                              className="py-2 px-3 text-[10.5px] font-bold uppercase tracking-widest text-[#2E5E88] dark:text-[#7EB2E2]"
                            >
                              {line.label}
                            </td>
                          </tr>
                        );
                      }
                      const rawSum = groupMatrixBundle.branchSummaries.reduce(
                        (s, bs) => s + line.getter(bs.yearEnd),
                        0
                      );
                      const groupVal = line.getter(groupMatrixBundle.yearEnd);
                      const elimVal = groupVal - rawSum;

                      return (
                        <tr
                          key={idx}
                          className={
                            line.highlight
                              ? isDark
                                ? 'bg-[#162038]/80 font-bold text-white'
                                : 'bg-[#F4EFE6]/70 font-bold text-slate-900'
                              : isDark
                              ? 'hover:bg-[#141D32]/60 text-slate-200'
                              : 'hover:bg-[#FAF8F5] text-slate-700'
                          }
                        >
                          <td className={`py-2 px-3 whitespace-nowrap ${line.indent ? 'pl-7 text-slate-500 dark:text-slate-400' : ''}`}>
                            <span>{line.label}</span>
                            {line.coaCode && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#5584B4]/15 text-[#2E5E88] dark:text-[#7EB2E2]">
                                {line.coaCode}
                              </span>
                            )}
                          </td>
                          {groupMatrixBundle.branchSummaries.map((bs) => {
                            const v = line.getter(bs.yearEnd);
                            return (
                              <td
                                key={bs.branchId}
                                className={`py-2 px-3 text-right tabular-nums whitespace-nowrap ${
                                  v < 0 ? 'text-rose-600 dark:text-rose-400' : ''
                                }`}
                              >
                                {fmtNum(v)}
                              </td>
                            );
                          })}
                          {sec.showEliminations && (
                            <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap text-amber-600 dark:text-amber-400 font-semibold">
                              {Math.abs(elimVal) > 0.5 ? fmtNum(elimVal) : '—'}
                            </td>
                          )}
                          <td
                            className={`py-2 px-3 text-right tabular-nums whitespace-nowrap font-bold bg-[#2E5E88]/5 text-[#2E5E88] dark:text-[#7EB2E2] ${
                              groupVal < 0 ? 'text-rose-600 dark:text-rose-400' : ''
                            }`}
                          >
                            {fmtNum(groupVal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
