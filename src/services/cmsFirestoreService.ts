import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded } from '../lib/firebase';
import {
  CmsProduct,
  CmsVideo,
  CmsArticle,
  CmsPromotionSection,
  INITIAL_CMS_PRODUCTS,
  INITIAL_CMS_VIDEOS,
  INITIAL_CMS_ARTICLES,
  INITIAL_CMS_PROMOTIONS,
} from '../data/cmsConsoleData';
import { safeSaveStorage } from '../utils/imageStorage';

export const CMS_CONFIG_COLLECTION = 'cms_config';

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
 * - Ensures document payload remains safely under Firestore 1MB quota
 */
function sanitizeForFirestore<T>(data: T): T {
  try {
    return JSON.parse(
      JSON.stringify(data, (key, value) => {
        if (value === undefined) return null;
        return value;
      })
    );
  } catch {
    return data;
  }
}

function withFirestoreTimeout<T>(promise: Promise<T>, ms = 6000, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Fetch persistent CMS Products from Firestore.
 */
export async function fetchCmsProductsFromFirestore(): Promise<CmsProduct[] | null> {
  if (isFirestoreQuotaExceeded()) return null;
  try {
    const docRef = doc(db, CMS_CONFIG_COLLECTION, 'products');
    const snap = await withFirestoreTimeout(getDoc(docRef), 6000, null);
    if (snap && snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return data.items as CmsProduct[];
      }
    }
  } catch (err) {
    handleFirestoreError('fetch products', err);
  }
  return null;
}

/**
 * Save persistent CMS Products to Firestore.
 */
export async function saveCmsProductsToFirestore(products: CmsProduct[]): Promise<boolean> {
  if (isFirestoreQuotaExceeded()) return false;
  try {
    const docRef = doc(db, CMS_CONFIG_COLLECTION, 'products');
    const ok = await withFirestoreTimeout(
      setDoc(docRef, {
        items: sanitizeForFirestore(products),
        updatedAt: new Date().toISOString(),
        count: products.length,
      })
        .then(() => true)
        .catch((err) => {
          handleFirestoreError('save products', err);
          return false;
        }),
      6000,
      false
    );
    return ok;
  } catch (err) {
    handleFirestoreError('save products', err);
    return false;
  }
}

/**
 * Fetch persistent CMS Videos from Firestore.
 */
export async function fetchCmsVideosFromFirestore(): Promise<CmsVideo[] | null> {
  if (isFirestoreQuotaExceeded()) return null;
  try {
    const docRef = doc(db, CMS_CONFIG_COLLECTION, 'videos');
    const snap = await withFirestoreTimeout(getDoc(docRef), 6000, null);
    if (snap && snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return data.items as CmsVideo[];
      }
    }
  } catch (err) {
    handleFirestoreError('fetch videos', err);
  }
  return null;
}

/**
 * Save persistent CMS Videos to Firestore.
 */
export async function saveCmsVideosToFirestore(videos: CmsVideo[]): Promise<boolean> {
  if (isFirestoreQuotaExceeded()) return false;
  try {
    const docRef = doc(db, CMS_CONFIG_COLLECTION, 'videos');
    const ok = await withFirestoreTimeout(
      setDoc(docRef, {
        items: sanitizeForFirestore(videos),
        updatedAt: new Date().toISOString(),
        count: videos.length,
      })
        .then(() => true)
        .catch((err) => {
          handleFirestoreError('save videos', err);
          return false;
        }),
      6000,
      false
    );
    return ok;
  } catch (err) {
    handleFirestoreError('save videos', err);
    return false;
  }
}

/**
 * Fetch persistent CMS Articles from Firestore.
 */
export async function fetchCmsArticlesFromFirestore(): Promise<CmsArticle[] | null> {
  if (isFirestoreQuotaExceeded()) return null;
  try {
    const docRef = doc(db, CMS_CONFIG_COLLECTION, 'articles');
    const snap = await withFirestoreTimeout(getDoc(docRef), 6000, null);
    if (snap && snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        const items = data.items as CmsArticle[];
        items.forEach((item, idx) => {
          if (!item.seq || isNaN(item.seq)) {
            item.seq = idx + 1;
          }
        });
        return items;
      }
    }
  } catch (err) {
    handleFirestoreError('fetch articles', err);
  }
  return null;
}

/**
 * Save persistent CMS Articles to Firestore.
 */
export async function saveCmsArticlesToFirestore(articles: CmsArticle[]): Promise<boolean> {
  if (isFirestoreQuotaExceeded()) return false;
  try {
    const docRef = doc(db, CMS_CONFIG_COLLECTION, 'articles');
    const ok = await withFirestoreTimeout(
      setDoc(docRef, {
        items: sanitizeForFirestore(articles),
        updatedAt: new Date().toISOString(),
        count: articles.length,
      })
        .then(() => true)
        .catch((err) => {
          handleFirestoreError('save articles', err);
          return false;
        }),
      6000,
      false
    );
    return ok;
  } catch (err) {
    handleFirestoreError('save articles', err);
    return false;
  }
}

/**
 * Fetch persistent CMS Promotions from Firestore.
 */
export async function fetchCmsPromotionsFromFirestore(): Promise<CmsPromotionSection[] | null> {
  if (isFirestoreQuotaExceeded()) return null;
  try {
    const docRef = doc(db, CMS_CONFIG_COLLECTION, 'promotions');
    const snap = await withFirestoreTimeout(getDoc(docRef), 6000, null);
    if (snap && snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return data.items.filter(
          (p: any) =>
            p &&
            p.id !== 'search' &&
            p.name !== 'search' &&
            !(p.displayName && p.displayName.toLowerCase().includes('gemini search'))
        ) as CmsPromotionSection[];
      }
    }
  } catch (err) {
    handleFirestoreError('fetch promotions', err);
  }
  return null;
}

/**
 * Save persistent CMS Promotions to Firestore.
 */
export async function saveCmsPromotionsToFirestore(promotions: CmsPromotionSection[]): Promise<boolean> {
  if (isFirestoreQuotaExceeded()) return false;
  try {
    const docRef = doc(db, CMS_CONFIG_COLLECTION, 'promotions');
    const filtered = promotions.filter(
      (p) =>
        p &&
        p.id !== 'search' &&
        p.name !== 'search' &&
        !(p.displayName && p.displayName.toLowerCase().includes('gemini search'))
    );
    const ok = await withFirestoreTimeout(
      setDoc(docRef, {
        items: sanitizeForFirestore(filtered),
        updatedAt: new Date().toISOString(),
        count: filtered.length,
      })
        .then(() => true)
        .catch((err) => {
          handleFirestoreError('save promotions', err);
          return false;
        }),
      6000,
      false
    );
    return ok;
  } catch (err: any) {
    handleFirestoreError('save promotions', err);
    return false;
  }
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
          if (data && Array.isArray(data.items) && data.items.length > 0) {
            onUpdate(data.items as CmsProduct[]);
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
          if (data && Array.isArray(data.items) && data.items.length > 0) {
            onUpdate(
              data.items.filter(
                (p: any) =>
                  p &&
                  p.id !== 'search' &&
                  p.name !== 'search' &&
                  !(p.displayName && p.displayName.toLowerCase().includes('gemini search'))
              ) as CmsPromotionSection[]
            );
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
          if (data && Array.isArray(data.items) && data.items.length > 0) {
            onUpdate(data.items as CmsVideo[]);
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
          if (data && Array.isArray(data.items) && data.items.length > 0) {
            onUpdate(data.items as CmsArticle[]);
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


