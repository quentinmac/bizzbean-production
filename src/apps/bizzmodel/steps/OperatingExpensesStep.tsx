import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BizzModelState, ExpenseItem, STANDARD_OPEX_NAMES } from '../constants';
import { PREDEFINED_EXPENSES_TAXONOMY } from '../data/predefinedExpenses';

interface OperatingExpensesStepProps {
  theme?: 'light' | 'dark';
  mode: 'bizzdynamics' | 'bizzmodel';
  state: BizzModelState;
  onUpdateState: (updater: (prev: BizzModelState) => BizzModelState) => void;
}

export const OperatingExpensesStep: React.FC<OperatingExpensesStepProps> = ({
  theme = 'light',
  mode,
  state,
  onUpdateState,
}) => {
  const isDark = theme === 'dark';

  const handleUpdateExpense = (idx: number, patch: Partial<ExpenseItem>) => {
    onUpdateState((prev) => {
      const expenses = [...prev.expenses];
      expenses[idx] = { ...expenses[idx], ...patch };
      return { ...prev, expenses };
    });
  };

  const handleAddCustomExpense = () => {
    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      category: 'General & Administrative',
      name: 'New Operating Expense',
      monthlyAmount: 3500,
      startMonth: 1,
      growthRatePct: 0,
    };
    onUpdateState((prev) => ({
      ...prev,
      expenses: [...prev.expenses, newExp],
    }));
  };

  const handleAddPredefined = (name: string, category: string, amount: number) => {
    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      category,
      name,
      monthlyAmount: amount,
      startMonth: 1,
      growthRatePct: 0,
    };
    onUpdateState((prev) => ({
      ...prev,
      expenses: [...prev.expenses, newExp],
    }));
  };

  const handleRemoveExpense = (idx: number) => {
    onUpdateState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((_, i) => i !== idx),
    }));
  };

  const totalMonthlyOpex = state.expenses.reduce((sum, e) => sum + e.monthlyAmount, 0);

  return (
    <div className={`p-4 sm:p-6 space-y-6 font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white">
            OPERATING EXPENSES (OPEX) BREAKDOWN
          </h2>
          <p className="text-xs text-slate-500">
            Current total monthly OPEX run-rate: R {Math.round(totalMonthlyOpex).toLocaleString()} / month.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddCustomExpense}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold uppercase shadow-xs transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Custom Line Item</span>
        </button>
      </div>

      {/* Current Active Expenses Table */}
      <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
        <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block pb-2 border-b border-slate-200 dark:border-slate-800">
          SCHEDULE OF RECURRING EXPENSES
        </span>

        <div className="space-y-2.5">
          {state.expenses.map((exp, idx) => (
            <div
              key={exp.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
            >
              <div className="sm:col-span-5">
                <input
                  type="text"
                  value={exp.name}
                  onChange={(e) => handleUpdateExpense(idx, { name: e.target.value })}
                  className="w-full font-bold bg-transparent border-none focus:outline-none text-slate-900 dark:text-white"
                />
                <div className="text-[10px] text-slate-400">{exp.category}</div>
              </div>

              <div className="sm:col-span-3">
                <label className="text-[10px] text-slate-400 block mb-0.5">Monthly Amount (ZAR / $):</label>
                <input
                  type="number"
                  value={exp.monthlyAmount}
                  onChange={(e) => handleUpdateExpense(idx, { monthlyAmount: Number(e.target.value) })}
                  className={`w-full p-1.5 rounded-lg border text-xs font-bold ${isDark ? 'bg-[#161C30] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[10px] text-slate-400 block mb-0.5">Start Month (1-36):</label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={exp.startMonth}
                  onChange={(e) => handleUpdateExpense(idx, { startMonth: Number(e.target.value) })}
                  className={`w-full p-1.5 rounded-lg border text-xs font-bold ${isDark ? 'bg-[#161C30] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                />
              </div>

              <div className="sm:col-span-1 text-right">
                <button
                  type="button"
                  onClick={() => handleRemoveExpense(idx)}
                  className="p-1.5 rounded text-slate-400 hover:text-rose-500 transition-colors"
                  title="Remove expense"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Standard 27 OPEX Line Items from V1 */}
      <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold uppercase text-slate-900 dark:text-white">
            STANDARD 27 OPERATING EXPENSE LINE ITEMS (V1 SUITE)
          </span>
          <span className="text-[11px] text-slate-400">
            {state.expenses.filter((e) => STANDARD_OPEX_NAMES.includes(e.name.toLowerCase() as any)).length} of 27 active
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {STANDARD_OPEX_NAMES.map((name) => {
            const isAdded = state.expenses.some((e) => e.name.toLowerCase() === name.toLowerCase());
            return (
              <button
                key={name}
                type="button"
                disabled={isAdded}
                onClick={() => handleAddPredefined(name, 'Standard Operating Expense', 2500)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${
                  isAdded
                    ? 'opacity-40 cursor-not-allowed bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : isDark
                    ? 'bg-[#161C30] hover:bg-[#1E2548] text-slate-300 border-[#252E4A] hover:border-[#5584B4]'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-[#D8CEBC] hover:border-[#5584B4]'
                }`}
              >
                + {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Add from Predefined Taxonomy */}
      <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
        <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block">
          PREDEFINED EXPENSE TAXONOMY CATALOG
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PREDEFINED_EXPENSES_TAXONOMY.map((cat) => (
            <div key={cat.category} className="space-y-1.5">
              <div className="text-[11px] font-bold text-[#5584B4] uppercase">{cat.category}</div>
              <div className="space-y-1">
                {cat.items.map((it) => {
                  const alreadyAdded = state.expenses.some((e) => e.name === it.name);
                  return (
                    <button
                      key={it.name}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => handleAddPredefined(it.name, cat.category, it.defaultAmount)}
                      className={`w-full p-2 rounded-lg text-left text-[11px] border flex justify-between items-center transition-all ${
                        alreadyAdded
                          ? 'opacity-40 cursor-not-allowed bg-transparent border-transparent'
                          : isDark
                          ? 'bg-[#161C30] border-[#252E4A] hover:border-[#5584B4] text-slate-300'
                          : 'bg-slate-50 border-[#D8CEBC] hover:border-[#5584B4] text-slate-700'
                      }`}
                    >
                      <span className="truncate pr-1">{it.name}</span>
                      <span className="font-bold shrink-0">R{it.defaultAmount}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
