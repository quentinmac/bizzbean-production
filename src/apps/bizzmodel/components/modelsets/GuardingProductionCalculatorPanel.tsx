import React from 'react';
import { Plus, Trash2, Shield, Clock } from 'lucide-react';
import {
  GuardingProcess,
  GuardingProductionSummaryResult,
} from './modelSetTypes';
import { createDefaultGuardingProcess } from './guardingEngine';

interface GuardingProductionCalculatorPanelProps {
  theme?: 'light' | 'dark';
  processes: GuardingProcess[];
  guardUnitLabel: string;
  siteUnitLabel: string;
  summary: GuardingProductionSummaryResult;
  reliefGuardsPerWorkstream: number;
  guardsPerWorkstreamAdjusted: number;
  onChangeProcesses: (updated: GuardingProcess[]) => void;
  onChangeGuardUnitLabel: (label: string) => void;
  onChangeSiteUnitLabel: (label: string) => void;
}

const GUARD_UNIT_PRESETS = ['guards', 'officers', 'patrols', 'handlers', 'controllers'];
const SITE_UNIT_PRESETS = ['workstreams', 'sites', 'posts', 'contracts'];

function formatHoursAsHHMM(hours: number): string {
  const safe = Math.max(0, Number.isFinite(hours) ? hours : 0);
  const totalMins = Math.round(safe * 60);
  const hh = Math.floor(totalMins / 60);
  const mm = totalMins % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export const GuardingProductionCalculatorPanel: React.FC<
  GuardingProductionCalculatorPanelProps
> = ({
  theme = 'light',
  processes,
  guardUnitLabel,
  siteUnitLabel,
  summary,
  reliefGuardsPerWorkstream,
  guardsPerWorkstreamAdjusted,
  onChangeProcesses,
  onChangeGuardUnitLabel,
  onChangeSiteUnitLabel,
}) => {
  const isDark = theme === 'dark';

  const handleUpdateProcess = (
    idx: number,
    patch: Partial<GuardingProcess>
  ) => {
    const next = processes.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    onChangeProcesses(next);
  };

  const handleAddProcess = () => {
    const nextIdx = processes.length + 1;
    const defaultNames = [
      'Standard Guard Post',
      'Night Shift Post',
      'Gate Access Control',
      'Mobile Patrol Unit',
      'CCTV Monitoring Desk',
    ];
    const suggestedName =
      defaultNames[(nextIdx - 1) % defaultNames.length] || `Guard Post ${nextIdx}`;
    onChangeProcesses([
      ...processes,
      createDefaultGuardingProcess(suggestedName, nextIdx),
    ]);
  };

  const handleRemoveProcess = (idx: number) => {
    if (processes.length <= 1) return;
    onChangeProcesses(processes.filter((_, i) => i !== idx));
  };

  const inputCls = `w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
    isDark
      ? 'bg-[#141A2E] border-[#252E4A] text-white'
      : 'bg-[#F0F5FA] border-[#C9D8E8] text-slate-900'
  }`;

  const textInputCls = `w-full px-2 py-1 rounded-md border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
    isDark
      ? 'bg-[#141A2E] border-[#252E4A] text-white'
      : 'bg-white border-slate-300 text-slate-900'
  }`;

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            1. Production Calculator — Site Shift & Guarding Post Specification
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Define the standard shift staffing per contracted {siteUnitLabel.replace(/s$/, '')}. Add multiple post roles per site if required (e.g. Gate Guard + Patrol Officer).
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddProcess}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold lowercase shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>add guard post</span>
        </button>
      </div>

      {/* Terminology Presets Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border ${
          isDark
            ? 'bg-[#0C111E] border-[#222F4C]'
            : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            personnel label:
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {GUARD_UNIT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChangeGuardUnitLabel(preset)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold lowercase transition-colors cursor-pointer ${
                  guardUnitLabel === preset
                    ? 'bg-[#2E5E88] text-white'
                    : isDark
                    ? 'bg-[#141A2E] text-slate-300 hover:bg-[#1E2942]'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            site label:
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {SITE_UNIT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChangeSiteUnitLabel(preset)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold lowercase transition-colors cursor-pointer ${
                  siteUnitLabel === preset
                    ? 'bg-[#2E5E88] text-white'
                    : isDark
                    ? 'bg-[#141A2E] text-slate-300 hover:bg-[#1E2942]'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div
        className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-xl border ${
          isDark
            ? 'bg-[#0C111E] border-[#222F4C]'
            : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            standard {guardUnitLabel} / day
          </span>
          <span className="text-base font-bold tabular-nums text-slate-900 dark:text-white">
            {summary.standardGuardsPerWorkstream.toLocaleString('en-ZA', {
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
            per {siteUnitLabel.replace(/s$/, '')} (before relief)
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            relief cover added
          </span>
          <span className="text-base font-bold tabular-nums text-amber-600 dark:text-amber-400">
            +{reliefGuardsPerWorkstream.toLocaleString('en-ZA')}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
            from Relief Calculator (Tab 02)
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            adjusted {guardUnitLabel} / site
          </span>
          <span className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {guardsPerWorkstreamAdjusted.toLocaleString('en-ZA', {
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
            billed & employed per {siteUnitLabel.replace(/s$/, '')}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            daily site coverage
          </span>
          <span className="text-base font-bold tabular-nums text-[#2E5E88] dark:text-[#6BA3D6]">
            {summary.totalDailyCoverageHours.toLocaleString('en-ZA', {
              maximumFractionDigits: 1,
            })}{' '}
            hrs/day
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
            {summary.productionDaysPerMonth.toFixed(1)} trading days/mo
          </span>
        </div>
      </div>

      {/* Multi-Post Guarding Comparison Matrix (faithful to guarding.xlsx R23-R29) */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#222F4C]">
        <table className="w-full text-xs border-collapse min-w-[600px]">
          <thead>
            <tr
              className={`border-b ${
                isDark
                  ? 'bg-[#121A2F] border-[#222F4C]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <th className="py-2.5 px-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-64">
                production asset details
              </th>
              {processes.map((proc, idx) => (
                <th
                  key={proc.id}
                  className="py-2 px-3 text-right border-l border-slate-200 dark:border-[#222F4C] min-w-[165px]"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <input
                      type="text"
                      value={proc.name}
                      onChange={(e) =>
                        handleUpdateProcess(idx, { name: e.target.value })
                      }
                      aria-label={`Guard post ${idx + 1} name`}
                      className={textInputCls}
                    />
                    {processes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveProcess(idx)}
                        title="Remove guard post"
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {processes.length > 1 && (
                <th className="py-2.5 px-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-[#2E5E88] dark:text-[#6BA3D6] border-l border-slate-200 dark:border-[#222F4C] min-w-[130px]">
                  total / site
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {/* R24: production days */}
            <tr className="border-b border-slate-100 dark:border-[#1E2942]">
              <td className="py-2 px-3.5 text-slate-600 dark:text-slate-400 font-medium lowercase">
                production days (from setup)
              </td>
              {summary.processes.map((res) => (
                <td
                  key={res.id}
                  className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-slate-400 border-l border-slate-100 dark:border-[#1E2942]"
                >
                  {summary.productionDaysPerMonth.toFixed(1)}
                </td>
              ))}
              {processes.length > 1 && (
                <td className="py-2 px-3.5 text-right tabular-nums text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-[#222F4C]">
                  {summary.productionDaysPerMonth.toFixed(1)}
                </td>
              )}
            </tr>

            {/* R25: number of workstreams */}
            <tr className="border-b border-slate-100 dark:border-[#1E2942]">
              <td className="py-2 px-3.5 text-slate-800 dark:text-slate-200 font-bold lowercase">
                number of {siteUnitLabel} (per site template)
              </td>
              {processes.map((proc, idx) => (
                <td
                  key={proc.id}
                  className="py-1.5 px-3 border-l border-slate-100 dark:border-[#1E2942]"
                >
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={proc.numberOfWorkstreams}
                    onChange={(e) =>
                      handleUpdateProcess(idx, {
                        numberOfWorkstreams: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className={inputCls}
                  />
                </td>
              ))}
              {processes.length > 1 && (
                <td className="py-2 px-3.5 text-right tabular-nums text-slate-500 border-l border-slate-200 dark:border-[#222F4C]">
                  —
                </td>
              )}
            </tr>

            {/* R26: guards per workstream */}
            <tr className="border-b border-slate-100 dark:border-[#1E2942]">
              <td className="py-2 px-3.5 text-slate-800 dark:text-slate-200 font-bold lowercase">
                {guardUnitLabel} per {siteUnitLabel.replace(/s$/, '')} (per shift)
              </td>
              {processes.map((proc, idx) => (
                <td
                  key={proc.id}
                  className="py-1.5 px-3 border-l border-slate-100 dark:border-[#1E2942]"
                >
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={proc.guardsPerWorkstream}
                    onChange={(e) =>
                      handleUpdateProcess(idx, {
                        guardsPerWorkstream: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className={inputCls}
                  />
                </td>
              ))}
              {processes.length > 1 && (
                <td className="py-2 px-3.5 text-right tabular-nums text-slate-500 border-l border-slate-200 dark:border-[#222F4C]">
                  —
                </td>
              )}
            </tr>

            {/* R27: shift hours */}
            <tr className="border-b border-slate-100 dark:border-[#1E2942]">
              <td className="py-2 px-3.5 text-slate-800 dark:text-slate-200 font-bold lowercase">
                shift hours
              </td>
              {processes.map((proc, idx) => (
                <td
                  key={proc.id}
                  className="py-1.5 px-3 border-l border-slate-100 dark:border-[#1E2942]"
                >
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      value={proc.shiftHours}
                      onChange={(e) =>
                        handleUpdateProcess(idx, {
                          shiftHours: Math.min(24, Math.max(0, Number(e.target.value) || 0)),
                        })
                      }
                      className={inputCls}
                    />
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 w-10 text-right">
                      {formatHoursAsHHMM(proc.shiftHours)}
                    </span>
                  </div>
                </td>
              ))}
              {processes.length > 1 && (
                <td className="py-2 px-3.5 text-right tabular-nums text-slate-500 border-l border-slate-200 dark:border-[#222F4C]">
                  —
                </td>
              )}
            </tr>

            {/* R28: shifts per day */}
            <tr className="border-b border-slate-200 dark:border-[#222F4C]">
              <td className="py-2 px-3.5 text-slate-800 dark:text-slate-200 font-bold lowercase">
                shifts per day
              </td>
              {processes.map((proc, idx) => (
                <td
                  key={proc.id}
                  className="py-1.5 px-3 border-l border-slate-100 dark:border-[#1E2942]"
                >
                  <input
                    type="number"
                    min="1"
                    max="4"
                    step="1"
                    value={proc.shiftsPerDay}
                    onChange={(e) =>
                      handleUpdateProcess(idx, {
                        shiftsPerDay: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className={inputCls}
                  />
                </td>
              ))}
              {processes.length > 1 && (
                <td className="py-2 px-3.5 text-right tabular-nums text-slate-500 border-l border-slate-200 dark:border-[#222F4C]">
                  —
                </td>
              )}
            </tr>

            {/* R29: guards per day (derived) */}
            <tr
              className={`border-b border-slate-200 dark:border-[#222F4C] font-bold ${
                isDark ? 'bg-[#121A2F]/70' : 'bg-slate-50/90'
              }`}
            >
              <td className="py-2.5 px-3.5 text-slate-900 dark:text-white lowercase flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-[#2E5E88] dark:text-[#6BA3D6]" />
                <span>{guardUnitLabel} per day (standard)</span>
              </td>
              {summary.processes.map((res) => (
                <td
                  key={res.id}
                  className="py-2.5 px-3 text-right tabular-nums text-slate-900 dark:text-white border-l border-slate-200 dark:border-[#222F4C]"
                >
                  {res.guardsPerDay.toLocaleString('en-ZA', {
                    maximumFractionDigits: 2,
                  })}
                </td>
              ))}
              {processes.length > 1 && (
                <td className="py-2.5 px-3.5 text-right tabular-nums text-[#2E5E88] dark:text-[#6BA3D6] border-l border-slate-200 dark:border-[#222F4C]">
                  {summary.standardGuardsPerWorkstream.toLocaleString('en-ZA', {
                    maximumFractionDigits: 2,
                  })}
                </td>
              )}
            </tr>

            {/* Daily coverage hours (derived reference) */}
            <tr>
              <td className="py-2 px-3.5 text-slate-500 dark:text-slate-400 lowercase flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>daily coverage hours</span>
              </td>
              {summary.processes.map((res) => (
                <td
                  key={res.id}
                  className="py-2 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300 border-l border-slate-100 dark:border-[#1E2942]"
                >
                  {res.dailyCoverageHours.toLocaleString('en-ZA', {
                    maximumFractionDigits: 1,
                  })}{' '}
                  hrs
                </td>
              ))}
              {processes.length > 1 && (
                <td className="py-2 px-3.5 text-right tabular-nums font-bold text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-[#222F4C]">
                  {summary.totalDailyCoverageHours.toLocaleString('en-ZA', {
                    maximumFractionDigits: 1,
                  })}{' '}
                  hrs
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
