import React, { useState, useEffect } from 'react';
import { BizzModelStep } from '../../../types';
import {
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ArrowLeft,
  Edit3,
  FileText,
} from 'lucide-react';

interface BizzPlanLayoutProps {
  appName?: string;
  currentStepId: string;
  steps: BizzModelStep[];
  onStepChange: (stepId: string) => void;
  onContextSwitch: (context: string) => void;
  onClose: () => void;
  onSave?: () => void;
  savedNotice?: boolean;
  businessName?: string;
  rightPanel: React.ReactNode;
  children: React.ReactNode;
  theme?: 'light' | 'dark';
  embeddedInModel?: boolean;
  onBackToModel?: () => void;
  backToModelLabel?: string;
  isPitchDeckActive?: boolean;
  onTogglePitchDeck?: (active: boolean) => void;
}

export default function BizzPlanLayout({
  currentStepId,
  steps,
  onStepChange,
  onContextSwitch,
  onClose,
  onSave,
  savedNotice = false,
  businessName,
  rightPanel,
  children,
  theme = 'light',
  embeddedInModel = false,
  onBackToModel,
  backToModelLabel = 'back to bizzmodel step',
  isPitchDeckActive = false,
  onTogglePitchDeck,
}: BizzPlanLayoutProps) {
  const isDark = theme === 'dark';
  const [mobilePane, setMobilePane] = useState<'edit' | 'preview'>('edit');

  const currentIdx = Math.max(
    0,
    steps.findIndex((s) => s.id === currentStepId)
  );
  const activeStep = steps[currentIdx] || steps[0];

  const handlePrev = () => {
    if (currentIdx > 0) {
      onStepChange(steps[currentIdx - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIdx < steps.length - 1) {
      onStepChange(steps[currentIdx + 1].id);
    }
  };

  // Optional keyboard navigation for the synchronized header slider (Alt + Left/Right)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIdx > 0) onStepChange(steps[currentIdx - 1].id);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIdx < steps.length - 1) onStepChange(steps[currentIdx + 1].id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentIdx, steps, onStepChange]);

  return (
    <div
      className={`w-full h-full flex-1 flex flex-col font-mono transition-colors overflow-hidden rounded-2xl ${
        isDark ? 'bg-[#0A0D14] text-slate-100' : 'bg-[#FAF8F5] text-slate-900'
      }`}
    >
      {/* ===================================================================== */}
      {/* 1. TOP APPLICATION HEADER BAR (STANDALONE MODE ONLY)                  */}
      {/* ===================================================================== */}
      {!embeddedInModel && (
        <header
          className={`px-4 sm:px-6 py-2.5 min-h-[52px] border-b flex flex-wrap items-center justify-between gap-3 shrink-0 no-print ${
            isDark ? 'bg-[#161C30] border-[#222F4C]' : 'bg-[#F4EFE6]/95 border-[#D8CEBC]'
          }`}
        >
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { id: 'bizzcalc', label: 'bizzcalc' },
              { id: 'bizzdynamics', label: 'bizzdynamics' },
              { id: 'rolling-forecast', label: 'bizzoptimizer' },
              { id: 'bizzmodel', label: 'bizzmodel' },
              { id: 'bizzplan', label: 'bizzplan' },
            ].map((tab) => {
              const isSelected = tab.id === 'bizzplan' && !isPitchDeckActive;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onTogglePitchDeck?.(false);
                    onContextSwitch(tab.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap lowercase tracking-wider border cursor-pointer ${
                    isSelected
                      ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                      : isDark
                      ? 'bg-[#101626] text-slate-400 hover:text-white border-[#252E4A] hover:border-slate-500'
                      : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC] hover:border-[#2E5E88]/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
            {onTogglePitchDeck && (
              <button
                type="button"
                onClick={() => onTogglePitchDeck(!isPitchDeckActive)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap lowercase tracking-wider border cursor-pointer ${
                  isPitchDeckActive
                    ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                    : isDark
                    ? 'bg-[#101626] text-[#7FAADC] hover:text-white border-[#252E4A] hover:border-[#5584B4]'
                    : 'bg-white text-[#2E5E88] hover:bg-[#2E5E88]/5 border-[#2E5E88]/40'
                }`}
              >
                pitch deck
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {savedNotice && (
              <span className="text-[11px] font-bold lowercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>saved</span>
              </span>
            )}

            {onSave && (
              <button
                type="button"
                onClick={onSave}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold lowercase transition-colors border cursor-pointer ${
                  isDark
                    ? 'bg-[#101626] text-slate-200 border-[#252E4A] hover:bg-[#2E5E88] hover:border-[#2E5E88]'
                    : 'bg-white text-[#2E5E88] border-[#D8CEBC] hover:bg-[#2E5E88] hover:text-white hover:border-[#2E5E88]'
                }`}
              >
                <Save size={13} />
                <span>save plan</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#252E4A] text-slate-400 hover:text-white hover:border-slate-500'
                  : 'border-[#D8CEBC] text-slate-500 hover:text-slate-900 hover:border-[#2E5E88]/60 bg-white'
              }`}
              title="Close BizzPlan"
            >
              <X size={16} />
            </button>
          </div>
        </header>
      )}

      {/* ===================================================================== */}
      {/* 2. SYNCHRONIZED SECTION SLIDER HEADER (REPLACES LEFT SIDEBAR MENU)    */}
      {/* Synchronized across both the Left Editor Pane & Right Print Pane      */}
      {/* ===================================================================== */}
      <div
        className={`px-4 sm:px-6 py-2 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 no-print ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-[#F2EDE4] border-[#D8CEBC]'
        }`}
      >
        {/* Left label / business context */}
        <div className="hidden md:flex items-center gap-2 min-w-0">
          <div className="h-6 w-6 rounded-full overflow-hidden border border-[#D8CEBC] dark:border-[#222F4C] bg-white shrink-0">
            <img
              src="/bizzbean-favicon.jpg"
              alt="bizzplan"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs font-bold lowercase text-[#2E5E88] dark:text-[#5584B4] truncate">
            bizzplan
          </span>
          {businessName && (
            <>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-xs lowercase text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                {businessName}
              </span>
            </>
          )}
        </div>

        {/* Synchronized Slider: [ <- ] [ Section Selector (x / N) ] [ -> ] */}
        <div className="flex items-center gap-2 mx-auto md:mx-0">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIdx <= 0}
            aria-label="Previous section"
            title="Previous section (Alt + Left)"
            className={`h-8 w-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-[#161C30] border-[#252E4A] text-slate-200 hover:border-[#5584B4]'
                : 'bg-white border-[#D8CEBC] text-[#2E5E88] hover:border-[#2E5E88]'
            }`}
          >
            <ChevronLeft size={15} />
          </button>

          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-xl border min-w-[230px] sm:min-w-[290px] ${
              isDark
                ? 'bg-[#161C30] border-[#5584B4]/50 text-white'
                : 'bg-white border-[#2E5E88]/40 text-[#2E5E88] shadow-2xs'
            }`}
          >
            <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md bg-[#2E5E88]/10 text-[#2E5E88] dark:bg-[#5584B4]/20 dark:text-[#7FAADC] shrink-0">
              {String(currentIdx + 1).padStart(2, '0')}/{String(steps.length).padStart(2, '0')}
            </span>

            <select
              aria-label="Select business plan section"
              value={currentStepId}
              onChange={(e) => onStepChange(e.target.value)}
              className="flex-1 bg-transparent text-xs font-bold lowercase focus:outline-none cursor-pointer truncate pr-1"
            >
              {steps.map((step, idx) => (
                <option
                  key={step.id}
                  value={step.id}
                  className={isDark ? 'bg-[#101626] text-white' : 'bg-white text-slate-900'}
                >
                  {String(idx + 1).padStart(2, '0')}. {step.title}
                  {step.isCompleted ? ' ✓' : ''}
                </option>
              ))}
            </select>

            {activeStep?.isCompleted && (
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIdx >= steps.length - 1}
            aria-label="Next section"
            title="Next section (Alt + Right)"
            className={`h-8 w-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-[#161C30] border-[#252E4A] text-slate-200 hover:border-[#5584B4]'
                : 'bg-white border-[#D8CEBC] text-[#2E5E88] hover:border-[#2E5E88]'
            }`}
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Mobile pane switcher (< lg), Embedded Save/Return, & Desktop sync indicator */}
        <div className="flex items-center gap-2">
          {embeddedInModel && savedNotice && (
            <span className="text-[11px] font-bold lowercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={13} />
              <span>saved</span>
            </span>
          )}

          {embeddedInModel && onSave && (
            <button
              type="button"
              onClick={onSave}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold lowercase transition-colors border cursor-pointer ${
                isDark
                  ? 'bg-[#161C30] text-slate-200 border-[#252E4A] hover:bg-[#2E5E88] hover:border-[#2E5E88]'
                  : 'bg-white text-[#2E5E88] border-[#D8CEBC] hover:bg-[#2E5E88] hover:text-white hover:border-[#2E5E88]'
              }`}
            >
              <Save size={12} />
              <span>save</span>
            </button>
          )}

          {embeddedInModel && onBackToModel && (
            <button
              type="button"
              onClick={onBackToModel}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold lowercase border transition-all cursor-pointer whitespace-nowrap ${
                isDark
                  ? 'bg-[#161C30] text-slate-200 border-[#252E4A] hover:border-[#5584B4]'
                  : 'bg-white text-[#2E5E88] border-[#D8CEBC] hover:border-[#2E5E88]'
              }`}
            >
              <ArrowLeft size={12} />
              <span>{backToModelLabel}</span>
            </button>
          )}

          <div className="flex lg:hidden items-center gap-1 p-0.5 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] bg-white dark:bg-[#161C30]">
            <button
              type="button"
              onClick={() => setMobilePane('edit')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold lowercase flex items-center gap-1 cursor-pointer ${
                mobilePane === 'edit'
                  ? 'bg-[#2E5E88] text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Edit3 size={11} />
              <span>edit</span>
            </button>
            <button
              type="button"
              onClick={() => setMobilePane('preview')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold lowercase flex items-center gap-1 cursor-pointer ${
                mobilePane === 'preview'
                  ? 'bg-[#2E5E88] text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <FileText size={11} />
              <span>print view</span>
            </button>
          </div>

          <span className="hidden lg:inline-flex items-center gap-1.5 text-[10px] font-bold lowercase text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>live print sync</span>
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. TWO-PANEL WORKSPACE: LEFT = WIDE DATA ENTRY | RIGHT = PRINT READY  */}
      {/* ===================================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden print:block print:overflow-visible">
        {/* LEFT-HAND PANEL: Wide Data-Entry Studio (or Full-Width Pitch Deck Studio) */}
        <main
          className={`w-full ${isPitchDeckActive ? 'flex-1' : 'lg:w-1/2'} overflow-y-auto p-4 sm:p-6 no-print ${
            mobilePane === 'edit' || isPitchDeckActive ? 'block flex-1 lg:flex-none' : 'hidden lg:block'
          } ${isDark ? 'bg-[#0A0D14]' : 'bg-[#FAF8F5]'}`}
        >
          {children}
        </main>

        {/* RIGHT-HAND PANEL: Synchronized Print-Ready A4 Presentation */}
        {!isPitchDeckActive && (
          <section
            className={`w-full lg:w-1/2 overflow-y-auto print:w-full print:overflow-visible border-t lg:border-t-0 lg:border-l print:border-none ${
              mobilePane === 'preview' ? 'block flex-1 lg:flex-none' : 'hidden lg:block'
            } ${
              isDark
                ? 'bg-[#0D1220] border-[#222F4C]'
                : 'bg-[#EDE7DC]/70 border-[#D8CEBC]'
            }`}
          >
            {rightPanel}
          </section>
        )}
      </div>
    </div>
  );
}
