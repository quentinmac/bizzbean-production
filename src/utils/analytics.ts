declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export interface UtmAttribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  landing_url?: string;
  captured_at?: string;
}

const UTM_STORAGE_KEY = 'bizzbean_utm_attribution_v1';
const GA_OVERRIDE_STORAGE_KEY = 'bizzbean_ga_measurement_id';
const GA_DEBUG_SESSION_KEY = 'bizzbean_ga_debug_session';
const GA_ID_REGEX = /^(G|AW)-[A-Z0-9]{4,}$/i;

let runtimeMeasurementId: string | null = null;
let runtimeFetchAttempted = false;
let runtimeFetchInFlight: Promise<string | null> | null = null;
let initializedMeasurementId: string | null = null;
let lastTrackedPageKey: string | null = null;
let lastTrackedItemKey: string | null = null;
const pendingEvents: Array<{ eventName: string; payload: Record<string, any> }> = [];

function normalizeMeasurementId(raw: unknown): string | null {
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/^["']|["']$/g, '');
  if (!cleaned || cleaned.toUpperCase() === 'G-XXXXXXXXXX') return null;
  return GA_ID_REGEX.test(cleaned) ? cleaned : null;
}

export function getActiveMeasurementId(): string | null {
  try {
    const envId = normalizeMeasurementId(import.meta.env?.VITE_GA_MEASUREMENT_ID);
    if (envId) return envId;

    if (runtimeMeasurementId) return runtimeMeasurementId;

    if (typeof window !== 'undefined') {
      const localId = normalizeMeasurementId(localStorage.getItem(GA_OVERRIDE_STORAGE_KEY));
      if (localId) return localId;
    }
  } catch {
    // ignore storage access issues
  }
  return null;
}

export function setAnalyticsMeasurementId(measurementId: string): boolean {
  const clean = normalizeMeasurementId(measurementId);
  if (!clean) return false;
  try {
    localStorage.setItem(GA_OVERRIDE_STORAGE_KEY, clean);
  } catch {}
  initAnalytics();
  return true;
}

export function captureAttributionParams(): UtmAttribution {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const keys: (keyof UtmAttribution)[] = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'gclid',
      'fbclid',
    ];
    const fresh: UtmAttribution = {};
    let hasFresh = false;
    keys.forEach((k) => {
      const val = params.get(k);
      if (val) {
        fresh[k] = val;
        hasFresh = true;
      }
    });

    if (hasFresh) {
      fresh.landing_url = window.location.pathname + window.location.search;
      fresh.captured_at = new Date().toISOString();
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }

    const existing = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (existing) {
      return JSON.parse(existing) as UtmAttribution;
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

export function getCapturedAttribution(): UtmAttribution {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UtmAttribution) : {};
  } catch {
    return {};
  }
}

function isDebugModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const debugParam = params.get('debug_mode');
    if (debugParam === 'false' || params.get('ga_debug') === '0') {
      sessionStorage.removeItem(GA_DEBUG_SESSION_KEY);
      return false;
    }
    if (debugParam === 'true' || params.get('ga_debug') === '1') {
      sessionStorage.setItem(GA_DEBUG_SESSION_KEY, 'true');
      return true;
    }
    return (
      sessionStorage.getItem(GA_DEBUG_SESSION_KEY) === 'true' ||
      localStorage.getItem('bizzbean_ga_debug') === 'true'
    );
  } catch {
    return false;
  }
}

function ensureGtagQueue(): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
  }
}

function bootstrapGtagWithId(measurementId: string): string {
  ensureGtagQueue();
  if (initializedMeasurementId === measurementId) {
    return measurementId;
  }

  const scriptId = `bizzbean-gtag-${measurementId}`;
  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }

  const debugEnabled = isDebugModeEnabled();
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    ...(debugEnabled ? { debug_mode: true } : {}),
  });

  initializedMeasurementId = measurementId;

  // Flush any events emitted before runtime config resolved
  if (pendingEvents.length > 0) {
    const queued = pendingEvents.splice(0, pendingEvents.length);
    for (const item of queued) {
      try {
        window.gtag('event', item.eventName, {
          ...item.payload,
          ...(debugEnabled ? { debug_mode: true } : {}),
        });
      } catch (err) {
        console.warn('[GA4] Queued event tracking warning:', err);
      }
    }
  }

  return measurementId;
}

function resolveRuntimeMeasurementId(): Promise<string | null> {
  if (runtimeFetchInFlight) return runtimeFetchInFlight;
  if (runtimeFetchAttempted) return Promise.resolve(runtimeMeasurementId);

  runtimeFetchInFlight = fetch('/api/config/analytics', { cache: 'no-store' })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      const id = normalizeMeasurementId(data?.measurementId);
      if (id) {
        runtimeMeasurementId = id;
        bootstrapGtagWithId(id);
      }
      return id;
    })
    .catch(() => null)
    .finally(() => {
      runtimeFetchAttempted = true;
      runtimeFetchInFlight = null;
    });

  return runtimeFetchInFlight;
}

export function initAnalytics(): string | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;

  // Always preserve UTM / gclid / debug_mode flags on initial arrival
  captureAttributionParams();
  isDebugModeEnabled();
  ensureGtagQueue();

  const measurementId = getActiveMeasurementId();
  if (measurementId) {
    return bootstrapGtagWithId(measurementId);
  }

  // Fallback to server-side runtime env var (Secrets / Cloud Run runtime injection)
  void resolveRuntimeMeasurementId();
  return null;
}

export function trackEvent(eventName: string, params: Record<string, any> = {}): void {
  if (typeof window === 'undefined') return;

  const attribution = getCapturedAttribution();
  const payload: Record<string, any> = {
    ...params,
    ...(attribution.utm_campaign ? { campaign_name: attribution.utm_campaign } : {}),
    ...(attribution.utm_source ? { campaign_source: attribution.utm_source } : {}),
    ...(attribution.utm_medium ? { campaign_medium: attribution.utm_medium } : {}),
    ...(attribution.utm_term ? { campaign_term: attribution.utm_term } : {}),
    ...(isDebugModeEnabled() ? { debug_mode: true } : {}),
  };

  const measurementId = getActiveMeasurementId();
  if (!measurementId) {
    if (!runtimeFetchAttempted) {
      if (pendingEvents.length < 30) {
        pendingEvents.push({ eventName, payload });
      }
      void resolveRuntimeMeasurementId();
    }
    return;
  }

  if (!initializedMeasurementId) {
    bootstrapGtagWithId(measurementId);
  }

  try {
    ensureGtagQueue();
    window.gtag('event', eventName, payload);
  } catch (err) {
    console.warn('[GA4] Event tracking warning:', err);
  }
}

export function trackPageView(
  pagePath: string,
  pageTitle: string,
  extra: Record<string, any> = {}
): void {
  if (typeof window === 'undefined') return;
  const key = `${pagePath}::${pageTitle}`;
  if (lastTrackedPageKey === key) return;
  lastTrackedPageKey = key;

  trackEvent('page_view', {
    page_path: pagePath,
    page_location: `${window.location.origin}${pagePath}`,
    page_title: pageTitle,
    ...extra,
  });
}

export function trackWorkspaceEnter(
  entryType: 'guest' | 'member' | 'deep_link',
  details: Record<string, any> = {}
): void {
  trackEvent('workspace_enter', {
    entry_type: entryType,
    ...details,
  });
}

export function trackSignUp(
  method: string,
  details: Record<string, any> = {}
): void {
  trackEvent('sign_up', {
    method,
    ...details,
  });
}

export function trackViewItem(item: {
  id: string;
  name: string;
  stage: string;
  type?: string;
  priceZAR?: number;
}): void {
  const key = `${item.stage}::${item.id}`;
  if (lastTrackedItemKey === key) return;
  lastTrackedItemKey = key;

  trackEvent('view_item', {
    currency: 'ZAR',
    value: Number(item.priceZAR || 0),
    stage_id: item.stage,
    solution_id: item.id,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        item_category: item.stage,
        item_variant: item.type || 'solution',
        price: Number(item.priceZAR || 0),
        quantity: 1,
      },
    ],
  });
}

export function trackAppLaunch(item: {
  id: string;
  name: string;
  stage?: string;
  mode: 'app' | 'course';
}): void {
  trackEvent(item.mode === 'course' ? 'course_start' : 'app_launch', {
    solution_id: item.id,
    solution_name: item.name,
    stage_id: item.stage || 'unknown',
    content_type: item.mode,
  });
}

export function trackLessonPlay(
  courseId: string,
  courseName: string,
  lessonTitle: string,
  lessonNumber: number
): void {
  trackEvent('lesson_play', {
    course_id: courseId,
    course_name: courseName,
    lesson_title: lessonTitle,
    lesson_number: lessonNumber,
  });
}

export function trackBeginCheckout(item: {
  id: string;
  name: string;
  priceZAR: number;
  stage?: string;
  type?: string;
}): void {
  trackEvent('begin_checkout', {
    currency: 'ZAR',
    value: Number(item.priceZAR || 0),
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        item_category: item.stage || 'bizzdesk',
        item_variant: item.type || 'solution',
        price: Number(item.priceZAR || 0),
        quantity: 1,
      },
    ],
  });
}

export function trackAddPaymentInfo(item: {
  id: string;
  name: string;
  priceZAR: number;
  paymentType: string;
}): void {
  trackEvent('add_payment_info', {
    currency: 'ZAR',
    value: Number(item.priceZAR || 0),
    payment_type: item.paymentType,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        price: Number(item.priceZAR || 0),
        quantity: 1,
      },
    ],
  });
}

export function trackPurchase(tx: {
  transactionId: string;
  itemId: string;
  itemName: string;
  priceZAR: number;
  stage?: string;
  type?: string;
}): void {
  if (typeof window === 'undefined') return;
  const dedupeKey = `bizzbean_ga_tx_${tx.transactionId}`;
  try {
    if (sessionStorage.getItem(dedupeKey)) return;
    sessionStorage.setItem(dedupeKey, '1');
  } catch {}

  trackEvent('purchase', {
    transaction_id: tx.transactionId,
    currency: 'ZAR',
    value: Number(tx.priceZAR || 0),
    items: [
      {
        item_id: tx.itemId,
        item_name: tx.itemName,
        item_category: tx.stage || 'bizzdesk',
        item_variant: tx.type || 'solution',
        price: Number(tx.priceZAR || 0),
        quantity: 1,
      },
    ],
  });
}
