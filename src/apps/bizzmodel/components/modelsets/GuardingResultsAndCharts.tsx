import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sliders,
  BarChart2,
  Shield,
  Users,
  Layers,
} from 'lucide-react';
import { RevenueItem } from '../../constants';
import { AssumptionRateItem } from '../../../bizzdynamics/types';
import { BaseRateAdjustmentTool } from '../../../bizzdynamics/components/BaseRateAdjustmentTool';
import {
  calculateGuardingProductYearGrid,
  createDefaultGuardingConfig,
  getGuardingWorkstreamsSeries60,
  getGuardingSellingPriceSeries60,
  getGuardingUnitCostSeries60,
} from './guardingEngine';

type GuardingAdjustableKey =
  | 'workstreams'
  | 'guardSellingPrice'
  | 'unitCostPerGuard'
  | 'commissionOnSalesPct'
  | 'otherIncome';

const GUARDING_ADJUSTABLE_META: Array<{
  key: GuardingAdjustableKey;
  name: string;
  description: string;
  unit: '%' | 'currency' | 'number';
  changeType: 'percentage' | 'value';
}> = [
  {
    key: 'workstreams',
    name: 'workstreams (active sites)',
    description:
      'active guarded sites/workstreams contracted each month — adjust via ADJUSTMENT SLIDER to model client contract growth',
    unit: 'number',
    changeType: 'value',
  },
  {
    key: 'guardSellingPrice',
    name: 'guard selling price (R / guard / mo)',
    description:
      'monthly client billing rate per guard changed by ADJUSTMENT SLIDER across the 60-month forecast',
    unit: 'currency',
    changeType: 'percentage',
  },
  {
    key: 'unitCostPerGuard',
    name: 'unit cost per guard (R / guard / mo)',
    description:
      'direct monthly employment cost per guard (Variable COS) escalated via ADJUSTMENT SLIDER for annual wage reviews',
    unit: 'currency',
    changeType: 'percentage',
  },
  {
    key: 'commissionOnSalesPct',
    name: 'commission on sales %',
    description:
      'sales commission percentage of revenue transferred to gross profit adjustments via ADJUSTMENT SLIDER',
    unit: '%',
    changeType: 'percentage',
  },
  {
    key: 'otherIncome',
    name: 'other income',
    description:
      'monthly ancillary other income changed by ADJUSTMENT SLIDER - % adjustment over previous month',
    unit: 'currency',
    changeType: 'percentage',
  },
];

interface GuardingResultsViewProps {
  theme?: 'light' | 'dark';
  products: RevenueItem[];
  activeProductIdx: number;
  onSelectProductIdx: (idx: number) => void;
  activeYear: number;
  onSelectYear: (yr: number) => void;
  daysWorked60: number[];
  onUpdateProduct: (idx: number, patch: Partial<RevenueItem>) => void;
  onGoToAssumptions: () => void;
}

export const GuardingResultsView: React.FC<GuardingResultsViewProps> = ({
  theme = 'light',
  products,
  activeProductIdx,
  onSelectProductIdx,
  activeYear,
  onSelectYear,
  daysWorked60,
  onUpdateProduct,
  onGoToAssumptions,
}) => {
  const isDark = theme === 'dark';
  const [selectedKey, setSelectedKey] =
    useState<GuardingAdjustableKey>('workstreams');

  const safeIdx = Math.min(activeProductIdx, Math.max(0, products.length - 1));
  const currentProduct = products[safeIdx];

  const grid = useMemo(() => {
    if (!currentProduct) return null;
    return calculateGuardingProductYearGrid(
      currentProduct,
      daysWorked60,
      activeYear
    );
  }, [currentProduct, daysWorked60, activeYear]);

  const activeSliderItem: AssumptionRateItem | null = useMemo(() => {
    if (!currentProduct) return null;
    const cfg = currentProduct.guardingConfig || createDefaultGuardingConfig();
    const meta =
      GUARDING_ADJUSTABLE_META.find((m) => m.key === selectedKey) ||
      GUARDING_ADJUSTABLE_META[0];

    let arr: number[] = [];
    let baseVal = 0;

    if (selectedKey === 'workstreams') {
      arr = getGuardingWorkstreamsSeries60(currentProduct);
      baseVal = cfg.workstreamsBase ?? 20;
    } else if (selectedKey === 'guardSellingPrice') {
      arr = getGuardingSellingPriceSeries60(currentProduct);
      baseVal = cfg.guardSellingPriceBase ?? 12000;
    } else if (selectedKey === 'unitCostPerGuard') {
      arr = getGuardingUnitCostSeries60(currentProduct);
      baseVal = cfg.unitCostPerGuardBase ?? 7500;
    } else if (selectedKey === 'commissionOnSalesPct') {
      arr =
        currentProduct.salesCommissionPctMonthly &&
        currentProduct.salesCommissionPctMonthly.length >= 60
          ? currentProduct.salesCommissionPctMonthly.slice(0, 60)
          : new Array(60).fill(cfg.commissionOnSalesPct ?? 1.0);
      baseVal = cfg.commissionOnSalesPct ?? 1.0;
    } else {
      arr =
        currentProduct.otherIncomeMonthly &&
        currentProduct.otherIncomeMonthly.length >= 60
          ? currentProduct.otherIncomeMonthly.slice(0, 60)
          : new Array(60).fill(cfg.otherIncomeMonthlyBase ?? 2000);
      baseVal = cfg.otherIncomeMonthlyBase ?? 2000;
    }

    return {
      id: `grd-${currentProduct.id}-${selectedKey}`,
      stepId: 2,
      stepName: 'Revenue',
      name: `${currentProduct.name} — ${meta.name}`,
      description: meta.description,
      baseRate: baseVal,
      unit: meta.unit,
      changeType: meta.changeType,
      monthlyValues: arr,
    };
  }, [currentProduct, selectedKey]);

  const handleSliderUpdateMonthlyValues = (
    _itemId: string,
    newMonthlyValues: number[]
  ) => {
    if (!currentProduct) return;
    const cfg = currentProduct.guardingConfig || createDefaultGuardingConfig();
    const arr60 =
      newMonthlyValues.length >= 60
        ? newMonthlyValues.slice(0, 60)
        : [
            ...newMonthlyValues,
            ...new Array(Math.max(0, 60 - newMonthlyValues.length)).fill(
              newMonthlyValues[newMonthlyValues.length - 1] ?? 0
            ),
          ];

    if (selectedKey === 'workstreams') {
      const clamped = arr60.map((v) => Math.max(0, Number(v.toFixed(2))));
      onUpdateProduct(safeIdx, {
        guardingConfig: {
          ...cfg,
          workstreamsBase: clamped[0],
          workstreamsMonthly: clamped,
        },
      });
    } else if (selectedKey === 'guardSellingPrice') {
      const clamped = arr60.map((v) => Math.max(0, Number(v.toFixed(2))));
      onUpdateProduct(safeIdx, {
        unitPrice: clamped[0],
        guardingConfig: {
          ...cfg,
          guardSellingPriceBase: clamped[0],
          guardSellingPriceMonthly: clamped,
        },
      });
    } else if (selectedKey === 'unitCostPerGuard') {
      const clamped = arr60.map((v) => Math.max(0, Number(v.toFixed(2))));
      onUpdateProduct(safeIdx, {
        unitCost: clamped[0],
        guardingConfig: {
          ...cfg,
          unitCostPerGuardBase: clamped[0],
          unitCostPerGuardMonthly: clamped,
        },
      });
    } else if (selectedKey === 'commissionOnSalesPct') {
      const clamped = arr60.map((v) =>
        Math.max(0, Math.min(100, Number(v.toFixed(2))))
      );
      onUpdateProduct(safeIdx, {
        salesCommissionPctMonthly: clamped,
        guardingConfig: {
          ...cfg,
          commissionOnSalesPct: clamped[0],
        },
      });
    } else {
      const rounded = arr60.map((v) => Math.round(v));
      onUpdateProduct(safeIdx, {
        otherIncomeMonthly: rounded,
        guardingConfig: {
          ...cfg,
          otherIncomeMonthlyBase: rounded[0],
        },
      });
    }
  };

  const handleSliderUpdateBaseRate = (_itemId: string, newBase: number) => {
    if (!currentProduct) return;
    const cfg = currentProduct.guardingConfig || createDefaultGuardingConfig();

    if (selectedKey === 'workstreams') {
      const safe = Math.max(0, Number(newBase.toFixed(2)));
      onUpdateProduct(safeIdx, {
        guardingConfig: {
          ...cfg,
          workstreamsBase: safe,
          workstreamsMonthly: new Array(60).fill(safe),
        },
      });
    } else if (selectedKey === 'guardSellingPrice') {
      const safe = Math.max(0, Number(newBase.toFixed(2)));
      onUpdateProduct(safeIdx, {
        unitPrice: safe,
        guardingConfig: {
          ...cfg,
          guardSellingPriceBase: safe,
          guardSellingPriceMonthly: new Array(60).fill(safe),
        },
      });
    } else if (selectedKey === 'unitCostPerGuard') {
      const safe = Math.max(0, Number(newBase.toFixed(2)));
      onUpdateProduct(safeIdx, {
        unitCost: safe,
        guardingConfig: {
          ...cfg,
          unitCostPerGuardBase: safe,
          unitCostPerGuardMonthly: new Array(60).fill(safe),
        },
      });
    } else if (selectedKey === 'commissionOnSalesPct') {
      const safe = Math.max(0, Math.min(100, Number(newBase.toFixed(2))));
      onUpdateProduct(safeIdx, {
        salesCommissionPctMonthly: new Array(60).fill(safe),
        guardingConfig: {
          ...cfg,
          commissionOnSalesPct: safe,
        },
      });
    } else {
      const safe = Math.round(newBase);
      onUpdateProduct(safeIdx, {
        otherIncomeMonthly: new Array(60).fill(safe),
        guardingConfig: {
          ...cfg,
          otherIncomeMonthlyBase: safe,
        },
      });
    }
  };

  const handleCycleSlider = (dir: 'prev' | 'next') => {
    const idx = GUARDING_ADJUSTABLE_META.findIndex((m) => m.key === selectedKey);
    const nextIdx =
      dir === 'prev'
        ? (idx - 1 + GUARDING_ADJUSTABLE_META.length) %
          GUARDING_ADJUSTABLE_META.length
        : (idx + 1) % GUARDING_ADJUSTABLE_META.length;
    setSelectedKey(GUARDING_ADJUSTABLE_META[nextIdx].key);
  };

  if (!currentProduct || !grid) return null;

  const fmtInt = (n: number) => Math.round(n).toLocaleString('en-ZA');
  const fmtCur = (n: number) =>
    n.toLocaleString('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  const fmtDec = (n: number) =>
    n.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const guardLabel = grid.guardLabel;
  const siteLabel = grid.siteLabel;
  const guardSingular = guardLabel.replace(/s$/, '');
  const siteSingular = siteLabel.replace(/s$/, '');

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Main Guarding Results Card */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
          isDark
            ? 'bg-[#101626] border-[#222F4C]'
            : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                SERVICES: GUARDING — RESULTS
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Select any radio button on the right to load and adjust that driver in the ADJUSTMENT SLIDER below.
              </p>
            </div>

            {/* Service Stream Selector */}
            <select
              value={safeIdx}
              onChange={(e) => onSelectProductIdx(Number(e.target.value))}
              className={`py-1.5 px-3 rounded-xl border text-xs font-bold lowercase cursor-pointer ${
                isDark
                  ? 'bg-[#0E1322] border-[#222F4C] text-white'
                  : 'bg-white border-[#D8CEBC] text-slate-900 shadow-2xs'
              }`}
            >
              {products.map((prod, idx) => (
                <option key={prod.id} value={idx}>
                  {prod.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0E1322] border border-slate-200 dark:border-[#222F4C]">
              <button
                type="button"
                disabled={activeYear <= 1}
                onClick={() => onSelectYear(Math.max(1, activeYear - 1))}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {[1, 2, 3, 4, 5].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => onSelectYear(yr)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    activeYear === yr
                      ? 'bg-[#2E5E88] text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  Yr {yr}
                </button>
              ))}
              <button
                type="button"
                disabled={activeYear >= 5}
                onClick={() => onSelectYear(Math.min(5, activeYear + 1))}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onGoToAssumptions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#222F4C] text-xs font-bold lowercase text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1B2542] transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#2E5E88]" />
              <span>edit staffing</span>
            </button>
          </div>
        </div>

        {/* Linked Guarding Staffing Banner */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-xs ${
            isDark
              ? 'bg-[#0C111E] border-[#222F4C]'
              : 'bg-[#FAF8F5] border-[#D8CEBC]'
          }`}
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
              <Shield className="h-3.5 w-3.5 text-[#2E5E88]" />
              <span>
                {guardLabel}/{siteSingular}:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {grid.guardsPerWorkstreamAdjusted}
                </strong>{' '}
                <span className="text-[11px] font-normal text-slate-500">
                  ({grid.standardGuardsPerWorkstream} std +{' '}
                  {grid.reliefGuardsPerWorkstream} relief)
                </span>
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span>
                avg deployed:{' '}
                <strong>
                  {grid.totals.avgGuardsSold.toLocaleString('en-ZA')}{' '}
                  {guardLabel}/mo
                </strong>
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              <span>
                Yr {activeYear} variable GP:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {grid.totals.avgGrossProfitMarginPct.toFixed(1)}%
                </strong>
              </span>
            </span>
          </div>
          <span className="text-[11px] text-slate-400 lowercase">
            direct guard wages flow to trading account variable COS
          </span>
        </div>

        {/* 12-Month Results Grid (Faithful to guarding.xlsx R42-R71) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-right text-xs border-collapse min-w-[980px]">
            <thead>
              <tr
                className={`border-b ${
                  isDark
                    ? 'bg-[#121A2F] border-slate-800 text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                } text-[11px] font-bold uppercase`}
              >
                <th className="py-2.5 px-3.5 text-left w-60">metric</th>
                {grid.months.map((m) => (
                  <th key={m.absMonth} className="py-2.5 px-2.5 tabular-nums">
                    M{m.absMonth}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right">Yr {activeYear}</th>
                <th className="py-2.5 px-3 text-center w-16">adjust</th>
              </tr>
            </thead>
            <tbody>
              {/* SECTION 1: TRADING DYNAMICS */}
              <tr className="bg-[#2E5E88]/10 border-b border-slate-200 dark:border-slate-800">
                <td
                  colSpan={15}
                  className="py-1.5 px-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#2E5E88] dark:text-[#6BA3D6]"
                >
                  TRADING DYNAMICS — {siteLabel.toUpperCase()} & {guardLabel.toUpperCase()} DEPLOYMENT
                </td>
              </tr>

              {/* R43: workstreams (slider adjustable) */}
              <tr
                onClick={() => setSelectedKey('workstreams')}
                className={`border-b border-slate-100 dark:border-slate-800/70 cursor-pointer transition-colors ${
                  selectedKey === 'workstreams'
                    ? 'bg-[#2E5E88]/10 dark:bg-[#2E5E88]/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <td className="py-2 px-3.5 text-left font-bold text-slate-800 dark:text-slate-100">
                  {siteLabel} (active sites)
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.absMonth}
                    className="py-2 px-2.5 tabular-nums font-bold text-slate-800 dark:text-slate-200"
                  >
                    {m.isLaunched ? m.workstreams.toLocaleString('en-ZA') : '—'}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums font-bold text-slate-800 dark:text-slate-200">
                  {grid.totals.avgWorkstreams.toLocaleString('en-ZA')} avg
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="radio"
                    name="grd-adjust-row"
                    checked={selectedKey === 'workstreams'}
                    onChange={() => setSelectedKey('workstreams')}
                    className="accent-[#2E5E88] cursor-pointer"
                  />
                </td>
              </tr>

              {/* R45: guards per workstream */}
              <tr className="border-b border-slate-100 dark:border-slate-800/70">
                <td className="py-1.5 px-3.5 text-left text-slate-500 dark:text-slate-400">
                  {guardLabel} per {siteSingular} (incl. relief)
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.absMonth}
                    className="py-1.5 px-2.5 tabular-nums text-slate-500 dark:text-slate-400"
                  >
                    {m.isLaunched ? m.guardsPerWorkstream : '—'}
                  </td>
                ))}
                <td className="py-1.5 px-3 tabular-nums text-slate-500 dark:text-slate-400">
                  {grid.guardsPerWorkstreamAdjusted}
                </td>
                <td className="py-1.5 px-3 text-center text-slate-300 dark:text-slate-700">
                  -
                </td>
              </tr>

              {/* R46 / R59: guards sold (unit sales) */}
              <tr className="border-b border-slate-200 dark:border-slate-800 font-bold bg-slate-50/70 dark:bg-[#121A2F]/50">
                <td className="py-2 px-3.5 text-left text-slate-900 dark:text-white">
                  {guardLabel} sold (unit sales)
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.absMonth}
                    className="py-2 px-2.5 tabular-nums text-[#2E5E88] dark:text-[#6BA3D6]"
                  >
                    {m.isLaunched ? m.guardsSold.toLocaleString('en-ZA') : '0'}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums text-[#2E5E88] dark:text-[#6BA3D6]">
                  {grid.totals.sumGuardMonthsSold.toLocaleString('en-ZA')}
                </td>
                <td className="py-2 px-3 text-center text-slate-300 dark:text-slate-700">
                  -
                </td>
              </tr>

              {/* R47: guard selling price (slider adjustable) */}
              <tr
                onClick={() => setSelectedKey('guardSellingPrice')}
                className={`border-b border-slate-100 dark:border-slate-800/70 cursor-pointer transition-colors ${
                  selectedKey === 'guardSellingPrice'
                    ? 'bg-[#2E5E88]/10 dark:bg-[#2E5E88]/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <td className="py-2 px-3.5 text-left font-bold text-slate-700 dark:text-slate-200">
                  {guardSingular} selling price (R)
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.absMonth}
                    className="py-2 px-2.5 tabular-nums text-slate-700 dark:text-slate-200"
                  >
                    {m.isLaunched ? fmtCur(m.guardSellingPrice) : '—'}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums font-bold text-slate-700 dark:text-slate-200">
                  {fmtCur(grid.totals.avgGuardSellingPrice)}
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="radio"
                    name="grd-adjust-row"
                    checked={selectedKey === 'guardSellingPrice'}
                    onChange={() => setSelectedKey('guardSellingPrice')}
                    className="accent-[#2E5E88] cursor-pointer"
                  />
                </td>
              </tr>

              {/* R49: unit cost per guard (slider adjustable) */}
              <tr
                onClick={() => setSelectedKey('unitCostPerGuard')}
                className={`border-b border-slate-100 dark:border-slate-800/70 cursor-pointer transition-colors ${
                  selectedKey === 'unitCostPerGuard'
                    ? 'bg-[#2E5E88]/10 dark:bg-[#2E5E88]/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <td className="py-2 px-3.5 text-left font-bold text-slate-700 dark:text-slate-200">
                  unit cost per {guardSingular} (R)
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.absMonth}
                    className="py-2 px-2.5 tabular-nums text-rose-600 dark:text-rose-400"
                  >
                    {m.isLaunched ? fmtCur(m.unitCostPerGuard) : '—'}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums font-bold text-rose-600 dark:text-rose-400">
                  {fmtCur(grid.totals.avgUnitCostPerGuard)}
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="radio"
                    name="grd-adjust-row"
                    checked={selectedKey === 'unitCostPerGuard'}
                    onChange={() => setSelectedKey('unitCostPerGuard')}
                    className="accent-[#2E5E88] cursor-pointer"
                  />
                </td>
              </tr>

              {/* R51: unit gross profit */}
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <td className="py-1.5 px-3.5 text-left text-slate-600 dark:text-slate-300 font-semibold">
                  unit gross profit per {guardSingular} (R)
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.absMonth}
                    className="py-1.5 px-2.5 tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold"
                  >
                    {m.isLaunched ? fmtCur(m.unitGrossProfit) : '—'}
                  </td>
                ))}
                <td className="py-1.5 px-3 tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                  {fmtCur(grid.totals.avgUnitGrossProfit)}
                </td>
                <td className="py-1.5 px-3 text-center text-slate-300 dark:text-slate-700">
                  -
                </td>
              </tr>

              {/* SECTION 2: TRADING ACCOUNT */}
              <tr className="bg-emerald-500/10 border-b border-slate-200 dark:border-slate-800">
                <td
                  colSpan={15}
                  className="py-1.5 px-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400"
                >
                  TRADING ACCOUNT (REVENUE & DIRECT GUARD COST OF SALES)
                </td>
              </tr>

              {/* R60: revenue */}
              <tr className="border-b border-slate-100 dark:border-slate-800/70 font-bold">
                <td className="py-2.5 px-3.5 text-left text-emerald-700 dark:text-emerald-400">
                  revenue
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.absMonth}
                    className="py-2.5 px-2.5 tabular-nums text-emerald-700 dark:text-emerald-400"
                  >
                    {fmtInt(m.revenue)}
                  </td>
                ))}
                <td className="py-2.5 px-3 tabular-nums text-emerald-700 dark:text-emerald-400">
                  {fmtInt(grid.totals.sumRevenue)}
                </td>
                <td className="py-2.5 px-3 text-center text-slate-300 dark:text-slate-700">
                  -
                </td>
              </tr>

              {/* R62: cost of sales - variable (guards) */}
              <tr className="border-b border-slate-100 dark:border-slate-800/70">
                <td className="py-2 px-3.5 text-left text-rose-700 dark:text-rose-400 font-semibold">
                  cost of sales — variable ({guardLabel})
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.absMonth}
                    className="py-2 px-2.5 tabular-nums text-rose-700 dark:text-rose-400"
                  >
                    {m.variableCostOfSales > 0
                      ? `-${fmtInt(m.variableCostOfSales)}`
                      : '0'}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums font-bold text-rose-700 dark:text-rose-400">
                  {grid.totals.sumVariableCos > 0
                    ? `-${fmtInt(grid.totals.sumVariableCos)}`
                    : '0'}
                </td>
                <td className="py-2 px-3 text-center text-slate-300 dark:text-slate-700">
                  -
                </td>
              </tr>

              {/* Variable Gross Profit */}
              <tr className="border-b border-slate-200 dark:border-slate-800 font-bold bg-slate-50/70 dark:bg-[#121A2F]/50">
                <td className="py-2 px-3.5 text-left text-slate-900 dark:text-white">
                  variable gross profit
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.absMonth}
                    className="py-2 px-2.5 tabular-nums text-slate-900 dark:text-white"
                  >
                    {fmtInt(m.variableGrossProfit)}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums text-slate-900 dark:text-white">
                  {fmtInt(grid.totals.sumVariableGrossProfit)}
                </td>
                <td className="py-2 px-3 text-center text-slate-300 dark:text-slate-700">
                  -
                </td>
              </tr>

              {/* SECTION 3: GROSS PROFIT ADJUSTMENTS */}
              <tr className="bg-amber-500/10 border-b border-slate-200 dark:border-slate-800">
                <td
                  colSpan={15}
                  className="py-1.5 px-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400"
                >
                  GROSS PROFIT ADJUSTMENTS & OTHER INCOME
                </td>
              </tr>

              {/* R53: commission on sales % */}
              <tr
                onClick={() => setSelectedKey('commissionOnSalesPct')}
                className={`border-b border-slate-100 dark:border-slate-800/70 cursor-pointer transition-colors ${
                  selectedKey === 'commissionOnSalesPct'
                    ? 'bg-[#2E5E88]/10 dark:bg-[#2E5E88]/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <td className="py-2 px-3.5 text-left font-bold text-slate-700 dark:text-slate-200">
                  commission on sales %
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.absMonth}
                    className="py-2 px-2.5 tabular-nums text-slate-600 dark:text-slate-300"
                  >
                    {m.isLaunched ? `${fmtDec(m.commissionOnSalesPct)}%` : '—'}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums font-bold text-slate-700 dark:text-slate-200">
                  {fmtDec(grid.totals.avgCommissionPct)}%
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="radio"
                    name="grd-adjust-row"
                    checked={selectedKey === 'commissionOnSalesPct'}
                    onChange={() => setSelectedKey('commissionOnSalesPct')}
                    className="accent-[#2E5E88] cursor-pointer"
                  />
                </td>
              </tr>

              {/* R54 / R69: gross profit adjustments */}
              <tr className="border-b border-slate-100 dark:border-slate-800/70 font-bold">
                <td className="py-2 px-3.5 text-left text-amber-700 dark:text-amber-400">
                  gross profit adjustments
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.absMonth}
                    className="py-2 px-2.5 tabular-nums text-amber-700 dark:text-amber-400"
                  >
                    {fmtInt(m.grossProfitAdjustments)}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums text-amber-700 dark:text-amber-400">
                  {fmtInt(grid.totals.sumGrossProfitAdjustments)}
                </td>
                <td className="py-2 px-3 text-center text-slate-300 dark:text-slate-700">
                  -
                </td>
              </tr>

              {/* R56 / R71: other income */}
              <tr
                onClick={() => setSelectedKey('otherIncome')}
                className={`border-b border-slate-200 dark:border-slate-800 cursor-pointer transition-colors ${
                  selectedKey === 'otherIncome'
                    ? 'bg-[#2E5E88]/10 dark:bg-[#2E5E88]/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <td className="py-2 px-3.5 text-left font-bold text-slate-700 dark:text-slate-200">
                  other income
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.absMonth}
                    className="py-2 px-2.5 tabular-nums text-slate-700 dark:text-slate-200"
                  >
                    {fmtInt(m.otherIncome)}
                  </td>
                ))}
                <td className="py-2 px-3 tabular-nums font-bold text-slate-700 dark:text-slate-200">
                  {fmtInt(grid.totals.sumOtherIncome)}
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="radio"
                    name="grd-adjust-row"
                    checked={selectedKey === 'otherIncome'}
                    onChange={() => setSelectedKey('otherIncome')}
                    className="accent-[#2E5E88] cursor-pointer"
                  />
                </td>
              </tr>

              {/* Net Trading Contribution (before fixed COS/OPEX) */}
              <tr
                className={`font-bold ${
                  isDark ? 'bg-[#121A2F]' : 'bg-slate-100/80'
                }`}
              >
                <td className="py-2.5 px-3.5 text-left text-slate-900 dark:text-white">
                  net trading contribution (before fixed COS)
                </td>
                {grid.months.map((m) => (
                  <td
                    key={m.absMonth}
                    className="py-2.5 px-2.5 tabular-nums text-[#2E5E88] dark:text-[#6BA3D6]"
                  >
                    {fmtInt(m.netTradingContribution)}
                  </td>
                ))}
                <td className="py-2.5 px-3 tabular-nums text-[#2E5E88] dark:text-[#6BA3D6]">
                  {fmtInt(grid.totals.sumNetTradingContribution)}
                </td>
                <td className="py-2.5 px-3 text-center text-slate-300 dark:text-slate-700">
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedded BaseRateAdjustmentTool Slider */}
      {activeSliderItem && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
            isDark
              ? 'bg-[#101626] border-[#222F4C]'
              : 'bg-white border-[#D8CEBC] shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">
            <Sliders className="h-4 w-4 text-[#2E5E88]" />
            <span>ADJUSTMENT SLIDER — {activeSliderItem.name}</span>
          </div>
          <BaseRateAdjustmentTool
            theme={theme}
            item={activeSliderItem}
            selectedYear={activeYear}
            onSelectYear={onSelectYear}
            onUpdateMonthlyValues={handleSliderUpdateMonthlyValues}
            onUpdateBaseRate={handleSliderUpdateBaseRate}
            onPrevItem={() => handleCycleSlider('prev')}
            onNextItem={() => handleCycleSlider('next')}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SERVICES: GUARDING CHARTS VIEW
// ============================================================================

interface GuardingChartsViewProps {
  theme?: 'light' | 'dark';
  products: RevenueItem[];
  activeProductIdx: number;
  onSelectProductIdx: (idx: number) => void;
  activeYear: number;
  onSelectYear: (yr: number) => void;
  daysWorked60: number[];
}

export const GuardingChartsView: React.FC<GuardingChartsViewProps> = ({
  theme = 'light',
  products,
  activeProductIdx,
  onSelectProductIdx,
  activeYear,
  onSelectYear,
  daysWorked60,
}) => {
  const isDark = theme === 'dark';
  const safeIdx = Math.min(activeProductIdx, Math.max(0, products.length - 1));
  const currentProduct = products[safeIdx];

  const grid = useMemo(() => {
    if (!currentProduct) return null;
    return calculateGuardingProductYearGrid(
      currentProduct,
      daysWorked60,
      activeYear
    );
  }, [currentProduct, daysWorked60, activeYear]);

  const portfolioSummaries = useMemo(() => {
    const items = products.map((prod) => {
      const g = calculateGuardingProductYearGrid(prod, daysWorked60, activeYear);
      return {
        id: prod.id,
        name: prod.name,
        guardLabel: g.guardLabel,
        siteLabel: g.siteLabel,
        avgWorkstreams: g.totals.avgWorkstreams,
        avgGuardsSold: g.totals.avgGuardsSold,
        revenue: g.totals.sumRevenue,
        variableCos: g.totals.sumVariableCos,
        variableGp: g.totals.sumVariableGrossProfit,
        gpMarginPct: g.totals.avgGrossProfitMarginPct,
      };
    });
    const totalRev = items.reduce((s, i) => s + i.revenue, 0);
    return { items, totalRev };
  }, [products, daysWorked60, activeYear]);

  if (!currentProduct || !grid) return null;

  const fmtRand = (n: number) => `R ${Math.round(n).toLocaleString('en-ZA')}`;
  const maxGuards = Math.max(1, ...grid.months.map((m) => m.guardsSold));
  const maxFinancial = Math.max(
    1,
    ...grid.months.map((m) => Math.max(m.revenue, m.variableCostOfSales))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Filter Controls */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-xs ${
          isDark
            ? 'bg-[#101626] border-[#222F4C]'
            : 'bg-white border-[#D8CEBC]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold lowercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4 text-[#2E5E88]" />
            <span>guarding charts:</span>
          </span>

          <select
            value={safeIdx}
            onChange={(e) => onSelectProductIdx(Number(e.target.value))}
            className={`py-1.5 px-3 rounded-xl border text-xs font-bold lowercase cursor-pointer ${
              isDark
                ? 'bg-[#0E1322] border-[#222F4C] text-white'
                : 'bg-white border-[#D8CEBC] text-slate-900'
            }`}
          >
            {products.map((prod, idx) => (
              <option key={prod.id} value={idx}>
                {prod.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0E1322] border border-slate-200 dark:border-[#222F4C]">
            {[1, 2, 3, 4, 5].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => onSelectYear(yr)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  activeYear === yr
                    ? 'bg-[#2E5E88] text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                Yr {yr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-2xl border ${
            isDark
              ? 'bg-[#101626] border-[#222F4C]'
              : 'bg-white border-[#D8CEBC]'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Yr {activeYear} Guarding Revenue
          </span>
          <span className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1 block">
            {fmtRand(grid.totals.sumRevenue)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            avg {fmtRand(grid.totals.avgGuardSellingPrice)} / {grid.guardLabel.replace(/s$/, '')} / mo
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDark
              ? 'bg-[#101626] border-[#222F4C]'
              : 'bg-white border-[#D8CEBC]'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Yr {activeYear} Variable Guard COS
          </span>
          <span className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400 mt-1 block">
            -{fmtRand(grid.totals.sumVariableCos)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            avg {fmtRand(grid.totals.avgUnitCostPerGuard)} / {grid.guardLabel.replace(/s$/, '')} / mo
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDark
              ? 'bg-[#101626] border-[#222F4C]'
              : 'bg-white border-[#D8CEBC]'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Yr {activeYear} Variable Gross Profit
          </span>
          <span className="text-lg font-bold tabular-nums text-[#2E5E88] dark:text-[#6BA3D6] mt-1 block">
            {fmtRand(grid.totals.sumVariableGrossProfit)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {grid.totals.avgGrossProfitMarginPct.toFixed(1)}% variable GP margin
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDark
              ? 'bg-[#101626] border-[#222F4C]'
              : 'bg-white border-[#D8CEBC]'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Active Deployment (Yr {activeYear})
          </span>
          <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-white mt-1 block">
            {grid.totals.avgGuardsSold.toLocaleString('en-ZA')} {grid.guardLabel}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {grid.totals.avgWorkstreams.toLocaleString('en-ZA')} avg {grid.siteLabel} × {grid.guardsPerWorkstreamAdjusted}
          </span>
        </div>
      </div>

      {/* Chart 1: Monthly Revenue vs Direct Guard COS & Variable Gross Profit */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isDark
            ? 'bg-[#101626] border-[#222F4C]'
            : 'bg-white border-[#D8CEBC]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Monthly Revenue vs Direct Guard Cost of Sales (Year {activeYear})
            </h4>
            <p className="text-[11px] text-slate-500">
              Visualizes monthly client billing against direct guard payroll COS and resulting variable gross profit.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
              Revenue
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500/80 inline-block" />
              Guard COS
            </span>
            <span className="flex items-center gap-1.5 text-[#2E5E88] dark:text-[#6BA3D6]">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#2E5E88] inline-block" />
              Variable GP
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2 items-end h-52 pt-4">
          {grid.months.map((m) => {
            const revPct = Math.round((m.revenue / maxFinancial) * 100);
            const cosPct = Math.round((m.variableCostOfSales / maxFinancial) * 100);
            const gpPct = Math.max(
              0,
              Math.round((m.variableGrossProfit / maxFinancial) * 100)
            );
            return (
              <div
                key={m.absMonth}
                className="flex flex-col items-center gap-1.5 h-full justify-end"
              >
                <div className="w-full flex items-end justify-center gap-0.5 h-40">
                  <div
                    className="w-1/3 rounded-t-xs bg-emerald-500 transition-all"
                    style={{ height: `${Math.max(2, revPct)}%` }}
                    title={`M${m.absMonth} Revenue: ${fmtRand(m.revenue)}`}
                  />
                  <div
                    className="w-1/3 rounded-t-xs bg-rose-500/80 transition-all"
                    style={{ height: `${Math.max(2, cosPct)}%` }}
                    title={`M${m.absMonth} Guard COS: ${fmtRand(m.variableCostOfSales)}`}
                  />
                  <div
                    className="w-1/3 rounded-t-xs bg-[#2E5E88] transition-all"
                    style={{ height: `${Math.max(2, gpPct)}%` }}
                    title={`M${m.absMonth} Variable GP: ${fmtRand(m.variableGrossProfit)}`}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                  M{m.absMonth}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 2: Monthly Guards Deployed & Active Sites */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isDark
            ? 'bg-[#101626] border-[#222F4C]'
            : 'bg-white border-[#D8CEBC]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Monthly {grid.guardLabel} Deployed & Active {grid.siteLabel} (Year {activeYear})
            </h4>
            <p className="text-[11px] text-slate-500">
              Total billed & deployed {grid.guardLabel} per month (including relief cover) alongside contracted {grid.siteLabel}.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-500 tabular-nums">
            {grid.totals.sumGuardMonthsSold.toLocaleString('en-ZA')}{' '}
            {grid.guardLabel.replace(/s$/, '')}-months in Yr {activeYear}
          </span>
        </div>

        <div className="grid grid-cols-12 gap-2 items-end h-44 pt-4">
          {grid.months.map((m) => {
            const pct = Math.round((m.guardsSold / maxGuards) * 100);
            return (
              <div
                key={m.absMonth}
                className="flex flex-col items-center gap-1 h-full justify-end"
              >
                <span className="text-[10px] font-bold tabular-nums text-slate-700 dark:text-slate-300">
                  {m.isLaunched ? m.guardsSold : 0}
                </span>
                <div className="w-full max-w-[34px] h-28 flex items-end justify-center">
                  <div
                    className="w-full rounded-t-md bg-[#2E5E88] transition-all"
                    style={{ height: `${Math.max(4, pct)}%` }}
                    title={`M${m.absMonth}: ${m.workstreams} ${grid.siteLabel} × ${m.guardsPerWorkstream} = ${m.guardsSold} ${grid.guardLabel}`}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                  M{m.absMonth}
                </span>
                <span className="text-[9px] text-slate-400 tabular-nums">
                  {m.workstreams}s
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Portfolio Breakdown across all Guarding Streams */}
      {portfolioSummaries.items.length > 1 && (
        <div
          className={`p-5 rounded-2xl border space-y-3 ${
            isDark
              ? 'bg-[#101626] border-[#222F4C]'
              : 'bg-white border-[#D8CEBC]'
          }`}
        >
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Guarding Portfolio Breakdown (Year {activeYear})
          </h4>
          <div className="space-y-2.5">
            {portfolioSummaries.items.map((item) => {
              const share =
                portfolioSummaries.totalRev > 0
                  ? (item.revenue / portfolioSummaries.totalRev) * 100
                  : 0;
              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold lowercase text-slate-800 dark:text-slate-200">
                      {item.name}{' '}
                      <span className="text-[11px] font-normal text-slate-400">
                        ({item.avgGuardsSold} avg {item.guardLabel} · GP{' '}
                        {item.gpMarginPct.toFixed(1)}%)
                      </span>
                    </span>
                    <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {fmtRand(item.revenue)} ({share.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#2E5E88] rounded-full"
                      style={{ width: `${Math.min(100, share)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
