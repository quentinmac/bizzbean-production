import React, { useState } from 'react';
import { SERVICE_PACKAGES } from '../data/bizzbeanData';
import { ServicePackage } from '../types';
import { ArrowRight, CheckCircle2, Clock, Layers, Sparkles, FileText, Check } from 'lucide-react';

interface ServicesCatalogProps {
  onSelectService: (serviceId: string) => void;
}

export const ServicesCatalog: React.FC<ServicesCatalogProps> = ({ onSelectService }) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [inspectingPackage, setInspectingPackage] = useState<ServicePackage | null>(null);

  const filteredPackages = SERVICE_PACKAGES.filter((pkg) => {
    if (activeFilter === 'all') return true;
    return pkg.stageId === activeFilter;
  });

  return (
    <section id="services" className="py-20 lg:py-28 border-b border-[#222F4C]/50 bg-[#0A0D14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              <span>Service Delivery Catalog</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Fixed Turnaround Sprints</span>
            </div>
            <h2 className="font-['Outfit'] text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Institutional services built for rapid client delivery.
            </h2>
            <p className="mt-3 text-base text-slate-300 leading-relaxed">
              Every engagement is delivered with structured milestones, transparent timelines, and live Google Workspace collaborative integration.
            </p>
          </div>

          {/* Interactive Filter Tabs - Button elements adhering to Section 1A */}
          <div className="flex items-center gap-1.5 p-1 bg-[#111726] border border-[#222F4C] rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                activeFilter === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Services
            </button>
            <button
              onClick={() => setActiveFilter('fundability')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                activeFilter === 'fundability'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fund-ability
            </button>
            <button
              onClick={() => setActiveFilter('viability')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                activeFilter === 'viability'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vi-ability
            </button>
            <button
              onClick={() => setActiveFilter('sustainability')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                activeFilter === 'sustainability'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sustain-ability
            </button>
            <button
              onClick={() => setActiveFilter('investability')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                activeFilter === 'investability'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Invest-ability
            </button>
          </div>
        </div>

        {/* Bento Grid layout with asymmetric prominence */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => {
            const isFeatured = pkg.isPopular;
            return (
              <div
                key={pkg.id}
                className={`rounded-2xl border bg-[#111726] p-6 sm:p-7 flex flex-col justify-between transition-all hover:border-slate-500 shadow-xl ${
                  isFeatured
                    ? 'border-amber-500/40 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-[#111726] to-[#151D30]'
                    : 'border-[#222F4C]'
                }`}
              >
                <div>
                  {/* Clean unboxed metadata header */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-semibold uppercase tracking-wider">
                        {pkg.stageId}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="flex items-center gap-1 font-mono text-slate-300">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{pkg.turnaround}</span>
                      </span>
                    </div>

                    {isFeatured && (
                      <span className="text-[11px] font-semibold text-amber-400 font-mono">
                        Flagship Quantitative Deliverable
                      </span>
                    )}
                  </div>

                  <h3 className="font-['Outfit'] text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {pkg.title}
                  </h3>

                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                    {pkg.description}
                  </p>

                  {/* Deliverables Checklist */}
                  <div className="mt-6">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Included Deliverables
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {pkg.deliverables.map((del, dIdx) => (
                        <div key={dIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{del}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Integration Tools */}
                  <div className="mt-6 pt-4 border-t border-[#222F4C]">
                    <div className="text-[11px] text-slate-400 mb-2">Integration & Workspace Formats:</div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-300 font-mono">
                      {pkg.integrationTools.map((tool, tIdx) => (
                        <span key={tIdx} className="text-slate-400">
                          {tool}
                          {tIdx < pkg.integrationTools.length - 1 && <span className="text-slate-600 ml-2">/</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Footprint */}
                <div className="mt-8 pt-5 border-t border-[#222F4C] flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-400 font-mono">
                    {pkg.startingPrice}
                  </div>

                  <button
                    onClick={() => onSelectService(pkg.id)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <span>Request Engagement</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
