import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  ProductionSummaryResult,
  ProductionVariableCostItem,
  VariableCostBasis,
  VariableCostSummaryResult,
} from './modelSetTypes';

interface ProductionVariableCostsPanelProps {
  theme?: 'light' | 'dark';
  stepNumber?: number;
  batchSourceLabel?: string;
  items: ProductionVariableCostItem[];
  summary: VariableCostSummaryResult;
  production: ProductionSummaryResult;
  referenceBatchSizeOverride?: number;
  onChange: (updated: ProductionVariableCostItem[]) => void;
  onChangeReferenceBatchOverride?: (val: number) => void;
}

export const ProductionVariableCostsPanel: React.FC<ProductionVariableCostsPanelProps> = ({
  theme = 'light',
  stepNumber = 5,
  batchSourceLabel = 'constraining process',
  items,
  summary,
  production,
  referenceBatchSizeOverride = 0,
  onChange,
  onChangeReferenceBatchOverride,
}) => {
  const isDark = theme === 'dark';

  const handleFieldChange = <K extends keyof ProductionVariableCostItem>(
    id: string,
    field: K,
    value: ProductionVariableCostItem[K]
  ) => {
    onChange(items.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const handleAddItem = () => {
    const newItem: ProductionVariableCostItem = {
      id: `var-${Date.now()}`,
      name: `Variable Cost ${items.length + 1}`,
      basis: 'per_batch',
      usage: 1,
      usageUnit: 'batch',
      unitRate: 10,
    };
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
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
            {stepNumber}. Production Variable Costs
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Direct utilities, energy, maintenance, and other variable costs driven by batch production or unit output.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddItem}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>add variable cost</span>
        </button>
      </div>

      {/* Reference Batch Size Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border text-xs ${
          isDark
            ? 'bg-[#0C111E] border-[#222F4C]'
            : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            reference batch quantity: {summary.referenceBatchUnits.toLocaleString()} units / batch
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
            {referenceBatchSizeOverride > 0
              ? `using custom batch divisor override (set to 0 to sync automatically with ${batchSourceLabel})`
              : `synced from ${batchSourceLabel} (${production.bottleneckUnitsPerBatch.toLocaleString()} units/batch)`}
          </span>
        </div>

        {onChangeReferenceBatchOverride && (
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-[11px] text-slate-500 dark:text-slate-400 lowercase">
              override batch qty:
            </label>
            <input
              type="number"
              min="0"
              step="10"
              value={referenceBatchSizeOverride || ''}
              placeholder="auto"
              onChange={(e) =>
                onChangeReferenceBatchOverride(Math.max(0, Number(e.target.value) || 0))
              }
              className={`w-24 px-2 py-1 rounded-lg border text-xs font-bold text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                isDark
                  ? 'bg-[#141A2E] border-[#252E4A] text-white'
                  : 'bg-white border-[#D8CEBC] text-slate-900'
              }`}
            />
          </div>
        )}
      </div>

      {/* Variable Costs Table */}
      {items.length === 0 ? (
        <div
          className={`p-6 rounded-xl border text-center space-y-2 ${
            isDark
              ? 'bg-[#0C111E] border-[#222F4C] text-slate-400'
              : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-500'
          }`}
        >
          <p className="text-xs">No production variable costs configured. Variable unit cost is 0.00.</p>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold lowercase cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>add first variable cost</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#222F4C]">
          <table className="w-full text-xs border-collapse min-w-[740px]">
            <thead>
              <tr
                className={`border-b text-[11px] ${
                  isDark
                    ? 'bg-[#121A2F] border-[#222F4C] text-slate-300'
                    : 'bg-[#F5F2EC] border-[#D8CEBC] text-slate-700'
                }`}
              >
                <th className="py-2.5 px-3 text-left font-bold min-w-[165px]">cost item</th>
                <th className="py-2.5 px-2 text-left font-bold w-32">cost basis</th>
                <th className="py-2.5 px-2 text-right font-bold w-24">usage</th>
                <th className="py-2.5 px-2 text-center font-bold w-20">unit</th>
                <th className="py-2.5 px-2 text-right font-bold w-28">cost / rate</th>
                <th className="py-2.5 px-2 text-right font-bold w-28">batch cost</th>
                <th className="py-2.5 px-3 text-right font-bold w-28 text-[#2E5E88] dark:text-[#6BA3D6]">
                  unit cost
                </th>
                <th className="py-2.5 px-2 w-9"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {items.map((item) => {
                const res = resultMap.get(item.id);
                return (
                  <tr
                    key={item.id}
                    className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'}
                  >
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleFieldChange(item.id, 'name', e.target.value)}
                        placeholder="Cost name"
                        className={textInputCls}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={item.basis}
                        onChange={(e) =>
                          handleFieldChange(item.id, 'basis', e.target.value as VariableCostBasis)
                        }
                        className={`w-full px-2 py-1.5 rounded-lg border text-xs font-bold cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                          isDark
                            ? 'bg-[#141A2E] border-[#252E4A] text-white'
                            : 'bg-white border-[#D8CEBC] text-slate-900'
                        }`}
                      >
                        <option value="per_batch">per batch</option>
                        <option value="per_unit">per unit</option>
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.usage}
                        onChange={(e) =>
                          handleFieldChange(item.id, 'usage', Math.max(0, Number(e.target.value) || 0))
                        }
                        className={inputCls}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={item.usageUnit}
                        onChange={(e) => handleFieldChange(item.id, 'usageUnit', e.target.value)}
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
                        min="0"
                        step="0.05"
                        value={item.unitRate}
                        onChange={(e) =>
                          handleFieldChange(item.id, 'unitRate', Math.max(0, Number(e.target.value) || 0))
                        }
                        className={inputCls}
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-bold tabular-nums text-slate-700 dark:text-slate-300">
                      {(res?.batchCost ?? 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold tabular-nums text-[#2E5E88] dark:text-[#6BA3D6]">
                      {(res?.unitCost ?? 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        title={`Remove ${item.name}`}
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
                <td colSpan={5} className="py-2.5 px-3 text-left text-xs">
                  total production variable costs ({items.length} {items.length === 1 ? 'stream' : 'streams'})
                </td>
                <td className="py-2.5 px-2 text-right tabular-nums text-slate-800 dark:text-slate-200">
                  {summary.totalBatchVariableCost.toFixed(2)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-sm text-[#2E5E88] dark:text-[#6BA3D6]">
                  {summary.totalVariableUnitCost.toFixed(2)}
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
