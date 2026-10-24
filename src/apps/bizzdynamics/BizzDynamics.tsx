import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Sliders,
  TrendingUp,
  RotateCcw,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Mic,
  Calendar,
  Sparkles,
  BookOpen,
  FileSpreadsheet,
  BarChart3,
  DollarSign,
  Percent,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import { BaseRateAdjustmentTool } from './components/BaseRateAdjustmentTool';
import { ModellingSuiteModal } from './components/ModellingSuiteModal';
import { AssumptionElementChart } from './components/AssumptionElementChart';
import { DaysWorkedChart } from './components/DaysWorkedChart';
import { ReportsCarousel } from './components/ReportsCarousel';
import { AssumptionRateItem, BizzDynamicsTab, BizzDynamicsStepDef } from './types';
import {
  BizzModelState,
  DEFAULT_BUSINESS_STATE,
  BUSINESS_TYPES,
  BUSINESS_MODELS,
} from '../bizzmodel/constants';
import {
  calculateFinancialModelProjections,
  MonthlyFinancialSummary,
} from '../bizzmodel/utils/revenueCalc';
import { LiquidityVsDebtChart } from './components/LiquidityVsDebtChart';
import {
  ExecutiveEfficiencyChart,
  EfficiencyChartDataPoint,
} from './components/ExecutiveEfficiencyChart';
import {
  ExecutiveReturnsChart,
  ReturnsChartDataPoint,
} from './components/ExecutiveReturnsChart';
import {
  BizzReportTable,
  BizzReportTableRow,
  formatReportNumber,
  formatReportPercent,
} from './components/BizzReportTable';
import {
  BizzReportSection,
  BizzTableClass,
  BizzTableHeaderClass,
  BizzTableHeaderCellClass,
  BizzTableRowClass,
  BizzTableCellClass,
  BizzTableContainerClass,
} from '../bizzmodel/components/BizzUI';

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

export interface BizzDynamicsCalendarState {
  businessName: string;
  startDate: string; // "2026-02"
  workingDays: Record<string, boolean>;
  deductHolidays: boolean;
  holidays: Array<{ id: string; name: string; date: string }>;
}

interface BizzDynamicsProps {
  theme?: 'light' | 'dark';
  onClose: () => void;
  onContextSwitch?: (appId: string, step?: string) => void;
}

export const BizzDynamics: React.FC<BizzDynamicsProps> = ({
  theme = 'light',
  onClose,
  onContextSwitch,
}) => {
  const isDark = theme === 'dark';

  // 1. Bottom Row: 7 Steps (Navigation in bottom row, matching BizzCalc design standard)
  const STEPS: BizzDynamicsStepDef[] = [
    { id: 1, key: 'setup', name: 'business details', icon: '/business details.jpg', description: 'business details & operating rhythms' },
    { id: 2, key: 'revenue', name: 'revenue calculator', icon: '/revenue calculator.jpg', description: 'revenue calculator & pricing dynamics' },
    { id: 3, key: 'employment', name: 'employment', icon: '/employment.jpg', description: 'key organizational team (redacted education)' },
    { id: 4, key: 'opex', name: 'operating expenses', icon: '/operating expenses.jpg', description: 'operating overheads & distribution' },
    { id: 5, key: 'fixed-assets', name: 'fixed assets', icon: '/fixed assets.jpg', description: 'capital expenditure & depreciation' },
    { id: 6, key: 'funding', name: 'funding calculator', icon: '/funding calculator.jpg', description: 'capital structure & working capital' },
    { id: 7, key: 'reports', name: 'reports', icon: '/reports.jpg', description: 'authentic v1 financial reports' },
  ];

  const [activeStep, setActiveStep] = useState<number>(1);

  // 2. Top Row: Page Functionality Tabs (assumptions, data entry, results)
  const [activeTab, setActiveTab] = useState<BizzDynamicsTab>('assumptions');

  // 3. UI Modals
  const [showAssistanceModal, setShowAssistanceModal] = useState<boolean>(false);
  const [showSuiteModal, setShowSuiteModal] = useState<boolean>(false);

  // 4. Persistence for BizzDynamics model state
  const storageKey = 'bizzdynamics_platform_data';
  const [modelState, setModelState] = useState<BizzModelState>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_BUSINESS_STATE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(modelState));
    } catch {
      // ignore
    }
  }, [modelState]);

  // Step 1 Operating Calendar State (Hardcoded business name: "bizzbean learning enterprise")
  const [calendarState, setCalendarState] = useState<BizzDynamicsCalendarState>(() => {
    try {
      const saved = localStorage.getItem('bizzdynamics_calendar_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      businessName: 'bizzbean learning enterprise',
      startDate: '2026-02',
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
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('bizzdynamics_calendar_v2', JSON.stringify(calendarState));
    } catch {}
  }, [calendarState]);

  // Holiday add form state
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');

  // Step 1 Results Filter by Years & Element
  const [step1YearFilter, setStep1YearFilter] = useState<number | 'all'>(1);
  const [step1ElementFilter, setStep1ElementFilter] = useState<
    'all' | 'interest-pos' | 'interest-neg' | 'vat-rate' | 'tax-rate'
  >('all');

  // 5. Dynamic Base Rates & Assumptions Matrix (60 Months / 5 Years)
  // Each assumption has an independent radio button on the assumption page
  const initialAssumptions: AssumptionRateItem[] = useMemo(() => [
    // Step 1: Business Details / Setup
    {
      id: 'interest-pos',
      stepId: 1,
      stepName: 'business details',
      name: 'interest rates – positive balance',
      description: 'Return on surplus cash reserves held in primary trading account (COA 1-3-1-1)',
      baseRate: 4.5,
      unit: '%',
      changeType: 'percentage',
      monthlyValues: new Array(60).fill(4.5),
      coaReference: '1-3-1-1',
    },
    {
      id: 'interest-neg',
      stepId: 1,
      stepName: 'business details',
      name: 'interest rates – negative balance',
      description: 'Overdraft facility interest charges on deficit balances (COA 2-7-1-2)',
      baseRate: 11.75,
      unit: '%',
      changeType: 'percentage',
      monthlyValues: new Array(60).fill(11.75),
      coaReference: '2-7-1-2',
    },
    {
      id: 'vat-rate',
      stepId: 1,
      stepName: 'business details',
      name: 'vat rate',
      description: 'Standard value-added tax rate applicable to sales & allowable inputs (COA 3-2-2-1 / 4-7-1-1)',
      baseRate: 15.0,
      unit: '%',
      changeType: 'percentage',
      monthlyValues: new Array(60).fill(15.0),
      coaReference: '3-2-2-1',
    },
    {
      id: 'tax-rate',
      stepId: 1,
      stepName: 'business details',
      name: 'tax rate',
      description: 'Corporate income tax rate (CIT) on net taxable corporate profits (COA 2-7-2-1 / 4-7-1-2)',
      baseRate: 27.0,
      unit: '%',
      changeType: 'percentage',
      monthlyValues: new Array(60).fill(27.0),
      coaReference: '2-7-2-1',
    },

    // Step 2: Revenue Calculator
    {
      id: 'rev-price-escalation',
      stepId: 2,
      stepName: 'revenue calculator',
      name: 'annual price escalation rate',
      description: 'Annual compound price increase applied to core products/services',
      baseRate: 6.0,
      unit: '%',
      changeType: 'percentage',
      monthlyValues: new Array(60).fill(6.0),
    },
    {
      id: 'rev-commission-rate',
      stepId: 2,
      stepName: 'revenue calculator',
      name: 'sales commission rate',
      description: 'Variable incentive paid on gross billings / gross revenue',
      baseRate: 1.5,
      unit: '%',
      changeType: 'percentage',
      monthlyValues: new Array(60).fill(1.5),
    },
    {
      id: 'rev-cos-inflation',
      stepId: 2,
      stepName: 'revenue calculator',
      name: 'cost of sales inflation',
      description: 'Annual input materials and supplier price escalation rate',
      baseRate: 5.0,
      unit: '%',
      changeType: 'percentage',
      monthlyValues: new Array(60).fill(5.0),
    },

    // Step 3: Employment (Redacted Education)
    {
      id: 'emp-salary-review',
      stepId: 3,
      stepName: 'employment',
      name: 'annual salary review rate',
      description: 'Annual cost-of-living and merit wage increases across staff payroll',
      baseRate: 6.5,
      unit: '%',
      changeType: 'percentage',
      monthlyValues: new Array(60).fill(6.5),
    },
    {
      id: 'emp-oncost-pct',
      stepId: 3,
      stepName: 'employment',
      name: 'statutory employer on-cost %',
      description: 'Pension contributions, medical aid subsidy, UIF, and skills development levy',
      baseRate: 15.0,
      unit: '%',
      changeType: 'percentage',
      monthlyValues: new Array(60).fill(15.0),
    },

    // Step 4: Operating Expenses (Redacted Education)
    {
      id: 'opex-inflation-rate',
      stepId: 4,
      stepName: 'operating expenses',
      name: 'annual opex inflation rate',
      description: 'Underlying headline CPI inflation applied to general administrative and overhead costs',
      baseRate: 5.5,
      unit: '%',
      changeType: 'percentage',
      monthlyValues: new Array(60).fill(5.5),
    },
    {
      id: 'opex-marketing-scale',
      stepId: 4,
      stepName: 'operating expenses',
      name: 'marketing budget scaling %',
      description: 'Monthly marketing acquisition spend index as a proportion of baseline revenue',
      baseRate: 8.0,
      unit: '%',
      changeType: 'percentage',
      monthlyValues: new Array(60).fill(8.0),
    },

    // Step 5: Fixed Assets (Redacted Education)
    {
      id: 'fa-replacement-index',
      stepId: 5,
      stepName: 'fixed assets',
      name: 'annual replacement cost index',
      description: 'Hardware and plant replacement cost inflation over useful asset life',
      baseRate: 4.0,
      unit: '%',
      changeType: 'percentage',
      monthlyValues: new Array(60).fill(4.0),
    },

    // Step 6: Funding Calculator
    {
      id: 'fund-bank-loan-rate',
      stepId: 6,
      stepName: 'funding calculator',
      name: 'bank loan interest rate',
      description: 'Commercial debt facility annual nominal borrowing interest rate (COA 2-7-1-1)',
      baseRate: 11.5,
      unit: '%',
      changeType: 'percentage',
      monthlyValues: new Array(60).fill(11.5),
    },
    {
      id: 'fund-overdraft-rate',
      stepId: 6,
      stepName: 'funding calculator',
      name: 'overdraft facility rate',
      description: 'Revolving credit and working capital deficit interest rate (COA 2-7-1-2)',
      baseRate: 12.0,
      unit: '%',
      changeType: 'percentage',
      monthlyValues: new Array(60).fill(12.0),
    },
  ], []);

  const [assumptions, setAssumptions] = useState<AssumptionRateItem[]>(() => {
    try {
      const saved = localStorage.getItem('bizzdynamics_assumptions_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return initialAssumptions;
  });

  useEffect(() => {
    try {
      localStorage.setItem('bizzdynamics_assumptions_v2', JSON.stringify(assumptions));
    } catch {
      // ignore
    }
  }, [assumptions]);

  // 6. Currently Selected Assumption for the Base Rate Adjustment Tool
  // Defaults to the first assumption of the active step
  const currentStepAssumptions = useMemo(() => {
    return assumptions.filter((a) => a.stepId === activeStep);
  }, [assumptions, activeStep]);

  const [selectedAssumptionId, setSelectedAssumptionId] = useState<string>('interest-pos');

  // When active step changes, ensure selectedAssumption matches one in the step
  useEffect(() => {
    if (currentStepAssumptions.length > 0) {
      const existsInStep = currentStepAssumptions.some((a) => a.id === selectedAssumptionId);
      if (!existsInStep) {
        setSelectedAssumptionId(currentStepAssumptions[0].id);
      }
    }
  }, [activeStep, currentStepAssumptions, selectedAssumptionId]);

  const activeAssumptionItem = useMemo(() => {
    return assumptions.find((a) => a.id === selectedAssumptionId) || assumptions[0];
  }, [assumptions, selectedAssumptionId]);

  // Handle updating monthly values from the Base Rate Adjustment Tool
  const handleUpdateMonthlyValues = (itemId: string, updatedValues: number[]) => {
    setAssumptions((prev) =>
      prev.map((a) => (a.id === itemId ? { ...a, monthlyValues: updatedValues } : a))
    );
  };

  // Handle toggling change type (% vs value)
  const handleChangeTypeToggle = (itemId: string, newType: 'percentage' | 'value') => {
    setAssumptions((prev) =>
      prev.map((a) => (a.id === itemId ? { ...a, changeType: newType } : a))
    );
  };

  // Handle updating base rate for an assumption item (Interest pos/neg, vat, tax, etc.)
  // Formula: rate = (base + change rate). When base changes, preserving change rate (delta) updates monthly values accordingly.
  const handleUpdateBaseRate = (itemId: string, newBaseRate: number) => {
    setAssumptions((prev) =>
      prev.map((a) => {
        if (a.id === itemId) {
          const oldBase = a.baseRate;
          const updatedMonthly = a.monthlyValues.map((v) => {
            const changeRate = v - oldBase;
            return Number((newBaseRate + changeRate).toFixed(4));
          });
          return {
            ...a,
            baseRate: newBaseRate,
            monthlyValues: updatedMonthly,
          };
        }
        return a;
      })
    );
  };

  // Handle resetting an item's 60 months directly to a target rate (or its base rate)
  const handleResetToNewBaseRate = (itemId: string, targetRate?: number) => {
    setAssumptions((prev) =>
      prev.map((a) => {
        if (a.id === itemId) {
          const rate = targetRate !== undefined ? targetRate : a.baseRate;
          return {
            ...a,
            baseRate: rate,
            monthlyValues: new Array(60).fill(rate),
          };
        }
        return a;
      })
    );
  };

  // 60-Month Operating Calendar Calculation (BizzCalc Mathematical Engine extended to 5 Years)
  const [calStartYearStr, calStartMonthStr] = (calendarState.startDate || '2026-02').split('-');
  const calStartYear = parseInt(calStartYearStr, 10) || 2026;
  const calStartMonthNum = parseInt(calStartMonthStr, 10) || 2; // 1-indexed

  const monthlyCalendar60 = useMemo(() => {
    const list = [];
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    for (let m = 0; m < 60; m++) {
      const yrOffset = Math.floor((calStartMonthNum - 1 + m) / 12);
      const mthOffset = (calStartMonthNum - 1 + m) % 12; // 0-11
      const curYear = calStartYear + yrOffset;
      const curMonth = mthOffset + 1; // 1-12
      const daysInMonth = new Date(curYear, curMonth, 0).getDate();

      let workingDaysCount = 0;
      let holidaysOnWorkingDays = 0;
      let holidaysInMonthTotal = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(curYear, curMonth - 1, d);
        const dayName = dayNames[dateObj.getDay()];
        const isScheduledWorkingDay = !!calendarState.workingDays[dayName];

        let isHoliday = false;
        if (calendarState.deductHolidays) {
          const monthDayStr = `${String(curMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const fullDateStr = `${curYear}-${monthDayStr}`;
          isHoliday = calendarState.holidays.some(
            (h) => h.date === fullDateStr || h.date.endsWith(monthDayStr)
          );
        }

        if (isScheduledWorkingDay) {
          workingDaysCount++;
          if (isHoliday) holidaysOnWorkingDays++;
        }
        if (isHoliday) holidaysInMonthTotal++;
      }

      const netDaysWorked = Math.max(0, workingDaysCount - holidaysOnWorkingDays);
      const monthShort = monthNames[mthOffset];
      const monthLabel = `${monthShort} '${String(curYear).slice(2)}`;

      list.push({
        monthIndex: m + 1,
        yearIndex: Math.floor(m / 12) + 1,
        monthInYear: (m % 12) + 1,
        monthLabel,
        monthShort,
        year: curYear,
        month: curMonth,
        daysInMonth,
        workingDaysCount,
        holidaysOnWorkingDays,
        holidaysInMonthTotal,
        netDaysWorked,
      });
    }
    return list;
  }, [calStartYear, calStartMonthNum, calendarState.workingDays, calendarState.deductHolidays, calendarState.holidays]);

  // Calendar totals for Year 1-5 or 60 months
  const totalCalendarDays60 = useMemo(() => monthlyCalendar60.reduce((s, m) => s + m.daysInMonth, 0), [monthlyCalendar60]);
  const totalDaysWorked60 = useMemo(() => monthlyCalendar60.reduce((s, m) => s + m.netDaysWorked, 0), [monthlyCalendar60]);

  const activeYearCalendar = useMemo(() => {
    if (step1YearFilter === 'all') return monthlyCalendar60;
    const start = (step1YearFilter - 1) * 12;
    return monthlyCalendar60.slice(start, start + 12);
  }, [monthlyCalendar60, step1YearFilter]);

  const activeYearCalendarDays = useMemo(() => activeYearCalendar.reduce((s, m) => s + m.daysInMonth, 0), [activeYearCalendar]);
  const activeYearDaysWorked = useMemo(() => activeYearCalendar.reduce((s, m) => s + m.netDaysWorked, 0), [activeYearCalendar]);

  // 7. Calculate 60-Month Projections (5 Years) with Rate Overrides
  const projections = useMemo(() => {
    // Build rate overrides dictionary from monthly values
    const rateOverrides: Record<string, number[]> = {};
    assumptions.forEach((a) => {
      if (a.id === 'interest-pos') rateOverrides.positiveBaseRate = a.monthlyValues;
      if (a.id === 'interest-neg') rateOverrides.negativeBaseRate = a.monthlyValues;
      if (a.id === 'vat-rate') rateOverrides.vatRate = a.monthlyValues;
      if (a.id === 'tax-rate') rateOverrides.taxRate = a.monthlyValues;
      if (a.id === 'fund-bank-loan-rate') rateOverrides.interestRatePct = a.monthlyValues;
    });

    return calculateFinancialModelProjections(modelState, 60, rateOverrides);
  }, [modelState, assumptions]);

  // Current Step Definition
  const currentStepDef = STEPS.find((s) => s.id === activeStep) || STEPS[0];

  // Reports Step (Step 7) Tab - V1 Sequence Index (1 to 9)
  const [activeReportTab, setActiveReportTab] = useState<
    | 'liquidity-funding'
    | 'summary'
    | 'trading-account'
    | 'trading-distribution'
    | 'income-statement'
    | 'balance-sheet'
    | 'cash-flow'
    | 'vat-ledger'
    | 'assumptions'
  >('liquidity-funding');

  // Reports Period Filter: Year 1, Year 2, Year 3, Year 4, Year 5, or 5-Year Summary (Replacing ALL)
  const [reportHorizonYear, setReportHorizonYear] = useState<number | 'summary'>(1);

  // Compute unified report columns: either 12 months for an individual year OR 5 annual summaries + 5-yr total
  const reportColumns = useMemo(() => {
    if (reportHorizonYear !== 'summary') {
      const start = (reportHorizonYear - 1) * 12;
      const slice = projections.slice(start, start + 12);
      return slice.map((p) => ({
        id: `m-${p.month}`,
        label: `M${p.month}`,
        isTotal: false,
        revenue: p.revenue,
        cogs: p.cogs,
        grossProfit: p.grossProfit,
        employmentExpenses: p.employmentExpenses,
        operatingExpenses: p.operatingExpenses,
        depreciation: p.depreciation,
        interestOverdraft: p.interestOverdraft,
        interestReceived: p.interestReceived,
        netProfitBeforeTax: p.netProfitBeforeTax,
        taxationMonthly: p.taxationMonthly,
        taxedProfits: p.taxedProfits,
        operatingCashFlow: p.grossProfit - (p.employmentExpenses + p.operatingExpenses),
        vatSettlement: p.vatSettlement,
        taxPayment: p.taxPayment,
        closingCash: p.closingCash,
        bank_balance_closing: p.bank_balance_closing ?? p.closingCash,
        term_loan_balance: p.term_loan_balance ?? p.debtBalance,
        cumulativeRetainedEarnings: p.cumulativeRetainedEarnings,
        taxCarriedForwardLoss: p.taxCarriedForwardLoss,
        vatableAmount: p.vatableAmount,
      }));
    }

    // 5-Year Summary: Reports each year (Y1, Y2, Y3, Y4, Y5) and 5-Year Total
    const annualCols = [1, 2, 3, 4, 5].map((yr) => {
      const start = (yr - 1) * 12;
      const slice = projections.slice(start, start + 12);
      const lastMonth = slice[slice.length - 1];

      return {
        id: `yr-${yr}`,
        label: `Y${yr}`,
        isTotal: false,
        revenue: slice.reduce((sum, p) => sum + p.revenue, 0),
        cogs: slice.reduce((sum, p) => sum + p.cogs, 0),
        grossProfit: slice.reduce((sum, p) => sum + p.grossProfit, 0),
        employmentExpenses: slice.reduce((sum, p) => sum + p.employmentExpenses, 0),
        operatingExpenses: slice.reduce((sum, p) => sum + p.operatingExpenses, 0),
        depreciation: slice.reduce((sum, p) => sum + p.depreciation, 0),
        interestOverdraft: slice.reduce((sum, p) => sum + p.interestOverdraft, 0),
        interestReceived: slice.reduce((sum, p) => sum + p.interestReceived, 0),
        netProfitBeforeTax: slice.reduce((sum, p) => sum + p.netProfitBeforeTax, 0),
        taxationMonthly: slice.reduce((sum, p) => sum + p.taxationMonthly, 0),
        taxedProfits: slice.reduce((sum, p) => sum + p.taxedProfits, 0),
        operatingCashFlow: slice.reduce(
          (sum, p) => sum + (p.grossProfit - (p.employmentExpenses + p.operatingExpenses)),
          0
        ),
        vatSettlement: slice.reduce((sum, p) => sum + p.vatSettlement, 0),
        taxPayment: slice.reduce((sum, p) => sum + p.taxPayment, 0),
        closingCash: lastMonth ? lastMonth.closingCash : 0,
        bank_balance_closing: lastMonth ? (lastMonth.bank_balance_closing ?? lastMonth.closingCash) : 0,
        term_loan_balance: lastMonth ? (lastMonth.term_loan_balance ?? lastMonth.debtBalance) : 0,
        cumulativeRetainedEarnings: lastMonth ? lastMonth.cumulativeRetainedEarnings : 0,
        taxCarriedForwardLoss: lastMonth ? lastMonth.taxCarriedForwardLoss : 0,
        vatableAmount: slice.reduce((sum, p) => sum + p.vatableAmount, 0),
      };
    });

    const lastOverallMonth = projections[projections.length - 1];
    const totalCol = {
      id: '5yr-total',
      label: '5-YR TOTAL',
      isTotal: true,
      revenue: projections.reduce((sum, p) => sum + p.revenue, 0),
      cogs: projections.reduce((sum, p) => sum + p.cogs, 0),
      grossProfit: projections.reduce((sum, p) => sum + p.grossProfit, 0),
      employmentExpenses: projections.reduce((sum, p) => sum + p.employmentExpenses, 0),
      operatingExpenses: projections.reduce((sum, p) => sum + p.operatingExpenses, 0),
      depreciation: projections.reduce((sum, p) => sum + p.depreciation, 0),
      interestOverdraft: projections.reduce((sum, p) => sum + p.interestOverdraft, 0),
      interestReceived: projections.reduce((sum, p) => sum + p.interestReceived, 0),
      netProfitBeforeTax: projections.reduce((sum, p) => sum + p.netProfitBeforeTax, 0),
      taxationMonthly: projections.reduce((sum, p) => sum + p.taxationMonthly, 0),
      taxedProfits: projections.reduce((sum, p) => sum + p.taxedProfits, 0),
      operatingCashFlow: projections.reduce(
        (sum, p) => sum + (p.grossProfit - (p.employmentExpenses + p.operatingExpenses)),
        0
      ),
      vatSettlement: projections.reduce((sum, p) => sum + p.vatSettlement, 0),
      taxPayment: projections.reduce((sum, p) => sum + p.taxPayment, 0),
      closingCash: lastOverallMonth ? lastOverallMonth.closingCash : 0,
      bank_balance_closing: lastOverallMonth ? (lastOverallMonth.bank_balance_closing ?? lastOverallMonth.closingCash) : 0,
      term_loan_balance: lastOverallMonth ? (lastOverallMonth.term_loan_balance ?? lastOverallMonth.debtBalance) : 0,
      cumulativeRetainedEarnings: lastOverallMonth ? lastOverallMonth.cumulativeRetainedEarnings : 0,
      taxCarriedForwardLoss: lastOverallMonth ? lastOverallMonth.taxCarriedForwardLoss : 0,
      vatableAmount: projections.reduce((sum, p) => sum + p.vatableAmount, 0),
    };

    return [...annualCols, totalCol];
  }, [projections, reportHorizonYear]);

  // 5-Year Data for Annual Summary, Growth Trajectory & Trading Account (V1 reports parity)
  const yearData = useMemo(() => {
    return [1, 2, 3, 4, 5].map((yr) => {
      const start = (yr - 1) * 12;
      const slice = projections.slice(start, start + 12);

      const unitSales = slice.reduce((sum, p) => sum + (p.unitSales || 0), 0);
      const revenue = slice.reduce((sum, p) => sum + p.revenue, 0);
      const total_cos = slice.reduce((sum, p) => sum + p.cogs, 0);

      const cos_employment = slice.reduce((sum, p) => sum + (p.cosEmployment || 0), 0);
      const cos_depreciation = slice.reduce((sum, p) => sum + (p.cosDepreciation || 0), 0);
      const cos_lease = slice.reduce((sum, p) => sum + (p.cosLeases || 0), 0);
      const cos_overheads = slice.reduce((sum, p) => sum + (p.cosOverheads || 0), 0);
      const cos_fixed = cos_employment + cos_depreciation + cos_lease + cos_overheads;
      const cos_variable = Math.max(0, total_cos - cos_fixed);

      const gross_profit = slice.reduce((sum, p) => sum + p.grossProfit, 0);

      const sales_commission = slice.reduce((sum, p) => sum + (p.gpAdjustmentsCommission || 0), 0);
      const inventory_adjustments = slice.reduce((sum, p) => sum + (p.gpAdjustmentsInventory || 0), 0);
      const manufacturing_variance = slice.reduce((sum, p) => sum + (p.gpAdjustmentsVariance || 0), 0);
      const gp_adjustments = sales_commission + inventory_adjustments + manufacturing_variance;

      const remaining_gp = gross_profit - gp_adjustments;
      const other_inc = slice.reduce((sum, p) => sum + (p.interestReceived || 0), 0);
      const total_income = remaining_gp + other_inc;

      const ex_employment = slice.reduce((sum, p) => sum + (p.employmentExpenses || p.opexEmployment || 0), 0);
      const ex_depreciation = slice.reduce((sum, p) => sum + (p.depreciation || p.opexAdminDepreciation || 0), 0);
      const ex_lease = 0;
      const ex_overheads = slice.reduce((sum, p) => sum + Math.max(0, (p.operatingExpenses || 0) - (p.depreciation || 0)), 0);
      const ex_fixed = ex_employment + ex_depreciation + ex_lease + ex_overheads;
      const ex_total = slice.reduce((sum, p) => sum + (p.totalExpenses || (p.employmentExpenses + p.operatingExpenses)), 0);
      const ex_variable = Math.max(0, ex_total - ex_fixed);

      const net_operating_profit = slice.reduce((sum, p) => sum + (p.netOperatingProfit || (total_income - ex_total)), 0);

      const interest_other = slice.reduce(
        (sum, p) => sum + (p.interestOther !== undefined ? p.interestOther : (p.interestReceived - p.interestOverdraft)),
        0
      );
      const interest_tl = slice.reduce((sum, p) => sum + (p.interestTermLoan ?? p.interestExpense ?? 0), 0);
      const interest_total = slice.reduce(
        (sum, p) => sum + (p.netFinanceCharges ?? (p.interestExpense - p.interestOther)),
        0
      );
      const net_profit_before_tax = slice.reduce(
        (sum, p) => sum + (p.netProfitBeforeTax ?? p.netProfitBeforeTaxation ?? 0),
        0
      );
      const taxation = slice.reduce((sum, p) => sum + (p.taxationMonthly ?? p.taxationCit ?? 0), 0);
      const taxed_profits = slice.reduce((sum, p) => sum + p.taxedProfits, 0);
      const dividends = slice.reduce((sum, p) => sum + (p.dividends ?? p.dividendsDeclared ?? 0), 0);
      const retained_earnings = taxed_profits - dividends;

      const shares_in_issue =
        (modelState.businessDetails as any)?.sharesInIssue ||
        (modelState.businessDetails as any)?.shares_in_issue ||
        100000;

      // Cash Flow & Balance Sheet metrics (V1 reports parity)
      const lastMonth = slice[slice.length - 1];
      const prevYearLastMonth = yr > 1 ? projections[(yr - 1) * 12 - 1] : null;

      const initialOpeningCash =
        (modelState.funding?.founderEquity || 0) +
        (modelState.funding?.investorEquity || 0) +
        (modelState.funding?.bankLoanAmount || 0);

      const bank_balance_opening =
        yr === 1
          ? initialOpeningCash
          : (prevYearLastMonth?.bank_balance_closing ?? prevYearLastMonth?.closingCash ?? 0);

      const bank_balance_closing = lastMonth
        ? (lastMonth.bank_balance_closing ?? lastMonth.closingCash)
        : 0;

      const cash_from_operations = net_operating_profit - interest_total - taxation - dividends;

      const inv_change = 0;
      const ar_change = 0;
      const oa_change = 0;
      const vat_rec_change = (lastMonth?.vatReceivable ?? 0) - (prevYearLastMonth?.vatReceivable ?? 0);
      const ap_change = 0;
      const vat_pay_change = (lastMonth?.vatPayable ?? 0) - (prevYearLastMonth?.vatPayable ?? 0);
      const change_in_working_capital =
        -inv_change - ar_change - oa_change - vat_rec_change + ap_change + vat_pay_change + taxation;

      const capex =
        modelState.fixedAssets?.reduce((sum: number, a: any) => {
          if (a.purchaseMonth >= start + 1 && a.purchaseMonth <= start + 12) {
            return sum + (a.purchaseCost || 0);
          }
          return sum;
        }, 0) || 0;

      const dep_writeback = cos_depreciation + ex_depreciation;
      const application_to_capital_assets = dep_writeback - capex;

      const share_capital_change =
        yr === 1
          ? (modelState.funding?.founderEquity || 0) + (modelState.funding?.investorEquity || 0)
          : 0;
      const equity_loan_change = 0;
      const loan_change =
        yr === 1
          ? (lastMonth?.term_loan_balance ?? 0) - (modelState.funding?.bankLoanAmount || 0)
          : (lastMonth?.term_loan_balance ?? 0) - (prevYearLastMonth?.term_loan_balance ?? 0);
      const change_in_funding = share_capital_change + equity_loan_change + loan_change;

      const cashflow = bank_balance_closing - bank_balance_opening;

      // Balance Sheet metrics (V1 reports parity)
      const fixed_assets_net =
        modelState.fixedAssets?.reduce((sum: number, a: any) => {
          const monthsElapsed = Math.max(0, yr * 12 - a.purchaseMonth + 1);
          const depPerMonth = a.usefulLifeMonths > 0 ? (a.purchaseCost - a.scrapValue) / a.usefulLifeMonths : 0;
          const cumDep = Math.min(a.purchaseCost - a.scrapValue, depPerMonth * monthsElapsed);
          return sum + Math.max(0, a.purchaseCost - cumDep);
        }, 0) || 0;

      const inventory = 0;
      const accounts_receivable = 0;
      const other_assets = 0;
      const vat_receivable = lastMonth?.vatReceivable ?? 0;
      const current_assets = (bank_balance_closing > 0 ? bank_balance_closing : 0) + vat_receivable;
      const total_assets = fixed_assets_net + current_assets;
      const accounts_payable = 0;
      const vat_payable = lastMonth?.vatPayable ?? 0;
      const taxation_payable = lastMonth?.taxLiability ?? 0;
      const non_interest_bearing_debt = vat_payable + taxation_payable;
      const net_operating_assets = total_assets - non_interest_bearing_debt;

      return {
        year: yr,
        unitSales,
        revenue,
        total_cos,
        cos_variable,
        cos_fixed,
        cos_employment,
        cos_depreciation,
        cos_lease,
        cos_overheads,
        gross_profit,
        gp_adjustments,
        sales_commission,
        inventory_adjustments,
        manufacturing_variance,
        remaining_gp,
        other_inc,
        total_income,
        ex_total,
        ex_variable,
        ex_fixed,
        ex_employment,
        ex_depreciation,
        ex_lease,
        ex_overheads,
        net_operating_profit,
        interest_other,
        interest_tl,
        interest_total,
        net_profit_before_tax,
        taxation,
        taxed_profits,
        dividends,
        retained_earnings,
        shares_in_issue,
        // Cash Flow statement
        bank_balance_opening,
        bank_balance_closing,
        cash_from_operations,
        inv_change,
        ar_change,
        oa_change,
        vat_rec_change,
        ap_change,
        vat_pay_change,
        change_in_working_capital,
        capex,
        dep_writeback,
        application_to_capital_assets,
        share_capital_change,
        equity_loan_change,
        loan_change,
        change_in_funding,
        cashflow,
        // Balance Sheet
        fixed_assets_net,
        inventory,
        accounts_receivable,
        other_assets,
        vat_receivable,
        current_assets,
        total_assets,
        accounts_payable,
        vat_payable,
        taxation_payable,
        non_interest_bearing_debt,
        net_operating_assets,
        term_loan_balance: lastMonth ? (lastMonth.term_loan_balance ?? lastMonth.debtBalance) : 0,
        cumulative_retained_earnings: lastMonth ? lastMonth.cumulativeRetainedEarnings : 0,
      };
    });
  }, [projections, modelState]);

  const years = [1, 2, 3, 4, 5];
  const formatNumeric = (val: number): string => {
    if (isNaN(val) || Math.abs(val) < 0.0001) return '0';
    return Math.round(val).toLocaleString();
  };

  const getDistVal = (id: string, yr: (typeof yearData)[0]): number => {
    if (id === 'unit_sales') return yr.unitSales;
    if (id === 'rev') return yr.revenue;
    if (id === 'cos') return yr.total_cos;
    if (id === 'cos_var') return yr.cos_variable;
    if (id === 'cos_fixed') return yr.cos_fixed;
    if (id === 'staff_cos') return yr.cos_employment;
    if (id === 'dep_cos') return yr.cos_depreciation;
    if (id === 'lease_cos') return yr.cos_lease;
    if (id === 'oh_cos') return yr.cos_overheads;
    if (id === 'gp') return yr.gross_profit;
    if (id === 'gp_adj') return yr.gp_adjustments;
    if (id === 'rem_gp') return yr.remaining_gp;
    if (id === 'other_inc') return yr.other_inc;
    if (id === 'total_inc') return yr.total_income;
    if (id === 'expenses') return yr.ex_total;
    if (id === 'ex_var') return yr.ex_variable;
    if (id === 'ex_fixed') return yr.ex_fixed;
    if (id === 'staff_ex') return yr.ex_employment;
    if (id === 'dep_ex') return yr.ex_depreciation;
    if (id === 'lease_ex') return yr.ex_lease;
    if (id === 'oh_ex') return yr.ex_overheads;
    if (id === 'nop') return yr.net_operating_profit;
    return 0;
  };

  return (
    <div
      className={`w-full h-full flex-1 flex flex-col font-mono select-none transition-colors rounded-2xl overflow-hidden ${
        isDark ? 'bg-[#0A0D14] text-slate-100' : 'bg-[#FAF8F5] text-slate-900'
      }`}
    >
      {/* ===================================================================== */}
      {/* 1. TOP ROW: PAGE FUNCTIONALITY (HELP ICON & TABS) + APP NAME (BIZZDYNAMICS) */}
      {/* Aligned in height and vertical rhythm with Left & Right Panels          */}
      {/* ===================================================================== */}
      <header
        className={`px-4 sm:px-6 py-2.5 min-h-[52px] sm:min-h-[56px] border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#161C30] border-[#222F4C]' : 'bg-[#F4EFE6]/90 border-[#D8CEBC]'
        }`}
      >
        <div className="flex items-center gap-2.5 flex-1 max-w-lg">
          {/* Help icon button (opens step assistance with /help.jpg) */}
          <button
            type="button"
            onClick={() => setShowAssistanceModal(true)}
            title="Assistance & Guidance for this step"
            aria-label="assistance"
            className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center border transition-all p-1.5 ${
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
          <div className="grid grid-cols-3 gap-2 flex-1">
            {[
              { id: 'assumptions', label: 'assumptions' },
              { id: 'data entry', label: 'data entry' },
              { id: 'results', label: 'results' },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as BizzDynamicsTab)}
                  className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold text-center transition-all lowercase whitespace-nowrap overflow-hidden text-ellipsis border ${
                    isSelected
                      ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs font-bold'
                      : isDark
                      ? 'bg-transparent text-slate-400 hover:text-white border-transparent hover:bg-[#1E2548]/40'
                      : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-black/5'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side: Replaced 'desktop/laptop screen optimized' with the name of the app (bizzdynamics) · exclude favicon */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowSuiteModal(true)}
            className="text-sm sm:text-base font-bold lowercase tracking-tight text-slate-900 dark:text-white hover:text-[#2E5E88] dark:hover:text-[#5584B4] transition-colors"
            title="bizzdynamics · click to view modelling suite"
          >
            bizzdynamics
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              title="Exit bizzdynamics"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 3. STEP CONTENT BODY                                                  */}
      {/* ===================================================================== */}
      <main className="flex-grow p-4 sm:p-6 overflow-y-auto overflow-x-hidden space-y-6">
        
        {/* =================================================================== */}
        {/* TAB 1: ASSUMPTIONS (HOSTING THE BASE RATE ADJUSTMENT TOOL & RADIOS) */}
        {/* =================================================================== */}
        {activeTab === 'assumptions' && activeStep !== 7 && (
          <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-150">
            {/* Top Card: Step Assumptions Table with Radio Buttons */}
            <div
              className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 gap-2">
                <div>
                  <h2 className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                    {currentStepDef.name} — FOUNDATIONAL BASE RATES & ASSUMPTIONS
                  </h2>
                  <p className="text-[11px] text-slate-500 lowercase mt-0.5">
                    select any radio button to load and modify that base rate across the 5-year forecast in the tool below
                  </p>
                </div>

                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#5584B4]">
                  {currentStepAssumptions.length} adjustable {currentStepAssumptions.length === 1 ? 'rate' : 'rates'}
                </span>
              </div>

              {/* Assumption rows with radio buttons alongside each rate (Directly matching PDF Page 2) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentStepAssumptions.map((assump) => {
                  const isSelected = selectedAssumptionId === assump.id;
                  const modifiedMonths = assump.monthlyValues.filter((v) => Math.abs(v - assump.baseRate) > 0.0001).length;

                  return (
                    <div
                      key={assump.id}
                      onClick={() => setSelectedAssumptionId(assump.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? isDark
                            ? 'bg-[#18233D] border-[#5584B4] shadow-xs ring-1 ring-[#5584B4]/40'
                            : 'bg-[#EAF1F8] border-[#2E5E88] shadow-xs ring-1 ring-[#2E5E88]/30'
                          : isDark
                          ? 'bg-[#121A2F] border-[#222F4C] hover:border-slate-600'
                          : 'bg-slate-50/70 border-[#D8CEBC] hover:border-[#2E5E88]/60'
                      }`}
                    >
                      {/* Left: Assumption Name & Description */}
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white lowercase truncate">
                            {assump.name}
                          </span>
                          {assump.coaReference && (
                            <span className="text-[9px] px-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                              COA {assump.coaReference}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <span>base rate:</span>
                            <input
                              type="number"
                              step="0.01"
                              value={assump.baseRate}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                if (!isNaN(v)) {
                                  handleUpdateBaseRate(assump.id, v);
                                }
                              }}
                              className="w-18 px-1.5 py-0.5 rounded-lg border text-xs font-bold text-[#2E5E88] dark:text-[#5584B4] bg-white dark:bg-[#0E1424] border-slate-300 dark:border-slate-700 text-center"
                              title="Set base rate"
                            />
                            <span className="font-bold text-slate-400">{assump.unit === '%' ? '%' : ''}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleResetToNewBaseRate(assump.id)}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#2E5E88]/10 hover:bg-[#2E5E88]/20 text-[#2E5E88] dark:text-[#5584B4] border border-[#2E5E88]/20 transition-colors lowercase"
                            title="Reset all 60 months to this base rate"
                          >
                            apply 60m
                          </button>
                          {modifiedMonths > 0 && (
                            <span className="text-[10px] text-amber-500 font-bold">
                              · {modifiedMonths} overrides
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Radio Button (Prominently placed alongside rate as requested) */}
                      <div className="shrink-0 flex items-center">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-[#2E5E88] dark:border-[#5584B4] bg-[#2E5E88] dark:bg-[#5584B4]'
                              : 'border-slate-400 dark:border-slate-600 bg-transparent'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Tool: Base Rate Adjustment Tool (Loads selected assumption line) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs px-1 text-slate-500 lowercase">
                <span className="font-bold flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-[#2E5E88] dark:text-[#5584B4]" />
                  <span>dynamic base rate adjustment tool (replaces v1 review month table)</span>
                </span>
                <span>5-year horizon · voice & slider enabled</span>
              </div>

              <BaseRateAdjustmentTool
                theme={theme}
                item={activeAssumptionItem}
                onUpdateMonthlyValues={handleUpdateMonthlyValues}
                onUpdateBaseRate={handleUpdateBaseRate}
                onChangeTypeToggle={handleChangeTypeToggle}
              />
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: DATA ENTRY (HIGH-LEVEL REDACTED CONTENT FOR EDUCATION)       */}
        {/* =================================================================== */}
        {activeTab === 'data entry' && activeStep !== 7 && (
          <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-150">
            {/* Step 1: Business Details Data Entry (Matching BizzCalc) */}
            {activeStep === 1 && (
              <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                <div className="text-xs font-normal text-slate-500 lowercase pb-1 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span>business assumptions & operating calendar</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                    bizzcalc logic synced
                  </span>
                </div>

                {/* Business Name (cannot be changed once chosen) */}
                <div className="space-y-1">
                  <label className="text-xs font-normal text-slate-500 lowercase block">
                    business name (cannot be changed once chosen):
                  </label>
                  <input
                    type="text"
                    value="bizzbean learning enterprise"
                    disabled
                    readOnly
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold cursor-not-allowed ${
                      isDark
                        ? 'bg-[#141A2E]/70 border-[#252E4A] text-slate-300'
                        : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-700'
                    }`}
                  />
                </div>

                {/* Start Date (Ignoring scenario) */}
                <div className="space-y-1">
                  <label className="text-xs font-normal text-slate-500 lowercase block">
                    start date:
                  </label>
                  <input
                    type="month"
                    value={calendarState.startDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setCalendarState((prev) => ({ ...prev, startDate: e.target.value }));
                      }
                    }}
                    className={`w-full max-w-sm p-2 rounded-xl border text-xs font-normal ${
                      isDark ? 'bg-[#141A2E] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                    }`}
                  />
                </div>

                {/* Select Working Days (as in bizzcalc) */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-normal text-slate-500 lowercase block">
                    select working days:
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-xs">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                      const isChecked = !!calendarState.workingDays[day];
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() =>
                            setCalendarState((prev) => ({
                              ...prev,
                              workingDays: {
                                ...prev.workingDays,
                                [day]: !isChecked,
                              },
                            }))
                          }
                          className={`p-2.5 rounded-xl text-center text-xs font-normal lowercase transition-all border ${
                            isChecked
                              ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs font-bold'
                              : isDark
                              ? 'bg-[#141A2E] text-slate-400 border-[#252E4A] hover:border-slate-600'
                              : 'bg-[#FAF8F5] text-slate-600 border-[#D8CEBC] hover:border-[#2E5E88]/50'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Deduct Public Holidays (as in bizzcalc) */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-slate-600 dark:text-slate-300 lowercase font-medium">
                    deduct public holidays:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarState((prev) => ({ ...prev, deductHolidays: !prev.deductHolidays }))
                    }
                    className={`px-3 py-1 rounded-full text-xs font-normal lowercase transition-colors border ${
                      calendarState.deductHolidays
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-transparent'
                    }`}
                  >
                    {calendarState.deductHolidays ? 'enabled' : 'disabled'}
                  </button>
                </div>

                {/* Scheduled Public Holidays Listing & Mini-form */}
                <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-normal text-slate-800 dark:text-slate-200 lowercase">
                      scheduled public holidays
                    </span>
                    <span className="text-[11px] text-slate-400 lowercase">
                      {calendarState.holidays.length} holidays scheduled
                    </span>
                  </div>

                  {/* Add Holiday Form */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="holiday name"
                      value={newHolidayName}
                      onChange={(e) => setNewHolidayName(e.target.value)}
                      className={`flex-1 min-w-[140px] p-2 rounded-xl border text-xs font-normal lowercase ${
                        isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC]'
                      }`}
                    />
                    <input
                      type="date"
                      value={newHolidayDate}
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      className={`p-2 rounded-xl border text-xs font-normal ${
                        isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newHolidayName && newHolidayDate) {
                          setCalendarState((prev) => ({
                            ...prev,
                            holidays: [
                              ...prev.holidays,
                              { id: `h-${Date.now()}`, name: newHolidayName, date: newHolidayDate },
                            ],
                          }));
                          setNewHolidayName('');
                          setNewHolidayDate('');
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#254d70] text-white text-xs lowercase font-bold shadow-2xs transition-colors"
                    >
                      + add holiday
                    </button>
                  </div>

                  {/* Scheduled Holidays List */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1">
                    {calendarState.holidays.map((h, idx) => (
                      <div
                        key={h.id || idx}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs lowercase bg-white dark:bg-[#0E1322]"
                      >
                        <div>
                          <div className="text-slate-800 dark:text-slate-200 font-medium">{h.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{h.date}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setCalendarState((prev) => ({
                              ...prev,
                              holidays: prev.holidays.filter((_, i) => i !== idx),
                            }))
                          }
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete holiday"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Days Worked Chart (placed directly below holidays as requested) */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <DaysWorkedChart
                    theme={theme}
                    monthlyCalendar={monthlyCalendar60}
                    businessName={calendarState.businessName}
                    startDate={calendarState.startDate}
                    workingDays={calendarState.workingDays}
                    deductHolidays={calendarState.deductHolidays}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Revenue Data Entry */}
            {activeStep === 2 && (
              <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block pb-2 border-b border-slate-200 dark:border-slate-800">
                  REVENUE STREAM DIALS
                </span>

                <div className="space-y-3">
                  {modelState.revenueItems.map((item, idx) => (
                    <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white flex justify-between">
                        <span>{item.name}</span>
                        <span className="text-[#2E5E88] dark:text-[#5584B4]">Tier {idx + 1}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-slate-500 block mb-1">Unit Price (R):</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setModelState((prev) => ({
                                ...prev,
                                revenueItems: prev.revenueItems.map((r, i) => (i === idx ? { ...r, unitPrice: val } : r)),
                              }));
                            }}
                            className={`w-full p-2 rounded-xl border font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-1">Cost of Sales %:</label>
                          <input
                            type="number"
                            value={item.costOfSalesPct}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setModelState((prev) => ({
                                ...prev,
                                revenueItems: prev.revenueItems.map((r, i) => (i === idx ? { ...r, costOfSalesPct: val } : r)),
                              }));
                            }}
                            className={`w-full p-2 rounded-xl border font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-1">Initial Monthly Units:</label>
                          <input
                            type="number"
                            value={item.monthlyUnits[0] || 100}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setModelState((prev) => ({
                                ...prev,
                                revenueItems: prev.revenueItems.map((r, i) => {
                                  if (i === idx) {
                                    const nextUnits = [...r.monthlyUnits];
                                    nextUnits[0] = val;
                                    return { ...r, monthlyUnits: nextUnits };
                                  }
                                  return r;
                                }),
                              }));
                            }}
                            className={`w-full p-2 rounded-xl border font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Employment Data Entry (Redacted for Education) */}
            {activeStep === 3 && (
              <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                    CORE EMPLOYMENT ROLES (REDACTED EDUCATIONAL MODEL)
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[#2E5E88] dark:text-[#5584B4]">
                    High-Level Archetype
                  </span>
                </div>

                <div className="space-y-2.5">
                  {modelState.employmentItems.map((emp, idx) => (
                    <div key={emp.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{emp.title}</div>
                        <div className="text-[10px] text-slate-500 capitalize">{emp.department} · {emp.numEmployees} headcount</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Monthly Base (R):</span>
                        <input
                          type="number"
                          value={emp.baseRateMonthly}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setModelState((prev) => ({
                              ...prev,
                              employmentItems: prev.employmentItems.map((em, i) => (i === idx ? { ...em, baseRateMonthly: val } : em)),
                            }));
                          }}
                          className={`w-24 p-1.5 rounded-lg border text-right font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Operating Expenses Data Entry (Redacted for Education) */}
            {activeStep === 4 && (
              <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block pb-2 border-b border-slate-200 dark:border-slate-800">
                  OPERATING OVERHEADS & OPEX ALLOCATIONS (REDACTED)
                </span>

                <div className="space-y-2">
                  {modelState.expenses.map((exp, idx) => (
                    <div key={exp.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{exp.name}</div>
                        <div className="text-[10px] text-slate-400">{exp.category}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Monthly (R):</span>
                        <input
                          type="number"
                          value={exp.monthlyAmount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setModelState((prev) => ({
                              ...prev,
                              expenses: prev.expenses.map((ex, i) => (i === idx ? { ...ex, monthlyAmount: val } : ex)),
                            }));
                          }}
                          className={`w-24 p-1.5 rounded-lg border text-right font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Fixed Assets Data Entry (Redacted for Education) */}
            {activeStep === 5 && (
              <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block pb-2 border-b border-slate-200 dark:border-slate-800">
                  PRIMARY CAPITAL ASSETS & EQUIPMENT (REDACTED)
                </span>

                <div className="space-y-2.5">
                  {modelState.fixedAssets.map((asset, idx) => (
                    <div key={asset.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{asset.name}</div>
                        <div className="text-[10px] text-slate-400">Useful Life: {asset.usefulLifeMonths} mos · Month {asset.purchaseMonth} purchase</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Capex (R):</span>
                        <input
                          type="number"
                          value={asset.purchaseCost}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setModelState((prev) => ({
                              ...prev,
                              fixedAssets: prev.fixedAssets.map((fa, i) => (i === idx ? { ...fa, purchaseCost: val } : fa)),
                            }));
                          }}
                          className={`w-28 p-1.5 rounded-lg border text-right font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Funding Data Entry */}
            {activeStep === 6 && (
              <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block pb-2 border-b border-slate-200 dark:border-slate-800">
                  CAPITALIZATION & FUNDING STRUCTURE
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-500 block mb-1">Founder Equity (R):</label>
                    <input
                      type="number"
                      value={modelState.funding.founderEquity}
                      onChange={(e) =>
                        setModelState((prev) => ({
                          ...prev,
                          funding: { ...prev.funding, founderEquity: Number(e.target.value) },
                        }))
                      }
                      className={`w-full p-2 rounded-xl border font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Investor Equity (R):</label>
                    <input
                      type="number"
                      value={modelState.funding.investorEquity}
                      onChange={(e) =>
                        setModelState((prev) => ({
                          ...prev,
                          funding: { ...prev.funding, investorEquity: Number(e.target.value) },
                        }))
                      }
                      className={`w-full p-2 rounded-xl border font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Bank Term Loan (R):</label>
                    <input
                      type="number"
                      value={modelState.funding.bankLoanAmount}
                      onChange={(e) =>
                        setModelState((prev) => ({
                          ...prev,
                          funding: { ...prev.funding, bankLoanAmount: Number(e.target.value) },
                        }))
                      }
                      className={`w-full p-2 rounded-xl border font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Overdraft Limit (R):</label>
                    <input
                      type="number"
                      value={modelState.funding.overdraftLimit}
                      onChange={(e) =>
                        setModelState((prev) => ({
                          ...prev,
                          funding: { ...prev.funding, overdraftLimit: Number(e.target.value) },
                        }))
                      }
                      className={`w-full p-2 rounded-xl border font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: STEP 1 RESULTS (OPERATING CALENDAR & ASSUMPTION ELEMENT CHARTS) */}
        {/* =================================================================== */}
        {activeStep === 1 && activeTab === 'results' && (
          <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-150">
            {/* 1. Operating Calendar Summary (Exact BizzCalc Page 3 style) */}
            <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                    OPERATING CALENDAR RHYTHMS — bizzbean learning enterprise
                  </h2>
                  <p className="text-[11px] text-slate-500 lowercase mt-0.5">
                    start date: {calendarState.startDate} · working days: {Object.entries(calendarState.workingDays).filter(([, v]) => v).map(([d]) => d.slice(0, 3)).join(', ')} · public holidays: {calendarState.deductHolidays ? 'deducted' : 'ignored'}
                  </p>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  operating sync active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
                  <span className="text-xs text-slate-500 lowercase">calendar days:</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                    {step1YearFilter === 'all' ? totalCalendarDays60 : activeYearCalendarDays}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
                  <span className="text-xs text-slate-500 lowercase">days not worked:</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                    {step1YearFilter === 'all' ? (totalCalendarDays60 - totalDaysWorked60) : (activeYearCalendarDays - activeYearDaysWorked)}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
                  <span className="text-xs text-slate-500 lowercase font-medium">days worked:</span>
                  <span className="text-sm font-bold text-[#2E5E88] dark:text-[#5584B4] font-mono">
                    {step1YearFilter === 'all' ? totalDaysWorked60 : activeYearDaysWorked}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Controls Header: Filter by Years & Filter by Assumption Element */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#101626] border border-[#D8CEBC] dark:border-[#222F4C] flex flex-wrap items-center justify-between gap-3">
              {/* Year Filter: Y1 to Y5, or All 5 Years */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 font-bold lowercase">filter by years:</span>
                <div className="flex items-center p-0.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F1C] text-xs">
                  {[1, 2, 3, 4, 5].map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setStep1YearFilter(yr)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        step1YearFilter === yr
                          ? 'bg-[#2E5E88] text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Year {yr}
                    </button>
                  ))}
                  <button
                    onClick={() => setStep1YearFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      step1YearFilter === 'all'
                        ? 'bg-[#2E5E88] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All 5 Years (60m)
                  </button>
                </div>
              </div>

              {/* Element Filter: All or individual element */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500 font-bold lowercase">element:</span>
                {[
                  { id: 'all', label: 'all 4 elements' },
                  { id: 'interest-pos', label: 'interest (+)' },
                  { id: 'interest-neg', label: 'interest (-)' },
                  { id: 'vat-rate', label: 'vat rate' },
                  { id: 'tax-rate', label: 'tax rate' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStep1ElementFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border lowercase ${
                      step1ElementFilter === tab.id
                        ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                        : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Dynamic Base Rate Adjustment Tool Testing Callout */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#2E5E88]/10 via-[#2E5E88]/5 to-transparent border border-[#2E5E88]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4] shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>testing dynamic base rate adjustments:</strong> Adjust rates in the <em>assumptions</em> tab using sliders or voice commands, and observe the instant live changes across all 5 years in these charts.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('assumptions')}
                className="px-3 py-1 rounded-xl bg-[#2E5E88] hover:bg-[#254d70] text-white font-bold transition-colors lowercase shrink-0"
              >
                switch to assumptions tab →
              </button>
            </div>

            {/* 4. Assumption Element Charts (BizzCalc Bar Chart Styling) */}
            <div className={`grid gap-5 ${step1ElementFilter === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {currentStepAssumptions
                .filter((a) => step1ElementFilter === 'all' || a.id === step1ElementFilter)
                .map((assump) => (
                  <AssumptionElementChart
                    key={assump.id}
                    theme={theme}
                    item={assump}
                    yearFilter={step1YearFilter}
                    startDate={calendarState.startDate}
                    onSelectForAdjustment={() => {
                      setSelectedAssumptionId(assump.id);
                      setActiveTab('assumptions');
                    }}
                  />
                ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: STEP 7 REPORTS OR GLOBAL REPORTS                             */}
        {/* =================================================================== */}
        {((activeStep !== 1 && activeTab === 'results') || activeStep === 7) && (
          <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-150">
            {/* Reports Navigation Carousel & Horizon Filter */}
            <ReportsCarousel
              theme={theme}
              activeReportTab={activeReportTab}
              onSelectReportTab={setActiveReportTab}
              reportHorizonYear={reportHorizonYear}
              onSelectHorizonYear={setReportHorizonYear}
            />

            {/* =================================================================== */}
            {/* 1. LIQUIDITY VS DEBT (LIQUIDITY-FUNDING) — DUAL-AXIS TRAJECTORY     */}
            {/* =================================================================== */}
            {activeReportTab === 'liquidity-funding' && (
              <div className="space-y-6">
                {/* Dual-Axis Composed Chart Section */}
                <div
                  className={`rounded-2xl border overflow-hidden ${
                    isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
                  }`}
                >
                  <LiquidityVsDebtChart
                    data={reportColumns}
                    isDark={isDark}
                    currencyPrefix="R "
                    title={
                      reportHorizonYear === 'summary'
                        ? '1. LIQUIDITY VS DEBT — 5-YEAR ANNUAL TRAJECTORY (Y1 – Y5)'
                        : `1. LIQUIDITY VS DEBT — YEAR ${reportHorizonYear} (12 MONTHS)`
                    }
                  />
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Avg Bank Balance
                    </span>
                    <span className="text-base font-bold text-emerald-500 mt-1 block">
                      R{' '}
                      {Math.round(
                        reportColumns.reduce((s, c) => s + c.bank_balance_closing, 0) /
                          Math.max(1, reportColumns.length)
                      ).toLocaleString()}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border ${
                      isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Peak Cash Reserves
                    </span>
                    <span className="text-base font-bold text-emerald-500 mt-1 block">
                      R {Math.max(...reportColumns.map((c) => c.bank_balance_closing)).toLocaleString()}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border ${
                      isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Closing Term Debt (IBD)
                    </span>
                    <span className="text-base font-bold text-rose-500 mt-1 block">
                      R{' '}
                      {Math.abs(
                        reportColumns[reportColumns.length - 1]?.term_loan_balance || 0
                      ).toLocaleString()}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border ${
                      isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Net Position (Cash - IBD)
                    </span>
                    {(() => {
                      const net =
                        (reportColumns[reportColumns.length - 1]?.bank_balance_closing || 0) -
                        Math.abs(reportColumns[reportColumns.length - 1]?.term_loan_balance || 0);
                      return (
                        <span
                          className={`text-base font-bold mt-1 block ${
                            net >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          R {net.toLocaleString()}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* V1 Authentic Data Table Breakdown */}
                <BizzReportSection
                  title={`LIQUIDITY VS DEBT BREAKDOWN — ${
                    reportHorizonYear === 'summary' ? '5-YEAR SUMMARY' : `YEAR ${reportHorizonYear}`
                  }`}
                  subtitle="Derived from monthly cumulative cash balance (m.bank_balance_closing) & term loan balances (m.term_loan_balance)"
                  badge="V1 METRICS"
                  badgeColor="emerald"
                  isDark={isDark}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead
                        className={`border-b text-[11px] ${
                          isDark
                            ? 'bg-[#0E1322] border-[#222F4C] text-slate-400'
                            : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-600'
                        }`}
                      >
                        <tr>
                          <th className="p-2.5 pl-4 min-w-[240px]">METRIC / DATA SOURCE</th>
                          {reportColumns.map((col) => (
                            <th
                              key={col.id}
                              className={`p-2.5 text-right ${
                                col.isTotal
                                  ? 'min-w-[95px] bg-[#2E5E88]/15 dark:bg-[#2E5E88]/25 text-[#2E5E88] dark:text-[#5584B4] font-bold'
                                  : 'min-w-[85px]'
                              }`}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {/* 1. Bank Balance */}
                        <tr className="font-bold bg-slate-50/50 dark:bg-slate-900/30">
                          <td className="p-2.5 pl-4 text-slate-900 dark:text-white">
                            Bank Balance (m.bank_balance_closing)
                          </td>
                          {reportColumns.map((col) => (
                            <td
                              key={col.id}
                              className={`p-2.5 text-right ${
                                col.isTotal
                                  ? 'bg-[#2E5E88]/5 dark:bg-[#2E5E88]/15 font-bold border-l border-slate-200 dark:border-slate-800'
                                  : ''
                              } ${
                                col.bank_balance_closing >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'
                              }`}
                            >
                              R {col.bank_balance_closing.toLocaleString()}
                            </td>
                          ))}
                        </tr>

                        {/* 2. Bank Overdraft */}
                        <tr className="text-slate-600 dark:text-slate-400">
                          <td className="p-2.5 pl-4">
                            Overdraft Facility (Deficit Cash Borrowings)
                          </td>
                          {reportColumns.map((col) => (
                            <td
                              key={col.id}
                              className={`p-2.5 text-right ${
                                col.isTotal
                                  ? 'bg-[#2E5E88]/5 dark:bg-[#2E5E88]/15 font-bold border-l border-slate-200 dark:border-slate-800'
                                  : ''
                              } ${
                                col.bank_balance_closing < 0 ? 'text-rose-400 font-bold' : 'text-slate-400'
                              }`}
                            >
                              {col.bank_balance_closing < 0
                                ? `R ${Math.abs(col.bank_balance_closing).toLocaleString()}`
                                : 'R 0'}
                            </td>
                          ))}
                        </tr>

                        {/* 3. Interest-Bearing Debt */}
                        <tr className="text-slate-600 dark:text-slate-400">
                          <td className="p-2.5 pl-4 text-rose-500 font-medium">
                            Interest-Bearing Debt (m.term_loan_balance)
                          </td>
                          {reportColumns.map((col) => (
                            <td
                              key={col.id}
                              className={`p-2.5 text-right ${
                                col.isTotal
                                  ? 'bg-[#2E5E88]/5 dark:bg-[#2E5E88]/15 font-bold border-l border-slate-200 dark:border-slate-800'
                                  : ''
                              } text-rose-400 font-semibold`}
                            >
                              R {Math.abs(col.term_loan_balance).toLocaleString()}
                            </td>
                          ))}
                        </tr>

                        {/* 4. Total Debt Obligations */}
                        <tr className="text-slate-600 dark:text-slate-400">
                          <td className="p-2.5 pl-4">
                            Total Debt Obligations (IBD + Overdraft)
                          </td>
                          {reportColumns.map((col) => {
                            const totalDebt =
                              Math.abs(col.term_loan_balance) +
                              (col.bank_balance_closing < 0 ? Math.abs(col.bank_balance_closing) : 0);
                            return (
                              <td
                                key={col.id}
                                className={`p-2.5 text-right ${
                                  col.isTotal
                                    ? 'bg-[#2E5E88]/5 dark:bg-[#2E5E88]/15 font-bold border-l border-slate-200 dark:border-slate-800'
                                    : ''
                                } text-rose-500 font-bold`}
                              >
                                R {totalDebt.toLocaleString()}
                              </td>
                            );
                          })}
                        </tr>

                        {/* 5. Net Liquidity Position */}
                        <tr className="font-bold text-sm bg-slate-100 dark:bg-[#1E2548] border-t-2 border-slate-300 dark:border-slate-700">
                          <td className="p-2.5 pl-4 uppercase text-slate-900 dark:text-white">
                            NET LIQUIDITY POSITION (Cash - IBD)
                          </td>
                          {reportColumns.map((col) => {
                            const net = col.bank_balance_closing - Math.abs(col.term_loan_balance);
                            return (
                              <td
                                key={col.id}
                                className={`p-2.5 text-right ${
                                  col.isTotal
                                    ? 'bg-[#2E5E88]/5 dark:bg-[#2E5E88]/15 font-bold border-l border-slate-200 dark:border-slate-800'
                                    : ''
                                } ${
                                  net >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'
                                }`}
                              >
                                R {net.toLocaleString()}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </BizzReportSection>
              </div>
            )}

            {/* =================================================================== */}
            {/* 2. EXECUTIVE SUMMARY (SUMMARY & GROWTH-TRAJECTORY)                  */}
            {/* =================================================================== */}
            {/* =================================================================== */}
            {/* 2. EXECUTIVE SUMMARY (CHARTS + KEY RATIOS TABLE)                    */}
            {/* =================================================================== */}
            {activeReportTab === 'summary' && (() => {
              const capital =
                (modelState.funding?.founderEquity || 0) +
                (modelState.funding?.investorEquity || 0);

              const totalEmployees =
                modelState.employmentItems?.reduce(
                  (sum, e) => sum + (e.numEmployees || 0),
                  0
                ) || 1;

              // Dual-Axis Chart Data 1: Efficiency Trajectory (ROS % & ROA % vs Asset Turn x)
              const efficiencyData: EfficiencyChartDataPoint[] = years.map((y) => {
                const yr = yearData[y - 1];
                const rev = yr.revenue || 1;
                const noa = yr.net_operating_assets || 1;
                const nop = yr.net_operating_profit;
                const ros = (nop / rev) * 100;
                const assetTurn = rev / noa;
                const roa = (nop / noa) * 100;
                return {
                  year: y,
                  label: `Year ${y}`,
                  ros: Number(ros.toFixed(2)),
                  roa: Number(roa.toFixed(2)),
                  assetTurn: Number(assetTurn.toFixed(2)),
                };
              });

              // Multi-Metric Chart Data 2: Capital Structure & Returns (ROE %, Debt/Equity x, EPS)
              const returnsData: ReturnsChartDataPoint[] = years.map((y) => {
                const yr = yearData[y - 1];
                const prior =
                  y === 1
                    ? 0
                    : yearData.slice(0, y - 1).reduce((sum, item) => sum + item.retained_earnings, 0);
                const shEquity = capital + prior + yr.retained_earnings;
                const overdraft =
                  yr.bank_balance_closing < 0 ? Math.abs(yr.bank_balance_closing) : 0;
                const ibd = yr.term_loan_balance + overdraft;
                const roe = shEquity !== 0 ? (yr.taxed_profits / shEquity) * 100 : 0;
                const debtEquity = shEquity !== 0 ? ibd / shEquity : 0;
                const eps =
                  yr.shares_in_issue > 0 ? yr.taxed_profits / yr.shares_in_issue : 0;

                return {
                  year: y,
                  label: `Year ${y}`,
                  roe: Number(roe.toFixed(2)),
                  debtEquity: Number(debtEquity.toFixed(2)),
                  eps: Number(eps.toFixed(2)),
                };
              });

              // V1 Key Ratios Table line items matching key_ratios_74f218cb.png
              const executiveSummaryRows: BizzReportTableRow[] = [
                // 1. MARGINS
                { label: 'margins', isSectionHeader: true },
                {
                  label: 'gross profit %',
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    return yr.revenue > 0
                      ? `${((yr.gross_profit / yr.revenue) * 100).toFixed(1)}%`
                      : '0.0%';
                  }),
                },
                {
                  label: 'other income %',
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    return yr.revenue > 0
                      ? `${((yr.other_inc / yr.revenue) * 100).toFixed(1)}%`
                      : '0.0%';
                  }),
                },
                {
                  label: 'total income %',
                  highlight: true,
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    return yr.revenue > 0
                      ? `${((yr.total_income / yr.revenue) * 100).toFixed(1)}%`
                      : '0.0%';
                  }),
                },
                {
                  label: 'expenses %',
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    return yr.revenue > 0
                      ? `${((yr.ex_total / yr.revenue) * 100).toFixed(1)}%`
                      : '0.0%';
                  }),
                },
                {
                  label: 'net operating profit %',
                  highlight: true,
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    return yr.revenue > 0
                      ? `${((yr.net_operating_profit / yr.revenue) * 100).toFixed(1)}%`
                      : '0.0%';
                  }),
                },
                {
                  label: 'interest %',
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    return yr.revenue > 0
                      ? `${((yr.interest_total / yr.revenue) * 100).toFixed(1)}%`
                      : '0.0%';
                  }),
                },
                {
                  label: 'taxation %',
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    return yr.revenue > 0
                      ? `${((yr.taxation / yr.revenue) * 100).toFixed(1)}%`
                      : '0.0%';
                  }),
                },
                {
                  label: 'taxed profits %',
                  highlight: true,
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    return yr.revenue > 0
                      ? `${((yr.taxed_profits / yr.revenue) * 100).toFixed(1)}%`
                      : '0.0%';
                  }),
                },

                // 2. EFFICIENCY (RED BOX ELEMENTS)
                { label: 'efficiency', isSectionHeader: true },
                {
                  label: 'return on sales',
                  highlight: true,
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    return yr.revenue > 0
                      ? `${((yr.net_operating_profit / yr.revenue) * 100).toFixed(1)}%`
                      : '0.0%';
                  }),
                },
                {
                  label: 'asset turn',
                  highlight: true,
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    const noa = yr.net_operating_assets || 1;
                    return `${(yr.revenue / noa).toFixed(2)}`;
                  }),
                },
                {
                  label: 'return on net operating assets',
                  highlight: true,
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    const noa = yr.net_operating_assets || 1;
                    return `${((yr.net_operating_profit / noa) * 100).toFixed(1)}%`;
                  }),
                },
                {
                  label: 'expense / income ratio',
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    const totInc = yr.total_income || 1;
                    return `${((yr.ex_total / totInc) * 100).toFixed(1)}%`;
                  }),
                },
                {
                  label: 'interest cover',
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    if (yr.interest_total <= 0) return 'n/a';
                    return `${(yr.net_operating_profit / yr.interest_total).toFixed(2)}`;
                  }),
                },
                {
                  label: 'expense cover (mts)',
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    const monthlyExp = (yr.ex_total || 1) / 12;
                    return `${(yr.bank_balance_closing / monthlyExp).toFixed(1)}`;
                  }),
                },
                {
                  label: 'return on equity',
                  highlight: true,
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    const prior =
                      y === 1
                        ? 0
                        : yearData.slice(0, y - 1).reduce((sum, item) => sum + item.retained_earnings, 0);
                    const shEquity = capital + prior + yr.retained_earnings;
                    return shEquity !== 0
                      ? `${((yr.taxed_profits / shEquity) * 100).toFixed(1)}%`
                      : '0.0%';
                  }),
                },
                {
                  label: 'debt / equity ratio',
                  highlight: true,
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    const prior =
                      y === 1
                        ? 0
                        : yearData.slice(0, y - 1).reduce((sum, item) => sum + item.retained_earnings, 0);
                    const shEquity = capital + prior + yr.retained_earnings;
                    const overdraft =
                      yr.bank_balance_closing < 0 ? Math.abs(yr.bank_balance_closing) : 0;
                    const ibd = yr.term_loan_balance + overdraft;
                    return shEquity !== 0 ? `${(ibd / shEquity).toFixed(2)}` : '0.00';
                  }),
                },
                {
                  label: 'earnings per share',
                  highlight: true,
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    const eps =
                      yr.shares_in_issue > 0 ? yr.taxed_profits / yr.shares_in_issue : 0;
                    return eps >= 0 ? `R ${eps.toFixed(2)}` : `-R ${Math.abs(eps).toFixed(2)}`;
                  }),
                },

                // 3. PRODUCTIVITY
                { label: 'productivity', isSectionHeader: true },
                {
                  label: 'number of employees',
                  values: years.map(() => totalEmployees),
                },
                {
                  label: 'employee revenue',
                  values: years.map((y) =>
                    Math.round(yearData[y - 1].revenue / totalEmployees)
                  ),
                },
                {
                  label: 'employee gross profit',
                  values: years.map((y) =>
                    Math.round(yearData[y - 1].gross_profit / totalEmployees)
                  ),
                },
                {
                  label: 'employee total income',
                  values: years.map((y) =>
                    Math.round(yearData[y - 1].total_income / totalEmployees)
                  ),
                },
                {
                  label: 'employee expenses',
                  values: years.map((y) =>
                    Math.round(yearData[y - 1].ex_total / totalEmployees)
                  ),
                },
                {
                  label: 'employee nop',
                  highlight: true,
                  values: years.map((y) =>
                    Math.round(yearData[y - 1].net_operating_profit / totalEmployees)
                  ),
                },
              ];

              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Chart 1: Dual-Axis Efficiency Trajectory (Red Box 1: ROS & ROA vs Asset Turn) */}
                  <ExecutiveEfficiencyChart
                    data={efficiencyData}
                    isDark={isDark}
                    title="1. EFFICIENCY TRAJECTORY: RETURN ON SALES (ROS) & ROA VS ASSET TURN (DUAL-AXIS)"
                  />

                  {/* Chart 2: Capital Structure & Shareholder Returns (Red Box 2: ROE, Debt/Equity & EPS) */}
                  <ExecutiveReturnsChart
                    data={returnsData}
                    isDark={isDark}
                    currencyPrefix="R "
                    title="2. CAPITAL STRUCTURE & SHAREHOLDER VALUE: RETURN ON EQUITY, DEBT/EQUITY & EPS"
                  />

                  {/* Complete Key Ratios Report Table */}
                  <BizzReportTable
                    title="key ratios"
                    firstColumnLabel="key ratios"
                    years={years}
                    rows={executiveSummaryRows}
                    isDark={isDark}
                  />
                </div>
              );
            })()}

            {/* =================================================================== */}
            {/* 3. TRADING ACCOUNT (TRADING SUMMARY + EMBEDDED BREAKEVEN)           */}
            {/* =================================================================== */}
            {activeReportTab === 'trading-account' && (() => {
              const tradingSummaryRows: BizzReportTableRow[] = [
                { label: 'unit sales', values: years.map((y) => yearData[y - 1].unitSales) },
                { label: 'revenue', highlight: true, values: years.map((y) => yearData[y - 1].revenue) },
                { label: 'cost of sales', highlight: true, values: years.map((y) => -yearData[y - 1].total_cos) },
                { label: 'cost of sales - variable', values: years.map((y) => -yearData[y - 1].cos_variable) },
                { label: 'cost of sales - fixed', highlight: true, values: years.map((y) => -yearData[y - 1].cos_fixed) },
                { label: 'employment', indent: true, values: years.map((y) => -yearData[y - 1].cos_employment) },
                { label: 'depreciation', indent: true, values: years.map((y) => -yearData[y - 1].cos_depreciation) },
                { label: 'lease', indent: true, values: years.map((y) => -yearData[y - 1].cos_lease) },
                { label: 'overheads', indent: true, values: years.map((y) => -yearData[y - 1].cos_overheads) },
                { label: 'gross profit', highlight: true, values: years.map((y) => yearData[y - 1].gross_profit) },
                { label: 'gross profit adjustments', values: years.map((y) => -yearData[y - 1].gp_adjustments) },
                { label: 'remaining gross profit', highlight: true, values: years.map((y) => yearData[y - 1].remaining_gp) },
                { label: 'other income', values: years.map((y) => yearData[y - 1].other_inc) },
                { label: 'total income', highlight: true, values: years.map((y) => yearData[y - 1].total_income) },
                { label: 'expenses - total', highlight: true, values: years.map((y) => -yearData[y - 1].ex_total) },
                { label: 'expenses - variable', values: years.map((y) => -yearData[y - 1].ex_variable) },
                { label: 'expenses - fixed', highlight: true, values: years.map((y) => -yearData[y - 1].ex_fixed) },
                { label: 'employment', indent: true, values: years.map((y) => -yearData[y - 1].ex_employment) },
                { label: 'depreciation', indent: true, values: years.map((y) => -yearData[y - 1].ex_depreciation) },
                { label: 'lease', indent: true, values: years.map((y) => -yearData[y - 1].ex_lease) },
                { label: 'overheads', indent: true, values: years.map((y) => -yearData[y - 1].ex_overheads) },
                { label: 'net operating profit', highlight: true, values: years.map((y) => yearData[y - 1].net_operating_profit) },
              ];

              // Embedded Breakeven Analysis (per user request: treated as part of trading account)
              const breakevenRows: BizzReportTableRow[] = [
                { label: 'turnover', values: years.map((y) => yearData[y - 1].revenue) },
                { label: 'expenses - fixed', values: years.map((y) => yearData[y - 1].cos_fixed + yearData[y - 1].ex_fixed) },
                {
                  label: 'gross profit %',
                  formatValue: (val) => formatReportPercent(val),
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    return yr.revenue > 0 ? (yr.gross_profit / yr.revenue) * 100 : 0;
                  }),
                },
                {
                  label: 'breakeven turnover',
                  highlight: true,
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    const fixedTotal = yr.cos_fixed + yr.ex_fixed;
                    const gpMargin = yr.revenue > 0 ? yr.gross_profit / yr.revenue : 0;
                    return gpMargin > 0 ? Math.round(fixedTotal / gpMargin) : 0;
                  }),
                },
              ];

              return (
                <div className="space-y-8 animate-in fade-in duration-200">
                  {/* 1. Trading Summary Table */}
                  <BizzReportTable
                    title="trading summary"
                    firstColumnLabel="account line"
                    years={years}
                    rows={tradingSummaryRows}
                    isDark={isDark}
                  />

                  {/* 2. Breakeven Table (Integrated directly into Trading Account view) */}
                  <BizzReportTable
                    title="breakeven"
                    firstColumnLabel="account line"
                    years={years}
                    rows={breakevenRows}
                    isDark={isDark}
                  />

                  {/* 3. Gross Profit Adjustments Details Sub-Table */}
                  <div className="pt-2" id="gp-adjustments-report-section">
                    <BizzReportTable
                      title="gross profit adjustments details"
                      firstColumnLabel="gross profit adjustments"
                      years={years}
                      rows={[
                        { label: 'sales commission', values: years.map((y) => yearData[y - 1].sales_commission) },
                        { label: 'inventory adjustments', values: years.map((y) => yearData[y - 1].inventory_adjustments) },
                        { label: 'manufacturing variance', values: years.map((y) => yearData[y - 1].manufacturing_variance) },
                        { label: 'gross profit adjustments', highlight: true, values: years.map((y) => yearData[y - 1].gp_adjustments) },
                      ]}
                      isDark={isDark}
                    />
                  </div>
                </div>
              );
            })()}

            {/* =================================================================== */}
            {/* 4. TRADING ACCOUNT DISTRIBUTION (5-YEAR ANNUAL)                     */}
            {/* =================================================================== */}
            {activeReportTab === 'trading-distribution' && (() => {
              const getDistPct = (val: number, revenue: number, isNeg: boolean = false) => {
                if (!revenue || revenue === 0) return 0;
                const computedVal = isNeg && val > 0 ? -val : val;
                return (computedVal / revenue) * 100;
              };

              const distRows: BizzReportTableRow[] = [
                { label: 'cost of sales', highlight: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].total_cos, yearData[y - 1].revenue, true)) },
                { label: 'cost of sales - variable', formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].cos_variable, yearData[y - 1].revenue, true)) },
                { label: 'cost of sales - fixed', highlight: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].cos_fixed, yearData[y - 1].revenue, true)) },
                { label: 'employment', indent: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].cos_employment, yearData[y - 1].revenue, true)) },
                { label: 'depreciation', indent: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].cos_depreciation, yearData[y - 1].revenue, true)) },
                { label: 'lease', indent: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].cos_lease, yearData[y - 1].revenue, true)) },
                { label: 'overheads', indent: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].cos_overheads, yearData[y - 1].revenue, true)) },
                { label: 'gross profit', highlight: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].gross_profit, yearData[y - 1].revenue, false)) },
                { label: 'gross profit adjustments', formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].gp_adjustments, yearData[y - 1].revenue, true)) },
                { label: 'remaining gross profit', highlight: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].remaining_gp, yearData[y - 1].revenue, false)) },
                { label: 'other income', formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].other_inc, yearData[y - 1].revenue, false)) },
                { label: 'total income', highlight: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].total_income, yearData[y - 1].revenue, false)) },
                { label: 'expenses - total', highlight: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].ex_total, yearData[y - 1].revenue, true)) },
                { label: 'expenses - variable', formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].ex_variable, yearData[y - 1].revenue, true)) },
                { label: 'expenses - fixed', highlight: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].ex_fixed, yearData[y - 1].revenue, true)) },
                { label: 'employment', indent: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].ex_employment, yearData[y - 1].revenue, true)) },
                { label: 'depreciation', indent: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].ex_depreciation, yearData[y - 1].revenue, true)) },
                { label: 'lease', indent: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].ex_lease, yearData[y - 1].revenue, true)) },
                { label: 'overheads', indent: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].ex_overheads, yearData[y - 1].revenue, true)) },
                { label: 'net operating profit', highlight: true, formatValue: (v) => formatReportPercent(v), values: years.map((y) => getDistPct(yearData[y - 1].net_operating_profit, yearData[y - 1].revenue, false)) },
              ];

              return (
                <div className="animate-in fade-in duration-200">
                  <BizzReportTable
                    title="trading summary - distribution (5-year annual)"
                    firstColumnLabel="account line"
                    years={years}
                    rows={distRows}
                    isDark={isDark}
                  />
                </div>
              );
            })()}

            {/* =================================================================== */}
            {/* 5. INCOME STATEMENT (5-YEAR ANNUAL)                                 */}
            {/* =================================================================== */}
            {activeReportTab === 'income-statement' && (() => {
              const incomeStatementRows: BizzReportTableRow[] = [
                { label: 'revenue', values: years.map((y) => yearData[y - 1].revenue) },
                { label: 'net operating profit', highlight: true, values: years.map((y) => yearData[y - 1].net_operating_profit) },
                { label: 'interest - other', indent: true, values: years.map((y) => yearData[y - 1].interest_other) },
                { label: 'interest - term loan', indent: true, values: years.map((y) => -yearData[y - 1].interest_tl) },
                { label: 'interest', highlight: true, values: years.map((y) => -yearData[y - 1].interest_total) },
                { label: 'net profit', highlight: true, values: years.map((y) => yearData[y - 1].net_profit_before_tax) },
                { label: 'profit / loss on sale of fixed assets', values: years.map(() => 0) },
                { label: 'net profit before taxation', highlight: true, values: years.map((y) => yearData[y - 1].net_profit_before_tax) },
                { label: 'taxation', values: years.map((y) => -yearData[y - 1].taxation) },
                { label: 'taxed profits', highlight: true, values: years.map((y) => yearData[y - 1].taxed_profits) },
                { label: 'dividends', values: years.map((y) => -yearData[y - 1].dividends) },
                { label: 'retained earnings', highlight: true, values: years.map((y) => yearData[y - 1].retained_earnings) },
              ];

              return (
                <div className="animate-in fade-in duration-200">
                  <BizzReportTable
                    title="income statement"
                    firstColumnLabel="period"
                    years={years}
                    rows={incomeStatementRows}
                    isDark={isDark}
                  />
                </div>
              );
            })()}

            {/* =================================================================== */}
            {/* 6. BALANCE SHEET (5-YEAR ANNUAL)                                    */}
            {/* =================================================================== */}
            {activeReportTab === 'balance-sheet' && (() => {
              const capital =
                (modelState.funding?.founderEquity || 0) + (modelState.funding?.investorEquity || 0);

              const balanceSheetRows: BizzReportTableRow[] = [
                { label: 'fixed assets', values: years.map((y) => yearData[y - 1].fixed_assets_net) },
                { label: 'inventory', indent: true, values: years.map((y) => yearData[y - 1].inventory) },
                { label: 'accounts receivables', indent: true, values: years.map((y) => yearData[y - 1].accounts_receivable) },
                { label: 'other assets', indent: true, values: years.map((y) => yearData[y - 1].other_assets) },
                { label: 'vat receivable', indent: true, values: years.map((y) => yearData[y - 1].vat_receivable) },
                {
                  label: 'current assets',
                  highlight: true,
                  values: years.map(
                    (y) =>
                      yearData[y - 1].inventory +
                      yearData[y - 1].accounts_receivable +
                      yearData[y - 1].other_assets +
                      yearData[y - 1].vat_receivable
                  ),
                },
                {
                  label: 'total assets',
                  highlight: true,
                  values: years.map((y) => {
                    const ca =
                      yearData[y - 1].inventory +
                      yearData[y - 1].accounts_receivable +
                      yearData[y - 1].other_assets +
                      yearData[y - 1].vat_receivable;
                    return yearData[y - 1].fixed_assets_net + ca;
                  }),
                },
                { label: 'accounts payable', values: years.map((y) => yearData[y - 1].accounts_payable) },
                { label: 'vat payable', values: years.map((y) => yearData[y - 1].vat_payable) },
                { label: 'taxation payable', values: years.map((y) => yearData[y - 1].taxation_payable) },
                {
                  label: 'non-interest bearing debt',
                  highlight: true,
                  values: years.map(
                    (y) =>
                      yearData[y - 1].accounts_payable +
                      yearData[y - 1].vat_payable +
                      yearData[y - 1].taxation_payable
                  ),
                },
                {
                  label: 'net operating assets',
                  highlight: true,
                  values: years.map((y) => {
                    const ca =
                      yearData[y - 1].inventory +
                      yearData[y - 1].accounts_receivable +
                      yearData[y - 1].other_assets +
                      yearData[y - 1].vat_receivable;
                    const ta = yearData[y - 1].fixed_assets_net + ca;
                    const nibd =
                      yearData[y - 1].accounts_payable +
                      yearData[y - 1].vat_payable +
                      yearData[y - 1].taxation_payable;
                    return ta - nibd;
                  }),
                },
                { label: 'financed by', isSectionHeader: true },
                { label: 'shares in issue', values: years.map((y) => yearData[y - 1].shares_in_issue) },
                { label: "shareholders' capital", values: years.map(() => capital) },
                { label: 'equity loan', values: years.map(() => 0) },
                {
                  label: 'retained earnings - prior',
                  values: years.map((y) => {
                    if (y === 1) return '';
                    return yearData.slice(0, y - 1).reduce((sum, yr) => sum + yr.retained_earnings, 0);
                  }),
                },
                { label: 'retained earnings - current', values: years.map((y) => yearData[y - 1].retained_earnings) },
                {
                  label: "shareholders' equity",
                  highlight: true,
                  values: years.map((y) => {
                    const prior = y === 1 ? 0 : yearData.slice(0, y - 1).reduce((sum, yr) => sum + yr.retained_earnings, 0);
                    return capital + prior + yearData[y - 1].retained_earnings;
                  }),
                },
                { label: 'bank balance', values: years.map((y) => yearData[y - 1].bank_balance_closing) },
                { label: 'term loan', values: years.map((y) => yearData[y - 1].term_loan_balance) },
                {
                  label: 'interest-bearing debt',
                  highlight: true,
                  values: years.map((y) => {
                    const yr = yearData[y - 1];
                    const overdraft = yr.bank_balance_closing < 0 ? Math.abs(yr.bank_balance_closing) : 0;
                    return yr.term_loan_balance + overdraft;
                  }),
                },
                {
                  label: 'capital employed',
                  highlight: true,
                  values: years.map((y) => {
                    const prior = y === 1 ? 0 : yearData.slice(0, y - 1).reduce((sum, yr) => sum + yr.retained_earnings, 0);
                    const shEquity = capital + prior + yearData[y - 1].retained_earnings;
                    const yr = yearData[y - 1];
                    const overdraft = yr.bank_balance_closing < 0 ? Math.abs(yr.bank_balance_closing) : 0;
                    return shEquity + yr.term_loan_balance + overdraft;
                  }),
                },
                {
                  label: 'equity',
                  values: years.map((y) => {
                    const prior = y === 1 ? 0 : yearData.slice(0, y - 1).reduce((sum, yr) => sum + yr.retained_earnings, 0);
                    return capital + prior + yearData[y - 1].retained_earnings;
                  }),
                },
              ];

              return (
                <div className="animate-in fade-in duration-200">
                  <BizzReportTable
                    title="balance sheet"
                    firstColumnLabel="period"
                    years={years}
                    rows={balanceSheetRows}
                    isDark={isDark}
                  />
                </div>
              );
            })()}

            {/* =================================================================== */}
            {/* 7. CASH FLOW STATEMENT (5-YEAR ANNUAL)                              */}
            {/* =================================================================== */}
            {activeReportTab === 'cash-flow' && (() => {
              const cashFlowRows: BizzReportTableRow[] = [
                { label: 'bank balance - opening', values: years.map((y) => yearData[y - 1].bank_balance_opening) },
                { label: 'net operating profit', values: years.map((y) => yearData[y - 1].net_operating_profit) },
                { label: 'interest - other', indent: true, values: years.map((y) => yearData[y - 1].interest_other) },
                { label: 'interest - term loan', indent: true, values: years.map((y) => -yearData[y - 1].interest_tl) },
                { label: 'interest', highlight: true, values: years.map((y) => -yearData[y - 1].interest_total) },
                { label: 'sub total', highlight: true, values: years.map((y) => yearData[y - 1].net_operating_profit - yearData[y - 1].interest_total) },
                { label: 'profit / loss on sale of fixed assets', values: years.map(() => 0) },
                { label: 'taxation', values: years.map((y) => -yearData[y - 1].taxation) },
                { label: 'dividends', values: years.map((y) => -yearData[y - 1].dividends) },
                { label: 'cash from operations', highlight: true, values: years.map((y) => yearData[y - 1].cash_from_operations) },
                { label: 'inventory', values: years.map((y) => -yearData[y - 1].inv_change) },
                { label: 'accounts receivables', values: years.map((y) => -yearData[y - 1].ar_change) },
                { label: 'other assets', values: years.map((y) => -yearData[y - 1].oa_change) },
                { label: 'vat receivable', values: years.map((y) => -yearData[y - 1].vat_rec_change) },
                { label: 'accounts payables', values: years.map((y) => yearData[y - 1].ap_change) },
                { label: 'vat payable', values: years.map((y) => yearData[y - 1].vat_pay_change) },
                { label: 'taxation', values: years.map((y) => yearData[y - 1].taxation) },
                { label: 'change in working capital', highlight: true, values: years.map((y) => yearData[y - 1].change_in_working_capital) },
                { label: 'capital expenditure', values: years.map((y) => -yearData[y - 1].capex) },
                { label: 'depreciation write back', values: years.map((y) => yearData[y - 1].dep_writeback) },
                { label: 'net proceeds from the sale of fixed asset', values: years.map(() => 0) },
                { label: 'application to capital assets', highlight: true, values: years.map((y) => yearData[y - 1].application_to_capital_assets) },
                { label: 'share capital', values: years.map((y) => yearData[y - 1].share_capital_change) },
                { label: 'equity loan', values: years.map((y) => yearData[y - 1].equity_loan_change) },
                { label: 'term loan', values: years.map((y) => yearData[y - 1].loan_change) },
                { label: 'change in funding', highlight: true, values: years.map((y) => yearData[y - 1].change_in_funding) },
                { label: 'cashflow', highlight: true, values: years.map((y) => yearData[y - 1].cashflow) },
                { label: 'bank balance - closing', highlight: true, values: years.map((y) => yearData[y - 1].bank_balance_closing) },
                { label: 'bank balance - check', highlight: true, values: years.map((y) => yearData[y - 1].bank_balance_closing) },
              ];

              return (
                <div className="animate-in fade-in duration-200">
                  <BizzReportTable
                    title="cash flow statement"
                    firstColumnLabel="period"
                    years={years}
                    rows={cashFlowRows}
                    isDark={isDark}
                  />
                </div>
              );
            })()}

            {/* =================================================================== */}
            {/* 8. VAT CALCULATION (VAT LEDGER & TAX CALCULATION)                   */}
            {/* =================================================================== */}
            {/* =================================================================== */}
            {/* 8. VAT CALCULATION (5-YEAR VAT CALCULATION & PAYMENTS AT M12)       */}
            {/* =================================================================== */}
            {activeReportTab === 'vat-ledger' && (() => {
              const vatRatePercent = (modelState.businessDetails as any)?.vatRate || 15;
              const simMonths = projections;
              const fiveYearMonths = [simMonths[11], simMonths[23], simMonths[35], simMonths[47], simMonths[59]].map(
                (m) => m || ({} as any)
              );

              return (
                <div className="space-y-8">
                  {/* 5-Year VAT Calculation */}
                  <BizzReportSection title="5-year vat calculation (month 12 of each year)" isDark={isDark}>
                    <div className={BizzTableClass}>
                      <div className="min-w-[700px]">
                        <div className={BizzTableHeaderClass}>
                          <div className={BizzTableHeaderCellClass}>vat calculation line</div>
                          {years.map((y) => (
                            <div key={y} className={BizzTableHeaderCellClass + ' text-right font-bold'}>
                              year {y} (m{y * 12})
                            </div>
                          ))}
                        </div>
                        <div className={BizzTableContainerClass}>
                          {[
                            { label: 'Revenue', id: 'rev' },
                            { label: 'Fixed Assets Sold', id: 'fa_sold' },
                            { label: 'Fixed Assets Purchased', id: 'fa_purchased' },
                            { label: 'Cost of Sales', id: 'cos' },
                            { label: 'Operating Expenses', id: 'opex' },
                            { label: 'Add Back - Employment', id: 'employment' },
                            { label: 'Add Back - Depreciation', id: 'depreciation' },
                            { label: 'Vatable Amount', id: 'vatable_amount', highlight: true },
                            { label: 'VAT', id: 'vat_calc', highlight: true },
                          ].map((row, i) => (
                            <div key={i} className={BizzTableRowClass + (row.highlight ? ' bg-bizz-total/30 font-bold' : '')}>
                              <div className={`${BizzTableCellClass} lowercase`}>{row.label}</div>
                              {fiveYearMonths.map((m: any, idx) => {
                                let val = 0;
                                if (row.id === 'rev') val = m.vat_revenue ?? m.revenue ?? 0;
                                else if (row.id === 'fa_sold') val = m.vat_fa_sold ?? 0;
                                else if (row.id === 'fa_purchased') val = m.vat_fa_purchased ?? 0;
                                else if (row.id === 'cos') val = m.vat_cos ?? -(m.cogs || 0);
                                else if (row.id === 'opex') val = m.vat_opex ?? -(m.operatingExpenses || 0);
                                else if (row.id === 'employment') val = m.vat_addback_employment ?? m.employmentExpenses ?? 0;
                                else if (row.id === 'depreciation') val = m.vat_addback_depreciation ?? m.depreciation ?? 0;
                                else if (row.id === 'vatable_amount') val = m.vatable_amount ?? m.vatableAmount ?? 0;
                                else if (row.id === 'vat_calc') val = m.vat_calc_value ?? m.vatCalcValue ?? 0;

                                return (
                                  <div key={idx} className={`${BizzTableCellClass} text-right tabular-nums`}>
                                    {formatNumeric(val)}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </BizzReportSection>

                  {/* 5-Year VAT Payments & Settlement */}
                  <BizzReportSection title="5-year vat payments (month 12 of each year)" isDark={isDark}>
                    <div className={BizzTableClass}>
                      <div className="min-w-[700px]">
                        <div className={BizzTableHeaderClass}>
                          <div className={BizzTableHeaderCellClass}>vat payment line</div>
                          {years.map((y) => (
                            <div key={y} className={BizzTableHeaderCellClass + ' text-right font-bold'}>
                              year {y} (m{y * 12})
                            </div>
                          ))}
                        </div>
                        <div className={BizzTableContainerClass}>
                          {[
                            { label: 'Opening Balance', id: 'opening' },
                            { label: 'Account Balance', id: 'account_balance' },
                            { label: 'Settlement', id: 'settlement' },
                            { label: 'Closing Balance', id: 'closing', highlight: true },
                            { label: 'VAT Receivable', id: 'receivable' },
                            { label: 'VAT Payable', id: 'payable' },
                          ].map((row, i) => (
                            <div key={i} className={BizzTableRowClass + (row.highlight ? ' bg-bizz-total/30 font-bold' : '')}>
                              <div className={`${BizzTableCellClass} lowercase`}>{row.label}</div>
                              {fiveYearMonths.map((m: any, idx) => {
                                let val = 0;
                                if (row.id === 'opening') val = m.vat_opening_balance ?? m.vatOpeningBalance ?? 0;
                                else if (row.id === 'account_balance') val = m.vat_account_balance ?? ((m.vatOpeningBalance ?? 0) + (m.vatCalcValue ?? 0));
                                else if (row.id === 'settlement') val = m.vat_settlement ?? m.vatSettlement ?? 0;
                                else if (row.id === 'closing') val = m.vat_closing_balance ?? m.vatClosingBalance ?? 0;
                                else if (row.id === 'receivable') val = m.vat_receivable ?? m.vatReceivable ?? 0;
                                else if (row.id === 'payable') val = m.vat_payable ?? m.vatPayable ?? 0;

                                return (
                                  <div key={idx} className={`${BizzTableCellClass} text-right tabular-nums`}>
                                    {row.id === 'opening' && val === 0 ? '-' : formatNumeric(val)}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </BizzReportSection>
                </div>
              );
            })()}

            {/* =================================================================== */}
            {/* 9. ASSUMPTIONS SCHEDULE & BASE RATES MATRIX                         */}
            {/* =================================================================== */}
            {/* =================================================================== */}
            {/* 9. ASSUMPTIONS (CORE WORKING CAPITAL, MACRO & DEPRECIATION RATES)   */}
            {/* =================================================================== */}
            {activeReportTab === 'assumptions' && (() => {
              const getWorkingDaysForMonth = (mOffset: number, setup?: any) => {
                if (setup?.tradingDays?.[mOffset] !== undefined) return setup.tradingDays[mOffset];
                if (setup?.workingDaysPerMonth) return setup.workingDaysPerMonth;
                const startYear = setup?.startYear || 2026;
                const startMonth = setup?.startMonth || 1;
                const d = new Date(startYear, (startMonth - 1) + mOffset, 1);
                const year = d.getFullYear();
                const month = d.getMonth();
                const totalDays = new Date(year, month + 1, 0).getDate();
                let workingDays = 0;
                for (let day = 1; day <= totalDays; day++) {
                  const dayOfWeek = new Date(year, month, day).getDay();
                  if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    workingDays++;
                  }
                }
                return workingDays;
              };

              const setupObj = (modelState.businessDetails as any) || {};
              const getWorkingDaysForYear = (y: number) => {
                let daysWorked = 0;
                const startMonthOffset = (y - 1) * 12;
                for (let mOffset = startMonthOffset; mOffset < startMonthOffset + 12; mOffset++) {
                  daysWorked += getWorkingDaysForMonth(mOffset, setupObj);
                }
                return daysWorked;
              };

              const yearlyTradingDays = [1, 2, 3, 4, 5].map((y) => getWorkingDaysForYear(y));

              const positiveBaseRate = (modelState.funding as any)?.positiveBaseRate ?? (modelState.funding as any)?.interestRates?.positiveBase ?? 4.5;
              const negativeBaseRate = (modelState.funding as any)?.negativeBaseRate ?? (modelState.funding as any)?.interestRates?.negativeBase ?? 11.75;
              const vatRateBase = (modelState.businessDetails as any)?.vatRate ?? 15;
              const taxRateBase = (modelState.businessDetails as any)?.taxRate ?? 27;
              const inventoryDaysBase = (modelState.funding as any)?.inventoryDays ?? (modelState.funding as any)?.workingCapital?.inventoryDays?.base ?? 30;
              const receivableDaysBase = (modelState.funding as any)?.debtorDays ?? (modelState.funding as any)?.workingCapital?.receivableDays?.base ?? 30;
              const payableDaysBase = (modelState.funding as any)?.creditorDays ?? (modelState.funding as any)?.workingCapital?.payableDays?.base ?? 30;

              const assumptionsList = [
                { label: 'trading days', value: yearlyTradingDays, isPercent: false },
                { label: 'interest rate - positive balance', value: positiveBaseRate, isPercent: true },
                { label: 'interest rate - negative balance', value: negativeBaseRate, isPercent: true },
                { label: 'vat rate %', value: vatRateBase, isPercent: true },
                { label: 'tax rate %', value: taxRateBase, isPercent: true },
                { label: 'days inventory', value: inventoryDaysBase, isPercent: false },
                { label: 'days receivable', value: receivableDaysBase, isPercent: false },
                { label: 'days payable', value: payableDaysBase, isPercent: false },
              ];

              const depreciationRates = [
                { label: 'commercial vehicles', value: 20.00 },
                { label: 'computer hardware', value: 33.33 },
                { label: 'computer software', value: 33.33 },
                { label: 'furniture and fittings', value: 16.67 },
                { label: 'handling equipment', value: 25.00 },
                { label: 'leasehold improvements', value: 16.67 },
                { label: 'office equipment', value: 16.67 },
                { label: 'passenger vehicles', value: 20.00 },
                { label: 'plant and equipment', value: 16.67 },
                { label: 'security equipment', value: 20.00 },
                { label: 'workshop equipment', value: 20.00 },
              ];

              const formatPercent = (val: number | string) => {
                const num = typeof val === 'number' ? val : parseFloat(val as string);
                return isNaN(num) ? '0.00%' : `${num.toFixed(2)}%`;
              };

              return (
                <BizzReportSection title="assumptions" isDark={isDark}>
                  <div className="space-y-8">
                    {/* Core Working Capital & Macro Assumptions */}
                    <div className={BizzTableClass}>
                      <div className="min-w-[700px]">
                        <div className={BizzTableHeaderClass}>
                          <div className={BizzTableHeaderCellClass}>period</div>
                          {years.map((y) => (
                            <div key={y} className={BizzTableHeaderCellClass + ' text-right font-bold'}>
                              year {y}
                            </div>
                          ))}
                        </div>
                        <div className={BizzTableContainerClass}>
                          {assumptionsList.map((row, i) => (
                            <div key={i} className={BizzTableRowClass}>
                              <div className={BizzTableCellClass + ' lowercase'}>{row.label}</div>
                              {years.map((y) => {
                                const val = Array.isArray(row.value) ? row.value[y - 1] : row.value;
                                return (
                                  <div key={y} className={BizzTableCellClass + ' text-right tabular-nums'}>
                                    {row.isPercent ? formatPercent(val) : val}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Fixed Asset Depreciation Rates */}
                    <div className={BizzTableClass}>
                      <div className="min-w-[700px]">
                        <div className={`px-3 py-2 text-bizz-blue text-[10px] font-bold lowercase border-b-[0.5px] border-bizz-blue ${isDark ? 'bg-[#0E1322]' : 'bg-white'}`}>
                          fixed asset depreciation rates
                        </div>
                        <div className={BizzTableContainerClass}>
                          {depreciationRates.map((row, i) => (
                            <div key={i} className="grid grid-cols-[300px_1fr] border-b-[0.5px] border-bizz-blue/20">
                              <div className={BizzTableCellClass + ' lowercase border-r-[0.5px] border-bizz-blue/20'}>{row.label}</div>
                              <div className={BizzTableCellClass + ' text-left tabular-nums px-4'}>
                                {formatPercent(row.value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </BizzReportSection>
              );
            })()}
          </div>
        )}
      </main>

      {/* ===================================================================== */}
      {/* 4. BOTTOM STEP NAVIGATION DOCK: 7 STEP ICONS (REDUCED HEIGHT DOCK)    */}
      {/* ===================================================================== */}
      <footer
        className={`px-3 py-1 border-t shrink-0 flex items-center justify-around gap-1 sm:gap-2 h-11 sm:h-12 max-h-12 rounded-b-2xl ${
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
                  if (st.id === 7) {
                    setActiveTab('results');
                  } else if (activeTab === 'results') {
                    setActiveTab('assumptions');
                  }
                }}
                className={`p-1 rounded-xl transition-all flex flex-col items-center justify-center border ${
                  isActive
                    ? isDark
                      ? 'bg-[#1C2642] border-[#5584B4] ring-1.5 ring-[#5584B4]/40 shadow-xs'
                      : 'bg-[#E3EDF6] border-[#2E5E88] ring-1.5 ring-[#2E5E88]/30 shadow-xs'
                    : isDark
                    ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A] hover:border-slate-500'
                    : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC] hover:border-[#2E5E88]/60 shadow-2xs'
                }`}
                aria-label={st.name}
              >
                <div className="w-5 h-5 sm:w-5.5 sm:h-5.5 flex items-center justify-center">
                  <img
                    src={encodeURI(st.icon)}
                    alt={st.name}
                    className="w-full h-full object-contain mix-blend-multiply dark:bg-white dark:rounded dark:p-0.5"
                  />
                </div>
              </button>

              {/* Hover Tooltip displaying step label */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                <div className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold lowercase whitespace-nowrap shadow-md flex items-center gap-1.5">
                  <span>0{st.id}</span>
                  <span>·</span>
                  <span>{st.name}</span>
                </div>
                <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-0.5" />
              </div>
            </div>
          );
        })}
      </footer>

      {/* ===================================================================== */}
      {/* 5. MODALS: ASSISTANCE GUIDANCE MODAL & MODELLING SUITE OVERVIEW       */}
      {/* ===================================================================== */}
      {/* Assistance Guidance Modal */}
      {showAssistanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-xl overflow-hidden font-mono ${
              isDark ? 'bg-[#0E1322] border-[#222F4C] text-slate-200' : 'bg-white border-[#D8CEBC] text-slate-800'
            }`}
          >
            {/* Header with /help.jpg */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs lowercase font-bold text-[#2E5E88] dark:text-[#5584B4]">
                <img src="/help.jpg" alt="help" className="w-4 h-4 object-contain mix-blend-multiply dark:bg-white dark:rounded-xs dark:p-0.5" />
                <span className="text-slate-400">/</span>
                <img src={encodeURI(currentStepDef.icon)} alt={currentStepDef.name} className="w-4 h-4 object-contain mix-blend-multiply dark:bg-white dark:rounded-xs dark:p-0.5" />
                <span>{currentStepDef.name} assistance</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAssistanceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Assistance Content */}
            <div className="p-5 space-y-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#2E5E88] dark:text-blue-300">
                <strong>BizzDynamics Educational Purpose:</strong> This application focuses on foundational business physics, value-based content, and dynamic 5-year rate adjustments before creating a comprehensive business plan.
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase mb-1">
                  How to Use the Base Rate Adjustment Tool:
                </h4>
                <ul className="space-y-1 list-disc pl-4">
                  <li>In the <strong>assumptions</strong> tab, click any radio button alongside a base rate.</li>
                  <li>The assumption immediately displays in the tool at the bottom of the page.</li>
                  <li>Use the <strong>1 – 5 Year Slider</strong> to scrub across Years 1 to 5.</li>
                  <li>Edit any of the 12 month cells (either as a percentage or numeric value).</li>
                  <li>Click the <strong>microphone icon</strong> to make voice changes (e.g. <em>"set month 4 to 5%"</em> or <em>"increase all by 1%"</em>).</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAssistanceModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-[#2E5E88] text-white text-xs font-bold hover:bg-[#254d70] transition-colors"
                >
                  understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modelling Suite Architecture Modal (Page 1) */}
      <ModellingSuiteModal
        theme={theme}
        isOpen={showSuiteModal}
        onClose={() => setShowSuiteModal(false)}
        currentApp="bizzdynamics"
        onSelectApp={(appId) => {
          if (onContextSwitch) {
            onContextSwitch(appId);
          }
        }}
      />
    </div>
  );
};
export default BizzDynamics;
