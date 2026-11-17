import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded } from '../lib/firebase';
import { determineUserRole } from './firebaseAuthService';

export type PlatformHelpAppId = 'bizzcalc' | 'bizzdynamics' | 'bizzmodel' | 'rolling-forecast';

export type PlatformHelpStepId =
  | 'setup'
  | 'revenue'
  | 'employment'
  | 'opex'
  | 'fixed-assets'
  | 'funding'
  | 'reports';

export interface PlatformHelpEntry {
  title: string;
  purposeLabel: string;
  purpose: string;
  sectionHeading: string;
  bullets: string[];
  updatedAt?: string;
}

export type PlatformHelpMap = Record<PlatformHelpAppId, Record<PlatformHelpStepId, PlatformHelpEntry>>;

export const PLATFORM_HELP_APPS: Array<{
  id: PlatformHelpAppId;
  label: string;
  description: string;
}> = [
  { id: 'bizzcalc', label: 'bizzcalc', description: '12-month scenario & mobile financial calculator' },
  { id: 'bizzdynamics', label: 'bizzdynamics', description: '5-year dynamic base rate simulation & educational model' },
  { id: 'bizzmodel', label: 'bizzmodel', description: '5-year 3-statement integrated financial model' },
  { id: 'rolling-forecast', label: 'rolling forecast', description: 'stand-alone rolling forecast & prior year-end baseline' },
];

export const PLATFORM_HELP_STEPS: Array<{
  id: PlatformHelpStepId;
  num: number;
  name: string;
  icon: string;
}> = [
  { id: 'setup', num: 1, name: 'business details', icon: '/business details.jpg' },
  { id: 'revenue', num: 2, name: 'revenue calculator', icon: '/revenue calculator.jpg' },
  { id: 'employment', num: 3, name: 'employment', icon: '/employment.jpg' },
  { id: 'opex', num: 4, name: 'operating expenses', icon: '/operating expenses.jpg' },
  { id: 'fixed-assets', num: 5, name: 'fixed assets', icon: '/fixed assets.jpg' },
  { id: 'funding', num: 6, name: 'funding calculator', icon: '/funding calculator.jpg' },
  { id: 'reports', num: 7, name: 'reports', icon: '/reports.jpg' },
];

export function stepNumberToHelpStepId(stepNum: number): PlatformHelpStepId {
  const found = PLATFORM_HELP_STEPS.find((s) => s.num === stepNum);
  return found ? found.id : 'setup';
}

export const DEFAULT_PLATFORM_HELP: PlatformHelpMap = {
  bizzcalc: {
    setup: {
      title: 'business details assistance',
      purposeLabel: 'BizzCalc Purpose',
      purpose:
        'configure your business entity name, operating scenario, and calendar rhythms. the working calendar calculates productive operating days across the 12-month period.',
      sectionHeading: 'key steps & rules',
      bullets: [
        'choose an operating scenario from the four available baseline models.',
        'set your starting month and financial year (changing this resets the scenario to a clean baseline).',
        'select which weekdays your business operates.',
        'review the public holidays calendar and toggle or add custom operational holidays.',
      ],
    },
    revenue: {
      title: 'revenue calculator assistance',
      purposeLabel: 'BizzCalc Purpose',
      purpose:
        'forecast monthly turnover using daily operating revenue multiplied by productive days worked, compounded with monthly rate adjustments.',
      sectionHeading: 'key steps & rules',
      bullets: [
        'enter base daily revenue and starting gross profit margin %.',
        'dial monthly percentage rate changes to capture seasonality, marketing ramps, or scaling.',
        'review annual turnover and gross profit in the results tab.',
      ],
    },
    employment: {
      title: 'employment assistance',
      purposeLabel: 'BizzCalc Purpose',
      purpose: 'structure your team headcount and payroll costs across the operating period.',
      sectionHeading: 'key steps & rules',
      bullets: [
        'set annual salary review month and rate percentage.',
        'add positions with monthly base remuneration and headcount counts.',
        'schedule hiring start months to reflect phased team growth.',
      ],
    },
    opex: {
      title: 'operating expenses assistance',
      purposeLabel: 'BizzCalc Purpose',
      purpose: 'budget and track overhead expenses across the standard 27 operating expense accounts.',
      sectionHeading: 'key steps & rules',
      bullets: [
        'set the annual inflationary cost adjustment month and percentage.',
        'specify monthly spend and inception month for each active opex line item.',
        'monitor annual overhead run-rate and expense timing.',
      ],
    },
    'fixed-assets': {
      title: 'fixed assets assistance',
      purposeLabel: 'BizzCalc Purpose',
      purpose: 'schedule capital acquisitions and compute straight-line asset depreciation.',
      sectionHeading: 'key steps & rules',
      bullets: [
        'select standard asset categories with regulated depreciation schedules.',
        'enter unit purchase costs, quantities, and acquisition months.',
        'track original cost, accumulated depreciation, and balance sheet carrying value.',
      ],
    },
    funding: {
      title: 'funding calculator assistance',
      purposeLabel: 'BizzCalc Purpose',
      purpose: 'model working capital cycles and cash buffers to ensure liquidity.',
      sectionHeading: 'key steps & rules',
      bullets: [
        'set working capital turnover days for inventory (dio), receivables (dso), and payables (dpo).',
        'configure essential liquidity buffers including bank deposits, cash floats, and petty cash.',
        'analyze monthly working capital requirements and liquidity strain.',
      ],
    },
    reports: {
      title: 'reports assistance',
      purposeLabel: 'BizzCalc Purpose',
      purpose: 'review your integrated 12-month financial position and export executive summaries.',
      sectionHeading: 'key steps & rules',
      bullets: [
        'inspect the executive income statement and balance sheet.',
        'analyze the monthly and annual cash flow projections.',
        'review the full schedule of expenses.',
        'download your complete financial scenario in printable pdf format.',
      ],
    },
  },
  bizzdynamics: {
    setup: {
      title: 'business details assistance',
      purposeLabel: 'BizzDynamics Educational Purpose',
      purpose:
        'Configure entity operating calendars, productive trading days, and foundational business physics before dialing 5-year rate trajectories.',
      sectionHeading: 'How to Use This Page',
      bullets: [
        'Select operating weekdays and deduct statutory holidays to compute exact monthly productive days.',
        'Inspect calculated trading days across Years 1 to 5 inside the results and charts tabs.',
        'Use the Modelling Suite button at top-left anytime to see how BizzDynamics connects across BizzBean.',
      ],
    },
    revenue: {
      title: 'revenue calculator assistance',
      purposeLabel: 'BizzDynamics Educational Purpose',
      purpose:
        'Explore foundational revenue physics by dynamically scrubbing daily rate growth, volume capacity, and gross margin rates over 5 years.',
      sectionHeading: 'How to Use the Base Rate Adjustment Tool',
      bullets: [
        'In the assumptions tab, click any radio button alongside a revenue base rate.',
        'Use the 1 – 5 Year Slider at the bottom of the page to scrub across Years 1 to 5.',
        'Edit any of the 12 month cells or click the microphone icon for voice adjustments (e.g. "set month 4 to 5%").',
      ],
    },
    employment: {
      title: 'employment assistance',
      purposeLabel: 'BizzDynamics Educational Purpose',
      purpose:
        'Test payroll leverage, annual salary escalation rhythms, and staged hiring across a 60-month operating horizon.',
      sectionHeading: 'How to Use the Base Rate Adjustment Tool',
      bullets: [
        'Select any employment base rate radio button in assumptions to bind the bottom adjustment console.',
        'Adjust annual escalation percentages and phased staffing timing across Years 1 to 5.',
        'Switch to results and charts to observe payroll as a percentage of turnover.',
      ],
    },
    opex: {
      title: 'operating expenses assistance',
      purposeLabel: 'BizzDynamics Educational Purpose',
      purpose:
        'Simulate overhead discipline, inflationary escalations, and operating leverage across standard operating expense categories.',
      sectionHeading: 'How to Use the Base Rate Adjustment Tool',
      bullets: [
        'Select an overhead line rate in assumptions and dial monthly or annual escalation assumptions.',
        'Use the 1 – 5 Year Slider to test inflation stress scenarios across all 60 months.',
        'Review monthly OPEX totals and cost-to-revenue ratios in results and charts.',
      ],
    },
    'fixed-assets': {
      title: 'fixed assets assistance',
      purposeLabel: 'BizzDynamics Educational Purpose',
      purpose:
        'Model capital expenditure timing, productive asset capacity, and straight-line depreciation impact on earnings and asset carrying value.',
      sectionHeading: 'How to Use the Base Rate Adjustment Tool',
      bullets: [
        'Schedule CAPEX additions by category, unit value, quantity, and acquisition month.',
        'Inspect straight-line depreciation and net book value schedules in results.',
        'Compare capital intensity and asset turnover inside the charts tab.',
      ],
    },
    funding: {
      title: 'funding calculator assistance',
      purposeLabel: 'BizzDynamics Educational Purpose',
      purpose:
        'Test capital structure scenarios—comparing working capital days (DIO, DSO, DPO), equity injections, debt drawdowns, and what-if liquidity stress.',
      sectionHeading: 'How to Navigate Dynamics & What If',
      bullets: [
        'Use the dynamics tab to calibrate base working capital terms, loan rates, and equity schedules.',
        'Switch to the what if tab to stress-test cash conversion timing and capital requirements.',
        'Monitor liquidity vs. debt headroom before locking in financing decisions.',
      ],
    },
    reports: {
      title: 'reports assistance',
      purposeLabel: 'BizzDynamics Educational Purpose',
      purpose:
        'Examine the integrated 5-year Income Statement, Balance Sheet, Cash Flow, and efficiency ratios produced by your dynamic rate assumptions.',
      sectionHeading: 'How to Review Financial Outputs',
      bullets: [
        'Use the report carousel to cycle between Income Statement, Balance Sheet, Cash Flow, and Ratio tables.',
        'Verify that Assets equal Liabilities + Equity across all 5 forecast years.',
        'Return to earlier steps to tweak base rates and immediately observe ripple effects here.',
      ],
    },
  },
  bizzmodel: {
    setup: {
      title: 'business details assistance',
      purposeLabel: 'BIZZMODEL Purpose',
      purpose:
        'Comprehensive 3-statement financial simulation engine linking Income Statement, Balance Sheet, and Cash Flow.',
      sectionHeading: 'How to Navigate Steps',
      bullets: [
        'Use the 7 bottom icon buttons to move across steps (Setup, Revenue, Employment, OPEX, Assets, Funding, Reports).',
        'In Setup, configure entity profile, tax & VAT settings, financial year start, and productive operating days.',
        'Explore assumptions, results (12-month calendar and base rates), and charts using the top tabs.',
      ],
    },
    revenue: {
      title: 'revenue calculator assistance',
      purposeLabel: 'BIZZMODEL Purpose',
      purpose:
        'Comprehensive 3-statement financial simulation engine linking Income Statement, Balance Sheet, and Cash Flow.',
      sectionHeading: 'How to Navigate Steps',
      bullets: [
        'Configure products/services, unit pricing, unit cost of sales, and monthly demand volumes.',
        'Use the dynamic base rate adjustment tool to scrub years 1 to 5 and refine growth or seasonality rates.',
        'Switch between assumptions, results, and charts to verify turnover and gross profit margins.',
      ],
    },
    employment: {
      title: 'employment assistance',
      purposeLabel: 'BIZZMODEL Purpose',
      purpose:
        'Comprehensive 3-statement financial simulation engine linking Income Statement, Balance Sheet, and Cash Flow.',
      sectionHeading: 'How to Navigate Steps',
      bullets: [
        'Build your organizational chart across departments with headcount, monthly remuneration, and start dates.',
        'Set annual salary review cycles and employer contribution rates in assumptions.',
        'Review monthly payroll liabilities and headcount scaling inside results and charts.',
      ],
    },
    opex: {
      title: 'operating expenses assistance',
      purposeLabel: 'BIZZMODEL Purpose',
      purpose:
        'Comprehensive 3-statement financial simulation engine linking Income Statement, Balance Sheet, and Cash Flow.',
      sectionHeading: 'How to Navigate Steps',
      bullets: [
        'Map operating overhead accounts across Chart of Accounts categories with fixed or revenue-linked escalation.',
        'Use the dynamic base rate adjustment tool to adjust annual cost inflation across Years 1 to 5.',
        'Inspect detailed monthly expense schedules in results and category breakdowns in charts.',
      ],
    },
    'fixed-assets': {
      title: 'fixed assets assistance',
      purposeLabel: 'BIZZMODEL Purpose',
      purpose:
        'Comprehensive 3-statement financial simulation engine linking Income Statement, Balance Sheet, and Cash Flow.',
      sectionHeading: 'How to Navigate Steps',
      bullets: [
        'Schedule capital asset purchases, useful life periods, and acquisition months across Years 1 to 5.',
        'Depreciation automatically feeds the Income Statement while CAPEX cash outflows update Cash Flow and Balance Sheet NBV.',
        'Audit carrying value roll-forwards in the results tab.',
      ],
    },
    funding: {
      title: 'funding calculator assistance',
      purposeLabel: 'BIZZMODEL Purpose',
      purpose:
        'Comprehensive 3-statement financial simulation engine linking Income Statement, Balance Sheet, and Cash Flow.',
      sectionHeading: 'How to Navigate Steps',
      bullets: [
        'Use the 7 bottom icon buttons to move across steps (Setup, Revenue, Employment, OPEX, Assets, Funding, Reports).',
        'In Funding, calibrate working capital days (DIO, DSO, DPO), shareholder loans, commercial debt terms, and equity injections.',
        'Compare base assumptions in dynamics against liquidity scenarios in what if.',
      ],
    },
    reports: {
      title: 'reports assistance',
      purposeLabel: 'BIZZMODEL Purpose',
      purpose:
        'Comprehensive 3-statement financial simulation engine linking Income Statement, Balance Sheet, and Cash Flow.',
      sectionHeading: 'How to Navigate Reports & BizzPlan',
      bullets: [
        'Inspect monthly and 5-year annual Income Statement, Balance Sheet, and Cash Flow statements.',
        'Verify executive ratios, break-even metrics, and balance sheet reconciliation checks.',
        'Switch to bizzplan or pitch deck in the top bar once numbers are finalized.',
      ],
    },
  },
  'rolling-forecast': {
    setup: {
      title: 'business details assistance',
      purposeLabel: 'ROLLING FORECAST Purpose',
      purpose:
        'Stand-alone rolling forecast engine with 1-product unit sales model-set, cost-as-a-percentage-of-revenue calculations, and prior year-end balance sheet baseline inputs.',
      sectionHeading: 'How to Navigate Steps',
      bullets: [
        'Use the 7 bottom icon buttons to move across steps (Setup, Revenue, Employment, OPEX, Assets, Funding, Reports).',
        'In Setup, confirm your active entity details and rolling forecast commencement month.',
        'Enter prior year-end closing balances accurately so Year 1 opening Cash, AR, Inventory, AP, and Equity roll forward seamlessly.',
      ],
    },
    revenue: {
      title: 'revenue calculator assistance',
      purposeLabel: 'ROLLING FORECAST Purpose',
      purpose:
        'Stand-alone rolling forecast engine with 1-product unit sales model-set, cost-as-a-percentage-of-revenue calculations, and prior year-end balance sheet baseline inputs.',
      sectionHeading: 'How to Model Rolling Revenue',
      bullets: [
        'Model your primary 1-product / blended unit selling price and monthly unit volume trajectory.',
        'Use the dynamic base rate adjustment tool to scrub years 1 to 5 and dial price or volume growth rates.',
        'Compare projected rolling revenue and gross margin in results and charts.',
      ],
    },
    employment: {
      title: 'employment assistance',
      purposeLabel: 'ROLLING FORECAST Purpose',
      purpose:
        'Stand-alone rolling forecast engine with 1-product unit sales model-set, cost-as-a-percentage-of-revenue calculations, and prior year-end balance sheet baseline inputs.',
      sectionHeading: 'How to Navigate Steps',
      bullets: [
        'Configure payroll as a percentage of revenue or fixed base salaries aligned with your prior-period run rate.',
        'Adjust annual salary escalation assumptions using the dynamic rate controls.',
        'Verify payroll ratio stability across all forecast quarters in results.',
      ],
    },
    opex: {
      title: 'operating expenses assistance',
      purposeLabel: 'ROLLING FORECAST Purpose',
      purpose:
        'Stand-alone rolling forecast engine with 1-product unit sales model-set, cost-as-a-percentage-of-revenue calculations, and prior year-end balance sheet baseline inputs.',
      sectionHeading: 'How to Navigate Steps',
      bullets: [
        'Review operating overhead drivers expressed as percentages of revenue or monthly fixed run-rates.',
        'Adjust variable and semi-fixed expense percentages across Years 1 to 5.',
        'Inspect EBITDA margin resilience inside the results and charts views.',
      ],
    },
    'fixed-assets': {
      title: 'fixed assets assistance',
      purposeLabel: 'ROLLING FORECAST Purpose',
      purpose:
        'Stand-alone rolling forecast engine with 1-product unit sales model-set, cost-as-a-percentage-of-revenue calculations, and prior year-end balance sheet baseline inputs.',
      sectionHeading: 'How to Navigate Steps',
      bullets: [
        'Record opening Net Book Value from your prior year-end Balance Sheet alongside planned replacement CAPEX.',
        'Monitor ongoing depreciation charges and closing carrying values by year.',
        'Verify CAPEX impact on free cash flow in the Reports step.',
      ],
    },
    funding: {
      title: 'funding calculator assistance',
      purposeLabel: 'ROLLING FORECAST Purpose',
      purpose:
        'Stand-alone rolling forecast engine with 1-product unit sales model-set, cost-as-a-percentage-of-revenue calculations, and prior year-end balance sheet baseline inputs.',
      sectionHeading: 'How to Navigate Steps',
      bullets: [
        'Use the 7 bottom icon buttons to move across steps (Setup, Revenue, Employment, OPEX, Assets, Funding, Reports).',
        'Verify opening working capital, debt balances, and loan repayment profiles carried from prior year-end.',
        'Test covenant headroom and working capital cash buffers inside dynamics and what if.',
      ],
    },
    reports: {
      title: 'reports assistance',
      purposeLabel: 'ROLLING FORECAST Purpose',
      purpose:
        'Stand-alone rolling forecast engine with 1-product unit sales model-set, cost-as-a-percentage-of-revenue calculations, and prior year-end balance sheet baseline inputs.',
      sectionHeading: 'How to Review Rolling Statements',
      bullets: [
        'Examine rolling Income Statement, Balance Sheet, and Cash Flow statements anchored to your opening trial balances.',
        'Check variance against liquidity buffers and debt service coverage.',
        'Update prior-year closing inputs anytime to re-baseline your entire 5-year trajectory.',
      ],
    },
  },
};

const STORAGE_KEY = 'bizzbean_platform_help_v1';
const FIRESTORE_COLLECTION = 'site_content';
const FIRESTORE_DOC_ID = 'platform_app_help';
export const PLATFORM_HELP_UPDATED_EVENT = 'bizzbean_platform_help_updated';

enum OperationType {
  GET = 'get',
  WRITE = 'write',
}

function logFirestoreError(error: unknown, operationType: OperationType, path: string): void {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
    },
  };
  console.warn('Firestore help screen operation notice:', JSON.stringify(errInfo));
}

function cloneEntry(entry: PlatformHelpEntry): PlatformHelpEntry {
  return {
    title: entry.title,
    purposeLabel: entry.purposeLabel,
    purpose: entry.purpose,
    sectionHeading: entry.sectionHeading,
    bullets: Array.isArray(entry.bullets) ? [...entry.bullets] : [],
    ...(entry.updatedAt ? { updatedAt: entry.updatedAt } : {}),
  };
}

export function cloneDefaultPlatformHelp(): PlatformHelpMap {
  const result = {} as PlatformHelpMap;
  for (const app of PLATFORM_HELP_APPS) {
    result[app.id] = {} as Record<PlatformHelpStepId, PlatformHelpEntry>;
    for (const step of PLATFORM_HELP_STEPS) {
      result[app.id][step.id] = cloneEntry(DEFAULT_PLATFORM_HELP[app.id][step.id]);
    }
  }
  return result;
}

function mergeHelpWithDefaults(raw: unknown): PlatformHelpMap {
  const merged = cloneDefaultPlatformHelp();
  if (!raw || typeof raw !== 'object') return merged;

  const source = raw as Partial<Record<string, Partial<Record<string, Partial<PlatformHelpEntry>>>>>;
  for (const app of PLATFORM_HELP_APPS) {
    const appData = source[app.id];
    if (!appData || typeof appData !== 'object') continue;
    for (const step of PLATFORM_HELP_STEPS) {
      const entry = appData[step.id];
      if (!entry || typeof entry !== 'object') continue;
      const fallback = merged[app.id][step.id];
      merged[app.id][step.id] = {
        title: typeof entry.title === 'string' && entry.title.trim() ? entry.title : fallback.title,
        purposeLabel:
          typeof entry.purposeLabel === 'string' && entry.purposeLabel.trim()
            ? entry.purposeLabel
            : fallback.purposeLabel,
        purpose: typeof entry.purpose === 'string' && entry.purpose.trim() ? entry.purpose : fallback.purpose,
        sectionHeading:
          typeof entry.sectionHeading === 'string' && entry.sectionHeading.trim()
            ? entry.sectionHeading
            : fallback.sectionHeading,
        bullets: Array.isArray(entry.bullets)
          ? entry.bullets.map((b) => String(b)).filter((b) => b.trim().length > 0)
          : [...fallback.bullets],
        ...(typeof entry.updatedAt === 'string' && entry.updatedAt ? { updatedAt: entry.updatedAt } : {}),
      };
    }
  }
  return merged;
}

export function getCachedPlatformHelp(): PlatformHelpMap {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return mergeHelpWithDefaults(JSON.parse(stored));
      }
    }
  } catch (e) {
    console.warn('Error reading cached platform help screens:', e);
  }
  return cloneDefaultPlatformHelp();
}

export function getPlatformHelpEntry(
  appId: PlatformHelpAppId,
  stepId: PlatformHelpStepId,
  map?: PlatformHelpMap
): PlatformHelpEntry {
  const source = map || getCachedPlatformHelp();
  const appEntries = source[appId] || DEFAULT_PLATFORM_HELP[appId];
  return appEntries[stepId] || DEFAULT_PLATFORM_HELP[appId][stepId];
}

export function checkIsHelpAdmin(): boolean {
  try {
    const email =
      auth.currentUser?.email ||
      (typeof window !== 'undefined' ? localStorage.getItem('bizzbean_last_login_email') : null);
    return determineUserRole(email) === 'admin';
  } catch {
    return false;
  }
}

function persistLocalAndNotify(helpMap: PlatformHelpMap): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(helpMap));
      window.dispatchEvent(new CustomEvent(PLATFORM_HELP_UPDATED_EVENT, { detail: helpMap }));
    }
  } catch (e) {
    console.warn('Could not write platform help to localStorage:', e);
  }
}

export async function fetchPlatformHelpFromCloud(): Promise<PlatformHelpMap> {
  const cached = getCachedPlatformHelp();
  const path = `${FIRESTORE_COLLECTION}/${FIRESTORE_DOC_ID}`;

  try {
    if (!isFirestoreQuotaExceeded()) {
      const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const payload = data && typeof data.screens === 'object' ? data.screens : data;
        const merged = mergeHelpWithDefaults(payload);
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            window.dispatchEvent(new CustomEvent(PLATFORM_HELP_UPDATED_EVENT, { detail: merged }));
          }
        } catch {}
        return merged;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('resource-exhausted')) {
      setFirestoreQuotaExceeded();
    }
    logFirestoreError(err, OperationType.GET, path);
  }

  return cached;
}

export async function savePlatformHelpMap(
  nextMap: PlatformHelpMap
): Promise<{ savedLocally: boolean; syncedToCloud: boolean; error?: string }> {
  const normalized = mergeHelpWithDefaults(nextMap);
  persistLocalAndNotify(normalized);

  const path = `${FIRESTORE_COLLECTION}/${FIRESTORE_DOC_ID}`;
  if (isFirestoreQuotaExceeded()) {
    return {
      savedLocally: true,
      syncedToCloud: false,
      error: 'Saved on this browser (Firestore daily quota flag active).',
    };
  }

  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    const cleanPayload = JSON.parse(
      JSON.stringify({
        screens: normalized,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || 'admin',
      })
    );
    await setDoc(docRef, cleanPayload, { merge: true });
    return { savedLocally: true, syncedToCloud: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('resource-exhausted')) {
      setFirestoreQuotaExceeded();
    }
    logFirestoreError(err, OperationType.WRITE, path);
    return {
      savedLocally: true,
      syncedToCloud: false,
      error: msg,
    };
  }
}

export async function savePlatformHelpEntry(
  appId: PlatformHelpAppId,
  stepId: PlatformHelpStepId,
  entry: PlatformHelpEntry
): Promise<{
  map: PlatformHelpMap;
  savedLocally: boolean;
  syncedToCloud: boolean;
  error?: string;
}> {
  const current = getCachedPlatformHelp();
  const nextEntry: PlatformHelpEntry = {
    title: entry.title.trim() || DEFAULT_PLATFORM_HELP[appId][stepId].title,
    purposeLabel: entry.purposeLabel.trim() || DEFAULT_PLATFORM_HELP[appId][stepId].purposeLabel,
    purpose: entry.purpose.trim() || DEFAULT_PLATFORM_HELP[appId][stepId].purpose,
    sectionHeading: entry.sectionHeading.trim() || DEFAULT_PLATFORM_HELP[appId][stepId].sectionHeading,
    bullets: entry.bullets.map((b) => b.trim()).filter(Boolean),
    updatedAt: new Date().toISOString(),
  };
  if (nextEntry.bullets.length === 0) {
    nextEntry.bullets = [...DEFAULT_PLATFORM_HELP[appId][stepId].bullets];
  }

  const nextMap: PlatformHelpMap = {
    ...current,
    [appId]: {
      ...current[appId],
      [stepId]: nextEntry,
    },
  };

  const res = await savePlatformHelpMap(nextMap);
  return { map: nextMap, ...res };
}

export async function resetPlatformHelpEntry(
  appId: PlatformHelpAppId,
  stepId: PlatformHelpStepId
): Promise<{
  map: PlatformHelpMap;
  savedLocally: boolean;
  syncedToCloud: boolean;
  error?: string;
}> {
  const current = getCachedPlatformHelp();
  const nextMap: PlatformHelpMap = {
    ...current,
    [appId]: {
      ...current[appId],
      [stepId]: cloneEntry(DEFAULT_PLATFORM_HELP[appId][stepId]),
    },
  };
  const res = await savePlatformHelpMap(nextMap);
  return { map: nextMap, ...res };
}
