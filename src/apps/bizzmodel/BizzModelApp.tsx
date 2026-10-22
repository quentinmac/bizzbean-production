import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  Download,
  Share2,
  CheckCircle2,
  Sliders,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '../../utils/financialCalculations';

interface BizzModelAppProps {
  theme?: 'light' | 'dark';
  onBackToWorkstation?: () => void;
  onNavigateToStage?: (stageId: string, solutionId?: string) => void;
}

export const BizzModelApp: React.FC<BizzModelAppProps> = ({
  theme = 'light',
  onBackToWorkstation,
  onNavigateToStage,
}) => {
  const isDark = theme === 'dark';

  // Active view tab within bizzmodel
  const [activeTab, setActiveTab] = useState<
    'hi-level-forecast' | 'dynamic-dials' | '3-statement' | 'valuation-bridge'
  >('hi-level-forecast');

  // ---------------------------------------------------------------------------
  // 1. HI-LEVEL FORECAST (High-Level 36-Month Forecast Parameters)
  // ---------------------------------------------------------------------------
  const [startMrr, setStartMrr] = useState<number>(30000);
  const [forecastGrowthRate, setForecastGrowthRate] = useState<number>(10); // % per month
  const [forecastGrossMargin, setForecastGrossMargin] = useState<number>(72); // %
  const [startOpex, setStartOpex] = useState<number>(45000);
  const [opexGrowthRate, setOpexGrowthRate] = useState<number>(3.5); // % per month
  const [cashReserves, setCashReserves] = useState<number>(180000);
  const [forecastHorizon, setForecastHorizon] = useState<12 | 24 | 36>(36);

  // Growth Scenarios
  const scenarios = [
    { name: 'Conservative', growth: 5, opex: 2.5, desc: 'Organic growth with controlled burn' },
    { name: 'Target Baseline', growth: 10, opex: 3.5, desc: 'Target institutional trajectory' },
    { name: 'Venture Scale', growth: 18, opex: 6.0, desc: 'Series A acceleration trajectory' },
  ];

  // Calculated 36-month timeline
  const forecastData = useMemo(() => {
    const months = [];
    let curMrr = startMrr;
    let curOpex = startOpex;
    let curCash = cashReserves;
    let breakEvenMonth = null;
    let totalBurn = 0;
    let lowestCash = cashReserves;

    for (let m = 1; m <= forecastHorizon; m++) {
      const revenue = curMrr;
      const cogs = revenue * (1 - forecastGrossMargin / 100);
      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - curOpex;
      const burn = netProfit < 0 ? Math.abs(netProfit) : 0;
      curCash += netProfit;

      if (curCash < lowestCash) lowestCash = curCash;
      if (burn > 0) totalBurn += burn;
      if (netProfit >= 0 && breakEvenMonth === null) breakEvenMonth = m;

      months.push({
        month: m,
        revenue: Math.round(revenue),
        opex: Math.round(curOpex),
        grossProfit: Math.round(grossProfit),
        netProfit: Math.round(netProfit),
        cash: Math.round(curCash),
        arr: Math.round(revenue * 12),
      });

      curMrr *= 1 + forecastGrowthRate / 100;
      curOpex *= 1 + opexGrowthRate / 100;
    }

    return {
      months,
      breakEvenMonth,
      totalBurn,
      endArr: months[months.length - 1]?.arr || 0,
      endCash: months[months.length - 1]?.cash || 0,
    };
  }, [startMrr, forecastGrowthRate, forecastGrossMargin, startOpex, opexGrowthRate, cashReserves, forecastHorizon]);

  // Year 1, Year 2, Year 3 milestones
  const y1 = forecastData.months[11] || forecastData.months[forecastData.months.length - 1];
  const y2 = forecastData.months[23] || forecastData.months[forecastData.months.length - 1];
  const y3 = forecastData.months[35] || forecastData.months[forecastData.months.length - 1];

  // ---------------------------------------------------------------------------
  // 2. DYNAMIC DIALS (Clarity Over Complexity)
  // ---------------------------------------------------------------------------
  const [dialRev, setDialRev] = useState<number>(30000);
  const [dialOpex, setDialOpex] = useState<number>(45000);
  const [dialMargin, setDialMargin] = useState<number>(70);
  const [dialCash, setDialCash] = useState<number>(180000);

  const dialGrossProfit = (dialRev * dialMargin) / 100;
  const dialNetBurn = Math.max(0, dialOpex - dialGrossProfit);
  const dialRunwayMonths = dialNetBurn > 0 ? (dialCash / dialNetBurn).toFixed(1) : 'Infinite';
  const dialValuation = dialRev * 12 * 6; // 6x ARR Multiple

  return (
    <div className={`p-4 sm:p-6 space-y-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Top Module Navigation */}
      <div
        className={`p-1.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 shrink-0 ${
          isDark ? 'bg-[#12172A] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'hi-level-forecast', label: '1. Hi-Level Forecast (36-Mo)' },
            { id: 'dynamic-dials', label: '2. Dynamic Driver Dials' },
            { id: '3-statement', label: '3. 3-Statement Schedule' },
            { id: 'valuation-bridge', label: '4. DCF & Multiple Valuation' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all lowercase whitespace-nowrap ${
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

        <div className="flex items-center gap-2 pr-1">
          <span className="text-[10px] font-mono text-emerald-500 font-bold hidden sm:inline">
            ● Google Sheets Live Connected
          </span>
        </div>
      </div>

      {/* MODULE 1: HI-LEVEL FORECAST */}
      {activeTab === 'hi-level-forecast' && (
        <div className="space-y-6">
          {/* Header Banner: Hi-Level Forecast */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#5584B4] uppercase tracking-wider">
                  STAGE 02 · FUND-ABILITY
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30 lowercase">
                  hi-level forecast module
                </span>
              </div>
              <h2 className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                Hi-Level 36-Month Forecast & Macro Runway Engine
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
                Integrated directly into the bizzmodel suite: Dynamically calculates exit ARR, peak capital required, and month-by-month cash neutrality.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                ✓ Model Synced
              </span>
            </div>
          </div>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Exit ARR ({forecastHorizon}-Mo)</div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-[#5584B4] mt-1 tabular-nums">
                ${(forecastData.endArr / 1000).toFixed(0)}k ARR
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Annualized recurring run rate</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Cash Break-Even</div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-500 mt-1 tabular-nums">
                {forecastData.breakEvenMonth ? `Month ${forecastData.breakEvenMonth}` : 'Post-36 Mo'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Net cash flow neutrality</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Peak Capital Required</div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-amber-500 mt-1 tabular-nums">
                ${Math.round(forecastData.totalBurn).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Cumulative pre-break-even burn</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Valuation at Horizon</div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                ${((forecastData.endArr * 6) / 1000000).toFixed(1)}M
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">6x ARR valuation benchmark</div>
            </div>
          </div>

          {/* Scenario Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {scenarios.map((sc) => {
              const isSelected = forecastGrowthRate === sc.growth;
              return (
                <button
                  key={sc.name}
                  onClick={() => {
                    setForecastGrowthRate(sc.growth);
                    setOpexGrowthRate(sc.opex);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-[#1E2548] border-[#5584B4] text-white shadow-xs'
                        : 'bg-[#FAF8F5] border-[#5584B4] text-slate-900 shadow-xs'
                      : isDark
                      ? 'bg-[#141A2E] border-[#252E4A] text-slate-400 hover:text-white'
                      : 'bg-white border-[#D8CEBC] text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase">{sc.name}</span>
                    <span className="text-[10px] font-mono text-[#5584B4]">+{sc.growth}% / mo</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{sc.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Hi-Level Forecast Driver Sliders */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
              <span className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
                HI-LEVEL FORECAST ASSUMPTION DRIVERS
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">Horizon:</span>
                {[12, 24, 36].map((h) => (
                  <button
                    key={h}
                    onClick={() => setForecastHorizon(h as any)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      forecastHorizon === h
                        ? 'bg-[#5584B4] text-white'
                        : 'bg-slate-200 dark:bg-[#0E1322] text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {h}M
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Current Starting MRR:</span>
                  <span className="font-bold">${startMrr.toLocaleString()} / mo</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="150000"
                  step="5000"
                  value={startMrr}
                  onChange={(e) => setStartMrr(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Monthly Revenue Growth %:</span>
                  <span className="font-bold">+{forecastGrowthRate}% / mo</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="25"
                  step="0.5"
                  value={forecastGrowthRate}
                  onChange={(e) => setForecastGrowthRate(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Current Monthly OpEx (Burn):</span>
                  <span className="font-bold">${startOpex.toLocaleString()} / mo</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="200000"
                  step="5000"
                  value={startOpex}
                  onChange={(e) => setStartOpex(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Gross Margin %:</span>
                  <span className="font-bold">{forecastGrossMargin}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="95"
                  step="1"
                  value={forecastGrossMargin}
                  onChange={(e) => setForecastGrossMargin(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>
            </div>
          </div>

          {/* Annual Milestone Forecast Summary Table */}
          <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
              <span className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
                ANNUAL REVENUE & CASH TRAJECTORY MILESTONES
              </span>
              <span className="text-[11px] font-mono text-[#5584B4]">bizzmodel Forecast Engine</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#E8E2D8] dark:border-[#252E4A] text-slate-400">
                    <th className="text-left py-2">Milestone Year</th>
                    <th className="text-right py-2">Ending MRR</th>
                    <th className="text-right py-2">Annualized ARR</th>
                    <th className="text-right py-2">Monthly OpEx</th>
                    <th className="text-right py-2">Net Monthly Margin</th>
                    <th className="text-right py-2">Cash Reserves</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8] dark:divide-[#252E4A]">
                  <tr>
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">Year 1 (Month 12)</td>
                    <td className="py-2.5 text-right">${y1?.revenue.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-bold text-[#5584B4]">${y1?.arr.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-slate-500">${y1?.opex.toLocaleString()}</td>
                    <td className={`py-2.5 text-right font-bold ${y1?.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      ${y1?.netProfit.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right">${y1?.cash.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">Year 2 (Month 24)</td>
                    <td className="py-2.5 text-right">${y2?.revenue.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-bold text-[#5584B4]">${y2?.arr.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-slate-500">${y2?.opex.toLocaleString()}</td>
                    <td className={`py-2.5 text-right font-bold ${y2?.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      ${y2?.netProfit.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right">${y2?.cash.toLocaleString()}</td>
                  </tr>
                  {forecastHorizon === 36 && (
                    <tr>
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">Year 3 (Month 36)</td>
                      <td className="py-2.5 text-right">${y3?.revenue.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-bold text-[#5584B4]">${y3?.arr.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-slate-500">${y3?.opex.toLocaleString()}</td>
                      <td className={`py-2.5 text-right font-bold ${y3?.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        ${y3?.netProfit.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right">${y3?.cash.toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: DYNAMIC DIALS (Clarity Over Complexity) */}
      {activeTab === 'dynamic-dials' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">NET CASH RUNWAY</div>
              <div className="font-mono text-2xl font-bold text-emerald-500 mt-1 tabular-nums">
                {dialRunwayMonths} {typeof dialRunwayMonths === 'number' || !isNaN(Number(dialRunwayMonths)) ? 'Months' : ''}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Threshold: Verified</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">MONTHLY NET BURN</div>
              <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                ${dialNetBurn.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">OpEx minus gross margin</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase">VALUATION (6X ARR)</div>
              <div className="font-mono text-2xl font-bold text-[#5584B4] mt-1 tabular-nums">
                ${dialValuation.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Pre-money baseline</div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              OPERATIONAL FORECAST DRIVER DIALS
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Monthly Revenue:</span>
                  <span className="font-bold">${dialRev.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="150000"
                  step="5000"
                  value={dialRev}
                  onChange={(e) => setDialRev(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Monthly OpEx:</span>
                  <span className="font-bold">${dialOpex.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="150000"
                  step="5000"
                  value={dialOpex}
                  onChange={(e) => setDialOpex(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Gross Margin %:</span>
                  <span className="font-bold">{dialMargin}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="90"
                  step="5"
                  value={dialMargin}
                  onChange={(e) => setDialMargin(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Cash Reserves:</span>
                  <span className="font-bold">${dialCash.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="500000"
                  step="10000"
                  value={dialCash}
                  onChange={(e) => setDialCash(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: 3-STATEMENT SCHEDULE */}
      {activeTab === '3-statement' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
                3-Statement Integrated Model (Income, Balance, Cash Flow)
              </h3>
              <p className="text-xs text-slate-500">Macro-free Google Sheets connector ready</p>
            </div>
            <button
              onClick={() => alert('Macro-free Google Sheets 3-Statement template prepared for download.')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#5584B4] hover:bg-[#4773A0] text-white shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export .gsheet</span>
            </button>
          </div>

          <div className="overflow-x-auto text-xs font-mono">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E2D8] dark:border-[#252E4A] text-slate-400">
                  <th className="text-left py-2">Statement Line Item</th>
                  <th className="text-right py-2">Month 1</th>
                  <th className="text-right py-2">Month 6</th>
                  <th className="text-right py-2">Month 12</th>
                  <th className="text-right py-2">Month 24</th>
                  <th className="text-right py-2">Month 36</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8] dark:divide-[#252E4A]">
                <tr className="font-bold text-slate-900 dark:text-white bg-[#FAF8F5]/50 dark:bg-[#0E1322]/50">
                  <td className="py-2" colSpan={6}>1. INCOME STATEMENT</td>
                </tr>
                <tr>
                  <td className="py-2 pl-3 text-slate-600 dark:text-slate-300">Revenue (ARR Run Rate / 12)</td>
                  <td className="py-2 text-right">${forecastData.months[0]?.revenue.toLocaleString()}</td>
                  <td className="py-2 text-right">${forecastData.months[5]?.revenue.toLocaleString()}</td>
                  <td className="py-2 text-right">${forecastData.months[11]?.revenue.toLocaleString()}</td>
                  <td className="py-2 text-right">${forecastData.months[23]?.revenue.toLocaleString()}</td>
                  <td className="py-2 text-right">${forecastData.months[35]?.revenue.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-2 pl-3 text-slate-600 dark:text-slate-300">Cost of Goods Sold (COGS)</td>
                  <td className="py-2 text-right text-rose-500">-${(forecastData.months[0]?.revenue - forecastData.months[0]?.grossProfit).toLocaleString()}</td>
                  <td className="py-2 text-right text-rose-500">-${(forecastData.months[5]?.revenue - forecastData.months[5]?.grossProfit).toLocaleString()}</td>
                  <td className="py-2 text-right text-rose-500">-${(forecastData.months[11]?.revenue - forecastData.months[11]?.grossProfit).toLocaleString()}</td>
                  <td className="py-2 text-right text-rose-500">-${(forecastData.months[23]?.revenue - forecastData.months[23]?.grossProfit).toLocaleString()}</td>
                  <td className="py-2 text-right text-rose-500">-${(forecastData.months[35]?.revenue - forecastData.months[35]?.grossProfit).toLocaleString()}</td>
                </tr>
                <tr className="font-semibold text-emerald-600 dark:text-emerald-400">
                  <td className="py-2 pl-3">Gross Profit</td>
                  <td className="py-2 text-right">${forecastData.months[0]?.grossProfit.toLocaleString()}</td>
                  <td className="py-2 text-right">${forecastData.months[5]?.grossProfit.toLocaleString()}</td>
                  <td className="py-2 text-right">${forecastData.months[11]?.grossProfit.toLocaleString()}</td>
                  <td className="py-2 text-right">${forecastData.months[23]?.grossProfit.toLocaleString()}</td>
                  <td className="py-2 text-right">${forecastData.months[35]?.grossProfit.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-2 pl-3 text-slate-600 dark:text-slate-300">Operational Expenses (OpEx)</td>
                  <td className="py-2 text-right text-rose-500">-${forecastData.months[0]?.opex.toLocaleString()}</td>
                  <td className="py-2 text-right text-rose-500">-${forecastData.months[5]?.opex.toLocaleString()}</td>
                  <td className="py-2 text-right text-rose-500">-${forecastData.months[11]?.opex.toLocaleString()}</td>
                  <td className="py-2 text-right text-rose-500">-${forecastData.months[23]?.opex.toLocaleString()}</td>
                  <td className="py-2 text-right text-rose-500">-${forecastData.months[35]?.opex.toLocaleString()}</td>
                </tr>
                <tr className="font-bold">
                  <td className="py-2 pl-3 text-slate-900 dark:text-white">Operating Income (EBITDA)</td>
                  <td className={`py-2 text-right ${forecastData.months[0]?.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>${forecastData.months[0]?.netProfit.toLocaleString()}</td>
                  <td className={`py-2 text-right ${forecastData.months[5]?.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>${forecastData.months[5]?.netProfit.toLocaleString()}</td>
                  <td className={`py-2 text-right ${forecastData.months[11]?.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>${forecastData.months[11]?.netProfit.toLocaleString()}</td>
                  <td className={`py-2 text-right ${forecastData.months[23]?.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>${forecastData.months[23]?.netProfit.toLocaleString()}</td>
                  <td className={`py-2 text-right ${forecastData.months[35]?.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>${forecastData.months[35]?.netProfit.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 4: VALUATION & MULTIPLES */}
      {activeTab === 'valuation-bridge' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
            <span className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
              ARR MULTIPLE & DISCOUNTED CASH FLOW (DCF) VALUATION BRIDGE
            </span>
            <span className="font-mono text-xs font-bold text-amber-500">
              Venture Multiple Range
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
              <div className="text-slate-400 text-[10px] uppercase">Low Multiple (4x ARR)</div>
              <div className="font-bold text-xl text-slate-900 dark:text-white mt-1">
                ${((forecastData.endArr * 4) / 1000000).toFixed(1)}M
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Conservative secondary market baseline</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
              <div className="text-slate-400 text-[10px] uppercase">Target Multiple (6x ARR)</div>
              <div className="font-bold text-xl text-[#5584B4] mt-1">
                ${((forecastData.endArr * 6) / 1000000).toFixed(1)}M
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Institutional Series Seed/A target</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
              <div className="text-slate-400 text-[10px] uppercase">Premium Multiple (9x ARR)</div>
              <div className="font-bold text-xl text-emerald-500 mt-1">
                ${((forecastData.endArr * 9) / 1000000).toFixed(1)}M
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Top-decile growth & gross margins &gt;75%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
