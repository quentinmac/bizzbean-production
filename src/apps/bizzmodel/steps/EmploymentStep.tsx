import React from 'react';
import { Users, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { BizzModelState, EmploymentItem } from '../constants';

interface EmploymentStepProps {
  theme?: 'light' | 'dark';
  mode: 'bizzdynamics' | 'bizzmodel';
  state: BizzModelState;
  onUpdateState: (updater: (prev: BizzModelState) => BizzModelState) => void;
}

export const EmploymentStep: React.FC<EmploymentStepProps> = ({
  theme = 'light',
  mode,
  state,
  onUpdateState,
}) => {
  const isDark = theme === 'dark';

  const handleUpdateItem = (idx: number, patch: Partial<EmploymentItem>) => {
    onUpdateState((prev) => {
      const items = [...prev.employmentItems];
      items[idx] = { ...items[idx], ...patch };
      return { ...prev, employmentItems: items };
    });
  };

  const handleAddEmployee = () => {
    const newItem: EmploymentItem = {
      id: `emp-${Date.now()}`,
      title: 'New Key Team Member',
      department: 'administration',
      baseRateMonthly: 25000,
      startMonth: 1,
      numEmployees: 1,
      onCostPct: 15,
    };
    onUpdateState((prev) => ({
      ...prev,
      employmentItems: [...prev.employmentItems, newItem],
    }));
  };

  const handleRemoveEmployee = (idx: number) => {
    onUpdateState((prev) => ({
      ...prev,
      employmentItems: prev.employmentItems.filter((_, i) => i !== idx),
    }));
  };

  const totalMonthlyPayroll = state.employmentItems.reduce((sum, item) => {
    return sum + item.baseRateMonthly * item.numEmployees * (1 + item.onCostPct / 100);
  }, 0);

  return (
    <div className={`p-4 sm:p-6 space-y-6 font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white">
            EMPLOYMENT & HEADCOUNT CALCULATOR
          </h2>
          <p className="text-xs text-slate-500">
            Define organizational roles, monthly base compensation, start months, and payroll on-costs.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddEmployee}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold uppercase shadow-xs transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Employee Position</span>
        </button>
      </div>

      {/* Review Assumptions Card matching video at 00:51 */}
      <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
        isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-[#5584B4]">REVIEW ASSUMPTIONS:</span>
          <span className="text-xs text-slate-500">
            Current total monthly payroll run-rate:
          </span>
        </div>
        <div className="text-base font-bold text-slate-900 dark:text-white">
          R {Math.round(totalMonthlyPayroll).toLocaleString()} / month
        </div>
      </div>

      {/* Employees Grid */}
      <div className="space-y-3">
        {state.employmentItems.map((emp, idx) => {
          const itemMonthlyTotal = emp.baseRateMonthly * emp.numEmployees * (1 + emp.onCostPct / 100);
          return (
            <div
              key={emp.id}
              className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <input
                  type="text"
                  value={emp.title}
                  onChange={(e) => handleUpdateItem(idx, { title: e.target.value })}
                  className="font-bold text-sm bg-transparent border-none focus:outline-none text-slate-900 dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#5584B4]">
                    R {Math.round(itemMonthlyTotal).toLocaleString()} / mo
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmployee(idx)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                    title="Remove position"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">Base Rate / Mo:</label>
                  <input
                    type="number"
                    value={emp.baseRateMonthly}
                    onChange={(e) => handleUpdateItem(idx, { baseRateMonthly: Number(e.target.value) })}
                    className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">Start Month:</label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={emp.startMonth}
                    onChange={(e) => handleUpdateItem(idx, { startMonth: Number(e.target.value) })}
                    className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">Headcount (FTEs):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={emp.numEmployees}
                    onChange={(e) => handleUpdateItem(idx, { numEmployees: Number(e.target.value) })}
                    className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">On-Cost Taxes / Benefits (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={emp.onCostPct}
                    onChange={(e) => handleUpdateItem(idx, { onCostPct: Number(e.target.value) })}
                    className={`w-full p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
