import heroDeskImage from '../../assets/images/public_hero_desk_1795685240349.jpg';
import modelingSuiteImage from '../../assets/images/public_modeling_suite_1795685242726.jpg';
import founderStrategyImage from '../../assets/images/public_founder_strategy_1795685244811.jpg';
import sandboxLibraryImage from '../../assets/images/public_sandbox_library_1795685245375.jpg';
import { normalizePathname } from '../../shared/seoRoutes';

export const PUBLIC_SITE_IMAGES = {
  heroDesk: heroDeskImage,
  modelingSuite: modelingSuiteImage,
  founderStrategy: founderStrategyImage,
  sandboxLibrary: sandboxLibraryImage,
};

export interface PublicStageDefinition {
  id: 'vi-ability' | 'fund-ability' | 'sustain-ability' | 'invest-ability' | 'personal-sandbox';
  number: string;
  label: string;
  path: string;
  /** Exact user-approved stage phrasing */
  statement: string;
  summary: string;
  outcomes: string[];
  featuredSolutionIds: string[];
  isCoreStage: boolean;
}

export const PUBLIC_STAGES: PublicStageDefinition[] = [
  {
    id: 'vi-ability',
    number: '01',
    label: 'vi-ABILITY',
    path: '/vi-ability',
    statement: 'you have a business idea, and you want to start a business',
    summary:
      'Test pricing, unit margins, operating overheads, and break-even sales before committing savings or signing a lease.',
    outcomes: [
      'Confirm whether your product pricing covers direct costs and fixed overheads',
      'Pinpoint the exact monthly sales volume needed to reach cash break-even',
      'Understand what banks and investors expect before you apply for capital',
    ],
    featuredSolutionIds: ['learn-earn-capital', 'bizzcalc', 'how-to-bizzcalc'],
    isCoreStage: true,
  },
  {
    id: 'fund-ability',
    number: '02',
    label: 'fund-ABILITY',
    path: '/fund-ability',
    statement: 'you have a business and you need funding to grow',
    summary:
      'Build integrated 5-year 3-statement financial models and structured business plans built to survive bank and lender scrutiny.',
    outcomes: [
      'Produce linked Income Statement, Balance Sheet, and 60-month Cash Flow reports',
      'Model debt serviceability, working capital cycles, and funding drawdown timing',
      'Link live financial projections directly into an executive business plan',
    ],
    featuredSolutionIds: [
      'bizzmodel',
      'cost-recovery-calculator',
      'follow-the-money',
      'financial-reports',
      'your-first-hire',
    ],
    isCoreStage: true,
  },
  {
    id: 'sustain-ability',
    number: '03',
    label: 'sustain-ABILITY',
    path: '/sustain-ability',
    statement: 'you want to professionalize your business',
    summary:
      'Turn monthly management accounts into a rolling forecast, measure Return on Assets, and assign accountable departmental actions.',
    outcomes: [
      'Forecast year-end performance from YTD management accounts and trading seasonality',
      'Run What-If sensitivity checks across price, margin, expenses, and working capital days',
      'Track departmental Actions to Improve with owners, target dates, and status',
    ],
    featuredSolutionIds: [
      'bizzoptimizer',
      'bizzdynamics',
      'profit-optimizer',
      'financial-scenario-planning',
      'annual-business-planning-cycle',
    ],
    isCoreStage: true,
  },
  {
    id: 'invest-ability',
    number: '04',
    label: 'invest-ABILITY',
    path: '/invest-ability',
    statement: 'you need an investor to grow your business',
    summary:
      'Prepare transparent historical performance, multi-year growth scenarios, and clean governance documentation for external equity partners.',
    outcomes: [
      'Present audited-style historical baselines alongside defensible 5-year projections',
      'Demonstrate capital efficiency through Return on Net Operating Assets and cash conversion',
      'Organize due diligence readiness, financial narratives, and valuation drivers in one place',
    ],
    featuredSolutionIds: ['bizzmodel', 'bizzoptimizer', 'financial-reports'],
    isCoreStage: true,
  },
  {
    id: 'personal-sandbox',
    number: '05',
    label: 'Personal Sandbox',
    path: '/personal-sandbox',
    statement: 'quick everyday calculators for pricing, recipes, costing, and cash decisions',
    summary:
      'A practical 12-in-1 toolkit of focused business calculators for Bill of Materials (BOM) costing, break-even checks, and margin math.',
    outcomes: [
      'Calculate accurate product and recipe costs from raw materials and labour',
      'Test markup vs gross margin percentages without spreadsheet formula errors',
      'Evaluate loan repayments, debtor cycles, and everyday business arithmetic',
    ],
    featuredSolutionIds: ['bizzcalculators', 'bizzcalc'],
    isCoreStage: false,
  },
];

export interface PublicSolutionProfile {
  id: string;
  name: string;
  path: string;
  kind: 'software' | 'course';
  stageId: PublicStageDefinition['id'];
  stageLabel: string;
  tagline: string;
  heroSummary: string;
  problemSolved: string;
  howItWorks: string[];
  deliverables: string[];
  idealFor: string;
  defaultPriceZAR: number;
  billingNote: string;
  image: string;
  faqs: Array<{ q: string; a: string }>;
}

export const PUBLIC_SOLUTION_PROFILES: PublicSolutionProfile[] = [
  {
    id: 'bizzmodel',
    name: 'bizzmodel',
    path: '/bizzmodel',
    kind: 'software',
    stageId: 'fund-ability',
    stageLabel: 'fund-ABILITY',
    tagline: 'Integrated 5-Year 3-Statement Financial Modelling',
    heroSummary:
      'Build lender-ready 60-month Trading Accounts, Income Statements, Balance Sheets, and Cash Flow forecasts across trading, manufacturing, hospitality, and service model-sets—complete with the integrated bizzplan business plan.',
    problemSolved:
      'Spreadsheets break the moment a banker asks what happens if sales ramp two months later or raw material costs rise by 5%. bizzmodel links every assumption through double-entry financial logic so your balance sheet always balances.',
    howItWorks: [
      'Select your business model-set (Trading — Unit, Value, Commission, or Revenue Share — Manufacturing, Hospitality, or Services).',
      'Capture products, margins, staffing, capital expenditure, overheads, working capital days, and funding mix in guided steps.',
      'Generate 60-month monthly and 5-year annual financial statements, ratio diagnostics, and an integrated lender-ready bizzplan automatically.',
    ],
    deliverables: [
      'Linked 60-Month Trading Account, Income Statement, Balance Sheet & Cash Flow',
      'Integrated bizzplan lender-ready business plan synced live to your financials',
      'Multi-industry revenue calculators with product categories and margin controls',
      'Debt serviceability, working capital days, and break-even coverage ratios',
      'Executive presentation reports ready for bank credit committees and investors',
    ],
    idealFor: 'Founders preparing funding applications, financial advisors, and growing SMEs.',
    defaultPriceZAR: 1499,
    billingNote: 'Ticket price · incl. VAT & tokens',
    image: modelingSuiteImage,
    faqs: [
      {
        q: 'Do I need to be a chartered accountant to use bizzmodel?',
        a: 'No. bizzmodel walks you through plain-English business inputs—products, prices, staff, rent, equipment, and payment terms—and handles all 3-statement accounting rules behind the scenes.',
      },
      {
        q: 'Which business types are supported?',
        a: 'bizzmodel supports Trading (Unit Sales, Value Sales, Commission, and Revenue Share), Manufacturing & BOM, Hospitality, and Service businesses.',
      },
      {
        q: 'Can I test bizzmodel inside bizz-DESK before committing?',
        a: 'Yes. Open bizz-DESK directly from this page to explore the interface, watch walkthroughs, and review sample outputs.',
      },
    ],
  },
  {
    id: 'bizzoptimizer',
    name: 'bizzoptimizer',
    path: '/bizzoptimizer',
    kind: 'software',
    stageId: 'sustain-ability',
    stageLabel: 'sustain-ABILITY',
    tagline: 'YTD Forecasting, What-If Simulation & Actions to Improve',
    heroSummary:
      'Turn monthly management accounts into a 60-month rolling forecast, simulate Return on Net Operating Assets (RONOA) improvements, and track departmental action plans.',
    problemSolved:
      'Most operating businesses review management accounts in the rear-view mirror without connecting margin leaks, debtor days, and overhead creep into concrete management actions.',
    howItWorks: [
      'Enter year-to-date management account actuals and trading seasonality distribution to project full-year results.',
      'Use the What-If Sensitivity Engine to test how small improvements in pricing, cost of sales, expenses, and working capital lift RONOA and cash.',
      'Assign specific Actions to Improve across operational leaders with target dates and live progress tracking.',
    ],
    deliverables: [
      'YTD Actuals to Full-Year Forecast & 60-Month Rolling Horizon',
      'DuPont-style Return on Sales × Asset Turn = RONOA Cockpit',
      'Interactive What-If Sensitivity Sliders across 8 operational value drivers',
      'Departmental Actions to Improve register with ownership and deadlines',
    ],
    idealFor: 'Operating business owners, managing directors, and management accountants.',
    defaultPriceZAR: 414,
    billingNote: 'Ticket price · incl. VAT & tokens',
    image: heroDeskImage,
    faqs: [
      {
        q: 'How is bizzoptimizer different from bizzmodel?',
        a: 'bizzmodel builds a detailed bottom-up 5-year forecast from scratch. bizzoptimizer starts from your actual year-to-date management accounts to diagnose performance gaps and run live What-If profit and cash simulations.',
      },
      {
        q: 'What is RONOA and why does bizzoptimizer focus on it?',
        a: 'Return on Net Operating Assets combines your profit margin (Return on Sales) with how efficiently your assets generate revenue (Asset Turn), giving owners a single clear measure of operational health.',
      },
    ],
  },
  {
    id: 'bizzcalc',
    name: 'bizzcalc',
    path: '/bizzcalc',
    kind: 'software',
    stageId: 'vi-ability',
    stageLabel: 'vi-ABILITY',
    tagline: '7-Step Startup Financial Viability Simulator',
    heroSummary:
      'Validate whether a startup idea can recover its overheads, survive slow ramp-up months, and generate sustainable founder earnings in seven clear steps.',
    problemSolved:
      'New founders often discover too late that their pricing or expected footfall cannot cover rent, salaries, and inventory replenishment. bizzcalc exposes viability gaps in minutes on desktop or mobile.',
    howItWorks: [
      'Define your operating calendar, working days, and core product or service offering.',
      'Set unit selling prices, direct input costs, staffing headcount, and monthly fixed overheads.',
      'Review instant break-even volume, contribution margin, cash runway, and viability verdict.',
    ],
    deliverables: [
      '7-Step guided startup viability workflow (mobile & desktop friendly)',
      'Instant break-even sales volume and margin recovery diagnostics',
      'Contribution margin and overhead coverage charts',
      'Side-by-side scenario stress testing before committing capital',
    ],
    idealFor: 'First-time founders, side-hustle builders, and enterprise incubators.',
    defaultPriceZAR: 299,
    billingNote: 'Ticket price · incl. VAT & tokens',
    image: founderStrategyImage,
    faqs: [
      {
        q: 'Can I use bizzcalc on my phone?',
        a: 'Yes. Both bizzcalc and bizzcalculators are built for responsive mobile and desktop workflows so you can check viability anywhere.',
      },
      {
        q: 'Is there training included for bizzcalc?',
        a: 'Yes—pair bizzcalc with our How to Use bizzcalc course and free Learn How to Earn Access to Capital course inside bizz-DESK.',
      },
    ],
  },
  {
    id: 'bizzcalculators',
    name: 'bizzcalculators',
    path: '/bizzcalculators',
    kind: 'software',
    stageId: 'personal-sandbox',
    stageLabel: 'Personal Sandbox',
    tagline: '12-in-1 Business & Bill of Materials (BOM) Pricing Suite',
    heroSummary:
      'Accurate Bill of Materials (BOM) costing, recipe and manufacturing unit costs, markup-to-margin conversion, break-even math, and everyday business finance calculators.',
    problemSolved:
      'Confusing markup with gross profit margin or forgetting packaging, wastage, and direct labour inside product costing quietly erodes business profit on every invoice.',
    howItWorks: [
      'Choose from 12 focused calculators covering BOM manufacturing, retail margin, hospitality recipes, service rates, and loan schedules.',
      'Enter raw material quantities, wastage allowances, labour rates, and target margin percentages.',
      'Get exact unit selling prices, cost breakdowns, and break-even thresholds immediately.',
    ],
    deliverables: [
      'Bill of Materials (BOM) multi-component product costing calculator',
      'Markup vs Gross Profit Margin & Discount impact calculators',
      'Break-even, working capital cycle, and loan repayment calculators',
      'Mobile-friendly quick reference for daily quoting and pricing decisions',
    ],
    idealFor: 'Manufacturers, food & hospitality operators, retailers, and service providers.',
    defaultPriceZAR: 299,
    billingNote: 'Ticket price · incl. VAT & tokens',
    image: modelingSuiteImage,
    faqs: [
      {
        q: 'Does bizzcalculators handle recipes and raw material wastage?',
        a: 'Yes. The BOM and recipe costing modules let you enter ingredient units, batch yields, packaging, and direct labour to derive an accurate cost per sold unit.',
      },
    ],
  },
  {
    id: 'bizzdynamics',
    name: 'bizzdynamics',
    path: '/bizzdynamics',
    kind: 'software',
    stageId: 'sustain-ability',
    stageLabel: 'sustain-ABILITY',
    tagline: 'Business Economics & Cash-Flow Dynamics Simulator',
    heroSummary:
      'Visualize how pricing, volume, cost structure, inventory days, and debtor collections interact across your trading cycle before making strategic changes.',
    problemSolved:
      'Growing sales rapidly can actually drain your bank account if debtor days and stock holding periods expand faster than profit margins. bizzdynamics makes those mechanics visible.',
    howItWorks: [
      'Load your baseline revenue, gross margin, overhead ratio, and working capital days.',
      'Adjust individual operational levers to observe real-time shifts in net operating profit and cash balance.',
      'Identify which 2–3 levers produce the highest cash and profit uplift for your business.',
    ],
    deliverables: [
      'Interactive cash-conversion cycle & profitability simulator',
      'Sensitivity diagnostics across volume, price, cost, and working capital',
      'Visual executive dashboards for board and management workshops',
    ],
    idealFor: 'Growing SMEs, commercial managers, and turnaround advisors.',
    defaultPriceZAR: 418.8,
    billingNote: 'Ticket price · incl. VAT & tokens',
    image: heroDeskImage,
    faqs: [
      {
        q: 'When should I use bizzdynamics?',
        a: 'Use bizzdynamics during strategy reviews or pricing discussions when you need your management team to see how operational choices affect cash flow immediately.',
      },
    ],
  },
  {
    id: 'learn-earn-capital',
    name: 'Learn How to Earn Access to Capital',
    path: '/learn-earn-capital',
    kind: 'course',
    stageId: 'vi-ability',
    stageLabel: 'vi-ABILITY',
    tagline: 'Free Foundational Course for Aspiring & Early-Stage Founders',
    heroSummary:
      'Understand the exact financial proof lenders and investors look for—unit economics, break-even thresholds, and capital discipline—before you pitch or borrow.',
    problemSolved:
      'Most funding applications fail not because the idea is bad, but because the founder cannot prove how capital turns into repeatable profit and cash repayment.',
    howItWorks: [
      'Watch structured, plain-English video lessons inside BizzClass.',
      'Follow real-world examples linking daily business activities to financial outcomes.',
      'Apply the lessons immediately inside bizzcalc or bizzmodel.',
    ],
    deliverables: [
      'Free access with your bizzbean account',
      'Step-by-step video lessons on capital readiness and viability',
      'Practical checklist of what funders evaluate first',
    ],
    idealFor: 'Every founder starting a business or preparing for their first funding conversation.',
    defaultPriceZAR: 0,
    billingNote: 'Free course',
    image: sandboxLibraryImage,
    faqs: [
      {
        q: 'Is this course genuinely free?',
        a: 'Yes. Learn How to Earn Access to Capital is free to access so every entrepreneur can master capital readiness fundamentals first.',
      },
    ],
  },
  {
    id: 'how-to-bizzcalc',
    name: 'How to Use bizzcalc',
    path: '/how-to-bizzcalc',
    kind: 'course',
    stageId: 'vi-ability',
    stageLabel: 'vi-ABILITY',
    tagline: 'Step-by-Step Guided Training on the bizzcalc Viability Simulator',
    heroSummary:
      'Master every step of the bizzcalc 7-step simulator with worked examples covering operating calendars, pricing, overheads, and break-even scenarios.',
    problemSolved:
      'Helps first-time modellers avoid common input mistakes so their viability verdict reflects commercial reality.',
    howItWorks: [
      'Follow short focused walkthrough lessons mapped directly to each bizzcalc step.',
      'Build your own startup scenario alongside the instructor.',
      'Stress-test downside sales and cost assumptions with confidence.',
    ],
    deliverables: [
      'Step-by-step video walkthroughs for all 7 bizzcalc screens',
      'Worked margin and overhead examples',
      'Scenario stress-testing checklist',
    ],
    idealFor: 'Founders and business advisors using bizzcalc.',
    defaultPriceZAR: 0,
    billingNote: 'Included in vi-ABILITY',
    image: sandboxLibraryImage,
    faqs: [],
  },
  {
    id: 'cost-recovery-calculator',
    name: 'Cost Recovery Calculator Course',
    path: '/cost-recovery-calculator',
    kind: 'course',
    stageId: 'fund-ability',
    stageLabel: 'fund-ABILITY',
    tagline: 'Pricing, Overhead Recovery & Break-Even Mastery',
    heroSummary:
      'Learn how to calculate full cost recovery, hourly charge-out rates, and break-even sales so every product and service line pulls its weight.',
    problemSolved:
      'Eliminates under-pricing by connecting fixed overheads, billable capacity, and direct costs into defensible selling prices.',
    howItWorks: [
      'Separate direct variable costs from fixed monthly operating overheads.',
      'Determine realistic productive capacity and recovery rates.',
      'Verify minimum sales targets required for break-even and target profit.',
    ],
    deliverables: [
      'Guided BizzClass video lessons on cost recovery mechanics',
      'Worked break-even and pricing exercises',
      'Companion reference guides',
    ],
    idealFor: 'Service firms, workshops, manufacturers, and growing SMEs.',
    defaultPriceZAR: 360,
    billingNote: 'Ticket price · incl. VAT & tokens',
    image: modelingSuiteImage,
    faqs: [],
  },
  {
    id: 'follow-the-money',
    name: 'Follow the Money',
    path: '/follow-the-money',
    kind: 'course',
    stageId: 'fund-ability',
    stageLabel: 'fund-ABILITY',
    tagline: 'Cash Flow & Working Capital Mechanics for Business Owners',
    heroSummary:
      'Trace how every rand moves through stock, debtors, creditors, profit, and bank cash so you never confuse accounting profit with cash in the bank.',
    problemSolved:
      'Explains why fast-growing, profitable businesses still run out of cash—and exactly how to prevent working capital crunches.',
    howItWorks: [
      'Map the cash conversion cycle across inventory, receivables, and payables.',
      'Trace transactions from the Trading Account through the Balance Sheet to Cash Flow.',
      'Apply working capital safeguards inside your monthly management routine.',
    ],
    deliverables: [
      'Practical video modules on cash flow and working capital',
      'Real trading examples linking profit to bank balance',
      'Actionable debtor, stock, and creditor management habits',
    ],
    idealFor: 'Founders, general managers, and non-financial directors.',
    defaultPriceZAR: 0,
    billingNote: 'Free access',
    image: sandboxLibraryImage,
    faqs: [],
  },
  {
    id: 'financial-reports',
    name: 'Financial Reports',
    path: '/financial-reports',
    kind: 'course',
    stageId: 'fund-ability',
    stageLabel: 'fund-ABILITY',
    tagline: 'Read & Interpret 3-Statement Financials Like a CFO',
    heroSummary:
      'Demystify Income Statements, Balance Sheets, and Cash Flow Statements so you can spot risks early and speak clearly with bankers and investors.',
    problemSolved:
      'Empowers business owners to read their own monthly management accounts rather than filing them unread.',
    howItWorks: [
      'Break down the structure of the Trading Account, Income Statement, Balance Sheet, and Cash Flow.',
      'Learn the essential liquidity, solvency, and profitability ratios lenders review first.',
      'Practice diagnosing real financial warning signs early.',
    ],
    deliverables: [
      'Structured 3-statement interpretation lessons',
      'Key lender ratio reference guide',
      'Monthly management account review routine',
    ],
    idealFor: 'Business owners, aspiring CFOs, and investment-ready founders.',
    defaultPriceZAR: 240,
    billingNote: 'Ticket price · incl. VAT & tokens',
    image: modelingSuiteImage,
    faqs: [],
  },
  {
    id: 'profit-optimizer',
    name: 'Profit Optimizer Course',
    path: '/profit-optimizer',
    kind: 'course',
    stageId: 'sustain-ability',
    stageLabel: 'sustain-ABILITY',
    tagline: 'Margin, Asset Turn & Return on Net Operating Assets Mastery',
    heroSummary:
      'Discover how disciplined 1–2% improvements across pricing, cost of sales, overheads, and working capital compound into substantial Return on Assets gains.',
    problemSolved:
      'Shows management teams where profit leaks actually hide and which levers unlock cash fastest.',
    howItWorks: [
      'Deconstruct RONOA into Return on Sales and Asset Turn.',
      'Audit all 7 business touch-points for margin and efficiency leaks.',
      'Pair directly with bizzoptimizer to track quarterly improvement actions.',
    ],
    deliverables: [
      'Complete RONOA & profit-lever video curriculum',
      'Operational touch-point diagnostic framework',
      'Direct integration with bizzoptimizer workflows',
    ],
    idealFor: 'Established business owners and operational department heads.',
    defaultPriceZAR: 480,
    billingNote: 'Ticket price · incl. VAT & tokens',
    image: founderStrategyImage,
    faqs: [],
  },
  {
    id: 'financial-scenario-planning',
    name: 'Financial Scenario Planning',
    path: '/financial-scenario-planning',
    kind: 'course',
    stageId: 'sustain-ability',
    stageLabel: 'sustain-ABILITY',
    tagline: 'Build Resilient Best-Case, Base-Case & Downside Plans',
    heroSummary:
      'Prepare practical contingency plans by modelling revenue dips, cost inflation, and debtor delays before they hit your bank balance.',
    problemSolved:
      'Replaces crisis reactions with pre-tested downside triggers and cash preservation levers.',
    howItWorks: [
      'Define realistic base, upside, and stress-test assumptions.',
      'Quantify cash runway and covenant headroom under each scenario.',
      'Set clear management triggers for when to execute contingency actions.',
    ],
    deliverables: [
      'Structured scenario-planning methodology',
      'Downside stress-test templates and worked examples',
      'Management trigger and contingency playbook',
    ],
    idealFor: 'Operating SME leaders navigating volatile markets.',
    defaultPriceZAR: 360,
    billingNote: 'Ticket price · incl. VAT & tokens',
    image: heroDeskImage,
    faqs: [],
  },
  {
    id: 'annual-business-planning-cycle',
    name: 'Annual Business Planning Cycle',
    path: '/annual-business-planning-cycle',
    kind: 'course',
    stageId: 'sustain-ability',
    stageLabel: 'sustain-ABILITY',
    tagline: 'Establish a Disciplined Annual Planning & Monthly Review Cadence',
    heroSummary:
      'Connect your preparation checklist, planning workshop, annual budget, operational plan, and monthly review-and-react cadence into one repeatable rhythm.',
    problemSolved:
      'Prevents annual plans from sitting in a drawer by tying budgets directly to monthly actual-vs-plan reviews and accountable owners.',
    howItWorks: [
      'Run the annual preparation checklist and leadership planning workshop.',
      'Translate strategy into an annual budget and departmental operational plans.',
      'Maintain monthly review-and-react checkpoints through year-end sign-off.',
    ],
    deliverables: [
      'End-to-end 12-month management cadence curriculum',
      'Planning workshop and operational plan frameworks',
      'Year-end governance and audit readiness guide',
    ],
    idealFor: 'Owners professionalizing their business management routine.',
    defaultPriceZAR: 480,
    billingNote: 'Ticket price · incl. VAT & tokens',
    image: founderStrategyImage,
    faqs: [],
  },
  {
    id: 'your-first-hire',
    name: 'Your First Hire',
    path: '/your-first-hire',
    kind: 'course',
    stageId: 'fund-ability',
    stageLabel: 'fund-ABILITY',
    tagline: 'Recruitment, Employment Costs & Team Readiness for Growing Founders',
    heroSummary:
      'Plan the true financial cost of hiring your first employee—covering statutory obligations, productivity ramp-up, and break-even sales impact before signing an employment contract.',
    problemSolved:
      'Prevents premature payroll strain by connecting employment costs directly to additional revenue and margin capacity.',
    howItWorks: [
      'Quantify total cost-to-company including statutory contributions and onboarding time.',
      'Calculate the incremental sales needed to fund the role sustainably.',
      'Put clear role expectations, accountability, and review rhythms in place from day one.',
    ],
    deliverables: [
      'Practical hiring readiness and payroll affordability lessons',
      'Total cost-to-company and break-even hiring checks',
      'Onboarding and early performance management checklist',
    ],
    idealFor: 'Growing founders preparing to expand beyond a solo operation.',
    defaultPriceZAR: 360,
    billingNote: 'Ticket price · incl. VAT & tokens',
    image: founderStrategyImage,
    faqs: [],
  },
];

export interface PublicTicketPricing {
  ticketPriceZAR: number;
  sellingPriceZAR: number;
  tokensAllocated: number;
  label: string;
}

export function formatTicketPriceZAR(amount: number): string {
  if (!amount || amount <= 0) return 'Free';
  const roundedInt = Math.round(amount);
  const isWhole = Math.abs(amount - roundedInt) < 0.02;
  const formatted = (isWhole ? roundedInt : amount).toLocaleString('en-ZA', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  });
  return `R ${formatted}`;
}

export function findCmsProductForProfile<
  T extends {
    id: string;
    name?: string;
  }
>(profileId: string, profileName: string, cmsProducts: T[]): T | undefined {
  const idLower = (profileId || '').toLowerCase().trim();
  const nameLower = (profileName || '').toLowerCase().trim();

  const aliasIds = new Set<string>([idLower]);
  if (idLower === 'bizzoptimizer' || idLower === 'rolling-forecast') {
    aliasIds.add('bizzoptimizer');
    aliasIds.add('rolling-forecast');
  }
  if (idLower === 'bizzbudget' || idLower === 'budget') {
    aliasIds.add('bizzbudget');
    aliasIds.add('budget');
  }

  // Prefer exact ID match first
  const byId = (cmsProducts || []).find((p) => aliasIds.has((p.id || '').toLowerCase().trim()));
  if (byId) return byId;

  // Fallback to exact name match
  return (cmsProducts || []).find((p) => (p.name || '').toLowerCase().trim() === nameLower);
}

export function computeTicketPriceFromCms(
  cms:
    | {
        id?: string;
        sellingPriceZAR?: number;
        ticketPriceZAR?: number;
        tokensAllocated?: number;
      }
    | undefined,
  fallbackPriceZAR: number,
  isFallbackAlreadyTicket = true
): PublicTicketPricing {
  if (cms) {
    const selling = typeof cms.sellingPriceZAR === 'number' ? cms.sellingPriceZAR : 0;
    const tokens =
      typeof cms.tokensAllocated === 'number' && cms.tokensAllocated > 0
        ? cms.tokensAllocated
        : selling > 0
        ? Math.round(selling * 0.2 * 100) / 100
        : 0;
    const rawTicket =
      typeof cms.ticketPriceZAR === 'number' && (cms.ticketPriceZAR > 0 || selling === 0)
        ? cms.ticketPriceZAR
        : Math.round((selling + tokens) * 100) / 100;
    const ticketPriceZAR = Math.round(rawTicket * 100) / 100;
    return {
      ticketPriceZAR,
      sellingPriceZAR: selling,
      tokensAllocated: Math.round(tokens),
      label: formatTicketPriceZAR(ticketPriceZAR),
    };
  }

  const ticketPriceZAR = isFallbackAlreadyTicket
    ? fallbackPriceZAR
    : Math.round(fallbackPriceZAR * 1.2 * 100) / 100;
  const sellingPriceZAR = isFallbackAlreadyTicket
    ? Math.round((ticketPriceZAR / 1.2) * 100) / 100
    : fallbackPriceZAR;
  const tokensAllocated = Math.round(Math.max(0, ticketPriceZAR - sellingPriceZAR));

  return {
    ticketPriceZAR,
    sellingPriceZAR,
    tokensAllocated,
    label: formatTicketPriceZAR(ticketPriceZAR),
  };
}

export function resolvePublicTicketPrice(
  profile: PublicSolutionProfile,
  cmsProducts: Array<{
    id: string;
    name?: string;
    seq?: number;
    stage?: string;
    type?: 'app' | 'course';
    sellingPriceZAR?: number;
    ticketPriceZAR?: number;
    tokensAllocated?: number;
    subtitle?: string;
    description?: string;
    purpose?: string;
    activeInSync?: boolean;
    lessonTitles?: string[];
    modules?: string[];
  }>
) {
  const cms = findCmsProductForProfile(profile.id, profile.name, cmsProducts);
  if (profile.id === 'learn-earn-capital' && (!cms || cms.ticketPriceZAR === 0)) {
    return {
      ticketPriceZAR: 0,
      sellingPriceZAR: 0,
      tokensAllocated: 0,
      label: 'Free',
      cms,
    };
  }
  const computed = computeTicketPriceFromCms(cms, profile.defaultPriceZAR, true);
  return { ...computed, cms };
}

const STAGE_ORDER_INDEX: Record<string, number> = {
  'vi-ability': 1,
  'fund-ability': 2,
  'sustain-ability': 3,
  'invest-ability': 4,
  'personal-sandbox': 5,
};

const PUBLIC_STAGE_LABEL_BY_ID: Record<PublicStageDefinition['id'], string> = {
  'vi-ability': 'vi-ABILITY',
  'fund-ability': 'fund-ABILITY',
  'sustain-ability': 'sustain-ABILITY',
  'invest-ability': 'invest-ABILITY',
  'personal-sandbox': 'Personal Sandbox',
};

export interface SequencedPublicSolution extends PublicSolutionProfile {
  effectiveStageId: PublicStageDefinition['id'];
  effectiveStageLabel: string;
  cmsSeq: number;
  hasExplicitStageSeq: boolean;
}

/**
 * Returns public solutions strictly ordered according to the CMS stage-centric
 * Products & Curricula `stage` and `seq` configuration.
 */
export function getSequencedPublicSolutions(
  cmsProducts: Array<{
    id: string;
    name?: string;
    seq?: number;
    stage?: string;
    type?: 'app' | 'course';
    sellingPriceZAR?: number;
    ticketPriceZAR?: number;
    tokensAllocated?: number;
    subtitle?: string;
    description?: string;
    purpose?: string;
    activeInSync?: boolean;
    lessonTitles?: string[];
    modules?: string[];
  }>,
  stageFilter?: PublicStageDefinition['id']
): SequencedPublicSolution[] {
  const matchedCmsIds = new Set<string>();

  const enriched: SequencedPublicSolution[] = PUBLIC_SOLUTION_PROFILES.map((profile, idx) => {
    const cms = findCmsProductForProfile(profile.id, profile.name, cmsProducts);
    if (cms?.id) matchedCmsIds.add(cms.id.toLowerCase().trim());

    const cmsStage = (cms?.stage || '').toLowerCase().trim() as PublicStageDefinition['id'];
    const cmsInPublicStage = cmsStage in STAGE_ORDER_INDEX;
    const effectiveStageId: PublicStageDefinition['id'] = cmsInPublicStage
      ? cmsStage
      : profile.stageId;
    const effectiveStageLabel = PUBLIC_STAGE_LABEL_BY_ID[effectiveStageId] || profile.stageLabel;

    const hasExplicitStageSeq = Boolean(cms && cmsInPublicStage && typeof cms.seq === 'number');
    const cmsSeq = hasExplicitStageSeq
      ? (cms!.seq as number)
      : cms && typeof cms.seq === 'number'
      ? 100 + cms.seq
      : 500 + idx;

    return {
      ...profile,
      stageId: effectiveStageId,
      stageLabel: effectiveStageLabel,
      effectiveStageId,
      effectiveStageLabel,
      cmsSeq,
      hasExplicitStageSeq,
    };
  });

  // Include any active CMS product assigned to a public stage that isn't in the static profile list
  (cmsProducts || []).forEach((cms) => {
    if (cms.activeInSync === false) return;
    const cmsIdLower = (cms.id || '').toLowerCase().trim();
    const cmsNameLower = (cms.name || '').toLowerCase().trim();
    // bizzplan is integrated inside bizzmodel and no longer listed as a standalone app
    if (cmsIdLower === 'bizzplan' || cmsNameLower === 'bizzplan') return;
    if (!cmsIdLower || matchedCmsIds.has(cmsIdLower)) return;

    const cmsStage = (cms.stage || '').toLowerCase().trim() as PublicStageDefinition['id'];
    if (!(cmsStage in STAGE_ORDER_INDEX)) return;

    const stageLabel = PUBLIC_STAGE_LABEL_BY_ID[cmsStage];
    const kind: 'software' | 'course' = cms.type === 'course' ? 'course' : 'software';
    const pricing = computeTicketPriceFromCms(cms, 0, true);

    enriched.push({
      id: cms.id,
      name: cms.name || cms.id,
      path: `/${cmsIdLower}`,
      kind,
      stageId: cmsStage,
      stageLabel,
      tagline: cms.subtitle || (kind === 'software' ? 'Interactive Financial Software' : 'BizzClass Guided Course'),
      heroSummary: cms.description || cms.purpose || '',
      problemSolved: cms.purpose || cms.description || '',
      howItWorks: [],
      deliverables: cms.lessonTitles || cms.modules || [],
      idealFor: 'Entrepreneurs and growing businesses.',
      defaultPriceZAR: pricing.ticketPriceZAR,
      billingNote: pricing.ticketPriceZAR > 0 ? 'Ticket price · incl. VAT & tokens' : 'Free access',
      image: kind === 'software' ? modelingSuiteImage : sandboxLibraryImage,
      faqs: [],
      effectiveStageId: cmsStage,
      effectiveStageLabel: stageLabel,
      cmsSeq: typeof cms.seq === 'number' ? cms.seq : 99,
      hasExplicitStageSeq: typeof cms.seq === 'number',
    });
  });

  const stageScoped = stageFilter
    ? enriched.filter((item) => item.effectiveStageId === stageFilter)
    : enriched;

  return stageScoped.sort((a, b) => {
    const stageDiff =
      (STAGE_ORDER_INDEX[a.effectiveStageId] || 99) -
      (STAGE_ORDER_INDEX[b.effectiveStageId] || 99);
    if (stageDiff !== 0) return stageDiff;
    if (a.cmsSeq !== b.cmsSeq) return a.cmsSeq - b.cmsSeq;
    return a.name.localeCompare(b.name);
  });
}

export type PublicRoute =
  | { kind: 'home' }
  | { kind: 'solutions' }
  | { kind: 'stage'; stageId: PublicStageDefinition['id'] }
  | { kind: 'solution'; solutionId: string }
  | { kind: 'articles' }
  | { kind: 'article-detail'; slug: string }
  | { kind: 'library' }
  | { kind: 'videos' }
  | { kind: 'about' }
  | { kind: 'contact' }
  | { kind: 'policies' };

const STAGE_ID_SET = new Set<string>(PUBLIC_STAGES.map((s) => s.id));
const SOLUTION_BY_PATH = new Map<string, PublicSolutionProfile>(
  PUBLIC_SOLUTION_PROFILES.map((p) => [p.path, p])
);

export function parsePublicRoute(rawPathname: string): PublicRoute {
  const path = normalizePathname(rawPathname);
  if (path === '/' || path === '/home') return { kind: 'home' };
  if (path === '/solutions' || path === '/products' || path === '/apps' || path === '/courses') {
    return { kind: 'solutions' };
  }
  if (path === '/about' || path === '/about-bizzbean') return { kind: 'about' };
  if (path === '/contact' || path === '/talk-to-us') return { kind: 'contact' };
  if (
    path === '/website-footer' ||
    path === '/footer' ||
    path === '/policies' ||
    path === '/privacy-policy' ||
    path === '/terms-of-service'
  ) {
    return { kind: 'policies' };
  }
  if (path === '/library' || path === '/sandbox-library') return { kind: 'library' };
  if (path === '/videos' || path === '/education' || path === '/media') return { kind: 'videos' };
  if (path === '/articles' || path === '/blog' || path === '/blogs' || path === '/insights') {
    return { kind: 'articles' };
  }
  if (path.startsWith('/articles/')) {
    const slug = path.slice('/articles/'.length).trim();
    if (slug && !slug.includes('/')) {
      return { kind: 'article-detail', slug };
    }
    return { kind: 'articles' };
  }

  // Stage routes
  const withoutSlash = path.slice(1);
  if (STAGE_ID_SET.has(withoutSlash)) {
    return { kind: 'stage', stageId: withoutSlash as PublicStageDefinition['id'] };
  }

  // Aliases for flagship software
  const aliasMap: Record<string, string> = {
    '/rolling-forecast': '/bizzoptimizer',
    '/rolling_forecast': '/bizzoptimizer',
    '/hi-level-forecast': '/bizzoptimizer',
    '/high-level-forecast': '/bizzoptimizer',
    '/bizz-optimizer': '/bizzoptimizer',
    '/bizz-calc': '/bizzcalc',
    '/bizz-calculators': '/bizzcalculators',
    '/bizz-dynamics': '/bizzdynamics',
    '/bizz-model': '/bizzmodel',
    '/bizzplan': '/bizzmodel',
    '/bizz-plan': '/bizzmodel',
  };
  const resolvedPath = aliasMap[path] || path;
  const sol = SOLUTION_BY_PATH.get(resolvedPath);
  if (sol) {
    return { kind: 'solution', solutionId: sol.id };
  }

  return { kind: 'home' };
}

export function getPublicSolutionById(id: string): PublicSolutionProfile | undefined {
  return PUBLIC_SOLUTION_PROFILES.find((p) => p.id === id);
}

export function getPublicStageById(id: string): PublicStageDefinition | undefined {
  return PUBLIC_STAGES.find((s) => s.id === id);
}
