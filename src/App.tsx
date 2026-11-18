import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { SplashOfficeDoors } from './components/SplashOfficeDoors';
import { BizzDeskHeader } from './components/BizzDeskHeader';
import { SolutionsPanel } from './components/SolutionsPanel';
import { WorkArea } from './components/WorkArea';
import { KnowledgeBasePanel } from './components/KnowledgeBasePanel';
import { AboutModal } from './components/AboutModal';
import { VideoModal } from './components/VideoModal';
import { LibraryItemModal } from './components/LibraryItemModal';
import { ErrorBoundary } from './components/ErrorBoundary';
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
  mergeLoadedArticles,
  mergeLoadedVideos,
  CANONICAL_MASTER_COURSE_IDS,
  CMS_STORAGE_KEYS,
  ensureFreshCmsCache,
  getDeletedProductIds,
  getDeletedVideoIds,
  getDeletedArticleIds,
  getCanonicalCourseId,
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
  subscribeToCmsVideos,
  subscribeToCmsArticles,
} from './services/cmsFirestoreService';
import { BIZZ_SOLUTIONS, INITIAL_DIALOGUE_MESSAGES, INITIAL_LIBRARY_ITEMS } from './data/bizzdeskData';
import { BizzSolution, DialogueMessage, LibraryItem, UserBusinessProfile } from './types';
import { listenToAuthChanges, signOutUser, determineUserRole, resolveDisplayName } from './services/firebaseAuthService';
import { SandboxWelcomeLetter } from './components/SandboxWelcomeLetter';
import { ProductCheckoutModal } from './components/ProductCheckoutModal';
import { ClientProfileJournalModal } from './components/ClientProfileJournalModal';
import { downloadGettingToValueBook } from './utils/bookDownload';
import { sendWelcomeEmail } from './services/emailService';
import { recordTransactionToJournal, upsertClientProfile } from './services/transactionJournalService';
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
  Lock,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Library,
  GraduationCap,
  Video,
  FileText,
  Globe,
  Info,
  Mail,
  BookOpen,
} from 'lucide-react';

export default function App() {
  // Navigation / View state
  const [inSplashDoors, setInSplashDoors] = useState<boolean>(true);
  const [showWelcomeLetter, setShowWelcomeLetter] = useState<boolean>(false);
  const [bookNotice, setBookNotice] = useState<string | null>(null);
  const [isMember, setIsMember] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bizz_is_member') === 'true';
    } catch {
      return false;
    }
  });
  const [isNonMemberTalkToUsOpen, setIsNonMemberTalkToUsOpen] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>(() => {
    try {
      return localStorage.getItem('bizz_user_email') || 'thebizzbeanchannel@gmail.com';
    } catch {
      return 'thebizzbeanchannel@gmail.com';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('bizz_user_email', userEmail);
    } catch (e) {}
  }, [userEmail]);

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
      window.dispatchEvent(new CustomEvent('bizz-token-balance-updated', { detail: tokenBalance }));
    } catch (e) {}
  }, [tokenBalance]);

  useEffect(() => {
    const handleTokenDeduction = (e: Event) => {
      const customEvent = e as CustomEvent<{ amount?: number; description?: string }>;
      const amount = Number(customEvent.detail?.amount || 0);
      if (amount > 0) {
        setTokenBalance((prev) => Math.max(0, prev - amount));
      }
    };
    const handleOpenBuyTokens = () => {
      setIsBuyTokensModalOpen(true);
    };
    window.addEventListener('bizz-token-deduction', handleTokenDeduction);
    window.addEventListener('bizz-open-buy-tokens', handleOpenBuyTokens);
    return () => {
      window.removeEventListener('bizz-token-deduction', handleTokenDeduction);
      window.removeEventListener('bizz-open-buy-tokens', handleOpenBuyTokens);
    };
  }, []);

  // Theme state: Default to 'light' (black & grey on white) with instant dark theme toggle
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Per-user purchased solution IDs (courses and apps)
  const [userPurchases, setUserPurchases] = useState<string[]>(() => {
    try {
      const email = typeof window !== 'undefined' ? (localStorage.getItem('bizzbean_last_login_email') || '').toLowerCase().trim() : '';
      if (email) {
        const stored = localStorage.getItem(`bizz_user_purchases_${email}`);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch {}
    return [];
  });

  // Sync userPurchases whenever userEmail changes
  useEffect(() => {
    const cleanEmail = (userEmail || '').trim().toLowerCase();
    if (!cleanEmail) return;
    try {
      const stored = localStorage.getItem(`bizz_user_purchases_${cleanEmail}`);
      if (stored) {
        setUserPurchases(JSON.parse(stored));
      } else {
        setUserPurchases([]);
      }
    } catch {}
  }, [userEmail]);

  const markProductPurchasedForUser = useCallback((prodId: string) => {
    const cleanId = prodId.toLowerCase().trim();
    const canonId = getCanonicalCourseId(cleanId) || cleanId;
    const cleanEmail = (userEmail || (typeof window !== 'undefined' ? localStorage.getItem('bizzbean_last_login_email') || '' : '')).toLowerCase().trim();

    setUserPurchases((prev) => {
      const updated = Array.from(new Set([...prev, cleanId, canonId]));
      if (cleanEmail) {
        try {
          localStorage.setItem(`bizz_user_purchases_${cleanEmail}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  }, [userEmail]);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = listenToAuthChanges((fbUser) => {
      if (fbUser) {
        const cleanEmail = (fbUser.email || '').trim();
        setUserEmail(cleanEmail);
        setIsMember(true);
        try {
          localStorage.setItem('bizz_is_member', 'true');
        } catch (e) {}
        const resolvedName = resolveDisplayName(cleanEmail, fbUser.displayName);
        setUserProfile((prev) => ({
          ...prev,
          founderName: resolvedName,
          email: cleanEmail,
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // PayFast Transaction Return Listener
  const [payfastNotice, setPayfastNotice] = useState<{ status: 'success' | 'cancelled'; message: string } | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<any | null>(null);

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const pfStatus = urlParams.get('payfast_status');
      const pfPaymentId = urlParams.get('payment_id');

      if (pfStatus === 'success') {
        const storedEmail =
          localStorage.getItem('bizzbean_last_login_email') ||
          localStorage.getItem('bizzbean_sandbox_email') ||
          localStorage.getItem('bizz_user_email') ||
          'member@bizzbean.co.za';
        const storedName =
          localStorage.getItem('bizzbean_sandbox_name') ||
          resolveDisplayName(storedEmail) ||
          'Entrepreneur';

        if (pfPaymentId && pfPaymentId.startsWith('TOKEN_')) {
          const parts = pfPaymentId.split('_');
          const tokensToAdd = parseInt(parts[1], 10);
          if (!isNaN(tokensToAdd) && tokensToAdd > 0) {
            setTokenBalance((prev) => prev + tokensToAdd);
            recordTransactionToJournal({
              sku: 'bizztokens',
              productName: `BizzTokens Pack (${tokensToAdd} Tokens)`,
              productType: 'app',
              customer: storedName,
              customerEmail: storedEmail,
              country: 'South Africa',
              associate: 'PayFast Direct',
              grossSellingPriceZAR: tokensToAdd * 5,
              paymentRef: pfPaymentId,
            }).catch(() => {});
          }
          setPayfastNotice({
            status: 'success',
            message: `PayFast transaction completed successfully! Payment reference: ${pfPaymentId}. Your token balance has been updated.`,
          });
        } else if (pfPaymentId && pfPaymentId.startsWith('PROD_')) {
          const parts = pfPaymentId.split('_');
          const targetProdId = parts[1];
          if (targetProdId) {
            markProductPurchasedForUser(targetProdId);

            // Resolve live product details & pricing from CMS cache / defaults
            let matchedProd: any = null;
            try {
              const rawCached = localStorage.getItem(CMS_STORAGE_KEYS.PRODUCTS);
              const list = rawCached ? JSON.parse(rawCached) : INITIAL_CMS_PRODUCTS;
              if (Array.isArray(list)) {
                matchedProd = list.find(
                  (p: any) =>
                    p.id === targetProdId ||
                    (targetProdId === 'budget' && p.id === 'bizzbudget') ||
                    (targetProdId === 'bizzbudget' && p.id === 'budget')
                );
              }
            } catch {}

            const sellingPriceZAR = Number(matchedProd?.sellingPriceZAR ?? 229);
            const earnedTokens =
              matchedProd?.tokensAllocated !== undefined
                ? Number(matchedProd.tokensAllocated)
                : Math.round(sellingPriceZAR * 0.2 * 10) / 10;

            setTokenBalance((prev) => {
              const newBal = prev + earnedTokens;
              safeSaveStorage('bizzdesk_token_balance', newBal);
              return newBal;
            });

            const isCourse =
              matchedProd?.type === 'course' ||
              targetProdId.includes('course') ||
              targetProdId.includes('capital') ||
              targetProdId.includes('calculator') ||
              ['cost-recovery-calculator', 'learn-earn-capital', 'how-to-bizzcalc', 'profit-optimizer', 'financial-reports', 'your-first-hire'].includes(targetProdId);

            recordTransactionToJournal({
              sku: matchedProd?.sku || targetProdId,
              productName: matchedProd?.name || targetProdId.replace(/-/g, ' '),
              productType: isCourse ? 'course' : 'app',
              customer: storedName,
              customerEmail: storedEmail,
              country: 'South Africa',
              associate: 'PayFast Checkout',
              grossSellingPriceZAR: sellingPriceZAR,
              paymentRef: pfPaymentId,
            }).catch(() => {});

            setActiveSolutionId(targetProdId === 'budget' ? 'bizzbudget' : targetProdId);
            if (isCourse) {
              setActiveView('bizzclass');
            } else {
              setActiveView('active-app');
            }

            setPayfastNotice({
              status: 'success',
              message: `PayFast Payment Confirmed! You have successfully purchased "${matchedProd?.name || targetProdId.replace(/-/g, ' ')}". ${earnedTokens} BizzTokens have been credited & invoice posted to journal.`,
            });
          }
        } else {
          setPayfastNotice({
            status: 'success',
            message: `PayFast transaction completed successfully! Payment reference: ${pfPaymentId || 'Verified'}. Your account balance has been updated.`,
          });
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
  const [activeView, setActiveView] = useState<'flashcard' | 'active-app' | 'about' | 'footer' | 'workspace' | 'library' | 'ask-gemini' | 'admin-centre' | 'education-centre' | 'bizzclass' | 'platform-apps'>('flashcard');
  const [isMaximized, setIsMaximized] = useState<boolean>(true);
  const [isCalmSolutionsOpen, setIsCalmSolutionsOpen] = useState<boolean>(false);
  const [mobileCarouselIdx, setMobileCarouselIdx] = useState<number>(0);
  const mobileTouchStartXRef = useRef<number | null>(null);
  useEffect(() => {
    if (mobileActivePanel === 'solutions') setMobileCarouselIdx(1);
    else if (isMobileAppsDrawerOpen) setMobileCarouselIdx(4);
    else if (activeView === 'library') setMobileCarouselIdx(2);
    else if (activeView === 'ask-gemini') setMobileCarouselIdx(3);
    else if (activeSolutionId === 'videos') setMobileCarouselIdx(5);
    else if (activeSolutionId === 'articles') setMobileCarouselIdx(6);
    else if (activeView === 'bizzclass') setMobileCarouselIdx(7);
    else if (activeView === 'workspace') setMobileCarouselIdx(8);
    else if (activeView === 'footer') setMobileCarouselIdx(9);
    else if (activeView === 'about') setMobileCarouselIdx(10);
    else if (mobileActivePanel === 'workarea') setMobileCarouselIdx(0);
  }, [mobileActivePanel, activeView, activeSolutionId, isMobileAppsDrawerOpen]);
  const [purchasedNotice, setPurchasedNotice] = useState<{
    solutionName: string;
    tokensCredited: number;
    priceZAR: number;
    solutionId: string;
    isCourse: boolean;
  } | null>(null);

  // Quick Links / Pinboard Pinning (persisted across reloads) - Strictly courses & apps, never stages
  // Cleared previous items and set default 3 courses: learn how to earn access to capital, how to use bizzcalc, follow the money
  const DEFAULT_PINBOARD_COURSES = ['learn-earn-capital', 'how-to-bizzcalc', 'follow-the-money'];

  const [quickLinkIds, setQuickLinkIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bizzdesk_pinboard_items_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const stageSet = new Set(['vi-ability', 'fund-ability', 'sustain-ability', 'invest-ability', 'personal-sandbox', 'operations', 'growth', 'education']);
          const cleaned = Array.from(new Set(parsed)).filter((id) => typeof id === 'string' && !stageSet.has(id));
          if (cleaned.length > 0) return cleaned;
        }
      }
    } catch (e) {}
    return DEFAULT_PINBOARD_COURSES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('bizzdesk_pinboard_items_v2', JSON.stringify(quickLinkIds));
    } catch (e) {}
  }, [quickLinkIds]);

  // Dialogue & AI-LOOP state
  const [dialogueMessages, setDialogueMessages] = useState<DialogueMessage[]>(INITIAL_DIALOGUE_MESSAGES);

  // Library items state
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>(INITIAL_LIBRARY_ITEMS);

  // User Business Profile state with localStorage persistence (Defaulted to Quentin McCullough per pinboard.PNG)
  const [userProfile, setUserProfile] = useState<UserBusinessProfile>(() => {
    try {
      const saved = localStorage.getItem('bizzdesk_user_profile_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.companyName || parsed.founderName)) {
          return {
            websiteUrl: 'https://bizzbean.com',
            phone: '+27 82 555 0192',
            country: 'South Africa',
            city: 'Johannesburg',
            email: 'quentin@bizzbean.com',
            ...parsed,
            companyName: (parsed.companyName === 'Apex Cloud Dynamics' || !parsed.companyName)
              ? 'BizzBean Holdings (Pty) Ltd' 
              : parsed.companyName,
            founderName: parsed.founderName === 'Elena Vance' ? 'Quentin McCullough' : parsed.founderName,
          };
        }
      }
    } catch (e) {}
    return {
      companyName: 'BizzBean Holdings (Pty) Ltd',
      founderName: 'Quentin McCullough',
      email: 'quentin@bizzbean.com',
      phone: '+27 82 555 0192',
      country: 'South Africa',
      city: 'Johannesburg',
      industry: 'Enterprise Software',
      stage: 'fund-ABILITY',
      vision: 'Deliver enterprise AI data pipeline orchestration with institutional financial sustainability.',
      whatWeDo: 'We build high-availability telemetry pipelines for logistics scaleups, reducing data reconciliation costs by 45%.',
      uniqueValue: 'Proprietary edge connectors with guaranteed sub-10ms delivery SLAs.',
      targetMarket: 'Tier-2 Logistics Operators & Supply Chain Hubs',
      monthlyRevenue: 30000,
      burnRate: 12000,
      slug: 'bizzbean-holdings',
      websiteUrl: 'https://bizzbean.com',
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
  const [isClientProfileJournalOpen, setIsClientProfileJournalOpen] = useState<boolean>(false);
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
  const lastLocalPromoSyncRef = useRef<number>(0);

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
        setCmsProducts((prev) => mergeLoadedProducts(cleanLegacyProducts(idbProducts), prev));
      }
      if (idbArticles && Array.isArray(idbArticles) && idbArticles.length > 0) {
        const cleaned = cleanFallbackImagesFromArticles(idbArticles);
        setCmsArticles((prev) => mergeLoadedArticles(cleaned, prev));
      }
      if (idbPromos && Array.isArray(idbPromos) && idbPromos.length > 0) {
        const cleanedPromos = cleanLegacyViabilityPromotions(idbPromos);
        setCmsPromotions((prev) => mergeLoadedPromotions(cleanedPromos, prev));
      }
      if (idbVideos && Array.isArray(idbVideos) && idbVideos.length > 0) {
        setCmsVideos((prev) => mergeLoadedVideos(idbVideos, prev));
      }
      isHydrated.current = true;
    });

    // 2. Authoritative Firestore Cloud Hydration (persisted cloud/CMS edits override static defaults)
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
        setCmsVideos((prev) => {
          const merged = mergeLoadedVideos(prev, fsVideos);
          safeSaveStorage(CMS_STORAGE_KEYS.VIDEOS, merged);
          return merged;
        });
      }
    });

    fetchCmsArticlesFromFirestore().then((fsArticles) => {
      if (fsArticles && Array.isArray(fsArticles) && fsArticles.length > 0) {
        const cleaned = cleanFallbackImagesFromArticles(fsArticles);
        setCmsArticles((prev) => {
          const merged = mergeLoadedArticles(prev, cleaned);
          safeSaveStorage(CMS_STORAGE_KEYS.ARTICLES, merged);
          return merged;
        });
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
      if (Date.now() - lastLocalPromoSyncRef.current < 4000) return;
      if (updated && Array.isArray(updated) && updated.length > 0) {
        const cleaned = cleanLegacyViabilityPromotions(updated);
        setCmsPromotions((prev) => {
          const merged = mergeLoadedPromotions(cleaned, prev);
          safeSaveStorage(CMS_STORAGE_KEYS.PROMOTIONS, merged);
          return merged;
        });
      }
    });

    const unsubscribeVideos = subscribeToCmsVideos((updated) => {
      if (updated && Array.isArray(updated) && updated.length > 0) {
        setCmsVideos((prev) => {
          const merged = mergeLoadedVideos(updated, prev);
          safeSaveStorage(CMS_STORAGE_KEYS.VIDEOS, merged);
          return merged;
        });
      }
    });

    const unsubscribeArticles = subscribeToCmsArticles((updated) => {
      if (updated && Array.isArray(updated) && updated.length > 0) {
        const cleaned = cleanFallbackImagesFromArticles(updated);
        setCmsArticles((prev) => {
          const merged = mergeLoadedArticles(cleaned, prev);
          safeSaveStorage(CMS_STORAGE_KEYS.ARTICLES, merged);
          return merged;
        });
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribePromos();
      unsubscribeVideos();
      unsubscribeArticles();
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

  // Helper: Random sequence for door opening promotion (presents only active user-loaded images)
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

  const [showPromotion, setShowPromotion] = useState<boolean>(false);

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
      if (withImages.length === 0) {
        if (activePromotion !== null) setActivePromotion(null);
        if (showPromotion) setShowPromotion(false);
        return;
      }
      if (!activePromotion || !activePromotion.imageUrl || activePromotion.isActive === false) {
        const randomIndex = Math.floor(Math.random() * withImages.length);
        setActivePromotion(withImages[randomIndex]);
      } else {
        // Keep activePromotion copy and image synchronized with cmsPromotions updates
        const matching = cmsPromotions.find((p) => p.id === activePromotion.id);
        if (!matching || matching.isActive === false || !matching.imageUrl || matching.imageUrl.trim() === '') {
          // If the current promotion was turned off, deleted, or cleared, immediately switch
          const randomIndex = Math.floor(Math.random() * withImages.length);
          setActivePromotion(withImages[randomIndex]);
        } else {
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
  }, [cmsPromotions, activePromotion, showPromotion]);
  const [activeKbTab, setActiveKbTab] = useState<'search' | 'dialogue' | 'library'>('library');

  const [videoModalSolution, setVideoModalSolution] = useState<BizzSolution | null>(null);
  const [inspectedLibraryItem, setInspectedLibraryItem] = useState<LibraryItem | null>(null);

  // Helper to reliably find the active/first valid product in a given stage
  const resolveStageProduct = useCallback(
    (stageName: string, fallbackId: string) => {
      const deletedIds = getDeletedProductIds();
      const stageItems = (cmsProducts || [])
        .filter((p) => {
          if (stageName === 'personal-sandbox') {
            return p.stage !== 'operations-sandbox' && p.stage !== 'personal-sandbox';
          }
          return p.stage === stageName;
        })
        .filter(
          (p) =>
            !deletedIds.has(p.id) &&
            !deletedIds.has(getCanonicalCourseId(p.id) || '') &&
            !deletedIds.has(p.name?.toLowerCase().trim() || '')
        )
        .sort((a, b) => (a.seq || 0) - (b.seq || 0));

      if (stageItems.length > 0) {
        const found = stageItems.find(
          (p) =>
            p.id === fallbackId ||
            getCanonicalCourseId(p.id) === fallbackId ||
            (fallbackId === 'bizzbudget' && p.id === 'budget')
        );
        if (found) return found.id === 'budget' ? 'bizzbudget' : found.id;
        return stageItems[0].id === 'budget' ? 'bizzbudget' : stageItems[0].id;
      }
      return '';
    },
    [cmsProducts]
  );

  // Active solution data object: look up in cmsProducts first, then BIZZ_SOLUTIONS
  const activeSolution: BizzSolution = useMemo(() => {
    let effectiveSolId = activeSolutionId;
    if (effectiveSolId === 'vi-ability') effectiveSolId = resolveStageProduct('vi-ability', 'learn-earn-capital');
    else if (effectiveSolId === 'fund-ability') effectiveSolId = resolveStageProduct('fund-ability', 'cost-recovery-calculator');
    else if (effectiveSolId === 'sustain-ability') effectiveSolId = resolveStageProduct('sustain-ability', 'sustain-runway');
    else if (effectiveSolId === 'invest-ability') effectiveSolId = resolveStageProduct('invest-ability', 'invest-vdr');
    else if (effectiveSolId === 'personal-sandbox') effectiveSolId = resolveStageProduct('personal-sandbox', 'bizzcalc');
    else if (effectiveSolId === 'growth') effectiveSolId = resolveStageProduct('growth', 'growth-strategy');
    else if (effectiveSolId === 'operations') effectiveSolId = resolveStageProduct('operations', 'bizzmoney');

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

      const id = matchingCms.id || '';
      const canon = getCanonicalCourseId(id) || id;
      const effectiveIsPurchased =
        matchingCms.sellingPriceZAR === 0 ||
        ['learn-earn-capital', 'how-to-bizzcalc', 'follow-the-money'].includes(id) ||
        userPurchases.includes(id) ||
        userPurchases.includes(canon);

      return {
          id: matchingCms.id,
          category: (matchingCms.stage === 'operations' ? 'operations' : 'startup') as any,
          stage: matchingCms.stage as any,
          name: matchingCms.name,
          subtitle: matchingCms.subtitle || '',
          stageCode:
            matchingCms.stage === 'fund-ability'
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
          sellingPriceZAR: isViabilityCourse ? 0 : matchingCms.sellingPriceZAR,
          exclusivePriceZAR: isViabilityCourse ? 0 : matchingCms.exclusivePriceZAR,
          vatZAR: isViabilityCourse ? 0 : matchingCms.vatZAR,
          vatRate: 0.15,
          tokensAllocated: isViabilityCourse ? 0 : matchingCms.tokensAllocated,
          billingModel: matchingCms.billingModel,
          imageUrl: effectiveCover,
          explainerDuration: '3:00',
          isPurchased: effectiveIsPurchased,
          features: matchingCms.modules || matchingCms.lessonTitles || [],
        };
      }
      const isStageContainer = ['vi-ability', 'fund-ability', 'sustain-ability', 'invest-ability', 'personal-sandbox', 'operations', 'growth', 'operations-sandbox'].includes(activeSolutionId);
      if (!effectiveSolId && isStageContainer) {
        return {
          id: activeSolutionId,
          category: 'startup' as any,
          stage: activeSolutionId as any,
          name: `${activeSolutionId.replace('-', ' ')} (in preparation)`,
          subtitle: 'this stage is in preparation · allocate solutions via cms console',
          stageCode: activeSolutionId.toUpperCase(),
          description: 'No active solutions currently allocated to this stage.',
          purpose: 'No active solutions currently allocated to this stage.',
          priceUSD: 0,
          priceZAR: 0,
          sellingPriceZAR: 0,
          exclusivePriceZAR: 0,
          vatZAR: 0,
          vatRate: 0.15,
          tokensAllocated: 0,
          billingModel: 'once-off' as any,
          imageUrl: '',
          explainerDuration: '0:00',
          isPurchased: false,
          features: [],
        };
      }
      const foundBizzSol = BIZZ_SOLUTIONS.find(
        (s) =>
          s.id === effectiveSolId ||
          s.id === activeSolutionId ||
          (effectiveSolId === 'budget' && s.id === 'bizzbudget') ||
          (effectiveSolId === 'bizzbudget' && (s.id === 'bizzbudget' || s.id === 'budget'))
      ) || BIZZ_SOLUTIONS[0];

      const solId = foundBizzSol.id || '';
      const solCanon = getCanonicalCourseId(solId) || solId;
      const cmsOverride = (cmsProducts || []).find(
        (cp) => cp.id === solId || cp.id === solCanon || (cp.name && foundBizzSol.name && cp.name.toLowerCase().trim() === foundBizzSol.name.toLowerCase().trim())
      );
      const effectiveSelling = cmsOverride ? cmsOverride.sellingPriceZAR : foundBizzSol.priceZAR;
      const effectiveExclusive = cmsOverride?.exclusivePriceZAR ?? Math.round((effectiveSelling / 1.15) * 100) / 100;
      const effectiveVat = cmsOverride?.vatZAR ?? Math.round((effectiveSelling - effectiveExclusive) * 100) / 100;
      const effectiveTokens = cmsOverride?.tokensAllocated ?? foundBizzSol.tokensAllocated ?? Math.round(effectiveSelling * 0.20 * 10) / 10;

      const isOwned =
        effectiveSelling === 0 ||
        ['learn-earn-capital', 'vi-ability'].includes(solId) ||
        ['learn-earn-capital', 'vi-ability'].includes(solCanon) ||
        userPurchases.includes(solId) ||
        userPurchases.includes(solCanon);

      return {
        ...foundBizzSol,
        priceUSD: Math.round(effectiveSelling / 18.5),
        priceZAR: effectiveSelling,
        sellingPriceZAR: effectiveSelling,
        exclusivePriceZAR: effectiveExclusive,
        vatZAR: effectiveVat,
        tokensAllocated: effectiveTokens,
        isPurchased: isOwned,
      };
    }, [activeSolutionId, cmsProducts, userPurchases]);

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
    setActivePromotion(nextPromo);
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
      const deletedIds = getDeletedVideoIds();
      const cleaned = (updated || []).filter((v) => v && v.id && !deletedIds.has(v.id));
      setCmsVideos(cleaned);
      safeSaveStorage(CMS_STORAGE_KEYS.VIDEOS, cleaned);
      saveCmsVideosToFirestore(cleaned).catch((err) =>
        console.warn('Firestore CMS video sync note:', err)
      );
    }, 0);
  }, []);

  const handleSyncArticlesFromCms = useCallback((updated: CmsArticle[]) => {
    setTimeout(() => {
      const deletedIds = getDeletedArticleIds();
      const cleaned = cleanFallbackImagesFromArticles(updated).filter((a) => a && a.id && !deletedIds.has(a.id));
      setCmsArticles(cleaned);
      safeSaveStorage(CMS_STORAGE_KEYS.ARTICLES, cleaned);
      saveCmsArticlesToFirestore(cleaned).catch((err) =>
        console.warn('Firestore CMS article sync note:', err)
      );
    }, 0);
  }, []);

  const handleSyncPromotionsFromCms = useCallback((updated: CmsPromotionSection[]) => {
    lastLocalPromoSyncRef.current = Date.now();
    setTimeout(() => {
      lastLocalPromoSyncRef.current = Date.now();
      const cleaned = cleanLegacyViabilityPromotions(updated);
      setCmsPromotions((prev) => {
        const merged = mergeLoadedPromotions(cleaned, prev);
        safeSaveStorage(CMS_STORAGE_KEYS.PROMOTIONS, merged);
        return merged;
      });
    }, 0);
  }, []);

  // Door Enter Handler
  const handleEnterWorkspace = (
    asMember: boolean,
    email?: string,
    preSelectedPromo?: CmsPromotionSection | null,
    userName?: string
  ) => {
    setIsMember(asMember);
    try {
      localStorage.setItem('bizz_is_member', asMember ? 'true' : 'false');
    } catch (e) {}
    if (email) setUserEmail(email);
    if (userName) {
      setUserProfile((prev) => ({
        ...prev,
        founderName: userName,
        email: email || prev.email,
      }));
    } else if (email) {
      const resolved = resolveDisplayName(email);
      setUserProfile((prev) => ({
        ...prev,
        founderName: resolved,
        email: email,
      }));
    }

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

    const validPreSelected =
      preSelectedPromo &&
      preSelectedPromo.isActive !== false &&
      preSelectedPromo.imageUrl &&
      preSelectedPromo.imageUrl.trim() !== '' &&
      !preSelectedPromo.imageUrl.includes('1553877522-43269d4ea984')
        ? preSelectedPromo
        : null;
    const randomPromo = validPreSelected || getRandomActivePromotion(currentPromos);
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
    setIsMaximized(true);
    setIsCalmSolutionsOpen(false);
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
    setIsCalmSolutionsOpen(false);
    if (promo.targetType === 'solution') {
      const targetId = (promo.targetId === 'budget' || promo.targetId === 'bizzbudget') ? 'bizzbudget' : promo.targetId;
      handleSelectSolution(targetId);
    } else if (promo.targetType === 'knowledge-base') {
      if (promo.targetTab === 'search' || promo.targetId === 'ask-gemini') {
        setActiveView('ask-gemini');
        setActiveSolutionId('ask-gemini');
      } else {
        setActiveView('library');
        setActiveSolutionId('sandbox-library');
        setActiveKbTab('library');
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

    // CRITICAL: Any navigation from solutions panel or header MUST clear promotional billboard and route to work area!
    setShowPromotion(false);
    setIsCalmSolutionsOpen(false);
    setMobileActivePanel('workarea');

    if (targetId === 'talk-to-us' || targetId === 'dialogue') {
      handleOpenTalkToUs();
      return;
    }

    if (targetId === 'about-bizzbean' || targetId === 'about') {
      setActiveView('about');
      setActiveSolutionId('about-bizzbean');
      return;
    }

    if (targetId === 'website-footer' || targetId === 'footer') {
      setActiveView('footer');
      setActiveSolutionId('website-footer');
      return;
    }

    if (targetId === 'google-workspace' || targetId === 'workspace') {
      setActiveView('workspace');
      setActiveSolutionId('google-workspace');
      return;
    }

    if (targetId === 'cms' || targetId === 'cms-console') {
      setAdminInitialTab('cms-console');
      setActiveView('admin-centre');
      setActiveSolutionId('administration-centre');
      setMobileActivePanel('workarea');
      return;
    }

    if (targetId === 'administration-centre' || targetId === 'admin-centre') {
      setActiveView('admin-centre');
      setActiveSolutionId('administration-centre');
      setMobileActivePanel('workarea');
      return;
    }

    if (targetId === 'education-centre') {
      setActiveView('education-centre');
      setActiveSolutionId('education-centre');
      return;
    }

    if (targetId === 'library' || targetId === 'sandbox-library') {
      setActiveView('library');
      setActiveSolutionId('sandbox-library');
      return;
    }

    if (targetId === 'ask-gemini' || targetId === 'gemini') {
      setActiveView('ask-gemini');
      setActiveSolutionId('ask-gemini');
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

    if (targetId === 'bizzclass' || targetId === 'courses') {
      const targetCourse = resolveStageProduct('fund-ability', 'cost-recovery-calculator');
      setActiveSolutionId(targetCourse);
      setActiveView('bizzclass');
      return;
    }

    if (targetId === 'vi-ability') {
      const nextSol = resolveStageProduct('vi-ability', 'learn-earn-capital');
      setActiveStageId('vi-ability');
      setActiveSolutionId(nextSol);
      setActiveView('flashcard');
      return;
    } else if (targetId === 'fund-ability') {
      const nextSol = resolveStageProduct('fund-ability', 'cost-recovery-calculator');
      setActiveStageId('fund-ability');
      setActiveSolutionId(nextSol);
      setActiveView('flashcard');
      return;
    } else if (targetId === 'sustain-ability') {
      const nextSol = resolveStageProduct('sustain-ability', 'sustain-runway');
      setActiveStageId('sustain-ability');
      setActiveSolutionId(nextSol);
      setActiveView('flashcard');
      return;
    } else if (targetId === 'invest-ability') {
      const nextSol = resolveStageProduct('invest-ability', 'invest-vdr');
      setActiveStageId('invest-ability');
      setActiveSolutionId(nextSol);
      setActiveView('flashcard');
      return;
    } else if (targetId === 'personal-sandbox') {
      const nextSol = resolveStageProduct('personal-sandbox', 'bizzcalc');
      setActiveStageId('personal-sandbox');
      setActiveSolutionId(nextSol);
      setActiveView('flashcard');
      return;
    } else if (targetId === 'operations-sandbox') {
      const nextSol = resolveStageProduct('operations-sandbox', 'bizzdynamics');
      setActiveStageId('operations-sandbox');
      setActiveSolutionId(nextSol || 'bizzdynamics');
      setActiveView('flashcard');
      return;
    } else if (targetId === 'operations') {
      const nextSol = resolveStageProduct('operations', 'bizzmoney');
      setActiveStageId('operations');
      setActiveSolutionId(nextSol);
      setActiveView('flashcard');
      return;
    } else if (targetId === 'growth') {
      const nextSol = resolveStageProduct('growth', 'growth-strategy');
      setActiveStageId('growth');
      setActiveSolutionId(nextSol);
      setActiveView('flashcard');
      return;
    } else if (
      targetId === 'profit-optimizer' ||
      targetId === 'financial-scenario-planning' ||
      targetId === 'annual-business-planning-cycle'
    ) {
      // Explicit disambiguation: Sustain-ability stage master courses
      setActiveStageId((prevStage) => (prevStage === 'personal-sandbox' ? 'personal-sandbox' : 'sustain-ability'));
      setActiveSolutionId(targetId);
      setActiveView('flashcard');
      return;
    } else if (targetId === 'bizzoptimizer') {
      // Explicit disambiguation: bizzoptimizer belongs strictly to operations stage
      setActiveStageId((prevStage) => (prevStage === 'personal-sandbox' ? 'personal-sandbox' : 'operations'));
      setActiveSolutionId('bizzoptimizer');
      setActiveView('flashcard');
      return;
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
      setActiveView('flashcard');
      return;
    }
  };

  // Check whether a specific app or course is owned by the user (or free)
  const isAppOrSolutionOwned = useCallback(
    (targetId: string): boolean => {
      if (!targetId) return false;

      // Administrator has full administrative access to all apps and stages
      if (isAdmin) {
        return true;
      }

      // Staging operations sandbox is freely accessible for testing & development
      if (activeStageId === 'operations-sandbox') {
        return true;
      }

      const cleanId = targetId.toLowerCase().trim();
      const canonId = (getCanonicalCourseId(cleanId) || cleanId).toLowerCase().trim();

      // Free tier items
      const freeItems = ['learn-earn-capital', 'vi-ability', 'how-to-bizzcalc', 'follow-the-money'];
      if (freeItems.includes(cleanId) || freeItems.includes(canonId)) {
        return true;
      }

      // Check if CMS explicitly marks price as 0 and it's an educational course
      const matchingCms = (cmsProducts || []).find(
        (p) =>
          p.id === cleanId ||
          p.id === canonId ||
          (cleanId === 'budget' && p.id === 'bizzbudget') ||
          (cleanId === 'bizzbudget' && p.id === 'budget')
      );
      if (matchingCms && matchingCms.sellingPriceZAR === 0 && matchingCms.type === 'course') {
        return true;
      }

      // Strict ownership verification: must be present in userPurchases
      return (
        userPurchases.includes(cleanId) ||
        userPurchases.includes(canonId) ||
        (cleanId === 'budget' && userPurchases.includes('bizzbudget')) ||
        (cleanId === 'bizzbudget' && userPurchases.includes('budget'))
      );
    },
    [isAdmin, activeStageId, cmsProducts, userPurchases]
  );

  // Launch solution into Active Work Area (or BizzClass Suite for courses)
  // WorkArea strictly enforces ownership verification and presents a gentle nudge to buy if unowned
  const handleLaunchSolution = (solId?: string) => {
    const rawId = solId || activeSolutionId;
    const effectiveId = rawId === 'budget' ? 'bizzbudget' : rawId;
    setActiveSolutionId(effectiveId);
    setShowPromotion(false);
    setIsCalmSolutionsOpen(false);

    const matchingProd = (cmsProducts || []).find((p) => p.id === effectiveId || (effectiveId === 'bizzbudget' && p.id === 'budget'));
    const nameLower = (matchingProd?.name || effectiveId || '').toLowerCase();
    const isAppProduct =
      matchingProd?.type === 'app' ||
      nameLower.includes('bizzcalculators') ||
      nameLower.includes('bizzcalc') ||
      nameLower.includes('dynamics') ||
      nameLower.includes('bizzmodel') ||
      nameLower.includes('rolling') ||
      nameLower.includes('bizzmoney') ||
      nameLower.includes('bizzbudget') ||
      nameLower.includes('bizzplan') ||
      nameLower.includes('optimizer');
    const isCourse =
      !isAppProduct &&
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

  // Launch app directly from mobile navigator or header (WorkArea displays access lock & gentle nudge if unowned)
  const handleLaunchAppDirectly = (appId: string) => {
    setActiveSolutionId(appId === 'budget' ? 'bizzbudget' : appId);
    setShowPromotion(false);
    setIsCalmSolutionsOpen(false);
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

  // Reset pinboard to exact 3 default courses
  const handleResetPinboardDefault = () => {
    setQuickLinkIds(DEFAULT_PINBOARD_COURSES);
    safeSaveStorage('bizzdesk_pinboard_items_v2', DEFAULT_PINBOARD_COURSES);
  };

  // Clear all items from pinboard
  const handleClearPinboard = () => {
    setQuickLinkIds([]);
    safeSaveStorage('bizzdesk_pinboard_items_v2', []);
  };

  // Update client personal profile
  const handleUpdateUserProfile = (updated: UserBusinessProfile) => {
    setUserProfile(updated);
    safeSaveStorage('bizzdesk_user_profile_v1', updated);
  };

  // Instant Grant Handler (called when bypassing or granting offline in simulator)
  const handleInstantGrant = (sol: any) => {
    markProductPurchasedForUser(sol.id);
    const grossPrice = Number(sol.sellingPriceZAR ?? sol.priceZAR ?? 0);
    const earnedTokens =
      sol.tokensAllocated !== undefined
        ? Number(sol.tokensAllocated)
        : Math.round(grossPrice * 0.2 * 10) / 10;

    setTokenBalance((prev) => {
      const newBal = prev + earnedTokens;
      safeSaveStorage('bizzdesk_token_balance', newBal);
      return newBal;
    });

    const isCourse =
      sol.type === 'course' ||
      sol.category === 'education' ||
      sol.id.includes('course') ||
      sol.id.includes('capital') ||
      sol.id.includes('calculator') ||
      ['cost-recovery-calculator', 'learn-earn-capital', 'how-to-bizzcalc', 'profit-optimizer', 'financial-reports', 'your-first-hire', 'financial-scenario-planning', 'annual-business-planning-cycle'].includes(sol.id);

    const buyerEmail =
      userProfile?.email ||
      userEmail ||
      (typeof window !== 'undefined' ? localStorage.getItem('bizzbean_sandbox_email') || '' : '') ||
      'member@bizzbean.co.za';
    const buyerName = userProfile?.founderName || resolveDisplayName(buyerEmail) || 'Entrepreneur';

    recordTransactionToJournal({
      sku: sol.sku || sol.stageCode || sol.id,
      productName: sol.name,
      productType: isCourse ? 'course' : 'app',
      customer: buyerName,
      customerEmail: buyerEmail,
      country: userProfile?.country || 'South Africa',
      associate: 'Direct Online (Sandbox Grant)',
      grossSellingPriceZAR: grossPrice,
      paymentRef: `GRANT_${sol.id}_${Date.now()}`,
    }).catch(() => {});

    setPurchasedNotice({
      solutionName: sol.name,
      tokensCredited: earnedTokens,
      priceZAR: grossPrice,
      solutionId: sol.id,
      isCourse,
    });

    setActiveSolutionId(sol.id === 'budget' ? 'bizzbudget' : sol.id);
    if (isCourse) {
      setActiveView('bizzclass');
    } else {
      setActiveView('active-app');
    }
  };

  // Buy solution: Opens PayFast checkout modal if unowned, or launches if already owned
  const handleBuySolution = (sol: BizzSolution, targetView?: 'active-app' | 'flashcard') => {
    const id = sol.id || '';
    const canon = getCanonicalCourseId(id) || id;

    // Always resolve the freshest product data from cmsProducts so updated prices and details take effect immediately
    const matchingCms = (cmsProducts || []).find(
      (cp) => cp.id === id || cp.id === canon || (id === 'budget' && cp.id === 'bizzbudget') || (id === 'bizzbudget' && cp.id === 'budget') || (cp.name && sol.name && cp.name.toLowerCase().trim() === sol.name.toLowerCase().trim())
    );

    const effectiveSelling = matchingCms ? matchingCms.sellingPriceZAR : ((sol as any).sellingPriceZAR !== undefined ? (sol as any).sellingPriceZAR : (sol.priceZAR ?? 0));
    const effectiveExclusive = matchingCms?.exclusivePriceZAR ?? (sol as any).exclusivePriceZAR ?? Math.round((effectiveSelling / 1.15) * 100) / 100;
    const effectiveVat = matchingCms?.vatZAR ?? (sol as any).vatZAR ?? Math.round((effectiveSelling - effectiveExclusive) * 100) / 100;
    const effectiveTokens = matchingCms?.tokensAllocated ?? (sol as any).tokensAllocated ?? Math.round(effectiveSelling * 0.20 * 10) / 10;

    const enrichedSol: any = {
      ...sol,
      id: matchingCms?.id || id,
      name: matchingCms?.name || sol.name,
      subtitle: matchingCms?.subtitle || sol.subtitle,
      description: matchingCms?.description || sol.description,
      purpose: matchingCms?.purpose || sol.purpose,
      priceUSD: Math.round(effectiveSelling / 18.5),
      priceZAR: effectiveSelling,
      sellingPriceZAR: effectiveSelling,
      exclusivePriceZAR: effectiveExclusive,
      vatZAR: effectiveVat,
      tokensAllocated: effectiveTokens,
      isPurchased: false,
    };

    const isFreeCourse =
      ['learn-earn-capital', 'vi-ability'].includes(id) ||
      ['learn-earn-capital', 'vi-ability'].includes(canon) ||
      (effectiveSelling === 0 && (matchingCms?.type === 'course' || (sol as any).type === 'course'));

    const isOwned =
      isFreeCourse ||
      userPurchases.includes(id) ||
      userPurchases.includes(canon);

    if (isOwned) {
      setActiveSolutionId(sol.id === 'budget' ? 'bizzbudget' : sol.id);
      if (targetView) {
        setActiveView(targetView);
      }
      return;
    }

    // Open PayFast Product Checkout Modal with enriched live pricing
    setCheckoutProduct(enrichedSol);
  };

  // Dialogue messaging with GIM (AI-Driven Engagement Loop with Gemini Search Grounding)
  const handleSendMessage = async (text: string) => {
    const userMsg: DialogueMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDialogueMessages((prev) => [...prev, userMsg]);

    // Try live server-side Gemini Search grounding API
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: dialogueMessages.slice(-6),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.answer && typeof data.answer === 'string') {
          let sourceText = '';
          if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
            sourceText = `\n\n🔍 **Grounded Gemini Search Sources:**\n` + data.sources.map((s: string) => `• ${s}`).join('\n');
          }

          const gimLiveMsg: DialogueMessage = {
            id: `gim-${Date.now()}`,
            sender: 'gim',
            text: `${data.answer}${sourceText}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            pillar: text.toLowerCase().includes('cac') || text.toLowerCase().includes('runway') || text.toLowerCase().includes('model') ? 'financial_integration' : 'critical_thinking',
            actionPrompt: 'Continue Coach GIM dialogue',
          };
          setDialogueMessages((prev) => [...prev, gimLiveMsg]);
          return;
        }
      }
    } catch (e) {
      // Graceful fallback to Socratic guidance engine
    }

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

  const handleDownloadBook = useCallback(() => {
    downloadGettingToValueBook(userProfile.founderName || 'Entrepreneur');
    setBookNotice(`'Getting to Value' by Quentin G. McCullough downloaded successfully.`);
    setTimeout(() => setBookNotice(null), 5000);
  }, [userProfile.founderName]);

  // Unified Sign-Up handler: updates profile, persists member status, dispatches welcome email & displays Sandbox letter
  const handleConfirmSignUp = useCallback((name: string, email: string, company: string) => {
    const cleanName = (name || '').trim() || 'Entrepreneur';
    const cleanEmail = (email || '').trim();
    const cleanCompany = (company || '').trim();
    const firstName = cleanName.split(' ')[0] || 'Entrepreneur';

    setUserProfile((prev) => ({
      ...prev,
      founderName: cleanName,
      companyName: cleanCompany || (prev.companyName && prev.companyName !== 'Apex Cloud Dynamics' ? prev.companyName : 'BizzBean Holdings (Pty) Ltd'),
      email: cleanEmail || prev.email,
    }));
    if (cleanEmail) {
      setUserEmail(cleanEmail);
      try {
        localStorage.setItem('bizzbean_sandbox_email', cleanEmail);
        localStorage.setItem('bizzbean_sandbox_name', cleanName);
        localStorage.setItem(`bizzbean_registered_name_${cleanEmail.toLowerCase()}`, cleanName);
      } catch (e) {}

      upsertClientProfile({
        name: cleanName,
        email: cleanEmail,
        companyName: cleanCompany || 'Bizzbean Member Enterprise',
        country: 'South Africa',
        role: determineUserRole(cleanEmail),
        registeredAt: new Date().toISOString(),
        notes: 'Registered via Sandbox Sign-Up modal.',
      }).catch(() => {});
    }
    setIsMember(true);
    try {
      localStorage.setItem('bizz_is_member', 'true');
    } catch (e) {}

    if (cleanEmail) {
      sendWelcomeEmail({
        recipientEmail: cleanEmail,
        recipientName: cleanName,
        firstName,
        companyName: cleanCompany,
      }).then((res) => {
        if (res.success) {
          console.log(`[BizzBean] Welcome email successfully sent to ${cleanEmail}`);
        } else {
          console.warn(`[BizzBean] Welcome email warning: ${res.error}`);
        }
      }).catch((err) => {
        console.warn('[BizzBean] Welcome email error:', err);
      });
    }
  }, []);

  // Open 'About the Book' YouTube walkthrough review from CMS Console
  const handleOpenAboutBook = useCallback(() => {
    let videoUrl = 'https://youtu.be/QIMAmfoK6nk';
    try {
      const stored = localStorage.getItem('bizzdesk_cms_book_bundle_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.youtubeVideoUrl && parsed.youtubeVideoUrl.trim()) {
          videoUrl = parsed.youtubeVideoUrl.trim();
        }
      }
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // Unified layout behavior: allow BizzCalc to share identical responsive workstation layout with BizzDynamics
  const isStandaloneApp = false;

  return (
    <div className="fixed inset-0 h-screen h-[100dvh] w-full max-w-full overflow-hidden bg-[#FAF8F5] text-slate-800 font-sans flex flex-col">
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
          onConfirmSignUp={handleConfirmSignUp}
        />
      ) : (
        /* ========================================================================= */
        /* VIEW 2: THE bizz-DESK 3-PANEL WORKSTATION (ZERO VERTICAL SCROLL ON DESK)  */
        /* ========================================================================= */
        <div
          className={`h-full w-full max-w-full min-w-0 flex flex-col overflow-hidden transition-colors ${
            theme === 'dark' ? 'bg-[#0A0D14] text-[#E2E8F0]' : 'bg-architectural-grid text-slate-800'
          }`}
        >
          {/* Top Bar with Pinboard and Tokenomics (Hidden on mobile when an active app or BizzClass course suite is open) */}
          {!isStandaloneApp && (
            <div className={activeView === 'active-app' || activeView === 'bizzclass' ? 'hidden md:block shrink-0' : 'shrink-0'}>
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
                  setIsMaximized((prev) => !prev);
                  setSolutionsPanelMode('solutions');
                  setIsCalmSolutionsOpen(false);
                }}
                onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                onSignOut={handleSignOut}
                onOpenCmsConsole={() => setIsCmsConsoleOpen(true)}
                onToggleQuickLink={handleToggleQuickLink}
                onBuyTokens={() => setIsBuyTokensModalOpen(true)}
                onSelectLibrary={() => {
                  setActiveView('library');
                  setActiveSolutionId('sandbox-library');
                  setMobileActivePanel('workarea');
                  setIsCalmSolutionsOpen(false);
                }}
                onOpenTalkToUs={handleOpenTalkToUs}
                cmsProducts={cmsProducts}
                userPurchases={userPurchases}
                isAdmin={isAdmin}
                onBuySolution={handleBuySolution}
                onLaunchApp={handleLaunchAppDirectly}
                onLaunchSolution={handleLaunchSolution}
                onOpenClientProfileJournal={() => setIsClientProfileJournalOpen(true)}
                onResetPinboardDefault={handleResetPinboardDefault}
                onClearPinboard={handleClearPinboard}
              />
            </div>
          )}

          {/* The Workstation Area (Responsive 3-Panel on Desktop / Single Full-Width Panel on Mobile) */}
          <div className="flex-grow flex flex-col md:flex-row min-w-0 max-w-full overflow-hidden relative">
            {/* Panel 1: Solutions Navigation (Left) - Hidden when isMaximized for calm work focus */}
            {!isMaximized && (
              <div
                className={`shrink-0 ${
                  mobileActivePanel === 'solutions'
                    ? 'h-full flex w-full min-w-0 pb-14 md:pb-0'
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
                  cmsProducts={cmsProducts}
                  onSelectSolution={(solId) => handleSelectSolution(solId)}
                  onSelectAbout={() => handleSelectSolution('about-bizzbean')}
                  onSelectLibrary={() => handleSelectSolution('library')}
                  onOpenTalkToUs={handleOpenTalkToUs}
                  onSelectWorkspace={() => handleSelectSolution('google-workspace')}
                  onSelectFooter={() => handleSelectSolution('website-footer')}
                  onDownloadBook={handleDownloadBook}
                  onOpenAboutBook={handleOpenAboutBook}
                  onSelectAdminCentre={() => handleSelectSolution('administration-centre')}
                  onSelectEducationCentre={() => handleSelectSolution('education-centre')}
                  onSelectBizzClass={() => handleSelectSolution('bizzclass')}
                  onSelectCourse={(courseId) => {
                    handleSelectSolution(courseId);
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
              className={`flex-grow flex-col min-w-0 max-w-full overflow-hidden relative ${
                mobileActivePanel === 'workarea' ? 'flex w-full h-full pb-14 md:pb-0' : 'hidden md:flex'
              } md:my-2 lg:my-3 md:h-[calc(100%-1rem)] lg:h-[calc(100%-1.5rem)] border md:rounded-2xl shadow-xs ${
                isMaximized ? 'md:mx-3 lg:mx-6' : ''
              } ${
                theme === 'dark' ? 'bg-[#101424] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
              }`}
            >
              <ErrorBoundary
                fallbackTitle="Workstation Display Recovery"
                onReset={() => {
                  setShowPromotion(false);
                  setActiveView('flashcard');
                  setActiveStageId('vi-ability');
                  setActiveSolutionId('learn-earn-capital');
                }}
              >
                <WorkArea
                  activeSolution={activeSolution}
                  activeStageId={activeStageId}
                  activeView={activeView}
                  adminInitialTab={adminInitialTab}
                  isMember={isMember}
                  isAdmin={isAdmin}
                  userPurchases={userPurchases}
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
                  onConfirmSignUp={handleConfirmSignUp}
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
                  onBackToWorkstation={() => {
                    setShowPromotion(false);
                    setActiveView('flashcard');
                  }}
                  onOpenTalkToUs={handleOpenTalkToUs}
                />
              </ErrorBoundary>
            </main>

            {/* Panel 3: Knowledge Base & Library (Right) - Symmetrically aligned with Left-Hand Solutions Panel */}
            {!isMaximized && (
              <div
                className={`shrink-0 ${
                  mobileActivePanel === 'knowledge'
                    ? 'h-full flex w-full pb-14 md:pb-0'
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

            {/* ===================================================================== */}
            {/* CONTEXTUAL CALM SOLUTIONS EXPLORER DRAWER (Operative in Calm View)    */}
            {/* Keeps users inside Calm Mode rather than forcing 3-panel expansion    */}
            {/* ===================================================================== */}
            {isMaximized && isCalmSolutionsOpen && (
              <div
                className="hidden md:flex fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-[2px] items-end justify-center p-6 pb-20 animate-in fade-in duration-150"
                onClick={() => setIsCalmSolutionsOpen(false)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden font-mono ${
                    theme === 'dark'
                      ? 'bg-[#101424] border-[#252E4A] text-slate-200'
                      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-800'
                  }`}
                >
                  <div
                    className={`px-5 py-3.5 border-b flex items-center justify-between ${
                      theme === 'dark' ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#F4EFE6] border-[#E8E2D8]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2E5E88] dark:text-[#7EB2E2]">
                      <Layers className="h-4 w-4 text-[#5584B4]" />
                      <span>Solutions & Navigation Explorer</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCalmSolutionsOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                      aria-label="Close solutions explorer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 max-h-[65vh] overflow-y-auto text-xs">
                    {/* Column 1: Startup Stages (Growth Engine hidden until ready) */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                        Startup Stages
                      </div>
                      <div className="space-y-1">
                        {[
                          { id: 'vi-ability', label: '01. vi-ability' },
                          { id: 'fund-ability', label: '02. fund-ability' },
                          { id: 'sustain-ability', label: '03. sustain-ability' },
                          { id: 'invest-ability', label: '04. invest-ability' },
                          { id: 'personal-sandbox', label: '05. personal-sandbox' },
                        ].map((stage) => (
                          <button
                            key={stage.id}
                            type="button"
                            onClick={() => handleSelectSolution(stage.id)}
                            className={`w-full text-left px-3 py-2 rounded-xl border transition-colors lowercase cursor-pointer flex items-center justify-between ${
                              activeStageId === stage.id && activeView === 'flashcard'
                                ? 'bg-[#5584B4]/15 border-[#5584B4]/50 text-[#2E5E88] dark:text-[#7EB2E2] font-bold'
                                : theme === 'dark'
                                ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]/50 text-slate-300'
                                : 'bg-white border-[#E8E2D8] hover:border-[#5584B4]/50 text-slate-700'
                            }`}
                          >
                            <span>{stage.label}</span>
                            <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: Operations, Media & Academy */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                        Operations & Media
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => handleSelectSolution('operations')}
                          className={`w-full text-left px-3 py-2 rounded-xl border transition-colors lowercase cursor-pointer flex items-center justify-between ${
                            theme === 'dark'
                              ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]/50 text-slate-300'
                              : 'bg-white border-[#E8E2D8] hover:border-[#5584B4]/50 text-slate-700'
                          }`}
                        >
                          <span>operations suite</span>
                          <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectSolution('videos')}
                          className={`w-full text-left px-3 py-2 rounded-xl border transition-colors lowercase cursor-pointer flex items-center justify-between ${
                            theme === 'dark'
                              ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]/50 text-slate-300'
                              : 'bg-white border-[#E8E2D8] hover:border-[#5584B4]/50 text-slate-700'
                          }`}
                        >
                          <span>videos</span>
                          <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectSolution('articles')}
                          className={`w-full text-left px-3 py-2 rounded-xl border transition-colors lowercase cursor-pointer flex items-center justify-between ${
                            theme === 'dark'
                              ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]/50 text-slate-300'
                              : 'bg-white border-[#E8E2D8] hover:border-[#5584B4]/50 text-slate-700'
                          }`}
                        >
                          <span>articles</span>
                          <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectSolution('bizzclass')}
                          className={`w-full text-left px-3 py-2 rounded-xl border transition-colors lowercase cursor-pointer flex items-center justify-between ${
                            theme === 'dark'
                              ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]/50 text-slate-300'
                              : 'bg-white border-[#E8E2D8] hover:border-[#5584B4]/50 text-slate-700'
                          }`}
                        >
                          <span>bizzclass courses</span>
                          <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectSolution('platform-apps')}
                          className={`w-full text-left px-3 py-2 rounded-xl border transition-colors lowercase cursor-pointer flex items-center justify-between ${
                            theme === 'dark'
                              ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]/50 text-slate-300'
                              : 'bg-white border-[#E8E2D8] hover:border-[#5584B4]/50 text-slate-700'
                          }`}
                        >
                          <span>platform apps suite</span>
                          <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
                        </button>
                      </div>
                    </div>

                    {/* Column 3: Ecosystem, Workspace & Footer */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                        Workspace & Ecosystem
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => handleSelectSolution('google-workspace')}
                          className={`w-full text-left px-3 py-2 rounded-xl border transition-colors lowercase cursor-pointer flex items-center justify-between ${
                            theme === 'dark'
                              ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]/50 text-slate-300'
                              : 'bg-white border-[#E8E2D8] hover:border-[#5584B4]/50 text-slate-700'
                          }`}
                        >
                          <span>google workspace</span>
                          <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectSolution('website-footer')}
                          className={`w-full text-left px-3 py-2 rounded-xl border transition-colors lowercase cursor-pointer flex items-center justify-between ${
                            theme === 'dark'
                              ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]/50 text-slate-300'
                              : 'bg-white border-[#E8E2D8] hover:border-[#5584B4]/50 text-slate-700'
                          }`}
                        >
                          <span>website footer</span>
                          <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectSolution('about-bizzbean')}
                          className={`w-full text-left px-3 py-2 rounded-xl border transition-colors lowercase cursor-pointer flex items-center justify-between ${
                            theme === 'dark'
                              ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]/50 text-slate-300'
                              : 'bg-white border-[#E8E2D8] hover:border-[#5584B4]/50 text-slate-700'
                          }`}
                        >
                          <span>{isAdmin ? 'about bizzbean' : (userProfile.companyName ? `about ${userProfile.companyName}` : 'about bizzbean')}</span>
                          <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCalmSolutionsOpen(false);
                            handleDownloadBook();
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl border transition-colors lowercase cursor-pointer flex items-center justify-between ${
                            theme === 'dark'
                              ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]/50 text-slate-300'
                              : 'bg-white border-[#E8E2D8] hover:border-[#5584B4]/50 text-slate-700'
                          }`}
                        >
                          <span>download getting to value</span>
                          <BookOpen className="h-3.5 w-3.5 text-[#5584B4] shrink-0" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSelectSolution('administration-centre')}
                              className={`w-full text-left px-3 py-2 rounded-xl border transition-colors lowercase cursor-pointer flex items-center justify-between ${
                                theme === 'dark'
                                  ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]/50 text-slate-300'
                                  : 'bg-white border-[#E8E2D8] hover:border-[#5584B4]/50 text-slate-700'
                              }`}
                            >
                              <span>administration centre</span>
                              <span className="text-[10px] text-[#5584B4]">admin</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectSolution('operations-sandbox')}
                              className={`w-full text-left px-3 py-2 rounded-xl border transition-colors lowercase cursor-pointer flex items-center justify-between ${
                                theme === 'dark'
                                  ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]/50 text-slate-300'
                                  : 'bg-white border-[#E8E2D8] hover:border-[#5584B4]/50 text-slate-700'
                              }`}
                            >
                              <span>operations sandbox</span>
                              <span className="text-[10px] text-amber-500">staging</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* DESKTOP CALM QUICK-LINK FOOTER (Shown ONLY in Calm View on >= md)     */}
          {/* Auto-hides when 3-panel mode is active so nothing duplicates sidebars */}
          {/* ===================================================================== */}
          {!isStandaloneApp && isMaximized && (
            <footer
              aria-label="Desktop calm workspace navigation"
              className={`hidden md:flex shrink-0 border-t px-4 lg:px-8 py-2 items-center justify-around gap-2 backdrop-blur-md transition-colors ${
                theme === 'dark'
                  ? 'bg-[#101424]/95 border-[#252E4A] text-slate-200'
                  : 'bg-white/95 border-[#D8CEBC] text-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsCalmSolutionsOpen((prev) => !prev)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wide whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isCalmSolutionsOpen
                    ? 'text-[#2E5E88] dark:text-[#7EB2E2] bg-[#5584B4]/15 ring-1 ring-[#5584B4]/35'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-[#1A213B]'
                }`}
              >
                <Menu className="h-4 w-4 shrink-0" />
                <span>SOLUTIONS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCalmSolutionsOpen(false);
                  setShowPromotion(false);
                  setActiveView('flashcard');
                }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wide whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  !isCalmSolutionsOpen && (activeView === 'flashcard' || activeView === 'active-app')
                    ? 'text-[#2E5E88] dark:text-[#7EB2E2] bg-[#5584B4]/15 ring-1 ring-[#5584B4]/35'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-[#1A213B]'
                }`}
              >
                <Layers className="h-4 w-4 shrink-0" />
                <span>WORK AREA</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSolution('library')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wide whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  !isCalmSolutionsOpen && activeView === 'library'
                    ? 'text-[#2E5E88] dark:text-[#7EB2E2] bg-[#5584B4]/15 ring-1 ring-[#5584B4]/35'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-[#1A213B]'
                }`}
              >
                <Library className="h-4 w-4 shrink-0 text-[#5584B4]" />
                <span>LIBRARY</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSolution('ask-gemini')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wide whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  !isCalmSolutionsOpen && activeView === 'ask-gemini'
                    ? 'text-[#2E5E88] dark:text-[#7EB2E2] bg-[#5584B4]/15 ring-1 ring-[#5584B4]/35'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-[#1A213B]'
                }`}
              >
                <Sparkles className="h-4 w-4 shrink-0 text-[#5584B4]" />
                <span>ASK GEMINI</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSolution('bizzclass')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wide whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  !isCalmSolutionsOpen && activeView === 'bizzclass'
                    ? 'text-[#2E5E88] dark:text-[#7EB2E2] bg-[#5584B4]/15 ring-1 ring-[#5584B4]/35'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-[#1A213B]'
                }`}
              >
                <GraduationCap className="h-4 w-4 shrink-0 text-[#C59B63]" />
                <span>BIZZCLASS</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSolution('platform-apps')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wide whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  !isCalmSolutionsOpen && activeView === 'platform-apps'
                    ? 'text-[#2E5E88] dark:text-[#7EB2E2] bg-[#5584B4]/15 ring-1 ring-[#5584B4]/35'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-[#1A213B]'
                }`}
              >
                <Smartphone className="h-4 w-4 shrink-0 text-[#84CC16]" />
                <span>APPS</span>
              </button>
            </footer>
          )}

          {/* ===================================================================== */}
          {/* MOBILE SINGLE-ITEM CAROUSEL NAVIGATION CONTAINER (< md screens)       */}
          {/* Displays one centered menu item at a time with prev/next & swipe      */}
          {/* ===================================================================== */}
          {!isStandaloneApp && (() => {
            const mobileNavItems = [
              {
                id: 'workarea',
                label: 'WORK AREA',
                icon: Layers,
                active: mobileActivePanel === 'workarea' && ['flashcard', 'active-app'].includes(activeView),
                onClick: () => {
                  setMobileActivePanel('workarea');
                  if (!['flashcard', 'active-app'].includes(activeView)) {
                    setActiveView('flashcard');
                  }
                },
                accent: '',
              },
              {
                id: 'solutions',
                label: 'SOLUTIONS',
                icon: Menu,
                active: mobileActivePanel === 'solutions',
                onClick: () => {
                  setIsMaximized(false);
                  setMobileActivePanel('solutions');
                },
                accent: '',
              },
              {
                id: 'library',
                label: 'LIBRARY',
                icon: Library,
                active: mobileActivePanel === 'workarea' && activeView === 'library',
                onClick: () => handleSelectSolution('library'),
                accent: 'text-[#5584B4]',
              },
              {
                id: 'ask-gemini',
                label: 'ASK GEMINI',
                icon: Sparkles,
                active: mobileActivePanel === 'workarea' && activeView === 'ask-gemini',
                onClick: () => handleSelectSolution('ask-gemini'),
                accent: 'text-[#5584B4]',
              },
              {
                id: 'apps',
                label: 'APPS',
                icon: Smartphone,
                active: isMobileAppsDrawerOpen,
                onClick: () => setIsMobileAppsDrawerOpen(true),
                accent: 'text-[#84CC16]',
              },
              {
                id: 'videos',
                label: 'VIDEOS',
                icon: Video,
                active: mobileActivePanel === 'workarea' && activeSolutionId === 'videos',
                onClick: () => handleSelectSolution('videos'),
                accent: '',
              },
              {
                id: 'articles',
                label: 'ARTICLES',
                icon: FileText,
                active: mobileActivePanel === 'workarea' && activeSolutionId === 'articles',
                onClick: () => handleSelectSolution('articles'),
                accent: '',
              },
              {
                id: 'bizzclass',
                label: 'BIZZCLASS',
                icon: GraduationCap,
                active: mobileActivePanel === 'workarea' && activeView === 'bizzclass',
                onClick: () => handleSelectSolution('bizzclass'),
                accent: 'text-[#C59B63]',
              },
              {
                id: 'workspace',
                label: 'WORKSPACE',
                icon: Globe,
                active: mobileActivePanel === 'workarea' && activeView === 'workspace',
                onClick: () => handleSelectSolution('google-workspace'),
                accent: '',
              },
              {
                id: 'footer',
                label: 'FOOTER',
                icon: MessageSquare,
                active: mobileActivePanel === 'workarea' && activeView === 'footer',
                onClick: () => handleSelectSolution('website-footer'),
                accent: '',
              },
              {
                id: 'about',
                label: 'ABOUT',
                icon: Info,
                active: mobileActivePanel === 'workarea' && activeView === 'about',
                onClick: () => handleSelectSolution('about-bizzbean'),
                accent: '',
              },
              {
                id: 'tokens',
                label: 'TOKENS',
                icon: Coins,
                active: isBuyTokensModalOpen,
                onClick: () => setIsBuyTokensModalOpen(true),
                accent: 'text-[#E02475]',
              },
              {
                id: 'talk-to-us',
                label: 'TALK TO US',
                icon: Mail,
                active: isTalkToUsModalOpen || isNonMemberTalkToUsOpen,
                onClick: () => handleOpenTalkToUs(),
                accent: 'text-[#5584B4]',
              },
            ];
            const safeIdx = ((mobileCarouselIdx % mobileNavItems.length) + mobileNavItems.length) % mobileNavItems.length;
            const currentItem = mobileNavItems[safeIdx];
            const Icon = currentItem.icon;
            const stepPrev = () =>
              setMobileCarouselIdx((prev) => (prev - 1 + mobileNavItems.length) % mobileNavItems.length);
            const stepNext = () =>
              setMobileCarouselIdx((prev) => (prev + 1) % mobileNavItems.length);

            return (
              <nav
                aria-label="Mobile navigation carousel"
                onTouchStart={(e) => {
                  mobileTouchStartXRef.current = e.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(e) => {
                  if (mobileTouchStartXRef.current === null) return;
                  const delta = (e.changedTouches[0]?.clientX ?? 0) - mobileTouchStartXRef.current;
                  mobileTouchStartXRef.current = null;
                  if (Math.abs(delta) > 36) {
                    if (delta > 0) stepPrev();
                    else stepNext();
                  }
                }}
                className={`fixed bottom-0 left-0 right-0 z-40 md:hidden border-t flex items-center justify-between gap-2 px-2 py-1.5 select-none transition-colors backdrop-blur-md pb-[max(0.375rem,env(safe-area-inset-bottom))] ${
                  theme === 'dark'
                    ? 'bg-[#101424]/95 border-[#252E4A] shadow-[0_-4px_20px_rgba(0,0,0,0.5)] text-slate-100'
                    : 'bg-white/95 border-[#E8E2D8] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] text-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={stepPrev}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white shrink-0 cursor-pointer"
                  aria-label="Previous navigation item"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex-1 min-w-0 flex justify-center">
                  <button
                    type="button"
                    onClick={currentItem.onClick}
                    className={`max-w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer truncate ${
                      currentItem.active
                        ? 'text-[#2E5E88] dark:text-[#7EB2E2] bg-[#5584B4]/15 ring-1 ring-[#5584B4]/35'
                        : 'text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white bg-transparent border border-[#D8CEBC]/70 dark:border-[#252E4A]'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${currentItem.active ? '' : currentItem.accent}`} />
                    <span className="truncate">{currentItem.label}</span>
                    <span className="text-[9px] opacity-60 tabular-nums shrink-0">
                      {safeIdx + 1}/{mobileNavItems.length}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={stepNext}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white shrink-0 cursor-pointer"
                  aria-label="Next navigation item"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            );
          })()}

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
                      {(() => {
                        const bizzcalcCms = (cmsProducts || []).find((p) => p.id === 'bizzcalc');
                        const bizzcalcPrice = bizzcalcCms?.sellingPriceZAR ?? 229;
                        const isBizzcalcOwned = isAppOrSolutionOwned('bizzcalc');

                        return (
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
                                {isBizzcalcOwned ? (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30">
                                    owned · ready
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 font-bold border border-amber-500/30 flex items-center gap-0.5">
                                    <Lock className="h-2.5 w-2.5" /> R{bizzcalcPrice}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Cost Recovery & Break-Even Simulator
                              </p>
                            </div>
                            {isBizzcalcOwned ? (
                              <button
                                onClick={() => handleLaunchAppDirectly('bizzcalc')}
                                className="px-3 py-1.5 rounded-lg bg-[#5584B4] hover:bg-[#4372A2] text-white text-[11px] font-bold uppercase shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <Play className="h-3 w-3 fill-white" />
                                <span>Launch</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleLaunchAppDirectly('bizzcalc')}
                                className="px-3 py-1.5 rounded-lg bg-[#E02475] hover:bg-[#C91A63] text-white text-[11px] font-bold uppercase shrink-0 flex items-center gap-1 cursor-pointer shadow-sm"
                                title="Purchase bizzcalc to unlock"
                              >
                                <Lock className="h-3 w-3" />
                                <span>Buy R{bizzcalcPrice}</span>
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      {(() => {
                        const bizzcalculatorsCms = (cmsProducts || []).find((p) => p.id === 'bizzcalculators');
                        const bizzcalculatorsPrice = bizzcalculatorsCms?.sellingPriceZAR ?? 229;
                        const isBizzcalculatorsOwned = isAppOrSolutionOwned('bizzcalculators');

                        return (
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
                                {isBizzcalculatorsOwned ? (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30">
                                    owned · ready
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 font-bold border border-amber-500/30 flex items-center gap-0.5">
                                    <Lock className="h-2.5 w-2.5" /> R{bizzcalculatorsPrice}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                CAC:LTV & Working Capital Micro-Suite
                              </p>
                            </div>
                            {isBizzcalculatorsOwned ? (
                              <button
                                onClick={() => handleLaunchAppDirectly('bizzcalculators')}
                                className="px-3 py-1.5 rounded-lg bg-[#5584B4] hover:bg-[#4372A2] text-white text-[11px] font-bold uppercase shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <Play className="h-3 w-3 fill-white" />
                                <span>Launch</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleLaunchAppDirectly('bizzcalculators')}
                                className="px-3 py-1.5 rounded-lg bg-[#E02475] hover:bg-[#C91A63] text-white text-[11px] font-bold uppercase shrink-0 flex items-center gap-1 cursor-pointer shadow-sm"
                                title="Purchase bizzcalculators to unlock"
                              >
                                <Lock className="h-3 w-3" />
                                <span>Buy R{bizzcalculatorsPrice}</span>
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 2. Desktop-Only Notice */}
                  <div>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-2 flex items-start gap-2">
                      <Laptop className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
                        <strong>Laptop / Desktop Devices:</strong> bizzdynamics, bizzmodel, and bizzplan feature 36-month spreadsheet projections and 3-statement models designed for PC/laptop screens.
                      </p>
                    </div>

                    <div className="space-y-1.5 opacity-85">
                      {[
                        { id: 'bizzdynamics', name: 'bizzdynamics', desc: 'Operational Simulation Core' },
                        { id: 'bizzmodel', name: 'bizzmodel', desc: '3-Statement Financial Simulator' },
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
          onLaunchSolution={handleLaunchSolution}
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

      {/* PayFast Product Checkout Modal */}
      <ProductCheckoutModal
        isOpen={Boolean(checkoutProduct)}
        product={checkoutProduct}
        userProfile={{
          founderName: userProfile.founderName,
          email: userProfile.email || (typeof window !== 'undefined' ? localStorage.getItem('bizzbean_sandbox_email') || '' : '') || 'member@bizzbean.co.za',
          companyName: userProfile.companyName,
        }}
        theme={theme}
        onClose={() => setCheckoutProduct(null)}
        onInstantGrant={handleInstantGrant}
      />

      {/* Client Profile & Transaction Journal Modal (per pinboard.PNG request) */}
      <ClientProfileJournalModal
        isOpen={isClientProfileJournalOpen}
        onClose={() => setIsClientProfileJournalOpen(false)}
        theme={theme}
        userProfile={userProfile}
        userEmail={userEmail}
        onUpdateProfile={handleUpdateUserProfile}
      />

      {/* Sandbox Welcome Letter Modal (Per your sandbox is open.png) */}
      {showWelcomeLetter && (
        <SandboxWelcomeLetter
          recipientName={userProfile.founderName || 'Entrepreneur'}
          recipientEmail={userProfile.email || userEmail || (typeof window !== 'undefined' ? localStorage.getItem('bizzbean_sandbox_email') || '' : '')}
          onClose={() => setShowWelcomeLetter(false)}
          onDownloadBook={handleDownloadBook}
          onEnterSandbox={() => {
            setShowWelcomeLetter(false);
            handleSelectSolution('personal-sandbox');
          }}
        />
      )}

      {/* Book Download Notification Toast */}
      {bookNotice && (
        <div className="fixed bottom-6 left-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-4 rounded-2xl shadow-2xl border bg-emerald-950/90 border-emerald-500/40 text-emerald-100 backdrop-blur-md flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold">
              ✓
            </div>
            <div className="flex-1 text-xs font-mono font-medium">
              {bookNotice}
            </div>
            <button
              onClick={() => setBookNotice(null)}
              className="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
