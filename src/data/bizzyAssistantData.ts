export interface BizzyArticle {
  id: string;
  subheading: string;
  keyTakeaway: string;
  content: string;
  frameworkRule?: string;
  suggestedAction?: string;
  targetSolutionId?: string;
}

export interface BizzyHeadingSection {
  id: string;
  heading: string;
  stageCode: string;
  category: 'vi-ability' | 'fund-ability' | 'operations' | 'sustain-ability' | 'invest-ability' | 'guides';
  summary: string;
  articles: BizzyArticle[];
}

export const BIZZY_ASSISTANT_HEADINGS: BizzyHeadingSection[] = [
  {
    id: 'bizzy-sec-1',
    heading: '01. VI-ABILITY & UNIT ECONOMICS DISCIPLINE',
    stageCode: 'STAGE 01',
    category: 'vi-ability',
    summary: 'Core validation principles for customer acquisition cost, price elasticity, and economic buyer alignment.',
    articles: [
      {
        id: 'art-1-1',
        subheading: 'Blended vs. Paid CAC Accounting',
        keyTakeaway: 'Never mask poor ad conversion with organic founder network referrals.',
        content: 'When calculating Customer Acquisition Cost (CAC), separate your paid advertising CAC from your blended CAC. Blended CAC accounts for all acquisitions divided by total spend, but can dangerously obscure paid ad channels that are losing capital. Include fully-loaded costs: ad spends, agency retainers, sales development representative (SDR) base salaries, and software seat costs.',
        frameworkRule: 'Paid CAC must achieve payback within 6 to 8 months of net contribution margin.',
        suggestedAction: 'Audit CAC inputs in bizzcalc',
        targetSolutionId: 'bizzcalc',
      },
      {
        id: 'art-1-2',
        subheading: 'LTV to CAC Ratio & Payback Thresholds',
        keyTakeaway: 'A ratio below 3.0x signals enterprise insolvency before series A.',
        content: 'Lifetime Value (LTV) must be calculated on gross profit margin, never on top-line revenue: LTV = (Average Revenue Per User × Gross Margin %) / Churn Rate. A healthy venture targets LTV : CAC ≥ 3.5x. Ratios above 6.0x indicate under-investment in growth channels, while ratios below 3.0x indicate that customer acquisition will drain cash runway.',
        frameworkRule: 'Target LTV : CAC between 3.5x and 5.0x with gross margin ≥ 70%.',
        suggestedAction: 'Run sensitivity test in vi-ability',
        targetSolutionId: 'vi-ability',
      },
      {
        id: 'art-1-3',
        subheading: 'Pricing Elasticity & Subscription Transition',
        keyTakeaway: 'One-off transactions generate revenue; recurring subscriptions generate enterprise valuation multiples.',
        content: 'Transitioning from project-based billing or one-off product purchases to predictable recurring contracts increases company valuation by 4x to 6x revenue multiples. Founders must test three pricing tiers: Anchor Tier (entry self-serve), Growth Tier (standard operating workflow), and Sovereign Tier (dedicated SLA and governance).',
        frameworkRule: 'Lock in at least 60% of baseline operating costs via contracted recurring subscriptions.',
        suggestedAction: 'Review pricing tiers in bizzcalc',
        targetSolutionId: 'bizzcalc',
      },
      {
        id: 'art-1-4',
        subheading: 'Economic Buyer vs. User Persona Alignment',
        keyTakeaway: 'The person who signs the cheque is rarely the person who clicks the buttons.',
        content: 'In B2B solutions, distinguish the Economic Decision Maker (CFO / MD who controls capital) from the End User (operator who experiences the pain point). Value propositions for economic buyers must focus on ROI, risk reduction, and audit defense, while end-user features focus on workflow ease.',
        frameworkRule: 'Every pitch deck must articulate the Economic Buyer ROI formula clearly.',
        suggestedAction: 'Consult Coach GIM on Buyer Personas',
        targetSolutionId: 'dialogue',
      },
    ],
  },
  {
    id: 'bizzy-sec-2',
    heading: '02. FUND-ABILITY & CAPITAL ACCESS ARCHITECTURE',
    stageCode: 'STAGE 02',
    category: 'fund-ability',
    summary: 'Institutional financial modeling standards, runway preservation, and valuation sensitivity matrices.',
    articles: [
      {
        id: 'art-2-1',
        subheading: 'The 18-Month Cash Runway Rule',
        keyTakeaway: 'Fund-raising takes 6 to 9 months; starting with under 12 months creates desperate dilution.',
        content: 'Institutional venture capital and angel rounds take an average of 6 to 9 months from initial partner introduction to wired funds. Maintaining an 18-month cash runway ensures the founder negotiates from strength rather than survival. Monitor net monthly burn: Available Cash / (Operating Expenses - Gross Profit).',
        frameworkRule: 'Trigger capital preservation protocol when runway dips below 9 months.',
        suggestedAction: 'Inspect runway forecast in bizzmodel',
        targetSolutionId: 'bizzmodel',
      },
      {
        id: 'art-2-2',
        subheading: '3-Statement Financial Model Integrity',
        keyTakeaway: 'Income Statements predict; Cash Flow Statements determine survival.',
        content: 'A professional venture model dynamically links the Income Statement (P&L), Balance Sheet, and Cash Flow Statement. Operating profits do not equal cash: accounts receivable delays, inventory holding costs, and capital expenditures frequently trigger bankruptcies in profitable companies.',
        frameworkRule: 'All bizz-DESK models export macro-free formulas directly to Google Sheets and Excel.',
        suggestedAction: 'Export 3-statement model in fund-ability',
        targetSolutionId: 'fund-ability',
      },
      {
        id: 'art-2-3',
        subheading: 'Valuation Benchmarks & DCF Multiples',
        keyTakeaway: 'Valuations must be defended with sensitivity matrices across Bear, Base, and Bull cases.',
        content: 'Early-stage software and recurring service valuations in South Africa and EMEA benchmark between 4.0x and 7.5x annual recurring revenue (ARR). Discounted Cash Flow (DCF) models for high-risk ventures require weighted average cost of capital (WACC) between 18% and 24% and terminal growth within 2.5% to 3.5%.',
        frameworkRule: 'Present 3 scenario outcomes (Bear -25%, Base, Bull +35%) to institutional investors.',
        suggestedAction: 'Open valuation matrix in bizzmodel',
        targetSolutionId: 'bizzmodel',
      },
      {
        id: 'art-2-4',
        subheading: 'Cap Table Dilution & SAFE Note Conversions',
        keyTakeaway: 'Stacking uncapped convertible notes creates severe unexpected founder dilution.',
        content: 'Simple Agreements for Future Equity (SAFE) notes defer valuation negotiations to a priced round. However, stacking multiple SAFEs with varying valuation caps can dilute founder equity below 50% prior to Series A. Always run waterfall conversion simulations before signing follow-on notes.',
        frameworkRule: 'Retain at least 65% common equity post-Seed financing.',
        suggestedAction: 'Inspect Cap Table Waterfall in Library',
        targetSolutionId: 'sandbox-library',
      },
    ],
  },
  {
    id: 'bizzy-sec-3',
    heading: '03. OPERATIONS & ACCOUNTING DISCIPLINE',
    stageCode: 'STAGE 03',
    category: 'operations',
    summary: 'Double-entry accounting, chart of accounts standardization, and departmental budget control.',
    articles: [
      {
        id: 'art-3-1',
        subheading: 'Double-Entry Accounting Discipline (bizzmoney)',
        keyTakeaway: 'Every commercial debit must have an equal credit; intuitive bookkeeping fails investor audits.',
        content: 'The core fundamental equation of business: Assets = Liabilities + Equity. Single-entry cash bookkeeping fails due diligence audits. In bizzmoney, every customer invoice, vendor disbursement, and token allocation is mapped to structured ledger entries that reconcile with bank statements.',
        frameworkRule: 'Reconcile transaction journals weekly to prevent tax and VAT penalties.',
        suggestedAction: 'Open bizzmoney accounting journal',
        targetSolutionId: 'bizzmoney',
      },
      {
        id: 'art-3-2',
        subheading: 'Standardized 62-Account Enterprise Chart of Accounts',
        keyTakeaway: 'Structured accounts allow instant benchmarking against industry peers.',
        content: 'Bizzbean standardizes chart of accounts into clean 4-digit codes: 1000s (Current & Fixed Assets), 2000s (Current & Long-Term Liabilities), 3000s (Shareholder Equity & Retained Earnings), 4000s (Operating & Recurring Revenue), 5000s (Cost of Goods Sold), and 6000s (Operating Expenses).',
        frameworkRule: 'Standard chart of accounts is fully exportable to Google Sheets and Xero.',
        suggestedAction: 'Download Chart of Accounts in Library',
        targetSolutionId: 'sandbox-library',
      },
      {
        id: 'art-3-3',
        subheading: 'Departmental Budget Variance & Alert Triggers (bizzbudget)',
        keyTakeaway: 'A budget is a commitment; unmonitored variance over ±5% burns runway.',
        content: 'Track monthly budget allocations against actual spend across Engineering, Marketing, Operations, and Administration. When actual expenses exceed budget by more than 5%, bizzbudget automatically triggers variance alerts and prompts GIM coaching intervention.',
        frameworkRule: 'Cap overhead variance at ±5% per monthly reporting cycle.',
        suggestedAction: 'Review variance ledger in bizzbudget',
        targetSolutionId: 'bizzbudget',
      },
      {
        id: 'art-3-4',
        subheading: 'Cash Conversion Cycle & Debtor Acceleration',
        keyTakeaway: 'Cash trapped in unpaid 60-day invoices is capital you cannot reinvest.',
        content: 'Cash Conversion Cycle (CCC) measures days from cash outlay for supplies to cash collection from clients: CCC = Days Inventory + Days Sales Outstanding (DSO) - Days Payable Outstanding (DPO). Shorten DSO by offering early payment discounts (2/10 net 30) and enforcing automatic milestone billing.',
        frameworkRule: 'Maintain DSO under 35 days for sustainable B2B operations.',
        suggestedAction: 'Check working capital status in operations',
        targetSolutionId: 'operations',
      },
    ],
  },
  {
    id: 'bizzy-sec-4',
    heading: '04. SUSTAIN-ABILITY & MARGIN OPTIMIZATION',
    stageCode: 'STAGE 04',
    category: 'sustain-ability',
    summary: 'Systematic overhead trimming, vendor terms re-negotiation, and break-even velocity.',
    articles: [
      {
        id: 'art-4-1',
        subheading: 'Overhead Trimming & Vendor Re-negotiation (bizzoptimizer)',
        keyTakeaway: 'Trimming 15% of non-essential OpEx extends runway by 3.5 months without raising capital.',
        content: 'Recurring SaaS subscriptions, duplicate software seats, and unreviewed cloud hosting charges accumulate silently. The bizzoptimizer module isolates redundant operational expenses and benchmarks vendor contracts against standard commercial rates.',
        frameworkRule: 'Conduct quarterly contract reviews; extend payment terms from 30 to 60 days.',
        suggestedAction: 'Launch bizzoptimizer trimmer',
        targetSolutionId: 'bizzoptimizer',
      },
      {
        id: 'art-4-2',
        subheading: 'Downside Contingency & Emergency Refinancing Thresholds',
        keyTakeaway: 'A founder who waits for zero cash to pivot has already run out of options.',
        content: 'Establish three explicit refinancing trigger levels: Green (Runway > 14 months, normal growth investment), Amber (Runway 8-14 months, freeze discretionary hiring, begin bridge rounds), Red (Runway < 8 months, execute reduction-in-force, transition to cash-flow positive baseline).',
        frameworkRule: 'Never let cash balance drop below 3 months of basic operational expenses.',
        suggestedAction: 'Model downside triggers in sustain-runway',
        targetSolutionId: 'sustain-runway',
      },
      {
        id: 'art-4-3',
        subheading: 'Gross Margin Stress Testing & Inflation Insulation',
        keyTakeaway: 'If your supplier raises prices by 10%, does your venture remain profitable?',
        content: 'Stress test your cost structure against currency depreciation (e.g. Rand to USD exchange volatility) and supplier price hikes. High-margin software ventures enjoy 75%-85% gross margins, whereas tech-enabled services operate at 45%-60%. Price your services to maintain margin resilience.',
        frameworkRule: 'Build an automatic annual price escalation clause (CPI + 3%) into client agreements.',
        suggestedAction: 'Stress test gross margins in bizzcalc',
        targetSolutionId: 'bizzcalc',
      },
    ],
  },
  {
    id: 'bizzy-sec-5',
    heading: '05. INVEST-ABILITY & DUE DILIGENCE READINESS',
    stageCode: 'STAGE 05',
    category: 'invest-ability',
    summary: 'Virtual Data Room governance, institutional audit compliance, and POPIA privacy.',
    articles: [
      {
        id: 'art-5-1',
        subheading: 'Virtual Data Room (VDR) Folder Partitioning',
        keyTakeaway: 'Scattered Dropbox links repel institutional capital; organized VDRs build trust.',
        content: 'An institutional Virtual Data Room (VDR) organizes venture records into six secure categories: 01_Corporate Governance (MOI, CIPC registration, cap table), 02_Financial Records (audited financials, 3-statement model), 03_Legal & Contracts (material customer agreements, vendor SLAs), 04_Intellectual Property (patents, code assignment), 05_Human Capital (employment agreements), 06_Regulatory Compliance (tax clearance, POPIA).',
        frameworkRule: 'Keep data room synchronised directly with Google Drive with role-based access.',
        suggestedAction: 'Inspect VDR structure in invest-vdr',
        targetSolutionId: 'invest-vdr',
      },
      {
        id: 'art-5-2',
        subheading: '40-Item Due Diligence Readiness Checklist',
        keyTakeaway: 'Surprise compliance gaps kill deals at the eleventh hour.',
        content: 'Before scheduling partner meetings with institutional investors, verify all 40 checklist items: tax compliance status certificates, CIPC annual returns, signed shareholder agreements, customer reference permissions, and audited bank reconciliation sheets.',
        frameworkRule: 'Audit and update all compliance items at the end of each financial quarter.',
        suggestedAction: 'Download VDR Checklist in Library',
        targetSolutionId: 'sandbox-library',
      },
      {
        id: 'art-5-3',
        subheading: 'Intellectual Property Assignment & Cap Table Audit',
        keyTakeaway: 'Code or content developed without signed proprietary IP assignment belongs to the contractor.',
        content: 'Every founder, employee, and external software contractor must sign a comprehensive Intellectual Property Assignment Agreement prior to line-one code commits. Institutional VCs will not fund companies where IP ownership is legally contested.',
        frameworkRule: '100% of founder and contractor IP must be assigned to the legal corporate entity.',
        suggestedAction: 'Consult Coach GIM on IP Governance',
        targetSolutionId: 'dialogue',
      },
      {
        id: 'art-5-4',
        subheading: 'POPIA & Enterprise Data Privacy Compliance',
        keyTakeaway: 'Enterprise customers will not sign contracts without certified privacy standards.',
        content: 'South Africa Protection of Personal Information Act (POPIA) and international GDPR require documented data storage policies, encryption at rest, and explicit client consent logs. Maintain a registered Information Officer and audited cloud privacy terms.',
        frameworkRule: 'Encrypt all member transaction journals and data room files using AES-256 standard.',
        suggestedAction: 'Review POPIA policy registry in CMS',
        targetSolutionId: 'about-bizzbean',
      },
    ],
  },
  {
    id: 'bizzy-sec-6',
    heading: '06. BIZZY APP-PAGE TOOLTIPS & PROMPT GUIDES',
    stageCode: 'PROMPTS',
    category: 'guides',
    summary: 'Interactive contextual learning guides embedded across each bizz-DESK tool.',
    articles: [
      {
        id: 'art-6-1',
        subheading: 'vi-ABILITY Guidance: CAC Input Prompt',
        keyTakeaway: 'Element #cac-input guide: Blended vs Paid breakdown.',
        content: 'Ensure your CAC includes all sales salaries, software licenses, onboarding costs, and paid marketing channels. Never report blended CAC without specifying the paid acquisition cost separately.',
        frameworkRule: 'Prompt guidance for /workarea/vi-ability',
        suggestedAction: 'Open vi-ability work area',
        targetSolutionId: 'vi-ability',
      },
      {
        id: 'art-6-2',
        subheading: 'fund-ABILITY Guidance: Runway Dial Thresholds',
        keyTakeaway: 'Element #runway-dial guide: The 18-month buffer.',
        content: 'Maintaining an 18-month cash buffer keeps you from negotiating term sheets out of desperation. Venture capital fundraising cycles take 6 to 9 months on average.',
        frameworkRule: 'Prompt guidance for /workarea/fund-ability',
        suggestedAction: 'Open fund-ability work area',
        targetSolutionId: 'fund-ability',
      },
      {
        id: 'art-6-3',
        subheading: 'bizzmoney Guidance: Double-Entry Journaling',
        keyTakeaway: 'Element #ledger-journal guide: Equal debit and credit.',
        content: 'Every commercial debit must have an equal credit. Assets = Liabilities + Equity. Record all vendor bills and customer collections as double-entry ledger entries.',
        frameworkRule: 'Prompt guidance for /workarea/bizzmoney',
        suggestedAction: 'Open bizzmoney work area',
        targetSolutionId: 'bizzmoney',
      },
    ],
  },
];
