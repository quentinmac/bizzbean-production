import React, { useState } from 'react';
import {
  FileText,
  PieChart,
  ShieldAlert,
  Sparkles,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Share2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { UserBusinessProfile } from '../../types';

interface BizzPlanAppProps {
  theme?: 'light' | 'dark';
  userProfile?: UserBusinessProfile;
  onBackToWorkstation?: () => void;
  onNavigateToStage?: (stageId: string, solutionId?: string) => void;
}

export const BizzPlanApp: React.FC<BizzPlanAppProps> = ({
  theme = 'light',
  userProfile,
  onBackToWorkstation,
  onNavigateToStage,
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<
    'executive-memo' | 'cap-table' | 'risk-matrix' | 'pitch-appendix'
  >('executive-memo');

  // Executive Memo content
  const [companyName, setCompanyName] = useState<string>(userProfile?.companyName || 'Apex Cloud Dynamics');
  const [problemStatement, setProblemStatement] = useState<string>(
    'Founders lack institutional financial modeling, causing 70% of venture applications to fail investor diligence due to unverified unit economics.'
  );
  const [solutionStatement, setSolutionStatement] = useState<string>(
    'The bizz-DESK 4-stage acceleration cockpit transforms raw business ideas into audit-ready 3-statement models with dynamic driver dials.'
  );
  const [moatStatement, setMoatStatement] = useState<string>(
    'Proprietary integration of Gemini AI socratic coaching, macro-free Google Sheets synchronization, and double-entry accounting ledgers.'
  );
  const [capitalAsk, setCapitalAsk] = useState<number>(500000);
  const [valuationCap, setValuationCap] = useState<number>(4500000);

  // Cap table stakes
  const [founderPct, setFounderPct] = useState<number>(75);
  const [optionPoolPct, setOptionPoolPct] = useState<number>(10);
  const [investorPct, setInvestorPct] = useState<number>(15);

  const [copied, setCopied] = useState<boolean>(false);
  const handleCopyMemo = () => {
    const text = `EXECUTIVE MEMORANDUM · ${companyName.toUpperCase()}\n\n1. PROBLEM HYPOTHESIS:\n${problemStatement}\n\n2. VALIDATED SOLUTION:\n${solutionStatement}\n\n3. COMPETITIVE MOAT:\n${moatStatement}\n\n4. CAPITAL ALLOCATION ASK:\n$${capitalAsk.toLocaleString()} on a $${valuationCap.toLocaleString()} Valuation Cap.\n\nPrepared via Bizzbean bizzplan Suite.`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={`p-4 sm:p-6 space-y-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Module sub-navigation tabs */}
      <div
        className={`p-1.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 shrink-0 ${
          isDark ? 'bg-[#12172A] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'executive-memo', label: '1. Executive Memorandum Synthesizer' },
            { id: 'cap-table', label: '2. Cap Table Waterfall & Dilution' },
            { id: 'risk-matrix', label: '3. Venture Risk Defense Matrix' },
            { id: 'pitch-appendix', label: '4. Pitch Deck Financial Appendix' },
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

      {/* MODULE 1: EXECUTIVE MEMORANDUM */}
      {activeTab === 'executive-memo' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Inputs Section */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
              <span className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
                Venture Narrative Parameters
              </span>
              <span className="text-[10px] font-mono text-[#5584B4]">Socratic Synthesis</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                  Company / Venture Name:
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                  1. Problem Hypothesis & Market Friction:
                </label>
                <textarea
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  rows={2}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                  2. Validated Solution & Product Moat:
                </label>
                <textarea
                  value={solutionStatement}
                  onChange={(e) => setSolutionStatement(e.target.value)}
                  rows={2}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                  3. Defensible Competitive Edge:
                </label>
                <textarea
                  value={moatStatement}
                  onChange={(e) => setMoatStatement(e.target.value)}
                  rows={2}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                    Capital Ask ($):
                  </label>
                  <input
                    type="number"
                    value={capitalAsk}
                    onChange={(e) => setCapitalAsk(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1">
                    Valuation Cap ($):
                  </label>
                  <input
                    type="number"
                    value={valuationCap}
                    onChange={(e) => setValuationCap(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Formatted Preview Card */}
          <div className={`p-5 rounded-2xl border space-y-4 flex flex-col justify-between ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
                <div>
                  <span className="font-mono text-xs font-bold uppercase text-[#5584B4]">
                    INSTITUTIONAL MEMORANDUM
                  </span>
                  <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-white uppercase mt-0.5">
                    {companyName}
                  </h3>
                </div>
                <button
                  onClick={handleCopyMemo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#5584B4] hover:bg-[#4773A0] text-white transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Memo'}</span>
                </button>
              </div>

              <div className={`p-4 rounded-xl border space-y-3 text-xs font-mono ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
                <div>
                  <span className="text-[#5584B4] font-bold block uppercase text-[10px]">1. Problem Hypothesis:</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{problemStatement}</p>
                </div>

                <div>
                  <span className="text-[#5584B4] font-bold block uppercase text-[10px]">2. Solution & Product Moat:</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{solutionStatement}</p>
                </div>

                <div>
                  <span className="text-[#5584B4] font-bold block uppercase text-[10px]">3. Competitive Defensibility:</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{moatStatement}</p>
                </div>

                <div className="pt-2 border-t border-[#E8E2D8] dark:border-[#252E4A] flex justify-between items-center text-[11px]">
                  <span>Round Ask: <strong className="text-slate-900 dark:text-white">${capitalAsk.toLocaleString()}</strong></span>
                  <span>Post-Money Cap: <strong className="text-slate-900 dark:text-white">${valuationCap.toLocaleString()}</strong></span>
                  <span>Dilution: <strong className="text-[#5584B4]">{((capitalAsk / valuationCap) * 100).toFixed(1)}%</strong></span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono text-right">
              Formatted according to V2 Institutional Due Diligence standards.
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: CAP TABLE WATERFALL */}
      {activeTab === 'cap-table' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
            <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
              Cap Table Waterfall & Multi-Tranche Dilution Simulator
            </h3>
            <span className="font-mono text-xs font-bold text-emerald-500">
              Total Equity: 100.0%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>Founders & Common Stock:</span>
                <span className="font-bold">{founderPct}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="90"
                step="1"
                value={founderPct}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFounderPct(val);
                  setInvestorPct(Math.max(0, 100 - val - optionPoolPct));
                }}
                className="w-full accent-[#5584B4]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>ESOP Employee Option Pool:</span>
                <span className="font-bold">{optionPoolPct}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={optionPoolPct}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setOptionPoolPct(val);
                  setInvestorPct(Math.max(0, 100 - founderPct - val));
                }}
                className="w-full accent-[#5584B4]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>Lead Investors (Seed / Pre-Seed):</span>
                <span className="font-bold">{investorPct}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={investorPct}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setInvestorPct(val);
                  setFounderPct(Math.max(0, 100 - val - optionPoolPct));
                }}
                className="w-full accent-[#5584B4]"
              />
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-[#E8E2D8] dark:border-[#252E4A] text-slate-400">
                  <th className="text-left py-2">Shareholder Tranche</th>
                  <th className="text-right py-2">Ownership %</th>
                  <th className="text-right py-2">Implied Value ($4.5M Cap)</th>
                  <th className="text-right py-2">Exit Payout ($25M Exit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8] dark:divide-[#252E4A]">
                <tr>
                  <td className="py-2.5 font-bold text-slate-900 dark:text-white">Founding Team</td>
                  <td className="py-2.5 text-right font-bold text-[#5584B4]">{founderPct}%</td>
                  <td className="py-2.5 text-right">${((4500000 * founderPct) / 100).toLocaleString()}</td>
                  <td className="py-2.5 text-right text-emerald-500 font-bold">${((25000000 * founderPct) / 100).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-slate-900 dark:text-white">Employee Option Pool (ESOP)</td>
                  <td className="py-2.5 text-right font-bold text-amber-500">{optionPoolPct}%</td>
                  <td className="py-2.5 text-right">${((4500000 * optionPoolPct) / 100).toLocaleString()}</td>
                  <td className="py-2.5 text-right text-emerald-500 font-bold">${((25000000 * optionPoolPct) / 100).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-slate-900 dark:text-white">Seed Venture Investors</td>
                  <td className="py-2.5 text-right font-bold text-slate-600 dark:text-slate-300">{investorPct}%</td>
                  <td className="py-2.5 text-right">${((4500000 * investorPct) / 100).toLocaleString()}</td>
                  <td className="py-2.5 text-right text-emerald-500 font-bold">${((25000000 * investorPct) / 100).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 3: RISK MATRIX */}
      {activeTab === 'risk-matrix' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
            <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
              Venture Risk Defense & Blindspot Stress Test
            </h3>
            <span className="text-[10px] font-mono text-[#5584B4]">Socratic Investor Defense</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
              <div className="text-rose-500 font-bold uppercase text-[10px]">1. Customer Concentration Risk</div>
              <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Mitigation: Enforce revenue diversification policy where no single enterprise client exceeds 18% of monthly recurring revenue.
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
              <div className="text-amber-500 font-bold uppercase text-[10px]">2. CAC Inflation & Payback Drift</div>
              <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Mitigation: Bound paid acquisition channels to maximum 8-month payback; scale partner ecosystem channels when paid CAC exceeds threshold.
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
              <div className="text-emerald-500 font-bold uppercase text-[10px]">3. Key Person & IP Assignment</div>
              <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Mitigation: 100% of proprietary code, schemas, and patents assigned to company entity with standard 4-year founder vesting schedule.
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
              <div className="text-[#5584B4] font-bold uppercase text-[10px]">4. Regulatory & Data Governance</div>
              <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Mitigation: Institutional Virtual Data Room (VDR) verified annually with clean corporate secretarial and tax clearance certificates.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 4: PITCH APPENDIX */}
      {activeTab === 'pitch-appendix' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#252E4A]">
            <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
              Pitch Deck Quantitative Appendix Slides
            </h3>
            <span className="text-[10px] font-mono text-[#5584B4]">Investor Teaser Format</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
              <div className="text-slate-400 uppercase text-[10px]">Slide 1: Unit Economics</div>
              <div className="font-bold text-slate-900 dark:text-white mt-1">CAC: $450 · LTV: $1,600</div>
              <div className="text-emerald-500 mt-1">LTV : CAC = 3.5x Ratio</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
              <div className="text-slate-400 uppercase text-[10px]">Slide 2: Capital Deployment</div>
              <div className="font-bold text-slate-900 dark:text-white mt-1">${capitalAsk.toLocaleString()} Pre-Seed</div>
              <div className="text-[#5584B4] mt-1">55% Engineering · 35% GTM · 10% Reserve</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'}`}>
              <div className="text-slate-400 uppercase text-[10px]">Slide 3: Break-Even Horizon</div>
              <div className="font-bold text-slate-900 dark:text-white mt-1">Month 14 Runway Milestone</div>
              <div className="text-amber-500 mt-1">$45k MRR crossing zero net burn</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
