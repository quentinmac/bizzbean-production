import React, { useState, useMemo } from 'react';
import {
  Layers,
  ShieldCheck,
  Calculator,
  TrendingUp,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Check,
  ShoppingCart,
  Play,
  RefreshCw,
  X,
  ChevronRight,
  ChevronLeft,
  Filter,
  Sparkles,
  BarChart3,
  PieChart,
  FileText,
  Lock,
  Unlock,
  Mic,
  Search,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Sliders,
  FolderLock,
  Workflow,
  HelpCircle,
  Database,
} from 'lucide-react';
import { CmsProduct, INITIAL_CMS_PRODUCTS } from '../data/cmsConsoleData';
import { BIZZ_SOLUTIONS } from '../data/bizzdeskData';
import { BizzSolution, UserBusinessProfile } from '../types';

export interface PlatformAppsProps {
  theme?: 'light' | 'dark';
  cmsProducts?: CmsProduct[];
  userPurchases?: string[];
  userProfile?: UserBusinessProfile;
  tokenBalance?: number;
  initialAppId?: string;
  onSelectSolutionById?: (id: string) => void;
  onNavigateToStage?: (stageId: string, solutionId?: string) => void;
  onBuySolution?: (solution: BizzSolution) => void;
  onBackToWorkstation?: () => void;
  onBackToAdmin?: () => void;
  onLaunchApp?: (appId: string) => void;
}

export interface PlatformAppDefinition {
  id: string;
  sku: string;
  name: string;
  subtitle: string;
  stage: 'vi-ability' | 'fund-ability' | 'sustain-ability' | 'invest-ability' | 'operations' | 'growth' | 'personal-sandbox';
  stageCode: string;
  stageDisplayName: string;
  description: string;
  purpose: string;
  billingModel: 'once-off' | 'monthly subscription';
  sellingPriceZAR: number;
  exclusivePriceZAR: number;
  vatZAR: number;
  tokensAllocated: number;
  ticketPriceZAR: number;
  isPurchased: boolean;
  assignedStep: string;
  journeyMilestone: string;
  modules: string[];
  icon: any;
}

export const PLATFORM_APPS_CATALOG: PlatformAppDefinition[] = [
  {
    id: 'bizzcalc',
    sku: 'BA-001',
    name: 'bizzcalc',
    subtitle: 'Cost Recovery, Break-Even & Contribution Margin Simulator',
    stage: 'vi-ability',
    stageCode: 'STAGE 01',
    stageDisplayName: 'vi-ability',
    description: 'Comprehensive cost recovery calculator enabling founders to cost products accurately and set price floors that prevent subsidized growth.',
    purpose: 'Eliminate under-pricing risk and establish verifiable contribution margins before commercial launch.',
    billingModel: 'once-off',
    sellingPriceZAR: 229.0,
    exclusivePriceZAR: 199.13,
    vatZAR: 29.87,
    tokensAllocated: 45.8,
    ticketPriceZAR: 274.8,
    isPurchased: false,
    assignedStep: 'Stage 1 · Step 2',
    journeyMilestone: 'Unit Margin Verification',
    modules: [
      'Overhead Reclaim Rate Matrix',
      'Fixed Expenditures Ledger Modeler',
      'Labor Hour vs. Machine Hour Driver Calibrator',
      'Break-Even Unit Sales Target Generator',
    ],
    icon: Calculator,
  },
  {
    id: 'bizzmodel',
    sku: 'BA-002',
    name: 'bizzmodel',
    subtitle: '3-Statement Financial Simulator with Dynamic Dials',
    stage: 'fund-ability',
    stageCode: 'STAGE 02',
    stageDisplayName: 'fund-ability',
    description: 'Macro-free financial forecasting engine linking Income Statement, Balance Sheet, and Cash Flow with dynamic sensitivity dials.',
    purpose: 'Equip founders with investor-ready models that withstand Series Seed/A venture due diligence audits.',
    billingModel: 'once-off',
    sellingPriceZAR: 560.0,
    exclusivePriceZAR: 486.96,
    vatZAR: 73.04,
    tokensAllocated: 112.0,
    ticketPriceZAR: 672.0,
    isPurchased: false,
    assignedStep: 'Stage 2 · Step 1',
    journeyMilestone: 'Institutional Model Ready',
    modules: [
      '36-Month 3-Statement Forecast Engine',
      'ARR Multiple & DCF Valuation Bridge',
      'Dynamic Runway Driver Dials',
      'Google Sheets Macro-Free Live Connector',
    ],
    icon: TrendingUp,
  },
  {
    id: 'bizzplan',
    sku: 'BA-003',
    name: 'bizzplan',
    subtitle: 'Executive Memorandums & Investment Pitch Synthesis',
    stage: 'fund-ability',
    stageCode: 'STAGE 02',
    stageDisplayName: 'fund-ability',
    description: 'Structured narrative builder translating quantitative models into institutional executive memorandums and pitch decks.',
    purpose: 'Bridge numbers with story so investors understand market moats and capital allocation efficiency.',
    billingModel: 'once-off',
    sellingPriceZAR: 399.0,
    exclusivePriceZAR: 346.96,
    vatZAR: 52.04,
    tokensAllocated: 80.0,
    ticketPriceZAR: 478.8,
    isPurchased: false,
    assignedStep: 'Stage 2 · Step 7',
    journeyMilestone: 'Investment Synthesis',
    modules: [
      'Venture Memo Generator',
      'Cap Table Snapshot Exporter',
      'Risk Matrix Builder',
      'Socratic Term Sheet Defense Guide',
    ],
    icon: FileText,
  },
  {
    id: 'sustain-runway',
    sku: 'BA-004',
    name: 'sustain-RUNWAY',
    subtitle: 'Working Capital & Operational Runway Safeguards',
    stage: 'sustain-ability',
    stageCode: 'STAGE 03',
    stageDisplayName: 'sustain-ability',
    description: 'Diagnostic tool that tracks overhead-to-revenue ratios and surfaces non-essential expenditures before they drain runway.',
    purpose: 'Extend net cash runway by 35% through operational discipline without slowing customer acquisition.',
    billingModel: 'once-off',
    sellingPriceZAR: 375.0,
    exclusivePriceZAR: 326.09,
    vatZAR: 48.91,
    tokensAllocated: 75.0,
    ticketPriceZAR: 450.0,
    isPurchased: false,
    assignedStep: 'Stage 3 · Step 3',
    journeyMilestone: 'Runway Extension & Cash Preservation',
    modules: [
      'Working Capital Leakage Auditor',
      'Vendor Terms Re-negotiation Assistant',
      'Debtor Lag Cycle Accelerator',
      'Overhead Benchmark Comparison',
    ],
    icon: Sliders,
  },
  {
    id: 'invest-vdr',
    sku: 'BA-005',
    name: 'invest-ABILITY VDR',
    subtitle: '40-Point Due Diligence Virtual Data Room Matrix',
    stage: 'invest-ability',
    stageCode: 'STAGE 04',
    stageDisplayName: 'invest-ability',
    description: 'Structured Virtual Data Room architecture with pre-indexed Google Drive folder structures, cap table waterfalls, and audit checklist.',
    purpose: 'Pass venture audits with zero governance friction and complete transaction closing 3x faster.',
    billingModel: 'once-off',
    sellingPriceZAR: 650.0,
    exclusivePriceZAR: 565.22,
    vatZAR: 84.78,
    tokensAllocated: 130.0,
    ticketPriceZAR: 780.0,
    isPurchased: false,
    assignedStep: 'Stage 4 · Step 1',
    journeyMilestone: 'Due Diligence Audit Readiness',
    modules: [
      '40-Point VDR Folder Hierarchy',
      'Cap Table Multi-Tranche Dilution Simulator',
      'Governance & IP Assignment Verification',
      'Term Sheet Negotiation Rubric',
    ],
    icon: FolderLock,
  },
  {
    id: 'bizzmoney',
    sku: 'BA-006',
    name: 'bizzmoney',
    subtitle: 'Standard Chart of Accounts & Integrated Ledger',
    stage: 'operations',
    stageCode: 'OPERATIONS',
    stageDisplayName: 'operations',
    description: 'Integrated accounting and financial management suite. Features standard double-entry chart of accounts and voice-ready instruction support.',
    purpose: 'Bridge daily business operations and bookkeeping directly into forward-looking financial forecasting.',
    billingModel: 'monthly subscription',
    sellingPriceZAR: 92.0,
    exclusivePriceZAR: 80.0,
    vatZAR: 12.0,
    tokensAllocated: 18.4,
    ticketPriceZAR: 110.4,
    isPurchased: false,
    assignedStep: 'Operations · Daily',
    journeyMilestone: 'Standard Accounting Discipline',
    modules: [
      '62-Account Standard General Ledger',
      'Voice-to-Transaction Input Architecture',
      'Automated 15% VAT Accrual Tracker',
      'Google Sheets Two-Way Ledger Bridge',
    ],
    icon: DollarSign,
  },
  {
    id: 'budget',
    sku: 'BA-007',
    name: 'bizzbudget',
    subtitle: 'Rolling Cash Flow Allocations & Variance Reporting',
    stage: 'operations',
    stageCode: 'OPERATIONS',
    stageDisplayName: 'operations',
    description: 'Zero-based budgeting engine comparing planned vs. actual departmental expenditures on a weekly rolling horizon.',
    purpose: 'Maintain strict capital control and stop cash bleeding before it compromises runway.',
    billingModel: 'monthly subscription',
    sellingPriceZAR: 75.0,
    exclusivePriceZAR: 65.22,
    vatZAR: 9.78,
    tokensAllocated: 15.0,
    ticketPriceZAR: 90.0,
    isPurchased: false,
    assignedStep: 'Operations · Weekly',
    journeyMilestone: 'Zero-Based Expense Control',
    modules: [
      'Rolling 13-Week Cash Horizon Planner',
      'Departmental Variance Drift Alarms',
      'OpEx Spike Early Tripwires',
      'bizzmoney Automated Ledger Reconciliation',
    ],
    icon: BarChart3,
  },
  {
    id: 'bizzoptimizer',
    sku: 'BA-008',
    name: 'bizzoptimizer',
    subtitle: 'Margin Trimmer & Working Capital Optimizer',
    stage: 'operations',
    stageCode: 'OPERATIONS',
    stageDisplayName: 'operations',
    description: 'Algorithmic operational analysis that surfaces margin leaks, renegotiation opportunities, and working capital acceleration levers.',
    purpose: 'Empower founders to trim fat and optimize net profit contribution per operational department.',
    billingModel: 'monthly subscription',
    sellingPriceZAR: 110.0,
    exclusivePriceZAR: 95.65,
    vatZAR: 14.35,
    tokensAllocated: 22.0,
    ticketPriceZAR: 132.0,
    isPurchased: false,
    assignedStep: 'Operations · Monthly',
    journeyMilestone: 'Operational Margin Trimming',
    modules: [
      'Vendor Subscription & SaaS Leak Detector',
      'Debtor Collection Acceleration Levers',
      'Departmental Contribution Margin Calibration',
      'Non-Dilutive Cash Conservation Advice',
    ],
    icon: Zap,
  },
  {
    id: 'growth-strategy',
    sku: 'BA-009',
    name: 'growth-STRATEGY',
    subtitle: 'Simulated Market Pivots & Competitive Moats',
    stage: 'growth',
    stageCode: 'GROWTH',
    stageDisplayName: 'growth',
    description: 'Advanced growth simulator for entrepreneurs graduating from startup stages. Test strategic moves against market shifts and capital constraints.',
    purpose: 'Develop high-conviction corporate strategy and sustainable competitive moats without expensive trial-and-error.',
    billingModel: 'once-off',
    sellingPriceZAR: 350.0,
    exclusivePriceZAR: 304.35,
    vatZAR: 45.65,
    tokensAllocated: 70.0,
    ticketPriceZAR: 420.0,
    isPurchased: false,
    assignedStep: 'Growth · Scale',
    journeyMilestone: 'Sustainable Moat Building',
    modules: [
      'Channel Economics Modeler (CAC vs Payback)',
      'Pricing Elasticity & Margin Sensitivity Curve',
      'Competitive Moat Heatmap & Defense Rubric',
      'GIM Socratic Strategy Scenario Simulator',
    ],
    icon: Workflow,
  },
  {
    id: 'personal-sandbox',
    sku: 'SANDBOX',
    name: 'personal-SANDBOX',
    subtitle: 'Custom Assembled Entrepreneurial Workbench',
    stage: 'personal-sandbox',
    stageCode: 'SANDBOX',
    stageDisplayName: 'personal-sandbox',
    description: 'Your private digital workbench. Handpick and assemble financial engines, budgeting apps, and video masterclasses into a personalized cockpit.',
    purpose: 'Provide a centralized, distraction-free environment where all your business tools, data runs, and models are linked.',
    billingModel: 'once-off',
    sellingPriceZAR: 185.0,
    exclusivePriceZAR: 160.87,
    vatZAR: 24.13,
    tokensAllocated: 37.0,
    ticketPriceZAR: 222.0,
    isPurchased: false,
    assignedStep: 'Cockpit · Workbench',
    journeyMilestone: 'Continuous Simulation Hub',
    modules: [
      'Modular Workspace Layout Customization',
      'Cross-Tool Metric Linking (bizzmoney to bizzmodel)',
      'Quick Links Bar Pinning Hub',
      'Automatic Cloud Vault Syncing',
    ],
    icon: ShieldCheck,
  },
];

export const PlatformApps: React.FC<PlatformAppsProps> = ({
  theme = 'light',
  cmsProducts = [],
  userPurchases = [],
  userProfile,
  tokenBalance = 250,
  initialAppId,
  onSelectSolutionById,
  onNavigateToStage,
  onBuySolution,
  onBackToWorkstation,
  onBackToAdmin,
  onLaunchApp,
}) => {
  const isDark = theme === 'dark';

  // Merge catalog with CMS products to reflect live dynamic pricing & purchase states
  const apps = useMemo(() => {
    return PLATFORM_APPS_CATALOG.map((baseApp) => {
      const cmsMatch = cmsProducts.find(
        (p) =>
          p.id === baseApp.id ||
          (baseApp.id === 'budget' && p.id === 'bizzbudget') ||
          (baseApp.id === 'bizzbudget' && p.id === 'budget')
      );

      const isOwned = Boolean(
        userPurchases &&
          (userPurchases.includes(baseApp.id) ||
            (baseApp.id === 'budget' && userPurchases.includes('bizzbudget')) ||
            (baseApp.id === 'bizzbudget' && userPurchases.includes('budget')))
      );

      if (cmsMatch) {
        return {
          ...baseApp,
          name: cmsMatch.name || baseApp.name,
          subtitle: cmsMatch.subtitle || baseApp.subtitle,
          description: cmsMatch.description || baseApp.description,
          purpose: cmsMatch.purpose || baseApp.purpose,
          sellingPriceZAR: cmsMatch.sellingPriceZAR ?? baseApp.sellingPriceZAR,
          exclusivePriceZAR: cmsMatch.exclusivePriceZAR ?? baseApp.exclusivePriceZAR,
          vatZAR: cmsMatch.vatZAR ?? baseApp.vatZAR,
          tokensAllocated: cmsMatch.tokensAllocated ?? baseApp.tokensAllocated,
          ticketPriceZAR: cmsMatch.ticketPriceZAR ?? baseApp.ticketPriceZAR,
          isPurchased: isOwned,
          modules: cmsMatch.modules && cmsMatch.modules.length > 0 ? cmsMatch.modules : baseApp.modules,
        };
      }
      return {
        ...baseApp,
        isPurchased: isOwned,
      };
    });
  }, [cmsProducts, userPurchases]);

  // Selected App for interactive testing/runner mode
  const [selectedAppId, setSelectedAppId] = useState<string | null>(initialAppId || null);
  // View mode: 'catalog' matrix vs 'runner' interactive simulator
  const [viewMode, setViewMode] = useState<'catalog' | 'runner'>(initialAppId ? 'runner' : 'catalog');
  // Stage Filter
  const [stageFilter, setStageFilter] = useState<string>('all');
  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Currently active app in runner mode
  const currentApp = useMemo(() => {
    if (!selectedAppId) return apps[0];
    return apps.find((a) => a.id === selectedAppId) || apps[0];
  }, [apps, selectedAppId]);

  // Filtered Apps
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      if (stageFilter !== 'all' && app.stage !== stageFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = app.name.toLowerCase().includes(q);
        const matchesSku = app.sku.toLowerCase().includes(q);
        const matchesSub = app.subtitle.toLowerCase().includes(q);
        const matchesDesc = app.description.toLowerCase().includes(q);
        const matchesModule = app.modules.some((m) => m.toLowerCase().includes(q));
        if (!matchesName && !matchesSku && !matchesSub && !matchesDesc && !matchesModule) {
          return false;
        }
      }
      return true;
    });
  }, [apps, stageFilter, searchQuery]);

  // ---------------------------------------------------------------------------
  // INTERACTIVE SIMULATOR RUNNER STATES (FOR OPERABILITY TESTING)
  // ---------------------------------------------------------------------------
  // 1. bizzcalc states
  const [calcOverheadRate, setCalcOverheadRate] = useState<number>(45);
  const [calcLaborRate, setCalcLaborRate] = useState<number>(65);
  const [calcMaterialsCost, setCalcMaterialsCost] = useState<number>(85);
  const [calcFixedOpex, setCalcFixedOpex] = useState<number>(25000);
  const [calcTargetVolume, setCalcTargetVolume] = useState<number>(250);

  // bizzcalc outputs
  const calcTotalDirectCost = calcMaterialsCost + calcLaborRate;
  const calcOverheadPerUnit = calcTargetVolume > 0 ? Math.round(calcFixedOpex / calcTargetVolume) : 0;
  const calcBreakEvenPrice = calcTotalDirectCost + calcOverheadPerUnit;
  const calcTargetPrice = Math.round(calcBreakEvenPrice * 1.35); // 35% margin floor
  const calcContributionMargin = calcTargetPrice > 0 ? Math.round(((calcTargetPrice - calcTotalDirectCost) / calcTargetPrice) * 100) : 0;

  // 2. bizzmodel states
  const [modRevenue, setModRevenue] = useState<number>(30000);
  const [modOpEx, setModOpEx] = useState<number>(45000);
  const [modGrossMargin, setModGrossMargin] = useState<number>(70);
  const [modCashReserves, setModCashReserves] = useState<number>(180000);

  // bizzmodel outputs
  const modGrossProfit = (modRevenue * modGrossMargin) / 100;
  const modNetBurn = Math.max(0, modOpEx - modGrossProfit);
  const modRunwayMonths = modNetBurn > 0 ? (modCashReserves / modNetBurn).toFixed(1) : 'Infinite (>36)';
  const modValuation = modRevenue * 12 * 6; // 6x ARR

  // 3. bizzplan states
  const [planProblem, setPlanProblem] = useState<string>(
    'Founders lack institutional financial modeling, causing 70% of venture applications to fail investor scrutiny.'
  );
  const [planMoat, setPlanMoat] = useState<string>(
    'Proprietary quantitative dynamic dials linked to real general ledgers and AI coaching.'
  );
  const [planAsk, setPlanAsk] = useState<number>(500000);
  const [planValuationCap, setPlanValuationCap] = useState<number>(4500000);

  // 4. sustain-runway states
  const [susDebtorDays, setSusDebtorDays] = useState<number>(48);
  const [susCreditorDays, setSusCreditorDays] = useState<number>(28);
  const [susDiscretionary, setSusDiscretionary] = useState<number>(12500);
  const susTrappedCash = Math.round((modRevenue / 30) * Math.max(0, susDebtorDays - susCreditorDays));
  const susRunwayAddedMonths = ((susDiscretionary * 0.40 * 12) / (modNetBurn || 10000)).toFixed(1);

  // 5. invest-vdr states
  const [vdrChecked, setVdrChecked] = useState<{ [key: string]: boolean }>({
    'vdr-1': true,
    'vdr-2': true,
    'vdr-3': false,
    'vdr-4': true,
    'vdr-5': false,
    'vdr-6': false,
  });
  const vdrItems = [
    { id: 'vdr-1', cat: 'Corporate', label: 'Certificate of Incorporation & Bylaws' },
    { id: 'vdr-2', cat: 'Capitalization', label: 'Detailed Cap Table with Fully Diluted Waterfall' },
    { id: 'vdr-3', cat: 'Financials', label: 'Audited 3-Statement Historicals & 36-Month Model' },
    { id: 'vdr-4', cat: 'IP / Tech', label: 'Proprietary IP Assignment Agreements (Founders & Team)' },
    { id: 'vdr-5', cat: 'Commercial', label: 'Customer Cohort CAC : LTV Verification & Contracts' },
    { id: 'vdr-6', cat: 'Compliance', label: 'Tax Clearances & Corporate Governance Minutes' },
  ];
  const vdrCompletedCount = Object.values(vdrChecked).filter(Boolean).length;
  const vdrAuditPct = Math.round((vdrCompletedCount / vdrItems.length) * 100);

  // 6. bizzmoney states
  const [voiceSimActive, setVoiceSimActive] = useState<boolean>(false);
  const [bmClient, setBmClient] = useState<string>('Apex Global Logistics');
  const [bmAmount, setBmAmount] = useState<number>(4500);
  const [bmAccount, setBmAccount] = useState<string>('4000 REVENUE');
  const [bmStatus, setBmStatus] = useState<string>('idle');
  const [recentEntries, setRecentEntries] = useState<
    Array<{ client: string; amount: number; account: string; vat: number; date: string }>
  >([
    { client: 'Zenith Retail Corp', amount: 12500, account: '4000 REVENUE', vat: 1875, date: 'Today, 09:15' },
    { client: 'Cloud Cluster Hosting', amount: 3200, account: '6000 OPEX', vat: 480, date: 'Yesterday, 14:30' },
  ]);

  // 7. bizzbudget states
  const [bgtSalesMktg, setBgtSalesMktg] = useState<number>(18000);
  const [bgtEngineering, setBgtEngineering] = useState<number>(24000);
  const [bgtGa, setBgtGa] = useState<number>(8500);
  const bgtTotalBudget = bgtSalesMktg + bgtEngineering + bgtGa;
  const bgtActualSpent = Math.round(bgtTotalBudget * 1.08); // 8% drift
  const bgtVariance = bgtActualSpent - bgtTotalBudget;

  // 8. bizzoptimizer states
  const [optSaasSpend, setOptSaasSpend] = useState<number>(6800);
  const [optVendorSpend, setOptVendorSpend] = useState<number>(14500);
  const [optTrimPct, setOptTrimPct] = useState<number>(18);
  const optMonthlySavings = Math.round(((optSaasSpend + optVendorSpend) * optTrimPct) / 100);
  const optAnnualSavings = optMonthlySavings * 12;

  // 9. growth-strategy states
  const [stratChannel, setStratChannel] = useState<'direct' | 'partner' | 'inbound'>('direct');
  const [stratElasticity, setStratElasticity] = useState<number>(1.2);
  const [stratMoatScore, setStratMoatScore] = useState<number>(82);

  // Helper to handle purchasing an app
  const handlePurchaseApp = (app: PlatformAppDefinition) => {
    if (onBuySolution) {
      const bizzSol = BIZZ_SOLUTIONS.find((s) => s.id === app.id) || {
        id: app.id,
        name: app.name,
        category: (app.stage === 'operations' ? 'operations' : app.stage === 'growth' ? 'growth' : 'startup') as any,
        stage: app.stage,
        priceUSD: Math.round(app.sellingPriceZAR / 18.5),
        priceZAR: app.sellingPriceZAR,
        vatRate: 0.15,
        tokensAllocated: app.tokensAllocated,
        billingModel: app.billingModel,
        imageUrl: '',
        isPurchased: app.isPurchased,
        description: app.description,
        subtitle: app.subtitle,
        purpose: app.purpose,
        stageCode: app.sku,
        features: app.modules,
      };
      onBuySolution(bizzSol);
    }
  };

  // Helper to jump to stage in workstation
  const handleLinkToStage = (app: PlatformAppDefinition) => {
    if (onNavigateToStage) {
      onNavigateToStage(app.stage, app.id);
    } else if (onSelectSolutionById) {
      onSelectSolutionById(app.id);
    }
  };

  // Launch app into full presenter (or inline runner if no handler)
  const handleLaunchAppRunner = (appId: string, forceInline = false) => {
    const targetApp = apps.find((a) => a.id === appId);
    if (targetApp && !targetApp.isPurchased && onBuySolution) {
      handlePurchaseApp(targetApp);
      return;
    }
    if (onLaunchApp && !forceInline) {
      onLaunchApp(appId);
    } else {
      setSelectedAppId(appId);
      setViewMode('runner');
    }
  };

  return (
    <div
      className={`min-h-full flex flex-col transition-colors ${
        isDark ? 'bg-[#0A0D14] text-[#E2E8F0]' : 'bg-[#FAF8F5] text-slate-800'
      }`}
    >
      {/* ===================================================================== */}
      {/* TOP HEADER: PLATFORM APPS SUITE (V2 STYLING)                         */}
      {/* ===================================================================== */}
      <header
        className={`px-4 sm:px-6 py-4 border-b shrink-0 flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#5584B4]/20 border border-[#5584B4]/40 text-[#5584B4]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#5584B4] uppercase tracking-wider">
                BIZZBEAN PLATFORM
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                V2 APPS SUITE
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight uppercase text-slate-900 dark:text-white">
              The Platform Applications & Interactive Sandbox Suite
            </h1>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle: Catalog vs Interactive Runner */}
          <div
            className={`p-1 rounded-xl flex items-center border ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#F4EFE6] border-[#D8CEBC]'
            }`}
          >
            <button
              onClick={() => setViewMode('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all lowercase ${
                viewMode === 'catalog'
                  ? isDark
                    ? 'bg-[#1E2548] text-white shadow-xs'
                    : 'bg-[#12172A] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              catalog grid ({apps.length})
            </button>
            <button
              onClick={() => setViewMode('runner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all lowercase flex items-center gap-1.5 ${
                viewMode === 'runner'
                  ? isDark
                    ? 'bg-[#1E2548] text-white shadow-xs'
                    : 'bg-[#12172A] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Play className="h-3 w-3 text-[#5584B4]" />
              <span>operability tester</span>
            </button>
          </div>

          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              title="Return to Administration Centre"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-colors border ${
                isDark
                  ? 'bg-[#161C30] hover:bg-[#1E2548] text-slate-200 border-[#252E4A]'
                  : 'bg-white hover:bg-[#F4EFE6] text-slate-700 border-[#D8CEBC]'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#5584B4]" />
              <span className="hidden sm:inline">Admin Centre</span>
            </button>
          )}

          {onBackToWorkstation && (
            <button
              onClick={onBackToWorkstation}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#5584B4] hover:bg-[#4773A0] text-white shadow-xs transition-colors"
            >
              <span>Back to Workstation</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* ===================================================================== */}
      {/* SUB-BAR: STAGE FILTERS & SEARCH                                       */}
      {/* ===================================================================== */}
      <div
        className={`px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#0E1322] border-[#1D2644]' : 'bg-[#F4EFE6] border-[#D8CEBC]'
        }`}
      >
        {/* Stage Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {[
            { id: 'all', label: 'all apps', count: apps.length },
            { id: 'vi-ability', label: 'stage 01 · vi-ability', count: apps.filter((a) => a.stage === 'vi-ability').length },
            { id: 'fund-ability', label: 'stage 02 · fund-ability', count: apps.filter((a) => a.stage === 'fund-ability').length },
            { id: 'sustain-ability', label: 'stage 03 · sustain-ability', count: apps.filter((a) => a.stage === 'sustain-ability').length },
            { id: 'invest-ability', label: 'stage 04 · invest-ability', count: apps.filter((a) => a.stage === 'invest-ability').length },
            { id: 'operations', label: 'operations', count: apps.filter((a) => a.stage === 'operations').length },
            { id: 'growth', label: 'growth', count: apps.filter((a) => a.stage === 'growth').length },
          ].map((item) => {
            const isSelected = stageFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setStageFilter(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all whitespace-nowrap lowercase border ${
                  isSelected
                    ? isDark
                      ? 'bg-[#1E2548] text-[#DDEBF7] border-[#5584B4] shadow-xs'
                      : 'bg-[#12172A] text-white border-[#12172A] shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white bg-[#13182B] border-transparent'
                    : 'text-slate-600 hover:text-slate-900 bg-white border-[#D8CEBC]'
                }`}
              >
                <span>{item.label}</span>
                <span className="ml-1.5 opacity-60 text-[10px]">({item.count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:min-w-[240px]">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apps, SKUs, modules..."
            className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-[#5584B4] ${
              isDark
                ? 'bg-[#13182B] border-[#252E4A] text-white placeholder-slate-500'
                : 'bg-white border-[#D8CEBC] text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MAIN VIEW AREA                                                        */}
      {/* ===================================================================== */}
      <div className="flex-grow p-4 sm:p-6 overflow-y-auto">
        {viewMode === 'catalog' ? (
          /* ================================================================= */
          /* 1. CATALOG GRID VIEW                                              */
          /* ================================================================= */
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Top Overview Banner */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#5584B4] uppercase tracking-wider">
                    V1 ARCHITECTURE TRANSFERRED TO V2
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#DDEBF7] text-[#24496B] dark:bg-[#1E3048] dark:text-[#DDEBF7] font-semibold">
                    100% OPERATIONAL
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white uppercase">
                  Institutional Venture Acceleration & Operational Application Cockpit
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
                  Every platform application is coupled with its respective venture stage. You can launch interactive sandboxes for real-time testing, purchase licenses with transparent ZAR/token pricing, or jump directly into the stage workspace.
                </p>
              </div>

              {/* Founder Token Balance Card */}
              <div
                className={`p-3.5 rounded-xl border shrink-0 text-right ${
                  isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Founder Token Vault
                </div>
                <div className="font-mono text-lg font-bold text-amber-500 tabular-nums">
                  {tokenBalance} Tokens
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  20% V1 discount active
                </div>
              </div>
            </div>

            {/* Apps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredApps.map((app) => {
                const Icon = app.icon || Calculator;
                return (
                  <div
                    key={app.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between transition-all hover:shadow-md ${
                      isDark
                        ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]'
                        : 'bg-white border-[#D8CEBC] hover:border-[#5584B4] shadow-xs'
                    }`}
                  >
                    {/* Top Row: SKU, Stage Badge & Purchase Status */}
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#222F4C] gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#0E1322] text-slate-700 dark:text-slate-300 border border-[#D8CEBC] dark:border-[#252E4A]">
                            {app.sku}
                          </span>
                          <span className="font-mono text-[10px] uppercase font-bold text-[#5584B4]">
                            {app.stageCode}
                          </span>
                        </div>

                        {app.isPurchased ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold lowercase">
                            <Check className="h-3 w-3" />
                            <span>active / purchased</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold lowercase">
                            R{app.sellingPriceZAR.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Title & Subtitle */}
                      <div className="mt-3.5 space-y-1">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-[#5584B4]/10 dark:bg-[#5584B4]/20 text-[#5584B4] border border-[#5584B4]/30 shrink-0">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-mono text-base font-bold text-slate-900 dark:text-white lowercase tracking-tight">
                              {app.name.toLowerCase()}
                            </h3>
                            <div className="text-[11px] font-mono text-[#5584B4] lowercase">
                              {app.assignedStep}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                          {app.subtitle}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1 line-clamp-2">
                          {app.description}
                        </p>
                      </div>

                      {/* Integrated Modules List */}
                      <div className="mt-4 pt-3 border-t border-[#E8E2D8] dark:border-[#222F4C] space-y-1.5">
                        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          Standard Integrated Modules:
                        </div>
                        <ul className="space-y-1 text-xs font-mono text-slate-600 dark:text-slate-300">
                          {app.modules.slice(0, 3).map((mod, idx) => (
                            <li key={idx} className="flex items-center gap-1.5 text-[11px]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#5584B4] shrink-0" />
                              <span className="truncate">{mod}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-5 pt-3 border-t border-[#E8E2D8] dark:border-[#222F4C] space-y-2">
                      {/* Price & Token Breakdown */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>{app.billingModel === 'monthly subscription' ? 'Monthly Sub' : 'Once-off License'}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {app.tokensAllocated} Tokens
                        </span>
                      </div>

                      {/* Interactive Actions Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Use / Test Operability */}
                        <button
                          onClick={() => handleLaunchAppRunner(app.id)}
                          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-mono font-bold bg-[#12172A] hover:bg-[#1E2548] text-white dark:bg-[#1E2548] dark:hover:bg-[#2B3566] transition-colors lowercase"
                          title="Test operability in sandbox"
                        >
                          <Play className="h-3 w-3 text-[#5584B4]" />
                          <span>use / test</span>
                        </button>

                        {/* Link to Stage for Purchase and Use */}
                        <button
                          onClick={() => handleLinkToStage(app)}
                          className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl text-xs font-mono font-bold bg-[#FAF8F5] dark:bg-[#0E1322] hover:bg-[#F4EFE6] dark:hover:bg-[#182038] border border-[#D8CEBC] dark:border-[#252E4A] text-slate-800 dark:text-slate-200 transition-colors lowercase"
                          title={`Link to ${app.stageDisplayName} stage`}
                        >
                          <span>link to stage</span>
                          <ArrowRight className="h-3 w-3 text-[#5584B4]" />
                        </button>
                      </div>

                      {/* Purchase Action (if not purchased) */}
                      {!app.isPurchased && (
                        <button
                          onClick={() => handlePurchaseApp(app)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-mono font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-colors lowercase"
                        >
                          <ShoppingCart className="h-3 w-3" />
                          <span>purchase for {app.stageDisplayName} (R{app.sellingPriceZAR.toFixed(2)})</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        ) : (
          /* ================================================================= */
          /* 2. OPERABILITY TESTER / RUNNER MODE                               */
          /* ================================================================= */
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Top Selector Bar: Switch between apps while in runner */}
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="text-[11px] font-mono text-slate-400 uppercase font-bold shrink-0 ml-1">
                  APP RUNNER:
                </span>
                {apps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all lowercase shrink-0 border ${
                      currentApp.id === app.id
                        ? isDark
                          ? 'bg-[#1E2548] text-white border-[#5584B4] shadow-xs'
                          : 'bg-[#12172A] text-white border-[#12172A] shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-white bg-[#0E1322] border-transparent'
                        : 'text-slate-600 hover:text-slate-900 bg-[#FAF8F5] border-[#D8CEBC]'
                    }`}
                  >
                    <span>{app.name.toLowerCase()}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setViewMode('catalog')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0 lowercase"
              >
                <X className="h-3.5 w-3.5" />
                <span>close runner</span>
              </button>
            </div>

            {/* Currently Active App Header Card */}
            <div
              className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-[#5584B4]/20 border border-[#5584B4]/40 text-[#5584B4]">
                  {React.createElement(currentApp.icon || Calculator, { className: 'h-6 w-6' })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400 uppercase">
                      {currentApp.sku}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#5584B4] uppercase">
                      {currentApp.stageCode} · {currentApp.stageDisplayName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 lowercase">
                      live operability mode
                    </span>
                  </div>
                  <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white lowercase tracking-tight">
                    {currentApp.name.toLowerCase()}
                  </h2>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentApp.subtitle}
                  </div>
                </div>
              </div>

              {/* Stage Linking & Purchase Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {onLaunchApp && (
                  <button
                    onClick={() => onLaunchApp(currentApp.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-[#12172A] dark:bg-[#1E2548] hover:bg-[#1E2548] text-white shadow-xs transition-colors lowercase"
                    title="Launch full presenter in Work Area"
                  >
                    <Layers className="h-3.5 w-3.5 text-[#84CC16]" />
                    <span>Launch Full Presenter</span>
                  </button>
                )}

                <button
                  onClick={() => handleLinkToStage(currentApp)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-[#FAF8F5] dark:bg-[#0E1322] hover:bg-[#F4EFE6] dark:hover:bg-[#182038] border border-[#D8CEBC] dark:border-[#252E4A] text-slate-800 dark:text-slate-200 transition-colors lowercase"
                >
                  <span>Link to {currentApp.stageDisplayName} Stage</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#5584B4]" />
                </button>

                {!currentApp.isPurchased && (
                  <button
                    onClick={() => handlePurchaseApp(currentApp)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-colors lowercase"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Purchase (R{currentApp.sellingPriceZAR.toFixed(2)})</span>
                  </button>
                )}
              </div>
            </div>

            {/* =============================================================== */}
            {/* INTERACTIVE OPERABLE ENGINE BY CURRENT APP ID                  */}
            {/* =============================================================== */}
            
            {/* APP 1: bizzcalc (Cost Recovery, Break-Even & Contribution Margin Simulator) */}
            {currentApp.id === 'bizzcalc' && (
              <div className="space-y-5">
                {/* Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">Break-Even Price Floor</div>
                    <div className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                      R{calcBreakEvenPrice.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">100% cost recovery</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">Target Commercial Price</div>
                    <div className="font-mono text-xl font-bold text-[#5584B4] mt-1 tabular-nums">
                      R{calcTargetPrice.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">35% sustainable markup</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">Contribution Margin</div>
                    <div className="font-mono text-xl font-bold text-emerald-500 mt-1 tabular-nums">
                      {calcContributionMargin}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">benchmark &ge; 30%</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">Overhead Absorbed</div>
                    <div className="font-mono text-xl font-bold text-amber-500 mt-1 tabular-nums">
                      R{calcOverheadPerUnit.toFixed(2)} / unit
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">at {calcTargetVolume} units volume</div>
                  </div>
                </div>

                {/* Dynamic Dials / Sliders */}
                <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                    <span>DYNAMIC PRODUCTION & OVERHEAD DIALS</span>
                    <span className="text-[11px] text-[#5584B4] lowercase">real-time math recalculation</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">Raw Materials Cost / Unit:</span>
                        <span className="text-slate-900 dark:text-white font-bold">R{calcMaterialsCost}</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="500"
                        step="5"
                        value={calcMaterialsCost}
                        onChange={(e) => setCalcMaterialsCost(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">Direct Labor Rate / Unit:</span>
                        <span className="text-slate-900 dark:text-white font-bold">R{calcLaborRate}</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="300"
                        step="5"
                        value={calcLaborRate}
                        onChange={(e) => setCalcLaborRate(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">Fixed Monthly Expenditures:</span>
                        <span className="text-slate-900 dark:text-white font-bold">R{calcFixedOpex.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="5000"
                        max="150000"
                        step="5000"
                        value={calcFixedOpex}
                        onChange={(e) => setCalcFixedOpex(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">Monthly Target Unit Volume:</span>
                        <span className="text-slate-900 dark:text-white font-bold">{calcTargetVolume} units</span>
                      </div>
                      <input
                        type="range"
                        min="25"
                        max="2000"
                        step="25"
                        value={calcTargetVolume}
                        onChange={(e) => setCalcTargetVolume(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APP 2: bizzmodel (3-Statement Financial Simulator) */}
            {currentApp.id === 'bizzmodel' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">NET CASH RUNWAY</div>
                    <div className="font-mono text-2xl font-bold text-emerald-500 mt-1 tabular-nums">
                      {modRunwayMonths} {typeof modRunwayMonths === 'number' ? 'mo' : ''}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">threshold: audited</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">MONTHLY NET BURN</div>
                    <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                      ${modNetBurn.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">opex minus gross profit</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">VALUATION (6X ARR)</div>
                    <div className="font-mono text-2xl font-bold text-[#5584B4] mt-1 tabular-nums">
                      ${modValuation.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">pre-money valuation baseline</div>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    3-STATEMENT OPERATIONAL DRIVER DIALS
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">Monthly Revenue:</span>
                        <span className="font-bold text-slate-900 dark:text-white">${modRevenue.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="5000"
                        max="200000"
                        step="5000"
                        value={modRevenue}
                        onChange={(e) => setModRevenue(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">Monthly OpEx:</span>
                        <span className="font-bold text-slate-900 dark:text-white">${modOpEx.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="10000"
                        max="200000"
                        step="5000"
                        value={modOpEx}
                        onChange={(e) => setModOpEx(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">Gross Margin %:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{modGrossMargin}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="90"
                        step="5"
                        value={modGrossMargin}
                        onChange={(e) => setModGrossMargin(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">Cash Reserves:</span>
                        <span className="font-bold text-slate-900 dark:text-white">${modCashReserves.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="20000"
                        max="800000"
                        step="10000"
                        value={modCashReserves}
                        onChange={(e) => setModCashReserves(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APP 3: bizzplan (Executive Memorandums & Investment Pitch Synthesis) */}
            {currentApp.id === 'bizzplan' && (
              <div className="space-y-5">
                <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    EXECUTIVE MEMORANDUM & PITCH SYNTHESIS BUILDER
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                        Core Problem Hypothesis & Market Pain
                      </label>
                      <textarea
                        value={planProblem}
                        onChange={(e) => setPlanProblem(e.target.value)}
                        rows={2}
                        className={`w-full p-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-[#5584B4] ${
                          isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                        Defensible Competitive Moat & Unit Economics
                      </label>
                      <textarea
                        value={planMoat}
                        onChange={(e) => setPlanMoat(e.target.value)}
                        rows={2}
                        className={`w-full p-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-[#5584B4] ${
                          isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                          Capital Requirement Ask (USD)
                        </label>
                        <input
                          type="number"
                          value={planAsk}
                          onChange={(e) => setPlanAsk(Number(e.target.value))}
                          className={`w-full p-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-[#5584B4] ${
                            isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                          Post-Money Valuation Cap (USD)
                        </label>
                        <input
                          type="number"
                          value={planValuationCap}
                          onChange={(e) => setPlanValuationCap(Number(e.target.value))}
                          className={`w-full p-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-[#5584B4] ${
                            isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Generated Executive Summary Card */}
                  <div className={`p-4 rounded-xl border mt-3 ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
                    <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
                      <span className="font-mono text-xs font-bold text-[#5584B4] uppercase">
                        INSTITUTIONAL MEMO PREVIEW
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Dilution: {((planAsk / planValuationCap) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-mono text-slate-600 dark:text-slate-300 space-y-1">
                      <div><strong className="text-slate-900 dark:text-white">Enterprise:</strong> {userProfile?.companyName || 'Apex Cloud Dynamics'}</div>
                      <div><strong className="text-slate-900 dark:text-white">Problem:</strong> {planProblem}</div>
                      <div><strong className="text-slate-900 dark:text-white">Moat:</strong> {planMoat}</div>
                      <div><strong className="text-slate-900 dark:text-white">Ask:</strong> ${planAsk.toLocaleString()} on ${planValuationCap.toLocaleString()} Cap</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APP 4: sustain-runway (Working Capital & Runway Safeguards) */}
            {currentApp.id === 'sustain-runway' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">Cash Trapped in Receivables</div>
                    <div className="font-mono text-2xl font-bold text-amber-500 mt-1 tabular-nums">
                      ${susTrappedCash.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">debtor lag cycle: {susDebtorDays} days</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">Non-Dilutive Runway Gained</div>
                    <div className="font-mono text-2xl font-bold text-emerald-500 mt-1 tabular-nums">
                      +{susRunwayAddedMonths} Months
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">by trimming discretionary spend</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">Working Capital Gap</div>
                    <div className="font-mono text-2xl font-bold text-[#5584B4] mt-1 tabular-nums">
                      {susDebtorDays - susCreditorDays} Days
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">target gap &le; 15 days</div>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    WORKING CAPITAL LEVERS & EXPENSE CONTROLS
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">Customer Payment Delay (Debtor Days):</span>
                        <span className="font-bold text-slate-900 dark:text-white">{susDebtorDays} Days</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="90"
                        step="1"
                        value={susDebtorDays}
                        onChange={(e) => setSusDebtorDays(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">Vendor Payment Terms (Creditor Days):</span>
                        <span className="font-bold text-slate-900 dark:text-white">{susCreditorDays} Days</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="60"
                        step="1"
                        value={susCreditorDays}
                        onChange={(e) => setSusCreditorDays(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">Discretionary Monthly Expenditures:</span>
                        <span className="font-bold text-slate-900 dark:text-white">${susDiscretionary.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="2000"
                        max="50000"
                        step="500"
                        value={susDiscretionary}
                        onChange={(e) => setSusDiscretionary(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APP 5: invest-vdr (40-Point Due Diligence Virtual Data Room Matrix) */}
            {currentApp.id === 'invest-vdr' && (
              <div className="space-y-5">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block">
                      VIRTUAL DATA ROOM AUDIT READINESS SCORE
                    </span>
                    <span className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                      {vdrCompletedCount} of {vdrItems.length} Checklist Pillars Verified ({vdrAuditPct}%)
                    </span>
                  </div>
                  <div className="h-10 w-24 bg-slate-200 dark:bg-[#0E1322] rounded-lg overflow-hidden border border-[#D8CEBC] dark:border-[#252E4A] p-1 flex items-center">
                    <div
                      className="h-full bg-emerald-500 rounded transition-all duration-300"
                      style={{ width: `${vdrAuditPct}%` }}
                    />
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    INSTITUTIONAL DUE DILIGENCE AUDIT CHECKLIST
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {vdrItems.map((item) => {
                      const isChecked = !!vdrChecked[item.id];
                      return (
                        <button
                          key={item.id}
                          onClick={() => setVdrChecked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                          className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all font-mono text-xs ${
                            isChecked
                              ? isDark
                                ? 'bg-[#1E2548] border-[#5584B4] text-white'
                                : 'bg-[#FAF8F5] border-[#5584B4] text-slate-900'
                              : isDark
                              ? 'bg-[#0E1322] border-[#252E4A] text-slate-400'
                              : 'bg-white border-[#D8CEBC] text-slate-600'
                          }`}
                        >
                          <div className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center shrink-0 border ${
                            isChecked ? 'bg-[#5584B4] text-white border-[#5584B4]' : 'border-slate-400'
                          }`}>
                            {isChecked && <Check className="h-3 w-3" />}
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#5584B4]">{item.cat}</div>
                            <div className="leading-snug">{item.label}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* APP 6: bizzmoney (Standard Chart of Accounts & Integrated Ledger) */}
            {currentApp.id === 'bizzmoney' && (
              <div className="space-y-5">
                <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                  <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#252E4A]">
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase">
                        62-ACCOUNT GENERAL LEDGER & TRANSACTION RECORDER
                      </div>
                      <div className="text-xs text-slate-400">
                        Two-way sync with bizzmodel and automated 15% VAT accruals
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setVoiceSimActive(true);
                        setTimeout(() => {
                          setBmClient('Alpha Edge Technologies');
                          setBmAmount(6200);
                          setBmAccount('4000 REVENUE');
                          setVoiceSimActive(false);
                        }, 1800);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                        voiceSimActive
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-[#5584B4]/20 hover:bg-[#5584B4]/30 text-[#5584B4] border border-[#5584B4]/40'
                      }`}
                    >
                      <Mic className="h-3.5 w-3.5" />
                      <span>{voiceSimActive ? 'Listening to Instruction...' : 'Voice Instruction'}</span>
                    </button>
                  </div>

                  {/* Transaction Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-500">Account Bucket</label>
                      <select
                        value={bmAccount}
                        onChange={(e) => setBmAccount(e.target.value)}
                        className={`w-full mt-1 px-3 py-2 border rounded-lg text-xs font-mono ${
                          isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                        }`}
                      >
                        <option value="1000 ASSETS">1000 ASSETS</option>
                        <option value="2000 LIABILITIES">2000 LIABILITIES</option>
                        <option value="4000 REVENUE">4000 REVENUE</option>
                        <option value="6000 OPEX">6000 OPEX</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-500">Client / Vendor Name</label>
                      <input
                        type="text"
                        value={bmClient}
                        onChange={(e) => setBmClient(e.target.value)}
                        className={`w-full mt-1 px-3 py-2 border rounded-lg text-xs font-mono ${
                          isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-500">Amount (ZAR)</label>
                      <input
                        type="number"
                        value={bmAmount}
                        onChange={(e) => setBmAmount(Number(e.target.value))}
                        className={`w-full mt-1 px-3 py-2 border rounded-lg text-xs font-mono ${
                          isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          const vat = Math.round(bmAmount * 0.15 * 100) / 100;
                          setRecentEntries((prev) => [
                            { client: bmClient, amount: bmAmount, account: bmAccount, vat, date: 'Just now' },
                            ...prev,
                          ]);
                          setBmStatus('posted');
                          setTimeout(() => setBmStatus('idle'), 2500);
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-lg transition-colors lowercase"
                      >
                        {bmStatus === 'posted' ? 'posted to ledger!' : 'post transaction'}
                      </button>
                    </div>
                  </div>

                  {/* Ledger Account Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono">
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
                      <div className="text-slate-400 text-[10px]">1000 ASSETS</div>
                      <div className="text-slate-900 dark:text-white font-bold mt-0.5">R180,000</div>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
                      <div className="text-slate-400 text-[10px]">2000 LIABILITIES</div>
                      <div className="text-slate-900 dark:text-white font-bold mt-0.5">R14,500</div>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
                      <div className="text-slate-400 text-[10px]">4000 REVENUE</div>
                      <div className="text-emerald-500 font-bold mt-0.5">R30,000 / mo</div>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
                      <div className="text-slate-400 text-[10px]">6000 OPEX</div>
                      <div className="text-amber-500 font-bold mt-0.5">R42,000 / mo</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APP 7: bizzbudget (Rolling Cash Flow Allocations & Variance Reporting) */}
            {currentApp.id === 'budget' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">Planned Departmental Budget</div>
                    <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                      R{bgtTotalBudget.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">zero-base monthly baseline</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">Actual Monthly Spend</div>
                    <div className="font-mono text-2xl font-bold text-amber-500 mt-1 tabular-nums">
                      R{bgtActualSpent.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">derived from bizzmoney journals</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">Variance Drift Deviation</div>
                    <div className="font-mono text-2xl font-bold text-rose-500 mt-1 tabular-nums">
                      +R{bgtVariance.toLocaleString()} (+8%)
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">tripwire alert: spending overage</div>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    DEPARTMENTAL ALLOCATION DRIFT CONTROLS
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">Sales & Marketing:</span>
                        <span className="font-bold text-slate-900 dark:text-white">R{bgtSalesMktg.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="5000"
                        max="80000"
                        step="2500"
                        value={bgtSalesMktg}
                        onChange={(e) => setBgtSalesMktg(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">Engineering & Tech:</span>
                        <span className="font-bold text-slate-900 dark:text-white">R{bgtEngineering.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="5000"
                        max="100000"
                        step="2500"
                        value={bgtEngineering}
                        onChange={(e) => setBgtEngineering(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">General & Admin (G&A):</span>
                        <span className="font-bold text-slate-900 dark:text-white">R{bgtGa.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="2000"
                        max="50000"
                        step="1000"
                        value={bgtGa}
                        onChange={(e) => setBgtGa(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APP 8: bizzoptimizer (Margin Trimmer & Working Capital Optimizer) */}
            {currentApp.id === 'bizzoptimizer' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">Monthly Trim Identified</div>
                    <div className="font-mono text-2xl font-bold text-emerald-500 mt-1 tabular-nums">
                      R{optMonthlySavings.toLocaleString()} / mo
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">direct margin contribution</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">Annualized Capital Conserved</div>
                    <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                      R{optAnnualSavings.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">non-dilutive runway extension</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">Optimization Target</div>
                    <div className="font-mono text-2xl font-bold text-[#5584B4] mt-1 tabular-nums">
                      {optTrimPct}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">without cutting headcount</div>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    OPERATIONAL EXPENSE OPTIMIZATION DIALS
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">Software & SaaS Spend:</span>
                        <span className="font-bold text-slate-900 dark:text-white">R{optSaasSpend.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="1000"
                        max="30000"
                        step="500"
                        value={optSaasSpend}
                        onChange={(e) => setOptSaasSpend(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">Vendor Retainers:</span>
                        <span className="font-bold text-slate-900 dark:text-white">R{optVendorSpend.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="2000"
                        max="50000"
                        step="500"
                        value={optVendorSpend}
                        onChange={(e) => setOptVendorSpend(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-600 dark:text-slate-300">Target Efficiency %:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{optTrimPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="35"
                        step="1"
                        value={optTrimPct}
                        onChange={(e) => setOptTrimPct(Number(e.target.value))}
                        className="w-full accent-[#5584B4]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APP 9: growth-strategy (Simulated Market Pivots & Competitive Moats) */}
            {currentApp.id === 'growth-strategy' && (
              <div className="space-y-5">
                <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    GROWTH CHANNEL ECONOMICS & MOAT HEATMAP
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setStratChannel('direct')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        stratChannel === 'direct'
                          ? isDark
                            ? 'bg-[#1E2548] border-[#5584B4] text-white'
                            : 'bg-[#FAF8F5] border-[#5584B4] text-slate-900'
                          : isDark
                          ? 'bg-[#0E1322] border-[#252E4A] text-slate-400'
                          : 'bg-white border-[#D8CEBC] text-slate-600'
                      }`}
                    >
                      <div className="font-mono text-xs font-bold uppercase">Direct Enterprise Sales</div>
                      <div className="text-[11px] text-slate-400 mt-1">CAC: $1,800 · Payback: 5.2 Mo</div>
                    </button>

                    <button
                      onClick={() => setStratChannel('partner')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        stratChannel === 'partner'
                          ? isDark
                            ? 'bg-[#1E2548] border-[#5584B4] text-white'
                            : 'bg-[#FAF8F5] border-[#5584B4] text-slate-900'
                          : isDark
                          ? 'bg-[#0E1322] border-[#252E4A] text-slate-400'
                          : 'bg-white border-[#D8CEBC] text-slate-600'
                      }`}
                    >
                      <div className="font-mono text-xs font-bold uppercase">Partner Ecosystem</div>
                      <div className="text-[11px] text-slate-400 mt-1">CAC: $750 · Payback: 2.8 Mo</div>
                    </button>

                    <button
                      onClick={() => setStratChannel('inbound')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        stratChannel === 'inbound'
                          ? isDark
                            ? 'bg-[#1E2548] border-[#5584B4] text-white'
                            : 'bg-[#FAF8F5] border-[#5584B4] text-slate-900'
                          : isDark
                          ? 'bg-[#0E1322] border-[#252E4A] text-slate-400'
                          : 'bg-white border-[#D8CEBC] text-slate-600'
                      }`}
                    >
                      <div className="font-mono text-xs font-bold uppercase">Inbound Product-Led</div>
                      <div className="text-[11px] text-slate-400 mt-1">CAC: $320 · Payback: 1.4 Mo</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* APP 10: personal-sandbox (Custom Assembled Workbench) */}
            {currentApp.id === 'personal-sandbox' && (
              <div className="space-y-5">
                <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    PERSONAL COCKPIT & WORKBENCH ASSEMBLER
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    The personal sandbox connects all financial model runs, daily objectives, and pinboard tools into an unobstructed workspace.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
                      <div className="font-mono text-xs font-bold text-[#5584B4] uppercase">Live Model Runs</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        Apex_Cloud_Dynamics_3Statement_v2.gsheet synced with Google Workspace
                      </div>
                    </div>
                    <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
                      <div className="font-mono text-xs font-bold text-emerald-500 uppercase">Cloud Library Status</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        All modules backed up to IndexedDB and Google Drive VDR
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};
