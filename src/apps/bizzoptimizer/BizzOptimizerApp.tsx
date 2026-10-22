import React, { useState } from 'react';
import {
  Zap,
  TrendingUp,
  Percent,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Layers,
} from 'lucide-react';

interface BizzOptimizerAppProps {
  theme?: 'light' | 'dark';
  onBackToWorkstation?: () => void;
  onNavigateToStage?: (stageId: string, solutionId?: string) => void;
}

export const BizzOptimizerApp: React.FC<BizzOptimizerAppProps> = ({
  theme = 'light',
  onBackToWorkstation,
  onNavigateToStage,
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'margin-leaks' | 'sensitivity-matrix' | 'renegotiation-levers'>('margin-leaks');

  // Spend inputs
  const [saasSpend, setSaasSpend] = useState<number>(6800);
  const [vendorSpend, setVendorSpend] = useState<number>(14500);
  const [processingFeesSpend, setProcessingFeesSpend] = useState<number>(3200);
  const [contractorSpend, setContractorSpend] = useState<number>(22000);

  // Optimization targets %
  const [saasTrimPct, setSaasTrimPct] = useState<number>(20);
  const [vendorTrimPct, setVendorTrimPct] = useState<number>(15);
  const [feeTrimPct, setFeeTrimPct] = useState<number>(25);

  const saasSavings = Math.round((saasSpend * saasTrimPct) / 100);
  const vendorSavings = Math.round((vendorSpend * vendorTrimPct) / 100);
  const feeSavings = Math.round((processingFeesSpend * feeTrimPct) / 100);

  const totalMonthlySavings = saasSavings + vendorSavings + feeSavings;
  const totalAnnualSavings = totalMonthlySavings * 12;

  return (
    <div className={`p-4 sm:p-6 space-y-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Top Module Sub-Navigation */}
      <div
        className={`p-1.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 shrink-0 ${
          isDark ? 'bg-[#12172A] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'margin-leaks', label: '1. Margin Leak Trimmer' },
            { id: 'sensitivity-matrix', label: '2. Gross Margin Sensitivity Matrix' },
            { id: 'renegotiation-levers', label: '3. Vendor Renegotiation Playbook' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all lowercase whitespace-nowrap ${
                  isActive
                    ? isDark
                      ? 'bg-[#1E2548] text-[#DDEBF7] border border-[#5584B4] shadow-xs'
                      : 'bg-[#12172A] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Savings KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Monthly Recoverable Profit</div>
          <div className="font-mono text-2xl font-bold text-emerald-500 mt-1 tabular-nums">
            +${totalMonthlySavings.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Bottom line direct addition</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Annualized Impact</div>
          <div className="font-mono text-2xl font-bold text-[#5584B4] mt-1 tabular-nums">
            +${totalAnnualSavings.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">EBITDA margin lift</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Valuation Multiple Lift</div>
          <div className="font-mono text-2xl font-bold text-amber-500 mt-1 tabular-nums">
            +${Math.round((totalAnnualSavings * 6) / 1000)}k
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">At 6x venture ARR multiple</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Gross Margin Expansion</div>
          <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            +3.8%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Unit economics upgrade</div>
        </div>
      </div>

      {/* Main Leak Trimming Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
            OPERATIONAL EXPENDITURE AUDIT
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-500">SaaS Subscriptions & Licenses:</span>
                <span className="font-bold">${saasSpend.toLocaleString()}/mo</span>
              </div>
              <input
                type="range"
                min="1000"
                max="25000"
                step="500"
                value={saasSpend}
                onChange={(e) => setSaasSpend(Number(e.target.value))}
                className="w-full accent-[#5584B4]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                <span>Target Trim: {saasTrimPct}%</span>
                <span className="text-emerald-500 font-bold">Saves ${saasSavings}/mo</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-500">External Vendor & Retainer Spend:</span>
                <span className="font-bold">${vendorSpend.toLocaleString()}/mo</span>
              </div>
              <input
                type="range"
                min="2000"
                max="50000"
                step="1000"
                value={vendorSpend}
                onChange={(e) => setVendorSpend(Number(e.target.value))}
                className="w-full accent-[#5584B4]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                <span>Target Trim: {vendorTrimPct}%</span>
                <span className="text-emerald-500 font-bold">Saves ${vendorSavings}/mo</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-500">Payment Gateway & Interchange Fees:</span>
                <span className="font-bold">${processingFeesSpend.toLocaleString()}/mo</span>
              </div>
              <input
                type="range"
                min="500"
                max="15000"
                step="250"
                value={processingFeesSpend}
                onChange={(e) => setProcessingFeesSpend(Number(e.target.value))}
                className="w-full accent-[#5584B4]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                <span>Target Trim: {feeTrimPct}%</span>
                <span className="text-emerald-500 font-bold">Saves ${feeSavings}/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Renegotiation Action Items */}
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
            HIGH-LEVERAGE MARGIN RECOVERY LEVERS
          </h3>

          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-dashed border-[#D8CEBC] dark:border-[#252E4A] space-y-1">
              <div className="flex justify-between items-center text-xs font-mono font-bold">
                <span>Payment Processing Tier Renegotiation</span>
                <span className="text-emerald-500">High Impact</span>
              </div>
              <p className="text-xs text-slate-500">
                Switch from flat 2.9% + 30¢ to Interchange Plus (IC+) pricing once processing volume exceeds $50k/mo.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-dashed border-[#D8CEBC] dark:border-[#252E4A] space-y-1">
              <div className="flex justify-between items-center text-xs font-mono font-bold">
                <span>Cloud Infrastructure Committed Use Discounts</span>
                <span className="text-emerald-500">Immediate</span>
              </div>
              <p className="text-xs text-slate-500">
                Convert steady on-demand database compute to 1-year reserved instances for instant 35% discount.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-dashed border-[#D8CEBC] dark:border-[#252E4A] space-y-1">
              <div className="flex justify-between items-center text-xs font-mono font-bold">
                <span>Annual Prepayment for Essential SaaS</span>
                <span className="text-emerald-500">Quick Win</span>
              </div>
              <p className="text-xs text-slate-500">
                Negotiate 2 months free (16.7% effective saving) on proven tool stack using existing cash reserves.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
