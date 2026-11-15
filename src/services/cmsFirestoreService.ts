import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded } from '../lib/firebase';
import {
  CmsProduct,
  CmsVideo,
  CmsArticle,
  CmsPromotionSection,
  CMS_BUNDLE_GENERATED_AT,
} from '../data/cmsConsoleData';

export const CMS_CONFIG_COLLECTION = 'cms_config';
const FIRESTORE_SAFE_CHUNK_BYTES = 450_000;

// Serialize CMS Firestore writes so large chunked payloads and rapid edits never overwhelm one WriteStream
let cmsWriteQueue: Promise<unknown> = Promise.resolve();
function enqueueCmsWrite<T>(task: () => Promise<T>): Promise<T> {
  const run = cmsWriteQueue.then(task, task);
  cmsWriteQueue = run.catch(() => undefined);
  return run;
}

/**
 * Handles Firestore errors gracefully, detecting and caching quota limits so network retry storms are silenced.
 */
function handleFirestoreError(operation: string, err: any): void {
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
    console.warn(`Firestore daily write quota reached during ${operation}. Switched authoritatively to local storage.`);
    return;
  }
  console.warn(`Firestore ${operation} notice:`, err);
}

/**
 * Sanitizes and cleans data for Firestore:
 * - Strips `undefined` values (which causes Firestore setDoc to throw fatal error)
 */
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

function withFirestoreTimeout<T>(promise: Promise<T>, ms = 12000, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Prevents stale Cloud Firestore snapshots (saved prior to a newer GitHub cmsConsoleData.ts deploy)
 * from overwriting updated prices/content baked into the freshly deployed bundle.
 */
function isFirestoreFreshForBundle(fsUpdatedAt?: unknown): boolean {
  const bundleMs = Date.parse(CMS_BUNDLE_GENERATED_AT);
  if (isNaN(bundleMs)) return true;
  if (typeof fsUpdatedAt !== 'string' || !fsUpdatedAt.trim()) return true;
  const fsMs = Date.parse(fsUpdatedAt);
  if (isNaN(fsMs)) return true;
  return fsMs >= bundleMs;
}

function estimateUtf8Bytes(value: unknown): number {
  const json = JSON.stringify(value) || '';
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(json).length;
  }
  return json.length * 2;
}

/**
 * Reads an array CMS collection doc from Firestore, transparently reassembling
 * chunked documents when items exceed Firestore's 1 MiB single-document limit.
 */
async function readCmsItemsDoc<T>(
  docName: string,
  operation: string
): Promise<T[] | null> {
  if (isFirestoreQuotaExceeded()) return null;
  try {
    const docRef = doc(db, CMS_CONFIG_COLLECTION, docName);
    const snap = await withFirestoreTimeout(getDoc(docRef), 8000, null);
    if (!snap || !snap.exists()) return null;
    const data = snap.data();
    if (!data) return null;
    if (!isFirestoreFreshForBundle(data.updatedAt)) {
      console.info(
        `[CMS Sync] Skipping older Firestore "${docName}" (${data.updatedAt}) in favor of newer deployed bundle (${CMS_BUNDLE_GENERATED_AT}).`
      );
      return null;
    }
    return await extractItemsFromDocData<T>(docName, data);
  } catch (err) {
    handleFirestoreError(operation, err);
    return null;
  }
}

async function extractItemsFromDocData<T>(
  docName: string,
  data: Record<string, any>
): Promise<T[] | null> {
  if (!isFirestoreFreshForBundle(data.updatedAt)) {
    return null;
  }
  if (data.chunked === true && typeof data.chunkCount === 'number' && data.chunkCount > 0) {
    const combined: T[] = [];
    for (let i = 0; i < data.chunkCount; i++) {
      const chunkRef = doc(db, CMS_CONFIG_COLLECTION, `${docName}_chunk_${i}`);
      const chunkSnap = await withFirestoreTimeout(getDoc(chunkRef), 8000, null);
      if (!chunkSnap || !chunkSnap.exists()) {
        return null;
      }
      const chunkItems = chunkSnap.data()?.items;
      if (Array.isArray(chunkItems)) {
        combined.push(...(chunkItems as T[]));
      }
    }
    return combined.length > 0 ? combined : null;
  }
  if (Array.isArray(data.items) && data.items.length > 0) {
    return data.items as T[];
  }
  return null;
}

/**
 * Saves an array CMS collection doc to Firestore, automatically splitting into
 * <450 KB chunks when total serialized size approaches Firestore's 1 MiB limit.
 */
async function writeCmsItemsDoc<T>(
  docName: string,
  items: T[],
  operation: string
): Promise<boolean> {
  return enqueueCmsWrite(async () => {
    if (isFirestoreQuotaExceeded()) return false;
    try {
      const sanitized = sanitizeForFirestore(items);
      const updatedAt = new Date().toISOString();
      const totalBytes = estimateUtf8Bytes(sanitized);

      if (totalBytes <= FIRESTORE_SAFE_CHUNK_BYTES) {
        const docRef = doc(db, CMS_CONFIG_COLLECTION, docName);
        return await withFirestoreTimeout(
          setDoc(docRef, {
            items: sanitized,
            chunked: false,
            updatedAt,
            count: sanitized.length,
          })
            .then(() => true)
            .catch((err) => {
              handleFirestoreError(operation, err);
              return false;
            }),
          15000,
          false
        );
      }

      // Split into safe chunks under 450 KB each (handles large article libraries / base64 covers)
      const chunks: T[][] = [];
      let currentChunk: T[] = [];
      let currentBytes = 32;

      for (const item of sanitized) {
        const itemBytes = estimateUtf8Bytes(item);
        if (currentChunk.length > 0 && currentBytes + itemBytes > FIRESTORE_SAFE_CHUNK_BYTES) {
          chunks.push(currentChunk);
          currentChunk = [item];
          currentBytes = 32 + itemBytes;
        } else {
          currentChunk.push(item);
          currentBytes += itemBytes;
        }
      }
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }

      for (let i = 0; i < chunks.length; i++) {
        const chunkRef = doc(db, CMS_CONFIG_COLLECTION, `${docName}_chunk_${i}`);
        const chunkOk = await withFirestoreTimeout(
          setDoc(chunkRef, {
            items: chunks[i],
            chunkIndex: i,
            updatedAt,
          })
            .then(() => true)
            .catch((err) => {
              handleFirestoreError(`${operation} chunk ${i}`, err);
              return false;
            }),
          15000,
          false
        );
        if (!chunkOk) return false;
      }

      const manifestRef = doc(db, CMS_CONFIG_COLLECTION, docName);
      return await withFirestoreTimeout(
        setDoc(manifestRef, {
          chunked: true,
          chunkCount: chunks.length,
          updatedAt,
          count: sanitized.length,
        })
          .then(() => true)
          .catch((err) => {
            handleFirestoreError(`${operation} manifest`, err);
            return false;
          }),
        15000,
        false
      );
    } catch (err) {
      handleFirestoreError(operation, err);
      return false;
    }
  });
}

/**
 * Fetch persistent CMS Products from Firestore.
 */
export async function fetchCmsProductsFromFirestore(): Promise<CmsProduct[] | null> {
  return readCmsItemsDoc<CmsProduct>('products', 'fetch products');
}

/**
 * Save persistent CMS Products to Firestore.
 */
export async function saveCmsProductsToFirestore(products: CmsProduct[]): Promise<boolean> {
  return writeCmsItemsDoc('products', products, 'save products');
}

/**
 * Fetch persistent CMS Videos from Firestore.
 */
export async function fetchCmsVideosFromFirestore(): Promise<CmsVideo[] | null> {
  return readCmsItemsDoc<CmsVideo>('videos', 'fetch videos');
}

/**
 * Save persistent CMS Videos to Firestore.
 */
export async function saveCmsVideosToFirestore(videos: CmsVideo[]): Promise<boolean> {
  return writeCmsItemsDoc('videos', videos, 'save videos');
}

/**
 * Fetch persistent CMS Articles from Firestore.
 */
export async function fetchCmsArticlesFromFirestore(): Promise<CmsArticle[] | null> {
  const items = await readCmsItemsDoc<CmsArticle>('articles', 'fetch articles');
  if (items) {
    items.forEach((item, idx) => {
      if (!item.seq || isNaN(item.seq)) {
        item.seq = idx + 1;
      }
    });
  }
  return items;
}

/**
 * Save persistent CMS Articles to Firestore.
 */
export async function saveCmsArticlesToFirestore(articles: CmsArticle[]): Promise<boolean> {
  return writeCmsItemsDoc('articles', articles, 'save articles');
}

/**
 * Fetch persistent CMS Promotions from Firestore.
 */
export async function fetchCmsPromotionsFromFirestore(): Promise<CmsPromotionSection[] | null> {
  const items = await readCmsItemsDoc<CmsPromotionSection>('promotions', 'fetch promotions');
  if (!items) return null;
  return items.filter(
    (p: any) =>
      p &&
      p.id !== 'search' &&
      p.name !== 'search' &&
      !(p.displayName && p.displayName.toLowerCase().includes('gemini search'))
  );
}

/**
 * Save persistent CMS Promotions to Firestore.
 */
export async function saveCmsPromotionsToFirestore(promotions: CmsPromotionSection[]): Promise<boolean> {
  const filtered = promotions.filter(
    (p) =>
      p &&
      p.id !== 'search' &&
      p.name !== 'search' &&
      !(p.displayName && p.displayName.toLowerCase().includes('gemini search'))
  );
  return writeCmsItemsDoc('promotions', filtered, 'save promotions');
}

/**
 * Real-time listener for CMS products in Firestore
 */
export function subscribeToCmsProducts(
  onUpdate: (products: CmsProduct[]) => void
): () => void {
  if (isFirestoreQuotaExceeded()) return () => {};
  try {
    const docRef = doc(db, CMS_CONFIG_COLLECTION, 'products');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data) {
            extractItemsFromDocData<CmsProduct>('products', data)
              .then((items) => {
                if (items && items.length > 0) onUpdate(items);
              })
              .catch(() => {});
          }
        }
      },
      (err) => {
        handleFirestoreError('products listener', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError('subscribe products', err);
    return () => {};
  }
}

/**
 * Real-time listener for CMS promotions in Firestore
 */
export function subscribeToCmsPromotions(
  onUpdate: (promotions: CmsPromotionSection[]) => void
): () => void {
  if (isFirestoreQuotaExceeded()) return () => {};
  try {
    const docRef = doc(db, CMS_CONFIG_COLLECTION, 'promotions');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data) {
            extractItemsFromDocData<CmsPromotionSection>('promotions', data)
              .then((items) => {
                if (items && items.length > 0) {
                  onUpdate(
                    items.filter(
                      (p: any) =>
                        p &&
                        p.id !== 'search' &&
                        p.name !== 'search' &&
                        !(p.displayName && p.displayName.toLowerCase().includes('gemini search'))
                    )
                  );
                }
              })
              .catch(() => {});
          }
        }
      },
      (err) => {
        handleFirestoreError('promotions listener', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError('subscribe promotions', err);
    return () => {};
  }
}

/**
 * Real-time listener for CMS videos in Firestore
 */
export function subscribeToCmsVideos(
  onUpdate: (videos: CmsVideo[]) => void
): () => void {
  if (isFirestoreQuotaExceeded()) return () => {};
  try {
    const docRef = doc(db, CMS_CONFIG_COLLECTION, 'videos');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data) {
            extractItemsFromDocData<CmsVideo>('videos', data)
              .then((items) => {
                if (items && items.length > 0) onUpdate(items);
              })
              .catch(() => {});
          }
        }
      },
      (err) => {
        handleFirestoreError('videos listener', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError('subscribe videos', err);
    return () => {};
  }
}

/**
 * Real-time listener for CMS articles in Firestore
 */
export function subscribeToCmsArticles(
  onUpdate: (articles: CmsArticle[]) => void
): () => void {
  if (isFirestoreQuotaExceeded()) return () => {};
  try {
    const docRef = doc(db, CMS_CONFIG_COLLECTION, 'articles');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data) {
            extractItemsFromDocData<CmsArticle>('articles', data)
              .then((items) => {
                if (items && items.length > 0) {
                  items.forEach((item, idx) => {
                    if (!item.seq || isNaN(item.seq)) item.seq = idx + 1;
                  });
                  onUpdate(items);
                }
              })
              .catch(() => {});
          }
        }
      },
      (err) => {
        handleFirestoreError('articles listener', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError('subscribe articles', err);
    return () => {};
  }
}
