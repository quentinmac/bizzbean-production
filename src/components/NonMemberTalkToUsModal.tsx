import React from 'react';
import { X, Lock, ShieldAlert, UserCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface NonMemberTalkToUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSignUp: () => void;
  onOpenSignIn?: () => void;
  theme?: 'light' | 'dark';
}

export const NonMemberTalkToUsModal: React.FC<NonMemberTalkToUsModalProps> = ({
  isOpen,
  onClose,
  onOpenSignUp,
  onOpenSignIn,
  theme = 'light',
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-3xl border overflow-hidden shadow-2xl transition-all ${
          isDark ? 'bg-[#0E1322] border-[#252E4A] text-slate-100' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between gap-3 ${
            isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-[#F4EFE6] border-[#D8CEBC]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-xs">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <div className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                MEMBERS-ONLY ADVISORY ACCESS
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                TALK TO US STRATEGIC DISPATCH GATEWAY
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#5584B4] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white uppercase">
                Direct Advisory Is Reserved For Verified Members
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                The <strong>TALK TO US</strong> system connects founders directly to Coach GIM and the executive venture team.
                To maintain high-priority advisory quality and dispatch integrity, direct messaging is exclusively available to registered members.
              </p>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border space-y-2 text-xs font-mono ${
              isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              As a visitor you can currently:
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Explore all solutions & courses using the <strong>‘VIEW’</strong> button</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Inspect full 7-step engine architectures & syllabi</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Audit transparent pricing and token rewards</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Ready to dispatch strategic questions or request enterprise advisory? Sign up for a free account in 30 seconds.
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className={`px-5 py-3.5 border-t flex items-center justify-between gap-2.5 ${
            isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-[#F4EFE6] border-[#D8CEBC]'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            CONTINUE AS VISITOR
          </button>

          <div className="flex items-center gap-2">
            {onOpenSignIn && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSignIn();
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200/50 dark:hover:bg-slate-800 text-xs font-mono font-bold uppercase transition-colors"
              >
                SIGN IN
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSignUp();
              }}
              className="px-4 py-2 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white font-mono font-bold text-xs uppercase flex items-center gap-1.5 shadow-sm border border-[#2B3452]"
            >
              <UserCheck className="h-3.5 w-3.5 text-[#5584B4]" />
              <span>SIGN UP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NonMemberTalkToUsModal;
