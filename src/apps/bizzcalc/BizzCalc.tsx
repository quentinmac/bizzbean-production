import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  Download,
  Calendar,
  Check,
  ChevronDown,
  Layers,
  Info,
  Smartphone,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  BUSINESS_TYPES,
  BUSINESS_MODELS,
  STANDARD_OPEX_NAMES,
  STANDARD_ASSET_CATEGORIES,
} from '../bizzmodel/constants';
import { generateBizzCalcPdf } from './utils/pdfExport';

// Types for BizzCalc Scenarios
export type ScenarioId = 'learn' | 'my dream' | 'break that constraint' | 'when this happens';

export interface BizzCalcStaffItem {
  id: string;
  title: string;
  startMonth: number;
  baseRate: number; // monthly
  number: number;
}

export interface BizzCalcAssetItem {
  id: string;
  description: string;
  category: string;
  purchaseMonth: number;
  qty: number;
  unitCost: number;
}

export interface BizzCalcScenarioData {
  // 1. business details
  businessName: string;
  startDate: string; // e.g. "2026-03"
  scenario: ScenarioId;
  workingDays: { [key: string]: boolean }; // monday-sunday
  deductHolidays: boolean;
  holidays: Array<{ id: string; name: string; date: string }>;

  // 2. revenue calculator
  revStartMonth: number;
  baseDailyRevenue: number;
  grossProfitMarginPct: number;
  monthlyRevenueAdjustmentsPct: number[]; // 12 months

  // 3. employment
  empReviewMonth: number;
  empReviewRatePct: number;
  staff: BizzCalcStaffItem[];

  // 4. operating expenses
  opexReviewMonth: number;
  opexReviewRatePct: number;
  opexValues: { [name: string]: { startMonth: number; monthlyRate: number } };

  // 5. fixed assets
  assets: BizzCalcAssetItem[];

  // 6. funding calculator
  inventoryDays: number;
  receivablesDays: number;
  payablesDays: number;
  deposits: number;
  floats: number;
  pettyCash: number;
}

const DEFAULT_HOLIDAYS = [
  { id: 'h1', name: "new year's day", date: '2026-01-01' },
  { id: 'h2', name: 'human rights day', date: '2026-03-21' },
  { id: 'h3', name: 'good friday', date: '2026-04-03' },
  { id: 'h4', name: 'family day', date: '2026-04-06' },
  { id: 'h5', name: 'freedom day', date: '2026-04-27' },
  { id: 'h6', name: "workers' day", date: '2026-05-01' },
  { id: 'h7', name: 'youth day', date: '2026-06-16' },
  { id: 'h8', name: "national women's day", date: '2026-08-09' },
  { id: 'h9', name: 'heritage day', date: '2026-09-24' },
  { id: 'h10', name: 'day of reconciliation', date: '2026-12-16' },
  { id: 'h11', name: 'christmas day', date: '2026-12-25' },
  { id: 'h12', name: 'day of goodwill', date: '2026-12-26' },
];

function createInitialScenario(scenario: ScenarioId): BizzCalcScenarioData {
  const isLearn = scenario === 'learn';
  const isDream = scenario === 'my dream';
  const isConstraint = scenario === 'break that constraint';

  const baseRev = isLearn ? 5000 : isDream ? 8500 : isConstraint ? 6200 : 4500;
  const gpMargin = isLearn ? 20 : isDream ? 35 : isConstraint ? 28 : 22;

  // default opex values
  const defaultOpex: { [name: string]: { startMonth: number; monthlyRate: number } } = {};
  STANDARD_OPEX_NAMES.forEach((name, idx) => {
    let rate = 0;
    if (idx < 8) {
      rate = isLearn ? 1500 : 2500;
    }
    defaultOpex[name] = { startMonth: 1, monthlyRate: rate };
  });

  return {
    businessName: isLearn ? 'bizzbean learning enterprise' : 'my dream venture',
    startDate: '2026-03',
    scenario,
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
    deductHolidays: true,
    holidays: [...DEFAULT_HOLIDAYS],

    revStartMonth: 1,
    baseDailyRevenue: baseRev,
    grossProfitMarginPct: gpMargin,
    monthlyRevenueAdjustmentsPct: [0, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],

    empReviewMonth: 7,
    empReviewRatePct: 10,
    staff: [
      { id: 's1', title: 'operations director', startMonth: 2, baseRate: 10000, number: 1 },
      { id: 's2', title: 'support specialist', startMonth: 1, baseRate: 6500, number: 2 },
    ],

    opexReviewMonth: 7,
    opexReviewRatePct: 10,
    opexValues: defaultOpex,

    assets: [
      {
        id: 'a1',
        description: 'commercial delivery vehicle',
        category: 'Commercial vehicles',
        purchaseMonth: 1,
        qty: 1,
        unitCost: 100000,
      },
      {
        id: 'a2',
        description: 'office workstations',
        category: 'Computer hardware',
        purchaseMonth: 1,
        qty: 3,
        unitCost: 15000,
      },
    ],

    inventoryDays: 30,
    receivablesDays: 30,
    payablesDays: 30,
    deposits: 15000,
    floats: 15000,
    pettyCash: 15000,
  };
}

interface BizzCalcProps {
  theme?: 'light' | 'dark';
  onClose: () => void;
  onContextSwitch?: (appId: string, step?: string) => void;
  userProfile?: { companyName?: string; founderName?: string };
}

export const BizzCalc: React.FC<BizzCalcProps> = ({
  theme = 'light',
  onClose,
  userProfile,
}) => {
  const isDark = theme === 'dark';

  // 7 Steps definition with custom step icons
  const STEPS = [
    { id: 1, name: 'business details', icon: '/business details.jpg' },
    { id: 2, name: 'revenue calculator', icon: '/revenue calculator.jpg' },
    { id: 3, name: 'employment', icon: '/employment.jpg' },
    { id: 4, name: 'operating expenses', icon: '/operating expenses.jpg' },
    { id: 5, name: 'fixed assets', icon: '/fixed assets.jpg' },
    { id: 6, name: 'funding calculator', icon: '/funding calculator.jpg' },
    { id: 7, name: 'reports', icon: '/reports.jpg' },
  ];

  const SCENARIOS: ScenarioId[] = ['learn', 'my dream', 'break that constraint', 'when this happens'];

  // Current step (1 to 7)
  const [activeStep, setActiveStep] = useState<number>(1);

  // Active scenario
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('learn');

  // Active function tab per page: 'assistance' | 'assumptions' | 'data entry' | 'results'
  const [activeTab, setActiveTab] = useState<'assistance' | 'assumptions' | 'data entry' | 'results'>('assumptions');

  // Simple assistance popup open state
  const [showAssistanceModal, setShowAssistanceModal] = useState<boolean>(false);

  // Mobile container view toggle (fullscreen vs simulated mobile viewport on desktop)
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(false);

  // State per scenario stored in localStorage
  const [scenarioData, setScenarioData] = useState<Record<ScenarioId, BizzCalcScenarioData>>(() => {
    const map: Partial<Record<ScenarioId, BizzCalcScenarioData>> = {};
    for (const sc of SCENARIOS) {
      try {
        const saved = localStorage.getItem(`bizzcalc_scenario_${sc}`);
        if (saved) {
          map[sc] = JSON.parse(saved);
          continue;
        }
      } catch (e) {
        // ignore
      }
      map[sc] = createInitialScenario(sc);
    }
    return map as Record<ScenarioId, BizzCalcScenarioData>;
  });

  const current = scenarioData[activeScenario] || createInitialScenario('learn');

  // Persist current scenario to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`bizzcalc_scenario_${activeScenario}`, JSON.stringify(current));
    } catch (e) {
      // ignore
    }
  }, [activeScenario, current]);

  const updateCurrent = (patch: Partial<BizzCalcScenarioData>) => {
    setScenarioData((prev) => ({
      ...prev,
      [activeScenario]: {
        ...prev[activeScenario],
        ...patch,
      },
    }));
  };

  // Business name helper for report headers per user brief (e.g. "business name: income statement")
  const reportBusinessName = useMemo(() => {
    const raw = (current.businessName || '').trim();
    if (raw) return raw.toLowerCase();
    if (userProfile?.companyName?.trim()) {
      return userProfile.companyName.trim().toLowerCase();
    }
    try {
      const saved = localStorage.getItem('bizzdesk_user_profile_v1');
      if (saved) {
        const p = JSON.parse(saved);
        if (p?.companyName?.trim()) {
          return p.companyName.trim().toLowerCase();
        }
      }
    } catch (e) {}
    return 'business name';
  }, [current.businessName, userProfile?.companyName]);

  // Option to sync start date across all scenarios or set per scenario
  const [syncStartDateAcrossScenarios, setSyncStartDateAcrossScenarios] = useState<boolean>(true);

  // Changing start date updates immediately without destructive data loss or blocked window.confirm
  const handleStartDateChange = (newDate: string) => {
    if (!newDate) return;
    setScenarioData((prev) => {
      const next = { ...prev };
      if (syncStartDateAcrossScenarios) {
        // Sync across all scenarios so toggling scenario retains the chosen business start date
        for (const sc of SCENARIOS) {
          if (next[sc]) {
            next[sc] = {
              ...next[sc],
              startDate: newDate,
            };
            try {
              localStorage.setItem(`bizzcalc_scenario_${sc}`, JSON.stringify(next[sc]));
            } catch (e) {
              // ignore
            }
          }
        }
      } else {
        // Update current scenario only
        if (next[activeScenario]) {
          next[activeScenario] = {
            ...next[activeScenario],
            startDate: newDate,
          };
          try {
            localStorage.setItem(`bizzcalc_scenario_${activeScenario}`, JSON.stringify(next[activeScenario]));
          } catch (e) {
            // ignore
          }
        }
      }
      return next;
    });
  };

  // Filter toggles for results charts
  const [revenueFilter, setRevenueFilter] = useState<'revenue' | 'gross profit'>('revenue');
  const [fundingFilter, setFundingFilter] = useState<'inventory' | 'receivables' | 'payables'>('inventory');

  // State for adding staff form
  const [newStaffTitle, setNewStaffTitle] = useState('');
  const [newStaffStartMonth, setNewStaffStartMonth] = useState(1);
  const [newStaffBaseRate, setNewStaffBaseRate] = useState(10000);
  const [newStaffCount, setNewStaffCount] = useState(1);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  // State for adding asset form
  const [newAssetDesc, setNewAssetDesc] = useState('office equipment');
  const [newAssetCat, setNewAssetCat] = useState<string>(STANDARD_ASSET_CATEGORIES[0].name);
  const [newAssetMonth, setNewAssetMonth] = useState(1);
  const [newAssetQty, setNewAssetQty] = useState(1);
  const [newAssetUnitCost, setNewAssetUnitCost] = useState(50000);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

  // Holiday add form
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');

  // -------------------------------------------------------------
  // MATHEMATICAL ALGORITHMS & COMPUTATIONS
  // -------------------------------------------------------------

  // Calendar calculations
  // Parse start year and start month
  const [startYearStr, startMonthStr] = (current.startDate || '2026-03').split('-');
  const startYear = parseInt(startYearStr, 10) || 2026;
  const startMonthNum = parseInt(startMonthStr, 10) || 3; // 1-12

  // Month days mapping starting from selected start month
  const monthlyCalendar = useMemo(() => {
    const list = [];
    let curYear = startYear;
    let curMonth = startMonthNum; // 1-indexed

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    for (let m = 1; m <= 12; m++) {
      // Days in this Gregorian month
      const daysInMonth = new Date(curYear, curMonth, 0).getDate();

      // Count working days in month
      let workingDaysCount = 0;
      let holidaysOnWorkingDays = 0;
      let holidaysInMonthTotal = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(curYear, curMonth - 1, d);
        const dayOfWeekIndex = dateObj.getDay();
        const dayName = dayNames[dayOfWeekIndex];
        const isScheduledWorkingDay = !!current.workingDays[dayName];

        // Check if this date is a holiday
        let isHoliday = false;
        if (current.deductHolidays) {
          const monthDayStr = `${String(curMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const fullDateStr = `${curYear}-${monthDayStr}`;
          isHoliday = current.holidays.some((h) => {
            if (h.date === fullDateStr) return true;
            if (h.date.endsWith(monthDayStr)) return true;
            return false;
          });
        }

        if (isScheduledWorkingDay) {
          workingDaysCount++;
          if (isHoliday) {
            holidaysOnWorkingDays++;
          }
        }
        if (isHoliday) {
          holidaysInMonthTotal++;
        }
      }

      // Statutory rule: only deduct holidays that fall on a scheduled working day
      const netDaysWorked = Math.max(0, workingDaysCount - holidaysOnWorkingDays);
      const monthShort = new Date(curYear, curMonth - 1, 1).toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
      const monthLabel = `${monthShort} '${String(curYear).slice(2)}`;

      list.push({
        monthIndex: m,
        monthLabel,
        monthShort,
        year: curYear,
        month: curMonth,
        daysInMonth,
        netDaysWorked,
        workingDaysCount,
        holidaysInMonth: holidaysOnWorkingDays,
        holidaysInMonthTotal,
      });

      curMonth++;
      if (curMonth > 12) {
        curMonth = 1;
        curYear++;
      }
    }
    return list;
  }, [startYear, startMonthNum, current.workingDays, current.deductHolidays, current.holidays]);

  const totalCalendarDays = monthlyCalendar.reduce((sum, m) => sum + m.daysInMonth, 0);
  const totalDaysWorked = monthlyCalendar.reduce((sum, m) => sum + m.netDaysWorked, 0);
  const totalDaysNotWorked = totalCalendarDays - totalDaysWorked;

  // Revenue computations
  const revenueMonthly = useMemo(() => {
    let dailyRate = current.baseDailyRevenue;
    const months = [];

    for (let i = 0; i < 12; i++) {
      const mNum = i + 1;
      const adj = current.monthlyRevenueAdjustmentsPct[i] ?? 0;

      if (i > 0) {
        dailyRate = dailyRate * (1 + adj / 100);
      }

      const daysWorked = monthlyCalendar[i]?.netDaysWorked || 20;
      const isActive = mNum >= (current.revStartMonth || 1);
      const rev = isActive ? Math.round(dailyRate * daysWorked) : 0;
      const gp = Math.round(rev * (current.grossProfitMarginPct / 100));

      months.push({
        month: mNum,
        dailyRate: Math.round(dailyRate),
        rateChangePct: adj,
        daysWorked,
        revenue: rev,
        grossProfit: gp,
      });
    }
    return months;
  }, [current.baseDailyRevenue, current.monthlyRevenueAdjustmentsPct, current.revStartMonth, current.grossProfitMarginPct, monthlyCalendar]);

  const annualRevenue = revenueMonthly.reduce((s, m) => s + m.revenue, 0);
  const annualGrossProfit = revenueMonthly.reduce((s, m) => s + m.grossProfit, 0);
  const annualCostOfSales = annualRevenue - annualGrossProfit;

  // Employment computations
  const employmentMonthly = useMemo(() => {
    const list = Array(12).fill(0);
    for (let m = 1; m <= 12; m++) {
      let monthTotal = 0;
      for (const st of current.staff) {
        if (m >= st.startMonth) {
          let rate = st.baseRate;
          if (m >= current.empReviewMonth) {
            rate = rate * (1 + current.empReviewRatePct / 100);
          }
          monthTotal += rate * st.number;
        }
      }
      list[m - 1] = Math.round(monthTotal);
    }
    return list;
  }, [current.staff, current.empReviewMonth, current.empReviewRatePct]);

  const annualEmployment = employmentMonthly.reduce((s, v) => s + v, 0);

  // Operating expenses computations
  const opexMonthly = useMemo(() => {
    const list = Array(12).fill(0);
    const itemTotals: { [name: string]: number } = {};

    for (const name of STANDARD_OPEX_NAMES) {
      itemTotals[name] = 0;
      const conf = current.opexValues[name] || { startMonth: 1, monthlyRate: 0 };

      for (let m = 1; m <= 12; m++) {
        if (m >= conf.startMonth && conf.monthlyRate > 0) {
          let r = conf.monthlyRate;
          if (m >= current.opexReviewMonth) {
            r = r * (1 + current.opexReviewRatePct / 100);
          }
          list[m - 1] += r;
          itemTotals[name] += r;
        }
      }
    }
    return {
      monthlyTotals: list.map((v) => Math.round(v)),
      itemTotals,
    };
  }, [current.opexValues, current.opexReviewMonth, current.opexReviewRatePct]);

  const annualOpex = opexMonthly.monthlyTotals.reduce((s, v) => s + v, 0);

  // Fixed Assets & Depreciation computations
  const fixedAssetsMetrics = useMemo(() => {
    let totalOriginalCost = 0;
    const monthlyDepreciation = Array(12).fill(0);

    for (const asset of current.assets) {
      const cost = asset.unitCost * asset.qty;
      totalOriginalCost += cost;

      const catDef = STANDARD_ASSET_CATEGORIES.find((c) => c.name === asset.category) || STANDARD_ASSET_CATEGORIES[0];
      const depRateAnnual = catDef.depreciationRate / 100;
      const depMonthly = (cost * depRateAnnual) / 12;

      for (let m = asset.purchaseMonth; m <= 12; m++) {
        monthlyDepreciation[m - 1] += depMonthly;
      }
    }

    const roundedMonthlyDep = monthlyDepreciation.map((v) => Math.round(v));
    const totalDepreciation = roundedMonthlyDep.reduce((s, v) => s + v, 0);
    const balanceSheetValue = Math.max(0, totalOriginalCost - totalDepreciation);

    return {
      totalOriginalCost,
      totalDepreciation,
      balanceSheetValue,
      monthlyDepreciation: roundedMonthlyDep,
    };
  }, [current.assets]);

  // Funding & Working Capital computations
  const fundingMetrics = useMemo(() => {
    const monthlyInventory: number[] = [];
    const monthlyReceivables: number[] = [];
    const monthlyPayables: number[] = [];

    for (let i = 0; i < 12; i++) {
      const rev = revenueMonthly[i]?.revenue || 0;
      const cos = rev - (revenueMonthly[i]?.grossProfit || 0);

      // month end inventory = month cost of sales / 30 * inventory days
      const inv = Math.round((cos / 30) * current.inventoryDays);
      // month end receivables = month revenue / 30 * receivables days
      const rec = Math.round((rev / 30) * current.receivablesDays);
      // month end payables = month cost of sales / 30 * payables days
      const pay = Math.round((cos / 30) * current.payablesDays);

      monthlyInventory.push(inv);
      monthlyReceivables.push(rec);
      monthlyPayables.push(pay);
    }

    const otherAssetsTotal = current.deposits + current.floats + current.pettyCash;

    return {
      monthlyInventory,
      monthlyReceivables,
      monthlyPayables,
      yearendInventory: monthlyInventory[11] || 0,
      yearendReceivables: monthlyReceivables[11] || 0,
      yearendPayables: monthlyPayables[11] || 0,
      yearendOtherAssets: otherAssetsTotal,
    };
  }, [revenueMonthly, current.inventoryDays, current.receivablesDays, current.payablesDays, current.deposits, current.floats, current.pettyCash]);

  // Integrated Reports (Cash flow & statements)
  const reportMetrics = useMemo(() => {
    const totalNop = annualGrossProfit - (annualEmployment + annualOpex + fixedAssetsMetrics.totalDepreciation);
    const yearendNetOperatingAssets =
      fixedAssetsMetrics.balanceSheetValue +
      fundingMetrics.yearendInventory +
      fundingMetrics.yearendReceivables +
      fundingMetrics.yearendOtherAssets -
      fundingMetrics.yearendPayables;

    // V1 Explicit Rule:
    // • capital employed = - net operating assets
    // • retained earnings = - net operating profit (positive if there is a loss)
    // • bank balance = capital employed - retained earnings
    const capitalEmployed = -yearendNetOperatingAssets;
    const retainedEarnings = -totalNop;
    const closingBankBalance = capitalEmployed - retainedEarnings; // = totalNop - yearendNetOperatingAssets

    // 12-month summary cash flow & month-by-month balance sheet progression
    const cashFlowMonths = [];
    let prevNoa = 0;
    let prevBankBalance = 0;
    let runningCumNop = 0;

    for (let i = 0; i < 12; i++) {
      const m = i + 1;
      const rev = revenueMonthly[i]?.revenue || 0;
      const cos = rev - (revenueMonthly[i]?.grossProfit || 0);
      const gp = rev - cos;
      const emp = employmentMonthly[i] || 0;
      const opex = opexMonthly.monthlyTotals[i] || 0;
      const dep = fixedAssetsMetrics.monthlyDepreciation[i] || 0;
      const totalExp = emp + opex + dep;
      const nop = gp - totalExp;
      runningCumNop += nop;

      // Fixed assets book value at month m
      let capexToMonth = 0;
      let depToMonth = 0;
      for (const asset of current.assets) {
        if (asset.purchaseMonth <= m) {
          const cost = asset.unitCost * asset.qty;
          capexToMonth += cost;
          const catDef = STANDARD_ASSET_CATEGORIES.find((c) => c.name === asset.category) || STANDARD_ASSET_CATEGORIES[0];
          const depMonthly = (cost * (catDef.depreciationRate / 100)) / 12;
          const activeMonths = m - asset.purchaseMonth + 1;
          depToMonth += depMonthly * activeMonths;
        }
      }
      const faValue_m = Math.max(0, capexToMonth - depToMonth);

      // Working capital at month m
      const inv_m = fundingMetrics.monthlyInventory[i] || 0;
      const rec_m = fundingMetrics.monthlyReceivables[i] || 0;
      const pay_m = fundingMetrics.monthlyPayables[i] || 0;
      const other_m = fundingMetrics.yearendOtherAssets;
      const noa_m = faValue_m + inv_m + rec_m + other_m - pay_m;

      // Month m capital employed & retained earnings
      const capEmployed_m = -noa_m;
      const retEarnings_m = -runningCumNop;
      const monthBankBalance = capEmployed_m - retEarnings_m; // = runningCumNop - noa_m

      // Net applied in month m (cash change in net operating assets)
      const applied = -(noa_m - prevNoa);
      const netCashFlow = monthBankBalance - prevBankBalance;

      prevNoa = noa_m;
      prevBankBalance = monthBankBalance;

      cashFlowMonths.push({
        month: m,
        nop,
        applied,
        cashFlow: netCashFlow,
        bankBalance: monthBankBalance,
      });
    }

    const totalCapex = fixedAssetsMetrics.totalOriginalCost;
    const totalWorkingCapitalApplied =
      fundingMetrics.yearendInventory + fundingMetrics.yearendReceivables + fundingMetrics.yearendOtherAssets - fundingMetrics.yearendPayables;
    const totalApplications = -yearendNetOperatingAssets;
    const annualNetCashFlow = closingBankBalance;

    return {
      cashFlowMonths,
      totalNop,
      yearendNetOperatingAssets,
      capitalEmployed,
      retainedEarnings,
      closingBankBalance,
      totalApplications,
      annualNetCashFlow,
    };
  }, [
    revenueMonthly,
    annualGrossProfit,
    annualEmployment,
    annualOpex,
    employmentMonthly,
    opexMonthly,
    fixedAssetsMetrics,
    fundingMetrics,
    current.assets,
  ]);

  // Assistance descriptions matching PDF requirements
  const assistanceContent = useMemo(() => {
    switch (activeStep) {
      case 1:
        return {
          title: 'business details assistance',
          body: 'configure your business entity name, operating scenario, and calendar rhythms. the working calendar calculates productive operating days across the 12-month period.',
          bullets: [
            'choose an operating scenario from the four available baseline models.',
            'set your starting month and financial year (changing this resets the scenario to a clean baseline).',
            'select which weekdays your business operates.',
            'review the public holidays calendar and toggle or add custom operational holidays.',
          ],
        };
      case 2:
        return {
          title: 'revenue calculator assistance',
          body: 'forecast monthly turnover using daily operating revenue multiplied by productive days worked, compounded with monthly rate adjustments.',
          bullets: [
            'enter base daily revenue and starting gross profit margin %.',
            'dial monthly percentage rate changes to capture seasonality, marketing ramps, or scaling.',
            'review annual turnover and gross profit in the results tab.',
          ],
        };
      case 3:
        return {
          title: 'employment assistance',
          body: 'structure your team headcount and payroll costs across the operating period.',
          bullets: [
            'set annual salary review month and rate percentage.',
            'add positions with monthly base remuneration and headcount counts.',
            'schedule hiring start months to reflect phased team growth.',
          ],
        };
      case 4:
        return {
          title: 'operating expenses assistance',
          body: 'budget and track overhead expenses across the standard 27 operating expense accounts.',
          bullets: [
            'set the annual inflationary cost adjustment month and percentage.',
            'specify monthly spend and inception month for each active opex line item.',
            'monitor annual overhead run-rate and expense timing.',
          ],
        };
      case 5:
        return {
          title: 'fixed assets assistance',
          body: 'schedule capital acquisitions and compute straight-line asset depreciation.',
          bullets: [
            'select standard asset categories with regulated depreciation schedules.',
            'enter unit purchase costs, quantities, and acquisition months.',
            'track original cost, accumulated depreciation, and balance sheet carrying value.',
          ],
        };
      case 6:
        return {
          title: 'funding calculator assistance',
          body: 'model working capital cycles and cash buffers to ensure liquidity.',
          bullets: [
            'set working capital turnover days for inventory (dio), receivables (dso), and payables (dpo).',
            'configure essential liquidity buffers including bank deposits, cash floats, and petty cash.',
            'analyze monthly working capital requirements and liquidity strain.',
          ],
        };
      case 7:
      default:
        return {
          title: 'reports assistance',
          body: 'review your integrated 12-month financial position and export executive summaries.',
          bullets: [
            'inspect the executive income statement and balance sheet.',
            'analyze the monthly and annual cash flow projections.',
            'review the full schedule of expenses.',
            'download your complete financial scenario in printable pdf format.',
          ],
        };
    }
  }, [activeStep]);

  // Handler for adding staff
  const handleSaveStaff = () => {
    if (!newStaffTitle.trim()) return;
    if (editingStaffId) {
      updateCurrent({
        staff: current.staff.map((s) =>
          s.id === editingStaffId
            ? { ...s, title: newStaffTitle, startMonth: newStaffStartMonth, baseRate: newStaffBaseRate, number: newStaffCount }
            : s
        ),
      });
      setEditingStaffId(null);
    } else {
      const newItem: BizzCalcStaffItem = {
        id: `s-${Date.now()}`,
        title: newStaffTitle,
        startMonth: newStaffStartMonth,
        baseRate: newStaffBaseRate,
        number: newStaffCount,
      };
      updateCurrent({ staff: [...current.staff, newItem] });
    }
    setNewStaffTitle('');
    setNewStaffStartMonth(1);
    setNewStaffBaseRate(10000);
    setNewStaffCount(1);
  };

  // Handler for adding asset
  const handleSaveAsset = () => {
    if (!newAssetDesc.trim()) return;
    if (editingAssetId) {
      updateCurrent({
        assets: current.assets.map((a) =>
          a.id === editingAssetId
            ? { ...a, description: newAssetDesc, category: newAssetCat, purchaseMonth: newAssetMonth, qty: newAssetQty, unitCost: newAssetUnitCost }
            : a
        ),
      });
      setEditingAssetId(null);
    } else {
      const newItem: BizzCalcAssetItem = {
        id: `a-${Date.now()}`,
        description: newAssetDesc,
        category: newAssetCat,
        purchaseMonth: newAssetMonth,
        qty: newAssetQty,
        unitCost: newAssetUnitCost,
      };
      updateCurrent({ assets: [...current.assets, newItem] });
    }
    setNewAssetDesc('office equipment');
    setNewAssetCat(STANDARD_ASSET_CATEGORIES[0].name);
    setNewAssetMonth(1);
    setNewAssetQty(1);
    setNewAssetUnitCost(50000);
  };

  // Handler for PDF download
  const handleDownloadPdf = () => {
    generateBizzCalcPdf({
      businessName: reportBusinessName,
      scenario: activeScenario,
      startDate: current.startDate,
      annualRevenue,
      annualGrossProfit,
      annualEmployment,
      annualOpex,
      fixedAssetsMetrics,
      fundingMetrics,
      reportMetrics,
      opexItemTotals: opexMonthly.itemTotals,
      standardOpexNames: STANDARD_OPEX_NAMES,
    });
  };

  // Current step metadata
  const currentStepDef = STEPS.find((s) => s.id === activeStep) || STEPS[0];

  return (
    <div
      className={`w-full h-full flex flex-col font-mono text-slate-800 transition-colors select-none overflow-hidden ${
        isDark ? 'bg-[#0A0D14] text-[#E2E8F0]' : 'bg-[#FAF8F5]'
      }`}
    >
      {/* Outer wrapper: Centered mobile screen container to maximize mobile device experience */}
      <div
        className={`w-full mx-auto flex flex-col h-full transition-all overflow-hidden ${
          isPhoneFrame ? 'max-w-md my-auto h-[96vh] rounded-3xl border border-[#D8CEBC] dark:border-[#252E4A] shadow-2xl' : 'max-w-xl'
        } ${isDark ? 'bg-[#101626]' : 'bg-[#FAF8F5]'}`}
      >
        {/* ===================================================================== */}
        {/* 1. TOP HEADER: LOGO, LOWERCASE STEP NAME, SCENARIO SUBTITLE, X LOGOUT  */}
        {/* ===================================================================== */}
        <header
          className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
          }`}
        >
          {/* Left: BizzBean Logo */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center shadow-xs bg-white border border-[#D8CEBC] dark:border-[#222F4C]">
              <img
                src="/bizzbean-favicon.jpg"
                alt="bizzbean"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.triedPng) {
                    target.dataset.triedPng = 'true';
                    target.src = '/bizzbean-favicon.png';
                  }
                }}
              />
            </div>
            <button
              onClick={() => setIsPhoneFrame(!isPhoneFrame)}
              className="hidden sm:inline-flex text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded"
              title="Toggle mobile device frame"
            >
              {isPhoneFrame ? <Maximize2 className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Center: Lowercase Step Name & Active Scenario Subtitle */}
          <div className="text-center flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <img
                src={encodeURI(currentStepDef.icon)}
                alt={currentStepDef.name}
                className="w-4 h-4 sm:w-4.5 sm:h-4.5 object-contain mix-blend-multiply dark:bg-white dark:rounded dark:p-0.5"
              />
              <h1 className="text-sm font-normal lowercase tracking-tight text-slate-900 dark:text-white">
                {currentStepDef.name}
              </h1>
            </div>
            <div className="text-[11px] font-normal text-slate-500 lowercase flex items-center justify-center gap-1">
              <span>scenario:</span>
              <span className="text-[#2E5E88] dark:text-[#5584B4] font-medium">{activeScenario}</span>
            </div>
          </div>

          {/* Right: Actions (PDF Download & X Logout) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="p-1.5 rounded-xl text-slate-400 hover:text-[#2E5E88] dark:hover:text-[#5584B4] hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              title="download reports in pdf (a4)"
              aria-label="download pdf"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              title="logout / exit bizzcalc"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* ===================================================================== */}
        {/* 2. SUBHEADER: HELP ICON & FUNCTION TABS (ASSUMPTIONS, DATA ENTRY, RESULTS) */}
        {/* ===================================================================== */}
        <div
          className={`px-3 py-1.5 border-b flex items-center gap-1.5 shrink-0 ${
            isDark ? 'bg-[#141A2E] border-[#222F4C]' : 'bg-[#F2EDE4] border-[#D8CEBC]'
          }`}
        >
          {/* Help icon button (replaces assistance text button to free mobile width for assumptions) */}
          <button
            type="button"
            onClick={() => setShowAssistanceModal(true)}
            title="assistance / guidance"
            aria-label="assistance"
            className={`h-7.5 w-7.5 sm:h-8 sm:w-8 shrink-0 rounded-lg flex items-center justify-center border transition-all p-1 ${
              showAssistanceModal
                ? 'bg-[#2E5E88] border-[#2E5E88] shadow-2xs ring-1 ring-[#2E5E88]'
                : isDark
                ? 'bg-[#101626] border-[#222F4C] hover:border-slate-500'
                : 'bg-white border-[#D8CEBC] hover:border-[#2E5E88]/60 shadow-2xs'
            }`}
          >
            <img
              src="/help.jpg"
              alt="help"
              className="w-full h-full object-contain mix-blend-multiply dark:bg-white dark:rounded-xs dark:p-0.5"
            />
          </button>

          {/* Three main function tabs: assumptions, data entry, results */}
          <div className="grid grid-cols-3 gap-1 flex-1 min-w-0">
            {[
              { id: 'assumptions', label: 'assumptions' },
              { id: 'data entry', label: 'data entry' },
              { id: 'results', label: 'results' },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-1.5 px-1.5 sm:px-2 rounded-lg text-xs font-normal text-center transition-all lowercase whitespace-nowrap overflow-hidden text-ellipsis border ${
                    isSelected
                      ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs font-medium'
                      : isDark
                      ? 'bg-transparent text-slate-400 hover:text-white border-transparent'
                      : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 3. STEP CONTENT BODY                                                  */}
        {/* ===================================================================== */}
        <main className="flex-grow p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* ================================================================= */}
          {/* STEP 1: BUSINESS DETAILS                                          */}
          {/* ================================================================= */}
          {activeStep === 1 && (
            <div className="space-y-4">
              {/* Assumptions Tab */}
              {activeTab === 'assumptions' && (
                <div className={`p-4 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                  <div className="text-xs font-normal text-slate-500 lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                    business assumptions & operating calendar
                  </div>

                  {/* Business Name (cannot be changed once chosen) */}
                  <div className="space-y-1">
                    <label className="text-xs font-normal text-slate-500 lowercase block">
                      business name (cannot be changed once chosen):
                    </label>
                    <input
                      type="text"
                      value={current.businessName}
                      onChange={(e) => updateCurrent({ businessName: e.target.value })}
                      className={`w-full p-2.5 rounded-xl border text-xs font-normal ${
                        isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                      }`}
                    />
                  </div>

                  {/* Start Date & Scenario Dropdown */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-500 lowercase block">start date:</label>
                        <label className="text-[10px] text-slate-400 flex items-center gap-1 cursor-pointer select-none" title="sync start date across all scenarios">
                          <input
                            type="checkbox"
                            checked={syncStartDateAcrossScenarios}
                            onChange={(e) => setSyncStartDateAcrossScenarios(e.target.checked)}
                            className="rounded text-[#2E5E88] focus:ring-0 h-3 w-3"
                          />
                          <span>sync scenarios</span>
                        </label>
                      </div>
                      <input
                        type="month"
                        value={current.startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className={`w-full p-2 rounded-xl border text-xs font-normal ${
                          isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                        }`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 lowercase block">scenario:</label>
                      <select
                        value={activeScenario}
                        onChange={(e) => setActiveScenario(e.target.value as ScenarioId)}
                        className={`w-full p-2 rounded-xl border text-xs font-normal lowercase ${
                          isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                        }`}
                      >
                        {SCENARIOS.map((sc) => (
                          <option key={sc} value={sc} className="lowercase">
                            {sc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Select Working Days */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <label className="text-xs font-normal text-slate-500 lowercase block">
                      select working days:
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 text-xs">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                        const isChecked = !!current.workingDays[day];
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() =>
                              updateCurrent({
                                workingDays: {
                                  ...current.workingDays,
                                  [day]: !isChecked,
                                },
                              })
                            }
                            className={`p-2 rounded-xl text-center text-[11px] font-normal lowercase transition-all border ${
                              isChecked
                                ? 'bg-[#2E5E88] text-white border-[#2E5E88]'
                                : isDark
                                ? 'bg-[#141A2E] text-slate-400 border-[#252E4A]'
                                : 'bg-[#FAF8F5] text-slate-600 border-[#D8CEBC]'
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Deduct Holidays Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-slate-600 dark:text-slate-300 lowercase">deduct public holidays:</span>
                    <button
                      type="button"
                      onClick={() => updateCurrent({ deductHolidays: !current.deductHolidays })}
                      className={`px-3 py-1 rounded-full text-xs font-normal lowercase transition-colors border ${
                        current.deductHolidays
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-transparent'
                      }`}
                    >
                      {current.deductHolidays ? 'enabled' : 'disabled'}
                    </button>
                  </div>
                </div>
              )}

              {/* Data Entry Tab: Holidays Listing */}
              {activeTab === 'data entry' && (
                <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-normal text-slate-900 dark:text-white lowercase">
                      display holidays
                    </span>
                    <span className="text-[11px] text-slate-400 lowercase">
                      {current.holidays.length} holidays scheduled
                    </span>
                  </div>

                  {/* Add holiday mini-form */}
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="holiday name"
                      value={newHolidayName}
                      onChange={(e) => setNewHolidayName(e.target.value)}
                      className={`flex-1 p-2 rounded-xl border text-xs font-normal lowercase ${
                        isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                      }`}
                    />
                    <input
                      type="date"
                      value={newHolidayDate}
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      className={`p-2 rounded-xl border text-xs font-normal ${
                        isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newHolidayName && newHolidayDate) {
                          updateCurrent({
                            holidays: [
                              ...current.holidays,
                              { id: `h-${Date.now()}`, name: newHolidayName, date: newHolidayDate },
                            ],
                          });
                          setNewHolidayName('');
                          setNewHolidayDate('');
                        }
                      }}
                      className="p-2 rounded-xl bg-[#2E5E88] text-white text-xs lowercase shadow-2xs"
                    >
                      + add
                    </button>
                  </div>

                  {/* Holidays list */}
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pt-2">
                    {current.holidays.map((h, idx) => (
                      <div
                        key={h.id || idx}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs lowercase"
                      >
                        <div>
                          <div className="text-slate-800 dark:text-slate-200">{h.name}</div>
                          <div className="text-[10px] text-slate-400">{h.date}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateCurrent({
                              holidays: current.holidays.filter((_, i) => i !== idx),
                            })
                          }
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results Tab: Working Calendar Metrics & Days Worked Bar Chart */}
              {activeTab === 'results' && (
                <div className="space-y-4">
                  {/* Summary Card matching PDF Page 3 */}
                  <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                    <div className="flex justify-between items-center text-xs lowercase text-slate-500">
                      <span>calendar days</span>
                      <span className="font-normal text-slate-800 dark:text-slate-200">{totalCalendarDays}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs lowercase text-slate-500">
                      <span>days not worked</span>
                      <span className="font-normal text-slate-800 dark:text-slate-200">{totalDaysNotWorked}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs lowercase text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span>days worked</span>
                      <span className="font-medium text-[#2E5E88] dark:text-[#5584B4]">{totalDaysWorked}</span>
                    </div>
                  </div>

                  {/* Bar Chart: Days Worked by Month (matching PDF page 3) */}
                  <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                    <div className="text-center text-xs font-normal text-slate-500 lowercase">
                      days worked
                    </div>

                    <div className="h-48 flex items-end justify-between gap-1 pt-4 px-2">
                      {(() => {
                        const maxDays = Math.max(...monthlyCalendar.map((x) => x.netDaysWorked), 25);
                        return monthlyCalendar.map((m) => {
                          const heightPct = Math.round((m.netDaysWorked / maxDays) * 62);
                          return (
                            <div key={m.monthIndex} className="flex-1 flex flex-col items-center justify-end h-full min-w-0" title={`${m.monthLabel}: ${m.netDaysWorked} days worked`}>
                              <div className="h-7 w-full flex items-center justify-center shrink-0 mb-1">
                                <span
                                  className="text-[8px] sm:text-[9px] text-slate-400 font-mono select-none whitespace-nowrap leading-none inline-block origin-center transform"
                                  style={{ transform: 'rotate(270deg)' }}
                                >
                                  {m.netDaysWorked}d
                                </span>
                              </div>
                              <div
                                style={{ height: `${Math.max(6, heightPct)}%` }}
                                className="w-full max-w-[18px] rounded-t bg-[#D97757] transition-all hover:opacity-85 shrink-0"
                              />
                              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium lowercase mt-1.5 shrink-0">{m.monthShort}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 2: REVENUE CALCULATOR                                        */}
          {/* ================================================================= */}
          {activeStep === 2 && (
            <div className="space-y-4">
              {/* Assumptions Tab */}
              {activeTab === 'assumptions' && (
                <div className={`p-4 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                  <div className="text-xs font-normal text-slate-500 lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                    revenue model assumptions
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-500 lowercase">start month:</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={current.revStartMonth}
                        onChange={(e) => updateCurrent({ revStartMonth: Number(e.target.value) })}
                        className={`w-28 p-2 rounded-xl border text-right font-normal ${
                          isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-slate-500 lowercase">base daily revenue:</label>
                      <input
                        type="number"
                        value={current.baseDailyRevenue}
                        onChange={(e) => updateCurrent({ baseDailyRevenue: Number(e.target.value) })}
                        className={`w-28 p-2 rounded-xl border text-right font-normal ${
                          isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-slate-500 lowercase">gross profit margin:</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          value={current.grossProfitMarginPct}
                          onChange={(e) => updateCurrent({ grossProfitMarginPct: Number(e.target.value) })}
                          className={`w-24 p-2 rounded-xl border text-right font-normal ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                          }`}
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Entry Tab: 12-month change % and revenue grid */}
              {activeTab === 'data entry' && (
                <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                  <div className="grid grid-cols-12 gap-2 text-[11px] text-slate-400 lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                    <div className="col-span-2 text-center">mth</div>
                    <div className="col-span-4 text-center">change %</div>
                    <div className="col-span-6 text-right">revenue</div>
                  </div>

                  <div className="space-y-1.5 max-h-96 overflow-y-auto">
                    {revenueMonthly.map((m, idx) => (
                      <div
                        key={m.month}
                        className="grid grid-cols-12 gap-2 items-center text-xs lowercase py-1"
                      >
                        <div className="col-span-2 text-center text-slate-500">{m.month}</div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            step="0.5"
                            value={current.monthlyRevenueAdjustmentsPct[idx] ?? 0}
                            onChange={(e) => {
                              const arr = [...current.monthlyRevenueAdjustmentsPct];
                              arr[idx] = Number(e.target.value);
                              updateCurrent({ monthlyRevenueAdjustmentsPct: arr });
                            }}
                            className={`w-full p-1.5 rounded-lg border text-center font-normal ${
                              isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                            }`}
                          />
                        </div>
                        <div className="col-span-6 text-right text-slate-800 dark:text-slate-200 font-normal">
                          {m.revenue.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results Tab: Annual Summaries & Filterable Chart */}
              {activeTab === 'results' && (
                <div className="space-y-4">
                  {/* Summary Card matching PDF Page 4 */}
                  <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                    <div className="flex justify-between items-center text-xs lowercase text-slate-500">
                      <span>annual revenue</span>
                      <span className="font-normal text-slate-800 dark:text-slate-200">{annualRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs lowercase text-slate-500">
                      <span>annual gross profit</span>
                      <span className="font-normal text-slate-800 dark:text-slate-200">{annualGrossProfit.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Filter toggle and bar chart */}
                  <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => setRevenueFilter(revenueFilter === 'revenue' ? 'gross profit' : 'revenue')}
                        className="px-3 py-1.5 rounded-xl bg-[#2E5E88] text-white text-xs lowercase font-normal shadow-2xs"
                      >
                        filter: {revenueFilter}
                      </button>
                    </div>

                    <div className="h-48 flex items-end justify-between gap-1 pt-4 px-2">
                      {(() => {
                        const maxVal = Math.max(...revenueMonthly.map((r) => (revenueFilter === 'revenue' ? r.revenue : r.grossProfit)), 1);
                        return revenueMonthly.map((m) => {
                          const val = revenueFilter === 'revenue' ? m.revenue : m.grossProfit;
                          const heightPct = Math.round((val / maxVal) * 62);

                          return (
                            <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                              <div className="h-7 w-full flex items-center justify-center shrink-0 mb-1">
                                <span
                                  className="text-[8px] sm:text-[9px] text-slate-400 font-normal select-none whitespace-nowrap leading-none inline-block origin-center transform"
                                  style={{ transform: 'rotate(270deg)' }}
                                >
                                  {Math.round(val / 1000)}k
                                </span>
                              </div>
                              <div
                                style={{ height: `${Math.max(4, heightPct)}%` }}
                                className="w-full max-w-[18px] rounded-t bg-[#D97757] transition-all hover:opacity-85 shrink-0"
                              />
                              <span className="text-[10px] text-slate-500 mt-1.5 shrink-0">{m.month}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 3: EMPLOYMENT                                                */}
          {/* ================================================================= */}
          {activeStep === 3 && (
            <div className="space-y-4">
              {/* Assumptions Tab */}
              {activeTab === 'assumptions' && (
                <div className={`p-4 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                  <div className="text-xs font-normal text-slate-500 lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                    remuneration review parameters
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-500 lowercase">review month (2-12):</label>
                      <input
                        type="number"
                        min="2"
                        max="12"
                        value={current.empReviewMonth}
                        onChange={(e) => updateCurrent({ empReviewMonth: Number(e.target.value) })}
                        className={`w-28 p-2 rounded-xl border text-right font-normal ${
                          isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-slate-500 lowercase">review rate %:</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          value={current.empReviewRatePct}
                          onChange={(e) => updateCurrent({ empReviewRatePct: Number(e.target.value) })}
                          className={`w-24 p-2 rounded-xl border text-right font-normal ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                          }`}
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Entry Tab: Staff Cards matching PDF Page 5 */}
              {activeTab === 'data entry' && (
                <div className="space-y-4">
                  {/* Add Position Card */}
                  <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                    <div className="text-xs font-normal text-slate-500 lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                      {editingStaffId ? 'edit position' : 'add position'}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="col-span-2">
                        <label className="text-slate-500 lowercase block mb-0.5">title:</label>
                        <input
                          type="text"
                          placeholder="e.g. operations director"
                          value={newStaffTitle}
                          onChange={(e) => setNewStaffTitle(e.target.value)}
                          className={`w-full p-2 rounded-xl border text-xs font-normal lowercase ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-slate-500 lowercase block mb-0.5">start mth:</label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={newStaffStartMonth}
                          onChange={(e) => setNewStaffStartMonth(Number(e.target.value))}
                          className={`w-full p-2 rounded-xl border text-xs font-normal ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-slate-500 lowercase block mb-0.5">number:</label>
                        <input
                          type="number"
                          min="1"
                          value={newStaffCount}
                          onChange={(e) => setNewStaffCount(Number(e.target.value))}
                          className={`w-full p-2 rounded-xl border text-xs font-normal ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                          }`}
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-slate-500 lowercase block mb-0.5">base rate (monthly):</label>
                        <input
                          type="number"
                          value={newStaffBaseRate}
                          onChange={(e) => setNewStaffBaseRate(Number(e.target.value))}
                          className={`w-full p-2 rounded-xl border text-xs font-normal ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleSaveStaff}
                        className="px-4 py-1.5 rounded-xl bg-[#2E5E88] text-white text-xs lowercase font-normal shadow-2xs"
                      >
                        + add
                      </button>
                    </div>
                  </div>

                  {/* Existing Staff Cards */}
                  <div className="space-y-3">
                    {current.staff.map((st) => (
                      <div
                        key={st.id}
                        className={`p-4 rounded-2xl border space-y-2 relative ${
                          isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs font-normal text-slate-500 lowercase">title</div>
                            <div className="text-sm font-normal text-slate-900 dark:text-white lowercase">{st.title}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setNewStaffTitle(st.title);
                                setNewStaffStartMonth(st.startMonth);
                                setNewStaffBaseRate(st.baseRate);
                                setNewStaffCount(st.number);
                                setEditingStaffId(st.id);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateCurrent({
                                  staff: current.staff.filter((s) => s.id !== st.id),
                                })
                              }
                              className="p-1 text-slate-400 hover:text-rose-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-slate-400 lowercase block text-[10px]">start mth</span>
                            <span className="text-slate-800 dark:text-slate-200">{st.startMonth}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 lowercase block text-[10px]">base rate</span>
                            <span className="text-slate-800 dark:text-slate-200">{st.baseRate.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 lowercase block text-[10px]">number</span>
                            <span className="text-slate-800 dark:text-slate-200">{st.number}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results Tab: Annual Employment & Monthly Bar Chart */}
              {activeTab === 'results' && (
                <div className="space-y-4">
                  {/* Summary Card matching PDF Page 5 */}
                  <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                    <div className="flex justify-between items-center text-xs lowercase text-slate-500">
                      <span>annual employment</span>
                      <span className="font-normal text-slate-800 dark:text-slate-200">{annualEmployment.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Monthly Bar Chart */}
                  <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                    <div className="text-center text-xs font-normal text-slate-500 lowercase">
                      monthly employment expenses
                    </div>

                    <div className="h-48 flex items-end justify-between gap-1 pt-4 px-2">
                      {(() => {
                        const maxVal = Math.max(...employmentMonthly, 1);
                        return employmentMonthly.map((val, idx) => {
                          const heightPct = Math.round((val / maxVal) * 62);
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                              <div className="h-7 w-full flex items-center justify-center shrink-0 mb-1">
                                <span
                                  className="text-[8px] sm:text-[9px] text-slate-400 font-normal select-none whitespace-nowrap leading-none inline-block origin-center transform"
                                  style={{ transform: 'rotate(270deg)' }}
                                >
                                  {Math.round(val / 1000)}k
                                </span>
                              </div>
                              <div
                                style={{ height: `${Math.max(4, heightPct)}%` }}
                                className="w-full max-w-[18px] rounded-t bg-[#D97757] transition-all hover:opacity-85 shrink-0"
                              />
                              <span className="text-[10px] text-slate-500 mt-1.5 shrink-0">{idx + 1}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 4: OPERATING EXPENSES                                        */}
          {/* ================================================================= */}
          {activeStep === 4 && (
            <div className="space-y-4">
              {/* Assumptions Tab */}
              {activeTab === 'assumptions' && (
                <div className={`p-4 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                  <div className="text-xs font-normal text-slate-500 lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                    inflation & review parameters
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-500 lowercase">review month (2-12):</label>
                      <input
                        type="number"
                        min="2"
                        max="12"
                        value={current.opexReviewMonth}
                        onChange={(e) => updateCurrent({ opexReviewMonth: Number(e.target.value) })}
                        className={`w-28 p-2 rounded-xl border text-right font-normal ${
                          isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-slate-500 lowercase">review rate %:</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          value={current.opexReviewRatePct}
                          onChange={(e) => updateCurrent({ opexReviewRatePct: Number(e.target.value) })}
                          className={`w-24 p-2 rounded-xl border text-right font-normal ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                          }`}
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Entry Tab: 27 Standard OPEX Line Items matching PDF Page 6 */}
              {activeTab === 'data entry' && (
                <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                    <span>start mth</span>
                    <span>standard expense item / monthly rate</span>
                  </div>

                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
                    {STANDARD_OPEX_NAMES.map((name) => {
                      const item = current.opexValues[name] || { startMonth: 1, monthlyRate: 0 };
                      return (
                        <div
                          key={name}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs lowercase"
                        >
                          <div className="w-16 shrink-0">
                            <label className="text-[9px] text-slate-400 lowercase block">start</label>
                            <input
                              type="number"
                              min="1"
                              max="12"
                              value={item.startMonth}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                updateCurrent({
                                  opexValues: {
                                    ...current.opexValues,
                                    [name]: { ...item, startMonth: val },
                                  },
                                });
                              }}
                              className={`w-full p-1 rounded-lg border text-center font-normal ${
                                isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                              }`}
                            />
                          </div>

                          <div className="flex-1">
                            <div className="text-slate-800 dark:text-slate-200 text-xs truncate">{name}</div>
                          </div>

                          <div className="w-28 shrink-0">
                            <label className="text-[9px] text-slate-400 lowercase block text-right">monthly rate</label>
                            <input
                              type="number"
                              value={item.monthlyRate}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                updateCurrent({
                                  opexValues: {
                                    ...current.opexValues,
                                    [name]: { ...item, monthlyRate: val },
                                  },
                                });
                              }}
                              className={`w-full p-1 rounded-lg border text-right font-normal ${
                                isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Results Tab: Annual Expenses & Monthly Bar Chart */}
              {activeTab === 'results' && (
                <div className="space-y-4">
                  {/* Summary Card matching PDF Page 6 */}
                  <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                    <div className="flex justify-between items-center text-xs lowercase text-slate-500">
                      <span>annual expenses</span>
                      <span className="font-normal text-slate-800 dark:text-slate-200">{annualOpex.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Monthly Bar Chart */}
                  <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                    <div className="text-center text-xs font-normal text-slate-500 lowercase">
                      monthly operating expenses
                    </div>

                    <div className="h-48 flex items-end justify-between gap-1 pt-4 px-2">
                      {(() => {
                        const maxVal = Math.max(...opexMonthly.monthlyTotals, 1);
                        return opexMonthly.monthlyTotals.map((val, idx) => {
                          const heightPct = Math.round((val / maxVal) * 62);
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                              <div className="h-7 w-full flex items-center justify-center shrink-0 mb-1">
                                <span
                                  className="text-[8px] sm:text-[9px] text-slate-400 font-normal select-none whitespace-nowrap leading-none inline-block origin-center transform"
                                  style={{ transform: 'rotate(270deg)' }}
                                >
                                  {Math.round(val / 1000)}k
                                </span>
                              </div>
                              <div
                                style={{ height: `${Math.max(4, heightPct)}%` }}
                                className="w-full max-w-[18px] rounded-t bg-[#D97757] transition-all hover:opacity-85 shrink-0"
                              />
                              <span className="text-[10px] text-slate-500 mt-1.5 shrink-0">{idx + 1}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 5: FIXED ASSETS                                              */}
          {/* ================================================================= */}
          {activeStep === 5 && (
            <div className="space-y-4">
              {/* Assumptions Tab: 10 Standard Asset Categories matching PDF Page 7 */}
              {activeTab === 'assumptions' && (
                <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                  <div className="text-xs font-normal text-slate-500 lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                    standard asset categories & depreciation rates
                  </div>

                  <div className="space-y-2 text-xs">
                    {STANDARD_ASSET_CATEGORIES.map((cat) => (
                      <div key={cat.name} className="flex justify-between items-center lowercase py-0.5">
                        <span className="text-slate-700 dark:text-slate-300">{cat.name}</span>
                        <span className="text-[#2E5E88] dark:text-[#5584B4] font-normal">{cat.depreciationRate.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Entry Tab: Add/Edit Assets Cards matching PDF Page 7 */}
              {activeTab === 'data entry' && (
                <div className="space-y-4">
                  {/* Add Asset Card */}
                  <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                    <div className="text-xs font-normal text-slate-500 lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                      {editingAssetId ? 'edit capital asset' : 'add capital asset'}
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="text-slate-500 lowercase block mb-0.5">fixed asset description:</label>
                        <input
                          type="text"
                          value={newAssetDesc}
                          onChange={(e) => setNewAssetDesc(e.target.value)}
                          className={`w-full p-2 rounded-xl border text-xs font-normal lowercase ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-500 lowercase block mb-0.5">category:</label>
                          <select
                            value={newAssetCat}
                            onChange={(e) => setNewAssetCat(e.target.value)}
                            className={`w-full p-2 rounded-xl border text-xs font-normal lowercase ${
                              isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                            }`}
                          >
                            {STANDARD_ASSET_CATEGORIES.map((c) => (
                              <option key={c.name} value={c.name} className="lowercase">
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-500 lowercase block mb-0.5">purchase mth:</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={newAssetMonth}
                            onChange={(e) => setNewAssetMonth(Number(e.target.value))}
                            className={`w-full p-2 rounded-xl border text-xs font-normal ${
                              isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-slate-500 lowercase block mb-0.5">qty:</label>
                          <input
                            type="number"
                            min="1"
                            value={newAssetQty}
                            onChange={(e) => setNewAssetQty(Number(e.target.value))}
                            className={`w-full p-2 rounded-xl border text-xs font-normal ${
                              isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="text-slate-500 lowercase block mb-0.5">unit cost:</label>
                          <input
                            type="number"
                            value={newAssetUnitCost}
                            onChange={(e) => setNewAssetUnitCost(Number(e.target.value))}
                            className={`w-full p-2 rounded-xl border text-xs font-normal ${
                              isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="text-slate-500 lowercase block mb-0.5">purchase value:</label>
                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                            {(newAssetQty * newAssetUnitCost).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleSaveAsset}
                        className="px-4 py-1.5 rounded-xl bg-[#2E5E88] text-white text-xs lowercase font-normal shadow-2xs"
                      >
                        + add
                      </button>
                    </div>
                  </div>

                  {/* Existing Asset Cards matching PDF */}
                  <div className="space-y-3">
                    {current.assets.map((ast) => (
                      <div
                        key={ast.id}
                        className={`p-4 rounded-2xl border space-y-2 ${
                          isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[10px] text-slate-400 lowercase">fixed asset description</div>
                            <div className="text-sm font-normal text-slate-900 dark:text-white lowercase">{ast.description}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setNewAssetDesc(ast.description);
                                setNewAssetCat(ast.category);
                                setNewAssetMonth(ast.purchaseMonth);
                                setNewAssetQty(ast.qty);
                                setNewAssetUnitCost(ast.unitCost);
                                setEditingAssetId(ast.id);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateCurrent({
                                  assets: current.assets.filter((a) => a.id !== ast.id),
                                })
                              }
                              className="p-1 text-slate-400 hover:text-rose-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-slate-400 lowercase block text-[10px]">category</span>
                            <span className="text-slate-800 dark:text-slate-200 truncate block">{ast.category}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 lowercase block text-[10px]">purchase mth</span>
                            <span className="text-slate-800 dark:text-slate-200">{ast.purchaseMonth}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 lowercase block text-[10px]">qty / unit</span>
                            <span className="text-slate-800 dark:text-slate-200">{ast.qty} @ {ast.unitCost.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 lowercase block text-[10px]">purchase value</span>
                            <span className="text-slate-800 dark:text-slate-200">{(ast.qty * ast.unitCost).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results Tab: Original cost, Depreciation, Balance sheet, & Chart */}
              {activeTab === 'results' && (
                <div className="space-y-4">
                  {/* Summary Card matching PDF Page 7 */}
                  <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                    <div className="flex justify-between items-center text-xs lowercase text-slate-500">
                      <span>original cost</span>
                      <span className="font-normal text-slate-800 dark:text-slate-200">{fixedAssetsMetrics.totalOriginalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs lowercase text-slate-500">
                      <span>depreciation</span>
                      <span className="font-normal text-slate-800 dark:text-slate-200">{fixedAssetsMetrics.totalDepreciation.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs lowercase text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span>balance sheet</span>
                      <span className="font-medium text-[#2E5E88] dark:text-[#5584B4]">{fixedAssetsMetrics.balanceSheetValue.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Monthly Depreciation Bar Chart */}
                  <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                    <div className="text-center text-xs font-normal text-slate-500 lowercase">
                      depreciation
                    </div>

                    <div className="h-48 flex items-end justify-between gap-1 pt-4 px-2">
                      {(() => {
                        const maxVal = Math.max(...fixedAssetsMetrics.monthlyDepreciation, 1);
                        return fixedAssetsMetrics.monthlyDepreciation.map((val, idx) => {
                          const heightPct = Math.round((val / maxVal) * 62);
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                              <div className="h-7 w-full flex items-center justify-center shrink-0 mb-1">
                                <span
                                  className="text-[8px] sm:text-[9px] text-slate-400 font-normal select-none whitespace-nowrap leading-none inline-block origin-center transform"
                                  style={{ transform: 'rotate(270deg)' }}
                                >
                                  {Math.round(val / 1000)}k
                                </span>
                              </div>
                              <div
                                style={{ height: `${Math.max(4, heightPct)}%` }}
                                className="w-full max-w-[18px] rounded-t bg-[#D97757] transition-all hover:opacity-85 shrink-0"
                              />
                              <span className="text-[10px] text-slate-500 mt-1.5 shrink-0">{idx + 1}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 6: FUNDING CALCULATOR                                        */}
          {/* ================================================================= */}
          {activeStep === 6 && (
            <div className="space-y-4">
              {/* Assumptions & Data Entry: Working Capital Days and Other Assets */}
              {(activeTab === 'assumptions' || activeTab === 'data entry') && (
                <div className="space-y-4">
                  {/* Working Capital Days Box matching PDF Page 8 */}
                  <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                    <div className="text-center text-xs font-normal text-slate-500 lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                      working capital days
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="text-slate-500 lowercase block mb-1 text-center">inventory</label>
                        <input
                          type="number"
                          value={current.inventoryDays}
                          onChange={(e) => updateCurrent({ inventoryDays: Number(e.target.value) })}
                          className={`w-full p-2 rounded-xl border text-center font-normal ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-slate-500 lowercase block mb-1 text-center">receivables</label>
                        <input
                          type="number"
                          value={current.receivablesDays}
                          onChange={(e) => updateCurrent({ receivablesDays: Number(e.target.value) })}
                          className={`w-full p-2 rounded-xl border text-center font-normal ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-slate-500 lowercase block mb-1 text-center">payables</label>
                        <input
                          type="number"
                          value={current.payablesDays}
                          onChange={(e) => updateCurrent({ payablesDays: Number(e.target.value) })}
                          className={`w-full p-2 rounded-xl border text-center font-normal ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Other Assets Base Data Box matching PDF Page 8 */}
                  <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                    <div className="text-center text-xs font-normal text-slate-500 lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                      other assets base data
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="text-slate-500 lowercase block mb-1 text-center">deposits</label>
                        <input
                          type="number"
                          value={current.deposits}
                          onChange={(e) => updateCurrent({ deposits: Number(e.target.value) })}
                          className={`w-full p-2 rounded-xl border text-center font-normal ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-slate-500 lowercase block mb-1 text-center">floats</label>
                        <input
                          type="number"
                          value={current.floats}
                          onChange={(e) => updateCurrent({ floats: Number(e.target.value) })}
                          className={`w-full p-2 rounded-xl border text-center font-normal ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-slate-500 lowercase block mb-1 text-center">petty cash</label>
                        <input
                          type="number"
                          value={current.pettyCash}
                          onChange={(e) => updateCurrent({ pettyCash: Number(e.target.value) })}
                          className={`w-full p-2 rounded-xl border text-center font-normal ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Tab: Working capital summaries & filterable chart */}
              {activeTab === 'results' && (
                <div className="space-y-4">
                  {/* Summary Card matching PDF Page 8 */}
                  <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                    <div className="flex justify-between items-center text-xs lowercase text-slate-500">
                      <span>inventory</span>
                      <span className="font-normal text-slate-800 dark:text-slate-200">{fundingMetrics.yearendInventory.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs lowercase text-slate-500">
                      <span>receivables</span>
                      <span className="font-normal text-slate-800 dark:text-slate-200">{fundingMetrics.yearendReceivables.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs lowercase text-slate-500">
                      <span>payables</span>
                      <span className="font-normal text-slate-800 dark:text-slate-200">{fundingMetrics.yearendPayables.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs lowercase text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span>other assets</span>
                      <span className="font-medium text-[#2E5E88] dark:text-[#5584B4]">{fundingMetrics.yearendOtherAssets.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Filterable Bar Chart */}
                  <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          const order: Array<'inventory' | 'receivables' | 'payables'> = ['inventory', 'receivables', 'payables'];
                          const nextIdx = (order.indexOf(fundingFilter) + 1) % order.length;
                          setFundingFilter(order[nextIdx]);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#2E5E88] text-white text-xs lowercase font-normal shadow-2xs"
                      >
                        filter: {fundingFilter}
                      </button>
                    </div>

                    <div className="h-48 flex items-end justify-between gap-1 pt-4 px-2">
                      {(() => {
                        const series =
                          fundingFilter === 'inventory'
                            ? fundingMetrics.monthlyInventory
                            : fundingFilter === 'receivables'
                            ? fundingMetrics.monthlyReceivables
                            : fundingMetrics.monthlyPayables;
                        const maxVal = Math.max(...series, 1);

                        return Array.from({ length: 12 }).map((_, idx) => {
                          const val = series[idx] || 0;
                          const heightPct = Math.round((val / maxVal) * 62);

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                              <div className="h-7 w-full flex items-center justify-center shrink-0 mb-1">
                                <span
                                  className="text-[8px] sm:text-[9px] text-slate-400 font-normal select-none whitespace-nowrap leading-none inline-block origin-center transform"
                                  style={{ transform: 'rotate(270deg)' }}
                                >
                                  {Math.round(val / 1000)}k
                                </span>
                              </div>
                              <div
                                style={{ height: `${Math.max(4, heightPct)}%` }}
                                className="w-full max-w-[18px] rounded-t bg-[#D97757] transition-all hover:opacity-85 shrink-0"
                              />
                              <span className="text-[10px] text-slate-500 mt-1.5 shrink-0">{idx + 1}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 7: REPORTS (MATCHING PDF PAGES 9 & 10)                        */}
          {/* ================================================================= */}
          {activeStep === 7 && (
            <div className="space-y-4">
              {/* Top Action: Download scenario in PDF */}
              <div className="flex justify-center pb-1">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-4 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#244b6d] text-white text-xs lowercase font-normal flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  title="download 4-page executive reports in a4 pdf format"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>download scenario in pdf (a4)</span>
                </button>
              </div>

              {/* CARD 1: INCOME STATEMENT */}
              <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                <div className="text-left text-xs font-normal text-slate-900 dark:text-white lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                  {reportBusinessName}: income statement
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>revenue</span>
                    <span className="font-normal text-slate-900 dark:text-white">{annualRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>cost of sales</span>
                    <span className="font-normal text-rose-500">-{(annualRevenue - annualGrossProfit).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-900 dark:text-white font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>gross profit</span>
                    <span>{annualGrossProfit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pt-1">
                    <span>employment expenses</span>
                    <span className="font-normal text-rose-500">-{annualEmployment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>operating expenses</span>
                    <span className="font-normal text-rose-500">-{annualOpex.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>depreciation expenses</span>
                    <span className="font-normal text-rose-500">-{fixedAssetsMetrics.totalDepreciation.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>total expenses</span>
                    <span className="font-normal text-rose-500">
                      -{(annualEmployment + annualOpex + fixedAssetsMetrics.totalDepreciation).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-900 dark:text-white font-medium pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>net operating profit</span>
                    <span className="text-[#2E5E88] dark:text-[#5584B4]">{reportMetrics.totalNop.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* CARD 2: BALANCE SHEET */}
              <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                <div className="text-left text-xs font-normal text-slate-900 dark:text-white lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                  {reportBusinessName}: balance sheet
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>fixed assets</span>
                    <span className="font-normal text-slate-900 dark:text-white">{fixedAssetsMetrics.balanceSheetValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>inventory</span>
                    <span className="font-normal text-slate-900 dark:text-white">{fundingMetrics.yearendInventory.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>accounts receivables</span>
                    <span className="font-normal text-slate-900 dark:text-white">{fundingMetrics.yearendReceivables.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>other assets</span>
                    <span className="font-normal text-slate-900 dark:text-white">{fundingMetrics.yearendOtherAssets.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-900 dark:text-white font-normal pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>current assets</span>
                    <span>
                      {(
                        fundingMetrics.yearendInventory +
                        fundingMetrics.yearendReceivables +
                        fundingMetrics.yearendOtherAssets
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-900 dark:text-white font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>total assets</span>
                    <span>
                      {(
                        fixedAssetsMetrics.balanceSheetValue +
                        fundingMetrics.yearendInventory +
                        fundingMetrics.yearendReceivables +
                        fundingMetrics.yearendOtherAssets
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pt-1">
                    <span>accounts payable</span>
                    <span className="font-normal text-rose-500">-{fundingMetrics.yearendPayables.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-900 dark:text-white font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>net operating assets</span>
                    <span className="text-[#2E5E88] dark:text-[#5584B4]">
                      {reportMetrics.yearendNetOperatingAssets.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 lowercase pt-2 border-t border-slate-200 dark:border-slate-800">
                    financed by:
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>retained earnings</span>
                    <span className={`font-normal ${reportMetrics.retainedEarnings < 0 ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                      {reportMetrics.retainedEarnings.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>bank account</span>
                    <span className={`font-normal ${reportMetrics.closingBankBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}>
                      {Math.round(reportMetrics.closingBankBalance).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-900 dark:text-white font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>capital employed</span>
                    <span className="text-[#2E5E88] dark:text-[#5584B4]">
                      {reportMetrics.capitalEmployed.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 3: CASHFLOW - MONTHLY TABLE */}
              <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                <div className="text-left text-xs font-normal text-slate-900 dark:text-white lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                  {reportBusinessName}: cashflow - monthly
                </div>

                <div className="grid grid-cols-12 gap-1 text-[10px] text-slate-400 lowercase pb-1 border-b border-slate-100 dark:border-slate-800">
                  <div className="col-span-2">mth</div>
                  <div className="col-span-3 text-right">nop</div>
                  <div className="col-span-3 text-right">applied</div>
                  <div className="col-span-4 text-right">bank balance</div>
                </div>

                <div className="space-y-1">
                  {reportMetrics.cashFlowMonths.map((c) => {
                    const roundedApplied = Math.round(c.applied);
                    return (
                      <div key={c.month} className="grid grid-cols-12 gap-1 text-xs lowercase py-0.5">
                        <div className="col-span-2 text-slate-500">{c.month}</div>
                        <div className="col-span-3 text-right text-slate-700 dark:text-slate-300">
                          {Math.round(c.nop).toLocaleString()}
                        </div>
                        <div
                          className={`col-span-3 text-right ${
                            roundedApplied < 0
                              ? 'text-rose-500'
                              : roundedApplied > 0
                              ? 'text-emerald-500'
                              : 'text-slate-400'
                          }`}
                        >
                          {roundedApplied === 0
                            ? '0'
                            : roundedApplied < 0
                            ? `-${Math.abs(roundedApplied).toLocaleString()}`
                            : roundedApplied.toLocaleString()}
                        </div>
                        <div className={`col-span-4 text-right font-normal ${c.bankBalance >= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {Math.round(c.bankBalance).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CARD 4: CASHFLOW - ANNUAL SUMMARY */}
              <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                <div className="text-left text-xs font-normal text-slate-900 dark:text-white lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                  {reportBusinessName}: cashflow - annual
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>opening bank balance</span>
                    <span className="font-normal text-slate-900 dark:text-white">0</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>net operating profit</span>
                    <span className="font-normal text-slate-900 dark:text-white">{reportMetrics.totalNop.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>application to fixed assets</span>
                    <span className="font-normal text-rose-500">
                      {fixedAssetsMetrics.totalOriginalCost === 0
                        ? '0'
                        : `-${Math.abs(fixedAssetsMetrics.totalOriginalCost).toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>depreciation add back</span>
                    <span className="font-normal text-emerald-500">+{fixedAssetsMetrics.totalDepreciation.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>application to working capital</span>
                    {(() => {
                      const wcVal =
                        fundingMetrics.yearendInventory +
                        fundingMetrics.yearendReceivables -
                        fundingMetrics.yearendPayables;
                      if (wcVal === 0) {
                        return <span className="font-normal text-slate-500">0</span>;
                      }
                      if (wcVal > 0) {
                        return <span className="font-normal text-rose-500">-{Math.abs(wcVal).toLocaleString()}</span>;
                      }
                      return <span className="font-normal text-emerald-500">+{Math.abs(wcVal).toLocaleString()}</span>;
                    })()}
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>total applications</span>
                    <span className="font-normal text-rose-500">
                      {reportMetrics.yearendNetOperatingAssets === 0
                        ? '0'
                        : `-${Math.abs(reportMetrics.yearendNetOperatingAssets).toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>cash flow</span>
                    <span className="font-normal">{Math.round(reportMetrics.annualNetCashFlow).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-900 dark:text-white font-medium pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>closing bank balance</span>
                    <span className="text-[#2E5E88] dark:text-[#5584B4]">{Math.round(reportMetrics.closingBankBalance).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* CARD 5: SCHEDULE OF EXPENSES */}
              <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                <div className="text-left text-xs font-normal text-slate-900 dark:text-white lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                  {reportBusinessName}: schedule of expenses
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>employment</span>
                    <span className="font-normal text-slate-900 dark:text-white">{annualEmployment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>depreciation</span>
                    <span className="font-normal text-slate-900 dark:text-white">{fixedAssetsMetrics.totalDepreciation.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>operating expenses</span>
                    <span className="font-normal text-slate-900 dark:text-white">{annualOpex.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-900 dark:text-white font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>total expenses</span>
                    <span className="text-[#2E5E88] dark:text-[#5584B4]">
                      {(annualEmployment + fixedAssetsMetrics.totalDepreciation + annualOpex).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 lowercase pt-2 border-t border-slate-200 dark:border-slate-800">
                    analysis of operating expenses:
                  </div>

                  <div className="space-y-1 max-h-48 overflow-y-auto pt-1">
                    {STANDARD_OPEX_NAMES.map((name) => {
                      const total = opexMonthly.itemTotals[name] || 0;
                      if (total === 0) return null;
                      return (
                        <div key={name} className="flex justify-between items-center text-slate-500 lowercase py-0.5 text-[11px]">
                          <span>{name}</span>
                          <span className="text-slate-700 dark:text-slate-300">{total.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* CARD 6: CASHFLOW CHART */}
              <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                <div className="text-left text-xs font-normal text-slate-900 dark:text-white lowercase pb-1 border-b border-slate-200 dark:border-slate-800">
                  {reportBusinessName}: cashflow chart
                </div>

                <div className="h-52 flex items-end justify-between gap-1 pt-4 px-2">
                  {(() => {
                    const maxAbs = Math.max(...reportMetrics.cashFlowMonths.map((x) => Math.abs(x.bankBalance)), 1000);
                    return reportMetrics.cashFlowMonths.map((c) => {
                      const balance = c.bankBalance;
                      const heightPct = Math.round((Math.abs(balance) / maxAbs) * 62);

                      return (
                        <div key={c.month} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                          <div className="h-7 w-full flex items-center justify-center shrink-0 mb-1">
                            <span
                              className="text-[8px] sm:text-[9px] text-slate-400 font-normal select-none whitespace-nowrap leading-none inline-block origin-center transform"
                              style={{ transform: 'rotate(270deg)' }}
                            >
                              {Math.round(balance / 1000)}k
                            </span>
                          </div>
                          <div
                            style={{ height: `${Math.max(4, heightPct)}%` }}
                            className={`w-full max-w-[16px] rounded-t transition-all shrink-0 ${
                              balance >= 0 ? 'bg-[#5584B4]' : 'bg-[#D97757]'
                            }`}
                          />
                          <span className="text-[10px] text-slate-500 mt-1.5 shrink-0">{c.month}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="flex justify-center gap-4 text-[10px] text-slate-400 lowercase pt-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded bg-[#5584B4]" />
                    <span>surplus bank balance</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded bg-[#D97757]" />
                    <span>overdraft / deficit</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ===================================================================== */}
        {/* 4. BOTTOM STEP NAVIGATION DOCK: 7 STEP ICONS WITH HOVER TOOLTIP      */}
        {/* ===================================================================== */}
        <footer
          className={`px-3 py-2 border-t shrink-0 flex items-center justify-around gap-1 sm:gap-2 ${
            isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
          }`}
        >
          {STEPS.map((st) => {
            const isActive = activeStep === st.id;
            return (
              <div key={st.id} className="relative group">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStep(st.id);
                    // Default to assumptions or results depending on step
                    if (st.id === 7) {
                      setActiveTab('results');
                    } else if (activeTab === 'assistance') {
                      setActiveTab('assumptions');
                    }
                  }}
                  className={`p-1.5 sm:p-2 rounded-2xl transition-all flex flex-col items-center justify-center border ${
                    isActive
                      ? isDark
                        ? 'bg-[#1C2642] border-[#5584B4] ring-2 ring-[#5584B4]/40 shadow-xs scale-105'
                        : 'bg-[#E3EDF6] border-[#2E5E88] ring-2 ring-[#2E5E88]/30 shadow-xs scale-105'
                      : isDark
                      ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A] hover:border-slate-500'
                      : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC] hover:border-[#2E5E88]/60 shadow-2xs'
                  }`}
                  aria-label={st.name}
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
                    <img
                      src={encodeURI(st.icon)}
                      alt={st.name}
                      className={`w-full h-full object-contain transition-transform group-hover:scale-105 ${
                        isDark ? 'bg-white rounded-md p-0.5' : 'mix-blend-multiply'
                      }`}
                      loading="eager"
                    />
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2E5E88] dark:bg-[#5584B4] mt-0.5" />
                  )}
                </button>

                {/* Step hover tooltip matching PDF: "step hover text" */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 pointer-events-none">
                  <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-normal lowercase whitespace-nowrap shadow-md">
                    {st.name}
                  </div>
                </div>
              </div>
            );
          })}
        </footer>
      </div>

      {/* ===================================================================== */}
      {/* SIMPLE ASSISTANCE POPUP MODAL (MATCHING PDF: PAGE HEADING, BODY, BULLETS) */}
      {/* ===================================================================== */}
      {showAssistanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-sm rounded-3xl border p-5 space-y-4 shadow-2xl ${
              isDark ? 'bg-[#101626] border-[#222F4C] text-[#E2E8F0]' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs lowercase font-normal text-[#2E5E88] dark:text-[#5584B4]">
                <img
                  src="/help.jpg"
                  alt="help"
                  className="w-4 h-4 object-contain mix-blend-multiply dark:bg-white dark:rounded-xs dark:p-0.5"
                />
                <img
                  src={encodeURI(currentStepDef.icon)}
                  alt={currentStepDef.name}
                  className="w-4 h-4 object-contain mix-blend-multiply dark:bg-white dark:rounded dark:p-0.5"
                />
                <span>{assistanceContent.title}</span>
              </div>
              <button
                onClick={() => setShowAssistanceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs font-normal text-slate-600 dark:text-slate-300 lowercase leading-relaxed">
              {assistanceContent.body}
            </div>

            <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-normal text-slate-400 lowercase">key steps & rules:</div>
              <ul className="space-y-1.5 text-xs font-normal lowercase list-disc pl-4 text-slate-700 dark:text-slate-300">
                {assistanceContent.bullets.map((b, idx) => (
                  <li key={idx} className="leading-snug">
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAssistanceModal(false)}
                className="w-full py-2 rounded-xl bg-[#2E5E88] text-white text-xs lowercase font-normal shadow-2xs"
              >
                got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BizzCalc;
