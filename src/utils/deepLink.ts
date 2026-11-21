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
  | 'platform-apps';

export interface ParsedDeepLink {
  hasDeepLink: boolean;
  stageId?: string;
  solutionId?: string;
  view?: DeepLinkView;
  launch?: boolean;
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
    const launch = launchParam === '1' || launchParam === 'true' || launchParam === 'yes';

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
      resolvedStage || resolvedSolution || resolvedView || isPayfastReturn
    );

    return {
      hasDeepLink,
      stageId: resolvedStage,
      solutionId: resolvedSolution,
      view: resolvedView,
      launch,
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
