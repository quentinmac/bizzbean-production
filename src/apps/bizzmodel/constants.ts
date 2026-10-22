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

export interface BusinessDetails {
  businessName: string;
  businessType?: string;
  businessModel?: string;
  startDateMonth: string;
  startDateYear: number;
  scenario: string;
  daysWorkedPerWeek: number;
  holidaysDeducted: Array<{ name: string; from: string; to: string; days: number }>;
  departments: Array<{ id: string; name: string; distributionPct: number }>;
}

export interface RevenueItem {
  id: string;
  category: string;
  name: string;
  modelType?: string;
  modelParams?: Record<string, number>;
  unitPrice: number;
  costOfSalesPct: number;
  monthlyUnits: number[]; // 12-36 months
}

export interface EmploymentItem {
  id: string;
  title: string;
  department: string;
  baseRateMonthly: number;
  startMonth: number;
  numEmployees: number;
  onCostPct: number; // taxes, benefits
}

export interface ExpenseItem {
  id: string;
  category: string;
  name: string;
  monthlyAmount: number;
  startMonth: number;
  growthRatePct: number;
}

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
  name: string;
  category?: string;
  depreciationRate?: number;
  purchaseCost: number;
  purchaseMonth: number;
  usefulLifeMonths: number;
  scrapValue: number;
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
}

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

export interface BizzModelState {
  businessDetails: BusinessDetails;
  revenueItems: RevenueItem[];
  employmentItems: EmploymentItem[];
  expenses: ExpenseItem[];
  fixedAssets: FixedAssetItem[];
  funding: FundingSettings;
  highLevelForecast: HighLevelForecastData;
}

export const DEFAULT_BUSINESS_STATE: BizzModelState = {
  businessDetails: {
    businessName: 'Bizzbean Admin Headquarters',
    startDateMonth: 'September',
    startDateYear: 2026,
    scenario: 'Target Institutional Baseline',
    daysWorkedPerWeek: 5,
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
      { id: 'dep-1', name: 'administration', distributionPct: 100 },
      { id: 'dep-2', name: 'commercial & sales', distributionPct: 0 },
      { id: 'dep-3', name: 'product & engineering', distributionPct: 0 },
    ],
  },
  revenueItems: [
    {
      id: 'rev-1',
      category: 'RETAIL PRODUCTS',
      name: 'Digital Platform License Tier 1',
      unitPrice: 229,
      costOfSalesPct: 28,
      monthlyUnits: [150, 165, 185, 210, 240, 280, 320, 370, 420, 480, 550, 630],
    },
    {
      id: 'rev-2',
      category: 'RETAIL PRODUCTS',
      name: 'Enterprise Sandbox Advisory Package',
      unitPrice: 1250,
      costOfSalesPct: 35,
      monthlyUnits: [15, 18, 22, 25, 30, 35, 42, 48, 55, 62, 70, 80],
    },
  ],
  employmentItems: [
    {
      id: 'emp-1',
      title: 'Operations Director',
      department: 'administration',
      baseRateMonthly: 45000,
      startMonth: 1,
      numEmployees: 1,
      onCostPct: 18,
    },
    {
      id: 'emp-2',
      title: 'Senior Software Engineer',
      department: 'product & engineering',
      baseRateMonthly: 38000,
      startMonth: 1,
      numEmployees: 2,
      onCostPct: 15,
    },
    {
      id: 'emp-3',
      title: 'Customer Success Specialist',
      department: 'commercial & sales',
      baseRateMonthly: 18000,
      startMonth: 3,
      numEmployees: 1,
      onCostPct: 12,
    },
  ],
  expenses: [
    { id: 'exp-1', category: 'Software & Cloud', name: 'Cloud Server Infrastructure (AWS/GCP)', monthlyAmount: 6500, startMonth: 1, growthRatePct: 2 },
    { id: 'exp-2', category: 'Rent & Facilities', name: 'Main Innovation Hub Co-Working', monthlyAmount: 14000, startMonth: 1, growthRatePct: 0 },
    { id: 'exp-3', category: 'Marketing', name: 'Search Engine & LinkedIn Acquisition', monthlyAmount: 12000, startMonth: 1, growthRatePct: 4 },
    { id: 'exp-4', category: 'Professional Fees', name: 'Accounting, Audit & Legal Retainer', monthlyAmount: 4500, startMonth: 1, growthRatePct: 0 },
    { id: 'exp-5', category: 'Telecoms', name: 'Fibre Internet & Team VOIP', monthlyAmount: 2200, startMonth: 1, growthRatePct: 0 },
  ],
  fixedAssets: [
    { id: 'fa-1', name: 'Engineering Workstations & Hardware', purchaseCost: 85000, purchaseMonth: 1, usefulLifeMonths: 36, scrapValue: 5000 },
    { id: 'fa-2', name: 'Studio Video Production Rig', purchaseCost: 35000, purchaseMonth: 2, usefulLifeMonths: 24, scrapValue: 2000 },
  ],
  funding: {
    founderEquity: 150000,
    investorEquity: 350000,
    bankLoanAmount: 120000,
    interestRatePct: 11.5,
    loanTermMonths: 36,
    loanStartMonth: 1,
    overdraftLimit: 50000,
    creditorDays: 30,
    debtorDays: 45,
    inventoryDays: 15,
  },
  highLevelForecast: {
    dailyRevenue: 4500,
    dailyGrowthPct: 0.25,
    workingDaysPerMonth: 22,
    costOfSalesPct: 28,
    directLaborPct: 22,
    fixedOpexMonthly: 48000,
    cashReserves: 250000,
    debtFunding: 120000,
    interestRatePct: 11.5,
    targetHorizonMonths: 36,
  },
};
