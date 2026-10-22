import React, { useMemo } from 'react';
import { DollarSign, Percent, ShieldCheck, Calculator, ArrowRight } from 'lucide-react';
import { BizzModelState, FundingSettings } from '../constants';
import { calculateTermLoanMetrics, TermLoan } from '../utils/loanCalc';

interface FundingStepProps {
  theme?: 'light' | 'dark';
  mode: 'bizzdynamics' | 'bizzmodel';
  state: BizzModelState;
  onUpdateState: (updater: (prev: BizzModelState) => BizzModelState) => void;
}

export const FundingStep: React.FC<FundingStepProps> = ({
  theme = 'light',
  mode,
  state,
  onUpdateState,
}) => {
  const isDark = theme === 'dark';

  const funding = state.funding;

  const handleUpdateFunding = (patch: Partial<FundingSettings>) => {
    onUpdateState((prev) => ({
      ...prev,
      funding: { ...prev.funding, ...patch },
    }));
  };

  const totalCapitalInjected = funding.founderEquity + funding.investorEquity + funding.bankLoanAmount;

  // Live V1 Amortization Metrics
  const loanMetricsMonth1 = useMemo(() => {
    if (funding.bankLoanAmount <= 0) return null;
    const tl: TermLoan = {
      advanceMonth: 1,
      advanceValue: funding.bankLoanAmount,
      advanceRate: funding.interestRatePct,
      termYears: (funding.loanTermMonths || 60) / 12,
    };
    return calculateTermLoanMetrics(tl, 1);
  }, [funding.bankLoanAmount, funding.interestRatePct, funding.loanTermMonths]);

  return (
    <div className={`p-4 sm:p-6 space-y-6 font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      <div>
        <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white">
          FUNDING & WORKING CAPITAL CALCULATOR
        </h2>
        <p className="text-xs text-slate-500">
          Total initial capital injection: R {totalCapitalInjected.toLocaleString()}. Configure debt terms and working capital velocity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Equity & Debt Structure */}
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block pb-2 border-b border-slate-200 dark:border-slate-800">
            CAPITAL STRUCTURE & BANK DEBT
          </span>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-500 block mb-1">Founder Paid-in Capital / Equity:</label>
              <input
                type="number"
                value={funding.founderEquity}
                onChange={(e) => handleUpdateFunding({ founderEquity: Number(e.target.value) })}
                className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
              />
            </div>

            <div>
              <label className="text-slate-500 block mb-1">Third-Party Investor / Angel Equity:</label>
              <input
                type="number"
                value={funding.investorEquity}
                onChange={(e) => handleUpdateFunding({ investorEquity: Number(e.target.value) })}
                className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
              />
            </div>

            <div>
              <label className="text-slate-500 block mb-1">Bank Loan / Term Debt Facility:</label>
              <input
                type="number"
                value={funding.bankLoanAmount}
                onChange={(e) => handleUpdateFunding({ bankLoanAmount: Number(e.target.value) })}
                className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 block mb-1">Interest Rate (% p.a.):</label>
                <input
                  type="number"
                  step="0.5"
                  value={funding.interestRatePct}
                  onChange={(e) => handleUpdateFunding({ interestRatePct: Number(e.target.value) })}
                  className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Loan Term (Months):</label>
                <input
                  type="number"
                  value={funding.loanTermMonths}
                  onChange={(e) => handleUpdateFunding({ loanTermMonths: Number(e.target.value) })}
                  className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                />
              </div>
            </div>

            {/* V1 Amortization Metrics Summary Card */}
            {loanMetricsMonth1 && (
              <div className={`p-3.5 rounded-xl border space-y-2 ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'}`}>
                <div className="flex justify-between items-center text-[11px] font-bold pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-[#5584B4]" />
                    V1 Amortization Schedule (Month 1)
                  </span>
                  <span className="text-[10px] text-[#5584B4] font-mono">COA: 4-8-1-30</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Monthly PMT</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      R {Math.round(loanMetricsMonth1.repayment + loanMetricsMonth1.interest).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Capital Principal</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      R {Math.round(loanMetricsMonth1.repayment).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Monthly Interest</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      R {Math.round(loanMetricsMonth1.interest).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Working Capital Days (Matching video at 00:55) */}
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block pb-2 border-b border-slate-200 dark:border-slate-800">
            WORKING CAPITAL VELOCITY (DAYS)
          </span>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Inventory</div>
              <input
                type="number"
                value={funding.inventoryDays}
                onChange={(e) => handleUpdateFunding({ inventoryDays: Number(e.target.value) })}
                className="w-full text-center p-1 rounded font-bold text-sm bg-transparent border-none focus:outline-none"
              />
              <div className="text-[9px] text-slate-400">DIO (Days)</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Receivables</div>
              <input
                type="number"
                value={funding.debtorDays}
                onChange={(e) => handleUpdateFunding({ debtorDays: Number(e.target.value) })}
                className="w-full text-center p-1 rounded font-bold text-sm bg-transparent border-none focus:outline-none text-[#5584B4]"
              />
              <div className="text-[9px] text-slate-400">DSO (Days)</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Payables</div>
              <input
                type="number"
                value={funding.creditorDays}
                onChange={(e) => handleUpdateFunding({ creditorDays: Number(e.target.value) })}
                className="w-full text-center p-1 rounded font-bold text-sm bg-transparent border-none focus:outline-none text-emerald-500"
              />
              <div className="text-[9px] text-slate-400">DPO (Days)</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <div className="flex justify-between font-bold">
              <span>Cash Conversion Cycle (CCC):</span>
              <span className="text-[#5584B4]">
                {funding.debtorDays + funding.inventoryDays - funding.creditorDays} Days
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Measures how fast capital invested in inventory and customer receivables converts back into liquid cash.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
