import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Mail,
  Building,
  User,
  Phone,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Headphones,
} from 'lucide-react';
import {
  createEnquiry,
  dispatchNewEnquiryNotification,
  BIZZBEAN_ADVISORY_EMAIL,
  TalkToUsEnquiry,
} from '../services/enquiryService';
import { BizzBeanBrandHeader } from './BizzBeanBrandHeader';

interface TalkToUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: {
    name?: string;
    email?: string;
    companyName?: string;
    phone?: string;
    role?: string;
  } | null;
  initialSubject?: string;
  initialCategory?: 'general' | 'advisory' | 'capital' | 'modelling' | 'technical' | 'urgent';
  isDark?: boolean;
}

export const TalkToUsModal: React.FC<TalkToUsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  initialSubject = '',
  initialCategory = 'advisory',
  isDark = true,
}) => {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState<
    'general' | 'advisory' | 'capital' | 'modelling' | 'technical' | 'urgent'
  >(initialCategory);
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<TalkToUsEnquiry | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize fields from member profile or localStorage on open
  useEffect(() => {
    if (isOpen) {
      const storedName =
        userProfile?.name ||
        localStorage.getItem('bizzbean_sandbox_name') ||
        '';
      const storedEmail =
        userProfile?.email ||
        localStorage.getItem('bizzbean_sandbox_email') ||
        localStorage.getItem('bizzbean_last_login_email') ||
        '';
      const storedCompany =
        userProfile?.companyName ||
        localStorage.getItem('bizzbean_user_company_name') ||
        '';
      const storedPhone =
        userProfile?.phone ||
        localStorage.getItem('bizzbean_sandbox_phone') ||
        '';

      setSenderName(storedName);
      setSenderEmail(storedEmail);
      setCompanyName(storedCompany);
      setSenderPhone(storedPhone);
      setSubject(initialSubject || 'Commercial Advisory & Financial Modeling Inquiry');
      setMessage('');
      setSubmittedEnquiry(null);
      setError(null);
    }
  }, [isOpen, userProfile, initialSubject]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim()) {
      setError('Please provide your name so we can address you personally.');
      return;
    }
    if (!senderEmail.trim() || !senderEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!message.trim()) {
      setError('Please enter your message or inquiry details.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Create and persist enquiry to Firestore and LocalStorage
      const enquiry = await createEnquiry({
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
        senderPhone: senderPhone.trim(),
        companyName: companyName.trim(),
        category,
        subject: subject.trim() || 'General Advisory & Enterprise Inquiry',
        message: message.trim(),
        source: 'sandbox_modal',
        status: 'new',
      });

      // Save contact details for next time in sandbox
      localStorage.setItem('bizzbean_sandbox_name', senderName.trim());
      localStorage.setItem('bizzbean_sandbox_email', senderEmail.trim());
      if (companyName.trim()) {
        localStorage.setItem('bizzbean_user_company_name', companyName.trim());
      }
      if (senderPhone.trim()) {
        localStorage.setItem('bizzbean_sandbox_phone', senderPhone.trim());
      }

      setSubmittedEnquiry(enquiry);
    } catch (err: any) {
      console.warn('Enquiry creation notice:', err);
      setError('Failed to record inquiry. Please try again or use direct email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const notification = submittedEnquiry
    ? dispatchNewEnquiryNotification(submittedEnquiry)
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="talk-to-us-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl transition-all ${
          isDark
            ? 'bg-[#0E1220] border-[#252E4A] text-slate-100'
            : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
        }`}
      >
        {/* Top Header Bar: Clean Brand Navigation & Close */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-b ${
            isDark ? 'border-[#222F4C] bg-[#141A2E]' : 'border-[#E8E2D8] bg-[#F4EFE6]'
          }`}
        >
          <div className="flex items-center gap-3">
            <BizzBeanBrandHeader
              iconSize="w-8 h-8 shrink-0"
              textSize="text-2xl"
              theme={isDark ? 'dark' : 'light'}
            />
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />
            <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#9fc754] bg-[#9fc754]/10 dark:bg-[#9fc754]/20 px-2.5 py-0.5 rounded-full border border-[#9fc754]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9fc754] animate-pulse" />
              Live Advisory Desk
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#1E2548] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Crisp, Highly Legible Primary Heading & Subtitle Block */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#5584B4] mb-1.5">
            <MessageSquare className="h-4 w-4 text-[#5584B4] shrink-0" />
            <span>Direct Advisory Channel · Coach GIM Executive Desk</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
            <h2
              id="talk-to-us-title"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-slate-900 dark:text-white"
            >
              TALK TO US
            </h2>

            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8C6D3F] dark:text-[#D4A373] bg-[#FAF8F5] dark:bg-[#12172A] px-2.5 py-1 rounded-lg border border-[#D8CEBC]/60 dark:border-[#252E4A] self-start sm:self-auto">
              <span>infinite wisdom · instant viability · always on</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed mt-2 max-w-xl">
            Submit your financial modeling calibration, venture viability analysis, or direct advisory inquiry. Your dispatch will be routed directly to Quentin McCullough and Coach GIM.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {submittedEnquiry ? (
            /* ================= Success Confirmation View ================= */
            <div className="py-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#9fc754]/20 border border-[#9fc754]/40 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="h-9 w-9 text-[#9fc754]" />
              </div>
              
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#5584B4] block">
                  Dispatch Transmitted &amp; Securely Logged
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-sans">
                  Thank You, {submittedEnquiry.senderName}!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  Your inquiry is recorded in our Administration Centre and queued for priority advisory review.
                </p>
              </div>

              {/* Inquiry Details Card */}
              <div
                className={`p-5 rounded-2xl border text-left font-mono text-xs space-y-3 max-w-lg mx-auto ${
                  isDark
                    ? 'bg-[#141A2E] border-[#222F4C] text-slate-200'
                    : 'bg-white border-[#E8E2D8] text-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 pb-2.5">
                  <span>
                    Reference ID:{' '}
                    <strong className="text-slate-900 dark:text-white font-bold font-mono">
                      {submittedEnquiry.id}
                    </strong>
                  </span>
                  <span>{submittedEnquiry.date}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">
                    Subject
                  </span>
                  <div className="font-bold text-slate-900 dark:text-[#DDEBF7] text-sm mt-0.5">
                    {submittedEnquiry.subject}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">
                      Category
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase text-[11px]">
                      {submittedEnquiry.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">
                      Direct Routing
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#5584B4]">
                      {BIZZBEAN_ADVISORY_EMAIL}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                {notification && (
                  <a
                    href={notification.mailtoUrl}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#5584B4] hover:bg-[#4374a2] text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <span>Open in Email App</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-[#1E2548] dark:hover:bg-[#252E4A] text-slate-800 dark:text-white font-bold text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border border-transparent dark:border-[#252E4A]"
                >
                  Return to Workstation
                </button>
              </div>
            </div>
          ) : (
            /* ================= Input Form View ================= */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Informative Dispatch Notice */}
              <div
                className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs ${
                  isDark
                    ? 'bg-[#141A2E] border-[#222F4C] text-slate-300'
                    : 'bg-white border-[#E8E2D8] text-slate-700 shadow-2xs'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-[#5584B4]/15 text-[#5584B4] shrink-0 mt-0.5">
                  <Headphones className="h-4 w-4" />
                </div>
                <p className="leading-relaxed font-sans">
                  Inquiries are logged in the BizzBean Administration Centre and dispatched directly to Quentin at{' '}
                  <strong className="text-slate-900 dark:text-white font-mono font-semibold">
                    {BIZZBEAN_ADVISORY_EMAIL}
                  </strong>
                  . Responses are issued within 24 business hours.
                </p>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Row 1: Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="e.g. Quentin McCullough"
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium focus:outline-none transition-all border ${
                        isDark
                          ? 'bg-[#0A0D14] border-[#252E4A] text-white placeholder:text-slate-500 focus:border-[#5584B4] focus:ring-2 focus:ring-[#5584B4]/20'
                          : 'bg-white border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#5584B4] focus:ring-2 focus:ring-[#5584B4]/20'
                      }`}
                    />
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Contact Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="e.g. member@venture.com"
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium focus:outline-none transition-all border ${
                        isDark
                          ? 'bg-[#0A0D14] border-[#252E4A] text-white placeholder:text-slate-500 focus:border-[#5584B4] focus:ring-2 focus:ring-[#5584B4]/20'
                          : 'bg-white border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#5584B4] focus:ring-2 focus:ring-[#5584B4]/20'
                      }`}
                    />
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 2: Phone and Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Mobile / WhatsApp <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="+27 82 000 0000"
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium focus:outline-none transition-all border ${
                        isDark
                          ? 'bg-[#0A0D14] border-[#252E4A] text-white placeholder:text-slate-500 focus:border-[#5584B4] focus:ring-2 focus:ring-[#5584B4]/20'
                          : 'bg-white border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#5584B4] focus:ring-2 focus:ring-[#5584B4]/20'
                      }`}
                    />
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Company / Project Name <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Apex Dynamics Ltd"
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium focus:outline-none transition-all border ${
                        isDark
                          ? 'bg-[#0A0D14] border-[#252E4A] text-white placeholder:text-slate-500 focus:border-[#5584B4] focus:ring-2 focus:ring-[#5584B4]/20'
                          : 'bg-white border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#5584B4] focus:ring-2 focus:ring-[#5584B4]/20'
                      }`}
                    />
                    <Building className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Advisory Category Selection - Styled like Website Solution Pills */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Advisory Discipline / Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'advisory', label: 'Commercial Advisory' },
                    { id: 'capital', label: 'Capital & Funding' },
                    { id: 'modelling', label: '3-Statement Models' },
                    { id: 'urgent', label: 'Urgent Valuation' },
                    { id: 'technical', label: 'Platform & Tokens' },
                    { id: 'general', label: 'General Inquiry' },
                  ].map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id as any)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all border text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? isDark
                              ? 'bg-[#1E2548] text-[#D4A373] border-[#5584B4] shadow-xs'
                              : 'bg-[#F2ECE1] text-[#8C6D3F] border-[#C59B63] shadow-xs'
                            : isDark
                            ? 'bg-[#121728] border-[#222E4E] text-slate-300 hover:text-white hover:bg-[#1A223E]'
                            : 'bg-white border-[#E8E2D8] text-slate-700 hover:text-slate-950 hover:bg-[#F4EFE6]'
                        }`}
                      >
                        <span className="truncate">{cat.label}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#5584B4] shrink-0 ml-1.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Subject Line <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Validation of blended CAC and 18-month cash runway"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium focus:outline-none transition-all border ${
                    isDark
                      ? 'bg-[#0A0D14] border-[#252E4A] text-white placeholder:text-slate-500 focus:border-[#5584B4] focus:ring-2 focus:ring-[#5584B4]/20'
                      : 'bg-white border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#5584B4] focus:ring-2 focus:ring-[#5584B4]/20'
                  }`}
                />
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Your Message / Inquiry Details <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {message.length} chars
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe your venture challenge, model calibration requirements, or question for Coach GIM and Quentin..."
                  className={`w-full p-3.5 rounded-xl text-xs sm:text-sm font-sans leading-relaxed focus:outline-none transition-all border ${
                    isDark
                      ? 'bg-[#0A0D14] border-[#252E4A] text-slate-100 placeholder:text-slate-500 focus:border-[#5584B4] focus:ring-2 focus:ring-[#5584B4]/20'
                      : 'bg-white border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#5584B4] focus:ring-2 focus:ring-[#5584B4]/20'
                  }`}
                />
              </div>

              {/* Quick Prompt Starters (Pill style matching website) */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-slate-400 font-mono font-semibold uppercase mr-1">
                  Quick topics:
                </span>
                {[
                  'Help calibrating seed round cap table waterfall',
                  'Assistance with SARS compliance & tax clearance',
                  '3-statement forecast review with Coach GIM',
                ].map((quickText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setMessage((prev) => (prev ? `${prev}\n${quickText}` : quickText))
                    }
                    className="text-[11px] px-3 py-1 rounded-full bg-white dark:bg-[#141A2E] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer border border-[#D8CEBC] dark:border-[#252E4A] hover:border-[#5584B4] font-medium"
                  >
                    + {quickText}
                  </button>
                ))}
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
                <a
                  href={`mailto:${BIZZBEAN_ADVISORY_EMAIL}?subject=${encodeURIComponent(
                    subject || 'TALK TO US Inquiry'
                  )}&body=${encodeURIComponent(
                    `From: ${senderName} (${senderEmail})\nCompany: ${companyName}\nPhone: ${senderPhone}\n\n${message}`
                  )}`}
                  className="text-xs text-[#5584B4] hover:underline flex items-center justify-center sm:justify-start gap-1.5 font-mono font-semibold transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Open directly in email client</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#9fc754] hover:bg-[#8eb543] text-slate-950 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isSubmitting ? 'TRANSMITTING...' : 'SEND DISPATCH'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TalkToUsModal;
