import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Calculator,
  Calendar,
  Layers,
  Sparkles,
  Sliders,
  RotateCcw,
  Plus,
  Trash2,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BarChart3,
  Zap,
  Camera,
} from 'lucide-react';
import {
  BizzModelState,
  FundingSettings,
  PlatformForecastAppId,
  TermLoanEntry,
} from '../constants';
import { calculateFinancialModelProjections } from '../utils/revenueCalc';
import { LiquidityVsDebtChart, LiquidityDataPoint } from '../../bizzdynamics/components/LiquidityVsDebtChart';
import { calculateTermLoanMetrics } from '../utils/loanCalc';

interface FundingStepProps {
  theme?: 'light' | 'dark';
  mode: PlatformForecastAppId;
  state: BizzModelState;
  onUpdateState: (updater: (prev: BizzModelState) => BizzModelState) => void;
  subTab?: 'dynamics' | 'what-if';
  onSelectSubTab?: (tab: 'dynamics' | 'what-if') => void;
}

export const FundingStep: React.FC<FundingStepProps> = ({
  theme = 'light',
  mode,
  state,
  onUpdateState,
  subTab: subTabProp,
  onSelectSubTab,
}) => {
  const isDark = theme === 'dark';

  // Internal tab state if not controlled from layout
  const [internalTab, setInternalTab] = useState<'dynamics' | 'what-if'>('dynamics');
  const activeTab = subTabProp ?? internalTab;

  // Selected Year for Chart & Adjustment Sliders (1 to 5, or 'summary' for chart)
  const [chartHorizonYear, setChartHorizonYear] = useState<number | 'summary'>(1);
  const [sliderYear, setSliderYear] = useState<number>(1);

  // Active Working Capital metric being adjusted ('inventory' | 'receivables' | 'payables')
  const [activeWcMetric, setActiveWcMetric] = useState<'inventory' | 'receivables' | 'payables'>('inventory');

  // Active Other Assets metric being adjusted ('deposits' | 'floats' | 'petty-cash')
  const [activeOtherAssetMetric, setActiveOtherAssetMetric] = useState<'deposits' | 'floats' | 'petty-cash'>('deposits');

  // Cascade toggle: applies change to following months in forecast
  const [cascadeChanges, setCascadeChanges] = useState<boolean>(true);

  // Expanded sections accordion toggles
  const [showWcSection, setShowWcSection] = useState<boolean>(true);
  const [showOtherAssetsSection, setShowOtherAssetsSection] = useState<boolean>(true);
  const [showTermLoansSection, setShowTermLoansSection] = useState<boolean>(true);
  const [showShareCapitalSection, setShowShareCapitalSection] = useState<boolean>(true);
  const [showDividendsSection, setShowDividendsSection] = useState<boolean>(true);

  // =========================================================================
  // WHAT-IF SCENARIO STATE & SENSITIVITY DYNAMICS
  // =========================================================================
  const [whatIfRevPct, setWhatIfRevPct] = useState<number>(1.0); // e.g. +1.00%
  const [whatIfGpMarginDeltaPct, setWhatIfGpMarginDeltaPct] = useState<number>(0.0); // e.g. +0.00%
  const [whatIfGpAdjDeltaPct, setWhatIfGpAdjDeltaPct] = useState<number>(0.0); // e.g. +0.00%
  const [whatIfOtherIncDeltaPct, setWhatIfOtherIncDeltaPct] = useState<number>(0.0); // e.g. +0.00%
  const [whatIfOpexPct, setWhatIfOpexPct] = useState<number>(2.0); // e.g. +2.00%
  const [whatIfInvDays, setWhatIfInvDays] = useState<number>(25); // e.g. 25 days
  const [whatIfRecDays, setWhatIfRecDays] = useState<number>(25); // e.g. 25 days
  const [whatIfPayDays, setWhatIfPayDays] = useState<number>(40); // e.g. 40 days
  const [whatIfChartHorizon, setWhatIfChartHorizon] = useState<number | 'summary'>(1);
  const [whatIfPeriod, setWhatIfPeriod] = useState<string>('m1'); // 'm1'..'m12', 'y1'..'y5', 'ref'
  const [snapshotTimestamp, setSnapshotTimestamp] = useState<string>(() => new Date().toLocaleTimeString());
  const [snapshotCount, setSnapshotCount] = useState<number>(1);

  const funding = state.funding;

  const handleUpdateFunding = (patch: Partial<FundingSettings>) => {
    onUpdateState((prev) => ({
      ...prev,
      funding: { ...prev.funding, ...patch },
    }));
  };

  const handleResetWhatIf = () => {
    setWhatIfRevPct(0.0);
    setWhatIfGpMarginDeltaPct(0.0);
    setWhatIfGpAdjDeltaPct(0.0);
    setWhatIfOtherIncDeltaPct(0.0);
    setWhatIfOpexPct(0.0);
    setWhatIfInvDays(funding.inventoryDays || 30);
    setWhatIfRecDays(funding.debtorDays || 30);
    setWhatIfPayDays(funding.creditorDays || 30);
  };

  const handleTakeSnapshot = () => {
    setSnapshotCount((c) => c + 1);
    setSnapshotTimestamp(new Date().toLocaleTimeString());
  };

  const handleApplyPreset = (preset: 'ref' | 'lean' | 'growth' | 'stress') => {
    if (preset === 'ref') {
      setWhatIfRevPct(1.0);
      setWhatIfGpMarginDeltaPct(0.0);
      setWhatIfGpAdjDeltaPct(0.0);
      setWhatIfOtherIncDeltaPct(0.0);
      setWhatIfOpexPct(2.0);
      setWhatIfInvDays(25);
      setWhatIfRecDays(25);
      setWhatIfPayDays(40);
      setWhatIfPeriod('ref');
    } else if (preset === 'lean') {
      setWhatIfRevPct(0.0);
      setWhatIfGpMarginDeltaPct(0.0);
      setWhatIfGpAdjDeltaPct(0.0);
      setWhatIfOtherIncDeltaPct(0.0);
      setWhatIfOpexPct(0.0);
      setWhatIfInvDays(20);
      setWhatIfRecDays(20);
      setWhatIfPayDays(45);
    } else if (preset === 'growth') {
      setWhatIfRevPct(5.0);
      setWhatIfGpMarginDeltaPct(1.0);
      setWhatIfGpAdjDeltaPct(0.0);
      setWhatIfOtherIncDeltaPct(0.0);
      setWhatIfOpexPct(3.0);
      setWhatIfInvDays(25);
      setWhatIfRecDays(25);
      setWhatIfPayDays(35);
    } else if (preset === 'stress') {
      setWhatIfRevPct(-5.0);
      setWhatIfGpMarginDeltaPct(-2.0);
      setWhatIfGpAdjDeltaPct(0.0);
      setWhatIfOtherIncDeltaPct(0.0);
      setWhatIfOpexPct(5.0);
      setWhatIfInvDays(35);
      setWhatIfRecDays(35);
      setWhatIfPayDays(25);
    }
  };

  // Run full 60-month financial projections
  const projections = useMemo(() => {
    return calculateFinancialModelProjections(state, 60);
  }, [state]);

  // Compute dual-axis data points for LiquidityVsDebtChart
  const chartData: LiquidityDataPoint[] = useMemo(() => {
    if (chartHorizonYear === 'summary') {
      // 5 Annual Year End milestones
      return [1, 2, 3, 4, 5].map((yr) => {
        const lastMo = projections[yr * 12 - 1];
        return {
          id: `yr-${yr}`,
          label: `Year ${yr}`,
          bank_balance_closing: lastMo?.bank_balance_closing ?? 0,
          term_loan_balance: lastMo?.term_loan_balance ?? 0,
          isTotal: true,
        };
      });
    }

    // 12 Months for the selected year
    const startIdx = (Number(chartHorizonYear) - 1) * 12;
    const monthsSlice = projections.slice(startIdx, startIdx + 12);
    return monthsSlice.map((m, idx) => ({
      id: `m-${startIdx + idx + 1}`,
      label: `M${startIdx + idx + 1}`,
      bank_balance_closing: m.bank_balance_closing,
      term_loan_balance: m.term_loan_balance,
      isTotal: false,
    }));
  }, [projections, chartHorizonYear]);

  // Key KPI metrics for the selected year
  const kpiMetrics = useMemo(() => {
    const endMoIdx = chartHorizonYear === 'summary' ? 59 : Number(chartHorizonYear) * 12 - 1;
    const moData = projections[endMoIdx] || projections[projections.length - 1];
    return {
      closingCash: moData?.bank_balance_closing ?? 0,
      termDebt: moData?.term_loan_balance ?? 0,
      netLiquidity: (moData?.bank_balance_closing ?? 0) - (moData?.term_loan_balance ?? 0),
      debtEquityRatio: moData?.debt_equity_ratio ?? 0,
      inventory: moData?.inventory ?? 0,
      receivables: moData?.accounts_receivable ?? 0,
      payables: moData?.accounts_payable ?? 0,
      ccc: (moData?.inventoryDaysUsed ?? 0) + (moData?.debtorDaysUsed ?? 0) - (moData?.creditorDaysUsed ?? 0),
    };
  }, [projections, chartHorizonYear]);

  // =========================================================================
  // 60-MONTH WHAT-IF CASCADE SIMULATION
  // =========================================================================
  const whatIfProjections = useMemo(() => {
    return projections.map((baseMo, mIdx) => {
      const isRefMode = whatIfPeriod === 'ref';
      const rawBaseRev = isRefMode && mIdx === 0 ? 8500000 : baseMo.revenue;
      const rawBaseCos = isRefMode && mIdx === 0 ? 6500000 : (baseMo.totalCos || baseMo.cogs || 0);
      const rawBaseGpAdj =
        isRefMode && mIdx === 0
          ? 200000
          : (baseMo.gpAdjustmentsCommission || 0) +
            (baseMo.gpAdjustmentsInventory || 0) +
            (baseMo.gpAdjustmentsVariance || 0);
      const rawBaseOtherInc = isRefMode && mIdx === 0 ? 120000 : (baseMo.otherIncomeTotal || 0);
      const rawBaseOpex =
        isRefMode && mIdx === 0
          ? 1000000
          : (baseMo.employmentExpenses || baseMo.opexEmployment || 0) +
            (baseMo.depreciation || 0) +
            (baseMo.exLease || 0) +
            (baseMo.exOverheads || 0) +
            (baseMo.exVariable || 0);
      const vatRate = baseMo.vatRate || (state.businessDetails as any)?.vatRate || 15;

      const baseMargin = rawBaseRev > 0 ? (rawBaseRev - rawBaseCos) / rawBaseRev : 0.235294;
      const revGpMargin = Math.max(0, Math.min(1, baseMargin + whatIfGpMarginDeltaPct / 100));

      const wiRev = rawBaseRev * (1 + whatIfRevPct / 100);
      const wiCos = rawBaseRev > 0 ? wiRev * (1 - revGpMargin) : rawBaseCos;
      const wiGp = wiRev - wiCos;
      const wiGpAdj = rawBaseGpAdj * (1 + whatIfGpAdjDeltaPct / 100);
      const wiOtherInc = rawBaseOtherInc * (1 + whatIfOtherIncDeltaPct / 100);
      const wiTotalInc = wiGp + wiGpAdj + wiOtherInc;
      const wiOpex = rawBaseOpex * (1 + whatIfOpexPct / 100);
      const wiNop = wiTotalInc - wiOpex;

      // Balance Sheet Working Capital
      const wiInv = Math.round((wiCos / 30) * whatIfInvDays);
      const wiRec = Math.round(((wiRev * (1 + vatRate / 100)) / 30) * whatIfRecDays);
      const wiPay = Math.round(((wiCos * (1 + vatRate / 100)) / 30) * whatIfPayDays);
      const wiNwc = wiInv + wiRec - wiPay;

      // Base Working Capital
      const baseInv = isRefMode && mIdx === 0 ? 6500000 : (baseMo.inventory ?? 0);
      const baseRec = isRefMode && mIdx === 0 ? 9775000 : (baseMo.accounts_receivable ?? 0);
      const basePay = isRefMode && mIdx === 0 ? 7475000 : (baseMo.accounts_payable ?? 0);
      const baseNwc = baseInv + baseRec - basePay;

      // Cash flow cascade: Working capital cash released (less cash tied up in NWC = more bank cash)
      const nwcDelta = baseNwc - wiNwc;
      const baseNop = rawBaseRev - rawBaseCos + rawBaseGpAdj + rawBaseOtherInc - rawBaseOpex;
      const nopDelta = wiNop - baseNop;

      const baseClosingCash = baseMo.bank_balance_closing;
      const wiClosingCash = baseClosingCash + nwcDelta + nopDelta;

      return {
        monthIndex: mIdx + 1,
        baseRev: rawBaseRev,
        baseCos: rawBaseCos,
        baseGp: rawBaseRev - rawBaseCos,
        baseGpAdj: rawBaseGpAdj,
        baseOtherInc: rawBaseOtherInc,
        baseTotalInc: rawBaseRev - rawBaseCos + rawBaseGpAdj + rawBaseOtherInc,
        baseOpex: rawBaseOpex,
        baseNop,
        baseInv,
        baseRec,
        basePay,
        baseNwc,
        baseClosingCash,
        baseTermDebt: baseMo.term_loan_balance,
        wiRev,
        wiCos,
        wiGp,
        wiGpAdj,
        wiOtherInc,
        wiTotalInc,
        wiOpex,
        wiNop,
        wiInv,
        wiRec,
        wiPay,
        wiNwc,
        nwcDelta,
        wiClosingCash,
        wiTermDebt: baseMo.term_loan_balance,
      };
    });
  }, [
    projections,
    whatIfPeriod,
    whatIfRevPct,
    whatIfGpMarginDeltaPct,
    whatIfGpAdjDeltaPct,
    whatIfOtherIncDeltaPct,
    whatIfOpexPct,
    whatIfInvDays,
    whatIfRecDays,
    whatIfPayDays,
    state.businessDetails,
  ]);

  // Dual-Axis Comparison Data Points for LiquidityVsDebtChart in What-If Tab
  const whatIfChartData: LiquidityDataPoint[] = useMemo(() => {
    if (whatIfChartHorizon === 'summary') {
      return [1, 2, 3, 4, 5].map((yr) => {
        const lastMoIdx = yr * 12 - 1;
        const baseMo = projections[lastMoIdx];
        const wiMo = whatIfProjections[lastMoIdx];
        return {
          id: `wi-yr-${yr}`,
          label: `Year ${yr}`,
          bank_balance_closing: baseMo?.bank_balance_closing ?? 0,
          whatif_bank_balance_closing: wiMo?.wiClosingCash ?? 0,
          term_loan_balance: baseMo?.term_loan_balance ?? 0,
          whatif_term_loan_balance: wiMo?.wiTermDebt ?? 0,
          isTotal: true,
        };
      });
    }

    const startIdx = (Number(whatIfChartHorizon) - 1) * 12;
    return Array.from({ length: 12 }, (_, i) => {
      const idx = startIdx + i;
      const baseMo = projections[idx];
      const wiMo = whatIfProjections[idx];
      return {
        id: `wi-m-${idx + 1}`,
        label: `M${idx + 1}`,
        bank_balance_closing: baseMo?.bank_balance_closing ?? 0,
        whatif_bank_balance_closing: wiMo?.wiClosingCash ?? 0,
        term_loan_balance: baseMo?.term_loan_balance ?? 0,
        whatif_term_loan_balance: wiMo?.wiTermDebt ?? 0,
        isTotal: false,
      };
    });
  }, [projections, whatIfProjections, whatIfChartHorizon]);

  // Active period data for the ROA Dynamics Table matching ROA dynamics.PNG exactly
  const roaTableData = useMemo(() => {
    const isRef = whatIfPeriod === 'ref';
    const vatRate = 15;

    let numMonths = 1;
    let baseRevenue = 8500000;
    let baseCos = 6500000;
    let baseGpAdj = 200000;
    let baseOtherInc = 120000;
    let baseOpex = 1000000;
    let baseFixedAssets = 1680000;
    let baseInvDays = 30.0;
    let baseRecDays = 30.0;
    let basePayDays = 30.0;

    if (!isRef) {
      if (whatIfPeriod.startsWith('m')) {
        const mIdx = Math.max(0, Math.min(59, parseInt(whatIfPeriod.replace('m', ''), 10) - 1));
        const mo = projections[mIdx];
        numMonths = 1;
        if (mo && mo.revenue > 0) {
          baseRevenue = mo.revenue;
          baseCos = mo.totalCos || mo.cogs || 0;
          baseGpAdj =
            (mo.gpAdjustmentsCommission || 0) +
            (mo.gpAdjustmentsInventory || 0) +
            (mo.gpAdjustmentsVariance || 0);
          baseOtherInc = mo.otherIncomeTotal || 0;
          baseOpex =
            (mo.employmentExpenses || mo.opexEmployment || 0) +
            (mo.depreciation || 0) +
            (mo.exLease || 0) +
            (mo.exOverheads || 0) +
            (mo.exVariable || 0);
          baseFixedAssets = (mo as any)?.fixed_assets_net ?? 1680000;
          baseInvDays = mo.inventoryDaysUsed || funding.inventoryDays || 30;
          baseRecDays = mo.debtorDaysUsed || funding.debtorDays || 30;
          basePayDays = mo.creditorDaysUsed || funding.creditorDays || 30;
        }
      } else if (whatIfPeriod.startsWith('y')) {
        const yr = parseInt(whatIfPeriod.replace('y', ''), 10);
        const s = (yr - 1) * 12;
        const slice = projections.slice(s, s + 12);
        numMonths = 12;
        const totRev = slice.reduce((acc, m) => acc + m.revenue, 0);
        if (totRev > 0) {
          baseRevenue = totRev;
          baseCos = slice.reduce((acc, m) => acc + (m.totalCos || m.cogs || 0), 0);
          baseGpAdj = slice.reduce(
            (acc, m) =>
              acc +
              (m.gpAdjustmentsCommission || 0) +
              (m.gpAdjustmentsInventory || 0) +
              (m.gpAdjustmentsVariance || 0),
            0
          );
          baseOtherInc = slice.reduce((acc, m) => acc + (m.otherIncomeTotal || 0), 0);
          baseOpex = slice.reduce(
            (acc, m) =>
              acc +
              (m.employmentExpenses || m.opexEmployment || 0) +
              (m.depreciation || 0) +
              (m.exLease || 0) +
              (m.exOverheads || 0) +
              (m.exVariable || 0),
            0
          );
          baseFixedAssets = (slice[slice.length - 1] as any)?.fixed_assets_net ?? 1680000;
          baseInvDays = slice[slice.length - 1]?.inventoryDaysUsed || funding.inventoryDays || 30;
          baseRecDays = slice[slice.length - 1]?.debtorDaysUsed || funding.debtorDays || 30;
          basePayDays = slice[slice.length - 1]?.creditorDaysUsed || funding.creditorDays || 30;
        }
      }
    }

    // 1. Trading Account (Base)
    const baseGp = baseRevenue - baseCos;
    const baseTotalIncome = baseGp + baseGpAdj + baseOtherInc;
    const baseNop = baseTotalIncome - baseOpex;

    // 2. Balance Sheet (Base)
    const baseInventory = Math.round((baseCos / 30) * baseInvDays);
    const baseReceivables = Math.round(((baseRevenue * (1 + vatRate / 100)) / 30) * baseRecDays);
    const baseTotalAssets = baseFixedAssets + baseInventory + baseReceivables;
    const basePayables = Math.round(((baseCos * (1 + vatRate / 100)) / 30) * basePayDays);
    const baseNoa = baseTotalAssets - basePayables;

    // 3. Trading Account Ratios (Base)
    const baseRevRatio = 100.0;
    const baseGpRatio = baseRevenue > 0 ? (baseGp / baseRevenue) * 100 : 0;
    const baseGpAdjRatio = baseRevenue > 0 ? (baseGpAdj / baseRevenue) * 100 : 0;
    const baseOtherIncRatio = baseRevenue > 0 ? (baseOtherInc / baseRevenue) * 100 : 0;
    const baseTotalIncRatio = baseRevenue > 0 ? (baseTotalIncome / baseRevenue) * 100 : 0;
    const baseOpexRatio = baseRevenue > 0 ? (-baseOpex / baseRevenue) * 100 : 0;
    const baseNopRatio = baseRevenue > 0 ? (baseNop / baseRevenue) * 100 : 0;

    // 5. Efficiency Ratios (Base)
    const baseRos = baseRevenue > 0 ? (baseNop / baseRevenue) * 100 : 0;
    const baseAssetTurn = baseNoa > 0 ? baseRevenue / baseNoa : 0;
    const baseRoa = baseNoa > 0 ? (baseNop / baseNoa) * 100 : 0;

    // 6. Balance Sheet Ratios (Base)
    const baseRoe = 20.0;
    const baseDebtEquity = 0.6;
    const baseEps = 1.0;

    // ================= REVISED =================
    // 1. Trading Account (Revised)
    const revRev = Math.round(baseRevenue * (1 + whatIfRevPct / 100));
    const baseGpMargin = baseRevenue > 0 ? baseGp / baseRevenue : 0.235294;
    const revGpMargin = baseGpMargin + whatIfGpMarginDeltaPct / 100;
    const revGp = Math.round(revRev * revGpMargin);
    const revCos = revRev - revGp;
    const revGpAdj = Math.round(baseGpAdj * (1 + whatIfGpAdjDeltaPct / 100));
    const revOtherInc = Math.round(baseOtherInc * (1 + whatIfOtherIncDeltaPct / 100));
    const revTotalIncome = revGp + revGpAdj + revOtherInc;
    const revOpex = Math.round(baseOpex * (1 + whatIfOpexPct / 100));
    const revNop = revTotalIncome - revOpex;

    // 2. Balance Sheet (Revised)
    const revFixedAssets = baseFixedAssets;
    const revInventory = Math.round((revCos / 30) * whatIfInvDays);
    const revReceivables = Math.round(((revRev * (1 + vatRate / 100)) / 30) * whatIfRecDays);
    const revTotalAssets = revFixedAssets + revInventory + revReceivables;
    const revPayables = Math.round(((revCos * (1 + vatRate / 100)) / 30) * whatIfPayDays);
    const revNoa = revTotalAssets - revPayables;

    // 3. Trading Account Ratios (Revised)
    const revRevRatio = 100.0 + whatIfRevPct;
    const revGpRatio = revRev > 0 ? (revGp / revRev) * 100 : 0;
    const revGpAdjRatio = revRev > 0 ? (revGpAdj / revRev) * 100 : 0;
    const revOtherIncRatio = revRev > 0 ? (revOtherInc / revRev) * 100 : 0;
    const revTotalIncRatio = revRev > 0 ? (revTotalIncome / revRev) * 100 : 0;
    const revOpexRatio = revRev > 0 ? (-revOpex / revRev) * 100 : 0;
    const revNopRatio = revRev > 0 ? (revNop / revRev) * 100 : 0;

    // 5. Efficiency Ratios (Revised)
    const revRos = revRev > 0 ? (revNop / revRev) * 100 : 0;
    const revAssetTurn = revNoa > 0 ? revRev / revNoa : 0;
    const revRoa = revNoa > 0 ? (revNop / revNoa) * 100 : 0;

    // 6. Balance Sheet Ratios (Revised)
    const revRoe = 20.0;
    const revDebtEquity = 0.6;
    const revEps = 1.0;

    // Working Capital Cash Released
    const cashReleased =
      baseInventory + baseReceivables - basePayables - (revInventory + revReceivables - revPayables);

    return {
      numMonths,
      isRef,
      // Trading
      baseRevenue,
      revRev,
      baseCos,
      revCos,
      baseGp,
      revGp,
      baseGpAdj,
      revGpAdj,
      baseOtherInc,
      revOtherInc,
      baseTotalIncome,
      revTotalIncome,
      baseOpex,
      revOpex,
      baseNop,
      revNop,
      // Balance Sheet
      baseFixedAssets,
      revFixedAssets,
      baseInventory,
      revInventory,
      baseReceivables,
      revReceivables,
      baseTotalAssets,
      revTotalAssets,
      basePayables,
      revPayables,
      baseNoa,
      revNoa,
      // Trading Ratios
      baseRevRatio,
      revRevRatio,
      baseGpRatio,
      revGpRatio,
      baseGpAdjRatio,
      revGpAdjRatio,
      baseOtherIncRatio,
      revOtherIncRatio,
      baseTotalIncRatio,
      revTotalIncRatio,
      baseOpexRatio,
      revOpexRatio,
      baseNopRatio,
      revNopRatio,
      // WC Days
      baseInvDays,
      baseRecDays,
      basePayDays,
      // Efficiency
      baseRos,
      revRos,
      baseAssetTurn,
      revAssetTurn,
      baseRoa,
      revRoa,
      // BS Ratios
      baseRoe,
      revRoe,
      baseDebtEquity,
      revDebtEquity,
      baseEps,
      revEps,
      // Cash Released
      cashReleased,
    };
  }, [
    whatIfPeriod,
    projections,
    funding,
    whatIfRevPct,
    whatIfGpMarginDeltaPct,
    whatIfGpAdjDeltaPct,
    whatIfOtherIncDeltaPct,
    whatIfOpexPct,
    whatIfInvDays,
    whatIfRecDays,
    whatIfPayDays,
  ]);

  // Active 12 months for adjustment slider tables
  const sliderStartIdx = (sliderYear - 1) * 12;
  const current12Months = useMemo(() => {
    return projections.slice(sliderStartIdx, sliderStartIdx + 12);
  }, [projections, sliderStartIdx]);

  // Working Capital Days arrays (ensure 60 months)
  const inventoryDaysArr = useMemo(() => {
    const arr = new Array(60).fill(funding.inventoryDays || 0);
    funding.inventoryDaysMonthly?.forEach((v, idx) => {
      if (idx < 60) arr[idx] = v;
    });
    return arr;
  }, [funding.inventoryDays, funding.inventoryDaysMonthly]);

  const debtorDaysArr = useMemo(() => {
    const arr = new Array(60).fill(funding.debtorDays || 0);
    funding.debtorDaysMonthly?.forEach((v, idx) => {
      if (idx < 60) arr[idx] = v;
    });
    return arr;
  }, [funding.debtorDays, funding.debtorDaysMonthly]);

  const creditorDaysArr = useMemo(() => {
    const arr = new Array(60).fill(funding.creditorDays || 0);
    funding.creditorDaysMonthly?.forEach((v, idx) => {
      if (idx < 60) arr[idx] = v;
    });
    return arr;
  }, [funding.creditorDays, funding.creditorDaysMonthly]);

  // Other Assets arrays
  const depositsArr = useMemo(() => {
    const arr = new Array(60).fill(funding.depositsBase || 0);
    funding.depositsMonthly?.forEach((v, idx) => {
      if (idx < 60) arr[idx] = v;
    });
    return arr;
  }, [funding.depositsBase, funding.depositsMonthly]);

  const floatsArr = useMemo(() => {
    const arr = new Array(60).fill(funding.floatsBase || 0);
    funding.floatsMonthly?.forEach((v, idx) => {
      if (idx < 60) arr[idx] = v;
    });
    return arr;
  }, [funding.floatsBase, funding.floatsMonthly]);

  const pettyCashArr = useMemo(() => {
    const arr = new Array(60).fill(funding.pettyCashBase || 0);
    funding.pettyCashMonthly?.forEach((v, idx) => {
      if (idx < 60) arr[idx] = v;
    });
    return arr;
  }, [funding.pettyCashBase, funding.pettyCashMonthly]);

  // Share Capital arrays
  const additionalSharesArr = useMemo(() => {
    const arr = new Array(60).fill(0);
    funding.additionalSharesMonthly?.forEach((v, idx) => {
      if (idx < 60) arr[idx] = v;
    });
    return arr;
  }, [funding.additionalSharesMonthly]);

  const additionalPriceArr = useMemo(() => {
    const arr = new Array(60).fill(0);
    funding.additionalSharePriceMonthly?.forEach((v, idx) => {
      if (idx < 60) arr[idx] = v;
    });
    return arr;
  }, [funding.additionalSharePriceMonthly]);

  // Equity Loan arrays
  const equityLoanAddArr = useMemo(() => {
    const arr = new Array(60).fill(0);
    funding.equityLoanAdditionalMonthly?.forEach((v, idx) => {
      if (idx < 60) arr[idx] = v;
    });
    return arr;
  }, [funding.equityLoanAdditionalMonthly]);

  const equityLoanRepayArr = useMemo(() => {
    const arr = new Array(60).fill(0);
    funding.equityLoanRepaymentsMonthly?.forEach((v, idx) => {
      if (idx < 60) arr[idx] = v;
    });
    return arr;
  }, [funding.equityLoanRepaymentsMonthly]);

  // Dividends per share array
  const dividendsPerShareArr = useMemo(() => {
    const arr = new Array(60).fill(funding.dividendsPerShareBase || 0);
    funding.dividendsPerShareMonthly?.forEach((v, idx) => {
      if (idx < 60) arr[idx] = v;
    });
    return arr;
  }, [funding.dividendsPerShareBase, funding.dividendsPerShareMonthly]);

  // Handler: Update monthly Working Capital Days
  const handleUpdateWcDaysMonth = (metric: 'inventory' | 'receivables' | 'payables', monthIdx: number, val: number) => {
    const currentArr =
      metric === 'inventory'
        ? [...inventoryDaysArr]
        : metric === 'receivables'
        ? [...debtorDaysArr]
        : [...creditorDaysArr];

    const safeVal = Math.max(0, isNaN(val) ? 0 : val);
    if (cascadeChanges) {
      for (let i = monthIdx; i < 60; i++) {
        currentArr[i] = safeVal;
      }
    } else {
      currentArr[monthIdx] = safeVal;
    }

    if (metric === 'inventory') {
      handleUpdateFunding({ inventoryDaysMonthly: currentArr });
    } else if (metric === 'receivables') {
      handleUpdateFunding({ debtorDaysMonthly: currentArr });
    } else {
      handleUpdateFunding({ creditorDaysMonthly: currentArr });
    }
  };

  // Handler: Update Other Assets monthly values
  const handleUpdateOtherAssetMonth = (metric: 'deposits' | 'floats' | 'petty-cash', monthIdx: number, val: number) => {
    const currentArr =
      metric === 'deposits'
        ? [...depositsArr]
        : metric === 'floats'
        ? [...floatsArr]
        : [...pettyCashArr];

    const safeVal = Math.max(0, isNaN(val) ? 0 : val);
    if (cascadeChanges) {
      for (let i = monthIdx; i < 60; i++) {
        currentArr[i] = safeVal;
      }
    } else {
      currentArr[monthIdx] = safeVal;
    }

    if (metric === 'deposits') {
      handleUpdateFunding({ depositsMonthly: currentArr });
    } else if (metric === 'floats') {
      handleUpdateFunding({ floatsMonthly: currentArr });
    } else {
      handleUpdateFunding({ pettyCashMonthly: currentArr });
    }
  };

  // Handler: Update Share Capital additional issue in a specific month
  const handleUpdateShareIssueMonth = (monthIdx: number, shares: number, price: number) => {
    const newShares = [...additionalSharesArr];
    const newPrices = [...additionalPriceArr];
    newShares[monthIdx] = Math.max(0, isNaN(shares) ? 0 : shares);
    newPrices[monthIdx] = Math.max(0, isNaN(price) ? 0 : price);
    handleUpdateFunding({
      additionalSharesMonthly: newShares,
      additionalSharePriceMonthly: newPrices,
    });
  };

  // Handler: Update Equity Loan monthly activity
  const handleUpdateEquityLoanMonth = (monthIdx: number, addAmount: number, repayAmount: number) => {
    const newAdd = [...equityLoanAddArr];
    const newRepay = [...equityLoanRepayArr];
    newAdd[monthIdx] = Math.max(0, isNaN(addAmount) ? 0 : addAmount);
    newRepay[monthIdx] = Math.max(0, isNaN(repayAmount) ? 0 : repayAmount);
    handleUpdateFunding({
      equityLoanAdditionalMonthly: newAdd,
      equityLoanRepaymentsMonthly: newRepay,
    });
  };

  // Handler: Update Dividends per share for a month
  const handleUpdateDividendsMonth = (monthIdx: number, dps: number) => {
    const newArr = [...dividendsPerShareArr];
    const safeDps = Math.max(0, isNaN(dps) ? 0 : dps);
    if (cascadeChanges) {
      for (let i = monthIdx; i < 60; i++) {
        newArr[i] = safeDps;
      }
    } else {
      newArr[monthIdx] = safeDps;
    }
    handleUpdateFunding({ dividendsPerShareMonthly: newArr });
  };

  // Term Loans list helpers
  const termLoans = funding.termLoans || [];

  const handleAddTermLoan = () => {
    const newLoan: TermLoanEntry = {
      id: `loan-${Date.now()}`,
      name: `Commercial Facility ${termLoans.length + 1}`,
      advanceMonth: 1,
      advanceValue: 200000,
      advanceRatePct: 10.0,
      termYears: 5,
    };
    handleUpdateFunding({ termLoans: [...termLoans, newLoan] });
  };

  const handleUpdateTermLoan = (id: string, patch: Partial<TermLoanEntry>) => {
    const updated = termLoans.map((l) => (l.id === id ? { ...l, ...patch } : l));
    handleUpdateFunding({ termLoans: updated });
  };

  const handleDeleteTermLoan = (id: string) => {
    handleUpdateFunding({ termLoans: termLoans.filter((l) => l.id !== id) });
  };

  // Primary active loan for detailed amortization table display (matching term loans.PNG)
  const primaryLoan = termLoans[0] || {
    id: 'primary',
    name: 'Primary Commercial Term Loan',
    advanceMonth: 1,
    advanceValue: 400000,
    advanceRatePct: 10.0,
    termYears: 5,
  };

  // Format utility
  const formatNum = (val: number | undefined): string => {
    if (val === undefined || isNaN(val) || Math.abs(val) < 0.0001) return '0';
    return Math.round(val).toLocaleString();
  };

  const formatDec = (val: number | undefined): string => {
    if (val === undefined || isNaN(val)) return '0.00';
    return val.toFixed(2);
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
              FUNDING & LIQUIDITY CALCULATOR
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-[#2E5E88]/10 text-[#2E5E88] dark:text-[#5584B4]">
              {mode}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Equity capitalization, term loans, working capital cycles, and What-If ROA sensitivity.
          </p>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* STEP 6 SUB-TAB SWITCHER: DYNAMICS & CASH HORIZON VS WHAT IF           */}
      {/* ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (onSelectSubTab) onSelectSubTab('dynamics');
              setInternalTab('dynamics');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 border cursor-pointer ${
              activeTab === 'dynamics'
                ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-xs'
                : isDark
                ? 'bg-[#101626] text-slate-400 hover:text-white border-[#222F4C]'
                : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Dynamics & Cash Horizon</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSelectSubTab) onSelectSubTab('what-if');
              setInternalTab('what-if');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 border cursor-pointer ${
              activeTab === 'what-if'
                ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-xs'
                : isDark
                ? 'bg-[#101626] text-slate-400 hover:text-white border-[#222F4C]'
                : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>What If Sensitivity Engine</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ROA
            </span>
          </button>
        </div>

        {activeTab === 'what-if' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] text-slate-400">Snapshot #{snapshotCount}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
              {snapshotTimestamp}
            </span>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* WHAT IF TAB CONTENT                                                   */}
      {/* ===================================================================== */}
      {activeTab === 'what-if' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Control Bar: Title, Description, Snapshot & Reset */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-wrap items-center justify-between gap-4 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#5584B4] border border-[#2E5E88]/30 uppercase">
                  WHAT IF SENSITIVITY ENGINE
                </span>
                <span className="text-xs text-slate-400">/</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                  DUAL-AXIS LIQUIDITY COMPARISON
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                Compare baseline forecast with What-If equivalent values after adjusting trading margins and working capital efficiency ratios. Observe how inventory, debtor, and creditor days impact cash flow and liquidity trajectory.
              </p>
            </div>

            {/* Action Buttons: Snapshot & Reset */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleTakeSnapshot}
                className="px-3.5 py-2 rounded-xl bg-[#2E5E88] text-white text-xs font-bold hover:bg-[#254d70] transition-all cursor-pointer shadow-xs inline-flex items-center gap-2"
                title="Create a snapshot of active forecast to model what-if changes against"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Take Snapshot</span>
              </button>

              <button
                type="button"
                onClick={handleResetWhatIf}
                className="px-3.5 py-2 rounded-xl border border-rose-500/30 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                title="Reset What-If forecast values back to baseline forecast values"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset What If</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Scenarios Bar */}
          <div
            className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
              isDark ? 'bg-[#141A2E]/70 border-[#222F4C]' : 'bg-[#F4EFE6]/60 border-[#D8CEBC]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Quick Presets:
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleApplyPreset('ref')}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#5584B4] hover:bg-[#2E5E88]/25 border border-[#2E5E88]/30 transition-all cursor-pointer"
              >
                ★ Excel Reference Scenario (+1% Rev, +2% Opex, 25/25/40d)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('lean')}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
              >
                Lean Working Capital (20d Inv, 20d Rec, 45d Pay)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('growth')}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all cursor-pointer"
              >
                Growth (+5% Rev, +1% Margin, +3% Opex)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('stress')}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
              >
                Downside Pressure (-5% Rev, -2% Margin, +5d Inv/Rec)
              </button>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 1. LIQUIDITY VS DEBT DUAL-AXIS COMPARISON CHART                   */}
          {/* ================================================================= */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-xs ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            {/* Top Bar: Title & Horizon Selector */}
            <div
              className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-3 ${
                isDark ? 'bg-[#141A2E] border-[#222F4C]' : 'bg-[#F4EFE6]/70 border-[#D8CEBC]'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#5584B4] border border-[#2E5E88]/30 uppercase">
                    COMPARATIVE TRAJECTORY
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                    FORECAST VS WHAT-IF DUAL-AXIS LIQUIDITY
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Side-by-side comparison: Forecast Cash (solid emerald) vs What-If Cash (cyan bars), and Forecast Debt (solid rose) vs What-If Debt (dashed amber).
                </p>
              </div>

              {/* Chart Horizon Buttons (Year 1 to 5, or 5-Year Summary) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-bold uppercase mr-1">horizon:</span>
                {[1, 2, 3, 4, 5].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setWhatIfChartHorizon(yr)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      whatIfChartHorizon === yr
                        ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                        : isDark
                        ? 'bg-[#0E1322] text-slate-400 hover:text-white border-[#222F4C]'
                        : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
                    }`}
                  >
                    year {yr}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setWhatIfChartHorizon('summary')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    whatIfChartHorizon === 'summary'
                      ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                      : isDark
                      ? 'bg-[#0E1322] text-slate-400 hover:text-white border-[#222F4C]'
                      : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
                  }`}
                >
                  5-year summary
                </button>
              </div>
            </div>

            {/* Impact Metric Cards */}
            <div
              className={`grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 text-center text-xs border-b ${
                isDark
                  ? 'bg-[#0B0F19] divide-[#222F4C] border-[#222F4C]'
                  : 'bg-[#FAF8F5] divide-[#D8CEBC] border-[#D8CEBC]'
              }`}
            >
              <div className="p-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Working Capital Cash Unlocked
                </span>
                <span
                  className={`font-bold text-sm sm:text-base ${
                    roaTableData.cashReleased >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {roaTableData.cashReleased >= 0 ? '+' : ''}
                  {formatNum(roaTableData.cashReleased)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Released into Bank Cash
                </span>
              </div>

              <div className="p-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Asset Turnover Multiplier
                </span>
                <div className="flex items-center justify-center gap-1 font-bold text-sm sm:text-base">
                  <span className="text-slate-400">{roaTableData.baseAssetTurn.toFixed(2)}x</span>
                  <span className="text-slate-400 text-xs">→</span>
                  <span className="text-[#2E5E88] dark:text-[#5584B4]">
                    {roaTableData.revAssetTurn.toFixed(2)}x
                  </span>
                </div>
                <span className="text-[10px] text-emerald-500 block mt-0.5 font-bold">
                  {roaTableData.baseAssetTurn > 0
                    ? `${(((roaTableData.revAssetTurn - roaTableData.baseAssetTurn) / roaTableData.baseAssetTurn) * 100).toFixed(1)}% Velocity`
                    : 'N/A'}
                </span>
              </div>

              <div className="p-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Return on Assets (ROA)
                </span>
                <div className="flex items-center justify-center gap-1 font-bold text-sm sm:text-base">
                  <span className="text-slate-400">{roaTableData.baseRoa.toFixed(2)}%</span>
                  <span className="text-slate-400 text-xs">→</span>
                  <span className="text-emerald-500">{roaTableData.revRoa.toFixed(2)}%</span>
                </div>
                <span className="text-[10px] text-emerald-500 block mt-0.5 font-bold">
                  {roaTableData.revRoa >= roaTableData.baseRoa ? '+' : ''}
                  {(roaTableData.revRoa - roaTableData.baseRoa).toFixed(2)}% Spread
                </span>
              </div>

              <div className="p-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Net Operating Assets (NOA)
                </span>
                <div className="flex items-center justify-center gap-1 font-bold text-sm sm:text-base">
                  <span className="text-slate-400">{formatNum(roaTableData.baseNoa)}</span>
                  <span className="text-slate-400 text-xs">→</span>
                  <span className="text-sky-500">{formatNum(roaTableData.revNoa)}</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Δ {formatNum(roaTableData.revNoa - roaTableData.baseNoa)}
                </span>
              </div>
            </div>

            {/* Live Dual-Axis Chart with What-If Paired Bars */}
            <div className="p-2 sm:p-4">
              <LiquidityVsDebtChart
                data={whatIfChartData}
                isDark={isDark}
                currencyPrefix=""
                showWhatIfComparison={true}
                title={
                  whatIfChartHorizon === 'summary'
                    ? 'LIQUIDITY VS DEBT COMPARISON — 5-YEAR ANNUAL TRAJECTORY (YEAR 1 TO 5)'
                    : `LIQUIDITY VS DEBT COMPARISON — YEAR ${whatIfChartHorizon} (12 MONTHS)`
                }
              />
            </div>
          </div>

          {/* ================================================================= */}
          {/* 2. INNOVATIVE ADJUSTMENT SLIDERS (EASY DATA ENTRY)                */}
          {/* ================================================================= */}
          <div
            className={`p-5 rounded-2xl border shadow-xs space-y-6 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#2E5E88] dark:text-[#5584B4]" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  WHAT IF SENSITIVITY DYNAMICS — DATA ENTRY SLIDERS
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  REAL-TIME CASCADE
                </span>
              </div>

              <div className="text-[11px] text-slate-400">
                Adjusting elements outlined in red as restricted in user guidelines
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Trading Account Margins & Adjustments */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-[#2E5E88] dark:text-[#5584B4] flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Trading Account Dynamics</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Restricted Ratios</span>
                </div>

                {/* 1. Revenue % Change Slider */}
                <div
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Revenue Change (%)</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setWhatIfRevPct((v) => Number((v - 0.5).toFixed(2)))}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          value={whatIfRevPct}
                          onChange={(e) => setWhatIfRevPct(Number(e.target.value))}
                          className={`w-20 text-center py-1 px-1 rounded border font-bold text-xs text-emerald-600 dark:text-emerald-400 ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                          }`}
                        />
                        <span className="absolute right-1.5 top-1 text-[10px] text-slate-400 pointer-events-none">%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWhatIfRevPct((v) => Number((v + 0.5).toFixed(2)))}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="-20"
                    max="50"
                    step="0.25"
                    value={whatIfRevPct}
                    onChange={(e) => setWhatIfRevPct(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />

                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <span className="text-slate-400">-20%</span>
                    <div className="flex items-center gap-1">
                      {[-5, 0, 1, 2, 5, 10].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setWhatIfRevPct(v)}
                          className={`px-1.5 py-0.5 rounded cursor-pointer ${
                            whatIfRevPct === v
                              ? 'bg-emerald-500 text-white font-bold'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
                          }`}
                        >
                          {v >= 0 ? `+${v}%` : `${v}%`}
                        </button>
                      ))}
                    </div>
                    <span className="text-slate-400">+50%</span>
                  </div>
                </div>

                {/* 2. Gross Profit Margin Delta Slider */}
                <div
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2E5E88]" />
                      <span>Gross Profit Margin Delta (±%)</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setWhatIfGpMarginDeltaPct((v) => Number((v - 0.25).toFixed(2)))}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          value={whatIfGpMarginDeltaPct}
                          onChange={(e) => setWhatIfGpMarginDeltaPct(Number(e.target.value))}
                          className={`w-20 text-center py-1 px-1 rounded border font-bold text-xs text-[#2E5E88] dark:text-[#5584B4] ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                          }`}
                        />
                        <span className="absolute right-1.5 top-1 text-[10px] text-slate-400 pointer-events-none">%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWhatIfGpMarginDeltaPct((v) => Number((v + 0.25).toFixed(2)))}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.25"
                    value={whatIfGpMarginDeltaPct}
                    onChange={(e) => setWhatIfGpMarginDeltaPct(Number(e.target.value))}
                    className="w-full accent-[#2E5E88] cursor-pointer"
                  />

                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <span className="text-slate-400">-10%</span>
                    <div className="flex items-center gap-1">
                      {[-2, -1, 0, 1, 2].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setWhatIfGpMarginDeltaPct(v)}
                          className={`px-1.5 py-0.5 rounded cursor-pointer ${
                            whatIfGpMarginDeltaPct === v
                              ? 'bg-[#2E5E88] text-white font-bold'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
                          }`}
                        >
                          {v >= 0 ? `+${v}%` : `${v}%`}
                        </button>
                      ))}
                    </div>
                    <span className="text-slate-400">+10%</span>
                  </div>
                </div>

                {/* 3. Operating Expenses % Change Slider */}
                <div
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>Operating Expenses Change (%)</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setWhatIfOpexPct((v) => Number((v - 0.5).toFixed(2)))}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          value={whatIfOpexPct}
                          onChange={(e) => setWhatIfOpexPct(Number(e.target.value))}
                          className={`w-20 text-center py-1 px-1 rounded border font-bold text-xs text-rose-500 ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                          }`}
                        />
                        <span className="absolute right-1.5 top-1 text-[10px] text-slate-400 pointer-events-none">%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWhatIfOpexPct((v) => Number((v + 0.5).toFixed(2)))}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="-20"
                    max="50"
                    step="0.25"
                    value={whatIfOpexPct}
                    onChange={(e) => setWhatIfOpexPct(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />

                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <span className="text-slate-400">-20%</span>
                    <div className="flex items-center gap-1">
                      {[-5, 0, 2, 5, 10].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setWhatIfOpexPct(v)}
                          className={`px-1.5 py-0.5 rounded cursor-pointer ${
                            whatIfOpexPct === v
                              ? 'bg-rose-500 text-white font-bold'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
                          }`}
                        >
                          {v >= 0 ? `+${v}%` : `${v}%`}
                        </button>
                      ))}
                    </div>
                    <span className="text-slate-400">+50%</span>
                  </div>
                </div>

                {/* Additional Sliders: GP Adjustments & Other Income */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className={`p-2.5 rounded-xl border text-xs ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">GP Adjustments Delta (%)</span>
                    <input
                      type="number"
                      step="0.5"
                      value={whatIfGpAdjDeltaPct}
                      onChange={(e) => setWhatIfGpAdjDeltaPct(Number(e.target.value))}
                      className={`w-full p-1.5 text-center rounded border font-bold text-xs ${
                        isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                      }`}
                    />
                  </div>

                  <div className={`p-2.5 rounded-xl border text-xs ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Other Income Delta (%)</span>
                    <input
                      type="number"
                      step="0.5"
                      value={whatIfOtherIncDeltaPct}
                      onChange={(e) => setWhatIfOtherIncDeltaPct(Number(e.target.value))}
                      className={`w-full p-1.5 text-center rounded border font-bold text-xs ${
                        isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Balance Sheet Working Capital Days */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-[#2E5E88] dark:text-[#5584B4] flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Working Capital Efficiency Days</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Governed Restraints</span>
                </div>

                {/* 1. Days Inventory (DIO) Slider */}
                <div
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Days Inventory (DIO)</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setWhatIfInvDays((v) => Math.max(0, v - 1))}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="180"
                          value={whatIfInvDays}
                          onChange={(e) => setWhatIfInvDays(Math.max(0, Number(e.target.value)))}
                          className={`w-20 text-center py-1 px-1 rounded border font-bold text-xs text-emerald-600 dark:text-emerald-400 ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                          }`}
                        />
                        <span className="absolute right-1 top-1 text-[10px] text-slate-400 pointer-events-none">d</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWhatIfInvDays((v) => v + 1)}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={whatIfInvDays}
                    onChange={(e) => setWhatIfInvDays(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />

                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <span className="text-slate-400">0d</span>
                    <div className="flex items-center gap-1">
                      {[15, 20, 25, 30, 40, 60].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setWhatIfInvDays(d)}
                          className={`px-1.5 py-0.5 rounded cursor-pointer ${
                            whatIfInvDays === d
                              ? 'bg-emerald-500 text-white font-bold'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                    <span className="text-slate-400">90d</span>
                  </div>
                </div>

                {/* 2. Days Receivables (DSO) Slider */}
                <div
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Days Receivables (DSO)</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setWhatIfRecDays((v) => Math.max(0, v - 1))}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="180"
                          value={whatIfRecDays}
                          onChange={(e) => setWhatIfRecDays(Math.max(0, Number(e.target.value)))}
                          className={`w-20 text-center py-1 px-1 rounded border font-bold text-xs text-[#2E5E88] dark:text-[#5584B4] ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                          }`}
                        />
                        <span className="absolute right-1 top-1 text-[10px] text-slate-400 pointer-events-none">d</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWhatIfRecDays((v) => v + 1)}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={whatIfRecDays}
                    onChange={(e) => setWhatIfRecDays(Number(e.target.value))}
                    className="w-full accent-[#2E5E88] cursor-pointer"
                  />

                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <span className="text-slate-400">0d</span>
                    <div className="flex items-center gap-1">
                      {[15, 20, 25, 30, 45, 60].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setWhatIfRecDays(d)}
                          className={`px-1.5 py-0.5 rounded cursor-pointer ${
                            whatIfRecDays === d
                              ? 'bg-[#2E5E88] text-white font-bold'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                    <span className="text-slate-400">90d</span>
                  </div>
                </div>

                {/* 3. Days Payables (DPO) Slider */}
                <div
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Days Payables (DPO)</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setWhatIfPayDays((v) => Math.max(0, v - 1))}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="180"
                          value={whatIfPayDays}
                          onChange={(e) => setWhatIfPayDays(Math.max(0, Number(e.target.value)))}
                          className={`w-20 text-center py-1 px-1 rounded border font-bold text-xs text-amber-600 dark:text-amber-400 ${
                            isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                          }`}
                        />
                        <span className="absolute right-1 top-1 text-[10px] text-slate-400 pointer-events-none">d</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWhatIfPayDays((v) => v + 1)}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={whatIfPayDays}
                    onChange={(e) => setWhatIfPayDays(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />

                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <span className="text-slate-400">0d</span>
                    <div className="flex items-center gap-1">
                      {[20, 30, 40, 45, 60].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setWhatIfPayDays(d)}
                          className={`px-1.5 py-0.5 rounded cursor-pointer ${
                            whatIfPayDays === d
                              ? 'bg-amber-500 text-white font-bold'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                    <span className="text-slate-400">90d</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DYNAMICS TAB CONTENT: LIQUIDITY VS DEBT CHART + ADJUSTMENT SLIDERS    */}
      {/* ===================================================================== */}
      {activeTab === 'dynamics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* ================================================================= */}
          {/* 1. TOP SECTION: LIQUIDITY VS DEBT DUAL-AXIS CHART                 */}
          {/* ================================================================= */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-xs ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            {/* Top Bar: Title & Horizon Selector */}
            <div
              className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-3 ${
                isDark ? 'bg-[#141A2E] border-[#222F4C]' : 'bg-[#F4EFE6]/70 border-[#D8CEBC]'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#5584B4] border border-[#2E5E88]/30 uppercase">
                    STEP 06 · FUNDING CALCULATOR
                  </span>
                  <span className="text-xs text-slate-400">/</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                    LIQUIDITY VS DEBT TRAJECTORY
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dynamic simulation response: Scrub the adjustment sliders below to observe real-time bank cash & term debt trajectory.
                </p>
              </div>

              {/* Chart Horizon Buttons (Year 1 to 5, or 5-Year Summary) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-bold uppercase mr-1">horizon:</span>
                {[1, 2, 3, 4, 5].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setChartHorizonYear(yr)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      chartHorizonYear === yr
                        ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                        : isDark
                        ? 'bg-[#0E1322] text-slate-400 hover:text-white border-[#222F4C]'
                        : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
                    }`}
                  >
                    year {yr}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setChartHorizonYear('summary')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    chartHorizonYear === 'summary'
                      ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                      : isDark
                      ? 'bg-[#0E1322] text-slate-400 hover:text-white border-[#222F4C]'
                      : 'bg-white text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
                  }`}
                >
                  5-year summary
                </button>
              </div>
            </div>

            {/* KPI Summary Cards Bar */}
            <div
              className={`grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 text-center text-xs border-b ${
                isDark
                  ? 'bg-[#0B0F19] divide-[#222F4C] border-[#222F4C]'
                  : 'bg-[#FAF8F5] divide-[#D8CEBC] border-[#D8CEBC]'
              }`}
            >
              <div className="p-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Closing Cash</span>
                <span
                  className={`font-bold text-sm sm:text-base ${
                    kpiMetrics.closingCash >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {formatNum(kpiMetrics.closingCash)}
                </span>
              </div>

              <div className="p-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Term Debt Balance</span>
                <span className="font-bold text-sm sm:text-base text-rose-500">
                  {formatNum(kpiMetrics.termDebt)}
                </span>
              </div>

              <div className="p-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Net Position (Cash - IBD)</span>
                <span
                  className={`font-bold text-sm sm:text-base ${
                    kpiMetrics.netLiquidity >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {formatNum(kpiMetrics.netLiquidity)}
                </span>
              </div>

              <div className="p-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Cash Conversion Cycle</span>
                <span className="font-bold text-sm sm:text-base text-[#2E5E88] dark:text-[#5584B4]">
                  {kpiMetrics.ccc} Days
                </span>
              </div>

              <div className="p-3 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Debt / Equity Ratio</span>
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {formatDec(kpiMetrics.debtEquityRatio)}
                </span>
              </div>
            </div>

            {/* Live Liquidity vs Debt Dual-Axis SVG Chart */}
            <div className="p-2 sm:p-4">
              <LiquidityVsDebtChart
                data={chartData}
                isDark={isDark}
                currencyPrefix=""
                title={
                  chartHorizonYear === 'summary'
                    ? 'LIQUIDITY VS DEBT — 5-YEAR ANNUAL TRAJECTORY (YEAR 1 TO 5)'
                    : `LIQUIDITY VS DEBT — YEAR ${chartHorizonYear} (12 MONTHS)`
                }
              />
            </div>
          </div>

          {/* ================================================================= */}
          {/* GLOBAL ADJUSTMENT SLIDER CONTROLS (YEAR SELECTOR & CASCADE)       */}
          {/* ================================================================= */}
          <div
            className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-xs ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#2E5E88] dark:text-[#5584B4]" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                ADJUSTMENT SLIDER CONTROLS
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Year Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-bold uppercase">Slider Year:</span>
                {[1, 2, 3, 4, 5].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSliderYear(yr)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      sliderYear === yr
                        ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                        : isDark
                        ? 'bg-[#0E1322] text-slate-400 hover:text-white border-[#222F4C]'
                        : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
                    }`}
                  >
                    year {yr}
                  </button>
                ))}
              </div>

              {/* Cascade to subsequent months toggle */}
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cascadeChanges}
                  onChange={(e) => setCascadeChanges(e.target.checked)}
                  className="rounded text-[#2E5E88] focus:ring-[#2E5E88]"
                />
                <span className="font-semibold">cascade changes to subsequent months</span>
              </label>
            </div>
          </div>

          {/* ================================================================= */}
          {/* SECTION 1: WORKING CAPITAL DAYS & VELOCITY (INVENTORY, REC, PAY)  */}
          {/* ================================================================= */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-xs ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div
              onClick={() => setShowWcSection(!showWcSection)}
              className={`p-4 sm:p-5 border-b flex items-center justify-between cursor-pointer select-none ${
                isDark ? 'bg-[#141A2E] border-[#222F4C]' : 'bg-[#F4EFE6]/50 border-[#D8CEBC]'
              }`}
            >
              <div>
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#2E5E88] dark:text-[#5584B4]" />
                  <span>1. WORKING CAPITAL DAYS & VELOCITY (INVENTORY, RECEIVABLES, PAYABLES)</span>
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inventory (DIO), Receivables (DSO), Payables (DPO). Formula: Month-End = (Monthly Volume / 30) × Days.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#2E5E88] dark:text-[#5584B4]">
                  CCC: {kpiMetrics.ccc} Days
                </span>
                {showWcSection ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {showWcSection && (
              <div className="p-4 sm:p-6 space-y-5">
                {/* Mathematical Formula Callout */}
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1 text-[#2E5E88] dark:text-blue-300">
                  <div className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Working Capital Governing Formulas:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px] font-sans text-slate-600 dark:text-slate-300">
                    <li><strong>Inventory (Month-End):</strong> (Month's Cost of Sales / 30) × Inventory Days</li>
                    <li><strong>Receivables (Month-End):</strong> [Month's Revenue × (1 + VAT Rate) / 30] × Receivables Days</li>
                    <li><strong>Payables (Month-End):</strong> [Month's Cost of Sales × (1 + VAT Rate) / 30] × Payables Days</li>
                    <li><strong>Cash Conversion Cycle (CCC):</strong> Inventory Days + Receivables Days - Payables Days</li>
                  </ul>
                </div>

                {/* Base Value Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Inventory Days (DIO)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={funding.inventoryDays}
                        onChange={(e) => handleUpdateFunding({ inventoryDays: Number(e.target.value) })}
                        className={`w-full p-2 rounded-lg border text-xs font-bold ${
                          isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                        }`}
                      />
                      <span className="text-xs text-slate-400">Days</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Receivables Days (DSO)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={funding.debtorDays}
                        onChange={(e) => handleUpdateFunding({ debtorDays: Number(e.target.value) })}
                        className={`w-full p-2 rounded-lg border text-xs font-bold text-[#2E5E88] dark:text-[#5584B4] ${
                          isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                        }`}
                      />
                      <span className="text-xs text-slate-400">Days</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Payables Days (DPO)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={funding.creditorDays}
                        onChange={(e) => handleUpdateFunding({ creditorDays: Number(e.target.value) })}
                        className={`w-full p-2 rounded-lg border text-xs font-bold text-emerald-600 dark:text-emerald-400 ${
                          isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                        }`}
                      />
                      <span className="text-xs text-slate-400">Days</span>
                    </div>
                  </div>
                </div>

                {/* Adjustment Slider Selector for Working Capital */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                        ADJUSTMENT SLIDER:
                      </span>
                      {[
                        { id: 'inventory', label: 'Inventory (DIO)' },
                        { id: 'receivables', label: 'Receivables (DSO)' },
                        { id: 'payables', label: 'Payables (DPO)' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveWcMetric(item.id as any)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold lowercase transition-all border cursor-pointer ${
                            activeWcMetric === item.id
                              ? 'bg-[#2E5E88] text-white border-[#2E5E88]'
                              : isDark
                              ? 'bg-[#0E1322] text-slate-400 border-[#222F4C]'
                              : 'bg-white text-slate-600 border-[#D8CEBC]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <span className="text-[11px] text-slate-400">
                      Showing Year {sliderYear} (Months {sliderStartIdx + 1}–{sliderStartIdx + 12})
                    </span>
                  </div>

                  {/* 12-Month Scrubbable Days Grid */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-[#141A2E] border-b border-slate-200 dark:border-slate-800 text-slate-400">
                          <th className="py-2.5 px-3 text-left font-bold w-40 whitespace-nowrap">Period</th>
                          {Array.from({ length: 12 }, (_, i) => (
                            <th key={i} className="py-2 px-1 min-w-[55px] font-bold text-right pr-2">
                              M{sliderStartIdx + i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {/* Days Input Row */}
                        <tr>
                          <td className="py-2.5 px-3 text-left font-bold text-slate-900 dark:text-white capitalize">
                            {activeWcMetric} Days
                          </td>
                          {Array.from({ length: 12 }, (_, i) => {
                            const mIdx = sliderStartIdx + i;
                            const currentVal =
                              activeWcMetric === 'inventory'
                                ? inventoryDaysArr[mIdx]
                                : activeWcMetric === 'receivables'
                                ? debtorDaysArr[mIdx]
                                : creditorDaysArr[mIdx];
                            return (
                              <td key={i} className="py-2 px-1 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  value={currentVal}
                                  onChange={(e) =>
                                    handleUpdateWcDaysMonth(activeWcMetric, mIdx, Number(e.target.value))
                                  }
                                  className={`w-full py-1 text-right pr-2 rounded border font-bold text-xs ${
                                    isDark
                                      ? 'bg-[#0E1322] border-[#222F4C] text-slate-200'
                                      : 'bg-white border-[#D8CEBC] text-slate-800'
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>

                        {/* Calculated Value Row for Selected Metric */}
                        <tr className="bg-slate-50/50 dark:bg-[#0E1322]/40 font-bold">
                          <td className="py-2 px-3 text-left text-slate-500 capitalize">
                            Month-End {activeWcMetric} Value
                          </td>
                          {current12Months.map((m, i) => {
                            const val =
                              activeWcMetric === 'inventory'
                                ? m.inventory
                                : activeWcMetric === 'receivables'
                                ? m.accounts_receivable
                                : m.accounts_payable;
                            return (
                              <td key={i} className="py-2 px-1 text-right pr-2 text-slate-900 dark:text-white">
                                {formatNum(val)}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Complete Working Capital Breakdown Schedule Table */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 block">
                    WORKING CAPITAL 12-MONTH MONTH-END LEDGER (YEAR {sliderYear})
                  </span>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-[#141A2E] border-b border-slate-200 dark:border-slate-800 text-slate-400">
                          <th className="py-2.5 px-3 text-left font-bold w-48">Line Item</th>
                          {Array.from({ length: 12 }, (_, i) => (
                            <th key={i} className="py-2 px-1 min-w-[55px] font-bold text-right pr-2">
                              M{sliderStartIdx + i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">Cost of Sales (COS)</td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-700 dark:text-slate-300">
                              {formatNum(m.totalCos)}
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-emerald-500/5">
                          <td className="py-2 px-3 text-left font-bold text-emerald-600 dark:text-emerald-400">
                            Month-End Inventory
                          </td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 font-bold text-emerald-600 dark:text-emerald-400">
                              {formatNum(m.inventory)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">Revenue (Incl. VAT)</td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-700 dark:text-slate-300">
                              {formatNum(m.revenue * (1 + (m.vatRate || 15) / 100))}
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-blue-500/5">
                          <td className="py-2 px-3 text-left font-bold text-[#2E5E88] dark:text-[#5584B4]">
                            Month-End Receivables
                          </td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 font-bold text-[#2E5E88] dark:text-[#5584B4]">
                              {formatNum(m.accounts_receivable)}
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-rose-500/5">
                          <td className="py-2 px-3 text-left font-bold text-rose-500">
                            Month-End Payables
                          </td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 font-bold text-rose-500">
                              {formatNum(m.accounts_payable)}
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-slate-100/70 dark:bg-[#141A2E]/70 font-bold border-t">
                          <td className="py-2 px-3 text-left text-slate-900 dark:text-white">
                            Net Working Capital (Inv + Rec - Pay)
                          </td>
                          {current12Months.map((m, i) => {
                            const nwc = m.inventory + m.accounts_receivable - m.accounts_payable;
                            return (
                              <td key={i} className="py-2 px-1 text-right pr-2 text-slate-900 dark:text-white">
                                {formatNum(nwc)}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* SECTION 2: OTHER ASSETS (DEPOSITS, FLOATS, PETTY CASH)            */}
          {/* ================================================================= */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-xs ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div
              onClick={() => setShowOtherAssetsSection(!showOtherAssetsSection)}
              className={`p-4 sm:p-5 border-b flex items-center justify-between cursor-pointer select-none ${
                isDark ? 'bg-[#141A2E] border-[#222F4C]' : 'bg-[#F4EFE6]/50 border-[#D8CEBC]'
              }`}
            >
              <div>
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#2E5E88] dark:text-[#5584B4]" />
                  <span>2. OTHER ASSETS (DEPOSITS, FLOATS, PETTY CASH)</span>
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Base liquidity reserves and security deposits adjusted through monthly sliders.
                </p>
              </div>
              {showOtherAssetsSection ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>

            {showOtherAssetsSection && (
              <div className="p-4 sm:p-6 space-y-5">
                {/* Base Value Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Base Deposits</span>
                    <input
                      type="number"
                      min="0"
                      value={funding.depositsBase ?? 0}
                      onChange={(e) => handleUpdateFunding({ depositsBase: Number(e.target.value) })}
                      className={`w-full p-2 rounded-lg border text-xs font-bold ${
                        isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                      }`}
                    />
                  </div>

                  <div className={`p-4 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Base Cash Floats</span>
                    <input
                      type="number"
                      min="0"
                      value={funding.floatsBase ?? 0}
                      onChange={(e) => handleUpdateFunding({ floatsBase: Number(e.target.value) })}
                      className={`w-full p-2 rounded-lg border text-xs font-bold ${
                        isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                      }`}
                    />
                  </div>

                  <div className={`p-4 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Base Petty Cash</span>
                    <input
                      type="number"
                      min="0"
                      value={funding.pettyCashBase ?? 0}
                      onChange={(e) => handleUpdateFunding({ pettyCashBase: Number(e.target.value) })}
                      className={`w-full p-2 rounded-lg border text-xs font-bold ${
                        isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                      }`}
                    />
                  </div>
                </div>

                {/* Other Assets Adjustment Slider Selector */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                        ADJUSTMENT SLIDER:
                      </span>
                      {[
                        { id: 'deposits', label: 'Deposits' },
                        { id: 'floats', label: 'Floats' },
                        { id: 'petty-cash', label: 'Petty Cash' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveOtherAssetMetric(item.id as any)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold lowercase transition-all border cursor-pointer ${
                            activeOtherAssetMetric === item.id
                              ? 'bg-[#2E5E88] text-white border-[#2E5E88]'
                              : isDark
                              ? 'bg-[#0E1322] text-slate-400 border-[#222F4C]'
                              : 'bg-white text-slate-600 border-[#D8CEBC]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <span className="text-[11px] text-slate-400">
                      Showing Year {sliderYear} (Months {sliderStartIdx + 1}–{sliderStartIdx + 12})
                    </span>
                  </div>

                  {/* 12-Month Scrubbable Other Assets Input Grid */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-[#141A2E] border-b border-slate-200 dark:border-slate-800 text-slate-400">
                          <th className="py-2.5 px-3 text-left font-bold w-40 whitespace-nowrap">Asset Category</th>
                          {Array.from({ length: 12 }, (_, i) => (
                            <th key={i} className="py-2 px-1 min-w-[55px] font-bold text-right pr-2">
                              M{sliderStartIdx + i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        <tr>
                          <td className="py-2.5 px-3 text-left font-bold text-slate-900 dark:text-white capitalize">
                            {activeOtherAssetMetric}
                          </td>
                          {Array.from({ length: 12 }, (_, i) => {
                            const mIdx = sliderStartIdx + i;
                            const currentVal =
                              activeOtherAssetMetric === 'deposits'
                                ? depositsArr[mIdx]
                                : activeOtherAssetMetric === 'floats'
                                ? floatsArr[mIdx]
                                : pettyCashArr[mIdx];
                            return (
                              <td key={i} className="py-2 px-1 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  value={currentVal}
                                  onChange={(e) =>
                                    handleUpdateOtherAssetMonth(activeOtherAssetMetric, mIdx, Number(e.target.value))
                                  }
                                  className={`w-full py-1 text-right pr-2 rounded border font-bold text-xs ${
                                    isDark
                                      ? 'bg-[#0E1322] border-[#222F4C] text-slate-200'
                                      : 'bg-white border-[#D8CEBC] text-slate-800'
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="bg-slate-50/50 dark:bg-[#0E1322]/40 font-bold">
                          <td className="py-2 px-3 text-left text-slate-500">
                            Total Other Assets
                          </td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-900 dark:text-white">
                              {formatNum(m.other_assets)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* SECTION 3: TERM LOANS (PPMT / IPMT ENGINE)                        */}
          {/* ================================================================= */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-xs ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div
              onClick={() => setShowTermLoansSection(!showTermLoansSection)}
              className={`p-4 sm:p-5 border-b flex items-center justify-between cursor-pointer select-none ${
                isDark ? 'bg-[#141A2E] border-[#222F4C]' : 'bg-[#F4EFE6]/50 border-[#D8CEBC]'
              }`}
            >
              <div>
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                  <span>3. TERM LOANS & AMORTIZATION SCHEDULE (EXCEL PPMT & IPMT)</span>
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Term debt facility: advance month, value, interest rate %, term in years. Matches authentic V1 schedule.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddTermLoan();
                  }}
                  className="px-3 py-1 rounded-lg bg-[#2E5E88] text-white text-xs font-bold hover:bg-[#254d70] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Loan</span>
                </button>
                {showTermLoansSection ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {showTermLoansSection && (
              <div className="p-4 sm:p-6 space-y-5">
                {/* Explanatory Formula Callout */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1 text-amber-700 dark:text-amber-300">
                  <div className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Term Loan Governing Rules (Reference: term loans.PNG):</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px] font-sans text-slate-600 dark:text-slate-300">
                    <li><strong>Capital Repayment:</strong> Calculated using Excel PPMT function (negative cashflow/principal).</li>
                    <li><strong>Interest Payment:</strong> Calculated using Excel IPMT function (shown as negative value on Income Statement & Cashflow as interest - term loan).</li>
                    <li><strong>Closing Balance:</strong> Capital value less capital repayment (negative value on Balance Sheet).</li>
                    <li><strong>Cash Flow Statement:</strong> First month = value of loan less first month's capital repayment; thereafter = month's balance sheet value less previous month's balance sheet value.</li>
                  </ul>
                </div>

                {/* Term Loans Config Cards */}
                <div className="space-y-3">
                  {termLoans.map((tl, idx) => (
                    <div
                      key={tl.id}
                      className={`p-4 rounded-xl border space-y-3 ${
                        isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>{tl.name}</span>
                        </span>
                        {termLoans.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTermLoan(tl.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remove Term Loan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                            Advance Month (1–60)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={tl.advanceMonth}
                            onChange={(e) => handleUpdateTermLoan(tl.id, { advanceMonth: Number(e.target.value) })}
                            className={`w-full p-2 rounded-lg border font-bold ${
                              isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                            Advance Value
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="10000"
                            value={tl.advanceValue}
                            onChange={(e) => handleUpdateTermLoan(tl.id, { advanceValue: Number(e.target.value) })}
                            className={`w-full p-2 rounded-lg border font-bold text-rose-500 ${
                              isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                            Interest Rate (% p.a.)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.25"
                            value={tl.advanceRatePct}
                            onChange={(e) => handleUpdateTermLoan(tl.id, { advanceRatePct: Number(e.target.value) })}
                            className={`w-full p-2 rounded-lg border font-bold ${
                              isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                            Term (Years)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={tl.termYears}
                            onChange={(e) => handleUpdateTermLoan(tl.id, { termYears: Number(e.target.value) })}
                            className={`w-full p-2 rounded-lg border font-bold ${
                              isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Term Loan Amortization Schedule Table (Matching term loans.PNG) */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                      TERM LOAN INTEREST & PRINCIPAL SCHEDULE (YEAR {sliderYear})
                    </span>
                    <span className="text-[10px] text-slate-400">Excel PPMT & IPMT Parity</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-[#141A2E] border-b border-slate-200 dark:border-slate-800 text-slate-400">
                          <th className="py-2.5 px-3 text-left font-bold w-48">loan period</th>
                          {Array.from({ length: 12 }, (_, i) => (
                            <th key={i} className="py-2 px-1 min-w-[55px] font-bold text-right pr-2">
                              {sliderStartIdx + i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">term loan - advance</td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-700 dark:text-slate-300">
                              {formatNum(m.term_loan_advance || primaryLoan.advanceValue)}
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-rose-500/5 font-bold">
                          <td className="py-2 px-3 text-left text-rose-500">term loan - capital repayment</td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-rose-500">
                              {formatNum(m.term_loan_capital_repayment)}
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-amber-500/5 font-bold">
                          <td className="py-2 px-3 text-left text-amber-600 dark:text-amber-400">
                            term loan - interest payment
                          </td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-amber-600 dark:text-amber-400">
                              {formatNum(m.term_loan_interest_payment)}
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-slate-100/70 dark:bg-[#141A2E]/70 font-bold border-t">
                          <td className="py-2 px-3 text-left text-slate-900 dark:text-white">
                            term loan - closing balance
                          </td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-900 dark:text-white">
                              {formatNum(m.term_loan_balance)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">interest rate - %</td>
                          {current12Months.map((_, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-400">
                              {(primaryLoan.advanceRatePct || 10).toFixed(2)}%
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">term loan - years</td>
                          {current12Months.map((_, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-400">
                              {primaryLoan.termYears || 5}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">term loan - no. of annual payments</td>
                          {current12Months.map((_, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-400">
                              12
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">term loan - number of payments</td>
                          {current12Months.map((_, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-400">
                              {(primaryLoan.termYears || 5) * 12}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* SECTION 4: SHARE CAPITAL & EQUITY LOANS                           */}
          {/* ================================================================= */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-xs ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div
              onClick={() => setShowShareCapitalSection(!showShareCapitalSection)}
              className={`p-4 sm:p-5 border-b flex items-center justify-between cursor-pointer select-none ${
                isDark ? 'bg-[#141A2E] border-[#222F4C]' : 'bg-[#F4EFE6]/50 border-[#D8CEBC]'
              }`}
            >
              <div>
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>4. SHARE CAPITAL & EQUITY LOAN SCHEDULE (REF: SHARE CAPITAL.PNG)</span>
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Share issues & premium, ordinary share capital, equity loans, and balance sheet credit balances.
                </p>
              </div>
              {showShareCapitalSection ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>

            {showShareCapitalSection && (
              <div className="p-4 sm:p-6 space-y-5">
                {/* Mathematical Note */}
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1 text-emerald-700 dark:text-emerald-300">
                  <div className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Share Capital & Equity Loan Principles (Reference: share capital.PNG):</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px] font-sans text-slate-600 dark:text-slate-300">
                    <li><strong>Shareholders' Capital:</strong> Balance sheet value is shown as a negative (credit) value.</li>
                    <li><strong>Shares in Issue:</strong> Displayed on the balance sheet for reference without direct calculation impact.</li>
                    <li><strong>Capital Raised:</strong> Shown on the Cash Flow statement as a positive balance in the month raised.</li>
                    <li><strong>Equity Loan:</strong> Credit balance shown on the Balance Sheet as a negative value. Cash flow shows changed values.</li>
                  </ul>
                </div>

                {/* Base Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Initial Shares Issued</span>
                    <input
                      type="number"
                      min="1"
                      value={funding.initialSharesCount ?? 1000}
                      onChange={(e) => handleUpdateFunding({ initialSharesCount: Number(e.target.value) })}
                      className={`w-full p-2 rounded-lg border text-xs font-bold ${
                        isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                      }`}
                    />
                  </div>

                  <div className={`p-4 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Initial Issue Price</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.10"
                      value={funding.initialSharePrice ?? 1.0}
                      onChange={(e) => handleUpdateFunding({ initialSharePrice: Number(e.target.value) })}
                      className={`w-full p-2 rounded-lg border text-xs font-bold ${
                        isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                      }`}
                    />
                  </div>

                  <div className={`p-4 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Equity Loan Opening Balance</span>
                    <input
                      type="number"
                      value={funding.equityLoanOpening ?? -20000}
                      onChange={(e) => handleUpdateFunding({ equityLoanOpening: Number(e.target.value) })}
                      className={`w-full p-2 rounded-lg border text-xs font-bold text-rose-500 ${
                        isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                      }`}
                    />
                  </div>
                </div>

                {/* Share Capital Schedule Table (Matching share capital.PNG) */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 block">
                    SHARE CAPITAL SCHEDULE (YEAR {sliderYear})
                  </span>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-[#141A2E] border-b border-slate-200 dark:border-slate-800 text-slate-400">
                          <th className="py-2.5 px-3 text-left font-bold w-56 whitespace-nowrap">share capital</th>
                          {Array.from({ length: 12 }, (_, i) => (
                            <th key={i} className="py-2 px-1 min-w-[55px] font-bold text-right pr-2">
                              M{sliderStartIdx + i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">shares - number of shares issued</td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-700 dark:text-slate-300">
                              {formatNum(funding.initialSharesCount ?? 1000)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">shares - issue price</td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-700 dark:text-slate-300">
                              {formatDec(funding.initialSharePrice ?? 1.0)}
                            </td>
                          ))}
                        </tr>
                        <tr className="font-bold">
                          <td className="py-2 px-3 text-left text-slate-700 dark:text-slate-300">ordinary share capital</td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-700 dark:text-slate-300">
                              {formatNum(m.ordinary_share_capital)}
                            </td>
                          ))}
                        </tr>
                        {/* Additional Shares Issued Row (Scrubbable / Editable) */}
                        <tr className="bg-blue-500/5">
                          <td className="py-2 px-3 text-left font-bold text-[#2E5E88] dark:text-[#5584B4]">
                            shares - additional shares issued
                          </td>
                          {Array.from({ length: 12 }, (_, i) => {
                            const mIdx = sliderStartIdx + i;
                            return (
                              <td key={i} className="py-2 px-1 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  value={additionalSharesArr[mIdx] || ''}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleUpdateShareIssueMonth(
                                      mIdx,
                                      Number(e.target.value),
                                      additionalPriceArr[mIdx] || 5.0
                                    )
                                  }
                                  className={`w-full py-1 text-right pr-2 rounded border font-bold text-xs ${
                                    isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">shares in issue</td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-700 dark:text-slate-300 font-bold">
                              {formatNum(m.shares_in_issue)}
                            </td>
                          ))}
                        </tr>
                        {/* Additional Share Issue Price */}
                        <tr className="bg-blue-500/5">
                          <td className="py-2 px-3 text-left font-bold text-[#2E5E88] dark:text-[#5584B4]">
                            shares - issue price
                          </td>
                          {Array.from({ length: 12 }, (_, i) => {
                            const mIdx = sliderStartIdx + i;
                            return (
                              <td key={i} className="py-2 px-1 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={additionalPriceArr[mIdx] || ''}
                                  placeholder="0.00"
                                  onChange={(e) =>
                                    handleUpdateShareIssueMonth(
                                      mIdx,
                                      additionalSharesArr[mIdx],
                                      Number(e.target.value)
                                    )
                                  }
                                  className={`w-full py-1 text-right pr-2 rounded border font-bold text-xs ${
                                    isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">share capital - additional raised</td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-700 dark:text-slate-300 font-bold">
                              {formatNum(-m.share_capital_additional_raised)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">share premium</td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-700 dark:text-slate-300 font-bold">
                              {formatNum(m.share_premium)}
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-slate-100/70 dark:bg-[#141A2E]/70 font-bold border-t">
                          <td className="py-2 px-3 text-left text-slate-900 dark:text-white">
                            shareholders' capital
                          </td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-900 dark:text-white">
                              {formatNum(m.shareholders_capital)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Equity Loan Calculation Schedule Table (Matching share capital.PNG) */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 block">
                    EQUITY LOAN CALCULATION (YEAR {sliderYear})
                  </span>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-[#141A2E] border-b border-slate-200 dark:border-slate-800 text-slate-400">
                          <th className="py-2.5 px-3 text-left font-bold w-56 whitespace-nowrap">equity loan calculation</th>
                          {Array.from({ length: 12 }, (_, i) => (
                            <th key={i} className="py-2 px-1 min-w-[55px] font-bold text-right pr-2">
                              M{sliderStartIdx + i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">equity loan - opening balance</td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-700 dark:text-slate-300">
                              {formatNum(m.equity_loan_opening)}
                            </td>
                          ))}
                        </tr>
                        {/* Additional loan raised row */}
                        <tr className="bg-emerald-500/5">
                          <td className="py-2 px-3 text-left font-bold text-emerald-600 dark:text-emerald-400">
                            equity loan - additional loan raised
                          </td>
                          {Array.from({ length: 12 }, (_, i) => {
                            const mIdx = sliderStartIdx + i;
                            return (
                              <td key={i} className="py-2 px-1 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  value={equityLoanAddArr[mIdx] || ''}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleUpdateEquityLoanMonth(
                                      mIdx,
                                      Number(e.target.value),
                                      equityLoanRepayArr[mIdx]
                                    )
                                  }
                                  className={`w-full py-1 text-right pr-2 rounded border font-bold text-xs ${
                                    isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                        {/* Repayments row */}
                        <tr className="bg-rose-500/5">
                          <td className="py-2 px-3 text-left font-bold text-rose-500">
                            equity loan - repayments of loan
                          </td>
                          {Array.from({ length: 12 }, (_, i) => {
                            const mIdx = sliderStartIdx + i;
                            return (
                              <td key={i} className="py-2 px-1 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  value={equityLoanRepayArr[mIdx] || ''}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleUpdateEquityLoanMonth(
                                      mIdx,
                                      equityLoanAddArr[mIdx],
                                      Number(e.target.value)
                                    )
                                  }
                                  className={`w-full py-1 text-right pr-2 rounded border font-bold text-xs ${
                                    isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="bg-slate-100/70 dark:bg-[#141A2E]/70 font-bold border-t">
                          <td className="py-2 px-3 text-left text-slate-900 dark:text-white">
                            equity loan - closing balance
                          </td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-900 dark:text-white">
                              {formatNum(m.equity_loan_closing)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* SECTION 5: DIVIDENDS (ADJUSTMENT SLIDER & EPS ENGINE)             */}
          {/* ================================================================= */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-xs ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div
              onClick={() => setShowDividendsSection(!showDividendsSection)}
              className={`p-4 sm:p-5 border-b flex items-center justify-between cursor-pointer select-none ${
                isDark ? 'bg-[#141A2E] border-[#222F4C]' : 'bg-[#F4EFE6]/50 border-[#D8CEBC]'
              }`}
            >
              <div>
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-[#2E5E88] dark:text-[#5584B4]" />
                  <span>5. DIVIDENDS & RETURN ON EQUITY (REF: DIVIDENDS.PNG)</span>
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Shares in issue, EPS, bank balance per share, dividends per share slider, and debt/equity ratio.
                </p>
              </div>
              {showDividendsSection ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>

            {showDividendsSection && (
              <div className="p-4 sm:p-6 space-y-5">
                {/* Governing Rules */}
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1 text-[#2E5E88] dark:text-blue-300">
                  <div className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Dividends Dynamics (Reference: dividends.PNG):</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px] font-sans text-slate-600 dark:text-slate-300">
                    <li><strong>Dividends Per Share:</strong> Enter values across the 60 months using the Adjustment Slider below.</li>
                    <li><strong>Dividends Value:</strong> Calculated from dividends per share multiplied by the shares in issue.</li>
                    <li><strong>Reporting Presentation:</strong> Shown as a negative value on the Income Statement and the Cashflow Statement.</li>
                  </ul>
                </div>

                {/* Base DPS Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Base Dividends Per Share</span>
                    <input
                      type="number"
                      min="0"
                      step="0.10"
                      value={funding.dividendsPerShareBase ?? 0}
                      onChange={(e) => handleUpdateFunding({ dividendsPerShareBase: Number(e.target.value) })}
                      className={`w-full p-2 rounded-lg border text-xs font-bold ${
                        isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                      }`}
                    />
                  </div>

                  <div className={`p-4 rounded-xl border space-y-1.5 flex items-center justify-between ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Quick Apply DPS (Year {sliderYear})</span>
                      <span className="text-xs text-slate-500">Apply standard dividend rate to active year</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[0.5, 1.0, 2.0].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => {
                            const newArr = [...dividendsPerShareArr];
                            for (let i = sliderStartIdx; i < sliderStartIdx + 12; i++) {
                              newArr[i] = rate;
                            }
                            handleUpdateFunding({ dividendsPerShareMonthly: newArr });
                          }}
                          className="px-2.5 py-1 rounded bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#5584B4] border border-[#2E5E88]/30 text-xs font-bold hover:bg-[#2E5E88] hover:text-white transition-colors cursor-pointer"
                        >
                          +{rate.toFixed(2)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dividends Schedule Table (Matching dividends.PNG) */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 block">
                    DIVIDENDS & EARNINGS PER SHARE SCHEDULE (YEAR {sliderYear})
                  </span>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-[#141A2E] border-b border-slate-200 dark:border-slate-800 text-slate-400">
                          <th className="py-2.5 px-3 text-left font-bold w-56 whitespace-nowrap">dividends</th>
                          {Array.from({ length: 12 }, (_, i) => (
                            <th key={i} className="py-2 px-1 min-w-[55px] font-bold text-right pr-2">
                              M{sliderStartIdx + i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">shares in issue</td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-700 dark:text-slate-300 font-bold">
                              {formatNum(m.shares_in_issue)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">earnings per share</td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-700 dark:text-slate-300">
                              {formatDec(m.eps)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">bank balance per share</td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-700 dark:text-slate-300">
                              {formatDec(m.bank_balance_per_share)}
                            </td>
                          ))}
                        </tr>
                        {/* Dividends Per Share Slider Row (Editable) */}
                        <tr className="bg-blue-500/10 font-bold">
                          <td className="py-2 px-3 text-left text-[#2E5E88] dark:text-[#5584B4]">
                            dividends per share
                          </td>
                          {Array.from({ length: 12 }, (_, i) => {
                            const mIdx = sliderStartIdx + i;
                            return (
                              <td key={i} className="py-2 px-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.10"
                                  value={dividendsPerShareArr[mIdx] || ''}
                                  placeholder="0.00"
                                  onChange={(e) => handleUpdateDividendsMonth(mIdx, Number(e.target.value))}
                                  className={`w-full py-1 text-right pr-2 rounded border font-bold text-xs ${
                                    isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="bg-rose-500/5 font-bold">
                          <td className="py-2 px-3 text-left text-rose-500">dividends</td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-rose-500">
                              {formatNum(m.dividends)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-left text-slate-500">bank balance</td>
                          {current12Months.map((m, i) => (
                            <td
                              key={i}
                              className={`py-2 px-1 text-right pr-2 font-bold ${
                                m.bank_balance_closing >= 0 ? 'text-emerald-500' : 'text-rose-500'
                              }`}
                            >
                              {formatNum(m.bank_balance_closing)}
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-slate-100/70 dark:bg-[#141A2E]/70 font-bold border-t">
                          <td className="py-2 px-3 text-left text-slate-900 dark:text-white">
                            debt / equity ratio
                          </td>
                          {current12Months.map((m, i) => (
                            <td key={i} className="py-2 px-1 text-right pr-2 text-slate-900 dark:text-white">
                              {formatDec(m.debt_equity_ratio)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FundingStep;
