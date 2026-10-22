import React, { useState } from 'react';
import { X, UserCheck, ShieldCheck, ArrowRight, Sparkles, Check } from 'lucide-react';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';

interface SignUpModalProps {
  isOpen: boolean;
  isMember: boolean;
  theme: 'light' | 'dark';
  onClose: () => void;
  onConfirmSignUp: (name: string, email: string, company: string) => void;
  onOpenDoors?: () => void;
}

export const SignUpModal: React.FC<SignUpModalProps> = ({
  isOpen,
  isMember,
  theme,
  onClose,
  onConfirmSignUp,
  onOpenDoors,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    onConfirmSignUp(fullName.trim() || 'Venture Founder', email.trim(), companyName.trim() || 'My Venture');
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-lg rounded-2xl border p-6 sm:p-7 shadow-2xl transition-colors ${
          isDark
            ? 'bg-[#12172A] border-[#252E4A] text-[#E2E8F0]'
            : 'bg-white border-[#D8CEBC] text-slate-800'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <BizzbeanLogoIcon className="h-6 w-6" />
          <span className="font-mono text-xs font-bold text-[#5584B4] uppercase tracking-wider">
            BIZZBEAN MEMBER REGISTRATION
          </span>
        </div>

        <h3
          id="signup-modal-title"
          className="text-lg sm:text-xl font-bold uppercase tracking-wide text-slate-900 dark:text-white font-mono"
        >
          {isMember ? 'VERIFIED FOUNDER PROFILE' : 'SIGN UP TO DISCOVER YOUR BIZZ-ABILITY'}
        </h3>
        <p className="text-xs font-mono text-[#9A7B4F] dark:text-[#D4A373] mt-0.5 lowercase">
          the illuminated sandbox · single-screen workstation access
        </p>

        {isSuccess ? (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center mb-3">
              <Check className="h-6 w-6 stroke-[3]" />
            </div>
            <h4 className="text-base font-bold font-mono text-slate-900 dark:text-white uppercase">
              Founder Profile Verified!
            </h4>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
              Your workstation sandbox and token permissions have been updated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 uppercase font-semibold mb-1">
                Founder Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Elena Vance"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#5584B4] ${
                  isDark
                    ? 'bg-[#0E1220] border-[#252E4A] text-white'
                    : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 uppercase font-semibold mb-1">
                Work / Enterprise Email *
              </label>
              <input
                type="email"
                required
                placeholder="founder@venture.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#5584B4] ${
                  isDark
                    ? 'bg-[#0E1220] border-[#252E4A] text-white'
                    : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 uppercase font-semibold mb-1">
                Company / Startup Name
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Cloud Dynamics"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#5584B4] ${
                  isDark
                    ? 'bg-[#0E1220] border-[#252E4A] text-white'
                    : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                }`}
              />
            </div>

            {/* Member Benefits */}
            <div
              className={`p-3 rounded-xl border space-y-1.5 ${
                isDark ? 'bg-[#0E1220]/70 border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
              }`}
            >
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Check className="h-3.5 w-3.5 text-[#5584B4]" />
                <span>250 initial sandbox tokens & financial modeling simulations</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Check className="h-3.5 w-3.5 text-[#5584B4]" />
                <span>Persistent Pinboard bookmarks across all startup & operations stages</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Check className="h-3.5 w-3.5 text-[#5584B4]" />
                <span>Synchronized access to bizzmodel, bizzplan & standard COA</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              {onOpenDoors && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDoors();
                  }}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline text-[11px]"
                >
                  Switch via Office Doors
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl border border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm border border-[#2B3452] transition-all"
                >
                  <UserCheck className="h-4 w-4 text-[#5584B4]" />
                  <span>SIGN UP</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
