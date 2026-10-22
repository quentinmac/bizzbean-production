import React, { useState } from 'react';
import {
  TrendingUp,
  Target,
  Share2,
  Users,
  Sparkles,
  BarChart3,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

interface GrowthStrategyAppProps {
  theme?: 'light' | 'dark';
  onBackToWorkstation?: () => void;
  onNavigateToStage?: (stageId: string, solutionId?: string) => void;
}

interface ChannelMetric {
  name: string;
  cac: number;
  ltv: number;
  paybackMonths: number;
  volumePct: number;
  scaleCapacity: string;
}

export const GrowthStrategyApp: React.FC<GrowthStrategyAppProps> = ({
  theme = 'light',
  onBackToWorkstation,
  onNavigateToStage,
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'channel-matrix' | 'virality-loop' | 'expansion-scenarios'>('channel-matrix');

  // Virality states
  const [viralInvites, setViralInvites] = useState<number>(3.2); // invites per user
  const [viralConversion, setViralConversion] = useState<number>(18); // % acceptance
  const [cycleTimeDays, setCycleTimeDays] = useState<number>(14);

  const kFactor = (viralInvites * (viralConversion / 100)).toFixed(2);
  const isViral = Number(kFactor) >= 1.0;

  const channels: ChannelMetric[] = [
    { name: 'Organic Founder Brand & LinkedIn', cac: 120, ltv: 3200, paybackMonths: 1.2, volumePct: 35, scaleCapacity: 'Moderate' },
    { name: 'Direct Enterprise Account Outbound', cac: 850, ltv: 14500, paybackMonths: 3.5, volumePct: 25, scaleCapacity: 'High' },
    { name: 'Partner & Accounting Co-Selling', cac: 350, ltv: 4800, paybackMonths: 2.1, volumePct: 25, scaleCapacity: 'Very High' },
    { name: 'Paid Intent Search (Google Ads)', cac: 680, ltv: 2900, paybackMonths: 5.8, volumePct: 15, scaleCapacity: 'Medium' },
  ];

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
            { id: 'channel-matrix', label: '1. Channel CAC : LTV Matrix' },
            { id: 'virality-loop', label: '2. K-Factor & Virality Engine' },
            { id: 'expansion-scenarios', label: '3. Market Expansion Modeler' },
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

      {/* Top Growth KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Blended LTV : CAC</div>
          <div className="font-mono text-2xl font-bold text-emerald-500 mt-1 tabular-nums">
            5.8x
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Top-quartile venture efficiency</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Viral K-Factor</div>
          <div className={`font-mono text-2xl font-bold mt-1 tabular-nums ${isViral ? 'text-emerald-500' : 'text-amber-500'}`}>
            {kFactor}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{isViral ? 'Self-sustaining viral loop' : 'Sub-exponential loop'}</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Avg Payback Period</div>
          <div className="font-mono text-2xl font-bold text-[#5584B4] mt-1 tabular-nums">
            2.9 Months
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Cash recycling velocity</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Growth Moat Score</div>
          <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            86 / 100
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Defensible network barrier</div>
        </div>
      </div>

      {/* Main Table: Channel Matrix */}
      {activeTab === 'channel-matrix' && (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="p-4 border-b border-[#D8CEBC] dark:border-[#252E4A] flex justify-between items-center">
            <span className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
              CUSTOMER ACQUISITION CHANNELS COMPARATIVE MATRIX
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Target benchmark: LTV : CAC &gt; 3.0x with Payback &lt; 12 mo
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className={`border-b ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-slate-400' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-600'}`}>
                <tr>
                  <th className="p-3 pl-4">Channel Name</th>
                  <th className="p-3 text-right">CAC ($)</th>
                  <th className="p-3 text-right">Estimated LTV ($)</th>
                  <th className="p-3 text-right">LTV : CAC Ratio</th>
                  <th className="p-3 text-right">Payback (Mo)</th>
                  <th className="p-3 pr-4 text-right">Volume Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8] dark:divide-[#252E4A]">
                {channels.map((ch) => {
                  const ratio = (ch.ltv / ch.cac).toFixed(1);
                  return (
                    <tr key={ch.name} className="hover:bg-slate-50 dark:hover:bg-[#161F38] transition-colors">
                      <td className="p-3 pl-4 font-bold text-slate-900 dark:text-white">{ch.name}</td>
                      <td className="p-3 text-right">${ch.cac}</td>
                      <td className="p-3 text-right">${ch.ltv.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-emerald-500">{ratio}x</td>
                      <td className="p-3 text-right text-[#5584B4] font-bold">{ch.paybackMonths} mo</td>
                      <td className="p-3 pr-4 text-right font-mono">{ch.volumePct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 2: VIRALITY LOOP */}
      {activeTab === 'virality-loop' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
              VIRALITY COEFFICIENT (K-FACTOR) DRIVERS
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-500">Invites Sent per Active User:</span>
                  <span className="font-bold">{viralInvites} invites</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={viralInvites}
                  onChange={(e) => setViralInvites(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-500">Invite Conversion Rate:</span>
                  <span className="font-bold">{viralConversion}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={viralConversion}
                  onChange={(e) => setViralConversion(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-500">Viral Cycle Time (Days to Invite):</span>
                  <span className="font-bold">{cycleTimeDays} Days</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="45"
                  step="1"
                  value={cycleTimeDays}
                  onChange={(e) => setCycleTimeDays(Number(e.target.value))}
                  className="w-full accent-[#5584B4]"
                />
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
              ORGANIC GROWTH MULTIPLIER
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              K-Factor represents how many new users each existing user recruits. When K &gt; 1.0, the product experiences true exponential viral growth without paid acquisition.
            </p>

            <div className="p-4 rounded-xl border border-dashed border-[#D8CEBC] dark:border-[#252E4A] space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span>Current K-Factor:</span>
                <span className={`text-base font-bold ${isViral ? 'text-emerald-500' : 'text-amber-500'}`}>{kFactor}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cycle Frequency:</span>
                <span>{(365 / cycleTimeDays).toFixed(0)} cycles / year</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
