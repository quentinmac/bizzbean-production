import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import {
  BomSummaryResult,
  EmployeeCalcResult,
  PackagingSummaryResult,
  ProductionSummaryResult,
  UnitCostDynamicsOverrides,
  UnitCostDynamicsResult,
  VariableCostSummaryResult,
} from './modelSetTypes';
import { formatUnitCostValue } from './continuousProductionEngine';

export interface UnitCostDynamicsSource {
  production: ProductionSummaryResult;
  employees?: EmployeeCalcResult;
  bom: BomSummaryResult;
  packaging: PackagingSummaryResult;
  variableCosts: VariableCostSummaryResult;
  dynamics: UnitCostDynamicsResult;
}

interface UnitCostDynamicsPanelProps {
  theme?: 'light' | 'dark';
  stepNumber?: number;
  capacitySubtitle?: string;
  hideEmployeeMetric?: boolean;
  productName: string;
  fullResult: UnitCostDynamicsSource;
  overrides: UnitCostDynamicsOverrides;
  onChangeOverrides: (updated: UnitCostDynamicsOverrides) => void;
  onJumpToCalculator?: (tabId: 'production' | 'employees' | 'bom' | 'packaging' | 'variable') => void;
  onOpenResultsTab?: () => void;
}

export const UnitCostDynamicsPanel: React.FC<UnitCostDynamicsPanelProps> = ({
  theme = 'light',
  stepNumber = 6,
  capacitySubtitle,
  hideEmployeeMetric = false,
  productName,
  fullResult,
  overrides,
  onChangeOverrides,
  onJumpToCalculator,
  onOpenResultsTab,
}) => {
  const isDark = theme === 'dark';
  const { dynamics, production, employees } = fullResult;

  const costStreams = [
    {
      key: 'bom' as const,
      label: 'materials — bill of materials',
      unitCost: dynamics.materialsUnitCost,
      sharePct: dynamics.materialsSharePct,
      barColor: 'bg-[#2E5E88]',
      detail: `${fullResult.bom.items.length} material ${fullResult.bom.items.length === 1 ? 'component' : 'components'}`,
    },
    {
      key: 'packaging' as const,
      label: 'packaging — multi-level hierarchy',
      unitCost: dynamics.packagingUnitCost,
      sharePct: dynamics.packagingSharePct,
      barColor: 'bg-emerald-600',
      detail: `${fullResult.packaging.levels.length} packaging ${fullResult.packaging.levels.length === 1 ? 'level' : 'levels'}`,
    },
    {
      key: 'variable' as const,
      label: 'production variable costs',
      unitCost: dynamics.productionVariableUnitCost,
      sharePct: dynamics.variableSharePct,
      barColor: 'bg-amber-600',
      detail: `${fullResult.variableCosts.items.length} variable ${fullResult.variableCosts.items.length === 1 ? 'stream' : 'streams'}`,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            {stepNumber}. Unit Costs Dynamics &amp; Transfer Summary
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Consolidates all cost streams and capacity constraints for <strong>{productName}</strong> and syncs them automatically to the Results tab.
          </p>
        </div>

        {onOpenResultsTab && (
          <button
            type="button"
            onClick={onOpenResultsTab}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>view on results tab</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Main Split: Cost Breakdown Table (Left) + Transfer Dynamics Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Unit Cost Composition */}
        <div
          className={`lg:col-span-7 p-4 rounded-xl border space-y-4 ${
            isDark
              ? 'bg-[#0E1322] border-[#222F4C]'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#222F4C]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              direct unit cost build-up
            </span>
            <span className="text-[10px] text-slate-400">
              click any line to edit assumptions
            </span>
          </div>

          {/* Stacked Cost-Share Bar */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
              {costStreams.map((stream) =>
                stream.sharePct > 0 ? (
                  <div
                    key={stream.key}
                    style={{ width: `${stream.sharePct}%` }}
                    className={`${stream.barColor} transition-all duration-200`}
                    title={`${stream.label}: ${stream.sharePct.toFixed(1)}%`}
                  />
                ) : null
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="tabular-nums">
                Materials: <strong>{dynamics.materialsSharePct.toFixed(1)}%</strong>
              </span>
              <span>·</span>
              <span className="tabular-nums">
                Packaging: <strong>{dynamics.packagingSharePct.toFixed(1)}%</strong>
              </span>
              <span>·</span>
              <span className="tabular-nums">
                Variable: <strong>{dynamics.variableSharePct.toFixed(1)}%</strong>
              </span>
            </div>
          </div>

          {/* Line-by-line Table */}
          <table className="w-full text-xs">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {costStreams.map((stream) => (
                <tr
                  key={stream.key}
                  onClick={() => onJumpToCalculator?.(stream.key)}
                  className={`transition-colors ${
                    onJumpToCalculator ? 'cursor-pointer' : ''
                  } ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}
                >
                  <td className="py-2.5 pr-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {stream.label}
                    </span>
                    <span className="text-[10px] text-slate-400">{stream.detail}</span>
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-slate-500 dark:text-slate-400">
                    {stream.sharePct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 pl-2 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                    {formatUnitCostValue(stream.unitCost)}
                  </td>
                </tr>
              ))}

              {/* Calculated Unit Cost */}
              <tr className={isDark ? 'bg-[#121A2F]/60' : 'bg-slate-50'}>
                <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-white">
                  unit cost — calculated
                </td>
                <td className="py-2.5 px-2 text-right tabular-nums text-slate-500">
                  100.0%
                </td>
                <td className="py-2.5 px-2 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatUnitCostValue(dynamics.calculatedUnitCost)}
                </td>
              </tr>

              {/* Optional Estimated Override (Excel R118) */}
              <tr>
                <td className="py-2.5 pr-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    unit cost — estimated override (optional)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    leave at 0 to transfer calculated unit cost automatically
                  </span>
                </td>
                <td colSpan={2} className="py-2.5 pl-2 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    value={overrides.estimatedUnitCost || ''}
                    placeholder="0.00 (auto)"
                    onChange={(e) =>
                      onChangeOverrides({
                        ...overrides,
                        estimatedUnitCost: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className={`w-32 px-2.5 py-1.5 rounded-lg border text-xs font-bold text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                      isDark
                        ? 'bg-[#141A2E] border-[#252E4A] text-white'
                        : 'bg-[#F0F5FA] border-[#C9D8E8] text-slate-900'
                    }`}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Modeled Unit Cost Footer */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
              isDark
                ? 'bg-[#2E5E88]/20 border-[#2E5E88]/40'
                : 'bg-[#EEF4FA] border-[#2E5E88]/30'
            }`}
          >
            <div>
              <span className="text-xs font-bold text-[#2E5E88] dark:text-[#6BA3D6] block">
                unit cost — modeled (transferred to results)
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {dynamics.isUsingEstimatedOverride
                  ? 'using manual estimated override'
                  : 'derived dynamically from BOM + packaging + variable costs'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold tabular-nums text-[#2E5E88] dark:text-white block">
                {formatUnitCostValue(dynamics.modeledUnitCost)}
              </span>
              <span className="text-[10px] tabular-nums text-rose-600 dark:text-rose-400">
                results line 3: -{formatUnitCostValue(dynamics.modeledUnitCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Dynamics Transferred to Results Tab */}
        <div
          className={`lg:col-span-5 p-4 rounded-xl border flex flex-col justify-between space-y-4 ${
            isDark
              ? 'bg-[#0E1322] border-[#222F4C]'
              : 'bg-[#FAF8F5] border-[#D8CEBC]'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#222F4C]">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                live sync to results tab
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-baseline justify-between gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-800">
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block">
                    results line 2 · daily capacity
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {capacitySubtitle || `bottleneck: ${production.bottleneckProcessNames.join(' & ') || '—'}`}
                  </span>
                </div>
                <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                  {dynamics.dailyCapacity.toLocaleString()} / day
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-800">
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block">
                    monthly production capacity
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {production.productionDaysPerMonth} working days / month
                  </span>
                </div>
                <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                  {dynamics.monthlyCapacity.toLocaleString()} / mo
                </span>
              </div>

              <div className={`flex items-baseline justify-between gap-2 ${!hideEmployeeMetric && employees ? 'pb-2 border-b border-slate-200/70 dark:border-slate-800' : ''}`}>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block">
                    results line 3 · production unit cost*
                  </span>
                  <span className="text-[10px] text-slate-400">
                    selling price derived dynamically on results tab
                  </span>
                </div>
                <span className="text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400">
                  -{formatUnitCostValue(dynamics.modeledUnitCost)}
                </span>
              </div>

              {!hideEmployeeMetric && employees && (
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 block">
                      productive employees indicated
                    </span>
                    <span className="text-[10px] text-slate-400">
                      advisory only ({employees.employeesStandard} std + {employees.employeesAdditional} relief)
                    </span>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                    {dynamics.employeesIndicated} staff
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-200 dark:border-[#222F4C]">
            Changes in Production, Bill of Materials, Packaging, or Variable Costs update the 60-month Trading Account, Cash Flow, and Financial Statements in real time.
          </p>
        </div>
      </div>
    </div>
  );
};
