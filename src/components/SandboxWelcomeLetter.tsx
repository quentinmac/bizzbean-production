import React from 'react';
import { Download, ArrowRight, X } from 'lucide-react';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';

interface SandboxWelcomeLetterProps {
  recipientName: string;
  recipientEmail?: string;
  promoDetails?: {
    code?: string;
    type?: string;
    corporateName?: string;
    tokenAllocation?: number;
    grantedApps?: string[];
    grantedCourses?: string[];
  } | null | any;
  onClose: () => void;
  onDownloadBook: () => void;
  onEnterSandbox?: () => void;
  onSignIn?: () => void;
}

export const SandboxWelcomeLetter: React.FC<SandboxWelcomeLetterProps> = ({
  recipientName,
  recipientEmail,
  promoDetails,
  onClose,
  onDownloadBook,
  onEnterSandbox,
  onSignIn,
}) => {
  const handleProceed = onEnterSandbox || onSignIn || onClose;
  // Extract first name or fallback gracefully
  const cleanName = (recipientName || '').trim();
  const firstName = cleanName ? cleanName.split(' ')[0] : 'first name';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-[#D8CEBC] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden font-sans text-slate-800 my-auto">
        {/* 1. TOP SLATE-BLUE HEADER BANNER (Per your sandbox is open.png) */}
        <div className="h-6 sm:h-7 bg-[#5584B4] w-full" />

        {/* Close 'X' button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-8 right-5 sm:right-6 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 2. MAIN CARD CONTENT */}
        <div className="px-6 sm:px-12 pt-6 pb-6 space-y-6">
          {/* Centered Logo & Title */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center gap-2 mb-2 select-none">
              <BizzbeanLogoIcon className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
              <div className="flex items-baseline text-3xl sm:text-4xl text-[#707070] tracking-tight font-['Raleway']">
                <span style={{ fontWeight: 300 }}>bizz</span>
                <span style={{ fontWeight: 100 }}>bean</span>
                <sup className="text-xs font-normal text-[#707070] ml-0.5 -top-3 font-['Raleway']">
                  TM
                </sup>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-light font-['Raleway'] text-[#3E74A6] tracking-wide mt-1">
              your SANDBOX is ready
            </h2>
          </div>

          {/* Salutation */}
          <div className="text-[#3E74A6] font-['Raleway'] text-base sm:text-lg font-normal">
            Hi, {firstName}
          </div>

          {/* Letter Body Paragraphs (Exact copy from your sandbox is open.png) */}
          <div className="space-y-4 text-xs sm:text-sm text-[#3E74A6] font-['Raleway'] leading-relaxed font-normal">
            <p>
              Thank you for creating a SANDBOX account with us at bizzbean. We hope that by doing this we can help you discover, build, grow and even enable investment in your entrepreneurial ABILITY.
            </p>

            <p>
              Please download your free copy of our book &lsquo;getting to value&rsquo;. Also, keep an eye out for any message notifications. If you have an idea for a business model-set or an education programme, please use TALK TO US - we promise to consider all submissions.
            </p>

            <p>
              You can update your business profile in the &lsquo;about&rsquo;, located in the top left of the landing page. When updated, you can use it to market your business.
            </p>

            <p>
              We wish you all the best with your entrepreneurial journey.
            </p>

            {/* Letter Sign-off */}
            <div className="pt-2">
              <p className="italic text-[#4A7DAA] font-serif text-sm">sincerely,</p>
              <p className="font-bold text-[#20476E] text-base font-['Raleway'] mt-0.5">the bizzbean team</p>
            </div>
          </div>

          {/* Action Row: Book Download + Proceed to Workstation */}
          <div className="pt-3 border-t border-[#EAE3D4] flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onDownloadBook}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#5584B4] hover:bg-[#4372A2] text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer font-['Raleway'] lowercase"
              title="Download your free copy of 'getting to value' by Quentin G. McCullough"
            >
              <Download className="w-4 h-4" />
              <span>download &lsquo;getting to value&rsquo;</span>
            </button>

            <button
              type="button"
              onClick={handleProceed}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer font-['Raleway'] lowercase"
            >
              <span>enter personal sandbox</span>
              <ArrowRight className="w-4 h-4 text-[#9FC754]" />
            </button>
          </div>
        </div>

        {/* 3. BOTTOM GREEN BANNER (Exact creed per your sandbox is open.png) */}
        <div className="w-full bg-[#9FC754] py-3 px-4 text-center text-white text-xs sm:text-sm font-['Raleway'] font-normal tracking-wide lowercase">
          instant viability. infinite wisdom. always on.
        </div>
      </div>
    </div>
  );
};

export default SandboxWelcomeLetter;
