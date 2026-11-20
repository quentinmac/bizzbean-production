import React from 'react';
import { ArrowRight, Briefcase, Layers } from 'lucide-react';
import { CmsProduct, CmsPromotionSection } from '../data/cmsConsoleData';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';

interface StageJourneyGalleryProps {
  cmsPromotions: CmsPromotionSection[];
  cmsProducts: CmsProduct[];
  isMember: boolean;
  userName?: string;
  userPurchases?: string[];
  theme: 'light' | 'dark';
  onSelectStage: (stageId: string) => void;
  onEnterWorkstation: () => void;
}

interface StageCardDefinition {
  id: 'vi-ability' | 'fund-ability' | 'sustain-ability' | 'invest-ability';
  stepNumber: string;
  verb: string;
  title: string;
  question: string;
  accentBarClass: string;
}

const CORE_STAGES: StageCardDefinition[] = [
  {
    id: 'vi-ability',
    stepNumber: '01',
    verb: 'Discover',
    title: 'vi-ABILITY',
    question: 'Will your business idea actually make money and reach break-even?',
    accentBarClass: 'bg-[#5584B4]',
  },
  {
    id: 'fund-ability',
    stepNumber: '02',
    verb: 'Build',
    title: 'fund-ABILITY',
    question: 'Do your pricing, BOM, and 3-statement projections pass lender scrutiny?',
    accentBarClass: 'bg-[#9FC754]',
  },
  {
    id: 'sustain-ability',
    stepNumber: '03',
    verb: 'Grow',
    title: 'sustain-ABILITY',
    question: 'How do you eliminate margin leaks and protect your operating cash runway?',
    accentBarClass: 'bg-[#C59B63]',
  },
  {
    id: 'invest-ability',
    stepNumber: '04',
    verb: 'Invest',
    title: 'invest-ABILITY',
    question: 'Is your venture structured to scale and withstand investor due diligence?',
    accentBarClass: 'bg-[#2E5E88]',
  },
];

const isValidStageImage = (url?: string | null): url is string =>
  Boolean(url && url.trim() !== '' && !url.includes('1553877522-43269d4ea984'));

export const StageJourneyGallery: React.FC<StageJourneyGalleryProps> = ({
  cmsPromotions,
  cmsProducts,
  isMember,
  userName,
  userPurchases = [],
  theme,
  onSelectStage,
  onEnterWorkstation,
}) => {
  const isDark = theme === 'dark';

  const getPromoForStage = (stageId: string): CmsPromotionSection | undefined =>
    cmsPromotions.find(
      (p) => p && (p.id === stageId || p.targetId === stageId || p.name?.toLowerCase() === stageId)
    );

  const getSolutionCountForStage = (stageId: string): number => {
    if (!Array.isArray(cmsProducts)) return 0;
    return cmsProducts.filter((p) => p && p.stage === stageId).length;
  };

  const sandboxPromo = getPromoForStage('personal-sandbox');
  const firstName = (userName || '').trim().split(' ')[0];

  return (
    <section
      aria-label="BizzBean Venture Stage Journey"
      className="@container w-full max-w-6xl mx-auto animate-fade-in select-none space-y-5 sm:space-y-6 py-1 sm:py-2"
    >
      {/* 1. EDITORIAL HEADER + RETURNING MEMBER FAST LANE */}
      <div
        className={`flex flex-col @2xl:flex-row @2xl:items-end justify-between gap-4 pb-4 border-b ${
          isDark ? 'border-[#222F4C]' : 'border-[#E5DEC9]'
        }`}
      >
        <div className="space-y-1 max-w-2xl">
          <div className="text-[11px] font-mono text-[#5584B4] dark:text-[#7EB2E2] tracking-wide">
            The Illuminated Sandbox · Venture Roadmap
          </div>
          <h1
            className="text-2xl sm:text-3xl font-['Raleway'] font-light tracking-tight text-slate-900 dark:text-white"
            style={{ textWrap: 'balance' }}
          >
            Where is your <span className="font-semibold">bizz-ABILITY</span>?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {isMember && firstName
              ? `Welcome back, ${firstName}. Select any stage to explore solutions, or jump straight into your workstation.`
              : 'Select a stage below to explore its financial calculators, models, and courses — or open the full workstation.'}
          </p>
        </div>

        {/* Fast-Track Action for Existing Members & Direct Workers */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isMember && userPurchases.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectStage('personal-sandbox')}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-mono font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#141A2E] hover:bg-[#1E2745] border-[#2B3759] text-slate-200'
                  : 'bg-white hover:bg-[#F4EFE6] border-[#D8CEBC] text-slate-800'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-[#9FC754]" />
              <span>my sandbox ({userPurchases.length})</span>
            </button>
          )}
          <button
            type="button"
            onClick={onEnterWorkstation}
            className="px-4 py-2.5 rounded-xl bg-[#12172A] hover:bg-[#1E2548] dark:bg-[#2E5E88] dark:hover:bg-[#3A6F9E] text-white text-xs font-mono font-bold whitespace-nowrap shrink-0 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Briefcase className="h-3.5 w-3.5 text-[#9FC754]" />
            <span>{isMember ? 'go to work · workstation' : 'open workstation'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. FOUR-STAGE CHRONOLOGICAL JOURNEY GRID (Container-aware: 1-col mobile, 2x2 tablet/3-panel, 4-col wide) */}
      <div className="grid grid-cols-1 @md:grid-cols-2 @4xl:grid-cols-4 gap-4">
        {CORE_STAGES.map((stage) => {
          const promo = getPromoForStage(stage.id);
          const count = getSolutionCountForStage(stage.id);
          const hasImage = isValidStageImage(promo?.imageUrl);

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onSelectStage(stage.id)}
              className={`group text-left rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5584B4] ${
                isDark
                  ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4] shadow-xs'
                  : 'bg-white border-[#D8CEBC] hover:border-[#5584B4] shadow-xs hover:shadow-md'
              }`}
            >
              {/* Subtle top stage hairline */}
              <div className={`h-[3px] w-full ${stage.accentBarClass}`} />

              {/* Compact Stage Image Frame (16:10) */}
              <div
                className={`relative w-full aspect-[16/10] overflow-hidden border-b ${
                  isDark ? 'bg-[#0C101E] border-[#222F4C]' : 'bg-[#F4EFE6] border-[#EFEAE0]'
                }`}
              >
                {hasImage ? (
                  <img
                    src={promo!.imageUrl!}
                    alt={`${stage.title} — ${stage.verb}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover block group-hover:scale-[1.03] transition-transform duration-300 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                    <BizzbeanLogoIcon className="w-9 h-9 opacity-85" />
                    <span className="text-[11px] font-mono text-slate-400">{stage.title}</span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex flex-col flex-1 justify-between gap-3.5">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono text-[#5584B4] dark:text-[#7EB2E2] tracking-wide">
                    {stage.stepNumber} · {stage.verb}
                  </div>
                  <h2 className="text-lg font-['Raleway'] font-semibold text-slate-900 dark:text-white tracking-tight leading-snug">
                    {stage.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {stage.question}
                  </p>
                </div>

                {/* Quiet Footer Metadata & Action */}
                <div
                  className={`pt-2.5 border-t flex items-center justify-between text-[11px] font-mono ${
                    isDark ? 'border-[#222F4C]' : 'border-[#EFEAE0]'
                  }`}
                >
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    {count > 0 ? `${count} ${count === 1 ? 'solution' : 'solutions'}` : 'stage roadmap'}
                  </span>
                  <span className="text-[#2E5E88] dark:text-[#7EB2E2] font-bold flex items-center gap-1 group-hover:underline">
                    <span>explore</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. FIFTH STAGE: PERSONAL SANDBOX FULL-WIDTH HORIZONTAL BAND */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectStage('personal-sandbox')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectStage('personal-sandbox');
          }
        }}
        className={`group rounded-2xl border overflow-hidden flex flex-col @xl:flex-row items-stretch transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5584B4] ${
          isDark
            ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#9FC754]/70 shadow-xs'
            : 'bg-white border-[#D8CEBC] hover:border-[#5584B4] shadow-xs hover:shadow-md'
        }`}
      >
        {/* Left Compact Stage Photograph */}
        <div
          className={`relative w-full @xl:w-56 @3xl:w-72 shrink-0 aspect-[16/9] @xl:aspect-auto @xl:min-h-[124px] overflow-hidden border-b @xl:border-b-0 @xl:border-r ${
            isDark ? 'bg-[#0C101E] border-[#222F4C]' : 'bg-[#F4EFE6] border-[#EFEAE0]'
          }`}
        >
          {isValidStageImage(sandboxPromo?.imageUrl) ? (
            <img
              src={sandboxPromo!.imageUrl!}
              alt="personal SANDBOX workbench"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover block group-hover:scale-[1.03] transition-transform duration-300 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-5">
              <BizzbeanLogoIcon className="w-10 h-10 opacity-90" />
            </div>
          )}
        </div>

        {/* Center Editorial Copy */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center gap-1 min-w-0">
          <div className="text-[11px] font-mono text-[#6F9632] dark:text-[#9FC754] tracking-wide">
            05 · Your Private Workbench
          </div>
          <h2 className="text-lg sm:text-xl font-['Raleway'] font-semibold text-slate-900 dark:text-white tracking-tight">
            personal SANDBOX
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            Assemble your calculators, 3-statement models, and business courses in one calm space — ready to pick up where you left off.
          </p>
        </div>

        {/* Right Primary Action */}
        <div className="px-4 sm:px-5 pb-4 @xl:py-5 flex items-center @xl:justify-end shrink-0">
          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5584B4] group-hover:bg-[#4372A2] text-white text-xs font-mono font-bold whitespace-nowrap transition-colors shadow-2xs">
            <span>open personal sandbox</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#E5F2C9] group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>

      {/* 4. QUIET ARCHITECTURAL CREED LINE */}
      <p className="text-center text-xs font-['Raleway'] text-slate-500 dark:text-slate-400 tracking-wide pt-1">
        every business has a journey · every journey has a roadmap · a wise entrepreneur invests in their journey
      </p>
    </section>
  );
};

export default StageJourneyGallery;
