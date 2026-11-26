import React, { useState } from 'react';
import { ArrowRight, BookOpen, Calculator, Check, Layers, Play, PlayCircle, X } from 'lucide-react';
import { CmsArticle, CmsProduct, CmsVideo } from '../../data/cmsConsoleData';
import { slugifyArticleTitle } from '../../shared/seoRoutes';
import {
  PUBLIC_SITE_IMAGES,
  PUBLIC_STAGES,
  PUBLIC_SOLUTION_PROFILES,
  PublicSolutionProfile,
  resolvePublicTicketPrice,
} from './publicSiteData';

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

interface PublicHomePageProps {
  cmsProducts: CmsProduct[];
  cmsArticles: CmsArticle[];
  cmsVideos: CmsVideo[];
  isMember: boolean;
  onNavigate: (path: string) => void;
  onOpenDesk: (target?: { stageId?: string; solutionId?: string; launch?: boolean }) => void;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
  onDownloadBook: () => void;
}

export const PublicHomePage: React.FC<PublicHomePageProps> = ({
  cmsProducts,
  cmsArticles,
  cmsVideos,
  isMember,
  onNavigate,
  onOpenDesk,
  onOpenSignIn,
  onOpenSignUp,
  onDownloadBook,
}) => {
  const [playingVideo, setPlayingVideo] = useState<CmsVideo | null>(null);
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  const resolvePriceLabel = (profile: PublicSolutionProfile) => {
    return resolvePublicTicketPrice(profile, cmsProducts).label;
  };

  const coreStages = PUBLIC_STAGES.filter((s) => s.isCoreStage);
  const flagshipApps = PUBLIC_SOLUTION_PROFILES.filter((p) => p.kind === 'software');
  const leadApps = flagshipApps.slice(0, 2); // bizzmodel + bizzoptimizer
  const secondaryApps = flagshipApps.slice(2); // bizzcalc, bizzcalculators, bizzdynamics

  const featuredArticles = (cmsArticles || []).slice(0, 4);

  return (
    <div className="w-full">
      {/* ================================================================= */}
      {/* 1. HERO — CLEAR 5-SECOND PROPOSITION + FRAMED EDITORIAL VISUAL    */}
      {/* ================================================================= */}
      <section className="border-b border-[#E6DFD2] dark:border-[#222B45] bg-[#FAF8F5] dark:bg-[#0A0D14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373]">
                Financial Modelling · Pricing Calculators · Practical Courses
              </p>

              <h1
                className="text-4xl sm:text-5xl lg:text-[3.35rem] font-bold tracking-tight text-[#12172A] dark:text-white leading-[1.08]"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Practical financial modelling for founders and operating businesses.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Test startup viability, build lender-ready 5-year 3-statement financial models,
                calculate Bill of Materials product margins, and manage profit improvement inside
                one unified workstation — <strong className="font-semibold text-slate-900 dark:text-white">bizz-DESK</strong>.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenDesk()}
                  className="px-6 py-3 rounded-lg bg-[#2E5E88] hover:bg-[#234C70] text-white text-sm sm:text-base font-semibold tracking-tight transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Open bizz-DESK</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <a
                  href="/solutions"
                  onClick={(e) => handleLinkClick(e, '/solutions')}
                  className="px-6 py-3 rounded-lg border border-[#D4C9B6] dark:border-[#2B3654] bg-white dark:bg-[#111626] hover:bg-[#F4EFE6] dark:hover:bg-[#182036] text-slate-900 dark:text-white text-sm sm:text-base font-semibold transition-colors"
                >
                  Explore Solutions
                </a>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                {!isMember ? (
                  <>
                    <button
                      type="button"
                      onClick={onOpenSignUp}
                      className="text-[#2E5E88] dark:text-[#7EB2E2] font-medium hover:underline cursor-pointer"
                    >
                      Create a free account
                    </button>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={onOpenSignIn}
                      className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      Member sign in
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenDesk()}
                    className="text-[#2E5E88] dark:text-[#7EB2E2] font-medium hover:underline cursor-pointer"
                  >
                    Return to your signed-in workstation
                  </button>
                )}
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={onDownloadBook}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Download free book: Getting to Value
                </button>
              </div>
            </div>

            {/* Hero Editorial Visual */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-[#E0D7C8] dark:border-[#242E49] bg-white dark:bg-[#111626] shadow-xl">
                <img
                  src={PUBLIC_SITE_IMAGES.heroDesk}
                  alt="bizzbean financial modelling workstation showing 3-statement charts and cash flow projections"
                  className="w-full aspect-[16/10] object-cover"
                />
                <div className="px-5 py-4 border-t border-[#EDE7DC] dark:border-[#222B45] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                  <span>INCOME STATEMENT · BALANCE SHEET · 60-MONTH CASH FLOW</span>
                  <button
                    type="button"
                    onClick={() => onOpenDesk({ stageId: 'fund-ability', solutionId: 'bizzmodel' })}
                    className="text-[#2E5E88] dark:text-[#7EB2E2] font-semibold hover:underline cursor-pointer"
                  >
                    Preview inside bizz-DESK →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. THE 4 STAGES — EXACT USER-APPROVED WORDING                     */}
      {/* ================================================================= */}
      <section className="py-16 lg:py-24 border-b border-[#E6DFD2] dark:border-[#222B45] bg-white dark:bg-[#0D111C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373] mb-3">
              Where Are You Today?
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight text-[#12172A] dark:text-white"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Four practical stages from first idea to investor readiness.
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Choose the stage that matches your current business goal. Each stage pairs focused
              financial software with plain-English courses so you know what the numbers mean.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coreStages.map((stage) => (
              <a
                key={stage.id}
                href={stage.path}
                onClick={(e) => handleLinkClick(e, stage.path)}
                className="group rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-[#FAF8F5] dark:bg-[#111626] p-7 hover:border-[#2E5E88] dark:hover:border-[#7EB2E2] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-baseline justify-between gap-4 mb-4">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373]">
                      Stage {stage.number}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#2E5E88] dark:group-hover:text-[#7EB2E2] group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <h3
                    className="text-2xl font-bold text-[#12172A] dark:text-white tracking-tight mb-2"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {stage.label}
                  </h3>

                  <p className="text-base font-medium text-[#2E5E88] dark:text-[#7EB2E2] mb-3">
                    {stage.statement}
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {stage.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E8E0D3] dark:border-[#1E263D] flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span>{stage.featuredSolutionIds.length} tools & courses</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#2E5E88] dark:group-hover:text-[#7EB2E2]">
                    Explore {stage.label} →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. FLAGSHIP SOFTWARE — ASYMMETRIC SHOWCASE                        */}
      {/* ================================================================= */}
      <section className="py-16 lg:py-24 border-b border-[#E6DFD2] dark:border-[#222B45] bg-[#FAF8F5] dark:bg-[#0A0D14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373] mb-3">
                Flagship Software Suite
              </p>
              <h2
                className="text-3xl sm:text-4xl font-bold tracking-tight text-[#12172A] dark:text-white"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Built to replace fragile spreadsheets with linked accounting logic.
              </h2>
            </div>

            <a
              href="/solutions"
              onClick={(e) => handleLinkClick(e, '/solutions')}
              className="text-sm font-semibold text-[#2E5E88] dark:text-[#7EB2E2] hover:underline inline-flex items-center gap-1.5 shrink-0"
            >
              <span>View full software & course catalogue</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Primary Featured Pair (bizzmodel & bizzoptimizer) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            <div className="lg:col-span-7 rounded-2xl border border-[#E0D7C8] dark:border-[#242E49] bg-white dark:bg-[#111626] overflow-hidden flex flex-col">
              <div className="aspect-[16/9] overflow-hidden border-b border-[#EDE7DC] dark:border-[#222B45]">
                <img
                  src={PUBLIC_SITE_IMAGES.modelingSuite}
                  alt="bizzmodel 3-statement financial modelling blueprints and balance sheet reports"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-7 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {leadApps[0].stageLabel} · {resolvePriceLabel(leadApps[0])}
                  </p>
                  <h3
                    className="text-2xl font-bold text-[#12172A] dark:text-white mt-2"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {leadApps[0].name} — {leadApps[0].tagline}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                    {leadApps[0].heroSummary}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-[#EDE7DC] dark:border-[#222B45] flex flex-wrap items-center gap-4">
                  <a
                    href={leadApps[0].path}
                    onClick={(e) => handleLinkClick(e, leadApps[0].path)}
                    className="px-4 py-2 rounded-lg bg-[#12172A] dark:bg-white text-white dark:text-slate-950 text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Learn more
                  </a>
                  <button
                    type="button"
                    onClick={() => onOpenDesk({ stageId: leadApps[0].stageId, solutionId: leadApps[0].id })}
                    className="text-sm font-semibold text-[#2E5E88] dark:text-[#7EB2E2] hover:underline cursor-pointer"
                  >
                    Open in bizz-DESK →
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-[#E0D7C8] dark:border-[#242E49] bg-[#12172A] text-white p-7 flex flex-col justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-[#D4A373]">
                  {leadApps[1].stageLabel} · {resolvePriceLabel(leadApps[1])}
                </p>
                <h3
                  className="text-2xl font-bold text-white mt-2"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {leadApps[1].name}
                </h3>
                <p className="text-sm text-slate-300 font-medium mt-1">
                  {leadApps[1].tagline}
                </p>
                <p className="text-sm text-slate-300/90 mt-4 leading-relaxed">
                  {leadApps[1].heroSummary}
                </p>

                <ul className="mt-6 space-y-2.5 text-sm text-slate-200">
                  {leadApps[1].deliverables.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#C59B63] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-5 border-t border-white/15 flex flex-wrap items-center gap-4">
                <a
                  href={leadApps[1].path}
                  onClick={(e) => handleLinkClick(e, leadApps[1].path)}
                  className="px-4 py-2 rounded-lg bg-white text-[#12172A] text-sm font-semibold hover:bg-[#FAF8F5] transition-colors"
                >
                  Explore bizzoptimizer
                </a>
                <button
                  type="button"
                  onClick={() => onOpenDesk({ stageId: leadApps[1].stageId, solutionId: leadApps[1].id })}
                  className="text-sm font-semibold text-[#90CDF4] hover:underline cursor-pointer"
                >
                  Open in bizz-DESK →
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {secondaryApps.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626] p-6 flex flex-col justify-between"
              >
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {app.stageLabel} · {resolvePriceLabel(app)}
                  </p>
                  <h3
                    className="text-xl font-bold text-[#12172A] dark:text-white mt-2"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {app.name}
                  </h3>
                  <p className="text-xs font-medium text-[#2E5E88] dark:text-[#7EB2E2] mt-1">
                    {app.tagline}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                    {app.heroSummary}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#EDE7DC] dark:border-[#222B45] flex items-center justify-between text-xs font-semibold">
                  <a
                    href={app.path}
                    onClick={(e) => handleLinkClick(e, app.path)}
                    className="text-slate-900 dark:text-white hover:text-[#2E5E88] dark:hover:text-[#7EB2E2]"
                  >
                    Details
                  </a>
                  <button
                    type="button"
                    onClick={() => onOpenDesk({ stageId: app.stageId, solutionId: app.id })}
                    className="text-[#2E5E88] dark:text-[#7EB2E2] hover:underline cursor-pointer"
                  >
                    Open tool →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. HOW bizz-DESK WORKS — MECHANISM + FOUNDER PERSPECTIVE          */}
      {/* ================================================================= */}
      <section className="py-16 lg:py-24 border-b border-[#E6DFD2] dark:border-[#222B45] bg-white dark:bg-[#0D111C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border border-[#E0D7C8] dark:border-[#242E49]">
                <img
                  src={PUBLIC_SITE_IMAGES.founderStrategy}
                  alt="Founders reviewing structured business plans and financial projections"
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373]">
                Why bizzbean Is Built Differently
              </p>

              <h2
                className="text-3xl sm:text-4xl font-bold tracking-tight text-[#12172A] dark:text-white"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Learn the mechanics, model your numbers, and run the business from one desk.
              </h2>

              <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Most business tools separate education from execution. Inside bizz-DESK, your
                financial calculators, 5-year modelling engines, guided courses, and reference
                library sit side-by-side—built from decades of hands-on operating management by
                founder Quentin G. McCullough.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                <div className="space-y-2">
                  <div className="h-9 w-9 rounded-lg bg-[#FAF8F5] dark:bg-[#161D30] border border-[#E6DFD2] dark:border-[#242E49] flex items-center justify-center text-[#2E5E88] dark:text-[#7EB2E2]">
                    <Calculator className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Double-Entry Integrity
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Every revenue driver, margin assumption, and payment term flows cleanly across
                    all three financial statements.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="h-9 w-9 rounded-lg bg-[#FAF8F5] dark:bg-[#161D30] border border-[#E6DFD2] dark:border-[#242E49] flex items-center justify-center text-[#2E5E88] dark:text-[#7EB2E2]">
                    <PlayCircle className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Plain-English Courses
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    BizzClass video lessons explain break-even, working capital, and RONOA without
                    academic jargon.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="h-9 w-9 rounded-lg bg-[#FAF8F5] dark:bg-[#161D30] border border-[#E6DFD2] dark:border-[#242E49] flex items-center justify-center text-[#2E5E88] dark:text-[#7EB2E2]">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Built for Real Decisions
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Compare scenarios before hiring staff, signing a lease, borrowing funds, or
                    discounting prices.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="/about"
                  onClick={(e) => handleLinkClick(e, '/about')}
                  className="text-sm font-semibold text-[#2E5E88] dark:text-[#7EB2E2] hover:underline inline-flex items-center gap-1.5"
                >
                  <span>Read the story behind bizzbean</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. ARTICLES, LIBRARY & VIDEOS PREVIEW                             */}
      {/* ================================================================= */}
      <section className="py-16 lg:py-24 border-b border-[#E6DFD2] dark:border-[#222B45] bg-[#FAF8F5] dark:bg-[#0A0D14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left 8 cols: Featured Articles & Videos */}
            <div className="lg:col-span-8">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373] mb-2">
                    Articles & Videos
                  </p>
                  <h2
                    className="text-3xl font-bold tracking-tight text-[#12172A] dark:text-white"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Practical thinking on finance and operations.
                  </h2>
                </div>
                <div className="flex items-center gap-4 text-sm font-semibold shrink-0">
                  <a
                    href="/articles"
                    onClick={(e) => handleLinkClick(e, '/articles')}
                    className="text-[#2E5E88] dark:text-[#7EB2E2] hover:underline"
                  >
                    All {cmsArticles.length || 20} articles →
                  </a>
                  <a
                    href="/videos"
                    onClick={(e) => handleLinkClick(e, '/videos')}
                    className="text-slate-700 dark:text-slate-300 hover:text-[#2E5E88] dark:hover:text-[#7EB2E2]"
                  >
                    All videos →
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {featuredArticles.map((art) => {
                  const slug = slugifyArticleTitle(art.title);
                  const articlePath = `/articles/${slug}`;
                  return (
                    <a
                      key={art.id}
                      href={articlePath}
                      onClick={(e) => handleLinkClick(e, articlePath)}
                      className="group rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626] p-6 hover:border-[#2E5E88] dark:hover:border-[#7EB2E2] transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {art.category || 'Strategy'} · {art.readTime || '4 min read'}
                        </p>
                        <h3 className="text-lg font-bold text-[#12172A] dark:text-white mt-2 capitalize group-hover:text-[#2E5E88] dark:group-hover:text-[#7EB2E2] transition-colors">
                          {art.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                          {art.summary}
                        </p>
                      </div>
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#2E5E88] dark:text-[#7EB2E2]">
                        Read article <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </a>
                  );
                })}
              </div>

              {/* Paired Featured Masterclass Videos */}
              {cmsVideos && cmsVideos.length > 0 && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {cmsVideos.slice(0, 2).map((vid) => {
                    const ytId = extractYouTubeId(vid.youtubeUrl);
                    const thumb = ytId
                      ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                      : PUBLIC_SITE_IMAGES.sandboxLibrary;
                    return (
                      <button
                        key={vid.id}
                        type="button"
                        onClick={() => setPlayingVideo(vid)}
                        className="group text-left rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626] overflow-hidden hover:border-[#2E5E88] dark:hover:border-[#7EB2E2] transition-colors flex items-center gap-4 p-3.5 cursor-pointer"
                      >
                        <div className="relative w-28 h-20 rounded-lg overflow-hidden bg-[#12172A] shrink-0">
                          <img
                            src={thumb}
                            alt={vid.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                            <span className="h-8 w-8 rounded-full bg-[#12172A]/85 text-white flex items-center justify-center">
                              <Play className="h-3.5 w-3.5 fill-white ml-0.5" />
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-mono uppercase tracking-wider text-[#9A7B4F] dark:text-[#D4A373]">
                            Video · {vid.duration || 'Masterclass'}
                          </p>
                          <h3 className="text-sm font-bold text-[#12172A] dark:text-white mt-1 capitalize line-clamp-2 group-hover:text-[#2E5E88] dark:group-hover:text-[#7EB2E2]">
                            {vid.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                            {vid.author}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right 4 cols: Sandbox Library & Free Book */}
            <div className="lg:col-span-4">
              <div className="h-full rounded-2xl border border-[#E0D7C8] dark:border-[#242E49] bg-white dark:bg-[#111626] overflow-hidden flex flex-col justify-between">
                <div>
                  <img
                    src={PUBLIC_SITE_IMAGES.sandboxLibrary}
                    alt="bizzbean Sandbox Library and Getting to Value reference guide"
                    className="w-full aspect-[16/10] object-cover border-b border-[#EDE7DC] dark:border-[#222B45]"
                  />
                  <div className="p-6 space-y-3">
                    <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373]">
                      Sandbox Library
                    </p>
                    <h3
                      className="text-xl font-bold text-[#12172A] dark:text-white"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Getting to Value & Curated Guides
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Download our free foundational book, explore financial modelling checklists,
                      and watch curated masterclass videos.
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2 space-y-2.5">
                  <button
                    type="button"
                    onClick={onDownloadBook}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#2E5E88] hover:bg-[#234C70] text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Download Getting to Value</span>
                  </button>
                  <div className="flex items-center justify-between pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <a
                      href="/library"
                      onClick={(e) => handleLinkClick(e, '/library')}
                      className="hover:text-[#2E5E88] dark:hover:text-[#7EB2E2]"
                    >
                      Browse Library →
                    </a>
                    <a
                      href="/videos"
                      onClick={(e) => handleLinkClick(e, '/videos')}
                      className="hover:text-[#2E5E88] dark:hover:text-[#7EB2E2]"
                    >
                      Watch Videos →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 6. CLOSING CONVERSION BAND                                        */}
      {/* ================================================================= */}
      <section className="py-16 lg:py-20 bg-[#12172A] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-xs font-mono uppercase tracking-widest text-[#D4A373]">
            Start in Minutes
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Ready to test your business numbers inside bizz-DESK?
          </h2>
          <p className="text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Step straight into the interactive workstation to explore the models and calculators, or
            create a free account to save your work and access our foundational capital readiness
            course.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => onOpenDesk()}
              className="px-6 py-3 rounded-lg bg-[#2E5E88] hover:bg-[#3A72A3] text-white text-sm sm:text-base font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Open bizz-DESK</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            {!isMember && (
              <button
                type="button"
                onClick={onOpenSignUp}
                className="px-6 py-3 rounded-lg bg-white text-[#12172A] hover:bg-[#FAF8F5] text-sm sm:text-base font-semibold transition-colors cursor-pointer"
              >
                Create Free Account
              </button>
            )}
            <a
              href="/contact"
              onClick={(e) => handleLinkClick(e, '/contact')}
              className="px-6 py-3 rounded-lg border border-white/25 text-white hover:bg-white/10 text-sm sm:text-base font-semibold transition-colors"
            >
              Talk to Our Team
            </a>
          </div>
        </div>
      </section>

      {/* Inline Homepage Video Modal */}
      {playingVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPlayingVideo(null)}
        >
          <div
            className="w-full max-w-4xl rounded-2xl overflow-hidden bg-[#101424] border border-[#252E4A] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-[#252E4A] flex items-center justify-between text-white">
              <div>
                <h3 className="text-sm font-bold capitalize">{playingVideo.title}</h3>
                <p className="text-xs text-slate-400">
                  {playingVideo.author} · {playingVideo.duration}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlayingVideo(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close video player"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              {extractYouTubeId(playingVideo.youtubeUrl) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(playingVideo.youtubeUrl)}?autoplay=1`}
                  title={playingVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm p-6">
                  Video preview unavailable for this link.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
