import React, { useState } from 'react';
import { FileSpreadsheet, X } from 'lucide-react';
import { ModellingSuiteModal } from '../bizzdynamics/components/ModellingSuiteModal';
import { PlatformHelpModal } from '../../components/PlatformHelpModal';
import { PlatformHelpStepId } from '../../services/platformHelpService';

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
  fundingTab?: 'dynamics' | 'what-if' | 'actions-to-improve';
  onSelectFundingTab?: (tab: 'dynamics' | 'what-if' | 'actions-to-improve') => void;
  isBizzPlanTabActive?: boolean;
  onSelectBizzPlanTab?: (active: boolean) => void;
  isPitchDeckTabActive?: boolean;
  onSelectPitchDeckTab?: (active: boolean) => void;
  isBizzBoxTabActive?: boolean;
  onSelectBizzBoxTab?: (active: boolean) => void;
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
  isPitchDeckTabActive = false,
  onSelectPitchDeckTab,
  isBizzBoxTabActive = false,
  onSelectBizzBoxTab,
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
    if (onSelectPitchDeckTab) onSelectPitchDeckTab(false);
    if (onSelectBizzBoxTab) onSelectBizzBoxTab(false);
    if (onSelectStepSubTab) onSelectStepSubTab(tab);
    if (onSelectSetupTab) onSelectSetupTab(tab);
    setInternalSubTab(tab);
  };

  // Funding specific tabs (dynamics | what if | actions to improve)
  const [internalFundingTab, setInternalFundingTab] = useState<'dynamics' | 'what-if' | 'actions-to-improve'>(() => {
    try {
      const saved = localStorage.getItem('bizz_funding_subtab');
      if (saved === 'dynamics' || saved === 'what-if' || saved === 'actions-to-improve') return saved;
    } catch {}
    return 'dynamics';
  });

  const currentFundingTab = fundingTabProp ?? internalFundingTab;

  const handleSelectFundingTab = (tab: 'dynamics' | 'what-if' | 'actions-to-improve') => {
    try {
      localStorage.setItem('bizz_funding_subtab', tab);
      window.dispatchEvent(new CustomEvent('bizz_funding_tab_change', { detail: tab }));
    } catch {}
    if (onSelectBizzPlanTab) onSelectBizzPlanTab(false);
    if (onSelectPitchDeckTab) onSelectPitchDeckTab(false);
    if (onSelectBizzBoxTab) onSelectBizzBoxTab(false);
    if (onSelectFundingTab) onSelectFundingTab(tab);
    setInternalFundingTab(tab);
  };

  // Modals for Assistance Guidance and Modelling Suite navigation
  const [showAssistanceModal, setShowAssistanceModal] = useState<boolean>(false);
  const [showSuiteModal, setShowSuiteModal] = useState<boolean>(false);

  // Resolve lowercase display name & mode
  const isRollingForecast = mode === 'rolling-forecast' || activeAppTab === 'rolling-forecast';
  const showBizzPlanTab = Boolean(onSelectBizzPlanTab) && !isRollingForecast;
  const appDisplayName = isRollingForecast
    ? 'bizzoptimizer'
    : mode === 'bizzdynamics' || activeAppTab === 'bizzdynamics'
    ? 'bizzdynamics'
    : 'bizzmodel';

  // Streamlined 5-Step dock for BizzOptimizer (excludes Revenue Calculator, Employment, Operating Expenses)
  // Full 7-Step dock preserved intact for BizzModel & BizzDynamics
  const STEPS: Array<{
    id: string;
    num: number;
    name: string;
    icon: string;
    useSpreadsheetIcon?: boolean;
    description: string;
  }> = isRollingForecast
    ? [
        { id: 'setup', num: 1, name: 'business details', icon: '/business details.jpg', description: 'business details, update month & macro rates' },
        { id: 'ytd-actuals', num: 2, name: 'actuals ytd', icon: '/reports.jpg', useSpreadsheetIcon: true, description: 'ytd trading account & balance sheet actuals' },
        { id: 'fixed-assets', num: 3, name: 'fixed assets', icon: '/fixed assets.jpg', description: 'opening fixed assets & planned capex' },
        { id: 'funding', num: 4, name: 'funding calculator', icon: '/funding calculator.jpg', description: 'capital structure, what-if & actions to improve' },
        { id: 'reports', num: 5, name: 'reports', icon: '/reports.jpg', description: '60-month 3-statement financial reports' },
      ]
    : [
        { id: 'setup', num: 1, name: 'business details', icon: '/business details.jpg', description: 'business details & operating rhythms' },
        { id: 'revenue', num: 2, name: 'revenue calculator', icon: '/revenue calculator.jpg', description: 'revenue calculator & pricing dynamics' },
        { id: 'employment', num: 3, name: 'employment', icon: '/employment.jpg', description: 'key organizational team' },
        { id: 'opex', num: 4, name: 'operating expenses', icon: '/operating expenses.jpg', description: 'operating overheads & distribution' },
        { id: 'fixed-assets', num: 5, name: 'fixed assets', icon: '/fixed assets.jpg', description: 'capital expenditure & depreciation' },
        { id: 'funding', num: 6, name: 'funding calculator', icon: '/funding calculator.jpg', description: 'capital structure & working capital' },
        { id: 'reports', num: 7, name: 'reports', icon: '/reports.jpg', description: 'authentic v1 financial reports' },
      ];

  const currentStepDef = STEPS.find((s) => s.id === activeStep) || STEPS[0];

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
        <div className="flex items-center gap-2.5 flex-1 max-w-4xl overflow-x-auto scrollbar-none">
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

          {/* Function tabs + integrated free bizzplan & pitch deck tabs on every step */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {activeStep === 'reports' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onSelectBizzPlanTab?.(false);
                    onSelectPitchDeckTab?.(false);
                  }}
                  className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold lowercase transition-all border cursor-pointer whitespace-nowrap ${
                    !isBizzPlanTabActive && !isPitchDeckTabActive
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
                    onClick={() => {
                      onSelectPitchDeckTab?.(false);
                      onSelectBizzPlanTab(true);
                    }}
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
                {showBizzPlanTab && onSelectPitchDeckTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBizzPlanTab?.(false);
                      onSelectPitchDeckTab(true);
                    }}
                    className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold lowercase transition-all border cursor-pointer whitespace-nowrap ${
                      isPitchDeckTabActive
                        ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                        : 'bg-white text-[#2E5E88] hover:bg-[#2E5E88]/5 border-[#2E5E88]/40'
                    }`}
                  >
                    pitch deck
                  </button>
                )}
              </>
            ) : activeStep === 'funding' ? (
              <>
                {[
                  { id: 'dynamics', label: 'dynamics' },
                  { id: 'what-if', label: 'what if' },
                  ...(isRollingForecast
                    ? [{ id: 'actions-to-improve', label: 'actions to improve' }]
                    : []),
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectFundingTab(tab.id as any)}
                    className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold lowercase transition-all border cursor-pointer whitespace-nowrap ${
                      !isBizzPlanTabActive && !isPitchDeckTabActive && currentFundingTab === tab.id
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
                    onClick={() => {
                      onSelectPitchDeckTab?.(false);
                      onSelectBizzPlanTab(true);
                    }}
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
                {showBizzPlanTab && onSelectPitchDeckTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBizzPlanTab?.(false);
                      onSelectPitchDeckTab(true);
                    }}
                    className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold lowercase transition-all border cursor-pointer whitespace-nowrap ${
                      isPitchDeckTabActive
                        ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                        : 'bg-white text-[#2E5E88] hover:bg-[#2E5E88]/5 border-[#2E5E88]/40'
                    }`}
                  >
                    pitch deck
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
                      !isBizzPlanTabActive && !isPitchDeckTabActive && !isBizzBoxTabActive && currentSubTab === tab.id
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
                    onClick={() => {
                      onSelectPitchDeckTab?.(false);
                      onSelectBizzBoxTab?.(false);
                      onSelectBizzPlanTab(true);
                    }}
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
                {showBizzPlanTab && onSelectPitchDeckTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBizzPlanTab?.(false);
                      onSelectBizzBoxTab?.(false);
                      onSelectPitchDeckTab(true);
                    }}
                    className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold lowercase transition-all border cursor-pointer whitespace-nowrap ${
                      isPitchDeckTabActive
                        ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                        : 'bg-white text-[#2E5E88] hover:bg-[#2E5E88]/5 border-[#2E5E88]/40'
                    }`}
                  >
                    pitch deck
                  </button>
                )}
                {activeStep === 'revenue' && onSelectBizzBoxTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBizzPlanTab?.(false);
                      onSelectPitchDeckTab?.(false);
                      onSelectBizzBoxTab(true);
                    }}
                    className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold lowercase transition-all border cursor-pointer whitespace-nowrap ${
                      isBizzBoxTabActive
                        ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                        : 'bg-white text-[#2E5E88] hover:bg-[#2E5E88]/5 border-[#2E5E88]/40'
                    }`}
                  >
                    bizzbox
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
                  onSelectPitchDeckTab?.(false);
                  onSelectBizzBoxTab?.(false);
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
                  {st.useSpreadsheetIcon ? (
                    <FileSpreadsheet
                      className={`w-4.5 h-4.5 ${
                        isActive
                          ? 'text-[#2E5E88] dark:text-[#7BB1E3]'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    />
                  ) : (
                    <img
                      src={encodeURI(st.icon)}
                      alt={st.name}
                      className="w-full h-full object-contain mix-blend-multiply dark:bg-white dark:rounded dark:p-0.5"
                    />
                  )}
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
      <PlatformHelpModal
        isOpen={showAssistanceModal}
        onClose={() => setShowAssistanceModal(false)}
        appId={isRollingForecast ? 'rolling-forecast' : 'bizzmodel'}
        stepId={(currentStepDef.id as PlatformHelpStepId) || 'setup'}
        stepIcon={currentStepDef.icon}
        theme={theme}
      />

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
