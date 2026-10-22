import React, { useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  onOpenConsultation: (serviceId?: string) => void;
  onScrollTo: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenConsultation, onScrollTo }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    onScrollTo(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#222F4C]/80 bg-[#0A0D14]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single element wordmark adhering to constitution */}
        <button
          onClick={() => handleNavClick('hero')}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold text-base shadow-sm">
            B
          </div>
          <span className="font-['Outfit'] text-xl font-bold tracking-tight text-white">
            Bizzbean
          </span>
        </button>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <button
            onClick={() => handleNavClick('framework')}
            className="hover:text-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded px-1"
          >
            The 4 Stages
          </button>
          <button
            onClick={() => handleNavClick('simulator')}
            className="hover:text-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded px-1"
          >
            Financial Simulator
          </button>
          <button
            onClick={() => handleNavClick('diagnostic')}
            className="hover:text-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded px-1"
          >
            Venture Diagnostic
          </button>
          <button
            onClick={() => handleNavClick('services')}
            className="hover:text-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded px-1"
          >
            Services Catalog
          </button>
          <button
            onClick={() => handleNavClick('delivery')}
            className="hover:text-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded px-1"
          >
            Delivery Process
          </button>
          <button
            onClick={() => handleNavClick('masterclasses')}
            className="hover:text-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded px-1"
          >
            Masterclasses
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => handleNavClick('simulator')}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors focus-visible:outline-none whitespace-nowrap"
          >
            Launch Sandbox
          </button>
          <button
            onClick={() => onOpenConsultation()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 whitespace-nowrap"
          >
            <span>Request Service</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-[#222F4C] bg-[#0A0D14] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-slate-300">
            <button
              onClick={() => handleNavClick('framework')}
              className="text-left py-2 hover:text-amber-400"
            >
              The 4 Stages
            </button>
            <button
              onClick={() => handleNavClick('simulator')}
              className="text-left py-2 hover:text-amber-400"
            >
              Financial Simulator
            </button>
            <button
              onClick={() => handleNavClick('diagnostic')}
              className="text-left py-2 hover:text-amber-400"
            >
              Venture Diagnostic
            </button>
            <button
              onClick={() => handleNavClick('services')}
              className="text-left py-2 hover:text-amber-400"
            >
              Services Catalog
            </button>
            <button
              onClick={() => handleNavClick('delivery')}
              className="text-left py-2 hover:text-amber-400"
            >
              Delivery Process
            </button>
            <button
              onClick={() => handleNavClick('masterclasses')}
              className="text-left py-2 hover:text-amber-400"
            >
              Masterclasses
            </button>
            <div className="pt-2 border-t border-[#222F4C] flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenConsultation();
                }}
                className="w-full text-center py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors"
              >
                Request Service
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
