import React, { useState } from 'react';
import {
  ShoppingCart,
  Layers,
  Sparkles,
  Check,
  ArrowRight,
  Play,
  Coins,
  ShieldCheck,
  Search,
  Filter,
  DollarSign,
  Zap,
} from 'lucide-react';
import { PLATFORM_APPS_CATALOG, PlatformAppDefinition } from '../../components/PlatformApps';
import { CmsProduct } from '../../data/cmsConsoleData';
import { BizzSolution } from '../../types';

interface BizzMallAppProps {
  theme?: 'light' | 'dark';
  cmsProducts?: CmsProduct[];
  tokenBalance?: number;
  onLaunchApp?: (appId: string) => void;
  onNavigateToStage?: (stageId: string, solutionId?: string) => void;
  onBuySolution?: (solution: BizzSolution) => void;
}

export const BizzMallApp: React.FC<BizzMallAppProps> = ({
  theme = 'light',
  cmsProducts = [],
  tokenBalance = 250,
  onLaunchApp,
  onNavigateToStage,
  onBuySolution,
}) => {
  const isDark = theme === 'dark';

  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = PLATFORM_APPS_CATALOG.filter((app) => {
    if (selectedStage !== 'all' && app.stage !== selectedStage) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        app.name.toLowerCase().includes(q) ||
        app.sku.toLowerCase().includes(q) ||
        app.subtitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className={`p-4 sm:p-6 space-y-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Mall Header Banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#5584B4] uppercase tracking-wider">
              BIZZMALL · PLATFORM SOLUTIONS MARKETPLACE
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              V2 STOREFRONT
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white uppercase tracking-tight">
            Institutional Venture Tooling & Digital Sandbox Licenses
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Acquire quantitative financial engines, automated ledger bridges, and virtual data room frameworks. All licenses include lifetime upgrades and 20% founder token rebate.
          </p>
        </div>

        {/* Token Balance Pill */}
        <div className={`p-3.5 rounded-xl border shrink-0 text-right ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
          <div className="text-[10px] font-mono text-slate-400 uppercase">Available Tokens</div>
          <div className="font-mono text-lg font-bold text-amber-500">{tokenBalance} Tokens</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Automated checkout enabled</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {[
            { id: 'all', label: 'all apps' },
            { id: 'vi-ability', label: 'stage 01' },
            { id: 'fund-ability', label: 'stage 02' },
            { id: 'sustain-ability', label: 'stage 03' },
            { id: 'invest-ability', label: 'stage 04' },
            { id: 'operations', label: 'operations' },
            { id: 'growth', label: 'growth' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStage(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all lowercase border ${
                selectedStage === tab.id
                  ? isDark
                    ? 'bg-[#1E2548] text-[#DDEBF7] border-[#5584B4] shadow-xs'
                    : 'bg-[#12172A] text-white border-[#12172A] shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white bg-[#0E1322] border-transparent'
                  : 'text-slate-600 hover:text-slate-900 bg-white border-[#D8CEBC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search BizzMall apps..."
            className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-[#5584B4] ${
              isDark
                ? 'bg-[#0E1322] border-[#252E4A] text-white placeholder-slate-500'
                : 'bg-white border-[#D8CEBC] text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Grid of Store Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((app) => (
          <div
            key={app.id}
            className={`rounded-2xl border p-5 flex flex-col justify-between transition-all hover:shadow-md ${
              isDark
                ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]'
                : 'bg-white border-[#D8CEBC] hover:border-[#5584B4] shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#222F4C]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#0E1322] border border-[#D8CEBC] dark:border-[#252E4A]">
                    {app.sku}
                  </span>
                  <span className="font-mono text-[10px] uppercase font-bold text-[#5584B4]">
                    {app.stageCode}
                  </span>
                </div>

                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  R{app.sellingPriceZAR.toFixed(2)}
                </span>
              </div>

              <div className="mt-3.5 space-y-1">
                <h3 className="font-mono text-base font-bold text-slate-900 dark:text-white lowercase">
                  {app.name.toLowerCase()}
                </h3>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {app.subtitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1 line-clamp-2">
                  {app.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E8E2D8] dark:border-[#222F4C] space-y-1">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                  Included Modules:
                </div>
                <ul className="text-xs font-mono text-slate-600 dark:text-slate-300 space-y-0.5">
                  {app.modules.slice(0, 3).map((m, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-[11px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#5584B4] shrink-0" />
                      <span className="truncate">{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#E8E2D8] dark:border-[#222F4C] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>{app.billingModel}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {app.tokensAllocated} Tokens
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onLaunchApp && onLaunchApp(app.id)}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-mono font-bold bg-[#12172A] hover:bg-[#1E2548] text-white dark:bg-[#1E2548] dark:hover:bg-[#2B3566] transition-colors lowercase"
                >
                  <Play className="h-3 w-3 text-[#5584B4]" />
                  <span>Launch App</span>
                </button>

                <button
                  onClick={() => onNavigateToStage && onNavigateToStage(app.stage, app.id)}
                  className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl text-xs font-mono font-bold bg-[#FAF8F5] dark:bg-[#0E1322] hover:bg-[#F4EFE6] dark:hover:bg-[#182038] border border-[#D8CEBC] dark:border-[#252E4A] text-slate-800 dark:text-slate-200 transition-colors lowercase"
                >
                  <span>Stage View</span>
                  <ArrowRight className="h-3 w-3 text-[#5584B4]" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
