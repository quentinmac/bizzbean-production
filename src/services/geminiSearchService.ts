export interface SearchMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  sources?: string[];
}

export interface SearchThread {
  id: string;
  title: string;
  memberEmail: string;
  createdAt: string;
  updatedAt: string;
  messages: SearchMessage[];
}

// Initial member thread state with clean empty message log for data submission testing & simulation
export const INITIAL_MEMBER_SEARCH_THREADS: SearchThread[] = [
  {
    id: 'thread-active',
    title: 'New Venture Inquiry',
    memberEmail: 'founder@bizzbean.com',
    createdAt: 'Ready',
    updatedAt: 'Ready',
    messages: [], // Clean empty state enabling full submission testing
  },
];

// Grounded simulation synthesis for data submission testing & instant venture insights
export function generateLocalGeminiResponse(query: string): { text: string; sources: string[] } {
  const q = query.toLowerCase();

  if (q.includes('cac') || q.includes('customer acquisition') || q.includes('payback')) {
    return {
      text: `**Gemini Search Grounding: Customer Acquisition Cost (CAC) & Payback Velocity**

1. **Mathematical Formula**:
   \`CAC = Total Sales & Marketing Costs / New Customers Acquired\`
   \`Payback Period = CAC / (Monthly ARPU × Gross Margin %)\`

2. **Institutional Benchmarks**:
   • Target Payback: < 8 months for early venture, < 12 months for mature enterprise.
   • LTV : CAC Ratio: Minimum 3.0x to 4.5x for venture sustainability.

3. **Bizzbean Workstation Application**:
   Audit assumptions directly inside **vi-ability (bizzcalc)**. Differentiate blended CAC from paid-acquisition CAC to isolate conversion leakage.`,
      sources: ['vi-ABILITY Unit Economics Standard', 'Bizzcalc Sensitivity Engine', 'Venture Financial Governance'],
    };
  }

  if (q.includes('runway') || q.includes('burn') || q.includes('cash')) {
    return {
      text: `**Gemini Search Grounding: 18-Month Cash Runway Safeguard**

1. **Mathematical Formula**:
   \`Runway (Months) = Available Cash Reserves / Net Monthly Burn\`
   Where:
   • *Net Monthly Burn* = Total Operating Expenses (OpEx) - Net Contribution Margin.

2. **Milestone Triggers**:
   • **Green (> 14 Months)**: Aggressive milestone execution in Stage 01 validation & Stage 02 growth.
   • **Amber (8 to 14 Months)**: Freeze non-essential OpEx; commence institutional investor introductory discussions.
   • **Red (< 8 Months)**: Emergency preservation protocol; trigger vendor terms renegotiation in **bizzoptimizer**.

3. **Takeaway for Bizzbean Workstation**:
   Link your runway dial directly with your **bizzmodel** 3-statement forecast to audit cash conversion cycles weekly.`,
      sources: ['fund-ABILITY Cash Runway Safeguards', 'bizzoptimizer OpEx Benchmarks', 'Venture Runway Handbook v2.0'],
    };
  }

  if (q.includes('price') || q.includes('pricing') || q.includes('break-even') || q.includes('margin') || q.includes('calc')) {
    return {
      text: `**Gemini Search Grounding: Pricing Strategy & Contribution Margin Floor**

1. **Break-Even Volume Formula**:
   \`Break-Even (Units) = Total Fixed Overheads / (Unit Selling Price - Unit Variable Cost)\`
   \`Contribution Margin % = ((Selling Price - Variable Cost) / Selling Price) × 100\`

2. **Institutional Pricing Disciplines**:
   • Ensure gross contribution margin exceeds **65% for software/digital products** and **40% for managed services**.
   • Factor a 15% VAT provision on South African and statutory EMEA commercial invoicing.

3. **Bizzbean Workstation Application**:
   Test scenario fluctuations in **bizzcalc** (Startup Stage: vi-ability) to verify pricing power under variable inflation and cost escalation.`,
      sources: ['vi-ABILITY Pricing Engine', 'Bizzcalc Viability Matrix', 'IFRS Margin Governance'],
    };
  }

  if (q.includes('chart of accounts') || q.includes('accounting') || q.includes('bizzmoney') || q.includes('ledger')) {
    return {
      text: `**Gemini Search Grounding: Standard 62-Account Enterprise Ledger**

1. **Account Structure**:
   • **1000s - Assets**: Cash, bank accounts, trade receivables, equipment, intellectual property.
   • **2000s - Liabilities**: Accounts payable, VAT payable, accrued expenses, loans.
   • **3000s - Equity**: Ordinary share capital, founder contributions, retained earnings.
   • **4000s - Revenue**: Software subscriptions, professional advisory, token grants.
   • **5000s - Cost of Sales**: Cloud server hosting, payment gateway processing, direct fulfillment.
   • **6000s - Operating Expenses**: Engineering salaries, marketing ad spend, legal, rent.

2. **Audit Rule**:
   Every debit must match an equal credit (Assets = Liabilities + Equity). Reconcile in **bizzmoney** to maintain audit readiness.`,
      sources: ['bizzmoney Standard Chart of Accounts', 'IFRS for SMEs Accounting Standards'],
    };
  }

  if (q.includes('valuation') || q.includes('dcf') || q.includes('multiple') || q.includes('equity') || q.includes('wacc')) {
    return {
      text: `**Gemini Grounded Synthesis: Early-Stage Venture Valuation Modeling**

1. **WACC Discount Rate**:
   Benchmark between **18% - 24%** for early-stage ventures to compensate for equity execution hurdles.
2. **Terminal Growth Rate**:
   Restrict to **2.5% - 3.5%** (aligned with long-term inflation targets) to avoid terminal value distortion.
3. **Revenue Multiples**:
   Enterprise software and recurring contracts benchmark between **4.5x - 7.0x ARR**, subject to net revenue retention > 105%.

*Recommendation*: Present 3 scenarios (Bear, Base, Bull) using the **bizzmodel** valuation sensitivity sheet.`,
      sources: ['EMEA Venture Capital Benchmarks 2026', 'Bizzmodel DCF Sensitivity Engine'],
    };
  }

  if (q.includes('token') || q.includes('tokens') || q.includes('compute') || q.includes('payfast') || q.includes('payment')) {
    return {
      text: `**Gemini Search Grounding: Bizzbean Compute Tokens & PayFast Gateway**

1. **Token Architecture**:
   • BizzTokens represent institutional compute capacity across financial simulators, scenario stress-tests, and grounded search synthesis.
   • Token balances are decremented deterministically upon complex modeling execution.

2. **Payment Gateway Integration**:
   • PayFast delivers 3D-Secure 2.0 card processing, Instant EFT, and Masterpass transactions in ZAR.
   • Verification callback securely confirms ITN payloads before crediting tokens or activating solution modules.

3. **Administration Audit**:
   All token allocations and PayFast receipts log directly into the Administration Centre's Transaction Journal.`,
      sources: ['PayFast Integration Protocol v2', 'Bizzbean Tokenomics Architecture'],
    };
  }

  if (q.includes('popia') || q.includes('privacy') || q.includes('compliance') || q.includes('vdr')) {
    return {
      text: `**Gemini Search Grounding: POPIA Compliance & Institutional VDR Security**

1. **Information Officer**:
   Must be formally registered with the South African Information Regulator.
2. **Data Minimization & Encryption**:
   All member financial records and transaction journals must be encrypted with AES-256 standards.
3. **VDR Role Partitioning**:
   Segment investor access into clean partitioned folders (Corporate, Financials, IP, Legal).

*Bizzbean Insight*: Check the **SANDBOX LIBRARY** in your centre panel for the complete 40-item Due Diligence Checklist template.`,
      sources: ['Protection of Personal Information Act (POPIA)', 'Bizzbean Virtual Data Room Protocol'],
    };
  }

  // Universal grounded response tailored to any query
  return {
    text: `**Gemini Grounded Simulation for "${query}"**

Within the Bizzbean ecosystem, this inquiry directly interfaces with your venture's progression across the 4 stages:

1. **Quantitative Grounding**:
   Ensure all mathematical assumptions (CAC, Churn, Payback, Contribution Margin) are modeled with defensible customer evidence and tested in your **bizzcalc** / **bizzmodel** sheets.

2. **Operational Safeguard**:
   Assess whether this decision impacts your 18-month cash runway or monthly net burn velocity.

3. **Institutional Readiness**:
   Maintain documentation in your Virtual Data Room to withstand partner scrutiny during investor due diligence.

*Coach Recommendation*: Discuss this inquiry with Coach GIM in the **DIALOGUE** tab for tailored Socratic exploration.`,
    sources: ['Bizzbean Ecosystem Grounded Knowledge Base', 'Gemini Multi-Stage Venture Synthesis', 'Venture Financial Governance'],
  };
}

export async function executeGeminiSearch(
  query: string,
  memberEmail: string,
  memberName: string,
  threadHistory: SearchMessage[] = []
): Promise<{ text: string; sources: string[] }> {
  // Try live server API proxy if available
  try {
    const res = await fetch('/api/gemini/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        memberEmail,
        memberName,
        threadHistory,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.answer) {
        return {
          text: data.answer,
          sources: data.sources || ['Gemini Grounded Live Engine', 'Bizzbean Ecosystem Benchmarks'],
        };
      }
    }
  } catch (err) {
    // Graceful fallback to simulated grounded response
  }

  // Realistic simulation processing delay (800ms) to allow data submission testing with visible loading indicator
  await new Promise((resolve) => setTimeout(resolve, 800));

  return generateLocalGeminiResponse(query);
}
