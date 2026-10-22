import React, { useState } from 'react';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  RefreshCw,
  Download,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface BizzCalcAppProps {
  theme?: 'light' | 'dark';
  onBackToWorkstation?: () => void;
  onNavigateToStage?: (stageId: string, solutionId?: string) => void;
}

export const BizzCalcApp: React.FC<BizzCalcAppProps> = ({
  theme = 'light',
  onBackToWorkstation,
  onNavigateToStage,
}) => {
  const isDark = theme === 'dark';

  // Active module tab within bizzcalc
  const [activeModule, setActiveModule] = useState<
    'cost-recovery' | 'overhead-matrix' | 'bom-costing' | 'break-even'
  >('cost-recovery');

  // Input states
  const [materialsCost, setMaterialsCost] = useState<number>(85);
  const [laborHours, setLaborHours] = useState<number>(1.5);
  const [laborHourlyRate, setLaborHourlyRate] = useState<number>(60);
  const [packagingShipping, setPackagingShipping] = useState<number>(25);

  // Fixed monthly overheads
  const [monthlyRent, setMonthlyRent] = useState<number>(12000);
  const [monthlyAdminSalaries, setMonthlyAdminSalaries] = useState<number>(18000);
  const [monthlyUtilitiesSoftware, setMonthlyUtilitiesSoftware] = useState<number>(6500);
  const [monthlyMarketing, setMonthlyMarketing] = useState<number>(8500);

  // Target production volume per month
  const [targetUnits, setTargetUnits] = useState<number>(300);
  // Target commercial markup %
  const [targetMarkupPct, setTargetMarkupPct] = useState<number>(35);

  // Calculations
  const directLaborCost = laborHours * laborHourlyRate;
  const totalDirectCost = materialsCost + directLaborCost + packagingShipping;

  const totalFixedOverhead = monthlyRent + monthlyAdminSalaries + monthlyUtilitiesSoftware + monthlyMarketing;
  const overheadPerUnit = targetUnits > 0 ? Math.round((totalFixedOverhead / targetUnits) * 100) / 100 : 0;

  const breakEvenCostPrice = totalDirectCost + overheadPerUnit;
  const recommendedSellingPrice = Math.round(breakEvenCostPrice * (1 + targetMarkupPct / 100) * 100) / 100;
  const unitContributionMargin = recommendedSellingPrice - totalDirectCost;
  const contributionMarginRatio = recommendedSellingPrice > 0 ? (unitContributionMargin / recommendedSellingPrice) * 100 : 0;

  const breakEvenUnitsMonthly = unitContributionMargin > 0 ? Math.ceil(totalFixedOverhead / unitContributionMargin) : 0;
  const breakEvenRevenueMonthly = breakEvenUnitsMonthly * recommendedSellingPrice;

  return (
    <div className={`p-4 sm:p-6 space-y-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Sub-navigation tabs within bizzcalc */}
      <div
        className={`p-1.5 rounded-xl border flex flex-wrap items-center gap-1 shrink-0 ${
          isDark ? 'bg-[#12172A] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        {[
          { id: 'cost-recovery', label: '1. Cost Recovery Simulator' },
          { id: 'overhead-matrix', label: '2. Overhead Reclaim Matrix' },
          { id: 'bom-costing', label: '3. Bill of Materials (BOM)' },
          { id: 'break-even', label: '4. Break-Even & Sales Target' },
        ].map((tab) => {
          const isActive = activeModule === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveModule(tab.id as any)}
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

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Break-Even Cost Floor</div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            R{breakEvenCostPrice.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Direct + allocated overhead</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Recommended Price</div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#5584B4] mt-1 tabular-nums">
            R{recommendedSellingPrice.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{targetMarkupPct}% markup applied</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Contribution Margin</div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-500 mt-1 tabular-nums">
            {contributionMarginRatio.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">R{unitContributionMargin.toFixed(2)} / unit</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Break-Even Sales Target</div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-amber-500 mt-1 tabular-nums">
            {breakEvenUnitsMonthly} units
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">R{breakEvenRevenueMonthly.toLocaleString()} / mo</div>
        </div>
      </div>

      {/* MODULE 1: COST RECOVERY SIMULATOR */}
      {activeModule === 'cost-recovery' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Direct Costs Section */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
              <span className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
                A. Direct Unit Production Costs
              </span>
              <span className="font-mono text-xs font-bold text-emerald-500">
                Total: R{totalDirectCost.toFixed(2)}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Raw Materials / Unit Cost:</span>
                  <span className="font-bold">R{materialsCost}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="400"
                  step="5"
                  value={materialsCost}
                  onChange={(e) => setMaterialsCost(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Direct Labor Hours / Unit:</span>
                  <span className="font-bold">{laborHours} hrs</span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="8"
                  step="0.25"
                  value={laborHours}
                  onChange={(e) => setLaborHours(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Labor Hourly Wage Rate:</span>
                  <span className="font-bold">R{laborHourlyRate} / hr</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="250"
                  step="5"
                  value={laborHourlyRate}
                  onChange={(e) => setLaborHourlyRate(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Packaging & Unit Distribution:</span>
                  <span className="font-bold">R{packagingShipping}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="150"
                  step="5"
                  value={packagingShipping}
                  onChange={(e) => setPackagingShipping(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>
            </div>
          </div>

          {/* Volume & Markup Calibrator */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
              <span className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
                B. Overhead Allocation & Margin Markup
              </span>
              <span className="font-mono text-xs font-bold text-[#5584B4]">
                Overhead: R{overheadPerUnit.toFixed(2)}/unit
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Monthly Unit Production Volume:</span>
                  <span className="font-bold">{targetUnits} units/month</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="25"
                  value={targetUnits}
                  onChange={(e) => setTargetUnits(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Higher volume dilutes fixed overhead burden across units.
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Target Commercial Markup %:</span>
                  <span className="font-bold">{targetMarkupPct}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={targetMarkupPct}
                  onChange={(e) => setTargetMarkupPct(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              {/* Formula Callout */}
              <div className={`p-3.5 rounded-xl border text-xs font-mono space-y-1 ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
                <div className="text-[#5584B4] font-bold">bizzcalc Formula Mechanics:</div>
                <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Floor Price = Total Direct Cost (R{totalDirectCost.toFixed(2)}) + Overhead Rate (R{overheadPerUnit.toFixed(2)})
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                  = R{breakEvenCostPrice.toFixed(2)} minimum selling price to avoid loss.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: OVERHEAD RECLAIM MATRIX */}
      {activeModule === 'overhead-matrix' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
                Monthly Fixed Indirect Expenditures
              </h3>
              <p className="text-xs text-slate-500">Expenses incurred regardless of production units</p>
            </div>
            <div className="font-mono text-base font-bold text-amber-500">
              Total Fixed OpEx: R{totalFixedOverhead.toLocaleString()} / mo
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                Facility Rent & Operations:
              </label>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                Administrative & Management Salaries:
              </label>
              <input
                type="number"
                value={monthlyAdminSalaries}
                onChange={(e) => setMonthlyAdminSalaries(Number(e.target.value))}
                className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                Software, Utilities, Cloud & Insurance:
              </label>
              <input
                type="number"
                value={monthlyUtilitiesSoftware}
                onChange={(e) => setMonthlyUtilitiesSoftware(Number(e.target.value))}
                className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                Baseline Marketing & Business Development:
              </label>
              <input
                type="number"
                value={monthlyMarketing}
                onChange={(e) => setMonthlyMarketing(Number(e.target.value))}
                className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: BILL OF MATERIALS (BOM) */}
      {activeModule === 'bom-costing' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
            <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
              Itemized Bill of Materials (BOM) Matrix
            </h3>
            <span className="text-[11px] font-mono text-[#5584B4]">Unit BOM Schedule</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-[#E8E2D8] dark:border-[#252E4A] text-slate-400">
                  <th className="text-left py-2">Item Category</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-right py-2">Unit Cost</th>
                  <th className="text-right py-2">% of Total Direct</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8] dark:divide-[#252E4A]">
                <tr>
                  <td className="py-2.5 font-bold text-slate-900 dark:text-white">Raw Materials</td>
                  <td className="py-2.5 text-slate-500">Primary physical components / ingredients</td>
                  <td className="py-2.5 text-right font-bold">R{materialsCost.toFixed(2)}</td>
                  <td className="py-2.5 text-right text-slate-400">{((materialsCost / totalDirectCost) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-slate-900 dark:text-white">Direct Assembly Labor</td>
                  <td className="py-2.5 text-slate-500">{laborHours} hrs @ R{laborHourlyRate}/hr</td>
                  <td className="py-2.5 text-right font-bold">R{directLaborCost.toFixed(2)}</td>
                  <td className="py-2.5 text-right text-slate-400">{((directLaborCost / totalDirectCost) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-slate-900 dark:text-white">Packaging & Box</td>
                  <td className="py-2.5 text-slate-500">Protective packaging & shipping material</td>
                  <td className="py-2.5 text-right font-bold">R{packagingShipping.toFixed(2)}</td>
                  <td className="py-2.5 text-right text-slate-400">{((packagingShipping / totalDirectCost) * 100).toFixed(1)}%</td>
                </tr>
                <tr className="bg-[#FAF8F5] dark:bg-[#0E1322] font-bold">
                  <td className="py-2.5 px-2" colSpan={2}>TOTAL DIRECT UNIT COST (COGS)</td>
                  <td className="py-2.5 text-right text-emerald-600 dark:text-emerald-400">R{totalDirectCost.toFixed(2)}</td>
                  <td className="py-2.5 text-right">100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 4: BREAK-EVEN & SALES TARGET */}
      {activeModule === 'break-even' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
            <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
              Break-Even Sales Horizon & Safety Margin
            </h3>
            <span className="font-mono text-xs font-bold text-amber-500">
              {breakEvenUnitsMonthly} Units Monthly Target
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
              <div className="text-slate-400 uppercase text-[10px]">Monthly Break-Even Turnover</div>
              <div className="font-bold text-lg text-slate-900 dark:text-white mt-1">
                R{breakEvenRevenueMonthly.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Requires selling {breakEvenUnitsMonthly} units at R{recommendedSellingPrice.toFixed(2)} to cover 100% of costs.
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
              <div className="text-slate-400 uppercase text-[10px]">Safety Buffer Ratio</div>
              <div className="font-bold text-lg text-emerald-500 mt-1">
                {targetUnits >= breakEvenUnitsMonthly
                  ? `+${targetUnits - breakEvenUnitsMonthly} units above break-even`
                  : `-${breakEvenUnitsMonthly - targetUnits} units shortfall`}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {targetUnits >= breakEvenUnitsMonthly
                  ? 'Current volume generates positive net monthly profit.'
                  : 'Increase volume or price markup to eliminate operating shortfall.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
