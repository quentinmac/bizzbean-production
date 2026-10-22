import React, { useState } from 'react';
import {
  FolderLock,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Lock,
  Unlock,
  Upload,
  Download,
  Share2,
  ExternalLink,
  Users,
  Eye,
  Check,
  AlertCircle,
  Filter,
} from 'lucide-react';

interface InvestVdrAppProps {
  theme?: 'light' | 'dark';
  onBackToWorkstation?: () => void;
  onNavigateToStage?: (stageId: string, solutionId?: string) => void;
}

interface VdrDocument {
  id: string;
  folder: string;
  title: string;
  filename: string;
  status: 'verified' | 'pending' | 'missing';
  updatedAt: string;
  size: string;
  required: boolean;
}

export const InvestVdrApp: React.FC<InvestVdrAppProps> = ({
  theme = 'light',
  onBackToWorkstation,
  onNavigateToStage,
}) => {
  const isDark = theme === 'dark';

  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Documents list
  const [documents, setDocuments] = useState<VdrDocument[]>([
    {
      id: 'doc-1',
      folder: '01_corporate',
      title: 'Certificate of Incorporation & Bylaws',
      filename: 'Bizzbean_Articles_of_Incorporation_2026.pdf',
      status: 'verified',
      updatedAt: '2 days ago',
      size: '2.4 MB',
      required: true,
    },
    {
      id: 'doc-2',
      folder: '01_corporate',
      title: 'Board of Directors Resolutions & Minutes',
      filename: 'Bizzbean_Board_Minutes_Q1_2026.pdf',
      status: 'verified',
      updatedAt: '1 week ago',
      size: '1.8 MB',
      required: true,
    },
    {
      id: 'doc-3',
      folder: '02_capitalization',
      title: 'Fully Diluted Cap Table Waterfall Model',
      filename: 'Cap_Table_Waterfall_Fully_Diluted.xlsx',
      status: 'verified',
      updatedAt: 'Yesterday',
      size: '3.1 MB',
      required: true,
    },
    {
      id: 'doc-4',
      folder: '02_capitalization',
      title: 'Convertible Notes & SAFE Agreements',
      filename: 'SAFE_Agreements_Consolidated.pdf',
      status: 'verified',
      updatedAt: '3 weeks ago',
      size: '4.5 MB',
      required: false,
    },
    {
      id: 'doc-5',
      folder: '03_financials',
      title: 'Audited 3-Statement Historical Financials',
      filename: 'Financial_Statements_Audited_2024_2025.pdf',
      status: 'verified',
      updatedAt: '4 days ago',
      size: '5.2 MB',
      required: true,
    },
    {
      id: 'doc-6',
      folder: '03_financials',
      title: '36-Month Dynamic Financial Model (Macro-Free)',
      filename: 'Bizzbean_36Month_Venture_Model_v4.xlsx',
      status: 'verified',
      updatedAt: 'Today',
      size: '6.8 MB',
      required: true,
    },
    {
      id: 'doc-7',
      folder: '04_intellectual_property',
      title: 'Founder & Employee IP Assignment Agreements',
      filename: 'Proprietary_IP_Assignment_Omnibus.pdf',
      status: 'verified',
      updatedAt: '1 month ago',
      size: '1.2 MB',
      required: true,
    },
    {
      id: 'doc-8',
      folder: '04_intellectual_property',
      title: 'Trademarks & Software Copyright Filings',
      filename: 'Trademark_Registrations_Bizzbean.pdf',
      status: 'pending',
      updatedAt: 'Pending legal review',
      size: '850 KB',
      required: false,
    },
    {
      id: 'doc-9',
      folder: '05_commercial',
      title: 'Top 10 Enterprise Customer Agreements & SLAs',
      filename: 'Enterprise_Contracts_Redacted.pdf',
      status: 'verified',
      updatedAt: '5 days ago',
      size: '8.4 MB',
      required: true,
    },
    {
      id: 'doc-10',
      folder: '05_commercial',
      title: 'Customer Cohort Retention & Churn Analysis',
      filename: 'Cohort_Retention_NetExpansion_Report.csv',
      status: 'verified',
      updatedAt: 'Yesterday',
      size: '940 KB',
      required: true,
    },
    {
      id: 'doc-11',
      folder: '06_compliance',
      title: 'Tax Clearance Certificates & Filings',
      filename: 'SARS_Tax_Clearance_2026.pdf',
      status: 'verified',
      updatedAt: '2 weeks ago',
      size: '1.1 MB',
      required: true,
    },
    {
      id: 'doc-12',
      folder: '06_compliance',
      title: 'Standard Non-Disclosure Agreement (Mutual NDA)',
      filename: 'Bizzbean_Standard_Mutual_NDA_Template.pdf',
      status: 'verified',
      updatedAt: '1 month ago',
      size: '320 KB',
      required: true,
    },
  ]);

  const folders = [
    { id: 'all', name: 'All Folders', count: documents.length },
    { id: '01_corporate', name: '01 Corporate Governance', count: documents.filter((d) => d.folder === '01_corporate').length },
    { id: '02_capitalization', name: '02 Cap Table & Securities', count: documents.filter((d) => d.folder === '02_capitalization').length },
    { id: '03_financials', name: '03 Financials & Projections', count: documents.filter((d) => d.folder === '03_financials').length },
    { id: '04_intellectual_property', name: '04 IP & Proprietary Tech', count: documents.filter((d) => d.folder === '04_intellectual_property').length },
    { id: '05_commercial', name: '05 Commercial Contracts', count: documents.filter((d) => d.folder === '05_commercial').length },
    { id: '06_compliance', name: '06 Regulatory & Tax', count: documents.filter((d) => d.folder === '06_compliance').length },
  ];

  const filteredDocs = documents.filter((d) => (activeFolder === 'all' ? true : d.folder === activeFolder));
  const verifiedCount = documents.filter((d) => d.status === 'verified').length;
  const readinessPct = Math.round((verifiedCount / documents.length) * 100);

  const toggleStatus = (id: string) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const nextStatus = d.status === 'verified' ? 'pending' : d.status === 'pending' ? 'missing' : 'verified';
        return { ...d, status: nextStatus };
      })
    );
  };

  const handleShareVdr = () => {
    navigator.clipboard?.writeText('https://vdr.bizzbean.com/secure-token/apex-venture-diligence-2026');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className={`p-4 sm:p-6 space-y-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Top Diligence Status Bar */}
      <div
        className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#5584B4] uppercase tracking-wider">
              INVEST-ABILITY VDR · 40-POINT DUE DILIGENCE AUDIT
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              AUDIT READY
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white uppercase tracking-tight">
            Institutional Virtual Data Room & Diligence Gateway
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Pre-structured, institutional folder hierarchy designed to pass Tier-1 VC and institutional investor due diligence. All files watermark-protected.
          </p>
        </div>

        {/* Audit Readiness Gauge */}
        <div className="flex items-center gap-4 shrink-0">
          <div className={`p-3.5 rounded-xl border text-right ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
            <div className="text-[10px] font-mono text-slate-400 uppercase">Diligence Readiness</div>
            <div className="font-mono text-xl font-bold text-emerald-500">{readinessPct}% Complete</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{verifiedCount} of {documents.length} verified</div>
          </div>

          <button
            onClick={handleShareVdr}
            className="px-4 py-2.5 rounded-xl bg-[#5584B4] hover:bg-[#436D99] text-white font-mono font-bold text-xs uppercase flex items-center gap-2 shadow-sm transition-all"
          >
            {copiedLink ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            <span>{copiedLink ? 'Link Copied' : 'Share VDR Link'}</span>
          </button>
        </div>
      </div>

      {/* Folder Sub-navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
        {folders.map((f) => {
          const isSelected = activeFolder === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFolder(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all lowercase whitespace-nowrap flex items-center gap-2 ${
                isSelected
                  ? isDark
                    ? 'bg-[#1E2548] text-[#DDEBF7] border border-[#5584B4] shadow-xs'
                    : 'bg-[#12172A] text-white shadow-xs'
                  : isDark
                  ? 'bg-[#141A2E] text-slate-400 hover:text-white border border-[#252E4A]'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-[#D8CEBC]'
              }`}
            >
              <FolderLock className="h-3.5 w-3.5 text-[#5584B4]" />
              <span>{f.name}</span>
              <span className="text-[10px] opacity-75">({f.count})</span>
            </button>
          );
        })}
      </div>

      {/* Documents Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
        <div className="p-4 border-b border-[#D8CEBC] dark:border-[#252E4A] flex justify-between items-center">
          <span className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
            VDR DOCUMENT AUDIT MATRIX
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Click status to toggle state (Verified / Pending / Missing)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className={`border-b ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-slate-400' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-600'}`}>
              <tr>
                <th className="p-3 pl-4">Document Title & Filename</th>
                <th className="p-3">Folder Path</th>
                <th className="p-3">Size</th>
                <th className="p-3">Last Verified</th>
                <th className="p-3">Status</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8] dark:divide-[#252E4A]">
              {filteredDocs.map((doc) => {
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-[#161F38] transition-colors">
                    <td className="p-3 pl-4">
                      <div className="font-bold text-slate-900 dark:text-white">{doc.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{doc.filename}</div>
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{doc.folder}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{doc.size}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{doc.updatedAt}</td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleStatus(doc.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border transition-all ${
                          doc.status === 'verified'
                            ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                            : doc.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-500 border-rose-500/30'
                        }`}
                      >
                        {doc.status}
                      </button>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-1.5 rounded-lg border border-[#D8CEBC] dark:border-[#252E4A] hover:bg-slate-100 dark:hover:bg-[#252E4A] text-slate-600 dark:text-slate-300"
                          title="Preview Document"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg border border-[#D8CEBC] dark:border-[#252E4A] hover:bg-slate-100 dark:hover:bg-[#252E4A] text-slate-600 dark:text-slate-300"
                          title="Download Watermarked Copy"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
