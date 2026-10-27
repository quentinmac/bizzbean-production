import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Database,
  Layers,
  Video,
  FileText,
  BookOpen,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Save,
  CheckCircle2,
  Users,
  DollarSign,
  Mail,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Cpu,
  RefreshCw,
  Sparkles,
  Image as ImageIcon,
  Upload,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Coins,
  GraduationCap,
  ArrowUpDown,
  ListOrdered,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  GitBranch,
} from 'lucide-react';
import { CoaManagementView } from './coa/CoaManagementView';
import {
  generateCmsConsoleDataTs,
  downloadCmsDataFile,
  syncCmsDataToServer,
} from '../utils/cmsExportHelper';
import {
  CmsProduct,
  CmsCourseLesson,
  CmsVideo,
  CmsArticle,
  CmsBookBundle,
  INITIAL_CMS_PRODUCTS,
  INITIAL_CMS_VIDEOS,
  INITIAL_CMS_ARTICLES,
  INITIAL_CMS_BOOK_BUNDLE,
  INITIAL_CMS_INQUIRIES,
  INITIAL_CMS_ASSOCIATE_BATCHES,
  INITIAL_CMS_SPONSORS,
  INITIAL_CMS_TRANSACTIONS,
  INITIAL_CMS_POLICIES,
  INITIAL_CMS_TOOLTIPS,
  INITIAL_V1_TRANSACTIONS,
  TransactionRecord,
  CmsInquiry,
  CmsAssociateImport,
  CmsSponsorAccount,
  CmsTransactionRecord,
  CmsPolicyRegistryItem,
  CmsBizzyTooltip,
  CmsPromotionSection,
  INITIAL_CMS_PROMOTIONS,
} from '../data/cmsConsoleData';
import {
  compressImageFile,
  compressDataUrl,
  safeSaveStorage,
  cleanFallbackImagesFromArticles,
  cleanLegacyProducts,
  cleanLegacyViabilityPromotions,
  mergeLoadedPromotions,
  mergeLoadedProducts,
  mergeLoadedVideos,
  mergeLoadedArticles,
  markProductAsDeleted,
  unmarkProductAsDeleted,
  markPromotionAsDeleted,
  getDeletedPromotionIds,
  markVideoAsDeleted,
  unmarkVideoAsDeleted,
  getDeletedVideoIds,
  markArticleAsDeleted,
  unmarkArticleAsDeleted,
  getDeletedArticleIds,
  MASTER_COURSE_CURRICULA,
  findMasterCurriculum,
  getCanonicalCourseId,
  isBogusLessonUrl,
  CMS_STORAGE_KEYS,
  ensureFreshCmsCache,
} from '../utils/imageStorage';
import { isFirestoreQuotaExceeded } from '../lib/firebase';
import {
  saveCmsProductsToFirestore,
  saveCmsVideosToFirestore,
  saveCmsArticlesToFirestore,
  saveCmsPromotionsToFirestore,
  fetchCmsProductsFromFirestore,
  fetchCmsVideosFromFirestore,
  fetchCmsArticlesFromFirestore,
  fetchCmsPromotionsFromFirestore,
} from '../services/cmsFirestoreService';

interface CmsConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'products' | 'videos' | 'articles' | 'promotions' | 'book' | 'admin' | 'coa';
  cmsProducts?: CmsProduct[];
  cmsVideos?: CmsVideo[];
  cmsArticles?: CmsArticle[];
  cmsPromotions?: CmsPromotionSection[];
  onSyncProductsToWebsite: (products: CmsProduct[]) => void;
  onSyncVideosToWebsite?: (videos: CmsVideo[]) => void;
  onSyncArticlesToWebsite?: (articles: CmsArticle[]) => void;
  onSyncPromotionsToWebsite?: (promotions: CmsPromotionSection[]) => void;
}

export const CmsConsoleModal: React.FC<CmsConsoleModalProps> = ({
  isOpen,
  onClose,
  initialTab,
  cmsProducts,
  cmsVideos,
  cmsArticles,
  cmsPromotions,
  onSyncProductsToWebsite,
  onSyncVideosToWebsite,
  onSyncArticlesToWebsite,
  onSyncPromotionsToWebsite,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    'products' | 'videos' | 'articles' | 'promotions' | 'book' | 'admin' | 'coa'
  >(initialTab || 'products');

  const tabsNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Stage-Centric Master Matrix state
  const [products, setProducts] = useState<CmsProduct[]>(() => {
    if (cmsProducts && cmsProducts.length > 0) return cleanLegacyProducts(cmsProducts);
    try {
      const stored = localStorage.getItem(CMS_STORAGE_KEYS.PRODUCTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return cleanLegacyProducts(parsed);
      }
    } catch (e) {
      console.warn(e);
    }
    return cleanLegacyProducts(INITIAL_CMS_PRODUCTS);
  });

  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'app' | 'course'>('all');
  const [productsViewMode, setProductsViewMode] = useState<'matrix' | 'sequence'>('matrix');
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<CmsProduct | null>(null);

  // Other repositories state
  const [videos, setVideos] = useState<CmsVideo[]>(() => {
    const deleted = getDeletedVideoIds();
    const filterDeleted = (list: CmsVideo[]) => (list || []).filter((v) => v && v.id && !deleted.has(v.id));
    if (cmsVideos && cmsVideos.length > 0) return filterDeleted(cmsVideos);
    try {
      const stored = localStorage.getItem(CMS_STORAGE_KEYS.VIDEOS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return filterDeleted(parsed);
      }
    } catch (e) {
      console.warn(e);
    }
    return filterDeleted(INITIAL_CMS_VIDEOS);
  });

  useEffect(() => {
    if (cmsProducts && cmsProducts.length > 0) {
      setProducts(cleanLegacyProducts(cmsProducts));
    }
  }, [cmsProducts]);

  // On modal open, ensure we are synced with the authoritative Firestore database
  useEffect(() => {
    if (!isOpen) return;
    fetchCmsProductsFromFirestore().then((remote) => {
      if (remote && Array.isArray(remote) && remote.length > 0) {
        const cleaned = cleanLegacyProducts(remote);
        setProducts((prev) => {
          const merged = mergeLoadedProducts(cleaned, prev);
          dispatchSync(onSyncProductsToWebsite, merged);
          return merged;
        });
      }
    });

    fetchCmsVideosFromFirestore().then((remoteVideos) => {
      if (remoteVideos && Array.isArray(remoteVideos) && remoteVideos.length > 0) {
        const deleted = getDeletedVideoIds();
        const filtered = remoteVideos.filter((v) => v && v.id && !deleted.has(v.id));
        setVideos((prev) => {
          const merged = mergeLoadedVideos(filtered, prev);
          dispatchSync(onSyncVideosToWebsite, merged);
          return merged;
        });
      }
    });

    fetchCmsArticlesFromFirestore().then((remoteArticles) => {
      if (remoteArticles && Array.isArray(remoteArticles) && remoteArticles.length > 0) {
        const deleted = getDeletedArticleIds();
        const cleaned = cleanFallbackImagesFromArticles(remoteArticles).filter((a) => a && a.id && !deleted.has(a.id));
        setArticles((prev) => {
          const merged = mergeLoadedArticles(cleaned, prev);
          dispatchSync(onSyncArticlesToWebsite, merged);
          return merged;
        });
      }
    });
  }, [isOpen]);

  useEffect(() => {
    if (cmsVideos && Array.isArray(cmsVideos)) {
      const deleted = getDeletedVideoIds();
      setVideos(cmsVideos.filter((v) => v && v.id && !deleted.has(v.id)));
    }
  }, [cmsVideos]);

  // Articles state with localStorage fallback and active editing state (fallback images stripped)
  const [articles, setArticles] = useState<CmsArticle[]>(() => {
    const deleted = getDeletedArticleIds();
    const filterDeleted = (list: CmsArticle[]) =>
      cleanFallbackImagesFromArticles(list).filter((a) => a && a.id && !deleted.has(a.id));
    if (cmsArticles && cmsArticles.length > 0) return filterDeleted(cmsArticles);
    try {
      const stored = localStorage.getItem(CMS_STORAGE_KEYS.ARTICLES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return filterDeleted(parsed);
      }
    } catch (e) {
      console.warn(e);
    }
    return filterDeleted(INITIAL_CMS_ARTICLES);
  });

  const [editingArticle, setEditingArticle] = useState<CmsArticle | null>(null);
  const [isCompressingArticleImage, setIsCompressingArticleImage] = useState<boolean>(false);

  useEffect(() => {
    if (cmsArticles && Array.isArray(cmsArticles)) {
      const deleted = getDeletedArticleIds();
      setArticles(cleanFallbackImagesFromArticles(cmsArticles).filter((a) => a && a.id && !deleted.has(a.id)));
    }
  }, [cmsArticles]);

  // Promotional Hero Billboards state (13 sections)
  const [promotions, setPromotions] = useState<CmsPromotionSection[]>(() => {
    if (cmsPromotions && cmsPromotions.length > 0) {
      return cleanLegacyViabilityPromotions(cmsPromotions);
    }
    try {
      const stored = localStorage.getItem(CMS_STORAGE_KEYS.PROMOTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return cleanLegacyViabilityPromotions(parsed);
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return cleanLegacyViabilityPromotions(INITIAL_CMS_PROMOTIONS);
  });

  useEffect(() => {
    if (cmsPromotions && cmsPromotions.length > 0) {
      setPromotions((prev) => mergeLoadedPromotions(prev, cleanLegacyViabilityPromotions(cmsPromotions)));
    }
  }, [cmsPromotions]);
  const [bookBundle, setBookBundle] = useState<CmsBookBundle>(INITIAL_CMS_BOOK_BUNDLE);

  // Admin Centre state
  const [adminSubTab, setAdminSubTab] = useState<
    'inquiries' | 'associates' | 'sponsors' | 'transactions' | 'policies' | 'tooltips'
  >('inquiries');
  const [inquiries, setInquiries] = useState<CmsInquiry[]>(INITIAL_CMS_INQUIRIES);
  const [associateBatches] = useState<CmsAssociateImport[]>(INITIAL_CMS_ASSOCIATE_BATCHES);
  const [sponsors] = useState<CmsSponsorAccount[]>(INITIAL_CMS_SPONSORS);
  const [transactions] = useState<CmsTransactionRecord[]>(INITIAL_CMS_TRANSACTIONS);
  const [v1Transactions] = useState<TransactionRecord[]>(() => {
    try {
      const stored = localStorage.getItem('bizzdesk_v1_transactions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_V1_TRANSACTIONS;
  });
  const [policies] = useState<CmsPolicyRegistryItem[]>(INITIAL_CMS_POLICIES);
  const [tooltips] = useState<CmsBizzyTooltip[]>(INITIAL_CMS_TOOLTIPS);

  // Save notification & delete confirmation
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<CmsProduct | null>(null);
  const [promotionsSearch, setPromotionsSearch] = useState<string>('');

  // GitHub Export & Commit Reminder Modal State
  const [showGitHubModal, setShowGitHubModal] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishSuccessBanner, setPublishSuccessBanner] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState<boolean>(false);
  const [lastExportedTimestamp, setLastExportedTimestamp] = useState<string | null>(null);

  const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);
  };

  const handlePublishToLiveSite = async () => {
    setIsPublishing(true);
    setPublishSuccessBanner(null);
    try {
      // 1. Dual-storage local persistence (immediate - zero latency)
      safeSaveStorage(CMS_STORAGE_KEYS.PRODUCTS, products);
      safeSaveStorage(CMS_STORAGE_KEYS.VIDEOS, videos);
      safeSaveStorage(CMS_STORAGE_KEYS.ARTICLES, articles);
      safeSaveStorage(CMS_STORAGE_KEYS.PROMOTIONS, promotions);

      // 2. Update parent React state (immediate - zero latency)
      dispatchSync(onSyncProductsToWebsite, products);
      if (onSyncVideosToWebsite) dispatchSync(onSyncVideosToWebsite, videos);
      if (onSyncArticlesToWebsite) dispatchSync(onSyncArticlesToWebsite, articles);
      if (onSyncPromotionsToWebsite) dispatchSync(onSyncPromotionsToWebsite, promotions);

      const tsContent = generateCmsConsoleDataTs({
        products,
        promotions,
        videos,
        articles,
        bookBundle,
        inquiries,
        associateBatches,
        sponsors,
        transactions,
        v1Transactions,
        policies,
        tooltips,
      });

      // 3. Concurrently sync to Cloud Firestore and Server Disk with 7s max timeouts
      const p1 = withTimeout(saveCmsProductsToFirestore(products), 7000, false);
      const p2 = withTimeout(saveCmsVideosToFirestore(videos), 7000, false);
      const p3 = withTimeout(saveCmsArticlesToFirestore(articles), 7000, false);
      const p4 = withTimeout(saveCmsPromotionsToFirestore(promotions), 7000, false);
      const p5 = withTimeout(syncCmsDataToServer(tsContent), 7000, false);

      await Promise.allSettled([p1, p2, p3, p4, p5]);

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setPublishSuccessBanner(`Site Published Successfully at ${nowStr}! All updates have been synced to Cloud Firestore, the live server bundle, and the website.`);
      triggerSaveNotification(`Site published successfully! All content synced to Cloud Firestore and live website.`);
    } catch (err: any) {
      console.warn('Publish notice:', err);
      triggerSaveNotification('Site published! All content saved and synced to website.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleExportForGitHub = async () => {
    setIsExporting(true);
    try {
      const tsContent = generateCmsConsoleDataTs({
        products,
        promotions,
        videos,
        articles,
        bookBundle,
        inquiries,
        associateBatches,
        sponsors,
        transactions,
        v1Transactions,
        policies,
        tooltips,
      });

      // 1. Immediately trigger download of cmsConsoleData.ts to the user's computer
      downloadCmsDataFile(tsContent, 'cmsConsoleData.ts');

      // 2. Also asynchronously update server disk file at /src/data/cmsConsoleData.ts
      syncCmsDataToServer(tsContent).catch((err) => console.warn('Sync to local disk note:', err));

      // 3. Keep Cloud Firestore in sync across all collections
      saveCmsProductsToFirestore(products).catch(() => {});
      saveCmsVideosToFirestore(videos).catch(() => {});
      saveCmsArticlesToFirestore(articles).catch(() => {});
      saveCmsPromotionsToFirestore(promotions).catch(() => {});

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastExportedTimestamp(nowStr);
      setShowGitHubModal(true);
      triggerSaveNotification('Exported & Synced cmsConsoleData.ts! Live database and website updated.');
    } catch (err: any) {
      console.error('Export failed:', err);
      triggerSaveNotification('Export error: ' + (err?.message || 'Failed to generate file.'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadAgain = () => {
    try {
      const tsContent = generateCmsConsoleDataTs({
        products,
        promotions,
        videos,
        articles,
        bookBundle,
        inquiries,
        associateBatches,
        sponsors,
        transactions,
        v1Transactions,
        policies,
        tooltips,
      });
      downloadCmsDataFile(tsContent, 'cmsConsoleData.ts');
      triggerSaveNotification('Downloaded another copy of cmsConsoleData.ts.');
    } catch (err: any) {
      console.warn('Re-download failed:', err);
    }
  };

  const handleCopyFilePath = () => {
    navigator.clipboard.writeText('src/data/cmsConsoleData.ts');
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2500);
  };

  if (!isOpen) return null;

  // Filter and sort products for Master Matrix by sequence
  const filteredProducts = products
    .filter((p) => {
      const matchStage = selectedStageFilter === 'all' || p.stage === selectedStageFilter;
      const matchType = selectedTypeFilter === 'all' || p.type === selectedTypeFilter;
      const matchSearch =
        !matrixSearch ||
        p.name.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(matrixSearch.toLowerCase());
      return matchStage && matchType && matchSearch;
    })
    .sort((a, b) => (a.seq || 0) - (b.seq || 0));

  // Calculate top matrix metrics
  const stageSellingSum = filteredProducts.reduce((sum, p) => sum + p.sellingPriceZAR, 0);
  const stageTicketSum = filteredProducts.reduce((sum, p) => sum + p.ticketPriceZAR, 0);
  const stageTokensSum = filteredProducts.reduce((sum, p) => sum + p.tokensAllocated, 0);
  const stageAppsCount = filteredProducts.filter((p) => p.type === 'app').length;
  const stageCoursesCount = filteredProducts.filter((p) => p.type === 'course').length;

  const triggerSaveNotification = (msg: string) => {
    setSaveBanner(msg);
    setTimeout(() => setSaveBanner(null), 3500);
  };

  // Safe async dispatcher to prevent "Cannot update a component while rendering a different component"
  const dispatchSync = (fn?: (...args: any[]) => void, ...args: any[]) => {
    if (!fn) return;
    setTimeout(() => {
      fn(...args);
    }, 0);
  };

  // High-reliability Dual Storage + Firestore Sync Helpers
  const persistProducts = (updatedList: CmsProduct[]) => {
    setProducts(updatedList);
    dispatchSync(onSyncProductsToWebsite, updatedList);
    safeSaveStorage(CMS_STORAGE_KEYS.PRODUCTS, updatedList);
    saveCmsProductsToFirestore(updatedList).catch((err) =>
      console.warn('Firestore CMS product sync note:', err)
    );
  };

  const persistVideos = (updatedList: CmsVideo[]) => {
    const deleted = getDeletedVideoIds();
    const filtered = (updatedList || []).filter((v) => v && v.id && !deleted.has(v.id));
    setVideos(filtered);
    dispatchSync(onSyncVideosToWebsite, filtered);
    safeSaveStorage(CMS_STORAGE_KEYS.VIDEOS, filtered);
    saveCmsVideosToFirestore(filtered).catch((err) =>
      console.warn('Firestore CMS video sync note:', err)
    );
  };

  const persistArticles = (updatedList: CmsArticle[]) => {
    const deleted = getDeletedArticleIds();
    const filtered = cleanFallbackImagesFromArticles(updatedList).filter((a) => a && a.id && !deleted.has(a.id));
    const sorted = [...filtered].sort((a, b) => (a.seq || 0) - (b.seq || 0));
    sorted.forEach((a, idx) => {
      a.seq = idx + 1;
    });
    setArticles(sorted);
    dispatchSync(onSyncArticlesToWebsite, sorted);
    safeSaveStorage(CMS_STORAGE_KEYS.ARTICLES, sorted);
    saveCmsArticlesToFirestore(sorted).catch((err) =>
      console.warn('Firestore CMS article sync note:', err)
    );
  };

  const handleMoveArticle = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === articles.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const copy = [...articles];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    copy.forEach((art, idx) => {
      art.seq = idx + 1;
    });
    persistArticles(copy);
    triggerSaveNotification(`Moved article to position #${targetIndex + 1}.`);
  };

  const handleMoveArticleSequence = (articleId: string, targetSeq: number) => {
    const currentIdx = articles.findIndex((a) => a.id === articleId);
    if (currentIdx === -1) return;
    const boundedSeq = Math.max(1, Math.min(articles.length, targetSeq));
    const targetIdx = boundedSeq - 1;
    if (currentIdx === targetIdx) return;

    const copy = [...articles];
    const [moved] = copy.splice(currentIdx, 1);
    copy.splice(targetIdx, 0, moved);
    copy.forEach((art, idx) => {
      art.seq = idx + 1;
    });
    persistArticles(copy);
    triggerSaveNotification(`Updated position of "${moved.title}" to #${boundedSeq}.`);
  };

  const promoFirestoreTimerRef = useRef<NodeJS.Timeout | null>(null);

  const persistPromotions = (
    updatedList: CmsPromotionSection[],
    options?: { syncImmediateFirestore?: boolean; onSuccessMsg?: string }
  ) => {
    setPromotions(updatedList);
    dispatchSync(onSyncPromotionsToWebsite, updatedList);
    safeSaveStorage(CMS_STORAGE_KEYS.PROMOTIONS, updatedList);

    if (promoFirestoreTimerRef.current) {
      clearTimeout(promoFirestoreTimerRef.current);
    }

    if (options?.syncImmediateFirestore) {
      saveCmsPromotionsToFirestore(updatedList)
        .then((ok) => {
          if (ok && options.onSuccessMsg) {
            triggerSaveNotification(options.onSuccessMsg);
          }
        })
        .catch((err) => {
          console.warn('Firestore CMS promotion immediate sync note:', err);
        });
    } else {
      // Debounce auto-save to cloud so typing isn't interrupted and network isn't flooded
      promoFirestoreTimerRef.current = setTimeout(() => {
        saveCmsPromotionsToFirestore(updatedList).catch((err) =>
          console.warn('Firestore CMS promotion debounced sync note:', err)
        );
      }, 1000);
    }
  };

  // V1 Pricing Formula: Selling Price is the calculator base
  // VAT 15%: Exclusive = Selling / 1.15; VAT = Selling - Exclusive; Ticket = Selling * 1.20
  // Tokens = 20% of Selling Price (when Selling > 0), or custom overwritten (when Selling === 0)
  const calculatePricingFromSelling = (
    sellingInput: number,
    currentTokens?: number
  ) => {
    const selling = Math.max(0, Number(sellingInput) || 0);
    const exclusive = Math.round((selling / 1.15) * 100) / 100;
    const vat = Math.round((selling - exclusive) * 100) / 100;
    const ticket = Math.round((selling * 1.20) * 100) / 100;

    let tokens: number;
    if (selling === 0) {
      tokens = currentTokens !== undefined ? Math.max(0, Number(currentTokens) || 0) : 0;
    } else {
      tokens = Math.round(selling * 0.20 * 10) / 10;
    }

    return {
      exclusivePriceZAR: exclusive,
      vatZAR: vat,
      sellingPriceZAR: selling,
      tokensAllocated: tokens,
      ticketPriceZAR: ticket,
    };
  };

  const handleUpdateProductSellingPrice = (prodId: string, newSelling: number) => {
    const targetProd = products.find((p) => p.id === prodId);
    if (!targetProd) return;

    const pricing = calculatePricingFromSelling(
      newSelling,
      targetProd.tokensAllocated
    );

    const updatedList = products.map((p) =>
      p.id === prodId ? { ...p, ...pricing } : p
    );
    persistProducts(updatedList);
  };

  const handleUpdateProductTokens = (prodId: string, customTokens: number) => {
    const targetProd = products.find((p) => p.id === prodId);
    if (!targetProd) return;

    const val = Math.max(0, Number(customTokens) || 0);
    const updatedList = products.map((p) =>
      p.id === prodId ? { ...p, tokensAllocated: val } : p
    );
    persistProducts(updatedList);
  };

  const handleUpdateProductBillingModel = (
    prodId: string,
    billingModel: 'once-off' | 'monthly subscription'
  ) => {
    const updatedList = products.map((p) =>
      p.id === prodId ? { ...p, billingModel } : p
    );
    persistProducts(updatedList);
    triggerSaveNotification(`Updated "${prodId}" billing model to "${billingModel}".`);
  };

  const handleOpenEditProduct = (prod: CmsProduct) => {
    let lessons = prod.courseLessons;
    if (prod.type === 'course') {
      const master = findMasterCurriculum(prod.name || prod.id || '');
      if (!lessons || lessons.length === 0) {
        if (master && master.length > 0) {
          lessons = master.map((m) => ({ ...m }));
        } else if (prod.lessonTitles && prod.lessonTitles.length > 0) {
          lessons = (prod.lessonTitles || []).map((title, idx) => ({
            id: `cl-${prod.id}-${idx + 1}`,
            name: title,
            youtubeUrl: prod.youtubeDemoUrl || '',
            duration: '15:00',
          }));
        }
      } else {
        // Keep all user-created lessons, only clean bogus test URLs
        lessons = lessons.map((l, idx) => {
          if (isBogusLessonUrl(l.youtubeUrl)) {
            const fallbackUrl = master && master[idx] ? master[idx].youtubeUrl : '';
            return { ...l, youtubeUrl: fallbackUrl };
          }
          return { ...l };
        });
      }
    }
    const targetStage =
      prod.id === 'cost-recovery-calculator' && (prod.stage === 'vi-ability' || prod.stage === 'education')
        ? ('fund-ability' as const)
        : prod.stage || 'vi-ability';

    setEditingProduct({
      ...prod,
      stage: targetStage,
      billingModel: prod.billingModel || (prod.id === 'bizzmoney' ? 'monthly subscription' : 'once-off'),
      courseLessons: lessons ? lessons.map((l) => ({ ...l })) : [],
      syllabusLessonsCount: lessons && lessons.length > 0 ? lessons.length : (prod.syllabusLessonsCount || 0),
      lessonTitles: lessons && lessons.length > 0 ? lessons.map((l) => l.name) : (prod.lessonTitles || []),
      purpose: prod.purpose || prod.description || '',
    });
  };

  const handleOpenCreateProduct = (
    preferredType: 'app' | 'course' = 'app',
    explicitStage?: CmsProduct['stage']
  ) => {
    // Determine target stage based on explicit parameter, or currently selected filter, defaulting to 'vi-ability'
    const targetStage =
      explicitStage ||
      (selectedStageFilter !== 'all' ? (selectedStageFilter as CmsProduct['stage']) : 'vi-ability');
    const stageItems = products.filter((p) => p.stage === targetStage);
    const nextSeqInStage = stageItems.length + 1;
    const skuPrefix = preferredType === 'app' ? 'BA' : 'BC';
    const nextSkuNum = products.filter((p) => p.type === preferredType).length + 1;
    const suggestedSku = `${skuPrefix}-${String(nextSkuNum).padStart(3, '0')}`;

    const defaultPricing = calculatePricingFromSelling(229, 45.8);

    const newProd: CmsProduct = {
      id: `prod-${Date.now()}`,
      seq: nextSeqInStage,
      type: preferredType,
      stage: targetStage,
      sku: suggestedSku,
      name: preferredType === 'app' ? 'New Solution App' : 'New Masterclass Course',
      subtitle: 'Executive Suite & Practical Implementation',
      description: 'Comprehensive venture tool and framework.',
      purpose: 'Drive operational excellence and measurable validation outcomes.',
      billingModel: 'once-off',
      ...defaultPricing,
      isPurchased: true,
      activeInSync: true,
      canonicalCoverUrl: '',
      youtubeDemoUrl: '',
      coursePromoVideoUrl: '',
      courseLessons: preferredType === 'course' ? [
        {
          id: `lesson-${Date.now()}-1`,
          name: 'Lesson 01: Strategic Foundations & Core Theory',
          youtubeUrl: '',
          duration: '15:00',
        }
      ] : [],
      lessonTitles: preferredType === 'course' ? ['Lesson 01: Strategic Foundations & Core Theory'] : [],
      syllabusLessonsCount: preferredType === 'course' ? 1 : 0,
      companionMaterialFilename: '',
    };

    setEditingProduct(newProd);
  };

  const handleMoveProductSequence = (prodId: string, direction: 'up' | 'down') => {
    const targetProd = products.find((p) => p.id === prodId);
    if (!targetProd) return;

    // Get all products in the same stage, sorted by current sequence
    const stageProds = products
      .filter((p) => p.stage === targetProd.stage)
      .sort((a, b) => (a.seq || 0) - (b.seq || 0));

    if (stageProds.length <= 1) {
      // If single item in stage, adjust sequence number directly
      const currentSeq = targetProd.seq || 1;
      const nextSeq = direction === 'up' ? Math.max(1, currentSeq - 1) : currentSeq + 1;
      if (nextSeq === currentSeq) return;
      const updatedList = products.map((p) =>
        p.id === prodId ? { ...p, seq: nextSeq } : p
      );
      persistProducts(updatedList);
      triggerSaveNotification(`Updated sequence for "${targetProd.name}" to #${nextSeq} in ${targetProd.stage}.`);
      return;
    }

    const currentIndex = stageProds.findIndex((p) => p.id === prodId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= stageProds.length) return;

    // Swap positions in the stage array
    const reorderedStage = [...stageProds];
    const temp = reorderedStage[currentIndex];
    reorderedStage[currentIndex] = reorderedStage[targetIndex];
    reorderedStage[targetIndex] = temp;

    // Reassign clean sequence numbers 1, 2, 3... to this stage
    const updatedStageMap = new Map<string, number>();
    reorderedStage.forEach((p, idx) => {
      updatedStageMap.set(p.id, idx + 1);
    });

    const updatedList = products.map((p) => {
      if (updatedStageMap.has(p.id)) {
        return { ...p, seq: updatedStageMap.get(p.id)! };
      }
      return p;
    });

    persistProducts(updatedList);
    const newPos = updatedStageMap.get(targetProd.id);
    triggerSaveNotification(`Moved "${targetProd.name}" ${direction} in presentation sequence (now #${newPos} in ${targetProd.stage}).`);
  };

  const handleUpdateProductSeq = (prodId: string, newSeq: number) => {
    const targetProd = products.find((p) => p.id === prodId);
    if (!targetProd) return;
    const stageProds = products
      .filter((p) => p.stage === targetProd.stage)
      .sort((a, b) => (a.seq || 0) - (b.seq || 0));

    const parsedSeq = Math.max(1, Math.round(Number(newSeq)) || 1);

    // If there is only 1 product in this stage, directly update its sequence number
    if (stageProds.length <= 1) {
      const updatedList = products.map((p) =>
        p.id === prodId ? { ...p, seq: parsedSeq } : p
      );
      persistProducts(updatedList);
      triggerSaveNotification(`Updated sequence for "${targetProd.name}" to #${parsedSeq} in ${targetProd.stage}.`);
      return;
    }

    const currentIndex = stageProds.findIndex((p) => p.id === prodId);
    if (currentIndex === -1) return;

    // Remove from current position and insert at new requested position
    const reordered = stageProds.filter((p) => p.id !== prodId);
    const clampedTargetIdx = Math.max(0, Math.min(reordered.length, parsedSeq - 1));
    reordered.splice(clampedTargetIdx, 0, targetProd);

    const updatedStageMap = new Map<string, number>();
    reordered.forEach((p, idx) => {
      updatedStageMap.set(p.id, idx + 1);
    });

    const updatedList = products.map((p) => {
      if (updatedStageMap.has(p.id)) {
        return { ...p, seq: updatedStageMap.get(p.id)! };
      }
      return p;
    });

    persistProducts(updatedList);
    const newPos = updatedStageMap.get(targetProd.id);
    triggerSaveNotification(`Updated presentation sequence for "${targetProd.name}" to #${newPos} in ${targetProd.stage}.`);
  };

  const handleConfirmDeleteProduct = (prodId: string) => {
    const target = products.find((p) => p.id === prodId);
    if (!target) return;
    const targetStage = target.stage;
    markProductAsDeleted(prodId);

    const remaining = products.filter((p) => p.id !== prodId);

    // Cleanly re-sequence remaining products in that stage
    const stageRemaining = remaining
      .filter((p) => p.stage === targetStage)
      .sort((a, b) => (a.seq || 0) - (b.seq || 0));
    const seqMap = new Map<string, number>();
    stageRemaining.forEach((p, idx) => seqMap.set(p.id, idx + 1));

    const updatedList = remaining.map((p) => {
      if (seqMap.has(p.id)) {
        return { ...p, seq: seqMap.get(p.id)! };
      }
      return p;
    });

    const cleaned = cleanLegacyProducts(updatedList);
    persistProducts(cleaned);
    setProductToDelete(null);
    if (editingProduct?.id === prodId) {
      setEditingProduct(null);
    }
    triggerSaveNotification(`Deleted "${target.name || prodId}" from CMS and live site.`);
  };

  const handleReloadMasterCurriculum = () => {
    if (!editingProduct) return;
    const master = findMasterCurriculum(editingProduct.name || editingProduct.id || '');
    if (!master || master.length === 0) {
      triggerSaveNotification(`No official curriculum template found for "${editingProduct.name}".`);
      return;
    }
    const cloned = master.map((l) => ({ ...l }));
    setEditingProduct({
      ...editingProduct,
      courseLessons: cloned,
      syllabusLessonsCount: cloned.length,
      lessonTitles: cloned.map((l) => l.name),
    });
    triggerSaveNotification(`Loaded ${cloned.length} official curriculum lessons for "${editingProduct.name}". Click "Save & Sync into Live Site" to persist.`);
  };

  const handleAddCourseLesson = () => {
    if (!editingProduct) return;
    const currentLessons = editingProduct.courseLessons || [];
    const newNum = currentLessons.length + 1;
    const newLesson: CmsCourseLesson = {
      id: `lesson-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `Lesson ${String(newNum).padStart(2, '0')}: New Lesson Title`,
      youtubeUrl: '',
      duration: '15:00',
    };
    const updatedLessons = [...currentLessons, newLesson];
    setEditingProduct({
      ...editingProduct,
      courseLessons: updatedLessons,
      syllabusLessonsCount: updatedLessons.length,
      lessonTitles: updatedLessons.map((l) => l.name),
    });
  };

  const handleUpdateCourseLesson = (
    lessonId: string,
    field: keyof CmsCourseLesson,
    value: string
  ) => {
    if (!editingProduct) return;
    const currentLessons = editingProduct.courseLessons || [];
    const updatedLessons = currentLessons.map((l) =>
      l.id === lessonId ? { ...l, [field]: value } : l
    );
    setEditingProduct({
      ...editingProduct,
      courseLessons: updatedLessons,
      lessonTitles: updatedLessons.map((l) => l.name),
    });
  };

  const handleDeleteCourseLesson = (lessonId: string) => {
    if (!editingProduct) return;
    const currentLessons = editingProduct.courseLessons || [];
    const updatedLessons = currentLessons.filter((l) => l.id !== lessonId);
    setEditingProduct({
      ...editingProduct,
      courseLessons: updatedLessons,
      syllabusLessonsCount: updatedLessons.length,
      lessonTitles: updatedLessons.map((l) => l.name),
    });
  };

  const handleMoveCourseLesson = (index: number, direction: 'up' | 'down') => {
    if (!editingProduct) return;
    const currentLessons = [...(editingProduct.courseLessons || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentLessons.length) return;
    const temp = currentLessons[index];
    currentLessons[index] = currentLessons[targetIndex];
    currentLessons[targetIndex] = temp;
    setEditingProduct({
      ...editingProduct,
      courseLessons: currentLessons,
      lessonTitles: currentLessons.map((l) => l.name),
    });
  };

  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Apply V1 Pricing formula where selling price is calculator base
    const pricing = calculatePricingFromSelling(
      editingProduct.sellingPriceZAR,
      editingProduct.tokensAllocated
    );

    const lessons = editingProduct.courseLessons || [];
    const isNew = !products.some((p) => p.id === editingProduct.id);
    let targetStage = editingProduct.stage || 'vi-ability';
    if (['profit-optimizer', 'financial-scenario-planning', 'annual-business-planning-cycle'].includes(editingProduct.id)) {
      targetStage = 'sustain-ability';
    }

    const stageItems = products
      .filter((p) => p.stage === targetStage && p.id !== editingProduct.id)
      .sort((a, b) => (a.seq || 0) - (b.seq || 0));

    let finalSeq = Math.max(1, Math.round(Number(editingProduct.seq)) || 1);
    if (isNew && (!editingProduct.seq || editingProduct.seq > stageItems.length + 1)) {
      finalSeq = stageItems.length + 1;
    }

    const updatedObj: CmsProduct = {
      ...editingProduct,
      stage: targetStage,
      seq: finalSeq,
      ...pricing,
      billingModel:
        editingProduct.billingModel ||
        (editingProduct.id === 'bizzmoney' ? 'monthly subscription' : 'once-off'),
      courseLessons: lessons.map((l) => ({ ...l })),
      syllabusLessonsCount: lessons.length > 0 ? lessons.length : (editingProduct.syllabusLessonsCount || 0),
      lessonTitles: lessons.length > 0 ? lessons.map((l) => l.name) : (editingProduct.lessonTitles || []),
      coursePromoVideoUrl: editingProduct.coursePromoVideoUrl || editingProduct.youtubeDemoUrl,
      youtubeDemoUrl: editingProduct.youtubeDemoUrl || editingProduct.coursePromoVideoUrl,
    };

    // If this is a course, resolve canonical course ID so routing, BizzClass and lessons work seamlessly
    let canonCourseId: string | null = null;
    if (updatedObj.type === 'course') {
      canonCourseId = getCanonicalCourseId(updatedObj.id) || getCanonicalCourseId(updatedObj.name);
      if (canonCourseId) {
        updatedObj.id = canonCourseId;
      }
    }

    // CRITICAL: Unmark from deleted IDs FIRST, before any persist or sync operations!
    unmarkProductAsDeleted(updatedObj.id, updatedObj.name);
    if (canonCourseId) {
      unmarkProductAsDeleted(canonCourseId);
    }

    let updatedList: CmsProduct[];
    // Check if an item with this ID or canonical ID already exists in the list
    const matchIdx = products.findIndex(
      (p) =>
        p.id === updatedObj.id ||
        (canonCourseId &&
          p.type === 'course' &&
          (getCanonicalCourseId(p.id) || getCanonicalCourseId(p.name)) === canonCourseId)
    );

    if (matchIdx !== -1) {
      updatedList = products.map((p, idx) => (idx === matchIdx ? updatedObj : p));
    } else {
      updatedList = [...products, updatedObj];
    }

    // Re-sequence items in this stage cleanly so there are no collisions
    const currentStageAll = updatedList
      .filter((p) => p.stage === targetStage)
      .sort((a, b) => (a.seq || 0) - (b.seq || 0));
    if (currentStageAll.length > 1) {
      const seqMap = new Map<string, number>();
      currentStageAll.forEach((p, idx) => seqMap.set(p.id, idx + 1));
      updatedList = updatedList.map((p) => {
        if (seqMap.has(p.id)) {
          return { ...p, seq: seqMap.get(p.id)! };
        }
        return p;
      });
    }

    persistProducts(updatedList);
    setEditingProduct(null);
    triggerSaveNotification(
      isNew
        ? `Added ${updatedObj.type === 'course' ? 'Masterclass Course' : 'Solution App'} "${updatedObj.name}" to live site (Stage: ${updatedObj.stage}, #${updatedObj.seq}).`
        : `Synced "${updatedObj.name}" to live website & Firestore.`
    );
  };

  // Direct image upload & immediate auto-save for products
  const handleDirectUploadProductImage = async (productId: string, file: File) => {
    try {
      const compressed = await compressImageFile(file, 800, 500, 0.65);
      const updatedList = products.map((p) =>
        p.id === productId ? { ...p, canonicalCoverUrl: compressed } : p
      );
      persistProducts(updatedList);
      if (editingProduct && editingProduct.id === productId) {
        setEditingProduct({ ...editingProduct, canonicalCoverUrl: compressed });
      }
      const target = products.find((p) => p.id === productId);
      triggerSaveNotification(`Uploaded & saved cover image for "${target?.name || productId}".`);
    } catch (err) {
      console.warn('Direct upload product image failed:', err);
    }
  };

  // Promotional Hero Billboards & Stage Story Message Boards handlers (Immediate auto-save & sync)
  const handleUpdatePromoField = (promoId: string, updates: Partial<CmsPromotionSection>) => {
    const updated = promotions.map((p) => (p.id === promoId ? { ...p, ...updates } : p));
    persistPromotions(updated);
  };

  const handleUpdatePromoStageStory = (
    promoId: string,
    field: keyof NonNullable<CmsPromotionSection['stageStory']>,
    value: string
  ) => {
    const updated = promotions.map((p) => {
      if (p.id !== promoId) return p;
      const currentStory = p.stageStory || {};
      return {
        ...p,
        stageStory: {
          ...currentStory,
          [field]: value,
        },
      };
    });
    persistPromotions(updated);
  };

  const handleSaveSinglePromo = (promo: CmsPromotionSection) => {
    const updated = promotions.map((p) => (p.id === promo.id ? promo : p));
    persistPromotions(updated, {
      syncImmediateFirestore: true,
      onSuccessMsg: `Saved & cloud-synced stage copy and image for "${promo.displayName || promo.name}".`,
    });
  };

  const handleCreatePromotion = () => {
    const num = promotions.length + 1;
    const newId = `stage-story-${Date.now()}`;
    const newPromo: CmsPromotionSection = {
      id: newId,
      name: `custom-stage-${num}`,
      displayName: `stage 0${num > 9 ? num : '0' + num} · custom stage story`,
      tagline: 'verify key business fundamentals and strategic growth milestones.',
      targetType: 'solution',
      targetId: 'fund-ability',
      buttonText: 'explore stage',
      imageUrl: '',
      isActive: true,
      stageStory: {
        narrative: 'Explain the complete founder story, strategic focus, and commercial purpose of this stage here.',
        stageChallenge: 'Primary bottleneck, operational friction, or founder blindspot addressed in this stage.',
        milestone: 'Measurable metric, CAC payback, or diligence standard required to advance.',
        keyDeliverable: 'Specific institutional model, audit report, or deliverable asset created.',
      },
    };
    const updated = [newPromo, ...promotions];
    setPromotions(updated);
    dispatchSync(onSyncPromotionsToWebsite, updated);
    safeSaveStorage(CMS_STORAGE_KEYS.PROMOTIONS, updated);
    triggerSaveNotification(`Created new stage message board: "${newPromo.displayName}"!`);
  };

  const handleDeletePromotion = (promoId: string) => {
    markPromotionAsDeleted(promoId);
    const target = promotions.find((p) => p.id === promoId);
    const updated = promotions.filter(
      (p) =>
        p.id !== promoId &&
        p.id !== 'search' &&
        p.name !== 'search' &&
        !(p.displayName && p.displayName.toLowerCase().includes('gemini search'))
    );
    persistPromotions(updated, { syncImmediateFirestore: true });
    triggerSaveNotification(`Deleted message board "${target?.displayName || promoId}".`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-7xl h-[95vh] rounded-3xl border border-[#2B3452] bg-[#0E1220] text-slate-100 flex flex-col overflow-hidden shadow-2xl">
        
        {/* Top Console Bar */}
        <div className="p-4 sm:px-6 border-b border-[#222F4C] bg-[#141A2E] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#5584B4] text-white flex items-center justify-center font-bold font-mono text-sm shadow-sm">
              CMS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase font-mono">
                  CMS CONSOLE
                </h1>
                {isFirestoreQuotaExceeded() ? (
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                    title="Daily Firestore cloud quota reached. Local dual-storage is active and authoritative."
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Local Storage Authoritative (Cloud Offline)
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Firebase Firestore Realtime Live
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                unified contact & stage-centric content management · changes update live without re-publishing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary 1-Click Publish to Live Website & Cloud Firestore */}
            <button
              onClick={handlePublishToLiveSite}
              disabled={isPublishing}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-xs font-bold shadow-md hover:shadow-blue-500/30 transition-all flex items-center gap-1.5 border border-blue-400/50 active:scale-95 cursor-pointer ring-1 ring-blue-400/40"
              title="Publish all updated content immediately to the live website, Cloud Firestore database, and bundle"
            >
              {isPublishing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 text-white" />
                  <span>Publish to Live Site</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportForGitHub}
              disabled={isExporting}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold shadow-md hover:shadow-emerald-500/25 transition-all flex items-center gap-1.5 border border-emerald-400/40 active:scale-95 cursor-pointer"
              title="Export all CMS data (images, pricing, content) into cmsConsoleData.ts for GitHub and sync to cloud"
            >
              <Download className="h-4 w-4 text-emerald-100" />
              <span>Export for GitHub</span>
            </button>

            <button
              onClick={() => setActiveTab('coa')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-2 border shadow-sm ${
                activeTab === 'coa'
                  ? 'bg-[#5584B4] text-white border-[#5584B4] ring-2 ring-[#5584B4]/40 font-bold'
                  : 'bg-[#5584B4]/20 hover:bg-[#5584B4]/35 text-[#DDEBF7] border-[#5584B4]/60'
              }`}
              title="Open Chart of Accounts (COA) Master"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#60a5fa]" />
              <span className="font-bold tracking-wide">Chart of Accounts</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                338
              </span>
            </button>

            <button
              onClick={() => triggerSaveNotification('Clean Firebase sync verified. Database fresh.')}
              className="px-3 py-1.5 rounded-lg bg-[#1B233D] hover:bg-[#252F52] border border-[#2B3452] text-xs font-mono text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#5584B4]" />
              <span>Verify Sync</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#1B233D] hover:bg-[#252F52] text-slate-300 hover:text-white transition-colors border border-[#2B3452]"
              title="Close CMS Console"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Real-time Publish Success Banner */}
        {publishSuccessBanner && (
          <div className="bg-emerald-950/85 border-b border-emerald-500/50 px-6 py-2.5 text-xs font-mono text-emerald-200 flex items-center justify-between gap-3 animate-fade-in shadow-inner">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{publishSuccessBanner}</span>
            </div>
            <button
              onClick={() => setPublishSuccessBanner(null)}
              className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded hover:bg-emerald-900/50"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Real-time Save Banner */}
        {saveBanner && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-2 text-xs font-mono text-emerald-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{saveBanner}</span>
          </div>
        )}

        {/* Main Console Tabs with Left/Right Scroll Controls */}
        <div className="relative bg-[#12172A] border-b border-[#222F4C] flex items-center shrink-0">
          <button
            onClick={() => {
              if (tabsNavRef.current) tabsNavRef.current.scrollBy({ left: -220, behavior: 'smooth' });
            }}
            className="hidden sm:flex items-center justify-center h-full px-2 text-slate-400 hover:text-white hover:bg-[#1A213B] transition-colors z-10 border-r border-[#222F4C]"
            title="Scroll tabs left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div
            ref={tabsNavRef}
            className="flex-1 px-4 pt-2 flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
          >
            {/* TAB 1: PRODUCTS */}
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2.5 text-xs font-mono font-bold tracking-wide uppercase transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'products'
                  ? 'border-[#5584B4] text-[#DDEBF7] bg-[#1A213B]/60 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-[#5584B4]" />
              <span>Stage-Centric Products & Curricula</span>
            </button>

            {/* TAB 2: CHART OF ACCOUNTS (PROMINENT TAB #2) */}
            <button
              onClick={() => setActiveTab('coa')}
              className={`px-4 py-2.5 text-xs font-mono font-bold tracking-wide uppercase transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'coa'
                  ? 'border-[#5584B4] text-[#DDEBF7] bg-[#1A213B]/60 rounded-t-lg'
                  : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#60a5fa]" />
              <span className="text-white font-bold">Chart of Accounts (COA)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                338
              </span>
            </button>

            {/* TAB 3: VIDEOS */}
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-4 py-2.5 text-xs font-mono font-bold tracking-wide uppercase transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'videos'
                  ? 'border-[#5584B4] text-[#DDEBF7] bg-[#1A213B]/60 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="h-3.5 w-3.5 text-[#5584B4]" />
              <span>Educational Videos ({videos.length})</span>
            </button>

            {/* TAB 4: ARTICLES */}
            <button
              onClick={() => setActiveTab('articles')}
              className={`px-4 py-2.5 text-xs font-mono font-bold tracking-wide uppercase transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'articles'
                  ? 'border-[#5584B4] text-[#DDEBF7] bg-[#1A213B]/60 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-[#5584B4]" />
              <span>Articles & Analysis ({articles.length})</span>
            </button>

            {/* TAB 5: PROMOTIONS */}
            <button
              onClick={() => setActiveTab('promotions')}
              className={`px-4 py-2.5 text-xs font-mono font-bold tracking-wide uppercase transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'promotions'
                  ? 'border-[#5584B4] text-[#DDEBF7] bg-[#1A213B]/60 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#5584B4]" />
              <span>Hero Promotions ({promotions.filter((p) => p.imageUrl && p.imageUrl.trim() !== '' && p.isActive).length}/{promotions.length})</span>
            </button>

            {/* TAB 6: BOOK */}
            <button
              onClick={() => setActiveTab('book')}
              className={`px-4 py-2.5 text-xs font-mono font-bold tracking-wide uppercase transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'book'
                  ? 'border-[#5584B4] text-[#DDEBF7] bg-[#1A213B]/60 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-[#5584B4]" />
              <span>Book Bundle</span>
            </button>

            {/* TAB 7: ADMIN */}
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2.5 text-xs font-mono font-bold tracking-wide uppercase transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'border-[#5584B4] text-[#DDEBF7] bg-[#1A213B]/60 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#5584B4]" />
              <span>Administration</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (tabsNavRef.current) tabsNavRef.current.scrollBy({ left: 220, behavior: 'smooth' });
            }}
            className="hidden sm:flex items-center justify-center h-full px-2 text-slate-400 hover:text-white hover:bg-[#1A213B] transition-colors z-10 border-l border-[#222F4C]"
            title="Scroll tabs right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Content Viewport */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-[#0E1220]">
          
          {/* ========================================================================= */}
          {/* TAB 1: STAGE-CENTRIC PRODUCTS, PRICING & CURRICULA (PAGE 8 MASTER MATRIX) */}
          {/* ========================================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              
              {/* Stage Sub-Navigation Tabs (Page 8: VI-ABILITY, FUND-ABILITY, SUSTAIN-ABILITY, INVEST-ABILITY, OPERATIONS, GROWTH) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'All Stages Master Matrix', count: products.length },
                  { id: 'vi-ability', label: '1. Vi-Ability', count: products.filter((p) => p.stage === 'vi-ability').length },
                  { id: 'fund-ability', label: '2. Fund-Ability', count: products.filter((p) => p.stage === 'fund-ability').length },
                  { id: 'sustain-ability', label: '3. Sustain-Ability', count: products.filter((p) => p.stage === 'sustain-ability').length },
                  { id: 'invest-ability', label: '4. Invest-Ability', count: products.filter((p) => p.stage === 'invest-ability').length },
                  { id: 'operations', label: '5. Operations', count: products.filter((p) => p.stage === 'operations').length },
                  { id: 'growth', label: '6. Growth (Upcoming)', count: products.filter((p) => p.stage === 'growth').length },
                  { id: 'education', label: '7. Education / BizzClass', count: products.filter((p) => p.stage === 'education').length },
                ].map((stg) => (
                  <button
                    key={stg.id}
                    onClick={() => setSelectedStageFilter(stg.id)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      selectedStageFilter === stg.id
                        ? 'bg-[#1E2745] text-white font-bold border-[#5584B4] shadow-sm'
                        : 'bg-[#13182C] text-slate-400 hover:text-white border-[#222F4C]'
                    }`}
                  >
                    <span>{stg.label}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#252F52] text-slate-300">
                      {stg.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* 5 Summary KPI Cards (as specified in PDF Page 8) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl bg-[#141A2E] border border-[#222F4C]">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">STAGE PRODUCTS</div>
                  <div className="text-lg font-bold font-mono text-white mt-1">
                    {filteredProducts.length}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      ({stageAppsCount} Apps, {stageCoursesCount} Courses)
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141A2E] border border-[#222F4C]">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">SELLING PRICE SUM</div>
                  <div className="text-lg font-bold font-mono text-[#DDEBF7] mt-1">
                    R {stageSellingSum.toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141A2E] border border-[#222F4C]">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">TICKET PRICE SUM</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                    R {stageTicketSum.toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141A2E] border border-[#222F4C]">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">TOKENS ALLOCATED</div>
                  <div className="text-lg font-bold font-mono text-[#DDEBF7] mt-1">
                    {stageTokensSum.toFixed(1)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141A2E] border border-[#222F4C]">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">STAGE CUMULATIVE</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                    R {stageTicketSum.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Filtering, View Mode, Search & Prominent Add Product/Course Controls */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#141A2E] border border-[#222F4C]">
                {/* Left: View Mode Toggle & Type Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* View Mode Toggle: Table Matrix vs Sequence Organizer */}
                  <div className="inline-flex items-center bg-[#0E1220] p-1 rounded-xl border border-[#2B3452]">
                    <button
                      onClick={() => setProductsViewMode('matrix')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                        productsViewMode === 'matrix'
                          ? 'bg-[#1E2745] text-white border border-[#5584B4] shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Master Matrix table view with all pricing details and columns"
                    >
                      <Layers className="h-3.5 w-3.5 text-[#5584B4]" />
                      <span>Master Matrix Table</span>
                    </button>

                    <button
                      onClick={() => setProductsViewMode('sequence')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                        productsViewMode === 'sequence'
                          ? 'bg-[#1E2745] text-white border border-amber-500/70 shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Stage Sequence Organizer: Change presentation order (Move Up/Down) within each stage"
                    >
                      <ArrowUpDown className="h-3.5 w-3.5 text-amber-400" />
                      <span>Stage Sequence Organizer</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-slate-400">Type:</span>
                    {(['all', 'app', 'course'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTypeFilter(t)}
                        className={`px-2.5 py-1 rounded-lg text-xs uppercase font-mono ${
                          selectedTypeFilter === t
                            ? 'bg-[#5584B4] text-white font-bold'
                            : 'bg-[#1C243E] text-slate-400 hover:text-white'
                        }`}
                      >
                        {t === 'all' ? 'All' : t === 'app' ? 'Apps' : 'Courses'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Search Bar & Distinct Add Buttons */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={matrixSearch}
                      onChange={(e) => setMatrixSearch(e.target.value)}
                      placeholder="Search SKU, name..."
                      className="w-full pl-9 pr-3 py-1.5 bg-[#0E1220] border border-[#2B3452] rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#5584B4]"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenCreateProduct('app')}
                      className="px-3.5 py-1.5 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
                      title="Add a new Solution App (tool/framework) to the venture matrix"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>+ Add App</span>
                    </button>

                    <button
                      onClick={() => handleOpenCreateProduct('course')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
                      title="Add a new Masterclass Course (curriculum/lessons) to the venture matrix"
                    >
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span>+ Add Course</span>
                    </button>

                    <button
                      onClick={handlePublishToLiveSite}
                      disabled={isPublishing}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap border border-blue-400/40"
                      title="Publish and sync all updated courses and products immediately to the live site"
                    >
                      {isPublishing ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5 text-blue-100" />
                          <span>Publish to Live Site</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleExportForGitHub}
                      disabled={isExporting}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap border border-emerald-400/40"
                      title="Export updated products, pricing, and covers (e.g. bizzcalc) to cmsConsoleData.ts for GitHub"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-100" />
                      <span>Export for GitHub</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* V1 Formula Guide & Subscription Indicator Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 rounded-2xl bg-[#141A2E] border border-[#222F4C] text-[11px] font-mono text-slate-300">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#5584B4]/25 text-[#DDEBF7] border border-[#5584B4]/40 font-bold uppercase text-[10px] tracking-wide">
                    V1 Pricing Formula
                  </span>
                  <span className="text-slate-300">
                    <strong className="text-white">Selling Price is calculator base:</strong> Exclusive = Selling / 1.15 · VAT (15%) = Selling - Exclusive · Ticket = Selling * 1.20 · Tokens = 20%
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] shrink-0">
                  <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300">
                    *Tokens editable when Selling = R0.00
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/40 text-purple-300">
                    *Indicator: 'once-off' vs 'monthly subscription'
                  </span>
                </div>
              </div>

              {/* VIEW 1: MASTER MATRIX TABLE */}
              {productsViewMode === 'matrix' && (
                <div className="rounded-2xl border border-[#222F4C] overflow-hidden bg-[#13182C]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse min-w-[980px]">
                      <thead>
                        <tr className="bg-[#182038] text-slate-400 border-b border-[#222F4C] text-[11px] uppercase">
                          <th className="py-2.5 px-2.5 text-center">
                            <span className="flex items-center justify-center gap-1">
                              <span>Seq</span>
                              <span className="text-[9px] text-amber-400 normal-case">(order)</span>
                            </span>
                          </th>
                          <th className="py-2.5 px-2.5 text-center">Type</th>
                          <th className="py-2.5 px-2.5">SKU</th>
                          <th className="py-2.5 px-3">Product / Course Name</th>
                          <th className="py-2.5 px-3 text-center">
                            <span className="flex items-center justify-center gap-1">
                              <span>Pricing Model</span>
                              <span className="text-[9px] text-[#5584B4] normal-case">(indicator)</span>
                            </span>
                          </th>
                          <th className="py-2.5 px-3 text-right">Exclusive (ZAR)</th>
                          <th className="py-2.5 px-3 text-right">VAT (15%)</th>
                          <th className="py-2.5 px-3 text-right font-bold text-white">
                            <span className="flex items-center justify-end gap-1">
                              <span>Selling Price</span>
                              <span className="text-[9px] text-amber-400 normal-case">(base)</span>
                            </span>
                          </th>
                          <th className="py-2.5 px-3 text-right">
                            <span className="flex items-center justify-end gap-1">
                              <span>Tokens</span>
                              <span className="text-[9px] text-slate-400 normal-case">(20% / custom)</span>
                            </span>
                          </th>
                          <th className="py-2.5 px-3 text-right text-emerald-400">Ticket Price</th>
                          <th className="py-2.5 px-2 text-center">Sync</th>
                          <th className="py-2.5 px-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1D2644]">
                        {filteredProducts.map((prod) => {
                          const isMonthly = prod.billingModel === 'monthly subscription';
                          const isSellingZero = prod.sellingPriceZAR === 0;

                          // Position within its stage
                          const stageSiblings = products
                            .filter((p) => p.stage === prod.stage)
                            .sort((a, b) => (a.seq || 0) - (b.seq || 0));
                          const posInStage = stageSiblings.findIndex((p) => p.id === prod.id);
                          const isSingleInStage = stageSiblings.length <= 1;
                          const isFirstInStage = isSingleInStage ? (prod.seq || 1) <= 1 : posInStage === 0;
                          const isLastInStage = isSingleInStage ? false : posInStage === stageSiblings.length - 1;

                          return (
                            <tr
                              key={prod.id}
                              className="hover:bg-[#182038]/60 transition-colors group"
                            >
                              {/* Seq: Presentation Sequence within Stage with Move Up/Down Controls */}
                              <td className="py-2.5 px-2 text-center">
                                <div className="inline-flex items-center justify-center gap-1 bg-[#0E1220] p-1 rounded-lg border border-[#2B3452]">
                                  <input
                                    type="number"
                                    min="1"
                                    value={prod.seq}
                                    onChange={(e) =>
                                      handleUpdateProductSeq(prod.id, parseInt(e.target.value) || 1)
                                    }
                                    className="w-8 px-0.5 py-0.5 bg-[#141A2E] border border-[#2B3452] hover:border-[#5584B4] focus:border-[#5584B4] rounded text-center font-bold text-white text-xs font-mono focus:outline-none"
                                    title={`Presentation sequence #${prod.seq} in ${prod.stage}. Type number or use arrows to reorder.`}
                                  />
                                  <div className="flex flex-col -space-y-0.5">
                                    <button
                                      type="button"
                                      disabled={isFirstInStage}
                                      onClick={() => handleMoveProductSequence(prod.id, 'up')}
                                      className="p-0.5 rounded hover:bg-[#253258] disabled:opacity-20 text-slate-400 hover:text-white transition-colors"
                                      title="Move up in presentation sequence within this stage"
                                    >
                                      <ChevronUp className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isLastInStage}
                                      onClick={() => handleMoveProductSequence(prod.id, 'down')}
                                      className="p-0.5 rounded hover:bg-[#253258] disabled:opacity-20 text-slate-400 hover:text-white transition-colors"
                                      title="Move down in presentation sequence within this stage"
                                    >
                                      <ChevronDown className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-2.5 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                    prod.type === 'app'
                                      ? 'bg-[#5584B4]/20 text-[#DDEBF7] border border-[#5584B4]/30'
                                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                                  }`}
                                >
                                  {prod.type}
                                </span>
                              </td>
                              <td className="py-3 px-2.5 font-bold text-slate-300">{prod.sku}</td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-white group-hover:text-[#DDEBF7] transition-colors">
                                  {prod.name}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                                  {prod.subtitle}
                                </div>
                                {prod.modules && prod.modules.length > 0 && (
                                  <div className="text-[10px] text-slate-500 mt-1">
                                    Modules: {prod.modules.slice(0, 2).join(' · ')}
                                    {prod.modules.length > 2 ? ' ...' : ''}
                                  </div>
                                )}
                              </td>

                              {/* Column Indicator: 'once-off' vs 'monthly subscription' */}
                              <td className="py-3 px-3 text-center">
                                <div className="relative inline-flex items-center">
                                  <select
                                    value={prod.billingModel || (prod.id === 'bizzmoney' ? 'monthly subscription' : 'once-off')}
                                    onChange={(e) =>
                                      handleUpdateProductBillingModel(
                                        prod.id,
                                        e.target.value as 'once-off' | 'monthly subscription'
                                      )
                                    }
                                    className={`appearance-none cursor-pointer pl-2.5 pr-6 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition-all border outline-none ${
                                      isMonthly
                                        ? 'bg-purple-950/80 text-purple-200 border-purple-500/60 hover:border-purple-400 shadow-xs'
                                        : 'bg-[#182138] text-slate-300 border-[#2D3958] hover:border-[#5584B4]'
                                    }`}
                                    title={`Pricing model indicator: ${
                                      isMonthly ? 'Monthly Subscription' : 'Once-Off Price'
                                    }. Click to switch.`}
                                  >
                                    <option value="once-off" className="bg-[#141A2E] text-slate-200">
                                      once-off
                                    </option>
                                    <option value="monthly subscription" className="bg-[#141A2E] text-purple-300 font-bold">
                                      monthly subscription
                                    </option>
                                  </select>
                                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none text-slate-400" />
                                </div>
                              </td>

                              {/* Exclusive Price (ZAR): Selling / 1.15 */}
                              <td className="py-3 px-3 text-right text-slate-300">
                                R {Number(prod.exclusivePriceZAR || 0).toFixed(2)}
                              </td>

                              {/* VAT (15%): Selling - Exclusive */}
                              <td className="py-3 px-3 text-right text-slate-400">
                                R {Number(prod.vatZAR || 0).toFixed(2)}
                              </td>

                              {/* Selling Price (ZAR) - Editable Base Calculator Input */}
                              <td className="py-3 px-3 text-right">
                                <div className="inline-flex items-center justify-end gap-1 bg-[#0E1220] border border-[#2B3452] hover:border-[#5584B4] focus-within:border-[#5584B4] focus-within:ring-1 focus-within:ring-[#5584B4]/40 rounded-lg px-2 py-1 transition-all shadow-inner">
                                  <span className="text-slate-400 text-xs font-mono font-medium">R</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={prod.sellingPriceZAR === 0 ? '' : prod.sellingPriceZAR}
                                    placeholder="0.00"
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                      handleUpdateProductSellingPrice(prod.id, isNaN(val) ? 0 : Math.max(0, val));
                                    }}
                                    className="w-20 bg-transparent text-right font-bold text-white text-xs font-mono focus:outline-none"
                                    title="Edit Selling Price (Formula Base). Automatically recalculates Exclusive (Selling / 1.15), VAT 15%, Ticket Price (Selling * 1.20), and Tokens (20%)."
                                  />
                                </div>
                              </td>

                              {/* Tokens - Overwritable if Selling Price === 0, otherwise auto 20% */}
                              <td className="py-3 px-3 text-right">
                                {isSellingZero ? (
                                  <div
                                    className="inline-flex items-center justify-end gap-1 bg-amber-950/40 border border-amber-500/70 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/40 rounded-lg px-2 py-1 transition-all shadow-inner"
                                    title="Selling Price is R0.00 — Custom Token overwrite enabled. Enter token value."
                                  >
                                    <Coins className="h-3 w-3 text-amber-400 shrink-0" />
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.1"
                                      value={prod.tokensAllocated === 0 ? '' : prod.tokensAllocated}
                                      placeholder="0.0"
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                        handleUpdateProductTokens(prod.id, isNaN(val) ? 0 : Math.max(0, val));
                                      }}
                                      className="w-16 bg-transparent text-right font-bold text-amber-300 text-xs font-mono focus:outline-none"
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className="inline-flex items-center justify-end gap-1 px-2 py-1 text-[#DDEBF7] font-semibold text-xs font-mono"
                                    title="Tokens = 20% of Selling Price (auto-calculated per V1 formula). Overwrite enabled when Selling Price is R0.00."
                                  >
                                    <Coins className="h-3 w-3 text-[#5584B4] shrink-0" />
                                    <span>{Number(prod.tokensAllocated || 0).toFixed(1)}</span>
                                  </div>
                                )}
                              </td>

                              {/* Ticket Price: Selling * 1.20 */}
                              <td className="py-3 px-3 text-right font-bold text-emerald-400">
                                R {Number(prod.ticketPriceZAR || 0).toFixed(2)}
                                {isMonthly && (
                                  <span className="text-[10px] text-purple-300 font-normal ml-1">/mo</span>
                                )}
                              </td>

                              {/* Sync Status */}
                              <td className="py-3 px-2 text-center">
                                <span className="text-emerald-400 font-bold text-[11px]">YES</span>
                              </td>

                              {/* Actions: Edit & Delete */}
                              <td className="py-3 px-3 text-center">
                                <div className="inline-flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditProduct(prod)}
                                    className="px-2.5 py-1 rounded-lg bg-[#1B233D] hover:bg-[#5584B4] text-slate-300 hover:text-white transition-colors text-xs font-mono inline-flex items-center gap-1 shadow-xs"
                                    title="Edit product, pricing, media, curriculum lessons"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                    <span>Manage</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setProductToDelete(prod)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/80 border border-rose-500/30 text-rose-300 hover:text-white transition-colors text-xs font-mono inline-flex items-center gap-1 shadow-xs"
                                    title={`Delete "${prod.name}" from CMS and live site`}
                                  >
                                    <Trash2 className="h-3 w-3 text-rose-400" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 2: STAGE PRESENTATION SEQUENCE ORGANIZER */}
              {productsViewMode === 'sequence' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-[#141A2E] border border-[#222F4C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-amber-400" />
                        <span>Stage Presentation Sequence Organizer</span>
                      </h4>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        Organize the exact presentation order (#1, #2, #3...) within each stage. Reorder with the ▲ / ▼ buttons or enter sequence numbers directly.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenCreateProduct('app')}
                        className="px-3 py-1.5 rounded-lg bg-[#5584B4] hover:bg-[#4773A0] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>+ Add App</span>
                      </button>
                      <button
                        onClick={() => handleOpenCreateProduct('course')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                        <span>+ Add Course</span>
                      </button>
                    </div>
                  </div>

                  {/* Stage-by-Stage Reordering Cards */}
                  {[
                    { id: 'vi-ability', num: 1, name: '1. Vi-Ability', desc: 'Mathematical validation of customer willingness-to-pay before coding or building inventory' },
                    { id: 'fund-ability', num: 2, name: '2. Fund-Ability', desc: 'Financial engineering, unit economics proof, and investor pitch defensibility' },
                    { id: 'sustain-ability', num: 3, name: '3. Sustain-Ability', desc: 'Operational resilience, margin defense, and continuous cash flow engines' },
                    { id: 'invest-ability', num: 4, name: '4. Invest-Ability', desc: 'Institutional due diligence readiness, virtual data rooms, and capital transactions' },
                    { id: 'operations', num: 5, name: '5. Operations', desc: 'Daily execution systems, enterprise resource scaling, and team workflows' },
                    { id: 'growth', num: 6, name: '6. Growth (Upcoming)', desc: 'Market expansion engines, organic acquisition loops, and venture scaling' },
                    { id: 'education', num: 7, name: '7. Education / BizzClass', desc: 'Foundational masterclasses, cost recovery courses, and executive learning modules' },
                  ]
                    .filter((stg) => selectedStageFilter === 'all' || selectedStageFilter === stg.id)
                    .map((stg) => {
                      const stageProds = products
                        .filter((p) => p.stage === stg.id)
                        .filter((p) => {
                          const matchType = selectedTypeFilter === 'all' || p.type === selectedTypeFilter;
                          const matchSearch =
                            !matrixSearch ||
                            p.name.toLowerCase().includes(matrixSearch.toLowerCase()) ||
                            p.sku.toLowerCase().includes(matrixSearch.toLowerCase());
                          return matchType && matchSearch;
                        })
                        .sort((a, b) => (a.seq || 0) - (b.seq || 0));

                      return (
                        <div key={stg.id} className="rounded-2xl border border-[#222F4C] bg-[#13182C] overflow-hidden">
                          {/* Stage Header */}
                          <div className="p-4 bg-[#182038] border-b border-[#222F4C] flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#5584B4]/20 text-[#DDEBF7] border border-[#5584B4]/30">
                                  STAGE {stg.num}
                                </span>
                                <h3 className="text-sm font-bold text-white font-mono">{stg.name}</h3>
                                <span className="text-xs text-slate-400 font-mono">
                                  ({stageProds.length} items: {stageProds.filter((p) => p.type === 'app').length} Apps, {stageProds.filter((p) => p.type === 'course').length} Courses)
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{stg.desc}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenCreateProduct('app', stg.id as CmsProduct['stage'])}
                                className="px-2.5 py-1 rounded-lg bg-[#1E2548] hover:bg-[#2B3560] border border-[#3B4875] text-[#DDEBF7] text-xs font-mono flex items-center gap-1 transition-colors"
                                title={`Add a Solution App to ${stg.name}`}
                              >
                                <Plus className="h-3 w-3 text-[#5584B4]" />
                                <span>Add App</span>
                              </button>
                              <button
                                onClick={() => handleOpenCreateProduct('course', stg.id as CmsProduct['stage'])}
                                className="px-2.5 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-1 transition-colors"
                                title={`Add a Masterclass Course to ${stg.name}`}
                              >
                                <GraduationCap className="h-3 w-3 text-emerald-400" />
                                <span>Add Course</span>
                              </button>
                            </div>
                          </div>

                          {/* Stage Items List */}
                          <div className="p-4 space-y-2.5">
                            {stageProds.length === 0 ? (
                              <div className="p-6 text-center rounded-xl bg-[#0E1220]/60 border border-dashed border-[#222F4C] text-xs font-mono text-slate-400">
                                <p>No products or courses found in {stg.name}.</p>
                                <div className="flex justify-center gap-2 mt-3">
                                  <button
                                    onClick={() => handleOpenCreateProduct('app', stg.id as CmsProduct['stage'])}
                                    className="px-3 py-1.5 rounded-lg bg-[#5584B4] text-white font-bold text-xs"
                                  >
                                    + Add App to this Stage
                                  </button>
                                  <button
                                    onClick={() => handleOpenCreateProduct('course', stg.id as CmsProduct['stage'])}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                                  >
                                    + Add Course to this Stage
                                  </button>
                                </div>
                              </div>
                            ) : (
                              stageProds.map((prod, idx) => {
                                const isFirst = idx === 0;
                                const isLast = idx === stageProds.length - 1;
                                const isMonthly = prod.billingModel === 'monthly subscription';

                                return (
                                  <div
                                    key={prod.id}
                                    className="p-3.5 rounded-xl bg-[#0E1220] border border-[#222F4C] hover:border-[#5584B4]/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                                  >
                                    {/* Left: Sequence Badge, Move Up/Down, Info */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 shrink-0 bg-[#141A2E] p-1.5 rounded-xl border border-[#2B3452]">
                                        <div className="flex flex-col gap-0.5">
                                          <button
                                            type="button"
                                            disabled={isFirst}
                                            onClick={() => handleMoveProductSequence(prod.id, 'up')}
                                            className="p-1 rounded hover:bg-[#253258] disabled:opacity-20 text-slate-300 hover:text-white transition-colors"
                                            title="Move UP in presentation sequence within this stage"
                                          >
                                            <ChevronUp className="h-4 w-4" />
                                          </button>
                                          <button
                                            type="button"
                                            disabled={isLast}
                                            onClick={() => handleMoveProductSequence(prod.id, 'down')}
                                            className="p-1 rounded hover:bg-[#253258] disabled:opacity-20 text-slate-300 hover:text-white transition-colors"
                                            title="Move DOWN in presentation sequence within this stage"
                                          >
                                            <ChevronDown className="h-4 w-4" />
                                          </button>
                                        </div>

                                        <div className="text-center px-1">
                                          <div className="text-[9px] uppercase font-mono text-slate-400 font-bold">POS</div>
                                          <input
                                            type="number"
                                            min="1"
                                            value={prod.seq}
                                            onChange={(e) =>
                                              handleUpdateProductSeq(prod.id, parseInt(e.target.value) || 1)
                                            }
                                            className="w-9 px-1 py-0.5 bg-[#0E1220] border border-[#2B3452] focus:border-[#5584B4] rounded text-center font-bold text-white text-xs font-mono"
                                            title="Type number to jump presentation position"
                                          />
                                        </div>
                                      </div>

                                      {/* Product Meta */}
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                                              prod.type === 'app'
                                                ? 'bg-[#5584B4]/20 text-[#DDEBF7] border border-[#5584B4]/30'
                                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                                            }`}
                                          >
                                            {prod.type}
                                          </span>
                                          <span className="text-xs font-bold font-mono text-slate-300">{prod.sku}</span>
                                          <span className="text-xs font-bold font-mono text-white group-hover:text-[#DDEBF7] transition-colors truncate">
                                            {prod.name}
                                          </span>
                                          <span
                                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold ${
                                              isMonthly
                                                ? 'bg-purple-950/80 text-purple-200 border border-purple-500/50'
                                                : 'bg-[#182138] text-slate-300 border border-[#2D3958]'
                                            }`}
                                          >
                                            {isMonthly ? 'monthly sub' : 'once-off'}
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                                          {prod.purpose || prod.subtitle || prod.description}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right: Pricing info and Action buttons (Manage, Delete) */}
                                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                                      <div className="text-right font-mono text-xs hidden md:block">
                                        <div className="font-bold text-white">
                                          R {prod.sellingPriceZAR.toFixed(2)}
                                          {isMonthly && <span className="text-[10px] text-purple-300 font-normal ml-0.5">/mo</span>}
                                        </div>
                                        <div className="text-[10px] text-emerald-400">
                                          Ticket: R {prod.ticketPriceZAR.toFixed(2)}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        <label
                                          className="px-2.5 py-1.5 rounded-lg bg-[#1B233D] hover:bg-[#252F52] border border-[#2B3452] text-slate-300 hover:text-white transition-colors text-xs font-mono flex items-center gap-1 cursor-pointer"
                                          title={`Upload or update cover image for "${prod.name}"`}
                                        >
                                          <Upload className="h-3 w-3 text-[#5584B4]" />
                                          <span>{prod.canonicalCoverUrl ? 'Image ✓' : 'Upload Image'}</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) handleDirectUploadProductImage(prod.id, file);
                                            }}
                                            className="hidden"
                                          />
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditProduct(prod)}
                                          className="px-2.5 py-1.5 rounded-lg bg-[#1B233D] hover:bg-[#5584B4] text-slate-300 hover:text-white transition-colors text-xs font-mono flex items-center gap-1"
                                          title="Edit product / course details"
                                        >
                                          <Edit2 className="h-3 w-3" />
                                          <span>Manage</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setProductToDelete(prod)}
                                          className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 hover:text-white transition-colors text-xs font-mono flex items-center gap-1"
                                          title={`Delete "${prod.name}" from CMS and website`}
                                        >
                                          <Trash2 className="h-3 w-3 text-rose-400" />
                                          <span>Delete</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* UNIFIED DRAWER / MODAL: Manage Pricing, Media & Curricula for Selected Solution */}
              {editingProduct && (
                <div className="p-5 rounded-2xl bg-[#141A2E] border-2 border-[#5584B4] shadow-xl space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-[#252E4A]">
                    <div>
                      <span className="text-[11px] font-mono text-[#5584B4] uppercase">
                        EDITING {editingProduct.type.toUpperCase()} · {editingProduct.sku}
                      </span>
                      <h3 className="text-base font-bold text-white">{editingProduct.name}</h3>
                    </div>
                    <button
                      onClick={() => setEditingProduct(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveProductEdit} className="space-y-4 text-xs font-mono">
                    {/* Row 0: Stage Assignment, Product Type, SKU, and Presentation Sequence in Stage */}
                    <div className="p-3.5 rounded-xl bg-[#0E1220] border border-[#252E4A] space-y-3">
                      <div className="font-bold text-slate-300 uppercase text-[11px] flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-white">
                          <Layers className="h-3.5 w-3.5 text-[#5584B4]" />
                          <span>STAGE & PRESENTATION SEQUENCE ASSIGNMENT</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Controls stage placement and display order</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        {/* Stage Selector */}
                        <div className="sm:col-span-2">
                          <label className="text-slate-300 font-semibold block mb-1">
                            Venture Stage
                          </label>
                          <select
                            value={editingProduct.stage}
                            onChange={(e) => {
                              const nextStage = e.target.value as CmsProduct['stage'];
                              const itemsInNextStage = products.filter((p) => p.stage === nextStage && p.id !== editingProduct.id);
                              setEditingProduct({
                                ...editingProduct,
                                stage: nextStage,
                                seq: itemsInNextStage.length + 1,
                              });
                            }}
                            className="w-full px-3 py-1.5 bg-[#141A2E] border border-[#2B3452] focus:border-[#5584B4] rounded-lg text-white font-mono text-xs outline-none cursor-pointer"
                          >
                            <option value="vi-ability">1. Vi-Ability (Stage 1)</option>
                            <option value="fund-ability">2. Fund-Ability (Stage 2)</option>
                            <option value="sustain-ability">3. Sustain-Ability (Stage 3)</option>
                            <option value="invest-ability">4. Invest-Ability (Stage 4)</option>
                            <option value="operations">5. Operations (Stage 5)</option>
                            <option value="growth">6. Growth (Upcoming · Stage 6)</option>
                            <option value="education">7. Education / BizzClass (Stage 7)</option>
                          </select>
                        </div>

                        {/* Type Selector */}
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">
                            Product Type
                          </label>
                          <select
                            value={editingProduct.type}
                            onChange={(e) => {
                              const nextType = e.target.value as 'app' | 'course';
                              const skuPrefix = nextType === 'app' ? 'BA' : 'BC';
                              const nextNum = products.filter((p) => p.type === nextType).length + 1;
                              setEditingProduct({
                                ...editingProduct,
                                type: nextType,
                                sku: editingProduct.sku.startsWith('BA-') || editingProduct.sku.startsWith('BC-')
                                  ? `${skuPrefix}-${String(nextNum).padStart(3, '0')}`
                                  : editingProduct.sku,
                              });
                            }}
                            className="w-full px-3 py-1.5 bg-[#141A2E] border border-[#2B3452] focus:border-[#5584B4] rounded-lg text-white font-mono text-xs outline-none cursor-pointer"
                          >
                            <option value="app">Solution App</option>
                            <option value="course">Masterclass Course</option>
                          </select>
                        </div>

                        {/* Presentation Sequence in Stage */}
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">
                            Sequence (# in Stage)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={editingProduct.seq || 1}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                seq: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                            className="w-full px-3 py-1.5 bg-[#141A2E] border border-[#2B3452] focus:border-[#5584B4] rounded-lg text-white font-mono font-bold text-xs"
                          />
                          <span className="text-[9px] text-slate-500 mt-0.5 block">
                            Order in {editingProduct.stage}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                        {/* SKU */}
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">
                            SKU Code
                          </label>
                          <input
                            type="text"
                            value={editingProduct.sku}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, sku: e.target.value.toUpperCase() })
                            }
                            className="w-full px-3 py-1.5 bg-[#141A2E] border border-[#2B3452] focus:border-[#5584B4] rounded-lg text-white font-mono font-bold text-xs"
                            placeholder="BA-001 or BC-001"
                          />
                        </div>

                        {/* Companion Material for Course (or Modules for App) */}
                        {editingProduct.type === 'course' ? (
                          <div className="sm:col-span-3">
                            <label className="text-slate-300 font-semibold block mb-1">
                              Course Material (ZIP File / Companion Download)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingProduct.companionMaterialFilename || ''}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    companionMaterialFilename: e.target.value,
                                  })
                                }
                                placeholder="course-masterclass-workbook.zip"
                                className="flex-1 px-3 py-1.5 bg-[#141A2E] border border-[#2B3452] focus:border-[#5584B4] rounded-lg text-white font-mono text-xs"
                              />
                              <label className="px-3 py-1.5 rounded-lg bg-[#1B233D] hover:bg-[#252F52] border border-[#2B3452] text-xs font-mono text-slate-200 cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                                <Upload className="h-3 w-3" />
                                <span>Upload ZIP</span>
                                <input
                                  type="file"
                                  accept=".zip,.rar,.tar,.gz"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setEditingProduct({
                                        ...editingProduct,
                                        companionMaterialFilename: file.name,
                                      });
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="sm:col-span-3">
                            <label className="text-slate-300 font-semibold block mb-1">
                              App Key Modules (comma separated)
                            </label>
                            <input
                              type="text"
                              value={(editingProduct.modules || []).join(', ')}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  modules: e.target.value.split(',').map((m) => m.trim()).filter(Boolean),
                                })
                              }
                              placeholder="Financial Calculator, Scenario Matrix, Break-Even Analyzer"
                              className="w-full px-3 py-1.5 bg-[#141A2E] border border-[#2B3452] focus:border-[#5584B4] rounded-lg text-white font-mono text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Row 1: Name and Subtitle (Price reference removed per user request) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1">Product / Course Name</label>
                        <input
                          type="text"
                          value={editingProduct.name}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, name: e.target.value })
                          }
                          className="w-full px-3 py-1.5 bg-[#0E1220] border border-[#2B3452] rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Subtitle / Punchline</label>
                        <input
                          type="text"
                          value={editingProduct.subtitle}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, subtitle: e.target.value })
                          }
                          className="w-full px-3 py-1.5 bg-[#0E1220] border border-[#2B3452] rounded-lg text-white"
                        />
                      </div>
                    </div>

                    {/* Row 2: Course objective (three line explanation) / Purpose */}
                    <div>
                      <label className="text-slate-300 font-bold block mb-1 flex items-center justify-between">
                        <span>
                          {editingProduct.type === 'course'
                            ? 'Course Objective (Three-Line Explanation)'
                            : 'Product Purpose & Objective (Three-Line Explanation)'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Foundational premise & learning outcomes</span>
                      </label>
                      <textarea
                        rows={3}
                        value={editingProduct.purpose || ''}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, purpose: e.target.value })
                        }
                        placeholder={
                          editingProduct.type === 'course'
                            ? 'Explain the strategic purpose of this course and what capabilities the founder will master (e.g. Transform pitch rhetoric into mathematical proof of customer validation and defensible unit margins)...'
                            : 'Explain the strategic purpose of this solution and the operational problem it solves...'
                        }
                        className="w-full px-3 py-2 bg-[#0E1220] border border-[#2B3452] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#5584B4] leading-relaxed resize-y"
                      />
                    </div>

                    {/* PRICING & SUBSCRIPTION MODEL CONFIGURATION (V1 FORMULA ENGINE) */}
                    <div className="p-3.5 rounded-xl bg-[#0E1220] border border-[#252E4A] space-y-3">
                      <div className="font-bold text-slate-300 uppercase text-[11px] flex items-center justify-between flex-wrap gap-2">
                        <span className="flex items-center gap-1.5 text-white">
                          <DollarSign className="h-3.5 w-3.5 text-[#5584B4]" />
                          <span>PRICING & SUBSCRIPTION MODEL (V1 FORMULA ENGINE)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Formula base: Selling Price · Exclusive = Selling / 1.15 · VAT = 15% · Ticket = Selling * 1.20
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                        {/* 1. Billing Model Selector */}
                        <div className="col-span-2 sm:col-span-2">
                          <label className="text-slate-300 font-semibold block mb-1">
                            Pricing / Billing Model
                          </label>
                          <div className="relative">
                            <select
                              value={
                                editingProduct.billingModel ||
                                (editingProduct.id === 'bizzmoney' ? 'monthly subscription' : 'once-off')
                              }
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  billingModel: e.target.value as 'once-off' | 'monthly subscription',
                                })
                              }
                              className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono font-bold uppercase transition-colors outline-none cursor-pointer ${
                                editingProduct.billingModel === 'monthly subscription'
                                  ? 'bg-purple-950/80 border-purple-500/60 text-purple-200'
                                  : 'bg-[#141A2E] border-[#2B3452] text-slate-200'
                              }`}
                            >
                              <option value="once-off" className="bg-[#141A2E] text-slate-200">
                                once-off
                              </option>
                              <option value="monthly subscription" className="bg-[#141A2E] text-purple-300">
                                monthly subscription
                              </option>
                            </select>
                          </div>
                        </div>

                        {/* 2. Selling Price (Base Calculator Input) */}
                        <div className="col-span-1 sm:col-span-1">
                          <label className="text-white font-bold block mb-1">
                            Selling Price (R)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={editingProduct.sellingPriceZAR === 0 ? '' : editingProduct.sellingPriceZAR}
                            placeholder="0.00"
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              const newSelling = isNaN(val) ? 0 : Math.max(0, val);
                              const pricing = calculatePricingFromSelling(
                                newSelling,
                                editingProduct.tokensAllocated
                              );
                              setEditingProduct({
                                ...editingProduct,
                                ...pricing,
                              });
                            }}
                            className="w-full px-3 py-1.5 bg-[#141A2E] border border-amber-500/50 focus:border-amber-400 rounded-lg text-white font-bold text-xs"
                          />
                        </div>

                        {/* 3. Exclusive Price (Calculated: Selling / 1.15) */}
                        <div className="col-span-1 sm:col-span-1">
                          <label className="text-slate-400 block mb-1">
                            Exclusive (R)
                          </label>
                          <div className="px-3 py-1.5 bg-[#141A2E]/60 border border-[#2B3452] rounded-lg text-slate-300 text-xs">
                            R {editingProduct.exclusivePriceZAR.toFixed(2)}
                          </div>
                        </div>

                        {/* 4. VAT 15% (Calculated: Selling - Exclusive) */}
                        <div className="col-span-1 sm:col-span-1">
                          <label className="text-slate-400 block mb-1">
                            VAT 15% (R)
                          </label>
                          <div className="px-3 py-1.5 bg-[#141A2E]/60 border border-[#2B3452] rounded-lg text-slate-400 text-xs">
                            R {editingProduct.vatZAR.toFixed(2)}
                          </div>
                        </div>

                        {/* 5. Tokens (Editable when Selling === 0, otherwise 20% of Selling) */}
                        <div className="col-span-1 sm:col-span-1">
                          <label className="text-[#DDEBF7] font-semibold block mb-1 flex items-center justify-between">
                            <span>Tokens</span>
                            {editingProduct.sellingPriceZAR === 0 && (
                              <span className="text-[9px] text-amber-400">editable</span>
                            )}
                          </label>
                          {editingProduct.sellingPriceZAR === 0 ? (
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={editingProduct.tokensAllocated === 0 ? '' : editingProduct.tokensAllocated}
                              placeholder="0.0"
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                setEditingProduct({
                                  ...editingProduct,
                                  tokensAllocated: isNaN(val) ? 0 : Math.max(0, val),
                                });
                              }}
                              className="w-full px-3 py-1.5 bg-[#141A2E] border border-amber-500/70 focus:border-amber-400 rounded-lg text-amber-300 font-bold text-xs"
                              title="Selling Price is R0.00 — Token value can be custom overwritten."
                            />
                          ) : (
                            <div className="px-3 py-1.5 bg-[#141A2E]/60 border border-[#2B3452] rounded-lg text-[#DDEBF7] font-semibold text-xs flex items-center gap-1">
                              <Coins className="h-3 w-3 text-[#5584B4]" />
                              <span>{editingProduct.tokensAllocated.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                        <span>
                          Ticket Price (Selling * 1.20):{' '}
                          <strong className="text-emerald-400 font-mono text-xs">
                            R {editingProduct.ticketPriceZAR.toFixed(2)}
                          </strong>
                        </span>
                        <span className="text-slate-500">
                          {editingProduct.sellingPriceZAR === 0
                            ? '*Selling price is R0.00: Tokens value can be custom overwritten above.'
                            : '*Tokens auto-calculated at 20% of selling price.'}
                        </span>
                      </div>
                    </div>

                    {/* Media, Artwork & Materials Panel */}
                    <div className="p-3.5 rounded-xl bg-[#0E1220] border border-[#252E4A] space-y-3">
                      <div className="font-bold text-slate-300 uppercase text-[11px] flex items-center justify-between">
                        <span>
                          {editingProduct.type === 'course'
                            ? 'MEDIA & PROMOTIONAL ASSETS (VIDEO, ARTWORK & MATERIALS)'
                            : 'MEDIA & PLATFORM ASSETS (DEMO VIDEO & ARTWORK)'}
                        </span>
                        <span className="text-[#5584B4]">Direct YouTube & Cloud Asset Connector</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Upload promotion video – YouTube link */}
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">
                            {editingProduct.type === 'course'
                              ? 'Promotion Video (YouTube Link · Stored in the bizzbean channel)'
                              : 'Explainer / Demo Video (YouTube Link · Stored in the bizzbean channel)'}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={editingProduct.coursePromoVideoUrl || editingProduct.youtubeDemoUrl || ''}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  coursePromoVideoUrl: e.target.value,
                                  youtubeDemoUrl: e.target.value,
                                })
                              }
                              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                              className="w-full px-3 py-1.5 bg-[#141A2E] border border-[#2B3452] rounded-lg text-white text-[11px] placeholder-slate-500 focus:outline-none focus:border-[#5584B4]"
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            Paste YouTube video URL or embed link from the official bizzbean channel.
                          </span>
                        </div>

                        {/* Upload of course image – jpeg */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-slate-300 font-semibold block">
                              {editingProduct.type === 'course' ? 'Course Image (JPEG)' : 'Artwork / Cover Image (JPEG)'}
                            </label>
                            <label className="px-2.5 py-0.5 rounded bg-[#5584B4] hover:bg-[#4773A0] text-white text-[10px] font-mono font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-xs">
                              <Upload className="h-3 w-3" />
                              <span>Upload JPEG</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const compressed = await compressImageFile(file, 800, 500, 0.65);
                                    setEditingProduct({
                                      ...editingProduct,
                                      canonicalCoverUrl: compressed,
                                    });
                                    const updatedList = products.map((p) =>
                                      p.id === editingProduct.id ? { ...p, canonicalCoverUrl: compressed } : p
                                    );
                                    persistProducts(updatedList);
                                    triggerSaveNotification(`Uploaded & saved cover image for "${editingProduct.name}".`);
                                  } catch {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      if (ev.target?.result) {
                                        const res = ev.target.result as string;
                                        setEditingProduct({
                                          ...editingProduct,
                                          canonicalCoverUrl: res,
                                        });
                                        const updatedList = products.map((p) =>
                                          p.id === editingProduct.id ? { ...p, canonicalCoverUrl: res } : p
                                        );
                                        persistProducts(updatedList);
                                        triggerSaveNotification(`Uploaded & saved cover image for "${editingProduct.name}".`);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>

                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={editingProduct.canonicalCoverUrl || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditingProduct({
                                  ...editingProduct,
                                  canonicalCoverUrl: val,
                                });
                                const updatedList = products.map((p) =>
                                  p.id === editingProduct.id ? { ...p, canonicalCoverUrl: val } : p
                                );
                                persistProducts(updatedList);
                              }}
                              placeholder="Paste JPEG URL (https://...) or upload JPEG above..."
                              className="flex-grow px-3 py-1.5 bg-[#141A2E] border border-[#2B3452] rounded-lg text-white text-[11px] placeholder-slate-500 focus:outline-none focus:border-[#5584B4]"
                            />
                            {editingProduct.canonicalCoverUrl && (
                              <div className="relative w-10 h-8 rounded-lg overflow-hidden border border-[#2B3452] shrink-0 bg-black group/thumb">
                                <img
                                  src={editingProduct.canonicalCoverUrl}
                                  alt="Course Cover"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProduct({ ...editingProduct, canonicalCoverUrl: '' });
                                    const updatedList = products.map((p) =>
                                      p.id === editingProduct.id ? { ...p, canonicalCoverUrl: '' } : p
                                    );
                                    persistProducts(updatedList);
                                    triggerSaveNotification(`Removed cover image for "${editingProduct.name}".`);
                                  }}
                                  className="absolute inset-0 bg-black/75 text-rose-300 hover:text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                                  title="Delete image"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Course Material (Zip Bundle) */}
                      {editingProduct.type === 'course' && (
                        <div className="pt-2 border-t border-[#1C2540]">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-300 font-semibold block">
                              Course Material (Zip Bundle)
                            </label>
                            <label className="px-2.5 py-0.5 rounded bg-[#2A355A] hover:bg-[#3A4778] text-slate-200 hover:text-white text-[10px] font-mono font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-xs border border-[#3E4F80]">
                              <Upload className="h-3 w-3 text-[#5584B4]" />
                              <span>Upload ZIP File</span>
                              <input
                                type="file"
                                accept=".zip,.rar,.7z,.xlsx,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setEditingProduct({
                                    ...editingProduct,
                                    companionMaterialFilename: file.name,
                                  });
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <input
                            type="text"
                            value={editingProduct.companionMaterialFilename || ''}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                companionMaterialFilename: e.target.value,
                              })
                            }
                            placeholder="Course_Material_Bundle.zip (or upload zip file above)..."
                            className="w-full px-3 py-1.5 bg-[#141A2E] border border-[#2B3452] rounded-lg text-white text-[11px] placeholder-slate-500 focus:outline-none focus:border-[#5584B4]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Course Lessons Below the Panel (lesson name, YouTube link, lesson duration) */}
                    {editingProduct.type === 'course' && (
                      <div className="p-3.5 rounded-xl bg-[#0E1220] border border-[#252E4A] space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1C2540]">
                          <div>
                            <div className="font-bold text-slate-300 uppercase text-[11px] flex items-center gap-2">
                              <span>COURSE LESSONS SYLLABUS</span>
                              <span className="px-2 py-0.5 rounded-full bg-[#5584B4]/20 text-[#DDEBF7] text-[10px] border border-[#5584B4]/30">
                                {(editingProduct.courseLessons || []).length} Lessons
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Upload course curriculum: lesson name, YouTube video link, and lesson duration.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleReloadMasterCurriculum}
                              className="px-3 py-1.5 rounded-lg bg-[#1B233D] hover:bg-[#252F52] text-[#DDEBF7] text-[11px] font-bold flex items-center gap-1.5 transition-colors border border-[#2B3555]"
                              title="Reload the official curriculum lessons (e.g. 7 lessons for Cost Recovery Calculator)"
                            >
                              <RefreshCw className="h-3 w-3 text-[#5584B4]" />
                              <span>Reload Master Lessons</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleAddCourseLesson}
                              className="px-3 py-1.5 rounded-lg bg-[#5584B4] hover:bg-[#4773A0] text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Add Course Lesson</span>
                            </button>
                          </div>
                        </div>

                        {/* List of Lessons */}
                        <div className="space-y-2">
                          {(editingProduct.courseLessons || []).length === 0 ? (
                            <div className="text-center py-6 text-slate-500 border border-dashed border-[#222F4C] rounded-lg">
                              <p className="text-xs">No course lessons created yet.</p>
                              <button
                                type="button"
                                onClick={handleAddCourseLesson}
                                className="mt-2 px-3 py-1 rounded bg-[#1B233D] hover:bg-[#252F52] text-[#DDEBF7] text-xs font-mono"
                              >
                                + Add First Lesson
                              </button>
                            </div>
                          ) : (
                            (editingProduct.courseLessons || []).map((lesson, idx) => (
                              <div
                                key={lesson.id || idx}
                                className="p-2.5 rounded-lg bg-[#141A2E] border border-[#252E4A] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs"
                              >
                                {/* Lesson Number */}
                                <span className="px-2 py-1 rounded bg-[#1A213B] text-[#DDEBF7] font-bold text-[10px] font-mono shrink-0 self-start sm:self-auto">
                                  #{String(idx + 1).padStart(2, '0')}
                                </span>

                                {/* Lesson Name */}
                                <div className="flex-grow">
                                  <input
                                    type="text"
                                    value={lesson.name}
                                    onChange={(e) =>
                                      handleUpdateCourseLesson(lesson.id, 'name', e.target.value)
                                    }
                                    placeholder="Lesson Name (e.g. Lesson 01: The Founder Hypothesis)..."
                                    className="w-full px-2.5 py-1.5 bg-[#0E1220] border border-[#2B3452] rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#5584B4]"
                                  />
                                </div>

                                {/* YouTube Link */}
                                <div className="w-full sm:w-64">
                                  <input
                                    type="text"
                                    value={lesson.youtubeUrl}
                                    onChange={(e) =>
                                      handleUpdateCourseLesson(lesson.id, 'youtubeUrl', e.target.value)
                                    }
                                    placeholder="YouTube Video Link..."
                                    className="w-full px-2.5 py-1.5 bg-[#0E1220] border border-[#2B3452] rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#5584B4]"
                                  />
                                </div>

                                {/* Lesson Duration */}
                                <div className="w-full sm:w-24">
                                  <input
                                    type="text"
                                    value={lesson.duration}
                                    onChange={(e) =>
                                      handleUpdateCourseLesson(lesson.id, 'duration', e.target.value)
                                    }
                                    placeholder="Duration (14:20)"
                                    className="w-full px-2.5 py-1.5 bg-[#0E1220] border border-[#2B3452] rounded-lg text-white text-xs text-center placeholder-slate-500 focus:outline-none focus:border-[#5584B4]"
                                  />
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveCourseLesson(idx, 'up')}
                                    className="p-1.5 rounded bg-[#0E1220] hover:bg-[#1C2540] disabled:opacity-30 text-slate-400 hover:text-white transition-colors"
                                    title="Move up"
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === (editingProduct.courseLessons || []).length - 1}
                                    onClick={() => handleMoveCourseLesson(idx, 'down')}
                                    className="p-1.5 rounded bg-[#0E1220] hover:bg-[#1C2540] disabled:opacity-30 text-slate-400 hover:text-white transition-colors"
                                    title="Move down"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCourseLesson(lesson.id)}
                                    className="p-1.5 rounded bg-[#0E1220] hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
                                    title="Delete lesson"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#252E4A]">
                      <div>
                        {products.some((p) => p.id === editingProduct.id) ? (
                          <button
                            type="button"
                            onClick={() => setProductToDelete(editingProduct)}
                            className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 hover:text-white transition-colors text-xs font-mono font-bold flex items-center gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                            <span>Delete {editingProduct.type === 'course' ? 'Masterclass Course' : 'Solution App'}</span>
                          </button>
                        ) : (
                          <div className="text-[11px] text-slate-400 font-mono">
                            *Adding new {editingProduct.type === 'course' ? 'Masterclass Course' : 'Solution App'} to stage <span className="text-emerald-400 font-bold">{editingProduct.stage}</span> at sequence #{editingProduct.seq}.
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(null)}
                          className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1B233D] transition-colors text-xs font-mono"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] text-white font-bold font-mono transition-colors flex items-center gap-1.5 shadow-sm text-xs"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>Save & Sync into Live Site</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: EDUCATIONAL VIDEOS REPOSITORY (PAGE 1 - EDITABLE & EXTENDABLE)      */}
          {/* ========================================================================= */}
          {activeTab === 'videos' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141A2E] border border-[#222F4C] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-sm font-bold text-white uppercase flex items-center gap-2">
                    <span>YOUTUBE VIDEO UPLOAD & LINK INTEGRATION</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#5584B4]/20 text-[#DDEBF7] border border-[#5584B4]/30">
                      {videos.length} Videos
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Add new masterclasses, edit titles and instructors, and paste stream links from the bizzbean channel.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newId = `vid-${Date.now()}`;
                      unmarkVideoAsDeleted(newId);
                      const newVideo: CmsVideo = {
                        id: newId,
                        title: 'New Executive Masterclass',
                        author: 'the bizzbean channel',
                        duration: '5:00',
                        youtubeUrl: '',
                        isMustWatch: false,
                        category: 'masterclass',
                        linked: true,
                      };
                      const updated = [newVideo, ...videos];
                      setVideos(updated);
                      persistVideos(updated);
                      triggerSaveNotification('New video card added. Fill in title & link, then click Save.');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] text-white text-xs font-bold font-mono transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New Video</span>
                  </button>
                  <div className="px-3 py-2 rounded-xl bg-[#0E1220] text-slate-300 border border-[#222F4C] text-xs font-mono">
                    Controls: Minimal (Ad-Free)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="p-4 rounded-xl bg-[#141A2E] border border-[#222F4C] space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      {/* Top status & delete */}
                      <div className="flex items-center justify-between text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = videos.map((v) =>
                              v.id === vid.id ? { ...v, isMustWatch: !v.isMustWatch } : v
                            );
                            persistVideos(updated);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                            vid.isMustWatch
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-700/40 text-slate-300 border border-transparent hover:border-slate-500'
                          }`}
                          title="Click to toggle Must Watch"
                        >
                          {vid.isMustWatch ? '★ MUST WATCH' : 'REGULAR'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (videos.length <= 1) {
                              triggerSaveNotification('At least one video must remain in repository.');
                              return;
                            }
                            markVideoAsDeleted(vid.id);
                            const updated = videos.filter((v) => v.id !== vid.id);
                            setVideos(updated);
                            persistVideos(updated);
                            triggerSaveNotification(`Deleted "${vid.title}".`);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete video"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Video Title Edit Input */}
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Video Title:</label>
                        <input
                          type="text"
                          value={vid.title}
                          onChange={(e) => {
                            const updated = videos.map((v) =>
                              v.id === vid.id ? { ...v, title: e.target.value } : v
                            );
                            setVideos(updated);
                          }}
                          placeholder="e.g. How to write a perfect elevator pitch"
                          className="w-full px-2.5 py-1.5 bg-[#0E1220] border border-[#2B3452] rounded text-xs font-bold text-white focus:border-[#5584B4] focus:outline-none"
                        />
                      </div>

                      {/* Author & Duration Inputs */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Author / Speaker:</label>
                          <input
                            type="text"
                            value={vid.author}
                            onChange={(e) => {
                              const updated = videos.map((v) =>
                                v.id === vid.id ? { ...v, author: e.target.value } : v
                              );
                              setVideos(updated);
                            }}
                            placeholder="e.g. Rich Mulholland"
                            className="w-full px-2 py-1 bg-[#0E1220] border border-[#2B3452] rounded text-[11px] font-mono text-slate-200 focus:border-[#5584B4] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Duration (m:s):</label>
                          <input
                            type="text"
                            value={vid.duration}
                            onChange={(e) => {
                              const updated = videos.map((v) =>
                                v.id === vid.id ? { ...v, duration: e.target.value } : v
                              );
                              setVideos(updated);
                            }}
                            placeholder="e.g. 5:32"
                            className="w-full px-2 py-1 bg-[#0E1220] border border-[#2B3452] rounded text-[11px] font-mono text-slate-200 focus:border-[#5584B4] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* YouTube Stream Link */}
                      <div className="space-y-1 pt-1 border-t border-[#222F4C]">
                        <label className="text-[10px] font-mono text-slate-400 block">YouTube Stream URL:</label>
                        <input
                          type="text"
                          value={vid.youtubeUrl}
                          onChange={(e) => {
                            const updated = videos.map((v) =>
                              v.id === vid.id ? { ...v, youtubeUrl: e.target.value } : v
                            );
                            setVideos(updated);
                          }}
                          placeholder="https://youtu.be/... or https://youtube.com/watch?v=..."
                          className="w-full px-2.5 py-1.5 bg-[#0E1220] border border-[#2B3452] rounded text-xs font-mono text-slate-200 focus:border-[#5584B4] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Bottom Save bar */}
                    <div className="flex justify-between items-center pt-3 border-t border-[#222F4C] text-xs font-mono">
                      <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Ready</span>
                      </span>
                      <button
                        onClick={() => {
                          unmarkVideoAsDeleted(vid.id);
                          persistVideos(videos);
                          triggerSaveNotification(`Saved "${vid.title}"!`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#5584B4] hover:bg-[#4773A0] text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                      >
                        <Save className="h-3 w-3" />
                        <span>Save Video</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ARTICLES & ANALYSIS REPOSITORY (PAGE 2 - EDITABLE & EXTENDABLE)     */}
          {/* ========================================================================= */}
          {activeTab === 'articles' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141A2E] border border-[#222F4C] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-sm font-bold text-white uppercase flex items-center gap-2">
                    <span>ARTICLES & ANALYSIS REPOSITORY</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#5584B4]/20 text-[#DDEBF7] border border-[#5584B4]/30">
                      {articles.length} Articles
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live repository controlling business education thought-pieces. Add cover images, upload content, and edit details.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newArt: CmsArticle = {
                      id: `art-${Date.now()}`,
                      seq: articles.length + 1,
                      title: 'New Strategic Analysis & Framework',
                      summary: 'Executive brief detailing operational methodologies and financial governance.',
                      author: 'the bizzbean channel',
                      readTime: '4 min read',
                      isMustRead: false,
                      category: 'strategy',
                      imageUrl: '', // NO FALLBACK IMAGE
                      publishedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                      content: `Draft content for this executive brief.\n\nType or upload your full article body here.`,
                    };
                    setEditingArticle(newArt);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Article</span>
                </button>
              </div>

              {/* Articles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {articles.map((art, idx) => (
                  <div
                    key={art.id}
                    className="p-4 rounded-xl bg-[#141A2E] border border-[#222F4C] hover:border-[#5584B4]/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Cover Image Thumbnail (Provision for image per user request) */}
                      {art.imageUrl ? (
                        <div className="relative h-32 -mx-4 -mt-4 mb-3 overflow-hidden rounded-t-xl bg-black/40">
                          <img
                            src={art.imageUrl}
                            alt={art.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#141A2E] via-transparent to-transparent opacity-80" />
                          <div className="absolute top-2 left-2 flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-black/80 text-white border border-[#5584B4]/50 backdrop-blur-xs">
                              #{art.seq || idx + 1}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold backdrop-blur-xs ${
                                art.isMustRead
                                  ? 'bg-amber-500/90 text-white'
                                  : 'bg-slate-900/80 text-slate-200'
                              }`}
                            >
                              {art.isMustRead ? 'MUST READ' : 'STANDARD'}
                            </span>
                          </div>
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveArticle(idx, 'up');
                              }}
                              className="p-1 rounded bg-black/70 hover:bg-black/90 text-slate-200 disabled:opacity-20 cursor-pointer backdrop-blur-xs"
                              title="Move Up in Sequence"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === articles.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveArticle(idx, 'down');
                              }}
                              className="p-1 rounded bg-black/70 hover:bg-black/90 text-slate-200 disabled:opacity-20 cursor-pointer backdrop-blur-xs"
                              title="Move Down in Sequence"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-slate-300 backdrop-blur-xs">
                              {art.readTime}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs font-mono mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs px-2 py-0.5 rounded bg-[#5584B4]/20 text-[#DDEBF7] border border-[#5584B4]/40">
                              #{art.seq || idx + 1}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                art.isMustRead
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-700/40 text-slate-300'
                              }`}
                            >
                              {art.isMustRead ? 'MUST READ' : 'STANDARD'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveArticle(idx, 'up');
                              }}
                              className="p-1 rounded bg-[#0E1220] hover:bg-[#1E2548] text-slate-300 disabled:opacity-20 cursor-pointer"
                              title="Move Up in Sequence"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === articles.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveArticle(idx, 'down');
                              }}
                              className="p-1 rounded bg-[#0E1220] hover:bg-[#1E2548] text-slate-300 disabled:opacity-20 cursor-pointer"
                              title="Move Down in Sequence"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                            <span className="text-slate-400 text-[10px] ml-1">{art.readTime}</span>
                          </div>
                        </div>
                      )}

                      <h3
                        onClick={() => setEditingArticle(art)}
                        className="font-bold text-white text-sm hover:text-[#5584B4] cursor-pointer transition-colors"
                      >
                        {art.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-3">
                        {art.summary}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#222F4C] flex items-center justify-between text-xs font-mono text-slate-400">
                      <div className="flex items-center gap-2">
                        <span>By {art.author}</span>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span>Seq:</span>
                          <input
                            type="number"
                            min="1"
                            max={articles.length}
                            value={art.seq || idx + 1}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 1) {
                                handleMoveArticleSequence(art.id, val);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-10 px-1 py-0.5 bg-[#0E1220] border border-[#2B3452] rounded text-white text-center font-bold text-xs outline-none"
                            title="Directly enter sequence position"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (articles.length <= 1) {
                              triggerSaveNotification('At least one article must remain in repository.');
                              return;
                            }
                            markArticleAsDeleted(art.id);
                            const updated = articles.filter((a) => a.id !== art.id);
                            persistArticles(updated);
                            triggerSaveNotification(`Deleted article "${art.title}".`);
                          }}
                          className="p-1.5 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Article"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingArticle(art)}
                          className="px-2.5 py-1 rounded bg-[#5584B4]/20 hover:bg-[#5584B4] text-[#DDEBF7] hover:text-white transition-colors flex items-center gap-1 font-bold text-[11px]"
                          title="Edit Article"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ARTICLE EDITOR MODAL (Provision for Image, Content Upload & Detail Editing) */}
              {editingArticle && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
                  <div className="relative w-full max-w-3xl max-h-[92vh] bg-[#0E1220] border border-[#2B3452] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="p-4 sm:px-6 border-b border-[#222F4C] bg-[#141A2E] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-[#5584B4] text-white flex items-center justify-center font-bold">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-white uppercase font-mono">
                            {articles.some((a) => a.id === editingArticle.id) ? 'Edit Article & Upload Content' : 'Create New Article'}
                          </h3>
                          <p className="text-[11px] text-slate-400 font-mono">
                            Set sequence position, cover image, author credentials, excerpt, and full body content.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingArticle(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2548]"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Scrollable Form Body */}
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        let finalImage = (editingArticle.imageUrl || '').trim();
                        // Strip legacy unsplash stock fallback URL if present
                        if (finalImage.includes('images.unsplash.com')) {
                          finalImage = '';
                        }
                        if (finalImage.startsWith('data:image')) {
                          try {
                            finalImage = await compressDataUrl(finalImage, 1200, 800, 0.75);
                          } catch (err) {
                            console.warn('Compression error:', err);
                          }
                        }
                        const targetSeq = Math.max(1, editingArticle.seq || (articles.length + 1));
                        const articleToSave: CmsArticle = {
                          ...editingArticle,
                          seq: targetSeq,
                          imageUrl: finalImage,
                        };
                        unmarkArticleAsDeleted(articleToSave.id);

                        let updated: CmsArticle[];
                        const existingIdx = articles.findIndex((a) => a.id === articleToSave.id);
                        if (existingIdx !== -1) {
                          const copy = [...articles];
                          copy.splice(existingIdx, 1);
                          const boundedIdx = Math.max(0, Math.min(copy.length, targetSeq - 1));
                          copy.splice(boundedIdx, 0, articleToSave);
                          updated = copy;
                        } else {
                          const copy = [...articles];
                          const boundedIdx = Math.max(0, Math.min(copy.length, targetSeq - 1));
                          copy.splice(boundedIdx, 0, articleToSave);
                          updated = copy;
                        }
                        persistArticles(updated);
                        triggerSaveNotification(`Saved & published "${articleToSave.title}".`);
                        setEditingArticle(null);
                      }}
                      className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-grow text-xs font-mono"
                    >
                      {/* Row 1: Title and Presentation Sequence */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-3">
                          <label className="text-[11px] font-bold text-slate-300 block mb-1">
                            ARTICLE TITLE:
                          </label>
                          <input
                            type="text"
                            required
                            value={editingArticle.title}
                            onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                            placeholder="e.g. Are you an entrepreneur?"
                            className="w-full px-3 py-2 bg-[#141A2E] border border-[#2B3452] rounded-xl text-white font-bold text-sm focus:border-[#5584B4] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-300 block mb-1">
                            SEQUENCE (#):
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={Math.max(articles.length + 1, 50)}
                            value={editingArticle.seq || 1}
                            onChange={(e) =>
                              setEditingArticle({
                                ...editingArticle,
                                seq: Math.max(1, parseInt(e.target.value, 10) || 1),
                              })
                            }
                            className="w-full px-3 py-2 bg-[#141A2E] border border-[#2B3452] rounded-xl text-white font-bold text-sm text-center focus:border-[#5584B4] focus:outline-none"
                            title="Presentation sequence order on website"
                          />
                        </div>
                      </div>

                      {/* Row 2: Author, Category, Read Time */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-300 block mb-1">
                            AUTHOR / BYLINE:
                          </label>
                          <input
                            type="text"
                            required
                            value={editingArticle.author}
                            onChange={(e) => setEditingArticle({ ...editingArticle, author: e.target.value })}
                            placeholder="e.g. Quentin McCullough"
                            className="w-full px-3 py-2 bg-[#141A2E] border border-[#2B3452] rounded-xl text-slate-200 focus:border-[#5584B4] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-300 block mb-1">
                            CATEGORY / TOPIC:
                          </label>
                          <input
                            type="text"
                            value={editingArticle.category}
                            onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                            placeholder="e.g. mindset, finance, strategy"
                            className="w-full px-3 py-2 bg-[#141A2E] border border-[#2B3452] rounded-xl text-slate-200 focus:border-[#5584B4] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-300 block mb-1">
                            ESTIMATED READ TIME:
                          </label>
                          <input
                            type="text"
                            value={editingArticle.readTime}
                            onChange={(e) => setEditingArticle({ ...editingArticle, readTime: e.target.value })}
                            placeholder="e.g. 3 min read"
                            className="w-full px-3 py-2 bg-[#141A2E] border border-[#2B3452] rounded-xl text-slate-200 focus:border-[#5584B4] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Row 3: Provision for Image (URL, Local File Upload, Preview - No Fallback Images) */}
                      <div className="p-3.5 rounded-2xl bg-[#141A2E] border border-[#2B3452] space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-bold text-white uppercase flex items-center gap-1.5">
                              <ImageIcon className="h-4 w-4 text-[#5584B4]" />
                              <span>ARTICLE COVER IMAGE</span>
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Uploaded images are automatically optimized (~35KB) to save instantly without size limits. No fallback images used.
                            </p>
                          </div>
                          <label className="px-3 py-1.5 rounded-lg bg-[#5584B4] hover:bg-[#4773A0] text-white text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs">
                            <Upload className="h-3.5 w-3.5" />
                            <span>{isCompressingArticleImage ? 'Optimizing Image...' : 'Upload Image from Device'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isCompressingArticleImage}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  setIsCompressingArticleImage(true);
                                  const compressed = await compressImageFile(file, 1200, 800, 0.75);
                                  setEditingArticle({ ...editingArticle, imageUrl: compressed });
                                } catch (err) {
                                  console.warn('Failed to compress image:', err);
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target?.result) {
                                      setEditingArticle({ ...editingArticle, imageUrl: event.target.result as string });
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                } finally {
                                  setIsCompressingArticleImage(false);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                          <div className="sm:col-span-2 space-y-2">
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-1">Or paste Image URL / Data URI:</span>
                              <input
                                type="text"
                                value={editingArticle.imageUrl || ''}
                                onChange={(e) => setEditingArticle({ ...editingArticle, imageUrl: e.target.value })}
                                placeholder="https://... or data:image/..."
                                className="w-full px-3 py-2 bg-[#0E1220] border border-[#2B3452] rounded-xl text-slate-200 text-xs focus:border-[#5584B4] focus:outline-none"
                              />
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                              {editingArticle.imageUrl ? (
                                <>
                                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Image attached</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingArticle({ ...editingArticle, imageUrl: '' })}
                                    className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] transition-colors border border-rose-500/30 font-semibold"
                                  >
                                    Remove / Clear Image
                                  </button>
                                </>
                              ) : (
                                <span className="text-slate-400 text-[10px]">
                                  No image attached (no fallback image used)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Thumbnail Preview */}
                          <div className="relative h-24 rounded-xl border border-[#2B3452] overflow-hidden bg-black/40 flex items-center justify-center">
                            {editingArticle.imageUrl ? (
                              <>
                                <img
                                  src={editingArticle.imageUrl}
                                  alt="Cover preview"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditingArticle({ ...editingArticle, imageUrl: '' })}
                                  className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-slate-300 hover:text-white"
                                  title="Remove image"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </>
                            ) : (
                              <div className="text-center p-2 text-slate-500 text-[10px]">
                                <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-50" />
                                No image selected
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Row 4: Summary */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">
                          EXCERPT / HOOK SUMMARY:
                        </label>
                        <textarea
                          rows={2}
                          value={editingArticle.summary}
                          onChange={(e) => setEditingArticle({ ...editingArticle, summary: e.target.value })}
                          placeholder="Brief introduction or key thesis..."
                          className="w-full px-3 py-2 bg-[#141A2E] border border-[#2B3452] rounded-xl text-slate-200 focus:border-[#5584B4] focus:outline-none"
                        />
                      </div>

                      {/* Row 5: Full Article Body Content with Upload Content File Support */}
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <label className="text-[11px] font-bold text-slate-300">
                            ARTICLE BODY CONTENT:
                          </label>
                          <label className="px-2.5 py-1 rounded bg-[#0E1220] hover:bg-[#1E2548] border border-[#2B3452] text-[10px] text-slate-300 cursor-pointer transition-colors flex items-center gap-1">
                            <Upload className="h-3 w-3 text-[#5584B4]" />
                            <span>Upload Content File (.txt, .md)</span>
                            <input
                              type="file"
                              accept=".txt,.md,.text"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setEditingArticle({ ...editingArticle, content: event.target.result as string });
                                  }
                                };
                                reader.readAsText(file);
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <textarea
                          rows={6}
                          value={editingArticle.content || ''}
                          onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                          placeholder="Type or paste the full article body here..."
                          className="w-full px-3 py-2 bg-[#141A2E] border border-[#2B3452] rounded-xl text-slate-200 focus:border-[#5584B4] focus:outline-none font-sans leading-relaxed"
                        />
                      </div>

                      {/* Row 6: Must Read Checkbox */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="isMustReadCheckbox"
                          checked={editingArticle.isMustRead}
                          onChange={(e) => setEditingArticle({ ...editingArticle, isMustRead: e.target.checked })}
                          className="rounded border-[#2B3452] bg-[#141A2E] text-[#5584B4] h-4 w-4"
                        />
                        <label htmlFor="isMustReadCheckbox" className="text-slate-300 text-xs cursor-pointer select-none">
                          Highlight as <span className="font-bold text-amber-300">MUST READ</span> on website & knowledge base
                        </label>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#222F4C]">
                        <button
                          type="button"
                          onClick={() => {
                            if (articles.some((a) => a.id === editingArticle.id)) {
                              if (articles.length <= 1) {
                                triggerSaveNotification('At least one article must remain in repository.');
                                return;
                              }
                              const updated = articles.filter((a) => a.id !== editingArticle.id);
                              persistArticles(updated);
                              triggerSaveNotification(`Deleted "${editingArticle.title}".`);
                              setEditingArticle(null);
                            } else {
                              setEditingArticle(null);
                            }
                          }}
                          className="px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Article</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingArticle(null)}
                            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1E2548] transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] text-white font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <Save className="h-4 w-4" />
                            <span>Save & Publish Article</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: PROMOTIONAL BILLBOARDS / HERO SCREENS & STAGE STORY MESSAGE BOARDS */}
          {/* ========================================================================= */}
          {activeTab === 'promotions' && (
            <div className="space-y-4">
              {/* Toolbar: Stats, Search, Add Board, Reset, Save All */}
              <div className="p-4 rounded-xl bg-[#141A2E] border border-[#222F4C] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-sm font-bold text-white uppercase flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span>HERO PROMOTIONS & STAGE STORY MESSAGE BOARDS ({promotions.length} BOARDS)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {promotions.filter((p) => p.imageUrl && p.imageUrl.trim() !== '' && p.isActive).length} / {promotions.length} Active in Rotation
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Craft the stage copy and supporting message boards displayed beneath each hero image. Changes here sync directly to the live Hero Splash Page and Stage Stories.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Search bar */}
                  <div className="relative w-48 sm:w-56">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={promotionsSearch}
                      onChange={(e) => setPromotionsSearch(e.target.value)}
                      placeholder="Search message boards..."
                      className="w-full pl-8 pr-3 py-1 bg-[#0E1220] border border-[#2B3452] rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#5584B4]"
                    />
                  </div>

                  <button
                    onClick={handleCreatePromotion}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Add a new custom stage story message board"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Add Message Board</span>
                  </button>

                  <button
                    onClick={() => {
                      persistPromotions(INITIAL_CMS_PROMOTIONS, {
                        syncImmediateFirestore: true,
                        onSuccessMsg: 'Restored and cloud-synced default curated landscape photography and stage story copy.',
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#1E2548] hover:bg-[#252E4A] text-slate-300 hover:text-white text-xs font-mono transition-colors flex items-center gap-1.5"
                    title="Reset all message boards to official curated defaults"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Reset All to Defaults</span>
                  </button>

                  <button
                    onClick={() => {
                      persistPromotions(promotions, {
                        syncImmediateFirestore: true,
                        onSuccessMsg: 'Saved all promotional stage story boards to cloud database & live website!',
                      });
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#5584B4] hover:bg-[#4773A0] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save All Promotions</span>
                  </button>

                  <button
                    onClick={handlePublishToLiveSite}
                    disabled={isPublishing}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm border border-blue-400/40"
                    title="Publish all updated stage story boards directly to the live website and database"
                  >
                    {isPublishing ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5 text-blue-100" />
                        <span>Publish to Live Site</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExportForGitHub}
                    disabled={isExporting}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm border border-emerald-400/40"
                    title="Export updated stage images & stories to cmsConsoleData.ts for GitHub"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-100" />
                    <span>Export for GitHub</span>
                  </button>
                </div>
              </div>

              {/* Live Site Publishing Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/30 to-indigo-950/30 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start sm:items-center gap-2.5 text-slate-300">
                  <Upload className="h-4 w-4 text-blue-400 shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    <strong className="text-blue-300 font-mono">Live Site Publishing:</strong> To see newly updated stage images (e.g. <strong className="text-white">vi-ABILITY</strong> stage cover) or course content on your live website, click <strong className="text-blue-300 font-mono">Publish to Live Site</strong>. All visitors immediately receive the live cloud updates.
                  </span>
                </div>
                <button
                  onClick={handlePublishToLiveSite}
                  disabled={isPublishing}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="h-3 w-3" />
                  <span>Publish to Live Site</span>
                </button>
              </div>

              {/* Message Boards Grid */}
              <div className="grid grid-cols-1 gap-6">
                {promotions
                  .filter((p) => {
                    if (!promotionsSearch.trim()) return true;
                    const q = promotionsSearch.toLowerCase();
                    return (
                      p.name.toLowerCase().includes(q) ||
                      p.displayName.toLowerCase().includes(q) ||
                      p.tagline.toLowerCase().includes(q) ||
                      (p.stageStory?.narrative && p.stageStory.narrative.toLowerCase().includes(q)) ||
                      (p.stageStory?.stageChallenge && p.stageStory.stageChallenge.toLowerCase().includes(q)) ||
                      (p.stageStory?.milestone && p.stageStory.milestone.toLowerCase().includes(q)) ||
                      (p.stageStory?.keyDeliverable && p.stageStory.keyDeliverable.toLowerCase().includes(q))
                    );
                  })
                  .map((promo) => {
                    const hasImage = Boolean(
                      promo.imageUrl &&
                      promo.imageUrl.trim() !== '' &&
                      !promo.imageUrl.includes('images.unsplash.com') &&
                      !promo.imageUrl.includes('1553877522-43269d4ea984')
                    );

                    return (
                      <div
                        key={promo.id}
                        className={`p-5 rounded-2xl bg-[#141A2E] border transition-all space-y-4 ${
                          hasImage && promo.isActive
                            ? 'border-[#222F4C] hover:border-[#5584B4]/50'
                            : 'border-amber-500/30 bg-[#161C2C]'
                        }`}
                      >
                        {/* 1. Header: Display Name input, Target selector, Rotation Pill, Delete Board */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#222F4C] gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-slate-400 uppercase">Stage Title:</span>
                            <input
                              type="text"
                              value={promo.displayName}
                              onChange={(e) => handleUpdatePromoField(promo.id, { displayName: e.target.value })}
                              className="font-bold text-white text-sm sm:text-base bg-[#0E1220] border border-[#2B3452] hover:border-[#5584B4] focus:border-[#5584B4] focus:outline-none px-3 py-1 rounded-lg font-sans"
                              placeholder="e.g. vi-ability · stage 01"
                            />
                            <div className="flex items-center gap-1.5 text-xs font-mono">
                              <span className="text-slate-400">Target:</span>
                              <select
                                value={promo.targetId}
                                onChange={(e) => {
                                  const targetId = e.target.value;
                                  const isKb = ['dialogue', 'library'].includes(targetId);
                                  handleUpdatePromoField(promo.id, {
                                    targetId,
                                    targetType: isKb ? 'knowledge-base' : 'solution',
                                    targetTab: isKb ? (targetId as any) : undefined,
                                  });
                                }}
                                className="px-2.5 py-1 bg-[#0E1220] border border-[#2B3452] rounded-lg text-slate-200 text-xs font-mono focus:border-[#5584B4] focus:outline-none"
                              >
                                <option value="vi-ability">1. Vi-Ability (Unit Economics)</option>
                                <option value="fund-ability">2. Fund-Ability (3-Statement Model)</option>
                                <option value="sustain-ability">3. Sustain-Ability (Cash Runway)</option>
                                <option value="invest-ability">4. Invest-Ability (Data Room)</option>
                                <option value="personal-sandbox">Personal Sandbox (Cockpit)</option>
                                <option value="bizzmoney">Bizzmoney (Double-Entry Ledger)</option>
                                <option value="bizzbudget">Bizzbudget (Cash Variance Engine)</option>
                                <option value="budget">Bizzbudget (Alias / Variance Engine)</option>
                                <option value="bizzoptimizer">Bizzoptimizer (Margin Trimmer)</option>
                                <option value="strategy">Growth Strategy (Scenario Modeler)</option>
                                <option value="critical-thinking">Critical Thinking (Socratic Defense)</option>
                                <option value="machine-based-learning">Machine Learning (AI Literacy)</option>
                                <option value="dialogue">GIM Dialogue (Executive Advisory)</option>
                                <option value="library">Sandbox Knowledge Vault (Library)</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                                hasImage && promo.isActive
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {hasImage && promo.isActive ? 'Active in Rotation' : 'Skipped (No Image)'}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleDeletePromotion(promo.id)}
                              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 text-rose-300 transition-colors"
                              title="Delete this message board from rotation"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* 2. Middle Row: Pristine Image Preview (Left) & Metadata / Rotation Controls (Right) */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          {/* Left 5 Cols: Clean Image Preview & Image Management */}
                          <div className="md:col-span-5 space-y-2">
                            <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                              Hero Image (100% Clean: No wording or buttons):
                            </div>
                            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-black/50 border border-[#2B3452] flex items-center justify-center">
                              {hasImage ? (
                                <img
                                  src={promo.imageUrl}
                                  alt={promo.displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-center p-4 space-y-1">
                                  <ImageIcon className="h-6 w-6 mx-auto text-amber-400/60" />
                                  <div className="text-[11px] font-bold text-amber-300 font-mono">
                                    NO IMAGE LOADED
                                  </div>
                                  <div className="text-[9px] text-slate-400 font-mono">
                                    Upload JPG or enter URL below.
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1">
                              <label className="px-2.5 py-1 rounded bg-[#5584B4] hover:bg-[#4773A0] text-white text-[10px] font-mono font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-xs">
                                <Upload className="h-3 w-3" />
                                <span>Upload JPG</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                      const compressed = await compressImageFile(file, 800, 480, 0.65);
                                      handleUpdatePromoField(promo.id, {
                                        imageUrl: compressed,
                                        isActive: true,
                                      });
                                      triggerSaveNotification(`Uploaded & saved image for "${promo.displayName || promo.name}".`);
                                    } catch {
                                      const reader = new FileReader();
                                      reader.onload = async (event) => {
                                        if (event.target?.result) {
                                          const raw = event.target.result as string;
                                          const compressed = await compressDataUrl(raw, 800, 480, 0.65).catch(() => raw);
                                          handleUpdatePromoField(promo.id, {
                                            imageUrl: compressed,
                                            isActive: true,
                                          });
                                          triggerSaveNotification(`Uploaded & saved image for "${promo.displayName || promo.name}".`);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                    e.target.value = '';
                                  }}
                                  className="hidden"
                                />
                              </label>

                              {hasImage && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdatePromoField(promo.id, { imageUrl: '' });
                                    triggerSaveNotification(`Removed image for "${promo.displayName}".`);
                                  }}
                                  className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[10px] font-mono transition-colors flex items-center gap-1"
                                  title="Delete image (Section will be skipped in rotation)"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Clear Image</span>
                                </button>
                              )}
                            </div>

                            <input
                              type="text"
                              value={promo.imageUrl || ''}
                              onChange={(e) => handleUpdatePromoField(promo.id, { imageUrl: e.target.value })}
                              placeholder="Or paste image URL (https://...)..."
                              className="w-full px-2.5 py-1 bg-[#0E1220] border border-[#2B3452] rounded-lg text-[11px] font-mono text-slate-200 focus:border-[#5584B4] focus:outline-none"
                            />
                          </div>

                          {/* Right 7 Cols: Tagline Hook, Button CTA, and Rotation */}
                          <div className="md:col-span-7 space-y-3 flex flex-col justify-between">
                            <div className="space-y-2.5">
                              <div>
                                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                                  Stage Story Hook / Tagline:
                                </label>
                                <input
                                  type="text"
                                  value={promo.tagline}
                                  onChange={(e) => handleUpdatePromoField(promo.id, { tagline: e.target.value })}
                                  placeholder="Punchy one-line hook displayed under stage title..."
                                  className="w-full px-3 py-1.5 bg-[#0E1220] border border-[#2B3452] rounded-lg text-xs font-mono text-slate-200 focus:border-[#5584B4] focus:outline-none"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                                    Button CTA Text:
                                  </label>
                                  <input
                                    type="text"
                                    value={promo.buttonText}
                                    onChange={(e) => handleUpdatePromoField(promo.id, { buttonText: e.target.value })}
                                    placeholder="e.g. explore vi-ability"
                                    className="w-full px-3 py-1.5 bg-[#0E1220] border border-[#2B3452] rounded-lg text-xs font-mono text-slate-200 focus:border-[#5584B4] focus:outline-none"
                                  />
                                </div>

                                <div className="flex items-end pb-1.5">
                                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-300">
                                    <input
                                      type="checkbox"
                                      checked={promo.isActive}
                                      onChange={(e) => handleUpdatePromoField(promo.id, { isActive: e.target.checked })}
                                      className="rounded border-[#2B3452] bg-[#0E1220] text-[#5584B4] h-4 w-4"
                                    />
                                    <span>Enable in door opening rotation</span>
                                  </label>
                                </div>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-[#0E1220] border border-[#252E4A] text-[11px] font-mono text-slate-400">
                              <span className="text-[#5584B4] font-bold">Action preview:</span> Clicking `{promo.buttonText || 'explore'}` navigates the founder directly to <span className="text-white font-bold">{promo.targetId}</span> in the workspace.
                            </div>
                          </div>
                        </div>

                        {/* 3. THE 3 STAGE STORY MESSAGE BOARDS & NARRATIVE (The Core Feature) */}
                        <div className="p-4 rounded-xl bg-[#0E1220] border border-[#2B3452] space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-[#252E4A]">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                                STAGE STORY MESSAGE BOARDS & NARRATIVE COPY
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              Appears directly beneath hero image
                            </span>
                          </div>

                          {/* Main Stage Narrative */}
                          <div>
                            <label className="text-[11px] font-mono text-slate-300 block mb-1 font-semibold">
                              Main Stage Story Narrative:
                            </label>
                            <textarea
                              rows={3}
                              value={promo.stageStory?.narrative || ''}
                              onChange={(e) => handleUpdatePromoStageStory(promo.id, 'narrative', e.target.value)}
                              placeholder="Write the comprehensive stage narrative explaining why this stage matters, the founder journey context, and the strategic objective..."
                              className="w-full p-2.5 bg-[#141A2E] border border-[#2B3452] rounded-xl text-xs font-sans text-slate-100 focus:border-[#5584B4] focus:outline-none leading-relaxed"
                            />
                          </div>

                          {/* The 3 Message Boards / Pillar Cards */}
                          <div className="space-y-1.5">
                            <div className="text-[11px] font-mono text-slate-300 font-semibold uppercase">
                              The 3 Supporting Message Boards (The 3 Pillar Cards):
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Board 1: Stage Challenge */}
                              <div className="p-3 rounded-xl bg-[#141A2E] border border-amber-500/30 space-y-1.5">
                                <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  <span>BOARD 1: STAGE CHALLENGE</span>
                                </div>
                                <textarea
                                  rows={3}
                                  value={promo.stageStory?.stageChallenge || ''}
                                  onChange={(e) => handleUpdatePromoStageStory(promo.id, 'stageChallenge', e.target.value)}
                                  placeholder="Founder challenge, reality, or market risk addressed..."
                                  className="w-full p-2 bg-[#0E1220] border border-amber-500/30 rounded-lg text-xs font-mono text-slate-200 focus:border-amber-400 focus:outline-none"
                                />
                              </div>

                              {/* Board 2: Growth Milestone */}
                              <div className="p-3 rounded-xl bg-[#141A2E] border border-emerald-500/30 space-y-1.5">
                                <div className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>BOARD 2: MILESTONE TO ADVANCE</span>
                                </div>
                                <textarea
                                  rows={3}
                                  value={promo.stageStory?.milestone || ''}
                                  onChange={(e) => handleUpdatePromoStageStory(promo.id, 'milestone', e.target.value)}
                                  placeholder="Quantitative milestone required to graduate to next stage..."
                                  className="w-full p-2 bg-[#0E1220] border border-emerald-500/30 rounded-lg text-xs font-mono text-slate-200 focus:border-emerald-400 focus:outline-none"
                                />
                              </div>

                              {/* Board 3: Institutional Asset */}
                              <div className="p-3 rounded-xl bg-[#141A2E] border border-[#5584B4]/40 space-y-1.5">
                                <div className="text-[11px] font-mono font-bold text-[#DDEBF7] uppercase tracking-wide flex items-center gap-1.5">
                                  <Layers className="h-3.5 w-3.5 text-[#5584B4]" />
                                  <span>BOARD 3: INSTITUTIONAL ASSET</span>
                                </div>
                                <textarea
                                  rows={3}
                                  value={promo.stageStory?.keyDeliverable || ''}
                                  onChange={(e) => handleUpdatePromoStageStory(promo.id, 'keyDeliverable', e.target.value)}
                                  placeholder="Institutional model, worksheet, or tangible asset created..."
                                  className="w-full p-2 bg-[#0E1220] border border-[#5584B4]/40 rounded-lg text-xs font-mono text-slate-200 focus:border-[#5584B4] focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 4. Live Visual Preview of the Supporting Panel */}
                        <div className="p-4 rounded-xl bg-[#090C14] border border-[#1E2548] space-y-3">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
                            <span>Live Preview · Supporting Panel on Hero Splash Page:</span>
                            <span className="text-amber-400 font-bold">100% Real-Time</span>
                          </div>

                          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#141A2E] border border-[#D8CEBC] dark:border-[#252E4A] shadow-xs space-y-4">
                            <div className="space-y-1">
                              <div className="text-[10px] font-mono text-[#5584B4] tracking-wider font-semibold">
                                THE STAGE STORY · {promo.displayName}
                              </div>
                              <h4 className="text-lg font-bold font-sans text-slate-900 dark:text-white">
                                {promo.displayName}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans font-medium">
                                {promo.stageStory?.narrative || promo.tagline}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#0E1220] border border-[#E8E2D8] dark:border-[#222F4C]">
                                <div className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">STAGE CHALLENGE</div>
                                <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-2">
                                  {promo.stageStory?.stageChallenge || promo.tagline}
                                </div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#0E1220] border border-[#E8E2D8] dark:border-[#222F4C]">
                                <div className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">MILESTONE TO ADVANCE</div>
                                <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-2">
                                  {promo.stageStory?.milestone || 'Quantitative model calibration.'}
                                </div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#0E1220] border border-[#E8E2D8] dark:border-[#222F4C]">
                                <div className="text-[9px] font-mono font-bold text-[#5584B4] uppercase">INSTITUTIONAL ASSET</div>
                                <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-2">
                                  {promo.stageStory?.keyDeliverable || 'Institutional model.'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D8] dark:border-[#222F4C] text-[10px] font-mono">
                              <span className="text-slate-400">Buttons appear below the image</span>
                              <span className="px-3 py-1 rounded-lg bg-[#5584B4] text-white font-bold">
                                {promo.buttonText || `explore ${promo.name}`} →
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 5. Footer: Save Card */}
                        <div className="pt-3 border-t border-[#222F4C] flex items-center justify-between">
                          <span className="text-[11px] font-mono text-slate-400 lowercase">
                            section: <strong className="text-white">{promo.name}</strong> · destination: <strong className="text-[#5584B4]">{promo.targetId}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSaveSinglePromo(promo)}
                            className="px-4 py-2 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            <Save className="h-3.5 w-3.5" />
                            <span>Save Stage Copy & Image</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: BOOK & WORKBOOK BUNDLE (PAGE 4 - LEAVE AS IS)                      */}
          {/* ========================================================================= */}
          {activeTab === 'book' && (
            <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-[#141A2E] border border-[#222F4C] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222F4C]">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#5584B4]">OFFICIAL PUBLICATION</span>
                  <h3 className="text-base font-bold text-white uppercase">{bookBundle.title}</h3>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                  Suite Active
                </span>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1">Publication Subtitle</label>
                  <input
                    type="text"
                    value={bookBundle.subtitle}
                    onChange={(e) => setBookBundle({ ...bookBundle, subtitle: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#0E1220] border border-[#2B3452] rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Companion Excel Workbook Suite Filename</label>
                  <input
                    type="text"
                    value={bookBundle.workbookFilename}
                    onChange={(e) => setBookBundle({ ...bookBundle, workbookFilename: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#0E1220] border border-[#2B3452] rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">YouTube Walkthrough / Review Video Stream</label>
                  <input
                    type="text"
                    value={bookBundle.youtubeVideoUrl}
                    onChange={(e) => setBookBundle({ ...bookBundle, youtubeVideoUrl: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#0E1220] border border-[#2B3452] rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#222F4C] flex justify-end">
                <button
                  onClick={() => triggerSaveNotification('Book & workbook bundle configuration saved.')}
                  className="px-4 py-2 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] text-white text-xs font-bold font-mono flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Bundle Link & Configuration</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: ADMINISTRATION CENTRE (AUTHORIZED PERSONNEL ONLY)                  */}
          {/* ========================================================================= */}
          {activeTab === 'admin' && (
            <div className="space-y-5">
              
              {/* Admin Sub-Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#222F4C]">
                {[
                  { id: 'inquiries', label: 'Talk To Us Dialogue Centre', icon: Mail, count: inquiries.length },
                  { id: 'associates', label: 'Associate Bulk Import & Sandboxes', icon: Users, count: associateBatches.length },
                  { id: 'sponsors', label: 'Corporate Sponsorship Accounts', icon: DollarSign, count: sponsors.length },
                  { id: 'transactions', label: 'Transactions Journal', icon: FileText, count: transactions.length },
                  { id: 'policies', label: 'Regulatory Policies Registry', icon: ShieldCheck, count: policies.length },
                  { id: 'tooltips', label: "Bizzy's App Learning Guides", icon: HelpCircle, count: tooltips.length },
                ].map((sub) => {
                  const Icon = sub.icon;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setAdminSubTab(sub.id as any)}
                      className={`px-3 py-2 text-xs font-mono rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        adminSubTab === sub.id
                          ? 'bg-[#1E2745] text-white font-bold border-[#5584B4]'
                          : 'bg-[#13182C] text-slate-400 hover:text-white border-[#222F4C]'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 text-[#5584B4]" />
                      <span>{sub.label}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#222D4F] text-slate-300">
                        {sub.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-tab 1: Talk to Us Dialogue Response Centre */}
              {adminSubTab === 'inquiries' && (
                <div className="space-y-3">
                  <div className="text-xs font-mono text-slate-400 uppercase">
                    FOUNDER INQUIRIES & ADVISORY ESCALATIONS ({inquiries.length})
                  </div>
                  <div className="space-y-2">
                    {inquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="p-4 rounded-xl bg-[#141A2E] border border-[#222F4C] space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-white">{inq.senderName} ({inq.senderEmail})</span>
                          <span className="text-slate-400">{inq.date}</span>
                        </div>
                        <div className="text-xs font-semibold text-[#DDEBF7]">{inq.subject}</div>
                        <p className="text-xs text-slate-300 leading-relaxed bg-[#0E1220] p-3 rounded-lg border border-[#252E4A]">
                          "{inq.message}"
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-1 text-xs font-mono">
                          <button
                            onClick={() => triggerSaveNotification(`Dispatched response to ${inq.senderEmail}`)}
                            className="px-3 py-1 rounded bg-[#5584B4] hover:bg-[#4773A0] text-white font-bold"
                          >
                            Reply from GIM Desk
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Associate Bulk Import */}
              {adminSubTab === 'associates' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-[#141A2E] border border-[#222F4C] flex justify-between items-center">
                    <div>
                      <div className="font-mono text-xs font-bold text-white uppercase">
                        ASSOCIATE & INCUBATOR BULK IMPORT
                      </div>
                      <p className="text-xs text-slate-400">
                        Upload CSV lists of cohort founders to automatically provision sandbox accounts and grant token packs.
                      </p>
                    </div>
                    <button
                      onClick={() => triggerSaveNotification('Cohort batch provisioned with 500 BizzTokens each.')}
                      className="px-3 py-1.5 rounded-lg bg-[#5584B4] text-white text-xs font-mono font-bold"
                    >
                      + Import CSV Cohort
                    </button>
                  </div>

                  <div className="space-y-2">
                    {associateBatches.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-xl bg-[#141A2E] border border-[#222F4C] flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <div className="font-bold text-white">{b.batchName}</div>
                          <div className="text-slate-400 text-[11px]">{b.organization} · {b.candidateCount} Founders · {b.tokensPerAccount} Tokens</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold">
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Corporate Sponsors */}
              {adminSubTab === 'sponsors' && (
                <div className="space-y-3">
                  <div className="text-xs font-mono text-slate-400 uppercase">
                    CORPORATE & INSTITUTIONAL SPONSORS
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sponsors.map((sp) => (
                      <div
                        key={sp.id}
                        className="p-4 rounded-xl bg-[#141A2E] border border-[#222F4C] space-y-2 text-xs font-mono"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white">{sp.sponsorName}</span>
                          <span className="px-2 py-0.5 rounded bg-[#5584B4]/20 text-[#DDEBF7] text-[10px]">
                            {sp.tier}
                          </span>
                        </div>
                        <div className="text-slate-300">Sponsored Seats: {sp.sponsoredSeats} Entrepreneurs</div>
                        <div className="text-slate-400 text-[11px]">Lead: {sp.contactPerson}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 4: Transactions Journal */}
              {adminSubTab === 'transactions' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono text-slate-400 uppercase">
                      OFFICIAL V1 TRANSACTION JOURNAL & SARS GENERAL LEDGER
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400 font-bold">
                      Total Gross Invoiced: R{' '}
                      {v1Transactions.reduce((acc, t) => acc + (t.invoiceValue || 0), 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#222F4C] overflow-hidden bg-[#13182C]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#182038] text-slate-400 text-[11px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Invoice #</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-3">Product (SKU)</th>
                          <th className="py-2.5 px-2 text-center">Type</th>
                          <th className="py-2.5 px-2 text-center">Qty</th>
                          <th className="py-2.5 px-3 text-right">Line Value</th>
                          <th className="py-2.5 px-3 text-right">VAT (15%)</th>
                          <th className="py-2.5 px-3 text-right">Gross Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1D2644]">
                        {v1Transactions.map((tx) => (
                          <tr key={tx.invoiceNumber} className="hover:bg-[#182038]/50">
                            <td className="py-2.5 px-3 text-[#5584B4] font-bold">{tx.invoiceNumber}</td>
                            <td className="py-2.5 px-3 text-slate-400">{tx.transactionDate}</td>
                            <td className="py-2.5 px-3">
                              <span className="text-white font-medium">{tx.customer}</span>
                              <span className="text-[10px] text-slate-500 block">{tx.customerEmail}</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              <span>{tx.productName}</span>
                              <span className="text-[10px] text-slate-500 block font-mono">{tx.sku}</span>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                                  tx.productType === 'app'
                                    ? 'bg-indigo-500/20 text-indigo-300'
                                    : 'bg-purple-500/20 text-purple-300'
                                }`}
                              >
                                {tx.productType}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-300">{tx.quantity}</td>
                            <td className="py-2.5 px-3 text-right text-slate-300">
                              R {tx.lineValue.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-amber-400">
                              R {tx.vatAmount.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                              R {tx.invoiceValue.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 5: Policies Registry */}
              {adminSubTab === 'policies' && (
                <div className="space-y-3">
                  <div className="text-xs font-mono text-slate-400 uppercase">
                    WEBSITE REGULATORY & GOVERNANCE POLICIES
                  </div>
                  <div className="space-y-2">
                    {policies.map((pol) => (
                      <div
                        key={pol.id}
                        className="p-3.5 rounded-xl bg-[#141A2E] border border-[#222F4C] flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <div className="font-bold text-white">{pol.title}</div>
                          <div className="text-slate-400 text-[11px]">{pol.category} · Version {pol.version} · Updated {pol.lastUpdated}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold">
                          {pol.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 6: Bizzy's Learning Guides */}
              {adminSubTab === 'tooltips' && (
                <div className="space-y-3">
                  <div className="text-xs font-mono text-slate-400 uppercase">
                    BIZZY APP-PAGES LEARNING GUIDES & TOOLTIP PROMPTS
                  </div>
                  <div className="space-y-2">
                    {tooltips.map((tip) => (
                      <div
                        key={tip.id}
                        className="p-3.5 rounded-xl bg-[#141A2E] border border-[#222F4C] space-y-1 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between text-[#5584B4] font-bold">
                          <span>{tip.headline}</span>
                          <span className="text-slate-400 text-[10px]">{tip.pageRoute}</span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed">
                          "{tip.promptGuidance}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: CHART OF ACCOUNTS (COA) MASTER GOVERNANCE SYSTEM                   */}
          {/* ========================================================================= */}
          {activeTab === 'coa' && (
            <div className="space-y-4">
              <CoaManagementView theme="dark" isAdmin={true} />
            </div>
          )}

        </div>

        {/* Bottom Status Bar */}
        <div className="p-3 px-6 border-t border-[#222F4C] bg-[#141A2E] flex justify-between items-center text-xs font-mono text-slate-400 shrink-0">
          <span>Single Point of Truth · Firebase Firestore Active</span>
          <span className="text-[#DDEBF7]">CMS Console v2.4</span>
        </div>

        {/* DELETE PRODUCT / COURSE CONFIRMATION MODAL */}
        {productToDelete && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-2xl bg-[#141A2E] border-2 border-rose-500/60 p-6 shadow-2xl space-y-4 text-slate-100 font-mono">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Delete {productToDelete.type === 'course' ? 'Masterclass Course' : 'Solution App'}?
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    This action will permanently delete this item from the Master Matrix, stage presentation sequence, and the live bizz-DESK website.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0E1220] border border-[#252E4A] space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Name:</span>
                  <span className="font-bold text-white truncate max-w-[200px]">{productToDelete.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">SKU / Type:</span>
                  <span className="text-[#DDEBF7] font-bold">{productToDelete.sku} ({productToDelete.type.toUpperCase()})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Stage:</span>
                  <span className="text-emerald-400 capitalize">{productToDelete.stage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Presentation Seq:</span>
                  <span className="text-amber-400 font-bold">#{productToDelete.seq}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Selling Price:</span>
                  <span className="text-white font-bold">R {productToDelete.sellingPriceZAR.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-amber-500/10 border border-amber-500/25 p-2.5 rounded-lg text-amber-200/90 leading-relaxed">
                *Remaining products in {productToDelete.stage} will be automatically re-sequenced (1, 2, 3...) so your presentation order stays consistent.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-[#1B233D] hover:bg-[#252F52] text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDeleteProduct(productToDelete.id)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-rose-950/50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* GITHUB EXPORT & COMMIT REMINDER MODAL DIALOG                             */}
        {/* ========================================================================= */}
        {showGitHubModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
            <div className="relative w-full max-w-2xl rounded-2xl border border-emerald-500/40 bg-[#0E1322] shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
              
              {/* Header */}
              <div className="p-4 sm:px-6 bg-[#131B30] border-b border-[#222F4C] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shadow-inner">
                    <Download className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span>cmsConsoleData.ts Exported</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Ready for GitHub
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Generated at {lastExportedTimestamp || 'now'} · Download has started automatically
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGitHubModal(false)}
                  className="p-2 rounded-xl bg-[#1B233D] hover:bg-[#252F52] text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs font-sans">
                
                {/* Important Notice Callout */}
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <GitBranch className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>CRITICAL STEP: Commit this file to GitHub</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Because your live website is deployed from your GitHub repository, browser CMS changes are stored locally until committed.
                    The downloaded <strong className="text-emerald-300 font-mono">cmsConsoleData.ts</strong> file contains all your latest changes. Uploading it to GitHub is what applies them permanently to the live site.
                  </p>
                </div>

                {/* Scope Coverage Confirmation (Answering the user's explicit question) */}
                <div className="p-4 rounded-xl bg-[#141A2E] border border-[#222F4C] space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-200 font-bold text-xs uppercase tracking-wide">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Will this apply to ALL CMS console data, including pricing & content?</span>
                  </div>
                  <div className="text-emerald-300 font-semibold text-xs flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>YES! Everything currently in this CMS is included in the exported file:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2.5 rounded-lg bg-[#0E1220] border border-[#222F4C] flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">1.</span>
                      <div>
                        <div className="text-white font-bold">Images & Covers</div>
                        <div className="text-slate-400 text-[10px]">
                          Stage banners (e.g. vi-ABILITY) & product canonical covers (e.g. bizzcalc).
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#0E1220] border border-[#222F4C] flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">2.</span>
                      <div>
                        <div className="text-white font-bold">Pricing & Token Formulas</div>
                        <div className="text-slate-400 text-[10px]">
                          Selling price, 15% VAT, exclusive price, ticket price, tokens, and billing model.
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#0E1220] border border-[#222F4C] flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">3.</span>
                      <div>
                        <div className="text-white font-bold">Content & Stage Stories</div>
                        <div className="text-slate-400 text-[10px]">
                          All titles, descriptions, stage narratives, challenges, milestones, and deliverables.
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#0E1220] border border-[#222F4C] flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">4.</span>
                      <div>
                        <div className="text-white font-bold">Curricula & Videos</div>
                        <div className="text-slate-400 text-[10px]">
                          All course lessons, durations, YouTube demo & promo links, and companion files.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 Step GitHub Upload Instructions */}
                <div className="p-4 rounded-xl bg-[#141A2E] border border-[#222F4C] space-y-3">
                  <div className="text-slate-200 font-bold text-xs uppercase tracking-wide">
                    How to update GitHub (Step-by-Step):
                  </div>

                  <div className="space-y-2.5 font-mono text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="h-5 w-5 rounded-full bg-[#1B233D] text-[#5584B4] border border-[#2B3452] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        1
                      </span>
                      <p className="text-slate-300">
                        Check your computer's <strong>Downloads</strong> folder for the newly downloaded file <strong className="text-emerald-300 font-mono">cmsConsoleData.ts</strong>.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="h-5 w-5 rounded-full bg-[#1B233D] text-[#5584B4] border border-[#2B3452] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        2
                      </span>
                      <div className="flex-1">
                        <p className="text-slate-300">
                          Open your repository on GitHub and navigate to the file:
                        </p>
                        <div className="mt-1 flex items-center gap-2 p-1.5 rounded-lg bg-[#0A0D18] border border-[#222F4C] text-[11px] text-emerald-300">
                          <span className="flex-1 font-mono truncate">src/data/cmsConsoleData.ts</span>
                          <button
                            onClick={handleCopyFilePath}
                            className="px-2 py-0.5 rounded bg-[#1B233D] hover:bg-[#252F52] text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                            title="Copy file path"
                          >
                            {copiedPath ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy Path</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="h-5 w-5 rounded-full bg-[#1B233D] text-[#5584B4] border border-[#2B3452] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        3
                      </span>
                      <p className="text-slate-300">
                        Click <strong>Add file → Upload files</strong> (or click the edit pencil icon) and upload your downloaded <code className="text-emerald-300">cmsConsoleData.ts</code>.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="h-5 w-5 rounded-full bg-[#1B233D] text-[#5584B4] border border-[#2B3452] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        4
                      </span>
                      <p className="text-slate-300">
                        Click the green <strong>Commit changes</strong> button. Your live website will automatically redeploy with the new images and data within 1-2 minutes!
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Buttons */}
              <div className="p-4 sm:px-6 bg-[#131B30] border-t border-[#222F4C] flex flex-wrap items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadAgain}
                  className="px-3.5 py-2 rounded-xl bg-[#1B233D] hover:bg-[#252F52] text-slate-300 hover:text-white text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 border border-[#2B3452]"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Download Again</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyFilePath}
                    className="px-3.5 py-2 rounded-xl bg-[#1B233D] hover:bg-[#252F52] text-slate-300 hover:text-white text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 border border-[#2B3452]"
                  >
                    {copiedPath ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Path Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Path</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowGitHubModal(false)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-emerald-950/50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Got It, Ready to Upload</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
