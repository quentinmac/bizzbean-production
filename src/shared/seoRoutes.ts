export type SeoViewType =
  | 'flashcard'
  | 'active-app'
  | 'about'
  | 'footer'
  | 'workspace'
  | 'library'
  | 'ask-gemini'
  | 'admin-centre'
  | 'education-centre'
  | 'bizzclass'
  | 'platform-apps'
  | 'solutions'
  | 'contact'
  | 'article-detail';

export type SeoSchemaType =
  | 'WebApplication'
  | 'SoftwareApplication'
  | 'Course'
  | 'CollectionPage'
  | 'AboutPage'
  | 'ContactPage'
  | 'Article'
  | 'WebPage';

export interface PublicArticleIndexEntry {
  id: string;
  slug: string;
  title: string;
  category: string;
  author: string;
  readTime: string;
  summary: string;
}

export function slugifyArticleTitle(title: string): string {
  return String(title || '')
    .toLowerCase()
    .trim()
    .replace(/['’"?.,!:;()&/]+/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'article';
}

export const PUBLIC_ARTICLE_INDEX: PublicArticleIndexEntry[] = [
  { id: 'art-1793105801480', slug: 'employees-as-a-touch-point', title: 'Employees as a Touch-Point', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'How team capability, accountability, and daily habits shape customer experience and financial return.' },
  { id: 'art-1793105905445', slug: 'products-as-a-touch-point', title: 'Products as a Touch-Point', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'Designing product mix, pricing, and quality standards so every unit sold protects gross margin.' },
  { id: 'art-1793105759004', slug: 'infrastructure-as-a-touch-point', title: 'Infrastructure as a Touch-Point', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'Aligning premises, equipment, and capital expenditure with real trading capacity and asset turn.' },
  { id: 'art-1793105871360', slug: 'customers-as-a-touch-point', title: 'Customers as a Touch-Point', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'Understanding customer segments, payment terms, and retention economics before scaling sales.' },
  { id: 'art-1793105723384', slug: 'systems-as-a-touch-point', title: 'Systems as a Touch-Point', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'Replacing founder guesswork with repeatable operating and financial reporting systems.' },
  { id: 'art-1793105839254', slug: 'suppliers-as-a-touch-point', title: 'Suppliers as a Touch-Point', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'Managing supplier reliability, input pricing, and payable terms to safeguard working capital.' },
  { id: 'art-1793105682138', slug: 'leader-as-a-touch-point', title: 'Leader as a Touch-Point', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'Why financial discipline and operational standards begin with how the business owner leads.' },
  { id: 'art-1793105644404', slug: 'are-you-an-entrepreneur', title: 'Are You an Entrepreneur?', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'A candid look at what separates an idea from an enduring, financially self-sustaining business.' },
  { id: 'art-1793105603942', slug: 'scorekeeper', title: 'Scorekeeper', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'Why every founder needs clear financial scorekeeping before making hiring or expansion bets.' },
  { id: 'art-1793105565452', slug: 'make-the-financial-model-a-decision-checkpoint', title: 'Make the Financial Model a Decision Checkpoint', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'Using a 3-statement financial model to test assumptions before committing real cash.' },
  { id: 'art-1793105524108', slug: 'should-you-reduce-expenses-to-free-up-capital-for-investment', title: 'Should You Reduce Expenses to Free Up Capital for Investment?', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'How to distinguish unproductive overhead from capacity-building expenditure.' },
  { id: 'art-1793105483793', slug: 'earn-access-to-capital', title: 'EARN Access to Capital', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'Why lenders and investors back proven unit economics, governance, and repayment visibility.' },
  { id: 'art-1793105447139', slug: 'professionalizing-your-business', title: 'Professionalizing Your Business', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'Transitioning from informal founder management to structured planning, budgets, and KPIs.' },
  { id: 'art-1793105405771', slug: 'innovation-laboratory', title: 'Innovation Laboratory', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'Testing new products, pricing models, and channels safely inside a financial sandbox first.' },
  { id: 'art-1793105363070', slug: 'preparation-checklist', title: 'Preparation Checklist', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'What to gather before your annual planning cycle and financial modelling workshop.' },
  { id: 'art-1793105319289', slug: 'planning-workshop', title: 'Planning Workshop', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'How to run an annual management planning workshop that links operational actions to cash flow.' },
  { id: 'art-1793105276544', slug: 'budget', title: 'Budget', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'Building a realistic 12-month operating budget grounded in trading drivers rather than guesswork.' },
  { id: 'art-1793105233940', slug: 'operational-plan', title: 'Operational Plan', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'Translating financial targets into accountable departmental effectiveness areas and deadlines.' },
  { id: 'art-1793105172463', slug: 'financial-year-end-and-audit-sign-off', title: 'Financial Year-End and Audit Sign Off', category: 'Strategy', author: 'the bizzbean channel', readTime: '4 min read', summary: 'Closing the financial year cleanly so historical actuals become a reliable baseline for growth.' },
  { id: 'art-decision-checkpoint', slug: 'review-and-react', title: 'Review and React', category: 'Finance', author: 'Quentin McCullough', readTime: '4 min read', summary: 'Why dynamic forecasting transforms static spreadsheets into operational governance engines, forcing leadership teams to confront unit economic reality early.' },
];

export interface SeoRouteDefinition {
  path: string;
  navLabel: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  highlights: string[];
  schemaType: SeoSchemaType;
  priceZAR?: string;
  priority: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  includeInSitemap: boolean;
  /** Mapping back to the exact bizz-DESK internal view/stage/solution state */
  routeState: {
    stageId?: string;
    solutionId?: string;
    view: SeoViewType;
  };
}

export const SITE_ORIGIN = 'https://bizzbean.com';
export const DEFAULT_OG_IMAGE = '/bizzbean-favicon.jpg';

/**
 * Authoritative multi-page SEO route registry for bizzbean (bizz-DESK).
 * Covers all public menu links, the Sandbox Library, and public flagship apps & courses.
 * Hidden / staging pages (Operations, Growth, GIM, Admin) are intentionally excluded from sitemap.
 */
export const SEO_ROUTES: SeoRouteDefinition[] = [
  {
    path: '/',
    navLabel: 'Home',
    title: 'bizzbean — Startup Financial Modeling & BOM Calculators',
    description:
      'Test business viability, build lender-ready 3-statement financial models, and price products dynamically inside the bizz-DESK venture workstation.',
    h1: 'bizzbean — Entrepreneur Financial Modeling & Startup Workstation',
    intro:
      'Open your bizz-DESK to test startup viability, build 5-year 3-statement financial models, optimize margins, and manage business plans from idea to investor readiness.',
    highlights: [
      '4-stage entrepreneurial framework: vi-ABILITY, fund-ABILITY, sustain-ABILITY, and invest-ABILITY',
      '12-in-1 business and Bill of Materials (BOM) pricing calculators for trading, hospitality, and manufacturing',
      'Lender-ready 5-year Income Statement, Balance Sheet, Cash Flow, and structured bizzplan documents',
      'Practical video walkthroughs, articles, courses, and the curated bizzbean Sandbox Library',
    ],
    schemaType: 'WebApplication',
    priceZAR: '0',
    priority: '1.0',
    changefreq: 'daily',
    includeInSitemap: true,
    routeState: {
      stageId: 'vi-ability',
      solutionId: 'learn-earn-capital',
      view: 'flashcard',
    },
  },
  {
    path: '/about',
    navLabel: 'About bizzbean',
    title: 'About bizzbean — Built by Entrepreneurs for Founders',
    description:
      'Discover the story behind bizzbean and bizz-DESK: practical financial modeling tools, business calculators, and courses designed to help founders build sustainable value.',
    h1: 'About bizzbean — Empowering Entrepreneurs to Build Sustainable Value',
    intro:
      'Founded by Quentin G. McCullough, bizzbean distills decades of hands-on business management and financial modeling experience into clear, practical tools for entrepreneurs.',
    highlights: [
      'Built around real-world business mechanics rather than abstract spreadsheet theory',
      'Guides founders step-by-step from concept viability to funding, operational control, and investment',
      'Includes the foundational Getting to Value book and structured financial literacy courses',
    ],
    schemaType: 'AboutPage',
    priority: '0.9',
    changefreq: 'weekly',
    includeInSitemap: true,
    routeState: {
      solutionId: 'about-bizzbean',
      view: 'about',
    },
  },
  {
    path: '/solutions',
    navLabel: 'Solutions',
    title: 'Solutions — Financial Modeling Software & Courses | bizzbean',
    description:
      'Explore all bizzbean financial modeling apps, BOM pricing calculators, and practical courses organized across vi-ABILITY, fund-ABILITY, sustain-ABILITY, and invest-ABILITY.',
    h1: 'bizzbean Solutions — Practical Software & Courses for Every Business Stage',
    intro:
      'From testing a startup idea to preparing lender-ready 5-year financials and optimizing profit margins, explore every bizzbean tool and course in one clear directory.',
    highlights: [
      'vi-ABILITY: you have a business idea, and you want to start a business',
      'fund-ABILITY: you have a business and you need funding to grow',
      'sustain-ABILITY: you want to professionalize your business',
      'invest-ABILITY: you need an investor to grow your business',
    ],
    schemaType: 'CollectionPage',
    priority: '0.95',
    changefreq: 'weekly',
    includeInSitemap: true,
    routeState: {
      stageId: 'vi-ability',
      solutionId: 'bizzmodel',
      view: 'solutions',
    },
  },
  {
    path: '/contact',
    navLabel: 'Contact',
    title: 'Contact bizzbean — Talk to Us & Enquiries',
    description:
      'Reach the bizzbean team for onboarding guidance, enterprise financial modelling enquiries, workshops, or course support.',
    h1: 'Contact bizzbean — Talk to Our Team',
    intro:
      'Have a question about our financial modelling software, courses, or choosing the right stage for your business? Send us a message directly.',
    highlights: [
      'Direct founder and onboarding enquiry channel',
      'Guidance on selecting the right model-set or stage for your business',
      'Support for universities, incubators, and advisory practices',
    ],
    schemaType: 'ContactPage',
    priority: '0.8',
    changefreq: 'monthly',
    includeInSitemap: true,
    routeState: {
      solutionId: 'contact',
      view: 'contact',
    },
  },
  {
    path: '/vi-ability',
    navLabel: 'vi-ABILITY',
    title: 'vi-ABILITY Stage — Test Your Startup Viability | bizzbean',
    description:
      'Validate pricing, break-even sales, and unit economics before committing capital. Explore bizzcalc and free startup viability courses in Stage 01.',
    h1: 'Stage 01: vi-ABILITY — Validate Startup Economics Before You Spend',
    intro:
      'The vi-ABILITY stage equips early-stage founders to test whether a business idea can recover its fixed overheads, achieve break-even, and earn a healthy contribution margin.',
    highlights: [
      'Free course: Learn How to Earn Access to Capital',
      'bizzcalc 7-step startup financial viability and break-even simulator',
      'How to Use bizzcalc guided video training for rapid scenario modeling',
    ],
    schemaType: 'CollectionPage',
    priority: '0.9',
    changefreq: 'weekly',
    includeInSitemap: true,
    routeState: {
      stageId: 'vi-ability',
      solutionId: 'learn-earn-capital',
      view: 'flashcard',
    },
  },
  {
    path: '/fund-ability',
    navLabel: 'fund-ABILITY',
    title: 'fund-ABILITY Stage — Lender-Ready Financial Models | bizzbean',
    description:
      'Build 5-year 3-statement financial models, business plans, and cost recovery schedules ready for banks and investors inside bizzbean Stage 02.',
    h1: 'Stage 02: fund-ABILITY — Build Lender & Investor-Ready Projections',
    intro:
      'Move from concept to capital with integrated 60-month Income Statement, Balance Sheet, and Cash Flow models paired with structured business planning and cost recovery courses.',
    highlights: [
      'bizzmodel 5-year integrated 3-statement financial model with multi-industry model-sets',
      'bizzplan structured lender-ready business plan synced live to your financial numbers',
      'Cost Recovery Calculator, Follow the Money, and Financial Reports masterclasses',
    ],
    schemaType: 'CollectionPage',
    priority: '0.9',
    changefreq: 'weekly',
    includeInSitemap: true,
    routeState: {
      stageId: 'fund-ability',
      solutionId: 'cost-recovery-calculator',
      view: 'flashcard',
    },
  },
  {
    path: '/sustain-ability',
    navLabel: 'sustain-ABILITY',
    title: 'sustain-ABILITY Stage — Profit & Cash Optimization | bizzbean',
    description:
      'Measure Return on Sales and Asset Turn on YTD results, simulate What-If scenarios, and drive departmental Actions to Improve in bizzbean Stage 03.',
    h1: 'Stage 03: sustain-ABILITY — Control Margins, Cash Cycle & Performance',
    intro:
      'Sustain and scale an operating business by turning monthly management accounts into a 60-month rolling forecast, ratio target cockpit, and accountable improvement plans.',
    highlights: [
      'bizzoptimizer YTD actuals, 60-month rolling forecast, What-If simulator, and Actions to Improve',
      'Profit Optimizer, Financial Scenario Planning, and Annual Business Planning Cycle courses',
      'Working capital velocity controls across Inventory Days, Receivables Days, and Payables Days',
    ],
    schemaType: 'CollectionPage',
    priority: '0.9',
    changefreq: 'weekly',
    includeInSitemap: true,
    routeState: {
      stageId: 'sustain-ability',
      solutionId: 'profit-optimizer',
      view: 'flashcard',
    },
  },
  {
    path: '/invest-ability',
    navLabel: 'invest-ABILITY',
    title: 'invest-ABILITY Stage — Investor Readiness & VDR | bizzbean',
    description:
      'Prepare executive financials, governance records, and due-diligence documentation for equity investors and strategic buyers in bizzbean Stage 04.',
    h1: 'Stage 04: invest-ABILITY — Prepare Your Business for Institutional Capital',
    intro:
      'Structure your valuation narrative, financial reporting discipline, and virtual data room checklist so investors can evaluate your business with confidence.',
    highlights: [
      'Investor-ready financial reporting and due-diligence governance workflows',
      'Structured capital allocation, debt-to-equity, and return-on-assets analysis',
      'Seamless progression from vi-ABILITY, fund-ABILITY, and sustain-ABILITY outputs',
    ],
    schemaType: 'CollectionPage',
    priority: '0.85',
    changefreq: 'weekly',
    includeInSitemap: true,
    routeState: {
      stageId: 'invest-ability',
      solutionId: 'invest-vdr',
      view: 'flashcard',
    },
  },
  {
    path: '/personal-sandbox',
    navLabel: 'Personal Sandbox',
    title: 'Personal Sandbox — Interactive Business Calculators | bizzbean',
    description:
      'Experiment freely with practical startup calculators, BOM recipe costing, margin vs markup, break-even, and financial planning tools in your Personal Sandbox.',
    h1: 'Personal Sandbox — Hands-On Financial Calculators & Simulators',
    intro:
      'Your Personal Sandbox gathers practical, everyday decision calculators and startup tools so you can test pricing, cost structures, and scenarios risk-free.',
    highlights: [
      '12-in-1 bizzcalculators suite including Bill of Materials (BOM) food and product costing',
      'Break-even, Margin vs Markup, Term Loan, Buy vs Lease, and Working Capital calculators',
      'Instant access to startup viability simulations and curated learning resources',
    ],
    schemaType: 'CollectionPage',
    priority: '0.85',
    changefreq: 'weekly',
    includeInSitemap: true,
    routeState: {
      stageId: 'personal-sandbox',
      solutionId: 'bizzcalc',
      view: 'flashcard',
    },
  },
  {
    path: '/library',
    navLabel: 'Library',
    title: 'bizzbean Library — Financial Templates, Guides & Vault',
    description:
      'Browse the bizzbean Sandbox Library for business modeling guides, financial checklists, downloadable templates, and structured startup reference documents.',
    h1: 'bizzbean Sandbox Library — Curated Guides, Templates & Reference Vault',
    intro:
      'Explore practical reference guides, stage checklists, financial modeling templates, and daily executive focus tools organized across every stage of your business journey.',
    highlights: [
      'Stage-aligned templates and guides covering viability, funding, sustainability, and governance',
      'Searchable knowledge vault with category filters and structured document previews',
      'Integrated with bizz-DESK solutions and Google Workspace export workflows',
    ],
    schemaType: 'CollectionPage',
    priority: '0.9',
    changefreq: 'weekly',
    includeInSitemap: true,
    routeState: {
      solutionId: 'sandbox-library',
      view: 'library',
    },
  },
  {
    path: '/videos',
    navLabel: 'Videos',
    title: 'Business Modeling Videos & Walkthroughs | bizzbean',
    description:
      'Watch practical video walkthroughs on startup viability, 3-statement financial modeling, product costing, and Getting to Value principles from bizzbean.',
    h1: 'Media & Videos — Practical Entrepreneurial Finance Walkthroughs',
    intro:
      'Learn visual, step-by-step financial modeling techniques, product costing methods, and business planning principles through concise bizzbean video tutorials.',
    highlights: [
      'Walkthroughs of Getting to Value and core business viability concepts',
      'Step-by-step demonstrations of bizzcalc, bizzmodel, bizzoptimizer, and bizzcalculators',
      'Actionable lessons built for founders, small business owners, and managers',
    ],
    schemaType: 'CollectionPage',
    priority: '0.8',
    changefreq: 'weekly',
    includeInSitemap: true,
    routeState: {
      stageId: 'education',
      solutionId: 'videos',
      view: 'flashcard',
    },
  },
  {
    path: '/articles',
    navLabel: 'Articles',
    title: 'Entrepreneur Finance & Strategy Articles | bizzbean',
    description:
      'Read practical bizzbean articles on break-even analysis, gross profit margins, cash conversion cycles, Return on Assets, and lender-ready business planning.',
    h1: 'Articles & Insights — Practical Financial Management for Founders',
    intro:
      'Deep-dive essays and practical playbooks covering unit economics, working capital discipline, pricing strategy, and building businesses of lasting asset value.',
    highlights: [
      'Clear explanations of Return on Sales, Asset Turn, and Return on Net Operating Assets',
      'Practical pricing, Bill of Materials costing, and overhead recovery frameworks',
      'Written from decades of real operating experience with SMEs and startups',
    ],
    schemaType: 'CollectionPage',
    priority: '0.85',
    changefreq: 'weekly',
    includeInSitemap: true,
    routeState: {
      stageId: 'education',
      solutionId: 'articles',
      view: 'flashcard',
    },
  },
  {
    path: '/google-workspace',
    navLabel: 'Google Workspace',
    title: 'Google Workspace Integration — Docs & Drive | bizzbean',
    description:
      'Connect your bizz-DESK workflow with Google Drive, Docs, and Sheets to store financial models, business plans, and executive snapshots cleanly.',
    h1: 'Google Workspace — Organize Your Business Plans & Financial Files',
    intro:
      'Keep your financial schedules, business plans, and stage checklists structured alongside your Google Workspace productivity environment.',
    highlights: [
      'Clean alignment between bizz-DESK deliverables and cloud document storage',
      'Supports lender-ready business plan packages and financial report archives',
    ],
    schemaType: 'WebPage',
    priority: '0.7',
    changefreq: 'monthly',
    includeInSitemap: true,
    routeState: {
      solutionId: 'google-workspace',
      view: 'workspace',
    },
  },
  {
    path: '/website-footer',
    navLabel: 'Policies & Contact',
    title: 'Policies, POPIA Privacy & Contact Us | bizzbean',
    description:
      'Review bizzbean POPIA & GDPR privacy policies, terms of service, governance disclosures, and connect directly with the bizzbean team via Talk to Us.',
    h1: 'Website Policies, Governance & Talk to Us',
    intro:
      'Access bizzbean legal policies, POPIA & GDPR privacy commitments, market disclaimers, and direct channels to contact our team.',
    highlights: [
      'POPIA & GDPR Privacy Policy and Data Processing Agreement',
      'Terms of Service, Acceptable Use Policy, and Market Disclaimers',
      'Direct Talk to Us enquiry channel for founders and enterprise partners',
    ],
    schemaType: 'WebPage',
    priority: '0.6',
    changefreq: 'monthly',
    includeInSitemap: true,
    routeState: {
      solutionId: 'website-footer',
      view: 'footer',
    },
  },

  // --- PUBLIC FLAGSHIP APPS ---
  {
    path: '/bizzcalc',
    navLabel: 'bizzcalc',
    title: 'bizzcalc — Startup Financial Viability Simulator | bizzbean',
    description:
      'Test product pricing, fixed overheads, staffing costs, and break-even sales targets across four risk scenarios with the 7-step bizzcalc viability simulator.',
    h1: 'bizzcalc — 7-Step Startup Financial Viability & Break-Even Simulator',
    intro:
      'Validate whether your business model works before signing a lease or buying stock. Model daily capacity, unit margins, overheads, and break-even scenarios on desktop or mobile.',
    highlights: [
      '7-step guided viability workflow from business rhythm to break-even results',
      'Compare four scenario cases side-by-side to stress-test sales and margin assumptions',
      'Instant contribution margin, overhead recovery, and minimum daily sales targets',
    ],
    schemaType: 'SoftwareApplication',
    priceZAR: '249.17',
    priority: '0.9',
    changefreq: 'weekly',
    includeInSitemap: true,
    routeState: {
      stageId: 'vi-ability',
      solutionId: 'bizzcalc',
      view: 'flashcard',
    },
  },
  {
    path: '/bizzcalculators',
    navLabel: 'bizzcalculators',
    title: 'bizzcalculators — 12-in-1 Business & BOM Costing Suite',
    description:
      'Use 12 mobile-ready business calculators including Bill of Materials (BOM) recipe costing, Margin vs Markup, Break-Even, Term Loan, and Working Capital tools.',
    h1: 'bizzcalculators — 12-in-1 Business & Bill of Materials (BOM) Calculator Suite',
    intro:
      'Solve everyday pricing, costing, and financing calculations in seconds with 12 purpose-built calculators designed for traders, manufacturers, caterers, and service founders.',
    highlights: [
      'Dynamic Bill of Materials (BOM) recipe and product costing calculator',
      'Margin vs Markup, Break-Even Point, Cost-Benefit, and Buy vs Lease calculators',
      'Return on Assets (ROA), Working Capital Cycle, and Term Loan repayment tools',
    ],
    schemaType: 'SoftwareApplication',
    priceZAR: '82.50',
    priority: '0.9',
    changefreq: 'weekly',
    includeInSitemap: true,
    routeState: {
      stageId: 'personal-sandbox',
      solutionId: 'bizzcalculators',
      view: 'flashcard',
    },
  },
  {
    path: '/bizzdynamics',
    navLabel: 'bizzdynamics',
    title: 'bizzdynamics — 5-Year Business Physics Simulator | bizzbean',
    description:
      'Understand how pricing, volume, overheads, and working capital days interact over 5 years using bizzdynamics interactive base-rate adjustment sliders.',
    h1: 'bizzdynamics — Interactive 5-Year Business Dynamics & Sensitivity Simulator',
    intro:
      'Learn the financial physics of a growing business by adjusting revenue, margin, staffing, capex, and debtor/creditor days live across a 60-month horizon.',
    highlights: [
      'Interactive 5-year monthly base-rate adjustment sliders with live cash flow impact',
      '3-product contribution mix simulation showing how product mix drives profitability',
      'Built-in What-If Return on Assets (ROA) sensitivity engine',
    ],
    schemaType: 'SoftwareApplication',
    priceZAR: '499.17',
    priority: '0.85',
    changefreq: 'weekly',
    includeInSitemap: true,
    routeState: {
      stageId: 'fund-ability',
      solutionId: 'bizzdynamics',
      view: 'flashcard',
    },
  },
  {
    path: '/bizzmodel',
    navLabel: 'bizzmodel',
    title: 'bizzmodel — 5-Year 3-Statement Financial Model | bizzbean',
    description:
      'Build lender-ready 60-month Income Statement, Balance Sheet, and Cash Flow models with trading, manufacturing, and hospitality model-sets plus bizzplan.',
    h1: 'bizzmodel — Lender-Ready 5-Year Integrated 3-Statement Financial Model',
    intro:
      'Create institutional-grade 60-month financial projections tailored to your exact industry model-set — including Unit Sales, Batch Lots, Continuous Production, Fabrication, and Family Restaurant.',
    highlights: [
      'Full 60-month Trading Account, Income Statement, Balance Sheet, Cash Flow, and VAT Ledger',
      'Specialized model-sets with production capacity, BOM costing, packaging, and bizzbox directory',
      'Integrated bizzplan business plan and Pitch Deck Studio synced live to your model',
    ],
    schemaType: 'SoftwareApplication',
    priceZAR: '1249.17',
    priority: '0.9',
    changefreq: 'weekly',
    includeInSitemap: true,
    routeState: {
      stageId: 'fund-ability',
      solutionId: 'bizzmodel',
      view: 'flashcard',
    },
  },
  {
    path: '/bizzoptimizer',
    navLabel: 'bizzoptimizer',
    title: 'bizzoptimizer — YTD Forecast & Actions to Improve | bizzbean',
    description:
      'Measure Return on Sales and Asset Turn on YTD management accounts, project 60 months, simulate What-If scenarios, and assign departmental Actions to Improve.',
    h1: 'bizzoptimizer — YTD Rolling Forecast, Ratio Objectives & Actions to Improve',
    intro:
      'Turn monthly management accounts into an executive performance cockpit. Set achievable Return on Sales and Asset Turn targets, review 8 Performance Leaders, and manage actionable improvement plans.',
    highlights: [
      'YTD Trading Account & Balance Sheet actuals driving a live 60-month 3-statement forecast',
      'Return on Sales (ROS), Asset Turn, and Return on Net Operating Assets (RONOA) objective tracker',
      'Programme of Actions across 8 Performance Leaders with editable touch-point hints (products, customers, suppliers, systems, infrastructure)',
    ],
    schemaType: 'SoftwareApplication',
    priceZAR: '499.17',
    priority: '0.9',
    changefreq: 'weekly',
    includeInSitemap: true,
    routeState: {
      stageId: 'sustain-ability',
      solutionId: 'rolling-forecast',
      view: 'flashcard',
    },
  },

  // --- PUBLIC COURSES ---
  {
    path: '/learn-earn-capital',
    navLabel: 'Learn How to Earn Access to Capital',
    title: 'Free Course: Learn How to Earn Access to Capital | bizzbean',
    description:
      'Start free with our foundational vi-ABILITY course explaining what lenders and investors look for before funding a business and how to prove viability.',
    h1: 'Learn How to Earn Access to Capital — Free Foundational Course',
    intro:
      'Understand the commercial reality behind business funding, capital preservation, and proving sustainable unit economics before approaching lenders or investors.',
    highlights: [
      'Free entry course in Stage 01 (vi-ABILITY) for new and growing founders',
      'Explains the link between viability, cash conversion, and capital readiness',
    ],
    schemaType: 'Course',
    priceZAR: '0',
    priority: '0.85',
    changefreq: 'monthly',
    includeInSitemap: true,
    routeState: {
      stageId: 'vi-ability',
      solutionId: 'learn-earn-capital',
      view: 'flashcard',
    },
  },
  {
    path: '/cost-recovery-calculator',
    navLabel: 'Cost Recovery Calculator Course',
    title: 'Cost Recovery Calculator Course — Break-Even & Pricing',
    description:
      'Master overhead recovery, gross profit margins, and daily break-even volume targets with the bizzbean Cost Recovery Calculator course.',
    h1: 'Cost Recovery Calculator — Master Pricing, Margins & Overhead Recovery',
    intro:
      'Learn how to calculate your true daily and monthly cost recovery threshold so every sale moves your business decisively beyond break-even.',
    highlights: [
      'Step-by-step overhead recovery and gross margin mechanics',
      'Practical break-even volume and pricing sensitivity exercises',
    ],
    schemaType: 'Course',
    priority: '0.8',
    changefreq: 'monthly',
    includeInSitemap: true,
    routeState: {
      stageId: 'fund-ability',
      solutionId: 'cost-recovery-calculator',
      view: 'flashcard',
    },
  },
  {
    path: '/profit-optimizer',
    navLabel: 'Profit Optimizer Course',
    title: 'Profit Optimizer Course — Margin & ROA Mastery | bizzbean',
    description:
      'Learn how to diagnose profit leaks, improve Return on Sales and Asset Turn, and unlock working capital cash in the Profit Optimizer course.',
    h1: 'Profit Optimizer — Practical Margin, Asset Turn & Cash Flow Optimization',
    intro:
      'Discover how small, disciplined improvements across pricing, cost of sales, overheads, and working capital days compound into dramatic Return on Assets gains.',
    highlights: [
      'Deconstructs Return on Net Operating Assets into Return on Sales and Asset Turn',
      'Pairs directly with bizzoptimizer What-If simulations and Actions to Improve',
    ],
    schemaType: 'Course',
    priority: '0.8',
    changefreq: 'monthly',
    includeInSitemap: true,
    routeState: {
      stageId: 'sustain-ability',
      solutionId: 'profit-optimizer',
      view: 'flashcard',
    },
  },
  {
    path: '/how-to-bizzcalc',
    navLabel: 'How to Use bizzcalc',
    title: 'How to Use bizzcalc — Viability Training Course | bizzbean',
    description:
      'Guided training on using the bizzcalc 7-step financial viability simulator to model pricing, expenses, and break-even scenarios accurately.',
    h1: 'How to Use bizzcalc — Step-by-Step Viability Simulator Guide',
    intro:
      'Walk through each step of bizzcalc with worked examples so you can stress-test any business concept in minutes.',
    highlights: [
      'Covers operating rhythm, product margins, staffing, overheads, and scenario testing',
      'Designed for first-time founders and advisors reviewing startup feasibility',
    ],
    schemaType: 'Course',
    priority: '0.75',
    changefreq: 'monthly',
    includeInSitemap: true,
    routeState: {
      stageId: 'vi-ability',
      solutionId: 'how-to-bizzcalc',
      view: 'flashcard',
    },
  },
  {
    path: '/follow-the-money',
    navLabel: 'Follow the Money',
    title: 'Follow the Money Course — Cash Flow Mechanics | bizzbean',
    description:
      'Trace how every rand moves through inventory, receivables, payables, profit, and bank cash in the bizzbean Follow the Money course.',
    h1: 'Follow the Money — Understand How Profit Turns Into Bank Cash',
    intro:
      'Learn why profitable businesses still run out of cash and how to manage working capital cycles with confidence.',
    highlights: [
      'Visualizes the link between Trading Account, Balance Sheet, and Cash Flow',
      'Essential financial literacy for operating founders and managers',
    ],
    schemaType: 'Course',
    priority: '0.75',
    changefreq: 'monthly',
    includeInSitemap: true,
    routeState: {
      stageId: 'fund-ability',
      solutionId: 'follow-the-money',
      view: 'flashcard',
    },
  },
  {
    path: '/financial-reports',
    navLabel: 'Financial Reports',
    title: 'Financial Reports Course — Read 3-Statement Financials',
    description:
      'Learn to read and interpret Income Statements, Balance Sheets, and Cash Flow statements like a seasoned CFO with bizzbean.',
    h1: 'Financial Reports — Confidently Interpret 3-Statement Financials',
    intro:
      'Demystify management accounts and 5-year financial statements so you can spot risks early and speak fluently with bankers and investors.',
    highlights: [
      'Practical breakdown of Income Statement, Balance Sheet, and Cash Flow reports',
      'Focuses on the ratios that actually drive business survival and value',
    ],
    schemaType: 'Course',
    priority: '0.75',
    changefreq: 'monthly',
    includeInSitemap: true,
    routeState: {
      stageId: 'fund-ability',
      solutionId: 'financial-reports',
      view: 'flashcard',
    },
  },
  {
    path: '/financial-scenario-planning',
    navLabel: 'Financial Scenario Planning',
    title: 'Financial Scenario Planning Course | bizzbean',
    description:
      'Build resilient best-case, base-case, and downside cash flow plans to protect your business against market shifts and cost inflation.',
    h1: 'Financial Scenario Planning — Stress-Test Your Business Before Shocks Hit',
    intro:
      'Prepare actionable contingency plans by modeling revenue dips, margin pressure, and debtor delays before they impact your bank balance.',
    highlights: [
      'Structured downside and upside sensitivity modeling for SMEs',
      'Pairs with bizzdynamics and bizzoptimizer What-If tools',
    ],
    schemaType: 'Course',
    priority: '0.75',
    changefreq: 'monthly',
    includeInSitemap: true,
    routeState: {
      stageId: 'sustain-ability',
      solutionId: 'financial-scenario-planning',
      view: 'flashcard',
    },
  },
  {
    path: '/annual-business-planning-cycle',
    navLabel: 'Annual Business Planning Cycle',
    title: 'Annual Business Planning Cycle Course | bizzbean',
    description:
      'Establish a disciplined annual budgeting, monthly YTD review, and quarterly optimization cadence for your business with bizzbean.',
    h1: 'Annual Business Planning Cycle — Build a Repeatable Management Rhythm',
    intro:
      'Turn annual goals into monthly actual-vs-plan reviews and accountable departmental actions throughout the financial year.',
    highlights: [
      'Connects annual budgets, rolling forecasts, and monthly performance reviews',
      'Designed for business owners and departmental leaders',
    ],
    schemaType: 'Course',
    priority: '0.75',
    changefreq: 'monthly',
    includeInSitemap: true,
    routeState: {
      stageId: 'sustain-ability',
      solutionId: 'annual-business-planning-cycle',
      view: 'flashcard',
    },
  },
  {
    path: '/your-first-hire',
    navLabel: 'Your First Hire',
    title: 'Your First Hire Course — Payroll & Hiring Readiness | bizzbean',
    description:
      'Plan the true financial cost of hiring your first employee, calculate break-even sales impact, and build onboarding accountability with bizzbean.',
    h1: 'Your First Hire — Plan Recruitment & Payroll Sustainability',
    intro:
      'Quantify total cost-to-company, productivity ramp-up, and break-even sales before making your first hire.',
    highlights: [
      'Total cost-to-company and break-even hiring affordability checks',
      'Practical onboarding and role accountability frameworks',
    ],
    schemaType: 'Course',
    priority: '0.75',
    changefreq: 'monthly',
    includeInSitemap: true,
    routeState: {
      stageId: 'fund-ability',
      solutionId: 'your-first-hire',
      view: 'flashcard',
    },
  },
];

/** Friendly path aliases that resolve cleanly to canonical public SEO routes */
const PATH_ALIASES: Record<string, string> = {
  '/home': '/',
  '/about-bizzbean': '/about',
  '/sandbox-library': '/library',
  '/workspace': '/google-workspace',
  '/footer': '/website-footer',
  '/policies': '/website-footer',
  '/privacy-policy': '/website-footer',
  '/terms-of-service': '/website-footer',
  '/talk-to-us': '/contact',
  '/blog': '/articles',
  '/blogs': '/articles',
  '/insights': '/articles',
  '/products': '/solutions',
  '/apps': '/solutions',
  '/courses': '/solutions',
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
  '/education': '/videos',
  '/media': '/videos',
};

/** Hidden/private/staging paths that must be excluded from search indexing for now */
const NOINDEX_PREFIXES = [
  '/operations',
  '/operations-sandbox',
  '/growth',
  '/growth-strategy',
  '/gim',
  '/ask-gemini',
  '/admin',
  '/admin-centre',
  '/administration-centre',
  '/bizzmoney',
  '/bizzbudget',
];

const ARTICLE_ROUTES: SeoRouteDefinition[] = PUBLIC_ARTICLE_INDEX.map((art) => ({
  path: `/articles/${art.slug}`,
  navLabel: art.title,
  title: `${art.title} | bizzbean Articles`,
  description: art.summary,
  h1: art.title,
  intro: art.summary,
  highlights: [
    `Category: ${art.category}`,
    `Author: ${art.author}`,
    `Reading time: ${art.readTime}`,
  ],
  schemaType: 'Article',
  priority: '0.75',
  changefreq: 'monthly',
  includeInSitemap: true,
  routeState: {
    stageId: 'education',
    solutionId: 'articles',
    view: 'article-detail',
  },
}));

const ALL_SEO_ROUTES: SeoRouteDefinition[] = [...SEO_ROUTES, ...ARTICLE_ROUTES];

const ROUTE_BY_PATH = new Map<string, SeoRouteDefinition>(
  ALL_SEO_ROUTES.map((r) => [r.path, r])
);

export function normalizePathname(rawPathname: string): string {
  const clean = (rawPathname || '/').split('?')[0].split('#')[0].trim().toLowerCase();
  if (!clean || clean === '/') return '/';
  const withLeadingSlash = clean.startsWith('/') ? clean : `/${clean}`;
  return withLeadingSlash.length > 1 && withLeadingSlash.endsWith('/')
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

export function resolveSeoRouteByPath(rawPathname: string): SeoRouteDefinition | null {
  const normalized = normalizePathname(rawPathname);
  const canonicalPath = PATH_ALIASES[normalized] || normalized;
  const direct = ROUTE_BY_PATH.get(canonicalPath);
  if (direct) return direct;

  // Dynamic fallback for CMS-created articles at /articles/<slug>
  if (canonicalPath.startsWith('/articles/')) {
    const slug = canonicalPath.slice('/articles/'.length).trim();
    if (slug && !slug.includes('/')) {
      const readableTitle = slug
        .split('-')
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
        .join(' ');
      return {
        path: canonicalPath,
        navLabel: readableTitle,
        title: `${readableTitle} | bizzbean Articles`,
        description: `Practical financial modelling and business management insights from bizzbean: ${readableTitle}.`,
        h1: readableTitle,
        intro: `Read ${readableTitle} in the bizzbean knowledge hub.`,
        highlights: ['Practical entrepreneurial finance & governance guide'],
        schemaType: 'Article',
        priority: '0.7',
        changefreq: 'monthly',
        includeInSitemap: false,
        routeState: {
          stageId: 'education',
          solutionId: 'articles',
          view: 'article-detail',
        },
      };
    }
  }
  return null;
}

export function isNoIndexRoute(rawPathname: string, rawSearch = ''): boolean {
  const normalized = normalizePathname(rawPathname);
  if (NOINDEX_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))) {
    return true;
  }
  const s = (rawSearch || '').toLowerCase();
  if (
    s.includes('stage=operations') ||
    s.includes('stage=growth') ||
    s.includes('view=ask-gemini') ||
    s.includes('view=admin-centre') ||
    s.includes('solution=ask-gemini')
  ) {
    return true;
  }
  return false;
}

/**
 * Resolves the canonical clean URL path for any current bizz-DESK view/stage/solution state.
 */
export function resolveSeoRouteFromState(opts: {
  view?: SeoViewType;
  stageId?: string;
  solutionId?: string;
}): SeoRouteDefinition {
  const view = opts.view;
  const stageId = (opts.stageId || '').toLowerCase().trim();
  const rawSol = (opts.solutionId || '').toLowerCase().trim();
  const sol = rawSol === 'rolling-forecast' ? 'bizzoptimizer' : rawSol;

  if (view === 'about' || sol === 'about-bizzbean') {
    return ROUTE_BY_PATH.get('/about')!;
  }
  if (view === 'solutions') {
    return ROUTE_BY_PATH.get('/solutions')!;
  }
  if (view === 'contact' || sol === 'contact') {
    return ROUTE_BY_PATH.get('/contact')!;
  }
  if (view === 'library' || sol === 'sandbox-library' || sol === 'library') {
    return ROUTE_BY_PATH.get('/library')!;
  }
  if (view === 'workspace' || sol === 'google-workspace') {
    return ROUTE_BY_PATH.get('/google-workspace')!;
  }
  if (view === 'footer' || sol === 'website-footer') {
    return ROUTE_BY_PATH.get('/website-footer')!;
  }

  // Exact solution route match (flagship apps, courses, videos, articles)
  if (sol) {
    const bySol = ROUTE_BY_PATH.get(`/${sol}`);
    if (bySol) {
      // If user clicked a stage whose default solution is selected, prefer the stage URL
      // when stage matches the stage's own default and user is on flashcard view
      if (view === 'flashcard') {
        const stageRoute = ROUTE_BY_PATH.get(`/${stageId}`);
        if (
          stageRoute &&
          stageRoute.routeState.solutionId === rawSol &&
          !['videos', 'articles', 'bizzcalc', 'bizzcalculators', 'bizzdynamics', 'bizzmodel', 'bizzoptimizer', 'bizzplan'].includes(sol)
        ) {
          return stageRoute;
        }
      }
      return bySol;
    }
  }

  // Stage container route match
  if (stageId) {
    const byStage = ROUTE_BY_PATH.get(`/${stageId}`);
    if (byStage) return byStage;
  }

  return ROUTE_BY_PATH.get('/')!;
}

/**
 * Resolve route for incoming server request (checks clean pathname first, then legacy query params).
 */
export function resolveSeoRouteForRequest(
  reqPath: string,
  query: Record<string, string | undefined> = {}
): SeoRouteDefinition {
  const normalizedPath = normalizePathname(reqPath);
  if (normalizedPath !== '/') {
    const direct = resolveSeoRouteByPath(normalizedPath);
    if (direct) return direct;
  }

  // Legacy query-string fallback (e.g. /?stage=vi-ability, /?solution=bizzmodel, /?section=about, /?view=library)
  const section = (query.section || '').toLowerCase().trim();
  const view = (query.view || '').toLowerCase().trim() as SeoViewType;
  const stage = (query.stage || '').toLowerCase().trim();
  const sol = (query.solution || query.app || query.product || query.course || '').toLowerCase().trim();

  if (section === 'about') return ROUTE_BY_PATH.get('/about')!;
  if (section === 'talk-to-us' || section === 'privacy-policy' || section === 'terms-of-service') {
    return ROUTE_BY_PATH.get('/website-footer')!;
  }
  if (view || stage || sol) {
    return resolveSeoRouteFromState({
      view: view || 'flashcard',
      stageId: stage,
      solutionId: sol,
    });
  }

  return ROUTE_BY_PATH.get('/')!;
}

function escapeHtml(input: string): string {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildJsonLd(route: SeoRouteDefinition, origin: string): string {
  const cleanOrigin = origin.replace(/\/$/, '');
  const pageUrl = route.path === '/' ? `${cleanOrigin}/` : `${cleanOrigin}${route.path}`;

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': `${cleanOrigin}/#organization`,
      name: 'bizzbean',
      url: `${cleanOrigin}/`,
      logo: `${cleanOrigin}${DEFAULT_OG_IMAGE}`,
      founder: {
        '@type': 'Person',
        name: 'Quentin G. McCullough',
      },
      description:
        'Entrepreneurial financial modeling, Bill of Materials (BOM) pricing calculators, and 4-stage startup viability workstation built for founders.',
    },
  ];

  if (route.path !== '/') {
    const breadcrumbItems: Array<Record<string, unknown>> = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${cleanOrigin}/`,
      },
    ];
    if (route.path.startsWith('/articles/')) {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 2,
        name: 'Articles',
        item: `${cleanOrigin}/articles`,
      });
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 3,
        name: route.navLabel,
        item: pageUrl,
      });
    } else if (
      route.schemaType === 'SoftwareApplication' ||
      route.schemaType === 'Course'
    ) {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 2,
        name: 'Solutions',
        item: `${cleanOrigin}/solutions`,
      });
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 3,
        name: route.navLabel,
        item: pageUrl,
      });
    } else {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 2,
        name: route.navLabel,
        item: pageUrl,
      });
    }
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems,
    });
  }

  if (route.schemaType === 'SoftwareApplication' || route.schemaType === 'WebApplication') {
    const appNode: Record<string, unknown> = {
      '@type': route.schemaType,
      '@id': `${pageUrl}#app`,
      name: route.h1,
      url: pageUrl,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      description: route.description,
    };
    if (route.priceZAR !== undefined) {
      appNode.offers = {
        '@type': 'Offer',
        price: route.priceZAR,
        priceCurrency: 'ZAR',
        availability: 'https://schema.org/InStock',
      };
    }
    graph.push(appNode);
  } else if (route.schemaType === 'Course') {
    const courseNode: Record<string, unknown> = {
      '@type': 'Course',
      '@id': `${pageUrl}#course`,
      name: route.h1,
      url: pageUrl,
      description: route.description,
      provider: {
        '@type': 'Organization',
        name: 'bizzbean',
        sameAs: `${cleanOrigin}/`,
      },
    };
    if (route.priceZAR !== undefined) {
      courseNode.offers = {
        '@type': 'Offer',
        price: route.priceZAR,
        priceCurrency: 'ZAR',
        category: route.priceZAR === '0' ? 'Free' : 'Paid',
      };
    }
    graph.push(courseNode);
  } else if (route.schemaType === 'Article') {
    graph.push({
      '@type': 'Article',
      '@id': `${pageUrl}#article`,
      headline: route.h1,
      url: pageUrl,
      description: route.description,
      author: {
        '@type': 'Organization',
        name: 'bizzbean',
      },
      publisher: {
        '@id': `${cleanOrigin}/#organization`,
      },
      mainEntityOfPage: pageUrl,
    });
  } else {
    graph.push({
      '@type': route.schemaType,
      '@id': `${pageUrl}#webpage`,
      name: route.title,
      url: pageUrl,
      description: route.description,
      isPartOf: {
        '@id': `${cleanOrigin}/#organization`,
      },
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

/**
 * Generates server-side semantic HTML inside <div id="root"> for search engines.
 * React replaces #root cleanly on mount so human visitors see zero visual change.
 */
function buildSemanticPrerenderHtml(route: SeoRouteDefinition): string {
  const navLinks = SEO_ROUTES.filter((r) => r.includeInSitemap)
    .map(
      (r) =>
        `<li><a href="${escapeHtml(r.path)}">${escapeHtml(r.navLabel)}</a></li>`
    )
    .join('');

  const highlightItems = route.highlights
    .map((h) => `<li>${escapeHtml(h)}</li>`)
    .join('');

  return [
    `<main id="seo-prerender" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">`,
    `<article>`,
    `<h1>${escapeHtml(route.h1)}</h1>`,
    `<p>${escapeHtml(route.intro)}</p>`,
    `<ul>${highlightItems}</ul>`,
    `</article>`,
    `<nav aria-label="bizzbean public pages"><ul>${navLinks}</ul></nav>`,
    `</main>`,
  ].join('');
}

/**
 * Injects page-specific <title>, <meta>, <link rel="canonical">, OpenGraph/Twitter tags,
 * Schema.org JSON-LD, and semantic crawlable HTML into index.html per requested route.
 */
export function renderSeoHtml(
  templateHtml: string,
  reqPath: string,
  query: Record<string, string | undefined> = {},
  origin: string = SITE_ORIGIN
): string {
  const cleanOrigin = origin.replace(/\/$/, '');
  const route = resolveSeoRouteForRequest(reqPath, query);
  const queryString = Object.entries(query)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const noIndex = isNoIndexRoute(reqPath, queryString);

  const canonicalUrl =
    route.path === '/' ? `${cleanOrigin}/` : `${cleanOrigin}${route.path}`;
  const ogImageUrl = `${cleanOrigin}${DEFAULT_OG_IMAGE}`;
  const jsonLd = buildJsonLd(route, cleanOrigin);

  const metaBlock = [
    `<title>${escapeHtml(route.title)}</title>`,
    `<meta name="description" content="${escapeHtml(route.description)}" />`,
    `<meta name="robots" content="${noIndex ? 'noindex, nofollow' : 'index, follow'}" />`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(route.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:site_name" content="bizzbean" />`,
    `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(route.title)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join('\n    ');

  let html = templateHtml;

  const metaMarkerRegex = /<!-- SEO_META_START -->[\s\S]*?<!-- SEO_META_END -->/;
  if (metaMarkerRegex.test(html)) {
    html = html.replace(
      metaMarkerRegex,
      `<!-- SEO_META_START -->\n    ${metaBlock}\n    <!-- SEO_META_END -->`
    );
  }

  const prerenderHtml = buildSemanticPrerenderHtml(route);
  if (html.includes('<!-- SEO_PRERENDER -->')) {
    html = html.replace('<!-- SEO_PRERENDER -->', prerenderHtml);
  } else {
    html = html.replace('<div id="root"></div>', `<div id="root">${prerenderHtml}</div>`);
  }

  return html;
}

/**
 * Generates clean XML sitemap containing only public SEO routes (excludes hidden pages).
 */
export function generateSitemapXml(origin: string = SITE_ORIGIN): string {
  const cleanOrigin = origin.replace(/\/$/, '');
  const urls = ALL_SEO_ROUTES.filter((r) => r.includeInSitemap)
    .map((r) => {
      const loc = r.path === '/' ? `${cleanOrigin}/` : `${cleanOrigin}${r.path}`;
      return [
        '  <url>',
        `    <loc>${escapeHtml(loc)}</loc>`,
        `    <changefreq>${r.changefreq}</changefreq>`,
        `    <priority>${r.priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');
}
