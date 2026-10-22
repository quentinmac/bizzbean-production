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
