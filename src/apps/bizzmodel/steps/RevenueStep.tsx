import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, TrendingUp, Layers } from 'lucide-react';
import { BizzModelState, RevenueItem, REVENUE_MODEL_CONFIGS } from '../constants';

interface RevenueStepProps {
  theme?: 'light' | 'dark';
  mode: 'bizzdynamics' | 'bizzmodel';
  state: BizzModelState;
  onUpdateState: (updater: (prev: BizzModelState) => BizzModelState) => void;
}

export const RevenueStep: React.FC<RevenueStepProps> = ({
  theme = 'light',
  mode,
  state,
  onUpdateState,
}) => {
  const isDark = theme === 'dark';

  const [activeItemIdx, setActiveItemIdx] = useState<number>(0);

  const handleUpdateItem = (idx: number, patch: Partial<RevenueItem>) => {
    onUpdateState((prev) => {
      const items = [...prev.revenueItems];
      items[idx] = { ...items[idx], ...patch };
      return { ...prev, revenueItems: items };
    });
  };

  const handleAddProduct = () => {
    const newItem: RevenueItem = {
      id: `rev-${Date.now()}`,
      category: 'RETAIL PRODUCTS',
      name: `New Solution Product ${state.revenueItems.length + 1}`,
      modelType: 'unit sales',
      unitPrice: 350,
      costOfSalesPct: 30,
      monthlyUnits: [100, 110, 125, 140, 160, 180, 200, 225, 250, 280, 310, 350],
    };
    onUpdateState((prev) => ({
      ...prev,
      revenueItems: [...prev.revenueItems, newItem],
    }));
    setActiveItemIdx(state.revenueItems.length);
  };

  const activeItem = state.revenueItems[activeItemIdx] || state.revenueItems[0];
  const activeModelType = activeItem?.modelType || 'unit sales';
  const modelConfig = REVENUE_MODEL_CONFIGS[activeModelType] || REVENUE_MODEL_CONFIGS['unit sales'];

  const month1Rev = activeItem ? (activeItem.monthlyUnits[0] || 0) * activeItem.unitPrice : 0;
  const month1Gross = activeItem ? month1Rev * (1 - activeItem.costOfSalesPct / 100) : 0;

  return (
    <div className={`p-4 sm:p-6 space-y-6 font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white">
            REVENUE CALCULATOR & PRODUCTION DRIVERS
          </h2>
          <p className="text-xs text-slate-500">
            Define product pricing, cost of sales %, revenue archetype, and monthly volume curves.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddProduct}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold uppercase shadow-xs transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product Category</span>
        </button>
      </div>

      {/* Product Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {state.revenueItems.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setActiveItemIdx(idx)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              activeItemIdx === idx
                ? isDark
                  ? 'bg-[#1E2548] text-white border-[#5584B4] shadow-xs'
                  : 'bg-[#12172A] text-white border-[#12172A] shadow-xs'
                : isDark
                ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* Active Product Details & Monthly Volume Grid */}
      {activeItem && (
        <div className={`p-5 rounded-2xl border space-y-5 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <label className="text-slate-500 block mb-1">Product Title:</label>
              <input
                type="text"
                value={activeItem.name}
                onChange={(e) => handleUpdateItem(activeItemIdx, { name: e.target.value })}
                className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
              />
            </div>

            <div>
              <label className="text-slate-500 block mb-1">Revenue Archetype:</label>
              <select
                value={activeModelType}
                onChange={(e) => {
                  const mType = e.target.value;
                  const patch: Partial<RevenueItem> = { modelType: mType };
                  if (mType === 'revenue share') {
                    patch.unitPrice = 200000 * 0.15; // default 15% of 200,000
                    patch.costOfSalesPct = 10;
                  } else if (mType === 'commission') {
                    patch.unitPrice = 100000 * 0.05; // default 5% of 100,000
                    patch.costOfSalesPct = 5;
                  } else if (mType === 'value sales') {
                    patch.unitPrice = 50000;
                    patch.costOfSalesPct = 60; // 40% margin
                  } else if (mType === 'unit sales') {
                    patch.unitPrice = 50;
                    patch.costOfSalesPct = 60; // 30/50
                  }
                  handleUpdateItem(activeItemIdx, patch);
                }}
                className={`w-full p-2 rounded-xl border text-xs font-bold capitalize ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
              >
                {Object.keys(REVENUE_MODEL_CONFIGS).map((k) => (
                  <option key={k} value={k} className="capitalize">
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-500 block mb-1">
                {activeModelType === 'revenue share'
                  ? 'Calculated Share Value (R):'
                  : activeModelType === 'commission'
                  ? 'Commission Value (R):'
                  : activeModelType === 'value sales'
                  ? 'Monthly Value (R):'
                  : 'Unit Selling Price (R):'}
              </label>
              <input
                type="number"
                value={activeItem.unitPrice}
                onChange={(e) => handleUpdateItem(activeItemIdx, { unitPrice: Number(e.target.value) })}
                className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
              />
            </div>

            <div>
              <label className="text-slate-500 block mb-1">Cost of Sales (COGS %):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={activeItem.costOfSalesPct}
                  onChange={(e) => handleUpdateItem(activeItemIdx, { costOfSalesPct: Number(e.target.value) })}
                  className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                />
                <span className="text-slate-400 font-bold">%</span>
              </div>
            </div>
          </div>

          {/* Month by month sales units */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900 dark:text-white uppercase">
                12-MONTH PRODUCTION / SALES UNITS CURVE
              </span>
              <span className="text-slate-400">
                Month 01 Rev: R{month1Rev.toLocaleString()} | Gross: R{month1Gross.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-xs">
              {Array.from({ length: 12 }).map((_, mIdx) => {
                const units = activeItem.monthlyUnits[mIdx] ?? 100;
                return (
                  <div
                    key={mIdx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 space-y-1"
                  >
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Month {mIdx + 1}</div>
                    <input
                      type="number"
                      value={units}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const updatedUnits = [...activeItem.monthlyUnits];
                        updatedUnits[mIdx] = val;
                        handleUpdateItem(activeItemIdx, { monthlyUnits: updatedUnits });
                      }}
                      className="w-full p-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent text-right font-bold text-xs"
                    />
                    <div className="text-[10px] text-right text-emerald-500 font-bold">
                      R{(units * activeItem.unitPrice).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
