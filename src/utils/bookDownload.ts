/**
 * Book Download Utility for "Getting to Value" by Quentin G. McCullough
 * Generates and triggers instant browser download of the foundational entrepreneurial guide.
 * Supports custom .zip bundles uploaded via CMS Console, falling back to the curated manuscript guide.
 */

import { idbGet } from './imageStorage';

export async function downloadGettingToValueBook(recipientName: string = 'Entrepreneur'): Promise<boolean> {
  // 1. Check if the administrator has uploaded a custom getting to value .zip in the CMS Console
  try {
    const customZipBinary = await idbGet<Blob | ArrayBuffer | string>('bizzdesk_book_bundle_zip_v1');
    let customZipMeta: { fileName?: string; fileSize?: string } | null = null;
    try {
      const metaRaw = localStorage.getItem('bizzdesk_book_bundle_zip_meta_v1');
      if (metaRaw) customZipMeta = JSON.parse(metaRaw);
    } catch (_) {}

    if (customZipBinary) {
      let blob: Blob;
      if (customZipBinary instanceof Blob) {
        blob = customZipBinary;
      } else if (customZipBinary instanceof ArrayBuffer) {
        blob = new Blob([customZipBinary], { type: 'application/zip' });
      } else if (typeof customZipBinary === 'string') {
        if (customZipBinary.startsWith('data:')) {
          const res = await fetch(customZipBinary);
          blob = await res.blob();
        } else {
          blob = new Blob([customZipBinary], { type: 'application/zip' });
        }
      } else {
        blob = new Blob([customZipBinary as any], { type: 'application/zip' });
      }

      const fileName = customZipMeta?.fileName || 'getting_to_value.zip';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return true;
    }
  } catch (err) {
    console.warn('Error reading uploaded zip bundle, using manuscript guide:', err);
  }

  // 2. Fallback: formatted founder manuscript package
  const title = "GETTING TO VALUE: The Foundational Blueprint for Entrepreneurial ABILITY";
  const author = "Quentin G. McCullough";
  const date = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

  const bookContent = `================================================================================
${title}
Author: ${author}
Published by: Bizzbean Publishing & Ventures
Edition: Illuminated Sandbox Founder Edition
Date: ${date}
Prepared for: ${recipientName}
Creed: "instant viability. infinite wisdom. always on."
================================================================================

TABLE OF CONTENTS
--------------------------------------------------------------------------------
1. INTRODUCTION: THE ILLUMINATED SANDBOX
2. PILLAR I: VI-ABILITY & UNIT ECONOMICS
   - The Minimum Viable Margin Floor (>= 65% for software; >= 38% for operations)
   - LTV to CAC Ratio Discipline (LTV : CAC >= 3.2x)
   - Cash Payback Period Under 8 Months
3. PILLAR II: FUND-ABILITY & FINANCIAL COHERENCE
   - The 3-Statement Integration Loop
   - DCF Modeling Without Formula Breakage
   - Macro-Free Spreadsheet Architecture
4. PILLAR III: SUSTAIN-ABILITY & RUNWAY SAFEGUARDS
   - The Mandatory 18-Month Cash Runway Baseline
   - Debtor Collection Lag: The Lethal Blind Spot
   - SaaS & OpEx Optimization (bizzoptimizer)
5. PILLAR IV: INVEST-ABILITY & DUE DILIGENCE GOVERNANCE
   - Cap Table Waterfalls & Dilution Protection
   - Virtual Data Room (VDR) Structure in Google Workspace
   - 40-Point Institutional Investor Readiness Audit
6. CONCLUSION: FROM CONCEPT TO CAPITAL REINVESTMENT
--------------------------------------------------------------------------------

CHAPTER 1: INTRODUCTION - THE ILLUMINATED SANDBOX
Welcome to bizzbean. We created the Illuminated Sandbox so that founders would
never again have to navigate the perilous early stages of building a company
in darkness or rely on unverified financial intuition.

Every venture exists at the intersection of economic truth and operational velocity.
When assumptions are stress-tested against rigorous statutory math, statutory VAT
reconciliations, and unit economics, risk ceases to be an unknown variable and
becomes a managed equation.

CHAPTER 2: PILLAR I - VI-ABILITY & UNIT ECONOMICS
No business can outrun broken unit economics. Before scaling marketing spend:
- Establish your Contribution Margin floor.
- Ensure Customer Acquisition Cost (CAC) is recovered in less than 8 months of
  gross margin contribution.
- Maintain an LTV:CAC ratio above 3.2x.

CHAPTER 3: PILLAR II - FUND-ABILITY & THREE-STATEMENT INTEGRATION
Institutional capital does not invest in slide decks; it invests in the mathematical
integrity between your Income Statement, Balance Sheet, and Cash Flow. A single
unreconciled formula or broken circular reference destroys investor confidence.
The bizzbean models export directly into Google Sheets and Excel with zero macros,
ensuring you retain 100% intellectual property sovereignty.

CHAPTER 4: PILLAR III - SUSTAIN-ABILITY & RUNWAY SAFEGUARDS
The number one killer of early-stage ventures is not lack of product innovation—it is
debtor collection lag. When client payments slip from 30 to 60 days, cash runway
contracts by an average of 2.4 months. Maintain an 18-month baseline buffer and
trigger capital refinancing conversations when 9 months of runway remain.

CHAPTER 5: PILLAR IV - INVEST-ABILITY & VIRTUAL DATA ROOM (VDR)
An organized data room is your ultimate negotiation lever. Partition your VDR into
dedicated folders for Corporate Governance, Statutory Tax Clearance, Financial Audits,
Customer Contracts, and IP Assignments. Link your Google Workspace seamlessly with
bizz-DESK to maintain real-time investor synchronization.

CHAPTER 6: TALK TO US
If you have an idea for a business model-set, an educational curriculum, or a custom
operational calculator, use TALK TO US in the bizzbean top menu. We promise to
consider all submissions and collaborate on expanding the founder commons.

sincerely,
The Bizzbean Team
instant viability. infinite wisdom. always on.
================================================================================
`;

  try {
    const blob = new Blob([bookContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Getting-To-Value-Quentin-G-McCullough.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch (error) {
    console.error('Error downloading Getting to Value book:', error);
    return false;
  }
}
