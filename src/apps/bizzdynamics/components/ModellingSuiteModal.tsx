import React from 'react';
import {
  X,
  ArrowRight,
  ArrowDown,
  BookOpen,
  TrendingUp,
  Sliders,
  FileText,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface ModellingSuiteModalProps {
  theme?: 'light' | 'dark';
  isOpen: boolean;
  onClose: () => void;
  onSelectApp: (appId: 'bizzdynamics' | 'hi-level-forecast' | 'bizzmodel' | 'bizzplan') => void;
  currentApp: string;
}

export const ModellingSuiteModal: React.FC<ModellingSuiteModalProps> = ({
  theme = 'light',
  isOpen,
  onClose,
  onSelectApp,
  currentApp,
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const apps = [
    {
      id: 'bizzdynamics',
      name: 'bizzdynamics',
      badge: 'starting application',
      headline: 'prime purpose – education',
      bullets: [
        'prime purpose – education',
        'redacted content for rapid comprehension',
        'results derived from value-based content',
        'innovative 5-year base rate adjustment tool',
        'voice prompt control',
      ],
      icon: Sliders,
      color: '#2E5E88',
      linkTarget: 'bizzdynamics',
    },
    {
      id: 'hi-level-forecast',
      name: 'Hi-Level Forecast',
      badge: '10-minute turnaround',
      headline: 'prime purpose: 10-minute forecast',
      bullets: [
        'prime purpose: 10-minute forecast',
        'redacted content for swift executive dial-in',
        'results derived from revenue multipliers',
        'linked directly to bizzmodel',
        'seamless integration into full business plan',
      ],
      icon: TrendingUp,
      color: '#5584B4',
      linkTarget: 'hi-level-forecast',
    },
    {
      id: 'bizzmodel',
      name: 'bizzmodel',
      badge: 'comprehensive engine',
      headline: 'business plan modeller',
      bullets: [
        'business plan modeller',
        '40+ model-sets that serve hundreds of business types',
        'detailed content across all 7 operational steps',
        'integrated bizzplan exports',
        'full 3-statement financial simulation',
      ],
      icon: BookOpen,
      color: '#12172A',
      linkTarget: 'bizzmodel',
    },
    {
      id: 'bizzplan',
      name: 'bizzplan',
      badge: 'executive presentation',
      headline: 'presents a professional business plan',
      bullets: [
        'presents a professional business plan',
        'integrates directly into bizzmodel',
        'investor-grade executive memorandums',
        'financial summaries & cap table schedule',
        'formal investor readiness pack',
      ],
      icon: FileText,
      color: '#2E5E88',
      linkTarget: 'bizzplan',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs font-mono animate-in fade-in duration-150">
      <div
        className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-[#0E1424] border-[#222F4C] text-slate-100' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-white border border-[#D8CEBC] shadow-xs">
              <img src="/bizzbean-favicon.jpg" alt="bizzbean" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white lowercase">
                bizzbean modelling suite
              </h2>
              <p className="text-xs text-slate-500 lowercase">
                architecture proposal & integrated application ecosystem
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Suite Architecture Flow Diagram (Matching PDF Page 1) */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E5E88] dark:text-[#5584B4]">
              4 INTEGRATED DESKTOP / LAPTOP APPLICATIONS
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Designed for laptop & desktop usage to optimize screen efficiency while strictly maintaining the BizzCalc design standard: <strong>page functionality in the top row</strong> and <strong>page navigation in the bottom row</strong>.
            </p>
          </div>

          {/* Interactive Flow Chart Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. BizzDynamics */}
            <div
              className={`p-5 rounded-2xl border transition-all relative ${
                currentApp === 'bizzdynamics'
                  ? 'border-[#2E5E88] ring-2 ring-[#2E5E88]/30 shadow-md bg-white dark:bg-[#121A2F]'
                  : isDark
                  ? 'bg-[#101626] border-[#222F4C] hover:border-slate-600'
                  : 'bg-white border-[#D8CEBC] hover:border-[#2E5E88]/60 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#2E5E88] text-white flex items-center justify-center">
                    <Sliders className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white lowercase">
                      bizzdynamics
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-[#2E5E88] dark:text-[#5584B4]">
                      education & high-level content
                    </span>
                  </div>
                </div>

                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-bold uppercase">
                  ACTIVE
                </span>
              </div>

              <ul className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {apps[0].bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E5E88]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-400">Step 1 of Suite</span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectApp('bizzdynamics');
                    onClose();
                  }}
                  className="px-3 py-1 rounded-xl bg-[#2E5E88] text-white text-xs font-bold hover:bg-[#254d70] transition-colors"
                >
                  open bizzdynamics
                </button>
              </div>
            </div>

            {/* 2. Hi-Level Forecast */}
            <div
              className={`p-5 rounded-2xl border transition-all relative ${
                isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#5584B4] text-white flex items-center justify-center">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white lowercase">
                      Hi-Level Forecast
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-[#5584B4]">
                      10-minute 5-year forecast
                    </span>
                  </div>
                </div>
              </div>

              <ul className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {apps[1].bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5584B4]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-400">Links to BizzModel</span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectApp('hi-level-forecast');
                    onClose();
                  }}
                  className="px-3 py-1 rounded-xl border border-[#5584B4] text-[#5584B4] hover:bg-[#5584B4] hover:text-white text-xs font-bold transition-colors"
                >
                  launch forecast
                </button>
              </div>
            </div>

            {/* 3. BizzModel */}
            <div
              className={`p-5 rounded-2xl border transition-all relative ${
                isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#12172A] text-white flex items-center justify-center">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white lowercase">
                      bizzmodel
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      business plan modeller (40+ model-sets)
                    </span>
                  </div>
                </div>
              </div>

              <ul className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {apps[2].bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-400">Detailed Modeller</span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectApp('bizzmodel');
                    onClose();
                  }}
                  className="px-3 py-1 rounded-xl border border-slate-400 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                >
                  open bizzmodel
                </button>
              </div>
            </div>

            {/* 4. BizzPlan */}
            <div
              className={`p-5 rounded-2xl border transition-all relative ${
                isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#2E5E88] text-white flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white lowercase">
                      bizzplan
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-[#2E5E88]">
                      professional business plan
                    </span>
                  </div>
                </div>
              </div>

              <ul className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {apps[3].bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E5E88]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-400">Integrates into BizzModel</span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectApp('bizzplan');
                    onClose();
                  }}
                  className="px-3 py-1 rounded-xl border border-[#2E5E88] text-[#2E5E88] hover:bg-[#2E5E88] hover:text-white text-xs font-bold transition-colors"
                >
                  open bizzplan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between text-xs ${
            isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#F4EFE6] border-[#D8CEBC]'
          }`}
        >
          <span className="text-slate-500">
            bizzbean™ suite design standard · desktop/laptop screen optimized
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            close
          </button>
        </div>
      </div>
    </div>
  );
};
