import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded } from '../lib/firebase';
import { ClientProfile } from '../types';
import {
  getCachedClientProfiles,
  normalizeEmail,
  safeEmailDocId,
} from './transactionJournalService';

const WELCOME_EMAIL_SENT_REGISTRY_KEY = 'bizzbean_welcome_email_sent_registry_v1';

export type OnboardingActionType = 'signup' | 'signin' | 'guest';

export type OnboardingClassification =
  | 'NEW_CLIENT_SIGNUP'
  | 'EXISTING_CLIENT_SIGNIN'
  | 'DUPLICATE_SIGNUP_BLOCKED'
  | 'GUEST_SANDBOX';

export interface ClientExistenceCheckResult {
  emailNormalized: string;
  exists: boolean;
  source: 'firestore' | 'local-directory' | 'welcome-registry' | 'none';
  existingProfile?: ClientProfile;
  welcomeEmailAlreadySent: boolean;
  welcomeEmailSentAt?: string;
}

export interface OnboardingAuditStep {
  stepNumber: number;
  gate: string;
  status: 'PASS' | 'DISPATCH' | 'SKIPPED' | 'BLOCKED' | 'PRESERVED';
  summary: string;
  detail: string;
}

export interface OnboardingDecisionReport {
  timestamp: string;
  action: OnboardingActionType;
  email: string;
  displayName: string;
  companyName: string;
  classification: OnboardingClassification;
  clientLookup: ClientExistenceCheckResult;
  shouldDispatchWelcomeEmail: boolean;
  shouldShowWelcomeLetterModal: boolean;
  shouldCreditWelcomeTokens: boolean;
  shouldUpsertNewClientRecord: boolean;
  shouldTrackGa4SignUp: boolean;
  ga4EventName: 'sign_up' | 'workspace_enter';
  steps: OnboardingAuditStep[];
}

function readWelcomeRegistry(): Record<string, string> {
  try {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(WELCOME_EMAIL_SENT_REGISTRY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeWelcomeRegistry(registry: Record<string, string>): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(WELCOME_EMAIL_SENT_REGISTRY_KEY, JSON.stringify(registry));
  } catch {}
}

/**
 * Checks whether a welcome email has already been recorded as dispatched for this email in local cache.
 */
export function hasLocalWelcomeEmailBeenSent(email: string): string | undefined {
  const norm = normalizeEmail(email);
  if (!norm) return undefined;
  const reg = readWelcomeRegistry();
  return reg[norm];
}

/**
 * Records that the "your SANDBOX is ready" welcome email has been sent to this email
 * both locally and in Cloud Firestore (`client_profiles/{email}`).
 */
export async function markWelcomeEmailDispatched(email: string): Promise<void> {
  const norm = normalizeEmail(email);
  if (!norm) return;
  const nowIso = new Date().toISOString();

  const reg = readWelcomeRegistry();
  reg[norm] = nowIso;
  writeWelcomeRegistry(reg);

  if (!isFirestoreQuotaExceeded()) {
    try {
      const docId = safeEmailDocId(norm);
      await setDoc(
        doc(db, 'client_profiles', docId),
        {
          email: norm,
          welcomeEmailSent: true,
          welcomeEmailSentAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true }
      );
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || String(err?.message || '').includes('quota')) {
        setFirestoreQuotaExceeded();
      }
      console.info('Welcome email status cloud sync notice:', err?.message || err);
    }
  }
}

/**
 * Authoritatively checks whether an email address belongs to an existing registered client
 * across: (1) Cloud Firestore `client_profiles/{email}`, (2) Local merged Client Directory,
 * and (3) Local welcome-email dispatch registry.
 */
export async function checkClientExists(email: string): Promise<ClientExistenceCheckResult> {
  const norm = normalizeEmail(email);
  if (!norm) {
    return {
      emailNormalized: '',
      exists: false,
      source: 'none',
      welcomeEmailAlreadySent: false,
    };
  }

  const localSentAt = hasLocalWelcomeEmailBeenSent(norm);
  const localProfiles = getCachedClientProfiles();
  const localMatch = localProfiles.find((c) => normalizeEmail(c.email) === norm);

  // Check Cloud Firestore client_profiles/{email} for authoritative cross-device state
  let cloudProfile: (ClientProfile & { welcomeEmailSent?: boolean; welcomeEmailSentAt?: string }) | undefined;
  if (!isFirestoreQuotaExceeded()) {
    try {
      const docId = safeEmailDocId(norm);
      const snap = await getDoc(doc(db, 'client_profiles', docId));
      if (snap.exists()) {
        const data = snap.data() as any;
        cloudProfile = {
          id: data.id || `cli-${docId.slice(0, 8)}`,
          name: data.name || norm.split('@')[0] || 'Entrepreneur',
          email: norm,
          companyName: data.companyName || 'Bizzbean Member Enterprise',
          vatNumber: data.vatNumber || undefined,
          phone: data.phone || undefined,
          city: data.city || undefined,
          country: data.country || 'South Africa',
          notes: data.notes || undefined,
          role: data.role || undefined,
          associate: data.associate || undefined,
          registeredAt: data.registeredAt || undefined,
          uid: data.uid || undefined,
          purchasedApps: Array.isArray(data.purchasedApps) ? data.purchasedApps : undefined,
          purchasedCourses: Array.isArray(data.purchasedCourses) ? data.purchasedCourses : undefined,
          welcomeEmailSent: Boolean(data.welcomeEmailSent),
          welcomeEmailSentAt: data.welcomeEmailSentAt || undefined,
        };
      }
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || String(err?.message || '').includes('quota')) {
        setFirestoreQuotaExceeded();
      }
      // Graceful fallback to local directory on offline or permission notice
    }
  }

  if (cloudProfile) {
    const sentAt = cloudProfile.welcomeEmailSentAt || localSentAt || cloudProfile.registeredAt;
    return {
      emailNormalized: norm,
      exists: true,
      source: 'firestore',
      existingProfile: cloudProfile,
      welcomeEmailAlreadySent: Boolean(cloudProfile.welcomeEmailSent || localSentAt || cloudProfile.registeredAt),
      welcomeEmailSentAt: sentAt,
    };
  }

  if (localMatch) {
    return {
      emailNormalized: norm,
      exists: true,
      source: 'local-directory',
      existingProfile: localMatch,
      welcomeEmailAlreadySent: Boolean(localSentAt || localMatch.registeredAt),
      welcomeEmailSentAt: localSentAt || localMatch.registeredAt,
    };
  }

  if (localSentAt) {
    return {
      emailNormalized: norm,
      exists: true,
      source: 'welcome-registry',
      welcomeEmailAlreadySent: true,
      welcomeEmailSentAt: localSentAt,
    };
  }

  return {
    emailNormalized: norm,
    exists: false,
    source: 'none',
    welcomeEmailAlreadySent: false,
  };
}

/**
 * Pure deterministic onboarding gate evaluator shared by BOTH live production flows
 * and the Admin Onboarding Simulation Test Lab.
 */
export function evaluateOnboardingDecision(params: {
  action: OnboardingActionType;
  email: string;
  displayName?: string;
  companyName?: string;
  clientLookup: ClientExistenceCheckResult;
  welcomeEmailAlreadyDispatchedInFlow?: boolean;
}): OnboardingDecisionReport {
  const {
    action,
    email,
    displayName = 'Entrepreneur',
    companyName = 'Bizzbean Member Enterprise',
    clientLookup,
    welcomeEmailAlreadyDispatchedInFlow = false,
  } = params;

  const cleanEmail = normalizeEmail(email);
  const cleanName = displayName.trim() || (cleanEmail ? cleanEmail.split('@')[0] : 'Guest Explorer');
  const cleanCompany = companyName.trim() || clientLookup.existingProfile?.companyName || 'Bizzbean Member Enterprise';
  const nowIso = new Date().toISOString();

  // Case 1: Guest Explorer (No Account)
  if (action === 'guest') {
    return {
      timestamp: nowIso,
      action,
      email: '',
      displayName: 'Guest Explorer',
      companyName: 'Public Sandbox',
      classification: 'GUEST_SANDBOX',
      clientLookup,
      shouldDispatchWelcomeEmail: false,
      shouldShowWelcomeLetterModal: false,
      shouldCreditWelcomeTokens: false,
      shouldUpsertNewClientRecord: false,
      shouldTrackGa4SignUp: false,
      ga4EventName: 'workspace_enter',
      steps: [
        {
          stepNumber: 1,
          gate: 'Identity & Client Registry Lookup',
          status: 'SKIPPED',
          summary: 'Public sandbox mode (no account credentials)',
          detail: 'Visitor entered via "Explore Sandbox (No Account)". Client directory lookup bypassed.',
        },
        {
          stepNumber: 2,
          gate: 'Account & Welcome Token Allocation',
          status: 'SKIPPED',
          summary: 'Guest preview state active (0 member tokens)',
          detail: 'No client profile written to Firestore or local Client Directory.',
        },
        {
          stepNumber: 3,
          gate: 'Welcome Email Gate ("your SANDBOX is ready")',
          status: 'SKIPPED',
          summary: 'No email dispatched for public guest entry',
          detail: 'SMTP welcome letter is strictly reserved for newly registered accounts.',
        },
        {
          stepNumber: 4,
          gate: 'In-App Welcome Letter Modal',
          status: 'SKIPPED',
          summary: 'Skipped — opens directly to workspace',
          detail: 'Guest lands directly inside the illuminated sandbox.',
        },
        {
          stepNumber: 5,
          gate: 'GA4 Analytics Event',
          status: 'DISPATCH',
          summary: 'Fires workspace_enter (user_type: guest)',
          detail: 'Does NOT fire sign_up so conversion reporting remains accurate.',
        },
      ],
    };
  }

  // Case 2: Existing Client Sign-In (NEVER sends welcome email, NEVER overwrites registration date)
  if (action === 'signin') {
    const existingLabel = clientLookup.exists
      ? `Matched in ${clientLookup.source === 'firestore' ? 'Cloud Firestore (client_profiles)' : 'Client Directory'} — registered ${clientLookup.existingProfile?.registeredAt ? new Date(clientLookup.existingProfile.registeredAt).toLocaleDateString() : 'previously'}`
      : 'Authenticated via Firebase Auth Sign-In (returning account)';

    return {
      timestamp: nowIso,
      action,
      email: cleanEmail,
      displayName: clientLookup.existingProfile?.name || cleanName,
      companyName: cleanCompany,
      classification: 'EXISTING_CLIENT_SIGNIN',
      clientLookup,
      shouldDispatchWelcomeEmail: false,
      shouldShowWelcomeLetterModal: false,
      shouldCreditWelcomeTokens: false,
      shouldUpsertNewClientRecord: false,
      shouldTrackGa4SignUp: false,
      ga4EventName: 'workspace_enter',
      steps: [
        {
          stepNumber: 1,
          gate: 'Identity & Client Registry Lookup',
          status: 'PASS',
          summary: 'EXISTING CLIENT RECOGNIZED',
          detail: `${cleanEmail} — ${existingLabel}.`,
        },
        {
          stepNumber: 2,
          gate: 'Account, Tokens & Purchases Preservation',
          status: 'PRESERVED',
          summary: 'Existing balance, owned apps & original registeredAt preserved',
          detail: `Sign-in restores existing client profile (${clientLookup.existingProfile?.purchasedApps?.length || 0} owned apps) without resetting tokens or overwriting registration timestamp.`,
        },
        {
          stepNumber: 3,
          gate: 'Welcome Email Gate ("your SANDBOX is ready")',
          status: 'BLOCKED',
          summary: 'SUPPRESSED — existing client sign-in never triggers welcome mail',
          detail: 'Blocked at both client AuthGateway/SplashOfficeDoors AND server /api/email/send-welcome (isNewClientSignup: false).',
        },
        {
          stepNumber: 4,
          gate: 'In-App Welcome Letter Modal',
          status: 'SKIPPED',
          summary: 'Skipped — returning member enters workspace immediately',
          detail: 'SandboxWelcomeLetter only appears once on initial account creation.',
        },
        {
          stepNumber: 5,
          gate: 'GA4 Analytics Event',
          status: 'DISPATCH',
          summary: 'Fires workspace_enter (user_type: member)',
          detail: 'GA4 sign_up event is NOT fired on sign-in, preventing inflated new-client counts.',
        },
      ],
    };
  }

  // Case 3: Duplicate Sign-Up Attempt (Email already exists or welcome email already sent)
  if (clientLookup.exists || clientLookup.welcomeEmailAlreadySent || welcomeEmailAlreadyDispatchedInFlow) {
    return {
      timestamp: nowIso,
      action,
      email: cleanEmail,
      displayName: clientLookup.existingProfile?.name || cleanName,
      companyName: cleanCompany,
      classification: 'DUPLICATE_SIGNUP_BLOCKED',
      clientLookup,
      shouldDispatchWelcomeEmail: false,
      shouldShowWelcomeLetterModal: false,
      shouldCreditWelcomeTokens: false,
      shouldUpsertNewClientRecord: false,
      shouldTrackGa4SignUp: false,
      ga4EventName: 'workspace_enter',
      steps: [
        {
          stepNumber: 1,
          gate: 'Identity & Client Registry Lookup',
          status: 'BLOCKED',
          summary: 'DUPLICATE EMAIL DETECTED IN CLIENT REGISTRY',
          detail: `${cleanEmail} already exists (${clientLookup.source}). Treated as returning client.`,
        },
        {
          stepNumber: 2,
          gate: 'Account & Welcome Token Allocation',
          status: 'PRESERVED',
          summary: 'Existing client record & original registration date preserved',
          detail: 'Duplicate welcome token allocation and registration overwrite prevented.',
        },
        {
          stepNumber: 3,
          gate: 'Welcome Email Gate ("your SANDBOX is ready")',
          status: 'BLOCKED',
          summary: 'SUPPRESSED — welcome email already dispatched previously',
          detail: clientLookup.welcomeEmailSentAt
            ? `Previous welcome dispatch recorded at ${new Date(clientLookup.welcomeEmailSentAt).toLocaleString()}.`
            : 'Welcome email already sent for this client; duplicate SMTP dispatch blocked.',
        },
        {
          stepNumber: 4,
          gate: 'In-App Welcome Letter Modal',
          status: 'SKIPPED',
          summary: 'Skipped to avoid repeating first-time onboarding letter',
          detail: 'Returning client enters workspace directly.',
        },
        {
          stepNumber: 5,
          gate: 'GA4 Analytics Event',
          status: 'DISPATCH',
          summary: 'Fires workspace_enter only (no duplicate sign_up)',
          detail: 'Protects Google Ads & GA4 acquisition conversion accuracy.',
        },
      ],
    };
  }

  // Case 4: Genuine Brand-New Client Sign-Up
  return {
    timestamp: nowIso,
    action,
    email: cleanEmail,
    displayName: cleanName,
    companyName: cleanCompany,
    classification: 'NEW_CLIENT_SIGNUP',
    clientLookup,
    shouldDispatchWelcomeEmail: Boolean(cleanEmail),
    shouldShowWelcomeLetterModal: true,
    shouldCreditWelcomeTokens: true,
    shouldUpsertNewClientRecord: true,
    shouldTrackGa4SignUp: true,
    ga4EventName: 'sign_up',
    steps: [
      {
        stepNumber: 1,
        gate: 'Identity & Client Registry Lookup',
        status: 'PASS',
        summary: 'NEW CLIENT CONFIRMED (not in Firestore or Client Directory)',
        detail: `${cleanEmail} is a brand-new registration. Eligible for first-time SANDBOX onboarding.`,
      },
      {
        stepNumber: 2,
        gate: 'Account & Welcome Token Allocation',
        status: 'PASS',
        summary: 'Create Firebase Auth + Firestore client_profiles record & credit welcome tokens',
        detail: `Registers ${cleanName} (${cleanCompany}) with initial sandbox tokens, records registeredAt timestamp, and saves profile to Administration Centre Client Directory.`,
      },
      {
        stepNumber: 3,
        gate: 'Welcome Email Gate ("your SANDBOX is ready")',
        status: 'DISPATCH',
        summary: 'DISPATCH ONCE via Xneelo SMTP with inline bizzbean-favicon.jpg logo',
        detail: `Sends "your SANDBOX is ready — welcome to bizzbean" to ${cleanEmail} and sets welcomeEmailSent = true in Firestore so future sign-ins never re-send.`,
      },
      {
        stepNumber: 4,
        gate: 'In-App Welcome Letter Modal',
        status: 'DISPATCH',
        summary: 'Display SandboxWelcomeLetter with "getting to value" book download',
        detail: 'Shows welcome letter once with bizzbean-favicon.jpg logo and direct button into personal SANDBOX.',
      },
      {
        stepNumber: 5,
        gate: 'GA4 Analytics Event',
        status: 'DISPATCH',
        summary: 'Fires GA4 sign_up conversion event',
        detail: 'Records a genuine new-client sign_up event in GA4 for Google Ads campaign attribution.',
      },
    ],
  };
}
