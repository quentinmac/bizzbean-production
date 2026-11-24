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

  // Sort education solutions cleanly: videos first, articles right below videos
  const educationSolutions = BIZZ_SOLUTIONS.filter(
    (s) =>
      s.category === 'education' &&
      s.id !== 'learn-earn-capital' &&
      s.id !== 'education-centre'
  ).sort((a, b) => (a.id === 'videos' ? -1 : b.id === 'videos' ? 1 : 0));

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
                <a
                  href="/about"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
                      e.preventDefault();
                      onSelectAbout();
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${getSubtleActiveBtnClass(
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
                </a>
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
                    <div className="text-[11px] font-mono font-bold text-slate-500 tracking-wider uppercase px-2 mb-1">
                      STARTUP STAGE
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
                          <a
                            key={sol.id}
                            href={`/${sol.id}`}
                            onClick={(e) => {
                              if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
                                e.preventDefault();
                                onSelectSolution(sol.id);
                              }
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all lowercase cursor-pointer ${getSubtleActiveBtnClass(
                              isActive
                            )}`}
                          >
                            <span className={isActive ? 'font-bold' : 'font-normal'}>
                              {sol.name.toLowerCase()}
                            </span>
                            {isActive && (
                              <ChevronRight className="h-3.5 w-3.5 opacity-75 shrink-0" />
                            )}
                          </a>
                        );
                      })}
                    </div>
                  </div>

                  {/* OPERATIONS section hidden until meaningful content is introduced (re-enable by toggling SHOW_OPERATIONS_NAV) */}
                  {false && (
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectSolution('operations')}
                        className={`w-full text-left text-[11px] font-mono font-bold tracking-wider uppercase px-2 mb-1 rounded-lg py-1 transition-colors cursor-pointer ${
                          !isSpecialView && activeStageId === 'operations'
                            ? 'text-[#5584B4]'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                        }`}
                      >
                        OPERATIONS
                      </button>
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
                              <button
                                key={sol.id}
                                onClick={() => onSelectSolution(sol.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all lowercase cursor-pointer ${getSubtleActiveBtnClass(
                                  isActive
                                )}`}
                              >
                                <span className={isActive ? 'font-bold' : 'font-normal'}>
                                  {sol.name.toLowerCase()}
                                </span>
                                {isActive && (
                                  <ChevronRight className="h-3.5 w-3.5 opacity-75 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* MEDIA & ARTICLES (Videos, followed cleanly by Articles) */}
                  <div>
                    <div className="text-[11px] font-mono font-bold text-slate-500 tracking-wider uppercase px-2 mb-1">
                      MEDIA & ARTICLES
                    </div>
                    <div className="space-y-0.5">
                      {educationSolutions.map((sol) => {
                        const isActive =
                          !isSpecialView &&
                          (activeStageId === 'education' ||
                            ['videos', 'articles'].includes(activeSolutionId)) &&
                          activeSolutionId === sol.id;
                        return (
                          <a
                            key={sol.id}
                            href={`/${sol.id}`}
                            onClick={(e) => {
                              if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
                                e.preventDefault();
                                onSelectSolution(sol.id);
                              }
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all lowercase cursor-pointer ${getSubtleActiveBtnClass(
                              isActive
                            )}`}
                          >
                            <span className={isActive ? 'font-bold' : 'font-normal'}>
                              {sol.name.toLowerCase()}
                            </span>
                            {isActive && (
                              <ChevronRight className="h-3.5 w-3.5 opacity-75 shrink-0" />
                            )}
                          </a>
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
        className={`p-3 border-t space-y-0.5 shrink-0 ${
          isDark ? 'bg-[#161C30]/50 border-[#252E4A]' : 'bg-[#F4EFE6]/60 border-[#E8E2D8]'
        }`}
      >
        <a
          href="/google-workspace"
          onClick={(e) => {
            if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
              e.preventDefault();
              onSelectWorkspace();
            }
          }}
          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors lowercase flex items-center justify-between cursor-pointer ${getSubtleActiveBtnClass(
            activeSolutionId === 'google-workspace'
          )}`}
        >
          <span>google workspace</span>
          {activeSolutionId === 'google-workspace' && (
            <ChevronRight className="h-3.5 w-3.5 opacity-75 shrink-0" />
          )}
        </a>

        <a
          href="/website-footer"
          onClick={(e) => {
            if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
              e.preventDefault();
              onSelectFooter();
            }
          }}
          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors lowercase flex items-center justify-between cursor-pointer ${getSubtleActiveBtnClass(
            activeSolutionId === 'website-footer'
          )}`}
        >
          <span>website footer</span>
          {activeSolutionId === 'website-footer' && (
            <ChevronRight className="h-3.5 w-3.5 opacity-75 shrink-0" />
          )}
        </a>

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
          </button>
        )}

        {/* About the Book Button (links to CMS YouTube channel walkthrough) */}
        {onOpenAboutBook && (
          <button
            type="button"
            onClick={onOpenAboutBook}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors lowercase flex items-center justify-between cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
            title="Watch the Getting to Value walkthrough on YouTube"
          >
            <span>about the book</span>
            <Play className="h-3 w-3 text-slate-400 shrink-0" />
          </button>
        )}

        {/* Administration Centre & Operations Sandbox: Strictly restricted to administrators */}
        {isAdmin && (
          <>
            {onSelectAdminCentre && (
              <button
                onClick={onSelectAdminCentre}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors lowercase flex items-center justify-between cursor-pointer ${getSubtleActiveBtnClass(
                  activeSolutionId === 'administration-centre'
                )}`}
              >
                <span>administration centre</span>
                <span className="text-[10px] font-mono text-[#5584B4]">admin</span>
              </button>
            )}

            <button
              onClick={() => onSelectSolution('operations-sandbox')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors lowercase flex items-center justify-between cursor-pointer ${getSubtleActiveBtnClass(
                activeStageId === 'operations-sandbox'
              )}`}
              title="Operations Sandbox: Staging & Incubation Lab"
            >
              <span>operations sandbox</span>
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">staging</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

export default SolutionsPanel;
