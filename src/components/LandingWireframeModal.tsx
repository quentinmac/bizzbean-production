import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Coins,
  Database,
  GraduationCap,
  Layers,
  Library,
  LogOut,
  Mail,
  Maximize2,
  Menu,
  Minimize2,
  Moon,
  Pin,
  Play,
  Sliders,
  Smartphone,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { CmsPromotionSection } from '../data/cmsConsoleData';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';

export type WireframeMode = 'current' | 'proposal' | 'enhanced';
export type FooterSection = 'solutions' | 'workarea' | 'library' | 'ask-gemini' | 'bizzclass' | 'apps';

interface LandingWireframeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  activePromotion?: CmsPromotionSection | null;
  cmsPromotions?: CmsPromotionSection[];
  userName?: string;
  tokenBalance?: number;
}

const SAMPLE_STAGES = [
  {
    id: 'vi-ability',
    num: 1,
    name: 'vi-ability',
    displayName: 'vi-ability · stage 01',
    tagline: 'Validate unit economics, pricing elasticity, and break-even dynamics before deploying capital.',
    buttonText: 'explore vi-ability',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'fund-ability',
    num: 2,
    name: 'fund-ability',
    displayName: 'fund-ability · stage 02',
    tagline: 'Align working capital cycles, funding runway, and investor-grade 3-statement forecasts.',
    buttonText: 'explore fund-ability',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sustain-ability',
    num: 3,
    name: 'sustain-ability',
    displayName: 'sustain-ability · stage 03',
    tagline: 'Control overhead leverage, cash conversion days, and live rolling forecasts.',
    buttonText: 'explore sustain-ability',
    imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
  },
];

const QUICK_APPS = [
  { id: 'bizzcalc', name: 'bizzcalc', desc: '12-month scenario & unit economics calculator' },
  { id: 'bizzdynamics', name: 'bizzdynamics', desc: '5-year interactive rate adjustment engine' },
  { id: 'bizzmodel', name: 'bizzmodel', desc: '3-statement financial model + bizzplan + pitch deck' },
  { id: 'rolling-forecast', name: 'rolling forecast', desc: 'ongoing prior-year balance sheet variance engine' },
];

export const LandingWireframeModal: React.FC<LandingWireframeModalProps> = ({
  isOpen,
  onClose,
  theme: initialTheme = 'light',
  activePromotion,
  cmsPromotions,
  userName = 'Quentin McCullough',
  tokenBalance = 250,
}) => {
  const [mode, setMode] = useState<WireframeMode>('enhanced');
  const [wireframeTheme, setWireframeTheme] = useState<'light' | 'dark'>(initialTheme);
  // Track reversed-expand state in proposal/enhanced vs standard in current
  const [showSidebars, setShowSidebars] = useState<boolean>(false);
  const [activeFooter, setActiveFooter] = useState<FooterSection>('workarea');
  const [promoIndex, setPromoIndex] = useState<number>(0);
  const [heroMaxVh, setHeroMaxVh] = useState<'30vh' | '38vh' | '58vh'>('38vh');
  const [showEnhancementNotes, setShowEnhancementNotes] = useState<boolean>(false);

  if (!isOpen) return null;

  const isDark = wireframeTheme === 'dark';

  const promotionsPool =
    cmsPromotions && cmsPromotions.length > 0
      ? cmsPromotions
      : activePromotion
      ? [activePromotion]
      : SAMPLE_STAGES;

  const currentPromo = promotionsPool[promoIndex % promotionsPool.length] || SAMPLE_STAGES[0];
  const heroImage =
    currentPromo.imageUrl &&
    currentPromo.imageUrl.trim() !== '' &&
    !currentPromo.imageUrl.includes('1553877522-43269d4ea984')
      ? currentPromo.imageUrl
      : SAMPLE_STAGES[0].imageUrl;

  const handleSelectMode = (nextMode: WireframeMode) => {
    setMode(nextMode);
    setActiveFooter('workarea');
    if (nextMode === 'current') {
      setShowSidebars(true);
      setHeroMaxVh('58vh');
    } else if (nextMode === 'proposal') {
      setShowSidebars(false);
      setHeroMaxVh('38vh');
    } else {
      setShowSidebars(false);
      setHeroMaxVh('30vh');
    }
  };

  // In Current mode, sidebars start open; in Proposal/Enhanced, sidebars start hidden ("reversed expand")
  const sidebarsVisible = showSidebars;
  const heroHeightClass =
    heroMaxVh === '58vh' ? 'h-[310px]' : heroMaxVh === '38vh' ? 'h-[205px]' : 'h-[168px]';

  const handleFooterClick = (section: FooterSection) => {
    setActiveFooter(section);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-150 font-mono"
      role="dialog"
      aria-modal="true"
      aria-label="Landing Page Wireframe Evaluation Lab"
    >
      {/* ===================================================================== */}
      {/* 1. EVALUATION CONTROL STRIP (SWITCH MODES, IMAGE SIZE, NOTES)         */}
      {/* ===================================================================== */}
      <div className="px-4 py-2.5 bg-[#0D111C] border-b border-[#252E4A] text-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#5584B4]" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Landing Page Wireframe Lab
            </span>
          </div>
          <span className="hidden md:inline text-[11px] text-slate-400">
            Interactive sandbox — production website untouched
          </span>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-[#151B2E] p-1 rounded-xl border border-[#252E4A]">
          <button
            type="button"
            onClick={() => handleSelectMode('current')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
              mode === 'current'
                ? 'bg-slate-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            A. Current (3-Panel)
          </button>
          <button
            type="button"
            onClick={() => handleSelectMode('proposal')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
              mode === 'proposal'
                ? 'bg-[#2E5E88] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            B. Your Proposal
          </button>
          <button
            type="button"
            onClick={() => handleSelectMode('enhanced')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
              mode === 'enhanced'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            C. Enhanced Proposal
          </button>
        </div>

        {/* Hero Height & Notes Toggles */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-[#151B2E] px-2 py-1 rounded-xl border border-[#252E4A] text-[10px]">
            <span className="text-slate-400 mr-1">hero size:</span>
            {(['30vh', '38vh', '58vh'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setHeroMaxVh(sz)}
                className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${
                  heroMaxVh === sz ? 'bg-[#5584B4] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {sz === '30vh' ? 'crisp' : sz === '38vh' ? 'compact' : 'current'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowEnhancementNotes((v) => !v)}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-colors cursor-pointer ${
              showEnhancementNotes
                ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                : 'bg-[#151B2E] border-[#252E4A] text-slate-300 hover:text-white'
            }`}
          >
            {showEnhancementNotes ? 'Hide UX Notes' : 'GIM UX Notes'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Exit Lab</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. SIMULATED LIVE BIZZ-DESK WORKSPACE FRAME                           */}
      {/* ===================================================================== */}
      <div className="flex-1 overflow-hidden p-3 sm:p-5 flex gap-4">
        <div
          className={`flex-1 rounded-2xl border shadow-2xl overflow-hidden flex flex-col relative transition-colors ${
            isDark
              ? 'bg-[#0A0D14] border-[#252E4A] text-slate-200'
              : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-800'
          }`}
        >
          {/* SIMULATED BIZZ-DESK HEADER */}
          <div
            className={`px-4 py-2.5 border-b flex items-center justify-between gap-2 shrink-0 ${
              isDark ? 'bg-[#101424] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full border border-[#D8CEBC] dark:border-[#252E4A] flex items-center justify-center bg-[#FAF8F5] dark:bg-[#161C30] shrink-0">
                <BizzbeanLogoIcon className="w-5 h-5" />
              </div>
              <div className="leading-tight min-w-0">
                <div className="text-[10px] text-[#C59B63] uppercase tracking-wider flex items-center gap-1.5">
                  <span>WELCOME,</span>
                  <span className="font-bold text-[#5584B4]">BIZZ-DESK WORKSPACE</span>
                </div>
                <div className="text-xs font-bold truncate text-slate-900 dark:text-white">
                  {userName}
                </div>
              </div>

              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 ml-2 rounded-lg border border-[#E8E2D8] dark:border-[#252E4A] bg-[#FAF8F5] dark:bg-[#161C30] text-[11px]">
                <Pin className="h-3 w-3 text-[#5584B4]" />
                <span>PINBOARD</span>
                <span className="font-bold text-[#5584B4]">3</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E8E2D8] dark:border-[#252E4A] text-[11px]">
                <Coins className="h-3 w-3 text-[#5584B4]" />
                <span className="font-bold">{tokenBalance}</span>
                <span className="text-slate-400">tokens</span>
              </div>

              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E02475] text-white text-[10px] font-bold uppercase">
                BUY TOKENS
              </span>

              <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E8E2D8] dark:border-[#252E4A] text-[10px] font-bold uppercase">
                <Mail className="h-3 w-3 text-[#5584B4]" />
                TALK TO US
              </span>

              <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E8E2D8] dark:border-[#252E4A] text-[10px] font-bold uppercase">
                <Database className="h-3 w-3 text-[#5584B4]" />
                CMS
              </span>

              <button
                type="button"
                onClick={() => setWireframeTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                className="p-1.5 rounded-lg border border-[#E8E2D8] dark:border-[#252E4A] cursor-pointer"
                title="Toggle light/dark inside wireframe"
              >
                {isDark ? <Sun className="h-3.5 w-3.5 text-[#D4A373]" /> : <Moon className="h-3.5 w-3.5" />}
              </button>

              {/* REVERSED EXPAND / SIDEBARS BUTTON */}
              <button
                type="button"
                onClick={() => setShowSidebars((s) => !s)}
                title={
                  mode === 'current'
                    ? sidebarsVisible
                      ? 'Expand Focus Area (Hide Sidebars)'
                      : 'Restore 3-Panel Desk'
                    : sidebarsVisible
                    ? 'Return to Calm Focus View'
                    : 'Open Full 3-Panel Desk (Solutions + Knowledge)'
                }
                className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  sidebarsVisible && mode !== 'current'
                    ? 'bg-[#2E5E88] text-white border-[#2E5E88]'
                    : !sidebarsVisible && mode === 'current'
                    ? 'bg-[#5584B4]/20 border-[#5584B4] text-[#5584B4]'
                    : 'border-[#5584B4]/50 bg-[#5584B4]/10 text-[#2E5E88] dark:text-[#7EB2E2]'
                }`}
              >
                {sidebarsVisible ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                <span className="hidden xl:inline lowercase">
                  {mode === 'current'
                    ? sidebarsVisible
                      ? 'expand'
                      : '3-panel'
                    : sidebarsVisible
                    ? 'calm view'
                    : '3-panel desk'}
                </span>
              </button>

              <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#12172A] text-white text-[10px] lowercase">
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">close doors</span>
              </span>
            </div>
          </div>

          {/* SIMULATED WORKSPACE BODY */}
          <div className="flex-1 flex overflow-hidden relative p-3 gap-3">
            {/* LEFT SIDEBAR: SOLUTIONS (Shown when sidebarsVisible is true) */}
            {sidebarsVisible && (
              <aside
                className={`w-64 shrink-0 rounded-2xl border p-3.5 flex flex-col justify-between overflow-y-auto ${
                  isDark ? 'bg-[#101424] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#5584B4] flex items-center justify-between">
                    <span>SOLUTIONS STAGES</span>
                    <span className="text-slate-400">5 stages</span>
                  </div>
                  {[
                    '01. vi-ability',
                    '02. fund-ability',
                    '03. sustain-ability',
                    '04. invest-ability',
                    '05. personal-sandbox',
                  ].map((stage, idx) => (
                    <div
                      key={stage}
                      className={`px-3 py-2 rounded-xl border text-xs ${
                        idx === 0
                          ? 'bg-[#2E5E88]/10 border-[#2E5E88]/40 text-[#2E5E88] dark:text-[#7EB2E2] font-bold'
                          : isDark
                          ? 'border-[#1E2740] text-slate-400'
                          : 'border-[#EFE9DF] text-slate-600'
                      }`}
                    >
                      {stage}
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[#E8E2D8] dark:border-[#252E4A] space-y-1 text-[11px] text-slate-500">
                    <div className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                      • about bizzbean
                    </div>
                    <div className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                      • videos
                    </div>
                    <div className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                      • articles
                    </div>
                    <div className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                      • google workspace
                    </div>
                    <div className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                      • website footer
                    </div>
                    <div className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                      • getting to value (book)
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-[#E8E2D8] dark:border-[#252E4A]">
                  Left navigation dock
                </div>
              </aside>
            )}

            {/* CENTER FOCUS WORK AREA */}
            <section
              className={`flex-1 rounded-2xl border overflow-y-auto p-4 sm:p-5 flex flex-col justify-between relative ${
                isDark
                  ? 'bg-[#101424] border-[#252E4A]'
                  : 'bg-[#FAF8F5] border-[#E8E2D8]'
              }`}
              style={{
                backgroundImage: isDark
                  ? 'radial-gradient(rgba(85,132,180,0.08) 1px, transparent 1px)'
                  : 'linear-gradient(to right, rgba(216,206,188,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(216,206,188,0.22) 1px, transparent 1px)',
                backgroundSize: isDark ? '20px 20px' : '24px 24px',
              }}
            >
              {/* CENTER VIEW WHEN IN PROPOSAL/ENHANCED & USER CLICKED NON-WORKAREA FOOTER TAB */}
              {mode !== 'current' && activeFooter !== 'workarea' && (
                <div className="mb-4 p-4 rounded-2xl border-2 border-[#5584B4]/40 bg-white dark:bg-[#141A2E] shadow-lg animate-in fade-in duration-150">
                  <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[#E8E2D8] dark:border-[#252E4A]">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#2E5E88] dark:text-[#7EB2E2]">
                      {activeFooter === 'solutions' && <Menu className="h-4 w-4" />}
                      {activeFooter === 'library' && <Library className="h-4 w-4" />}
                      {activeFooter === 'ask-gemini' && <Sparkles className="h-4 w-4" />}
                      {activeFooter === 'bizzclass' && <GraduationCap className="h-4 w-4" />}
                      {activeFooter === 'apps' && <Smartphone className="h-4 w-4 text-[#84CC16]" />}
                      <span>
                        {activeFooter === 'solutions' && 'Solutions Explorer Tray (Contextual Drawer)'}
                        {activeFooter === 'library' && 'Virtual Library & Stored Assets'}
                        {activeFooter === 'ask-gemini' && 'Ask Gemini Grounded Search'}
                        {activeFooter === 'bizzclass' && 'BizzClass Video & Masterclass Studio'}
                        {activeFooter === 'apps' && 'Interactive Platform Apps Suite'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveFooter('workarea')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1E2548] text-[11px] font-bold hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      back to hero / workspace
                    </button>
                  </div>

                  {activeFooter === 'solutions' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      {['01. vi-ability (learn & earn)', '02. fund-ability (investor readiness)', '03. sustain-ability (cash & margin)', '04. invest-ability (valuation & exit)', '05. personal-sandbox', '06. videos & articles'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setActiveFooter('workarea')}
                          className="p-3 rounded-xl border border-[#E8E2D8] dark:border-[#252E4A] bg-[#FAF8F5] dark:bg-[#0E1220] text-left hover:border-[#5584B4] transition-colors cursor-pointer"
                        >
                          <div className="font-bold text-slate-900 dark:text-white">{item}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Open inside calm focus workspace →</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {activeFooter === 'library' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      {[
                        'Daily Objectives Ledger',
                        'Stored Financial Models (.gsheet / .xlsx)',
                        'VDR Checklist & Companion Workbooks',
                      ].map((title) => (
                        <div
                          key={title}
                          className="p-3 rounded-xl border border-[#E8E2D8] dark:border-[#252E4A] bg-[#FAF8F5] dark:bg-[#0E1220]"
                        >
                          <div className="font-bold text-slate-900 dark:text-white">{title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Virtual Library Vault ready</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeFooter === 'ask-gemini' && (
                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-[#0E1526] text-slate-100 flex items-center justify-between">
                        <div>
                          <div className="font-bold">ASK GEMINI</div>
                          <div className="text-[11px] text-slate-400">Live grounded venture & financial research assistant</div>
                        </div>
                        <span className="text-[11px] text-emerald-400 font-bold">READY</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value="Ask Gemini about unit economics, tax compliance, or market benchmarks..."
                          className="flex-1 px-3 py-2 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] bg-[#FAF8F5] dark:bg-[#0E1220] text-slate-500 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setActiveFooter('workarea')}
                          className="px-4 py-2 rounded-xl bg-[#2E5E88] text-white font-bold text-xs cursor-pointer"
                        >
                          ask
                        </button>
                      </div>
                    </div>
                  )}

                  {activeFooter === 'bizzclass' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      {[
                        'Module 1: Follow the Money',
                        'Module 2: Pricing & Gross Margin Physics',
                        'Module 3: How to Earn Access to Capital',
                      ].map((title) => (
                        <div
                          key={title}
                          className="p-3 rounded-xl border border-[#E8E2D8] dark:border-[#252E4A] bg-[#FAF8F5] dark:bg-[#0E1220] flex items-center gap-2.5"
                        >
                          <div className="p-2 rounded-lg bg-[#2E5E88]/15 text-[#2E5E88]">
                            <Play className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{title}</div>
                            <div className="text-[10px] text-slate-500">Video masterclass ready</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeFooter === 'apps' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                      {QUICK_APPS.map((app) => (
                        <div
                          key={app.id}
                          className="p-3 rounded-xl border border-[#E8E2D8] dark:border-[#252E4A] bg-[#FAF8F5] dark:bg-[#0E1220]"
                        >
                          <div className="font-bold text-[#2E5E88] dark:text-[#7EB2E2] lowercase">
                            {app.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">{app.desc}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* HERO CONTENT LAYOUT */}
              {mode === 'enhanced' ? (
                /* ENHANCED HORIZONTAL SPLIT HERO (Zero-scroll above-the-fold calm workspace framing) */
                <div className="max-w-5xl w-full mx-auto space-y-4">
                  <div className="rounded-3xl border border-[#D8CEBC] dark:border-[#252E4A] bg-white dark:bg-[#141A2E] shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                    {/* Compact Reduced Image Frame */}
                    <div className="lg:col-span-5 relative bg-black/5 dark:bg-[#0A0D14]">
                      <img
                        src={heroImage}
                        alt={currentPromo.displayName}
                        className={`w-full ${heroHeightClass} lg:h-full lg:min-h-[240px] lg:max-h-[290px] object-cover block`}
                      />
                    </div>

                    {/* Calm Stage Story & Immediate Workspace Action */}
                    <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[#5584B4] font-bold">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            <span>THE STAGE STORY · {currentPromo.displayName}</span>
                          </span>
                          <span className="text-slate-400">
                            {(promoIndex % promotionsPool.length) + 1} of {promotionsPool.length}
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 dark:text-white tracking-tight">
                          {currentPromo.displayName}
                        </h2>
                        <p className="text-sm font-sans text-slate-600 dark:text-slate-300 leading-relaxed">
                          {currentPromo.tagline}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPromoIndex((i) => (i - 1 + promotionsPool.length) % promotionsPool.length)}
                            className="px-3 py-2 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] bg-[#FAF8F5] dark:bg-[#0E1220] text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <ChevronLeft className="h-3.5 w-3.5 text-[#5584B4]" />
                            <span>prev</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPromoIndex((i) => (i + 1) % promotionsPool.length)}
                            className="px-3 py-2 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] bg-[#FAF8F5] dark:bg-[#0E1220] text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <span>next</span>
                            <ChevronRight className="h-3.5 w-3.5 text-[#5584B4]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveFooter('apps')}
                            className="px-5 py-2 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] text-white font-sans font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer ml-auto"
                          >
                            <span>{currentPromo.buttonText || `explore ${currentPromo.name}`}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-[#C59B63]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Workspace Jump Cards (Shows bizz-desk is an active toolbench, not a brochure) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl border border-[#E8E2D8] dark:border-[#252E4A] bg-white/90 dark:bg-[#141A2E]">
                      <div className="text-[11px] font-bold text-amber-600 uppercase">01 · Active Stage</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        Vi-Ability Financial Calibration
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        12-month & 5-year simulation ready
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl border border-[#E8E2D8] dark:border-[#252E4A] bg-white/90 dark:bg-[#141A2E]">
                      <div className="text-[11px] font-bold text-[#5584B4] uppercase">02 · Library</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        Virtual Library & Objectives
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Models, memos & Google Drive sync
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl border border-[#E8E2D8] dark:border-[#252E4A] bg-white/90 dark:bg-[#141A2E]">
                      <div className="text-[11px] font-bold text-emerald-600 uppercase">03 · Instant Launch</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        bizzcalc · bizzmodel · bizzplan
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Click APPS below for 1-click access
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* CURRENT vs YOUR PROPOSAL VERTICAL HERO (Showing reduced hero image + action bar + story above fold) */
                <div className="max-w-4xl w-full mx-auto space-y-4">
                  <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#D8CEBC] dark:border-[#252E4A] shadow-lg bg-black/5 dark:bg-[#0A0D14]">
                    <img
                      src={heroImage}
                      alt={currentPromo.displayName}
                      className={`w-full ${heroHeightClass} object-cover block transition-all duration-300`}
                    />
                  </div>

                  {/* Story Stepper + CTA Bar */}
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#141A2E] border border-[#D8CEBC] dark:border-[#252E4A] shadow-sm flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPromoIndex((i) => (i - 1 + promotionsPool.length) % promotionsPool.length)}
                        className="px-3 py-1.5 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] bg-[#FAF8F5] dark:bg-[#0E1220] text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="h-3.5 w-3.5 text-[#5584B4]" />
                        <span>prev story</span>
                      </button>
                      <span className="px-2.5 py-1.5 rounded-xl border border-[#E8E2D8] dark:border-[#252E4A] text-xs text-slate-500">
                        {(promoIndex % promotionsPool.length) + 1} of {promotionsPool.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPromoIndex((i) => (i + 1) % promotionsPool.length)}
                        className="px-3 py-1.5 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] bg-[#FAF8F5] dark:bg-[#0E1220] text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <span>next story</span>
                        <ChevronRight className="h-3.5 w-3.5 text-[#5584B4]" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveFooter('apps')}
                        className="px-5 py-2 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] text-white font-sans font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <span>{currentPromo.buttonText || `explore ${currentPromo.name}`}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#C59B63]" />
                      </button>
                      <span className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1E2548] text-xs lowercase border border-slate-200 dark:border-[#2B3452]">
                        close & enter workspace
                      </span>
                    </div>
                  </div>

                  {/* Stage Story Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141A2E] border border-[#D8CEBC] dark:border-[#252E4A] shadow-sm space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#5584B4]">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>THE STAGE STORY · {currentPromo.displayName}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold font-sans text-slate-900 dark:text-white">
                      {currentPromo.displayName}
                    </h3>
                    <p className="text-xs sm:text-sm font-sans text-slate-600 dark:text-slate-300 leading-relaxed">
                      {currentPromo.tagline}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* RIGHT SIDEBAR: VIRTUAL LIBRARY & ASK GEMINI */}
            {sidebarsVisible && (
              <aside
                className={`w-68 shrink-0 rounded-2xl border p-3.5 flex flex-col justify-between overflow-y-auto ${
                  isDark ? 'bg-[#101424] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
                }`}
              >
                <div className="space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#5584B4] flex items-center gap-1.5">
                    <Library className="h-3.5 w-3.5" />
                    <span>VIRTUAL LIBRARY</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#161C30] border border-[#E8E2D8] dark:border-[#252E4A] space-y-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Daily Focus Objectives</div>
                    <div className="text-[10px] text-slate-500">
                      Calibrate unit economics & runway baselines
                    </div>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    {['Financial Models Vault', 'VDR Checklists', 'Workbooks & Memos'].map((item) => (
                      <div
                        key={item}
                        className="p-2 rounded-lg border border-[#E8E2D8] dark:border-[#252E4A] font-semibold"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-2.5 border-t border-[#E8E2D8] dark:border-[#252E4A] space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#5584B4] flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>ASK GEMINI</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg border border-[#D8CEBC] dark:border-[#252E4A] bg-[#FAF8F5] dark:bg-[#0E1220] text-[10px] text-slate-400">
                    Ask Gemini about capital, strategy...
                  </div>
                </div>
              </aside>
            )}
          </div>

          {/* ================================================================= */}
          {/* FIXED WORKSPACE QUICK-LINK FOOTER (OPERATIVE DURING CALM VIEW!)   */}
          {/* Active in Mode B & Mode C whenever sidebars are collapsed          */}
          {/* ================================================================= */}
          {mode !== 'current' && !sidebarsVisible && (
            <footer
              className={`shrink-0 border-t px-4 py-2 flex items-center justify-around gap-1 sm:gap-2 backdrop-blur-md transition-colors ${
                isDark
                  ? 'bg-[#101424]/95 border-[#252E4A] text-slate-200'
                  : 'bg-white/95 border-[#D8CEBC] text-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]'
              }`}
            >
              {(
                [
                  { id: 'solutions', label: 'SOLUTIONS', icon: Menu, accent: '' },
                  { id: 'workarea', label: 'WORK AREA', icon: Layers, accent: '' },
                  { id: 'library', label: 'LIBRARY', icon: Library, accent: 'text-[#5584B4]' },
                  { id: 'ask-gemini', label: 'ASK GEMINI', icon: Sparkles, accent: 'text-[#5584B4]' },
                  { id: 'bizzclass', label: 'BIZZCLASS', icon: GraduationCap, accent: 'text-[#C59B63]' },
                  { id: 'apps', label: 'APPS', icon: Smartphone, accent: 'text-[#84CC16]' },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const isActive = activeFooter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleFooterClick(item.id)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold tracking-wide transition-all cursor-pointer ${
                      isActive
                        ? 'text-[#2E5E88] dark:text-[#7EB2E2] bg-[#5584B4]/15 ring-1 ring-[#5584B4]/35'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-[#1A213B]'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? '' : item.accent}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </footer>
          )}
        </div>

        {/* =================================================================== */}
        {/* OPTIONAL COLLAPSIBLE SIDE PANEL: GIM UX ENHANCEMENT EVALUATION      */}
        {/* =================================================================== */}
        {showEnhancementNotes && (
          <aside className="w-80 lg:w-96 shrink-0 rounded-2xl bg-[#111626] border border-[#252E4A] p-4 text-xs text-slate-300 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#252E4A] pb-2.5">
              <span className="font-bold text-white uppercase tracking-wider">
                GIM Evaluation & Enhancements
              </span>
              <button
                type="button"
                onClick={() => setShowEnhancementNotes(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-bold text-emerald-400 uppercase">
                Why Your Proposal Works
              </div>
              <p className="leading-relaxed text-slate-300">
                1. Eliminates immediate 3-column cognitive overload on landing while keeping the{' '}
                <strong className="text-white">bizz-desk</strong> desk frame intact.
              </p>
              <p className="leading-relaxed text-slate-300">
                2. Reducing the hero height reveals the action buttons and headline immediately above the fold.
              </p>
              <p className="leading-relaxed text-slate-300">
                3. The fixed 5-item footer mirrors the mobile architecture users already find intuitive.
              </p>
            </div>

            <div className="space-y-2 border-t border-[#252E4A] pt-3">
              <div className="text-[11px] font-bold text-amber-400 uppercase">
                4 Recommended Enhancements (Test in Mode C)
              </div>
              <ul className="space-y-2 list-disc pl-4 leading-relaxed">
                <li>
                  <strong className="text-white">Keep Calm Mode on Footer Clicks:</strong> Clicking{' '}
                  <em>SOLUTIONS</em>, <em>LIBRARY</em>, <em>ASK GEMINI</em>, <em>BIZZCLASS</em>, or <em>APPS</em> opens a clean contextual view instead of forcing the user back into crowded 3-column walls.
                </li>
                <li>
                  <strong className="text-white">Horizontal Split Hero (Desktop):</strong> Placing the compact photo beside the Stage Story puts image + story + buttons + workspace jump cards 100% above the fold with zero scrolling.
                </li>
                <li>
                  <strong className="text-white">Clear Toggle Label:</strong> Rename the top-right reversed toggle tooltip/state so users know they can open the full 3-panel power-desk anytime.
                </li>
                <li>
                  <strong className="text-white">Auto-Hide Footer When 3 Panels Open:</strong> As soon as someone toggles 3-Panel Desk mode, the desktop footer tucks away automatically so nothing duplicates the sidebars.
                </li>
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
