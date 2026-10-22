import React, { useState, useMemo } from 'react';
import { FinancialModelInputs } from '../types';
import { calculateFinancialModel, formatCurrency } from '../utils/financialCalculations';
import { Calculator, ArrowRight, TrendingUp, AlertTriangle, ShieldCheck, Download, RefreshCw, Sparkles } from 'lucide-react';

interface FinancialSimulatorProps {
  onRequestModel: (inputs: FinancialModelInputs) => void;
}

const PRESET_SCENARIOS = [
  {
    name: 'Conservative',
    growth: 5,
    margin: 60,
    multiple: 4,
    description: 'Disciplined organic expansion with controlled burn.',
  },
  {
    name: 'Baseline',
    growth: 10,
    margin: 72,
    multiple: 6,
    description: 'Target venture growth path balancing burn and velocity.',
  },
  {
    name: 'Venture Scale',
    growth: 18,
    margin: 80,
    multiple: 9,
    description: 'High-velocity expansion backed by institutional funding.',
  },
];

export const FinancialSimulator: React.FC<FinancialSimulatorProps> = ({ onRequestModel }) => {
  const [currency, setCurrency] = useState<string>('$');
  const [revenue, setRevenue] = useState<number>(30000);
  const [growthRate, setGrowthRate] = useState<number>(10);
  const [grossMargin, setGrossMargin] = useState<number>(70);
  const [monthlyOpEx, setMonthlyOpEx] = useState<number>(45000);
  const [cashReserve, setCashReserve] = useState<number>(180000);
  const [targetRunway, setTargetRunway] = useState<number>(18);
  const [valuationMultiple, setValuationMultiple] = useState<number>(6);

  const inputs: FinancialModelInputs = useMemo(
    () => ({
      currency,
      currentMonthlyRevenue: revenue,
      expectedMonthlyGrowthRate: growthRate,
      grossMarginPercentage: grossMargin,
      monthlyOpEx,
      currentCashReserve: cashReserve,
      targetRunwayMonths: targetRunway,
      valuationMultiple,
    }),
    [currency, revenue, growthRate, grossMargin, monthlyOpEx, cashReserve, targetRunway, valuationMultiple]
  );

  const outputs = useMemo(() => calculateFinancialModel(inputs), [inputs]);

  const applyPreset = (preset: (typeof PRESET_SCENARIOS)[0]) => {
    setGrowthRate(preset.growth);
    setGrossMargin(preset.margin);
    setValuationMultiple(preset.multiple);
  };

  const getRunwayStatus = (months: number) => {
    if (months >= 18) {
      return {
        label: 'Optimal Runway',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10 border-emerald-500/20',
        note: 'Sufficient buffer to achieve major valuation milestones.',
      };
    }
    if (months >= 8) {
      return {
        label: 'Watch Zone',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/20',
        note: 'Capital raise or operational margin optimization recommended within 90 days.',
      };
    }
    return {
      label: 'Critical Runway Alert',
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
      note: 'Immediate cash preservation or bridge financing required.',
    };
  };

  const runwayStatus = getRunwayStatus(outputs.runwayMonths);

  return (
    <section id="simulator" className="py-20 lg:py-28 border-b border-[#222F4C]/50 bg-[#0A0D14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              <span>Interactive Client Sandbox</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Real-Time Modeling Simulator</span>
            </div>
            <h2 className="font-['Outfit'] text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Test your venture assumptions in real time.
            </h2>
            <p className="mt-3 text-base text-slate-300 leading-relaxed">
              Adjust your operational levers to instantly calculate net burn, runway horizon, break-even velocity, and required capital deployment.
            </p>
          </div>

          {/* Currency Switcher */}
          <div className="flex items-center gap-2 p-1 bg-[#111726] border border-[#222F4C] rounded-xl self-start md:self-auto">
            {['$', '€', '£', 'R'].map((cur) => (
              <button
                key={cur}
                onClick={() => setCurrency(cur)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  currency === cur
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cur === 'R' ? 'ZAR (R)' : cur}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Scenarios Selector */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-slate-400">Quick Scenarios:</span>
          {PRESET_SCENARIOS.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-[#151D30] hover:bg-[#1C263E] border border-[#222F4C] text-slate-300 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <span className="font-semibold text-amber-400">{p.name}</span>
              <span className="text-slate-500 ml-1.5 font-mono">({p.growth}% Mo)</span>
            </button>
          ))}
        </div>

        {/* Interactive Grid: Controls (Left) & Live Quant Outputs (Right) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Controls Column */}
          <div className="lg:col-span-5 rounded-2xl border border-[#222F4C] bg-[#111726] p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#222F4C]">
              <span className="text-sm font-semibold text-white">Operational Assumptions</span>
              <span className="text-xs text-slate-400 font-mono">Editable Sandbox</span>
            </div>

            {/* Monthly Revenue */}
            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <label htmlFor="revenue-range" className="text-slate-300 font-medium">Monthly Revenue</label>
                <span className="font-mono text-amber-400 font-bold tabular-nums">
                  {formatCurrency(revenue, currency)}
                </span>
              </div>
              <input
                id="revenue-range"
                type="range"
                min="0"
                max="250000"
                step="5000"
                value={revenue}
                onChange={(e) => setRevenue(Number(e.target.value))}
                className="w-full h-1.5 bg-[#151D30] rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>{formatCurrency(0, currency)}</span>
                <span>{formatCurrency(125000, currency)}</span>
                <span>{formatCurrency(250000, currency)}</span>
              </div>
            </div>

            {/* Expected Monthly Growth Rate */}
            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <label htmlFor="growth-range" className="text-slate-300 font-medium">Monthly Growth Rate</label>
                <span className="font-mono text-amber-400 font-bold tabular-nums">
                  +{growthRate}% / mo
                </span>
              </div>
              <input
                id="growth-range"
                type="range"
                min="1"
                max="30"
                step="1"
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                className="w-full h-1.5 bg-[#151D30] rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>1% (Modest)</span>
                <span>15% (Venture)</span>
                <span>30% (Hyper)</span>
              </div>
            </div>

            {/* Gross Margin % */}
            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <label htmlFor="margin-range" className="text-slate-300 font-medium">Gross Margin (%)</label>
                <span className="font-mono text-amber-400 font-bold tabular-nums">
                  {grossMargin}%
                </span>
              </div>
              <input
                id="margin-range"
                type="range"
                min="20"
                max="95"
                step="5"
                value={grossMargin}
                onChange={(e) => setGrossMargin(Number(e.target.value))}
                className="w-full h-1.5 bg-[#151D30] rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Monthly OpEx */}
            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <label htmlFor="opex-range" className="text-slate-300 font-medium">Monthly Operating Expenses (OpEx)</label>
                <span className="font-mono text-amber-400 font-bold tabular-nums">
                  {formatCurrency(monthlyOpEx, currency)}
                </span>
              </div>
              <input
                id="opex-range"
                type="range"
                min="5000"
                max="300000"
                step="5000"
                value={monthlyOpEx}
                onChange={(e) => setMonthlyOpEx(Number(e.target.value))}
                className="w-full h-1.5 bg-[#151D30] rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Cash Reserve */}
            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <label htmlFor="cash-range" className="text-slate-300 font-medium">Available Cash Reserves</label>
                <span className="font-mono text-amber-400 font-bold tabular-nums">
                  {formatCurrency(cashReserve, currency)}
                </span>
              </div>
              <input
                id="cash-range"
                type="range"
                min="10000"
                max="1000000"
                step="10000"
                value={cashReserve}
                onChange={(e) => setCashReserve(Number(e.target.value))}
                className="w-full h-1.5 bg-[#151D30] rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Target Runway */}
            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <label htmlFor="runway-range" className="text-slate-300 font-medium">Target Funding Runway</label>
                <span className="font-mono text-amber-400 font-bold tabular-nums">
                  {targetRunway} Months
                </span>
              </div>
              <input
                id="runway-range"
                type="range"
                min="6"
                max="36"
                step="3"
                value={targetRunway}
                onChange={(e) => setTargetRunway(Number(e.target.value))}
                className="w-full h-1.5 bg-[#151D30] rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>

          {/* Live Outputs & Visual Insights */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Top 3 Primary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Runway Card */}
              <div className="p-5 rounded-2xl bg-[#111726] border border-[#222F4C]">
                <div className="text-xs font-medium text-slate-400">Current Cash Runway</div>
                <div className="mt-2 font-mono text-3xl font-extrabold text-white tabular-nums tracking-tight">
                  {outputs.runwayMonths >= 99 ? 'Profitable' : `${outputs.runwayMonths} Mo`}
                </div>
                <div className={`mt-2 inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${runwayStatus.bgColor} ${runwayStatus.color}`}>
                  {runwayStatus.label}
                </div>
              </div>

              {/* Net Monthly Burn */}
              <div className="p-5 rounded-2xl bg-[#111726] border border-[#222F4C]">
                <div className="text-xs font-medium text-slate-400">Net Monthly Cash Flow</div>
                <div className={`mt-2 font-mono text-3xl font-extrabold tabular-nums tracking-tight ${
                  outputs.monthlyNetBurn === 0 ? 'text-emerald-400' : 'text-slate-100'
                }`}>
                  {outputs.monthlyNetBurn === 0
                    ? `+${formatCurrency(outputs.monthlyGrossProfit - monthlyOpEx, currency)}`
                    : `-${formatCurrency(outputs.monthlyNetBurn, currency)}`}
                </div>
                <div className="text-xs text-slate-400 mt-2 font-mono">
                  Burn rate per 30-day cycle
                </div>
              </div>

              {/* Capital Requirement */}
              <div className="p-5 rounded-2xl bg-[#111726] border border-[#222F4C]">
                <div className="text-xs font-medium text-slate-400">Capital Gap ({targetRunway}M Runway)</div>
                <div className="mt-2 font-mono text-3xl font-extrabold text-amber-400 tabular-nums tracking-tight">
                  {outputs.capitalRequirement === 0 ? 'Fully Funded' : formatCurrency(outputs.capitalRequirement, currency)}
                </div>
                <div className="text-xs text-slate-400 mt-2 font-mono">
                  Target capital to reach runway
                </div>
              </div>
            </div>

            {/* 36-Month Quantitative Trajectory Display */}
            <div className="p-6 rounded-2xl bg-[#111726] border border-[#222F4C]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#222F4C] gap-2">
                <div>
                  <h4 className="font-['Outfit'] text-lg font-bold text-white tracking-tight">
                    Projected Revenue & Growth Horizon
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Compounded at {growthRate}% monthly with {grossMargin}% margin
                  </p>
                </div>
                <div className="text-xs font-mono text-amber-400">
                  {outputs.breakEvenMonthEstimate !== null && outputs.breakEvenMonthEstimate > 0
                    ? `Break-Even Month: M${outputs.breakEvenMonthEstimate}`
                    : outputs.monthlyNetBurn === 0
                    ? 'Currently Cash-Positive'
                    : 'Break-Even Beyond M36'}
                </div>
              </div>

              {/* 3-Year Projection Milestones */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-[#151D30] border border-[#222F4C]">
                  <div className="text-xs font-medium text-slate-400 font-mono">Month 12 Run-Rate</div>
                  <div className="mt-1 font-mono text-xl font-bold text-white tabular-nums">
                    {formatCurrency(outputs.projectedRevenue12M, currency)}/mo
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    ARR: {formatCurrency(outputs.projectedRevenue12M * 12, currency)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#151D30] border border-[#222F4C]">
                  <div className="text-xs font-medium text-slate-400 font-mono">Month 24 Run-Rate</div>
                  <div className="mt-1 font-mono text-xl font-bold text-white tabular-nums">
                    {formatCurrency(outputs.projectedRevenue24M, currency)}/mo
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    ARR: {formatCurrency(outputs.projectedRevenue24M * 12, currency)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#151D30] border border-[#222F4C]">
                  <div className="text-xs font-medium text-slate-400 font-mono">Month 36 Run-Rate</div>
                  <div className="mt-1 font-mono text-xl font-bold text-amber-400 tabular-nums">
                    {formatCurrency(outputs.projectedRevenue36M, currency)}/mo
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    ARR: {formatCurrency(outputs.projectedRevenue36M * 12, currency)}
                  </div>
                </div>
              </div>

              {/* Valuation Indicator */}
              <div className="mt-6 p-4 rounded-xl bg-[#0A0D14] border border-[#222F4C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400">
                    Current Estimated Valuation Multiple ({valuationMultiple}x ARR)
                  </div>
                  <div className="text-2xl font-bold font-mono text-white mt-0.5 tabular-nums">
                    {formatCurrency(outputs.estimatedValuation, currency)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Multiple:</span>
                  {[4, 6, 8, 10].map((m) => (
                    <button
                      key={m}
                      onClick={() => setValuationMultiple(m)}
                      className={`px-2.5 py-1 text-xs font-mono font-medium rounded ${
                        valuationMultiple === m
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-[#151D30] text-slate-400 hover:text-white'
                      }`}
                    >
                      {m}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Seamless Action Handover: Request full institutional model */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#151D30] to-[#111726] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <Sparkles className="h-4 w-4" />
                  <span>Turn Sandbox Simulation into Full Institutional Model</span>
                </div>
                <p className="mt-1 text-sm text-slate-300 max-w-md">
                  Have Bizzbean construct your dynamic 3-statement forecast, sensitivity tables, and investor deck appendix within 5–7 business days.
                </p>
              </div>

              <button
                onClick={() => onRequestModel(inputs)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 whitespace-nowrap shrink-0"
              >
                <span>Request Full 3-Statement Model</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
