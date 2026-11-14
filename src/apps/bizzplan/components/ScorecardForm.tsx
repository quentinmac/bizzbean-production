import React from 'react';
import { BizzPlanData } from '../../../types';
import { Award, CheckCircle2, MessageSquare } from 'lucide-react';

interface ScorecardFormProps {
  data: BizzPlanData;
  onUpdate: (updater: (prev: BizzPlanData) => BizzPlanData) => void;
  theme?: 'light' | 'dark';
}

const CATEGORIES = [
  { id: 'environment', title: 'business environment', label: 'environment' },
  { id: 'products', title: 'product category', label: 'product category' },
  { id: 'customers', title: 'customers', label: 'customers' },
  { id: 'suppliers', title: 'suppliers', label: 'suppliers' },
  { id: 'employees', title: 'employees', label: 'employees' },
  { id: 'infrastructure', title: 'infrastructure', label: 'infrastructure' },
  { id: 'systems', title: 'systems', label: 'systems' },
];

export default function ScorecardForm({ data, onUpdate, theme = 'light' }: ScorecardFormProps) {
  const isDark = theme === 'dark';

  const getScore = (cat: { id: string; title: string; label: string }) => {
    const section = data.sections.find(
      (s) => s.id === cat.id || s.title === cat.title || s.title === cat.label
    );
    if (!section || !section.categories) return 0;

    return section.categories.reduce(
      (total, subCat) =>
        total + subCat.items.reduce((sum, item) => sum + (item.score || 0), 0),
      0
    );
  };

  const getItemCount = (cat: { id: string; title: string; label: string }) => {
    const section = data.sections.find(
      (s) => s.id === cat.id || s.title === cat.title || s.title === cat.label
    );
    if (!section || !section.categories) return 0;

    return section.categories.reduce(
      (total, subCat) => total + subCat.items.length,
      0
    );
  };

  const handleActionChange = (cat: { id: string; label: string }, value: string) => {
    onUpdate((prev) => ({
      ...prev,
      scorecardActions: {
        ...(prev.scorecardActions || {}),
        [cat.id]: value,
        [cat.label]: value,
      },
    }));
  };

  const totalScore = CATEGORIES.reduce((sum, cat) => sum + getScore(cat), 0);
  const totalItems = CATEGORIES.reduce((sum, cat) => sum + getItemCount(cat), 0);

  return (
    <div className="space-y-6 font-mono">
      {/* Header Total Score Summary */}
      <div
        className={`border p-5 rounded-xl flex items-center justify-between gap-4 ${
          isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest block ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            viability index
          </span>
          <h3
            className={`text-lg font-bold lowercase mt-0.5 ${
              isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'
            }`}
          >
            overall score
          </h3>
          <p className={`text-[11px] mt-1 lowercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            based on {totalItems} touch-point assessment criteria
          </p>
        </div>

        <div className="flex flex-col items-end">
          <div
            className={`w-16 h-16 rounded-xl border flex flex-col items-center justify-center ${
              isDark ? 'bg-[#101626] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <span
              className={`text-2xl font-black tabular-nums ${
                totalScore >= 0
                  ? isDark
                    ? 'text-[#7FAADC]'
                    : 'text-[#2E5E88]'
                  : 'text-rose-500'
              }`}
            >
              {totalScore}
            </span>
            <span
              className={`text-[8px] font-bold uppercase tracking-widest ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              pts
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Actions */}
      <div className="space-y-5">
        <div
          className={`flex items-center gap-2 border-b pb-2 ${
            isDark ? 'border-[#222F4C]' : 'border-[#D8CEBC]'
          }`}
        >
          <Award size={14} className={isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'} />
          <h4
            className={`text-[11px] font-bold uppercase tracking-widest ${
              isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'
            }`}
          >
            category score & action items
          </h4>
        </div>

        <div className="space-y-4">
          {CATEGORIES.map((cat) => {
            const score = getScore(cat);
            const count = getItemCount(cat);
            const pct =
              count > 0
                ? Math.max(0, Math.min(100, Math.round(((score + count) / (count * 2)) * 100)))
                : 0;
            const rawAction =
              data.scorecardActions?.[cat.id] ?? data.scorecardActions?.[cat.label];
            const actionValue = Array.isArray(rawAction)
              ? rawAction.join('\n')
              : rawAction ?? '';

            return (
              <div
                key={cat.id}
                className={`border rounded-xl p-4 sm:p-5 space-y-3.5 ${
                  isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      size={14}
                      className={isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'}
                    />
                    <span
                      className={`text-sm font-bold lowercase ${
                        isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'
                      }`}
                    >
                      {cat.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold lowercase ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {count} questions
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md border text-xs font-bold tabular-nums ${
                        isDark
                          ? 'bg-[#101626] border-[#252E4A] text-[#7FAADC]'
                          : 'bg-white border-[#D8CEBC] text-[#2E5E88]'
                      }`}
                    >
                      {score} pts
                    </span>
                  </div>
                </div>

                {/* Progress Visualizer */}
                <div
                  className={`w-full h-1.5 rounded-full overflow-hidden ${
                    isDark ? 'bg-[#101626]' : 'bg-[#ECE7DE]'
                  }`}
                >
                  <div
                    className={`h-full transition-all duration-500 ${
                      isDark ? 'bg-[#5584B4]' : 'bg-[#2E5E88]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Action Commentary Input */}
                <div className="space-y-1.5 pt-1">
                  <label
                    className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    <MessageSquare
                      size={10}
                      className={isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'}
                    />
                    <span>action steps & evaluation for {cat.label}</span>
                  </label>
                  <textarea
                    value={actionValue}
                    onChange={(e) => handleActionChange(cat, e.target.value)}
                    placeholder={`describe key takeaways and required actions for ${cat.label}...`}
                    className={`w-full min-h-[72px] border rounded-lg p-3 text-xs focus:outline-none resize-y leading-relaxed transition-all ${
                      isDark
                        ? 'bg-[#101626] border-[#252E4A] text-white placeholder:text-slate-500 focus:border-[#5584B4]'
                        : 'bg-white border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#2E5E88]'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
