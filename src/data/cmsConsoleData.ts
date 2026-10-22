import { TransactionRecord, ClientProfile, ClientNotification } from '../types';

export interface CmsCourseLesson {
  id: string;
  name: string;
  youtubeUrl: string;
  duration: string;
}

export interface CmsProduct {
  id: string;
  seq: number;
  type: 'app' | 'course';
  stage: 'vi-ability' | 'fund-ability' | 'sustain-ability' | 'invest-ability' | 'operations' | 'growth' | 'education';
  sku: string;
  name: string;
  subtitle: string;
  description: string;
  purpose: string;
  billingModel?: 'once-off' | 'monthly subscription';
  exclusivePriceZAR: number;
  vatZAR: number;
  sellingPriceZAR: number;
  tokensAllocated: number;
  ticketPriceZAR: number;
  isPurchased: boolean;
  activeInSync: boolean;
  // BizzApps Platform & Media properties (Merged from Page 6)
  canonicalCoverUrl?: string;
  youtubeDemoUrl?: string;
  assignedStep?: string;
  journeyMilestone?: string;
  modules?: string[];
  // Course Lessons properties (Merged from Page 7)
  syllabusLessonsCount?: number;
  lessonTitles?: string[];
  courseLessons?: CmsCourseLesson[];
  coursePromoVideoUrl?: string;
  companionMaterialFilename?: string;
}

export interface CmsVideo {
  id: string;
  title: string;
  author: string;
  duration: string;
  youtubeUrl: string;
  isMustWatch: boolean;
  category: string;
  linked: boolean;
}

export interface CmsArticle {
  id: string;
  title: string;
  summary: string;
  author: string;
  readTime: string;
  isMustRead: boolean;
  category: string;
  imageUrl?: string;
  content?: string;
  publishedDate?: string;
}

export interface CmsBookBundle {
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  youtubeVideoUrl: string;
  workbookFilename: string;
  isActive: boolean;
}

// FRESH INITIAL CMS DATA (CLEARED AND STRUCTURED FOR NEW START)
export const INITIAL_CMS_PRODUCTS: CmsProduct[] = [
  // --- VI-ABILITY STAGE ---
  {
    id: 'learn-earn-capital',
    seq: 1,
    type: 'course',
    stage: 'vi-ability',
    sku: 'BC-001',
    name: 'learn how to earn access to capital',
    subtitle: 'earn access to capital',
    description: 'This free course will teach you how to earn access to capital.',
    purpose: 'This free course will teach you how to earn access to capital.',
    billingModel: 'once-off',
    exclusivePriceZAR: 0,
    vatZAR: 0,
    sellingPriceZAR: 0,
    tokensAllocated: 0,
    ticketPriceZAR: 0,
    isPurchased: true,
    activeInSync: true,
    youtubeDemoUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg',
    coursePromoVideoUrl: 'https://www.youtube.com/watch?v=9dwqCG-vnVA',
    canonicalCoverUrl: '',
    syllabusLessonsCount: 3,
    lessonTitles: [
      'Lesson 01: The Founder Hypothesis vs. Customer Reality',
      'Lesson 02: Calculating Clean CAC without Platform Distortions',
      'Lesson 03: The Capital Access Gateway Checklist',
    ],
    courseLessons: [
      {
        id: 'cl-1-1',
        name: 'Lesson 01: The Founder Hypothesis vs. Customer Reality',
        youtubeUrl: 'https://www.youtube.com/watch?v=9dwqCG-vnVA',
        duration: '14:20',
      },
      {
        id: 'cl-1-2',
        name: 'Lesson 02: Calculating Clean CAC without Platform Distortions',
        youtubeUrl: 'https://www.youtube.com/watch?v=5L0wwsNFads',
        duration: '18:45',
      },
      {
        id: 'cl-1-3',
        name: 'Lesson 03: The Capital Access Gateway Checklist',
        youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg',
        duration: '12:10',
      },
    ],
    companionMaterialFilename: 'Capital_Access_Framework_v2.zip',
  },
  {
    id: 'bizzcalc',
    seq: 2,
    type: 'app',
    stage: 'vi-ability',
    sku: 'BA-001',
    name: 'bizzcalc',
    subtitle: 'Cost Recovery, Break-Even & Contribution Margin Simulator',
    description: 'Comprehensive cost recovery calculator enabling founders to cost products accurately and set price floors that prevent subsidized growth.',
    purpose: 'Eliminate under-pricing risk and establish verifiable contribution margins before commercial launch.',
    billingModel: 'once-off',
    exclusivePriceZAR: 199.13,
    vatZAR: 29.87,
    sellingPriceZAR: 229.00,
    tokensAllocated: 45.8,
    ticketPriceZAR: 274.80,
    isPurchased: true,
    activeInSync: true,
    canonicalCoverUrl: '',
    youtubeDemoUrl: 'https://www.youtube.com/watch?v=0--AvwZabIQ',
    assignedStep: 'Stage 1 · Step 2',
    journeyMilestone: 'Unit Margin Verification',
    modules: [
      'Overhead Reclaim Rate Matrix',
      'Fixed Expenditures Ledger Modeler',
      'Labor Hour vs. Machine Hour Driver Calibrator',
      'Break-Even Unit Sales Target Generator',
    ],
  },
  {
    id: 'bizzdynamics',
    seq: 3,
    type: 'app',
    stage: 'vi-ability',
    sku: 'BA-DYN',
    name: 'bizzdynamics',
    subtitle: 'learn about the financial dynamics of a business',
    description:
      'a business simulator, that shows how changes to key business elements, such as contribution, expenses, asset levels and funding strategies, will have on the financial results of a business - includes access to bizzcalc.',
    purpose:
      'a business simulator, that shows how changes to key business elements, such as contribution, expenses, asset levels and funding strategies, will have on the financial results of a business - includes access to bizzcalc.',
    billingModel: 'once-off',
    exclusivePriceZAR: 303.48,
    vatZAR: 45.52,
    sellingPriceZAR: 349.00,
    tokensAllocated: 69.8,
    ticketPriceZAR: 418.80,
    isPurchased: true,
    activeInSync: true,
    canonicalCoverUrl: '',
    youtubeDemoUrl: '',
    assignedStep: 'Stage 1 · Step 3',
    journeyMilestone: 'Financial Dynamics Simulator',
    modules: [
      '5-Year Base Rate Adjustment Engine',
      'Voice-Activated Monthly Schedule Controls',
      'Redacted Foundational Core (Setup, Revenue, Employment, Opex, Fixed Assets, Funding)',
      'Authentic V1 Financial Reports Suite',
    ],
  },
  {
    id: 'how-to-bizzcalc',
    seq: 3,
    type: 'course',
    stage: 'vi-ability',
    sku: 'BC-002',
    name: 'How to Use bizzcalc',
    subtitle: 'Practical Walkthrough & Cost Recovery Case Studies',
    description: 'Step-by-step masterclass demonstrating how to enter bills of materials (BOM), assign indirect labor, and audit gross margins.',
    purpose: 'Ensure every team member uses standardized cost-accounting formulas across quoting and invoicing.',
    billingModel: 'once-off',
    exclusivePriceZAR: 150.00,
    vatZAR: 22.50,
    sellingPriceZAR: 172.50,
    tokensAllocated: 35.0,
    ticketPriceZAR: 207.00,
    isPurchased: false,
    activeInSync: true,
    youtubeDemoUrl: 'https://www.youtube.com/watch?v=0--AvwZabIQ',
    coursePromoVideoUrl: 'https://www.youtube.com/watch?v=3wyZYsk8OTY',
    canonicalCoverUrl: '',
    syllabusLessonsCount: 2,
    lessonTitles: [
      'Lesson 01: Mapping Fixed vs. Variable Allocations',
      'Lesson 02: Real-World Manufacturing & SaaS Pricing Audits',
    ],
    courseLessons: [
      {
        id: 'cl-2-1',
        name: 'Lesson 01: Mapping Fixed vs. Variable Allocations',
        youtubeUrl: 'https://www.youtube.com/watch?v=0--AvwZabIQ',
        duration: '11:35',
      },
      {
        id: 'cl-2-2',
        name: 'Lesson 02: Real-World Manufacturing & SaaS Pricing Audits',
        youtubeUrl: 'https://www.youtube.com/watch?v=3wyZYsk8OTY',
        duration: '16:50',
      },
    ],
    companionMaterialFilename: 'Bizzcalc_Companion_Templates.zip',
  },


  // --- FUND-ABILITY STAGE ---
  {
    id: 'bizzmodel',
    seq: 1,
    type: 'app',
    stage: 'fund-ability',
    sku: 'BA-002',
    name: 'bizzmodel',
    subtitle: '3-Statement Financial Simulator with Dynamic Dials',
    description: 'Macro-free financial forecasting engine linking Income Statement, Balance Sheet, and Cash Flow with dynamic sensitivity dials.',
    purpose: 'Equip founders with investor-ready models that withstand Series Seed/A venture due diligence audits.',
    billingModel: 'once-off',
    exclusivePriceZAR: 486.96,
    vatZAR: 73.04,
    sellingPriceZAR: 560.00,
    tokensAllocated: 112.0,
    ticketPriceZAR: 672.00,
    isPurchased: true,
    activeInSync: true,
    canonicalCoverUrl: '',
    youtubeDemoUrl: '',
    assignedStep: 'Stage 2 · Step 1',
    journeyMilestone: 'Institutional Model Ready',
    modules: [
      '36-Month 3-Statement Forecast Engine',
      'ARR Multiple & DCF Valuation Bridge',
      'Dynamic Runway Driver Dials',
      'Google Sheets Macro-Free Live Connector',
    ],
  },
  {
    id: 'bizzplan',
    seq: 2,
    type: 'app',
    stage: 'fund-ability',
    sku: 'BA-003',
    name: 'bizzplan',
    subtitle: 'Executive Memorandums & Investment Pitch Synthesis',
    description: 'Structured narrative builder translating quantitative models into institutional executive memorandums and pitch decks.',
    purpose: 'Bridge numbers with story so investors understand market moats and capital allocation efficiency.',
    billingModel: 'once-off',
    exclusivePriceZAR: 346.96,
    vatZAR: 52.04,
    sellingPriceZAR: 399.00,
    tokensAllocated: 80.0,
    ticketPriceZAR: 478.80,
    isPurchased: false,
    activeInSync: true,
    canonicalCoverUrl: '',
    assignedStep: 'Stage 2 · Step 7',
    modules: ['Venture Memo Generator', 'Cap Table Snapshot Exporter', 'Risk Matrix Builder'],
  },
  {
    id: 'cost-recovery-calculator',
    seq: 3,
    type: 'course',
    stage: 'fund-ability',
    sku: 'BC-003',
    name: 'Cost Recovery Calculator',
    subtitle: 'Cost Recovery, Break-Even & Contribution Margin Masterclass',
    description: 'Master practical production costing, employee rates, material dynamics, and fixed asset depreciation to ensure 100% cost recovery.',
    purpose: 'Learn how to accurately cost products and ensure sustainable break-even unit sales.',
    billingModel: 'once-off',
    exclusivePriceZAR: 199.13,
    vatZAR: 29.87,
    sellingPriceZAR: 229.00,
    tokensAllocated: 45.8,
    ticketPriceZAR: 274.80,
    isPurchased: true,
    activeInSync: true,
    youtubeDemoUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg',
    coursePromoVideoUrl: 'https://www.youtube.com/watch?v=9dwqCG-vnVA',
    canonicalCoverUrl: '',
    syllabusLessonsCount: 7,
    lessonTitles: [
      '1 - INTRODUCTION',
      '2 - PRODUCTION CALCULATOR',
      '3 - EMPLOYEE CALCULATOR',
      '4 - MATERIALS COSTING',
      '5 - EXPENSE DYNAMICS',
      '6 - FIXED ASSETS',
      '7 - EMPLOYMENT EXPENSES',
    ],
    courseLessons: [
      {
        id: 'crc-1',
        name: '1 - INTRODUCTION',
        duration: '4 min',
        youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg',
      },
      {
        id: 'crc-2',
        name: '2 - PRODUCTION CALCULATOR',
        duration: '7 min',
        youtubeUrl: 'https://www.youtube.com/watch?v=9dwqCG-vnVA',
      },
      {
        id: 'crc-3',
        name: '3 - EMPLOYEE CALCULATOR',
        duration: '9 min',
        youtubeUrl: 'https://www.youtube.com/watch?v=5L0wwsNFads',
      },
      {
        id: 'crc-4',
        name: '4 - MATERIALS COSTING',
        duration: '6 min',
        youtubeUrl: 'https://www.youtube.com/watch?v=YiUirHhqBoc',
      },
      {
        id: 'crc-5',
        name: '5 - EXPENSE DYNAMICS',
        duration: '8 min',
        youtubeUrl: 'https://www.youtube.com/watch?v=r6h0R1sDx50',
      },
      {
        id: 'crc-6',
        name: '6 - FIXED ASSETS',
        duration: '7 min',
        youtubeUrl: 'https://www.youtube.com/watch?v=xbasHzq2fL0',
      },
      {
        id: 'crc-7',
        name: '7 - EMPLOYMENT EXPENSES',
        duration: '10 min',
        youtubeUrl: 'https://www.youtube.com/watch?v=DiVPAjgmnj0',
      },
    ],
    companionMaterialFilename: 'Cost_Recovery_Calculator_Workbook.zip',
  },
  {
    id: 'follow-the-money',
    seq: 4,
    type: 'course',
    stage: 'fund-ability',
    sku: 'BC-004',
    name: 'follow the money',
    subtitle: 'Cash Conversion Cycles & Capital Velocity',
    description: 'Track venture cash burn, debtor lag, and working capital recovery curves.',
    purpose: 'Understand how cash velocity determines venture solvency.',
    billingModel: 'once-off',
    exclusivePriceZAR: 249.00,
    vatZAR: 37.35,
    sellingPriceZAR: 286.35,
    tokensAllocated: 50.0,
    ticketPriceZAR: 343.62,
    isPurchased: true,
    activeInSync: true,
    canonicalCoverUrl: '',
    syllabusLessonsCount: 3,
    lessonTitles: ['1 - CASH CONVERSION CYCLE', '2 - WORKING CAPITAL RECOVERY', '3 - RECEIVABLES VELOCITY'],
    courseLessons: [
      { id: 'ftm-1', name: '1 - CASH CONVERSION CYCLE', duration: '5 min', youtubeUrl: 'https://www.youtube.com/watch?v=xbasHzq2fL0' },
      { id: 'ftm-2', name: '2 - WORKING CAPITAL RECOVERY', duration: '8 min', youtubeUrl: 'https://www.youtube.com/watch?v=DiVPAjgmnj0' },
      { id: 'ftm-3', name: '3 - RECEIVABLES VELOCITY', duration: '12 min', youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg' },
    ],
    companionMaterialFilename: 'Follow_The_Money_Workbook.zip',
  },
  {
    id: 'financial-reports',
    seq: 5,
    type: 'course',
    stage: 'fund-ability',
    sku: 'BC-005',
    name: 'financial reports',
    subtitle: 'Auditing 3-Statement Forecasting & Dilution Scenarios',
    description: 'Master Income Statement, Balance Sheet, and Cash Flow reconciliation for investor defense.',
    purpose: 'Prepare audit-proof 3-statement financial models.',
    billingModel: 'once-off',
    exclusivePriceZAR: 299.00,
    vatZAR: 44.85,
    sellingPriceZAR: 343.85,
    tokensAllocated: 60.0,
    ticketPriceZAR: 412.62,
    isPurchased: true,
    activeInSync: true,
    canonicalCoverUrl: '',
    syllabusLessonsCount: 3,
    lessonTitles: ['1 - 3-STATEMENT RECONCILIATION', '2 - EBITDA VS FREE CASH FLOW', '3 - BALANCE SHEET STRESS TEST'],
    courseLessons: [
      { id: 'fr-1', name: '1 - 3-STATEMENT RECONCILIATION', duration: '6 min', youtubeUrl: 'https://www.youtube.com/watch?v=9dwqCG-vnVA' },
      { id: 'fr-2', name: '2 - EBITDA VS FREE CASH FLOW', duration: '10 min', youtubeUrl: 'https://www.youtube.com/watch?v=YiUirHhqBoc' },
      { id: 'fr-3', name: '3 - BALANCE SHEET STRESS TEST', duration: '14 min', youtubeUrl: 'https://www.youtube.com/watch?v=r6h0R1sDx50' },
    ],
    companionMaterialFilename: 'Financial_Reports_Model.zip',
  },

  // --- SUSTAIN-ABILITY STAGE ---
  {
    id: 'sustain-runway',
    seq: 1,
    type: 'app',
    stage: 'sustain-ability',
    sku: 'BA-004',
    name: 'sustain-RUNWAY',
    subtitle: 'Working Capital & Operational Runway Safeguards',
    description: 'Diagnostic tool that tracks overhead-to-revenue ratios and surfaces non-essential expenditures before they drain runway.',
    purpose: 'Extend net cash runway by 35% through operational discipline without slowing customer acquisition.',
    billingModel: 'once-off',
    exclusivePriceZAR: 326.09,
    vatZAR: 48.91,
    sellingPriceZAR: 375.00,
    tokensAllocated: 75.0,
    ticketPriceZAR: 450.00,
    isPurchased: false,
    activeInSync: true,
    canonicalCoverUrl: '',
    assignedStep: 'Stage 3 · Step 3',
    modules: ['Working Capital Leakage Auditor', 'Vendor Terms Re-negotiation Assistant', 'Overhead Benchmarks'],
  },
  {
    id: 'profit-optimizer',
    seq: 2,
    type: 'course',
    stage: 'sustain-ability',
    sku: 'BC-003',
    name: 'Profit Optimizer',
    subtitle: 'Operational Margin Defense & Contribution Discipline',
    description: 'Masterclass on dissecting operational expenditures, eliminating SaaS sprawl, and structuring departmental contribution margins to protect cash runway.',
    purpose: 'Empower founders to trim fat, eliminate margin leaks, and protect operational runway without sacrificing customer acquisition.',
    billingModel: 'once-off',
    exclusivePriceZAR: 199.13,
    vatZAR: 29.87,
    sellingPriceZAR: 229.00,
    tokensAllocated: 45.8,
    ticketPriceZAR: 274.80,
    isPurchased: false,
    activeInSync: true,
    canonicalCoverUrl: '',
    youtubeDemoUrl: '',
    coursePromoVideoUrl: '',
    assignedStep: 'Stage 3 · Step 4',
    journeyMilestone: 'Margin Defense & Runway Optimization',
    syllabusLessonsCount: 3,
    lessonTitles: [
      'Lesson 01: Auditing Discretionary Overhead & Vendor Creep',
      'Lesson 02: Recalibrating Unit Contribution Margins',
      'Lesson 03: The 18-Month Runway Safeguard Checklist',
    ],
    courseLessons: [
      {
        id: 'po-1',
        name: 'Lesson 01: Auditing Discretionary Overhead & Vendor Creep',
        youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg',
        duration: '14:10',
      },
      {
        id: 'po-2',
        name: 'Lesson 02: Recalibrating Unit Contribution Margins',
        youtubeUrl: 'https://www.youtube.com/watch?v=3wyZYsk8OTY',
        duration: '16:30',
      },
      {
        id: 'po-3',
        name: 'Lesson 03: The 18-Month Runway Safeguard Checklist',
        youtubeUrl: 'https://www.youtube.com/watch?v=xbasHzq2fL0',
        duration: '12:45',
      },
    ],
    companionMaterialFilename: 'Profit_Optimizer_Worksheet.zip',
  },
  {
    id: 'financial-scenario-planning',
    seq: 3,
    type: 'course',
    stage: 'sustain-ability',
    sku: 'BC-008',
    name: 'financial scenario planning',
    subtitle: 'venture growth engine',
    description: 'Dynamic operational drivers, headcount scaling, runway alarm thresholds, and multi-scenario forecasting.',
    purpose: 'Model venture sensitivity across base, bear, and bull operating environments.',
    billingModel: 'once-off',
    exclusivePriceZAR: 299.00,
    vatZAR: 44.85,
    sellingPriceZAR: 343.85,
    tokensAllocated: 60.0,
    ticketPriceZAR: 412.62,
    isPurchased: true,
    activeInSync: true,
    canonicalCoverUrl: '',
    syllabusLessonsCount: 3,
    lessonTitles: [
      '1 - BASE, BULL & BEAR SCENARIO MATRIX',
      '2 - RUNWAY ALARM & WORKING CAPITAL DRIFT',
      '3 - REVENUE DRIVERS & SENSITIVITY MODELING',
    ],
    courseLessons: [
      { id: 'fsp-1', name: '1 - BASE, BULL & BEAR SCENARIO MATRIX', duration: '8 min', youtubeUrl: 'https://www.youtube.com/watch?v=9dwqCG-vnVA' },
      { id: 'fsp-2', name: '2 - RUNWAY ALARM & WORKING CAPITAL DRIFT', duration: '12 min', youtubeUrl: 'https://www.youtube.com/watch?v=DiVPAjgmnj0' },
      { id: 'fsp-3', name: '3 - REVENUE DRIVERS & SENSITIVITY MODELING', duration: '15 min', youtubeUrl: 'https://www.youtube.com/watch?v=5L0wwsNFads' },
    ],
    companionMaterialFilename: 'Financial_Scenario_Modeler.zip',
  },
  {
    id: 'annual-business-planning-cycle',
    seq: 4,
    type: 'course',
    stage: 'sustain-ability',
    sku: 'BC-009',
    name: 'annual business planning cycle',
    subtitle: 'professionalize your business',
    description: 'Annual operating cadence, departmental budget reconciliation, CapEx allocations, and quarterly variance audits.',
    purpose: 'Standardize quarterly executive board packs and annual budget reviews.',
    billingModel: 'once-off',
    exclusivePriceZAR: 299.00,
    vatZAR: 44.85,
    sellingPriceZAR: 343.85,
    tokensAllocated: 60.0,
    ticketPriceZAR: 412.62,
    isPurchased: true,
    activeInSync: true,
    canonicalCoverUrl: '',
    syllabusLessonsCount: 3,
    lessonTitles: [
      '1 - ANNUAL OPERATING CADENCE & MILESTONES',
      '2 - DEPARTMENTAL BUDGET RECONCILIATION',
      '3 - QUARTERLY VARIANCE AUDITS & BOARD PACK',
    ],
    courseLessons: [
      { id: 'abp-1', name: '1 - ANNUAL OPERATING CADENCE & MILESTONES', duration: '7 min', youtubeUrl: 'https://www.youtube.com/watch?v=YiUirHhqBoc' },
      { id: 'abp-2', name: '2 - DEPARTMENTAL BUDGET RECONCILIATION', duration: '11 min', youtubeUrl: 'https://www.youtube.com/watch?v=r6h0R1sDx50' },
      { id: 'abp-3', name: '3 - QUARTERLY VARIANCE AUDITS & BOARD PACK', duration: '14 min', youtubeUrl: 'https://www.youtube.com/watch?v=xbasHzq2fL0' },
    ],
    companionMaterialFilename: 'Annual_Planning_Cycle_Playbook.zip',
  },

  // --- INVEST-ABILITY STAGE ---
  {
    id: 'invest-vdr',
    seq: 1,
    type: 'app',
    stage: 'invest-ability',
    sku: 'BA-005',
    name: 'invest-ABILITY VDR',
    subtitle: '40-Point Due Diligence Virtual Data Room Matrix',
    description: 'Structured Virtual Data Room architecture with pre-indexed Google Drive folder structures, cap table waterfalls, and audit checklist.',
    purpose: 'Pass venture audits with zero governance friction and complete transaction closing 3x faster.',
    billingModel: 'once-off',
    exclusivePriceZAR: 565.22,
    vatZAR: 84.78,
    sellingPriceZAR: 650.00,
    tokensAllocated: 130.0,
    ticketPriceZAR: 780.00,
    isPurchased: false,
    activeInSync: true,
    canonicalCoverUrl: '',
    assignedStep: 'Stage 4 · Step 1',
    modules: ['40-Point VDR Folder Hierarchy', 'Cap Table Dilution Simulator', 'Term Sheet Checklist'],
  },

  // --- OPERATIONS STAGE (Added per Page 8 proposal) ---
  {
    id: 'bizzmoney',
    seq: 1,
    type: 'app',
    stage: 'operations',
    sku: 'BA-006',
    name: 'bizzmoney',
    subtitle: 'Double-Entry Accounting & 62-Account Ledger Architecture',
    description: 'Standardized double-entry chart of accounts linking Assets, Liabilities, Equity, Revenue, and OpEx with voice instruction input.',
    purpose: 'Eliminate chaotic bookkeeping by enforcing institutional accounting architecture from day one.',
    billingModel: 'monthly subscription',
    exclusivePriceZAR: 295.65,
    vatZAR: 44.35,
    sellingPriceZAR: 340.00,
    tokensAllocated: 68.0,
    ticketPriceZAR: 408.00,
    isPurchased: true,
    activeInSync: true,
    canonicalCoverUrl: '',
    assignedStep: 'Operations · Core',
    modules: ['62-Account General Ledger', 'Voice-to-Transaction Input', 'VAT 15% Automated Accrual', 'Google Sheets Bridge'],
  },
  {
    id: 'budget',
    seq: 2,
    type: 'app',
    stage: 'operations',
    sku: 'BA-007',
    name: 'bizzbudget',
    subtitle: 'Rolling Cash Flow Allocations & Variance Reporting',
    description: 'Zero-based budgeting engine comparing planned vs. actual departmental expenditures on a weekly rolling horizon.',
    purpose: 'Prevent surprise cash shortfalls through real-time variance alarms.',
    billingModel: 'once-off',
    exclusivePriceZAR: 226.09,
    vatZAR: 33.91,
    sellingPriceZAR: 260.00,
    tokensAllocated: 52.0,
    ticketPriceZAR: 312.00,
    isPurchased: false,
    activeInSync: true,
    canonicalCoverUrl: '',
    assignedStep: 'Operations · Rolling',
    modules: ['Rolling 13-Week Cash Horizon', 'Variance Tracking Alert Engine', 'Departmental Cost Centers'],
  },
  {
    id: 'bizzoptimizer',
    seq: 3,
    type: 'app',
    stage: 'operations',
    sku: 'BA-008',
    name: 'bizzoptimizer',
    subtitle: 'Margin Trimmer & Working Capital Optimizer',
    description: 'Algorithmic operational analysis that surfaces margin leaks, renegotiation opportunities, and working capital acceleration levers.',
    purpose: 'Empower founders to trim fat and optimize net profit contribution per operational department.',
    billingModel: 'once-off',
    exclusivePriceZAR: 252.17,
    vatZAR: 37.83,
    sellingPriceZAR: 290.00,
    tokensAllocated: 58.0,
    ticketPriceZAR: 348.00,
    isPurchased: false,
    activeInSync: true,
    canonicalCoverUrl: '',
    assignedStep: 'Operations · Margins',
    modules: ['Vendor Subscription Leak Detector', 'Debtor Collection Acceleration', 'Margin Calibration'],
  },
  {
    id: 'your-first-hire',
    seq: 4,
    type: 'course',
    stage: 'operations',
    sku: 'BC-006',
    name: 'your first hire',
    subtitle: 'Labor Costing, Quotas & Contribution Economics',
    description: 'Calculate fully burdened salary rates, onboarding lag, and revenue contribution quotas before recruiting.',
    purpose: 'Prevent premature scaling and headcount-driven cash burn.',
    billingModel: 'once-off',
    exclusivePriceZAR: 199.00,
    vatZAR: 29.85,
    sellingPriceZAR: 228.85,
    tokensAllocated: 40.0,
    ticketPriceZAR: 274.62,
    isPurchased: true,
    activeInSync: true,
    canonicalCoverUrl: '',
    syllabusLessonsCount: 3,
    lessonTitles: ['1 - FULLY BURDENED LABOR RATE', '2 - HIRING REVENUE MULTIPLE', '3 - EMPLOYEE CONTRIBUTION QUOTA'],
    courseLessons: [
      { id: 'yfh-1', name: '1 - FULLY BURDENED LABOR RATE', duration: '5 min', youtubeUrl: 'https://www.youtube.com/watch?v=0--AvwZabIQ' },
      { id: 'yfh-2', name: '2 - HIRING REVENUE MULTIPLE', duration: '9 min', youtubeUrl: 'https://www.youtube.com/watch?v=3wyZYsk8OTY' },
      { id: 'yfh-3', name: '3 - EMPLOYEE CONTRIBUTION QUOTA', duration: '8 min', youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg' },
    ],
    companionMaterialFilename: 'First_Hire_Costing_Template.zip',
  },

  // --- GROWTH STAGE (Added per Page 8 proposal - marked as placeholder for later) ---
  {
    id: 'growth-strategy',
    seq: 1,
    type: 'app',
    stage: 'growth',
    sku: 'BA-008',
    name: 'growth-STRATEGY',
    subtitle: 'Competitive Moats, Market Expansion & Scenario Modeler',
    description: 'Advanced strategic scenario modeling tool for scaling enterprises graduating from startup phases.',
    purpose: 'Test pricing shifts, channel expansion, and acquisition scenarios in a risk-free digital environment.',
    billingModel: 'once-off',
    exclusivePriceZAR: 695.65,
    vatZAR: 104.35,
    sellingPriceZAR: 800.00,
    tokensAllocated: 160.0,
    ticketPriceZAR: 960.00,
    isPurchased: false,
    activeInSync: true,
    assignedStep: 'Growth · Step 1',
    modules: ['Channel Economics Modeler', 'Pricing Elasticity Curve', 'Competitive Moat Heatmap'],
  },
];

// EDUCATIONAL VIDEOS REPOSITORY (14 Videos - Left as is per Page 1)
export const INITIAL_CMS_VIDEOS: CmsVideo[] = [
  {
    id: 'vid-1',
    title: 'How to write a perfect elevator pitch',
    author: 'Rich Mulholland',
    duration: '5:32',
    youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg',
    isMustWatch: true,
    category: 'pitching',
    linked: true,
  },
  {
    id: 'vid-2',
    title: 'Unit economics and contribution margin in venture startups',
    author: 'Elena Vance',
    duration: '8:45',
    youtubeUrl: 'https://www.youtube.com/watch?v=9dwqCG-vnVA',
    isMustWatch: true,
    category: 'finance',
    linked: true,
  },
  {
    id: 'vid-3',
    title: "Warren Buffett's value investing formula",
    author: 'Benjamin Graham',
    duration: '16:02',
    youtubeUrl: 'https://www.youtube.com/watch?v=5L0wwsNFads',
    isMustWatch: false,
    category: 'investing',
    linked: true,
  },
  {
    id: 'vid-4',
    title: 'Understanding working capital and debtor lag',
    author: 'Quentin McCullough',
    duration: '11:20',
    youtubeUrl: 'https://www.youtube.com/watch?v=xbasHzq2fL0',
    isMustWatch: true,
    category: 'operations',
    linked: true,
  },
  {
    id: 'vid-5',
    title: 'Cap table waterfalls and venture dilution scenarios',
    author: 'GIM Coach',
    duration: '14:15',
    youtubeUrl: 'https://www.youtube.com/watch?v=YiUirHhqBoc',
    isMustWatch: true,
    category: 'capital',
    linked: true,
  },
  {
    id: 'vid-6',
    title: 'The illuminated sandbox: Why simulation prevents enterprise failure',
    author: 'Bizzbean Team',
    duration: '7:50',
    youtubeUrl: 'https://www.youtube.com/watch?v=3wyZYsk8OTY',
    isMustWatch: false,
    category: 'sandbox',
    linked: true,
  },
];

// ARTICLES & ANALYSIS REPOSITORY (Business Education Thought-Pieces - No Fallback Images)
export const INITIAL_CMS_ARTICLES: CmsArticle[] = [
  {
    id: 'art-decision-checkpoint',
    title: 'make the financial model a decision checkpoint',
    summary: 'Why dynamic forecasting transforms static spreadsheets into operational governance engines, forcing leadership teams to confront unit economic reality before deploying capital.',
    author: 'Quentin McCullough',
    readTime: '4 min read',
    isMustRead: true,
    category: 'finance',
    imageUrl: '',
    publishedDate: '15 October 2026',
    content: `Why dynamic forecasting transforms static spreadsheets into operational governance engines, forcing leadership teams to confront unit economic reality before deploying capital.

Too many founders treat financial modeling as pitch-deck theater—a decorative artifact constructed to satisfy an investor's curiosity and immediately filed away once term sheets are signed.

When the financial model is engineered as an active decision checkpoint, every hiring requisition, vendor contract, and product SKU pricing change must first be stress-tested against the model's contribution margin engine before capital is committed.`,
  },
  {
    id: 'art-earn-access',
    title: 'EARN access to capital',
    summary: 'Capital is not won through pitch deck rhetoric; it is earned through verifiable contribution margins, disciplined CAC payback, and pre-build customer commitment.',
    author: 'Quentin McCullough',
    readTime: '5 min read',
    isMustRead: true,
    category: 'vi-ability',
    imageUrl: '',
    publishedDate: '18 October 2026',
    content: `Capital is not won through pitch deck rhetoric; it is earned through verifiable contribution margins, disciplined CAC payback, and pre-build customer commitment.

In the startup ecosystem, external funding is often celebrated as the milestone itself, rather than an accelerant for an already validated value engine. When you mathematically prove that customers willingly exchange currency for your solution at positive unit margins, access to capital transitions from a speculative pitch into an inevitable commercial transaction.`,
  },
  {
    id: 'art-professionalizing',
    title: 'professionalizing your business',
    summary: 'Transitioning from founder-led instinct to institutional operational discipline: governance protocols, clean general ledgers, and repeatable reporting cadence.',
    author: 'Quentin McCullough',
    readTime: '4 min read',
    isMustRead: true,
    category: 'operations',
    imageUrl: '',
    publishedDate: '22 October 2026',
    content: `Transitioning from founder-led instinct to institutional operational discipline: governance protocols, clean general ledgers, and repeatable reporting cadence.

Early-stage ventures survive on agility and founder intuition. Scaling ventures, however, collapse under informal agreements and unrecorded liabilities. Professionalizing your business means instilling standard double-entry accounting, verifiable delegation matrices, and audit-ready reporting cycles that ensure continuity independent of any single executive.`,
  },
  {
    id: 'art-innovation-lab',
    title: 'innovation laboratory',
    summary: 'How to build a continuous hypothesis testing engine without diluting core operational execution or subsidizing unprofitable product features.',
    author: 'GIM Advisory',
    readTime: '3 min read',
    isMustRead: false,
    category: 'strategy',
    imageUrl: '',
    publishedDate: '26 October 2026',
    content: `How to build a continuous hypothesis testing engine without diluting core operational execution or subsidizing unprofitable product features.

Innovation is not undisciplined ideation; it is systematic risk reduction. By isolating product experiments inside a dedicated testing sandbox, founders can stress-test customer demand, pricing tolerance, and feature utility with minimal burn before committing engineering bandwidth.`,
  },
  {
    id: 'art-prep-checklist',
    title: 'preparation checklist',
    summary: 'The non-negotiable legal, corporate, and financial audit artifacts required before opening transaction due diligence to institutional investors.',
    author: 'Elena Vance',
    readTime: '4 min read',
    isMustRead: true,
    category: 'due-diligence',
    imageUrl: '',
    publishedDate: '29 October 2026',
    content: `The non-negotiable legal, corporate, and financial audit artifacts required before opening transaction due diligence to institutional investors.

Investor due diligence fails more often due to disorganized records, unassigned intellectual property, and undocumented options than flawed product vision. Maintaining a transaction-ready virtual data room with verified cap table waterfalls, statutory tax clearances, and audited supplier agreements keeps term sheet negotiations moving without delay.`,
  },
  {
    id: 'art-planning-workshop',
    title: 'planning workshop',
    summary: 'A step-by-step facilitation guide for running quarterly strategy sessions that stress-test revenue drivers, operational bottlenecks, and cash allocations.',
    author: 'Quentin McCullough',
    readTime: '5 min read',
    isMustRead: false,
    category: 'planning',
    imageUrl: '',
    publishedDate: '02 November 2026',
    content: `A step-by-step facilitation guide for running quarterly strategy sessions that stress-test revenue drivers, operational bottlenecks, and cash allocations.

Executive planning workshops should not be generic brainstorming exercises. They are rigorous alignment forums where departmental roadmaps are directly mapped to runway preservation, milestone completion, and contribution margin expansion.`,
  },
  {
    id: 'art-budget',
    title: 'budget',
    summary: 'Moving beyond static annual spreadsheets: why rolling 13-week cash allocation variance engines prevent catastrophic cash burn and expense creep.',
    author: 'GIM Advisory',
    readTime: '3 min read',
    isMustRead: true,
    category: 'budgeting',
    imageUrl: '',
    publishedDate: '05 November 2026',
    content: `Moving beyond static annual spreadsheets: why rolling 13-week cash allocation variance engines prevent catastrophic cash burn and expense creep.

Annual budgets become obsolete within thirty days of market reality. A dynamic 13-week cash allocation framework forces active trade-off decisions each week, giving leadership real-time visibility into variance drift before it threatens payroll or vendor obligations.`,
  },
  {
    id: 'art-operational-plan',
    title: 'operational plan',
    summary: 'Mapping headcount, vendor commitments, and operational milestones to cash flow milestones so every hire and contract is justified by unit margins.',
    author: 'Elena Vance',
    readTime: '4 min read',
    isMustRead: false,
    category: 'operations',
    imageUrl: '',
    publishedDate: '08 November 2026',
    content: `Mapping headcount, vendor commitments, and operational milestones to cash flow milestones so every hire and contract is justified by unit margins.

An operational plan without financial linkage is wishful thinking. By synchronizing deliverables, team capacity, and operational workflows with verifiable unit margins, founders build resilient companies that scale with mathematical certainty.`,
  },
  {
    id: 'art-entrepreneur',
    title: 'Are you an entrepreneur?',
    summary: 'Are entrepreneurs born or are they nurtured? I do not know the answer to that, but I do know one thing that most entrepreneurs share: an obsession with solving friction.',
    author: 'Quentin McCullough',
    readTime: '3 min read',
    isMustRead: false,
    category: 'mindset',
    imageUrl: '',
    publishedDate: '12 October 2026',
    content: `Are entrepreneurs born or are they nurtured? I do not know the answer to that, but I do know one thing that most entrepreneurs share: an obsession with solving friction.

Most people experience friction in the world and complain about it. The entrepreneur experiences friction and immediately begins conceptualizing a system, a product, or a protocol to remove that friction permanently.

To build a viable business, however, obsessive curiosity is not enough. You must anchor that curiosity to verifiable unit margins, repeatable customer acquisition channels, and rigorous financial discipline. In the Bizzbean ecosystem, we call this the journey from instinct to institutional readiness.`,
  },
  {
    id: 'art-products-touchpoint',
    title: 'Products as a touch-point',
    summary: 'There is no business unless there is a product. The product may be something you have invented; it may be something you re-sell. But the transaction defines value.',
    author: 'Quentin McCullough',
    readTime: '3 min read',
    isMustRead: false,
    category: 'product',
    imageUrl: '',
    publishedDate: '18 October 2026',
    content: `There is no business unless there is a product. The product may be something you have invented; it may be something you re-sell. But the transaction defines value.

Too many founders fall in love with the engineering elegance of their solution before stress-testing whether customers will willingly exchange currency for it. A product is simply the vehicle through which value is delivered and captured.

When calibrating your product pricing in tools like bizzcalc, every bill of materials, hourly labor cost, and overhead allocation must be accounted for so that each transaction strengthens the underlying company rather than subsidizing unprofitable scale.`,
  },
];

// BOOK & WORKBOOK BUNDLE (Left as is per Page 4)
export const INITIAL_CMS_BOOK_BUNDLE: CmsBookBundle = {
  title: 'getting to value book & workbook bundle',
  subtitle: 'Official Getting to Value publication: cover artwork, video walkthrough review, and companion Excel workbook bundle.',
  description: 'The definitive handbook detailing the 4 Stages of enterprise viability, from initial hypothesis testing to institutional capital due diligence.',
  coverImage: '/media/book_cover_main.jpg',
  youtubeVideoUrl: 'https://www.youtube.com/embed/book_review_hd',
  workbookFilename: 'Getting_To_Value_Companion_Suite_v2.xlsx',
  isActive: true,
};

// ADMINISTRATION CENTRE DATA STRUCTURES
export interface CmsInquiry {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  date: string;
  status: 'new' | 'reviewed' | 'resolved';
}

export interface CmsAssociateImport {
  id: string;
  batchName: string;
  organization: string;
  candidateCount: number;
  tokensPerAccount: number;
  date: string;
  status: 'provisioned' | 'pending';
}

export interface CmsSponsorAccount {
  id: string;
  sponsorName: string;
  tier: 'Enterprise' | 'Accelerator' | 'Govt Development Agency';
  sponsoredSeats: number;
  contactPerson: string;
  status: 'active' | 'renewal';
}

export type { TransactionRecord, ClientProfile, ClientNotification } from '../types';

export interface CmsTransactionRecord {
  id: string;
  timestamp: string;
  userEmail: string;
  action: 'unlock_solution' | 'token_grant' | 'subscription' | 'export';
  solutionName: string;
  tokensUsed: number;
  amountZAR: number;
}

export interface CmsPolicyRegistryItem {
  id: string;
  title: string;
  category: 'POPIA & Privacy' | 'Terms of Service' | 'Tokenomics Governance' | 'VDR Security Protocol';
  version: string;
  lastUpdated: string;
  status: 'active' | 'draft';
}

export interface CmsBizzyTooltip {
  id: string;
  pageRoute: string;
  elementSelector: string;
  headline: string;
  promptGuidance: string;
}

export interface CmsPromotionEmail {
  id: string;
  campaignName: string;
  targetSegment: string;
  subject: string;
  previewHeader: string;
  headline: string;
  bodyText: string;
  highlightedSolution: string;
  ctaLabel: string;
  ctaUrl: string;
  tokensIncluded: number;
  senderPersona: string;
  status: 'ready' | 'draft' | 'dispatched';
  sentCount: number;
  openRate: string;
  clickRate: string;
  lastDispatched: string;
}

export const INITIAL_CMS_PROMOTION_EMAILS: CmsPromotionEmail[] = [
  {
    id: 'promo-mail-01',
    campaignName: 'Personal Founder Welcome & Sandbox Grant',
    targetSegment: 'Newly Registered Founders & Sandbox Explorers',
    subject: 'Welcome to Bizzbean: Claim your 500 BizzTokens & launch your sandbox',
    previewHeader: 'Your private executive workstation is ready with zero formula breakage.',
    headline: 'Welcome to The Illuminated Sandbox',
    bodyText: 'Dear {{founder_name}},\n\nCongratulations on launching {{company_name}} into bizz-DESK. As an entrepreneurial partner, we are committed to building your venture into a capital-ready enterprise of sustainable value.\n\nWe have credited your account with 500 complimentary BizzTokens so you can model unit economics, stress-test your break-even point with bizzcalc, and begin your first financial sprint.',
    highlightedSolution: 'vi-ABILITY (bizzcalc)',
    ctaLabel: 'Enter Workstation & Claim Tokens',
    ctaUrl: '/workarea/vi-ability',
    tokensIncluded: 500,
    senderPersona: 'Coach GIM · Bizzbean Desk',
    status: 'ready',
    sentCount: 142,
    openRate: '68.4%',
    clickRate: '41.2%',
    lastDispatched: '2026-10-04 11:30',
  },
  {
    id: 'promo-mail-02',
    campaignName: 'Capital Access Sprint: Learn How to Earn Access to Capital',
    targetSegment: 'Pre-Seed Founders in Viability Stage',
    subject: 'How to Earn Access to Capital: Exclusive Masterclass Invitation',
    previewHeader: 'Capital transitions from a pitch into an inevitable commercial transaction.',
    headline: 'Stop Pitching Speculation. Earn Access to Capital.',
    bodyText: 'Dear {{founder_name}},\n\nIn the startup ecosystem, external funding is often celebrated as the milestone itself, rather than an accelerant for an already validated value engine.\n\nWhen you mathematically prove that customers willingly exchange currency for your solution at positive unit margins, institutional capital seeks you out. Join our free Capital Access Masterclass on the bizz-DESK.',
    highlightedSolution: 'Learn How to Earn Access to Capital (Masterclass)',
    ctaLabel: 'Start Free Masterclass',
    ctaUrl: '/workarea/vi-ability',
    tokensIncluded: 250,
    senderPersona: 'Coach GIM · Bizzbean Desk',
    status: 'ready',
    sentCount: 98,
    openRate: '72.1%',
    clickRate: '53.0%',
    lastDispatched: '2026-10-02 09:15',
  },
  {
    id: 'promo-mail-03',
    campaignName: 'Institutional Due Diligence & 3-Statement Model',
    targetSegment: 'Seed & Series-A Pipeline Ventures',
    subject: 'Prepare your 3-Statement Model & Virtual Data Room for Institutional Diligence',
    previewHeader: 'Pass venture audits with zero governance friction and complete transaction closing 3x faster.',
    headline: 'Is Your Balance Sheet Transaction-Ready?',
    bodyText: 'Dear {{founder_name}},\n\nInvestor due diligence fails more often due to disorganized records and broken spreadsheet formulas than flawed product vision.\n\nWith fund-ABILITY, you can generate macro-free 3-statement forecasts, dynamic valuation sensitivity matrices, and sync directly with your investor Google Drive virtual data room.',
    highlightedSolution: 'fund-ABILITY (3-Statement Engine)',
    ctaLabel: 'Launch 3-Statement Simulator',
    ctaUrl: '/workarea/fund-ability',
    tokensIncluded: 300,
    senderPersona: 'Elena Vance · Venture Operations',
    status: 'ready',
    sentCount: 64,
    openRate: '61.5%',
    clickRate: '38.8%',
    lastDispatched: '2026-09-29 15:40',
  },
  {
    id: 'promo-mail-04',
    campaignName: '18-Month Cash Runway Safeguard Alert',
    targetSegment: 'Active Scaling Portfolios & Accelerators',
    subject: 'The 18-Month Cash Runway Safeguard: Protecting Your Operating Margin',
    previewHeader: 'Protect corporate balance sheets with an uncompromised 18-month cash runway safeguard rule.',
    headline: 'Protecting Corporate Balance Sheets',
    bodyText: 'Dear {{founder_name}},\n\nVenture capital fundraising cycles now take 6 to 9 months on average. Maintaining an uncompromised 18-month buffer keeps you from negotiating term sheets out of desperation.\n\nAudit your monthly burn rate, eliminate redundant SaaS overheads with bizzoptimizer, and maintain real-time cash variance tripwires.',
    highlightedSolution: 'sustain-ABILITY (18-Month Safeguard)',
    ctaLabel: 'Run 13-Week Cash Allocation',
    ctaUrl: '/workarea/sustain-ability',
    tokensIncluded: 150,
    senderPersona: 'Coach GIM · Bizzbean Desk',
    status: 'draft',
    sentCount: 0,
    openRate: '—',
    clickRate: '—',
    lastDispatched: '—',
  },
];

export const INITIAL_CMS_INQUIRIES: CmsInquiry[] = [
  {
    id: 'inq-101',
    senderName: 'Sipho Ndlovu',
    senderEmail: 'sipho@ecotrack.co.za',
    subject: 'Assistance with 3-statement model export to Google Drive',
    message: 'We are preparing for our Seed round presentation on Friday. When exporting the 3-statement forecast from bizzmodel, does it automatically partition folders for our lead investor?',
    date: '2026-10-04 14:22',
    status: 'new',
  },
  {
    id: 'inq-102',
    senderName: 'Nadia Ferreira',
    senderEmail: 'nadia@biopulse.com',
    subject: 'Course Lesson syllabus completion certificate',
    message: 'Our incubator cohort completed "Learn How to Earn Access to Capital". Can we issue verified token completion badges?',
    date: '2026-10-03 09:15',
    status: 'reviewed',
  },
];

export const INITIAL_CMS_ASSOCIATE_BATCHES: CmsAssociateImport[] = [
  {
    id: 'batch-01',
    batchName: 'Johannesburg Fintech Spring 2026 Cohort',
    organization: 'Gauteng Enterprise Propeller (GEP)',
    candidateCount: 45,
    tokensPerAccount: 500,
    date: '2026-09-28',
    status: 'provisioned',
  },
  {
    id: 'batch-02',
    batchName: 'Cape Agri-Tech Founders Cohort 4',
    organization: 'Stellenbosch Innovation Hub',
    candidateCount: 30,
    tokensPerAccount: 350,
    date: '2026-10-01',
    status: 'provisioned',
  },
];

export const INITIAL_CMS_SPONSORS: CmsSponsorAccount[] = [
  {
    id: 'spons-1',
    sponsorName: 'First National Enterprise Capital',
    tier: 'Enterprise',
    sponsoredSeats: 250,
    contactPerson: 'Marcus Webb (Head of SME Incubation)',
    status: 'active',
  },
  {
    id: 'spons-2',
    sponsorName: 'Industrial Development Corporation (IDC)',
    tier: 'Govt Development Agency',
    sponsoredSeats: 500,
    contactPerson: 'Thandiwe Khumalo (Venture Fund Director)',
    status: 'active',
  },
];

export const INITIAL_CMS_TRANSACTIONS: CmsTransactionRecord[] = [
  {
    id: 'tx-8901',
    timestamp: '2026-10-04 16:45',
    userEmail: 'founder@bizzbean.com',
    action: 'unlock_solution',
    solutionName: 'fund-ABILITY',
    tokensUsed: 300,
    amountZAR: 5600,
  },
  {
    id: 'tx-8902',
    timestamp: '2026-10-04 14:12',
    userEmail: 'sipho@ecotrack.co.za',
    action: 'unlock_solution',
    solutionName: 'vi-ABILITY (bizzcalc)',
    tokensUsed: 150,
    amountZAR: 229,
  },
  {
    id: 'tx-8903',
    timestamp: '2026-10-03 11:30',
    userEmail: 'nadia@biopulse.com',
    action: 'token_grant',
    solutionName: 'Incubator Seat Grant',
    tokensUsed: 0,
    amountZAR: 0,
  },
];

export const INITIAL_V1_TRANSACTIONS: TransactionRecord[] = [
  {
    invoiceNumber: 'INV-2026-0001',
    transactionDate: '2026-10-04',
    sku: 'bizzcalc',
    productName: 'bizzcalc app',
    productType: 'app',
    customer: 'Quentin McCullough',
    customerEmail: 'quentin@bizzbean.com',
    country: 'South Africa',
    associate: 'BizzPartner SA',
    quantity: 1,
    unitPrice: 229,
    lineValue: 229,
    vatRate: 0.15,
    vatAmount: 34.35,
    invoiceValue: 263.35,
  },
  {
    invoiceNumber: 'INV-2026-0002',
    transactionDate: '2026-10-04',
    sku: 'cost_rec',
    productName: 'cost_rec app',
    productType: 'app',
    customer: 'Sipho Sithole',
    customerEmail: 'sipho@ecotrack.co.za',
    country: 'South Africa',
    associate: 'Cape Growth Associate',
    quantity: 1,
    unitPrice: 349,
    lineValue: 349,
    vatRate: 0.15,
    vatAmount: 52.35,
    invoiceValue: 401.35,
  },
  {
    invoiceNumber: 'INV-2026-0003',
    transactionDate: '2026-10-03',
    sku: 'course_fund_ability',
    productName: 'fund-ABILITY Masterclass',
    productType: 'course',
    customer: 'Nadia Pillay',
    customerEmail: 'nadia@biopulse.com',
    country: 'South Africa',
    associate: 'Direct Online',
    quantity: 1,
    unitPrice: 4869.57,
    lineValue: 4869.57,
    vatRate: 0.15,
    vatAmount: 730.43,
    invoiceValue: 5600.00,
  },
  {
    invoiceNumber: 'INV-2026-0004',
    transactionDate: '2026-10-02',
    sku: 'bizzmodel',
    productName: 'bizzmodel app',
    productType: 'app',
    customer: 'David Smith',
    customerEmail: 'david.smith@apexcap.co.uk',
    country: 'United Kingdom',
    associate: 'London Partner Network',
    quantity: 1,
    unitPrice: 850,
    lineValue: 850,
    vatRate: 0.15,
    vatAmount: 127.50,
    invoiceValue: 977.50,
  },
  {
    invoiceNumber: 'INV-2026-0005',
    transactionDate: '2026-10-01',
    sku: 'bizzplan',
    productName: 'bizzplan app',
    productType: 'app',
    customer: 'Quentin McCullough',
    customerEmail: 'quentin@bizzbean.com',
    country: 'South Africa',
    associate: 'BizzPartner SA',
    quantity: 1,
    unitPrice: 450,
    lineValue: 450,
    vatRate: 0.15,
    vatAmount: 67.50,
    invoiceValue: 517.50,
  },
  {
    invoiceNumber: 'INV-2026-0006',
    transactionDate: '2026-09-28',
    sku: 'course_pricing_arch',
    productName: 'Pricing Architecture Masterclass',
    productType: 'course',
    customer: 'Lerato Moloi',
    customerEmail: 'lerato@infrasmart.co.za',
    country: 'South Africa',
    associate: 'Joburg Hub Advisor',
    quantity: 2,
    unitPrice: 1200,
    lineValue: 2400,
    vatRate: 0.15,
    vatAmount: 360.00,
    invoiceValue: 2760.00,
  },
];

export const INITIAL_CLIENT_PROFILES: ClientProfile[] = [
  {
    id: 'cli-01',
    name: 'Quentin McCullough',
    email: 'quentin@bizzbean.com',
    companyName: 'BizzBean Holdings (Pty) Ltd',
    vatNumber: '4920281920',
    phone: '+27 82 555 0192',
    city: 'Johannesburg',
    country: 'South Africa',
    notes: 'Key founder account. Primary administrator and enterprise test account.',
  },
  {
    id: 'cli-02',
    name: 'Sipho Sithole',
    email: 'sipho@ecotrack.co.za',
    companyName: 'EcoTrack Logistics',
    vatNumber: '4192038192',
    phone: '+27 83 221 4409',
    city: 'Durban',
    country: 'South Africa',
    notes: 'Fast-growing green logistics company. Active user of bizzcalc and cost_rec.',
  },
  {
    id: 'cli-03',
    name: 'Nadia Pillay',
    email: 'nadia@biopulse.com',
    companyName: 'BioPulse Diagnostics',
    vatNumber: '4772910482',
    phone: '+27 71 889 1234',
    city: 'Cape Town',
    country: 'South Africa',
    notes: 'Biotech seed stage founder. Completed fund-ABILITY masterclass sprint.',
  },
  {
    id: 'cli-04',
    name: 'David Smith',
    email: 'david.smith@apexcap.co.uk',
    companyName: 'Apex Capital UK',
    vatNumber: 'GB982173491',
    phone: '+44 20 7946 0912',
    city: 'London',
    country: 'United Kingdom',
    notes: 'Cross-border investor associate. Utilizing bizzmodel for portfolio assessment.',
  },
  {
    id: 'cli-05',
    name: 'Lerato Moloi',
    email: 'lerato@infrasmart.co.za',
    companyName: 'InfraSmart Engineering',
    vatNumber: '4038192841',
    phone: '+27 84 991 3820',
    city: 'Pretoria',
    country: 'South Africa',
    notes: 'Infrastructure solutions founder. Enrolled 2 executives in Pricing Architecture.',
  },
];

export const INITIAL_CLIENT_NOTIFICATIONS: ClientNotification[] = [
  {
    id: 'notif-01',
    recipientEmail: 'quentin@bizzbean.com',
    subject: 'Tax Invoice INV-2026-0001: bizzcalc app',
    content: 'Your tax invoice for bizzcalc app has been generated and posted to your account. Gross value: R 263.35 (incl. 15% VAT).',
    timestamp: '2026-10-04 14:15',
    isRead: true,
    sender: 'Bizzbean Finance Desk',
    serviceName: 'bizzcalc app',
    amountInvoiced: 263.35,
  },
  {
    id: 'notif-02',
    recipientEmail: 'sipho@ecotrack.co.za',
    subject: 'Tax Invoice INV-2026-0002: cost_rec app',
    content: 'Thank you for your license purchase of cost_rec app. Gross value: R 401.35 (incl. 15% VAT). Invoice document attached.',
    timestamp: '2026-10-04 14:12',
    isRead: false,
    sender: 'Bizzbean Finance Desk',
    serviceName: 'cost_rec app',
    amountInvoiced: 401.35,
  },
  {
    id: 'notif-03',
    recipientEmail: 'nadia@biopulse.com',
    subject: 'Enrollment Confirmed: fund-ABILITY Masterclass (INV-2026-0003)',
    content: 'Enrollment confirmed for fund-ABILITY Masterclass. Gross value: R 5,600.00 (incl. 15% VAT). Access tokens credited.',
    timestamp: '2026-10-03 11:32',
    isRead: true,
    sender: 'Bizzbean Academy Desk',
    serviceName: 'fund-ABILITY Masterclass',
    amountInvoiced: 5600.00,
  },
];

export const INITIAL_CMS_POLICIES: CmsPolicyRegistryItem[] = [
  {
    id: 'pol-1',
    title: 'POPIA Entrepreneur Data Protection & VDR Access Rights',
    category: 'POPIA & Privacy',
    version: 'v2.4',
    lastUpdated: '2026-09-15',
    status: 'active',
  },
  {
    id: 'pol-2',
    title: 'BizzToken Utility & Non-Security Tokenomics Charter',
    category: 'Tokenomics Governance',
    version: 'v3.1',
    lastUpdated: '2026-09-20',
    status: 'active',
  },
  {
    id: 'pol-3',
    title: 'Macro-Free Cloud Sync Security SLA & Google Workspace Policy',
    category: 'VDR Security Protocol',
    version: 'v2.0',
    lastUpdated: '2026-10-01',
    status: 'active',
  },
];

export const INITIAL_CMS_TOOLTIPS: CmsBizzyTooltip[] = [
  {
    id: 'tip-1',
    pageRoute: '/workarea/vi-ability',
    elementSelector: '#cac-input',
    headline: 'Bizzy Learning Guide: Blended vs. Paid CAC',
    promptGuidance: 'Ensure your CAC includes all sales salaries and onboarding overheads, not merely Facebook/Google ad click spends.',
  },
  {
    id: 'tip-2',
    pageRoute: '/workarea/fund-ability',
    elementSelector: '#runway-dial',
    headline: 'Bizzy Learning Guide: The 18-Month Rule',
    promptGuidance: 'Venture capital fund-raising takes 6 to 9 months on average. Maintaining an 18-month buffer keeps you from negotiating term sheets out of desperation.',
  },
  {
    id: 'tip-3',
    pageRoute: '/workarea/bizzmoney',
    elementSelector: '#ledger-journal',
    headline: 'Bizzy Learning Guide: Double-Entry Discipline',
    promptGuidance: 'Every debit must have an equal credit. Assets = Liabilities + Equity.',
  },
];

// =============================================================================
// =============================================================================
// PROMOTIONAL BILLBOARDS / HERO SCREENS (14 SECTIONS)
// =============================================================================
export interface CmsStageStory {
  narrative?: string;
  stageChallenge?: string;
  milestone?: string;
  keyDeliverable?: string;
}

export interface CmsPromotionSection {
  id: string;
  name: string;
  displayName: string;
  tagline: string;
  targetType: 'solution' | 'knowledge-base';
  targetId: string;
  targetTab?: 'dialogue' | 'search' | 'library';
  buttonText: string;
  imageUrl?: string;
  isActive: boolean;
  stageStory?: CmsStageStory;
}

export const INITIAL_CMS_PROMOTIONS: CmsPromotionSection[] = [
  {
    id: 'vi-ability',
    name: 'vi-ability',
    displayName: 'vi-ability · stage 01',
    tagline: 'learn how to earn access to capital & simulate unit economics with bizzcalc.',
    targetType: 'solution',
    targetId: 'learn-earn-capital',
    buttonText: 'explore vi-ability',
    imageUrl: '',
    isActive: true,
    stageStory: {
      narrative: 'Learn how to earn access to capital and validate unit economics before commercial launch. Master customer willingness to pay and establish verifiable contribution margins.',
      stageChallenge: 'Unverified pricing assumptions, lack of capital readiness, and negative contribution margins.',
      milestone: 'Complete the Capital Access course and establish verified contribution margin with bizzcalc.',
      keyDeliverable: 'Access to Capital Framework & Validated Unit Economics Model.',
    },
  },
  {
    id: 'fund-ability',
    name: 'fund-ability',
    displayName: 'fund-ability · stage 02',
    tagline: '3-statement macro-free financial modeling with dynamic valuation dials and burn forecasting.',
    targetType: 'solution',
    targetId: 'fund-ability',
    buttonText: 'explore fund-ability',
    imageUrl: '',
    isActive: true,
    stageStory: {
      narrative: 'Institutional capital requires rigorous 3-statement financial models with dynamic valuation dials, scenario sensitivity, and zero macro assumptions.',
      stageChallenge: 'Static spreadsheets that crash during investor due diligence.',
      milestone: 'Audit-ready 36-month integrated financial forecast and clear cash break-even trajectory.',
      keyDeliverable: 'Dynamic 3-Statement Financial Engine & Valuation Sensitivity Matrix.',
    },
  },
  {
    id: 'sustain-ability',
    name: 'sustain-ability',
    displayName: 'sustain-ability · stage 03',
    tagline: '18-month cash runway safeguard rule: protect corporate balance sheets from market contractions.',
    targetType: 'solution',
    targetId: 'sustain-ability',
    buttonText: 'explore sustain-ability',
    imageUrl: '',
    isActive: true,
    stageStory: {
      narrative: 'Protect corporate balance sheets with an uncompromised 18-month cash runway safeguard rule, ensuring the venture survives market shocks without emergency down-rounds.',
      stageChallenge: 'Premature headcount expansion and uncontrolled monthly cash burn.',
      milestone: '18+ months of net runway cushion with real-time variance tripwires enabled.',
      keyDeliverable: 'Rolling 13-Week Cash Allocation Engine & Runway Tripwire Monitor.',
    },
  },
  {
    id: 'invest-ability',
    name: 'invest-ability',
    displayName: 'invest-ability · stage 04',
    tagline: 'institutional virtual data room, cap table waterfalls, and venture due diligence audit preparation.',
    targetType: 'solution',
    targetId: 'invest-ability',
    buttonText: 'explore invest-ability',
    imageUrl: '',
    isActive: true,
    stageStory: {
      narrative: 'Prepare for institutional diligence, investor syndication, cap table waterfalls, and transaction-ready corporate virtual data rooms.',
      stageChallenge: 'Dilution traps, unverified share capitalization, and disorganized corporate records stalling term sheets.',
      milestone: 'Institutional diligence pass rate of 100% with clean cap table waterfall models.',
      keyDeliverable: 'Virtual Data Room (VDR) Index, Cap Table Waterfall, and Diligence Pack.',
    },
  },
  {
    id: 'personal-sandbox',
    name: 'personal-sandbox',
    displayName: 'personal-sandbox · illuminated cockpit',
    tagline: 'modular digital workbench: assemble financial tools, linked accounts, and custom forecasts.',
    targetType: 'solution',
    targetId: 'personal-sandbox',
    buttonText: 'enter personal sandbox',
    imageUrl: '',
    isActive: true,
    stageStory: {
      narrative: 'Your private, illuminated executive cockpit. Seamlessly combine real-time financial modeling, connected accounting ledgers, and bespoke growth forecasts in one distraction-free workbench.',
      stageChallenge: 'Fragmented tools and disconnected financial views confusing executive decisions.',
      milestone: 'Unified executive telemetry with real-time sync across all financial modules.',
      keyDeliverable: 'Personal Sandbox Cockpit with modular tool composition.',
    },
  },
  {
    id: 'bizzmoney',
    name: 'bizzmoney',
    displayName: 'bizzmoney · double-entry ledger',
    tagline: 'standard 62-account chart of accounts, voice-assisted bookkeeping, and instant tax accrual.',
    targetType: 'solution',
    targetId: 'bizzmoney',
    buttonText: 'launch bizzmoney',
    imageUrl: '',
    isActive: true,
    stageStory: {
      narrative: 'Double-entry operational ledger designed for entrepreneurs. Features standard 62-account chart of accounts, voice-assisted transaction entry, and automatic tax accrual.',
      stageChallenge: 'Neglected bookkeeping leading to surprise tax liabilities and cash reconciliation lag.',
      milestone: 'Daily automated transaction reconciliation with real-time tax provision.',
      keyDeliverable: 'Institutional 62-Account Chart of Accounts & Automated General Ledger.',
    },
  },
  {
    id: 'bizzbudget',
    name: 'bizzbudget',
    displayName: 'bizzbudget · cash variance engine',
    tagline: 'rolling 13-week cash allocations and real-time departmental expenditure tripwires.',
    targetType: 'solution',
    targetId: 'budget',
    buttonText: 'launch bizzbudget',
    imageUrl: '',
    isActive: true,
    stageStory: {
      narrative: 'Rolling 13-week cash variance engine. Allocate capital by strategic priority, detect departmental expense drift early, and prevent surprise runway compression.',
      stageChallenge: 'Annual static budgets that become obsolete after the first month of trading.',
      milestone: 'Rolling 13-week forecast with variance thresholds under 5%.',
      keyDeliverable: '13-Week Cash Flow Allocator & Variance Tripwire Dashboard.',
    },
  },
  {
    id: 'bizzoptimizer',
    name: 'bizzoptimizer',
    displayName: 'bizzoptimizer · margin trimmer',
    tagline: 'eliminate non-core SaaS overheads and accelerate invoice collections to stretch runway.',
    targetType: 'solution',
    targetId: 'bizzoptimizer',
    buttonText: 'launch bizzoptimizer',
    imageUrl: '',
    isActive: true,
    stageStory: {
      narrative: 'Surgical margin optimization. Audit redundant software subscriptions, renegotiate vendor contracts, and streamline working capital to extend runway without external fundraising.',
      stageChallenge: 'Unnoticed SaaS sprawl and vendor creep eroding operating margins.',
      milestone: '15%+ reduction in non-essential operating expenditures.',
      keyDeliverable: 'Vendor & SaaS Expenditure Audit Report with Actionable Trims.',
    },
  },
  {
    id: 'strategy',
    name: 'strategy',
    displayName: 'growth strategy · scenario modeler',
    tagline: 'test pricing elasticity, market expansion channels, and defensible competitive moats.',
    targetType: 'solution',
    targetId: 'strategy',
    buttonText: 'explore growth strategy',
    imageUrl: '',
    isActive: true,
    stageStory: {
      narrative: 'Multi-scenario growth strategy simulator. Model pricing elasticity, international expansion paths, and competitive moat defensibility before deploying growth capital.',
      stageChallenge: 'Unchecked growth investments without quantified unit economics backing.',
      milestone: 'Scenario matrix identifying high-margin distribution channels.',
      keyDeliverable: 'Scenario Simulation Matrix & Competitive Moat Playbook.',
    },
  },
  {
    id: 'critical-thinking',
    name: 'critical thinking',
    displayName: 'critical thinking · socratic defense',
    tagline: 'rigorous blindspot audits: challenge founder confirmation biases before committing capital.',
    targetType: 'solution',
    targetId: 'critical-thinking',
    buttonText: 'engage critical thinking',
    imageUrl: '',
    isActive: true,
    stageStory: {
      narrative: 'Socratic defense and blindspot audit. Challenge confirmation biases, stress-test business plan assumptions, and examine worst-case market scenarios with objective rigor.',
      stageChallenge: 'Echo chambers and unexamined operational risks jeopardizing execution.',
      milestone: 'Exhaustive pre-mortem audit identifying top 5 existential business vulnerabilities.',
      keyDeliverable: 'Pre-Mortem Risk Audit & Blindspot Mitigation Matrix.',
    },
  },
  {
    id: 'machine-based-learning',
    name: 'machine-based learning',
    displayName: 'machine-based learning · ai literacy',
    tagline: 'applied enterprise intelligence: prompt architecture, automation workflows, and predictive analytics.',
    targetType: 'solution',
    targetId: 'machine-based-learning',
    buttonText: 'explore machine learning',
    imageUrl: '',
    isActive: true,
    stageStory: {
      narrative: 'Applied enterprise intelligence literacy. Master prompt engineering, generative workflow automations, and predictive analytics tailored specifically for operational scale.',
      stageChallenge: 'Superficial AI usage that creates operational friction rather than measurable ROI.',
      milestone: 'Automated workflow pipelines saving 10+ executive hours per week.',
      keyDeliverable: 'Operational AI Implementation Blueprint & Prompt Architecture Library.',
    },
  },
  {
    id: 'dialogue',
    name: 'dialogue',
    displayName: 'gim dialogue · executive advisory',
    tagline: 'real-time consultation with GIM business coach for stress-testing blind spots and venture logic.',
    targetType: 'knowledge-base',
    targetId: 'dialogue',
    targetTab: 'dialogue',
    buttonText: 'open gim dialogue',
    imageUrl: '',
    isActive: true,
    stageStory: {
      narrative: 'Direct executive advisory with GIM business coach. Real-time sounding board for financial modeling, strategic forks, and venture validation logic.',
      stageChallenge: 'Solitary founder decision-making without institutional feedback.',
      milestone: 'Calibrated executive answers to complex commercial queries within minutes.',
      keyDeliverable: 'AI-LOOP Advisory Log & Session Strategy Synthesis.',
    },
  },
  {
    id: 'library',
    name: 'library',
    displayName: 'virtual library · daily focus',
    tagline: 'manage your daily 3-objective focus ledger, stored model forecasts, and companion assets.',
    targetType: 'knowledge-base',
    targetId: 'library',
    targetTab: 'library',
    buttonText: 'open virtual library',
    imageUrl: '',
    isActive: true,
    stageStory: {
      narrative: 'The virtual venture library. Manage your daily 3-objective focus ledger, retrieve saved financial forecasts, and download companion workbooks and templates.',
      stageChallenge: 'Loss of daily strategic focus amidst chaotic tactical fire-fighting.',
      milestone: 'Consistent daily completion of top 3 high-impact commercial milestones.',
      keyDeliverable: 'Daily Focus Ledger, Stored Financial Models, and Asset Vault.',
    },
  },
];
