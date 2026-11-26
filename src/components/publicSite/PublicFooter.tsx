import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { PUBLIC_STAGES, PUBLIC_SOLUTION_PROFILES } from './publicSiteData';

interface PublicFooterProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (path: string) => void;
  onOpenDesk: () => void;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
  onDownloadBook: () => void;
  isMember: boolean;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  theme,
  onToggleTheme,
  onNavigate,
  onOpenDesk,
  onOpenSignIn,
  onOpenSignUp,
  onDownloadBook,
  isMember,
}) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  const flagshipApps = PUBLIC_SOLUTION_PROFILES.filter((p) => p.kind === 'software');
  const courses = PUBLIC_SOLUTION_PROFILES.filter((p) => p.kind === 'course').slice(0, 6);

  return (
    <footer className="border-t border-[#E6DFD2] dark:border-[#222B45] bg-[#F4EFE6] dark:bg-[#0D111C] text-slate-700 dark:text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#E3DBCC] dark:border-[#1E263D]">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className="inline-flex items-center gap-2.5"
            >
              <span className="h-8 w-8 rounded-full overflow-hidden border border-[#D8CEBC] dark:border-[#2A3555] bg-white flex items-center justify-center shrink-0">
                <img
                  src="/bizzbean-favicon.jpg"
                  alt="bizzbean"
                  className="w-full h-full object-cover"
                />
              </span>
              <span
                className="text-2xl tracking-tight text-slate-900 dark:text-white leading-none"
                style={{ fontFamily: "'Raleway', sans-serif" }}
              >
                <span className="font-normal">bizz</span>
                <span className="font-extralight">bean</span>
                <sup className="text-[10px] font-normal text-slate-500 ml-0.5">TM</sup>
              </span>
            </a>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              Practical 3-statement financial modelling software, Bill of Materials (BOM) pricing
              calculators, and structured business courses built for founders and operating
              businesses.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onOpenDesk}
                className="px-4 py-2 rounded-lg bg-[#2E5E88] hover:bg-[#234C70] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Open bizz-DESK
              </button>
              {!isMember && (
                <button
                  type="button"
                  onClick={onOpenSignUp}
                  className="px-4 py-2 rounded-lg border border-[#D4C9B6] dark:border-[#2B3654] text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-[#161D30] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Create Free Account
                </button>
              )}
            </div>
          </div>

          {/* Column 2: The 4 Stages */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373] mb-4">
              Business Stages
            </h3>
            <ul className="space-y-2.5 text-sm">
              {PUBLIC_STAGES.map((stage) => (
                <li key={stage.id}>
                  <a
                    href={stage.path}
                    onClick={(e) => handleLinkClick(e, stage.path)}
                    className="hover:text-[#2E5E88] dark:hover:text-[#7EB2E2] transition-colors"
                  >
                    {stage.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/solutions"
                  onClick={(e) => handleLinkClick(e, '/solutions')}
                  className="font-medium text-[#2E5E88] dark:text-[#7EB2E2] hover:underline"
                >
                  All Solutions
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Flagship Software */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373] mb-4">
              Software
            </h3>
            <ul className="space-y-2.5 text-sm">
              {flagshipApps.map((app) => (
                <li key={app.id}>
                  <a
                    href={app.path}
                    onClick={(e) => handleLinkClick(e, app.path)}
                    className="hover:text-[#2E5E88] dark:hover:text-[#7EB2E2] transition-colors"
                  >
                    {app.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Courses & Knowledge */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373] mb-4">
              Learn & Read
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="/articles"
                  onClick={(e) => handleLinkClick(e, '/articles')}
                  className="hover:text-[#2E5E88] dark:hover:text-[#7EB2E2] transition-colors"
                >
                  Articles
                </a>
              </li>
              <li>
                <a
                  href="/library"
                  onClick={(e) => handleLinkClick(e, '/library')}
                  className="hover:text-[#2E5E88] dark:hover:text-[#7EB2E2] transition-colors"
                >
                  Sandbox Library
                </a>
              </li>
              <li>
                <a
                  href="/videos"
                  onClick={(e) => handleLinkClick(e, '/videos')}
                  className="hover:text-[#2E5E88] dark:hover:text-[#7EB2E2] transition-colors"
                >
                  Videos
                </a>
              </li>
              {courses.slice(0, 3).map((course) => (
                <li key={course.id}>
                  <a
                    href={course.path}
                    onClick={(e) => handleLinkClick(e, course.path)}
                    className="hover:text-[#2E5E88] dark:hover:text-[#7EB2E2] transition-colors"
                  >
                    {course.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Company */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373] mb-4">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="/about"
                  onClick={(e) => handleLinkClick(e, '/about')}
                  className="hover:text-[#2E5E88] dark:hover:text-[#7EB2E2] transition-colors"
                >
                  About bizzbean
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleLinkClick(e, '/contact')}
                  className="hover:text-[#2E5E88] dark:hover:text-[#7EB2E2] transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="/website-footer"
                  onClick={(e) => handleLinkClick(e, '/website-footer')}
                  className="hover:text-[#2E5E88] dark:hover:text-[#7EB2E2] transition-colors"
                >
                  Policies & POPIA
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onDownloadBook}
                  className="text-left hover:text-[#2E5E88] dark:hover:text-[#7EB2E2] transition-colors cursor-pointer"
                >
                  Free Book: Getting to Value
                </button>
              </li>
              {!isMember && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenSignIn}
                    className="text-left hover:text-[#2E5E88] dark:hover:text-[#7EB2E2] transition-colors cursor-pointer"
                  >
                    Member Sign In
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* PayFast & Payment Security Bar */}
        <div className="py-7 border-b border-[#E3DBCC] dark:border-[#1E263D] flex flex-col items-center justify-center space-y-3">
          <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-5 px-5 py-2.5 bg-[#12172A] dark:bg-[#070A12] border border-[#242E49] rounded-xl shadow-xs select-none">
            <div className="flex items-center gap-1.5 text-slate-200 font-extrabold text-xs tracking-wider">
              <span className="bg-emerald-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded">
                DPO
              </span>
              <span className="font-bold text-slate-300">pay</span>
            </div>
            <span className="text-slate-700 font-light" aria-hidden="true">|</span>
            <div className="flex items-center gap-1 font-black text-sm tracking-tight text-white italic">
              <span className="text-red-500">Pay</span>
              <span>Fast</span>
            </div>
            <span className="text-slate-700 font-light" aria-hidden="true">|</span>
            <div className="font-black text-sm tracking-widest text-[#4A90E2] italic px-1 font-serif">
              VISA
            </div>
            <span className="text-slate-700 font-light" aria-hidden="true">|</span>
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B] opacity-90" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] opacity-90" />
              </div>
              <span className="font-bold text-xs text-slate-300 font-sans">MasterCard</span>
            </div>
            <span className="text-slate-700 font-light hidden sm:inline" aria-hidden="true">|</span>
            <div className="px-2 py-0.5 rounded border border-slate-600 bg-slate-900/90 text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">
              VERIFIED BY VISA
            </div>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 text-center max-w-2xl leading-relaxed">
            Official PayFast by DPO Group Merchant · Merchant ID:{' '}
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
              14980265
            </span>{' '}
            (BizzBean South Africa). Secured with 256-bit SSL encryption, 3D Secure, Visa,
            MasterCard, and South African Instant EFT.
          </p>
        </div>

        {/* Quiet Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>
            © {new Date().getFullYear()} BizzBean (Pty) Ltd. Built by entrepreneurs for founders and
            operating businesses.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="/website-footer"
              onClick={(e) => handleLinkClick(e, '/website-footer')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Privacy & Terms
            </a>
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
