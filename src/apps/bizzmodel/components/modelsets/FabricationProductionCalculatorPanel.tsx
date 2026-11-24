import React from 'react';
import { Plus, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import {
  FabricationProcess,
  FabricationProductionSummaryResult,
} from './modelSetTypes';
import { formatFabricationQuantity } from './fabricationEngine';

interface FabricationProductionCalculatorPanelProps {
  theme?: 'light' | 'dark';
  processes: FabricationProcess[];
  summary: FabricationProductionSummaryResult;
  onChange: (updated: FabricationProcess[]) => void;
}

export const FabricationProductionCalculatorPanel: React.FC<
  FabricationProductionCalculatorPanelProps
> = ({ theme = 'light', processes, summary, onChange }) => {
  const isDark = theme === 'dark';

  const handleFieldChange = <K extends keyof FabricationProcess>(
    procId: string,
    field: K,
    value: FabricationProcess[K]
  ) => {
    onChange(
      processes.map((p) => (p.id === procId ? { ...p, [field]: value } : p))
    );
  };

  const handleAddProcess = () => {
    const nextLetter = String.fromCharCode(65 + processes.length);
    const newProc: FabricationProcess = {
      id: `fab-proc-${Date.now()}`,
      name: `Fabrication Bay ${nextLetter}`,
      numberOfWorkstreams: 1,
      employeesPerLine: 1,
      shiftHours: 8,
      shiftsPerDay: 1,
      unitsPerBatch: 1,
      daysPerBatch: 1,
      timeAllocationPct: 100,
      shrinkagePct: 0,
    };
    onChange([...processes, newProc]);
  };

  const handleRemoveProcess = (procId: string) => {
    if (processes.length <= 1) return;
    onChange(processes.filter((p) => p.id !== procId));
  };

  const handleClearProcesses = () => {
    onChange([
      {
        id: `fab-proc-${Date.now()}`,
        name: 'Fabrication Machine A',
        numberOfWorkstreams: 1,
        employeesPerLine: 1,
        shiftHours: 8,
        shiftsPerDay: 1,
        unitsPerBatch: 1,
        daysPerBatch: 1,
        timeAllocationPct: 100,
        shrinkagePct: 0,
      },
    ]);
  };

  const inputCls = `w-full px-2 py-1.5 rounded-lg border text-xs font-bold text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
    isDark
      ? 'bg-[#141A2E] border-[#252E4A] text-white'
      : 'bg-[#F0F5FA] border-[#C9D8E8] text-slate-900'
  }`;

  const resultMap = new Map(summary.processes.map((r) => [r.id, r]));
  const bottleneckLabel =
    summary.bottleneckProcessNames.length > 0
      ? summary.bottleneckProcessNames.join(' & ')
      : 'None';

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            1. Production Calculator (Fabrication · Units per Batch &amp; Days per Batch)
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Define each fabrication process or workstream by its batch yield and multi-day build duration. Daily capacity is governed by the slowest process (bottleneck constraint).
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClearProcesses}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap ${
              isDark
                ? 'border-[#252E4A] text-slate-300 hover:bg-slate-800'
                : 'border-[#D8CEBC] text-slate-600 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>clear</span>
          </button>
          <button
            type="button"
            onClick={handleAddProcess}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>add process</span>
          </button>
        </div>
      </div>

      {/* Bottleneck Constraint Summary Strip */}
      <div
        className={`grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-xl border ${
          isDark
            ? 'bg-[#0C111E] border-[#222F4C]'
            : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
            production per day (slowest process)
          </span>
          <span className="text-base font-bold text-[#2E5E88] dark:text-[#6BA3D6] tabular-nums">
            {formatFabricationQuantity(summary.bottleneckDailyCapacity)} units/day
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
            constraining bottleneck
          </span>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-1 truncate">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{bottleneckLabel}</span>
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
            monthly / annual production
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums block mt-1">
            {formatFabricationQuantity(summary.monthlyCapacity)} / mo · {formatFabricationQuantity(summary.annualCapacity)} / yr
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
            standard staff across processes
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums block mt-1">
            {summary.totalEmployeesStandard} {summary.totalEmployeesStandard === 1 ? 'employee' : 'employees'} ({processes.length} {processes.length === 1 ? 'process' : 'processes'})
          </span>
        </div>
      </div>

      {/* Multi-Process Comparison Matrix (Fabrication — Units/Batch & Days/Batch) */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#222F4C]">
        <table className="w-full text-xs border-collapse min-w-[640px]">
          <thead>
            <tr
              className={`border-b ${
                isDark
                  ? 'bg-[#121A2F] border-[#222F4C]'
                  : 'bg-[#F5F2EC] border-[#D8CEBC]'
              }`}
            >
              <th className="py-2.5 px-3 text-left font-bold text-slate-700 dark:text-slate-300 w-56 min-w-[215px]">
                asset production parameter
              </th>
              <th className="py-2.5 px-3 text-right font-bold text-[#2E5E88] dark:text-[#6BA3D6] w-32 min-w-[120px] border-r border-slate-200 dark:border-[#222F4C]">
                product total
              </th>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                const isBottleneck = Boolean(res?.isBottleneck && processes.length > 1);
                return (
                  <th
                    key={proc.id}
                    className={`py-2 px-2.5 min-w-[152px] text-left align-top ${
                      isBottleneck
                        ? isDark
                          ? 'bg-amber-950/30'
                          : 'bg-amber-50/70'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={proc.name}
                        onChange={(e) => handleFieldChange(proc.id, 'name', e.target.value)}
                        aria-label="Process name"
                        className={`w-full px-2 py-1 rounded-md border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                          isDark
                            ? 'bg-[#0E1322] border-[#252E4A] text-white'
                            : 'bg-white border-[#D8CEBC] text-slate-900'
                        }`}
                      />
                      {processes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProcess(proc.id)}
                          title={`Remove ${proc.name}`}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="mt-1 text-[10px] font-normal text-slate-500 dark:text-slate-400">
                      {isBottleneck ? (
                        <span className="text-amber-700 dark:text-amber-400 font-bold">
                          bottleneck (slowest)
                        </span>
                      ) : res && res.spareDailyUnits > 0 ? (
                        <span>+{formatFabricationQuantity(res.spareDailyUnits)}/day spare</span>
                      ) : (
                        <span>active bay</span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {/* Production Days per Month (from Setup) */}
            <tr className={isDark ? 'bg-[#0E1322]/40' : 'bg-slate-50/50'}>
              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                production days / month (setup)
              </td>
              <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-[#222F4C]">
                {summary.productionDaysPerMonth} d ({summary.productionDaysPerAnnum}/yr)
              </td>
              {processes.map((proc) => (
                <td key={proc.id} className="py-2 px-2.5 text-right tabular-nums text-slate-500 dark:text-slate-400">
                  {summary.productionDaysPerMonth} d
                </td>
              ))}
            </tr>

            {/* Number of Workstreams (Excel R26) */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                number of workstreams
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-400 border-r border-slate-200 dark:border-[#222F4C]">
                {processes.reduce((s, p) => s + (Number(p.numberOfWorkstreams) || 0), 0)}
              </td>
              {processes.map((proc) => (
                <td key={proc.id} className="py-1.5 px-2.5">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={proc.numberOfWorkstreams}
                    onChange={(e) =>
                      handleFieldChange(
                        proc.id,
                        'numberOfWorkstreams',
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* Employees per Production Line (Excel R28) */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                employees per production line
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-400 border-r border-slate-200 dark:border-[#222F4C]">
                —
              </td>
              {processes.map((proc) => (
                <td key={proc.id} className="py-1.5 px-2.5">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={proc.employeesPerLine}
                    onChange={(e) =>
                      handleFieldChange(
                        proc.id,
                        'employeesPerLine',
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* Shift Hours (Excel R29) */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                shift hours (hrs/shift)
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-400 border-r border-slate-200 dark:border-[#222F4C]">
                —
              </td>
              {processes.map((proc) => (
                <td key={proc.id} className="py-1.5 px-2.5">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={proc.shiftHours}
                    onChange={(e) =>
                      handleFieldChange(
                        proc.id,
                        'shiftHours',
                        Math.max(0, Math.min(24, Number(e.target.value) || 0))
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* Shifts per Day (Excel R30) */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                shifts per day
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-400 border-r border-slate-200 dark:border-[#222F4C]">
                —
              </td>
              {processes.map((proc) => (
                <td key={proc.id} className="py-1.5 px-2.5">
                  <input
                    type="number"
                    min="0"
                    max="4"
                    step="1"
                    value={proc.shiftsPerDay}
                    onChange={(e) =>
                      handleFieldChange(
                        proc.id,
                        'shiftsPerDay',
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* Calculated: Production Hours per Day (Excel R32) */}
            <tr className={isDark ? 'bg-[#0E1322]/40' : 'bg-slate-50/70'}>
              <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">
                production hours per day
              </td>
              <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-[#222F4C]">
                {summary.processes.reduce((s, p) => s + p.productionHoursPerDay, 0).toFixed(1)} h
              </td>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                return (
                  <td key={proc.id} className="py-2 px-2.5 text-right font-bold tabular-nums text-slate-700 dark:text-slate-200">
                    {(res?.productionHoursPerDay ?? 0).toFixed(1)} h
                  </td>
                );
              })}
            </tr>

            {/* Units per Batch (Excel R33 — Key Fabrication Parameter) */}
            <tr>
              <td className="py-1.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                units per batch
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-500 border-r border-slate-200 dark:border-[#222F4C]">
                {formatFabricationQuantity(summary.bottleneckUnitsPerBatch)}
              </td>
              {processes.map((proc) => (
                <td key={proc.id} className="py-1.5 px-2.5">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={proc.unitsPerBatch}
                    onChange={(e) =>
                      handleFieldChange(
                        proc.id,
                        'unitsPerBatch',
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* Days per Batch (Excel R34 — Key Fabrication Parameter) */}
            <tr>
              <td className="py-1.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                days per batch
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-500 border-r border-slate-200 dark:border-[#222F4C]">
                {formatFabricationQuantity(summary.bottleneckDaysPerBatch)} d
              </td>
              {processes.map((proc) => (
                <td key={proc.id} className="py-1.5 px-2.5">
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={proc.daysPerBatch}
                    onChange={(e) =>
                      handleFieldChange(
                        proc.id,
                        'daysPerBatch',
                        Math.max(0.1, Number(e.target.value) || 0.1)
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* Calculated: Hours per Batch (Excel R35) */}
            <tr className={isDark ? 'bg-[#0E1322]/40' : 'bg-slate-50/70'}>
              <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">
                hours per batch
              </td>
              <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-[#222F4C]">
                {summary.bottleneckHoursPerBatch.toFixed(1)} h
              </td>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                return (
                  <td key={proc.id} className="py-2 px-2.5 text-right font-bold tabular-nums text-slate-700 dark:text-slate-200">
                    {(res?.hoursPerBatch ?? 0).toFixed(1)} h
                  </td>
                );
              })}
            </tr>

            {/* Calculated: Batches per Day */}
            <tr>
              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                batches per day
              </td>
              <td className="py-2 px-3 text-right tabular-nums text-slate-500 border-r border-slate-200 dark:border-[#222F4C]">
                {summary.bottleneckBatchesPerDay.toFixed(2)}
              </td>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                return (
                  <td key={proc.id} className="py-2 px-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {(res?.batchesPerDay ?? 0).toFixed(2)}
                  </td>
                );
              })}
            </tr>

            {/* Time Allocation % */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                production time allocation %
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-400 border-r border-slate-200 dark:border-[#222F4C]">
                —
              </td>
              {processes.map((proc) => (
                <td key={proc.id} className="py-1.5 px-2.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={proc.timeAllocationPct}
                    onChange={(e) =>
                      handleFieldChange(
                        proc.id,
                        'timeAllocationPct',
                        Math.max(0, Math.min(100, Number(e.target.value) || 0))
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* Shrinkage % */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                shrinkage / rework %
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-400 border-r border-slate-200 dark:border-[#222F4C]">
                —
              </td>
              {processes.map((proc) => (
                <td key={proc.id} className="py-1.5 px-2.5">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    step="0.5"
                    value={proc.shrinkagePct}
                    onChange={(e) =>
                      handleFieldChange(
                        proc.id,
                        'shrinkagePct',
                        Math.max(0, Math.min(99, Number(e.target.value) || 0))
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* HIGHLIGHTED RESULT: Production per Day (MIN across active processes — Excel R36) */}
            <tr
              className={`border-t-2 font-bold ${
                isDark
                  ? 'bg-[#2E5E88]/20 border-[#2E5E88]/50 text-white'
                  : 'bg-[#EEF4FA] border-[#2E5E88]/40 text-slate-900'
              }`}
            >
              <td className="py-2.5 px-3 text-[#2E5E88] dark:text-[#6BA3D6]">
                production per day
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums text-[#2E5E88] dark:text-[#6BA3D6] text-sm border-r border-slate-200 dark:border-[#222F4C]">
                {formatFabricationQuantity(summary.bottleneckDailyCapacity)}
              </td>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                const isBottleneck = Boolean(res?.isBottleneck && processes.length > 1);
                return (
                  <td
                    key={proc.id}
                    className={`py-2.5 px-2.5 text-right tabular-nums ${
                      isBottleneck
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {formatFabricationQuantity(res?.netDailyCapacity ?? 0)}
                  </td>
                );
              })}
            </tr>

            {/* Production per Month (Excel R37) */}
            <tr className={isDark ? 'bg-[#0E1322]/40' : 'bg-slate-50/60'}>
              <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">
                production per month
              </td>
              <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-white border-r border-slate-200 dark:border-[#222F4C]">
                {formatFabricationQuantity(summary.monthlyCapacity)}
              </td>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                return (
                  <td key={proc.id} className="py-2 px-2.5 text-right tabular-nums text-slate-600 dark:text-slate-400">
                    {formatFabricationQuantity(res?.monthlyCapacity ?? 0)}
                  </td>
                );
              })}
            </tr>

            {/* Employees Required Standard (Excel R38) */}
            <tr>
              <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">
                employees required standard
              </td>
              <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-white border-r border-slate-200 dark:border-[#222F4C]">
                {summary.totalEmployeesStandard}
              </td>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                return (
                  <td key={proc.id} className="py-2 px-2.5 text-right font-bold tabular-nums text-slate-700 dark:text-slate-300">
                    {res?.employeesRequiredStandard ?? 0}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
