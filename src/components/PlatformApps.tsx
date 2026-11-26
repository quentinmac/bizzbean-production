import React, { useMemo } from 'react';
import {
  Layers,
  ShieldCheck,
  Calculator,
  TrendingUp,
  DollarSign,
  ArrowRight,
  ShoppingCart,
  Play,
  BarChart3,
  FileText,
  Zap,
  CheckCircle2,
  Sliders,
  FolderLock,
  Workflow,
  ChevronRight,
} from 'lucide-react';
import { CmsProduct, INITIAL_CMS_PRODUCTS } from '../data/cmsConsoleData';
import { BizzSolution, UserBusinessProfile } from '../types';
import {
  computeTicketPriceFromCms,
  findCmsProductForProfile,
} from './publicSite/publicSiteData';

export interface PlatformAppsProps {
  theme?: 'light' | 'dark';
  isAdmin?: boolean;
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
    id: 'rolling-forecast',
    sku: 'BA-OPT',
    name: 'bizzoptimizer',
    subtitle: 'YTD Actuals, 60-Month Forecast, What-If & Actions to Improve',
    stage: 'operations',
    stageCode: 'STAGE 05',
    stageDisplayName: 'operations',
    description: 'Stand-alone performance optimizer combining YTD management accounts actuals, 60-month rolling forecast, What-If sensitivity, Return on Sales & Asset Turn objectives, and departmental Actions to Improve.',
    purpose: 'Measure Return on Sales and Asset Turn on YTD results, set desired objectives, and assign improvement actions across Performance Leaders.',
    billingModel: 'once-off',
    sellingPriceZAR: 480.0,
    exclusivePriceZAR: 417.39,
    vatZAR: 62.61,
    tokensAllocated: 96.0,
    ticketPriceZAR: 576.0,
    isPurchased: false,
    assignedStep: 'Stage 5 · Step 1',
    journeyMilestone: 'Rolling Operations Control',
    modules: [
      'Modified UNIT SALES Model-Set (1 Product)',
      'Cost-as-%-of-Revenue Dynamic Sliders',
      'Prior Year-End Balance Sheet Inputs',
      'Dynamic Base Rate Adjustment Controls',
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

interface PlatformAppCardSpec {
  id: string;
  launchId: string;
  matchIds: string[];
  name: string;
  defaultStageLabel: string;
  defaultTagline: string;
  defaultSummary: string;
  defaultTicketPriceZAR: number;
}

const CORE_PLATFORM_APPS: PlatformAppCardSpec[] = [
  {
    id: 'bizzcalc',
    launchId: 'bizzcalc',
    matchIds: ['bizzcalc'],
    name: 'bizzcalc',
    defaultStageLabel: 'vi-ABILITY',
    defaultTagline: '7-Step Startup Financial Viability Simulator',
    defaultSummary:
      'Validate whether a startup idea can recover its overheads, survive slow ramp-up months, and generate sustainable founder earnings in seven clear steps.',
    defaultTicketPriceZAR: 299,
  },
  {
    id: 'bizzdynamics',
    launchId: 'bizzdynamics',
    matchIds: ['bizzdynamics'],
    name: 'bizzdynamics',
    defaultStageLabel: 'sustain-ABILITY',
    defaultTagline: 'Business Economics & Cash-Flow Dynamics Simulator',
    defaultSummary:
      'Visualize how pricing, volume, cost structure, inventory days, and debtor collections interact across your trading cycle before making strategic changes.',
    defaultTicketPriceZAR: 418.8,
  },
  {
    id: 'bizzmodel',
    launchId: 'bizzmodel',
    matchIds: ['bizzmodel'],
    name: 'bizzmodel',
    defaultStageLabel: 'fund-ABILITY',
    defaultTagline: 'Integrated 5-Year 3-Statement Financial Modelling',
    defaultSummary:
      'Build lender-ready 60-month Trading Accounts, Income Statements, Balance Sheets, and Cash Flow forecasts across trading, manufacturing, hospitality, and service model-sets.',
    defaultTicketPriceZAR: 1499,
  },
  {
    id: 'bizzoptimizer',
    launchId: 'rolling-forecast',
    matchIds: ['rolling-forecast', 'bizzoptimizer'],
    name: 'bizzoptimizer',
    defaultStageLabel: 'sustain-ABILITY',
    defaultTagline: 'YTD Forecasting, What-If Simulation & Actions to Improve',
    defaultSummary:
      'Turn monthly management accounts into a 60-month rolling forecast, simulate Return on Net Operating Assets (RONOA) improvements, and track departmental action plans.',
    defaultTicketPriceZAR: 414,
  },
  {
    id: 'bizzforecasta',
    launchId: 'bizzforecasta',
    matchIds: ['bizzforecasta'],
    name: 'bizzforecasta',
    defaultStageLabel: 'sustain-ABILITY',
    defaultTagline: 'Rolling 60-Month Forecast & Cash-Flow Modeler',
    defaultSummary:
      'Project multi-year revenue, cost structures, working capital timing, and cash runway quickly to support monthly board and management forecasting.',
    defaultTicketPriceZAR: 441.6,
  },
];

function formatStageLabel(stage?: string, fallback?: string): string {
  switch ((stage || '').toLowerCase()) {
    case 'vi-ability':
      return 'vi-ABILITY';
    case 'fund-ability':
      return 'fund-ABILITY';
    case 'sustain-ability':
      return 'sustain-ABILITY';
    case 'invest-ability':
      return 'invest-ABILITY';
    case 'personal-sandbox':
      return 'Personal Sandbox';
    default:
      return fallback || 'Platform App';
  }
}

export const PlatformApps: React.FC<PlatformAppsProps> = ({
  theme = 'light',
  isAdmin = false,
  cmsProducts = [],
  userPurchases = [],
  onSelectSolutionById,
  onBuySolution,
  onBackToWorkstation,
  onBackToAdmin,
  onLaunchApp,
}) => {
  const isDark = theme === 'dark';

  const effectiveCmsCatalog = useMemo(
    () => (cmsProducts && cmsProducts.length > 0 ? cmsProducts : INITIAL_CMS_PRODUCTS),
    [cmsProducts]
  );

  const normalizedPurchases = useMemo(
    () => new Set((userPurchases || []).map((id) => String(id || '').toLowerCase().trim())),
    [userPurchases]
  );

  const appCards = useMemo(() => {
    return CORE_PLATFORM_APPS.map((spec) => {
      const cms = findCmsProductForProfile(spec.id, spec.name, effectiveCmsCatalog);
      const pricing = computeTicketPriceFromCms(cms, spec.defaultTicketPriceZAR, true);

      const candidateKeys = [
        ...spec.matchIds,
        spec.name.toLowerCase(),
        ...(cms ? [cms.id.toLowerCase(), (cms.name || '').toLowerCase().trim()] : []),
      ];

      const isOwned =
        isAdmin ||
        pricing.ticketPriceZAR <= 0 ||
        candidateKeys.some((key) => normalizedPurchases.has(key));

      const stageLabel = formatStageLabel(cms?.stage, spec.defaultStageLabel);
      const tagline =
        cms?.subtitle && cms.subtitle.trim().length > 0 ? cms.subtitle : spec.defaultTagline;
      const summary =
        cms?.description && cms.description.trim().length > 0
          ? cms.description
          : spec.defaultSummary;

      return {
        spec,
        cms,
        pricing,
        isOwned,
        stageLabel,
        tagline,
        summary,
      };
    });
  }, [effectiveCmsCatalog, isAdmin, normalizedPurchases]);

  const handleLaunch = (launchId: string) => {
    if (onLaunchApp) {
      onLaunchApp(launchId);
    } else if (onSelectSolutionById) {
      onSelectSolutionById(launchId);
    }
  };

  const handleBuy = (card: (typeof appCards)[number]) => {
    if (!onBuySolution) return;
    const { spec, cms, pricing } = card;
    const solId = cms?.id || spec.launchId;
    const stageStr = (cms?.stage || '').toLowerCase();
    const category: BizzSolution['category'] =
      stageStr === 'operations' || stageStr === 'operations-sandbox'
        ? 'operations'
        : stageStr === 'growth'
        ? 'growth'
        : 'startup';
    const solution: BizzSolution = {
      id: solId,
      name: cms?.name || spec.name,
      subtitle: card.tagline,
      category,
      stage: cms?.stage || spec.defaultStageLabel,
      priceUSD: Math.round((pricing.sellingPriceZAR / 18) * 100) / 100,
      priceZAR: pricing.sellingPriceZAR,
      vatRate: 0.15,
      tokensAllocated: pricing.tokensAllocated,
      billingModel: cms?.billingModel || 'once-off',
      isPurchased: false,
      description: card.summary,
      purpose: cms?.purpose || card.tagline,
      features: cms?.modules || [],
    };
    onBuySolution(solution);
  };

  return (
    <div
      className={`h-full w-full overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 ${
        isDark ? 'bg-[#0A0D14] text-slate-100' : 'bg-[#FAF8F5] text-[#12172A]'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Clean Header Bar */}
        <div
          className={`flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b ${
            isDark ? 'border-[#222B45]' : 'border-[#E6DFD2]'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                isDark
                  ? 'bg-[#111626] border-[#242E49] text-[#7EB2E2]'
                  : 'bg-white border-[#E0D7C8] text-[#2E5E88]'
              }`}
            >
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373]">
                bizzbean Platform Apps
              </p>
              <h1
                className={`text-2xl sm:text-3xl font-bold tracking-tight mt-0.5 ${
                  isDark ? 'text-white' : 'text-[#12172A]'
                }`}
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Interactive Financial Applications
              </h1>
              <p
                className={`text-xs sm:text-sm mt-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Launch your licensed platform apps directly or purchase access with inclusive VAT &amp; bizz-tokens.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isAdmin && onBackToAdmin && (
              <button
                type="button"
                onClick={onBackToAdmin}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                  isDark
                    ? 'bg-[#111626] border-[#242E49] text-slate-200 hover:border-[#7EB2E2]'
                    : 'bg-white border-[#E0D7C8] text-slate-800 hover:border-[#2E5E88]'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-[#2E5E88] dark:text-[#7EB2E2]" />
                <span>Admin Centre</span>
              </button>
            )}
            {onBackToWorkstation && (
              <button
                type="button"
                onClick={onBackToWorkstation}
                className="px-4 py-2 rounded-lg bg-[#2E5E88] hover:bg-[#234C70] text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Back to Workstation</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Platform Apps Card Grid — Matching Top-Tier Website Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appCards.map((card) => {
            const { spec, pricing, isOwned, stageLabel, tagline, summary } = card;
            return (
              <article
                key={spec.id}
                className={`rounded-xl border p-6 flex flex-col justify-between transition-colors ${
                  isDark
                    ? 'border-[#242E49] bg-[#111626] hover:border-[#7EB2E2]/70'
                    : 'border-[#E6DFD2] bg-white hover:border-[#2E5E88]/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span>SOFTWARE · {stageLabel}</span>
                    <span
                      className={`font-semibold tabular-nums ${
                        isDark ? 'text-white' : 'text-[#12172A]'
                      }`}
                      title="Ticket price (incl. VAT & bizz-tokens)"
                    >
                      {pricing.label}
                    </span>
                  </div>

                  <h2
                    className={`text-xl font-bold mt-3 ${
                      isDark ? 'text-white' : 'text-[#12172A]'
                    }`}
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {spec.name}
                  </h2>

                  <p className="text-xs font-medium text-[#2E5E88] dark:text-[#7EB2E2] mt-1">
                    {tagline}
                  </p>

                  <p
                    className={`text-sm mt-3 leading-relaxed ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {summary}
                  </p>
                </div>

                <div
                  className={`mt-6 pt-4 border-t flex items-center justify-between gap-3 ${
                    isDark ? 'border-[#222B45]' : 'border-[#EDE7DC]'
                  }`}
                >
                  {isOwned ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Access active</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleLaunch(spec.launchId)}
                        className="px-3.5 py-2 rounded-lg bg-[#2E5E88] hover:bg-[#234C70] text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" />
                        <span>Access App</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        incl. VAT &amp; {pricing.tokensAllocated} tokens
                      </span>
                      <button
                        type="button"
                        onClick={() => handleBuy(card)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                          isDark
                            ? 'bg-[#2E5E88] hover:bg-[#3A72A3] text-white'
                            : 'bg-[#12172A] hover:bg-[#2E5E88] text-white'
                        }`}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>Buy · {pricing.label}</span>
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};
