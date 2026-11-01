import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck, QrCode, Share2, Check, ExternalLink, Sparkles } from 'lucide-react';
import { UserBusinessProfile } from '../types';
import { FormattedAboutContent } from './FormattedAboutContent';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';
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
  const [showQrModal, setShowQrModal] = useState(false);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  // Authentic Bizzbean corporate profile details (matching website About Bizzbean)
  const companyName = 'BizzBean';
  const founderName = 'Quentin McCullough';
  const profileSlug = 'bizzbean';
  const websiteUrl = 'https://bizzbean.com';
  const valueProposition = `### Institutional Acceleration & Infrastructure
We help founders build assets of sustainable value through rigorous quantitative modeling and AI-grounded operational guidance. Our platform bridges the gap between creative startup ideas and institutional capital requirements.`;

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border p-5 sm:p-8 shadow-2xl my-auto transition-colors ${
          isDark
            ? 'bg-[#101424] border-[#252E4A] text-[#E2E8F0]'
            : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-800'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 dark:hover:text-white p-2 rounded-xl border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header - Matching Website ABOUT BIZZBEAN */}
        <div
          className={`pb-4 border-b mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
            isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <BizzbeanLogoIcon className="h-5 w-5 text-[#5584B4]" />
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#C59B63] flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>OFFICIAL MISSION & MANIFESTO</span>
              </span>
            </div>
            <h2
              id="about-bizzbean-title"
              className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-wide font-sans"
            >
              ABOUT BIZZBEAN
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              infinite wisdom · instant viability · always on
            </p>
          </div>
        </div>

        {/* Social Mission Equation from Website & Presentation Slide 8 */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border shadow-xs transition-colors mb-6 text-center ${
            isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
          }`}
        >
          <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-relaxed">
            [ Validated Businesses + Grown Entrepreneurs ] x Scaled AI Sandbox = The Solution to Youth Unemployment
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl mx-auto leading-relaxed">
            Youth unemployment is one of the greatest challenges of our time. We believe scaled, fundamental entrepreneurship is the definitive answer.
          </div>
        </div>

        {/* 4 Foundational Questions with Headings, Paragraphs, and Bullet Points (Website Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 01. WHO ARE WE */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
            }`}
          >
            <div>
              <div className="font-mono text-xs font-bold text-slate-500 uppercase mb-2 flex items-center justify-between">
                <span>01. WHO ARE WE</span>
                <span className="text-[10px] font-mono text-[#C59B63] lowercase font-normal">identity & purpose</span>
              </div>
              <FormattedAboutContent
                content={DEFAULT_WHO_ARE_WE}
                isDark={isDark}
              />
            </div>
          </div>

          {/* 02. WHAT WE DO */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
            }`}
          >
            <div>
              <div className="font-mono text-xs font-bold text-slate-500 uppercase mb-2 flex items-center justify-between">
                <span>02. WHAT WE DO</span>
                <span className="text-[10px] font-mono text-[#C59B63] lowercase font-normal">mechanics & tools</span>
              </div>
              <FormattedAboutContent
                content={DEFAULT_WHAT_WE_DO}
                isDark={isDark}
              />
            </div>
          </div>

          {/* 03. WHERE ARE WE GOING */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
            }`}
          >
            <div>
              <div className="font-mono text-xs font-bold text-slate-500 uppercase mb-2 flex items-center justify-between">
                <span>03. WHERE ARE WE GOING</span>
                <span className="text-[10px] font-mono text-[#C59B63] lowercase font-normal">vision & trajectory</span>
              </div>
              <FormattedAboutContent
                content={DEFAULT_WHERE_ARE_WE_GOING}
                isDark={isDark}
              />
            </div>
          </div>

          {/* 04. HOW SOLUTIONS ENABLE GROWTH */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
            }`}
          >
            <div>
              <div className="font-mono text-xs font-bold text-slate-500 uppercase mb-2 flex items-center justify-between">
                <span>04. HOW SOLUTIONS ENABLE GROWTH</span>
                <span className="text-[10px] font-mono text-[#C59B63] lowercase font-normal">spectrum & outcomes</span>
              </div>
              <FormattedAboutContent
                content={DEFAULT_HOW_SOLUTIONS_ENABLE_GROWTH}
                isDark={isDark}
              />
            </div>
          </div>
        </div>

        {/* Company Profile Section (From Website ABOUT View) */}
        <div
          className={`rounded-2xl border p-5 sm:p-6 shadow-xs mb-6 ${
            isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
          }`}
        >
          <div
            className={`flex items-center justify-between pb-3 border-b mb-4 ${
              isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
            }`}
          >
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                BIZZBEAN – COMPANY PROFILE
              </h3>
              <p className="text-xs text-slate-500 lowercase mt-0.5">
                verified corporate profile & venture credentials
              </p>
            </div>

            <button
              onClick={handleCopyProfileUrl}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-colors lowercase cursor-pointer ${
                isDark
                  ? 'bg-[#1E2548] text-white hover:bg-[#252E58] border border-[#C59B63]'
                  : 'bg-[#12172A] hover:bg-[#1E2548] text-white'
              }`}
            >
              {copiedLink ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3 text-[#C59B63]" />}
              <span>{copiedLink ? 'link copied' : 'share profile url'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="block text-slate-500 lowercase mb-1 font-mono text-[11px]">venture name</label>
              <div
                className={`w-full px-3 py-2 rounded-lg border font-mono text-xs font-semibold ${
                  isDark
                    ? 'bg-[#0A0D14] border-[#252E4A] text-white'
                    : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                }`}
              >
                {companyName}
              </div>
            </div>

            <div>
              <label className="block text-slate-500 lowercase mb-1 font-mono text-[11px]">founder / managing director</label>
              <div
                className={`w-full px-3 py-2 rounded-lg border font-mono text-xs font-semibold ${
                  isDark
                    ? 'bg-[#0A0D14] border-[#252E4A] text-white'
                    : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                }`}
              >
                {founderName}
              </div>
            </div>

            {/* Company Website URL Field */}
            <div className="sm:col-span-2">
              <label className="block text-slate-500 lowercase mb-1 flex items-center justify-between font-mono text-[11px]">
                <span>company website url</span>
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#5584B4] hover:underline flex items-center gap-1"
                >
                  <span>visit site</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </label>
              <div
                className={`w-full px-3 py-2 rounded-lg border font-mono text-xs ${
                  isDark
                    ? 'bg-[#0A0D14] border-[#252E4A] text-[#5584B4]'
                    : 'bg-[#FAF8F5] border-[#D8CEBC] text-[#2E5E88]'
                }`}
              >
                {websiteUrl}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-500 lowercase mb-1 font-mono text-[11px]">what we do / value proposition</label>
              <div
                className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                  isDark ? 'bg-[#0A0D14] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                }`}
              >
                <FormattedAboutContent
                  content={valueProposition}
                  isDark={isDark}
                />
              </div>
            </div>
          </div>

          {/* Profile QR & Sharing Strip (Website Style) */}
          <div
            className={`mt-4 pt-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="h-10 w-10 rounded-lg bg-white p-1 flex items-center justify-center border border-[#D8CEBC] hover:border-[#5584B4] transition-all cursor-pointer shadow-2xs group"
                title="Click to enlarge QR Code"
              >
                <QrCode className="h-8 w-8 text-slate-950 group-hover:scale-105 transition-transform" />
              </button>
              <div>
                <div className={`text-xs font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  bizzbean.com/profile/{profileSlug}
                </div>
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#5584B4] hover:underline font-mono flex items-center gap-1 mt-0.5"
                >
                  <span>{websiteUrl.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
                <div className="text-[11px] text-slate-400 font-mono">
                  scan QR code or copy URL to share profile
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyProfileUrl}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-colors lowercase cursor-pointer ${
                  isDark
                    ? 'bg-[#1E2548] text-white hover:bg-[#252E58] border border-[#C59B63]'
                    : 'bg-[#12172A] hover:bg-[#1E2548] text-white shadow-xs'
                }`}
              >
                {copiedLink ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3 text-[#C59B63]" />}
                <span>{copiedLink ? 'link copied' : 'copy profile url'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Core Architecture Card (Website Style) */}
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 ${
            isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Google Workspace & Gemini Core Architecture
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Macro-free Google Sheets, Google Slides, Google Drive VDR structures, and AES-256 standard.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footprint */}
        <div
          className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={() => {
              onClose();
              onEnterAsGuest();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-900 bg-[#C59B63] hover:bg-[#B38A52] rounded-xl transition-all shadow-md font-sans active:scale-95 cursor-pointer uppercase tracking-wider"
          >
            <span>Open Glass Doors & Explore bizz-DESK</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* QR Code Enlargement Modal */}
        {showQrModal && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          >
            <div
              className={`relative w-full max-w-sm rounded-2xl border p-6 text-center shadow-2xl ${
                isDark ? 'bg-[#12172A] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
              }`}
            >
              <button
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <h4 className="font-bold text-sm uppercase tracking-wider mb-1 font-mono">
                {companyName} Profile QR
              </h4>
              <p className="text-xs text-slate-400 mb-4 font-sans">
                Scan to view verified public profile and venture details
              </p>

              <div className="p-4 bg-white rounded-xl inline-block border border-slate-200 shadow-inner mb-4">
                <QrCode className="h-40 w-40 text-slate-950" />
              </div>

              <div className="text-xs font-mono text-slate-400 mb-3">
                bizzbean.com/profile/{profileSlug}
              </div>

              <button
                onClick={handleCopyProfileUrl}
                className="w-full py-2.5 rounded-lg bg-[#5584B4] hover:bg-[#4773A0] text-white text-xs font-mono font-semibold transition-colors cursor-pointer"
              >
                {copiedLink ? '✓ Profile URL Copied' : 'Copy Profile Link'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
