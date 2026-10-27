import React, { useState, useRef, useEffect } from 'react';
import {
  LogOut,
  Maximize2,
  Minimize2,
  Coins,
  Sun,
  Moon,
  Database,
  Pin,
  PinOff,
  ChevronDown,
  Check,
  Search,
  X,
  RotateCcw,
  Sparkles,
  Smartphone,
  Laptop,
  Play,
  AlertCircle,
  Calculator,
  Library,
  Mail,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { BIZZ_SOLUTIONS } from '../data/bizzdeskData';
import { CmsProduct } from '../data/cmsConsoleData';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';
import { getCanonicalCourseId, findMatchingCourse } from '../utils/imageStorage';

interface BizzDeskHeaderProps {
  isMember: boolean;
  userEmail?: string;
  userName?: string;
  tokenBalance: number;
  quickLinkIds: string[];
  activeSolutionId: string;
  isMaximized: boolean;
  theme: 'light' | 'dark';
  onSelectSolution: (id: string) => void;
  onToggleMaximize: () => void;
  onToggleTheme: () => void;
  onSignOut: () => void;
  onOpenCmsConsole?: () => void;
  onToggleQuickLink?: (id: string) => void;
  onBuyTokens?: () => void;
  onSelectLibrary?: () => void;
  onOpenTalkToUs?: () => void;
  cmsProducts?: CmsProduct[];
  onLaunchApp?: (appId: string) => void;
  onLaunchSolution?: (id: string) => void;
}

export const BizzDeskHeader: React.FC<BizzDeskHeaderProps> = ({
  isMember,
  userEmail,
  userName,
  tokenBalance,
  quickLinkIds,
  activeSolutionId,
  isMaximized,
  theme,
  onSelectSolution,
  onToggleMaximize,
  onToggleTheme,
  onSignOut,
  onOpenCmsConsole,
  onToggleQuickLink,
  onBuyTokens,
  onSelectLibrary,
  onOpenTalkToUs,
  cmsProducts = [],
  onLaunchApp,
  onLaunchSolution,
}) => {
  const isDark = theme === 'dark';
  const [isPinboardOpen, setIsPinboardOpen] = useState(false);
  const [isMobileAppsModalOpen, setIsMobileAppsModalOpen] = useState(false);
  const [pinboardTab, setPinboardTab] = useState<'pinned' | 'manage'>('pinned');
  const [searchQuery, setSearchQuery] = useState('');
  const pinboardRef = useRef<HTMLDivElement>(null);

  const welcomeName =
    userName ||
    (userEmail
      ? userEmail.includes('@')
        ? userEmail.split('@')[0]
        : userEmail
      : isMember
      ? 'verified member'
      : 'guest explorer');

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pinboardRef.current && !pinboardRef.current.contains(event.target as Node)) {
        setIsPinboardOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPinboardOpen(false);
      }
    };

    if (isPinboardOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPinboardOpen]);

  // Master catalog of all selectable solutions (for the V1 pinboard select/deselect process)
  // Strictly contains actual COURSES and APPS only — never stages!
  const allSelectableSolutions = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; stage: string; category: string; type: 'course' | 'app' }>();
    const stageIds = new Set(['vi-ability', 'fund-ability', 'sustain-ability', 'invest-ability', 'personal-sandbox', 'operations', 'growth', 'education']);

    // 1. Add all CMS products & courses first (source of truth)
    (cmsProducts || []).forEach((p) => {
      if (p && p.id && !stageIds.has(p.id)) {
        const canonicalId = p.type === 'course' ? (getCanonicalCourseId(p.id) || p.id) : p.id;
        if (!map.has(canonicalId)) {
          map.set(canonicalId, {
            id: canonicalId,
            name: p.name,
            stage: p.stage || 'vi-ability',
            category: p.stage || 'solution',
            type: p.type === 'course' ? 'course' : 'app',
          });
        }
      }
    });

    // 2. Add core Bizz Solutions apps/courses that are not stages
    BIZZ_SOLUTIONS.forEach((s) => {
      if (s && s.id && !stageIds.has(s.id) && !map.has(s.id)) {
        const isCourse = s.id === 'learn-earn-capital' || s.id.includes('course');
        map.set(s.id, {
          id: s.id,
          name: s.name,
          stage: s.stage || s.category,
          category: s.category || 'solution',
          type: isCourse ? 'course' : 'app',
        });
      }
    });

    // 3. Ensure all standard master courses are selectable
    const standardCourses = [
      { id: 'cost-recovery-calculator', name: 'cost recovery calculator', stage: 'fund-ability' },
      { id: 'learn-earn-capital', name: 'learn how to earn access to capital', stage: 'vi-ability' },
      { id: 'how-to-bizzcalc', name: 'how to use bizzcalc', stage: 'vi-ability' },
      { id: 'profit-optimizer', name: 'profit optimizer', stage: 'sustain-ability' },
      { id: 'financial-scenario-planning', name: 'financial scenario planning', stage: 'sustain-ability' },
      { id: 'follow-the-money', name: 'follow the money', stage: 'fund-ability' },
      { id: 'financial-reports', name: 'financial reports', stage: 'fund-ability' },
      { id: 'your-first-hire', name: 'your first hire', stage: 'operations' },
      { id: 'annual-business-planning-cycle', name: 'annual business planning cycle', stage: 'sustain-ability' },
    ];
    standardCourses.forEach((sc) => {
      if (!map.has(sc.id)) {
        map.set(sc.id, {
          id: sc.id,
          name: sc.name,
          stage: sc.stage,
          category: sc.stage,
          type: 'course',
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'course' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [cmsProducts]);

  // Helper to look up name, stage, and type for a given id
  const getSolutionMeta = (id: string): { name: string; stage: string; type: 'course' | 'app'; id: string } => {
    const normalizedId = id === 'budget' ? 'bizzbudget' : id;

    // Check CMS products first
    const cms = (cmsProducts || []).find(
      (p) =>
        p.id === normalizedId ||
        p.id === id ||
        (p.type === 'course' && (getCanonicalCourseId(p.id) === id || getCanonicalCourseId(p.name) === id))
    );
    if (cms) {
      return {
        name: cms.name,
        stage: cms.stage || 'general',
        type: (cms.type === 'course' ? 'course' : 'app') as 'course' | 'app',
        id: cms.id,
      };
    }

    // Check BIZZ_SOLUTIONS (non-stages)
    const bizz = BIZZ_SOLUTIONS.find((s) => s.id === normalizedId || s.id === id);
    if (bizz) {
      const isStage = ['vi-ability', 'fund-ability', 'sustain-ability', 'invest-ability', 'personal-sandbox'].includes(bizz.id);
      if (!isStage) {
        return {
          name: bizz.name,
          stage: bizz.stage || bizz.category || 'general',
          type: (bizz.id === 'learn-earn-capital' ? 'course' : 'app') as 'course' | 'app',
          id: bizz.id,
        };
      }
    }

    // Graceful migration for legacy stage IDs to primary courses/apps
    if (id === 'fund-ability') {
      return { name: 'cost recovery calculator', stage: 'fund-ability', type: 'course', id: 'cost-recovery-calculator' };
    }
    if (id === 'vi-ability') {
      return { name: 'learn how to earn access to capital', stage: 'vi-ability', type: 'course', id: 'learn-earn-capital' };
    }
    if (id === 'sustain-ability') {
      return { name: 'profit optimizer', stage: 'sustain-ability', type: 'course', id: 'profit-optimizer' };
    }
    if (id === 'invest-ability') {
      return { name: 'financial reports', stage: 'invest-ability', type: 'course', id: 'financial-reports' };
    }
    if (id === 'personal-sandbox') {
      return { name: 'bizzcalc', stage: 'vi-ability', type: 'app', id: 'bizzcalc' };
    }

    return { name: id.replace(/-/g, ' '), stage: 'general', type: 'app', id };
  };

  // Filtered solutions for the manage/pin selection tab
  const filteredSolutions = allSelectableSolutions.filter((sol) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return sol.name.toLowerCase().includes(q) || sol.stage.toLowerCase().includes(q) || sol.id.toLowerCase().includes(q);
  });

  return (
    <header
      className={`h-14 border-b flex items-center justify-between px-3 sm:px-6 select-none shrink-0 z-30 transition-colors ${
        isDark
          ? 'bg-[#101424] border-[#252E4A] text-[#E2E8F0]'
          : 'bg-[#FAF8F5] border-[#E8E2D8] text-slate-800'
      }`}
    >
      {/* Zone 1: Reserved to welcome the logged-in user with bizzbean-favicon.jpg */}
      <div className="flex items-center gap-2.5 shrink-0 min-w-0">
        <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-[#D8CEBC] dark:border-[#252E4A] bg-white shadow-2xs">
          <img
            src="/bizzbean-favicon.jpg"
            alt="bizzbean favicon"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.triedPng) {
                target.dataset.triedPng = 'true';
                target.src = '/bizzbean-favicon.png';
              }
            }}
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-mono text-[#9A7B4F] dark:text-[#D4A373] uppercase tracking-wider leading-none">
            welcome,
          </span>
          <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[160px] sm:max-w-[220px]">
            {welcomeName}
          </span>
        </div>
      </div>

      {/* Zone 2: Mobile Apps Launcher (Mobile) vs PINBOARD Dropdown (Desktop) */}
      {/* Mobile Apps Button (Per Proposal 3: friendly navigation to and from chosen apps) */}
      <div className="md:hidden flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsMobileAppsModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#5584B4]/20 hover:bg-[#5584B4]/30 border border-[#5584B4]/40 text-[#5584B4] dark:text-[#90CDF4] text-xs font-mono font-bold transition-all shadow-2xs"
          title="Open Mobile Platform Apps Navigator"
        >
          <Smartphone className="h-3.5 w-3.5 text-[#84CC16]" />
          <span className="uppercase">APPS</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30">
            2 READY
          </span>
        </button>
      </div>

      {/* Desktop PINBOARD Dropdown (Hidden on mobile per Proposal 3) */}
      <div className="relative hidden md:block" ref={pinboardRef}>
        <button
          type="button"
          onClick={() => setIsPinboardOpen(!isPinboardOpen)}
          aria-expanded={isPinboardOpen}
          aria-label="Toggle pinboard dropdown list"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold tracking-wide transition-all shadow-2xs ${
            isPinboardOpen
              ? isDark
                ? 'bg-[#1E2548] text-white border-[#5584B4] ring-1 ring-[#5584B4]'
                : 'bg-white text-slate-900 border-[#5584B4] ring-1 ring-[#5584B4] shadow-xs'
              : isDark
              ? 'bg-[#161C30] hover:bg-[#1E2548] text-slate-200 border-[#252E4A]'
              : 'bg-white hover:bg-[#F4EFE6] text-slate-800 border-[#E8E2D8]'
          }`}
        >
          <Pin className="h-3.5 w-3.5 text-[#5584B4] fill-[#5584B4]/20 -rotate-45" />
          <span className="uppercase">PINBOARD</span>
          <span
            className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
              isDark
                ? 'bg-[#5584B4]/20 text-[#DDEBF7] border border-[#5584B4]/40'
                : 'bg-[#DDEBF7] text-[#24496B] border border-[#5584B4]/30'
            }`}
          >
            {quickLinkIds.length}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
              isPinboardOpen ? 'rotate-180 text-[#5584B4]' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu Container */}
        {isPinboardOpen && (
          <div
            className={`absolute left-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden ${
              isDark
                ? 'bg-[#101424] border-[#252E4A] text-slate-200 shadow-black/60'
                : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-800 shadow-slate-900/10'
            }`}
          >
            {/* Header of Pinboard Panel */}
            <div
              className={`p-3.5 border-b flex items-center justify-between ${
                isDark ? 'border-[#252E4A] bg-[#141A2E]' : 'border-[#E8E2D8] bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#5584B4]/15 border border-[#5584B4]/30 text-[#5584B4]">
                  <Pin className="h-3.5 w-3.5 -rotate-45" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      PINBOARD
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-[#5584B4]/20 text-[#5584B4] dark:text-[#DDEBF7]">
                      {quickLinkIds.length} PINNED
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#9A7B4F] dark:text-[#D4A373] lowercase block -mt-0.5">
                    quick access workspace bookmarks
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPinboardOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Close pinboard"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tab Navigation: Pinned List vs. Manage / Select Solutions (V1 Process) */}
            <div
              className={`flex border-b text-xs font-mono font-semibold ${
                isDark ? 'border-[#252E4A] bg-[#0E1220]' : 'border-[#E8E2D8] bg-[#F4EFE6]/50'
              }`}
            >
              <button
                type="button"
                onClick={() => setPinboardTab('pinned')}
                className={`flex-1 py-2 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                  pinboardTab === 'pinned'
                    ? 'border-[#5584B4] text-[#5584B4] dark:text-[#DDEBF7] bg-white/5 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>PINNED ITEMS</span>
                <span className="text-[10px] opacity-75">({quickLinkIds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setPinboardTab('manage')}
                className={`flex-1 py-2 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                  pinboardTab === 'manage'
                    ? 'border-[#5584B4] text-[#5584B4] dark:text-[#DDEBF7] bg-white/5 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>SELECT / PIN ALL</span>
                <Sparkles className="h-3 w-3 text-[#D4A373]" />
              </button>
            </div>

            {/* TAB 1: Pinned Dropdown List */}
            {pinboardTab === 'pinned' && (
              <div className="p-2 max-h-72 overflow-y-auto space-y-1">
                {quickLinkIds.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <PinOff className="h-8 w-8 mx-auto text-slate-400 mb-2 stroke-[1.5]" />
                    <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                      No Items Pinned Yet
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      Switch to "SELECT / PIN ALL" tab to customize your pinboard.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPinboardTab('manage')}
                      className="mt-3 px-3 py-1 rounded-lg bg-[#5584B4] text-white text-xs font-mono font-semibold"
                    >
                      Pin Solutions Now
                    </button>
                  </div>
                ) : (
                  quickLinkIds.map((id) => {
                    const meta = getSolutionMeta(id);
                    const isActive = activeSolutionId === id;

                    return (
                      <div
                        key={id}
                        className={`group flex items-center justify-between p-2 rounded-xl transition-all border ${
                          isActive
                            ? isDark
                              ? 'bg-[#1E2548] border-[#5584B4] text-[#DDEBF7]'
                              : 'bg-white border-[#5584B4] text-slate-900 shadow-xs'
                            : isDark
                            ? 'bg-[#141A2E]/60 border-transparent hover:bg-[#1E2548] hover:border-[#252E4A]'
                            : 'bg-white/60 border-transparent hover:bg-white hover:border-[#E8E2D8]'
                        }`}
                      >
                        {/* Clickable body to jump to solution */}
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSolution(meta.id || id);
                            setIsPinboardOpen(false);
                          }}
                          className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                          title={`Open ${meta.name}`}
                        >
                          <div
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              isActive ? 'bg-[#5584B4] ring-2 ring-[#5584B4]/40' : 'bg-slate-400/40'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-mono font-semibold truncate capitalize text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span className="truncate">{meta.name.toLowerCase()}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                                meta.type === 'course'
                                  ? 'bg-[#5584B4]/20 text-[#5584B4] dark:text-[#DDEBF7]'
                                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {meta.type}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 lowercase truncate">
                                {meta.stage}
                              </span>
                            </div>
                          </div>
                        </button>

                        {/* Quick Launch Button */}
                        {meta.type === 'course' ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsPinboardOpen(false);
                              if (onLaunchSolution) {
                                onLaunchSolution(meta.id || id);
                              } else {
                                onSelectSolution(meta.id || id);
                              }
                            }}
                            title="Launch course in BizzClass"
                            className="px-2 py-1 rounded-lg text-white bg-[#2E5E88] hover:bg-[#234E73] transition-colors shrink-0 ml-1.5 text-[10px] font-mono flex items-center gap-1 shadow-2xs font-bold"
                          >
                            <Play className="h-3 w-3 fill-white text-white" />
                            <span className="hidden sm:inline">LAUNCH</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsPinboardOpen(false);
                              if (onLaunchApp) {
                                onLaunchApp(meta.id || id);
                              } else if (onLaunchSolution) {
                                onLaunchSolution(meta.id || id);
                              } else {
                                onSelectSolution(meta.id || id);
                              }
                            }}
                            title="Launch platform app"
                            className="px-2 py-1 rounded-lg text-white bg-[#12172A] dark:bg-[#1E2548] hover:bg-[#1E2548] transition-colors shrink-0 ml-1.5 text-[10px] font-mono flex items-center gap-1 shadow-2xs font-bold"
                          >
                            <Layers className="h-3 w-3 text-[#84CC16]" />
                            <span className="hidden sm:inline">LAUNCH</span>
                          </button>
                        )}

                        {/* Unpin action button */}
                        {onToggleQuickLink && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleQuickLink(id);
                            }}
                            title="Unpin from pinboard"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0 ml-1"
                          >
                            <PinOff className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: V1 Select / Deselect Process (Full Solutions Catalog) */}
            {pinboardTab === 'manage' && (
              <div className="p-2 space-y-2">
                {/* Search Filter */}
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search courses & apps to pin..."
                    className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-[#5584B4] ${
                      isDark
                        ? 'bg-[#0E1220] border-[#252E4A] text-white'
                        : 'bg-white border-[#E8E2D8] text-slate-900'
                    }`}
                  />
                </div>

                {/* Select / Deselect List */}
                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {filteredSolutions.map((sol) => {
                    const isPinned = quickLinkIds.includes(sol.id);

                    return (
                      <button
                        key={sol.id}
                        type="button"
                        onClick={() => onToggleQuickLink && onToggleQuickLink(sol.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition-all text-xs font-mono ${
                          isPinned
                            ? isDark
                              ? 'bg-[#1E2548]/90 border-[#5584B4] text-[#DDEBF7]'
                              : 'bg-[#FAF8F5] border-[#5584B4] text-slate-900'
                            : isDark
                            ? 'bg-[#141A2E]/40 border-transparent hover:bg-[#161C30] text-slate-400'
                            : 'bg-white/50 border-transparent hover:bg-white text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`h-4 w-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                              isPinned
                                ? 'bg-[#5584B4] border-[#5584B4] text-white'
                                : isDark
                                ? 'border-[#252E4A] bg-[#0E1220]'
                                : 'border-[#D8CEBC] bg-white'
                            }`}
                          >
                            {isPinned && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold block truncate capitalize text-slate-900 dark:text-white">
                                {sol.name.toLowerCase()}
                              </span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                                sol.type === 'course'
                                  ? 'bg-[#5584B4]/20 text-[#5584B4] dark:text-[#DDEBF7]'
                                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {sol.type}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block -mt-0.5 lowercase">
                              {sol.stage}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isPinned
                              ? 'text-[#5584B4] bg-[#5584B4]/15'
                              : 'text-slate-400 bg-slate-400/10'
                          }`}
                        >
                          {isPinned ? 'PINNED' : 'PIN'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer summary & quick jump */}
            <div
              className={`p-2.5 border-t flex items-center justify-between text-[11px] font-mono ${
                isDark ? 'border-[#252E4A] bg-[#0E1220]' : 'border-[#E8E2D8] bg-[#FAF8F5]'
              }`}
            >
              <span className="text-slate-400 lowercase">
                click item to open workspace
              </span>
              <button
                type="button"
                onClick={() => setIsPinboardOpen(false)}
                className="font-bold text-[#5584B4] hover:underline uppercase"
              >
                DONE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Zone 3: Member Tokenomics, BUY TOKENS, Theme Toggle, Layout & Close Doors */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Token Balance */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono ${
            isDark
              ? 'bg-[#161C30] border-[#252E4A] text-slate-200'
              : 'bg-white border-[#E8E2D8] text-slate-700'
          }`}
        >
          <Coins className="h-3.5 w-3.5 text-[#5584B4]" />
          <span className="font-bold tabular-nums text-slate-900 dark:text-white">{tokenBalance}</span>
          <span className="text-slate-400 text-[10px] hidden sm:inline lowercase">tokens</span>
        </div>

        {/* BUY TOKENS Button next to Token Balance (Hidden on mobile per Proposal 3) */}
        <button
          type="button"
          onClick={onBuyTokens}
          title="Buy Tokens & Runway Credits"
          className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-[#E02475] hover:bg-[#C2185B] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-xs active:scale-[0.98] border border-[#E02475]"
        >
          <Coins className="h-3.5 w-3.5" />
          <span>BUY TOKENS</span>
        </button>

        {/* TALK TO US Button (Direct access to Talk To Us Dialogue Centre in Administration Centre) */}
        {onOpenTalkToUs && (
          <button
            type="button"
            onClick={onOpenTalkToUs}
            title="Open Talk To Us Dialogue Centre in Administration Centre"
            className={`hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all border ${
              activeSolutionId === 'administration-centre'
                ? isDark
                  ? 'bg-[#1E2548]/30 text-[#D4A373] border-[#5584B4]/40 shadow-xs'
                  : 'bg-[#F2ECE1]/70 text-[#8C6D3F] border-[#C59B63]/40 shadow-xs'
                : isDark
                ? 'bg-[#161C30] hover:bg-[#1E2548] border-[#252E4A] text-slate-200 hover:text-white'
                : 'bg-white hover:bg-[#F4EFE6] border-[#E8E2D8] text-slate-700 hover:text-slate-950'
            }`}
          >
            <Mail className="h-3.5 w-3.5 text-[#5584B4]" />
            <span>TALK TO US</span>
          </button>
        )}

        {/* CMS CONSOLE (Direct access to Administration Centre & CMS Master Matrix) */}
        <button
          type="button"
          onClick={() => onSelectSolution('cms-console')}
          title="Open CMS Console & Administration Centre"
          className={`hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all border ${
            activeSolutionId === 'administration-centre'
              ? isDark
                ? 'bg-[#1E2548]/30 text-[#D4A373] border-[#5584B4]/40 shadow-xs'
                : 'bg-[#F2ECE1]/70 text-[#8C6D3F] border-[#C59B63]/40 shadow-xs'
              : isDark
              ? 'bg-[#161C30] hover:bg-[#1E2548] border-[#252E4A] text-slate-200 hover:text-white'
              : 'bg-white hover:bg-[#F4EFE6] border-[#E8E2D8] text-slate-700 hover:text-slate-950'
          }`}
        >
          <Database className="h-3.5 w-3.5 text-[#5584B4]" />
          <span>CMS</span>
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Switch to The Illuminated Sandbox Light Theme' : 'Switch to Dark Theme'}
          className={`p-1.5 rounded-lg border transition-colors ${
            isDark
              ? 'bg-[#161C30] hover:bg-[#1E2548] border-[#252E4A] text-[#D4A373]'
              : 'bg-white hover:bg-[#F4EFE6] border-[#E8E2D8] text-slate-700'
          }`}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Expand / Maximize Work Area (Hides side panels for full undistracted focus) */}
        <button
          onClick={onToggleMaximize}
          title={
            isMaximized
              ? 'Restore 3-Panel View (Show Solutions Panel & Knowledge Base)'
              : 'Maximize Work Area (Hide Side Panels for Undistracted Focus)'
          }
          className={`p-1.5 rounded-lg border transition-all ${
            isMaximized
              ? 'bg-[#5584B4]/20 border-[#5584B4] text-[#5584B4] dark:text-[#DDEBF7] shadow-xs'
              : isDark
              ? 'bg-[#161C30] hover:bg-[#1E2548] border-[#252E4A] text-slate-300 hover:text-white'
              : 'bg-white hover:bg-[#F4EFE6] border-[#E8E2D8] text-slate-700 hover:text-slate-900'
          }`}
        >
          {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>

        {/* Close Doors (Opens Close Shop / Session Review) */}
        <button
          onClick={onSignOut}
          title="Close Shop for the Day"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#12172A] hover:bg-[#1E2548] text-white text-xs font-mono transition-colors border border-[#2B3452]"
        >
          <LogOut className="h-3.5 w-3.5 text-[#DDEBF7]" />
          <span className="hidden sm:inline lowercase">close doors</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* MOBILE PLATFORM APPS NAVIGATOR MODAL (PER PROPOSAL 3)                 */}
      {/* ===================================================================== */}
      {isMobileAppsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-mono ${
              isDark ? 'bg-[#101424] border-[#252E4A] text-slate-200' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-800'
            }`}
          >
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
            }`}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#5584B4]/20 border border-[#5584B4]/40 text-[#5584B4]">
                  <Smartphone className="h-4 w-4 text-[#84CC16]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Platform Apps Navigator
                  </h3>
                  <span className="text-[10px] text-slate-400 lowercase block">
                    mobile & desktop device accessibility
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileAppsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* 1. Mobile-Ready Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    📱 Designed for Mobile Device (Touch-Optimized)
                  </span>
                </div>

                <div className="space-y-2">
                  {/* bizzcalc */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                  }`}>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white lowercase text-sm">bizzcalc</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30">
                          mobile ready
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Cost Recovery, Break-Even & Contribution Margin Simulator
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsMobileAppsModalOpen(false);
                        if (onLaunchApp) {
                          onLaunchApp('bizzcalc');
                        } else {
                          onSelectSolution('bizzcalc');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#5584B4] hover:bg-[#4372A2] text-white text-[11px] font-bold uppercase shrink-0 flex items-center gap-1"
                    >
                      <Play className="h-3 w-3 fill-white" />
                      <span>Launch</span>
                    </button>
                  </div>

                  {/* bizzcalculators */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                  }`}>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white lowercase text-sm">bizzcalculators</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30">
                          mobile ready
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        CAC : LTV, Working Capital & True Hourly Labor Suite
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsMobileAppsModalOpen(false);
                        if (onLaunchApp) {
                          onLaunchApp('bizzcalculators');
                        } else {
                          onSelectSolution('bizzcalculators');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#5584B4] hover:bg-[#4372A2] text-white text-[11px] font-bold uppercase shrink-0 flex items-center gap-1"
                    >
                      <Play className="h-3 w-3 fill-white" />
                      <span>Launch</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Desktop-Only Notice & Apps */}
              <div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-2 flex items-start gap-2">
                  <Laptop className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
                    <strong>Laptop / Desktop Only:</strong> The complex 3-statement models, extensive data schedules, and multi-column spreadsheets in the following apps require a desktop/laptop display:
                  </p>
                </div>

                <div className="space-y-1.5 opacity-85">
                  {[
                    { id: 'bizzdynamics', name: 'bizzdynamics', desc: 'Dynamic Business Physics & Revenue Multipliers' },
                    { id: 'bizzmodel', name: 'bizzmodel', desc: '3-Statement Financial Simulator' },
                    { id: 'hi-level-forecast', name: 'Hi-Level Forecast', desc: '36-Month Strategic Horizon Forecast' },
                    { id: 'bizzplan', name: 'bizzplan', desc: 'Executive Business Plan & Cap Table Suite' },
                  ].map((app) => (
                    <div
                      key={app.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                        isDark ? 'bg-[#0E1322] border-[#222E4A]' : 'bg-slate-100 border-[#D8CEBC]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 lowercase">{app.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 font-bold uppercase">
                            desktop only
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">{app.desc}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 lowercase">use on pc</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-3 border-t flex justify-end shrink-0 ${
              isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
            }`}>
              <button
                onClick={() => setIsMobileAppsModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
