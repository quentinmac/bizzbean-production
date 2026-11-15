import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Lock,
  Plus,
  Trash2,
  TrendingUp,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sliders,
  Percent,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BarChart2,
  Info,
  Sparkles,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  BizzModelState,
  RevenueItem,
  PlatformForecastAppId,
  ALL_MODEL_SETS,
} from '../constants';
import { calculate60MonthWorkingCalendar } from '../utils/calendarCalc';
import { AssumptionRateItem } from '../../bizzdynamics/types';
import { BaseRateAdjustmentTool } from '../../bizzdynamics/components/BaseRateAdjustmentTool';

interface RevenueStepProps {
  theme?: 'light' | 'dark';
  mode: PlatformForecastAppId; // 'bizzdynamics' | 'rolling-forecast' | 'hi-level-forecast' | 'bizzmodel'
  state: BizzModelState;
  onUpdateState: (updater: (prev: BizzModelState) => BizzModelState) => void;
  subTab?: 'assumptions' | 'results' | 'charts' | 'data entry' | 'data-entry';
  onSelectSubTab?: (tab: 'assumptions' | 'results' | 'charts') => void;
}

// 7 Slider-adjustable rate identifiers matching results_70dba554.png & ADJUSTMENT SLIDER.PNG
type AdjustableLineKey = 'line1' | 'line3' | 'line4' | 'line9' | 'line15' | 'line16' | 'line19';

const ADJUSTABLE_LINES_META: Array<{
  key: AdjustableLineKey;
  lineNum: number;
  name: string;
  description: string;
  unit: '%' | 'currency' | 'number';
  changeType: 'percentage' | 'value';
  defaultBase: number;
}> = [
  {
    key: 'line1',
    lineNum: 1,
    name: 'daily unit sales',
    description: 'daily rate changed by ADJUSTMENT SLIDER - % change over previous month',
    unit: 'number',
    changeType: 'percentage',
    defaultBase: 1000,
  },
  {
    key: 'line3',
    lineNum: 3,
    name: 'production unit cost*',
    description: 'transferred from ASSUMPTIONS*  unit cost price changed by ADJUSTMENT SLIDER - % change over previous month',
    unit: 'currency',
    changeType: 'percentage',
    defaultBase: -10.00,
  },
  {
    key: 'line4',
    lineNum: 4,
    name: 'manufacturing margin %',
    description: 'manufacturing margin changed by ADJUSTMENT SLIDER - (+-) change over previous month',
    unit: '%',
    changeType: 'percentage',
    defaultBase: 10.00,
  },
  {
    key: 'line9',
    lineNum: 9,
    name: 'gross profit margin %',
    description: 'gross profit margin changed by ADJUSTMENT SLIDER - (+-) change over previous month',
    unit: '%',
    changeType: 'percentage',
    defaultBase: 50.00,
  },
  {
    key: 'line15',
    lineNum: 15,
    name: 'sales commission',
    description: 'sales commission percentage of revenue changed by ADJUSTMENT SLIDER',
    unit: '%',
    changeType: 'percentage',
    defaultBase: 1.00,
  },
  {
    key: 'line16',
    lineNum: 16,
    name: 'inventory adjustments',
    description: 'inventory adjustments percentage of cost of sales changed by ADJUSTMENT SLIDER',
    unit: '%',
    changeType: 'percentage',
    defaultBase: 1.00,
  },
  {
    key: 'line19',
    lineNum: 19,
    name: 'other income',
    description: 'monthly values transferred to trading account - other income',
    unit: 'currency',
    changeType: 'percentage',
    defaultBase: 0,
  },
];

export const RevenueStep: React.FC<RevenueStepProps> = ({
  theme = 'light',
  mode,
  state,
  onUpdateState,
  subTab: subTabProp,
  onSelectSubTab,
}) => {
  const isDark = theme === 'dark';

  // Normalize subtabs ('data-entry' -> 'results')
  const normalizedSubTab = useMemo<'assumptions' | 'results' | 'charts'>(() => {
    if (!subTabProp) return 'results';
    if (subTabProp === 'data entry' || subTabProp === 'data-entry') return 'results';
    return subTabProp;
  }, [subTabProp]);

  const [internalSubTab, setInternalSubTab] = useState<'assumptions' | 'results' | 'charts'>(normalizedSubTab);
  const activeSubTab = subTabProp ? normalizedSubTab : internalSubTab;
  const setActiveSubTab = onSelectSubTab ?? setInternalSubTab;

  // Selected Model-Set (UNIT SALES is the only active one)
  const [selectedModelSet, setSelectedModelSet] = useState<string>('unit-sales');
  const [showTaxonomyTable, setShowTaxonomyTable] = useState<boolean>(false);

  // Active Year in 12-month views (Years 1 to 5)
  const [activeYear, setActiveYear] = useState<number>(1);

  // Active Product Index for Results and Charts tabs
  const [activeProductIdx, setActiveProductIdx] = useState<number>(0);

  // Active Slider-Adjustable Line Key (default: line 1 'daily unit sales')
  const [selectedAdjustableKey, setSelectedAdjustableKey] = useState<AdjustableLineKey>('line1');

  // Predetermined Product Names definition per user instructions:
  // 1 - for bizzdynamics: revenue generator SKU-A, SKU-B, SKU-C (3 product limit)
  // 2 - for rolling forecast: revenue generator SKU-A (1 product limit)
  // 3 - for hi-level forecast: revenue generator SKU-A (1 product limit)
  // 4 - for bizzmodel: allow user to add multiple products
  const predeterminedNames = useMemo(() => {
    if (mode === 'bizzdynamics') {
      return ['revenue generator SKU-A', 'revenue generator SKU-B', 'revenue generator SKU-C'];
    }
    if (mode === 'rolling-forecast' || mode === 'hi-level-forecast') {
      return ['revenue generator SKU-A'];
    }
    return null; // bizzmodel is flexible
  }, [mode]);

  // Synchronize predetermined products if needed and initialize 60-month series
  useEffect(() => {
    if (predeterminedNames) {
      const currentItems = state.revenueItems || [];
      const needsSync =
        currentItems.length !== predeterminedNames.length ||
        predeterminedNames.some((pName, idx) => currentItems[idx]?.name !== pName);

      if (needsSync) {
        const syncedItems: RevenueItem[] = predeterminedNames.map((name, idx) => {
          const existing = currentItems[idx];
          const itemCost = existing?.unitCost !== undefined ? existing.unitCost : 10.00;

          return {
            id: existing?.id || `rev-${mode}-${idx + 1}`,
            category: 'RETAIL PRODUCTS',
            name,
            modelType: 'unit sales',
            unitPrice: existing?.unitPrice ?? 22.22,
            unitCost: itemCost,
            costOfSalesPct: existing?.costOfSalesPct ?? 50.00,
            startMonth: existing?.startMonth ?? 1,
            dailyCapacity: existing?.dailyCapacity ?? 1500,
            monthlyUnits: existing?.monthlyUnits ?? new Array(60).fill(28000),
            dailyUnitSalesMonthly: existing?.dailyUnitSalesMonthly ?? new Array(60).fill(1000),
            productionUnitCostMonthly: existing?.productionUnitCostMonthly ?? new Array(60).fill(-Math.abs(itemCost)),
            manufacturingMarginPctMonthly: existing?.manufacturingMarginPctMonthly ?? new Array(60).fill(10.00),
            grossProfitMarginPctMonthly: existing?.grossProfitMarginPctMonthly ?? new Array(60).fill(50.00),
            salesCommissionPctMonthly: existing?.salesCommissionPctMonthly ?? new Array(60).fill(1.00),
            inventoryAdjustmentPctMonthly: existing?.inventoryAdjustmentPctMonthly ?? new Array(60).fill(1.00),
            otherIncomeMonthly: Array.isArray(existing?.otherIncomeMonthly)
              ? existing.otherIncomeMonthly
              : new Array(60).fill(0),
          };
        });

        onUpdateState((prev) => ({
          ...prev,
          revenueItems: syncedItems,
        }));
      }
    } else if (mode === 'bizzmodel' && (!state.revenueItems || state.revenueItems.length === 0)) {
      // Initialize with 1 product for bizzmodel if empty
      const defaultItem: RevenueItem = {
        id: `rev-bm-1`,
        category: 'RETAIL PRODUCTS',
        name: 'revenue generator SKU-A',
        modelType: 'unit sales',
        unitPrice: 22.22,
        unitCost: 10.00,
        costOfSalesPct: 50.00,
        startMonth: 1,
        dailyCapacity: 1500,
        monthlyUnits: new Array(60).fill(28000),
        dailyUnitSalesMonthly: new Array(60).fill(1000),
        productionUnitCostMonthly: new Array(60).fill(-10.00),
        manufacturingMarginPctMonthly: new Array(60).fill(10.00),
        grossProfitMarginPctMonthly: new Array(60).fill(50.00),
        salesCommissionPctMonthly: new Array(60).fill(1.00),
        inventoryAdjustmentPctMonthly: new Array(60).fill(1.00),
        otherIncomeMonthly: new Array(60).fill(0),
      };
      onUpdateState((prev) => ({
        ...prev,
        revenueItems: [defaultItem],
      }));
    }
  }, [mode, predeterminedNames]);

  // Ensure active product index is valid
  const currentProduct = useMemo(() => {
    if (!state.revenueItems || state.revenueItems.length === 0) return null;
    const safeIdx = Math.min(activeProductIdx, state.revenueItems.length - 1);
    return state.revenueItems[safeIdx] || state.revenueItems[0];
  }, [state.revenueItems, activeProductIdx]);

  // Update a specific product item
  const handleUpdateProduct = (idx: number, patch: Partial<RevenueItem>) => {
    onUpdateState((prev) => {
      const items = [...prev.revenueItems];
      const current = items[idx];
      if (!current) return prev;

      const updated = { ...current, ...patch };

      // Keep productionUnitCostMonthly in sync if unitCost is modified in assumptions
      if (patch.unitCost !== undefined && patch.productionUnitCostMonthly === undefined) {
        const negCost = -Math.abs(patch.unitCost);
        updated.productionUnitCostMonthly = new Array(60).fill(negCost);
      }

      items[idx] = updated;
      return { ...prev, revenueItems: items };
    });
  };

  // Add Product for BizzModel
  const handleAddBizzModelProduct = () => {
    const nextNum = (state.revenueItems || []).length + 1;
    const newItem: RevenueItem = {
      id: `rev-bm-${Date.now()}`,
      category: 'RETAIL PRODUCTS',
      name: `revenue generator SKU-${String.fromCharCode(64 + nextNum)}`,
      modelType: 'unit sales',
      unitPrice: 22.22,
      unitCost: 10.00,
      costOfSalesPct: 50.00,
      startMonth: 1,
      dailyCapacity: 1500,
      monthlyUnits: new Array(60).fill(28000),
      dailyUnitSalesMonthly: new Array(60).fill(1000),
      productionUnitCostMonthly: new Array(60).fill(-10.00),
      manufacturingMarginPctMonthly: new Array(60).fill(10.00),
      grossProfitMarginPctMonthly: new Array(60).fill(50.00),
      salesCommissionPctMonthly: new Array(60).fill(1.00),
      inventoryAdjustmentPctMonthly: new Array(60).fill(1.00),
      otherIncomeMonthly: new Array(60).fill(0),
    };
    onUpdateState((prev) => ({
      ...prev,
      revenueItems: [...prev.revenueItems, newItem],
    }));
    setActiveProductIdx(state.revenueItems.length);
  };

  // Remove Product for BizzModel
  const handleRemoveProduct = (idx: number) => {
    if (state.revenueItems.length <= 1) return;
    onUpdateState((prev) => ({
      ...prev,
      revenueItems: prev.revenueItems.filter((_, i) => i !== idx),
    }));
    if (activeProductIdx >= idx) {
      setActiveProductIdx(Math.max(0, activeProductIdx - 1));
    }
  };

  // Helper for mode description
  const modeDescription = useMemo(() => {
    switch (mode) {
      case 'bizzdynamics':
        return 'Learning Simulator: Limited to 3 products (SKU-A, SKU-B, SKU-C) to demonstrate contribution mix.';
      case 'rolling-forecast':
        return 'Rolling Forecast: Limited to 1 product (revenue generator SKU-A) with percentage-of-revenue cost ratios.';
      case 'hi-level-forecast':
        return 'Hi-Level Forecast: 1 product envelope (revenue generator SKU-A) acting as the residual balancing target in BizzModel (Formula: 1 = 3 - 2).';
      case 'bizzmodel':
      default:
        return 'Full Financial Model: Multi-product and multi model-sets with bottom-up costing and constraints.';
    }
  }, [mode]);

  // 60-Month Working Calendar synchronized directly with the Setup step
  const monthlyCalendar60 = useMemo(() => {
    return calculate60MonthWorkingCalendar(state.businessDetails);
  }, [state.businessDetails]);

  // Days worked per month for active year (12 months slice transferred from Setup)
  const daysWorkedArray = useMemo(() => {
    const startIdx = (activeYear - 1) * 12;
    return monthlyCalendar60.slice(startIdx, startIdx + 12).map((m) => m.daysWorked);
  }, [monthlyCalendar60, activeYear]);

  // 19-Line Calculation Engine for Active Product & Active Year (Months 1 to 12)
  const calculationGrid = useMemo(() => {
    if (!currentProduct) return null;

    const startMoIdx = (activeYear - 1) * 12;

    // Retrieve or initialize series
    const dailyUnitSales = currentProduct.dailyUnitSalesMonthly || new Array(60).fill(1000);
    const dailyCapacity = currentProduct.dailyCapacity || 1500;
    const currentCost = currentProduct.unitCost !== undefined ? currentProduct.unitCost : 10.00;
    const prodUnitCost = currentProduct.productionUnitCostMonthly || new Array(60).fill(-Math.abs(currentCost));
    const mfgMarginPct = currentProduct.manufacturingMarginPctMonthly || new Array(60).fill(10.00);
    const gpMarginPct = currentProduct.grossProfitMarginPctMonthly || new Array(60).fill(50.00);
    const commissionPct = currentProduct.salesCommissionPctMonthly || new Array(60).fill(1.00);
    const inventoryPct = currentProduct.inventoryAdjustmentPctMonthly || new Array(60).fill(1.00);
    const otherIncome = Array.isArray(currentProduct.otherIncomeMonthly)
      ? currentProduct.otherIncomeMonthly
      : new Array(60).fill(0);

    const launchMonth = currentProduct.startMonth || 1;

    const monthsData = Array.from({ length: 12 }, (_, i) => {
      const absIdx = startMoIdx + i;
      const daysWorked = daysWorkedArray[i];
      const absMonthNum = absIdx + 1; // 1 to 60
      const isLaunched = absMonthNum >= launchMonth;

      // Line 1: daily unit sales (0 before launch month)
      const rawLine1 = dailyUnitSales[absIdx] ?? 1000;
      const line1 = isLaunched ? rawLine1 : 0;

      // Line 2: daily capacity
      const line2 = dailyCapacity;

      // Line 3: production unit cost* (negative e.g. -10.00)
      const line3 = prodUnitCost[absIdx] ?? -Math.abs(currentCost);

      // Line 4: manufacturing margin % (positive e.g. 10.00%)
      const line4 = mfgMarginPct[absIdx] ?? 10.00;

      // Line 6: unit cost price = line 3 / (1 - line 4)
      const denom6 = 1 - line4 / 100;
      const line6 = denom6 !== 0 ? line3 / denom6 : line3;

      // Line 5: manufacturing unit variance = line 3 - line 6
      const line5 = line3 - line6;

      // Line 9: gross profit margin % (positive e.g. 50.00%)
      const line9 = gpMarginPct[absIdx] ?? 50.00;

      // Line 7: unit selling price = - line 6 / (1 - line 9)
      const denom7 = 1 - line9 / 100;
      const line7 = denom7 !== 0 ? -line6 / denom7 : Math.abs(line6);

      // Line 8: unit gross profit = line 6 + line 7
      const line8 = line6 + line7;

      // Line 10: unit sales = days worked x line 1
      const line10 = isLaunched ? Math.round(daysWorked * line1) : 0;

      // Line 11: revenue = days worked x line 1 x line 7
      const line11 = isLaunched ? Math.round(daysWorked * line1 * line7) : 0;

      // Line 12: cost of sales = days worked x line 1 x line 6
      const line12 = isLaunched ? Math.round(daysWorked * line1 * line6) : 0;

      // Line 13: gross profit = line 11 + line 12
      const line13 = isLaunched ? line11 + line12 : 0;

      // Line 14: gross profit margin % = line 13 / line 11 expressed as a percentage
      const line14 = isLaunched ? (line11 > 0 ? (line13 / line11) * 100 : line9) : line9;

      // Line 15: sales commission % entered by user, FORMULA: - line 11 x % value in line 15
      const line15Pct = commissionPct[absIdx] ?? 1.00;
      const line15Amt = isLaunched ? Math.round(-line11 * (line15Pct / 100)) : 0;

      // Line 16: inventory adjustments % entered by user, FORMULA: line 12 x % value in line 16
      const line16Pct = inventoryPct[absIdx] ?? 1.00;
      const line16Amt = isLaunched ? Math.round(line12 * (line16Pct / 100)) : 0;

      // Line 17: manufacturing variance = days worked x line 1 x line 5
      const line17 = isLaunched ? Math.round(daysWorked * line1 * line5) : 0;

      // Line 18: gross profit adjustments = line 15 + line 16 + line 17
      const line18 = isLaunched ? line15Amt + line16Amt + line17 : 0;

      // Line 19: other income entered by user - ADJUSTMENT SLIDER - % change over previous month
      const line19 = isLaunched ? Math.round(otherIncome[absIdx] ?? 0) : 0;

      return {
        monthNum: i + 1,
        absMonth: absIdx + 1,
        daysWorked,
        line1,
        line2,
        line3,
        line4,
        line5,
        line6,
        line7,
        line8,
        line9,
        line10,
        line11,
        line12,
        line13,
        line14,
        line15Pct,
        line15Amt,
        line16Pct,
        line16Amt,
        line17,
        line18,
        line19,
      };
    });

    // Compute Year Totals / Averages
    const sumLine10 = monthsData.reduce((acc, m) => acc + m.line10, 0);
    const sumLine11 = monthsData.reduce((acc, m) => acc + m.line11, 0);
    const sumLine12 = monthsData.reduce((acc, m) => acc + m.line12, 0);
    const sumLine13 = sumLine11 + sumLine12;
    const avgLine14 = sumLine11 > 0 ? (sumLine13 / sumLine11) * 100 : 50;
    const sumLine15Amt = monthsData.reduce((acc, m) => acc + m.line15Amt, 0);
    const sumLine16Amt = monthsData.reduce((acc, m) => acc + m.line16Amt, 0);
    const sumLine17 = monthsData.reduce((acc, m) => acc + m.line17, 0);
    const sumLine18 = sumLine15Amt + sumLine16Amt + sumLine17;
    const sumLine19 = monthsData.reduce((acc, m) => acc + m.line19, 0);

    const activeMonthsForAvg = monthsData.filter((m) => m.line1 > 0);
    const avgLine1 = activeMonthsForAvg.length > 0
      ? Math.round(activeMonthsForAvg.reduce((acc, m) => acc + m.line1, 0) / activeMonthsForAvg.length)
      : 0;
    const avgLine3 = Number((monthsData.reduce((acc, m) => acc + m.line3, 0) / 12).toFixed(2));
    const avgLine4 = Number((monthsData.reduce((acc, m) => acc + m.line4, 0) / 12).toFixed(2));
    const avgLine5 = Number((monthsData.reduce((acc, m) => acc + m.line5, 0) / 12).toFixed(2));
    const avgLine6 = Number((monthsData.reduce((acc, m) => acc + m.line6, 0) / 12).toFixed(2));
    const avgLine7 = Number((monthsData.reduce((acc, m) => acc + m.line7, 0) / 12).toFixed(2));
    const avgLine8 = Number((monthsData.reduce((acc, m) => acc + m.line8, 0) / 12).toFixed(2));
    const avgLine9 = Number((monthsData.reduce((acc, m) => acc + m.line9, 0) / 12).toFixed(2));

    return {
      months: monthsData,
      totals: {
        sumLine10,
        sumLine11,
        sumLine12,
        sumLine13,
        avgLine14,
        sumLine15Amt,
        sumLine16Amt,
        sumLine17,
        sumLine18,
        sumLine19,
        avgLine1,
        avgLine3,
        avgLine4,
        avgLine5,
        avgLine6,
        avgLine7,
        avgLine8,
        avgLine9,
      },
    };
  }, [currentProduct, activeYear, daysWorkedArray]);


  // Build the AssumptionRateItem for the selected adjustable metric to plug into BaseRateAdjustmentTool
  const activeSliderItem = useMemo<AssumptionRateItem | null>(() => {
    if (!currentProduct) return null;

    const meta = ADJUSTABLE_LINES_META.find((m) => m.key === selectedAdjustableKey) || ADJUSTABLE_LINES_META[0];
    let series: number[];
    let baseRate: number;

    switch (selectedAdjustableKey) {
      case 'line1':
        series = currentProduct.dailyUnitSalesMonthly || new Array(60).fill(meta.defaultBase);
        baseRate = series[0] ?? meta.defaultBase;
        break;
      case 'line3':
        series = currentProduct.productionUnitCostMonthly || new Array(60).fill(meta.defaultBase);
        baseRate = series[0] ?? meta.defaultBase;
        break;
      case 'line4':
        series = currentProduct.manufacturingMarginPctMonthly || new Array(60).fill(meta.defaultBase);
        baseRate = series[0] ?? meta.defaultBase;
        break;
      case 'line9':
        series = currentProduct.grossProfitMarginPctMonthly || new Array(60).fill(meta.defaultBase);
        baseRate = series[0] ?? meta.defaultBase;
        break;
      case 'line15':
        series = currentProduct.salesCommissionPctMonthly || new Array(60).fill(meta.defaultBase);
        baseRate = series[0] ?? meta.defaultBase;
        break;
      case 'line16':
        series = currentProduct.inventoryAdjustmentPctMonthly || new Array(60).fill(meta.defaultBase);
        baseRate = series[0] ?? meta.defaultBase;
        break;
      case 'line19': {
        series = Array.isArray(currentProduct.otherIncomeMonthly)
          ? currentProduct.otherIncomeMonthly
          : new Array(60).fill(meta.defaultBase);
        baseRate = series[0] ?? meta.defaultBase;
        break;
      }
      default:
        series = new Array(60).fill(0);
        baseRate = 0;
    }

    return {
      id: `${currentProduct.id}-${meta.key}`,
      stepId: 2,
      stepName: 'revenue calculator',
      name: meta.name,
      description: meta.description,
      baseRate,
      unit: meta.unit,
      changeType: meta.changeType,
      monthlyValues: series,
    };
  }, [currentProduct, selectedAdjustableKey]);

  // Handle updates from BaseRateAdjustmentTool
  const handleSliderUpdateMonthlyValues = (itemId: string, updatedValues: number[]) => {
    if (!currentProduct) return;

    switch (selectedAdjustableKey) {
      case 'line1':
        handleUpdateProduct(activeProductIdx, { dailyUnitSalesMonthly: updatedValues });
        break;
      case 'line3':
        handleUpdateProduct(activeProductIdx, { productionUnitCostMonthly: updatedValues });
        break;
      case 'line4':
        handleUpdateProduct(activeProductIdx, { manufacturingMarginPctMonthly: updatedValues });
        break;
      case 'line9':
        handleUpdateProduct(activeProductIdx, { grossProfitMarginPctMonthly: updatedValues });
        break;
      case 'line15':
        handleUpdateProduct(activeProductIdx, { salesCommissionPctMonthly: updatedValues });
        break;
      case 'line16':
        handleUpdateProduct(activeProductIdx, { inventoryAdjustmentPctMonthly: updatedValues });
        break;
      case 'line19':
        handleUpdateProduct(activeProductIdx, { otherIncomeMonthly: updatedValues });
        break;
    }
  };

  const handleSliderUpdateBaseRate = (itemId: string, newBaseRate: number) => {
    if (!currentProduct) return;
    const newSeries = new Array(60).fill(newBaseRate);
    handleSliderUpdateMonthlyValues(itemId, newSeries);
  };

  // Cycling between the 7 adjustable metrics
  const handleCycleSliderItem = (direction: 'prev' | 'next') => {
    const keys: AdjustableLineKey[] = ['line1', 'line3', 'line4', 'line9', 'line15', 'line16', 'line19'];
    const currentIdx = keys.indexOf(selectedAdjustableKey);
    let newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (newIdx < 0) newIdx = keys.length - 1;
    if (newIdx >= keys.length) newIdx = 0;
    setSelectedAdjustableKey(keys[newIdx]);
  };

  return (
    <div className={`space-y-6 font-mono select-none ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      
      {/* ===================================================================== */}
      {/* 1. TOP HEADER (Matching Employment Standard)                          */}
      {/* ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold uppercase tracking-tight text-slate-900 dark:text-white">
              REVENUE CALCULATOR
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-[#2E5E88]/10 text-[#2E5E88] dark:text-[#5584B4]">
              {mode}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-tier product modeling, unit economics, daily capacity, and trading revenue.
          </p>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: ASSUMPTIONS TAB                                                */}
      {/* ===================================================================== */}
      {activeSubTab === 'assumptions' && (
        <div className="space-y-6 animate-in fade-in duration-150">

          {/* SECTION A: SELECT MODEL-SET (REFERENCE: model-sets.PNG) */}
          <div
            className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  SELECT MODEL-SET
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (reference: model-sets.PNG)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowTaxonomyTable(!showTaxonomyTable)}
                className="text-xs font-bold text-[#2E5E88] dark:text-[#5584B4] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showTaxonomyTable ? 'hide taxonomy table' : 'view all 10 model-sets taxonomy'}</span>
                {showTaxonomyTable ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-slate-500 lowercase block font-bold">
                  active model-set for calculation:
                </label>
                <div className="relative">
                  <select
                    value={selectedModelSet}
                    onChange={(e) => {
                      if (e.target.value === 'unit-sales') {
                        setSelectedModelSet('unit-sales');
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold capitalize cursor-pointer ${
                      isDark ? 'bg-[#0E1322] border-[#222F4C] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                    }`}
                  >
                    {ALL_MODEL_SETS.map((cat) => (
                      <optgroup key={cat.type} label={`TYPE: ${cat.type.toUpperCase()}`}>
                        {cat.modelSets.map((ms) => (
                          <option
                            key={ms.id}
                            value={ms.id}
                            disabled={!ms.isAvailable}
                            className={ms.isAvailable ? 'font-bold text-emerald-600' : 'text-slate-400'}
                          >
                            {ms.name} {ms.isAvailable ? '✓ (AVAILABLE)' : '— coming soon'}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 lowercase mt-1">
                  * for the apps we are developing now, <strong>UNIT SALES</strong> is the only active model-set. all other model-sets are marked as <em>coming soon</em>.
                </p>
              </div>

              {/* Active Badge Card */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>UNIT SALES MODEL-SET</span>
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-300 leading-snug">
                  Calculates item unit cost and production volumes constraining volume sales.
                </p>
              </div>
            </div>

            {/* Expandable Taxonomy Table matching model-sets.PNG */}
            {showTaxonomyTable && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase px-1">
                  <span>Authentic Model-Sets Taxonomy (model-sets.PNG)</span>
                  <span className="text-emerald-600 dark:text-emerald-400">1 Available · 24 Coming Soon</span>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-[#121A2F] border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
                        <th className="py-2 px-3 w-40">TYPE</th>
                        <th className="py-2 px-3">BUSINESS TYPE (MODEL-SET)</th>
                        <th className="py-2 px-3 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ALL_MODEL_SETS.flatMap((cat) =>
                        cat.modelSets.map((ms, idx) => (
                          <tr
                            key={ms.id}
                            className={`border-b border-slate-100 dark:border-slate-800/60 ${
                              ms.isAvailable ? 'bg-emerald-500/10 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                            }`}
                          >
                            <td className="py-1.5 px-3 capitalize text-slate-700 dark:text-slate-300">
                              {idx === 0 ? cat.type : ''}
                            </td>
                            <td className="py-1.5 px-3 lowercase text-slate-900 dark:text-slate-200">
                              {ms.name}
                            </td>
                            <td className="py-1.5 px-3 text-right">
                              {ms.isAvailable ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  available
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-200 dark:bg-slate-800">
                                  coming soon
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* SECTION B: ADD PRODUCTS (START MONTH & DIRECT UNIT COST - SELLING PRICE REMOVED AS REQUESTED) */}
          <div
            className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                  PRODUCTS CONFIGURATION (UNIT SALES)
                </span>
                <span className="text-[11px] text-slate-400 lowercase">
                  insert start month, unit cost, and daily capacity below (selling price is derived dynamically on the results tab)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {mode === 'bizzdynamics' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
                    3 Predetermined Products
                  </span>
                )}
                {(mode === 'rolling-forecast' || mode === 'hi-level-forecast') && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
                    1 Predetermined Product
                  </span>
                )}
                {mode === 'bizzmodel' && (
                  <button
                    type="button"
                    onClick={handleAddBizzModelProduct}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold lowercase shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>add product</span>
                  </button>
                )}
              </div>
            </div>

            {/* Product Cards List */}
            <div className="space-y-4">
              {state.revenueItems.map((prod, idx) => {
                const isPredetermined = !!predeterminedNames;
                const cost = prod.unitCost !== undefined ? prod.unitCost : 10.00;
                const capacity = prod.dailyCapacity || 1500;

                return (
                  <div
                    key={prod.id}
                    className={`p-4 rounded-xl border space-y-3 transition-all ${
                      isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {/* Top Row: Product Name + Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 flex-grow max-w-md">
                        {isPredetermined ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold lowercase text-slate-900 dark:text-white">
                              {prod.name}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold lowercase">
                              <Lock className="h-2.5 w-2.5" />
                              predetermined
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              value={prod.name}
                              onChange={(e) => handleUpdateProduct(idx, { name: e.target.value })}
                              placeholder="Product Title"
                              className={`w-full p-1.5 rounded-lg border text-xs font-bold lowercase ${
                                isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                              }`}
                            />
                            {state.revenueItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(idx)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                title="Remove product"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Selling Price Removed Notice Pill */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#5584B4] border border-[#2E5E88]/25 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          <span>selling price derived on results tab</span>
                        </span>
                      </div>
                    </div>

                    {/* Inputs Grid: Start Month, Unit Cost, Daily Capacity (Selling Price Removed) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* 1. Start Month */}
                      <div className="space-y-1">
                        <label className="text-slate-500 lowercase block font-bold flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#2E5E88] dark:text-[#5584B4]" />
                          <span>start month:</span>
                        </label>
                        <select
                          value={prod.startMonth || 1}
                          onChange={(e) => handleUpdateProduct(idx, { startMonth: Number(e.target.value) })}
                          className={`w-full p-2 rounded-xl border text-xs font-bold cursor-pointer ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                          }`}
                        >
                          {Array.from({ length: 12 }).map((_, mIdx) => (
                            <option key={mIdx + 1} value={mIdx + 1}>
                              Month {mIdx + 1} (M{mIdx + 1})
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-slate-400 block">
                          operational launch month
                        </span>
                      </div>

                      {/* 2. Unit Cost */}
                      <div className="space-y-1">
                        <label className="text-slate-500 lowercase block font-bold flex items-center gap-1">
                          <span>unit cost:</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={prod.unitCost !== undefined ? prod.unitCost : ''}
                            placeholder="0.00"
                            onChange={(e) => {
                              const raw = e.target.value;
                              const val = raw === '' ? 0 : parseFloat(raw);
                              handleUpdateProduct(idx, { unitCost: isNaN(val) ? 0 : val });
                            }}
                            className={`w-full p-2 rounded-xl border text-xs font-bold text-right pr-3 ${
                              isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          direct item cost (-{cost.toFixed(2)})
                        </span>
                      </div>

                      {/* 3. Daily Capacity Limit */}
                      <div className="space-y-1">
                        <label className="text-slate-500 lowercase block font-bold flex items-center gap-1">
                          <Layers className="h-3 w-3 text-indigo-500" />
                          <span>daily capacity:</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            step="10"
                            value={capacity || ''}
                            placeholder="1500"
                            onChange={(e) => handleUpdateProduct(idx, { dailyCapacity: Number(e.target.value) })}
                            className={`w-full p-2 rounded-xl border text-xs font-bold text-right pr-3 ${
                              isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          daily production capacity constraint
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: RESULTS TAB (FULL 19-LINE CALCULATION & ADJUSTMENT SLIDER)      */}
      {/* ===================================================================== */}
      {activeSubTab === 'results' && currentProduct && calculationGrid && (
        <div className="space-y-6 animate-in fade-in duration-150">

          {/* 1. AUTHENTIC 19-ROW CALCULATION TABLE (results_70dba554.png) */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
            }`}
          >
            {/* Header: Title, Product Selector, Year Buttons, and Two-Way Sync Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                    RESULTS
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select any radio button on the right to load and adjust that metric in the ADJUSTMENT SLIDER situated below the tabled assumptions.
                  </p>
                </div>

                {/* Product Dropdown */}
                <select
                  value={activeProductIdx}
                  onChange={(e) => setActiveProductIdx(Number(e.target.value))}
                  className={`py-1.5 px-3 rounded-xl border text-xs font-bold lowercase cursor-pointer ${
                    isDark ? 'bg-[#0E1322] border-[#222F4C] text-white' : 'bg-white border-[#D8CEBC] text-slate-900 shadow-2xs'
                  }`}
                >
                  {state.revenueItems.map((prod, idx) => (
                    <option key={prod.id} value={idx}>
                      {prod.name}
                    </option>
                  ))}
                </select>

                {/* Year Selection Buttons (Years 1 to 5) */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#141A2E] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 lowercase px-1.5">year:</span>
                  {[1, 2, 3, 4, 5].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setActiveYear(yr)}
                      className={`py-1 px-3 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        activeYear === yr
                          ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                          : isDark
                          ? 'bg-transparent text-slate-400 hover:text-white border-transparent'
                          : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent'
                      }`}
                    >
                      Year {yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: TWO WAY Synchronization indicator */}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '8s' }} />
                  <span>TWO WAY Synchronization</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  {/* Row: month for year selected */}
                  <tr className="bg-slate-100 dark:bg-[#121A2F] border-b border-slate-200 dark:border-slate-800 font-bold">
                    <th className="py-2.5 px-3.5 text-left w-[260px] min-w-[260px] max-w-[260px] text-slate-800 dark:text-slate-200">
                      month for year selected
                    </th>
                    {calculationGrid.months.map((m) => (
                      <th key={m.absMonth} className="py-2.5 px-2.5 min-w-[62px] text-right text-slate-800 dark:text-slate-200">
                        <span className="block font-bold">{m.absMonth}</span>
                        <span className="block text-[9px] text-slate-400 font-normal">m{m.monthNum}</span>
                      </th>
                    ))}
                    <th className="py-2.5 px-3 min-w-[120px] text-right font-bold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center justify-end gap-1.5 select-none">
                        <button
                          type="button"
                          onClick={() => setActiveYear(Math.max(1, activeYear - 1))}
                          disabled={activeYear <= 1}
                          className="p-1 rounded-md hover:bg-[#2E5E88]/20 disabled:opacity-25 transition-colors cursor-pointer"
                          title="Previous Year"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-bold tracking-tight">YEAR {activeYear}</span>
                        <button
                          type="button"
                          onClick={() => setActiveYear(Math.min(5, activeYear + 1))}
                          disabled={activeYear >= 5}
                          className="p-1 rounded-md hover:bg-[#2E5E88]/20 disabled:opacity-25 transition-colors cursor-pointer"
                          title="Next Year"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </th>
                    {/* Standardized ADJUST column on the far right */}
                    <th className="py-2.5 px-3 font-bold uppercase text-center text-[#2E5E88] dark:text-[#5584B4] min-w-[60px] w-[60px]">
                      Adjust
                    </th>
                  </tr>

                  {/* Row: days worked (transferred from setup) */}
                  <tr className="bg-slate-50 dark:bg-[#0E1528] border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                    <td className="py-2 px-3.5 text-left font-bold w-[260px] min-w-[260px] max-w-[260px]">
                      days worked
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right font-bold text-slate-700 dark:text-slate-300">
                        {m.daysWorked}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-slate-700 dark:text-slate-300">
                      {calculationGrid.months.reduce((acc, m) => acc + m.daysWorked, 0)}
                    </td>
                    <td className="py-2 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>
                </thead>

                <tbody>
                  {/* --------------------------------------------------------- */}
                  {/* SECTION 1: UNIT DYNAMICS                                  */}
                  {/* --------------------------------------------------------- */}
                  <tr className="bg-[#2E5E88]/15 border-y border-[#2E5E88]/25 font-bold text-left text-[#2E5E88] dark:text-[#5584B4]">
                    <td colSpan={15} className="py-1.5 px-3.5 uppercase text-[11px] tracking-wider">
                      unit dynamics
                    </td>
                  </tr>

                  {/* Line 1: daily unit sales (Radio button on right) */}
                  <tr className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 ${selectedAdjustableKey === 'line1' ? 'bg-blue-500/10' : ''}`}>
                    <td className="py-2.5 px-3.5 text-left font-bold text-slate-800 dark:text-slate-200 w-[260px] min-w-[260px] max-w-[260px]">
                      daily unit sales
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right font-bold text-slate-900 dark:text-white">
                        {m.line1.toLocaleString()}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {calculationGrid.totals.avgLine1.toLocaleString()} avg
                    </td>
                    <td className="py-2 px-3 text-center w-[60px]" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="revenue-adjustable-metric"
                        checked={selectedAdjustableKey === 'line1'}
                        onChange={() => setSelectedAdjustableKey('line1')}
                        className="w-4 h-4 text-[#2E5E88] focus:ring-[#2E5E88] cursor-pointer"
                        aria-label="Select daily unit sales for adjustment"
                      />
                    </td>
                  </tr>

                  {/* Line 2: daily capacity */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-2 px-3.5 text-left text-slate-700 dark:text-slate-300 w-[260px] min-w-[260px] max-w-[260px]">
                      daily capacity
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right text-slate-500">
                        {m.line2.toLocaleString()}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right text-slate-500">
                      {calculationGrid.months[0].line2.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>

                  {/* Line 3: production unit cost* (Radio button on right) */}
                  <tr className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 ${selectedAdjustableKey === 'line3' ? 'bg-blue-500/10' : ''}`}>
                    <td className="py-2.5 px-3.5 text-left font-bold text-slate-800 dark:text-slate-200 w-[260px] min-w-[260px] max-w-[260px]">
                      production unit cost*
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right font-bold text-rose-600 dark:text-rose-400">
                        {m.line3.toFixed(2)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                      {calculationGrid.totals.avgLine3.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center w-[60px]" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="revenue-adjustable-metric"
                        checked={selectedAdjustableKey === 'line3'}
                        onChange={() => setSelectedAdjustableKey('line3')}
                        className="w-4 h-4 text-[#2E5E88] focus:ring-[#2E5E88] cursor-pointer"
                        aria-label="Select production unit cost for adjustment"
                      />
                    </td>
                  </tr>

                  {/* Line 4: manufacturing margin % (Radio button on right) */}
                  <tr className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 ${selectedAdjustableKey === 'line4' ? 'bg-blue-500/10' : ''}`}>
                    <td className="py-2.5 px-3.5 text-left font-bold text-slate-800 dark:text-slate-200 w-[260px] min-w-[260px] max-w-[260px]">
                      manufacturing margin %
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                        {m.line4.toFixed(2)}%
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      {calculationGrid.totals.avgLine4.toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-center w-[60px]" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="revenue-adjustable-metric"
                        checked={selectedAdjustableKey === 'line4'}
                        onChange={() => setSelectedAdjustableKey('line4')}
                        className="w-4 h-4 text-[#2E5E88] focus:ring-[#2E5E88] cursor-pointer"
                        aria-label="Select manufacturing margin % for adjustment"
                      />
                    </td>
                  </tr>

                  {/* Line 5: manufacturing unit variance */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-2 px-3.5 text-left text-slate-700 dark:text-slate-300 w-[260px] min-w-[260px] max-w-[260px]">
                      manufacturing unit variance
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right text-slate-700 dark:text-slate-300">
                        {m.line5.toFixed(2)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">
                      {calculationGrid.totals.avgLine5.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>

                  {/* Line 6: unit cost price */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 font-bold">
                    <td className="py-2 px-3.5 text-left text-rose-600 dark:text-rose-400 w-[260px] min-w-[260px] max-w-[260px]">
                      unit cost price
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right text-rose-600 dark:text-rose-400 font-bold">
                        {m.line6.toFixed(2)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                      {calculationGrid.totals.avgLine6.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>

                  {/* Line 7: unit selling price */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 font-bold">
                    <td className="py-2 px-3.5 text-left text-emerald-600 dark:text-emerald-400 w-[260px] min-w-[260px] max-w-[260px]">
                      unit selling price
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                        {m.line7.toFixed(2)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {calculationGrid.totals.avgLine7.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>

                  {/* Line 8: unit gross profit */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 font-bold">
                    <td className="py-2 px-3.5 text-left text-[#2E5E88] dark:text-[#5584B4] w-[260px] min-w-[260px] max-w-[260px]">
                      unit gross profit
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right text-[#2E5E88] dark:text-[#5584B4] font-bold">
                        {m.line8.toFixed(2)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-[#2E5E88] dark:text-[#5584B4]">
                      {calculationGrid.totals.avgLine8.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>

                  {/* Line 9: gross profit margin % (Radio button on right) */}
                  <tr className={`border-b-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 ${selectedAdjustableKey === 'line9' ? 'bg-blue-500/10' : ''}`}>
                    <td className="py-2.5 px-3.5 text-left font-bold text-slate-800 dark:text-slate-200 w-[260px] min-w-[260px] max-w-[260px]">
                      gross profit margin %
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right font-bold text-slate-900 dark:text-white">
                        {m.line9.toFixed(2)}%
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold">
                      {calculationGrid.totals.avgLine9.toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-center w-[60px]" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="revenue-adjustable-metric"
                        checked={selectedAdjustableKey === 'line9'}
                        onChange={() => setSelectedAdjustableKey('line9')}
                        className="w-4 h-4 text-[#2E5E88] focus:ring-[#2E5E88] cursor-pointer"
                        aria-label="Select gross profit margin % for adjustment"
                      />
                    </td>
                  </tr>

                  {/* --------------------------------------------------------- */}
                  {/* SECTION 2: TRADING VALUES TRANSFERRED TO TRADING ACCOUNT */}
                  {/* --------------------------------------------------------- */}
                  <tr className="bg-[#2E5E88]/15 border-y border-[#2E5E88]/25 font-bold text-left text-[#2E5E88] dark:text-[#5584B4]">
                    <td colSpan={15} className="py-1.5 px-3.5 uppercase text-[11px] tracking-wider">
                      trading values transferred to trading account
                    </td>
                  </tr>

                  {/* Line 10: unit sales */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 font-bold">
                    <td className="py-2 px-3.5 text-left text-slate-800 dark:text-slate-200 w-[260px] min-w-[260px] max-w-[260px]">
                      unit sales
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right text-slate-900 dark:text-white font-bold">
                        {m.line10.toLocaleString()}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {calculationGrid.totals.sumLine10.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>

                  {/* Line 11: revenue */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 font-bold text-emerald-600 dark:text-emerald-400">
                    <td className="py-2 px-3.5 text-left w-[260px] min-w-[260px] max-w-[260px]">
                      revenue
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right font-bold">
                        {m.line11.toLocaleString()}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold">
                      {calculationGrid.totals.sumLine11.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>

                  {/* Line 12: cost of sales */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 font-bold text-rose-600 dark:text-rose-400">
                    <td className="py-2 px-3.5 text-left w-[260px] min-w-[260px] max-w-[260px]">
                      cost of sales
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right font-bold">
                        {m.line12.toLocaleString()}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold">
                      {calculationGrid.totals.sumLine12.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>

                  {/* Line 13: gross profit */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 font-bold bg-[#2E5E88]/10 text-[#2E5E88] dark:text-[#5584B4]">
                    <td className="py-2 px-3.5 text-left w-[260px] min-w-[260px] max-w-[260px]">
                      gross profit
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right font-bold">
                        {m.line13.toLocaleString()}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold">
                      {calculationGrid.totals.sumLine13.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>

                  {/* Line 14: gross profit margin % */}
                  <tr className="border-b-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 font-bold text-slate-600 dark:text-slate-400">
                    <td className="py-2 px-3.5 text-left text-[11px] w-[260px] min-w-[260px] max-w-[260px]">
                      gross profit margin %
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right font-bold text-[11px]">
                        {m.line14.toFixed(2)}%
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-[11px]">
                      {calculationGrid.totals.avgLine14.toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>

                  {/* --------------------------------------------------------- */}
                  {/* SECTION 3: GROSS PROFIT ADJUSTMENTS                       */}
                  {/* --------------------------------------------------------- */}
                  <tr className="bg-[#2E5E88]/15 border-y border-[#2E5E88]/25 font-bold text-left text-[#2E5E88] dark:text-[#5584B4]">
                    <td colSpan={15} className="py-1.5 px-3.5 uppercase text-[11px] tracking-wider">
                      gross profit adjustments values transferred to trading account
                    </td>
                  </tr>

                  {/* Line 15: sales commission (Radio button on right) */}
                  <tr className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 font-bold ${selectedAdjustableKey === 'line15' ? 'bg-blue-500/10' : ''}`}>
                    <td className="py-2.5 px-3.5 text-left font-bold text-slate-800 dark:text-slate-200 w-[260px] min-w-[260px] max-w-[260px]">
                      sales commission
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right font-bold text-rose-500">
                        {m.line15Amt.toLocaleString()}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-rose-500">
                      {calculationGrid.totals.sumLine15Amt.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center w-[60px]" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="revenue-adjustable-metric"
                        checked={selectedAdjustableKey === 'line15'}
                        onChange={() => setSelectedAdjustableKey('line15')}
                        className="w-4 h-4 text-[#2E5E88] focus:ring-[#2E5E88] cursor-pointer"
                        aria-label="Select sales commission for adjustment"
                      />
                    </td>
                  </tr>

                  {/* Line 16: inventory adjustments (Radio button on right) */}
                  <tr className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 font-bold ${selectedAdjustableKey === 'line16' ? 'bg-blue-500/10' : ''}`}>
                    <td className="py-2.5 px-3.5 text-left font-bold text-slate-800 dark:text-slate-200 w-[260px] min-w-[260px] max-w-[260px]">
                      inventory adjustments
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right font-bold text-rose-500">
                        {m.line16Amt.toLocaleString()}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-rose-500">
                      {calculationGrid.totals.sumLine16Amt.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center w-[60px]" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="revenue-adjustable-metric"
                        checked={selectedAdjustableKey === 'line16'}
                        onChange={() => setSelectedAdjustableKey('line16')}
                        className="w-4 h-4 text-[#2E5E88] focus:ring-[#2E5E88] cursor-pointer"
                        aria-label="Select inventory adjustments for adjustment"
                      />
                    </td>
                  </tr>

                  {/* Line 17: manufacturing variance */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-2 px-3.5 text-left font-bold text-slate-700 dark:text-slate-300 w-[260px] min-w-[260px] max-w-[260px]">
                      manufacturing variance
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {m.line17.toLocaleString()}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {calculationGrid.totals.sumLine17.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>

                  {/* Line 18: gross profit adjustments */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 font-bold bg-[#2E5E88]/5 text-[#2E5E88] dark:text-[#5584B4]">
                    <td className="py-2 px-3.5 text-left w-[260px] min-w-[260px] max-w-[260px]">
                      gross profit adjustments
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right font-bold">
                        {m.line18.toLocaleString()}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold">
                      {calculationGrid.totals.sumLine18.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>

                  {/* Line 19: other income (Radio button on right) */}
                  <tr className={`border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 font-bold ${selectedAdjustableKey === 'line19' ? 'bg-blue-500/10' : ''}`}>
                    <td className="py-2.5 px-3.5 text-left text-slate-800 dark:text-slate-200 w-[260px] min-w-[260px] max-w-[260px]">
                      other income
                    </td>
                    {calculationGrid.months.map((m) => (
                      <td key={m.absMonth} className="py-2 px-2.5 text-right font-bold text-slate-900 dark:text-white">
                        {m.line19.toLocaleString()}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold">
                      {calculationGrid.totals.sumLine19.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center w-[60px]" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="revenue-adjustable-metric"
                        checked={selectedAdjustableKey === 'line19'}
                        onChange={() => setSelectedAdjustableKey('line19')}
                        className="w-4 h-4 text-[#2E5E88] focus:ring-[#2E5E88] cursor-pointer"
                        aria-label="Select other income for adjustment"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. EMBEDDED ADJUSTMENT SLIDER (BaseRateAdjustmentTool with cycle arrows & year sync) */}
          {activeSliderItem && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    ADJUSTMENT SLIDER — {activeSliderItem.name}
                  </span>
                </div>

                {/* Next / Previous item arrows */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 lowercase mr-1">cycle rates:</span>
                  <button
                    type="button"
                    onClick={() => handleCycleSliderItem('prev')}
                    className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Previous adjustable rate"
                  >
                    <ChevronLeft className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCycleSliderItem('next')}
                    className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Next adjustable rate"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                  </button>
                </div>
              </div>

              <BaseRateAdjustmentTool
                theme={theme}
                item={activeSliderItem}
                selectedYear={activeYear}
                onSelectYear={(yr) => setActiveYear(yr)}
                onUpdateMonthlyValues={handleSliderUpdateMonthlyValues}
                onUpdateBaseRate={handleSliderUpdateBaseRate}
                onPrevItem={() => handleCycleSliderItem('prev')}
                onNextItem={() => handleCycleSliderItem('next')}
              />
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: CHARTS TAB (UNIT SALES VS CAPACITY & COST VS SELLING PRICE)    */}
      {/* ===================================================================== */}
      {activeSubTab === 'charts' && currentProduct && calculationGrid && (
        <div className="space-y-6 animate-in fade-in duration-150">

          {/* Top Controls: Product Selector & Year Selector */}
          <div
            className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-xs ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold lowercase text-slate-700 dark:text-slate-300">
                filter charts:
              </span>

              {/* Product Selector */}
              <select
                value={activeProductIdx}
                onChange={(e) => setActiveProductIdx(Number(e.target.value))}
                className={`py-1.5 px-3 rounded-xl border text-xs font-bold lowercase cursor-pointer ${
                  isDark ? 'bg-[#0E1322] border-[#222F4C] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                }`}
              >
                {state.revenueItems.map((prod, idx) => (
                  <option key={prod.id} value={idx}>
                    {prod.name}
                  </option>
                ))}
              </select>

              {/* Year Buttons */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setActiveYear(yr)}
                    className={`py-1 px-3 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      activeYear === yr
                        ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                        : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
                    }`}
                  >
                    year {yr}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#5584B4]">
              {currentProduct.name} · Year {activeYear}
            </span>
          </div>

          {/* CHART 1: UNIT SALES VS CAPACITY (FULL WIDTH BAR CHART) */}
          <div
            className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  UNIT SALES VS CAPACITY (YEAR {activeYear})
                </h3>
              </div>

              {/* Capacity Utilization Summary Badge */}
              {(() => {
                const totalSales = calculationGrid.totals.sumLine10;
                const monthlyCapacity = (currentProduct.dailyCapacity || 1500) * 28;
                const yearCapacity = monthlyCapacity * 12;
                const utilizationPct = yearCapacity > 0 ? (totalSales / yearCapacity) * 100 : 0;
                return (
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    utilizationPct > 100
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  }`}>
                    Year Utilization: {utilizationPct.toFixed(1)}% ({totalSales.toLocaleString()} / {yearCapacity.toLocaleString()} units)
                  </span>
                );
              })()}
            </div>

            {/* Visual Bar Chart: 100% Full Width Spanning Across Page */}
            {(() => {
              const monthlyCapacity = Math.max(0, Number(currentProduct.dailyCapacity) || 1500) * 28;
              const rawMax = Math.max(
                monthlyCapacity * 1.25,
                ...calculationGrid.months.map((m) => Math.max(Number(m.line10) || 0, monthlyCapacity))
              );
              const maxVal = rawMax > 0 ? rawMax : 1000;
              const capRatio = Math.max(0, Math.min(100, (monthlyCapacity / maxVal) * 100));

              return (
                <div className="space-y-3 pt-2">
                  <div className="relative h-64 border-b border-slate-200 dark:border-slate-800 pb-2">
                    {/* Capacity Reference Line spanning 100% full width */}
                    <div
                      style={{ bottom: `${capRatio}%` }}
                      className="absolute left-0 right-0 border-t-2 border-dashed border-amber-500 z-10 pointer-events-none flex items-center justify-end pr-2"
                    >
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-white/90 dark:bg-[#101626]/90 px-1.5 py-0.5 rounded -translate-y-1/2 shadow-xs border border-amber-500/30">
                        Capacity: {monthlyCapacity.toLocaleString()} u/mo
                      </span>
                    </div>

                    {/* 12 Columns spanning 100% width */}
                    <div className="grid grid-flow-col auto-cols-fr gap-2 sm:gap-3 items-end h-full">
                      {calculationGrid.months.map((m) => {
                        const monthUnits = Number(m.line10) || 0;
                        const heightPct = maxVal > 0 ? (monthUnits / maxVal) * 100 : 0;
                        const isOverCap = monthUnits > monthlyCapacity;

                        return (
                          <div key={m.monthNum} className="flex flex-col items-center h-full justify-end group relative">
                            {/* Hover Tooltip */}
                            <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg whitespace-nowrap pointer-events-none z-20 font-bold shadow-lg">
                              <div>Month {m.monthNum}: {monthUnits.toLocaleString()} units</div>
                              <div className="text-[9px] text-slate-300 font-normal">
                                {m.daysWorked} days × {m.line1.toLocaleString()} daily units
                              </div>
                            </div>

                            {/* Value label above bar */}
                            <span className="text-[9px] font-bold tabular-nums mb-1 text-slate-700 dark:text-slate-300">
                              {monthUnits >= 1000 ? `${(monthUnits / 1000).toFixed(0)}k` : monthUnits}
                            </span>

                            {/* Bar */}
                            <div
                              style={{ height: `${Math.max(monthUnits > 0 ? 4 : 0, heightPct)}%` }}
                              className={`w-full max-w-[48px] rounded-t-md transition-all duration-300 ${
                                isOverCap
                                  ? 'bg-gradient-to-t from-rose-600 to-rose-400 group-hover:to-rose-300'
                                  : 'bg-gradient-to-t from-[#2E5E88] to-[#5584B4] group-hover:to-sky-400'
                              } group-hover:brightness-110 shadow-xs`}
                            />

                            {/* Month Label on X-Axis */}
                            <span className="text-[10px] font-bold text-slate-500 mt-2 block text-center">
                              M{m.monthNum}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend & Monthly Summary Footnote */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-xs bg-[#2E5E88]"></span>
                        <span className="text-slate-600 dark:text-slate-300 font-bold">Unit Sales</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-0.5 border-t-2 border-dashed border-amber-500"></span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">Monthly Capacity Limit</span>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 lowercase">
                      operating constraint: daily capacity x days worked = {(currentProduct.dailyCapacity || 1500) * 28} units/month
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* CHART 2: UNIT COST, GROSS PROFIT & SELLING PRICE (BAR CHART SPANNING FULL PAGE) */}
          <div
            className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  UNIT COST, GROSS PROFIT & SELLING PRICE (YEAR {activeYear})
                </h3>
              </div>

              {/* Average Gross Margin Badge */}
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Average Margin: {calculationGrid.totals.avgLine9.toFixed(1)}% GP (Unit GP: {calculationGrid.totals.avgLine8.toFixed(2)})
              </span>
            </div>

            {/* Visual Grouped Bar Chart: 100% Full Width Spanning Across Page */}
            {(() => {
              const rawMax = Math.max(
                0.1,
                ...calculationGrid.months.map((m) =>
                  Math.max(
                    Number(m.line7) || 0,
                    Math.abs(Number(m.line6) || 0),
                    Number(m.line8) || 0
                  )
                )
              );
              const maxVal = rawMax * 1.15;

              return (
                <div className="space-y-3 pt-2">
                  <div className="relative h-64 border-b border-slate-200 dark:border-slate-800 pb-2">
                    {/* 12 Grouped Columns Spanning 100% of Width */}
                    <div className="grid grid-flow-col auto-cols-fr gap-2 sm:gap-3 items-end h-full">
                      {calculationGrid.months.map((m) => {
                        const costVal = Math.abs(Number(m.line6) || 0);
                        const gpVal = Number(m.line8) || 0;
                        const sellVal = Number(m.line7) || 0;

                        const costHeightPct = maxVal > 0 ? (costVal / maxVal) * 100 : 0;
                        const gpHeightPct = maxVal > 0 ? (gpVal / maxVal) * 100 : 0;
                        const sellHeightPct = maxVal > 0 ? (sellVal / maxVal) * 100 : 0;

                        return (
                          <div key={m.monthNum} className="flex flex-col items-center h-full justify-end group relative">
                            {/* Hover Tooltip with Full Economics */}
                            <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg whitespace-nowrap pointer-events-none z-20 font-bold shadow-lg space-y-0.5">
                              <div className="text-slate-300 font-bold">Month {m.monthNum} Unit Economics:</div>
                              <div className="text-emerald-400">Selling Price: {sellVal.toFixed(2)}</div>
                              <div className="text-rose-400">Cost Price: {costVal.toFixed(2)}</div>
                              <div className="text-[#5584B4]">Gross Profit: {gpVal.toFixed(2)} ({m.line9.toFixed(1)}%)</div>
                            </div>

                            {/* Value label above group: Selling Price */}
                            <span className="text-[9px] font-bold tabular-nums mb-1 text-emerald-600 dark:text-emerald-400">
                              {sellVal.toFixed(2)}
                            </span>

                            {/* 3 Grouped Bars: Cost, Gross Profit, Selling Price */}
                            <div className="flex items-end justify-center gap-0.5 sm:gap-1 w-full max-w-[56px] h-full">
                              {/* 1. Unit Cost Price Bar (Rose) */}
                              <div
                                style={{ height: `${Math.max(costVal > 0 ? 4 : 0, costHeightPct)}%` }}
                                className="w-1/3 rounded-t-xs sm:rounded-t-sm bg-gradient-to-t from-rose-600 to-rose-400 hover:brightness-110 transition-all duration-300 shadow-xs"
                                title={`Cost Price: ${costVal.toFixed(2)}`}
                              />

                              {/* 2. Unit Gross Profit Bar (Blue) */}
                              <div
                                style={{ height: `${Math.max(gpVal > 0 ? 4 : 0, gpHeightPct)}%` }}
                                className="w-1/3 rounded-t-xs sm:rounded-t-sm bg-gradient-to-t from-[#2E5E88] to-[#5584B4] hover:brightness-110 transition-all duration-300 shadow-xs"
                                title={`Gross Profit: ${gpVal.toFixed(2)}`}
                              />

                              {/* 3. Unit Selling Price Bar (Emerald) */}
                              <div
                                style={{ height: `${Math.max(sellVal > 0 ? 4 : 0, sellHeightPct)}%` }}
                                className="w-1/3 rounded-t-xs sm:rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400 hover:brightness-110 transition-all duration-300 shadow-xs"
                                title={`Selling Price: ${sellVal.toFixed(2)}`}
                              />
                            </div>

                            {/* Month Label on X-Axis */}
                            <span className="text-[10px] font-bold text-slate-500 mt-2 block text-center">
                              M{m.monthNum}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grouped Legend */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-xs bg-rose-500"></span>
                        <span className="text-slate-600 dark:text-slate-300 font-bold">Unit Cost Price</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-xs bg-[#2E5E88]"></span>
                        <span className="text-slate-600 dark:text-slate-300 font-bold">Unit Gross Profit</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
                        <span className="text-slate-600 dark:text-slate-300 font-bold">Unit Selling Price</span>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 lowercase">
                      relationship: unit selling price = unit cost price + unit gross profit
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Legend & KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              {/* 1. Unit Selling Price Card */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Unit Selling Price</span>
                </div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {calculationGrid.totals.avgLine7.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-400 block lowercase">
                  Formula: - unit cost price / (1 - gp margin %)
                </span>
              </div>

              {/* 2. Unit Cost Price Card */}
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                  <span>Unit Cost Price</span>
                </div>
                <div className="text-base font-bold text-rose-600 dark:text-rose-400">
                  {Math.abs(calculationGrid.totals.avgLine6).toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-400 block lowercase">
                  Formula: production unit cost / (1 - mfg margin %)
                </span>
              </div>

              {/* 3. Unit Gross Profit Card */}
              <div className="p-3 rounded-xl bg-[#2E5E88]/10 border border-[#2E5E88]/20 space-y-1">
                <div className="flex items-center gap-1.5 text-[#2E5E88] dark:text-[#5584B4] font-bold">
                  <span className="w-3 h-3 rounded-full bg-[#2E5E88] inline-block"></span>
                  <span>Unit Gross Profit</span>
                </div>
                <div className="text-base font-bold text-[#2E5E88] dark:text-[#5584B4]">
                  {calculationGrid.totals.avgLine8.toFixed(2)} ({calculationGrid.totals.avgLine9.toFixed(1)}% GP)
                </div>
                <span className="text-[10px] text-slate-400 block lowercase">
                  Formula: unit cost price + unit selling price
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueStep;
