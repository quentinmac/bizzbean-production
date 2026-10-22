import React, { useState, useEffect } from 'react';
import { ArrowRight, Clock, KeyRound, UserCheck, X } from 'lucide-react';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';
import { CmsPromotionSection } from '../data/cmsConsoleData';
import AuthGateway from './AuthGateway';

interface SplashOfficeDoorsProps {
  onEnterWorkspace: (isMember: boolean, userEmail?: string, chosenPromotion?: CmsPromotionSection | null) => void;
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
        const stored = localStorage.getItem('bizzdesk_cms_promotions_v1');
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
        !p.imageUrl.includes('1553877522-43269d4ea984') &&
        !p.imageUrl.includes('images.unsplash.com')
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

  const handleTriggerEnter = (asMember: boolean, customEmail?: string) => {
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
      onEnterWorkspace(asMember, customEmail || (asMember ? emailInput : undefined), chosen);
    }, 2200);
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    handleTriggerEnter(true, emailInput.trim());
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    if (onConfirmSignUp) {
      onConfirmSignUp(
        fullNameInput.trim() || 'Venture Founder',
        emailInput.trim(),
        companyInput.trim() || 'My Venture'
      );
    }
    handleTriggerEnter(true, emailInput.trim());
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
      
      {/* LEFT GLASS SLIDING DOOR (0% to 50% width) */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1/2 z-30 transition-transform duration-[2200ms] ease-in-out border-r border-[#D8CEBC]/70 backdrop-blur-[5px] bg-[#FAF8F5]/90 shadow-2xl flex flex-col justify-between py-6 sm:py-10 md:py-12 ${
          doorsOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
        style={{
          boxShadow: 'inset -2px 0 24px rgba(85,132,180,0.04)',
        }}
      >
        {/* TOP: Left half of logo stitched against center seam */}
        <div className="flex flex-col items-end w-full pr-0">
          {/* Logo Left: [bizzbean favicon.jpg] + "bizz" in Raleway Light (300) flush to right edge */}
          <div className="flex justify-end items-center w-full">
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <img
                src="/bizzbean-favicon.jpg"
                alt="bizzbean favicon"
                className="h-8 w-8 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 object-contain mix-blend-multiply drop-shadow-xs select-none pointer-events-none"
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
              <span
                className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-[#707070] tracking-tight leading-none select-none font-['Raleway']"
                style={{ fontWeight: 300 }}
              >
                bizz
              </span>
            </div>
          </div>
        </div>

        {/* MIDDLE: "explore bizz-desk" button kept strictly within laptop dark outline, equal size & centered */}
        <div className="flex items-center justify-end w-full pr-3 sm:pr-4 md:pr-6 relative">
          <button
            type="button"
            onClick={() => handleTriggerEnter(false)}
            className="w-[124px] sm:w-[155px] md:w-[180px] py-2 sm:py-2.5 rounded-lg bg-white/95 hover:bg-white text-slate-800 text-[11px] sm:text-xs md:text-sm font-normal border border-[#D8CEBC] shadow-xs hover:shadow-sm transition-all flex items-center justify-center text-center lowercase font-['Raleway']"
            title="Explore Bizz-Desk"
          >
            <span className="text-slate-800 hover:text-slate-950 truncate">explore bizz-desk</span>
          </button>
        </div>

        {/* BOTTOM: "sign in" button on left door */}
        <div className="flex items-center justify-end w-full pr-4 sm:pr-8 md:pr-12">
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem('bizz_auth_register_mode');
              } catch (e) {}
              setAuthMode('signin');
            }}
            className="w-24 sm:w-32 md:w-36 py-2 sm:py-2.5 md:py-3 rounded-lg bg-white/95 hover:bg-white text-slate-800 text-xs sm:text-sm font-normal border border-[#D8CEBC] shadow-2xs hover:shadow-xs transition-all text-center lowercase font-['Raleway'] cursor-pointer"
          >
            sign in
          </button>
        </div>

        {/* Sliding Door Sleek Vertical Metal Handle on right edge */}
        <div className="absolute top-1/2 -translate-y-1/2 right-1.5 sm:right-2.5 w-1.5 sm:w-2 h-20 sm:h-28 rounded-full bg-gradient-to-b from-[#C4B7A3] via-[#FAF8F5] to-[#C4B7A3] shadow-xs border border-[#D8CEBC]/60" />
      </div>

      {/* RIGHT GLASS SLIDING DOOR (50% to 100% width) */}
      <div
        className={`absolute top-0 bottom-0 right-0 w-1/2 z-30 transition-transform duration-[2200ms] ease-in-out border-l border-[#D8CEBC]/70 backdrop-blur-[5px] bg-[#FAF8F5]/90 shadow-2xl flex flex-col justify-between py-6 sm:py-10 md:py-12 ${
          doorsOpen ? 'translate-x-full' : 'translate-x-0'
        }`}
        style={{
          boxShadow: 'inset 2px 0 24px rgba(85,132,180,0.04)',
        }}
      >
        {/* TOP: Right half of logo stitched against center seam */}
        <div className="flex flex-col items-start w-full pl-0">
          {/* Logo Right: "bean" in Raleway Thin (100) with NO full stop after bean */}
          <div className="flex justify-start items-center w-full">
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
        </div>

        {/* MIDDLE: "about bizzbean" button adjacent to explore bizz-desk, kept strictly within laptop dark outline, equal size & centered */}
        <div className="flex items-center justify-start w-full pl-3 sm:pl-4 md:pl-6 relative">
          <button
            type="button"
            onClick={onOpenAboutModal}
            className="w-[124px] sm:w-[155px] md:w-[180px] py-2 sm:py-2.5 rounded-lg bg-white/95 hover:bg-white text-slate-800 text-[11px] sm:text-xs md:text-sm font-normal border border-[#D8CEBC] shadow-xs hover:shadow-sm transition-all flex items-center justify-center text-center lowercase font-['Raleway']"
            title="About Bizzbean"
          >
            <span className="text-slate-800 hover:text-slate-950 truncate">about bizzbean</span>
          </button>
        </div>

        {/* BOTTOM: "sign up" button on right door */}
        <div className="flex items-center justify-start w-full pl-4 sm:pl-8 md:pl-12">
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem('bizz_auth_register_mode', 'true');
              } catch (e) {}
              setAuthMode('signup');
            }}
            className="w-24 sm:w-32 md:w-36 py-2 sm:py-2.5 md:py-3 rounded-lg bg-[#12172A] hover:bg-[#1E2548] text-white text-xs sm:text-sm font-normal shadow-2xs hover:shadow-xs transition-all text-center lowercase border border-[#2B3452] font-['Raleway'] cursor-pointer"
          >
            sign up
          </button>
        </div>

        {/* Sliding Door Sleek Vertical Metal Handle on left edge */}
        <div className="absolute top-1/2 -translate-y-1/2 left-1.5 sm:left-2.5 w-1.5 sm:w-2 h-20 sm:h-28 rounded-full bg-gradient-to-b from-[#C4B7A3] via-[#FAF8F5] to-[#C4B7A3] shadow-xs border border-[#D8CEBC]/60" />
      </div>

      {/* ========================================================================= */}
      {/* AUTHENTICATION OVERLAY (SIGN IN & SIGN UP VIA V1 FIREBASE AUTHGATEWAY)     */}
      {/* ========================================================================= */}
      {authMode !== 'none' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <AuthGateway
            onAuthenticated={(_destination, profile) => {
              if (onConfirmSignUp && profile) {
                onConfirmSignUp(
                  profile.name || profile.displayName || 'Entrepreneur',
                  profile.email || '',
                  profile.companyName || 'Apex Cloud Dynamics'
                );
              }
              handleTriggerEnter(true, profile?.email);
            }}
            onClose={() => setAuthMode('none')}
          />
        </div>
      )}

    </div>
  );
};
