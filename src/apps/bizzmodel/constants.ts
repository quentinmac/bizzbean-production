import { AssumptionRateItem } from '../bizzdynamics/types';
import {
  BatchLotsProductConfig,
  ContinuousProductionProductConfig,
  FabricationProductConfig,
  FamilyRestaurantProductConfig,
  ValueSalesCategory,
  ValueSalesProductConfig,
  CommissionCategory,
  CommissionProductConfig,
  RevenueShareCategory,
  RevenueShareProductConfig,
  TimeUnitsProductConfig,
  InstallationServicesProductConfig,
  MeasuredUnitsProductConfig,
  LaundryProductConfig,
  DrycleanerProductConfig,
  TimeSlotsProductConfig,
} from './components/modelsets/modelSetTypes';
import { BizzOptimizerState, DEFAULT_BIZZOPTIMIZER_STATE } from './data/bizzoptimizerDefaults';

export const BUSINESS_TYPES = [
  'trading', 'manufacturing', 'services', 'mobility',
  'hospitality', 'education', 'broking', 'property',
  'asset rentals', 'agriculture'
] as const;

export type BusinessType = typeof BUSINESS_TYPES[number];

export const BUSINESS_MODELS: Record<string, string[]> = {
  'trading': ['unit sales', 'value sales', 'commission', 'revenue share'],
  'manufacturing': ['batch lots', 'continuous production', 'fabrication'],
  'services': ['time units', 'installation services', 'measured units', 'printing', 'laundry', 'drycleaner', 'time slots', 'guarding services'],
  'mobility': ['taxi operator', 'tractor', 'driving school', 'truck operator'],
  'hospitality': ['family restaurant', 'guest house', 'events organizer'],
  'education': ['classroom facility'],
  'broking': ['labour broking'],
  'property': ['development'],
  'asset rentals': ['equipment rental', 'vehicle rental'],
  'agriculture': ['crop farming']
};

export interface RevenueModelField {
  id: string;
  label: string;
  placeholder: string;
  type: 'number' | 'percent';
}

export interface RevenueModelConfig {
  label: string;
  fields: RevenueModelField[];
}

export const REVENUE_MODEL_CONFIGS: Record<string, RevenueModelConfig> = {
  'revenue share': {
    label: 'revenue share',
    fields: [
      { id: 'totalRevenue', label: 'total monthly revenue', placeholder: 'e.g. 200000', type: 'number' },
      { id: 'share', label: 'our share %', placeholder: 'e.g. 15', type: 'percent' },
    ]
  },
  'commission': {
    label: 'commission',
    fields: [
      { id: 'volume', label: 'total monthly volume', placeholder: 'e.g. 100000', type: 'number' },
      { id: 'rate', label: 'commission rate %', placeholder: 'e.g. 5', type: 'percent' },
    ]
  },
  'unit sales': {
    label: 'unit sales',
    fields: [
      { id: 'units', label: 'monthly units', placeholder: 'e.g. 1000', type: 'number' },
      { id: 'price', label: 'price per unit', placeholder: 'e.g. 50', type: 'number' },
      { id: 'cost', label: 'cost per unit', placeholder: 'e.g. 30', type: 'number' },
    ]
  },
  'value sales': {
    label: 'value sales',
    fields: [
      { id: 'totalValue', label: 'total monthly value', placeholder: 'e.g. 50000', type: 'number' },
      { id: 'margin', label: 'gross profit margin %', placeholder: 'e.g. 40', type: 'percent' },
    ]
  }
};

export interface ModelSetItem {
  id: string;
  name: string;
  isAvailable: boolean;
  statusLabel?: string;
}

export interface ModelSetCategory {
  type: string;
  modelSets: ModelSetItem[];
}

/**
 * Authentic 10-Type Model Sets Taxonomy matching model-sets.PNG
 * UNIT SALES is the only active model-set for this phase; others marked as coming soon.
 */
export const ALL_MODEL_SETS: ModelSetCategory[] = [
  {
    type: 'trading',
    modelSets: [
      { id: 'unit-sales', name: 'unit sales', isAvailable: true, statusLabel: 'Available' },
      { id: 'value-sales', name: 'value sales', isAvailable: true, statusLabel: 'Available' },
      { id: 'commission', name: 'commission', isAvailable: true, statusLabel: 'Available' },
      { id: 'revenue-share', name: 'revenue share', isAvailable: true, statusLabel: 'Available' },
    ],
  },
  {
    type: 'manufacturing',
    modelSets: [
      { id: 'batch-lots', name: 'batch lots', isAvailable: true, statusLabel: 'Available' },
      { id: 'continuous-production', name: 'continuous production', isAvailable: true, statusLabel: 'Available' },
      { id: 'fabrication', name: 'fabrication', isAvailable: true, statusLabel: 'Available' },
    ],
  },
  {
    type: 'services',
    modelSets: [
      { id: 'time-units', name: 'time units', isAvailable: true, statusLabel: 'Available' },
      { id: 'installation-services', name: 'installation services', isAvailable: true, statusLabel: 'Available' },
      { id: 'measured-units', name: 'measured units', isAvailable: true, statusLabel: 'Available' },
      { id: 'printing', name: 'printing', isAvailable: false, statusLabel: 'coming soon' },
      { id: 'laundry', name: 'laundry', isAvailable: true, statusLabel: 'Available' },
      { id: 'drycleaning', name: 'drycleaner', isAvailable: true, statusLabel: 'Available' },
      { id: 'time-slots', name: 'time slots', isAvailable: true, statusLabel: 'Available' },
      { id: 'time-slot-rentals', name: 'time slot rentals', isAvailable: false, statusLabel: 'coming soon' },
      { id: 'guarding', name: 'guarding', isAvailable: false, statusLabel: 'coming soon' },
    ],
  },
  {
    type: 'mobility',
    modelSets: [
      { id: 'taxi-operator', name: 'taxi operator', isAvailable: false, statusLabel: 'coming soon' },
      { id: 'tractor-operator', name: 'tractor operator', isAvailable: false, statusLabel: 'coming soon' },
      { id: 'driving-school', name: 'driving school', isAvailable: false, statusLabel: 'coming soon' },
      { id: 'truck-operator', name: 'truck operator', isAvailable: false, statusLabel: 'coming soon' },
    ],
  },
  {
    type: 'hospitality',
    modelSets: [
      { id: 'family-restaurant', name: 'family restaurant', isAvailable: true, statusLabel: 'Available' },
      { id: 'guest-house', name: 'guest house', isAvailable: false, statusLabel: 'coming soon' },
      { id: 'events-organizer', name: 'events organizer', isAvailable: false, statusLabel: 'coming soon' },
    ],
  },
  {
    type: 'education',
    modelSets: [
      { id: 'education', name: 'education', isAvailable: false, statusLabel: 'coming soon' },
    ],
  },
  {
    type: 'labour broking',
    modelSets: [
      { id: 'labour-broking', name: 'labour broking', isAvailable: false, statusLabel: 'coming soon' },
    ],
  },
  {
    type: 'property development',
    modelSets: [
      { id: 'property-development', name: 'property development', isAvailable: false, statusLabel: 'coming soon' },
    ],
  },
  {
    type: 'asset rentals',
    modelSets: [
      { id: 'equipment-rental', name: 'equipment rental', isAvailable: false, statusLabel: 'coming soon' },
      { id: 'vehicle-rental', name: 'vehicle rental', isAvailable: false, statusLabel: 'coming soon' },
    ],
  },
  {
    type: 'agriculture',
    modelSets: [
      { id: 'crop', name: 'crop', isAvailable: false, statusLabel: 'coming soon' },
      { id: 'animal-breeding', name: 'animal breeding', isAvailable: false, statusLabel: 'coming soon' },
    ],
  },
];

export const STANDARD_OPEX_NAMES = [
  "accounting fees",
  "advertising",
  "bank charges",
  "cleaning",
  "consultancy",
  "credit card costs",
  "distribution expenses",
  "electricity",
  "equipment rental",
  "hosting charges",
  "insurance",
  "internet bandwirth",
  "legal expenses",
  "logistics expenses",
  "municipal charges",
  "protective clothing",
  "refreshments",
  "rent",
  "security",
  "selling incentives",
  "software licences",
  "stationery and printing",
  "telephone - mobile",
  "uniforms and laundry",
  "vehicle operating costs",
  "warehousing",
  "water"
] as const;

export type StandardOpexName = typeof STANDARD_OPEX_NAMES[number];

export type TaxPaymentCycle = 'monthly' | 'quarterly' | 'bi-annually' | 'annual';

export interface BusinessDetails {
  businessName: string;
  isNameLocked?: boolean;
  businessType?: string;
  businessModel?: string;
  startDateMonth: string;
  startDateYear: number;
  startDateFormatted?: string;
  scenario: string;
  daysWorkedPerWeek: number;
  workingDays?: Record<string, boolean>;
  deductHolidays?: boolean;
  holidaysDeducted: Array<{ name: string; from: string; to: string; days: number }>;
  annualShutdown?: {
    enabled: boolean;
    fromDate: string;
    toDate: string;
    daysCount: number;
  };
  departments: Array<{ id: string; name: string; distributionPct: number }>;
  setupAssumptions?: AssumptionRateItem[];
  taxPaymentCycle?: TaxPaymentCycle;
}

export interface RevenueItem {
  id: string;
  category: string;
  name: string;
  modelType?: string;
  modelParams?: Record<string, number>;
  unitPrice: number;
  costOfSalesPct: number;
  monthlyUnits: number[]; // 12-60 months
  startMonth?: number;   // 1-indexed operating launch month (e.g. Month 1)
  unitCost?: number;     // Direct cost per unit (R)
  dailyCapacity?: number;
  dailyUnitSalesMonthly?: number[];
  productionUnitCostMonthly?: number[];
  manufacturingMarginPctMonthly?: number[];
  grossProfitMarginPctMonthly?: number[];
  salesCommissionPctMonthly?: number[];
  inventoryAdjustmentPctMonthly?: number[];
  otherIncomeMonthly?: number[];
  batchLotsConfig?: BatchLotsProductConfig;
  continuousProductionConfig?: ContinuousProductionProductConfig;
  fabricationConfig?: FabricationProductConfig;
  familyRestaurantConfig?: FamilyRestaurantProductConfig;
  valueSalesCategoryId?: string;
  valueSalesConfig?: ValueSalesProductConfig;
  commissionCategoryId?: string;
  commissionConfig?: CommissionProductConfig;
  revenueShareCategoryId?: string;
  revenueShareConfig?: RevenueShareProductConfig;
  timeUnitsConfig?: TimeUnitsProductConfig;
  installationServicesConfig?: InstallationServicesProductConfig;
  measuredUnitsConfig?: MeasuredUnitsProductConfig;
  laundryConfig?: LaundryProductConfig;
  drycleanerConfig?: DrycleanerProductConfig;
  timeSlotsConfig?: TimeSlotsProductConfig;
}

export interface EmploymentCategory {
  id: string;
  name: string;
  onCostPct: number; // % benefit on-costs added to base rate (e.g. 20%, 15%)
  annualReviewPct?: number; // Optional annual review rate / increment
  description?: string;
  monthlyAdjustmentPct?: number[]; // 60 months adjustment from ADJUSTMENT SLIDER
}

export type EmploymentAllocation = 'cost_of_sales' | 'operating_expenses';
export type EmploymentType = 'permanent' | 'seasonal';

export interface EmploymentItem {
  id: string;
  title: string;
  categoryId: string;
  department: string;
  allocation: EmploymentAllocation; // cost_of_sales (Fixed COS) | operating_expenses (Fixed OPEX)
  baseRateMonthly: number; // Monthly base cost per FTE in Year 1 (R)
  startMonth: number; // Launch month (1-indexed)
  numEmployees: number; // Headcount (FTEs)
  employmentType: EmploymentType; // 'permanent' | 'seasonal'
  seasonalStartMonth?: number; // 1 to 12 (e.g. 6 for June)
  seasonalEndMonth?: number; // 1 to 12 (e.g. 9 for September)
  onCostPct?: number; // taxes, benefits fallback
}

export const DEFAULT_EMPLOYMENT_CATEGORIES: EmploymentCategory[] = [
  {
    id: 'cat-1',
    name: 'Executive / Leadership',
    onCostPct: 20,
    description: 'Executive directors, founders & corporate leadership',
    monthlyAdjustmentPct: new Array(60).fill(0),
  },
  {
    id: 'cat-2',
    name: 'Senior Management',
    onCostPct: 18,
    description: 'Department heads, commercial leads & senior managers',
    monthlyAdjustmentPct: new Array(60).fill(0),
  },
  {
    id: 'cat-3',
    name: 'Middle Management / Professional',
    onCostPct: 15,
    description: 'Specialists, engineers, team leads & senior supervisors',
    monthlyAdjustmentPct: new Array(60).fill(0),
  },
  {
    id: 'cat-4',
    name: 'Operations / Direct Plant',
    onCostPct: 12,
    description: 'Production operators, technicians, machine specialists & plant crew',
    monthlyAdjustmentPct: new Array(60).fill(0),
  },
  {
    id: 'cat-5',
    name: 'Administrative / Support',
    onCostPct: 10,
    description: 'Office administration, logistics, customer service & support team',
    monthlyAdjustmentPct: new Array(60).fill(0),
  },
];

export const DEFAULT_EMPLOYMENT_ITEMS: EmploymentItem[] = [
  {
    id: 'emp-1',
    title: 'Managing Director / CEO',
    categoryId: 'cat-1',
    department: 'administration',
    allocation: 'operating_expenses',
    baseRateMonthly: 65000,
    startMonth: 1,
    numEmployees: 1,
    employmentType: 'permanent',
    onCostPct: 20,
  },
  {
    id: 'emp-2',
    title: 'Plant & Production Manager',
    categoryId: 'cat-2',
    department: 'operations',
    allocation: 'cost_of_sales',
    baseRateMonthly: 45000,
    startMonth: 1,
    numEmployees: 1,
    employmentType: 'permanent',
    onCostPct: 18,
  },
  {
    id: 'emp-3',
    title: 'Senior Commercial Sales Lead',
    categoryId: 'cat-3',
    department: 'commercial & sales',
    allocation: 'operating_expenses',
    baseRateMonthly: 38000,
    startMonth: 1,
    numEmployees: 1,
    employmentType: 'permanent',
    onCostPct: 15,
  },
  {
    id: 'emp-4',
    title: 'Machine & Assembly Operators',
    categoryId: 'cat-4',
    department: 'operations',
    allocation: 'cost_of_sales',
    baseRateMonthly: 18000,
    startMonth: 1,
    numEmployees: 2,
    employmentType: 'permanent',
    onCostPct: 12,
  },
  {
    id: 'emp-5',
    title: 'Seasonal Assembly & Packing Crew',
    categoryId: 'cat-4',
    department: 'operations',
    allocation: 'cost_of_sales',
    baseRateMonthly: 12000,
    startMonth: 1,
    numEmployees: 3,
    employmentType: 'seasonal',
    seasonalStartMonth: 6, // June
    seasonalEndMonth: 9,   // September
    onCostPct: 12,
  },
];

export type ExpenseType = 'fixed' | 'variable';

export interface ExpenseItem {
  id: string;
  name: string;
  category: string;
  department?: string;
  type?: ExpenseType;
  startMonth: number;
  isAnnuity?: boolean;
  annuityMonth?: number; // 1 to 12 (e.g. 5 for May)
  pctOfRevenue?: number; // e.g. 1.00%
  baseRateMonthly: number; // e.g. 100 000 ZAR
  monthlyAmount: number; // backward-compatibility alias
  growthRatePct?: number;
  monthlyAdjustmentPct?: number[]; // 60-month slider adjustment
}

export interface OperatingExpensesSettings {
  allocationToCostOfSalesPct: number; // e.g. 1.00%
  hiLevelPreset?: {
    cosFixedPct?: number; // default 1.00%
    opexFixedPct?: number; // default 1.00%
    opexVarPct?: number; // default 1.00%
  };
  categoryAdjustments?: {
    cosShareOfFixed?: number[]; // 60 months
    opexVariable?: number[]; // 60 months
    opexFixed?: number[]; // 60 months
  };
}

export const DEFAULT_OPEX_SETTINGS: OperatingExpensesSettings = {
  allocationToCostOfSalesPct: 1.00,
  hiLevelPreset: {
    cosFixedPct: 1.00,
    opexFixedPct: 1.00,
    opexVarPct: 1.00,
  },
  categoryAdjustments: {
    cosShareOfFixed: new Array(60).fill(0),
    opexVariable: new Array(60).fill(0),
    opexFixed: new Array(60).fill(0),
  },
};

export const DEFAULT_EXPENSE_ITEMS: ExpenseItem[] = [
  {
    id: 'exp-1',
    name: 'advertising',
    category: 'selling',
    department: 'commercial & sales',
    type: 'variable',
    startMonth: 1,
    pctOfRevenue: 1.00,
    baseRateMonthly: 100000,
    monthlyAmount: 100000,
    growthRatePct: 0,
    monthlyAdjustmentPct: new Array(60).fill(0),
  },
  {
    id: 'exp-2',
    name: 'rent',
    category: 'occupancy',
    department: 'administration',
    type: 'fixed',
    startMonth: 1,
    baseRateMonthly: 100000,
    monthlyAmount: 100000,
    growthRatePct: 0,
    monthlyAdjustmentPct: new Array(60).fill(0),
  },
  {
    id: 'exp-3',
    name: 'electricity',
    category: 'occupancy',
    department: 'operations',
    type: 'fixed',
    startMonth: 1,
    baseRateMonthly: 100000,
    monthlyAmount: 100000,
    growthRatePct: 0,
    monthlyAdjustmentPct: new Array(60).fill(0),
  },
  {
    id: 'exp-4',
    name: 'telephone - fixed lines',
    category: 'other fixed',
    department: 'administration',
    type: 'fixed',
    startMonth: 1,
    baseRateMonthly: 100000,
    monthlyAmount: 100000,
    growthRatePct: 0,
    monthlyAdjustmentPct: new Array(60).fill(0),
  },
  {
    id: 'exp-5',
    name: 'insurance',
    category: 'other fixed',
    department: 'administration',
    type: 'fixed',
    startMonth: 1,
    isAnnuity: true,
    annuityMonth: 5, // Annuity Month 5
    baseRateMonthly: 100000,
    monthlyAmount: 100000,
    growthRatePct: 0,
    monthlyAdjustmentPct: new Array(60).fill(0),
  },
];

export const STANDARD_ASSET_CATEGORIES = [
  { name: "Commercial vehicles", depreciationRate: 20.00 },
  { name: "Computer hardware", depreciationRate: 33.33 },
  { name: "Computer software", depreciationRate: 33.33 },
  { name: "Furniture and fittings", depreciationRate: 16.67 },
  { name: "Handling equipment", depreciationRate: 25.00 },
  { name: "Office equipment", depreciationRate: 16.67 },
  { name: "Passenger vehicles", depreciationRate: 20.00 },
  { name: "Plat and equipment", depreciationRate: 16.67 },
  { name: "Security equipment", depreciationRate: 20.00 },
  { name: "Workshop equipment", depreciationRate: 20.00 }
] as const;

export interface StandardAssetCategoryDef {
  name: string;
  depreciationRate: number;
}

export interface FixedAssetItem {
  id: string;
  name: string; // asset description
  category?: string; // from 10 standard categories
  allocation?: 'cost_of_sales' | 'overheads'; // choice of cost of sales / overheads
  department?: string; // selection from list setup in setup step
  purchaseMonth: number; // 1 - 60
  quantity: number; // number of items purchased (e.g. 1)
  unitCost: number; // cost of asset
  purchaseCost: number; // backward compatibility & total purchase value = unitCost * quantity
  purchaseValue?: number; // alias unitCost * quantity
  depreciationRate?: number; // % per annum e.g. 20.00%
  usefulLifeMonths: number; // derived from 1200 / depreciationRate
  scrapValue: number; // scrap residual value, defaults to 0
  financeOption?: 'buy' | 'lease'; // option: buy / lease
  purchaseTiming?: 'forecast' | 'prior'; // 'prior' = purchases prior to forecast period (Year 0), 'forecast' = purchases for forecast period (M1-60)
  monthsInSystem?: number; // months asset has been in system prior to forecast (e.g. 10)
  // If lease:
  leaseRatePct?: number; // e.g. 10.00%
  leaseTermYears?: number; // e.g. 5 or 10 years
  // Year 0 opening values (for rolling-forecast; shown greyed out in other apps):
  openingCost?: number; // original cost in year 0
  openingAccumulatedDepreciation?: number; // accumulated depreciation in year 0
  openingNetValue?: number; // openingCost - openingAccumulatedDepreciation
  openingLeasedAsset?: number; // leased asset value in year 0
  openingInterestRatePct?: number; // lease interest rate
  openingPeriodElapsed?: number; // period elapsed in months (e.g. 12)
  openingTermYears?: number; // lease term in years
}

export const DEFAULT_FIXED_ASSETS: FixedAssetItem[] = [
  {
    id: 'fa-1',
    name: 'Plant and equipment unit',
    category: 'Plat and equipment',
    allocation: 'cost_of_sales',
    department: 'operations',
    purchaseMonth: 2,
    quantity: 1,
    unitCost: 200000,
    purchaseCost: 200000,
    purchaseValue: 200000,
    depreciationRate: 20.00,
    usefulLifeMonths: 60,
    scrapValue: 0,
    financeOption: 'buy',
    openingCost: 100000,
    openingAccumulatedDepreciation: 20000,
    openingNetValue: 80000,
  },
  {
    id: 'fa-2',
    name: 'Commercial fleet vehicle',
    category: 'Commercial vehicles',
    allocation: 'cost_of_sales',
    department: 'operations',
    purchaseMonth: 2,
    quantity: 1,
    unitCost: 200000,
    purchaseCost: 200000,
    purchaseValue: 200000,
    depreciationRate: 20.00,
    usefulLifeMonths: 60,
    scrapValue: 0,
    financeOption: 'lease',
    leaseRatePct: 10.00,
    leaseTermYears: 10,
    openingLeasedAsset: 100000,
    openingInterestRatePct: 10.00,
    openingPeriodElapsed: 12,
    openingTermYears: 10,
  },
];

export interface TermLoanEntry {
  id: string;
  name: string;
  advanceMonth: number; // 1 - 60
  advanceValue: number;
  advanceRatePct: number;
  termYears: number;
}

export interface ShareIssueEvent {
  id: string;
  month: number;
  sharesIssued: number;
  issuePrice: number;
}

export interface FundingSettings {
  founderEquity: number;
  investorEquity: number;
  bankLoanAmount: number;
  interestRatePct: number;
  loanTermMonths: number;
  loanStartMonth: number;
  overdraftLimit: number;
  creditorDays: number; // DPO
  debtorDays: number; // DSO
  inventoryDays: number; // DIO
  equityLoan?: number;

  // Monthly Working Capital Days (60 months)
  inventoryDaysMonthly?: number[];
  debtorDaysMonthly?: number[];
  creditorDaysMonthly?: number[];

  // Other Assets (deposits, floats, petty cash)
  depositsBase?: number;
  floatsBase?: number;
  pettyCashBase?: number;
  depositsMonthly?: number[];
  floatsMonthly?: number[];
  pettyCashMonthly?: number[];

  // Term loans array
  termLoans?: TermLoanEntry[];

  // Share capital
  initialSharesCount?: number;
  initialSharePrice?: number;
  additionalSharesMonthly?: number[];
  additionalSharePriceMonthly?: number[];
  shareIssues?: ShareIssueEvent[];

  // Equity loan
  equityLoanOpening?: number;
  equityLoanAdditionalMonthly?: number[];
  equityLoanRepaymentsMonthly?: number[];

  // Dividends
  dividendsPerShareBase?: number;
  dividendsPerShareMonthly?: number[];
}

export interface HiLevelYtdActuals {
  /** Update month for YTD management accounts data input (1 = Month 1 .. 12 = Full Year 1) */
  updateMonth: number;
  /** How fixed costs project after updateMonth: 'distribution' (% of rev) or 'fixed-run-rate' (ytd / updateMonth) */
  projectionBasis: 'distribution' | 'fixed-run-rate';
  /** Optional annual revenue growth rate % applied to Months (updateMonth+1 .. 60) */
  annualRevenueGrowthPct: number;

  // --- YTD Trading Account (Months 1 .. updateMonth) ---
  ytdRevenue: number;
  ytdCosVariable: number;      // Direct materials / purchases
  ytdCosEmployment: number;    // Direct production payroll
  ytdCosOverheads: number;     // Production / direct fixed overheads
  ytdGpAdjCommission: number;  // Sales commission
  ytdGpAdjInventory: number;   // Stock shrinkage / inventory adjustment
  ytdGpAdjVariance: number;    // Manufacturing / cost variance
  ytdOtherIncome: number;      // Non-trading / sundry income
  ytdOpexEmployment: number;   // Admin / commercial salaries
  ytdOpexVariable: number;     // Variable selling & marketing opex
  ytdOpexOverheads: number;    // Fixed operating overheads (rent, utilities, admin)
  ytdDividends: number;        // Dividends declared YTD

  // --- Balance Sheet as at end of updateMonth ---
  bsInventory: number;              // Closing stock -> derives Inventory Days (DIO)
  bsReceivables: number;            // Closing debtors -> derives Receivable Days (DSO)
  bsPayables: number;               // Closing creditors -> derives Payable Days (DPO)
  bsBankBalance: number;            // Closing cash (+ positive / - overdraft)
  bsVatReceivable: number;          // Input VAT refundable at updateMonth
  bsVatPayable: number;             // Output VAT payable at updateMonth
  bsTaxLiability: number;           // Corporate tax payable at updateMonth
  bsOpeningRetainedEarnings: number; // Retained earnings brought forward at start of financial year
  bsDeposits: number;               // Other assets: deposits
  bsFloats: number;                 // Other assets: floats
  bsPettyCash: number;              // Other assets: petty cash
}

export const EMPTY_HILEVEL_YTD_ACTUALS: HiLevelYtdActuals = {
  updateMonth: 3,
  projectionBasis: 'distribution',
  annualRevenueGrowthPct: 0,
  ytdRevenue: 0,
  ytdCosVariable: 0,
  ytdCosEmployment: 0,
  ytdCosOverheads: 0,
  ytdGpAdjCommission: 0,
  ytdGpAdjInventory: 0,
  ytdGpAdjVariance: 0,
  ytdOtherIncome: 0,
  ytdOpexEmployment: 0,
  ytdOpexVariable: 0,
  ytdOpexOverheads: 0,
  ytdDividends: 0,
  bsInventory: 0,
  bsReceivables: 0,
  bsPayables: 0,
  bsBankBalance: 0,
  bsVatReceivable: 0,
  bsVatPayable: 0,
  bsTaxLiability: 0,
  bsOpeningRetainedEarnings: 0,
  bsDeposits: 0,
  bsFloats: 0,
  bsPettyCash: 0,
};

export const SAMPLE_HILEVEL_YTD_ACTUALS: HiLevelYtdActuals = {
  updateMonth: 3,
  projectionBasis: 'distribution',
  annualRevenueGrowthPct: 5,
  ytdRevenue: 2400000,
  ytdCosVariable: 1140000,
  ytdCosEmployment: 210000,
  ytdCosOverheads: 96000,
  ytdGpAdjCommission: 24000,
  ytdGpAdjInventory: 12000,
  ytdGpAdjVariance: 0,
  ytdOtherIncome: 18000,
  ytdOpexEmployment: 330000,
  ytdOpexVariable: 72000,
  ytdOpexOverheads: 195000,
  ytdDividends: 0,
  bsInventory: 420000,
  bsReceivables: 760000,
  bsPayables: 510000,
  bsBankBalance: 385000,
  bsVatReceivable: 0,
  bsVatPayable: 48000,
  bsTaxLiability: 62000,
  bsOpeningRetainedEarnings: 594000,
  bsDeposits: 45000,
  bsFloats: 12000,
  bsPettyCash: 8000,
};

export interface HighLevelForecastData {
  dailyRevenue: number;
  dailyGrowthPct: number;
  workingDaysPerMonth: number;
  costOfSalesPct: number;
  directLaborPct: number;
  fixedOpexMonthly: number;
  cashReserves: number;
  debtFunding: number;
  interestRatePct: number;
  targetHorizonMonths: 12 | 24 | 36;
}

export interface EmploymentImportMeta {
  fileName: string;
  importedAt: string;
  privacyMode: 'aggregated' | 'masked';
  sourceRowCount: number;
  importedLineCount: number;
  totalHeadcount: number;
}

export interface BizzModelState {
  appMode?: PlatformForecastAppId;
  activeModelSet?: 'unit-sales' | 'value-sales' | 'commission' | 'revenue-share' | 'batch-lots' | 'continuous-production' | 'fabrication' | 'family-restaurant' | 'time-units' | 'installation-services' | 'measured-units' | 'laundry' | 'drycleaning' | 'time-slots';
  businessDetails: BusinessDetails;
  valueSalesCategories?: ValueSalesCategory[];
  commissionCategories?: CommissionCategory[];
  revenueShareCategories?: RevenueShareCategory[];
  revenueItems: RevenueItem[];
  employmentCategories?: EmploymentCategory[];
  employmentItems: EmploymentItem[];
  employmentPrivacyMode?: boolean;
  employmentImportMeta?: EmploymentImportMeta;
  expenses: ExpenseItem[];
  opexSettings?: OperatingExpensesSettings;
  assetCategories?: StandardAssetCategoryDef[];
  fixedAssets: FixedAssetItem[];
  funding: FundingSettings;
  highLevelForecast: HighLevelForecastData;
  hiLevelActuals?: HiLevelYtdActuals;
  bizzOptimizer?: BizzOptimizerState;
}

export const DEFAULT_BUSINESS_STATE: BizzModelState = {
  businessDetails: {
    businessName: 'Bizzbean Admin Headquarters',
    isNameLocked: false,
    startDateMonth: 'November',
    startDateYear: 2026,
    startDateFormatted: '2026-11',
    scenario: 'Target Institutional Baseline',
    daysWorkedPerWeek: 5,
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
    deductHolidays: true,
    annualShutdown: {
      enabled: false,
      fromDate: '12-20',
      toDate: '01-05',
      daysCount: 11,
    },
    holidaysDeducted: [
      { name: "New Year's Day", from: '2026-01-01', to: '2026-01-01', days: 1 },
      { name: 'Human Rights Day', from: '2026-03-21', to: '2026-03-21', days: 1 },
      { name: 'Good Friday', from: '2026-04-03', to: '2026-04-03', days: 1 },
      { name: 'Freedom Day', from: '2026-04-27', to: '2026-04-27', days: 1 },
      { name: "Workers' Day", from: '2026-05-01', to: '2026-05-01', days: 1 },
      { name: 'Youth Day', from: '2026-06-16', to: '2026-06-16', days: 1 },
      { name: "National Women's Day", from: '2026-08-09', to: '2026-08-09', days: 1 },
      { name: 'Heritage Day', from: '2026-09-24', to: '2026-09-24', days: 1 },
      { name: 'Day of Reconciliation', from: '2026-12-16', to: '2026-12-16', days: 1 },
      { name: 'Christmas Day', from: '2026-12-25', to: '2026-12-25', days: 1 },
      { name: 'Day of Goodwill', from: '2026-12-26', to: '2026-12-26', days: 1 },
    ],
    departments: [
      { id: 'dep-1', name: 'administration', distributionPct: 40 },
      { id: 'dep-2', name: 'commercial & sales', distributionPct: 30 },
      { id: 'dep-3', name: 'product & engineering', distributionPct: 20 },
      { id: 'dep-4', name: 'operations', distributionPct: 10 },
    ],
    taxPaymentCycle: 'monthly',
  },
  // Baseline initial state for reports & subsequent data-entry steps
  revenueItems: [],
  employmentCategories: DEFAULT_EMPLOYMENT_CATEGORIES,
  employmentItems: DEFAULT_EMPLOYMENT_ITEMS,
  expenses: DEFAULT_EXPENSE_ITEMS,
  opexSettings: DEFAULT_OPEX_SETTINGS,
  assetCategories: [...STANDARD_ASSET_CATEGORIES],
  fixedAssets: DEFAULT_FIXED_ASSETS,
  funding: {
    founderEquity: 0,
    investorEquity: 0,
    equityLoan: 0,
    bankLoanAmount: 0,
    interestRatePct: 10.0,
    loanTermMonths: 60,
    loanStartMonth: 1,
    overdraftLimit: 0,
    creditorDays: 0,
    debtorDays: 0,
    inventoryDays: 0,
    depositsBase: 0,
    floatsBase: 0,
    pettyCashBase: 0,
    termLoans: [
      {
        id: 'term-loan-1',
        name: 'Standard Commercial Term Loan',
        advanceMonth: 1,
        advanceValue: 400000,
        advanceRatePct: 10.0,
        termYears: 5,
      },
    ],
    initialSharesCount: 1000,
    initialSharePrice: 1.0,
    equityLoanOpening: -20000,
    dividendsPerShareBase: 0,
  },
  highLevelForecast: {
    dailyRevenue: 0,
    dailyGrowthPct: 0,
    workingDaysPerMonth: 22,
    costOfSalesPct: 0,
    directLaborPct: 0,
    fixedOpexMonthly: 0,
    cashReserves: 0,
    debtFunding: 0,
    interestRatePct: 11.5,
    targetHorizonMonths: 36,
  },
};

export type PlatformForecastAppId = 'bizzdynamics' | 'rolling-forecast' | 'hi-level-forecast' | 'bizzmodel' | 'bizzbudget';

export const DEFAULT_SETUP_ASSUMPTIONS: AssumptionRateItem[] = [
  {
    id: 'interest-pos',
    stepId: 1,
    stepName: 'business details',
    name: 'bank interest rate',
    description: 'Interest earned on surplus cash & money market reserves',
    baseRate: 4.5,
    unit: '%',
    changeType: 'percentage',
    monthlyValues: new Array(60).fill(4.5),
  },
  {
    id: 'interest-neg',
    stepId: 1,
    stepName: 'business details',
    name: 'overdraft interest rate',
    description: 'Overdraft facility interest charges on deficit balances',
    baseRate: 11.75,
    unit: '%',
    changeType: 'percentage',
    monthlyValues: new Array(60).fill(11.75),
  },
  {
    id: 'vat-rate',
    stepId: 1,
    stepName: 'business details',
    name: 'vat rate %',
    description: 'Standard value-added tax rate applicable to sales & allowable inputs',
    baseRate: 0,
    unit: '%',
    changeType: 'percentage',
    monthlyValues: new Array(60).fill(0),
  },
  {
    id: 'tax-rate',
    stepId: 1,
    stepName: 'business details',
    name: 'tax rate %',
    description: 'Corporate income tax rate (CIT) on net taxable corporate profits',
    baseRate: 0,
    unit: '%',
    changeType: 'percentage',
    monthlyValues: new Array(60).fill(0),
  },
];

export function createDefaultRollingForecastState(): BizzModelState {
  const rollingAssumptions: AssumptionRateItem[] = DEFAULT_SETUP_ASSUMPTIONS.map((a) => {
    if (a.id === 'vat-rate') return { ...a, baseRate: 15, monthlyValues: new Array(60).fill(15) };
    if (a.id === 'tax-rate') return { ...a, baseRate: 27, monthlyValues: new Array(60).fill(27) };
    return { ...a, monthlyValues: [...a.monthlyValues] };
  });

  return {
    ...DEFAULT_BUSINESS_STATE,
    appMode: 'rolling-forecast',
    businessDetails: {
      ...DEFAULT_BUSINESS_STATE.businessDetails,
      businessName: 'BizzOptimizer Enterprise',
      scenario: 'YTD Actuals + 60-Month BizzOptimizer Forecast',
      setupAssumptions: rollingAssumptions,
    },
    revenueItems: [],
    employmentItems: [],
    expenses: [],
    fixedAssets: [
      {
        id: 'hl-fa-1',
        name: 'Operating Plant & Equipment (Opening)',
        category: 'Plat and equipment',
        allocation: 'cost_of_sales',
        department: 'operations',
        purchaseTiming: 'prior',
        monthsInSystem: 12,
        purchaseMonth: 1,
        quantity: 1,
        unitCost: 480000,
        purchaseCost: 480000,
        purchaseValue: 480000,
        depreciationRate: 16.67,
        usefulLifeMonths: 72,
        scrapValue: 0,
        financeOption: 'buy',
      },
      {
        id: 'hl-fa-2',
        name: 'Office IT & Furniture (Opening)',
        category: 'Furniture and fittings',
        allocation: 'overheads',
        department: 'administration',
        purchaseTiming: 'prior',
        monthsInSystem: 6,
        purchaseMonth: 1,
        quantity: 1,
        unitCost: 180000,
        purchaseCost: 180000,
        purchaseValue: 180000,
        depreciationRate: 20.0,
        usefulLifeMonths: 60,
        scrapValue: 0,
        financeOption: 'buy',
      },
    ],
    funding: {
      ...DEFAULT_BUSINESS_STATE.funding,
      inventoryDays: 25,
      debtorDays: 25,
      creditorDays: 28,
      inventoryDaysMonthly: new Array(60).fill(25),
      debtorDaysMonthly: new Array(60).fill(25),
      creditorDaysMonthly: new Array(60).fill(28),
      depositsBase: SAMPLE_HILEVEL_YTD_ACTUALS.bsDeposits,
      floatsBase: SAMPLE_HILEVEL_YTD_ACTUALS.bsFloats,
      pettyCashBase: SAMPLE_HILEVEL_YTD_ACTUALS.bsPettyCash,
      depositsMonthly: new Array(60).fill(SAMPLE_HILEVEL_YTD_ACTUALS.bsDeposits),
      floatsMonthly: new Array(60).fill(SAMPLE_HILEVEL_YTD_ACTUALS.bsFloats),
      pettyCashMonthly: new Array(60).fill(SAMPLE_HILEVEL_YTD_ACTUALS.bsPettyCash),
      initialSharesCount: 100000,
      initialSharePrice: 2.5,
      equityLoanOpening: -150000,
      termLoans: [
        {
          id: 'hl-tl-1',
          name: 'Operating Commercial Term Loan',
          advanceMonth: 1,
          advanceValue: 400000,
          advanceRatePct: 10.5,
          termYears: 5,
        },
      ],
    },
    hiLevelActuals: { ...SAMPLE_HILEVEL_YTD_ACTUALS },
    bizzOptimizer: {
      targets: { ...DEFAULT_BIZZOPTIMIZER_STATE.targets },
      actions: [],
    },
  };
}
