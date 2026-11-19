export type CalculatorId =
  | 'breakeven'
  | 'buy-vs-lease'
  | 'cost-benefit'
  | 'depreciation'
  | 'funding'
  | 'margin-markup'
  | 'revenue-factor'
  | 'roa-dynamics'
  | 'ros-at-roa'
  | 'term-loan'
  | 'working-capital'
  | 'bill-of-materials';

export type CalculatorRowFormat = 'percent';

export interface CalculatorRowDef {
  id: string;
  label: string;
  kind: 'input' | 'calc';
  defaultValue?: string;
  emphasize?: boolean;
  format?: CalculatorRowFormat;
}

export interface CalculatorSectionDef {
  title: string;
  rows: CalculatorRowDef[];
}

export interface CalculatorDefinition {
  id: CalculatorId;
  num: string;
  title: string;
  shortLabel: string;
  description: string;
  sections: CalculatorSectionDef[];
}

export const CALCULATOR_DEFINITIONS: CalculatorDefinition[] = [
  {
    id: 'breakeven',
    num: '01',
    title: 'breakeven point',
    shortLabel: 'breakeven point',
    description: 'Calculate the breakeven point in a business',
    sections: [
      {
        title: 'fixed expenses',
        rows: [
          { id: 'costOfSales', label: 'cost of sales', kind: 'input', defaultValue: '100000' },
          { id: 'overheads', label: 'overheads', kind: 'input', defaultValue: '50000' },
          { id: 'totalFixed', label: 'total fixed expenses', kind: 'calc', emphasize: true },
        ],
      },
      {
        title: 'variable expenses',
        rows: [
          { id: 'unitSellingPrice', label: 'unit selling price', kind: 'input', defaultValue: '20' },
          { id: 'unitMaterial', label: 'unit material cost ("-")', kind: 'input', defaultValue: '-7.5' },
          { id: 'unitProduction', label: 'unit production cost ("-")', kind: 'input', defaultValue: '-2.5' },
          { id: 'unitOverheadVar', label: 'unit overhead variable cost ("-")', kind: 'input', defaultValue: '-1' },
          { id: 'unitOverheadPct', label: 'unit overhead %', kind: 'calc', format: 'percent' },
          { id: 'unitCost', label: 'unit cost', kind: 'calc' },
          { id: 'unitContribution', label: 'unit contribution', kind: 'calc', emphasize: true },
          { id: 'unitGPMargin', label: 'unit gp margin', kind: 'calc', format: 'percent' },
        ],
      },
      {
        title: 'breakeven',
        rows: [
          { id: 'breakevenUnits', label: 'breakeven units', kind: 'calc', emphasize: true },
        ],
      },
    ],
  },
  {
    id: 'buy-vs-lease',
    num: '02',
    title: 'buy vs lease',
    shortLabel: 'buy vs lease',
    description: 'Decide to buy or lease an asset',
    sections: [
      {
        title: 'asset - finance details',
        rows: [
          { id: 'purchasePrice', label: 'purchase price', kind: 'input', defaultValue: '1000000' },
          { id: 'accessories', label: 'accessories', kind: 'input', defaultValue: '100000' },
          { id: 'subTotal1', label: 'sub-total', kind: 'calc' },
          { id: 'vatRate', label: 'vat rate %', kind: 'input', defaultValue: '15' },
          { id: 'vat', label: 'vat', kind: 'calc' },
          { id: 'stamps', label: 'stamps & reg', kind: 'input', defaultValue: '1000' },
          { id: 'subTotal2', label: 'sub-total', kind: 'calc', emphasize: true },
          { id: 'deposit', label: 'deposit', kind: 'input', defaultValue: '200000' },
          { id: 'amountFinanced', label: 'amount financed', kind: 'calc' },
          { id: 'residualValue', label: 'residual value', kind: 'input', defaultValue: '100000' },
          { id: 'leaseBase', label: 'lease base', kind: 'calc' },
        ],
      },
      {
        title: 'buy calculation',
        rows: [
          { id: 'lifeSpan', label: 'life span - years', kind: 'input', defaultValue: '5' },
          { id: 'monthlyDepreciation', label: 'monthly depreciation', kind: 'calc' },
        ],
      },
      {
        title: 'buy cashflow',
        rows: [
          { id: 'initialOutflow', label: 'initial outflow', kind: 'calc' },
          { id: 'monthlyCashOutlay', label: 'monthly cash outlay', kind: 'calc' },
          { id: 'lifetimeInterest', label: 'lifetime interest', kind: 'calc' },
          { id: 'lifetimeCashflow', label: 'lifetime cashflow', kind: 'calc', emphasize: true },
        ],
      },
      {
        title: 'lease calculation',
        rows: [
          { id: 'interestRate', label: 'interest rate - %', kind: 'input', defaultValue: '12', format: 'percent' },
          { id: 'leaseTerm', label: 'lease term - years', kind: 'input', defaultValue: '5' },
          { id: 'annualPayments', label: 'annual payments', kind: 'input', defaultValue: '12' },
          { id: 'numPayments', label: 'number of payments', kind: 'calc' },
          { id: 'monthlyLease', label: 'monthly lease', kind: 'calc' },
          { id: 'leaseVat', label: 'vat', kind: 'calc' },
          { id: 'monthlyCashflow', label: 'monthly cashflow', kind: 'calc', emphasize: true },
        ],
      },
      {
        title: 'lease cashflow',
        rows: [
          { id: 'lifetimeLeaseCosts', label: 'lifetime lease costs', kind: 'calc', emphasize: true },
          { id: 'leaseMonthlyOutlay', label: 'monthly cash outlay', kind: 'calc' },
        ],
      },
    ],
  },
  {
    id: 'cost-benefit',
    num: '03',
    title: 'cost benefit analysis',
    shortLabel: 'cost benefit analysis',
    description: 'Test the viability of a project',
    sections: [
      {
        title: 'investment assumptions',
        rows: [
          { id: 'investment', label: 'investment', kind: 'input', defaultValue: '1000000' },
          { id: 'recovery', label: 'less: recovery', kind: 'input', defaultValue: '100000' },
          { id: 'netInvestment', label: 'net investment', kind: 'calc', emphasize: true },
          { id: 'scrapValue', label: 'scrap value', kind: 'input', defaultValue: '50000' },
          { id: 'annualSavings', label: 'annual savings', kind: 'input', defaultValue: '350000' },
          { id: 'nettInvestment2', label: 'nett investment', kind: 'calc' },
          { id: 'horizon', label: 'horizon (max 10 years)', kind: 'input', defaultValue: '10' },
          { id: 'discountRate', label: 'discount rate - %', kind: 'input', defaultValue: '10', format: 'percent' },
        ],
      },
      {
        title: 'annual cash flow',
        rows: [
          { id: 'year1', label: 'year 1', kind: 'calc' },
          { id: 'year2', label: 'year 2', kind: 'calc' },
          { id: 'year3', label: 'year 3', kind: 'calc' },
          { id: 'year4', label: 'year 4', kind: 'calc' },
          { id: 'year5', label: 'year 5', kind: 'calc' },
          { id: 'year6', label: 'year 6', kind: 'calc' },
          { id: 'year7', label: 'year 7', kind: 'calc' },
          { id: 'year8', label: 'year 8', kind: 'calc' },
          { id: 'year9', label: 'year 9', kind: 'calc' },
          { id: 'year10', label: 'year 10', kind: 'calc' },
          { id: 'year11', label: 'year 11', kind: 'calc' },
        ],
      },
      {
        title: 'DCF calculations',
        rows: [
          { id: 'actualCashflow', label: 'actual cash flow', kind: 'calc' },
          { id: 'discountedCashflow', label: 'discounted cash flow (npv)', kind: 'calc', emphasize: true },
        ],
      },
      {
        title: 'investment measurement',
        rows: [
          { id: 'pb', label: 'PB = net investment / annual savings', kind: 'calc' },
          { id: 'sri', label: 'SRI = annual savings / net investment X 100', kind: 'calc' },
          { id: 'pv', label: 'PV = savings - PV investment', kind: 'calc', emphasize: true },
          { id: 'pvRatio', label: 'PV = savings / PV investment', kind: 'calc' },
          { id: 'pvTaxRatio', label: 'PV = investment / after tax cash flow', kind: 'calc' },
        ],
      },
    ],
  },
  {
    id: 'depreciation',
    num: '04',
    title: 'depreciation',
    shortLabel: 'depreciation',
    description: 'Calculate the depreciation of an asset',
    sections: [
      {
        title: 'asset cost assumptions',
        rows: [
          { id: 'assetCost', label: 'asset cost', kind: 'input', defaultValue: '1000000' },
          { id: 'depRate', label: 'depreciation rate', kind: 'input', defaultValue: '20', format: 'percent' },
          { id: 'depMonths', label: 'depreciation - months', kind: 'input', defaultValue: '60' },
        ],
      },
      {
        title: 'results',
        rows: [
          { id: 'evalPeriod', label: 'evaluation period (Max depreciation mts)', kind: 'input', defaultValue: '60' },
          { id: 'monthlyDep', label: 'monthly depreciation', kind: 'calc' },
          { id: 'periodDep', label: 'period depreciation', kind: 'calc' },
          { id: 'annualDep', label: 'annual depreciation', kind: 'calc' },
          { id: 'bsValue', label: 'balance sheet value', kind: 'calc', emphasize: true },
        ],
      },
    ],
  },
  {
    id: 'funding',
    num: '05',
    title: 'funding calculator',
    shortLabel: 'funding calculator',
    description: 'Optimize the funding of net operating assets',
    sections: [
      {
        title: 'balance sheet assumptions',
        rows: [
          { id: 'totalAssets', label: 'total assets', kind: 'input', defaultValue: '1000000' },
          { id: 'nibd', label: 'non-interest bearing debt ("-")', kind: 'input', defaultValue: '-300000' },
          { id: 'noa', label: 'NOA - net operating assets', kind: 'calc', emphasize: true },
          { id: 'equity', label: 'equity ("-")', kind: 'input', defaultValue: '-200000' },
          { id: 'ibd', label: 'interest bearing debt', kind: 'calc' },
          { id: 'shareholderCapital', label: 'shareholder capital', kind: 'calc' },
          { id: 'deRatio', label: 'DE - debt/equity ratio', kind: 'calc' },
        ],
      },
      {
        title: 'total assets funding',
        rows: [
          { id: 'nibdPct', label: 'non-interest bearing debt', kind: 'calc' },
          { id: 'equityPct', label: 'equity', kind: 'calc' },
          { id: 'ibdPct', label: 'interest bearing debt', kind: 'calc' },
          { id: 'totalPct', label: 'total', kind: 'calc' },
        ],
      },
      {
        title: 'target funding dynamics',
        rows: [
          { id: 'targetNibdPct', label: 'non-interest bearing debt - %', kind: 'input', defaultValue: '40', format: 'percent' },
          { id: 'targetDeRatio', label: 'DE - debt/equity ratio', kind: 'input', defaultValue: '1' },
        ],
      },
      {
        title: 'revised balance sheet',
        rows: [
          { id: 'revTotalAssets', label: 'total assets', kind: 'calc' },
          { id: 'revNibd', label: 'non-interest bearing debt', kind: 'calc' },
          { id: 'revNoa', label: 'NOA - net operating assets', kind: 'calc', emphasize: true },
          { id: 'revEquity', label: 'equity', kind: 'calc' },
          { id: 'revIbd', label: 'interest bearing debt', kind: 'calc' },
          { id: 'revShareholderCapital', label: 'shareholder capital', kind: 'calc' },
        ],
      },
      {
        title: 'adjust total assets funding',
        rows: [
          { id: 'revNibdPct', label: 'non-interest bearing debt', kind: 'calc' },
          { id: 'revEquityPct', label: 'equity', kind: 'calc' },
          { id: 'revIbdPct', label: 'interest bearing debt', kind: 'calc' },
          { id: 'revTotalPct', label: 'total', kind: 'calc' },
        ],
      },
    ],
  },
  {
    id: 'margin-markup',
    num: '06',
    title: 'margin vs markup',
    shortLabel: 'margin vs markup',
    description: 'Set an item’s selling price by applying either margin or a markup factor.',
    sections: [
      {
        title: 'calculation assumptions',
        rows: [
          { id: 'itemCost', label: 'item cost', kind: 'input', defaultValue: '10' },
          { id: 'factor', label: '% factor', kind: 'input', defaultValue: '30', format: 'percent' },
          { id: 'vatRate', label: 'vat rate - %', kind: 'input', defaultValue: '15' },
        ],
      },
      {
        title: 'margin calculations',
        rows: [
          { id: 'marginExc', label: 'selling price exc. vat', kind: 'calc', emphasize: true },
          { id: 'marginInc', label: 'selling price inc. vat', kind: 'calc' },
          { id: 'marginCost', label: 'cost', kind: 'calc' },
          { id: 'marginGP', label: 'gross profit', kind: 'calc' },
          { id: 'marginGPPct', label: 'gp %', kind: 'calc', format: 'percent' },
          { id: 'marginRF', label: 'revenue factor', kind: 'calc' },
        ],
      },
      {
        title: 'markup calculations',
        rows: [
          { id: 'markupExc', label: 'selling price exc. vat', kind: 'calc', emphasize: true },
          { id: 'markupInc', label: 'selling price inc. vat', kind: 'calc' },
          { id: 'markupCost', label: 'cost', kind: 'calc' },
          { id: 'markupGP', label: 'gross profit', kind: 'calc' },
          { id: 'markupGPPct', label: 'gp %', kind: 'calc', format: 'percent' },
          { id: 'markupRF', label: 'revenue factor', kind: 'calc' },
        ],
      },
    ],
  },
  {
    id: 'revenue-factor',
    num: '07',
    title: 'revenue factor',
    shortLabel: 'revenue factor',
    description: 'Calculate the addition revenue required when adding an expense to achieve a target gross profit margin.',
    sections: [
      {
        title: 'calculation assumptions',
        rows: [
          { id: 'revenue', label: 'revenue', kind: 'input', defaultValue: '3500000' },
          { id: 'cos', label: 'cost of sales (show as a negative value)', kind: 'input', defaultValue: '-1600000' },
          { id: 'gp', label: 'gross profit', kind: 'calc', emphasize: true },
          { id: 'varExp', label: 'variable expenses (show as a negative value)', kind: 'input', defaultValue: '-40000' },
          { id: 'netMargin', label: 'net margin', kind: 'calc' },
          { id: 'overhead', label: 'overhead expenses (show as a negative value)', kind: 'input', defaultValue: '-800000' },
          { id: 'nop', label: 'net operating profit', kind: 'calc', emphasize: true },
        ],
      },
      {
        title: 'margins',
        rows: [
          { id: 'marginGross', label: 'gross', kind: 'calc', format: 'percent' },
          { id: 'marginAdj', label: 'adjustments', kind: 'calc', format: 'percent' },
          { id: 'netMarginPct', label: 'net margin', kind: 'calc', format: 'percent' },
          { id: 'overheadPct', label: 'overhead', kind: 'calc', format: 'percent' },
          { id: 'nopPct', label: 'net operating profit', kind: 'calc', format: 'percent' },
        ],
      },
      {
        title: 'revenue factor calculation',
        rows: [
          { id: 'rfPct', label: 'revenue factor %', kind: 'calc' },
          { id: 'nmPct', label: 'net margin %', kind: 'calc' },
          { id: 'rf', label: 'revenue factor', kind: 'calc', emphasize: true },
        ],
      },
    ],
  },
  {
    id: 'roa-dynamics',
    num: '08',
    title: 'roa dynamics',
    shortLabel: 'roa dynamics',
    description: 'Calculate changes required to operating profits and net operating assets to achieve a targeted return of net operating assets.',
    sections: [
      {
        title: 'trading account',
        rows: [
          { id: 'months', label: 'number of trading months measured', kind: 'input', defaultValue: '12' },
          { id: 'revenue', label: 'revenue', kind: 'input', defaultValue: '8500000' },
          { id: 'cos', label: 'cost of sales (show as a negative value)', kind: 'input', defaultValue: '-6500000' },
          { id: 'gp', label: 'gross profit', kind: 'calc' },
          { id: 'gpAdj', label: 'gross profit adjustments (+ or -)', kind: 'input', defaultValue: '200000' },
          { id: 'otherInc', label: 'other income', kind: 'input', defaultValue: '120000' },
          { id: 'totalInc', label: 'total income', kind: 'calc' },
          { id: 'opExp', label: 'operating expenses (show as a negative value)', kind: 'input', defaultValue: '-1000000' },
          { id: 'nop', label: 'net operating profit', kind: 'calc', emphasize: true },
        ],
      },
      {
        title: 'trading account - ratios',
        rows: [
          { id: 'gpPct', label: 'gross profit', kind: 'calc', format: 'percent' },
          { id: 'gpAdjPct', label: 'gross profit adjustments', kind: 'calc', format: 'percent' },
          { id: 'otherIncPct', label: 'other income', kind: 'calc', format: 'percent' },
          { id: 'totalIncPct', label: 'total income', kind: 'calc', format: 'percent' },
          { id: 'opExpPct', label: 'operating expenses', kind: 'calc', format: 'percent' },
          { id: 'nopPct', label: 'net operating profit', kind: 'calc', format: 'percent' },
        ],
      },
      {
        title: 'balance sheet',
        rows: [
          { id: 'fixedAssets', label: 'fixed assets', kind: 'input', defaultValue: '1680000' },
          { id: 'inventory', label: 'inventory', kind: 'input', defaultValue: '900000' },
          { id: 'receivables', label: 'receivables', kind: 'input', defaultValue: '1530200' },
          { id: 'totalAssets', label: 'total assets', kind: 'calc' },
          { id: 'payables', label: 'payables ("-")', kind: 'input', defaultValue: '-902777.78' },
          { id: 'noa', label: 'net operating assets', kind: 'calc', emphasize: true },
        ],
      },
      {
        title: 'efficiency ratios',
        rows: [
          { id: 'ros', label: 'ROS - return on sales', kind: 'calc', format: 'percent' },
          { id: 'at', label: 'AT - asset turn', kind: 'calc' },
          { id: 'roa', label: 'ROA - return on net operating assets', kind: 'calc', emphasize: true, format: 'percent' },
        ],
      },
      {
        title: 'target efficiency ratios',
        rows: [
          { id: 'targetRos', label: 'ROS - return on sales', kind: 'input', defaultValue: '15.53', format: 'percent' },
          { id: 'targetRoa', label: 'ROA - return on net operating assets', kind: 'input', defaultValue: '41.12', format: 'percent' },
          { id: 'targetAt', label: 'AT - asset turn', kind: 'calc' },
        ],
      },
      {
        title: 'changes required to achieve target ROS',
        rows: [
          { id: 'actualNop', label: 'net operating profit', kind: 'calc' },
          { id: 'requiredNop', label: 'net operating profit - required', kind: 'calc' },
          { id: 'nopAdj', label: 'adjustment required', kind: 'calc', emphasize: true },
        ],
      },
      {
        title: 'changes required to achieve target ROA',
        rows: [
          { id: 'actualNoa', label: 'net operating assets - actual', kind: 'calc' },
          { id: 'requiredNoa', label: 'net operating assets - required', kind: 'calc' },
          { id: 'noaAdj', label: 'adjustments required', kind: 'calc', emphasize: true },
        ],
      },
      {
        title: 'trading account - % adjustments',
        rows: [
          { id: 'adjRevPct', label: 'revenue', kind: 'input', defaultValue: '1', format: 'percent' },
          { id: 'adjGpPct', label: 'gross profit margin', kind: 'input', defaultValue: '1', format: 'percent' },
          { id: 'adjGpAdjPct', label: 'gross profit adjustments', kind: 'input', defaultValue: '1', format: 'percent' },
          { id: 'adjOtherIncPct', label: 'other income', kind: 'input', defaultValue: '1', format: 'percent' },
          { id: 'adjOpExpPct', label: 'operating expenses', kind: 'input', defaultValue: '1', format: 'percent' },
        ],
      },
      {
        title: 'adjusted trading account',
        rows: [
          { id: 'adjRev', label: 'revenue', kind: 'calc' },
          { id: 'adjCos', label: 'cost of sales', kind: 'calc' },
          { id: 'adjGp', label: 'gross profit', kind: 'calc' },
          { id: 'adjGpAdj', label: 'gross profit adjustments', kind: 'calc' },
          { id: 'adjOtherInc', label: 'other income', kind: 'calc' },
          { id: 'adjTotalInc', label: 'total income', kind: 'calc' },
          { id: 'adjOpExp', label: 'operating expenses', kind: 'calc' },
          { id: 'adjNop', label: 'net operating profit', kind: 'calc', emphasize: true },
          { id: 'nopVar', label: 'variance to actual', kind: 'calc' },
        ],
      },
      {
        title: 'adjusted trading account - ratios',
        rows: [
          { id: 'adjRevRatio', label: 'revenue', kind: 'calc', format: 'percent' },
          { id: 'adjCosRatio', label: 'cost of sales', kind: 'calc', format: 'percent' },
          { id: 'adjGpRatio', label: 'gross profit', kind: 'calc', format: 'percent' },
          { id: 'adjGpAdjRatio', label: 'gross profit adjustments', kind: 'calc', format: 'percent' },
          { id: 'adjOtherIncRatio', label: 'other income', kind: 'calc', format: 'percent' },
          { id: 'adjTotalIncRatio', label: 'total income', kind: 'calc', format: 'percent' },
          { id: 'adjOpExpRatio', label: 'operating expenses', kind: 'calc', format: 'percent' },
          { id: 'adjNopRatio', label: 'net operating profit', kind: 'calc', format: 'percent' },
        ],
      },
      {
        title: 'working capital days - calculated',
        rows: [
          { id: 'daysInv', label: 'days inventory', kind: 'calc' },
          { id: 'daysRec', label: 'days receivables', kind: 'calc' },
          { id: 'daysPay', label: 'days payables', kind: 'calc' },
        ],
      },
      {
        title: 'working capital days - targets',
        rows: [
          { id: 'targetDaysInv', label: 'days inventory', kind: 'input', defaultValue: '30' },
          { id: 'targetDaysRec', label: 'days receivables', kind: 'input', defaultValue: '30' },
          { id: 'targetDaysPay', label: 'days payables', kind: 'input', defaultValue: '30' },
        ],
      },
      {
        title: 'adjusted balance sheet',
        rows: [
          { id: 'adjFixedAssets', label: 'fixed assets', kind: 'calc' },
          { id: 'adjInventory', label: 'inventory', kind: 'calc' },
          { id: 'adjReceivables', label: 'receivables', kind: 'calc' },
          { id: 'adjTotalAssets', label: 'total assets', kind: 'calc' },
          { id: 'adjPayables', label: 'payables', kind: 'calc' },
          { id: 'adjNoa', label: 'net operating assets', kind: 'calc', emphasize: true },
          { id: 'noaVar', label: 'variance to actual', kind: 'calc' },
        ],
      },
      {
        title: 'adjusted efficiency ratios',
        rows: [
          { id: 'adjRos', label: 'ROS - return on sales', kind: 'calc', format: 'percent' },
          { id: 'adjAt', label: 'AT - asset turn', kind: 'calc' },
          { id: 'adjRoa', label: 'ROA - return on net operating assets', kind: 'calc', emphasize: true, format: 'percent' },
        ],
      },
    ],
  },
  {
    id: 'ros-at-roa',
    num: '09',
    title: 'ros x at = roa',
    shortLabel: 'ros x at = roa',
    description: 'Optimize the net operating assets in a business by focusing on the trading efficiency ratios.',
    sections: [
      {
        title: 'income statement assumptions - annual',
        rows: [
          { id: 'revenue', label: 'revenue', kind: 'input', defaultValue: '18000000' },
          { id: 'cos', label: 'cost of sales (show as a negative value)', kind: 'input', defaultValue: '-12000000' },
          { id: 'gp', label: 'gross profit', kind: 'calc' },
          { id: 'invAdj', label: 'inventory adjustments', kind: 'input', defaultValue: '10000' },
          { id: 'otherInc', label: 'other income', kind: 'input', defaultValue: '100000' },
          { id: 'totalInc', label: 'total income', kind: 'calc' },
          { id: 'expenses', label: 'expenses (show as a negative value)', kind: 'input', defaultValue: '-3000000' },
          { id: 'nop', label: 'NOP - net operating profit', kind: 'calc', emphasize: true },
        ],
      },
      {
        title: 'balance sheet - annual',
        rows: [
          { id: 'fixedAssets', label: 'fixed assets', kind: 'input', defaultValue: '10000000' },
          { id: 'currAssets', label: 'current assets', kind: 'calc' },
          { id: 'inventory', label: 'inventory', kind: 'input', defaultValue: '3000000' },
          { id: 'receivables', label: 'receivables', kind: 'input', defaultValue: '3000000' },
          { id: 'otherAssets', label: 'other assets', kind: 'input', defaultValue: '100000' },
          { id: 'totalAssets', label: 'total assets', kind: 'calc' },
          { id: 'currLiab', label: 'current liabilities', kind: 'calc' },
          { id: 'payables', label: 'payables', kind: 'input', defaultValue: '-2000000' },
          { id: 'vat', label: 'vat', kind: 'input', defaultValue: '-10000' },
          { id: 'taxation', label: 'taxation', kind: 'input', defaultValue: '-100000' },
          { id: 'noa', label: 'NOA - net operating assets', kind: 'calc', emphasize: true },
        ],
      },
      {
        title: 'formulae',
        rows: [
          { id: 'ros', label: 'ROS = NOP / REVENUE', kind: 'calc', format: 'percent' },
          { id: 'at', label: 'AT = REVENUE / NOA', kind: 'calc' },
          { id: 'roa', label: 'ROA = NOP / NOA', kind: 'calc', emphasize: true, format: 'percent' },
          { id: 'roaCheck', label: 'ROS X AT = ROA (check formula)', kind: 'calc', format: 'percent' },
        ],
      },
    ],
  },
  {
    id: 'term-loan',
    num: '10',
    title: 'term loan',
    shortLabel: 'term loan',
    description: 'Calculate the repayments on a fixed term loan.',
    sections: [
      {
        title: 'loan assumptions',
        rows: [
          { id: 'advance', label: 'term loan - advance', kind: 'input', defaultValue: '100000' },
          { id: 'interestRate', label: 'interest rate - %', kind: 'input', defaultValue: '10', format: 'percent' },
          { id: 'years', label: 'term loan - years', kind: 'input', defaultValue: '5' },
          { id: 'annualPayments', label: 'term loan - no. of annual payments', kind: 'input', defaultValue: '12' },
          { id: 'nper', label: 'term loan - number of payments', kind: 'calc' },
        ],
      },
      {
        title: 'loan information',
        rows: [
          { id: 'monthlyRepayment', label: 'monthly repayments', kind: 'calc', emphasize: true },
          { id: 'totalInterest', label: 'total interest paid', kind: 'calc' },
          { id: 'totalRepaid', label: 'total value repaid', kind: 'calc' },
        ],
      },
    ],
  },
  {
    id: 'working-capital',
    num: '11',
    title: 'working capital dynamics',
    shortLabel: 'working capital dynamics',
    description: 'Optimize working capital by setting targets for each of their key elements.',
    sections: [
      {
        title: 'trading',
        rows: [
          { id: 'months', label: 'number of months evaluated', kind: 'input', defaultValue: '12' },
          { id: 'revenue', label: 'revenue', kind: 'input', defaultValue: '8447290' },
          { id: 'cos', label: 'cost of sales', kind: 'calc' },
          { id: 'varMaterials', label: 'variable - materials', kind: 'input', defaultValue: '5068374' },
          { id: 'varOther', label: 'variable - other', kind: 'input', defaultValue: '30000' },
          { id: 'fixedCos', label: 'fixed', kind: 'input', defaultValue: '10000' },
          { id: 'gp', label: 'gross profit', kind: 'calc', emphasize: true },
        ],
      },
      {
        title: 'working capital values',
        rows: [
          { id: 'inventory', label: 'inventory', kind: 'input', defaultValue: '1465300' },
          { id: 'receivables', label: 'receivables', kind: 'input', defaultValue: '1530200' },
          { id: 'payables', label: 'payables (show as a negative value)', kind: 'input', defaultValue: '-375000' },
          { id: 'totalWC', label: 'total', kind: 'calc', emphasize: true },
          { id: 'vatRate', label: 'vat rate - %', kind: 'input', defaultValue: '15', format: 'percent' },
        ],
      },
      {
        title: 'calculated working capital days',
        rows: [
          { id: 'daysInv', label: 'days inventory', kind: 'calc' },
          { id: 'daysRec', label: 'days receivables', kind: 'calc' },
          { id: 'daysPay', label: 'days payable', kind: 'calc' },
        ],
      },
      {
        title: 'forecast working capital days',
        rows: [
          { id: 'fDaysInv', label: 'days inventory', kind: 'input', defaultValue: '50' },
          { id: 'fDaysRec', label: 'days receivables', kind: 'input', defaultValue: '50' },
          { id: 'fDaysPay', label: 'days payables', kind: 'input', defaultValue: '30' },
        ],
      },
      {
        title: 'adjusted working capital values',
        rows: [
          { id: 'adjInv', label: 'inventory', kind: 'calc' },
          { id: 'adjRec', label: 'receivables', kind: 'calc' },
          { id: 'adjPay', label: 'payables', kind: 'calc' },
          { id: 'adjTotal', label: 'total', kind: 'calc' },
          { id: 'changeWC', label: 'change in working capital', kind: 'calc', emphasize: true },
        ],
      },
    ],
  },
  {
    id: 'bill-of-materials',
    num: '12',
    title: 'bill of materials (bom)',
    shortLabel: 'bill of materials',
    description: 'Maintain product unit costs across ingredients, multi-level packaging, variable costs, and unit cost dynamics.',
    sections: [],
  },
];

export function getCalculatorMeta(id: string): CalculatorDefinition {
  return CALCULATOR_DEFINITIONS.find((c) => c.id === id) || CALCULATOR_DEFINITIONS[0];
}

export function getDefaultInputsForCalculator(id: CalculatorId): Record<string, string> {
  const def = getCalculatorMeta(id);
  const map: Record<string, string> = {};
  def.sections.forEach((sec) => {
    sec.rows.forEach((row) => {
      if (row.kind === 'input') {
        map[row.id] = row.defaultValue ?? '0';
      }
    });
  });
  return map;
}

export function getZeroInputsForCalculator(id: CalculatorId): Record<string, string> {
  const def = getCalculatorMeta(id);
  const map: Record<string, string> = {};
  def.sections.forEach((sec) => {
    sec.rows.forEach((row) => {
      if (row.kind === 'input') {
        map[row.id] = '0';
      }
    });
  });
  return map;
}

export function getAllDefaultInputs(): Record<CalculatorId, Record<string, string>> {
  const result = {} as Record<CalculatorId, Record<string, string>>;
  CALCULATOR_DEFINITIONS.forEach((def) => {
    result[def.id] = getDefaultInputsForCalculator(def.id);
  });
  return result;
}

export function formatCalcValue(
  val: number,
  format?: CalculatorRowFormat
): string {
  const safeVal = Number.isFinite(val) ? (Math.abs(val) < 1e-12 ? 0 : val) : 0;
  if (format === 'percent') {
    const pctVal = safeVal * 100;
    const normalizedPct = Math.abs(pctVal) < 1e-12 ? 0 : pctVal;
    return `${normalizedPct.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  }
  return safeVal.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatInputDisplay(
  rawValue: string,
  format?: CalculatorRowFormat
): string {
  const cleaned = String(rawValue ?? '').replace(/[,%]/g, '').trim();
  if (format === 'percent') {
    const parsedPct = parseFloat(cleaned);
    const safePct = Number.isFinite(parsedPct) ? (Math.abs(parsedPct) < 1e-12 ? 0 : parsedPct) : 0;
    return `${safePct.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  }
  if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === '-.') {
    return cleaned || '0';
  }
  if (/^-?\d*(\.\d*)?$/.test(cleaned)) {
    const isNeg = cleaned.startsWith('-');
    const unsigned = isNeg ? cleaned.slice(1) : cleaned;
    const dotIndex = unsigned.indexOf('.');
    const intPart = dotIndex >= 0 ? unsigned.slice(0, dotIndex) : unsigned;
    const decPart = dotIndex >= 0 ? unsigned.slice(dotIndex) : '';
    const formattedInt = (intPart || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${isNeg ? '-' : ''}${formattedInt}${decPart}`;
  }
  const parsed = parseFloat(cleaned);
  if (Number.isFinite(parsed)) {
    return parsed.toLocaleString('en-US', { maximumFractionDigits: 6 });
  }
  return cleaned;
}

function num(inputs: Record<string, string>, key: string): number {
  const cleaned = String(inputs[key] ?? '').replace(/[,%]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function computeCalculator(
  id: CalculatorId,
  inputs: Record<string, string>
): Record<string, number> {
  switch (id) {
    case 'breakeven': {
      const costOfSales = num(inputs, 'costOfSales');
      const overheads = num(inputs, 'overheads');
      const totalFixed = costOfSales + overheads;

      const unitSellingPrice = num(inputs, 'unitSellingPrice');
      const unitMaterial = num(inputs, 'unitMaterial');
      const unitProduction = num(inputs, 'unitProduction');
      const unitOverheadVar = num(inputs, 'unitOverheadVar');

      const unitOverheadPct =
        unitSellingPrice !== 0 ? Math.abs(unitOverheadVar) / unitSellingPrice : 0;
      const unitCost = unitMaterial + unitProduction + unitOverheadVar;
      const unitContribution = unitSellingPrice + unitCost;
      const unitGPMargin =
        unitSellingPrice !== 0 ? unitContribution / unitSellingPrice : 0;
      const breakevenUnits =
        unitContribution !== 0 ? totalFixed / unitContribution : 0;

      return {
        totalFixed,
        unitOverheadPct,
        unitCost,
        unitContribution,
        unitGPMargin,
        breakevenUnits,
      };
    }

    case 'buy-vs-lease': {
      const purchasePrice = num(inputs, 'purchasePrice');
      const accessories = num(inputs, 'accessories');
      const subTotal1 = purchasePrice + accessories;

      const vatRate = num(inputs, 'vatRate') / 100;
      const vat = subTotal1 * vatRate;

      const stamps = num(inputs, 'stamps');
      const subTotal2 = subTotal1 + vat + stamps;

      const deposit = num(inputs, 'deposit');
      const amountFinanced = subTotal2 - deposit;
      const leaseBase = subTotal1 + stamps - deposit;

      const lifeSpan = num(inputs, 'lifeSpan');
      const monthlyDepreciation = lifeSpan > 0 ? subTotal2 / (lifeSpan * 12) : 0;

      const interestRate = num(inputs, 'interestRate') / 100;
      const leaseTerm = num(inputs, 'leaseTerm');
      const annualPayments = num(inputs, 'annualPayments');
      const nper = leaseTerm * annualPayments;
      const rate = annualPayments !== 0 ? interestRate / annualPayments : 0;

      const pmt =
        nper > 0
          ? rate === 0
            ? leaseBase / nper
            : (rate * leaseBase) / (1 - Math.pow(1 + rate, -nper))
          : 0;
      const leaseVat = pmt * vatRate;
      const monthlyCashflow = pmt + leaseVat;

      const buyPmt =
        nper > 0
          ? rate === 0
            ? amountFinanced / nper
            : (rate * amountFinanced) / (1 - Math.pow(1 + rate, -nper))
          : 0;
      const buyTotalInterest = buyPmt * nper - amountFinanced;

      return {
        subTotal1,
        vat,
        subTotal2,
        amountFinanced,
        leaseBase,
        monthlyDepreciation,
        initialOutflow: -subTotal2,
        monthlyCashOutlay: 0,
        lifetimeInterest: -buyTotalInterest,
        lifetimeCashflow: -(subTotal2 + buyTotalInterest),
        numPayments: nper,
        monthlyLease: pmt,
        leaseVat,
        monthlyCashflow,
        lifetimeLeaseCosts: -monthlyCashflow * nper,
        leaseMonthlyOutlay: -monthlyCashflow,
      };
    }

    case 'cost-benefit': {
      const investment = num(inputs, 'investment');
      const recovery = num(inputs, 'recovery');
      const netInvestment = investment - recovery;

      const scrapValue = num(inputs, 'scrapValue');
      const annualSavings = num(inputs, 'annualSavings');
      const horizonRaw = num(inputs, 'horizon');
      const horizon = Math.max(0, Math.min(horizonRaw, 10));
      const discountRate = num(inputs, 'discountRate') / 100;

      const years: Record<string, number> = {
        year1: -netInvestment,
      };

      const denom1 = Math.pow(1 + discountRate, 1);
      let npv = denom1 !== 0 ? -netInvestment / denom1 : 0;

      for (let i = 2; i <= 11; i++) {
        const val = i <= horizon + 1 ? annualSavings : 0;
        years[`year${i}`] = val;
        if (val > 0) {
          const d = Math.pow(1 + discountRate, i);
          if (d !== 0) {
            npv += val / d;
          }
        }
      }

      const actualCashflow = -netInvestment + annualSavings * horizon;
      const depreciation = horizon > 0 ? (netInvestment - scrapValue) / horizon : 0;
      const adjustedSavings = annualSavings - depreciation;
      const sri = netInvestment !== 0 ? adjustedSavings / netInvestment : 0;
      const pb = sri !== 0 ? 1 / (sri * 100) : 0;
      const pv = npv - netInvestment;
      const pvRatio = netInvestment !== 0 ? npv / netInvestment : 0;
      const pvTaxRatio = npv !== 0 ? netInvestment / npv : 0;

      return {
        netInvestment,
        nettInvestment2: netInvestment,
        ...years,
        actualCashflow,
        discountedCashflow: npv,
        pb,
        sri,
        pv,
        pvRatio,
        pvTaxRatio,
      };
    }

    case 'depreciation': {
      const assetCost = num(inputs, 'assetCost');
      const depRate = num(inputs, 'depRate') / 100;
      const depMonths = num(inputs, 'depMonths');
      const evalPeriod = num(inputs, 'evalPeriod');

      const monthlyDep = depMonths !== 0 ? assetCost / depMonths : 0;
      const periodDep = monthlyDep * evalPeriod;
      const annualDep = assetCost * depRate;
      const bsValue = assetCost - periodDep;

      return {
        monthlyDep,
        periodDep,
        annualDep,
        bsValue,
      };
    }

    case 'funding': {
      const totalAssets = num(inputs, 'totalAssets');
      const nibd = num(inputs, 'nibd');
      const noa = totalAssets + nibd;

      const equity = num(inputs, 'equity');
      const ibd = -(noa + equity);
      const shareholderCapital = equity + ibd;
      const deRatio = equity !== 0 ? Math.abs(ibd / equity) : 0;

      const nibdPct = totalAssets !== 0 ? Math.abs(nibd / totalAssets) : 0;
      const equityPct = totalAssets !== 0 ? Math.abs(equity / totalAssets) : 0;
      const ibdPct = totalAssets !== 0 ? Math.abs(ibd / totalAssets) : 0;

      const targetNibdPct = num(inputs, 'targetNibdPct') / 100;
      const targetDeRatio = num(inputs, 'targetDeRatio');

      const revTotalAssets = totalAssets;
      const revNibd = -(revTotalAssets * targetNibdPct);
      const revNoa = revTotalAssets + revNibd;
      const revEquity =
        1 + targetDeRatio !== 0 ? -(revNoa / (1 + targetDeRatio)) : 0;
      const revIbd = -(revNoa + revEquity);
      const revShareholderCapital = revEquity + revIbd;

      const revNibdPct =
        revTotalAssets !== 0 ? Math.abs(revNibd / revTotalAssets) : 0;
      const revEquityPct =
        revTotalAssets !== 0 ? Math.abs(revEquity / revTotalAssets) : 0;
      const revIbdPct =
        revTotalAssets !== 0 ? Math.abs(revIbd / revTotalAssets) : 0;

      return {
        noa,
        ibd,
        shareholderCapital,
        deRatio,
        nibdPct,
        equityPct,
        ibdPct,
        totalPct: 1,
        revTotalAssets,
        revNibd,
        revNoa,
        revEquity,
        revIbd,
        revShareholderCapital,
        revNibdPct,
        revEquityPct,
        revIbdPct,
        revTotalPct: 1,
      };
    }

    case 'margin-markup': {
      const itemCost = num(inputs, 'itemCost');
      const factor = num(inputs, 'factor') / 100;
      const vatRate = num(inputs, 'vatRate') / 100;

      const marginExc = factor < 1 ? itemCost / (1 - factor) : 0;
      const marginInc = marginExc * (1 + vatRate);
      const marginCost = itemCost;
      const marginGP = marginExc - itemCost;
      const marginGPPct = marginExc !== 0 ? marginGP / marginExc : 0;
      const marginRF = marginGPPct !== 0 ? 1 / marginGPPct : 0;

      const markupExc = itemCost * (1 + factor);
      const markupInc = markupExc * (1 + vatRate);
      const markupCost = itemCost;
      const markupGP = markupExc - itemCost;
      const markupGPPct = markupExc !== 0 ? markupGP / markupExc : 0;
      const markupRF = markupGPPct !== 0 ? 1 / markupGPPct : 0;

      return {
        marginExc,
        marginInc,
        marginCost,
        marginGP,
        marginGPPct,
        marginRF,
        markupExc,
        markupInc,
        markupCost,
        markupGP,
        markupGPPct,
        markupRF,
      };
    }

    case 'revenue-factor': {
      const revenue = num(inputs, 'revenue');
      const cos = num(inputs, 'cos');
      const gp = revenue + cos;

      const varExp = num(inputs, 'varExp');
      const netMargin = gp + varExp;

      const overhead = num(inputs, 'overhead');
      const nop = netMargin + overhead;

      const marginGross = revenue !== 0 ? gp / revenue : 0;
      const marginAdj = revenue !== 0 ? varExp / revenue : 0;
      const netMarginPct = revenue !== 0 ? netMargin / revenue : 0;
      const overheadPct = revenue !== 0 ? overhead / revenue : 0;
      const nopPct = revenue !== 0 ? nop / revenue : 0;

      const rf = netMarginPct !== 0 ? 1 / netMarginPct : 0;

      return {
        gp,
        netMargin,
        nop,
        marginGross,
        marginAdj,
        netMarginPct,
        overheadPct,
        nopPct,
        rfPct: 1,
        nmPct: netMarginPct,
        rf,
      };
    }

    case 'roa-dynamics': {
      const months = num(inputs, 'months');
      const revenue = num(inputs, 'revenue');
      const cos = num(inputs, 'cos');
      const gp = revenue + cos;

      const gpAdj = num(inputs, 'gpAdj');
      const otherInc = num(inputs, 'otherInc');
      const totalInc = gp + gpAdj + otherInc;

      const opExp = num(inputs, 'opExp');
      const nop = totalInc + opExp;

      const gpPct = revenue !== 0 ? gp / revenue : 0;
      const gpAdjPct = revenue !== 0 ? gpAdj / revenue : 0;
      const otherIncPct = revenue !== 0 ? otherInc / revenue : 0;
      const totalIncPct = revenue !== 0 ? totalInc / revenue : 0;
      const opExpPct = revenue !== 0 ? opExp / revenue : 0;
      const nopPct = revenue !== 0 ? nop / revenue : 0;

      const fixedAssets = num(inputs, 'fixedAssets');
      const inventory = num(inputs, 'inventory');
      const receivables = num(inputs, 'receivables');
      const totalAssets = fixedAssets + inventory + receivables;

      const payables = num(inputs, 'payables');
      const noa = totalAssets + payables;

      const ros = revenue !== 0 ? nop / revenue : 0;
      const at = noa !== 0 ? revenue / noa : 0;
      const roa = ros * at;

      const targetRos = num(inputs, 'targetRos') / 100;
      const targetRoa = num(inputs, 'targetRoa') / 100;
      const targetAt = targetRos !== 0 ? targetRoa / targetRos : 0;

      const adjRevPct = num(inputs, 'adjRevPct') / 100;
      const adjGpPct = num(inputs, 'adjGpPct') / 100;
      const adjGpAdjPct = num(inputs, 'adjGpAdjPct') / 100;
      const adjOtherIncPct = num(inputs, 'adjOtherIncPct') / 100;
      const adjOpExpPct = num(inputs, 'adjOpExpPct') / 100;

      const adjRev = revenue * (1 + adjRevPct);

      const requiredNop = adjRev * targetRos;
      const nopAdj = requiredNop - nop;

      const requiredNoa = targetAt !== 0 ? adjRev / targetAt : 0;
      const noaAdj = requiredNoa - noa;

      const currentGpMargin = revenue !== 0 ? gp / revenue : 0;
      const adjGpMargin = currentGpMargin + adjGpPct;
      const adjGp = adjRev * adjGpMargin;
      const adjCos = adjGp - adjRev;
      const adjGpAdj = gpAdj * (1 + adjGpAdjPct);
      const adjOtherInc = otherInc * (1 + adjOtherIncPct);
      const adjTotalInc = adjGp + adjGpAdj + adjOtherInc;
      const adjOpExp = opExp * (1 + adjOpExpPct);
      const adjNop = adjTotalInc + adjOpExp;
      const nopVar = adjNop - nop;

      const adjCosRatio = adjRev !== 0 ? adjCos / adjRev : 0;
      const adjGpRatio = adjRev !== 0 ? adjGp / adjRev : 0;
      const adjGpAdjRatio = adjRev !== 0 ? adjGpAdj / adjRev : 0;
      const adjOtherIncRatio = adjRev !== 0 ? adjOtherInc / adjRev : 0;
      const adjTotalIncRatio = adjRev !== 0 ? adjTotalInc / adjRev : 0;
      const adjOpExpRatio = adjRev !== 0 ? adjOpExp / adjRev : 0;
      const adjNopRatio = adjRev !== 0 ? adjNop / adjRev : 0;

      const monthlyCos = months !== 0 ? Math.abs(cos) / months : 0;
      const monthlyCosSigned = months !== 0 ? cos / months : 0;
      const monthlyRev = months !== 0 ? revenue / months : 0;

      const daysInv = monthlyCos !== 0 ? (inventory / monthlyCos) * 30 : 0;
      const daysRec = monthlyRev !== 0 ? (receivables / monthlyRev) * 30 : 0;
      const daysPay =
        monthlyCosSigned !== 0 ? (payables / monthlyCosSigned) * 30 : 0;

      const targetDaysInv = num(inputs, 'targetDaysInv');
      const targetDaysRec = num(inputs, 'targetDaysRec');
      const targetDaysPay = num(inputs, 'targetDaysPay');

      const adjMonthlyCos = months !== 0 ? Math.abs(adjCos) / months : 0;
      const adjMonthlyCosSigned = months !== 0 ? adjCos / months : 0;
      const adjMonthlyRev = months !== 0 ? adjRev / months : 0;

      const adjInventory = (targetDaysInv * adjMonthlyCos) / 30;
      const adjReceivables = (targetDaysRec * adjMonthlyRev) / 30;
      const adjTotalAssets = fixedAssets + adjInventory + adjReceivables;
      const adjPayables = (targetDaysPay * adjMonthlyCosSigned) / 30;
      const adjNoa = adjTotalAssets + adjPayables;
      const noaVar = adjNoa - noa;

      const adjRos = adjRev !== 0 ? adjNop / adjRev : 0;
      const adjAt = adjNoa !== 0 ? adjRev / adjNoa : 0;
      const adjRoa = adjRos * adjAt;

      return {
        gp,
        totalInc,
        nop,
        gpPct,
        gpAdjPct,
        otherIncPct,
        totalIncPct,
        opExpPct,
        nopPct,
        totalAssets,
        noa,
        ros,
        at,
        roa,
        targetAt,
        actualNop: nop,
        requiredNop,
        nopAdj,
        actualNoa: noa,
        requiredNoa,
        noaAdj,
        adjRev,
        adjCos,
        adjGp,
        adjGpAdj,
        adjOtherInc,
        adjTotalInc,
        adjOpExp,
        adjNop,
        nopVar,
        adjRevRatio: 1,
        adjCosRatio,
        adjGpRatio,
        adjGpAdjRatio,
        adjOtherIncRatio,
        adjTotalIncRatio,
        adjOpExpRatio,
        adjNopRatio,
        daysInv,
        daysRec,
        daysPay,
        adjFixedAssets: fixedAssets,
        adjInventory,
        adjReceivables,
        adjTotalAssets,
        adjPayables,
        adjNoa,
        noaVar,
        adjRos,
        adjAt,
        adjRoa,
      };
    }

    case 'ros-at-roa': {
      const revenue = num(inputs, 'revenue');
      const cos = num(inputs, 'cos');
      const gp = revenue + cos;

      const invAdj = num(inputs, 'invAdj');
      const otherInc = num(inputs, 'otherInc');
      const totalInc = gp + invAdj + otherInc;

      const expenses = num(inputs, 'expenses');
      const nop = totalInc + expenses;

      const inventory = num(inputs, 'inventory');
      const receivables = num(inputs, 'receivables');
      const otherAssets = num(inputs, 'otherAssets');
      const currAssets = inventory + receivables + otherAssets;

      const fixedAssets = num(inputs, 'fixedAssets');
      const totalAssets = fixedAssets + currAssets;

      const payables = num(inputs, 'payables');
      const vat = num(inputs, 'vat');
      const taxation = num(inputs, 'taxation');
      const currLiab = payables + vat + taxation;

      const noa = totalAssets + currLiab;

      const ros = revenue !== 0 ? nop / revenue : 0;
      const at = noa !== 0 ? revenue / noa : 0;
      const roa = noa !== 0 ? nop / noa : 0;
      const roaCheck = ros * at;

      return {
        gp,
        totalInc,
        nop,
        currAssets,
        totalAssets,
        currLiab,
        noa,
        ros,
        at,
        roa,
        roaCheck,
      };
    }

    case 'term-loan': {
      const advance = num(inputs, 'advance');
      const interestRate = num(inputs, 'interestRate') / 100;
      const years = num(inputs, 'years');
      const annualPayments = num(inputs, 'annualPayments');
      const nper = years * annualPayments;
      const rate = annualPayments !== 0 ? interestRate / annualPayments : 0;

      const pmt =
        nper > 0
          ? rate === 0
            ? advance / nper
            : (rate * advance) / (1 - Math.pow(1 + rate, -nper))
          : 0;
      const totalRepaid = pmt * nper;
      const totalInterest = totalRepaid - advance;

      return {
        nper,
        monthlyRepayment: pmt,
        totalRepaid,
        totalInterest,
      };
    }

    case 'working-capital': {
      const months = num(inputs, 'months');
      const revenue = num(inputs, 'revenue');
      const varMaterials = num(inputs, 'varMaterials');
      const varOther = num(inputs, 'varOther');
      const fixedCos = num(inputs, 'fixedCos');
      const cos = -(varMaterials + varOther + fixedCos);
      const gp = revenue + cos;

      const inventory = num(inputs, 'inventory');
      const receivables = num(inputs, 'receivables');
      const payables = num(inputs, 'payables');
      const totalWC = inventory + receivables + payables;
      const vatRate = num(inputs, 'vatRate') / 100;
      const vatFactor = 1 - vatRate;

      const annualCos = months !== 0 ? Math.abs(cos) * (12 / months) : 0;
      const annualRev = months !== 0 ? revenue * (12 / months) : 0;
      const annualMaterials =
        months !== 0 ? varMaterials * (12 / months) : 0;

      const daysInv = annualCos !== 0 ? inventory / (annualCos / 360) : 0;
      const daysRec =
        annualRev !== 0 && vatFactor !== 0
          ? receivables / (annualRev / 360) / vatFactor
          : 0;
      const daysPay =
        annualMaterials !== 0
          ? (Math.abs(payables) / (annualMaterials / 360)) * vatFactor
          : 0;

      const fDaysInv = num(inputs, 'fDaysInv');
      const fDaysRec = num(inputs, 'fDaysRec');
      const fDaysPay = num(inputs, 'fDaysPay');

      const adjInv = fDaysInv * (annualCos / 360);
      const adjRec = fDaysRec * (annualRev / 360) * vatFactor;
      const adjPay =
        vatFactor !== 0
          ? -((fDaysPay * (annualMaterials / 360)) / vatFactor)
          : 0;
      const adjTotal = adjInv + adjRec + adjPay;
      const changeWC = adjTotal - totalWC;

      return {
        cos,
        gp,
        totalWC,
        daysInv,
        daysRec,
        daysPay,
        adjInv,
        adjRec,
        adjPay,
        adjTotal,
        changeWC,
      };
    }

    default:
      return {};
  }
}
