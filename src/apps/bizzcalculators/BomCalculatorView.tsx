import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
} from 'lucide-react';
import {
  BomComponent,
  PackagingLevel,
  ProductionVariableCostItem,
} from '../bizzmodel/components/modelsets/modelSetTypes';
import {
  BomCalculatorWorkbook,
  BomProductEntry,
  calculateBomProductSummary,
  createNewBomProduct,
  duplicateBomProduct,
} from './bomCalculatorState';

type BomSubTab = 'bom' | 'packaging' | 'variable' | 'dynamics';

interface BomCalculatorViewProps {
  workbook: BomCalculatorWorkbook;
  onChangeWorkbook: (next: BomCalculatorWorkbook) => void;
  isDark: boolean;
  isPhoneFrame: boolean;
  onPushToMarginMarkup: (modeledUnitCost: number) => void;
  onPushToBreakeven: (materialsUnitCost: number, productionUnitCost: number) => void;
}

const fmt = (val: number, decimals = 2): string => {
  const safe = Number.isFinite(val) ? (Math.abs(val) < 1e-12 ? 0 : val) : 0;
  return safe.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const fmtInt = (val: number): string => {
  const safe = Number.isFinite(val) ? Math.round(val) : 0;
  return safe.toLocaleString('en-US');
};

const VARIABLE_PRESETS: Array<{
  name: string;
  usage: number;
  usageUnit: string;
  unitRate: number;
  basis: 'per_batch' | 'per_unit';
}> = [
  { name: 'LP Gas', usage: 0.8, usageUnit: 'kg', unitRate: 28, basis: 'per_batch' },
  { name: 'Electricity', usage: 5, usageUnit: 'kWh', unitRate: 3.5, basis: 'per_batch' },
  { name: 'Generator Fuel', usage: 0.5, usageUnit: 'L', unitRate: 22, basis: 'per_batch' },
  { name: 'Water', usage: 0.1, usageUnit: 'kL', unitRate: 24, basis: 'per_batch' },
  { name: 'Oil & Cleaning', usage: 1, usageUnit: 'batch', unitRate: 8.5, basis: 'per_batch' },
];

interface BomNumFieldProps {
  value: number;
  onChange: (nextVal: number) => void;
  className: string;
  min?: number;
  max?: number;
  ariaLabel?: string;
  placeholder?: string;
}

const BomNumField: React.FC<BomNumFieldProps> = ({
  value,
  onChange,
  className,
  min = 0,
  max,
  ariaLabel,
  placeholder = '0',
}) => {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState<string>(String(value));

  useEffect(() => {
    if (!focused) {
      setDraft(Number.isFinite(value) ? String(value) : '0');
    }
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={focused ? draft : Number.isFinite(value) ? String(value) : '0'}
      onFocus={(e) => {
        setFocused(true);
        setDraft(Number.isFinite(value) ? String(value) : '');
        const el = e.currentTarget;
        requestAnimationFrame(() => el.select());
      }}
      onBlur={() => {
        setFocused(false);
        const parsed = parseFloat(draft.replace(/,/g, '').trim());
        let finalVal = Number.isFinite(parsed) ? parsed : 0;
        if (typeof min === 'number') finalVal = Math.max(min, finalVal);
        if (typeof max === 'number') finalVal = Math.min(max, finalVal);
        setDraft(String(finalVal));
        onChange(finalVal);
      }}
      onChange={(e) => {
        const raw = e.target.value.replace(/,/g, '');
        if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
          setDraft(raw);
          const parsed = parseFloat(raw);
          if (Number.isFinite(parsed)) {
            let clamped = parsed;
            if (typeof min === 'number') clamped = Math.max(min, clamped);
            if (typeof max === 'number') clamped = Math.min(max, clamped);
            onChange(clamped);
          } else if (raw === '') {
            onChange(0);
          }
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      className={className}
    />
  );
};

export const BomCalculatorView: React.FC<BomCalculatorViewProps> = ({
  workbook,
  onChangeWorkbook,
  isDark,
  isPhoneFrame,
  onPushToMarginMarkup,
  onPushToBreakeven,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<BomSubTab>('bom');
  const [expandedBomIds, setExpandedBomIds] = useState<Record<string, boolean>>({});

  const activeProduct: BomProductEntry = useMemo(() => {
    return (
      workbook.products.find((p) => p.id === workbook.activeProductId) ||
      workbook.products[0]
    );
  }, [workbook]);

  const computed = useMemo(
    () => calculateBomProductSummary(activeProduct),
    [activeProduct]
  );

  const allProductSummaries = useMemo(
    () =>
      workbook.products.map((prod) => ({
        product: prod,
        summary: calculateBomProductSummary(prod),
      })),
    [workbook.products]
  );

  // Update helpers
  const updateActiveProduct = (updater: (p: BomProductEntry) => BomProductEntry) => {
    onChangeWorkbook({
      ...workbook,
      products: workbook.products.map((p) =>
        p.id === activeProduct.id ? updater(p) : p
      ),
    });
  };

  const handleSelectProduct = (productId: string) => {
    onChangeWorkbook({
      ...workbook,
      activeProductId: productId,
    });
  };

  const handleAddProduct = () => {
    const created = createNewBomProduct(workbook.products.length + 1);
    onChangeWorkbook({
      activeProductId: created.id,
      products: [...workbook.products, created],
    });
    setActiveSubTab('bom');
  };

  const handleDuplicateProduct = () => {
    const copy = duplicateBomProduct(activeProduct);
    onChangeWorkbook({
      activeProductId: copy.id,
      products: [...workbook.products, copy],
    });
  };

  const handleDeleteProduct = (id: string) => {
    if (workbook.products.length <= 1) return;
    const remaining = workbook.products.filter((p) => p.id !== id);
    onChangeWorkbook({
      activeProductId:
        workbook.activeProductId === id ? remaining[0].id : workbook.activeProductId,
      products: remaining,
    });
  };

  // BOM handlers
  const handleAddMaterial = () => {
    const newComp: BomComponent = {
      id: `bom-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: `Ingredient ${activeProduct.bomComponents.length + 1}`,
      unitOfMeasure: 'kg',
      unitsRequiredPerBatch: 1,
      unitDivider: 1,
      packSizeUnits: 5,
      packCost: 150,
      batchConsumablesCost: 0,
      surplusWasted: false,
    };
    updateActiveProduct((p) => ({
      ...p,
      bomComponents: [...p.bomComponents, newComp],
    }));
  };

  const handleUpdateMaterial = (id: string, patch: Partial<BomComponent>) => {
    updateActiveProduct((p) => ({
      ...p,
      bomComponents: p.bomComponents.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    }));
  };

  const handleRemoveMaterial = (id: string) => {
    updateActiveProduct((p) => ({
      ...p,
      bomComponents: p.bomComponents.filter((c) => c.id !== id),
    }));
  };

  // Packaging handlers
  const handleAddPackagingLevel = () => {
    const nextIdx = activeProduct.packagingLevels.length + 1;
    const defaultName =
      nextIdx === 1
        ? 'Primary Unit Pack'
        : nextIdx === 2
        ? 'Carrier / Inner Pack'
        : nextIdx === 3
        ? 'Outer Case / Box'
        : `Level ${nextIdx} Packaging`;

    const newLevel: PackagingLevel = {
      id: `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: defaultName,
      containsCount: nextIdx === 1 ? 1 : 6,
      componentCost: nextIdx === 1 ? 1.5 : 4.5,
      wastePct: 0,
    };
    updateActiveProduct((p) => ({
      ...p,
      packagingLevels: [...p.packagingLevels, newLevel],
    }));
  };

  const handleUpdatePackaging = (id: string, patch: Partial<PackagingLevel>) => {
    updateActiveProduct((p) => ({
      ...p,
      packagingLevels: p.packagingLevels.map((l) =>
        l.id === id ? { ...l, ...patch } : l
      ),
    }));
  };

  const handleRemovePackaging = (id: string) => {
    updateActiveProduct((p) => ({
      ...p,
      packagingLevels: p.packagingLevels.filter((l) => l.id !== id),
    }));
  };

  // Variable cost handlers
  const handleAddVariableCost = (preset?: (typeof VARIABLE_PRESETS)[number]) => {
    const newItem: ProductionVariableCostItem = {
      id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: preset ? preset.name : `Variable Cost ${activeProduct.variableCosts.length + 1}`,
      basis: preset ? preset.basis : 'per_batch',
      usage: preset ? preset.usage : 1,
      usageUnit: preset ? preset.usageUnit : 'batch',
      unitRate: preset ? preset.unitRate : 10,
    };
    updateActiveProduct((p) => ({
      ...p,
      variableCosts: [...p.variableCosts, newItem],
    }));
  };

  const handleUpdateVariableCost = (
    id: string,
    patch: Partial<ProductionVariableCostItem>
  ) => {
    updateActiveProduct((p) => ({
      ...p,
      variableCosts: p.variableCosts.map((v) =>
        v.id === id ? { ...v, ...patch } : v
      ),
    }));
  };

  const handleRemoveVariableCost = (id: string) => {
    updateActiveProduct((p) => ({
      ...p,
      variableCosts: p.variableCosts.filter((v) => v.id !== id),
    }));
  };

  // Surface tokens strictly aligned with BizzCalculators palette
  const cardBg = isDark
    ? 'bg-[#101626] border-[#222F4C]'
    : 'bg-white border-[#D8CEBC] shadow-2xs';
  const softStripBg = isDark
    ? 'bg-[#0E1322] border-[#222F4C]'
    : 'bg-[#FAF8F5] border-[#D8CEBC]';
  const sectionBarBg = isDark
    ? 'bg-[#141A2E] text-slate-200 border-[#222F4C]'
    : 'bg-[#F2EDE4] text-slate-800 border-[#D8CEBC]';
  const inputCls = isDark
    ? 'bg-[#0E1322] text-white border-[#252E4A] focus:border-[#5584B4] focus:outline-none'
    : 'bg-white text-slate-900 border-[#D8CEBC] focus:border-[#2E5E88] focus:outline-none';
  const calcCls = isDark
    ? 'bg-[#161C30] text-slate-200 border-[#252E4A]'
    : 'bg-[#F4EFE6] text-slate-900 border-[#D8CEBC]';
  const emphCalcCls = isDark
    ? 'bg-[#1B233D] text-white border-[#252E4A] font-bold'
    : 'bg-[#EFE7DA] text-slate-900 border-[#D8CEBC] font-bold';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';
  const rowBorder = isDark ? 'border-[#1C2540]' : 'border-[#EAE4D8]';

  const subTabs: Array<{
    id: BomSubTab;
    num: string;
    label: string;
    metric: string;
  }> = [
    {
      id: 'bom',
      num: '01',
      label: 'bill of materials',
      metric: fmt(computed.dynamics.materialsUnitCost),
    },
    {
      id: 'packaging',
      num: '02',
      label: 'packaging',
      metric: fmt(computed.dynamics.packagingUnitCost),
    },
    {
      id: 'variable',
      num: '03',
      label: 'variable costs',
      metric: fmt(computed.dynamics.productionVariableUnitCost),
    },
    {
      id: 'dynamics',
      num: '04',
      label: 'unit cost dynamics',
      metric: `${fmt(computed.dynamics.modeledUnitCost)}/u`,
    },
  ];

  const unusedVariablePresets = VARIABLE_PRESETS.filter(
    (preset) =>
      !activeProduct.variableCosts.some((v) =>
        v.name.toLowerCase().includes(preset.name.toLowerCase())
      )
  );

  // Responsive visibility helper honoring the 480px mobile preview frame toggle
  const showMobileLayout = isPhoneFrame ? 'block' : 'lg:hidden';
  const showDesktopTable = isPhoneFrame ? 'hidden' : 'hidden lg:block';

  return (
    <div className="space-y-3.5 min-w-0 max-w-full">
      {/* ================================================================= */}
      {/* 1. PRODUCT COST BOOK BAR & ACTIVE PRODUCT BATCH PARAMETERS        */}
      {/* ================================================================= */}
      <section className={`rounded-xl border overflow-hidden ${cardBg}`}>
        {/* Product switcher strip */}
        <div
          className={`px-3 sm:px-4 py-2.5 border-b flex flex-col gap-2 ${sectionBarBg}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold lowercase tracking-wide">
              product cost book ({workbook.products.length})
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleDuplicateProduct}
                className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap lowercase ${
                  isDark
                    ? 'bg-[#101626] border-[#252E4A] text-slate-300 hover:text-white hover:border-[#5584B4]'
                    : 'bg-white border-[#D8CEBC] text-slate-600 hover:text-[#2E5E88] hover:border-[#2E5E88]'
                }`}
                title="duplicate active product"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>copy</span>
              </button>
              <button
                type="button"
                onClick={handleAddProduct}
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#2E5E88] hover:bg-[#23496B] text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap lowercase"
                title="add new product to cost book"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>add item</span>
              </button>
            </div>
          </div>

          {/* Horizontal scrollable product selector buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
            {allProductSummaries.map(({ product, summary }) => {
              const isSelected = product.id === activeProduct.id;
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelectProduct(product.id)}
                  className={`min-h-[40px] px-3 py-1.5 rounded-lg border text-left transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#2E5E88] text-white border-[#2E5E88] font-bold shadow-2xs'
                      : isDark
                      ? 'bg-[#101626] text-slate-300 border-[#252E4A] hover:border-[#5584B4]'
                      : 'bg-white text-slate-700 border-[#D8CEBC] hover:border-[#2E5E88]'
                  }`}
                >
                  <span className="text-xs max-w-[140px] truncate">{product.name}</span>
                  <span
                    className={`text-[11px] tabular-nums ${
                      isSelected ? 'text-white/85' : mutedText
                    }`}
                  >
                    {fmt(summary.dynamics.modeledUnitCost)}/u
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active product name + live headline cost + batch volume inputs */}
        <div className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                type="text"
                aria-label="product name"
                value={activeProduct.name}
                onChange={(e) =>
                  updateActiveProduct((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="product / menu item name"
                className={`min-h-[44px] flex-1 min-w-0 px-3 py-2 rounded-lg border text-sm font-bold ${inputCls}`}
              />
              {workbook.products.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(activeProduct.id)}
                  className={`min-h-[44px] min-w-[44px] rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    isDark
                      ? 'border-[#252E4A] text-slate-400 hover:text-rose-400 hover:border-rose-500/50'
                      : 'border-[#D8CEBC] text-slate-400 hover:text-rose-600 hover:border-rose-400 bg-white'
                  }`}
                  title="delete this product"
                  aria-label="delete product"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Live Modeled Unit Cost Readout */}
            <div
              className={`px-3.5 py-2 rounded-lg border flex items-center justify-between sm:justify-end gap-4 shrink-0 ${emphCalcCls}`}
            >
              <div className="text-left sm:text-right">
                <div className={`text-[10px] font-normal lowercase ${mutedText}`}>
                  {computed.dynamics.isUsingEstimatedOverride
                    ? 'modeled unit cost (override)'
                    : 'modeled unit cost'}
                </div>
                <div className="text-base sm:text-lg font-bold tabular-nums text-[#2E5E88] dark:text-[#7FB0DF]">
                  {fmt(computed.dynamics.modeledUnitCost)}
                  <span className="text-xs font-normal opacity-75"> / unit</span>
                </div>
              </div>
              <div className={`text-right pl-3 border-l ${rowBorder}`}>
                <div className={`text-[10px] font-normal lowercase ${mutedText}`}>
                  daily output
                </div>
                <div className="text-xs sm:text-sm font-bold tabular-nums">
                  {fmtInt(computed.dailyUnits)}
                  <span className="text-[10px] font-normal opacity-75"> /day</span>
                </div>
              </div>
            </div>
          </div>

          {/* Batch size & batches per day inputs (feeds BOM pack rounding & variable batch costs) */}
          <div
            className={`grid gap-2.5 p-2.5 rounded-lg border ${
              isPhoneFrame ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
            } ${softStripBg}`}
          >
            <div className="space-y-1">
              <label className={`block text-[10px] lowercase ${mutedText}`}>
                units per batch
              </label>
              <BomNumField
                ariaLabel="units per batch"
                value={activeProduct.unitsPerBatch}
                onChange={(val) =>
                  updateActiveProduct((p) => ({ ...p, unitsPerBatch: val }))
                }
                className={`w-full min-h-[42px] px-3 py-1.5 rounded-lg border text-right text-xs font-bold tabular-nums ${inputCls}`}
              />
            </div>

            <div className="space-y-1">
              <label className={`block text-[10px] lowercase ${mutedText}`}>
                batches per day
              </label>
              <BomNumField
                ariaLabel="batches per day"
                value={activeProduct.batchesPerDay}
                onChange={(val) =>
                  updateActiveProduct((p) => ({ ...p, batchesPerDay: val }))
                }
                className={`w-full min-h-[42px] px-3 py-1.5 rounded-lg border text-right text-xs font-bold tabular-nums ${inputCls}`}
              />
            </div>

            <div
              className={`space-y-1 ${
                isPhoneFrame ? 'col-span-2' : 'col-span-2 sm:col-span-1'
              }`}
            >
              <div className={`text-[10px] lowercase ${mutedText}`}>
                batch cost · daily cost
              </div>
              <div
                className={`min-h-[42px] px-3 py-1.5 rounded-lg border flex items-center justify-between text-xs tabular-nums ${calcCls}`}
              >
                <span className="font-bold">{fmt(computed.batchTotalCost)}</span>
                <span className={mutedText} aria-hidden="true">
                  ·
                </span>
                <span>{fmt(computed.dailyTotalCost)}/d</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. 4-MODULE NAVIGATION STRIP (BOM · PACKAGING · VARIABLE · DYNAMICS) */}
      {/* ================================================================= */}
      <nav
        aria-label="product costing sections"
        className={`grid gap-1.5 p-1.5 rounded-xl border ${
          isPhoneFrame ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'
        } ${cardBg}`}
      >
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`min-h-[52px] px-3 py-2 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between gap-0.5 ${
                isActive
                  ? 'bg-[#2E5E88] text-white shadow-xs'
                  : isDark
                  ? 'hover:bg-[#161E33] text-slate-300'
                  : 'hover:bg-[#F2EDE4] text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <span
                  className={`text-[10px] tabular-nums ${
                    isActive ? 'text-white/80' : mutedText
                  }`}
                >
                  {tab.num}
                </span>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    isActive
                      ? 'text-white'
                      : 'text-[#2E5E88] dark:text-[#7FB0DF]'
                  }`}
                >
                  {tab.metric}
                </span>
              </div>
              <div className="text-[11px] font-bold lowercase truncate w-full">
                {tab.label}
              </div>
            </button>
          );
        })}
      </nav>

      {/* ================================================================= */}
      {/* 3. MODULE 01 — BILL OF MATERIALS (BOM)                            */}
      {/* ================================================================= */}
      {activeSubTab === 'bom' && (
        <section className={`rounded-xl border overflow-hidden ${cardBg}`}>
          <div
            className={`px-3 sm:px-4 py-3 border-b flex items-center justify-between gap-2 ${sectionBarBg}`}
          >
            <div className="min-w-0">
              <h2 className="text-xs font-bold lowercase">
                01. bill of materials (bom)
              </h2>
              <p className={`text-[11px] mt-0.5 lowercase ${mutedText}`}>
                linked to {fmt(activeProduct.batchesPerDay, 2)} batches/day ·{' '}
                {fmtInt(computed.dailyUnits)} units/day
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddMaterial}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#23496B] text-white text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 lowercase"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>add material</span>
            </button>
          </div>

          {activeProduct.bomComponents.length === 0 ? (
            <div className={`p-6 text-center text-xs lowercase ${mutedText}`}>
              no materials added yet. tap "+ add material" to build your recipe.
            </div>
          ) : (
            <>
              {/* MOBILE / PHONE-FRAME TOUCH-OPTIMIZED MATERIAL CARDS */}
              <div className={`${showMobileLayout} divide-y ${rowBorder}`}>
                {activeProduct.bomComponents.map((comp) => {
                  const res = computed.bom.items.find((i) => i.id === comp.id);
                  const isExpanded = Boolean(expandedBomIds[comp.id]);
                  const hasAdvanced =
                    comp.unitDivider !== 1 || comp.batchConsumablesCost > 0;

                  return (
                    <div key={comp.id} className="p-3 space-y-2.5">
                      {/* Card Top Row: Name + Unit Cost + Remove */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          aria-label="material name"
                          value={comp.name}
                          onChange={(e) =>
                            handleUpdateMaterial(comp.id, { name: e.target.value })
                          }
                          placeholder="ingredient / component"
                          className={`min-h-[42px] flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border text-xs font-bold ${inputCls}`}
                        />
                        <div
                          className={`min-h-[42px] px-2.5 py-1 rounded-lg border flex flex-col justify-center items-end shrink-0 ${calcCls}`}
                        >
                          <span className="text-xs font-bold tabular-nums text-[#2E5E88] dark:text-[#7FB0DF]">
                            {fmt(res?.unitCost ?? 0)}
                          </span>
                          <span className={`text-[9px] leading-none ${mutedText}`}>
                            per unit
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(comp.id)}
                          className={`min-h-[42px] min-w-[42px] rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            isDark
                              ? 'border-[#252E4A] text-slate-400 hover:text-rose-400'
                              : 'border-[#D8CEBC] text-slate-400 hover:text-rose-600 bg-white'
                          }`}
                          aria-label={`remove ${comp.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Primary 2x2 Touch Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className={`block text-[10px] lowercase ${mutedText}`}>
                            qty / batch
                          </label>
                          <div className="flex gap-1">
                            <BomNumField
                              ariaLabel="qty per batch"
                              value={comp.unitsRequiredPerBatch}
                              onChange={(val) =>
                                handleUpdateMaterial(comp.id, {
                                  unitsRequiredPerBatch: val,
                                })
                              }
                              className={`min-h-[42px] flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border text-right text-xs tabular-nums ${inputCls}`}
                            />
                            <input
                              type="text"
                              aria-label="unit of measure"
                              value={comp.unitOfMeasure}
                              onChange={(e) =>
                                handleUpdateMaterial(comp.id, {
                                  unitOfMeasure: e.target.value,
                                })
                              }
                              className={`min-h-[42px] w-14 px-1.5 py-1.5 rounded-lg border text-center text-xs ${inputCls}`}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className={`block text-[10px] lowercase ${mutedText}`}>
                            pack size · pack cost
                          </label>
                          <div className="flex gap-1">
                            <BomNumField
                              ariaLabel="pack size"
                              value={comp.packSizeUnits}
                              onChange={(val) =>
                                handleUpdateMaterial(comp.id, {
                                  packSizeUnits: val,
                                })
                              }
                              className={`min-h-[42px] w-[42%] px-2 py-1.5 rounded-lg border text-right text-xs tabular-nums ${inputCls}`}
                            />
                            <BomNumField
                              ariaLabel="pack cost"
                              value={comp.packCost}
                              onChange={(val) =>
                                handleUpdateMaterial(comp.id, { packCost: val })
                              }
                              className={`min-h-[42px] flex-1 min-w-0 px-2 py-1.5 rounded-lg border text-right text-xs tabular-nums ${inputCls}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Compact Footer Row: Packs/Surplus + Surplus Wasted Toggle + Advanced Expander */}
                      <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px]">
                        <div className={`tabular-nums ${mutedText}`}>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {fmtInt(res?.packsRequiredPerDay ?? 0)} pk/d
                          </span>
                          <span className="mx-1" aria-hidden="true">
                            ·
                          </span>
                          <span>
                            +{fmt(res?.surplusQuantity ?? 0, 1)} {comp.unitOfMeasure}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateMaterial(comp.id, {
                                surplusWasted: !comp.surplusWasted,
                              })
                            }
                            className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                              comp.surplusWasted
                                ? 'bg-amber-600 text-white border-amber-600'
                                : isDark
                                ? 'bg-[#0E1322] border-[#252E4A] text-slate-300'
                                : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-600'
                            }`}
                          >
                            waste: {comp.surplusWasted ? 'yes' : 'no'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedBomIds((prev) => ({
                                ...prev,
                                [comp.id]: !prev[comp.id],
                              }))
                            }
                            className={`min-h-[34px] px-2 py-1 rounded-lg border text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors ${
                              isExpanded || hasAdvanced
                                ? 'border-[#2E5E88] text-[#2E5E88] dark:text-[#7FB0DF]'
                                : isDark
                                ? 'border-[#252E4A] text-slate-400'
                                : 'border-[#D8CEBC] text-slate-500'
                            }`}
                          >
                            <span>more</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Divider & Consumables */}
                      {isExpanded && (
                        <div
                          className={`grid grid-cols-2 gap-2 p-2.5 rounded-lg border ${softStripBg}`}
                        >
                          <div className="space-y-1">
                            <label className={`block text-[10px] lowercase ${mutedText}`}>
                              unit divider (conversion)
                            </label>
                            <BomNumField
                              ariaLabel="unit divider"
                              value={comp.unitDivider}
                              min={0.0001}
                              onChange={(val) =>
                                handleUpdateMaterial(comp.id, {
                                  unitDivider: val > 0 ? val : 1,
                                })
                              }
                              className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-lg border text-right text-xs tabular-nums ${inputCls}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className={`block text-[10px] lowercase ${mutedText}`}>
                              consumables / batch
                            </label>
                            <BomNumField
                              ariaLabel="batch consumables cost"
                              value={comp.batchConsumablesCost}
                              onChange={(val) =>
                                handleUpdateMaterial(comp.id, {
                                  batchConsumablesCost: val,
                                })
                              }
                              className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-lg border text-right text-xs tabular-nums ${inputCls}`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP FULL-WIDTH TABLE MATCHING BOM_b998ae81.png */}
              <div className={`${showDesktopTable} overflow-x-auto`}>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] lowercase ${sectionBarBg}`}>
                      <th className="text-left font-bold px-3 py-2.5">component / material</th>
                      <th className="text-right font-bold px-2 py-2.5 w-20">qty / batch</th>
                      <th className="text-center font-bold px-1.5 py-2.5 w-14">unit</th>
                      <th className="text-right font-bold px-2 py-2.5 w-16">divider</th>
                      <th className="text-right font-bold px-2 py-2.5 w-20">pack size</th>
                      <th className="text-right font-bold px-2 py-2.5 w-24">pack cost</th>
                      <th className="text-right font-bold px-2 py-2.5 w-24">consumables</th>
                      <th className="text-center font-bold px-2 py-2.5 w-20">wasted?</th>
                      <th className="text-right font-bold px-2 py-2.5 w-24">packs / surplus</th>
                      <th className="text-right font-bold px-3 py-2.5 w-24">unit cost</th>
                      <th className="w-10 px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${rowBorder}`}>
                    {activeProduct.bomComponents.map((comp) => {
                      const res = computed.bom.items.find((i) => i.id === comp.id);
                      return (
                        <tr key={comp.id}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              aria-label="material name"
                              value={comp.name}
                              onChange={(e) =>
                                handleUpdateMaterial(comp.id, { name: e.target.value })
                              }
                              className={`w-full px-2.5 py-1.5 rounded-md border text-xs ${inputCls}`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <BomNumField
                              ariaLabel="qty per batch"
                              value={comp.unitsRequiredPerBatch}
                              onChange={(val) =>
                                handleUpdateMaterial(comp.id, {
                                  unitsRequiredPerBatch: val,
                                })
                              }
                              className={`w-full px-2 py-1.5 rounded-md border text-right text-xs tabular-nums ${inputCls}`}
                            />
                          </td>
                          <td className="px-1.5 py-2">
                            <input
                              type="text"
                              aria-label="unit"
                              value={comp.unitOfMeasure}
                              onChange={(e) =>
                                handleUpdateMaterial(comp.id, {
                                  unitOfMeasure: e.target.value,
                                })
                              }
                              className={`w-full px-1.5 py-1.5 rounded-md border text-center text-xs ${inputCls}`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <BomNumField
                              ariaLabel="unit divider"
                              value={comp.unitDivider}
                              min={0.0001}
                              onChange={(val) =>
                                handleUpdateMaterial(comp.id, {
                                  unitDivider: val > 0 ? val : 1,
                                })
                              }
                              className={`w-full px-2 py-1.5 rounded-md border text-right text-xs tabular-nums ${inputCls}`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <BomNumField
                              ariaLabel="pack size"
                              value={comp.packSizeUnits}
                              onChange={(val) =>
                                handleUpdateMaterial(comp.id, { packSizeUnits: val })
                              }
                              className={`w-full px-2 py-1.5 rounded-md border text-right text-xs tabular-nums ${inputCls}`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <BomNumField
                              ariaLabel="pack cost"
                              value={comp.packCost}
                              onChange={(val) =>
                                handleUpdateMaterial(comp.id, { packCost: val })
                              }
                              className={`w-full px-2 py-1.5 rounded-md border text-right text-xs tabular-nums ${inputCls}`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <BomNumField
                              ariaLabel="batch consumables"
                              value={comp.batchConsumablesCost}
                              onChange={(val) =>
                                handleUpdateMaterial(comp.id, {
                                  batchConsumablesCost: val,
                                })
                              }
                              className={`w-full px-2 py-1.5 rounded-md border text-right text-xs tabular-nums ${inputCls}`}
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateMaterial(comp.id, {
                                  surplusWasted: !comp.surplusWasted,
                                })
                              }
                              className={`px-2.5 py-1 rounded-md border text-[11px] font-bold transition-colors cursor-pointer ${
                                comp.surplusWasted
                                  ? 'bg-amber-600 text-white border-amber-600'
                                  : isDark
                                  ? 'bg-[#0E1322] border-[#252E4A] text-slate-300'
                                  : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-600'
                              }`}
                            >
                              {comp.surplusWasted ? 'Yes' : 'No'}
                            </button>
                          </td>
                          <td className="px-2 py-2 text-right tabular-nums">
                            <div className="font-bold">
                              {fmtInt(res?.packsRequiredPerDay ?? 0)} pk/d
                            </div>
                            <div className={`text-[10px] ${mutedText}`}>
                              +{fmt(res?.surplusQuantity ?? 0, 1)} {comp.unitOfMeasure}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-bold tabular-nums text-[#2E5E88] dark:text-[#7FB0DF]">
                            {fmt(res?.unitCost ?? 0)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterial(comp.id)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                              aria-label={`remove ${comp.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* BOM Totals Footer */}
          <div
            className={`px-3 sm:px-4 py-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${emphCalcCls}`}
          >
            <div className={`tabular-nums font-normal ${mutedText}`}>
              daily: <strong className="text-slate-800 dark:text-slate-100">{fmt(computed.bom.totalDailyMaterialsCost)}</strong>
              <span className="mx-1.5" aria-hidden="true">·</span>
              batch: <strong className="text-slate-800 dark:text-slate-100">{fmt(computed.bom.totalBatchMaterialsCost)}</strong>
            </div>
            <div className="flex items-center gap-2 tabular-nums">
              <span className={`text-[11px] font-normal lowercase ${mutedText}`}>
                materials unit cost
              </span>
              <span className="text-sm font-bold text-[#2E5E88] dark:text-[#7FB0DF]">
                {fmt(computed.bom.totalMaterialsUnitCost)}
              </span>
            </div>
          </div>

          <div className={`px-3 sm:px-4 py-2.5 border-t text-[10px] leading-relaxed ${softStripBg} ${mutedText}`}>
            * When surplus wasted = yes, full rounded purchase packs are absorbed into daily unit cost. When no, unused partial-pack surplus carries forward into stock.
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* 4. MODULE 02 — MULTI-LEVEL PACKAGING COSTS                        */}
      {/* ================================================================= */}
      {activeSubTab === 'packaging' && (
        <section className={`rounded-xl border overflow-hidden ${cardBg}`}>
          <div
            className={`px-3 sm:px-4 py-3 border-b flex items-center justify-between gap-2 ${sectionBarBg}`}
          >
            <div className="min-w-0">
              <h2 className="text-xs font-bold lowercase">
                02. packaging costs (multi-level)
              </h2>
              <p className={`text-[11px] mt-0.5 lowercase ${mutedText}`}>
                supports 1, 2, 3+ cascading levels (wrap, box, carrier bag, case)
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddPackagingLevel}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#23496B] text-white text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 lowercase"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>add level</span>
            </button>
          </div>

          {activeProduct.packagingLevels.length === 0 ? (
            <div className={`p-6 text-center text-xs lowercase ${mutedText}`}>
              no packaging levels added. tap "+ add level" to include wrappers, containers, or bags.
            </div>
          ) : (
            <div className={`divide-y ${rowBorder}`}>
              {activeProduct.packagingLevels.map((lvl, idx) => {
                const res = computed.packaging.levels.find((l) => l.id === lvl.id);
                return (
                  <div key={lvl.id} className="p-3 sm:p-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold tabular-nums uppercase shrink-0 ${mutedText}`}
                      >
                        L{idx + 1}
                      </span>
                      <input
                        type="text"
                        aria-label="packaging level name"
                        value={lvl.name}
                        onChange={(e) =>
                          handleUpdatePackaging(lvl.id, { name: e.target.value })
                        }
                        className={`min-h-[42px] flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border text-xs font-bold ${inputCls}`}
                      />
                      <div
                        className={`min-h-[42px] px-2.5 py-1 rounded-lg border flex flex-col justify-center items-end shrink-0 ${calcCls}`}
                      >
                        <span className="text-xs font-bold tabular-nums text-[#2E5E88] dark:text-[#7FB0DF]">
                          {fmt(res?.unitCostContribution ?? 0)}
                        </span>
                        <span className={`text-[9px] leading-none ${mutedText}`}>
                          per unit
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePackaging(lvl.id)}
                        className={`min-h-[42px] min-w-[42px] rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          isDark
                            ? 'border-[#252E4A] text-slate-400 hover:text-rose-400'
                            : 'border-[#D8CEBC] text-slate-400 hover:text-rose-600 bg-white'
                        }`}
                        aria-label={`remove ${lvl.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div
                      className={`grid gap-2 ${
                        isPhoneFrame ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-4'
                      }`}
                    >
                      <div className="space-y-1">
                        <label className={`block text-[10px] lowercase ${mutedText}`}>
                          {idx === 0 ? 'units / pack' : `L${idx} packs in L${idx + 1}`}
                        </label>
                        <BomNumField
                          ariaLabel="contains count"
                          value={lvl.containsCount}
                          min={1}
                          onChange={(val) =>
                            handleUpdatePackaging(lvl.id, {
                              containsCount: Math.max(1, val),
                            })
                          }
                          className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-lg border text-right text-xs tabular-nums ${inputCls}`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-[10px] lowercase ${mutedText}`}>
                          pack cost
                        </label>
                        <BomNumField
                          ariaLabel="packaging cost"
                          value={lvl.componentCost}
                          onChange={(val) =>
                            handleUpdatePackaging(lvl.id, { componentCost: val })
                          }
                          className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-lg border text-right text-xs tabular-nums ${inputCls}`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-[10px] lowercase ${mutedText}`}>
                          waste %
                        </label>
                        <BomNumField
                          ariaLabel="packaging waste percent"
                          value={lvl.wastePct ?? 0}
                          max={100}
                          onChange={(val) =>
                            handleUpdatePackaging(lvl.id, { wastePct: val })
                          }
                          className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-lg border text-right text-xs tabular-nums ${inputCls}`}
                        />
                      </div>

                      <div
                        className={`space-y-1 ${
                          isPhoneFrame ? 'col-span-3' : 'col-span-3 sm:col-span-1'
                        }`}
                      >
                        <div className={`text-[10px] lowercase ${mutedText}`}>
                          cumulative units
                        </div>
                        <div
                          className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border flex items-center justify-end text-xs font-bold tabular-nums ${calcCls}`}
                        >
                          {fmtInt(res?.cumulativeUnitsPacked ?? 1)} u / pack
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Packaging Totals Footer */}
          <div
            className={`px-3 sm:px-4 py-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${emphCalcCls}`}
          >
            <div className={`tabular-nums font-normal ${mutedText}`}>
              top pack holds{' '}
              <strong className="text-slate-800 dark:text-slate-100">
                {fmtInt(computed.packaging.topLevelUnitsPacked)} units
              </strong>
            </div>
            <div className="flex items-center gap-2 tabular-nums">
              <span className={`text-[11px] font-normal lowercase ${mutedText}`}>
                packaging unit cost
              </span>
              <span className="text-sm font-bold text-[#2E5E88] dark:text-[#7FB0DF]">
                {fmt(computed.packaging.totalPackagingUnitCost)}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* 5. MODULE 03 — PRODUCTION VARIABLE COSTS                          */}
      {/* ================================================================= */}
      {activeSubTab === 'variable' && (
        <section className={`rounded-xl border overflow-hidden ${cardBg}`}>
          <div
            className={`px-3 sm:px-4 py-3 border-b flex items-center justify-between gap-2 ${sectionBarBg}`}
          >
            <div className="min-w-0">
              <h2 className="text-xs font-bold lowercase">
                03. production variable costs
              </h2>
              <p className={`text-[11px] mt-0.5 lowercase ${mutedText}`}>
                per-batch costs divide across {fmtInt(computed.variableCosts.referenceBatchUnits)} units/batch
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAddVariableCost()}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#23496B] text-white text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 lowercase"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>add cost</span>
            </button>
          </div>

          {/* Quick-add presets strip */}
          {unusedVariablePresets.length > 0 && (
            <div
              className={`px-3 sm:px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto ${softStripBg}`}
            >
              <span className={`text-[10px] shrink-0 lowercase ${mutedText}`}>
                quick add:
              </span>
              {unusedVariablePresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleAddVariableCost(preset)}
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-[#101626] border-[#252E4A] text-slate-300 hover:border-[#5584B4]'
                      : 'bg-white border-[#D8CEBC] text-slate-600 hover:border-[#2E5E88] hover:text-[#2E5E88]'
                  }`}
                >
                  + {preset.name.toLowerCase()}
                </button>
              ))}
            </div>
          )}

          {activeProduct.variableCosts.length === 0 ? (
            <div className={`p-6 text-center text-xs lowercase ${mutedText}`}>
              no variable costs added. add gas, generator fuel, power, or oil above.
            </div>
          ) : (
            <div className={`divide-y ${rowBorder}`}>
              {activeProduct.variableCosts.map((item) => {
                const res = computed.variableCosts.items.find((i) => i.id === item.id);
                return (
                  <div key={item.id} className="p-3 sm:p-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        aria-label="variable cost name"
                        value={item.name}
                        onChange={(e) =>
                          handleUpdateVariableCost(item.id, { name: e.target.value })
                        }
                        className={`min-h-[42px] flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border text-xs font-bold ${inputCls}`}
                      />
                      <div
                        className={`min-h-[42px] px-2.5 py-1 rounded-lg border flex flex-col justify-center items-end shrink-0 ${calcCls}`}
                      >
                        <span className="text-xs font-bold tabular-nums text-[#2E5E88] dark:text-[#7FB0DF]">
                          {fmt(res?.unitCost ?? 0)}
                        </span>
                        <span className={`text-[9px] leading-none ${mutedText}`}>
                          per unit
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariableCost(item.id)}
                        className={`min-h-[42px] min-w-[42px] rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          isDark
                            ? 'border-[#252E4A] text-slate-400 hover:text-rose-400'
                            : 'border-[#D8CEBC] text-slate-400 hover:text-rose-600 bg-white'
                        }`}
                        aria-label={`remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div
                      className={`grid gap-2 ${
                        isPhoneFrame ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'
                      }`}
                    >
                      {/* Basis toggle */}
                      <div className="space-y-1">
                        <div className={`text-[10px] lowercase ${mutedText}`}>basis</div>
                        <div
                          className={`grid grid-cols-2 p-0.5 rounded-lg border min-h-[40px] ${softStripBg}`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateVariableCost(item.id, { basis: 'per_batch' })
                            }
                            className={`rounded-md text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                              item.basis === 'per_batch'
                                ? 'bg-[#2E5E88] text-white'
                                : mutedText
                            }`}
                          >
                            batch
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateVariableCost(item.id, { basis: 'per_unit' })
                            }
                            className={`rounded-md text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                              item.basis === 'per_unit'
                                ? 'bg-[#2E5E88] text-white'
                                : mutedText
                            }`}
                          >
                            unit
                          </button>
                        </div>
                      </div>

                      {/* Usage + unit */}
                      <div className="space-y-1">
                        <label className={`block text-[10px] lowercase ${mutedText}`}>
                          usage · unit
                        </label>
                        <div className="flex gap-1">
                          <BomNumField
                            ariaLabel="variable cost usage"
                            value={item.usage}
                            onChange={(val) =>
                              handleUpdateVariableCost(item.id, { usage: val })
                            }
                            className={`min-h-[40px] flex-1 min-w-0 px-2 py-1.5 rounded-lg border text-right text-xs tabular-nums ${inputCls}`}
                          />
                          <input
                            type="text"
                            aria-label="usage unit"
                            value={item.usageUnit}
                            onChange={(e) =>
                              handleUpdateVariableCost(item.id, {
                                usageUnit: e.target.value,
                              })
                            }
                            className={`min-h-[40px] w-14 px-1.5 py-1.5 rounded-lg border text-center text-xs ${inputCls}`}
                          />
                        </div>
                      </div>

                      {/* Unit rate */}
                      <div className="space-y-1">
                        <label className={`block text-[10px] lowercase ${mutedText}`}>
                          rate / {item.usageUnit || 'unit'}
                        </label>
                        <BomNumField
                          ariaLabel="unit rate"
                          value={item.unitRate}
                          onChange={(val) =>
                            handleUpdateVariableCost(item.id, { unitRate: val })
                          }
                          className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-lg border text-right text-xs tabular-nums ${inputCls}`}
                        />
                      </div>

                      {/* Batch cost */}
                      <div className="space-y-1">
                        <div className={`text-[10px] lowercase ${mutedText}`}>
                          batch cost
                        </div>
                        <div
                          className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border flex items-center justify-end text-xs font-bold tabular-nums ${calcCls}`}
                        >
                          {fmt(res?.batchCost ?? 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Variable Totals Footer */}
          <div
            className={`px-3 sm:px-4 py-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${emphCalcCls}`}
          >
            <div className={`tabular-nums font-normal ${mutedText}`}>
              batch variable:{' '}
              <strong className="text-slate-800 dark:text-slate-100">
                {fmt(computed.variableCosts.totalBatchVariableCost)}
              </strong>
            </div>
            <div className="flex items-center gap-2 tabular-nums">
              <span className={`text-[11px] font-normal lowercase ${mutedText}`}>
                variable unit cost
              </span>
              <span className="text-sm font-bold text-[#2E5E88] dark:text-[#7FB0DF]">
                {fmt(computed.variableCosts.totalVariableUnitCost)}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* 6. MODULE 04 — UNIT COST DYNAMICS & SUITE HANDOFF                 */}
      {/* ================================================================= */}
      {activeSubTab === 'dynamics' && (
        <div className="space-y-3.5">
          <section className={`rounded-xl border overflow-hidden ${cardBg}`}>
            <div className={`px-3 sm:px-4 py-3 border-b ${sectionBarBg}`}>
              <h2 className="text-xs font-bold lowercase">
                04. unit cost dynamics · {activeProduct.name.toLowerCase()}
              </h2>
              <p className={`text-[11px] mt-0.5 lowercase ${mutedText}`}>
                complete product cost summary ready for pricing or breakeven analysis
              </p>
            </div>

            {/* Stacked Cost Composition Bar */}
            <div className={`px-3 sm:px-4 py-3 border-b space-y-2 ${softStripBg}`}>
              <div className="h-3 w-full rounded-full overflow-hidden flex bg-[#E8E2D8] dark:bg-[#1C2540]">
                {computed.dynamics.materialsSharePct > 0 && (
                  <div
                    className="h-full bg-[#2E5E88]"
                    style={{ width: `${computed.dynamics.materialsSharePct}%` }}
                  />
                )}
                {computed.dynamics.packagingSharePct > 0 && (
                  <div
                    className="h-full bg-amber-600"
                    style={{ width: `${computed.dynamics.packagingSharePct}%` }}
                  />
                )}
                {computed.dynamics.variableSharePct > 0 && (
                  <div
                    className="h-full bg-emerald-600"
                    style={{ width: `${computed.dynamics.variableSharePct}%` }}
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] tabular-nums">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#2E5E88] inline-block" />
                  <span>materials {fmt(computed.dynamics.materialsSharePct, 1)}%</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-600 inline-block" />
                  <span>packaging {fmt(computed.dynamics.packagingSharePct, 1)}%</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
                  <span>variable {fmt(computed.dynamics.variableSharePct, 1)}%</span>
                </span>
              </div>
            </div>

            {/* Authentic BizzCalculators 60/40 Worksheet Summary Rows */}
            <div className={`divide-y ${rowBorder}`}>
              <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 text-xs">
                <span className="lowercase text-slate-600 dark:text-slate-300">
                  materials unit cost (bom)
                </span>
                <div
                  className={`w-[42%] max-w-[175px] px-3 py-1.5 rounded-md border text-right tabular-nums ${calcCls}`}
                >
                  {fmt(computed.dynamics.materialsUnitCost)}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 text-xs">
                <span className="lowercase text-slate-600 dark:text-slate-300">
                  packaging unit cost
                </span>
                <div
                  className={`w-[42%] max-w-[175px] px-3 py-1.5 rounded-md border text-right tabular-nums ${calcCls}`}
                >
                  {fmt(computed.dynamics.packagingUnitCost)}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 text-xs">
                <span className="lowercase text-slate-600 dark:text-slate-300">
                  production variable unit cost
                </span>
                <div
                  className={`w-[42%] max-w-[175px] px-3 py-1.5 rounded-md border text-right tabular-nums ${calcCls}`}
                >
                  {fmt(computed.dynamics.productionVariableUnitCost)}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 text-xs">
                <span className="font-bold lowercase text-slate-900 dark:text-white">
                  calculated unit cost
                </span>
                <div
                  className={`w-[42%] max-w-[175px] px-3 py-1.5 rounded-md border text-right tabular-nums ${emphCalcCls}`}
                >
                  {fmt(computed.dynamics.calculatedUnitCost)}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 text-xs">
                <div className="min-w-0 pr-1">
                  <div className="lowercase text-slate-700 dark:text-slate-200">
                    estimated unit cost override
                  </div>
                  <div className={`text-[10px] lowercase ${mutedText}`}>
                    leave 0 to use calculated cost
                  </div>
                </div>
                <div className="w-[42%] max-w-[175px] shrink-0">
                  <BomNumField
                    ariaLabel="estimated unit cost override"
                    value={activeProduct.dynamicsOverrides.estimatedUnitCost}
                    onChange={(val) =>
                      updateActiveProduct((p) => ({
                        ...p,
                        dynamicsOverrides: {
                          ...p.dynamicsOverrides,
                          estimatedUnitCost: val,
                        },
                      }))
                    }
                    className={`w-full min-h-[38px] px-3 py-1.5 rounded-md border text-right text-xs tabular-nums ${inputCls}`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 text-xs">
                <span className="font-bold lowercase text-[#2E5E88] dark:text-[#7FB0DF]">
                  modeled unit cost (active)
                </span>
                <div
                  className={`w-[42%] max-w-[175px] px-3 py-1.5 rounded-md border text-right text-sm font-bold tabular-nums text-[#2E5E88] dark:text-[#7FB0DF] ${emphCalcCls}`}
                >
                  {fmt(computed.dynamics.modeledUnitCost)}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 text-xs">
                <span className="lowercase text-slate-600 dark:text-slate-300">
                  total batch cost ({fmtInt(activeProduct.unitsPerBatch)} units)
                </span>
                <div
                  className={`w-[42%] max-w-[175px] px-3 py-1.5 rounded-md border text-right tabular-nums ${calcCls}`}
                >
                  {fmt(computed.batchTotalCost)}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 text-xs">
                <span className="lowercase text-slate-600 dark:text-slate-300">
                  total daily cost ({fmtInt(computed.dailyUnits)} units)
                </span>
                <div
                  className={`w-[42%] max-w-[175px] px-3 py-1.5 rounded-md border text-right tabular-nums ${calcCls}`}
                >
                  {fmt(computed.dailyTotalCost)}
                </div>
              </div>
            </div>

            {/* One-tap integration into Margin vs Markup & Breakeven Point */}
            <div
              className={`p-3 sm:p-4 border-t grid gap-2 ${
                isPhoneFrame ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
              } ${softStripBg}`}
            >
              <button
                type="button"
                onClick={() => onPushToMarginMarkup(computed.dynamics.modeledUnitCost)}
                className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[#2E5E88] hover:bg-[#23496B] text-white text-xs font-bold inline-flex items-center justify-between gap-2 transition-colors cursor-pointer lowercase"
              >
                <span>set selling price (margin vs markup)</span>
                <ArrowUpRight className="h-4 w-4 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() =>
                  onPushToBreakeven(
                    computed.dynamics.materialsUnitCost,
                    computed.dynamics.packagingUnitCost +
                      computed.dynamics.productionVariableUnitCost
                  )
                }
                className={`min-h-[44px] px-3.5 py-2 rounded-lg border text-xs font-bold inline-flex items-center justify-between gap-2 transition-colors cursor-pointer lowercase ${
                  isDark
                    ? 'bg-[#101626] border-[#252E4A] text-slate-200 hover:border-[#5584B4]'
                    : 'bg-white border-[#D8CEBC] text-slate-800 hover:border-[#2E5E88] hover:text-[#2E5E88]'
                }`}
              >
                <span>send costs to breakeven point</span>
                <ArrowUpRight className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </section>

          {/* All Saved Products Cost Book Comparison */}
          <section className={`rounded-xl border overflow-hidden ${cardBg}`}>
            <div className={`px-3 sm:px-4 py-2.5 border-b ${sectionBarBg}`}>
              <h3 className="text-[11px] font-bold lowercase">
                all saved menu / product unit costs
              </h3>
            </div>
            <div className={`divide-y ${rowBorder}`}>
              {allProductSummaries.map(({ product, summary }) => {
                const isCurrent = product.id === activeProduct.id;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectProduct(product.id)}
                    className={`w-full text-left px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isCurrent
                        ? isDark
                          ? 'bg-[#162038]'
                          : 'bg-[#F4EFE6]'
                        : isDark
                        ? 'hover:bg-[#141B2F]'
                        : 'hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate text-slate-900 dark:text-white">
                        {product.name}
                      </div>
                      <div className={`text-[10px] tabular-nums mt-0.5 ${mutedText}`}>
                        mat {fmt(summary.dynamics.materialsUnitCost)} · pkg{' '}
                        {fmt(summary.dynamics.packagingUnitCost)} · var{' '}
                        {fmt(summary.dynamics.productionVariableUnitCost)} ·{' '}
                        {fmtInt(summary.dailyUnits)}/day
                      </div>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <div className="text-xs font-bold text-[#2E5E88] dark:text-[#7FB0DF]">
                        {fmt(summary.dynamics.modeledUnitCost)}/u
                      </div>
                      <div className={`text-[10px] ${mutedText}`}>
                        {isCurrent ? 'active' : 'edit'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ================================================================= */}
      {/* 7. STEP-BY-STEP PREV / NEXT FOOTER CONTROLS                       */}
      {/* ================================================================= */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {activeSubTab === 'bom' ? (
          <div />
        ) : (
          <button
            type="button"
            onClick={() => {
              const order: BomSubTab[] = ['bom', 'packaging', 'variable', 'dynamics'];
              const idx = order.indexOf(activeSubTab);
              if (idx > 0) setActiveSubTab(order[idx - 1]);
            }}
            className={`min-h-[42px] px-3.5 py-2 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer lowercase ${
              isDark
                ? 'bg-[#101626] border-[#252E4A] text-slate-200 hover:border-[#5584B4]'
                : 'bg-white border-[#D8CEBC] text-slate-700 hover:border-[#2E5E88]'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>
              {activeSubTab === 'packaging'
                ? '01. bom'
                : activeSubTab === 'variable'
                ? '02. packaging'
                : '03. variable costs'}
            </span>
          </button>
        )}

        {activeSubTab !== 'dynamics' && (
          <button
            type="button"
            onClick={() => {
              const order: BomSubTab[] = ['bom', 'packaging', 'variable', 'dynamics'];
              const idx = order.indexOf(activeSubTab);
              if (idx < order.length - 1) setActiveSubTab(order[idx + 1]);
            }}
            className="min-h-[42px] px-4 py-2 rounded-lg bg-[#2E5E88] hover:bg-[#23496B] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer lowercase"
          >
            <span>
              next:{' '}
              {activeSubTab === 'bom'
                ? '02. packaging'
                : activeSubTab === 'packaging'
                ? '03. variable costs'
                : '04. unit cost dynamics'}
            </span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default BomCalculatorView;
