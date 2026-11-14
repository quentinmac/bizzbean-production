import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sliders,
  DollarSign,
  TrendingUp,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  ArrowRight,
  Info,
  Briefcase,
  PieChart,
  BarChart2,
} from 'lucide-react';
import {
  BizzModelState,
  EmploymentItem,
  EmploymentCategory,
  PlatformForecastAppId,
  DEFAULT_EMPLOYMENT_CATEGORIES,
  DEFAULT_EMPLOYMENT_ITEMS,
  EmploymentAllocation,
  EmploymentType,
} from '../constants';
import { AssumptionRateItem } from '../../bizzdynamics/types';
import { BaseRateAdjustmentTool } from '../../bizzdynamics/components/BaseRateAdjustmentTool';

interface EmploymentStepProps {
  theme?: 'light' | 'dark';
  mode: PlatformForecastAppId; // 'bizzdynamics' | 'rolling-forecast' | 'hi-level-forecast' | 'bizzmodel'
  state: BizzModelState;
  onUpdateState: (updater: (prev: BizzModelState) => BizzModelState) => void;
  subTab?: 'assumptions' | 'results' | 'charts' | 'data entry' | 'data-entry';
  onSelectSubTab?: (tab: 'assumptions' | 'results' | 'charts') => void;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const EmploymentStep: React.FC<EmploymentStepProps> = ({
  theme = 'light',
  mode,
  state,
  onUpdateState,
  subTab: subTabProp,
  onSelectSubTab,
}) => {
  const isDark = theme === 'dark';

  // Normalize subtabs
  const normalizedSubTab = useMemo<'assumptions' | 'results' | 'charts'>(() => {
    if (!subTabProp) return 'results';
    if (subTabProp === 'data entry' || subTabProp === 'data-entry') return 'results';
    return subTabProp;
  }, [subTabProp]);

  const [internalSubTab, setInternalSubTab] = useState<'assumptions' | 'results' | 'charts'>(normalizedSubTab);
  const activeSubTab = subTabProp ? normalizedSubTab : internalSubTab;
  const setActiveSubTab = onSelectSubTab ?? setInternalSubTab;

  // Active Year for 12-month views (Years 1 to 5)
  const [activeYear, setActiveYear] = useState<number>(1);

  // Collapsible container for Employment Categories in Assumptions tab
  const [categoriesOpen, setCategoriesOpen] = useState<boolean>(true);

  // Selected Category ID for Results tab & Adjustment Slider
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat-1');

  // Charts filters
  const [chartViewMode, setChartViewMode] = useState<'monthly' | '5year'>('monthly');
  const [chartYear, setChartYear] = useState<number>(1);
  const [chartDepartmentFilter, setChartDepartmentFilter] = useState<string>('all');
  const [chartAllocationFilter, setChartAllocationFilter] = useState<'all' | EmploymentAllocation>('all');
  const [chartCategoryFilter, setChartCategoryFilter] = useState<string>('all');

  // Ensure categories exist in state
  const categories: EmploymentCategory[] = useMemo(() => {
    if (state.employmentCategories && state.employmentCategories.length > 0) {
      return state.employmentCategories;
    }
    return DEFAULT_EMPLOYMENT_CATEGORIES;
  }, [state.employmentCategories]);

  // Ensure employees exist in state
  const employees: EmploymentItem[] = useMemo(() => {
    if (state.employmentItems && state.employmentItems.length > 0) {
      return state.employmentItems;
    }
    return DEFAULT_EMPLOYMENT_ITEMS;
  }, [state.employmentItems]);

  // Max Category and Employee limits by App Mode
  // • bizzdynamics: limit 5 categories, limit 5 employees
  // • rolling forecast: no categories, 2 preset titles
  // • hi-level forecast: no categories, 2 preset titles
  // • bizzmodel: unlimited categories, unlimited employees
  const categoryLimit = mode === 'bizzdynamics' ? 5 : mode === 'bizzmodel' ? Infinity : 0;
  const employeeLimit = mode === 'bizzdynamics' ? 5 : (mode === 'rolling-forecast' || mode === 'hi-level-forecast') ? 2 : Infinity;
  const supportsCategories = mode === 'bizzdynamics' || mode === 'bizzmodel';

  // Category map for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, EmploymentCategory>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Active Category for Adjustment Slider
  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId) || categories[0] || DEFAULT_EMPLOYMENT_CATEGORIES[0];
  }, [categories, selectedCategoryId]);

  // Departments list from businessDetails or default
  const availableDepartments = useMemo(() => {
    if (state.businessDetails?.departments && state.businessDetails.departments.length > 0) {
      return state.businessDetails.departments.map((d) => d.name.toLowerCase());
    }
    return ['administration', 'commercial & sales', 'product & engineering', 'operations'];
  }, [state.businessDetails]);

  // -------------------------------------------------------------------------
  // Handlers: Categories
  // -------------------------------------------------------------------------
  const handleUpdateCategory = (catId: string, patch: Partial<EmploymentCategory>) => {
    onUpdateState((prev) => {
      const currentCats = prev.employmentCategories && prev.employmentCategories.length > 0
        ? prev.employmentCategories
        : DEFAULT_EMPLOYMENT_CATEGORIES;
      const updated = currentCats.map((cat) => (cat.id === catId ? { ...cat, ...patch } : cat));
      return { ...prev, employmentCategories: updated };
    });
  };

  const handleAddCategory = () => {
    if (categories.length >= categoryLimit) return;
    const newCatId = `cat-${Date.now()}`;
    const newCategory: EmploymentCategory = {
      id: newCatId,
      name: `Category Band ${categories.length + 1}`,
      onCostPct: 15,
      description: 'Custom organizational band',
      monthlyAdjustmentPct: new Array(60).fill(0),
    };
    onUpdateState((prev) => {
      const currentCats = prev.employmentCategories && prev.employmentCategories.length > 0
        ? prev.employmentCategories
        : DEFAULT_EMPLOYMENT_CATEGORIES;
      return { ...prev, employmentCategories: [...currentCats, newCategory] };
    });
    setSelectedCategoryId(newCatId);
  };

  const handleRemoveCategory = (catId: string) => {
    if (categories.length <= 1) return;
    onUpdateState((prev) => {
      const currentCats = prev.employmentCategories && prev.employmentCategories.length > 0
        ? prev.employmentCategories
        : DEFAULT_EMPLOYMENT_CATEGORIES;
      const updatedCats = currentCats.filter((c) => c.id !== catId);
      // Reassign employees to first remaining category
      const remainingCatId = updatedCats[0]?.id || 'cat-1';
      const updatedEmps = (prev.employmentItems || []).map((emp) =>
        emp.categoryId === catId ? { ...emp, categoryId: remainingCatId } : emp
      );
      return {
        ...prev,
        employmentCategories: updatedCats,
        employmentItems: updatedEmps,
      };
    });
    if (selectedCategoryId === catId) {
      setSelectedCategoryId(categories.find((c) => c.id !== catId)?.id || 'cat-1');
    }
  };

  // -------------------------------------------------------------------------
  // Handlers: Employees
  // -------------------------------------------------------------------------
  const handleUpdateEmployee = (empId: string, patch: Partial<EmploymentItem>) => {
    onUpdateState((prev) => {
      const currentEmps = prev.employmentItems && prev.employmentItems.length > 0
        ? prev.employmentItems
        : DEFAULT_EMPLOYMENT_ITEMS;
      const updated = currentEmps.map((emp) => (emp.id === empId ? { ...emp, ...patch } : emp));
      return { ...prev, employmentItems: updated };
    });
  };

  const handleAddEmployee = () => {
    if (employees.length >= employeeLimit) return;
    const firstCat = categories[0] || DEFAULT_EMPLOYMENT_CATEGORIES[0];
    const newEmp: EmploymentItem = {
      id: `emp-${Date.now()}`,
      title: `Team Member ${employees.length + 1}`,
      categoryId: firstCat.id,
      department: availableDepartments[0] || 'administration',
      allocation: 'operating_expenses',
      baseRateMonthly: 25000,
      startMonth: 1,
      numEmployees: 1,
      employmentType: 'permanent',
      onCostPct: firstCat.onCostPct,
    };
    onUpdateState((prev) => {
      const currentEmps = prev.employmentItems && prev.employmentItems.length > 0
        ? prev.employmentItems
        : DEFAULT_EMPLOYMENT_ITEMS;
      return { ...prev, employmentItems: [...currentEmps, newEmp] };
    });
  };

  const handleRemoveEmployee = (empId: string) => {
    onUpdateState((prev) => {
      const currentEmps = prev.employmentItems && prev.employmentItems.length > 0
        ? prev.employmentItems
        : DEFAULT_EMPLOYMENT_ITEMS;
      return { ...prev, employmentItems: currentEmps.filter((e) => e.id !== empId) };
    });
  };

  // -------------------------------------------------------------------------
  // Calculation: Monthly Cost per Employee
  // Formula: monthly base cost * (1 + employee category on-cost) * headcount
  // With annual review compound factor and category monthly slider delta
  // -------------------------------------------------------------------------
  const computeEmployeeMonthlyCost = (emp: EmploymentItem, monthIndex: number): number => {
    const m = monthIndex + 1; // 1 to 60
    const yearIdx = Math.floor(monthIndex / 12); // 0 to 4
    const calMonth = (monthIndex % 12) + 1; // 1 to 12

    let isActive = false;
    if (emp.employmentType === 'seasonal') {
      const sStart = emp.seasonalStartMonth ?? 1;
      const sEnd = emp.seasonalEndMonth ?? 12;
      if (sStart <= sEnd) {
        isActive = calMonth >= sStart && calMonth <= sEnd;
      } else {
        isActive = calMonth >= sStart || calMonth <= sEnd;
      }
      if (m < (emp.startMonth || 1)) {
        isActive = false;
      }
    } else {
      isActive = m >= (emp.startMonth || 1);
    }

    if (!isActive) return 0;

    const cat = categoryMap.get(emp.categoryId);
    const onCostPct = cat ? cat.onCostPct : (emp.onCostPct ?? 0);

    // Core formula: monthly base * (1 + onCostPct) * headcount
    let cost = emp.baseRateMonthly * (emp.numEmployees || 1) * (1 + onCostPct / 100);

    // Apply category monthly slider adjustment (delta %)
    if (cat?.monthlyAdjustmentPct && cat.monthlyAdjustmentPct[monthIndex] !== undefined) {
      const deltaPct = cat.monthlyAdjustmentPct[monthIndex];
      cost = cost * (1 + deltaPct / 100);
    }

    return Math.round(cost);
  };

  // -------------------------------------------------------------------------
  // Monthly Series for Results Tab
  // -------------------------------------------------------------------------
  const categoryMonthlyMatrix = useMemo(() => {
    // 60-month array for each category
    const matrix: Record<string, number[]> = {};
    categories.forEach((cat) => {
      matrix[cat.id] = new Array(60).fill(0);
    });

    const totalCosSeries = new Array(60).fill(0);
    const totalOpexSeries = new Array(60).fill(0);
    const grandTotalSeries = new Array(60).fill(0);

    employees.forEach((emp) => {
      for (let mo = 0; mo < 60; mo++) {
        const cost = computeEmployeeMonthlyCost(emp, mo);
        if (matrix[emp.categoryId]) {
          matrix[emp.categoryId][mo] += cost;
        }
        if (emp.allocation === 'cost_of_sales') {
          totalCosSeries[mo] += cost;
        } else {
          totalOpexSeries[mo] += cost;
        }
        grandTotalSeries[mo] += cost;
      }
    });

    return {
      categoryRows: matrix,
      totalCosSeries,
      totalOpexSeries,
      grandTotalSeries,
    };
  }, [employees, categories, categoryMap]);

  // -------------------------------------------------------------------------
  // BaseRateAdjustmentTool Integration for Selected Category
  // -------------------------------------------------------------------------
  const categorySliderAssumptionItem = useMemo<AssumptionRateItem>(() => {
    return {
      id: `emp-cat-${selectedCategory.id}`,
      stepId: 3,
      stepName: 'employment',
      name: `${selectedCategory.name}`,
      description: `Monthly wage adjustment for ${selectedCategory.name} band`,
      baseRate: 0,
      unit: '%',
      changeType: 'percentage',
      monthlyValues: selectedCategory.monthlyAdjustmentPct && selectedCategory.monthlyAdjustmentPct.length === 60
        ? selectedCategory.monthlyAdjustmentPct
        : new Array(60).fill(0),
      coaReference: selectedCategory.name,
    };
  }, [selectedCategory]);

  const handleSliderUpdateMonthlyValues = (itemId: string, updatedValues: number[]) => {
    handleUpdateCategory(selectedCategory.id, {
      monthlyAdjustmentPct: updatedValues,
    });
  };

  const handleSliderUpdateBaseRate = (itemId: string, newBaseRate: number) => {
    handleSliderUpdateMonthlyValues(itemId, new Array(60).fill(newBaseRate));
  };

  const handleCycleCategory = (direction: 'prev' | 'next') => {
    const currentIdx = categories.findIndex((c) => c.id === selectedCategoryId);
    let nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx < 0) nextIdx = categories.length - 1;
    if (nextIdx >= categories.length) nextIdx = 0;
    setSelectedCategoryId(categories[nextIdx].id);
  };

  // -------------------------------------------------------------------------
  // Totals for Assumptions Summary Bar
  // -------------------------------------------------------------------------
  const totalHeadcount = employees.reduce((sum, e) => sum + (e.numEmployees || 1), 0);
  const totalBaseMonthly = employees.reduce((sum, e) => sum + e.baseRateMonthly * (e.numEmployees || 1), 0);
  const totalWithOnCostsMonthly = employees.reduce((sum, e) => {
    const cat = categoryMap.get(e.categoryId);
    const onCost = cat ? cat.onCostPct : (e.onCostPct ?? 0);
    return sum + e.baseRateMonthly * (e.numEmployees || 1) * (1 + onCost / 100);
  }, 0);

  return (
    <div className={`space-y-6 font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* =================================================================== */}
      {/* TOP NAVIGATION SUBTABS (ASSUMPTIONS, RESULTS, CHARTS)                */}
      {/* =================================================================== */}
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold uppercase tracking-tight text-slate-900 dark:text-white">
              EMPLOYMENT & HEADCOUNT CALCULATOR
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-[#2E5E88]/10 text-[#2E5E88] dark:text-[#5584B4]">
              {mode}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Define employment category bands, team compensation, and benefit on-costs.
          </p>
        </div>
      </div>

      {/* =================================================================== */}
      {/* STAGE 1: ASSUMPTIONS TAB                                            */}
      {/* =================================================================== */}
      {activeSubTab === 'assumptions' && (
        <div className="space-y-6">
          {/* Section 1: Employment Category (Bands) - Collapsible Container */}
          {supportsCategories && (
            <div className={`rounded-2xl border transition-all ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
            }`}>
              {/* Collapsible Header */}
              <div
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none border-b border-slate-200/80 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#2E5E88]/10 text-[#2E5E88] dark:text-[#5584B4] flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold uppercase text-slate-900 dark:text-white">
                        EMPLOYMENT CATEGORY BANDS
                      </h2>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        ({categories.length} {categoryLimit !== Infinity ? `/ ${categoryLimit} max` : 'active'})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Allocate benefit on-cost percentages per category band.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {categories.length < categoryLimit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddCategory();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold uppercase shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Band</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Toggle categories"
                  >
                    {categoriesOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Body */}
              {categoriesOpen && (
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase">
                          <th className="py-2.5 px-3 font-bold">Category Band</th>
                          <th className="py-2.5 px-3 font-bold text-right">Benefit On-Cost (%)</th>
                          <th className="py-2.5 px-3 font-bold">Description</th>
                          <th className="py-2.5 px-3 text-center w-12">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {categories.map((cat) => (
                          <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={cat.name}
                                onChange={(e) => handleUpdateCategory(cat.id, { name: e.target.value })}
                                className="w-full font-bold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-[#2E5E88] focus:outline-none py-1 text-slate-900 dark:text-white"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center gap-1 justify-end">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={cat.onCostPct}
                                  onChange={(e) => handleUpdateCategory(cat.id, { onCostPct: Number(e.target.value) })}
                                  className={`w-20 p-1.5 text-right font-bold rounded-lg border text-xs ${
                                    isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-[#D8CEBC]'
                                  }`}
                                />
                                <span className="text-slate-400 font-bold">%</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={cat.description || ''}
                                onChange={(e) => handleUpdateCategory(cat.id, { description: e.target.value })}
                                placeholder="Notes or band responsibilities..."
                                className="w-full text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-[#2E5E88] focus:outline-none py-1 text-[11px]"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {categories.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCategory(cat.id)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                                  title="Delete Category Band"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* High-Level Forecast informational notification when categories are omitted */}
          {!supportsCategories && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-sky-50/70 border-sky-200'
            }`}>
              <Info className="w-5 h-5 text-sky-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-sky-900 dark:text-sky-300 uppercase">
                  HIGH-LEVEL PRESET EMPLOYMENT MODE:
                </span>{' '}
                <span className="text-sky-800 dark:text-sky-400">
                  Employment categories are bypassed in {mode}. Fixed labor is preset directly as a percentage of revenue for Cost of Sales and Overheads.
                </span>
              </div>
            </div>
          )}

          {/* Section 2: Employee Listing Container */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
          }`}>
            {/* Header with Title and Add Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase text-slate-900 dark:text-white">
                    EMPLOYEE LISTING
                  </h2>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    ({employees.length} {employeeLimit !== Infinity ? `/ ${employeeLimit} max` : 'titles'})
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Formula: monthly base cost × (1 + employee category on-cost) × headcount. Supports permanent and seasonal schedules.
                </p>
              </div>

              {employees.length < employeeLimit && (
                <button
                  type="button"
                  onClick={handleAddEmployee}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold uppercase shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Employee Title</span>
                </button>
              )}
            </div>

            {/* Run-rate Summary Card */}
            <div className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-3 ${
              isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50/70 border-[#D8CEBC]'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Active Headcount:</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {totalHeadcount} <span className="text-xs font-normal text-slate-500">FTEs</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Base Monthly Payroll:</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {Math.round(totalBaseMonthly).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#2E5E88] dark:text-[#5584B4] block">
                  Total Monthly Run-rate (with on-costs):
                </span>
                <span className="text-base font-bold text-[#2E5E88] dark:text-[#5584B4]">
                  {Math.round(totalWithOnCostsMonthly).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Employee Cards List */}
            <div className="space-y-4">
              {employees.map((emp) => {
                const assignedCat = categoryMap.get(emp.categoryId) || categories[0];
                const onCost = assignedCat ? assignedCat.onCostPct : (emp.onCostPct ?? 0);
                const monthlyTotal = emp.baseRateMonthly * (emp.numEmployees || 1) * (1 + onCost / 100);

                return (
                  <div
                    key={emp.id}
                    className={`p-4 rounded-xl border space-y-3.5 transition-all ${
                      isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC] hover:border-slate-400'
                    }`}
                  >
                    {/* Top Row: Title, Department, Total Cost Badge, Delete */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex-1 min-w-[200px]">
                        <input
                          type="text"
                          value={emp.title}
                          onChange={(e) => handleUpdateEmployee(emp.id, { title: e.target.value })}
                          className="font-bold text-sm bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-[#2E5E88] focus:outline-none w-full text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-bold text-[#2E5E88] dark:text-[#5584B4]">
                            {Math.round(monthlyTotal).toLocaleString()} / mo
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            (incl. {onCost}% on-cost)
                          </span>
                        </div>
                        {employees.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEmployee(emp.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                            title="Remove Position"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Controls Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {/* Category Selection */}
                      <div>
                        <label className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">
                          Category Band:
                        </label>
                        <select
                          value={emp.categoryId}
                          onChange={(e) => handleUpdateEmployee(emp.id, { categoryId: e.target.value })}
                          className={`w-full p-2 rounded-lg border text-xs font-bold ${
                            isDark ? 'bg-[#101626] border-[#222F4C] text-slate-200' : 'bg-white border-[#D8CEBC] text-slate-800'
                          }`}
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} (+{c.onCostPct}% on-cost)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Department */}
                      <div>
                        <label className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">
                          Department:
                        </label>
                        <select
                          value={emp.department}
                          onChange={(e) => handleUpdateEmployee(emp.id, { department: e.target.value })}
                          className={`w-full p-2 rounded-lg border text-xs font-bold capitalize ${
                            isDark ? 'bg-[#101626] border-[#222F4C] text-slate-200' : 'bg-white border-[#D8CEBC] text-slate-800'
                          }`}
                        >
                          {availableDepartments.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Allocation (Trading Account Destination) */}
                      <div>
                        <label className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">
                          Trading Account Allocation:
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateEmployee(emp.id, { allocation: 'cost_of_sales' })}
                            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all text-center ${
                              emp.allocation === 'cost_of_sales'
                                ? 'bg-[#2E5E88] text-white border-[#2E5E88]'
                                : isDark
                                ? 'bg-[#101626] border-[#222F4C] text-slate-400'
                                : 'bg-slate-100 border-[#D8CEBC] text-slate-600'
                            }`}
                          >
                            Cost of Sales
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateEmployee(emp.id, { allocation: 'operating_expenses' })}
                            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all text-center ${
                              emp.allocation === 'operating_expenses'
                                ? 'bg-[#2E5E88] text-white border-[#2E5E88]'
                                : isDark
                                ? 'bg-[#101626] border-[#222F4C] text-slate-400'
                                : 'bg-slate-100 border-[#D8CEBC] text-slate-600'
                            }`}
                          >
                            Expenses (Opex)
                          </button>
                        </div>
                      </div>

                      {/* Headcount FTEs */}
                      <div>
                        <label className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">
                          Headcount (FTEs):
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="200"
                          value={emp.numEmployees}
                          onChange={(e) => handleUpdateEmployee(emp.id, { numEmployees: Math.max(1, Number(e.target.value)) })}
                          className={`w-full p-2 rounded-lg border text-xs font-bold ${
                            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                          }`}
                        />
                      </div>

                      {/* Base Rate Monthly */}
                      <div>
                        <label className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">
                          Monthly Base Cost (/ FTE):
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={emp.baseRateMonthly}
                          onChange={(e) => handleUpdateEmployee(emp.id, { baseRateMonthly: Number(e.target.value) })}
                          className={`w-full p-2 rounded-lg border text-xs font-bold ${
                            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                          }`}
                        />
                      </div>

                      {/* Employment Type: Permanent vs Seasonal */}
                      <div>
                        <label className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">
                          Employment Schedule:
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateEmployee(emp.id, { employmentType: 'permanent' })}
                            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all text-center ${
                              emp.employmentType !== 'seasonal'
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : isDark
                                ? 'bg-[#101626] border-[#222F4C] text-slate-400'
                                : 'bg-slate-100 border-[#D8CEBC] text-slate-600'
                            }`}
                          >
                            Permanent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateEmployee(emp.id, {
                              employmentType: 'seasonal',
                              seasonalStartMonth: emp.seasonalStartMonth || 6,
                              seasonalEndMonth: emp.seasonalEndMonth || 9,
                            })}
                            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all text-center ${
                              emp.employmentType === 'seasonal'
                                ? 'bg-amber-700 text-white border-amber-700'
                                : isDark
                                ? 'bg-[#101626] border-[#222F4C] text-slate-400'
                                : 'bg-slate-100 border-[#D8CEBC] text-slate-600'
                            }`}
                          >
                            Seasonal
                          </button>
                        </div>
                      </div>

                      {/* Seasonal Month Picker OR Permanent Start Month */}
                      {emp.employmentType === 'seasonal' ? (
                        <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">
                              Seasonal Start Month:
                            </label>
                            <select
                              value={emp.seasonalStartMonth || 6}
                              onChange={(e) => handleUpdateEmployee(emp.id, { seasonalStartMonth: Number(e.target.value) })}
                              className={`w-full p-2 rounded-lg border text-xs font-bold ${
                                isDark ? 'bg-[#101626] border-[#222F4C] text-slate-200' : 'bg-white border-[#D8CEBC] text-slate-800'
                              }`}
                            >
                              {FULL_MONTH_NAMES.map((name, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {name} (M{i + 1})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">
                              Seasonal End Month:
                            </label>
                            <select
                              value={emp.seasonalEndMonth || 9}
                              onChange={(e) => handleUpdateEmployee(emp.id, { seasonalEndMonth: Number(e.target.value) })}
                              className={`w-full p-2 rounded-lg border text-xs font-bold ${
                                isDark ? 'bg-[#101626] border-[#222F4C] text-slate-200' : 'bg-white border-[#D8CEBC] text-slate-800'
                              }`}
                            >
                              {FULL_MONTH_NAMES.map((name, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {name} (M{i + 1})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">
                            Launch Start Month:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={emp.startMonth || 1}
                            onChange={(e) => handleUpdateEmployee(emp.id, { startMonth: Number(e.target.value) })}
                            className={`w-full p-2 rounded-lg border text-xs font-bold ${
                              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
                EMPLOYMENT CATEGORIES RUN-RATE (12-MONTH PERIOD)
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
                      Employment Category
                    </th>
                    {[...Array(12)].map((_, i) => (
                      <th key={i} className="py-3 px-2 font-bold uppercase text-center text-slate-500 min-w-[70px]">
                        M{i + 1}
                      </th>
                    ))}
                    <th className="py-3 px-3 font-bold uppercase text-right text-slate-900 dark:text-white min-w-[90px]">
                      Year {activeYear}
                    </th>
                    {/* Radio button column on the right per user's explicit standard style request */}
                    <th className="py-3 px-3 font-bold uppercase text-center text-[#2E5E88] dark:text-[#5584B4] min-w-[60px] w-[60px]">
                      Adjust
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Category Rows */}
                  {categories.map((cat) => {
                    const rowSeries = categoryMonthlyMatrix.categoryRows[cat.id] || new Array(60).fill(0);
                    const yearStartIdx = (activeYear - 1) * 12;
                    const yearValues = rowSeries.slice(yearStartIdx, yearStartIdx + 12);
                    const yearTotal = yearValues.reduce((s, v) => s + v, 0);
                    const isSelected = selectedCategoryId === cat.id;

                    return (
                      <tr
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
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
                            {cat.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            +{cat.onCostPct}% on-cost
                          </div>
                        </td>
                        {yearValues.map((val, idx) => (
                          <td key={idx} className="py-2.5 px-2 text-right tabular-nums text-slate-700 dark:text-slate-300">
                            {val > 0 ? val.toLocaleString() : '-'}
                          </td>
                        ))}
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                          {yearTotal > 0 ? yearTotal.toLocaleString() : '-'}
                        </td>
                        {/* Radio selection on the RIGHT */}
                        <td className="py-2.5 px-3 text-center w-[60px]" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="radio"
                            name="category-adjustment-selection"
                            checked={isSelected}
                            onChange={() => setSelectedCategoryId(cat.id)}
                            className="w-4 h-4 text-[#2E5E88] focus:ring-[#2E5E88] cursor-pointer"
                            aria-label={`Select ${cat.name} for adjustment`}
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary Rows (Transfer to Trading Account) */}
                  <tr className={`border-t-2 font-bold ${
                    isDark ? 'bg-[#0E1322]/80 border-[#222F4C] text-slate-200' : 'bg-slate-50/90 border-slate-300 text-slate-800'
                  }`}>
                    <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 w-[260px] min-w-[260px] max-w-[260px]">
                      Cost of Sales — Fixed (Employment)
                    </td>
                    {[...Array(12)].map((_, i) => {
                      const idx = (activeYear - 1) * 12 + i;
                      const val = categoryMonthlyMatrix.totalCosSeries[idx] || 0;
                      return (
                        <td key={i} className="py-2.5 px-2 text-right tabular-nums text-slate-600 dark:text-slate-400">
                          {val > 0 ? val.toLocaleString() : '-'}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-900 dark:text-white">
                      {categoryMonthlyMatrix.totalCosSeries
                        .slice((activeYear - 1) * 12, (activeYear - 1) * 12 + 12)
                        .reduce((s, v) => s + v, 0)
                        .toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>

                  <tr className={`font-bold ${
                    isDark ? 'bg-[#0E1322]/80 text-slate-200' : 'bg-slate-50/90 text-slate-800'
                  }`}>
                    <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 w-[260px] min-w-[260px] max-w-[260px]">
                      Expenses — Fixed (Employment)
                    </td>
                    {[...Array(12)].map((_, i) => {
                      const idx = (activeYear - 1) * 12 + i;
                      const val = categoryMonthlyMatrix.totalOpexSeries[idx] || 0;
                      return (
                        <td key={i} className="py-2.5 px-2 text-right tabular-nums text-slate-600 dark:text-slate-400">
                          {val > 0 ? val.toLocaleString() : '-'}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-900 dark:text-white">
                      {categoryMonthlyMatrix.totalOpexSeries
                        .slice((activeYear - 1) * 12, (activeYear - 1) * 12 + 12)
                        .reduce((s, v) => s + v, 0)
                        .toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                  </tr>

                  <tr className={`border-t font-bold text-sm ${
                    isDark ? 'bg-[#0E1322] border-[#222F4C] text-[#5584B4]' : 'bg-slate-100 border-[#D8CEBC] text-[#2E5E88]'
                  }`}>
                    <td className="py-3 px-3.5 uppercase w-[260px] min-w-[260px] max-w-[260px]">
                      Total Employment Cost
                    </td>
                    {[...Array(12)].map((_, i) => {
                      const idx = (activeYear - 1) * 12 + i;
                      const val = categoryMonthlyMatrix.grandTotalSeries[idx] || 0;
                      return (
                        <td key={i} className="py-3 px-2 text-right tabular-nums">
                          {val > 0 ? val.toLocaleString() : '-'}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-right tabular-nums">
                      {categoryMonthlyMatrix.grandTotalSeries
                        .slice((activeYear - 1) * 12, (activeYear - 1) * 12 + 12)
                        .reduce((s, v) => s + v, 0)
                        .toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
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
                ADJUSTMENT SLIDER — {selectedCategory.name}
              </span>
              <span>
                adjusts review & wage growth across 5-year forecast
              </span>
            </div>

            <BaseRateAdjustmentTool
              theme={theme}
              item={categorySliderAssumptionItem}
              selectedYear={activeYear}
              onSelectYear={setActiveYear}
              onUpdateMonthlyValues={handleSliderUpdateMonthlyValues}
              onUpdateBaseRate={handleSliderUpdateBaseRate}
              onPrevItem={() => handleCycleCategory('prev')}
              onNextItem={() => handleCycleCategory('next')}
            />
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STAGE 3: CHARTS TAB                                                 */}
      {/* =================================================================== */}
      {activeSubTab === 'charts' && (() => {
        // Filter employees based on active chart filters
        const filteredEmployees = employees.filter((emp) => {
          if (chartDepartmentFilter !== 'all' && emp.department.toLowerCase() !== chartDepartmentFilter.toLowerCase()) {
            return false;
          }
          if (chartAllocationFilter !== 'all' && emp.allocation !== chartAllocationFilter) {
            return false;
          }
          if (chartCategoryFilter !== 'all' && emp.categoryId !== chartCategoryFilter) {
            return false;
          }
          return true;
        });

        // Compute 60-month series for the filtered subset
        const filteredSeries = new Array(60).fill(0);
        let filteredCosTotal = 0;
        let filteredOpexTotal = 0;

        filteredEmployees.forEach((emp) => {
          for (let mo = 0; mo < 60; mo++) {
            const cost = computeEmployeeMonthlyCost(emp, mo);
            filteredSeries[mo] += cost;
            if (emp.allocation === 'cost_of_sales') {
              filteredCosTotal += cost;
            } else {
              filteredOpexTotal += cost;
            }
          }
        });

        const filteredHeadcount = filteredEmployees.reduce((sum, e) => sum + (e.numEmployees || 1), 0);

        // Chart Data for display
        const displayData = chartViewMode === 'monthly'
          ? [...Array(12)].map((_, i) => {
              const moIdx = (chartYear - 1) * 12 + i;
              return {
                label: `M${i + 1}`,
                fullLabel: `${FULL_MONTH_NAMES[i]} (Year ${chartYear})`,
                value: filteredSeries[moIdx] || 0,
              };
            })
          : [1, 2, 3, 4, 5].map((y) => {
              const start = (y - 1) * 12;
              const yearSum = filteredSeries.slice(start, start + 12).reduce((s, v) => s + v, 0);
              return {
                label: `Year ${y}`,
                fullLabel: `Forecast Year ${y}`,
                value: yearSum,
              };
            });

        const maxValue = Math.max(...displayData.map((d) => d.value), 1);
        const totalFilteredValue = displayData.reduce((s, d) => s + d.value, 0);
        const averageFilteredValue = Math.round(totalFilteredValue / (displayData.length || 1));

        return (
          <div className="space-y-6">
            {/* Filters Bar: Departments, Allocation, Category, View Mode */}
            <div className={`p-4 rounded-xl border space-y-4 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#2E5E88] dark:text-[#5584B4]" />
                  <span className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                    EMPLOYMENT CHARTS FILTERS & CONTROLS
                  </span>
                </div>

                {/* View Mode Toggle: Monthly vs 5-Year */}
                <div className="flex items-center gap-1 p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0E1322]">
                  <button
                    type="button"
                    onClick={() => setChartViewMode('monthly')}
                    className={`px-3 py-1 text-xs font-bold uppercase rounded-md transition-all ${
                      chartViewMode === 'monthly'
                        ? 'bg-[#2E5E88] text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Months within a Year
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartViewMode('5year')}
                    className={`px-3 py-1 text-xs font-bold uppercase rounded-md transition-all ${
                      chartViewMode === '5year'
                        ? 'bg-[#2E5E88] text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    5-Year Summary
                  </button>
                </div>
              </div>

              {/* Filter Dropdowns Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Department Filter */}
                <div>
                  <label className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">
                    Filter Department:
                  </label>
                  <select
                    value={chartDepartmentFilter}
                    onChange={(e) => setChartDepartmentFilter(e.target.value)}
                    className={`w-full p-2 rounded-lg border text-xs font-bold capitalize ${
                      isDark ? 'bg-[#0E1322] border-[#222F4C] text-slate-200' : 'bg-slate-50 border-[#D8CEBC] text-slate-800'
                    }`}
                  >
                    <option value="all">All Departments ({availableDepartments.length})</option>
                    {availableDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Allocation Filter */}
                <div>
                  <label className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">
                    Filter Allocation:
                  </label>
                  <select
                    value={chartAllocationFilter}
                    onChange={(e) => setChartAllocationFilter(e.target.value as any)}
                    className={`w-full p-2 rounded-lg border text-xs font-bold ${
                      isDark ? 'bg-[#0E1322] border-[#222F4C] text-slate-200' : 'bg-slate-50 border-[#D8CEBC] text-slate-800'
                    }`}
                  >
                    <option value="all">All Allocations</option>
                    <option value="cost_of_sales">Cost of Sales — Fixed</option>
                    <option value="operating_expenses">Expenses — Fixed (Opex)</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">
                    Filter Category:
                  </label>
                  <select
                    value={chartCategoryFilter}
                    onChange={(e) => setChartCategoryFilter(e.target.value)}
                    className={`w-full p-2 rounded-lg border text-xs font-bold ${
                      isDark ? 'bg-[#0E1322] border-[#222F4C] text-slate-200' : 'bg-slate-50 border-[#D8CEBC] text-slate-800'
                    }`}
                  >
                    <option value="all">All Category Bands ({categories.length})</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Selector (when in monthly mode) */}
                <div>
                  <label className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">
                    Year Selection:
                  </label>
                  {chartViewMode === 'monthly' ? (
                    <select
                      value={chartYear}
                      onChange={(e) => setChartYear(Number(e.target.value))}
                      className={`w-full p-2 rounded-lg border text-xs font-bold ${
                        isDark ? 'bg-[#0E1322] border-[#222F4C] text-slate-200' : 'bg-slate-50 border-[#D8CEBC] text-slate-800'
                      }`}
                    >
                      {[1, 2, 3, 4, 5].map((y) => (
                        <option key={y} value={y}>
                          Year {y} (12 Months)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className={`p-2 rounded-lg border text-xs font-bold text-slate-400 ${
                      isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-100 border-[#D8CEBC]'
                    }`}>
                      Full 5-Year Horizon Active
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Filtered Total Cost:</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                  {totalFilteredValue.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {chartViewMode === 'monthly' ? `Year ${chartYear} total` : '5-year cumulative'}
                </span>
              </div>

              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Period Average:</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                  {averageFilteredValue.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {chartViewMode === 'monthly' ? 'per month' : 'per year'}
                </span>
              </div>

              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Headcount in Scope:</span>
                <span className="text-lg font-bold text-[#2E5E88] dark:text-[#5584B4] tabular-nums">
                  {filteredHeadcount} FTEs
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {filteredEmployees.length} matching positions
                </span>
              </div>

              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Allocation Split:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-emerald-600">
                    COS: {filteredCosTotal + filteredOpexTotal > 0 ? Math.round((filteredCosTotal / (filteredCosTotal + filteredOpexTotal)) * 100) : 0}%
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-xs font-bold text-sky-600">
                    Opex: {filteredCosTotal + filteredOpexTotal > 0 ? Math.round((filteredOpexTotal / (filteredCosTotal + filteredOpexTotal)) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                  {chartViewMode === 'monthly'
                    ? `MONTHLY EMPLOYMENT RUN-RATE — YEAR ${chartYear}`
                    : '5-YEAR CUMULATIVE EMPLOYMENT TRAJECTORY'}
                </span>
              </div>

              <div className="pt-6 pb-2">
                <div className="grid grid-flow-col auto-cols-fr gap-2 sm:gap-4 items-end h-64 border-b border-slate-200 dark:border-slate-800 pb-2">
                  {displayData.map((d, idx) => {
                    const heightPct = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
                    return (
                      <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap pointer-events-none z-10 font-bold shadow-md">
                          {d.fullLabel}: {d.value.toLocaleString()}
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${Math.max(4, heightPct)}%` }}
                          className={`w-full max-w-[48px] rounded-t-md transition-all duration-300 ${
                            isDark
                              ? 'bg-gradient-to-t from-[#2E5E88]/50 to-[#5584B4] group-hover:to-sky-400'
                              : 'bg-gradient-to-t from-[#2E5E88] to-[#4678A7] group-hover:to-[#234E73]'
                          }`}
                        />

                        {/* Label */}
                        <span className="text-[10px] font-bold text-slate-500 mt-2 truncate w-full text-center">
                          {d.label}
                        </span>
                        <span className="text-[9px] font-mono tabular-nums text-slate-400 hidden sm:block">
                          {d.value >= 1000 ? `${Math.round(d.value / 1000)}k` : d.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
