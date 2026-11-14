import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calculator,
  TrendingUp,
  FileText,
  ShoppingCart,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  X,
  Clock,
  FolderLock,
  DollarSign,
  FileSpreadsheet,
  Zap,
  Target,
  Sliders,
  Laptop,
  Smartphone,
} from 'lucide-react';
// Authentic V1 Platform Applications (Reference Guide)
import { BizzCalc } from './bizzcalc/BizzCalc';
import { BizzDynamics } from './bizzdynamics/BizzDynamics';
import { BizzCalculators } from './bizzcalculators/BizzCalculators';
import { BizzModel } from './bizzmodel/BizzModel';
import { BizzPlan } from './bizzplan/BizzPlan';

// Modular Companions & Specialized Apps
import { BizzCalcApp } from './bizzcalc/BizzCalcApp';
import { BizzCalculatorsApp } from './bizzcalculators/BizzCalculatorsApp';
import { BizzMallApp } from './bizzmall/BizzMallApp';
import { BizzModelApp } from './bizzmodel/BizzModelApp';
import { BizzPlanApp } from './bizzplan/BizzPlanApp';
import { SustainRunwayApp } from './sustainrunway/SustainRunwayApp';
import { InvestVdrApp } from './investvdr/InvestVdrApp';
import { BizzMoneyApp } from './bizzmoney/BizzMoneyApp';
import { BizzBudgetApp } from './bizzbudget/BizzBudgetApp';
import { BizzOptimizerApp } from './bizzoptimizer/BizzOptimizerApp';
import { GrowthStrategyApp } from './growthstrategy/GrowthStrategyApp';
import { CmsProduct } from '../data/cmsConsoleData';
import { UserBusinessProfile, BizzSolution } from '../types';

export interface PlatformAppPresenterProps {
  theme?: 'light' | 'dark';
  initialAppId?: string;
  cmsProducts?: CmsProduct[];
  userProfile?: UserBusinessProfile;
  tokenBalance?: number;
  onBackToWorkstation: () => void;
  onNavigateToStage?: (stageId: string, solutionId?: string) => void;
  onBuySolution?: (solution: BizzSolution) => void;
}

export const PlatformAppPresenter: React.FC<PlatformAppPresenterProps> = ({
  theme = 'light',
  initialAppId,
  cmsProducts = [],
  userProfile,
  tokenBalance = 250,
  onBackToWorkstation,
  onNavigateToStage,
  onBuySolution,
}) => {
  const isDark = theme === 'dark';

  // Normalize incoming initialAppId
  const normalizeAppId = (id?: string) => {
    if (!id) return 'bizzcalc';
    const lower = id.toLowerCase();

    // Check if the id matches a CMS product whose name or subtitle mentions dynamics, calculators, model, etc.
    const matchingCms = (cmsProducts || []).find((p) => p.id === id);
    if (matchingCms) {
      const cmsName = (matchingCms.name || '').toLowerCase();
      const cmsSub = (matchingCms.subtitle || '').toLowerCase();
      if (cmsName.includes('dynamics') || cmsSub.includes('dynamics')) return 'bizzdynamics';
      if (cmsName.includes('calculators') || cmsSub.includes('calculators')) return 'bizzcalculators';
      if (cmsName.includes('rolling') || cmsSub.includes('rolling')) return 'rolling-forecast';
      if (cmsName.includes('forecast') || cmsName.includes('hi-level')) return 'hi-level-forecast';
      if (cmsName.includes('model')) return 'bizzmodel';
      if (cmsName.includes('plan')) return 'bizzplan';
      if (cmsName.includes('calc')) return 'bizzcalc';
    }

    if (lower.includes('calculators')) return 'bizzcalculators';
    if (lower.includes('dynamics')) return 'bizzdynamics';
    if (lower.includes('calc')) return 'bizzcalc';
    if (lower.includes('rolling')) return 'rolling-forecast';
    if (lower.includes('hi-level') || lower === 'forecast') return 'hi-level-forecast';
    if (lower.includes('model') || lower.includes('forecast') || lower === 'fund-ability') return 'bizzmodel';
    if (lower.includes('plan')) return 'bizzplan';
    if (lower.includes('runway') || lower.includes('sustain')) return 'sustain-runway';
    if (lower.includes('vdr') || lower.includes('invest')) return 'invest-vdr';
    if (lower.includes('money') || lower.includes('ledger') || lower.includes('account')) return 'bizzmoney';
    if (lower.includes('budget')) return 'bizzbudget';
    if (lower.includes('optimizer') || lower.includes('trim')) return 'bizzoptimizer';
    if (lower.includes('growth') || lower.includes('moat')) return 'growth-strategy';
    if (lower.includes('mall') || lower.includes('store') || lower.includes('shop')) return 'bizzmall';
    if (lower === 'vi-ability') return 'bizzcalc';
    return 'bizzcalc';
  };

  const [activeApp, setActiveApp] = useState<string>(normalizeAppId(initialAppId));
  // Toggle between authentic V1 platform app engine and executive companion
  const [engineMode, setEngineMode] = useState<'v1-suite' | 'companion'>('v1-suite');
  const [allowMobileBypass, setAllowMobileBypass] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 768;
    return false;
  });

  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (initialAppId) {
      setActiveApp(normalizeAppId(initialAppId));
      setAllowMobileBypass(false);
    }
  }, [initialAppId]);

  const appDefinitions = [
    {
      id: 'bizzcalc',
      name: 'bizzcalc',
      sku: 'BA-001',
      stage: 'vi-ability',
      stageCode: 'Stage 01',
      subtitle: 'Cost Recovery, Break-Even & Contribution Margin Simulator',
      icon: Calculator,
      hasCompanion: true,
      mobileReady: true,
    },
    {
      id: 'bizzcalculators',
      name: 'bizzcalculators',
      sku: 'BA-CALC',
      stage: 'vi-ability',
      stageCode: 'Stage 01',
      subtitle: 'Specialized CAC : LTV, Working Capital & True Hourly Labor Suite',
      icon: Calculator,
      hasCompanion: true,
      mobileReady: true,
    },
    {
      id: 'bizzdynamics',
      name: 'bizzdynamics',
      sku: 'BA-DYN',
      stage: 'vi-ability',
      stageCode: 'Stage 01',
      subtitle: 'Dynamic Business Physics & Revenue Multiplier Simulator',
      badge: 'stand alone simulator',
      icon: Sliders,
      desktopOnly: true,
    },
    {
      id: 'rolling-forecast',
      name: 'rolling forecast',
      sku: 'BA-ROLL',
      stage: 'operations',
      stageCode: 'Stage 05',
      subtitle: 'Hi-Level Rolling Forecast & Prior Year Balance Sheet Engine',
      badge: 'stand alone',
      icon: TrendingUp,
      desktopOnly: true,
    },
    {
      id: 'bizzmodel',
      name: 'bizzmodel',
      sku: 'BA-002',
      stage: 'fund-ability',
      stageCode: 'Stage 02',
      subtitle: 'Hi-Level 36-Month Forecast, Dynamic Dials & 3-Statement Schedule',
      badge: 'includes hi-level forecast',
      icon: TrendingUp,
      hasCompanion: true,
      desktopOnly: true,
    },
    {
      id: 'hi-level-forecast',
      name: 'hi-level forecast',
      sku: 'BA-FORECAST',
      stage: 'fund-ability',
      stageCode: 'Stage 02',
      subtitle: 'Hi-Level 36-Month Strategic Horizon Forecast & Valuation Modeler',
      badge: 'includes bizzmodel',
      icon: TrendingUp,
      desktopOnly: true,
    },
    {
      id: 'bizzplan',
      name: 'bizzplan',
      sku: 'BA-003',
      stage: 'fund-ability',
      stageCode: 'Stage 02',
      subtitle: 'Executive Memorandums, Cap Table Waterfall & Strategic Business Plan',
      icon: FileText,
      hasCompanion: true,
      desktopOnly: true,
    },
    {
      id: 'sustain-runway',
      name: 'sustain-runway',
      sku: 'BA-004',
      stage: 'sustain-ability',
      stageCode: 'Stage 03',
      subtitle: 'Working Capital & Operational Runway Safeguards',
      icon: Clock,
    },
    {
      id: 'invest-vdr',
      name: 'invest-vdr',
      sku: 'BA-005',
      stage: 'invest-ability',
      stageCode: 'Stage 04',
      subtitle: '40-Point Due Diligence Virtual Data Room Matrix',
      icon: FolderLock,
    },
    {
      id: 'bizzmoney',
      name: 'bizzmoney',
      sku: 'BA-006',
      stage: 'operations',
      stageCode: 'Stage 05',
      subtitle: 'Double-Entry Accounting & 62-Account Ledger Architecture',
      icon: DollarSign,
    },
    {
      id: 'bizzbudget',
      name: 'bizzbudget',
      sku: 'BA-007',
      stage: 'operations',
      stageCode: 'Stage 05',
      subtitle: 'Rolling Cash Flow Allocations & Variance Reporting',
      icon: FileSpreadsheet,
    },
    {
      id: 'bizzoptimizer',
      name: 'bizzoptimizer',
      sku: 'BA-008',
      stage: 'operations',
      stageCode: 'Stage 05',
      subtitle: 'Margin Trimmer & Working Capital Optimizer',
      icon: Zap,
    },
    {
      id: 'growth-strategy',
      name: 'growth-strategy',
      sku: 'BA-009',
      stage: 'growth',
      stageCode: 'Stage 06',
      subtitle: 'Competitive Moats, Market Expansion & Scenario Modeler',
      icon: Target,
    },
    {
      id: 'bizzmall',
      name: 'bizzmall',
      sku: 'BA-MALL',
      stage: 'operations',
      stageCode: 'Platform Store',
      subtitle: 'BizzApps Platform Catalog & Tokenized Upgrade Center',
      badge: 'platform store',
      icon: ShoppingCart,
    },
  ];

  // Carousel navigation
  const currentIndex = appDefinitions.findIndex((a) => a.id === activeApp);
  const handlePrevApp = () => {
    const nextIdx = (currentIndex - 1 + appDefinitions.length) % appDefinitions.length;
    setActiveApp(appDefinitions[nextIdx].id);
  };
  const handleNextApp = () => {
    const nextIdx = (currentIndex + 1) % appDefinitions.length;
    setActiveApp(appDefinitions[nextIdx].id);
  };

  const currentDef = appDefinitions.find((a) => a.id === activeApp) || appDefinitions[0];
  // Standalone BizzDynamics Direct Experience (Per user optimization: removes outer wrapper header and suite carousel strip)
  if (activeApp === 'bizzdynamics') {
    return (
      <div className="w-full h-full flex-1 flex flex-col overflow-hidden">
        <BizzDynamics
          theme={theme}
          onClose={onBackToWorkstation}
          onContextSwitch={(app) => setActiveApp(normalizeAppId(app))}
        />
      </div>
    );
  }

  // Standalone BizzCalc Direct Experience (Matching BizzDynamics container architecture for guaranteed mobile viewport fit)
  if (activeApp === 'bizzcalc') {
    return (
      <div className="w-full h-full flex-1 flex flex-col overflow-hidden">
        <BizzCalc
          theme={theme}
          userProfile={userProfile}
          onClose={onBackToWorkstation}
          onContextSwitch={(app) => setActiveApp(normalizeAppId(app))}
        />
      </div>
    );
  }

  // Standalone BizzModel Suite Direct Experience (rolling forecast, bizzmodel)
  // Guarantees identical unified single-card styling, zero redundant outer headers, and full-width work area
  if (
    activeApp === 'rolling-forecast' ||
    activeApp === 'bizzmodel'
  ) {
    return (
      <div className="w-full h-full flex-1 flex flex-col overflow-hidden">
        <BizzModel
          theme={theme}
          mode={activeApp as any}
          initialAppTab={activeApp as any}
          onClose={onBackToWorkstation}
          onContextSwitch={(app) => setActiveApp(normalizeAppId(app))}
        />
      </div>
    );
  }

  const CurrentIcon = currentDef.icon;

  return (
    <div
      className={`min-h-full flex flex-col transition-colors ${
        isDark ? 'bg-[#0A0D14] text-[#E2E8F0]' : 'bg-[#FAF8F5] text-slate-800'
      }`}
    >
      {/* ===================================================================== */}
      {/* TOP PRESENTER BAR (MATCHING BIZZCLASS PRESENTER STYLING)             */}
      {/* ===================================================================== */}
      <header
        className={`px-4 sm:px-6 py-3 border-b shrink-0 flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToWorkstation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#FAF8F5] dark:bg-[#0E1322] hover:bg-[#F4EFE6] dark:hover:bg-[#1E2548] border border-[#D8CEBC] dark:border-[#252E4A] text-slate-800 dark:text-slate-200 transition-colors lowercase"
            title="Return to stage workstation"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#5584B4]" />
            <span>back to workstation</span>
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#5584B4]/20 border border-[#5584B4]/40 text-[#5584B4]">
              <CurrentIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-white lowercase tracking-tight">
                  {currentDef.name}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30 lowercase">
                  live platform app
                </span>
                <span className="text-[10px] font-mono font-bold text-[#5584B4] uppercase hidden md:inline">
                  {currentDef.sku} · {currentDef.stageCode}
                </span>
                {currentDef.badge && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 lowercase">
                    {currentDef.badge}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {currentDef.subtitle}
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions: Mode Toggle, Stage Links & Close */}
        <div className="flex items-center gap-2">
          {/* Engine view switcher for multi-mode apps */}
          {currentDef.hasCompanion && (
            <div className="hidden sm:flex items-center p-0.5 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] bg-[#FAF8F5] dark:bg-[#0E1322] text-[11px] font-mono font-bold">
              <button
                onClick={() => setEngineMode('v1-suite')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  engineMode === 'v1-suite'
                    ? 'bg-[#12172A] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="V1 Multi-Step Simulation Core Engine"
              >
                V1 Platform Suite
              </button>
              <button
                onClick={() => setEngineMode('companion')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  engineMode === 'companion'
                    ? 'bg-[#5584B4] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Quick Modeler Companion"
              >
                Quick Modeler
              </button>
            </div>
          )}

          {onNavigateToStage && (
            <button
              onClick={() => onNavigateToStage(currentDef.stage, currentDef.id)}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border border-[#D8CEBC] dark:border-[#252E4A] hover:bg-slate-100 dark:hover:bg-[#1E2548] text-slate-600 dark:text-slate-300 transition-colors"
              title="Navigate to stage workstation"
            >
              <span>view stage</span>
              <ExternalLink className="h-3 w-3 text-[#5584B4]" />
            </button>
          )}

          <button
            onClick={onBackToWorkstation}
            className="p-1.5 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 transition-colors"
            title="Close platform app"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* SECONDARY NAVIGATION: ALL 11 PLATFORM APPS CAROUSEL STRIP           */}
      {/* ===================================================================== */}
      <div
        className={`px-4 sm:px-6 py-2 border-b shrink-0 flex items-center justify-between gap-3 overflow-x-auto scrollbar-none ${
          isDark ? 'bg-[#0D121F] border-[#1D273F]' : 'bg-[#F4EFE6] border-[#E5DEC9]'
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 shrink-0">
          <Layers className="h-3.5 w-3.5 text-[#5584B4]" />
          <span className="uppercase text-[11px]">PLATFORM SUITE:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {appDefinitions.map((app) => {
            const isSelected = app.id === activeApp;
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                onClick={() => setActiveApp(app.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap lowercase border ${
                  isSelected
                    ? isDark
                      ? 'bg-[#1E2548] text-white border-[#5584B4] shadow-xs'
                      : 'bg-[#12172A] text-white border-[#12172A] shadow-xs'
                    : isDark
                    ? 'bg-[#121728] text-slate-400 hover:text-white border-[#222E4E]'
                    : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
                }`}
              >
                <Icon className={`h-3 w-3 ${isSelected ? 'text-[#84CC16]' : 'text-slate-400'}`} />
                <span>{app.name}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {app.stageCode}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MAIN APP ENGINE VIEW                                                  */}
      {/* ===================================================================== */}
      <div className="flex-grow overflow-y-auto">
        {/* MOBILE DEVICE GUARD: If app requires laptop/desktop and user is on mobile */}
        {isMobileScreen && (currentDef as any).desktopOnly && !allowMobileBypass ? (
          <div className="p-4 sm:p-6 max-w-md mx-auto my-6 font-mono animate-in fade-in duration-200">
            <div className={`p-6 rounded-2xl border text-center shadow-lg ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}>
              <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-500 flex items-center justify-center mb-3">
                <Laptop className="h-7 w-7" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                Laptop / Desktop Required
              </span>
              <h2 className="text-lg font-bold mt-3 text-slate-900 dark:text-white capitalize">
                {currentDef.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                This platform application contains multi-column 3-statement models, 36-month spreadsheet projections, cap tables, and extensive financial schedules designed specifically for laptop and desktop screens.
              </p>

              <div className="mt-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-left">
                <div className="text-[10px] uppercase font-bold text-emerald-500 flex items-center gap-1.5 mb-1">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Designed for Mobile Devices:</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  <strong>bizzcalc</strong> and <strong>bizzcalculators</strong> are fully designed and optimized for mobile touchscreens.
                </p>
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setActiveApp('bizzcalc')}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#5584B4] hover:bg-[#4372A2] text-white text-xs font-bold uppercase transition-colors text-center"
                  >
                    Launch bizzcalc
                  </button>
                  <button
                    onClick={() => setActiveApp('bizzcalculators')}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#12172A] dark:bg-[#1E2548] hover:bg-slate-800 text-white text-xs font-bold uppercase transition-colors border border-[#2B3452] text-center"
                  >
                    Launch bizzcalculators
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={onBackToWorkstation}
                  className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#1E2548] text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Return to Workstation
                </button>
                <button
                  onClick={() => setAllowMobileBypass(true)}
                  className="text-[10px] text-slate-400 hover:underline lowercase pt-1"
                >
                  preview desktop layout on mobile anyway
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 1. BIZZCALC */}
            {activeApp === 'bizzcalc' && (
              engineMode === 'v1-suite' ? (
                <BizzCalc
                  theme={theme}
                  userProfile={userProfile}
                  onClose={onBackToWorkstation}
                  onContextSwitch={(app) => setActiveApp(normalizeAppId(app))}
                />
              ) : (
                <BizzCalcApp
                  theme={theme}
                  onBackToWorkstation={onBackToWorkstation}
                  onNavigateToStage={onNavigateToStage}
                />
              )
            )}

            {/* 2. BIZZCALCULATORS */}
            {activeApp === 'bizzcalculators' && (
              engineMode === 'v1-suite' ? (
                <BizzCalculators
                  theme={theme}
                  onClose={onBackToWorkstation}
                  onSelectCalculator={() => {}}
                />
              ) : (
                <BizzCalculatorsApp
                  theme={theme}
                  onBackToWorkstation={onBackToWorkstation}
                  onNavigateToStage={onNavigateToStage}
                />
              )
            )}

            {/* 3. BIZZDYNAMICS (Standalone Suite Application with Base Rate Tool & Authentic V1 Reports) */}
            {activeApp === 'bizzdynamics' && (
              <BizzDynamics
                theme={theme}
                onClose={onBackToWorkstation}
                onContextSwitch={(app) => setActiveApp(normalizeAppId(app))}
              />
            )}

            {/* 4. BIZZMODEL (Shared Engine Architecture mode="bizzmodel" + Hi-Level Forecast) */}
            {activeApp === 'bizzmodel' && (
              engineMode === 'v1-suite' ? (
                <BizzModel
                  theme={theme}
                  mode="bizzmodel"
                  onClose={onBackToWorkstation}
                  onContextSwitch={(app) => setActiveApp(normalizeAppId(app))}
                />
              ) : (
                <BizzModelApp
                  theme={theme}
                  onBackToWorkstation={onBackToWorkstation}
                  onNavigateToStage={onNavigateToStage}
                />
              )
            )}

            {/* 4C. ROLLING FORECAST (Stand Alone Hi-Level Forecast with Prior Year Balance Sheet Engine) */}
            {activeApp === 'rolling-forecast' && (
              <BizzModel
                theme={theme}
                mode="rolling-forecast"
                initialAppTab="rolling-forecast"
                onClose={onBackToWorkstation}
                onContextSwitch={(app) => setActiveApp(normalizeAppId(app))}
              />
            )}

            {/* 5. BIZZPLAN */}
            {activeApp === 'bizzplan' && (
              engineMode === 'v1-suite' ? (
                <BizzPlan
                  theme={theme}
                  onClose={onBackToWorkstation}
                  onContextSwitch={(app) => setActiveApp(normalizeAppId(app))}
                />
              ) : (
                <BizzPlanApp
                  theme={theme}
                  userProfile={userProfile}
                  onBackToWorkstation={onBackToWorkstation}
                  onNavigateToStage={onNavigateToStage}
                />
              )
            )}

        {/* 6. SUSTAIN-RUNWAY */}
        {activeApp === 'sustain-runway' && (
          <SustainRunwayApp
            theme={theme}
            onBackToWorkstation={onBackToWorkstation}
            onNavigateToStage={onNavigateToStage}
          />
        )}

        {/* 7. INVEST-VDR */}
        {activeApp === 'invest-vdr' && (
          <InvestVdrApp
            theme={theme}
            onBackToWorkstation={onBackToWorkstation}
            onNavigateToStage={onNavigateToStage}
          />
        )}

        {/* 8. BIZZMONEY */}
        {activeApp === 'bizzmoney' && (
          <BizzMoneyApp
            theme={theme}
            onBackToWorkstation={onBackToWorkstation}
            onNavigateToStage={onNavigateToStage}
          />
        )}

        {/* 9. BIZZBUDGET */}
        {activeApp === 'bizzbudget' && (
          <BizzBudgetApp
            theme={theme}
            onBackToWorkstation={onBackToWorkstation}
            onNavigateToStage={onNavigateToStage}
          />
        )}

        {/* 10. BIZZOPTIMIZER */}
        {activeApp === 'bizzoptimizer' && (
          <BizzOptimizerApp
            theme={theme}
            onBackToWorkstation={onBackToWorkstation}
            onNavigateToStage={onNavigateToStage}
          />
        )}

        {/* 11. GROWTH-STRATEGY */}
        {activeApp === 'growth-strategy' && (
          <GrowthStrategyApp
            theme={theme}
            onBackToWorkstation={onBackToWorkstation}
            onNavigateToStage={onNavigateToStage}
          />
        )}

        {/* 12. BIZZMALL */}
        {activeApp === 'bizzmall' && (
          <BizzMallApp
            theme={theme}
            cmsProducts={cmsProducts}
            tokenBalance={tokenBalance}
            onLaunchApp={(appId) => setActiveApp(normalizeAppId(appId))}
            onNavigateToStage={onNavigateToStage}
            onBuySolution={onBuySolution}
          />
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default PlatformAppPresenter;
