import React, { useState } from 'react';
import { DialogueMessage, LibraryItem, BizzSolution, UserBusinessProfile } from '../types';
import {
  Library,
  Download,
  ShieldCheck,
  CheckSquare,
  Square,
  Plus,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { DailyObjective } from './CloseShopModal';
import { GeminiSearchDock } from './GeminiSearchDock';

interface KnowledgeBasePanelProps {
  dialogueMessages?: DialogueMessage[];
  libraryItems: LibraryItem[];
  theme: 'light' | 'dark';
  objectives: DailyObjective[];
  activeKbTab?: 'search' | 'dialogue' | 'library';
  onTabChange?: (tab: 'search' | 'dialogue' | 'library') => void;
  onToggleObjective: (id: string) => void;
  onAddObjective: (text: string) => void;
  onSendMessage?: (text: string) => void;
  onOpenLibraryItem: (item: LibraryItem) => void;
  activeSolution?: BizzSolution;
  activeStageId?: string;
  onResetDialogue?: () => void;
  onOpenLibraryInCenterPanel?: () => void;
  userProfile?: UserBusinessProfile;
  onSelectSolutionById?: (id: string) => void;
}

export const KnowledgeBasePanel: React.FC<KnowledgeBasePanelProps> = ({
  libraryItems,
  theme,
  objectives,
  onToggleObjective,
  onAddObjective,
  onOpenLibraryItem,
  onOpenLibraryInCenterPanel,
  userProfile,
}) => {
  const isDark = theme === 'dark';
  const [newObjInput, setNewObjInput] = useState('');

  const handleAddObj = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjInput.trim()) return;
    onAddObjective(newObjInput.trim());
    setNewObjInput('');
  };

  return (
    <aside
      className={`w-full border lg:rounded-2xl flex flex-col justify-between overflow-hidden select-none shrink-0 h-full transition-colors ${
        isDark
          ? 'bg-[#101424] border-[#252E4A] lg:shadow-xs text-[#E2E8F0]'
          : 'bg-[#FAF8F5] border-[#E8E2D8] lg:shadow-xs text-slate-800'
      }`}
    >
      {/* Top Panel Title - Aligned with Left Solutions Panel Header */}
      <div
        className={`p-2.5 sm:p-3 border-b shrink-0 flex items-center justify-between min-h-[49px] ${
          isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#F4EFE6]/80 border-[#E8E2D8]'
        }`}
      >
        <div className="flex items-center gap-2 px-1 py-0.5">
          <BookOpen className="h-4 w-4 text-[#5584B4]" />
          <h2
            className={`font-mono text-xs font-bold tracking-wider uppercase ${
              isDark ? 'text-[#DDEBF7]' : 'text-slate-900'
            }`}
          >
            KNOWLEDGE BASE
          </h2>
        </div>

        {onOpenLibraryInCenterPanel && (
          <button
            type="button"
            onClick={onOpenLibraryInCenterPanel}
            className="text-[11px] font-mono font-semibold text-[#5584B4] hover:underline flex items-center gap-1 lowercase cursor-pointer whitespace-nowrap"
            title="Open Full Virtual Library in Work Area"
          >
            <span>library</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Upper Section: VIRTUAL LIBRARY & DAILY WORK OBJECTIVES (Coach GIM replaced with Library) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {/* Open Full Virtual Library */}
        {onOpenLibraryInCenterPanel && (
          <button
            type="button"
            onClick={onOpenLibraryInCenterPanel}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#161C30] hover:bg-[#1E2548] text-[#DDEBF7] border-[#252E4A]'
                : 'bg-white hover:bg-[#F4EFE6] text-slate-900 border-[#D8CEBC] shadow-xs'
            }`}
            title="Open Full Virtual Library in Centre Work Area"
          >
            <div className="flex items-center gap-2">
              <Library className="h-4 w-4 text-[#5584B4]" />
              <div className="text-left">
                <span className="block uppercase text-[11px] font-bold">VIRTUAL LIBRARY</span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 lowercase">
                  models, memos & google drive sync
                </span>
              </div>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-[#5584B4] shrink-0" />
          </button>
        )}

        {/* Daily Work Objectives (3 Focus Points) */}
        <div
          className={`p-3 rounded-xl border space-y-2 ${
            isDark
              ? 'bg-[#161C30] border-[#252E4A]'
              : 'bg-white border-[#E8E2D8] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              DAILY OBJECTIVES
            </span>
            <span className="text-slate-500 dark:text-slate-400 lowercase">3 focus points</span>
          </div>

          <div className="space-y-1">
            {objectives.map((obj) => (
              <div
                key={obj.id}
                onClick={() => onToggleObjective(obj.id)}
                className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-[#1E2548] cursor-pointer transition-colors"
              >
                {obj.completed ? (
                  <CheckSquare className="h-3.5 w-3.5 text-[#5584B4] shrink-0 mt-0.5" />
                ) : (
                  <Square className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <span
                  className={`text-xs leading-snug ${
                    obj.completed
                      ? 'line-through text-slate-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {obj.text}
                </span>
              </div>
            ))}
          </div>

          {objectives.length < 3 && (
            <form
              onSubmit={handleAddObj}
              className="flex gap-1 pt-1.5 border-t border-[#E8E2D8] dark:border-[#252E4A]"
            >
              <input
                type="text"
                value={newObjInput}
                onChange={(e) => setNewObjInput(e.target.value)}
                placeholder="add next objective..."
                className="flex-grow px-2 py-1 text-xs font-mono bg-[#FAF8F5] dark:bg-[#0A0D14] border border-[#D8CEBC] dark:border-[#252E4A] rounded text-slate-800 dark:text-white focus:outline-none"
              />
              <button
                type="submit"
                className="p-1.5 rounded bg-[#12172A] text-white text-xs font-mono cursor-pointer"
                title="Add Objective"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Stored Assets List */}
        <div
          className={`text-[11px] font-mono flex items-center justify-between pb-1.5 border-b ${
            isDark ? 'border-[#252E4A] text-slate-400' : 'border-[#E8E2D8] text-slate-500'
          }`}
        >
          <span className="uppercase font-semibold">STORED ASSETS ({libraryItems.length})</span>
          <span className="text-[#5584B4] lowercase">drive sync</span>
        </div>

        <div className="space-y-2">
          {libraryItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onOpenLibraryItem(item)}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all group ${
                isDark
                  ? 'bg-[#161C30] hover:bg-[#1E2548] border-[#252E4A]'
                  : 'bg-white hover:bg-[#F4EFE6] border-[#E8E2D8] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-0.5 lowercase">
                <span className="font-semibold text-[#5584B4] dark:text-[#DDEBF7]">
                  {item.type.toLowerCase()}
                </span>
                <span>{item.date}</span>
              </div>
              <div
                className={`text-xs font-mono font-bold truncate transition-colors ${
                  isDark
                    ? 'text-white group-hover:text-[#DDEBF7]'
                    : 'text-slate-900 group-hover:text-[#5584B4]'
                }`}
              >
                {item.title}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {item.contentSnippet}
              </div>
              <div
                className={`mt-1.5 pt-1.5 border-t flex items-center justify-between text-[11px] font-mono ${
                  isDark ? 'border-[#252E4A] text-slate-500' : 'border-[#E8E2D8] text-slate-400'
                }`}
              >
                <span className="lowercase">{item.stage.toLowerCase()}</span>
                <span className="text-[#5584B4] dark:text-[#DDEBF7] flex items-center gap-1 font-semibold">
                  <Download className="h-2.5 w-2.5" />
                  <span>{item.size}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`p-2.5 rounded-lg border text-[11px] font-mono flex items-center gap-2 ${
            isDark
              ? 'bg-[#161C30] border-[#252E4A] text-slate-400'
              : 'bg-white border-[#E8E2D8] text-slate-600 shadow-xs'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-[#5584B4] shrink-0" />
          <span className="lowercase">encrypted cloud library with google sheets sync.</span>
        </div>
      </div>

      {/* Bottom Dialogue Dock: ASK GEMINI */}
      <div className="shrink-0">
        <GeminiSearchDock theme={theme} userProfile={userProfile} compact />
      </div>
    </aside>
  );
};

export default KnowledgeBasePanel;
