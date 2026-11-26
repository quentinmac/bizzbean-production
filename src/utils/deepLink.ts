import {
  isNoIndexRoute,
  normalizePathname,
  resolveSeoRouteByPath,
  resolveSeoRouteFromState,
  SITE_ORIGIN,
} from '../shared/seoRoutes';

export type DeepLinkView =
  | 'flashcard'
  | 'active-app'
  | 'about'
  | 'footer'
  | 'workspace'
  | 'library'
  | 'ask-gemini'
  | 'admin-centre'
  | 'education-centre'
  | 'bizzclass'
  | 'platform-apps'
  | 'solutions'
  | 'contact'
  | 'article-detail';

export interface ParsedDeepLink {
  hasDeepLink: boolean;
  stageId?: string;
  solutionId?: string;
  view?: DeepLinkView;
  launch?: boolean;
  openDesk?: boolean;
  articleSlug?: string;
  rawParams: Record<string, string>;
}

const VALID_STAGES = new Set([
  'vi-ability',
  'fund-ability',
  'sustain-ability',
  'invest-ability',
  'personal-sandbox',
  'operations-sandbox',
  'operations',
  'growth',
  'education',
]);

const VALID_VIEWS = new Set<DeepLinkView>([
  'flashcard',
  'active-app',
  'about',
  'footer',
  'workspace',
  'library',
  'ask-gemini',
  'admin-centre',
  'education-centre',
  'bizzclass',
  'platform-apps',
  'solutions',
  'contact',
  'article-detail',
]);

const SOLUTION_ALIASES: Record<string, string> = {
  budget: 'bizzbudget',
  'rolling_forecast': 'rolling-forecast',
  'hi-level-forecast': 'rolling-forecast',
  'high-level-forecast': 'rolling-forecast',
  'cost-recovery': 'cost-recovery-calculator',
  'learn-to-earn-capital': 'learn-earn-capital',
  'bizz-calc': 'bizzcalc',
  'bizz-calculators': 'bizzcalculators',
  'bizz-dynamics': 'bizzdynamics',
  'bizz-model': 'bizzmodel',
  'bizz-budget': 'bizzbudget',
  'bizz-money': 'bizzmoney',
  'bizz-plan': 'bizzplan',
  'bizz-forecasta': 'bizzforecasta',
  'bizz-optimizer': 'bizzoptimizer',
  'invest-ability-vdr': 'invest-vdr',
  'sandbox-library': 'sandbox-library',
  library: 'sandbox-library',
  gemini: 'ask-gemini',
  about: 'about-bizzbean',
};

const COURSE_IDS = new Set([
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

const STAGE_DEFAULT_SOLUTION: Record<string, string> = {
  'vi-ability': 'learn-earn-capital',
  'fund-ability': 'cost-recovery-calculator',
  'sustain-ability': 'profit-optimizer',
  'invest-ability': 'invest-vdr',
  'personal-sandbox': 'bizzcalc',
  'operations-sandbox': 'bizzdynamics',
  operations: 'bizzmoney',
  growth: 'growth-strategy',
  education: 'education-centre',
};

const SOLUTION_TO_STAGE: Record<string, string> = {
  'learn-earn-capital': 'vi-ability',
  bizzcalc: 'vi-ability',
  'how-to-bizzcalc': 'vi-ability',
  'cost-recovery-calculator': 'fund-ability',
  'follow-the-money': 'fund-ability',
  'financial-reports': 'fund-ability',
  'your-first-hire': 'fund-ability',
  'profit-optimizer': 'sustain-ability',
  'financial-scenario-planning': 'sustain-ability',
  'annual-business-planning-cycle': 'sustain-ability',
  'sustain-runway': 'sustain-ability',
  'invest-vdr': 'invest-ability',
  bizzdynamics: 'operations-sandbox',
  bizzmodel: 'operations-sandbox',
  bizzforecasta: 'operations-sandbox',
  'rolling-forecast': 'operations-sandbox',
  bizzbudget: 'operations-sandbox',
  bizzcalculators: 'personal-sandbox',
  bizzmoney: 'operations',
  bizzoptimizer: 'operations',
  bizzplan: 'fund-ability',
  'growth-strategy': 'growth',
  'critical-thinking': 'growth',
  'machine-based-learning': 'growth',
  'education-centre': 'education',
  videos: 'education',
  articles: 'education',
};

function normalizeToken(val: string | null): string {
  return (val || '').trim().toLowerCase();
}

export function normalizeSolutionId(raw: string): string {
  const clean = normalizeToken(raw);
  return SOLUTION_ALIASES[clean] || clean;
}

export function inferStageForSolution(solutionId: string): string | undefined {
  return SOLUTION_TO_STAGE[normalizeSolutionId(solutionId)];
}

export function parseDeepLinkFromSearch(search: string): ParsedDeepLink {
  const rawParams: Record<string, string> = {};
  try {
    const params = new URLSearchParams(search || '');
    params.forEach((v, k) => {
      rawParams[k] = v;
    });

    const stageParam = normalizeToken(params.get('stage'));
    const sectionParam = normalizeToken(params.get('section'));
    const solParam = normalizeToken(
      params.get('solution') || params.get('app') || params.get('product')
    );
    const courseParam = normalizeToken(params.get('course'));
    const viewParam = normalizeToken(params.get('view')) as DeepLinkView | '';
    const launchParam = normalizeToken(params.get('launch') || params.get('autoplay'));
    const payfastStatus = normalizeToken(params.get('payfast_status'));

    const isPayfastReturn = payfastStatus === 'success' || payfastStatus === 'cancelled';

    let resolvedStage: string | undefined = VALID_STAGES.has(stageParam) ? stageParam : undefined;
    let resolvedSolution: string | undefined = solParam ? normalizeSolutionId(solParam) : undefined;
    let resolvedView: DeepLinkView | undefined = VALID_VIEWS.has(viewParam as DeepLinkView)
      ? (viewParam as DeepLinkView)
      : undefined;

    if (sectionParam === 'about') {
      resolvedView = 'about';
      resolvedSolution = 'about-bizzbean';
    } else if (
      sectionParam === 'talk-to-us' ||
      sectionParam === 'privacy-policy' ||
      sectionParam === 'terms-of-service'
    ) {
      resolvedView = 'footer';
      resolvedSolution = 'website-footer';
    }
    const launch = launchParam === '1' || launchParam === 'true' || launchParam === 'yes';
    const deskParam = normalizeToken(params.get('desk'));
    const verifiedParam = normalizeToken(params.get('verified'));
    const openDesk =
      launch ||
      deskParam === '1' ||
      deskParam === 'true' ||
      verifiedParam === 'true' ||
      isPayfastReturn ||
      resolvedView === 'active-app' ||
      resolvedView === 'bizzclass' ||
      resolvedView === 'ask-gemini' ||
      resolvedView === 'admin-centre' ||
      resolvedView === 'workspace' ||
      resolvedStage === 'operations' ||
      resolvedStage === 'operations-sandbox' ||
      resolvedStage === 'growth';

    if (courseParam) {
      resolvedSolution = normalizeSolutionId(courseParam);
      if (!resolvedView) {
        resolvedView = launch ? 'bizzclass' : 'flashcard';
      }
    }

    // Handle direct view keywords passed in ?solution=
    if (resolvedSolution === 'sandbox-library') {
      resolvedView = resolvedView || 'library';
    } else if (resolvedSolution === 'ask-gemini') {
      resolvedView = resolvedView || 'ask-gemini';
    } else if (resolvedSolution === 'about-bizzbean') {
      resolvedView = resolvedView || 'about';
    } else if (resolvedSolution === 'education-centre') {
      resolvedView = resolvedView || 'education-centre';
    } else if (resolvedSolution === 'platform-apps') {
      resolvedView = resolvedView || 'platform-apps';
    }

    // If a stage container ID was passed via ?solution=vi-ability
    if (resolvedSolution && VALID_STAGES.has(resolvedSolution)) {
      resolvedStage = resolvedStage || resolvedSolution;
      resolvedSolution = STAGE_DEFAULT_SOLUTION[resolvedSolution] || resolvedSolution;
    }

    if (!resolvedStage && resolvedSolution) {
      resolvedStage = inferStageForSolution(resolvedSolution);
    }

    if (resolvedStage && !resolvedSolution) {
      resolvedSolution = STAGE_DEFAULT_SOLUTION[resolvedStage];
    }

    if (!resolvedView && resolvedSolution) {
      if (launch) {
        resolvedView = COURSE_IDS.has(resolvedSolution) ? 'bizzclass' : 'active-app';
      } else {
        resolvedView = 'flashcard';
      }
    }

    const hasDeepLink = Boolean(
      resolvedStage || resolvedSolution || resolvedView || isPayfastReturn || openDesk
    );

    return {
      hasDeepLink,
      stageId: resolvedStage,
      solutionId: resolvedSolution,
      view: resolvedView,
      launch,
      openDesk,
      rawParams,
    };
  } catch {
    return { hasDeepLink: false, rawParams };
  }
}

export function buildDeepLinkSearch(opts: {
  stageId?: string;
  solutionId?: string;
  view?: DeepLinkView;
  existingSearch?: string;
}): string {
  try {
    const current = new URLSearchParams(opts.existingSearch || '');
    const next = new URLSearchParams();

    // Preserve attribution & debug parameters across navigation
    const preservedKeys = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'gclid',
      'fbclid',
      'debug_mode',
      'ga_debug',
    ];

    if (opts.view === 'library') {
      next.set('view', 'library');
    } else if (opts.view === 'ask-gemini') {
      next.set('view', 'ask-gemini');
    } else if (opts.view === 'about') {
      next.set('view', 'about');
    } else if (opts.view === 'footer') {
      next.set('view', 'footer');
    } else if (opts.view === 'workspace') {
      next.set('view', 'workspace');
    } else if (opts.view === 'education-centre') {
      next.set('view', 'education-centre');
    } else if (opts.view === 'platform-apps') {
      next.set('view', 'platform-apps');
    } else if (opts.view === 'admin-centre') {
      next.set('view', 'admin-centre');
    } else {
      if (opts.stageId) next.set('stage', opts.stageId);
      if (opts.solutionId) next.set('solution', opts.solutionId);
      if (opts.view && opts.view !== 'flashcard') {
        next.set('view', opts.view);
      }
    }

    preservedKeys.forEach((k) => {
      const val = current.get(k);
      if (val) next.set(k, val);
    });

    const qs = next.toString();
    return qs ? `?${qs}` : '';
  } catch {
    return '';
  }
}

/**
 * Parses clean multi-page pathnames (e.g. /library, /vi-ability, /bizzoptimizer, /about)
 * with automatic fallback to legacy query-string parameters (?stage=..., ?solution=..., ?view=...).
 */
export function parseDeepLinkFromLocation(pathname: string, search: string): ParsedDeepLink {
  const fromSearch = parseDeepLinkFromSearch(search);
  const cleanPath = normalizePathname(pathname);

  if (!cleanPath || cleanPath === '/') {
    return fromSearch;
  }

  // Hidden/admin internal paths that still map cleanly if navigated directly (open directly in bizz-DESK)
  if (cleanPath === '/operations' || cleanPath === '/operations-sandbox') {
    const stageId = cleanPath.slice(1);
    return {
      hasDeepLink: true,
      openDesk: true,
      stageId,
      solutionId: STAGE_DEFAULT_SOLUTION[stageId] || 'bizzmoney',
      view: fromSearch.view || 'flashcard',
      launch: fromSearch.launch,
      rawParams: fromSearch.rawParams,
    };
  }
  if (cleanPath === '/growth' || cleanPath === '/growth-strategy') {
    return {
      hasDeepLink: true,
      openDesk: true,
      stageId: 'growth',
      solutionId: 'growth-strategy',
      view: fromSearch.view || 'flashcard',
      launch: fromSearch.launch,
      rawParams: fromSearch.rawParams,
    };
  }
  if (cleanPath === '/ask-gemini' || cleanPath === '/gim') {
    return {
      hasDeepLink: true,
      openDesk: true,
      solutionId: 'ask-gemini',
      view: 'ask-gemini',
      launch: fromSearch.launch,
      rawParams: fromSearch.rawParams,
    };
  }
  if (cleanPath === '/admin-centre' || cleanPath === '/administration-centre') {
    return {
      hasDeepLink: true,
      openDesk: true,
      solutionId: 'administration-centre',
      view: 'admin-centre',
      launch: fromSearch.launch,
      rawParams: fromSearch.rawParams,
    };
  }
  if (cleanPath === '/bizzbudget' || cleanPath === '/bizzmoney') {
    const sol = cleanPath.slice(1);
    return {
      hasDeepLink: true,
      openDesk: true,
      stageId: inferStageForSolution(sol) || 'operations',
      solutionId: sol,
      view: fromSearch.view || 'flashcard',
      launch: fromSearch.launch,
      rawParams: fromSearch.rawParams,
    };
  }

  // Individual article URLs (/articles/<slug>)
  if (cleanPath.startsWith('/articles/')) {
    const articleSlug = cleanPath.slice('/articles/'.length).trim();
    if (articleSlug && !articleSlug.includes('/')) {
      return {
        hasDeepLink: true,
        openDesk: Boolean(fromSearch.openDesk),
        stageId: 'education',
        solutionId: 'articles',
        view: 'article-detail',
        articleSlug,
        launch: fromSearch.launch,
        rawParams: fromSearch.rawParams,
      };
    }
  }

  // Match against authoritative public SEO route table (including aliases like /rolling-forecast -> /bizzoptimizer)
  const seoRoute = resolveSeoRouteByPath(cleanPath);
  if (seoRoute && seoRoute.path !== '/') {
    const targetSol = seoRoute.routeState.solutionId;
    const launch = Boolean(fromSearch.launch);
    let resolvedView: DeepLinkView = fromSearch.view || seoRoute.routeState.view;
    if (launch && targetSol && resolvedView === 'flashcard') {
      resolvedView = COURSE_IDS.has(targetSol) ? 'bizzclass' : 'active-app';
    }
    return {
      hasDeepLink: true,
      openDesk: Boolean(fromSearch.openDesk || resolvedView === 'active-app' || resolvedView === 'bizzclass'),
      stageId: seoRoute.routeState.stageId || fromSearch.stageId,
      solutionId: targetSol || fromSearch.solutionId,
      view: resolvedView,
      launch,
      rawParams: fromSearch.rawParams,
    };
  }

  return fromSearch;
}

/**
 * Builds clean multi-page path URLs (e.g. /vi-ability, /library, /bizzoptimizer, /about)
 * while preserving marketing attribution params (utm_*, gclid, fbclid) and special views.
 */
export function buildCleanPathUrl(opts: {
  stageId?: string;
  solutionId?: string;
  view?: DeepLinkView;
  existingSearch?: string;
}): string {
  try {
    const current = new URLSearchParams(opts.existingSearch || '');
    const preserved = new URLSearchParams();
    const preservedKeys = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'gclid',
      'fbclid',
      'debug_mode',
      'ga_debug',
    ];
    preservedKeys.forEach((k) => {
      const val = current.get(k);
      if (val) preserved.set(k, val);
    });

    let pathname = '/';
    if (opts.view === 'ask-gemini') {
      pathname = '/ask-gemini';
    } else if (opts.view === 'admin-centre') {
      pathname = '/admin-centre';
    } else if (opts.stageId === 'operations' || opts.stageId === 'operations-sandbox' || opts.stageId === 'growth') {
      pathname = `/${opts.stageId}`;
    } else {
      const route = resolveSeoRouteFromState({
        view: opts.view,
        stageId: opts.stageId,
        solutionId: opts.solutionId,
      });
      pathname = route.path;
      if (opts.view === 'active-app' || opts.view === 'bizzclass') {
        preserved.set('view', opts.view);
      }
    }

    const qs = preserved.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  } catch {
    return '/';
  }
}

/**
 * Keeps browser <title>, meta description, robots, canonical link, and OG/Twitter tags
 * cleanly synchronized on client-side page transitions.
 */
export function syncClientSeoMeta(opts: {
  view?: DeepLinkView;
  stageId?: string;
  solutionId?: string;
  pathname?: string;
  customTitle?: string;
  customDescription?: string;
}): void {
  if (typeof document === 'undefined') return;
  try {
    const byPath = opts.pathname ? resolveSeoRouteByPath(opts.pathname) : null;
    const route =
      byPath ||
      resolveSeoRouteFromState({
        view: opts.view,
        stageId: opts.stageId,
        solutionId: opts.solutionId,
      });
    const activePath = opts.pathname || route.path;
    const noIndex = isNoIndexRoute(activePath, typeof window !== 'undefined' ? window.location.search : '');
    const canonicalPath = activePath === '/' ? '/' : normalizePathname(activePath);
    const canonicalUrl =
      canonicalPath === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${canonicalPath}`;

    const finalTitle = opts.customTitle || route.title;
    const finalDescription = opts.customDescription || route.description;

    document.title = finalTitle;

    const upsertMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    upsertMeta('name', 'description', finalDescription);
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    upsertMeta('property', 'og:title', finalTitle);
    upsertMeta('property', 'og:description', finalDescription);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('name', 'twitter:title', finalTitle);
    upsertMeta('name', 'twitter:description', finalDescription);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
  } catch {
    // ignore DOM sync errors
  }
}

