import React from 'react';
import { Calendar, RefreshCw, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { BizzModelState, BUSINESS_TYPES, BUSINESS_MODELS } from '../constants';

interface SetupStepProps {
  theme?: 'light' | 'dark';
  mode: 'bizzdynamics' | 'bizzmodel';
  state: BizzModelState;
  onUpdateState: (updater: (prev: BizzModelState) => BizzModelState) => void;
}

export const SetupStep: React.FC<SetupStepProps> = ({
  theme = 'light',
  mode,
  state,
  onUpdateState,
}) => {
  const isDark = theme === 'dark';
  const isLearningMode = mode === 'bizzdynamics';

  const details = state.businessDetails;

  const handleUpdateDetails = (patch: Partial<typeof details>) => {
    onUpdateState((prev) => ({
      ...prev,
      businessDetails: { ...prev.businessDetails, ...patch },
    }));
  };

  const handleResetData = () => {
    if (window.confirm('Reset business setup parameters to default values?')) {
      handleUpdateDetails({
        startDateMonth: 'September',
        startDateYear: 2026,
        scenario: 'Target Institutional Baseline',
        daysWorkedPerWeek: 5,
      });
    }
  };

  const totalDepartmentDistribution = details.departments.reduce(
    (sum, d) => sum + (d.distributionPct || 0),
    0
  );

  return (
    <div className={`p-4 sm:p-6 space-y-6 font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Learning notice for bizzdynamics */}
      {isLearningMode && (
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-center justify-between text-blue-400">
          <div>
            <span className="font-bold uppercase tracking-wider">BIZZDYNAMICS LEARNING MODE ACTIVE: </span>
            <span>Configure foundational business operating rhythms before revenue dialing.</span>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20">
            Step 1 of 7
          </span>
        </div>
      )}

      {/* Two Column Setup Layout matching video at 00:13-00:18 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Business Details, Departments, Days Worked */}
        <div className="space-y-6">
          
          {/* Box 1: Business Details & Start Date */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                BUSINESS DETAILS
              </span>
              <button
                type="button"
                onClick={handleResetData}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reset Model Data</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Business Type / Sector:</label>
                <select
                  value={details.businessType || 'services'}
                  onChange={(e) => {
                    const newType = e.target.value;
                    const availableModels = BUSINESS_MODELS[newType] || [];
                    handleUpdateDetails({
                      businessType: newType,
                      businessModel: availableModels[0] || '',
                    });
                  }}
                  className={`w-full p-2 rounded-xl border text-xs capitalize ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                >
                  {BUSINESS_TYPES.map((bt) => (
                    <option key={bt} value={bt} className="capitalize">
                      {bt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Business Model Archetype:</label>
                <select
                  value={details.businessModel || (BUSINESS_MODELS[details.businessType || 'services']?.[0] || 'time units')}
                  onChange={(e) => handleUpdateDetails({ businessModel: e.target.value })}
                  className={`w-full p-2 rounded-xl border text-xs capitalize ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                >
                  {(BUSINESS_MODELS[details.businessType || 'services'] || []).map((bm) => (
                    <option key={bm} value={bm} className="capitalize">
                      {bm}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Start Month:</label>
                <select
                  value={details.startDateMonth}
                  onChange={(e) => handleUpdateDetails({ startDateMonth: e.target.value })}
                  className={`w-full p-2 rounded-xl border text-xs ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Start Year:</label>
                <input
                  type="number"
                  value={details.startDateYear}
                  onChange={(e) => handleUpdateDetails({ startDateYear: Number(e.target.value) })}
                  className={`w-full p-2 rounded-xl border text-xs ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                />
              </div>
            </div>

            <div>
              <label className="text-slate-500 text-xs block mb-1">Operating Scenario:</label>
              <input
                type="text"
                value={details.scenario}
                onChange={(e) => handleUpdateDetails({ scenario: e.target.value })}
                className={`w-full p-2 rounded-xl border text-xs ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
              />
            </div>
          </div>

          {/* Box 2: Departments and their expense distribution */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                DEPARTMENTS & EXPENSE DISTRIBUTION %
              </span>
              <span className={`text-xs font-bold ${totalDepartmentDistribution === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                Total: {totalDepartmentDistribution}%
              </span>
            </div>

            <div className="space-y-2.5">
              {details.departments.map((dep, idx) => (
                <div key={dep.id} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-700 dark:text-slate-300 capitalize">{dep.name}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={dep.distributionPct}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const updated = details.departments.map((d, i) =>
                          i === idx ? { ...d, distributionPct: val } : d
                        );
                        handleUpdateDetails({ departments: updated });
                      }}
                      className={`w-16 p-1.5 rounded-lg border text-right font-bold ${isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Box 3: Days Worked Calculation */}
          <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block">
              DAYS WORKED CALCULATION
            </span>
            <div className="text-xs text-slate-500">
              Select standard working schedule per week:
            </div>
            <div className="flex items-center gap-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                const isWorkingDay = i < details.daysWorkedPerWeek;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleUpdateDetails({ daysWorkedPerWeek: i + 1 })}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      isWorkingDay
                        ? 'bg-[#5584B4] text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
              <span className="text-xs font-bold text-[#5584B4] ml-2">
                {details.daysWorkedPerWeek} Days / Week
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Deduct Holidays & Calculation Results Preview */}
        <div className="space-y-6">
          
          {/* Holidays Listing */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                DEDUCT STATUTORY HOLIDAYS
              </span>
              <span className="text-[10px] text-slate-400">
                {details.holidaysDeducted.length} Public Holidays
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {details.holidaysDeducted.map((h, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{h.name}</div>
                    <div className="text-[10px] text-slate-400">{h.from}</div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-500">-{h.days} day</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calculation Results Preview (Matching video at 00:15) */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <span className="text-xs font-bold uppercase text-slate-900 dark:text-white block">
              CALCULATION RESULTS PREVIEW (5-YEAR HORIZON)
            </span>

            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {[1, 2, 3, 4, 5].map((yr) => {
                const calendarDays = 365;
                const weekendDays = (7 - details.daysWorkedPerWeek) * 52;
                const holidayDays = details.holidaysDeducted.length;
                const daysNotWorked = weekendDays + holidayDays;
                const daysWorked = calendarDays - daysNotWorked;

                return (
                  <div
                    key={yr}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 space-y-1"
                  >
                    <div className="text-[10px] font-bold text-[#5584B4] uppercase">YEAR {yr}</div>
                    <div className="text-[11px] text-slate-400">{calendarDays} cal</div>
                    <div className="text-[11px] text-rose-400">-{daysNotWorked} off</div>
                    <div className="text-xs font-bold text-emerald-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                      {daysWorked} d
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
