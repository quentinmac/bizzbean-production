import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DialogueMessage, LibraryItem, BizzSolution, UserBusinessProfile } from '../types';
import {
  Search,
  MessageSquare,
  Library,
  Send,
  Download,
  ShieldCheck,
  CheckSquare,
  Square,
  Plus,
  Sparkles,
  RotateCcw,
  Compass,
  BrainCircuit,
  TrendingUp,
  Coins,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Target,
  ExternalLink,
  Bot,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { DailyObjective } from './CloseShopModal';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';

interface V1ProcessQuestion {
  key: string;
  label: string;
  sub: string;
  query: string;
  pillar: 'critical_thinking' | 'strategy' | 'financial_integration';
}

export const V1_PROCESS_QUESTIONS: V1ProcessQuestion[] = [
  {
    key: 'WHO',
    label: 'WHO',
    sub: 'customer & buyer',
    query: 'WHO is my precise target customer, economic buyer, and end-user for this solution?',
    pillar: 'critical_thinking',
  },
  {
    key: 'WHAT',
    label: 'WHAT',
    sub: 'problem & value prop',
    query: 'WHAT exact problem does this solve, and what is our defensible core value proposition?',
    pillar: 'critical_thinking',
  },
  {
    key: 'WHY',
    label: 'WHY',
    sub: 'moat & why now',
    query: 'WHY will customers switch from existing alternatives, and why is this moat sustainable?',
    pillar: 'strategy',
  },
  {
    key: 'WHERE',
    label: 'WHERE',
    sub: 'channels & market',
    query: 'WHERE is our target market concentrated, and where are our primary distribution channels?',
    pillar: 'strategy',
  },
  {
    key: 'WHEN',
    label: 'WHEN',
    sub: 'milestones & runway',
    query: 'WHEN do we hit cash break-even, and when do our 18-month runway alarms trigger?',
    pillar: 'financial_integration',
  },
  {
    key: 'HOW',
    label: 'HOW',
    sub: 'margins & economics',
    query: 'HOW do our unit economics scale (pricing, contribution margins >= 65%, and CAC : LTV >= 3.2x)?',
    pillar: 'financial_integration',
  },
];

interface KnowledgeBasePanelProps {
  dialogueMessages: DialogueMessage[];
  libraryItems: LibraryItem[];
  theme: 'light' | 'dark';
  objectives: DailyObjective[];
  activeKbTab?: 'search' | 'dialogue' | 'library';
  onTabChange?: (tab: 'search' | 'dialogue' | 'library') => void;
  onToggleObjective: (id: string) => void;
  onAddObjective: (text: string) => void;
  onSendMessage: (text: string) => void;
  onOpenLibraryItem: (item: LibraryItem) => void;
  activeSolution?: BizzSolution;
  activeStageId?: string;
  onResetDialogue?: () => void;
  onOpenLibraryInCenterPanel?: () => void;
  userProfile?: UserBusinessProfile;
  onSelectSolutionById?: (id: string) => void;
}

export const KnowledgeBasePanel: React.FC<KnowledgeBasePanelProps> = ({
  dialogueMessages,
  libraryItems,
  theme,
  objectives,
  activeKbTab,
  onTabChange,
  onToggleObjective,
  onAddObjective,
  onSendMessage,
  onOpenLibraryItem,
  activeSolution,
  activeStageId,
  onResetDialogue,
  onOpenLibraryInCenterPanel,
  userProfile,
  onSelectSolutionById,
}) => {
  const isDark = theme === 'dark';
  const [internalTab, setInternalTab] = useState<'search' | 'dialogue' | 'library'>('dialogue');
  const activeTab = activeKbTab || internalTab;

  const handleSelectTab = (tab: 'search' | 'dialogue' | 'library') => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [inputText, setInputText] = useState('');
  const [newObjInput, setNewObjInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === 'dialogue') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dialogueMessages, activeTab]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleAddObj = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjInput.trim()) return;
    onAddObjective(newObjInput.trim());
    setNewObjInput('');
  };

  // Dynamic context generation based on member's active work in the left-hand panel
  const currentStageName = (activeStageId || activeSolution?.stage || 'vi-ability').toLowerCase();
  const currentSolutionName = (activeSolution?.name || 'vi-ability').toLowerCase();

  // Context-tailored 1-click engagement prompts
  const getContextPrompts = () => {
    if (currentStageName.includes('vi-ability') || currentSolutionName.includes('calc') || currentSolutionName.includes('capital')) {
      return [
        { label: 'Challenge my CAC : LTV assumptions', query: 'Challenge my customer acquisition cost vs lifetime value assumptions for vi-ability.' },
        { label: 'Audit contribution margin floor', query: 'Help me evaluate my break-even contribution margin floor in bizzcalc.' },
        { label: 'Uncover customer discovery blind spots', query: 'What are the most common founder blind spots in problem-solution lean validation?' },
      ];
    }
    if (currentStageName.includes('fund-ability') || currentSolutionName.includes('model') || currentSolutionName.includes('plan')) {
      return [
        { label: 'Stress-test 3-statement sensitivity', query: 'Stress-test my 3-statement financial model under bear-market revenue conditions.' },
        { label: 'Evaluate DCF terminal growth rate', query: 'What terminal growth rate and discount rate should I defend in my DCF model?' },
        { label: 'Review investor pitch defensibility', query: 'How do institutional investors scrutinize revenue forecasts in a diligence round?' },
      ];
    }
    if (currentStageName.includes('sustain-ability') || currentSolutionName.includes('runway') || currentSolutionName.includes('profit')) {
      return [
        { label: 'Audit 18-month cash runway alarms', query: 'Analyze my 18-month cash runway buffer and identify burn acceleration triggers.' },
        { label: 'Detect debtor collection lag risks', query: 'What happens to my runway if accounts receivable collection slips from 30 to 60 days?' },
        { label: 'Recommend margin trimming levers', query: 'What operational overhead expenses can bizzoptimizer trim without hurting sales?' },
      ];
    }
    if (currentStageName.includes('invest-ability') || currentSolutionName.includes('vdr')) {
      return [
        { label: 'Check VDR data room audit readiness', query: 'Evaluate my Virtual Data Room checklist for institutional due diligence readiness.' },
        { label: 'Simulate cap table dilution waterfall', query: 'Model the impact of a 15% employee stock option pool on founder equity.' },
        { label: 'Review term sheet defense tactics', query: 'What protective provisions and liquidation preferences should I challenge?' },
      ];
    }
    if (currentStageName.includes('operations') || currentSolutionName.includes('money') || currentSolutionName.includes('budget')) {
      return [
        { label: 'Verify standard chart of accounts', query: 'Explain how the 62 standard bizzmoney accounts feed into bizzmodel forecasts.' },
        { label: 'Review zero-base budget variance', query: 'How should I handle budget variance triggers in bizzbudget when sales fluctuate?' },
        { label: 'Negotiate net-60 vendor payment terms', query: 'How does extending vendor payment terms to net-60 improve working capital?' },
      ];
    }
    if (currentStageName.includes('personal-sandbox')) {
      return [
        { label: 'Audit my assembled solution suite', query: 'Evaluate my personal-SANDBOX assembled cockpit and flag any missing capabilities.' },
        { label: 'Test holistic venture viability', query: 'Run a comprehensive Socratic viability check across all my unlocked solutions.' },
        { label: 'Identify next operational milestone', query: 'Based on my selected sandbox tools, what should my next milestone be?' },
      ];
    }
    return [
      { label: 'Test my operational assumptions', query: 'I want to test my operational assumptions and uncover strategic blind spots.' },
      { label: 'Detect cognitive confirmation bias', query: 'Where am I likely falling into founder confirmation bias with my venture?' },
      { label: 'Align venture with 4 Stages', query: 'How do I systematically advance my company through the 4 Bizzbean stages?' },
    ];
  };

  const contextPrompts = getContextPrompts();

  // Filter messages
  const filteredMessages = dialogueMessages;

  return (
    <aside
      className={`w-full border lg:rounded-2xl flex flex-col justify-between overflow-hidden select-none shrink-0 h-full transition-colors ${
        isDark ? 'bg-[#101424] border-[#252E4A] lg:shadow-xs text-[#E2E8F0]' : 'bg-[#FAF8F5] border-[#E8E2D8] lg:shadow-xs text-slate-800'
      }`}
    >
      {/* Panel Top Title - Precisely aligned with Left-Hand Solutions Panel Header */}
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
      </div>

      {/* 2 Tabs (DIALOGUE & LIBRARY) */}
      <div
        className={`grid grid-cols-2 p-1 border-b gap-1 text-xs font-mono ${
          isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#F4EFE6]/60 border-[#E8E2D8]'
        }`}
      >
        <button
          onClick={() => handleSelectTab('dialogue')}
          className={`py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 uppercase ${
            activeTab === 'dialogue'
              ? isDark
                ? 'bg-[#1E2548]/30 text-[#D4A373] border border-[#5584B4]/40 shadow-2xs font-bold'
                : 'bg-[#F2ECE1]/70 text-[#8C6D3F] border border-[#D8CEBC] shadow-2xs font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Coach GIM Dialogue & Process Questions"
        >
          <MessageSquare className="h-3 w-3" />
          <span>DIALOGUE</span>
        </button>

        <button
          onClick={() => {
            handleSelectTab('library');
            if (onOpenLibraryInCenterPanel) {
              onOpenLibraryInCenterPanel();
            }
          }}
          className={`py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 uppercase ${
            activeTab === 'library'
              ? isDark
                ? 'bg-[#1E2548]/30 text-[#D4A373] border border-[#5584B4]/40 shadow-2xs font-bold'
                : 'bg-[#F2ECE1]/70 text-[#8C6D3F] border border-[#D8CEBC] shadow-2xs font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Virtual Library & Focus Ledger"
        >
          <Library className="h-3 w-3" />
          <span>LIBRARY</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DIALOGUE (AI-DRIVEN ENGAGEMENT LOOP / GENTLE COACH FROM V1)        */}
      {/* ========================================================================= */}
      {activeTab === 'dialogue' && (
        <div className="flex-grow flex flex-col justify-between overflow-hidden">
          
          {/* TOP: COACH GIM IS LISTENING BANNER & V1 PROCESS QUESTIONS (Replaced remove.jpg with listening.jpg) */}
          <div className="p-3 border-b border-[#E8E2D8] dark:border-[#252E4A] bg-[#FAF8F5]/80 dark:bg-[#12172A]/70 space-y-2.5 shrink-0">
            {/* listening.jpg Visual Card Banner with COACH GIM IS LISTENING */}
            <div className="relative rounded-xl overflow-hidden border border-[#D8CEBC] dark:border-[#252E4A] bg-[#12172A] shadow-xs group">
              <img
                src="/listening.jpg"
                alt="COACH GIM IS LISTENING"
                className="w-full h-24 sm:h-28 object-cover object-center select-none transition-transform duration-300 group-hover:scale-[1.02]"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('src/assets')) {
                    target.src = '/src/assets/listening.jpg';
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E1220]/95 via-[#12172A]/35 to-transparent flex flex-col justify-end p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-xs" />
                    <h3 className="font-mono text-xs font-bold text-white tracking-wider uppercase">
                      COACH GIM IS LISTENING
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono text-[#DDEBF7] bg-[#1E2548]/90 border border-[#5584B4]/50 px-1.5 py-0.5 rounded uppercase font-semibold">
                    PROCESS COACH
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-300/90 lowercase mt-0.5 flex items-center justify-between">
                  <span>socratic engagement loop · active & attentive</span>
                  <span className="text-[#D4A373] text-[9px] font-semibold uppercase">6 process questions</span>
                </div>
              </div>
            </div>

            {/* Process Questions: Who, What, Why, Where, When, How */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">
                  PROCESS QUESTIONS:
                </span>
                <span className="text-[#5584B4] dark:text-[#93C5FD] lowercase">
                  1-click to ask coach gim
                </span>
              </div>

              {/* 6 Process Questions Grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {V1_PROCESS_QUESTIONS.map((pq) => (
                  <button
                    key={pq.key}
                    type="button"
                    onClick={() => onSendMessage(pq.query)}
                    className="p-1.5 rounded-lg border transition-all text-left flex flex-col justify-between group cursor-pointer bg-white hover:bg-[#DDEBF7]/40 border-[#E8E2D8] hover:border-[#5584B4] dark:bg-[#161C30] dark:border-[#252E4A] dark:hover:bg-[#1E2548] dark:hover:border-[#5584B4] shadow-xs active:scale-[0.98]"
                    title={`${pq.label}: ${pq.sub} - Click to ask Coach GIM`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white group-hover:text-[#5584B4] dark:group-hover:text-[#93C5FD] transition-colors">
                        {pq.label}
                      </span>
                      <ChevronRight className="h-2.5 w-2.5 text-slate-400 group-hover:text-[#5584B4] transition-colors" />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 truncate lowercase mt-0.5">
                      {pq.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-grow p-3 space-y-3 overflow-y-auto">
            {filteredMessages.map((msg) => {
              const isGim = msg.sender === 'gim';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isGim ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 mb-1 px-1 lowercase">
                    {isGim && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#5584B4]" />
                    )}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {isGim ? 'gim (gentle business coach)' : 'you (founder)'}
                    </span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[94%] ${
                      isGim
                        ? isDark
                          ? 'bg-[#161C30] border border-[#252E4A] text-slate-200 shadow-xs'
                          : 'bg-white border border-[#E8E2D8] text-slate-800 shadow-xs'
                        : isDark
                        ? 'bg-[#1E2548] text-white font-medium border border-[#5584B4]'
                        : 'bg-[#12172A] text-white font-medium'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed">
                      {msg.text}
                    </div>

                    {/* Socratic Action Prompt Pill */}
                    {msg.actionPrompt && (
                      <div
                        className={`mt-2.5 pt-2 border-t flex items-center justify-between ${
                          isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
                        }`}
                      >
                        <span className="text-[10px] font-mono text-slate-400 lowercase">
                          pillar: {msg.pillar ? msg.pillar.replace('_', ' ') : 'socratic critical thinking'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onSendMessage(msg.actionPrompt!)}
                          className="px-2 py-0.5 rounded bg-[#DDEBF7] dark:bg-[#1E3048] hover:bg-[#5584B4] hover:text-white dark:hover:bg-[#5584B4] text-[#24496B] dark:text-[#DDEBF7] text-[10px] font-mono font-bold lowercase transition-all border border-[#DDEBF7] dark:border-[#5584B4] flex items-center gap-1 cursor-pointer"
                        >
                          <span>{msg.actionPrompt.toLowerCase()}</span>
                          <ChevronRight className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Heightened Dialogue Input Panel: Allows user to see multiple typed lines */}
          <form
            onSubmit={handleSend}
            className={`p-2.5 border-t flex flex-col gap-2 shrink-0 ${
              isDark ? 'border-[#252E4A] bg-[#161C30]/80' : 'border-[#E8E2D8] bg-[#F4EFE6]/60'
            }`}
          >
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!inputText.trim()) return;
                    onSendMessage(inputText.trim());
                    setInputText('');
                  }
                }}
                rows={3}
                placeholder="Ask Coach GIM (Who, What, Why, Where, When, How)..."
                className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-none transition-colors resize-none leading-relaxed min-h-[68px] ${
                  isDark
                    ? 'bg-[#0A0D14] border-[#252E4A] text-white placeholder-slate-500 focus:border-[#5584B4]'
                    : 'bg-white border-[#D8CEBC] text-slate-900 placeholder-slate-400 focus:border-[#12172A]'
                }`}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 lowercase flex items-center gap-1 truncate">
                <span>press enter to send · shift+enter for new line</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {inputText.trim() && (
                  <button
                    type="button"
                    onClick={() => setInputText('')}
                    className="px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors lowercase cursor-pointer"
                  >
                    clear
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all lowercase cursor-pointer ${
                    inputText.trim()
                      ? isDark
                        ? 'bg-[#5584B4] hover:bg-[#4773A0] text-white shadow-xs active:scale-95'
                        : 'bg-[#12172A] hover:bg-[#1E2548] text-white shadow-xs active:scale-95'
                      : 'opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-700 text-slate-500'
                  }`}
                  title="Send to Coach GIM"
                >
                  <Send className="h-3 w-3" />
                  <span>send</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VIRTUAL LIBRARY (Stored Forecasts, Models & DAILY WORK OBJECTIVES) */}
      {/* ========================================================================= */}
      {activeTab === 'library' && (
        <div className="flex-grow flex flex-col justify-between overflow-hidden p-3 space-y-3">
          
          {/* Quick Centre Panel Expansion Button */}
          {onOpenLibraryInCenterPanel && (
            <button
              onClick={onOpenLibraryInCenterPanel}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono transition-colors font-bold ${
                isDark
                  ? 'bg-[#1E2548] hover:bg-[#252E58] text-[#DDEBF7] border-[#5584B4]'
                  : 'bg-[#12172A] hover:bg-[#1E2548] text-white border-[#12172A]'
              }`}
              title="Display full Library in Centre Panel"
            >
              <div className="flex items-center gap-2">
                <Library className="h-4 w-4 text-[#C59B63]" />
                <div className="text-left">
                  <span className="block uppercase text-[11px] font-bold text-white">OPEN LIBRARY</span>
                  <span className="block text-[9px] text-[#D4A373] font-mono lowercase">Firebase Storage & AI Grounding</span>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </button>
          )}

          {/* USER FEATURE: 3 WORK OBJECTIVES FOR THE DAY */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#161C30] border border-[#D8CEBC] dark:border-[#252E4A] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                DAILY WORK OBJECTIVES (3 FOCUS POINTS)
              </span>
              <span className="text-[10px] font-mono text-[#5584B4] lowercase">
                session focus
              </span>
            </div>

            <div className="space-y-1.5">
              {objectives.map((obj) => (
                <div
                  key={obj.id}
                  onClick={() => onToggleObjective(obj.id)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-[#1E2548] cursor-pointer transition-colors"
                >
                  {obj.completed ? (
                    <CheckSquare className="h-3.5 w-3.5 text-[#5584B4] shrink-0" />
                  ) : (
                    <Square className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  )}
                  <span
                    className={`text-xs ${
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

            {/* Quick Add Objective */}
            {objectives.length < 3 && (
              <form onSubmit={handleAddObj} className="flex gap-1 pt-1 border-t border-[#E8E2D8] dark:border-[#252E4A]">
                <input
                  type="text"
                  value={newObjInput}
                  onChange={(e) => setNewObjInput(e.target.value)}
                  placeholder="add next objective..."
                  className="flex-grow px-2 py-1 text-xs font-mono bg-[#FAF8F5] dark:bg-[#0A0D14] border border-[#D8CEBC] rounded text-slate-800 dark:text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-1 rounded bg-[#12172A] text-white text-xs font-mono"
                  title="Add Objective"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </div>

          {/* Stored Assets Header */}
          <div
            className={`text-xs font-mono flex items-center justify-between pb-1.5 border-b ${
              isDark ? 'border-[#252E4A] text-slate-400' : 'border-[#E8E2D8] text-slate-500'
            }`}
          >
            <span className="uppercase font-semibold">STORED ASSETS ({libraryItems.length})</span>
            <span className="text-[#24496B] dark:text-[#DDEBF7] bg-[#DDEBF7]/70 dark:bg-[#1E3048] px-2 py-0.5 rounded font-mono text-[10px] lowercase font-medium border border-[#DDEBF7] dark:border-[#5584B4]">
              google drive linked
            </span>
          </div>

          <div className="flex-grow space-y-2 overflow-y-auto">
            {libraryItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onOpenLibraryItem(item)}
                className={`p-3 rounded-xl border cursor-pointer transition-all group ${
                  isDark
                    ? 'bg-[#161C30] hover:bg-[#1E2548] border-[#252E4A]'
                    : 'bg-white hover:bg-[#F4EFE6] border-[#E8E2D8] shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1 lowercase">
                  <span className="font-bold text-[#5584B4] dark:text-[#DDEBF7]">{item.type.toLowerCase()}</span>
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
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {item.contentSnippet}
                </div>
                <div
                  className={`mt-2 pt-2 border-t flex items-center justify-between text-xs font-mono ${
                    isDark ? 'border-[#252E4A] text-slate-500' : 'border-[#E8E2D8] text-slate-400'
                  }`}
                >
                  <span className="lowercase">stage: {item.stage.toLowerCase()}</span>
                  <span className="text-[#5584B4] dark:text-[#DDEBF7] flex items-center gap-1 font-semibold">
                    <Download className="h-2.5 w-2.5" />
                    <span>{item.size}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            className={`p-2.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
              isDark
                ? 'bg-[#161C30] border-[#252E4A] text-slate-400'
                : 'bg-white border-[#E8E2D8] text-slate-600 shadow-xs'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#5584B4] shrink-0" />
            <span className="lowercase">encrypted cloud storage with macro-free google sheets sync.</span>
          </div>
        </div>
      )}

    </aside>
  );
};
