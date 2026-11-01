import React from 'react';
import { BIZZ_SOLUTIONS } from '../data/bizzdeskData';
import { CmsProduct } from '../data/cmsConsoleData';
import { getDeletedProductIds, getCanonicalCourseId } from '../utils/imageStorage';
import {
  ChevronRight,
  Info,
  Layers,
  Play,
} from 'lucide-react';

interface SolutionsPanelProps {
  activeSolutionId: string;
  activeStageId?: string;
  theme: 'light' | 'dark';
  companyName?: string;
  isAdmin?: boolean;
  cmsProducts?: CmsProduct[];
  onSelectSolution: (id: string) => void;
  onSelectAbout: () => void;
  onSelectLibrary?: () => void;
  onOpenTalkToUs?: () => void;
  onSelectWorkspace: () => void;
  onSelectFooter: () => void;
  onDownloadBook?: () => void;
  onOpenAboutBook?: () => void;
  onSelectAdminCentre?: () => void;
  onSelectEducationCentre?: () => void;
  onSelectBizzClass?: () => void;
  onSelectCourse?: (courseId: string) => void;
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
  cmsProducts,
  onSelectSolution,
  onSelectAbout,
  onSelectLibrary,
  onOpenTalkToUs,
  onSelectWorkspace,
  onSelectFooter,
  onDownloadBook,
  onOpenAboutBook,
  onSelectAdminCentre,
  onSelectEducationCentre,
  onSelectBizzClass,
  onSelectCourse,
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

  const deletedIds = React.useMemo(() => getDeletedProductIds(), [cmsProducts]);

  // Only display the 4 main stages and personal-sandbox container under STARTUP STAGE.
  // All individual sub-solution links (bizzcalc, bizzmodel, bizzplan, cost recovery, etc.)
  // under personal-sandbox have been removed from the main menu panel per user request.
  const STAGE_CONTAINER_IDS = new Set([
    'vi-ability',
    'fund-ability',
    'sustain-ability',
    'invest-ability',
    'personal-sandbox',
  ]);

  const startupSolutions = BIZZ_SOLUTIONS.filter(
    (s) => s.category === 'startup' && STAGE_CONTAINER_IDS.has(s.id)
  );

  // Operations solutions derived strictly from live CMS products, respecting deletions
  const operationsSolutions = React.useMemo(() => {
    if (cmsProducts && Array.isArray(cmsProducts)) {
      const fromCms = cmsProducts.filter(
        (p) =>
          p.stage === 'operations' &&
          !deletedIds.has(p.id) &&
          !deletedIds.has(getCanonicalCourseId(p.id) || '') &&
          !deletedIds.has(p.name?.toLowerCase().trim() || '')
      );
      // Deduplicate by canonical ID / name
      const map = new Map<string, { id: string; name: string }>();
      fromCms.forEach((p) => {
        const canonId = p.type === 'course' ? (getCanonicalCourseId(p.id) || p.id) : (p.id === 'budget' ? 'bizzbudget' : p.id);
        const nameKey = p.name.toLowerCase().trim();
        if (!map.has(canonId) && !map.has(nameKey)) {
          map.set(canonId, { id: canonId, name: p.name });
        }
      });
      return Array.from(map.values());
    }

    // Fallback: exclude deleted products and remove duplicates
    const map = new Map<string, { id: string; name: string }>();
    BIZZ_SOLUTIONS.filter((s) => s.category === 'operations').forEach((s) => {
      const canonId = s.id === 'budget' ? 'bizzbudget' : s.id;
      const nameKey = s.name.toLowerCase().trim();
      if (
        !deletedIds.has(s.id) &&
        !deletedIds.has(canonId) &&
        !deletedIds.has(nameKey) &&
        !map.has(canonId) &&
        !map.has(nameKey)
      ) {
        map.set(canonId, { id: canonId, name: s.name });
      }
    });
    return Array.from(map.values());
  }, [cmsProducts, deletedIds]);

  // Growth solutions derived dynamically from live CMS products, respecting deletions
  const growthSolutions = React.useMemo(() => {
    if (cmsProducts && Array.isArray(cmsProducts)) {
      const fromCms = cmsProducts.filter(
        (p) =>
          p.stage === 'growth' &&
          p.id !== 'strategy' &&
          !deletedIds.has(p.id) &&
          !deletedIds.has(getCanonicalCourseId(p.id) || '') &&
          !deletedIds.has(p.name?.toLowerCase().trim() || '')
      );
      if (fromCms.length > 0) {
        const map = new Map<string, { id: string; name: string }>();
        fromCms.forEach((p) => {
          const canonId = p.id === 'strategy' ? 'growth-strategy' : p.id;
          const nameKey = p.name.toLowerCase().trim();
          if (!map.has(canonId) && !map.has(nameKey)) {
            map.set(canonId, { id: canonId, name: p.name });
          }
        });
        return Array.from(map.values());
      }
    }

    const map = new Map<string, { id: string; name: string }>();
    BIZZ_SOLUTIONS.filter((s) => s.category === 'growth' && s.id !== 'strategy').forEach((s) => {
      const canonId = s.id === 'strategy' ? 'growth-strategy' : s.id;
      const nameKey = s.name.toLowerCase().trim();
      if (
        !deletedIds.has(s.id) &&
        !deletedIds.has(canonId) &&
        !deletedIds.has(nameKey) &&
        !map.has(canonId) &&
        !map.has(nameKey)
      ) {
        map.set(canonId, { id: canonId, name: s.name });
      }
    });
    return Array.from(map.values());
  }, [cmsProducts, deletedIds]);

  const educationSolutions = BIZZ_SOLUTIONS.filter(
    (s) =>
      s.category === 'education' &&
      s.id !== 'learn-earn-capital' &&
      s.id !== 'education-centre'
  );

  return (
    <aside
      className={`w-full lg:w-76 border-r lg:border lg:rounded-2xl flex flex-col justify-between overflow-hidden select-none shrink-0 h-full transition-colors ${
        isDark ? 'bg-[#101424] border-[#252E4A] lg:shadow-xs' : 'bg-[#FAF8F5] border-[#E8E2D8] lg:shadow-xs'
      }`}
    >
      {/* ===================================================================== */}
      {/* 1. TOP HEADER: SOLUTIONS PANEL                                        */}
      {/* (Dedicated header matching KnowledgeBasePanel styling)                 */}
      {/* ===================================================================== */}
      <div
        className={`p-2.5 sm:p-3 border-b shrink-0 flex items-center justify-between min-h-[49px] ${
          isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#F4EFE6]/80 border-[#E8E2D8]'
        }`}
      >
        <div className="flex items-center gap-2 px-1 py-0.5">
          <Layers className="h-4 w-4 text-[#5584B4]" />
          <h2
            className={`font-mono text-xs font-bold tracking-wider uppercase ${
              isDark ? 'text-[#DDEBF7]' : 'text-slate-900'
            }`}
          >
            SOLUTIONS PANEL
          </h2>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. BODY CONTENT: SOLUTIONS DIRECTORY                                  */}
      {/* ===================================================================== */}
      <div className="p-3 space-y-4 flex-grow overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
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

            {(() => {
              const isSpecialView = [
                'about-bizzbean',
                'website-footer',
                'administration-centre',
                'google-workspace',
                'sandbox-library',
                'education-centre',
              ].includes(activeSolutionId);

              return (
                <>
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
                          !isSpecialView &&
                          (activeStageId === sol.id ||
                            (isStartupCategory && activeSolutionId === sol.id));
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
                    <div
                      onClick={() => onSelectSolution('operations')}
                      className={`relative group/opheader text-xs font-mono font-bold tracking-wider uppercase px-2 mb-1 flex items-center justify-between cursor-pointer rounded-lg py-1 transition-colors ${
                        !isSpecialView && activeStageId === 'operations' ? 'bg-[#5584B4]/15 text-[#5584B4]' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="Operations Stage - Click to view stage"
                    >
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
                    {operationsSolutions.length > 0 && (
                      <div className="space-y-0.5">
                        {operationsSolutions.map((sol) => {
                          const isActive =
                            !isSpecialView &&
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
                    )}
                  </div>

                  {/* GROWTH STAGE */}
                  <div>
                    <div
                      onClick={() => onSelectSolution('growth')}
                      className={`relative group/growthheader text-xs font-mono font-bold tracking-wider uppercase px-2 mb-1 flex items-center justify-between cursor-pointer rounded-lg py-1 transition-colors ${
                        !isSpecialView && activeStageId === 'growth' ? 'bg-[#5584B4]/15 text-[#5584B4]' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="Growth Stage - Click to view stage"
                    >
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
                    {growthSolutions.length > 0 && (
                      <div className="space-y-0.5">
                        {growthSolutions.map((sol) => {
                          const isActive = !isSpecialView && activeStageId === 'growth' && activeSolutionId === sol.id;
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
                    )}
                  </div>

                  {/* MEDIA & ARTICLES */}
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-500 tracking-wider uppercase px-2 mb-1 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#5584B4]" />
                      <span>MEDIA & ARTICLES</span>
                    </div>
                    <div className="space-y-0.5">
                      {educationSolutions.map((sol) => {
                        const isActive =
                          !isSpecialView &&
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
                </>
              );
            })()}
        </div>
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

        {/* Dedicated Book Download Button */}
        {onDownloadBook && (
          <button
            type="button"
            onClick={onDownloadBook}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors lowercase flex items-center justify-between cursor-pointer ${getSubtleActiveBtnClass(
              activeSolutionId === 'download-book'
            )}`}
            title="Download our free foundational book 'getting to value' by Quentin G. McCullough"
          >
            <span>download getting to value</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono lowercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold">
              book
            </span>
          </button>
        )}

        {/* About the Book Button (links to CMS YouTube channel walkthrough) */}
        {onOpenAboutBook && (
          <button
            type="button"
            onClick={onOpenAboutBook}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors lowercase flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300`}
            title="Watch the Getting to Value walkthrough on YouTube"
          >
            <span>about the book</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono lowercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-semibold flex items-center gap-1">
              <Play className="h-2.5 w-2.5 fill-current" />
              <span>video</span>
            </span>
          </button>
        )}

        {/* Administration Centre & Operations Sandbox: Strictly restricted to administrators */}
        {isAdmin && (
          <>
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

            <button
              onClick={() => onSelectSolution('operations-sandbox')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors lowercase flex items-center justify-between ${getSubtleActiveBtnClass(
                activeStageId === 'operations-sandbox'
              )}`}
              title="Operations Sandbox: Staging & Incubation Lab for testing unallocated SKU projects (e.g. bizzdynamics)"
            >
              <span>operations sandbox</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono lowercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold">
                staging
              </span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

export default SolutionsPanel;
