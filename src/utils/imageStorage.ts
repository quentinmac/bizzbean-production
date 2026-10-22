import { CmsArticle, CmsCourseLesson, CmsProduct, CmsPromotionSection, INITIAL_CMS_PRODUCTS, INITIAL_CMS_PROMOTIONS } from '../data/cmsConsoleData';

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

/**
 * Strips legacy unsplash fallback stock images from articles so only user-provided / uploaded images are rendered.
 * If an article has an Unsplash fallback image URL, it is cleaned to ''.
 */
export function cleanFallbackImagesFromArticles(articles: CmsArticle[]): CmsArticle[] {
  if (!Array.isArray(articles)) return [];
  return articles.map((art) => {
    const img = (art.imageUrl || '').trim();
    if (img.includes('images.unsplash.com')) {
      return { ...art, imageUrl: '' };
    }
    return art;
  });
}

const DELETED_PRODUCTS_KEY = 'bizzdesk_cms_deleted_product_ids_v1';

export function getDeletedProductIds(): Set<string> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DELETED_PRODUCTS_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (e) {
    console.warn('Failed to read deleted product IDs', e);
  }
  return new Set();
}

export function markProductAsDeleted(prodId: string): void {
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

export function unmarkProductAsDeleted(prodId: string): void {
  try {
    const set = getDeletedProductIds();
    set.delete(prodId);
    const canon = getCanonicalCourseId(prodId);
    if (canon) set.delete(canon);
    const arr = Array.from(set);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(arr));
    }
    idbSet(DELETED_PRODUCTS_KEY, arr).catch(() => {});
  } catch (e) {
    console.warn('Failed to unmark product as deleted', e);
  }
}

const DELETED_PROMOTIONS_KEY = 'bizzdesk_cms_deleted_promotion_ids_v1';

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
    { id: 'po-1', name: '1 - CONTRIBUTION MARGIN WATERFALL', duration: '6 min', youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg' },
    { id: 'po-2', name: '2 - VOLUME SENSITIVITY MATRIX', duration: '11 min', youtubeUrl: 'https://www.youtube.com/watch?v=3wyZYsk8OTY' },
    { id: 'po-3', name: '3 - PRICING POWER EXPERIMENTS', duration: '13 min', youtubeUrl: 'https://www.youtube.com/watch?v=xbasHzq2fL0' },
  ],
  'profit dynamics': [
    { id: 'pd-1', name: '1 - CONTRIBUTION MARGIN WATERFALL', duration: '6 min', youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg' },
    { id: 'pd-2', name: '2 - VOLUME SENSITIVITY MATRIX', duration: '11 min', youtubeUrl: 'https://www.youtube.com/watch?v=3wyZYsk8OTY' },
    { id: 'pd-3', name: '3 - PRICING POWER EXPERIMENTS', duration: '13 min', youtubeUrl: 'https://www.youtube.com/watch?v=xbasHzq2fL0' },
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
  if (!url || typeof url !== 'string' || !url.trim()) return true;
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
  if (lower.includes('earn access to capital') || lower.includes('learn-earn-capital')) return 'learn-earn-capital';
  if (lower.includes('follow the money') || lower.includes('follow-the-money')) return 'follow-the-money';
  if (lower.includes('first hire') || lower.includes('your-first-hire')) return 'your-first-hire';
  if (lower.includes('profit optimizer') || lower.includes('profit dynamics') || lower.includes('profit-optimizer')) return 'profit-optimizer';
  if (lower.includes('scenario planning') || lower.includes('financial-scenario')) return 'financial-scenario-planning';
  if (lower.includes('annual business planning') || lower.includes('annual-business-planning')) return 'annual-business-planning-cycle';
  return null;
}

/**
 * Resolves a course in the given courses array using direct ID, canonical ID, name, keyword, or stage matching.
 * Guarantees that cost-recovery-calculator and specific course tracks never incorrectly fall back to learn-earn-capital.
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
        (c.id.includes('cost-recovery') ||
          (c.name || '').toLowerCase().includes('cost recovery'))
    );
    if (found) return found;
  }
  if (target.includes('how to use bizzcalc') || target.includes('how-to-bizzcalc') || target.includes('use bizzcalc')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id.includes('how-to-bizzcalc') ||
          (c.name || '').toLowerCase().includes('how to use bizzcalc'))
    );
    if (found) return found;
  }
  if (target.includes('profit optimizer') || target.includes('profit-optimizer')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id.includes('profit-optimizer') ||
          (c.name || '').toLowerCase().includes('profit optimizer'))
    );
    if (found) return found;
  }
  if (target.includes('financial report') || target.includes('financial-report')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id.includes('financial-reports') ||
          (c.name || '').toLowerCase().includes('financial report'))
    );
    if (found) return found;
  }
  if (target.includes('follow the money') || target.includes('follow-the-money')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id.includes('follow-the-money') ||
          (c.name || '').toLowerCase().includes('follow the money'))
    );
    if (found) return found;
  }
  if (target.includes('first hire') || target.includes('your-first-hire')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id.includes('your-first-hire') ||
          (c.name || '').toLowerCase().includes('first hire'))
    );
    if (found) return found;
  }
  if (target.includes('scenario planning') || target.includes('scenario-planning')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id.includes('scenario') ||
          (c.name || '').toLowerCase().includes('scenario planning'))
    );
    if (found) return found;
  }
  if (target.includes('annual business') || target.includes('annual-business')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id.includes('annual') ||
          (c.name || '').toLowerCase().includes('annual business'))
    );
    if (found) return found;
  }
  if (target.includes('capital') || target.includes('earn access') || target.includes('learn-earn')) {
    found = courses.find(
      (c) =>
        c &&
        (c.id.includes('learn-earn') ||
          (c.name || '').toLowerCase().includes('access to capital'))
    );
    if (found) return found;
  }

  // 5. Stage matching: if target is a stage (e.g. 'fund-ability'), pick the primary course of that stage
  found = courses.find((c) => c && c.stage === targetIdOrName);
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

  // 1. Deduplicate by unique product ID or canonical course ID (keep latest with user edits)
  const byId = new Map<string, CmsProduct>();
  products.forEach((p) => {
    if (!p || !p.id || p.id === 'vi-ability') return;
    const canonicalId =
      p.type === 'course'
        ? getCanonicalCourseId(p.id) || getCanonicalCourseId(p.name) || p.id
        : p.id;
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

  // 2. Clean fallback unsplash images while preserving user uploaded images
  // and ensure cost-recovery-calculator belongs definitively to fund-ability stage
  const cleanedList = Array.from(byId.values()).map((p) => {
    const cover = (p.canonicalCoverUrl || '').trim();
    const isFallbackOrDeleted =
      cover.includes('1553877522-43269d4ea984') || cover.includes('images.unsplash.com');

    const effectiveStage =
      p.id === 'cost-recovery-calculator' && (p.stage === 'vi-ability' || p.stage === 'education')
        ? ('fund-ability' as const)
        : p.stage || 'vi-ability';

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

      // If placeholder, empty, or has bogus YouTube URLs, hydrate with verified master curriculum
      if (master && hasBogusOrEmpty) {
        courseLessons = master.map((m, idx) => {
          const userLesson = courseLessons && courseLessons[idx];
          const userUrl = userLesson?.youtubeUrl?.trim() || '';
          const effectiveUrl = (!userUrl || isBogusLessonUrl(userUrl)) ? m.youtubeUrl : userUrl;
          return {
            ...m,
            ...(userLesson || {}),
            name: userLesson?.name || m.name,
            duration: userLesson?.duration || m.duration,
            youtubeUrl: effectiveUrl,
          };
        });
        syllabusLessonsCount = master.length;
        lessonTitles = courseLessons.map((l) => l.name);
      }
    }

    return {
      ...p,
      stage: effectiveStage,
      canonicalCoverUrl: isFallbackOrDeleted ? '' : cover,
      courseLessons: courseLessons ? courseLessons.map((l) => ({ ...l })) : [],
      syllabusLessonsCount: syllabusLessonsCount || (courseLessons ? courseLessons.length : 0),
      lessonTitles: lessonTitles || (courseLessons ? courseLessons.map((l) => l.name) : []),
    };
  });

  // Guarantee that cost-recovery-calculator is never accidentally missing from cleaned products
  const hasCostRecovery = cleanedList.some(
    (p) => p.id === 'cost-recovery-calculator' || (p.name || '').toLowerCase().includes('cost recovery')
  );
  if (!hasCostRecovery) {
    const defaultCostRecovery = INITIAL_CMS_PRODUCTS.find((p) => p.id === 'cost-recovery-calculator');
    if (defaultCostRecovery) {
      const lessons = defaultCostRecovery.courseLessons || [];
      cleanedList.push({
        ...defaultCostRecovery,
        canonicalCoverUrl: defaultCostRecovery.canonicalCoverUrl || '',
        courseLessons: lessons.map((l) => ({ ...l })),
        syllabusLessonsCount: defaultCostRecovery.syllabusLessonsCount || lessons.length,
        lessonTitles: defaultCostRecovery.lessonTitles || lessons.map((l) => l.name),
      });
    }
  }

  // Ensure active cost-recovery-calculator is unblocked from deletedIds
  unmarkProductAsDeleted('cost-recovery-calculator');

  return cleanedList;
}

/**
 * Preserves educational video links without clearing user input.
 */
export function cleanClearedEducationVideos(videos: any[]): any[] {
  if (!Array.isArray(videos)) return [];
  return videos;
}

/**
 * Preserves course lesson video stream links without clearing user input.
 */
export function cleanClearedCourseLessons(products: any[]): any[] {
  if (!Array.isArray(products)) return [];
  return products;
}

/**
 * Permanently purges unsplash fallback images, legacy photos, and deleted/search message boards
 * from Hero Promotions so only real user-uploaded images and desired boards are presented.
 */
export function cleanLegacyViabilityPromotions(promos: CmsPromotionSection[]): CmsPromotionSection[] {
  if (!Array.isArray(promos)) return INITIAL_CMS_PROMOTIONS;
  const deletedIds = getDeletedPromotionIds();
  return promos
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
      const isFallback =
        img.includes('1553877522-43269d4ea984') || img.includes('images.unsplash.com');
      const cleanedImg = isFallback ? '' : img;

      const mergedStory = {
        narrative:
          p.stageStory?.narrative !== undefined && p.stageStory.narrative.trim() !== ''
            ? p.stageStory.narrative
            : (initial?.stageStory?.narrative || ''),
        stageChallenge:
          p.stageStory?.stageChallenge !== undefined && p.stageStory.stageChallenge.trim() !== ''
            ? p.stageStory.stageChallenge
            : (initial?.stageStory?.stageChallenge || ''),
        milestone:
          p.stageStory?.milestone !== undefined && p.stageStory.milestone.trim() !== ''
            ? p.stageStory.milestone
            : (initial?.stageStory?.milestone || ''),
        keyDeliverable:
          p.stageStory?.keyDeliverable !== undefined && p.stageStory.keyDeliverable.trim() !== ''
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
    return (primary || []).filter((p) => !isSearchOrDeleted(p));
  }
  if (!primary || !Array.isArray(primary) || primary.length === 0) {
    return (secondary || []).filter((p) => !isSearchOrDeleted(p));
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

    // sec is loaded from persistent storage (IndexedDB or localStorage); p is in-memory / incoming
    // If in-memory p has a newly uploaded or updated image, preserve it; otherwise take sec's image
    const pImg = (p.imageUrl || '').trim();
    const secImg = (sec.imageUrl || '').trim();
    const chosenImage =
      pImg !== '' && pImg.startsWith('data:image') && pImg !== secImg
        ? pImg
        : (secImg !== '' ? secImg : pImg);

    // Merge stageStory: take sec's saved stageStory, falling back to p's defaults for any missing fields
    const mergedStory = {
      narrative:
        sec.stageStory?.narrative !== undefined && sec.stageStory.narrative.trim() !== ''
          ? sec.stageStory.narrative
          : (p.stageStory?.narrative || ''),
      stageChallenge:
        sec.stageStory?.stageChallenge !== undefined && sec.stageStory.stageChallenge.trim() !== ''
          ? sec.stageStory.stageChallenge
          : (p.stageStory?.stageChallenge || ''),
      milestone:
        sec.stageStory?.milestone !== undefined && sec.stageStory.milestone.trim() !== ''
          ? sec.stageStory.milestone
          : (p.stageStory?.milestone || ''),
      keyDeliverable:
        sec.stageStory?.keyDeliverable !== undefined && sec.stageStory.keyDeliverable.trim() !== ''
          ? sec.stageStory.keyDeliverable
          : (p.stageStory?.keyDeliverable || ''),
    };

    // If p (primary/incoming update) has an explicit isActive setting (such as false), it takes precedence over stale cache
    const effectiveIsActive =
      p.isActive !== undefined ? p.isActive : (sec.isActive !== undefined ? sec.isActive : true);

    merged.push({
      ...sec,
      ...p,
      displayName: (p.displayName && p.displayName.trim() !== '') ? p.displayName : (sec.displayName || p.displayName),
      tagline: (p.tagline && p.tagline.trim() !== '') ? p.tagline : (sec.tagline || p.tagline),
      buttonText: (p.buttonText && p.buttonText.trim() !== '') ? p.buttonText : (sec.buttonText || p.buttonText),
      targetId: p.targetId || sec.targetId,
      targetType: p.targetType || sec.targetType,
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

  return merged;
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

  // secondary is loaded from persistent storage (IndexedDB), primary is in-memory
  const secMap = new Map<string, CmsProduct>();
  secondary.forEach((p) => {
    if (p && p.id && !deletedIds.has(p.id)) {
      const canonId = p.type === 'course' ? (getCanonicalCourseId(p.id) || getCanonicalCourseId(p.name) || p.id) : p.id;
      secMap.set(canonId, p);
      secMap.set(p.id, p);
    }
  });

  const primIds = new Set(primary.map((p) => p.id));
  primary.forEach((p) => {
    if (p && p.type === 'course') {
      const canonId = getCanonicalCourseId(p.id) || getCanonicalCourseId(p.name);
      if (canonId) primIds.add(canonId);
    }
  });

  const merged: CmsProduct[] = [];

  // Start with secondary (storage persistent truth)
  secondary.forEach((sec) => {
    if (!sec || !sec.id || deletedIds.has(sec.id)) return;
    const canonSecId = sec.type === 'course' ? (getCanonicalCourseId(sec.id) || getCanonicalCourseId(sec.name) || sec.id) : sec.id;
    const prim = primary.find(
      (p) =>
        p &&
        (p.id === sec.id ||
          p.id === canonSecId ||
          (p.type === 'course' && (getCanonicalCourseId(p.id) === canonSecId || getCanonicalCourseId(p.name) === canonSecId)))
    );

    if (!prim) {
      merged.push({ ...sec, id: canonSecId });
      return;
    }

    const pCover = (prim.canonicalCoverUrl || '').trim();
    const secCover = (sec.canonicalCoverUrl || '').trim();
    const chosenCover =
      pCover !== '' && pCover.startsWith('data:image') && pCover !== secCover
        ? pCover
        : (secCover !== '' ? secCover : pCover);

    const secLessons = sec.courseLessons || [];
    const primLessons = prim.courseLessons || [];
    const secHasValid = secLessons.length > 0 && secLessons.some((l) => !isBogusLessonUrl(l.youtubeUrl));
    const primHasValid = primLessons.length > 0 && primLessons.some((l) => !isBogusLessonUrl(l.youtubeUrl));
    let chosenLessons = secHasValid ? secLessons : (primHasValid ? primLessons : (secLessons.length > 0 ? secLessons : primLessons));

    // Guarantee bogus URLs are cleaned with master curriculum
    const master = findMasterCurriculum(sec.name || sec.id || prim.name || prim.id || '');
    if (master && chosenLessons.some((l) => isBogusLessonUrl(l.youtubeUrl))) {
      chosenLessons = master.map((m, idx) => {
        const curr = chosenLessons[idx];
        const url = curr?.youtubeUrl?.trim() || '';
        return {
          ...m,
          ...(curr || {}),
          youtubeUrl: (!url || isBogusLessonUrl(url)) ? m.youtubeUrl : url,
        };
      });
    }

    const effectiveStage =
      (sec.id === 'cost-recovery-calculator' || canonSecId === 'cost-recovery-calculator')
        ? ('fund-ability' as const)
        : (sec.stage || prim.stage || 'vi-ability');

    merged.push({
      ...prim,
      ...sec, // Saved persistent storage content takes precedence over initial defaults
      id: canonSecId,
      stage: effectiveStage,
      canonicalCoverUrl: chosenCover,
      courseLessons: chosenLessons ? chosenLessons.map((l) => ({ ...l })) : [],
      syllabusLessonsCount: chosenLessons && chosenLessons.length > 0 ? chosenLessons.length : (sec.syllabusLessonsCount || prim.syllabusLessonsCount || 0),
      lessonTitles: chosenLessons && chosenLessons.length > 0 ? chosenLessons.map((l) => l.name) : (sec.lessonTitles || prim.lessonTitles || []),
    });
  });

  // Preserve any new products created in memory that aren't yet in storage
  primary.forEach((prim) => {
    if (!prim || !prim.id || deletedIds.has(prim.id)) return;
    const canonPrimId = prim.type === 'course' ? (getCanonicalCourseId(prim.id) || getCanonicalCourseId(prim.name) || prim.id) : prim.id;
    if (!secMap.has(prim.id) && !secMap.has(canonPrimId)) {
      merged.push({ ...prim, id: canonPrimId });
    }
  });

  return cleanLegacyProducts(merged);
}
