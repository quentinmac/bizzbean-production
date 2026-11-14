import { BizzModelState, EmploymentCategory, DEFAULT_EMPLOYMENT_CATEGORIES, PlatformForecastAppId, TermLoanEntry } from '../constants';
import { AssumptionRateItem } from '../../bizzdynamics/types';
import { calculate60MonthWorkingCalendar } from './calendarCalc';
import { calculateTermLoanMetrics, TermLoan } from './loanCalc';

/**
 * Excel PMT Formula for lease calculations:
 * PMT = (PV * r) / (1 - (1 + r)^(-n))
 * where r = annualRatePct / 100 / 12, n = termYears * 12
 */
export function calculateLeasePMT(pv: number, annualRatePct: number, termYears: number): number {
  if (pv <= 0 || termYears <= 0) return 0;
  const n = termYears * 12;
  const r = annualRatePct / 100 / 12;
  if (r <= 0) return pv / n;
  return (pv * r) / (1 - Math.pow(1 + r, -n));
}

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
  totalCos?: number;
  cosVariable?: number;
  cosFixed?: number;
  cosMaterials: number;
  cosPackaging: number;
  cosEmployment: number;
  cosDepreciation: number;
  cosLeases: number;
  cosOverheads: number;
  gpAdjustmentsVariance: number;
  gpAdjustmentsCommission: number;
  gpAdjustmentsInventory: number;
  otherIncomeTotal: number;
  totalIncome: number;
  opexEmployment: number;
  opexMarketing: number;
  opexAdminDepreciation: number;
  opexStandard: number;
  exVariable: number;
  exOverheads: number;
  exDepreciation?: number;
  exLease?: number;
  exFixed?: number;
  exTotal?: number;
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
  bank_balance_opening?: number;
  bank_balance_closing: number; // V1 simulation engine alias
  cashflow?: number;
  cash_from_operations?: number;
  change_in_working_capital?: number;
  application_to_capital_assets?: number;
  change_in_funding?: number;
  debtBalance: number;
  term_loan_balance: number;    // V1 simulation engine alias
  // V1 VAT Engine fields
  vatRate?: number;
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
  taxRateUsed: number;
  cumulativeProfitThisYear: number;
  taxCarriedForwardLoss: number;
  taxableProfitCumulative: number;
  taxationCumulative: number;
  taxationMonth: number;
  taxationMonthly: number;
  taxedProfits: number;
  dividends: number;
  retainedEarnings: number;
  cumulativeRetainedEarnings: number;
  taxOpeningBalance: number;
  taxClosingBalance: number;
  taxPayment: number;
  taxLiability: number; // COA 4-7-1-2: Corporate Tax Payable to SARS
  // Working Capital Velocity & Other Assets
  inventory: number;
  inventoryDaysUsed: number;
  accounts_receivable: number;
  debtorDaysUsed: number;
  accounts_payable: number;
  creditorDaysUsed: number;
  other_assets: number;
  deposits: number;
  floats: number;
  pettyCash: number;
  // Term Loans PPMT / IPMT
  term_loan_advance: number;
  term_loan_capital_repayment: number;
  term_loan_interest_payment: number;
  // Share Capital & Equity Loans
  shares_in_issue: number;
  ordinary_share_capital: number;
  share_capital_additional_raised: number;
  share_premium: number;
  shareholders_capital: number;
  equity_loan_opening: number;
  equity_loan_additional: number;
  equity_loan_repayments: number;
  equity_loan_closing: number;
  // Dividends & Valuation Per Share Metrics
  dividends_per_share: number;
  eps: number;
  bank_balance_per_share: number;
  debt_equity_ratio: number;
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
  rateOverrides?: Record<string, number[]>,
  appModeOverride?: PlatformForecastAppId
): MonthlyFinancialSummary[] {
  const results: MonthlyFinancialSummary[] = [];
  const initialOpeningCash =
    (state.funding.founderEquity || 0) +
    (state.funding.investorEquity || 0) +
    ((state.funding as any).equityLoan || 0) +
    (state.funding.bankLoanAmount || 0);
  let cash = initialOpeningCash;
  let debtBalance = state.funding.bankLoanAmount || 0;
  const setupAssumps = (state.businessDetails as any)?.setupAssumptions as AssumptionRateItem[] | undefined;
  const setupPosItem = setupAssumps?.find((a) => a.id === 'interest-pos');
  const setupNegItem = setupAssumps?.find((a) => a.id === 'interest-neg');
  const setupVatItem = setupAssumps?.find((a) => a.id === 'vat-rate');
  const setupTaxItem = setupAssumps?.find((a) => a.id === 'tax-rate');

  const vatRate = (state.businessDetails as any).vatRate ?? setupVatItem?.baseRate ?? 0;
  const taxRate = (state.businessDetails as any).taxRate ?? setupTaxItem?.baseRate ?? 0; // CIT
  const taxPaymentCycle = state.businessDetails?.taxPaymentCycle || 'monthly';
  const taxPaymentCycleMonths =
    taxPaymentCycle === 'quarterly' ? 3 :
    taxPaymentCycle === 'bi-annually' ? 6 :
    taxPaymentCycle === 'annual' ? 12 : 1;

  // Bank interest & Overdraft settings
  const positiveBaseRate = setupPosItem?.baseRate ?? (state.funding as any).positiveBaseRate ?? 4.5; // Positive cash return %
  const negativeBaseRate = setupNegItem?.baseRate ?? (state.funding as any).negativeBaseRate ?? 11.75; // Overdraft borrowing rate %

  // Monthly loan principal payment
  const loanPrincipalMonthly =
    state.funding.loanTermMonths > 0 ? debtBalance / state.funding.loanTermMonths : 0;

  let prevVatClosingBalance = 0;
  let prevVatReceivable = 0;
  let prevVatPayable = 0;
  let taxCarriedForwardLoss = (state.funding as any).initialTaxLoss ?? 0;
  let taxationCumulativePrev = 0;
  let taxLiabilityBalance = 0;
  let totalCumulativeRetainedEarnings = 0;

  // Working capital trackers
  let prevInventory = 0;
  let prevReceivables = 0;
  let prevPayables = 0;
  let prevOtherAssets = 0;

  // Share capital trackers
  const initialSharesCount = state.funding.initialSharesCount ?? 1000;
  const initialSharePrice = state.funding.initialSharePrice ?? 1.0;
  const ordinaryShareCapital = -(initialSharesCount * initialSharePrice);
  let cumAdditionalShares = 0;
  let cumSharePremium = 0;

  // Equity loan trackers
  const equityLoanOpening = state.funding.equityLoanOpening ?? (state.funding.equityLoan ? -Math.abs(state.funding.equityLoan) : -20000);
  let cumEquityLoanAdditional = 0;
  let cumEquityLoanRepayments = 0;

  const calendar60 = calculate60MonthWorkingCalendar(state.businessDetails);

  const categoriesList = state.employmentCategories && state.employmentCategories.length > 0
    ? state.employmentCategories
    : DEFAULT_EMPLOYMENT_CATEGORIES;
  const categoriesMap = new Map<string, EmploymentCategory>();
  categoriesList.forEach((c) => categoriesMap.set(c.id, c));

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
    let gpAdjustmentsVariance = 0;
    let gpAdjustmentsCommission = 0;
    let gpAdjustmentsInventory = 0;
    let otherIncomeTotal = 0;

    state.revenueItems.forEach((item) => {
      const launchMonth = item.startMonth || 1;
      if (m < launchMonth) return;

      if (item.dailyUnitSalesMonthly && item.dailyUnitSalesMonthly.length > 0) {
        const absIdx = mo < 60 ? mo : 59;
        const daysWorked = calendar60[absIdx]?.daysWorked ?? 21;
        const dailyUnits = item.dailyUnitSalesMonthly[absIdx] ?? 1000;
        const prodCost = item.productionUnitCostMonthly?.[absIdx] ?? -Math.abs(item.unitCost !== undefined ? item.unitCost : 10);
        const mfgMargin = item.manufacturingMarginPctMonthly?.[absIdx] ?? 10.00;
        const gpMargin = item.grossProfitMarginPctMonthly?.[absIdx] ?? 50.00;
        const commPct = item.salesCommissionPctMonthly?.[absIdx] ?? 1.00;
        const invPct = item.inventoryAdjustmentPctMonthly?.[absIdx] ?? 1.00;
        const otherInc = item.otherIncomeMonthly?.[absIdx] ?? 0;

        const denom6 = 1 - mfgMargin / 100;
        const unitCostPrice = denom6 !== 0 ? prodCost / denom6 : prodCost;
        const mfgVariancePerUnit = prodCost - unitCostPrice;

        const denom7 = 1 - gpMargin / 100;
        const unitSellingPrice = denom7 !== 0 ? -unitCostPrice / denom7 : Math.abs(unitCostPrice);

        const itemUnits = Math.round(daysWorked * dailyUnits);
        const itemRev = Math.round(daysWorked * dailyUnits * unitSellingPrice);
        const itemCogs = Math.round(daysWorked * dailyUnits * Math.abs(unitCostPrice));

        unitSales += itemUnits;
        revenue += itemRev;
        cogs += itemCogs;

        gpAdjustmentsCommission += Math.round(itemRev * (commPct / 100));
        gpAdjustmentsInventory += Math.round(itemCogs * (invPct / 100));
        gpAdjustmentsVariance += Math.round(daysWorked * dailyUnits * mfgVariancePerUnit);
        otherIncomeTotal += otherInc;
      } else {
        const unitCount =
          item.monthlyUnits && item.monthlyUnits.length > 0
            ? item.monthlyUnits[m - 1] ??
              Math.round((item.monthlyUnits[item.monthlyUnits.length - 1] || 0) * Math.pow(1.05, m - item.monthlyUnits.length))
            : 0;
        unitSales += unitCount;
        const itemRev = unitCount * (item.unitPrice || 0);
        const itemCogs =
          item.unitCost !== undefined && item.unitCost > 0
            ? unitCount * item.unitCost
            : itemRev * ((item.costOfSalesPct || 0) / 100);
        revenue += itemRev;
        cogs += itemCogs;
        gpAdjustmentsCommission += Math.round(itemRev * 0.01);
        gpAdjustmentsInventory += Math.round(itemCogs * 0.01);
      }
    });

    // Direct materials from revenue engine
    const cosMaterials = Math.round(cogs);
    const cosPackaging = 0;

    // 2. Employment allocations (Cost of Sales - Fixed vs Expenses - Fixed)
    let cosEmployment = 0;
    let opexEmployment = 0;

    const yearIdx = Math.floor(mo / 12); // 0..4 for Years 1..5
    const calMonth = (mo % 12) + 1; // 1..12

    (state.employmentItems || []).forEach((emp) => {
      const cat = categoriesMap.get(emp.categoryId);
      const onCostPct = cat ? cat.onCostPct : (emp.onCostPct ?? 0);

      let isActive = false;
      if (emp.employmentType === 'seasonal') {
        const sStart = emp.seasonalStartMonth ?? 1;
        const sEnd = emp.seasonalEndMonth ?? 12;
        if (sStart <= sEnd) {
          isActive = calMonth >= sStart && calMonth <= sEnd;
        } else {
          isActive = calMonth >= sStart || calMonth <= sEnd;
        }
        if (m < (emp.startMonth || 1)) {
          isActive = false;
        }
      } else {
        isActive = m >= (emp.startMonth || 1);
      }

      if (isActive) {
        // Base monthly cost * (1 + on-cost %) * headcount
        let cost = emp.baseRateMonthly * (emp.numEmployees || 1) * (1 + onCostPct / 100);

        // Category slider monthly adjustment (delta % from BaseRateAdjustmentTool)
        if (cat?.monthlyAdjustmentPct && cat.monthlyAdjustmentPct[mo] !== undefined) {
          const deltaPct = cat.monthlyAdjustmentPct[mo];
          cost = cost * (1 + deltaPct / 100);
        }

        if (emp.allocation === 'cost_of_sales') {
          cosEmployment += cost;
        } else {
          opexEmployment += cost;
        }
      }
    });

    // 3. Operating Expenses Engine
    const effectiveAppMode = appModeOverride || state.appMode || 'bizzdynamics';
    const isPresetMode = effectiveAppMode === 'rolling-forecast' || effectiveAppMode === 'hi-level-forecast';
    const isBizzModel = effectiveAppMode === 'bizzmodel';

    let rawCosShareOfFixed = 0;
    let rawOpexFixed = 0;
    let rawOpexVariable = 0;
    let rawFixedExpenses = 0;
    let rawVariableExpenses = 0;

    const allocationToCostOfSalesPct = state.opexSettings?.allocationToCostOfSalesPct ?? 1.00;
    const catAdjustments = state.opexSettings?.categoryAdjustments;
    const cosShareDeltaPct = catAdjustments?.cosShareOfFixed?.[mo] ?? 0;
    const opexVarDeltaPct = catAdjustments?.opexVariable?.[mo] ?? 0;
    const opexFixedDeltaPct = catAdjustments?.opexFixed?.[mo] ?? 0;

    if (isPresetMode) {
      // Rolling Forecast & Hi-Level Forecast:
      // Exactly 3 lines, calculated as % of revenue:
      // • cost of sales – fixed (allocated to: cost of sales - share of fixed overheads)
      // • overheads – fixed (allocated to: operating expenses – fixed)
      // • overheads – variable (allocated to: operating expenses – variable)
      const cosFixedPct = state.opexSettings?.hiLevelPreset?.cosFixedPct ?? 1.00;
      const opexFixedPct = state.opexSettings?.hiLevelPreset?.opexFixedPct ?? 1.00;
      const opexVarPct = state.opexSettings?.hiLevelPreset?.opexVarPct ?? 1.00;

      rawCosShareOfFixed = revenue * (cosFixedPct / 100);
      rawOpexFixed = revenue * (opexFixedPct / 100);
      rawOpexVariable = revenue * (opexVarPct / 100);
      rawFixedExpenses = rawCosShareOfFixed + rawOpexFixed;
      rawVariableExpenses = rawOpexVariable;
    } else {
      // Standard Detailed Expenses (BizzModel: all selected expenses from COA; BizzDynamics: up to 5 expenses):
      (state.expenses || []).forEach((exp) => {
        if (m < (exp.startMonth || 1)) return;
        if (exp.isAnnuity || (exp.annuityMonth !== undefined && exp.annuityMonth > 0)) {
          const targetAnnuityMonth = exp.annuityMonth ?? 1;
          if (calMonth !== targetAnnuityMonth) return;
        }

        let cost = 0;
        if (exp.type === 'variable') {
          if (exp.pctOfRevenue !== undefined && exp.pctOfRevenue > 0) {
            cost = revenue * (exp.pctOfRevenue / 100);
          } else {
            cost = exp.baseRateMonthly ?? exp.monthlyAmount ?? 0;
          }
        } else {
          cost = exp.baseRateMonthly ?? exp.monthlyAmount ?? 0;
        }

        if (exp.growthRatePct && exp.growthRatePct > 0) {
          cost = cost * Math.pow(1 + exp.growthRatePct / 100, (m - exp.startMonth) / 12);
        }

        if (exp.monthlyAdjustmentPct && exp.monthlyAdjustmentPct[mo] !== undefined) {
          cost = cost * (1 + exp.monthlyAdjustmentPct[mo] / 100);
        }

        if (exp.type === 'variable') {
          rawVariableExpenses += cost;
        } else {
          rawFixedExpenses += cost;
        }
      });

      rawCosShareOfFixed = rawFixedExpenses * (allocationToCostOfSalesPct / 100);
      rawOpexFixed = rawFixedExpenses - rawCosShareOfFixed;
      rawOpexVariable = rawVariableExpenses;
    }

    // Category adjustments from ADJUSTMENT SLIDER (Results tab)
    const cosOverheads = Math.round(rawCosShareOfFixed * (1 + cosShareDeltaPct / 100));
    const exVariable = Math.round(rawOpexVariable * (1 + opexVarDeltaPct / 100));
    const exOverheads = Math.round(rawOpexFixed * (1 + opexFixedDeltaPct / 100));

    // 3. Fixed Assets & Leases Engine
    // Supports Buy vs Lease, Cost of Sales vs Overheads allocation, and Year 0 opening assets
    let cosDepreciation = 0;
    let cosLeases = 0;
    let exDepreciation = 0;
    let exLease = 0;
    let assetPurchaseCash = 0;

    (state.fixedAssets || []).forEach((asset) => {
      const isLease = asset.financeOption === 'lease';
      const isCos = asset.allocation === 'cost_of_sales';
      const isPrior = asset.purchaseTiming === 'prior';
      const pMonth = asset.purchaseMonth || 1;
      const pValue = asset.purchaseValue ?? ((asset.unitCost || asset.purchaseCost || 0) * (asset.quantity || 1));
      const depRate = asset.depreciationRate || 20;

      if (isLease) {
        // LEASE OPTION:
        // Capped at max 60 months total. Capital purchase value NEVER added to cash Capex or balance sheet PPE.
        let monthlyLease = 0;
        const totalTermMonths = Math.min(60, (asset.leaseTermYears || 5) * 12);
        const leaseRate = asset.leaseRatePct ?? 10.0;
        const leaseYears = asset.leaseTermYears || 5;

        if (isPrior) {
          const priorElapsed = asset.monthsInSystem || 0;
          const remainingMonths = Math.max(0, totalTermMonths - priorElapsed);
          if (m < remainingMonths) {
            monthlyLease = calculateLeasePMT(pValue, leaseRate, leaseYears);
          }
        } else {
          if (m + 1 >= pMonth && m + 1 < pMonth + totalTermMonths) {
            monthlyLease = calculateLeasePMT(pValue, leaseRate, leaseYears);
          }
        }

        if (isCos) {
          cosLeases += monthlyLease;
        } else {
          exLease += monthlyLease;
        }
      } else {
        // BUY OPTION (Cash Capex & Depreciation):
        // Depreciation stops when net value hits zero (max total depreciation = original cost / pValue)
        if (!isPrior && m + 1 === pMonth) {
          assetPurchaseCash += pValue;
        }

        let monthlyDep = 0;
        const baseMonthlyDep = (pValue * (depRate / 100)) / 12;

        if (isPrior) {
          const priorElapsed = (asset.monthsInSystem || 0) + m;
          const priorCumDep = Math.min(pValue, baseMonthlyDep * priorElapsed);
          const remainingNet = Math.max(0, pValue - priorCumDep);
          monthlyDep = Math.min(baseMonthlyDep, remainingNet);
        } else {
          if (m + 1 >= pMonth) {
            const monthsElapsed = (m + 1) - pMonth;
            const priorCumDep = Math.min(pValue, baseMonthlyDep * monthsElapsed);
            const remainingNet = Math.max(0, pValue - priorCumDep);
            monthlyDep = Math.min(baseMonthlyDep, remainingNet);
          }
        }

        if (isCos) {
          cosDepreciation += monthlyDep;
        } else {
          exDepreciation += monthlyDep;
        }
      }
    });

    cosDepreciation = Math.round(cosDepreciation);
    cosLeases = Math.round(cosLeases);
    exDepreciation = Math.round(exDepreciation);
    exLease = Math.round(exLease);
    const depreciation = exDepreciation;

    // Full Cost of Sales
    const cos_fixed = cosEmployment + cosDepreciation + cosLeases + cosOverheads;
    const cos_variable = cosMaterials + cosPackaging;
    const total_cogs = cos_variable + cos_fixed;
    const grossProfit = revenue - total_cogs;
    const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Gross Profit Adjustments & Total Income
    const gpAdjustmentsTotal = gpAdjustmentsCommission + gpAdjustmentsInventory + gpAdjustmentsVariance;
    const remainingGrossProfit = grossProfit - gpAdjustmentsTotal;
    const totalIncome = remainingGrossProfit + otherIncomeTotal;

    // 4. Term Loan PPMT / IPMT Engine
    let termLoanAdvanceMonth = 0;
    let termLoanCapitalRepayment = 0;
    let termLoanInterestPayment = 0;
    let termLoanClosingBalance = 0;

    if (state.funding.termLoans && state.funding.termLoans.length > 0) {
      state.funding.termLoans.forEach((tl) => {
        const metrics = calculateTermLoanMetrics(
          {
            advanceMonth: tl.advanceMonth || 1,
            advanceValue: tl.advanceValue,
            advanceRate: tl.advanceRatePct,
            termYears: tl.termYears,
          },
          m
        );
        if (tl.advanceMonth === m) {
          termLoanAdvanceMonth += tl.advanceValue;
        }
        termLoanCapitalRepayment += metrics.repayment;
        termLoanInterestPayment += metrics.interest;
        termLoanClosingBalance += metrics.balance;
      });
    } else {
      const currentTermLoanRate = (rateOverrides?.interestRatePct?.[mo] ?? state.funding.interestRatePct ?? 10) / 100 / 12;
      termLoanInterestPayment = debtBalance * currentTermLoanRate;
      termLoanCapitalRepayment = debtBalance > 0 ? Math.min(debtBalance, loanPrincipalMonthly) : 0;
      debtBalance = Math.max(0, debtBalance - termLoanCapitalRepayment);
      termLoanClosingBalance = debtBalance;
      if (m === (state.funding.loanStartMonth || 1) && state.funding.bankLoanAmount > 0) {
        termLoanAdvanceMonth = state.funding.bankLoanAmount;
      }
    }

    const loanInterest = termLoanInterestPayment;
    const principalPaid = termLoanCapitalRepayment;
    debtBalance = termLoanClosingBalance;

    const ex_fixed = opexEmployment + exDepreciation + exLease + exOverheads;
    const ex_total = exVariable + ex_fixed;
    const opex = exVariable + exOverheads;
    const totalOperatingCosts = opexEmployment + opex + exLease;
    const totalExpenses = ex_total;
    const ebitda = grossProfit - (opexEmployment + exOverheads + exVariable + exLease);
    const netOperatingProfit = totalIncome - totalExpenses;

    // 6. VAT Ledger Calculation
    const currentVatRate =
      rateOverrides?.vatRate?.[mo] ?? setupVatItem?.monthlyValues?.[mo] ?? setupVatItem?.baseRate ?? vatRate;
    const vatMetrics = calculateVatMonth(
      mo,
      currentVatRate,
      revenue,
      assetPurchaseCash,
      total_cogs,
      ex_total,
      cosEmployment,
      opexEmployment,
      cosDepreciation,
      exDepreciation,
      prevVatClosingBalance
    );
    prevVatClosingBalance = vatMetrics.vatClosingBalance;

    const vat_rec_change = (vatMetrics.vatReceivable ?? 0) - prevVatReceivable;
    const vat_pay_change = (vatMetrics.vatPayable ?? 0) - prevVatPayable;
    prevVatReceivable = vatMetrics.vatReceivable ?? 0;
    prevVatPayable = vatMetrics.vatPayable ?? 0;

    // Working Capital Days & Values
    const invDays = state.funding.inventoryDaysMonthly?.[mo] ?? state.funding.inventoryDays ?? 0;
    const recDays = state.funding.debtorDaysMonthly?.[mo] ?? state.funding.debtorDays ?? 0;
    const payDays = state.funding.creditorDaysMonthly?.[mo] ?? state.funding.creditorDays ?? 0;

    const curInventory = Math.round((total_cogs / 30) * invDays);
    const curReceivables = Math.round((revenue * (1 + currentVatRate / 100) / 30) * recDays);
    const curPayables = Math.round((total_cogs * (1 + currentVatRate / 100) / 30) * payDays);

    const deltaInventory = curInventory - prevInventory;
    const deltaReceivables = curReceivables - prevReceivables;
    const deltaPayables = curPayables - prevPayables;
    prevInventory = curInventory;
    prevReceivables = curReceivables;
    prevPayables = curPayables;

    // Other Assets (deposits, floats, petty cash)
    const curDeposits = state.funding.depositsMonthly?.[mo] ?? state.funding.depositsBase ?? 0;
    const curFloats = state.funding.floatsMonthly?.[mo] ?? state.funding.floatsBase ?? 0;
    const curPettyCash = state.funding.pettyCashMonthly?.[mo] ?? state.funding.pettyCashBase ?? 0;
    const curOtherAssets = curDeposits + curFloats + curPettyCash;
    const deltaOtherAssets = curOtherAssets - prevOtherAssets;
    prevOtherAssets = curOtherAssets;

    // Share Capital
    const addShares = state.funding.additionalSharesMonthly?.[mo] ?? 0;
    const addPrice = state.funding.additionalSharePriceMonthly?.[mo] ?? 0;
    const shareCapAdditionalRaised = addShares * addPrice;
    cumAdditionalShares += addShares;
    cumSharePremium += shareCapAdditionalRaised;
    const currentSharesInIssue = initialSharesCount + cumAdditionalShares;
    const shareholdersCapital = ordinaryShareCapital - cumSharePremium; // Credit balance, negative

    // Equity Loan
    const addEqLoan = state.funding.equityLoanAdditionalMonthly?.[mo] ?? 0;
    const repayEqLoan = state.funding.equityLoanRepaymentsMonthly?.[mo] ?? 0;
    cumEquityLoanAdditional += addEqLoan;
    cumEquityLoanRepayments += repayEqLoan;
    const currentEquityLoanClosing = equityLoanOpening - cumEquityLoanAdditional + cumEquityLoanRepayments;

    // Dividends
    const divPerShare = state.funding.dividendsPerShareMonthly?.[mo] ?? state.funding.dividendsPerShareBase ?? 0;
    const dividends = Math.round(divPerShare * currentSharesInIssue);

    const prevMonthClosing =
      mo === 0
        ? initialOpeningCash
        : (results[mo - 1].bank_balance_closing ?? results[mo - 1].closingCash);
    const prevMonthOpening =
      mo === 0
        ? 0
        : (results[mo - 1].bank_balance_opening ?? (mo === 1 ? initialOpeningCash : 0));

    const isPositive = prevMonthClosing >= 0;
    const currentPositiveBaseRate =
      rateOverrides?.positiveBaseRate?.[mo] ?? setupPosItem?.monthlyValues?.[mo] ?? setupPosItem?.baseRate ?? positiveBaseRate;
    const currentNegativeBaseRate =
      rateOverrides?.negativeBaseRate?.[mo] ?? setupNegItem?.monthlyValues?.[mo] ?? setupNegItem?.baseRate ?? negativeBaseRate;
    const applicable_rate = isPositive ? currentPositiveBaseRate / 100 : currentNegativeBaseRate / 100;

    const balanceFactor = (prevMonthClosing - prevMonthOpening) / 2;
    const interest_other = Math.round(balanceFactor * (applicable_rate / 12));

    const interestReceived = interest_other > 0 ? interest_other : 0; // COA 1-3-1-1
    const interestOverdraft = interest_other < 0 ? Math.abs(interest_other) : 0; // COA 2-7-1-2
    const netFinanceCharges = Math.round(loanInterest + interestOverdraft - interestReceived);

    // 8. Net Profit Before Tax (NPBT)
    const net_profit_before_tax = Math.round(netOperatingProfit - netFinanceCharges);

    // 9. Corporate Tax & Balance Sheet Ledger Engine (tax calculation.PNG & tax payment cycle.PNG)
    if (mo % 12 === 0) {
      taxationCumulativePrev = 0;
    }

    let cumulative_profit_this_year = net_profit_before_tax;
    for (let k = current_year_start_mo; k < mo; k++) {
      cumulative_profit_this_year += results[k]?.netProfitBeforeTax || 0;
    }

    // Deduct assessed tax loss carried forward from previous years
    const taxable_profit_cumulative = cumulative_profit_this_year - taxCarriedForwardLoss;

    const currentTaxRate =
      rateOverrides?.taxRate?.[mo] ?? setupTaxItem?.monthlyValues?.[mo] ?? setupTaxItem?.baseRate ?? taxRate;
    let taxation_cumulative = 0;
    if (taxable_profit_cumulative > 0) {
      taxation_cumulative = -Math.round(taxable_profit_cumulative * (currentTaxRate / 100));
    }

    // Monthly tax provision (signed negative for expense, positive for relief on losses)
    const taxation_month = mo % 12 === 0 ? taxation_cumulative : taxation_cumulative - taxationCumulativePrev;
    taxationCumulativePrev = taxation_cumulative;
    const taxation_monthly = -taxation_month; // Standard positive deduction for income statement

    // PAT & Retained Earnings
    const taxed_profits = net_profit_before_tax + taxation_month;
    const retained_earnings = taxed_profits - dividends;
    totalCumulativeRetainedEarnings += retained_earnings;

    // Tax on Balance Sheet Ledger
    const tax_opening_balance = mo === 0 ? 0 : (results[mo - 1].taxLiability || 0);
    const tax_closing_balance = tax_opening_balance + taxation_month;

    // Tax Payment Rule
    let tax_payment = 0;
    if (mo > 0 && mo % taxPaymentCycleMonths === 0) {
      const prevPeriodLiability = results[mo - 1].taxLiability || 0;
      if (prevPeriodLiability < 0) {
        tax_payment = Math.abs(prevPeriodLiability);
      }
    }

    const tax_closing_liability = tax_closing_balance + tax_payment;

    // Update carried forward loss at the end of each financial year
    if ((mo + 1) % 12 === 0) {
      if (taxable_profit_cumulative < 0) {
        taxCarriedForwardLoss = Math.abs(taxable_profit_cumulative);
      } else {
        taxCarriedForwardLoss = 0;
      }
    }

    // 10. Cash Flow Engine (matching exact user formula and cash flow.PNG)
    // • cash from operations
    const cash_from_operations = Math.round(netOperatingProfit - netFinanceCharges - taxation_monthly - dividends);

    // • add change in working capital
    const taxation_wc = taxation_monthly - tax_payment;
    const change_in_working_capital = Math.round(
      -deltaInventory - deltaReceivables - deltaOtherAssets - vat_rec_change + deltaPayables + vat_pay_change + taxation_wc
    );

    // • add change in capital assets
    const capex = assetPurchaseCash;
    const dep_writeback = cosDepreciation + exDepreciation;
    const application_to_capital_assets = Math.round(dep_writeback - capex);

    // • add change in funding
    const share_capital_change = shareCapAdditionalRaised;
    const equity_loan_change = addEqLoan - repayEqLoan;
    const loan_change = termLoanAdvanceMonth - principalPaid;
    const change_in_funding = Math.round(share_capital_change + equity_loan_change + loan_change);

    // Cashflow & Closing Bank Balance:
    // Closing bank balance = opening bank balance + add cashflow
    const cashflow = cash_from_operations + change_in_working_capital + application_to_capital_assets + change_in_funding;
    cash = closing_bank_pre + cashflow;

    // Per Share & Balance Sheet valuation metrics
    const eps = currentSharesInIssue > 0 ? Number((taxed_profits / currentSharesInIssue).toFixed(2)) : 0;
    const bank_balance_per_share = currentSharesInIssue > 0 ? Number((cash / currentSharesInIssue).toFixed(2)) : 0;
    const totalEquity = Math.abs(shareholdersCapital) + Math.abs(currentEquityLoanClosing) + totalCumulativeRetainedEarnings;
    const debt_equity_ratio = totalEquity !== 0 ? Number(((debtBalance - cash) / totalEquity).toFixed(2)) : 0;

    results.push({
      month: m,
      unitSales: Math.round(unitSales),
      revenue: Math.round(revenue),
      cogs: Math.round(total_cogs),
      totalCos: Math.round(total_cogs),
      cosVariable: Math.round(cos_variable),
      cosFixed: Math.round(cos_fixed),
      grossProfit: Math.round(grossProfit),
      grossMarginPct: Math.round(grossMarginPct * 10) / 10,
      employmentExpenses: Math.round(opexEmployment),
      operatingExpenses: Math.round(opex),
      totalExpenses: Math.round(totalExpenses),
      depreciation: Math.round(depreciation),
      ebitda: Math.round(ebitda),
      interestExpense: Math.round(loanInterest),
      // Detailed Trading Account Breakdown
      cosMaterials,
      cosPackaging,
      cosEmployment: Math.round(cosEmployment),
      cosDepreciation,
      cosLeases,
      cosOverheads,
      gpAdjustmentsVariance,
      gpAdjustmentsCommission,
      gpAdjustmentsInventory,
      otherIncomeTotal: Math.round(otherIncomeTotal),
      totalIncome: Math.round(totalIncome),
      opexEmployment: Math.round(opexEmployment),
      opexMarketing: Math.round(exVariable),
      opexAdminDepreciation: Math.round(depreciation),
      opexStandard: Math.round(exOverheads),
      exVariable: Math.round(exVariable),
      exOverheads: Math.round(exOverheads),
      exDepreciation: Math.round(exDepreciation),
      exLease: Math.round(exLease),
      exFixed: Math.round(ex_fixed),
      exTotal: Math.round(ex_total),
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
      avgMonthlyBalance: Math.round(balanceFactor),
      applicableRatePct: Math.round(applicable_rate * 1000) / 10,
      interestOther: Math.round(interest_other),
      interestReceived: Math.round(interestReceived),
      interestOverdraft: Math.round(interestOverdraft),
      netProfitBeforeTax: net_profit_before_tax,
      netProfit: taxed_profits, // PAT
      closingCash: Math.round(cash),
      bank_balance_opening: Math.round(closing_bank_pre),
      bank_balance_closing: Math.round(cash),
      cashflow: Math.round(cashflow),
      cash_from_operations: Math.round(cash_from_operations),
      change_in_working_capital: Math.round(change_in_working_capital),
      application_to_capital_assets: Math.round(application_to_capital_assets),
      change_in_funding: Math.round(change_in_funding),
      debtBalance: Math.round(debtBalance),
      term_loan_balance: Math.round(debtBalance),
      // VAT metrics
      vatRate: currentVatRate,
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
      vat_cos: -Math.round(total_cogs),
      vat_opex: -Math.round(ex_total),
      vat_addback_employment: Math.round(vatMetrics.vatAddbackEmployment),
      vat_addback_depreciation: Math.round(vatMetrics.vatAddbackDepreciation),
      vatable_amount: Math.round(vatMetrics.vatableAmount),
      vat_calc_value: Math.round(vatMetrics.vatCalcValue),
      vat_opening_balance: Math.round(vatMetrics.vatOpeningBalance),
      vat_account_balance: Math.round(vatMetrics.vatCalcValue),
      vat_settlement: Math.round(vatMetrics.vatSettlement),
      vat_closing_balance: Math.round(vatMetrics.vatClosingBalance),
      vat_receivable: Math.round(vatMetrics.vatReceivable),
      vat_payable: Math.round(vatMetrics.vatPayable),
      // Corporate Tax metrics
      taxRateUsed: currentTaxRate,
      cumulativeProfitThisYear: Math.round(cumulative_profit_this_year),
      taxCarriedForwardLoss: Math.round(taxCarriedForwardLoss),
      taxableProfitCumulative: Math.round(taxable_profit_cumulative),
      taxationCumulative: Math.round(taxation_cumulative),
      taxationMonth: Math.round(taxation_month),
      taxationMonthly: Math.round(taxation_monthly),
      taxedProfits: Math.round(taxed_profits),
      dividends: Math.round(dividends),
      retainedEarnings: Math.round(retained_earnings),
      cumulativeRetainedEarnings: Math.round(totalCumulativeRetainedEarnings),
      taxOpeningBalance: Math.round(tax_opening_balance),
      taxClosingBalance: Math.round(tax_closing_balance),
      taxPayment: Math.round(tax_payment),
      taxLiability: Math.round(tax_closing_liability),
      // Working Capital Velocity & Other Assets
      inventory: curInventory,
      inventoryDaysUsed: invDays,
      accounts_receivable: curReceivables,
      debtorDaysUsed: recDays,
      accounts_payable: curPayables,
      creditorDaysUsed: payDays,
      other_assets: curOtherAssets,
      deposits: curDeposits,
      floats: curFloats,
      pettyCash: curPettyCash,
      // Term Loans PPMT / IPMT
      term_loan_advance: termLoanAdvanceMonth,
      term_loan_capital_repayment: -termLoanCapitalRepayment,
      term_loan_interest_payment: -termLoanInterestPayment,
      // Share Capital & Equity Loans
      shares_in_issue: currentSharesInIssue,
      ordinary_share_capital: ordinaryShareCapital,
      share_capital_additional_raised: shareCapAdditionalRaised,
      share_premium: -cumSharePremium,
      shareholders_capital: shareholdersCapital,
      equity_loan_opening: equityLoanOpening,
      equity_loan_additional: addEqLoan,
      equity_loan_repayments: repayEqLoan,
      equity_loan_closing: currentEquityLoanClosing,
      // Dividends & Valuation Per Share Metrics
      dividends_per_share: divPerShare,
      eps: eps,
      bank_balance_per_share: bank_balance_per_share,
      debt_equity_ratio: debt_equity_ratio,
    });
  }

  return results;
}

/**
 * V1 Simulation Engine alias
 */
export const runMonthlySimulation = calculateFinancialModelProjections;
export const calculateMonthlyProjections = calculateFinancialModelProjections;
