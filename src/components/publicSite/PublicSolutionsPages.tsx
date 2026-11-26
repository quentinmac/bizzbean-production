import React, { useState } from 'react';
import { ArrowRight, Check, ChevronRight, Play, Layers, GraduationCap } from 'lucide-react';
import { CmsProduct } from '../../data/cmsConsoleData';
import {
  PUBLIC_STAGES,
  PUBLIC_SOLUTION_PROFILES,
  PublicStageDefinition,
  getPublicStageById,
  getPublicSolutionById,
  resolvePublicTicketPrice,
  getSequencedPublicSolutions,
} from './publicSiteData';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const PublicBreadcrumb: React.FC<{
  items: BreadcrumbItem[];
  onNavigate: (path: string) => void;
}> = ({ items, onNavigate }) => {
  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="inline-flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  onClick={(e) => handleLink(e, item.href!)}
                  className="hover:text-[#2E5E88] dark:hover:text-[#7EB2E2] transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-slate-900 dark:text-slate-200 font-medium truncate max-w-[260px] sm:max-w-md">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

interface SharedSolutionsProps {
  cmsProducts: CmsProduct[];
  isMember: boolean;
  onNavigate: (path: string) => void;
  onOpenDesk: (target?: { stageId?: string; solutionId?: string; launch?: boolean }) => void;
  onOpenSignUp: () => void;
}

/* ========================================================================= */
/* 1. ALL SOLUTIONS DIRECTORY (/solutions)                                   */
/* ========================================================================= */
export const PublicSolutionsDirectory: React.FC<SharedSolutionsProps> = ({
  cmsProducts,
  isMember,
  onNavigate,
  onOpenDesk,
  onOpenSignUp,
}) => {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedKind, setSelectedKind] = useState<'all' | 'software' | 'course'>('all');

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  const sequenced = getSequencedPublicSolutions(
    cmsProducts,
    selectedStage === 'all' ? undefined : (selectedStage as PublicStageDefinition['id'])
  );

  const filtered = sequenced.filter((p) => {
    if (selectedKind !== 'all' && p.kind !== selectedKind) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <PublicBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Solutions' }]} onNavigate={onNavigate} />

      <div className="max-w-3xl mb-12">
        <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373] mb-3">
          Solutions Catalogue
        </p>
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight text-[#12172A] dark:text-white leading-tight"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Financial modelling software and courses for every business stage.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          Browse by business stage or filter between interactive software apps and guided BizzClass
          courses. Every tool opens directly inside bizz-DESK.
        </p>
      </div>

      {/* The 4 Stages Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {PUBLIC_STAGES.filter((s) => s.isCoreStage).map((stage) => (
          <a
            key={stage.id}
            href={stage.path}
            onClick={(e) => handleLink(e, stage.path)}
            className="group rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626] p-5 hover:border-[#2E5E88] dark:hover:border-[#7EB2E2] transition-colors"
          >
            <p className="text-[11px] font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373]">
              Stage {stage.number}
            </p>
            <h2
              className="text-lg font-bold text-[#12172A] dark:text-white mt-1 group-hover:text-[#2E5E88] dark:group-hover:text-[#7EB2E2]"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {stage.label}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-snug">
              {stage.statement}
            </p>
          </a>
        ))}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E6DFD2] dark:border-[#222B45]">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Stages' },
            ...PUBLIC_STAGES.map((s) => ({ id: s.id, label: s.label })),
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStage(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedStage === tab.id
                  ? 'bg-[#12172A] dark:bg-white text-white dark:text-slate-950'
                  : 'bg-white dark:bg-[#111626] border border-[#E0D7C8] dark:border-[#242E49] text-slate-700 dark:text-slate-300 hover:border-[#2E5E88]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {(['all', 'software', 'course'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSelectedKind(k)}
              className={`px-3 py-1.5 rounded-lg uppercase tracking-wider cursor-pointer transition-colors ${
                selectedKind === k
                  ? 'bg-[#2E5E88] text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              {k === 'all' ? 'All Types' : k === 'software' ? 'Software' : 'Courses'}
            </button>
          ))}
        </div>
      </div>

      {/* Catalogue Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => {
          const pricing = resolvePublicTicketPrice(item, cmsProducts);
          return (
            <article
              key={item.id}
              className="rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626] p-6 flex flex-col justify-between hover:border-[#2E5E88]/70 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <span>
                    {item.kind === 'software' ? 'Software' : 'Course'} · {item.effectiveStageLabel}
                  </span>
                  <span
                    className="font-semibold text-slate-900 dark:text-white tabular-nums"
                    title="Ticket price (inclusive of VAT & bizz-tokens)"
                  >
                    {pricing.label}
                  </span>
                </div>

                <h3
                  className="text-xl font-bold text-[#12172A] dark:text-white mt-3"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  <a
                    href={item.path}
                    onClick={(e) => handleLink(e, item.path)}
                    className="hover:text-[#2E5E88] dark:hover:text-[#7EB2E2] transition-colors"
                  >
                    {item.name}
                  </a>
                </h3>

                <p className="text-xs font-medium text-[#2E5E88] dark:text-[#7EB2E2] mt-1">
                  {item.tagline}
                </p>

                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                  {item.heroSummary}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#EDE7DC] dark:border-[#222B45] flex items-center justify-between gap-3">
                <a
                  href={item.path}
                  onClick={(e) => handleLink(e, item.path)}
                  className="text-xs font-semibold text-slate-900 dark:text-white hover:text-[#2E5E88] dark:hover:text-[#7EB2E2]"
                >
                  View details →
                </a>
                <button
                  type="button"
                  onClick={() => onOpenDesk({ stageId: item.stageId, solutionId: item.id })}
                  className="px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#234C70] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Open in bizz-DESK
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Bottom Sign-Up Callout */}
      {!isMember && (
        <div className="mt-14 rounded-2xl border border-[#E0D7C8] dark:border-[#242E49] bg-[#F4EFE6] dark:bg-[#111626] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2
              className="text-2xl font-bold text-[#12172A] dark:text-white"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Not sure which stage or tool to start with?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Create a free account to access our foundational Learn How to Earn Access to Capital
              course and explore bizz-DESK directly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenSignUp}
              className="px-5 py-2.5 rounded-lg bg-[#2E5E88] hover:bg-[#234C70] text-white text-sm font-semibold cursor-pointer"
            >
              Sign Up Free
            </button>
            <a
              href="/contact"
              onClick={(e) => handleLink(e, '/contact')}
              className="px-5 py-2.5 rounded-lg border border-[#D4C9B6] dark:border-[#2B3654] text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-[#182036]"
            >
              Ask Our Team
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* 2. STAGE LANDING PAGE (/vi-ability, /fund-ability, etc.)                  */
/* ========================================================================= */
export const PublicStagePage: React.FC<
  SharedSolutionsProps & { stageId: PublicStageDefinition['id'] }
> = ({ stageId, cmsProducts, isMember, onNavigate, onOpenDesk, onOpenSignUp }) => {
  const stage = getPublicStageById(stageId) || PUBLIC_STAGES[0];
  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  const stageItems = getSequencedPublicSolutions(cmsProducts, stage.id);

  const otherStages = PUBLIC_STAGES.filter((s) => s.id !== stage.id && s.isCoreStage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <PublicBreadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Solutions', href: '/solutions' },
          { label: stage.label },
        ]}
        onNavigate={onNavigate}
      />

      {/* Stage Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12 border-b border-[#E6DFD2] dark:border-[#222B45]">
        <div className="lg:col-span-7 space-y-5">
          <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373]">
            Stage {stage.number} · Business Lifecycle
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight text-[#12172A] dark:text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {stage.label}
          </h1>
          <p className="text-xl font-medium text-[#2E5E88] dark:text-[#7EB2E2]">
            {stage.statement}
          </p>
          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            {stage.summary}
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={() =>
                onOpenDesk({
                  stageId: stage.id,
                  solutionId: stageItems[0]?.id || stage.featuredSolutionIds[0],
                })
              }
              className="px-6 py-3 rounded-lg bg-[#2E5E88] hover:bg-[#234C70] text-white text-sm font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Open {stage.label} in bizz-DESK</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {!isMember && (
              <button
                type="button"
                onClick={onOpenSignUp}
                className="px-6 py-3 rounded-lg border border-[#D4C9B6] dark:border-[#2B3654] bg-white dark:bg-[#111626] text-slate-900 dark:text-white text-sm font-semibold hover:bg-[#F4EFE6] dark:hover:bg-[#182036] cursor-pointer"
              >
                Sign Up Free
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626] p-7">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373] mb-4">
            What You Achieve in {stage.label}
          </h2>
          <ul className="space-y-3.5 text-sm text-slate-700 dark:text-slate-300">
            {stage.outcomes.map((outcome) => (
              <li key={outcome} className="flex items-start gap-3">
                <Check className="h-4 w-4 text-[#2E5E88] dark:text-[#7EB2E2] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Stage Tools & Courses */}
      <div className="py-12">
        <h2
          className="text-2xl sm:text-3xl font-bold text-[#12172A] dark:text-white mb-8"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Software & Courses in {stage.label}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stageItems.map((item) => {
            const pricing = resolvePublicTicketPrice(item, cmsProducts);
            return (
              <article
                key={item.id}
                className="rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626] p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      {item.kind === 'software' ? (
                        <Layers className="h-3.5 w-3.5 text-[#2E5E88]" />
                      ) : (
                        <GraduationCap className="h-3.5 w-3.5 text-[#9A7B4F]" />
                      )}
                      {item.kind === 'software' ? 'Software App' : 'BizzClass Course'}
                    </span>
                    <span
                      className="font-semibold text-slate-900 dark:text-white tabular-nums"
                      title="Ticket price (inclusive of VAT & bizz-tokens)"
                    >
                      {pricing.label}
                    </span>
                  </div>

                  <h3
                    className="text-xl font-bold text-[#12172A] dark:text-white mt-3"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    <a
                      href={item.path}
                      onClick={(e) => handleLink(e, item.path)}
                      className="hover:text-[#2E5E88] dark:hover:text-[#7EB2E2]"
                    >
                      {item.name}
                    </a>
                  </h3>
                  <p className="text-xs font-medium text-[#2E5E88] dark:text-[#7EB2E2] mt-1">
                    {item.tagline}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                    {item.heroSummary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#EDE7DC] dark:border-[#222B45] flex items-center justify-between gap-3">
                  <a
                    href={item.path}
                    onClick={(e) => handleLink(e, item.path)}
                    className="text-xs font-semibold text-slate-900 dark:text-white hover:text-[#2E5E88]"
                  >
                    Full overview →
                  </a>
                  <button
                    type="button"
                    onClick={() => onOpenDesk({ stageId: stage.id, solutionId: item.id })}
                    className="px-3.5 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#234C70] text-white text-xs font-semibold cursor-pointer"
                  >
                    Open in bizz-DESK
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Navigate to Other Stages */}
      <div className="pt-10 border-t border-[#E6DFD2] dark:border-[#222B45]">
        <p className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-5">
          Explore Other Stages
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {otherStages.map((s) => (
            <a
              key={s.id}
              href={s.path}
              onClick={(e) => handleLink(e, s.path)}
              className="rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-[#FAF8F5] dark:bg-[#111626] p-5 hover:border-[#2E5E88] transition-colors"
            >
              <span className="text-[11px] font-mono text-[#9A7B4F]">Stage {s.number}</span>
              <h3 className="text-base font-bold text-[#12172A] dark:text-white mt-1">
                {s.label}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{s.statement}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 3. SOLUTION / COURSE LANDING PAGE (/bizzmodel, /bizzoptimizer, etc.)      */
/* ========================================================================= */
export const PublicSolutionDetailPage: React.FC<
  SharedSolutionsProps & { solutionId: string }
> = ({ solutionId, cmsProducts, isMember, onNavigate, onOpenDesk, onOpenSignUp }) => {
  const sequencedAll = getSequencedPublicSolutions(cmsProducts);
  const profile =
    sequencedAll.find((p) => p.id === solutionId) ||
    getPublicSolutionById(solutionId) ||
    PUBLIC_SOLUTION_PROFILES[0];
  const stage = getPublicStageById(profile.stageId);
  const pricing = resolvePublicTicketPrice(profile, cmsProducts);

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  const syllabusOrModules =
    pricing.cms?.lessonTitles && pricing.cms.lessonTitles.length > 0
      ? pricing.cms.lessonTitles
      : pricing.cms?.modules && pricing.cms.modules.length > 0
      ? pricing.cms.modules
      : profile.deliverables;

  const relatedSolutions = sequencedAll
    .filter((p) => p.id !== profile.id && p.effectiveStageId === profile.stageId)
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <PublicBreadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Solutions', href: '/solutions' },
          ...(stage ? [{ label: stage.label, href: stage.path }] : []),
          { label: profile.name },
        ]}
        onNavigate={onNavigate}
      />

      {/* Hero Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-14 border-b border-[#E6DFD2] dark:border-[#222B45] items-start">
        <div className="lg:col-span-7 space-y-5">
          <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373]">
            {profile.kind === 'software' ? 'Interactive Financial Software' : 'BizzClass Guided Course'} ·{' '}
            {profile.stageLabel}
          </p>

          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight text-[#12172A] dark:text-white leading-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {profile.name}
          </h1>

          <p className="text-xl font-medium text-[#2E5E88] dark:text-[#7EB2E2]">
            {profile.tagline}
          </p>

          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            {profile.heroSummary}
          </p>

          {/* Pricing & Primary Conversion Row */}
          <div className="pt-3 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() =>
                onOpenDesk({
                  stageId: profile.stageId,
                  solutionId: profile.id,
                  launch: profile.kind === 'course' && pricing.ticketPriceZAR === 0,
                })
              }
              className="px-6 py-3 rounded-lg bg-[#2E5E88] hover:bg-[#234C70] text-white text-sm sm:text-base font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>
                {profile.kind === 'software'
                  ? `Open ${profile.name} in bizz-DESK`
                  : 'Open Course in bizz-DESK'}
              </span>
            </button>

            {!isMember && (
              <button
                type="button"
                onClick={onOpenSignUp}
                className="px-6 py-3 rounded-lg border border-[#D4C9B6] dark:border-[#2B3654] bg-white dark:bg-[#111626] hover:bg-[#F4EFE6] dark:hover:bg-[#182036] text-slate-900 dark:text-white text-sm sm:text-base font-semibold transition-colors cursor-pointer"
              >
                Sign Up Free
              </button>
            )}
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="text-slate-900 dark:text-white font-bold text-sm tabular-nums">
              {pricing.label}
            </span>
            <span>·</span>
            <span>
              {pricing.ticketPriceZAR > 0
                ? 'Ticket price · incl. VAT & bizz-tokens'
                : 'Free access'}
            </span>
            {pricing.tokensAllocated > 0 && (
              <>
                <span>·</span>
                <span className="tabular-nums">Includes {pricing.tokensAllocated} bizz-tokens</span>
              </>
            )}
          </div>
        </div>

        {/* Visual Frame */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl overflow-hidden border border-[#E0D7C8] dark:border-[#242E49] bg-white dark:bg-[#111626]">
            <img
              src={profile.image}
              alt={`${profile.name} — ${profile.tagline}`}
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="p-5 border-t border-[#EDE7DC] dark:border-[#222B45] text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">Best suited for: </span>
              {profile.idealFor}
            </div>
          </div>
        </div>
      </div>

      {/* Problem Solved + How It Works */}
      <div className="py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 border-b border-[#E6DFD2] dark:border-[#222B45]">
        <div className="lg:col-span-5 space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373]">
            Why It Matters
          </p>
          <h2
            className="text-2xl sm:text-3xl font-bold text-[#12172A] dark:text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            The problem {profile.name} solves.
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {profile.problemSolved}
          </p>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373]">
            Step-by-Step Workflow
          </p>
          <h2
            className="text-2xl sm:text-3xl font-bold text-[#12172A] dark:text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            How it works inside bizz-DESK.
          </h2>
          <ol className="space-y-4 pt-2">
            {profile.howItWorks.map((step, i) => (
              <li
                key={step}
                className="flex items-start gap-4 p-4 rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626]"
              >
                <span className="text-xs font-mono font-bold text-[#2E5E88] dark:text-[#7EB2E2] pt-0.5 tabular-nums">
                  0{i + 1}
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Deliverables / Syllabus */}
      <div className="py-14 border-b border-[#E6DFD2] dark:border-[#222B45]">
        <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373] mb-3">
          {profile.kind === 'software' ? 'Key Outputs & Deliverables' : 'Curriculum & Modules'}
        </p>
        <h2
          className="text-2xl sm:text-3xl font-bold text-[#12172A] dark:text-white mb-8"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          What is included.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {syllabusOrModules.map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 p-4 rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626]"
            >
              <Check className="h-4 w-4 text-[#2E5E88] dark:text-[#7EB2E2] shrink-0 mt-0.5" />
              <span className="text-sm text-slate-800 dark:text-slate-200">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      {profile.faqs.length > 0 && (
        <div className="py-14 border-b border-[#E6DFD2] dark:border-[#222B45]">
          <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373] mb-3">
            Common Questions
          </p>
          <h2
            className="text-2xl sm:text-3xl font-bold text-[#12172A] dark:text-white mb-8"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Frequently asked questions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626] p-6"
              >
                <h3 className="text-base font-bold text-[#12172A] dark:text-white">{faq.q}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Solutions */}
      {relatedSolutions.length > 0 && (
        <div className="pt-12">
          <p className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-5">
            Also in {profile.stageLabel}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {relatedSolutions.map((rel) => (
              <a
                key={rel.id}
                href={rel.path}
                onClick={(e) => handleLink(e, rel.path)}
                className="rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626] p-5 hover:border-[#2E5E88] transition-colors"
              >
                <span className="text-[11px] font-mono uppercase text-slate-500">
                  {rel.kind === 'software' ? 'Software' : 'Course'}
                </span>
                <h3 className="text-base font-bold text-[#12172A] dark:text-white mt-1">
                  {rel.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                  {rel.tagline}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
