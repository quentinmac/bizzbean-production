export type SolutionCategory =
  | 'about'
  | 'startup'
  | 'operations'
  | 'growth'
  | 'education'
  | 'footer';

export interface BizzSolution {
  id: string;
  category: SolutionCategory;
  stage?: string;
  name: string;
  subtitle: string;
  stageCode?: string;
  description: string;
  purpose: string;
  priceUSD: number;
  priceZAR: number;
  vatRate: number; // e.g. 0.15 for 15%
  tokensAllocated: number;
  billingModel?: 'once-off' | 'monthly subscription';
  imageUrl?: string;
  explainerVideoUrl?: string;
  explainerDuration?: string;
  isPurchased?: boolean;
  features: string[];
  integrationNote?: string;
}

export interface UserBusinessProfile {
  companyName: string;
  founderName: string;
  industry: string;
  stage: string;
  vision: string;
  whatWeDo: string;
  uniqueValue: string;
  targetMarket: string;
  monthlyRevenue: number;
  burnRate: number;
  slug: string;
  websiteUrl?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  vatNumber?: string;
  notes?: string;
  socialMissionEquation?: string;
  socialMissionSubtext?: string;
  whoAreWe?: string;
  whatWeDoPanel?: string;
  whereAreWeGoing?: string;
  howSolutionsEnableGrowth?: string;
}

export interface DialogueMessage {
  id: string;
  sender: 'user' | 'gim';
  text: string;
  timestamp: string;
  pillar?: 'strategy' | 'critical_thinking' | 'machine_learning' | 'financial_integration';
  actionPrompt?: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  type: 'Financial Model Run' | 'Strategic Memo' | 'Dialogue Transcript' | 'Accounting Ledger' | 'Due Diligence Pack' | 'Companion Template' | 'Forecast Simulation';
  date: string;
  size: string;
  stage: string;
  contentSnippet: string;
  category?: 'models' | 'memos' | 'ledgers' | 'diligence' | 'templates';
  format?: 'gsheet' | 'xlsx' | 'pdf' | 'gdoc' | 'vdr';
  tags?: string[];
}

export type VentureStageId = 'viability' | 'fundability' | 'sustainability' | 'investability';

export interface VentureStage {
  id: VentureStageId;
  index: string;
  name: string;
  tagline: string;
  description: string;
  coreDeliverables: string[];
  metricsTarget: string;
  idealFor: string;
  recommendedServiceId: string;
}

export interface ServicePackage {
  id: string;
  stageId: VentureStageId;
  title: string;
  turnaround: string;
  summary: string;
  description: string;
  deliverables: string[];
  integrationTools: string[];
  startingPrice: string;
  isPopular?: boolean;
}

export interface MasterclassItem {
  id: string;
  title: string;
  stageId: VentureStageId;
  duration: string;
  instructor: string;
  description: string;
  format: 'Video Masterclass' | 'Interactive Simulator' | 'Downloadable Model Kit' | 'Executive Sprint';
  takeaway: string;
}

export interface DiagnosticQuestion {
  id: number;
  question: string;
  context: string;
  options: {
    label: string;
    points: {
      viability: number;
      fundability: number;
      sustainability: number;
      investability: number;
    };
    stageHint: VentureStageId;
  }[];
}

export interface FinancialModelInputs {
  currency: string;
  currentMonthlyRevenue: number;
  expectedMonthlyGrowthRate: number;
  grossMarginPercentage: number;
  monthlyOpEx: number;
  currentCashReserve: number;
  targetRunwayMonths: number;
  valuationMultiple: number;
}

export interface FinancialModelOutputs {
  monthlyGrossProfit: number;
  monthlyNetBurn: number;
  runwayMonths: number;
  breakEvenMonthEstimate: number | null;
  annualizedRunRate: number;
  estimatedValuation: number;
  capitalRequirement: number;
  projectedRevenue12M: number;
  projectedRevenue24M: number;
  projectedRevenue36M: number;
}

export interface ClientInquiry {
  name: string;
  email: string;
  companyName: string;
  industry: string;
  selectedStage: VentureStageId;
  selectedServiceId: string;
  timeframe: string;
  projectScope: string;
  financialModelData?: Partial<FinancialModelInputs>;
}

export interface PromotionCoupon {
  code: string;
  type: 'personal_promotion' | 'corporate_sponsorship';
  corporateName?: string;
  associate?: string;
  tokenAllocation: number;
  grantedApps: string[];
  grantedCourses: string[];
  discountPercent?: number;
  description?: string;
}

export interface TransactionRecord {
  invoiceNumber: string;         // e.g. "INV-2026-0001"
  transactionDate: string;       // "YYYY-MM-DD"
  sku: string;                   // e.g. "bizzcalc", "cost_rec"
  productName: string;           // "bizzcalc app"
  productType: 'app' | 'course';
  customer: string;              // "Quentin McCullough"
  customerEmail: string;         // "quentin@bizzbean.com"
  country?: string;              // "South Africa", "United Kingdom", etc.
  associate: string;            // Bizzpartner / Sales Associate name
  quantity: number;              // default: 1
  unitPrice: number;             // in ZAR
  lineValue: number;             // quantity * unitPrice (Excl VAT)
  vatRate: number;               // 0.15 (15% SARS standard)
  vatAmount: number;             // lineValue * vatRate
  invoiceValue: number;          // lineValue + vatAmount (Gross Incl VAT)
  paymentRef?: string;           // Idempotent gateway / grant reference
}

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  companyName: string;
  vatNumber?: string;
  phone?: string;
  city?: string;
  country?: string;
  notes?: string;
  role?: 'admin' | 'member';
  associate?: string;
  registeredAt?: string;
  uid?: string;
  tokens?: number;
  purchasedApps?: string[];
  purchasedCourses?: string[];
}

export interface ClientNotification {
  id: string;
  recipientEmail: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  sender: string;
  serviceName?: string;
  amountInvoiced?: number;
}

export interface Enquiry {
  id: string;
  firstName: string;
  lastName: string;
  mobile?: string;
  email: string;
  message: string;
  submittedAt: string;
  status: 'pending' | 'responded';
  response?: string;
  respondedAt?: string;
  sourceRegion?: string;
}

export type TouchPointAnswer = 'n/a' | 'yes' | 'no' | 'plan';

export interface BizzPlanTouchPoint {
  id: string;
  item: string;
  answer: TouchPointAnswer;
  score: number;
}

export interface BizzPlanTouchPointCategory {
  id: string;
  title: string;
  items: BizzPlanTouchPoint[];
  comment?: string;
}

export interface BizzPlanScriptedHint {
  heading: string;
  detail: string;
  autoSyncTag?: string;
}

export interface BizzForecastaCustomMetrics {
  // Executive Summary & Ask
  capitalRequested?: number;
  instrumentPreference?: string;
  targetTimeline?: string;
  // Proven Traction Customer Proof
  retentionRatePct?: number;
  churnRatePct?: number;
  netDollarRetentionPct?: number;
  contractedPipeline?: number;
  // Core Unit Economics (Page 6)
  cac?: number;
  ltv?: number;
  paybackMonths?: number;
  contributionMarginPct?: number;
}

export interface BizzPlanSection {
  id: string;
  title: string;
  defaultTitle?: string;
  content: string;
  isCompleted: boolean;
  checkpoints: string[];
  type?: 'narrative' | 'touchpoint' | 'scorecard' | 'scripted';
  categories?: BizzPlanTouchPointCategory[];
  hints?: BizzPlanScriptedHint[];
  isOptional?: boolean;
  isIncluded?: boolean;
  autoSyncBlock?: 'historical_traction' | 'quarterly_kpis' | 'financial_projections_unit_econ';
  importedDocName?: string;
  customMetrics?: BizzForecastaCustomMetrics;
}

export interface BizzPlanCoverPage {
  companyLogo?: string;
  companyName?: string;
  businessType?: string;
  businessLocation?: string;
  preparationPrincipal?: string;
  preparationDate?: string;
  principalEmail?: string;
  principalMobile?: string;
}

export interface BizzPlanPitch {
  elevatorPitch?: string;
  valueOffer?: string[];
  revenueModel?: string[];
  financialOutlook?: string[];
  competitorLandscape?: string[];
  getToMarket?: string[];
  growthLeverFunding?: string[];
  fundingDeal?: string[];
}

export interface BizzPlanGovernance {
  corporate?: {
    legalForm?: string;
    startDate?: string;
    financialMonthEnd?: string;
    boardSize?: string;
    boardQuorum?: string;
    boardMeetingFrequency?: string;
    financialReportingFrequency?: string;
    shareholdersAgreement?: string;
  };
  boardMembers?: { name: string; shareholding: string }[];
  keyPersonnel?: { name: string; position: string }[];
  professionalSupport?: { name: string; serviceType: string }[];
}

export interface BizzPlanData {
  businessName: string;
  vision: string;
  mission: string;
  scorecardActions?: Record<string, string | string[]>;
  coverPage?: BizzPlanCoverPage;
  pitch?: BizzPlanPitch;
  governance?: BizzPlanGovernance;
  sections: BizzPlanSection[];
}

export interface BizzModelStep {
  id: string;
  label: string;
  title?: string;
  subtitle?: string;
  isCompleted?: boolean;
  isValid?: boolean;
  isCommon?: boolean;
}

export interface BizzModelData {
  company?: {
    name?: string;
    startDate?: string;
    workingDays?: string[];
    holidays?: Array<{ name?: string; from: string; to: string; days?: number; recurring?: boolean }>;
    assumptions?: {
      bankInterestRate: number;
      overdraftInterestRate: number;
      vatRate: number;
      taxRate: number;
    };
    assetCategories?: Record<string, number>;
  };
  workingCapital?: {
    inventoryDays?: number[];
    debtorsDays?: number[];
    creditorsDays?: number[];
  };
  setup: {
    businessName: string;
    businessType: string;
    startMonth: string;
    daysWorked: {
      days: string[];
      holidays: Array<{ name?: string; from: string; to: string; recurring?: boolean }>;
    };
    interestRates: {
      positiveBase: number;
      positiveAdjustments: number[];
      negativeBase: number;
      negativeAdjustments: number[];
    };
    vatRate: {
      base: number;
      adjustments: number[];
    };
    taxRate: {
      base: number;
      adjustments: number[];
    };
  };
  revenue: {
    productCategories: Array<{
      name: string;
      baseValueSales: number;
      pricePerUnit?: number;
      unitSales?: number;
      dailyVolume?: number;
    }>;
  };
  employment: {
    staff: Array<{
      name?: string;
      title?: string;
      count: number[];
      monthlyCost?: number;
    }>;
  };
  fixedAssets: {
    categories: Array<{
      name: string;
      depreciationRate: number;
    }>;
    assets: Array<{
      name?: string;
      purchaseValue: number;
    }>;
  };
  funding: {
    workingCapital: {
      inventoryDays: { base: number; annualAdjustments: number[] };
      receivableDays: { base: number; annualAdjustments: number[] };
      payableDays: { base: number; annualAdjustments: number[] };
    };
  };
  _v2State?: any;
}
