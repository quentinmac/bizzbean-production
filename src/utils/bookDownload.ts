/**
 * Book Download Utility for "Getting to Value" by Quentin G. McCullough
 * Resolves the real .zip bundle from the server / deployed public downloads first,
 * then checks local IndexedDB (auto-syncing to server if needed), and only falls back
 * to the curated founder manuscript .txt if no .zip bundle exists anywhere.
 */

import { idbGet } from './imageStorage';

export interface ServerBookBundleMeta {
  exists: boolean;
  fileName?: string;
  fileSize?: string;
  sizeBytes?: number;
  uploadedAt?: string;
  url?: string;
}

/**
 * Verifies a Blob actually starts with the standard ZIP local-file magic bytes ("PK" = 0x50 0x4B)
 * so an HTML 404 or error response can never masquerade as a ZIP download.
 */
async function isValidZipBlob(blob: Blob): Promise<boolean> {
  if (!blob || blob.size < 22) return false;
  try {
    const header = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
    return header[0] === 0x50 && header[1] === 0x4b;
  } catch {
    return false;
  }
}

function extractFileNameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf8Match = header.match(/filename\*=UTF-8''([^;\n]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }
  const plainMatch = header.match(/filename="?([^";\n]+)"?/i);
  return plainMatch?.[1]?.trim() || null;
}

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

/**
 * Fetches metadata about the server-persisted Getting to Value .zip bundle.
 */
export async function fetchBookBundleMetaFromServer(): Promise<ServerBookBundleMeta> {
  try {
    const res = await fetch('/api/cms/book-bundle/meta', { cache: 'no-store' });
    if (!res.ok) return { exists: false };
    const data = await res.json();
    return {
      exists: Boolean(data?.exists),
      fileName: data?.fileName,
      fileSize: data?.fileSize,
      sizeBytes: data?.sizeBytes,
      uploadedAt: data?.uploadedAt,
      url: data?.url,
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Persists the uploaded Getting to Value .zip bundle on the server (public/downloads/getting-to-value.zip)
 * so all visitors and future deployments serve the real .zip file.
 */
export async function uploadBookBundleToServer(
  binaryData: ArrayBuffer | Blob,
  fileName: string = 'getting to value.zip'
): Promise<{ success: boolean; fileName?: string; fileSize?: string; uploadedAt?: string; error?: string }> {
  try {
    const blob =
      binaryData instanceof Blob
        ? binaryData
        : new Blob([binaryData], { type: 'application/octet-stream' });

    if (!(await isValidZipBlob(blob))) {
      return { success: false, error: 'Selected file is not a valid ZIP archive.' };
    }

    const res = await fetch('/api/cms/book-bundle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Book-Filename': encodeURIComponent(fileName || 'getting to value.zip'),
      },
      body: blob,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      return { success: false, error: data?.error || `Server returned HTTP ${res.status}` };
    }

    return {
      success: true,
      fileName: data.fileName,
      fileSize: data.fileSize,
      uploadedAt: data.uploadedAt,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error while syncing zip bundle to server.' };
  }
}

/**
 * Removes the server-persisted Getting to Value .zip bundle.
 */
export async function deleteBookBundleFromServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/cms/book-bundle', { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function downloadGettingToValueBook(recipientName: string = 'Entrepreneur'): Promise<boolean> {
  // 1. Primary source: server-persisted & deployed public .zip bundle (works for ALL visitors on live site)
  const serverCandidates = [
    '/api/cms/book-bundle',
    '/downloads/getting-to-value.zip',
    '/getting%20to%20value.zip',
    '/getting_to_value.zip',
    '/getting-to-value.zip',
  ];

  for (const candidateUrl of serverCandidates) {
    try {
      const res = await fetch(candidateUrl, { cache: 'no-cache' });
      if (!res.ok) continue;
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('text/html')) continue;

      const blob = await res.blob();
      if (!(await isValidZipBlob(blob))) continue;

      const fileName =
        extractFileNameFromDisposition(res.headers.get('content-disposition')) ||
        'getting to value.zip';
      triggerBlobDownload(blob, fileName);
      return true;
    } catch {
      // Try next candidate
    }
  }

  // 2. Secondary source: local browser IndexedDB (uploaded in CMS Console on this browser)
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

      if (await isValidZipBlob(blob)) {
        const fileName = customZipMeta?.fileName || 'getting to value.zip';
        triggerBlobDownload(blob, fileName);

        // Opportunistically push the locally stored ZIP to the server so it becomes
        // available across deployments and all visitor browsers.
        uploadBookBundleToServer(blob, fileName).catch(() => {});
        return true;
      }
    }
  } catch (err) {
    console.warn('Error reading uploaded zip bundle, using manuscript guide:', err);
  }

  // 3. Fallback: formatted founder manuscript package (only used when no .zip exists on server or locally)
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
    triggerBlobDownload(blob, `Getting-To-Value-Quentin-G-McCullough.txt`);
    return true;
  } catch (error) {
    console.error('Error downloading Getting to Value book:', error);
    return false;
  }
}
