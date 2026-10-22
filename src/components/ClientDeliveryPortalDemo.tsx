import React, { useState } from 'react';
import { CheckCircle2, FileSpreadsheet, Presentation, FolderGit2, Video, ArrowRight, ShieldCheck, Clock, ExternalLink } from 'lucide-react';

interface ClientDeliveryPortalDemoProps {
  onOpenConsultation: () => void;
}

const DELIVERY_STEPS = [
  {
    step: '01',
    title: 'Quantitative Intake & Driver Audit',
    duration: 'Hours 0–48',
    description: 'Clients submit operational inputs through our structured intake portal. We verify unit metrics, COGS structure, and historical revenue drivers.',
    deliverable: 'Standardized Assumption Blueprint & Gap Analysis Memo',
  },
  {
    step: '02',
    title: '3-Statement Model Architecture',
    duration: 'Days 3–4',
    description: 'Bizzbean quantitative analysts build the dynamic integrated financial model with linked Income Statement, Balance Sheet, and Cash Flow.',
    deliverable: 'Dynamic 3-Statement Financial Engine in Google Sheets',
  },
  {
    step: '03',
    title: 'Sensitivity Stress-Testing & Valuation',
    duration: 'Day 5',
    description: 'We run multi-variable sensitivity tables (Bear / Base / Bull) and establish DCF and market multiple valuations.',
    deliverable: 'DCF Valuation Matrix & Cap Table Simulator',
  },
  {
    step: '04',
    title: 'Google Workspace Sync & Handover',
    duration: 'Days 6–7',
    description: 'Handover session via Google Meet. All assets synced directly into your company’s Google Drive with full formulas and macro-free ownership.',
    deliverable: 'Executive Board Pack & 90-Minute Walkthrough Video',
  },
];

const SAMPLE_DELIVERABLES = [
  {
    id: 'sheet',
    icon: FileSpreadsheet,
    title: 'Bizzbean_Financial_Engine_v4.2.gsheet',
    type: 'Google Sheets Live Sync',
    details: '36-month dynamic forecast, hiring plan, COGS driver links, automated runway tripwires.',
    status: 'Ready for Review',
    color: 'text-emerald-400',
  },
  {
    id: 'deck',
    icon: Presentation,
    title: 'Investor_Financial_Appendix_Deck.gslides',
    type: 'Google Slides Presentation',
    details: '12 institutional slides breaking down unit economics, payback periods, and capital deployment.',
    status: 'Synchronized',
    color: 'text-amber-400',
  },
  {
    id: 'vdr',
    icon: FolderGit2,
    title: 'Investor_Due_Diligence_VDR_Tree',
    type: 'Secured Google Drive Vault',
    details: 'Standard institutional folder tree with 40+ diligence items for Seed/Series A audit.',
    status: 'Verified',
    color: 'text-blue-400',
  },
];

export const ClientDeliveryPortalDemo: React.FC<ClientDeliveryPortalDemoProps> = ({ onOpenConsultation }) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedDoc, setSelectedDoc] = useState<string>('sheet');

  return (
    <section id="delivery" className="py-20 lg:py-28 border-b border-[#222F4C]/50 bg-[#0A0D14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            <span>Client Operational Architecture</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>How Services Are Delivered</span>
          </div>
          <h2 className="font-['Outfit'] text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Engineered for frictionless service delivery.
          </h2>
          <p className="mt-3 text-base text-slate-300 leading-relaxed">
            We redesigned the Bizzbean delivery workflow to eliminate traditional agency delays. From assumption audit to Google Workspace live integration, every step is automated and transparent.
          </p>
        </div>

        {/* 4-Step Sprints Pipeline */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          {DELIVERY_STEPS.map((s, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={s.step}
                onClick={() => setActiveStep(idx)}
                className={`p-5 rounded-2xl text-left border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 flex flex-col justify-between ${
                  isActive
                    ? 'bg-[#151D30] border-amber-500/50 shadow-lg shadow-black/20'
                    : 'bg-[#111726] border-[#222F4C] hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-mono text-amber-400 font-bold">{s.step}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{s.duration}</span>
                  </div>
                  <h3 className="font-['Outfit'] text-base font-bold text-white tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#222F4C] text-[11px] font-mono text-emerald-400">
                  {s.deliverable}
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive Client Workspace Preview */}
        <div className="mt-10 rounded-2xl border border-[#222F4C] bg-[#111726] p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#222F4C] gap-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h4 className="font-['Outfit'] text-lg font-bold text-white tracking-tight">
                  Live Client Deliverables Hub
                </h4>
                <p className="text-xs text-slate-400">
                  Google Workspace Shared Drive · Synced in Real Time
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Full Client Formula Ownership (No Proprietary Locks)</span>
            </div>
          </div>

          {/* Deliverables List */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {SAMPLE_DELIVERABLES.map((doc) => {
              const Icon = doc.icon;
              const isSelected = selectedDoc === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#151D30] border-amber-400/80 shadow-md'
                      : 'bg-[#0A0D14] border-[#222F4C] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`h-5 w-5 ${doc.color}`} />
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {doc.status}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white font-mono truncate">
                    {doc.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">{doc.type}</div>
                  <p className="mt-2 text-xs text-slate-300 line-clamp-2">
                    {doc.details}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Delivery Guarantee Banner */}
          <div className="mt-8 pt-6 border-t border-[#222F4C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-300 max-w-xl">
              <strong className="text-white">Fixed Delivery SLA:</strong> Every quantitative model includes 3 rounds of assumption calibration and a 90-minute recorded walkthrough video to prepare founders for investor meetings.
            </div>

            <button
              onClick={onOpenConsultation}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 whitespace-nowrap self-start sm:self-auto"
            >
              <span>Initiate Client Engagement</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
