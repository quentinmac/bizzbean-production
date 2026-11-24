import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded } from '../lib/firebase';
import {
  BizzOptimizerHintsMap,
  PERFORMANCE_LEADERS,
  TOUCH_POINTS,
  cloneDefaultHints,
  ImprovementHintItem,
  LeaderHintsByTouchPoint,
} from '../apps/bizzmodel/data/bizzoptimizerDefaults';

const LOCAL_STORAGE_KEY = 'bizzbean_bizzoptimizer_hints_v1';
const FIRESTORE_COLLECTION = 'cms_config';
const FIRESTORE_DOC_ID = 'bizzoptimizer_hints';

export interface BizzOptimizerHintsPayload {
  hints: BizzOptimizerHintsMap;
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

/**
 * Ensures every Performance Leader and every Touch-Point key exists cleanly.
 */
function normalizeHintsMap(raw: any): BizzOptimizerHintsMap {
  const defaults = cloneDefaultHints();
  if (!raw || typeof raw !== 'object') return defaults;

  const normalized = {} as BizzOptimizerHintsMap;
  for (const leader of PERFORMANCE_LEADERS) {
    const rawLeader = raw[leader.id];
    const tpMap = {} as LeaderHintsByTouchPoint;
    for (const tp of TOUCH_POINTS) {
      const rawList = rawLeader?.[tp.key];
      if (Array.isArray(rawList)) {
        tpMap[tp.key] = rawList
          .map((item: any, idx: number): ImprovementHintItem => ({
            id: String(item?.id || `${leader.id}-${tp.key}-${idx + 1}`),
            text: String(item?.text || '').trim(),
          }))
          .filter((item) => item.text.length > 0);
      } else {
        tpMap[tp.key] = defaults[leader.id][tp.key];
      }
    }
    normalized[leader.id] = tpMap;
  }
  return normalized;
}

export function getDefaultHintsPayload(): BizzOptimizerHintsPayload {
  return {
    hints: cloneDefaultHints(),
    updatedAt: 0,
    version: 1,
  };
}

export function loadHintsLocal(): BizzOptimizerHintsPayload {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.hints && typeof parsed.hints === 'object') {
        return {
          hints: normalizeHintsMap(parsed.hints),
          updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
          version: typeof parsed.version === 'number' ? parsed.version : 1,
        };
      }
    }
  } catch {
    // ignore storage errors
  }
  return getDefaultHintsPayload();
}

function writeHintsLocal(payload: BizzOptimizerHintsPayload): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage quota errors
  }
}

export async function syncHintsFromCloud(): Promise<BizzOptimizerHintsPayload | null> {
  if (isFirestoreQuotaExceeded()) return null;
  try {
    const ref = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    const snap = await withTimeout(getDoc(ref), 8000, null);
    if (!snap || !snap.exists()) return null;

    const data = snap.data() as Partial<BizzOptimizerHintsPayload> | undefined;
    if (!data || !data.hints || typeof data.hints !== 'object') return null;

    const cloudUpdatedAt = typeof data.updatedAt === 'number' ? data.updatedAt : 0;
    const local = loadHintsLocal();

    if (cloudUpdatedAt >= local.updatedAt) {
      const merged: BizzOptimizerHintsPayload = {
        hints: normalizeHintsMap(data.hints),
        updatedAt: cloudUpdatedAt,
        version: typeof data.version === 'number' ? data.version : 1,
      };
      writeHintsLocal(merged);
      return merged;
    }
    return null;
  } catch (err) {
    handleQuotaIfNeeded(err);
    return null;
  }
}

export async function saveHintsDirectory(
  hints: BizzOptimizerHintsMap
): Promise<{ savedLocally: boolean; syncedToCloud: boolean }> {
  const payload: BizzOptimizerHintsPayload = {
    hints: normalizeHintsMap(hints),
    updatedAt: Date.now(),
    version: 1,
  };

  writeHintsLocal(payload);

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

export async function resetHintsToDefault(): Promise<BizzOptimizerHintsPayload> {
  const defaults: BizzOptimizerHintsPayload = {
    hints: cloneDefaultHints(),
    updatedAt: Date.now(),
    version: 1,
  };
  await saveHintsDirectory(defaults.hints);
  return defaults;
}
