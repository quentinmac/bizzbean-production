import React from 'react';
import { ArrowRight, Calculator, CheckCircle2, ShieldCheck, Sparkles, Layers } from 'lucide-react';

interface HeroProps {
  onOpenConsultation: () => void;
  onScrollTo: (sectionId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenConsultation, onScrollTo }) => {
  return (
    <section id="hero" className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-[#222F4C]/50">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-amber-500/10 via-blue-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Proposition & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Unboxed clean metadata kicker adhering to Zero-Pill discipline */}
            <div className="flex items-center gap-2 text-xs font-medium text-amber-400 mb-4 tracking-wide uppercase">
              <span>Venture Acceleration Platform</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Financial Modeling Sandbox</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Google Workspace Integration</span>
            </div>

            {/* Dominant Headline with balanced line wrap */}
            <h1 className="font-['Outfit'] text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] max-w-2xl [text-wrap:balance]">
              Build assets of sustainable value through institutional modeling.
            </h1>

            {/* Concrete Value Proposition */}
            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              Bizzbean empowers entrepreneurs and growth companies with dynamic 3-statement financial models, structured business validation stages, and streamlined Google Workspace integration to gain access to capital and eliminate operational runway risks.
            </p>

            {/* Primary Action Zone */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onScrollTo('simulator')}
                className="flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-lg shadow-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <Calculator className="h-4 w-4" />
                <span>Launch Financial Sandbox</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => onScrollTo('diagnostic')}
                className="flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-slate-200 bg-[#151D30] hover:bg-[#1C263E] border border-[#222F4C] rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <span>Take 60s Stage Diagnostic</span>
              </button>
            </div>

            {/* Adjacent Proof Strip - Unboxed clean metadata */}
            <div className="mt-10 pt-8 border-t border-[#222F4C] w-full grid grid-cols-3 gap-6">
              <div>
                <div className="font-mono text-2xl font-bold text-white tabular-nums tracking-tight">
                  $3.4M+
                </div>
                <div className="text-xs text-slate-400 mt-1">Capital Secured for Clients</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-white tabular-nums tracking-tight">
                  4.2 Mo
                </div>
                <div className="text-xs text-slate-400 mt-1">Average Runway Added</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-white tabular-nums tracking-tight">
                  100%
                </div>
                <div className="text-xs text-slate-400 mt-1">Diligence Pass Rate</div>
              </div>
            </div>
          </div>

          {/* Right Column: Dominant Focal Carrier - Interactive Visual Engine Preview */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-[#222F4C] bg-[#111726] p-6 shadow-2xl overflow-hidden">
              {/* Subtle top bar of model */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#222F4C]/80">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-semibold text-slate-200">Bizzbean Financial Engine</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">v4.2 Sandbox</span>
              </div>

              {/* Live Metric Cards inside visual preview */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3.5 rounded-xl bg-[#151D30] border border-[#222F4C]">
                  <div className="text-[11px] font-medium text-slate-400">Net Monthly Runway</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">22.4 Mo</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Threshold: Healthy</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#151D30] border border-[#222F4C]">
                  <div className="text-[11px] font-medium text-slate-400">ARR Run Rate</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1 tabular-nums">$620,000</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Est. Valuation: $3.72M</div>
                </div>
              </div>

              {/* Visualized Runway Progression Graphic */}
              <div className="p-4 rounded-xl bg-[#0A0D14] border border-[#222F4C] mb-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>36-Month Capital Trajectory</span>
                  <span className="text-emerald-400 font-mono">Break-Even @ M14</span>
                </div>
                {/* SVG Chart representation */}
                <div className="h-28 w-full">
                  <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#222F4C" strokeWidth="0.5" strokeDasharray="3,3" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="#222F4C" strokeWidth="0.5" strokeDasharray="3,3" />
                    <line x1="0" y1="80" x2="300" y2="80" stroke="#222F4C" strokeWidth="0.5" strokeDasharray="3,3" />
                    {/* Area under curve */}
                    <path
                      d="M 0,85 Q 75,78 140,55 T 300,15 L 300,100 L 0,100 Z"
                      fill="url(#chartGrad)"
                    />
                    {/* Line curve */}
                    <path
                      d="M 0,85 Q 75,78 140,55 T 300,15"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Break-even point marker */}
                    <circle cx="140" cy="55" r="4" fill="#10B981" stroke="#0A0D14" strokeWidth="2" />
                  </svg>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>Month 1</span>
                  <span>Month 12</span>
                  <span>Month 24</span>
                  <span>Month 36</span>
                </div>
              </div>

              {/* The 4 Stages Mini-Ticker */}
              <div className="p-3 rounded-xl bg-[#151D30] border border-[#222F4C] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-400/20 text-amber-400 text-[10px] font-bold">
                    4S
                  </div>
                  <span className="text-slate-300 font-medium">The 4-Stage Venture Framework</span>
                </div>
                <button
                  onClick={() => onScrollTo('framework')}
                  className="text-amber-400 hover:text-amber-300 font-medium text-xs flex items-center gap-1"
                >
                  <span>Explore</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
