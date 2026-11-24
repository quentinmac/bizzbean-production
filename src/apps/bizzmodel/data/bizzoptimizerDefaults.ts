export type TouchPointKey =
  | 'products'
  | 'customers'
  | 'suppliers'
  | 'systems'
  | 'infrastructure';

export type PerformanceLeaderId =
  | 'manufacturing'
  | 'contribution-mix'
  | 'gross-profit-adjustments'
  | 'expenses'
  | 'net-operating-assets'
  | 'total-asset-funding'
  | 'interest'
  | 'productivity';

export interface TouchPointMeta {
  key: TouchPointKey;
  label: string;
  description: string;
}

export const TOUCH_POINTS: TouchPointMeta[] = [
  {
    key: 'products',
    label: 'products',
    description: 'Pricing, product mix, specifications, waste, and value engineering',
  },
  {
    key: 'customers',
    label: 'customers',
    description: 'Segmentation, credit terms, ordering habits, retention, and service levels',
  },
  {
    key: 'suppliers',
    label: 'suppliers',
    description: 'Input pricing, payment terms, rebates, lead times, and vendor reliability',
  },
  {
    key: 'systems',
    label: 'systems',
    description: 'Controls, reporting cadence, scheduling, billing discipline, and KPIs',
  },
  {
    key: 'infrastructure',
    label: 'infrastructure',
    description: 'Equipment, facilities, layout, capacity utilization, and physical assets',
  },
];

export interface PerformanceLeaderMeta {
  id: PerformanceLeaderId;
  label: string;
  shortRole: string;
  primaryLever: 'return on sales' | 'asset turn' | 'both';
  summary: string;
}

export const PERFORMANCE_LEADERS: PerformanceLeaderMeta[] = [
  {
    id: 'manufacturing',
    label: 'manufacturing',
    shortRole: 'production & operations head',
    primaryLever: 'return on sales',
    summary: 'Direct materials, production payroll, factory overheads, and unit production cost',
  },
  {
    id: 'contribution-mix',
    label: 'contribution mix',
    shortRole: 'commercial & sales head',
    primaryLever: 'return on sales',
    summary: 'Revenue volume, selling prices, product mix, and gross profit margin %',
  },
  {
    id: 'gross-profit-adjustments',
    label: 'gross profit adjustments',
    shortRole: 'margin & inventory controller',
    primaryLever: 'return on sales',
    summary: 'Sales commissions, stock shrinkage, cost variances, and sundry other income',
  },
  {
    id: 'expenses',
    label: 'expenses',
    shortRole: 'finance & admin head',
    primaryLever: 'return on sales',
    summary: 'Employment costs, fixed overheads, variable opex, and expense-to-income leverage',
  },
  {
    id: 'net-operating-assets',
    label: 'net operating assets',
    shortRole: 'working capital & assets head',
    primaryLever: 'asset turn',
    summary: 'Fixed assets, inventory days, receivables days, payables days, and cash cycle',
  },
  {
    id: 'total-asset-funding',
    label: 'total asset funding',
    shortRole: 'treasury & capital head',
    primaryLever: 'both',
    summary: 'Balance sheet funding mix (equity, IBD, NIBD), debt/equity ratio, and bank cash',
  },
  {
    id: 'interest',
    label: 'interest',
    shortRole: 'banking & debt head',
    primaryLever: 'return on sales',
    summary: 'Term loan and overdraft financing cost, effective interest rate, and interest cover',
  },
  {
    id: 'productivity',
    label: 'productivity',
    shortRole: 'people & output head',
    primaryLever: 'both',
    summary: 'Revenue, gross profit, expenses, and net operating profit generated per rand of payroll',
  },
];

export interface ImprovementHintItem {
  id: string;
  text: string;
}

export type LeaderHintsByTouchPoint = Record<TouchPointKey, ImprovementHintItem[]>;
export type BizzOptimizerHintsMap = Record<PerformanceLeaderId, LeaderHintsByTouchPoint>;

export type ActionStatus = 'planned' | 'in-progress' | 'completed';

export interface BizzOptimizerActionItem {
  id: string;
  leaderId: PerformanceLeaderId;
  title: string;
  assignedTo: string;
  targetDate: string; // YYYY-MM-DD
  status: ActionStatus;
  progressNotes: string;
  createdAt: number;
  updatedAt?: number;
}

export interface BizzOptimizerTargets {
  targetRosPct: number | null;
  targetAssetTurn: number | null;
  evaluationLabel?: string;
}

export interface BizzOptimizerState {
  targets: BizzOptimizerTargets;
  actions: BizzOptimizerActionItem[];
}

export const DEFAULT_BIZZOPTIMIZER_STATE: BizzOptimizerState = {
  targets: {
    targetRosPct: null,
    targetAssetTurn: null,
    evaluationLabel: '',
  },
  actions: [],
};

function makeHints(prefix: string, items: string[]): ImprovementHintItem[] {
  return items.map((text, idx) => ({
    id: `${prefix}-${idx + 1}`,
    text,
  }));
}

export const DEFAULT_BIZZOPTIMIZER_HINTS: BizzOptimizerHintsMap = {
  manufacturing: {
    products: makeHints('mfg-prod', [
      'Review bills of materials to eliminate avoidable material waste and off-cuts',
      'Standardize components across product lines to unlock longer, more efficient runs',
      'Re-engineer high-cost SKUs where production unit cost erodes target gross margin',
    ]),
    customers: makeHints('mfg-cust', [
      'Set minimum order quantities on custom runs to avoid costly short-batch changeovers',
      'Align customer delivery lead times with optimal batch scheduling rather than rush jobs',
      'Charge accurately for bespoke modifications and rush-order expediting',
    ]),
    suppliers: makeHints('mfg-supp', [
      'Renegotiate raw material pricing tiers and bulk volume rebates with primary suppliers',
      'Qualify secondary suppliers for critical inputs to protect against price spikes and delays',
      'Audit incoming material quality to prevent line stoppages and rework',
    ]),
    systems: makeHints('mfg-sys', [
      'Track batch yield, scrap rates, and setup downtime weekly per product line',
      'Compare actual material usage against standard BOM quantities after every run',
      'Implement preventive maintenance schedules to reduce unplanned machine breakdowns',
    ]),
    infrastructure: makeHints('mfg-infra', [
      'Re-layout workshop flow to cut material handling time and bottleneck queues',
      'Monitor energy and utility consumption per shift to eliminate idle equipment draw',
      'Evaluate shift utilization before committing capital to additional machinery',
    ]),
  },
  'contribution-mix': {
    products: makeHints('mix-prod', [
      'Rank all products by gross margin rand contribution and promote top-quartile earners',
      'Implement disciplined price increases on price-inelastic or flagship offerings',
      'Bundle slower-moving items with high-margin core products or discontinue chronic low-margin SKUs',
    ]),
    customers: makeHints('mix-cust', [
      'Analyze profitability by customer tier and tighten ad-hoc discounting on low-margin accounts',
      'Focus sales effort on higher-margin customer segments and repeat contract buyers',
      'Cross-sell complementary higher-margin products to existing active customers',
    ]),
    suppliers: makeHints('mix-supp', [
      'Secure exclusive or preferred-partner pricing on fast-moving traded lines',
      'Negotiate co-marketing allowances or promotional discounts to support sales campaigns',
      'Benchmark landed unit costs quarterly to keep gross margins ahead of input inflation',
    ]),
    systems: makeHints('mix-sys', [
      'Require management sign-off for any sales quote below the floor gross margin threshold',
      'Review monthly sales mix variance (volume vs. price vs. mix) with the sales team',
      'Align sales incentives to gross profit rand contribution rather than top-line revenue alone',
    ]),
    infrastructure: makeHints('mix-infra', [
      'Improve merchandising, showroom presentation, or digital catalog visibility for high-margin lines',
      'Ensure fulfillment capacity can meet peak demand on top-contributing products without stockouts',
    ]),
  },
  'gross-profit-adjustments': {
    products: makeHints('gpa-prod', [
      'Identify slow-moving, perishable, or obsolete SKUs early and clear before write-offs mount',
      'Tighten packaging and handling standards to reduce damaged goods and customer returns',
    ]),
    customers: makeHints('gpa-cust', [
      'Review customer return policies and root-cause recurring credit notes by account',
      'Cap rebate structures and volume kickbacks so they only trigger on profitable growth',
    ]),
    suppliers: makeHints('gpa-supp', [
      'Claim supplier credits promptly for short deliveries, damaged stock, and warranty defects',
      'Negotiate sale-or-return or consignment terms on slow-turning product lines',
    ]),
    systems: makeHints('gpa-sys', [
      'Run regular cycle counts on high-value inventory items instead of waiting for year-end stocktakes',
      'Tie sales commission payouts strictly to collected cash receipts and net margin achieved',
      'Reconcile manufacturing and cost variances monthly to isolate root causes immediately',
    ]),
    infrastructure: makeHints('gpa-infra', [
      'Improve warehouse access control, bin labeling, and storage conditions to curb shrinkage',
      'Monetize under-utilized space, scrap by-products, or ancillary services as other income',
    ]),
  },
  expenses: {
    products: makeHints('exp-prod', [
      'Eliminate complex low-volume product variants that inflate administrative and support overhead',
      'Verify delivery and fulfillment fees recover actual variable distribution costs',
    ]),
    customers: makeHints('exp-cust', [
      'Introduce minimum order thresholds or delivery surcharges on small, high-touch orders',
      'Shift routine customer inquiries and repeat ordering to lower-cost digital self-service',
    ]),
    suppliers: makeHints('exp-supp', [
      'Re-tender major recurring overhead contracts (insurance, telecoms, logistics, security) annually',
      'Audit software subscriptions, retainers, and service SLAs to remove unused seats or overlap',
    ]),
    systems: makeHints('exp-sys', [
      'Enforce purchase-order approval limits and monthly budget-vs-actual variance reviews per department',
      'Automate repetitive invoicing, reconciliation, and reporting tasks to hold admin costs flat as sales grow',
      'Track the expense-to-income ratio monthly so fixed overheads never outpace gross profit growth',
    ]),
    infrastructure: makeHints('exp-infra', [
      'Audit premises lease terms, floor space utilization, and energy efficiency to lower occupancy costs',
      'Review fleet routing, fuel monitoring, and vehicle maintenance to curb variable operating costs',
    ]),
  },
  'net-operating-assets': {
    products: makeHints('noa-prod', [
      'Classify inventory by ABC velocity and trim safety stock on slow-moving C-class items',
      'Shorten work-in-progress lead times to convert raw materials into billable finished goods faster',
    ]),
    customers: makeHints('noa-cust', [
      'Enforce credit limits, run credit checks on new accounts, and require deposits on large orders',
      'Follow up overdue receivables proactively at 7, 15, and 30 days past due to compress debtor days',
      'Offer structured early-settlement incentives only where cost is below working capital financing cost',
    ]),
    suppliers: makeHints('noa-supp', [
      'Negotiate extended creditor payment terms (e.g. 30 to 45/60 days) aligned to your collection cycle',
      'Move to smaller, more frequent supplier deliveries (JIT) to keep average stock levels lean',
    ]),
    systems: makeHints('noa-sys', [
      'Issue accurate invoices immediately upon dispatch rather than batching at month-end',
      'Review aged debtors, aged stock, and reorder points weekly with department heads',
      'Track cash conversion cycle (Inventory Days + Receivable Days − Payable Days) as a core KPI',
    ]),
    infrastructure: makeHints('noa-infra', [
      'Dispose of idle or redundant fixed assets that tie up capital without generating revenue',
      'Compare lease vs. buy carefully so fixed asset additions directly expand revenue capacity',
    ]),
  },
  'total-asset-funding': {
    products: makeHints('taf-prod', [
      'Prioritize cash-generative products with quick turnaround when working capital is constrained',
      'Require staged milestone payments on long-cycle projects so customers help fund WIP',
    ]),
    customers: makeHints('taf-cust', [
      'Collect upfront retainers, deposits, or annual prepayments to boost non-interest-bearing funding',
      'Reduce customer concentration risk so bank covenants and funding lines remain secure',
    ]),
    suppliers: makeHints('taf-supp', [
      'Maximize healthy trade credit (NIBD) from key suppliers without sacrificing settlement discounts',
      'Align supplier payment run dates with major customer collection dates to smooth cash troughs',
    ]),
    systems: makeHints('taf-sys', [
      'Maintain a rolling 13-week cash flow forecast alongside the 60-month balance sheet projection',
      'Keep debt-to-equity and liquidity ratios within target lender covenants before raising capital',
    ]),
    infrastructure: makeHints('taf-infra', [
      'Match long-term asset purchases with long-term finance rather than funding capex from overdraft',
      'Evaluate asset-backed finance or sale-and-leaseback where balance sheet gearing is stretched',
    ]),
  },
  interest: {
    products: makeHints('int-prod', [
      'Reduce capital tied up in slow-moving stock funded by expensive short-term overdraft facilities',
    ]),
    customers: makeHints('int-cust', [
      'Accelerate debtor collections to keep the bank account in surplus and earn positive interest',
      'Apply contractual late-payment interest clauses on chronically overdue trade accounts',
    ]),
    suppliers: makeHints('int-supp', [
      'Compare supplier early-payment discounts against your marginal overdraft rate before paying early',
      'Avoid informal high-cost bridging credit by negotiating formal supplier payment arrangements',
    ]),
    systems: makeHints('int-sys', [
      'Sweep surplus operating cash automatically into interest-bearing call accounts or debt reduction',
      'Consolidate high-rate short-term facilities into lower-cost structured term loans',
      'Review bank facility pricing, prime-linked margins, and interest cover with your banker semi-annually',
    ]),
    infrastructure: makeHints('int-infra', [
      'Refinance maturing equipment leases or term loans if market rates or credit standing have improved',
      'Release non-core fixed assets to pay down highest-interest debt first',
    ]),
  },
  productivity: {
    products: makeHints('prd-prod', [
      'Simplify product specifications and service delivery steps to raise output per labour hour',
      'Focus skilled staff time on high-value offerings while automating or outsourcing low-margin work',
    ]),
    customers: makeHints('prd-cust', [
      'Standardize onboarding and quoting templates so sales teams close more revenue per head',
      'Reduce rework and customer support fire-fighting through clear upfront specifications',
    ]),
    suppliers: makeHints('prd-supp', [
      'Hold suppliers to on-time-in-full (OTIF) delivery so teams never lose paid hours waiting for stock',
      'Source pre-assembled or kitted components where specialist vendors deliver faster than in-house labour',
    ]),
    systems: makeHints('prd-sys', [
      'Set clear daily/weekly output KPIs per team (revenue, gross profit, and NOP per employee)',
      'Cross-train staff across adjacent roles to maintain throughput during leave and demand spikes',
      'Review overtime patterns weekly to fix scheduling bottlenecks instead of normalizing overtime pay',
    ]),
    infrastructure: makeHints('prd-infra', [
      'Equip teams with reliable tools, ergonomics, and software that eliminate manual double-handling',
      'Improve workspace layout and digital connectivity to cut idle transit and waiting time',
    ]),
  },
};

export function cloneDefaultHints(): BizzOptimizerHintsMap {
  const out = {} as BizzOptimizerHintsMap;
  for (const leader of PERFORMANCE_LEADERS) {
    const tpMap = {} as LeaderHintsByTouchPoint;
    for (const tp of TOUCH_POINTS) {
      tpMap[tp.key] = DEFAULT_BIZZOPTIMIZER_HINTS[leader.id][tp.key].map((h) => ({ ...h }));
    }
    out[leader.id] = tpMap;
  }
  return out;
}
