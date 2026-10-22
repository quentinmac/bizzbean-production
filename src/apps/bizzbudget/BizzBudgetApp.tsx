import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Sliders,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface BizzBudgetAppProps {
  theme?: 'light' | 'dark';
  onBackToWorkstation?: () => void;
  onNavigateToStage?: (stageId: string, solutionId?: string) => void;
}

interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  actual: number;
  department: string;
}

export const BizzBudgetApp: React.FC<BizzBudgetAppProps> = ({
  theme = 'light',
  onBackToWorkstation,
  onNavigateToStage,
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'budget-planner' | 'variance-report' | '13-week-forecast'>('budget-planner');

  const [categories, setCategories] = useState<BudgetCategory[]>([
    { id: 'b-1', name: 'Paid Outbound & Search Acquisition', budgeted: 18000, actual: 21500, department: 'Growth' },
    { id: 'b-2', name: 'Software Engineers & Senior Contractors', budgeted: 32000, actual: 32000, department: 'Product' },
    { id: 'b-3', name: 'AWS & Database Cloud Compute', budgeted: 4500, actual: 5200, department: 'Infrastructure' },
    { id: 'b-4', name: 'Office, Co-working & Admin Facilities', budgeted: 6500, actual: 6100, department: 'G&A' },
    { id: 'b-5', name: 'Legal Counsel & Tax Governance', budgeted: 3000, actual: 2500, department: 'G&A' },
    { id: 'b-6', name: 'Customer Success & Support Tooling', budgeted: 2800, actual: 3100, department: 'Operations' },
  ]);

  const totalBudgeted = useMemo(() => categories.reduce((s, c) => s + c.budgeted, 0), [categories]);
  const totalActual = useMemo(() => categories.reduce((s, c) => s + c.actual, 0), [categories]);
  const totalVariance = totalActual - totalBudgeted;
  const variancePct = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;

  const updateBudget = (id: string, val: number) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, budgeted: val } : c)));
  };

  const updateActual = (id: string, val: number) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, actual: val } : c)));
  };

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
            { id: 'budget-planner', label: '1. Zero-Based Departmental Budget' },
            { id: 'variance-report', label: '2. Budget vs Actual Variance' },
            { id: '13-week-forecast', label: '3. Rolling 13-Week Cash Flow' },
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

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Total Budgeted</div>
          <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            ${totalBudgeted.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Approved allocations</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Actual Expenditure</div>
          <div className="font-mono text-2xl font-bold text-[#5584B4] mt-1 tabular-nums">
            ${totalActual.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Current month to date</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Budget Variance</div>
          <div className={`font-mono text-2xl font-bold mt-1 tabular-nums ${totalVariance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {totalVariance > 0 ? `+$${totalVariance.toLocaleString()}` : `-$${Math.abs(totalVariance).toLocaleString()}`}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{variancePct.toFixed(1)}% drift</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Budget Status</div>
          <div className={`font-mono text-2xl font-bold mt-1 tabular-nums ${totalVariance > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {totalVariance > 0 ? 'Overrun Warning' : 'Within Guardrails'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Automated policy checks</div>
        </div>
      </div>

      {/* Main Budget Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
        <div className="p-4 border-b border-[#D8CEBC] dark:border-[#252E4A] flex justify-between items-center">
          <span className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
            DEPARTMENTAL BUDGET VS ACTUAL ALLOCATION
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Interactive inputs: Adjust planned budget or actual spend
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className={`border-b ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-slate-400' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-600'}`}>
              <tr>
                <th className="p-3 pl-4">Budget Line Item</th>
                <th className="p-3">Department</th>
                <th className="p-3 text-right">Planned Budget ($)</th>
                <th className="p-3 text-right">Actual Spent ($)</th>
                <th className="p-3 text-right">Variance ($)</th>
                <th className="p-3 pr-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8] dark:divide-[#252E4A]">
              {categories.map((c) => {
                const diff = c.actual - c.budgeted;
                const isOver = diff > 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#161F38] transition-colors">
                    <td className="p-3 pl-4 font-bold text-slate-900 dark:text-white">{c.name}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{c.department}</td>
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        value={c.budgeted}
                        onChange={(e) => updateBudget(c.id, Number(e.target.value))}
                        className="w-24 p-1 text-right rounded border border-[#D8CEBC] dark:border-[#252E4A] bg-transparent font-bold"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        value={c.actual}
                        onChange={(e) => updateActual(c.id, Number(e.target.value))}
                        className="w-24 p-1 text-right rounded border border-[#D8CEBC] dark:border-[#252E4A] bg-transparent font-bold text-[#5584B4]"
                      />
                    </td>
                    <td className={`p-3 text-right font-bold ${isOver ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {isOver ? `+$${diff.toLocaleString()}` : `-$${Math.abs(diff).toLocaleString()}`}
                    </td>
                    <td className="p-3 pr-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        isOver
                          ? 'bg-rose-500/20 text-rose-500 border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                      }`}>
                        {isOver ? 'Over' : 'Under'}
                      </span>
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
