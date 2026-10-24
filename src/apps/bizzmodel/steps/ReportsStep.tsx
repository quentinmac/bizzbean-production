import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, ShieldCheck, DollarSign, Calculator, Landmark } from 'lucide-react';
import { BizzModelState } from '../constants';
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
  mode: 'bizzdynamics' | 'bizzmodel';
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
    | 'liquidity-funding'
    | 'summary'
    | 'trading-account'
    | 'trading-distribution'
    | 'income-statement'
    | 'balance-sheet'
    | 'cash-flow'
    | 'vat-ledger'
    | 'assumptions'
  >('liquidity-funding');

  // Reports Period Filter: Year 1, Year 2, Year 3, Year 4, Year 5, or 5-Year Summary (Replacing ALL)
  const [reportHorizonYear, setReportHorizonYear] = useState<number | 'summary'>(1);

  const projections = useMemo(() => {
    return calculateFinancialModelProjections(state, 60);
  }, [state]);

  // Compute unified report columns: either 12 months for an individual year OR 5 annual summaries + 5-yr total
  const reportColumns = useMemo(() => {
    if (reportHorizonYear !== 'summary') {
      const start = (reportHorizonYear - 1) * 12;
      const slice = projections.slice(start, start + 12);
      return slice.map((p) => ({
        id: `m-${p.month}`,
        label: `M${p.month}`,
        isTotal: false,
        revenue: p.revenue,
        cogs: p.cogs,
        grossProfit: p.grossProfit,
        employmentExpenses: p.employmentExpenses,
        operatingExpenses: p.operatingExpenses,
        depreciation: p.depreciation,
        interestOverdraft: p.interestOverdraft,
        interestReceived: p.interestReceived,
        netProfitBeforeTax: p.netProfitBeforeTax,
        taxationMonthly: p.taxationMonthly,
        taxedProfits: p.taxedProfits,
        operatingCashFlow: p.grossProfit - (p.employmentExpenses + p.operatingExpenses),
        vatSettlement: p.vatSettlement,
        taxPayment: p.taxPayment,
        closingCash: p.closingCash,
        bank_balance_closing: p.bank_balance_closing ?? p.closingCash,
        term_loan_balance: p.term_loan_balance ?? p.debtBalance,
        cumulativeRetainedEarnings: p.cumulativeRetainedEarnings,
        taxCarriedForwardLoss: p.taxCarriedForwardLoss,
        vatableAmount: p.vatableAmount,
      }));
    }

    // 5-Year Summary: Reports each year (Y1, Y2, Y3, Y4, Y5) and 5-Year Total
    const annualCols = [1, 2, 3, 4, 5].map((yr) => {
      const start = (yr - 1) * 12;
      const slice = projections.slice(start, start + 12);
      const lastMonth = slice[slice.length - 1];

      return {
        id: `yr-${yr}`,
        label: `Y${yr}`,
        isTotal: false,
        revenue: slice.reduce((sum, p) => sum + p.revenue, 0),
        cogs: slice.reduce((sum, p) => sum + p.cogs, 0),
        grossProfit: slice.reduce((sum, p) => sum + p.grossProfit, 0),
        employmentExpenses: slice.reduce((sum, p) => sum + p.employmentExpenses, 0),
        operatingExpenses: slice.reduce((sum, p) => sum + p.operatingExpenses, 0),
        depreciation: slice.reduce((sum, p) => sum + p.depreciation, 0),
        interestOverdraft: slice.reduce((sum, p) => sum + p.interestOverdraft, 0),
        interestReceived: slice.reduce((sum, p) => sum + p.interestReceived, 0),
        netProfitBeforeTax: slice.reduce((sum, p) => sum + p.netProfitBeforeTax, 0),
        taxationMonthly: slice.reduce((sum, p) => sum + p.taxationMonthly, 0),
        taxedProfits: slice.reduce((sum, p) => sum + p.taxedProfits, 0),
        operatingCashFlow: slice.reduce(
          (sum, p) => sum + (p.grossProfit - (p.employmentExpenses + p.operatingExpenses)),
          0
        ),
        vatSettlement: slice.reduce((sum, p) => sum + p.vatSettlement, 0),
        taxPayment: slice.reduce((sum, p) => sum + p.taxPayment, 0),
        closingCash: lastMonth ? lastMonth.closingCash : 0,
        bank_balance_closing: lastMonth ? (lastMonth.bank_balance_closing ?? lastMonth.closingCash) : 0,
        term_loan_balance: lastMonth ? (lastMonth.term_loan_balance ?? lastMonth.debtBalance) : 0,
        cumulativeRetainedEarnings: lastMonth ? lastMonth.cumulativeRetainedEarnings : 0,
        taxCarriedForwardLoss: lastMonth ? lastMonth.taxCarriedForwardLoss : 0,
        vatableAmount: slice.reduce((sum, p) => sum + p.vatableAmount, 0),
      };
    });

    const lastOverallMonth = projections[projections.length - 1];
    const totalCol = {
      id: '5yr-total',
      label: '5-YR TOTAL',
      isTotal: true,
      revenue: projections.reduce((sum, p) => sum + p.revenue, 0),
      cogs: projections.reduce((sum, p) => sum + p.cogs, 0),
      grossProfit: projections.reduce((sum, p) => sum + p.grossProfit, 0),
      employmentExpenses: projections.reduce((sum, p) => sum + p.employmentExpenses, 0),
      operatingExpenses: projections.reduce((sum, p) => sum + p.operatingExpenses, 0),
      depreciation: projections.reduce((sum, p) => sum + p.depreciation, 0),
      interestOverdraft: projections.reduce((sum, p) => sum + p.interestOverdraft, 0),
      interestReceived: projections.reduce((sum, p) => sum + p.interestReceived, 0),
      netProfitBeforeTax: projections.reduce((sum, p) => sum + p.netProfitBeforeTax, 0),
      taxationMonthly: projections.reduce((sum, p) => sum + p.taxationMonthly, 0),
      taxedProfits: projections.reduce((sum, p) => sum + p.taxedProfits, 0),
      operatingCashFlow: projections.reduce(
        (sum, p) => sum + (p.grossProfit - (p.employmentExpenses + p.operatingExpenses)),
        0
      ),
      vatSettlement: projections.reduce((sum, p) => sum + p.vatSettlement, 0),
      taxPayment: projections.reduce((sum, p) => sum + p.taxPayment, 0),
      closingCash: lastOverallMonth ? lastOverallMonth.closingCash : 0,
      bank_balance_closing: lastOverallMonth ? (lastOverallMonth.bank_balance_closing ?? lastOverallMonth.closingCash) : 0,
      term_loan_balance: lastOverallMonth ? (lastOverallMonth.term_loan_balance ?? lastOverallMonth.debtBalance) : 0,
      cumulativeRetainedEarnings: lastOverallMonth ? lastOverallMonth.cumulativeRetainedEarnings : 0,
      taxCarriedForwardLoss: lastOverallMonth ? lastOverallMonth.taxCarriedForwardLoss : 0,
      vatableAmount: projections.reduce((sum, p) => sum + p.vatableAmount, 0),
    };

    return [...annualCols, totalCol];
  }, [projections, reportHorizonYear]);

  // 5-Year Data for Annual Summary, Growth Trajectory & Trading Account (V1 reports parity)
  const yearData = useMemo(() => {
    return [1, 2, 3, 4, 5].map((yr) => {
      const start = (yr - 1) * 12;
      const slice = projections.slice(start, start + 12);

      const unitSales = slice.reduce((sum, p) => sum + (p.unitSales || 0), 0);
      const revenue = slice.reduce((sum, p) => sum + p.revenue, 0);
      const total_cos = slice.reduce((sum, p) => sum + p.cogs, 0);

      const cos_employment = slice.reduce((sum, p) => sum + (p.cosEmployment || 0), 0);
      const cos_depreciation = slice.reduce((sum, p) => sum + (p.cosDepreciation || 0), 0);
      const cos_lease = slice.reduce((sum, p) => sum + (p.cosLeases || 0), 0);
      const cos_overheads = slice.reduce((sum, p) => sum + (p.cosOverheads || 0), 0);
      const cos_fixed = cos_employment + cos_depreciation + cos_lease + cos_overheads;
      const cos_variable = Math.max(0, total_cos - cos_fixed);

      const gross_profit = slice.reduce((sum, p) => sum + p.grossProfit, 0);

      const sales_commission = slice.reduce((sum, p) => sum + (p.gpAdjustmentsCommission || 0), 0);
      const inventory_adjustments = slice.reduce((sum, p) => sum + (p.gpAdjustmentsInventory || 0), 0);
      const manufacturing_variance = slice.reduce((sum, p) => sum + (p.gpAdjustmentsVariance || 0), 0);
      const gp_adjustments = sales_commission + inventory_adjustments + manufacturing_variance;

      const remaining_gp = gross_profit - gp_adjustments;
      const other_inc = slice.reduce((sum, p) => sum + (p.interestReceived || 0), 0);
      const total_income = remaining_gp + other_inc;

      const ex_employment = slice.reduce((sum, p) => sum + (p.employmentExpenses || p.opexEmployment || 0), 0);
      const ex_depreciation = slice.reduce((sum, p) => sum + (p.depreciation || p.opexAdminDepreciation || 0), 0);
      const ex_lease = 0;
      const ex_overheads = slice.reduce((sum, p) => sum + Math.max(0, (p.operatingExpenses || 0) - (p.depreciation || 0)), 0);
      const ex_fixed = ex_employment + ex_depreciation + ex_lease + ex_overheads;
      const ex_total = slice.reduce((sum, p) => sum + (p.totalExpenses || (p.employmentExpenses + p.operatingExpenses)), 0);
      const ex_variable = Math.max(0, ex_total - ex_fixed);

      const net_operating_profit = slice.reduce((sum, p) => sum + (p.netOperatingProfit || (total_income - ex_total)), 0);

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
        100000;

      // Cash Flow & Balance Sheet metrics (V1 reports parity)
      const lastMonth = slice[slice.length - 1];
      const prevYearLastMonth = yr > 1 ? projections[(yr - 1) * 12 - 1] : null;

      const initialOpeningCash =
        (state.funding?.founderEquity || 0) +
        (state.funding?.investorEquity || 0) +
        (state.funding?.bankLoanAmount || 0);

      const bank_balance_opening =
        yr === 1
          ? initialOpeningCash
          : (prevYearLastMonth?.bank_balance_closing ?? prevYearLastMonth?.closingCash ?? 0);

      const bank_balance_closing = lastMonth
        ? (lastMonth.bank_balance_closing ?? lastMonth.closingCash)
        : 0;

      const cash_from_operations = net_operating_profit - interest_total - taxation - dividends;

      const inv_change = 0;
      const ar_change = 0;
      const oa_change = 0;
      const vat_rec_change = (lastMonth?.vatReceivable ?? 0) - (prevYearLastMonth?.vatReceivable ?? 0);
      const ap_change = 0;
      const vat_pay_change = (lastMonth?.vatPayable ?? 0) - (prevYearLastMonth?.vatPayable ?? 0);
      const change_in_working_capital =
        -inv_change - ar_change - oa_change - vat_rec_change + ap_change + vat_pay_change + taxation;

      const capex =
        state.fixedAssets?.reduce((sum: number, a: any) => {
          if (a.purchaseMonth >= start + 1 && a.purchaseMonth <= start + 12) {
            return sum + (a.purchaseCost || 0);
          }
          return sum;
        }, 0) || 0;

      const dep_writeback = cos_depreciation + ex_depreciation;
      const application_to_capital_assets = dep_writeback - capex;

      const share_capital_change =
        yr === 1
          ? (state.funding?.founderEquity || 0) + (state.funding?.investorEquity || 0)
          : 0;
      const equity_loan_change = 0;
      const loan_change =
        yr === 1
          ? (lastMonth?.term_loan_balance ?? 0) - (state.funding?.bankLoanAmount || 0)
          : (lastMonth?.term_loan_balance ?? 0) - (prevYearLastMonth?.term_loan_balance ?? 0);
      const change_in_funding = share_capital_change + equity_loan_change + loan_change;

      const cashflow = bank_balance_closing - bank_balance_opening;

      // Balance Sheet metrics (V1 reports parity)
      const fixed_assets_net =
        state.fixedAssets?.reduce((sum: number, a: any) => {
          const monthsElapsed = Math.max(0, yr * 12 - a.purchaseMonth + 1);
          const depPerMonth = a.usefulLifeMonths > 0 ? (a.purchaseCost - a.scrapValue) / a.usefulLifeMonths : 0;
          const cumDep = Math.min(a.purchaseCost - a.scrapValue, depPerMonth * monthsElapsed);
          return sum + Math.max(0, a.purchaseCost - cumDep);
        }, 0) || 0;

      const inventory = 0;
      const accounts_receivable = 0;
      const other_assets = 0;
      const vat_receivable = lastMonth?.vatReceivable ?? 0;
      const current_assets = (bank_balance_closing > 0 ? bank_balance_closing : 0) + vat_receivable;
      const total_assets = fixed_assets_net + current_assets;
      const accounts_payable = 0;
      const vat_payable = lastMonth?.vatPayable ?? 0;
      const taxation_payable = lastMonth?.taxLiability ?? 0;
      const non_interest_bearing_debt = vat_payable + taxation_payable;
      const net_operating_assets = total_assets - non_interest_bearing_debt;

      return {
        year: yr,
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
        term_loan_balance: lastMonth ? (lastMonth.term_loan_balance ?? lastMonth.debtBalance) : 0,
        cumulative_retained_earnings: lastMonth ? lastMonth.cumulativeRetainedEarnings : 0,
      };
    });
  }, [projections, state]);

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
    <div className={`p-4 sm:p-6 space-y-6 font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Reports Navigation Carousel & Horizon Filter */}
      <ReportsCarousel
        theme={theme}
        activeReportTab={activeReportTab}
        onSelectReportTab={setActiveReportTab}
        reportHorizonYear={reportHorizonYear}
        onSelectHorizonYear={setReportHorizonYear}
      />

      {/* =================================================================== */}
      {/* 1. LIQUIDITY VS DEBT (LIQUIDITY-FUNDING) — DUAL-AXIS TRAJECTORY     */}
      {/* =================================================================== */}
      {activeReportTab === 'liquidity-funding' && (
        <div className="space-y-6">
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
            }`}
          >
            <LiquidityVsDebtChart
              data={reportColumns}
              isDark={isDark}
              currencyPrefix="R "
              title={
                reportHorizonYear === 'summary'
                  ? '1. LIQUIDITY VS DEBT — 5-YEAR ANNUAL TRAJECTORY (Y1 – Y5)'
                  : `1. LIQUIDITY VS DEBT — YEAR ${reportHorizonYear} (12 MONTHS)`
              }
            />
          </div>

          <BizzReportSection
            title={`LIQUIDITY VS DEBT BREAKDOWN — ${
              reportHorizonYear === 'summary' ? '5-YEAR SUMMARY' : `YEAR ${reportHorizonYear}`
            }`}
            subtitle="Derived from monthly cumulative cash balance (m.bank_balance_closing) & term loan balances (m.term_loan_balance)"
            badge="V1 METRICS"
            badgeColor="emerald"
            isDark={isDark}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead
                  className={`border-b text-[11px] ${
                    isDark
                      ? 'bg-[#0E1322] border-[#222F4C] text-slate-400'
                      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-600'
                  }`}
                >
                  <tr>
                    <th className="p-2.5 pl-4 min-w-[240px]">METRIC / DATA SOURCE</th>
                    {reportColumns.map((col) => (
                      <th
                        key={col.id}
                        className={`p-2.5 text-right ${
                          col.isTotal
                            ? 'min-w-[95px] bg-[#2E5E88]/15 dark:bg-[#2E5E88]/25 text-[#2E5E88] dark:text-[#5584B4] font-bold'
                            : 'min-w-[85px]'
                        }`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="font-bold bg-slate-50/50 dark:bg-slate-900/30">
                    <td className="p-2.5 pl-4 text-slate-900 dark:text-white">
                      Bank Balance (m.bank_balance_closing)
                    </td>
                    {reportColumns.map((col) => (
                      <td
                        key={col.id}
                        className={`p-2.5 text-right ${
                          col.isTotal
                            ? 'bg-[#2E5E88]/5 dark:bg-[#2E5E88]/15 font-bold border-l border-slate-200 dark:border-slate-800'
                            : ''
                        } ${
                          col.bank_balance_closing >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'
                        }`}
                      >
                        R {col.bank_balance_closing.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-600 dark:text-slate-400">
                    <td className="p-2.5 pl-4">
                      Overdraft Facility (Deficit Cash Borrowings)
                    </td>
                    {reportColumns.map((col) => (
                      <td
                        key={col.id}
                        className={`p-2.5 text-right ${
                          col.isTotal
                            ? 'bg-[#2E5E88]/5 dark:bg-[#2E5E88]/15 font-bold border-l border-slate-200 dark:border-slate-800'
                            : ''
                        } ${
                          col.bank_balance_closing < 0 ? 'text-rose-400 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {col.bank_balance_closing < 0
                          ? `R ${Math.abs(col.bank_balance_closing).toLocaleString()}`
                          : 'R 0'}
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-600 dark:text-slate-400">
                    <td className="p-2.5 pl-4 text-rose-500 font-medium">
                      Interest-Bearing Debt (m.term_loan_balance)
                    </td>
                    {reportColumns.map((col) => (
                      <td
                        key={col.id}
                        className={`p-2.5 text-right ${
                          col.isTotal
                            ? 'bg-[#2E5E88]/5 dark:bg-[#2E5E88]/15 font-bold border-l border-slate-200 dark:border-slate-800'
                            : ''
                        } text-rose-400 font-semibold`}
                      >
                        R {Math.abs(col.term_loan_balance).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr className="font-bold text-sm bg-slate-100 dark:bg-[#1E2548] border-t-2 border-slate-300 dark:border-slate-700">
                    <td className="p-2.5 pl-4 uppercase text-slate-900 dark:text-white">
                      NET LIQUIDITY POSITION (Cash - IBD)
                    </td>
                    {reportColumns.map((col) => {
                      const net = col.bank_balance_closing - Math.abs(col.term_loan_balance);
                      return (
                        <td
                          key={col.id}
                          className={`p-2.5 text-right ${
                            col.isTotal
                              ? 'bg-[#2E5E88]/5 dark:bg-[#2E5E88]/15 font-bold border-l border-slate-200 dark:border-slate-800'
                              : ''
                          } ${
                            net >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'
                          }`}
                        >
                          R {net.toLocaleString()}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </BizzReportSection>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. EXECUTIVE SUMMARY (CHARTS + KEY RATIOS TABLE)                    */}
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
        const efficiencyData: EfficiencyChartDataPoint[] = years.map((y) => {
          const yr = yearData[y - 1];
          const rev = yr.revenue || 1;
          const noa = yr.net_operating_assets || 1;
          const nop = yr.net_operating_profit;
          const ros = (nop / rev) * 100;
          const assetTurn = rev / noa;
          const roa = (nop / noa) * 100;
          return {
            year: y,
            label: `Year ${y}`,
            ros: Number(ros.toFixed(2)),
            roa: Number(roa.toFixed(2)),
            assetTurn: Number(assetTurn.toFixed(2)),
          };
        });

        // Multi-Metric Chart Data 2: Capital Structure & Returns (ROE %, Debt/Equity x, EPS)
        const returnsData: ReturnsChartDataPoint[] = years.map((y) => {
          const yr = yearData[y - 1];
          const prior =
            y === 1
              ? 0
              : yearData.slice(0, y - 1).reduce((sum, item) => sum + item.retained_earnings, 0);
          const shEquity = capital + prior + yr.retained_earnings;
          const overdraft =
            yr.bank_balance_closing < 0 ? Math.abs(yr.bank_balance_closing) : 0;
          const ibd = yr.term_loan_balance + overdraft;
          const roe = shEquity !== 0 ? (yr.taxed_profits / shEquity) * 100 : 0;
          const debtEquity = shEquity !== 0 ? ibd / shEquity : 0;
          const eps =
            yr.shares_in_issue > 0 ? yr.taxed_profits / yr.shares_in_issue : 0;

          return {
            year: y,
            label: `Year ${y}`,
            roe: Number(roe.toFixed(2)),
            debtEquity: Number(debtEquity.toFixed(2)),
            eps: Number(eps.toFixed(2)),
          };
        });

        // V1 Key Ratios Table line items matching key_ratios_74f218cb.png
        const executiveSummaryRows: BizzReportTableRow[] = [
          // 1. MARGINS
          { label: 'margins', isSectionHeader: true },
          {
            label: 'gross profit %',
            values: years.map((y) => {
              const yr = yearData[y - 1];
              return yr.revenue > 0
                ? `${((yr.gross_profit / yr.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'other income %',
            values: years.map((y) => {
              const yr = yearData[y - 1];
              return yr.revenue > 0
                ? `${((yr.other_inc / yr.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'total income %',
            highlight: true,
            values: years.map((y) => {
              const yr = yearData[y - 1];
              return yr.revenue > 0
                ? `${((yr.total_income / yr.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'expenses %',
            values: years.map((y) => {
              const yr = yearData[y - 1];
              return yr.revenue > 0
                ? `${((yr.ex_total / yr.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'net operating profit %',
            highlight: true,
            values: years.map((y) => {
              const yr = yearData[y - 1];
              return yr.revenue > 0
                ? `${((yr.net_operating_profit / yr.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'interest %',
            values: years.map((y) => {
              const yr = yearData[y - 1];
              return yr.revenue > 0
                ? `${((yr.interest_total / yr.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'taxation %',
            values: years.map((y) => {
              const yr = yearData[y - 1];
              return yr.revenue > 0
                ? `${((yr.taxation / yr.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'taxed profits %',
            highlight: true,
            values: years.map((y) => {
              const yr = yearData[y - 1];
              return yr.revenue > 0
                ? `${((yr.taxed_profits / yr.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },

          // 2. EFFICIENCY (RED BOX ELEMENTS)
          { label: 'efficiency', isSectionHeader: true },
          {
            label: 'return on sales',
            highlight: true,
            values: years.map((y) => {
              const yr = yearData[y - 1];
              return yr.revenue > 0
                ? `${((yr.net_operating_profit / yr.revenue) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'asset turn',
            highlight: true,
            values: years.map((y) => {
              const yr = yearData[y - 1];
              const noa = yr.net_operating_assets || 1;
              return `${(yr.revenue / noa).toFixed(2)}`;
            }),
          },
          {
            label: 'return on net operating assets',
            highlight: true,
            values: years.map((y) => {
              const yr = yearData[y - 1];
              const noa = yr.net_operating_assets || 1;
              return `${((yr.net_operating_profit / noa) * 100).toFixed(1)}%`;
            }),
          },
          {
            label: 'expense / income ratio',
            values: years.map((y) => {
              const yr = yearData[y - 1];
              const totInc = yr.total_income || 1;
              return `${((yr.ex_total / totInc) * 100).toFixed(1)}%`;
            }),
          },
          {
            label: 'interest cover',
            values: years.map((y) => {
              const yr = yearData[y - 1];
              if (yr.interest_total <= 0) return 'n/a';
              return `${(yr.net_operating_profit / yr.interest_total).toFixed(2)}`;
            }),
          },
          {
            label: 'expense cover (mts)',
            values: years.map((y) => {
              const yr = yearData[y - 1];
              const monthlyExp = (yr.ex_total || 1) / 12;
              return `${(yr.bank_balance_closing / monthlyExp).toFixed(1)}`;
            }),
          },
          {
            label: 'return on equity',
            highlight: true,
            values: years.map((y) => {
              const yr = yearData[y - 1];
              const prior =
                y === 1
                  ? 0
                  : yearData.slice(0, y - 1).reduce((sum, item) => sum + item.retained_earnings, 0);
              const shEquity = capital + prior + yr.retained_earnings;
              return shEquity !== 0
                ? `${((yr.taxed_profits / shEquity) * 100).toFixed(1)}%`
                : '0.0%';
            }),
          },
          {
            label: 'debt / equity ratio',
            highlight: true,
            values: years.map((y) => {
              const yr = yearData[y - 1];
              const prior =
                y === 1
                  ? 0
                  : yearData.slice(0, y - 1).reduce((sum, item) => sum + item.retained_earnings, 0);
              const shEquity = capital + prior + yr.retained_earnings;
              const overdraft =
                yr.bank_balance_closing < 0 ? Math.abs(yr.bank_balance_closing) : 0;
              const ibd = yr.term_loan_balance + overdraft;
              return shEquity !== 0 ? `${(ibd / shEquity).toFixed(2)}` : '0.00';
            }),
          },
          {
            label: 'earnings per share',
            highlight: true,
            values: years.map((y) => {
              const yr = yearData[y - 1];
              const eps =
                yr.shares_in_issue > 0 ? yr.taxed_profits / yr.shares_in_issue : 0;
              return eps >= 0 ? `R ${eps.toFixed(2)}` : `-R ${Math.abs(eps).toFixed(2)}`;
            }),
          },

          // 3. PRODUCTIVITY
          { label: 'productivity', isSectionHeader: true },
          {
            label: 'number of employees',
            values: years.map(() => totalEmployees),
          },
          {
            label: 'employee revenue',
            values: years.map((y) =>
              Math.round(yearData[y - 1].revenue / totalEmployees)
            ),
          },
          {
            label: 'employee gross profit',
            values: years.map((y) =>
              Math.round(yearData[y - 1].gross_profit / totalEmployees)
            ),
          },
          {
            label: 'employee total income',
            values: years.map((y) =>
              Math.round(yearData[y - 1].total_income / totalEmployees)
            ),
          },
          {
            label: 'employee expenses',
            values: years.map((y) =>
              Math.round(yearData[y - 1].ex_total / totalEmployees)
            ),
          },
          {
            label: 'employee nop',
            highlight: true,
            values: years.map((y) =>
              Math.round(yearData[y - 1].net_operating_profit / totalEmployees)
            ),
          },
        ];

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Chart 1: Dual-Axis Efficiency Trajectory (Red Box 1: ROS & ROA vs Asset Turn) */}
            <ExecutiveEfficiencyChart
              data={efficiencyData}
              isDark={isDark}
              title="1. EFFICIENCY TRAJECTORY: RETURN ON SALES (ROS) & ROA VS ASSET TURN (DUAL-AXIS)"
            />

            {/* Chart 2: Capital Structure & Shareholder Returns (Red Box 2: ROE, Debt/Equity & EPS) */}
            <ExecutiveReturnsChart
              data={returnsData}
              isDark={isDark}
              currencyPrefix="R "
              title="2. CAPITAL STRUCTURE & SHAREHOLDER VALUE: RETURN ON EQUITY, DEBT/EQUITY & EPS"
            />

            {/* Complete Key Ratios Report Table */}
            <BizzReportTable
              title="key ratios"
              firstColumnLabel="key ratios"
              years={years}
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
          { label: 'unit sales', values: years.map((y) => yearData[y - 1].unitSales) },
          { label: 'revenue', highlight: true, values: years.map((y) => yearData[y - 1].revenue) },
          { label: 'cost of sales', highlight: true, values: years.map((y) => -yearData[y - 1].total_cos) },
          { label: 'cost of sales - variable', values: years.map((y) => -yearData[y - 1].cos_variable) },
          { label: 'cost of sales - fixed', highlight: true, values: years.map((y) => -yearData[y - 1].cos_fixed) },
          { label: 'employment', indent: true, values: years.map((y) => -yearData[y - 1].cos_employment) },
          { label: 'depreciation', indent: true, values: years.map((y) => -yearData[y - 1].cos_depreciation) },
          { label: 'lease', indent: true, values: years.map((y) => -yearData[y - 1].cos_lease) },
          { label: 'overheads', indent: true, values: years.map((y) => -yearData[y - 1].cos_overheads) },
          { label: 'gross profit', highlight: true, values: years.map((y) => yearData[y - 1].gross_profit) },
          { label: 'gross profit adjustments', values: years.map((y) => -yearData[y - 1].gp_adjustments) },
          { label: 'remaining gross profit', highlight: true, values: years.map((y) => yearData[y - 1].remaining_gp) },
          { label: 'other income', values: years.map((y) => yearData[y - 1].other_inc) },
          { label: 'total income', highlight: true, values: years.map((y) => yearData[y - 1].total_income) },
          { label: 'expenses - total', highlight: true, values: years.map((y) => -yearData[y - 1].ex_total) },
          { label: 'expenses - variable', values: years.map((y) => -yearData[y - 1].ex_variable) },
          { label: 'expenses - fixed', highlight: true, values: years.map((y) => -yearData[y - 1].ex_fixed) },
          { label: 'employment', indent: true, values: years.map((y) => -yearData[y - 1].ex_employment) },
          { label: 'depreciation', indent: true, values: years.map((y) => -yearData[y - 1].ex_depreciation) },
          { label: 'lease', indent: true, values: years.map((y) => -yearData[y - 1].ex_lease) },
          { label: 'overheads', indent: true, values: years.map((y) => -yearData[y - 1].ex_overheads) },
          { label: 'net operating profit', highlight: true, values: years.map((y) => yearData[y - 1].net_operating_profit) },
        ];

        // Embedded Breakeven Analysis (per user request: treated as part of trading account)
        const breakevenRows: BizzReportTableRow[] = [
          { label: 'turnover', values: years.map((y) => yearData[y - 1].revenue) },
          { label: 'expenses - fixed', values: years.map((y) => yearData[y - 1].cos_fixed + yearData[y - 1].ex_fixed) },
          {
            label: 'gross profit %',
            formatValue: (val) => formatReportPercent(val),
            values: years.map((y) => {
              const yr = yearData[y - 1];
              return yr.revenue > 0 ? (yr.gross_profit / yr.revenue) * 100 : 0;
            }),
          },
          {
            label: 'breakeven turnover',
            highlight: true,
            values: years.map((y) => {
              const yr = yearData[y - 1];
              const fixedTotal = yr.cos_fixed + yr.ex_fixed;
              const gpMargin = yr.revenue > 0 ? yr.gross_profit / yr.revenue : 0;
              return gpMargin > 0 ? Math.round(fixedTotal / gpMargin) : 0;
            }),
          },
        ];

        return (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* 1. Trading Summary Table */}
            <BizzReportTable
              title="trading summary"
              firstColumnLabel="account line"
              years={years}
              rows={tradingSummaryRows}
              isDark={isDark}
            />

            {/* 2. Breakeven Table (Integrated directly into Trading Account view) */}
            <BizzReportTable
              title="breakeven"
              firstColumnLabel="account line"
              years={years}
              rows={breakevenRows}
              isDark={isDark}
            />

            {/* 3. Gross Profit Adjustments Details Sub-Table */}
            <div className="pt-2" id="gp-adjustments-report-section">
              <BizzReportTable
                title="gross profit adjustments details"
                firstColumnLabel="gross profit adjustments"
                years={years}
                rows={[
                  { label: 'sales commission', values: years.map((y) => yearData[y - 1].sales_commission) },
                  { label: 'inventory adjustments', values: years.map((y) => yearData[y - 1].inventory_adjustments) },
                  { label: 'manufacturing variance', values: years.map((y) => yearData[y - 1].manufacturing_variance) },
                  { label: 'gross profit adjustments', highlight: true, values: years.map((y) => yearData[y - 1].gp_adjustments) },
                ]}
                isDark={isDark}
              />
            </div>
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* 4. TRADING ACCOUNT DISTRIBUTION (5-YEAR ANNUAL)                     */}
      {/* =================================================================== */}
      {activeReportTab === 'trading-distribution' && (() => {
        const getDistPct = (val: number, revenue: number, isNeg: boolean = false) => {
          if (!revenue || revenue === 0) return 0;
          const computedVal = isNeg && val > 0 ? -val : val;
          return (computedVal / revenue) * 100;
        };

        const distRows: BizzReportTableRow[] = [
          { label: 'cost of sales', highlight: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].total_cos, yearData[y - 1].revenue, true)) },
          { label: 'cost of sales - variable', formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].cos_variable, yearData[y - 1].revenue, true)) },
          { label: 'cost of sales - fixed', highlight: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].cos_fixed, yearData[y - 1].revenue, true)) },
          { label: 'employment', indent: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].cos_employment, yearData[y - 1].revenue, true)) },
          { label: 'depreciation', indent: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].cos_depreciation, yearData[y - 1].revenue, true)) },
          { label: 'lease', indent: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].cos_lease, yearData[y - 1].revenue, true)) },
          { label: 'overheads', indent: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].cos_overheads, yearData[y - 1].revenue, true)) },
          { label: 'gross profit', highlight: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].gross_profit, yearData[y - 1].revenue, false)) },
          { label: 'gross profit adjustments', formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].gp_adjustments, yearData[y - 1].revenue, true)) },
          { label: 'remaining gross profit', highlight: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].remaining_gp, yearData[y - 1].revenue, false)) },
          { label: 'other income', formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].other_inc, yearData[y - 1].revenue, false)) },
          { label: 'total income', highlight: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].total_income, yearData[y - 1].revenue, false)) },
          { label: 'expenses - total', highlight: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].ex_total, yearData[y - 1].revenue, true)) },
          { label: 'expenses - variable', formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].ex_variable, yearData[y - 1].revenue, true)) },
          { label: 'expenses - fixed', highlight: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].ex_fixed, yearData[y - 1].revenue, true)) },
          { label: 'employment', indent: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].ex_employment, yearData[y - 1].revenue, true)) },
          { label: 'depreciation', indent: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].ex_depreciation, yearData[y - 1].revenue, true)) },
          { label: 'lease', indent: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].ex_lease, yearData[y - 1].revenue, true)) },
          { label: 'overheads', indent: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].ex_overheads, yearData[y - 1].revenue, true)) },
          { label: 'net operating profit', highlight: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].net_operating_profit, yearData[y - 1].revenue, false)) },
        ];

        return (
          <div className="animate-in fade-in duration-200">
            <BizzReportTable
              title="trading summary - distribution (5-year annual)"
              firstColumnLabel="account line"
              years={years}
              rows={distRows}
              isDark={isDark}
            />
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* 5. INCOME STATEMENT (5-YEAR ANNUAL)                                 */}
      {/* =================================================================== */}
      {activeReportTab === 'income-statement' && (() => {
        const incomeStatementRows: BizzReportTableRow[] = [
          { label: 'revenue', values: years.map((y) => yearData[y - 1].revenue) },
          { label: 'net operating profit', highlight: true, values: years.map((y) => yearData[y - 1].net_operating_profit) },
          { label: 'interest - other', indent: true, values: years.map((y) => yearData[y - 1].interest_other) },
          { label: 'interest - term loan', indent: true, values: years.map((y) => -yearData[y - 1].interest_tl) },
          { label: 'interest', highlight: true, values: years.map((y) => -yearData[y - 1].interest_total) },
          { label: 'net profit', highlight: true, values: years.map((y) => yearData[y - 1].net_profit_before_tax) },
          { label: 'profit / loss on sale of fixed assets', values: years.map(() => 0) },
          { label: 'net profit before taxation', highlight: true, values: years.map((y) => yearData[y - 1].net_profit_before_tax) },
          { label: 'taxation', values: years.map((y) => -yearData[y - 1].taxation) },
          { label: 'taxed profits', highlight: true, values: years.map((y) => yearData[y - 1].taxed_profits) },
          { label: 'dividends', values: years.map((y) => -yearData[y - 1].dividends) },
          { label: 'retained earnings', highlight: true, values: years.map((y) => yearData[y - 1].retained_earnings) },
        ];

        return (
          <div className="animate-in fade-in duration-200">
            <BizzReportTable
              title="income statement"
              firstColumnLabel="period"
              years={years}
              rows={incomeStatementRows}
              isDark={isDark}
            />
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* 6. BALANCE SHEET (5-YEAR ANNUAL)                                    */}
      {/* =================================================================== */}
      {activeReportTab === 'balance-sheet' && (() => {
        const capital =
          (state.funding?.founderEquity || 0) + (state.funding?.investorEquity || 0);

        const balanceSheetRows: BizzReportTableRow[] = [
          { label: 'fixed assets', values: years.map((y) => yearData[y - 1].fixed_assets_net) },
          { label: 'inventory', indent: true, values: years.map((y) => yearData[y - 1].inventory) },
          { label: 'accounts receivables', indent: true, values: years.map((y) => yearData[y - 1].accounts_receivable) },
          { label: 'other assets', indent: true, values: years.map((y) => yearData[y - 1].other_assets) },
          { label: 'vat receivable', indent: true, values: years.map((y) => yearData[y - 1].vat_receivable) },
          {
            label: 'current assets',
            highlight: true,
            values: years.map(
              (y) =>
                yearData[y - 1].inventory +
                yearData[y - 1].accounts_receivable +
                yearData[y - 1].other_assets +
                yearData[y - 1].vat_receivable
            ),
          },
          {
            label: 'total assets',
            highlight: true,
            values: years.map((y) => {
              const ca =
                yearData[y - 1].inventory +
                yearData[y - 1].accounts_receivable +
                yearData[y - 1].other_assets +
                yearData[y - 1].vat_receivable;
              return yearData[y - 1].fixed_assets_net + ca;
            }),
          },
          { label: 'accounts payable', values: years.map((y) => yearData[y - 1].accounts_payable) },
          { label: 'vat payable', values: years.map((y) => yearData[y - 1].vat_payable) },
          { label: 'taxation payable', values: years.map((y) => yearData[y - 1].taxation_payable) },
          {
            label: 'non-interest bearing debt',
            highlight: true,
            values: years.map(
              (y) =>
                yearData[y - 1].accounts_payable +
                yearData[y - 1].vat_payable +
                yearData[y - 1].taxation_payable
            ),
          },
          {
            label: 'net operating assets',
            highlight: true,
            values: years.map((y) => {
              const ca =
                yearData[y - 1].inventory +
                yearData[y - 1].accounts_receivable +
                yearData[y - 1].other_assets +
                yearData[y - 1].vat_receivable;
              const ta = yearData[y - 1].fixed_assets_net + ca;
              const nibd =
                yearData[y - 1].accounts_payable +
                yearData[y - 1].vat_payable +
                yearData[y - 1].taxation_payable;
              return ta - nibd;
            }),
          },
          { label: 'financed by', isSectionHeader: true },
          { label: 'shares in issue', values: years.map((y) => yearData[y - 1].shares_in_issue) },
          { label: "shareholders' capital", values: years.map(() => capital) },
          { label: 'equity loan', values: years.map(() => 0) },
          {
            label: 'retained earnings - prior',
            values: years.map((y) => {
              if (y === 1) return '';
              return yearData.slice(0, y - 1).reduce((sum, yr) => sum + yr.retained_earnings, 0);
            }),
          },
          { label: 'retained earnings - current', values: years.map((y) => yearData[y - 1].retained_earnings) },
          {
            label: "shareholders' equity",
            highlight: true,
            values: years.map((y) => {
              const prior = y === 1 ? 0 : yearData.slice(0, y - 1).reduce((sum, yr) => sum + yr.retained_earnings, 0);
              return capital + prior + yearData[y - 1].retained_earnings;
            }),
          },
          { label: 'bank balance', values: years.map((y) => yearData[y - 1].bank_balance_closing) },
          { label: 'term loan', values: years.map((y) => yearData[y - 1].term_loan_balance) },
          {
            label: 'interest-bearing debt',
            highlight: true,
            values: years.map((y) => {
              const yr = yearData[y - 1];
              const overdraft = yr.bank_balance_closing < 0 ? Math.abs(yr.bank_balance_closing) : 0;
              return yr.term_loan_balance + overdraft;
            }),
          },
          {
            label: 'capital employed',
            highlight: true,
            values: years.map((y) => {
              const prior = y === 1 ? 0 : yearData.slice(0, y - 1).reduce((sum, yr) => sum + yr.retained_earnings, 0);
              const shEquity = capital + prior + yearData[y - 1].retained_earnings;
              const yr = yearData[y - 1];
              const overdraft = yr.bank_balance_closing < 0 ? Math.abs(yr.bank_balance_closing) : 0;
              return shEquity + yr.term_loan_balance + overdraft;
            }),
          },
          {
            label: 'equity',
            values: years.map((y) => {
              const prior = y === 1 ? 0 : yearData.slice(0, y - 1).reduce((sum, yr) => sum + yr.retained_earnings, 0);
              return capital + prior + yearData[y - 1].retained_earnings;
            }),
          },
        ];

        return (
          <div className="animate-in fade-in duration-200">
            <BizzReportTable
              title="balance sheet"
              firstColumnLabel="period"
              years={years}
              rows={balanceSheetRows}
              isDark={isDark}
            />
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* 7. CASH FLOW STATEMENT (5-YEAR ANNUAL)                              */}
      {/* =================================================================== */}
      {activeReportTab === 'cash-flow' && (() => {
        const cashFlowRows: BizzReportTableRow[] = [
          { label: 'bank balance - opening', values: years.map((y) => yearData[y - 1].bank_balance_opening) },
          { label: 'net operating profit', values: years.map((y) => yearData[y - 1].net_operating_profit) },
          { label: 'interest - other', indent: true, values: years.map((y) => yearData[y - 1].interest_other) },
          { label: 'interest - term loan', indent: true, values: years.map((y) => -yearData[y - 1].interest_tl) },
          { label: 'interest', highlight: true, values: years.map((y) => -yearData[y - 1].interest_total) },
          { label: 'sub total', highlight: true, values: years.map((y) => yearData[y - 1].net_operating_profit - yearData[y - 1].interest_total) },
          { label: 'profit / loss on sale of fixed assets', values: years.map(() => 0) },
          { label: 'taxation', values: years.map((y) => -yearData[y - 1].taxation) },
          { label: 'dividends', values: years.map((y) => -yearData[y - 1].dividends) },
          { label: 'cash from operations', highlight: true, values: years.map((y) => yearData[y - 1].cash_from_operations) },
          { label: 'inventory', values: years.map((y) => -yearData[y - 1].inv_change) },
          { label: 'accounts receivables', values: years.map((y) => -yearData[y - 1].ar_change) },
          { label: 'other assets', values: years.map((y) => -yearData[y - 1].oa_change) },
          { label: 'vat receivable', values: years.map((y) => -yearData[y - 1].vat_rec_change) },
          { label: 'accounts payables', values: years.map((y) => yearData[y - 1].ap_change) },
          { label: 'vat payable', values: years.map((y) => yearData[y - 1].vat_pay_change) },
          { label: 'taxation', values: years.map((y) => yearData[y - 1].taxation) },
          { label: 'change in working capital', highlight: true, values: years.map((y) => yearData[y - 1].change_in_working_capital) },
          { label: 'capital expenditure', values: years.map((y) => -yearData[y - 1].capex) },
          { label: 'depreciation write back', values: years.map((y) => yearData[y - 1].dep_writeback) },
          { label: 'net proceeds from the sale of fixed asset', values: years.map(() => 0) },
          { label: 'application to capital assets', highlight: true, values: years.map((y) => yearData[y - 1].application_to_capital_assets) },
          { label: 'share capital', values: years.map((y) => yearData[y - 1].share_capital_change) },
          { label: 'equity loan', values: years.map((y) => yearData[y - 1].equity_loan_change) },
          { label: 'term loan', values: years.map((y) => yearData[y - 1].loan_change) },
          { label: 'change in funding', highlight: true, values: years.map((y) => yearData[y - 1].change_in_funding) },
          { label: 'cashflow', highlight: true, values: years.map((y) => yearData[y - 1].cashflow) },
          { label: 'bank balance - closing', highlight: true, values: years.map((y) => yearData[y - 1].bank_balance_closing) },
          { label: 'bank balance - check', highlight: true, values: years.map((y) => yearData[y - 1].bank_balance_closing) },
        ];

        return (
          <div className="animate-in fade-in duration-200">
            <BizzReportTable
              title="cash flow statement"
              firstColumnLabel="period"
              years={years}
              rows={cashFlowRows}
              isDark={isDark}
            />
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* 8. VAT CALCULATION (5-YEAR VAT CALCULATION & PAYMENTS AT M12)       */}
      {/* =================================================================== */}
      {activeReportTab === 'vat-ledger' && (() => {
        const vatRatePercent = (state.businessDetails as any)?.vatRate || 15;
        const simMonths = projections;
        const fiveYearMonths = [simMonths[11], simMonths[23], simMonths[35], simMonths[47], simMonths[59]].map(
          (m) => m || ({} as any)
        );

        return (
          <div className="space-y-8">
            {/* 5-Year VAT Calculation */}
            <BizzReportSection title="5-year vat calculation (month 12 of each year)" isDark={isDark}>
              <div className={BizzTableClass}>
                <div className="min-w-[700px]">
                  <div className={BizzTableHeaderClass}>
                    <div className={BizzTableHeaderCellClass}>vat calculation line</div>
                    {years.map((y) => (
                      <div key={y} className={BizzTableHeaderCellClass + ' text-right font-bold'}>
                        year {y} (m{y * 12})
                      </div>
                    ))}
                  </div>
                  <div className={BizzTableContainerClass}>
                    {[
                      { label: 'Revenue', id: 'rev' },
                      { label: 'Fixed Assets Sold', id: 'fa_sold' },
                      { label: 'Fixed Assets Purchased', id: 'fa_purchased' },
                      { label: 'Cost of Sales', id: 'cos' },
                      { label: 'Operating Expenses', id: 'opex' },
                      { label: 'Add Back - Employment', id: 'employment' },
                      { label: 'Add Back - Depreciation', id: 'depreciation' },
                      { label: 'Vatable Amount', id: 'vatable_amount', highlight: true },
                      { label: 'VAT', id: 'vat_calc', highlight: true },
                    ].map((row, i) => (
                      <div key={i} className={BizzTableRowClass + (row.highlight ? ' bg-bizz-total/30 font-bold' : '')}>
                        <div className={`${BizzTableCellClass} lowercase`}>{row.label}</div>
                        {fiveYearMonths.map((m: any, idx) => {
                          let val = 0;
                          if (row.id === 'rev') val = m.vat_revenue ?? m.revenue ?? 0;
                          else if (row.id === 'fa_sold') val = m.vat_fa_sold ?? 0;
                          else if (row.id === 'fa_purchased') val = m.vat_fa_purchased ?? 0;
                          else if (row.id === 'cos') val = m.vat_cos ?? -(m.cogs || 0);
                          else if (row.id === 'opex') val = m.vat_opex ?? -(m.operatingExpenses || 0);
                          else if (row.id === 'employment') val = m.vat_addback_employment ?? m.employmentExpenses ?? 0;
                          else if (row.id === 'depreciation') val = m.vat_addback_depreciation ?? m.depreciation ?? 0;
                          else if (row.id === 'vatable_amount') val = m.vatable_amount ?? m.vatableAmount ?? 0;
                          else if (row.id === 'vat_calc') val = m.vat_calc_value ?? m.vatCalcValue ?? 0;

                          return (
                            <div key={idx} className={`${BizzTableCellClass} text-right tabular-nums`}>
                              {formatNumeric(val)}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BizzReportSection>

            {/* 5-Year VAT Payments & Settlement */}
            <BizzReportSection title="5-year vat payments (month 12 of each year)" isDark={isDark}>
              <div className={BizzTableClass}>
                <div className="min-w-[700px]">
                  <div className={BizzTableHeaderClass}>
                    <div className={BizzTableHeaderCellClass}>vat payment line</div>
                    {years.map((y) => (
                      <div key={y} className={BizzTableHeaderCellClass + ' text-right font-bold'}>
                        year {y} (m{y * 12})
                      </div>
                    ))}
                  </div>
                  <div className={BizzTableContainerClass}>
                    {[
                      { label: 'Opening Balance', id: 'opening' },
                      { label: 'Account Balance', id: 'account_balance' },
                      { label: 'Settlement', id: 'settlement' },
                      { label: 'Closing Balance', id: 'closing', highlight: true },
                      { label: 'VAT Receivable', id: 'receivable' },
                      { label: 'VAT Payable', id: 'payable' },
                    ].map((row, i) => (
                      <div key={i} className={BizzTableRowClass + (row.highlight ? ' bg-bizz-total/30 font-bold' : '')}>
                        <div className={`${BizzTableCellClass} lowercase`}>{row.label}</div>
                        {fiveYearMonths.map((m: any, idx) => {
                          let val = 0;
                          if (row.id === 'opening') val = m.vat_opening_balance ?? m.vatOpeningBalance ?? 0;
                          else if (row.id === 'account_balance') val = m.vat_account_balance ?? ((m.vatOpeningBalance ?? 0) + (m.vatCalcValue ?? 0));
                          else if (row.id === 'settlement') val = m.vat_settlement ?? m.vatSettlement ?? 0;
                          else if (row.id === 'closing') val = m.vat_closing_balance ?? m.vatClosingBalance ?? 0;
                          else if (row.id === 'receivable') val = m.vat_receivable ?? m.vatReceivable ?? 0;
                          else if (row.id === 'payable') val = m.vat_payable ?? m.vatPayable ?? 0;

                          return (
                            <div key={idx} className={`${BizzTableCellClass} text-right tabular-nums`}>
                              {row.id === 'opening' && val === 0 ? '-' : formatNumeric(val)}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BizzReportSection>
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

        const positiveBaseRate = (state.funding as any)?.positiveBaseRate ?? (state.funding as any)?.interestRates?.positiveBase ?? 4.5;
        const negativeBaseRate = (state.funding as any)?.negativeBaseRate ?? (state.funding as any)?.interestRates?.negativeBase ?? 11.75;
        const vatRateBase = (state.businessDetails as any)?.vatRate ?? 15;
        const taxRateBase = (state.businessDetails as any)?.taxRate ?? 27;
        const inventoryDaysBase = (state.funding as any)?.inventoryDays ?? (state.funding as any)?.workingCapital?.inventoryDays?.base ?? 30;
        const receivableDaysBase = (state.funding as any)?.debtorDays ?? (state.funding as any)?.workingCapital?.receivableDays?.base ?? 30;
        const payableDaysBase = (state.funding as any)?.creditorDays ?? (state.funding as any)?.workingCapital?.payableDays?.base ?? 30;

        const assumptionsList = [
          { label: 'trading days', value: yearlyTradingDays, isPercent: false },
          { label: 'interest rate - positive balance', value: positiveBaseRate, isPercent: true },
          { label: 'interest rate - negative balance', value: negativeBaseRate, isPercent: true },
          { label: 'vat rate %', value: vatRateBase, isPercent: true },
          { label: 'tax rate %', value: taxRateBase, isPercent: true },
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
