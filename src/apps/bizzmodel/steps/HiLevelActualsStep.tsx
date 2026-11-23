import React, { useMemo } from 'react';
import {
  ArrowRight,
  Building2,
  Calculator,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Scale,
  Sliders,
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  BizzModelState,
  EMPTY_HILEVEL_YTD_ACTUALS,
  HiLevelYtdActuals,
  PlatformForecastAppId,
  SAMPLE_HILEVEL_YTD_ACTUALS,
  createDefaultRollingForecastState,
} from '../constants';
import { calculate60MonthWorkingCalendar } from '../utils/calendarCalc';
import {
  calculateFinancialModelProjections,
  deriveHiLevelForecastMetrics,
} from '../utils/revenueCalc';

interface HiLevelActualsStepProps {
  theme?: 'light' | 'dark';
  mode: PlatformForecastAppId;
  state: BizzModelState;
  onUpdateState: (updater: (prev: BizzModelState) => BizzModelState) => void;
  subTab?: 'assumptions' | 'results' | 'charts';
  onSelectSubTab?: (tab: 'assumptions' | 'results' | 'charts') => void;
  onNavigateStep?: (step: string, fundingTab?: 'dynamics' | 'what-if') => void;
}

const fmtR = (val: number) => {
  const rounded = Math.round(val || 0);
  const absStr = Math.abs(rounded).toLocaleString('en-ZA');
  return rounded < 0 ? `-R ${absStr}` : `R ${absStr}`;
};

const fmtNum = (val: number, decimals = 1) => {
  if (!Number.isFinite(val)) return '0';
  return val.toLocaleString('en-ZA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const HiLevelActualsStep: React.FC<HiLevelActualsStepProps> = ({
  theme = 'light',
  mode,
  state,
  onUpdateState,
  subTab = 'assumptions',
  onNavigateStep,
}) => {
  const isDark = theme === 'dark';

  const actuals: HiLevelYtdActuals = state.hiLevelActuals || EMPTY_HILEVEL_YTD_ACTUALS;

  const calendar60 = useMemo(
    () => calculate60MonthWorkingCalendar(state.businessDetails),
    [state.businessDetails]
  );

  const derived = useMemo(() => deriveHiLevelForecastMetrics(state), [state]);

  const projections = useMemo(
    () => calculateFinancialModelProjections(state, 60, undefined, mode),
    [state, mode]
  );

  // Sync a HiLevelYtdActuals patch AND keep Funding WC days & Other Assets aligned
  const handlePatchActuals = (patch: Partial<HiLevelYtdActuals>) => {
    onUpdateState((prev) => {
      const nextActuals: HiLevelYtdActuals = {
        ...(prev.hiLevelActuals || EMPTY_HILEVEL_YTD_ACTUALS),
        ...patch,
      };
      const draftState: BizzModelState = {
        ...prev,
        hiLevelActuals: nextActuals,
      };
      const nextDerived = deriveHiLevelForecastMetrics(draftState);

      const invDays = Math.max(0, Math.round(nextDerived.derivedInventoryDays));
      const recDays = Math.max(0, Math.round(nextDerived.derivedReceivableDays));
      const payDays = Math.max(0, Math.round(nextDerived.derivedPayableDays));

      const fundingPatch: Partial<BizzModelState['funding']> = {
        inventoryDays: invDays,
        debtorDays: recDays,
        creditorDays: payDays,
        inventoryDaysMonthly: new Array(60).fill(invDays),
        debtorDaysMonthly: new Array(60).fill(recDays),
        creditorDaysMonthly: new Array(60).fill(payDays),
      };

      if (patch.bsDeposits !== undefined) {
        fundingPatch.depositsBase = nextActuals.bsDeposits;
        fundingPatch.depositsMonthly = new Array(60).fill(nextActuals.bsDeposits);
      }
      if (patch.bsFloats !== undefined) {
        fundingPatch.floatsBase = nextActuals.bsFloats;
        fundingPatch.floatsMonthly = new Array(60).fill(nextActuals.bsFloats);
      }
      if (patch.bsPettyCash !== undefined) {
        fundingPatch.pettyCashBase = nextActuals.bsPettyCash;
        fundingPatch.pettyCashMonthly = new Array(60).fill(nextActuals.bsPettyCash);
      }

      return {
        ...draftState,
        funding: {
          ...prev.funding,
          ...fundingPatch,
        },
      };
    });
  };

  const handleLoadSample = () => {
    const sampleState = createDefaultRollingForecastState();
    onUpdateState((prev) => {
      const draft: BizzModelState = {
        ...prev,
        fixedAssets: prev.fixedAssets && prev.fixedAssets.length > 0 ? prev.fixedAssets : sampleState.fixedAssets,
        funding: {
          ...prev.funding,
          initialSharesCount:
            (prev.funding.initialSharesCount || 0) > 0
              ? prev.funding.initialSharesCount
              : sampleState.funding.initialSharesCount,
          initialSharePrice:
            (prev.funding.initialSharePrice || 0) > 0
              ? prev.funding.initialSharePrice
              : sampleState.funding.initialSharePrice,
          equityLoanOpening:
            prev.funding.equityLoanOpening !== 0
              ? prev.funding.equityLoanOpening
              : sampleState.funding.equityLoanOpening,
          termLoans:
            prev.funding.termLoans && prev.funding.termLoans.length > 0
              ? prev.funding.termLoans
              : sampleState.funding.termLoans,
          depositsBase: SAMPLE_HILEVEL_YTD_ACTUALS.bsDeposits,
          floatsBase: SAMPLE_HILEVEL_YTD_ACTUALS.bsFloats,
          pettyCashBase: SAMPLE_HILEVEL_YTD_ACTUALS.bsPettyCash,
          depositsMonthly: new Array(60).fill(SAMPLE_HILEVEL_YTD_ACTUALS.bsDeposits),
          floatsMonthly: new Array(60).fill(SAMPLE_HILEVEL_YTD_ACTUALS.bsFloats),
          pettyCashMonthly: new Array(60).fill(SAMPLE_HILEVEL_YTD_ACTUALS.bsPettyCash),
        },
        hiLevelActuals: { ...SAMPLE_HILEVEL_YTD_ACTUALS },
      };
      const d = deriveHiLevelForecastMetrics(draft);
      const invD = Math.max(0, Math.round(d.derivedInventoryDays));
      const recD = Math.max(0, Math.round(d.derivedReceivableDays));
      const payD = Math.max(0, Math.round(d.derivedPayableDays));
      return {
        ...draft,
        funding: {
          ...draft.funding,
          inventoryDays: invD,
          debtorDays: recD,
          creditorDays: payD,
          inventoryDaysMonthly: new Array(60).fill(invD),
          debtorDaysMonthly: new Array(60).fill(recD),
          creditorDaysMonthly: new Array(60).fill(payD),
        },
      };
    });
  };

  const handleResetToZero = () => {
    handlePatchActuals({
      ...EMPTY_HILEVEL_YTD_ACTUALS,
      updateMonth: actuals.updateMonth || 3,
      projectionBasis: actuals.projectionBasis || 'distribution',
    });
  };

  const handleAutoBalanceRetainedEarnings = () => {
    // Adjust Opening Retained Earnings so Total Assets === Total Equity & Liabilities
    const adjusted = Math.round((actuals.bsOpeningRetainedEarnings || 0) + derived.balanceDifference);
    handlePatchActuals({ bsOpeningRetainedEarnings: adjusted });
  };

  // =========================================================================
  // RESULTS BRIDGE AGGREGATIONS (YTD Actuals vs Rest of Y1 vs Full Y1..Y5)
  // =========================================================================
  const bridgeColumns = useMemo(() => {
    const u = derived.updateMonth;
    const sumSlice = (startIdx: number, endIdxExclusive: number) => {
      const slice = projections.slice(startIdx, endIdxExclusive);
      const rev = slice.reduce((s, p) => s + (p.revenue || 0), 0);
      const cosVar = slice.reduce((s, p) => s + (p.cosVariable || 0), 0);
      const cosEmp = slice.reduce((s, p) => s + (p.cosEmployment || 0), 0);
      const cosOvh = slice.reduce((s, p) => s + (p.cosOverheads || 0), 0);
      const cosDepLease = slice.reduce((s, p) => s + (p.cosDepreciation || 0) + (p.cosLeases || 0), 0);
      const totalCos = slice.reduce((s, p) => s + (p.totalCos ?? p.cogs ?? 0), 0);
      const gp = rev - totalCos;
      const gpAdj = slice.reduce(
        (s, p) =>
          s +
          (p.gpAdjustmentsCommission || 0) +
          (p.gpAdjustmentsInventory || 0) +
          (p.gpAdjustmentsVariance || 0),
        0
      );
      const otherInc = slice.reduce((s, p) => s + (p.otherIncomeTotal || 0), 0);
      const totalInc = gp - gpAdj + otherInc;
      const opexEmp = slice.reduce((s, p) => s + (p.opexEmployment || 0), 0);
      const opexVar = slice.reduce((s, p) => s + (p.exVariable || 0), 0);
      const opexOvh = slice.reduce((s, p) => s + (p.exOverheads || 0), 0);
      const opexDepLease = slice.reduce((s, p) => s + (p.exDepreciation || 0) + (p.exLease || 0), 0);
      const totalOpex = slice.reduce((s, p) => s + (p.exTotal ?? p.operatingExpenses ?? 0), 0);
      const nop = totalInc - totalOpex;
      const finance = slice.reduce((s, p) => s + p.netFinanceCharges, 0);
      const npbt = nop - finance;
      const tax = slice.reduce((s, p) => s + p.taxationCit, 0);
      const npat = npbt - tax;
      const closingCash = slice.length > 0 ? slice[slice.length - 1].bank_balance_closing : 0;
      const closingDebt = slice.length > 0 ? slice[slice.length - 1].term_loan_balance : 0;
      return {
        rev,
        cosVar,
        cosEmp,
        cosOvh,
        cosDepLease,
        totalCos,
        gp,
        gpPct: rev > 0 ? (gp / rev) * 100 : 0,
        gpAdj,
        otherInc,
        totalInc,
        opexEmp,
        opexVar,
        opexOvh,
        opexDepLease,
        totalOpex,
        nop,
        nopPct: rev > 0 ? (nop / rev) * 100 : 0,
        finance,
        npbt,
        tax,
        npat,
        closingCash,
        closingDebt,
      };
    };

    return {
      ytd: sumSlice(0, u),
      restY1: sumSlice(u, 12),
      y1: sumSlice(0, 12),
      y2: sumSlice(12, 24),
      y3: sumSlice(24, 36),
      y4: sumSlice(36, 48),
      y5: sumSlice(48, 60),
    };
  }, [projections, derived.updateMonth]);

  // Year 1 Monthly Data for Chart 1 (YTD Actuals vs Forecast Months)
  const year1Months = useMemo(() => {
    return projections.slice(0, 12).map((p, idx) => ({
      monthNum: idx + 1,
      label: calendar60[idx]?.monthLabel?.slice(0, 3) || `M${idx + 1}`,
      isActual: idx + 1 <= derived.updateMonth,
      revenue: p.revenue,
      nop: p.netOperatingProfit,
      cash: p.bank_balance_closing,
    }));
  }, [projections, calendar60, derived.updateMonth]);

  const annualTrajectory = useMemo(() => {
    return [
      { label: 'Year 1', ...bridgeColumns.y1 },
      { label: 'Year 2', ...bridgeColumns.y2 },
      { label: 'Year 3', ...bridgeColumns.y3 },
      { label: 'Year 4', ...bridgeColumns.y4 },
      { label: 'Year 5', ...bridgeColumns.y5 },
    ];
  }, [bridgeColumns]);

  const isBalanced = Math.abs(derived.balanceDifference) <= 1;

  // Shared surface tokens (single-elevation flat bordered surfaces)
  const cardSurface = isDark
    ? 'bg-[#101626] border-[#222F4C]'
    : 'bg-white border-[#D8CEBC]';
  const subSurface = isDark
    ? 'bg-[#0C111E] border-[#1E2A45]'
    : 'bg-[#FAF8F5] border-[#E5DEC9]';
  const inputCls = isDark
    ? 'bg-[#0A0E1A] border-[#253352] text-white focus:border-[#5584B4] focus:outline-none'
    : 'bg-white border-[#D8CEBC] text-slate-900 focus:border-[#2E5E88] focus:outline-none';

  const renderNumberInput = (
    value: number,
    onChange: (num: number) => void,
    allowNegative = false
  ) => (
    <input
      type="number"
      step="any"
      min={allowNegative ? undefined : 0}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => {
        const parsed = parseFloat(e.target.value);
        onChange(Number.isFinite(parsed) ? parsed : 0);
      }}
      className={`w-28 sm:w-32 px-2.5 py-1 rounded-lg border text-right text-xs font-bold tabular-nums transition-colors ${inputCls}`}
    />
  );

  return (
    <div className={`space-y-5 font-mono select-none ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* ===================================================================== */}
      {/* HEADER BAR + ACTION CONTROLS                                          */}
      {/* ===================================================================== */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold uppercase tracking-tight text-slate-900 dark:text-white">
              MANAGEMENT ACCOUNTS · YTD ACTUALS & BALANCE SHEET
            </h1>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E5E88] dark:text-[#5584B4]">
              M1–M{derived.updateMonth} ACTUALS → M{derived.updateMonth + 1}–M60 FORECAST
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Capture year-to-date Trading Account and Balance Sheet closing values through{' '}
            <span className="font-bold text-slate-700 dark:text-slate-200">{derived.updateMonthLabel}</span>{' '}
            ({derived.elapsedWorkingDays} working days / {derived.elapsedCalendarDays} calendar days) to anchor the 60-month forecast and What-If engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSample}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold lowercase flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#141C30] border-[#253352] text-slate-300 hover:text-white hover:border-[#5584B4]'
                : 'bg-white border-[#D8CEBC] text-slate-700 hover:border-[#2E5E88] hover:text-[#2E5E88]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>load q1 sample</span>
          </button>

          <button
            type="button"
            onClick={handleResetToZero}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold lowercase flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#141C30] border-[#253352] text-slate-400 hover:text-white'
                : 'bg-white border-[#D8CEBC] text-slate-500 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>reset actuals</span>
          </button>

          {onNavigateStep && (
            <button
              type="button"
              onClick={() => onNavigateStep('funding', 'what-if')}
              className="px-3.5 py-1.5 rounded-xl bg-[#2E5E88] hover:bg-[#244C6F] text-white text-xs font-bold lowercase flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>open what-if simulator</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* KPI EXECUTIVE SUMMARY STRIP (4 SINGLE-ELEVATION CARDS)                */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className={`p-4 rounded-xl border ${cardSurface}`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            DERIVED DAILY REVENUE
          </div>
          <div className="mt-1.5 text-xl font-bold tabular-nums text-slate-900 dark:text-white">
            {fmtR(derived.dailyRevenue)}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> / day</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {fmtR(actuals.ytdRevenue)} ÷ {derived.elapsedWorkingDays} working days
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${cardSurface}`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            YTD MARGINS (GP / NOP)
          </div>
          <div className="mt-1.5 flex items-baseline gap-3 tabular-nums">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {fmtNum(derived.distributionPct.grossProfit, 1)}%
            </span>
            <span className="text-xs font-bold text-[#2E5E88] dark:text-[#5584B4]">
              NOP {fmtNum(derived.distributionPct.nop, 1)}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            GP {fmtR(derived.ytdGrossProfit)} · NOP {fmtR(derived.ytdNetOperatingProfit)}
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${cardSurface}`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            DERIVED WORKING CAPITAL CYCLE
          </div>
          <div className="mt-1.5 text-xl font-bold tabular-nums text-slate-900 dark:text-white">
            {fmtNum(derived.derivedCashConversionCycle, 1)}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> days</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            DIO {fmtNum(derived.derivedInventoryDays, 1)}d + DSO {fmtNum(derived.derivedReceivableDays, 1)}d − DPO {fmtNum(derived.derivedPayableDays, 1)}d
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${cardSurface}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              BALANCE SHEET CHECK
            </span>
            {isBalanced ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                balanced
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                out of balance
              </span>
            )}
          </div>
          <div
            className={`mt-1.5 text-xl font-bold tabular-nums ${
              isBalanced
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {isBalanced ? 'R 0' : fmtR(derived.balanceDifference)}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            <span>Assets {fmtR(derived.totalAssets)}</span>
            {!isBalanced && (
              <button
                type="button"
                onClick={handleAutoBalanceRetainedEarnings}
                className="text-[#2E5E88] dark:text-[#5584B4] hover:underline font-bold lowercase cursor-pointer"
              >
                auto-balance
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* FORECAST CONTROLS BAR (UPDATE MONTH, PROJECTION BASIS, GROWTH RATE)   */}
      {/* ===================================================================== */}
      <div className={`p-4 rounded-xl border ${cardSurface}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Update Month selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              update month (ytd cutoff)
            </label>
            <select
              value={derived.updateMonth}
              onChange={(e) => handlePatchActuals({ updateMonth: parseInt(e.target.value, 10) || 3 })}
              className={`w-full px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer ${inputCls}`}
            >
              {Array.from({ length: 12 }, (_, idx) => {
                const mNum = idx + 1;
                const label = calendar60[idx]?.monthLabel || `Month ${mNum}`;
                const cumWork = calendar60.slice(0, mNum).reduce((s, c) => s + c.daysWorked, 0);
                return (
                  <option key={mNum} value={mNum}>
                    Month {mNum} · {label} ({cumWork} working days YTD)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Projection Basis toggle */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              forecast cost projection basis (m{derived.updateMonth + 1}–m60)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handlePatchActuals({ projectionBasis: 'distribution' })}
                className={`px-2.5 py-2 rounded-lg border text-[11px] font-bold lowercase transition-colors cursor-pointer ${
                  actuals.projectionBasis !== 'fixed-run-rate'
                    ? 'bg-[#2E5E88] text-white border-[#2E5E88]'
                    : isDark
                    ? 'bg-[#0A0E1A] text-slate-400 border-[#253352] hover:text-white'
                    : 'bg-[#FAF8F5] text-slate-600 border-[#D8CEBC] hover:text-slate-900'
                }`}
              >
                % of revenue dist.
              </button>
              <button
                type="button"
                onClick={() => handlePatchActuals({ projectionBasis: 'fixed-run-rate' })}
                className={`px-2.5 py-2 rounded-lg border text-[11px] font-bold lowercase transition-colors cursor-pointer ${
                  actuals.projectionBasis === 'fixed-run-rate'
                    ? 'bg-[#2E5E88] text-white border-[#2E5E88]'
                    : isDark
                    ? 'bg-[#0A0E1A] text-slate-400 border-[#253352] hover:text-white'
                    : 'bg-[#FAF8F5] text-slate-600 border-[#D8CEBC] hover:text-slate-900'
                }`}
              >
                fixed monthly run-rate
              </button>
            </div>
          </div>

          {/* Annual Forecast Revenue Growth % */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              annual daily revenue growth (yrs 2–5)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                value={actuals.annualRevenueGrowthPct ?? 0}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  handlePatchActuals({ annualRevenueGrowthPct: Number.isFinite(v) ? v : 0 });
                }}
                className={`w-24 px-3 py-2 rounded-lg border text-right text-xs font-bold tabular-nums ${inputCls}`}
              />
              <span className="text-xs font-bold text-slate-500">% p.a.</span>
              <span className="text-[11px] text-slate-400 truncate">
                ({60 - derived.updateMonth} forecast months)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: ASSUMPTIONS — TWO MANAGEMENT ACCOUNTS FORMS                    */}
      {/* ===================================================================== */}
      {subTab === 'assumptions' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          {/* ----------------------------------------------------------------- */}
          {/* FORM 1: YTD TRADING ACCOUNT (MONTHS 1 .. UPDATE MONTH)            */}
          {/* ----------------------------------------------------------------- */}
          <div className={`rounded-2xl border overflow-hidden ${cardSurface}`}>
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    1. YTD TRADING ACCOUNT (M1–M{derived.updateMonth})
                  </h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    sets daily revenue & trading distribution for remaining {60 - derived.updateMonth} months
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400">excl. vat · zar</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {/* Column header */}
              <div className={`px-5 py-2 grid grid-cols-[1fr_auto_4.5rem] gap-3 text-[10px] font-bold uppercase text-slate-400 ${subSurface}`}>
                <span>account line</span>
                <span className="text-right w-28 sm:w-32">ytd actual (r)</span>
                <span className="text-right">% rev</span>
              </div>

              {/* Revenue */}
              <div className="px-5 py-2.5 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">revenue / turnover</div>
                  <div className="text-[10px] text-slate-500">
                    daily rate: {fmtR(derived.dailyRevenue)} × {derived.elapsedWorkingDays}d
                  </div>
                </div>
                {renderNumberInput(actuals.ytdRevenue, (v) => handlePatchActuals({ ytdRevenue: v }))}
                <div className="text-right font-bold tabular-nums text-[#2E5E88] dark:text-[#5584B4]">
                  100.0%
                </div>
              </div>

              {/* COST OF SALES section header */}
              <div className={`px-5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${subSurface}`}>
                cost of sales (direct)
              </div>

              <div className="px-5 py-2 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center">
                <span className="text-slate-700 dark:text-slate-300">materials, stock & direct variable cos</span>
                {renderNumberInput(actuals.ytdCosVariable, (v) => handlePatchActuals({ ytdCosVariable: v }))}
                <div className="text-right tabular-nums text-slate-500">
                  {fmtNum(derived.distributionPct.cosVariable, 1)}%
                </div>
              </div>

              <div className="px-5 py-2 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center">
                <span className="text-slate-700 dark:text-slate-300">direct employment (cos payroll)</span>
                {renderNumberInput(actuals.ytdCosEmployment, (v) => handlePatchActuals({ ytdCosEmployment: v }))}
                <div className="text-right tabular-nums text-slate-500">
                  {fmtNum(derived.distributionPct.cosEmployment, 1)}%
                </div>
              </div>

              <div className="px-5 py-2 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center">
                <span className="text-slate-700 dark:text-slate-300">direct production overheads</span>
                {renderNumberInput(actuals.ytdCosOverheads, (v) => handlePatchActuals({ ytdCosOverheads: v }))}
                <div className="text-right tabular-nums text-slate-500">
                  {fmtNum(derived.distributionPct.cosOverheads, 1)}%
                </div>
              </div>

              {/* Auto-linked Fixed Assets COS Depreciation & Leases */}
              <div className="px-5 py-2 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    cos depreciation & asset leases
                  </span>
                  {onNavigateStep && (
                    <button
                      type="button"
                      onClick={() => onNavigateStep('fixed-assets')}
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#2E5E88] dark:text-[#5584B4] hover:underline cursor-pointer"
                    >
                      <span>from fixed assets</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
                <div className="w-28 sm:w-32 text-right font-bold tabular-nums text-slate-700 dark:text-slate-300 pr-2.5">
                  {fmtR(derived.ytdCosDepreciation + derived.ytdCosLeases)}
                </div>
                <div className="text-right tabular-nums text-slate-500">
                  {fmtNum(derived.distributionPct.cosDepreciation + derived.distributionPct.cosLeases, 1)}%
                </div>
              </div>

              {/* GROSS PROFIT subtotal */}
              <div className={`px-5 py-2.5 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center font-bold ${subSurface}`}>
                <span className="uppercase text-slate-900 dark:text-white">gross profit</span>
                <span className="w-28 sm:w-32 text-right tabular-nums text-slate-900 dark:text-white pr-2.5">
                  {fmtR(derived.ytdGrossProfit)}
                </span>
                <span className="text-right tabular-nums text-[#2E5E88] dark:text-[#5584B4]">
                  {fmtNum(derived.distributionPct.grossProfit, 1)}%
                </span>
              </div>

              {/* GP Adjustments & Other Income */}
              <div className="px-5 py-2 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center">
                <span className="text-slate-700 dark:text-slate-300">less: sales commissions (gp adj.)</span>
                {renderNumberInput(actuals.ytdGpAdjCommission, (v) => handlePatchActuals({ ytdGpAdjCommission: v }))}
                <div className="text-right tabular-nums text-slate-500">
                  {fmtNum(actuals.ytdRevenue > 0 ? (actuals.ytdGpAdjCommission / actuals.ytdRevenue) * 100 : 0, 1)}%
                </div>
              </div>

              <div className="px-5 py-2 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center">
                <span className="text-slate-700 dark:text-slate-300">less: shrinkage / inventory & variance adj.</span>
                {renderNumberInput(actuals.ytdGpAdjInventory, (v) => handlePatchActuals({ ytdGpAdjInventory: v }))}
                <div className="text-right tabular-nums text-slate-500">
                  {fmtNum(actuals.ytdRevenue > 0 ? (actuals.ytdGpAdjInventory / actuals.ytdRevenue) * 100 : 0, 1)}%
                </div>
              </div>

              <div className="px-5 py-2 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center">
                <span className="text-slate-700 dark:text-slate-300">add: other operating income</span>
                {renderNumberInput(actuals.ytdOtherIncome, (v) => handlePatchActuals({ ytdOtherIncome: v }))}
                <div className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                  +{fmtNum(derived.distributionPct.otherIncome, 1)}%
                </div>
              </div>

              {/* OPERATING EXPENSES section header */}
              <div className={`px-5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${subSurface}`}>
                operating expenses (overheads)
              </div>

              <div className="px-5 py-2 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center">
                <span className="text-slate-700 dark:text-slate-300">admin & sales employment (opex payroll)</span>
                {renderNumberInput(actuals.ytdOpexEmployment, (v) => handlePatchActuals({ ytdOpexEmployment: v }))}
                <div className="text-right tabular-nums text-slate-500">
                  {fmtNum(derived.distributionPct.opexEmployment, 1)}%
                </div>
              </div>

              <div className="px-5 py-2 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center">
                <span className="text-slate-700 dark:text-slate-300">variable opex (marketing, distribution)</span>
                {renderNumberInput(actuals.ytdOpexVariable, (v) => handlePatchActuals({ ytdOpexVariable: v }))}
                <div className="text-right tabular-nums text-slate-500">
                  {fmtNum(derived.distributionPct.opexVariable, 1)}%
                </div>
              </div>

              <div className="px-5 py-2 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center">
                <span className="text-slate-700 dark:text-slate-300">fixed operating overheads (rent, utilities, admin)</span>
                {renderNumberInput(actuals.ytdOpexOverheads, (v) => handlePatchActuals({ ytdOpexOverheads: v }))}
                <div className="text-right tabular-nums text-slate-500">
                  {fmtNum(derived.distributionPct.opexOverheads, 1)}%
                </div>
              </div>

              {/* Auto-linked Opex Depreciation & Leases */}
              <div className="px-5 py-2 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    opex depreciation & asset leases
                  </span>
                  {onNavigateStep && (
                    <button
                      type="button"
                      onClick={() => onNavigateStep('fixed-assets')}
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#2E5E88] dark:text-[#5584B4] hover:underline cursor-pointer"
                    >
                      <span>from fixed assets</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
                <div className="w-28 sm:w-32 text-right font-bold tabular-nums text-slate-700 dark:text-slate-300 pr-2.5">
                  {fmtR(derived.ytdOpexDepreciation + derived.ytdOpexLeases)}
                </div>
                <div className="text-right tabular-nums text-slate-500">
                  {fmtNum(derived.distributionPct.opexDepreciation + derived.distributionPct.opexLeases, 1)}%
                </div>
              </div>

              {/* NET OPERATING PROFIT */}
              <div className={`px-5 py-2.5 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center font-bold ${subSurface}`}>
                <span className="uppercase text-slate-900 dark:text-white">net operating profit (ebit)</span>
                <span
                  className={`w-28 sm:w-32 text-right tabular-nums pr-2.5 ${
                    derived.ytdNetOperatingProfit >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {fmtR(derived.ytdNetOperatingProfit)}
                </span>
                <span className="text-right tabular-nums text-[#2E5E88] dark:text-[#5584B4]">
                  {fmtNum(derived.distributionPct.nop, 1)}%
                </span>
              </div>

              {/* Finance, Tax, Dividends, NPAT */}
              <div className="px-5 py-2 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-600 dark:text-slate-400">term loan interest (ytd)</span>
                  {onNavigateStep && (
                    <button
                      type="button"
                      onClick={() => onNavigateStep('funding', 'dynamics')}
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#2E5E88] dark:text-[#5584B4] hover:underline cursor-pointer"
                    >
                      <span>from funding</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
                <div className="w-28 sm:w-32 text-right tabular-nums text-slate-700 dark:text-slate-300 pr-2.5">
                  {fmtR(derived.ytdTermLoanInterest)}
                </div>
                <div className="text-right tabular-nums text-slate-400">—</div>
              </div>

              <div className="px-5 py-2 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center">
                <span className="text-slate-600 dark:text-slate-400">estimated corporate tax (ytd)</span>
                <div className="w-28 sm:w-32 text-right tabular-nums text-slate-700 dark:text-slate-300 pr-2.5">
                  {fmtR(derived.ytdTax)}
                </div>
                <div className="text-right tabular-nums text-slate-400">—</div>
              </div>

              <div className="px-5 py-2 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center">
                <span className="text-slate-700 dark:text-slate-300">dividends declared (ytd)</span>
                {renderNumberInput(actuals.ytdDividends, (v) => handlePatchActuals({ ytdDividends: v }))}
                <div className="text-right tabular-nums text-slate-400">—</div>
              </div>

              <div className={`px-5 py-3 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-center font-bold ${subSurface}`}>
                <span className="uppercase text-slate-900 dark:text-white">ytd net profit after tax</span>
                <span className="w-28 sm:w-32 text-right tabular-nums text-slate-900 dark:text-white pr-2.5">
                  {fmtR(derived.ytdNpat)}
                </span>
                <span className="text-right tabular-nums text-slate-500">
                  {actuals.ytdRevenue > 0 ? `${fmtNum((derived.ytdNpat / actuals.ytdRevenue) * 100, 1)}%` : '0.0%'}
                </span>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* FORM 2: BALANCE SHEET AS AT END OF UPDATE MONTH                   */}
          {/* ----------------------------------------------------------------- */}
          <div className={`rounded-2xl border overflow-hidden ${cardSurface}`}>
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    2. BALANCE SHEET (AS AT {derived.updateMonthLabel.toUpperCase()})
                  </h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    derives working capital days & anchors opening cash for forecast
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400">zar</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {/* Column header */}
              <div className={`px-5 py-2 grid grid-cols-[1fr_auto_5.5rem] gap-3 text-[10px] font-bold uppercase text-slate-400 ${subSurface}`}>
                <span>balance sheet line</span>
                <span className="text-right w-28 sm:w-32">closing (r)</span>
                <span className="text-right">derived / link</span>
              </div>

              {/* ASSETS header */}
              <div className={`px-5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${subSurface}`}>
                assets
              </div>

              {/* Fixed Assets NBV (Dynamic link) */}
              <div className="px-5 py-2.5 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">fixed assets (net book value)</div>
                  <div className="text-[10px] text-slate-500">dynamically calculated from fixed assets register</div>
                </div>
                <div className="w-28 sm:w-32 text-right font-bold tabular-nums text-slate-900 dark:text-white pr-2.5">
                  {fmtR(derived.fixedAssetsNetAtUpdateMonth)}
                </div>
                <div className="text-right">
                  {onNavigateStep && (
                    <button
                      type="button"
                      onClick={() => onNavigateStep('fixed-assets')}
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#2E5E88] dark:text-[#5584B4] hover:underline cursor-pointer"
                    >
                      <span>edit assets</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Inventory -> DIO */}
              <div className="px-5 py-2 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center">
                <div>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">inventory / stock on hand</span>
                  <div className="text-[10px] text-slate-500">sets forecast inventory days (dio)</div>
                </div>
                {renderNumberInput(actuals.bsInventory, (v) => handlePatchActuals({ bsInventory: v }))}
                <div className="text-right font-bold tabular-nums text-[#2E5E88] dark:text-[#5584B4]">
                  {fmtNum(derived.derivedInventoryDays, 1)} days
                </div>
              </div>

              {/* Receivables -> DSO */}
              <div className="px-5 py-2 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center">
                <div>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">accounts receivable (debtors)</span>
                  <div className="text-[10px] text-slate-500">sets forecast receivable days (dso)</div>
                </div>
                {renderNumberInput(actuals.bsReceivables, (v) => handlePatchActuals({ bsReceivables: v }))}
                <div className="text-right font-bold tabular-nums text-[#2E5E88] dark:text-[#5584B4]">
                  {fmtNum(derived.derivedReceivableDays, 1)} days
                </div>
              </div>

              {/* Other Assets: Deposits, Floats, Petty Cash */}
              <div className="px-5 py-2 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center">
                <span className="text-slate-700 dark:text-slate-300">other assets: deposits</span>
                {renderNumberInput(actuals.bsDeposits, (v) => handlePatchActuals({ bsDeposits: v }))}
                <div className="text-right text-[10px] text-slate-400">synced</div>
              </div>

              <div className="px-5 py-2 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center">
                <span className="text-slate-700 dark:text-slate-300">other assets: floats</span>
                {renderNumberInput(actuals.bsFloats, (v) => handlePatchActuals({ bsFloats: v }))}
                <div className="text-right text-[10px] text-slate-400">synced</div>
              </div>

              <div className="px-5 py-2 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center">
                <span className="text-slate-700 dark:text-slate-300">other assets: petty cash</span>
                {renderNumberInput(actuals.bsPettyCash, (v) => handlePatchActuals({ bsPettyCash: v }))}
                <div className="text-right text-[10px] text-slate-400">synced</div>
              </div>

              {/* VAT Receivable */}
              <div className="px-5 py-2 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center">
                <span className="text-slate-700 dark:text-slate-300">vat receivable (if refund due)</span>
                {renderNumberInput(actuals.bsVatReceivable, (v) => handlePatchActuals({ bsVatReceivable: v }))}
                <div className="text-right text-[10px] text-slate-400">cutoff</div>
              </div>

              {/* Bank / Cash (positive = cash, negative = overdraft) */}
              <div className="px-5 py-2 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center">
                <div>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">bank balance (+ cash / − overdraft)</span>
                  <div className="text-[10px] text-slate-500">anchors closing cash at month {derived.updateMonth}</div>
                </div>
                {renderNumberInput(actuals.bsBankBalance, (v) => handlePatchActuals({ bsBankBalance: v }), true)}
                <div className="text-right text-[10px] font-bold uppercase text-slate-500">
                  {actuals.bsBankBalance < 0 ? 'overdraft' : 'cash'}
                </div>
              </div>

              {/* TOTAL ASSETS */}
              <div className={`px-5 py-2.5 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center font-bold ${subSurface}`}>
                <span className="uppercase text-slate-900 dark:text-white">total assets</span>
                <span className="w-28 sm:w-32 text-right tabular-nums text-slate-900 dark:text-white pr-2.5">
                  {fmtR(derived.totalAssets)}
                </span>
                <span className="text-right text-[10px] text-slate-400">auto-sum</span>
              </div>

              {/* EQUITY & LIABILITIES header */}
              <div className={`px-5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${subSurface}`}>
                equity & liabilities
              </div>

              {/* Share Capital (Dynamic link) */}
              <div className="px-5 py-2 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">share capital</div>
                  <div className="text-[10px] text-slate-500 tabular-nums">
                    {(state.funding.initialSharesCount || 0).toLocaleString('en-ZA')} shares @ R {state.funding.initialSharePrice || 0}
                  </div>
                </div>
                <div className="w-28 sm:w-32 text-right font-bold tabular-nums text-slate-900 dark:text-white pr-2.5">
                  {fmtR(derived.shareCapitalAtUpdateMonth)}
                </div>
                <div className="text-right">
                  {onNavigateStep && (
                    <button
                      type="button"
                      onClick={() => onNavigateStep('funding', 'dynamics')}
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#2E5E88] dark:text-[#5584B4] hover:underline cursor-pointer"
                    >
                      <span>edit funding</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Equity Loans (Dynamic link) */}
              <div className="px-5 py-2 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">equity / shareholder loans</div>
                  <div className="text-[10px] text-slate-500">live balance from funding calculator</div>
                </div>
                <div className="w-28 sm:w-32 text-right font-bold tabular-nums text-slate-900 dark:text-white pr-2.5">
                  {fmtR(derived.equityLoansAtUpdateMonth)}
                </div>
                <div className="text-right">
                  {onNavigateStep && (
                    <button
                      type="button"
                      onClick={() => onNavigateStep('funding', 'dynamics')}
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#2E5E88] dark:text-[#5584B4] hover:underline cursor-pointer"
                    >
                      <span>edit funding</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Opening Retained Earnings + YTD movement */}
              <div className="px-5 py-2 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center">
                <div>
                  <span className="text-slate-700 dark:text-slate-300">opening retained earnings (prior yr)</span>
                  <div className="text-[10px] text-slate-500 tabular-nums">
                    closing RE: {fmtR(derived.closingRetainedEarningsAtUpdateMonth)} (incl. YTD NPAT)
                  </div>
                </div>
                {renderNumberInput(
                  actuals.bsOpeningRetainedEarnings,
                  (v) => handlePatchActuals({ bsOpeningRetainedEarnings: v }),
                  true
                )}
                <div className="text-right text-[10px] tabular-nums text-slate-500">
                  {fmtR(derived.closingRetainedEarningsAtUpdateMonth)}
                </div>
              </div>

              {/* Term Loans (Dynamic link) */}
              <div className="px-5 py-2 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">term loans (carrying balance)</div>
                  <div className="text-[10px] text-slate-500">
                    {(state.funding.termLoans || []).length} active facility(ies) in funding
                  </div>
                </div>
                <div className="w-28 sm:w-32 text-right font-bold tabular-nums text-slate-900 dark:text-white pr-2.5">
                  {fmtR(derived.termLoansAtUpdateMonth)}
                </div>
                <div className="text-right">
                  {onNavigateStep && (
                    <button
                      type="button"
                      onClick={() => onNavigateStep('funding', 'dynamics')}
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#2E5E88] dark:text-[#5584B4] hover:underline cursor-pointer"
                    >
                      <span>edit funding</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Accounts Payable -> DPO */}
              <div className="px-5 py-2 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center">
                <div>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">accounts payable (creditors)</span>
                  <div className="text-[10px] text-slate-500">sets forecast payable days (dpo)</div>
                </div>
                {renderNumberInput(actuals.bsPayables, (v) => handlePatchActuals({ bsPayables: v }))}
                <div className="text-right font-bold tabular-nums text-[#2E5E88] dark:text-[#5584B4]">
                  {fmtNum(derived.derivedPayableDays, 1)} days
                </div>
              </div>

              {/* VAT Payable */}
              <div className="px-5 py-2 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center">
                <span className="text-slate-700 dark:text-slate-300">vat payable (output tax due)</span>
                {renderNumberInput(actuals.bsVatPayable, (v) => handlePatchActuals({ bsVatPayable: v }))}
                <div className="text-right text-[10px] text-slate-400">cutoff</div>
              </div>

              {/* Corporate Tax Liability */}
              <div className="px-5 py-2 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center">
                <span className="text-slate-700 dark:text-slate-300">corporate income tax liability</span>
                {renderNumberInput(actuals.bsTaxLiability, (v) => handlePatchActuals({ bsTaxLiability: v }))}
                <div className="text-right text-[10px] text-slate-400">cutoff</div>
              </div>

              {/* TOTAL EQUITY & LIABILITIES */}
              <div className={`px-5 py-2.5 grid grid-cols-[1fr_auto_5.5rem] gap-3 items-center font-bold ${subSurface}`}>
                <span className="uppercase text-slate-900 dark:text-white">total equity & liabilities</span>
                <span className="w-28 sm:w-32 text-right tabular-nums text-slate-900 dark:text-white pr-2.5">
                  {fmtR(derived.totalEquityAndLiabilities)}
                </span>
                <span
                  className={`text-right text-[10px] font-bold uppercase ${
                    isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {isBalanced ? 'balanced' : fmtR(derived.balanceDifference)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: RESULTS — TRADING DISTRIBUTION & 60-MONTH FORECAST BRIDGE      */}
      {/* ===================================================================== */}
      {subTab === 'results' && (
        <div className="space-y-5">
          <div className={`rounded-2xl border overflow-hidden ${cardSurface}`}>
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    TRADING ACCOUNT DISTRIBUTION & 60-MONTH FORECAST BRIDGE
                  </h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    actuals m1–m{derived.updateMonth} seamlessly blended with projected m{derived.updateMonth + 1}–m60 using derived daily revenue & cost ratios
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase text-[#2E5E88] dark:text-[#5584B4]">
                basis: {actuals.projectionBasis === 'fixed-run-rate' ? 'fixed monthly run-rate' : '% of revenue distribution'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs tabular-nums">
                <thead>
                  <tr className={`border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500 ${subSurface}`}>
                    <th className="text-left px-4 py-2.5 min-w-[200px]">line item (zar)</th>
                    <th className="text-right px-3 py-2.5">ytd m1–m{derived.updateMonth}</th>
                    <th className="text-right px-3 py-2.5">ytd %</th>
                    <th className="text-right px-3 py-2.5">bal. yr1 (m{derived.updateMonth + 1}–12)</th>
                    <th className="text-right px-3 py-2.5">full yr 1</th>
                    <th className="text-right px-3 py-2.5">year 2</th>
                    <th className="text-right px-3 py-2.5">year 3</th>
                    <th className="text-right px-3 py-2.5">year 4</th>
                    <th className="text-right px-4 py-2.5">year 5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {[
                    {
                      label: 'Revenue / Turnover',
                      bold: true,
                      vals: [
                        bridgeColumns.ytd.rev,
                        bridgeColumns.restY1.rev,
                        bridgeColumns.y1.rev,
                        bridgeColumns.y2.rev,
                        bridgeColumns.y3.rev,
                        bridgeColumns.y4.rev,
                        bridgeColumns.y5.rev,
                      ],
                      pct: 100.0,
                    },
                    {
                      label: 'Total Cost of Sales',
                      vals: [
                        bridgeColumns.ytd.totalCos,
                        bridgeColumns.restY1.totalCos,
                        bridgeColumns.y1.totalCos,
                        bridgeColumns.y2.totalCos,
                        bridgeColumns.y3.totalCos,
                        bridgeColumns.y4.totalCos,
                        bridgeColumns.y5.totalCos,
                      ],
                      pct: derived.distributionPct.totalCos,
                    },
                    {
                      label: 'Gross Profit',
                      bold: true,
                      highlight: true,
                      vals: [
                        bridgeColumns.ytd.gp,
                        bridgeColumns.restY1.gp,
                        bridgeColumns.y1.gp,
                        bridgeColumns.y2.gp,
                        bridgeColumns.y3.gp,
                        bridgeColumns.y4.gp,
                        bridgeColumns.y5.gp,
                      ],
                      pct: derived.distributionPct.grossProfit,
                    },
                    {
                      label: 'GP Adjustments (Commissions / Shrinkage)',
                      vals: [
                        -bridgeColumns.ytd.gpAdj,
                        -bridgeColumns.restY1.gpAdj,
                        -bridgeColumns.y1.gpAdj,
                        -bridgeColumns.y2.gpAdj,
                        -bridgeColumns.y3.gpAdj,
                        -bridgeColumns.y4.gpAdj,
                        -bridgeColumns.y5.gpAdj,
                      ],
                      pct: -derived.distributionPct.gpAdjustments,
                    },
                    {
                      label: 'Other Operating Income',
                      vals: [
                        bridgeColumns.ytd.otherInc,
                        bridgeColumns.restY1.otherInc,
                        bridgeColumns.y1.otherInc,
                        bridgeColumns.y2.otherInc,
                        bridgeColumns.y3.otherInc,
                        bridgeColumns.y4.otherInc,
                        bridgeColumns.y5.otherInc,
                      ],
                      pct: derived.distributionPct.otherIncome,
                    },
                    {
                      label: 'Total Operating Expenses',
                      vals: [
                        bridgeColumns.ytd.totalOpex,
                        bridgeColumns.restY1.totalOpex,
                        bridgeColumns.y1.totalOpex,
                        bridgeColumns.y2.totalOpex,
                        bridgeColumns.y3.totalOpex,
                        bridgeColumns.y4.totalOpex,
                        bridgeColumns.y5.totalOpex,
                      ],
                      pct: derived.distributionPct.totalOpex,
                    },
                    {
                      label: 'Net Operating Profit (EBIT)',
                      bold: true,
                      highlight: true,
                      vals: [
                        bridgeColumns.ytd.nop,
                        bridgeColumns.restY1.nop,
                        bridgeColumns.y1.nop,
                        bridgeColumns.y2.nop,
                        bridgeColumns.y3.nop,
                        bridgeColumns.y4.nop,
                        bridgeColumns.y5.nop,
                      ],
                      pct: derived.distributionPct.nop,
                    },
                    {
                      label: 'Net Finance Charges',
                      vals: [
                        bridgeColumns.ytd.finance,
                        bridgeColumns.restY1.finance,
                        bridgeColumns.y1.finance,
                        bridgeColumns.y2.finance,
                        bridgeColumns.y3.finance,
                        bridgeColumns.y4.finance,
                        bridgeColumns.y5.finance,
                      ],
                      pct: null,
                    },
                    {
                      label: 'Corporate Tax (CIT)',
                      vals: [
                        bridgeColumns.ytd.tax,
                        bridgeColumns.restY1.tax,
                        bridgeColumns.y1.tax,
                        bridgeColumns.y2.tax,
                        bridgeColumns.y3.tax,
                        bridgeColumns.y4.tax,
                        bridgeColumns.y5.tax,
                      ],
                      pct: null,
                    },
                    {
                      label: 'Net Profit After Tax (NPAT)',
                      bold: true,
                      highlight: true,
                      vals: [
                        bridgeColumns.ytd.npat,
                        bridgeColumns.restY1.npat,
                        bridgeColumns.y1.npat,
                        bridgeColumns.y2.npat,
                        bridgeColumns.y3.npat,
                        bridgeColumns.y4.npat,
                        bridgeColumns.y5.npat,
                      ],
                      pct:
                        actuals.ytdRevenue > 0
                          ? (bridgeColumns.ytd.npat / actuals.ytdRevenue) * 100
                          : 0,
                    },
                    {
                      label: 'Closing Bank / Cash Balance',
                      bold: true,
                      vals: [
                        bridgeColumns.ytd.closingCash,
                        bridgeColumns.restY1.closingCash,
                        bridgeColumns.y1.closingCash,
                        bridgeColumns.y2.closingCash,
                        bridgeColumns.y3.closingCash,
                        bridgeColumns.y4.closingCash,
                        bridgeColumns.y5.closingCash,
                      ],
                      pct: null,
                    },
                  ].map((row) => (
                    <tr
                      key={row.label}
                      className={`${row.highlight ? subSurface : ''} ${row.bold ? 'font-bold' : ''}`}
                    >
                      <td className="px-4 py-2.5 text-slate-900 dark:text-white">{row.label}</td>
                      <td className="px-3 py-2.5 text-right">{fmtR(row.vals[0])}</td>
                      <td className="px-3 py-2.5 text-right text-[#2E5E88] dark:text-[#5584B4]">
                        {row.pct !== null ? `${fmtNum(row.pct, 1)}%` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right">{fmtR(row.vals[1])}</td>
                      <td className="px-3 py-2.5 text-right">{fmtR(row.vals[2])}</td>
                      <td className="px-3 py-2.5 text-right">{fmtR(row.vals[3])}</td>
                      <td className="px-3 py-2.5 text-right">{fmtR(row.vals[4])}</td>
                      <td className="px-3 py-2.5 text-right">{fmtR(row.vals[5])}</td>
                      <td className="px-4 py-2.5 text-right">{fmtR(row.vals[6])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Working Capital Derivation Audit Card */}
          <div className={`p-5 rounded-2xl border ${cardSurface}`}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  DERIVED WORKING CAPITAL VELOCITY (SYNCED TO FUNDING & WHAT-IF)
                </span>
              </div>
              {onNavigateStep && (
                <button
                  type="button"
                  onClick={() => onNavigateStep('funding', 'what-if')}
                  className="text-xs font-bold lowercase text-[#2E5E88] dark:text-[#5584B4] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>stress-test in what-if</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className={`p-3.5 rounded-xl border ${subSurface}`}>
                <div className="text-[10px] font-bold uppercase text-slate-500">inventory days (dio)</div>
                <div className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                  {fmtNum(derived.derivedInventoryDays, 1)} days
                </div>
                <div className="mt-1 text-[10px] text-slate-500 tabular-nums">
                  {fmtR(actuals.bsInventory)} ÷ {fmtR(derived.ytdTotalCos)} × {derived.elapsedCalendarDays}d
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border ${subSurface}`}>
                <div className="text-[10px] font-bold uppercase text-slate-500">receivable days (dso)</div>
                <div className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                  {fmtNum(derived.derivedReceivableDays, 1)} days
                </div>
                <div className="mt-1 text-[10px] text-slate-500 tabular-nums">
                  {fmtR(actuals.bsReceivables)} ÷ YTD Rev (incl. VAT) × {derived.elapsedCalendarDays}d
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border ${subSurface}`}>
                <div className="text-[10px] font-bold uppercase text-slate-500">payable days (dpo)</div>
                <div className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                  {fmtNum(derived.derivedPayableDays, 1)} days
                </div>
                <div className="mt-1 text-[10px] text-slate-500 tabular-nums">
                  {fmtR(actuals.bsPayables)} ÷ YTD COS (incl. VAT) × {derived.elapsedCalendarDays}d
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: CHARTS — ACTUALS VS FORECAST BRIDGE & 5-YEAR TRAJECTORY        */}
      {/* ===================================================================== */}
      {subTab === 'charts' && (
        <div className="space-y-5">
          {/* Chart 1: Year 1 Monthly Revenue Bridge (Actuals vs Forecast) */}
          <div className={`p-5 rounded-2xl border ${cardSurface}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  YEAR 1 MONTHLY REVENUE BRIDGE · ACTUALS VS FORECAST
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  weighted by exact operating days per month from business details
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-bold">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#2E5E88] inline-block" />
                  <span>ytd actuals (m1–m{derived.updateMonth})</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#5CA338] inline-block" />
                  <span>forecast (m{derived.updateMonth + 1}–m12)</span>
                </span>
              </div>
            </div>

            {(() => {
              const maxRev = Math.max(1, ...year1Months.map((m) => m.revenue));
              return (
                <div className="grid grid-cols-12 gap-2 items-end h-56 pt-4">
                  {year1Months.map((m) => {
                    const heightPct = Math.max(4, Math.round((m.revenue / maxRev) * 100));
                    return (
                      <div key={m.monthNum} className="flex flex-col items-center h-full justify-end gap-1.5">
                        <div className="text-[9px] font-bold tabular-nums text-slate-500 dark:text-slate-400 truncate max-w-full">
                          {(m.revenue / 1000).toFixed(0)}k
                        </div>
                        <div className="w-full flex-1 flex items-end justify-center">
                          <div
                            title={`${m.label} (${m.isActual ? 'Actual' : 'Forecast'}): ${fmtR(m.revenue)}`}
                            style={{ height: `${heightPct}%` }}
                            className={`w-full max-w-[36px] rounded-t-md transition-all ${
                              m.isActual
                                ? 'bg-[#2E5E88] dark:bg-[#4F83B8]'
                                : 'bg-[#5CA338] dark:bg-[#6CB846]'
                            }`}
                          />
                        </div>
                        <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {m.label}
                        </div>
                        <div className="text-[9px] uppercase text-slate-400">
                          {m.isActual ? 'act' : 'fcst'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Chart 2 & 3: 5-Year Trajectory + Working Capital Days */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className={`p-5 rounded-2xl border ${cardSurface}`}>
              <div className="pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  5-YEAR REVENUE, GROSS PROFIT & NOP TRAJECTORY
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  annual totals across the 60-month forecast horizon
                </p>
              </div>
              {(() => {
                const maxAnnual = Math.max(1, ...annualTrajectory.map((y) => Math.max(y.rev, y.gp, y.nop)));
                return (
                  <div className="space-y-3.5">
                    {annualTrajectory.map((yr) => (
                      <div key={yr.label} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold tabular-nums">
                          <span className="text-slate-900 dark:text-white">{yr.label}</span>
                          <span className="text-slate-500 dark:text-slate-400">
                            Rev {fmtR(yr.rev)} · NOP {fmtR(yr.nop)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="h-2.5 w-full rounded-xs bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              style={{ width: `${Math.max(2, (yr.rev / maxAnnual) * 100)}%` }}
                              className="h-full bg-[#2E5E88]"
                            />
                          </div>
                          <div className="h-2 w-full rounded-xs bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              style={{ width: `${Math.max(0, (Math.max(0, yr.gp) / maxAnnual) * 100)}%` }}
                              className="h-full bg-[#5CA338]"
                            />
                          </div>
                          <div className="h-2 w-full rounded-xs bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              style={{ width: `${Math.max(0, (Math.max(0, yr.nop) / maxAnnual) * 100)}%` }}
                              className="h-full bg-amber-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-4 pt-2 text-[10px] font-bold text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5 bg-[#2E5E88] inline-block" /> revenue
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5 bg-[#5CA338] inline-block" /> gross profit
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5 bg-amber-500 inline-block" /> net operating profit
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className={`p-5 rounded-2xl border ${cardSurface}`}>
              <div className="pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  DERIVED WORKING CAPITAL CYCLE BREAKDOWN
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  days calculated directly from your cutoff balance sheet
                </p>
              </div>
              {(() => {
                const maxDays = Math.max(
                  30,
                  derived.derivedInventoryDays,
                  derived.derivedReceivableDays,
                  derived.derivedPayableDays,
                  Math.abs(derived.derivedCashConversionCycle)
                );
                const bars = [
                  { label: 'Inventory Days (DIO)', days: derived.derivedInventoryDays, color: 'bg-[#2E5E88]' },
                  { label: 'Receivable Days (DSO)', days: derived.derivedReceivableDays, color: 'bg-sky-500' },
                  { label: 'Payable Days (DPO · Credit Offset)', days: derived.derivedPayableDays, color: 'bg-[#5CA338]' },
                  {
                    label: 'Net Cash Conversion Cycle (DIO + DSO − DPO)',
                    days: derived.derivedCashConversionCycle,
                    color: derived.derivedCashConversionCycle > 45 ? 'bg-amber-500' : 'bg-slate-700 dark:bg-slate-300',
                  },
                ];
                return (
                  <div className="space-y-4">
                    {bars.map((b) => (
                      <div key={b.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold tabular-nums">
                          <span className="text-slate-700 dark:text-slate-300">{b.label}</span>
                          <span className="text-slate-900 dark:text-white">{fmtNum(b.days, 1)} days</span>
                        </div>
                        <div className="h-3 w-full rounded-xs bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, Math.max(2, (Math.abs(b.days) / maxDays) * 100))}%` }}
                            className={`h-full ${b.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HiLevelActualsStep;
