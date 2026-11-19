import React from 'react';
import { Info } from 'lucide-react';
import {
  EmployeeCalcAssumptions,
  EmployeeCalcResult,
  ProductionSummaryResult,
} from './modelSetTypes';

interface EmployeeCalculatorPanelProps {
  theme?: 'light' | 'dark';
  assumptions: EmployeeCalcAssumptions;
  result: EmployeeCalcResult;
  production: ProductionSummaryResult;
  onChange: (updated: EmployeeCalcAssumptions) => void;
}

export const EmployeeCalculatorPanel: React.FC<EmployeeCalculatorPanelProps> = ({
  theme = 'light',
  assumptions,
  result,
  production,
  onChange,
}) => {
  const isDark = theme === 'dark';

  const inputCls = `w-full px-3 py-2 rounded-lg border text-xs font-bold text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
    isDark
      ? 'bg-[#141A2E] border-[#252E4A] text-white'
      : 'bg-[#F0F5FA] border-[#C9D8E8] text-slate-900'
  }`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          2. Employee Calculator
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          Estimates how many productive employees are required to sustain the configured production lines at your expected labour efficiency.
        </p>
      </div>

      {/* Explicit Non-Impact Notice (clean hairline box, no thick left bar) */}
      <div
        className={`flex items-start gap-2.5 p-3 rounded-xl border text-[11px] ${
          isDark
            ? 'bg-[#0C111E] border-[#222F4C] text-slate-300'
            : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-700'
        }`}
      >
        <Info className="h-4 w-4 text-[#2E5E88] dark:text-[#6BA3D6] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-900 dark:text-white">Advisory staffing guide only:</strong>{' '}
          This calculator has <strong>no impact</strong> on daily production capacity or direct product unit cost. Use the indicated headcount as a reference when adding productive staff in the <em>Employment</em> step.
        </p>
      </div>

      {/* Two-Column Split: Inputs vs Hours & Headcount Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Assumptions Inputs */}
        <div
          className={`lg:col-span-5 p-4 rounded-xl border space-y-3.5 ${
            isDark
              ? 'bg-[#0E1322] border-[#222F4C]'
              : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block pb-2 border-b border-slate-200 dark:border-[#222F4C]">
            labour efficiency assumptions
          </span>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block lowercase">
              hours paid per day (per employee)
            </label>
            <input
              type="number"
              min="1"
              max="24"
              step="0.5"
              value={assumptions.hoursPaidPerDay}
              onChange={(e) =>
                onChange({
                  ...assumptions,
                  hoursPaidPerDay: Math.max(0, Math.min(24, Number(e.target.value) || 0)),
                })
              }
              className={inputCls}
            />
            <span className="text-[10px] text-slate-400 block">
              paid shift duration ({result.productionDays} production days/mo from setup)
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block lowercase">
              labour efficiency %
            </label>
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={assumptions.labourEfficiencyPct}
              onChange={(e) =>
                onChange({
                  ...assumptions,
                  labourEfficiencyPct: Math.max(1, Math.min(100, Number(e.target.value) || 1)),
                })
              }
              className={inputCls}
            />
            <span className="text-[10px] text-slate-400 block">
              % of paid hours converted into productive output (e.g. 85% allows for breaks/leave)
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block lowercase">
              variance tolerance %
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={assumptions.tolerancePct}
              onChange={(e) =>
                onChange({
                  ...assumptions,
                  tolerancePct: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                })
              }
              className={inputCls}
            />
            <span className="text-[10px] text-slate-400 block">
              if hours deficit % is below tolerance, no additional relief staff are recommended
            </span>
          </div>

          {/* Per-Process Standard Headcount Breakdown */}
          <div className="pt-2 border-t border-slate-200 dark:border-[#222F4C] space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
              standard headcount by process
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700 dark:text-slate-300">
              {production.processes.map((proc, i) => (
                <span key={proc.id} className="tabular-nums">
                  {i > 0 && <span className="text-slate-400 mr-3">·</span>}
                  {proc.name}: <strong>{proc.employeesRequiredStandard}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Productive Hours & Headcount Ledger */}
        <div
          className={`lg:col-span-7 p-4 rounded-xl border flex flex-col justify-between ${
            isDark
              ? 'bg-[#0E1322] border-[#222F4C]'
              : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block pb-2 border-b border-slate-200 dark:border-[#222F4C]">
              monthly productive hours & headcount calculation
            </span>

            <table className="w-full text-xs mt-2">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                <tr>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    production days / month
                  </td>
                  <td className="py-2 text-right font-bold tabular-nums text-slate-800 dark:text-slate-200">
                    {result.productionDays} days
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    hours bought per employee
                  </td>
                  <td className="py-2 text-right font-bold tabular-nums text-slate-800 dark:text-slate-200">
                    {result.hoursBoughtPerEmployee.toFixed(1)} hrs
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    total hours required ({result.employeesStandard} standard staff)
                  </td>
                  <td className="py-2 text-right font-bold tabular-nums text-slate-800 dark:text-slate-200">
                    {result.hoursRequired.toFixed(1)} hrs
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    productive hours available ({result.labourEfficiencyPct}% efficiency)
                  </td>
                  <td className="py-2 text-right font-bold tabular-nums text-slate-800 dark:text-slate-200">
                    {result.hoursForSale.toFixed(1)} hrs
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    hours variance / deficit %
                  </td>
                  <td
                    className={`py-2 text-right font-bold tabular-nums ${
                      result.varianceHours < 0
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {result.varianceHours.toFixed(1)} hrs ({result.variancePct.toFixed(1)}%)
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    employees required — standard
                  </td>
                  <td className="py-2 text-right font-bold tabular-nums text-slate-800 dark:text-slate-200">
                    {result.employeesStandard}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    employees required — additional (efficiency relief)
                  </td>
                  <td className="py-2 text-right font-bold tabular-nums text-slate-800 dark:text-slate-200">
                    +{result.employeesAdditional}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Final Adjusted Headcount Summary Bar */}
          <div
            className={`mt-4 p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
              isDark
                ? 'bg-[#2E5E88]/20 border-[#2E5E88]/40'
                : 'bg-[#EEF4FA] border-[#2E5E88]/30'
            }`}
          >
            <div>
              <span className="text-xs font-bold text-[#2E5E88] dark:text-[#6BA3D6] block">
                employees required — adjusted
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                recommended productive headcount for this product
              </span>
            </div>
            <span className="text-xl font-bold tabular-nums text-[#2E5E88] dark:text-white">
              {result.employeesAdjusted}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
