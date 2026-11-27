import React, { useState } from 'react';
import { X, Coins, Check, Sparkles, ShieldCheck, CreditCard, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';
import { initiatePayfastCheckout } from '../services/payfastService';
import { trackBeginCheckout, trackAddPaymentInfo } from '../utils/analytics';
import { formatTokenBalance } from '../services/tokenBalanceService';

interface BuyTokensModalProps {
  isOpen: boolean;
  tokenBalance: number;
  theme: 'light' | 'dark';
  onClose: () => void;
  onAddTokens: (amount: number) => void;
  userEmail?: string;
}

interface TokenPack {
  id: string;
  name: string;
  tokens: number;
  priceUSD: number;
  priceZAR: number;
  badge?: string;
  popular?: boolean;
  description: string;
}

const TOKEN_PACKS: TokenPack[] = [
  {
    id: 'pack-starter',
    name: 'Starter Pack',
    tokens: 100,
    priceUSD: 25,
    priceZAR: 480,
    description: 'Ideal for quick formula simulations and single solution runs.',
  },
  {
    id: 'pack-founder',
    name: 'Founder Pack',
    tokens: 250,
    priceUSD: 55,
    priceZAR: 1050,
    popular: true,
    badge: 'MOST POPULAR',
    description: 'Comprehensive access to 3-statement modeling and smart pricing calculations.',
  },
  {
    id: 'pack-scale',
    name: 'Scale Pack',
    tokens: 500,
    priceUSD: 99,
    priceZAR: 1900,
    badge: 'SAVE 20%',
    description: 'For growing ventures running multi-scenario forecasts and team collaboration.',
  },
  {
    id: 'pack-enterprise',
    name: 'Sandbox Sovereign',
    tokens: 1000,
    priceUSD: 175,
    priceZAR: 3350,
    badge: 'BEST VALUE',
    description: 'Maximum power for continuous personal-sandbox testing and all CMS courses.',
  },
];

export const BuyTokensModal: React.FC<BuyTokensModalProps> = ({
  isOpen,
  tokenBalance,
  theme,
  onClose,
  onAddTokens,
  userEmail,
}) => {
  const [selectedPackId, setSelectedPackId] = useState<string>('pack-founder');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'instant_eft' | 'sandbox'>('sandbox');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addedAmount, setAddedAmount] = useState<number>(0);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const selectedPack = TOKEN_PACKS.find((p) => p.id === selectedPackId);
  const effectiveTokens = isCustomMode
    ? Math.max(10, parseInt(customAmount, 10) || 0)
    : selectedPack?.tokens || 250;

  const effectivePriceUSD = isCustomMode
    ? Math.round(effectiveTokens * 0.22 * 100) / 100
    : selectedPack?.priceUSD || 55;

  const effectivePriceZAR = isCustomMode
    ? Math.round(effectiveTokens * 4.2)
    : selectedPack?.priceZAR || 1050;

  const handlePurchase = async () => {
    if (effectiveTokens <= 0 || isProcessing) return;
    setErrorMessage(null);

    // If sandbox grant is selected, give tokens immediately in the simulator
    if (paymentMethod === 'sandbox') {
      setAddedAmount(effectiveTokens);
      onAddTokens(effectiveTokens);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
      return;
    }

    // PayFast Gateway Checkout flow (Card / Instant EFT)
    try {
      setIsProcessing(true);
      trackBeginCheckout({
        id: `bizztokens_${effectiveTokens}`,
        name: `${effectiveTokens} BizzBean Token Pack`,
        priceZAR: effectivePriceZAR,
        stage: 'tokens',
        type: 'tokens',
      });
      trackAddPaymentInfo({
        id: `bizztokens_${effectiveTokens}`,
        name: `${effectiveTokens} BizzBean Token Pack`,
        priceZAR: effectivePriceZAR,
        paymentType: paymentMethod,
      });
      await initiatePayfastCheckout({
        amount: effectivePriceZAR,
        itemName: `${effectiveTokens} BizzBean Token Pack (${selectedPack?.name || 'Custom'})`,
        itemDescription: `Allocation of ${effectiveTokens} tokens for BizzBean Workspace`,
        userEmail: userEmail || 'founder@bizzbean.co.za',
        paymentId: `TOKEN_${effectiveTokens}_${Date.now()}`
      });
    } catch (err: any) {
      console.error('PayFast checkout failed:', err);
      setErrorMessage(err.message || 'Unable to redirect to PayFast. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="buy-tokens-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border p-5 sm:p-7 shadow-2xl transition-colors ${
          isDark
            ? 'bg-[#12172A] border-[#252E4A] text-[#E2E8F0]'
            : 'bg-white border-[#D8CEBC] text-slate-800'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-start justify-between pb-4 border-b mb-5 ${
            isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#5584B4]/15 border border-[#5584B4]/30 text-[#5584B4]">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
                  BIZZBEAN TOKENOMICS
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#5584B4]/20 text-[#5584B4] dark:text-[#DDEBF7]">
                  V1 ENGINE
                </span>
              </div>
              <h2
                id="buy-tokens-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wide mt-0.5"
              >
                BUY TOKENS & RUNWAY CREDITS
              </h2>
              <div className="text-xs font-mono text-[#9A7B4F] dark:text-[#D4A373] lowercase mt-0.5 flex items-center gap-2">
                <span>the illuminated sandbox</span>
                <span>·</span>
                <span>current balance: <strong className="text-slate-900 dark:text-white font-bold">{formatTokenBalance(tokenBalance)} tokens</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success State Overlay */}
        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
            <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white uppercase">
              +{formatTokenBalance(addedAmount)} Tokens Added!
            </h3>
            <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-1">
              New Balance: <span className="font-bold text-[#5584B4]">{formatTokenBalance(tokenBalance)} tokens</span>
            </p>
            <p className="text-xs font-mono text-[#9A7B4F] mt-3">
              Your sandbox runway and calculation engine have been updated immediately.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Packs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOKEN_PACKS.map((pack) => {
                const isSelected = !isCustomMode && selectedPackId === pack.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => {
                      setSelectedPackId(pack.id);
                      setIsCustomMode(false);
                    }}
                    className={`text-left p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? isDark
                          ? 'bg-[#1E2548] border-[#5584B4] shadow-md ring-1 ring-[#5584B4]'
                          : 'bg-[#FAF8F5] border-[#5584B4] shadow-md ring-1 ring-[#5584B4]'
                        : isDark
                        ? 'bg-[#161C30] border-[#252E4A] hover:border-slate-600'
                        : 'bg-white border-[#E8E2D8] hover:border-slate-400'
                    }`}
                  >
                    {pack.badge && (
                      <span
                        className={`absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                          pack.popular
                            ? 'bg-[#E02475] text-white shadow-xs'
                            : 'bg-[#5584B4] text-white'
                        }`}
                      >
                        {pack.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {pack.name}
                        </span>
                        <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#5584B4]">
                          <Coins className="h-3.5 w-3.5" />
                          <span>{pack.tokens}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {pack.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-baseline justify-between">
                      <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                        ${pack.priceUSD}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        R{pack.priceZAR.toLocaleString()} ZAR
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Option */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                isCustomMode
                  ? isDark
                    ? 'bg-[#1E2548] border-[#5584B4] ring-1 ring-[#5584B4]'
                    : 'bg-[#FAF8F5] border-[#5584B4] ring-1 ring-[#5584B4]'
                  : isDark
                  ? 'bg-[#161C30]/50 border-[#252E4A]'
                  : 'bg-slate-50 border-[#E8E2D8]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label
                  onClick={() => setIsCustomMode(true)}
                  className="cursor-pointer text-xs font-mono font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <input
                    type="radio"
                    checked={isCustomMode}
                    onChange={() => setIsCustomMode(true)}
                    className="accent-[#5584B4]"
                  />
                  <span>CUSTOM TOKEN TOP-UP</span>
                </label>
                {isCustomMode && (
                  <span className="text-[10px] font-mono text-slate-400">
                    Est. ${effectivePriceUSD} / R{effectivePriceZAR.toLocaleString()}
                  </span>
                )}
              </div>

              {isCustomMode && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="50"
                      step="50"
                      placeholder="e.g. 750"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-lg border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#5584B4] ${
                        isDark
                          ? 'bg-[#101424] border-[#252E4A] text-white'
                          : 'bg-white border-[#D8CEBC] text-slate-900'
                      }`}
                    />
                    <span className="absolute right-3 top-2 text-xs font-mono text-slate-400">
                      tokens
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500 whitespace-nowrap">
                    ($0.22/token)
                  </span>
                </div>
              )}
            </div>

            {/* Payment / Sandbox Mode Selector */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                SELECT PAYMENT CHANNEL
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('sandbox')}
                  className={`py-2 px-3 rounded-lg border text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'sandbox'
                      ? 'bg-[#5584B4]/20 border-[#5584B4] text-[#5584B4] dark:text-[#DDEBF7] font-bold'
                      : isDark
                      ? 'bg-[#161C30] border-[#252E4A] text-slate-400'
                      : 'bg-white border-[#E8E2D8] text-slate-600'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Sandbox Grant</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 px-3 rounded-lg border text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'card'
                      ? 'bg-[#5584B4]/20 border-[#5584B4] text-[#5584B4] dark:text-[#DDEBF7] font-bold'
                      : isDark
                      ? 'bg-[#161C30] border-[#252E4A] text-slate-400'
                      : 'bg-white border-[#E8E2D8] text-slate-600'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Credit Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('instant_eft')}
                  className={`py-2 px-3 rounded-lg border text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'instant_eft'
                      ? 'bg-[#5584B4]/20 border-[#5584B4] text-[#5584B4] dark:text-[#DDEBF7] font-bold'
                      : isDark
                      ? 'bg-[#161C30] border-[#252E4A] text-slate-400'
                      : 'bg-white border-[#E8E2D8] text-slate-600'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Instant EFT</span>
                </button>
              </div>
            </div>

            {/* Summary & Confirm Action */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">Total Purchase:</span>
                  <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                    +{effectiveTokens} Tokens
                  </span>
                </div>
                <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Balance will become:{' '}
                  <strong>{formatTokenBalance(tokenBalance + effectiveTokens)} tokens</strong>
                </div>
              </div>

              {errorMessage && (
                <div className="w-full p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-mono">
                  {errorMessage}
                </div>
              )}

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePurchase}
                  disabled={isProcessing}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#E02475] hover:bg-[#C2185B] text-white text-xs font-mono font-bold uppercase tracking-wider shadow-md transition-all active:scale-[0.98] disabled:opacity-75"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>CONNECTING TO PAYFAST...</span>
                    </>
                  ) : paymentMethod === 'sandbox' ? (
                    <>
                      <span>GRANT +{effectiveTokens} TOKENS</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      <span>PAY R{effectivePriceZAR.toLocaleString()} VIA PAYFAST</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
