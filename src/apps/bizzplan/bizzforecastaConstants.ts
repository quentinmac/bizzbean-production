import { BizzPlanData, BizzModelData } from '../../types';
import {
  BizzModelState,
  HistoricalPerformanceYear,
  createDefaultHistoricalPerformanceData,
} from '../bizzmodel/constants';
import { calculateFinancialModelProjections } from '../bizzmodel/utils/revenueCalc';
import { computeHistoricalYearMetrics, getActiveHistoricalYears } from '../bizzmodel/components/HistoricalPerformanceTable';

export const INITIAL_BIZZFORECASTA_PLAN_DATA: BizzPlanData = {
  businessName: '',
  vision: '',
  mission: '',
  coverPage: {
    companyLogo: '',
    companyName: '',
    businessType: '',
    businessLocation: '',
    preparationPrincipal: '',
    preparationDate: '',
    principalEmail: '',
    principalMobile: '',
  },
  pitch: {
    elevatorPitch: '',
    valueOffer: ['', '', ''],
    revenueModel: ['', '', ''],
    financialOutlook: ['', '', ''],
    competitorLandscape: ['', '', ''],
    getToMarket: ['', '', ''],
    growthLeverFunding: ['', '', ''],
    fundingDeal: ['', '', ''],
  },
  governance: {
    corporate: {
      legalForm: '',
      startDate: '',
      financialMonthEnd: '',
      boardSize: '',
      boardQuorum: '',
      boardMeetingFrequency: '',
      financialReportingFrequency: '',
      shareholdersAgreement: '',
    },
    boardMembers: [{ name: '', shareholding: '' }],
    keyPersonnel: [{ name: '', position: '' }],
    professionalSupport: [{ name: '', serviceType: '' }],
  },
  sections: [
    // 4 Preserved Core BizzPlan Pages
    {
      id: 'formation',
      title: 'cover page',
      defaultTitle: 'cover page',
      content: '',
      isCompleted: false,
      checkpoints: ['legal structure', 'ownership', 'registration details'],
      isOptional: false,
      isIncluded: true,
    },
    {
      id: 'pitch',
      title: 'investor pitch',
      defaultTitle: 'investor pitch',
      content: '',
      isCompleted: false,
      checkpoints: ['the hook', 'problem & solution', 'funding request'],
      isOptional: false,
      isIncluded: true,
    },
    {
      id: 'governance',
      title: 'governance',
      defaultTitle: 'governance',
      content: '',
      isCompleted: false,
      checkpoints: ['board structure', 'executive team', 'internal controls', 'compliance'],
      isOptional: false,
      isIncluded: true,
    },
    {
      id: 'assumptions',
      title: 'assumptions',
      defaultTitle: 'assumptions',
      content: '',
      isCompleted: false,
      checkpoints: ['inflation rates', 'market growth', 'operational costs'],
      isOptional: false,
      isIncluded: true,
    },

    // 8 Scripted Optional / Guide Growth-Capital Pages
    {
      id: 'exec_summary_ask',
      title: '1. executive summary and the ask',
      defaultTitle: '1. executive summary and the ask',
      content: '',
      isCompleted: false,
      type: 'scripted',
      isOptional: true,
      isIncluded: true,
      checkpoints: ['one-line value proposition', 'capital requested', 'headline impact'],
      customMetrics: {
        capitalRequested: 0,
        instrumentPreference: 'Equity',
        targetTimeline: '3–6 months',
      },
      hints: [
        {
          heading: 'One-line value proposition',
          detail: 'What the business does and why it wins right now.',
        },
        {
          heading: 'Capital requested',
          detail:
            'Exact rand/currency amount, instrument preference (equity, debt, mezzanine, or revenue-based), and target timeline.',
        },
        {
          heading: 'Headline impact',
          detail:
            'How this capital unlocks a specific inflection point (e.g., 3x capacity, new region, or margin expansion).',
        },
      ],
    },
    {
      id: 'proven_traction',
      title: '2. proven traction & historical performance',
      defaultTitle: '2. proven traction & historical performance',
      content: '',
      isCompleted: false,
      type: 'scripted',
      isOptional: true,
      isIncluded: true,
      autoSyncBlock: 'historical_traction',
      checkpoints: ['revenue & profit trajectory', 'customer proof', 'operational milestones'],
      customMetrics: {
        retentionRatePct: 0,
        churnRatePct: 0,
        netDollarRetentionPct: 0,
        contractedPipeline: 0,
      },
      hints: [
        {
          heading: 'Revenue and profit trajectory',
          detail:
            '2–3 years of historical performance (or from inception), highlighting gross margins, EBITDA/operating cash flow, and unit economics.',
          autoSyncTag: 'automatically updated from bizzforecasta',
        },
        {
          heading: 'Customer proof',
          detail:
            'Retention/churn rates, net dollar retention, repeat orders, or contracted pipeline.',
        },
        {
          heading: 'Operational milestones',
          detail: 'Key past achievements that de-risk execution.',
        },
      ],
    },
    {
      id: 'market_opportunity',
      title: '3. market opportunity and growth drivers',
      defaultTitle: '3. market opportunity and growth drivers',
      content: '',
      isCompleted: false,
      type: 'scripted',
      isOptional: true,
      isIncluded: true,
      checkpoints: ['addressable market', 'tailwinds & catalysts', 'competitive moat'],
      hints: [
        {
          heading: 'Addressable market',
          detail:
            'Realistic total/serviceable market size focused on segments you can capture.',
        },
        {
          heading: 'Tailwinds and catalysts',
          detail:
            'Regulatory shifts, demand trends, or supply gaps driving growth now.',
        },
        {
          heading: 'Competitive moat and positioning',
          detail:
            'Why customers choose you over incumbents or alternatives, and how defensible that edge is as you scale.',
        },
      ],
    },
    {
      id: 'growth_strategy',
      title: '4. growth strategy and go-to-market execution',
      defaultTitle: '4. growth strategy and go-to-market execution',
      content: '',
      isCompleted: false,
      type: 'scripted',
      isOptional: true,
      isIncluded: true,
      autoSyncBlock: 'quarterly_kpis',
      checkpoints: ['growth levers', 'repeatable playbook', 'quarterly milestones & kpis'],
      hints: [
        {
          heading: 'Growth levers',
          detail:
            'Specific expansion channels (new geographies, product lines, sales motion, M&A, or capex).',
        },
        {
          heading: 'Repeatable playbook',
          detail:
            'Proof that your customer acquisition and delivery model scales without linear cost blowouts.',
        },
        {
          heading: 'Key milestones and KPIs',
          detail: 'Quarterly targets for the next 12–24 months.',
          autoSyncTag: 'updated from bizzforecasta',
        },
      ],
    },
    {
      id: 'use_of_funds',
      title: '5. use of funds and capital allocation',
      defaultTitle: '5. use of funds and capital allocation',
      content: '',
      isCompleted: false,
      type: 'scripted',
      isOptional: true,
      isIncluded: true,
      checkpoints: ['line-item breakdown', 'pacing & tranches', 'runway & buffer'],
      hints: [
        {
          heading: 'Line-item breakdown',
          detail:
            'Exact allocation across capex, working capital, sales/marketing, hiring, or debt refinancing.',
        },
        {
          heading: 'Pacing and tranches',
          detail:
            'How cash is deployed over time and what milestones each stage unlocks.',
        },
        {
          heading: 'Runway and buffer',
          detail:
            'How the raise extends runway and protects against timing slippages.',
        },
      ],
    },
    {
      id: 'financial_projections',
      title: '6. financial projections and unit economics',
      defaultTitle: '6. financial projections and unit economics',
      content: '',
      isCompleted: false,
      type: 'scripted',
      isOptional: true,
      isIncluded: true,
      autoSyncBlock: 'financial_projections_unit_econ',
      checkpoints: ['3-5 year forecast', 'unit economics', 'scenario sensitivities', 'historical performance'],
      customMetrics: {
        cac: 0,
        ltv: 0,
        paybackMonths: 0,
        contributionMarginPct: 0,
      },
      hints: [
        {
          heading: '3–5-year forecast',
          detail:
            'Revenue, gross margin, operating expenses, cash burn/generation, and working capital needs.',
          autoSyncTag: 'updated by bizzforecasta',
        },
        {
          heading: 'Core unit economics',
          detail:
            'Customer acquisition cost (CAC), lifetime value (LTV), payback period, and contribution margin.',
        },
        {
          heading: 'Scenario sensitivities',
          detail:
            'Base, upside, and downside cases showing how cash flow holds up under slower growth or cost pressure.',
        },
        {
          heading: 'Historical performance',
          detail:
            '3–5-year hi-level income statement, balance sheet and cashflow.',
          autoSyncTag: 'updated from bizzforecasta',
        },
      ],
    },
    {
      id: 'leadership_governance',
      title: '7. leadership team and governance',
      defaultTitle: '7. leadership team and governance',
      content: '',
      isCompleted: false,
      type: 'scripted',
      isOptional: true,
      isIncluded: true,
      checkpoints: ['management bench', 'ownership & cap table', 'governance & reporting'],
      hints: [
        {
          heading: 'Management bench',
          detail:
            'Founders and key operators, their relevant track records, and any planned hires to close capability gaps.',
        },
        {
          heading: 'Ownership and cap table',
          detail:
            'Current shareholding, prior funding history, option pools, and existing debt/liabilities.',
        },
        {
          heading: 'Governance & reporting',
          detail:
            'Board structure, financial controls, audit readiness, and investor reporting cadence.',
        },
      ],
    },
    {
      id: 'risks_exit',
      title: '8. risks, mitigants and exit / repayment path',
      defaultTitle: '8. risks, mitigants and exit / repayment path',
      content: '',
      isCompleted: false,
      type: 'scripted',
      isOptional: true,
      isIncluded: true,
      checkpoints: ['key scaling risks', 'concrete mitigants', 'return / exit alignment'],
      hints: [
        {
          heading: 'Key scaling risks',
          detail:
            'Supply chain bottlenecks, concentration risk, margin compression, regulatory hurdles, or execution delays.',
        },
        {
          heading: 'Concrete mitigants',
          detail:
            'Controls, contracts, or operational contingencies already in place.',
        },
        {
          heading: 'Return or exit alignment',
          detail:
            'Clear picture of cash generation for debt service, dividends, or medium-term exit/liquidity options aligned with the funder’s mandate.',
        },
      ],
    },
  ],
};

export interface QuarterlyTargetRow {
  quarterLabel: string;
  monthsRange: string;
  revenue: number;
  grossProfit: number;
  grossMarginPct: number;
  opex: number;
  operatingProfit: number;
  closingCash: number;
  unitSales: number;
}

export interface ForecastYearSummaryRow {
  year: number;
  label: string;
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  grossMarginPct: number;
  opex: number;
  operatingProfit: number;
  netProfit: number;
  operatingCashFlow: number;
  workingCapitalNeeds: number;
  closingCash: number;
}

export interface ScenarioSensitivityRow {
  scenario: 'Base Case' | 'Upside (+20% Rev / +2% Margin)' | 'Downside (-20% Rev / +10% OpEx)';
  yr1Revenue: number;
  yr3Revenue: number;
  yr5Revenue: number;
  yr1Nop: number;
  yr3Nop: number;
  yr5Nop: number;
  yr1ClosingCash: number;
  yr3ClosingCash: number;
  yr5ClosingCash: number;
}

export interface BizzForecastaMetricsBundle {
  yearlyForecast: ForecastYearSummaryRow[];
  quarterlyTargets: QuarterlyTargetRow[];
  scenarios: ScenarioSensitivityRow[];
  historicalYears: HistoricalPerformanceYear[];
  historicalNotes: string;
  hasHistoricalData: boolean;
  totalFundingConfigured: number;
}

export function computeBizzForecastaMetrics(
  bizzModelState?: BizzModelState | null,
  modelData?: BizzModelData | null
): BizzForecastaMetricsBundle {
  const effectiveState: BizzModelState | null =
    bizzModelState || (modelData?._v2State as BizzModelState | undefined) || null;

  const forecastStartYear = effectiveState?.businessDetails?.startDateYear || 2026;
  const historicalYears = getActiveHistoricalYears(
    effectiveState?.historicalPerformance || createDefaultHistoricalPerformanceData(forecastStartYear, 3),
    forecastStartYear
  );
  const historicalNotes = effectiveState?.historicalPerformance?.notes || '';
  const hasHistoricalData = historicalYears.some(
    (y) =>
      Math.abs(y.revenue) > 0 ||
      Math.abs(y.costOfSales) > 0 ||
      Math.abs(y.operatingExpenses) > 0 ||
      Math.abs(y.fixedAssets) > 0 ||
      Math.abs(y.equity) > 0 ||
      Math.abs(y.operatingCashFlow) > 0
  );

  if (!effectiveState) {
    return {
      yearlyForecast: [1, 2, 3, 4, 5].map((y) => ({
        year: y,
        label: `Yr ${y}`,
        revenue: 0,
        costOfSales: 0,
        grossProfit: 0,
        grossMarginPct: 0,
        opex: 0,
        operatingProfit: 0,
        netProfit: 0,
        operatingCashFlow: 0,
        workingCapitalNeeds: 0,
        closingCash: 0,
      })),
      quarterlyTargets: Array.from({ length: 8 }, (_, idx) => ({
        quarterLabel: `Q${(idx % 4) + 1} Yr ${Math.floor(idx / 4) + 1}`,
        monthsRange: `M${idx * 3 + 1}–M${idx * 3 + 3}`,
        revenue: 0,
        grossProfit: 0,
        grossMarginPct: 0,
        opex: 0,
        operatingProfit: 0,
        closingCash: 0,
        unitSales: 0,
      })),
      scenarios: [
        {
          scenario: 'Base Case',
          yr1Revenue: 0,
          yr3Revenue: 0,
          yr5Revenue: 0,
          yr1Nop: 0,
          yr3Nop: 0,
          yr5Nop: 0,
          yr1ClosingCash: 0,
          yr3ClosingCash: 0,
          yr5ClosingCash: 0,
        },
        {
          scenario: 'Upside (+20% Rev / +2% Margin)',
          yr1Revenue: 0,
          yr3Revenue: 0,
          yr5Revenue: 0,
          yr1Nop: 0,
          yr3Nop: 0,
          yr5Nop: 0,
          yr1ClosingCash: 0,
          yr3ClosingCash: 0,
          yr5ClosingCash: 0,
        },
        {
          scenario: 'Downside (-20% Rev / +10% OpEx)',
          yr1Revenue: 0,
          yr3Revenue: 0,
          yr5Revenue: 0,
          yr1Nop: 0,
          yr3Nop: 0,
          yr5Nop: 0,
          yr1ClosingCash: 0,
          yr3ClosingCash: 0,
          yr5ClosingCash: 0,
        },
      ],
      historicalYears,
      historicalNotes,
      hasHistoricalData,
      totalFundingConfigured: 0,
    };
  }

  const projections = calculateFinancialModelProjections(effectiveState, 60, undefined, 'bizzforecasta');

  // 1. 5-Year Forecast
  const yearlyForecast: ForecastYearSummaryRow[] = [1, 2, 3, 4, 5].map((yr) => {
    const start = (yr - 1) * 12;
    const slice = projections.slice(start, start + 12);
    const lastMo = slice[slice.length - 1];
    const prevYrLast = yr > 1 ? projections[start - 1] : null;

    const revenue = slice.reduce((s, m) => s + (m.revenue || 0), 0);
    const costOfSales = slice.reduce((s, m) => s + (m.totalCos ?? m.cogs ?? 0), 0);
    const grossProfit = revenue - costOfSales;
    const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    const opex = slice.reduce(
      (s, m) =>
        s +
        (m.employmentExpenses || m.opexEmployment || 0) +
        (m.exDepreciation !== undefined ? m.exDepreciation : m.depreciation || 0) +
        (m.exLease || 0) +
        (m.exOverheads !== undefined ? m.exOverheads : Math.max(0, (m.operatingExpenses || 0) - (m.depreciation || 0))) +
        (m.exVariable || 0),
      0
    );
    const otherInc = slice.reduce((s, m) => s + (m.otherIncomeTotal || 0), 0);
    const gpAdj = slice.reduce(
      (s, m) =>
        s +
        (m.gpAdjustmentsCommission || 0) +
        (m.gpAdjustmentsInventory || 0) +
        (m.gpAdjustmentsVariance || 0),
      0
    );
    const operatingProfit = grossProfit - gpAdj + otherInc - opex;
    const netProfit = slice.reduce((s, m) => s + (m.taxedProfits || 0), 0);
    const interest = slice.reduce(
      (s, m) => s + (m.netFinanceCharges ?? ((m.interestExpense || 0) - (m.interestOther || 0))),
      0
    );
    const tax = slice.reduce((s, m) => s + (m.taxationMonthly ?? m.taxationCit ?? 0), 0);

    const inv = lastMo?.inventory ?? 0;
    const ar = lastMo?.accounts_receivable ?? 0;
    const ap = lastMo?.accounts_payable ?? 0;
    const workingCapitalNeeds = inv + ar - ap;

    const prevNwc =
      (prevYrLast?.inventory ?? 0) +
      (prevYrLast?.accounts_receivable ?? 0) -
      (prevYrLast?.accounts_payable ?? 0);
    const operatingCashFlow = operatingProfit - interest - tax - (workingCapitalNeeds - prevNwc);
    const closingCash = lastMo?.bank_balance_closing ?? lastMo?.closingCash ?? 0;

    return {
      year: yr,
      label: `Yr ${yr}`,
      revenue,
      costOfSales,
      grossProfit,
      grossMarginPct,
      opex,
      operatingProfit,
      netProfit,
      operatingCashFlow,
      workingCapitalNeeds,
      closingCash,
    };
  });

  // 2. Quarterly Targets (Next 12–24 Months: Q1–Q8)
  const quarterlyTargets: QuarterlyTargetRow[] = Array.from({ length: 8 }, (_, qIdx) => {
    const start = qIdx * 3;
    const slice = projections.slice(start, start + 3);
    const lastMo = slice[slice.length - 1];
    const revenue = slice.reduce((s, m) => s + (m.revenue || 0), 0);
    const costOfSales = slice.reduce((s, m) => s + (m.totalCos ?? m.cogs ?? 0), 0);
    const grossProfit = revenue - costOfSales;
    const opex = slice.reduce(
      (s, m) =>
        s +
        (m.employmentExpenses || m.opexEmployment || 0) +
        (m.exDepreciation !== undefined ? m.exDepreciation : m.depreciation || 0) +
        (m.exLease || 0) +
        (m.exOverheads !== undefined ? m.exOverheads : Math.max(0, (m.operatingExpenses || 0) - (m.depreciation || 0))) +
        (m.exVariable || 0),
      0
    );
    const operatingProfit = grossProfit - opex;
    const unitSales = slice.reduce((s, m) => s + (m.unitSales || 0), 0);
    return {
      quarterLabel: `Q${(qIdx % 4) + 1} Yr ${Math.floor(qIdx / 4) + 1}`,
      monthsRange: `M${start + 1}–M${start + 3}`,
      revenue,
      grossProfit,
      grossMarginPct: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      opex,
      operatingProfit,
      closingCash: lastMo?.bank_balance_closing ?? lastMo?.closingCash ?? 0,
      unitSales,
    };
  });

  // 3. Scenario Sensitivities (Base / Upside / Downside)
  const buildScenario = (
    name: ScenarioSensitivityRow['scenario'],
    revMult: number,
    marginDeltaPct: number,
    opexMult: number
  ): ScenarioSensitivityRow => {
    let cumCashDelta = 0;
    const calcYear = (yrIdx: number) => {
      const base = yearlyForecast[yrIdx];
      const rev = base.revenue * revMult;
      const baseMarginRatio = base.revenue > 0 ? base.grossProfit / base.revenue : 0;
      const adjMargin = Math.max(0, Math.min(0.98, baseMarginRatio + marginDeltaPct / 100));
      const gp = rev * adjMargin;
      const opex = base.opex * opexMult;
      const nop = gp - opex;
      const nopDelta = nop - base.operatingProfit;
      cumCashDelta += nopDelta * 0.78; // approx after-tax cash impact
      return {
        rev,
        nop,
        cash: base.closingCash + cumCashDelta,
      };
    };

    const y1 = calcYear(0);
    calcYear(1);
    const y3 = calcYear(2);
    calcYear(3);
    const y5 = calcYear(4);

    return {
      scenario: name,
      yr1Revenue: y1.rev,
      yr3Revenue: y3.rev,
      yr5Revenue: y5.rev,
      yr1Nop: y1.nop,
      yr3Nop: y3.nop,
      yr5Nop: y5.nop,
      yr1ClosingCash: y1.cash,
      yr3ClosingCash: y3.cash,
      yr5ClosingCash: y5.cash,
    };
  };

  const scenarios: ScenarioSensitivityRow[] = [
    buildScenario('Base Case', 1.0, 0, 1.0),
    buildScenario('Upside (+20% Rev / +2% Margin)', 1.2, 2.0, 1.05),
    buildScenario('Downside (-20% Rev / +10% OpEx)', 0.8, -2.0, 1.1),
  ];

  const termLoanTotal = (effectiveState.funding?.termLoans || []).reduce(
    (s, l) => s + (l.advanceValue || 0),
    0
  );
  const totalFundingConfigured =
    (effectiveState.funding?.founderEquity || 0) +
    (effectiveState.funding?.investorEquity || 0) +
    (effectiveState.funding?.bankLoanAmount || 0) +
    termLoanTotal;

  return {
    yearlyForecast,
    quarterlyTargets,
    scenarios,
    historicalYears,
    historicalNotes,
    hasHistoricalData,
    totalFundingConfigured,
  };
}

export function buildGeminiBusinessContext(
  planData: BizzPlanData,
  metrics: BizzForecastaMetricsBundle
) {
  return {
    businessName: planData.coverPage?.companyName || planData.businessName || 'Untitled Venture',
    businessType: planData.coverPage?.businessType || '',
    location: planData.coverPage?.businessLocation || '',
    vision: planData.vision || '',
    mission: planData.mission || '',
    elevatorPitch: planData.pitch?.elevatorPitch || '',
    totalFundingConfiguredInModel: Math.round(metrics.totalFundingConfigured),
    historicalPerformance: metrics.historicalYears.map((y) => {
      const m = computeHistoricalYearMetrics(y);
      return {
        year: y.yearLabel,
        revenue: Math.round(y.revenue),
        grossProfit: Math.round(m.grossProfit),
        grossMarginPct: Number(m.grossMarginPct.toFixed(1)),
        ebitda: Math.round(m.ebitda),
        netProfit: Math.round(m.netProfit),
        operatingCashFlow: Math.round(y.operatingCashFlow),
        closingCash: Math.round(y.closingCashBalance),
        totalAssets: Math.round(m.totalAssets),
        equity: Math.round(y.equity),
        longTermDebt: Math.round(y.longTermDebt),
      };
    }),
    fiveYearForecast: metrics.yearlyForecast.map((y) => ({
      year: y.label,
      revenue: Math.round(y.revenue),
      grossProfit: Math.round(y.grossProfit),
      grossMarginPct: Number(y.grossMarginPct.toFixed(1)),
      opex: Math.round(y.opex),
      operatingProfit: Math.round(y.operatingProfit),
      netProfit: Math.round(y.netProfit),
      operatingCashFlow: Math.round(y.operatingCashFlow),
      workingCapitalNeeds: Math.round(y.workingCapitalNeeds),
      closingCash: Math.round(y.closingCash),
    })),
    quarterlyTargetsNext24Months: metrics.quarterlyTargets.map((q) => ({
      quarter: q.quarterLabel,
      revenue: Math.round(q.revenue),
      grossProfit: Math.round(q.grossProfit),
      operatingProfit: Math.round(q.operatingProfit),
      closingCash: Math.round(q.closingCash),
    })),
  };
}
