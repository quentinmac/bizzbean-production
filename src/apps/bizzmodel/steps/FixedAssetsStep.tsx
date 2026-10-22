import React from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { BizzModelState, FixedAssetItem, STANDARD_ASSET_CATEGORIES } from '../constants';

interface FixedAssetsStepProps {
  theme?: 'light' | 'dark';
  mode: 'bizzdynamics' | 'bizzmodel';
  state: BizzModelState;
  onUpdateState: (updater: (prev: BizzModelState) => BizzModelState) => void;
}

export const FixedAssetsStep: React.FC<FixedAssetsStepProps> = ({
  theme = 'light',
  mode,
  state,
  onUpdateState,
}) => {
  const isDark = theme === 'dark';

  const handleUpdateAsset = (idx: number, patch: Partial<FixedAssetItem>) => {
    onUpdateState((prev) => {
      const fixedAssets = [...prev.fixedAssets];
      fixedAssets[idx] = { ...fixedAssets[idx], ...patch };
      return { ...prev, fixedAssets };
    });
  };

  const handleAddAsset = () => {
    const defaultCat = STANDARD_ASSET_CATEGORIES[1]; // Computer hardware (33.33%)
    const usefulLifeMonths = Math.round(12 / (defaultCat.depreciationRate / 100));
    const newAsset: FixedAssetItem = {
      id: `fa-${Date.now()}`,
      name: 'New Capital Asset & Machinery',
      category: defaultCat.name,
      depreciationRate: defaultCat.depreciationRate,
      purchaseCost: 45000,
      purchaseMonth: 1,
      usefulLifeMonths,
      scrapValue: 0,
    };
    onUpdateState((prev) => ({
      ...prev,
      fixedAssets: [...prev.fixedAssets, newAsset],
    }));
  };

  const handleAddFromCategory = (catName: string, depRate: number) => {
    const usefulLifeMonths = Math.round(12 / (depRate / 100));
    const newAsset: FixedAssetItem = {
      id: `fa-${Date.now()}`,
      name: `${catName} Unit`,
      category: catName,
      depreciationRate: depRate,
      purchaseCost: 35000,
      purchaseMonth: 1,
      usefulLifeMonths,
      scrapValue: 0,
    };
    onUpdateState((prev) => ({
      ...prev,
      fixedAssets: [...prev.fixedAssets, newAsset],
    }));
  };

  const handleRemoveAsset = (idx: number) => {
    onUpdateState((prev) => ({
      ...prev,
      fixedAssets: prev.fixedAssets.filter((_, i) => i !== idx),
    }));
  };

  const totalAssetCost = state.fixedAssets.reduce((s, a) => s + a.purchaseCost, 0);

  return (
    <div className={`p-4 sm:p-6 space-y-6 font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white">
            FIXED ASSETS & CAPITAL EXPENDITURE (CAPEX)
          </h2>
          <p className="text-xs text-slate-500">
            Total capital equipment value: R {totalAssetCost.toLocaleString()}. Calculates monthly straight-line depreciation.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddAsset}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold uppercase shadow-xs transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Capital Asset</span>
        </button>
      </div>

      <div className="space-y-3">
        {state.fixedAssets.map((asset, idx) => {
          const monthlyDep = (asset.purchaseCost - asset.scrapValue) / (asset.usefulLifeMonths || 36);
          return (
            <div
              key={asset.id}
              className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <input
                  type="text"
                  value={asset.name}
                  onChange={(e) => handleUpdateAsset(idx, { name: e.target.value })}
                  className="font-bold text-sm bg-transparent border-none focus:outline-none text-slate-900 dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#5584B4]">
                    Depreciation: R {Math.round(monthlyDep).toLocaleString()} / mo
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAsset(idx)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">Asset Category:</label>
                  <select
                    value={asset.category || STANDARD_ASSET_CATEGORIES[1].name}
                    onChange={(e) => {
                      const cat = STANDARD_ASSET_CATEGORIES.find((c) => c.name === e.target.value);
                      if (cat) {
                        const usefulLife = Math.round(12 / (cat.depreciationRate / 100));
                        handleUpdateAsset(idx, {
                          category: cat.name,
                          depreciationRate: cat.depreciationRate,
                          usefulLifeMonths: usefulLife,
                        });
                      } else {
                        handleUpdateAsset(idx, { category: e.target.value });
                      }
                    }}
                    className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                  >
                    {STANDARD_ASSET_CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.depreciationRate}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">Purchase Cost (ZAR / $):</label>
                  <input
                    type="number"
                    value={asset.purchaseCost}
                    onChange={(e) => handleUpdateAsset(idx, { purchaseCost: Number(e.target.value) })}
                    className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">Purchase Month (1-36):</label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={asset.purchaseMonth}
                    onChange={(e) => handleUpdateAsset(idx, { purchaseMonth: Number(e.target.value) })}
                    className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">Useful Life (Months):</label>
                  <input
                    type="number"
                    min="6"
                    max="120"
                    value={asset.usefulLifeMonths}
                    onChange={(e) => handleUpdateAsset(idx, { usefulLifeMonths: Number(e.target.value) })}
                    className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">Scrap Residual Value:</label>
                  <input
                    type="number"
                    value={asset.scrapValue}
                    onChange={(e) => handleUpdateAsset(idx, { scrapValue: Number(e.target.value) })}
                    className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Add from Standard Asset Categories */}
      <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold uppercase text-slate-900 dark:text-white">
            STANDARD ASSET CATEGORIES (V1 SUITE)
          </span>
          <span className="text-[11px] text-slate-400">
            Official straight-line depreciation rates
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {STANDARD_ASSET_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => handleAddFromCategory(cat.name, cat.depreciationRate)}
              className={`p-2.5 rounded-xl text-left border transition-all space-y-1 ${
                isDark
                  ? 'bg-[#161C30] hover:bg-[#1E2548] border-[#252E4A] hover:border-[#5584B4] text-slate-200'
                  : 'bg-slate-50 hover:bg-slate-100 border-[#D8CEBC] hover:border-[#5584B4] text-slate-800'
              }`}
            >
              <div className="text-xs font-bold truncate">{cat.name}</div>
              <div className="text-[11px] text-[#5584B4] font-mono">
                {cat.depreciationRate}% p.a.
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
