import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Library,
  FileText,
  Search,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Coins,
  Send,
  Target,
  Bell,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Database,
  Cloud
} from 'lucide-react';
import {
  SandboxDocument,
  LibraryBriefing,
  SandboxLibrarySubscription,
  JournalCategory,
  OperationsFocusTask
} from '../types/sandboxLibrary';
import {
  loadSandboxLibraryDocs,
  persistSandboxLibraryDocs,
  loadSandboxCategories,
  persistSandboxCategories,
  getLocalCategories,
  getSubscription,
  saveSubscription,
  getSavedBriefings,
  runGroundedLibraryQA,
  generateLibraryBriefing,
  DEFAULT_LIBRARY_DOCUMENTS,
  loadOperationsFocusTasks,
  persistOperationsFocusTasks,
  getLocalOperationsFocus
} from '../services/sandboxLibraryService';
import { CategoryCarousel } from './sandbox-library/CategoryCarousel';
import { QuickStashModal } from './sandbox-library/QuickStashModal';
import { DocumentCard } from './sandbox-library/DocumentCard';
import { CitationModal } from './sandbox-library/CitationModal';
import OperationsFocusModal from './sandbox-library/OperationsFocusModal';
import RemindersBanner from './sandbox-library/RemindersBanner';

interface SandboxLibraryProps {
  onClose?: () => void;
  onSelectApp?: (appId: string) => void;
  userProfile?: any;
  embedded?: boolean;
  theme?: 'light' | 'dark';
  tokenBalance?: number;
}

export const SandboxLibrary: React.FC<SandboxLibraryProps> = ({
  onClose,
  onSelectApp,
  userProfile,
  embedded = false,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'journal' | 'ops' | 'qa' | 'briefings' | 'subscription'>('journal');
  const [documents, setDocuments] = useState<SandboxDocument[]>([]);
  const [categories, setCategories] = useState<JournalCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isStashOpen, setIsStashOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<SandboxDocument | null>(null);
  const [citationDoc, setCitationDoc] = useState<SandboxDocument | null>(null);

  // Operations Focus
  const [isOpsFocusOpen, setIsOpsFocusOpen] = useState(false);
  const [operationsFocusTasks, setOperationsFocusTasks] = useState<OperationsFocusTask[]>([]);

  // Q&A State
  const [qaQuery, setQaQuery] = useState('');
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const [qaCitations, setQaCitations] = useState<{ docId: string; docTitle: string; snippet: string }[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  // Briefing State
  const [briefings, setBriefings] = useState<LibraryBriefing[]>([]);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [selectedBriefingType, setSelectedBriefingType] = useState<'executive_summary' | 'action_plan' | 'financial_risks'>('executive_summary');

  // Subscription & Token Quota State (Selling to Clients: Firebase Storage + 20% BizzBean Share)
  const [subscription, setSubscription] = useState<SandboxLibrarySubscription>(getSubscription());
  const [purchaseToast, setPurchaseToast] = useState<string | null>(null);

  useEffect(() => {
    async function initData() {
      const uid = userProfile?.uid;
      const loadedDocs = await loadSandboxLibraryDocs(uid);
      setDocuments(loadedDocs.length > 0 ? loadedDocs : DEFAULT_LIBRARY_DOCUMENTS);

      const loadedCats = await loadSandboxCategories(uid);
      setCategories(loadedCats.length > 0 ? loadedCats : getLocalCategories());

      const loadedOps = await loadOperationsFocusTasks(uid);
      setOperationsFocusTasks(loadedOps.length > 0 ? loadedOps : getLocalOperationsFocus());

      setBriefings(getSavedBriefings());
      setSubscription(getSubscription());
    }
    initData();
  }, [userProfile]);

  const handleAddCategory = (name: string, color?: string) => {
    const newCat: JournalCategory = {
      id: `cat-${Date.now()}`,
      name,
      color: color || 'gold',
      sortOrder: categories.length + 1
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    persistSandboxCategories(updated, userProfile?.uid);
  };

  const handleSaveDoc = (newDoc: SandboxDocument) => {
    const exists = documents.some(d => d.id === newDoc.id);
    const updated = exists 
      ? documents.map(d => d.id === newDoc.id ? newDoc : d)
      : [newDoc, ...documents];
    setDocuments(updated);
    persistSandboxLibraryDocs(updated, userProfile?.uid);
  };

  const handleDeleteDoc = (id: string) => {
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    persistSandboxLibraryDocs(updated, userProfile?.uid);
  };

  const handleTogglePinDoc = (id: string) => {
    const updated = documents.map(d => d.id === id ? { ...d, isPinned: !d.isPinned } : d);
    setDocuments(updated);
    persistSandboxLibraryDocs(updated, userProfile?.uid);
  };

  const handleSaveOpsTasks = (tasks: OperationsFocusTask[]) => {
    setOperationsFocusTasks(tasks);
    persistOperationsFocusTasks(tasks, userProfile?.uid);
  };

  const handleRunQA = async () => {
    if (!qaQuery.trim() || isAsking) return;
    setIsAsking(true);
    const res = await runGroundedLibraryQA(qaQuery, documents);
    setQaAnswer(res.answer);
    setQaCitations(res.citations);
    setIsAsking(false);
  };

  const handleGenerateBriefing = async () => {
    if (isGeneratingBriefing) return;
    setIsGeneratingBriefing(true);
    try {
      const briefing = await generateLibraryBriefing(selectedBriefingType, documents);
      setBriefings(prev => [briefing, ...prev]);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const handlePurchaseStorageTokens = (
    tier: 'Starter Vault' | 'Growth Notebook' | 'Enterprise Knowledge Base',
    tokensAdded: number,
    mbAdded: number,
    cost: number
  ) => {
    const updated: SandboxLibrarySubscription = {
      ...subscription,
      tierName: tier,
      monthlyTokens: subscription.monthlyTokens + tokensAdded,
      remainingTokens: subscription.remainingTokens + tokensAdded,
      storageMbLimit: subscription.storageMbLimit + mbAdded,
      costInTokens: cost,
      firebaseHostingPortion: 80,
      bizzbeanSharePortion: 20
    };
    setSubscription(updated);
    saveSubscription(updated);

    const bizzbeanCommission = (cost * 0.20).toFixed(1);
    const googleHosting = (cost * 0.80).toFixed(1);

    setPurchaseToast(
      `Plan upgraded to ${tier}! +${tokensAdded.toLocaleString()} Firebase Storage Tokens added (+${mbAdded} MB). Revenue Share: ${googleHosting} tokens to Google Cloud / ${bizzbeanCommission} tokens (20.00%) to bizzbean.`
    );
    setTimeout(() => setPurchaseToast(null), 6000);
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesCat = selectedCategory === 'ALL' || doc.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() || 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.whyItMatters.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [documents, selectedCategory, searchQuery]);

  const categoryDocCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach(d => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });
    return counts;
  }, [documents]);

  const containerClasses = embedded
    ? `h-full w-full flex flex-col overflow-hidden relative select-none transition-colors ${
        isDark ? 'bg-[#0A0D14] text-slate-100 bg-architectural-grid-dark' : 'bg-[#FAF8F5] text-slate-900 bg-architectural-grid'
      }`
    : "fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden";

  const innerClasses = embedded
    ? "h-full w-full flex flex-col overflow-hidden"
    : `relative w-full max-w-7xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border ${
        isDark ? 'bg-[#101424] border-[#252E4A] text-slate-100' : 'bg-white border-[#E8E2D8] text-slate-900'
      }`;

  return (
    <div className={containerClasses}>
      <div className={innerClasses}>
        
        {/* Top Header */}
        <div className={`p-3 sm:p-4 border-b flex items-center justify-between shrink-0 transition-colors ${
          isDark ? 'bg-[#101424] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-md shrink-0 ${
              isDark
                ? 'bg-gradient-to-br from-[#C59B63] to-[#D4A373] text-[#12172A] shadow-[#C59B63]/20'
                : 'bg-[#12172A] text-[#C59B63] shadow-black/10'
            }`}>
              <Library className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-base sm:text-lg font-black tracking-wide ${
                  isDark ? 'text-white' : 'text-[#12172A]'
                }`}>
                  LIBRARY
                </h1>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isDark
                    ? 'bg-[#161C30] text-[#D4A373] border-[#252E4A]'
                    : 'bg-[#F4EFE6] text-[#C59B63] border-[#E8E2D8]'
                }`}>
                  {documents.length} Items Stashed
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border hidden sm:inline ${
                  isDark
                    ? 'bg-[#16203A] text-sky-400 border-[#2B3D66]'
                    : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}>
                  Firebase Sync Active
                </span>
              </div>
              <p className={`text-xs -mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Client Content Storage & Grounded Gemini AI Intelligence · 20.00% Token Revenue Share
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpsFocusOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono tracking-wider uppercase border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#161C30] hover:bg-[#1E2548] text-slate-200 border-[#252E4A]'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-[#E8E2D8]'
              }`}
              title="Open Operations Focus 3-Slot Board"
            >
              <Target className="w-4 h-4 text-[#C59B63]" />
              <span className="hidden sm:inline">Operations Focus</span>
            </button>

            <button
              onClick={() => {
                setEditingDoc(null);
                setIsStashOpen(true);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black font-mono tracking-wider uppercase transition-colors cursor-pointer shadow-sm ${
                isDark
                  ? 'bg-[#C59B63] text-[#12172A] hover:bg-[#D4A373] shadow-[#C59B63]/25'
                  : 'bg-[#12172A] text-white hover:bg-[#1E2548] shadow-black/10'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Stash Document</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ml-1 ${
                  isDark
                    ? 'text-slate-400 hover:text-white hover:bg-[#161C30]'
                    : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Back to Workstation"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`px-4 sm:px-6 border-b flex items-center justify-between shrink-0 overflow-x-auto transition-colors ${
          isDark ? 'bg-[#161C30]/90 border-[#252E4A]' : 'bg-[#F4EFE6]/80 border-[#E8E2D8]'
        }`}>
          <div className="flex items-center gap-2 sm:gap-6">
            {[
              { id: 'journal', label: 'Vault Documents' },
              { id: 'ops', label: 'Operations Focus' },
              { id: 'qa', label: 'Grounded AI Q&A' },
              { id: 'briefings', label: 'Executive Briefings' },
              { id: 'subscription', label: 'Storage & Tokens (20% Share)' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? isDark
                      ? 'border-[#C59B63] text-[#D4A373]'
                      : 'border-[#12172A] text-[#12172A]'
                    : isDark
                    ? 'border-transparent text-slate-400 hover:text-slate-200'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={`hidden lg:flex items-center gap-3 text-xs font-mono ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            <span className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-[#C59B63]" />
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                {subscription.remainingTokens.toLocaleString()}
              </strong> tokens
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                {subscription.storageMbUsed}
              </strong> / {subscription.storageMbLimit} MB
            </span>
          </div>
        </div>

        {/* Purchase Notification Banner */}
        {purchaseToast && (
          <div className={`mx-4 mt-3 p-3 rounded-xl border text-xs flex items-center justify-between shrink-0 animate-in fade-in ${
            isDark
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{purchaseToast}</span>
            </div>
            <button
              onClick={() => setPurchaseToast(null)}
              className="text-emerald-500 hover:opacity-80 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Reminders Alert Banner */}
        <RemindersBanner
          documents={documents}
          onOpenDocument={doc => setCitationDoc(doc)}
          onOpenQuickStash={() => setIsStashOpen(true)}
          theme={theme}
        />

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* TAB 1: VAULT DOCUMENTS */}
          {activeTab === 'journal' && (
            <div className="space-y-4">
              {/* Category Carousel */}
              <CategoryCarousel
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={cat => setSelectedCategory(cat)}
                onAddCategory={handleAddCategory}
                totalDocCount={documents.length}
                categoryDocCounts={categoryDocCounts}
                theme={theme}
              />

              {/* Search Bar */}
              <div className="relative">
                <Search className={`w-4 h-4 absolute left-3.5 top-3 ${
                  isDark ? 'text-slate-400' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search stashed documents by keyword, SARS regulation, tax rule, tag, or rationale..."
                  className={`w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-1 focus:ring-[#C59B63] ${
                    isDark
                      ? 'bg-[#101424] text-slate-100 border-[#252E4A] placeholder-slate-500'
                      : 'bg-white text-slate-900 border-[#E8E2D8] placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Grid of Documents */}
              {filteredDocs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {filteredDocs.map(doc => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onOpenCitation={d => setCitationDoc(d)}
                      onEdit={d => {
                        setEditingDoc(d);
                        setIsStashOpen(true);
                      }}
                      onDelete={handleDeleteDoc}
                      onTogglePin={handleTogglePinDoc}
                      theme={theme}
                    />
                  ))}
                </div>
              ) : (
                <div className={`text-center py-16 px-4 rounded-2xl border border-dashed ${
                  isDark
                    ? 'bg-[#101424]/40 border-[#252E4A]'
                    : 'bg-white border-[#E8E2D8]'
                }`}>
                  <Library className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <h3 className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    No documents found matching criteria
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Try switching categories or clear the search filter.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                    }}
                    className={`mt-3 px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-colors cursor-pointer border ${
                      isDark
                        ? 'bg-[#161C30] hover:bg-[#1E2548] text-slate-200 border-[#252E4A]'
                        : 'bg-[#F4EFE6] hover:bg-[#EAE3D4] text-slate-800 border-[#E8E2D8]'
                    }`}
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OPERATIONS FOCUS */}
          {activeTab === 'ops' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className={`p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${
                isDark ? 'bg-[#101424] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
              }`}>
                <div>
                  <h3 className={`text-base font-bold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    <Target className="w-5 h-5 text-[#C59B63]" />
                    Entrepreneur's 3-Slot Operations Focus
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Anchor your top three non-negotiable operational objectives for this business cycle. Grounded in your stashed SARS policies and financials.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpsFocusOpen(true)}
                  className={`px-4 py-2 font-bold font-mono uppercase tracking-wider rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs ${
                    isDark
                      ? 'bg-[#C59B63] text-[#12172A] hover:bg-[#D4A373]'
                      : 'bg-[#12172A] text-white hover:bg-[#1E2548]'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Configure Slots</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {operationsFocusTasks.map(task => (
                  <div
                    key={task.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      task.status === 'completed'
                        ? isDark
                          ? 'bg-[#101424]/40 border-emerald-500/30'
                          : 'bg-emerald-50/50 border-emerald-200'
                        : isDark
                        ? 'bg-[#101424] border-[#252E4A] hover:border-[#5584B4]'
                        : 'bg-white border-[#E8E2D8] hover:border-[#C59B63]'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          isDark
                            ? 'bg-[#161C30] text-[#D4A373] border-[#252E4A]'
                            : 'bg-[#FAF8F5] text-[#C59B63] border-[#E8E2D8]'
                        }`}>
                          Slot {task.slot}
                        </span>
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          task.priority === 'critical'
                            ? isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-800'
                            : isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      <h4 className={`text-sm font-bold ${
                        task.status === 'completed'
                          ? 'line-through text-slate-500'
                          : isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className={`pt-4 mt-4 border-t flex items-center justify-between text-[11px] ${
                      isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
                    }`}>
                      <span className={`font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        Target: {task.targetCompletionDate || 'Not set'}
                      </span>
                      <button
                        onClick={() => {
                          const updated = operationsFocusTasks.map(t =>
                            t.id === task.id
                              ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' }
                              : t
                          );
                          handleSaveOpsTasks(updated as OperationsFocusTask[]);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                          task.status === 'completed'
                            ? isDark
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : isDark
                            ? 'bg-[#161C30] text-slate-300 hover:bg-[#1E2548]'
                            : 'bg-[#F4EFE6] text-slate-700 hover:bg-[#EAE3D4]'
                        }`}
                      >
                        {task.status === 'completed' ? 'Completed' : 'Mark Done'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: GROUNDED AI Q&A */}
          {activeTab === 'qa' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#101424] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
              }`}>
                <h3 className={`text-base font-bold mb-2 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <Sparkles className="w-5 h-5 text-[#C59B63]" />
                  Grounded Vault Q&A
                </h3>
                <p className={`text-xs mb-4 leading-relaxed ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Ask Gemini questions answered strictly using your stashed documents, SARS thresholds, and financial models. Every answer is grounded with citation provenance.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qaQuery}
                    onChange={e => setQaQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRunQA()}
                    placeholder="e.g. What is our daily cup break-even volume and coffee COGS?"
                    className={`flex-1 text-xs px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#C59B63] transition-colors ${
                      isDark
                        ? 'bg-[#161C30] text-slate-100 border-[#252E4A] placeholder-slate-500'
                        : 'bg-[#FAF8F5] text-slate-900 border-[#E8E2D8] placeholder-slate-400'
                    }`}
                  />
                  <button
                    onClick={handleRunQA}
                    disabled={isAsking}
                    className={`px-5 py-3 font-mono font-bold uppercase tracking-wider rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-xs ${
                      isDark
                        ? 'bg-[#C59B63] text-[#12172A] hover:bg-[#D4A373]'
                        : 'bg-[#12172A] text-white hover:bg-[#1E2548]'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>{isAsking ? 'Grounding...' : 'Ask Vault'}</span>
                  </button>
                </div>
              </div>

              {qaAnswer && (
                <div className={`p-6 rounded-3xl space-y-4 border animate-in fade-in ${
                  isDark ? 'bg-[#101424] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
                }`}>
                  <h4 className="text-xs font-mono font-bold uppercase text-[#C59B63] tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    AI Grounded Synthesis
                  </h4>
                  <div className={`text-xs whitespace-pre-line leading-relaxed ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>{qaAnswer}</div>
                  {qaCitations.length > 0 && (
                    <div className={`pt-4 border-t ${isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'}`}>
                      <span className={`text-[10px] font-mono font-bold uppercase block mb-2 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Sources Referenced:
                      </span>
                      <div className="space-y-1.5">
                        {qaCitations.map((c, i) => (
                          <div
                            key={i}
                            className={`text-xs p-2.5 rounded-lg border flex items-start gap-2 ${
                              isDark
                                ? 'bg-[#161C30] border-[#252E4A] text-slate-300'
                                : 'bg-[#FAF8F5] border-[#E8E2D8] text-slate-800'
                            }`}
                          >
                            <span className="text-[#C59B63] font-mono font-bold">[{i + 1}]</span>
                            <div>
                              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.docTitle}:</span> {c.snippet}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXECUTIVE BRIEFINGS */}
          {activeTab === 'briefings' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-[#101424] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className={`text-base font-bold flex items-center gap-2 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      <FileText className="w-5 h-5 text-[#C59B63]" />
                      Executive Synthesis & Briefings
                    </h3>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Synthesize entire library folders into actionable briefings, risk registers, and plans.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedBriefingType}
                      onChange={e => setSelectedBriefingType(e.target.value as any)}
                      className={`text-xs px-3 py-2 rounded-xl border ${
                        isDark
                          ? 'bg-[#161C30] text-slate-200 border-[#252E4A]'
                          : 'bg-[#FAF8F5] text-slate-800 border-[#E8E2D8]'
                      }`}
                    >
                      <option value="executive_summary">Executive Summary</option>
                      <option value="action_plan">30-Day Action Plan</option>
                      <option value="financial_risks">Financial Risk Audit</option>
                    </select>
                    <button
                      onClick={handleGenerateBriefing}
                      disabled={isGeneratingBriefing}
                      className={`px-4 py-2 font-mono font-bold uppercase tracking-wider rounded-xl text-xs cursor-pointer transition-colors shadow-xs ${
                        isDark
                          ? 'bg-[#C59B63] text-[#12172A] hover:bg-[#D4A373]'
                          : 'bg-[#12172A] text-white hover:bg-[#1E2548]'
                      }`}
                    >
                      {isGeneratingBriefing ? 'Synthesizing...' : 'Generate'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {briefings.map(b => (
                  <div
                    key={b.id}
                    className={`p-6 rounded-3xl space-y-3 border ${
                      isDark ? 'bg-[#101424] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{b.title}</h4>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {new Date(b.generatedAt).toLocaleDateString()} • {b.tokensUsed} tokens
                      </span>
                    </div>
                    <div className={`text-xs whitespace-pre-wrap leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {b.content}
                    </div>
                  </div>
                ))}
                {briefings.length === 0 && (
                  <div className={`text-center py-12 text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    No briefings generated yet. Select a type and click Generate above.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: STORAGE & TOKENS (CLIENT PURCHASE & 20% REVENUE SHARE) */}
          {activeTab === 'subscription' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Partner Model & Revenue Share Highlight */}
              <div className={`p-6 rounded-3xl space-y-3 border ${
                isDark
                  ? 'bg-gradient-to-r from-[#101424] to-[#161C30] border-[#252E4A]'
                  : 'bg-gradient-to-r from-white to-[#F4EFE6] border-[#E8E2D8]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-[#C59B63]/20 text-[#C59B63] border border-[#C59B63]/30">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Firebase Storage & Client Token System
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Clients purchase Tokens to store documents and video notes in Firebase Firestore & Cloud Storage
                      </p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                    isDark
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    20.00% BizzBean Share
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className={`p-3.5 rounded-2xl border ${
                    isDark ? 'bg-[#0A0D14]/80 border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
                  }`}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Google Cloud / Firebase Port:
                      </span>
                      <span className={`font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>80.00%</span>
                    </div>
                    <p className={`text-[11px] leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Covers Firestore document hosting, secure vector index generation, and raw multi-tenant Cloud Storage.
                    </p>
                  </div>

                  <div className={`p-3.5 rounded-2xl border ${
                    isDark
                      ? 'bg-[#0A0D14]/80 border-emerald-900/40'
                      : 'bg-emerald-50/50 border-emerald-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-emerald-500 font-mono font-bold">bizzbean Platform Share:</span>
                      <span className="text-emerald-500 font-bold font-mono">20.00%</span>
                    </div>
                    <p className={`text-[11px] leading-snug ${isDark ? 'text-slate-400' : 'text-emerald-900'}`}>
                      Shared revenue margin generated from client storage token purchases through Google Cloud infrastructure.
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Quota Consumption Status */}
              <div className={`p-6 rounded-3xl space-y-4 border ${
                isDark ? 'bg-[#101424] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-[10px] uppercase font-mono tracking-wider ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Current Plan
                    </span>
                    <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {subscription.tierName}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                      isDark
                        ? 'bg-[#C59B63]/15 text-[#D4A373] border-[#C59B63]/30'
                        : 'bg-[#FAF8F5] text-[#C59B63] border-[#C59B63]/40'
                    }`}>
                      {subscription.remainingTokens.toLocaleString()} Tokens Left
                    </span>
                    <span className={`block text-[10px] mt-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Active until {subscription.activeUntil}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={`flex justify-between text-xs font-mono ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    <span>Firebase Storage Used</span>
                    <span>{subscription.storageMbUsed} MB / {subscription.storageMbLimit} MB ({((subscription.storageMbUsed / subscription.storageMbLimit) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${
                    isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
                  }`}>
                    <div
                      className="h-full bg-gradient-to-r from-[#C59B63] to-[#D4A373] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (subscription.storageMbUsed / subscription.storageMbLimit) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Token Packages for Purchase */}
              <div>
                <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <Coins className="w-4 h-4 text-[#C59B63]" />
                  Purchase Storage Tokens & Upgrade Firebase Tier
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Tier 1 */}
                  <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-colors ${
                    isDark
                      ? 'bg-[#101424] border-[#252E4A] hover:border-slate-600'
                      : 'bg-white border-[#E8E2D8] hover:border-slate-300'
                  }`}>
                    <div className="space-y-3">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        isDark ? 'bg-[#161C30] text-slate-300 border-[#252E4A]' : 'bg-[#F4EFE6] text-slate-700 border-[#E8E2D8]'
                      }`}>
                        Starter Vault
                      </span>
                      <h5 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        5,000 Tokens
                      </h5>
                      <div className={`text-xs space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        <p>• <strong>50 MB</strong> Firebase Document Storage</p>
                        <p>• Up to 40 stashed documents</p>
                        <p>• Basic Grounded Q&A indexing</p>
                      </div>
                    </div>

                    <div className={`pt-4 mt-4 border-t ${isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'}`}>
                      <div className="flex items-center justify-between text-xs mb-3 font-mono">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Price:</span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>25 Tokens</span>
                      </div>
                      <button
                        onClick={() => handlePurchaseStorageTokens('Starter Vault', 5000, 50, 25)}
                        className={`w-full py-2 text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition-colors cursor-pointer border ${
                          isDark
                            ? 'bg-[#161C30] hover:bg-[#1E2548] text-slate-200 border-[#252E4A]'
                            : 'bg-[#F4EFE6] hover:bg-[#EAE3D4] text-slate-800 border-[#E8E2D8]'
                        }`}
                      >
                        Activate Starter
                      </button>
                    </div>
                  </div>

                  {/* Tier 2: Recommended */}
                  <div className={`p-5 rounded-2xl border-2 relative flex flex-col justify-between shadow-xl ${
                    isDark
                      ? 'bg-[#101424] border-[#C59B63] shadow-[#C59B63]/10'
                      : 'bg-white border-[#C59B63] shadow-[#C59B63]/10'
                  }`}>
                    <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#C59B63] text-[#12172A] font-black text-[10px] font-mono uppercase tracking-wider shadow-sm">
                      Popular Tier
                    </div>

                    <div className="space-y-3">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#C59B63]/15 text-[#C59B63] border border-[#C59B63]/30">
                        Growth Notebook
                      </span>
                      <h5 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        25,000 Tokens
                      </h5>
                      <div className={`text-xs space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        <p>• <strong>250 MB</strong> Firebase Storage</p>
                        <p>• Full YouTube Embed indexing</p>
                        <p>• Executive Briefings synthesis</p>
                      </div>
                    </div>

                    <div className={`pt-4 mt-4 border-t ${isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'}`}>
                      <div className="flex items-center justify-between text-xs mb-3 font-mono">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Price:</span>
                        <span className="font-bold text-[#C59B63]">120 Tokens</span>
                      </div>
                      <button
                        onClick={() => handlePurchaseStorageTokens('Growth Notebook', 25000, 250, 120)}
                        className={`w-full py-2 text-xs font-mono font-black tracking-wider uppercase rounded-xl transition-colors cursor-pointer shadow-xs ${
                          isDark
                            ? 'bg-[#C59B63] hover:bg-[#D4A373] text-[#12172A]'
                            : 'bg-[#12172A] hover:bg-[#1E2548] text-white'
                        }`}
                      >
                        Purchase Growth Tier
                      </button>
                    </div>
                  </div>

                  {/* Tier 3 */}
                  <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-colors ${
                    isDark
                      ? 'bg-[#101424] border-[#252E4A] hover:border-slate-600'
                      : 'bg-white border-[#E8E2D8] hover:border-slate-300'
                  }`}>
                    <div className="space-y-3">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        isDark ? 'bg-[#161C30] text-slate-300 border-[#252E4A]' : 'bg-[#F4EFE6] text-slate-700 border-[#E8E2D8]'
                      }`}>
                        Enterprise Knowledge Base
                      </span>
                      <h5 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        100,000 Tokens
                      </h5>
                      <div className={`text-xs space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        <p>• <strong>1,000 MB (1 GB)</strong> Firebase Vault</p>
                        <p>• Unlimited Executive Audits</p>
                        <p>• Priority Vector Embeddings</p>
                      </div>
                    </div>

                    <div className={`pt-4 mt-4 border-t ${isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'}`}>
                      <div className="flex items-center justify-between text-xs mb-3 font-mono">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Price:</span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>450 Tokens</span>
                      </div>
                      <button
                        onClick={() => handlePurchaseStorageTokens('Enterprise Knowledge Base', 100000, 1000, 450)}
                        className={`w-full py-2 text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition-colors cursor-pointer border ${
                          isDark
                            ? 'bg-[#161C30] hover:bg-[#1E2548] text-slate-200 border-[#252E4A]'
                            : 'bg-[#F4EFE6] hover:bg-[#EAE3D4] text-slate-800 border-[#E8E2D8]'
                        }`}
                      >
                        Purchase Enterprise
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modals */}
        <QuickStashModal
          isOpen={isStashOpen}
          onClose={() => setIsStashOpen(false)}
          categories={categories}
          onSaveDoc={handleSaveDoc}
          editingDoc={editingDoc}
          theme={theme}
        />

        <CitationModal
          doc={citationDoc}
          onClose={() => setCitationDoc(null)}
          theme={theme}
        />

        <OperationsFocusModal
          isOpen={isOpsFocusOpen}
          onClose={() => setIsOpsFocusOpen(false)}
          tasks={operationsFocusTasks}
          onSaveTasks={handleSaveOpsTasks}
          theme={theme}
        />
      </div>
    </div>
  );
};

export default SandboxLibrary;
