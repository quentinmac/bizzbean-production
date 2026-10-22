import React, { useState } from 'react';
import {
  Layers,
  Search,
  Plus,
  Play,
  CheckCircle2,
  DollarSign,
  Tag,
  ShieldCheck,
  TrendingUp,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  FolderLock,
  Zap,
} from 'lucide-react';
import { DEFAULT_BIZZ_APPS, BizzAppCatalogItem } from '../data/defaultBizzApps';

interface BizzAppsPlatformManagerProps {
  theme?: 'light' | 'dark';
  onLaunchApp?: (appId: string) => void;
  onNavigateToStage?: (stageId: string, solutionId?: string) => void;
}

export const BizzAppsPlatformManager: React.FC<BizzAppsPlatformManagerProps> = ({
  theme = 'light',
  onLaunchApp,
  onNavigateToStage,
}) => {
  const isDark = theme === 'dark';
  const [apps, setApps] = useState<BizzAppCatalogItem[]>(DEFAULT_BIZZ_APPS);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAppId, setSelectedAppId] = useState<string>(DEFAULT_BIZZ_APPS[0].id);

  const stages = [
    { id: 'all', label: 'All Stages (11 Apps)' },
    { id: 'vi-ability', label: 'Stage 01: Vi-ability' },
    { id: 'fund-ability', label: 'Stage 02: Fund-ability' },
    { id: 'sustain-ability', label: 'Stage 03: Sustain-ability' },
    { id: 'invest-ability', label: 'Stage 04: Invest-ability' },
    { id: 'operations', label: 'Stage 05: Operations' },
    { id: 'growth', label: 'Stage 06: Growth' },
  ];

  const filteredApps = apps.filter((app) => {
    const matchesStage = selectedStage === 'all' || app.stage === selectedStage;
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSearch;
  });

  const selectedApp = apps.find((a) => a.id === selectedAppId) || filteredApps[0] || apps[0];

  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Header */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#5584B4]/20 text-[#5584B4] border border-[#5584B4]/30">
                CMS Console · Stage-Centric
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase">
                V1 Platform Migration Verified
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-mono font-bold mt-2 uppercase tracking-tight text-slate-900 dark:text-white">
              BizzApps Platform Manager
            </h1>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Registry and launch configurations for all 11 platform applications, calculators, simulation engines, and the Hi-Level Forecast module.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onLaunchApp && onLaunchApp(selectedApp.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5584B4] hover:bg-[#4372A2] text-white font-mono text-xs font-bold shadow-sm transition-colors uppercase tracking-wider"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Launch {selectedApp.name}</span>
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="mt-6 flex flex-col md:flex-row gap-3 pt-5 border-t border-slate-200 dark:border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps by name, SKU, or keyword..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-[#5584B4] ${
                isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-slate-50 border-[#D8CEBC] text-slate-900'
              }`}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {stages.map((stg) => {
              const isSelected = selectedStage === stg.id;
              return (
                <button
                  key={stg.id}
                  onClick={() => setSelectedStage(stg.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-colors border ${
                    isSelected
                      ? isDark
                        ? 'bg-[#1E2548] text-white border-[#5584B4]'
                        : 'bg-[#12172A] text-white border-[#12172A]'
                      : isDark
                      ? 'bg-[#141A2E] text-slate-400 border-[#252E4A] hover:text-white'
                      : 'bg-slate-50 text-slate-600 border-[#D8CEBC] hover:text-slate-900'
                  }`}
                >
                  {stg.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: App Cards & Selected Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Apps List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredApps.map((app) => {
            const isSelected = app.id === selectedAppId;
            return (
              <div
                key={app.id}
                onClick={() => setSelectedAppId(app.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isSelected
                    ? isDark
                      ? 'bg-[#141C30] border-[#5584B4] shadow-sm'
                      : 'bg-[#F2EFE9] border-[#12172A] shadow-xs'
                    : isDark
                    ? 'bg-[#101626] border-[#222F4C] hover:border-slate-700'
                    : 'bg-white border-[#D8CEBC] hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#5584B4]/15 border border-[#5584B4]/30 text-[#5584B4] shrink-0">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-white lowercase">
                        {app.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">
                        {app.sku}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#5584B4]/20 text-[#5584B4] font-bold">
                        {app.stageCode}
                      </span>
                      {app.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30">
                          {app.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 font-mono">
                      {app.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      R {app.priceZAR.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 lowercase">
                      {app.billingModel}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onLaunchApp) onLaunchApp(app.id);
                    }}
                    className="p-2 rounded-xl bg-[#5584B4] hover:bg-[#4372A2] text-white transition-colors"
                    title={`Launch ${app.name}`}
                  >
                    <Play className="h-4 w-4 fill-white" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected App Detail Panel */}
        <div className={`p-5 rounded-2xl border space-y-4 self-start ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 uppercase border border-emerald-500/30">
              Active Selection
            </span>
            <span className="text-xs font-mono font-bold text-[#5584B4]">
              {selectedApp.sku}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-mono font-bold text-slate-900 dark:text-white lowercase">
              {selectedApp.name}
            </h2>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedApp.subtitle}
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
            {selectedApp.description}
          </p>

          <div className="p-3 rounded-xl bg-[#0E1322] border border-[#252E4A] font-mono text-xs space-y-1">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Migration Reference:</div>
            <div className="text-[#5584B4] break-all text-[11px]">{selectedApp.entryComponent}</div>
            <div className="text-slate-400 text-[10px] uppercase font-bold mt-2">Root Directory:</div>
            <div className="text-emerald-400 text-[11px]">{selectedApp.rootDirectory}</div>
          </div>

          <div>
            <div className="text-[10px] font-mono font-bold uppercase text-slate-400 mb-2">
              Core Capabilities & Steps
            </div>
            <div className="space-y-1.5">
              {selectedApp.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-mono text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button
              onClick={() => onLaunchApp && onLaunchApp(selectedApp.id)}
              className="w-full py-2.5 rounded-xl bg-[#5584B4] hover:bg-[#4372A2] text-white font-mono text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Launch in Work Area</span>
            </button>

            {onNavigateToStage && (
              <button
                onClick={() => onNavigateToStage(selectedApp.stage, selectedApp.id)}
                className="w-full py-2 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] hover:bg-slate-100 dark:hover:bg-[#1E2548] font-mono text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5 lowercase"
              >
                <span>go to stage workstation</span>
                <ExternalLink className="h-3 w-3 text-[#5584B4]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BizzAppsPlatformManager;
