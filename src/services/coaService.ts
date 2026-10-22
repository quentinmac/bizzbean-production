import { db, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  CoaLineItem,
  CoaCategoryItem,
  INITIAL_COA_MASTER,
  INITIAL_COA_CATEGORIES,
} from '../data/coaData';

const LOCAL_STORAGE_COA_MASTER = 'bizzbean_coa_master_v1';
const LOCAL_STORAGE_COA_CATEGORIES = 'bizzbean_coa_categories_v1';

/**
 * Loads the active Chart of Accounts Master list.
 * 1. Attempts Firestore `cms_config/coa_master`
 * 2. Falls back to localStorage
 * 3. Falls back to INITIAL_COA_MASTER (extracted from bizzbean_COA MASTER.xlsm)
 */
export async function fetchCoaMaster(): Promise<CoaLineItem[]> {
  try {
    if (!isFirestoreQuotaExceeded()) {
      const snap = await getDoc(doc(db, 'cms_config', 'coa_master'));
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          localStorage.setItem(LOCAL_STORAGE_COA_MASTER, JSON.stringify(data.items));
          return data.items;
        }
      }
    }
  } catch (err: any) {
    console.warn('[COA Service] Firestore fetch error, falling back to local:', err?.message || err);
    if (err?.code === 'resource-exhausted' || (err?.message && err.message.includes('quota'))) {
      setFirestoreQuotaExceeded();
    }
  }

  try {
    const local = localStorage.getItem(LOCAL_STORAGE_COA_MASTER);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[COA Service] Local storage read error:', e);
  }

  // Initial seed from xlsm workbook
  return INITIAL_COA_MASTER;
}

/**
 * Saves the active Chart of Accounts Master list.
 */
export async function saveCoaMaster(items: CoaLineItem[]): Promise<boolean> {
  // Always update local storage first
  try {
    localStorage.setItem(LOCAL_STORAGE_COA_MASTER, JSON.stringify(items));
  } catch (e) {
    console.error('[COA Service] Local storage save failed:', e);
  }

  // Sync to Firestore if quota allows
  try {
    if (!isFirestoreQuotaExceeded()) {
      await setDoc(
        doc(db, 'cms_config', 'coa_master'),
        {
          items,
          totalCount: items.length,
          lastUpdated: new Date().toISOString(),
          version: 'v2',
        },
        { merge: true }
      );
      return true;
    }
  } catch (err: any) {
    console.warn('[COA Service] Firestore write error:', err?.message || err);
    if (err?.code === 'resource-exhausted' || (err?.message && err.message.includes('quota'))) {
      setFirestoreQuotaExceeded();
    }
  }

  return true;
}

/**
 * Loads the active Chart of Accounts Categories list.
 */
export async function fetchCoaCategories(): Promise<CoaCategoryItem[]> {
  try {
    if (!isFirestoreQuotaExceeded()) {
      const snap = await getDoc(doc(db, 'cms_config', 'coa_categories'));
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.categories) && data.categories.length > 0) {
          localStorage.setItem(LOCAL_STORAGE_COA_CATEGORIES, JSON.stringify(data.categories));
          return data.categories;
        }
      }
    }
  } catch (err: any) {
    console.warn('[COA Service] Firestore categories fetch error:', err?.message || err);
  }

  try {
    const local = localStorage.getItem(LOCAL_STORAGE_COA_CATEGORIES);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[COA Service] Local categories storage error:', e);
  }

  return INITIAL_COA_CATEGORIES;
}

/**
 * Saves the Chart of Accounts Categories list.
 */
export async function saveCoaCategories(categories: CoaCategoryItem[]): Promise<boolean> {
  try {
    localStorage.setItem(LOCAL_STORAGE_COA_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('[COA Service] Local categories save failed:', e);
  }

  try {
    if (!isFirestoreQuotaExceeded()) {
      await setDoc(
        doc(db, 'cms_config', 'coa_categories'),
        {
          categories,
          totalCount: categories.length,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
      return true;
    }
  } catch (err: any) {
    console.warn('[COA Service] Firestore categories write error:', err?.message || err);
  }

  return true;
}

/**
 * Resets COA to factory default from the master workbook.
 */
export function resetCoaMasterToDefault(): CoaLineItem[] {
  localStorage.removeItem(LOCAL_STORAGE_COA_MASTER);
  localStorage.removeItem(LOCAL_STORAGE_COA_CATEGORIES);
  return INITIAL_COA_MASTER;
}
