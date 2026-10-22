import React, { useState } from 'react';
import { MASTERCLASSES } from '../data/bizzbeanData';
import { MasterclassItem } from '../types';
import { Play, Download, Clock, ArrowRight, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';

interface MasterclassVaultProps {
  onOpenResource: (item: MasterclassItem) => void;
}

export const MasterclassVault: React.FC<MasterclassVaultProps> = ({ onOpenResource }) => {
  const [selectedItem, setSelectedItem] = useState<MasterclassItem | null>(null);

  const handleOpen = (item: MasterclassItem) => {
    setSelectedItem(item);
    onOpenResource(item);
  };

  return (
    <section id="masterclasses" className="py-20 lg:py-28 border-b border-[#222F4C]/50 bg-[#0A0D14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            <span>Client Knowledge Base</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Masterclasses & Model Vault</span>
          </div>
          <h2 className="font-['Outfit'] text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Institutional methodologies distilled for entrepreneurs.
          </h2>
          <p className="mt-3 text-base text-slate-300 leading-relaxed">
            Gain immediate access to our quantitative frameworks, DCF construction walkthroughs, and operational runway safeguards used across all client engagements.
          </p>
        </div>

        {/* Masterclasses Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {MASTERCLASSES.map((mc) => (
            <div
              key={mc.id}
              className="rounded-2xl border border-[#222F4C] bg-[#111726] p-6 sm:p-7 flex flex-col justify-between hover:border-slate-500 transition-all shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-semibold uppercase tracking-wider">
                      Stage: {mc.stageId}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="flex items-center gap-1 font-mono text-slate-300">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{mc.duration}</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {mc.format}
                  </span>
                </div>

                <h3 className="font-['Outfit'] text-xl font-bold text-white tracking-tight leading-snug">
                  {mc.title}
                </h3>

                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  {mc.description}
                </p>

                <div className="mt-5 p-3 rounded-xl bg-[#0A0D14] border border-[#222F4C] text-xs text-slate-300">
                  <span className="font-semibold text-amber-400">Key Takeaway / Deliverable: </span>
                  <span>{mc.takeaway}</span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-[#222F4C] flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  By {mc.instructor}
                </span>

                <button
                  onClick={() => handleOpen(mc)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Play className="h-3 w-3 fill-slate-950" />
                  <span>Access Masterclass</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
