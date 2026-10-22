import React, { useState } from 'react';
import { VENTURE_STAGES } from '../data/bizzbeanData';
import { VentureStageId } from '../types';
import { ArrowRight, CheckCircle, Target, TrendingUp, Layers, Sparkles } from 'lucide-react';

interface StageFrameworkProps {
  onSelectService: (serviceId: string) => void;
}

export const StageFramework: React.FC<StageFrameworkProps> = ({ onSelectService }) => {
  const [activeStageId, setActiveStageId] = useState<VentureStageId>('fundability');
  const activeStage = VENTURE_STAGES.find((s) => s.id === activeStageId) || VENTURE_STAGES[1];

  return (
    <section id="framework" className="py-20 lg:py-28 border-b border-[#222F4C]/50 bg-[#0A0D14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            <span>Methodology & Architecture</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>4-Stage Maturity Spectrum</span>
          </div>
          <h2 className="font-['Outfit'] text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight [text-wrap:balance]">
            Structured stages that guide every venture to sustainable capital.
          </h2>
          <p className="mt-4 text-base text-slate-300 leading-relaxed">
            Rather than treating business growth as arbitrary intuition, Bizzbean structures the venture journey into four discrete, quantifiable milestones. Each stage deploys dedicated financial modeling engines and operational architecture.
          </p>
        </div>

        {/* Interactive Stage Selector Controls */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 p-1.5 bg-[#111726] border border-[#222F4C] rounded-2xl">
          {VENTURE_STAGES.map((stage) => {
            const isActive = stage.id === activeStageId;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageId(stage.id)}
                className={`flex flex-col items-start p-4 rounded-xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  isActive
                    ? 'bg-[#151D30]/40 border border-amber-500/40 text-amber-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#151D30]/30 border border-transparent'
                }`}
              >
                <span className="font-mono text-xs font-semibold text-amber-400/90 mb-1">
                  {stage.index}
                </span>
                <span className="font-['Outfit'] text-lg font-bold tracking-tight">
                  {stage.name}
                </span>
                <span className="text-xs text-slate-400 mt-1 line-clamp-1">
                  {stage.tagline.split('&')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Stage Deep Dive Surface */}
        <div className="mt-8 rounded-2xl border border-[#222F4C] bg-[#111726] p-6 sm:p-10 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Stage Narrative & Deliverables */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 font-mono">
                <span className="text-amber-400 font-semibold">{activeStage.index}. Stage Blueprint</span>
                <span aria-hidden="true">·</span>
                <span>Institutional Milestone</span>
              </div>

              <h3 className="font-['Outfit'] text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {activeStage.name}: {activeStage.tagline}
              </h3>

              <p className="mt-4 text-base text-slate-300 leading-relaxed">
                {activeStage.description}
              </p>

              <div className="mt-8">
                <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-4">
                  Core Stage Deliverables Delivered to Clients
                </div>
                <div className="space-y-3">
                  {activeStage.coreDeliverables.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                        <CheckCircle className="h-3 w-3" />
                      </div>
                      <span className="text-sm text-slate-200">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#222F4C] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400">Target Benchmark</div>
                  <div className="text-sm font-semibold text-emerald-400 mt-0.5">
                    {activeStage.metricsTarget}
                  </div>
                </div>

                <button
                  onClick={() => onSelectService(activeStage.recommendedServiceId)}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <span>Request Stage Service</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right Column: Ideal Profile & Operational Card */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="rounded-xl border border-[#222F4C] bg-[#151D30] p-6">
                <div className="flex items-center gap-2 text-xs font-medium text-amber-400 mb-2">
                  <Target className="h-4 w-4" />
                  <span>Ideal Venture Profile</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activeStage.idealFor}
                </p>
              </div>

              <div className="rounded-xl border border-[#222F4C] bg-[#0A0D14] p-6">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span className="font-semibold text-slate-200">How Bizzbean Delivers</span>
                  <span className="font-mono text-amber-400">Fixed Turnaround</span>
                </div>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex justify-between py-1.5 border-b border-[#222F4C]">
                    <span className="text-slate-400">Execution Mode</span>
                    <span className="font-medium text-slate-200">Collaborative Sprint</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#222F4C]">
                    <span className="text-slate-400">Cloud Platform</span>
                    <span className="font-medium text-slate-200">Google Workspace Sync</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Asset Handover</span>
                    <span className="font-medium text-slate-200">Full Model Ownership</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
