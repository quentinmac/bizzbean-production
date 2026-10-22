import { BizzModelState } from '../constants';

export interface VatMonthMetrics {
  month: number;
  vatRate: number;
  revenue: number;
  capex: number;
  totalCos: number;
  totalOpex: number;
  cosEmployment: number;
  exEmployment: number;
  cosDepreciation: number;
  exDepreciation: number;
  vatAddbackEmployment: number;
  vatAddbackDepreciation: number;
  vatableAmount: number;
  vatCalcValue: number;
  vatOpeningBalance: number;
  vatSettlement: number;
  vatClosingBalance: number;
  vatReceivable: number; // Current Asset (COA 3-2-2-1: Input VAT Refundable)
  vatPayable: number;    // Current Liability (COA 4-7-1-1: Output VAT Payable)
}

export interface MonthlyFinancialSummary {
  month: number;
  unitSales: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  employmentExpenses: number;
  operatingExpenses: number;
  totalExpenses: number;
  depreciation: number;
  ebitda: number;
  interestExpense: number; // Term Loan Interest (COA 2-7-1-1)
  // V1 Detailed Trading Account Breakdown
  cosMaterials: number;
  cosPackaging: number;
  cosEmployment: number;
  cosDepreciation: number;
  cosLeases: number;
  cosOverheads: number;
  gpAdjustmentsVariance: number;
  gpAdjustmentsCommission: number;
  gpAdjustmentsInventory: number;
  totalIncome: number;
  opexEmployment: number;
  opexMarketing: number;
  opexAdminDepreciation: number;
  opexStandard: number;
  netOperatingProfit: number; // NOP
  interestTermLoan: number;
  interestAssetLoan: number;
  interestOverdraftLine: number;
  interestReceivedLine: number;
  netFinanceCharges: number;
  netProfitBeforeTaxation: number; // NPBT
  taxationCit: number;
  netProfitAfterTax: number; // NPAT / Taxed Profit
  dividendsDeclared: number;
  retainedEarningsBalance: number;
  // V1 Bank Interest & Overdraft Engine fields
  avgMonthlyBalance: number;
  applicableRatePct: number;
  interestOther: number;
  interestReceived: number; // Positive cash interest (COA 1-3-1-1)
  interestOverdraft: number; // Negative cash / overdraft interest (COA 2-7-1-2)
  netProfitBeforeTax: number;
  netProfit: number;
  closingCash: number;
  bank_balance_closing: number; // V1 simulation engine alias
  debtBalance: number;
  term_loan_balance: number;    // V1 simulation engine alias
  // V1 VAT Engine fields
  vatableAmount: number;
  vatCalcValue: number;
  vatOpeningBalance: number;
  vatSettlement: number;
  vatClosingBalance: number;
  vatReceivable: number;
  vatPayable: number;
  vat_revenue?: number;
  vat_fa_sold?: number;
  vat_fa_purchased?: number;
  vat_cos?: number;
  vat_opex?: number;
  vat_addback_employment?: number;
  vat_addback_depreciation?: number;
  vatable_amount?: number;
  vat_calc_value?: number;
  vat_opening_balance?: number;
  vat_account_balance?: number;
  vat_settlement?: number;
  vat_closing_balance?: number;
  vat_receivable?: number;
  vat_payable?: number;
  // V1 Tax & Assessed Loss Carry-Forward Engine fields
  cumulativeProfitThisYear: number;
  taxCarriedForwardLoss: number;
  taxableProfitCumulative: number;
  taxationCumulative: number;
  taxationMonthly: number;
  taxedProfits: number;
  dividends: number;
  retainedEarnings: number;
  cumulativeRetainedEarnings: number;
  taxPayment: number;
  taxLiability: number; // COA 4-7-1-2: Corporate Tax Payable to SARS
}

/**
 * Calculates authentic V1 VAT Ledger balances month by month.
 * Incorporates capital purchases, COS, OPEX, and non-vatable add-backs (employment and depreciation).
 */
export function calculateVatMonth(
  mo: number, // 0-indexed month
  vatRatePct: number,
  revenue: number,
  capex: number,
  total_cos: number,
  ex_total: number,
  cos_employment: number,
  ex_employment: number,
  cos_depreciation: number,
  ex_depreciation: number,
  previousVatClosingBalance: number = 0
): VatMonthMetrics {
  const vat_rate = vatRatePct / 100;
  const vat_revenue = revenue;
  const vat_fa_sold = 0;
  const vat_fa_purchased = -capex;
  const vat_cos = -total_cos;
  const vat_opex = -ex_total;

  // Non-vatable elements added back to the pool
  const vat_addback_employment = -(cos_employment + ex_employment);
  const vat_addback_depreciation = cos_depreciation + ex_depreciation;

  const vatable_amount =
    vat_revenue +
    vat_fa_sold +
    vat_fa_purchased +
    vat_cos +
    vat_opex +
    vat_addback_employment +
    vat_addback_depreciation;

  const vat_calc_value = -Math.round(vatable_amount * vat_rate);

  // VAT Ledger Balances (Settlement cycle)
  const vat_opening_balance = mo === 0 ? 0 : previousVatClosingBalance;
  const vat_settlement = mo === 0 ? 0 : -vat_opening_balance;
  const vat_closing_balance = vat_calc_value;

  const vat_receivable = vat_closing_balance > 0 ? vat_closing_balance : 0;
  const vat_payable = vat_closing_balance < 0 ? -vat_closing_balance : 0;

  return {
    month: mo + 1,
    vatRate: vatRatePct,
    revenue: vat_revenue,
    capex,
    totalCos: total_cos,
    totalOpex: ex_total,
    cosEmployment: cos_employment,
    exEmployment: ex_employment,
    cosDepreciation: cos_depreciation,
    exDepreciation: ex_depreciation,
    vatAddbackEmployment: vat_addback_employment,
    vatAddbackDepreciation: vat_addback_depreciation,
    vatableAmount: vatable_amount,
    vatCalcValue: vat_calc_value,
    vatOpeningBalance: vat_opening_balance,
    vatSettlement: vat_settlement,
    vatClosingBalance: vat_closing_balance,
    vatReceivable: vat_receivable,
    vatPayable: vat_payable,
  };
}

export function calculateFinancialModelProjections(
  state: BizzModelState,
  horizonMonths: number = 36,
  rateOverrides?: Record<string, number[]>
): MonthlyFinancialSummary[] {
  const results: MonthlyFinancialSummary[] = [];
  let cash = (state.funding.founderEquity || 0) + (state.funding.investorEquity || 0) + (state.funding.bankLoanAmount || 0);
  let debtBalance = state.funding.bankLoanAmount || 0;
  const vatRate = (state.businessDetails as any).vatRate ?? 15;
  const taxRate = (state.businessDetails as any).taxRate ?? 27; // South Africa 27% CIT
  const taxPaymentCycleMonths = 6; // Half-yearly provisional tax cycle: Month 6 & Month 12

  // Bank interest & Overdraft settings
  const positiveBaseRate = (state.funding as any).positiveBaseRate ?? 4.5; // Positive cash return %
  const negativeBaseRate = (state.funding as any).negativeBaseRate ?? 11.75; // Overdraft borrowing rate %

  // Monthly loan principal payment
  const loanPrincipalMonthly =
    state.funding.loanTermMonths > 0 ? debtBalance / state.funding.loanTermMonths : 0;

  let prevVatClosingBalance = 0;
  let taxCarriedForwardLoss = (state.funding as any).initialTaxLoss ?? 0;
  let taxationCumulativePrev = 0;
  let taxLiabilityBalance = 0;
  let totalCumulativeRetainedEarnings = 0;

  for (let m = 1; m <= horizonMonths; m++) {
    const mo = m - 1; // 0-indexed month
    const current_year_start_mo = Math.floor(mo / 12) * 12;
    const closing_bank_pre = cash; // Opening bank balance for this month

    // Reset year-to-date cumulative tax provision tracker at start of each financial year
    if (mo % 12 === 0) {
      taxationCumulativePrev = 0;
    }

    // 1. Revenue
    let revenue = 0;
    let cogs = 0;
    let unitSales = 0;
    state.revenueItems.forEach((item) => {
      const unitCount =
        item.monthlyUnits[m - 1] ??
        Math.round((item.monthlyUnits[item.monthlyUnits.length - 1] || 100) * Math.pow(1.05, m - item.monthlyUnits.length));
      unitSales += unitCount;
      const itemRev = unitCount * item.unitPrice;
      const itemCogs = itemRev * (item.costOfSalesPct / 100);
      revenue += itemRev;
      cogs += itemCogs;
    });

    const grossProfit = revenue - cogs;
    const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Detailed Cost of Sales allocations
    const cosMaterials = Math.round(cogs * 0.70);
    const cosPackaging = Math.round(cogs * 0.15);
    const cosEmployment = 0; // Production direct labor
    const cosDepreciation = 0; // Plant depreciation
    const cosLeases = 0; // Plant operating leases
    const cosOverheads = Math.max(0, cogs - cosMaterials - cosPackaging);

    // Gross Profit Adjustments
    const gpAdjustmentsVariance = 0; // Standard costing variance
    const gpAdjustmentsCommission = Math.round(revenue * 0.015); // e.g. 1.5% sales commission
    const gpAdjustmentsInventory = 0; // Inventory adjustments
    const totalIncome = grossProfit - gpAdjustmentsCommission + gpAdjustmentsVariance + gpAdjustmentsInventory;

    // 2. Employment
    let employment = 0;
    state.employmentItems.forEach((emp) => {
      if (m >= emp.startMonth) {
        const total = emp.baseRateMonthly * emp.numEmployees * (1 + (emp.onCostPct || 0) / 100);
        employment += total;
      }
    });

    // 3. Operating Expenses
    let opex = 0;
    let marketingExpense = 0;
    let standardOpex = 0;
    state.expenses.forEach((exp) => {
      if (m >= exp.startMonth) {
        const inflated = exp.monthlyAmount * Math.pow(1 + (exp.growthRatePct || 0) / 100, (m - exp.startMonth) / 12);
        opex += inflated;
        if (exp.category?.toLowerCase().includes('marketing') || exp.name?.toLowerCase().includes('adver')) {
          marketingExpense += inflated;
        } else {
          standardOpex += inflated;
        }
      }
    });

    // 4. Depreciation
    let depreciation = 0;
    state.fixedAssets.forEach((asset) => {
      if (m >= asset.purchaseMonth && m < asset.purchaseMonth + asset.usefulLifeMonths) {
        const monthlyDep = (asset.purchaseCost - asset.scrapValue) / asset.usefulLifeMonths;
        depreciation += Math.max(0, monthlyDep);
      }
    });

    // Fixed asset purchases cash outflow (Capex)
    let assetPurchaseCash = 0;
    state.fixedAssets.forEach((asset) => {
      if (m === asset.purchaseMonth) {
        assetPurchaseCash += asset.purchaseCost;
      }
    });

    // 5. Term Loan Interest & Debt Principal
    const currentTermLoanRate = (rateOverrides?.interestRatePct?.[mo] ?? state.funding.interestRatePct ?? 10) / 100 / 12;
    const loanInterest = debtBalance * currentTermLoanRate;
    const principalPaid = debtBalance > 0 ? Math.min(debtBalance, loanPrincipalMonthly) : 0;
    debtBalance = Math.max(0, debtBalance - principalPaid);

    const totalOperatingCosts = employment + opex;
    const ebitda = grossProfit - totalOperatingCosts;
    const netOperatingProfit = totalIncome - totalOperatingCosts - depreciation;

    // 6. VAT Ledger Calculation
    const currentVatRate = rateOverrides?.vatRate?.[mo] ?? vatRate;
    const vatMetrics = calculateVatMonth(
      mo,
      currentVatRate,
      revenue,
      assetPurchaseCash,
      cogs,
      opex,
      cosEmployment,
      employment,
      cosDepreciation,
      depreciation,
      prevVatClosingBalance
    );
    prevVatClosingBalance = vatMetrics.vatClosingBalance;

    // 7. V1 Bank Interest & Overdraft Rate Engine
    const current_bank_balance =
      closing_bank_pre + (grossProfit - totalOperatingCosts - principalPaid - assetPurchaseCash + vatMetrics.vatSettlement);

    const avg_monthly_balance = (current_bank_balance + closing_bank_pre) / 2;

    const currentPositiveBaseRate = rateOverrides?.positiveBaseRate?.[mo] ?? positiveBaseRate;
    const currentNegativeBaseRate = rateOverrides?.negativeBaseRate?.[mo] ?? negativeBaseRate;

    let applicable_rate = 0;
    if (avg_monthly_balance >= 0) {
      applicable_rate = currentPositiveBaseRate / 100;
    } else {
      applicable_rate = currentNegativeBaseRate / 100; // Overdraft interest rate
    }

    const interest_other = Math.round(avg_monthly_balance * (applicable_rate / 12));
    const interestReceived = interest_other > 0 ? interest_other : 0; // COA 1-3-1-1
    const interestOverdraft = interest_other < 0 ? Math.abs(interest_other) : 0; // COA 2-7-1-2
    const netFinanceCharges = Math.round(loanInterest + interestOverdraft - interestReceived);

    // 8. Net Profit Before Tax (NPBT)
    const net_profit_before_tax = Math.round(netOperatingProfit - netFinanceCharges);

    // 9. V1 Corporate Tax & Assessed Loss Engine
    let cumulative_profit_this_year = net_profit_before_tax;
    for (let k = current_year_start_mo; k < mo; k++) {
      cumulative_profit_this_year += results[k]?.netProfitBeforeTax || 0;
    }

    // Deduct assessed tax loss carried forward from previous years
    const taxable_profit_cumulative = cumulative_profit_this_year - taxCarriedForwardLoss;

    const currentTaxRate = rateOverrides?.taxRate?.[mo] ?? taxRate;
    let taxation_cumulative = 0;
    if (taxable_profit_cumulative > 0) {
      taxation_cumulative = Math.round(taxable_profit_cumulative * (currentTaxRate / 100));
    }

    // Monthly tax provision
    const taxation_monthly = Math.max(0, taxation_cumulative - taxationCumulativePrev);
    taxationCumulativePrev = taxation_cumulative;

    // PAT & Retained Earnings
    const taxed_profits = net_profit_before_tax - taxation_monthly;
    const dividends = 0; // or dividend distribution
    const retained_earnings = taxed_profits - dividends;
    totalCumulativeRetainedEarnings += retained_earnings;

    // Tax Liability & Settlement (Half-yearly provisional tax: Month 6 & Month 12)
    taxLiabilityBalance += taxation_monthly;
    let tax_payment = 0;
    if (mo > 0 && (mo + 1) % taxPaymentCycleMonths === 0) {
      tax_payment = Math.max(0, taxLiabilityBalance);
      taxLiabilityBalance = 0; // Settled with SARS
    }

    // Update carried forward loss at the end of each financial year
    if ((mo + 1) % 12 === 0) {
      if (taxable_profit_cumulative < 0) {
        taxCarriedForwardLoss = Math.abs(taxable_profit_cumulative);
      } else {
        taxCarriedForwardLoss = 0;
      }
    }

    // Final Closing Cash for the month
    cash = current_bank_balance + interest_other - tax_payment;

    results.push({
      month: m,
      unitSales: Math.round(unitSales),
      revenue: Math.round(revenue),
      cogs: Math.round(cogs),
      grossProfit: Math.round(grossProfit),
      grossMarginPct: Math.round(grossMarginPct * 10) / 10,
      employmentExpenses: Math.round(employment),
      operatingExpenses: Math.round(opex),
      totalExpenses: Math.round(totalOperatingCosts),
      depreciation: Math.round(depreciation),
      ebitda: Math.round(ebitda),
      interestExpense: Math.round(loanInterest),
      // Detailed Trading Account Breakdown
      cosMaterials,
      cosPackaging,
      cosEmployment,
      cosDepreciation,
      cosLeases,
      cosOverheads,
      gpAdjustmentsVariance,
      gpAdjustmentsCommission,
      gpAdjustmentsInventory,
      totalIncome: Math.round(totalIncome),
      opexEmployment: Math.round(employment),
      opexMarketing: Math.round(marketingExpense),
      opexAdminDepreciation: Math.round(depreciation),
      opexStandard: Math.round(standardOpex),
      netOperatingProfit: Math.round(netOperatingProfit),
      interestTermLoan: Math.round(loanInterest),
      interestAssetLoan: 0,
      interestOverdraftLine: Math.round(interestOverdraft),
      interestReceivedLine: Math.round(interestReceived),
      netFinanceCharges,
      netProfitBeforeTaxation: net_profit_before_tax,
      taxationCit: Math.round(taxation_monthly),
      netProfitAfterTax: Math.round(taxed_profits),
      dividendsDeclared: dividends,
      retainedEarningsBalance: Math.round(totalCumulativeRetainedEarnings),
      // Bank Interest & Overdraft
      avgMonthlyBalance: Math.round(avg_monthly_balance),
      applicableRatePct: Math.round(applicable_rate * 1000) / 10,
      interestOther: Math.round(interest_other),
      interestReceived: Math.round(interestReceived),
      interestOverdraft: Math.round(interestOverdraft),
      netProfitBeforeTax: net_profit_before_tax,
      netProfit: taxed_profits, // PAT
      closingCash: Math.round(cash),
      bank_balance_closing: Math.round(cash),
      debtBalance: Math.round(debtBalance),
      term_loan_balance: Math.round(debtBalance),
      // VAT metrics
      vatableAmount: Math.round(vatMetrics.vatableAmount),
      vatCalcValue: Math.round(vatMetrics.vatCalcValue),
      vatOpeningBalance: Math.round(vatMetrics.vatOpeningBalance),
      vatSettlement: Math.round(vatMetrics.vatSettlement),
      vatClosingBalance: Math.round(vatMetrics.vatClosingBalance),
      vatReceivable: Math.round(vatMetrics.vatReceivable),
      vatPayable: Math.round(vatMetrics.vatPayable),
      vat_revenue: Math.round(revenue),
      vat_fa_sold: 0,
      vat_fa_purchased: -Math.round(assetPurchaseCash),
      vat_cos: -Math.round(cogs),
      vat_opex: -Math.round(totalOperatingCosts),
      vat_addback_employment: Math.round(vatMetrics.vatAddbackEmployment),
      vat_addback_depreciation: Math.round(vatMetrics.vatAddbackDepreciation),
      vatable_amount: Math.round(vatMetrics.vatableAmount),
      vat_calc_value: Math.round(vatMetrics.vatCalcValue),
      vat_opening_balance: Math.round(vatMetrics.vatOpeningBalance),
      vat_account_balance: Math.round(vatMetrics.vatOpeningBalance + vatMetrics.vatCalcValue),
      vat_settlement: Math.round(vatMetrics.vatSettlement),
      vat_closing_balance: Math.round(vatMetrics.vatClosingBalance),
      vat_receivable: Math.round(vatMetrics.vatReceivable),
      vat_payable: Math.round(vatMetrics.vatPayable),
      // Corporate Tax metrics
      cumulativeProfitThisYear: Math.round(cumulative_profit_this_year),
      taxCarriedForwardLoss: Math.round(taxCarriedForwardLoss),
      taxableProfitCumulative: Math.round(taxable_profit_cumulative),
      taxationCumulative: Math.round(taxation_cumulative),
      taxationMonthly: Math.round(taxation_monthly),
      taxedProfits: Math.round(taxed_profits),
      dividends: Math.round(dividends),
      retainedEarnings: Math.round(retained_earnings),
      cumulativeRetainedEarnings: Math.round(totalCumulativeRetainedEarnings),
      taxPayment: Math.round(tax_payment),
      taxLiability: Math.round(taxLiabilityBalance),
    });
  }

  return results;
}

/**
 * V1 Simulation Engine alias
 */
export const runMonthlySimulation = calculateFinancialModelProjections;
