import React, { useState, useEffect } from 'react';
import { ArrowRight, Clock, KeyRound, UserCheck, X } from 'lucide-react';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';
import { CmsPromotionSection } from '../data/cmsConsoleData';
import { CMS_STORAGE_KEYS } from '../utils/imageStorage';
import AuthGateway from './AuthGateway';
import { sendWelcomeEmail } from '../services/emailService';
import { resolveDisplayName } from '../services/firebaseAuthService';

interface SplashOfficeDoorsProps {
  onEnterWorkspace: (isMember: boolean, userEmail?: string, chosenPromotion?: CmsPromotionSection | null, userName?: string) => void;
  onOpenAboutModal: () => void;
  activePromotion?: CmsPromotionSection | null;
  cmsPromotions?: CmsPromotionSection[];
  onTriggerDoorOpening?: () => CmsPromotionSection | null;
  onConfirmSignUp?: (name: string, email: string, company: string) => void;
}

export const SplashOfficeDoors: React.FC<SplashOfficeDoorsProps> = ({
  onEnterWorkspace,
  onOpenAboutModal,
  activePromotion,
  cmsPromotions,
  onTriggerDoorOpening,
  onConfirmSignUp,
}) => {
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [doorPromotion, setDoorPromotion] = useState<CmsPromotionSection | null>(activePromotion || null);
  const [authMode, setAuthMode] = useState<'none' | 'signin' | 'signup'>('none');
  const [emailInput, setEmailInput] = useState('founder@bizzbean.com');
  const [fullNameInput, setFullNameInput] = useState('Elena Vance');
  const [companyInput, setCompanyInput] = useState('Apex Cloud Dynamics');
  const [currentTime, setCurrentTime] = useState('10:10');

  useEffect(() => {
    if (activePromotion && activePromotion.isActive !== false && activePromotion.imageUrl && activePromotion.imageUrl.trim() !== '') {
      setDoorPromotion(activePromotion);
    } else {
      setDoorPromotion(null);
    }
  }, [activePromotion]);

  // Helper to pick a random promotion with a valid user-loaded image
  const pickRandomPromo = (): CmsPromotionSection | null => {
    if (onTriggerDoorOpening) {
      const fromParent = onTriggerDoorOpening();
      if (fromParent && fromParent.isActive !== false && fromParent.imageUrl) return fromParent;
    }

    let promoList = cmsPromotions && cmsPromotions.length > 0 ? cmsPromotions : [];
    if (promoList.length === 0) {
      try {
        const stored = localStorage.getItem(CMS_STORAGE_KEYS.PROMOTIONS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) promoList = parsed;
        }
      } catch (e) {
        console.warn(e);
      }
    }

    const withImages = promoList.filter(
      (p) =>
        p &&
        p.isActive !== false &&
        p.imageUrl &&
        p.imageUrl.trim() !== '' &&
        !p.imageUrl.includes('1553877522-43269d4ea984')
    );

    if (withImages.length > 0) {
      const idx = Math.floor(Math.random() * withImages.length);
      return withImages[idx];
    }

    const anyActive = promoList.filter((p) => p && p.isActive !== false);
    if (anyActive.length > 0) {
      return anyActive[Math.floor(Math.random() * anyActive.length)];
    }

    return (activePromotion && activePromotion.isActive !== false) ? activePromotion : null;
  };

  const handleTriggerEnter = (asMember: boolean, customEmail?: string, customName?: string) => {
    // 1. Immediately present a random HERO PROMOTION image when doors open (only if active)
    const chosen = pickRandomPromo();
    if (chosen && chosen.isActive !== false) {
      setDoorPromotion(chosen);
    } else {
      setDoorPromotion(null);
    }
    setDoorsOpen(true);
    setAuthMode('none');

    // Executive gravitas door opening duration (2200ms)
    setTimeout(() => {
      onEnterWorkspace(asMember, customEmail || (asMember ? emailInput : undefined), chosen, customName);
    }, 2200);
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    const resolved = resolveDisplayName(emailInput.trim());
    handleTriggerEnter(true, emailInput.trim(), resolved);
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    const cleanName = fullNameInput.trim() || 'Venture Founder';
    const cleanEmail = emailInput.trim();
    const cleanCompany = companyInput.trim() || 'My Venture';

    // Dispatch welcome email via Xneelo SMTP
    sendWelcomeEmail({
      recipientEmail: cleanEmail,
      recipientName: cleanName,
      firstName: cleanName.split(' ')[0] || undefined,
      companyName: cleanCompany,
    }).then((res) => {
      if (res.success) {
        console.log('✓ Welcome email sent to:', cleanEmail);
      } else {
        console.warn('Welcome email dispatch note:', res.error);
      }
    }).catch((err) => console.warn('Welcome email error:', err));

    if (onConfirmSignUp) {
      onConfirmSignUp(cleanName, cleanEmail, cleanCompany);
    }
    handleTriggerEnter(true, cleanEmail);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#FAF8F5] select-none font-sans">
      
      {/* ========================================================================= */}
      {/* THE ILLUMINATED SANDBOX: Desk Environment & Sleek Workstation Display     */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 bg-architectural-grid pointer-events-none flex items-center justify-center">
        
        {/* Soft atmospheric gradient arc */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(244,239,230,0.85)_0%,rgba(250,248,245,0.4)_60%,transparent_100%)]" />

        {/* Ambient warm champagne/topaz light */}
        <div className="absolute top-16 right-1/4 w-[450px] h-[450px] bg-[#EAE3D4]/50 blur-[130px] rounded-full" />
        <div className="absolute bottom-20 left-1/4 w-[400px] h-[400px] bg-[#D8CEBC]/35 blur-[140px] rounded-full" />

        {/* Realistic Architectural Workbench Surface */}
        <div className="absolute bottom-0 w-full h-[38%] bg-gradient-to-t from-[#EDE7DC] via-[#F4EFE6] to-[#FAF8F5] border-t border-[#D8CEBC] shadow-[inset_0_20px_40px_rgba(28,35,56,0.05)] flex flex-col justify-start items-center">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#C59B63]/30 to-transparent" />
        </div>

        {/* The Desk Setup Container with Sleek Computer that expands on door opening */}
        <div className="relative z-10 flex flex-col items-center mb-6">
          
          {/* Laptop Screen Hardware */}
          <div
            className={`relative rounded-t-xl border-2 border-[#2A314A] bg-[#161B2E] shadow-[0_20px_50px_-10px_rgba(18,23,42,0.2)] p-2 flex flex-col transition-all duration-[2200ms] ease-in-out ${
              doorsOpen
                ? 'w-[480px] sm:w-[680px] md:w-[840px] h-[300px] sm:h-[420px] md:h-[500px] scale-105 opacity-90'
                : 'w-[290px] sm:w-[390px] md:w-[480px] h-[180px] sm:h-[240px] md:h-[300px]'
            }`}
          >
            {/* Laptop Camera dot & sensor */}
            <div className="flex justify-center items-center pb-1 gap-1">
              <div className="h-1 w-1 rounded-full bg-[#0F1322] border border-[#3A4363]" />
              <div className="h-1 w-1 rounded-full bg-[#5584B4]" />
            </div>

            {/* Inner Computer Display with Sleek illuminated sandbox workstation display */}
            <div className="relative flex-grow rounded-lg bg-gradient-to-br from-[#101424] via-[#161C30] to-[#0E1220] border border-[#2B3452] flex flex-col items-center justify-center text-center overflow-hidden shadow-inner p-4">
              {doorsOpen && (doorPromotion?.imageUrl || activePromotion?.imageUrl) ? (
                <div className="absolute inset-0 overflow-hidden animate-fade-in flex flex-col justify-between p-3.5 bg-black/60 select-none">
                  <img
                    src={(doorPromotion?.imageUrl || activePromotion?.imageUrl)!}
                    alt={(doorPromotion || activePromotion)?.displayName || 'Promotion'}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1220]/95 via-transparent to-black/40" />
                  <div className="relative z-10 flex justify-between items-center text-[10px] font-mono text-[#DDEBF7]">
                    <span className="tracking-wider font-bold bg-[#141A2E]/80 px-2 py-0.5 rounded border border-[#2B3452]">
                      {(doorPromotion || activePromotion)?.displayName}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="relative z-10 text-left space-y-0.5">
                    <div className="text-white text-xs sm:text-sm font-bold font-sans drop-shadow-md">
                      {(doorPromotion || activePromotion)?.displayName}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-200 font-sans truncate drop-shadow-sm">
                      {(doorPromotion || activePromotion)?.tagline}
                    </div>
                  </div>
                </div>
              ) : doorsOpen ? (
                /* When doors are open, display the stage promotion billboard cleanly without any fallback graphic */
                <div className="absolute inset-0 overflow-hidden animate-fade-in flex flex-col justify-between p-4 bg-gradient-to-br from-[#141A2E] to-[#0E1220] select-none text-left">
                  <div className="flex justify-between items-center text-[10px] font-mono text-[#DDEBF7]">
                    <span className="tracking-wider font-bold bg-[#1E2548] px-2 py-0.5 rounded border border-[#2B3452]">
                      {(doorPromotion || activePromotion)?.displayName || 'HERO PROMOTION'}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-white text-sm sm:text-base font-bold font-sans">
                      {(doorPromotion || activePromotion)?.displayName || 'Stage Promotion'}
                    </div>
                    <div className="text-[11px] text-slate-300 font-sans leading-relaxed">
                      {(doorPromotion || activePromotion)?.stageStory?.narrative || (doorPromotion || activePromotion)?.tagline || 'Presenting verified venture milestones.'}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-[#5584B4] uppercase tracking-wider">
                    entering workspace...
                  </div>
                </div>
              ) : (
                <>
                  {/* Standby screen when sliding doors are closed */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(85,132,180,0.2)_0%,transparent_70%)]" />

                  {/* Minimalist Desk OS Status */}
                  <div className="relative z-10 flex flex-col items-center space-y-2">
                    <BizzbeanLogoIcon className="h-8 w-8 sm:h-9 sm:w-9 opacity-95 drop-shadow-sm" />
                    <div className="font-['Raleway'] tracking-wider text-xs sm:text-sm text-slate-200 font-light lowercase">
                      bizz-desk v2.0
                    </div>
                    <div className="text-[10px] font-mono text-[#DDEBF7] lowercase flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#5584B4] animate-pulse" />
                      <span>the illuminated sandbox · active</span>
                    </div>
                  </div>

                  {/* Screen Bottom Taskbar */}
                  <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center text-[9px] sm:text-[10px] font-mono text-slate-400 border-t border-[#252E4A] pt-1.5">
                    <span className="lowercase">gemini ai-loop · always on</span>
                    <span className="text-[#DDEBF7] font-medium lowercase">ready</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Laptop Base & Trackpad */}
          <div
            className={`h-3 rounded-b-lg bg-gradient-to-r from-[#2A314A] via-[#3A4363] to-[#2A314A] shadow-lg border-t border-[#455073] flex justify-center items-center transition-all duration-[2200ms] ease-in-out ${
              doorsOpen
                ? 'w-[520px] sm:w-[740px] md:w-[920px]'
                : 'w-[290px] sm:w-[400px] md:w-[500px]'
            }`}
          >
            <div className="w-14 h-0.5 bg-[#1A1F33] rounded-full" />
          </div>

          {/* Desk Clock Accessory (10:10) */}
          <div className="absolute right-[-20px] sm:right-[-60px] md:right-[-90px] bottom-2 px-2.5 py-1.5 rounded-lg bg-white/95 border border-[#D8CEBC] shadow-xs font-mono text-xs text-slate-700 flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-[#5584B4]" />
            <span className="tabular-nums font-bold text-slate-900">{currentTime}</span>
          </div>

          {/* Ceramic Cup / Desk accessory */}
          <div className="absolute left-[-20px] sm:left-[-60px] md:left-[-90px] bottom-1 flex flex-col items-center">
            <div className="w-8 sm:w-9 h-10 sm:h-12 rounded-b-xl rounded-t bg-gradient-to-r from-[#EAE3D4] via-[#F4EFE6] to-[#D8CEBC] shadow-xs border border-[#D8CEBC] flex items-center justify-center">
              <span className="text-[8px] font-['Raleway'] text-slate-600 font-semibold rotate-90 lowercase">bizz</span>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* TINTED GLASS SLIDING DOORS (THE OUTSIDE CORPORATE PROFILE)                */}
      {/* ========================================================================= */}
      {/* FLOATING TOP NAVIGATION (ABOUT BIZZBEAN & MEMBER SIGN IN)                */}
      {/* ========================================================================= */}
      <div className={`fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 py-3 sm:py-5 flex items-center justify-between pointer-events-none transition-opacity duration-500 ${
        doorsOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        {/* Left: About Bizzbean Ghost Link */}
        <button
          type="button"
          onClick={onOpenAboutModal}
          className="pointer-events-auto px-3.5 sm:px-4 py-2 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 text-xs sm:text-[13px] font-medium border border-[#D8CEBC]/80 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 cursor-pointer font-['Raleway'] lowercase select-none"
          title="Learn about Bizzbean's Mission & Manifesto"
        >
          <span className="text-[#5584B4] font-bold">✦</span>
          <span>about bizzbean</span>
        </button>

        {/* Right: Member Sign In Ghost Button */}
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem('bizz_auth_register_mode');
            } catch (e) {}
            setAuthMode('signin');
          }}
          className="pointer-events-auto px-3.5 sm:px-4 py-2 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 text-xs sm:text-[13px] font-medium border border-[#D8CEBC]/80 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 cursor-pointer font-['Raleway'] lowercase select-none"
          title="Sign in to your verified member account"
        >
          <KeyRound className="w-3.5 h-3.5 text-slate-500" />
          <span>member sign in</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* UNIFIED MAGNETIC PRIMARY CALL-TO-ACTION (ACROSS CENTER SEAM)             */}
      {/* ========================================================================= */}
      <div
        className={`absolute top-[calc(50%-10px)] left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center pointer-events-auto transition-all duration-700 ease-out px-4 w-full max-w-md ${
          doorsOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
        }`}
      >
        <button
          type="button"
          onClick={() => handleTriggerEnter(false)}
          className="group relative w-full sm:w-auto px-6 sm:px-9 py-3.5 sm:py-4 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white shadow-2xl hover:shadow-[0_20px_45px_rgba(18,23,42,0.35)] border border-[#C59B63]/50 hover:border-[#C59B63] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
          title="Explore Bizz-Desk Sandbox (No Account Required)"
        >
          {/* Ambient glow behind CTA */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-md" />

          {/* Live pulsing indicator dot */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>

          {/* Primary CTA Label */}
          <span className="font-['Raleway'] font-bold text-xs sm:text-sm md:text-base tracking-wider uppercase text-white drop-shadow-xs">
            explore bizz-desk sandbox
          </span>

          {/* Animated forward arrow */}
          <ArrowRight className="w-4 h-4 text-[#C59B63] group-hover:translate-x-1 transition-transform duration-200 shrink-0" />
        </button>

        {/* Friction-reducing microcopy */}
        <div className="mt-2.5 sm:mt-3 flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-sm border border-[#D8CEBC]/70 shadow-2xs text-[11px] sm:text-xs text-slate-600 font-mono select-none text-center">
          <span className="text-emerald-600 font-bold">✓</span>
          <span className="font-medium text-slate-800">no account required</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">instant sandbox preview</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TINTED GLASS SLIDING DOORS (THE OUTSIDE CORPORATE PROFILE)                */}
      {/* ========================================================================= */}
      
      {/* LEFT GLASS SLIDING DOOR (0% to 50% width) */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1/2 z-30 transition-transform duration-[2200ms] ease-in-out border-r border-[#D8CEBC]/70 backdrop-blur-[5px] bg-[#FAF8F5]/90 shadow-2xl ${
          doorsOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
        style={{
          boxShadow: 'inset -2px 0 24px rgba(85,132,180,0.04)',
        }}
      >
        {/* TOP: Left half of logo stitched against center seam - Stacked version with favicon above bizz */}
        <div className="absolute right-0 bottom-[calc(50%+115px)] sm:bottom-[calc(50%+145px)] md:bottom-[calc(50%+180px)] flex flex-col items-end pr-0 select-none pointer-events-none">
          {/* Favicon - Left Half */}
          <div className="w-5 sm:w-7 md:w-8 lg:w-9 h-10 sm:h-14 md:h-16 lg:h-18 overflow-hidden flex justify-start">
            <img
              src="/bizzbean-favicon.jpg"
              alt="bizzbean favicon"
              className="h-10 sm:h-14 md:h-16 lg:h-18 w-10 sm:w-14 md:w-16 lg:w-18 max-w-none object-contain mix-blend-multiply drop-shadow-xs select-none pointer-events-none"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedFavicon) {
                  target.dataset.triedFavicon = 'true';
                  target.src = '/favicon.jpg';
                } else if (!target.dataset.triedPng) {
                  target.dataset.triedPng = 'true';
                  target.src = '/bizzbean-favicon.png';
                } else if (!target.dataset.triedSvg) {
                  target.dataset.triedSvg = 'true';
                  target.src = '/bizzbean-favicon.svg';
                }
              }}
            />
          </div>
          {/* Wordmark: bizz */}
          <div className="flex items-baseline mt-1">
            <span
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-[#707070] tracking-tight leading-none select-none font-['Raleway']"
              style={{ fontWeight: 300 }}
            >
              bizz
            </span>
          </div>
          {/* Subtitle: the illuminated */}
          <span className="text-[8px] sm:text-[10px] md:text-[11px] font-mono tracking-widest text-slate-400 uppercase mt-1">
            the illuminated&nbsp;
          </span>
        </div>

        {/* Sliding Door Sleek Vertical Metal Handle on right edge - positioned below CTA */}
        <div className="absolute top-[calc(50%+65px)] sm:top-[calc(50%+75px)] right-1.5 sm:right-2.5 w-1.5 sm:w-2 h-20 sm:h-24 rounded-full bg-gradient-to-b from-[#C4B7A3] via-[#FAF8F5] to-[#C4B7A3] shadow-xs border border-[#D8CEBC]/60" />
      </div>

      {/* RIGHT GLASS SLIDING DOOR (50% to 100% width) */}
      <div
        className={`absolute top-0 bottom-0 right-0 w-1/2 z-30 transition-transform duration-[2200ms] ease-in-out border-l border-[#D8CEBC]/70 backdrop-blur-[5px] bg-[#FAF8F5]/90 shadow-2xl ${
          doorsOpen ? 'translate-x-full' : 'translate-x-0'
        }`}
        style={{
          boxShadow: 'inset 2px 0 24px rgba(85,132,180,0.04)',
        }}
      >
        {/* TOP: Right half of logo stitched against center seam - Stacked version with favicon above bean */}
        <div className="absolute left-0 bottom-[calc(50%+115px)] sm:bottom-[calc(50%+145px)] md:bottom-[calc(50%+180px)] flex flex-col items-start pl-0 select-none pointer-events-none">
          {/* Favicon - Right Half */}
          <div className="w-5 sm:w-7 md:w-8 lg:w-9 h-10 sm:h-14 md:h-16 lg:h-18 overflow-hidden flex justify-start">
            <img
              src="/bizzbean-favicon.jpg"
              alt="bizzbean favicon"
              className="h-10 sm:h-14 md:h-16 lg:h-18 w-10 sm:w-14 md:w-16 lg:w-18 max-w-none object-contain mix-blend-multiply drop-shadow-xs select-none pointer-events-none -ml-5 sm:-ml-7 md:-ml-8 lg:-ml-9"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedFavicon) {
                  target.dataset.triedFavicon = 'true';
                  target.src = '/favicon.jpg';
                } else if (!target.dataset.triedPng) {
                  target.dataset.triedPng = 'true';
                  target.src = '/bizzbean-favicon.png';
                } else if (!target.dataset.triedSvg) {
                  target.dataset.triedSvg = 'true';
                  target.src = '/bizzbean-favicon.svg';
                }
              }}
            />
          </div>
          {/* Wordmark: bean™ */}
          <div className="flex items-baseline mt-1">
            <span
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-[#707070] tracking-tight leading-none select-none font-['Raleway'] inline-flex items-baseline"
              style={{ fontWeight: 100 }}
            >
              bean
              <sup className="text-[10px] sm:text-xs md:text-sm font-normal text-[#707070] ml-0.5 -top-2.5 sm:-top-4 md:-top-5 font-['Raleway']">
                TM
              </sup>
            </span>
          </div>
          {/* Subtitle: sandbox */}
          <span className="text-[8px] sm:text-[10px] md:text-[11px] font-mono tracking-widest text-slate-400 uppercase mt-1">
            sandbox
          </span>
        </div>

        {/* Sliding Door Sleek Vertical Metal Handle on left edge - positioned below CTA */}
        <div className="absolute top-[calc(50%+65px)] sm:top-[calc(50%+75px)] left-1.5 sm:left-2.5 w-1.5 sm:w-2 h-20 sm:h-24 rounded-full bg-gradient-to-b from-[#C4B7A3] via-[#FAF8F5] to-[#C4B7A3] shadow-xs border border-[#D8CEBC]/60" />
      </div>

      {/* ========================================================================= */}
      {/* AUTHENTICATION OVERLAY (SIGN IN & SIGN UP VIA V1 FIREBASE AUTHGATEWAY)     */}
      {/* ========================================================================= */}
      {authMode !== 'none' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <AuthGateway
            onAuthenticated={(_destination, profile) => {
              const resolvedName = resolveDisplayName(profile?.email, profile?.name || profile?.displayName);
              if (onConfirmSignUp && profile) {
                onConfirmSignUp(
                  resolvedName,
                  profile.email || '',
                  profile.companyName || ''
                );
              }
              handleTriggerEnter(true, profile?.email, resolvedName);
            }}
            onClose={() => setAuthMode('none')}
          />
        </div>
      )}

    </div>
  );
};
