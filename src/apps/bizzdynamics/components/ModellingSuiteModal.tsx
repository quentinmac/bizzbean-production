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
  Building2,
} from 'lucide-react';

interface ModellingSuiteModalProps {
  theme?: 'light' | 'dark';
  isOpen: boolean;
  onClose: () => void;
  onSelectApp: (appId: 'bizzdynamics' | 'rolling-forecast' | 'bizzmodel' | 'bizzbudget' | 'bizzplan') => void;
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
      id: 'rolling-forecast',
      name: 'bizzoptimizer',
      badge: 'performance optimizer',
      headline: 'prime purpose: ytd performance & actions to improve',
      bullets: [
        'ytd actuals & 60-month rolling financial forecast',
        'return on sales & asset turn ratio objectives',
        'interactive what-if sensitivity simulator',
        'programme of actions for 8 performance leaders',
        'editable improvement hints by 5 touch-points',
      ],
      icon: TrendingUp,
      color: '#2E5E88',
      linkTarget: 'rolling-forecast',
    },
    {
      id: 'bizzbudget',
      name: 'bizzbudget',
      badge: '12-month group budget',
      headline: 'branch, region & group consolidated budgeting',
      bullets: [
        '12-month operational & financial budget',
        'standalone branch or multi-branch + holding company',
        'branch, region & 100%-eliminated group consolidations',
        'preceding-year ytd forecast & 6-column variance summary',
        'custom effectiveness areas & operational plans',
      ],
      icon: Building2,
      color: '#1E3A5F',
      linkTarget: 'bizzbudget',
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
              INTEGRATED DESKTOP / LAPTOP APPLICATIONS
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Designed for laptop & desktop usage to optimize screen efficiency while strictly maintaining the BizzCalc design standard: <strong>page functionality in the top row</strong> and <strong>page navigation in the bottom row</strong>.
            </p>
          </div>

          {/* Interactive Flow Chart Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {apps.map((app, idx) => {
              const IconComp = app.icon;
              const isActive = currentApp === app.id;
              return (
                <div
                  key={app.id}
                  className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                    isActive
                      ? 'border-[#2E5E88] ring-2 ring-[#2E5E88]/30 shadow-md bg-white dark:bg-[#121A2F]'
                      : isDark
                      ? 'bg-[#101626] border-[#222F4C] hover:border-slate-600'
                      : 'bg-white border-[#D8CEBC] hover:border-[#2E5E88]/60 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-xl text-white flex items-center justify-center shrink-0"
                          style={{ backgroundColor: app.color }}
                        >
                          <IconComp className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white lowercase">
                            {app.name}
                          </h3>
                          <span className="text-[10px] uppercase font-bold text-[#2E5E88] dark:text-[#5584B4]">
                            {app.badge}
                          </span>
                        </div>
                      </div>

                      {isActive && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-bold uppercase">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <ul className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {app.bullets.map((b, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2E5E88]" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400">Step {idx + 1} of Suite</span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectApp(app.id as any);
                        onClose();
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-[#2E5E88] text-white hover:bg-[#254d70]'
                          : 'border border-[#2E5E88] text-[#2E5E88] hover:bg-[#2E5E88] hover:text-white'
                      }`}
                    >
                      open {app.name}
                    </button>
                  </div>
                </div>
              );
            })}
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
