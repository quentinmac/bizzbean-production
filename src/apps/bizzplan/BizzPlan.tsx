import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  CheckCircle2,
  Share2,
  Building,
  User,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { BizzModelState, DEFAULT_BUSINESS_STATE } from '../bizzmodel/constants';
import { calculateFinancialModelProjections } from '../bizzmodel/utils/revenueCalc';

interface BizzPlanProps {
  theme?: 'light' | 'dark';
  onClose: () => void;
  onContextSwitch?: (appId: string, step?: string) => void;
  bizzModelState?: BizzModelState;
}

export const BizzPlan: React.FC<BizzPlanProps> = ({
  theme = 'light',
  onClose,
  onContextSwitch,
  bizzModelState,
}) => {
  const isDark = theme === 'dark';
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Active section in BizzPlan left sidebar matching video at 00:31
  const [activeSection, setActiveSection] = useState<
    | 'cover-page'
    | 'investor-pitch'
    | 'governance'
    | 'financial-reports'
    | 'business-environment'
    | 'product-category'
    | 'customers'
    | 'suppliers'
    | 'employees'
    | 'systems'
    | 'viability-scorecard'
  >('cover-page');

  // Load shared bizzmodel / bizzdynamics state from localStorage if not passed
  const activeState: BizzModelState = useMemo(() => {
    if (bizzModelState) return bizzModelState;
    try {
      const saved =
        localStorage.getItem('bizzmodel_platform_data') ||
        localStorage.getItem('bizzdynamics_platform_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return DEFAULT_BUSINESS_STATE;
  }, [bizzModelState]);

  // Financial projections pulled directly from model
  const projections = useMemo(() => {
    return calculateFinancialModelProjections(activeState, 12);
  }, [activeState]);

  // Form states
  const [companyName, setCompanyName] = useState<string>(activeState.businessDetails.businessName || 'Bizzbean Admin Headquarters');
  const [businessLocation, setBusinessLocation] = useState<string>('Johannesburg, South Africa');
  const [preparationPrincipal, setPreparationPrincipal] = useState<string>('Quentin McCullough');
  const [preparationDate, setPreparationDate] = useState<string>('2026-09-23');

  // Pitch form states
  const [executiveSummary, setExecutiveSummary] = useState<string>(
    'Bizzbean empowers growth-stage entrepreneurs with real-time financial simulation, instant unit-economic validation, and audit-ready business plans.'
  );
  const [targetMarket, setTargetMarket] = useState<string>(
    'SME founders, commercial startups, and venture acceleration cohorts seeking institutional debt and equity funding.'
  );

  const sections = [
    { id: 'cover-page', label: 'COVER PAGE' },
    { id: 'investor-pitch', label: 'INVESTOR PITCH' },
    { id: 'governance', label: 'GOVERNANCE' },
    { id: 'financial-reports', label: 'FINANCIAL REPORTS' },
    { id: 'business-environment', label: 'BUSINESS ENVIRONMENT' },
    { id: 'product-category', label: 'PRODUCT CATEGORY' },
    { id: 'customers', label: 'CUSTOMERS' },
    { id: 'suppliers', label: 'SUPPLIERS' },
    { id: 'employees', label: 'EMPLOYEES' },
    { id: 'systems', label: 'SYSTEMS' },
    { id: 'viability-scorecard', label: 'VIABILITY SCORECARD' },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    alert(`Downloading ${companyName} Official Business Plan PDF...`);
  };

  return (
    <div
      className={`w-full min-h-full flex flex-col font-mono select-none transition-colors ${
        isDark ? 'bg-[#0A0D14] text-slate-100' : 'bg-[#FAF8F5] text-slate-900'
      } ${isExpanded ? 'h-full overflow-y-auto' : ''}`}
    >
      {/* ===================================================================== */}
      {/* 1. TOP HEADER APP SWITCHER TABS (MATCHING VIDEO AT 00:31 - 00:36)     */}
      {/* ===================================================================== */}
      <header
        className={`px-4 sm:px-6 py-2.5 border-b shrink-0 flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'bizzcalc', label: 'BIZZCALC' },
            { id: 'bizzdynamics', label: 'BIZZDYNAMICS' },
            { id: 'bizzmodel', label: 'BIZZMODEL' },
            { id: 'hi-level-forecast', label: 'HI-LEVEL FORECAST' },
            { id: 'bizzplan', label: 'BIZZPLAN' },
            { id: 'print-preview', label: 'PRINT PREVIEW' },
          ].map((tab) => {
            const isSelected = tab.id === 'bizzplan';
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'print-preview') {
                    handlePrint();
                  } else if (onContextSwitch) {
                    onContextSwitch(tab.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap uppercase tracking-wider border ${
                  isSelected
                    ? isDark
                      ? 'bg-[#1E2548] text-white border-[#5584B4] shadow-xs'
                      : 'bg-[#12172A] text-white border-[#12172A] shadow-xs'
                    : isDark
                    ? 'bg-[#141A2E] text-slate-400 hover:text-white border-[#252E4A]'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-[#D8CEBC]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-[#D8CEBC] dark:border-[#252E4A] hover:bg-slate-100 dark:hover:bg-[#1E2548] text-slate-600 dark:text-slate-300 transition-colors uppercase"
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isExpanded ? 'Collapse' : 'Expand Panel'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. SUBHEADER BREADCRUMB                                               */}
      {/* ===================================================================== */}
      <div
        className={`px-4 sm:px-6 py-2 border-b flex items-center justify-between gap-3 text-xs shrink-0 ${
          isDark ? 'bg-[#0E1322] border-[#1D2644]' : 'bg-[#F4EFE6] border-[#E8E2D8]'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#5584B4] uppercase tracking-wider">
            BIZZPLAN
          </span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-600 dark:text-slate-300 uppercase">
            {activeSection.replace('-', ' ')}
          </span>
        </div>

        <div className="text-[11px] text-emerald-500 font-bold hidden sm:inline">
          ● Data Automatically Synced from BizzModel & BizzDynamics
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. MAIN BODY: LEFT SIDEBAR SECTIONS + CENTER CANVAS                   */}
      {/* ===================================================================== */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* LEFT SECTIONS SIDEBAR (Matching video at 00:31) */}
        <aside
          className={`w-52 sm:w-60 shrink-0 border-r p-3 space-y-1.5 overflow-y-auto ${
            isDark ? 'bg-[#0E1322] border-[#1D2644]' : 'bg-white border-[#D8CEBC]'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider">
            PLAN SECTIONS
          </div>

          {sections.map((sec) => {
            const isCurrent = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as any)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all truncate border ${
                  isCurrent
                    ? isDark
                      ? 'bg-[#1E2548] text-white border-[#5584B4] shadow-xs'
                      : 'bg-[#12172A] text-white border-[#12172A] shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-[#161F38] border-transparent'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#FAF8F5] border-transparent'
                }`}
              >
                {sec.label}
              </button>
            );
          })}
        </aside>

        {/* CENTER DOCUMENT CANVAS */}
        <main className="flex-grow overflow-y-auto p-4 sm:p-8 flex flex-col justify-between">
          
          {/* SECTION 1: COVER PAGE (Matching video at 00:31 - 00:35) */}
          {activeSection === 'cover-page' && (
            <div className="max-w-3xl mx-auto w-full space-y-8 my-auto py-8">
              <div className="text-center space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {companyName.toUpperCase()}
                </h1>
                <div className="text-sm font-bold text-[#5584B4] uppercase tracking-widest">
                  BUSINESS PLAN
                </div>
              </div>

              {/* Logo Box Placeholder matching video */}
              <div className="flex justify-center">
                <div className="w-40 h-28 rounded-2xl border-2 border-dashed border-[#D8CEBC] dark:border-[#252E4A] flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Building className="h-6 w-6 text-[#5584B4] mb-1" />
                  <span>COMPANY LOGO</span>
                </div>
              </div>

              {/* Document Identity Fields */}
              <div className={`p-6 rounded-2xl border space-y-4 max-w-lg mx-auto ${
                isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}>
                <div>
                  <label className="text-[11px] text-slate-400 uppercase font-bold block mb-1">
                    Business Name:
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 uppercase font-bold block mb-1">
                    Business Location:
                  </label>
                  <input
                    type="text"
                    value={businessLocation}
                    onChange={(e) => setBusinessLocation(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 uppercase font-bold block mb-1">
                      Preparation Principal:
                    </label>
                    <input
                      type="text"
                      value={preparationPrincipal}
                      onChange={(e) => setPreparationPrincipal(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 uppercase font-bold block mb-1">
                      Preparation Date:
                    </label>
                    <input
                      type="date"
                      value={preparationDate}
                      onChange={(e) => setPreparationDate(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: INVESTOR PITCH */}
          {activeSection === 'investor-pitch' && (
            <div className="max-w-3xl mx-auto w-full space-y-6">
              <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                INVESTOR PITCH & EXECUTIVE SUMMARY
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Executive Summary Narrative:</label>
                  <textarea
                    rows={4}
                    value={executiveSummary}
                    onChange={(e) => setExecutiveSummary(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-xs ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Target Market & Customer Profile:</label>
                  <textarea
                    rows={3}
                    value={targetMarket}
                    onChange={(e) => setTargetMarket(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-xs ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: FINANCIAL REPORTS (DIRECT INTEGRATION FROM BIZZMODEL) */}
          {activeSection === 'financial-reports' && (
            <div className="max-w-4xl mx-auto w-full space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white">
                  INTEGRATED FINANCIAL STATEMENTS (FROM BIZZMODEL)
                </h2>
                <span className="text-xs text-emerald-500 font-bold">
                  ✓ Automatically Synced
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#D8CEBC] dark:border-[#222F4C]">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b ${isDark ? 'bg-[#0E1322] border-[#222F4C] text-slate-400' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-600'}`}>
                    <tr>
                      <th className="p-2.5 pl-4">Metric (ZAR)</th>
                      {projections.slice(0, 6).map((p) => (
                        <th key={p.month} className="p-2.5 text-right">M{p.month}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="font-bold">
                      <td className="p-2.5 pl-4 text-emerald-500">Revenue</td>
                      {projections.slice(0, 6).map((p) => (
                        <td key={p.month} className="p-2.5 text-right">{p.revenue.toLocaleString()}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-2.5 pl-4 text-rose-400">Total Expenses</td>
                      {projections.slice(0, 6).map((p) => (
                        <td key={p.month} className="p-2.5 text-right">-{p.totalExpenses.toLocaleString()}</td>
                      ))}
                    </tr>
                    <tr className="font-bold">
                      <td className="p-2.5 pl-4">Net Profit</td>
                      {projections.slice(0, 6).map((p) => (
                        <td key={p.month} className={`p-2.5 text-right ${p.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {p.netProfit.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-2.5 pl-4 font-bold text-[#5584B4]">Closing Cash</td>
                      {projections.slice(0, 6).map((p) => (
                        <td key={p.month} className="p-2.5 text-right font-bold text-[#5584B4]">
                          {p.closingCash.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OTHER SECTIONS FALLBACK */}
          {activeSection !== 'cover-page' && activeSection !== 'investor-pitch' && activeSection !== 'financial-reports' && (
            <div className="max-w-3xl mx-auto w-full space-y-4">
              <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                {activeSection.replace('-', ' ').toUpperCase()}
              </h2>
              <p className="text-xs text-slate-500">
                Configure specific narratives, governance structures, and scorecard rubrics for {companyName}.
              </p>
              <textarea
                rows={6}
                defaultValue={`Section details and institutional due diligence notes for ${activeSection}...`}
                className={`w-full p-3 rounded-xl border text-xs ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
              />
            </div>
          )}

          {/* BOTTOM BUTTON BAR MATCHING VIDEO AT 00:31 - 00:36 */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-slate-400">
              Institutional Business Plan Format · Ready for Bank Lending & Venture Audits
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold uppercase shadow-xs transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>DOWNLOAD PDF</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white text-xs font-bold uppercase shadow-xs transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>PRINT FULL DOCUMENT</span>
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};
export default BizzPlan;
