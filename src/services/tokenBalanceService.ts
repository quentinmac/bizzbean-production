import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded } from '../lib/firebase';
import { INITIAL_CMS_PRODUCTS } from '../data/cmsConsoleData';
import { TransactionRecord } from '../types';
import {
  getCachedClientProfiles,
  getCachedTransactions,
  loadTransactionsFromCloud,
  normalizeEmail,
  safeEmailDocId,
  upsertClientProfile,
} from './transactionJournalService';

const TOKEN_BALANCE_PREFIX = 'bizzdesk_token_balance_v2_';
const LEGACY_SHARED_KEYS = ['bizzdesk_token_balance_v1', 'bizzdesk_token_balance'];

export const USER_TOKEN_BALANCE_EVENT = 'bizz-token-balance-updated';

/**
 * Normalizes a token amount to at most 1 decimal place and clamps to >= 0.
 * Avoids floating-point drift (e.g. 45.80000000000001) while supporting 20% rewards.
 */
export function normalizeTokenAmount(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.round(num * 10) / 10;
}

/**
 * Formats a token balance for clean UI display (e.g., "0", "45.8", "1,250").
 */
export function formatTokenBalance(value: unknown): string {
  const clean = normalizeTokenAmount(value);
  return clean.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function getUserTokenStorageKey(email: string): string {
  return `${TOKEN_BALANCE_PREFIX}${normalizeEmail(email)}`;
}

function isValidStoredTokenNumber(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val >= 0;
}

function handleTokenFirestoreError(action: string, err: any): void {
  if (err?.code === 'resource-exhausted' || String(err?.message || '').includes('quota')) {
    setFirestoreQuotaExceeded();
  }
  console.info(`Token balance cloud sync notice (${action}):`, err?.message || err);
}

/**
 * Removes legacy shared/hardcoded global token balance keys so they can never bleed across accounts.
 */
export function purgeLegacySharedTokenKeys(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const key of LEGACY_SHARED_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {}
}

/**
 * Reads the locally cached per-user token balance (never reads the legacy global key).
 * Returns `null` if no per-user balance has been cached yet for this email.
 */
export function getCachedUserTokenBalance(email?: string | null): number | null {
  const emailNorm = normalizeEmail(email);
  if (!emailNorm) return null;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(getUserTokenStorageKey(emailNorm));
      if (raw !== null && raw !== '') {
        const parsed = Number(raw);
        if (Number.isFinite(parsed) && parsed >= 0) {
          return normalizeTokenAmount(parsed);
        }
      }
    } catch {}
  }

  // Fallback to cached ClientProfile record for this specific user
  const profiles = getCachedClientProfiles();
  const match = profiles.find((p) => normalizeEmail(p.email) === emailNorm);
  if (match && isValidStoredTokenNumber(match.tokens)) {
    return normalizeTokenAmount(match.tokens);
  }

  return null;
}

function writeLocalUserTokenBalance(emailNorm: string, balance: number): void {
  if (typeof window === 'undefined' || !emailNorm) return;
  try {
    localStorage.setItem(getUserTokenStorageKey(emailNorm), String(normalizeTokenAmount(balance)));
  } catch {}
}

/**
 * Derives a legacy user's earned/purchased token balance from their recorded transaction journal
 * when no explicit `tokens` field exists yet on their Firestore profile.
 */
export function deriveTokensFromTransactions(
  email: string,
  transactions: TransactionRecord[]
): number {
  const emailNorm = normalizeEmail(email);
  if (!emailNorm || !Array.isArray(transactions) || transactions.length === 0) return 0;

  let total = 0;
  for (const tx of transactions) {
    if (!tx || normalizeEmail(tx.customerEmail) !== emailNorm) continue;

    const skuLower = (tx.sku || '').toLowerCase().trim();
    const nameStr = String(tx.productName || '');

    // Token pack purchase (e.g. "BizzTokens Pack (250 Tokens)")
    if (skuLower === 'bizztokens' || nameStr.toLowerCase().includes('bizztokens')) {
      const match = nameStr.match(/(\d+(?:\.\d+)?)\s*tokens?/i);
      if (match) {
        total += Number(match[1]) || 0;
      } else if (Number(tx.invoiceValue) > 0) {
        total += Math.round(Number(tx.invoiceValue) / 5);
      }
      continue;
    }

    // Paid app/course solution purchase -> 20% token reward
    const matchedProduct = INITIAL_CMS_PRODUCTS.find(
      (p) =>
        (p.sku && p.sku.toLowerCase() === skuLower) ||
        p.id.toLowerCase() === skuLower ||
        p.name.toLowerCase().trim() === nameStr.toLowerCase().trim()
    );

    if (matchedProduct && typeof matchedProduct.tokensAllocated === 'number') {
      total += matchedProduct.tokensAllocated * Math.max(1, Number(tx.quantity) || 1);
    } else if (Number(tx.invoiceValue) > 0) {
      total += Math.round(Number(tx.invoiceValue) * 0.2 * 10) / 10;
    }
  }

  return normalizeTokenAmount(total);
}

/**
 * Persists an authoritative per-user token balance to:
 * 1) Per-user localStorage (`bizzdesk_token_balance_v2_{email}`)
 * 2) Client Profiles cache & Cloud Firestore `client_profiles/{email}`
 * 3) Cloud Firestore `users/{uid}` (when `uid` is available)
 * 4) Dispatches `bizz-token-balance-updated` event with `{ email, balance }`
 */
export async function persistUserTokenBalance(
  email: string,
  newBalance: number,
  options?: { uid?: string; skipProfileUpsert?: boolean }
): Promise<number> {
  const emailNorm = normalizeEmail(email);
  const cleanBalance = normalizeTokenAmount(newBalance);
  if (!emailNorm) return 0;

  purgeLegacySharedTokenKeys();
  writeLocalUserTokenBalance(emailNorm, cleanBalance);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(USER_TOKEN_BALANCE_EVENT, {
        detail: { email: emailNorm, balance: cleanBalance },
      })
    );
  }

  // Keep unified Client Directory & Firestore client_profiles/{email} synchronized
  if (!options?.skipProfileUpsert) {
    await upsertClientProfile({
      email: emailNorm,
      uid: options?.uid,
      tokens: cleanBalance,
    }).catch((err) => handleTokenFirestoreError('upsert client_profile tokens', err));
  } else if (!isFirestoreQuotaExceeded()) {
    try {
      const docId = safeEmailDocId(emailNorm);
      await setDoc(
        doc(db, 'client_profiles', docId),
        {
          email: emailNorm,
          tokens: cleanBalance,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleTokenFirestoreError('write client_profiles tokens', err);
    }
  }

  // Also synchronize to Firestore users/{uid} when UID is known
  const targetUid =
    options?.uid ||
    getCachedClientProfiles().find((p) => normalizeEmail(p.email) === emailNorm)?.uid;

  if (targetUid && !isFirestoreQuotaExceeded()) {
    try {
      await setDoc(
        doc(db, 'users', targetUid),
        {
          tokens: cleanBalance,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleTokenFirestoreError('write users/{uid} tokens', err);
    }
  }

  return cleanBalance;
}

/**
 * Loads the authoritative token balance for a specific signed-in user from Cloud Firestore
 * (`client_profiles/{email}` and `users/{uid}`), with graceful offline fallback and
 * automatic derivation from real recorded transactions for legacy profiles missing `tokens`.
 *
 * Never falls back to a hardcoded 250 / 500 / 15000 amount.
 */
export async function loadAuthoritativeUserTokenBalance(
  email: string,
  uid?: string
): Promise<number> {
  const emailNorm = normalizeEmail(email);
  if (!emailNorm) return 0;

  purgeLegacySharedTokenKeys();

  let cloudProfileTokens: number | null = null;
  let cloudUserTokens: number | null = null;
  let resolvedUid = uid;

  if (!isFirestoreQuotaExceeded()) {
    try {
      const docId = safeEmailDocId(emailNorm);
      const cpSnap = await getDoc(doc(db, 'client_profiles', docId));
      if (cpSnap.exists()) {
        const data = cpSnap.data() as any;
        if (isValidStoredTokenNumber(data?.tokens)) {
          cloudProfileTokens = normalizeTokenAmount(data.tokens);
        }
        if (!resolvedUid && typeof data?.uid === 'string' && data.uid.trim()) {
          resolvedUid = data.uid.trim();
        }
      }
    } catch (err) {
      handleTokenFirestoreError('read client_profiles/{email}', err);
    }

    if (resolvedUid && !isFirestoreQuotaExceeded()) {
      try {
        const uSnap = await getDoc(doc(db, 'users', resolvedUid));
        if (uSnap.exists()) {
          const data = uSnap.data() as any;
          if (isValidStoredTokenNumber(data?.tokens)) {
            cloudUserTokens = normalizeTokenAmount(data.tokens);
          }
        }
      } catch (err) {
        handleTokenFirestoreError('read users/{uid}', err);
      }
    }
  }

  // 1. Authoritative cloud value found in client_profiles/{email}
  if (cloudProfileTokens !== null) {
    writeLocalUserTokenBalance(emailNorm, cloudProfileTokens);
    // Backfill users/{uid} if it didn't have tokens saved yet
    if (resolvedUid && cloudUserTokens === null && !isFirestoreQuotaExceeded()) {
      setDoc(
        doc(db, 'users', resolvedUid),
        { tokens: cloudProfileTokens, updatedAt: new Date().toISOString() },
        { merge: true }
      ).catch(() => {});
    }
    return cloudProfileTokens;
  }

  // 2. Authoritative cloud value found in users/{uid}
  if (cloudUserTokens !== null) {
    await persistUserTokenBalance(emailNorm, cloudUserTokens, {
      uid: resolvedUid,
      skipProfileUpsert: true,
    });
    return cloudUserTokens;
  }

  // 3. Per-user local cache (if previously persisted on this device)
  const localCached = getCachedUserTokenBalance(emailNorm);
  if (localCached !== null) {
    return localCached;
  }

  // 4. Legacy user with no stored `tokens` field yet: derive truthfully from their real transactions (0 if none)
  let txs = getCachedTransactions();
  if (!isFirestoreQuotaExceeded()) {
    try {
      txs = await loadTransactionsFromCloud();
    } catch {}
  }
  const derived = deriveTokensFromTransactions(emailNorm, txs);
  writeLocalUserTokenBalance(emailNorm, derived);
  return derived;
}

/**
 * Adjusts a specific user's token balance by `delta` (positive for credits/purchases,
 * negative for deductions) and persists the updated balance to Firestore and per-user cache.
 */
export async function adjustUserTokenBalance(
  email: string,
  delta: number,
  options?: { uid?: string; currentKnownBalance?: number }
): Promise<number> {
  const emailNorm = normalizeEmail(email);
  if (!emailNorm) return 0;

  const base =
    typeof options?.currentKnownBalance === 'number' && Number.isFinite(options.currentKnownBalance)
      ? options.currentKnownBalance
      : await loadAuthoritativeUserTokenBalance(emailNorm, options?.uid);

  const nextBalance = normalizeTokenAmount(Math.max(0, base + delta));
  return persistUserTokenBalance(emailNorm, nextBalance, { uid: options?.uid });
}
