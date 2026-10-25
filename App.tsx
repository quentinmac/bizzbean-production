import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { SplashOfficeDoors } from './components/SplashOfficeDoors';
import { BizzDeskHeader } from './components/BizzDeskHeader';
import { SolutionsPanel } from './components/SolutionsPanel';
import { WorkArea } from './components/WorkArea';
import { KnowledgeBasePanel } from './components/KnowledgeBasePanel';
import { AboutModal } from './components/AboutModal';
import { VideoModal } from './components/VideoModal';
import { LibraryItemModal } from './components/LibraryItemModal';
import { CloseShopModal, DailyObjective } from './components/CloseShopModal';
import { CmsConsoleModal } from './components/CmsConsoleModal';
import { BuyTokensModal } from './components/BuyTokensModal';
import { TalkToUsModal } from './components/TalkToUsModal';
import { NonMemberTalkToUsModal } from './components/NonMemberTalkToUsModal';
import { INITIAL_CMS_PRODUCTS, INITIAL_CMS_VIDEOS, INITIAL_CMS_ARTICLES, INITIAL_CMS_PROMOTIONS, CmsProduct, CmsVideo, CmsArticle, CmsPromotionSection } from './data/cmsConsoleData';
import {
  safeSaveStorage,
  idbGet,
  cleanFallbackImagesFromArticles,
  cleanLegacyProducts,
  cleanLegacyViabilityPromotions,
  cleanClearedEducationVideos,
  cleanClearedCourseLessons,
  mergeLoadedPromotions,
  mergeLoadedProducts,
  CMS_STORAGE_KEYS,
  ensureFreshCmsCache,
} from './utils/imageStorage';
import {
  fetchCmsProductsFromFirestore,
  fetchCmsVideosFromFirestore,
  fetchCmsArticlesFromFirestore,
  fetchCmsPromotionsFromFirestore,
  saveCmsProductsToFirestore,
  saveCmsVideosToFirestore,
  saveCmsArticlesToFirestore,
  saveCmsPromotionsToFirestore,
  subscribeToCmsProducts,
  subscribeToCmsPromotions,
} from './services/cmsFirestoreService';
import { BIZZ_SOLUTIONS, INITIAL_DIALOGUE_MESSAGES, INITIAL_LIBRARY_ITEMS } from './data/bizzdeskData';
import { BizzSolution, DialogueMessage, LibraryItem, UserBusinessProfile } from './types';
import { listenToAuthChanges, signOutUser, determineUserRole } from './services/firebaseAuthService';
import {
  Menu,
  Layers,
  MessageSquare,
  Smartphone,
  Play,
  X,
  Laptop,
  CheckCircle2,
  Coins,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Navigation / View state
  const [inSplashDoors, setInSplashDoors] = useState<boolean>(true);
  const [isMember, setIsMember] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bizz_is_member') === 'true';
    } catch {
      return false;
    }
  });
  const [isNonMemberTalkToUsOpen, setIsNonMemberTalkToUsOpen] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('founder@bizzbean.com');
  const isAdmin = useMemo(() => {
    return determineUserRole(userEmail) === 'admin';
  }, [userEmail]);
  const [mobileActivePanel, setMobileActivePanel] = useState<'solutions' | 'workarea' | 'knowledge'>('workarea');
  const [solutionsPanelMode, setSolutionsPanelMode] = useState<'solutions' | 'knowledge'>('solutions');
  const [isMobileAppsDrawerOpen, setIsMobileAppsDrawerOpen] = useState<boolean>(false);
  const [tokenBalance, setTokenBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bizzdesk_token_balance_v1');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) return parsed;
      }
    } catch (e) {}
    return 250;
  });

  useEffect(() => {
    try {
      localStorage.setItem('bizzdesk_token_balance_v1', tokenBalance.toString());
    } catch (e) {}
  }, [tokenBalance]);

  // Theme state: Default to 'light' (black & grey on white) with instant dark theme toggle
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = listenToAuthChanges((fbUser) => {
      if (fbUser) {
        setUserEmail(fbUser.email || '');
        setIsMember(true);
        try {
          localStorage.setItem('bizz_is_member', 'true');
        } catch (e) {}
        if (fbUser.displayName) {
          setUserProfile((prev) => ({
            ...prev,
            founderName: fbUser.displayName || prev.founderName,
          }));
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // PayFast Transaction Return Listener
  const [payfastNotice, setPayfastNotice] = useState<{ status: 'success' | 'cancelled'; message: string } | null>(null);

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const pfStatus = urlParams.get('payfast_status');
      const pfPaymentId = urlParams.get('payment_id');

      if (pfStatus === 'success') {
        setPayfastNotice({
          status: 'success',
          message: `PayFast transaction completed successfully! Payment reference: ${pfPaymentId || 'Verified'}. Your account balance has been updated.`,
        });
        if (pfPaymentId && pfPaymentId.startsWith('TOKEN_')) {
          const parts = pfPaymentId.split('_');
          const tokensToAdd = parseInt(parts[1], 10);
          if (!isNaN(tokensToAdd) && tokensToAdd > 0) {
            setTokenBalance((prev) => prev + tokensToAdd);
          }
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (pfStatus === 'cancelled') {
        setPayfastNotice({
          status: 'cancelled',
          message: 'PayFast checkout was cancelled. No charge was deducted.',
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error('Error handling PayFast return:', e);
    }
  }, []);

  // Daily Work Objectives (User Feature per prompt)
  const [dailyObjectives, setDailyObjectives] = useState<DailyObjective[]>([
    { id: 'obj-1', text: 'Calibrate unit economics & CAC payback in vi-ability', completed: true },
    { id: 'obj-2', text: 'Stress-test 18-month cash runway in fund-ability', completed: false },
    { id: 'obj-3', text: 'Map operational accounts in bizzmoney', completed: false },
  ]);

  const [activeStageId, setActiveStageId] = useState<string>('vi-ability');
  const [activeSolutionId, setActiveSolutionId] = useState<string>('learn-earn-capital');
  const [activeView, setActiveView] = useState<'flashcard' | 'active-app' | 'about' | 'footer' | 'workspace' | 'library' | 'admin-centre' | 'education-centre' | 'bizzclass' | 'platform-apps'>('flashcard');
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [purchasedNotice, setPurchasedNotice] = useState<{
    solutionName: string;
    tokensCredited: number;
    priceZAR: number;
    solutionId: string;
    isCourse: boolean;
  } | null>(null);

  // Quick Links / Pinboard Pinning (persisted across reloads) - Strictly courses & apps, never stages
  const [quickLinkIds, setQuickLinkIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bizzdesk_pinboard_items_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((id: string) => {
            if (id === 'fund-ability') return 'cost-recovery-calculator';
            if (id === 'vi-ability') return 'learn-earn-capital';
            if (id === 'sustain-ability') return 'profit-optimizer';
            if (id === 'invest-ability') return 'financial-reports';
            if (id === 'personal-sandbox') return 'bizzcalc';
            return id;
          });
          const stageSet = new Set(['vi-ability', 'fund-ability', 'sustain-ability', 'invest-ability', 'personal-sandbox', 'operations', 'growth', 'education']);
          const cleaned = Array.from(new Set(mapped)).filter((id) => typeof id === 'string' && !stageSet.has(id));
          if (cleaned.length > 0) return cleaned;
        }
      }
    } catch (e) {}
    return ['cost-recovery-calculator', 'learn-earn-capital', 'bizzdynamics', 'bizzcalc', 'bizzmodel'];
  });

  useEffect(() => {
    try {
      localStorage.setItem('bizzdesk_pinboard_items_v1', JSON.stringify(quickLinkIds));
    } catch (e) {}
  }, [quickLinkIds]);

  // Dialogue & AI-LOOP state
  const [dialogueMessages, setDialogueMessages] = useState<DialogueMessage[]>(INITIAL_DIALOGUE_MESSAGES);

  // Library items state
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>(INITIAL_LIBRARY_ITEMS);

  // User Business Profile state with localStorage persistence
  const [userProfile, setUserProfile] = useState<UserBusinessProfile>(() => {
    try {
      const saved = localStorage.getItem('bizzdesk_user_profile_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.companyName) {
          return {
            websiteUrl: 'https://apexclouddynamics.com',
            ...parsed,
          };
        }
      }
    } catch (e) {}
    return {
      companyName: 'Apex Cloud Dynamics',
      founderName: 'Elena Vance',
      industry: 'Enterprise Software',
      stage: 'fund-ABILITY',
      vision: 'Deliver enterprise AI data pipeline orchestration with institutional financial sustainability.',
      whatWeDo: 'We build high-availability telemetry pipelines for logistics scaleups, reducing data reconciliation costs by 45%.',
      uniqueValue: 'Proprietary edge connectors with guaranteed sub-10ms delivery SLAs.',
      targetMarket: 'Tier-2 Logistics Operators & Supply Chain Hubs',
      monthlyRevenue: 30000,
      burnRate: 12000,
      slug: 'apex-cloud-dynamics',
      websiteUrl: 'https://apexclouddynamics.com',
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('bizzdesk_user_profile_v1', JSON.stringify(userProfile));
    } catch (e) {}
  }, [userProfile]);

  // Modals state
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isCloseShopModalOpen, setIsCloseShopModalOpen] = useState<boolean>(false);
  const [isCmsConsoleOpen, setIsCmsConsoleOpen] = useState<boolean>(false);
  const [isBuyTokensModalOpen, setIsBuyTokensModalOpen] = useState<boolean>(false);
  const [isTalkToUsModalOpen, setIsTalkToUsModalOpen] = useState<boolean>(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'transactions' | 'dialogue-centre' | 'bulk-imports' | 'promo-emails' | 'cms-console' | 'about-bizzbean'>('transactions');

  // Persistent CMS Products (hydrated with canonical 19 products and authentic prices)
  const [cmsProducts, setCmsProducts] = useState<CmsProduct[]>(() => {
    ensureFreshCmsCache();
    try {
      const stored = localStorage.getItem(CMS_STORAGE_KEYS.PRODUCTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return cleanClearedCourseLessons(cleanLegacyProducts(parsed));
        }
      }
    } catch (e) {
      console.warn('Could not read stored products', e);
    }
    return cleanClearedCourseLessons(cleanLegacyProducts(INITIAL_CMS_PRODUCTS));
  });

  // Persistent CMS Videos
  const [cmsVideos, setCmsVideos] = useState<CmsVideo[]>(() => {
    ensureFreshCmsCache();
    try {
      const stored = localStorage.getItem(CMS_STORAGE_KEYS.VIDEOS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return cleanClearedEducationVideos(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read stored videos', e);
    }
    return cleanClearedEducationVideos(INITIAL_CMS_VIDEOS);
  });

  // Persistent CMS Articles
  const [cmsArticles, setCmsArticles] = useState<CmsArticle[]>(() => {
    ensureFreshCmsCache();
    try {
      const stored = localStorage.getItem(CMS_STORAGE_KEYS.ARTICLES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return cleanFallbackImagesFromArticles(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read stored articles', e);
    }
    return cleanFallbackImagesFromArticles(INITIAL_CMS_ARTICLES);
  });

  // Persistent Promotional Billboards (13 stages with stage stories)
  const [cmsPromotions, setCmsPromotions] = useState<CmsPromotionSection[]>(() => {
    ensureFreshCmsCache();
    try {
      const stored = localStorage.getItem(CMS_STORAGE_KEYS.PROMOTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return cleanLegacyViabilityPromotions(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read stored promotions', e);
    }
    return cleanLegacyViabilityPromotions(INITIAL_CMS_PROMOTIONS);
  });

  // Hydration state tracking to prevent overwriting IndexedDB with defaults on initial mount
  const isHydrated = useRef<boolean>(false);

  // Hydration on mount across all modular sections: IndexedDB + Authoritative Cloud Firestore
  useEffect(() => {
    // 1. Initial rapid local cache hydration (IndexedDB)
    Promise.all([
      idbGet<CmsProduct[]>(CMS_STORAGE_KEYS.PRODUCTS).catch(() => null),
      idbGet<CmsArticle[]>(CMS_STORAGE_KEYS.ARTICLES).catch(() => null),
      idbGet<CmsPromotionSection[]>(CMS_STORAGE_KEYS.PROMOTIONS).catch(() => null),
      idbGet<CmsVideo[]>(CMS_STORAGE_KEYS.VIDEOS).catch(() => null),
    ]).then(([idbProducts, idbArticles, idbPromos, idbVideos]) => {
      if (idbProducts && Array.isArray(idbProducts) && idbProducts.length > 0) {
        setCmsProducts((prev) => mergeLoadedProducts(prev, cleanLegacyProducts(idbProducts)));
      }
      if (idbArticles && Array.isArray(idbArticles) && idbArticles.length > 0) {
        const cleaned = cleanFallbackImagesFromArticles(idbArticles);
        setCmsArticles(cleaned);
      }
      if (idbPromos && Array.isArray(idbPromos) && idbPromos.length > 0) {
        const cleanedPromos = cleanLegacyViabilityPromotions(idbPromos);
        setCmsPromotions((prev) => mergeLoadedPromotions(prev, cleanedPromos));
      }
      if (idbVideos && Array.isArray(idbVideos) && idbVideos.length > 0) {
        setCmsVideos(idbVideos);
      }
      isHydrated.current = true;
    });

    // 2. Authoritative Firestore Cloud Hydration (safely merged with local storage so user lessons and uploads are preserved)
    fetchCmsProductsFromFirestore().then((fsProducts) => {
      if (fsProducts && Array.isArray(fsProducts) && fsProducts.length > 0) {
        const cleaned = cleanLegacyProducts(fsProducts);
        setCmsProducts((prev) => {
          const merged = mergeLoadedProducts(cleaned, prev);
          safeSaveStorage(CMS_STORAGE_KEYS.PRODUCTS, merged);
          return merged;
        });
      }
    });

    fetchCmsVideosFromFirestore().then((fsVideos) => {
      if (fsVideos && Array.isArray(fsVideos) && fsVideos.length > 0) {
        setCmsVideos(fsVideos);
        safeSaveStorage(CMS_STORAGE_KEYS.VIDEOS, fsVideos);
      }
    });

    fetchCmsArticlesFromFirestore().then((fsArticles) => {
      if (fsArticles && Array.isArray(fsArticles) && fsArticles.length > 0) {
        const cleaned = cleanFallbackImagesFromArticles(fsArticles);
        setCmsArticles(cleaned);
        safeSaveStorage(CMS_STORAGE_KEYS.ARTICLES, cleaned);
      }
    });

    fetchCmsPromotionsFromFirestore().then((fsPromos) => {
      if (fsPromos && Array.isArray(fsPromos) && fsPromos.length > 0) {
        const cleanedPromos = cleanLegacyViabilityPromotions(fsPromos);
        setCmsPromotions((prev) => {
          const merged = mergeLoadedPromotions(cleanedPromos, prev);
          safeSaveStorage(CMS_STORAGE_KEYS.PROMOTIONS, merged);
          return merged;
        });
      }
    });

    // 3. Real-time Firestore synchronization for multi-tab / CMS console updates
    const unsubscribeProducts = subscribeToCmsProducts((updated) => {
      if (updated && Array.isArray(updated) && updated.length > 0) {
        const cleaned = cleanLegacyProducts(updated);
        setCmsProducts((prev) => {
          const merged = mergeLoadedProducts(cleaned, prev);
          safeSaveStorage(CMS_STORAGE_KEYS.PRODUCTS, merged);
          return merged;
        });
      }
    });

    const unsubscribePromos = subscribeToCmsPromotions((updated) => {
      if (updated && Array.isArray(updated) && updated.length > 0) {
        const cleaned = cleanLegacyViabilityPromotions(updated);
        setCmsPromotions((prev) => {
          const merged = mergeLoadedPromotions(cleaned, prev);
          safeSaveStorage(CMS_STORAGE_KEYS.PROMOTIONS, merged);
          return merged;
        });
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribePromos();
    };
  }, []);

  // Modular Auto-Sync to dual storage (guarded until initial hydration completes)
  useEffect(() => {
    if (!isHydrated.current) return;
    safeSaveStorage(CMS_STORAGE_KEYS.PRODUCTS, cmsProducts);
  }, [cmsProducts]);

  useEffect(() => {
    if (!isHydrated.current) return;
    safeSaveStorage(CMS_STORAGE_KEYS.VIDEOS, cmsVideos);
  }, [cmsVideos]);

  useEffect(() => {
    if (!isHydrated.current) return;
    safeSaveStorage(CMS_STORAGE_KEYS.ARTICLES, cmsArticles);
  }, [cmsArticles]);

  useEffect(() => {
    if (!isHydrated.current) return;
    safeSaveStorage(CMS_STORAGE_KEYS.PROMOTIONS, cmsPromotions);
  }, [cmsPromotions]);

  // Helper: Random sequence for door opening promotion (presents only real user-loaded images, never stock fallbacks)
  const getRandomActivePromotion = useCallback((list: CmsPromotionSection[]): CmsPromotionSection | null => {
    if (!list || !Array.isArray(list) || list.length === 0) return null;
    const withImages = list.filter(
      (p) =>
        p &&
        p.isActive !== false &&
        p.imageUrl &&
        p.imageUrl.trim() !== '' &&
        !p.imageUrl.includes('1553877522-43269d4ea984')
    );
    if (withImages.length > 0) {
      const randomIndex = Math.floor(Math.random() * withImages.length);
      return withImages[randomIndex];
    }
    const anyActive = list.filter((p) => p && p.isActive !== false);
    if (anyActive.length > 0) {
      return anyActive[Math.floor(Math.random() * anyActive.length)];
    }
    return null;
  }, []);

  const [activePromotion, setActivePromotion] = useState<CmsPromotionSection | null>(() => {
    const stored = localStorage.getItem(CMS_STORAGE_KEYS.PROMOTIONS);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const available = parsed.filter(
            (p: CmsPromotionSection) =>
              p &&
              p.isActive !== false &&
              p.imageUrl &&
              p.imageUrl.trim() !== '' &&
              !p.imageUrl.includes('1553877522-43269d4ea984')
          );
          if (available.length > 0) {
            return available[Math.floor(Math.random() * available.length)];
          }
        }
      } catch (e) {
        console.warn(e);
      }
    }
    return null;
  });

  // Keep activePromotion synchronized when cmsPromotions are loaded or updated in CMS
  useEffect(() => {
    if (cmsPromotions && cmsPromotions.length > 0) {
      const withImages = cmsPromotions.filter(
        (p) =>
          p &&
          p.isActive !== false &&
          p.imageUrl &&
          p.imageUrl.trim() !== '' &&
          !p.imageUrl.includes('1553877522-43269d4ea984')
      );
      if (withImages.length > 0 && (!activePromotion || !activePromotion.imageUrl || activePromotion.isActive === false)) {
        const randomIndex = Math.floor(Math.random() * withImages.length);
        setActivePromotion(withImages[randomIndex]);
      } else if (activePromotion) {
        // Keep activePromotion copy and image synchronized with cmsPromotions updates
        const matching = cmsPromotions.find((p) => p.id === activePromotion.id);
        if (matching && matching.isActive === false) {
          // If the current promotion was turned off / marked for no display, immediately switch or dismiss
          if (withImages.length > 0) {
            const randomIndex = Math.floor(Math.random() * withImages.length);
            setActivePromotion(withImages[randomIndex]);
          } else {
            setActivePromotion(null);
            setShowPromotion(false);
          }
        } else if (matching) {
          const isStoryChanged =
            matching?.stageStory?.narrative !== activePromotion.stageStory?.narrative ||
            matching?.stageStory?.stageChallenge !== activePromotion.stageStory?.stageChallenge ||
            matching?.stageStory?.milestone !== activePromotion.stageStory?.milestone ||
            matching?.stageStory?.keyDeliverable !== activePromotion.stageStory?.keyDeliverable;

          if (
            matching.displayName !== activePromotion.displayName ||
            matching.tagline !== activePromotion.tagline ||
            matching.buttonText !== activePromotion.buttonText ||
            matching.imageUrl !== activePromotion.imageUrl ||
            matching.isActive !== activePromotion.isActive ||
            isStoryChanged
          ) {
            setActivePromotion(matching);
          }
        }
      }
    }
  }, [cmsPromotions, activePromotion]);

  const [showPromotion, setShowPromotion] = useState<boolean>(false);
  const [activeKbTab, setActiveKbTab] = useState<'search' | 'dialogue' | 'library'>('dialogue');

  const [videoModalSolution, setVideoModalSolution] = useState<BizzSolution | null>(null);
  const [inspectedLibraryItem, setInspectedLibraryItem] = useState<LibraryItem | null>(null);

  // Active solution data object: look up in cmsProducts first, then BIZZ_SOLUTIONS
  const activeSolution: BizzSolution = useMemo(() => {
    let effectiveSolId = activeSolutionId;
    if (effectiveSolId === 'vi-ability') effectiveSolId = 'learn-earn-capital';
    else if (effectiveSolId === 'fund-ability') effectiveSolId = 'bizzmodel';
    else if (effectiveSolId === 'sustain-ability') effectiveSolId = 'sustain-runway';
    else if (effectiveSolId === 'invest-ability') effectiveSolId = 'invest-vdr';
    else if (effectiveSolId === 'personal-sandbox') effectiveSolId = 'bizzcalc';
    else if (effectiveSolId === 'growth') effectiveSolId = 'growth-strategy';

    const matchingCms = (cmsProducts || []).find(
      (p) =>
        p.id === effectiveSolId ||
        (effectiveSolId === 'bizzbudget' && p.id === 'budget') ||
        (effectiveSolId === 'budget' && p.id === 'bizzbudget')
    );
    if (matchingCms) {
      const isViabilityCourse = matchingCms.id === 'learn-earn-capital';
      const initialMatch = INITIAL_CMS_PRODUCTS.find(
        (ip) =>
          ip.id === matchingCms.id ||
          (matchingCms.id === 'budget' && ip.id === 'budget') ||
          (ip.name && matchingCms.name && ip.name.toLowerCase() === matchingCms.name.toLowerCase())
      );
      const effectiveCover =
        matchingCms.canonicalCoverUrl?.trim() ||
        (matchingCms as any)?.imageUrl?.trim() ||
        initialMatch?.canonicalCoverUrl?.trim() ||
        '';

      return {
        id: matchingCms.id === 'budget' ? 'bizzbudget' : matchingCms.id,
        category: (matchingCms.stage === 'operations' ? 'operations' : matchingCms.stage === 'growth' ? 'growth' : 'startup') as any,
        stage: matchingCms.stage,
        name: isViabilityCourse ? 'learn how to earn access to capital' : matchingCms.name,
        subtitle: isViabilityCourse ? 'earn access to capital' : matchingCms.subtitle,
        stageCode:
          matchingCms.stage === 'vi-ability'
            ? 'STAGE 01'
            : matchingCms.stage === 'fund-ability'
            ? 'STAGE 02'
            : matchingCms.stage === 'sustain-ability'
            ? 'STAGE 03'
            : matchingCms.stage === 'invest-ability'
            ? 'STAGE 04'
            : matchingCms.stage.toUpperCase(),
        description: isViabilityCourse
          ? 'This free course will teach you how to earn access to capital.'
          : matchingCms.description,
        purpose: isViabilityCourse
          ? 'This free course will teach you how to earn access to capital.'
          : matchingCms.purpose,
        priceUSD: isViabilityCourse ? 0 : Math.round(matchingCms.sellingPriceZAR / 18.5),
        priceZAR: isViabilityCourse ? 0 : matchingCms.sellingPriceZAR,
        vatRate: 0.15,
        tokensAllocated: isViabilityCourse ? 0 : matchingCms.tokensAllocated,
        billingModel: matchingCms.billingModel,
        imageUrl: effectiveCover,
        explainerDuration: '3:00',
        isPurchased: matchingCms.isPurchased,
        features: matchingCms.modules || matchingCms.lessonTitles || [],
      };
    }
    return (
      BIZZ_SOLUTIONS.find(
        (s) =>
          s.id === effectiveSolId ||
          s.id === activeSolutionId ||
          (effectiveSolId === 'budget' && s.id === 'bizzbudget') ||
          (effectiveSolId === 'bizzbudget' && (s.id === 'bizzbudget' || s.id === 'budget'))
      ) || BIZZ_SOLUTIONS[0]
    );
  }, [activeSolutionId, cmsProducts]);

  // Triggered the instant the sliding doors start opening to immediately randomize the HERO PROMOTION image
  const handleTriggerDoorOpening = useCallback((): CmsPromotionSection | null => {
    let currentPromos = cmsPromotions;
    try {
      const stored = localStorage.getItem(CMS_STORAGE_KEYS.PROMOTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentPromos = mergeLoadedPromotions(cmsPromotions, cleanLegacyViabilityPromotions(parsed));
        }
      }
    } catch (e) {
      console.warn(e);
    }

    const nextPromo = getRandomActivePromotion(currentPromos);
    if (nextPromo) {
      setActivePromotion(nextPromo);
    }
    return nextPromo;
  }, [cmsPromotions, getRandomActivePromotion]);

  // Safe async handlers for CMS Console to eliminate any setState-in-render warnings
  const handleCloseCmsConsole = useCallback(() => {
    setTimeout(() => {
      setIsCmsConsoleOpen(false);
    }, 0);
  }, []);

  const handleSyncProductsFromCms = useCallback((updated: CmsProduct[]) => {
    setTimeout(() => {
      const cleaned = cleanLegacyProducts(updated);
      setCmsProducts(cleaned);
      safeSaveStorage(CMS_STORAGE_KEYS.PRODUCTS, cleaned);
      saveCmsProductsToFirestore(cleaned).catch((err) =>
        console.warn('Firestore CMS product sync note:', err)
      );
    }, 0);
  }, []);

  const handleSyncVideosFromCms = useCallback((updated: CmsVideo[]) => {
    setTimeout(() => {
      setCmsVideos(updated);
      safeSaveStorage(CMS_STORAGE_KEYS.VIDEOS, updated);
    }, 0);
  }, []);

  const handleSyncArticlesFromCms = useCallback((updated: CmsArticle[]) => {
    setTimeout(() => {
      const cleaned = cleanFallbackImagesFromArticles(updated);
      setCmsArticles(cleaned);
      safeSaveStorage(CMS_STORAGE_KEYS.ARTICLES, cleaned);
    }, 0);
  }, []);

  const handleSyncPromotionsFromCms = useCallback((updated: CmsPromotionSection[]) => {
    setTimeout(() => {
      const cleaned = cleanLegacyViabilityPromotions(updated);
      setCmsPromotions(cleaned);
      safeSaveStorage(CMS_STORAGE_KEYS.PROMOTIONS, cleaned);
    }, 0);
  }, []);

  // Door Enter Handler
  const handleEnterWorkspace = (
    asMember: boolean,
    email?: string,
    preSelectedPromo?: CmsPromotionSection | null
  ) => {
    setIsMember(asMember);
    try {
      localStorage.setItem('bizz_is_member', asMember ? 'true' : 'false');
    } catch (e) {}
    if (email) setUserEmail(email);

    // On opening doors, present a random active HERO PROMOTION image from user-loaded promotions
    let currentPromos = cmsPromotions;
    try {
      const stored = localStorage.getItem(CMS_STORAGE_KEYS.PROMOTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentPromos = mergeLoadedPromotions(cmsPromotions, cleanLegacyViabilityPromotions(parsed));
        }
      }
    } catch (e) {
      console.warn(e);
    }

    const validPreSelected = preSelectedPromo && preSelectedPromo.isActive !== false ? preSelectedPromo : null;
    const validActive = activePromotion && activePromotion.isActive !== false ? activePromotion : null;
    const randomPromo = validPreSelected || getRandomActivePromotion(currentPromos) || validActive;
    if (randomPromo && randomPromo.isActive !== false && randomPromo.imageUrl && randomPromo.imageUrl.trim() !== '') {
      setActivePromotion(randomPromo);
      setShowPromotion(true);
    } else {
      setShowPromotion(false);
      setActivePromotion(null);
      setActiveView('flashcard');
      setActiveStageId('vi-ability');
      setActiveSolutionId('learn-earn-capital');
    }
    setInSplashDoors(false);
  };

  // Sign out / Close doors (Triggers Close Shop Session Review)
  const handleSignOut = () => {
    setIsCloseShopModalOpen(true);
  };

  const handleConfirmCloseShop = () => {
    signOutUser().catch(() => {});
    setIsMember(false);
    try {
      localStorage.setItem('bizz_is_member', 'false');
    } catch (e) {}
    setIsCloseShopModalOpen(false);
    setInSplashDoors(true);
    setActiveView('flashcard');
    setIsMaximized(false);
    setShowPromotion(false);
    const nextPromo = getRandomActivePromotion(cmsPromotions);
    if (nextPromo) {
      setActivePromotion(nextPromo);
    } else {
      setActivePromotion(null);
    }
  };

  // Navigate directly to section from promotion billboard
  const handleNavigateFromPromotion = (promo: CmsPromotionSection) => {
    setShowPromotion(false);
    if (promo.targetType === 'solution') {
      const targetId = (promo.targetId === 'budget' || promo.targetId === 'bizzbudget') ? 'bizzbudget' : promo.targetId;
      handleSelectSolution(targetId);
    } else if (promo.targetType === 'knowledge-base') {
      setIsMaximized(false);
      if (promo.targetTab === 'library' || promo.targetId === 'library') {
        setActiveView('library');
        setActiveKbTab('library');
      } else if (promo.targetTab) {
        setActiveKbTab(promo.targetTab);
      }
    }
  };

  // Trigger random promotion billboard
  const handleOpenPromotionBillboard = () => {
    const nextPromo = getRandomActivePromotion(cmsPromotions);
    if (nextPromo) {
      setActivePromotion(nextPromo);
      setShowPromotion(true);
    }
  };

  // Cycle through active promotions that have images
  const handleCyclePromotion = (direction: 'next' | 'prev') => {
    const available = cmsPromotions.filter(
      (p) =>
        p &&
        p.isActive !== false &&
        p.imageUrl &&
        p.imageUrl.trim() !== '' &&
        !p.imageUrl.includes('1553877522-43269d4ea984')
    );
    if (available.length === 0) {
      setShowPromotion(false);
      return;
    }
    const currentIndex = available.findIndex((p) => p.id === activePromotion?.id);
    const nextIndex =
      direction === 'next'
        ? (currentIndex + 1) % available.length
        : (currentIndex - 1 + available.length) % available.length;
    setActivePromotion(available[nextIndex]);
  };

  // Open TALK TO US: non-members are barred and shown membership guidance modal;
  // admins routed to Admin Centre Tab 2; registered members to TalkToUsModal form
  const handleOpenTalkToUs = () => {
    if (!isMember) {
      setIsNonMemberTalkToUsOpen(true);
      return;
    }
    if (isAdmin) {
      setAdminInitialTab('dialogue-centre');
      setActiveView('admin-centre');
      setActiveSolutionId('administration-centre');
      setMobileActivePanel('workarea');
    } else {
      setIsTalkToUsModalOpen(true);
    }
  };

  // Select a solution or stage from Left Panel, Quick Links, Product Slider, or Table
  const handleSelectSolution = (solId: string) => {
    const targetId = (solId === 'budget' || solId === 'bizzbudget') ? 'bizzbudget' : solId;

    if (targetId === 'talk-to-us' || targetId === 'dialogue') {
      handleOpenTalkToUs();
      return;
    }

    if (targetId === 'library' || targetId === 'sandbox-library') {
      setActiveView('library');
      return;
    }

    if (targetId === 'platform-apps' || targetId === 'platform') {
      setActiveView('platform-apps');
      return;
    }

    if (targetId === 'videos') {
      setActiveStageId('education');
      setActiveSolutionId('videos');
      setActiveView('flashcard');
      return;
    }

    if (targetId === 'articles') {
      setActiveStageId('education');
      setActiveSolutionId('articles');
      setActiveView('flashcard');
      return;
    }

    if (targetId === 'bizzclass') {
      setActiveSolutionId('cost-recovery-calculator');
      setActiveView('bizzclass');
      return;
    }

    if (targetId === 'courses') {
      setActiveSolutionId('cost-recovery-calculator');
      setActiveView('bizzclass');
      return;
    }

    if (targetId === 'vi-ability') {
      setActiveStageId('vi-ability');
      setActiveSolutionId('learn-earn-capital');
      setActiveView('flashcard');
      return;
    } else if (targetId === 'fund-ability') {
      setActiveStageId('fund-ability');
      setActiveSolutionId('bizzmodel');
      setActiveView('flashcard');
      return;
    } else if (targetId === 'sustain-ability') {
      setActiveStageId('sustain-ability');
      setActiveSolutionId('sustain-runway');
      setActiveView('flashcard');
      return;
    } else if (targetId === 'invest-ability') {
      setActiveStageId('invest-ability');
      setActiveSolutionId('invest-vdr');
      setActiveView('flashcard');
      return;
    } else if (targetId === 'personal-sandbox') {
      setActiveStageId('personal-sandbox');
      setActiveSolutionId('bizzcalc');
      setActiveView('flashcard');
      return;
    } else if (targetId === 'operations') {
      setActiveStageId('operations');
      setActiveSolutionId('bizzmoney');
      setActiveView('flashcard');
      return;
    } else if (targetId === 'growth') {
      setActiveStageId('growth');
      setActiveSolutionId('growth-strategy');
      setActiveView('flashcard');
      return;
    } else if (targetId === 'profit-optimizer') {
      // Explicit disambiguation: Profit Optimizer course belongs strictly to sustain-ability stage
      setActiveStageId((prevStage) => (prevStage === 'personal-sandbox' ? 'personal-sandbox' : 'sustain-ability'));
      setActiveSolutionId('profit-optimizer');
    } else if (targetId === 'bizzoptimizer') {
      // Explicit disambiguation: bizzoptimizer belongs strictly to operations stage
      setActiveStageId((prevStage) => (prevStage === 'personal-sandbox' ? 'personal-sandbox' : 'operations'));
      setActiveSolutionId('bizzoptimizer');
    } else {
      // It's a specific product/course ID (e.g. from Previous/Next buttons, Table row click, or sidebar)
      const matching = (cmsProducts || []).find(
        (p) => p.id === targetId || (targetId === 'budget' && p.id === 'bizzbudget')
      );
      if (matching) {
        // If current stage is personal-sandbox, keep personal-sandbox as stage; otherwise strictly lock to matching.stage!
        setActiveStageId((prevStage) => (prevStage === 'personal-sandbox' ? 'personal-sandbox' : matching.stage));
        setActiveSolutionId(matching.id === 'budget' ? 'bizzbudget' : matching.id);
      } else if (targetId === 'bizzmoney' || targetId === 'bizzbudget') {
        setActiveStageId((prevStage) => (prevStage === 'personal-sandbox' ? 'personal-sandbox' : 'operations'));
        setActiveSolutionId(targetId);
      } else {
        const bizzSol = BIZZ_SOLUTIONS.find((s) => s.id === targetId);
        if (bizzSol && bizzSol.stage) {
          const nextStage = bizzSol.stage;
          setActiveStageId((prevStage) => (prevStage === 'personal-sandbox' ? 'personal-sandbox' : nextStage));
        }
        setActiveSolutionId(targetId);
      }
    }

    setActiveView('flashcard');
    setShowPromotion(false);
    setMobileActivePanel('workarea');
  };

  // Launch solution into Active Work Area (or BizzClass Suite for courses)
  const handleLaunchSolution = (solId?: string) => {
    const effectiveId = solId || activeSolutionId;
    if (solId) {
      setActiveSolutionId(solId);
    }
    const matchingProd = (cmsProducts || []).find((p) => p.id === effectiveId);
    const nameLower = (matchingProd?.name || effectiveId || '').toLowerCase();
    const isCourse =
      !nameLower.includes('dynamics') &&
      ((cmsProducts || []).some((p) => p.id === effectiveId && p.type === 'course') ||
      ['learn-earn-capital', 'how-to-bizzcalc', 'cost-recovery-calculator', 'follow-the-money', 'financial-reports', 'your-first-hire', 'profit-optimizer', 'financial-scenario-planning', 'annual-business-planning-cycle'].includes(effectiveId) ||
      effectiveId.includes('cost-recovery') || effectiveId.includes('course') || nameLower.includes('calculator') || nameLower.includes('masterclass'));

    if (isCourse) {
      setActiveView('bizzclass');
    } else {
      setActiveView('active-app');
    }
    setMobileActivePanel('workarea');
  };

  // Launch app directly from mobile navigator or header
  const handleLaunchAppDirectly = (appId: string) => {
    setActiveSolutionId(appId);
    setActiveView('active-app');
    setMobileActivePanel('workarea');
    setIsMobileAppsDrawerOpen(false);
  };

  // Close active app back to flashcard
  const handleCloseActiveApp = () => {
    setActiveView('flashcard');
  };

  // Toggle quick link pin - strictly pins courses & apps, never stages
  const handleToggleQuickLink = (solId: string) => {
    const stageMap: Record<string, string> = {
      'fund-ability': 'cost-recovery-calculator',
      'vi-ability': 'learn-earn-capital',
      'sustain-ability': 'profit-optimizer',
      'invest-ability': 'financial-reports',
      'personal-sandbox': 'bizzcalc',
    };
    const cleanId = stageMap[solId] || solId;

    if (quickLinkIds.includes(cleanId) || quickLinkIds.includes(solId)) {
      setQuickLinkIds(quickLinkIds.filter((id) => id !== cleanId && id !== solId));
    } else {
      setQuickLinkIds([...quickLinkIds.filter((id) => id !== solId), cleanId]);
    }
  };

  // Buy solution with token deduction & persistence in cmsProducts
  const handleBuySolution = (sol: BizzSolution, targetView?: 'active-app' | 'flashcard') => {
    sol.isPurchased = true;
    const earnedTokens = sol.tokensAllocated || Math.round((sol.priceZAR || 0) * 0.2);

    setCmsProducts((prev) => {
      const updated = prev.map((p) =>
        p.id === sol.id || (sol.id === 'bizzbudget' && p.id === 'budget') || (sol.id === 'budget' && p.id === 'bizzbudget')
          ? { ...p, isPurchased: true }
          : p
      );
      safeSaveStorage(CMS_STORAGE_KEYS.PRODUCTS, updated);
      saveCmsProductsToFirestore(updated).catch(() => {});
      return updated;
    });

    setTokenBalance((prev) => {
      const newBal = prev + earnedTokens;
      safeSaveStorage('bizzdesk_token_balance', newBal);
      return newBal;
    });

    const isCourse =
      sol.category === 'education' ||
      sol.id.includes('course') ||
      sol.id.includes('capital') ||
      sol.id.includes('calculator') ||
      ['cost-recovery-calculator', 'learn-earn-capital', 'how-to-bizzcalc', 'profit-optimizer', 'financial-reports', 'your-first-hire', 'financial-scenario-planning', 'annual-business-planning-cycle'].includes(sol.id);

    setPurchasedNotice({
      solutionName: sol.name,
      tokensCredited: earnedTokens,
      priceZAR: sol.priceZAR || 0,
      solutionId: sol.id,
      isCourse,
    });

    setActiveSolutionId(sol.id === 'budget' ? 'bizzbudget' : sol.id);
    if (targetView) {
      setActiveView(targetView);
    }
  };

  // Dialogue messaging with GIM (AI-Driven Engagement Loop)
  const handleSendMessage = (text: string) => {
    const userMsg: DialogueMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDialogueMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const q = text.toLowerCase();
      let replyText = `I hear you clearly on "${text}". In the Bizzbean ecosystem, every decision traces back to our guiding creed: "infinite wisdom. instant viability. always on." Let us dissect this assumption against your operating metrics and runway.`;
      let promptSuggestion: string | undefined = undefined;
      let pillar: 'strategy' | 'critical_thinking' | 'machine_learning' | 'financial_integration' = 'critical_thinking';

      if (q.startsWith('who') || q.includes('who is') || q.includes('target customer') || q.includes('economic buyer')) {
        pillar = 'critical_thinking';
        replyText = `**COACH GIM ON PROCESS QUESTION 01: [WHO]**\n\n*Target Customer, Economic Buyer & Stakeholder Alignment*\n\nIn our V1 framework, every viable enterprise begins with absolute clarity on **WHO**:\n\n1. **The Economic Buyer vs. End-User**: Does the person with budget authority personally feel the pain point, or are you selling to an organization where users and payers diverge? Misidentifying the payer causes 70% of early conversion delays.\n2. **The Ideal Customer Profile (ICP)**: Have you defined your ICP by acute operational pain rather than broad demographics?\n3. **Willingness to Pay**: Are your target customers actively paying for workarounds today, or are you having to educate them about their problem?\n\n*Coach Inquiry*: Who is currently paying for this problem to be solved today, and what budget line item does it replace?`;
        promptSuggestion = `Clarify my economic buyer profile`;
      } else if (q.startsWith('what') || q.includes('what is') || q.includes('what exact') || q.includes('value proposition') || q.includes('value prop')) {
        pillar = 'critical_thinking';
        replyText = `**COACH GIM ON PROCESS QUESTION 02: [WHAT]**\n\n*Core Problem, Defensible Offering & Job-to-be-Done*\n\nLet us sharpen the **WHAT** to eliminate founder feature-creep:\n\n1. **The Singular Job-to-be-Done**: What is the single quantifiable metric you improve for the customer (e.g., +25% cash runway, -40% reconciliation hours)?\n2. **Minimum Viable Scope**: What features are non-essential that can be stripped out of your initial release to accelerate customer feedback?\n3. **Proof of Value**: Can the customer experience initial time-to-value within their very first session?\n\n*Coach Inquiry*: If you had to describe your solution's single greatest benefit in 10 words or fewer, what would you say?`;
        promptSuggestion = `Distill core 10-word value proposition`;
      } else if (q.startsWith('why') || q.includes('why will') || q.includes('why now') || q.includes('moat') || q.includes('defensibility') || q.includes('competitive advantage')) {
        pillar = 'strategy';
        replyText = `**COACH GIM ON PROCESS QUESTION 03: [WHY]**\n\n*Competitive Moat, Switching Friction & 'Why Now?'*\n\nEvery sustainable venture must answer the twin questions of **WHY**:\n\n1. **Why Now?**: What recent regulatory, technological, or market catalyst makes this viable today when it wasn't viable two years ago?\n2. **Switching Inertia**: Why should a customer endure the friction of ditching their current workflow (or status quo spreadsheets) to adopt yours?\n3. **Defensible Moat**: What compounds with scale? (e.g., Proprietary data loops, transaction frequency, high switching costs, or network density).\n\n*Coach Inquiry*: What prevents a well-funded competitor from copying your offering within 90 days?`;
        promptSuggestion = `Audit my defensible competitive moat`;
      } else if (q.startsWith('where') || q.includes('where is') || q.includes('channels') || q.includes('distribution') || q.includes('go-to-market')) {
        pillar = 'strategy';
        replyText = `**COACH GIM ON PROCESS QUESTION 04: [WHERE]**\n\n*Market Distribution, Channels & Positioning*\n\nProducts don't sell themselves—distribution defines venture survival:\n\n1. **Distribution Channel Ownership**: Where do your target buyers congregate? Are you reliant on paid ad arbitrage, or building direct programmatic distribution?\n2. **Sales Velocity**: Are you selling top-down (enterprise contract cycles of 6+ months) or product-led (self-serve with immediate token onboarding)?\n3. **Geographic & Statutory Alignment**: Are your pricing tiers and VAT compliant with South African Rands (ZAR) statutory standards and global targets?\n\n*Coach Inquiry*: What is your lowest-friction channel to acquire the next 10 paying customers?`;
        promptSuggestion = `Map primary customer acquisition channels`;
      } else if (q.startsWith('when') || q.includes('when do') || q.includes('runway timing') || q.includes('break-even') || q.includes('milestones')) {
        pillar = 'financial_integration';
        replyText = `**COACH GIM ON PROCESS QUESTION 05: [WHEN]**\n\n*Milestones, Cash Conversion & 18-Month Runway Alarms*\n\nTiming dictates whether a venture reaches sustainability or suffers premature insolvency:\n\n1. **Cash Conversion Cycle**: When invoice payments are sent, how many days elapse until cash settles in your bank? (Every 30-day debtor lag burns 1.2 months of runway).\n2. **Break-Even Velocity**: When does gross margin revenue exceed monthly overhead expenses without outside cash injections?\n3. **Refinancing Trigger Point**: Bizzbean mandates beginning your next capital raise when you have 9 months of runway remaining—never waiting until the red zone.\n\n*Coach Inquiry*: What is your current monthly net burn, and how many months of cash runway remain?`;
        promptSuggestion = `Calculate 18-month cash runway date`;
      } else if (q.startsWith('how') || q.includes('how do') || q.includes('unit economics') || q.includes('cac') || q.includes('ltv') || q.includes('margins') || q.includes('pricing model')) {
        pillar = 'financial_integration';
        replyText = `**COACH GIM ON PROCESS QUESTION 06: [HOW]**\n\n*Unit Economics, Contribution Margins & Scalability*\n\nLet us run the institutional viability formula on **HOW** the numbers work:\n\n1. **Contribution Margin Floor**: Target **>= 65%** gross margin for digital/software; **>= 38%** for physical operations.\n2. **CAC Payback Horizon**: Customer acquisition costs must be fully recovered in **< 8 months**.\n3. **LTV to CAC Ratio**: Enforce **LTV : CAC >= 3.2x** to ensure organic reinvestment capacity.\n4. **Reinvestment Velocity**: With our 20% token rewards, what percentage of customer wallet share is recycled back into your ecosystem?\n\n*Coach Inquiry*: What is your average revenue per customer (ARPU), and what does it cost to acquire them?`;
        promptSuggestion = `Model LTV to CAC payback ratio`;
      } else if (q.includes('blind spot') || q.includes('assumption') || q.includes('bias')) {
        pillar = 'critical_thinking';
        replyText = `**GIM Critical Review (Critical Thinking Pillar)**:\n\nIn early-stage modeling, the most lethal blind spot is *debtor collection lag*.\n\n• If collections slip from 30 to 60 days, your cash runway immediately contracts by **2.4 months**.\n• Founders routinely overestimate top-line velocity while underestimating working capital friction.\n\n*Coach Recommendation*: Enforce 2% net-10 prepayment discounts in bizzmoney and pressure-test your burn rate against delayed client disbursements.`;
        promptSuggestion = `Run sensitivity test with 60-day lag`;
      } else if (q.includes('cac') || q.includes('ltv') || q.includes('unit economics') || q.includes('margin') || q.includes('vi-ability')) {
        pillar = 'financial_integration';
        replyText = `**GIM Unit Economics Audit (Vi-ability Stage)**:\n\nTo earn access to institutional capital, your unit economics must prove self-sustaining viability:\n\n• Target ratio: **LTV : CAC >= 3.2x**\n• Cash payback period: **< 8 months**\n• Gross margin floor: **>= 65%** for SaaS/digital; **>= 38%** for physical operations.\n\n*Coach Recommendation*: Use bizzcalc to verify that customer acquisition isn't being masked by founder labor or non-recurring launch subsidies.`;
        promptSuggestion = `Calculate contribution margin floor`;
      } else if (q.includes('runway') || q.includes('burn') || q.includes('sustain') || q.includes('cash')) {
        pillar = 'financial_integration';
        replyText = `**GIM Runway Safeguard (Sustain-ability Stage)**:\n\nBizzbean enforces an uncompromised **18-month baseline runway buffer** before commercial expansion.\n\n• Current estimated runway: Safe zone (> 14 months) with active alarms.\n• Primary optimization lever: Use **bizzoptimizer** to trim non-core software seats and renegotiate vendor payment terms from 30 to 60 days.\n\n*Coach Recommendation*: Extending payables to net-60 injects immediate working capital liquidity without sacrificing headcount.`;
        promptSuggestion = `Model 15% SaaS overhead trim`;
      } else if (q.includes('valuation') || q.includes('dcf') || q.includes('model') || q.includes('fund-ability') || q.includes('investor')) {
        pillar = 'financial_integration';
        replyText = `**GIM Valuation Engine (Fund-ability Stage)**:\n\nInstitutional angels and venture funds scrutinize the integrity between your Income Statement, Balance Sheet, and Cash Flow:\n\n• Discount rate (WACC): **18% - 24%** for early-stage risk profiles.\n• Terminal growth rate: Keep within **2.5% - 3.5%** to avoid DCF distortion.\n• Revenue multiples: Benchmark between **4.5x - 7.0x ARR** depending on net retention.\n\n*Coach Recommendation*: Stress-test your valuation across Bear (-30% sales), Base, and Bull (+40% sales) scenarios in bizzmodel.`;
        promptSuggestion = `Review DCF sensitivity matrix`;
      } else if (q.includes('vdr') || q.includes('due diligence') || q.includes('cap table') || q.includes('invest-ability')) {
        pillar = 'strategy';
        replyText = `**GIM Diligence Readiness (Invest-ability Stage)**:\n\nPassing institutional due diligence requires 100% audit readiness with zero corporate friction:\n\n• Cap table waterfalls must reflect option pool expansions (10%–15%) and SAFE conversion notes.\n• Corporate IP assignments, customer contracts, and tax clearance must reside in your secure Google Drive VDR structure.\n\n*Coach Recommendation*: Complete the 40-item institutional checklist before scheduling lead investor term sheet defense calls.`;
        promptSuggestion = `Audit VDR checklist items`;
      } else if (q.includes('ai') || q.includes('machine') || q.includes('gemini') || q.includes('prompt') || q.includes('automate')) {
        pillar = 'machine_learning';
        replyText = `**GIM Machine-Based Systems (AI Literacy Pillar)**:\n\nApplied enterprise intelligence is not about novelty prompts—it is about automated business workflows:\n\n• Connect Gemini AI grounding to your transaction ledger to auto-flag budget variance drifts.\n• Automate financial variance memos for board reporting.\n• Build prompt pipelines for customer inquiry categorization.\n\n*Coach Recommendation*: Leverage structured Gemini schemas to convert unstructured accounting receipts into bizzmoney journal entries.`;
        promptSuggestion = `Generate Gemini prompt architecture`;
      } else if (q.includes('strategy') || q.includes('moat') || q.includes('competitor') || q.includes('pivot')) {
        pillar = 'strategy';
        replyText = `**GIM Strategy Evaluation (Growth Pillar)**:\n\nCompetitive moats rarely reside in software features alone—features are copied within weeks:\n\n• Build defensive moats through proprietary transaction feedback loops.\n• Establish customer switching friction by embedding deep workflow dependencies.\n• Secure distribution channel ownership rather than relying solely on paid ad networks.\n\n*Coach Recommendation*: Stress-test your value proposition against a price-war scenario using Porter's 5-Forces analysis.`;
        promptSuggestion = `Evaluate Porter's 5 Forces`;
      } else if (q.includes('library') || q.includes('vault') || q.includes('stored asset') || q.includes('workbook') || q.includes('template')) {
        pillar = 'financial_integration';
        replyText = `**COACH GIM ON SANDBOX LIBRARY (PERSONAL VAULT & FOCUS LEDGER)**:\n\nYour SANDBOX LIBRARY has been transferred from V1 directly into your centre work area:\n\n• **Daily Focus Ledger**: Manage and check off your top 3 daily commercial objectives.\n• **Stored Financial Models**: Instant access to your versioned .gsheet and .xlsx models with 100% unlocked formulas.\n• **Strategic Memos & Dialogue Transcripts**: Review board memorandums and Coach GIM inquiry summaries.\n• **Due Diligence Packs & Companion Workbooks**: Access the 40-item VDR checklist, Cap Table dilution models, and Customer Discovery interview scripts.\n\n*Coach Recommendation*: Click 'SANDBOX LIBRARY' in the left Solutions panel or top tabs to inspect and download your assets.`;
        promptSuggestion = `Open Sandbox Library in Work Area`;
      } else if (q.includes('sandbox') || q.includes('cockpit') || q.includes('personal')) {
        pillar = 'critical_thinking';
        replyText = `**GIM Sandbox Advisory (Personal Workbench)**:\n\nYour personal-SANDBOX is your digital flight simulator. Here you can handpick and assemble tools without real-world financial risk:\n\n• Assemble bizzcalc, bizzmodel, bizzmoney, and video masterclasses into a personalized cockpit.\n• Review all stage solutions in the summary table below to identify unowned capabilities.\n\n*Coach Recommendation*: Ensure you have paired at least one validation engine (Vi-ability) with one operational accounting ledger (Operations).`;
        promptSuggestion = `Audit my assembled cockpit`;
      } else {
        pillar = 'critical_thinking';
        replyText = `**GIM Socratic Reflection**:\n\nThank you for sharing your thoughts on "${text}". As your gentle business coach, my goal is to guide you to clarity:\n\n1. What is the fundamental assumption underlying this premise?\n2. What is the mathematical impact on your 18-month cash runway if this assumption fails?\n3. How can we test this hypothesis with minimal capital outlay?\n\n*Let us break this down step-by-step together.*`;
        promptSuggestion = `Test My Operational Assumptions`;
      }

      const gimMsg: DialogueMessage = {
        id: `gim-${Date.now()}`,
        sender: 'gim',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pillar,
        actionPrompt: promptSuggestion,
      };

      setDialogueMessages((prev) => [...prev, gimMsg]);
    }, 600);
  };

  // Daily Objectives handlers
  const handleToggleObjective = (id: string) => {
    setDailyObjectives((prev) =>
      prev.map((o) => (o.id === id ? { ...o, completed: !o.completed } : o))
    );
  };

  const handleAddObjective = (text: string) => {
    if (dailyObjectives.length >= 3) return;
    const newObj: DailyObjective = {
      id: `obj-${Date.now()}`,
      text,
      completed: false,
    };
    setDailyObjectives((prev) => [...prev, newObj]);
  };

  // Unified layout behavior: allow BizzCalc to share identical responsive workstation layout with BizzDynamics
  const isStandaloneApp = false;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FAF8F5] text-slate-800 font-sans flex flex-col">
      {/* ========================================================================= */}
      {/* VIEW 1: TINTED GLASS SLIDING DOORS & OFFICE ENVIRONMENT SPLASH PAGE       */}
      {/* ========================================================================= */}
      {inSplashDoors ? (
        <SplashOfficeDoors
          onEnterWorkspace={handleEnterWorkspace}
          onOpenAboutModal={() => setIsAboutModalOpen(true)}
          activePromotion={activePromotion}
          cmsPromotions={cmsPromotions}
          onTriggerDoorOpening={handleTriggerDoorOpening}
          onConfirmSignUp={(name, email, company) => {
            setUserProfile((prev) => ({
              ...prev,
              founderName: name,
              companyName: company,
            }));
            setUserEmail(email);
            setIsMember(true);
          }}
        />
      ) : (
        /* ========================================================================= */
        /* VIEW 2: THE bizz-DESK 3-PANEL WORKSTATION (ZERO VERTICAL SCROLL ON DESK)  */
        /* ========================================================================= */
        <div
          className={`h-screen w-screen flex flex-col overflow-hidden transition-colors ${
            theme === 'dark' ? 'bg-[#0A0D14] text-[#E2E8F0]' : 'bg-architectural-grid text-slate-800'
          }`}
        >
          {/* Top Bar with Pinboard and Tokenomics (Hidden when standalone BizzCalc is active) */}
          {!isStandaloneApp && (
            <BizzDeskHeader
              isMember={isMember}
              userEmail={userEmail}
              userName={userProfile?.founderName}
              tokenBalance={tokenBalance}
              quickLinkIds={quickLinkIds}
              activeSolutionId={activeSolutionId}
              isMaximized={isMaximized}
              theme={theme}
              onSelectSolution={handleSelectSolution}
              onToggleMaximize={() => {
                setIsMaximized(!isMaximized);
                setSolutionsPanelMode('solutions');
              }}
              onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              onSignOut={handleSignOut}
              onOpenCmsConsole={() => setIsCmsConsoleOpen(true)}
              onToggleQuickLink={handleToggleQuickLink}
              onBuyTokens={() => setIsBuyTokensModalOpen(true)}
              onSelectLibrary={() => {
                setActiveView('library');
                setMobileActivePanel('workarea');
              }}
              onOpenTalkToUs={handleOpenTalkToUs}
              cmsProducts={cmsProducts}
              onLaunchApp={handleLaunchAppDirectly}
              onLaunchSolution={handleLaunchSolution}
            />
          )}

          {/* The Workstation Area (Responsive 3-Panel on Desktop / Single Full-Width Panel on Mobile) */}
          <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
            {/* Panel 1: Solutions Navigation (Left) - Hidden when isMaximized for full work focus */}
            {!isMaximized && (
              <div
                className={`shrink-0 ${
                  mobileActivePanel === 'solutions'
                    ? 'h-full flex w-full'
                    : 'hidden md:flex md:w-72 lg:w-76 md:ml-3 lg:ml-6 md:my-2 lg:my-3 mr-2 md:h-[calc(100%-1rem)] lg:h-[calc(100%-1.5rem)]'
                }`}
              >
                <SolutionsPanel
                  activeSolutionId={
                    activeView === 'about'
                      ? 'about-bizzbean'
                      : activeView === 'footer'
                      ? 'website-footer'
                      : activeView === 'admin-centre'
                      ? 'administration-centre'
                      : activeView === 'education-centre'
                      ? 'education-centre'
                      : activeView === 'bizzclass'
                      ? (activeSolutionId || 'cost-recovery-calculator')
                      : activeView === 'workspace'
                      ? 'google-workspace'
                      : activeView === 'library'
                      ? 'sandbox-library'
                      : activeSolutionId
                  }
                  activeStageId={activeStageId}
                  theme={theme}
                  companyName={userProfile.companyName}
                  isAdmin={isAdmin}
                  onSelectSolution={(solId) => {
                    handleSelectSolution(solId);
                    setMobileActivePanel('workarea');
                  }}
                  onSelectAbout={() => {
                    setActiveView('about');
                    setMobileActivePanel('workarea');
                  }}
                  onSelectLibrary={() => {
                    setActiveView('library');
                    setMobileActivePanel('workarea');
                  }}
                  onOpenTalkToUs={handleOpenTalkToUs}
                  onSelectWorkspace={() => {
                    setActiveView('workspace');
                    setMobileActivePanel('workarea');
                  }}
                  onSelectFooter={() => {
                    setActiveView('footer');
                    setMobileActivePanel('workarea');
                  }}
                  onSelectAdminCentre={() => {
                    setActiveView('admin-centre');
                    setMobileActivePanel('workarea');
                  }}
                  onSelectEducationCentre={() => {
                    setActiveView('education-centre');
                    setActiveSolutionId('education-centre');
                    setMobileActivePanel('workarea');
                  }}
                  onSelectBizzClass={() => {
                    setActiveView('bizzclass');
                    setActiveSolutionId('cost-recovery-calculator');
                    setMobileActivePanel('workarea');
                  }}
                  onSelectCourse={(courseId) => {
                    setActiveView('bizzclass');
                    setActiveSolutionId(courseId);
                    setShowPromotion(false);
                    setMobileActivePanel('workarea');
                  }}
                  onActivateDialogue={() => {
                    setActiveKbTab('dialogue');
                    // On small mobile view only, navigate to knowledge tab
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      setMobileActivePanel('knowledge');
                    }
                  }}
                  panelMode={solutionsPanelMode}
                  onTogglePanelMode={(mode) => setSolutionsPanelMode(mode)}
                  activeKbTab={activeKbTab}
                />
              </div>
            )}

            {/* Panel 2: Center Work Area - Expands to full screen width when isMaximized */}
            <main
              className={`flex-grow flex-col overflow-hidden relative ${
                mobileActivePanel === 'workarea' ? 'flex w-full h-full' : 'hidden md:flex'
              } md:my-2 lg:my-3 md:h-[calc(100%-1rem)] lg:h-[calc(100%-1.5rem)] border md:rounded-2xl shadow-xs ${
                isMaximized ? 'md:mx-3 lg:mx-6' : ''
              } ${
                theme === 'dark' ? 'bg-[#101424] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
              }`}
            >
              <WorkArea
                activeSolution={activeSolution}
                activeStageId={activeStageId}
                activeView={activeView}
                adminInitialTab={adminInitialTab}
                isMember={isMember}
                isAdmin={isAdmin}
                tokenBalance={tokenBalance}
                quickLinkIds={quickLinkIds}
                userProfile={userProfile}
                theme={theme}
                cmsProducts={cmsProducts}
                cmsVideos={cmsVideos}
                cmsArticles={cmsArticles}
                cmsPromotions={cmsPromotions}
                activePromotion={activePromotion}
                showPromotion={showPromotion}
                onClosePromotion={() => setShowPromotion(false)}
                onNavigateToSection={handleNavigateFromPromotion}
                onOpenPromotionBillboard={handleOpenPromotionBillboard}
                onCyclePromotion={handleCyclePromotion}
                onLaunchSolution={handleLaunchSolution}
                onCloseActiveApp={handleCloseActiveApp}
                onBuySolution={handleBuySolution}
                onToggleQuickLink={handleToggleQuickLink}
                onOpenVideoModal={(sol) => setVideoModalSolution(sol)}
                onUpdateProfile={(prof) => setUserProfile(prof)}
                onSelectSolutionById={handleSelectSolution}
                onOpenSignUp={() => setInSplashDoors(true)}
                libraryItems={libraryItems}
                objectives={dailyObjectives}
                onToggleObjective={handleToggleObjective}
                onAddObjective={handleAddObjective}
                onOpenLibraryItem={(item) => setInspectedLibraryItem(item)}
                onSyncProductsToWebsite={handleSyncProductsFromCms}
                onSyncVideosToWebsite={handleSyncVideosFromCms}
                onSyncArticlesToWebsite={handleSyncArticlesFromCms}
                onSyncPromotionsToWebsite={handleSyncPromotionsFromCms}
                onOpenStandaloneCmsModal={() => setIsCmsConsoleOpen(true)}
                onBackToWorkstation={() => setActiveView('flashcard')}
                onOpenTalkToUs={handleOpenTalkToUs}
              />
            </main>

            {/* Panel 3: Knowledge Base & AI-LOOP (Right) - Symmetrically aligned with Left-Hand Solutions Panel */}
            {!isMaximized && (
              <div
                className={`shrink-0 ${
                  mobileActivePanel === 'knowledge'
                    ? 'h-full flex w-full'
                    : 'hidden md:flex md:w-72 lg:w-80 md:mr-3 lg:mr-6 md:my-2 lg:my-3 ml-2 md:h-[calc(100%-1rem)] lg:h-[calc(100%-1.5rem)]'
                }`}
              >
                <KnowledgeBasePanel
                  dialogueMessages={dialogueMessages}
                  libraryItems={libraryItems}
                  theme={theme}
                  objectives={dailyObjectives}
                  activeKbTab={activeKbTab}
                  onTabChange={(tab) => {
                    setActiveKbTab(tab);
                    if (tab === 'library') {
                      setActiveView('library');
                      setMobileActivePanel('workarea');
                    }
                  }}
                  onToggleObjective={handleToggleObjective}
                  onAddObjective={handleAddObjective}
                  onSendMessage={handleSendMessage}
                  onOpenLibraryItem={(item) => setInspectedLibraryItem(item)}
                  activeSolution={activeSolution}
                  activeStageId={activeStageId}
                  onResetDialogue={() => setDialogueMessages(INITIAL_DIALOGUE_MESSAGES)}
                  onOpenLibraryInCenterPanel={() => {
                    setActiveView('library');
                    setMobileActivePanel('workarea');
                  }}
                  userProfile={userProfile}
                  onSelectSolutionById={(solId) => {
                    handleSelectSolution(solId);
                    setMobileActivePanel('workarea');
                  }}
                />
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* FRIENDLY MOBILE NAVIGATION SYSTEM (PER PROPOSAL 3)                   */}
          {/* Allows seamless navigation to and from chosen apps without crowding   */}
          {/* ===================================================================== */}
          {!isStandaloneApp && (
            <nav
              aria-label="Mobile navigation"
              className={`lg:hidden shrink-0 border-t flex items-center justify-around py-2 px-1 z-30 select-none ${
                theme === 'dark' ? 'bg-[#101424] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-sm'
              }`}
            >
              <button
                type="button"
                onClick={() => setMobileActivePanel('solutions')}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all ${
                  mobileActivePanel === 'solutions'
                    ? 'text-[#5584B4] bg-[#5584B4]/15 ring-1 ring-[#5584B4]/30'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Menu className="h-4 w-4" />
                <span>SOLUTIONS</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileActivePanel('workarea')}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all ${
                  mobileActivePanel === 'workarea'
                    ? 'text-[#5584B4] bg-[#5584B4]/15 ring-1 ring-[#5584B4]/30'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>WORK AREA</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileActivePanel('knowledge')}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all ${
                  mobileActivePanel === 'knowledge'
                    ? 'text-[#5584B4] bg-[#5584B4]/15 ring-1 ring-[#5584B4]/30'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>KNOWLEDGE</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMobileAppsDrawerOpen(true)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold text-emerald-500 hover:bg-emerald-500/10 transition-all"
              >
                <Smartphone className="h-4 w-4 text-[#84CC16]" />
                <span>APPS</span>
              </button>
            </nav>
          )}

          {/* ===================================================================== */}
          {/* MOBILE APPS DRAWER MODAL                                              */}
          {/* ===================================================================== */}
          {isMobileAppsDrawerOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
              <div
                className={`w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] font-mono ${
                  theme === 'dark'
                    ? 'bg-[#101424] border-[#252E4A] text-slate-200'
                    : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-800'
                }`}
              >
                {/* Drawer Header */}
                <div
                  className={`p-4 border-b flex items-center justify-between shrink-0 ${
                    theme === 'dark' ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-[#5584B4]/20 border border-[#5584B4]/40 text-[#5584B4]">
                      <Smartphone className="h-4 w-4 text-[#84CC16]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Platform Apps Navigator
                      </h3>
                      <span className="text-[10px] text-slate-400 lowercase block">
                        designed for mobile vs laptop/desktop
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileAppsDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="p-4 overflow-y-auto space-y-4 text-xs">
                  {/* 1. Mobile-Ready Platform Apps */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        📱 Touch-Optimized for Mobile
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          theme === 'dark' ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white lowercase text-sm">
                              bizzcalc
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30">
                              mobile ready
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Cost Recovery & Break-Even Simulator
                          </p>
                        </div>
                        <button
                          onClick={() => handleLaunchAppDirectly('bizzcalc')}
                          className="px-3 py-1.5 rounded-lg bg-[#5584B4] hover:bg-[#4372A2] text-white text-[11px] font-bold uppercase shrink-0 flex items-center gap-1"
                        >
                          <Play className="h-3 w-3 fill-white" />
                          <span>Launch</span>
                        </button>
                      </div>

                      <div
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          theme === 'dark' ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white lowercase text-sm">
                              bizzcalculators
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30">
                              mobile ready
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            CAC:LTV & Working Capital Micro-Suite
                          </p>
                        </div>
                        <button
                          onClick={() => handleLaunchAppDirectly('bizzcalculators')}
                          className="px-3 py-1.5 rounded-lg bg-[#5584B4] hover:bg-[#4372A2] text-white text-[11px] font-bold uppercase shrink-0 flex items-center gap-1"
                        >
                          <Play className="h-3 w-3 fill-white" />
                          <span>Launch</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. Desktop-Only Notice */}
                  <div>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-2 flex items-start gap-2">
                      <Laptop className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
                        <strong>Laptop / Desktop Devices:</strong> bizzdynamics, bizzmodel, Hi-Level Forecast, and bizzplan feature 36-month spreadsheet projections and 3-statement models designed for PC/laptop screens.
                      </p>
                    </div>

                    <div className="space-y-1.5 opacity-85">
                      {[
                        { id: 'bizzdynamics', name: 'bizzdynamics', desc: 'Operational Simulation Core' },
                        { id: 'bizzmodel', name: 'bizzmodel', desc: '3-Statement Financial Simulator' },
                        { id: 'hi-level-forecast', name: 'Hi-Level Forecast', desc: '36-Month Strategic Horizon' },
                        { id: 'bizzplan', name: 'bizzplan', desc: 'Executive Strategic Business Plan' },
                      ].map((app) => (
                        <div
                          key={app.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                            theme === 'dark' ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-slate-100 border-[#D8CEBC]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 dark:text-slate-200 lowercase">
                                {app.name}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 font-bold uppercase">
                                pc only
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block">{app.desc}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 lowercase">open on pc</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div
                  className={`p-3 border-t flex justify-end shrink-0 ${
                    theme === 'dark' ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
                  }`}
                >
                  <button
                    onClick={() => setIsMobileAppsDrawerOpen(false)}
                    className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        onEnterAsGuest={() => {
          setIsAboutModalOpen(false);
          handleEnterWorkspace(false);
        }}
        userProfile={userProfile}
        theme={theme}
      />

      <VideoModal
        solution={videoModalSolution}
        onClose={() => setVideoModalSolution(null)}
        onLaunchSolution={() => {
          if (videoModalSolution) {
            setActiveSolutionId(videoModalSolution.id);
            setActiveView('active-app');
          }
          setVideoModalSolution(null);
        }}
      />

      <LibraryItemModal
        item={inspectedLibraryItem}
        onClose={() => setInspectedLibraryItem(null)}
      />

      {/* Close Shop for the Day (Review Objectives or Visitor Capital Prompt) */}
      <CloseShopModal
        isOpen={isCloseShopModalOpen}
        isMember={isMember}
        objectives={dailyObjectives}
        onUpdateObjectives={(objs) => setDailyObjectives(objs)}
        onConfirmCloseShop={handleConfirmCloseShop}
        onCloseModal={() => setIsCloseShopModalOpen(false)}
        onOpenSignUp={() => {
          setIsCloseShopModalOpen(false);
          setInSplashDoors(true);
        }}
      />

      {/* CMS Console (Firebase Real-Time Master Matrix & Repositories) */}
      {isCmsConsoleOpen && (
        <CmsConsoleModal
          isOpen={isCmsConsoleOpen}
          onClose={handleCloseCmsConsole}
          cmsProducts={cmsProducts}
          cmsVideos={cmsVideos}
          cmsArticles={cmsArticles}
          cmsPromotions={cmsPromotions}
          onSyncProductsToWebsite={handleSyncProductsFromCms}
          onSyncVideosToWebsite={handleSyncVideosFromCms}
          onSyncArticlesToWebsite={handleSyncArticlesFromCms}
          onSyncPromotionsToWebsite={handleSyncPromotionsFromCms}
        />
      )}

      {/* Buy Tokens & Runway Credits Modal */}
      <BuyTokensModal
        isOpen={isBuyTokensModalOpen}
        tokenBalance={tokenBalance}
        theme={theme}
        onClose={() => setIsBuyTokensModalOpen(false)}
        onAddTokens={(amount) => setTokenBalance((prev) => prev + amount)}
        userEmail={userEmail}
      />

      {/* TALK TO US Advisory Modal for Verified Members */}
      <TalkToUsModal
        isOpen={isTalkToUsModalOpen}
        onClose={() => setIsTalkToUsModalOpen(false)}
        userProfile={userProfile}
        isDark={theme === 'dark'}
      />

      {/* Non-Member Talk To Us Access Restriction Modal */}
      <NonMemberTalkToUsModal
        isOpen={isNonMemberTalkToUsOpen}
        onClose={() => setIsNonMemberTalkToUsOpen(false)}
        onOpenSignUp={() => {
          setIsNonMemberTalkToUsOpen(false);
          setInSplashDoors(true);
        }}
        onOpenSignIn={() => {
          setIsNonMemberTalkToUsOpen(false);
          setInSplashDoors(true);
        }}
        theme={theme}
      />

      {/* PayFast Status Floating Notification */}
      {payfastNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start gap-3.5 ${
              payfastNotice.status === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                : 'bg-amber-950/90 border-amber-500/40 text-amber-100'
            }`}
          >
            <div
              className={`p-2 rounded-xl mt-0.5 ${
                payfastNotice.status === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {payfastNotice.status === 'success' ? '✓' : '!'}
            </div>
            <div className="flex-1 text-xs">
              <div className="font-bold font-mono tracking-wider uppercase mb-1">
                {payfastNotice.status === 'success' ? 'PayFast Payment Confirmed' : 'Payment Notification'}
              </div>
              <p className="opacity-90 leading-relaxed font-sans">{payfastNotice.message}</p>
            </div>
            <button
              onClick={() => setPayfastNotice(null)}
              className="text-white/60 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {/* Solution Purchase Success Modal */}
      {purchasedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs select-none animate-in fade-in duration-150">
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col font-mono ${
              theme === 'dark'
                ? 'bg-[#101424] border-[#252E4A] text-slate-100'
                : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
            }`}
          >
            {/* Header */}
            <div
              className={`p-5 border-b flex items-center justify-between ${
                theme === 'dark' ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#F4EFE6] border-[#E8E2D8]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/40">
                  <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                      PURCHASE CONFIRMED
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      UNLOCKED
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 lowercase block mt-0.5">
                    transaction saved & tokens credited
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPurchasedNotice(null)}
                className="p-1.5 rounded-xl border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div
                className={`p-4 rounded-2xl border ${
                  theme === 'dark' ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
                }`}
              >
                <div className="text-xs text-slate-400 lowercase mb-1">unlocked solution:</div>
                <div className="text-base font-bold uppercase text-[#5584B4] dark:text-[#DDEBF7]">
                  {purchasedNotice.solutionName}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div
                    className={`p-2.5 rounded-xl border ${
                      theme === 'dark' ? 'bg-[#0E1220] border-[#222E4E]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
                    }`}
                  >
                    <span className="text-slate-400 block text-[10px] lowercase">amount paid:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      R{purchasedNotice.priceZAR.toFixed(2)}
                    </span>
                  </div>
                  <div
                    className={`p-2.5 rounded-xl border ${
                      theme === 'dark' ? 'bg-[#0E1220] border-[#222E4E]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
                    }`}
                  >
                    <span className="text-slate-400 block text-[10px] lowercase">tokens credited:</span>
                    <span className="font-bold text-emerald-500 flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5" />
                      +{purchasedNotice.tokensCredited} tokens
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs font-sans text-slate-600 dark:text-slate-400 leading-relaxed">
                This solution is now permanently unlocked for your venture. You can launch it directly into your expanded workstation or access companion modules without limitations.
              </p>
            </div>

            {/* Footer Actions */}
            <div
              className={`p-4 border-t flex items-center justify-end gap-3 ${
                theme === 'dark' ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#F4EFE6] border-[#E8E2D8]'
              }`}
            >
              <button
                type="button"
                onClick={() => setPurchasedNotice(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold uppercase hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              >
                CONTINUE BROWSING
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetSol = purchasedNotice.solutionId;
                  setPurchasedNotice(null);
                  handleLaunchSolution(targetSol);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold uppercase flex items-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Play className="h-3.5 w-3.5 fill-white text-white" />
                <span>LAUNCH SOLUTION NOW</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
