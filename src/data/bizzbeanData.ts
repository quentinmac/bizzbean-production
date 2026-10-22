import { VentureStage, ServicePackage, MasterclassItem, DiagnosticQuestion } from '../types';

export const VENTURE_STAGES: VentureStage[] = [
  {
    id: 'viability',
    index: '01',
    name: 'Vi-ability',
    tagline: 'Market Fit, Unit Economics & Lean Validation',
    description:
      'Eliminate guesswork before committing capital. We dissect your problem-solution hypothesis, validate willingness to pay, and model customer acquisition cost against lifetime value to ensure positive unit economics.',
    coreDeliverables: [
      'Problem-Solution Fit Matrix & Customer Discovery Architecture',
      'Unit Economics Blueprint (CAC : LTV Sensitivity Stress Test)',
      'Pricing Elasticity & Revenue Model Validation',
      'Go-To-Market Lean Validation Roadmap',
    ],
    metricsTarget: 'LTV : CAC Ratio >= 3.2x with payback period < 8 months',
    idealFor: 'Early-stage founders, spin-outs, and new venture initiatives requiring rigorous pre-build validation.',
    recommendedServiceId: 'viability-blueprint',
  },
  {
    id: 'fundability',
    index: '02',
    name: 'Fund-ability',
    tagline: 'Institutional Financial Modeling & Capital Planning',
    description:
      'Transform business narratives into institutional-grade quantitative forecasts. We construct dynamic 3-statement models, DCF valuations, and defensible capital deployment schedules that earn investor conviction.',
    coreDeliverables: [
      'Dynamic 3-Statement Financial Model (Income, Balance Sheet, Cash Flow)',
      'Discounted Cash Flow (DCF) & Pre/Post-Money Valuation Engine',
      'Hiring Plan, Burn Rate & Runway Sensitivity Scenarios',
      'Investor-Ready Pitch Deck Financial Appendix & Narrative Teaser',
    ],
    metricsTarget: 'Defensible 36-month projections with dynamic multi-variable sensitivity tables',
    idealFor: 'Ventures preparing for Pre-Seed, Seed, or Series A funding rounds or debt financing.',
    recommendedServiceId: 'financial-model-engine',
  },
  {
    id: 'sustainability',
    index: '03',
    name: 'Sustain-ability',
    tagline: 'Operational Optimization & Cash Runway Safeguards',
    description:
      'Bridge the gap between capital acquisition and enduring cash-generative operations. We embed Google Workspace enterprise architecture, live operational dashboards, and working capital optimization.',
    coreDeliverables: [
      'Google Workspace Enterprise Collaboration & Cloud Model Sync',
      'Working Capital & Cash Flow Runway Warning System',
      'Operational Efficiency Audit & Cost Base Realignment',
      'Monthly Board & Stakeholder Reporting Dashboard',
    ],
    metricsTarget: 'Extend baseline runway by +35% through operational margin efficiency',
    idealFor: 'Operating companies scaling headcount, optimizing margins, or navigating high burn rates.',
    recommendedServiceId: 'workspace-sustainability',
  },
  {
    id: 'investability',
    index: '04',
    name: 'Invest-ability',
    tagline: 'Governance, Due Diligence Data Room & Growth Capital',
    description:
      'Position your enterprise for institutional liquidity, joint ventures, or strategic investment. We build institutional-grade data rooms, cap table simulations, and governance protocols to pass rigorous due diligence.',
    coreDeliverables: [
      'Full Investor Due Diligence Virtual Data Room (VDR) Architecture',
      'Cap Table Waterfall & Dilution Modeling for Multiple Tranches',
      'Corporate Governance, Compliance & Risk Management Framework',
      'Term Sheet Negotiation Playbook & Investor Defense Prep',
    ],
    metricsTarget: '100% due-diligence audit readiness with zero governance friction points',
    idealFor: 'Growth-stage companies, Series A/B ventures, and strategic corporate partnerships.',
    recommendedServiceId: 'investability-dataroom',
  },
];

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'financial-model-engine',
    stageId: 'fundability',
    title: 'Institutional Financial Modeling Engine',
    turnaround: '5–7 Business Days',
    summary: 'Dynamic 3-statement forecasting, DCF valuation, and sensitivity simulator built for venture capital scrutiny.',
    description:
      'Our flagship quantitative service. We build bespoke financial models linked to your actual operational drivers. Features automated sensitivity tables, scenario toggles (Bear / Base / Bull), runway alarms, and Google Sheets cloud integration for live team collaboration.',
    deliverables: [
      'Full 3-Statement Integrated Financial Model (Monthly & Annual, 36 Months)',
      'DCF Valuation, Scorecard Valuation & Revenue Multiple Benchmarks',
      'Cap Table & Shareholder Dilution Simulator',
      'Executive Summary Deck Slides & Printable Board Summary',
      '2-Hour Quantitative Walkthrough & Assumption Stress-Testing Session',
    ],
    integrationTools: ['Google Sheets', 'Excel Macro-Free Format', 'Google Drive VDR', 'PDF Board Pack'],
    startingPrice: 'Custom Scope / Fixed Delivery',
    isPopular: true,
  },
  {
    id: 'viability-blueprint',
    stageId: 'viability',
    title: 'Venture Vi-ability & Validation Blueprint',
    turnaround: '7–10 Business Days',
    summary: 'Evidence-based market validation, unit economics stress test, and target customer pricing architecture.',
    description:
      'Avoid building products nobody pays for. We execute structured customer discovery synthesis, analyze competitive moat potential, and model unit economics to ensure every customer acquired adds net contribution margin.',
    deliverables: [
      'Comprehensive Market Sizing & TAM / SAM / SOM Breakdown',
      'Customer Acquisition Cost (CAC) & Lifetime Value (LTV) Mathematical Model',
      'Competitor Moat & Value Proposition Architecture Matrix',
      'Go-To-Market Traction Milestones & Validation Experiments',
    ],
    integrationTools: ['Google Docs Strategy Brief', 'Google Sheets Unit Economics Model', 'Loom Video Debrief'],
    startingPrice: 'Fixed Sprint',
  },
  {
    id: 'workspace-sustainability',
    stageId: 'sustainability',
    title: 'Sustain-ability & Operational Workspace Suite',
    turnaround: '10–14 Business Days',
    summary: 'Integrate Google Workspace enterprise collaboration, live financial dashboarding, and working capital safeguards.',
    description:
      'Transform disparate spreadsheets and communications into a streamlined collaborative enterprise operating system. We configure real-time financial tracking, automated KPI rollups, and cloud permissions for seamless execution.',
    deliverables: [
      'Enterprise Google Workspace Architecture & Access Control Setup',
      'Live Operational Runway & Cash Outflow Tracker connected to team budgets',
      'Executive Monthly Board Reporting Suite & KPI Dashboard',
      'Standard Operating Procedures (SOP) Vault for Financial Operations',
    ],
    integrationTools: ['Google Workspace', 'Google Sheets Data Feed', 'Looker Studio / BigQuery Ready', 'Google Drive'],
    startingPrice: 'Fixed Architecture Sprint',
  },
  {
    id: 'investability-dataroom',
    stageId: 'investability',
    title: 'Invest-ability & Due Diligence Data Room',
    turnaround: '10–14 Business Days',
    summary: 'Institutional data room setup, cap table waterfall, legal/financial governance checklist, and term sheet defense.',
    description:
      'When term sheets are on the line, diligence delays kill deals. We construct a secure, structured virtual data room containing all corporate documents, financial models, cap table schedules, and customer contracts organized to institutional standards.',
    deliverables: [
      'Structured Virtual Data Room (VDR) Hierarchy on Secured Google Drive',
      'Comprehensive Due Diligence Request List (Q&A Tracker & Index)',
      'Multi-Round Cap Table Waterfall & Option Pool Allocation Model',
      'Investor Q&A Simulation & Term Sheet Negotiation Strategy Session',
    ],
    integrationTools: ['Secured Google Workspace VDR', 'Cap Table Engine', 'Legal Due Diligence Index'],
    startingPrice: 'Institutional Advisory',
  },
  {
    id: 'executive-advisory-sprint',
    stageId: 'fundability',
    title: '1-on-1 Strategic Venture Sprint',
    turnaround: 'Immediate Scheduling',
    summary: 'Direct strategic counsel with senior venture advisors to refine narrative, overcome roadblocks, or prep investor pitch.',
    description:
      'Targeted high-impact strategy sessions focused on critical venture milestones: capital allocation, pitch refinement, pricing overhaul, or key stakeholder negotiations.',
    deliverables: [
      'Comprehensive Pre-Call Quantitative Asset Review',
      '90-Minute Dedicated High-Intensity Strategy & Advisory Session',
      'Actionable Post-Sprint Roadmap & Written Recommendation Memo',
      '7 Days of Asynchronous Direct Follow-Up Counsel',
    ],
    integrationTools: ['Google Meet', 'Collaborative Notes', 'Audio / Transcript Handover'],
    startingPrice: 'Per Sprint Session',
  },
];

export const MASTERCLASSES: MasterclassItem[] = [
  {
    id: 'mc-1',
    title: 'Constructing DCF Models that Withstand Institutional Scrutiny',
    stageId: 'fundability',
    duration: '48 Mins',
    instructor: 'Bizzbean Financial Advisory',
    description: 'Learn how professional venture capitalists deconstruct your revenue drivers, discount rates, terminal value, and working capital cycles.',
    format: 'Video Masterclass',
    takeaway: 'Full downloadable DCF Excel/Google Sheets template with macro-free formulas.',
  },
  {
    id: 'mc-2',
    title: 'The Cash Flow Runway Safeguard: Avoiding Startup Sudden Death',
    stageId: 'sustainability',
    duration: '35 Mins',
    instructor: 'Bizzbean Operations Desk',
    description: 'Step-by-step methodology to implement zero-base operational budgeting, deferred liability tracking, and early warning cash burn tripwires.',
    format: 'Interactive Simulator',
    takeaway: 'Dynamic 13-week direct cash flow forecasting framework.',
  },
  {
    id: 'mc-3',
    title: 'Unit Economics Stress Testing: The 3:1 LTV-to-CAC Standard',
    stageId: 'viability',
    duration: '42 Mins',
    instructor: 'Bizzbean Venture Architecture',
    description: 'How to calculate real blended vs paid CAC, cohort churn rates, customer payback periods, and margin contributions with institutional accuracy.',
    format: 'Downloadable Model Kit',
    takeaway: 'Cohort retention calculator and unit economics stress-test workbook.',
  },
  {
    id: 'mc-4',
    title: 'Building an Investor Due Diligence Vault in Google Workspace',
    stageId: 'investability',
    duration: '55 Mins',
    instructor: 'Bizzbean Governance Practice',
    description: 'Standard taxonomy, permissions architecture, and document protocols required by top-tier venture funds and institutional lenders.',
    format: 'Executive Sprint',
    takeaway: 'Pre-structured 65-item virtual data room folder tree & audit tracker.',
  },
];

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 1,
    question: 'What is the current operational status of your product or service?',
    context: 'Helps pinpoint your venture foundation and immediate delivery requirements.',
    options: [
      {
        label: 'Concept or MVP in testing; validating customer willingness to pay',
        points: { viability: 3, fundability: 1, sustainability: 0, investability: 0 },
        stageHint: 'viability',
      },
      {
        label: 'Live product with initial revenue; preparing to raise institutional capital',
        points: { viability: 1, fundability: 3, sustainability: 1, investability: 0 },
        stageHint: 'fundability',
      },
      {
        label: 'Active operations generating consistent sales; optimizing cash burn and team workflow',
        points: { viability: 0, fundability: 1, sustainability: 3, investability: 1 },
        stageHint: 'sustainability',
      },
      {
        label: 'Established enterprise scaling aggressively; preparing for Series A/B or institutional due diligence',
        points: { viability: 0, fundability: 1, sustainability: 1, investability: 3 },
        stageHint: 'investability',
      },
    ],
  },
  {
    id: 2,
    question: 'How is your financial modeling and projection currently managed?',
    context: 'Evaluates your quantitative maturity and risk of capital misallocation.',
    options: [
      {
        label: 'Informal back-of-the-envelope calculations or static high-level budget',
        points: { viability: 3, fundability: 2, sustainability: 0, investability: 0 },
        stageHint: 'viability',
      },
      {
        label: 'Single spreadsheet with revenue forecasts, but lacks dynamic 3-statement integration or sensitivity',
        points: { viability: 1, fundability: 3, sustainability: 1, investability: 0 },
        stageHint: 'fundability',
      },
      {
        label: 'Monthly tracking exists, but runway forecasts are manual and disconnected from operational spending',
        points: { viability: 0, fundability: 1, sustainability: 3, investability: 1 },
        stageHint: 'sustainability',
      },
      {
        label: 'Comprehensive accounting in place, needing institutional DCF, cap table waterfall, and dataroom audit',
        points: { viability: 0, fundability: 1, sustainability: 1, investability: 3 },
        stageHint: 'investability',
      },
    ],
  },
  {
    id: 3,
    question: 'What is your primary commercial priority for the next 90 to 180 days?',
    context: 'Identifies the highest-leverage deliverable to deliver to your business.',
    options: [
      {
        label: 'Confirm customer demand, refine pricing structure, and validate unit margins',
        points: { viability: 3, fundability: 1, sustainability: 0, investability: 0 },
        stageHint: 'viability',
      },
      {
        label: 'Package our business narrative into a quantitative financial model and pitch deck for investors',
        points: { viability: 1, fundability: 3, sustainability: 1, investability: 0 },
        stageHint: 'fundability',
      },
      {
        label: 'Streamline team workflows with Google Workspace and extend cash runway without sacrificing growth',
        points: { viability: 0, fundability: 1, sustainability: 3, investability: 0 },
        stageHint: 'sustainability',
      },
      {
        label: 'Pass institutional due diligence, negotiate term sheets, and structure equity dilution',
        points: { viability: 0, fundability: 0, sustainability: 1, investability: 3 },
        stageHint: 'investability',
      },
    ],
  },
  {
    id: 4,
    question: 'How collaborative and integrated is your current venture tech stack?',
    context: 'Assesses execution velocity and information silos.',
    options: [
      {
        label: 'Disjointed notes, emails, and personal drives without standardized structure',
        points: { viability: 2, fundability: 2, sustainability: 1, investability: 0 },
        stageHint: 'viability',
      },
      {
        label: 'Standard tools used, but external advisors and team members lack live synchronized financial models',
        points: { viability: 1, fundability: 2, sustainability: 2, investability: 0 },
        stageHint: 'sustainability',
      },
      {
        label: 'Need enterprise-grade Google Workspace integration connecting budgeting, slide decks, and data rooms',
        points: { viability: 0, fundability: 1, sustainability: 3, investability: 1 },
        stageHint: 'sustainability',
      },
      {
        label: 'Fully organized internally, but requires external institutional virtual data room security and audit trail',
        points: { viability: 0, fundability: 0, sustainability: 1, investability: 3 },
        stageHint: 'investability',
      },
    ],
  },
];

export const QUANTIFIED_CASE_PROOFS = [
  {
    metric: '$3.4M',
    metricLabel: 'Capital Secured Across Seed & Series A',
    timeframe: 'Average 45-day investor diligence cycle',
    clientContext: 'SaaS & Enterprise B2B Clients',
    details: 'Deployed institutional 3-statement financial models and defensible DCF valuation that eliminated investor pushback during quantitative review.',
  },
  {
    metric: '+4.2 Months',
    metricLabel: 'Average Cash Runway Extended',
    timeframe: 'Within 60 days of deployment',
    clientContext: 'Growth-Stage Scaleups',
    details: 'Implemented working capital optimization and Google Workspace synchronized cash tracking to plug margin leaks before runway depletion.',
  },
  {
    metric: '100%',
    metricLabel: 'Due Diligence Data Room Pass Rate',
    timeframe: 'Zero institutional compliance delays',
    clientContext: 'Institutional Venture Audits',
    details: 'Every venture utilizing the Bizzbean Virtual Data Room structure passed institutional financial and corporate legal due diligence on schedule.',
  },
];
