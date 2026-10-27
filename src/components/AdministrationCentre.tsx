import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { FormattedAboutContent } from './FormattedAboutContent';
import {
  DEFAULT_WHO_ARE_WE,
  DEFAULT_WHAT_WE_DO,
  DEFAULT_WHERE_ARE_WE_GOING,
  DEFAULT_HOW_SOLUTIONS_ENABLE_GROWTH,
} from '../data/aboutDefaults';
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
  const [journalSubTab, setJournalSubTab] = useState<'transactions' | 'clients' | 'notifications'>('transactions');

  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    try {
      const stored = localStorage.getItem('bizzdesk_v1_transactions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((t): t is TransactionRecord => Boolean(t && typeof t === 'object' && t.invoiceNumber));
        }
      }
    } catch (e) {}
    return INITIAL_V1_TRANSACTIONS;
  });

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

  const [clientNotifications, setClientNotifications] = useState<ClientNotification[]>(() => {
    try {
      const stored = localStorage.getItem('bizzdesk_v1_client_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((n): n is ClientNotification => Boolean(n && typeof n === 'object' && n.id));
        }
      }
    } catch (e) {}
    return INITIAL_CLIENT_NOTIFICATIONS;
  });

  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'app' | 'course'>('all');
  const [txAssociateFilter, setTxAssociateFilter] = useState<string>('all');
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

  // Client Profile Modal State
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientVat, setNewClientVat] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientCity, setNewClientCity] = useState('');
  const [newClientCountry, setNewClientCountry] = useState('South Africa');
  const [newClientNotes, setNewClientNotes] = useState('');

  // Notification Modal State
  const [isNewNotifModalOpen, setIsNewNotifModalOpen] = useState(false);
  const [newNotifEmail, setNewNotifEmail] = useState('');
  const [newNotifSubject, setNewNotifSubject] = useState('');
  const [newNotifContent, setNewNotifContent] = useState('');
  const [newNotifServiceName, setNewNotifServiceName] = useState('');
  const [newNotifAmount, setNewNotifAmount] = useState<number>(0);

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
      if (client.country) setNewTxCountry(client.country);
    }
  };

  const openNewTxModalWithNextInvoice = () => {
    const nextSeq = String((transactions || []).length + 1).padStart(4, '0');
    setNewTxInvoiceNo(`INV-2026-${nextSeq}`);
    setNewTxDate(new Date().toISOString().slice(0, 10));
    setIsNewTxModalOpen(true);
  };

  const filteredTransactions = (transactions || []).filter((tx) => {
    if (!tx) return false;
    const matchType = txTypeFilter === 'all' || tx.productType === txTypeFilter;
    const matchAssociate = txAssociateFilter === 'all' || tx.associate === txAssociateFilter;
    const q = (txSearch || '').toLowerCase().trim();
    const matchSearch =
      !q ||
      (tx.invoiceNumber || '').toLowerCase().includes(q) ||
      (tx.customer || '').toLowerCase().includes(q) ||
      (tx.customerEmail || '').toLowerCase().includes(q) ||
      (tx.sku || '').toLowerCase().includes(q) ||
      (tx.productName || '').toLowerCase().includes(q) ||
      (tx.associate || '').toLowerCase().includes(q) ||
      Boolean(tx.country && (tx.country || '').toLowerCase().includes(q));
    return matchType && matchAssociate && matchSearch;
  });

  const totalGrossZar = (transactions || []).reduce((acc, tx) => acc + (Number(tx?.invoiceValue) || 0), 0);
  const totalNetZar = (transactions || []).reduce((acc, tx) => acc + (Number(tx?.lineValue) || 0), 0);
  const totalVatZar = (transactions || []).reduce((acc, tx) => acc + (Number(tx?.vatAmount) || 0), 0);
  const appTransactionsCount = (transactions || []).filter((tx) => tx?.productType === 'app').length;
  const courseTransactionsCount = (transactions || []).filter((tx) => tx?.productType === 'course').length;

  const distinctAssociates = Array.from(new Set((transactions || []).map((tx) => tx?.associate).filter(Boolean))) as string[];

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

    // Auto-dispatch client notification
    if (newTxAutoNotify) {
      const newNotif: ClientNotification = {
        id: `notif-${Date.now().toString().slice(-4)}`,
        recipientEmail: newRecord.customerEmail,
        subject: `Tax Invoice ${newRecord.invoiceNumber}: ${newRecord.productName}`,
        content: `Your official tax invoice ${newRecord.invoiceNumber} for ${newRecord.productName} has been recorded. Gross value: R ${(Number(newRecord.invoiceValue) || 0).toFixed(2)} (incl. 15% SARS VAT).`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        isRead: false,
        sender: 'Bizzbean Finance Desk',
        serviceName: newRecord.productName,
        amountInvoiced: newRecord.invoiceValue,
      };
      const updatedNotifs = [newNotif, ...clientNotifications];
      setClientNotifications(updatedNotifs);
      safeSaveStorage('bizzdesk_v1_client_notifications', updatedNotifs);
    }

    setIsNewTxModalOpen(false);
    showToast(`Tax invoice ${newRecord.invoiceNumber} posted to General Ledger!`);
  };

  const handleSaveNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientEmail.trim()) {
      showToast('Client name and email are required.');
      return;
    }
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
    };
    const updated = [newClient, ...clientProfiles];
    setClientProfiles(updated);
    safeSaveStorage('bizzdesk_v1_client_profiles', updated);
    setIsNewClientModalOpen(false);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientCompany('');
    setNewClientVat('');
    setNewClientPhone('');
    setNewClientCity('');
    setNewClientNotes('');
    showToast(`Client profile for ${newClient.name} created.`);
  };

  const handleSendClientNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotifEmail.trim() || !newNotifSubject.trim()) {
      showToast('Recipient email and subject are required.');
      return;
    }
    const notif: ClientNotification = {
      id: `notif-${Date.now().toString().slice(-4)}`,
      recipientEmail: newNotifEmail.trim(),
      subject: newNotifSubject.trim(),
      content: newNotifContent.trim(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false,
      sender: 'Bizzbean Finance Desk',
      serviceName: newNotifServiceName.trim() || undefined,
      amountInvoiced: Number(newNotifAmount) || undefined,
    };
    const updated = [notif, ...clientNotifications];
    setClientNotifications(updated);
    safeSaveStorage('bizzdesk_v1_client_notifications', updated);
    setIsNewNotifModalOpen(false);
    setNewNotifEmail('');
    setNewNotifSubject('');
    setNewNotifContent('');
    setNewNotifServiceName('');
    setNewNotifAmount(0);
    showToast(`Dispatch sent to ${notif.recipientEmail}.`);
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
          return parsed.filter((i): i is CmsInquiry => Boolean(i && typeof i === 'object' && i.id));
        }
      }
    } catch (e) {}
    return INITIAL_CMS_INQUIRIES;
  });

  // Real-time Firestore sync with localStorage fallback
  useEffect(() => {
    const unsubscribe = subscribeToEnquiries((items) => {
      if (items && Array.isArray(items) && items.length > 0) {
        const cleaned = items.filter((i) => Boolean(i && typeof i === 'object' && i.id));
        if (cleaned.length > 0) setInquiries(cleaned);
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

      {/* NAVIGATION TABS: Transferred V1 Platform Apps Suite + Management Tabs */}
      <div
        className={`px-4 sm:px-6 py-2 border-b overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none ${
          isDark ? 'bg-[#0E1322] border-[#1D2644]' : 'bg-[#F4EFE6] border-[#E8E2D8]'
        }`}
      >
        {[
          { id: 'transactions', label: 'Transaction Journal', icon: FileText, badge: transactions.length },
          { id: 'dialogue-centre', label: 'Talk To Us Dialogue (#3)', icon: Mail, badge: inquiries.length },
          { id: 'bulk-imports', label: 'Associate Bulk Imports (#9)', icon: Users, badge: associateBatches.length },
          { id: 'promo-emails', label: 'Personal Promotion Emails (#10)', icon: Send, badge: promoEmails.length },
          { id: 'cms-console', label: 'CMS Console (Master Matrix)', icon: Database, badge: 'Live' },
          { id: 'about-bizzbean', label: 'About Bizzbean Content', icon: Info, badge: 'Official' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all whitespace-nowrap border ${
                isActive
                  ? isDark
                    ? 'bg-[#1E2745]/40 text-[#D4A373] border-[#5584B4]/40 shadow-xs'
                    : 'bg-[#F2ECE1]/80 text-[#8C6D3F] border-[#D8CEBC] shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white bg-[#13182B]/60 hover:bg-[#182038] border-transparent'
                  : 'text-slate-600 hover:text-slate-900 bg-white/60 hover:bg-white border-[#E8E2D8]'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? (isDark ? 'text-[#D4A373]' : 'text-[#8C6D3F]') : 'opacity-70'}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isActive
                    ? isDark
                      ? 'bg-[#D4A373]/20 text-[#D4A373] font-bold'
                      : 'bg-[#8C6D3F]/15 text-[#8C6D3F] font-bold'
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6">

        {/* =================================================================== */}
        {/* TAB 1: TRANSACTION JOURNAL (V1 Implementation)                      */}
        {/* =================================================================== */}
        {activeTab === 'transactions' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Sub-tab Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222F4C] pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setJournalSubTab('transactions')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                    journalSubTab === 'transactions'
                      ? 'bg-[#5584B4] text-white border-[#5584B4] shadow-xs'
                      : isDark
                      ? 'bg-[#141A2E] text-slate-300 border-[#222F4C] hover:text-white'
                      : 'bg-white text-slate-700 border-[#E8E2D8] hover:bg-slate-50'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>1. General Ledger & Invoices</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-white font-mono">
                    {transactions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setJournalSubTab('clients')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                    journalSubTab === 'clients'
                      ? 'bg-[#5584B4] text-white border-[#5584B4] shadow-xs'
                      : isDark
                      ? 'bg-[#141A2E] text-slate-300 border-[#222F4C] hover:text-white'
                      : 'bg-white text-slate-700 border-[#E8E2D8] hover:bg-slate-50'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>2. Client Directory & VAT CRM</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-white font-mono">
                    {clientProfiles.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setJournalSubTab('notifications')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                    journalSubTab === 'notifications'
                      ? 'bg-[#5584B4] text-white border-[#5584B4] shadow-xs'
                      : isDark
                      ? 'bg-[#141A2E] text-slate-300 border-[#222F4C] hover:text-white'
                      : 'bg-white text-slate-700 border-[#E8E2D8] hover:bg-slate-50'
                  }`}
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span>3. Invoicing Dispatch Log</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-white font-mono">
                    {clientNotifications.length}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>SARS VAT Rate: 15% Standard</span>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SUB-VIEW 1: GENERAL LEDGER & INVOICES                         */}
            {/* ------------------------------------------------------------- */}
            {journalSubTab === 'transactions' && (
              <>
                {/* Top Stat Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'}`}>
                    <div className="text-[11px] text-slate-400 uppercase">Gross Invoiced (Incl VAT)</div>
                    <div className="text-xl font-bold mt-1 text-emerald-400">R {(Number(totalGrossZar) || 0).toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Total billable value</div>
                  </div>
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'}`}>
                    <div className="text-[11px] text-slate-400 uppercase">Net Sales (Excl VAT)</div>
                    <div className="text-xl font-bold mt-1 text-[#5584B4]">R {(Number(totalNetZar) || 0).toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Revenue before tax</div>
                  </div>
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'}`}>
                    <div className="text-[11px] text-slate-400 uppercase">Output VAT (15%)</div>
                    <div className="text-xl font-bold mt-1 text-amber-400">R {(Number(totalVatZar) || 0).toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">SARS standard compliance</div>
                  </div>
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'}`}>
                    <div className="text-[11px] text-slate-400 uppercase">Total Invoices</div>
                    <div className="text-xl font-bold mt-1 text-white">{transactions.length}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{appTransactionsCount} Apps • {courseTransactionsCount} Courses</div>
                  </div>
                </div>

                {/* Actions & Filters Bar */}
                <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                  isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
                }`}>
                  <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={txSearch}
                        onChange={(e) => setTxSearch(e.target.value)}
                        placeholder="Search invoice #, customer, SKU, associate..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs font-mono bg-[#0B0F19] border border-[#222F4C] text-white focus:outline-hidden focus:border-[#5584B4]"
                      />
                    </div>
                    <select
                      value={txTypeFilter}
                      onChange={(e) => setTxTypeFilter(e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl text-xs font-mono bg-[#0B0F19] border border-[#222F4C] text-slate-200 focus:outline-hidden"
                    >
                      <option value="all">All Types (Apps & Courses)</option>
                      <option value="app">Apps Only</option>
                      <option value="course">Courses Only</option>
                    </select>
                    {distinctAssociates.length > 0 && (
                      <select
                        value={txAssociateFilter}
                        onChange={(e) => setTxAssociateFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl text-xs font-mono bg-[#0B0F19] border border-[#222F4C] text-slate-200 focus:outline-hidden"
                      >
                        <option value="all">All Associates</option>
                        {distinctAssociates.map((assoc) => (
                          <option key={assoc} value={assoc}>
                            {assoc}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportTxCsv}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#1B243B] hover:bg-[#253252] text-slate-200 border border-[#2F3E66] transition-colors"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-[#5584B4]" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={openNewTxModalWithNextInvoice}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#5584B4] hover:bg-[#4773A0] text-white shadow-xs transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Record Transaction</span>
                    </button>
                  </div>
                </div>

                {/* V1 Transaction Journal Table */}
                <div className={`rounded-2xl border overflow-hidden ${
                  isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className={`text-[11px] uppercase border-b ${
                        isDark ? 'bg-[#151D33] text-slate-400 border-[#222F4C]' : 'bg-[#F4EFE6] text-slate-600 border-[#E8E2D8]'
                      }`}>
                        <tr>
                          <th className="py-3 px-3">Invoice #</th>
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3">Customer</th>
                          <th className="py-3 px-3">Product (SKU)</th>
                          <th className="py-3 px-2 text-center">Type</th>
                          <th className="py-3 px-3">Associate</th>
                          <th className="py-3 px-2 text-center">Qty</th>
                          <th className="py-3 px-3 text-right">Unit Price (Excl)</th>
                          <th className="py-3 px-3 text-right">Line Value</th>
                          <th className="py-3 px-3 text-right">VAT (15%)</th>
                          <th className="py-3 px-3 text-right">Gross Total</th>
                          <th className="py-3 px-2 text-center">Slip</th>
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
                                title="Click to view full Tax Invoice"
                              >
                                <span>{tx.invoiceNumber}</span>
                              </button>
                            </td>
                            <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{tx.transactionDate}</td>
                            <td className="py-3 px-3">
                              <div className="text-white font-medium">{tx.customer}</div>
                              <div className="text-[10px] text-slate-400">{tx.customerEmail}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="text-slate-200">{tx.productName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{tx.sku}</div>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                  tx.productType === 'app'
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                }`}
                              >
                                {tx.productType}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-300 text-[11px]">{tx.associate}</td>
                            <td className="py-3 px-2 text-center text-slate-300">{tx.quantity}</td>
                            <td className="py-3 px-3 text-right text-slate-400">
                              R {(Number(tx.unitPrice) || 0).toFixed(2)}
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
                              <button
                                type="button"
                                onClick={() => setViewingInvoice(tx)}
                                title="View SARS Tax Invoice Slip"
                                className="p-1.5 rounded-lg bg-[#1B233D] hover:bg-[#253252] text-slate-300 hover:text-white transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5 text-[#5584B4]" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredTransactions.length === 0 && (
                          <tr>
                            <td colSpan={12} className="py-8 text-center text-slate-400">
                              No transaction records matching query.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SUB-VIEW 2: CLIENT DIRECTORY & VAT CRM                        */}
            {/* ------------------------------------------------------------- */}
            {journalSubTab === 'clients' && (
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
                }`}>
                  <div>
                    <h3 className="font-bold text-sm text-white font-mono uppercase">
                      Client Profile Directory & SARS Tax Entities
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      Profiles registered for instant tax invoicing, automated dispatch & CRM tracking
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNewClientModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#5584B4] hover:bg-[#4773A0] text-white shadow-xs transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Client Profile</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clientProfiles.map((client) => {
                    if (!client) return null;
                    const clientEmail = (client.email || '').toLowerCase().trim();
                    const clientInvoices = (transactions || []).filter(
                      (t) => Boolean(t && (t.customerEmail || '').toLowerCase().trim() === clientEmail)
                    );
                    const clientTotalZar = clientInvoices.reduce((acc, t) => acc + (Number(t?.invoiceValue) || 0), 0);

                    return (
                      <div
                        key={client.id}
                        className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 font-mono ${
                          isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-sm text-white">{client.name}</div>
                              <div className="text-xs text-[#5584B4] font-medium flex items-center gap-1 mt-0.5">
                                <Building className="h-3 w-3" />
                                <span>{client.companyName}</span>
                              </div>
                            </div>
                            {client.vatNumber ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                VAT: {client.vatNumber}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700/30 text-slate-400">
                                Non-VAT Registered
                              </span>
                            )}
                          </div>

                          <div className="text-xs space-y-1 text-slate-300 pt-1 border-t border-[#1D2644]">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-slate-500" />
                              <span className="text-slate-300">{client.email}</span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-slate-500" />
                                <span className="text-slate-400">{client.phone}</span>
                              </div>
                            )}
                            {(client.city || client.country) && (
                              <div className="text-[11px] text-slate-400">
                                Location: {[client.city, client.country].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>

                          {client.notes && (
                            <p className="text-[11px] text-slate-400 italic bg-[#0E1322] p-2 rounded-lg border border-[#1D2644]">
                              "{client.notes}"
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-[#1D2644] flex items-center justify-between">
                          <div className="text-xs">
                            <span className="text-slate-400">Invoices: </span>
                            <span className="font-bold text-white">{clientInvoices.length}</span>
                            <span className="text-slate-500"> • </span>
                            <span className="text-emerald-400 font-bold">R {(Number(clientTotalZar) || 0).toFixed(2)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenInvoiceFromClient(client)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#1F2942] hover:bg-[#2B395C] text-slate-200 border border-[#35456E] transition-colors"
                          >
                            <Receipt className="h-3 w-3 text-[#5584B4]" />
                            <span>Create Invoice</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SUB-VIEW 3: CLIENT NOTIFICATIONS LOG                          */}
            {/* ------------------------------------------------------------- */}
            {journalSubTab === 'notifications' && (
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
                }`}>
                  <div>
                    <h3 className="font-bold text-sm text-white font-mono uppercase">
                      Client Invoicing Dispatches & Notices
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      Log of automated invoice receipts, tax notices, and membership dispatches
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNewNotifModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#5584B4] hover:bg-[#4773A0] text-white shadow-xs transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Dispatch Notice</span>
                  </button>
                </div>

                <div className={`rounded-2xl border overflow-hidden ${
                  isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className={`text-[11px] uppercase border-b ${
                        isDark ? 'bg-[#151D33] text-slate-400 border-[#222F4C]' : 'bg-[#F4EFE6] text-slate-600 border-[#E8E2D8]'
                      }`}>
                        <tr>
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4">Recipient</th>
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4">Service</th>
                          <th className="py-3 px-4 text-right">Invoiced Amount</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-[#1D2644]' : 'divide-[#E8E2D8]'}`}>
                        {clientNotifications.map((notif) => (
                          <tr key={notif.id} className={isDark ? 'hover:bg-[#161F38]/50' : 'hover:bg-slate-50'}>
                            <td className="py-3 px-4 text-slate-400">{notif.timestamp}</td>
                            <td className="py-3 px-4 text-white font-medium">{notif.recipientEmail}</td>
                            <td className="py-3 px-4">
                              <div className="text-slate-200 font-bold">{notif.subject}</div>
                              <div className="text-[10px] text-slate-400 line-clamp-1">{notif.content}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-300">{notif.serviceName || 'General Desk'}</td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-400">
                              {notif.amountInvoiced ? `R ${(Number(notif.amountInvoiced) || 0).toFixed(2)}` : '—'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  notif.isRead
                                    ? 'bg-slate-700/30 text-slate-400'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {notif.isRead ? 'Delivered' : 'New Dispatch'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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

                    {/* Auto-dispatch checkbox */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="autoNotifyCheckbox"
                        checked={newTxAutoNotify}
                        onChange={(e) => setNewTxAutoNotify(e.target.checked)}
                        className="rounded accent-[#5584B4]"
                      />
                      <label htmlFor="autoNotifyCheckbox" className="text-slate-300 text-xs cursor-pointer">
                        Auto-dispatch notification memo and tax invoice receipt to customer
                      </label>
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
                        className="px-5 py-1.5 rounded-lg bg-[#5584B4] hover:bg-[#4773A0] text-white font-bold shadow-md transition-colors"
                      >
                        Post to General Ledger
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* MODAL 2: SARS TAX INVOICE SLIP (VIEW / PRINT)                 */}
            {/* ============================================================= */}
            {viewingInvoice && (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="w-full max-w-2xl rounded-2xl bg-[#0E1322] border border-[#2B3452] p-6 space-y-6 text-slate-100 font-mono shadow-2xl my-8">
                  {/* Top Bar with Print and Close */}
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
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-[#1F2942] hover:bg-[#2B395C] text-slate-200 border border-[#35456E] transition-colors"
                      >
                        <Printer className="h-3 w-3 text-[#5584B4]" />
                        <span>Print Invoice</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewingInvoice(null)}
                        className="text-slate-400 hover:text-white text-sm px-2"
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
                          <span className="text-[#5584B4]">BIZZBEAN</span>
                          <span className="text-slate-400 text-xs font-normal">HOLDINGS (PTY) LTD</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Enterprise Entrepreneurial Modeling Infrastructure
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Reg No: 2024/098712/07 • VAT Registration: 4920281920
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Johannesburg, South Africa • accounts@bizzbean.com
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
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Billed To:</div>
                        <div className="text-sm font-bold text-white mt-1">{viewingInvoice.customer}</div>
                        <div className="text-slate-300">{viewingInvoice.customerEmail}</div>
                        <div className="text-slate-400">{viewingInvoice.country || 'South Africa'}</div>
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
                          <span>SARS VAT @ {((Number(viewingInvoice.vatRate) || 0.15) * 100).toFixed(0)}%:</span>
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
                      Official Tax Invoice issued in terms of Section 20(4) of the Value Added Tax Act, 1991 of South Africa.
                      All transactions recorded in the BizzBean immutable general ledger.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* MODAL 3: ADD NEW CLIENT PROFILE                               */}
            {/* ============================================================= */}
            {isNewClientModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="w-full max-w-md rounded-2xl bg-[#141A2E] border border-[#2B3452] p-6 space-y-4 text-slate-100 font-mono shadow-2xl">
                  <div className="flex items-center justify-between border-b border-[#222F4C] pb-3">
                    <h3 className="font-bold text-sm text-white uppercase flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#5584B4]" />
                      <span>Create Client Profile</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsNewClientModalOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveNewClient} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Full Name:</label>
                      <input
                        type="text"
                        required
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Email Address:</label>
                      <input
                        type="email"
                        required
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        placeholder="john@example.co.za"
                        className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Company / Entity Name:</label>
                      <input
                        type="text"
                        value={newClientCompany}
                        onChange={(e) => setNewClientCompany(e.target.value)}
                        placeholder="Venture Apex (Pty) Ltd"
                        className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">VAT Number:</label>
                        <input
                          type="text"
                          value={newClientVat}
                          onChange={(e) => setNewClientVat(e.target.value)}
                          placeholder="4920281920"
                          className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Phone:</label>
                        <input
                          type="text"
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          placeholder="+27 82 000 0000"
                          className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">City:</label>
                        <input
                          type="text"
                          value={newClientCity}
                          onChange={(e) => setNewClientCity(e.target.value)}
                          placeholder="Johannesburg"
                          className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Country:</label>
                        <input
                          type="text"
                          value={newClientCountry}
                          onChange={(e) => setNewClientCountry(e.target.value)}
                          placeholder="South Africa"
                          className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Notes / CRM Memo:</label>
                      <textarea
                        rows={2}
                        value={newClientNotes}
                        onChange={(e) => setNewClientNotes(e.target.value)}
                        placeholder="Founding team notes..."
                        className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-2 border-t border-[#222F4C]">
                      <button
                        type="button"
                        onClick={() => setIsNewClientModalOpen(false)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#1B233D] text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-[#5584B4] hover:bg-[#4773A0] text-white font-bold"
                      >
                        Save Client Profile
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* MODAL 4: DISPATCH MANUAL NOTIFICATION                         */}
            {/* ============================================================= */}
            {isNewNotifModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="w-full max-w-md rounded-2xl bg-[#141A2E] border border-[#2B3452] p-6 space-y-4 text-slate-100 font-mono shadow-2xl">
                  <div className="flex items-center justify-between border-b border-[#222F4C] pb-3">
                    <h3 className="font-bold text-sm text-white uppercase flex items-center gap-2">
                      <Send className="h-4 w-4 text-[#5584B4]" />
                      <span>Dispatch Invoicing Notice</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsNewNotifModalOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSendClientNotification} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Recipient Email:</label>
                      <input
                        type="email"
                        required
                        value={newNotifEmail}
                        onChange={(e) => setNewNotifEmail(e.target.value)}
                        placeholder="client@venture.co.za"
                        className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Subject:</label>
                      <input
                        type="text"
                        required
                        value={newNotifSubject}
                        onChange={(e) => setNewNotifSubject(e.target.value)}
                        placeholder="Tax Invoice Slip: bizzcalc app"
                        className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Service / SKU:</label>
                        <input
                          type="text"
                          value={newNotifServiceName}
                          onChange={(e) => setNewNotifServiceName(e.target.value)}
                          placeholder="bizzcalc app"
                          className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Amount Invoiced (ZAR):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newNotifAmount}
                          onChange={(e) => setNewNotifAmount(Number(e.target.value))}
                          className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Notice Content:</label>
                      <textarea
                        rows={3}
                        required
                        value={newNotifContent}
                        onChange={(e) => setNewNotifContent(e.target.value)}
                        placeholder="Details of the tax invoice or credit..."
                        className="w-full p-2 rounded-lg bg-[#0E1220] border border-[#2B3452] text-white"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-2 border-t border-[#222F4C]">
                      <button
                        type="button"
                        onClick={() => setIsNewNotifModalOpen(false)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#1B233D] text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-[#5584B4] hover:bg-[#4773A0] text-white font-bold"
                      >
                        Dispatch Notice
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
              <div className="flex items-center gap-2 text-xs text-amber-400 uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                <span>Official Mission & Manifesto · Bizzbean v2</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide uppercase font-sans">
                ABOUT BIZZBEAN
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-mono">
                infinite wisdom · instant viability · always on
              </p>
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
                <FormattedAboutContent content={DEFAULT_WHO_ARE_WE} isDark={isDark} />
              </div>

              <div className={`p-5 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
              }`}>
                <div className="font-bold text-xs text-amber-400 uppercase flex items-center justify-between mb-1">
                  <span>2. WHAT WE DO</span>
                  <span className="text-[10px] text-[#C59B63] font-normal">mechanics & tools</span>
                </div>
                <FormattedAboutContent content={DEFAULT_WHAT_WE_DO} isDark={isDark} />
              </div>

              <div className={`p-5 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
              }`}>
                <div className="font-bold text-xs text-amber-400 uppercase flex items-center justify-between mb-1">
                  <span>3. WHERE ARE WE GOING</span>
                  <span className="text-[10px] text-[#C59B63] font-normal">vision & trajectory</span>
                </div>
                <FormattedAboutContent content={DEFAULT_WHERE_ARE_WE_GOING} isDark={isDark} />
              </div>

              <div className={`p-5 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#12172A] border-[#222F4C]' : 'bg-white border-[#E8E2D8] shadow-2xs'
              }`}>
                <div className="font-bold text-xs text-amber-400 uppercase flex items-center justify-between mb-1">
                  <span>4. HOW SOLUTIONS ENABLE GROWTH</span>
                  <span className="text-[10px] text-[#C59B63] font-normal">spectrum & outcomes</span>
                </div>
                <FormattedAboutContent content={DEFAULT_HOW_SOLUTIONS_ENABLE_GROWTH} isDark={isDark} />
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
                    Macro-free Google Sheets, Google Slides, Google Drive VDR structures, and AES-256 standard.
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `ABOUT BIZZBEAN\n"infinite wisdom. instant viability. always on."\n\n1. WHO ARE WE: Entrepreneurial infrastructure partner transforming early-stage businesses into capital-ready enterprises.\n2. WHAT WE DO: The bizz-DESK workstation to LEARN, MODEL, and PLAN.\n3. WHERE ARE WE GOING: Practical equivalent of an uncertified MBA.\n4. HOW SOLUTIONS ENABLE GROWTH: 4-Stage Spectrum: vi-ABILITY, fund-ABILITY, sustain-ABILITY, invest-ABILITY.`
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
    </div>
  );
};
