import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App defensively
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore with the configured Database ID
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

let quotaExceededFlag = false;

// Check if quota limit has been flagged
export function isFirestoreQuotaExceeded(): boolean {
  if (quotaExceededFlag) return true;
  try {
    if (
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('bb_firestore_quota_exceeded') === 'true') ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('bb_firestore_quota_exceeded') === 'true')
    ) {
      quotaExceededFlag = true;
      return true;
    }
  } catch {
    // Ignore storage access errors in restricted iframe
  }
  return false;
}

// Mark Firestore quota as exceeded to immediately halt all further write requests and backoff loops
export function setFirestoreQuotaExceeded(): void {
  quotaExceededFlag = true;
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('bb_firestore_quota_exceeded', 'true');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('bb_firestore_quota_exceeded', 'true');
    }
  } catch {
    // Ignore storage access errors
  }
}

export default app;

