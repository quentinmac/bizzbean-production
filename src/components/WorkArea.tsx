import React, { useState } from 'react';
import { BizzSolution, UserBusinessProfile, LibraryItem } from '../types';
import { CmsProduct, CmsVideo, CmsArticle, CmsPromotionSection, INITIAL_CMS_ARTICLES, INITIAL_CMS_VIDEOS, INITIAL_CMS_PRODUCTS } from '../data/cmsConsoleData';
import { Play, ArrowRight, Check, Coins, Bookmark, Sparkles, X, Calculator, ShieldCheck, DollarSign, QrCode, Share2, Layers, RefreshCw, Mic, ChevronLeft, ChevronRight, BookOpen, ShoppingCart, Info, Lock, Pin, UserCheck, Library, ExternalLink, Edit3, Save, RotateCcw, Eye, Database } from 'lucide-react';
import { formatCurrency } from '../utils/financialCalculations';
import { BIZZ_SOLUTIONS } from '../data/bizzdeskData';
import { SmartPricingModal } from './SmartPricingModal';
import { SolutionTransparencyModal } from './SolutionTransparencyModal';
import { SignUpModal } from './SignUpModal';
import { SandboxLibrary } from './SandboxLibrary';
import { AdministrationCentre } from './AdministrationCentre';
import { EducationCentre } from './EducationCentre';
import { BizzClass } from './BizzClass';
import { PlatformApps } from './PlatformApps';
import { PlatformAppPresenter } from '../apps/PlatformAppPresenter';
import { DailyObjective } from './CloseShopModal';
import { Footer } from './Footer';
import { FormattedAboutContent } from './FormattedAboutContent';
import { AboutPanelTextEditor } from './AboutPanelTextEditor';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';
import { ErrorBoundary } from './ErrorBoundary';
import { GeminiSearchDock } from './GeminiSearchDock';
import { StageJourneyGallery } from './StageJourneyGallery';
import {
  DEFAULT_WHO_ARE_WE,
  DEFAULT_WHAT_WE_DO,
  DEFAULT_WHERE_ARE_WE_GOING,
  DEFAULT_HOW_SOLUTIONS_ENABLE_GROWTH,
  DEFAULT_COMPANY_WHAT_WE_DO,
} from '../data/aboutDefaults';
import {
  getCachedAboutContent,
  fetchAboutContentFromCloud,
  AboutBizzbeanContent,
  DEFAULT_MISSION_EQUATION,
  DEFAULT_MISSION_SUBTEXT,
} from '../services/siteContentService';
import { fetchPlatformHelpFromCloud } from '../services/platformHelpService';
import { findMatchingCourse, getCanonicalCourseId, getDeletedProductIds, getDeletedVideoIds, getDeletedArticleIds } from '../utils/imageStorage';

interface WorkAreaProps {
  activeSolution: BizzSolution | null;
  activeStageId?: string;
  activeView: 'flashcard' | 'active-app' | 'about' | 'footer' | 'workspace' | 'library' | 'admin-centre' | 'education-centre' | 'bizzclass' | 'platform-apps' | 'ask-gemini';
  isMember: boolean;
  isAdmin?: boolean;
  tokenBalance: number;
  quickLinkIds: string[];
  userProfile: UserBusinessProfile;
  theme: 'light' | 'dark';
  cmsProducts?: CmsProduct[];
  cmsVideos?: CmsVideo[];
  cmsArticles?: CmsArticle[];
  cmsPromotions?: CmsPromotionSection[];
  activePromotion?: CmsPromotionSection | null;
  showPromotion?: boolean;
  onClosePromotion?: () => void;
  onNavigateToSection?: (promo: CmsPromotionSection) => void;
  onOpenPromotionBillboard?: () => void;
  onCyclePromotion?: (direction: 'next' | 'prev') => void;
  onLaunchSolution: (solutionId?: string) => void;
  onCloseActiveApp: () => void;
  onBuySolution: (sol: BizzSolution) => void;
  onToggleQuickLink: (id: string) => void;
  onOpenVideoModal: (sol: BizzSolution) => void;
  onUpdateProfile: (profile: UserBusinessProfile) => void;
  onSelectSolutionById?: (id: string) => void;
  onOpenSignUp?: () => void;
  onConfirmSignUp?: (name: string, email: string, company: string) => void;
  libraryItems?: LibraryItem[];
  objectives?: DailyObjective[];
  onToggleObjective?: (id: string) => void;
  onAddObjective?: (text: string) => void;
  onOpenLibraryItem?: (item: LibraryItem) => void;
  onSyncProductsToWebsite?: (products: CmsProduct[]) => void;
  onSyncVideosToWebsite?: (videos: CmsVideo[]) => void;
  onSyncArticlesToWebsite?: (articles: CmsArticle[]) => void;
  onSyncPromotionsToWebsite?: (promotions: CmsPromotionSection[]) => void;
  onOpenStandaloneCmsModal?: () => void;
  onBackToWorkstation?: () => void;
  onEnterWorkstation?: () => void;
  adminInitialTab?: 'transactions' | 'dialogue-centre' | 'bulk-imports' | 'promo-emails' | 'cms-console' | 'about-bizzbean';
  onOpenTalkToUs?: () => void;
  userPurchases?: string[];
}

export const WorkArea: React.FC<WorkAreaProps> = ({
  activeSolution,
  activeStageId,
  activeView,
  isMember,
  isAdmin = false,
  userPurchases = [],
  tokenBalance,
  quickLinkIds,
  userProfile,
  theme,
  cmsProducts = [],
  cmsVideos = [],
  cmsArticles = [],
  cmsPromotions = [],
  activePromotion,
  showPromotion = false,
  onClosePromotion,
  onNavigateToSection,
  onOpenPromotionBillboard,
  onCyclePromotion,
  onLaunchSolution,
  onCloseActiveApp,
  onBuySolution,
  onToggleQuickLink,
  onOpenVideoModal,
  onUpdateProfile,
  onSelectSolutionById,
  onOpenSignUp,
  onConfirmSignUp,
  libraryItems = [],
  objectives = [],
  onToggleObjective,
  onAddObjective,
  onOpenLibraryItem,
  onSyncProductsToWebsite,
  onSyncVideosToWebsite,
  onSyncArticlesToWebsite,
  onSyncPromotionsToWebsite,
  onOpenStandaloneCmsModal,
  onBackToWorkstation,
  onEnterWorkstation,
  adminInitialTab,
  onOpenTalkToUs,
}) => {
  const isDark = theme === 'dark';
  // Smart pricing and transparency preview modal state
  const [isSmartPricingModalOpen, setIsSmartPricingModalOpen] = useState(false);
  const [isTransparencyModalOpen, setIsTransparencyModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  // Currency selection on flashcards & apps (USD vs ZAR)
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'ZAR'>('USD');

  // Financial model state inside fund-ability active tool
  const [finRevenue, setFinRevenue] = useState(30000);
  const [finGrowth, setFinGrowth] = useState(10);
  const [finMargin, setFinMargin] = useState(70);
  const [finOpEx, setFinOpEx] = useState(42000);
  const [finCash, setFinCash] = useState(180000);

  // vi-ABILITY unit economics calculator state
  const [cac, setCac] = useState(380);
  const [arpu, setArpu] = useState(140);
  const [churnRate, setChurnRate] = useState(4); // 4% monthly churn
  const [grossMarginPct, setGrossMarginPct] = useState(75);

  // bizzoptimizer margin trimmer state
  const [saasSpend, setSaasSpend] = useState(4800);
  const [vendorSpend, setVendorSpend] = useState(14200);
  const [targetTrimPct, setTargetTrimPct] = useState(15);

  // Accounting invoice creation state inside bizzmoney
  const [invoiceClient, setInvoiceClient] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState(1250);
  const [invoiceStatus, setInvoiceStatus] = useState<'idle' | 'created'>('idle');
  const [voiceSimActive, setVoiceSimActive] = useState(false);

  // Profile share link copied & panel editing state
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditingPanels, setIsEditingPanels] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [workspaceSyncState, setWorkspaceSyncState] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [workspaceNotice, setWorkspaceNotice] = useState<string | null>(null);

  // Official About Bizzbean Cloud-synced content (view-only styling on bizz-desk)
  const [aboutData, setAboutData] = useState<AboutBizzbeanContent>(getCachedAboutContent);

  React.useEffect(() => {
    fetchAboutContentFromCloud().then((cloud) => {
      if (cloud) setAboutData(cloud);
    });
    fetchPlatformHelpFromCloud().catch(() => {});
    const handleUpdate = () => {
      setAboutData(getCachedAboutContent());
    };
    window.addEventListener('bizzbean_about_content_updated', handleUpdate);
    return () => window.removeEventListener('bizzbean_about_content_updated', handleUpdate);
  }, []);

  // Unit economics computations
  const avgLifetimeMonths = churnRate > 0 ? 1 / (churnRate / 100) : 36;
  const ltv = Math.round(arpu * (grossMarginPct / 100) * avgLifetimeMonths);
  const ltvCacRatio = cac > 0 ? (ltv / cac).toFixed(2) : '0';
  const paybackMonths = arpu * (grossMarginPct / 100) > 0 ? (cac / (arpu * (grossMarginPct / 100))).toFixed(1) : 'N/A';

  // Optimizer calculations
  const totalOptimizable = saasSpend + vendorSpend;
  const monthlySavings = Math.round(totalOptimizable * (targetTrimPct / 100));
  const annualSavings = monthlySavings * 12;

  // Active view calculations for fund-ability
  const monthlyGross = (finRevenue * finMargin) / 100;
  const netBurn = Math.max(0, finOpEx - monthlyGross);
  const runwayMonths = netBurn > 0 ? (finCash / netBurn).toFixed(1) : 'Profitable';
  const estValuation = finRevenue * 12 * 6;

  const isPinned = activeSolution ? quickLinkIds.includes(activeSolution.id) : false;
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});

  // Find matching CMS product for currently active solution
  const activeProdCms = (cmsProducts || []).find(
    (p) =>
      p.id === activeSolution?.id ||
      (activeSolution?.id === 'bizzbudget' && p.id === 'budget') ||
      (activeSolution?.id === 'budget' && p.id === 'bizzbudget')
  );

  // Calculate Stage Products for Slider & Purchase Summary Table (per CMS.PDF Page 9)
  // Strictly locked to the active stage; never falls back to arbitrary ID guessing that mixes stages
  const currentStageKey =
    activeStageId ||
    activeProdCms?.stage ||
    activeSolution?.stage ||
    (['profit-optimizer', 'financial-scenario-planning', 'annual-business-planning-cycle', 'sustain-runway', 'sustain-ability'].includes(activeSolution?.id || '') || (activeSolution?.id || '').includes('sustain')
      ? 'sustain-ability'
      : ['bizzoptimizer', 'your-first-hire', 'bizzmoney', 'budget', 'bizzbudget'].includes(activeSolution?.id || '') || (activeSolution?.id || '').includes('operation')
      ? 'operations'
      : ['learn-earn-capital', 'bizzcalc', 'how-to-bizzcalc', 'bizzdynamics', 'vi-ability'].includes(activeSolution?.id || '') || (activeSolution?.id || '').includes('vi-ability')
      ? 'vi-ability'
      : ['cost-recovery-calculator', 'follow-the-money', 'financial-reports', 'bizzmodel', 'bizzplan', 'fund-ability'].includes(activeSolution?.id || '') || (activeSolution?.id || '').includes('fund-ability')
      ? 'fund-ability'
      : (activeSolution?.id || '').includes('invest-ability') || activeSolution?.id === 'invest-vdr'
      ? 'invest-ability'
      : activeSolution?.id === 'personal-sandbox'
      ? 'personal-sandbox'
      : activeSolution?.category === 'operations'
      ? 'operations'
      : activeSolution?.category || 'vi-ability');

  // Educational video streaming state (per educational video.PNG)
  const [activeVideoIdx, setActiveVideoIdx] = useState<number>(0);
  const [activeArticleIdx, setActiveArticleIdx] = useState<number>(0);

  // Memoized deleted products set (declared at top level before any early return)
  const deletedProductIds = React.useMemo(() => getDeletedProductIds(), [cmsProducts]);

  const getYoutubeEmbedUrl = (url?: string) => {
    const raw = (url || 'https://www.youtube-nocookie.com/embed/P3S4s5f').trim();
    
    // Extract video ID from any format (embed, watch?v=, youtu.be, or clean ID)
    let videoId = '';
    const embedMatch = raw.match(/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch && embedMatch[1]) {
      videoId = embedMatch[1];
    } else {
      const watchMatch = raw.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (watchMatch && watchMatch[1]) {
        videoId = watchMatch[1];
      } else {
        const shortMatch = raw.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
        if (shortMatch && shortMatch[1]) {
          videoId = shortMatch[1];
        } else if (/^[a-zA-Z0-9_-]{10,12}$/.test(raw)) {
          videoId = raw;
        }
      }
    }

    if (videoId) {
      // cc_load_policy=3 forcefully turns off captions/subtitles (0 only defers to user preference)
      return `https://www.youtube-nocookie.com/embed/${videoId}?cc_load_policy=3&cc_lang_pref=none&iv_load_policy=3&rel=0&playsinline=1&modestbranding=1`;
    }

    const base = raw.split('?')[0];
    return `${base}?cc_load_policy=3&cc_lang_pref=none&iv_load_policy=3&rel=0&playsinline=1&modestbranding=1`;
  };

  // Render: ADMINISTRATION CENTRE (V1 Working Components transferred to Centre Panel)
  if (activeView === 'admin-centre') {
    return (
      <ErrorBoundary fallbackTitle="Administration Centre Recovery" onReset={onBackToWorkstation}>
        <AdministrationCentre
          theme={theme}
          initialTab={adminInitialTab}
          cmsProducts={cmsProducts}
          cmsVideos={cmsVideos}
          cmsArticles={cmsArticles}
          cmsPromotions={cmsPromotions}
          userProfile={userProfile}
          tokenBalance={tokenBalance}
          onSyncProductsToWebsite={onSyncProductsToWebsite}
          onSyncVideosToWebsite={onSyncVideosToWebsite}
          onSyncArticlesToWebsite={onSyncArticlesToWebsite}
          onSyncPromotionsToWebsite={onSyncPromotionsToWebsite}
          onOpenStandaloneCmsModal={onOpenStandaloneCmsModal}
          onBackToWorkstation={onBackToWorkstation || onCloseActiveApp}
          onNavigateToStage={(stageId, solId) => {
            if (onSelectSolutionById) {
              onSelectSolutionById(solId || stageId);
            }
          }}
          onBuySolution={onBuySolution}
          onSelectSolutionById={onSelectSolutionById}
          onLaunchApp={(appId) => {
            if (onSelectSolutionById) onSelectSolutionById(appId);
            onLaunchSolution();
          }}
        />
      </ErrorBoundary>
    );
  }

  // Render: PLATFORM APPS SUITE (Transferred from V1 to V2 per user brief)
  if (
    activeView === 'platform-apps' ||
    activeSolution?.id === 'platform-apps' ||
    activeSolution?.id === 'platform'
  ) {
    return (
      <PlatformApps
        theme={theme}
        cmsProducts={cmsProducts}
        userPurchases={userPurchases}
        isAdmin={isAdmin}
        userProfile={userProfile}
        tokenBalance={tokenBalance}
        initialAppId={activeSolution?.id}
        onNavigateToStage={(stageId, solId) => {
          if (onSelectSolutionById) {
            onSelectSolutionById(solId || stageId);
          }
        }}
        onBuySolution={onBuySolution}
        onSelectSolutionById={onSelectSolutionById}
        onLaunchApp={(appId) => {
          if (onSelectSolutionById) onSelectSolutionById(appId);
          onLaunchSolution(appId);
        }}
        onBackToWorkstation={onBackToWorkstation || onCloseActiveApp}
        onBackToAdmin={() => {
          if (onSelectSolutionById) onSelectSolutionById('administration-centre');
        }}
      />
    );
  }

  // Render: ASK GEMINI WORKSPACE VIEW (Accessible from Calm Mode footer & mobile carousel)
  if (activeView === 'ask-gemini') {
    return (
      <div
        className={`flex-grow p-4 sm:p-8 overflow-y-auto flex flex-col transition-colors ${
          isDark ? 'bg-[#0A0D14] text-[#E2E8F0]' : 'bg-architectural-grid text-slate-800'
        }`}
      >
        <div className="max-w-3xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E8E2D8] dark:border-[#252E4A]">
            <div>
              <span className="font-mono text-[11px] font-bold text-[#5584B4] uppercase tracking-wider block">
                VENTURE INTELLIGENCE
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-sans">
                Ask Gemini
              </h2>
            </div>
            <button
              type="button"
              onClick={onBackToWorkstation || onCloseActiveApp}
              className="px-3.5 py-2 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] bg-white dark:bg-[#141A2E] text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#F4EFE6] dark:hover:bg-[#1E2548] cursor-pointer lowercase"
            >
              back to work area
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden border border-[#D8CEBC] dark:border-[#252E4A] shadow-sm bg-white dark:bg-[#141A2E]">
            <GeminiSearchDock theme={theme} userProfile={userProfile} />
          </div>
        </div>
      </div>
    );
  }

  // Render: BIZZCLASS EDUCATION DELIVERY SYSTEM (V1 Course Master Suite matching bizzclass.jpg)
  if (
    activeView === 'bizzclass' ||
    activeSolution?.id === 'bizzclass'
  ) {
    const rawCourseCandidate =
      (activeSolution?.id && !['bizzclass', 'courses', 'education-centre', 'vi-ability', 'fund-ability', 'sustain-ability', 'invest-ability', 'personal-sandbox'].includes(activeSolution.id)
        ? activeSolution.id
        : null) ||
      (currentStageKey === 'fund-ability'
        ? 'cost-recovery-calculator'
        : currentStageKey === 'vi-ability'
        ? 'learn-earn-capital'
        : currentStageKey === 'sustain-ability'
        ? 'profit-optimizer'
        : 'cost-recovery-calculator');

    const matchedCourse = findMatchingCourse(rawCourseCandidate, cmsProducts || []);
    const resolvedInitialCourseId = matchedCourse ? matchedCourse.id : (rawCourseCandidate || 'cost-recovery-calculator');
    const courseCanon = getCanonicalCourseId(resolvedInitialCourseId) || resolvedInitialCourseId;
    const isFreeCourse =
      ['learn-earn-capital', 'how-to-bizzcalc', 'follow-the-money', 'vi-ability'].includes(resolvedInitialCourseId) ||
      ['learn-earn-capital', 'how-to-bizzcalc', 'follow-the-money', 'vi-ability'].includes(courseCanon) ||
      (matchedCourse?.sellingPriceZAR === 0);
    const isCourseOwned =
      isAdmin ||
      activeStageId === 'operations-sandbox' ||
      currentStageKey === 'operations-sandbox' ||
      isFreeCourse ||
      userPurchases.includes(resolvedInitialCourseId) ||
      userPurchases.includes(courseCanon);

    if (!isCourseOwned) {
      const courseFallback = BIZZ_SOLUTIONS.find(
        (s) => s.id === resolvedInitialCourseId || s.id === courseCanon
      );
      const coursePrice = matchedCourse?.sellingPriceZAR ?? courseFallback?.priceZAR ?? 229;
      const courseName = matchedCourse?.name || courseFallback?.name || resolvedInitialCourseId;
      const courseSubtitle =
        matchedCourse?.subtitle ||
        courseFallback?.subtitle ||
        'Executive BizzClass Masterclass & Companion Workbook';
      const earnedTokens = matchedCourse?.tokensAllocated ?? Math.round(coursePrice * 0.2);

      return (
        <div
          className={`flex-grow p-6 sm:p-10 flex flex-col items-center justify-center text-center transition-colors ${
            isDark ? 'bg-[#0A0D14] text-white' : 'bg-architectural-grid text-slate-800'
          }`}
        >
          <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl border border-[#D8CEBC] dark:border-[#252E4A] bg-white dark:bg-[#141A2E] shadow-lg space-y-5">
            <div className="mx-auto w-12 h-12 rounded-xl bg-[#5584B4]/10 border border-[#5584B4]/30 flex items-center justify-center text-[#5584B4]">
              <Lock className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-semibold text-[#5584B4] uppercase tracking-wider">
                BizzClass Access Required
              </div>
              <h3 className="text-xl font-bold font-sans text-slate-900 dark:text-white lowercase">
                unlock {courseName}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {courseSubtitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 leading-relaxed">
                This masterclass is reserved for enrolled founders. Unlock it anytime to stream all lessons, download companion workbooks, and earn BizzTokens.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#0E1220] border border-[#E8E2D8] dark:border-[#252E4A] text-left text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Course Investment:</span>
                <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                  R{coursePrice.toFixed(2)} once-off
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>BizzToken Reward:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                  +{earnedTokens} tokens
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const solToBuy: any = matchedCourse || courseFallback || {
                    id: resolvedInitialCourseId,
                    name: courseName,
                    subtitle: courseSubtitle,
                    priceZAR: coursePrice,
                    sellingPriceZAR: coursePrice,
                    exclusivePriceZAR: Math.round((coursePrice / 1.15) * 100) / 100,
                    vatZAR: Math.round((coursePrice - coursePrice / 1.15) * 100) / 100,
                    tokensAllocated: earnedTokens,
                    isPurchased: false,
                  };
                  onBuySolution(solToBuy);
                }}
                className="w-full py-3 rounded-xl bg-[#E02475] hover:bg-[#C91A63] text-white font-bold text-xs uppercase font-mono flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Unlock Course (R{coursePrice.toFixed(2)})</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransparencyModalOpen(true)}
                  className="py-2.5 px-3 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] bg-[#FAF8F5] dark:bg-[#0E1220] text-slate-700 dark:text-slate-200 hover:bg-[#F4EFE6] dark:hover:bg-[#1E2548] text-xs font-mono lowercase cursor-pointer"
                >
                  preview syllabus
                </button>
                <button
                  type="button"
                  onClick={onBackToWorkstation || onCloseActiveApp}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E2548] dark:hover:bg-[#252F52] text-slate-700 dark:text-slate-300 text-xs font-mono lowercase cursor-pointer"
                >
                  back to workspace
                </button>
              </div>
            </div>
          </div>

          <SolutionTransparencyModal
            isOpen={isTransparencyModalOpen}
            onClose={() => setIsTransparencyModalOpen(false)}
            solution={(matchedCourse || courseFallback || activeSolution || (cmsProducts && cmsProducts[0])) as any}
            cmsProducts={cmsProducts}
            isMember={isMember}
            onBuySolution={onBuySolution}
            onOpenSignUp={onOpenSignUp}
            theme={theme}
          />
        </div>
      );
    }

    return (
      <BizzClass
        key={resolvedInitialCourseId}
        theme={theme}
        cmsProducts={cmsProducts || []}
        userProfile={userProfile}
        initialCourseId={resolvedInitialCourseId}
        onBackToWorkstation={onBackToWorkstation || onCloseActiveApp}
        onSyncProductsToWebsite={onSyncProductsToWebsite || (() => {})}
      />
    );
  }

  // Render: EDUCATION CENTRE
  if (
    activeView === 'education-centre' ||
    activeSolution?.id === 'education-centre'
  ) {
    return (
      <EducationCentre
        theme={theme}
        cmsVideos={cmsVideos}
        cmsArticles={cmsArticles}
        cmsProducts={cmsProducts}
        initialTab={
          activeSolution?.id === 'articles'
            ? 'articles'
            : activeSolution?.id === 'courses'
            ? 'courses'
            : 'videos'
        }
        onSyncVideosToWebsite={onSyncVideosToWebsite}
        onSyncArticlesToWebsite={onSyncArticlesToWebsite}
        onSyncProductsToWebsite={onSyncProductsToWebsite}
        onSelectVideoById={(id) => {
          if (onSelectSolutionById) onSelectSolutionById('videos');
        }}
        onSelectArticleById={(id) => {
          if (onSelectSolutionById) onSelectSolutionById('articles');
        }}
        onBackToWorkstation={onBackToWorkstation || onCloseActiveApp}
        onOpenStandaloneCmsModal={onOpenStandaloneCmsModal}
      />
    );
  }

  // Render 0: SANDBOX KNOWLEDGE VAULT & LIBRARY (Client Content Storage & Grounded AI Intelligence)
  if (activeView === 'library') {
    return (
      <SandboxLibrary
        embedded={true}
        theme={theme}
        userProfile={userProfile}
        tokenBalance={tokenBalance}
        onClose={onBackToWorkstation}
        onSelectApp={(appId) => {
          if (onSelectSolutionById) {
            onSelectSolutionById(appId);
          }
        }}
      />
    );
  }

  // Render 1: ABOUT BIZZBEAN & Member Profile Generator (PDF Slide 3 & Notebook Presentation)
  if (activeView === 'about') {
    return (
      <div
        className={`flex-grow p-4 sm:p-8 overflow-y-auto flex flex-col justify-between transition-colors ${
          isDark ? 'bg-[#0A0D14] text-[#E2E8F0]' : 'bg-architectural-grid text-slate-800'
        }`}
      >
        <div className="max-w-4xl mx-auto w-full space-y-6">
          
          {/* Header */}
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-3 ${
              isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  ABOUT BIZZBEAN
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#8CB843]/15 text-[#557827] dark:text-[#A3E635] border border-[#8CB843]/30">
                  OFFICIAL MANIFESTO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                infinite wisdom • instant viability • always on
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono text-slate-500 bg-slate-100 dark:bg-[#161C30] border border-slate-200 dark:border-[#252E4A] flex items-center gap-1.5">
                <Eye className="h-3 w-3 text-slate-400" />
                <span>Presentation Styling Only</span>
              </span>
              {isAdmin && onOpenStandaloneCmsModal && (
                <button
                  type="button"
                  onClick={onOpenStandaloneCmsModal}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#5584B4]/15 hover:bg-[#5584B4]/25 text-[#5584B4] dark:text-[#DDEBF7] border border-[#5584B4]/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Open CMS Console to edit and publish live content"
                >
                  <Database className="h-3 w-3" />
                  <span>CMS Console</span>
                </button>
              )}
            </div>
          </div>

          {/* Official Profile Heading & Mission Equation (Reference: profile heading.PNG) */}
          <div
            className={`p-5 rounded-2xl border shadow-xs transition-colors text-center ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div className="text-[10px] uppercase font-mono font-bold text-amber-500 mb-1.5 tracking-wider">
              LIVE PUBLISHED PROFILE HEADING
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-relaxed uppercase">
              {aboutData.socialMissionEquation || DEFAULT_MISSION_EQUATION}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-2xl mx-auto leading-relaxed">
              {aboutData.socialMissionSubtext || DEFAULT_MISSION_SUBTEXT}
            </div>
          </div>

          {/* 4 Foundational Questions with Paragraphs, Headings, and Bullet Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 01. WHO ARE WE */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
              }`}
            >
              <div>
                <div className="font-mono text-xs font-bold text-slate-500 uppercase mb-2 flex items-center justify-between">
                  <span>01. WHO ARE WE</span>
                  <span className="text-[10px] font-mono text-[#C59B63] lowercase font-normal">identity & purpose</span>
                </div>
                <FormattedAboutContent
                  content={aboutData.whoAreWe || DEFAULT_WHO_ARE_WE}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* 02. WHAT WE DO */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
              }`}
            >
              <div>
                <div className="font-mono text-xs font-bold text-slate-500 uppercase mb-2 flex items-center justify-between">
                  <span>02. WHAT WE DO</span>
                  <span className="text-[10px] font-mono text-[#C59B63] lowercase font-normal">mechanics & tools</span>
                </div>
                <FormattedAboutContent
                  content={aboutData.whatWeDoPanel || aboutData.whatWeDo || DEFAULT_WHAT_WE_DO}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* 03. WHERE ARE WE GOING */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
              }`}
            >
              <div>
                <div className="font-mono text-xs font-bold text-slate-500 uppercase mb-2 flex items-center justify-between">
                  <span>03. WHERE ARE WE GOING</span>
                  <span className="text-[10px] font-mono text-[#C59B63] lowercase font-normal">vision & trajectory</span>
                </div>
                <FormattedAboutContent
                  content={aboutData.whereAreWeGoing || DEFAULT_WHERE_ARE_WE_GOING}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* 04. HOW SOLUTIONS ENABLE GROWTH */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
              }`}
            >
              <div>
                <div className="font-mono text-xs font-bold text-slate-500 uppercase mb-2 flex items-center justify-between">
                  <span>04. HOW SOLUTIONS ENABLE GROWTH</span>
                  <span className="text-[10px] font-mono text-[#C59B63] lowercase font-normal">spectrum & outcomes</span>
                </div>
                <FormattedAboutContent
                  content={aboutData.howSolutionsEnableGrowth || DEFAULT_HOW_SOLUTIONS_ENABLE_GROWTH}
                  isDark={isDark}
                />
              </div>
            </div>
          </div>

          {/* Member Business Profile Section */}
          <div
            className={`rounded-2xl border p-5 shadow-xs ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b mb-4 ${
                isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
              }`}
            >
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {isAdmin
                    ? 'BIZZBEAN – COMPANY PROFILE'
                    : `${userProfile.companyName || 'APEX CLOUD DYNAMICS'} – BUSINESS PROFILE`}
                </h3>
                <p className="text-xs text-slate-500 lowercase mt-0.5">
                  share your verified business profile with clients and investors
                </p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://bizzbean.com/profile/${userProfile.slug}`);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-colors lowercase ${
                  isDark
                    ? 'bg-[#1E2548] text-white hover:bg-[#252E58] border border-[#C59B63]'
                    : 'bg-[#12172A] hover:bg-[#1E2548] text-white'
                }`}
              >
                {copiedLink ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3 text-[#C59B63]" />}
                <span>{copiedLink ? 'link copied' : 'share profile url'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 lowercase mb-1">venture name</label>
                <input
                  type="text"
                  value={userProfile.companyName}
                  onChange={(e) => onUpdateProfile({ ...userProfile, companyName: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg border font-mono text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#0A0D14] border-[#252E4A] text-white focus:border-[#C59B63]'
                      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#12172A]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-500 lowercase mb-1">founder / managing director</label>
                <input
                  type="text"
                  value={userProfile.founderName}
                  onChange={(e) => onUpdateProfile({ ...userProfile, founderName: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg border font-mono text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#0A0D14] border-[#252E4A] text-white focus:border-[#C59B63]'
                      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#12172A]'
                  }`}
                />
              </div>

              {/* Company Website URL Field */}
              <div className="sm:col-span-2">
                <label className="block text-slate-500 lowercase mb-1 flex items-center justify-between">
                  <span>company website url</span>
                  {userProfile.websiteUrl && (
                    <a
                      href={userProfile.websiteUrl.startsWith('http') ? userProfile.websiteUrl : `https://${userProfile.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#5584B4] hover:underline flex items-center gap-1"
                    >
                      <span>visit site</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </label>
                <input
                  type="url"
                  placeholder="https://apexclouddynamics.com"
                  value={userProfile.websiteUrl || ''}
                  onChange={(e) => onUpdateProfile({ ...userProfile, websiteUrl: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg border font-mono text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#0A0D14] border-[#252E4A] text-white focus:border-[#C59B63]'
                      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#12172A]'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-500 lowercase mb-1">what we do / value proposition</label>
                <textarea
                  rows={4}
                  value={userProfile.whatWeDo || ''}
                  onChange={(e) => onUpdateProfile({ ...userProfile, whatWeDo: e.target.value })}
                  placeholder="Enter company value proposition..."
                  className={`w-full px-3 py-2 rounded-lg border font-mono text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#0A0D14] border-[#252E4A] text-white focus:border-[#C59B63]'
                      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#12172A]'
                  }`}
                />
              </div>
            </div>

            {/* Profile QR & Sharing Strip (Clean, without removed text) */}
            <div
              className={`mt-4 pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="h-10 w-10 rounded-lg bg-white p-1 flex items-center justify-center border border-[#D8CEBC] hover:border-[#5584B4] transition-all cursor-pointer shadow-2xs group"
                  title="Click to enlarge QR Code"
                >
                  <QrCode className="h-8 w-8 text-slate-950 group-hover:scale-105 transition-transform" />
                </button>
                <div>
                  <div className={`text-xs font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    bizzbean.com/profile/{userProfile?.slug || 'founder'}
                  </div>
                  {userProfile?.websiteUrl ? (
                    <a
                      href={userProfile.websiteUrl.startsWith('http') ? userProfile.websiteUrl : `https://${userProfile.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#5584B4] hover:underline font-mono flex items-center gap-1 mt-0.5"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>{userProfile.websiteUrl.replace(/^https?:\/\//, '')}</span>
                    </a>
                  ) : (
                    <div className="text-[11px] text-slate-400 font-mono">
                      direct investor & client shareable link
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border flex items-center gap-1.5 transition-colors ${
                    isDark
                      ? 'bg-[#1E2548] border-[#252E4A] text-slate-300 hover:text-white'
                      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>view qr code</span>
                </button>
              </div>
            </div>

          </div>

          {/* QR Code Enlargement Modal */}
          {showQrModal && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
            >
              <div
                className={`relative w-full max-w-sm rounded-2xl border p-6 text-center shadow-2xl ${
                  isDark ? 'bg-[#12172A] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                }`}
              >
                <button
                  onClick={() => setShowQrModal(false)}
                  className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>

                <h4 className="font-bold text-sm uppercase tracking-wider mb-1 font-mono">
                  {userProfile?.companyName || 'Member Profile'} QR
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Scan to view verified public profile and venture details
                </p>

                <div className="mx-auto w-48 h-48 bg-white p-3 rounded-2xl border border-[#D8CEBC] shadow-inner flex flex-col items-center justify-center mb-4">
                  <QrCode className="w-36 h-36 text-slate-950" />
                  <span className="text-[10px] font-mono font-bold text-slate-700 mt-1">
                    bizzbean.com/profile/{userProfile.slug}
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://bizzbean.com/profile/${userProfile.slug}`);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#12172A] text-white hover:bg-[#1E2548] text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5 text-[#C59B63]" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Profile URL'}</span>
                  </button>
                  <button
                    onClick={() => setShowQrModal(false)}
                    className="w-full py-1.5 text-xs font-mono text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Render: GOOGLE WORKSPACE INTEGRATION HUB (per user request)
  if (activeView === 'workspace') {
    return (
      <div
        className={`flex-grow p-4 sm:p-8 overflow-y-auto flex flex-col justify-between transition-colors ${
          isDark ? 'bg-[#0A0D14] text-[#E2E8F0]' : 'bg-architectural-grid text-slate-800'
        }`}
      >
        <div className="max-w-4xl mx-auto w-full space-y-5">
          {/* Header */}
          <div
            className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
            }`}
          >
            <div>
              <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider block">
                CLOUD ECOSYSTEM & SYNCHRONIZATION
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mt-0.5">
                GOOGLE WORKSPACE INTEGRATION
              </h2>
            </div>
            <div className="text-xs font-mono text-[#5584B4] lowercase flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5584B4] animate-pulse" />
              <span>macro-free bidirectional sync</span>
            </div>
          </div>

          {/* Sync Overview Banner */}
          <div className="p-4 rounded-2xl bg-white border border-[#D8CEBC] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-900">
                ACTIVE VIRTUAL DATA ROOM (VDR) DESTINATION
              </div>
              <p className="text-xs text-slate-600">
                All 3-statement models, DCF runs, transaction journals, and audit cards generated in your bizz-DESK are structured and synchronized with zero formula breakage.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#DDEBF7] border border-[#B8D5E5] text-xs font-mono text-[#24496B] shrink-0 font-medium lowercase">
              drive / bizzbean / {userProfile.slug}
            </div>
          </div>

          {/* Google Workspace Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Google Drive */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold uppercase text-[#5584B4]">GOOGLE DRIVE</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#DDEBF7] text-[#24496B] font-semibold lowercase">connected</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Automated Virtual Data Room (VDR) structure with encrypted folder partitioning for investors, creditors, and legal advisors. Auto-exports versioned XLSX models and PDF journals.
              </p>
            </div>

            {/* Google Sheets */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold uppercase text-[#5584B4]">GOOGLE SHEETS</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#DDEBF7] text-[#24496B] font-semibold lowercase">live sync</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Macro-free 3-statement models. Connects directly with bizzmodel, bizzbudget, and bizzoptimizer with native formulas that work seamlessly in Google Sheets, Excel, or Apple Numbers.
              </p>
            </div>

            {/* Google Docs */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold uppercase text-[#5584B4]">GOOGLE DOCS</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#DDEBF7] text-[#24496B] font-semibold lowercase">ready</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                One-click narrative compilation. Automatically transforms your quantitative assumptions and GIM chat takeaways into polished Executive Summaries and Board Briefs.
              </p>
            </div>

            {/* Google Calendar */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold uppercase text-[#5584B4]">GOOGLE CALENDAR</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#DDEBF7] text-[#24496B] font-semibold lowercase">ready</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Critical runway safeguard milestones: schedule quarterly VAT reconciliation sprints, debtor collection follow-ups, and investor updates directly into your founder calendar.
              </p>
            </div>
          </div>

          {/* Sign Up for Google Workspace Value-Add Card (Per workspace.PNG) */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'} space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E2D8] dark:border-[#252E4A]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#5584B4]/15 border border-[#5584B4]/30 flex items-center justify-center shrink-0">
                  <ExternalLink className="h-5 w-5 text-[#5584B4]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      SIGN UP FOR GOOGLE WORKSPACE
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold uppercase border border-emerald-500/30">
                      client value-add
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Equip your venture with professional custom domain emails, cloud storage & enterprise productivity
                  </p>
                </div>
              </div>

              <a
                href="https://workspace.google.com/business/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-semibold lowercase transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer font-['Raleway'] shrink-0"
              >
                <span>sign up to google workspace</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#9FC754]" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs text-slate-600 dark:text-slate-300">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0E1220] border-[#222E4E]' : 'bg-[#FAF8F5] border-[#E8E2D8]'}`}>
                <div className="font-bold text-slate-900 dark:text-white font-mono lowercase mb-1 text-[11px]">
                  1. custom venture email
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Operate with institutional credibility using custom addresses like <code className="font-mono text-[#5584B4]">founder@{userProfile.slug || 'company'}.com</code> instead of generic mailboxes.
                </p>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0E1220] border-[#222E4E]' : 'bg-[#FAF8F5] border-[#E8E2D8]'}`}>
                <div className="font-bold text-slate-900 dark:text-white font-mono lowercase mb-1 text-[11px]">
                  2. automated vdr cloud
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Pooled 30 GB to 5 TB encrypted Google Drive storage per team member with automated partition folders for investors, cap table, and audits.
                </p>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0E1220] border-[#222E4E]' : 'bg-[#FAF8F5] border-[#E8E2D8]'}`}>
                <div className="font-bold text-slate-900 dark:text-white font-mono lowercase mb-1 text-[11px]">
                  3. bizz-desk live bridge
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Export 3-statement models, DCF valuations, and transaction journals into Google Sheets with zero proprietary lock-in.
                </p>
              </div>
            </div>
          </div>

          {/* Direct Action Hub */}
          <div className="p-4 rounded-2xl bg-white border border-[#D8CEBC] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900 lowercase block">status: client-side oauth token bridge enabled</span>
              <span className="text-[11px] text-slate-500 lowercase">no proprietary lock-in. all formulas and outputs remain 100% your venture's intellectual property.</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://workspace.google.com/business/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-[#5584B4] text-slate-700 dark:text-slate-300 hover:text-slate-950 text-xs font-semibold lowercase transition-colors flex items-center gap-1.5 cursor-pointer font-['Raleway']"
              >
                <span>sign up to google workspace</span>
                <ExternalLink className="h-3 w-3 text-[#5584B4]" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setWorkspaceSyncState('syncing');
                  setTimeout(() => {
                    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(
                      `Venture,${userProfile.companyName || 'Bizzbean Founder'}\n` +
                      `Date,${new Date().toISOString().slice(0, 10)}\n` +
                      `Metric,Value\n` +
                      `Monthly Revenue,R ${finRevenue}\n` +
                      `Gross Margin %,${finMargin}%\n` +
                      `Monthly OpEx,R ${finOpEx}\n` +
                      `Available Cash,R ${finCash}\n` +
                      `Runway Months,${runwayMonths}\n` +
                      `Estimated Valuation,R ${estValuation}\n`
                    );
                    const link = document.createElement("a");
                    link.setAttribute("href", csvContent);
                    link.setAttribute("download", `${(userProfile.slug || 'bizzbean')}_financial_model.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    setWorkspaceSyncState('synced');
                    setWorkspaceNotice(`Venture financial model exported successfully. Open directly in Google Sheets or Microsoft Excel.`);
                    setTimeout(() => setWorkspaceNotice(null), 6000);
                  }, 600);
                }}
                disabled={workspaceSyncState === 'syncing'}
                className="px-4 py-2 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white text-xs font-semibold lowercase transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
              >
                <span>{workspaceSyncState === 'syncing' ? 'exporting...' : workspaceSyncState === 'synced' ? 'model exported' : 'export model to google sheets / excel'}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#C59B63]" />
              </button>
            </div>
          </div>

          {workspaceNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>{workspaceNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceNotice(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Render 2: WEBSITE FOOTER (Per footer.PNG)
  if (activeView === 'footer') {
    return (
      <div className="flex-grow overflow-y-auto flex flex-col justify-between">
        <Footer
          userRole={isAdmin ? 'admin' : (isMember ? 'member' : 'public')}
          isMember={isMember}
          onNavigate={(view) => {
            if (view === 'home' && onBackToWorkstation) {
              onBackToWorkstation();
            } else if (view === 'about' && onSelectSolutionById) {
              onSelectSolutionById('about-bizzbean');
            }
          }}
          onOpenTalkToUs={() => {
            if (onOpenTalkToUs) {
              onOpenTalkToUs();
            } else if (onSelectSolutionById) {
              onSelectSolutionById('dialogue');
            }
          }}
        />
      </div>
    );
  }

  // Render 3: ACTIVE WORKING APPLICATION (Platform App Delivery Suite matching BizzClass)
  if (activeView === 'active-app') {
    const solName = (activeSolution?.name || '').toLowerCase();
    const solId = (activeSolution?.id || '').toLowerCase();
    const effectiveAppId =
      solName.includes('forecasta') || solId.includes('forecasta')
        ? 'bizzforecasta'
        : solName.includes('calculators') || solId.includes('calculators')
        ? 'bizzcalculators'
        : solName.includes('dynamics') || solId.includes('dynamics')
        ? 'bizzdynamics'
        : solName.includes('budget') || solId.includes('budget')
        ? 'bizzbudget'
        : solName.includes('rolling') || solId.includes('rolling') || solName.includes('optimizer') || solId.includes('optimizer')
        ? 'rolling-forecast'
        : solName.includes('model') || solId.includes('model') || solName.includes('hi-level') || solId.includes('hi-level')
        ? 'bizzmodel'
        : activeSolution?.id || 'bizzcalc';

    const canon = getCanonicalCourseId(effectiveAppId) || effectiveAppId;
    const isFree =
      ['learn-earn-capital', 'how-to-bizzcalc', 'follow-the-money', 'vi-ability'].includes(effectiveAppId) ||
      ['learn-earn-capital', 'how-to-bizzcalc', 'follow-the-money', 'vi-ability'].includes(canon);

    const rawSolId = activeSolution?.id || '';
    const isOwned =
      isAdmin ||
      activeStageId === 'operations-sandbox' ||
      currentStageKey === 'operations-sandbox' ||
      isFree ||
      userPurchases.includes(effectiveAppId) ||
      userPurchases.includes(canon) ||
      (rawSolId !== '' && userPurchases.includes(rawSolId)) ||
      (effectiveAppId === 'budget' && userPurchases.includes('bizzbudget')) ||
      (effectiveAppId === 'bizzbudget' && userPurchases.includes('budget'));

    if (!isOwned) {
      const matchingCms =
        (cmsProducts || []).find(
          (p) => p.id === effectiveAppId || p.id === canon || (rawSolId !== '' && p.id === rawSolId)
        ) ||
        (cmsProducts || []).find((p) => {
          const n = (p.name || '').toLowerCase();
          return effectiveAppId === 'rolling-forecast' && (n.includes('rolling') || n.includes('optimizer'));
        });
      const appPrice = matchingCms?.sellingPriceZAR ?? 229;
      const appName = matchingCms?.name || effectiveAppId;
      const appSubtitle =
        matchingCms?.subtitle ||
        (effectiveAppId === 'bizzcalc'
          ? 'Cost Recovery, Break-Even & Contribution Margin Simulator'
          : 'Financial Modeling & Simulation App');
      const earnedTokens = matchingCms?.tokensAllocated ?? Math.round(appPrice * 0.2);

      return (
        <div
          className={`flex-grow p-6 sm:p-10 flex flex-col items-center justify-center text-center transition-colors ${
            isDark ? 'bg-[#0A0D14] text-white' : 'bg-architectural-grid text-slate-800'
          }`}
        >
          <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl border border-[#D8CEBC] dark:border-[#252E4A] bg-white dark:bg-[#141A2E] shadow-lg space-y-5">
            <div className="mx-auto w-12 h-12 rounded-xl bg-[#5584B4]/10 border border-[#5584B4]/30 flex items-center justify-center text-[#5584B4]">
              <Lock className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-semibold text-[#5584B4] uppercase tracking-wider">
                Solution Access Required
              </div>
              <h3 className="text-xl font-bold font-sans text-slate-900 dark:text-white lowercase">
                unlock {appName}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {appSubtitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 leading-relaxed">
                This application is not yet unlocked on your account. Unlock full workspace access anytime to run scenarios, export models, and earn BizzTokens.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#0E1220] border border-[#E8E2D8] dark:border-[#252E4A] text-left text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Solution Investment:</span>
                <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                  R{appPrice.toFixed(2)} once-off
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>BizzToken Reward:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                  +{earnedTokens} tokens
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const solToBuy: any = matchingCms || {
                    id: effectiveAppId,
                    name: appName,
                    subtitle: appSubtitle,
                    priceZAR: appPrice,
                    sellingPriceZAR: appPrice,
                    exclusivePriceZAR: Math.round((appPrice / 1.15) * 100) / 100,
                    vatZAR: Math.round((appPrice - appPrice / 1.15) * 100) / 100,
                    tokensAllocated: earnedTokens,
                    isPurchased: false,
                  };
                  onBuySolution(solToBuy);
                }}
                className="w-full py-3 rounded-xl bg-[#E02475] hover:bg-[#C91A63] text-white font-bold text-xs uppercase font-mono flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Unlock Solution (R{appPrice.toFixed(2)})</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransparencyModalOpen(true)}
                  className="py-2.5 px-3 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] bg-[#FAF8F5] dark:bg-[#0E1220] text-slate-700 dark:text-slate-200 hover:bg-[#F4EFE6] dark:hover:bg-[#1E2548] text-xs font-mono lowercase cursor-pointer"
                >
                  view deliverables
                </button>
                <button
                  type="button"
                  onClick={onCloseActiveApp}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E2548] dark:hover:bg-[#252F52] text-slate-700 dark:text-slate-300 text-xs font-mono lowercase cursor-pointer"
                >
                  back to workspace
                </button>
              </div>
            </div>
          </div>

          <SolutionTransparencyModal
            isOpen={isTransparencyModalOpen}
            onClose={() => setIsTransparencyModalOpen(false)}
            solution={(matchingCms || activeSolution || (cmsProducts && cmsProducts[0])) as any}
            cmsProducts={cmsProducts}
            isMember={isMember}
            onBuySolution={onBuySolution}
            onOpenSignUp={onOpenSignUp}
            theme={theme}
          />
        </div>
      );
    }

    return (
      <PlatformAppPresenter
        theme={theme}
        initialAppId={effectiveAppId}
        cmsProducts={cmsProducts}
        userProfile={userProfile}
        tokenBalance={tokenBalance}
        onBackToWorkstation={onCloseActiveApp}
        onNavigateToStage={(stageId, solId) => {
          if (onSelectSolutionById) {
            onSelectSolutionById(solId || stageId);
          }
        }}
        onBuySolution={onBuySolution}
      />
    );
  }

  // Render 4: THE SOLUTION FLASHCARD (Default view for exploring, as depicted in PDF Slides 4 & 5)
  if (!activeSolution) {
    return (
      <div
        className={`flex-grow p-8 flex flex-col items-center justify-center text-center transition-colors ${
          isDark ? 'bg-[#0A0D14] text-white' : 'bg-[#F8FAFC] text-slate-800'
        }`}
      >
        <div className="font-mono text-xs text-slate-500 mb-2">SELECT A SOLUTION FROM THE LEFT PANEL</div>
        <h3 className="font-['Outfit'] text-2xl font-bold text-slate-900 dark:text-white">
          Welcome to your bizz-DESK Work Area
        </h3>
        <p className="text-xs text-slate-500 mt-2 max-w-md">
          Explore our solutions across the Startup, Operations, Growth, and Educational stages without vertical page scrolling.
        </p>
      </div>
    );
  }

  // Determine stage accent color strictly for the product card (per page 2.PNG request)
  const getStageCardBorder = (category: string) => {
    switch (category) {
      case 'growth':
        // Changed from purple to the bizzbean blue (#DDEBF7) with refined #5584B4 outline
        return isDark
          ? 'border-[#5584B4] bg-[#161C30]'
          : 'border-[#5584B4] ring-2 ring-[#DDEBF7] bg-white shadow-xs';
      case 'startup':
        return isDark
          ? 'border-[#5584B4]/60 bg-[#161C30]'
          : 'border-[#5584B4]/40 ring-1 ring-[#DDEBF7] bg-white shadow-xs';
      case 'operations':
        return isDark
          ? 'border-[#5584B4]/60 bg-[#161C30]'
          : 'border-[#5584B4]/40 ring-1 ring-[#DDEBF7] bg-white shadow-xs';
      case 'education':
        return isDark
          ? 'border-[#D8CEBC] bg-[#161C30]'
          : 'border-[#D8CEBC] ring-1 ring-[#DDEBF7] bg-white shadow-xs';
      default:
        return isDark
          ? 'border-[#252E4A] bg-[#161C30]'
          : 'border-[#DDEBF7] bg-white shadow-xs';
    }
  };

  const getStageTagColor = (category: string) => {
    switch (category) {
      case 'growth':
        return 'text-[#5584B4] dark:text-[#DDEBF7]';
      case 'startup':
        return 'text-[#5584B4] dark:text-[#DDEBF7]';
      case 'operations':
        return 'text-[#5584B4] dark:text-[#DDEBF7]';
      case 'education':
        return 'text-[#9A7B4F] dark:text-[#D4A373]';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const vatAmountUSD = Math.round(activeSolution.priceUSD * activeSolution.vatRate);
  const totalUSD = activeSolution.priceUSD + vatAmountUSD;

  // Check if viewing Educational Support (videos or articles)
  const isVideoMode = activeSolution.id === 'videos';
  const isArticlesMode = activeSolution.id === 'articles';
  const isEducationMode = isVideoMode || isArticlesMode || activeSolution.category === 'education';

  const deletedVideoIds = getDeletedVideoIds();
  const effectiveVideos = (cmsVideos && cmsVideos.length > 0 ? cmsVideos : INITIAL_CMS_VIDEOS).filter(
    (v) => v && v.id && !deletedVideoIds.has(v.id)
  );
  const currentVideo: CmsVideo =
    effectiveVideos.length > 0
      ? effectiveVideos[activeVideoIdx % effectiveVideos.length] || effectiveVideos[0]
      : {
          id: 'vid-placeholder',
          title: 'no videos available',
          author: 'the bizzbean channel',
          duration: '0:00',
          youtubeUrl: '',
          isMustWatch: false,
          category: 'education',
          linked: false,
        };

  const deletedArticleIds = getDeletedArticleIds();
  const effectiveArticles: CmsArticle[] = (
    cmsArticles && cmsArticles.length > 0 ? cmsArticles : INITIAL_CMS_ARTICLES
  ).filter((a) => a && a.id && !deletedArticleIds.has(a.id));
  const currentArticle: CmsArticle =
    effectiveArticles.length > 0
      ? effectiveArticles[activeArticleIdx % effectiveArticles.length] || effectiveArticles[0]
      : {
          id: 'art-placeholder',
          title: 'no articles available',
          author: 'the bizzbean channel',
          readTime: '0 min read',
          publishedDate: '',
          isMustRead: false,
          category: 'strategy',
          summary: 'No articles currently in repository.',
          content: '',
          imageUrl: '',
        };

  // Stage products: for personal-sandbox, present all active/published live solutions (excluding hidden operations-sandbox)
  // For specific stages (vi-ability, fund-ability, etc.), restrict strictly to that stage
  const stageProductItems: CmsProduct[] = (cmsProducts || [])
    .filter((p: CmsProduct) => {
      if (currentStageKey === 'personal-sandbox') {
        return p.stage !== 'operations-sandbox' && p.stage !== 'personal-sandbox';
      }
      return p.stage === currentStageKey;
    })
    .filter((p: CmsProduct) => p.id !== 'vi-ability' && !(currentStageKey === 'vi-ability' && (p.id === 'cost-recovery-calculator' || p.id === 'prod-1791293136272' || (p.name || '').toLowerCase().includes('cost recovery'))))
    .sort((a, b) => {
      if (currentStageKey === 'personal-sandbox') {
        const STAGE_ORDER: Record<string, number> = {
          'vi-ability': 1,
          'fund-ability': 2,
          'sustain-ability': 3,
          'invest-ability': 4,
          'operations': 5,
          'growth': 6,
          'education': 7,
        };
        const orderA = STAGE_ORDER[a.stage] || 99;
        const orderB = STAGE_ORDER[b.stage] || 99;
        if (orderA !== orderB) return orderA - orderB;
      }
      return (a.seq || 0) - (b.seq || 0);
    })
    .filter((p: CmsProduct, _idx: number, arr: CmsProduct[]) => {
      const normName = (p.name || '').trim().toLowerCase();
      if (normName !== 'bizzbudget' || p.type !== 'app') return true;
      const matches = arr.filter(
        (x) => (x.name || '').trim().toLowerCase() === 'bizzbudget' && x.type === 'app'
      );
      if (matches.length <= 1) return true;
      const isLegacy = (x: CmsProduct) =>
        (x.sku || '').trim().toUpperCase() === 'BA-007' ||
        Math.abs(Number(x.sellingPriceZAR ?? 0) - 260) <= 0.05;
      const nonLegacyMatches = matches.filter((x) => !isLegacy(x));
      if (nonLegacyMatches.length > 0) {
        return p === nonLegacyMatches[0];
      }
      return p === matches[0];
    });

  // Helper to determine whether a product/course is owned by the current user
  const checkIsPurchased = (p: any): boolean => {
    if (!p) return false;
    const price = p.sellingPriceZAR !== undefined ? p.sellingPriceZAR : (p.priceZAR ?? 0);
    if (price === 0) return true;
    const id = (p.id || '').trim();
    if (['learn-earn-capital', 'how-to-bizzcalc', 'follow-the-money'].includes(id)) return true;
    const canon = getCanonicalCourseId(id) || id;
    const name = (p.name || '').toLowerCase().trim();
    return (
      (userPurchases || []).includes(id) ||
      (userPurchases || []).includes(canon) ||
      (userPurchases || []).some(
        (up) =>
          up.toLowerCase() === id.toLowerCase() ||
          up.toLowerCase() === canon.toLowerCase() ||
          (name && up.toLowerCase() === name)
      )
    );
  };

  // Fallback solutions strictly restricted to the current stage or all public solutions if personal-sandbox
  const fallbackStageSolutions = BIZZ_SOLUTIONS.filter(
    (s: BizzSolution) => {
      if (currentStageKey === 'personal-sandbox') {
        return (
          s.id !== 'personal-sandbox' &&
          s.id !== 'vi-ability' &&
          s.id !== 'budget' &&
          s.id !== 'strategy' &&
          !['invest-vdr', 'invest-ability', 'bizzdynamics', 'bizzmodel', 'hi-level-forecast', 'bizzforecasta', 'bizzmoney', 'bizzplan', 'sustain-runway', 'bizzoptimizer', 'growth-strategy'].includes(s.id) &&
          !deletedProductIds.has(s.id) &&
          !deletedProductIds.has(s.name.toLowerCase().trim())
        );
      }
      return (
        s.stage === currentStageKey &&
        s.id !== currentStageKey &&
        s.id !== 'budget' &&
        s.id !== 'strategy' &&
        !['invest-vdr', 'invest-ability'].includes(s.id) &&
        !deletedProductIds.has(s.id) &&
        !deletedProductIds.has(s.name.toLowerCase().trim())
      );
    }
  ).map((s: BizzSolution, idx: number) => {
    const selling = s.priceZAR;
    const excl = Math.round((selling / 1.15) * 100) / 100;
    const vat = Math.round((selling - excl) * 100) / 100;
    const ticket = Math.round((selling * 1.20) * 100) / 100;
    const tokens = s.tokensAllocated || Math.round(selling * 0.20 * 10) / 10;
    return {
      id: s.id,
      name: s.name,
      sku: `BA-00${idx + 1}`,
      type: 'solution' as const,
      isPurchased: checkIsPurchased(s),
      billingModel: s.billingModel || 'once-off',
      exclusivePriceZAR: excl,
      vatZAR: vat,
      sellingPriceZAR: selling,
      tokensAllocated: tokens,
      ticketPriceZAR: ticket,
      canonicalCoverUrl: s.imageUrl || '',
      imageUrl: s.imageUrl || '',
    };
  });

  const hasCmsCatalog = Array.isArray(cmsProducts) && cmsProducts.length > 0;
  const displayTableProducts: any[] = hasCmsCatalog
    ? stageProductItems
    : fallbackStageSolutions;

  const totalExclusive = displayTableProducts.reduce((sum: number, p: any) => sum + (p.exclusivePriceZAR || 0), 0);
  const totalVat = displayTableProducts.reduce((sum: number, p: any) => sum + (p.vatZAR || 0), 0);
  const totalSelling = displayTableProducts.reduce((sum: number, p: any) => sum + (p.sellingPriceZAR || 0), 0);
  const totalTokens = displayTableProducts.reduce((sum: number, p: any) => sum + (p.tokensAllocated || 0), 0);
  const totalTicket = displayTableProducts.reduce((sum: number, p: any) => sum + (p.ticketPriceZAR || 0), 0);

  const currentProductIdx = displayTableProducts.findIndex(
    (p: any) =>
      p.id === activeSolution?.id ||
      (activeSolution?.id === 'bizzbudget' && p.id === 'budget') ||
      (activeSolution?.id === 'budget' && p.id === 'bizzbudget')
  );
  const safeProductIdx = currentProductIdx >= 0 ? currentProductIdx : 0;

  // Buy handler for solutions in the stage summary table (particularly solves personal-sandbox selection/purchase)
  const handleBuyTableRow = (p: any) => {
    const matchingSolution = BIZZ_SOLUTIONS.find(
      (s) => s.id === p.id || (p.id === 'budget' && s.id === 'bizzbudget')
    );
    const matchingCms = (cmsProducts || []).find(
      (cp: any) => cp.id === p.id || (p.id === 'budget' && cp.id === 'bizzbudget')
    );
    const selling = matchingCms ? matchingCms.sellingPriceZAR : (p.sellingPriceZAR !== undefined ? p.sellingPriceZAR : (matchingSolution?.priceZAR || 0));
    const excl = matchingCms ? matchingCms.exclusivePriceZAR : (p.exclusivePriceZAR !== undefined ? p.exclusivePriceZAR : Math.round((selling / 1.15) * 100) / 100);
    const vat = matchingCms ? matchingCms.vatZAR : (p.vatZAR !== undefined ? p.vatZAR : Math.round((selling - excl) * 100) / 100);
    const tokens = matchingCms ? matchingCms.tokensAllocated : (p.tokensAllocated !== undefined ? p.tokensAllocated : Math.round(selling * 0.20 * 10) / 10);

    const solToBuy: any = {
      ...(matchingSolution || {}),
      id: p.id,
      name: p.name,
      category: p.category || (p.stage === 'operations' ? 'operations' : 'startup'),
      stage: p.stage || currentStageKey,
      priceUSD: Math.round(selling / 18.5),
      priceZAR: selling,
      sellingPriceZAR: selling,
      exclusivePriceZAR: excl,
      vatZAR: vat,
      tokensAllocated: tokens,
      billingModel: p.billingModel || 'once-off',
      imageUrl: p.canonicalCoverUrl || p.imageUrl || matchingSolution?.imageUrl || '',
      isPurchased: false,
      description: p.description || matchingSolution?.description || '',
      subtitle: p.subtitle || matchingSolution?.subtitle || '',
      purpose: p.purpose || p.description || matchingSolution?.purpose || '',
      stageCode: p.sku || matchingSolution?.stageCode || '',
      features: p.modules || p.lessonTitles || matchingSolution?.features || [],
    };
    onBuySolution(solToBuy);
  };

  // Restrict previous and next buttons strictly to items within the current stage only
  const handlePrevSolution = () => {
    if (displayTableProducts.length === 0) return;
    const prevIdx = (safeProductIdx - 1 + displayTableProducts.length) % displayTableProducts.length;
    const targetProduct = displayTableProducts[prevIdx];
    if (targetProduct && onSelectSolutionById) {
      onSelectSolutionById(targetProduct.id);
    }
  };
  const handleNextSolution = () => {
    if (displayTableProducts.length === 0) return;
    const nextIdx = (safeProductIdx + 1) % displayTableProducts.length;
    const targetProduct = displayTableProducts[nextIdx];
    if (targetProduct && onSelectSolutionById) {
      onSelectSolutionById(targetProduct.id);
    }
  };

  // Available promotions & current index for Hero Splash Page stage stories
  const availablePromos = (cmsPromotions || []).filter(
    (p) =>
      p.isActive !== false &&
      p.imageUrl &&
      p.imageUrl.trim() !== '' &&
      !p.imageUrl.includes('1553877522-43269d4ea984')
  );
  const currentPromoIndex = activePromotion
    ? availablePromos.findIndex((p) => p.id === activePromotion.id)
    : 0;
  const activePromoNum = currentPromoIndex >= 0 ? currentPromoIndex + 1 : 1;
  const totalPromosCount = availablePromos.length;
  const isHeroSplashMode = Boolean(showPromotion);

  return (
    <div
      className={`flex-1 min-h-0 h-full w-full p-3 sm:p-6 md:p-7 pb-10 sm:pb-12 overflow-y-auto overflow-x-hidden touch-pan-y min-w-0 max-w-full flex flex-col transition-colors ${
        isDark ? 'bg-[#0A0D14]' : 'bg-architectural-grid'
      }`}
    >
      <div className={`${isHeroSplashMode ? 'max-w-6xl' : 'max-w-4xl'} mx-auto w-full min-w-0 space-y-5 shrink-0`}>
        
        {/* PANEL A: TOP STAGE NAVIGATION PANEL (Stage name, Previous & Next solution buttons, clean panel styling) */}
        {!isHeroSplashMode && (
          <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-[#141A2E] border border-[#D8CEBC] dark:border-[#252E4A] shadow-xs">
            {/* Left: Direction indicator (Icon-only on mobile, text on desktop) */}
            <button
              type="button"
              onClick={() => {
                if (isVideoMode) {
                  setActiveVideoIdx((activeVideoIdx - 1 + effectiveVideos.length) % effectiveVideos.length);
                } else if (isArticlesMode) {
                  setActiveArticleIdx((activeArticleIdx - 1 + effectiveArticles.length) % effectiveArticles.length);
                } else {
                  handlePrevSolution();
                }
              }}
              disabled={!isVideoMode && !isArticlesMode && displayTableProducts.length <= 1}
              className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#0E1220] hover:bg-[#F4EFE6] dark:hover:bg-[#1E2548] border border-[#D8CEBC] dark:border-[#252E4A] text-xs font-mono text-slate-800 dark:text-slate-100 transition-colors lowercase font-semibold shrink-0 cursor-pointer ${
                !isVideoMode && !isArticlesMode && displayTableProducts.length <= 1 ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              title={!isVideoMode && !isArticlesMode && displayTableProducts.length <= 1 ? `Only 1 item in ${currentStageKey}` : `Previous item in ${currentStageKey}`}
              aria-label="Previous item"
            >
              <ChevronLeft className="h-4 w-4 text-[#5584B4]" />
              <span className="hidden sm:inline">previous</span>
            </button>

            {/* Center: Line 1 = Sandbox / Stage header, Line 2 = Solution details (e.g. 2 of 10 solutions) */}
            <div className="text-center font-mono px-2 min-w-0 flex-1">
              <span className="text-xs sm:text-base font-bold text-slate-900 dark:text-white tracking-wide lowercase block truncate">
                {isVideoMode
                  ? 'video playlist'
                  : isArticlesMode
                  ? 'knowledge base articles'
                  : currentStageKey === 'personal-sandbox'
                  ? 'personal sandbox'
                  : currentStageKey}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5 lowercase truncate">
                {isVideoMode
                  ? (effectiveVideos.length === 0 ? '0 videos' : `${activeVideoIdx + 1} of ${effectiveVideos.length} videos`)
                  : isArticlesMode
                  ? (effectiveArticles.length === 0 ? '0 articles' : `${activeArticleIdx + 1} of ${effectiveArticles.length} articles`)
                  : displayTableProducts.length === 0
                  ? '0 solutions'
                  : displayTableProducts.length === 1
                  ? '1 of 1 solution'
                  : `${safeProductIdx + 1} of ${displayTableProducts.length} solutions`}
              </span>
            </div>

            {/* Right: Direction indicator (Icon-only on mobile, text on desktop) */}
            <button
              type="button"
              onClick={() => {
                if (isVideoMode) {
                  setActiveVideoIdx((activeVideoIdx + 1) % effectiveVideos.length);
                } else if (isArticlesMode) {
                  setActiveArticleIdx((activeArticleIdx + 1) % effectiveArticles.length);
                } else {
                  handleNextSolution();
                }
              }}
              disabled={!isVideoMode && !isArticlesMode && displayTableProducts.length <= 1}
              className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#0E1220] hover:bg-[#F4EFE6] dark:hover:bg-[#1E2548] border border-[#D8CEBC] dark:border-[#252E4A] text-xs font-mono text-slate-800 dark:text-slate-100 transition-colors lowercase font-semibold shrink-0 cursor-pointer ${
                !isVideoMode && !isArticlesMode && displayTableProducts.length <= 1 ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              title={!isVideoMode && !isArticlesMode && displayTableProducts.length <= 1 ? `Only 1 item in ${currentStageKey}` : `Next item in ${currentStageKey}`}
              aria-label="Next item"
            >
              <span className="hidden sm:inline">next</span>
              <ChevronRight className="h-4 w-4 text-[#5584B4]" />
            </button>
          </div>
        )}

        {/* Coming Soon Notice for Operations & Growth Stages */}
        {!isHeroSplashMode && (currentStageKey === 'operations' || currentStageKey === 'growth') && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-mono flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span>
                <strong>Coming Soon:</strong> The {currentStageKey === 'operations' ? 'Operations' : 'Growth Stage'} modules are currently undergoing final calibration and will be available soon.
              </span>
            </div>
          </div>
        )}

        {/* CENTER DISPLAY AREA */}
        {isHeroSplashMode ? (
          /* 5-STAGE ILLUMINATED JOURNEY GALLERY: All 4 Core Stages + Personal Sandbox + Workstation Fast Lane */
          <StageJourneyGallery
            cmsPromotions={cmsPromotions}
            cmsProducts={cmsProducts}
            isMember={isMember}
            userName={userProfile?.founderName}
            userPurchases={userPurchases}
            theme={theme}
            onSelectStage={(stageId) => {
              if (onClosePromotion) onClosePromotion();
              if (onSelectSolutionById) onSelectSolutionById(stageId);
            }}
            onEnterWorkstation={() => {
              if (onEnterWorkstation) {
                onEnterWorkstation();
              } else if (onClosePromotion) {
                onClosePromotion();
              }
            }}
          />
        ) : isVideoMode ? (
          /* EXPANDED VIDEO DISPLAY AREA (per educational video.PNG & video cleanup.PNG) */
          <div className="w-full space-y-4">
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black/95 border-2 border-[#5584B4]/40 shadow-2xl flex items-center justify-center p-6 text-center">
              {currentVideo.youtubeUrl && currentVideo.youtubeUrl.trim() !== '' ? (
                <iframe
                  src={getYoutubeEmbedUrl(currentVideo.youtubeUrl)}
                  title={currentVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="max-w-md space-y-3">
                  <div className="h-14 w-14 rounded-2xl bg-[#5584B4]/20 border border-[#5584B4]/40 text-[#5584B4] flex items-center justify-center mx-auto">
                    <Play className="h-7 w-7 text-[#5584B4] ml-0.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
                      Stream Link Pending Update
                    </span>
                    <h3 className="font-['Raleway'] text-lg sm:text-xl font-bold text-white mt-1.5 lowercase">
                      {currentVideo.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-['DM_Sans'] mt-1">
                      all links cleared. update or paste your video link in the education centre or cms console to stream.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Clean Video Meta Bar */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border ${
                isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'
              } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 lowercase mb-1">
                  <span>{currentVideo.duration}</span>
                  <span>·</span>
                  <span>{currentVideo.category}</span>
                </div>
                <div className="text-xs font-mono text-slate-600 dark:text-slate-300 lowercase">
                  instructor / presenter: {currentVideo.author}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveVideoIdx((activeVideoIdx + 1) % effectiveVideos.length)}
                  className="px-3.5 py-2 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white text-xs font-mono lowercase transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span>next video in playlist</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#C59B63]" />
                </button>
              </div>
            </div>
          </div>
        ) : isArticlesMode ? (
          /* EXPANDED ARTICLE READER (Enforcing Bizzbean Style Guide: DM Sans, JetBrains Mono, high-contrast) */
          <div className="w-full space-y-4">
            <div
              className={`rounded-3xl border overflow-hidden shadow-xs transition-colors ${
                isDark ? 'bg-[#141A2E] border-[#252E4A] text-slate-100' : 'bg-white border-[#D8CEBC] text-[#12172A]'
              }`}
            >
              {/* Cover Image Header if present */}
              {currentArticle.imageUrl &&
                currentArticle.imageUrl.trim() !== '' &&
                !currentArticle.imageUrl.includes('1553877522-43269d4ea984') && (
                <div className="relative w-full h-64 sm:h-80 overflow-hidden bg-black/60">
                  <img
                    src={currentArticle.imageUrl}
                    alt={currentArticle.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      const parent = target.parentElement;
                      if (parent) parent.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                </div>
              )}

              {/* Article Content Header & Body */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className={`border-b pb-4 ${isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'}`}>
                  <h1 className={`text-2xl sm:text-3xl font-bold font-sans tracking-tight leading-tight ${
                    isDark ? 'text-white' : 'text-[#12172A]'
                  }`}>
                    {currentArticle.title}
                  </h1>
                  <div className={`flex flex-wrap items-center gap-3 text-xs font-mono lowercase mt-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    <span>
                      byline:{' '}
                      <strong className={isDark ? 'text-slate-200' : 'text-[#12172A]'}>
                        {currentArticle.author}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>{currentArticle.readTime}</span>
                    {currentArticle.publishedDate && (
                      <>
                        <span>·</span>
                        <span>published: {currentArticle.publishedDate}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Key Thesis Excerpt Box - Using DM Sans and Sand Tint per Style Guide */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-sm sm:text-base font-sans font-medium border-l-4 border-[#5584B4] leading-relaxed ${
                    isDark
                      ? 'bg-[#182038] text-slate-200'
                      : 'bg-[#F4EFE6] text-[#12172A]'
                  }`}
                >
                  "{currentArticle.summary}"
                </div>

                {/* Full Article Body Content - High Contrast DM Sans */}
                <div
                  className={`text-sm sm:text-base leading-relaxed font-sans whitespace-pre-line space-y-4 ${
                    isDark ? 'text-slate-200' : 'text-[#1E2538]'
                  }`}
                >
                  {currentArticle.content || currentArticle.summary}
                </div>

                {/* Article Footer & Next Navigation */}
                <div
                  className={`pt-5 border-t flex items-center justify-between ${
                    isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
                  }`}
                >
                  <span className={`text-xs font-mono lowercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    article {activeArticleIdx + 1} of {effectiveArticles.length}
                  </span>
                  <button
                    onClick={() => setActiveArticleIdx((activeArticleIdx + 1) % effectiveArticles.length)}
                    className="px-4 py-2 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white text-xs font-mono lowercase transition-colors flex items-center gap-1.5 shadow-sm font-bold"
                  >
                    <span>next article</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#C59B63]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* CENTER: SOLUTION FLASHCARD CONTAINER (Clean About Bizzbean Styling per user brief) */
          (() => {
            const hasStageProducts = displayTableProducts.length > 0;
            const currentProd = hasStageProducts ? (displayTableProducts[safeProductIdx] || null) : null;
            const targetProdId = currentProd?.id || null;
            const matchingCms = hasStageProducts && targetProdId
              ? (cmsProducts || []).find(
                  (p: any) =>
                    p.id === targetProdId ||
                    (targetProdId === 'bizzbudget' && p.id === 'budget') ||
                    (targetProdId === 'budget' && p.id === 'bizzbudget')
                )
              : null;
            const effectiveSellingZAR = hasStageProducts
              ? (matchingCms ? matchingCms.sellingPriceZAR : (currentProd?.sellingPriceZAR || currentProd?.priceZAR || 0))
              : 0;
            const effectiveTokens = hasStageProducts
              ? (matchingCms ? matchingCms.tokensAllocated : (currentProd?.tokensAllocated || Math.round(effectiveSellingZAR * 0.20 * 10) / 10))
              : 0;
            const effectiveExclusiveZAR = hasStageProducts
              ? (matchingCms ? matchingCms.exclusivePriceZAR : (currentProd?.exclusivePriceZAR || Math.round((effectiveSellingZAR / 1.15) * 100) / 100))
              : 0;
            const effectiveVatZAR = hasStageProducts
              ? (matchingCms ? matchingCms.vatZAR : (currentProd?.vatZAR || Math.round((effectiveSellingZAR - effectiveExclusiveZAR) * 100) / 100))
              : 0;
            const effectiveTicketZAR = hasStageProducts
              ? (matchingCms ? matchingCms.ticketPriceZAR : (currentProd?.ticketPriceZAR || Math.round((effectiveSellingZAR * 1.20) * 100) / 100))
              : 0;
            const isMonthlySubscription = hasStageProducts &&
              ((matchingCms?.billingModel || currentProd?.billingModel || activeSolution?.billingModel) === 'monthly subscription');

            const isPurchased = checkIsPurchased(matchingCms || currentProd || activeSolution);

            const isCourse =
              matchingCms?.type === 'course' ||
              currentProd?.type === 'course' ||
              targetProdId === 'cost-recovery-calculator' ||
              targetProdId === 'profit-optimizer' ||
              targetProdId === 'how-to-bizzcalc' ||
              targetProdId === 'learn-earn-capital' ||
              targetProdId === 'follow-the-money' ||
              targetProdId === 'financial-reports' ||
              targetProdId === 'your-first-hire' ||
              targetProdId === 'financial-scenario-planning' ||
              targetProdId === 'annual-business-planning-cycle' ||
              Boolean(getCanonicalCourseId(targetProdId || '')) ||
              Boolean(getCanonicalCourseId(currentProd?.name || '')) ||
              (matchingCms?.sku && matchingCms.sku.startsWith('BC-')) ||
              (currentProd?.sku && currentProd.sku.startsWith('BC-'));

            const isViabilityDefault =
              targetProdId === 'learn-earn-capital' ||
              targetProdId === 'vi-ability' ||
              currentProd?.id === 'learn-earn-capital' ||
              currentProd?.id === 'vi-ability' ||
              currentStageKey === 'vi-ability';

            // Resolve cover image strictly for this specific solution or course
            const initialFallback = INITIAL_CMS_PRODUCTS.find(
              (ip) =>
                ip.id === targetProdId ||
                ip.id === currentProd?.id ||
                (targetProdId === 'bizzbudget' && ip.id === 'budget') ||
                (targetProdId === 'budget' && ip.id === 'budget') ||
                (currentProd?.name && ip.name.toLowerCase() === currentProd.name.toLowerCase())
            );

            const directProductCover =
              matchingCms?.canonicalCoverUrl?.trim() ||
              (matchingCms as any)?.imageUrl?.trim() ||
              currentProd?.canonicalCoverUrl?.trim() ||
              currentProd?.imageUrl?.trim() ||
              initialFallback?.canonicalCoverUrl?.trim() ||
              '';

            const isFallback =
              directProductCover.includes('1553877522-43269d4ea984');
            const solutionImage = isFallback
              ? (initialFallback?.canonicalCoverUrl?.trim() || '')
              : directProductCover;
            const hasLoadError = Boolean(solutionImage && imageLoadErrors[solutionImage]);
            const shouldRenderImage = Boolean(solutionImage && !hasLoadError);

            const solutionDisplayName = !hasStageProducts
              ? `${currentStageKey.replace('-', ' ')} (in preparation)`
              : isViabilityDefault && (!matchingCms?.name || matchingCms?.name.toLowerCase() === 'vi-ability')
                ? 'learn how to earn access to capital'
                : matchingCms?.name || currentProd?.name || activeSolution?.name || 'learn how to earn access to capital';

            const solutionSubtitle = !hasStageProducts
              ? 'this stage is currently in preparation · allocate solutions via the cms console or operations sandbox'
              : isViabilityDefault && (!matchingCms?.subtitle || matchingCms?.subtitle.toLowerCase().includes('market fit'))
                ? 'Free Startup Viability & Investor-Readiness Course'
                : matchingCms?.subtitle || currentProd?.subtitle || activeSolution?.subtitle || 'Free Startup Viability & Investor-Readiness Course';

            const courseObjectivesText = !hasStageProducts
              ? `There are currently no solutions allocated to the ${currentStageKey.replace('-', ' ')} stage. Work-in-progress solutions are staged in the Operations Sandbox and can be allocated to this stage anytime via the CMS Console.`
              : isViabilityDefault && (!matchingCms?.purpose || matchingCms?.purpose.toLowerCase().includes('rigorous pre-build'))
                ? 'Learn the financial proof lenders and investors require before funding a startup—covering unit economics, break-even thresholds, and capital-readiness metrics using our 7-step financial model.'
                : matchingCms?.purpose ||
                  matchingCms?.description ||
                  currentProd?.purpose ||
                  currentProd?.description ||
                  activeSolution?.purpose ||
                  activeSolution?.description ||
                  'Learn the financial proof lenders and investors require before funding a startup—covering unit economics, break-even thresholds, and capital-readiness metrics using our 7-step financial model.';

            return (
              <div
                className={`rounded-2xl border p-5 sm:p-7 space-y-6 shadow-xs transition-colors ${
                  isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                }`}
              >
                {/* PANEL B: Product / Course Name above the Subtitle (taken from CMS) */}
                <div
                  className={`text-center pb-4 border-b space-y-1.5 ${
                    isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
                  }`}
                >
                  <h2 className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-slate-100 lowercase tracking-wide">
                    {solutionDisplayName}
                  </h2>
                  {solutionSubtitle && (
                    <div className="text-xs sm:text-sm font-mono text-slate-600 dark:text-slate-400 lowercase leading-relaxed">
                      {solutionSubtitle}
                    </div>
                  )}
                </div>

                {/* Product / Course Image or Official Architectural Product Placeholder */}
                <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden border border-[#D8CEBC] dark:border-[#252E4A] shadow-xs select-none">
                  {shouldRenderImage ? (
                    <img
                      src={solutionImage}
                      alt={solutionDisplayName}
                      className="w-full h-full object-cover select-none"
                      onError={() => {
                        setImageLoadErrors((prev) => ({ ...prev, [solutionImage]: true }));
                      }}
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex flex-col items-center justify-center p-6 text-center transition-colors relative overflow-hidden ${
                        isDark
                          ? 'bg-gradient-to-br from-[#12172A] via-[#0E1220] to-[#182038]'
                          : 'bg-gradient-to-br from-[#FAF8F5] via-[#F4EFE6] to-[#EAE3D4]'
                      }`}
                    >
                      {/* Background Architectural Blueprint Grid Pattern */}
                      <div className="absolute inset-0 bg-architectural-grid opacity-35 dark:opacity-25 pointer-events-none" />

                      {/* Centered Product Placeholder Identity */}
                      <div className="relative z-10 flex flex-col items-center justify-center space-y-2.5 max-w-md">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white dark:bg-[#1A223E] border border-[#D8CEBC] dark:border-[#2D3958] flex items-center justify-center shadow-xs">
                          <BizzbeanLogoIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#5584B4]/15 text-[#5584B4] dark:text-[#DDEBF7] border border-[#5584B4]/30">
                              {matchingCms?.type === 'course' ? 'Masterclass Course' : 'BizzApp Solution'}
                            </span>
                            <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                              {matchingCms?.sku || `BA-${(safeProductIdx + 1).toString().padStart(3, '0')}`}
                            </span>
                          </div>

                          <h3 className="text-sm sm:text-base font-bold font-sans text-slate-800 dark:text-white capitalize">
                            {solutionDisplayName}
                          </h3>

                          <p className="text-[11px] font-mono text-[#8C6D3F] dark:text-[#D4A373] tracking-wide">
                            infinite wisdom · instant viability · always on
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Course Objectives (taken from CMS) - Single paragraph, unnumbered card per user brief */}
                <div
                  className={`p-5 rounded-2xl border ${
                    isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'
                  }`}
                >
                  <div className="mb-2 pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {matchingCms?.type === 'course' ? 'COURSE OBJECTIVES' : 'SOLUTION OBJECTIVES & PURPOSE'}
                    </span>
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed font-sans ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {courseObjectivesText}
                  </p>
                </div>

                {/* PANEL E: Solution Pricing & Smart Pricing Actions - Consistent Panel Styling & Legible Default Grey Font Colors */}
                <div
                  className={`rounded-2xl border p-5 sm:p-6 shadow-xs space-y-4 transition-colors ${
                    isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                  }`}
                >
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2 ${
                      isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        PRICING & TOKEN REINVESTMENT
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isMonthlySubscription
                            ? 'bg-purple-900/25 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                            : 'bg-slate-100 dark:bg-[#0E1220] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isMonthlySubscription ? 'monthly subscription' : 'once-off lifetime'}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-300 lowercase">
                      statutory vat & token rewards applied
                    </div>
                  </div>

                  {/* Pricing Breakdown Grid - Clearly visible default font colours and panel styling */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center font-mono">
                    <div
                      className={`p-3 rounded-xl border ${
                        isDark ? 'bg-[#0E1220] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                      }`}
                    >
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400 lowercase">base selling:</div>
                      <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        R{effectiveSellingZAR.toFixed(2)}
                        {isMonthlySubscription && <span className="text-xs font-normal text-purple-400">/mo</span>}
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border ${
                        isDark ? 'bg-[#0E1220] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                      }`}
                    >
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400 lowercase">excl. vat:</div>
                      <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        R{effectiveExclusiveZAR.toFixed(2)}
                        {isMonthlySubscription && <span className="text-xs font-normal text-purple-400">/mo</span>}
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border ${
                        isDark ? 'bg-[#0E1220] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                      }`}
                    >
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400 lowercase">vat (15%):</div>
                      <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        R{effectiveVatZAR.toFixed(2)}
                        {isMonthlySubscription && <span className="text-xs font-normal text-purple-400">/mo</span>}
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border ${
                        isDark ? 'bg-[#0E1220] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                      }`}
                    >
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400 lowercase">ticket benchmark:</div>
                      <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        R{effectiveTicketZAR.toFixed(2)}
                        {isMonthlySubscription && <span className="text-xs font-normal text-purple-400">/mo</span>}
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border col-span-2 sm:col-span-1 ${
                        isDark ? 'bg-[#0E1220] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                      }`}
                    >
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400 lowercase">tokens credited:</div>
                      <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-center justify-center gap-1">
                        <Coins className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        <span>+{effectiveTokens}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar: Row 1 = Discovery & Account Utilities (4 balanced buttons); Row 2 = Single Primary Buy/Launch CTA */}
                  {(() => {
                    const candidateId = currentProd?.id || targetProdId || activeSolution?.id || '';
                    const isStageId = ['vi-ability', 'fund-ability', 'sustain-ability', 'invest-ability', 'personal-sandbox', 'operations', 'growth', 'education'].includes(candidateId);
                    const targetSolId = isStageId
                      ? (isCourse
                          ? (currentStageKey === 'fund-ability' ? 'cost-recovery-calculator' : currentStageKey === 'sustain-ability' ? 'profit-optimizer' : 'learn-earn-capital')
                          : (currentStageKey === 'fund-ability' ? 'bizzmodel' : 'bizzdynamics'))
                      : candidateId;

                    const isSolutionPinned = targetSolId
                      ? quickLinkIds.includes(targetSolId) ||
                        (targetSolId === 'budget' && quickLinkIds.includes('bizzbudget')) ||
                        (targetSolId === 'bizzbudget' && quickLinkIds.includes('budget'))
                      : false;

                    const canLaunch = isPurchased || (isCourse && currentProd?.id === 'learn-earn-capital') || isAdmin || currentStageKey === 'operations-sandbox';

                    const handleBuyClick = () => {
                      const solToBuy: any = {
                        ...(matchingCms || currentProd || activeSolution!),
                        id: targetProdId || currentProd?.id || activeSolution?.id,
                        name: solutionDisplayName,
                        subtitle: solutionSubtitle,
                        priceZAR: effectiveSellingZAR,
                        sellingPriceZAR: effectiveSellingZAR,
                        exclusivePriceZAR: effectiveExclusiveZAR,
                        vatZAR: effectiveVatZAR,
                        tokensAllocated: effectiveTokens,
                        isPurchased: false,
                      };
                      onBuySolution(solToBuy);
                    };

                    const handleLaunchCourse = () => {
                      const canon = getCanonicalCourseId(currentProd?.id || '') || getCanonicalCourseId(currentProd?.name || '') || getCanonicalCourseId(candidateId);
                      const courseCandidate =
                        canon ||
                        (currentProd?.type === 'course' ? currentProd.id : null) ||
                        (!isStageId ? candidateId : null) ||
                        (currentStageKey === 'fund-ability' ? 'cost-recovery-calculator' : currentStageKey === 'sustain-ability' ? 'profit-optimizer' : 'learn-earn-capital');
                      const matched = findMatchingCourse(courseCandidate, cmsProducts || []);
                      const targetId = matched ? matched.id : (courseCandidate || 'cost-recovery-calculator');
                      if (targetId && onSelectSolutionById) onSelectSolutionById(targetId);
                      onLaunchSolution(targetId);
                    };

                    const handleLaunchApp = () => {
                      const nameCheck = `${currentProd?.name || ''} ${currentProd?.id || ''} ${matchingCms?.name || ''} ${activeSolution?.id || ''}`.toLowerCase();
                      const targetId =
                        nameCheck.includes('forecasta')
                          ? 'bizzforecasta'
                          : nameCheck.includes('calculators')
                          ? 'bizzcalculators'
                          : nameCheck.includes('dynamics')
                          ? 'bizzdynamics'
                          : nameCheck.includes('budget')
                          ? 'bizzbudget'
                          : nameCheck.includes('rolling') || nameCheck.includes('optimizer')
                          ? 'rolling-forecast'
                          : nameCheck.includes('model') || nameCheck.includes('hi-level')
                          ? 'bizzmodel'
                          : currentProd?.id || activeSolution?.id || 'bizzcalc';
                      if (onSelectSolutionById) onSelectSolutionById(targetId);
                      onLaunchSolution(targetId);
                    };

                    return (
                      <div className="pt-3 border-t border-[#E8E2D8] dark:border-[#252E4A] space-y-3">
                        {/* Row 1: 4 balanced utility & discovery actions */}
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
                          {/* 1. VIEW PRODUCT */}
                          <button
                            type="button"
                            onClick={() => setIsTransparencyModalOpen(true)}
                            className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-white font-bold text-xs uppercase font-mono flex items-center justify-center gap-1.5 shadow-sm transition-all tracking-wide border border-[#3B4861] active:scale-[0.99] cursor-pointer"
                            title="View product details, syllabus, engine architecture, and deliverables (zero compute)"
                          >
                            <Eye className="h-4 w-4 text-[#38BDF8] shrink-0" />
                            <span className="truncate">VIEW PRODUCT</span>
                          </button>

                          {/* 2. SMART PRICING POLICY (refined tonal style so it does not compete with primary CTA) */}
                          <button
                            type="button"
                            onClick={() => setIsSmartPricingModalOpen(true)}
                            className={`w-full px-3 py-2.5 rounded-xl font-bold text-xs uppercase font-mono flex items-center justify-center gap-1.5 shadow-xs transition-all tracking-wide border active:scale-[0.99] cursor-pointer ${
                              isDark
                                ? 'bg-[#261121] hover:bg-[#36162E] text-[#F472B6] border-[#6E234C]'
                                : 'bg-[#FDF2F8] hover:bg-[#FCE7F3] text-[#C91A63] border-[#F5BDD9]'
                            }`}
                            title="View transparent V1 Smart Pricing Policy"
                          >
                            <Info className="h-4 w-4 shrink-0" />
                            <span className="truncate">SMART PRICING</span>
                          </button>

                          {/* 3. SIGN UP */}
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenSignUp) {
                                onOpenSignUp();
                              } else {
                                setIsSignUpModalOpen(true);
                              }
                            }}
                            className="w-full px-3 py-2.5 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white font-bold text-xs uppercase font-mono flex items-center justify-center gap-1.5 shadow-sm transition-all tracking-wide border border-[#2B3452] active:scale-[0.99] cursor-pointer"
                          >
                            <UserCheck className="h-4 w-4 text-[#5584B4] shrink-0" />
                            <span className="truncate">SIGN UP</span>
                          </button>

                          {/* 4. PINBOARD */}
                          <button
                            type="button"
                            onClick={() => onToggleQuickLink(targetSolId)}
                            className={`w-full px-3 py-2.5 rounded-xl transition-all text-xs uppercase font-mono font-bold flex items-center justify-center gap-1.5 shadow-sm tracking-wide border active:scale-[0.99] cursor-pointer ${
                              isSolutionPinned
                                ? 'bg-[#1E2548] text-[#DDEBF7] border-[#5584B4] ring-1 ring-[#5584B4]/40'
                                : 'bg-[#12172A] hover:bg-[#1E2548] text-white border-[#2B3452]'
                            }`}
                            title={isSolutionPinned ? 'Remove from pinboard' : 'Add to pinboard'}
                          >
                            <Pin className={`h-4 w-4 shrink-0 ${isSolutionPinned ? 'text-[#5584B4] fill-[#5584B4]/30' : 'text-slate-400'} -rotate-45`} />
                            <span className="truncate">{isSolutionPinned ? 'PINNED' : 'PINBOARD'}</span>
                          </button>
                        </div>

                        {/* Row 2: Single Primary Action (BUY SOLUTION before purchase, LAUNCH APP / LAUNCH BIZZCLASS once unlocked) */}
                        <div>
                          {!hasStageProducts ? (
                            <button
                              type="button"
                              disabled
                              className="w-full px-5 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs sm:text-sm uppercase font-mono flex items-center justify-center gap-2 cursor-not-allowed tracking-wide border border-dashed border-slate-300 dark:border-slate-700"
                              title="No active solutions currently allocated to this stage"
                            >
                              <Lock className="h-4 w-4" />
                              <span>STAGE IN PREPARATION (0 PRODUCTS)</span>
                            </button>
                          ) : canLaunch ? (
                            isCourse ? (
                              <button
                                type="button"
                                onClick={handleLaunchCourse}
                                className="w-full px-5 py-3 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white font-bold text-xs sm:text-sm uppercase font-mono flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.99] tracking-wide border border-[#487B9F] cursor-pointer"
                                title="Open BizzClass course master suite and lesson delivery stream"
                              >
                                <Play className="h-4 w-4 fill-white text-white shrink-0" />
                                <span>LAUNCH BIZZCLASS</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={handleLaunchApp}
                                className="w-full px-5 py-3 rounded-xl bg-[#12172A] dark:bg-[#1E2548] hover:bg-[#1E2548] dark:hover:bg-[#2B355E] text-white font-bold text-xs sm:text-sm uppercase font-mono flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.99] tracking-wide border border-[#2B3452] dark:border-[#3E4A74] cursor-pointer"
                                title="Launch interactive platform application and simulator"
                              >
                                <Layers className="h-4 w-4 text-[#84CC16] shrink-0" />
                                <span>LAUNCH APP</span>
                              </button>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={handleBuyClick}
                              className="w-full px-5 py-3 rounded-xl bg-[#E02475] hover:bg-[#C91A63] text-white font-bold text-xs sm:text-sm uppercase font-mono flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.99] tracking-wide cursor-pointer"
                              title={isCourse ? 'Purchase course via PayFast to access BizzClass' : 'Purchase solution via PayFast to access work area'}
                            >
                              <ShoppingCart className="h-4 w-4 shrink-0" />
                              <span>
                                BUY {isCourse ? 'COURSE' : 'SOLUTION'} (R{effectiveSellingZAR.toFixed(2)}{isMonthlySubscription ? '/mo' : ''})
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Smart Pricing Policy Popup Modal */}
                <SmartPricingModal
                  isOpen={isSmartPricingModalOpen}
                  solution={(currentProd || activeSolution!) as any}
                  effectiveSellingZAR={effectiveSellingZAR}
                  effectiveExclusiveZAR={effectiveExclusiveZAR}
                  effectiveVatZAR={effectiveVatZAR}
                  effectiveTicketZAR={effectiveTicketZAR}
                  effectiveTokens={effectiveTokens}
                  isMonthlySubscription={isMonthlySubscription}
                  onClose={() => setIsSmartPricingModalOpen(false)}
                  onBuy={onBuySolution}
                  theme={theme}
                />

                {/* Solution Transparency & Richness Modal (Zero Compute Preview) */}
                <SolutionTransparencyModal
                  isOpen={isTransparencyModalOpen}
                  onClose={() => setIsTransparencyModalOpen(false)}
                  solution={(currentProd || activeSolution || (cmsProducts && cmsProducts[0])) as any}
                  cmsProducts={cmsProducts}
                  isMember={isMember}
                  onBuySolution={onBuySolution}
                  onOpenSignUp={onOpenSignUp}
                  onSaveProduct={(updatedProd) => {
                    const existing = cmsProducts || [];
                    const idx = existing.findIndex((p) => p.id === updatedProd.id);
                    let nextList: CmsProduct[];
                    if (idx >= 0) {
                      nextList = [...existing];
                      nextList[idx] = { ...nextList[idx], ...updatedProd };
                    } else {
                      nextList = [...existing, updatedProd];
                    }
                    if (onSyncProductsToWebsite) {
                      onSyncProductsToWebsite(nextList);
                    }
                  }}
                  theme={theme}
                />

                {/* Sign Up Modal */}
                <SignUpModal
                  isOpen={isSignUpModalOpen}
                  isMember={isMember}
                  theme={theme}
                  onClose={() => setIsSignUpModalOpen(false)}
                  onConfirmSignUp={(name, email, company) => {
                    onUpdateProfile({
                      ...userProfile,
                      founderName: name,
                      companyName: company,
                    });
                    if (onConfirmSignUp) {
                      onConfirmSignUp(name, email, company);
                    }
                  }}
                  onOpenDoors={onOpenSignUp}
                />
              </div>
            );
          })()
        )}

        {/* BOTTOM: STAGE SUMMARY IN SA RANDS (Hidden in Educational Support & Promotions) */}
        {!isEducationMode && !showPromotion && (
          <div className="rounded-2xl border border-[#D8CEBC] dark:border-[#252E4A] bg-white dark:bg-[#141A2E] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wide">
                  STAGE SUMMARY IN SA RANDS
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] dark:bg-[#0E1220] text-slate-700 dark:text-slate-300 border-b border-[#E8E2D8] dark:border-[#252E4A] text-[11px] uppercase font-semibold">
                    <th className="py-2.5 px-3">Solutions</th>
                    <th className="py-2.5 px-3 text-center">Owned</th>
                    <th className="py-2.5 px-3 text-center">Model</th>
                    <th className="py-2.5 px-3 text-right">Exclusive Price</th>
                    <th className="py-2.5 px-3 text-right">VAT (15%)</th>
                    <th className="py-2.5 px-3 text-right">Selling Price</th>
                    <th className="py-2.5 px-3 text-right">Tokens</th>
                    <th className="py-2.5 px-3 text-right">Ticket Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8] dark:divide-[#252E4A]">
                  {displayTableProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 px-4 text-center text-xs font-mono text-slate-500 dark:text-slate-400">
                        No active solutions currently allocated to <span className="font-bold text-slate-700 dark:text-slate-200">{currentStageKey}</span>. Allocate solutions to this stage anytime via the CMS Console or Operations Sandbox.
                      </td>
                    </tr>
                  ) : (
                    displayTableProducts.map((p: any) => {
                    const currentProdId = displayTableProducts[safeProductIdx]?.id || activeSolution?.id;
                    const isCurrent =
                      p.id === currentProdId ||
                      (currentProdId === 'bizzbudget' && p.id === 'budget') ||
                      (currentProdId === 'budget' && p.id === 'bizzbudget');
                    const isSub = p.billingModel === 'monthly subscription';
                    return (
                      <tr
                        key={p.id}
                        onClick={() => onSelectSolutionById && onSelectSolutionById(p.id)}
                        className={`cursor-pointer hover:bg-[#F4EFE6]/60 dark:hover:bg-[#1E2548]/40 transition-colors ${
                          isCurrent ? 'bg-[#DDEBF7]/40 dark:bg-[#1E3048]/60 font-semibold' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="text-slate-900 dark:text-white font-medium lowercase">{p.name.toLowerCase()}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">{p.sku} · {p.type}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {checkIsPurchased(p) ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#DDEBF7] text-[#24496B] dark:bg-[#1E3048] dark:text-[#DDEBF7] font-semibold lowercase">
                              yes
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuyTableRow(p);
                              }}
                              className="px-2.5 py-1 rounded bg-[#E02475] hover:bg-[#C91A63] text-white text-[10px] font-mono font-bold uppercase transition-all shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center min-w-[52px]"
                              title={`Buy ${p.name}`}
                            >
                              BUY
                            </button>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                              isSub
                                ? 'bg-purple-900/25 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {isSub ? 'monthly sub' : 'once-off'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">
                          {p.exclusivePriceZAR.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">
                          {p.vatZAR.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                          {p.sellingPriceZAR.toFixed(2)}
                          {isSub && <span className="text-[10px] text-purple-400 font-normal ml-0.5">/mo</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-[#8C6D37] dark:text-[#E2C799]">
                          {p.tokensAllocated.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#24496B] dark:text-[#93C5FD]">
                          {p.ticketPriceZAR.toFixed(2)}
                          {isSub && <span className="text-[10px] text-purple-400 font-normal ml-0.5">/mo</span>}
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#FAF8F5] dark:bg-[#0E1220] border-t-2 border-[#D8CEBC] dark:border-[#252E4A] font-bold text-slate-900 dark:text-white">
                    <td className="py-2.5 px-3 uppercase">Total</td>
                    <td className="py-2.5 px-3 text-center">-</td>
                    <td className="py-2.5 px-3 text-center">-</td>
                    <td className="py-2.5 px-3 text-right">{totalExclusive.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">{totalVat.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">{totalSelling.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-[#8C6D37] dark:text-[#E2C799]">{totalTokens.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-right text-[#24496B] dark:text-[#93C5FD]">{totalTicket.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
