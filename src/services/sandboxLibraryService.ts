import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirestoreQuotaExceeded } from '../lib/firebase';
import { 
  SandboxDocument, 
  LibraryBriefing, 
  SandboxLibrarySubscription, 
  GroundedCitation, 
  JournalCategory, 
  SandboxSourceType, 
  StashReminder, 
  ReminderFrequency, 
  ReminderLeadTime, 
  OperationsFocusTask 
} from '../types/sandboxLibrary';

const STORAGE_KEY = 'bizzbean_sandbox_library_docs_v1';
const CATEGORIES_KEY = 'bizzbean_sandbox_library_categories_v1';
const SUBSCRIPTION_KEY = 'bizzbean_sandbox_library_sub_v1';
const BRIEFINGS_KEY = 'bizzbean_sandbox_library_briefings_v1';
const OPERATIONS_FOCUS_KEY = 'bizzbean_sandbox_operations_focus_v1';

export const DEFAULT_CATEGORIES: JournalCategory[] = [
  { id: 'cat-strategy', name: 'Strategy', color: 'sky', icon: 'PieChart', isDefault: true },
  { id: 'cat-financials', name: 'Financials', color: 'emerald', icon: 'TrendingUp', isDefault: true },
  { id: 'cat-compliance', name: 'Compliance', color: 'rose', icon: 'ShieldCheck', isDefault: true },
  { id: 'cat-market-research', name: 'Market Research', color: 'amber', icon: 'Sliders', isDefault: true },
  { id: 'cat-operations', name: 'Operations', color: 'indigo', icon: 'Briefcase', isDefault: true },
  { id: 'cat-course-notes', name: 'Course Notes', color: 'purple', icon: 'BookOpen', isDefault: true },
  { id: 'cat-media-videos', name: 'Media & Videos', color: 'cyan', icon: 'Video', isDefault: false },
  { id: 'cat-podcasts-books', name: 'Podcasts & Books', color: 'fuchsia', icon: 'Headphones', isDefault: false },
];

export const DEFAULT_OPERATIONS_FOCUS_TASKS: OperationsFocusTask[] = [
  {
    id: 'optask-1',
    slot: 1,
    title: 'Lock down raw green coffee bean supplier pricing & 30-day payment terms',
    description: 'Negotiate volume tier with local importer to protect unit contribution margin.',
    targetCompletionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'in_progress',
    priority: 'critical',
    category: 'Operations',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'optask-2',
    slot: 2,
    title: 'File bi-monthly SARS VAT201 return on eFiling to avoid penalty flags',
    description: 'Mandatory Category B cycle compliance to maintain clean Tax Clearance Status (TCS).',
    targetCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    priority: 'high',
    category: 'Compliance',
    docIdRef: 'doc-sars-compliance',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'optask-3',
    slot: 3,
    title: 'Finalize SEFA loan cash flow model verifying Debt Service Coverage > 1.35x',
    description: 'Audit 3-year capacity projections in BizzModel before submitting to funding officer.',
    targetCompletionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    priority: 'high',
    category: 'Financials',
    docIdRef: 'doc-sefa-grant-guidelines',
    updatedAt: new Date().toISOString()
  }
];

export function extractYouTubeEmbedId(urlOrText: string): string | undefined {
  if (!urlOrText) return undefined;
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
  const match = urlOrText.match(regExp);
  return match && match[1] ? match[1] : undefined;
}

export function getLeadTimeLabel(lead: ReminderLeadTime): string {
  switch (lead) {
    case 'none': return 'At time of event';
    case '1_hour': return '1 hour before';
    case '1_day': return '1 day before';
    case '3_days': return '3 days before';
    case '1_week': return '1 week before';
    case '2_weeks': return '2 weeks before';
    default: return 'At time of event';
  }
}

export function getFrequencyLabel(freq: ReminderFrequency): string {
  switch (freq) {
    case 'one_off': return 'One-off event';
    case 'daily': return 'Daily';
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
    case 'quarterly': return 'Quarterly';
    default: return 'One-off';
  }
}

export function getLeadTimeDurationMs(lead: ReminderLeadTime): number {
  switch (lead) {
    case 'none': return 0;
    case '1_hour': return 60 * 60 * 1000;
    case '1_day': return 24 * 60 * 60 * 1000;
    case '3_days': return 3 * 24 * 60 * 60 * 1000;
    case '1_week': return 7 * 24 * 60 * 60 * 1000;
    case '2_weeks': return 14 * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

export function calculateReminderState(reminder: StashReminder): {
  isDue: boolean;
  inLeadTime: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  formattedDueText: string;
  isOverdue: boolean;
} {
  if (!reminder || !reminder.enabled || !reminder.targetDate) {
    return { isDue: false, inLeadTime: false, daysRemaining: 0, hoursRemaining: 0, formattedDueText: '', isOverdue: false };
  }

  const targetDateStr = reminder.targetDate + (reminder.targetTime ? `T${reminder.targetTime}:00` : 'T09:00:00');
  const targetMs = new Date(targetDateStr).getTime();
  const nowMs = Date.now();
  const leadMs = getLeadTimeDurationMs(reminder.leadTime || 'none');
  const leadStartMs = targetMs - leadMs;

  const diffMs = targetMs - nowMs;
  const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  const hoursRemaining = Math.ceil(diffMs / (60 * 60 * 1000));

  const isOverdue = diffMs < 0;
  const isDue = diffMs <= 0 && reminder.status !== 'completed' && reminder.status !== 'dismissed';
  const inLeadTime = nowMs >= leadStartMs && reminder.status !== 'completed' && reminder.status !== 'dismissed';

  let formattedDueText = '';
  if (isOverdue) {
    formattedDueText = `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'}`;
  } else if (daysRemaining === 0) {
    formattedDueText = 'Due today';
  } else if (daysRemaining === 1) {
    formattedDueText = 'Due tomorrow';
  } else {
    formattedDueText = `Due in ${daysRemaining} days`;
  }

  return { isDue, inLeadTime, daysRemaining, hoursRemaining, formattedDueText, isOverdue };
}

export function getUpcomingReminders(docs: SandboxDocument[]): Array<{ doc: SandboxDocument; reminder: StashReminder; state: ReturnType<typeof calculateReminderState> }> {
  return docs
    .filter(d => d.reminder && d.reminder.enabled && d.reminder.status !== 'completed' && d.reminder.status !== 'dismissed')
    .map(d => ({
      doc: d,
      reminder: d.reminder!,
      state: calculateReminderState(d.reminder!)
    }))
    .filter(item => item.state.inLeadTime || item.state.isDue || item.state.isOverdue)
    .sort((a, b) => new Date(a.reminder.targetDate).getTime() - new Date(b.reminder.targetDate).getTime());
}

export const DEFAULT_LIBRARY_DOCUMENTS: SandboxDocument[] = [
  {
    id: 'doc-sars-compliance',
    title: 'SARS Small Business Corporation (SBC) Tax Exemption & Turnover Tax Rules',
    sourceType: 'policy_governance',
    sourceName: 'SARS_SBC_Tax_Guide_2025.pdf',
    category: 'Compliance',
    content: `South African Revenue Service (SARS) qualifying criteria for Small Business Corporations (SBC under Section 12E):
1. Turnover must be under R20 million per tax year.
2. All shareholders must be natural persons holding shares for their own benefit throughout the year.
3. Not more than 20% of total receipts/accruals may consist of investment income or rendering of a personal service.
4. Capital asset write-off: 100% deduction in year 1 on manufacturing plant and machinery.
5. SBC progressive sliding scale applies: 0% tax on the first R95,750 of taxable income, 7% on R95,751 - R365,000, 21% on R365,001 - R550,000, and 27% on excess above R550,000.
6. VAT Registration: Mandatory when taxable supplies exceed R1,000,000 in any consecutive 12 months. Voluntary threshold is R50,000. Category B filing is every two months.`,
    summary: 'Rules and tax rates for SARS Small Business Corporations and VAT threshold requirements.',
    whyItMatters: 'Using SBC sliding tax rates saves up to R88,000 annually compared to the flat 27% corporate rate.',
    actionStep: 'Verify shareholding is 100% natural individuals to claim Section 12E SBC tax brackets in annual returns.',
    fileSizeKb: 342,
    tags: ['SARS', 'SBC Tax', 'Section 12E', 'VAT Threshold', 'South Africa'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    tokenCost: 28,
    isPinned: true,
    reminder: {
      enabled: true,
      targetDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      targetTime: '16:00',
      frequency: 'monthly',
      leadTime: '3_days',
      note: 'Submit VAT201 return and prepare EMP201 payroll file before the 7th.',
      status: 'pending'
    }
  },
  {
    id: 'doc-sefa-grant-guidelines',
    title: 'SEFA & IDC SME Funding Criteria: Debt Service Ratios & Co-Investment Requirements',
    sourceType: 'financial_statement',
    sourceName: 'SEFA_Direct_Lending_Policy.pdf',
    category: 'Financials',
    content: `Small Enterprise Finance Agency (SEFA) and Industrial Development Corporation (IDC) loan qualification requirements:
1. Debt Service Coverage Ratio (DSCR) must be sustained at 1.35x minimum on projected cash flows.
2. Own contribution minimums: 10% to 20% depending on youth/women ownership.
3. Minimum loan: R50,000. Maximum direct lending facility: R15,000,000.
4. Required documentation: 3-year historical financials or credible financial model (BizzModel / BizzCalc), 12-month month-by-month cash flow forecast, tax clearance certificate, off-taker agreements or letters of intent.
5. Repayment holiday: Up to 6 months moratorium on capital repayments during initial commercial rollout.`,
    summary: 'Requirements for SEFA and IDC debt financing facilities and mandatory financial model ratios.',
    whyItMatters: 'Understanding the 1.35x DSCR avoids funding rejections when applying for low-interest expansion loans.',
    actionStep: 'Run cash flows through BizzModel to verify year 1 and 2 DSCR never dips below 1.35x.',
    fileSizeKb: 512,
    tags: ['SEFA', 'IDC', 'SME Funding', 'DSCR', 'Cash Flow Loan'],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    tokenCost: 35,
    isPinned: true
  },
  {
    id: 'doc-coffee-pricing-video',
    title: 'High-Margin Retail Pricing Model & Contribution Margins for Artisanal Beverage Businesses',
    sourceType: 'video_url',
    sourceName: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoEmbedId: 'dQw4w9WgXcQ',
    authorOrHost: 'Quentin McCullough',
    publicationOrShow: 'BizzBean Strategic Finance Channel',
    category: 'Strategy',
    content: `Detailed breakdown of unit margins for retail coffee and specialty food enterprises:
- Raw bean cost per kg: R220. Yield per kg: ~50 espresso shots = R4.40 per double shot.
- Fresh milk cost per drink: R3.20. Packaging (biodegradable cup, lid, sleeve): R2.80.
- Direct cost of goods sold (COGS): R10.40 per 350ml cup.
- Recommended retail pricing: R38.00 incl VAT (R33.04 net of 15% VAT).
- Unit Gross Profit: R22.64 (68.5% gross margin).
- Break-even calculation: At R45,000 fixed monthly overheads (rent, staff, utilities), required volume is 1,988 cups per month (approx 66 cups per day).`,
    summary: 'Complete recipe costing, COGS formula, and daily break-even cup metrics.',
    whyItMatters: 'Reveals the exact daily volume needed before the business clears pure operational profit.',
    actionStep: 'Compare our current supplier invoices against the R10.40 target unit COGS baseline.',
    fileSizeKb: 180,
    tags: ['Pricing Strategy', 'COGS', 'Break-even', 'Unit Economics', 'Video Guide'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tokenCost: 19,
    reminder: {
      enabled: true,
      targetDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      targetTime: '10:00',
      frequency: 'one_off',
      leadTime: '1_day',
      note: 'Renegotiate wholesale coffee bean supply agreement with roaster.',
      status: 'pending'
    }
  }
];

export async function loadSandboxLibraryDocs(uid?: string): Promise<SandboxDocument[]> {
  try {
    if (uid && !isFirestoreQuotaExceeded()) {
      const snap = await getDoc(doc(db, 'sandbox_library', uid));
      if (snap.exists() && snap.data()?.documents) {
        return snap.data().documents;
      }
    }
  } catch (err) {
    console.info('Using local cache for Sandbox Library docs:', err);
  }
  
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }
  return DEFAULT_LIBRARY_DOCUMENTS;
}

export async function persistSandboxLibraryDocs(docs: SandboxDocument[], uid?: string): Promise<void> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  try {
    if (uid && !isFirestoreQuotaExceeded()) {
      await setDoc(doc(db, 'sandbox_library', uid), {
        documents: docs,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (err) {
    console.info('Firestore save notice (local saved):', err);
  }
}

export function getLocalCategories(): JournalCategory[] {
  const local = localStorage.getItem(CATEGORIES_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }
  return DEFAULT_CATEGORIES;
}

export async function loadSandboxCategories(uid?: string): Promise<JournalCategory[]> {
  try {
    if (uid && !isFirestoreQuotaExceeded()) {
      const snap = await getDoc(doc(db, 'sandbox_categories', uid));
      if (snap.exists() && snap.data()?.categories) {
        return snap.data().categories;
      }
    }
  } catch {}
  return getLocalCategories();
}

export async function persistSandboxCategories(categories: JournalCategory[], uid?: string): Promise<void> {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  try {
    if (uid && !isFirestoreQuotaExceeded()) {
      await setDoc(doc(db, 'sandbox_categories', uid), {
        categories,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch {}
}

export function getLocalOperationsFocus(): OperationsFocusTask[] {
  const local = localStorage.getItem(OPERATIONS_FOCUS_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }
  return DEFAULT_OPERATIONS_FOCUS_TASKS;
}

export async function loadOperationsFocusTasks(uid?: string): Promise<OperationsFocusTask[]> {
  try {
    if (uid && !isFirestoreQuotaExceeded()) {
      const snap = await getDoc(doc(db, 'sandbox_operations_focus', uid));
      if (snap.exists() && snap.data()?.tasks) {
        return snap.data().tasks;
      }
    }
  } catch {}
  return getLocalOperationsFocus();
}

export async function persistOperationsFocusTasks(tasks: OperationsFocusTask[], uid?: string): Promise<void> {
  localStorage.setItem(OPERATIONS_FOCUS_KEY, JSON.stringify(tasks));
  try {
    if (uid && !isFirestoreQuotaExceeded()) {
      await setDoc(doc(db, 'sandbox_operations_focus', uid), {
        tasks,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch {}
}

export function getSubscription(): SandboxLibrarySubscription {
  const local = localStorage.getItem(SUBSCRIPTION_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }
  return {
    tierName: 'Growth Notebook',
    monthlyTokens: 25000,
    remainingTokens: 23480,
    storageMbLimit: 250,
    storageMbUsed: 28.4,
    costInTokens: 120,
    firebaseHostingPortion: 80,
    bizzbeanCommissionPortion: 20,
    activeUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isAutoRenew: true
  };
}

export function saveSubscription(sub: SandboxLibrarySubscription): void {
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(sub));
}

export function getSavedBriefings(): LibraryBriefing[] {
  const local = localStorage.getItem(BRIEFINGS_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }
  return [];
}

export function saveBriefingToHistory(briefing: LibraryBriefing): void {
  const current = getSavedBriefings();
  const updated = [briefing, ...current.slice(0, 19)];
  localStorage.setItem(BRIEFINGS_KEY, JSON.stringify(updated));
}

export async function runGroundedLibraryQA(
  query: string,
  documents: SandboxDocument[]
): Promise<{ answer: string; citations: GroundedCitation[]; tokensUsed: number }> {
  const cleanQ = query.toLowerCase();
  
  // Find relevant documents matching query keywords
  const matchedDocs = documents.filter(doc => {
    const text = `${doc.title} ${doc.content} ${doc.whyItMatters} ${doc.actionStep} ${doc.tags.join(' ')}`.toLowerCase();
    const words = cleanQ.split(/\s+/).filter(w => w.length > 2);
    return words.some(w => text.includes(w));
  });

  const docsToUse = matchedDocs.length > 0 ? matchedDocs : documents.slice(0, 3);
  const citations: GroundedCitation[] = docsToUse.map(d => ({
    docId: d.id,
    docTitle: d.title,
    snippet: d.summary || d.content.slice(0, 180) + '...',
    relevanceScore: 0.92
  }));

  const answer = `Based on your stashed references in the Sandbox Library:

• **Source Grounding**: Verified against ${docsToUse.length} documents (${docsToUse.map(d => d.title).join(', ')}).
• **Core Finding**: ${docsToUse[0]?.actionStep || 'Review the attached operational guidelines to execute your action items.'}
• **Operational Recommendation**: ${docsToUse[0]?.whyItMatters || 'Cross-reference with your financial projections in BizzModel.'}`;

  return {
    answer,
    citations,
    tokensUsed: 14
  };
}

export async function generateLibraryBriefing(
  type: LibraryBriefing['type'],
  documents: SandboxDocument[]
): Promise<LibraryBriefing> {
  const docTitles = documents.map(d => d.title).join(', ');
  const citations: GroundedCitation[] = documents.slice(0, 4).map(d => ({
    docId: d.id,
    docTitle: d.title,
    snippet: d.summary || d.content.slice(0, 160) + '...',
    relevanceScore: 0.95
  }));

  let title = 'Executive Knowledge Synthesis';
  let content = '';

  switch (type) {
    case 'executive_summary':
      title = 'Comprehensive SME Executive Briefing';
      content = `### Executive Knowledge Summary\n\nThis briefing aggregates your ${documents.length} stashed files across Compliance, Finance, and Strategy.\n\n1. **Tax & Legal Standing**: Small Business Corporation (SBC) thresholds provide favorable sliding tax rates.\n2. **Financial Covenants**: Maintain Debt Service Coverage Ratio (DSCR) above 1.35x.\n3. **Unit Margins**: Protect retail gross margins above 65%.`;
      break;
    case 'action_plan':
      title = '30-Day Operational Action Blueprint';
      content = `### 30-Day Operational Action Plan\n\n- **Week 1**: Audit natural shareholder register for Section 12E.\n- **Week 2**: Recalibrate break-even cup volume.\n- **Week 3**: Prepare SEFA cash flow schedule.\n- **Week 4**: Submit VAT201 on eFiling.`;
      break;
    case 'financial_risks':
      title = 'Financial Risk & Stress-Test Audit';
      content = `### Financial Risk Exposure Audit\n\n- **Risk 1**: Input cost inflation on raw goods eroding margin.\n- **Risk 2**: Late VAT submissions triggering automatic SARS penalties.\n- **Risk 3**: Working capital contraction during 60-day invoice lag.`;
      break;
    default:
      title = 'Operational Knowledge Digest';
      content = `Knowledge synthesis compiled from: ${docTitles}.`;
  }

  const briefing: LibraryBriefing = {
    id: `briefing-${Date.now()}`,
    title,
    type,
    generatedAt: new Date().toISOString(),
    content,
    citations,
    tokensUsed: 42
  };

  saveBriefingToHistory(briefing);
  return briefing;
}
