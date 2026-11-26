import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Menu, X, ArrowUpRight } from 'lucide-react';
import { PUBLIC_STAGES, PUBLIC_SOLUTION_PROFILES, PublicRoute } from './publicSiteData';

interface PublicNavbarProps {
  currentRoute: PublicRoute;
  onNavigate: (path: string) => void;
  onOpenDesk: (target?: { stageId?: string; solutionId?: string; launch?: boolean }) => void;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
  isMember: boolean;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  currentRoute,
  onNavigate,
  onOpenDesk,
  onOpenSignIn,
  onOpenSignUp,
  isMember,
}) => {
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSolutionsOpen(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
        setResourcesOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSolutionsOpen(false);
        setResourcesOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setSolutionsOpen(false);
    setResourcesOpen(false);
    setMobileMenuOpen(false);
    onNavigate(path);
  };

  const isSolutionsActive =
    currentRoute.kind === 'solutions' ||
    currentRoute.kind === 'stage' ||
    currentRoute.kind === 'solution';
  const isArticlesActive =
    currentRoute.kind === 'articles' ||
    currentRoute.kind === 'article-detail' ||
    currentRoute.kind === 'library' ||
    currentRoute.kind === 'videos';

  const coreStages = PUBLIC_STAGES.filter((s) => s.isCoreStage);
  const flagshipApps = PUBLIC_SOLUTION_PROFILES.filter((p) => p.kind === 'software');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E6DFD2] dark:border-[#222B45] bg-[#FAF8F5]/95 dark:bg-[#0A0D14]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* ZONE 1: Single-element Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className="flex items-center gap-2.5 shrink-0 focus:outline-none group"
          aria-label="bizzbean Home"
        >
          <span className="h-8 w-8 rounded-full overflow-hidden border border-[#D8CEBC] dark:border-[#2A3555] bg-white flex items-center justify-center shrink-0">
            <img
              src="/bizzbean-favicon.jpg"
              alt="bizzbean"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedPng) {
                  target.dataset.triedPng = 'true';
                  target.src = '/bizzbean-favicon.png';
                }
              }}
            />
          </span>
          <span
            className="text-2xl tracking-tight text-slate-900 dark:text-white leading-none select-none"
            style={{ fontFamily: "'Raleway', sans-serif" }}
          >
            <span className="font-normal">bizz</span>
            <span className="font-extralight">bean</span>
            <sup className="text-[10px] font-normal text-slate-500 dark:text-slate-400 ml-0.5">TM</sup>
          </span>
        </a>

        {/* ZONE 2: Primary Single-Line Navigation (5 links max) */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, '/')}
            className={`py-1 whitespace-nowrap transition-colors ${
              currentRoute.kind === 'home'
                ? 'text-[#2E5E88] dark:text-[#7EB2E2] font-semibold border-b-2 border-[#2E5E88] dark:border-[#7EB2E2]'
                : 'hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            Home
          </a>

          {/* Solutions Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-1">
              <a
                href="/solutions"
                onClick={(e) => handleLinkClick(e, '/solutions')}
                className={`py-1 whitespace-nowrap transition-colors ${
                  isSolutionsActive
                    ? 'text-[#2E5E88] dark:text-[#7EB2E2] font-semibold border-b-2 border-[#2E5E88] dark:border-[#7EB2E2]'
                    : 'hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                Solutions
              </a>
              <button
                type="button"
                onClick={() => setSolutionsOpen((prev) => !prev)}
                aria-expanded={solutionsOpen}
                aria-label="Expand Solutions menu"
                className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-150 ${
                    solutionsOpen ? 'rotate-180 text-[#2E5E88]' : ''
                  }`}
                />
              </button>
            </div>

            {solutionsOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[680px] rounded-xl border border-[#DFD7C8] dark:border-[#242E49] bg-white dark:bg-[#111626] shadow-2xl p-6 grid grid-cols-12 gap-6 z-50">
                {/* Left Column: The 4 Stages */}
                <div className="col-span-6 border-r border-[#EDE7DC] dark:border-[#222B45] pr-6">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373] mb-3">
                    By Business Stage
                  </p>
                  <ul className="space-y-2.5">
                    {coreStages.map((stage) => (
                      <li key={stage.id}>
                        <a
                          href={stage.path}
                          onClick={(e) => handleLinkClick(e, stage.path)}
                          className="group block rounded-lg p-2 -mx-2 hover:bg-[#FAF8F5] dark:hover:bg-[#182036] transition-colors"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white group-hover:text-[#2E5E88] dark:group-hover:text-[#7EB2E2] transition-colors">
                              {stage.label}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {stage.number}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {stage.statement}
                          </p>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right Column: Flagship Tools & Resources */}
                <div className="col-span-6 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373] mb-3">
                      Flagship Software
                    </p>
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-2">
                      {flagshipApps.map((app) => (
                        <li key={app.id}>
                          <a
                            href={app.path}
                            onClick={(e) => handleLinkClick(e, app.path)}
                            className="block rounded-lg p-2 -mx-1 hover:bg-[#FAF8F5] dark:hover:bg-[#182036] transition-colors"
                          >
                            <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                              {app.name}
                            </span>
                            <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {app.stageLabel}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#EDE7DC] dark:border-[#222B45] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                      <a
                        href="/library"
                        onClick={(e) => handleLinkClick(e, '/library')}
                        className="hover:text-[#2E5E88] dark:hover:text-[#7EB2E2] font-medium"
                      >
                        Sandbox Library
                      </a>
                      <a
                        href="/videos"
                        onClick={(e) => handleLinkClick(e, '/videos')}
                        className="hover:text-[#2E5E88] dark:hover:text-[#7EB2E2] font-medium"
                      >
                        Videos
                      </a>
                    </div>
                    <a
                      href="/solutions"
                      onClick={(e) => handleLinkClick(e, '/solutions')}
                      className="font-semibold text-[#2E5E88] dark:text-[#7EB2E2] hover:underline inline-flex items-center gap-1"
                    >
                      All solutions
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Articles & Videos Dropdown */}
          <div className="relative" ref={resourcesRef}>
            <div className="flex items-center gap-1">
              <a
                href="/articles"
                onClick={(e) => handleLinkClick(e, '/articles')}
                className={`py-1 whitespace-nowrap transition-colors ${
                  isArticlesActive
                    ? 'text-[#2E5E88] dark:text-[#7EB2E2] font-semibold border-b-2 border-[#2E5E88] dark:border-[#7EB2E2]'
                    : 'hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                Articles & Videos
              </a>
              <button
                type="button"
                onClick={() => {
                  setSolutionsOpen(false);
                  setResourcesOpen((prev) => !prev);
                }}
                aria-expanded={resourcesOpen}
                aria-label="Expand Articles and Videos menu"
                className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-150 ${
                    resourcesOpen ? 'rotate-180 text-[#2E5E88]' : ''
                  }`}
                />
              </button>
            </div>

            {resourcesOpen && (
              <div className="absolute left-0 top-full mt-3 w-72 rounded-xl border border-[#DFD7C8] dark:border-[#242E49] bg-white dark:bg-[#111626] shadow-2xl p-3 space-y-1 z-50">
                <a
                  href="/articles"
                  onClick={(e) => handleLinkClick(e, '/articles')}
                  className="block rounded-lg px-3 py-2.5 hover:bg-[#FAF8F5] dark:hover:bg-[#182036] transition-colors"
                >
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                    Articles
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Executive briefs on finance, operations & capital
                  </span>
                </a>
                <a
                  href="/videos"
                  onClick={(e) => handleLinkClick(e, '/videos')}
                  className="block rounded-lg px-3 py-2.5 hover:bg-[#FAF8F5] dark:hover:bg-[#182036] transition-colors"
                >
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                    Videos
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Curated masterclasses and walkthrough talks
                  </span>
                </a>
                <div className="my-1 border-t border-[#EDE7DC] dark:border-[#222B45]" />
                <a
                  href="/library"
                  onClick={(e) => handleLinkClick(e, '/library')}
                  className="block rounded-lg px-3 py-2 hover:bg-[#FAF8F5] dark:hover:bg-[#182036] transition-colors"
                >
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                    Sandbox Library
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Getting to Value book & curated guides
                  </span>
                </a>
              </div>
            )}
          </div>

          <a
            href="/about"
            onClick={(e) => handleLinkClick(e, '/about')}
            className={`py-1 whitespace-nowrap transition-colors ${
              currentRoute.kind === 'about'
                ? 'text-[#2E5E88] dark:text-[#7EB2E2] font-semibold border-b-2 border-[#2E5E88] dark:border-[#7EB2E2]'
                : 'hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            About
          </a>

          <a
            href="/contact"
            onClick={(e) => handleLinkClick(e, '/contact')}
            className={`py-1 whitespace-nowrap transition-colors ${
              currentRoute.kind === 'contact'
                ? 'text-[#2E5E88] dark:text-[#7EB2E2] font-semibold border-b-2 border-[#2E5E88] dark:border-[#7EB2E2]'
                : 'hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            Contact
          </a>
        </nav>

        {/* ZONE 3: Single Primary Action + Mobile Drawer Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onOpenDesk()}
            className="px-4 py-2 rounded-lg bg-[#2E5E88] hover:bg-[#234C70] text-white text-sm font-semibold tracking-tight transition-colors shadow-xs whitespace-nowrap cursor-pointer"
          >
            Open bizz-DESK
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg border border-[#DFD7C8] dark:border-[#242E49] text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-[#161D30] cursor-pointer"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E6DFD2] dark:border-[#222B45] bg-[#FAF8F5] dark:bg-[#0D111C] px-4 py-5 space-y-5">
          <nav aria-label="Mobile navigation" className="flex flex-col space-y-3 text-base font-medium">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className="py-1 text-slate-900 dark:text-white hover:text-[#2E5E88]"
            >
              Home
            </a>
            <a
              href="/solutions"
              onClick={(e) => handleLinkClick(e, '/solutions')}
              className="py-1 text-slate-900 dark:text-white hover:text-[#2E5E88]"
            >
              All Solutions
            </a>
            <div className="pl-3 space-y-2 border-l border-[#DFD7C8] dark:border-[#242E49]">
              {coreStages.map((stage) => (
                <a
                  key={stage.id}
                  href={stage.path}
                  onClick={(e) => handleLinkClick(e, stage.path)}
                  className="block py-1 text-sm text-slate-600 dark:text-slate-300 hover:text-[#2E5E88]"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">{stage.label}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {stage.statement}
                  </span>
                </a>
              ))}
            </div>
            <a
              href="/articles"
              onClick={(e) => handleLinkClick(e, '/articles')}
              className="py-1 text-slate-900 dark:text-white hover:text-[#2E5E88]"
            >
              Articles
            </a>
            <a
              href="/library"
              onClick={(e) => handleLinkClick(e, '/library')}
              className="py-1 text-slate-900 dark:text-white hover:text-[#2E5E88]"
            >
              Sandbox Library
            </a>
            <a
              href="/videos"
              onClick={(e) => handleLinkClick(e, '/videos')}
              className="py-1 text-slate-900 dark:text-white hover:text-[#2E5E88]"
            >
              Videos
            </a>
            <a
              href="/about"
              onClick={(e) => handleLinkClick(e, '/about')}
              className="py-1 text-slate-900 dark:text-white hover:text-[#2E5E88]"
            >
              About
            </a>
            <a
              href="/contact"
              onClick={(e) => handleLinkClick(e, '/contact')}
              className="py-1 text-slate-900 dark:text-white hover:text-[#2E5E88]"
            >
              Contact
            </a>
          </nav>

          <div className="pt-4 border-t border-[#E6DFD2] dark:border-[#222B45] flex flex-wrap items-center gap-3">
            {!isMember && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSignIn();
                  }}
                  className="px-4 py-2 rounded-lg border border-[#D8CEBC] dark:border-[#2B3654] text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSignUp();
                  }}
                  className="px-4 py-2 rounded-lg bg-[#12172A] dark:bg-white text-white dark:text-slate-950 text-sm font-semibold cursor-pointer"
                >
                  Create Free Account
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
