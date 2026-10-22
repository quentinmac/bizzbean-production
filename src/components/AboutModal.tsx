import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck, QrCode, Share2, Check, ExternalLink } from 'lucide-react';
import { UserBusinessProfile } from '../types';
import { FormattedAboutContent } from './FormattedAboutContent';
import {
  DEFAULT_WHO_ARE_WE,
  DEFAULT_WHAT_WE_DO,
  DEFAULT_WHERE_ARE_WE_GOING,
  DEFAULT_HOW_SOLUTIONS_ENABLE_GROWTH,
} from '../data/aboutDefaults';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterAsGuest: () => void;
  userProfile?: UserBusinessProfile;
  theme?: 'light' | 'dark';
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onEnterAsGuest,
  userProfile,
  theme = 'light',
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const profileSlug = userProfile?.slug || 'bizzbean';
  const companyName = userProfile?.companyName || 'BizzBean';
  const websiteUrl = userProfile?.websiteUrl || 'https://bizzbean.com';

  const handleCopyProfileUrl = () => {
    navigator.clipboard.writeText(`https://bizzbean.com/profile/${profileSlug}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-bizzbean-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border p-5 sm:p-8 shadow-2xl my-auto transition-colors ${
          isDark
            ? 'bg-[#12172A] border-[#252E4A] text-[#E2E8F0]'
            : 'bg-white border-[#D8CEBC] text-slate-800'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="pb-3 border-b border-slate-200 dark:border-slate-800 mb-5">
          <h3
            id="about-bizzbean-title"
            className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide font-sans"
          >
            ABOUT BIZZBEAN
          </h3>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            infinite wisdom · instant viability · always on
          </p>
        </div>

        {/* Social Mission Equation */}
        <div
          className={`p-4 rounded-xl border text-center mb-5 ${
            isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
          }`}
        >
          <div className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-tight leading-relaxed">
            {userProfile?.socialMissionEquation ||
              '[ Validated Businesses + Grown Entrepreneurs ] x Scaled AI Sandbox = The Solution to Youth Unemployment'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {userProfile?.socialMissionSubtext ||
              'Youth unemployment is one of the greatest challenges of our time. We believe scaled, fundamental entrepreneurship is the definitive answer.'}
          </div>
        </div>

        {/* 4 Foundational Questions with Headings, Paragraphs, and Bullet Points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 text-xs">
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
            }`}
          >
            <div className="font-mono text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center justify-between">
              <span>01. WHO ARE WE</span>
              <span className="text-[10px] text-[#C59B63] lowercase font-normal">identity & purpose</span>
            </div>
            <FormattedAboutContent
              content={userProfile?.whoAreWe || DEFAULT_WHO_ARE_WE}
              isDark={isDark}
            />
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
            }`}
          >
            <div className="font-mono text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center justify-between">
              <span>02. WHAT WE DO</span>
              <span className="text-[10px] text-[#C59B63] lowercase font-normal">mechanics & tools</span>
            </div>
            <FormattedAboutContent
              content={userProfile?.whatWeDoPanel || DEFAULT_WHAT_WE_DO}
              isDark={isDark}
            />
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
            }`}
          >
            <div className="font-mono text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center justify-between">
              <span>03. WHERE ARE WE GOING</span>
              <span className="text-[10px] text-[#C59B63] lowercase font-normal">vision & trajectory</span>
            </div>
            <FormattedAboutContent
              content={userProfile?.whereAreWeGoing || DEFAULT_WHERE_ARE_WE_GOING}
              isDark={isDark}
            />
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
            }`}
          >
            <div className="font-mono text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center justify-between">
              <span>04. HOW SOLUTIONS ENABLE GROWTH</span>
              <span className="text-[10px] text-[#C59B63] lowercase font-normal">spectrum & outcomes</span>
            </div>
            <FormattedAboutContent
              content={userProfile?.howSolutionsEnableGrowth || DEFAULT_HOW_SOLUTIONS_ENABLE_GROWTH}
              isDark={isDark}
            />
          </div>
        </div>

        {/* Shareable Company Profile & QR Code Section (In the same website style) */}
        <div
          className={`p-4 rounded-xl border mb-5 ${
            isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white p-1 flex items-center justify-center border border-[#D8CEBC] shadow-xs shrink-0">
                <QrCode className="h-10 w-10 text-slate-950" />
              </div>
              <div className="text-left">
                <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  bizzbean.com/profile/{profileSlug}
                </div>
                {websiteUrl && (
                  <a
                    href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#5584B4] hover:underline font-mono flex items-center gap-1 mt-0.5"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>{websiteUrl.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Scan QR code or copy URL to share profile
                </div>
              </div>
            </div>

            <button
              onClick={handleCopyProfileUrl}
              className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-mono font-semibold rounded-lg transition-colors ${
                isDark
                  ? 'bg-[#1E2548] text-white hover:bg-[#252E58] border border-[#5584B4]'
                  : 'bg-[#12172A] hover:bg-[#1E2548] text-white shadow-xs'
              }`}
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5 text-[#C59B63]" />}
              <span>{copiedLink ? 'URL Copied!' : 'Copy Profile URL'}</span>
            </button>
          </div>
        </div>

        {/* Modal Action Footprint */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Google Workspace & Gemini Core Architecture</span>
          </div>

          <button
            onClick={() => {
              onClose();
              onEnterAsGuest();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-[#C59B63] hover:bg-[#B38A52] rounded-xl transition-all shadow-md font-sans"
          >
            <span>Open Glass Doors & Explore bizz-DESK</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
