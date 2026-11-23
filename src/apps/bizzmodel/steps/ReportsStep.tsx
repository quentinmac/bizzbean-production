import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, ShieldCheck, DollarSign, Calculator, Landmark } from 'lucide-react';
import { BizzModelState, PlatformForecastAppId } from '../constants';
import { AssumptionRateItem } from '../../bizzdynamics/types';
import { calculateFinancialModelProjections, MonthlyFinancialSummary } from '../utils/revenueCalc';
import { LiquidityVsDebtChart } from '../../bizzdynamics/components/LiquidityVsDebtChart';
import {
  ExecutiveEfficiencyChart,
  EfficiencyChartDataPoint,
} from '../../bizzdynamics/components/ExecutiveEfficiencyChart';
import {
  ExecutiveReturnsChart,
  ReturnsChartDataPoint,
} from '../../bizzdynamics/components/ExecutiveReturnsChart';
import { ReportsCarousel } from '../../bizzdynamics/components/ReportsCarousel';
import {
  BizzReportTable,
  BizzReportTableRow,
  formatReportNumber,
  formatReportPercent,
} from '../../bizzdynamics/components/BizzReportTable';
import {
  BizzReportSection,
  BizzTableClass,
  BizzTableHeaderClass,
  BizzTableHeaderCellClass,
  BizzTableRowClass,
  BizzTableCellClass,
  BizzTableContainerClass,
} from '../components/BizzUI';

/**
 * Underlying Simulation Engine alias for V1 Navigation Map
 */
export const runMonthlySimulation = calculateFinancialModelProjections;

interface ReportsStepProps {
  theme?: 'light' | 'dark';
  mode: PlatformForecastAppId;
  state: BizzModelState;
  onUpdateState: (updater: (prev: BizzModelState) => BizzModelState) => void;
}

export const ReportsStep: React.FC<ReportsStepProps> = ({
  theme = 'light',
  mode,
  state,
}) => {
  const isDark = theme === 'dark';

  const [activeReportTab, setActiveReportTab] = useState<
    | 'summary'
    | 'trading-account'
    | 'trading-distribution'
    | 'income-statement'
    | 'balance-sheet'
    | 'cash-flow'
    | 'vat-ledger'
    | 'assumptions'
  >('summary');

  // Reports Period Filter: Year 1, Year 2, Year 3, Year 4, Year 5, or 5-Year Summary (Replacing ALL)
  const [reportHorizonYear, setReportHorizonYear] = useState<number | 'summary'>(1);

  const projections = useMemo(() => {
    return calculateFinancialModelProjections(state, 60, undefined, mode);
  }, [state, mode]);

  // 5-Year Data for Annual Summary, Growth Trajectory & Trading Account (V1 reports parity)
  const yearData = useMemo(() => {
    return [1, 2, 3, 4, 5].map((yr) => {
      const start = (yr - 1) * 12;
      const slice = projections.slice(start, start + 12);

      const unitSales = slice.reduce((sum, p) => sum + (p.unitSales || 0), 0);
      const revenue = slice.reduce((sum, p) => sum + p.revenue, 0);
      const cos_employment = slice.reduce((sum, p) => sum + (p.cosEmployment || 0), 0);
      const cos_depreciation = slice.reduce((sum, p) => sum + (p.cosDepreciation || 0), 0);
      const cos_lease = slice.reduce((sum, p) => sum + (p.cosLeases || 0), 0);
      const cos_overheads = slice.reduce((sum, p) => sum + (p.cosOverheads || 0), 0);
      const cos_fixed = slice.reduce((sum, p) => sum + (p.cosFixed ?? (p.cosEmployment || 0) + (p.cosDepreciation || 0) + (p.cosLeases || 0) + (p.cosOverheads || 0)), 0);
      const cos_variable = slice.reduce((sum, p) => sum + (p.cosVariable ?? p.cosMaterials ?? 0), 0);
      const total_cos = cos_variable + cos_fixed;

      const gross_profit = slice.reduce((sum, p) => sum + p.grossProfit, 0);

      const sales_commission = slice.reduce((sum, p) => sum + (p.gpAdjustmentsCommission || 0), 0);
      const inventory_adjustments = slice.reduce((sum, p) => sum + (p.gpAdjustmentsInventory || 0), 0);
      const manufacturing_variance = slice.reduce((sum, p) => sum + (p.gpAdjustmentsVariance || 0), 0);
      const gp_adjustments = sales_commission + inventory_adjustments + manufacturing_variance;

      const remaining_gp = gross_profit - gp_adjustments;
      const other_inc = slice.reduce((sum, p) => sum + (p.otherIncomeTotal || 0), 0);
      const total_income = remaining_gp + other_inc;

      const ex_employment = slice.reduce((sum, p) => sum + (p.employmentExpenses || p.opexEmployment || 0), 0);
      const ex_depreciation = slice.reduce((sum, p) => sum + (p.exDepreciation !== undefined ? p.exDepreciation : (p.depreciation || p.opexAdminDepreciation || 0)), 0);
      const ex_lease = slice.reduce((sum, p) => sum + (p.exLease || 0), 0);
      const ex_overheads = slice.reduce((sum, p) => sum + (p.exOverheads !== undefined ? p.exOverheads : Math.max(0, (p.operatingExpenses || 0) - (p.depreciation || 0))), 0);
      const ex_variable = slice.reduce((sum, p) => sum + (p.exVariable !== undefined ? p.exVariable : 0), 0);
      const ex_fixed = ex_employment + ex_depreciation + ex_lease + ex_overheads;
      const ex_total = ex_fixed + ex_variable;

      const net_operating_profit = total_income - ex_total;

      const interest_other = slice.reduce(
        (sum, p) => sum + (p.interestOther !== undefined ? p.interestOther : (p.interestReceived - p.interestOverdraft)),
        0
      );
      const interest_tl = slice.reduce((sum, p) => sum + (p.interestTermLoan ?? p.interestExpense ?? 0), 0);
      const interest_total = slice.reduce(
        (sum, p) => sum + (p.netFinanceCharges ?? (p.interestExpense - p.interestOther)),
        0
      );
      const net_profit_before_tax = slice.reduce(
        (sum, p) => sum + (p.netProfitBeforeTax ?? p.netProfitBeforeTaxation ?? 0),
        0
      );
      const taxation = slice.reduce((sum, p) => sum + (p.taxationMonthly ?? p.taxationCit ?? 0), 0);
      const taxed_profits = slice.reduce((sum, p) => sum + p.taxedProfits, 0);
      const dividends = slice.reduce((sum, p) => sum + (p.dividends ?? p.dividendsDeclared ?? 0), 0);
      const retained_earnings = taxed_profits - dividends;

      const shares_in_issue =
        (state.businessDetails as any)?.sharesInIssue ||
        (state.businessDetails as any)?.shares_in_issue ||
        0;

      // Cash Flow & Balance Sheet metrics (V1 reports parity)
      const lastMonth = slice[slice.length - 1];
      const prevYearLastMonth = yr > 1 ? projections[(yr - 1) * 12 - 1] : null;

      const initialOpeningCash =
        (state.funding?.founderEquity || 0) +
        (state.funding?.investorEquity || 0) +
        ((state.funding as any)?.equityLoan || 0) +
        (state.funding?.bankLoanAmount || 0);

      const isHiLevelMode = mode === 'rolling-forecast' || mode === 'hi-level-forecast';
      const bank_balance_opening =
        yr === 1
          ? (isHiLevelMode ? (projections[0]?.bank_balance_opening ?? initialOpeningCash) : initialOpeningCash)
          : (prevYearLastMonth?.bank_balance_closing ?? prevYearLastMonth?.closingCash ?? 0);

      const cash_from_operations = net_operating_profit - interest_total - taxation - dividends;

      const inv_change = (lastMonth?.inventory ?? 0) - (prevYearLastMonth?.inventory ?? 0);
      const ar_change = (lastMonth?.accounts_receivable ?? 0) - (prevYearLastMonth?.accounts_receivable ?? 0);
      const oa_change = (lastMonth?.other_assets ?? 0) - (prevYearLastMonth?.other_assets ?? 0);
      const vat_rec_change = (lastMonth?.vatReceivable ?? 0) - (prevYearLastMonth?.vatReceivable ?? 0);
      const ap_change = (lastMonth?.accounts_payable ?? 0) - (prevYearLastMonth?.accounts_payable ?? 0);
      const vat_pay_change = (lastMonth?.vatPayable ?? 0) - (prevYearLastMonth?.vatPayable ?? 0);
      const tax_paid_year = slice.reduce((s, p) => s + (p.taxPayment || 0), 0);
      const change_in_working_capital =
        -inv_change - ar_change - oa_change - vat_rec_change + ap_change + vat_pay_change + (taxation - tax_paid_year);

      const capex = slice.reduce((s, p) => s + (p.vat_fa_purchased ? Math.abs(p.vat_fa_purchased) : 0), 0) ||
        state.fixedAssets?.reduce((sum: number, a: any) => {
          if (a.financeOption !== 'lease' && a.purchaseTiming !== 'prior' && a.purchaseMonth >= start + 1 && a.purchaseMonth <= start + 12) {
            return sum + (a.purchaseValue ?? a.purchaseCost ?? 0);
          }
          return sum;
        }, 0) || 0;

      const dep_writeback = cos_depreciation + ex_depreciation;
      const application_to_capital_assets = dep_writeback - capex;

      const share_capital_change = slice.reduce((s, p) => s + (p.share_capital_additional_raised || 0), 0);
      const equity_loan_change = slice.reduce((s, p) => s + ((p.equity_loan_additional || 0) - (p.equity_loan_repayments || 0)), 0);
      const loan_change =
        (lastMonth?.term_loan_balance ?? 0) - (prevYearLastMonth?.term_loan_balance ?? (yr === 1 ? (state.funding?.bankLoanAmount || 0) : 0));
      const change_in_funding = share_capital_change + equity_loan_change + loan_change;

      const cashflow = isHiLevelMode
        ? slice.reduce((s, p) => s + (p.cashflow || 0), 0)
        : cash_from_operations + change_in_working_capital + application_to_capital_assets + change_in_funding;
      const bank_balance_closing = isHiLevelMode
        ? (lastMonth?.bank_balance_closing ?? (bank_balance_opening + cashflow))
        : bank_balance_opening + cashflow;

      // Balance Sheet metrics (V1 reports parity)
      const fixed_assets_net =
        state.fixedAssets?.reduce((sum: number, a: any) => {
          if (a.financeOption === 'lease') return sum;
          const orig = a.purchaseValue ?? a.purchaseCost ?? (a.unitCost * a.quantity);
          const rate = a.depreciationRate || 20;
          const depPerMonth = (orig * (rate / 100)) / 12;
          const isPrior = a.purchaseTiming === 'prior';
          const monthsElapsed = isPrior
            ? (a.monthsInSystem || 0) + (yr * 12)
            : Math.max(0, yr * 12 - a.purchaseMonth + 1);
          const cumDep = Math.min(orig, depPerMonth * monthsElapsed);
          return sum + Math.max(0, orig - cumDep);
        }, 0) || 0;

      const inventory = lastMonth?.inventory ?? 0;
      const accounts_receivable = lastMonth?.accounts_receivable ?? 0;
      const other_assets = lastMonth?.other_assets ?? 0;
      const vat_receivable = lastMonth?.vatReceivable ?? 0;
      const current_assets = inventory + accounts_receivable + other_assets + vat_receivable;
      const total_assets = fixed_assets_net + current_assets;
      const accounts_payable = lastMonth?.accounts_payable ?? 0;
      const vat_payable = lastMonth?.vatPayable ?? 0;
      const taxation_payable = lastMonth?.taxLiability ?? 0;
      const non_interest_bearing_debt = vat_payable + taxation_payable;
      const net_operating_assets = total_assets - non_interest_bearing_debt;

      const capital =
        (state.funding?.founderEquity || 0) +
        (state.funding?.investorEquity || 0);
      const total_equity = capital + (lastMonth ? lastMonth.cumulativeRetainedEarnings : 0);
      const term_loan_bal = lastMonth ? (lastMonth.term_loan_balance ?? lastMonth.debtBalance) : 0;
      const roe = total_equity > 0 ? (taxed_profits / total_equity) * 100 : 0;
      const debtEquity = total_equity > 0 ? term_loan_bal / total_equity : 0;
      const eps = shares_in_issue > 0 ? taxed_profits / shares_in_issue : 0;
      const ros = revenue > 0 ? (net_operating_profit / revenue) * 100 : 0;
      const roa = net_operating_assets !== 0 ? (net_operating_profit / net_operating_assets) * 100 : 0;
      const assetTurn = net_operating_assets !== 0 ? revenue / net_operating_assets : 0;

      return {
        year: yr,
        label: `year ${yr}`,
        isTotal: false,
        unitSales,
        revenue,
        total_cos,
        cos_variable,
        cos_fixed,
        cos_employment,
        cos_depreciation,
        cos_lease,
        cos_overheads,
        gross_profit,
        gp_adjustments,
        sales_commission,
        inventory_adjustments,
        manufacturing_variance,
        remaining_gp,
        other_inc,
        total_income,
        ex_total,
        ex_variable,
        ex_fixed,
        ex_employment,
        ex_depreciation,
        ex_lease,
        ex_overheads,
        net_operating_profit,
        interest_other,
        interest_tl,
        interest_total,
        net_profit_before_tax,
        taxation,
        taxed_profits,
        dividends,
        retained_earnings,
        shares_in_issue,
        // Cash Flow statement
        bank_balance_opening,
        bank_balance_closing,
        cash_from_operations,
        inv_change,
        ar_change,
        oa_change,
        vat_rec_change,
        ap_change,
        vat_pay_change,
        change_in_working_capital,
        capex,
        dep_writeback,
        application_to_capital_assets,
        share_capital_change,
        equity_loan_change,
        loan_change,
        change_in_funding,
        cashflow,
        // Balance Sheet
        fixed_assets_net,
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
        term_loan_balance: term_loan_bal,
        cumulative_retained_earnings: lastMonth ? lastMonth.cumulativeRetainedEarnings : 0,
        taxRateUsed: lastMonth?.taxRateUsed ?? 25,
        profitsBeforeTaxationCumulative: lastMonth?.cumulativeProfitThisYear ?? net_profit_before_tax,
        taxationCumulative: lastMonth?.taxationCumulative ?? -taxation,
        taxationMonth: -taxation,
        taxOpeningBalance: slice[0]?.taxOpeningBalance ?? 0,
        taxClosingBalance: lastMonth?.taxClosingBalance ?? 0,
        taxPayment: slice.reduce((s, p) => s + (p.taxPayment || 0), 0),
        taxLiability: lastMonth?.taxLiability ?? 0,
        vatRate: lastMonth?.vatRate ?? 15,
        vat_revenue: slice.reduce((s, p) => s + (p.vat_revenue || p.revenue || 0), 0),
        vat_fa_sold: 0,
        vat_fa_purchased: slice.reduce((s, p) => s + (p.vat_fa_purchased || 0), 0),
        vat_cos: slice.reduce((s, p) => s + (p.vat_cos || 0), 0),
        vat_opex: slice.reduce((s, p) => s + (p.vat_opex || 0), 0),
        vat_addback_employment: slice.reduce((s, p) => s + (p.vat_addback_employment || 0), 0),
        vat_addback_depreciation: slice.reduce((s, p) => s + (p.vat_addback_depreciation || 0), 0),
        vatable_amount: slice.reduce((s, p) => s + (p.vatable_amount || 0), 0),
        vat_calc_value: slice.reduce((s, p) => s + (p.vat_calc_value || 0), 0),
        vat_opening_balance: slice[0]?.vat_opening_balance ?? 0,
        vat_account_balance: lastMonth?.vat_account_balance ?? 0,
        vat_settlement: slice.reduce((s, p) => s + (p.vat_settlement || 0), 0),
        vat_closing_balance: lastMonth?.vat_closing_balance ?? 0,
        ros: Number(ros.toFixed(2)),
        roa: Number(roa.toFixed(2)),
        assetTurn: Number(assetTurn.toFixed(2)),
        roe: Number(roe.toFixed(2)),
        debtEquity: Number(debtEquity.toFixed(2)),
        eps: Number(eps.toFixed(2)),
      };
    });
  }, [projections, state]);

  // Compute 60 Monthly Periods Data
  const monthData = useMemo(() => {
    const capital =
      (state.funding?.founderEquity || 0) +
      (state.funding?.investorEquity || 0);
    const shares_in_issue =
      (state.businessDetails as any)?.sharesInIssue ||
      (state.businessDetails as any)?.shares_in_issue ||
      0;

    const initialOpeningCash =
      (state.funding?.founderEquity || 0) +
      (state.funding?.investorEquity || 0) +
      ((state.funding as any)?.equityLoan || 0) +
      (state.funding?.bankLoanAmount || 0);

    let runningBankClosing = initialOpeningCash;

    return projections.map((p, m) => {
      const prevP = m > 0 ? projections[m - 1] : null;

      const unitSales = p.unitSales || 0;
      const revenue = p.revenue;
      const cos_employment = p.cosEmployment || 0;
      const cos_depreciation = p.cosDepreciation || 0;
      const cos_lease = p.cosLeases || 0;
      const cos_overheads = p.cosOverheads || 0;
      const cos_fixed = p.cosFixed ?? (cos_employment + cos_depreciation + cos_lease + cos_overheads);
      const cos_variable = p.cosVariable ?? (p.cosMaterials || 0);
      const total_cos = p.totalCos ?? (cos_variable + cos_fixed);
      const gross_profit = p.grossProfit;

      const sales_commission = p.gpAdjustmentsCommission || 0;
      const inventory_adjustments = p.gpAdjustmentsInventory || 0;
      const manufacturing_variance = p.gpAdjustmentsVariance || 0;
      const gp_adjustments = sales_commission + inventory_adjustments + manufacturing_variance;

      const remaining_gp = gross_profit - gp_adjustments;
      const other_inc = p.otherIncomeTotal || 0;
      const total_income = remaining_gp + other_inc;

      const ex_employment = p.employmentExpenses || p.opexEmployment || 0;
      const ex_depreciation = p.exDepreciation !== undefined ? p.exDepreciation : (p.depreciation || p.opexAdminDepreciation || 0);
      const ex_lease = p.exLease || 0;
      const ex_overheads = p.exOverheads !== undefined ? p.exOverheads : Math.max(0, (p.operatingExpenses || 0) - (p.depreciation || 0));
      const ex_variable = p.exVariable !== undefined ? p.exVariable : 0;
      const ex_fixed = p.exFixed ?? (ex_employment + ex_depreciation + ex_lease + ex_overheads);
      const ex_total = p.exTotal ?? (ex_fixed + ex_variable);

      const net_operating_profit = total_income - ex_total;

      const interest_other = p.interestOther !== undefined ? p.interestOther : (p.interestReceived - p.interestOverdraft);
      const interest_tl = p.interestTermLoan ?? p.interestExpense ?? 0;
      const interest_total = p.netFinanceCharges ?? (p.interestExpense - p.interestOther);
      const net_profit_before_tax = p.netProfitBeforeTax ?? p.netProfitBeforeTaxation ?? 0;
      const taxation = p.taxationMonthly ?? p.taxationCit ?? 0;
      const taxed_profits = p.taxedProfits;
      const dividends = p.dividends ?? p.dividendsDeclared ?? 0;
      const retained_earnings = taxed_profits - dividends;

      const bank_balance_opening = m === 0 ? initialOpeningCash : runningBankClosing;
      const term_loan_balance = p.term_loan_balance ?? p.debtBalance ?? 0;

      const cash_from_operations = net_operating_profit - interest_total - taxation - dividends;
      const inv_change = (p.inventory ?? 0) - (prevP?.inventory ?? 0);
      const ar_change = (p.accounts_receivable ?? 0) - (prevP?.accounts_receivable ?? 0);
      const oa_change = (p.other_assets ?? 0) - (prevP?.other_assets ?? 0);
      const vat_rec_change = (p.vatReceivable ?? 0) - (prevP?.vatReceivable ?? 0);
      const ap_change = (p.accounts_payable ?? 0) - (prevP?.accounts_payable ?? 0);
      const vat_pay_change = (p.vatPayable ?? 0) - (prevP?.vatPayable ?? 0);
      const tax_paid_month = p.taxPayment || 0;
      const change_in_working_capital =
        -inv_change - ar_change - oa_change - vat_rec_change + ap_change + vat_pay_change + (taxation - tax_paid_month);

      const capex =
        (p.vat_fa_purchased ? Math.abs(p.vat_fa_purchased) : 0) ||
        state.fixedAssets?.reduce((sum: number, a: any) => {
          if (a.financeOption !== 'lease' && a.purchaseTiming !== 'prior' && a.purchaseMonth === m + 1) {
            return sum + (a.purchaseValue ?? a.purchaseCost ?? 0);
          }
          return sum;
        }, 0) || 0;

      const dep_writeback = cos_depreciation + ex_depreciation;
      const application_to_capital_assets = dep_writeback - capex;

      const share_capital_change = p.share_capital_additional_raised || 0;
      const equity_loan_change = (p.equity_loan_additional || 0) - (p.equity_loan_repayments || 0);
      const loan_change = (p.term_loan_advance || 0) + (p.term_loan_capital_repayment || 0);
      const change_in_funding = share_capital_change + equity_loan_change + loan_change;

      const cashflow = cash_from_operations + change_in_working_capital + application_to_capital_assets + change_in_funding;
      const bank_balance_closing = bank_balance_opening + cashflow;
      runningBankClosing = bank_balance_closing;

      const fixed_assets_net =
        state.fixedAssets?.reduce((sum: number, a: any) => {
          if (a.financeOption === 'lease') return sum;
          const orig = a.purchaseValue ?? a.purchaseCost ?? (a.unitCost * a.quantity);
          const rate = a.depreciationRate || 20;
          const depPerMonth = (orig * (rate / 100)) / 12;
          const isPrior = a.purchaseTiming === 'prior';
          const monthsElapsed = isPrior
            ? (a.monthsInSystem || 0) + (m + 1)
            : Math.max(0, m + 1 - a.purchaseMonth + 1);
          const cumDep = Math.min(orig, depPerMonth * monthsElapsed);
          return sum + Math.max(0, orig - cumDep);
        }, 0) || 0;

      const inventory = p.inventory ?? 0;
      const accounts_receivable = p.accounts_receivable ?? 0;
      const other_assets = p.other_assets ?? 0;
      const vat_receivable = p.vatReceivable ?? 0;
      const current_assets = inventory + accounts_receivable + other_assets + vat_receivable;
      const total_assets = fixed_assets_net + current_assets;
      const accounts_payable = p.accounts_payable ?? 0;
      const vat_payable = p.vatPayable ?? 0;
      const taxation_payable = p.taxLiability ?? 0;
      const non_interest_bearing_debt = vat_payable + taxation_payable;
      const net_operating_assets = total_assets - non_interest_bearing_debt;

      const ros = revenue > 0 ? (net_operating_profit / revenue) * 100 : 0;
      const assetTurn = net_operating_assets > 0 ? revenue / net_operating_assets : 0;
      const roa = net_operating_assets > 0 ? (net_operating_profit / net_operating_assets) * 100 : 0;

      const priorRetained =
        m === 0
          ? 0
          : projections
              .slice(0, m)
              .reduce((s, item) => s + (item.taxedProfits - (item.dividends ?? item.dividendsDeclared ?? 0)), 0);
      const shEquity = capital + priorRetained + retained_earnings;
      const overdraft = bank_balance_closing < 0 ? Math.abs(bank_balance_closing) : 0;
      const ibd = term_loan_balance + overdraft;
      const roe = shEquity !== 0 ? (taxed_profits / shEquity) * 100 : 0;
      const debtEquity = shEquity !== 0 ? ibd / shEquity : 0;
      const eps = shares_in_issue > 0 ? taxed_profits / shares_in_issue : 0;

      const monthInYear = (m % 12) + 1;
      return {
        monthIndex: m + 1,
        monthInYear,
        year: Math.floor(m / 12) + 1,
        label: `m${monthInYear}`,
        isTotal: false,
        unitSales,
        revenue,
        total_cos,
        cos_variable,
        cos_fixed,
        cos_employment,
        cos_depreciation,
        cos_lease,
        cos_overheads,
        gross_profit,
        gp_adjustments,
        sales_commission,
        inventory_adjustments,
        manufacturing_variance,
        remaining_gp,
        other_inc,
        total_income,
        ex_total,
        ex_variable,
        ex_fixed,
        ex_employment,
        ex_depreciation,
        ex_lease,
        ex_overheads,
        net_operating_profit,
        interest_other,
        interest_tl,
        interest_total,
        net_profit_before_tax,
        taxation,
        taxed_profits,
        dividends,
        retained_earnings,
        shares_in_issue,
        bank_balance_opening,
        bank_balance_closing,
        term_loan_balance,
        cash_from_operations,
        inv_change,
        ar_change,
        oa_change,
        vat_rec_change,
        ap_change,
        vat_pay_change,
        change_in_working_capital,
        capex,
        dep_writeback,
        application_to_capital_assets,
        share_capital_change,
        equity_loan_change,
        loan_change,
        change_in_funding,
        cashflow,
        fixed_assets_net,
        inventory,
        accounts_receivable,
        other_assets,
        vat_receivable,
        current_assets,
        total_assets,
        accounts_payable,
        vat_payable,
        taxation_payable: Math.abs(p.taxLiability ?? 0),
        taxRateUsed: p.taxRateUsed ?? 25,
        profitsBeforeTaxationCumulative: p.cumulativeProfitThisYear ?? 0,
        taxationCumulative: p.taxationCumulative ?? 0,
        taxationMonth: p.taxationMonth ?? -(p.taxationMonthly ?? 0),
        taxOpeningBalance: p.taxOpeningBalance ?? 0,
        taxClosingBalance: p.taxClosingBalance ?? 0,
        taxPayment: p.taxPayment ?? 0,
        taxLiability: p.taxLiability ?? 0,
        vatRate: p.vatRate ?? 15,
        vat_revenue: p.vat_revenue ?? p.revenue ?? 0,
        vat_fa_sold: p.vat_fa_sold ?? 0,
        vat_fa_purchased: p.vat_fa_purchased ?? 0,
        vat_cos: p.vat_cos ?? -(p.totalCos ?? p.cogs ?? 0),
        vat_opex: p.vat_opex ?? -(p.exTotal ?? p.operatingExpenses ?? 0),
        vat_addback_employment: p.vat_addback_employment ?? -(p.employmentExpenses ?? 0),
        vat_addback_depreciation: p.vat_addback_depreciation ?? (p.depreciation ?? 0),
        vatable_amount: p.vatable_amount ?? p.vatableAmount ?? 0,
        vat_calc_value: p.vat_calc_value ?? p.vatCalcValue ?? 0,
        vat_opening_balance: p.vat_opening_balance ?? p.vatOpeningBalance ?? 0,
        vat_account_balance: p.vat_account_balance ?? p.vatCalcValue ?? 0,
        vat_settlement: p.vat_settlement ?? p.vatSettlement ?? 0,
        vat_closing_balance: p.vat_closing_balance ?? p.vatClosingBalance ?? 0,
        non_interest_bearing_debt,
        net_operating_assets,
        cumulative_retained_earnings: priorRetained + retained_earnings,
        ros: Number(ros.toFixed(2)),
        roa: Number(roa.toFixed(2)),
        assetTurn: Number(assetTurn.toFixed(2)),
        roe: Number(roe.toFixed(2)),
        debtEquity: Number(debtEquity.toFixed(2)),
        eps: Number(eps.toFixed(2)),
      };
    });
  }, [projections, state]);

  // Unified Period Calculation: Supports both 12-Month Year View and 5-Year Annual Summary
  const { currentPeriodItems, chartPeriodItems, periodHeaders } = useMemo(() => {
    if (reportHorizonYear === 'summary') {
      const summaryItems = yearData;
      return {
        chartPeriodItems: summaryItems,
        currentPeriodItems: summaryItems,
        periodHeaders: ['year 1', 'year 2', 'year 3', 'year 4', 'year 5'],
      };
    }

    const yrNum = typeof reportHorizonYear === 'number' ? reportHorizonYear : 1;
    const start = (yrNum - 1) * 12;
    const monthsSlice = monthData.slice(start, start + 12);

    const yearTotal = {
      monthIndex: 0,
      monthInYear: 0,
      year: yrNum,
      label: `total y${yrNum}`,
      isTotal: true,
      unitSales: monthsSlice.reduce((s, it) => s + it.unitSales, 0),
      revenue: monthsSlice.reduce((s, it) => s + it.revenue, 0),
      total_cos: monthsSlice.reduce((s, it) => s + it.total_cos, 0),
      cos_variable: monthsSlice.reduce((s, it) => s + it.cos_variable, 0),
      cos_fixed: monthsSlice.reduce((s, it) => s + it.cos_fixed, 0),
      cos_employment: monthsSlice.reduce((s, it) => s + it.cos_employment, 0),
      cos_depreciation: monthsSlice.reduce((s, it) => s + it.cos_depreciation, 0),
      cos_lease: monthsSlice.reduce((s, it) => s + it.cos_lease, 0),
      cos_overheads: monthsSlice.reduce((s, it) => s + it.cos_overheads, 0),
      gross_profit: monthsSlice.reduce((s, it) => s + it.gross_profit, 0),
      gp_adjustments: monthsSlice.reduce((s, it) => s + it.gp_adjustments, 0),
      sales_commission: monthsSlice.reduce((s, it) => s + it.sales_commission, 0),
      inventory_adjustments: monthsSlice.reduce((s, it) => s + it.inventory_adjustments, 0),
      manufacturing_variance: monthsSlice.reduce((s, it) => s + it.manufacturing_variance, 0),
      remaining_gp: monthsSlice.reduce((s, it) => s + it.remaining_gp, 0),
      other_inc: monthsSlice.reduce((s, it) => s + it.other_inc, 0),
      total_income: monthsSlice.reduce((s, it) => s + it.total_income, 0),
      ex_total: monthsSlice.reduce((s, it) => s + it.ex_total, 0),
      ex_variable: monthsSlice.reduce((s, it) => s + it.ex_variable, 0),
      ex_fixed: monthsSlice.reduce((s, it) => s + it.ex_fixed, 0),
      ex_employment: monthsSlice.reduce((s, it) => s + it.ex_employment, 0),
      ex_depreciation: monthsSlice.reduce((s, it) => s + it.ex_depreciation, 0),
      ex_lease: monthsSlice.reduce((s, it) => s + it.ex_lease, 0),
      ex_overheads: monthsSlice.reduce((s, it) => s + it.ex_overheads, 0),
      net_operating_profit: monthsSlice.reduce((s, it) => s + it.net_operating_profit, 0),
      interest_other: monthsSlice.reduce((s, it) => s + it.interest_other, 0),
      interest_tl: monthsSlice.reduce((s, it) => s + it.interest_tl, 0),
      interest_total: monthsSlice.reduce((s, it) => s + it.interest_total, 0),
      net_profit_before_tax: monthsSlice.reduce((s, it) => s + it.net_profit_before_tax, 0),
      taxation: monthsSlice.reduce((s, it) => s + it.taxation, 0),
      taxed_profits: monthsSlice.reduce((s, it) => s + it.taxed_profits, 0),
      dividends: monthsSlice.reduce((s, it) => s + it.dividends, 0),
      retained_earnings: monthsSlice.reduce((s, it) => s + it.retained_earnings, 0),
      shares_in_issue: monthsSlice[11]?.shares_in_issue || 0,
      bank_balance_opening: monthsSlice[0]?.bank_balance_opening || 0,
      bank_balance_closing: monthsSlice[11]?.bank_balance_closing || 0,
      term_loan_balance: monthsSlice[11]?.term_loan_balance || 0,
      cash_from_operations: monthsSlice.reduce((s, it) => s + it.cash_from_operations, 0),
      inv_change: monthsSlice.reduce((s, it) => s + it.inv_change, 0),
      ar_change: monthsSlice.reduce((s, it) => s + it.ar_change, 0),
      oa_change: monthsSlice.reduce((s, it) => s + it.oa_change, 0),
      vat_rec_change: monthsSlice.reduce((s, it) => s + it.vat_rec_change, 0),
      ap_change: monthsSlice.reduce((s, it) => s + it.ap_change, 0),
      vat_pay_change: monthsSlice.reduce((s, it) => s + it.vat_pay_change, 0),
      change_in_working_capital: monthsSlice.reduce((s, it) => s + it.change_in_working_capital, 0),
      capex: monthsSlice.reduce((s, it) => s + it.capex, 0),
      dep_writeback: monthsSlice.reduce((s, it) => s + it.dep_writeback, 0),
      application_to_capital_assets: monthsSlice.reduce((s, it) => s + it.application_to_capital_assets, 0),
      share_capital_change: monthsSlice.reduce((s, it) => s + it.share_capital_change, 0),
      equity_loan_change: monthsSlice.reduce((s, it) => s + it.equity_loan_change, 0),
      loan_change: monthsSlice.reduce((s, it) => s + it.loan_change, 0),
      change_in_funding: monthsSlice.reduce((s, it) => s + it.change_in_funding, 0),
      cashflow: monthsSlice.reduce((s, it) => s + it.cashflow, 0),
      fixed_assets_net: monthsSlice[11]?.fixed_assets_net || 0,
      inventory: monthsSlice[11]?.inventory || 0,
      accounts_receivable: monthsSlice[11]?.accounts_receivable || 0,
      other_assets: monthsSlice[11]?.other_assets || 0,
      vat_receivable: monthsSlice[11]?.vat_receivable || 0,
      current_assets: monthsSlice[11]?.current_assets || 0,
      total_assets: monthsSlice[11]?.total_assets || 0,
      accounts_payable: monthsSlice[11]?.accounts_payable || 0,
      vat_payable: monthsSlice[11]?.vat_payable || 0,
      taxation_payable: monthsSlice[11]?.taxation_payable || 0,
      taxRateUsed: monthsSlice[11]?.taxRateUsed || 25,
      profitsBeforeTaxationCumulative: monthsSlice[11]?.profitsBeforeTaxationCumulative || 0,
      taxationCumulative: monthsSlice[11]?.taxationCumulative || 0,
      taxationMonth: monthsSlice.reduce((s, it) => s + it.taxationMonth, 0),
      taxOpeningBalance: monthsSlice[0]?.taxOpeningBalance || 0,
      taxClosingBalance: monthsSlice[11]?.taxClosingBalance || 0,
      taxPayment: monthsSlice.reduce((s, it) => s + (it.taxPayment || 0), 0),
      taxLiability: monthsSlice[11]?.taxLiability || 0,
      vatRate: monthsSlice[11]?.vatRate || 15,
      vat_revenue: monthsSlice.reduce((s, it) => s + (it.vat_revenue || 0), 0),
      vat_fa_sold: 0,
      vat_fa_purchased: monthsSlice.reduce((s, it) => s + (it.vat_fa_purchased || 0), 0),
      vat_cos: monthsSlice.reduce((s, it) => s + (it.vat_cos || 0), 0),
      vat_opex: monthsSlice.reduce((s, it) => s + (it.vat_opex || 0), 0),
      vat_addback_employment: monthsSlice.reduce((s, it) => s + (it.vat_addback_employment || 0), 0),
      vat_addback_depreciation: monthsSlice.reduce((s, it) => s + (it.vat_addback_depreciation || 0), 0),
      vatable_amount: monthsSlice.reduce((s, it) => s + (it.vatable_amount || 0), 0),
      vat_calc_value: monthsSlice.reduce((s, it) => s + (it.vat_calc_value || 0), 0),
      vat_opening_balance: monthsSlice[0]?.vat_opening_balance || 0,
      vat_account_balance: monthsSlice[11]?.vat_account_balance || 0,
      vat_settlement: monthsSlice.reduce((s, it) => s + (it.vat_settlement || 0), 0),
      vat_closing_balance: monthsSlice[11]?.vat_closing_balance || 0,
      non_interest_bearing_debt: monthsSlice[11]?.non_interest_bearing_debt || 0,
      net_operating_assets: monthsSlice[11]?.net_operating_assets || 0,
      cumulative_retained_earnings: monthsSlice[11]?.cumulative_retained_earnings || 0,
      ros: Number(((monthsSlice.reduce((s, it) => s + it.net_operating_profit, 0) / (monthsSlice.reduce((s, it) => s + it.revenue, 0) || 1)) * 100).toFixed(2)),
      roa: Number(((monthsSlice.reduce((s, it) => s + it.net_operating_profit, 0) / (monthsSlice[11]?.net_operating_assets || 1)) * 100).toFixed(2)),
      assetTurn: Number((monthsSlice.reduce((s, it) => s + it.revenue, 0) / (monthsSlice[11]?.net_operating_assets || 1)).toFixed(2)),
      roe: monthsSlice[11]?.roe || 0,
      debtEquity: monthsSlice[11]?.debtEquity || 0,
      eps: Number((monthsSlice.reduce((s, it) => s + it.taxed_profits, 0) / (monthsSlice[11]?.shares_in_issue || 100000)).toFixed(2)),
    };

    return {
      chartPeriodItems: monthsSlice,
      currentPeriodItems: [...monthsSlice, yearTotal],
      periodHeaders: [
        'm1',
        'm2',
        'm3',
        'm4',
        'm5',
        'm6',
        'm7',
        'm8',
        'm9',
        'm10',
        'm11',
        'm12',
        `total y${yrNum}`,
      ],
    };
  }, [reportHorizonYear, yearData, monthData]);

  // Unified report columns for Liquidity breakdown
  const reportColumns = useMemo(() => {
    return currentPeriodItems.map((c) => ({
      id: c.label,
      label: c.label,
      isTotal: !!c.isTotal,
      bank_balance_closing: c.bank_balance_closing,
      term_loan_balance: c.term_loan_balance,
    }));
  }, [currentPeriodItems]);

  const years = [1, 2, 3, 4, 5];
  const formatNumeric = (val: number): string => {
    if (isNaN(val) || Math.abs(val) < 0.0001) return '0';
    return Math.round(val).toLocaleString();
  };

  const getDistVal = (id: string, yr: (typeof yearData)[0]): number => {
    if (id === 'unit_sales') return yr.unitSales;
    if (id === 'rev') return yr.revenue;
    if (id === 'cos') return yr.total_cos;
    if (id === 'cos_var') return yr.cos_variable;
    if (id === 'cos_fixed') return yr.cos_fixed;
    if (id === 'staff_cos') return yr.cos_employment;
    if (id === 'dep_cos') return yr.cos_depreciation;
    if (id === 'lease_cos') return yr.cos_lease;
    if (id === 'oh_cos') return yr.cos_overheads;
    if (id === 'gp') return yr.gross_profit;
    if (id === 'gp_adj') return yr.gp_adjustments;
    if (id === 'rem_gp') return yr.remaining_gp;
    if (id === 'other_inc') return yr.other_inc;
    if (id === 'total_inc') return yr.total_income;
    if (id === 'expenses') return yr.ex_total;
    if (id === 'ex_var') return yr.ex_variable;
    if (id === 'ex_fixed') return yr.ex_fixed;
    if (id === 'staff_ex') return yr.ex_employment;
    if (id === 'dep_ex') return yr.ex_depreciation;
    if (id === 'lease_ex') return yr.ex_lease;
    if (id === 'oh_ex') return yr.ex_overheads;
    if (id === 'nop') return yr.net_operating_profit;
    return 0;
  };

  return (
    <div className={`space-y-6 font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* =================================================================== */}
      {/* HEADER BAR (Matching Employment Standard)                           */}
      {/* =================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold uppercase tracking-tight text-slate-900 dark:text-white">
              FINANCIAL REPORTS & PROJECTIONS
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-[#2E5E88]/10 text-[#2E5E88] dark:text-[#5584B4]">
              {mode}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            5-Year integrated financial statements, trading account distribution, cash flows, and key ratio analysis.
          </p>
        </div>
      </div>

      {/* Reports Navigation Carousel & Horizon Filter */}
      <ReportsCarousel
        theme={theme}
        activeReportTab={activeReportTab}
        onSelectReportTab={setActiveReportTab}
        reportHorizonYear={reportHorizonYear}
        onSelectHorizonYear={setReportHorizonYear}
      />

      {/* =================================================================== */}
      {/* 1. EXECUTIVE SUMMARY (CHARTS + KEY RATIOS TABLE)                    */}
      {/* =================================================================== */}
      {activeReportTab === 'summary' && (() => {
        const capital =
          (state.funding?.founderEquity || 0) +
          (state.funding?.investorEquity || 0);

        const totalEmployees =
          state.employmentItems?.reduce(
            (sum, e) => sum + (e.numEmployees || 0),
            0
          ) || 1;

        // Dual-Axis Chart Data 1: Efficiency Trajectory (ROS % & ROA % vs Asset Turn x)
        const efficiencyData: EfficiencyChartDataPoint[] = chartPeriodItems.map((it, idx) => {
          const rev = it.revenue || 1;
          const noa = it.net_operating_assets || 1;
          const nop = it.net_operating_profit;
          const ros = (nop / rev) * 100;
          const assetTurn = rev / noa;
          const roa = (nop / noa) * 100;
          return {
            year: it.year || idx + 1,
            label: it.label,
            ros: Number(ros.toFixed(2)),
            roa: Number(roa.toFixed(2)),
            assetTurn: Number(assetTurn.toFixed(2)),
          };
        });

        // Multi-Metric Chart Data 2: Capital Structure & Returns (ROE %, Debt/Equity x, EPS)
        const returnsData: ReturnsChartDataPoint[] = chartPeriodItems.map((it, idx) => {
          return {
            year: it.year || idx + 1,
            label: it.label,
            roe: Number(it.roe.toFixed(2)),
            debtEquity: Number(it.debtEquity.toFixed(2)),
            eps: Number(it.eps.toFixed(2)),
          };
        });

        // V1 Key Ratios Table line items matching key_ratios_74f218cb.png
        const executiveSummaryRows: BizzReportTableRow[] = [
          // 1. MARGINS
          { label: 'margins', isSectionHeader: true },
          {
            label: 'gross profit %',
            values: currentPeriodItems.map((it) => {
              return it.revenue > 0
                ? `${((it.gross_profit / it.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'other income %',
            values: currentPeriodItems.map((it) => {
              return it.revenue > 0
                ? `${((it.other_inc / it.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'total income %',
            highlight: true,
            values: currentPeriodItems.map((it) => {
              return it.revenue > 0
                ? `${((it.total_income / it.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'expenses %',
            values: currentPeriodItems.map((it) => {
              return it.revenue > 0
                ? `${((it.ex_total / it.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'net operating profit %',
            highlight: true,
            values: currentPeriodItems.map((it) => {
              return it.revenue > 0
                ? `${((it.net_operating_profit / it.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'interest %',
            values: currentPeriodItems.map((it) => {
              return it.revenue > 0
                ? `${((it.interest_total / it.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'taxation %',
            values: currentPeriodItems.map((it) => {
              return it.revenue > 0
                ? `${((it.taxation / it.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'taxed profits %',
            highlight: true,
            values: currentPeriodItems.map((it) => {
              return it.revenue > 0
                ? `${((it.taxed_profits / it.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },

          // 2. EFFICIENCY (RED BOX ELEMENTS)
          { label: 'efficiency', isSectionHeader: true },
          {
            label: 'return on sales',
            highlight: true,
            values: currentPeriodItems.map((it) => {
              return it.revenue > 0
                ? `${((it.net_operating_profit / it.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'asset turn',
            highlight: true,
            values: currentPeriodItems.map((it) => {
              const noa = it.net_operating_assets || 1;
              return `${(it.revenue / noa).toFixed(2)}`;
            }),
          },
          {
            label: 'return on net operating assets',
            highlight: true,
            values: currentPeriodItems.map((it) => {
              const noa = it.net_operating_assets || 1;
              return `${((it.net_operating_profit / noa) * 100).toFixed(1)}%`;
            }),
          },
          {
            label: 'expense / income ratio',
            values: currentPeriodItems.map((it) => {
              const totInc = it.total_income || 1;
              return `${((it.ex_total / totInc) * 100).toFixed(1)}%`;
            }),
          },
          {
            label: 'interest cover',
            values: currentPeriodItems.map((it) => {
              if (it.interest_total <= 0) return 'n/a';
              return `${(it.net_operating_profit / it.interest_total).toFixed(2)}`;
            }),
          },
          {
            label: 'expense cover (mts)',
            values: currentPeriodItems.map((it) => {
              const monthlyExp = (it.ex_total || 1) / (it.isTotal && reportHorizonYear === 'summary' ? 60 : 12);
              return `${(it.bank_balance_closing / Math.max(1, monthlyExp)).toFixed(1)}`;
            }),
          },
          {
            label: 'return on equity',
            highlight: true,
            values: currentPeriodItems.map((it) => {
              return `${it.roe.toFixed(1)}%`;
            }),
          },
          {
            label: 'debt / equity ratio',
            highlight: true,
            values: currentPeriodItems.map((it) => {
              return `${it.debtEquity.toFixed(2)}`;
            }),
          },
          {
            label: 'earnings per share',
            highlight: true,
            values: currentPeriodItems.map((it) => {
              const eps = it.eps;
              return eps >= 0 ? `${eps.toFixed(2)}` : `-${Math.abs(eps).toFixed(2)}`;
            }),
          },

          // 3. PRODUCTIVITY
          { label: 'productivity', isSectionHeader: true },
          {
            label: 'number of employees',
            values: currentPeriodItems.map(() => totalEmployees),
          },
          {
            label: 'employee revenue',
            values: currentPeriodItems.map((it) =>
              Math.round(it.revenue / totalEmployees)
            ),
          },
          {
            label: 'employee gross profit',
            values: currentPeriodItems.map((it) =>
              Math.round(it.gross_profit / totalEmployees)
            ),
          },
          {
            label: 'employee total income',
            values: currentPeriodItems.map((it) =>
              Math.round(it.total_income / totalEmployees)
            ),
          },
          {
            label: 'employee expenses',
            values: currentPeriodItems.map((it) =>
              Math.round(it.ex_total / totalEmployees)
            ),
          },
          {
            label: 'employee nop',
            highlight: true,
            values: currentPeriodItems.map((it) =>
              Math.round(it.net_operating_profit / totalEmployees)
            ),
          },
        ];

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Chart 1: Dual-Axis Efficiency Trajectory (Red Box 1: ROS & ROA vs Asset Turn) */}
            <ExecutiveEfficiencyChart
              data={efficiencyData}
              isDark={isDark}
              title={
                reportHorizonYear === 'summary'
                  ? '1. EFFICIENCY TRAJECTORY: RETURN ON SALES (ROS) & ROA VS ASSET TURN (5-YEAR SUMMARY)'
                  : `1. EFFICIENCY TRAJECTORY: RETURN ON SALES (ROS) & ROA VS ASSET TURN (YEAR ${reportHorizonYear} - 12 MONTHS)`
              }
            />

            {/* Chart 2: Capital Structure & Shareholder Returns (Red Box 2: ROE, Debt/Equity & EPS) */}
            <ExecutiveReturnsChart
              data={returnsData}
              isDark={isDark}
              currencyPrefix=""
              title={
                reportHorizonYear === 'summary'
                  ? '2. CAPITAL STRUCTURE & SHAREHOLDER VALUE: RETURN ON EQUITY, DEBT/EQUITY & EPS (5-YEAR SUMMARY)'
                  : `2. CAPITAL STRUCTURE & SHAREHOLDER VALUE: RETURN ON EQUITY, DEBT/EQUITY & EPS (YEAR ${reportHorizonYear} - 12 MONTHS)`
              }
            />

            {/* Complete Key Ratios Report Table */}
            <BizzReportTable
              title="key ratios"
              firstColumnLabel="key ratios"
              years={years}
              columns={periodHeaders}
              rows={executiveSummaryRows}
              isDark={isDark}
            />
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* 3. TRADING ACCOUNT (TRADING SUMMARY + EMBEDDED BREAKEVEN)           */}
      {/* =================================================================== */}
      {activeReportTab === 'trading-account' && (() => {
        const tradingSummaryRows: BizzReportTableRow[] = [
          { label: 'unit sales', values: currentPeriodItems.map((it) => it.unitSales) },
          { label: 'revenue', highlight: true, values: currentPeriodItems.map((it) => it.revenue) },
          { label: 'cost of sales', highlight: true, values: currentPeriodItems.map((it) => -it.total_cos) },
          { label: 'cost of sales - variable', values: currentPeriodItems.map((it) => -it.cos_variable) },
          { label: 'cost of sales - fixed', highlight: true, values: currentPeriodItems.map((it) => -it.cos_fixed) },
          { label: 'employment', indent: true, values: currentPeriodItems.map((it) => -it.cos_employment) },
          { label: 'depreciation', indent: true, values: currentPeriodItems.map((it) => -it.cos_depreciation) },
          { label: 'lease', indent: true, values: currentPeriodItems.map((it) => -it.cos_lease) },
          { label: 'overheads', indent: true, values: currentPeriodItems.map((it) => -it.cos_overheads) },
          { label: 'gross profit', highlight: true, values: currentPeriodItems.map((it) => it.gross_profit) },
          { label: 'gross profit adjustments', values: currentPeriodItems.map((it) => -it.gp_adjustments) },
          { label: 'remaining gross profit', highlight: true, values: currentPeriodItems.map((it) => it.remaining_gp) },
          { label: 'other income', values: currentPeriodItems.map((it) => it.other_inc) },
          { label: 'total income', highlight: true, values: currentPeriodItems.map((it) => it.total_income) },
          { label: 'expenses - total', highlight: true, values: currentPeriodItems.map((it) => -it.ex_total) },
          { label: 'expenses - variable', values: currentPeriodItems.map((it) => -it.ex_variable) },
          { label: 'expenses - fixed', highlight: true, values: currentPeriodItems.map((it) => -it.ex_fixed) },
          { label: 'employment', indent: true, values: currentPeriodItems.map((it) => -it.ex_employment) },
          { label: 'depreciation', indent: true, values: currentPeriodItems.map((it) => -it.ex_depreciation) },
          { label: 'lease', indent: true, values: currentPeriodItems.map((it) => -it.ex_lease) },
          { label: 'overheads', indent: true, values: currentPeriodItems.map((it) => -it.ex_overheads) },
          { label: 'net operating profit', highlight: true, values: currentPeriodItems.map((it) => it.net_operating_profit) },
        ];

        // Embedded Breakeven Analysis (per user request: treated as part of trading account)
        const breakevenRows: BizzReportTableRow[] = [
          { label: 'turnover', values: currentPeriodItems.map((it) => it.revenue) },
          { label: 'expenses - fixed', values: currentPeriodItems.map((it) => it.cos_fixed + it.ex_fixed) },
          {
            label: 'gross profit %',
            formatValue: (val) => formatReportPercent(val),
            values: currentPeriodItems.map((it) => {
              return it.revenue > 0 ? (it.gross_profit / it.revenue) * 100 : 0;
            }),
          },
          {
            label: 'breakeven turnover',
            highlight: true,
            values: currentPeriodItems.map((it) => {
              const fixedTotal = it.cos_fixed + it.ex_fixed;
              const gpMargin = it.revenue > 0 ? it.gross_profit / it.revenue : 0;
              return gpMargin > 0 ? Math.round(fixedTotal / gpMargin) : 0;
            }),
          },
        ];

        return (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* 1. Trading Summary Table */}
            <BizzReportTable
              title={
                reportHorizonYear === 'summary'
                  ? 'trading summary (5-year summary)'
                  : `trading summary (year ${reportHorizonYear} - 12 months)`
              }
              firstColumnLabel="account line"
              years={years}
              columns={periodHeaders}
              rows={tradingSummaryRows}
              isDark={isDark}
            />

            {/* 2. Breakeven Table (Integrated directly into Trading Account view) */}
            <BizzReportTable
              title={
                reportHorizonYear === 'summary'
                  ? 'breakeven (5-year summary)'
                  : `breakeven (year ${reportHorizonYear} - 12 months)`
              }
              firstColumnLabel="account line"
              years={years}
              columns={periodHeaders}
              rows={breakevenRows}
              isDark={isDark}
            />

            {/* 3. Gross Profit Adjustments Details Sub-Table */}
            <div className="pt-2" id="gp-adjustments-report-section">
              <BizzReportTable
                title={
                  reportHorizonYear === 'summary'
                    ? 'gross profit adjustments details (5-year summary)'
                    : `gross profit adjustments details (year ${reportHorizonYear} - 12 months)`
                }
                firstColumnLabel="gross profit adjustments"
                years={years}
                columns={periodHeaders}
                rows={[
                  { label: 'sales commission', values: currentPeriodItems.map((it) => it.sales_commission) },
                  { label: 'inventory adjustments', values: currentPeriodItems.map((it) => it.inventory_adjustments) },
                  { label: 'manufacturing variance', values: currentPeriodItems.map((it) => it.manufacturing_variance) },
                  { label: 'gross profit adjustments', highlight: true, values: currentPeriodItems.map((it) => it.gp_adjustments) },
                ]}
                isDark={isDark}
              />
            </div>
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* 4. TRADING ACCOUNT DISTRIBUTION                                     */}
      {/* =================================================================== */}
      {activeReportTab === 'trading-distribution' && (() => {
        const getDistPct = (val: number, revenue: number, isNeg: boolean = false) => {
          if (!revenue || revenue === 0) return 0;
          const computedVal = isNeg && val > 0 ? -val : val;
          return (computedVal / revenue) * 100;
        };

        const distRows: BizzReportTableRow[] = [
          { label: 'cost of sales', highlight: true, formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.total_cos, it.revenue, true)) },
          { label: 'cost of sales - variable', formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.cos_variable, it.revenue, true)) },
          { label: 'cost of sales - fixed', highlight: true, formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.cos_fixed, it.revenue, true)) },
          { label: 'employment', indent: true, formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.cos_employment, it.revenue, true)) },
          { label: 'depreciation', indent: true, formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.cos_depreciation, it.revenue, true)) },
          { label: 'lease', indent: true, formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.cos_lease, it.revenue, true)) },
          { label: 'overheads', indent: true, formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.cos_overheads, it.revenue, true)) },
          { label: 'gross profit', highlight: true, formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.gross_profit, it.revenue, false)) },
          { label: 'gross profit adjustments', formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.gp_adjustments, it.revenue, true)) },
          { label: 'remaining gross profit', highlight: true, formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.remaining_gp, it.revenue, false)) },
          { label: 'other income', formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.other_inc, it.revenue, false)) },
          { label: 'total income', highlight: true, formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.total_income, it.revenue, false)) },
          { label: 'expenses - total', highlight: true, formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.ex_total, it.revenue, true)) },
          { label: 'expenses - variable', formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.ex_variable, it.revenue, true)) },
          { label: 'expenses - fixed', highlight: true, formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.ex_fixed, it.revenue, true)) },
          { label: 'employment', indent: true, formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.ex_employment, it.revenue, true)) },
          { label: 'depreciation', indent: true, formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.ex_depreciation, it.revenue, true)) },
          { label: 'lease', indent: true, formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.ex_lease, it.revenue, true)) },
          { label: 'overheads', indent: true, formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.ex_overheads, it.revenue, true)) },
          { label: 'net operating profit', highlight: true, formatValue: (v) => formatReportPercent(v), values: currentPeriodItems.map((it) => getDistPct(it.net_operating_profit, it.revenue, false)) },
        ];

        return (
          <div className="animate-in fade-in duration-200">
            <BizzReportTable
              title={
                reportHorizonYear === 'summary'
                  ? 'trading summary - distribution (5-year summary)'
                  : `trading summary - distribution (year ${reportHorizonYear} - 12 months)`
              }
              firstColumnLabel="account line"
              years={years}
              columns={periodHeaders}
              rows={distRows}
              isDark={isDark}
            />
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* 5. INCOME STATEMENT                                                 */}
      {/* =================================================================== */}
      {activeReportTab === 'income-statement' && (() => {
        const incomeStatementRows: BizzReportTableRow[] = [
          { label: 'revenue', values: currentPeriodItems.map((it) => it.revenue) },
          { label: 'net operating profit', highlight: true, values: currentPeriodItems.map((it) => it.net_operating_profit) },
          { label: 'interest - other', indent: true, values: currentPeriodItems.map((it) => it.interest_other) },
          { label: 'interest - term loan', indent: true, values: currentPeriodItems.map((it) => -it.interest_tl) },
          { label: 'interest', highlight: true, values: currentPeriodItems.map((it) => -it.interest_total) },
          { label: 'net profit', highlight: true, values: currentPeriodItems.map((it) => it.net_profit_before_tax) },
          { label: 'profit / loss on sale of fixed assets', values: currentPeriodItems.map(() => 0) },
          { label: 'net profit before taxation', highlight: true, values: currentPeriodItems.map((it) => it.net_profit_before_tax) },
          { label: 'taxation', values: currentPeriodItems.map((it) => it.taxationMonth) },
          { label: 'taxed profits', highlight: true, values: currentPeriodItems.map((it) => it.taxed_profits) },
          { label: 'dividends', values: currentPeriodItems.map((it) => -it.dividends) },
          { label: 'retained earnings', highlight: true, values: currentPeriodItems.map((it) => it.retained_earnings) },
        ];

        const taxCalculationRows: BizzReportTableRow[] = [
          {
            label: 'tax rate',
            values: currentPeriodItems.map((it) => `${(it.taxRateUsed ?? 25).toFixed(2)}%`),
          },
          {
            label: 'profits before taxation',
            values: currentPeriodItems.map((it) => it.profitsBeforeTaxationCumulative),
          },
          {
            label: 'taxation - cumulative',
            values: currentPeriodItems.map((it) => (it.taxationCumulative !== 0 ? it.taxationCumulative : '')),
          },
          {
            label: 'taxation - month',
            highlight: true,
            values: currentPeriodItems.map((it) => it.taxationMonth),
          },
        ];

        const taxBalanceSheetRows: BizzReportTableRow[] = [
          {
            label: 'opening balance',
            values: currentPeriodItems.map((it) => (it.taxOpeningBalance !== 0 ? it.taxOpeningBalance : '')),
          },
          {
            label: 'taxation',
            values: currentPeriodItems.map((it) => it.taxationMonth),
          },
          {
            label: 'closing balance',
            values: currentPeriodItems.map((it) => (it.taxClosingBalance !== 0 ? it.taxClosingBalance : '')),
          },
          {
            label: 'tax payments',
            values: currentPeriodItems.map((it) => (it.taxPayment > 0 ? it.taxPayment : '')),
          },
          {
            label: 'tax liability',
            highlight: true,
            values: currentPeriodItems.map((it) => (it.taxLiability !== 0 ? it.taxLiability : '')),
          },
        ];

        const currentTaxCycle = state.businessDetails?.taxPaymentCycle || 'monthly';

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            <BizzReportTable
              title={
                reportHorizonYear === 'summary'
                  ? 'income statement (5-year summary)'
                  : `income statement (year ${reportHorizonYear} - 12 months)`
              }
              firstColumnLabel="period"
              years={years}
              columns={periodHeaders}
              rows={incomeStatementRows}
              isDark={isDark}
            />

            {/* Tax Calculation Schedule (matching tax calculation.PNG) */}
            <BizzReportTable
              title="tax calculation"
              firstColumnLabel="tax calculation"
              years={years}
              columns={periodHeaders}
              rows={taxCalculationRows}
              isDark={isDark}
            />

            {/* Tax on Balance Sheet Schedule (matching tax calculation.PNG) */}
            <BizzReportTable
              title="tax on balance sheet"
              firstColumnLabel="tax on balance sheet"
              years={years}
              columns={periodHeaders}
              rows={taxBalanceSheetRows}
              isDark={isDark}
              extraHeaderContent={
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                  payment cycle: {currentTaxCycle}
                </span>
              }
            />
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* 6. BALANCE SHEET                                                    */}
      {/* =================================================================== */}
      {activeReportTab === 'balance-sheet' && (() => {
        const capital =
          (state.funding?.founderEquity || 0) + (state.funding?.investorEquity || 0);
        const capitalVal = capital;
        const equityLoanVal = (state.funding as any)?.equityLoan || 0;

        // Pre-calculate financed side series according to explicit balance sheet formulae
        const shCapitalValues = currentPeriodItems.map(() => (capitalVal !== 0 ? -Math.abs(capitalVal) : 0));
        const equityLoanValues = currentPeriodItems.map(() => (equityLoanVal !== 0 ? -Math.abs(equityLoanVal) : 0));

        const isSummaryView = reportHorizonYear === 'summary';
        const activeYearNum = typeof reportHorizonYear === 'number' ? reportHorizonYear : 1;

        // Prior year-end cumulative retained earnings for monthly view:
        const priorYearsRetained =
          !isSummaryView && activeYearNum > 1
            ? yearData
                .slice(0, activeYearNum - 1)
                .reduce((s, yr) => s + yr.retained_earnings, 0)
            : 0;

        // Compute running cumulative retained earnings within the current year for monthly view
        let runningCurrentYearRetained = 0;
        const cumulativeMonthlyRetained = currentPeriodItems.map((it) => {
          if (it.isTotal) {
            return runningCurrentYearRetained;
          }
          runningCurrentYearRetained += it.retained_earnings;
          return runningCurrentYearRetained;
        });

        const priorRetainedValues = currentPeriodItems.map((it, idx) => {
          if (isSummaryView) {
            const prior = it.cumulative_retained_earnings - it.retained_earnings;
            return idx === 0 && !it.isTotal && prior === 0 ? '' : prior !== 0 ? -prior : '';
          }
          return priorYearsRetained !== 0 ? -priorYearsRetained : '';
        });

        const currentRetainedValues = currentPeriodItems.map((it, idx) => {
          if (isSummaryView) {
            return -it.retained_earnings;
          }
          const cumVal = cumulativeMonthlyRetained[idx];
          return cumVal !== 0 ? -cumVal : 0;
        });

        const shEquityValues = currentPeriodItems.map((_, idx) => {
          const priorVal = typeof priorRetainedValues[idx] === 'number' ? (priorRetainedValues[idx] as number) : 0;
          const curVal = typeof currentRetainedValues[idx] === 'number' ? (currentRetainedValues[idx] as number) : 0;
          const capPart = capitalVal !== 0 ? -Math.abs(capitalVal) : 0;
          const eqLoanPart = equityLoanVal !== 0 ? -Math.abs(equityLoanVal) : 0;
          return capPart + eqLoanPart + priorVal + curVal;
        });

        const capitalEmployedValues = currentPeriodItems.map((it) => -it.net_operating_assets);

        const ibdValues = currentPeriodItems.map((it, idx) => {
          const capEmployed = capitalEmployedValues[idx];
          const shEquity = shEquityValues[idx];
          return capEmployed - shEquity;
        });

        const termLoanValues = currentPeriodItems.map((it) => {
          const tl = it.term_loan_balance || (state.funding?.bankLoanAmount || 0);
          return -Math.abs(tl);
        });

        const bankBalanceValues = currentPeriodItems.map((it) => it.bank_balance_closing);

        const balanceSheetRows: BizzReportTableRow[] = [
          { label: 'fixed assets', values: currentPeriodItems.map((it) => it.fixed_assets_net) },
          { label: 'inventory', indent: true, values: currentPeriodItems.map((it) => it.inventory) },
          { label: 'accounts receivables', indent: true, values: currentPeriodItems.map((it) => it.accounts_receivable) },
          { label: 'other assets', indent: true, values: currentPeriodItems.map((it) => it.other_assets) },
          { label: 'vat receivable', indent: true, values: currentPeriodItems.map((it) => it.vat_receivable) },
          {
            label: 'current assets',
            highlight: true,
            values: currentPeriodItems.map((it) => it.current_assets),
          },
          {
            label: 'total assets',
            highlight: true,
            values: currentPeriodItems.map((it) => it.total_assets),
          },
          {
            label: 'non-interest bearing debt',
            highlight: true,
            values: currentPeriodItems.map((it) => -Math.abs(it.non_interest_bearing_debt)),
          },
          {
            label: 'accounts payables',
            indent: true,
            values: currentPeriodItems.map((it) => (it.accounts_payable ? -Math.abs(it.accounts_payable) : (it.accounts_payable === 0 ? 0 : ''))),
          },
          {
            label: 'vat payable',
            indent: true,
            values: currentPeriodItems.map((it) => (it.vat_payable ? -Math.abs(it.vat_payable) : '')),
          },
          {
            label: 'taxation payable',
            indent: true,
            values: currentPeriodItems.map((it) => (it.taxation_payable ? -Math.abs(it.taxation_payable) : '')),
          },
          {
            label: 'net operating assets',
            highlight: true,
            values: currentPeriodItems.map((it) => it.net_operating_assets),
          },
          { label: 'financed by', isSectionHeader: true },
          { label: 'shares in issue', values: currentPeriodItems.map((it) => it.shares_in_issue || 0) },
          { label: "shareholders' capital", values: shCapitalValues },
          { label: 'equity loan', values: equityLoanValues },
          {
            label: 'retained earnings - prior',
            values: priorRetainedValues,
          },
          {
            label: 'retained earnings - current',
            values: currentRetainedValues,
          },
          {
            label: "shareholders' equity",
            highlight: true,
            values: shEquityValues,
          },
          {
            label: 'bank balance',
            values: bankBalanceValues,
          },
          {
            label: 'term loan',
            values: termLoanValues,
          },
          {
            label: 'interest bearing debt',
            highlight: true,
            values: ibdValues,
          },
          {
            label: 'capital employed',
            highlight: true,
            values: capitalEmployedValues,
          },
        ];

        const taxBalanceSheetRows: BizzReportTableRow[] = [
          {
            label: 'opening balance',
            values: currentPeriodItems.map((it) => (it.taxOpeningBalance !== 0 ? it.taxOpeningBalance : '')),
          },
          {
            label: 'taxation',
            values: currentPeriodItems.map((it) => it.taxationMonth),
          },
          {
            label: 'closing balance',
            values: currentPeriodItems.map((it) => (it.taxClosingBalance !== 0 ? it.taxClosingBalance : '')),
          },
          {
            label: 'tax payments',
            values: currentPeriodItems.map((it) => (it.taxPayment > 0 ? it.taxPayment : '')),
          },
          {
            label: 'tax liability (taxation payable)',
            highlight: true,
            values: currentPeriodItems.map((it) => (it.taxLiability !== 0 ? it.taxLiability : '')),
          },
        ];

        const vatCalculationRows: BizzReportTableRow[] = [
          {
            label: 'vat rate',
            values: currentPeriodItems.map((it) => `${(it.vatRate || 15).toFixed(2)}%`),
          },
          {
            label: 'revenue',
            values: currentPeriodItems.map((it) => (it.vat_revenue ? it.vat_revenue : (it.revenue ? it.revenue : ''))),
          },
          {
            label: 'fixed assets sold',
            values: currentPeriodItems.map((it) => (it.vat_fa_sold ? it.vat_fa_sold : '')),
          },
          {
            label: 'fixed assets purchased',
            values: currentPeriodItems.map((it) => (it.vat_fa_purchased ? it.vat_fa_purchased : '')),
          },
          {
            label: 'cost of sales',
            values: currentPeriodItems.map((it) => (it.vat_cos ? it.vat_cos : '')),
          },
          {
            label: 'operating expenses',
            values: currentPeriodItems.map((it) => (it.vat_opex ? it.vat_opex : '')),
          },
          {
            label: 'add back - employment',
            values: currentPeriodItems.map((it) => (it.vat_addback_employment ? it.vat_addback_employment : '')),
          },
          {
            label: 'add back - depreciation',
            values: currentPeriodItems.map((it) => (it.vat_addback_depreciation ? it.vat_addback_depreciation : '')),
          },
          {
            label: 'vatable amount',
            highlight: true,
            values: currentPeriodItems.map((it) => (it.vatable_amount !== 0 ? it.vatable_amount : '')),
          },
          {
            label: 'vat',
            highlight: true,
            values: currentPeriodItems.map((it) => (it.vat_calc_value !== 0 ? it.vat_calc_value : '')),
          },
        ];

        const vatPaymentsRows: BizzReportTableRow[] = [
          {
            label: 'opening balance',
            values: currentPeriodItems.map((it) => (it.vat_opening_balance !== 0 ? it.vat_opening_balance : '')),
          },
          {
            label: 'account balance',
            values: currentPeriodItems.map((it) => (it.vat_account_balance !== 0 ? it.vat_account_balance : '')),
          },
          {
            label: 'settlement',
            values: currentPeriodItems.map((it) => (it.vat_settlement !== 0 ? it.vat_settlement : '')),
          },
          {
            label: 'closing balance',
            highlight: true,
            values: currentPeriodItems.map((it) => (it.vat_closing_balance !== 0 ? it.vat_closing_balance : '')),
          },
          {
            label: 'vat receivable',
            values: currentPeriodItems.map((it) => (it.vat_closing_balance > 0 ? it.vat_closing_balance : '')),
          },
          {
            label: 'vat payable',
            values: currentPeriodItems.map((it) => (it.vat_closing_balance < 0 ? it.vat_closing_balance : '')),
          },
        ];

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            <BizzReportTable
              title={
                reportHorizonYear === 'summary'
                  ? 'balance sheet (5-year summary)'
                  : `balance sheet (year ${reportHorizonYear} - 12 months)`
              }
              firstColumnLabel="period"
              years={years}
              columns={periodHeaders}
              rows={balanceSheetRows}
              isDark={isDark}
            />

            {/* Tax on Balance Sheet Schedule (matching tax calculation.PNG & tax payment cycle.PNG) */}
            <BizzReportTable
              title="tax on balance sheet (corporate tax liability schedule)"
              firstColumnLabel="tax line"
              years={years}
              columns={periodHeaders}
              rows={taxBalanceSheetRows}
              isDark={isDark}
              extraHeaderContent={
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                  payment cycle: {state.businessDetails?.taxPaymentCycle || 'monthly'}
                </span>
              }
            />

            {/* VAT Calculation Table (matching vat calculation.PNG) */}
            <BizzReportTable
              title="vat calculation"
              firstColumnLabel="vat calculation line"
              years={years}
              columns={periodHeaders}
              rows={vatCalculationRows}
              isDark={isDark}
              extraHeaderContent={
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  standard rate: 15.00%
                </span>
              }
            />

            {/* VAT Payments Table (matching vat calculation.PNG) */}
            <BizzReportTable
              title="vat payments (balance sheet ledger)"
              firstColumnLabel="vat payment line"
              years={years}
              columns={periodHeaders}
              rows={vatPaymentsRows}
              isDark={isDark}
            />
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* 7. CASH FLOW STATEMENT                                              */}
      {/* =================================================================== */}
      {activeReportTab === 'cash-flow' && (() => {
        const cashFlowRows: BizzReportTableRow[] = [
          { label: 'bank balance - opening', values: currentPeriodItems.map((it) => it.bank_balance_opening) },
          { label: 'net operating profit', values: currentPeriodItems.map((it) => it.net_operating_profit) },
          { label: 'interest - other', indent: true, values: currentPeriodItems.map((it) => it.interest_other) },
          { label: 'interest - term loan', indent: true, values: currentPeriodItems.map((it) => -it.interest_tl) },
          { label: 'interest', highlight: true, values: currentPeriodItems.map((it) => -it.interest_total) },
          { label: 'sub total', highlight: true, values: currentPeriodItems.map((it) => it.net_operating_profit - it.interest_total) },
          { label: 'profit / loss on sale of fixed assets', values: currentPeriodItems.map(() => 0) },
          { label: 'taxation', values: currentPeriodItems.map((it) => -it.taxation) },
          { label: 'dividends', values: currentPeriodItems.map((it) => -it.dividends) },
          { label: 'cash from operations', highlight: true, values: currentPeriodItems.map((it) => it.cash_from_operations) },
          { label: 'inventory', values: currentPeriodItems.map((it) => -it.inv_change) },
          { label: 'accounts receivables', values: currentPeriodItems.map((it) => -it.ar_change) },
          { label: 'other assets', values: currentPeriodItems.map((it) => -it.oa_change) },
          { label: 'vat receivable', values: currentPeriodItems.map((it) => -it.vat_rec_change) },
          { label: 'accounts payables', values: currentPeriodItems.map((it) => it.ap_change) },
          { label: 'vat payable', values: currentPeriodItems.map((it) => it.vat_pay_change) },
          { label: 'taxation', values: currentPeriodItems.map((it) => it.taxation - (it.taxPayment || 0)) },
          { label: 'change in working capital', highlight: true, values: currentPeriodItems.map((it) => it.change_in_working_capital) },
          { label: 'capital expenditure', values: currentPeriodItems.map((it) => -it.capex) },
          { label: 'depreciation write back', values: currentPeriodItems.map((it) => it.dep_writeback) },
          { label: 'net proceeds from the sale of fixed asset', values: currentPeriodItems.map(() => 0) },
          { label: 'application to capital assets', highlight: true, values: currentPeriodItems.map((it) => it.application_to_capital_assets) },
          { label: 'share capital', values: currentPeriodItems.map((it) => it.share_capital_change) },
          { label: 'equity loan', values: currentPeriodItems.map((it) => it.equity_loan_change) },
          { label: 'term loan', values: currentPeriodItems.map((it) => it.loan_change) },
          { label: 'change in funding', highlight: true, values: currentPeriodItems.map((it) => it.change_in_funding) },
          { label: 'cashflow', highlight: true, values: currentPeriodItems.map((it) => it.cashflow) },
          { label: 'bank balance - closing', highlight: true, values: currentPeriodItems.map((it) => it.bank_balance_closing) },
          { label: 'bank balance - check', highlight: true, values: currentPeriodItems.map((it) => it.bank_balance_closing) },
        ];

        return (
          <div className="animate-in fade-in duration-200">
            <BizzReportTable
              title={
                reportHorizonYear === 'summary'
                  ? 'cash flow statement (5-year summary)'
                  : `cash flow statement (year ${reportHorizonYear} - 12 months)`
              }
              firstColumnLabel="period"
              years={years}
              columns={periodHeaders}
              rows={cashFlowRows}
              isDark={isDark}
            />
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* 8. VAT CALCULATION (5-YEAR / 12-MONTH VAT CALCULATION & PAYMENTS)    */}
      {/* =================================================================== */}
      {activeReportTab === 'vat-ledger' && (() => {
        const vatCalculationRows: BizzReportTableRow[] = [
          {
            label: 'vat rate',
            values: currentPeriodItems.map((it) => `${(it.vatRate || 15).toFixed(2)}%`),
          },
          {
            label: 'revenue',
            values: currentPeriodItems.map((it) => (it.vat_revenue ? it.vat_revenue : (it.revenue ? it.revenue : ''))),
          },
          {
            label: 'fixed assets sold',
            values: currentPeriodItems.map((it) => (it.vat_fa_sold ? it.vat_fa_sold : '')),
          },
          {
            label: 'fixed assets purchased',
            values: currentPeriodItems.map((it) => (it.vat_fa_purchased ? it.vat_fa_purchased : '')),
          },
          {
            label: 'cost of sales',
            values: currentPeriodItems.map((it) => (it.vat_cos ? it.vat_cos : '')),
          },
          {
            label: 'operating expenses',
            values: currentPeriodItems.map((it) => (it.vat_opex ? it.vat_opex : '')),
          },
          {
            label: 'add back - employment',
            values: currentPeriodItems.map((it) => (it.vat_addback_employment ? it.vat_addback_employment : '')),
          },
          {
            label: 'add back - depreciation',
            values: currentPeriodItems.map((it) => (it.vat_addback_depreciation ? it.vat_addback_depreciation : '')),
          },
          {
            label: 'vatable amount',
            highlight: true,
            values: currentPeriodItems.map((it) => (it.vatable_amount !== 0 ? it.vatable_amount : '')),
          },
          {
            label: 'vat',
            highlight: true,
            values: currentPeriodItems.map((it) => (it.vat_calc_value !== 0 ? it.vat_calc_value : '')),
          },
        ];

        const vatPaymentsRows: BizzReportTableRow[] = [
          {
            label: 'opening balance',
            values: currentPeriodItems.map((it) => (it.vat_opening_balance !== 0 ? it.vat_opening_balance : '')),
          },
          {
            label: 'account balance',
            values: currentPeriodItems.map((it) => (it.vat_account_balance !== 0 ? it.vat_account_balance : '')),
          },
          {
            label: 'settlement',
            values: currentPeriodItems.map((it) => (it.vat_settlement !== 0 ? it.vat_settlement : '')),
          },
          {
            label: 'closing balance',
            highlight: true,
            values: currentPeriodItems.map((it) => (it.vat_closing_balance !== 0 ? it.vat_closing_balance : '')),
          },
          {
            label: 'vat receivable',
            values: currentPeriodItems.map((it) => (it.vat_closing_balance > 0 ? it.vat_closing_balance : '')),
          },
          {
            label: 'vat payable',
            values: currentPeriodItems.map((it) => (it.vat_closing_balance < 0 ? it.vat_closing_balance : '')),
          },
        ];

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* VAT Calculation Table (matching vat calculation.PNG) */}
            <BizzReportTable
              title={
                reportHorizonYear === 'summary'
                  ? 'vat calculation (5-year summary)'
                  : `vat calculation (year ${reportHorizonYear} - 12 months)`
              }
              firstColumnLabel="vat calculation line"
              years={years}
              columns={periodHeaders}
              rows={vatCalculationRows}
              isDark={isDark}
              extraHeaderContent={
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  standard rate: 15.00%
                </span>
              }
            />

            {/* VAT Payments Table (matching vat calculation.PNG) */}
            <BizzReportTable
              title={
                reportHorizonYear === 'summary'
                  ? 'vat payments — balance sheet ledger (5-year summary)'
                  : `vat payments — balance sheet ledger (year ${reportHorizonYear} - 12 months)`
              }
              firstColumnLabel="vat payment line"
              years={years}
              columns={periodHeaders}
              rows={vatPaymentsRows}
              isDark={isDark}
            />
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* 9. ASSUMPTIONS (CORE WORKING CAPITAL, MACRO & DEPRECIATION RATES)   */}
      {/* =================================================================== */}
      {activeReportTab === 'assumptions' && (() => {
        const getWorkingDaysForMonth = (mOffset: number, setup?: any) => {
          if (setup?.tradingDays?.[mOffset] !== undefined) return setup.tradingDays[mOffset];
          if (setup?.workingDaysPerMonth) return setup.workingDaysPerMonth;
          const startYear = setup?.startYear || 2026;
          const startMonth = setup?.startMonth || 1;
          const d = new Date(startYear, (startMonth - 1) + mOffset, 1);
          const year = d.getFullYear();
          const month = d.getMonth();
          const totalDays = new Date(year, month + 1, 0).getDate();
          let workingDays = 0;
          for (let day = 1; day <= totalDays; day++) {
            const dayOfWeek = new Date(year, month, day).getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              workingDays++;
            }
          }
          return workingDays;
        };

        const setupObj = (state.businessDetails as any) || {};
        const getWorkingDaysForYear = (y: number) => {
          let daysWorked = 0;
          const startMonthOffset = (y - 1) * 12;
          for (let mOffset = startMonthOffset; mOffset < startMonthOffset + 12; mOffset++) {
            daysWorked += getWorkingDaysForMonth(mOffset, setupObj);
          }
          return daysWorked;
        };

        const yearlyTradingDays = [1, 2, 3, 4, 5].map((y) => getWorkingDaysForYear(y));

        const setupAssumps = (state.businessDetails as any)?.setupAssumptions as AssumptionRateItem[] | undefined;
        const posItem = setupAssumps?.find((a) => a.id === 'interest-pos');
        const negItem = setupAssumps?.find((a) => a.id === 'interest-neg');
        const vatItem = setupAssumps?.find((a) => a.id === 'vat-rate');
        const taxItem = setupAssumps?.find((a) => a.id === 'tax-rate');

        const getYearlyRates = (item?: AssumptionRateItem, fallback: number = 0) => {
          if (!item) return [fallback, fallback, fallback, fallback, fallback];
          return [1, 2, 3, 4, 5].map((yr) => {
            const slice = item.monthlyValues.slice((yr - 1) * 12, yr * 12);
            return slice.reduce((s, v) => s + v, 0) / 12;
          });
        };

        const positiveRates = getYearlyRates(posItem, (state.funding as any)?.positiveBaseRate ?? 4.5);
        const negativeRates = getYearlyRates(negItem, (state.funding as any)?.negativeBaseRate ?? 11.75);
        const vatRates = getYearlyRates(vatItem, (state.businessDetails as any)?.vatRate ?? 0);
        const taxRates = getYearlyRates(taxItem, (state.businessDetails as any)?.taxRate ?? 0);
        const inventoryDaysBase = (state.funding as any)?.inventoryDays ?? (state.funding as any)?.workingCapital?.inventoryDays?.base ?? 30;
        const receivableDaysBase = (state.funding as any)?.debtorDays ?? (state.funding as any)?.workingCapital?.receivableDays?.base ?? 30;
        const payableDaysBase = (state.funding as any)?.creditorDays ?? (state.funding as any)?.workingCapital?.payableDays?.base ?? 30;

        const assumptionsList = [
          { label: 'trading days', value: yearlyTradingDays, isPercent: false },
          { label: 'bank interest rate', value: positiveRates, isPercent: true },
          { label: 'overdraft interest rate', value: negativeRates, isPercent: true },
          { label: 'vat rate %', value: vatRates, isPercent: true },
          { label: 'tax rate %', value: taxRates, isPercent: true },
          { label: 'days inventory', value: inventoryDaysBase, isPercent: false },
          { label: 'days receivable', value: receivableDaysBase, isPercent: false },
          { label: 'days payable', value: payableDaysBase, isPercent: false },
        ];

        const depreciationRates = [
          { label: 'commercial vehicles', value: 20.00 },
          { label: 'computer hardware', value: 33.33 },
          { label: 'computer software', value: 33.33 },
          { label: 'furniture and fittings', value: 16.67 },
          { label: 'handling equipment', value: 25.00 },
          { label: 'leasehold improvements', value: 16.67 },
          { label: 'office equipment', value: 16.67 },
          { label: 'passenger vehicles', value: 20.00 },
          { label: 'plant and equipment', value: 16.67 },
          { label: 'security equipment', value: 20.00 },
          { label: 'workshop equipment', value: 20.00 },
        ];

        const formatPercent = (val: number | string) => {
          const num = typeof val === 'number' ? val : parseFloat(val as string);
          return isNaN(num) ? '0.00%' : `${num.toFixed(2)}%`;
        };

        return (
          <BizzReportSection title="assumptions" isDark={isDark}>
            <div className="space-y-8">
              {/* Core Working Capital & Macro Assumptions */}
              <div className={BizzTableClass}>
                <div className="min-w-[700px]">
                  <div className={BizzTableHeaderClass}>
                    <div className={BizzTableHeaderCellClass}>period</div>
                    {years.map((y) => (
                      <div key={y} className={BizzTableHeaderCellClass + ' text-right font-bold'}>
                        year {y}
                      </div>
                    ))}
                  </div>
                  <div className={BizzTableContainerClass}>
                    {assumptionsList.map((row, i) => (
                      <div key={i} className={BizzTableRowClass}>
                        <div className={BizzTableCellClass + ' lowercase'}>{row.label}</div>
                        {years.map((y) => {
                          const val = Array.isArray(row.value) ? row.value[y - 1] : row.value;
                          return (
                            <div key={y} className={BizzTableCellClass + ' text-right tabular-nums'}>
                              {row.isPercent ? formatPercent(val) : val}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fixed Asset Depreciation Rates */}
              <div className={BizzTableClass}>
                <div className="min-w-[700px]">
                  <div className={`px-3 py-2 text-bizz-blue text-[10px] font-bold lowercase border-b-[0.5px] border-bizz-blue ${isDark ? 'bg-[#0E1322]' : 'bg-white'}`}>
                    fixed asset depreciation rates
                  </div>
                  <div className={BizzTableContainerClass}>
                    {depreciationRates.map((row, i) => (
                      <div key={i} className="grid grid-cols-[300px_1fr] border-b-[0.5px] border-bizz-blue/20">
                        <div className={BizzTableCellClass + ' lowercase border-r-[0.5px] border-bizz-blue/20'}>{row.label}</div>
                        <div className={BizzTableCellClass + ' text-left tabular-nums px-4'}>
                          {formatPercent(row.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </BizzReportSection>
        );
      })()}

    </div>
  );
};
