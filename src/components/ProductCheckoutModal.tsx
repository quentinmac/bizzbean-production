import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Coins,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Info,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { BizzSolution } from '../types';
import { CmsProduct } from '../data/cmsConsoleData';
import { initiatePayfastCheckout, getPayfastConfig, setPayfastMode } from '../services/payfastService';

interface ProductCheckoutModalProps {
  isOpen: boolean;
  product: BizzSolution | CmsProduct | null;
  userProfile?: { founderName?: string; email?: string; companyName?: string };
  theme: 'light' | 'dark';
  onClose: () => void;
  onInstantGrant: (product: any) => void;
}

export const ProductCheckoutModal: React.FC<ProductCheckoutModalProps> = ({
  isOpen,
  product,
  userProfile,
  theme,
  onClose,
  onInstantGrant,
}) => {
  if (!isOpen || !product) return null;

  const isDark = theme === 'dark';

  // Extract names and email
  const defaultFullName = userProfile?.founderName || 'Entrepreneur';
  const nameParts = defaultFullName.trim().split(' ');
  const [firstName, setFirstName] = useState<string>(nameParts[0] || 'Entrepreneur');
  const [lastName, setLastName] = useState<string>(nameParts.slice(1).join(' ') || 'Member');
  const [email, setEmail] = useState<string>(userProfile?.email || 'member@bizzbean.co.za');

  // Checkout states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Gateway mode state: Live vs Sandbox
  const [isSandbox, setIsSandbox] = useState<boolean>(false);
  const [merchantId, setMerchantId] = useState<string>('14980265');
  const [processUrl, setProcessUrl] = useState<string>('https://www.payfast.co.za/eng/process');
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);

  // Fetch current server config on open
  useEffect(() => {
    let isMounted = true;
    getPayfastConfig()
      .then((cfg) => {
        if (isMounted) {
          setIsSandbox(cfg.isSandbox);
          setMerchantId(cfg.merchantId);
          setProcessUrl(cfg.processUrl);
          setIsLoadingConfig(false);
        }
      })
      .catch((err) => {
        console.warn('PayFast config fetch error:', err);
        if (isMounted) setIsLoadingConfig(false);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Pricing calculations
  const rawPrice =
    (product as any).sellingPriceZAR !== undefined
      ? (product as any).sellingPriceZAR
      : (product as any).priceZAR || 229.0;
  const sellingPrice = Math.max(0, Number(rawPrice) || 0);

  const exclusivePrice =
    (product as any).exclusivePriceZAR !== undefined
      ? (product as any).exclusivePriceZAR
      : Math.round((sellingPrice / 1.15) * 100) / 100;

  const vat =
    (product as any).vatZAR !== undefined
      ? (product as any).vatZAR
      : Math.round((sellingPrice - exclusivePrice) * 100) / 100;

  const tokensEarned =
    (product as any).tokensAllocated !== undefined
      ? (product as any).tokensAllocated
      : Math.round(sellingPrice * 0.2 * 10) / 10;

  const sku = (product as any).sku || (product as any).stageCode || 'BA-001';
  const stage = (product as any).stage || 'fund-ability';
  const isCourse =
    (product as any).type === 'course' ||
    (product as any).category === 'education' ||
    product.id.includes('course') ||
    product.id.includes('capital') ||
    product.id.includes('calculator') ||
    ['cost-recovery-calculator', 'learn-earn-capital', 'how-to-bizzcalc', 'profit-optimizer', 'financial-reports', 'your-first-hire'].includes(product.id);

  // Toggle sandbox mode
  const handleToggleSandbox = async (sandboxValue: boolean) => {
    try {
      setIsLoadingConfig(true);
      const res = await setPayfastMode(sandboxValue);
      setIsSandbox(res.isSandbox);
      setMerchantId(res.merchantId);
      setProcessUrl(res.processUrl);
    } catch (err: any) {
      console.warn('Failed to toggle PayFast mode:', err);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // Launch PayFast Checkout
  const handlePayWithPayfast = async () => {
    if (isProcessing) return;
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const paymentId = `PROD_${product.id}_${Date.now()}`;
      await initiatePayfastCheckout({
        amount: sellingPrice,
        itemName: product.name,
        itemDescription:
          (product as any).subtitle ||
          (product as any).purpose ||
          `BizzBean Platform Access: ${product.name}`,
        userEmail: email.trim() || 'member@bizzbean.co.za',
        userFirstName: firstName.trim() || 'Entrepreneur',
        userLastName: lastName.trim() || 'Member',
        paymentId,
        isSandbox,
      });
      // The browser will redirect to PayFast processUrl automatically
    } catch (err: any) {
      console.error('PayFast checkout error:', err);
      setErrorMessage(err.message || 'Could not initiate PayFast gateway session. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payfast-checkout-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border p-5 sm:p-6 shadow-2xl transition-colors ${
          isDark
            ? 'bg-[#12172A] border-[#252E4A] text-[#E2E8F0]'
            : 'bg-white border-[#D8CEBC] text-slate-800'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-start justify-between pb-3.5 border-b mb-4 ${
            isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                PAYFAST SECURE PAYMENT GATEWAY
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                <span>256-BIT SSL ENCRYPTED</span>
              </span>
            </div>
            <h2
              id="payfast-checkout-title"
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wide mt-1 flex items-center gap-2"
            >
              <span>ACQUIRE {product.name}</span>
            </h2>
            <div className="text-xs font-mono text-[#9A7B4F] lowercase mt-0.5">
              instant unlocking · 100% mathematical formula ownership
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close checkout modal"
            className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
              isDark
                ? 'bg-[#161C30] hover:bg-[#1E2548] border-[#252E4A] text-slate-300 hover:text-white'
                : 'bg-[#FAF8F5] hover:bg-[#F4EFE6] border-[#D8CEBC] text-slate-600 hover:text-slate-900'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono">
            {errorMessage}
          </div>
        )}

        {/* Product Details Card */}
        <div
          className={`p-4 rounded-xl border mb-4 ${
            isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#78A6D1] border border-[#2E5E88]/30">
                  {sku} · {stage}
                </span>
                <span className="text-[10px] font-mono font-semibold uppercase text-slate-500">
                  {isCourse ? 'BizzClass Master Suite' : 'Interactive App / Simulator'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 capitalize font-mono">
                {product.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                {(product as any).subtitle || (product as any).description || 'Full platform access & native Google Sheets formula ownership.'}
              </p>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-center font-mono">
            <div className="p-2 rounded-lg bg-white dark:bg-[#101424] border border-slate-200 dark:border-[#222E4E]">
              <div className="text-[10px] text-slate-500 uppercase">Base (Excl.)</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                R{exclusivePrice.toFixed(2)}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-[#101424] border border-slate-200 dark:border-[#222E4E]">
              <div className="text-[10px] text-slate-500 uppercase">VAT (15%)</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                R{vat.toFixed(2)}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-[#E02475]/10 border border-[#E02475]/30">
              <div className="text-[10px] text-[#E02475] font-bold uppercase">Selling Price</div>
              <div className="text-xs sm:text-sm font-bold text-[#E02475] mt-0.5">
                R{sellingPrice.toFixed(2)}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-[#C59B63]/10 border border-[#C59B63]/30">
              <div className="text-[10px] text-[#C59B63] font-bold uppercase">BizzTokens</div>
              <div className="text-xs font-bold text-[#C59B63] mt-0.5 flex items-center justify-center gap-0.5">
                <Coins className="h-3 w-3" />
                <span>+{tokensEarned}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Member Details */}
        <div className="space-y-3 mb-4 text-xs font-mono">
          <div className="font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center justify-between">
            <span>Customer Billing Information</span>
            <span className="text-[10px] font-normal lowercase text-slate-500">synced from account profile</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[11px]">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                  isDark ? 'bg-[#161C30] border-[#252E4A] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[11px]">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                  isDark ? 'bg-[#161C30] border-[#252E4A] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[11px]">Email Address (PayFast receipt destination)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                isDark ? 'bg-[#161C30] border-[#252E4A] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>
        </div>

        {/* PayFast Gateway Status & Mode Control */}
        <div
          className={`p-3.5 rounded-xl border mb-5 ${
            isDark ? 'bg-[#0E1322] border-[#202942]' : 'bg-[#F4F7FA] border-[#D0DAE5]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#E02475]" />
              <span className="font-mono text-xs font-bold uppercase text-slate-800 dark:text-slate-200">
                Payment Gateway: PayFast
              </span>
            </div>

            {/* Mode Indicator & Switcher */}
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border ${
                  isSandbox
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                }`}
              >
                {isSandbox ? 'Sandbox Test Mode' : 'Live Production'}
              </span>

              <button
                type="button"
                onClick={() => handleToggleSandbox(!isSandbox)}
                disabled={isLoadingConfig}
                className="text-[10px] font-mono text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
                title="Switch between Live PayFast Production and Sandbox Test"
              >
                {isSandbox ? 'switch to live' : 'switch to sandbox'}
              </button>
            </div>
          </div>

          <div className="mt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 leading-relaxed">
            {isSandbox ? (
              <span>
                Using PayFast Sandbox (Merchant ID: <strong className="text-slate-700 dark:text-slate-300">10000100</strong>). Safe for test cards and simulated EFT with zero real banking charges.
              </span>
            ) : (
              <span>
                Using BizzBean Live Merchant (<strong className="text-slate-700 dark:text-slate-300">ID: 14980265</strong>). Processed on{' '}
                <span className="text-[#2E5E88] dark:text-[#78A6D1] font-semibold">https://www.payfast.co.za</span> via Visa, Mastercard, Instant EFT, SnapScan, and Zapper.
              </span>
            )}
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              onInstantGrant(product);
              onClose();
            }}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Instant simulator grant without payment redirect"
          >
            Instant Test Simulator (Bypass)
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className={`px-4 py-2 rounded-xl border text-xs font-mono transition-colors ${
                isDark
                  ? 'bg-[#161C30] hover:bg-[#1E2548] border-[#252E4A] text-slate-300'
                  : 'bg-[#FAF8F5] hover:bg-[#F4EFE6] border-[#D8CEBC] text-slate-700'
              }`}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePayWithPayfast}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-[#E02475] hover:bg-[#C91A63] text-white font-bold text-xs uppercase font-mono flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Connecting to PayFast...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>
                    PROCEED TO PAYFAST (R{sellingPrice.toFixed(2)})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
