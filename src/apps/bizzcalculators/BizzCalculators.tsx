import React, { useState } from 'react';
import {
  Calculator,
  X,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export interface BizzCalculatorsProps {
  theme?: 'light' | 'dark';
  onClose: () => void;
  initialCalculatorId?: string;
  onSelectCalculator?: (id: string) => void;
}

export const BizzCalculators: React.FC<BizzCalculatorsProps> = ({
  theme = 'light',
  onClose,
  initialCalculatorId = 'cac-ltv',
  onSelectCalculator,
}) => {
  const isDark = theme === 'dark';

  const [activeCalc, setActiveCalc] = useState<
    'cac-ltv' | 'working-capital' | 'burn-runway' | 'margin-price' | 'labor-rate'
  >((initialCalculatorId as any) || 'cac-ltv');

  const handleSelect = (id: any) => {
    setActiveCalc(id);
    if (onSelectCalculator) onSelectCalculator(id);
  };

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
  const [dso, setDso] = useState<number>(45);
  const [dio, setDio] = useState<number>(30);
  const [dpo, setDpo] = useState<number>(28);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(150000);

  const cccDays = dso + dio - dpo;
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
    <div
      className={`w-full min-h-full flex flex-col font-mono select-none transition-colors ${
        isDark ? 'bg-[#0A0D14] text-slate-100' : 'bg-[#FAF8F5] text-slate-900'
      }`}
    >
      <header
        className={`px-4 sm:px-6 py-3 border-b shrink-0 flex items-center justify-between gap-3 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#5584B4]/20 border border-[#5584B4]/40 text-[#5584B4]">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                BIZZCALCULATORS
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30 uppercase">
                SPECIALIZED SUITE
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              High-Precision Venture Unit Economics & Ratio Modeler
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {/* Calculator sub tabs */}
      <div
        className={`px-4 py-2 border-b flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 ${
          isDark ? 'bg-[#0E1322] border-[#1D2644]' : 'bg-[#F4EFE6] border-[#E8E2D8]'
        }`}
      >
        {[
          { id: 'cac-ltv', label: '1. CAC : LTV & Payback' },
          { id: 'working-capital', label: '2. Working Capital & Cycle' },
          { id: 'burn-runway', label: '3. Cash Burn & Runway Alarm' },
          { id: 'labor-rate', label: '4. Employee True Hourly Cost' },
        ].map((tab) => {
          const isSelected = activeCalc === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                isSelected
                  ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-xs'
                  : isDark
                  ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <main className="flex-grow p-4 sm:p-6 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
        {activeCalc === 'cac-ltv' && (
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block pb-2 border-b border-slate-200 dark:border-slate-800">
              CAC : LTV & PAYBACK ANALYSIS
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Estimated LTV</div>
                <div className="font-bold text-lg text-emerald-500">${ltv.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">LTV : CAC Ratio</div>
                <div className="font-bold text-lg text-[#5584B4]">{ltvCacRatio}x</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Payback Period</div>
                <div className="font-bold text-lg text-amber-500">{paybackMonths} Mo</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Avg Lifetime</div>
                <div className="font-bold text-lg">{avgLifetimeMonths.toFixed(1)} Mo</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <label className="text-slate-400 block mb-1">Customer Acquisition Cost (CAC $):</label>
                <input
                  type="number"
                  value={cac}
                  onChange={(e) => setCac(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Monthly ARPU ($):</label>
                <input
                  type="number"
                  value={arpu}
                  onChange={(e) => setArpu(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                />
              </div>
            </div>
          </div>
        )}

        {activeCalc === 'working-capital' && (
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block pb-2 border-b border-slate-200 dark:border-slate-800">
              WORKING CAPITAL & CASH CONVERSION CYCLE
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Cash Conversion Cycle</div>
                <div className="font-bold text-lg text-[#5584B4]">{cccDays} Days</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Trapped Working Capital</div>
                <div className="font-bold text-lg text-amber-500">${trappedWorkingCapital.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {activeCalc === 'burn-runway' && (
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block pb-2 border-b border-slate-200 dark:border-slate-800">
              CASH BURN & RUNWAY ALARM
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Net Monthly Burn</div>
                <div className="font-bold text-lg text-rose-500">${netBurn.toLocaleString()}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Estimated Runway</div>
                <div className="font-bold text-lg text-emerald-500">{runwayMonths} Months</div>
              </div>
            </div>
          </div>
        )}

        {activeCalc === 'labor-rate' && (
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block pb-2 border-b border-slate-200 dark:border-slate-800">
              EMPLOYEE TRUE HOURLY COST & TARGET BILLABLE RATE
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">True Hourly Cost</div>
                <div className="font-bold text-lg text-slate-900 dark:text-white">${trueHourlyCost} / hr</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Target Billable Rate (50% Margin)</div>
                <div className="font-bold text-lg text-emerald-500">${targetBillableRate} / hr</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default BizzCalculators;
