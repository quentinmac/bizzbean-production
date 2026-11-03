import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Mail,
  Users,
  Send,
  Database,
  Info,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
  Coins,
  ArrowRight,
  Save,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  HelpCircle,
  Video,
  BookOpen,
  Printer,
  Receipt,
  Building,
  UserCheck,
  Bell,
  Eye,
  FileSpreadsheet,
  Phone,
  Calculator,
  RotateCcw,
  Globe,
  Percent,
  TrendingUp,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { generateTaxInvoicePdf } from '../utils/taxInvoicePdf';
import { COUNTRIES } from '../data/countryData';
import { FormattedAboutContent } from './FormattedAboutContent';
import {
  DEFAULT_WHO_ARE_WE,
  DEFAULT_WHAT_WE_DO,
  DEFAULT_WHERE_ARE_WE_GOING,
  DEFAULT_HOW_SOLUTIONS_ENABLE_GROWTH,
} from '../data/aboutDefaults';
import {
  AboutContent,
  getCachedAboutContent,
  fetchAboutContentFromCloud,
  saveAboutContentToCloud,
  DEFAULT_MISSION_EQUATION,
  DEFAULT_MISSION_SUBTEXT,
} from '../services/siteContentService';
import {
  CmsProduct,
  CmsVideo,
  CmsArticle,
  CmsPromotionSection,
  CmsInquiry,
  CmsAssociateImport,
  CmsSponsorAccount,
  CmsTransactionRecord,
  CmsPolicyRegistryItem,
  CmsBizzyTooltip,
  CmsPromotionEmail,
  TransactionRecord,
  ClientProfile,
  ClientNotification,
  INITIAL_CMS_PRODUCTS,
  INITIAL_CMS_VIDEOS,
  INITIAL_CMS_ARTICLES,
  INITIAL_CMS_PROMOTIONS,
  INITIAL_CMS_INQUIRIES,
  INITIAL_CMS_ASSOCIATE_BATCHES,
  INITIAL_CMS_SPONSORS,
  INITIAL_CMS_TRANSACTIONS,
  INITIAL_CMS_POLICIES,
  INITIAL_CMS_TOOLTIPS,
  INITIAL_CMS_PROMOTION_EMAILS,
  INITIAL_CMS_BOOK_BUNDLE,
  INITIAL_V1_TRANSACTIONS,
  INITIAL_CLIENT_PROFILES,
  INITIAL_CLIENT_NOTIFICATIONS,
  CmsBookBundle,
} from '../data/cmsConsoleData';
import { safeSaveStorage } from '../utils/imageStorage';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';
import { BizzSolution } from '../types';
import {
  subscribeToEnquiries,
  createEnquiry,
  updateEnquiryStatus,
  dispatchEmailResponse,
  deleteEnquiry,
  TalkToUsEnquiry,
} from '../services/enquiryService';
import {
  getStoredAdminEmails,
  addAdminEmail,
  removeAdminEmail,
  determineUserRole,
} from '../services/firebaseAuthService';

interface AdministrationCentreProps {
  theme: 'light' | 'dark';
  cmsProducts?: CmsProduct[];
  cmsVideos?: CmsVideo[];
  cmsArticles?: CmsArticle[];
  cmsPromotions?: CmsPromotionSection[];
  userProfile?: any;
  tokenBalance?: number;
  onSyncProductsToWebsite?: (products: CmsProduct[]) => void;
  onSyncVideosToWebsite?: (videos: CmsVideo[]) => void;
  onSyncArticlesToWebsite?: (articles: CmsArticle[]) => void;
  onSyncPromotionsToWebsite?: (promotions: CmsPromotionSection[]) => void;
  onOpenStandaloneCmsModal?: () => void;
  onBackToWorkstation?: () => void;
  onNavigateToStage?: (stageId: string, solutionId?: string) => void;
  onBuySolution?: (solution: BizzSolution) => void;
  onSelectSolutionById?: (id: string) => void;
  onLaunchApp?: (appId: string) => void;
  initialTab?: 'transactions' | 'dialogue-centre' | 'bulk-imports' | 'promo-emails' | 'cms-console' | 'about-bizzbean';
}

export const AdministrationCentre: React.FC<AdministrationCentreProps> = ({
  theme,
  cmsProducts,
  cmsVideos,
  cmsArticles,
  cmsPromotions,
  userProfile,
  tokenBalance,
  onSyncProductsToWebsite,
  onSyncVideosToWebsite,
  onSyncArticlesToWebsite,
  onSyncPromotionsToWebsite,
  onOpenStandaloneCmsModal,
  onBackToWorkstation,
  onNavigateToStage,
  onBuySolution,
  onSelectSolutionById,
  onLaunchApp,
  initialTab = 'transactions',
}) => {
  const isDark = theme === 'dark';

  // Active Admin Section Tab
  const [activeTab, setActiveTab] = useState<
    'transactions' | 'dialogue-centre' | 'bulk-imports' | 'promo-emails' | 'cms-console' | 'about-bizzbean'
  >(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // TAB 1: TRANSACTIONS JOURNAL STATE (V1 Implementation)
  // ---------------------------------------------------------------------------
  // TAB 1: TRANSACTIONS JOURNAL & CLIENT PROFILES STATE (Unified Master Hub)
  // ---------------------------------------------------------------------------
  const [journalSubTab, setJournalSubTab] = useState<'transactions' | 'clients' | 'nudges'>('transactions');

  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    try {
      if (localStorage.getItem('bizzdesk_v1_transactions_reset_zero') === 'true') {
        const stored = localStorage.getItem('bizzdesk_v1_transactions');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
        return [];
      }
      const stored = localStorage.getItem('bizzdesk_v1_transactions');
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((t): t is TransactionRecord => Boolean(t && typeof t === 'object' && t.invoiceNumber));
        }
      }
    } catch (e) {}
    return INITIAL_V1_TRANSACTIONS;
  });

  useEffect(() => {
    const handleTxUpdate = () => {
      try {
        if (localStorage.getItem('bizzdesk_v1_transactions_reset_zero') === 'true') {
          const stored = localStorage.getItem('bizzdesk_v1_transactions');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              setTransactions(parsed);
              return;
            }
          }
          setTransactions([]);
          return;
        }
        const stored = localStorage.getItem('bizzdesk_v1_transactions');
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setTransactions(parsed);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('bizzdesk_transactions_updated', handleTxUpdate);
    return () => window.removeEventListener('bizzdesk_transactions_updated', handleTxUpdate);
  }, []);

  const [clientProfiles, setClientProfiles] = useState<ClientProfile[]>(() => {
    try {
      const stored = localStorage.getItem('bizzdesk_v1_client_profiles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((c): c is ClientProfile => Boolean(c && typeof c === 'object' && c.name));
        }
      }
    } catch (e) {}
    return INITIAL_CLIENT_PROFILES;
  });

  // Query Controls & Filtering States (Ref: filter.PNG)
  const [txSearch, setTxSearch] = useState('');
  const [txDateFrom, setTxDateFrom] = useState('');
  const [txDateTo, setTxDateTo] = useState('');
  const [txCountryFilter, setTxCountryFilter] = useState<string>('all');
  const [txAssociateFilter, setTxAssociateFilter] = useState<string>('all');
  const [txProductFilter, setTxProductFilter] = useState<string>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'app' | 'course'>('all');
  const [txSortColumn, setTxSortColumn] = useState<
    'invoiceNumber' | 'transactionDate' | 'customer' | 'customerEmail' | 'country' | 'associate' | 'productName' | 'lineValue' | 'vatAmount' | 'invoiceValue'
  >('transactionDate');
  const [txSortDirection, setTxSortDirection] = useState<'asc' | 'desc'>('desc');

  // SARS Statutory VAT Calculator banner state
  const [isVatCalculatorOpen, setIsVatCalculatorOpen] = useState(false);
  const [vatCalcAmount, setVatCalcAmount] = useState<number>(1000);
  const [vatCalcMode, setVatCalcMode] = useState<'exclusive' | 'inclusive'>('exclusive');

  const [viewingInvoice, setViewingInvoice] = useState<TransactionRecord | null>(null);

  // New Transaction Modal State
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [newTxInvoiceNo, setNewTxInvoiceNo] = useState('');
  const [newTxDate, setNewTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTxSku, setNewTxSku] = useState('bizzcalc');
  const [newTxProductName, setNewTxProductName] = useState('bizzcalc app');
  const [newTxProductType, setNewTxProductType] = useState<'app' | 'course'>('app');
  const [newTxSelectedProfileId, setNewTxSelectedProfileId] = useState<string>('custom');
  const [newTxCustomer, setNewTxCustomer] = useState('Quentin McCullough');
  const [newTxEmail, setNewTxEmail] = useState('quentin@bizzbean.com');
  const [newTxCountry, setNewTxCountry] = useState('South Africa');
  const [newTxAssociate, setNewTxAssociate] = useState('BizzPartner SA');
  const [newTxQuantity, setNewTxQuantity] = useState<number>(1);
  const [newTxUnitPrice, setNewTxUnitPrice] = useState<number>(229);
  const [newTxVatRate, setNewTxVatRate] = useState<number>(0.15);
  const [newTxAutoNotify, setNewTxAutoNotify] = useState<boolean>(true);

  // Client Profile Modal State (Ref: client profile.PNG)
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientVat, setNewClientVat] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientCity, setNewClientCity] = useState('');
  const [newClientCountry, setNewClientCountry] = useState('South Africa');
  const [newClientNotes, setNewClientNotes] = useState('');
  const [newClientRole, setNewClientRole] = useState<'member' | 'admin'>('member');

  // Administrator Management State
  const [adminEmailsList, setAdminEmailsList] = useState<string[]>(() => {
    return getStoredAdminEmails();
  });
  const [newAdminInput, setNewAdminInput] = useState('');
  const [showAdminManager, setShowAdminManager] = useState(false);

  // Journal Reset In-App Confirmation Modal (Bypasses browser window.confirm sandbox block)
  const [showResetJournalModal, setShowResetJournalModal] = useState(false);

  // About Bizzbean Live Content State & Cloud Synchronization
  const [aboutData, setAboutData] = useState<AboutContent>(() => getCachedAboutContent());
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [editSocialMissionEquation, setEditSocialMissionEquation] = useState('');
  const [editSocialMissionSubtext, setEditSocialMissionSubtext] = useState('');
  const [editWhoAreWe, setEditWhoAreWe] = useState('');
  const [editWhatWeDo, setEditWhatWeDo] = useState('');
  const [editWhereGoing, setEditWhereGoing] = useState('');
  const [editHowSolutions, setEditHowSolutions] = useState('');
  const [isSavingAbout, setIsSavingAbout] = useState(false);

  useEffect(() => {
    fetchAboutContentFromCloud().then((cloudData) => {
      setAboutData(cloudData);
    });
    const handleAboutUpdate = (e: any) => {
      if (e.detail) setAboutData(e.detail);
    };
    window.addEventListener('bizzbean_about_content_updated', handleAboutUpdate);
    return () => window.removeEventListener('bizzbean_about_content_updated', handleAboutUpdate);
  }, []);

  // Standard catalogue presets for quick entry
  const STANDARD_CATALOGUE_ITEMS = [
    { sku: 'bizzcalc', name: 'bizzcalc app', type: 'app' as const, price: 229 },
    { sku: 'cost_rec', name: 'cost_rec app', type: 'app' as const, price: 349 },
    { sku: 'bizzmodel', name: 'bizzmodel app', type: 'app' as const, price: 850 },
    { sku: 'bizzplan', name: 'bizzplan app', type: 'app' as const, price: 450 },
    { sku: 'bizzmoney', name: 'bizzmoney app', type: 'app' as const, price: 590 },
    { sku: 'course_fund_ability', name: 'fund-ABILITY Masterclass', type: 'course' as const, price: 4869.57 },
    { sku: 'course_pricing_arch', name: 'Pricing Architecture Masterclass', type: 'course' as const, price: 1200 },
    { sku: 'course_fin_modeling', name: 'Financial Modeling Masterclass', type: 'course' as const, price: 2500 },
  ];

  const handleSelectCatalogueItem = (skuVal: string) => {
    const item = STANDARD_CATALOGUE_ITEMS.find((c) => c.sku === skuVal);
    if (item) {
      setNewTxSku(item.sku);
      setNewTxProductName(item.name);
      setNewTxProductType(item.type);
      setNewTxUnitPrice(item.price);
    } else {
      setNewTxSku(skuVal);
    }
  };

  const handleSelectClientPreset = (profileId: string) => {
    setNewTxSelectedProfileId(profileId);
    if (profileId === 'custom') return;
    const client = clientProfiles.find((c) => c && c.id === profileId);
    if (client) {
      setNewTxCustomer(client.name || '');
      setNewTxEmail(client.email || '');
      if (client.companyName) setNewClientCompany(client.companyName);
      if (client.country) setNewTxCountry(client.country);
    }
  };

  const openNewTxModalWithNextInvoice = () => {
    const nextSeq = String((transactions || []).length + 1).padStart(4, '0');
    setNewTxInvoiceNo(`INV-2026-${nextSeq}`);
    setNewTxDate(new Date().toISOString().slice(0, 10));
    setIsNewTxModalOpen(true);
  };

  // Distinct Filter Option Extraction
  const distinctAssociates = Array.from(
    new Set((transactions || []).map((tx) => tx?.associate).filter(Boolean))
  ) as string[];

  const distinctCountries = Array.from(
    new Set([
      'South Africa',
      'United Kingdom',
      'United States',
      'Australia',
      'Canada',
      'Germany',
      'France',
      'Netherlands',
      'Namibia',
      'Botswana',
      'Kenya',
      'Nigeria',
      ...(transactions || []).map((tx) => tx?.country).filter(Boolean),
      ...(clientProfiles || []).map((c) => c?.country).filter(Boolean),
    ])
  ) as string[];

  const distinctProducts = Array.from(
    new Set((transactions || []).map((tx) => tx?.productName).filter(Boolean))
  ) as string[];

  // Quick Date Preset Handlers
  const handleSetDatePreset = (preset: 'today' | 'this-month' | 'last-30' | 'ytd') => {
    const now = new Date();
    const toStr = now.toISOString().slice(0, 10);
    if (preset === 'today') {
      setTxDateFrom(toStr);
      setTxDateTo(toStr);
    } else if (preset === 'this-month') {
      const fromStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      setTxDateFrom(fromStr);
      setTxDateTo(toStr);
    } else if (preset === 'last-30') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setTxDateFrom(thirtyDaysAgo.toISOString().slice(0, 10));
      setTxDateTo(toStr);
    } else if (preset === 'ytd') {
      const fromStr = `${now.getFullYear()}-01-01`;
      setTxDateFrom(fromStr);
      setTxDateTo(toStr);
    }
  };

  const handleResetFilters = () => {
    setTxDateFrom('');
    setTxDateTo('');
    setTxSearch('');
    setTxCountryFilter('all');
    setTxAssociateFilter('all');
    setTxProductFilter('all');
    setTxTypeFilter('all');
    showToast('Query filters reset.');
  };

  const handleResetJournalSeq = () => {
    setShowResetJournalModal(true);
  };

  const handleConfirmResetJournalZero = () => {
    setTransactions([]);
    localStorage.setItem('bizzdesk_v1_transactions', JSON.stringify([]));
    localStorage.setItem('bizzdesk_v1_transactions_reset_zero', 'true');
    window.dispatchEvent(new CustomEvent('bizzdesk_transactions_updated'));
    setShowResetJournalModal(false);
    showToast('Transaction journal successfully reset to zero. The next invoice sequence starts at Invoice #1 (INV-2026-0001).');
  };

  const handleSort = (col: typeof txSortColumn) => {
    if (txSortColumn === col) {
      setTxSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setTxSortColumn(col);
      setTxSortDirection('desc');
    }
  };

  // Filtered & Sorted Transactions Matrix
  const filteredTransactions = (transactions || [])
    .filter((tx) => {
      if (!tx) return false;
      if (txTypeFilter !== 'all' && tx.productType !== txTypeFilter) return false;
      if (txAssociateFilter !== 'all' && tx.associate !== txAssociateFilter) return false;
      if (txCountryFilter !== 'all' && (tx.country || 'South Africa') !== txCountryFilter) return false;
      if (txProductFilter !== 'all' && tx.productName !== txProductFilter) return false;
      if (txDateFrom && tx.transactionDate && tx.transactionDate < txDateFrom) return false;
      if (txDateTo && tx.transactionDate && tx.transactionDate > txDateTo) return false;

      const q = (txSearch || '').toLowerCase().trim();
      if (q) {
        const matchSearch =
          (tx.invoiceNumber || '').toLowerCase().includes(q) ||
          (tx.customer || '').toLowerCase().includes(q) ||
          (tx.customerEmail || '').toLowerCase().includes(q) ||
          (tx.sku || '').toLowerCase().includes(q) ||
          (tx.productName || '').toLowerCase().includes(q) ||
          (tx.associate || '').toLowerCase().includes(q) ||
          Boolean(tx.country && (tx.country || '').toLowerCase().includes(q));
        if (!matchSearch) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let valA: any = a[txSortColumn] ?? '';
      let valB: any = b[txSortColumn] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return txSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return txSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const totalGrossZar = (transactions || []).reduce((acc, tx) => acc + (Number(tx?.invoiceValue) || 0), 0);
  const totalNetZar = (transactions || []).reduce((acc, tx) => acc + (Number(tx?.lineValue) || 0), 0);
  const totalVatZar = (transactions || []).reduce((acc, tx) => acc + (Number(tx?.vatAmount) || 0), 0);
  const appTransactionsCount = (transactions || []).filter((tx) => tx?.productType === 'app').length;
  const courseTransactionsCount = (transactions || []).filter((tx) => tx?.productType === 'course').length;

  const handleOpenNewClientModal = () => {
    setEditingClient(null);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientCompany('');
    setNewClientVat('');
    setNewClientPhone('');
    setNewClientCity('');
    setNewClientCountry('South Africa');
    setNewClientNotes('');
    setNewClientRole('member');
    setIsNewClientModalOpen(true);
  };

  const handleOpenEditClientModal = (client: ClientProfile) => {
    setEditingClient(client);
    setNewClientName(client.name || '');
    setNewClientEmail(client.email || '');
    setNewClientCompany(client.companyName || '');
    setNewClientVat(client.vatNumber || '');
    setNewClientPhone(client.phone || '');
    setNewClientCity(client.city || '');
    setNewClientCountry(client.country || 'South Africa');
    setNewClientNotes(client.notes || '');
    setNewClientRole(client.role || (determineUserRole(client.email) === 'admin' ? 'admin' : 'member'));
    setIsNewClientModalOpen(true);
  };

  const handleAddNewAdmin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newAdminInput.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      showToast('Please enter a valid email address to add as an administrator.');
      return;
    }
    const updated = addAdminEmail(clean);
    setAdminEmailsList(updated);
    // Also if there is a matching client profile, update their role to admin
    const updatedProfiles = clientProfiles.map((c) =>
      c.email.toLowerCase().trim() === clean ? { ...c, role: 'admin' as const } : c
    );
    setClientProfiles(updatedProfiles);
    safeSaveStorage('bizzdesk_v1_client_profiles', updatedProfiles);
    setNewAdminInput('');
    showToast(`Administrator privileges granted to ${clean}.`);
  };

  const handleRevokeAdmin = (email: string) => {
    const clean = email.toLowerCase().trim();
    const updated = removeAdminEmail(clean);
    setAdminEmailsList(updated);
    const updatedProfiles = clientProfiles.map((c) =>
      c.email.toLowerCase().trim() === clean ? { ...c, role: 'member' as const } : c
    );
    setClientProfiles(updatedProfiles);
    safeSaveStorage('bizzdesk_v1_client_profiles', updatedProfiles);
    showToast(`Administrator privileges revoked for ${clean}.`);
  };

  const handleToggleClientAdminRole = (client: ClientProfile) => {
    const isCurrentlyAdmin = client.role === 'admin' || determineUserRole(client.email) === 'admin';
    const nextRole: 'admin' | 'member' = isCurrentlyAdmin ? 'member' : 'admin';
    if (nextRole === 'admin') {
      const updatedAdmins = addAdminEmail(client.email);
      setAdminEmailsList(updatedAdmins);
    } else {
      const updatedAdmins = removeAdminEmail(client.email);
      setAdminEmailsList(updatedAdmins);
    }
    const updatedProfiles = clientProfiles.map((c) =>
      c.id === client.id ? { ...c, role: nextRole } : c
    );
    setClientProfiles(updatedProfiles);
    safeSaveStorage('bizzdesk_v1_client_profiles', updatedProfiles);
    showToast(`${client.name || client.email} is now ${nextRole === 'admin' ? 'an Administrator' : 'a Client Member'}.`);
  };

  const handleSaveClientProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientEmail.trim()) {
      showToast('Contact person name and primary email are required.');
      return;
    }

    if (newClientRole === 'admin') {
      const updatedAdmins = addAdminEmail(newClientEmail.trim());
      setAdminEmailsList(updatedAdmins);
    } else {
      const updatedAdmins = removeAdminEmail(newClientEmail.trim());
      setAdminEmailsList(updatedAdmins);
    }

    if (editingClient) {
      const updated = clientProfiles.map((c) =>
        c.id === editingClient.id
          ? {
              ...c,
              name: newClientName.trim(),
              email: newClientEmail.trim(),
              companyName: newClientCompany.trim() || 'Independent Founder',
              vatNumber: newClientVat.trim() || undefined,
              phone: newClientPhone.trim() || undefined,
              city: newClientCity.trim() || undefined,
              country: newClientCountry.trim() || 'South Africa',
              notes: newClientNotes.trim() || undefined,
              role: newClientRole,
            }
          : c
      );
      setClientProfiles(updated);
      safeSaveStorage('bizzdesk_v1_client_profiles', updated);
      setIsNewClientModalOpen(false);
      setEditingClient(null);
      showToast(`Client profile for ${newClientName} updated successfully (${newClientRole === 'admin' ? 'Administrator' : 'Member'}).`);
    } else {
      const newClient: ClientProfile = {
        id: `cli-${Date.now().toString().slice(-4)}`,
        name: newClientName.trim(),
        email: newClientEmail.trim(),
        companyName: newClientCompany.trim() || 'Independent Founder',
        vatNumber: newClientVat.trim() || undefined,
        phone: newClientPhone.trim() || undefined,
        city: newClientCity.trim() || undefined,
        country: newClientCountry.trim() || 'South Africa',
        notes: newClientNotes.trim() || undefined,
        role: newClientRole,
      };
      const updated = [newClient, ...clientProfiles];
      setClientProfiles(updated);
      safeSaveStorage('bizzdesk_v1_client_profiles', updated);
      setIsNewClientModalOpen(false);
      showToast(`Client profile for ${newClient.name} established (${newClientRole === 'admin' ? 'Administrator' : 'Member'}).`);
    }
  };

  const handleRecordNewTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTxCustomer.trim() || !newTxEmail.trim()) {
      showToast('Please provide a customer name and email address.');
      return;
    }
    const qty = Math.max(1, Number(newTxQuantity) || 1);
    const unitP = Math.max(0, Number(newTxUnitPrice) || 0);
    const lineVal = Number((qty * unitP).toFixed(2));
    const vatRate = Number(newTxVatRate) || 0.15;
    const vatAmt = Number((lineVal * vatRate).toFixed(2));
    const invVal = Number((lineVal + vatAmt).toFixed(2));

    const invoiceNum = newTxInvoiceNo.trim() || `INV-2026-${String(transactions.length + 1).padStart(4, '0')}`;

    const newRecord: TransactionRecord = {
      invoiceNumber: invoiceNum,
      transactionDate: newTxDate || new Date().toISOString().slice(0, 10),
      sku: newTxSku.trim() || 'bizzcalc',
      productName: newTxProductName.trim() || 'bizzcalc app',
      productType: newTxProductType,
      customer: newTxCustomer.trim(),
      customerEmail: newTxEmail.trim(),
      country: newTxCountry.trim() || 'South Africa',
      associate: newTxAssociate.trim() || 'BizzPartner SA',
      quantity: qty,
      unitPrice: unitP,
      lineValue: lineVal,
      vatRate: vatRate,
      vatAmount: vatAmt,
      invoiceValue: invVal,
    };

    const updatedTransactions = [newRecord, ...transactions];
    setTransactions(updatedTransactions);
    safeSaveStorage('bizzdesk_v1_transactions', updatedTransactions);

    // If customer doesn't exist in client directory, automatically create client profile
    const existingClient = (clientProfiles || []).find(
      (c) => Boolean(c && (c.email || '').toLowerCase() === (newRecord.customerEmail || '').toLowerCase())
    );
    if (!existingClient) {
      const newClient: ClientProfile = {
        id: `cli-${Date.now().toString().slice(-4)}`,
        name: newRecord.customer,
        email: newRecord.customerEmail,
        companyName: `${newRecord.customer}'s Company`,
        country: newRecord.country || 'South Africa',
        notes: `Auto-created from transaction ${invoiceNum}`,
      };
      const updatedClients = [newClient, ...clientProfiles];
      setClientProfiles(updatedClients);
      safeSaveStorage('bizzdesk_v1_client_profiles', updatedClients);
    }

    setIsNewTxModalOpen(false);
    showToast(`Tax invoice ${newRecord.invoiceNumber} posted to General Ledger!`);
  };

  const handleOpenInvoiceFromClient = (client: ClientProfile) => {
    setNewTxSelectedProfileId(client.id);
    setNewTxCustomer(client.name);
    setNewTxEmail(client.email);
    if (client.country) setNewTxCountry(client.country);
    const nextSeq = String(transactions.length + 1).padStart(4, '0');
    setNewTxInvoiceNo(`INV-2026-${nextSeq}`);
    setNewTxDate(new Date().toISOString().slice(0, 10));
    setJournalSubTab('transactions');
    setIsNewTxModalOpen(true);
  };

  const handleExportTxCsv = () => {
    const headers = [
      'Invoice Number',
      'Transaction Date',
      'SKU',
      'Product Name',
      'Product Type',
      'Customer',
      'Customer Email',
      'Country',
      'Associate',
      'Quantity',
      'Unit Price (ZAR)',
      'Line Value (Excl VAT)',
      'VAT Rate (%)',
      'VAT Amount (ZAR)',
      'Invoice Value (Gross Incl VAT)',
    ];
    const rows = filteredTransactions.map((t) => [
      `"${t.invoiceNumber || ''}"`,
      `"${t.transactionDate || ''}"`,
      `"${t.sku || ''}"`,
      `"${t.productName || ''}"`,
      `"${t.productType || ''}"`,
      `"${t.customer || ''}"`,
      `"${t.customerEmail || ''}"`,
      `"${t.country || 'South Africa'}"`,
      `"${t.associate || ''}"`,
      Number(t.quantity) || 1,
      (Number(t.unitPrice) || 0).toFixed(2),
      (Number(t.lineValue) || 0).toFixed(2),
      `${((Number(t.vatRate) || 0.15) * 100).toFixed(0)}%`,
      (Number(t.vatAmount) || 0).toFixed(2),
      (Number(t.invoiceValue) || 0).toFixed(2),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bizzdesk_v1_transaction_journal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('V1 Transaction journal exported to CSV successfully.');
  };

  // ---------------------------------------------------------------------------
  // TAB 2: TALK TO US DIALOGUE RESPONSE CENTRE (#3 in old CMS)
  // ---------------------------------------------------------------------------
  const [inquiries, setInquiries] = useState<CmsInquiry[]>(() => {
    try {
      const stored = localStorage.getItem('bizzdesk_cms_inquiries_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasLegacyMock = parsed.some((i: any) => i.id === 'inq-101' || i.id === 'inq-102');
          if (!hasLegacyMock) {
            return parsed.filter((i): i is CmsInquiry => Boolean(i && typeof i === 'object' && i.id));
          } else {
            localStorage.setItem('bizzdesk_cms_inquiries_v1', JSON.stringify([]));
          }
        }
      }
    } catch (e) {}
    return INITIAL_CMS_INQUIRIES;
  });

  // Real-time Firestore sync with localStorage fallback
  useEffect(() => {
    const unsubscribe = subscribeToEnquiries((items) => {
      if (items && Array.isArray(items)) {
        const cleaned = items.filter(
          (i) => Boolean(i && typeof i === 'object' && i.id && i.id !== 'inq-101' && i.id !== 'inq-102')
        );
        setInquiries(cleaned);
      }
    });
    return () => unsubscribe();
  }, []);

  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<'all' | 'new' | 'reviewed' | 'resolved'>('all');
  const [replyingInquiry, setReplyingInquiry] = useState<CmsInquiry | null>(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  const filteredInquiries = (inquiries || []).filter((inq) => {
    if (!inq) return false;
    const matchStatus = inquiryStatusFilter === 'all' || inq.status === inquiryStatusFilter;
    const q = (inquirySearch || '').toLowerCase().trim();
    const matchSearch =
      !q ||
      (inq.senderName || '').toLowerCase().includes(q) ||
      (inq.senderEmail || '').toLowerCase().includes(q) ||
      (inq.subject || '').toLowerCase().includes(q) ||
      (inq.message || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleOpenReplyModal = (inq: CmsInquiry) => {
    setReplyingInquiry(inq);
    setReplySubject(`Re: ${inq.subject} [GIM Desk Consultation]`);
    setReplyMessage(
      `Dear ${inq.senderName},\n\nThank you for reaching out to the Bizzbean GIM Advisory Desk.\n\nRegarding your inquiry: "${inq.message}"\n\n`
    );
  };

  const handleSendReply = async () => {
    if (!replyingInquiry) return;
    try {
      await dispatchEmailResponse(
        replyingInquiry as TalkToUsEnquiry,
        replySubject,
        replyMessage,
        {
          responderEmail: 'thebizzbeanchannel@gmail.com',
          openEmailClient: true,
          ccFounderChannel: true,
        }
      );
      const updated = inquiries.map((inq) =>
        inq.id === replyingInquiry.id ? { ...inq, status: 'resolved' as const } : inq
      );
      setInquiries(updated);
      safeSaveStorage('bizzdesk_cms_inquiries_v1', updated);
      showToast(`Advisory dispatch sent to ${replyingInquiry.senderEmail}. Inquiry resolved.`);
    } catch (err) {
      console.warn('Dispatch response notice:', err);
      const updated = inquiries.map((inq) =>
        inq.id === replyingInquiry.id ? { ...inq, status: 'resolved' as const } : inq
      );
      setInquiries(updated);
      safeSaveStorage('bizzdesk_cms_inquiries_v1', updated);
      showToast(`Advisory response recorded and inquiry marked as resolved.`);
    } finally {
      setReplyingInquiry(null);
    }
  };

  const handleApplyReplyPreset = (presetType: 'gim-loop' | 'tokens' | 'forecast') => {
    if (!replyingInquiry) return;
    if (presetType === 'gim-loop') {
      setReplyMessage(
        `Dear ${replyingInquiry.senderName},\n\nCoach GIM has evaluated your query. We recommend stress-testing your commercial assumptions in the AI-LOOP Dialogue on the right-hand panel of your workstation.\n\nOur motto remains: 'infinite wisdom. instant viability. always on.'\n\nWarm regards,\nGIM Executive Advisory Desk`
      );
    } else if (presetType === 'tokens') {
      setReplyMessage(
        `Dear ${replyingInquiry.senderName},\n\nWe have approved and credited 350 complimentary BizzTokens to your workstation so your team can unlock the requested simulation sprint without delay.\n\nWarm regards,\nBizzbean Operations`
      );
    } else if (presetType === 'forecast') {
      setReplyMessage(
        `Dear ${replyingInquiry.senderName},\n\nWhen exporting your 3-statement financial forecast to Google Drive, the folder architecture automatically provisions partitioned sub-directories for lead investors, complete with cap table waterfalls and dynamic valuation sensitivity dials.\n\nWarm regards,\nElena Vance · Venture Operations`
      );
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 3: ASSOCIATE BULK CLIENT IMPORTS (#9 in old CMS)
  // ---------------------------------------------------------------------------
  const [associateBatches, setAssociateBatches] = useState<CmsAssociateImport[]>(() => {
    try {
      const stored = localStorage.getItem('bizzdesk_cms_associate_batches_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_CMS_ASSOCIATE_BATCHES;
  });

  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchOrg, setNewBatchOrg] = useState('');
  const [newBatchTokens, setNewBatchTokens] = useState<number>(500);
  const [csvText, setCsvText] = useState(
    `Founder Name,Email,Company,Stage\nThabo Mokoena,thabo@solarflow.co.za,SolarFlow,vi-ability\nZanele Dlamini,zanele@agrix.co.za,AgriX,fund-ability\nJohan van der Merwe,johan@paypulse.co.za,PayPulse,sustain-ability`
  );

  const totalCohortFounders = (associateBatches || []).reduce((acc, b) => acc + (Number(b?.candidateCount) || 0), 0);
  const totalBatchTokens = (associateBatches || []).reduce((acc, b) => acc + ((Number(b?.candidateCount) || 0) * (Number(b?.tokensPerAccount) || 0)), 0);

  const handleCommitCsvBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim() || !newBatchOrg.trim()) {
      showToast('Please provide a batch name and partner organization.');
      return;
    }
    const lines = csvText.trim().split('\n').filter((l) => l.trim().length > 0);
    // Exclude header row if present
    const count = lines[0].toLowerCase().includes('founder') ? Math.max(1, lines.length - 1) : lines.length;

    const newBatch: CmsAssociateImport = {
      id: `batch-${Math.floor(10 + Math.random() * 90)}`,
      batchName: newBatchName.trim(),
      organization: newBatchOrg.trim(),
      candidateCount: count,
      tokensPerAccount: Number(newBatchTokens) || 500,
      date: new Date().toISOString().slice(0, 10),
      status: 'provisioned',
    };

    const updated = [newBatch, ...associateBatches];
    setAssociateBatches(updated);
    safeSaveStorage('bizzdesk_cms_associate_batches_v1', updated);
    setIsCsvImportModalOpen(false);
    setNewBatchName('');
    setNewBatchOrg('');
    showToast(`Batch "${newBatch.batchName}" provisioned: ${count} founder accounts granted ${newBatch.tokensPerAccount} tokens each.`);
  };

  // ---------------------------------------------------------------------------
  // TAB 4: PERSONAL PROMOTION EMAILS (#10 in old CMS)
  // ---------------------------------------------------------------------------
  const [promoEmails, setPromoEmails] = useState<CmsPromotionEmail[]>(() => {
    try {
      const stored = localStorage.getItem('bizzdesk_cms_promo_emails_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_CMS_PROMOTION_EMAILS;
  });

  const [selectedPromoEmailId, setSelectedPromoEmailId] = useState<string>(
    promoEmails?.[0]?.id || 'promo-mail-01'
  );
  const activePromoEmail = (promoEmails || []).find((p) => p && p.id === selectedPromoEmailId) || (promoEmails || [])[0] || INITIAL_CMS_PROMOTION_EMAILS[0];

  // Merge Variables State
  const [mergeFounderName, setMergeFounderName] = useState('Elena Vance');
  const [mergeCompanyName, setMergeCompanyName] = useState('Apex Cloud Dynamics');
  const [testEmailRecipient, setTestEmailRecipient] = useState('thebizzbeanchannel@gmail.com');

  const handleDispatchCampaign = (campaignId: string) => {
    const updated = promoEmails.map((c) =>
      c.id === campaignId
        ? {
            ...c,
            status: 'dispatched' as const,
            sentCount: c.sentCount + 35,
            openRate: '71.2%',
            clickRate: '46.8%',
            lastDispatched: new Date().toISOString().replace('T', ' ').substring(0, 16),
          }
        : c
    );
    setPromoEmails(updated);
    safeSaveStorage('bizzdesk_cms_promo_emails_v1', updated);
    showToast(`Promotional email campaign "${activePromoEmail?.campaignName}" dispatched successfully.`);
  };

  const handleSendTestEmail = () => {
    showToast(`Test dispatch of "${activePromoEmail?.campaignName}" delivered to ${testEmailRecipient}.`);
  };

  // ---------------------------------------------------------------------------
  // TAB 5: PRESENT CMS CONSOLE (Master Matrix & Configuration)
  // ---------------------------------------------------------------------------
  const [cmsSubTab, setCmsSubTab] = useState<'matrix' | 'videos' | 'articles' | 'promotions' | 'book' | 'policies'>('matrix');
  const [cmsSearch, setCmsSearch] = useState('');

  // Products from props or initial fallback
  const [productsList, setProductsList] = useState<CmsProduct[]>(() => cmsProducts || INITIAL_CMS_PRODUCTS);
  useEffect(() => {
    if (cmsProducts && cmsProducts.length > 0) setProductsList(cmsProducts);
  }, [cmsProducts]);

  const filteredCmsProducts = (productsList || []).filter((p) => {
    if (!p) return false;
    if (!cmsSearch) return true;
    const q = cmsSearch.toLowerCase().trim();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.stage || '').toLowerCase().includes(q)
    );
  });

  // Master navigation tabs for carousel container (Reference: carosoul.PNG)
  const ADMIN_TABS = [
    { id: 'transactions', label: 'Transaction Journal', icon: FileText, badge: transactions.length },
    { id: 'dialogue-centre', label: 'Talk To Us Dialogue (#3)', icon: Mail, badge: inquiries.length },
    { id: 'bulk-imports', label: 'Associate Bulk Imports (#9)', icon: Users, badge: associateBatches.length },
    { id: 'promo-emails', label: 'Personal Promotion Emails (#10)', icon: Send, badge: promoEmails.length },
    { id: 'cms-console', label: 'CMS Console (Master Matrix)', icon: Database, badge: 'Live' },
    { id: 'about-bizzbean', label: 'About Bizzbean Content', icon: Info, badge: 'Official' },
  ] as const;

  const tabsCarouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkTabsScroll = useCallback(() => {
    const el = tabsCarouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    const el = tabsCarouselRef.current;
    if (!el) return;
    checkTabsScroll();
    el.addEventListener('scroll', checkTabsScroll, { passive: true });
    window.addEventListener('resize', checkTabsScroll);
    return () => {
      el.removeEventListener('scroll', checkTabsScroll);
      window.removeEventListener('resize', checkTabsScroll);
    };
  }, [checkTabsScroll]);

  // Auto-scroll active tab into view whenever activeTab changes
  useEffect(() => {
    const el = tabsCarouselRef.current;
    if (!el) return;
    const activeBtn = el.querySelector<HTMLElement>(`[data-tab-id="${activeTab}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    setTimeout(checkTabsScroll, 300);
  }, [activeTab, checkTabsScroll]);

  const handleScrollTabs = (direction: 'left' | 'right') => {
    const el = tabsCarouselRef.current;
    if (!el) return;
    const scrollAmount = Math.max(260, Math.floor(el.clientWidth * 0.65));
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(checkTabsScroll, 350);
  };

  const activeTabIndex = Math.max(
    0,
    ADMIN_TABS.findIndex((t) => t.id === activeTab)
  );

  const handleNextTab = () => {
    const nextIndex = (activeTabIndex + 1) % ADMIN_TABS.length;
    setActiveTab(ADMIN_TABS[nextIndex].id as any);
  };

  const handlePrevTab = () => {
    const prevIndex = (activeTabIndex - 1 + ADMIN_TABS.length) % ADMIN_TABS.length;
    setActiveTab(ADMIN_TABS[prevIndex].id as any);
  };

  // ---------------------------------------------------------------------------
  // RENDER COMPONENT
  // ---------------------------------------------------------------------------
  return (
    <div
      className={`flex-grow h-full flex flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-[#0B0F19] text-[#E2E8F0]' : 'bg-[#FAF8F5] text-slate-900'
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#16213E] border border-[#5584B4] text-white px-4 py-2.5 rounded-xl shadow-2xl font-mono text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: ADMINISTRATION CENTRE */}
      <header
        className={`px-4 sm:px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#5584B4]/20 border border-[#5584B4]/40 text-[#5584B4]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-500 uppercase tracking-wider">
                ADMINISTRATION CENTRE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                V1 CORE ACTIVE
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight uppercase">
              Operational Management & Audit Headquarters
            </h1>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">

          {onOpenStandaloneCmsModal && (
            <button
              onClick={onOpenStandaloneCmsModal}
              title="Open full CMS console modal"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-[#1F2942] hover:bg-[#2B395C] text-slate-200 border border-[#35456E] transition-colors"
            >
              <Database className="h-3.5 w-3.5 text-[#5584B4]" />
              <span className="hidden sm:inline">Launch CMS Modal</span>
            </button>
          )}

          {onBackToWorkstation && (
            <button
              onClick={onBackToWorkstation}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#5584B4] hover:bg-[#4773A0] text-white shadow-xs transition-colors"
            >
              <span>Back to Workstation</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* NAVIGATION TABS: CAROUSEL CONTAINER (Reference: carosoul.PNG) */}
      <div
        className={`border-b shrink-0 relative transition-colors ${
          isDark ? 'bg-[#0E1322] border-[#1D2644]' : 'bg-[#F4EFE6] border-[#E8E2D8]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center gap-2 py-2">
          {/* Carousel Left Navigation Arrow Button */}
          <button
            type="button"
            onClick={() => handleScrollTabs('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll menu left"
            title="Scroll menu left"
            className={`p-2 rounded-xl transition-all shrink-0 flex items-center justify-center border cursor-pointer ${
              canScrollLeft
                ? isDark
                  ? 'bg-[#182038] hover:bg-[#253258] text-white border-[#314170] shadow-sm hover:scale-105 active:scale-95'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-[#D8CEBC] shadow-sm hover:scale-105 active:scale-95'
                : isDark
                ? 'opacity-25 text-slate-600 border-transparent cursor-not-allowed pointer-events-none'
                : 'opacity-25 text-slate-400 border-transparent cursor-not-allowed pointer-events-none'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Carousel Track with Gradient Fades */}
          <div className="relative flex-1 overflow-hidden min-w-0">
            {/* Left Edge Gradient Indicator */}
            {canScrollLeft && (
              <div
                className={`absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none transition-opacity ${
                  isDark
                    ? 'bg-gradient-to-r from-[#0E1322] to-transparent'
                    : 'bg-gradient-to-r from-[#F4EFE6] to-transparent'
                }`}
              />
            )}

            {/* Scrollable Tabs Carousel Track */}
            <div
              ref={tabsCarouselRef}
              className="overflow-x-auto scroll-smooth flex items-center gap-2 py-0.5 px-1 scrollbar-none"
            >
              {ADMIN_TABS.map((tab, idx) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    data-tab-id={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all whitespace-nowrap border shrink-0 cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-[#1E2745] text-[#E0B182] border-[#5584B4] shadow-md ring-1 ring-[#5584B4]/50'
                          : 'bg-white text-[#7B5927] border-[#8CB843] shadow-md ring-1 ring-[#8CB843]/40'
                        : isDark
                        ? 'text-slate-400 hover:text-white bg-[#13182B]/80 hover:bg-[#182038] border-[#1D2644]'
                        : 'text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border-[#E8E2D8]'
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        isActive ? (isDark ? 'text-[#E0B182]' : 'text-[#7B5927]') : 'opacity-70'
                      }`}
                    />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isActive
                          ? isDark
                            ? 'bg-[#E0B182]/20 text-[#E0B182] font-bold'
                            : 'bg-[#8CB843]/20 text-[#557827] font-bold'
                          : isDark
                          ? 'bg-[#1F2742] text-slate-400'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Edge Gradient Indicator */}
            {canScrollRight && (
              <div
                className={`absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none transition-opacity ${
                  isDark
                    ? 'bg-gradient-to-l from-[#0E1322] to-transparent'
                    : 'bg-gradient-to-l from-[#F4EFE6] to-transparent'
                }`}
              />
            )}
          </div>

          {/* Carousel Right Navigation Arrow Button */}
          <button
            type="button"
            onClick={() => handleScrollTabs('right')}
            disabled={!canScrollRight}
            aria-label="Scroll menu right"
            title="Scroll menu right to discover more items"
            className={`p-2 rounded-xl transition-all shrink-0 flex items-center justify-center border cursor-pointer ${
              canScrollRight
                ? isDark
                  ? 'bg-[#182038] hover:bg-[#253258] text-[#E0B182] border-[#314170] shadow-sm hover:scale-105 active:scale-95 ring-1 ring-amber-400/40 animate-pulse'
                  : 'bg-white hover:bg-slate-100 text-[#7B5927] border-[#D8CEBC] shadow-sm hover:scale-105 active:scale-95 ring-1 ring-amber-500/40 animate-pulse'
                : isDark
                ? 'opacity-25 text-slate-600 border-transparent cursor-not-allowed pointer-events-none'
                : 'opacity-25 text-slate-400 border-transparent cursor-not-allowed pointer-events-none'
            }`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Carousel Navigation Index & Pagination Dots */}
          <div className="hidden lg:flex items-center gap-2.5 pl-2 border-l border-slate-300 dark:border-slate-800 shrink-0">
            {/* Quick Step Indicator */}
            <div className="font-mono text-[11px] text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200">{activeTabIndex + 1}</span>
              <span className="mx-0.5">/</span>
              <span>{ADMIN_TABS.length}</span>
            </div>

            {/* Interactive Carousel Pagination Dots */}
            <div className="flex items-center gap-1.5" title="Jump to management center">
              {ADMIN_TABS.map((tab, idx) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    title={`${idx + 1}. ${tab.label}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'w-5 bg-[#E0B182]'
                          : 'w-5 bg-[#8CB843]'
                        : isDark
                        ? 'w-2 bg-slate-700 hover:bg-slate-500'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Quick Carousel Indicator Strip */}
        <div className="flex lg:hidden items-center justify-between px-3 py-1 border-t border-black/5 dark:border-white/5 font-mono text-[10px] text-slate-400">
          <button
            type="button"
            onClick={handlePrevTab}
            className="flex items-center gap-1 hover:text-white transition-colors py-0.5"
          >
            <ChevronLeft className="h-3 w-3" />
            <span>Prev Center</span>
          </button>

          <div className="flex items-center gap-1.5">
            {ADMIN_TABS.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`h-1.5 rounded-full transition-all ${
                    isActive
                      ? isDark
                        ? 'w-4 bg-[#E0B182]'
                        : 'w-4 bg-[#8CB843]'
                      : 'w-1.5 bg-slate-600/40'
                  }`}
                  title={`${idx + 1}. ${tab.label}`}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleNextTab}
            className="flex items-center gap-1 hover:text-white transition-colors py-0.5"
          >
            <span>Next Center</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6">

        {/* =================================================================== */}
        {/* TAB 1: TRANSACTION JOURNAL (V1 Implementation)                      */}
        {/* =================================================================== */}
        {activeTab === 'transactions' && (
          <div className="space-y-6 max-w-7xl mx-auto font-mono">
            {/* Top Header & Sub-tab Navigation (Matching filter.PNG) */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222F4C] pb-4">
              <div className="space-y-0.5">
                <div className="text-[11px] font-mono font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>ADMINISTRATIVE RECORDS PORTAL</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white uppercase">
                  bizzbean transaction journal
                </h2>
              </div>

              {/* Sub-tabs on Right */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setJournalSubTab('transactions')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                    journalSubTab === 'transactions'
                      ? 'bg-[#84CC16] text-black border-[#84CC16] shadow-md'
                      : isDark
                      ? 'bg-[#141A2E] text-slate-300 border-[#222F4C] hover:text-white'
                      : 'bg-white text-slate-700 border-[#E8E2D8] hover:bg-slate-50'
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>SALES JOURNAL</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-current font-mono">
                    {transactions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setJournalSubTab('clients')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                    journalSubTab === 'clients'
                      ? 'bg-[#84CC16] text-black border-[#84CC16] shadow-md'
                      : isDark
                      ? 'bg-[#141A2E] text-slate-300 border-[#222F4C] hover:text-white'
                      : 'bg-white text-slate-700 border-[#E8E2D8] hover:bg-slate-50'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>CLIENT PROFILES</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-current font-mono">
                    {clientProfiles.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setJournalSubTab('nudges')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                    journalSubTab === 'nudges'
                      ? 'bg-[#84CC16] text-black border-[#84CC16] shadow-md'
                      : isDark
                      ? 'bg-[#141A2E] text-slate-300 border-[#222F4C] hover:text-white'
                      : 'bg-white text-slate-700 border-[#E8E2D8] hover:bg-slate-50'
                  }`}
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span>CLIENT COMMUNICATION & NUDGES</span>
                </button>

                {onBackToWorkstation && (
                  <button
                    type="button"
                    onClick={onBackToWorkstation}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-[#141A2E] hover:bg-[#1E2745] text-slate-300 border border-[#222F4C] transition-colors"
                  >
                    <span>CLOSE JOURNAL ←</span>
                  </button>
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SUB-VIEW 1: SALES JOURNAL (Matching filter.PNG)               */}
            {/* ------------------------------------------------------------- */}
            {journalSubTab === 'transactions' && (
              <>
                {/* 4 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Card 1: Gross Revenue */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                    isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
                  }`}>
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase font-semibold">GROSS REVENUE (INCL VAT)</div>
                      <div className="text-xl sm:text-2xl font-bold mt-1 text-emerald-400">
                        R {totalGrossZar.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-emerald-400/80 mt-0.5">Total billing output</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <span className="text-emerald-400 text-lg font-bold">$</span>
                    </div>
                  </div>

                  {/* Card 2: Net Revenue */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                    isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
                  }`}>
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase font-semibold">NET REVENUE (EXCL VAT)</div>
                      <div className="text-xl sm:text-2xl font-bold mt-1 text-[#5584B4]">
                        R {totalNetZar.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Bizzbean base earnings</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#5584B4]/15 border border-[#5584B4]/30 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5 text-[#5584B4]" />
                    </div>
                  </div>

                  {/* Card 3: VAT Collected */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                    isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
                  }`}>
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase font-semibold">VAT COLLECTED (15%)</div>
                      <div className="text-xl sm:text-2xl font-bold mt-1 text-amber-400">
                        R {totalVatZar.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Statutory South African Tax</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <span className="text-amber-400 text-lg font-bold">%</span>
                    </div>
                  </div>

                  {/* Card 4: Sales Count */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                    isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
                  }`}>
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase font-semibold">SALES COUNT</div>
                      <div className="text-xl sm:text-2xl font-bold mt-1 text-white">
                        {transactions.length} <span className="text-xs font-normal text-slate-400">invoices</span>
                      </div>
                      <div className="text-[10px] text-emerald-400/90 mt-0.5">Successfully captured</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-700/30 border border-slate-600 flex items-center justify-center shrink-0">
                      <Check className="h-5 w-5 text-slate-300" />
                    </div>
                  </div>
                </div>

                {/* Collapsible SARS Statutory VAT Calculator Banner (Matching filter.PNG) */}
                <div className={`rounded-2xl border transition-all overflow-hidden ${
                  isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-[#F4EFE6] border-[#E8E2D8]'
                }`}>
                  <button
                    type="button"
                    onClick={() => setIsVatCalculatorOpen(!isVatCalculatorOpen)}
                    className="w-full p-4 flex items-center justify-between gap-3 text-left transition-colors hover:bg-white/5 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <Calculator className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs uppercase tracking-wider text-white">
                            SARS STATUTORY VAT CALCULATOR
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            SARS 15%
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Instantly compute VAT Inclusive / Exclusive tax adjustments for accounting journals.
                        </p>
                      </div>
                    </div>
                    <div className="text-slate-400 p-1.5 rounded-lg bg-[#141A2E] border border-[#222F4C]">
                      {isVatCalculatorOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {/* Expanded Calculator Widget */}
                  {isVatCalculatorOpen && (
                    <div className="p-5 border-t border-[#222F4C] bg-[#12172A] space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-400 text-xs mb-1">Enter Transaction Amount (ZAR):</label>
                          <input
                            type="number"
                            step="0.01"
                            value={vatCalcAmount}
                            onChange={(e) => setVatCalcAmount(Math.max(0, Number(e.target.value) || 0))}
                            className="w-full p-2.5 rounded-xl bg-[#0B0F19] border border-[#222F4C] text-white font-bold text-sm focus:outline-hidden focus:border-[#5584B4]"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-xs mb-1">Tax Computation Mode:</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setVatCalcMode('exclusive')}
                              className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                                vatCalcMode === 'exclusive'
                                  ? 'bg-[#5584B4] text-white border-[#5584B4]'
                                  : 'bg-[#0B0F19] text-slate-400 border-[#222F4C] hover:text-white'
                              }`}
                            >
                              Exclusive (+15% VAT)
                            </button>
                            <button
                              type="button"
                              onClick={() => setVatCalcMode('inclusive')}
                              className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                                vatCalcMode === 'inclusive'
                                  ? 'bg-[#5584B4] text-white border-[#5584B4]'
                                  : 'bg-[#0B0F19] text-slate-400 border-[#222F4C] hover:text-white'
                              }`}
                            >
                              Inclusive (Extract 15%)
                            </button>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#222F4C] flex flex-col justify-between">
                          <div className="text-[10px] text-slate-400 uppercase">Statutory Standard Compliance</div>
                          <div className="text-xs text-slate-300">
                            Applicable in terms of Section 20(4) of the Value-Added Tax Act, 1991 of South Africa.
                          </div>
                        </div>
                      </div>

                      {/* Computed Summary */}
                      {(() => {
                        const amt = Math.max(0, Number(vatCalcAmount) || 0);
                        const netVal = vatCalcMode === 'exclusive' ? amt : amt / 1.15;
                        const vatVal = vatCalcMode === 'exclusive' ? amt * 0.15 : amt - netVal;
                        const grossVal = netVal + vatVal;
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                            <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#222F4C]">
                              <div className="text-[10px] text-slate-400 uppercase">Net Base Value (Excl. VAT)</div>
                              <div className="text-lg font-bold text-slate-200 mt-1">R {netVal.toFixed(2)}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">Base revenue account entry</div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#222F4C]">
                              <div className="text-[10px] text-amber-400 uppercase">SARS Output VAT (15%)</div>
                              <div className="text-lg font-bold text-amber-400 mt-1">R {vatVal.toFixed(2)}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">Statutory tax liability</div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-emerald-500/30">
                              <div className="text-[10px] text-emerald-400 uppercase">Gross Billing Output (Total)</div>
                              <div className="text-lg font-bold text-emerald-400 mt-1">R {grossVal.toFixed(2)}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">Total customer payable</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Red Box: INTERACTIVE QUERY CONTROLS (Matching filter.PNG) */}
                <div className="rounded-2xl border-2 border-rose-600/90 bg-[#12172A] p-5 space-y-4 shadow-xl">
                  {/* Title & Action Buttons Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222F4C] pb-3">
                    <div>
                      <h3 className="font-bold text-sm tracking-wide text-white uppercase flex items-center gap-2">
                        <span>INTERACTIVE QUERY CONTROLS</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Search invoice indices, date parameters, and partition results instantly.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#1B233D] hover:bg-[#253252] text-slate-200 border border-[#2F3E66] transition-colors"
                      >
                        RESET FILTERS
                      </button>

                      <button
                        type="button"
                        onClick={handleExportTxCsv}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#334155] hover:bg-[#475569] text-white border border-slate-500 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>EXPORT CSV WORKSHEET</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetJournalSeq}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition-colors"
                        title="Reset sequence to start at Invoice #1"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>RESET JOURNAL (#1)</span>
                      </button>

                      <button
                        type="button"
                        onClick={openNewTxModalWithNextInvoice}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 shadow-md transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>+ NEW MANUAL INVOICE</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Form Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1 flex items-center gap-1">
                        <span>📅 DATE FROM</span>
                      </label>
                      <input
                        type="date"
                        value={txDateFrom}
                        onChange={(e) => setTxDateFrom(e.target.value)}
                        placeholder="yyyy/mm/dd"
                        className="w-full p-2 rounded-xl bg-[#0B0F19] border border-[#222F4C] text-white focus:outline-hidden focus:border-[#5584B4]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 flex items-center gap-1">
                        <span>📅 DATE TO</span>
                      </label>
                      <input
                        type="date"
                        value={txDateTo}
                        onChange={(e) => setTxDateTo(e.target.value)}
                        placeholder="yyyy/mm/dd"
                        className="w-full p-2 rounded-xl bg-[#0B0F19] border border-[#222F4C] text-white focus:outline-hidden focus:border-[#5584B4]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 flex items-center gap-1">
                        <Search className="h-3 w-3 text-slate-400" />
                        <span>CLIENT / INVOICE / COUNTRY</span>
                      </label>
                      <input
                        type="text"
                        value={txSearch}
                        onChange={(e) => setTxSearch(e.target.value)}
                        placeholder="Search name, email, country"
                        className="w-full p-2 rounded-xl bg-[#0B0F19] border border-[#222F4C] text-white focus:outline-hidden focus:border-[#5584B4]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 flex items-center gap-1">
                        <Globe className="h-3 w-3 text-slate-400" />
                        <span>COUNTRY</span>
                      </label>
                      <select
                        value={txCountryFilter}
                        onChange={(e) => setTxCountryFilter(e.target.value)}
                        className="w-full p-2 rounded-xl bg-[#0B0F19] border border-[#222F4C] text-slate-200 focus:outline-hidden"
                      >
                        <option value="all">All Countries ({distinctCountries.length})</option>
                        {distinctCountries.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 flex items-center gap-1">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span>BIZZPARTNER</span>
                      </label>
                      <select
                        value={txAssociateFilter}
                        onChange={(e) => setTxAssociateFilter(e.target.value)}
                        className="w-full p-2 rounded-xl bg-[#0B0F19] border border-[#222F4C] text-slate-200 focus:outline-hidden"
                      >
                        <option value="all">All Associates</option>
                        {distinctAssociates.map((assoc) => (
                          <option key={assoc} value={assoc}>
                            {assoc}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 flex items-center gap-1">
                        <Receipt className="h-3 w-3 text-slate-400" />
                        <span>APPLICATION / COURSE</span>
                      </label>
                      <select
                        value={txProductFilter}
                        onChange={(e) => setTxProductFilter(e.target.value)}
                        className="w-full p-2 rounded-xl bg-[#0B0F19] border border-[#222F4C] text-slate-200 focus:outline-hidden"
                      >
                        <option value="all">All Products</option>
                        {distinctProducts.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quick Date Presets Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-400 text-[11px] uppercase font-bold">QUICK DATE PRESETS:</span>
                    <button
                      type="button"
                      onClick={() => handleSetDatePreset('today')}
                      className="px-3 py-1 rounded-lg bg-[#0B0F19] hover:bg-[#1E2745] text-slate-200 border border-[#222F4C] transition-colors"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDatePreset('this-month')}
                      className="px-3 py-1 rounded-lg bg-[#0B0F19] hover:bg-[#1E2745] text-slate-200 border border-[#222F4C] transition-colors"
                    >
                      This Month
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDatePreset('last-30')}
                      className="px-3 py-1 rounded-lg bg-[#0B0F19] hover:bg-[#1E2745] text-slate-200 border border-[#222F4C] transition-colors"
                    >
                      Last 30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDatePreset('ytd')}
                      className="px-3 py-1 rounded-lg bg-[#0B0F19] hover:bg-[#1E2745] text-slate-200 border border-[#222F4C] transition-colors"
                    >
                      Year to Date (YTD)
                    </button>
                  </div>
                </div>

                {/* Journal Records Table */}
                <div className={`rounded-2xl border overflow-hidden ${
                  isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
                }`}>
                  {/* Table Header Info Bar */}
                  <div className="p-3.5 border-b border-[#222F4C] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="font-bold text-white uppercase">
                      JOURNAL RECORDS TABLE ({filteredTransactions.length} MATCHING INVOICES)
                    </div>
                    <div className="text-[11px] text-slate-400 italic">
                      *Click column headers to sort by Country, Customer, Email, Date, or Values.
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className={`text-[11px] uppercase border-b ${
                        isDark ? 'bg-[#151D33] text-slate-400 border-[#222F4C]' : 'bg-[#F4EFE6] text-slate-600 border-[#E8E2D8]'
                      }`}>
                        <tr>
                          <th onClick={() => handleSort('invoiceNumber')} className="py-3 px-3 cursor-pointer hover:text-white">
                            <span className="flex items-center gap-1">
                              <span>INVOICE NO</span>
                              <ArrowUpDown className="h-3 w-3 opacity-60" />
                            </span>
                          </th>
                          <th onClick={() => handleSort('transactionDate')} className="py-3 px-3 cursor-pointer hover:text-white">
                            <span className="flex items-center gap-1">
                              <span>DATE</span>
                              <ArrowUpDown className="h-3 w-3 opacity-60" />
                            </span>
                          </th>
                          <th onClick={() => handleSort('customer')} className="py-3 px-3 cursor-pointer hover:text-white">
                            <span className="flex items-center gap-1">
                              <span>CUSTOMER</span>
                              <ArrowUpDown className="h-3 w-3 opacity-60" />
                            </span>
                          </th>
                          <th onClick={() => handleSort('customerEmail')} className="py-3 px-3 cursor-pointer hover:text-white">
                            <span className="flex items-center gap-1">
                              <span>EMAIL ADDRESS</span>
                              <ArrowUpDown className="h-3 w-3 opacity-60" />
                            </span>
                          </th>
                          <th onClick={() => handleSort('country')} className="py-3 px-3 cursor-pointer hover:text-white">
                            <span className="flex items-center gap-1 text-emerald-400">
                              <span>🌐 COUNTRY</span>
                              <ArrowUpDown className="h-3 w-3 opacity-60" />
                            </span>
                          </th>
                          <th onClick={() => handleSort('associate')} className="py-3 px-3 cursor-pointer hover:text-white">
                            <span className="flex items-center gap-1">
                              <span>ASSOCIATE</span>
                              <ArrowUpDown className="h-3 w-3 opacity-60" />
                            </span>
                          </th>
                          <th onClick={() => handleSort('productName')} className="py-3 px-3 cursor-pointer hover:text-white">
                            <span className="flex items-center gap-1">
                              <span>APPLICATION / COURSE</span>
                              <ArrowUpDown className="h-3 w-3 opacity-60" />
                            </span>
                          </th>
                          <th className="py-3 px-2 text-center">QTY & PRICE</th>
                          <th onClick={() => handleSort('lineValue')} className="py-3 px-3 text-right cursor-pointer hover:text-white">
                            <span className="flex items-center justify-end gap-1">
                              <span>NET (EXCL VAT)</span>
                              <ArrowUpDown className="h-3 w-3 opacity-60" />
                            </span>
                          </th>
                          <th onClick={() => handleSort('vatAmount')} className="py-3 px-3 text-right cursor-pointer hover:text-white">
                            <span className="flex items-center justify-end gap-1">
                              <span>VAT</span>
                              <ArrowUpDown className="h-3 w-3 opacity-60" />
                            </span>
                          </th>
                          <th onClick={() => handleSort('invoiceValue')} className="py-3 px-3 text-right cursor-pointer hover:text-white">
                            <span className="flex items-center justify-end gap-1">
                              <span>GROSS (INCL VAT)</span>
                              <ArrowUpDown className="h-3 w-3 opacity-60" />
                            </span>
                          </th>
                          <th className="py-3 px-2 text-center">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-[#1D2644]' : 'divide-[#E8E2D8]'}`}>
                        {filteredTransactions.map((tx) => (
                          <tr key={tx.invoiceNumber} className={isDark ? 'hover:bg-[#161F38]/50' : 'hover:bg-slate-50'}>
                            <td className="py-3 px-3">
                              <button
                                type="button"
                                onClick={() => setViewingInvoice(tx)}
                                className="font-bold text-[#5584B4] hover:underline flex items-center gap-1 cursor-pointer"
                                title="Click to view full Tax Invoice Slip"
                              >
                                <span>{tx.invoiceNumber}</span>
                              </button>
                            </td>
                            <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{tx.transactionDate}</td>
                            <td className="py-3 px-3">
                              <div className="text-white font-medium">{tx.customer}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-300">
                              <div className="text-[11px] text-slate-400">{tx.customerEmail}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#141A2E] text-slate-200 border border-[#2B3452]">
                                {tx.country || 'South Africa'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-300 text-[11px]">{tx.associate}</td>
                            <td className="py-3 px-3">
                              <div className="text-slate-200">{tx.productName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                [{tx.productType.toUpperCase()}] {tx.sku}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center text-slate-300">
                              {tx.quantity} × R {(Number(tx.unitPrice) || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right text-slate-300 font-medium">
                              R {(Number(tx.lineValue) || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right text-amber-400">
                              R {(Number(tx.vatAmount) || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-emerald-400">
                              R {(Number(tx.invoiceValue) || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => generateTaxInvoicePdf(tx)}
                                  title="Download Official SARS PDF Tax Invoice"
                                  className="p-1.5 rounded-lg bg-[#1F2942] hover:bg-[#2B395C] text-emerald-400 border border-[#35456E] transition-colors"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setViewingInvoice(tx)}
                                  title="View SARS Tax Invoice Slip"
                                  className="p-1.5 rounded-lg bg-[#1F2942] hover:bg-[#2B395C] text-slate-300 hover:text-white border border-[#35456E] transition-colors"
                                >
                                  <Eye className="h-3.5 w-3.5 text-[#5584B4]" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredTransactions.length === 0 && (
                          <tr>
                            <td colSpan={12} className="py-12 text-center text-slate-400 text-sm">
                              No transactions found matching your filter parameters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer Bar */}
                  <div className="p-3.5 border-t border-[#222F4C] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <div>
                      Showing {filteredTransactions.length} of {transactions.length} entries listed
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Standard statutory South African tax rules logged under 15% VAT threshold.
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SUB-VIEW 2: CLIENT DIRECTORY (Matching client directory.PNG) */}
            {/* ------------------------------------------------------------- */}
            {journalSubTab === 'clients' && (
              <div className="space-y-4">
                {/* Banner & Action Buttons */}
                <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                  isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
                }`}>
                  <p className="text-xs text-slate-400 font-mono">
                    Profiles registered for instant tax invoicing, automated dispatch & CRM tracking
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAdminManager(!showAdminManager)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                        showAdminManager
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                          : 'bg-[#161D32] hover:bg-[#1E2746] text-amber-300 border-amber-500/30'
                      }`}
                      title="Manage System Administrators and Roles"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Administrators ({adminEmailsList.length + 3})</span>
                      <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showAdminManager ? 'rotate-180' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenNewClientModal}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#5584B4] hover:bg-[#4773A0] text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>+ Add Client Profile</span>
                    </button>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* ADMINISTRATOR ACCESS & TEAM ROLES MANAGER PANEL          */}
                {/* ========================================================= */}
                {showAdminManager && (
                  <div className="p-5 rounded-2xl bg-[#0F1424] border border-amber-500/30 font-mono space-y-4 shadow-xl animate-in fade-in duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#222F4C] pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            Administrator Access & Team Roles
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Administrators have full privileges: Administration Centre, Master Transactions, CMS Consoles, and CRM Records.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Live Role Access Control
                      </span>
                    </div>

                    {/* Quick Add Administrator Form */}
                    <form onSubmit={handleAddNewAdmin} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                        <input
                          type="email"
                          required
                          value={newAdminInput}
                          onChange={(e) => setNewAdminInput(e.target.value)}
                          placeholder="e.g. partner@bizzbean.com or cofounder@gmail.com"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#090C16] border border-[#2B3452] text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="h-3.5 w-3.5 text-slate-950" />
                        <span>Grant Administrator Access</span>
                      </button>
                    </form>

                    {/* Active Administrator Badges List */}
                    <div className="space-y-2 pt-2">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Active Administrator Accounts:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {/* Built-in system root accounts */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141A2E] border border-amber-500/30 text-[11px] text-amber-300">
                          <ShieldCheck className="h-3 w-3 text-amber-400" />
                          <span>thebizzbeanchannel@gmail.com</span>
                          <span className="text-[9px] text-amber-400/70 font-sans uppercase font-bold px-1 rounded bg-amber-500/10">Root</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141A2E] border border-amber-500/30 text-[11px] text-amber-300">
                          <ShieldCheck className="h-3 w-3 text-amber-400" />
                          <span>quentinmac@bizzbean.com</span>
                          <span className="text-[9px] text-amber-400/70 font-sans uppercase font-bold px-1 rounded bg-amber-500/10">Founder</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141A2E] border border-amber-500/30 text-[11px] text-amber-300">
                          <ShieldCheck className="h-3 w-3 text-amber-400" />
                          <span>quentin@bizzbean.com</span>
                          <span className="text-[9px] text-amber-400/70 font-sans uppercase font-bold px-1 rounded bg-amber-500/10">Admin</span>
                        </div>

                        {/* Custom added admins */}
                        {adminEmailsList
                          .filter((em) => em !== 'thebizzbeanchannel@gmail.com' && em !== 'quentinmac@bizzbean.com' && em !== 'quentin@bizzbean.com')
                          .map((email) => (
                            <div
                              key={email}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1E2540] border border-amber-400/40 text-[11px] text-amber-200"
                            >
                              <ShieldCheck className="h-3 w-3 text-amber-400" />
                              <span>{email}</span>
                              <button
                                type="button"
                                onClick={() => handleRevokeAdmin(email)}
                                className="ml-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded p-0.5 cursor-pointer"
                                title={`Revoke administrator access for ${email}`}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Client Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clientProfiles.map((client) => {
                    if (!client) return null;
                    const clientEmail = (client.email || '').toLowerCase().trim();
                    const isClientAdmin = client.role === 'admin' || determineUserRole(client.email) === 'admin';
                    const clientInvoices = (transactions || []).filter(
                      (t) => Boolean(t && (t.customerEmail || '').toLowerCase().trim() === clientEmail)
                    );
                    const clientTotalZar = clientInvoices.reduce((acc, t) => acc + (Number(t?.invoiceValue) || 0), 0);

                    return (
                      <div
                        key={client.id}
                        className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 font-mono transition-all ${
                          isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Card Top: Company Name and Badges */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 font-bold text-sm text-[#5584B4]">
                              <Building className="h-4 w-4 shrink-0 text-[#5584B4]" />
                              <span className="text-white text-base">{client.companyName || client.name}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isClientAdmin && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3 text-amber-400" />
                                  <span>ADMIN</span>
                                </span>
                              )}

                              {client.vatNumber ? (
                                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  VAT: {client.vatNumber}
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded text-[10px] font-medium bg-slate-700/30 text-slate-400">
                                  Non-VAT
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Contact Details */}
                          <div className="text-xs space-y-1.5 text-slate-300 pt-2 border-t border-[#1D2644]">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span className="text-slate-300">{client.email}</span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                <span className="text-slate-400">{client.phone}</span>
                              </div>
                            )}
                            <div className="text-[11px] text-slate-400">
                              Location: {[client.city, client.country].filter(Boolean).join(', ') || 'South Africa'}
                            </div>
                          </div>

                          {/* Styled Quote Box */}
                          <p className="text-[11px] text-slate-300 italic bg-[#0B0F19] p-3 rounded-xl border border-[#1D2644] leading-relaxed">
                            "{client.notes || 'Key founder account registered for enterprise venture modeling.'}"
                          </p>
                        </div>

                        {/* Card Footer: Invoice Total & Action Buttons */}
                        <div className="pt-3 border-t border-[#1D2644] flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs">
                            <span className="text-slate-400">Invoices: </span>
                            <span className="text-slate-500"> • </span>
                            <span className="text-emerald-400 font-bold">R {(Number(clientTotalZar) || 0).toFixed(2)}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Toggle Admin Role Shortcut */}
                            <button
                              type="button"
                              onClick={() => handleToggleClientAdminRole(client)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                isClientAdmin
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                                  : 'bg-[#141A2E] text-slate-400 border border-[#2B3452] hover:text-amber-300 hover:border-amber-500/30'
                              }`}
                              title={isClientAdmin ? "Revoke administrator privileges" : "Grant administrator privileges"}
                            >
                              <ShieldCheck className={`h-3 w-3 ${isClientAdmin ? 'text-amber-400' : 'text-slate-500'}`} />
                              <span>{isClientAdmin ? 'Admin Role' : '+ Make Admin'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditClientModal(client)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-[#1A233D] hover:bg-[#253252] text-slate-200 border border-[#2F3E66] transition-colors cursor-pointer"
                              title="Edit Client Billing Profile"
                            >
                              <Edit2 className="h-3 w-3 text-slate-400" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenInvoiceFromClient(client)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-[#0E1322] hover:bg-[#1A233D] text-slate-200 border border-[#2B3452] transition-colors cursor-pointer"
                              title="Create Invoice for this Client"
                            >
                              <Receipt className="h-3 w-3 text-[#5584B4]" />
                              <span>Invoice</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SUB-VIEW 3: CLIENT COMMUNICATION & NUDGES                     */}
            {/* ------------------------------------------------------------- */}
            {journalSubTab === 'nudges' && (
              <div className="p-6 rounded-2xl bg-[#12172A] border border-[#222F4C] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white uppercase">
                      Client Communication & Automated Buy-Up Nudges
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Targeted client engagement engine utilizing transaction history and client directory profile data.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#222F4C] text-xs space-y-2 text-slate-300 leading-relaxed">
                  <p>
                    <strong className="text-white">Active Nudge Strategy:</strong> Clients with completed zero-cost introductory masterclasses (e.g. <em>learn how to earn access to capital</em>) are segmented for buy-up nudges towards full numerical modeling engines (<em>bizzcalc</em>, <em>cost_rec</em>, <em>bizzmodel</em>).
                  </p>
                  <p className="text-slate-400">
                    This automated channel will be fully wired in the upcoming Communications Centre project with personalized WhatsApp/email dispatch triggers.
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* MODAL 1: RECORD NEW TRANSACTION FORM                          */}
            {/* ============================================================= */}
            {isNewTxModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="w-full max-w-xl rounded-2xl bg-[#141A2E] border border-[#2B3452] p-6 space-y-4 text-slate-100 font-mono shadow-2xl my-8">
                  <div className="flex items-center justify-between border-b border-[#222F4C] pb-3">
                    <h3 className="font-bold text-sm text-white uppercase flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-[#5584B4]" />
                      <span>Post Realtime Transaction to General Ledger</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsNewTxModalOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Preset Catalogue Selector */}
                  <div className="bg-[#0E1322] p-3 rounded-xl border border-[#222F4C] space-y-2">
                    <label className="block text-[11px] text-slate-400 font-bold uppercase">
                      Quick Preset from Bizzbean Catalogue:
                    </label>
                    <select
                      onChange={(e) => handleSelectCatalogueItem(e.target.value)}
                      defaultValue=""
                      className="w-full p-2 rounded-lg bg-[#141A2E] border border-[#2B3452] text-xs text-white"
                    >
                      <option value="" disabled>Select standard app or course to autofill...</option>
                      {STANDARD_CATALOGUE_ITEMS.map((item) => (
                        <option key={item.sku} value={item.sku}>
                          [{item.type.toUpperCase()}] {item.name} — R {item.price.toFixed(2)} Excl VAT
                        </option>
                      ))}
                    </select>
                  </div>

                  <form onSubmit={handleRecordNewTx} className="space-y-3.5 text-xs">
                    {/* Row 1: Invoice # and Date */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Invoice Number:</label>
                        <input
                          type="text"
                          required
                          value={newTxInvoiceNo}
                          onChange={(e) => setNewTxInvoiceNo(e.target.value)}
                          className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Transaction Date:</label>
                        <input
                          type="date"
                          required
                          value={newTxDate}
                          onChange={(e) => setNewTxDate(e.target.value)}
                          className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                        />
                      </div>
                    </div>

                    {/* Row 2: Product Type, SKU, Product Name */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Product Type:</label>
                        <select
                          value={newTxProductType}
                          onChange={(e) => setNewTxProductType(e.target.value as any)}
                          className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white font-bold"
                        >
                          <option value="app">App (Software)</option>
                          <option value="course">Course (Masterclass)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">SKU:</label>
                        <input
                          type="text"
                          required
                          value={newTxSku}
                          onChange={(e) => setNewTxSku(e.target.value)}
                          className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Product Name:</label>
                        <input
                          type="text"
                          required
                          value={newTxProductName}
                          onChange={(e) => setNewTxProductName(e.target.value)}
                          className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                        />
                      </div>
                    </div>

                    {/* Row 3: Customer Selector / Name & Email */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-400">Select Existing Client Profile (Optional):</label>
                        <select
                          value={newTxSelectedProfileId}
                          onChange={(e) => handleSelectClientPreset(e.target.value)}
                          className="p-1 rounded bg-[#0E1220] border border-[#2B3452] text-[11px] text-[#5584B4]"
                        >
                          <option value="custom">-- Enter New Customer --</option>
                          {clientProfiles.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.companyName})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">Customer Full Name:</label>
                          <input
                            type="text"
                            required
                            value={newTxCustomer}
                            onChange={(e) => setNewTxCustomer(e.target.value)}
                            placeholder="Quentin McCullough"
                            className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Customer Email:</label>
                          <input
                            type="email"
                            required
                            value={newTxEmail}
                            onChange={(e) => setNewTxEmail(e.target.value)}
                            placeholder="quentin@bizzbean.com"
                            className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 4: Country & Associate */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Country:</label>
                        <input
                          type="text"
                          value={newTxCountry}
                          onChange={(e) => setNewTxCountry(e.target.value)}
                          placeholder="South Africa"
                          className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Associate / Sales Partner:</label>
                        <input
                          type="text"
                          value={newTxAssociate}
                          onChange={(e) => setNewTxAssociate(e.target.value)}
                          placeholder="BizzPartner SA"
                          className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                        />
                      </div>
                    </div>

                    {/* Row 5: Quantity, Unit Price, VAT Rate */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Quantity:</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={newTxQuantity}
                          onChange={(e) => setNewTxQuantity(Number(e.target.value))}
                          className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Unit Price (ZAR Excl):</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={newTxUnitPrice}
                          onChange={(e) => setNewTxUnitPrice(Number(e.target.value))}
                          className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">VAT Rate (SARS):</label>
                        <select
                          value={newTxVatRate}
                          onChange={(e) => setNewTxVatRate(Number(e.target.value))}
                          className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                        >
                          <option value="0.15">15% (Standard SARS)</option>
                          <option value="0">0% (Zero-rated / Export)</option>
                        </select>
                      </div>
                    </div>

                    {/* Real-time Calculation Summary Box */}
                    <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#222F4C] space-y-1">
                      <div className="text-[11px] text-slate-400 uppercase font-bold">
                        Calculated Accounting Breakdown:
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                        <div className="p-2 rounded-lg bg-[#141A2E]">
                          <div className="text-[10px] text-slate-400">Line Value (Excl)</div>
                          <div className="text-sm font-bold text-slate-200">
                            R {(newTxQuantity * newTxUnitPrice).toFixed(2)}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-[#141A2E]">
                          <div className="text-[10px] text-slate-400">VAT ({(newTxVatRate * 100).toFixed(0)}%)</div>
                          <div className="text-sm font-bold text-amber-400">
                            R {(newTxQuantity * newTxUnitPrice * newTxVatRate).toFixed(2)}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-[#141A2E] border border-emerald-500/30">
                          <div className="text-[10px] text-emerald-400">Invoice Total (Incl)</div>
                          <div className="text-sm font-bold text-emerald-400">
                            R {(newTxQuantity * newTxUnitPrice * (1 + newTxVatRate)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t border-[#222F4C]">
                      <button
                        type="button"
                        onClick={() => setIsNewTxModalOpen(false)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#1B233D] text-slate-300 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-1.5 rounded-lg bg-[#84CC16] hover:bg-[#65A30D] text-black font-bold shadow-md transition-colors"
                      >
                        Post to General Ledger
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* MODAL 2: SARS TAX INVOICE SLIP (VIEW / DOWNLOAD / PRINT)      */}
            {/* ============================================================= */}
            {viewingInvoice && (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="w-full max-w-2xl rounded-2xl bg-[#0E1322] border border-[#2B3452] p-6 space-y-6 text-slate-100 font-mono shadow-2xl my-8">
                  {/* Top Bar with Print, PDF Download, and Close */}
                  <div className="flex items-center justify-between border-b border-[#222F4C] pb-3">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-emerald-400" />
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                        Official SARS Tax Invoice Slip
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => generateTaxInvoicePdf(viewingInvoice)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download PDF Invoice</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#1F2942] hover:bg-[#2B395C] text-slate-200 border border-[#35456E] transition-colors"
                      >
                        <Printer className="h-3.5 w-3.5 text-[#5584B4]" />
                        <span>Print Slip</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewingInvoice(null)}
                        className="text-slate-400 hover:text-white text-sm px-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Printable Invoice Body */}
                  <div className="p-6 rounded-2xl bg-[#141A2E] border border-[#222F4C] space-y-6">
                    {/* Invoice Header */}
                    <div className="flex items-start justify-between border-b border-[#222F4C] pb-4">
                      <div>
                        <div className="text-xl font-black text-white tracking-wider flex items-center gap-2">
                          <span className="text-[#5584B4]">BIZZBEAN SA</span>
                          <span className="text-slate-400 text-xs font-normal">(PTY) LTD</span>
                        </div>
                        <div className="text-[11px] text-slate-300 mt-1">
                          67 Blouberg Cresent, Van Riebeeck Park, Kempton Park, South Africa, 1619
                        </div>
                        <div className="text-[10px] text-amber-400 mt-0.5">
                          VAT number will be provided shortly (Application in Process)
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Johannesburg, South Africa • accounts@bizzbean.com • https://bizzbean.com
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="inline-block px-2.5 py-1 rounded bg-[#5584B4]/20 border border-[#5584B4]/40 text-[#DDEBF7] font-bold text-xs">
                          TAX INVOICE
                        </div>
                        <div className="text-sm font-bold text-white mt-1">
                          {viewingInvoice.invoiceNumber}
                        </div>
                        <div className="text-xs text-slate-400">
                          Date: {viewingInvoice.transactionDate}
                        </div>
                      </div>
                    </div>

                    {/* Customer & Associate Information */}
                    <div className="grid grid-cols-2 gap-6 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Billed To (Customer):</div>
                        <div className="text-sm font-bold text-white mt-1">{viewingInvoice.customer}</div>
                        <div className="text-slate-300">{viewingInvoice.customerEmail}</div>
                        <div className="text-slate-400">Country of Origin: {viewingInvoice.country || 'South Africa'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Sales Channel / Associate:</div>
                        <div className="text-sm font-medium text-slate-200 mt-1">{viewingInvoice.associate}</div>
                        <div className="text-slate-400 text-[11px]">Payment Method: PayFast / Instant EFT</div>
                        <div className="text-emerald-400 text-[11px] font-bold">Status: Paid in Full</div>
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="rounded-xl border border-[#222F4C] overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#182038] text-slate-400 text-[10px] uppercase">
                          <tr>
                            <th className="py-2.5 px-3">SKU</th>
                            <th className="py-2.5 px-3">Description</th>
                            <th className="py-2.5 px-2 text-center">Type</th>
                            <th className="py-2.5 px-2 text-center">Qty</th>
                            <th className="py-2.5 px-3 text-right">Unit Price (Excl)</th>
                            <th className="py-2.5 px-3 text-right">Total (Excl)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1D2644]">
                          <tr>
                            <td className="py-3 px-3 text-slate-400 font-mono">{viewingInvoice.sku}</td>
                            <td className="py-3 px-3 text-white font-medium">{viewingInvoice.productName}</td>
                            <td className="py-3 px-2 text-center">
                              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-300">
                                {viewingInvoice.productType}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center text-slate-200">{viewingInvoice.quantity}</td>
                            <td className="py-3 px-3 text-right text-slate-300">
                              R {(Number(viewingInvoice.unitPrice) || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right text-slate-200 font-bold">
                              R {(Number(viewingInvoice.lineValue) || 0).toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Totals Calculation */}
                    <div className="flex justify-end">
                      <div className="w-64 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span>Subtotal (Excl. VAT):</span>
                          <span className="font-mono">R {(Number(viewingInvoice.lineValue) || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-amber-400">
                          <span>SARS Output VAT @ {((Number(viewingInvoice.vatRate) || 0.15) * 100).toFixed(0)}%:</span>
                          <span className="font-mono">R {(Number(viewingInvoice.vatAmount) || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-emerald-400 pt-2 border-t border-[#222F4C]">
                          <span>Invoice Value (Gross):</span>
                          <span className="font-mono">R {(Number(viewingInvoice.invoiceValue) || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* SARS Compliance Notice */}
                    <div className="p-3 rounded-xl bg-[#0E1322] border border-[#222F4C] text-[10px] text-slate-400 leading-relaxed">
                      Official Tax Invoice issued in terms of Section 20(4) of the Value-Added Tax Act, 1991 of South Africa.
                      All transactions verified and recorded in the BizzBean immutable general ledger.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* MODAL 3: SETUP / EDIT CLIENT BILLING PROFILE (Matching client profile.PNG) */}
            {/* ============================================================= */}
            {isNewClientModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="w-full max-w-2xl rounded-2xl bg-[#141A2E] border border-[#2B3452] p-6 space-y-5 text-slate-100 font-mono shadow-2xl my-8">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-[#222F4C] pb-3">
                    <h3 className="font-bold text-sm text-emerald-400 uppercase flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-400" />
                      <span>{editingClient ? 'EDIT CLIENT BILLING PROFILE' : '+ SETUP CLIENT BILLING PROFILE'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsNewClientModalOpen(false)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* 2-Column Form Matching client profile.PNG */}
                  <form onSubmit={handleSaveClientProfile} className="space-y-4 text-xs">
                    {/* Row 1: Contact Person & Primary Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1 uppercase text-[11px]">
                          CONTACT PERSON NAME *
                        </label>
                        <input
                          type="text"
                          required
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          placeholder="e.g. Lerato Molefe"
                          className="w-full p-2.5 rounded-xl bg-[#0E1220] border border-[#2B3452] text-white focus:outline-hidden focus:border-[#5584B4]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1 uppercase text-[11px]">
                          PRIMARY EMAIL *
                        </label>
                        <input
                          type="email"
                          required
                          value={newClientEmail}
                          onChange={(e) => setNewClientEmail(e.target.value)}
                          placeholder="e.g. lerato@molefeconsulting.com"
                          className="w-full p-2.5 rounded-xl bg-[#0E1220] border border-[#2B3452] text-white focus:outline-hidden focus:border-[#5584B4]"
                        />
                      </div>
                    </div>

                    {/* Row 2: Registered Company Name & VAT Number */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1 uppercase text-[11px]">
                          REGISTERED COMPANY NAME
                        </label>
                        <input
                          type="text"
                          value={newClientCompany}
                          onChange={(e) => setNewClientCompany(e.target.value)}
                          placeholder="e.g. Molefe Capital Group (Pty) Ltd"
                          className="w-full p-2.5 rounded-xl bg-[#0E1220] border border-[#2B3452] text-white focus:outline-hidden focus:border-[#5584B4]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1 uppercase text-[11px]">
                          VAT REGISTRATION NUMBER (SOUTH AFRICA)
                        </label>
                        <input
                          type="text"
                          value={newClientVat}
                          onChange={(e) => setNewClientVat(e.target.value)}
                          placeholder="e.g. 4010258199"
                          className="w-full p-2.5 rounded-xl bg-[#0E1220] border border-[#2B3452] text-white focus:outline-hidden focus:border-[#5584B4]"
                        />
                      </div>
                    </div>

                    {/* Row 3: Mobile/Phone Portfolio, City Location, Country of Association */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1 uppercase text-[11px]">
                          MOBILE/PHONE PORTFOLIO
                        </label>
                        <input
                          type="text"
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          placeholder="e.g. +27 82 555 4321"
                          className="w-full p-2.5 rounded-xl bg-[#0E1220] border border-[#2B3452] text-white focus:outline-hidden focus:border-[#5584B4]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1 uppercase text-[11px]">
                          CITY LOCATION
                        </label>
                        <input
                          type="text"
                          value={newClientCity}
                          onChange={(e) => setNewClientCity(e.target.value)}
                          placeholder="e.g. Johannesburg"
                          className="w-full p-2.5 rounded-xl bg-[#0E1220] border border-[#2B3452] text-white focus:outline-hidden focus:border-[#5584B4]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1 uppercase text-[11px]">
                          🌐 COUNTRY OF ASSOCIATION
                        </label>
                        <select
                          value={newClientCountry}
                          onChange={(e) => setNewClientCountry(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-[#0E1220] border border-[#2B3452] text-white focus:outline-hidden focus:border-[#5584B4]"
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.name}>
                              {c.code} {c.name} ({c.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Role & Access Privileges */}
                    <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-amber-500/25 space-y-1.5">
                      <label className="block text-slate-200 font-bold uppercase text-[11px] flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                        <span>ROLE & ACCESS PRIVILEGES</span>
                      </label>
                      <select
                        value={newClientRole}
                        onChange={(e) => setNewClientRole(e.target.value as 'member' | 'admin')}
                        className="w-full p-2.5 rounded-xl bg-[#0E1220] border border-[#2B3452] text-white focus:outline-hidden focus:border-amber-400"
                      >
                        <option value="member">Client Member (Standard Client Portal Access)</option>
                        <option value="admin">Administrator (Full Administration Centre, CMS & Ledger Access)</option>
                      </select>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {newClientRole === 'admin'
                          ? '🛡️ This user is granted Administrator status and can access all transaction journals, CMS controls, and client directories.'
                          : 'Standard member account for venture tools, modeling, and client slips.'}
                      </p>
                    </div>

                    {/* Row 4: Internal Billing Notes */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1 uppercase text-[11px]">
                        INTERNAL BILLING NOTES
                      </label>
                      <textarea
                        rows={3}
                        value={newClientNotes}
                        onChange={(e) => setNewClientNotes(e.target.value)}
                        placeholder="Enterprise discount arrangements, payment cycle conditions, contract limits..."
                        className="w-full p-2.5 rounded-xl bg-[#0E1220] border border-[#2B3452] text-white focus:outline-hidden focus:border-[#5584B4]"
                      />
                    </div>

                    {/* Bottom Buttons */}
                    <div className="pt-3 flex justify-end gap-3 border-t border-[#222F4C]">
                      <button
                        type="button"
                        onClick={() => setIsNewClientModalOpen(false)}
                        className="px-5 py-2 rounded-xl bg-[#1B233D] hover:bg-[#253252] text-slate-300 border border-[#2F3E66] transition-colors font-bold cursor-pointer"
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-black font-bold shadow-md transition-colors cursor-pointer"
                      >
                        {editingClient ? 'UPDATE BILLING PROFILE' : 'ESTABLISH BILLING PROFILE'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: TALK TO US DIALOGUE RESPONSE CENTRE (#3 IN OLD CMS)          */}
        {/* =================================================================== */}
        {activeTab === 'dialogue-centre' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Top Stat Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'}`}>
                <div className="text-[11px] text-slate-400 uppercase">Inquiries Received</div>
                <div className="text-xl font-bold mt-1 text-white">{inquiries.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Founders & escalations</div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'}`}>
                <div className="text-[11px] text-slate-400 uppercase">New Pending</div>
                <div className="text-xl font-bold mt-1 text-amber-400">
                  {inquiries.filter((i) => i.status === 'new').length}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Action required</div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'}`}>
                <div className="text-[11px] text-slate-400 uppercase">Resolved Dispatched</div>
                <div className="text-xl font-bold mt-1 text-emerald-400">
                  {inquiries.filter((i) => i.status === 'resolved' || i.status === 'reviewed').length}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Closed advisory sessions</div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'}`}>
                <div className="text-[11px] text-slate-400 uppercase">Coach GIM Channel</div>
                <div className="text-xl font-bold mt-1 text-[#5584B4]">Always On</div>
                <div className="text-[10px] text-slate-500 mt-0.5">thebizzbeanchannel@gmail.com</div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
            }`}>
              <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={inquirySearch}
                    onChange={(e) => setInquirySearch(e.target.value)}
                    placeholder="Search inquiries by sender, email, subject, or message..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs font-mono bg-[#0B0F19] border border-[#222F4C] text-white focus:outline-hidden focus:border-[#5584B4]"
                  />
                </div>
                <select
                  value={inquiryStatusFilter}
                  onChange={(e) => setInquiryStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono bg-[#0B0F19] border border-[#222F4C] text-slate-200 focus:outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <button
                onClick={async () => {
                  try {
                    const testInq = await createEnquiry({
                      senderName: 'Kagiso Molefe',
                      senderEmail: 'kagiso@nexustech.co.za',
                      companyName: 'Nexus Tech SA',
                      senderPhone: '+27 82 555 1234',
                      subject: 'Break-even contribution margin validation in bizzcalc',
                      message: 'Our seed investors asked us to reconcile our blended CAC with our 18-month cash runway buffer. How do we model price elasticity with bizzcalc?',
                      category: 'capital',
                      source: 'admin_simulation',
                      status: 'new',
                    });
                    setInquiries((prev) => [testInq, ...prev.filter((i) => i.id !== testInq.id)]);
                    showToast('Simulated founder inquiry saved to Firestore & GIM Dialogue Desk.');
                  } catch (e) {
                    showToast('Simulated founder inquiry generated.');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#1E2548] hover:bg-[#283260] text-slate-200 border border-[#3B487A] transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-[#5584B4]" />
                <span>Simulate Inbound Inquiry</span>
              </button>
              {inquiries.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear all inquiries from the Dialogue Centre?')) {
                      setInquiries([]);
                      localStorage.setItem('bizzdesk_cms_inquiries_v1', JSON.stringify([]));
                      showToast('All inquiries cleared.');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-colors"
                  title="Clear all recorded inquiries"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear Inquiries</span>
                </button>
              )}
            </div>

            {/* Inquiries List */}
            <div className="space-y-3">
              {filteredInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className={`p-5 rounded-2xl border space-y-3 transition-colors ${
                    isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#222F4C]/40 pb-3">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-white text-sm">{inq.senderName || 'Anonymous Founder'}</span>
                      <span className="text-slate-400">({inq.senderEmail || 'No email'})</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          inq.status === 'new'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : inq.status === 'reviewed'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {inq.status || 'new'}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{inq.date || 'Recent'}</span>
                    </div>
                  </div>

                  <div>
                    <div className="font-mono text-xs font-bold text-[#DDEBF7] mb-1">{inq.subject || 'Advisory Inquiry'}</div>
                    <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#222F4C] text-xs text-slate-300 leading-relaxed font-sans">
                      "{inq.message || ''}"
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 font-mono text-xs">
                    <button
                      onClick={() => handleOpenReplyModal(inq)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] text-white font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Reply from GIM Desk</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Composer Modal */}
            {replyingInquiry && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="w-full max-w-2xl rounded-2xl bg-[#141A2E] border border-[#2B3452] p-6 space-y-4 text-slate-100 font-mono shadow-2xl">
                  <div className="flex items-center justify-between border-b border-[#222F4C] pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-white uppercase flex items-center gap-2">
                        <Send className="h-4 w-4 text-[#5584B4]" />
                        <span>Dispatch Advisory Response</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Replying to {replyingInquiry.senderName} ({replyingInquiry.senderEmail})
                      </p>
                    </div>
                    <button
                      onClick={() => setReplyingInquiry(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Preset Quick Responses */}
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1.5">Apply Response Template:</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyReplyPreset('gim-loop')}
                        className="px-2.5 py-1 rounded-lg bg-[#1E2548] hover:bg-[#2B3666] text-[11px] text-slate-200 border border-[#3B487A]"
                      >
                        GIM Socratic AI-LOOP
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyReplyPreset('tokens')}
                        className="px-2.5 py-1 rounded-lg bg-[#1E2548] hover:bg-[#2B3666] text-[11px] text-slate-200 border border-[#3B487A]"
                      >
                        Grant 350 BizzTokens
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyReplyPreset('forecast')}
                        className="px-2.5 py-1 rounded-lg bg-[#1E2548] hover:bg-[#2B3666] text-[11px] text-slate-200 border border-[#3B487A]"
                      >
                        3-Statement Model Guide
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Subject:</label>
                      <input
                        type="text"
                        value={replySubject}
                        onChange={(e) => setReplySubject(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-[#0E1220] border border-[#2B3452] text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Advisory Response Message:</label>
                      <textarea
                        rows={7}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#0E1220] border border-[#2B3452] text-slate-200 font-sans leading-relaxed text-xs focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-[#222F4C]">
                    <button
                      type="button"
                      onClick={() => setReplyingInquiry(null)}
                      className="px-4 py-2 rounded-xl bg-[#1B233D] text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSendReply}
                      className="px-5 py-2 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Dispatch from GIM Desk</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: ASSOCIATE BULK CLIENT IMPORTS (#9 IN OLD CMS)                */}
        {/* =================================================================== */}
        {activeTab === 'bulk-imports' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Top Stat Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'}`}>
                <div className="text-[11px] text-slate-400 uppercase">Batches Provisioned</div>
                <div className="text-xl font-bold mt-1 text-white">{associateBatches.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Cohort imports</div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'}`}>
                <div className="text-[11px] text-slate-400 uppercase">Total Founders Enrolled</div>
                <div className="text-xl font-bold mt-1 text-emerald-400">{totalCohortFounders}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Sandbox workstations</div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'}`}>
                <div className="text-[11px] text-slate-400 uppercase">Tokens Distributed</div>
                <div className="text-xl font-bold mt-1 text-amber-400 flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  <span>{totalBatchTokens.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Ecosystem liquidity</div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'}`}>
                <div className="text-[11px] text-slate-400 uppercase">Incubator Network</div>
                <div className="text-xl font-bold mt-1 text-[#5584B4]">Verified Sponsoring</div>
                <div className="text-[10px] text-slate-500 mt-0.5">GEP · Stellenbosch · IDC</div>
              </div>
            </div>

            {/* Import Action Banner */}
            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
            }`}>
              <div>
                <div className="font-mono text-sm font-bold text-white uppercase flex items-center gap-2">
                  <Upload className="h-4 w-4 text-[#5584B4]" />
                  <span>Cohort CSV Batch Provisioning Engine</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Upload CSV rosters from incubators, accelerators, or university entrepreneurship cells to batch-provision member sandbox accounts and credit BizzTokens.
                </p>
              </div>
              <button
                onClick={() => setIsCsvImportModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>+ Import CSV Cohort Batch</span>
              </button>
            </div>

            {/* Batches Table */}
            <div className="space-y-3">
              <div className="font-mono text-xs text-slate-400 uppercase">
                Active Associate Batches & Provisioned Sandboxes ({associateBatches.length})
              </div>
              <div className="space-y-2.5">
                {associateBatches.map((b) => (
                  <div
                    key={b.id}
                    className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
                      isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{b.batchName}</div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        Partner: <span className="text-slate-300 font-semibold">{b.organization}</span> · Provisioned on {b.date}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-white font-bold">{b.candidateCount} Founders</div>
                        <div className="text-amber-400 text-[11px]">+{b.tokensPerAccount} Tokens each</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold border border-emerald-500/30">
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CSV Import Modal */}
            {isCsvImportModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="w-full max-w-xl rounded-2xl bg-[#141A2E] border border-[#2B3452] p-6 space-y-4 text-slate-100 font-mono shadow-2xl">
                  <div className="flex items-center justify-between border-b border-[#222F4C] pb-3">
                    <h3 className="font-bold text-sm text-white uppercase flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#5584B4]" />
                      <span>Import Associate Cohort via CSV</span>
                    </h3>
                    <button
                      onClick={() => setIsCsvImportModalOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCommitCsvBatch} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Batch / Cohort Name:</label>
                      <input
                        type="text"
                        required
                        value={newBatchName}
                        onChange={(e) => setNewBatchName(e.target.value)}
                        placeholder="e.g. Durban Ocean-Economy Seed 2026"
                        className="w-full p-2.5 rounded-xl bg-[#0E1220] border border-[#2B3452] text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Organization / Incubator:</label>
                        <input
                          type="text"
                          required
                          value={newBatchOrg}
                          onChange={(e) => setNewBatchOrg(e.target.value)}
                          placeholder="e.g. Innovate Durban"
                          className="w-full p-2.5 rounded-xl bg-[#0E1220] border border-[#2B3452] text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Starting Tokens per Founder:</label>
                        <input
                          type="number"
                          value={newBatchTokens}
                          onChange={(e) => setNewBatchTokens(Number(e.target.value))}
                          className="w-full p-2.5 rounded-xl bg-[#0E1220] border border-[#2B3452] text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-400">Paste CSV Roster Data:</label>
                        <span className="text-[10px] text-slate-500">Format: Name, Email, Company, Stage</span>
                      </div>
                      <textarea
                        rows={6}
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-[#0E1220] border border-[#2B3452] text-slate-200 font-mono text-[11px]"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-2 border-t border-[#222F4C]">
                      <button
                        type="button"
                        onClick={() => setIsCsvImportModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-[#1B233D] text-slate-300 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] text-white font-bold text-xs"
                      >
                        Provision & Credit Tokens
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: PERSONAL PROMOTION EMAILS (#10 IN OLD CMS)                   */}
        {/* =================================================================== */}
        {activeTab === 'promo-emails' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Top Stat Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'}`}>
                <div className="text-[11px] text-slate-400 uppercase">Campaign Templates</div>
                <div className="text-xl font-bold mt-1 text-white">{promoEmails.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">High-conversion outreach</div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'}`}>
                <div className="text-[11px] text-slate-400 uppercase">Total Dispatched</div>
                <div className="text-xl font-bold mt-1 text-emerald-400">
                  {promoEmails.reduce((acc, c) => acc + (c.sentCount || 0), 0)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Targeted founder emails</div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'}`}>
                <div className="text-[11px] text-slate-400 uppercase">Average Open Rate</div>
                <div className="text-xl font-bold mt-1 text-amber-400">67.3%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Industry avg ~21%</div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'}`}>
                <div className="text-[11px] text-slate-400 uppercase">Average Click-Through</div>
                <div className="text-xl font-bold mt-1 text-[#5584B4]">44.3%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Workstation activations</div>
              </div>
            </div>

            {/* Dual Column Layout: Left Campaign Selector, Right Live Branded Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Campaign Selector & Merge Variables */}
              <div className="lg:col-span-5 space-y-4">
                <div className="font-mono text-xs text-slate-400 uppercase">
                  Select Promotion Email Campaign ({promoEmails.length})
                </div>

                <div className="space-y-2">
                  {promoEmails.map((camp) => {
                    const isSelected = camp.id === selectedPromoEmailId;
                    return (
                      <div
                        key={camp.id}
                        onClick={() => setSelectedPromoEmailId(camp.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? isDark
                              ? 'bg-[#18233F] border-[#5584B4] shadow-md'
                              : 'bg-white border-[#5584B4] shadow-md ring-1 ring-[#5584B4]'
                            : isDark
                            ? 'bg-[#12172A] border-[#222F4C] hover:bg-[#161F38]'
                            : 'bg-white border-[#E8E2D8] hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-white">{camp.campaignName}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              camp.status === 'ready'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : camp.status === 'dispatched'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : 'bg-slate-500/20 text-slate-300'
                            }`}
                          >
                            {camp.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Segment: <span className="text-slate-300">{camp.targetSegment}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-[#222F4C]/40">
                          <span>Sent: {camp.sentCount}</span>
                          <span>Open: {camp.openRate}</span>
                          <span>Click: {camp.clickRate}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Merge Tags & Test Dispatch Controls */}
                <div className={`p-4 rounded-2xl border space-y-3 font-mono text-xs ${
                  isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
                }`}>
                  <div className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Personalization Merge Tags</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400">Founder Name:</label>
                      <input
                        type="text"
                        value={mergeFounderName}
                        onChange={(e) => setMergeFounderName(e.target.value)}
                        className="w-full p-1.5 rounded-lg bg-[#0B0F19] border border-[#222F4C] text-white text-xs mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Company Name:</label>
                      <input
                        type="text"
                        value={mergeCompanyName}
                        onChange={(e) => setMergeCompanyName(e.target.value)}
                        className="w-full p-1.5 rounded-lg bg-[#0B0F19] border border-[#222F4C] text-white text-xs mt-0.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Test Dispatch Recipient:</label>
                    <div className="flex gap-2 mt-0.5">
                      <input
                        type="email"
                        value={testEmailRecipient}
                        onChange={(e) => setTestEmailRecipient(e.target.value)}
                        className="flex-1 p-1.5 rounded-lg bg-[#0B0F19] border border-[#222F4C] text-white text-xs"
                      />
                      <button
                        onClick={handleSendTestEmail}
                        className="px-3 py-1.5 rounded-lg bg-[#1F2942] hover:bg-[#2B395C] text-slate-200 text-xs font-bold shrink-0"
                      >
                        Send Test
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: High-Fidelity Branded Email Preview */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                  <span className="uppercase">Live Branded Email Template Preview</span>
                  <button
                    onClick={() => activePromoEmail && handleDispatchCampaign(activePromoEmail.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] text-white font-bold shadow-md"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Dispatch Campaign to Segment</span>
                  </button>
                </div>

                {/* The Email Canvas */}
                <div className="rounded-2xl border border-[#2B3452] overflow-hidden bg-[#0F1424] shadow-2xl">
                  {/* Email Chrome Bar */}
                  <div className="p-3 bg-[#151C33] border-b border-[#252E4A] text-xs font-mono text-slate-300 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">From:</span>
                      <span className="text-white font-bold">{(activePromoEmail?.senderPersona || 'Coach GIM')} &lt;thebizzbeanchannel@gmail.com&gt;</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">To:</span>
                      <span className="text-[#DDEBF7]">{mergeFounderName} &lt;{testEmailRecipient}&gt;</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Subject:</span>
                      <span className="text-amber-400 font-bold">{activePromoEmail?.subject || 'Welcome to Bizzbean'}</span>
                    </div>
                  </div>

                  {/* Email Body Interior */}
                  <div className="p-6 sm:p-8 space-y-6 text-slate-200 font-sans">
                    {/* Bizzbean Brand Header */}
                    <div className="flex items-center justify-between border-b border-[#222F4C] pb-4">
                      <div className="flex items-center gap-2.5">
                        <BizzbeanLogoIcon className="h-7 w-7 text-[#5584B4]" />
                        <div>
                          <div className="font-mono text-sm font-bold text-white tracking-wide">BIZZBEAN</div>
                          <div className="font-mono text-[10px] text-slate-400 lowercase">
                            infinite wisdom. instant viability. always on.
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                        +{activePromoEmail?.tokensIncluded || 0} BizzTokens Enclosed
                      </span>
                    </div>

                    {/* Headline */}
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        {activePromoEmail?.headline || 'Accelerate Your Venture'}
                      </h2>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        {activePromoEmail?.previewHeader || ''}
                      </p>
                    </div>

                    {/* Personalized Body Text */}
                    <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3 whitespace-pre-line">
                      {(activePromoEmail?.bodyText || '')
                        .replace(/\{\{founder_name\}\}/g, mergeFounderName)
                        .replace(/\{\{company_name\}\}/g, mergeCompanyName)}
                    </div>

                    {/* Featured Solution Callout Card */}
                    <div className="p-4 rounded-xl bg-[#151D33] border border-[#2B385E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-mono text-[11px] text-amber-400 uppercase font-bold">
                          Featured Executive Tool
                        </div>
                        <div className="font-mono text-sm font-bold text-white mt-0.5">
                          {activePromoEmail?.highlightedSolution || 'bizz-DESK Executive Tool'}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Audit-ready financial modeling with zero macro dependencies.
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-5 py-2.5 rounded-xl bg-[#5584B4] text-white font-mono font-bold text-xs shadow-md shrink-0 uppercase tracking-wider"
                      >
                        {activePromoEmail?.ctaLabel || 'Enter Workstation'}
                      </button>
                    </div>

                    {/* Email Footer */}
                    <div className="pt-6 border-t border-[#222F4C] text-[11px] text-slate-500 font-mono space-y-1">
                      <div>Bizzbean (Pty) Ltd. · Private Member Desks & Sandboxes</div>
                      <div>Google Workspace & Gemini Core Architecture · AES-256 Governed</div>
                      <div className="text-[10px] text-slate-600">
                        You received this personal dispatch as an authorized founder on bizz-DESK.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: PRESENT CMS CONSOLE (MASTER MATRIX & CONFIGURATION)          */}
        {/* =================================================================== */}
        {activeTab === 'cms-console' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Top Bar with Search & Launch Standalone Button */}
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
            }`}>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-[#5584B4]" />
                <div>
                  <h3 className="font-mono text-xs font-bold text-white uppercase">
                    Stage-Centric Master Matrix & Live Store Catalog
                  </h3>
                  <p className="text-xs text-slate-400">
                    Direct integration with header CMS Console. All changes automatically sync to website.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={cmsSearch}
                    onChange={(e) => setCmsSearch(e.target.value)}
                    placeholder="Search products, SKU, stage..."
                    className="pl-9 pr-3 py-1.5 rounded-xl text-xs font-mono bg-[#0B0F19] border border-[#222F4C] text-white focus:outline-hidden"
                  />
                </div>
                {onOpenStandaloneCmsModal && (
                  <button
                    onClick={onOpenStandaloneCmsModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#5584B4] hover:bg-[#4773A0] text-white shadow-xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open Fullscreen Modal</span>
                  </button>
                )}
              </div>
            </div>

            {/* Products Master Matrix Table */}
            <div className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
            }`}>
              <div className="p-3 bg-[#151D33] border-b border-[#222F4C] flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-white uppercase">
                  Active Products & Course Lessons ({filteredCmsProducts.length})
                </span>
                <span className="text-slate-400 text-[11px]">
                  V1 Formula: Selling Price base · 15% VAT · 20% Tokens
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className={`text-[11px] uppercase border-b ${
                    isDark ? 'bg-[#151D33] text-slate-400 border-[#222F4C]' : 'bg-[#F4EFE6] text-slate-600 border-[#E8E2D8]'
                  }`}>
                    <tr>
                      <th className="py-2.5 px-3">Seq</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Stage</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Selling Price</th>
                      <th className="py-2.5 px-3 text-right">Tokens</th>
                      <th className="py-2.5 px-3 text-right">Ticket Benchmark</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[#1D2644]' : 'divide-[#E8E2D8]'}`}>
                    {filteredCmsProducts.map((p) => (
                      <tr key={p.id} className={isDark ? 'hover:bg-[#161F38]/50' : 'hover:bg-slate-50'}>
                        <td className="py-2.5 px-3 font-bold text-amber-400">#{p.seq}</td>
                        <td className="py-2.5 px-3 text-[#5584B4]">{p.sku}</td>
                        <td className="py-2.5 px-3 text-white font-medium">{p.name}</td>
                        <td className="py-2.5 px-3 text-emerald-400 capitalize">{p.stage}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            p.type === 'course' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-white">
                          R {(Number(p.sellingPriceZAR) || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                          +{p.tokensAllocated || 0}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400">
                          R {(Number(p.ticketPriceZAR) || Number(p.sellingPriceZAR) || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {p.type === 'course' ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectSolutionById) onSelectSolutionById(p.id);
                                if (onLaunchApp) onLaunchApp('bizzclass');
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#5584B4]/20 hover:bg-[#5584B4] text-[#DDEBF7] hover:text-white transition-colors border border-[#5584B4]/40 whitespace-nowrap"
                              title="Manage Lessons in BizzClass"
                            >
                              Manage Lessons ({(p.courseLessons || []).length})
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectSolutionById) onSelectSolutionById(p.id);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors whitespace-nowrap"
                            >
                              View Solution
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 6: ABOUT BIZZBEAN CONTENT                                       */}
        {/* =================================================================== */}
        {activeTab === 'about-bizzbean' && (
          <div className="space-y-6 max-w-4xl mx-auto font-mono">
            {/* Header Manifesto Banner */}
            <div className={`p-6 sm:p-8 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-amber-400 uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  <span>Official Mission & Manifesto · Cloud Synchronized</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditSocialMissionEquation(aboutData.socialMissionEquation || DEFAULT_MISSION_EQUATION);
                      setEditSocialMissionSubtext(aboutData.socialMissionSubtext || DEFAULT_MISSION_SUBTEXT);
                      setEditWhoAreWe(aboutData.whoAreWe);
                      setEditWhatWeDo(aboutData.whatWeDoPanel || aboutData.whatWeDo || DEFAULT_WHAT_WE_DO);
                      setEditWhereGoing(aboutData.whereAreWeGoing);
                      setEditHowSolutions(aboutData.howSolutionsEnableGrowth);
                      setIsEditingAbout(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#8CB843] hover:bg-[#7ba43b] text-slate-950 font-bold text-xs uppercase transition-colors cursor-pointer shadow-xs"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit & Publish to Cloud</span>
                  </button>
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide uppercase font-sans">
                ABOUT BIZZBEAN
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-mono">
                infinite wisdom · instant viability · always on
              </p>
            </div>

            {/* Live Profile Heading & Mission Equation (Reference: profile heading.PNG) */}
            <div
              className={`p-5 rounded-2xl border text-center shadow-xs ${
                isDark ? 'bg-[#141A2E] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
              }`}
            >
              <div className="text-[10px] uppercase font-mono font-bold text-amber-500 mb-1.5 tracking-wider">
                LIVE PUBLISHED PROFILE HEADING (WEBSITE & SLIDING DOORS)
              </div>
              <div className="font-mono text-xs sm:text-sm font-bold text-white tracking-tight leading-relaxed uppercase">
                {aboutData.socialMissionEquation || DEFAULT_MISSION_EQUATION}
              </div>
              <div className="text-xs text-slate-400 mt-1.5 max-w-2xl mx-auto leading-relaxed">
                {aboutData.socialMissionSubtext || DEFAULT_MISSION_SUBTEXT}
              </div>
            </div>

            {/* The 4 Foundational Questions with Headings, Paragraphs, and Bullet Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-5 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
              }`}>
                <div className="font-bold text-xs text-amber-400 uppercase flex items-center justify-between mb-1">
                  <span>1. WHO ARE WE</span>
                  <span className="text-[10px] text-[#C59B63] font-normal">identity & purpose</span>
                </div>
                <FormattedAboutContent content={aboutData.whoAreWe || DEFAULT_WHO_ARE_WE} isDark={isDark} />
              </div>

              <div className={`p-5 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
              }`}>
                <div className="font-bold text-xs text-amber-400 uppercase flex items-center justify-between mb-1">
                  <span>2. WHAT WE DO</span>
                  <span className="text-[10px] text-[#C59B63] font-normal">mechanics & tools</span>
                </div>
                <FormattedAboutContent content={aboutData.whatWeDoPanel || aboutData.whatWeDo || DEFAULT_WHAT_WE_DO} isDark={isDark} />
              </div>

              <div className={`p-5 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
              }`}>
                <div className="font-bold text-xs text-amber-400 uppercase flex items-center justify-between mb-1">
                  <span>3. WHERE ARE WE GOING</span>
                  <span className="text-[10px] text-[#C59B63] font-normal">vision & trajectory</span>
                </div>
                <FormattedAboutContent content={aboutData.whereAreWeGoing || DEFAULT_WHERE_ARE_WE_GOING} isDark={isDark} />
              </div>

              <div className={`p-5 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
              }`}>
                <div className="font-bold text-xs text-amber-400 uppercase flex items-center justify-between mb-1">
                  <span>4. HOW SOLUTIONS ENABLE GROWTH</span>
                  <span className="text-[10px] text-[#C59B63] font-normal">spectrum & outcomes</span>
                </div>
                <FormattedAboutContent content={aboutData.howSolutionsEnableGrowth || DEFAULT_HOW_SOLUTIONS_ENABLE_GROWTH} isDark={isDark} />
              </div>
            </div>

            {/* Social Mission & Architecture Card */}
            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDark ? 'bg-[#151D33] border-[#2B385E]' : 'bg-white border-[#E8E2D8] shadow-2xs'
            }`}>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white uppercase">
                    Google Workspace & Gemini Core Architecture
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Cloud Firestore synced · Macro-free Google Sheets, Google Slides, Google Drive VDR structures.
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `ABOUT BIZZBEAN\n"infinite wisdom. instant viability. always on."\n\nProfile Heading: ${aboutData.socialMissionEquation || DEFAULT_MISSION_EQUATION}\n${aboutData.socialMissionSubtext || DEFAULT_MISSION_SUBTEXT}\n\n1. WHO ARE WE: Entrepreneurial infrastructure partner transforming early-stage businesses into capital-ready enterprises.\n2. WHAT WE DO: The bizz-DESK workstation to LEARN, MODEL, and PLAN.\n3. WHERE ARE WE GOING: Practical equivalent of an uncertified MBA.\n4. HOW SOLUTIONS ENABLE GROWTH: 4-Stage Spectrum: vi-ABILITY, fund-ABILITY, sustain-ABILITY, invest-ABILITY.`
                  );
                  showToast('About Bizzbean Manifesto copied to clipboard.');
                }}
                className="px-4 py-2 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Copy Manifesto Summary</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ======================================================================= */}
      {/* EDIT ABOUT BIZZBEAN CLOUD CONTENT MODAL                                 */}
      {/* ======================================================================= */}
      {isEditingAbout && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-[#0E1322] border border-[#2B3452] p-6 space-y-4 text-slate-100 font-mono shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#222F4C] pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                <span>Edit & Publish About Bizzbean to Cloud</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingAbout(false)}
                className="text-slate-400 hover:text-white text-base px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Updates made here are saved directly to Cloud Firestore (<code className="text-emerald-400">site_content/about_bizzbean</code>) and instantly synchronize across <code className="text-amber-300">bizzbean.com</code>, the sliding door panels, and workstation displays.
            </p>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {/* Profile Heading & Subtext (Reference: profile heading.PNG) */}
              <div className="p-4 rounded-xl bg-[#141A2E] border border-amber-500/40 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
                  <Sparkles className="h-4 w-4" />
                  <span>Profile Heading & Mission Equation (Top Header Banner)</span>
                </div>
                <div>
                  <label className="block text-amber-300 font-bold text-xs uppercase mb-1">
                    Profile Heading / Equation Title:
                  </label>
                  <input
                    type="text"
                    value={editSocialMissionEquation}
                    onChange={(e) => setEditSocialMissionEquation(e.target.value)}
                    placeholder="e.g. SCALING ENTREPRENEURSHIP THROUGH REAL INTELLIGENCE"
                    className="w-full p-2.5 rounded-xl bg-[#0B0F19] border border-[#2B3452] text-xs font-mono text-white focus:outline-hidden focus:border-[#8CB843]"
                  />
                </div>
                <div>
                  <label className="block text-amber-300 font-bold text-xs uppercase mb-1">
                    Profile Subtext / Mission Context:
                  </label>
                  <textarea
                    rows={3}
                    value={editSocialMissionSubtext}
                    onChange={(e) => setEditSocialMissionSubtext(e.target.value)}
                    placeholder="bizzbean is a high-scale virtual and financial calibration platform that bridges the gap between ambitions founders and traditional capital providers..."
                    className="w-full p-2.5 rounded-xl bg-[#0B0F19] border border-[#2B3452] text-xs font-mono text-white focus:outline-hidden focus:border-[#8CB843]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-amber-300 font-bold text-xs uppercase mb-1">
                  1. WHO ARE WE
                </label>
                <textarea
                  rows={4}
                  value={editWhoAreWe}
                  onChange={(e) => setEditWhoAreWe(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#141A2E] border border-[#2B3452] text-xs font-mono text-white focus:outline-hidden focus:border-[#8CB843]"
                />
              </div>

              <div>
                <label className="block text-amber-300 font-bold text-xs uppercase mb-1">
                  2. WHAT WE DO
                </label>
                <textarea
                  rows={4}
                  value={editWhatWeDo}
                  onChange={(e) => setEditWhatWeDo(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#141A2E] border border-[#2B3452] text-xs font-mono text-white focus:outline-hidden focus:border-[#8CB843]"
                />
              </div>

              <div>
                <label className="block text-amber-300 font-bold text-xs uppercase mb-1">
                  3. WHERE ARE WE GOING
                </label>
                <textarea
                  rows={4}
                  value={editWhereGoing}
                  onChange={(e) => setEditWhereGoing(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#141A2E] border border-[#2B3452] text-xs font-mono text-white focus:outline-hidden focus:border-[#8CB843]"
                />
              </div>

              <div>
                <label className="block text-amber-300 font-bold text-xs uppercase mb-1">
                  4. HOW SOLUTIONS ENABLE GROWTH
                </label>
                <textarea
                  rows={5}
                  value={editHowSolutions}
                  onChange={(e) => setEditHowSolutions(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#141A2E] border border-[#2B3452] text-xs font-mono text-white focus:outline-hidden focus:border-[#8CB843]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#222F4C]">
              <button
                type="button"
                onClick={() => setIsEditingAbout(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#141A2E] hover:bg-[#1C2542] text-slate-300 border border-[#242F4C] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingAbout}
                onClick={async () => {
                  try {
                    setIsSavingAbout(true);
                    const updated: AboutContent = {
                      socialMissionEquation: editSocialMissionEquation.trim() || DEFAULT_MISSION_EQUATION,
                      socialMissionSubtext: editSocialMissionSubtext.trim() || DEFAULT_MISSION_SUBTEXT,
                      whoAreWe: editWhoAreWe,
                      whatWeDoPanel: editWhatWeDo,
                      whatWeDo: editWhatWeDo,
                      whereAreWeGoing: editWhereGoing,
                      howSolutionsEnableGrowth: editHowSolutions,
                      updatedAt: new Date().toISOString(),
                    };
                    await saveAboutContentToCloud(updated);
                    setAboutData(updated);
                    showToast('About BizzBean profile heading & content published live to Cloud Firestore & synchronized across all domains.');
                    setIsEditingAbout(false);
                  } catch (err) {
                    console.error('Error saving about content:', err);
                    showToast('Failed to save to cloud. Saved locally.');
                  } finally {
                    setIsSavingAbout(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#8CB843] hover:bg-[#7ba43b] text-slate-950 font-bold text-xs uppercase flex items-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{isSavingAbout ? 'Publishing...' : 'Publish Live to Cloud'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* RESET JOURNAL TO ZERO (#1) IN-APP CONFIRMATION MODAL                   */}
      {/* ======================================================================= */}
      {showResetJournalModal && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0F1424] border border-[#2B3554] p-6 space-y-4 text-white font-mono shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider text-rose-300">
                  Reset Transaction Journal
                </h3>
                <span className="text-[11px] text-slate-400">Start Sequence at Invoice #1</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to reset the transaction journal to zero?
            </p>
            <div className="p-3.5 rounded-xl bg-[#141A2E] border border-[#242F4C] text-[11px] text-slate-400 space-y-1.5">
              <div>• All current mock and draft journal entries will be cleared.</div>
              <div>• Sequence will reset to start fresh at <strong className="text-emerald-400">Invoice #1 (INV-2026-0001)</strong>.</div>
              <div>• Real customer purchases and issued slips will commence from sequence #1.</div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#222F4C]">
              <button
                type="button"
                onClick={() => setShowResetJournalModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1A2238] hover:bg-[#253050] text-slate-300 border border-[#2F3E64] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetJournalZero}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Confirm Reset to Zero (#1)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
