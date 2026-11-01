import React, { useState } from 'react';
import { 
  MessageSquare, 
  Shield, 
  ChevronUp,
  X,
  Send,
  CheckCircle2,
  Lock,
  ExternalLink
} from 'lucide-react';
import { BizzBeanBrandHeader } from './BizzBeanBrandHeader';
import { createEnquiry } from '../services/enquiryService';

interface FooterProps {
  userRole?: 'admin' | 'member' | 'public';
  isMember?: boolean;
  onNavigate?: (view: string) => void;
  onOpenTalkToUs?: () => void;
  onOpenPolicies?: (policyKey: string) => void;
  onOpenBuyTokens?: () => void;
  onDownloadBookBundle?: () => void;
  onOpenMediaCloud?: () => void;
}

const POLICY_CONTENT: Record<string, { title: string; body: string[] }> = {
  privacy_policy: {
    title: 'Privacy Policy (POPIA & GDPR)',
    body: [
      'BizzBean (Pty) Ltd respects your privacy and is committed to protecting your personal information in strict accordance with the South African Protection of Personal Information Act (POPIA Act 4 of 2013) and the General Data Protection Regulation (GDPR).',
      'All venture metrics, unit economics, accounting entries, and business models created inside bizz-DESK are encrypted in transit and at rest on Google Cloud Run and Firestore infrastructure.',
      'We do not sell, rent, or trade your proprietary business models to third parties. Data is used solely to generate simulated cash runways, valuations, and executive financial reports.'
    ]
  },
  terms_of_service: {
    title: 'Terms of Service',
    body: [
      'By accessing the BizzBean platform, you agree to comply with these terms. BizzBean provides quantitative modeling software, educational masterclasses, and entrepreneurial acceleration tools.',
      'All content, including financial models, algorithms, templates, and video lessons, constitutes intellectual property of BizzBean (Pty) Ltd. Users receive an authorized license to utilize models for internal venture growth.',
      'Users are responsible for maintaining the confidentiality of their credentials and authorized access tokens.'
    ]
  },
  apple_usage: {
    title: 'Apple Usage Guidelines',
    body: [
      'BizzBean web applications accessed via Apple Safari, iOS, or macOS conform to Apple WebKit standards and mobile browser security specifications.',
      'No background tracking cookies or unauthorized telemetry scripts are deployed beyond essential application state and Firebase authentication tokens.'
    ]
  },
  data_processing: {
    title: 'Data Processing Agreement',
    body: [
      'This Data Processing Agreement governs the processing of venture records entered into BizzBean solutions, including bizzmoney ledger integrations, payroll schedules, and cap table models.',
      'Data is processed securely through European and South African cloud zones with multi-tenant logical isolation and automatic audit trails.'
    ]
  },
  market_terms: {
    title: 'Market Terms & Disclaimers',
    body: [
      'Financial models, 3-statement forecasts, and valuation calculators provided by BizzBean are algorithmic simulation tools designed for strategic planning, scenario stress-testing, and investor presentations.',
      'They do not constitute formal registered financial advisory services, statutory tax opinions, or underwriting commitments. Founders should verify final regulatory filings with certified professionals.'
    ]
  },
  acceptable_policy: {
    title: 'Acceptable Use Policy',
    body: [
      'Users agree not to reverse-engineer formulas, automate unauthorized scraping of masterclass vaults, or execute distributed denial-of-service attempts against BizzBean APIs.',
      'Fair compute token limits apply to personal-sandbox calculations and server-side model processing.'
    ]
  },
  additional_items: {
    title: 'Additional Provisions',
    body: [
      'These provisions are governed by the laws of the Republic of South Africa. Any disputes shall be subject to arbitration in Cape Town or Johannesburg.',
      'If any provision is deemed unenforceable, the remaining terms shall continue in full force and effect.'
    ]
  }
};

export const Footer: React.FC<FooterProps> = ({
  userRole = 'member',
  isMember = true,
  onNavigate = (view) => console.log('Navigate to', view),
  onOpenTalkToUs,
  onOpenPolicies,
}) => {
  const [activePolicyKey, setActivePolicyKey] = useState<string | null>(null);
  const [isTalkToUsOpen, setIsTalkToUsOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState('General Advisory & Enterprise Inquiries');
  const [contactMessage, setContactMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPolicy = (key: string) => {
    if (onOpenPolicies) {
      onOpenPolicies(key);
    }
    setActivePolicyKey(key);
  };

  const handleOpenTalkToUs = () => {
    if (onOpenTalkToUs) {
      onOpenTalkToUs();
      return;
    }
    if (!isMember) {
      return;
    }
    setIsTalkToUsOpen(true);
  };

  const handleSendTalkToUs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMember) return;
    if (!contactMessage.trim()) return;

    try {
      const storedName = localStorage.getItem('bizzbean_sandbox_name') || 'Sandbox Member';
      const storedEmail = localStorage.getItem('bizzbean_sandbox_email') || 'member@bizzbean.com';
      await createEnquiry({
        senderName: storedName,
        senderEmail: storedEmail,
        subject: contactSubject,
        message: contactMessage,
        source: 'footer',
        status: 'new',
      });
    } catch (err) {
      console.info('Footer enquiry fallback:', err);
    }

    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setIsTalkToUsOpen(false);
      setContactMessage('');
    }, 2000);
  };

  return (
    <footer className="bg-[#0e2a42] text-white border-t border-[#1a4a70] pt-12 pb-8 px-4 md:px-8 mt-auto shadow-2xl relative overflow-hidden font-sans">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#9fc754]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#4b79a1]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        
        {/* Top Quick Links Bar */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-black uppercase tracking-wider text-slate-300 pb-2 border-b border-white/10">
          <button 
            type="button" 
            onClick={() => { onNavigate('home'); scrollToTop(); }} 
            className="hover:text-white transition-colors cursor-pointer"
          >
            home
          </button>
          <span className="text-slate-600">•</span>
          <button 
            type="button" 
            onClick={() => handleOpenPolicy('privacy_policy')} 
            className="text-[#4285F4] hover:text-sky-300 transition-colors font-extrabold cursor-pointer tracking-widest"
          >
            WEBSITE POLICIES
          </button>
          <span className="text-slate-600">•</span>
          <button 
            type="button" 
            onClick={handleOpenTalkToUs} 
            className="text-[#9fc754] hover:text-white transition-colors font-extrabold cursor-pointer tracking-wider flex items-center gap-1"
          >
            <MessageSquare size={12} />
            <span>TALK TO US</span>
          </button>
        </div>

        {/* Main Directory (Clean 2-Column Layout with removed BizzApps, Knowledge & Token/Journal buttons) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Col 1: Brand & Actions */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3 select-none">
              <BizzBeanBrandHeader iconSize="w-10 h-10 shrink-0" textSize="text-2xl sm:text-3xl" theme="dark" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
              Empowering South African &amp; global entrepreneurs to create assets of sustainable value through institutional-grade financial modeling simulators, structured business plans, and interactive educational masterclasses.
            </p>
            <div className="pt-2 flex flex-wrap gap-2.5">
              <button 
                type="button" 
                onClick={handleOpenTalkToUs} 
                className="bg-[#9fc754] hover:bg-[#8eb543] text-slate-950 font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <MessageSquare size={13} className="fill-slate-950 text-slate-950" />
                <span>Talk To Us</span>
              </button>
            </div>
          </div>

          {/* Col 2: Governance & Legal Policies */}
          <div className="lg:col-span-5 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#9fc754] flex items-center gap-1.5">
              <Shield size={13} />
              <span>Governance &amp; Legal</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {[
                { key: 'privacy_policy', label: 'Privacy Policy (POPIA / GDPR)' },
                { key: 'terms_of_service', label: 'Terms of Service' },
                { key: 'apple_usage', label: 'Apple Usage Guidelines' },
                { key: 'data_processing', label: 'Data Processing Agreement' },
                { key: 'market_terms', label: 'Market Terms & Disclaimers' },
                { key: 'acceptable_policy', label: 'Acceptable Use Policy' },
                { key: 'additional_items', label: 'Additional Provisions' }
              ].map(policy => (
                <li key={policy.key}>
                  <button 
                    type="button" 
                    onClick={() => handleOpenPolicy(policy.key)} 
                    className="hover:text-white transition-colors cursor-pointer flex items-center justify-between w-full group text-left py-0.5"
                  >
                    <span className="group-hover:underline">{policy.label}</span>
                    <span className="text-[10px] text-slate-500">→</span>
                  </button>
                </li>
              ))}
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors cursor-pointer flex items-center justify-between w-full group text-left py-0.5 text-slate-300"
                >
                  <span className="group-hover:underline flex items-center gap-1.5">
                    <span>Google Search XML Sitemap</span>
                    <ExternalLink size={10} className="text-[#9fc754]" />
                  </span>
                  <span className="text-[10px] text-slate-500">↗</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Security & Payment Badges Bar */}
        <div className="pt-6 pb-2 border-t border-white/10 flex flex-col items-center justify-center space-y-3">
          <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-2xl shadow-inner select-none">
            <div className="flex items-center gap-1.5 text-slate-200 font-extrabold text-xs tracking-wider">
              <span className="bg-emerald-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded">DPO</span>
              <span className="font-bold text-slate-300">pay</span>
            </div>
            <span className="text-slate-700 font-light">|</span>
            <div className="flex items-center gap-1 font-black text-sm tracking-tight text-white italic">
              <span className="text-red-500">Pay</span>
              <span>Fast</span>
            </div>
            <span className="text-slate-700 font-light">|</span>
            <div className="font-black text-sm tracking-widest text-[#1a73e8] italic px-1 font-serif">VISA</div>
            <span className="text-slate-700 font-light">|</span>
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B] opacity-90" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] opacity-90" />
              </div>
              <span className="font-bold text-xs text-slate-300 font-sans">MasterCard</span>
            </div>
            <span className="text-slate-700 font-light hidden sm:inline">|</span>
            <div className="px-2 py-0.5 rounded border border-slate-600 bg-slate-900/90 text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">
              VERIFIED BY VISA
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center font-medium max-w-2xl leading-relaxed">
            Official PayFast by DPO Group Merchant • Merchant ID: <span className="font-mono font-bold text-slate-200">14980265</span> (BizzBean South Africa). Secured with 256-bit SSL encryption, 3D Secure, Visa, MasterCard, and South African Instant EFT.
          </p>
        </div>

        {/* Bottom Copyright & Back to Top */}
        <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-center md:text-left">
            <span className="font-light text-white lowercase tracking-tight">
              bizzbean<span className="text-[9px] text-slate-400 font-normal ml-0.5 align-super">TM</span>
            </span>
            <span>© {new Date().getFullYear()} BizzBean (Pty) Ltd. All rights reserved.</span>
          </div>
          <div className="text-center text-[11px] text-slate-400 font-mono">
            the 2026 bizzbean website is securely hosted by <strong className="text-slate-300 font-sans font-bold">Google Cloud Run</strong>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <button 
              type="button" 
              onClick={scrollToTop} 
              className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer font-bold text-slate-300"
            >
              <span>Back to Top</span>
              <ChevronUp size={12} />
            </button>
          </div>
        </div>

      </div>

      {/* Policy Reader Modal */}
      {activePolicyKey && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[#0e2a42] border border-[#1a4a70] text-white p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setActivePolicyKey(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              aria-label="Close policy"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-mono text-[#9fc754] uppercase tracking-wider mb-2">
              <Shield className="h-4 w-4" />
              <span>Official Governance Document</span>
            </div>
            <h3 className="text-xl font-bold font-['Outfit'] mb-4 text-white">
              {POLICY_CONTENT[activePolicyKey]?.title || 'Policy & Governance'}
            </h3>
            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {POLICY_CONTENT[activePolicyKey]?.body.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setActivePolicyKey(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Talk To Us Contact Modal */}
      {isTalkToUsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0e2a42] border border-[#1a4a70] text-white p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsTalkToUsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-2 text-xs font-mono text-[#9fc754] uppercase tracking-wider mb-1">
              <MessageSquare className="h-4 w-4" />
              <span>Direct Advisory Channel</span>
            </div>
            <h3 className="text-xl font-bold font-sans mb-1 text-white">
              Talk to BizzBean Senior Advisory
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Send a direct dispatch to <span className="font-mono text-[#9fc754]">thebizzbeanchannel@gmail.com</span>.
            </p>

            {messageSent ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-[#9fc754] mx-auto animate-bounce" />
                <div className="text-sm font-bold text-white font-mono">Dispatch Transmitted</div>
                <p className="text-xs text-slate-300">
                  Your message has been queued. An executive advisor will respond shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendTalkToUs} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[11px]">Subject</label>
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/20 text-white focus:outline-none focus:border-[#9fc754]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[11px]">Your Message / Inquiry</label>
                  <textarea
                    rows={4}
                    placeholder="Enter your venture inquiry, capital modeling request, or advisory question..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/20 text-white focus:outline-none focus:border-[#9fc754]"
                    required
                  />
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <a
                    href={`mailto:thebizzbeanchannel@gmail.com?subject=${encodeURIComponent(contactSubject)}&body=${encodeURIComponent(contactMessage)}`}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                  >
                    <span>Open in Email App</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <button
                    type="submit"
                    className="bg-[#9fc754] hover:bg-[#8eb543] text-slate-950 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors font-mono"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Dispatch</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
