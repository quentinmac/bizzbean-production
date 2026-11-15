import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ModellingSuiteModal } from '../bizzdynamics/components/ModellingSuiteModal';

interface BizzModelLayoutProps {
  theme?: 'light' | 'dark';
  mode: 'bizzdynamics' | 'rolling-forecast' | 'bizzmodel';
  activeAppTab: 'bizzcalc' | 'bizzdynamics' | 'rolling-forecast' | 'bizzmodel' | 'bizzplan' | 'reports';
  onSelectAppTab: (tab: 'bizzcalc' | 'bizzdynamics' | 'rolling-forecast' | 'bizzmodel' | 'bizzplan' | 'reports') => void;
  activeStep: string;
  onSelectStep: (step: string) => void;
  setupTab?: 'assumptions' | 'results' | 'charts';
  onSelectSetupTab?: (tab: 'assumptions' | 'results' | 'charts') => void;
  stepSubTab?: 'assumptions' | 'results' | 'charts';
  onSelectStepSubTab?: (tab: 'assumptions' | 'results' | 'charts') => void;
  fundingTab?: 'dynamics' | 'what-if';
  onSelectFundingTab?: (tab: 'dynamics' | 'what-if') => void;
  isBizzPlanTabActive?: boolean;
  onSelectBizzPlanTab?: (active: boolean) => void;
  onClose: () => void;
  children: React.ReactNode;
}

export const BizzModelLayout: React.FC<BizzModelLayoutProps> = ({
  theme = 'light',
  mode,
  activeAppTab,
  onSelectAppTab,
  activeStep,
  onSelectStep,
  setupTab: setupTabProp,
  onSelectSetupTab,
  stepSubTab: stepSubTabProp,
  onSelectStepSubTab,
  fundingTab: fundingTabProp,
  onSelectFundingTab,
  isBizzPlanTabActive = false,
  onSelectBizzPlanTab,
  onClose,
  children,
}) => {
  const isDark = theme === 'dark';

  // Synchronized subtab across standard platform steps (assumptions, results, charts)
  const [internalSubTab, setInternalSubTab] = useState<'assumptions' | 'results' | 'charts'>(() => {
    try {
      const saved = localStorage.getItem('bizz_synchronized_subtab');
      if (saved === 'assumptions' || saved === 'results' || saved === 'charts') return saved;
    } catch {}
    return 'assumptions';
  });

  const currentSubTab = stepSubTabProp ?? setupTabProp ?? internalSubTab;

  const handleSelectSubTab = (tab: 'assumptions' | 'results' | 'charts') => {
    try {
      localStorage.setItem('bizz_synchronized_subtab', tab);
      window.dispatchEvent(new CustomEvent('bizz_subtab_change', { detail: tab }));
    } catch {}
    if (onSelectBizzPlanTab) onSelectBizzPlanTab(false);
    if (onSelectStepSubTab) onSelectStepSubTab(tab);
    if (onSelectSetupTab) onSelectSetupTab(tab);
    setInternalSubTab(tab);
  };

  // Funding specific tabs (dynamics | what if)
  const [internalFundingTab, setInternalFundingTab] = useState<'dynamics' | 'what-if'>(() => {
    try {
      const saved = localStorage.getItem('bizz_funding_subtab');
      if (saved === 'dynamics' || saved === 'what-if') return saved;
    } catch {}
    return 'dynamics';
  });

  const currentFundingTab = fundingTabProp ?? internalFundingTab;

  const handleSelectFundingTab = (tab: 'dynamics' | 'what-if') => {
    try {
      localStorage.setItem('bizz_funding_subtab', tab);
      window.dispatchEvent(new CustomEvent('bizz_funding_tab_change', { detail: tab }));
    } catch {}
    if (onSelectBizzPlanTab) onSelectBizzPlanTab(false);
    if (onSelectFundingTab) onSelectFundingTab(tab);
    setInternalFundingTab(tab);
  };

  // Modals for Assistance Guidance and Modelling Suite navigation
  const [showAssistanceModal, setShowAssistanceModal] = useState<boolean>(false);
  const [showSuiteModal, setShowSuiteModal] = useState<boolean>(false);

  // 7 Core Platform Steps (Bottom dock navigation matching BizzDynamics & BizzCalc design standard)
  const STEPS = [
    { id: 'setup', num: 1, name: 'business details', icon: '/business details.jpg', description: 'business details & operating rhythms' },
    { id: 'revenue', num: 2, name: 'revenue calculator', icon: '/revenue calculator.jpg', description: 'revenue calculator & pricing dynamics' },
    { id: 'employment', num: 3, name: 'employment', icon: '/employment.jpg', description: 'key organizational team' },
    { id: 'opex', num: 4, name: 'operating expenses', icon: '/operating expenses.jpg', description: 'operating overheads & distribution' },
    { id: 'fixed-assets', num: 5, name: 'fixed assets', icon: '/fixed assets.jpg', description: 'capital expenditure & depreciation' },
    { id: 'funding', num: 6, name: 'funding calculator', icon: '/funding calculator.jpg', description: 'capital structure & working capital' },
    { id: 'reports', num: 7, name: 'reports', icon: '/reports.jpg', description: 'authentic v1 financial reports' },
  ];

  const currentStepDef = STEPS.find((s) => s.id === activeStep) || STEPS[0];

  // Resolve lowercase display name of the current app
  const isRollingForecast = mode === 'rolling-forecast' || activeAppTab === 'rolling-forecast';
  const showBizzPlanTab = Boolean(onSelectBizzPlanTab) && !isRollingForecast;
  const appDisplayName = isRollingForecast
    ? 'rolling forecast'
    : mode === 'bizzdynamics' || activeAppTab === 'bizzdynamics'
    ? 'bizzdynamics'
    : 'bizzmodel';

  return (
    <div
      className={`w-full h-full flex-1 flex flex-col font-mono select-none transition-colors rounded-2xl overflow-hidden ${
        isDark ? 'bg-[#0A0D14] text-slate-100' : 'bg-[#FAF8F5] text-slate-900'
      }`}
    >
      {/* ===================================================================== */}
      {/* 1. TOP ROW: PAGE FUNCTIONALITY (HELP ICON & TABS) + APP NAME          */}
      {/* Aligned in height and visual rhythm with BizzDynamics and BizzCalc    */}
      {/* ===================================================================== */}
      <header
        className={`px-4 sm:px-6 py-2.5 min-h-[52px] sm:min-h-[56px] border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#161C30] border-[#222F4C]' : 'bg-[#F4EFE6]/90 border-[#D8CEBC]'
        }`}
      >
        <div className="flex items-center gap-2.5 flex-1 max-w-2xl overflow-x-auto scrollbar-none">
          {/* Help icon button (opens step assistance with /help.jpg) */}
          <button
            type="button"
            onClick={() => setShowAssistanceModal(true)}
            title="Assistance & Guidance for this step"
            aria-label="assistance"
            className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center border transition-all p-1.5 cursor-pointer ${
              showAssistanceModal
                ? 'bg-[#2E5E88] border-[#2E5E88] shadow-2xs ring-1 ring-[#2E5E88]'
                : isDark
                ? 'bg-[#101626] border-[#222F4C] hover:border-slate-500'
                : 'bg-white border-[#D8CEBC] hover:border-[#2E5E88]/60 shadow-2xs'
            }`}
          >
            <img
              src="/help.jpg"
              alt="help"
              className="w-full h-full object-contain mix-blend-multiply dark:bg-white dark:rounded-xs dark:p-0.5"
            />
          </button>

          {/* Function tabs + integrated free bizzplan tab on every step */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {activeStep === 'reports' ? (
              <>
                <button
                  type="button"
                  onClick={() => onSelectBizzPlanTab?.(false)}
                  className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold lowercase transition-all border cursor-pointer whitespace-nowrap ${
                    !isBizzPlanTabActive
                      ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                      : isDark
                      ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                      : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
                  }`}
                >
                  results
                </button>
                {showBizzPlanTab && onSelectBizzPlanTab && (
                  <button
                    type="button"
                    onClick={() => onSelectBizzPlanTab(true)}
                    className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold lowercase transition-all border cursor-pointer whitespace-nowrap ${
                      isBizzPlanTabActive
                        ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                        : 'bg-white text-[#2E5E88] hover:bg-[#2E5E88]/5 border-[#2E5E88]/40'
                    }`}
                  >
                    bizzplan
                  </button>
                )}
              </>
            ) : activeStep === 'funding' ? (
              <>
                {[
                  { id: 'dynamics', label: 'dynamics' },
                  { id: 'what-if', label: 'what if' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectFundingTab(tab.id as any)}
                    className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold lowercase transition-all border cursor-pointer whitespace-nowrap ${
                      !isBizzPlanTabActive && currentFundingTab === tab.id
                        ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                        : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                {showBizzPlanTab && onSelectBizzPlanTab && (
                  <button
                    type="button"
                    onClick={() => onSelectBizzPlanTab(true)}
                    className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold lowercase transition-all border cursor-pointer whitespace-nowrap ${
                      isBizzPlanTabActive
                        ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                        : 'bg-white text-[#2E5E88] hover:bg-[#2E5E88]/5 border-[#2E5E88]/40'
                    }`}
                  >
                    bizzplan
                  </button>
                )}
              </>
            ) : (
              <>
                {[
                  { id: 'assumptions', label: 'assumptions' },
                  { id: 'results', label: 'results' },
                  { id: 'charts', label: 'charts' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectSubTab(tab.id as any)}
                    className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold lowercase transition-all border cursor-pointer whitespace-nowrap ${
                      !isBizzPlanTabActive && currentSubTab === tab.id
                        ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                        : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                {showBizzPlanTab && onSelectBizzPlanTab && (
                  <button
                    type="button"
                    onClick={() => onSelectBizzPlanTab(true)}
                    className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold lowercase transition-all border cursor-pointer whitespace-nowrap ${
                      isBizzPlanTabActive
                        ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                        : 'bg-white text-[#2E5E88] hover:bg-[#2E5E88]/5 border-[#2E5E88]/40'
                    }`}
                  >
                    bizzplan
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right side: Name of the active app (rolling forecast / bizzmodel / hi-level forecast) · Click to view suite */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowSuiteModal(true)}
            className="text-sm sm:text-base font-bold lowercase tracking-tight text-slate-900 dark:text-white hover:text-[#2E5E88] dark:hover:text-[#5584B4] transition-colors cursor-pointer"
            title={`${appDisplayName} · click to view modelling suite`}
          >
            {appDisplayName}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={`Exit ${appDisplayName}`}
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. MAIN STEP CANVAS (FULL HORIZONTAL WIDTH WITHOUT BULKY SIDEBAR)    */}
      {/* ===================================================================== */}
      <main
        className={
          isBizzPlanTabActive
            ? 'flex-1 overflow-hidden flex flex-col p-0'
            : 'flex-grow p-4 sm:p-6 overflow-y-auto overflow-x-hidden space-y-6'
        }
      >
        {children}
      </main>

      {/* ===================================================================== */}
      {/* 3. BOTTOM FOOTER BAR: 7 STEP ICONS (MATCHING BIZZDYNAMICS & BIZZCALC) */}
      {/* ===================================================================== */}
      <footer
        className={`px-2 sm:px-3 py-1 border-t shrink-0 flex items-center justify-around gap-1 sm:gap-2 h-11 sm:h-12 max-h-12 rounded-b-2xl no-print ${
          isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        {STEPS.map((st) => {
          const isActive = activeStep === st.id;
          return (
            <div key={st.id} className="relative group">
              <button
                type="button"
                onClick={() => {
                  onSelectBizzPlanTab?.(false);
                  onSelectStep(st.id);
                  if (st.id === 'reports') {
                    handleSelectSubTab('results');
                  }
                }}
                className={`p-1 rounded-xl transition-all flex flex-col items-center justify-center border cursor-pointer ${
                  isActive
                    ? isDark
                      ? 'bg-[#1C2642] border-[#5584B4] ring-1.5 ring-[#5584B4]/40 shadow-xs'
                      : 'bg-[#E3EDF6] border-[#2E5E88] ring-1.5 ring-[#2E5E88]/30 shadow-xs'
                    : isDark
                    ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A] hover:border-slate-500'
                    : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC] hover:border-[#2E5E88]/60 shadow-2xs'
                }`}
                aria-label={st.name}
              >
                <div className="w-5 h-5 sm:w-5.5 sm:h-5.5 flex items-center justify-center">
                  <img
                    src={encodeURI(st.icon)}
                    alt={st.name}
                    className="w-full h-full object-contain mix-blend-multiply dark:bg-white dark:rounded dark:p-0.5"
                  />
                </div>
              </button>

              {/* Hover Tooltip displaying step label */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                <div className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold lowercase whitespace-nowrap shadow-md flex items-center gap-1.5">
                  <span>0{st.num}</span>
                  <span>·</span>
                  <span>{st.name}</span>
                </div>
                <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-0.5" />
              </div>
            </div>
          );
        })}
      </footer>

      {/* ===================================================================== */}
      {/* 4. MODALS: ASSISTANCE GUIDANCE & MODELLING SUITE NAVIGATION           */}
      {/* ===================================================================== */}
      {showAssistanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-xl overflow-hidden font-mono ${
              isDark ? 'bg-[#0E1322] border-[#222F4C] text-slate-200' : 'bg-white border-[#D8CEBC] text-slate-800'
            }`}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs lowercase font-bold text-[#2E5E88] dark:text-[#5584B4]">
                <img src="/help.jpg" alt="help" className="w-4 h-4 object-contain mix-blend-multiply dark:bg-white dark:rounded-xs dark:p-0.5" />
                <span className="text-slate-400">/</span>
                <img src={encodeURI(currentStepDef.icon)} alt={currentStepDef.name} className="w-4 h-4 object-contain mix-blend-multiply dark:bg-white dark:rounded-xs dark:p-0.5" />
                <span>{currentStepDef.name} assistance</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAssistanceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#2E5E88] dark:text-blue-300">
                <strong>{appDisplayName.toUpperCase()} Purpose:</strong>{' '}
                {mode === 'rolling-forecast'
                  ? 'Stand-alone rolling forecast engine with 1-product unit sales model-set, cost-as-a-percentage-of-revenue calculations, and prior year-end balance sheet baseline inputs.'
                  : 'Comprehensive 3-statement financial simulation engine linking Income Statement, Balance Sheet, and Cash Flow.'}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase mb-1">
                  How to Navigate Steps:
                </h4>
                <ul className="space-y-1 list-disc pl-4">
                  <li>Use the <strong>7 bottom icon buttons</strong> to move across steps (Setup, Revenue, Employment, OPEX, Assets, Funding, Reports).</li>
                  <li>In <strong>Setup</strong>, explore <em>assumptions</em>, <em>results</em> (12-month calendar and base rates), and <em>charts</em>.</li>
                  <li>Use the <strong>dynamic base rate adjustment tool</strong> to scrub years 1 to 5 and edit effective monthly rates.</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAssistanceModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-[#2E5E88] text-white text-xs font-bold hover:bg-[#254d70] transition-colors cursor-pointer"
                >
                  understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modelling Suite Architecture Modal */}
      <ModellingSuiteModal
        theme={theme}
        isOpen={showSuiteModal}
        onClose={() => setShowSuiteModal(false)}
        currentApp={mode}
        onSelectApp={(appId) => {
          setShowSuiteModal(false);
          onSelectAppTab(appId as any);
        }}
      />
    </div>
  );
};

export default BizzModelLayout;
