import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App defensively
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore with the configured Database ID
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Suppress noisy internal retry backoff logs
try {
  setLogLevel('silent');
} catch {}

let quotaExceededTimestamp = 0;
const QUOTA_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours (daily write quota resets once per day)

// Pre-initialize from persistent local storage immediately
try {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('bb_firestore_quota_exceeded');
    if (raw) {
      const ts = parseInt(raw, 10);
      if (!isNaN(ts) && Date.now() - ts < QUOTA_EXPIRY_MS) {
        quotaExceededTimestamp = ts;
      }
    }
  }
} catch {}

// Validate initial connection to Firestore on boot (without toggling network state)
async function testConnection() {
  if (typeof window === 'undefined' || quotaExceededTimestamp > 0) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Catch global unhandled promise rejections specifically for Firestore write quota exhaustion
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = String(reason?.message || reason || '');
    const code = String(reason?.code || '');
    if (
      code === 'resource-exhausted' ||
      code.includes('resource-exhausted') ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('Quota limit exceeded') ||
      msg.includes('Free daily write units')
    ) {
      setFirestoreQuotaExceeded();
      event.preventDefault(); // Stop console error escalation
    }
  });
}

// Check if quota limit has been flagged
export function isFirestoreQuotaExceeded(): boolean {
  const now = Date.now();
  if (quotaExceededTimestamp > 0 && now - quotaExceededTimestamp < QUOTA_EXPIRY_MS) {
    return true;
  }
  try {
    let raw =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('bb_firestore_quota_exceeded')
        : null;
    if (!raw && typeof sessionStorage !== 'undefined') {
      raw = sessionStorage.getItem('bb_firestore_quota_exceeded');
    }
    if (raw) {
      const ts = parseInt(raw, 10);
      if (!isNaN(ts) && now - ts < QUOTA_EXPIRY_MS) {
        quotaExceededTimestamp = ts;
        return true;
      } else {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('bb_firestore_quota_exceeded');
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('bb_firestore_quota_exceeded');
        }
      }
    }
  } catch {
    // Ignore storage access errors in restricted iframe
  }
  quotaExceededTimestamp = 0;
  return false;
}

// Mark Firestore quota as exceeded with a timestamp that persists for 12 hours.
// Note: Intentionally avoids calling disableNetwork/enableNetwork mid-session because
// toggling network while PersistentWriteStream has in-flight writes triggers SDK b815/MutationBatchResult errors.
export function setFirestoreQuotaExceeded(): void {
  const now = Date.now();
  quotaExceededTimestamp = now;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('bb_firestore_quota_exceeded', now.toString());
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('bb_firestore_quota_exceeded', now.toString());
    }
  } catch {
    // Ignore storage access errors
  }
}

// Clear cached quota flag for explicit user-triggered publish/retry actions
export async function clearFirestoreQuotaExceeded(): Promise<void> {
  quotaExceededTimestamp = 0;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('bb_firestore_quota_exceeded');
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('bb_firestore_quota_exceeded');
    }
  } catch {
    // Ignore storage access errors
  }
}

export default app;
