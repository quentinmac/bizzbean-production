import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Lightbulb,
  Target,
  Search,
  RefreshCw,
} from 'lucide-react';
import { BizzModelState } from '../constants';
import {
  ActionStatus,
  BizzOptimizerActionItem,
  BizzOptimizerHintsMap,
  BizzOptimizerState,
  DEFAULT_BIZZOPTIMIZER_STATE,
  PERFORMANCE_LEADERS,
  PerformanceLeaderId,
  TouchPointKey,
} from '../data/bizzoptimizerDefaults';
import {
  loadHintsLocal,
  resetHintsToDefault,
  saveHintsDirectory,
  syncHintsFromCloud,
} from '../../../services/bizzoptimizerHintsService';
import {
  ImprovementHintsModal,
  LeaderSnapshotMetric,
} from './ImprovementHintsModal';

export interface WhatIfMonthlyRow {
  monthIndex: number;
  baseRev: number;
  baseCos: number;
  baseGp: number;
  baseGpAdj: number;
  baseOtherInc: number;
  baseTotalInc: number;
  baseOpex: number;
  baseNop: number;
  baseInv: number;
  baseRec: number;
  basePay: number;
  baseNwc: number;
  baseClosingCash: number;
  baseTermDebt: number;
  wiRev: number;
  wiCos: number;
  wiGp: number;
  wiGpAdj: number;
  wiOtherInc: number;
  wiTotalInc: number;
  wiOpex: number;
  wiNop: number;
  wiInv: number;
  wiRec: number;
  wiPay: number;
  wiNwc: number;
  nwcDelta: number;
  wiClosingCash: number;
  wiTermDebt: number;
}

interface ActionsToImprovePanelProps {
  state: BizzModelState;
  onUpdateState: (updater: (prev: BizzModelState) => BizzModelState) => void;
  projections: any[];
  whatIfProjections: WhatIfMonthlyRow[];
  whatIfInvDays: number;
  whatIfRecDays: number;
  whatIfPayDays: number;
  theme?: 'light' | 'dark';
}

const fmtCurrency = (val: number): string => {
  if (!Number.isFinite(val)) return 'R 0';
  const sign = val < 0 ? '-' : '';
  return `${sign}R ${Math.round(Math.abs(val)).toLocaleString('en-ZA')}`;
};

const fmtSignedCurrency = (val: number): string => {
  if (!Number.isFinite(val) || Math.abs(val) < 0.5) return 'R 0';
  const sign = val > 0 ? '+' : '-';
  return `${sign}R ${Math.round(Math.abs(val)).toLocaleString('en-ZA')}`;
};

const fmtPct = (val: number): string => {
  if (!Number.isFinite(val)) return '0.0%';
  return `${val.toFixed(1)}%`;
};

const fmtSignedPctPts = (val: number): string => {
  if (!Number.isFinite(val) || Math.abs(val) < 0.05) return '0.0 pp';
  return `${val > 0 ? '+' : ''}${val.toFixed(1)} pp`;
};

const fmtMult = (val: number): string => {
  if (!Number.isFinite(val)) return '0.00×';
  return `${val.toFixed(2)}×`;
};

const fmtSignedMult = (val: number): string => {
  if (!Number.isFinite(val) || Math.abs(val) < 0.005) return '0.00×';
  return `${val > 0 ? '+' : ''}${val.toFixed(2)}×`;
};

const fmtDays = (val: number): string => {
  if (!Number.isFinite(val)) return '0 d';
  return `${Math.round(val)} d`;
};

const fmtSignedDays = (val: number): string => {
  if (!Number.isFinite(val) || Math.abs(val) < 0.5) return '0 d';
  return `${val > 0 ? '+' : ''}${Math.round(val)} d`;
};

const STATUS_OPTIONS: Array<{ value: ActionStatus; label: string }> = [
  { value: 'planned', label: 'planned' },
  { value: 'in-progress', label: 'in progress' },
  { value: 'completed', label: 'completed' },
];

export const ActionsToImprovePanel: React.FC<ActionsToImprovePanelProps> = ({
  state,
  onUpdateState,
  projections,
  whatIfProjections,
  whatIfInvDays,
  whatIfRecDays,
  whatIfPayDays,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  // Persisted BizzOptimizer state from BizzModelState
  const optimizerState: BizzOptimizerState =
    state.bizzOptimizer || DEFAULT_BIZZOPTIMIZER_STATE;
  const actions = optimizerState.actions || [];
  const targets = optimizerState.targets || DEFAULT_BIZZOPTIMIZER_STATE.targets;

  // Editable Improvement Hints (localStorage + Cloud Firestore)
  const [hintsMap, setHintsMap] = useState<BizzOptimizerHintsMap>(() => loadHintsLocal().hints);
  const [hintsSyncStatus, setHintsSyncStatus] = useState<'idle' | 'saving' | 'synced' | 'local'>('idle');

  useEffect(() => {
    let active = true;
    syncHintsFromCloud().then((cloud) => {
      if (active && cloud) {
        setHintsMap(cloud.hints);
        setHintsSyncStatus('synced');
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Popup state for Areas of Improvement
  const [hintsModalOpen, setHintsModalOpen] = useState(false);
  const [hintsModalLeaderId, setHintsModalLeaderId] =
    useState<PerformanceLeaderId>('manufacturing');

  // Filter & search state for Programme of Actions
  const [selectedLeaderFilter, setSelectedLeaderFilter] = useState<
    PerformanceLeaderId | 'all'
  >('all');
  const [statusFilter, setStatusFilter] = useState<ActionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Amend Action form state
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formLeaderId, setFormLeaderId] = useState<PerformanceLeaderId>('manufacturing');
  const [formTitle, setFormTitle] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formTargetDate, setFormTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [formStatus, setFormStatus] = useState<ActionStatus>('planned');
  const [formNotes, setFormNotes] = useState('');

  // Inline Edit & Delete state
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<BizzOptimizerActionItem | null>(null);
  const [confirmDeleteActionId, setConfirmDeleteActionId] = useState<string | null>(null);

  // =========================================================================
  // LIVE FINANCIAL SNAPSHOTS (Annualized YTD / Year 1 Base vs. What-If)
  // =========================================================================
  const financialSummary = useMemo(() => {
    const ytd = state.hiLevelActuals;
    const updateMonth = Math.max(1, Math.min(12, ytd?.updateMonth || 3));
    const annFactor = 12 / updateMonth;
    const hasYtdActuals = Boolean(ytd && (ytd.ytdRevenue > 0 || ytd.ytdCosVariable > 0));

    const year1Base = projections.slice(0, 12);
    const year1Wi = whatIfProjections.slice(0, 12);
    const evalMoIdx = Math.min(projections.length - 1, Math.max(0, updateMonth - 1));
    const evalMo = projections[evalMoIdx] || projections[0] || {};
    const endY1Mo = projections[11] || projections[projections.length - 1] || {};
    const evalWiMo = whatIfProjections[evalMoIdx] || whatIfProjections[0];

    // Base Annualized P&L
    const sumField = (arr: any[], fn: (m: any) => number) =>
      arr.reduce((acc, m) => acc + (Number(fn(m)) || 0), 0);

    const baseRev = hasYtdActuals
      ? (ytd!.ytdRevenue || 0) * annFactor
      : sumField(year1Base, (m) => m.revenue);

    const baseCosMaterials = hasYtdActuals
      ? (ytd!.ytdCosVariable || 0) * annFactor
      : sumField(year1Base, (m) => m.cosVariable || m.cogs || 0);
    const baseCosEmployment = hasYtdActuals
      ? (ytd!.ytdCosEmployment || 0) * annFactor
      : sumField(year1Base, (m) => m.cosEmployment || 0);
    const baseCosOverheads = hasYtdActuals
      ? (ytd!.ytdCosOverheads || 0) * annFactor
      : sumField(year1Base, (m) => m.cosOverheads || 0);
    const baseCos = hasYtdActuals
      ? baseCosMaterials + baseCosEmployment + baseCosOverheads
      : sumField(year1Base, (m) => m.totalCos || m.cogs || 0);

    const baseGp = baseRev - baseCos;
    const baseGpMarginPct = baseRev > 0 ? (baseGp / baseRev) * 100 : 0;

    const baseCommission = hasYtdActuals
      ? (ytd!.ytdGpAdjCommission || 0) * annFactor
      : sumField(year1Base, (m) => Math.abs(m.gpAdjustmentsCommission || 0));
    const baseInvAdj = hasYtdActuals
      ? (ytd!.ytdGpAdjInventory || 0) * annFactor
      : sumField(year1Base, (m) => Math.abs(m.gpAdjustmentsInventory || 0));
    const baseVariance = hasYtdActuals
      ? (ytd!.ytdGpAdjVariance || 0) * annFactor
      : sumField(year1Base, (m) => m.gpAdjustmentsVariance || 0);
    const baseOtherInc = hasYtdActuals
      ? (ytd!.ytdOtherIncome || 0) * annFactor
      : sumField(year1Base, (m) => m.otherIncomeTotal || 0);
    const baseGpAdjTotal = -(baseCommission + baseInvAdj) + baseVariance;

    const baseOpexEmp = hasYtdActuals
      ? (ytd!.ytdOpexEmployment || 0) * annFactor
      : sumField(year1Base, (m) => m.employmentExpenses || m.opexEmployment || 0);
    const baseOpexVar = hasYtdActuals
      ? (ytd!.ytdOpexVariable || 0) * annFactor
      : sumField(year1Base, (m) => m.exVariable || 0);
    const baseOpexOverheads = hasYtdActuals
      ? (ytd!.ytdOpexOverheads || 0) * annFactor
      : sumField(year1Base, (m) => m.exOverheads || 0);
    const baseDep = sumField(year1Base, (m) => m.depreciation || 0);
    const baseOpex = baseOpexEmp + baseOpexVar + baseOpexOverheads + baseDep;

    const baseTotalIncome = baseGp + baseGpAdjTotal + baseOtherInc;
    const baseNop = baseTotalIncome - baseOpex;
    const baseExpIncomeRatio = baseTotalIncome > 0 ? (baseOpex / baseTotalIncome) * 100 : 0;

    // Balance Sheet at Evaluation Point
    const baseFixedAssets = Number(evalMo.fixed_assets_net ?? evalMo.fixedAssets ?? 0);
    const baseInventory = hasYtdActuals
      ? ytd!.bsInventory || 0
      : Number(evalMo.inventory ?? 0);
    const baseReceivables = hasYtdActuals
      ? ytd!.bsReceivables || 0
      : Number(evalMo.accounts_receivable ?? 0);
    const basePayables = hasYtdActuals
      ? ytd!.bsPayables || 0
      : Number(evalMo.accounts_payable ?? 0);
    const baseBank = hasYtdActuals
      ? ytd!.bsBankBalance || 0
      : Number(evalMo.bank_balance_closing ?? 0);
    const baseOtherAssets = hasYtdActuals
      ? (ytd!.bsDeposits || 0) + (ytd!.bsFloats || 0) + (ytd!.bsPettyCash || 0)
      : Number(evalMo.other_assets ?? 0);

    const baseNwc = baseInventory + baseReceivables - basePayables;
    const baseNoa = Math.max(0, baseFixedAssets + baseOtherAssets + baseNwc);
    const baseTotalAssets =
      baseFixedAssets +
      baseOtherAssets +
      baseInventory +
      baseReceivables +
      Math.max(0, baseBank);

    const baseTermDebt = Number(evalMo.term_loan_balance ?? 0);
    const baseIbd = baseTermDebt + Math.max(0, -baseBank);
    const baseNibd = basePayables + Number(evalMo.vat_payable ?? 0) + Number(evalMo.tax_payable ?? 0);
    const baseEquity = Math.max(0, baseTotalAssets - baseIbd - baseNibd);
    const baseDebtEquity = baseEquity > 0 ? baseIbd / baseEquity : 0;

    const baseInvDays = Number(evalMo.inventoryDaysUsed ?? state.funding.inventoryDays ?? 0);
    const baseRecDays = Number(evalMo.debtorDaysUsed ?? state.funding.debtorDays ?? 0);
    const basePayDays = Number(evalMo.creditorDaysUsed ?? state.funding.creditorDays ?? 0);

    const baseInterestPaid = sumField(
      year1Base,
      (m) => Math.abs(m.interest_paid ?? m.interestExpense ?? 0)
    );
    const baseEffIntRate = baseIbd > 0 ? (baseInterestPaid / baseIbd) * 100 : state.funding.interestRatePct || 0;
    const baseInterestCover = baseInterestPaid > 0 ? baseNop / baseInterestPaid : 0;

    // Headcount / Payroll productivity
    const headcount =
      (state.employmentItems || []).reduce((acc, e) => acc + (Number(e.numEmployees) || 0), 0) ||
      Math.max(1, Math.round((baseCosEmployment + baseOpexEmp) / 300000));
    const totalPayroll = baseCosEmployment + baseOpexEmp;
    const baseExpenseCoverMonths = baseOpex > 0 ? (Math.max(0, baseBank) / (baseOpex / 12)) : 0;

    // Core Ratios (Actual)
    const actualRosPct = baseRev > 0 ? (baseNop / baseRev) * 100 : 0;
    const actualAssetTurn = baseNoa > 0 ? baseRev / baseNoa : 0;
    const actualRonoaPct = (actualRosPct / 100) * actualAssetTurn * 100;

    // What-If Annualized Projections (Year 1)
    const wiRev = sumField(year1Wi, (m) => m.wiRev) || baseRev;
    const wiCos = sumField(year1Wi, (m) => m.wiCos) || baseCos;
    const wiGp = wiRev - wiCos;
    const wiGpMarginPct = wiRev > 0 ? (wiGp / wiRev) * 100 : baseGpMarginPct;
    const wiGpAdj = sumField(year1Wi, (m) => m.wiGpAdj);
    const wiOtherInc = sumField(year1Wi, (m) => m.wiOtherInc);
    const wiOpex = sumField(year1Wi, (m) => m.wiOpex) || baseOpex;
    const wiTotalInc = wiGp + wiGpAdj + wiOtherInc;
    const wiNop = wiTotalInc - wiOpex;
    const wiExpIncomeRatio = wiTotalInc > 0 ? (wiOpex / wiTotalInc) * 100 : baseExpIncomeRatio;

    const wiNwc = evalWiMo ? evalWiMo.wiNwc : baseNwc;
    const wiNoa = Math.max(0, baseFixedAssets + baseOtherAssets + wiNwc);
    const wiBank = evalWiMo ? evalWiMo.wiClosingCash : baseBank;
    const wiRosPct = wiRev > 0 ? (wiNop / wiRev) * 100 : actualRosPct;
    const wiAssetTurn = wiNoa > 0 ? wiRev / wiNoa : actualAssetTurn;
    const wiRonoaPct = (wiRosPct / 100) * wiAssetTurn * 100;
    const wiInterestCover = baseInterestPaid > 0 ? wiNop / baseInterestPaid : baseInterestCover;
    const wiExpenseCoverMonths = wiOpex > 0 ? Math.max(0, wiBank) / (wiOpex / 12) : baseExpenseCoverMonths;

    // Build per-Performance-Leader snapshot arrays
    const leaderSnapshots: Record<PerformanceLeaderId, LeaderSnapshotMetric[]> = {
      manufacturing: [
        {
          label: 'direct cost of sales (annualised)',
          actualFormatted: fmtCurrency(baseCos),
          targetFormatted: fmtCurrency(wiCos),
          varianceFormatted: fmtSignedCurrency(baseCos - wiCos),
          varianceTone: baseCos - wiCos > 1 ? 'positive' : baseCos - wiCos < -1 ? 'negative' : 'neutral',
        },
        {
          label: 'cost of sales % of revenue',
          actualFormatted: fmtPct(baseRev > 0 ? (baseCos / baseRev) * 100 : 0),
          targetFormatted: fmtPct(wiRev > 0 ? (wiCos / wiRev) * 100 : 0),
          varianceFormatted: fmtSignedPctPts(
            (wiRev > 0 ? (wiCos / wiRev) * 100 : 0) -
              (baseRev > 0 ? (baseCos / baseRev) * 100 : 0)
          ),
          varianceTone:
            (wiRev > 0 ? wiCos / wiRev : 0) < (baseRev > 0 ? baseCos / baseRev : 0) - 0.0005
              ? 'positive'
              : (wiRev > 0 ? wiCos / wiRev : 0) > (baseRev > 0 ? baseCos / baseRev : 0) + 0.0005
              ? 'negative'
              : 'neutral',
        },
        {
          label: 'direct materials / variable purchases',
          actualFormatted: fmtCurrency(baseCosMaterials),
          targetFormatted: fmtCurrency(baseCosMaterials * (baseCos > 0 ? wiCos / baseCos : 1)),
          varianceFormatted: fmtSignedCurrency(
            baseCosMaterials - baseCosMaterials * (baseCos > 0 ? wiCos / baseCos : 1)
          ),
          varianceTone: wiCos < baseCos ? 'positive' : wiCos > baseCos ? 'negative' : 'neutral',
        },
        {
          label: 'direct production payroll & overheads',
          actualFormatted: fmtCurrency(baseCosEmployment + baseCosOverheads),
          targetFormatted: fmtCurrency(
            (baseCosEmployment + baseCosOverheads) * (baseCos > 0 ? wiCos / baseCos : 1)
          ),
          varianceFormatted: fmtSignedCurrency(
            baseCosEmployment +
              baseCosOverheads -
              (baseCosEmployment + baseCosOverheads) * (baseCos > 0 ? wiCos / baseCos : 1)
          ),
          varianceTone: wiCos < baseCos ? 'positive' : wiCos > baseCos ? 'negative' : 'neutral',
        },
      ],
      'contribution-mix': [
        {
          label: 'annualised revenue',
          actualFormatted: fmtCurrency(baseRev),
          targetFormatted: fmtCurrency(wiRev),
          varianceFormatted: fmtSignedCurrency(wiRev - baseRev),
          varianceTone: wiRev > baseRev + 1 ? 'positive' : wiRev < baseRev - 1 ? 'negative' : 'neutral',
        },
        {
          label: 'gross profit',
          actualFormatted: fmtCurrency(baseGp),
          targetFormatted: fmtCurrency(wiGp),
          varianceFormatted: fmtSignedCurrency(wiGp - baseGp),
          varianceTone: wiGp > baseGp + 1 ? 'positive' : wiGp < baseGp - 1 ? 'negative' : 'neutral',
        },
        {
          label: 'gross profit margin %',
          actualFormatted: fmtPct(baseGpMarginPct),
          targetFormatted: fmtPct(wiGpMarginPct),
          varianceFormatted: fmtSignedPctPts(wiGpMarginPct - baseGpMarginPct),
          varianceTone:
            wiGpMarginPct > baseGpMarginPct + 0.05
              ? 'positive'
              : wiGpMarginPct < baseGpMarginPct - 0.05
              ? 'negative'
              : 'neutral',
        },
      ],
      'gross-profit-adjustments': [
        {
          label: 'sales commission',
          actualFormatted: fmtCurrency(-baseCommission),
          targetFormatted: fmtCurrency(-baseCommission),
          varianceFormatted: 'R 0',
          varianceTone: 'neutral',
        },
        {
          label: 'inventory adjustments / shrinkage',
          actualFormatted: fmtCurrency(-baseInvAdj),
          targetFormatted: fmtCurrency(-baseInvAdj),
          varianceFormatted: 'R 0',
          varianceTone: 'neutral',
        },
        {
          label: 'net gp adjustments',
          actualFormatted: fmtCurrency(baseGpAdjTotal),
          targetFormatted: fmtCurrency(wiGpAdj),
          varianceFormatted: fmtSignedCurrency(wiGpAdj - baseGpAdjTotal),
          varianceTone:
            wiGpAdj > baseGpAdjTotal + 1
              ? 'positive'
              : wiGpAdj < baseGpAdjTotal - 1
              ? 'negative'
              : 'neutral',
        },
        {
          label: 'other income',
          actualFormatted: fmtCurrency(baseOtherInc),
          targetFormatted: fmtCurrency(wiOtherInc),
          varianceFormatted: fmtSignedCurrency(wiOtherInc - baseOtherInc),
          varianceTone:
            wiOtherInc > baseOtherInc + 1
              ? 'positive'
              : wiOtherInc < baseOtherInc - 1
              ? 'negative'
              : 'neutral',
        },
      ],
      expenses: [
        {
          label: 'total operating expenses',
          actualFormatted: fmtCurrency(baseOpex),
          targetFormatted: fmtCurrency(wiOpex),
          varianceFormatted: fmtSignedCurrency(wiOpex - baseOpex),
          varianceTone: wiOpex < baseOpex - 1 ? 'positive' : wiOpex > baseOpex + 1 ? 'negative' : 'neutral',
        },
        {
          label: 'admin & commercial employment',
          actualFormatted: fmtCurrency(baseOpexEmp),
          targetFormatted: fmtCurrency(baseOpexEmp * (baseOpex > 0 ? wiOpex / baseOpex : 1)),
          varianceFormatted: fmtSignedCurrency(
            baseOpexEmp * (baseOpex > 0 ? wiOpex / baseOpex : 1) - baseOpexEmp
          ),
          varianceTone: wiOpex < baseOpex - 1 ? 'positive' : wiOpex > baseOpex + 1 ? 'negative' : 'neutral',
        },
        {
          label: 'fixed overheads & depreciation',
          actualFormatted: fmtCurrency(baseOpexOverheads + baseDep),
          targetFormatted: fmtCurrency(
            (baseOpexOverheads + baseDep) * (baseOpex > 0 ? wiOpex / baseOpex : 1)
          ),
          varianceFormatted: fmtSignedCurrency(
            (baseOpexOverheads + baseDep) * (baseOpex > 0 ? wiOpex / baseOpex : 1) -
              (baseOpexOverheads + baseDep)
          ),
          varianceTone: wiOpex < baseOpex - 1 ? 'positive' : wiOpex > baseOpex + 1 ? 'negative' : 'neutral',
        },
        {
          label: 'expense / total income ratio',
          actualFormatted: fmtPct(baseExpIncomeRatio),
          targetFormatted: fmtPct(wiExpIncomeRatio),
          varianceFormatted: fmtSignedPctPts(wiExpIncomeRatio - baseExpIncomeRatio),
          varianceTone:
            wiExpIncomeRatio < baseExpIncomeRatio - 0.05
              ? 'positive'
              : wiExpIncomeRatio > baseExpIncomeRatio + 0.05
              ? 'negative'
              : 'neutral',
        },
      ],
      'net-operating-assets': [
        {
          label: 'net operating assets (noa)',
          actualFormatted: fmtCurrency(baseNoa),
          targetFormatted: fmtCurrency(wiNoa),
          varianceFormatted: fmtSignedCurrency(wiNoa - baseNoa),
          varianceTone: wiNoa < baseNoa - 1 ? 'positive' : wiNoa > baseNoa + 1 ? 'negative' : 'neutral',
        },
        {
          label: 'days — inventory (dio)',
          actualFormatted: fmtDays(baseInvDays),
          targetFormatted: fmtDays(whatIfInvDays),
          varianceFormatted: fmtSignedDays(whatIfInvDays - baseInvDays),
          varianceTone:
            whatIfInvDays < baseInvDays
              ? 'positive'
              : whatIfInvDays > baseInvDays
              ? 'negative'
              : 'neutral',
        },
        {
          label: 'days — receivables (dso)',
          actualFormatted: fmtDays(baseRecDays),
          targetFormatted: fmtDays(whatIfRecDays),
          varianceFormatted: fmtSignedDays(whatIfRecDays - baseRecDays),
          varianceTone:
            whatIfRecDays < baseRecDays
              ? 'positive'
              : whatIfRecDays > baseRecDays
              ? 'negative'
              : 'neutral',
        },
        {
          label: 'days — payables (dpo)',
          actualFormatted: fmtDays(basePayDays),
          targetFormatted: fmtDays(whatIfPayDays),
          varianceFormatted: fmtSignedDays(whatIfPayDays - basePayDays),
          varianceTone:
            whatIfPayDays > basePayDays
              ? 'positive'
              : whatIfPayDays < basePayDays
              ? 'negative'
              : 'neutral',
        },
        {
          label: 'net working capital',
          actualFormatted: fmtCurrency(baseNwc),
          targetFormatted: fmtCurrency(wiNwc),
          varianceFormatted: fmtSignedCurrency(wiNwc - baseNwc),
          varianceTone: wiNwc < baseNwc - 1 ? 'positive' : wiNwc > baseNwc + 1 ? 'negative' : 'neutral',
        },
      ],
      'total-asset-funding': [
        {
          label: 'total assets',
          actualFormatted: fmtCurrency(baseTotalAssets),
          targetFormatted: fmtCurrency(baseTotalAssets + (wiNoa - baseNoa)),
          varianceFormatted: fmtSignedCurrency(wiNoa - baseNoa),
          varianceTone: 'neutral',
        },
        {
          label: '% of total assets — nibd (trade credit)',
          actualFormatted: fmtPct(baseTotalAssets > 0 ? (baseNibd / baseTotalAssets) * 100 : 0),
          targetFormatted: fmtPct(baseTotalAssets > 0 ? (baseNibd / baseTotalAssets) * 100 : 0),
          varianceFormatted: '0.0 pp',
          varianceTone: 'neutral',
        },
        {
          label: 'debt / equity ratio',
          actualFormatted: fmtMult(baseDebtEquity),
          targetFormatted: fmtMult(baseDebtEquity),
          varianceFormatted: '0.00×',
          varianceTone: 'neutral',
        },
        {
          label: 'closing bank balance',
          actualFormatted: fmtCurrency(baseBank),
          targetFormatted: fmtCurrency(wiBank),
          varianceFormatted: fmtSignedCurrency(wiBank - baseBank),
          varianceTone: wiBank > baseBank + 1 ? 'positive' : wiBank < baseBank - 1 ? 'negative' : 'neutral',
        },
      ],
      interest: [
        {
          label: 'annualised interest paid',
          actualFormatted: fmtCurrency(baseInterestPaid),
          targetFormatted: fmtCurrency(baseInterestPaid),
          varianceFormatted: 'R 0',
          varianceTone: 'neutral',
        },
        {
          label: 'effective interest rate',
          actualFormatted: fmtPct(baseEffIntRate),
          targetFormatted: fmtPct(baseEffIntRate),
          varianceFormatted: '0.0 pp',
          varianceTone: 'neutral',
        },
        {
          label: 'interest cover (nop / interest)',
          actualFormatted: fmtMult(baseInterestCover),
          targetFormatted: fmtMult(wiInterestCover),
          varianceFormatted: fmtSignedMult(wiInterestCover - baseInterestCover),
          varianceTone:
            wiInterestCover > baseInterestCover + 0.01
              ? 'positive'
              : wiInterestCover < baseInterestCover - 0.01
              ? 'negative'
              : 'neutral',
        },
      ],
      productivity: [
        {
          label: 'revenue per employee (est.)',
          actualFormatted: fmtCurrency(headcount > 0 ? baseRev / headcount : 0),
          targetFormatted: fmtCurrency(headcount > 0 ? wiRev / headcount : 0),
          varianceFormatted: fmtSignedCurrency(headcount > 0 ? (wiRev - baseRev) / headcount : 0),
          varianceTone: wiRev > baseRev + 1 ? 'positive' : wiRev < baseRev - 1 ? 'negative' : 'neutral',
        },
        {
          label: 'gross profit per employee (est.)',
          actualFormatted: fmtCurrency(headcount > 0 ? baseGp / headcount : 0),
          targetFormatted: fmtCurrency(headcount > 0 ? wiGp / headcount : 0),
          varianceFormatted: fmtSignedCurrency(headcount > 0 ? (wiGp - baseGp) / headcount : 0),
          varianceTone: wiGp > baseGp + 1 ? 'positive' : wiGp < baseGp - 1 ? 'negative' : 'neutral',
        },
        {
          label: 'net operating profit per employee',
          actualFormatted: fmtCurrency(headcount > 0 ? baseNop / headcount : 0),
          targetFormatted: fmtCurrency(headcount > 0 ? wiNop / headcount : 0),
          varianceFormatted: fmtSignedCurrency(headcount > 0 ? (wiNop - baseNop) / headcount : 0),
          varianceTone: wiNop > baseNop + 1 ? 'positive' : wiNop < baseNop - 1 ? 'negative' : 'neutral',
        },
        {
          label: 'revenue per R1 of total payroll',
          actualFormatted: fmtMult(totalPayroll > 0 ? baseRev / totalPayroll : 0),
          targetFormatted: fmtMult(totalPayroll > 0 ? wiRev / totalPayroll : 0),
          varianceFormatted: fmtSignedMult(
            totalPayroll > 0 ? (wiRev - baseRev) / totalPayroll : 0
          ),
          varianceTone: wiRev > baseRev + 1 ? 'positive' : wiRev < baseRev - 1 ? 'negative' : 'neutral',
        },
        {
          label: 'expense cover (months of cash)',
          actualFormatted: `${baseExpenseCoverMonths.toFixed(1)} mts`,
          targetFormatted: `${wiExpenseCoverMonths.toFixed(1)} mts`,
          varianceFormatted: `${
            wiExpenseCoverMonths - baseExpenseCoverMonths >= 0 ? '+' : ''
          }${(wiExpenseCoverMonths - baseExpenseCoverMonths).toFixed(1)} mts`,
          varianceTone:
            wiExpenseCoverMonths > baseExpenseCoverMonths + 0.05
              ? 'positive'
              : wiExpenseCoverMonths < baseExpenseCoverMonths - 0.05
              ? 'negative'
              : 'neutral',
        },
      ],
    };

    // Headline single metric per leader for the compact cards
    const leaderHeadline: Record<
      PerformanceLeaderId,
      { label: string; actual: string; target: string }
    > = {
      manufacturing: {
        label: 'cost of sales',
        actual: fmtPct(baseRev > 0 ? (baseCos / baseRev) * 100 : 0),
        target: fmtPct(wiRev > 0 ? (wiCos / wiRev) * 100 : 0),
      },
      'contribution-mix': {
        label: 'gp margin',
        actual: fmtPct(baseGpMarginPct),
        target: fmtPct(wiGpMarginPct),
      },
      'gross-profit-adjustments': {
        label: 'net gp adj.',
        actual: fmtCurrency(baseGpAdjTotal),
        target: fmtCurrency(wiGpAdj),
      },
      expenses: {
        label: 'exp / income',
        actual: fmtPct(baseExpIncomeRatio),
        target: fmtPct(wiExpIncomeRatio),
      },
      'net-operating-assets': {
        label: 'cash cycle',
        actual: fmtDays(baseInvDays + baseRecDays - basePayDays),
        target: fmtDays(whatIfInvDays + whatIfRecDays - whatIfPayDays),
      },
      'total-asset-funding': {
        label: 'closing cash',
        actual: fmtCurrency(baseBank),
        target: fmtCurrency(wiBank),
      },
      interest: {
        label: 'interest cover',
        actual: fmtMult(baseInterestCover),
        target: fmtMult(wiInterestCover),
      },
      productivity: {
        label: 'nop / staff',
        actual: fmtCurrency(headcount > 0 ? baseNop / headcount : 0),
        target: fmtCurrency(headcount > 0 ? wiNop / headcount : 0),
      },
    };

    return {
      updateMonth,
      hasYtdActuals,
      baseRev,
      baseNop,
      baseNoa,
      actualRosPct,
      actualAssetTurn,
      actualRonoaPct,
      wiRosPct,
      wiAssetTurn,
      wiRonoaPct,
      wiNop,
      wiNoa,
      endY1Cash: Number(endY1Mo.bank_balance_closing ?? 0),
      leaderSnapshots,
      leaderHeadline,
    };
  }, [
    state.hiLevelActuals,
    state.funding,
    state.employmentItems,
    projections,
    whatIfProjections,
    whatIfInvDays,
    whatIfRecDays,
    whatIfPayDays,
  ]);

  // Effective Target Ratios (default to +2pp ROS and +0.25x Asset Turn if user hasn't set targets yet)
  const effectiveTargetRosPct =
    targets.targetRosPct !== null && Number.isFinite(targets.targetRosPct)
      ? targets.targetRosPct
      : Number((financialSummary.actualRosPct + 2).toFixed(1));
  const effectiveTargetAssetTurn =
    targets.targetAssetTurn !== null && Number.isFinite(targets.targetAssetTurn)
      ? targets.targetAssetTurn
      : Number((financialSummary.actualAssetTurn + 0.25).toFixed(2));
  const effectiveTargetRonoaPct =
    (effectiveTargetRosPct / 100) * effectiveTargetAssetTurn * 100;

  const rosVariance = effectiveTargetRosPct - financialSummary.actualRosPct;
  const assetTurnVariance =
    effectiveTargetAssetTurn - financialSummary.actualAssetTurn;
  const ronoaVariance =
    effectiveTargetRonoaPct - financialSummary.actualRonoaPct;

  // =========================================================================
  // STATE UPDATERS
  // =========================================================================
  const updateOptimizer = (
    updater: (prev: BizzOptimizerState) => BizzOptimizerState
  ) => {
    onUpdateState((prev) => {
      const current = prev.bizzOptimizer || DEFAULT_BIZZOPTIMIZER_STATE;
      return {
        ...prev,
        bizzOptimizer: updater(current),
      };
    });
  };

  const handleUpdateTarget = (
    field: 'targetRosPct' | 'targetAssetTurn',
    rawValue: string
  ) => {
    const parsed = parseFloat(rawValue);
    updateOptimizer((prev) => ({
      ...prev,
      targets: {
        ...prev.targets,
        [field]: Number.isFinite(parsed) ? parsed : 0,
      },
    }));
  };

  const handleSyncFromWhatIf = () => {
    updateOptimizer((prev) => ({
      ...prev,
      targets: {
        ...prev.targets,
        targetRosPct: Number(financialSummary.wiRosPct.toFixed(1)),
        targetAssetTurn: Number(financialSummary.wiAssetTurn.toFixed(2)),
      },
    }));
  };

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    const title = formTitle.trim();
    if (!title) return;
    const newItem: BizzOptimizerActionItem = {
      id: `opt-act-${Date.now()}`,
      leaderId: formLeaderId,
      title,
      assignedTo: formAssignedTo.trim() || 'unassigned',
      targetDate: formTargetDate,
      status: formStatus,
      progressNotes: formNotes.trim(),
      createdAt: Date.now(),
    };
    updateOptimizer((prev) => ({
      ...prev,
      actions: [newItem, ...(prev.actions || [])],
    }));
    setFormTitle('');
    setFormAssignedTo('');
    setFormNotes('');
    setFormStatus('planned');
    setIsAddFormOpen(false);
  };

  const handleCreateActionFromHint = (
    leaderId: PerformanceLeaderId,
    touchPoint: TouchPointKey,
    hintText: string
  ) => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const newItem: BizzOptimizerActionItem = {
      id: `opt-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      leaderId,
      title: hintText,
      assignedTo:
        PERFORMANCE_LEADERS.find((l) => l.id === leaderId)?.shortRole ||
        'department head',
      targetDate: d.toISOString().slice(0, 10),
      status: 'planned',
      progressNotes: `touch-point: ${touchPoint}`,
      createdAt: Date.now(),
    };
    updateOptimizer((prev) => ({
      ...prev,
      actions: [newItem, ...(prev.actions || [])],
    }));
  };

  const handleStartEditAction = (action: BizzOptimizerActionItem) => {
    setEditingActionId(action.id);
    setEditDraft({ ...action });
    setConfirmDeleteActionId(null);
  };

  const handleSaveEditAction = () => {
    if (!editDraft || !editDraft.title.trim()) return;
    updateOptimizer((prev) => ({
      ...prev,
      actions: prev.actions.map((a) =>
        a.id === editDraft.id
          ? {
              ...editDraft,
              title: editDraft.title.trim(),
              assignedTo: editDraft.assignedTo.trim() || 'unassigned',
              progressNotes: editDraft.progressNotes.trim(),
              updatedAt: Date.now(),
            }
          : a
      ),
    }));
    setEditingActionId(null);
    setEditDraft(null);
  };

  const handleDeleteAction = (actionId: string) => {
    updateOptimizer((prev) => ({
      ...prev,
      actions: prev.actions.filter((a) => a.id !== actionId),
    }));
    setConfirmDeleteActionId(null);
  };

  const handleCycleStatus = (action: BizzOptimizerActionItem) => {
    const order: ActionStatus[] = ['planned', 'in-progress', 'completed'];
    const nextStatus = order[(order.indexOf(action.status) + 1) % order.length];
    updateOptimizer((prev) => ({
      ...prev,
      actions: prev.actions.map((a) =>
        a.id === action.id ? { ...a, status: nextStatus, updatedAt: Date.now() } : a
      ),
    }));
  };

  const handleSaveHints = async (next: BizzOptimizerHintsMap) => {
    setHintsMap(next);
    setHintsSyncStatus('saving');
    const res = await saveHintsDirectory(next);
    setHintsSyncStatus(res.syncedToCloud ? 'synced' : 'local');
  };

  const handleResetHints = async () => {
    setHintsSyncStatus('saving');
    const res = await resetHintsToDefault();
    setHintsMap(res.hints);
    setHintsSyncStatus('synced');
  };

  const openHintsForLeader = (leaderId: PerformanceLeaderId) => {
    setHintsModalLeaderId(leaderId);
    setHintsModalOpen(true);
  };

  // Filtered Programme of Actions
  const filteredActions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return actions.filter((a) => {
      if (selectedLeaderFilter !== 'all' && a.leaderId !== selectedLeaderFilter) {
        return false;
      }
      if (statusFilter !== 'all' && a.status !== statusFilter) {
        return false;
      }
      if (q) {
        const leaderLabel =
          PERFORMANCE_LEADERS.find((l) => l.id === a.leaderId)?.label || '';
        const haystack =
          `${a.title} ${a.assignedTo} ${a.progressNotes} ${leaderLabel}`.toLowerCase();
        return haystack.includes(q);
      }
      return true;
    });
  }, [actions, selectedLeaderFilter, statusFilter, searchQuery]);

  const actionCountByLeader = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of actions) {
      counts[a.leaderId] = (counts[a.leaderId] || 0) + 1;
    }
    return counts;
  }, [actions]);

  const cardSurface = isDark
    ? 'bg-[#0F172A] border-[#1E293B]'
    : 'bg-white border-slate-200';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputSurface = isDark
    ? 'bg-[#0B1220] border-[#334155] text-slate-100 placeholder:text-slate-500 focus:border-[#00A3E0]'
    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#00A3E0]';

  return (
    <div className="space-y-6 pb-8">
      {/* =================================================================== */}
      {/* SECTION 1: CORE RATIO OBJECTIVES (ROS × ASSET TURN = RONOA)         */}
      {/* =================================================================== */}
      <section className={`rounded-xl border p-5 ${cardSurface}`}>
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#1E293B]">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#00A3E0]" />
              <h3 className="text-[14px] font-bold tracking-tight lowercase">
                core performance objectives · ytd actuals vs. desired target
              </h3>
            </div>
            <p className={`text-[12px] mt-0.5 ${mutedText}`}>
              measure return on sales and asset turn on year-to-date results (month{' '}
              {financialSummary.updateMonth} annualised), set achievable targets, and assign
              improvement actions to department heads.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncFromWhatIf}
              title="Copy the Return on Sales and Asset Turn achieved on your What-If tab"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#334155] bg-[#1E293B] text-slate-200 hover:border-[#00A3E0] hover:text-[#38BDF8]'
                  : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-[#00A3E0] hover:text-[#0284C7]'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              sync from what-if
            </button>

            <button
              type="button"
              onClick={() => openHintsForLeader('manufacturing')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11.5px] font-semibold bg-[#00A3E0] text-white hover:bg-[#0284C7] whitespace-nowrap transition-colors cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              areas of improvement
            </button>
          </div>
        </div>

        {/* Ratio Comparison Grid: ROS × Asset Turn = RONOA */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Ratio 1: Return on Sales */}
          <div
            className={`rounded-lg border p-4 ${
              isDark ? 'bg-[#0B1220] border-[#1E293B]' : 'bg-slate-50/60 border-slate-200'
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00A3E0]">
                1. return on sales (ros)
              </span>
              <span className={`text-[11px] ${mutedText}`}>nop ÷ revenue</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 items-end">
              <div>
                <div className={`text-[10.5px] uppercase tracking-wider ${mutedText}`}>
                  actual ytd
                </div>
                <div className="text-[20px] font-bold tabular-nums tracking-tight mt-0.5">
                  {fmtPct(financialSummary.actualRosPct)}
                </div>
              </div>

              <div>
                <label
                  htmlFor="bizzopt-target-ros"
                  className={`block text-[10.5px] uppercase tracking-wider ${mutedText}`}
                >
                  desired (%)
                </label>
                <input
                  id="bizzopt-target-ros"
                  type="number"
                  step="0.1"
                  value={effectiveTargetRosPct}
                  onChange={(e) => handleUpdateTarget('targetRosPct', e.target.value)}
                  className={`mt-1 w-full px-2 py-1 text-[14px] font-bold tabular-nums rounded-md border outline-none ${inputSurface}`}
                />
              </div>

              <div className="text-right">
                <div className={`text-[10.5px] uppercase tracking-wider ${mutedText}`}>
                  gap to close
                </div>
                <div
                  className={`text-[14px] font-bold tabular-nums mt-1 ${
                    rosVariance > 0.05
                      ? isDark
                        ? 'text-emerald-400'
                        : 'text-emerald-700'
                      : rosVariance < -0.05
                      ? isDark
                        ? 'text-rose-400'
                        : 'text-rose-700'
                      : mutedText
                  }`}
                >
                  {fmtSignedPctPts(rosVariance)}
                </div>
              </div>
            </div>

            <div className={`mt-3 pt-2.5 border-t text-[11px] flex justify-between ${isDark ? 'border-[#1E293B]' : 'border-slate-200'} ${mutedText}`}>
              <span>annualised nop</span>
              <span className="tabular-nums font-semibold">
                {fmtCurrency(financialSummary.baseNop)}
              </span>
            </div>
          </div>

          {/* Ratio 2: Asset Turn */}
          <div
            className={`rounded-lg border p-4 ${
              isDark ? 'bg-[#0B1220] border-[#1E293B]' : 'bg-slate-50/60 border-slate-200'
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00A3E0]">
                2. asset turn
              </span>
              <span className={`text-[11px] ${mutedText}`}>revenue ÷ noa</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 items-end">
              <div>
                <div className={`text-[10.5px] uppercase tracking-wider ${mutedText}`}>
                  actual ytd
                </div>
                <div className="text-[20px] font-bold tabular-nums tracking-tight mt-0.5">
                  {fmtMult(financialSummary.actualAssetTurn)}
                </div>
              </div>

              <div>
                <label
                  htmlFor="bizzopt-target-at"
                  className={`block text-[10.5px] uppercase tracking-wider ${mutedText}`}
                >
                  desired (×)
                </label>
                <input
                  id="bizzopt-target-at"
                  type="number"
                  step="0.05"
                  value={effectiveTargetAssetTurn}
                  onChange={(e) => handleUpdateTarget('targetAssetTurn', e.target.value)}
                  className={`mt-1 w-full px-2 py-1 text-[14px] font-bold tabular-nums rounded-md border outline-none ${inputSurface}`}
                />
              </div>

              <div className="text-right">
                <div className={`text-[10.5px] uppercase tracking-wider ${mutedText}`}>
                  gap to close
                </div>
                <div
                  className={`text-[14px] font-bold tabular-nums mt-1 ${
                    assetTurnVariance > 0.005
                      ? isDark
                        ? 'text-emerald-400'
                        : 'text-emerald-700'
                      : assetTurnVariance < -0.005
                      ? isDark
                        ? 'text-rose-400'
                        : 'text-rose-700'
                      : mutedText
                  }`}
                >
                  {fmtSignedMult(assetTurnVariance)}
                </div>
              </div>
            </div>

            <div className={`mt-3 pt-2.5 border-t text-[11px] flex justify-between ${isDark ? 'border-[#1E293B]' : 'border-slate-200'} ${mutedText}`}>
              <span>net operating assets</span>
              <span className="tabular-nums font-semibold">
                {fmtCurrency(financialSummary.baseNoa)}
              </span>
            </div>
          </div>

          {/* Composite Result: Return on Net Operating Assets */}
          <div
            className={`rounded-lg border p-4 ${
              isDark ? 'bg-[#0B1220] border-[#1E293B]' : 'bg-slate-50/60 border-slate-200'
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                result · return on noa (ronoa)
              </span>
              <span className={`text-[11px] ${mutedText}`}>ros × asset turn</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 items-end">
              <div>
                <div className={`text-[10.5px] uppercase tracking-wider ${mutedText}`}>
                  actual ytd
                </div>
                <div className="text-[20px] font-bold tabular-nums tracking-tight mt-0.5">
                  {fmtPct(financialSummary.actualRonoaPct)}
                </div>
              </div>

              <div>
                <div className={`text-[10.5px] uppercase tracking-wider ${mutedText}`}>
                  objective
                </div>
                <div className="text-[20px] font-bold tabular-nums tracking-tight mt-0.5 text-[#00A3E0]">
                  {fmtPct(effectiveTargetRonoaPct)}
                </div>
              </div>

              <div className="text-right">
                <div className={`text-[10.5px] uppercase tracking-wider ${mutedText}`}>
                  uplift
                </div>
                <div
                  className={`text-[14px] font-bold tabular-nums mt-1 ${
                    ronoaVariance > 0.05
                      ? isDark
                        ? 'text-emerald-400'
                        : 'text-emerald-700'
                      : ronoaVariance < -0.05
                      ? isDark
                        ? 'text-rose-400'
                        : 'text-rose-700'
                      : mutedText
                  }`}
                >
                  {fmtSignedPctPts(ronoaVariance)}
                </div>
              </div>
            </div>

            <div className={`mt-3 pt-2.5 border-t text-[11px] flex justify-between ${isDark ? 'border-[#1E293B]' : 'border-slate-200'} ${mutedText}`}>
              <span>what-if simulation ronoa</span>
              <span className="tabular-nums font-semibold">
                {fmtPct(financialSummary.wiRonoaPct)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* SECTION 2: 8 PERFORMANCE LEADERS & AREAS OF IMPROVEMENT             */}
      {/* =================================================================== */}
      <section className={`rounded-xl border p-5 ${cardSurface}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <div>
            <h3 className="text-[14px] font-bold tracking-tight lowercase">
              performance leaders &amp; areas of improvement
            </h3>
            <p className={`text-[12px] mt-0.5 ${mutedText}`}>
              select a performance leader to filter actions, or click{' '}
              <span className="font-semibold">areas of improvement</span> for their numbers
              snapshot and editable touch-point hints.
            </p>
          </div>
          {selectedLeaderFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedLeaderFilter('all')}
              className="text-[12px] font-semibold text-[#00A3E0] hover:underline cursor-pointer"
            >
              show all leaders ({actions.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PERFORMANCE_LEADERS.map((leader) => {
            const headline = financialSummary.leaderHeadline[leader.id];
            const count = actionCountByLeader[leader.id] || 0;
            const isSelected = selectedLeaderFilter === leader.id;

            return (
              <div
                key={leader.id}
                onClick={() =>
                  setSelectedLeaderFilter(isSelected ? 'all' : leader.id)
                }
                className={`rounded-lg border p-3.5 flex flex-col justify-between gap-3 transition-colors cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-[#111C2E] border-[#00A3E0]'
                      : 'bg-sky-50/50 border-[#00A3E0]'
                    : isDark
                    ? 'bg-[#0B1220] border-[#1E293B] hover:border-[#334155]'
                    : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-[13px] lowercase leading-snug">
                      {leader.label}
                    </div>
                    <span
                      className={`text-[11px] tabular-nums shrink-0 ${
                        count > 0
                          ? 'font-semibold text-[#00A3E0]'
                          : mutedText
                      }`}
                    >
                      {count} {count === 1 ? 'action' : 'actions'}
                    </span>
                  </div>
                  <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                    {leader.shortRole}
                  </div>

                  <div
                    className={`mt-2.5 pt-2 border-t flex items-baseline justify-between text-[11.5px] ${
                      isDark ? 'border-[#1E293B]' : 'border-slate-200/80'
                    }`}
                  >
                    <span className={mutedText}>{headline.label}</span>
                    <span className="tabular-nums font-semibold">
                      {headline.actual}
                      {headline.target !== headline.actual && (
                        <span className="text-[#00A3E0] ml-1">→ {headline.target}</span>
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openHintsForLeader(leader.id);
                  }}
                  className={`w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md border text-[11.5px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    isDark
                      ? 'border-[#334155] bg-[#1E293B] text-slate-200 hover:border-[#00A3E0] hover:text-[#38BDF8]'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-[#00A3E0] hover:text-[#0284C7]'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-[#00A3E0]" />
                  areas of improvement
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* =================================================================== */}
      {/* SECTION 3: PROGRAMME OF ACTIONS (ADD / AMEND / DELETE)              */}
      {/* =================================================================== */}
      <section className={`rounded-xl border p-5 ${cardSurface}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-[#1E293B]">
          <div>
            <h3 className="text-[14px] font-bold tracking-tight lowercase">
              programme of actions
              {selectedLeaderFilter !== 'all' && (
                <span className="text-[#00A3E0] font-semibold ml-1.5">
                  · {PERFORMANCE_LEADERS.find((l) => l.id === selectedLeaderFilter)?.label}
                </span>
              )}
            </h3>
            <p className={`text-[12px] mt-0.5 ${mutedText}`}>
              {filteredActions.length} of {actions.length} action{' '}
              {actions.length === 1 ? 'step' : 'steps'} shown · assign owners, target dates,
              and track progress notes
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${mutedText}`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="search actions..."
                className={`pl-8 pr-3 py-1.5 text-[12px] rounded-lg border outline-none w-44 ${inputSurface}`}
              />
            </div>

            <select
              value={selectedLeaderFilter}
              onChange={(e) =>
                setSelectedLeaderFilter(e.target.value as PerformanceLeaderId | 'all')
              }
              aria-label="Filter by performance leader"
              className={`px-2.5 py-1.5 text-[12px] rounded-lg border outline-none cursor-pointer lowercase ${inputSurface}`}
            >
              <option value="all">all performance leaders</option>
              {PERFORMANCE_LEADERS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ActionStatus | 'all')}
              aria-label="Filter by status"
              className={`px-2.5 py-1.5 text-[12px] rounded-lg border outline-none cursor-pointer lowercase ${inputSurface}`}
            >
              <option value="all">all statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                if (selectedLeaderFilter !== 'all') {
                  setFormLeaderId(selectedLeaderFilter);
                }
                setIsAddFormOpen((prev) => !prev);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold bg-[#00A3E0] text-white hover:bg-[#0284C7] whitespace-nowrap transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              add action
            </button>
          </div>
        </div>

        {/* Add Action Form */}
        {isAddFormOpen && (
          <form
            onSubmit={handleAddAction}
            className={`mt-4 p-4 rounded-lg border space-y-3 ${
              isDark
                ? 'bg-[#0B1220] border-[#334155]'
                : 'bg-slate-50 border-slate-300/90'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold lowercase">
                new action to improve
              </span>
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className={`p-1 rounded cursor-pointer ${mutedText} hover:text-slate-900 dark:hover:text-white`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-3">
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>
                  performance leader
                </label>
                <select
                  value={formLeaderId}
                  onChange={(e) =>
                    setFormLeaderId(e.target.value as PerformanceLeaderId)
                  }
                  className={`w-full px-2.5 py-1.5 text-[12.5px] rounded-md border outline-none lowercase ${inputSurface}`}
                >
                  {PERFORMANCE_LEADERS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-5">
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>
                  action step / activity
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. tighten 30-day credit follow-up to cut debtor days by 8 days"
                  className={`w-full px-2.5 py-1.5 text-[12.5px] rounded-md border outline-none ${inputSurface}`}
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>
                  assigned to
                </label>
                <input
                  type="text"
                  value={formAssignedTo}
                  onChange={(e) => setFormAssignedTo(e.target.value)}
                  placeholder="dept. head / name"
                  className={`w-full px-2.5 py-1.5 text-[12.5px] rounded-md border outline-none ${inputSurface}`}
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>
                  target date
                </label>
                <input
                  type="date"
                  value={formTargetDate}
                  onChange={(e) => setFormTargetDate(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-[12px] rounded-md border outline-none tabular-nums ${inputSurface}`}
                />
              </div>

              <div className="md:col-span-3">
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>
                  status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ActionStatus)}
                  className={`w-full px-2.5 py-1.5 text-[12.5px] rounded-md border outline-none lowercase ${inputSurface}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-9">
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>
                  progress notes / milestone
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="optional target metric, touch-point, or review notes..."
                  className={`w-full px-2.5 py-1.5 text-[12.5px] rounded-md border outline-none ${inputSurface}`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-semibold cursor-pointer ${
                  isDark
                    ? 'text-slate-300 hover:bg-[#1E293B]'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                cancel
              </button>
              <button
                type="submit"
                disabled={!formTitle.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-semibold bg-[#00A3E0] text-white hover:bg-[#0284C7] disabled:opacity-40 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                save action
              </button>
            </div>
          </form>
        )}

        {/* Actions Table */}
        <div className="mt-4 overflow-x-auto">
          {filteredActions.length === 0 ? (
            <div
              className={`py-10 px-4 text-center rounded-lg border border-dashed text-[12.5px] ${
                isDark
                  ? 'border-[#334155] text-slate-400'
                  : 'border-slate-300 text-slate-500'
              }`}
            >
              {actions.length === 0 ? (
                <>
                  no action steps added yet. click{' '}
                  <button
                    type="button"
                    onClick={() => setIsAddFormOpen(true)}
                    className="font-semibold text-[#00A3E0] hover:underline cursor-pointer"
                  >
                    + add action
                  </button>{' '}
                  or open{' '}
                  <button
                    type="button"
                    onClick={() => openHintsForLeader('manufacturing')}
                    className="font-semibold text-[#00A3E0] hover:underline cursor-pointer"
                  >
                    areas of improvement
                  </button>{' '}
                  to turn improvement hints directly into assigned actions.
                </>
              ) : (
                'no action steps match your current filter.'
              )}
            </div>
          ) : (
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr
                  className={`border-b text-[10.5px] font-bold uppercase tracking-wider ${
                    isDark
                      ? 'border-[#1E293B] text-slate-400'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  <th className="py-2.5 px-3 text-left whitespace-nowrap">
                    performance leader
                  </th>
                  <th className="py-2.5 px-3 text-left">action / activity</th>
                  <th className="py-2.5 px-3 text-left whitespace-nowrap">
                    assigned to
                  </th>
                  <th className="py-2.5 px-3 text-left whitespace-nowrap">
                    target date
                  </th>
                  <th className="py-2.5 px-3 text-left whitespace-nowrap">status</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-[#1E293B]">
                {filteredActions.map((action) => {
                  const isEditing = editingActionId === action.id && editDraft;
                  const isConfirmDelete = confirmDeleteActionId === action.id;
                  const leaderLabel =
                    PERFORMANCE_LEADERS.find((l) => l.id === action.leaderId)
                      ?.label || action.leaderId;

                  if (isEditing && editDraft) {
                    return (
                      <tr
                        key={action.id}
                        className={isDark ? 'bg-[#111C2E]' : 'bg-sky-50/40'}
                      >
                        <td className="py-2.5 px-3 align-top">
                          <select
                            value={editDraft.leaderId}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                leaderId: e.target.value as PerformanceLeaderId,
                              })
                            }
                            className={`w-full px-2 py-1 text-[12px] rounded border outline-none lowercase ${inputSurface}`}
                          >
                            {PERFORMANCE_LEADERS.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3 align-top space-y-1.5">
                          <input
                            type="text"
                            value={editDraft.title}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, title: e.target.value })
                            }
                            className={`w-full px-2 py-1 text-[12px] rounded border outline-none ${inputSurface}`}
                          />
                          <input
                            type="text"
                            value={editDraft.progressNotes}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                progressNotes: e.target.value,
                              })
                            }
                            placeholder="progress notes..."
                            className={`w-full px-2 py-1 text-[11.5px] rounded border outline-none ${inputSurface}`}
                          />
                        </td>
                        <td className="py-2.5 px-3 align-top">
                          <input
                            type="text"
                            value={editDraft.assignedTo}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                assignedTo: e.target.value,
                              })
                            }
                            className={`w-full px-2 py-1 text-[12px] rounded border outline-none ${inputSurface}`}
                          />
                        </td>
                        <td className="py-2.5 px-3 align-top">
                          <input
                            type="date"
                            value={editDraft.targetDate}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                targetDate: e.target.value,
                              })
                            }
                            className={`px-2 py-1 text-[12px] rounded border outline-none tabular-nums ${inputSurface}`}
                          />
                        </td>
                        <td className="py-2.5 px-3 align-top">
                          <select
                            value={editDraft.status}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                status: e.target.value as ActionStatus,
                              })
                            }
                            className={`px-2 py-1 text-[12px] rounded border outline-none lowercase ${inputSurface}`}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3 align-top text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleSaveEditAction}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11.5px] font-semibold bg-[#00A3E0] text-white hover:bg-[#0284C7] cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingActionId(null);
                                setEditDraft(null);
                              }}
                              className={`px-2 py-1 rounded text-[11.5px] font-semibold cursor-pointer ${
                                isDark
                                  ? 'text-slate-300 hover:bg-[#1E293B]'
                                  : 'text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={action.id}
                      className={
                        isDark ? 'hover:bg-[#1E293B]/35' : 'hover:bg-slate-50/80'
                      }
                    >
                      <td className="py-2.5 px-3 align-top whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openHintsForLeader(action.leaderId)}
                          title="Open Areas of Improvement & Snapshot"
                          className="font-semibold text-[#00A3E0] hover:underline lowercase cursor-pointer text-left"
                        >
                          {leaderLabel}
                        </button>
                      </td>

                      <td className="py-2.5 px-3 align-top">
                        <div
                          className={`font-medium leading-snug ${
                            action.status === 'completed'
                              ? 'line-through opacity-60'
                              : ''
                          }`}
                        >
                          {action.title}
                        </div>
                        {action.progressNotes && (
                          <div className={`text-[11.5px] mt-0.5 ${mutedText}`}>
                            {action.progressNotes}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 align-top whitespace-nowrap">
                        {action.assignedTo}
                      </td>

                      <td className="py-2.5 px-3 align-top whitespace-nowrap tabular-nums">
                        {action.targetDate || '—'}
                      </td>

                      <td className="py-2.5 px-3 align-top whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleCycleStatus(action)}
                          title="Click to cycle status"
                          className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold lowercase cursor-pointer hover:underline ${
                            action.status === 'completed'
                              ? isDark
                                ? 'text-emerald-400'
                                : 'text-emerald-700'
                              : action.status === 'in-progress'
                              ? isDark
                                ? 'text-sky-400'
                                : 'text-sky-700'
                              : mutedText
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              action.status === 'completed'
                                ? 'bg-emerald-500'
                                : action.status === 'in-progress'
                                ? 'bg-sky-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {action.status === 'in-progress'
                            ? 'in progress'
                            : action.status}
                        </button>
                      </td>

                      <td className="py-2.5 px-3 align-top text-right whitespace-nowrap">
                        {isConfirmDelete ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteAction(action.id)}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                            >
                              confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteActionId(null)}
                              className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                                isDark
                                  ? 'text-slate-300 hover:bg-[#1E293B]'
                                  : 'text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditAction(action)}
                              aria-label="Amend action"
                              className={`p-1 rounded transition-colors cursor-pointer ${
                                isDark
                                  ? 'text-slate-400 hover:text-white hover:bg-[#1E293B]'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                              }`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteActionId(action.id)}
                              aria-label="Delete action"
                              className={`p-1 rounded transition-colors cursor-pointer ${
                                isDark
                                  ? 'text-slate-400 hover:text-rose-400 hover:bg-[#1E293B]'
                                  : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Editable Areas of Improvement Popup */}
      <ImprovementHintsModal
        isOpen={hintsModalOpen}
        onClose={() => setHintsModalOpen(false)}
        leaderId={hintsModalLeaderId}
        onSelectLeader={setHintsModalLeaderId}
        leaderSnapshots={financialSummary.leaderSnapshots}
        hintsMap={hintsMap}
        onSaveHints={handleSaveHints}
        onResetHints={handleResetHints}
        onCreateActionFromHint={handleCreateActionFromHint}
        syncStatus={hintsSyncStatus}
        theme={theme}
      />
    </div>
  );
};
