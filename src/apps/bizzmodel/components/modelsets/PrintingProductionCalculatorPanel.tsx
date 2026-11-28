import React from 'react';
import { Plus, Trash2, RotateCcw, AlertTriangle, Printer } from 'lucide-react';
import {
  PrintingCapacityMode,
  PrintingProcess,
  PrintingProductionSummaryResult,
} from './modelSetTypes';
import { formatMinutesAsHHMM } from './batchLotsEngine';

interface PrintingProductionCalculatorPanelProps {
  theme?: 'light' | 'dark';
  outputUnit: string;
  processes: PrintingProcess[];
  capacityMode: PrintingCapacityMode;
  summary: PrintingProductionSummaryResult;
  onChangeOutputUnit: (unit: string) => void;
  onChangeProcesses: (updated: PrintingProcess[]) => void;
  onChangeCapacityMode: (mode: PrintingCapacityMode) => void;
}

const PRINTING_UNIT_PRESETS = ['sheets', 'impressions', 'copies', 'flyers', 'brochures'];

export const PrintingProductionCalculatorPanel: React.FC<
  PrintingProductionCalculatorPanelProps
> = ({
  theme = 'light',
  outputUnit,
  processes,
  capacityMode,
  summary,
  onChangeOutputUnit,
  onChangeProcesses,
  onChangeCapacityMode,
}) => {
  const isDark = theme === 'dark';
  const unitLabel = summary.outputUnit || 'sheets';

  const handleFieldChange = <K extends keyof PrintingProcess>(
    procId: string,
    field: K,
    value: PrintingProcess[K]
  ) => {
    onChangeProcesses(
      processes.map((p) => (p.id === procId ? { ...p, [field]: value } : p))
    );
  };

  const handleAddProcess = () => {
    const defaultNames = [
      'Production Machine A',
      'Guillotine / Cutting B',
      'Folding & Binding C',
      'Laminating & Finishing D',
    ];
    const nextName =
      defaultNames[processes.length] ||
      `Print Stage ${String.fromCharCode(65 + processes.length)}`;
    const newProc: PrintingProcess = {
      id: `print-proc-${Date.now()}`,
      name: nextName,
      numberOfWorkstreams: 1,
      employeesPerLine: 1,
      shiftHours: 8,
      shiftsPerDay: 1,
      unitsPerBatch: 20000,
      productionTimeAllocationPct: 100,
      batchRunTimeMinutes: 55,
      batchSetupTimeMinutes: 5,
      shrinkagePct: 10,
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
        id: `print-proc-${Date.now()}`,
        name: 'Production Machine A',
        numberOfWorkstreams: 2,
        employeesPerLine: 1,
        shiftHours: 8,
        shiftsPerDay: 1,
        unitsPerBatch: 20000,
        productionTimeAllocationPct: 100,
        batchRunTimeMinutes: 55,
        batchSetupTimeMinutes: 5,
        shrinkagePct: 10,
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
            1. Production Calculator (Printing Presses, Batch Run / Make-Ready &amp; Spoilage)
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Define one or more print stages per job line (e.g. offset/digital press, guillotining, folding &amp; binding, laminating). Calculates daily gross volume and net saleable {unitLabel} after make-ready spoilage.
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

      {/* Output Unit & Multi-Process Rule Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-xs ${
          isDark
            ? 'bg-[#0C111E] border-[#222F4C]'
            : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 lowercase">
            <Printer className="h-3.5 w-3.5 text-[#2E5E88] dark:text-[#6BA3D6]" />
            <span>output unit:</span>
          </span>
          <input
            type="text"
            value={outputUnit}
            onChange={(e) => onChangeOutputUnit(e.target.value)}
            placeholder="sheets"
            aria-label="Printing output unit label"
            className={`w-28 px-2 py-1 rounded-lg border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
              isDark
                ? 'bg-[#141A2E] border-[#252E4A] text-white'
                : 'bg-white border-[#D8CEBC] text-slate-900'
            }`}
          />
          <div className="flex flex-wrap items-center gap-1">
            {PRINTING_UNIT_PRESETS.map((preset) => {
              const isSelected = unitLabel === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeOutputUnit(preset)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#2E5E88] text-white'
                      : isDark
                      ? 'bg-[#141A2E] text-slate-400 hover:text-white'
                      : 'bg-white border border-[#D8CEBC] text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>

        {processes.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 lowercase mr-1">
              multi-process rule:
            </span>
            <button
              type="button"
              onClick={() => onChangeCapacityMode('bottleneck')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold lowercase transition-colors cursor-pointer ${
                capacityMode === 'bottleneck'
                  ? 'bg-[#2E5E88] text-white'
                  : isDark
                  ? 'bg-[#141A2E] text-slate-300 hover:bg-slate-800'
                  : 'bg-white border border-[#D8CEBC] text-slate-600 hover:bg-slate-50'
              }`}
            >
              sequential stages (bottleneck min)
            </button>
            <button
              type="button"
              onClick={() => onChangeCapacityMode('sum')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold lowercase transition-colors cursor-pointer ${
                capacityMode === 'sum'
                  ? 'bg-[#2E5E88] text-white'
                  : isDark
                  ? 'bg-[#141A2E] text-slate-300 hover:bg-slate-800'
                  : 'bg-white border border-[#D8CEBC] text-slate-600 hover:bg-slate-50'
              }`}
            >
              parallel presses (combined sum)
            </button>
          </div>
        )}
      </div>

      {/* KPI Summary Strip */}
      <div
        className={`grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-xl border ${
          isDark
            ? 'bg-[#0C111E] border-[#222F4C]'
            : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
            net output per day (after spoilage)
          </span>
          <span className="text-base font-bold text-[#2E5E88] dark:text-[#6BA3D6] tabular-nums">
            {summary.dailyOutputCapacity.toLocaleString()} {unitLabel}/d
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
            monthly / annual net throughput
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums block mt-1">
            {summary.monthlyOutputCapacity.toLocaleString()} /mo · {summary.annualOutputCapacity.toLocaleString()} /yr
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
            gross runs &amp; press hours / day
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums block mt-1">
            {summary.grossDailyUnits.toLocaleString(undefined, { maximumFractionDigits: 0 })} gross · {summary.effectiveBatchesPerDay.toFixed(1)} runs · {summary.effectiveHoursPerDay.toFixed(1)} h
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
            {processes.length > 1 && capacityMode === 'bottleneck'
              ? 'constraining stage'
              : 'standard press staff'}
          </span>
          {processes.length > 1 && capacityMode === 'bottleneck' ? (
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-1 truncate">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{bottleneckLabel}</span>
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums block mt-1">
              {summary.totalEmployeesStandard} {summary.totalEmployeesStandard === 1 ? 'employee' : 'employees'} ({processes.length} {processes.length === 1 ? 'stage' : 'stages'})
            </span>
          )}
        </div>
      </div>

      {/* Multi-Process Comparison Matrix (Excel R23–R43) */}
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
              <th className="py-2.5 px-3 text-left font-bold text-slate-700 dark:text-slate-300 w-60 min-w-[235px]">
                printing machine / stage parameter
              </th>
              <th className="py-2.5 px-3 text-right font-bold text-[#2E5E88] dark:text-[#6BA3D6] w-36 min-w-[135px] border-r border-slate-200 dark:border-[#222F4C]">
                product total
              </th>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                const isBottleneck = Boolean(
                  res?.isBottleneck && processes.length > 1 && capacityMode === 'bottleneck'
                );
                return (
                  <th
                    key={proc.id}
                    className={`py-2 px-2.5 min-w-[160px] text-left align-top ${
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
                        aria-label="Printing process name"
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
                      ) : res && res.spareDailyOutput > 0 ? (
                        <span>
                          +{res.spareDailyOutput.toLocaleString()} {unitLabel}/d spare
                        </span>
                      ) : (
                        <span>active press line</span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {/* Production Days per Month (Excel R24) */}
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

            {/* Number of Workstreams (Excel R25) */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                number of workstreams (presses)
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

            {/* Employees per Production Line (Excel R27) */}
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

            {/* Shift Hours (Excel R28) */}
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

            {/* Shifts per Day (Excel R29) */}
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

            {/* Calculated: Production Hours per Day (Excel R31) */}
            <tr className={isDark ? 'bg-[#0E1322]/40' : 'bg-slate-50/70'}>
              <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">
                production hours per day
              </td>
              <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-[#222F4C]">
                {summary.effectiveHoursPerDay.toFixed(1)} h
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

            {/* Units per Batch (Excel R32) */}
            <tr>
              <td className="py-1.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                {unitLabel} per batch
              </td>
              <td className="py-1.5 px-3 text-right font-bold tabular-nums text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-[#222F4C]">
                {summary.effectiveUnitsPerBatch.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              {processes.map((proc) => (
                <td key={proc.id} className="py-1.5 px-2.5">
                  <input
                    type="number"
                    min="0"
                    step="100"
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

            {/* Production Time Allocation % (Excel R33) */}
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
                    value={proc.productionTimeAllocationPct}
                    onChange={(e) =>
                      handleFieldChange(
                        proc.id,
                        'productionTimeAllocationPct',
                        Math.max(0, Math.min(100, Number(e.target.value) || 0))
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* Allocated Units per Batch (Excel R34) */}
            <tr className={isDark ? 'bg-[#0E1322]/40' : 'bg-slate-50/70'}>
              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                allocated {unitLabel} per batch
              </td>
              <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-[#222F4C]">
                {summary.effectiveUnitsPerBatch.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                return (
                  <td key={proc.id} className="py-2 px-2.5 text-right tabular-nums text-slate-600 dark:text-slate-400">
                    {(res?.allocatedUnitsPerBatch ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                );
              })}
            </tr>

            {/* Batch Run Time (minutes, Excel R35) */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                batch run time (minutes)
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
                    value={proc.batchRunTimeMinutes}
                    onChange={(e) =>
                      handleFieldChange(
                        proc.id,
                        'batchRunTimeMinutes',
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* Batch Setup / Make-Ready Time (minutes, Excel R36) */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                batch set up / make-ready (min)
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
                    value={proc.batchSetupTimeMinutes}
                    onChange={(e) =>
                      handleFieldChange(
                        proc.id,
                        'batchSetupTimeMinutes',
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* Total Batch Time & Batches/Day (Excel R37–R38) */}
            <tr className={isDark ? 'bg-[#0E1322]/40' : 'bg-slate-50/70'}>
              <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">
                batch time (hh:mm) / runs per day
              </td>
              <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-[#222F4C]">
                {summary.effectiveBatchesPerDay.toFixed(1)} runs/d
              </td>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                return (
                  <td key={proc.id} className="py-2 px-2.5 text-right tabular-nums text-slate-700 dark:text-slate-200">
                    {formatMinutesAsHHMM(res?.batchTotalTimeMinutes ?? 0)} · {(res?.batchesPerDay ?? 0).toFixed(1)}/d
                  </td>
                );
              })}
            </tr>

            {/* Gross Units per Day (Excel R39 -> feeds BOM R58) */}
            <tr className={isDark ? 'bg-[#0E1322]/40' : 'bg-slate-50/60'}>
              <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">
                gross {unitLabel} per day (feeds BOM)
              </td>
              <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-[#222F4C]">
                {summary.grossDailyUnits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                return (
                  <td key={proc.id} className="py-2 px-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {(res?.grossUnitsPerDay ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                );
              })}
            </tr>

            {/* Shrinkage / Spoilage % (Excel R40) */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                shrinkage / make-ready spoilage %
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-500 border-r border-slate-200 dark:border-[#222F4C]">
                {summary.effectiveShrinkagePct.toFixed(1)}%
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

            {/* HIGHLIGHTED RESULT: Net Output per Day (Excel R41) */}
            <tr
              className={`border-t-2 font-bold ${
                isDark
                  ? 'bg-[#2E5E88]/20 border-[#2E5E88]/50 text-white'
                  : 'bg-[#EEF4FA] border-[#2E5E88]/40 text-slate-900'
              }`}
            >
              <td className="py-2.5 px-3 text-[#2E5E88] dark:text-[#6BA3D6]">
                output per day (net {unitLabel})
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums text-[#2E5E88] dark:text-[#6BA3D6] text-sm border-r border-slate-200 dark:border-[#222F4C]">
                {summary.dailyOutputCapacity.toLocaleString()}
              </td>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                const isBottleneck = Boolean(
                  res?.isBottleneck && processes.length > 1 && capacityMode === 'bottleneck'
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
                    {(res?.outputPerDay ?? 0).toLocaleString()}
                  </td>
                );
              })}
            </tr>

            {/* Output per Month (Excel R42) */}
            <tr className={isDark ? 'bg-[#0E1322]/40' : 'bg-slate-50/60'}>
              <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">
                output per month (net {unitLabel})
              </td>
              <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-white border-r border-slate-200 dark:border-[#222F4C]">
                {summary.monthlyOutputCapacity.toLocaleString()}
              </td>
              {processes.map((proc) => {
                const res = resultMap.get(proc.id);
                return (
                  <td key={proc.id} className="py-2 px-2.5 text-right tabular-nums text-slate-600 dark:text-slate-400">
                    {(res?.outputPerMonth ?? 0).toLocaleString()}
                  </td>
                );
              })}
            </tr>

            {/* Employees Required Standard (Excel R43) */}
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
