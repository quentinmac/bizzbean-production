import React from 'react';
import { QUANTIFIED_CASE_PROOFS } from '../data/bizzbeanData';
import { CheckCircle2, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';

interface CaseProofSectionProps {
  onOpenConsultation: () => void;
}

export const CaseProofSection: React.FC<CaseProofSectionProps> = ({ onOpenConsultation }) => {
  return (
    <section className="py-20 lg:py-24 border-b border-[#222F4C]/50 bg-[#0A0D14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            <span>Verified Track Record</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Measurable Client Outcomes</span>
          </div>
          <h2 className="font-['Outfit'] text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Proof of impact across institutional milestones.
          </h2>
          <p className="mt-3 text-base text-slate-300 leading-relaxed">
            Every engagement delivers tangible balance sheet strength, extended runway, and investor conviction backed by quantitative rigor.
          </p>
        </div>

        {/* Quantified Proof Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {QUANTIFIED_CASE_PROOFS.map((proof, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[#222F4C] bg-[#111726] p-6 sm:p-7 flex flex-col justify-between shadow-xl"
            >
              <div>
                {/* Metric */}
                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-amber-400 tabular-nums tracking-tight">
                  {proof.metric}
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  {proof.metricLabel}
                </div>
                
                {/* Unboxed Metadata */}
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 font-mono">
                  <span>{proof.clientContext}</span>
                  <span aria-hidden="true">·</span>
                  <span>{proof.timeframe}</span>
                </div>

                <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {proof.details}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#222F4C] flex items-center justify-between text-xs text-slate-400">
                <span>Verified Deliverable</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          ))}
        </div>

        {/* Ecosystem Callout */}
        <div className="mt-12 rounded-2xl border border-amber-500/20 bg-[#151D30] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="max-w-2xl">
            <h3 className="font-['Outfit'] text-xl font-bold text-white tracking-tight">
              Ready to construct your institutional financial model?
            </h3>
            <p className="mt-1 text-sm text-slate-300 leading-relaxed">
              Join leading entrepreneurs who have accelerated their path from Vi-ability to Invest-ability with Bizzbean.
            </p>
          </div>

          <button
            onClick={onOpenConsultation}
            className="flex items-center gap-2 px-6 py-3 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 whitespace-nowrap self-start md:self-auto"
          >
            <span>Schedule Discovery Call</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>
    </section>
  );
};
