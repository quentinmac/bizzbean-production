import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Layers,
  Calculator,
  BarChart3,
  Info,
  Briefcase,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import {
  BizzModelState,
  FixedAssetItem,
  STANDARD_ASSET_CATEGORIES,
  StandardAssetCategoryDef,
  PlatformForecastAppId,
} from '../constants';

interface FixedAssetsStepProps {
  theme?: 'light' | 'dark';
  mode: PlatformForecastAppId;
  state: BizzModelState;
  onUpdateState: (updater: (prev: BizzModelState) => BizzModelState) => void;
  subTab?: 'assumptions' | 'results' | 'charts';
  onSelectSubTab?: (tab: 'assumptions' | 'results' | 'charts') => void;
}

/**
 * Excel PMT Formula for lease calculations:
 * PMT = (PV * r) / (1 - (1 + r)^(-n))
 * where r = annualRatePct / 100 / 12, n = termYears * 12
 */
export function calculateLeasePMT(pv: number, annualRatePct: number, termYears: number): number {
  if (pv <= 0 || termYears <= 0) return 0;
  const n = termYears * 12;
  const r = annualRatePct / 100 / 12;
  if (r <= 0) return pv / n;
  return (pv * r) / (1 - Math.pow(1 + r, -n));
}

/**
 * Number formatter without currency symbols (Rands removed as requested)
 */
function fmtNum(n: number | undefined | null, decimals = 0): string {
  if (n === undefined || n === null || isNaN(n)) return '0';
  if (n === 0) return '0';
  const isNeg = n < 0;
  const abs = Math.abs(n);
  const formatted =
    decimals > 0
      ? abs.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).replace(/,/g, ' ')
      : Math.round(abs).toLocaleString('en-US').replace(/,/g, ' ');
  return isNeg ? `-${formatted}` : formatted;
}

export const FixedAssetsStep: React.FC<FixedAssetsStepProps> = ({
  theme = 'light',
  mode,
  state,
  onUpdateState,
  subTab = 'assumptions',
  onSelectSubTab,
}) => {
  const isDark = theme === 'dark';
  const [internalTab, setInternalTab] = useState<'assumptions' | 'results' | 'charts'>(subTab);
  const activeTab = subTab ?? internalTab;

  const setActiveTab = (t: 'assumptions' | 'results' | 'charts') => {
    try {
      localStorage.setItem('bizz_synchronized_subtab', t);
      window.dispatchEvent(new CustomEvent('bizz_subtab_change', { detail: t }));
    } catch {}
    if (onSelectSubTab) {
      onSelectSubTab(t);
    }
    setInternalTab(t);
  };

  const isRollingForecast = mode === 'rolling-forecast';

  // Categories list with fallback to standard categories
  const categoriesList = useMemo<StandardAssetCategoryDef[]>(() => {
    return state.assetCategories && state.assetCategories.length > 0
      ? state.assetCategories
      : [...STANDARD_ASSET_CATEGORIES];
  }, [state.assetCategories]);

  // Modal / Editing State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

  // Department list from Setup step
  const departments = useMemo(() => {
    return state.businessDetails?.departments && state.businessDetails.departments.length > 0
      ? state.businessDetails.departments
      : [
          { id: 'dep-1', name: 'administration', distributionPct: 40 },
          { id: 'dep-2', name: 'commercial & sales', distributionPct: 30 },
          { id: 'dep-3', name: 'product & engineering', distributionPct: 20 },
          { id: 'dep-4', name: 'operations', distributionPct: 10 },
        ];
  }, [state.businessDetails]);

  // Active form state
  const [formData, setFormData] = useState<Partial<FixedAssetItem>>({
    name: '',
    category: 'Plat and equipment',
    allocation: 'cost_of_sales',
    department: 'operations',
    purchaseTiming: 'forecast',
    monthsInSystem: 10,
    purchaseMonth: 1,
    quantity: 1,
    unitCost: 100000,
    purchaseCost: 100000,
    purchaseValue: 100000,
    depreciationRate: 16.67,
    usefulLifeMonths: 72,
    scrapValue: 0,
    financeOption: 'buy',
    leaseRatePct: 10.0,
    leaseTermYears: 5,
    openingCost: 0,
    openingAccumulatedDepreciation: 0,
    openingNetValue: 0,
    openingLeasedAsset: 0,
    openingInterestRatePct: 10.0,
    openingPeriodElapsed: 10,
    openingTermYears: 5,
  });

  // Selected view year for Schedule table (1..5)
  const [selectedScheduleYear, setSelectedScheduleYear] = useState<number>(1);

  // Selected Department filter for Charts tab
  const [chartDeptFilter, setChartDeptFilter] = useState<string>('all');
  const [chartViewMode, setChartViewMode] = useState<'5-year' | 'monthly'>('5-year');
  const [chartMonthlyYear, setChartMonthlyYear] = useState<number>(1);

  // Update Category depreciation rate
  const handleUpdateCategoryRate = (catName: string, newRate: number) => {
    const updated = categoriesList.map((cat) => {
      if (cat.name === catName) {
        return { ...cat, depreciationRate: Math.max(0.1, Number(newRate.toFixed(2))) };
      }
      return cat;
    });
    onUpdateState((prev) => ({
      ...prev,
      assetCategories: updated,
    }));
  };

  // Reset categories to standard default rates
  const handleResetCategories = () => {
    onUpdateState((prev) => ({
      ...prev,
      assetCategories: [...STANDARD_ASSET_CATEGORIES],
    }));
  };

  // Open modal for new asset
  const handleOpenAddModal = (presetCat?: string) => {
    const chosenCatName = presetCat || categoriesList[0]?.name || 'Commercial vehicles';
    const catDef = categoriesList.find((c) => c.name === chosenCatName) || categoriesList[0];
    const depRate = catDef ? catDef.depreciationRate : 20.0;
    const usefulLife = Math.round(1200 / depRate);

    setFormData({
      id: `fa-${Date.now()}`,
      name: `New ${chosenCatName}`,
      category: chosenCatName,
      allocation: 'cost_of_sales',
      department: departments[0]?.name || 'administration',
      purchaseTiming: 'forecast',
      monthsInSystem: 10,
      purchaseMonth: 1,
      quantity: 1,
      unitCost: 100000,
      purchaseCost: 100000,
      purchaseValue: 100000,
      depreciationRate: depRate,
      usefulLifeMonths: usefulLife,
      scrapValue: 0,
      financeOption: 'buy',
      leaseRatePct: 10.0,
      leaseTermYears: 5,
      openingCost: 0,
      openingAccumulatedDepreciation: 0,
      openingNetValue: 0,
      openingLeasedAsset: 0,
      openingInterestRatePct: 10.0,
      openingPeriodElapsed: 10,
      openingTermYears: 5,
    });
    setEditingAssetId(null);
    setIsModalOpen(true);
  };

  // Open modal to edit existing asset
  const handleOpenEditModal = (asset: FixedAssetItem) => {
    const timing =
      asset.purchaseTiming ||
      ((asset.openingCost && asset.openingCost > 0) || (asset.openingLeasedAsset && asset.openingLeasedAsset > 0)
        ? 'prior'
        : 'forecast');
    setFormData({
      ...asset,
      purchaseTiming: timing,
      monthsInSystem: asset.monthsInSystem || asset.openingPeriodElapsed || 10,
      leaseTermYears: asset.leaseTermYears || asset.openingTermYears || 5,
    });
    setEditingAssetId(asset.id);
    setIsModalOpen(true);
  };

  // Save asset (Add or Update)
  const handleSaveAsset = () => {
    if (!formData.name || !formData.name.trim()) return;

    const unitCost = Number(formData.unitCost || 0);
    const quantity = Math.max(1, Number(formData.quantity || 1));
    const pValue = unitCost * quantity;
    const depRate = Number(formData.depreciationRate || 20);
    const usefulLife = Math.round(1200 / depRate);
    const isPrior = isRollingForecast && formData.purchaseTiming === 'prior';
    const monthsInSys = Math.max(0, Number(formData.monthsInSystem || 10));
    const isLease = formData.financeOption === 'lease';
    const leaseYears = Math.min(5, Math.max(1, Number(formData.leaseTermYears || 5)));
    const leaseRate = Number(formData.leaseRatePct || 10);

    // Auto-calculate Year 0 Opening Values for prior purchases:
    let openCost = 0;
    let openAccDep = 0;
    let openNet = 0;
    let openLeased = 0;

    if (isPrior) {
      if (isLease) {
        openLeased = pValue;
      } else {
        openCost = pValue;
        openAccDep = Math.round((pValue * (depRate / 100) / 12) * monthsInSys);
        openAccDep = Math.min(pValue, openAccDep);
        openNet = Math.max(0, openCost - openAccDep);
      }
    }

    const assetItem: FixedAssetItem = {
      id: editingAssetId || `fa-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category || categoriesList[0]?.name,
      allocation: formData.allocation || 'cost_of_sales',
      department: formData.department || departments[0]?.name,
      purchaseTiming: isPrior ? 'prior' : 'forecast',
      monthsInSystem: monthsInSys,
      purchaseMonth: isPrior ? 1 : Math.max(1, Math.min(60, Number(formData.purchaseMonth || 1))),
      quantity,
      unitCost,
      purchaseCost: pValue,
      purchaseValue: pValue,
      depreciationRate: depRate,
      usefulLifeMonths: usefulLife,
      scrapValue: 0,
      financeOption: isLease ? 'lease' : 'buy',
      leaseRatePct: leaseRate,
      leaseTermYears: leaseYears,
      openingCost: openCost,
      openingAccumulatedDepreciation: openAccDep,
      openingNetValue: openNet,
      openingLeasedAsset: openLeased,
      openingInterestRatePct: leaseRate,
      openingPeriodElapsed: monthsInSys,
      openingTermYears: leaseYears,
    };

    onUpdateState((prev) => {
      const exists = prev.fixedAssets.some((a) => a.id === assetItem.id);
      const nextList = exists
        ? prev.fixedAssets.map((a) => (a.id === assetItem.id ? assetItem : a))
        : [...prev.fixedAssets, assetItem];
      return { ...prev, fixedAssets: nextList };
    });

    setIsModalOpen(false);
    setEditingAssetId(null);
  };

  // Delete asset
  const handleDeleteAsset = (id: string) => {
    onUpdateState((prev) => ({
      ...prev,
      fixedAssets: prev.fixedAssets.filter((a) => a.id !== id),
    }));
  };

  // Summary Metrics for Results Tab
  const resultsKPI = useMemo(() => {
    let totalCapex = 0;
    let totalLeasedValue = 0;
    let monthlyDepCos = 0;
    let monthlyDepOpex = 0;
    let monthlyLeaseCos = 0;
    let monthlyLeaseOpex = 0;

    (state.fixedAssets || []).forEach((asset) => {
      const pVal = asset.purchaseValue ?? (asset.unitCost * asset.quantity);
      const isLease = asset.financeOption === 'lease';
      const isCos = asset.allocation === 'cost_of_sales';
      const depRate = asset.depreciationRate || 20;

      if (isLease) {
        totalLeasedValue += pVal + (isRollingForecast ? (asset.openingLeasedAsset || 0) : 0);
        const pmt = calculateLeasePMT(pVal, asset.leaseRatePct || 10, asset.leaseTermYears || 10);
        if (isCos) monthlyLeaseCos += pmt;
        else monthlyLeaseOpex += pmt;
      } else {
        totalCapex += pVal;
        const dep = (pVal * (depRate / 100)) / 12;
        if (isCos) monthlyDepCos += dep;
        else monthlyDepOpex += dep;
      }
    });

    return {
      totalCapex,
      totalLeasedValue,
      monthlyDepTotal: monthlyDepCos + monthlyDepOpex,
      monthlyDepCos,
      monthlyDepOpex,
      monthlyLeaseTotal: monthlyLeaseCos + monthlyLeaseOpex,
      monthlyLeaseCos,
      monthlyLeaseOpex,
    };
  }, [state.fixedAssets, isRollingForecast]);

  // Compute 60-Month Schedule Table (depreciation calculation.PNG & capex.PNG)
  const scheduleData = useMemo(() => {
    const months = Array.from({ length: 60 }, (_, i) => i + 1);

    const buyAssets = state.fixedAssets.filter((a) => a.financeOption !== 'lease');
    const leaseAssets = state.fixedAssets.filter((a) => a.financeOption === 'lease');

    const priorBuyAssets = isRollingForecast ? buyAssets.filter((a) => a.purchaseTiming === 'prior') : [];
    const priorLeaseAssets = isRollingForecast ? leaseAssets.filter((a) => a.purchaseTiming === 'prior') : [];

    // Year 0 calculations for Buy
    const y0PurchaseValueBuy = priorBuyAssets.reduce((sum, a) => sum + (a.purchaseValue ?? a.unitCost * a.quantity), 0);
    const y0QuantityBuy = priorBuyAssets.reduce((sum, a) => sum + a.quantity, 0);
    const y0OriginalCost = y0PurchaseValueBuy;
    const y0DepRate = priorBuyAssets.length > 0 ? (priorBuyAssets[0]?.depreciationRate || 0) : 0;
    const y0AccumDep = priorBuyAssets.reduce((sum, a) => {
      const pVal = a.purchaseValue ?? a.unitCost * a.quantity;
      const rate = a.depreciationRate || 20.0;
      const mos = a.monthsInSystem || a.openingPeriodElapsed || 10;
      const dep = (pVal * (rate / 100) / 12) * mos;
      return sum + Math.min(pVal, dep);
    }, 0);
    const y0NetValue = Math.max(0, y0OriginalCost - y0AccumDep);

    // Year 0 calculations for Lease
    const y0PurchaseValueLease = priorLeaseAssets.reduce((sum, a) => sum + (a.purchaseValue ?? a.unitCost * a.quantity), 0);
    const y0QuantityLease = priorLeaseAssets.reduce((sum, a) => sum + a.quantity, 0);
    const y0LeasedAsset = y0PurchaseValueLease;
    const y0LeaseCosts = 0;
    const y0InterestRate = priorLeaseAssets.length > 0 ? (priorLeaseAssets[0]?.leaseRatePct || 0) : 0;
    const y0PeriodElapsed = priorLeaseAssets.length > 0 ? (priorLeaseAssets[0]?.monthsInSystem ?? priorLeaseAssets[0]?.openingPeriodElapsed ?? 0) : 0;
    const y0TermYears = priorLeaseAssets.length > 0 ? (priorLeaseAssets[0]?.leaseTermYears ?? priorLeaseAssets[0]?.openingTermYears ?? 0) : 0;

    // Month-by-month calculations (M1 to M60)
    let runningCumAccDep = y0AccumDep;

    const monthlyBreakdown = months.map((m) => {
      // 1. Buy Assets
      let pValBuy = 0;
      let qtyBuy = 0;
      let capexBuy = 0;
      let currentOrigCost = y0OriginalCost;
      let currentDepRate = y0DepRate;

      buyAssets.forEach((a) => {
        const val = a.purchaseValue ?? (a.unitCost * a.quantity);
        const isPrior = isRollingForecast && a.purchaseTiming === 'prior';
        if (!isPrior) {
          if (m === a.purchaseMonth) {
            pValBuy += val;
            qtyBuy += a.quantity;
            capexBuy += val;
          }
          if (m >= a.purchaseMonth) {
            currentOrigCost += val;
          }
        }
        if (a.depreciationRate) {
          currentDepRate = a.depreciationRate;
        }
      });

      // Monthly depreciation with zero cap once net value reaches zero
      let monthDep = 0;
      buyAssets.forEach((a) => {
        const val = a.purchaseValue ?? (a.unitCost * a.quantity);
        const rate = a.depreciationRate || 20.0;
        const baseMonthlyDep = (val * (rate / 100)) / 12;
        const isPrior = isRollingForecast && a.purchaseTiming === 'prior';

        if (isPrior) {
          const priorElapsed = (a.monthsInSystem || a.openingPeriodElapsed || 10) + (m - 1);
          const priorCum = Math.min(val, baseMonthlyDep * priorElapsed);
          const remNet = Math.max(0, val - priorCum);
          monthDep += Math.min(baseMonthlyDep, remNet);
        } else {
          if (m >= a.purchaseMonth) {
            const priorElapsed = m - a.purchaseMonth;
            const priorCum = Math.min(val, baseMonthlyDep * priorElapsed);
            const remNet = Math.max(0, val - priorCum);
            monthDep += Math.min(baseMonthlyDep, remNet);
          }
        }
      });

      runningCumAccDep += monthDep;
      const netVal = Math.max(0, currentOrigCost - runningCumAccDep);

      // 2. Lease Assets
      let pValLease = 0;
      let qtyLease = 0;
      let currentLeasedAsset = 0;
      let leaseCost = 0;
      let activeLeaseRate = 0;
      let activeElapsed = 0;
      let activeTermYears = 0;

      leaseAssets.forEach((a) => {
        const val = a.purchaseValue ?? (a.unitCost * a.quantity);
        const isPrior = isRollingForecast && a.purchaseTiming === 'prior';
        const totalTermMos = Math.min(60, (a.leaseTermYears || 5) * 12);
        const rate = a.leaseRatePct || 10.0;
        const termYrs = a.leaseTermYears || 5;

        if (!isPrior && m === a.purchaseMonth) {
          pValLease += val;
          qtyLease += a.quantity;
        }

        let isActive = false;
        let elapsed = 0;

        if (isPrior) {
          const priorMos = a.monthsInSystem || a.openingPeriodElapsed || 10;
          const remMos = Math.max(0, totalTermMos - priorMos);
          if (m <= remMos) {
            isActive = true;
            elapsed = Math.min(totalTermMos, priorMos + m);
          }
        } else {
          if (m >= a.purchaseMonth && m < a.purchaseMonth + totalTermMos) {
            isActive = true;
            elapsed = Math.min(totalTermMos, m - a.purchaseMonth + 1);
          }
        }

        if (isActive) {
          currentLeasedAsset += val;
          leaseCost += calculateLeasePMT(val, rate, termYrs);
          activeLeaseRate = rate;
          activeElapsed = elapsed;
          activeTermYears = termYrs;
        }
      });

      return {
        month: m,
        // Buy rows
        purchaseValueBuy: pValBuy,
        quantityBuy: qtyBuy,
        originalCost: currentOrigCost,
        depreciationRate: currentDepRate,
        depreciation: monthDep,
        accumulatedDepreciation: runningCumAccDep,
        netValue: netVal,
        balanceSheetValue: netVal,
        capitalExpenditure: capexBuy,
        // Lease rows
        purchaseValueLease: pValLease,
        quantityLease: qtyLease,
        leasedAsset: currentLeasedAsset,
        leaseCost,
        interestRate: activeLeaseRate,
        periodElapsed: activeElapsed,
        termYears: activeTermYears,
      };
    });

    return {
      y0: {
        purchaseValueBuy: y0PurchaseValueBuy,
        quantityBuy: y0QuantityBuy,
        originalCost: y0OriginalCost,
        depreciationRate: y0DepRate,
        accumulatedDepreciation: y0AccumDep,
        netValue: y0NetValue,
        balanceSheetValue: y0NetValue,
        purchaseValueLease: y0PurchaseValueLease,
        quantityLease: y0QuantityLease,
        leasedAsset: y0LeasedAsset,
        leaseCost: y0LeaseCosts,
        interestRate: y0InterestRate,
        periodElapsed: y0PeriodElapsed,
        termYears: y0TermYears,
      },
      monthly: monthlyBreakdown,
    };
  }, [state.fixedAssets, isRollingForecast]);

  // Compute 5-Year Charts Summary Table (fixed asset summary.PNG)
  const chartsSummary = useMemo(() => {
    const years = [1, 2, 3, 4, 5];

    // Filter assets by department if selected
    const filteredAssets = chartDeptFilter === 'all'
      ? state.fixedAssets
      : state.fixedAssets.filter((a) => (a.department || '').toLowerCase() === chartDeptFilter.toLowerCase());

    const buyAssets = filteredAssets.filter((a) => a.financeOption !== 'lease');
    const leaseAssets = filteredAssets.filter((a) => a.financeOption === 'lease');

    let runningAccumDep = isRollingForecast
      ? buyAssets.reduce((sum, a) => sum + (a.openingAccumulatedDepreciation || 0), 0)
      : 0;

    return years.map((yr) => {
      const startMo = (yr - 1) * 12 + 1;
      const endMo = yr * 12;

      // Assets purchased count in this year
      const assetsPurchasedCount = buyAssets.filter(
        (a) => a.purchaseMonth >= startMo && a.purchaseMonth <= endMo
      ).reduce((sum, a) => sum + a.quantity, 0);

      // Cumulative original cost up to this year end
      const openCost = isRollingForecast
        ? buyAssets.reduce((sum, a) => sum + (a.openingCost || 0), 0)
        : 0;
      const originalCost =
        openCost +
        buyAssets
          .filter((a) => a.purchaseMonth <= endMo)
          .reduce((sum, a) => sum + (a.purchaseValue ?? a.unitCost * a.quantity), 0);

      // Capex cash in this year
      const capexYear = buyAssets
        .filter((a) => a.purchaseMonth >= startMo && a.purchaseMonth <= endMo)
        .reduce((sum, a) => sum + (a.purchaseValue ?? a.unitCost * a.quantity), 0);

      // Depreciation in this year (COS vs Overheads)
      let depCosYear = 0;
      let depOpexYear = 0;

      for (let m = startMo; m <= endMo; m++) {
        if (isRollingForecast && openCost > 0) {
          buyAssets.forEach((a) => {
            const val = a.purchaseValue ?? (a.unitCost * a.quantity);
            const base = (m >= a.purchaseMonth ? a.openingCost || 0 + val : a.openingCost || 0);
            const d = (base * ((a.depreciationRate || 20) / 100)) / 12;
            if (a.allocation === 'cost_of_sales') depCosYear += d;
            else depOpexYear += d;
          });
        } else {
          buyAssets.forEach((a) => {
            const val = a.purchaseValue ?? (a.unitCost * a.quantity);
            const life = a.usefulLifeMonths || Math.round(1200 / (a.depreciationRate || 20));
            if (m >= a.purchaseMonth && m < a.purchaseMonth + life) {
              const d = (val * ((a.depreciationRate || 20) / 100)) / 12;
              if (a.allocation === 'cost_of_sales') depCosYear += d;
              else depOpexYear += d;
            }
          });
        }
      }

      const depTotalYear = depCosYear + depOpexYear;
      runningAccumDep += depTotalYear;
      const balanceSheetVal = Math.max(0, originalCost - runningAccumDep);

      // Lease costs in this year (COS vs Overheads)
      let leaseCosYear = 0;
      let leaseOpexYear = 0;

      for (let m = startMo; m <= endMo; m++) {
        leaseAssets.forEach((a) => {
          const val = a.purchaseValue ?? (a.unitCost * a.quantity);
          const termMos = (a.leaseTermYears || 10) * 12;

          let pmt = 0;
          if (isRollingForecast && (a.openingLeasedAsset || 0) > 0) {
            const base = m >= a.purchaseMonth ? (a.openingLeasedAsset || 0) + val : (a.openingLeasedAsset || 0);
            pmt = calculateLeasePMT(base, a.leaseRatePct || 10, a.leaseTermYears || 10);
          } else {
            if (m >= a.purchaseMonth && m < a.purchaseMonth + termMos) {
              pmt = calculateLeasePMT(val, a.leaseRatePct || 10, a.leaseTermYears || 10);
            }
          }

          if (a.allocation === 'cost_of_sales') leaseCosYear += pmt;
          else leaseOpexYear += pmt;
        });
      }

      return {
        year: yr,
        assetsPurchased: assetsPurchasedCount,
        originalCost,
        capexYear,
        depCos: depCosYear,
        depOpex: depOpexYear,
        depTotal: depTotalYear,
        accumulatedDepreciation: runningAccumDep,
        balanceSheetValue: balanceSheetVal,
        leaseCos: leaseCosYear,
        leaseOpex: leaseOpexYear,
        leaseTotal: leaseCosYear + leaseOpexYear,
      };
    });
  }, [state.fixedAssets, chartDeptFilter, isRollingForecast]);

  // Months slice for schedule table (12 months of selected year)
  const displayedScheduleMonths = useMemo(() => {
    const startMo = (selectedScheduleYear - 1) * 12;
    return scheduleData.monthly.slice(startMo, startMo + 12);
  }, [scheduleData, selectedScheduleYear]);

  return (
    <div className={`space-y-6 font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* =================================================================== */}
      {/* HEADER BAR (Matching Employment Standard)                           */}
      {/* =================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold uppercase tracking-tight text-slate-900 dark:text-white">
              FIXED ASSETS & CAPITAL EXPENDITURE (CAPEX)
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-[#2E5E88]/10 text-[#2E5E88] dark:text-[#5584B4]">
              {mode}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Straight-line depreciation schedules, lease options (Excel PMT), cost of sales vs overhead splits, and Year 0 opening assets.
          </p>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 1. ASSUMPTIONS SUBTAB                                              */}
      {/* =================================================================== */}
      {activeTab === 'assumptions' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Standard Asset Categories</div>
              <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">10</div>
              <div className="text-[10px] text-slate-400 mt-1">Official straight-line taxonomy</div>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Average Depreciation Rate</div>
              <div className="text-2xl font-bold mt-1 text-[#2E5E88] dark:text-[#5584B4]">
                {(categoriesList.reduce((s, c) => s + c.depreciationRate, 0) / categoriesList.length).toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Straight-line rate p.a.</div>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Shortest Useful Life</div>
              <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">36 mos</div>
              <div className="text-[10px] text-slate-400 mt-1">Computer hardware & software (33.33%)</div>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Longest Useful Life</div>
              <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">72 mos</div>
              <div className="text-[10px] text-slate-400 mt-1">Furniture & plant equipment (16.67%)</div>
            </div>
          </div>

          {/* Categories Listing Table */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                  OFFICIAL FIXED ASSET CATEGORIES & DEPRECIATION RATES
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Users can customize straight-line rates for any category. Useful life and monthly write-offs update dynamically.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetCategories}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors"
                title="Reset all category rates to default"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset to Standard</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Category Description</th>
                    <th className="py-2.5 px-3 text-right">Depreciation Rate % (p.a.)</th>
                    <th className="py-2.5 px-3 text-right">Derived Useful Life (Months)</th>
                    <th className="py-2.5 px-3 text-right">Equivalent Years</th>
                    <th className="py-2.5 px-3 text-center">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {categoriesList.map((cat, idx) => {
                    const derivedMonths = Math.round(1200 / cat.depreciationRate);
                    const derivedYears = (derivedMonths / 12).toFixed(1);

                    return (
                      <tr key={cat.name} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white capitalize">
                          {cat.name}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              min="1"
                              max="100"
                              value={cat.depreciationRate}
                              onChange={(e) => handleUpdateCategoryRate(cat.name, Number(e.target.value))}
                              className={`w-20 px-2 py-1 rounded-lg border text-right font-bold text-xs ${
                                isDark ? 'bg-[#0E1322] border-[#222F4C] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                              }`}
                            />
                            <span className="text-slate-400 font-bold">%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#2E5E88] dark:text-[#5584B4]">
                          {derivedMonths} mos
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                          {derivedYears} yrs
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('results');
                              handleOpenAddModal(cat.name);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#2E5E88]/10 hover:bg-[#2E5E88]/20 text-[#2E5E88] dark:text-[#5584B4] font-bold text-[11px] uppercase transition-colors"
                          >
                            Add Asset
                          </button>
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
      {/* 2. RESULTS SUBTAB                                                  */}
      {/* =================================================================== */}
      {activeTab === 'results' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Results Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Total Capex (Buy Option)</div>
              <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {fmtNum(resultsKPI.totalCapex)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Cash purchases across 60 months</div>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Total Leased Assets Value</div>
              <div className="text-2xl font-bold mt-1 text-[#2E5E88] dark:text-[#5584B4]">
                {fmtNum(resultsKPI.totalLeasedValue)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Off-balance sheet lease facilities</div>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Monthly Depreciation</div>
              <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {fmtNum(resultsKPI.monthlyDepTotal)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                COS: {fmtNum(resultsKPI.monthlyDepCos)} · Opex: {fmtNum(resultsKPI.monthlyDepOpex)}
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Monthly Lease Costs</div>
              <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                {fmtNum(resultsKPI.monthlyLeaseTotal)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                COS: {fmtNum(resultsKPI.monthlyLeaseCos)} · Opex: {fmtNum(resultsKPI.monthlyLeaseOpex)}
              </div>
            </div>
          </div>

          {/* Captured Fixed Assets Table */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                  CAPTURED FIXED ASSETS & LEASE CONTRACTS
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  No limitation on number of items across any app. Year 0 opening values active in bizzoptimizer.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold uppercase shadow-xs transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Fixed Asset</span>
              </button>
            </div>

            {state.fixedAssets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No fixed assets captured yet. Click "Add Fixed Asset" to add capital equipment or leases.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500">
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Allocation</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3 text-center">Month</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Cost</th>
                      <th className="py-2.5 px-3 text-right">Purchase Value</th>
                      <th className="py-2.5 px-3 text-center">Option</th>
                      <th className="py-2.5 px-3 text-right">Monthly Charge</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {state.fixedAssets.map((asset) => {
                      const pVal = asset.purchaseValue ?? (asset.unitCost * asset.quantity);
                      const isLease = asset.financeOption === 'lease';
                      const monthlyCharge = isLease
                        ? calculateLeasePMT(pVal, asset.leaseRatePct || 10, asset.leaseTermYears || 10)
                        : (pVal * ((asset.depreciationRate || 20) / 100)) / 12;

                      return (
                        <tr key={asset.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                            {asset.name}
                            {isRollingForecast && ((asset.openingCost || 0) > 0 || (asset.openingLeasedAsset || 0) > 0) && (
                              <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold uppercase">
                                Y0: {fmtNum(isLease ? asset.openingLeasedAsset : asset.openingCost)}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 capitalize">{asset.category}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                asset.allocation === 'cost_of_sales'
                                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                  : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {asset.allocation === 'cost_of_sales' ? 'Cost of Sales' : 'Overheads'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 capitalize text-slate-600 dark:text-slate-300">
                            {asset.department}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-200">
                            M{asset.purchaseMonth}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">{asset.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{fmtNum(asset.unitCost)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {fmtNum(pVal)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                isLease
                                  ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                                  : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              {isLease ? `Lease (${asset.leaseRatePct}%)` : 'Buy'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2E5E88] dark:text-[#5584B4]">
                            {fmtNum(monthlyCharge)} / mo
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(asset)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                                title="Edit Asset"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAsset(asset.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                                title="Delete Asset"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detailed Monthly Depreciation & Lease Calculation Table (depreciation calculation.PNG) */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                  DEPRECIATION & LEASE CALCULATION SCHEDULE
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Monthly progression showing original cost, depreciation, net book value, and lease cash outflows.
                </p>
              </div>

              {/* Year Switcher */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedScheduleYear(yr)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all uppercase ${
                      selectedScheduleYear === yr
                        ? 'bg-[#2E5E88] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Year {yr}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <th className="py-2 px-3 text-left w-52 uppercase">Metric / Account Line</th>
                    {/* Year 0 column */}
                    <th className="py-2 px-2.5 text-center bg-blue-50/70 dark:bg-blue-950/40 border-l border-r border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 uppercase">
                      Year 0
                      {!isRollingForecast && (
                        <span className="block text-[8px] font-normal text-slate-400">(bizzoptimizer)</span>
                      )}
                    </th>
                    {displayedScheduleMonths.map((m) => (
                      <th key={m.month} className="py-2 px-2 text-center uppercase min-w-[65px]">
                        M{m.month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {/* SECTION 1: FIXED ASSETS PURCHASED */}
                  <tr className="bg-slate-100/60 dark:bg-slate-800/40 font-bold text-slate-900 dark:text-white">
                    <td colSpan={14} className="py-2 px-3 text-left uppercase text-[11px] tracking-wider text-[#2E5E88] dark:text-[#5584B4]">
                      Fixed Assets Purchased (Cash Capex & Depreciation)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-left text-slate-600 dark:text-slate-400">purchase value</td>
                    <td className="py-1.5 px-2.5 bg-blue-50/30 dark:bg-blue-950/20 border-l border-r border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300 font-bold">
                      {scheduleData.y0.purchaseValueBuy > 0 ? fmtNum(scheduleData.y0.purchaseValueBuy) : '-'}
                    </td>
                    {displayedScheduleMonths.map((m) => (
                      <td key={m.month} className="py-1.5 px-2">
                        {m.purchaseValueBuy > 0 ? fmtNum(m.purchaseValueBuy) : ''}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-left text-slate-600 dark:text-slate-400">quantity</td>
                    <td className="py-1.5 px-2.5 bg-blue-50/30 dark:bg-blue-950/20 border-l border-r border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300 font-bold">
                      {scheduleData.y0.quantityBuy > 0 ? scheduleData.y0.quantityBuy : '-'}
                    </td>
                    {displayedScheduleMonths.map((m) => (
                      <td key={m.month} className="py-1.5 px-2">
                        {m.quantityBuy > 0 ? m.quantityBuy : ''}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50/40 dark:bg-slate-900/20 font-bold">
                    <td className="py-1.5 px-3 text-left text-slate-700 dark:text-slate-300">original cost</td>
                    <td className="py-1.5 px-2.5 bg-blue-50/70 dark:bg-blue-950/40 border-l border-r border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300">
                      {fmtNum(scheduleData.y0.originalCost)}
                    </td>
                    {displayedScheduleMonths.map((m) => (
                      <td key={m.month} className="py-1.5 px-2">
                        {fmtNum(m.originalCost)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-left text-slate-600 dark:text-slate-400">depreciation rate</td>
                    <td className="py-1.5 px-2.5 bg-blue-50/30 dark:bg-blue-950/20 border-l border-r border-blue-200 dark:border-blue-800 text-slate-600 dark:text-slate-300">
                      {scheduleData.y0.depreciationRate > 0 ? `${scheduleData.y0.depreciationRate.toFixed(2)}%` : '-'}
                    </td>
                    {displayedScheduleMonths.map((m) => (
                      <td key={m.month} className="py-1.5 px-2 text-rose-600 dark:text-rose-400">
                        {m.depreciation > 0 ? `-${fmtNum(m.depreciation)}` : '0'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-left text-slate-600 dark:text-slate-400">accumulated depreciation</td>
                    <td className="py-1.5 px-2.5 bg-blue-50/30 dark:bg-blue-950/20 border-l border-r border-blue-200 dark:border-blue-800 text-rose-600 dark:text-rose-400 font-bold">
                      {scheduleData.y0.accumulatedDepreciation > 0 ? `-${fmtNum(scheduleData.y0.accumulatedDepreciation)}` : '0'}
                    </td>
                    {displayedScheduleMonths.map((m) => (
                      <td key={m.month} className="py-1.5 px-2 text-rose-600 dark:text-rose-400">
                        {m.accumulatedDepreciation > 0 ? `-${fmtNum(m.accumulatedDepreciation)}` : '0'}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50/60 dark:bg-slate-900/30 font-bold">
                    <td className="py-1.5 px-3 text-left text-slate-900 dark:text-white">net value</td>
                    <td className="py-1.5 px-2.5 bg-blue-50/70 dark:bg-blue-950/40 border-l border-r border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300">
                      {fmtNum(scheduleData.y0.netValue)}
                    </td>
                    {displayedScheduleMonths.map((m) => (
                      <td key={m.month} className="py-1.5 px-2">
                        {fmtNum(m.netValue)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-left text-slate-600 dark:text-slate-400">balance sheet value</td>
                    <td className="py-1.5 px-2.5 bg-blue-50/30 dark:bg-blue-950/20 border-l border-r border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300 font-bold">
                      {fmtNum(scheduleData.y0.balanceSheetValue)}
                    </td>
                    {displayedScheduleMonths.map((m) => (
                      <td key={m.month} className="py-1.5 px-2 font-bold text-slate-900 dark:text-white">
                        {fmtNum(m.balanceSheetValue)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b-2 border-slate-300 dark:border-slate-700">
                    <td className="py-1.5 px-3 text-left text-slate-600 dark:text-slate-400">capital expenditure</td>
                    <td className="py-1.5 px-2.5 bg-blue-50/30 dark:bg-blue-950/20 border-l border-r border-blue-200 dark:border-blue-800 text-slate-400">-</td>
                    {displayedScheduleMonths.map((m) => (
                      <td key={m.month} className="py-1.5 px-2 font-bold text-[#2E5E88] dark:text-[#5584B4]">
                        {m.capitalExpenditure > 0 ? fmtNum(m.capitalExpenditure) : ''}
                      </td>
                    ))}
                  </tr>

                  {/* SECTION 2: LEASE OPTION */}
                  <tr className="bg-slate-100/60 dark:bg-slate-800/40 font-bold text-slate-900 dark:text-white">
                    <td colSpan={14} className="py-2 px-3 text-left uppercase text-[11px] tracking-wider text-purple-700 dark:text-purple-400">
                      Lease Option (Operating / Finance Leases)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-left text-slate-600 dark:text-slate-400">purchase value</td>
                    <td className="py-1.5 px-2.5 bg-blue-50/30 dark:bg-blue-950/20 border-l border-r border-blue-200 dark:border-blue-800 text-purple-900 dark:text-purple-300 font-bold">
                      {scheduleData.y0.purchaseValueLease > 0 ? fmtNum(scheduleData.y0.purchaseValueLease) : '-'}
                    </td>
                    {displayedScheduleMonths.map((m) => (
                      <td key={m.month} className="py-1.5 px-2">
                        {m.purchaseValueLease > 0 ? fmtNum(m.purchaseValueLease) : ''}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-left text-slate-600 dark:text-slate-400">quantity</td>
                    <td className="py-1.5 px-2.5 bg-blue-50/30 dark:bg-blue-950/20 border-l border-r border-blue-200 dark:border-blue-800 text-purple-900 dark:text-purple-300 font-bold">
                      {scheduleData.y0.quantityLease > 0 ? scheduleData.y0.quantityLease : '-'}
                    </td>
                    {displayedScheduleMonths.map((m) => (
                      <td key={m.month} className="py-1.5 px-2">
                        {m.quantityLease > 0 ? m.quantityLease : ''}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50/40 dark:bg-slate-900/20 font-bold">
                    <td className="py-1.5 px-3 text-left text-slate-700 dark:text-slate-300">leased asset</td>
                    <td className="py-1.5 px-2.5 bg-blue-50/70 dark:bg-blue-950/40 border-l border-r border-blue-200 dark:border-blue-800 text-purple-900 dark:text-purple-300">
                      {fmtNum(scheduleData.y0.leasedAsset)}
                    </td>
                    {displayedScheduleMonths.map((m) => (
                      <td key={m.month} className="py-1.5 px-2">
                        {fmtNum(m.leasedAsset)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-left text-slate-600 dark:text-slate-400">lease costs</td>
                    <td className="py-1.5 px-2.5 bg-blue-50/30 dark:bg-blue-950/20 border-l border-r border-blue-200 dark:border-blue-800 text-slate-400">-</td>
                    {displayedScheduleMonths.map((m) => (
                      <td key={m.month} className="py-1.5 px-2 text-rose-600 dark:text-rose-400 font-bold">
                        {m.leaseCost > 0 ? `-${fmtNum(m.leaseCost)}` : '0'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-left text-slate-600 dark:text-slate-400">interest rate</td>
                    <td className="py-1.5 px-2.5 bg-blue-50/30 dark:bg-blue-950/20 border-l border-r border-blue-200 dark:border-blue-800 text-slate-600 dark:text-slate-300">
                      {scheduleData.y0.interestRate > 0 ? `${scheduleData.y0.interestRate.toFixed(2)}%` : '-'}
                    </td>
                    {displayedScheduleMonths.map((m) => (
                      <td key={m.month} className="py-1.5 px-2 text-slate-500">
                        {m.interestRate > 0 ? `${m.interestRate.toFixed(2)}%` : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-left text-slate-600 dark:text-slate-400">period elapsed</td>
                    <td className="py-1.5 px-2.5 bg-blue-50/30 dark:bg-blue-950/20 border-l border-r border-blue-200 dark:border-blue-800 text-slate-600 dark:text-slate-300">
                      {scheduleData.y0.periodElapsed > 0 ? scheduleData.y0.periodElapsed : '-'}
                    </td>
                    {displayedScheduleMonths.map((m) => (
                      <td key={m.month} className="py-1.5 px-2 text-slate-500">
                        {m.periodElapsed > 0 ? m.periodElapsed : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-left text-slate-600 dark:text-slate-400">term - years</td>
                    <td className="py-1.5 px-2.5 bg-blue-50/30 dark:bg-blue-950/20 border-l border-r border-blue-200 dark:border-blue-800 text-slate-600 dark:text-slate-300">
                      {scheduleData.y0.termYears > 0 ? scheduleData.y0.termYears : '-'}
                    </td>
                    {displayedScheduleMonths.map((m) => (
                      <td key={m.month} className="py-1.5 px-2 text-slate-500">
                        {m.termYears > 0 ? m.termYears : '-'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. CHARTS SUBTAB (fixed asset summary.PNG)                         */}
      {/* =================================================================== */}
      {activeTab === 'charts' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Department Filter Bar */}
          <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">DEPT:</span>
              <select
                value={chartDeptFilter}
                onChange={(e) => setChartDeptFilter(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  isDark ? 'bg-[#0E1322] border-[#222F4C] text-white' : 'bg-slate-50 border-[#D8CEBC] text-slate-900'
                }`}
              >
                <option value="all">all departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setChartViewMode('5-year')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all uppercase ${
                  chartViewMode === '5-year'
                    ? 'bg-[#2E5E88] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                5-Year Summary
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('monthly')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all uppercase ${
                  chartViewMode === 'monthly'
                    ? 'bg-[#2E5E88] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Monthly (1-12)
              </button>
            </div>
          </div>

          {/* TABLE 1 & TABLE 2 (Matching fixed asset summary.PNG) */}
          <div className="grid grid-cols-1 gap-6">
            {/* Table 1: Fixed Assets Purchased */}
            <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                  FIXED ASSETS PURCHASED
                </h3>
                <span className="text-[10px] text-slate-400 uppercase font-mono">5-Year Analysis</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-[#2E5E88] dark:text-[#5584B4]">
                      <th className="py-2.5 px-3 text-left w-64">fixed assets purchased</th>
                      <th className="py-2.5 px-4">year 1</th>
                      <th className="py-2.5 px-4">year 2</th>
                      <th className="py-2.5 px-4">year 3</th>
                      <th className="py-2.5 px-4">year 4</th>
                      <th className="py-2.5 px-4">year 5</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    <tr>
                      <td className="py-2 px-3 text-left text-slate-600 dark:text-slate-400">assets purchased</td>
                      {chartsSummary.map((c) => (
                        <td key={c.year} className="py-2 px-4 text-slate-700 dark:text-slate-300">
                          {c.assetsPurchased}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-left text-slate-600 dark:text-slate-400">original cost</td>
                      {chartsSummary.map((c) => (
                        <td key={c.year} className="py-2 px-4 font-bold text-slate-900 dark:text-white">
                          {fmtNum(c.originalCost)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-left text-slate-600 dark:text-slate-400">depreciation - cost of sales</td>
                      {chartsSummary.map((c) => (
                        <td key={c.year} className="py-2 px-4 text-blue-600 dark:text-blue-400">
                          {fmtNum(c.depCos)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-left text-slate-600 dark:text-slate-400">depreciation - overheads</td>
                      {chartsSummary.map((c) => (
                        <td key={c.year} className="py-2 px-4 text-amber-600 dark:text-amber-400">
                          {fmtNum(c.depOpex)}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-slate-50/60 dark:bg-slate-900/30 font-bold">
                      <td className="py-2 px-3 text-left text-slate-900 dark:text-white">depreciation - total</td>
                      {chartsSummary.map((c) => (
                        <td key={c.year} className="py-2 px-4 text-[#2E5E88] dark:text-[#5584B4]">
                          {fmtNum(c.depTotal)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-left text-slate-600 dark:text-slate-400">accumulated depreciation</td>
                      {chartsSummary.map((c) => (
                        <td key={c.year} className="py-2 px-4 text-rose-600 dark:text-rose-400">
                          {c.accumulatedDepreciation > 0 ? `-${fmtNum(c.accumulatedDepreciation)}` : '0'}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-blue-50/40 dark:bg-blue-950/20 font-bold border-t border-slate-300 dark:border-slate-700">
                      <td className="py-2.5 px-3 text-left text-[#2E5E88] dark:text-[#5584B4]">balance sheet value</td>
                      {chartsSummary.map((c) => (
                        <td key={c.year} className="py-2.5 px-4 text-slate-900 dark:text-white">
                          {fmtNum(c.balanceSheetValue)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Fixed Asset Lease Costs */}
            <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                  FIXED ASSET LEASE COSTS
                </h3>
                <span className="text-[10px] text-slate-400 uppercase font-mono">5-Year Analysis</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-[#2E5E88] dark:text-[#5584B4]">
                      <th className="py-2.5 px-3 text-left w-64">fixed asset lease costs</th>
                      <th className="py-2.5 px-4">year 1</th>
                      <th className="py-2.5 px-4">year 2</th>
                      <th className="py-2.5 px-4">year 3</th>
                      <th className="py-2.5 px-4">year 4</th>
                      <th className="py-2.5 px-4">year 5</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    <tr>
                      <td className="py-2 px-3 text-left text-slate-600 dark:text-slate-400">lease costs - cost of sales</td>
                      {chartsSummary.map((c) => (
                        <td key={c.year} className="py-2 px-4 text-blue-600 dark:text-blue-400">
                          {fmtNum(c.leaseCos)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-left text-slate-600 dark:text-slate-400">lease costs - overheads</td>
                      {chartsSummary.map((c) => (
                        <td key={c.year} className="py-2 px-4 text-amber-600 dark:text-amber-400">
                          {fmtNum(c.leaseOpex)}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-purple-50/40 dark:bg-purple-950/20 font-bold border-t border-slate-300 dark:border-slate-700">
                      <td className="py-2.5 px-3 text-left text-purple-700 dark:text-purple-400">lease costs - total</td>
                      {chartsSummary.map((c) => (
                        <td key={c.year} className="py-2.5 px-4 text-purple-900 dark:text-purple-200 font-bold">
                          {fmtNum(c.leaseTotal)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Visual Charts: 2 Dedicated Charts */}
          <div className="space-y-6">

            {/* CHART 1: CAPITAL EXPENDITURE (CAPEX) */}
            <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
                  <h3 className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                    {chartViewMode === '5-year'
                      ? 'CAPITAL EXPENDITURE (CAPEX) — 5-YEAR PROFILE'
                      : `MONTHLY CAPITAL EXPENDITURE (CAPEX) — YEAR ${chartMonthlyYear}`}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  {/* Summary Badge */}
                  {chartViewMode === '5-year' ? (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#5584B4] border border-[#2E5E88]/25">
                      5-Year Total Capex: {fmtNum(chartsSummary.reduce((acc, c) => acc + c.capexYear, 0))}
                    </span>
                  ) : (
                    (() => {
                      const yrTotal = Array.from({ length: 12 }, (_, i) => {
                        const m = scheduleData.monthly[(chartMonthlyYear - 1) * 12 + i];
                        return m ? m.capitalExpenditure : 0;
                      }).reduce((a, b) => a + b, 0);
                      return (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#5584B4] border border-[#2E5E88]/25">
                          Year {chartMonthlyYear} Capex: {fmtNum(yrTotal)}
                        </span>
                      );
                    })()
                  )}

                  {/* Monthly Mode Year Selector */}
                  {chartViewMode === 'monthly' && (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setChartMonthlyYear(yr)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                            chartMonthlyYear === yr
                              ? 'bg-[#2E5E88] text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Y{yr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 5-Year Capex View */}
              {chartViewMode === '5-year' && (
                <div className="space-y-4 pt-2">
                  {(() => {
                    const maxCapexVal = Math.max(...chartsSummary.map((c) => c.capexYear), 1);
                    return (
                      <div className="grid grid-cols-5 gap-3 h-52 items-end border-b border-slate-200 dark:border-slate-800 pb-3">
                        {chartsSummary.map((c) => {
                          const capexH = maxCapexVal > 0 ? (c.capexYear / maxCapexVal) * 100 : 0;
                          return (
                            <div key={c.year} className="flex flex-col items-center h-full justify-end gap-1.5 group relative">
                              {/* Hover Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg whitespace-nowrap z-20 font-bold shadow-lg pointer-events-none">
                                <div>Year {c.year} Capital Expenditure</div>
                                <div className="text-[#5584B4] font-normal">
                                  Capex: {fmtNum(c.capexYear)} ({c.assetsPurchased} assets purchased)
                                </div>
                              </div>

                              {/* Value label above bar */}
                              <span className="text-[10px] font-bold font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                {c.capexYear > 0 ? fmtNum(c.capexYear) : '-'}
                              </span>

                              {/* Capex Bar */}
                              <div
                                style={{ height: `${Math.max(c.capexYear > 0 ? 6 : 0, capexH)}%` }}
                                className={`w-full max-w-[56px] rounded-t-md transition-all duration-300 shadow-xs ${
                                  c.capexYear > 0
                                    ? 'bg-gradient-to-t from-[#2E5E88] to-[#5584B4] group-hover:to-sky-400'
                                    : 'bg-slate-200 dark:bg-slate-800'
                                }`}
                              />

                              {/* Year Label */}
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mt-1">
                                Year {c.year}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="w-3 h-3 rounded-xs bg-[#2E5E88]" />
                      <span className="text-slate-600 dark:text-slate-300">Capital Purchases (Capex)</span>
                    </div>
                    <span className="text-[11px] text-slate-400 lowercase">
                      cash capex transfers to balance sheet as fixed assets purchased
                    </span>
                  </div>
                </div>
              )}

              {/* Monthly Capex View */}
              {chartViewMode === 'monthly' && (
                <div className="space-y-4 pt-2">
                  {(() => {
                    const monthlyCapex = Array.from({ length: 12 }, (_, idx) => {
                      const absMo = (chartMonthlyYear - 1) * 12 + idx;
                      const mData = scheduleData.monthly[absMo] || { capitalExpenditure: 0 };
                      return Number(mData.capitalExpenditure) || 0;
                    });
                    const maxCapexVal = Math.max(...monthlyCapex, 1);

                    return (
                      <div className="grid grid-flow-col auto-cols-fr gap-2 h-52 items-end border-b border-slate-200 dark:border-slate-800 pb-3">
                        {Array.from({ length: 12 }, (_, idx) => {
                          const absMo = (chartMonthlyYear - 1) * 12 + idx;
                          const mData = scheduleData.monthly[absMo] || { capitalExpenditure: 0 };
                          const capexVal = Number(mData.capitalExpenditure) || 0;
                          const capexH = maxCapexVal > 0 ? (capexVal / maxCapexVal) * 100 : 0;

                          return (
                            <div key={idx} className="flex flex-col items-center h-full justify-end gap-1 group relative">
                              {/* Hover Tooltip */}
                              {capexVal > 0 && (
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap z-20 font-bold shadow-md pointer-events-none">
                                  Month {idx + 1}: {fmtNum(capexVal)}
                                </div>
                              )}

                              {/* Value label above bar */}
                              <span className="text-[9px] font-mono tabular-nums text-slate-500">
                                {capexVal > 0 ? (capexVal >= 1000 ? `${Math.round(capexVal / 1000)}k` : fmtNum(capexVal)) : '-'}
                              </span>

                              {/* Capex Bar */}
                              <div
                                style={{ height: `${Math.max(capexVal > 0 ? 6 : 0, capexH)}%` }}
                                className={`w-full max-w-[42px] rounded-t-sm transition-all duration-300 ${
                                  capexVal > 0
                                    ? 'bg-gradient-to-t from-[#2E5E88] to-[#5584B4] group-hover:to-sky-400'
                                    : 'bg-slate-200/50 dark:bg-slate-800/50'
                                }`}
                              />

                              {/* Month Number */}
                              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 mt-1">
                                M{idx + 1}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="w-3 h-3 rounded-xs bg-[#2E5E88]" />
                      <span className="text-slate-600 dark:text-slate-300">Monthly Capital Expenditure</span>
                    </div>
                    <span className="text-[11px] text-slate-400 lowercase">
                      timing corresponds with asset purchase month
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* CHART 2: DEPRECIATION & LEASE EXPENSES */}
            <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                    {chartViewMode === '5-year'
                      ? 'DEPRECIATION & LEASE EXPENSES — 5-YEAR PROFILE'
                      : `MONTHLY DEPRECIATION & LEASE EXPENSES — YEAR ${chartMonthlyYear}`}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  {/* Summary Badge */}
                  {chartViewMode === '5-year' ? (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      5-Yr Dep: {fmtNum(chartsSummary.reduce((acc, c) => acc + c.depTotal, 0))} · 5-Yr Leases: {fmtNum(chartsSummary.reduce((acc, c) => acc + c.leaseTotal, 0))}
                    </span>
                  ) : (
                    (() => {
                      let depY = 0;
                      let leaseY = 0;
                      for (let i = 0; i < 12; i++) {
                        const m = scheduleData.monthly[(chartMonthlyYear - 1) * 12 + i];
                        if (m) {
                          depY += m.depreciation;
                          leaseY += m.leaseCost;
                        }
                      }
                      return (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          Year {chartMonthlyYear} Dep: {fmtNum(depY)} · Leases: {fmtNum(leaseY)}
                        </span>
                      );
                    })()
                  )}

                  {/* Monthly Mode Year Selector */}
                  {chartViewMode === 'monthly' && (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setChartMonthlyYear(yr)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                            chartMonthlyYear === yr
                              ? 'bg-[#2E5E88] text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Y{yr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 5-Year Expenses View */}
              {chartViewMode === '5-year' && (
                <div className="space-y-4 pt-2">
                  {(() => {
                    const maxExpenseVal = Math.max(
                      ...chartsSummary.map((c) => Math.max(c.depTotal, c.leaseTotal)),
                      1
                    );

                    return (
                      <div className="grid grid-cols-5 gap-3 h-52 items-end border-b border-slate-200 dark:border-slate-800 pb-3">
                        {chartsSummary.map((c) => {
                          const depH = maxExpenseVal > 0 ? (c.depTotal / maxExpenseVal) * 100 : 0;
                          const leaseH = maxExpenseVal > 0 ? (c.leaseTotal / maxExpenseVal) * 100 : 0;

                          return (
                            <div key={c.year} className="flex flex-col items-center h-full justify-end gap-1.5 group relative">
                              {/* Hover Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg whitespace-nowrap z-20 font-bold shadow-lg pointer-events-none space-y-0.5">
                                <div className="text-slate-300 font-bold">Year {c.year} Operating Charges:</div>
                                <div className="text-emerald-400">Depreciation: {fmtNum(c.depTotal)} (COS: {fmtNum(c.depCos)} / Opex: {fmtNum(c.depOpex)})</div>
                                <div className="text-purple-400">Leases: {fmtNum(c.leaseTotal)} (COS: {fmtNum(c.leaseCos)} / Opex: {fmtNum(c.leaseOpex)})</div>
                              </div>

                              {/* Value label above group */}
                              <div className="flex items-center justify-center gap-1.5 text-[9px] font-mono font-bold tabular-nums">
                                <span className="text-emerald-600 dark:text-emerald-400">{c.depTotal > 0 ? fmtNum(c.depTotal) : '-'}</span>
                                <span className="text-slate-300 dark:text-slate-700">/</span>
                                <span className="text-purple-600 dark:text-purple-400">{c.leaseTotal > 0 ? fmtNum(c.leaseTotal) : '-'}</span>
                              </div>

                              {/* 2 Grouped Bars */}
                              <div className="w-full flex items-end justify-center gap-1.5 h-36">
                                {/* Depreciation Bar */}
                                <div
                                  style={{ height: `${Math.max(c.depTotal > 0 ? 6 : 0, depH)}%` }}
                                  className={`w-1/2 max-w-[28px] rounded-t-sm transition-all duration-300 shadow-xs ${
                                    c.depTotal > 0
                                      ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 hover:brightness-110'
                                      : 'bg-slate-200 dark:bg-slate-800'
                                  }`}
                                  title={`Depreciation: ${fmtNum(c.depTotal)}`}
                                />

                                {/* Lease Bar */}
                                <div
                                  style={{ height: `${Math.max(c.leaseTotal > 0 ? 6 : 0, leaseH)}%` }}
                                  className={`w-1/2 max-w-[28px] rounded-t-sm transition-all duration-300 shadow-xs ${
                                    c.leaseTotal > 0
                                      ? 'bg-gradient-to-t from-purple-600 to-purple-400 hover:brightness-110'
                                      : 'bg-slate-200 dark:bg-slate-800'
                                  }`}
                                  title={`Lease: ${fmtNum(c.leaseTotal)}`}
                                />
                              </div>

                              {/* Year Label */}
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mt-1">
                                Year {c.year}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs font-bold">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-300">Depreciation Total</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-xs bg-purple-500" />
                        <span className="text-slate-600 dark:text-slate-300">Lease Costs Total</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-normal lowercase">
                      transferred to trading account (cost of sales & overheads)
                    </span>
                  </div>
                </div>
              )}

              {/* Monthly Expenses View */}
              {chartViewMode === 'monthly' && (
                <div className="space-y-4 pt-2">
                  {(() => {
                    const maxExpenseVal = Math.max(
                      ...Array.from({ length: 12 }, (_, idx) => {
                        const absMo = (chartMonthlyYear - 1) * 12 + idx;
                        const mData = scheduleData.monthly[absMo] || { depreciation: 0, leaseCost: 0 };
                        return Math.max(mData.depreciation, mData.leaseCost);
                      }),
                      1
                    );

                    return (
                      <div className="grid grid-flow-col auto-cols-fr gap-2 h-52 items-end border-b border-slate-200 dark:border-slate-800 pb-3">
                        {Array.from({ length: 12 }, (_, idx) => {
                          const absMo = (chartMonthlyYear - 1) * 12 + idx;
                          const mData = scheduleData.monthly[absMo] || { depreciation: 0, leaseCost: 0 };
                          const depH = maxExpenseVal > 0 ? (mData.depreciation / maxExpenseVal) * 100 : 0;
                          const leaseH = maxExpenseVal > 0 ? (mData.leaseCost / maxExpenseVal) * 100 : 0;

                          return (
                            <div key={idx} className="flex flex-col items-center h-full justify-end gap-1 group relative">
                              {/* Hover Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap z-20 font-bold shadow-md pointer-events-none space-y-0.5">
                                <div className="text-emerald-400">Dep: {fmtNum(mData.depreciation)}</div>
                                <div className="text-purple-400">Lease: {fmtNum(mData.leaseCost)}</div>
                              </div>

                              {/* 2 Grouped Bars */}
                              <div className="w-full flex items-end justify-center gap-0.5 h-36">
                                {/* Depreciation */}
                                <div
                                  style={{ height: `${Math.max(mData.depreciation > 0 ? 4 : 0, depH)}%` }}
                                  className="w-1/2 max-w-[18px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xs transition-all"
                                  title={`Dep: ${fmtNum(mData.depreciation)}`}
                                />

                                {/* Lease */}
                                <div
                                  style={{ height: `${Math.max(mData.leaseCost > 0 ? 4 : 0, leaseH)}%` }}
                                  className="w-1/2 max-w-[18px] bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-xs transition-all"
                                  title={`Lease: ${fmtNum(mData.leaseCost)}`}
                                />
                              </div>

                              {/* Month Number */}
                              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 mt-1">
                                M{idx + 1}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs font-bold">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-300">Depreciation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-xs bg-purple-500" />
                        <span className="text-slate-600 dark:text-slate-300">Lease Payment</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-normal lowercase">
                      monthly P&L charges
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ASSET CAPTURE MODAL (Add / Edit Fixed Asset)                        */}
      {/* =================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`w-full max-w-2xl rounded-2xl border p-6 space-y-5 shadow-2xl my-8 ${
              isDark ? 'bg-[#0E1322] border-[#222F4C] text-slate-200' : 'bg-white border-[#D8CEBC] text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#2E5E88] dark:text-[#5584B4]" />
                <h3 className="text-sm font-bold uppercase text-slate-900 dark:text-white">
                  {editingAssetId ? 'Edit Fixed Asset' : 'Add New Fixed Asset'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Timing Selector: Prior to Forecast (Year 0) vs Forecast Period (M1-60) */}
              <div>
                <label className="block text-slate-500 mb-1.5 uppercase font-bold text-[11px] flex items-center justify-between">
                  <span>Acquisition Timing</span>
                  {!isRollingForecast && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal lowercase">
                      (prior to forecast active in bizzoptimizer only)
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!isRollingForecast}
                    onClick={() => setFormData({ ...formData, purchaseTiming: 'prior' })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      !isRollingForecast
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                        : formData.purchaseTiming === 'prior'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500'
                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    <div className="font-bold uppercase text-xs flex items-center justify-between">
                      <span>Purchases Prior to Forecast</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        Year 0 Opening
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Existing asset in system prior to Month 1
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, purchaseTiming: 'forecast' })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      formData.purchaseTiming !== 'prior'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    <div className="font-bold uppercase text-xs flex items-center justify-between">
                      <span>Purchases For Forecast Period</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                        M1 – M60
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      New asset acquired during 5-year forecast
                    </div>
                  </button>
                </div>
              </div>

              {/* Asset Description */}
              <div>
                <label className="block text-slate-500 mb-1 uppercase font-bold">Asset Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Commercial vehicles, Computer hardware, CNC lathe"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                    isDark ? 'bg-[#161C30] border-[#252E4A] text-white' : 'bg-slate-50 border-[#D8CEBC] text-slate-900'
                  }`}
                />
              </div>

              {/* Category & Allocation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1 uppercase font-bold">Category</label>
                  <select
                    value={formData.category || categoriesList[0]?.name}
                    onChange={(e) => {
                      const catDef = categoriesList.find((c) => c.name === e.target.value);
                      const rate = catDef ? catDef.depreciationRate : 20.0;
                      setFormData({
                        ...formData,
                        category: e.target.value,
                        depreciationRate: rate,
                        usefulLifeMonths: Math.round(1200 / rate),
                      });
                    }}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold capitalize ${
                      isDark ? 'bg-[#161C30] border-[#252E4A] text-white' : 'bg-slate-50 border-[#D8CEBC] text-slate-900'
                    }`}
                  >
                    {categoriesList.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.depreciationRate}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 uppercase font-bold">Allocation</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, allocation: 'cost_of_sales' })}
                      className={`p-2 rounded-xl text-xs font-bold uppercase border transition-all ${
                        formData.allocation === 'cost_of_sales'
                          ? 'bg-[#2E5E88] text-white border-[#2E5E88]'
                          : 'bg-transparent text-slate-500 border-slate-300 dark:border-slate-700 hover:border-[#2E5E88]'
                      }`}
                    >
                      Cost of Sales
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, allocation: 'overheads' })}
                      className={`p-2 rounded-xl text-xs font-bold uppercase border transition-all ${
                        formData.allocation === 'overheads'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-transparent text-slate-500 border-slate-300 dark:border-slate-700 hover:border-amber-600'
                      }`}
                    >
                      Overheads
                    </button>
                  </div>
                </div>
              </div>

              {/* Department & Timing-Dependent Field (Months in system OR Purchase Month) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1 uppercase font-bold">Department</label>
                  <select
                    value={formData.department || departments[0]?.name}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold capitalize ${
                      isDark ? 'bg-[#161C30] border-[#252E4A] text-white' : 'bg-slate-50 border-[#D8CEBC] text-slate-900'
                    }`}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.purchaseTiming === 'prior' && isRollingForecast ? (
                  <div>
                    <label className="block text-slate-500 mb-1 uppercase font-bold">
                      Number of Months in System (e.g. 10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={formData.monthsInSystem || 10}
                      onChange={(e) => setFormData({ ...formData, monthsInSystem: Number(e.target.value) })}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                        isDark ? 'bg-[#161C30] border-[#252E4A] text-white' : 'bg-slate-50 border-[#D8CEBC] text-slate-900'
                      }`}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-500 mb-1 uppercase font-bold">Purchase Month (1 – 60)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={formData.purchaseMonth || 1}
                      onChange={(e) => setFormData({ ...formData, purchaseMonth: Number(e.target.value) })}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                        isDark ? 'bg-[#161C30] border-[#252E4A] text-white' : 'bg-slate-50 border-[#D8CEBC] text-slate-900'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Quantity, Unit Cost, and Purchase Value */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#161C30] border border-slate-200 dark:border-[#252E4A]">
                <div>
                  <label className="block text-slate-500 mb-1 uppercase font-bold">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity || 1}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      const u = Number(formData.unitCost || 0);
                      setFormData({
                        ...formData,
                        quantity: q,
                        purchaseValue: q * u,
                        purchaseCost: q * u,
                      });
                    }}
                    className={`w-full p-2 rounded-lg border text-xs font-bold ${
                      isDark ? 'bg-[#0E1322] border-[#222F4C] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 uppercase font-bold">Unit Cost</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.unitCost || 0}
                    onChange={(e) => {
                      const u = Number(e.target.value);
                      const q = Number(formData.quantity || 1);
                      setFormData({
                        ...formData,
                        unitCost: u,
                        purchaseValue: q * u,
                        purchaseCost: q * u,
                      });
                    }}
                    className={`w-full p-2 rounded-lg border text-xs font-bold ${
                      isDark ? 'bg-[#0E1322] border-[#222F4C] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 uppercase font-bold">Purchase Value</label>
                  <div className="p-2 rounded-lg border border-transparent font-bold text-sm text-[#2E5E88] dark:text-[#5584B4] mt-0.5">
                    {fmtNum((Number(formData.unitCost || 0)) * (Number(formData.quantity || 1)))}
                  </div>
                </div>
              </div>

              {/* Finance Option: Buy vs Lease */}
              <div>
                <label className="block text-slate-500 mb-1.5 uppercase font-bold">Financing Option</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, financeOption: 'buy' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formData.financeOption !== 'lease'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="font-bold uppercase text-xs">Buy (Cash Capex)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Depreciates straight-line at {formData.depreciationRate || 20}% p.a.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, financeOption: 'lease' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formData.financeOption === 'lease'
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200'
                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="font-bold uppercase text-xs">Lease (PMT Formula)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Monthly operational rental charges
                    </div>
                  </button>
                </div>
              </div>

              {/* If Prior Purchase & Buy: Auto-Calculated Opening Balance Summary Card */}
              {formData.purchaseTiming === 'prior' && isRollingForecast && formData.financeOption !== 'lease' && (() => {
                const pVal = (Number(formData.unitCost || 0)) * (Number(formData.quantity || 1));
                const depRate = Number(formData.depreciationRate || 20);
                const monthsInSys = Number(formData.monthsInSystem || 10);
                const accDep = Math.min(pVal, Math.round((pVal * (depRate / 100) / 12) * monthsInSys));
                const netVal = Math.max(0, pVal - accDep);
                return (
                  <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase text-[11px] text-blue-900 dark:text-blue-300">
                        Year 0 Opening Balances (Auto-Calculated)
                      </span>
                      <span className="text-[10px] text-blue-700 dark:text-blue-400">
                        {monthsInSys} months in system @ {depRate}% p.a.
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-blue-200 dark:border-blue-800/60">
                      <div>
                        <div className="text-[10px] uppercase text-slate-500">Original Cost</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{fmtNum(pVal)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500">Acc. Depreciation</div>
                        <div className="text-xs font-bold text-rose-600 dark:text-rose-400">{fmtNum(accDep)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500">Net Value</div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{fmtNum(netVal)}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                      Opening balances are calculated automatically from elapsed months; no manual balance entry required.
                    </div>
                  </div>
                );
              })()}

              {/* Lease Terms (applicable when financeOption === 'lease') */}
              {formData.financeOption === 'lease' && (() => {
                const pVal = (Number(formData.unitCost || 0)) * (Number(formData.quantity || 1));
                const rate = Number(formData.leaseRatePct || 10.0);
                const termYrs = Math.min(5, Math.max(1, Number(formData.leaseTermYears || 5)));
                const monthlyPmt = calculateLeasePMT(pVal, rate, termYrs);
                const isPrior = formData.purchaseTiming === 'prior' && isRollingForecast;
                const monthsInSys = Number(formData.monthsInSystem || 10);
                const totalTermMos = termYrs * 12;
                const remainingMos = Math.max(0, totalTermMos - (isPrior ? monthsInSys : 0));

                return (
                  <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-3">
                    <div className="flex items-center justify-between text-purple-800 dark:text-purple-300 font-bold uppercase text-[11px]">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        <span>Lease Financing Terms (Microsoft Excel PMT Formula)</span>
                      </div>
                      {isPrior && (
                        <span className="text-[10px] text-purple-700 dark:text-purple-400 font-normal">
                          Prior Lease ({monthsInSys} mos elapsed)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-500 mb-1 text-[11px] font-bold">Lease Rate % (p.a.)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.leaseRatePct || 10.0}
                          onChange={(e) => setFormData({ ...formData, leaseRatePct: Number(e.target.value) })}
                          className={`w-full p-2 rounded-lg border text-xs font-bold ${
                            isDark ? 'bg-[#0E1322] border-[#222F4C] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1 text-[11px] font-bold">Term (Years)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={formData.leaseTermYears || 5}
                          onChange={(e) => setFormData({ ...formData, leaseTermYears: Math.min(5, Math.max(1, Number(e.target.value))) })}
                          className={`w-full p-2 rounded-lg border text-xs font-bold ${
                            isDark ? 'bg-[#0E1322] border-[#222F4C] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1 text-[11px] font-bold">Monthly Lease Cost</label>
                        <div className="p-2 rounded-lg font-bold text-sm text-purple-700 dark:text-purple-300">
                          {fmtNum(monthlyPmt)} / mo
                        </div>
                      </div>
                    </div>

                    {isPrior && (
                      <div className="pt-2 border-t border-purple-200 dark:border-purple-800/60 grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500 uppercase text-[10px] block">Opening Leased Asset</span>
                          <span className="font-bold text-slate-900 dark:text-white">{fmtNum(pVal)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase text-[10px] block">Period Elapsed</span>
                          <span className="font-bold text-purple-700 dark:text-purple-300">{monthsInSys} months</span>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase text-[10px] block">Forecast Duration</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {remainingMos} months (M1 - M{Math.min(60, remainingMos)})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAsset}
                className="px-5 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold uppercase shadow-xs transition-colors"
              >
                {editingAssetId ? 'Update Asset' : 'Save Asset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
