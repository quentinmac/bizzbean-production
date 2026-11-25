import { calculateFinancialModelProjections, MonthlyFinancialSummary } from '../bizzmodel/utils/revenueCalc';
import { calculate60MonthWorkingCalendar } from '../bizzmodel/utils/calendarCalc';
import { BudgetBranch, BudgetRegion, BudgetStructureMode, ConsolidationLevel } from './types';

/**
 * Standardized 12-month financial period row for bizzbudget.
 * Covers Trading Account, Income Statement, Balance Sheet (including Investment 3-2-1-29
 * positioned immediately after Fixed Assets & formula-driven Branch Equity Loan), and Cash Flow.
 */
export interface BudgetPeriodRow {
  monthIndex: number; // 0..11 (or -1 for Full Year Total / Year-End)
  label: string;
  isTotal?: boolean;

  // Trading Account
  unitSales: number;
  revenue: number;
  cos_variable: number;
  cos_employment: number;
  cos_depreciation: number;
  cos_lease: number;
  cos_overheads: number;
  cos_fixed: number;
  total_cos: number;
  gross_profit: number;
  sales_commission: number;
  inventory_adjustments: number;
  manufacturing_variance: number;
  gp_adjustments: number;
  remaining_gp: number;
  other_inc: number;
  total_income: number;
  ex_variable: number;
  ex_employment: number;
  ex_depreciation: number;
  ex_lease: number;
  ex_overheads: number;
  ex_fixed: number;
  ex_total: number;
  net_operating_profit: number;

  // Income Statement
  interest_other: number;
  interest_tl: number;
  interest_total: number;
  net_profit_before_tax: number;
  taxation: number;
  taxed_profits: number;
  dividends: number;
  retained_earnings: number;

  // Balance Sheet — Assets (Positive / Debit)
  fixed_assets_net: number;
  investment_32129: number; // COA 3-2-1-29 positioned directly after Fixed Assets
  intercompany_investment_32129: number; // Portion representing 100% ownership / equity loans to branches
  inventory: number;
  accounts_receivable: number;
  other_assets: number;
  vat_receivable: number;
  current_assets: number;
  total_assets: number;

  // Balance Sheet — Non-Interest Bearing Debt (Negative / Credit)
  accounts_payable: number;
  vat_payable: number;
  taxation_payable: number;
  non_interest_bearing_debt: number;
  net_operating_assets: number;

  // Balance Sheet — Financed By (Credits stored as negative, Bank positive when cash)
  shares_in_issue: number;
  shareholders_capital: number; // Negative credit balance (0 for operating branches in multi-branch mode)
  equity_loan: number;          // Negative credit for branches; +Debit elimination on group consolidation
  retained_earnings_prior: number;   // Negative credit when profit
  retained_earnings_current: number; // Negative credit when profit
  shareholders_equity: number;
  bank_balance_closing: number;
  term_loan_balance: number; // Negative credit balance
  interest_bearing_debt: number;
  capital_employed: number;

  // Cash Flow Statement
  bank_balance_opening: number;
  cash_from_operations: number;
  change_in_working_capital: number;
  application_to_capital_assets: number;
  change_in_investment: number;
  share_capital_change: number;
  equity_loan_change: number;
  loan_change: number;
  change_in_funding: number;
  cashflow: number;

  // Consolidation audit metadata
  intercompany_branch_equity_loans_credit: number; // Negative aggregate of branch equity loans
  intercompany_holding_investment_debit: number;   // Positive matching debit on holding company
}

export interface BranchFinancialBundle {
  branch: BudgetBranch;
  months: BudgetPeriodRow[];
  yearEnd: BudgetPeriodRow;
}

export interface ConsolidatedFinancialBundle {
  title: string;
  subtitle: string;
  level: ConsolidationLevel;
  entityCount: number;
  months: BudgetPeriodRow[];
  yearEnd: BudgetPeriodRow;
  branchSummaries: Array<{
    branchId: string;
    branchName: string;
    branchCode: string;
    regionName: string;
    isHoldingCompany: boolean;
    yearEnd: BudgetPeriodRow;
  }>;
  eliminationsYearEnd: {
    investment32129Elimination: number;
    equityLoanDebitElimination: number;
    branchEquityLoansAggregateCredit: number;
    netEliminationCheck: number;
  };
}

/**
 * Compute Fixed Assets Net Book Value for each of the 12 months of a branch state.
 */
function compute12MonthFixedAssetNbv(branch: BudgetBranch): number[] {
  const assets = branch.state.fixedAssets || [];
  const nbvs: number[] = [];
  for (let mo = 0; mo < 12; mo++) {
    let netVal = 0;
    assets.forEach((a: any) => {
      if (a.financeOption === 'lease') return;
      const pVal = a.purchaseValue ?? ((a.unitCost || a.purchaseCost || 0) * (a.quantity || 1));
      const depRate = a.depreciationRate || 20;
      const monthlyDep = (pVal * (depRate / 100)) / 12;
      const isPrior = a.purchaseTiming === 'prior';
      const pMonth = a.purchaseMonth || 1;
      if (isPrior) {
        const elapsed = (a.monthsInSystem || 0) + (mo + 1);
        const cumDep = Math.min(pVal, monthlyDep * elapsed);
        netVal += Math.max(0, pVal - cumDep);
      } else if (mo + 1 >= pMonth) {
        const elapsed = (mo + 1) - pMonth + 1;
        const cumDep = Math.min(pVal, monthlyDep * elapsed);
        netVal += Math.max(0, pVal - cumDep);
      }
    });
    nbvs.push(Math.round(netVal));
  }
  return nbvs;
}

/**
 * Convert raw 12-month projection array into standardized BudgetPeriodRow[]
 * applying bizzbudget rules:
 *  - Investment (3-2-1-29) positioned immediately after Fixed Assets
 *  - Operating branch (multi-branch): 0 Share Capital; Equity Loan = -(% of Total Assets)
 *  - Holding Company (multi-branch): owns 100% of branches -> Investment (3-2-1-29) includes
 *    aggregate branch equity loans (positive debit), matching aggregate branch credit balances
 */
function build12MonthRows(
  branch: BudgetBranch,
  raw12: MonthlyFinancialSummary[],
  structureMode: BudgetStructureMode,
  isPriorYearForecast: boolean,
  intercompanyDebitByMonth: number[] // Only non-zero for Holding Company in multi-branch mode
): BudgetPeriodRow[] {
  const calendar = calculate60MonthWorkingCalendar(branch.state.businessDetails);
  const fixedAssetNbvs = compute12MonthFixedAssetNbv(branch);

  const isMultiBranchOperating = structureMode === 'multi-branch' && !branch.isHoldingCompany;
  const isMultiBranchHolding = structureMode === 'multi-branch' && branch.isHoldingCompany;
  const directInv = Math.max(0, Math.round(branch.directInvestmentAmount || 0));
  const eqLoanPct = Math.max(0, Math.min(100, Number(branch.equityLoanPctOfTotalAssets ?? 40)));

  const priorRetainedBase = isPriorYearForecast
    ? Math.round(branch.state.hiLevelActuals?.bsOpeningRetainedEarnings || 0)
    : Math.round(branch.state.hiLevelActuals?.bsOpeningRetainedEarnings || 0);

  let cumulativeRetainedThisYear = 0;
  let prevEquityLoanAbs = 0;
  let prevInvestmentTotal = directInv;
  let runningBank = raw12[0]?.bank_balance_opening ?? 0;

  return raw12.slice(0, 12).map((p, mo) => {
    const label = calendar[mo]?.monthLabel || `Month ${mo + 1}`;

    // Trading Account
    const unitSales = Math.round(p.unitSales || 0);
    const revenue = Math.round(p.revenue || 0);
    const cos_variable = Math.round(p.cosVariable ?? p.cosMaterials ?? 0);
    const cos_employment = Math.round(p.cosEmployment || 0);
    const cos_depreciation = Math.round(p.cosDepreciation || 0);
    const cos_lease = Math.round(p.cosLeases || 0);
    const cos_overheads = Math.round(p.cosOverheads || 0);
    const cos_fixed = cos_employment + cos_depreciation + cos_lease + cos_overheads;
    const total_cos = cos_variable + cos_fixed;
    const gross_profit = revenue - total_cos;

    const sales_commission = Math.round(p.gpAdjustmentsCommission || 0);
    const inventory_adjustments = Math.round(p.gpAdjustmentsInventory || 0);
    const manufacturing_variance = Math.round(p.gpAdjustmentsVariance || 0);
    const gp_adjustments = sales_commission + inventory_adjustments + manufacturing_variance;
    const remaining_gp = gross_profit - gp_adjustments;
    const other_inc = Math.round(p.otherIncomeTotal || 0);
    const total_income = remaining_gp + other_inc;

    const ex_variable = Math.round(p.exVariable || 0);
    const ex_employment = Math.round(p.opexEmployment || p.employmentExpenses || 0);
    const ex_depreciation = Math.round(p.exDepreciation ?? p.depreciation ?? 0);
    const ex_lease = Math.round(p.exLease || 0);
    const ex_overheads = Math.round(p.exOverheads ?? p.opexStandard ?? 0);
    const ex_fixed = ex_employment + ex_depreciation + ex_lease + ex_overheads;
    const ex_total = ex_variable + ex_fixed;
    const net_operating_profit = total_income - ex_total;

    // Income Statement
    const interest_other = Math.round(p.interestOther ?? (p.interestReceived - p.interestOverdraft));
    const interest_tl = Math.round(p.interestTermLoan ?? p.interestExpense ?? 0);
    const interest_total = Math.round(p.netFinanceCharges ?? (interest_tl - interest_other));
    const net_profit_before_tax = Math.round(p.netProfitBeforeTax ?? (net_operating_profit - interest_total));
    const taxation = Math.round(p.taxationMonthly ?? p.taxationCit ?? 0);
    const taxed_profits = net_profit_before_tax - taxation;
    // Operating branches in multi-branch mode have no shares -> 0 dividends
    const dividends = isMultiBranchOperating ? 0 : Math.round(p.dividends ?? p.dividendsDeclared ?? 0);
    const retained_earnings = taxed_profits - dividends;
    cumulativeRetainedThisYear += retained_earnings;

    // Balance Sheet — Assets
    const fixed_assets_net = fixedAssetNbvs[mo] || 0;
    const intercompanyInv = isMultiBranchHolding ? Math.round(intercompanyDebitByMonth[mo] || 0) : 0;
    const investment_32129 = directInv + intercompanyInv;
    const inventory = Math.round(p.inventory || 0);
    const accounts_receivable = Math.round(p.accounts_receivable || 0);
    const other_assets = Math.round(p.other_assets || 0);
    const vat_receivable = Math.round(p.vatReceivable || 0);
    const current_assets = inventory + accounts_receivable + other_assets + vat_receivable;
    const total_assets = fixed_assets_net + investment_32129 + current_assets;

    // Balance Sheet — NIBD (Negative / Credit)
    const accounts_payable = -Math.abs(Math.round(p.accounts_payable || 0));
    const vat_payable = -Math.abs(Math.round(p.vatPayable || 0));
    const taxation_payable = -Math.abs(Math.round(Math.abs(p.taxLiability || 0)));
    const non_interest_bearing_debt = accounts_payable + vat_payable + taxation_payable;
    const net_operating_assets = total_assets + non_interest_bearing_debt;

    // Balance Sheet — Financed By (Credits negative)
    const shares_in_issue = isMultiBranchOperating ? 0 : (p.shares_in_issue || 0);
    const shareholders_capital = isMultiBranchOperating
      ? 0
      : -Math.abs(Math.round(Math.abs(p.shareholders_capital || 0)));

    // Equity Loan rule:
    // - Multi-branch operating branch: formula driven = -(% of Total Assets)
    // - Holding company: 0 own external equity loan (or user-defined opening equity loan); intercompany funding sits on Investment 3-2-1-29
    // - Standalone branch: formula driven if equityLoanPctOfTotalAssets > 0, else funding engine closing balance
    let equity_loan = 0;
    if (isMultiBranchOperating) {
      equity_loan = -Math.round(total_assets * (eqLoanPct / 100));
    } else if (isMultiBranchHolding) {
      equity_loan = -Math.abs(Math.round(Math.abs(p.equity_loan_closing || 0)));
    } else {
      // Standalone mode: support formula-driven % of total assets when configured, otherwise standard funding value
      equity_loan =
        eqLoanPct > 0
          ? -Math.round(total_assets * (eqLoanPct / 100))
          : -Math.abs(Math.round(Math.abs(p.equity_loan_closing || 0)));
    }

    const retained_earnings_prior = -priorRetainedBase;
    const retained_earnings_current = -cumulativeRetainedThisYear;
    const shareholders_equity =
      shareholders_capital + equity_loan + retained_earnings_prior + retained_earnings_current;

    const term_loan_balance = -Math.abs(Math.round(p.term_loan_balance || 0));
    const capital_employed = -net_operating_assets;
    // By Balance Sheet identity: Capital Employed = Shareholders' Equity + Interest Bearing Debt
    // Interest Bearing Debt = Term Loan (negative) + Bank Balance (positive if cash, negative if overdraft)
    // Wait: in V1 sign convention (ReportsStep.tsx):
    //   Capital Employed = -NOA
    //   IBD = Capital Employed - Shareholders' Equity
    //   And Bank Balance = -(IBD - Term Loan) = -IBD + Term Loan  (Wait: let's verify sign!)
    // Let's check exact accounting identity:
    //   Assets (NOA + Cash_if_pos) = Equity_abs + TermLoan_abs + Overdraft_if_neg
    //   => Cash_net (signed: +cash / -overdraft) = Equity_abs + TermLoan_abs - NOA
    //   Since shareholders_equity = -Equity_abs, term_loan_balance = -TermLoan_abs, capital_employed = -NOA:
    //   Cash_net = -shareholders_equity - term_loan_balance + capital_employed
    //   And in V1 Balance Sheet display:
    //     IBD = capital_employed - shareholders_equity = -(NOA - Equity_abs) = -(TermLoan_abs - Cash_net) = term_loan_balance + bank_balance_display
    //   Wait: check that!
    //     If NOA = 1000, Equity_abs = 600, TermLoan_abs = 500 -> Cash_net = 600 + 500 - 1000 = +100 (positive cash asset!).
    //     capital_employed = -1000
    //     shareholders_equity = -600
    //     IBD = -1000 - (-600) = -400 (net interest-bearing debt of 400!)
    //     term_loan_balance = -500
    //     bank_balance_closing = +100
    //     CHECK: term_loan_balance (-500) + bank_balance_closing (+100) = -400 === IBD!
    //     AND shareholders_equity (-600) + IBD (-400) = -1000 === capital_employed!
    //   EXACT TO THE CENT!!
    const interest_bearing_debt = capital_employed - shareholders_equity;
    const bank_balance_closing = interest_bearing_debt - term_loan_balance;

    // Cash Flow Reconciliation for this month
    const curEquityLoanAbs = Math.abs(equity_loan);
    const equity_loan_change = mo === 0 ? curEquityLoanAbs : curEquityLoanAbs - prevEquityLoanAbs;
    prevEquityLoanAbs = curEquityLoanAbs;

    const change_in_investment = -(investment_32129 - (mo === 0 ? 0 : prevInvestmentTotal));
    prevInvestmentTotal = investment_32129;

    const cash_from_operations = Math.round(net_operating_profit - interest_total - taxation - dividends);
    const change_in_working_capital = Math.round(p.change_in_working_capital || 0);
    const application_to_capital_assets = Math.round(p.application_to_capital_assets || 0);
    const share_capital_change = isMultiBranchOperating ? 0 : Math.round(p.share_capital_additional_raised || 0);
    const loan_change = Math.round((p.term_loan_advance || 0) + (p.term_loan_capital_repayment || 0));
    const change_in_funding = share_capital_change + equity_loan_change + loan_change;

    const bank_balance_opening = mo === 0 ? Math.round(bank_balance_closing - (cash_from_operations + change_in_working_capital + application_to_capital_assets + change_in_investment + change_in_funding)) : runningBank;
    const cashflow = bank_balance_closing - bank_balance_opening;
    runningBank = bank_balance_closing;

    return {
      monthIndex: mo,
      label,
      unitSales,
      revenue,
      cos_variable,
      cos_employment,
      cos_depreciation,
      cos_lease,
      cos_overheads,
      cos_fixed,
      total_cos,
      gross_profit,
      sales_commission,
      inventory_adjustments,
      manufacturing_variance,
      gp_adjustments,
      remaining_gp,
      other_inc,
      total_income,
      ex_variable,
      ex_employment,
      ex_depreciation,
      ex_lease,
      ex_overheads,
      ex_fixed,
      ex_total,
      net_operating_profit,
      interest_other,
      interest_tl,
      interest_total,
      net_profit_before_tax,
      taxation,
      taxed_profits,
      dividends,
      retained_earnings,
      fixed_assets_net,
      investment_32129,
      intercompany_investment_32129: intercompanyInv,
      inventory,
      accounts_receivable,
      other_assets,
      vat_receivable,
      current_assets,
      total_assets,
      accounts_payable,
      vat_payable,
      taxation_payable,
      non_interest_bearing_debt,
      net_operating_assets,
      shares_in_issue,
      shareholders_capital,
      equity_loan,
      retained_earnings_prior,
      retained_earnings_current,
      shareholders_equity,
      bank_balance_closing,
      term_loan_balance,
      interest_bearing_debt,
      capital_employed,
      bank_balance_opening,
      cash_from_operations,
      change_in_working_capital,
      application_to_capital_assets,
      change_in_investment,
      share_capital_change,
      equity_loan_change,
      loan_change,
      change_in_funding,
      cashflow,
      intercompany_branch_equity_loans_credit: isMultiBranchOperating ? equity_loan : 0,
      intercompany_holding_investment_debit: intercompanyInv,
    };
  });
}

/**
 * Roll up 12 monthly rows into a single Full-Year / Year-End summary row
 * (Flow accounts = sum of 12 months; Balance Sheet stock accounts = Month 12 closing;
 * Opening Bank = Month 1 opening; Closing Bank = Month 12 closing).
 */
export function summarize12MonthsToYearEnd(months: BudgetPeriodRow[], label = 'Full Year'): BudgetPeriodRow {
  const sum = (fn: (m: BudgetPeriodRow) => number) => months.reduce((acc, m) => acc + fn(m), 0);
  const first = months[0];
  const last = months[months.length - 1];

  return {
    monthIndex: -1,
    label,
    isTotal: true,
    unitSales: sum((m) => m.unitSales),
    revenue: sum((m) => m.revenue),
    cos_variable: sum((m) => m.cos_variable),
    cos_employment: sum((m) => m.cos_employment),
    cos_depreciation: sum((m) => m.cos_depreciation),
    cos_lease: sum((m) => m.cos_lease),
    cos_overheads: sum((m) => m.cos_overheads),
    cos_fixed: sum((m) => m.cos_fixed),
    total_cos: sum((m) => m.total_cos),
    gross_profit: sum((m) => m.gross_profit),
    sales_commission: sum((m) => m.sales_commission),
    inventory_adjustments: sum((m) => m.inventory_adjustments),
    manufacturing_variance: sum((m) => m.manufacturing_variance),
    gp_adjustments: sum((m) => m.gp_adjustments),
    remaining_gp: sum((m) => m.remaining_gp),
    other_inc: sum((m) => m.other_inc),
    total_income: sum((m) => m.total_income),
    ex_variable: sum((m) => m.ex_variable),
    ex_employment: sum((m) => m.ex_employment),
    ex_depreciation: sum((m) => m.ex_depreciation),
    ex_lease: sum((m) => m.ex_lease),
    ex_overheads: sum((m) => m.ex_overheads),
    ex_fixed: sum((m) => m.ex_fixed),
    ex_total: sum((m) => m.ex_total),
    net_operating_profit: sum((m) => m.net_operating_profit),
    interest_other: sum((m) => m.interest_other),
    interest_tl: sum((m) => m.interest_tl),
    interest_total: sum((m) => m.interest_total),
    net_profit_before_tax: sum((m) => m.net_profit_before_tax),
    taxation: sum((m) => m.taxation),
    taxed_profits: sum((m) => m.taxed_profits),
    dividends: sum((m) => m.dividends),
    retained_earnings: sum((m) => m.retained_earnings),

    // Balance Sheet Year-End (Month 12 snapshot)
    fixed_assets_net: last?.fixed_assets_net ?? 0,
    investment_32129: last?.investment_32129 ?? 0,
    intercompany_investment_32129: last?.intercompany_investment_32129 ?? 0,
    inventory: last?.inventory ?? 0,
    accounts_receivable: last?.accounts_receivable ?? 0,
    other_assets: last?.other_assets ?? 0,
    vat_receivable: last?.vat_receivable ?? 0,
    current_assets: last?.current_assets ?? 0,
    total_assets: last?.total_assets ?? 0,
    accounts_payable: last?.accounts_payable ?? 0,
    vat_payable: last?.vat_payable ?? 0,
    taxation_payable: last?.taxation_payable ?? 0,
    non_interest_bearing_debt: last?.non_interest_bearing_debt ?? 0,
    net_operating_assets: last?.net_operating_assets ?? 0,
    shares_in_issue: last?.shares_in_issue ?? 0,
    shareholders_capital: last?.shareholders_capital ?? 0,
    equity_loan: last?.equity_loan ?? 0,
    retained_earnings_prior: last?.retained_earnings_prior ?? 0,
    retained_earnings_current: last?.retained_earnings_current ?? 0,
    shareholders_equity: last?.shareholders_equity ?? 0,
    bank_balance_closing: last?.bank_balance_closing ?? 0,
    term_loan_balance: last?.term_loan_balance ?? 0,
    interest_bearing_debt: last?.interest_bearing_debt ?? 0,
    capital_employed: last?.capital_employed ?? 0,

    // Cash Flow Full Year
    bank_balance_opening: first?.bank_balance_opening ?? 0,
    cash_from_operations: sum((m) => m.cash_from_operations),
    change_in_working_capital: sum((m) => m.change_in_working_capital),
    application_to_capital_assets: sum((m) => m.application_to_capital_assets),
    change_in_investment: sum((m) => m.change_in_investment),
    share_capital_change: sum((m) => m.share_capital_change),
    equity_loan_change: sum((m) => m.equity_loan_change),
    loan_change: sum((m) => m.loan_change),
    change_in_funding: sum((m) => m.change_in_funding),
    cashflow: (last?.bank_balance_closing ?? 0) - (first?.bank_balance_opening ?? 0),

    intercompany_branch_equity_loans_credit: last?.intercompany_branch_equity_loans_credit ?? 0,
    intercompany_holding_investment_debit: last?.intercompany_holding_investment_debit ?? 0,
  };
}

/**
 * Compute all branches' 12-month financial bundles for either:
 *   - 'budget': the 12-month Budget Period (bizzmodel engine)
 *   - 'prior-forecast': the preceding-year Current Year-End Forecast derived from YTD Management Accounts & trading distribution
 */
export function computeAllBranchBundles(
  branches: BudgetBranch[],
  structureMode: BudgetStructureMode,
  seriesKind: 'budget' | 'prior-forecast'
): Map<string, BranchFinancialBundle> {
  const resultMap = new Map<string, BranchFinancialBundle>();
  const isPrior = seriesKind === 'prior-forecast';
  const engineMode = isPrior ? 'rolling-forecast' : 'bizzmodel';
  const zero12 = new Array(12).fill(0);

  // Pass 1: Compute all operating branches first so Holding Company receives aggregate branch equity loans
  const aggregateBranchEqLoansAbsByMonth = new Array(12).fill(0);

  branches.forEach((br) => {
    if (structureMode === 'multi-branch' && br.isHoldingCompany) return;
    const raw = calculateFinancialModelProjections(br.state, 12, undefined, engineMode);
    const months = build12MonthRows(br, raw, structureMode, isPrior, zero12);
    const yearEnd = summarize12MonthsToYearEnd(months, isPrior ? 'Current YE Forecast' : 'Budget FY');
    resultMap.set(br.id, { branch: br, months, yearEnd });

    if (structureMode === 'multi-branch' && !br.isHoldingCompany) {
      months.forEach((m, idx) => {
        aggregateBranchEqLoansAbsByMonth[idx] += Math.abs(m.equity_loan);
      });
    }
  });

  // Pass 2: Compute Holding Company (in multi-branch mode) with 100% ownership investment (3-2-1-29)
  // matching the aggregate credit equity loan balances of all operating branches.
  branches.forEach((br) => {
    if (!(structureMode === 'multi-branch' && br.isHoldingCompany)) return;
    const raw = calculateFinancialModelProjections(br.state, 12, undefined, engineMode);
    const months = build12MonthRows(br, raw, structureMode, isPrior, aggregateBranchEqLoansAbsByMonth);
    const yearEnd = summarize12MonthsToYearEnd(months, isPrior ? 'Current YE Forecast' : 'Budget FY');
    resultMap.set(br.id, { branch: br, months, yearEnd });
  });

  return resultMap;
}

/**
 * Consolidate monthly rows across a set of branches (for Branch, Region, or Group level).
 * At Group level in multi-branch mode:
 *   - Holding Company's intercompany Investment (3-2-1-29) debit eliminates against
 *     Operating Branches' aggregate Equity Loan credit balances (net = 0).
 */
export function buildConsolidatedBundle(
  branches: BudgetBranch[],
  regions: BudgetRegion[],
  bundlesMap: Map<string, BranchFinancialBundle>,
  structureMode: BudgetStructureMode,
  level: ConsolidationLevel,
  selectedBranchId: string,
  selectedRegionId: string,
  groupName: string
): ConsolidatedFinancialBundle {
  const effectiveLevel: ConsolidationLevel = structureMode === 'standalone' ? 'branch' : level;

  let includedBranches: BudgetBranch[] = [];
  let title = '';
  let subtitle = '';

  if (effectiveLevel === 'branch') {
    const target = branches.find((b) => b.id === selectedBranchId) || branches[0];
    includedBranches = target ? [target] : [];
    const reg = regions.find((r) => r.id === target?.regionId);
    title = target ? target.name : 'Branch';
    subtitle = target?.isHoldingCompany
      ? 'Holding Company · 100% Subsidiary Ownership'
      : structureMode === 'standalone'
      ? 'Stand-Alone Branch · 12-Month Budget'
      : `Branch Level · Region: ${reg?.name || 'Unassigned'}`;
  } else if (effectiveLevel === 'region') {
    const reg = regions.find((r) => r.id === selectedRegionId) || regions[0];
    includedBranches = branches.filter((b) => !b.isHoldingCompany && b.regionId === reg?.id);
    title = `${reg?.name || 'Region'} Consolidation`;
    subtitle = `Region Level · ${includedBranches.length} Operating ${includedBranches.length === 1 ? 'Branch' : 'Branches'}`;
  } else {
    includedBranches = branches;
    const opCount = branches.filter((b) => !b.isHoldingCompany).length;
    title = `${groupName || 'Group'} Consolidated`;
    subtitle = `Group Level · Holding Company + ${opCount} Operating ${opCount === 1 ? 'Branch' : 'Branches'} (100% Intercompany Eliminations Applied)`;
  }

  const includedBundles = includedBranches
    .map((b) => bundlesMap.get(b.id))
    .filter((b): b is BranchFinancialBundle => Boolean(b));

  const applyGroupEliminations = effectiveLevel === 'group' && structureMode === 'multi-branch';

  const months: BudgetPeriodRow[] = Array.from({ length: 12 }, (_, mo) => {
    const sampleLabel = includedBundles[0]?.months[mo]?.label || `Month ${mo + 1}`;
    const sumField = (fn: (r: BudgetPeriodRow) => number) =>
      includedBundles.reduce((acc, b) => acc + fn(b.months[mo]), 0);

    const fixed_assets_net = sumField((r) => r.fixed_assets_net);
    const rawInvestment = sumField((r) => r.investment_32129);
    const intercompanyDebit = sumField((r) => r.intercompany_holding_investment_debit);
    const intercompanyBranchCredit = sumField((r) => r.intercompany_branch_equity_loans_credit);

    // On Group Consolidation: eliminate Holding Co's intercompany investment (debit)
    // against Operating Branches' aggregate equity loan balances (credit).
    const investment_32129 = applyGroupEliminations
      ? Math.max(0, rawInvestment - intercompanyDebit)
      : rawInvestment;

    const inventory = sumField((r) => r.inventory);
    const accounts_receivable = sumField((r) => r.accounts_receivable);
    const other_assets = sumField((r) => r.other_assets);
    const vat_receivable = sumField((r) => r.vat_receivable);
    const current_assets = inventory + accounts_receivable + other_assets + vat_receivable;
    const total_assets = fixed_assets_net + investment_32129 + current_assets;

    const accounts_payable = sumField((r) => r.accounts_payable);
    const vat_payable = sumField((r) => r.vat_payable);
    const taxation_payable = sumField((r) => r.taxation_payable);
    const non_interest_bearing_debt = accounts_payable + vat_payable + taxation_payable;
    const net_operating_assets = total_assets + non_interest_bearing_debt;

    const shares_in_issue = sumField((r) => r.shares_in_issue);
    const shareholders_capital = sumField((r) => r.shareholders_capital);
    const rawEquityLoan = sumField((r) => r.equity_loan);
    // On consolidation, the debit balance (+intercompanyDebit) offsets the aggregate credit balances of branches (-intercompanyDebit)
    const equity_loan = applyGroupEliminations
      ? rawEquityLoan + intercompanyDebit
      : rawEquityLoan;

    const retained_earnings_prior = sumField((r) => r.retained_earnings_prior);
    const retained_earnings_current = sumField((r) => r.retained_earnings_current);
    const shareholders_equity =
      shareholders_capital + equity_loan + retained_earnings_prior + retained_earnings_current;

    const term_loan_balance = sumField((r) => r.term_loan_balance);
    const capital_employed = -net_operating_assets;
    const interest_bearing_debt = capital_employed - shareholders_equity;
    const bank_balance_closing = sumField((r) => r.bank_balance_closing);

    const change_in_investment = applyGroupEliminations
      ? sumField((r) => r.change_in_investment) + (mo === 0 ? intercompanyDebit : intercompanyDebit - includedBundles.reduce((acc, b) => acc + b.months[mo - 1].intercompany_holding_investment_debit, 0))
      : sumField((r) => r.change_in_investment);

    const equity_loan_change = applyGroupEliminations
      ? sumField((r) => r.equity_loan_change) - (mo === 0 ? intercompanyDebit : intercompanyDebit - includedBundles.reduce((acc, b) => acc + b.months[mo - 1].intercompany_holding_investment_debit, 0))
      : sumField((r) => r.equity_loan_change);

    const share_capital_change = sumField((r) => r.share_capital_change);
    const loan_change = sumField((r) => r.loan_change);
    const change_in_funding = share_capital_change + equity_loan_change + loan_change;

    return {
      monthIndex: mo,
      label: sampleLabel,
      unitSales: sumField((r) => r.unitSales),
      revenue: sumField((r) => r.revenue),
      cos_variable: sumField((r) => r.cos_variable),
      cos_employment: sumField((r) => r.cos_employment),
      cos_depreciation: sumField((r) => r.cos_depreciation),
      cos_lease: sumField((r) => r.cos_lease),
      cos_overheads: sumField((r) => r.cos_overheads),
      cos_fixed: sumField((r) => r.cos_fixed),
      total_cos: sumField((r) => r.total_cos),
      gross_profit: sumField((r) => r.gross_profit),
      sales_commission: sumField((r) => r.sales_commission),
      inventory_adjustments: sumField((r) => r.inventory_adjustments),
      manufacturing_variance: sumField((r) => r.manufacturing_variance),
      gp_adjustments: sumField((r) => r.gp_adjustments),
      remaining_gp: sumField((r) => r.remaining_gp),
      other_inc: sumField((r) => r.other_inc),
      total_income: sumField((r) => r.total_income),
      ex_variable: sumField((r) => r.ex_variable),
      ex_employment: sumField((r) => r.ex_employment),
      ex_depreciation: sumField((r) => r.ex_depreciation),
      ex_lease: sumField((r) => r.ex_lease),
      ex_overheads: sumField((r) => r.ex_overheads),
      ex_fixed: sumField((r) => r.ex_fixed),
      ex_total: sumField((r) => r.ex_total),
      net_operating_profit: sumField((r) => r.net_operating_profit),
      interest_other: sumField((r) => r.interest_other),
      interest_tl: sumField((r) => r.interest_tl),
      interest_total: sumField((r) => r.interest_total),
      net_profit_before_tax: sumField((r) => r.net_profit_before_tax),
      taxation: sumField((r) => r.taxation),
      taxed_profits: sumField((r) => r.taxed_profits),
      dividends: sumField((r) => r.dividends),
      retained_earnings: sumField((r) => r.retained_earnings),
      fixed_assets_net,
      investment_32129,
      intercompany_investment_32129: applyGroupEliminations ? 0 : intercompanyDebit,
      inventory,
      accounts_receivable,
      other_assets,
      vat_receivable,
      current_assets,
      total_assets,
      accounts_payable,
      vat_payable,
      taxation_payable,
      non_interest_bearing_debt,
      net_operating_assets,
      shares_in_issue,
      shareholders_capital,
      equity_loan,
      retained_earnings_prior,
      retained_earnings_current,
      shareholders_equity,
      bank_balance_closing,
      term_loan_balance,
      interest_bearing_debt,
      capital_employed,
      bank_balance_opening: sumField((r) => r.bank_balance_opening),
      cash_from_operations: sumField((r) => r.cash_from_operations),
      change_in_working_capital: sumField((r) => r.change_in_working_capital),
      application_to_capital_assets: sumField((r) => r.application_to_capital_assets),
      change_in_investment,
      share_capital_change,
      equity_loan_change,
      loan_change,
      change_in_funding,
      cashflow: sumField((r) => r.cashflow),
      intercompany_branch_equity_loans_credit: intercompanyBranchCredit,
      intercompany_holding_investment_debit: intercompanyDebit,
    };
  });

  const yearEnd = summarize12MonthsToYearEnd(months, 'Full Year');

  const branchSummaries = includedBundles.map((b) => {
    const reg = regions.find((r) => r.id === b.branch.regionId);
    return {
      branchId: b.branch.id,
      branchName: b.branch.name,
      branchCode: b.branch.code,
      regionName: b.branch.isHoldingCompany ? 'Holding Co.' : reg?.name || 'Unassigned',
      isHoldingCompany: b.branch.isHoldingCompany,
      yearEnd: b.yearEnd,
    };
  });

  const lastMo = months[11];
  const debitElim = lastMo?.intercompany_holding_investment_debit ?? 0;
  const creditAgg = lastMo?.intercompany_branch_equity_loans_credit ?? 0;

  return {
    title,
    subtitle,
    level: effectiveLevel,
    entityCount: includedBundles.length,
    months,
    yearEnd,
    branchSummaries,
    eliminationsYearEnd: {
      investment32129Elimination: applyGroupEliminations ? -debitElim : 0,
      equityLoanDebitElimination: applyGroupEliminations ? debitElim : 0,
      branchEquityLoansAggregateCredit: creditAgg,
      netEliminationCheck: applyGroupEliminations ? debitElim + creditAgg : 0,
    },
  };
}

/**
 * Aggregate Executive Summary Column 2 adjustments across all included branches in scope.
 */
export function aggregateScopeAdjustments(
  branches: BudgetBranch[],
  structureMode: BudgetStructureMode,
  level: ConsolidationLevel,
  selectedBranchId: string,
  selectedRegionId: string
): Record<string, number> {
  const effectiveLevel: ConsolidationLevel = structureMode === 'standalone' ? 'branch' : level;
  let included: BudgetBranch[] = [];
  if (effectiveLevel === 'branch') {
    const found = branches.find((b) => b.id === selectedBranchId) || branches[0];
    if (found) included = [found];
  } else if (effectiveLevel === 'region') {
    included = branches.filter((b) => !b.isHoldingCompany && b.regionId === selectedRegionId);
  } else {
    included = branches;
  }

  const merged: Record<string, number> = {};
  included.forEach((b) => {
    Object.entries(b.execAdjustments || {}).forEach(([k, v]) => {
      if (Number.isFinite(v)) {
        merged[k] = (merged[k] || 0) + v;
      }
    });
  });
  return merged;
}

/**
 * 6-Column Executive Summary row shape:
 *   Col 1: Current Year-End Forecast (from trading distribution)
 *   Col 2: Adjustments (+/- editable)
 *   Col 3: Adjusted Year-End Forecast (Col 1 + Col 2)
 *   Col 4: Budget Year-End
 *   Col 5: Variance (Col 4 - Col 3)
 *   Col 6: Variance %
 */
export interface ExecSummary6ColRow {
  id: string;
  label: string;
  coaCode?: string;
  indent?: boolean;
  highlight?: boolean;
  isSectionHeader?: boolean;
  editable?: boolean;
  col1Forecast: number;
  col2Adjustment: number;
  col3Adjusted: number;
  col4Budget: number;
  col5Variance: number;
  col6VariancePct: number | null;
}

export interface ExecSummary6ColStatements {
  tradingAccount: ExecSummary6ColRow[];
  incomeStatement: ExecSummary6ColRow[];
  balanceSheet: ExecSummary6ColRow[];
  cashFlow: ExecSummary6ColRow[];
  summaryMetrics: {
    adjRevenue: number;
    budRevenue: number;
    adjGrossProfit: number;
    budGrossProfit: number;
    adjTotalIncome: number;
    budTotalIncome: number;
    adjTotalExpenses: number;
    budTotalExpenses: number;
    adjNop: number;
    budNop: number;
    adjTaxedProfits: number;
    budTaxedProfits: number;
    adjFixedAssets: number;
    budFixedAssets: number;
    adjInvestment32129: number;
    budInvestment32129: number;
    adjCurrentAssets: number;
    budCurrentAssets: number;
    adjTotalAssets: number;
    budTotalAssets: number;
    adjNoa: number;
    budNoa: number;
    adjShEquity: number;
    budShEquity: number;
    adjIbd: number;
    budIbd: number;
    adjCashOps: number;
    budCashOps: number;
    adjCashWc: number;
    budCashWc: number;
    adjCashCapex: number;
    budCashCapex: number;
    adjCashFunding: number;
    budCashFunding: number;
    adjNetCashflow: number;
    budNetCashflow: number;
    adjClosingBank: number;
    budClosingBank: number;
  };
}

function calcVarPct(col3Adjusted: number, col4Budget: number): number | null {
  if (Math.abs(col3Adjusted) < 0.5) {
    if (Math.abs(col4Budget) < 0.5) return 0;
    return null;
  }
  return Number((((col4Budget - col3Adjusted) / Math.abs(col3Adjusted)) * 100).toFixed(1));
}

function makeRow(
  id: string,
  label: string,
  col1Forecast: number,
  col2Adjustment: number,
  col4Budget: number,
  opts?: { indent?: boolean; highlight?: boolean; editable?: boolean; coaCode?: string }
): ExecSummary6ColRow {
  const c1 = Math.round(col1Forecast);
  const c2 = Math.round(col2Adjustment);
  const c3 = c1 + c2;
  const c4 = Math.round(col4Budget);
  const c5 = c4 - c3;
  return {
    id,
    label,
    coaCode: opts?.coaCode,
    indent: opts?.indent,
    highlight: opts?.highlight,
    editable: opts?.editable,
    col1Forecast: c1,
    col2Adjustment: c2,
    col3Adjusted: c3,
    col4Budget: c4,
    col5Variance: c5,
    col6VariancePct: calcVarPct(c3, c4),
  };
}

export function buildExecutiveSummary6Col(
  forecast: BudgetPeriodRow,
  budget: BudgetPeriodRow,
  adj: Record<string, number>
): ExecSummary6ColStatements {
  const a = (key: string) => Math.round(Number(adj[key] || 0));

  // === 1. TRADING ACCOUNT ===
  const taRev = makeRow('ta_revenue', 'revenue', forecast.revenue, a('ta_revenue'), budget.revenue, {
    highlight: true,
    editable: true,
  });
  const taCosVar = makeRow('ta_cos_var', 'cost of sales - variable', -forecast.cos_variable, a('ta_cos_var'), -budget.cos_variable, {
    indent: true,
    editable: true,
  });
  const taCosEmp = makeRow('ta_cos_emp', 'cos - employment', -forecast.cos_employment, a('ta_cos_emp'), -budget.cos_employment, {
    indent: true,
    editable: true,
  });
  const taCosDep = makeRow('ta_cos_dep', 'cos - depreciation', -forecast.cos_depreciation, a('ta_cos_dep'), -budget.cos_depreciation, {
    indent: true,
    editable: true,
  });
  const taCosLease = makeRow('ta_cos_lease', 'cos - lease', -forecast.cos_lease, a('ta_cos_lease'), -budget.cos_lease, {
    indent: true,
    editable: true,
  });
  const taCosOvh = makeRow('ta_cos_ovh', 'cos - overheads', -forecast.cos_overheads, a('ta_cos_ovh'), -budget.cos_overheads, {
    indent: true,
    editable: true,
  });
  const taTotalCos = makeRow(
    'ta_total_cos',
    'total cost of sales',
    taCosVar.col1Forecast + taCosEmp.col1Forecast + taCosDep.col1Forecast + taCosLease.col1Forecast + taCosOvh.col1Forecast,
    taCosVar.col2Adjustment + taCosEmp.col2Adjustment + taCosDep.col2Adjustment + taCosLease.col2Adjustment + taCosOvh.col2Adjustment,
    taCosVar.col4Budget + taCosEmp.col4Budget + taCosDep.col4Budget + taCosLease.col4Budget + taCosOvh.col4Budget,
    { highlight: true }
  );
  const taGp = makeRow(
    'ta_gp',
    'gross profit',
    taRev.col1Forecast + taTotalCos.col1Forecast,
    taRev.col2Adjustment + taTotalCos.col2Adjustment,
    taRev.col4Budget + taTotalCos.col4Budget,
    { highlight: true }
  );
  const taGpAdj = makeRow('ta_gp_adj', 'gross profit adjustments', -forecast.gp_adjustments, a('ta_gp_adj'), -budget.gp_adjustments, {
    editable: true,
  });
  const taOtherInc = makeRow('ta_other_inc', 'other income', forecast.other_inc, a('ta_other_inc'), budget.other_inc, {
    editable: true,
  });
  const taTotalInc = makeRow(
    'ta_total_inc',
    'total income',
    taGp.col1Forecast + taGpAdj.col1Forecast + taOtherInc.col1Forecast,
    taGp.col2Adjustment + taGpAdj.col2Adjustment + taOtherInc.col2Adjustment,
    taGp.col4Budget + taGpAdj.col4Budget + taOtherInc.col4Budget,
    { highlight: true }
  );
  const taExVar = makeRow('ta_ex_var', 'expenses - variable', -forecast.ex_variable, a('ta_ex_var'), -budget.ex_variable, {
    indent: true,
    editable: true,
  });
  const taExEmp = makeRow('ta_ex_emp', 'expenses - employment', -forecast.ex_employment, a('ta_ex_emp'), -budget.ex_employment, {
    indent: true,
    editable: true,
  });
  const taExDep = makeRow('ta_ex_dep', 'expenses - depreciation', -forecast.ex_depreciation, a('ta_ex_dep'), -budget.ex_depreciation, {
    indent: true,
    editable: true,
  });
  const taExLease = makeRow('ta_ex_lease', 'expenses - lease', -forecast.ex_lease, a('ta_ex_lease'), -budget.ex_lease, {
    indent: true,
    editable: true,
  });
  const taExOvh = makeRow('ta_ex_ovh', 'expenses - overheads', -forecast.ex_overheads, a('ta_ex_ovh'), -budget.ex_overheads, {
    indent: true,
    editable: true,
  });
  const taExTotal = makeRow(
    'ta_ex_total',
    'total operating expenses',
    taExVar.col1Forecast + taExEmp.col1Forecast + taExDep.col1Forecast + taExLease.col1Forecast + taExOvh.col1Forecast,
    taExVar.col2Adjustment + taExEmp.col2Adjustment + taExDep.col2Adjustment + taExLease.col2Adjustment + taExOvh.col2Adjustment,
    taExVar.col4Budget + taExEmp.col4Budget + taExDep.col4Budget + taExLease.col4Budget + taExOvh.col4Budget,
    { highlight: true }
  );
  const taNop = makeRow(
    'ta_nop',
    'net operating profit',
    taTotalInc.col1Forecast + taExTotal.col1Forecast,
    taTotalInc.col2Adjustment + taExTotal.col2Adjustment,
    taTotalInc.col4Budget + taExTotal.col4Budget,
    { highlight: true }
  );

  // === 2. INCOME STATEMENT ===
  const isNop = { ...taNop, id: 'is_nop', editable: false };
  const isIntOther = makeRow('is_int_other', 'interest - bank / overdraft', forecast.interest_other, a('is_int_other'), budget.interest_other, {
    indent: true,
    editable: true,
  });
  const isIntTl = makeRow('is_int_tl', 'interest - term loan', -forecast.interest_tl, a('is_int_tl'), -budget.interest_tl, {
    indent: true,
    editable: true,
  });
  const isIntTotal = makeRow(
    'is_int_total',
    'net finance charges',
    isIntOther.col1Forecast + isIntTl.col1Forecast,
    isIntOther.col2Adjustment + isIntTl.col2Adjustment,
    isIntOther.col4Budget + isIntTl.col4Budget,
    { highlight: true }
  );
  const isNpbt = makeRow(
    'is_npbt',
    'net profit before taxation',
    isNop.col1Forecast + isIntTotal.col1Forecast,
    isNop.col2Adjustment + isIntTotal.col2Adjustment,
    isNop.col4Budget + isIntTotal.col4Budget,
    { highlight: true }
  );
  const isTax = makeRow('is_tax', 'taxation', -forecast.taxation, a('is_tax'), -budget.taxation, {
    editable: true,
  });
  const isPat = makeRow(
    'is_pat',
    'taxed profits (net profit)',
    isNpbt.col1Forecast + isTax.col1Forecast,
    isNpbt.col2Adjustment + isTax.col2Adjustment,
    isNpbt.col4Budget + isTax.col4Budget,
    { highlight: true }
  );
  const isDiv = makeRow('is_div', 'dividends', -forecast.dividends, a('is_div'), -budget.dividends, {
    editable: true,
  });
  const isRetained = makeRow(
    'is_retained',
    'retained earnings for the year',
    isPat.col1Forecast + isDiv.col1Forecast,
    isPat.col2Adjustment + isDiv.col2Adjustment,
    isPat.col4Budget + isDiv.col4Budget,
    { highlight: true }
  );

  // === 3. BALANCE SHEET (WITH INVESTMENT 3-2-1-29 POSITIONED RIGHT AFTER FIXED ASSETS) ===
  const bsFa = makeRow('bs_fa', 'fixed assets', forecast.fixed_assets_net, a('bs_fa'), budget.fixed_assets_net, {
    editable: true,
  });
  const bsInv32129 = makeRow(
    'bs_inv_32129',
    'investment',
    forecast.investment_32129,
    a('bs_inv_32129'),
    budget.investment_32129,
    { editable: true, coaCode: '3-2-1-29' }
  );
  const bsInventory = makeRow('bs_inventory', 'inventory', forecast.inventory, a('bs_inventory'), budget.inventory, {
    indent: true,
    editable: true,
  });
  const bsAr = makeRow('bs_ar', 'accounts receivables', forecast.accounts_receivable, a('bs_ar'), budget.accounts_receivable, {
    indent: true,
    editable: true,
  });
  const bsOtherAssets = makeRow('bs_other_assets', 'other assets', forecast.other_assets, a('bs_other_assets'), budget.other_assets, {
    indent: true,
    editable: true,
  });
  const bsVatRec = makeRow('bs_vat_rec', 'vat receivable', forecast.vat_receivable, a('bs_vat_rec'), budget.vat_receivable, {
    indent: true,
    editable: true,
  });
  const bsCurrAssets = makeRow(
    'bs_curr_assets',
    'current assets',
    bsInventory.col1Forecast + bsAr.col1Forecast + bsOtherAssets.col1Forecast + bsVatRec.col1Forecast,
    bsInventory.col2Adjustment + bsAr.col2Adjustment + bsOtherAssets.col2Adjustment + bsVatRec.col2Adjustment,
    bsInventory.col4Budget + bsAr.col4Budget + bsOtherAssets.col4Budget + bsVatRec.col4Budget,
    { highlight: true }
  );
  const bsTotalAssets = makeRow(
    'bs_total_assets',
    'total assets',
    bsFa.col1Forecast + bsInv32129.col1Forecast + bsCurrAssets.col1Forecast,
    bsFa.col2Adjustment + bsInv32129.col2Adjustment + bsCurrAssets.col2Adjustment,
    bsFa.col4Budget + bsInv32129.col4Budget + bsCurrAssets.col4Budget,
    { highlight: true }
  );
  const bsAp = makeRow('bs_ap', 'accounts payables', forecast.accounts_payable, a('bs_ap'), budget.accounts_payable, {
    indent: true,
    editable: true,
  });
  const bsVatPay = makeRow('bs_vat_pay', 'vat payable', forecast.vat_payable, a('bs_vat_pay'), budget.vat_payable, {
    indent: true,
    editable: true,
  });
  const bsTaxPay = makeRow('bs_tax_pay', 'taxation payable', forecast.taxation_payable, a('bs_tax_pay'), budget.taxation_payable, {
    indent: true,
    editable: true,
  });
  const bsNibd = makeRow(
    'bs_nibd',
    'non-interest bearing debt',
    bsAp.col1Forecast + bsVatPay.col1Forecast + bsTaxPay.col1Forecast,
    bsAp.col2Adjustment + bsVatPay.col2Adjustment + bsTaxPay.col2Adjustment,
    bsAp.col4Budget + bsVatPay.col4Budget + bsTaxPay.col4Budget,
    { highlight: true }
  );
  const bsNoa = makeRow(
    'bs_noa',
    'net operating assets',
    bsTotalAssets.col1Forecast + bsNibd.col1Forecast,
    bsTotalAssets.col2Adjustment + bsNibd.col2Adjustment,
    bsTotalAssets.col4Budget + bsNibd.col4Budget,
    { highlight: true }
  );
  const bsShCap = makeRow('bs_sh_cap', "shareholders' capital", forecast.shareholders_capital, a('bs_sh_cap'), budget.shareholders_capital, {
    editable: true,
  });
  const bsEqLoan = makeRow('bs_eq_loan', 'equity loan', forecast.equity_loan, a('bs_eq_loan'), budget.equity_loan, {
    editable: true,
  });
  const bsRetPrior = makeRow('bs_ret_prior', 'retained earnings - prior', forecast.retained_earnings_prior, a('bs_ret_prior'), budget.retained_earnings_prior, {
    editable: true,
  });
  const bsRetCurr = makeRow(
    'bs_ret_curr',
    'retained earnings - current',
    -isRetained.col1Forecast,
    -isRetained.col2Adjustment,
    -isRetained.col4Budget
  );
  const bsShEquity = makeRow(
    'bs_sh_equity',
    "shareholders' equity",
    bsShCap.col1Forecast + bsEqLoan.col1Forecast + bsRetPrior.col1Forecast + bsRetCurr.col1Forecast,
    bsShCap.col2Adjustment + bsEqLoan.col2Adjustment + bsRetPrior.col2Adjustment + bsRetCurr.col2Adjustment,
    bsShCap.col4Budget + bsEqLoan.col4Budget + bsRetPrior.col4Budget + bsRetCurr.col4Budget,
    { highlight: true }
  );
  const bsTermLoan = makeRow('bs_term_loan', 'term loan', forecast.term_loan_balance, a('bs_term_loan'), budget.term_loan_balance, {
    editable: true,
  });
  const bsCapEmp = makeRow(
    'bs_cap_emp',
    'capital employed',
    -bsNoa.col1Forecast,
    -bsNoa.col2Adjustment,
    -bsNoa.col4Budget,
    { highlight: true }
  );
  const bsIbd = makeRow(
    'bs_ibd',
    'interest bearing debt',
    bsCapEmp.col1Forecast - bsShEquity.col1Forecast,
    bsCapEmp.col2Adjustment - bsShEquity.col2Adjustment,
    bsCapEmp.col4Budget - bsShEquity.col4Budget,
    { highlight: true }
  );
  const bsBank = makeRow(
    'bs_bank',
    'bank balance',
    bsIbd.col1Forecast - bsTermLoan.col1Forecast,
    bsIbd.col2Adjustment - bsTermLoan.col2Adjustment,
    bsIbd.col4Budget - bsTermLoan.col4Budget
  );

  // === 4. CASH FLOW STATEMENT ===
  const cfOpen = makeRow('cf_open', 'bank balance - opening', forecast.bank_balance_opening, a('cf_open'), budget.bank_balance_opening, {
    editable: true,
  });
  const cfOps = makeRow('cf_ops', 'cash from operations', forecast.cash_from_operations, a('cf_ops'), budget.cash_from_operations, {
    editable: true,
  });
  const cfWc = makeRow('cf_wc', 'change in working capital', forecast.change_in_working_capital, a('cf_wc'), budget.change_in_working_capital, {
    editable: true,
  });
  const cfCapex = makeRow('cf_capex', 'application to capital assets', forecast.application_to_capital_assets, a('cf_capex'), budget.application_to_capital_assets, {
    editable: true,
  });
  const cfInv = makeRow('cf_inv', 'investment movement (3-2-1-29)', forecast.change_in_investment, a('cf_inv'), budget.change_in_investment, {
    editable: true,
  });
  const cfFund = makeRow('cf_fund', 'change in funding', forecast.change_in_funding, a('cf_fund'), budget.change_in_funding, {
    editable: true,
  });
  const cfNet = makeRow(
    'cf_net',
    'net cashflow',
    cfOps.col1Forecast + cfWc.col1Forecast + cfCapex.col1Forecast + cfInv.col1Forecast + cfFund.col1Forecast,
    cfOps.col2Adjustment + cfWc.col2Adjustment + cfCapex.col2Adjustment + cfInv.col2Adjustment + cfFund.col2Adjustment,
    cfOps.col4Budget + cfWc.col4Budget + cfCapex.col4Budget + cfInv.col4Budget + cfFund.col4Budget,
    { highlight: true }
  );
  const cfClose = makeRow(
    'cf_close',
    'bank balance - closing',
    cfOpen.col1Forecast + cfNet.col1Forecast,
    cfOpen.col2Adjustment + cfNet.col2Adjustment,
    cfOpen.col4Budget + cfNet.col4Budget,
    { highlight: true }
  );

  return {
    tradingAccount: [
      taRev,
      taCosVar,
      taCosEmp,
      taCosDep,
      taCosLease,
      taCosOvh,
      taTotalCos,
      taGp,
      taGpAdj,
      taOtherInc,
      taTotalInc,
      taExVar,
      taExEmp,
      taExDep,
      taExLease,
      taExOvh,
      taExTotal,
      taNop,
    ],
    incomeStatement: [
      isNop,
      isIntOther,
      isIntTl,
      isIntTotal,
      isNpbt,
      isTax,
      isPat,
      isDiv,
      isRetained,
    ],
    balanceSheet: [
      bsFa,
      bsInv32129,
      bsInventory,
      bsAr,
      bsOtherAssets,
      bsVatRec,
      bsCurrAssets,
      bsTotalAssets,
      bsAp,
      bsVatPay,
      bsTaxPay,
      bsNibd,
      bsNoa,
      {
        id: 'bs_hdr_financed',
        label: 'financed by',
        isSectionHeader: true,
        col1Forecast: 0,
        col2Adjustment: 0,
        col3Adjusted: 0,
        col4Budget: 0,
        col5Variance: 0,
        col6VariancePct: null,
      },
      bsShCap,
      bsEqLoan,
      bsRetPrior,
      bsRetCurr,
      bsShEquity,
      bsBank,
      bsTermLoan,
      bsIbd,
      bsCapEmp,
    ],
    cashFlow: [cfOpen, cfOps, cfWc, cfCapex, cfInv, cfFund, cfNet, cfClose],
    summaryMetrics: {
      adjRevenue: taRev.col3Adjusted,
      budRevenue: taRev.col4Budget,
      adjGrossProfit: taGp.col3Adjusted,
      budGrossProfit: taGp.col4Budget,
      adjTotalIncome: taTotalInc.col3Adjusted,
      budTotalIncome: taTotalInc.col4Budget,
      adjTotalExpenses: Math.abs(taExTotal.col3Adjusted),
      budTotalExpenses: Math.abs(taExTotal.col4Budget),
      adjNop: taNop.col3Adjusted,
      budNop: taNop.col4Budget,
      adjTaxedProfits: isPat.col3Adjusted,
      budTaxedProfits: isPat.col4Budget,
      adjFixedAssets: bsFa.col3Adjusted,
      budFixedAssets: bsFa.col4Budget,
      adjInvestment32129: bsInv32129.col3Adjusted,
      budInvestment32129: bsInv32129.col4Budget,
      adjCurrentAssets: bsCurrAssets.col3Adjusted,
      budCurrentAssets: bsCurrAssets.col4Budget,
      adjTotalAssets: bsTotalAssets.col3Adjusted,
      budTotalAssets: bsTotalAssets.col4Budget,
      adjNoa: bsNoa.col3Adjusted,
      budNoa: bsNoa.col4Budget,
      adjShEquity: Math.abs(bsShEquity.col3Adjusted),
      budShEquity: Math.abs(bsShEquity.col4Budget),
      adjIbd: Math.abs(bsIbd.col3Adjusted),
      budIbd: Math.abs(bsIbd.col4Budget),
      adjCashOps: cfOps.col3Adjusted,
      budCashOps: cfOps.col4Budget,
      adjCashWc: cfWc.col3Adjusted,
      budCashWc: cfWc.col4Budget,
      adjCashCapex: cfCapex.col3Adjusted,
      budCashCapex: cfCapex.col4Budget,
      adjCashFunding: cfFund.col3Adjusted,
      budCashFunding: cfFund.col4Budget,
      adjNetCashflow: cfNet.col3Adjusted,
      budNetCashflow: cfNet.col4Budget,
      adjClosingBank: cfClose.col3Adjusted,
      budClosingBank: cfClose.col4Budget,
    },
  };
}
