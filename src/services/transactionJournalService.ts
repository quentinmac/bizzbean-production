import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { db, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded } from '../lib/firebase';
import { ClientProfile, TransactionRecord } from '../types';
import { INITIAL_CLIENT_PROFILES, INITIAL_V1_TRANSACTIONS } from '../data/cmsConsoleData';
import { safeSaveStorage } from '../utils/imageStorage';

export const CLIENT_PROFILES_V1_KEY = 'bizzdesk_v1_client_profiles';
export const CLIENT_PROFILES_LEGACY_BEAN_KEY = 'bizzbean_client_profiles';
export const CLIENT_PROFILES_LEGACY_DESK_KEY = 'bizzdesk_client_profiles';

export const TRANSACTIONS_V1_KEY = 'bizzdesk_v1_transactions';
export const TRANSACTIONS_RESET_ZERO_KEY = 'bizzdesk_v1_transactions_reset_zero';
export const PROCESSED_PAYFAST_IDS_KEY = 'bizzdesk_processed_payfast_ids';

export const CLIENT_PROFILES_UPDATED_EVENT = 'bizzdesk_client_profiles_updated';
export const TRANSACTIONS_UPDATED_EVENT = 'bizzdesk_transactions_updated';

function handleJournalFirestoreError(operation: string, err: any): void {
  const errMsg = String(err?.message || err || '');
  const errCode = String(err?.code || '');
  if (
    errCode === 'resource-exhausted' ||
    errCode.includes('resource-exhausted') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('Quota limit exceeded') ||
    errMsg.includes('quota metric')
  ) {
    setFirestoreQuotaExceeded();
    console.warn(`Firestore quota exceeded during ${operation}. Continuing with local persistence.`);
    return;
  }
  if (errCode === 'permission-denied') {
    console.info(`Firestore permission notice during ${operation}:`, errMsg);
    return;
  }
  console.warn(`Firestore ${operation} notice:`, err);
}

function sanitizeForFirestore<T>(data: T): T {
  try {
    return JSON.parse(
      JSON.stringify(data, (_key, value) => (value === undefined ? null : value))
    );
  } catch {
    return data;
  }
}

export function normalizeEmail(email: string | null | undefined): string {
  return String(email || '').trim().toLowerCase();
}

export function safeEmailDocId(email: string): string {
  return normalizeEmail(email).replace(/[/#?[\]]/g, '_');
}

function readJsonArray<T>(key: string): T[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isPlaceholderCompany(val?: string): boolean {
  if (!val) return true;
  const low = val.trim().toLowerCase();
  return low === '' || low === 'apex cloud dynamics' || low === 'independent founder';
}

function pickPreferredString(primary?: string, fallback?: string): string | undefined {
  const a = (primary || '').trim();
  const b = (fallback || '').trim();
  if (a && !isPlaceholderCompany(a)) return a;
  if (b && !isPlaceholderCompany(b)) return b;
  return a || b || undefined;
}

/**
 * Deduplicate and merge ClientProfile arrays (later/higher-priority entries override sparse fields,
 * while preserving rich metadata from any source).
 */
export function mergeClientProfiles(...lists: ClientProfile[][]): ClientProfile[] {
  const byKey = new Map<string, ClientProfile>();

  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      if (!raw || typeof raw !== 'object') continue;
      const emailNorm = normalizeEmail(raw.email);
      const nameTrim = String(raw.name || '').trim();
      if (!emailNorm && !nameTrim) continue;

      const key = emailNorm || `id:${raw.id || nameTrim.toLowerCase()}`;
      const existing = byKey.get(key);

      const rawTokens =
        typeof raw.tokens === 'number' && Number.isFinite(raw.tokens) && raw.tokens >= 0
          ? Math.round(raw.tokens * 10) / 10
          : undefined;

      if (!existing) {
        byKey.set(key, {
          id: raw.id || `cli-${Date.now().toString().slice(-4)}-${Math.random().toString(36).slice(2, 5)}`,
          name: nameTrim || (emailNorm ? emailNorm.split('@')[0] : 'Entrepreneur'),
          email: emailNorm || String(raw.email || '').trim(),
          companyName: (raw.companyName || '').trim() || 'Independent Founder',
          vatNumber: raw.vatNumber || undefined,
          phone: raw.phone || undefined,
          city: raw.city || undefined,
          country: raw.country || 'South Africa',
          notes: raw.notes || undefined,
          role: raw.role || undefined,
          associate: raw.associate || undefined,
          registeredAt: raw.registeredAt || undefined,
          uid: raw.uid || undefined,
          tokens: rawTokens,
          purchasedApps: Array.isArray(raw.purchasedApps) ? raw.purchasedApps : undefined,
          purchasedCourses: Array.isArray(raw.purchasedCourses) ? raw.purchasedCourses : undefined,
        });
      } else {
        const mergedApps = Array.from(
          new Set([...(existing.purchasedApps || []), ...(Array.isArray(raw.purchasedApps) ? raw.purchasedApps : [])])
        );
        const mergedCourses = Array.from(
          new Set([...(existing.purchasedCourses || []), ...(Array.isArray(raw.purchasedCourses) ? raw.purchasedCourses : [])])
        );
        byKey.set(key, {
          id: existing.id || raw.id,
          name: nameTrim || existing.name,
          email: existing.email || emailNorm,
          companyName: pickPreferredString(raw.companyName, existing.companyName) || 'Independent Founder',
          vatNumber: raw.vatNumber || existing.vatNumber,
          phone: raw.phone || existing.phone,
          city: raw.city || existing.city,
          country: raw.country || existing.country || 'South Africa',
          notes: raw.notes || existing.notes,
          role: raw.role || existing.role,
          associate: raw.associate || existing.associate,
          registeredAt: raw.registeredAt || existing.registeredAt,
          uid: raw.uid || existing.uid,
          tokens: rawTokens !== undefined ? rawTokens : existing.tokens,
          purchasedApps: mergedApps.length > 0 ? mergedApps : undefined,
          purchasedCourses: mergedCourses.length > 0 ? mergedCourses : undefined,
        });
      }
    }
  }

  // Sort newly registered profiles (with registeredAt) first, keeping seed entries tidy
  return Array.from(byKey.values()).sort((a, b) => {
    const aTime = a.registeredAt ? Date.parse(a.registeredAt) : 0;
    const bTime = b.registeredAt ? Date.parse(b.registeredAt) : 0;
    if (aTime !== bTime) return bTime - aTime;
    return 0;
  });
}

function writeClientProfilesToLocalCaches(profiles: ClientProfile[]): void {
  safeSaveStorage(CLIENT_PROFILES_V1_KEY, profiles);
  safeSaveStorage(CLIENT_PROFILES_LEGACY_BEAN_KEY, profiles);
  safeSaveStorage(CLIENT_PROFILES_LEGACY_DESK_KEY, profiles);
}

/**
 * Synchronously reads and merges all local ClientProfile stores
 * (`bizzdesk_v1_client_profiles`, `bizzbean_client_profiles`, `bizzdesk_client_profiles`, and defaults).
 */
export function getCachedClientProfiles(): ClientProfile[] {
  const v1 = readJsonArray<ClientProfile>(CLIENT_PROFILES_V1_KEY);
  const bean = readJsonArray<ClientProfile>(CLIENT_PROFILES_LEGACY_BEAN_KEY);
  const desk = readJsonArray<ClientProfile>(CLIENT_PROFILES_LEGACY_DESK_KEY);

  return mergeClientProfiles(INITIAL_CLIENT_PROFILES, desk, bean, v1);
}

/**
 * Loads client profiles from Cloud Firestore (`client_profiles` and `users` collections)
 * and merges them with all localStorage keys so every registration is visible.
 */
export async function loadMergedClientProfilesFromCloud(): Promise<ClientProfile[]> {
  const localMerged = getCachedClientProfiles();
  if (isFirestoreQuotaExceeded()) {
    return localMerged;
  }

  const cloudClientProfiles: ClientProfile[] = [];
  const cloudUsersProfiles: ClientProfile[] = [];

  try {
    const cpSnap = await getDocs(collection(db, 'client_profiles'));
    cpSnap.forEach((d) => {
      const data = d.data() as any;
      if (data && (data.email || data.name)) {
        cloudClientProfiles.push({
          id: data.id || `cli-${d.id.slice(0, 8)}`,
          name: data.name || data.email?.split('@')[0] || 'Entrepreneur',
          email: data.email || d.id,
          companyName: data.companyName || 'Independent Founder',
          vatNumber: data.vatNumber || undefined,
          phone: data.phone || undefined,
          city: data.city || undefined,
          country: data.country || 'South Africa',
          notes: data.notes || undefined,
          role: data.role || undefined,
          associate: data.associate || undefined,
          registeredAt: data.registeredAt || data.updatedAt || undefined,
          uid: data.uid || undefined,
          tokens:
            typeof data.tokens === 'number' && Number.isFinite(data.tokens) && data.tokens >= 0
              ? Math.round(data.tokens * 10) / 10
              : undefined,
          purchasedApps: Array.isArray(data.purchasedApps) ? data.purchasedApps : undefined,
          purchasedCourses: Array.isArray(data.purchasedCourses) ? data.purchasedCourses : undefined,
        });
      }
    });
  } catch (err) {
    handleJournalFirestoreError('fetch client_profiles', err);
  }

  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.forEach((d) => {
      const data = d.data() as any;
      if (data && (data.email || data.name)) {
        cloudUsersProfiles.push({
          id: data.id || `usr-${d.id.slice(0, 8)}`,
          uid: data.uid || d.id,
          name: data.name || data.email?.split('@')[0] || 'Entrepreneur',
          email: data.email || '',
          companyName: data.companyName || 'Bizzbean Member Enterprise',
          vatNumber: data.vatNumber || undefined,
          phone: data.phone || undefined,
          city: data.city || undefined,
          country: data.country || 'South Africa',
          notes:
            data.notes ||
            (data.role === 'admin'
              ? 'Registered Platform Administrator.'
              : 'Registered Bizzbean Firebase Member.'),
          role: data.role === 'admin' ? 'admin' : 'member',
          associate: data.associate || undefined,
          registeredAt: data.registeredAt || data.updatedAt || undefined,
          tokens:
            typeof data.tokens === 'number' && Number.isFinite(data.tokens) && data.tokens >= 0
              ? Math.round(data.tokens * 10) / 10
              : undefined,
          purchasedApps: Array.isArray(data.purchasedApps) ? data.purchasedApps : undefined,
          purchasedCourses: Array.isArray(data.purchasedCourses) ? data.purchasedCourses : undefined,
        });
      }
    });
  } catch (err) {
    handleJournalFirestoreError('fetch users directory', err);
  }

  const merged = mergeClientProfiles(
    INITIAL_CLIENT_PROFILES,
    localMerged,
    cloudUsersProfiles,
    cloudClientProfiles
  );
  writeClientProfilesToLocalCaches(merged);
  return merged;
}

/**
 * Upserts a single client profile into all local caches + Cloud Firestore `client_profiles/{email}`,
 * and dispatches an update event so open Admin/Client modals refresh immediately.
 */
export async function upsertClientProfile(
  profileInput: Partial<ClientProfile> & { email: string }
): Promise<ClientProfile[]> {
  const emailNorm = normalizeEmail(profileInput.email);
  if (!emailNorm) return getCachedClientProfiles();

  const existingList = getCachedClientProfiles();
  const existingMatch = existingList.find((c) => normalizeEmail(c.email) === emailNorm);

  const mergedRecord: ClientProfile = {
    id:
      profileInput.id ||
      existingMatch?.id ||
      `cli-${Date.now().toString().slice(-5)}`,
    name:
      (profileInput.name || '').trim() ||
      existingMatch?.name ||
      emailNorm.split('@')[0] ||
      'Entrepreneur',
    email: emailNorm,
    companyName:
      pickPreferredString(profileInput.companyName, existingMatch?.companyName) ||
      'Bizzbean Member Enterprise',
    vatNumber: profileInput.vatNumber ?? existingMatch?.vatNumber,
    phone: profileInput.phone ?? existingMatch?.phone,
    city: profileInput.city ?? existingMatch?.city,
    country: profileInput.country || existingMatch?.country || 'South Africa',
    notes: profileInput.notes || existingMatch?.notes,
    role: profileInput.role || existingMatch?.role,
    associate: profileInput.associate || existingMatch?.associate,
    registeredAt:
      existingMatch?.registeredAt ||
      profileInput.registeredAt ||
      new Date().toISOString(),
    uid: profileInput.uid || existingMatch?.uid,
    tokens:
      typeof profileInput.tokens === 'number' && Number.isFinite(profileInput.tokens) && profileInput.tokens >= 0
        ? Math.round(profileInput.tokens * 10) / 10
        : existingMatch?.tokens,
    purchasedApps: Array.from(
      new Set([
        ...(existingMatch?.purchasedApps || []),
        ...(profileInput.purchasedApps || []),
      ])
    ),
    purchasedCourses: Array.from(
      new Set([
        ...(existingMatch?.purchasedCourses || []),
        ...(profileInput.purchasedCourses || []),
      ])
    ),
  };

  const nextList = mergeClientProfiles(existingList, [mergedRecord]);
  writeClientProfilesToLocalCaches(nextList);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CLIENT_PROFILES_UPDATED_EVENT));
  }

  if (!isFirestoreQuotaExceeded()) {
    try {
      const docId = safeEmailDocId(emailNorm);
      await setDoc(
        doc(db, 'client_profiles', docId),
        sanitizeForFirestore({
          ...mergedRecord,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
    } catch (err) {
      handleJournalFirestoreError('upsert client_profile', err);
    }
  }

  return nextList;
}

/**
 * Persists a full ClientProfile array to local caches and syncs to Firestore.
 */
export async function saveAllClientProfilesToCloud(
  profiles: ClientProfile[]
): Promise<void> {
  writeClientProfilesToLocalCaches(profiles);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CLIENT_PROFILES_UPDATED_EVENT));
  }

  if (isFirestoreQuotaExceeded()) return;

  try {
    await Promise.all(
      profiles
        .filter((p) => Boolean(p && p.email))
        .map((p) => {
          const docId = safeEmailDocId(p.email);
          return setDoc(
            doc(db, 'client_profiles', docId),
            sanitizeForFirestore({
              ...p,
              email: normalizeEmail(p.email),
              updatedAt: new Date().toISOString(),
            }),
            { merge: true }
          );
        })
    );
  } catch (err) {
    handleJournalFirestoreError('save all client_profiles', err);
  }
}

// =============================================================================
// TRANSACTION JOURNAL PERSISTENCE & CLOUD SYNC
// =============================================================================

export function getCachedTransactions(): TransactionRecord[] {
  try {
    if (typeof window === 'undefined') return INITIAL_V1_TRANSACTIONS;
    if (localStorage.getItem(TRANSACTIONS_RESET_ZERO_KEY) === 'true') {
      const stored = localStorage.getItem(TRANSACTIONS_V1_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (t): t is TransactionRecord => Boolean(t && typeof t === 'object' && t.invoiceNumber)
          );
        }
      }
      return [];
    }
    const stored = localStorage.getItem(TRANSACTIONS_V1_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (t): t is TransactionRecord => Boolean(t && typeof t === 'object' && t.invoiceNumber)
        );
      }
    }
  } catch {}
  return INITIAL_V1_TRANSACTIONS;
}

function mergeTransactions(primary: TransactionRecord[], secondary: TransactionRecord[]): TransactionRecord[] {
  const map = new Map<string, TransactionRecord>();
  for (const tx of secondary) {
    if (tx && tx.invoiceNumber) map.set(tx.invoiceNumber, tx);
  }
  for (const tx of primary) {
    if (tx && tx.invoiceNumber) map.set(tx.invoiceNumber, tx);
  }
  return Array.from(map.values()).sort((a, b) => {
    const dateCmp = String(b.transactionDate || '').localeCompare(String(a.transactionDate || ''));
    if (dateCmp !== 0) return dateCmp;
    return String(b.invoiceNumber || '').localeCompare(String(a.invoiceNumber || ''));
  });
}

export async function loadTransactionsFromCloud(): Promise<TransactionRecord[]> {
  const localTxs = getCachedTransactions();
  if (isFirestoreQuotaExceeded()) {
    return localTxs;
  }

  try {
    const snap = await getDocs(collection(db, 'v1_transactions'));
    const cloudTxs: TransactionRecord[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      if (data && data.invoiceNumber) {
        cloudTxs.push(data as TransactionRecord);
      }
    });

    const isResetZero =
      typeof window !== 'undefined' &&
      localStorage.getItem(TRANSACTIONS_RESET_ZERO_KEY) === 'true';

    if (cloudTxs.length > 0) {
      const merged = mergeTransactions(cloudTxs, localTxs);
      safeSaveStorage(TRANSACTIONS_V1_KEY, merged);
      return merged;
    }

    if (isResetZero) {
      return localTxs;
    }

    return localTxs;
  } catch (err) {
    handleJournalFirestoreError('fetch v1_transactions', err);
    return localTxs;
  }
}

export function getNextInvoiceNumber(existing: TransactionRecord[]): string {
  const year = new Date().getFullYear();
  let maxSeq = 0;
  for (const tx of existing) {
    const match = String(tx?.invoiceNumber || '').match(/INV-\d{4}-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }
  }
  const nextSeq = Math.max(maxSeq + 1, existing.length + 1);
  return `INV-${year}-${String(nextSeq).padStart(4, '0')}`;
}

function hasProcessedPaymentRef(paymentRef: string, existing: TransactionRecord[]): boolean {
  if (!paymentRef) return false;
  if (existing.some((t) => t.paymentRef === paymentRef)) return true;
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(PROCESSED_PAYFAST_IDS_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.includes(paymentRef)) return true;
      }
    }
  } catch {}
  return false;
}

function markPaymentRefProcessed(paymentRef: string): void {
  if (!paymentRef) return;
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(PROCESSED_PAYFAST_IDS_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(paymentRef)) {
        const trimmed = [paymentRef, ...list].slice(0, 100);
        localStorage.setItem(PROCESSED_PAYFAST_IDS_KEY, JSON.stringify(trimmed));
      }
    }
  } catch {}
}

export interface RecordTransactionInput {
  sku: string;
  productName: string;
  productType: 'app' | 'course';
  customer: string;
  customerEmail: string;
  country?: string;
  associate?: string;
  quantity?: number;
  grossSellingPriceZAR?: number; // VAT-inclusive price (standard CMS/PayFast sellingPriceZAR)
  unitPriceExclVAT?: number;     // Optional explicit VAT-exclusive unit price
  vatRate?: number;
  transactionDate?: string;
  paymentRef?: string;
}

/**
 * Posts an automated purchase/checkout transaction to the Transaction Journal,
 * persists to Cloud Firestore `v1_transactions`, ensures customer exists in `client_profiles`,
 * and broadcasts `bizzdesk_transactions_updated`.
 */
export async function recordTransactionToJournal(
  input: RecordTransactionInput
): Promise<TransactionRecord | null> {
  const existing = getCachedTransactions();

  if (input.paymentRef && hasProcessedPaymentRef(input.paymentRef, existing)) {
    return existing.find((t) => t.paymentRef === input.paymentRef) || null;
  }

  const qty = Math.max(1, Number(input.quantity) || 1);
  const vatRate = input.vatRate !== undefined ? Number(input.vatRate) : 0.15;

  let unitPrice = 0;
  let lineValue = 0;
  let vatAmount = 0;
  let invoiceValue = 0;

  if (input.unitPriceExclVAT !== undefined) {
    unitPrice = Number(Number(input.unitPriceExclVAT).toFixed(2));
    lineValue = Number((unitPrice * qty).toFixed(2));
    vatAmount = Number((lineValue * vatRate).toFixed(2));
    invoiceValue = Number((lineValue + vatAmount).toFixed(2));
  } else {
    const grossTotal = Math.max(0, Number(input.grossSellingPriceZAR || 0) * qty);
    invoiceValue = Number(grossTotal.toFixed(2));
    lineValue = Number((invoiceValue / (1 + vatRate)).toFixed(2));
    vatAmount = Number((invoiceValue - lineValue).toFixed(2));
    unitPrice = Number((lineValue / qty).toFixed(2));
  }

  const invoiceNumber = getNextInvoiceNumber(existing);
  const record: TransactionRecord = {
    invoiceNumber,
    transactionDate: input.transactionDate || new Date().toISOString().slice(0, 10),
    sku: input.sku || 'bizzcalc',
    productName: input.productName || 'bizzcalc app',
    productType: input.productType || 'app',
    customer: (input.customer || '').trim() || 'Entrepreneur',
    customerEmail: normalizeEmail(input.customerEmail) || 'member@bizzbean.co.za',
    country: input.country || 'South Africa',
    associate: input.associate || 'Direct Online',
    quantity: qty,
    unitPrice,
    lineValue,
    vatRate,
    vatAmount,
    invoiceValue,
    paymentRef: input.paymentRef,
  };

  if (typeof window !== 'undefined') {
    localStorage.removeItem(TRANSACTIONS_RESET_ZERO_KEY);
  }
  if (input.paymentRef) {
    markPaymentRefProcessed(input.paymentRef);
  }

  const updated = [record, ...existing];
  safeSaveStorage(TRANSACTIONS_V1_KEY, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TRANSACTIONS_UPDATED_EVENT));
  }

  if (!isFirestoreQuotaExceeded()) {
    try {
      await setDoc(
        doc(db, 'v1_transactions', record.invoiceNumber),
        sanitizeForFirestore({
          ...record,
          createdAt: new Date().toISOString(),
        }),
        { merge: true }
      );
    } catch (err) {
      handleJournalFirestoreError('record v1_transaction', err);
    }
  }

  // Ensure buyer exists in Client Profiles directory
  if (record.customerEmail) {
    await upsertClientProfile({
      name: record.customer,
      email: record.customerEmail,
      country: record.country,
      notes: `Recorded transaction ${record.invoiceNumber} (${record.productName}).`,
    });
  }

  return record;
}

/**
 * Persists a manually created invoice record to localStorage and Cloud Firestore.
 */
export async function saveManualTransactionToJournal(
  record: TransactionRecord
): Promise<TransactionRecord[]> {
  const existing = getCachedTransactions();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TRANSACTIONS_RESET_ZERO_KEY);
  }
  const updated = [
    record,
    ...existing.filter((t) => t.invoiceNumber !== record.invoiceNumber),
  ];
  safeSaveStorage(TRANSACTIONS_V1_KEY, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TRANSACTIONS_UPDATED_EVENT));
  }

  if (!isFirestoreQuotaExceeded()) {
    try {
      await setDoc(
        doc(db, 'v1_transactions', record.invoiceNumber),
        sanitizeForFirestore({
          ...record,
          createdAt: new Date().toISOString(),
        }),
        { merge: true }
      );
    } catch (err) {
      handleJournalFirestoreError('save manual v1_transaction', err);
    }
  }

  return updated;
}

/**
 * Resets the Transaction Journal to zero locally and clears cloud v1_transactions.
 */
export async function resetTransactionJournalInCloud(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TRANSACTIONS_V1_KEY, JSON.stringify([]));
    localStorage.setItem(TRANSACTIONS_RESET_ZERO_KEY, 'true');
    window.dispatchEvent(new CustomEvent(TRANSACTIONS_UPDATED_EVENT));
  }

  if (isFirestoreQuotaExceeded()) return;

  try {
    const snap = await getDocs(collection(db, 'v1_transactions'));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  } catch (err) {
    handleJournalFirestoreError('reset v1_transactions', err);
  }
}
