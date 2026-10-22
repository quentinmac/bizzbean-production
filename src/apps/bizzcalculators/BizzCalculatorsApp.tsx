import React, { useState } from 'react';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';

interface BizzCalculatorsAppProps {
  theme?: 'light' | 'dark';
  onBackToWorkstation?: () => void;
  onNavigateToStage?: (stageId: string, solutionId?: string) => void;
}

export const BizzCalculatorsApp: React.FC<BizzCalculatorsAppProps> = ({
  theme = 'light',
  onBackToWorkstation,
  onNavigateToStage,
}) => {
  const isDark = theme === 'dark';

  // Calculator selector
  const [activeCalc, setActiveCalc] = useState<
    'cac-ltv' | 'working-capital' | 'burn-runway' | 'margin-price' | 'labor-rate'
  >('cac-ltv');

  // 1. CAC : LTV states
  const [cac, setCac] = useState<number>(450);
  const [arpu, setArpu] = useState<number>(120);
  const [churnRate, setChurnRate] = useState<number>(4.5);
  const [grossMarginPct, setGrossMarginPct] = useState<number>(75);

  const avgLifetimeMonths = churnRate > 0 ? 100 / churnRate : 24;
  const ltv = Math.round(arpu * (grossMarginPct / 100) * avgLifetimeMonths);
  const ltvCacRatio = cac > 0 ? (ltv / cac).toFixed(2) : '0';
  const paybackMonths = arpu * (grossMarginPct / 100) > 0 ? (cac / (arpu * (grossMarginPct / 100))).toFixed(1) : '0';

  // 2. Working Capital states
  const [dso, setDso] = useState<number>(45); // Days Sales Outstanding
  const [dio, setDio] = useState<number>(30); // Days Inventory Outstanding
  const [dpo, setDpo] = useState<number>(28); // Days Payable Outstanding
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(150000);

  const cccDays = dso + dio - dpo; // Cash Conversion Cycle
  const dailyTurnover = monthlyRevenue / 30;
  const trappedWorkingCapital = Math.round(dailyTurnover * Math.max(0, cccDays));

  // 3. Burn & Runway states
  const [cashBalance, setCashBalance] = useState<number>(350000);
  const [monthlyReceipts, setMonthlyReceipts] = useState<number>(85000);
  const [monthlyExpenditures, setMonthlyExpenditures] = useState<number>(120000);

  const netBurn = Math.max(0, monthlyExpenditures - monthlyReceipts);
  const runwayMonths = netBurn > 0 ? (cashBalance / netBurn).toFixed(1) : 'Infinite';

  // 4. Labor Rate states
  const [employeeMonthlySalary, setEmployeeMonthlySalary] = useState<number>(25000);
  const [benefitsTaxesPct, setBenefitsTaxesPct] = useState<number>(20);
  const [billableHoursPerMonth, setBillableHoursPerMonth] = useState<number>(120);

  const totalEmployeeCost = employeeMonthlySalary * (1 + benefitsTaxesPct / 100);
  const trueHourlyCost = billableHoursPerMonth > 0 ? Math.round((totalEmployeeCost / billableHoursPerMonth) * 100) / 100 : 0;
  const targetBillableRate = Math.round(trueHourlyCost * 1.5 * 100) / 100;

  return (
    <div className={`p-4 sm:p-6 space-y-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Top Selector of Specialized Calculators */}
      <div
        className={`p-1.5 rounded-xl border flex flex-wrap items-center gap-1 shrink-0 ${
          isDark ? 'bg-[#12172A] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        {[
          { id: 'cac-ltv', label: '1. CAC : LTV & Payback' },
          { id: 'working-capital', label: '2. Working Capital & Cycle' },
          { id: 'burn-runway', label: '3. Cash Burn & Runway Alarm' },
          { id: 'labor-rate', label: '4. Employee True Hourly Cost' },
        ].map((tab) => {
          const isActive = activeCalc === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCalc(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all lowercase ${
                isActive
                  ? isDark
                    ? 'bg-[#1E2548] text-[#DDEBF7] border border-[#5584B4] shadow-xs'
                    : 'bg-[#12172A] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CALCULATOR 1: CAC : LTV & PAYBACK */}
      {activeCalc === 'cac-ltv' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">LTV : CAC Ratio</div>
              <div className={`font-mono text-xl sm:text-2xl font-bold mt-1 tabular-nums ${Number(ltvCacRatio) >= 3 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {ltvCacRatio}x
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Benchmark Target: &ge; 3.0x</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Payback Period</div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                {paybackMonths} Months
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Benchmark: &lt; 12 Mo</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Lifetime Value (LTV)</div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-[#5584B4] mt-1 tabular-nums">
                ${ltv.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{avgLifetimeMonths.toFixed(1)} mo retention</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Unit Health Status</div>
              <div className="font-mono text-base font-bold text-emerald-500 mt-1">
                {Number(ltvCacRatio) >= 3 ? 'Capital Viable' : 'Refinement Needed'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Venture investment grade</div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              UNIT ECONOMICS CALIBRATION SLIDERS
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Customer Acquisition Cost (CAC):</span>
                  <span className="font-bold">${cac}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="25"
                  value={cac}
                  onChange={(e) => setCac(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Monthly ARPU (Avg Revenue / Account):</span>
                  <span className="font-bold">${arpu}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={arpu}
                  onChange={(e) => setArpu(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Monthly Account Churn Rate (%):</span>
                  <span className="font-bold">{churnRate}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={churnRate}
                  onChange={(e) => setChurnRate(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Gross Margin %:</span>
                  <span className="font-bold">{grossMarginPct}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="95"
                  step="5"
                  value={grossMarginPct}
                  onChange={(e) => setGrossMarginPct(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 2: WORKING CAPITAL & CYCLE */}
      {activeCalc === 'working-capital' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Cash Conversion Cycle</div>
              <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                {cccDays} Days
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">DSO ({dso}) + DIO ({dio}) - DPO ({dpo})</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Trapped Working Capital</div>
              <div className="font-mono text-2xl font-bold text-amber-500 mt-1 tabular-nums">
                R{trappedWorkingCapital.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Capital tied up in receivables & inventory</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Optimization Recommendation</div>
              <div className="font-mono text-sm font-bold text-emerald-500 mt-1">
                {cccDays > 45 ? 'Push Supplier Terms to Net-45' : 'Working Capital Balanced'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Improves non-dilutive liquidity</div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              WORKING CAPITAL PARAMETERS
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Debtor Days (DSO):</span>
                  <span className="font-bold">{dso} Days</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="1"
                  value={dso}
                  onChange={(e) => setDso(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Inventory Days (DIO):</span>
                  <span className="font-bold">{dio} Days</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={dio}
                  onChange={(e) => setDio(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Creditor Days (DPO):</span>
                  <span className="font-bold">{dpo} Days</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="1"
                  value={dpo}
                  onChange={(e) => setDpo(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 3: CASH BURN & RUNWAY */}
      {activeCalc === 'burn-runway' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Net Monthly Burn</div>
              <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                R{netBurn.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Expenditures minus collections</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Estimated Cash Runway</div>
              <div className="font-mono text-2xl font-bold text-emerald-500 mt-1 tabular-nums">
                {runwayMonths} {typeof runwayMonths === 'number' || !isNaN(Number(runwayMonths)) ? 'Months' : ''}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Threshold: Minimum 12 Mo</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Refinancing Horizon</div>
              <div className="font-mono text-base font-bold text-amber-500 mt-1">
                {Number(runwayMonths) < 8 ? 'Raise Capital Immediately' : 'Comfortable Operating Horizon'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Preparation timeline: 6 Mo before zero</div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              RUNWAY LIQUIDITY PARAMETERS
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                  Cash In Bank (ZAR):
                </label>
                <input
                  type="number"
                  value={cashBalance}
                  onChange={(e) => setCashBalance(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                  Monthly Cash Receipts:
                </label>
                <input
                  type="number"
                  value={monthlyReceipts}
                  onChange={(e) => setMonthlyReceipts(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                  Total Monthly Expenditures:
                </label>
                <input
                  type="number"
                  value={monthlyExpenditures}
                  onChange={(e) => setMonthlyExpenditures(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 4: LABOR RATE */}
      {activeCalc === 'labor-rate' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">True Cost Per Billable Hour</div>
              <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                R{trueHourlyCost.toFixed(2)} / hr
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Inclusive of taxes & benefits burden</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Recommended Billing Rate</div>
              <div className="font-mono text-2xl font-bold text-emerald-500 mt-1 tabular-nums">
                R{targetBillableRate.toFixed(2)} / hr
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">50% markup to cover overhead & profit</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Fully Burdened Monthly Cost</div>
              <div className="font-mono text-2xl font-bold text-[#5584B4] mt-1 tabular-nums">
                R{totalEmployeeCost.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Salary + {benefitsTaxesPct}% benefits</div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              EMPLOYEE LABOR BURDEN PARAMETERS
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                  Base Monthly Gross Salary (ZAR):
                </label>
                <input
                  type="number"
                  value={employeeMonthlySalary}
                  onChange={(e) => setEmployeeMonthlySalary(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                  Taxes, Benefits & Overhead Burden %:
                </label>
                <input
                  type="number"
                  value={benefitsTaxesPct}
                  onChange={(e) => setBenefitsTaxesPct(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                  Billable Productive Hours / Month:
                </label>
                <input
                  type="number"
                  value={billableHoursPerMonth}
                  onChange={(e) => setBillableHoursPerMonth(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
