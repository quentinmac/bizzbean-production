import React from 'react';
import { Plus, Trash2, RotateCcw, AlertTriangle, Layers } from 'lucide-react';
import {
  TimeUnitsCapacityMode,
  TimeUnitsProcess,
  TimeUnitsProductionSummaryResult,
} from './modelSetTypes';

interface TimeUnitsProductionCalculatorPanelProps {
  theme?: 'light' | 'dark';
  processes: TimeUnitsProcess[];
  capacityMode: TimeUnitsCapacityMode;
  summary: TimeUnitsProductionSummaryResult;
  onChangeProcesses: (updated: TimeUnitsProcess[]) => void;
  onChangeCapacityMode: (mode: TimeUnitsCapacityMode) => void;
}

export const TimeUnitsProductionCalculatorPanel: React.FC<
  TimeUnitsProductionCalculatorPanelProps
> = ({
  theme = 'light',
  processes,
  capacityMode,
  summary,
  onChangeProcesses,
  onChangeCapacityMode,
}) => {
  const isDark = theme === 'dark';

  const handleFieldChange = <K extends keyof TimeUnitsProcess>(
    procId: string,
    field: K,
    value: TimeUnitsProcess[K]
  ) => {
    onChangeProcesses(
      processes.map((p) => (p.id === procId ? { ...p, [field]: value } : p))
    );
  };

  const handleAddProcess = () => {
    const nextLetter = String.fromCharCode(65 + processes.length);
    const newProc: TimeUnitsProcess = {
      id: `tu-proc-${Date.now()}`,
      name: `Service Process ${nextLetter}`,
      numberOfWorkstreams: 1,
      employeesPerWorkstream: 1,
      shiftHours: 8,
      shiftsPerDay: 2,
      workstreamUtilizationPct: 80,
    };
    onChangeProcesses([...processes, newProc]);
  };

  const handleRemoveProcess = (procId: string) => {
    if (processes.length <= 1) return;
    onChangeProcesses(processes.filter((p) => p.id !== procId));
  };

  const handleClearProcesses = () => {
    onChangeProcesses([
      {
        id: `tu-proc-${Date.now()}`,
        name: 'Service Process A',
        numberOfWorkstreams: 1,
        employeesPerWorkstream: 1,
        shiftHours: 8,
        shiftsPerDay: 1,
        workstreamUtilizationPct: 100,
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

  const fmtHrs = (val: number) =>
    Number.isInteger(val) ? val.toLocaleString() : val.toFixed(1);

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            1. Production Calculator (Time Units · Production Hours per Day)
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Define one or more service processes / workstreams per product to determine daily production capacity (billable hours per day).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {processes.length > 1 && (
            <div
              className={`flex items-center p-0.5 rounded-lg border text-[10px] font-bold ${
                isDark
                  ? 'bg-[#090D18] border-[#252E4A]'
                  : 'bg-[#F5F2EC] border-[#D8CEBC]'
              }`}
            >
              <button
                type="button"
                onClick={() => onChangeCapacityMode('sum')}
                className={`px-2 py-1 rounded-md lowercase transition-colors cursor-pointer ${
                  capacityMode === 'sum'
                    ? 'bg-[#2E5E88] text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Add billable production hours across parallel service processes"
              >
                combined (parallel)
              </button>
              <button
                type="button"
                onClick={() => onChangeCapacityMode('bottleneck')}
                className={`px-2 py-1 rounded-md lowercase transition-colors cursor-pointer ${
                  capacityMode === 'bottleneck'
                    ? 'bg-[#2E5E88] text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Constrain daily capacity to the slowest sequential process"
              >
                bottleneck (slowest)
              </button>
            </div>
          )}
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

      {/* Daily Capacity Summary Strip */}
      <div
        className={`grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-xl border ${
          isDark
            ? 'bg-[#0C111E] border-[#222F4C]'
            : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
            daily production capacity
          </span>
          <span className="text-base font-bold text-[#2E5E88] dark:text-[#6BA3D6] tabular-nums">
            {fmtHrs(summary.dailyProductionCapacity)} hrs/day
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
            {processes.length > 1 && capacityMode === 'bottleneck'
              ? 'constraining bottleneck'
              : 'hours available / day (gross)'}
          </span>
          {processes.length > 1 && capacityMode === 'bottleneck' ? (
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-1 truncate">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{bottleneckLabel}</span>
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-1 tabular-nums">
              <Layers className="h-3.5 w-3.5 text-[#2E5E88] dark:text-[#6BA3D6] shrink-0" />
              <span>{fmtHrs(summary.totalHoursAvailablePerDay)} hrs/day</span>
            </span>
          )}
        </div>
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
            monthly / annual capacity
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums block mt-1">
            {fmtHrs(summary.monthlyCapacityHours)} hrs/mo · {fmtHrs(summary.annualCapacityHours)} hrs/yr
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
            standard staff across processes
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums block mt-1">
            {summary.totalEmployeesStandard}{' '}
            {summary.totalEmployeesStandard === 1 ? 'employee' : 'employees'} ({processes.length}{' '}
            {processes.length === 1 ? 'process' : 'processes'})
          </span>
        </div>
      </div>

      {/* Multi-Process Comparison Matrix matching Manufacturing standard */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#222F4C]">
        <table className="w-full text-xs border-collapse min-w-[600px]">
          <thead>
            <tr
              className={`border-b ${
                isDark
                  ? 'bg-[#121A2F] border-[#222F4C]'
                  : 'bg-[#F5F2EC] border-[#D8CEBC]'
              }`}
            >
              <th className="py-2.5 px-3 text-left font-bold text-slate-700 dark:text-slate-300 w-60 min-w-[220px]">
                production asset parameter
              </th>
              <th className="py-2.5 px-3 text-right font-bold text-[#2E5E88] dark:text-[#6BA3D6] w-36 min-w-[130px] border-r border-slate-200 dark:border-[#222F4C]">
                {processes.length > 1 && capacityMode === 'bottleneck'
                  ? 'product (bottleneck)'
                  : 'product total'}
              </th>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                const isBottleneck = Boolean(
                  capacityMode === 'bottleneck' && res?.isBottleneck && processes.length > 1
                );
                return (
                  <th
                    key={proc.id}
                    className={`py-2 px-2.5 min-w-[155px] text-left align-top ${
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
                      ) : res && res.spareDailyHours > 0 ? (
                        <span>+{fmtHrs(res.spareDailyHours)} hrs/d spare</span>
                      ) : (
                        <span>active workstream</span>
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
                <td
                  key={proc.id}
                  className="py-2 px-2.5 text-right tabular-nums text-slate-500 dark:text-slate-400"
                >
                  {summary.productionDaysPerMonth} d
                </td>
              ))}
            </tr>

            {/* Number of Workstreams (Excel R25) */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                number of workstreams
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-500 border-r border-slate-200 dark:border-[#222F4C]">
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

            {/* Employees per Workstream (Excel R26) */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                employees per workstream
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
                    value={proc.employeesPerWorkstream}
                    onChange={(e) =>
                      handleFieldChange(
                        proc.id,
                        'employeesPerWorkstream',
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* Shift Hours (Excel R27) */}
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

            {/* Shifts per Day (Excel R28) */}
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

            {/* Calculated: Hours Available per Day (Excel R29) */}
            <tr className={isDark ? 'bg-[#0E1322]/40' : 'bg-slate-50/70'}>
              <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">
                hours available per day
              </td>
              <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-[#222F4C]">
                {fmtHrs(summary.totalHoursAvailablePerDay)} hrs
              </td>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                return (
                  <td
                    key={proc.id}
                    className="py-2 px-2.5 text-right font-bold tabular-nums text-slate-700 dark:text-slate-200"
                  >
                    {fmtHrs(res?.hoursAvailablePerDay ?? 0)} hrs
                  </td>
                );
              })}
            </tr>

            {/* Workstream Utilization % (Excel R30) */}
            <tr>
              <td className="py-1.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                workstream utilization %
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-400 border-r border-slate-200 dark:border-[#222F4C]">
                {summary.totalHoursAvailablePerDay > 0
                  ? `${((summary.dailyProductionCapacity / summary.totalHoursAvailablePerDay) * 100).toFixed(1)}%`
                  : '—'}
              </td>
              {processes.map((proc) => (
                <td key={proc.id} className="py-1.5 px-2.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={proc.workstreamUtilizationPct}
                    onChange={(e) =>
                      handleFieldChange(
                        proc.id,
                        'workstreamUtilizationPct',
                        Math.max(0, Math.min(100, Number(e.target.value) || 0))
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* HIGHLIGHTED RESULT: Production Hours per Day (Daily Production Capacity — Excel R31) */}
            <tr
              className={`border-t-2 font-bold ${
                isDark
                  ? 'bg-[#2E5E88]/20 border-[#2E5E88]/50 text-white'
                  : 'bg-[#EEF4FA] border-[#2E5E88]/40 text-slate-900'
              }`}
            >
              <td className="py-2.5 px-3 text-[#2E5E88] dark:text-[#6BA3D6]">
                production hours per day (daily capacity)
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums text-[#2E5E88] dark:text-[#6BA3D6] text-sm border-r border-slate-200 dark:border-[#222F4C]">
                {fmtHrs(summary.dailyProductionCapacity)} hrs
              </td>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                const isBottleneck = Boolean(
                  capacityMode === 'bottleneck' && res?.isBottleneck && processes.length > 1
                );
                return (
                  <td
                    key={proc.id}
                    className={`py-2.5 px-2.5 text-right tabular-nums ${
                      isBottleneck
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {fmtHrs(res?.productionHoursPerDay ?? 0)} hrs
                  </td>
                );
              })}
            </tr>

            {/* Production Hours per Month */}
            <tr className={isDark ? 'bg-[#0E1322]/40' : 'bg-slate-50/60'}>
              <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">
                production hours per month
              </td>
              <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-white border-r border-slate-200 dark:border-[#222F4C]">
                {fmtHrs(summary.monthlyCapacityHours)} hrs
              </td>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                return (
                  <td
                    key={proc.id}
                    className="py-2 px-2.5 text-right tabular-nums text-slate-600 dark:text-slate-400"
                  >
                    {fmtHrs(res?.monthlyProductionHours ?? 0)} hrs
                  </td>
                );
              })}
            </tr>

            {/* Employees Required Standard (Excel R32) */}
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
                  <td
                    key={proc.id}
                    className="py-2 px-2.5 text-right font-bold tabular-nums text-slate-700 dark:text-slate-300"
                  >
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
