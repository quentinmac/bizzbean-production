export { STANDARD_OPEX_NAMES, STANDARD_ASSET_CATEGORIES } from '../bizzmodel/constants';
export type { StandardOpexName, StandardAssetCategoryDef } from '../bizzmodel/constants';

export interface BizzCalcData {
  setup: {
    businessName: string;
    region: string;
    businessType: 'trading' | 'manufacturing' | 'services' | string;
    businessModel: 'unit sales' | 'value sales' | 'revenue share' | 'commission';
    unitSales: string;
    startMonth: string; // e.g. "2026-06"
    departments: Array<{ name: string; distribution: number }>;
    daysWorked: {
      days: string[]; // e.g. ["monday", "tuesday", "wednesday", "thursday", "friday"]
      deductHolidays: boolean;
      holidays: Array<{ name: string; from: string; to: string; recurring: boolean }>;
    };
    interestRates: {
      positiveBase: number;
      positiveAdjustments: number[]; // 12 months
      negativeBase: number;
      negativeAdjustments: number[]; // 12 months
    };
    vatRate: { base: number; adjustments: number[] };
    taxRate: { base: number; adjustments: number[] };
  };

  revenue: {
    productCategories: Array<{
      id: string;
      name: string;
      startMonth: number;
      baseValueSales: number;
      valueSalesAdjustments: number[]; // 12 months % adjustments
      grossProfitMargin: number;
    }>;
  };

  employment: {
    categories: string[]; // ["management", "support staff", "operators", "marketing team"]
    onCosts: Record<string, {
      benefits: number;
      bonus: number;
      leavePay: number;
      recruitment: number;
      training: number;
      workmensComp: number;
    }>;
    staff: Array<{
      id: string;
      position: string;
      category: string;
      department: string;
      allocation: 'cost of sales' | 'operating expenses';
      expenseType: 'fixed' | 'variable';
      salary: number; // annual
      count: number[]; // 12 months
      staffCount: number;
      startMonth: number;
      endMonth: number;
    }>;
    reviewMonth: number;
    reviewRate: number;
  };

  operatingExpenses: {
    expenses: Array<{
      id: string;
      name: string;
      baseRate: number; // monthly
      startMonth: number;
      endMonth: number;
      allocation: 'cost of sales' | 'operating expenses';
      expenseType: 'fixed' | 'variable';
      department: string;
      variablePercent: number;
    }>;
    reviewMonth: number;
    reviewRate: number;
  };

  fixedAssets: {
    categories: Array<{ name: string; depreciationRate: number }>;
    assets: Array<{
      id: string;
      description: string;
      allocation: 'cost of sales' | 'operating expenses';
      department: string;
      purchaseOption: 'outright' | 'lease';
      purchaseMonth: number;
      itemCost: number;
      qty: number;
      purchaseValue: number;
      leaseRate: number;
      leaseTerm: number;
      usefulLife: number;
      residualValue: number;
      endMonth: number;
      category: string;
    }>;
  };

  funding: {
    workingCapital: {
      inventoryDays: { base: number; month: number; annualAdjustments: number[] };
      receivableDays: { base: number; month: number; annualAdjustments: number[] };
      payableDays: { base: number; month: number; annualAdjustments: number[] };
    };
    otherAssets: {
      deposits: { base: number; month: number; annualAdjustments: number[] };
      floats: { base: number; month: number; annualAdjustments: number[] };
      pettyCash: { base: number; month: number; annualAdjustments: number[] };
    };
    revolvingCredit: {
      advanceMonth: number;
      advanceValue: number;
      advanceRate: number;
      interestRate: number;
    };
    assetBasedLoan: {
      advanceMonth: number;
      advanceValue: number;
      advanceRate: number;
      termYears: number;
    };
    termLoan: {
      advanceMonth: number;
      advanceValue: number;
      advanceRate: number;
      termYears: number;
    };
    shareCapital: {
      month: number;
      sharesIssued: number[];
      issuePrice: number[];
    };
    equityLoan: {
      month: number;
      annualAdjustments: number[];
    };
  };
}

export const DEFAULT_BIZZCALC_DATA: BizzCalcData = {
  setup: {
    businessName: 'Bizzbean Operating Enterprise',
    region: 'South Africa (ZAR)',
    businessType: 'services',
    businessModel: 'unit sales',
    unitSales: 'standard',
    startMonth: '2026-06',
    departments: [
      { name: 'administration', distribution: 40 },
      { name: 'commercial & sales', distribution: 30 },
      { name: 'product & engineering', distribution: 30 },
    ],
    daysWorked: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      deductHolidays: true,
      holidays: [
        { name: "New Year's Day", from: '2026-01-01', to: '2026-01-01', recurring: true },
        { name: 'Human Rights Day', from: '2026-03-21', to: '2026-03-21', recurring: true },
        { name: 'Good Friday', from: '2026-04-03', to: '2026-04-03', recurring: false },
        { name: 'Family Day', from: '2026-04-06', to: '2026-04-06', recurring: false },
        { name: 'Freedom Day', from: '2026-04-27', to: '2026-04-27', recurring: true },
        { name: "Workers' Day", from: '2026-05-01', to: '2026-05-01', recurring: true },
        { name: 'Youth Day', from: '2026-06-16', to: '2026-06-16', recurring: true },
        { name: "National Women's Day", from: '2026-08-09', to: '2026-08-09', recurring: true },
        { name: 'Heritage Day', from: '2026-09-24', to: '2026-09-24', recurring: true },
        { name: 'Day of Reconciliation', from: '2026-12-16', to: '2026-12-16', recurring: true },
        { name: 'Christmas Day', from: '2026-12-25', to: '2026-12-25', recurring: true },
        { name: 'Day of Goodwill', from: '2026-12-26', to: '2026-12-26', recurring: true },
      ],
    },
    interestRates: {
      positiveBase: 4.5,
      positiveAdjustments: Array(12).fill(0),
      negativeBase: 11.5,
      negativeAdjustments: Array(12).fill(0),
    },
    vatRate: { base: 15, adjustments: Array(12).fill(0) },
    taxRate: { base: 27, adjustments: Array(12).fill(0) },
  },
  revenue: {
    productCategories: [
      {
        id: 'cat-1',
        name: 'Enterprise Subscriptions',
        startMonth: 1,
        baseValueSales: 150000,
        valueSalesAdjustments: [0, 5, 8, 12, 15, 20, 25, 30, 35, 40, 45, 50],
        grossProfitMargin: 70,
      },
      {
        id: 'cat-2',
        name: 'Professional Services & Setup',
        startMonth: 1,
        baseValueSales: 80000,
        valueSalesAdjustments: [0, 0, 5, 10, 10, 15, 15, 20, 20, 25, 25, 30],
        grossProfitMargin: 55,
      },
    ],
  },
  employment: {
    categories: ['management', 'support staff', 'operators', 'marketing team'],
    onCosts: {
      management: { benefits: 10, bonus: 5, leavePay: 4, recruitment: 2, training: 3, workmensComp: 1 },
      'support staff': { benefits: 8, bonus: 3, leavePay: 4, recruitment: 1, training: 2, workmensComp: 1 },
      operators: { benefits: 5, bonus: 2, leavePay: 4, recruitment: 1, training: 2, workmensComp: 2 },
      'marketing team': { benefits: 8, bonus: 4, leavePay: 4, recruitment: 2, training: 2, workmensComp: 1 },
    },
    staff: [
      {
        id: 'st-1',
        position: 'Executive Director',
        category: 'management',
        department: 'administration',
        allocation: 'operating expenses',
        expenseType: 'fixed',
        salary: 650000,
        count: Array(12).fill(1),
        staffCount: 1,
        startMonth: 1,
        endMonth: 12,
      },
      {
        id: 'st-2',
        position: 'Lead Systems Developer',
        category: 'operators',
        department: 'product & engineering',
        allocation: 'cost of sales',
        expenseType: 'fixed',
        salary: 480000,
        count: Array(12).fill(2),
        staffCount: 2,
        startMonth: 1,
        endMonth: 12,
      },
      {
        id: 'st-3',
        position: 'Sales Account Representative',
        category: 'marketing team',
        department: 'commercial & sales',
        allocation: 'operating expenses',
        expenseType: 'variable',
        salary: 240000,
        count: Array(12).fill(1),
        staffCount: 1,
        startMonth: 2,
        endMonth: 12,
      },
    ],
    reviewMonth: 7,
    reviewRate: 6.5,
  },
  operatingExpenses: {
    expenses: [
      {
        id: 'opex-1',
        name: 'Premises Lease & Rates',
        baseRate: 15000,
        startMonth: 1,
        endMonth: 12,
        allocation: 'operating expenses',
        expenseType: 'fixed',
        department: 'administration',
        variablePercent: 0,
      },
      {
        id: 'opex-2',
        name: 'Cloud Computing & Hosting',
        baseRate: 8500,
        startMonth: 1,
        endMonth: 12,
        allocation: 'cost of sales',
        expenseType: 'variable',
        department: 'product & engineering',
        variablePercent: 3,
      },
      {
        id: 'opex-3',
        name: 'Acquisition & Digital Campaigns',
        baseRate: 12000,
        startMonth: 1,
        endMonth: 12,
        allocation: 'operating expenses',
        expenseType: 'variable',
        department: 'commercial & sales',
        variablePercent: 5,
      },
    ],
    reviewMonth: 7,
    reviewRate: 5.0,
  },
  fixedAssets: {
    categories: [
      { name: 'Computer Equipment', depreciationRate: 33.33 },
      { name: 'Office Furniture', depreciationRate: 16.67 },
      { name: 'Production Plant & Machinery', depreciationRate: 20 },
      { name: 'Motor Vehicles', depreciationRate: 25 },
    ],
    assets: [
      {
        id: 'fa-1',
        description: 'Developer Laptops & Dual Monitors',
        allocation: 'operating expenses',
        department: 'product & engineering',
        purchaseOption: 'outright',
        purchaseMonth: 1,
        itemCost: 28000,
        qty: 3,
        purchaseValue: 84000,
        leaseRate: 0,
        leaseTerm: 0,
        usefulLife: 36,
        residualValue: 5000,
        endMonth: 12,
        category: 'Computer Equipment',
      },
      {
        id: 'fa-2',
        description: 'Office Workstation Suites',
        allocation: 'operating expenses',
        department: 'administration',
        purchaseOption: 'outright',
        purchaseMonth: 1,
        itemCost: 6500,
        qty: 5,
        purchaseValue: 32500,
        leaseRate: 0,
        leaseTerm: 0,
        usefulLife: 60,
        residualValue: 2000,
        endMonth: 12,
        category: 'Office Furniture',
      },
    ],
  },
  funding: {
    workingCapital: {
      inventoryDays: { base: 20, month: 1, annualAdjustments: [0, 0, 0] },
      receivableDays: { base: 35, month: 1, annualAdjustments: [0, 0, 0] },
      payableDays: { base: 30, month: 1, annualAdjustments: [0, 0, 0] },
    },
    otherAssets: {
      deposits: { base: 30000, month: 1, annualAdjustments: [0, 0, 0] },
      floats: { base: 5000, month: 1, annualAdjustments: [0, 0, 0] },
      pettyCash: { base: 2500, month: 1, annualAdjustments: [0, 0, 0] },
    },
    revolvingCredit: {
      advanceMonth: 1,
      advanceValue: 50000,
      advanceRate: 10.5,
      interestRate: 11.5,
    },
    assetBasedLoan: {
      advanceMonth: 1,
      advanceValue: 120000,
      advanceRate: 11.0,
      termYears: 5,
    },
    termLoan: {
      advanceMonth: 1,
      advanceValue: 200000,
      advanceRate: 10.5,
      termYears: 5,
    },
    shareCapital: {
      month: 1,
      sharesIssued: [100000],
      issuePrice: [1],
    },
    equityLoan: {
      month: 1,
      annualAdjustments: [0, 0, 0],
    },
  },
};
