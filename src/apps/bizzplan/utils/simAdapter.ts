import { BizzModelData } from '../../../types';
import { runMonthlySimulation } from '../../bizzmodel/steps/ReportsStep';

const YEARS = [1, 2, 3, 4, 5];

const FALLBACK_BASE_VALUES: Record<string, number[]> = {
  rev: [1200000, 1800000, 2600000, 3800000, 5200000],
  cos: [660000, 990000, 1430000, 2090000, 2860000],
  gp: [540000, 810000, 1170000, 1710000, 2340000],
  opex: [320000, 380000, 450000, 520000, 600000],
  nop: [220000, 430000, 720000, 1190000, 1740000],
  tax: [70000, 110000, 140000, 270000, 290000],
  np: [150000, 320000, 580000, 920000, 1450000],
  bank: [80000, 320000, 800000, 1650000, 3250000],
  assets: [1500000, 1800000, 2200000, 2800000, 3500000],
  liabilities: [600000, 500000, 400000, 300000, 200000],
  equity: [900000, 1300000, 1800000, 2500000, 3300000],
  'cash-ops': [280000, 520000, 840000, 1420000, 2100000],
  'cash-inv': [-150000, -100000, -120000, -150000, -200000],
  'cash-fin': [-50000, -180000, -240000, -420000, -300000],
  'cash-flow': [80000, 240000, 480000, 850000, 1600000],
  'gp-margin': [45.0, 45.0, 45.0, 45.0, 45.0],
  roa: [14.67, 23.89, 32.73, 42.5, 49.71],
  'debt-equity': [0.67, 0.38, 0.22, 0.12, 0.06],
};

export type FinancialMetricMode =
  | 'rev'
  | 'cos'
  | 'gp'
  | 'opex'
  | 'nop'
  | 'tax'
  | 'np'
  | 'assets'
  | 'liabilities'
  | 'equity'
  | 'bank'
  | 'cash-ops'
  | 'cash-inv'
  | 'cash-fin'
  | 'cash-flow'
  | 'gp-margin'
  | 'roa'
  | 'debt-equity';

export function getYearlyFinancialValues(
  modelData: BizzModelData | null,
  mode: string
): number[] {
  if (!modelData || !modelData._v2State) {
    return YEARS.map((y) => (FALLBACK_BASE_VALUES[mode] ? FALLBACK_BASE_VALUES[mode][y - 1] : 0));
  }

  const v2State = modelData._v2State;
  const simMonths = runMonthlySimulation(v2State, 60);

  return YEARS.map((yr) => {
    const startMo = (yr - 1) * 12;
    const yearMonths = simMonths.slice(startMo, startMo + 12);
    const lastMo = yearMonths[yearMonths.length - 1];
    const prevYearLastMonth = yr > 1 ? simMonths[startMo - 1] : null;

    if (!lastMo) return 0;

    const revenue = yearMonths.reduce((acc, m) => acc + (m.revenue || 0), 0);
    const cos_variable = yearMonths.reduce((acc, m) => acc + (m.cosVariable ?? m.cosMaterials ?? 0), 0);
    const cos_fixed = yearMonths.reduce(
      (acc, m) =>
        acc +
        (m.cosFixed ??
          (m.cosEmployment || 0) + (m.cosDepreciation || 0) + (m.cosLeases || 0) + (m.cosOverheads || 0)),
      0
    );
    const total_cos = yearMonths.reduce((acc, m) => acc + (m.totalCos ?? (cos_variable + cos_fixed) / Math.max(1, yearMonths.length)), 0);
    const computedCos = yearMonths.some((m) => m.totalCos !== undefined)
      ? yearMonths.reduce((acc, m) => acc + (m.totalCos || 0), 0)
      : cos_variable + cos_fixed;

    const gross_profit = revenue - computedCos;
    const gp_adjustments = yearMonths.reduce(
      (acc, m) => acc + (m.gpAdjustmentsCommission || 0) + (m.gpAdjustmentsInventory || 0) + (m.gpAdjustmentsVariance || 0),
      0
    );
    const other_inc = yearMonths.reduce((acc, m) => acc + (m.otherIncomeTotal || 0), 0);
    const total_income = gross_profit - gp_adjustments + other_inc;

    const ex_employment = yearMonths.reduce((acc, m) => acc + (m.employmentExpenses || m.opexEmployment || 0), 0);
    const ex_depreciation = yearMonths.reduce(
      (acc, m) => acc + (m.exDepreciation !== undefined ? m.exDepreciation : m.depreciation || m.opexAdminDepreciation || 0),
      0
    );
    const ex_lease = yearMonths.reduce((acc, m) => acc + (m.exLease || 0), 0);
    const ex_overheads = yearMonths.reduce(
      (acc, m) => acc + (m.exOverheads !== undefined ? m.exOverheads : Math.max(0, (m.operatingExpenses || 0) - (m.depreciation || 0))),
      0
    );
    const ex_variable = yearMonths.reduce((acc, m) => acc + (m.exVariable || 0), 0);
    const ex_total = ex_employment + ex_depreciation + ex_lease + ex_overheads + ex_variable;

    const net_operating_profit = total_income - ex_total;
    const interest_total = yearMonths.reduce(
      (acc, m) => acc + (m.netFinanceCharges ?? ((m.interestExpense || 0) - (m.interestOther || 0))),
      0
    );
    const net_profit_before_tax = net_operating_profit - interest_total;
    const taxation = yearMonths.reduce((acc, m) => acc + (m.taxationMonthly ?? m.taxationCit ?? 0), 0);
    const taxed_profits = net_profit_before_tax - taxation;

    // Net fixed assets matching ReportsStep calculation
    const fixed_assets_net = (v2State.fixedAssets || []).reduce((sum: number, a: any) => {
      if (a.financeOption === 'lease') return sum;
      const orig = a.purchaseValue ?? a.purchaseCost ?? (a.unitCost || 0) * (a.quantity || 1);
      const rate = a.depreciationRate || 20;
      const depPerMonth = (orig * (rate / 100)) / 12;
      const isPrior = a.purchaseTiming === 'prior';
      const monthsElapsed = isPrior
        ? (a.monthsInSystem || 0) + yr * 12
        : Math.max(0, yr * 12 - (a.purchaseMonth || 1) + 1);
      const cumDep = Math.min(orig, depPerMonth * monthsElapsed);
      return sum + Math.max(0, orig - cumDep);
    }, 0);

    const bank_balance = lastMo.bank_balance_closing ?? lastMo.closingCash ?? 0;
    const inventory = lastMo.inventory ?? 0;
    const accounts_receivable = lastMo.accounts_receivable ?? 0;
    const other_assets = lastMo.other_assets ?? 0;
    const vat_receivable = lastMo.vatReceivable ?? 0;
    const total_assets = fixed_assets_net + inventory + accounts_receivable + other_assets + vat_receivable + Math.max(0, bank_balance);

    const accounts_payable = lastMo.accounts_payable ?? 0;
    const vat_payable = lastMo.vatPayable ?? 0;
    const taxation_payable = (lastMo as any).taxLiability ?? 0;
    const term_loan_balance = lastMo.term_loan_balance ?? lastMo.debtBalance ?? 0;
    const total_liabilities = vat_payable + accounts_payable + taxation_payable + term_loan_balance + (bank_balance < 0 ? Math.abs(bank_balance) : 0);

    const capital = (v2State.funding?.founderEquity || 0) + (v2State.funding?.investorEquity || 0);
    const total_equity = capital + ((lastMo as any).cumulativeRetainedEarnings ?? (lastMo as any).retainedEarningsBalance ?? 0);

    // Cash flow breakdown
    const dividends = yearMonths.reduce((acc, m) => acc + (m.dividendsDeclared || 0), 0);
    const cash_from_operations = net_operating_profit - interest_total - taxation - dividends;
    const inv_change = inventory - (prevYearLastMonth?.inventory ?? 0);
    const ar_change = accounts_receivable - (prevYearLastMonth?.accounts_receivable ?? 0);
    const oa_change = other_assets - (prevYearLastMonth?.other_assets ?? 0);
    const vat_rec_change = vat_receivable - (prevYearLastMonth?.vatReceivable ?? 0);
    const ap_change = accounts_payable - (prevYearLastMonth?.accounts_payable ?? 0);
    const vat_pay_change = vat_payable - (prevYearLastMonth?.vatPayable ?? 0);
    const tax_paid_year = yearMonths.reduce((s, p: any) => s + (p.taxPayment || 0), 0);
    const change_in_working_capital =
      -inv_change - ar_change - oa_change - vat_rec_change + ap_change + vat_pay_change + (taxation - tax_paid_year);

    const cos_dep = yearMonths.reduce((acc, m) => acc + (m.cosDepreciation || 0), 0);
    const capex =
      yearMonths.reduce((s, p) => s + (p.vat_fa_purchased ? Math.abs(p.vat_fa_purchased) : 0), 0) ||
      (v2State.fixedAssets || []).reduce((sum: number, a: any) => {
        if (a.financeOption !== 'lease' && a.purchaseTiming !== 'prior' && a.purchaseMonth >= startMo + 1 && a.purchaseMonth <= startMo + 12) {
          return sum + (a.purchaseValue ?? a.purchaseCost ?? 0);
        }
        return sum;
      }, 0);
    const application_to_capital_assets = cos_dep + ex_depreciation - capex;

    const share_capital_change = yearMonths.reduce((s, p: any) => s + (p.share_capital_additional_raised || 0), 0);
    const equity_loan_change = yearMonths.reduce(
      (s, p: any) => s + ((p.equity_loan_additional || 0) - (p.equity_loan_repayments || 0)),
      0
    );
    const loan_change =
      term_loan_balance - (prevYearLastMonth?.term_loan_balance ?? (yr === 1 ? v2State.funding?.bankLoanAmount || 0 : 0));
    const change_in_funding = share_capital_change + equity_loan_change + loan_change;
    const cashflow = cash_from_operations + change_in_working_capital + application_to_capital_assets + change_in_funding;

    if (mode === 'rev') return revenue;
    if (mode === 'cos') return computedCos;
    if (mode === 'gp') return gross_profit;
    if (mode === 'opex') return ex_total;
    if (mode === 'nop') return net_operating_profit;
    if (mode === 'tax') return taxation;
    if (mode === 'np') return taxed_profits;

    if (mode === 'assets') return total_assets;
    if (mode === 'liabilities') return total_liabilities;
    if (mode === 'equity') return total_equity;
    if (mode === 'bank') return bank_balance;

    if (mode === 'cash-ops') return cash_from_operations + change_in_working_capital;
    if (mode === 'cash-inv') return application_to_capital_assets;
    if (mode === 'cash-fin') return change_in_funding;
    if (mode === 'cash-flow') return cashflow;

    if (mode === 'gp-margin') return revenue > 0 ? (gross_profit / revenue) * 100 : 0;
    if (mode === 'roa') {
      const nonInterestDebt = vat_payable + taxation_payable;
      const netOperatingAssets = total_assets - nonInterestDebt;
      return netOperatingAssets !== 0 ? (net_operating_profit / netOperatingAssets) * 100 : 0;
    }
    if (mode === 'debt-equity') return total_equity > 0 ? term_loan_balance / total_equity : 0;

    return 0;
  });
}
