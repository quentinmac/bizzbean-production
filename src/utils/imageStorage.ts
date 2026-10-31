import {
  CmsArticle,
  CmsCourseLesson,
  CmsProduct,
  CmsPromotionSection,
  CmsVideo,
  INITIAL_CMS_PRODUCTS,
  INITIAL_CMS_PROMOTIONS,
  INITIAL_CMS_VIDEOS,
  INITIAL_CMS_ARTICLES,
} from '../data/cmsConsoleData';

export const CANONICAL_MASTER_COURSE_IDS = new Set<string>([
  'learn-earn-capital',
  'how-to-bizzcalc',
  'cost-recovery-calculator',
  'follow-the-money',
  'financial-reports',
  'your-first-hire',
  'profit-optimizer',
  'financial-scenario-planning',
  'annual-business-planning-cycle',
]);

// High-efficiency client-side image compression & robust storage utilities
// Prevents QuotaExceededError in localStorage by compressing images to lightweight ~50KB JPEGs

const DB_NAME = 'bizzdesk_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'cms_assets';

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbSet(key: string, value: any): Promise<void> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IDB put error', err);
  }
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IDB get error', err);
    return null;
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IDB delete error', err);
  }
}

/**
 * Compresses an image File or Data URL to a lightweight high-fidelity JPEG data-URL.
 * Keeps file size under ~70KB to prevent browser localStorage quota exhaustion.
 */
/**
 * Compresses an image File or Data URL to a lightweight high-fidelity JPEG data-URL.
 * Keeps file size under ~35KB to prevent browser localStorage quota exhaustion.
 */
export function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 500,
  quality = 0.65
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error('Failed to read file'));
        return;
      }
      compressDataUrl(result, maxWidth, maxHeight, quality)
        .then(resolve)
        .catch(() => resolve(result));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an existing Base64 Data URL using an HTML5 Canvas.
 * Fixes crossOrigin bug: data: URLs must NOT use crossOrigin='anonymous'.
 */
export function compressDataUrl(
  dataUrl: string,
  maxWidth = 800,
  maxHeight = 500,
  quality = 0.65
): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    // Do not set crossOrigin on data: URIs as it causes canvas taint or load failures in Chromium/Safari
    img.onload = () => {
      try {
        let width = img.width || 800;
        let height = img.height || 500;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (e) {
        console.warn('Canvas compression error, using original', e);
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Safely saves data to localStorage and mirrors to IndexedDB.
 */
export function safeSaveStorage(key: string, data: any): void {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (err) {
    console.warn(`localStorage quota warning for key "${key}". Relying on IndexedDB.`, err);
    // If saving the full dataset exceeds localStorage quota due to heavy base64 images,
    // preserve all text content, narrative, and metadata in localStorage while IDB stores full images
    try {
      if (Array.isArray(data)) {
        const lightweight = data.map((item) => {
          if (item && typeof item === 'object') {
            const clone = { ...item };
            if (typeof clone.imageUrl === 'string' && clone.imageUrl.startsWith('data:image')) {
              clone.imageUrl = '';
            }
            if (typeof clone.canonicalCoverUrl === 'string' && clone.canonicalCoverUrl.startsWith('data:image')) {
              clone.canonicalCoverUrl = '';
            }
            return clone;
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(lightweight));
      }
    } catch {
      // IndexedDB handles the complete payload
    }
  }
  // Mirror to IndexedDB as high-capacity backing store
  idbSet(key, data).catch((e) => console.warn('IDB mirror error', e));
}

export const CMS_STORAGE_KEYS = {
  CACHE_VERSION: 'bizzdesk_cms_cache_v3',
  PRODUCTS: 'bizzdesk_cms_products_v3',
  PROMOTIONS: 'bizzdesk_cms_promotions_v3',
  VIDEOS: 'bizzdesk_cms_videos_v3',
  ARTICLES: 'bizzdesk_cms_articles_v3',
  DELETED_PRODUCTS: 'bizzdesk_cms_deleted_product_ids_v3',
  DELETED_PROMOTIONS: 'bizzdesk_cms_deleted_promotion_ids_v3',
  DELETED_VIDEOS: 'bizzdesk_cms_deleted_video_ids_v3',
  DELETED_ARTICLES: 'bizzdesk_cms_deleted_article_ids_v3',
} as const;

/**
 * Self-healing cache eviction: ensures that any stale v1 or v2 client storage
 * that holds outdated prices or obsolete images is purged automatically.
 */
export function ensureFreshCmsCache(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const currentVersion = localStorage.getItem('bizzdesk_cms_cache_version');
    if (currentVersion !== 'v8') {
      const keysToPurge = [
        'bizzdesk_cms_products_v1',
        'bizzdesk_cms_promotions_v1',
        'bizzdesk_cms_articles_v1',
        'bizzdesk_cms_videos_v1',
        'bizzdesk_cms_deleted_product_ids_v1',
        'bizzdesk_cms_deleted_promotion_ids_v1',
        'bizzdesk_cms_products_v2',
        'bizzdesk_cms_promotions_v2',
        'bizzdesk_cms_articles_v2',
        'bizzdesk_cms_videos_v2',
        'bizzdesk_cms_products_v3',
        CMS_STORAGE_KEYS.PRODUCTS,
      ];
      keysToPurge.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch (_) {}
      });
      localStorage.setItem('bizzdesk_cms_cache_version', 'v8');

      // Clear any accidental deletion blocks on essential courses (How to Use bizzcalc and Cost Recovery Calculator)
      const deletedRaw = localStorage.getItem(DELETED_PRODUCTS_KEY);
      if (deletedRaw) {
        try {
          const parsed = JSON.parse(deletedRaw);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter(
              (id: string) =>
                id !== 'how-to-bizzcalc' &&
                id !== 'cost-recovery-calculator' &&
                !id.toLowerCase().includes('how to use bizzcalc') &&
                !id.toLowerCase().includes('cost recovery')
            );
            localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(cleaned));
            idbSet(DELETED_PRODUCTS_KEY, cleaned).catch(() => {});
          }
        } catch (_) {}
      }

      localStorage.setItem('bizzdesk_cms_cache_version', 'v7');
    }
  } catch (e) {
    console.warn('Cache migration notice:', e);
  }
}

/**
 * Strips legacy unsplash fallback stock images from articles so only user-provided / uploaded images are rendered.
 * If an article has an Unsplash fallback image URL, it is cleaned to ''.
 */
export function cleanFallbackImagesFromArticles(articles: CmsArticle[]): CmsArticle[] {
  if (!Array.isArray(articles)) return [];
  const deletedIds = getDeletedArticleIds();
  return articles.filter((art) => art && art.id && !deletedIds.has(art.id));
}

const DELETED_PRODUCTS_KEY = CMS_STORAGE_KEYS.DELETED_PRODUCTS;

export function getDeletedProductIds(): Set<string> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DELETED_PRODUCTS_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(
          parsed.filter((id: string) => {
            const canon = getCanonicalCourseId(id) || id;
            return !CANONICAL_MASTER_COURSE_IDS.has(id) && !CANONICAL_MASTER_COURSE_IDS.has(canon);
          })
        );
      }
    }
  } catch (e) {
    console.warn('Failed to read deleted product IDs', e);
  }
  return new Set();
}

export function markProductAsDeleted(prodId: string): void {
  const canon = getCanonicalCourseId(prodId) || prodId;
  if (CANONICAL_MASTER_COURSE_IDS.has(prodId) || CANONICAL_MASTER_COURSE_IDS.has(canon)) {
    console.warn(`Cannot mark canonical master course "${prodId}" as deleted.`);
    return;
  }
  try {
    const set = getDeletedProductIds();
    set.add(prodId);
    const arr = Array.from(set);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(arr));
    }
    idbSet(DELETED_PRODUCTS_KEY, arr).catch(() => {});
  } catch (e) {
    console.warn('Failed to mark product as deleted', e);
  }
}

export function unmarkProductAsDeleted(prodIdOrName?: string, secondaryName?: string): void {
  if (!prodIdOrName && !secondaryName) return;
  try {
    const set = getDeletedProductIds();
    const toCheck = [
      prodIdOrName,
      secondaryName,
      prodIdOrName ? getCanonicalCourseId(prodIdOrName) : null,
      secondaryName ? getCanonicalCourseId(secondaryName) : null,
    ].filter(Boolean) as string[];

    toCheck.forEach((item) => {
      set.delete(item);
      set.delete(item.toLowerCase());
      set.delete(item.trim());
      set.delete(item.toLowerCase().trim());
    });

    const arr = Array.from(set);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(arr));
    }
    idbSet(DELETED_PRODUCTS_KEY, arr).catch(() => {});
  } catch (e) {
    console.warn('Failed to unmark product as deleted', e);
  }
}

const DELETED_PROMOTIONS_KEY = CMS_STORAGE_KEYS.DELETED_PROMOTIONS;

export function getDeletedPromotionIds(): Set<string> {
  const result = new Set<string>(['search']);
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DELETED_PROMOTIONS_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => result.add(id));
      }
    }
  } catch (e) {
    console.warn('Failed to read deleted promotion IDs', e);
  }
  return result;
}

export function markPromotionAsDeleted(promoId: string): void {
  try {
    const set = getDeletedPromotionIds();
    set.add(promoId);
    const arr = Array.from(set);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DELETED_PROMOTIONS_KEY, JSON.stringify(arr));
    }
    idbSet(DELETED_PROMOTIONS_KEY, arr).catch(() => {});
  } catch (e) {
    console.warn('Failed to mark promotion as deleted', e);
  }
}

export function unmarkPromotionAsDeleted(promoId: string): void {
  try {
    const set = getDeletedPromotionIds();
    set.delete(promoId);
    const arr = Array.from(set);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DELETED_PROMOTIONS_KEY, JSON.stringify(arr));
    }
    idbSet(DELETED_PROMOTIONS_KEY, arr).catch(() => {});
  } catch (e) {
    console.warn('Failed to unmark promotion as deleted', e);
  }
}

const DELETED_VIDEOS_KEY = CMS_STORAGE_KEYS.DELETED_VIDEOS;

export function getDeletedVideoIds(): Set<string> {
  const result = new Set<string>();
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DELETED_VIDEOS_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id: string) => result.add(id));
      }
    }
  } catch (e) {
    console.warn('Failed to read deleted video IDs', e);
  }
  return result;
}

export function markVideoAsDeleted(videoId: string): void {
  if (!videoId) return;
  try {
    const set = getDeletedVideoIds();
    set.add(videoId);
    const arr = Array.from(set);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DELETED_VIDEOS_KEY, JSON.stringify(arr));
    }
    idbSet(DELETED_VIDEOS_KEY, arr).catch(() => {});
  } catch (e) {
    console.warn('Failed to mark video as deleted', e);
  }
}

export function unmarkVideoAsDeleted(videoId: string): void {
  if (!videoId) return;
  try {
    const set = getDeletedVideoIds();
    set.delete(videoId);
    const arr = Array.from(set);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DELETED_VIDEOS_KEY, JSON.stringify(arr));
    }
    idbSet(DELETED_VIDEOS_KEY, arr).catch(() => {});
  } catch (e) {
    console.warn('Failed to unmark video as deleted', e);
  }
}

const DELETED_ARTICLES_KEY = CMS_STORAGE_KEYS.DELETED_ARTICLES;

export function getDeletedArticleIds(): Set<string> {
  const result = new Set<string>();
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DELETED_ARTICLES_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id: string) => result.add(id));
      }
    }
  } catch (e) {
    console.warn('Failed to read deleted article IDs', e);
  }
  return result;
}

export function markArticleAsDeleted(articleId: string): void {
  if (!articleId) return;
  try {
    const set = getDeletedArticleIds();
    set.add(articleId);
    const arr = Array.from(set);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DELETED_ARTICLES_KEY, JSON.stringify(arr));
    }
    idbSet(DELETED_ARTICLES_KEY, arr).catch(() => {});
  } catch (e) {
    console.warn('Failed to mark article as deleted', e);
  }
}

export function unmarkArticleAsDeleted(articleId: string): void {
  if (!articleId) return;
  try {
    const set = getDeletedArticleIds();
    set.delete(articleId);
    const arr = Array.from(set);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DELETED_ARTICLES_KEY, JSON.stringify(arr));
    }
    idbSet(DELETED_ARTICLES_KEY, arr).catch(() => {});
  } catch (e) {
    console.warn('Failed to unmark article as deleted', e);
  }
}

export const MASTER_COURSE_CURRICULA: Record<string, CmsCourseLesson[]> = {
  'cost recovery calculator': [
    { id: 'crc-1', name: '1 - INTRODUCTION', duration: '4 min', youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg' },
    { id: 'crc-2', name: '2 - PRODUCTION CALCULATOR', duration: '7 min', youtubeUrl: 'https://www.youtube.com/watch?v=9dwqCG-vnVA' },
    { id: 'crc-3', name: '3 - EMPLOYEE CALCULATOR', duration: '9 min', youtubeUrl: 'https://www.youtube.com/watch?v=5L0wwsNFads' },
    { id: 'crc-4', name: '4 - MATERIALS COSTING', duration: '6 min', youtubeUrl: 'https://www.youtube.com/watch?v=YiUirHhqBoc' },
    { id: 'crc-5', name: '5 - EXPENSE DYNAMICS', duration: '8 min', youtubeUrl: 'https://www.youtube.com/watch?v=r6h0R1sDx50' },
    { id: 'crc-6', name: '6 - FIXED ASSETS', duration: '7 min', youtubeUrl: 'https://www.youtube.com/watch?v=xbasHzq2fL0' },
    { id: 'crc-7', name: '7 - EMPLOYMENT EXPENSES', duration: '10 min', youtubeUrl: 'https://www.youtube.com/watch?v=DiVPAjgmnj0' },
  ],
  'learn how to earn access to capital': [
    { id: 'cl-1', name: '1 - THE FOUNDER HYPOTHESIS VS. REALITY', duration: '14 min', youtubeUrl: 'https://www.youtube.com/watch?v=9dwqCG-vnVA' },
    { id: 'cl-2', name: '2 - CALCULATING CLEAN CAC', duration: '18 min', youtubeUrl: 'https://www.youtube.com/watch?v=5L0wwsNFads' },
    { id: 'cl-3', name: '3 - CAPITAL ACCESS GATEWAY CHECKLIST', duration: '12 min', youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg' },
  ],
  'how to use bizzcalc': [
    { id: 'cl-b1', name: '1 - MAPPING FIXED VS VARIABLE ALLOCATIONS', duration: '11 min', youtubeUrl: 'https://www.youtube.com/watch?v=0--AvwZabIQ' },
    { id: 'cl-b2', name: '2 - REAL-WORLD PRICING AUDITS', duration: '16 min', youtubeUrl: 'https://www.youtube.com/watch?v=3wyZYsk8OTY' },
  ],
  'follow the money': [
    { id: 'ftm-1', name: '1 - CASH CONVERSION CYCLE', duration: '5 min', youtubeUrl: 'https://www.youtube.com/watch?v=xbasHzq2fL0' },
    { id: 'ftm-2', name: '2 - WORKING CAPITAL RECOVERY', duration: '8 min', youtubeUrl: 'https://www.youtube.com/watch?v=DiVPAjgmnj0' },
    { id: 'ftm-3', name: '3 - RECEIVABLES VELOCITY', duration: '12 min', youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg' },
  ],
  'financial reports': [
    { id: 'fr-1', name: '1 - 3-STATEMENT RECONCILIATION', duration: '6 min', youtubeUrl: 'https://www.youtube.com/watch?v=9dwqCG-vnVA' },
    { id: 'fr-2', name: '2 - EBITDA VS FREE CASH FLOW', duration: '10 min', youtubeUrl: 'https://www.youtube.com/watch?v=YiUirHhqBoc' },
    { id: 'fr-3', name: '3 - BALANCE SHEET STRESS TEST', duration: '14 min', youtubeUrl: 'https://www.youtube.com/watch?v=r6h0R1sDx50' },
  ],
  'profit optimizer': [
    { id: 'po-1', name: 'Lesson 01: Auditing Discretionary Overhead & Vendor Creep', duration: '14:10', youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg' },
    { id: 'po-2', name: 'Lesson 02: Recalibrating Unit Contribution Margins', duration: '16:30', youtubeUrl: 'https://www.youtube.com/watch?v=3wyZYsk8OTY' },
    { id: 'po-3', name: 'Lesson 03: The 18-Month Runway Safeguard Checklist', duration: '12:45', youtubeUrl: 'https://www.youtube.com/watch?v=xbasHzq2fL0' },
  ],
  'profit dynamics': [
    { id: 'pd-1', name: 'Lesson 01: Auditing Discretionary Overhead & Vendor Creep', duration: '14:10', youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg' },
    { id: 'pd-2', name: 'Lesson 02: Recalibrating Unit Contribution Margins', duration: '16:30', youtubeUrl: 'https://www.youtube.com/watch?v=3wyZYsk8OTY' },
    { id: 'pd-3', name: 'Lesson 03: The 18-Month Runway Safeguard Checklist', duration: '12:45', youtubeUrl: 'https://www.youtube.com/watch?v=xbasHzq2fL0' },
  ],
  'your first hire': [
    { id: 'yfh-1', name: '1 - FULLY BURDENED LABOR RATE', duration: '5 min', youtubeUrl: 'https://www.youtube.com/watch?v=0--AvwZabIQ' },
    { id: 'yfh-2', name: '2 - HIRING REVENUE MULTIPLE', duration: '9 min', youtubeUrl: 'https://www.youtube.com/watch?v=3wyZYsk8OTY' },
    { id: 'yfh-3', name: '3 - EMPLOYEE CONTRIBUTION QUOTA', duration: '8 min', youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg' },
  ],
  'financial scenario planning': [
    { id: 'fsp-1', name: '1 - BASE, BULL & BEAR SCENARIO MATRIX', duration: '8 min', youtubeUrl: 'https://www.youtube.com/watch?v=9dwqCG-vnVA' },
    { id: 'fsp-2', name: '2 - RUNWAY ALARM & WORKING CAPITAL DRIFT', duration: '12 min', youtubeUrl: 'https://www.youtube.com/watch?v=DiVPAjgmnj0' },
    { id: 'fsp-3', name: '3 - REVENUE DRIVERS & SENSITIVITY MODELING', duration: '15 min', youtubeUrl: 'https://www.youtube.com/watch?v=5L0wwsNFads' },
  ],
  'annual business planning cycle': [
    { id: 'abp-1', name: '1 - ANNUAL OPERATING CADENCE & MILESTONES', duration: '7 min', youtubeUrl: 'https://www.youtube.com/watch?v=YiUirHhqBoc' },
    { id: 'abp-2', name: '2 - DEPARTMENTAL BUDGET RECONCILIATION', duration: '11 min', youtubeUrl: 'https://www.youtube.com/watch?v=r6h0R1sDx50' },
    { id: 'abp-3', name: '3 - QUARTERLY VARIANCE AUDITS & BOARD PACK', duration: '14 min', youtubeUrl: 'https://www.youtube.com/watch?v=xbasHzq2fL0' },
  ],
};

export const BOGUS_YOUTUBE_IDS = [
  '02fG_p8_EPE',
  '1d_k8qF9s_U',
  'k4Z9vG4qF2M',
  '2e0y2_8y0A8',
  '9_2_kY3xR8o',
  '3vK_bA_G8rU',
  'naFEN5j5Q04',
];

export function isBogusLessonUrl(url?: string): boolean {
  if (!url || typeof url !== 'string' || !url.trim()) return false;
  return BOGUS_YOUTUBE_IDS.some((bad) => url.includes(bad));
}

/**
 * Robust curriculum resolver matching course names or IDs by exact name, slug, or keywords.
 */
export function findMasterCurriculum(nameOrId: string): CmsCourseLesson[] | null {
  if (!nameOrId) return null;
  const lower = nameOrId.toLowerCase().trim();
  if (MASTER_COURSE_CURRICULA[lower]) {
    return MASTER_COURSE_CURRICULA[lower];
  }
  if (lower.includes('cost recovery') || (lower.includes('cost') && lower.includes('calculator'))) {
    return MASTER_COURSE_CURRICULA['cost recovery calculator'];
  }
  if (lower.includes('earn access to capital') || lower.includes('learn-earn-capital') || lower.includes('capital access')) {
    return MASTER_COURSE_CURRICULA['learn how to earn access to capital'];
  }
  if (lower.includes('how to use bizzcalc') || lower.includes('how-to-bizzcalc')) {
    return MASTER_COURSE_CURRICULA['how to use bizzcalc'];
  }
  if (lower.includes('follow the money') || lower.includes('follow-the-money')) {
    return MASTER_COURSE_CURRICULA['follow the money'];
  }
  if (lower.includes('financial report') || lower.includes('financial-reports')) {
    return MASTER_COURSE_CURRICULA['financial reports'];
  }
  if (lower.includes('profit optimizer') || lower.includes('profit dynamics') || lower.includes('profit-optimizer')) {
    return MASTER_COURSE_CURRICULA['profit optimizer'];
  }
  if (lower.includes('first hire') || lower.includes('your-first-hire')) {
    return MASTER_COURSE_CURRICULA['your first hire'];
  }
  if (lower.includes('scenario') || lower.includes('financial scenario')) {
    return MASTER_COURSE_CURRICULA['financial scenario planning'];
  }
  if (lower.includes('annual') || lower.includes('planning cycle')) {
    return MASTER_COURSE_CURRICULA['annual business planning cycle'];
  }
  return null;
}

/**
 * Resolves standard canonical course ID for deduplication and cross-module routing.
 */
export function getCanonicalCourseId(nameOrId: string): string | null {
  if (!nameOrId) return null;
  const lower = nameOrId.toLowerCase().trim();
  if (lower.includes('cost recovery') || lower.includes('cost-recovery')) return 'cost-recovery-calculator';
  if (lower.includes('financial report') || lower.includes('financial-reports')) return 'financial-reports';
  if (lower.includes('how to use bizzcalc') || lower.includes('how-to-bizzcalc')) return 'how-to-bizzcalc';
  if (lower.includes('earn access to capital') || lower.includes('learn-earn-capital') || lower.includes('capital access')) return 'learn-earn-capital';
  if (lower.includes('follow the money') || lower.includes('follow-the-money')) return 'follow-the-money';
  if (lower.includes('first hire') || lower.includes('your-first-hire')) return 'your-first-hire';
  if (lower.includes('profit optimizer') || lower.includes('profit dynamics') || lower.includes('profit-optimizer')) return 'profit-optimizer';
  if (lower.includes('scenario planning') || lower.includes('scenario') || lower.includes('financial-scenario')) return 'financial-scenario-planning';
  if (lower.includes('annual business planning') || lower.includes('annual-business') || lower.includes('planning cycle') || lower.includes('planning-cycle')) return 'annual-business-planning-cycle';
  return null;
}

/**
 * Resolves a course in the given courses array using direct ID, canonical ID, name, keyword, or stage matching.
 * Guarantees that cost-recovery-calculator and specific course tracks never incorrectly fall back to learn-earn-capital.
 * STRICT: Only returns courses, never returns apps (e.g. sustain-runway).
 */
export function findMatchingCourse(
  targetIdOrName: string | undefined,
  courses: CmsProduct[]
): CmsProduct | undefined {
  if (!targetIdOrName || !courses || courses.length === 0) return undefined;
  const target = targetIdOrName.toLowerCase().trim();
  const cleanTarget = target.replace(/[-_]/g, ' ').trim();
  const canonicalTarget = getCanonicalCourseId(targetIdOrName) || getCanonicalCourseId(cleanTarget);

  // 1. Direct ID match
  let found = courses.find((c) => c && (c.id === targetIdOrName || c.id.toLowerCase() === target));
  if (found) return found;

  // 2. Canonical target match against course canonical ID or canonical name
  if (canonicalTarget) {
    found = courses.find((c) => {
      if (!c) return false;
      const cCanonId = getCanonicalCourseId(c.id) || getCanonicalCourseId(c.name);
      return c.id === canonicalTarget || cCanonId === canonicalTarget;
    });
    if (found) return found;
  }

  // 3. Exact name match (case-insensitive and clean spaces)
  found = courses.find((c) => {
    if (!c || !c.name) return false;
    const cName = c.name.toLowerCase().trim();
    const cClean = cName.replace(/[-_]/g, ' ').trim();
    return cName === target || cClean === cleanTarget || cName === cleanTarget || cClean === target;
  });
  if (found) return found;

  // 4. Keyword / phrase match
  if (target.includes('cost recovery') || target.includes('cost-recovery') || target.includes('cost_recovery')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id === 'cost-recovery-calculator' ||
          c.id.includes('cost-recovery') ||
          (c.name || '').toLowerCase().includes('cost recovery'))
    );
    if (found) return found;
  }
  if (target.includes('how to use bizzcalc') || target.includes('how-to-bizzcalc') || target.includes('use bizzcalc')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id === 'how-to-bizzcalc' ||
          c.id.includes('how-to-bizzcalc') ||
          (c.name || '').toLowerCase().includes('how to use bizzcalc'))
    );
    if (found) return found;
  }
  if (target.includes('profit optimizer') || target.includes('profit-optimizer') || target.includes('profit dynamics')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id === 'profit-optimizer' ||
          c.id.includes('profit-optimizer') ||
          (c.name || '').toLowerCase().includes('profit optimizer'))
    );
    if (found) return found;
  }
  if (target.includes('scenario planning') || target.includes('scenario-planning') || target.includes('financial scenario') || target.includes('scenario')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id === 'financial-scenario-planning' ||
          c.id.includes('scenario') ||
          (c.name || '').toLowerCase().includes('scenario planning'))
    );
    if (found) return found;
  }
  if (target.includes('annual business') || target.includes('annual-business') || target.includes('planning cycle') || target.includes('annual')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id === 'annual-business-planning-cycle' ||
          c.id.includes('annual') ||
          (c.name || '').toLowerCase().includes('annual business'))
    );
    if (found) return found;
  }
  if (target.includes('financial report') || target.includes('financial-report')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id === 'financial-reports' ||
          c.id.includes('financial-reports') ||
          (c.name || '').toLowerCase().includes('financial report'))
    );
    if (found) return found;
  }
  if (target.includes('follow the money') || target.includes('follow-the-money')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id === 'follow-the-money' ||
          c.id.includes('follow-the-money') ||
          (c.name || '').toLowerCase().includes('follow the money'))
    );
    if (found) return found;
  }
  if (target.includes('first hire') || target.includes('your-first-hire')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id === 'your-first-hire' ||
          c.id.includes('your-first-hire') ||
          (c.name || '').toLowerCase().includes('first hire'))
    );
    if (found) return found;
  }
  if (target.includes('capital') || target.includes('earn access') || target.includes('learn-earn')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id === 'learn-earn-capital' ||
          c.id.includes('learn-earn') ||
          (c.name || '').toLowerCase().includes('access to capital'))
    );
    if (found) return found;
  }

  // 5. Stage matching: if target is a stage (e.g. 'sustain-ability', 'fund-ability'), pick the primary course of that stage.
  // CRITICAL: NEVER return an app (like sustain-runway) for course matching!
  if (targetIdOrName === 'sustain-ability' || target.includes('sustain')) {
    found =
      courses.find((c) => c && c.id === 'profit-optimizer') ||
      courses.find((c) => c && c.id === 'financial-scenario-planning') ||
      courses.find((c) => c && c.id === 'annual-business-planning-cycle') ||
      courses.find(
        (c) =>
          c &&
          c.stage === 'sustain-ability' &&
          (c.type === 'course' || (c.courseLessons && c.courseLessons.length > 0))
      );
    if (found) return found;
  }
  if (targetIdOrName === 'fund-ability' || target.includes('fund')) {
    found =
      courses.find((c) => c && c.id === 'cost-recovery-calculator') ||
      courses.find((c) => c && c.id === 'follow-the-money') ||
      courses.find((c) => c && c.id === 'financial-reports') ||
      courses.find(
        (c) =>
          c &&
          c.stage === 'fund-ability' &&
          (c.type === 'course' || (c.courseLessons && c.courseLessons.length > 0))
      );
    if (found) return found;
  }
  if (targetIdOrName === 'vi-ability' || target.includes('vi-ability')) {
    found =
      courses.find((c) => c && c.id === 'learn-earn-capital') ||
      courses.find((c) => c && c.id === 'how-to-bizzcalc') ||
      courses.find(
        (c) =>
          c &&
          c.stage === 'vi-ability' &&
          (c.type === 'course' || (c.courseLessons && c.courseLessons.length > 0))
      );
    if (found) return found;
  }
  if (targetIdOrName === 'operations' || target.includes('operations')) {
    found =
      courses.find((c) => c && c.id === 'your-first-hire') ||
      courses.find(
        (c) =>
          c &&
          c.stage === 'operations' &&
          (c.type === 'course' || (c.courseLessons && c.courseLessons.length > 0))
      );
    if (found) return found;
  }

  // General fallback: only match items that are courses
  found = courses.find(
    (c) =>
      c &&
      c.stage === targetIdOrName &&
      (c.type === 'course' || (c.courseLessons && c.courseLessons.length > 0))
  );
  if (found) return found;

  return undefined;
}

/**
 * Permanently purges obsolete legacy products and strips unsplash stock fallback images,
 * filters out user-deleted products, deduplicates duplicate stage items (e.g. duplicate bizzmodel/bizzplan),
 * restores clean 1-based sequential ordering (1, 2, 3...) per stage,
 * and ensures master course curriculum lessons are preserved and hydrated.
 */
export function cleanLegacyProducts(products: CmsProduct[]): CmsProduct[] {
  if (!Array.isArray(products) || products.length === 0) return INITIAL_CMS_PRODUCTS;

  const deletedIds = getDeletedProductIds();

  // 1. Deduplicate by unique product ID or canonical course ID (keep latest with user edits)
  const byId = new Map<string, CmsProduct>();
  products.forEach((p) => {
    if (!p || !p.id || p.id === 'vi-ability') return;
    const canonicalId =
      p.type === 'course'
        ? getCanonicalCourseId(p.id) || getCanonicalCourseId(p.name) || p.id
        : p.id;
    const isMasterCourse =
      CANONICAL_MASTER_COURSE_IDS.has(p.id) ||
      CANONICAL_MASTER_COURSE_IDS.has(canonicalId);
    if (!isMasterCourse && (deletedIds.has(p.id) || deletedIds.has(canonicalId))) return;

    const existing = byId.get(canonicalId);
    if (!existing) {
      byId.set(canonicalId, { ...p, id: canonicalId });
    } else {
      // Merge duplicate entries, preserving latest user lessons and cover images
      const pLessons = p.courseLessons || [];
      const exLessons = existing.courseLessons || [];
      const chosenLessons = pLessons.length > 0 ? pLessons : exLessons;
      byId.set(canonicalId, {
        ...existing,
        ...p,
        id: canonicalId,
        canonicalCoverUrl: p.canonicalCoverUrl || existing.canonicalCoverUrl,
        courseLessons: chosenLessons ? chosenLessons.map((l) => ({ ...l })) : [],
        syllabusLessonsCount:
          chosenLessons && chosenLessons.length > 0
            ? chosenLessons.length
            : p.syllabusLessonsCount || existing.syllabusLessonsCount || 0,
        lessonTitles:
          chosenLessons && chosenLessons.length > 0
            ? chosenLessons.map((l) => l.name)
            : p.lessonTitles || existing.lessonTitles || [],
      });
    }
  });

  // Guarantee all canonical initial products (all 19 courses and apps) are present
  INITIAL_CMS_PRODUCTS.forEach((ip) => {
    if (ip && ip.id) {
      const canonicalId = ip.type === 'course' ? (getCanonicalCourseId(ip.id) || ip.id) : ip.id;
      if (!byId.has(ip.id) && !byId.has(canonicalId)) {
        byId.set(canonicalId, { ...ip, id: canonicalId });
      }
    }
  });

  // 2. Preserve valid cover images, user pricing edits and user sequences
  const cleanedList = Array.from(byId.values()).map((p) => {
    const cover = (p.canonicalCoverUrl || '').trim();
    const isCorruptOrDeleted = !cover || cover.includes('1553877522-43269d4ea984');
    const initialProd = INITIAL_CMS_PRODUCTS.find(
      (ip) =>
        ip.id === p.id ||
        (p.id === 'bizzbudget' && ip.id === 'budget') ||
        (p.id === 'budget' && ip.id === 'budget') ||
        (p.name && ip.name.toLowerCase() === p.name.toLowerCase())
    );

    // Keep user base64 upload, else canonical initial cover
    const effectiveCover = cover.startsWith('data:image')
      ? cover
      : (initialProd?.canonicalCoverUrl || (!isCorruptOrDeleted ? cover : ''));

    const WIP_PROJECT_IDS = new Set([
      'bizzdynamics',
      'bizzmodel',
      'hi-level-forecast',
      'bizzforecasta',
      'bizzbudget',
      'bizzmoney',
      'bizzplan',
      'sustain-runway',
      'invest-vdr',
      'bizzoptimizer',
      'growth-strategy',
    ]);

    const effectiveStage =
      p.id === 'cost-recovery-calculator'
        ? ('fund-ability' as const)
        : (['profit-optimizer', 'financial-scenario-planning', 'annual-business-planning-cycle'].includes(p.id))
        ? ('sustain-ability' as const)
        : (p.stage === 'personal-sandbox' || (WIP_PROJECT_IDS.has(p.id) && (p.stage === 'operations' || !p.stage || (p.stage as string) === 'personal-sandbox')))
        ? ('operations-sandbox' as const)
        : (p.stage || initialProd?.stage || 'operations-sandbox');

    const effectiveSellingPrice =
      p.sellingPriceZAR !== undefined
        ? p.sellingPriceZAR
        : (initialProd?.sellingPriceZAR ?? 0);
    const effectiveExclusivePrice =
      p.exclusivePriceZAR !== undefined
        ? p.exclusivePriceZAR
        : (initialProd?.exclusivePriceZAR ?? Math.round((effectiveSellingPrice / 1.15) * 100) / 100);
    const effectiveVat =
      p.vatZAR !== undefined
        ? p.vatZAR
        : (initialProd?.vatZAR ?? Math.round((effectiveSellingPrice - effectiveExclusivePrice) * 100) / 100);
    const effectiveTokens =
      p.tokensAllocated !== undefined
        ? p.tokensAllocated
        : (initialProd?.tokensAllocated ?? Math.round(effectiveSellingPrice * 0.20 * 10) / 10);
    const effectiveTicket =
      p.ticketPriceZAR !== undefined
        ? p.ticketPriceZAR
        : (initialProd?.ticketPriceZAR ?? Math.round(effectiveSellingPrice * 1.20 * 100) / 100);

    let courseLessons = p.courseLessons;
    let syllabusLessonsCount = p.syllabusLessonsCount;
    let lessonTitles = p.lessonTitles;

    if (p.type === 'course' || (p.courseLessons && p.courseLessons.length > 0)) {
      const master = findMasterCurriculum(p.name || p.id || '');
      const hasBogusOrEmpty =
        !courseLessons ||
        courseLessons.length === 0 ||
        courseLessons.some((l) => isBogusLessonUrl(l.youtubeUrl)) ||
        (courseLessons.length === 1 &&
          courseLessons[0].name.toLowerCase().includes('strategic foundations'));

      // If empty, hydrate with master curriculum or default titles
      if (!courseLessons || courseLessons.length === 0) {
        if (master && master.length > 0) {
          courseLessons = master.map((m) => ({ ...m }));
          syllabusLessonsCount = master.length;
          lessonTitles = courseLessons.map((l) => l.name);
        } else if (p.lessonTitles && p.lessonTitles.length > 0) {
          courseLessons = p.lessonTitles.map((t, idx) => ({
            id: `lesson-${p.id}-${idx + 1}`,
            name: t,
            duration: '15 min',
            youtubeUrl: '',
          }));
          syllabusLessonsCount = courseLessons.length;
          lessonTitles = p.lessonTitles;
        }
      } else {
        // Preserve all user-added lessons without truncation; only sanitize bogus test IDs in place
        courseLessons = courseLessons.map((l, idx) => {
          if (isBogusLessonUrl(l.youtubeUrl)) {
            const fallbackUrl = master && master[idx] ? master[idx].youtubeUrl : '';
            return { ...l, youtubeUrl: fallbackUrl };
          }
          return { ...l };
        });
        syllabusLessonsCount = courseLessons.length;
        lessonTitles = courseLessons.map((l) => l.name);
      }
    }

    return {
      ...(initialProd || {}),
      ...p,
      seq: (typeof p.seq === 'number' && !isNaN(p.seq) && p.seq >= 1) ? p.seq : (initialProd?.seq ?? 1),
      sku: p.sku || initialProd?.sku || '',
      name: (p.name && p.name.trim() !== '') ? p.name : (initialProd?.name || p.id),
      subtitle: (p.subtitle && p.subtitle.trim() !== '') ? p.subtitle : (initialProd?.subtitle || ''),
      description: (p.description && p.description.trim() !== '') ? p.description : (initialProd?.description || ''),
      purpose: (p.purpose && p.purpose.trim() !== '') ? p.purpose : (initialProd?.purpose || ''),
      stage: effectiveStage,
      sellingPriceZAR: effectiveSellingPrice,
      exclusivePriceZAR: effectiveExclusivePrice,
      vatZAR: effectiveVat,
      tokensAllocated: effectiveTokens,
      ticketPriceZAR: effectiveTicket,
      canonicalCoverUrl: effectiveCover,
      courseLessons: courseLessons ? courseLessons.map((l) => ({ ...l })) : [],
      syllabusLessonsCount: syllabusLessonsCount || (courseLessons ? courseLessons.length : 0),
      lessonTitles: lessonTitles || (courseLessons ? courseLessons.map((l) => l.name) : []),
      isPurchased: effectiveSellingPrice === 0 || p.id === 'learn-earn-capital' || p.id === 'how-to-bizzcalc' || p.id === 'follow-the-money',
    };
  });

  return cleanedList.filter((p) => {
    const isMaster =
      CANONICAL_MASTER_COURSE_IDS.has(p.id) ||
      CANONICAL_MASTER_COURSE_IDS.has(getCanonicalCourseId(p.id) || '');
    if (isMaster) return true;
    return !deletedIds.has(p.id);
  });
}

/**
 * Preserves educational video links without clearing user input.
 */
export function cleanClearedEducationVideos(videos: any[]): any[] {
  if (!Array.isArray(videos)) return [];
  const deletedIds = getDeletedVideoIds();
  return videos.filter((v) => v && v.id && !deletedIds.has(v.id));
}

/**
 * Preserves course lesson video stream links without clearing user input.
 */
export function cleanClearedCourseLessons(products: any[]): any[] {
  if (!Array.isArray(products)) return [];
  return products;
}

/**
 * Hydrates Hero Promotions with high-fidelity visual assets, preserving user uploads
 * and filtering deleted/search message boards.
 */
export function cleanLegacyViabilityPromotions(promos: CmsPromotionSection[]): CmsPromotionSection[] {
  const deletedIds = getDeletedPromotionIds();
  if (!Array.isArray(promos) || promos.length === 0) {
    return INITIAL_CMS_PROMOTIONS.filter((p) => !deletedIds.has(p.id));
  }

  const cleaned = promos
    .filter((p) => {
      if (!p || !p.id) return false;
      if (deletedIds.has(p.id)) return false;
      if (p.id === 'search' || p.name === 'search') return false;
      if (p.displayName && p.displayName.toLowerCase().includes('gemini search')) return false;
      if (p.targetId === 'search') return false;
      return true;
    })
    .map((p) => {
      const initial = INITIAL_CMS_PROMOTIONS.find((ip) => ip.id === p.id);
      const img = (p.imageUrl || '').trim();
      const isCorrupted = !img || img.includes('1553877522-43269d4ea984');

      // User custom base64 image is preserved; otherwise take canonical initial image
      const cleanedImg = img.startsWith('data:image')
        ? img
        : (initial?.imageUrl || (!isCorrupted ? img : ''));

      const mergedStory = {
        narrative:
          (p.stageStory?.narrative && p.stageStory.narrative.trim() !== '')
            ? p.stageStory.narrative
            : (initial?.stageStory?.narrative || ''),
        stageChallenge:
          (p.stageStory?.stageChallenge && p.stageStory.stageChallenge.trim() !== '')
            ? p.stageStory.stageChallenge
            : (initial?.stageStory?.stageChallenge || ''),
        milestone:
          (p.stageStory?.milestone && p.stageStory.milestone.trim() !== '')
            ? p.stageStory.milestone
            : (initial?.stageStory?.milestone || ''),
        keyDeliverable:
          (p.stageStory?.keyDeliverable && p.stageStory.keyDeliverable.trim() !== '')
            ? p.stageStory.keyDeliverable
            : (initial?.stageStory?.keyDeliverable || ''),
      };

      return {
        ...(initial || {}),
        ...p,
        isActive: p.isActive !== undefined ? p.isActive : (initial?.isActive ?? true),
        displayName: (p.displayName && p.displayName.trim() !== '') ? p.displayName : (initial?.displayName || p.name),
        tagline: (p.tagline && p.tagline.trim() !== '') ? p.tagline : (initial?.tagline || ''),
        buttonText: (p.buttonText && p.buttonText.trim() !== '') ? p.buttonText : (initial?.buttonText || 'explore'),
        targetId: p.targetId || initial?.targetId || 'vi-ability',
        targetType: p.targetType || initial?.targetType || 'solution',
        imageUrl: cleanedImg,
        stageStory: mergedStory,
      };
    });

  // Guarantee all 13 canonical stages from INITIAL_CMS_PROMOTIONS exist
  const existingIds = new Set(cleaned.map((p) => p.id));
  INITIAL_CMS_PROMOTIONS.forEach((ip) => {
    if (!existingIds.has(ip.id) && !deletedIds.has(ip.id)) {
      cleaned.push({
        ...ip,
        imageUrl: ip.imageUrl || '',
        stageStory: {
          narrative: ip.stageStory?.narrative || '',
          stageChallenge: ip.stageStory?.stageChallenge || '',
          milestone: ip.stageStory?.milestone || '',
          keyDeliverable: ip.stageStory?.keyDeliverable || '',
        },
      });
    }
  });

  return cleaned;
}

/**
 * Merges two promotion lists preserving user-uploaded image assets so newly uploaded
 * images and customized content are never clobbered by empty initial defaults during storage sync.
 */
export function mergeLoadedPromotions(
  primary: CmsPromotionSection[],
  secondary?: CmsPromotionSection[] | null
): CmsPromotionSection[] {
  const deletedIds = getDeletedPromotionIds();
  const isSearchOrDeleted = (p: CmsPromotionSection) =>
    !p ||
    !p.id ||
    deletedIds.has(p.id) ||
    p.id === 'search' ||
    p.name === 'search' ||
    (p.displayName && p.displayName.toLowerCase().includes('gemini search')) ||
    p.targetId === 'search';

  if (!secondary || !Array.isArray(secondary) || secondary.length === 0) {
    return cleanLegacyViabilityPromotions(primary || []);
  }
  if (!primary || !Array.isArray(primary) || primary.length === 0) {
    return cleanLegacyViabilityPromotions(secondary || []);
  }

  const secMap = new Map<string, CmsPromotionSection>();
  secondary.forEach((p) => {
    if (!isSearchOrDeleted(p)) secMap.set(p.id, p);
  });

  const primIds = new Set(primary.map((p) => p.id));
  const merged: CmsPromotionSection[] = [];

  primary.forEach((p) => {
    if (isSearchOrDeleted(p)) return;
    const sec = secMap.get(p.id);
    if (!sec) {
      merged.push(p);
      return;
    }

    const pImg = (p.imageUrl || '').trim();
    const secImg = (sec.imageUrl || '').trim();
    const initial = INITIAL_CMS_PROMOTIONS.find((ip) => ip.id === p.id);

    // If secondary has a user-uploaded base64 image, preserve it; otherwise prefer authoritative primary
    const chosenImage =
      secImg.startsWith('data:image')
        ? secImg
        : (pImg !== '' && !pImg.includes('1553877522-43269d4ea984')
            ? pImg
            : (initial?.imageUrl || (secImg !== '' && !secImg.includes('1553877522-43269d4ea984') ? secImg : '')));

    const mergedStory = {
      narrative:
        (p.stageStory?.narrative && p.stageStory.narrative.trim() !== '')
          ? p.stageStory.narrative
          : (sec.stageStory?.narrative || initial?.stageStory?.narrative || ''),
      stageChallenge:
        (p.stageStory?.stageChallenge && p.stageStory.stageChallenge.trim() !== '')
          ? p.stageStory.stageChallenge
          : (sec.stageStory?.stageChallenge || initial?.stageStory?.stageChallenge || ''),
      milestone:
        (p.stageStory?.milestone && p.stageStory.milestone.trim() !== '')
          ? p.stageStory.milestone
          : (sec.stageStory?.milestone || initial?.stageStory?.milestone || ''),
      keyDeliverable:
        (p.stageStory?.keyDeliverable && p.stageStory.keyDeliverable.trim() !== '')
          ? p.stageStory.keyDeliverable
          : (sec.stageStory?.keyDeliverable || initial?.stageStory?.keyDeliverable || ''),
    };

    const effectiveIsActive =
      p.isActive !== undefined ? p.isActive : (sec.isActive !== undefined ? sec.isActive : true);

    merged.push({
      ...sec,
      ...p,
      displayName: (p.displayName && p.displayName.trim() !== '') ? p.displayName : (sec.displayName || initial?.displayName || p.name),
      tagline: (p.tagline && p.tagline.trim() !== '') ? p.tagline : (sec.tagline || initial?.tagline || ''),
      buttonText: (p.buttonText && p.buttonText.trim() !== '') ? p.buttonText : (sec.buttonText || initial?.buttonText || 'explore'),
      targetId: p.targetId || sec.targetId || initial?.targetId || 'vi-ability',
      targetType: p.targetType || sec.targetType || initial?.targetType || 'solution',
      targetTab: p.targetTab || sec.targetTab,
      imageUrl: chosenImage,
      isActive: effectiveIsActive,
      stageStory: mergedStory,
    });
  });

  // Preserve any custom sections added in secondary
  secondary.forEach((sec) => {
    if (sec && sec.id && !deletedIds.has(sec.id) && sec.id !== 'search' && !primIds.has(sec.id)) {
      merged.push(sec);
    }
  });

  return cleanLegacyViabilityPromotions(merged);
}

/**
 * Merges two product lists preserving user-uploaded covers,
 * newly created products, and respecting deleted product IDs.
 */
export function mergeLoadedProducts(
  primary: CmsProduct[],
  secondary?: CmsProduct[] | null
): CmsProduct[] {
  if (!secondary || !Array.isArray(secondary) || secondary.length === 0) {
    return cleanLegacyProducts(primary);
  }
  if (!primary || !Array.isArray(primary) || primary.length === 0) {
    return cleanLegacyProducts(secondary);
  }
  const deletedIds = getDeletedProductIds();

  // secondary is loaded from persistent storage (IndexedDB), primary is authoritative in-memory / Firestore
  const secMap = new Map<string, CmsProduct>();
  secondary.forEach((p) => {
    if (p && p.id && !deletedIds.has(p.id)) {
      const canonId = p.type === 'course' ? (getCanonicalCourseId(p.id) || getCanonicalCourseId(p.name) || p.id) : p.id;
      secMap.set(canonId, p);
      secMap.set(p.id, p);
    }
  });

  const merged: CmsProduct[] = [];
  const handledIds = new Set<string>();

  // Primary authoritative products take precedence
  primary.forEach((prim) => {
    if (!prim || !prim.id || deletedIds.has(prim.id)) return;
    const canonPrimId = prim.type === 'course' ? (getCanonicalCourseId(prim.id) || getCanonicalCourseId(prim.name) || prim.id) : prim.id;
    handledIds.add(prim.id);
    handledIds.add(canonPrimId);

    const sec = secMap.get(prim.id) || secMap.get(canonPrimId);
    if (!sec) {
      merged.push({ ...prim, id: canonPrimId });
      return;
    }

    const pCover = (prim.canonicalCoverUrl || '').trim();
    const secCover = (sec.canonicalCoverUrl || '').trim();
    const initialProd = INITIAL_CMS_PRODUCTS.find(
      (ip) =>
        ip.id === sec.id ||
        ip.id === canonPrimId ||
        ip.id === prim.id ||
        (sec.id === 'bizzbudget' && ip.id === 'budget') ||
        (sec.name && ip.name.toLowerCase() === sec.name.toLowerCase())
    );
    const fallbackCover = initialProd?.canonicalCoverUrl || '';

    // If sec has a base64 user upload, preserve it; otherwise prefer primCover
    const chosenCover =
      secCover.startsWith('data:image')
        ? secCover
        : (pCover !== '' && !pCover.includes('1553877522-43269d4ea984')
            ? pCover
            : (secCover !== '' && !secCover.includes('1553877522-43269d4ea984') ? secCover : fallbackCover));

    const secLessons = sec.courseLessons || [];
    const primLessons = prim.courseLessons || [];
    // Authoritative primary takes precedence if it contains lessons; fallback to secondary
    let chosenLessons = primLessons.length > 0 ? primLessons : secLessons;

    // Guarantee bogus URLs are cleaned without truncating user lessons
    const master = findMasterCurriculum(prim.name || prim.id || sec.name || sec.id || '');
    if (!chosenLessons || chosenLessons.length === 0) {
      if (master && master.length > 0) {
        chosenLessons = master.map((m) => ({ ...m }));
      }
    } else {
      chosenLessons = chosenLessons.map((l, idx) => {
        if (isBogusLessonUrl(l.youtubeUrl)) {
          const fallbackUrl = master && master[idx] ? master[idx].youtubeUrl : '';
          return { ...l, youtubeUrl: fallbackUrl };
        }
        return { ...l };
      });
    }

    const WIP_PROJECT_IDS = new Set([
      'bizzdynamics',
      'bizzmodel',
      'hi-level-forecast',
      'bizzforecasta',
      'bizzbudget',
      'bizzmoney',
      'bizzplan',
      'sustain-runway',
      'invest-vdr',
      'bizzoptimizer',
      'growth-strategy',
    ]);

    const effectiveStage =
      (sec.id === 'cost-recovery-calculator' || canonPrimId === 'cost-recovery-calculator')
        ? ('fund-ability' as const)
        : (['profit-optimizer', 'financial-scenario-planning', 'annual-business-planning-cycle'].includes(sec.id) || ['profit-optimizer', 'financial-scenario-planning', 'annual-business-planning-cycle'].includes(canonPrimId))
        ? ('sustain-ability' as const)
        : (prim.stage === 'personal-sandbox' || sec.stage === 'personal-sandbox' || (WIP_PROJECT_IDS.has(canonPrimId) && (prim.stage === 'operations' || sec.stage === 'operations' || (!prim.stage && !sec.stage))))
        ? ('operations-sandbox' as const)
        : (prim.stage || sec.stage || initialProd?.stage || 'operations-sandbox');

    merged.push({
      ...sec,
      ...prim, // Primary (e.g. authoritative Firestore / live update) takes precedence over secondary fallback
      id: canonPrimId,
      stage: effectiveStage,
      name: (prim.name && prim.name.trim() !== '') ? prim.name : (sec.name || ''),
      subtitle: (prim.subtitle && prim.subtitle.trim() !== '') ? prim.subtitle : (sec.subtitle || ''),
      description: (prim.description && prim.description.trim() !== '') ? prim.description : (sec.description || ''),
      purpose: (prim.purpose && prim.purpose.trim() !== '') ? prim.purpose : (sec.purpose || ''),
      sku: prim.sku || sec.sku || '',
      seq: (typeof prim.seq === 'number' && !isNaN(prim.seq) && prim.seq >= 1)
        ? prim.seq
        : ((typeof sec.seq === 'number' && !isNaN(sec.seq) && sec.seq >= 1) ? sec.seq : 1),
      sellingPriceZAR: prim.sellingPriceZAR !== undefined ? prim.sellingPriceZAR : sec.sellingPriceZAR,
      exclusivePriceZAR: prim.exclusivePriceZAR !== undefined ? prim.exclusivePriceZAR : sec.exclusivePriceZAR,
      vatZAR: prim.vatZAR !== undefined ? prim.vatZAR : sec.vatZAR,
      tokensAllocated: prim.tokensAllocated !== undefined ? prim.tokensAllocated : sec.tokensAllocated,
      ticketPriceZAR: prim.ticketPriceZAR !== undefined ? prim.ticketPriceZAR : sec.ticketPriceZAR,
      canonicalCoverUrl: chosenCover,
      courseLessons: chosenLessons ? chosenLessons.map((l) => ({ ...l })) : [],
      syllabusLessonsCount: chosenLessons && chosenLessons.length > 0 ? chosenLessons.length : (prim.syllabusLessonsCount || sec.syllabusLessonsCount || 0),
      lessonTitles: chosenLessons && chosenLessons.length > 0 ? chosenLessons.map((l) => l.name) : (prim.lessonTitles || sec.lessonTitles || []),
    });
  });

  // Preserve any new custom products created by the user in secondary that aren't in primary
  secondary.forEach((sec) => {
    if (!sec || !sec.id || deletedIds.has(sec.id)) return;
    const canonSecId = sec.type === 'course' ? (getCanonicalCourseId(sec.id) || getCanonicalCourseId(sec.name) || sec.id) : sec.id;
    if (!handledIds.has(sec.id) && !handledIds.has(canonSecId)) {
      merged.push({ ...sec, id: canonSecId });
    }
  });

  return cleanLegacyProducts(merged);
}

/**
 * Merges two article lists non-destructively:
 * - Preserves user updates (title, author, readTime, category, summary, content, tags, canonicalCoverUrl)
 * - Base64 cover uploads from user are strictly preserved
 * - Preserves newly created articles
 * - Guarantees all initial articles are retained if not deleted
 */
export function mergeLoadedArticles(
  primary: CmsArticle[],
  secondary?: CmsArticle[] | null
): CmsArticle[] {
  const deletedIds = getDeletedArticleIds();
  const cleanList = (list: CmsArticle[] | null | undefined) =>
    (list || []).filter((a) => a && a.id && !deletedIds.has(a.id));

  const pClean = cleanList(primary);
  const sClean = cleanList(secondary);

  const normalizeSeq = (list: CmsArticle[]) => {
    const sorted = [...list].sort((a, b) => (a.seq || 0) - (b.seq || 0));
    sorted.forEach((a, idx) => {
      if (!a.seq || isNaN(a.seq)) a.seq = idx + 1;
    });
    return sorted;
  };

  if (sClean.length === 0) {
    const list = pClean.length > 0 ? pClean : cleanList(INITIAL_CMS_ARTICLES);
    return cleanFallbackImagesFromArticles(normalizeSeq(list));
  }
  if (pClean.length === 0) {
    const list = sClean.length > 0 ? sClean : cleanList(INITIAL_CMS_ARTICLES);
    return cleanFallbackImagesFromArticles(normalizeSeq(list));
  }

  const secMap = new Map<string, CmsArticle>();
  sClean.forEach((a) => {
    if (a && a.id) secMap.set(a.id, a);
  });

  const merged: CmsArticle[] = [];
  const handledIds = new Set<string>();

  const isPlaceholder = (t?: string) =>
    !t || t.trim() === '' || t.includes('Draft content for this executive brief') || t.includes('Type or upload your full article body');

  // Primary authoritative articles (e.g. from Firestore or active state)
  pClean.forEach((prim) => {
    if (!prim || !prim.id || deletedIds.has(prim.id)) return;
    handledIds.add(prim.id);
    const sec = secMap.get(prim.id);
    if (!sec) {
      merged.push({ ...prim });
      return;
    }

    const pImg = (prim.imageUrl || (prim as any).canonicalCoverUrl || '').trim();
    const secImg = (sec.imageUrl || (sec as any).canonicalCoverUrl || '').trim();
    const initial = INITIAL_CMS_ARTICLES.find((ia) => ia.id === prim.id);

    // Image priority: primary valid image > secondary user base64 upload > secondary > initial
    let chosenImg = '';
    if (pImg !== '') {
      chosenImg = pImg;
    } else if (secImg.startsWith('data:image')) {
      chosenImg = secImg;
    } else if (secImg !== '') {
      chosenImg = secImg;
    } else {
      chosenImg = initial?.imageUrl || '';
    }

    // Content priority: primary real content > secondary real content > fallback
    let chosenContent = '';
    if (prim.content && prim.content.trim() !== '' && !isPlaceholder(prim.content)) {
      chosenContent = prim.content;
    } else if (sec.content && sec.content.trim() !== '' && !isPlaceholder(sec.content)) {
      chosenContent = sec.content;
    } else {
      chosenContent = prim.content || sec.content || initial?.content || '';
    }

    // Sequence priority: authoritative primary seq > secondary seq > initial seq
    const effectiveSeq =
      typeof prim.seq === 'number' && !isNaN(prim.seq) && prim.seq >= 1
        ? prim.seq
        : (typeof sec.seq === 'number' && !isNaN(sec.seq) && sec.seq >= 1 ? sec.seq : (initial?.seq || undefined));

    merged.push({
      ...initial,
      ...sec,
      ...prim,
      id: prim.id,
      seq: effectiveSeq,
      title: (prim.title && prim.title.trim() !== '') ? prim.title : (sec.title || initial?.title || ''),
      summary: (prim.summary && prim.summary.trim() !== '' && !isPlaceholder(prim.summary))
        ? prim.summary
        : (sec.summary && sec.summary.trim() !== '' && !isPlaceholder(sec.summary) ? sec.summary : (prim.summary || sec.summary || initial?.summary || '')),
      content: chosenContent,
      author: (prim.author && prim.author.trim() !== '') ? prim.author : (sec.author || initial?.author || 'the bizzbean channel'),
      readTime: (prim.readTime && prim.readTime.trim() !== '') ? prim.readTime : (sec.readTime || initial?.readTime || '5 min read'),
      category: (prim.category && prim.category.trim() !== '') ? prim.category : (sec.category || initial?.category || 'strategy'),
      isMustRead: prim.isMustRead !== undefined ? prim.isMustRead : (sec.isMustRead !== undefined ? sec.isMustRead : false),
      imageUrl: chosenImg,
    });
  });

  // Include any user-created custom articles from secondary not in primary and not deleted
  sClean.forEach((sec) => {
    if (sec && sec.id && !handledIds.has(sec.id) && !deletedIds.has(sec.id)) {
      merged.push({ ...sec });
    }
  });

  const finalSorted = normalizeSeq(merged);
  return cleanFallbackImagesFromArticles(finalSorted);
}

/**
 * Merges two video lists non-destructively:
 * - Preserves user-entered YouTube URLs, durations, and details
 * - Does not revert populated stream links back to empty seed values
 * - Preserves custom video uploads
 * - Enforces deleted video IDs so deleted videos are never resurrected
 */
export function mergeLoadedVideos(
  primary: CmsVideo[],
  secondary?: CmsVideo[] | null
): CmsVideo[] {
  const deletedIds = getDeletedVideoIds();
  const cleanList = (list: CmsVideo[] | null | undefined) =>
    (list || []).filter((v) => v && v.id && !deletedIds.has(v.id));

  const pClean = cleanList(primary);
  const sClean = cleanList(secondary);

  if (sClean.length === 0) {
    return pClean.length > 0 ? pClean : cleanList(INITIAL_CMS_VIDEOS);
  }
  if (pClean.length === 0) {
    return sClean.length > 0 ? sClean : cleanList(INITIAL_CMS_VIDEOS);
  }

  const secMap = new Map<string, CmsVideo>();
  sClean.forEach((v) => {
    if (v && v.id) secMap.set(v.id, v);
  });

  const merged: CmsVideo[] = [];
  const handledIds = new Set<string>();

  pClean.forEach((prim) => {
    if (!prim || !prim.id || deletedIds.has(prim.id)) return;
    handledIds.add(prim.id);
    const sec = secMap.get(prim.id);
    if (!sec) {
      merged.push(prim);
      return;
    }

    const pUrl = (prim.youtubeUrl || '').trim();
    const secUrl = (sec.youtubeUrl || '').trim();
    // Prefer non-empty YouTube URL, preferring authoritative primary if both populated
    const chosenUrl = pUrl !== '' ? pUrl : secUrl;
    const isLinked = Boolean(chosenUrl);

    const effectiveMustWatch =
      prim.isMustWatch !== undefined ? prim.isMustWatch : (sec.isMustWatch !== undefined ? sec.isMustWatch : false);

    merged.push({
      ...sec,
      ...prim,
      id: prim.id,
      title: (prim.title && prim.title.trim() !== '') ? prim.title : (sec.title || ''),
      duration: (prim.duration && prim.duration.trim() !== '') ? prim.duration : (sec.duration || '5:00'),
      youtubeUrl: chosenUrl,
      linked: isLinked,
      author: (prim.author && prim.author.trim() !== '') ? prim.author : (sec.author || ''),
      category: (prim.category && prim.category.trim() !== '') ? prim.category : (sec.category || 'general'),
      isMustWatch: effectiveMustWatch,
    });
  });

  sClean.forEach((sec) => {
    if (sec && sec.id && !handledIds.has(sec.id) && !deletedIds.has(sec.id)) {
      merged.push(sec);
    }
  });

  return merged;
}

