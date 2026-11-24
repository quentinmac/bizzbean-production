import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  BomSummaryResult,
  ContinuousBomComponent,
  ContinuousProductionSummaryResult,
} from './modelSetTypes';
import { formatUnitCostValue } from './continuousProductionEngine';

interface ContinuousBillOfMaterialsPanelProps {
  theme?: 'light' | 'dark';
  stepNumber?: number;
  components: ContinuousBomComponent[];
  summary: BomSummaryResult;
  production: ContinuousProductionSummaryResult;
  onChange: (updated: ContinuousBomComponent[]) => void;
}

export const ContinuousBillOfMaterialsPanel: React.FC<
  ContinuousBillOfMaterialsPanelProps
> = ({ theme = 'light', stepNumber = 3, components, summary, production, onChange }) => {
  const isDark = theme === 'dark';

  const handleFieldChange = <K extends keyof ContinuousBomComponent>(
    id: string,
    field: K,
    value: ContinuousBomComponent[K]
  ) => {
    onChange(components.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleAddComponent = () => {
    const newItem: ContinuousBomComponent = {
      id: `cont-bom-${Date.now()}`,
      name: `Component ${String.fromCharCode(65 + components.length)}`,
      unitOfMeasure: 'g',
      unitsRequiredPerItem: 10,
      unitDivider: 1000,
      packSizeUnits: 25,
      packCost: 250,
      consumablesCostPerHour: 0,
      surplusWasted: false,
    };
    onChange([...components, newItem]);
  };

  const handleRemoveComponent = (id: string) => {
    onChange(components.filter((c) => c.id !== id));
  };

  const resultMap = new Map(summary.items.map((r) => [r.id, r]));

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
      {/* Header & Add Action */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            {stepNumber}. Bill of Materials (BOM)
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Dynamic product costing calculator. Linked to{' '}
            {Math.round(production.bottleneckGrossDailyUnits).toLocaleString()} gross units/day (
            {production.bottleneckHoursPerDay.toFixed(1)} hrs/day) and{' '}
            {production.bottleneckDailyCapacity.toLocaleString()} net sellable units/day.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddComponent}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>add material</span>
        </button>
      </div>

      {/* Empty State */}
      {components.length === 0 ? (
        <div
          className={`p-6 rounded-xl border text-center space-y-2 ${
            isDark
              ? 'bg-[#0C111E] border-[#222F4C] text-slate-400'
              : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-500'
          }`}
        >
          <p className="text-xs">No bill of materials components configured yet.</p>
          <button
            type="button"
            onClick={handleAddComponent}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold lowercase cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>add first material</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#222F4C]">
          <table className="w-full text-xs border-collapse min-w-[900px]">
            <thead>
              <tr
                className={`border-b text-[11px] ${
                  isDark
                    ? 'bg-[#121A2F] border-[#222F4C] text-slate-300'
                    : 'bg-[#F5F2EC] border-[#D8CEBC] text-slate-700'
                }`}
              >
                <th className="py-2.5 px-3 text-left font-bold min-w-[165px]">
                  component / material
                </th>
                <th className="py-2.5 px-2 text-right font-bold w-24">qty / item</th>
                <th className="py-2.5 px-2 text-center font-bold w-16">unit</th>
                <th
                  className="py-2.5 px-2 text-right font-bold w-20"
                  title="Conversion factor if item unit differs from pack unit (e.g. 1000 for g to kg)"
                >
                  divider
                </th>
                <th className="py-2.5 px-2 text-right font-bold w-24">pack size</th>
                <th className="py-2.5 px-2 text-right font-bold w-24">pack cost</th>
                <th className="py-2.5 px-2 text-right font-bold w-24">
                  consumables / hr
                </th>
                <th className="py-2.5 px-2 text-center font-bold w-24">
                  surplus wasted?
                </th>
                <th className="py-2.5 px-2 text-right font-bold w-24">
                  packs / surplus
                </th>
                <th className="py-2.5 px-3 text-right font-bold w-24 text-[#2E5E88] dark:text-[#6BA3D6]">
                  unit cost
                </th>
                <th className="py-2.5 px-2 w-9"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {components.map((comp) => {
                const res = resultMap.get(comp.id);
                return (
                  <tr
                    key={comp.id}
                    className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'}
                  >
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={comp.name}
                        onChange={(e) => handleFieldChange(comp.id, 'name', e.target.value)}
                        placeholder="Material name"
                        className={textInputCls}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={comp.unitsRequiredPerItem}
                        onChange={(e) =>
                          handleFieldChange(
                            comp.id,
                            'unitsRequiredPerItem',
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className={inputCls}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={comp.unitOfMeasure}
                        onChange={(e) =>
                          handleFieldChange(comp.id, 'unitOfMeasure', e.target.value)
                        }
                        className={`w-full px-1.5 py-1.5 rounded-lg border text-xs text-center font-bold focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                          isDark
                            ? 'bg-[#141A2E] border-[#252E4A] text-white'
                            : 'bg-white border-[#D8CEBC] text-slate-800'
                        }`}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0.001"
                        step="1"
                        value={comp.unitDivider}
                        onChange={(e) =>
                          handleFieldChange(
                            comp.id,
                            'unitDivider',
                            Math.max(0.001, Number(e.target.value) || 1)
                          )
                        }
                        className={inputCls}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={comp.packSizeUnits}
                        onChange={(e) =>
                          handleFieldChange(
                            comp.id,
                            'packSizeUnits',
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
                        step="0.01"
                        value={comp.packCost}
                        onChange={(e) =>
                          handleFieldChange(
                            comp.id,
                            'packCost',
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
                        step="0.5"
                        value={comp.consumablesCostPerHour}
                        onChange={(e) =>
                          handleFieldChange(
                            comp.id,
                            'consumablesCostPerHour',
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className={inputCls}
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          handleFieldChange(comp.id, 'surplusWasted', !comp.surplusWasted)
                        }
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          comp.surplusWasted
                            ? 'bg-amber-600 text-white'
                            : isDark
                            ? 'bg-[#141A2E] text-slate-300 border border-[#252E4A]'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {comp.surplusWasted ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums text-slate-600 dark:text-slate-400">
                      <span className="block font-bold text-slate-800 dark:text-slate-200">
                        {(res?.packsRequiredPerDay ?? 0).toLocaleString()} pk/d
                      </span>
                      <span className="text-[10px]">
                        +{Math.round(res?.surplusQuantity ?? 0).toLocaleString()}{' '}
                        {comp.unitOfMeasure}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold tabular-nums text-[#2E5E88] dark:text-[#6BA3D6]">
                      {formatUnitCostValue(res?.unitCost ?? 0)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(comp.id)}
                        title={`Remove ${comp.name}`}
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
                <td colSpan={7} className="py-2.5 px-3 text-left text-xs">
                  total materials — daily cost:{' '}
                  {summary.totalDailyMaterialsCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  · hourly cost:{' '}
                  {summary.totalBatchMaterialsCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td
                  colSpan={2}
                  className="py-2.5 px-2 text-right text-xs text-slate-600 dark:text-slate-300"
                >
                  materials unit cost
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-sm text-[#2E5E88] dark:text-[#6BA3D6]">
                  {formatUnitCostValue(summary.totalMaterialsUnitCost)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="text-[10px] text-slate-500 dark:text-slate-400">
        * Daily consumables are calculated as{' '}
        <strong>consumables / hr × {production.bottleneckHoursPerDay.toFixed(1)} hrs/day</strong>. When{' '}
        <strong>Surplus Wasted = Yes</strong>, full rounded purchase packs are absorbed into daily unit cost. When <strong>No</strong>, unused partial-pack surplus carries forward into stock.
      </p>
    </div>
  );
};
