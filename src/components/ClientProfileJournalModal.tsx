import React, { useState, useMemo } from 'react';
import {
  X,
  Receipt,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  Printer,
  CheckCircle2,
  Search,
  ExternalLink,
  Save,
  ShieldCheck,
  FileText,
  CreditCard,
  Briefcase,
  Layers,
  ArrowRight,
  Eye,
  Check,
  Copy,
} from 'lucide-react';
import { TransactionRecord, UserBusinessProfile, ClientProfile } from '../types';
import { INITIAL_V1_TRANSACTIONS } from '../data/cmsConsoleData';
import { safeSaveStorage } from '../utils/imageStorage';
import { generateTaxInvoicePdf, BIZZBEAN_COMPANY_DETAILS } from '../utils/taxInvoicePdf';
import { COUNTRIES } from '../data/countryData';

interface ClientProfileJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  userProfile: UserBusinessProfile;
  userEmail?: string;
  onUpdateProfile: (updated: UserBusinessProfile) => void;
}

export const ClientProfileJournalModal: React.FC<ClientProfileJournalModalProps> = ({
  isOpen,
  onClose,
  theme,
  userProfile,
  userEmail,
  onUpdateProfile,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'transactions' | 'profile'>('transactions');

  // Load all transactions from localStorage or initial master list
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    try {
      const stored = localStorage.getItem('bizzdesk_v1_transactions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(
            (t): t is TransactionRecord => Boolean(t && typeof t === 'object' && t.invoiceNumber)
          );
        }
      }
    } catch (e) {
      console.warn('Error reading transactions from storage:', e);
    }
    return INITIAL_V1_TRANSACTIONS;
  });

  // Filter & Search state
  const [txSearch, setTxSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'my' | 'all'>('my');
  const [selectedInvoice, setSelectedInvoice] = useState<TransactionRecord | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Form State for Profile Updating (matching V1 client profile.PNG)
  const [formName, setFormName] = useState(userProfile.founderName || 'Quentin McCullough');
  const [formEmail, setFormEmail] = useState(userProfile.email || userEmail || 'quentin@bizzbean.com');
  const [formCompany, setFormCompany] = useState(userProfile.companyName || 'BizzBean Holdings (Pty) Ltd');
  const [formVatNumber, setFormVatNumber] = useState(userProfile.vatNumber || '4920281920');
  const [formPhone, setFormPhone] = useState(userProfile.phone || '+27 82 555 0192');
  const [formCountry, setFormCountry] = useState(userProfile.country || 'South Africa');
  const [formCity, setFormCity] = useState(userProfile.city || 'Johannesburg');
  const [formNotes, setFormNotes] = useState(userProfile.notes || 'Key founder account. Primary administrator and enterprise test account.');
  const [formIndustry, setFormIndustry] = useState(userProfile.industry || 'Enterprise Software');
  const [formStage, setFormStage] = useState(userProfile.stage || 'fund-ABILITY');
  const [formWhatWeDo, setFormWhatWeDo] = useState(userProfile.whatWeDo || '');
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);

  // Resolve matching transactions for this client
  const clientEmailNorm = (userProfile.email || userEmail || 'quentin@bizzbean.com').toLowerCase().trim();
  const clientNameNorm = (userProfile.founderName || 'Quentin McCullough').toLowerCase().trim();

  const myTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tEmail = (t.customerEmail || '').toLowerCase().trim();
      const tName = (t.customer || '').toLowerCase().trim();
      return (
        tEmail === clientEmailNorm ||
        tName === clientNameNorm ||
        tEmail.includes('quentin') ||
        tName.includes('quentin')
      );
    });
  }, [transactions, clientEmailNorm, clientNameNorm]);

  const displayedTransactions = useMemo(() => {
    const baseList = scopeFilter === 'my' && myTransactions.length > 0 ? myTransactions : transactions;
    if (!txSearch.trim()) return baseList;
    const q = txSearch.toLowerCase().trim();
    return baseList.filter(
      (t) =>
        (t.invoiceNumber || '').toLowerCase().includes(q) ||
        (t.productName || '').toLowerCase().includes(q) ||
        (t.sku || '').toLowerCase().includes(q) ||
        (t.customer || '').toLowerCase().includes(q) ||
        (t.associate || '').toLowerCase().includes(q) ||
        (t.country || '').toLowerCase().includes(q)
    );
  }, [scopeFilter, myTransactions, transactions, txSearch]);

  // Handle Profile Update Submission
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserBusinessProfile = {
      ...userProfile,
      founderName: formName.trim() || 'Quentin McCullough',
      email: formEmail.trim() || 'quentin@bizzbean.com',
      companyName: formCompany.trim() || 'BizzBean Client',
      vatNumber: formVatNumber.trim(),
      phone: formPhone.trim(),
      country: formCountry.trim(),
      city: formCity.trim(),
      notes: formNotes.trim(),
      industry: formIndustry.trim(),
      stage: formStage.trim(),
      whatWeDo: formWhatWeDo.trim(),
    };

    onUpdateProfile(updated);
    safeSaveStorage('bizzdesk_user_profile_v1', updated);

    // Also sync client profile in v1 client profiles list if exists
    try {
      const stored = localStorage.getItem('bizzdesk_v1_client_profiles');
      let profiles: ClientProfile[] = stored ? JSON.parse(stored) : [];
      const existingIdx = profiles.findIndex(
        (c) => (c.email && c.email.toLowerCase() === updated.email?.toLowerCase()) || c.name.toLowerCase() === updated.founderName.toLowerCase()
      );
      const updatedClientRecord: ClientProfile = {
        id: existingIdx >= 0 ? profiles[existingIdx].id : `cp-${Date.now()}`,
        name: updated.founderName,
        email: updated.email || 'quentin@bizzbean.com',
        companyName: updated.companyName,
        vatNumber: updated.vatNumber,
        phone: updated.phone,
        city: updated.city,
        country: updated.country,
        notes: updated.notes || 'Updated from client billing profile workstation dialog.',
      };

      if (existingIdx >= 0) {
        profiles[existingIdx] = updatedClientRecord;
      } else {
        profiles.unshift(updatedClientRecord);
      }
      safeSaveStorage('bizzdesk_v1_client_profiles', profiles);
    } catch (err) {
      console.warn('Sync client profiles err:', err);
    }

    setProfileSuccessMessage('Personal profile and billing details updated successfully.');
    setTimeout(() => setProfileSuccessMessage(null), 3500);
  };

  // Generate downloadable official SARS PDF Tax Invoice
  const handleDownloadSlipPdf = (invoice: TransactionRecord) => {
    generateTaxInvoicePdf(invoice);
  };

  const handleCopyInvoiceNumber = (invNum: string) => {
    navigator.clipboard?.writeText(invNum);
    setCopyStatus(invNum);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto ${
          isDark
            ? 'bg-[#101424] border-[#252E4A] text-slate-100 shadow-black/70'
            : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-800 shadow-slate-900/15'
        }`}
      >
        {/* Header Bar */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-[#5584B4]/40 bg-white shadow-2xs">
              <img
                src="/bizzbean-favicon.jpg"
                alt="bizzbean"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/bizzbean-favicon.png';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-sm sm:text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Client Profile & Transaction Journal
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Verified Client
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#9A7B4F] dark:text-[#D4A373] mt-0.5">
                View your personal transaction journal, download SARS slips, and update profile info.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`flex border-b text-xs font-mono font-semibold shrink-0 ${
            isDark ? 'bg-[#0E1220] border-[#252E4A]' : 'bg-[#F4EFE6]/60 border-[#E8E2D8]'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-3 px-4 text-center border-b-2 flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'transactions'
                ? 'border-[#5584B4] text-[#5584B4] dark:text-[#90CDF4] bg-white/5 font-bold shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span className="uppercase">My Transactions & Slips</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#5584B4]/20 text-[#5584B4] dark:text-[#DDEBF7]">
              {myTransactions.length > 0 ? myTransactions.length : transactions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 text-center border-b-2 flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-[#5584B4] text-[#5584B4] dark:text-[#90CDF4] bg-white/5 font-bold shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="h-4 w-4" />
            <span className="uppercase">Update Personal Information</span>
            <span className="text-[10px] text-emerald-500 font-bold">● Active</span>
          </button>
        </div>

        {/* Tab Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: TRANSACTIONS & SLIPS */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div
                  className={`p-3.5 rounded-xl border ${
                    isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
                  }`}
                >
                  <span className="text-slate-400 block text-[10px] uppercase">Client Account</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate block mt-0.5">
                    {userProfile.founderName || 'Quentin McCullough'}
                  </span>
                  <span className="text-[11px] text-[#5584B4] truncate block">
                    {userProfile.email || userEmail || 'quentin@bizzbean.com'}
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-xl border ${
                    isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
                  }`}
                >
                  <span className="text-slate-400 block text-[10px] uppercase">Total Purchases (ZAR)</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    R{' '}
                    {displayedTransactions
                      .reduce((acc, t) => acc + (Number(t.invoiceValue) || 0), 0)
                      .toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">Gross Incl. 15% SARS VAT</span>
                </div>

                <div
                  className={`p-3.5 rounded-xl border ${
                    isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
                  }`}
                >
                  <span className="text-slate-400 block text-[10px] uppercase">Available Slips</span>
                  <span className="text-sm font-bold text-[#5584B4] block mt-0.5">
                    {displayedTransactions.length} Invoices Ready
                  </span>
                  <span className="text-[10px] text-slate-400">Instant Download & Print</span>
                </div>
              </div>

              {/* Scope Switcher & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setScopeFilter('my')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                      scopeFilter === 'my'
                        ? 'bg-[#5584B4] text-white border-[#5584B4]'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-300 border-[#252E4A] hover:bg-[#1E2548]'
                        : 'bg-white text-slate-700 border-[#E8E2D8] hover:bg-[#F4EFE6]'
                    }`}
                  >
                    My Transactions ({myTransactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                      scopeFilter === 'all'
                        ? 'bg-[#5584B4] text-white border-[#5584B4]'
                        : isDark
                        ? 'bg-[#141A2E] text-slate-300 border-[#252E4A] hover:bg-[#1E2548]'
                        : 'bg-white text-slate-700 border-[#E8E2D8] hover:bg-[#F4EFE6]'
                    }`}
                  >
                    All Slips ({transactions.length})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Search by invoice # or product..."
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-[#5584B4] ${
                      isDark
                        ? 'bg-[#0E1220] border-[#252E4A] text-white placeholder-slate-500'
                        : 'bg-white border-[#D8CEBC] text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Transactions Slips Listing */}
              {displayedTransactions.length === 0 ? (
                <div
                  className={`p-10 rounded-2xl border text-center font-mono space-y-3 ${
                    isDark ? 'bg-[#141A2E]/50 border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
                  }`}
                >
                  <Receipt className="h-10 w-10 mx-auto text-slate-400 stroke-[1.5]" />
                  <h3 className="text-sm font-bold uppercase text-slate-800 dark:text-slate-200">
                    No Transaction Slips Found
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {scopeFilter === 'my'
                      ? 'No transactions recorded under your current email yet. Switch to "All Slips" to view all transactions or purchase an app/course in your sandbox.'
                      : 'No transactions match your search filter.'}
                  </p>
                  {scopeFilter === 'my' && (
                    <button
                      type="button"
                      onClick={() => setScopeFilter('all')}
                      className="px-4 py-1.5 rounded-xl bg-[#5584B4] text-white text-xs font-mono font-bold"
                    >
                      View All Slips
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedTransactions.map((tx) => (
                    <div
                      key={tx.invoiceNumber}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono ${
                        isDark
                          ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]/60'
                          : 'bg-white border-[#E8E2D8] hover:border-[#5584B4]/60 shadow-2xs'
                      }`}
                    >
                      {/* Left: Invoice Number, Date, Product Name */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleCopyInvoiceNumber(tx.invoiceNumber)}
                            className="font-bold text-xs text-[#5584B4] dark:text-[#90CDF4] flex items-center gap-1 hover:underline"
                            title="Click to copy invoice number"
                          >
                            <span>{tx.invoiceNumber}</span>
                            {copyStatus === tx.invoiceNumber ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-60" />
                            )}
                          </button>

                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{tx.transactionDate}</span>
                          </span>

                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              tx.productType === 'course'
                                ? 'bg-[#5584B4]/20 text-[#5584B4] dark:text-[#DDEBF7]'
                                : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            {tx.productType}
                          </span>

                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            Paid in Full
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white capitalize truncate">
                            {tx.productName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">({tx.sku})</span>
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Customer: <span className="text-slate-800 dark:text-slate-200">{tx.customer}</span> (
                          {tx.customerEmail})
                        </div>
                      </div>

                      {/* Right: Price & Action Buttons */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                        <div className="text-right">
                          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                            R {(Number(tx.invoiceValue) || 0).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Excl: R {(Number(tx.lineValue) || 0).toFixed(2)} + 15% VAT
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Download Slip File */}
                          <button
                            type="button"
                            onClick={() => handleDownloadSlipPdf(tx)}
                            title="Download official SARS Tax Invoice PDF"
                            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                              isDark
                                ? 'bg-[#1F2942] hover:bg-[#2B395C] text-slate-200 border-[#35456E]'
                                : 'bg-[#FAF8F5] hover:bg-[#E8E2D8] text-slate-800 border-[#D8CEBC]'
                            }`}
                          >
                            <Download className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="hidden sm:inline">Download Slip (PDF)</span>
                          </button>

                          {/* View SARS Tax Invoice Slip */}
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(tx)}
                            title="View official SARS Tax Invoice and print"
                            className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#5584B4] hover:bg-[#4773A0] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Slip</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPDATE PERSONAL INFORMATION (MATCHING V1 CLIENT PROFILE) */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 font-mono text-xs">
              <div
                className={`p-5 rounded-2xl border ${
                  isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#E8E2D8]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-[#8CB843]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#8CB843]">
                    SETUP CLIENT BILLING PROFILE
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  These verified billing details appear on your workstation welcome greeting, transactional invoices, and SARS tax slips.
                </p>

                {profileSuccessMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-semibold">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{profileSuccessMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CONTACT PERSON NAME * */}
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] mb-1.5">
                      CONTACT PERSON NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Lerato Molefe"
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                        isDark
                          ? 'bg-[#0E1220] border-[#252E4A] text-white focus:border-[#8CB843]'
                          : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#8CB843]'
                      }`}
                    />
                  </div>

                  {/* PRIMARY EMAIL * */}
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] mb-1.5">
                      PRIMARY EMAIL *
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. lerato@molefeconsulting.com"
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                        isDark
                          ? 'bg-[#0E1220] border-[#252E4A] text-white focus:border-[#8CB843]'
                          : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#8CB843]'
                      }`}
                    />
                  </div>

                  {/* REGISTERED COMPANY NAME */}
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] mb-1.5">
                      REGISTERED COMPANY NAME
                    </label>
                    <input
                      type="text"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      placeholder="e.g. Molefe Capital Group (Pty) Ltd"
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                        isDark
                          ? 'bg-[#0E1220] border-[#252E4A] text-white focus:border-[#8CB843]'
                          : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#8CB843]'
                      }`}
                    />
                  </div>

                  {/* VAT REGISTRATION NUMBER (SOUTH AFRICA) */}
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] mb-1.5">
                      VAT REGISTRATION NUMBER (SOUTH AFRICA)
                    </label>
                    <input
                      type="text"
                      value={formVatNumber}
                      onChange={(e) => setFormVatNumber(e.target.value)}
                      placeholder="e.g. 4010258199"
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                        isDark
                          ? 'bg-[#0E1220] border-[#252E4A] text-white focus:border-[#8CB843]'
                          : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#8CB843]'
                      }`}
                    />
                  </div>

                  {/* MOBILE/PHONE PORTFOLIO */}
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] mb-1.5">
                      MOBILE/PHONE PORTFOLIO
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="e.g. +27 82 555 4321"
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                        isDark
                          ? 'bg-[#0E1220] border-[#252E4A] text-white focus:border-[#8CB843]'
                          : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#8CB843]'
                      }`}
                    />
                  </div>

                  {/* CITY LOCATION */}
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] mb-1.5">
                      CITY LOCATION
                    </label>
                    <input
                      type="text"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      placeholder="e.g. Johannesburg"
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                        isDark
                          ? 'bg-[#0E1220] border-[#252E4A] text-white focus:border-[#8CB843]'
                          : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#8CB843]'
                      }`}
                    />
                  </div>
                </div>

                {/* 🌐 COUNTRY OF ASSOCIATION */}
                <div className="mt-4">
                  <label className="block text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
                    <span>🌐 COUNTRY OF ASSOCIATION</span>
                  </label>
                  <select
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                      isDark
                        ? 'bg-[#0E1220] border-[#252E4A] text-white focus:border-[#8CB843]'
                        : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#8CB843]'
                    }`}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.code} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* INTERNAL BILLING NOTES */}
                <div className="mt-4">
                  <label className="block text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] mb-1.5">
                    INTERNAL BILLING NOTES
                  </label>
                  <textarea
                    rows={3}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Enterprise discount arrangements, payment cycle conditions, contract limits..."
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                      isDark
                        ? 'bg-[#0E1220] border-[#252E4A] text-white focus:border-[#8CB843]'
                        : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#8CB843]'
                    }`}
                  />
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-colors border ${
                      isDark
                        ? 'bg-[#161C30] hover:bg-[#1E2548] text-slate-300 border-[#252E4A]'
                        : 'bg-[#FAF8F5] hover:bg-[#E8E2D8] text-slate-700 border-[#D8CEBC]'
                    }`}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#8CB843] hover:bg-[#7ba43b] text-slate-950 font-bold text-xs uppercase flex items-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>ESTABLISH BILLING PROFILE</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`p-3.5 border-t flex items-center justify-between text-xs font-mono shrink-0 ${
            isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
          }`}
        >
          <span className="text-slate-400 text-[11px] truncate max-w-[280px] sm:max-w-none">
            Logged in as <strong className="text-slate-800 dark:text-slate-200">{formName}</strong> • BizzBean Platform
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#5584B4] hover:underline font-bold uppercase tracking-wider"
          >
            Done
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SARS TAX INVOICE SLIP (VIEW / PRINT / DOWNLOAD MODAL)                    */}
      {/* ========================================================================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in zoom-in-95 duration-150">
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
                  onClick={() => handleDownloadSlipPdf(selectedInvoice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#5584B4] hover:bg-[#4773A0] text-white transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-white text-base px-2 cursor-pointer"
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
                    <span className="text-slate-400 text-xs font-normal">(Pty) Ltd</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">
                    Enterprise Entrepreneurial Modeling Infrastructure
                  </div>
                  <div className="text-[10px] text-slate-400">
                    67 Blouberg Cresent, Van Riebeeck Park, Kempton Park, South Africa, 1619
                  </div>
                  <div className="text-[10px] text-amber-300/90 font-medium">
                    VAT number will be provided shortly (Application in Process)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Reg No: 2024/098712/07 • accounts@bizzbean.com • https://bizzbean.com
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-2.5 py-1 rounded bg-[#5584B4]/20 border border-[#5584B4]/40 text-[#DDEBF7] font-bold text-xs">
                    TAX INVOICE
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <div className="text-xs text-slate-400">
                    Date: {selectedInvoice.transactionDate}
                  </div>
                </div>
              </div>

              {/* Customer & Associate Information */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Billed To:</div>
                  <div className="text-sm font-bold text-white mt-1">{selectedInvoice.customer}</div>
                  <div className="text-slate-300">{selectedInvoice.customerEmail}</div>
                  <div className="text-slate-400">{selectedInvoice.country || 'South Africa'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">
                    Sales Channel / Associate:
                  </div>
                  <div className="text-sm font-medium text-slate-200 mt-1">
                    {selectedInvoice.associate || 'BizzBean Direct'}
                  </div>
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
                      <td className="py-3 px-3 text-slate-400 font-mono">{selectedInvoice.sku}</td>
                      <td className="py-3 px-3 text-white font-medium">{selectedInvoice.productName}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-300">
                          {selectedInvoice.productType}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-200">{selectedInvoice.quantity}</td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        R {(Number(selectedInvoice.unitPrice) || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-200 font-bold">
                        R {(Number(selectedInvoice.lineValue) || 0).toFixed(2)}
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
                    <span className="font-mono">
                      R {(Number(selectedInvoice.lineValue) || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>
                      SARS VAT @ {((Number(selectedInvoice.vatRate) || 0.15) * 100).toFixed(0)}%:
                    </span>
                    <span className="font-mono">
                      R {(Number(selectedInvoice.vatAmount) || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-emerald-400 pt-2 border-t border-[#222F4C]">
                    <span>Invoice Value (Gross):</span>
                    <span className="font-mono">
                      R {(Number(selectedInvoice.invoiceValue) || 0).toFixed(2)}
                    </span>
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
    </div>
  );
};
