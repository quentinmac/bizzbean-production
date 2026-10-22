import React from 'react';
import { Download, Sparkles, X, CheckCircle2, BookOpen, ArrowRight, ShieldCheck } from 'lucide-react';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';

interface SandboxWelcomeLetterProps {
  recipientName: string;
  promoDetails?: {
    code?: string;
    type?: string;
    corporateName?: string;
    tokenAllocation?: number;
    grantedApps?: string[];
    grantedCourses?: string[];
  } | null;
  onClose: () => void;
  onDownloadBook: () => void;
  onSignIn: () => void;
}

export const SandboxWelcomeLetter: React.FC<SandboxWelcomeLetterProps> = ({
  recipientName,
  promoDetails,
  onClose,
  onDownloadBook,
  onSignIn,
}) => {
  return (
    <div className="relative w-full max-w-xl mx-auto bg-[#FAF8F5] border border-[#D8CEBC] rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-800 animate-in fade-in zoom-in-95 duration-200">
      {/* Top Banner Accent */}
      <div className="h-2.5 bg-gradient-to-r from-[#12172A] via-[#5584B4] to-[#9FC754]" />

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
        aria-label="Close welcome letter"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Header with Logo */}
        <div className="flex items-center gap-3 border-b border-[#EAE3D4] pb-4">
          <BizzbeanLogoIcon className="h-10 w-10 shrink-0" />
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
              Personal Sandbox Orientation
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Raleway'] text-slate-900 tracking-tight lowercase">
              welcome to bizzbean, {recipientName || 'entrepreneur'}
            </h2>
          </div>
        </div>

        {/* Welcome Message Letter Body */}
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
          <p>
            Congratulations on creating your venture workspace profile. You are now stepping into{' '}
            <strong className="text-slate-900 font-semibold">The Illuminated Sandbox</strong>—an uncompromised
            operating environment engineered to guide you through unit economics, financial modeling, and 18-month cash runway governance.
          </p>

          {/* Promotion / Voucher Banner if applied */}
          {promoDetails && (
            <div className="p-4 rounded-xl bg-white border border-[#9FC754]/40 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#9FC754]" />
                <span>Special Promotion Activated: {promoDetails.code || 'VIP'}</span>
              </div>
              <p className="text-xs text-slate-600">
                {promoDetails.corporateName
                  ? `Sponsorship courtesy of ${promoDetails.corporateName}.`
                  : 'Your promotional voucher has been successfully registered.'}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {promoDetails.tokenAllocation ? (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-mono font-bold rounded-md border border-emerald-200">
                    +{promoDetails.tokenAllocation} Runway Tokens
                  </span>
                ) : null}
                {promoDetails.grantedApps && promoDetails.grantedApps.length > 0 ? (
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-800 text-[11px] font-mono font-bold rounded-md border border-blue-200">
                    {promoDetails.grantedApps.length} Unlocked Apps
                  </span>
                ) : null}
              </div>
            </div>
          )}

          {/* Core Foundation Download Box */}
          <div className="p-4 rounded-xl bg-white border border-[#D8CEBC] shadow-xs space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#EAE3D4] text-[#5584B4] shrink-0 mt-0.5">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-['Raleway'] capitalize">
                  getting to value book bundle & modeling templates
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Authored by Quentin G. McCullough. Includes full chapter manuscripts, unlocked pricing spreadsheets, overhead recovery calculators, and annual cycle roadmaps.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onDownloadBook}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#5584B4] hover:bg-[#46719C] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer font-mono"
            >
              <Download className="w-4 h-4" />
              <span>Download "Getting To Value" Bundle (.zip)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Profile stored securely & synchronized with your Firebase Auth token.</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-[#EAE3D4] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onSignIn}
            className="w-full py-3 px-6 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer font-['Raleway'] lowercase"
          >
            <span>enter the personal sandbox workstation</span>
            <ArrowRight className="w-4 h-4 text-[#9FC754]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SandboxWelcomeLetter;
