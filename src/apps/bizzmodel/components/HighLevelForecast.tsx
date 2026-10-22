import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  Sparkles,
  Download,
  Printer,
  CheckCircle2,
  Sliders,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  BarChart3,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { BizzModelState, HighLevelForecastData } from '../constants';

interface HighLevelForecastProps {
  theme?: 'light' | 'dark';
  modelState: BizzModelState;
  onUpdateState: (updater: (prev: BizzModelState) => BizzModelState) => void;
  onSwitchToBizzModel?: () => void;
  onSwitchToBizzPlan?: () => void;
}

export const HighLevelForecast: React.FC<HighLevelForecastProps> = ({
  theme = 'light',
  modelState,
  onUpdateState,
  onSwitchToBizzModel,
  onSwitchToBizzPlan,
}) => {
  const isDark = theme === 'dark';

  const [activeSubTab, setActiveSubTab] = useState<
    'liquidity-interest' | 'cumulative-debt' | 'trading-account' | 'trading-summary' | 'brief'
  >('liquidity-interest');

  const [forecastHorizon, setForecastHorizon] = useState<12 | 24 | 36>(
    modelState.highLevelForecast?.targetHorizonMonths || 36
  );

  // Forecast state
  const forecast = modelState.highLevelForecast || {
    dailyRevenue: 4500,
    dailyGrowthPct: 0.25,
    workingDaysPerMonth: 22,
    costOfSalesPct: 28,
    directLaborPct: 22,
    fixedOpexMonthly: 48000,
    cashReserves: 250000,
    debtFunding: 120000,
    interestRatePct: 11.5,
    targetHorizonMonths: 36,
  };

  const [dailyRev, setDailyRev] = useState<number>(forecast.dailyRevenue);
  const [dailyGrowth, setDailyGrowth] = useState<number>(forecast.dailyGrowthPct);
  const [workingDays, setWorkingDays] = useState<number>(forecast.workingDaysPerMonth);
  const [cosPct, setCosPct] = useState<number>(forecast.costOfSalesPct);
  const [directLaborPct, setDirectLaborPct] = useState<number>(forecast.directLaborPct);
  const [fixedOpex, setFixedOpex] = useState<number>(forecast.fixedOpexMonthly);
  const [cashReserves, setCashReserves] = useState<number>(forecast.cashReserves);
  const [debtFunding, setDebtFunding] = useState<number>(forecast.debtFunding);
  const [interestRate, setInterestRate] = useState<number>(forecast.interestRatePct);
  const [syncedToast, setSyncedToast] = useState<boolean>(false);

  // Base monthly calculation (Month 1)
  const month1Revenue = dailyRev * workingDays;
  const month1Cos = month1Revenue * (cosPct / 100);
  const month1Labor = month1Revenue * (directLaborPct / 100);
  const month1TotalDirect = month1Cos + month1Labor;
  const month1GrossProfit = month1Revenue - month1TotalDirect;
  const month1GrossMargin = month1Revenue > 0 ? (month1GrossProfit / month1Revenue) * 100 : 0;
  const month1NetProfit = month1GrossProfit - fixedOpex;
  const month1NetMargin = month1Revenue > 0 ? (month1NetProfit / month1Revenue) * 100 : 0;

  // Monthly compound growth rate derived from daily growth
  const monthlyGrowthRatePct = Math.pow(1 + dailyGrowth / 100, workingDays) - 1;

  // Trajectory timeline for Horizon (12, 24, 36 months)
  const timeline = useMemo(() => {
    const list = [];
    let curRev = month1Revenue;
    let curCash = cashReserves;
    let curDebt = debtFunding;
    let cumulativeBurn = 0;
    let breakEvenMonth: number | null = null;

    for (let m = 1; m <= forecastHorizon; m++) {
      const rev = curRev;
      const direct = rev * ((cosPct + directLaborPct) / 100);
      const gross = rev - direct;
      const net = gross - fixedOpex;
      const monthlyInterest = curDebt * (interestRate / 100 / 12);
      const netAfterInterest = net - monthlyInterest;

      curCash += netAfterInterest;
      if (netAfterInterest < 0) {
        cumulativeBurn += Math.abs(netAfterInterest);
      } else if (breakEvenMonth === null) {
        breakEvenMonth = m;
      }

      list.push({
        month: m,
        revenue: Math.round(rev),
        directCosts: Math.round(direct),
        grossProfit: Math.round(gross),
        netProfit: Math.round(netAfterInterest),
        cashBalance: Math.round(curCash),
        debtBalance: Math.round(curDebt),
      });

      curRev *= 1 + monthlyGrowthRatePct;
      if (m > 12 && curDebt > 0) {
        curDebt = Math.max(0, curDebt - debtFunding / (forecastHorizon - 12));
      }
    }

    return {
      months: list,
      breakEvenMonth,
      peakBurn: Math.round(cumulativeBurn),
      exitRevenue: list[list.length - 1]?.revenue || 0,
      exitARR: (list[list.length - 1]?.revenue || 0) * 12,
      exitCash: list[list.length - 1]?.cashBalance || 0,
    };
  }, [
    month1Revenue,
    cosPct,
    directLaborPct,
    fixedOpex,
    cashReserves,
    debtFunding,
    interestRate,
    forecastHorizon,
    monthlyGrowthRatePct,
  ]);

  const handleSyncToModelAndPlan = () => {
    onUpdateState((prev) => {
      // Update highLevelForecast
      const updatedForecast: HighLevelForecastData = {
        dailyRevenue: dailyRev,
        dailyGrowthPct: dailyGrowth,
        workingDaysPerMonth: workingDays,
        costOfSalesPct: cosPct,
        directLaborPct: directLaborPct,
        fixedOpexMonthly: fixedOpex,
        cashReserves,
        debtFunding,
        interestRatePct: interestRate,
        targetHorizonMonths: forecastHorizon,
      };

      // Also map primary retail product unit sales in revenueItems
      const updatedRevenue = prev.revenueItems.map((item, idx) => {
        if (idx === 0) {
          return {
            ...item,
            costOfSalesPct: cosPct,
            monthlyUnits: timeline.months.slice(0, 12).map((tm) => Math.round(tm.revenue / item.unitPrice)),
          };
        }
        return item;
      });

      return {
        ...prev,
        highLevelForecast: updatedForecast,
        revenueItems: updatedRevenue,
        funding: {
          ...prev.funding,
          bankLoanAmount: debtFunding,
          interestRatePct: interestRate,
        },
      };
    });

    setSyncedToast(true);
    setTimeout(() => setSyncedToast(false), 3000);
  };

  return (
    <div className={`p-4 sm:p-6 space-y-6 font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* ===================================================================== */}
      {/* 1. TOP CONTROL BAR (MATCHING VIDEO AT 00:22)                         */}
      {/* ===================================================================== */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#5584B4]/20 border border-[#5584B4]/40 text-[#5584B4]">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold uppercase text-slate-900 dark:text-white tracking-wide">
                HI-LEVEL FORECAST
              </span>
              <span className="text-[10px] text-slate-400">
                Rapid strategic forecasting
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 uppercase font-bold">
                MIN ANNUAL GROWTH: 10% (MONTHS 12, 24, 36)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Perform a rapid 10-minute high-level financial forecast. Feeds real-time sales & debt parameters into bizzmodel and bizzplan.
            </div>
          </div>
        </div>

        {/* Action Buttons: 10-Min Rapid Model / Sync to Model */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncToModelAndPlan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold uppercase shadow-xs transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refine & Sync to Model</span>
          </button>

          {onSwitchToBizzModel && (
            <button
              onClick={onSwitchToBizzModel}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white text-xs font-bold uppercase transition-colors"
            >
              <span>Open in BizzModel</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {syncedToast && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2 animate-fade-in font-bold">
          <CheckCircle2 className="h-4 w-4" />
          <span>Forecast data successfully synchronized with bizzmodel engine and bizzplan report!</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. SUBHEADER REPORT TABS (MATCHING VIDEO AT 00:24)                    */}
      {/* ===================================================================== */}
      <div
        className={`px-3 py-1.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
          isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: 'liquidity-interest', label: 'Liquidity & Interest' },
            { id: 'cumulative-debt', label: 'Cumulative Debt' },
            { id: 'trading-account', label: 'Trading Account' },
            { id: 'trading-summary', label: 'Trading Summary / Trajectory' },
            { id: 'brief', label: 'Executive Brief' },
          ].map((tab) => {
            const isSelected = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all lowercase whitespace-nowrap ${
                  isSelected
                    ? isDark
                      ? 'bg-[#1E2548] text-white border border-[#5584B4] shadow-xs'
                      : 'bg-[#12172A] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Horizon selector: 12 / 24 / 36 Months */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Horizon:</span>
          {[12, 24, 36].map((h) => (
            <button
              key={h}
              onClick={() => setForecastHorizon(h as any)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                forecastHorizon === h
                  ? 'bg-[#5584B4] text-white'
                  : 'bg-slate-200 dark:bg-[#1E2548] text-slate-600 dark:text-slate-300'
              }`}
            >
              {h}M
            </button>
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. MAIN WORK AREA: REVENUE CALCULATOR + CHART (VIDEO 00:22 - 00:26)   */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: REVENUE & DIRECT COST CALCULATOR (45%) */}
        <div
          className={`lg:col-span-5 p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase text-slate-900 dark:text-white">
              REVENUE CALCULATOR
            </span>
            <span className="text-[10px] text-emerald-500 font-bold uppercase">
              10-Minute Rapid Inputs
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Daily revenue */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Daily Revenue:</span>
                <span className="font-bold text-slate-900 dark:text-white">R {dailyRev.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="250"
                value={dailyRev}
                onChange={(e) => setDailyRev(Number(e.target.value))}
                className="w-full accent-[#5584B4]"
              />
            </div>

            {/* Daily growth % */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Daily Growth %:</span>
                <span className="font-bold text-[#5584B4]">+{dailyGrowth}% / day</span>
              </div>
              <input
                type="range"
                min="0"
                max="2.0"
                step="0.05"
                value={dailyGrowth}
                onChange={(e) => setDailyGrowth(Number(e.target.value))}
                className="w-full accent-[#5584B4]"
              />
              <div className="text-[10px] text-slate-400 mt-0.5">
                Approx. +{(monthlyGrowthRatePct * 100).toFixed(1)}% monthly compounded growth
              </div>
            </div>

            {/* Working days in month */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Working Days / Month:</span>
                <span className="font-bold">{workingDays} Days</span>
              </div>
              <input
                type="range"
                min="18"
                max="30"
                value={workingDays}
                onChange={(e) => setWorkingDays(Number(e.target.value))}
                className="w-full accent-[#5584B4]"
              />
            </div>

            {/* Monthly Revenue Display */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 flex justify-between items-center font-bold">
              <span>Month 01 Revenue:</span>
              <span className="text-sm text-slate-900 dark:text-white">R {month1Revenue.toLocaleString()}</span>
            </div>

            {/* Cost of sales % */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Materials & COGS (% of Rev):</span>
                <span className="font-bold text-amber-500">{cosPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="70"
                value={cosPct}
                onChange={(e) => setCosPct(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Direct labor % */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Direct Labor (% of Rev):</span>
                <span className="font-bold text-amber-500">{directLaborPct}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={directLaborPct}
                onChange={(e) => setDirectLaborPct(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Fixed OpEx monthly */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Fixed Monthly OpEx:</span>
                <span className="font-bold text-rose-500">R {fixedOpex.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="200000"
                step="2500"
                value={fixedOpex}
                onChange={(e) => setFixedOpex(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>

            {/* Bank loan / debt funding */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Bank Debt / Loan Facility:</span>
                <span className="font-bold text-[#5584B4]">R {debtFunding.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max="500000"
                step="10000"
                value={debtFunding}
                onChange={(e) => setDebtFunding(Number(e.target.value))}
                className="w-full accent-[#5584B4]"
              />
            </div>
          </div>

          {/* Quick Summary Pill */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
            <div className="flex justify-between text-emerald-500 font-bold">
              <span>Gross Margin Floor:</span>
              <span>{month1GrossMargin.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Month 01 Net Profit:</span>
              <span className={month1NetProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                R {month1NetProfit.toLocaleString()} ({month1NetMargin.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: BANK & INTEREST-BEARING DEBT CHART + TRAJECTORY (55%) */}
        <div
          className={`lg:col-span-7 p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
          }`}
        >
          {/* Header of chart */}
          <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 gap-2">
            <span className="text-xs font-bold uppercase text-slate-900 dark:text-white">
              BANK & INTEREST-BEARING DEBT FUNDING TRAJECTORY
            </span>
            <span className="text-[10px] text-slate-400">
              Months 01 - {forecastHorizon}
            </span>
          </div>

          {/* Key Milestone Stat Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Exit ARR</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                R {(timeline.exitARR / 1000).toFixed(0)}k
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Break-Even</div>
              <div className="font-bold text-emerald-500 mt-0.5">
                {timeline.breakEvenMonth ? `Month ${timeline.breakEvenMonth}` : 'Post-36'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Cumulative Burn</div>
              <div className="font-bold text-amber-500 mt-0.5">
                R {timeline.peakBurn.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Closing Cash</div>
              <div className="font-bold text-[#5584B4] mt-0.5">
                R {timeline.exitCash.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Visual Bar Chart (Directly Matching the Video at 00:24-00:26) */}
          <div className="space-y-2 pt-2">
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>Monthly Cash Inflow vs Reserve Trajectory</span>
              <span className="text-emerald-500 font-bold">● Positive Growth Velocity</span>
            </div>

            {/* Visual Bars Container */}
            <div className="h-52 w-full p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-end gap-1.5 overflow-x-auto">
              {timeline.months.map((tm) => {
                const maxVal = Math.max(...timeline.months.map((m) => m.revenue));
                const heightPct = maxVal > 0 ? Math.min(82, Math.max(10, (tm.revenue / maxVal) * 82)) : 20;
                const isProfitable = tm.netProfit >= 0;

                return (
                  <div
                    key={tm.month}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative min-w-[12px]"
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 z-20 px-2 py-1 rounded bg-black text-white text-[9px] pointer-events-none whitespace-nowrap shadow-xl">
                      M{tm.month}: R{tm.revenue.toLocaleString()} (Net: R{tm.netProfit.toLocaleString()})
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-sm transition-all shrink-0 ${
                        isProfitable
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                          : 'bg-gradient-to-t from-amber-600 to-amber-400'
                      }`}
                    />

                    {/* Month Label */}
                    <span className="text-[8px] text-slate-500 mt-1 shrink-0">
                      {tm.month % 3 === 0 ? `M${tm.month}` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer of Right Card */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>Dynamic connection active: Feeds directly into BizzModel & BizzPlan.</span>
            <button
              onClick={handleSyncToModelAndPlan}
              className="px-3 py-1.5 rounded-lg border border-[#D8CEBC] dark:border-[#252E4A] hover:bg-slate-100 dark:hover:bg-[#1E2548] text-slate-800 dark:text-slate-200 font-bold uppercase transition-colors"
            >
              Push to BizzPlan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
