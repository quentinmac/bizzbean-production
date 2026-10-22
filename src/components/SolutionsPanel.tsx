import React, { useState } from 'react';
import { BIZZ_SOLUTIONS } from '../data/bizzdeskData';
import {
  ChevronRight,
  Info,
  MessageSquare,
  Library,
  Mail,
  Bot,
  HelpCircle,
  Sparkles,
  Layers,
  BookOpen,
} from 'lucide-react';

interface SolutionsPanelProps {
  activeSolutionId: string;
  activeStageId?: string;
  theme: 'light' | 'dark';
  companyName?: string;
  isAdmin?: boolean;
  onSelectSolution: (id: string) => void;
  onSelectAbout: () => void;
  onSelectLibrary?: () => void;
  onOpenTalkToUs?: () => void;
  onSelectWorkspace: () => void;
  onSelectFooter: () => void;
  onSelectAdminCentre?: () => void;
  onSelectEducationCentre?: () => void;
  onSelectBizzClass?: () => void;
  onActivateDialogue?: () => void;
  activeKbTab?: string;
  panelMode?: 'solutions' | 'knowledge';
  onTogglePanelMode?: (mode: 'solutions' | 'knowledge') => void;
}

export const SolutionsPanel: React.FC<SolutionsPanelProps> = ({
  activeSolutionId,
  activeStageId,
  theme,
  companyName,
  isAdmin = false,
  onSelectSolution,
  onSelectAbout,
  onSelectLibrary,
  onOpenTalkToUs,
  onSelectWorkspace,
  onSelectFooter,
  onSelectAdminCentre,
  onSelectEducationCentre,
  onSelectBizzClass,
  onActivateDialogue,
  activeKbTab,
  panelMode,
  onTogglePanelMode,
}) => {
  const isDark = theme === 'dark';

  // Subtle 'in use' button styling: replaces harsh dark background with panel accent font color and soft tint
  const getSubtleActiveBtnClass = (isActive: boolean) => {
    if (isActive) {
      return isDark
        ? 'text-[#D4A373] bg-[#1E2548]/30 font-bold border border-[#5584B4]/40 shadow-2xs'
        : 'text-[#8C6D3F] bg-[#F2ECE1]/70 font-bold border border-[#D8CEBC] shadow-2xs';
    }
    return isDark
      ? 'text-slate-300 hover:text-white hover:bg-[#161C30] border border-transparent'
      : 'text-slate-700 hover:text-slate-900 hover:bg-[#F4EFE6] border border-transparent';
  };

  // Internal mode state with fallback to prop if controlled
  const [internalMode, setInternalMode] = useState<'solutions' | 'knowledge'>(
    panelMode || 'solutions'
  );

  const currentMode = panelMode !== undefined ? panelMode : internalMode;

  const handleModeChange = (mode: 'solutions' | 'knowledge') => {
    setInternalMode(mode);
    if (onTogglePanelMode) {
      onTogglePanelMode(mode);
    }
  };

  const startupSolutions = BIZZ_SOLUTIONS.filter(
    (s) => s.category === 'startup' && s.id !== 'learn-earn-capital' && s.id !== 'bizzdynamics'
  );
  const operationsSolutions = BIZZ_SOLUTIONS.filter((s) => s.category === 'operations');
  const growthSolutions = BIZZ_SOLUTIONS.filter((s) => s.category === 'growth');
  const educationSolutions = BIZZ_SOLUTIONS.filter(
    (s) =>
      s.category === 'education' &&
      s.id !== 'learn-earn-capital' &&
      s.id !== 'education-centre'
  );

  return (
    <aside
      className={`w-full lg:w-76 border-r lg:border lg:rounded-2xl flex flex-col justify-between overflow-y-auto overflow-x-hidden select-none shrink-0 h-full transition-colors ${
        isDark ? 'bg-[#101424] border-[#252E4A] lg:shadow-xs' : 'bg-[#FAF8F5] border-[#E8E2D8] lg:shadow-xs'
      }`}
    >
      {/* ===================================================================== */}
      {/* 1. TOP HEADER SELECTOR: SOLUTIONS PANEL vs KNOWLEDGE BASE             */}
      {/* (Per mobile design proposal 2: Select SOLUTIONS PANEL or KNOWLEDGE BASE) */}
      {/* ===================================================================== */}
      <div
        className={`p-2.5 sm:p-3 border-b shrink-0 flex items-center gap-1.5 ${
          isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#F4EFE6]/80 border-[#E8E2D8]'
        }`}
      >
        <button
          type="button"
          onClick={() => handleModeChange('solutions')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-mono font-bold tracking-wider uppercase transition-all border ${
            currentMode === 'solutions'
              ? isDark
                ? 'bg-[#1E2548] text-[#D4A373] border-[#5584B4] shadow-xs'
                : 'bg-[#F2ECE1] text-[#8C6D3F] border-[#D8CEBC] shadow-xs'
              : isDark
              ? 'bg-[#121728] text-slate-400 hover:text-white border-[#222E4E]'
              : 'bg-white/70 text-slate-600 hover:text-slate-900 border-[#E8E2D8]'
          }`}
        >
          SOLUTIONS PANEL
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('knowledge')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-mono font-bold tracking-wider uppercase transition-all border ${
            currentMode === 'knowledge'
              ? isDark
                ? 'bg-[#1E2548] text-[#D4A373] border-[#5584B4] shadow-xs'
                : 'bg-[#F2ECE1] text-[#8C6D3F] border-[#D8CEBC] shadow-xs'
              : isDark
              ? 'bg-[#121728] text-slate-400 hover:text-white border-[#222E4E]'
              : 'bg-white/70 text-slate-600 hover:text-slate-900 border-[#E8E2D8]'
          }`}
        >
          KNOWLEDGE BASE
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 2. BODY CONTENT: BASED ON SELECTION                                   */}
      {/* ===================================================================== */}
      <div className="p-3 space-y-4 flex-grow overflow-y-auto">
        {/* A. KNOWLEDGE BASE SELECTION: DIALOGUE, ASSISTANT, or LIBRARY */}
        {currentMode === 'knowledge' ? (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            <div className="px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Select Knowledge Service
            </div>

            {/* 1. DIALOGUE (Engage Coach GIM AI-Loop) */}
            <button
              type="button"
              onClick={() => {
                if (onActivateDialogue) onActivateDialogue();
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-xs transition-all border ${getSubtleActiveBtnClass(
                activeKbTab === 'dialogue'
              )}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-[#5584B4]/20 border border-[#5584B4]/40 text-[#5584B4] shrink-0">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="text-left font-mono min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold uppercase tracking-wider text-xs">DIALOGUE</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block truncate mt-0.5">
                    engage gim coach · ai-loop
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
            </button>

            {/* 2. TALK TO US (Direct Access to Dialogue Centre in Administration Centre) */}
            <button
              type="button"
              onClick={() => {
                if (onOpenTalkToUs) {
                  onOpenTalkToUs();
                } else if (onSelectAdminCentre) {
                  onSelectAdminCentre();
                }
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-xs transition-all border ${getSubtleActiveBtnClass(
                activeSolutionId === 'administration-centre'
              )}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-[#5584B4]/20 border border-[#5584B4]/40 text-[#5584B4] shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="text-left font-mono min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold uppercase tracking-wider text-xs">TALK TO US</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#5584B4]/20 text-[#5584B4] dark:text-[#DDEBF7] font-bold uppercase">
                      dialogue
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block truncate mt-0.5">
                    talk to us dialogue centre
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
            </button>
          </div>
        ) : (
          /* B. SOLUTIONS PANEL SELECTION (Clean List Without Standalone Dialogue/Library Spillover) */
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* ABOUT BIZZBEAN Button */}
            <div>
              {(() => {
                const displayAboutLabel = isAdmin
                  ? 'about bizzbean'
                  : (companyName ? `about ${companyName}` : 'about bizzbean');

                const isAboutActive = activeSolutionId === 'about-bizzbean';

                return (
                  <button
                    onClick={onSelectAbout}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${getSubtleActiveBtnClass(
                      isAboutActive
                    )}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Info
                        className={`h-3.5 w-3.5 ${
                          isAboutActive
                            ? isDark
                              ? 'text-[#D4A373]'
                              : 'text-[#8C6D3F]'
                            : 'text-[#5584B4]'
                        } shrink-0`}
                      />
                      <span className="lowercase font-semibold truncate">{displayAboutLabel}</span>
                    </div>
                    {isAboutActive ? (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isDark ? 'bg-[#D4A373]' : 'bg-[#8C6D3F]'
                        } shrink-0`}
                      />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
                    )}
                  </button>
                );
              })()}
            </div>

            {/* TALK TO US Button (Replaces LIBRARY sticker and links to Dialogue Centre per user brief) */}
            {(onOpenTalkToUs || onSelectAdminCentre) && (
              <div>
                <button
                  onClick={() => {
                    if (onOpenTalkToUs) {
                      onOpenTalkToUs();
                    } else if (onSelectAdminCentre) {
                      onSelectAdminCentre();
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${getSubtleActiveBtnClass(
                    activeSolutionId === 'administration-centre'
                  )}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail
                      className={`h-3.5 w-3.5 ${
                        activeSolutionId === 'administration-centre'
                          ? isDark
                            ? 'text-[#D4A373]'
                            : 'text-[#8C6D3F]'
                          : 'text-[#5584B4]'
                      } shrink-0`}
                    />
                    <span className="font-semibold uppercase tracking-wider text-xs">talk to us</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono uppercase bg-[#5584B4]/15 text-[#5584B4] dark:text-[#DDEBF7] font-bold">
                    dialogue
                  </span>
                </button>
              </div>
            )}

            {/* STARTUP STAGE */}
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 tracking-wider uppercase px-2 mb-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5584B4]" />
                <span>STARTUP STAGE</span>
              </div>
              <div className="space-y-0.5">
                {startupSolutions.map((sol) => {
                  const isStartupCategory = !['operations', 'growth', 'education'].includes(
                    activeStageId || ''
                  );
                  const isActive =
                    activeStageId === sol.id ||
                    (isStartupCategory && activeSolutionId === sol.id);
                  return (
                    <button
                      key={sol.id}
                      onClick={() => onSelectSolution(sol.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all lowercase ${getSubtleActiveBtnClass(
                        isActive
                      )}`}
                    >
                      <span className={isActive ? 'font-bold' : 'font-normal'}>
                        {sol.name.toLowerCase()}
                      </span>
                      {isActive && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isDark ? 'bg-[#D4A373]' : 'bg-[#8C6D3F]'
                          } shrink-0`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* OPERATIONS */}
            <div>
              <div className="relative group/opheader text-xs font-mono font-bold text-slate-500 tracking-wider uppercase px-2 mb-1 flex items-center justify-between cursor-help">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5584B4]" />
                  <span>OPERATIONS</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                  coming soon
                </span>
                {/* Header Tooltip */}
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none hidden group-hover/opheader:flex items-center">
                  <div className="bg-[#12172A] text-white text-[11px] font-mono font-medium py-1 px-2.5 rounded-lg shadow-xl border border-[#2B3452] whitespace-nowrap animate-in fade-in duration-150">
                    Operations modules will be coming soon
                  </div>
                </div>
              </div>
              <div className="space-y-0.5">
                {operationsSolutions.map((sol) => {
                  const isActive =
                    activeStageId === 'operations' &&
                    (activeSolutionId === sol.id ||
                      (activeSolutionId === 'budget' && sol.id === 'bizzbudget') ||
                      (activeSolutionId === 'bizzbudget' && sol.id === 'bizzbudget'));
                  return (
                    <div key={sol.id} className="relative group/soon">
                      <button
                        onClick={() => onSelectSolution(sol.id)}
                        title="Coming Soon - This element will be coming soon"
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all lowercase ${getSubtleActiveBtnClass(
                          isActive
                        )}`}
                      >
                        <span className={isActive ? 'font-bold' : 'font-normal'}>
                          {sol.name.toLowerCase()}
                        </span>
                        <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold opacity-75 group-hover/soon:opacity-100">
                          soon
                        </span>
                      </button>

                      {/* Tooltip */}
                      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none hidden group-hover/soon:flex items-center">
                        <div className="bg-[#12172A] text-white text-[11px] font-mono font-medium py-1 px-2.5 rounded-lg shadow-xl border border-[#2B3452] whitespace-nowrap animate-in fade-in duration-150">
                          {sol.name} will be coming soon
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GROWTH STAGE */}
            <div>
              <div className="relative group/growthheader text-xs font-mono font-bold text-slate-500 tracking-wider uppercase px-2 mb-1 flex items-center justify-between cursor-help">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5584B4]" />
                  <span>GROWTH STAGE</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                  coming soon
                </span>
                {/* Header Tooltip */}
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none hidden group-hover/growthheader:flex items-center">
                  <div className="bg-[#12172A] text-white text-[11px] font-mono font-medium py-1 px-2.5 rounded-lg shadow-xl border border-[#2B3452] whitespace-nowrap animate-in fade-in duration-150">
                    Growth stage modules will be coming soon
                  </div>
                </div>
              </div>
              <div className="space-y-0.5">
                {growthSolutions.map((sol) => {
                  const isActive = activeStageId === 'growth' && activeSolutionId === sol.id;
                  return (
                    <div key={sol.id} className="relative group/soon">
                      <button
                        onClick={() => onSelectSolution(sol.id)}
                        title="Coming Soon - This element will be coming soon"
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all lowercase ${getSubtleActiveBtnClass(
                          isActive
                        )}`}
                      >
                        <span className={isActive ? 'font-bold' : 'font-normal'}>
                          {sol.name.toLowerCase()}
                        </span>
                        <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold opacity-75 group-hover/soon:opacity-100">
                          soon
                        </span>
                      </button>

                      {/* Tooltip */}
                      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none hidden group-hover/soon:flex items-center">
                        <div className="bg-[#12172A] text-white text-[11px] font-mono font-medium py-1 px-2.5 rounded-lg shadow-xl border border-[#2B3452] whitespace-nowrap animate-in fade-in duration-150">
                          {sol.name} will be coming soon
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* EDUCATIONAL SUPPORT */}
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 tracking-wider uppercase px-2 mb-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5584B4]" />
                <span>EDUCATIONAL SUPPORT</span>
              </div>
              <div className="space-y-0.5">
                {onSelectBizzClass && (
                  <button
                    onClick={onSelectBizzClass}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all lowercase ${getSubtleActiveBtnClass(
                      activeSolutionId === 'bizzclass' || activeSolutionId === 'cost-recovery-calculator'
                    )}`}
                  >
                    <span className={activeSolutionId === 'bizzclass' || activeSolutionId === 'cost-recovery-calculator' ? 'font-bold' : 'font-normal'}>
                      bizzclass — course suite
                    </span>
                    {(activeSolutionId === 'bizzclass' || activeSolutionId === 'cost-recovery-calculator') && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isDark ? 'bg-[#D4A373]' : 'bg-[#8C6D3F]'
                        } shrink-0`}
                      />
                    )}
                  </button>
                )}
                {educationSolutions.map((sol) => {
                  const isActive =
                    (activeStageId === 'education' ||
                      ['videos', 'articles'].includes(activeSolutionId)) &&
                    activeSolutionId === sol.id;
                  return (
                    <button
                      key={sol.id}
                      onClick={() => onSelectSolution(sol.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all lowercase ${getSubtleActiveBtnClass(
                        isActive
                      )}`}
                    >
                      <span className={isActive ? 'font-bold' : 'font-normal'}>
                        {sol.name.toLowerCase()}
                      </span>
                      {isActive && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isDark ? 'bg-[#D4A373]' : 'bg-[#8C6D3F]'
                          } shrink-0`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3. FOOTER SECTION: GOOGLE WORKSPACE & WEBSITE FOOTER                  */}
      {/* ===================================================================== */}
      <div
        className={`p-3 border-t space-y-1 shrink-0 ${
          isDark ? 'bg-[#161C30]/50 border-[#252E4A]' : 'bg-[#F4EFE6]/60 border-[#E8E2D8]'
        }`}
      >
        <button
          onClick={onSelectWorkspace}
          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors lowercase flex items-center justify-between ${getSubtleActiveBtnClass(
            activeSolutionId === 'google-workspace'
          )}`}
        >
          <span>google workspace</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono lowercase bg-[#DDEBF7] text-[#24496B] dark:bg-[#1E3048] dark:text-[#DDEBF7] font-semibold">
            sync
          </span>
        </button>

        <button
          onClick={onSelectFooter}
          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors lowercase ${getSubtleActiveBtnClass(
            activeSolutionId === 'website-footer'
          )}`}
        >
          website footer
        </button>

        {onSelectAdminCentre && (
          <button
            onClick={onSelectAdminCentre}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors lowercase flex items-center justify-between ${getSubtleActiveBtnClass(
              activeSolutionId === 'administration-centre'
            )}`}
          >
            <span>administration centre</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono lowercase bg-[#DDEBF7] text-[#24496B] dark:bg-[#1E3048] dark:text-[#DDEBF7] font-semibold">
              admin
            </span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default SolutionsPanel;
