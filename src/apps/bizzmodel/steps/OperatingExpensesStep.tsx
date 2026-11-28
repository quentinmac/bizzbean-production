import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  Sliders,
  TrendingUp,
  Filter,
  Layers,
  Calendar,
  Info,
  CheckCircle2,
  ArrowRight,
  PieChart,
  BarChart2,
  Percent,
  ShieldCheck,
  Building,
} from 'lucide-react';
import {
  BizzModelState,
  ExpenseItem,
  ExpenseType,
  OperatingExpensesSettings,
  PlatformForecastAppId,
  DEFAULT_EXPENSE_ITEMS,
  DEFAULT_OPEX_SETTINGS,
} from '../constants';
import { COA_OPERATING_EXPENSES } from '../data/coaExpenses';
import { calculateMonthlyProjections } from '../utils/revenueCalc';
import { BaseRateAdjustmentTool } from '../../bizzdynamics/components/BaseRateAdjustmentTool';
import { AssumptionRateItem } from '../../bizzdynamics/types';

interface OperatingExpensesStepProps {
  theme?: 'light' | 'dark';
  mode: PlatformForecastAppId; // 'bizzdynamics' | 'rolling-forecast' | 'hi-level-forecast' | 'bizzmodel'
  state: BizzModelState;
  onUpdateState: (updater: (prev: BizzModelState) => BizzModelState) => void;
  subTab?: 'assumptions' | 'results' | 'charts' | 'data entry' | 'data-entry';
  onSelectSubTab?: (tab: 'assumptions' | 'results' | 'charts') => void;
}

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type CategoryKey = 'cosShareOfFixed' | 'opexVariable' | 'opexFixed';

const CATEGORY_DEFINITIONS: Record<CategoryKey, { label: string; tradingAccountTarget: string; badge: string }> = {
  cosShareOfFixed: {
    label: 'Cost of Sales — Share of Fixed Overheads',
    tradingAccountTarget: 'Cost of Sales — Fixed',
    badge: 'COS Fixed Allocation',
  },
  opexVariable: {
    label: 'Operating Expenses — Variable',
    tradingAccountTarget: 'Expenses — Variable',
    badge: 'Variable Overheads',
  },
  opexFixed: {
    label: 'Operating Expenses — Fixed',
    tradingAccountTarget: 'Expenses — Fixed',
    badge: 'Fixed Overheads',
  },
};

export const OperatingExpensesStep: React.FC<OperatingExpensesStepProps> = ({
  theme = 'light',
  mode,
  state,
  onUpdateState,
  subTab: subTabProp,
  onSelectSubTab,
}) => {
  const isDark = theme === 'dark';

  // Normalize subtabs (no duplicate tab buttons rendered in step header per user instructions)
  const normalizedSubTab = useMemo<'assumptions' | 'results' | 'charts'>(() => {
    if (!subTabProp) return 'assumptions';
    if (subTabProp === 'data entry' || subTabProp === 'data-entry') return 'assumptions';
    return subTabProp;
  }, [subTabProp]);

  const [internalSubTab, setInternalSubTab] = useState<'assumptions' | 'results' | 'charts'>(normalizedSubTab);
  const activeSubTab = subTabProp ? normalizedSubTab : internalSubTab;

  // Active Year for 12-month views (Years 1 to 5)
  const [activeYear, setActiveYear] = useState<number>(1);

  // Selected Category Key for Results tab & Adjustment Slider
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<CategoryKey>('cosShareOfFixed');

  // Charts filters
  const [chartViewMode, setChartViewMode] = useState<'monthly' | '5year'>('monthly');
  const [chartYear, setChartYear] = useState<number>(1);
  const [chartDepartmentFilter, setChartDepartmentFilter] = useState<string>('all');
  const [chartTypeFilter, setChartTypeFilter] = useState<'all' | ExpenseType>('all');

  // Ensure expenses exist in state
  const expenses: ExpenseItem[] = useMemo(() => {
    if (state.expenses && state.expenses.length > 0) {
      return state.expenses;
    }
    return DEFAULT_EXPENSE_ITEMS;
  }, [state.expenses]);

  // Ensure opexSettings exist in state
  const opexSettings: OperatingExpensesSettings = useMemo(() => {
    return state.opexSettings || DEFAULT_OPEX_SETTINGS;
  }, [state.opexSettings]);

  // Max expense limits by App Mode
  // • bizzdynamics: limit to 5 expense items
  // • rolling forecast: 3 preset expenses
  // • hi-level forecast: 3 preset expenses
  // • bizzmodel: enable selection of all expenses (unlimited)
  const expenseLimit =
    mode === 'bizzdynamics' ? 5 : (mode === 'rolling-forecast' || mode === 'hi-level-forecast') ? 3 : Infinity;
  const isPresetMode = mode === 'rolling-forecast' || mode === 'hi-level-forecast';

  // Setup step departments with distribution percentages
  const setupDepartments = useMemo(() => {
    if (state.businessDetails?.departments && state.businessDetails.departments.length > 0) {
      return state.businessDetails.departments;
    }
    return [
      { id: 'dep-1', name: 'administration', distributionPct: 40 },
      { id: 'dep-2', name: 'commercial & sales', distributionPct: 30 },
      { id: 'dep-3', name: 'product & engineering', distributionPct: 20 },
      { id: 'dep-4', name: 'operations', distributionPct: 10 },
    ];
  }, [state.businessDetails]);

  // -------------------------------------------------------------------------
  // Handlers: Expenses & Settings
  // -------------------------------------------------------------------------
  const handleUpdateAllocationPct = (pct: number) => {
    onUpdateState((prev) => {
      const currentSettings = prev.opexSettings || DEFAULT_OPEX_SETTINGS;
      return {
        ...prev,
        opexSettings: {
          ...currentSettings,
          allocationToCostOfSalesPct: Math.max(0, Math.min(100, pct)),
        },
      };
    });
  };

  const handleUpdateExpense = (expId: string, patch: Partial<ExpenseItem>) => {
    onUpdateState((prev) => {
      const currentExpenses = prev.expenses && prev.expenses.length > 0 ? prev.expenses : DEFAULT_EXPENSE_ITEMS;
      const updated = currentExpenses.map((exp) => {
        if (exp.id === expId) {
          const updatedItem = { ...exp, ...patch };
          // Keep monthlyAmount in sync with baseRateMonthly
          if (patch.baseRateMonthly !== undefined) {
            updatedItem.monthlyAmount = patch.baseRateMonthly;
          }
          return updatedItem;
        }
        return exp;
      });
      return { ...prev, expenses: updated };
    });
  };

  const handleUpdateHiLevelPreset = (key: 'cosFixedPct' | 'opexFixedPct' | 'opexVarPct', val: number) => {
    onUpdateState((prev) => {
      const currentSettings = prev.opexSettings || DEFAULT_OPEX_SETTINGS;
      const currentPreset = currentSettings.hiLevelPreset || {
        cosFixedPct: 1.00,
        opexFixedPct: 1.00,
        opexVarPct: 1.00,
      };
      return {
        ...prev,
        opexSettings: {
          ...currentSettings,
          hiLevelPreset: {
            ...currentPreset,
            [key]: Math.max(0, val),
          },
        },
      };
    });
  };

  const handlePopulateAllCoaExpenses = () => {
    const existingNames = new Map(expenses.map((e) => [e.name.toLowerCase(), e]));
    const allExpenses: ExpenseItem[] = COA_OPERATING_EXPENSES.map((coa, idx) => {
      const existing = existingNames.get(coa.name.toLowerCase());
      if (existing) return existing;
      return {
        id: `exp-coa-${idx}-${Date.now()}`,
        name: coa.name,
        category: coa.subCategory,
        department: coa.defaultDepartment,
        type: coa.defaultType,
        startMonth: 1,
        pctOfRevenue: coa.defaultType === 'variable' ? 1.00 : undefined,
        baseRateMonthly: 0,
        monthlyAmount: 0,
        growthRatePct: 0,
        monthlyAdjustmentPct: new Array(60).fill(0),
      };
    });

    onUpdateState((prev) => ({
      ...prev,
      expenses: allExpenses,
    }));
  };

  const handleAddExpense = () => {
    if (expenses.length >= expenseLimit) return;
    const newId = `exp-${Date.now()}`;
    const existingNames = new Set(expenses.map((e) => e.name.toLowerCase()));
    const availableOption = COA_OPERATING_EXPENSES.find((c) => !existingNames.has(c.name.toLowerCase())) || COA_OPERATING_EXPENSES[0];

    const newItem: ExpenseItem = {
      id: newId,
      name: availableOption ? availableOption.name : 'general expense',
      category: availableOption ? availableOption.subCategory : 'general & administrative',
      department: availableOption ? availableOption.defaultDepartment : 'administration',
      type: availableOption ? availableOption.defaultType : 'fixed',
      startMonth: 1,
      pctOfRevenue: availableOption?.defaultType === 'variable' ? 1.00 : undefined,
      baseRateMonthly: 100000,
      monthlyAmount: 100000,
      growthRatePct: 0,
      monthlyAdjustmentPct: new Array(60).fill(0),
    };

    onUpdateState((prev) => ({
      ...prev,
      expenses: [...(prev.expenses && prev.expenses.length > 0 ? prev.expenses : DEFAULT_EXPENSE_ITEMS), newItem],
    }));
  };

  const isFullModelMode = mode === 'bizzmodel' || mode === 'bizzforecasta' || mode === 'bizzbudget';

  const handleRemoveExpense = (expId: string) => {
    if (!isFullModelMode && expenses.length <= 1) return;
    onUpdateState((prev) => ({
      ...prev,
      expenses: (prev.expenses && prev.expenses.length > 0 ? prev.expenses : DEFAULT_EXPENSE_ITEMS).filter((e) => e.id !== expId),
    }));
  };

  // -------------------------------------------------------------------------
  // Projections & Monthly Matrices across 60 Months (Synced to platform app mode)
  // -------------------------------------------------------------------------
  const projections = useMemo(() => {
    return calculateMonthlyProjections(state, 60, undefined, mode);
  }, [state, mode]);

  const opexMonthlyMatrix = useMemo(() => {
    const cosShareOfFixedSeries = projections.map((p) => p.cosOverheads ?? 0);
    const opexVariableSeries = projections.map((p) => p.exVariable ?? 0);
    const opexFixedSeries = projections.map((p) => p.exOverheads ?? 0);
    const totalOpexSeries = projections.map((p) => (p.exVariable ?? 0) + (p.exOverheads ?? 0));
    const grandTotalSeries = projections.map((p) => (p.cosOverheads ?? 0) + (p.exVariable ?? 0) + (p.exOverheads ?? 0));

    return {
      cosShareOfFixedSeries,
      opexVariableSeries,
      opexFixedSeries,
      totalOpexSeries,
      grandTotalSeries,
    };
  }, [projections]);

  // Run-rate calculations for Assumptions summary cards
  const summaryStats = useMemo(() => {
    const revMonth1 = projections[0]?.revenue || 220000;
    const allocPct = opexSettings.allocationToCostOfSalesPct ?? 1.00;

    if (isPresetMode) {
      const cosPct = opexSettings.hiLevelPreset?.cosFixedPct ?? 1.00;
      const opexFixPct = opexSettings.hiLevelPreset?.opexFixedPct ?? 1.00;
      const opexVarPct = opexSettings.hiLevelPreset?.opexVarPct ?? 1.00;

      const cosShareRunRate = revMonth1 * (cosPct / 100);
      const opexFixedRunRate = revMonth1 * (opexFixPct / 100);
      const variableRunRate = revMonth1 * (opexVarPct / 100);
      const fixedRunRate = cosShareRunRate + opexFixedRunRate;
      const totalOverheadsRunRate = fixedRunRate + variableRunRate;
      const totalOpexRunRate = opexFixedRunRate + variableRunRate;

      return {
        fixedRunRate,
        variableRunRate,
        totalOverheadsRunRate,
        cosShareRunRate,
        opexFixedRunRate,
        totalOpexRunRate,
        baselineCos: cosShareRunRate,
        baselineOpexFixed: opexFixedRunRate,
        baselineOpexVar: variableRunRate,
        effectiveHiCos: cosShareRunRate,
        effectiveHiOpexFixed: opexFixedRunRate,
        effectiveHiOpexVar: variableRunRate,
        detailedCosShare: 0,
        detailedOpexFixed: 0,
        detailedOpexVar: 0,
        detailedFixed: 0,
        detailedVariable: 0,
      };
    }

    // Default / bizzdynamics & bizzmodel (standard detailed expenses):
    let fixedRunRate = 0;
    let variableRunRate = 0;

    expenses.forEach((e) => {
      if (e.type === 'variable') {
        if (e.pctOfRevenue && e.pctOfRevenue > 0) {
          variableRunRate += revMonth1 * (e.pctOfRevenue / 100);
        } else {
          variableRunRate += e.baseRateMonthly || e.monthlyAmount || 0;
        }
      } else {
        fixedRunRate += e.baseRateMonthly || e.monthlyAmount || 0;
      }
    });

    const cosShareRunRate = fixedRunRate * (allocPct / 100);
    const opexFixedRunRate = fixedRunRate - cosShareRunRate;
    const totalOverheadsRunRate = fixedRunRate + variableRunRate;
    const totalOpexRunRate = opexFixedRunRate + variableRunRate;

    return {
      fixedRunRate,
      variableRunRate,
      totalOverheadsRunRate,
      cosShareRunRate,
      opexFixedRunRate,
      totalOpexRunRate,
      baselineCos: 0,
      baselineOpexFixed: 0,
      baselineOpexVar: 0,
      effectiveHiCos: 0,
      effectiveHiOpexFixed: 0,
      effectiveHiOpexVar: 0,
      detailedCosShare: cosShareRunRate,
      detailedOpexFixed: opexFixedRunRate,
      detailedOpexVar: variableRunRate,
      detailedFixed: fixedRunRate,
      detailedVariable: variableRunRate,
    };
  }, [expenses, opexSettings, projections, isPresetMode, mode]);

  // -------------------------------------------------------------------------
  // BaseRateAdjustmentTool Linkage for Selected Category
  // -------------------------------------------------------------------------
  const selectedAdjustmentItem: AssumptionRateItem = useMemo(() => {
    const adjustments =
      opexSettings.categoryAdjustments?.[selectedCategoryKey] || new Array(60).fill(0);
    return {
      id: selectedCategoryKey,
      stepId: 4,
      stepName: 'operating expenses',
      name: CATEGORY_DEFINITIONS[selectedCategoryKey].label,
      description: `Adjustments for ${CATEGORY_DEFINITIONS[selectedCategoryKey].label}`,
      baseRate: 0,
      unit: '%',
      changeType: 'percentage',
      monthlyValues: adjustments,
    };
  }, [opexSettings, selectedCategoryKey]);

  const handleSliderUpdateMonthlyValues = (itemId: string, updatedValues: number[]) => {
    onUpdateState((prev) => {
      const currentSettings = prev.opexSettings || DEFAULT_OPEX_SETTINGS;
      const currentCatAdjustments = currentSettings.categoryAdjustments || {
        cosShareOfFixed: new Array(60).fill(0),
        opexVariable: new Array(60).fill(0),
        opexFixed: new Array(60).fill(0),
      };

      return {
        ...prev,
        opexSettings: {
          ...currentSettings,
          categoryAdjustments: {
            ...currentCatAdjustments,
            [selectedCategoryKey]: updatedValues,
          },
        },
      };
    });
  };

  const handleSliderUpdateBaseRate = (itemId: string, newBaseRate: number) => {
    handleSliderUpdateMonthlyValues(itemId, new Array(60).fill(newBaseRate));
  };

  const handleCycleCategory = (direction: 'prev' | 'next') => {
    const keys: CategoryKey[] = ['cosShareOfFixed', 'opexVariable', 'opexFixed'];
    const idx = keys.indexOf(selectedCategoryKey);
    let nextIdx = direction === 'next' ? idx + 1 : idx - 1;
    if (nextIdx < 0) nextIdx = keys.length - 1;
    if (nextIdx >= keys.length) nextIdx = 0;
    setSelectedCategoryKey(keys[nextIdx]);
  };

  return (
    <div className={`space-y-6 font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* =================================================================== */}
      {/* HEADER BAR (Matching Employment Standard)                           */}
      {/* =================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold uppercase tracking-tight text-slate-900 dark:text-white">
              OPERATING EXPENSES (OPEX)
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-[#2E5E88]/10 text-[#2E5E88] dark:text-[#5584B4]">
              {mode}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Define overhead expenses, recurring annuity cycles, variable revenue allocations, and cost of sales splits.
          </p>
        </div>
      </div>

      {/* =================================================================== */}
      {/* STAGE 1: ASSUMPTIONS TAB                                            */}
      {/* =================================================================== */}
      {activeSubTab === 'assumptions' && (
        <div className="space-y-6">
          {/* Top Operational Metrics & Fixed Expenses Allocation Banner */}
          <div className={`p-4.5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#2E5E88] dark:text-[#5584B4]" />
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                  COST OF SALES ALLOCATION RULE
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <Info className="w-3.5 h-3.5" />
                <span>RULE: Variable expenses cannot be allocated to Cost of Sales</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-stretch">
              {/* Card 1: Allocation % Input or High-Level Preset Note */}
              <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-[#D8CEBC]'
              }`}>
                {isPresetMode ? (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Preset Allocation Basis:
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      High-Level % of Revenue
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-2">
                      Expenses set directly as % of revenue per high-level forecast.
                    </span>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                      Allocation of Fixed Expenses to Cost of Sales:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={opexSettings.allocationToCostOfSalesPct}
                        onChange={(e) => handleUpdateAllocationPct(parseFloat(e.target.value) || 0)}
                        className={`w-20 p-2 rounded-lg border text-sm font-bold text-right ${
                          isDark ? 'bg-[#101626] border-[#222F4C] text-slate-100' : 'bg-white border-[#D8CEBC] text-slate-900'
                        }`}
                      />
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-2">
                      Transfers {opexSettings.allocationToCostOfSalesPct}% of all fixed overheads to Cost of Sales — Fixed.
                    </span>
                  </div>
                )}
              </div>

              {/* Card 2: Total Fixed Overheads (Gross baseline before COS split) */}
              <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-[#D8CEBC]'
              }`}>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Total Fixed Overheads:
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                    {Math.round(summaryStats.fixedRunRate).toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-2">
                  Gross monthly baseline before COS split
                </span>
              </div>

              {/* Card 3: COS Share of Fixed Overheads */}
              <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-[#D8CEBC]'
              }`}>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    COS Share of Fixed Overheads:
                  </span>
                  <span className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                    {Math.round(summaryStats.cosShareRunRate).toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-2">
                  Transfers to Cost of Sales (Fixed)
                </span>
              </div>

              {/* Card 4: Variable Overheads (Dedicated card adjacent to COS Share) */}
              <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-[#0E1322] border-amber-500/30' : 'bg-amber-50/40 border-amber-300/80 shadow-xs'
              }`}>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
                    Variable Overheads:
                  </span>
                  <span className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                    {Math.round(summaryStats.variableRunRate).toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 block mt-2">
                  Transfers to Expenses — Variable
                </span>
              </div>

              {/* Card 5: Net Operating Expenses (Fixed less COS share + Variable) */}
              <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-[#D8CEBC]'
              }`}>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#2E5E88] dark:text-[#5584B4] block">
                    Net Operating Expenses:
                  </span>
                  <span className="text-base font-bold text-[#2E5E88] dark:text-[#5584B4] mt-1 block">
                    {Math.round(summaryStats.totalOpexRunRate).toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-2">
                  Fixed ({Math.round(summaryStats.opexFixedRunRate).toLocaleString()}) + Variable ({Math.round(summaryStats.variableRunRate).toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          {/* Operating Expenses Listing Container */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block">
                  OPERATING EXPENSES LISTING
                </span>
                <p className="text-[11px] text-slate-500">
                  {isPresetMode
                    ? 'Preset operating expenses calculated as a percentage of revenue for high-level forecasting.'
                    : isFullModelMode
                    ? 'Complete Chart of Accounts (COA) listing with unlimited operating expense items, annuity cycles, and variable allocations.'
                    : 'Select up to 5 expenses from the Chart of Accounts (COA) master catalog. Set launch start months, annuity recurrence, and variable revenue allocations.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {mode === 'bizzdynamics' && (
                  <span className="text-xs font-bold text-slate-500 pr-2">
                    {expenses.length} of 5 items
                  </span>
                )}
                {isFullModelMode && (
                  <>
                    <button
                      type="button"
                      onClick={handlePopulateAllCoaExpenses}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold uppercase transition-colors ${
                        isDark
                          ? 'bg-[#0E1322] border-[#222F4C] text-slate-300 hover:text-white'
                          : 'bg-slate-100 border-[#D8CEBC] text-slate-700 hover:bg-slate-200'
                      }`}
                      title="Populate all expenses from the Chart of Accounts catalog"
                    >
                      List All COA Expenses ({COA_OPERATING_EXPENSES.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleAddExpense}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold uppercase shadow-xs transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Expense</span>
                    </button>
                  </>
                )}
                {mode === 'bizzdynamics' && expenses.length < expenseLimit && (
                  <button
                    type="button"
                    onClick={handleAddExpense}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold uppercase shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Expense</span>
                  </button>
                )}
              </div>
            </div>

            {/* Expenses Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`border-b ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-[#D8CEBC]'}`}>
                    <th className="py-3 px-3 font-bold uppercase text-slate-700 dark:text-slate-200 min-w-[260px]">
                      Expense {isPresetMode ? '(Preset Line)' : '(COA Master)'}
                    </th>
                    <th className="py-3 px-2 font-bold uppercase text-center text-slate-700 dark:text-slate-200 min-w-[80px]">
                      Start Mt
                    </th>
                    <th className="py-3 px-2 font-bold uppercase text-center text-slate-700 dark:text-slate-200 min-w-[140px]">
                      Annuity Mth
                    </th>
                    <th className="py-3 px-2 font-bold uppercase text-center text-slate-700 dark:text-slate-200 min-w-[120px]">
                      Type
                    </th>
                    <th className="py-3 px-2 font-bold uppercase text-right text-slate-700 dark:text-slate-200 min-w-[110px]">
                      % of Rev
                    </th>
                    <th className="py-3 px-3 font-bold uppercase text-right text-slate-700 dark:text-slate-200 min-w-[160px]">
                      Base Rate / Value
                    </th>
                    {!isPresetMode && (
                      <th className="py-3 px-2 font-bold uppercase text-center text-slate-500 w-12">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* ======================================================= */}
                  {/* CASE 1: ROLLING FORECAST & HI-LEVEL FORECAST (3 PRESET) */}
                  {/* ======================================================= */}
                  {isPresetMode && (() => {
                    const revMonth1 = projections[0]?.revenue || 220000;
                    const cosPct = opexSettings.hiLevelPreset?.cosFixedPct ?? 1.00;
                    const opexFixPct = opexSettings.hiLevelPreset?.opexFixedPct ?? 1.00;
                    const opexVarPct = opexSettings.hiLevelPreset?.opexVarPct ?? 1.00;

                    const presetRows = [
                      {
                        name: 'cost of sales – fixed',
                        targetSubtext: 'Allocated to: Cost of Sales — Share of Fixed Overheads',
                        type: 'fixed',
                        pct: cosPct,
                        key: 'cosFixedPct' as const,
                        val: Math.round(revMonth1 * (cosPct / 100)),
                      },
                      {
                        name: 'overheads – fixed',
                        targetSubtext: 'Allocated to: Operating Expenses — Fixed',
                        type: 'fixed',
                        pct: opexFixPct,
                        key: 'opexFixedPct' as const,
                        val: Math.round(revMonth1 * (opexFixPct / 100)),
                      },
                      {
                        name: 'overheads – variable',
                        targetSubtext: 'Allocated to: Operating Expenses — Variable',
                        type: 'variable',
                        pct: opexVarPct,
                        key: 'opexVarPct' as const,
                        val: Math.round(revMonth1 * (opexVarPct / 100)),
                      },
                    ];

                    return presetRows.map((row) => (
                      <tr
                        key={row.name}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-white capitalize">
                            {row.name}
                          </div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                            {row.targetSubtext}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center text-slate-500 font-bold">
                          1
                        </td>
                        <td className="py-3 px-2 text-center text-slate-500">
                          Monthly (Recurring)
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                              row.type === 'variable'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                : 'bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#5584B4] border border-[#2E5E88]/30'
                            }`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={row.pct}
                              onChange={(e) => handleUpdateHiLevelPreset(row.key, parseFloat(e.target.value) || 0)}
                              className={`w-20 p-2 rounded-lg border text-xs font-bold text-right ${
                                row.type === 'variable'
                                  ? isDark ? 'bg-[#101626] border-[#222F4C] text-amber-400' : 'bg-white border-[#D8CEBC] text-amber-700'
                                  : isDark ? 'bg-[#101626] border-[#222F4C] text-slate-100' : 'bg-white border-[#D8CEBC] text-slate-900'
                              }`}
                            />
                            <span className="text-slate-500 font-bold">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex flex-col items-end">
                            <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold tabular-nums inline-block text-right ${
                              row.type === 'variable'
                                ? isDark ? 'bg-amber-950/25 border-amber-600/40 text-amber-300' : 'bg-amber-50/90 border-amber-300 text-amber-800'
                                : isDark ? 'bg-[#0E1322] border-[#222F4C] text-slate-200' : 'bg-slate-50 border-[#D8CEBC] text-slate-800'
                            }`}>
                              {row.val.toLocaleString()}
                            </div>
                            <span className="text-[9px] text-slate-400 mt-0.5 tabular-nums">
                              {row.pct}% × Rev {Math.round(revMonth1).toLocaleString()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}

                  {/* ======================================================= */}
                  {/* DETAILED EXPENSES: BIZZMODEL & BIZZDYNAMICS             */}
                  {/* ======================================================= */}
                  {!isPresetMode && expenses.map((exp) => {
                    const isVariable = exp.type === 'variable';
                    const startMo = exp.startMonth || 1;
                    const monthRev = projections[startMo - 1]?.revenue ?? projections[0]?.revenue ?? 220000;
                    const calculatedVal = Math.round(monthRev * ((exp.pctOfRevenue ?? 0) / 100));

                    return (
                      <tr
                        key={exp.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Expense Name / COA selector */}
                        <td className="py-2.5 px-3">
                          <select
                            value={exp.name}
                            onChange={(e) => {
                              const selectedName = e.target.value;
                              const option = COA_OPERATING_EXPENSES.find((o) => o.name === selectedName);
                              handleUpdateExpense(exp.id, {
                                name: selectedName,
                                category: option ? option.subCategory : exp.category,
                                type: option ? option.defaultType : exp.type,
                              });
                            }}
                            className={`w-full p-2 rounded-lg border text-xs font-bold ${
                              isDark ? 'bg-[#101626] border-[#222F4C] text-slate-200' : 'bg-white border-[#D8CEBC] text-slate-800'
                            }`}
                          >
                            {COA_OPERATING_EXPENSES.map((opt) => (
                              <option key={opt.code} value={opt.name}>
                                {opt.name} ({opt.code})
                              </option>
                            ))}
                          </select>
                          <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                            {exp.category || 'operating overhead'}
                          </div>
                        </td>

                        {/* Start Month */}
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={exp.startMonth || 1}
                            onChange={(e) => handleUpdateExpense(exp.id, { startMonth: Math.max(1, parseInt(e.target.value) || 1) })}
                            className={`w-16 p-2 rounded-lg border text-xs font-bold text-center ${
                              isDark ? 'bg-[#101626] border-[#222F4C] text-slate-200' : 'bg-white border-[#D8CEBC] text-slate-800'
                            }`}
                          />
                        </td>

                        {/* Annuity Month (e.g. Month 5 for annual insurance) */}
                        <td className="py-2.5 px-2 text-center">
                          <select
                            value={exp.annuityMonth || ''}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : undefined;
                              handleUpdateExpense(exp.id, {
                                annuityMonth: val,
                                isAnnuity: !!val,
                              });
                            }}
                            className={`w-full p-2 rounded-lg border text-xs font-bold ${
                              isDark ? 'bg-[#101626] border-[#222F4C] text-slate-200' : 'bg-white border-[#D8CEBC] text-slate-800'
                            }`}
                          >
                            <option value="">Monthly (Recurring)</option>
                            {FULL_MONTH_NAMES.map((name, i) => (
                              <option key={i + 1} value={i + 1}>
                                {name} (M{i + 1}) — Annual
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Type Toggle: Fixed vs Variable */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-900">
                            <button
                              type="button"
                              onClick={() => handleUpdateExpense(exp.id, { type: 'fixed', pctOfRevenue: undefined })}
                              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                                !isVariable
                                  ? 'bg-[#2E5E88] text-white shadow-xs'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              Fixed
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateExpense(exp.id, { type: 'variable', pctOfRevenue: exp.pctOfRevenue || 1.00 })}
                              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                                isVariable
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              Variable
                            </button>
                          </div>
                        </td>

                        {/* % of Rev (Variable expenses only) */}
                        <td className="py-2.5 px-2 text-right">
                          {isVariable ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={exp.pctOfRevenue ?? 1.00}
                                onChange={(e) => handleUpdateExpense(exp.id, { pctOfRevenue: parseFloat(e.target.value) || 0 })}
                                className={`w-20 p-2 rounded-lg border text-xs font-bold text-right ${
                                  isDark ? 'bg-[#101626] border-[#222F4C] text-amber-400' : 'bg-white border-[#D8CEBC] text-amber-700'
                                }`}
                              />
                              <span className="text-slate-500 font-bold">%</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-mono italic pr-2">
                              —
                            </span>
                          )}
                        </td>

                        {/* Base Rate / Calculated Monthly Value (ZAR) */}
                        <td className="py-2.5 px-3 text-right">
                          {isVariable ? (
                            <div className="flex flex-col items-end">
                              <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold tabular-nums inline-block text-right ${
                                isDark
                                  ? 'bg-amber-950/25 border-amber-600/40 text-amber-300'
                                  : 'bg-amber-50/90 border-amber-300 text-amber-800'
                              }`}>
                                {calculatedVal.toLocaleString()}
                              </div>
                              <span className="text-[9px] text-slate-400 mt-0.5 tabular-nums">
                                {exp.pctOfRevenue}% × Rev {Math.round(monthRev).toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <input
                              type="number"
                              step="1000"
                              min="0"
                              value={exp.baseRateMonthly || exp.monthlyAmount || 0}
                              onChange={(e) => handleUpdateExpense(exp.id, { baseRateMonthly: Math.max(0, parseInt(e.target.value) || 0) })}
                              className={`w-28 p-2 rounded-lg border text-xs font-bold text-right tabular-nums ${
                                isDark ? 'bg-[#101626] border-[#222F4C] text-slate-100' : 'bg-white border-[#D8CEBC] text-slate-900'
                              }`}
                            />
                          )}
                        </td>

                        {/* Action Delete */}
                        <td className="py-2.5 px-2 text-center">
                          {(isFullModelMode || expenses.length > 1) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveExpense(exp.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              title="Remove expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STAGE 2: RESULTS TAB                                                */}
      {/* =================================================================== */}
      {activeSubTab === 'results' && (
        <div className="space-y-6">
          {/* Year Selector & Guidance Bar */}
          <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
          }`}>
            <div>
              <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block">
                OPERATING EXPENSES CATEGORIES (12-MONTH PERIOD)
              </span>
              <p className="text-[11px] text-slate-500">
                Select any radio button on the right to load and adjust that category in the ADJUSTMENT SLIDER situated below the tabled assumptions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Forecast Year:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setActiveYear(y)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                      activeYear === y
                        ? 'bg-[#2E5E88] text-white shadow-xs'
                        : isDark
                        ? 'bg-[#0E1322] border border-[#222F4C] text-slate-400 hover:text-white'
                        : 'bg-slate-100 border border-[#D8CEBC] text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Year {y}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Table: 12 Months + Full Year + Radio Button on the RIGHT */}
          <div className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`border-b ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-[#D8CEBC]'}`}>
                    <th className="py-3 px-3.5 font-bold uppercase text-slate-700 dark:text-slate-200 w-[260px] min-w-[260px] max-w-[260px]">
                      Operating Expense Category
                    </th>
                    {[...Array(12)].map((_, i) => (
                      <th key={i} className="py-3 px-2 font-bold uppercase text-center text-slate-500 min-w-[70px]">
                        M{i + 1}
                      </th>
                    ))}
                    <th className="py-3 px-3 font-bold uppercase text-right text-slate-900 dark:text-white min-w-[90px]">
                      Year {activeYear}
                    </th>
                    {/* Radio button on the far right as requested */}
                    <th className="py-3 px-3 font-bold uppercase text-center text-[#2E5E88] dark:text-[#5584B4] min-w-[60px] w-[60px]">
                      Adjust
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Category 1: Cost of Sales — Share of Fixed Overheads */}
                  {(() => {
                    const rowKey: CategoryKey = 'cosShareOfFixed';
                    const isSelected = selectedCategoryKey === rowKey;
                    const yearStart = (activeYear - 1) * 12;
                    const slice = opexMonthlyMatrix.cosShareOfFixedSeries.slice(yearStart, yearStart + 12);
                    const yearTotal = slice.reduce((s, v) => s + v, 0);

                    return (
                      <tr
                        onClick={() => setSelectedCategoryKey(rowKey)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? isDark
                              ? 'bg-[#2E5E88]/15 border-l-2 border-[#5584B4]'
                              : 'bg-sky-50/70 border-l-2 border-[#2E5E88]'
                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/20'
                        }`}
                      >
                        <td className="py-2.5 px-3.5 w-[260px] min-w-[260px] max-w-[260px]">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {CATEGORY_DEFINITIONS[rowKey].label}
                          </div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400">
                            Transfers to: {CATEGORY_DEFINITIONS[rowKey].tradingAccountTarget}
                          </div>
                        </td>
                        {slice.map((val, idx) => (
                          <td key={idx} className="py-2.5 px-2 text-right tabular-nums text-slate-700 dark:text-slate-300">
                            {val > 0 ? val.toLocaleString() : '-'}
                          </td>
                        ))}
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                          {yearTotal > 0 ? yearTotal.toLocaleString() : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center min-w-[60px] w-[60px]" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="radio"
                            name="opex-category-adjust"
                            checked={isSelected}
                            onChange={() => setSelectedCategoryKey(rowKey)}
                            className="w-4 h-4 text-[#2E5E88] focus:ring-[#2E5E88] cursor-pointer"
                            aria-label={`Select ${CATEGORY_DEFINITIONS[rowKey].label}`}
                          />
                        </td>
                      </tr>
                    );
                  })()}

                  {/* Category 2: Operating Expenses — Variable */}
                  {(() => {
                    const rowKey: CategoryKey = 'opexVariable';
                    const isSelected = selectedCategoryKey === rowKey;
                    const yearStart = (activeYear - 1) * 12;
                    const slice = opexMonthlyMatrix.opexVariableSeries.slice(yearStart, yearStart + 12);
                    const yearTotal = slice.reduce((s, v) => s + v, 0);

                    return (
                      <tr
                        onClick={() => setSelectedCategoryKey(rowKey)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? isDark
                              ? 'bg-[#2E5E88]/15 border-l-2 border-[#5584B4]'
                              : 'bg-sky-50/70 border-l-2 border-[#2E5E88]'
                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/20'
                        }`}
                      >
                        <td className="py-2.5 px-3.5 w-[260px] min-w-[260px] max-w-[260px]">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {CATEGORY_DEFINITIONS[rowKey].label}
                          </div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400">
                            Transfers to: {CATEGORY_DEFINITIONS[rowKey].tradingAccountTarget}
                          </div>
                        </td>
                        {slice.map((val, idx) => (
                          <td key={idx} className="py-2.5 px-2 text-right tabular-nums text-slate-700 dark:text-slate-300">
                            {val > 0 ? val.toLocaleString() : '-'}
                          </td>
                        ))}
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                          {yearTotal > 0 ? yearTotal.toLocaleString() : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center min-w-[60px] w-[60px]" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="radio"
                            name="opex-category-adjust"
                            checked={isSelected}
                            onChange={() => setSelectedCategoryKey(rowKey)}
                            className="w-4 h-4 text-[#2E5E88] focus:ring-[#2E5E88] cursor-pointer"
                            aria-label={`Select ${CATEGORY_DEFINITIONS[rowKey].label}`}
                          />
                        </td>
                      </tr>
                    );
                  })()}

                  {/* Category 3: Operating Expenses — Fixed */}
                  {(() => {
                    const rowKey: CategoryKey = 'opexFixed';
                    const isSelected = selectedCategoryKey === rowKey;
                    const yearStart = (activeYear - 1) * 12;
                    const slice = opexMonthlyMatrix.opexFixedSeries.slice(yearStart, yearStart + 12);
                    const yearTotal = slice.reduce((s, v) => s + v, 0);

                    return (
                      <tr
                        onClick={() => setSelectedCategoryKey(rowKey)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? isDark
                              ? 'bg-[#2E5E88]/15 border-l-2 border-[#5584B4]'
                              : 'bg-sky-50/70 border-l-2 border-[#2E5E88]'
                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/20'
                        }`}
                      >
                        <td className="py-2.5 px-3.5 w-[260px] min-w-[260px] max-w-[260px]">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {CATEGORY_DEFINITIONS[rowKey].label}
                          </div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400">
                            Transfers to: {CATEGORY_DEFINITIONS[rowKey].tradingAccountTarget}
                          </div>
                        </td>
                        {slice.map((val, idx) => (
                          <td key={idx} className="py-2.5 px-2 text-right tabular-nums text-slate-700 dark:text-slate-300">
                            {val > 0 ? val.toLocaleString() : '-'}
                          </td>
                        ))}
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                          {yearTotal > 0 ? yearTotal.toLocaleString() : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center min-w-[60px] w-[60px]" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="radio"
                            name="opex-category-adjust"
                            checked={isSelected}
                            onChange={() => setSelectedCategoryKey(rowKey)}
                            className="w-4 h-4 text-[#2E5E88] focus:ring-[#2E5E88] cursor-pointer"
                            aria-label={`Select ${CATEGORY_DEFINITIONS[rowKey].label}`}
                          />
                        </td>
                      </tr>
                    );
                  })()}

                  {/* Summary Row 1: Total Operating Expenses (Excluding COS Share) */}
                  <tr className={`border-t-2 font-bold ${
                    isDark ? 'bg-[#0E1322]/80 border-[#222F4C] text-slate-200' : 'bg-slate-50/90 border-slate-300 text-slate-800'
                  }`}>
                    <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 w-[260px] min-w-[260px] max-w-[260px]">
                      Total Operating Expenses (Variable + Fixed)
                    </td>
                    {[...Array(12)].map((_, i) => {
                      const idx = (activeYear - 1) * 12 + i;
                      const val = opexMonthlyMatrix.totalOpexSeries[idx] || 0;
                      return (
                        <td key={i} className="py-2.5 px-2 text-right tabular-nums text-slate-600 dark:text-slate-400">
                          {val > 0 ? val.toLocaleString() : '-'}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-900 dark:text-white">
                      {opexMonthlyMatrix.totalOpexSeries
                        .slice((activeYear - 1) * 12, (activeYear - 1) * 12 + 12)
                        .reduce((s, v) => s + v, 0)
                        .toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center min-w-[60px] w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>

                  {/* Grand Summary Row: Total Overheads (COS Share + OPEX) */}
                  <tr className={`border-t font-bold text-sm ${
                    isDark ? 'bg-[#0E1322] border-[#222F4C] text-[#5584B4]' : 'bg-slate-100 border-[#D8CEBC] text-[#2E5E88]'
                  }`}>
                    <td className="py-3 px-3.5 uppercase w-[260px] min-w-[260px] max-w-[260px]">
                      Total Overheads (COS Share + OPEX)
                    </td>
                    {[...Array(12)].map((_, i) => {
                      const idx = (activeYear - 1) * 12 + i;
                      const val = opexMonthlyMatrix.grandTotalSeries[idx] || 0;
                      return (
                        <td key={i} className="py-3 px-2 text-right tabular-nums">
                          {val > 0 ? val.toLocaleString() : '-'}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-right tabular-nums">
                      {opexMonthlyMatrix.grandTotalSeries
                        .slice((activeYear - 1) * 12, (activeYear - 1) * 12 + 12)
                        .reduce((s, v) => s + v, 0)
                        .toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center min-w-[60px] w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ADJUSTMENT SLIDER - Linked to Selected Category */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 uppercase px-1">
              <span className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                <Sliders className="w-3.5 h-3.5 text-[#2E5E88] dark:text-[#5584B4]" />
                ADJUSTMENT SLIDER — {CATEGORY_DEFINITIONS[selectedCategoryKey].label}
              </span>
              <span className="text-[11px] font-semibold text-[#2E5E88] dark:text-[#5584B4]">
                Target: {CATEGORY_DEFINITIONS[selectedCategoryKey].tradingAccountTarget}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
            }`}>
              <BaseRateAdjustmentTool
                theme={theme}
                item={selectedAdjustmentItem}
                selectedYear={activeYear}
                onSelectYear={setActiveYear}
                onUpdateMonthlyValues={handleSliderUpdateMonthlyValues}
                onUpdateBaseRate={handleSliderUpdateBaseRate}
                onPrevItem={() => handleCycleCategory('prev')}
                onNextItem={() => handleCycleCategory('next')}
              />
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STAGE 3: CHARTS TAB                                                 */}
      {/* =================================================================== */}
      {activeSubTab === 'charts' && (
        <div className="space-y-6">
          {/* Charts Filter Bar: View Mode, Year, Department, Type */}
          <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
          }`}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#2E5E88] dark:text-[#5584B4]" />
                <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  Filters:
                </span>
              </div>

              {/* View Mode Toggle */}
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setChartViewMode('monthly')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    chartViewMode === 'monthly'
                      ? 'bg-[#2E5E88] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Months within a Year
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('5year')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    chartViewMode === '5year'
                      ? 'bg-[#2E5E88] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  5-Year Summary
                </button>
              </div>

              {/* Year Selector (if monthly) */}
              {chartViewMode === 'monthly' && (
                <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                  {[1, 2, 3, 4, 5].map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setChartYear(y)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                        chartYear === y
                          ? 'bg-[#2E5E88] text-white shadow-xs'
                          : isDark
                          ? 'bg-[#0E1322] border border-[#222F4C] text-slate-400'
                          : 'bg-slate-100 border border-[#D8CEBC] text-slate-600'
                      }`}
                    >
                      Y{y}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Department Filter (Setup Step Allocation) */}
              <select
                value={chartDepartmentFilter}
                onChange={(e) => setChartDepartmentFilter(e.target.value)}
                className={`p-1.5 rounded-lg border text-xs font-bold capitalize ${
                  isDark ? 'bg-[#0E1322] border-[#222F4C] text-slate-200' : 'bg-white border-[#D8CEBC] text-slate-800'
                }`}
              >
                <option value="all">All Departments (100%)</option>
                {setupDepartments.map((dept) => (
                  <option key={dept.id || dept.name} value={dept.name.toLowerCase()}>
                    {dept.name} ({dept.distributionPct}%)
                  </option>
                ))}
              </select>

              {/* Type Filter: Fixed vs Variable */}
              <select
                value={chartTypeFilter}
                onChange={(e) => setChartTypeFilter(e.target.value as any)}
                className={`p-1.5 rounded-lg border text-xs font-bold capitalize ${
                  isDark ? 'bg-[#0E1322] border-[#222F4C] text-slate-200' : 'bg-white border-[#D8CEBC] text-slate-800'
                }`}
              >
                <option value="all">All Types (Fixed & Variable)</option>
                <option value="fixed">Fixed Only</option>
                <option value="variable">Variable Only</option>
              </select>
            </div>
          </div>

          {/* Chart Display Container */}
          {(() => {
            // Department allocation percentage from setup step
            const selectedDept = chartDepartmentFilter === 'all'
              ? null
              : setupDepartments.find((d) => d.name.toLowerCase() === chartDepartmentFilter.toLowerCase());
            const deptPctFactor = selectedDept ? (selectedDept.distributionPct || 0) / 100 : 1.0;

            // Filter expenses based on type filter
            const filteredExpenses = expenses.filter((e) => {
              if (chartTypeFilter !== 'all' && (e.type || 'fixed') !== chartTypeFilter) {
                return false;
              }
              return true;
            });

            // Calculate series for filtered expenses with departmental distribution from setup
            const filteredMonthlySeries = new Array(60).fill(0);
            for (let mo = 0; mo < 60; mo++) {
              const m = mo + 1;
              const calMonth = (mo % 12) + 1;
              const rev = projections[mo]?.revenue || 0;

              filteredExpenses.forEach((exp) => {
                if (m < (exp.startMonth || 1)) return;
                if (exp.isAnnuity || (exp.annuityMonth !== undefined && exp.annuityMonth > 0)) {
                  if (calMonth !== (exp.annuityMonth ?? 1)) return;
                }

                let cost = 0;
                if (exp.type === 'variable') {
                  if (exp.pctOfRevenue !== undefined && exp.pctOfRevenue > 0) {
                    cost = rev * (exp.pctOfRevenue / 100);
                  } else {
                    cost = exp.baseRateMonthly ?? exp.monthlyAmount ?? 0;
                  }
                } else {
                  cost = exp.baseRateMonthly ?? exp.monthlyAmount ?? 0;
                }

                if (exp.growthRatePct && exp.growthRatePct > 0) {
                  cost = cost * Math.pow(1 + exp.growthRatePct / 100, (m - exp.startMonth) / 12);
                }

                if (exp.monthlyAdjustmentPct && exp.monthlyAdjustmentPct[mo] !== undefined) {
                  cost = cost * (1 + exp.monthlyAdjustmentPct[mo] / 100);
                }

                filteredMonthlySeries[mo] += cost * deptPctFactor;
              });
            }

            const chartData = chartViewMode === 'monthly'
              ? Array.from({ length: 12 }, (_, idx) => {
                  const moIndex = (chartYear - 1) * 12 + idx;
                  const monthNum = idx + 1;
                  return {
                    label: `${monthNum}`,
                    fullLabel: `Month ${monthNum}`,
                    value: Math.round(filteredMonthlySeries[moIndex] || 0),
                  };
                })
              : [1, 2, 3, 4, 5].map((yr) => {
                  const start = (yr - 1) * 12;
                  const total = filteredMonthlySeries.slice(start, start + 12).reduce((s, v) => s + v, 0);
                  return {
                    label: `Year ${yr}`,
                    fullLabel: `Year ${yr} Annual Total`,
                    value: Math.round(total),
                  };
                });

            const maxVal = Math.max(...chartData.map((d) => d.value), 1000);
            const totalPeriod = chartData.reduce((s, d) => s + d.value, 0);

            return (
              <div className="space-y-4">
                {/* SVG Bar Chart Card */}
                <div className={`p-5 rounded-2xl border ${
                  isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block">
                        {chartViewMode === 'monthly'
                          ? `OPERATING EXPENSES PROFILE — YEAR ${chartYear}`
                          : '5-YEAR OPERATING EXPENSES TRAJECTORY'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {filteredExpenses.length} expense items matching active filters (Dept: {chartDepartmentFilter}, Type: {chartTypeFilter})
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Total for Selected View:</span>
                      <span className="text-sm font-bold text-[#2E5E88] dark:text-[#5584B4]">
                        {totalPeriod.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* SVG Chart Graphic */}
                  <div className="pt-6 pb-2">
                    <div className="h-64 flex items-end gap-2 sm:gap-4 px-2">
                      {chartData.map((item, idx) => {
                        const heightPct = Math.max(4, Math.round((item.value / maxVal) * 100));
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 tabular-nums">
                              {item.value > 0 ? (item.value / 1000 >= 1 ? `${Math.round(item.value / 1000)}k` : item.value) : '0'}
                            </span>
                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full rounded-t-lg transition-all duration-300 ${
                                isDark
                                  ? 'bg-[#2E5E88] hover:bg-[#5584B4]'
                                  : 'bg-[#2E5E88] hover:bg-[#234E73]'
                              } group-hover:brightness-110 shadow-xs`}
                            />
                            <span className="text-[10px] font-bold text-slate-500 mt-2 block text-center truncate w-full">
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Analytical Breakdown Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Fixed vs Variable Proportion */}
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                  }`}>
                    <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-200 block mb-2">
                      Cost Structure Split
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Fixed Overheads:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {Math.round(summaryStats.fixedRunRate).toLocaleString()} / mo
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Variable Overheads:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {Math.round(summaryStats.variableRunRate).toLocaleString()} / mo
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex mt-2">
                        <div
                          style={{
                            width: `${(summaryStats.fixedRunRate / (summaryStats.fixedRunRate + summaryStats.variableRunRate || 1)) * 100}%`,
                          }}
                          className="bg-[#2E5E88]"
                        />
                        <div
                          style={{
                            width: `${(summaryStats.variableRunRate / (summaryStats.fixedRunRate + summaryStats.variableRunRate || 1)) * 100}%`,
                          }}
                          className="bg-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* COS Allocation Impact */}
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                  }`}>
                    <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-200 block mb-2">
                      Cost of Sales Allocation ({opexSettings.allocationToCostOfSalesPct}%)
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Share to COS (Fixed):</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {Math.round(summaryStats.cosShareRunRate).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Retained in OPEX (Fixed):</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {Math.round(summaryStats.opexFixedRunRate).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2">
                        Fixed overheads transferred to Trading Account Cost of Sales - Fixed.
                      </p>
                    </div>
                  </div>

                  {/* Departmental Allocation from Setup Step */}
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                  }`}>
                    <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-200 block mb-2">
                      Departmental Allocation (Setup Step)
                    </span>
                    <div className="space-y-2 text-xs">
                      {setupDepartments.map((dept) => {
                        const deptShare = Math.round(summaryStats.totalOpexRunRate * ((dept.distributionPct || 0) / 100));
                        return (
                          <div key={dept.id || dept.name} className="flex justify-between items-center">
                            <span className="text-slate-500 capitalize">{dept.name} ({dept.distributionPct}%):</span>
                            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                              {deptShare.toLocaleString()} / mo
                            </span>
                          </div>
                        );
                      })}
                      <p className="text-[10px] text-slate-400 mt-1">
                        Allocated according to percentages defined in the Setup step.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
