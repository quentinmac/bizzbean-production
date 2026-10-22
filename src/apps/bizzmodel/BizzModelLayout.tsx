import React, { useState } from 'react';
import {
  Calculator,
  TrendingUp,
  FileText,
  Sliders,
  Maximize2,
  Minimize2,
  Trash2,
  X,
  Layers,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { BizzModelState } from './constants';

interface BizzModelLayoutProps {
  theme?: 'light' | 'dark';
  mode: 'bizzdynamics' | 'bizzmodel';
  activeAppTab: 'bizzcalc' | 'bizzdynamics' | 'bizzmodel' | 'hi-level-forecast' | 'bizzplan' | 'reports';
  onSelectAppTab: (tab: 'bizzcalc' | 'bizzdynamics' | 'bizzmodel' | 'hi-level-forecast' | 'bizzplan' | 'reports') => void;
  activeStep: string;
  onSelectStep: (step: string) => void;
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
  onClose,
  children,
}) => {
  const isDark = theme === 'dark';
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const steps = [
    { id: 'setup', label: 'SETUP', stepNumber: 1, icon: '/business details.jpg' },
    { id: 'revenue', label: 'REVENUE CALCULATOR', stepNumber: 2, icon: '/revenue calculator.jpg' },
    { id: 'employment', label: 'EMPLOYMENT', stepNumber: 3, icon: '/employment.jpg' },
    { id: 'opex', label: 'OPERATING EXPENSES', stepNumber: 4, icon: '/operating expenses.jpg' },
    { id: 'fixed-assets', label: 'FIXED ASSETS', stepNumber: 5, icon: '/fixed assets.jpg' },
    { id: 'funding', label: 'FUNDING', stepNumber: 6, icon: '/funding calculator.jpg' },
    { id: 'reports', label: 'REPORTS', stepNumber: 7, icon: '/reports.jpg' },
  ];

  const appTabs = [
    { id: 'bizzcalc', label: 'BIZZCALC' },
    { id: 'bizzdynamics', label: 'BIZZDYNAMICS' },
    { id: 'bizzmodel', label: 'BIZZMODEL' },
    { id: 'hi-level-forecast', label: 'HI-LEVEL FORECAST' },
    { id: 'bizzplan', label: 'BIZZPLAN' },
    { id: 'reports', label: 'REPORTS' },
  ];

  return (
    <div
      className={`w-full min-h-full flex flex-col font-mono select-none transition-colors ${
        isDark ? 'bg-[#0A0D14] text-slate-100' : 'bg-[#FAF8F5] text-slate-900'
      } ${isExpanded ? 'h-full overflow-y-auto' : ''}`}
    >
      {/* ===================================================================== */}
      {/* 1. TOP HEADER APP TABS BAR (DIRECTLY MATCHING VIDEO AT 00:13 - 00:20) */}
      {/* ===================================================================== */}
      <header
        className={`px-4 sm:px-6 py-2.5 border-b shrink-0 flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        {/* App Switcher Tabs matching video header */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {appTabs.map((tab) => {
            const isSelected = activeAppTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectAppTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap uppercase tracking-wider border ${
                  isSelected
                    ? isDark
                      ? 'bg-[#1E2548] text-white border-[#5584B4] shadow-xs'
                      : 'bg-[#12172A] text-white border-[#12172A] shadow-xs'
                    : isDark
                    ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Action Buttons matching video: [EXPAND PANEL] [BIN DRAG] LIVE [X] */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-[#D8CEBC] dark:border-[#252E4A] hover:bg-slate-100 dark:hover:bg-[#1E2548] text-slate-600 dark:text-slate-300 transition-colors uppercase"
            title="Expand panel"
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isExpanded ? 'Collapse' : 'Expand Panel'}</span>
          </button>

          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE</span>
          </span>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Close platform app"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. SUBHEADER BREADCRUMB                                               */}
      {/* ===================================================================== */}
      <div
        className={`px-4 sm:px-6 py-2 border-b flex items-center justify-between gap-3 text-xs shrink-0 ${
          isDark ? 'bg-[#0E1322] border-[#1D2644]' : 'bg-[#F4EFE6] border-[#E8E2D8]'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#5584B4] uppercase tracking-wider">
            {activeAppTab.toUpperCase()}
          </span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-600 dark:text-slate-300 uppercase">
            {activeStep.toUpperCase()}
          </span>
        </div>

        <div className="text-[11px] text-slate-500 hidden sm:block">
          {mode === 'bizzdynamics' ? '● Learning Mode: Guided Simulation' : '● Institutional Mode: Venture Financials Engine'}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. MAIN BODY WITH LEFT STEP SIDEBAR (MATCHING VIDEO AT 00:13 - 00:20) */}
      {/* ===================================================================== */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* LEFT VERTICAL STEP SIDEBAR (Rendered when in bizzdynamics / bizzmodel) */}
        {(activeAppTab === 'bizzdynamics' || activeAppTab === 'bizzmodel') && (
          <aside
            className={`w-48 sm:w-56 shrink-0 border-r p-3 space-y-1.5 overflow-y-auto ${
              isDark ? 'bg-[#0E1322] border-[#1D2644]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider">
              SIMULATION STEPS
            </div>

            {steps.map((st) => {
              const isCurrent = activeStep === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => onSelectStep(st.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                    isCurrent
                      ? isDark
                        ? 'bg-[#1E2548] text-white border-[#5584B4] shadow-xs'
                        : 'bg-[#12172A] text-white border-[#12172A] shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-[#161F38] border-transparent'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-[#FAF8F5] border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <img
                      src={encodeURI(st.icon)}
                      alt={st.label}
                      className="w-4 h-4 object-contain shrink-0 mix-blend-multiply dark:bg-white dark:rounded dark:p-0.5"
                    />
                    <span className="truncate">{st.label}</span>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                      isCurrent
                        ? 'bg-white/20 text-white'
                        : isDark
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    0{st.stepNumber}
                  </span>
                </button>
              );
            })}
          </aside>
        )}

        {/* CENTER WORK AREA */}
        <main className="flex-grow overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
