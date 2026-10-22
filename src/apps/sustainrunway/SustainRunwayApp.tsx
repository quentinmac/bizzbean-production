import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  Clock,
  AlertTriangle,
  ShieldCheck,
  DollarSign,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Sliders,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { formatCurrency } from '../../utils/financialCalculations';

interface SustainRunwayAppProps {
  theme?: 'light' | 'dark';
  onBackToWorkstation?: () => void;
  onNavigateToStage?: (stageId: string, solutionId?: string) => void;
}

export const SustainRunwayApp: React.FC<SustainRunwayAppProps> = ({
  theme = 'light',
  onBackToWorkstation,
  onNavigateToStage,
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'runway-alarm' | 'working-capital' | 'cost-cutting' | 'scenarios'>('runway-alarm');

  // Core financial states
  const [cashBalance, setCashBalance] = useState<number>(320000);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(45000);
  const [monthlyOpEx, setMonthlyOpEx] = useState<number>(75000);
  const [debtorDays, setDebtorDays] = useState<number>(48); // Accounts receivable lag
  const [creditorDays, setCreditorDays] = useState<number>(28); // Accounts payable lag
  const [discretionarySpend, setDiscretionarySpend] = useState<number>(14000);

  // Levers
  const [cutSaaS, setCutSaaS] = useState<boolean>(false);
  const [cutContractors, setCutContractors] = useState<boolean>(false);
  const [accelerateCollections, setAccelerateCollections] = useState<boolean>(false);

  // Calculations
  const grossBurn = monthlyOpEx;
  const netBurn = Math.max(0, monthlyOpEx - monthlyRevenue);

  // Additional savings from levers
  const leverSavings = useMemo(() => {
    let savings = 0;
    if (cutSaaS) savings += 4500;
    if (cutContractors) savings += 8000;
    return savings;
  }, [cutSaaS, cutContractors]);

  const effectiveNetBurn = Math.max(1000, netBurn - leverSavings);
  const baselineRunwayMonths = netBurn > 0 ? cashBalance / netBurn : 99;
  const optimizedRunwayMonths = cashBalance / effectiveNetBurn;

  // Working capital trapped cash
  const effectiveDebtorDays = accelerateCollections ? Math.max(15, debtorDays - 20) : debtorDays;
  const daysDifference = Math.max(0, effectiveDebtorDays - creditorDays);
  const trappedCash = Math.round((monthlyRevenue / 30) * daysDifference);

  // Runway date calculation
  const zeroCashDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + Math.round(optimizedRunwayMonths));
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [optimizedRunwayMonths]);

  return (
    <div className={`p-4 sm:p-6 space-y-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Top Module Sub-Navigation */}
      <div
        className={`p-1.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 shrink-0 ${
          isDark ? 'bg-[#12172A] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'runway-alarm', label: '1. Cash Runway & Burn Alarm' },
            { id: 'working-capital', label: '2. Working Capital & Debtor Lag' },
            { id: 'cost-cutting', label: '3. Discretionary Expense Levers' },
            { id: 'scenarios', label: '4. Stress-Test Sensitivity' },
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

      {/* Top Runway KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Effective Runway</div>
          <div className="font-mono text-2xl font-bold text-amber-500 mt-1 tabular-nums">
            {optimizedRunwayMonths.toFixed(1)} Months
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero-cash date: {zeroCashDate}</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Net Monthly Burn</div>
          <div className="font-mono text-2xl font-bold text-rose-500 mt-1 tabular-nums">
            ${effectiveNetBurn.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Post-lever monthly drain</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Trapped Working Capital</div>
          <div className="font-mono text-2xl font-bold text-[#5584B4] mt-1 tabular-nums">
            ${trappedCash.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Debtor vs Creditor gap</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Cash Buffer</div>
          <div className="font-mono text-2xl font-bold text-emerald-500 mt-1 tabular-nums">
            ${cashBalance.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Liquid bank reserves</div>
        </div>
      </div>

      {/* Main Interactive Work Area */}
      {activeTab === 'runway-alarm' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Controls */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
              CASH RESERVES & BURN CONTROLS
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">Bank Cash Balance:</span>
                <span className="font-bold">${cashBalance.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="50000"
                max="1000000"
                step="10000"
                value={cashBalance}
                onChange={(e) => setCashBalance(Number(e.target.value))}
                className="w-full accent-[#5584B4]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">Monthly Operating Expenses (OpEx):</span>
                <span className="font-bold">${monthlyOpEx.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="20000"
                max="250000"
                step="5000"
                value={monthlyOpEx}
                onChange={(e) => setMonthlyOpEx(Number(e.target.value))}
                className="w-full accent-[#5584B4]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">Monthly Cash Inflows (Revenue):</span>
                <span className="font-bold">${monthlyRevenue.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max="200000"
                step="5000"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                className="w-full accent-[#5584B4]"
              />
            </div>
          </div>

          {/* Runway Extension Levers */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
              RUNWAY EXTENSION LEVERS
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl border border-dashed border-[#D8CEBC] dark:border-[#252E4A] cursor-pointer">
                <div>
                  <div className="text-xs font-bold font-mono">Pause Non-Essential SaaS Subscriptions</div>
                  <div className="text-[11px] text-slate-500">Trims redundant seats and secondary tools</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-500 font-bold">+$4,500/mo</span>
                  <input
                    type="checkbox"
                    checked={cutSaaS}
                    onChange={(e) => setCutSaaS(e.target.checked)}
                    className="accent-emerald-500 h-4 w-4"
                  />
                </div>
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-dashed border-[#D8CEBC] dark:border-[#252E4A] cursor-pointer">
                <div>
                  <div className="text-xs font-bold font-mono">Pause External Agency Retainers</div>
                  <div className="text-[11px] text-slate-500">Brings content & outbound sprints in-house</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-500 font-bold">+$8,000/mo</span>
                  <input
                    type="checkbox"
                    checked={cutContractors}
                    onChange={(e) => setCutContractors(e.target.checked)}
                    className="accent-emerald-500 h-4 w-4"
                  />
                </div>
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-dashed border-[#D8CEBC] dark:border-[#252E4A] cursor-pointer">
                <div>
                  <div className="text-xs font-bold font-mono">Enforce Net-15 Invoicing with Early Pay Rebates</div>
                  <div className="text-[11px] text-slate-500">Accelerates receivables collections by 20 days</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#5584B4] font-bold">Free up trapped cash</span>
                  <input
                    type="checkbox"
                    checked={accelerateCollections}
                    onChange={(e) => setAccelerateCollections(e.target.checked)}
                    className="accent-[#5584B4] h-4 w-4"
                  />
                </div>
              </label>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-500">
              Runway Extended by +{(optimizedRunwayMonths - baselineRunwayMonths).toFixed(1)} Months with Active Levers.
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: WORKING CAPITAL */}
      {activeTab === 'working-capital' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
            RECEIVABLES LAG VS CREDITORS VELOCITY
          </h3>
          <p className="text-xs text-slate-500">
            When customer payment terms (Days Sales Outstanding) exceed your supplier payment window (Days Payable Outstanding), enterprise working capital is drained into unpaid receivables.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">Debtor Days (DSO - Client Payment Lag):</span>
                <span className="font-bold">{debtorDays} Days</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={debtorDays}
                onChange={(e) => setDebtorDays(Number(e.target.value))}
                className="w-full accent-[#5584B4]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">Creditor Days (DPO - Supplier Window):</span>
                <span className="font-bold">{creditorDays} Days</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={creditorDays}
                onChange={(e) => setCreditorDays(Number(e.target.value))}
                className="w-full accent-[#5584B4]"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-dashed border-[#D8CEBC] dark:border-[#252E4A] flex justify-between items-center text-xs font-mono">
            <span>Capital Locked in Invoices:</span>
            <span className="text-lg font-bold text-amber-500">${trappedCash.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* MODULE 3: COST CUTTING */}
      {activeTab === 'cost-cutting' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
            DISCRETIONARY OPEX EXPENSE AUDIT
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] space-y-2">
              <div className="text-xs font-bold font-mono">SaaS Stack Cleanse</div>
              <div className="text-xs text-slate-500">Identify unassigned enterprise seats, duplicate storage tools, and auto-renewals.</div>
              <div className="font-mono text-sm font-bold text-emerald-500">Target trim: 22%</div>
            </div>

            <div className="p-4 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] space-y-2">
              <div className="text-xs font-bold font-mono">Marketing Efficiency Audit</div>
              <div className="text-xs text-slate-500">Trim ad spend on sub-1.5x payback channels and focus purely on high-intent inbound.</div>
              <div className="font-mono text-sm font-bold text-emerald-500">Target trim: 35%</div>
            </div>

            <div className="p-4 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] space-y-2">
              <div className="text-xs font-bold font-mono">Vendor Contract Re-negotiation</div>
              <div className="text-xs text-slate-500">Shift key annual cloud contracts to reserved instance quarterly prepayment discounts.</div>
              <div className="font-mono text-sm font-bold text-emerald-500">Target trim: 18%</div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 4: SCENARIOS */}
      {activeTab === 'scenarios' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
            VENTURE STRESS TEST SCENARIOS
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 space-y-1">
              <div className="font-bold text-xs font-mono uppercase">Worst Case: Zero Growth</div>
              <div className="text-xs opacity-90">Revenue stays at current level. Runway: {(cashBalance / monthlyOpEx).toFixed(1)} mo.</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 space-y-1">
              <div className="font-bold text-xs font-mono uppercase">Base Case: 10% MoM Growth</div>
              <div className="text-xs opacity-90">Runway extends to {optimizedRunwayMonths.toFixed(1)} mo with active cost levers.</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 space-y-1">
              <div className="font-bold text-xs font-mono uppercase">Bridge Secured: +$250k</div>
              <div className="text-xs opacity-90">Runway increases to {((cashBalance + 250000) / effectiveNetBurn).toFixed(1)} mo.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
