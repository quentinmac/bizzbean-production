import React from 'react';
import { X, Check, ShieldCheck, Coins, ArrowRight, ShoppingCart, Percent, Layers, BookOpen } from 'lucide-react';
import { BizzSolution } from '../types';

interface SmartPricingModalProps {
  isOpen: boolean;
  solution: BizzSolution;
  effectiveSellingZAR: number;
  effectiveExclusiveZAR: number;
  effectiveVatZAR: number;
  effectiveTicketZAR: number;
  effectiveTokens: number;
  isMonthlySubscription: boolean;
  theme: 'light' | 'dark';
  onClose: () => void;
  onBuy: (sol: BizzSolution) => void;
}

export const SmartPricingModal: React.FC<SmartPricingModalProps> = ({
  isOpen,
  solution,
  effectiveSellingZAR,
  effectiveExclusiveZAR,
  effectiveVatZAR,
  effectiveTicketZAR,
  effectiveTokens,
  isMonthlySubscription,
  theme,
  onClose,
  onBuy,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-pricing-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border p-5 sm:p-7 shadow-2xl transition-colors ${
          isDark
            ? 'bg-[#12172A] border-[#252E4A] text-[#E2E8F0]'
            : 'bg-white border-[#D8CEBC] text-slate-800'
        }`}
      >
        {/* Header - Styled per About Bizzbean Card (Single font size with Capital & Bold) */}
        <div
          className={`flex items-start justify-between pb-3.5 border-b mb-5 ${
            isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
          }`}
        >
          <div>
            <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider block">
              BIZZBEAN GOVERNANCE & CAPITAL ACCESS ARCHITECTURE
            </span>
            <h2
              id="smart-pricing-title"
              className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase tracking-wide mt-0.5 flex items-center gap-2"
            >
              <span>SMART PRICING POLICY (V1 FORMULA ENGINE)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#E02475]/15 text-[#E02475] border border-[#E02475]/30">
                V1 POLICY
              </span>
            </h2>
            <div className="text-xs font-mono text-[#9A7B4F] lowercase mt-0.5">
              the illuminated sandbox · transparent unit economics & formula ownership
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close smart pricing modal"
            className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
              isDark
                ? 'bg-[#161C30] hover:bg-[#1E2548] border-[#252E4A] text-slate-300 hover:text-white'
                : 'bg-[#FAF8F5] hover:bg-[#F4EFE6] border-[#D8CEBC] text-slate-600 hover:text-slate-900'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Core Mission Banner (per About Bizzbean Card Equation Style) */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#161C30] border border-[#E8E2D8] dark:border-[#252E4A] shadow-xs text-center mb-5">
          <div className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-tight leading-relaxed uppercase">
            [ Fair Selling Base + 15% VAT Compliance ] × 20% BizzToken Reinvestment = Defensible Capital Readiness
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bizzbean operates on open-book transparency. We eliminate hidden software subscriptions and unbundled advisory fees so founders build verifiable contribution margins from day one.
          </div>
        </div>

        {/* 4 Foundational Policy Rules (Styled per About Bizzbean 4 Foundational Questions) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-5">
          {/* Rule 01 */}
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
            }`}
          >
            <div className="font-mono text-xs font-bold text-slate-500 uppercase mb-1">
              01. SELLING PRICE AS THE BASELINE CALCULATOR
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              The advertised selling price in South African Rands (ZAR) is the true, comprehensive figure. Every mathematical calculation in our platform is derived from this single immutable baseline with zero hidden transaction costs.
            </p>
          </div>

          {/* Rule 02 */}
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
            }`}
          >
            <div className="font-mono text-xs font-bold text-slate-500 uppercase mb-1">
              02. 15% VALUE ADDED TAX (VAT) RECOVERY
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Compliant with statutory tax accounting: <br />
              <strong className="text-slate-900 dark:text-white font-mono">Exclusive Price = Selling Price ÷ 1.15</strong><br />
              <strong className="text-slate-900 dark:text-white font-mono">VAT (15%) = Selling Price − Exclusive Price</strong><br />
              Instant tax invoice reconciliation directly syncable with bizzmoney general ledgers.
            </p>
          </div>

          {/* Rule 03 */}
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
            }`}
          >
            <div className="font-mono text-xs font-bold text-slate-500 uppercase mb-1">
              03. TICKET PRICE (1.20x STANDARD RETAIL BENCHMARK)
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <strong className="text-slate-900 dark:text-white font-mono">Ticket Price = Selling Price × 1.20</strong><br />
              Represents the unbundled market value of the institutional tools, guaranteeing an automatic 20% platform founder discount across all sandbox stages.
            </p>
          </div>

          {/* Rule 04 */}
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#E8E2D8] shadow-xs'
            }`}
          >
            <div className="font-mono text-xs font-bold text-slate-500 uppercase mb-1">
              04. 20% BIZZTOKEN REINVESTMENT ALLOCATION
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <strong className="text-slate-900 dark:text-white font-mono">Tokens Credited = 20% of Selling Price</strong><br />
              Every Rand spent returns 20% liquid BizzTokens to your wallet to run Socratic diagnostics with GIM, run DCF simulations, or redeem masterclass modules.
            </p>
          </div>
        </div>

        {/* Live Active Solution Breakdown Card */}
        <div
          className={`rounded-xl border p-4 shadow-xs mb-5 ${
            isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
          }`}
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E8E2D8] dark:border-[#252E4A] mb-3">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                CURRENT STAGE SOLUTION AUDIT
              </span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono">
                {solution.name} ({solution.stageCode || 'STAGE'})
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-[#E02475]/15 text-[#E02475] border border-[#E02475]/30">
              {isMonthlySubscription ? 'monthly subscription' : 'once-off lifetime'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center font-mono">
            <div className="p-2.5 rounded-lg bg-white dark:bg-[#111628] border border-[#E8E2D8] dark:border-[#252E4A]">
              <div className="text-[10px] text-slate-500 lowercase">selling base:</div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                R{effectiveSellingZAR.toFixed(2)}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-[#111628] border border-[#E8E2D8] dark:border-[#252E4A]">
              <div className="text-[10px] text-slate-500 lowercase">excl. vat:</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                R{effectiveExclusiveZAR.toFixed(2)}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-[#111628] border border-[#E8E2D8] dark:border-[#252E4A]">
              <div className="text-[10px] text-slate-500 lowercase">vat (15%):</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                R{effectiveVatZAR.toFixed(2)}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-[#111628] border border-[#E8E2D8] dark:border-[#252E4A]">
              <div className="text-[10px] text-slate-500 lowercase">ticket value:</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                R{effectiveTicketZAR.toFixed(2)}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-[#111628] border border-[#E8E2D8] dark:border-[#252E4A] col-span-2 sm:col-span-1">
              <div className="text-[10px] text-[#C59B63] lowercase font-bold">bizztokens:</div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                <Coins className="h-3 w-3 text-[#C59B63]" />
                <span>+{effectiveTokens}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 100% Formula Ownership Statement */}
        <div className="flex items-start gap-2.5 text-xs font-mono text-slate-600 dark:text-slate-300 mb-6 bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900 dark:text-white">100% Mathematical Formula Ownership:</strong> Every model, calculator, and financial engine runs natively in Google Sheets, Microsoft Excel, and Apple Numbers. No encrypted black boxes, no vendor lock-in.
          </div>
        </div>

        {/* Action Controls - Prominent Pink Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#E8E2D8] dark:border-[#252E4A]">
          <button
            type="button"
            onClick={onClose}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-mono lowercase transition-colors ${
              isDark
                ? 'bg-[#161C30] hover:bg-[#1E2548] border-[#252E4A] text-slate-300'
                : 'bg-[#FAF8F5] hover:bg-[#F4EFE6] border-[#D8CEBC] text-slate-700'
            }`}
          >
            close policy
          </button>

          <button
            type="button"
            onClick={() => {
              onBuy(solution);
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#E02475] hover:bg-[#C91A63] text-white font-bold text-xs uppercase font-mono flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>
              BUY SOLUTION NOW (R{effectiveSellingZAR.toFixed(2)}{isMonthlySubscription ? '/mo' : ''})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
