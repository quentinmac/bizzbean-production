import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { BizzModelLayout } from '../bizzmodel/BizzModelLayout';
import { BizzModelState } from '../bizzmodel/constants';
import { SetupStep } from '../bizzmodel/steps/SetupStep';
import { HiLevelActualsStep } from '../bizzmodel/steps/HiLevelActualsStep';
import { RevenueStep } from '../bizzmodel/steps/RevenueStep';
import { EmploymentStep } from '../bizzmodel/steps/EmploymentStep';
import { OperatingExpensesStep } from '../bizzmodel/steps/OperatingExpensesStep';
import { FixedAssetsStep } from '../bizzmodel/steps/FixedAssetsStep';
import { FundingStep } from '../bizzmodel/steps/FundingStep';
import { BizzBudgetWorkspaceState, OperationalPlansState } from './types';
import { createDefaultBizzBudgetState } from './defaultBudgetData';
import { computeAllBranchBundles } from './budgetEngine';
import { BranchRegionManagerBar } from './components/BranchRegionManagerBar';
import { OperationalPlansPanel } from './components/OperationalPlansPanel';
import { BudgetReportsStep } from './components/BudgetReportsStep';

const STORAGE_KEY = 'bizzbudget_platform_workspace_v1';

export interface BizzBudgetProps {
  theme?: 'light' | 'dark';
  onClose: () => void;
  onContextSwitch?: (appId: string, step?: string) => void;
}

export const BizzBudget: React.FC<BizzBudgetProps> = ({
  theme = 'light',
  onClose,
  onContextSwitch,
}) => {
  const isDark = theme === 'dark';

  const [activeStep, setActiveStep] = useState<string>('setup');
  const [isStepBizzBoxActive, setIsStepBizzBoxActive] = useState<boolean>(false);

  const [activeSubTab, setActiveSubTabState] = useState<'assumptions' | 'results' | 'charts'>(() => {
    try {
      const saved = localStorage.getItem('bizz_synchronized_subtab');
      if (saved === 'assumptions' || saved === 'results' || saved === 'charts') return saved;
    } catch {}
    return 'assumptions';
  });

  const setActiveSubTab = useCallback((tab: 'assumptions' | 'results' | 'charts') => {
    setActiveSubTabState(tab);
    try {
      localStorage.setItem('bizz_synchronized_subtab', tab);
      window.dispatchEvent(new CustomEvent('bizz_subtab_change', { detail: tab }));
    } catch {}
  }, []);

  const [fundingTab, setFundingTab] = useState<'dynamics' | 'what-if' | 'actions-to-improve'>('dynamics');

  const [workspace, setWorkspace] = useState<BizzBudgetWorkspaceState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.branches) && parsed.branches.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return createDefaultBizzBudgetState();
  });

  // Persist workspace to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {}
  }, [workspace]);

  useEffect(() => {
    if (activeStep !== 'revenue') {
      setIsStepBizzBoxActive(false);
    }
  }, [activeStep]);

  const activeBranch = useMemo(
    () =>
      workspace.branches.find((b) => b.id === workspace.activeBranchId) ||
      workspace.branches[0],
    [workspace.branches, workspace.activeBranchId]
  );

  // Live preview of branch's 12-month Total Assets & formula-driven Equity Loan (for Funding Step banner)
  const liveBranchBundle = useMemo(() => {
    const map = computeAllBranchBundles(workspace.branches, workspace.structureMode, 'budget');
    return map.get(activeBranch.id);
  }, [workspace.branches, workspace.structureMode, activeBranch.id]);

  // Updater that mutates only the active branch's BizzModelState
  const handleUpdateActiveBranchState = useCallback(
    (updater: (prev: BizzModelState) => BizzModelState) => {
      setWorkspace((prev) => ({
        ...prev,
        branches: prev.branches.map((b) =>
          b.id === prev.activeBranchId ? { ...b, state: updater(b.state) } : b
        ),
      }));
    },
    []
  );

  const handleUpdateActiveBranchPlans = useCallback(
    (updater: (prev: OperationalPlansState) => OperationalPlansState) => {
      setWorkspace((prev) => ({
        ...prev,
        branches: prev.branches.map((b) =>
          b.id === prev.activeBranchId
            ? { ...b, operationalPlans: updater(b.operationalPlans) }
            : b
        ),
      }));
    },
    []
  );

  const handlePatchActiveBranchMeta = (patch: {
    equityLoanPctOfTotalAssets?: number;
    directInvestmentAmount?: number;
  }) => {
    setWorkspace((prev) => ({
      ...prev,
      branches: prev.branches.map((b) =>
        b.id === prev.activeBranchId ? { ...b, ...patch } : b
      ),
    }));
  };

  const fmtR = (val: number) => {
    const rounded = Math.round(val || 0);
    const abs = Math.abs(rounded).toLocaleString('en-ZA');
    return rounded < 0 ? `-R ${abs}` : `R ${abs}`;
  };

  return (
    <BizzModelLayout
      theme={theme}
      mode="bizzbudget"
      activeAppTab="bizzbudget"
      onSelectAppTab={(tab) => {
        if (onContextSwitch) onContextSwitch(tab);
      }}
      activeStep={activeStep}
      onSelectStep={setActiveStep}
      setupTab={activeSubTab}
      onSelectSetupTab={setActiveSubTab}
      stepSubTab={activeSubTab}
      onSelectStepSubTab={setActiveSubTab}
      fundingTab={fundingTab}
      onSelectFundingTab={setFundingTab}
      isBizzBoxTabActive={activeStep === 'revenue' && isStepBizzBoxActive}
      onSelectBizzBoxTab={activeStep === 'revenue' ? setIsStepBizzBoxActive : undefined}
      onClose={onClose}
    >
      {/* Persistent Top Branch / Region / Standalone Context Bar */}
      <BranchRegionManagerBar
        workspace={workspace}
        onUpdateWorkspace={setWorkspace}
        theme={theme}
      />

      {/* Step 1: Business Details (12-Month Budget Setup) */}
      {activeStep === 'setup' && (
        <SetupStep
          theme={theme}
          mode="bizzmodel"
          state={activeBranch.state}
          onUpdateState={handleUpdateActiveBranchState}
          activeTab={activeSubTab}
          onSelectTab={setActiveSubTab}
        />
      )}

      {/* Step 2: Preceding Year Management Accounts (YTD -> Current Year-End Forecast via Trading Distribution) */}
      {activeStep === 'ytd-actuals' && (
        <div className="space-y-3">
          <div className="px-4 sm:px-6 pt-4">
            <div
              className={`rounded-xl border px-4 py-3 text-xs font-mono flex items-start gap-2.5 ${
                isDark
                  ? 'bg-[#101A30] border-[#253B66] text-sky-200'
                  : 'bg-[#EEF5FC] border-[#BDD4EB] text-slate-800'
              }`}
            >
              <Info className="w-4 h-4 text-[#2E5E88] dark:text-[#7EB2E2] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#2E5E88] dark:text-[#7EB2E2]">
                  Preceding Year Management Accounts ({activeBranch.name}):
                </span>{' '}
                Enter YTD actuals for the year preceding the budget period. The engine forecasts Current Year-End results using the trading distribution at the update month — populating <strong>Column 1</strong> of the 6-column Executive Summary.
              </div>
            </div>
          </div>
          <HiLevelActualsStep
            theme={theme}
            mode="rolling-forecast"
            state={activeBranch.state}
            onUpdateState={handleUpdateActiveBranchState}
            subTab={activeSubTab}
            onSelectSubTab={setActiveSubTab}
            onNavigateStep={(step, fTab) => {
              setActiveStep(step);
              if (fTab) setFundingTab(fTab);
            }}
          />
        </div>
      )}

      {/* Step 3: Revenue Calculator (All Model-Sets + BizzBox) */}
      {activeStep === 'revenue' && (
        <RevenueStep
          theme={theme}
          mode="bizzmodel"
          state={activeBranch.state}
          onUpdateState={handleUpdateActiveBranchState}
          subTab={isStepBizzBoxActive ? 'bizzbox' : activeSubTab}
          onSelectSubTab={(tab) => {
            setIsStepBizzBoxActive(false);
            setActiveSubTab(tab);
          }}
        />
      )}

      {/* Step 4: Employment */}
      {activeStep === 'employment' && (
        <EmploymentStep
          theme={theme}
          mode="bizzmodel"
          state={activeBranch.state}
          onUpdateState={handleUpdateActiveBranchState}
          subTab={activeSubTab}
          onSelectSubTab={setActiveSubTab}
          branchName={activeBranch.name}
        />
      )}

      {/* Step 5: Operating Expenses */}
      {activeStep === 'opex' && (
        <OperatingExpensesStep
          theme={theme}
          mode="bizzmodel"
          state={activeBranch.state}
          onUpdateState={handleUpdateActiveBranchState}
          subTab={activeSubTab}
          onSelectSubTab={setActiveSubTab}
        />
      )}

      {/* Step 6: Fixed Assets */}
      {activeStep === 'fixed-assets' && (
        <FixedAssetsStep
          theme={theme}
          mode="bizzmodel"
          state={activeBranch.state}
          onUpdateState={handleUpdateActiveBranchState}
          subTab={activeSubTab}
          onSelectSubTab={setActiveSubTab}
        />
      )}

      {/* Step 7: Funding Calculator (Dynamics + What If + Operational Plans) */}
      {activeStep === 'funding' && (
        fundingTab === 'actions-to-improve' ? (
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <OperationalPlansPanel
              branchName={activeBranch.name}
              plans={activeBranch.operationalPlans}
              onUpdatePlans={handleUpdateActiveBranchPlans}
              theme={theme}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Branch Equity Loan Formula & Investment (3-2-1-29) Control Strip */}
            <div className="px-4 sm:px-6 pt-4">
              <div
                className={`rounded-2xl border p-4 font-mono ${
                  isDark
                    ? 'bg-[#101626] border-[#253658] text-slate-100'
                    : 'bg-white border-[#D8CEBC] text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2E5E88] dark:text-[#7EB2E2]">
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {activeBranch.isHoldingCompany && workspace.structureMode === 'multi-branch'
                          ? 'Holding Company Capitalization & Investment (3-2-1-29)'
                          : 'Branch Equity Loan Formula & Investment (3-2-1-29)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {activeBranch.isHoldingCompany && workspace.structureMode === 'multi-branch'
                        ? 'Holding Company holds 100.00% of each operating branch. Its Investment (3-2-1-29) line automatically includes the aggregate branch Equity Loan balances as a debit, which eliminates to zero on Group Consolidation.'
                        : workspace.structureMode === 'multi-branch'
                        ? 'Operating branches carry zero share capital and are financed by an Equity Loan from the Holding Company calculated as a negative % of Total Assets.'
                        : 'Configure optional formula-driven Equity Loan (% of Total Assets) and Investment (3-2-1-29) positioned after Fixed Assets on the Balance Sheet.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {!activeBranch.isHoldingCompany && (
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                          equity loan (% total assets):
                        </label>
                        <div className="inline-flex items-center gap-1">
                          <span className="text-rose-500 font-bold">-</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={activeBranch.equityLoanPctOfTotalAssets}
                            onChange={(e) =>
                              handlePatchActiveBranchMeta({
                                equityLoanPctOfTotalAssets: Math.max(
                                  0,
                                  Math.min(100, Number(e.target.value) || 0)
                                ),
                              })
                            }
                            className={`w-16 px-2 py-1 rounded-lg border text-xs text-right tabular-nums outline-none ${
                              isDark
                                ? 'bg-[#0A0F1D] border-[#2B3759] text-white'
                                : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                            }`}
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                        direct inv. (3-2-1-29):
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={10000}
                        value={activeBranch.directInvestmentAmount || 0}
                        onChange={(e) =>
                          handlePatchActiveBranchMeta({
                            directInvestmentAmount: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className={`w-28 px-2 py-1 rounded-lg border text-xs text-right tabular-nums outline-none ${
                          isDark
                            ? 'bg-[#0A0F1D] border-[#2B3759] text-white'
                            : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                        }`}
                      />
                    </div>

                    {liveBranchBundle && (
                      <div
                        className={`px-3 py-1.5 rounded-xl border text-right ${
                          isDark
                            ? 'bg-[#0A1020] border-[#253658]'
                            : 'bg-[#FAF8F5] border-[#D8CEBC]'
                        }`}
                      >
                        <div className="text-[9.5px] uppercase text-slate-400">
                          {activeBranch.isHoldingCompany && workspace.structureMode === 'multi-branch'
                            ? 'YE Investment (3-2-1-29)'
                            : 'YE Equity Loan (Formula)'}
                        </div>
                        <div className="text-xs font-bold tabular-nums text-[#2E5E88] dark:text-[#7EB2E2]">
                          {activeBranch.isHoldingCompany && workspace.structureMode === 'multi-branch'
                            ? fmtR(liveBranchBundle.yearEnd.investment_32129)
                            : fmtR(liveBranchBundle.yearEnd.equity_loan)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <FundingStep
              theme={theme}
              mode="bizzmodel"
              state={activeBranch.state}
              onUpdateState={handleUpdateActiveBranchState}
              subTab={fundingTab === 'what-if' ? 'what-if' : 'dynamics'}
              onSelectSubTab={(t) => setFundingTab(t)}
            />
          </div>
        )
      )}

      {/* Step 8: Consolidated 12-Month Reports & 6-Column Executive Summary */}
      {activeStep === 'reports' && (
        <BudgetReportsStep
          workspace={workspace}
          onUpdateWorkspace={setWorkspace}
          theme={theme}
        />
      )}
    </BizzModelLayout>
  );
};

export default BizzBudget;
