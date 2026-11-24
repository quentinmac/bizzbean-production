import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded } from '../lib/firebase';
import {
  BizzBoxEntry,
  DEFAULT_BIZZBOX_ENTRIES,
  BIZZBOX_MODEL_DESCRIPTION_MAP,
} from '../apps/bizzmodel/data/bizzboxSeedData';

const LOCAL_STORAGE_KEY = 'bizzbean_bizzbox_directory_v1';
const FIRESTORE_COLLECTION = 'cms_config';
const FIRESTORE_DOC_ID = 'bizzbox_directory';

export interface BizzBoxDirectoryPayload {
  entries: BizzBoxEntry[];
  customModelDescriptions: Record<string, string>;
  updatedAt: number;
  version: number;
}

function sanitizeForFirestore<T>(data: T): T {
  try {
    return JSON.parse(
      JSON.stringify(data, (_key, value) => {
        if (value === undefined) return null;
        return value;
      })
    );
  } catch {
    return data;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

function handleQuotaIfNeeded(err: unknown): void {
  const errMsg = String((err as any)?.message || err || '');
  const errCode = String((err as any)?.code || '');
  if (
    errCode === 'resource-exhausted' ||
    errCode.includes('resource-exhausted') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('Quota limit exceeded')
  ) {
    setFirestoreQuotaExceeded();
  }
}

export function getDefaultBizzBoxPayload(): BizzBoxDirectoryPayload {
  return {
    entries: DEFAULT_BIZZBOX_ENTRIES.map((e) => ({ ...e })),
    customModelDescriptions: { ...BIZZBOX_MODEL_DESCRIPTION_MAP },
    updatedAt: 0,
    version: 1,
  };
}

/**
 * Synchronous read from localStorage for instant first paint.
 */
export function loadBizzBoxLocal(): BizzBoxDirectoryPayload {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.entries)) {
        return {
          entries: parsed.entries,
          customModelDescriptions: {
            ...BIZZBOX_MODEL_DESCRIPTION_MAP,
            ...(parsed.customModelDescriptions || {}),
          },
          updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
          version: typeof parsed.version === 'number' ? parsed.version : 1,
        };
      }
    }
  } catch {
    // ignore storage errors
  }
  return getDefaultBizzBoxPayload();
}

function writeBizzBoxLocal(payload: BizzBoxDirectoryPayload): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Fetches latest BizzBox directory from Firestore if newer than local copy.
 */
export async function syncBizzBoxFromCloud(): Promise<BizzBoxDirectoryPayload | null> {
  if (isFirestoreQuotaExceeded()) return null;
  try {
    const ref = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    const snap = await withTimeout(getDoc(ref), 8000, null);
    if (!snap || !snap.exists()) return null;

    const data = snap.data() as Partial<BizzBoxDirectoryPayload> | undefined;
    if (!data || !Array.isArray(data.entries)) return null;

    const cloudUpdatedAt = typeof data.updatedAt === 'number' ? data.updatedAt : 0;
    const local = loadBizzBoxLocal();

    if (cloudUpdatedAt >= local.updatedAt && data.entries.length > 0) {
      const merged: BizzBoxDirectoryPayload = {
        entries: data.entries.map((item: any, i: number) => ({
          id: String(item.id || `bb-cloud-${i + 1}`),
          businessType: String(item.businessType || '').trim(),
          category: String(item.category || '').trim(),
          modelSet: String(item.modelSet || '').trim(),
          ...(item.notes ? { notes: String(item.notes).trim() } : {}),
        })).filter((e) => e.businessType && e.modelSet),
        customModelDescriptions: {
          ...BIZZBOX_MODEL_DESCRIPTION_MAP,
          ...(data.customModelDescriptions || {}),
        },
        updatedAt: cloudUpdatedAt,
        version: typeof data.version === 'number' ? data.version : 1,
      };
      writeBizzBoxLocal(merged);
      return merged;
    }
    return null;
  } catch (err) {
    handleQuotaIfNeeded(err);
    return null;
  }
}

/**
 * Persists BizzBox directory immediately to localStorage and asynchronously to Firestore.
 */
export async function saveBizzBoxDirectory(
  entries: BizzBoxEntry[],
  customModelDescriptions: Record<string, string>
): Promise<{ savedLocally: boolean; syncedToCloud: boolean }> {
  const payload: BizzBoxDirectoryPayload = {
    entries,
    customModelDescriptions,
    updatedAt: Date.now(),
    version: 1,
  };

  writeBizzBoxLocal(payload);

  if (isFirestoreQuotaExceeded()) {
    return { savedLocally: true, syncedToCloud: false };
  }

  try {
    const ref = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    const clean = sanitizeForFirestore(payload);
    const ok = await withTimeout(
      setDoc(ref, clean).then(() => true),
      8000,
      false
    );
    return { savedLocally: true, syncedToCloud: ok };
  } catch (err) {
    handleQuotaIfNeeded(err);
    return { savedLocally: true, syncedToCloud: false };
  }
}

/**
 * Resets the directory back to the clean bizzbox.xlsx seed defaults.
 */
export async function resetBizzBoxDirectory(): Promise<BizzBoxDirectoryPayload> {
  const defaults: BizzBoxDirectoryPayload = {
    ...getDefaultBizzBoxPayload(),
    updatedAt: Date.now(),
  };
  await saveBizzBoxDirectory(defaults.entries, defaults.customModelDescriptions);
  return defaults;
}
