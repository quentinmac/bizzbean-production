import React, { useState, useEffect, useRef } from 'react';
import { UserBusinessProfile } from '../types';
import {
  SearchThread,
  SearchMessage,
  INITIAL_MEMBER_SEARCH_THREADS,
  executeGeminiSearch,
} from '../services/geminiSearchService';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  MessageSquare,
  Copy,
  Check,
  RotateCcw,
  Bot,
  Trash2,
} from 'lucide-react';

interface GeminiSearchDockProps {
  theme: 'light' | 'dark';
  userProfile?: UserBusinessProfile;
  onSendToDialogue?: (prompt: string) => void;
  initialQuery?: string;
}

export const GeminiSearchDock: React.FC<GeminiSearchDockProps> = ({
  theme,
  userProfile,
  onSendToDialogue,
  initialQuery,
}) => {
  const isDark = theme === 'dark';
  const memberEmail = 'thebizzbeanchannel@gmail.com';
  const memberName = userProfile?.founderName || 'Elena Vance';
  const memberSlug = userProfile?.slug || 'apex-cloud';
  const storageKey = `bizzdesk_gemini_threads_${memberSlug}`;

  // Threads state persisted per member (cleans legacy mock example data to enable simulation testing)
  const [threads, setThreads] = useState<SearchThread[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If parsed contains legacy example message 'tm-1' or hardcoded runway example, purge to clean state
        const hasLegacyExample = parsed.some((t: any) =>
          t.messages?.some(
            (m: any) =>
              m.id === 'tm-1' ||
              m.text?.includes('18-month cash runway safeguard and when should I trigger')
          )
        );
        if (!hasLegacyExample && Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore parse error
    }
    return INITIAL_MEMBER_SEARCH_THREADS;
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(() => {
    return threads[0]?.id || 'thread-active';
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showThreadDropdown, setShowThreadDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync initial query if triggered externally (e.g. from Bizzy Assistant "Search in Gemini")
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setInputQuery(initialQuery);
      setIsExpanded(true);
    }
  }, [initialQuery]);

  // Save threads to localStorage when updated
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(threads));
    } catch (e) {
      // Ignore quota error
    }
  }, [threads, storageKey]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread?.messages, isExpanded]);

  const handleCreateNewThread = () => {
    const newThreadId = `thread-${Date.now()}`;
    const newThread: SearchThread = {
      id: newThreadId,
      title: 'New Venture Inquiry',
      memberEmail,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      messages: [],
    };
    setThreads([newThread, ...threads]);
    setActiveThreadId(newThreadId);
    setShowThreadDropdown(false);
    setIsExpanded(true);
  };

  const handleClearThreadMessages = () => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              title: 'New Venture Inquiry',
              updatedAt: 'Just now',
              messages: [],
            }
          : t
      )
    );
  };

  const handleExecuteSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputQuery.trim();
    if (!query || isLoading) return;

    setInputQuery('');
    setIsExpanded(true);
    setIsLoading(true);

    const userMsg: SearchMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update active thread with user message
    const updatedMessages = [...(activeThread?.messages || []), userMsg];
    const updatedTitle =
      !activeThread?.messages || activeThread.messages.length === 0
        ? query.length > 35
          ? query.substring(0, 32) + '...'
          : query
        : activeThread?.title || 'Venture Inquiry';

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              title: updatedTitle,
              updatedAt: 'Just now',
              messages: updatedMessages,
            }
          : t
      )
    );

    try {
      const result = await executeGeminiSearch(query, memberEmail, memberName, updatedMessages);

      const modelMsg: SearchMessage = {
        id: `gem-${Date.now()}`,
        role: 'model',
        text: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: result.sources,
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? {
                ...t,
                updatedAt: 'Just now',
                messages: [...t.messages, modelMsg],
              }
            : t
        )
      );
    } catch (err) {
      // Graceful error fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  return (
    <div
      className={`border-t transition-all duration-200 flex flex-col shrink-0 select-none ${
        isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
      }`}
    >
      {/* Header Strip: Member Threads, Clear / Reset for Simulation Testing, & Toggle */}
      <div
        className={`px-3 py-2 flex items-center justify-between border-b text-xs font-mono cursor-pointer transition-colors ${
          isDark
            ? 'bg-[#141A2E]/90 hover:bg-[#161C30] border-[#252E4A]'
            : 'bg-[#F4EFE6]/90 hover:bg-[#EFE8DC] border-[#E8E2D8]'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 truncate">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            <Sparkles className="h-3.5 w-3.5 text-[#5584B4] animate-pulse shrink-0" />
            <span>GEMINI SEARCH</span>
          </div>

          <span className="text-[10px] text-slate-400 dark:text-slate-500">·</span>

          {/* Member Thread Selector */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowThreadDropdown(!showThreadDropdown)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] lowercase font-semibold border transition-colors ${
                isDark
                  ? 'bg-[#1E2548] text-[#DDEBF7] border-[#5584B4]/50 hover:bg-[#252E58]'
                  : 'bg-white text-[#24496B] border-[#D8CEBC] hover:bg-[#FAF8F5]'
              }`}
              title="Switch Member Search Thread"
            >
              <span className="truncate max-w-[120px] font-bold">
                {activeThread?.title || 'active thread'}
              </span>
              <ChevronDown className="h-2.5 w-2.5 opacity-70 shrink-0" />
            </button>

            {/* Dropdown Menu for Member Threads */}
            {showThreadDropdown && (
              <div
                className={`absolute bottom-full left-0 mb-1 w-64 rounded-xl border shadow-xl p-1.5 z-50 text-xs font-mono ${
                  isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between px-2 py-1 text-[10px] text-slate-500 uppercase border-b border-[#E8E2D8] dark:border-[#252E4A] mb-1">
                  <span>MEMBER THREADS ({threads.length})</span>
                  <button
                    type="button"
                    onClick={handleCreateNewThread}
                    className="flex items-center gap-0.5 text-[#5584B4] hover:underline font-bold lowercase"
                  >
                    <Plus className="h-3 w-3" />
                    <span>new</span>
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {threads.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setActiveThreadId(t.id);
                        setShowThreadDropdown(false);
                        setIsExpanded(true);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs truncate transition-colors flex items-center justify-between lowercase ${
                        t.id === activeThreadId
                          ? isDark
                            ? 'bg-[#1E2548] text-[#DDEBF7] font-bold'
                            : 'bg-[#12172A] text-white font-bold'
                          : isDark
                          ? 'hover:bg-[#1A223C] text-slate-300'
                          : 'hover:bg-[#FAF8F5] text-slate-700'
                      }`}
                    >
                      <span className="truncate">{t.title}</span>
                      <span className="text-[9px] opacity-60 shrink-0 ml-1">
                        {t.messages.length} msg
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Clear Testing Data Button, Member Indicator, & Toggle */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {activeThread?.messages && activeThread.messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearThreadMessages}
              className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors lowercase flex items-center gap-1 border border-slate-300/50 dark:border-slate-700/50 cursor-pointer"
              title="Clear Thread Messages for Testing"
            >
              <Trash2 className="h-2.5 w-2.5" />
              <span>clear test</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title={isExpanded ? 'Collapse Search' : 'Expand Search'}
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content: Thread Messages & Conversation History */}
      {isExpanded && (
        <div className="flex flex-col max-h-[380px] min-h-[220px]">
          {/* Thread messages container */}
          <div className="flex-grow p-3 overflow-y-auto space-y-2.5 text-xs font-mono select-text min-h-[120px]">
            {!activeThread?.messages || activeThread.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-3 text-slate-400 my-auto">
                <div className="p-2 rounded-xl bg-[#5584B4]/10 border border-[#5584B4]/20 text-[#5584B4] mb-2">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Gemini Venture Grounding (Simulation Ready)
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs mt-1 lowercase leading-relaxed">
                  Type your financial formulas, multiples, or business queries below to test live data submission and grounded synthesis.
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                  {[
                    '18-month runway formula',
                    'Break-even contribution margin',
                    'DCF valuation multiples',
                    'Compute token pricing',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setInputQuery(preset);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition-colors lowercase cursor-pointer ${
                        isDark
                          ? 'bg-[#141A2E] hover:bg-[#1E2548] border-[#252E4A] text-slate-300'
                          : 'bg-white hover:bg-[#F4EFE6] border-[#D8CEBC] text-slate-700 shadow-2xs'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeThread.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`space-y-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                    {msg.role === 'user' ? (
                      <div className="ml-auto flex items-center gap-1 lowercase">
                        <span>{memberName}</span>
                        <span>·</span>
                        <span>{msg.timestamp}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 lowercase text-[#5584B4]">
                        <Bot className="h-3 w-3" />
                        <span className="font-bold">gemini grounded</span>
                        <span>·</span>
                        <span className="text-slate-400">{msg.timestamp}</span>
                      </div>
                    )}
                  </div>

                  <div
                    className={`inline-block max-w-[95%] p-3 rounded-xl border text-left text-xs whitespace-pre-wrap leading-relaxed ${
                      msg.role === 'user'
                        ? isDark
                          ? 'bg-[#1E2548] text-white border-[#5584B4]/40 font-medium'
                          : 'bg-[#12172A] text-white border-[#12172A]'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-200 border-[#252E4A]'
                        : 'bg-white text-slate-800 border-[#D8CEBC] shadow-xs'
                    }`}
                  >
                    {msg.text}

                    {/* Sources citation list */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[#E8E2D8] dark:border-[#252E4A]/80 flex flex-wrap items-center gap-1 text-[10px]">
                        <span className="text-slate-500 uppercase font-semibold">Sources:</span>
                        {msg.sources.map((src, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.2 rounded bg-[#DDEBF7]/60 dark:bg-[#1E3048] text-[#24496B] dark:text-[#DDEBF7]"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action buttons for model messages */}
                    {msg.role === 'model' && (
                      <div className="mt-2 pt-2 border-t border-[#E8E2D8] dark:border-[#252E4A]/60 flex items-center justify-end gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="flex items-center gap-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors lowercase cursor-pointer"
                          title="Copy response"
                        >
                          {copiedMsgId === msg.id ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedMsgId === msg.id ? 'copied' : 'copy'}</span>
                        </button>

                        {onSendToDialogue && (
                          <button
                            type="button"
                            onClick={() => onSendToDialogue(msg.text)}
                            className="flex items-center gap-1 text-[#5584B4] hover:underline font-bold transition-colors lowercase cursor-pointer"
                            title="Discuss with Coach GIM"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>discuss with coach gim</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#141A2E]/60 border border-[#252E4A] text-xs font-mono text-[#5584B4] animate-pulse">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                <span className="lowercase">synthesizing venture grounding with gemini...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ========================================================================= */}
          {/* HEIGHTENED QUESTION PANEL: Allows user to see multiple typed lines        */}
          {/* ========================================================================= */}
          <form
            onSubmit={handleExecuteSearch}
            className={`p-2.5 border-t flex flex-col gap-2 shrink-0 ${
              isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
            }`}
          >
            <div className="relative">
              <textarea
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleExecuteSearch();
                  }
                }}
                rows={3}
                placeholder="Ask Gemini search (type your formula, benchmark, or financial query here)..."
                className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-none transition-colors resize-none leading-relaxed min-h-[68px] ${
                  isDark
                    ? 'bg-[#141A2E] border-[#252E4A] text-white placeholder-slate-500 focus:border-[#5584B4]'
                    : 'bg-white border-[#D8CEBC] text-slate-900 placeholder-slate-400 focus:border-[#12172A]'
                }`}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 lowercase flex items-center gap-1 truncate">
                <span>press enter to search · shift+enter for new line</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {inputQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setInputQuery('')}
                    className="px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors lowercase cursor-pointer"
                  >
                    clear
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isLoading}
                  className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all lowercase cursor-pointer ${
                    inputQuery.trim() && !isLoading
                      ? isDark
                        ? 'bg-[#5584B4] hover:bg-[#4773A0] text-white shadow-xs active:scale-95'
                        : 'bg-[#12172A] hover:bg-[#1E2548] text-white shadow-xs active:scale-95'
                      : 'opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-700 text-slate-500'
                  }`}
                  title="Submit Inquiry for Grounded Venture Synthesis"
                >
                  <Sparkles className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'synthesizing...' : 'search'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
