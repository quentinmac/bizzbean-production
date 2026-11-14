import React, { useState, useEffect } from 'react';
import { BizzPlanTouchPointCategory, TouchPointAnswer } from '../../../types';
import { Check, X, Minus, MessageSquare, HelpCircle, ChevronRight } from 'lucide-react';

interface TouchPointMenuProps {
  categories: BizzPlanTouchPointCategory[];
  onAnswerChange: (catId: string, itemId: string, answer: TouchPointAnswer) => void;
  onCommentChange: (catId: string, comment: string) => void;
  sectionTitle: string;
  theme?: 'light' | 'dark';
}

export function TouchPointMenu({
  categories,
  onAnswerChange,
  onCommentChange,
  sectionTitle,
  theme = 'light',
}: TouchPointMenuProps) {
  const isDark = theme === 'dark';
  const safeCategories = categories || [];
  const [activeCategoryId, setActiveCategoryId] = useState<string>(safeCategories[0]?.id || '');

  useEffect(() => {
    setActiveCategoryId(safeCategories[0]?.id || '');
  }, [sectionTitle]);

  const currentCategory = safeCategories.find((c) => c.id === activeCategoryId) || safeCategories[0];

  const handleBulkAnswer = (catId: string, ans: TouchPointAnswer) => {
    if (!currentCategory) return;
    currentCategory.items.forEach((item) => {
      onAnswerChange(catId, item.id, ans);
    });
  };

  if (!currentCategory) return null;

  return (
    <div className="space-y-6 font-mono">
      {/* Sub-category navigation tabs */}
      <div
        className={`flex flex-wrap gap-1.5 border-b pb-3 ${
          isDark ? 'border-[#222F4C]' : 'border-[#D8CEBC]'
        }`}
      >
        {safeCategories.map((cat) => {
          const catScore = cat.items.reduce((sum, item) => sum + (item.score || 0), 0);
          const isActive = cat.id === currentCategory.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold lowercase transition-all flex items-center gap-2 border ${
                isActive
                  ? isDark
                    ? 'bg-[#2E5E88] text-white border-[#5584B4] shadow-xs'
                    : 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-xs'
                  : isDark
                  ? 'bg-[#141A2E] text-slate-300 border-[#252E4A] hover:border-[#5584B4]/50 hover:text-white'
                  : 'bg-[#FAF8F5] text-slate-600 border-[#D8CEBC] hover:border-[#2E5E88]/40 hover:text-[#2E5E88]'
              }`}
            >
              <span>{cat.title}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] tabular-nums ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isDark
                    ? 'bg-[#1E2742] text-[#7FAADC]'
                    : 'bg-[#EFECE6] text-[#2E5E88]'
                }`}
              >
                {catScore}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bulk Quick Actions */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border ${
          isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div
          className={`text-[10px] font-bold lowercase flex items-center gap-1.5 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          <HelpCircle size={12} className={isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'} />
          <span>
            {currentCategory.title} ({currentCategory.items.length} elements)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[9px] lowercase mr-1 ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            mark all:
          </span>
          {(['yes', 'no', 'n/a'] as TouchPointAnswer[]).map((ans) => (
            <button
              key={ans}
              type="button"
              onClick={() => handleBulkAnswer(currentCategory.id, ans)}
              className={`px-2 py-0.5 rounded-md border text-[9px] font-bold lowercase transition-all ${
                isDark
                  ? 'bg-[#101626] border-[#252E4A] text-slate-300 hover:text-white hover:border-[#5584B4]'
                  : 'bg-white border-[#D8CEBC] text-slate-600 hover:text-[#2E5E88] hover:border-[#2E5E88]'
              }`}
            >
              {ans === 'n/a' ? 'not applicable' : ans}
            </button>
          ))}
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2.5">
        {currentCategory.items.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
              isDark
                ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]/40'
                : 'bg-[#FAF8F5] border-[#D8CEBC] hover:border-[#2E5E88]/40'
            }`}
          >
            <div
              className={`text-xs font-normal lowercase leading-relaxed flex-1 ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              {item.item}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {(['yes', 'no', 'n/a'] as TouchPointAnswer[]).map((ans) => {
                const isSelected = item.answer === ans;
                let btnClass = isDark
                  ? 'bg-[#101626] border-[#252E4A] text-slate-400 hover:border-[#5584B4]/50 hover:text-slate-200'
                  : 'bg-white border-[#D8CEBC] text-slate-400 hover:border-[#2E5E88]/40 hover:text-slate-700';

                if (isSelected) {
                  if (ans === 'yes') {
                    btnClass = isDark
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold';
                  } else if (ans === 'no') {
                    btnClass = isDark
                      ? 'bg-rose-950/60 border-rose-500 text-rose-300 font-bold'
                      : 'bg-rose-50 border-rose-500 text-rose-700 font-bold';
                  } else {
                    btnClass = isDark
                      ? 'bg-[#1E2742] border-slate-500 text-slate-200 font-bold'
                      : 'bg-[#EFECE6] border-slate-400 text-slate-700 font-bold';
                  }
                }
                return (
                  <button
                    key={ans}
                    type="button"
                    onClick={() => onAnswerChange(currentCategory.id, item.id, ans)}
                    className={`px-2.5 py-1 rounded-md border text-[10px] lowercase transition-all flex items-center gap-1 ${btnClass}`}
                  >
                    {ans === 'yes' && <Check size={10} />}
                    {ans === 'no' && <X size={10} />}
                    {ans === 'n/a' && <Minus size={10} />}
                    <span>{ans === 'n/a' ? 'not applicable' : ans}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Category Comment / Action Note */}
      <div className="space-y-1.5 pt-2">
        <label
          className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          <MessageSquare size={12} className={isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'} />
          <span>notes & commentary on {currentCategory.title}</span>
        </label>
        <textarea
          value={currentCategory.comment || ''}
          onChange={(e) => onCommentChange(currentCategory.id, e.target.value)}
          placeholder={`add specific strategic notes for ${currentCategory.title}...`}
          className={`w-full min-h-[84px] border rounded-xl p-3 text-xs focus:outline-none resize-y leading-relaxed transition-all ${
            isDark
              ? 'bg-[#141A2E] border-[#252E4A] text-white placeholder:text-slate-500 focus:border-[#5584B4]'
              : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#2E5E88]'
          }`}
        />
      </div>
    </div>
  );
}

interface TouchPointReportProps {
  categories?: BizzPlanTouchPointCategory[];
  sectionTitle: string;
  theme?: 'light' | 'dark';
}

export function TouchPointReport({ categories, sectionTitle, theme = 'light' }: TouchPointReportProps) {
  const isDark = theme === 'dark';
  const safeCategories = categories || [];
  const totalSectionScore = safeCategories.reduce(
    (sum, cat) => sum + cat.items.reduce((s, item) => s + (item.score || 0), 0),
    0
  );

  const totalQuestions = safeCategories.reduce((sum, cat) => sum + cat.items.length, 0);
  const answeredQuestions = safeCategories.reduce(
    (sum, cat) => sum + cat.items.filter((item) => item.answer !== 'n/a').length,
    0
  );

  return (
    <div className="space-y-5 font-mono">
      {/* KPI Header Card */}
      <div
        className={`border rounded-xl p-5 flex items-center justify-between gap-4 ${
          isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest block ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            touch-point audit summary
          </span>
          <h3
            className={`text-lg font-bold lowercase mt-0.5 ${
              isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'
            }`}
          >
            {sectionTitle}
          </h3>
          <p className={`text-[11px] mt-1 lowercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {answeredQuestions} of {totalQuestions} checklist elements addressed
          </p>
        </div>

        <div className="text-right">
          <span
            className={`text-[10px] font-bold uppercase tracking-widest block ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            section score
          </span>
          <div
            className={`text-2xl sm:text-3xl font-black tabular-nums mt-0.5 ${
              totalSectionScore >= 0
                ? isDark
                  ? 'text-[#7FAADC]'
                  : 'text-[#2E5E88]'
                : 'text-rose-500'
            }`}
          >
            {totalSectionScore} pts
          </div>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="space-y-4">
        {safeCategories.map((cat) => {
          const catScore = cat.items.reduce((sum, item) => sum + (item.score || 0), 0);
          return (
            <div
              key={cat.id}
              className={`border rounded-xl overflow-hidden ${
                isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
              }`}
            >
              <div
                className={`px-4 py-2.5 border-b flex items-center justify-between ${
                  isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                }`}
              >
                <h4
                  className={`text-[11px] font-bold uppercase tracking-widest ${
                    isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'
                  }`}
                >
                  {cat.title}
                </h4>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    isDark ? 'text-slate-200' : 'text-[#2E5E88]'
                  }`}
                >
                  score: {catScore}
                </span>
              </div>

              <div className={`divide-y ${isDark ? 'divide-[#222F4C]' : 'divide-[#ECE7DE]'}`}>
                {cat.items.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-2 flex items-center justify-between text-xs gap-4"
                  >
                    <span
                      className={`lowercase flex items-center gap-2 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      <ChevronRight
                        size={10}
                        className={`shrink-0 ${isDark ? 'text-slate-500' : 'text-[#2E5E88]/40'}`}
                      />
                      {item.item}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded lowercase ${
                          item.answer === 'yes'
                            ? isDark
                              ? 'bg-emerald-950/60 text-emerald-300 font-bold'
                              : 'bg-emerald-50 text-emerald-700 font-bold'
                            : item.answer === 'no'
                            ? isDark
                              ? 'bg-rose-950/60 text-rose-300 font-bold'
                              : 'bg-rose-50 text-rose-700 font-bold'
                            : isDark
                            ? 'bg-[#101626] text-slate-400'
                            : 'bg-[#FAF8F5] text-slate-500'
                        }`}
                      >
                        {item.answer === 'n/a' ? 'not applicable' : item.answer}
                      </span>
                      <span
                        className={`text-xs font-bold tabular-nums w-6 text-right ${
                          isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'
                        }`}
                      >
                        {item.score || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {cat.comment && (
                <div
                  className={`p-3 border-t text-[11px] italic flex gap-2 ${
                    isDark
                      ? 'bg-[#101626] border-[#252E4A] text-slate-300'
                      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-700'
                  }`}
                >
                  <MessageSquare
                    size={12}
                    className={`shrink-0 mt-0.5 ${isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'}`}
                  />
                  <span>{cat.comment}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
