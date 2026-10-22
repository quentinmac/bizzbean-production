import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import { db, isFirestoreQuotaExceeded } from '../lib/firebase';
import { CmsInquiry, INITIAL_CMS_INQUIRIES } from '../data/cmsConsoleData';

export const ENQUIRIES_COLLECTION = 'enquiries';
export const ENQUIRIES_STORAGE_KEY = 'bizzdesk_cms_inquiries_v1';
export const BIZZBEAN_ADVISORY_EMAIL = 'thebizzbeanchannel@gmail.com';

/**
 * Extended enquiry structure representing a TALK TO US dispatch.
 * Fully compatible with the CmsInquiry interface in the Administration Centre.
 */
export interface TalkToUsEnquiry extends CmsInquiry {
  senderPhone?: string;
  companyName?: string;
  category?: 'general' | 'advisory' | 'capital' | 'modelling' | 'technical' | 'urgent';
  source?: 'sliding_door' | 'footer' | 'admin_simulation' | 'sandbox_modal' | 'web';
  adminNotes?: string;
  response?: {
    subject?: string;
    message: string;
    date: string;
    responderEmail?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEnquiryInput {
  id?: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  companyName?: string;
  subject: string;
  message: string;
  category?: 'general' | 'advisory' | 'capital' | 'modelling' | 'technical' | 'urgent';
  source?: 'sliding_door' | 'footer' | 'admin_simulation' | 'sandbox_modal' | 'web';
  status?: 'new' | 'reviewed' | 'resolved';
}

export interface EmailDispatchResult {
  success: boolean;
  mailtoUrl: string;
  recipient: string;
  subject: string;
  message: string;
}

export interface PresetResponseTemplate {
  id: string;
  label: string;
  subjectPrefix: string;
  body: (enquiry: TalkToUsEnquiry) => string;
}

/**
 * Quick response templates for the GIM Advisory Desk.
 */
export const ENQUIRY_RESPONSE_PRESETS: PresetResponseTemplate[] = [
  {
    id: 'gim-loop',
    label: 'GIM Socratic AI-LOOP',
    subjectPrefix: '[GIM AI-Loop Recommendation]',
    body: (inq) =>
      `Dear ${inq.senderName},\n\n` +
      `Thank you for contacting the Bizzbean GIM Advisory Desk regarding "${inq.subject}".\n\n` +
      `Coach GIM has evaluated your query. We recommend stress-testing your commercial assumptions in the AI-LOOP Dialogue on the right-hand panel of your workstation.\n\n` +
      `Our motto remains: 'infinite wisdom. instant viability. always on.'\n\n` +
      `Warm regards,\n` +
      `GIM Executive Advisory Desk\n` +
      `Bizzbean Venture Architecture`,
  },
  {
    id: 'tokens-grant',
    label: 'Grant 350 BizzTokens',
    subjectPrefix: '[BizzTokens Allocation Granted]',
    body: (inq) =>
      `Dear ${inq.senderName},\n\n` +
      `We have approved and credited 350 complimentary BizzTokens to your workstation so your team can unlock the requested simulation sprint without delay.\n\n` +
      `You can check your updated dynamic token balance directly in your top navigation bar.\n\n` +
      `Warm regards,\n` +
      `Bizzbean Operations & Tokenomics Desk`,
  },
  {
    id: 'forecast-guide',
    label: '3-Statement Model Guide',
    subjectPrefix: '[Financial Model Calibration]',
    body: (inq) =>
      `Dear ${inq.senderName},\n\n` +
      `Regarding your inquiry on 3-statement financial models:\n\n` +
      `When exporting your forecast to Google Drive or Excel, the folder architecture automatically provisions partitioned sub-directories for lead investors, complete with cap table waterfalls and dynamic valuation sensitivity dials.\n\n` +
      `Please let us know if you require a guided run-through with Coach GIM.\n\n` +
      `Warm regards,\n` +
      `Elena Vance · Venture Operations & Capital Access`,
  },
  {
    id: 'vdr-readiness',
    label: 'VDR Due Diligence Readiness',
    subjectPrefix: '[Virtual Data Room Audit]',
    body: (inq) =>
      `Dear ${inq.senderName},\n\n` +
      `Thank you for your enquiry. We have reviewed your request and updated your Virtual Data Room checklist.\n\n` +
      `Please verify that your statutory SARS Tax Clearance, 18-month cash burn runway forecast, and cap table shareholder register are stashed in your Sandbox Library for instant auditor verification.\n\n` +
      `Warm regards,\n` +
      `Bizzbean Institutional Due Diligence Team`,
  },
];

// =============================================================================
// LOCAL STORAGE FALLBACK HELPERS
// =============================================================================

/**
 * Retrieve cached enquiries from localStorage with fallback to default matrix.
 */
export function getLocalEnquiries(): TalkToUsEnquiry[] {
  try {
    const raw = localStorage.getItem(ENQUIRIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.info('Using default enquiries (local storage parse notice):', err);
  }
  return INITIAL_CMS_INQUIRIES as TalkToUsEnquiry[];
}

/**
 * Safely persist enquiries to localStorage.
 */
export function saveLocalEnquiries(enquiries: TalkToUsEnquiry[]): void {
  try {
    localStorage.setItem(ENQUIRIES_STORAGE_KEY, JSON.stringify(enquiries));
  } catch (err) {
    console.warn('Failed to save enquiries to localStorage:', err);
  }
}

// =============================================================================
// FIRESTORE PERSISTENCE CRUD OPERATIONS
// =============================================================================

/**
 * Creates and persists a new TALK TO US enquiry in Firestore with localStorage fallback.
 */
export async function createEnquiry(input: CreateEnquiryInput): Promise<TalkToUsEnquiry> {
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);
  const enquiryId = input.id || `inq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newEnquiry: TalkToUsEnquiry = {
    id: enquiryId,
    senderName: input.senderName.trim() || 'Anonymous Founder',
    senderEmail: input.senderEmail.trim().toLowerCase(),
    senderPhone: input.senderPhone?.trim() || '',
    companyName: input.companyName?.trim() || '',
    subject: input.subject.trim() || 'General Advisory & Enterprise Inquiry',
    message: input.message.trim(),
    date: dateStr,
    status: input.status || 'new',
    category: input.category || 'advisory',
    source: input.source || 'sliding_door',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // 1. Always update local storage first so user has immediate offline access
  const currentLocal = getLocalEnquiries();
  const updatedLocal = [newEnquiry, ...currentLocal.filter((e) => e.id !== newEnquiry.id)];
  saveLocalEnquiries(updatedLocal);

  // 2. Synchronize to Firestore
  try {
    if (!isFirestoreQuotaExceeded()) {
      const docRef = doc(db, ENQUIRIES_COLLECTION, newEnquiry.id);
      await setDoc(docRef, newEnquiry);
    }
  } catch (err) {
    console.info('Enquiry saved to local cache (Firestore sync pending/offline):', err);
  }

  return newEnquiry;
}

/**
 * Retrieve all enquiries from Firestore, merging with local storage cache.
 */
export async function getEnquiries(): Promise<TalkToUsEnquiry[]> {
  try {
    if (!isFirestoreQuotaExceeded()) {
      const colRef = collection(db, ENQUIRIES_COLLECTION);
      const q = query(colRef, orderBy('date', 'desc'), limit(150));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const remoteEnquiries: TalkToUsEnquiry[] = [];
        snap.forEach((docSnap) => {
          remoteEnquiries.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });

        // Merge with local items in case any were created offline
        const local = getLocalEnquiries();
        const mergedMap = new Map<string, TalkToUsEnquiry>();
        remoteEnquiries.forEach((item) => mergedMap.set(item.id, item));
        local.forEach((item) => {
          if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, item);
          }
        });

        const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
          return (b.date || '').localeCompare(a.date || '');
        });

        saveLocalEnquiries(mergedList);
        return mergedList;
      }
    }
  } catch (err) {
    console.info('Using local cache for enquiries (Firestore offline/notice):', err);
  }

  return getLocalEnquiries();
}

/**
 * Updates the status and optional admin notes of an enquiry.
 */
export async function updateEnquiryStatus(
  id: string,
  status: 'new' | 'reviewed' | 'resolved',
  adminNotes?: string
): Promise<void> {
  const current = getLocalEnquiries();
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status,
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        updatedAt: new Date().toISOString(),
      };
    }
    return item;
  });
  saveLocalEnquiries(updated);

  try {
    if (!isFirestoreQuotaExceeded()) {
      const docRef = doc(db, ENQUIRIES_COLLECTION, id);
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString(),
      };
      if (adminNotes !== undefined) {
        updateData.adminNotes = adminNotes;
      }
      await updateDoc(docRef, updateData);
    }
  } catch (err) {
    console.info('Status updated locally (Firestore sync notice):', err);
  }
}

/**
 * Records an advisory response and marks the enquiry as 'resolved'.
 */
export async function recordEnquiryResponse(
  id: string,
  responseMessage: string,
  replySubject?: string,
  responderEmail: string = BIZZBEAN_ADVISORY_EMAIL
): Promise<void> {
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);

  const current = getLocalEnquiries();
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status: 'resolved' as const,
        response: {
          subject: replySubject || `Re: ${item.subject}`,
          message: responseMessage,
          date: dateStr,
          responderEmail,
        },
        updatedAt: now.toISOString(),
      };
    }
    return item;
  });
  saveLocalEnquiries(updated);

  try {
    if (!isFirestoreQuotaExceeded()) {
      const docRef = doc(db, ENQUIRIES_COLLECTION, id);
      await updateDoc(docRef, {
        status: 'resolved',
        response: {
          subject: replySubject || 'Advisory Desk Response',
          message: responseMessage,
          date: dateStr,
          responderEmail,
        },
        updatedAt: now.toISOString(),
      });
    }
  } catch (err) {
    console.info('Response recorded locally (Firestore sync notice):', err);
  }
}

/**
 * Deletes an enquiry from Firestore and local storage.
 */
export async function deleteEnquiry(id: string): Promise<void> {
  const current = getLocalEnquiries();
  const updated = current.filter((item) => item.id !== id);
  saveLocalEnquiries(updated);

  try {
    if (!isFirestoreQuotaExceeded()) {
      const docRef = doc(db, ENQUIRIES_COLLECTION, id);
      await deleteDoc(docRef);
    }
  } catch (err) {
    console.info('Deleted from local storage (Firestore notice):', err);
  }
}

// =============================================================================
// REAL-TIME LISTENERS
// =============================================================================

/**
 * Subscribes to real-time updates for enquiries in Firestore.
 * Automatically falls back to cached local storage if network or permissions fail.
 *
 * @param onUpdate Callback receiving the updated array of enquiries.
 * @param onError Optional error handler.
 * @returns Unsubscribe function to stop listening.
 */
export function subscribeToEnquiries(
  onUpdate: (enquiries: TalkToUsEnquiry[]) => void,
  onError?: (err: Error) => void
): () => void {
  // 1. Immediately provide cached data for responsive UI
  const initialLocal = getLocalEnquiries();
  onUpdate(initialLocal);

  if (isFirestoreQuotaExceeded()) {
    return () => {};
  }

  try {
    const colRef = collection(db, ENQUIRIES_COLLECTION);
    const q = query(colRef, orderBy('date', 'desc'), limit(150));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const liveEnquiries: TalkToUsEnquiry[] = [];
          snapshot.forEach((docSnap) => {
            liveEnquiries.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });

          // Save to local cache so offline works
          saveLocalEnquiries(liveEnquiries);
          onUpdate(liveEnquiries);
        } else {
          // If Firestore is empty, provide local default set
          onUpdate(initialLocal);
        }
      },
      (err) => {
        console.warn('Real-time enquiry listener fallback to local cache:', err.message || err);
        if (onError) onError(err);
        onUpdate(getLocalEnquiries());
      }
    );

    return unsubscribe;
  } catch (listenerErr: any) {
    console.warn('Unable to attach Firestore enquiry listener; using local state:', listenerErr);
    if (onError) onError(listenerErr);
    return () => {};
  }
}

// =============================================================================
// EMAIL RESPONSE DISPATCHERS
// =============================================================================

/**
 * Generates an RFC-compliant mailto: URI with prefilled recipient, subject, and body.
 */
export function generateMailtoLink(
  to: string,
  subject: string,
  body: string,
  cc?: string
): string {
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  if (cc) params.push(`cc=${encodeURIComponent(cc)}`);

  const queryString = params.length > 0 ? `?${params.join('&')}` : '';
  return `mailto:${encodeURIComponent(to)}${queryString}`;
}

/**
 * Dispatches an email response to an enquiry:
 * 1. Formats the email text and subject.
 * 2. Persists the response to Firestore & localStorage, marking the enquiry 'resolved'.
 * 3. Generates the mailto URL and optionally launches the system email client.
 */
export async function dispatchEmailResponse(
  enquiry: TalkToUsEnquiry,
  replySubject: string,
  replyMessage: string,
  options?: {
    responderEmail?: string;
    openEmailClient?: boolean;
    ccFounderChannel?: boolean;
  }
): Promise<EmailDispatchResult> {
  const responderEmail = options?.responderEmail || BIZZBEAN_ADVISORY_EMAIL;
  const cc = options?.ccFounderChannel ? BIZZBEAN_ADVISORY_EMAIL : undefined;

  // 1. Record response and resolve enquiry in Firestore and LocalStorage
  await recordEnquiryResponse(enquiry.id, replyMessage, replySubject, responderEmail);

  // 2. Generate mailto link
  const mailtoUrl = generateMailtoLink(enquiry.senderEmail, replySubject, replyMessage, cc);

  // 3. Optionally launch system email client
  if (options?.openEmailClient && typeof window !== 'undefined') {
    try {
      window.location.href = mailtoUrl;
    } catch (e) {
      console.info('Could not automatically redirect to mailto:', e);
    }
  }

  return {
    success: true,
    mailtoUrl,
    recipient: enquiry.senderEmail,
    subject: replySubject,
    message: replyMessage,
  };
}

/**
 * Generates notification dispatch for the Bizzbean founder/administrator
 * when a new member enquiry is submitted from the workstation or footer.
 */
export function dispatchNewEnquiryNotification(
  enquiry: TalkToUsEnquiry
): { mailtoUrl: string; previewText: string } {
  const subject = `[New TALK TO US Enquiry] ${enquiry.subject} (${enquiry.senderName})`;
  const body =
    `A new member enquiry has been submitted on the Bizzbean Workstation.\n\n` +
    `Sender: ${enquiry.senderName} (${enquiry.senderEmail})\n` +
    `Company: ${enquiry.companyName || 'Not specified'}\n` +
    `Phone: ${enquiry.senderPhone || 'Not specified'}\n` +
    `Date: ${enquiry.date}\n` +
    `Category: ${enquiry.category || 'advisory'}\n` +
    `Source: ${enquiry.source || 'sliding_door'}\n\n` +
    `Message:\n"${enquiry.message}"\n\n` +
    `Manage and reply in the Administration Centre: /admin-centre > Tab 2 (Talk To Us Dialogue Centre).\n`;

  const mailtoUrl = generateMailtoLink(BIZZBEAN_ADVISORY_EMAIL, subject, body);
  return { mailtoUrl, previewText: body };
}
