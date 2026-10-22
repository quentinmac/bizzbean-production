import React, { useState, useEffect } from 'react';
import { SERVICE_PACKAGES, VENTURE_STAGES } from '../data/bizzbeanData';
import { FinancialModelInputs, VentureStageId } from '../types';
import { X, CheckCircle2, ArrowRight, ShieldCheck, Mail, Send, Copy, Check } from 'lucide-react';
import { formatCurrency } from '../utils/financialCalculations';

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialServiceId?: string;
  initialStageId?: VentureStageId;
  initialModelData?: FinancialModelInputs | null;
}

export const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({
  isOpen,
  onClose,
  initialServiceId,
  initialStageId,
  initialModelData,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Tech & Software');
  const [selectedStage, setSelectedStage] = useState<VentureStageId>(initialStageId || 'fundability');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    initialServiceId || 'financial-model-engine'
  );
  const [timeframe, setTimeframe] = useState('Next 14 Days');
  const [projectScope, setProjectScope] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [inquiryCode, setInquiryCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialServiceId) setSelectedServiceId(initialServiceId);
    if (initialStageId) setSelectedStage(initialStageId);
  }, [initialServiceId, initialStageId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !email.includes('@')) {
      return;
    }

    const code = `BB-${Math.floor(100000 + Math.random() * 900000)}`;
    setInquiryCode(code);
    setSubmitted(true);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(
      `Bizzbean Inquiry ${inquiryCode}\nClient: ${name} (${companyName})\nEmail: ${email}\nService: ${selectedServiceId}\nStage: ${selectedStage}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#222F4C] bg-[#111726] p-6 sm:p-8 shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#151D30] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1 font-mono">
              <span>Client Service Intake</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Direct Advisory Channel</span>
            </div>

            <h3 className="font-['Outfit'] text-2xl font-bold text-white tracking-tight">
              Request Bizzbean Client Engagement
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-slate-300">
              Submit your venture specifications. Our team reviews inputs and confirms scheduling within 24 business hours.
            </p>

            {/* Model Data Pre-fill Notice if available */}
            {initialModelData && (
              <div className="mt-4 p-3 rounded-xl bg-[#0A0D14] border border-amber-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-slate-300">
                    Preloaded Sandbox Inputs: Monthly Rev {formatCurrency(initialModelData.currentMonthlyRevenue, initialModelData.currency)}, OpEx {formatCurrency(initialModelData.monthlyOpEx, initialModelData.currency)}
                  </span>
                </div>
                <span className="font-mono text-amber-400 text-[11px]">Attached to Request</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Elena Vance"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0D14] border border-[#222F4C] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0D14] border border-[#222F4C] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Venture / Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Dynamics"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0D14] border border-[#222F4C] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Industry Sector
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0D14] border border-[#222F4C] text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option>Tech & Software (SaaS / B2B)</option>
                    <option>Fintech & Financial Services</option>
                    <option>HealthTech & Life Sciences</option>
                    <option>E-Commerce, Retail & FMCG</option>
                    <option>CleanTech & Energy</option>
                    <option>Industrial, Logistics & Hardware</option>
                    <option>Other Emerging Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Target Venture Stage
                  </label>
                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value as VentureStageId)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0D14] border border-[#222F4C] text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    {VENTURE_STAGES.map((stg) => (
                      <option key={stg.id} value={stg.id}>
                        {stg.index}. {stg.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Primary Service Deliverable
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0D14] border border-[#222F4C] text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    {SERVICE_PACKAGES.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Project Scope & Specific Questions
                </label>
                <textarea
                  rows={3}
                  value={projectScope}
                  onChange={(e) => setProjectScope(e.target.value)}
                  placeholder="Detail your current financing round target, burn rate concerns, or specific Google Workspace modeling needs..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0D14] border border-[#222F4C] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Strict NDA and data confidentiality guaranteed</span>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Service Intake</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Confirmation View */
          <div className="text-center py-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
              Inquiry Dispatched Successfully
            </div>

            <h3 className="font-['Outfit'] text-2xl font-bold text-white tracking-tight">
              Thank you, {name}
            </h3>

            <p className="mt-3 text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Your service intake for <strong className="text-white">{companyName || 'your venture'}</strong> has been received by our lead advisory team.
            </p>

            {/* Reference Box */}
            <div className="mt-6 p-4 rounded-xl bg-[#0A0D14] border border-[#222F4C] max-w-sm mx-auto flex items-center justify-between">
              <div className="text-left">
                <div className="text-[10px] text-slate-500 font-mono">Reference Tracking ID</div>
                <div className="font-mono text-base font-bold text-amber-400">{inquiryCode}</div>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-[#151D30] hover:bg-[#1C263E] border border-[#222F4C] rounded-lg transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Official dispatch channel: <span className="text-slate-300 font-mono">thebizzbeanchannel@gmail.com</span>
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="px-6 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
              >
                Done & Return to Platform
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
