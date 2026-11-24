import React from 'react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { PackagingLevel, PackagingSummaryResult } from './modelSetTypes';
import { formatUnitCostValue } from './continuousProductionEngine';

interface PackagingCostsPanelProps {
  theme?: 'light' | 'dark';
  stepNumber?: number;
  levels: PackagingLevel[];
  summary: PackagingSummaryResult;
  onChange: (updated: PackagingLevel[]) => void;
}

const DEFAULT_LEVEL_LABELS = [
  'Primary Unit Pack',
  'Secondary Inner Case',
  'Tertiary Outer Carton',
  'Pallet / Shrink Wrap',
  'Container / Export Crate',
];

export const PackagingCostsPanel: React.FC<PackagingCostsPanelProps> = ({
  theme = 'light',
  stepNumber = 4,
  levels,
  summary,
  onChange,
}) => {
  const isDark = theme === 'dark';

  const handleFieldChange = <K extends keyof PackagingLevel>(
    id: string,
    field: K,
    value: PackagingLevel[K]
  ) => {
    onChange(levels.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const handleAddLevel = () => {
    const idx = levels.length;
    const defaultName = DEFAULT_LEVEL_LABELS[idx] || `Level ${idx + 1} Packaging`;
    const newLevel: PackagingLevel = {
      id: `pkg-${Date.now()}`,
      name: defaultName,
      containsCount: idx === 0 ? 1 : idx === 1 ? 6 : idx === 2 ? 4 : 20,
      componentCost: idx === 0 ? 1.0 : idx === 1 ? 3.0 : idx === 2 ? 10.0 : 120.0,
      wastePct: 0,
    };
    onChange([...levels, newLevel]);
  };

  const handleRemoveLevel = (id: string) => {
    onChange(levels.filter((l) => l.id !== id));
  };

  const resultMap = new Map(summary.levels.map((r) => [r.id, r]));

  const inputCls = `w-full px-2 py-1.5 rounded-lg border text-xs font-bold text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
    isDark
      ? 'bg-[#141A2E] border-[#252E4A] text-white'
      : 'bg-[#F0F5FA] border-[#C9D8E8] text-slate-900'
  }`;

  const textInputCls = `w-full px-2 py-1.5 rounded-lg border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
    isDark
      ? 'bg-[#141A2E] border-[#252E4A] text-white'
      : 'bg-white border-[#D8CEBC] text-slate-900'
  }`;

  return (
    <div className="space-y-4">
      {/* Header & Add Level Action */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            {stepNumber}. Packaging Costs (Multi-Level)
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Configure any number of nested packaging tiers (primary, inner case, outer carton, pallet, etc.). Each tier divides its cost across the cumulative units packed inside it.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddLevel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>add packaging level</span>
        </button>
      </div>

      {/* Cascading Hierarchy Visual Trail */}
      {summary.levels.length > 0 && (
        <div
          className={`p-3 rounded-xl border flex flex-wrap items-center gap-y-2 gap-x-2 text-xs ${
            isDark
              ? 'bg-[#0C111E] border-[#222F4C]'
              : 'bg-[#FAF8F5] border-[#D8CEBC]'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mr-1">
            pack hierarchy:
          </span>
          {summary.levels.map((lvl, idx) => (
            <React.Fragment key={lvl.id}>
              {idx > 0 && <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
              <span className="text-slate-800 dark:text-slate-200 tabular-nums">
                <strong>L{lvl.levelNumber}</strong> {lvl.name}{' '}
                <span className="text-slate-500 dark:text-slate-400">
                  ({lvl.cumulativeUnitsPacked.toLocaleString()} {lvl.cumulativeUnitsPacked === 1 ? 'unit' : 'units'} · {formatUnitCostValue(lvl.unitCostContribution)}/u)
                </span>
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Multi-Level Packaging Table */}
      {levels.length === 0 ? (
        <div
          className={`p-6 rounded-xl border text-center space-y-2 ${
            isDark
              ? 'bg-[#0C111E] border-[#222F4C] text-slate-400'
              : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-500'
          }`}
        >
          <p className="text-xs">No packaging levels configured. Unit packaging cost is 0.00.</p>
          <button
            type="button"
            onClick={handleAddLevel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold lowercase cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>add primary packaging level</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#222F4C]">
          <table className="w-full text-xs border-collapse min-w-[720px]">
            <thead>
              <tr
                className={`border-b text-[11px] ${
                  isDark
                    ? 'bg-[#121A2F] border-[#222F4C] text-slate-300'
                    : 'bg-[#F5F2EC] border-[#D8CEBC] text-slate-700'
                }`}
              >
                <th className="py-2.5 px-3 text-left font-bold w-16">level</th>
                <th className="py-2.5 px-3 text-left font-bold min-w-[180px]">packaging level description</th>
                <th className="py-2.5 px-2 text-right font-bold w-36">contains (prev level)</th>
                <th className="py-2.5 px-2 text-right font-bold w-28">units packed</th>
                <th className="py-2.5 px-2 text-right font-bold w-28">component cost</th>
                <th className="py-2.5 px-2 text-right font-bold w-24">waste %</th>
                <th className="py-2.5 px-3 text-right font-bold w-28 text-[#2E5E88] dark:text-[#6BA3D6]">
                  cost / unit
                </th>
                <th className="py-2.5 px-2 w-9"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {levels.map((lvl, idx) => {
                const res = resultMap.get(lvl.id);
                const prevLabel = idx === 0 ? 'items / pack' : `L${idx} packs`;
                return (
                  <tr
                    key={lvl.id}
                    className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'}
                  >
                    <td className="py-2 px-3 font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                      L{idx + 1}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={lvl.name}
                        onChange={(e) => handleFieldChange(lvl.id, 'name', e.target.value)}
                        placeholder={`Level ${idx + 1} packaging`}
                        className={textInputCls}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={lvl.containsCount}
                          onChange={(e) =>
                            handleFieldChange(
                              lvl.id,
                              'containsCount',
                              Math.max(1, Number(e.target.value) || 1)
                            )
                          }
                          className={inputCls}
                        />
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                          {prevLabel}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-bold tabular-nums text-slate-700 dark:text-slate-300">
                      {(res?.cumulativeUnitsPacked ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        step="0.05"
                        value={lvl.componentCost}
                        onChange={(e) =>
                          handleFieldChange(
                            lvl.id,
                            'componentCost',
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className={inputCls}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={lvl.wastePct ?? 0}
                        onChange={(e) =>
                          handleFieldChange(
                            lvl.id,
                            'wastePct',
                            Math.max(0, Math.min(100, Number(e.target.value) || 0))
                          )
                        }
                        className={inputCls}
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-bold tabular-nums text-[#2E5E88] dark:text-[#6BA3D6]">
                      {formatUnitCostValue(res?.unitCostContribution ?? 0)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLevel(lvl.id)}
                        title={`Remove ${lvl.name}`}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr
                className={`border-t-2 font-bold ${
                  isDark
                    ? 'bg-[#2E5E88]/20 border-[#2E5E88]/50 text-white'
                    : 'bg-[#EEF4FA] border-[#2E5E88]/40 text-slate-900'
                }`}
              >
                <td colSpan={4} className="py-2.5 px-3 text-left text-xs">
                  {levels.length} packaging {levels.length === 1 ? 'level' : 'levels'} · top-level pack holds {summary.topLevelUnitsPacked.toLocaleString()} units ({summary.totalTopLevelPackCost.toFixed(2)} total/pack)
                </td>
                <td colSpan={2} className="py-2.5 px-2 text-right text-xs text-slate-600 dark:text-slate-300">
                  packaging unit cost
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-sm text-[#2E5E88] dark:text-[#6BA3D6]">
                  {formatUnitCostValue(summary.totalPackagingUnitCost)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};
