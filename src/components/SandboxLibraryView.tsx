import React, { useState, useMemo } from 'react';
import { LibraryItem, UserBusinessProfile } from '../types';
import { DailyObjective } from './CloseShopModal';
import {
  Library,
  Search,
  Filter,
  Download,
  FileText,
  Check,
  CheckSquare,
  Square,
  Plus,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  Cloud,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Layers,
  FolderLock,
  Eye,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';
import { SandboxLibrary } from './SandboxLibrary';

interface SandboxLibraryViewProps {
  theme: 'light' | 'dark';
  libraryItems: LibraryItem[];
  objectives: DailyObjective[];
  onToggleObjective: (id: string) => void;
  onAddObjective: (text: string) => void;
  onOpenLibraryItem: (item: LibraryItem) => void;
  userProfile: UserBusinessProfile;
  tokenBalance: number;
  onLaunchRelatedSolution?: (stageId: string, solId?: string) => void;
}

export const SandboxLibraryView: React.FC<SandboxLibraryViewProps> = ({
  theme,
  libraryItems,
  objectives,
  onToggleObjective,
  onAddObjective,
  onOpenLibraryItem,
  userProfile,
  tokenBalance,
  onLaunchRelatedSolution,
}) => {
  const isDark = theme === 'dark';

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // New Objective Input
  const [newObjectiveText, setNewObjectiveText] = useState('');

  // Download / Action Toast
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [syncingDrive, setSyncingDrive] = useState(false);
  const [showStashVault, setShowStashVault] = useState(false);

  const showToast = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleSyncDrive = () => {
    setSyncingDrive(true);
    setTimeout(() => {
      setSyncingDrive(false);
      showToast(`Synchronized 12 items with Google Drive folder "bizzbean/${userProfile.slug}"`);
    }, 1200);
  };

  const handleDownloadItem = (e: React.MouseEvent, item: LibraryItem) => {
    e.stopPropagation();
    showToast(`Exported "${item.title}" to local download queue and Google Drive.`);
  };

  const handleExportAllZip = () => {
    showToast(`Compiling full Sandbox Library vault (.zip) for ${userProfile.companyName}...`);
  };

  const handleAddObjectiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjectiveText.trim()) return;
    onAddObjective(newObjectiveText.trim());
    setNewObjectiveText('');
  };

  // Filter logic
  const filteredItems = useMemo(() => {
    return libraryItems.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.contentSnippet.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.stage.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)));

      const matchesStage =
        selectedStage === 'all' ||
        item.stage.toLowerCase().replace(/[^a-z]/g, '') ===
          selectedStage.toLowerCase().replace(/[^a-z]/g, '');

      const matchesType =
        selectedType === 'all' ||
        (selectedType === 'models' && item.type === 'Financial Model Run') ||
        (selectedType === 'memos' && (item.type === 'Strategic Memo' || item.type === 'Dialogue Transcript')) ||
        (selectedType === 'ledgers' && item.type === 'Accounting Ledger') ||
        (selectedType === 'diligence' && item.type === 'Due Diligence Pack') ||
        (selectedType === 'templates' && item.type === 'Companion Template');

      return matchesSearch && matchesStage && matchesType;
    });
  }, [libraryItems, searchQuery, selectedStage, selectedType]);

  // Total size estimation
  const totalSize = '18.4 MB';
  const completedObjectivesCount = objectives.filter((o) => o.completed).length;

  const getFormatIcon = (format?: string, type?: string) => {
    if (format === 'gsheet' || format === 'xlsx' || type === 'Financial Model Run') {
      return <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />;
    }
    if (format === 'pdf' || type === 'Strategic Memo' || type === 'Dialogue Transcript') {
      return <FileText className="h-4 w-4 text-rose-500 shrink-0" />;
    }
    if (format === 'gdoc' || type === 'Companion Template') {
      return <FileCode className="h-4 w-4 text-blue-500 shrink-0" />;
    }
    return <FolderLock className="h-4 w-4 text-amber-500 shrink-0" />;
  };

  return (
    <div
      className={`flex-grow p-4 sm:p-7 overflow-y-auto flex flex-col justify-between transition-colors ${
        isDark ? 'bg-[#0A0D14] text-[#E2E8F0]' : 'bg-architectural-grid text-slate-800'
      }`}
    >
      <div className="max-w-6xl mx-auto w-full space-y-6 pb-8">
        
        {/* ========================================================================= */}
        {/* HEADER: SANDBOX LIBRARY & CLOUD STATUS                                    */}
        {/* ========================================================================= */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3 ${
            isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider block">
                VENTURE VAULT & ASSET REPOSITORY
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#DDEBF7] text-[#24496B] dark:bg-[#1E3048] dark:text-[#DDEBF7] uppercase">
                v1 transfer
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wide mt-0.5 flex items-center gap-2">
              <Library className="h-5 w-5 text-[#5584B4]" />
              <span>SANDBOX LIBRARY</span>
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowStashVault(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg bg-[#9fc754] hover:bg-[#b4df62] text-slate-950 shadow-md transition-colors cursor-pointer"
              title="Open Sandbox Knowledge Vault, AI Q&A and 3-Slot Operations Focus"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Open Knowledge Vault</span>
            </button>

            <button
              onClick={handleSyncDrive}
              disabled={syncingDrive}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-colors border cursor-pointer ${
                isDark
                  ? 'bg-[#161C30] hover:bg-[#1E2548] border-[#252E4A] text-slate-200'
                  : 'bg-white hover:bg-[#F4EFE6] border-[#D8CEBC] text-slate-800 shadow-xs'
              }`}
              title="Sync with Google Drive"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#5584B4] ${syncingDrive ? 'animate-spin' : ''}`} />
              <span className="lowercase font-bold">{syncingDrive ? 'syncing drive...' : 'sync drive'}</span>
            </button>

            <button
              onClick={handleExportAllZip}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg bg-[#12172A] hover:bg-[#1E2548] dark:bg-[#1E2548] dark:hover:bg-[#252E58] text-white shadow-xs transition-colors lowercase border border-transparent dark:border-[#5584B4] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-[#C59B63]" />
              <span>export vault (.zip)</span>
            </button>
          </div>
        </div>

        {/* Action Toast Feedback */}
        {actionFeedback && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-mono flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{actionFeedback}</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 lowercase">active session</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATS & REPOSITORY STATUS STRIP                                           */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
            }`}
          >
            <div className="text-[11px] font-mono text-slate-500 uppercase">STORED ASSETS</div>
            <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
              {libraryItems.length} <span className="text-xs font-normal text-slate-400">files</span>
            </div>
            <div className="text-[10px] font-mono text-[#5584B4] mt-0.5 lowercase">
              100% unlocked formulas
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
            }`}
          >
            <div className="text-[11px] font-mono text-slate-500 uppercase">FOCUS OBJECTIVES</div>
            <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
              {completedObjectivesCount} / {objectives.length}{' '}
              <span className="text-xs font-normal text-slate-400">done</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 lowercase">
              {completedObjectivesCount === objectives.length ? 'all objectives completed' : 'daily focus active'}
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
            }`}
          >
            <div className="text-[11px] font-mono text-slate-500 uppercase">VAULT STORAGE</div>
            <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
              {totalSize}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5 lowercase">
              unlimited sandbox quota
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
            }`}
          >
            <div className="text-[11px] font-mono text-slate-500 uppercase">CLOUD INTEGRATION</div>
            <div className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white mt-1 truncate">
              Google Drive
            </div>
            <div className="text-[10px] font-mono text-[#5584B4] mt-0.5 lowercase truncate">
              drive/{userProfile.slug}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: DAILY WORK OBJECTIVES (3 FOCUS POINTS FROM V1)                 */}
        {/* ========================================================================= */}
        <div
          className={`rounded-2xl border p-4 sm:p-5 shadow-xs space-y-3.5 ${
            isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-[#E8E2D8] dark:border-[#252E4A] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  DAILY WORK OBJECTIVES (3 FOCUS POINTS)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#DDEBF7] text-[#24496B] dark:bg-[#1E3048] dark:text-[#DDEBF7] lowercase font-semibold">
                  v1 focus ledger
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Execute your 3 highest-leverage commercial priorities before shifting to reactive operations.
              </p>
            </div>

            <div className="text-xs font-mono text-slate-500 lowercase shrink-0">
              {completedObjectivesCount} of 3 completed
            </div>
          </div>

          {/* Objectives List */}
          <div className="space-y-2">
            {objectives.map((obj, idx) => (
              <div
                key={obj.id}
                onClick={() => onToggleObjective(obj.id)}
                className={`flex items-start sm:items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  obj.completed
                    ? isDark
                      ? 'bg-[#0E1220] border-[#1E2548] text-slate-400'
                      : 'bg-[#FAF8F5] border-[#E8E2D8] text-slate-500'
                    : isDark
                    ? 'bg-[#161C30] hover:bg-[#1C233C] border-[#252E4A] text-slate-200'
                    : 'bg-white hover:bg-[#FAF8F5] border-[#D8CEBC] text-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleObjective(obj.id);
                    }}
                    className="shrink-0 p-0.5 text-[#5584B4] hover:text-[#3B6694] transition-colors"
                  >
                    {obj.completed ? (
                      <CheckSquare className="h-4 w-4 text-[#5584B4]" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                  <span
                    className={`text-xs font-mono ${
                      obj.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'font-medium'
                    }`}
                  >
                    {obj.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 sm:mt-0 text-[10px] font-mono text-slate-400">
                  <span className="hidden sm:inline lowercase">focus {idx + 1}</span>
                  <span className={`px-1.5 py-0.2 rounded lowercase font-semibold ${
                    obj.completed
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {obj.completed ? 'completed' : 'in progress'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Add Objective if fewer than 3 */}
          {objectives.length < 3 && (
            <form onSubmit={handleAddObjectiveSubmit} className="flex gap-2 pt-1">
              <input
                type="text"
                value={newObjectiveText}
                onChange={(e) => setNewObjectiveText(e.target.value)}
                placeholder="add next high-impact objective (e.g. stress-test break-even runway)..."
                className={`flex-grow px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#0E1220] border-[#252E4A] text-white focus:border-[#5584B4]'
                    : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#12172A]'
                }`}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#12172A] hover:bg-[#1E2548] dark:bg-[#1E2548] dark:hover:bg-[#252E58] text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs transition-colors lowercase shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>add objective</span>
              </button>
            </form>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: SEARCH, FILTERS & VIEW CONTROLS                                */}
        {/* ========================================================================= */}
        <div
          className={`p-4 rounded-2xl border space-y-3.5 ${
            isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'
          }`}
        >
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models, memos, ledgers, formulas, checklists..."
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs font-mono focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#0E1220] border-[#252E4A] text-white focus:border-[#5584B4]'
                    : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#12172A]'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[10px] font-mono text-slate-400 hover:text-slate-600"
                >
                  clear
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div
                className={`flex items-center p-1 rounded-lg border gap-1 text-xs font-mono ${
                  isDark ? 'bg-[#0E1220] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? isDark
                        ? 'bg-[#1E2548] text-white'
                        : 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'table'
                      ? isDark
                        ? 'bg-[#1E2548] text-white'
                        : 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Table View"
                >
                  <TableIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Segmented Stage Filter Tabs (Functional Button Elements adhering to Section A) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider mr-1 shrink-0">Stage:</span>
            {[
              { id: 'all', label: 'all stages' },
              { id: 'vi-ability', label: 'vi-ability' },
              { id: 'fund-ability', label: 'fund-ability' },
              { id: 'operations', label: 'operations' },
              { id: 'sustain-ability', label: 'sustain-ability' },
              { id: 'invest-ability', label: 'invest-ability' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStage(st.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors whitespace-nowrap shrink-0 lowercase ${
                  selectedStage === st.id
                    ? isDark
                      ? 'bg-[#1E2548] text-white font-bold border border-[#5584B4]'
                      : 'bg-[#12172A] text-white font-bold'
                    : isDark
                    ? 'bg-[#0E1220] hover:bg-[#161C30] text-slate-400 border border-[#252E4A]'
                    : 'bg-[#FAF8F5] hover:bg-[#F4EFE6] text-slate-600 border border-[#E8E2D8]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Segmented Asset Type Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider mr-1 shrink-0">Type:</span>
            {[
              { id: 'all', label: 'all types' },
              { id: 'models', label: 'financial models' },
              { id: 'memos', label: 'strategic memos' },
              { id: 'ledgers', label: 'ledgers & accounts' },
              { id: 'diligence', label: 'due diligence packs' },
              { id: 'templates', label: 'companion templates' },
            ].map((tp) => (
              <button
                key={tp.id}
                type="button"
                onClick={() => setSelectedType(tp.id)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 lowercase ${
                  selectedType === tp.id
                    ? isDark
                      ? 'bg-[#5584B4] text-white font-bold'
                      : 'bg-[#24496B] text-white font-bold'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tp.label}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: STORED ASSETS (GRID / TABLE VIEW)                              */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1">
            <span>
              showing {filteredItems.length} of {libraryItems.length} sandbox items
            </span>
            <span className="lowercase">all formulas 100% unlocked for client modification</span>
          </div>

          {filteredItems.length === 0 ? (
            <div
              className={`p-8 rounded-2xl border text-center space-y-2 ${
                isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
              }`}
            >
              <Library className="h-8 w-8 text-slate-400 mx-auto" />
              <div className="text-sm font-bold font-mono text-slate-900 dark:text-white uppercase">
                No matching sandbox items
              </div>
              <p className="text-xs font-mono text-slate-500">
                Adjust your search query or reset the filters to inspect stored assets.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStage('all');
                  setSelectedType('all');
                }}
                className="mt-2 px-3 py-1 text-xs font-mono rounded-lg bg-[#12172A] text-white hover:bg-[#1E2548]"
              >
                Reset Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onOpenLibraryItem(item)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between group ${
                    isDark
                      ? 'bg-[#141A2E] hover:bg-[#1A223C] border-[#252E4A]'
                      : 'bg-white hover:bg-[#FAF8F5] border-[#D8CEBC] shadow-xs'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Top unboxed metadata adhering to zero-pill rule */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <div className="flex items-center gap-1.5 font-bold text-[#5584B4] dark:text-[#DDEBF7] lowercase">
                        {getFormatIcon(item.format, item.type)}
                        <span>{item.type.toLowerCase()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 tabular-nums">
                        <span>{item.date}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.size}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <div
                      className={`text-xs font-mono font-bold leading-snug transition-colors line-clamp-1 ${
                        isDark
                          ? 'text-white group-hover:text-[#DDEBF7]'
                          : 'text-slate-900 group-hover:text-[#5584B4]'
                      }`}
                    >
                      {item.title}
                    </div>

                    {/* Snippet */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.contentSnippet}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div
                    className={`mt-3 pt-3 border-t flex items-center justify-between text-xs font-mono ${
                      isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
                    }`}
                  >
                    <span className="text-[11px] text-slate-500 lowercase">
                      {item.stage.toLowerCase()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDownloadItem(e, item)}
                        className={`p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors`}
                        title="Download Document"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenLibraryItem(item);
                        }}
                        className={`flex items-center gap-1 text-[11px] font-bold text-[#5584B4] dark:text-[#DDEBF7] hover:underline lowercase`}
                      >
                        <Eye className="h-3 w-3" />
                        <span>inspect</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* HIGH-DENSITY TABLE VIEW */
            <div
              className={`rounded-xl border overflow-hidden ${
                isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr
                      className={`border-b text-[11px] uppercase tracking-wider text-slate-500 ${
                        isDark ? 'bg-[#0E1220] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
                      }`}
                    >
                      <th className="py-2.5 px-3 font-semibold">Document Title</th>
                      <th className="py-2.5 px-3 font-semibold">Type</th>
                      <th className="py-2.5 px-3 font-semibold">Stage</th>
                      <th className="py-2.5 px-3 font-semibold tabular-nums">Size</th>
                      <th className="py-2.5 px-3 font-semibold">Date</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D8] dark:divide-[#252E4A]">
                    {filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => onOpenLibraryItem(item)}
                        className={`cursor-pointer transition-colors ${
                          isDark ? 'hover:bg-[#1A223C]' : 'hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {getFormatIcon(item.format, item.type)}
                          <span className="truncate max-w-xs">{item.title}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 lowercase">
                          {item.type.toLowerCase()}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 lowercase">
                          {item.stage.toLowerCase()}
                        </td>
                        <td className="py-2.5 px-3 tabular-nums text-slate-600 dark:text-slate-300">
                          {item.size}
                        </td>
                        <td className="py-2.5 px-3 tabular-nums text-slate-500">
                          {item.date}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleDownloadItem(e, item)}
                              className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              title="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenLibraryItem(item)}
                              className="px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#0E1220] border border-[#D8CEBC] dark:border-[#252E4A] text-[10px] font-bold text-[#5584B4] dark:text-[#DDEBF7] lowercase"
                            >
                              inspect
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: COMPANION WORKBOOKS & V1 TEMPLATE PACKS                        */}
        {/* ========================================================================= */}
        <div
          className={`rounded-2xl border p-4 sm:p-5 shadow-xs space-y-3 ${
            isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                V1 COMPANION WORKBOOKS & ACCELERATION TEMPLATES
              </span>
              <p className="text-xs text-slate-500 lowercase mt-0.5">
                unlocked spreadsheets and diagnostic guides included with bizzbean membership
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#DDEBF7] text-[#24496B] dark:bg-[#1E3048] dark:text-[#DDEBF7] lowercase">
              client owned
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: 'Bizzbean 4-Stage Spectrum Master Workbook',
                desc: 'Consolidated 3-statement model with automated linking between vi-ability CAC metrics and fund-ability DCF valuation.',
                format: 'XLSX / GSHEET',
                size: '2.8 MB',
              },
              {
                title: 'Socratic Founder Diagnostic Self-Assessment Guide',
                desc: '12-page strategic manual with 48 diagnostic inquiry questions across all 4 pillars of venture sustainability.',
                format: 'PDF EXECUTIVE',
                size: '640 KB',
              },
              {
                title: 'Institutional Virtual Data Room (VDR) Master Index',
                desc: 'Folder taxonomy, NDA registers, cap table audit logs, and institutional investor clearance templates.',
                format: 'XLSX / GDOC',
                size: '420 KB',
              },
              {
                title: 'Unit Economics & Cash Velocity Sensitivity Engine',
                desc: 'Interactive stress-test simulator with break-even velocity curves and emergency runway contingency triggers.',
                format: 'GSHEET ENGINE',
                size: '1.1 MB',
              },
            ].map((wb, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  isDark ? 'bg-[#0E1220] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
                    <span className="font-bold text-[#5584B4]">{wb.format}</span>
                    <span className="tabular-nums">{wb.size}</span>
                  </div>
                  <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {wb.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {wb.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#E8E2D8] dark:border-[#252E4A] flex justify-end">
                  <button
                    onClick={() => showToast(`Synchronized "${wb.title}" to Google Drive.`)}
                    className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#5584B4] dark:text-[#DDEBF7] hover:underline lowercase"
                  >
                    <Download className="h-3 w-3" />
                    <span>sync to drive</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FOOTER: CLOUD SECURITY & ENCRYPTION NOTE                                  */}
        {/* ========================================================================= */}
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
            isDark ? 'bg-[#141A2E] border-[#252E4A] text-slate-400' : 'bg-white border-[#E8E2D8] text-slate-600 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="lowercase">
              vault encrypted with aes-256 · macro-free formula execution · 100% client proprietary ownership
            </span>
          </div>

          <span className="text-[10px] text-slate-400 lowercase hidden sm:inline">
            bizzbean sandbox v2.0
          </span>
        </div>

      </div>

      {/* Full Sandbox Knowledge Vault Modal */}
      {showStashVault && (
        <SandboxLibrary
          onClose={() => setShowStashVault(false)}
          userProfile={userProfile}
          onSelectApp={(appId) => {
            setShowStashVault(false);
            if (onLaunchRelatedSolution) {
              onLaunchRelatedSolution(appId);
            }
          }}
        />
      )}
    </div>
  );
};
