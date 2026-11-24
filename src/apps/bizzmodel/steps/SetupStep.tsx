import React, { useState, useMemo } from 'react';
import {
  Calendar,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Unlock,
  Sliders,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Info,
  ShieldCheck,
  AlertCircle,
  Building2,
  Users,
  X,
  Check,
} from 'lucide-react';
import {
  BizzModelState,
  BusinessDetails,
  PlatformForecastAppId,
  RevenueItem,
  DEFAULT_BUSINESS_STATE,
  DEFAULT_SETUP_ASSUMPTIONS,
  DEFAULT_EMPLOYMENT_CATEGORIES,
  DEFAULT_EMPLOYMENT_ITEMS,
  DEFAULT_EXPENSE_ITEMS,
  EMPTY_HILEVEL_YTD_ACTUALS,
} from '../constants';
import { calculate60MonthWorkingCalendar } from '../utils/calendarCalc';
import { AssumptionRateItem } from '../../bizzdynamics/types';
import { BaseRateAdjustmentTool } from '../../bizzdynamics/components/BaseRateAdjustmentTool';

const TAX_CYCLE_INFO: Record<string, { payments: number; firstMonth: number; label: string }> = {
  'monthly': { payments: 12, firstMonth: 2, label: 'monthly' },
  'quarterly': { payments: 4, firstMonth: 4, label: 'quarterly' },
  'bi-annually': { payments: 2, firstMonth: 7, label: 'bi-annually' },
  'annual': { payments: 1, firstMonth: 13, label: 'annual' },
};

interface SetupStepProps {
  theme?: 'light' | 'dark';
  mode: PlatformForecastAppId;
  state: BizzModelState;
  onUpdateState: (updater: (prev: BizzModelState) => BizzModelState) => void;
  activeTab?: 'assumptions' | 'results' | 'charts';
  onSelectTab?: (tab: 'assumptions' | 'results' | 'charts') => void;
  onResetAllToZero?: () => void;
}

export const SetupStep: React.FC<SetupStepProps> = ({
  theme = 'light',
  mode,
  state,
  onUpdateState,
  activeTab: activeTabProp,
  onSelectTab: onSelectTabProp,
  onResetAllToZero,
}) => {
  const isDark = theme === 'dark';
  const isBizzDynamics = mode === 'bizzdynamics';

  // Active sub-tab: 'assumptions' | 'results' | 'charts' (elevated into top header tab panel)
  const [internalTab, setInternalTab] = useState<'assumptions' | 'results' | 'charts'>('assumptions');
  const activeTab = activeTabProp ?? internalTab;
  const setActiveTab = onSelectTabProp ?? setInternalTab;

  // Active Year in Results/Charts window (1 to 5)
  const [activeYear, setActiveYear] = useState<number>(1);
  const [chartsHorizon, setChartsHorizon] = useState<'annual' | 'monthly'>('annual');

  // Business Details from state
  const details: BusinessDetails = state.businessDetails;

  // Selected assumption item id for the adjustment slider in Results tab
  const [selectedAssumptionId, setSelectedAssumptionId] = useState<string>('interest-pos');

  // Name lock state for other apps (locked once entered)
  const [nameLockOverride, setNameLockOverride] = useState<boolean>(false);

  // Reset confirmation modal & toast feedback
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Update business details patch
  const handleUpdateDetails = (patch: Partial<BusinessDetails>) => {
    onUpdateState((prev) => ({
      ...prev,
      businessDetails: { ...prev.businessDetails, ...patch },
    }));
  };

  // Setup assumptions (positive interest, negative interest, vat, tax)
  const setupAssumptions: AssumptionRateItem[] = useMemo(() => {
    const raw =
      details.setupAssumptions && details.setupAssumptions.length === 4
        ? details.setupAssumptions
        : DEFAULT_SETUP_ASSUMPTIONS;
    return raw.map((a) => {
      if (a.id === 'interest-pos') return { ...a, name: 'bank interest rate' };
      if (a.id === 'interest-neg') return { ...a, name: 'overdraft interest rate' };
      return a;
    });
  }, [details.setupAssumptions]);

  const interestPosItem = useMemo(
    () => setupAssumptions.find((a) => a.id === 'interest-pos') || setupAssumptions[0],
    [setupAssumptions]
  );
  const interestNegItem = useMemo(
    () => setupAssumptions.find((a) => a.id === 'interest-neg') || setupAssumptions[1],
    [setupAssumptions]
  );
  const vatRateItem = useMemo(
    () => setupAssumptions.find((a) => a.id === 'vat-rate') || setupAssumptions[2],
    [setupAssumptions]
  );
  const taxRateItem = useMemo(
    () => setupAssumptions.find((a) => a.id === 'tax-rate') || setupAssumptions[3],
    [setupAssumptions]
  );

  const getAnnualRateStats = (item?: AssumptionRateItem) => {
    if (!item) return [];
    return [1, 2, 3, 4, 5].map((yr) => {
      const slice = item.monthlyValues.slice((yr - 1) * 12, yr * 12);
      const avg = slice.reduce((s, v) => s + v, 0) / 12;
      const min = Math.min(...slice);
      const max = Math.max(...slice);
      return { year: yr, avg, min, max, slice };
    });
  };

  const interestPosAnnual = useMemo(() => getAnnualRateStats(interestPosItem), [interestPosItem]);
  const interestNegAnnual = useMemo(() => getAnnualRateStats(interestNegItem), [interestNegItem]);
  const vatAnnual = useMemo(() => getAnnualRateStats(vatRateItem), [vatRateItem]);
  const taxAnnual = useMemo(() => getAnnualRateStats(taxRateItem), [taxRateItem]);

  const interestPos5Yr = useMemo(
    () => (interestPosItem ? interestPosItem.monthlyValues.reduce((s, v) => s + v, 0) / 60 : 4.5),
    [interestPosItem]
  );
  const interestNeg5Yr = useMemo(
    () => (interestNegItem ? interestNegItem.monthlyValues.reduce((s, v) => s + v, 0) / 60 : 11.75),
    [interestNegItem]
  );
  const vat5Yr = useMemo(
    () => (vatRateItem ? vatRateItem.monthlyValues.reduce((s, v) => s + v, 0) / 60 : 0.0),
    [vatRateItem]
  );
  const tax5Yr = useMemo(
    () => (taxRateItem ? taxRateItem.monthlyValues.reduce((s, v) => s + v, 0) / 60 : 0.0),
    [taxRateItem]
  );

  const activeAssumptionItem = useMemo(() => {
    return (
      setupAssumptions.find((a) => a.id === selectedAssumptionId) || setupAssumptions[0]
    );
  }, [setupAssumptions, selectedAssumptionId]);

  // Handle assumption cycle with < and > arrows
  const handlePrevAssumption = () => {
    const idx = setupAssumptions.findIndex((a) => a.id === selectedAssumptionId);
    const prevIdx = (idx - 1 + setupAssumptions.length) % setupAssumptions.length;
    setSelectedAssumptionId(setupAssumptions[prevIdx].id);
  };

  const handleNextAssumption = () => {
    const idx = setupAssumptions.findIndex((a) => a.id === selectedAssumptionId);
    const nextIdx = (idx + 1) % setupAssumptions.length;
    setSelectedAssumptionId(setupAssumptions[nextIdx].id);
  };

  // Update monthly values for an assumption item from the adjustment tool
  const handleUpdateMonthlyValues = (itemId: string, updatedValues: number[]) => {
    const updatedAssumptions = setupAssumptions.map((a) =>
      a.id === itemId ? { ...a, monthlyValues: updatedValues } : a
    );
    handleUpdateDetails({ setupAssumptions: updatedAssumptions });
  };

  // Update base rate for an assumption item from the adjustment tool
  const handleUpdateBaseRate = (itemId: string, newBaseRate: number) => {
    const updatedAssumptions = setupAssumptions.map((a) => {
      if (a.id === itemId) {
        const oldBase = a.baseRate;
        const updatedMonthly = a.monthlyValues.map((v) => {
          const delta = v - oldBase;
          return Number((newBaseRate + delta).toFixed(4));
        });
        return {
          ...a,
          baseRate: newBaseRate,
          monthlyValues: updatedMonthly,
        };
      }
      return a;
    });
    handleUpdateDetails({ setupAssumptions: updatedAssumptions });
  };

  // Reset ALL page values across the app to zero (matching BizzCalc scenario reset)
  const handleResetAllToZero = () => {
    onUpdateState((prev) => {
      const zeroSetupAssumptions: AssumptionRateItem[] = DEFAULT_SETUP_ASSUMPTIONS.map((a) => ({
        ...a,
        baseRate: 0,
        monthlyValues: new Array(60).fill(0),
      }));

      const zeroRevenueItem = (item: RevenueItem): RevenueItem => ({
        ...item,
        unitPrice: 0,
        unitCost: 0,
        costOfSalesPct: 0,
        dailyCapacity: 0,
        monthlyUnits: new Array(60).fill(0),
        dailyUnitSalesMonthly: new Array(60).fill(0),
        productionUnitCostMonthly: new Array(60).fill(0),
        manufacturingMarginPctMonthly: new Array(60).fill(0),
        grossProfitMarginPctMonthly: new Array(60).fill(0),
        salesCommissionPctMonthly: new Array(60).fill(0),
        inventoryAdjustmentPctMonthly: new Array(60).fill(0),
        otherIncomeMonthly: new Array(60).fill(0),
      });

      const defaultRevNames =
        mode === 'bizzdynamics'
          ? ['Unit Product 1', 'Unit Product 2', 'Unit Product 3']
          : mode === 'rolling-forecast' || mode === 'hi-level-forecast'
          ? ['Core Product 1', 'Core Product 2']
          : ['revenue generator SKU-A'];

      const baseRevItems: RevenueItem[] =
        prev.revenueItems && prev.revenueItems.length > 0
          ? prev.revenueItems.map(zeroRevenueItem)
          : defaultRevNames.map((name, idx) =>
              zeroRevenueItem({
                id: `rev-${mode}-${idx + 1}`,
                category: 'RETAIL PRODUCTS',
                name,
                modelType: 'unit sales',
                unitPrice: 0,
                unitCost: 0,
                costOfSalesPct: 0,
                startMonth: 1,
                dailyCapacity: 0,
                monthlyUnits: new Array(60).fill(0),
              })
            );

      const zeroCategories = (
        prev.employmentCategories && prev.employmentCategories.length > 0
          ? prev.employmentCategories
          : DEFAULT_EMPLOYMENT_CATEGORIES
      ).map((cat) => ({
        ...cat,
        onCostPct: 0,
        annualReviewPct: 0,
        monthlyAdjustmentPct: new Array(60).fill(0),
      }));

      const zeroEmployees = (
        prev.employmentItems && prev.employmentItems.length > 0
          ? prev.employmentItems
          : DEFAULT_EMPLOYMENT_ITEMS
      ).map((emp) => ({
        ...emp,
        baseRateMonthly: 0,
        numEmployees: 0,
        onCostPct: 0,
      }));

      const zeroExpenses = (
        prev.expenses && prev.expenses.length > 0
          ? prev.expenses
          : DEFAULT_EXPENSE_ITEMS
      ).map((exp) => ({
        ...exp,
        baseRateMonthly: 0,
        monthlyAmount: 0,
        pctOfRevenue: 0,
        growthRatePct: 0,
        monthlyAdjustmentPct: new Array(60).fill(0),
      }));

      return {
        ...prev,
        businessDetails: {
          ...prev.businessDetails,
          workingDays: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: false,
          },
          daysWorkedPerWeek: 5,
          deductHolidays: true,
          annualShutdown: {
            ...(prev.businessDetails.annualShutdown || { fromDate: '12-20', toDate: '01-05', daysCount: 11 }),
            enabled: false,
          },
          vatRate: 0,
          taxRate: 0,
          setupAssumptions: zeroSetupAssumptions,
        } as BusinessDetails,
        revenueItems: baseRevItems,
        employmentCategories: zeroCategories,
        employmentItems: zeroEmployees,
        expenses: zeroExpenses,
        opexSettings: {
          allocationToCostOfSalesPct: 0,
          hiLevelPreset: { cosFixedPct: 0, opexFixedPct: 0, opexVarPct: 0 },
          categoryAdjustments: {
            cosShareOfFixed: new Array(60).fill(0),
            opexVariable: new Array(60).fill(0),
            opexFixed: new Array(60).fill(0),
          },
        },
        fixedAssets: [],
        funding: {
          founderEquity: 0,
          investorEquity: 0,
          bankLoanAmount: 0,
          interestRatePct: 0,
          loanTermMonths: 0,
          loanStartMonth: 1,
          overdraftLimit: 0,
          creditorDays: 0,
          debtorDays: 0,
          inventoryDays: 0,
          equityLoan: 0,
          inventoryDaysMonthly: new Array(60).fill(0),
          debtorDaysMonthly: new Array(60).fill(0),
          creditorDaysMonthly: new Array(60).fill(0),
          depositsBase: 0,
          floatsBase: 0,
          pettyCashBase: 0,
          depositsMonthly: new Array(60).fill(0),
          floatsMonthly: new Array(60).fill(0),
          pettyCashMonthly: new Array(60).fill(0),
          termLoans: [],
          initialSharesCount: 0,
          initialSharePrice: 0,
          additionalSharesMonthly: new Array(60).fill(0),
          additionalSharePriceMonthly: new Array(60).fill(0),
          shareIssues: [],
          equityLoanOpening: 0,
          equityLoanAdditionalMonthly: new Array(60).fill(0),
          equityLoanRepaymentsMonthly: new Array(60).fill(0),
          dividendsPerShareBase: 0,
          dividendsPerShareMonthly: new Array(60).fill(0),
        },
        highLevelForecast: {
          dailyRevenue: 0,
          dailyGrowthPct: 0,
          workingDaysPerMonth: 0,
          costOfSalesPct: 0,
          directLaborPct: 0,
          fixedOpexMonthly: 0,
          cashReserves: 0,
          debtFunding: 0,
          interestRatePct: 0,
          targetHorizonMonths: prev.highLevelForecast?.targetHorizonMonths || 36,
        },
      };
    });

    if (onResetAllToZero) {
      onResetAllToZero();
    }

    setShowResetConfirmModal(false);
    showToast(`all ${mode} page values reset to zero.`);
  };

  // Trigger reset confirmation modal from header or assumptions tab
  const handleResetToDefault = () => {
    setShowResetConfirmModal(true);
  };

  // ---------------------------------------------------------------------------
  // 5-YEAR (60-MONTH) CALENDAR COMPUTATION ENGINE
  // ---------------------------------------------------------------------------
  const startYear = details.startDateYear || 2026;
  const monthMap: Record<string, number> = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
  };
  const startMonthNum =
    details.startDateFormatted
      ? parseInt(details.startDateFormatted.split('-')[1] || '11', 10)
      : monthMap[details.startDateMonth] || 11;

  const activeWorkingDays = details.workingDays || {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  };

  const deductHolidays = details.deductHolidays ?? true;
  const holidays = details.holidaysDeducted || [];
  const annualShutdown = details.annualShutdown || {
    enabled: false,
    fromDate: '12-20',
    toDate: '01-05',
    daysCount: 11,
  };

  // Compute 60-Month Working Calendar
  const monthlyCalendar60 = useMemo(() => {
    return calculate60MonthWorkingCalendar(details);
  }, [details]);

  // Active Year Slice (12 Months)
  const activeYearMonths = useMemo(() => {
    const startIdx = (activeYear - 1) * 12;
    return monthlyCalendar60.slice(startIdx, startIdx + 12);
  }, [monthlyCalendar60, activeYear]);

  // Annual Totals for all 5 Years
  const annualSummary = useMemo(() => {
    return [1, 2, 3, 4, 5].map((yr) => {
      const slice = monthlyCalendar60.slice((yr - 1) * 12, yr * 12);
      const totalCal = slice.reduce((s, m) => s + m.calendarDays, 0);
      const totalNotWorked = slice.reduce((s, m) => s + m.daysNotWorked, 0);
      const totalWorked = slice.reduce((s, m) => s + m.daysWorked, 0);
      const avgMonthlyWorked = totalWorked / 12;
      const efficiencyPct = totalCal > 0 ? (totalWorked / totalCal) * 100 : 0;
      return {
        year: yr,
        calendarDays: totalCal,
        daysNotWorked: totalNotWorked,
        daysWorked: totalWorked,
        avgMonthlyWorked: Number(avgMonthlyWorked.toFixed(1)),
        efficiencyPct: Number(efficiencyPct.toFixed(1)),
      };
    });
  }, [monthlyCalendar60]);

  const fiveYearTotal = useMemo(() => {
    const totalCal = annualSummary.reduce((s, y) => s + y.calendarDays, 0);
    const totalNotWorked = annualSummary.reduce((s, y) => s + y.daysNotWorked, 0);
    const totalWorked = annualSummary.reduce((s, y) => s + y.daysWorked, 0);
    const avgMonthlyWorked = totalWorked / 60;
    const efficiencyPct = totalCal > 0 ? (totalWorked / totalCal) * 100 : 0;
    return {
      calendarDays: totalCal,
      daysNotWorked: totalNotWorked,
      daysWorked: totalWorked,
      avgMonthlyWorked: Number(avgMonthlyWorked.toFixed(1)),
      efficiencyPct: Number(efficiencyPct.toFixed(1)),
    };
  }, [annualSummary]);

  // Department distribution total
  const departments = details.departments || [];
  const totalDepartmentDistribution = departments.reduce(
    (sum, d) => sum + (d.distributionPct || 0),
    0
  );

  const isHiLevelForecast = mode === 'rolling-forecast' || mode === 'hi-level-forecast';
  const hlUpdateMonth = Math.max(1, Math.min(12, Math.round(state.hiLevelActuals?.updateMonth || 3)));
  const hlElapsedWorkingDays = useMemo(
    () => monthlyCalendar60.slice(0, hlUpdateMonth).reduce((s, m) => s + (m.daysWorked || 0), 0),
    [monthlyCalendar60, hlUpdateMonth]
  );
  const hlElapsedCalendarDays = useMemo(
    () => monthlyCalendar60.slice(0, hlUpdateMonth).reduce((s, m) => s + (m.calendarDays || 0), 0),
    [monthlyCalendar60, hlUpdateMonth]
  );
  const hlUpdateMonthLabel = monthlyCalendar60[hlUpdateMonth - 1]?.monthLabel || `Month ${hlUpdateMonth}`;

  const handleUpdateHiLevelMonth = (newMonth: number) => {
    const clamped = Math.max(1, Math.min(12, Math.round(newMonth || 3)));
    onUpdateState((prev) => ({
      ...prev,
      hiLevelActuals: {
        ...(prev.hiLevelActuals || EMPTY_HILEVEL_YTD_ACTUALS),
        updateMonth: clamped,
      },
    }));
  };

  return (
    <div className={`space-y-6 font-mono select-none ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* =================================================================== */}
      {/* HEADER BAR (Matching Employment Standard)                           */}
      {/* =================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold uppercase tracking-tight text-slate-900 dark:text-white">
              BUSINESS DETAILS & SETUP
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-[#2E5E88]/10 text-[#2E5E88] dark:text-[#5584B4]">
              {isHiLevelForecast ? 'bizzoptimizer' : mode}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isHiLevelForecast
              ? 'Define operating calendar, YTD update month for management accounts, and VAT, tax & interest rate assumptions.'
              : 'Define operating calendar, holiday rhythms, VAT, and corporate tax rates.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetToDefault}
          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-500 hover:text-[#5CA338] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          title="Reset setup parameters to baseline defaults"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="lowercase">re-set values</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: ASSUMPTIONS (BUSINESS NAME, START DATE, CALENDAR, DEPARTMENTS) */}
      {/* ===================================================================== */}
      {activeTab === 'assumptions' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: Business Details & Operating Rhythm */}
            <div className="space-y-6">
              {/* Box 1: Business Name */}
              <div
                className={`p-5 rounded-2xl border space-y-3.5 ${
                  isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      BUSINESS NAME
                    </span>
                  </div>
                  {isBizzDynamics ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      <span>name locked</span>
                    </span>
                  ) : details.isNameLocked && !nameLockOverride ? (
                    <button
                      type="button"
                      onClick={() => setNameLockOverride(true)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-[#2E5E88] flex items-center gap-1 transition-colors"
                      title="Click to unlock and modify business name"
                    >
                      <Lock className="h-3 w-3 text-slate-400" />
                      <span>locked (unlock)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateDetails({ isNameLocked: true });
                        setNameLockOverride(false);
                      }}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 hover:bg-emerald-500/25 transition-colors"
                      title="Lock business name"
                    >
                      <Unlock className="h-3 w-3" />
                      <span>lock name</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <input
                    type="text"
                    value={
                      isBizzDynamics
                        ? 'bizzbean learning academy'
                        : details.businessName || 'my dream venture'
                    }
                    disabled={isBizzDynamics || (!!details.isNameLocked && !nameLockOverride)}
                    onChange={(e) => handleUpdateDetails({ businessName: e.target.value })}
                    onBlur={() => {
                      if (!isBizzDynamics && details.businessName) {
                        handleUpdateDetails({ isNameLocked: true });
                        setNameLockOverride(false);
                      }
                    }}
                    placeholder="enter business legal name"
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      isBizzDynamics || (details.isNameLocked && !nameLockOverride)
                        ? 'bg-slate-100/70 dark:bg-[#141A2E]/70 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                        : isDark
                        ? 'bg-[#0E1322] border-[#222F4C] text-white focus:border-[#2E5E88]'
                        : 'bg-white border-[#D8CEBC] text-slate-900 focus:border-[#2E5E88]'
                    }`}
                  />
                  <p className="text-[10px] text-slate-400 lowercase">
                    {isBizzDynamics
                      ? '* bizzdynamics: locked to bizzbean learning academy'
                      : '* names are locked once entered (unlock with button if required)'}
                  </p>
                </div>
              </div>

              {/* Box 2: Start Date (The way programmed in BizzCalc) */}
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <Calendar className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    START DATE (5-YEAR TIMELINE)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-500 lowercase block">
                      start month & year:
                    </label>
                    <input
                      type="month"
                      value={details.startDateFormatted || `${startYear}-${String(startMonthNum).padStart(2, '0')}`}
                      onChange={(e) => {
                        const val = e.target.value; // "YYYY-MM"
                        if (val) {
                          const [y, m] = val.split('-');
                          const mNum = parseInt(m, 10);
                          const monthNamesArr = [
                            'January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December',
                          ];
                          handleUpdateDetails({
                            startDateFormatted: val,
                            startDateYear: parseInt(y, 10),
                            startDateMonth: monthNamesArr[mNum - 1] || 'November',
                          });
                        }
                      }}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                        isDark ? 'bg-[#0E1322] border-[#222F4C] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 lowercase block">
                      operating scenario:
                    </label>
                    <input
                      type="text"
                      value={details.scenario || 'Target Institutional Baseline'}
                      onChange={(e) => handleUpdateDetails({ scenario: e.target.value })}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                        isDark ? 'bg-[#0E1322] border-[#222F4C] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Box 2B (Hi-Level Forecast Only): UPDATE MONTH FOR DATA INPUT */}
              {isHiLevelForecast && (
                <div
                  className={`p-5 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        UPDATE MONTH FOR DATA INPUT (YTD CUTOFF)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-[#2E5E88] dark:text-[#5584B4]">
                      M1–M{hlUpdateMonth} actuals
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-500 lowercase block">
                        management accounts cutoff month (1–12):
                      </label>
                      <select
                        value={hlUpdateMonth}
                        onChange={(e) => handleUpdateHiLevelMonth(parseInt(e.target.value, 10))}
                        className={`w-full p-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                          isDark
                            ? 'bg-[#0E1322] border-[#222F4C] text-white'
                            : 'bg-white border-[#D8CEBC] text-slate-900'
                        }`}
                      >
                        {Array.from({ length: 12 }, (_, idx) => {
                          const mNum = idx + 1;
                          const mLabel = monthlyCalendar60[idx]?.monthLabel || `Month ${mNum}`;
                          const cumDays = monthlyCalendar60
                            .slice(0, mNum)
                            .reduce((s, m) => s + m.daysWorked, 0);
                          return (
                            <option key={mNum} value={mNum}>
                              Month {mNum} · {mLabel} ({cumDays} working days elapsed)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div
                      className={`p-3 rounded-xl border grid grid-cols-3 gap-3 text-center tabular-nums ${
                        isDark
                          ? 'bg-[#0C111E] border-[#1E2A45]'
                          : 'bg-[#FAF8F5] border-[#E5DEC9]'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">working days</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {hlElapsedWorkingDays}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">calendar days</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {hlElapsedCalendarDays}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">forecast mos</div>
                        <div className="text-sm font-bold text-[#2E5E88] dark:text-[#5584B4]">
                          {60 - hlUpdateMonth}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Daily Revenue is computed as <span className="font-bold text-slate-700 dark:text-slate-200">YTD Revenue ÷ {hlElapsedWorkingDays} working days</span> through {hlUpdateMonthLabel}, and your YTD Trading Account distribution projects Months {hlUpdateMonth + 1}–60.
                    </p>
                  </div>
                </div>
              )}

              {/* Box 3: Select Working Days (The way programmed in BizzCalc extended for 5 years) */}
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    SELECT WORKING DAYS
                  </span>
                  <span className="text-xs font-bold text-[#2E5E88] dark:text-[#5584B4]">
                    {Object.values(activeWorkingDays).filter(Boolean).length} days / week
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-xs">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                      const isChecked = !!activeWorkingDays[day];
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const updated = { ...activeWorkingDays, [day]: !isChecked };
                            handleUpdateDetails({
                              workingDays: updated,
                              daysWorkedPerWeek: Object.values(updated).filter(Boolean).length,
                            });
                          }}
                          className={`p-2 rounded-xl text-center text-xs font-bold transition-all border ${
                            isChecked
                              ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-xs'
                              : isDark
                              ? 'bg-[#141A2E] text-slate-400 border-[#252E4A] hover:text-white'
                              : 'bg-slate-100 text-slate-500 border-[#D8CEBC] hover:text-slate-900'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Deduct Public Holidays Toggle */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-700 dark:text-slate-300 font-bold block">
                      deduct public holidays:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      includes statutory calendar holidays across 5 years
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateDetails({ deductHolidays: !deductHolidays })}
                    className={`px-3 py-1 rounded-full text-xs font-bold lowercase transition-colors border ${
                      deductHolidays
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-transparent'
                    }`}
                  >
                    {deductHolidays ? 'enabled' : 'disabled'}
                  </button>
                </div>
              </div>

              {/* Box 4: TAX PAYMENT CYCLE (Exact Match to tax payment cycle.PNG) */}
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2E5E88] dark:text-[#5584B4]">
                    TAX PAYMENT CYCLE
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    V1 Corporate Tax Schedule
                  </span>
                </div>

                {/* Dropdown Selection (matching light blue pill in tax payment cycle.PNG) */}
                <div className="space-y-3">
                  <div className="relative">
                    <select
                      value={details.taxPaymentCycle || 'monthly'}
                      onChange={(e) => handleUpdateDetails({ taxPaymentCycle: e.target.value as any })}
                      className={`w-full p-3 rounded-xl border text-sm font-bold capitalize transition-all appearance-none cursor-pointer ${
                        isDark
                          ? 'bg-[#16233B] border-blue-900 text-blue-300 focus:border-blue-500'
                          : 'bg-[#EBF3FB] border-blue-200 text-[#2E5E88] focus:border-[#2E5E88]'
                      }`}
                    >
                      <option value="monthly">monthly</option>
                      <option value="quarterly">quarterly</option>
                      <option value="bi-annually">bi-annually</option>
                      <option value="annual">annual</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#2E5E88] dark:text-blue-300">
                      <ChevronRight className="h-4 w-4 rotate-90" />
                    </div>
                  </div>

                  {/* Summary Card (matching TAX PAYMENT CYCLE SUMMARY card) */}
                  {(() => {
                    const currentCycle = details.taxPaymentCycle || 'monthly';
                    const cycleData = TAX_CYCLE_INFO[currentCycle] || TAX_CYCLE_INFO['monthly'];
                    return (
                      <div
                        className={`p-4 rounded-xl border space-y-3 text-xs ${
                          isDark
                            ? 'bg-[#0E1322] border-[#222F4C] text-slate-300'
                            : 'bg-white border-[#D8CEBC] text-slate-700 shadow-2xs'
                        }`}
                      >
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                          TAX PAYMENT CYCLE SUMMARY
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">payment cycle:</span>
                            <span className="text-sm font-bold text-[#2E5E88] dark:text-[#5584B4] capitalize">
                              {cycleData.label}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">annual</span>
                            <span className="text-sm font-bold text-[#2E5E88] dark:text-[#5584B4]">
                              payments: {cycleData.payments}
                            </span>
                          </div>
                        </div>

                        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed pt-1">
                          the accumulated tax liability will be paid – the rule is that payment is made in the month after the tax cycle period. For {cycleData.label}, first payment is made in month {cycleData.firstMonth}.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Streamlined Rates (Hi-Level), Annual Shutdown & Departments */}
            <div className="space-y-6">
              {/* Hi-Level Forecast Streamlined VAT, Corporate Tax & Interest Rate Assumptions */}
              {isHiLevelForecast && (
                <div
                  className={`p-5 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        VAT, TAX & INTEREST RATE ASSUMPTIONS
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      applied across 60 mos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    {[
                      {
                        id: 'vat-rate',
                        label: 'vat rate (%)',
                        hint: 'used for VAT ledger & AR/AP days',
                        value: vatRateItem?.baseRate ?? 15,
                      },
                      {
                        id: 'tax-rate',
                        label: 'corporate tax rate (%)',
                        hint: 'CIT applied to taxable profit',
                        value: taxRateItem?.baseRate ?? 27,
                      },
                      {
                        id: 'interest-pos',
                        label: 'bank interest rate (% p.a.)',
                        hint: 'earned on positive cash reserves',
                        value: interestPosItem?.baseRate ?? 4.5,
                      },
                      {
                        id: 'interest-neg',
                        label: 'overdraft interest rate (% p.a.)',
                        hint: 'charged on deficit bank balances',
                        value: interestNegItem?.baseRate ?? 11.75,
                      },
                    ].map((rate) => (
                      <div
                        key={rate.id}
                        className={`p-3 rounded-xl border space-y-1.5 ${
                          isDark
                            ? 'bg-[#0C111E] border-[#1E2A45]'
                            : 'bg-[#FAF8F5] border-[#E5DEC9]'
                        }`}
                      >
                        <label className="text-[11px] font-bold lowercase text-slate-700 dark:text-slate-200 block">
                          {rate.label}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.25"
                            min={0}
                            max={100}
                            value={rate.value}
                            onChange={(e) => {
                              const parsed = parseFloat(e.target.value);
                              handleUpdateBaseRate(rate.id, Number.isFinite(parsed) ? parsed : 0);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-right text-xs font-bold tabular-nums ${
                              isDark
                                ? 'bg-[#0A0E1A] border-[#253352] text-white focus:border-[#5584B4]'
                                : 'bg-white border-[#D8CEBC] text-slate-900 focus:border-[#2E5E88]'
                            }`}
                          />
                          <span className="text-xs font-bold text-slate-400">%</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{rate.hint}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Box 4: NEW Annual Shutdown Option (count number of non-working days) */}
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      ANNUAL SHUTDOWN OPTION
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateDetails({
                        annualShutdown: {
                          ...annualShutdown,
                          enabled: !annualShutdown.enabled,
                        },
                      });
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold lowercase transition-colors border ${
                      annualShutdown.enabled
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-transparent'
                    }`}
                  >
                    {annualShutdown.enabled ? 'enabled' : 'disabled'}
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-slate-500 lowercase text-[11px]">
                    specify standard operational shutdown period (e.g. year-end holidays). working days within this window are deducted:
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-400 lowercase block text-[10px]">from (MM-DD):</label>
                      <input
                        type="text"
                        placeholder="12-20"
                        value={annualShutdown.fromDate || '12-20'}
                        disabled={!annualShutdown.enabled}
                        onChange={(e) => {
                          handleUpdateDetails({
                            annualShutdown: {
                              ...annualShutdown,
                              fromDate: e.target.value,
                            },
                          });
                        }}
                        className={`w-full p-2 rounded-xl border text-xs font-bold ${
                          !annualShutdown.enabled
                            ? 'bg-slate-100 dark:bg-[#141A2E]/70 text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-800'
                            : isDark
                            ? 'bg-[#0E1322] border-[#222F4C] text-white'
                            : 'bg-white border-[#D8CEBC] text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 lowercase block text-[10px]">to (MM-DD):</label>
                      <input
                        type="text"
                        placeholder="01-05"
                        value={annualShutdown.toDate || '01-05'}
                        disabled={!annualShutdown.enabled}
                        onChange={(e) => {
                          handleUpdateDetails({
                            annualShutdown: {
                              ...annualShutdown,
                              toDate: e.target.value,
                            },
                          });
                        }}
                        className={`w-full p-2 rounded-xl border text-xs font-bold ${
                          !annualShutdown.enabled
                            ? 'bg-slate-100 dark:bg-[#141A2E]/70 text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-800'
                            : isDark
                            ? 'bg-[#0E1322] border-[#222F4C] text-white'
                            : 'bg-white border-[#D8CEBC] text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  {annualShutdown.enabled && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between text-amber-600 dark:text-amber-400">
                      <span>annual shutdown active ({annualShutdown.fromDate} to {annualShutdown.toDate})</span>
                      <span className="font-bold">non-working days deducted</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Box 5: Department and Expense Distribution % */}
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      DEPARTMENTS & EXPENSE DISTRIBUTION %
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      totalDepartmentDistribution === 100
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    total: {totalDepartmentDistribution}% {totalDepartmentDistribution === 100 ? '✓' : '(must be 100%)'}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {departments.map((dep, idx) => (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between gap-3 text-xs p-2 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800"
                    >
                      <input
                        type="text"
                        value={dep.name}
                        onChange={(e) => {
                          const updated = departments.map((d, i) =>
                            i === idx ? { ...d, name: e.target.value } : d
                          );
                          handleUpdateDetails({ departments: updated });
                        }}
                        className={`flex-grow p-1 rounded-lg border text-xs font-bold capitalize ${
                          isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-800'
                        }`}
                      />

                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={dep.distributionPct}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = departments.map((d, i) =>
                              i === idx ? { ...d, distributionPct: isNaN(val) ? 0 : val } : d
                            );
                            handleUpdateDetails({ departments: updated });
                          }}
                          className={`w-16 p-1 rounded-lg border text-right text-xs font-bold ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-800'
                          }`}
                        />
                        <span className="text-slate-400">%</span>

                        {departments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = departments.filter((_, i) => i !== idx);
                              handleUpdateDetails({ departments: updated });
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                            title="Remove department"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newId = `dep-${Date.now()}`;
                    const updated = [
                      ...departments,
                      { id: newId, name: 'new department', distributionPct: 0 },
                    ];
                    handleUpdateDetails({ departments: updated });
                  }}
                  className="w-full py-1.5 px-3 rounded-xl border border-dashed border-[#2E5E88]/40 hover:border-[#2E5E88] text-xs font-bold text-[#2E5E88] dark:text-[#5584B4] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>add department</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scenario Reset Action Bar (Matching BizzCalc reset.PNG standard) */}
          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
            }`}
          >
            <button
              type="button"
              onClick={() => setShowResetConfirmModal(true)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold lowercase bg-[#5CA338] hover:bg-[#4E8B30] text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.99]"
              title="re-set this app to default settings (all page values zero, mon-fri working calendar)"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>re-set to default for scenario</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center lowercase font-mono">
              * resets all page values to zero for &ldquo;{mode}&rdquo; (mon, tue, wed, thu, fri)
            </p>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: RESULTS TAB (EXACTLY MATCHING results tab.PNG)                 */}
      {/* ===================================================================== */}
      {activeTab === 'results' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Top Bar: RESULTS TAB + Subtle Adjustment Slider Placeholder + Year Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                RESULTS TAB
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Select any radio button on the right to load and adjust that base rate in the ADJUSTMENT SLIDER situated below the tabled assumptions.
              </p>
            </div>

            {/* Year selector determining 12-month presentation window */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Forecast Year:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setActiveYear(yr)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                      activeYear === yr
                        ? 'bg-[#2E5E88] text-white shadow-xs'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-400 hover:text-white border border-[#252E4A]'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-[#D8CEBC]'
                    }`}
                  >
                    Year {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 12-Month Grid: Working Calendar & Base Rates */}
          <div
            className={`rounded-2xl border overflow-x-auto shadow-md ${
              isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <table className="w-full border-collapse text-xs text-center">
              <thead>
                {/* Month Headers */}
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#121A2F]">
                  <th className="py-2.5 px-3.5 text-left font-bold lowercase text-slate-500 w-[260px] min-w-[260px] max-w-[260px] whitespace-nowrap">
                    months
                  </th>
                  {activeYearMonths.map((m) => (
                    <th key={m.monthIndex} className="py-2 px-1 min-w-[54px] sm:min-w-[62px]">
                      <span className="font-bold text-slate-700 dark:text-slate-200 block text-xs">
                        {m.relativeMonth}
                      </span>
                      <span className="text-[9px] text-slate-400 font-normal block">
                        M{m.monthIndex}
                      </span>
                    </th>
                  ))}
                  {/* Standardized ADJUST column on far right matching standard adjustments.PNG */}
                  <th className="py-2.5 px-3 font-bold uppercase text-center text-[#2E5E88] dark:text-[#5584B4] min-w-[60px] w-[60px]">
                    Adjust
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* ----------------------------------------------------------- */}
                {/* BLOCK 1: WORKING CALENDAR                                   */}
                {/* ----------------------------------------------------------- */}
                {/* Row 1: calendar days */}
                <tr className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-3.5 text-left font-bold lowercase text-slate-700 dark:text-slate-300 w-[260px] min-w-[260px] max-w-[260px] whitespace-nowrap">
                    calendar days
                  </td>
                  {activeYearMonths.map((m) => (
                    <td key={m.monthIndex} className="py-2 px-1">
                      <div className="py-1 px-1 rounded-lg font-bold text-center border border-blue-400 dark:border-blue-600/80 text-blue-600 dark:text-blue-300 bg-blue-500/5">
                        {m.calendarDays}
                      </div>
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                </tr>

                {/* Row 2: less days not worked */}
                <tr className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-3.5 text-left font-bold lowercase text-slate-700 dark:text-slate-300 w-[260px] min-w-[260px] max-w-[260px] whitespace-nowrap">
                    less days not worked
                  </td>
                  {activeYearMonths.map((m) => (
                    <td key={m.monthIndex} className="py-2 px-1">
                      <div className="py-1 px-1 rounded-lg font-bold text-center border border-blue-400 dark:border-blue-600/80 text-blue-600 dark:text-blue-300 bg-blue-500/5">
                        {m.daysNotWorked}
                      </div>
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                </tr>

                {/* Row 3: days worked */}
                <tr className="border-b-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 bg-emerald-500/5">
                  <td className="py-2.5 px-3.5 text-left font-bold lowercase text-emerald-700 dark:text-emerald-400 w-[260px] min-w-[260px] max-w-[260px] whitespace-nowrap">
                    days worked
                  </td>
                  {activeYearMonths.map((m) => (
                    <td key={m.monthIndex} className="py-2 px-1">
                      <div className="py-1 px-1 rounded-lg font-bold text-center border border-blue-400 dark:border-blue-600/80 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                        {m.daysWorked}
                      </div>
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-center w-[60px] text-slate-300 dark:text-slate-700">-</td>
                </tr>

                {/* ----------------------------------------------------------- */}
                {/* BLOCK 2: FOUNDATIONAL BASE RATES (ACTIVE IN SLIDER)         */}
                {/* ----------------------------------------------------------- */}
                {setupAssumptions.map((item) => {
                  const isSelected = selectedAssumptionId === item.id;
                  const startMIdx = (activeYear - 1) * 12;
                  const yearValues = item.monthlyValues.slice(startMIdx, startMIdx + 12);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedAssumptionId(item.id)}
                      className={`border-b border-slate-100 dark:border-slate-800/60 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#2E5E88]/10 dark:bg-[#2E5E88]/20'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-3.5 text-left font-bold lowercase w-[260px] min-w-[260px] max-w-[260px] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              isSelected
                                ? 'text-[#2E5E88] dark:text-[#5584B4]'
                                : 'text-slate-700 dark:text-slate-300'
                            }
                          >
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {/* 12 Months: All columns use the actual line colour (no red in Month 1) */}
                      {yearValues.map((val, idx) => (
                        <td key={idx} className="py-2.5 px-1">
                          <div className="py-1.5 px-1 rounded-lg font-bold text-center text-xs transition-all border border-blue-400 dark:border-blue-600/80 text-blue-600 dark:text-blue-300 bg-blue-500/5">
                            {val.toFixed(2)}
                            <span className="text-[9px] ml-0.5 opacity-70">%</span>
                          </div>
                        </td>
                      ))}

                      {/* Standardized Radio Selector on the far right */}
                      <td className="py-2.5 px-3 text-center w-[60px]" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="setup-assumption-adjust"
                          checked={isSelected}
                          onChange={() => setSelectedAssumptionId(item.id)}
                          className="w-4 h-4 text-[#2E5E88] focus:ring-[#2E5E88] cursor-pointer"
                          aria-label={`Select ${item.name} for adjustment`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* BOTTOM SECTION: ADJUSTMENT SLIDER                                 */}
          {/* ----------------------------------------------------------------- */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between text-xs px-1 gap-2">
              <span className="font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                ADJUSTMENT SLIDER
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 lowercase font-bold">Year change</span>
                <select
                  value={activeYear}
                  onChange={(e) => setActiveYear(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg text-xs font-bold bg-white dark:bg-[#161F38] border border-slate-300 dark:border-slate-700 text-[#2E5E88] dark:text-[#5584B4] cursor-pointer"
                  title="Select Year"
                >
                  {[1, 2, 3, 4, 5].map((yr) => (
                    <option key={yr} value={yr}>
                      Year {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Embedded Dynamic Base Rate Adjustment Tool (Year synced with main panel) */}
            <BaseRateAdjustmentTool
              theme={theme}
              item={activeAssumptionItem}
              selectedYear={activeYear}
              onSelectYear={setActiveYear}
              onUpdateMonthlyValues={handleUpdateMonthlyValues}
              onUpdateBaseRate={handleUpdateBaseRate}
              onPrevItem={handlePrevAssumption}
              onNextItem={handleNextAssumption}
            />
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: CHARTS TAB (5-YEAR HORIZON & ANNUAL PERIOD SUMMARY)            */}
      {/* ===================================================================== */}
      {activeTab === 'charts' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header & View Mode Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
              <div>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                  5-YEAR OPERATIONAL WORKING RHYTHM & BASE RATE CHARTS
                </span>
                <span className="text-[11px] text-slate-400">
                  Visual trajectories for every results tab element across annual periods 1 to 5 & monthly curves
                </span>
              </div>
            </div>

            {/* View Horizon Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#121A2F] p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setChartsHorizon('annual')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    chartsHorizon === 'annual'
                      ? 'bg-[#2E5E88] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  5-Year Horizon
                </button>
                <button
                  type="button"
                  onClick={() => setChartsHorizon('monthly')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    chartsHorizon === 'monthly'
                      ? 'bg-[#2E5E88] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  12-Month Detail
                </button>
              </div>

              {chartsHorizon === 'monthly' && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400 lowercase mr-1">Year:</span>
                  {[1, 2, 3, 4, 5].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setActiveYear(yr)}
                      className={`w-7 h-7 rounded-lg font-bold transition-all ${
                        activeYear === yr
                          ? 'bg-[#2E5E88] text-white shadow-xs'
                          : isDark
                          ? 'bg-[#141A2E] text-slate-400 hover:text-white border border-[#252E4A]'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-[#D8CEBC]'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ================================================================= */}
          {/* CHART 1: PRODUCTIVE DAYS WORKED VS OFF-DAYS (5-YEAR TRAJECTORY)    */}
          {/* Elements: days worked, less days not worked, calendar days        */}
          {/* ================================================================= */}
          <div
            className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block">
                  1. PRODUCTIVE DAYS WORKED VS. OFF-DAYS (5-YEAR HORIZON)
                </span>
                <span className="text-[11px] text-slate-400">
                  Elements: calendar days, less days not worked, days worked (productive)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-300">days worked</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-amber-500" />
                  <span className="text-slate-600 dark:text-slate-300">days not worked</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center pt-2">
              {annualSummary.map((yr) => (
                <div
                  key={yr.year}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#2E5E88] dark:text-[#5584B4] uppercase">
                    <span>YEAR {yr.year}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{yr.calendarDays} cal d</span>
                  </div>

                  <div className="h-32 flex items-end justify-center gap-2 pt-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {yr.daysWorked}d
                      </span>
                      <div
                        className="w-6 sm:w-7 bg-emerald-500 rounded-t-sm transition-all shadow-xs"
                        style={{ height: `${(yr.daysWorked / 366) * 90}px` }}
                        title={`Days Worked: ${yr.daysWorked} days`}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        {yr.daysNotWorked}d
                      </span>
                      <div
                        className="w-6 sm:w-7 bg-amber-500 rounded-t-sm transition-all shadow-xs"
                        style={{ height: `${(yr.daysNotWorked / 366) * 90}px` }}
                        title={`Days Off: ${yr.daysNotWorked} days`}
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5 pt-1 text-center">
                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      {yr.daysWorked} days productive
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {yr.efficiencyPct}% working efficiency
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 5-Year Horizon Summary Strip */}
            <div className="p-3 rounded-xl bg-[#2E5E88]/10 border border-[#2E5E88]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-[#2E5E88] dark:text-[#5584B4] uppercase">
                5-YEAR OPERATIONAL WORKING TOTALS:
              </span>
              <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
                <span className="text-slate-600 dark:text-slate-300">
                  total calendar: <strong className="text-slate-900 dark:text-white">{fiveYearTotal.calendarDays} d</strong>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  productive: <strong>{fiveYearTotal.daysWorked} d ({fiveYearTotal.efficiencyPct}%)</strong>
                </span>
                <span className="text-amber-600 dark:text-amber-400">
                  off-days: <strong>{fiveYearTotal.daysNotWorked} d</strong>
                </span>
                <span className="text-[#2E5E88] dark:text-[#5584B4]">
                  avg monthly worked: <strong>{fiveYearTotal.avgMonthlyWorked} d/mo</strong>
                </span>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* CHART 2: 12-MONTH MONTHLY OPERATING CALENDAR RHYTHM               */}
          {/* Elements: monthly calendar days, days not worked, days worked     */}
          {/* ================================================================= */}
          <div
            className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block">
                  2. 12-MONTH OPERATIONAL CALENDAR SCHEDULE (YEAR {activeYear})
                </span>
                <span className="text-[11px] text-slate-400">
                  Monthly working days distribution after deducting scheduled holidays and shutdown
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 lowercase">select year:</span>
                {[1, 2, 3, 4, 5].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setActiveYear(yr)}
                    className={`w-6 h-6 rounded-md font-bold text-xs transition-all ${
                      activeYear === yr
                        ? 'bg-[#2E5E88] text-white'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-400'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            {/* 12-Month Bar Columns */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2 text-center pt-2">
              {activeYearMonths.map((m) => (
                <div
                  key={m.monthIndex}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 space-y-1.5 flex flex-col justify-between"
                >
                  <div className="text-[10px] font-bold text-slate-500 uppercase">
                    <span>{m.monthLabel.split(' ')[0]}</span>
                    <span className="text-[9px] block text-slate-400 font-normal">M{m.monthIndex}</span>
                  </div>

                  {/* Dual Bar (Worked vs Off) */}
                  <div className="h-24 flex items-end justify-center gap-1 pt-1 pb-1 border-b border-slate-200 dark:border-slate-800">
                    <div
                      className="w-3 bg-emerald-500 rounded-t-xs transition-all"
                      style={{ height: `${(m.daysWorked / 31) * 75}px` }}
                      title={`Worked: ${m.daysWorked} days`}
                    />
                    <div
                      className="w-3 bg-amber-500/80 rounded-t-xs transition-all"
                      style={{ height: `${(m.daysNotWorked / 31) * 75}px` }}
                      title={`Off: ${m.daysNotWorked} days`}
                    />
                  </div>

                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {m.daysWorked}d
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {m.calendarDays} cal d
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 text-xs pt-1 text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                <span>productive days worked ({activeYearMonths.reduce((s, m) => s + m.daysWorked, 0)}d in Year {activeYear})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500/80" />
                <span>deducted off-days ({activeYearMonths.reduce((s, m) => s + m.daysNotWorked, 0)}d)</span>
              </span>
            </div>
          </div>

          {/* ================================================================= */}
          {/* CHART 3: INTEREST RATES TRAJECTORY (POSITIVE VS. NEGATIVE BALANCE) */}
          {/* Elements: interest rates positive, interest rates negative        */}
          {/* ================================================================= */}
          <div
            className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block">
                  3. BANK INTEREST RATES TRAJECTORY: SURPLUS CASH YIELD VS. OVERDRAFT COST
                </span>
                <span className="text-[11px] text-slate-400">
                  Elements: bank interest rate & overdraft interest rate
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-cyan-500" />
                  <span className="text-slate-600 dark:text-slate-300">positive balance rate (yield)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-rose-500" />
                  <span className="text-slate-600 dark:text-slate-300">negative balance rate (overdraft)</span>
                </span>
              </div>
            </div>

            {/* 5-Year Trajectory Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center pt-2">
              {[1, 2, 3, 4, 5].map((yr) => {
                const posRate = interestPosAnnual.find((p) => p.year === yr)?.avg ?? 0;
                const negRate = interestNegAnnual.find((n) => n.year === yr)?.avg ?? 0;
                const spread = posRate - negRate;
                const maxAxisRate = Math.max(20, posRate, negRate);

                return (
                  <div
                    key={yr}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between"
                  >
                    <div className="text-xs font-bold text-[#2E5E88] dark:text-[#5584B4] uppercase">
                      YEAR {yr}
                    </div>

                    <div className="h-28 flex items-end justify-center gap-3 pt-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                          {posRate.toFixed(2)}%
                        </span>
                        <div
                          className="w-5 sm:w-6 bg-cyan-500 rounded-t-sm transition-all shadow-xs"
                          style={{ height: `${Math.max(0, (posRate / maxAxisRate) * 85)}px` }}
                          title={`Positive Balance Yield: ${posRate.toFixed(2)}%`}
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          {negRate.toFixed(2)}%
                        </span>
                        <div
                          className="w-5 sm:w-6 bg-rose-500 rounded-t-sm transition-all shadow-xs"
                          style={{ height: `${Math.max(0, (negRate / maxAxisRate) * 85)}px` }}
                          title={`Negative Overdraft Cost: ${negRate.toFixed(2)}%`}
                        />
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 pt-1">
                      spread: <span className="font-bold text-rose-500">{spread.toFixed(2)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================================================================= */}
          {/* CHARTS 4 & 5: DUAL TAX TRAJECTORIES (VAT RATE % & TAX RATE %)    */}
          {/* Elements: vat rate %, tax rate %                                  */}
          {/* ================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Chart 4: Value Added Tax (VAT) */}
            <div
              className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block">
                    4. VAT RATE % TRAJECTORY
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Statutory consumption tax baseline & slider adjustments
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center pt-2">
                {[1, 2, 3, 4, 5].map((yr) => {
                  const rate = vatAnnual.find((v) => v.year === yr)?.avg ?? 0.0;
                  return (
                    <div
                      key={yr}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 space-y-1"
                    >
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Y{yr}</div>
                      <div className="h-20 flex items-end justify-center pb-1">
                        <div
                          className="w-4 sm:w-5 bg-indigo-500 rounded-t-sm shadow-xs transition-all"
                          style={{ height: `${(rate / 25) * 65}px` }}
                          title={`VAT Year ${yr}: ${rate.toFixed(2)}%`}
                        />
                      </div>
                      <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {rate.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 5: Corporate Income Tax Rate */}
            <div
              className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block">
                    5. CORPORATE TAX RATE % TRAJECTORY
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Headline corporate income tax rate on net profit before tax
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center pt-2">
                {[1, 2, 3, 4, 5].map((yr) => {
                  const rate = taxAnnual.find((t) => t.year === yr)?.avg ?? 0.0;
                  return (
                    <div
                      key={yr}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 space-y-1"
                    >
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Y{yr}</div>
                      <div className="h-20 flex items-end justify-center pb-1">
                        <div
                          className="w-4 sm:w-5 bg-amber-500 rounded-t-sm shadow-xs transition-all"
                          style={{ height: `${(rate / 35) * 65}px` }}
                          title={`Tax Year ${yr}: ${rate.toFixed(2)}%`}
                        />
                      </div>
                      <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        {rate.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* CHART 6: 5-YEAR MACRO BASE RATES COMPARISON MATRIX                */}
          {/* Multi-series unified view of all foundational rates               */}
          {/* ================================================================= */}
          <div
            className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block">
                  6. MACRO BASE RATES MULTI-SERIES MATRIX (ANNUAL PERIODS 1 – 5)
                </span>
                <span className="text-[11px] text-slate-400">
                  Side-by-side comparison of interest yield, borrowing rate, VAT, and corporate tax
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-cyan-500" />
                  <span>pos interest</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                  <span>neg overdraft</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500" />
                  <span>vat %</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                  <span>tax %</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center pt-2">
              {[1, 2, 3, 4, 5].map((yr) => {
                const pos = interestPosAnnual.find((p) => p.year === yr)?.avg ?? 0;
                const neg = interestNegAnnual.find((n) => n.year === yr)?.avg ?? 0;
                const vat = vatAnnual.find((v) => v.year === yr)?.avg ?? 0.0;
                const tax = taxAnnual.find((t) => t.year === yr)?.avg ?? 0.0;
                const maxAxisRate = Math.max(35, pos, neg, vat, tax);

                return (
                  <div
                    key={yr}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="text-xs font-bold text-[#2E5E88] dark:text-[#5584B4] uppercase">
                      PERIOD {yr}
                    </div>

                    <div className="h-32 flex items-end justify-center gap-1 pt-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                      <div
                        className="w-3 sm:w-3.5 bg-cyan-500 rounded-t-xs transition-all"
                        style={{ height: `${Math.max(0, (pos / maxAxisRate) * 95)}px` }}
                        title={`Pos Interest: ${pos.toFixed(2)}%`}
                      />
                      <div
                        className="w-3 sm:w-3.5 bg-rose-500 rounded-t-xs transition-all"
                        style={{ height: `${Math.max(0, (neg / maxAxisRate) * 95)}px` }}
                        title={`Neg Overdraft: ${neg.toFixed(2)}%`}
                      />
                      <div
                        className="w-3 sm:w-3.5 bg-indigo-500 rounded-t-xs transition-all"
                        style={{ height: `${Math.max(0, (vat / maxAxisRate) * 95)}px` }}
                        title={`VAT: ${vat.toFixed(2)}%`}
                      />
                      <div
                        className="w-3 sm:w-3.5 bg-amber-500 rounded-t-xs transition-all"
                        style={{ height: `${Math.max(0, (tax / maxAxisRate) * 95)}px` }}
                        title={`Tax: ${tax.toFixed(2)}%`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 text-[9px] font-mono text-left pt-1">
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold">{pos.toFixed(1)}%</span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold text-right">{neg.toFixed(1)}%</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">{vat.toFixed(1)}%</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold text-right">{tax.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* RESET ALL VALUES TO ZERO CONFIRMATION MODAL                           */}
      {/* ===================================================================== */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-sm rounded-3xl border p-5 space-y-4 shadow-2xl font-mono ${
              isDark ? 'bg-[#101626] border-[#222F4C] text-[#E2E8F0]' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs lowercase font-normal text-[#5CA338]">
                <div className="p-1.5 rounded-lg bg-[#5CA338]/20 text-[#5CA338]">
                  <RotateCcw className="h-3.5 w-3.5" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white">re-set to default for scenario</span>
              </div>
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-normal lowercase leading-relaxed">
              <p className="text-slate-700 dark:text-slate-300">
                Are you sure you want to reset all values for <strong className="text-[#2E5E88] dark:text-[#5584B4] font-bold">&ldquo;{mode}&rdquo;</strong> to zero?
              </p>
              <div className="p-3 rounded-2xl bg-white dark:bg-[#0E1322] border border-[#D8CEBC] dark:border-[#222F4C] text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div>✓ working days: <strong className="text-slate-900 dark:text-slate-100">mon, tue, wed, thu, fri</strong></div>
                <div>✓ deduct public holidays: <strong className="text-slate-900 dark:text-slate-100">enabled</strong></div>
                <div>✓ interest, vat &amp; tax rates: <strong className="text-slate-900 dark:text-slate-100">all base rates 0%</strong></div>
                <div>✓ revenue calculator: <strong className="text-slate-900 dark:text-slate-100">all page values 0</strong></div>
                <div>✓ employment &amp; payroll: <strong className="text-slate-900 dark:text-slate-100">all page values 0</strong></div>
                <div>✓ operating expenses: <strong className="text-slate-900 dark:text-slate-100">all page values 0</strong></div>
                <div>✓ fixed assets &amp; funding: <strong className="text-slate-900 dark:text-slate-100">all page values 0</strong></div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResetAllToZero}
                className="w-full py-2.5 px-3 rounded-xl bg-[#5CA338] hover:bg-[#4E8B30] text-white text-xs lowercase font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>reset &ldquo;{mode}&rdquo; values to zero</span>
              </button>

              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="w-full py-1 text-xs lowercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-center cursor-pointer"
              >
                cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FLOATING RESET SUCCESS TOAST                                          */}
      {/* ===================================================================== */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-2xl bg-[#5CA338] text-white text-xs font-mono shadow-xl border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default SetupStep;
