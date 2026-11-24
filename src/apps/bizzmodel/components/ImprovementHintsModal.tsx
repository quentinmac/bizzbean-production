import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Check,
  RotateCcw,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import {
  BizzOptimizerHintsMap,
  PERFORMANCE_LEADERS,
  PerformanceLeaderId,
  TOUCH_POINTS,
  TouchPointKey,
} from '../data/bizzoptimizerDefaults';

export interface LeaderSnapshotMetric {
  label: string;
  actualFormatted: string;
  targetFormatted: string;
  varianceFormatted: string;
  /** 'positive' = favorable variance, 'negative' = unfavorable, 'neutral' = zero or informational */
  varianceTone: 'positive' | 'negative' | 'neutral';
}

interface ImprovementHintsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderId: PerformanceLeaderId;
  onSelectLeader: (leaderId: PerformanceLeaderId) => void;
  leaderSnapshots: Record<PerformanceLeaderId, LeaderSnapshotMetric[]>;
  hintsMap: BizzOptimizerHintsMap;
  onSaveHints: (next: BizzOptimizerHintsMap) => Promise<void>;
  onResetHints: () => Promise<void>;
  onCreateActionFromHint: (leaderId: PerformanceLeaderId, touchPoint: TouchPointKey, hintText: string) => void;
  syncStatus: 'idle' | 'saving' | 'synced' | 'local';
  theme?: 'light' | 'dark';
}

export const ImprovementHintsModal: React.FC<ImprovementHintsModalProps> = ({
  isOpen,
  onClose,
  leaderId,
  onSelectLeader,
  leaderSnapshots,
  hintsMap,
  onSaveHints,
  onResetHints,
  onCreateActionFromHint,
  syncStatus,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [activeTouchPoint, setActiveTouchPoint] = useState<TouchPointKey>('products');
  const [newHintText, setNewHintText] = useState('');
  const [editingHintId, setEditingHintId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [addedHintId, setAddedHintId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEditingHintId(null);
      setConfirmDeleteId(null);
      setConfirmReset(false);
      setNewHintText('');
    }
  }, [isOpen]);

  useEffect(() => {
    setEditingHintId(null);
    setConfirmDeleteId(null);
  }, [leaderId, activeTouchPoint]);

  if (!isOpen) return null;

  const leaderMeta =
    PERFORMANCE_LEADERS.find((l) => l.id === leaderId) || PERFORMANCE_LEADERS[0];
  const touchPointMeta =
    TOUCH_POINTS.find((tp) => tp.key === activeTouchPoint) || TOUCH_POINTS[0];
  const leaderHints = hintsMap[leaderId];
  const currentHints = leaderHints?.[activeTouchPoint] || [];
  const snapshotMetrics = leaderSnapshots[leaderId] || [];

  const handleAddHint = async () => {
    const trimmed = newHintText.trim();
    if (!trimmed) return;
    const nextItem = {
      id: `${leaderId}-${activeTouchPoint}-${Date.now()}`,
      text: trimmed,
    };
    const nextMap: BizzOptimizerHintsMap = {
      ...hintsMap,
      [leaderId]: {
        ...hintsMap[leaderId],
        [activeTouchPoint]: [...currentHints, nextItem],
      },
    };
    setNewHintText('');
    await onSaveHints(nextMap);
  };

  const handleSaveEdit = async (hintId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    const nextMap: BizzOptimizerHintsMap = {
      ...hintsMap,
      [leaderId]: {
        ...hintsMap[leaderId],
        [activeTouchPoint]: currentHints.map((h) =>
          h.id === hintId ? { ...h, text: trimmed } : h
        ),
      },
    };
    setEditingHintId(null);
    setEditingText('');
    await onSaveHints(nextMap);
  };

  const handleDeleteHint = async (hintId: string) => {
    const nextMap: BizzOptimizerHintsMap = {
      ...hintsMap,
      [leaderId]: {
        ...hintsMap[leaderId],
        [activeTouchPoint]: currentHints.filter((h) => h.id !== hintId),
      },
    };
    setConfirmDeleteId(null);
    await onSaveHints(nextMap);
  };

  const handleQuickCreateAction = (hintId: string, text: string) => {
    onCreateActionFromHint(leaderId, activeTouchPoint, text);
    setAddedHintId(hintId);
    setTimeout(() => {
      setAddedHintId((prev) => (prev === hintId ? null : prev));
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl max-h-[88vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden ${
          isDark
            ? 'bg-[#0F172A] border-[#1E293B] text-[#F1F5F9]'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-start justify-between gap-4 ${
            isDark ? 'border-[#1E293B] bg-[#0B1220]' : 'border-slate-200 bg-slate-50/70'
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#00A3E0] shrink-0" />
              <h3 className="text-[15px] font-bold tracking-tight lowercase">
                areas of improvement · {leaderMeta.label}
              </h3>
            </div>
            <p
              className={`text-[12px] mt-0.5 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              {leaderMeta.shortRole} · {leaderMeta.summary}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={leaderId}
              onChange={(e) => onSelectLeader(e.target.value as PerformanceLeaderId)}
              aria-label="Select performance leader"
              className={`text-[12px] font-semibold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer lowercase ${
                isDark
                  ? 'bg-[#1E293B] border-[#334155] text-slate-100 focus:border-[#00A3E0]'
                  : 'bg-white border-slate-300 text-slate-800 focus:border-[#00A3E0]'
              }`}
            >
              {PERFORMANCE_LEADERS.map((leader) => (
                <option key={leader.id} value={leader.id}>
                  {leader.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close popup"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-[#1E293B]'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* 1. Department Head Numbers Snapshot */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h4
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                performance leader snapshot (ytd annualised vs. what-if / target)
              </h4>
              <span
                className={`text-[11px] ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                primary lever: <span className="font-semibold">{leaderMeta.primaryLever}</span>
              </span>
            </div>

            <div
              className={`rounded-lg border overflow-hidden ${
                isDark ? 'border-[#1E293B]' : 'border-slate-200'
              }`}
            >
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                      isDark
                        ? 'bg-[#111C2E] border-[#1E293B] text-slate-400'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <th className="py-2 px-3 text-left">metric</th>
                    <th className="py-2 px-3 text-right">actual / base</th>
                    <th className="py-2 px-3 text-right">what-if / target</th>
                    <th className="py-2 px-3 text-right">variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-[#1E293B]">
                  {snapshotMetrics.map((m) => (
                    <tr
                      key={m.label}
                      className={
                        isDark ? 'hover:bg-[#1E293B]/40' : 'hover:bg-slate-50/80'
                      }
                    >
                      <td className="py-2 px-3 font-medium lowercase">{m.label}</td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {m.actualFormatted}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums font-semibold">
                        {m.targetFormatted}
                      </td>
                      <td
                        className={`py-2 px-3 text-right tabular-nums font-semibold ${
                          m.varianceTone === 'positive'
                            ? isDark
                              ? 'text-emerald-400'
                              : 'text-emerald-700'
                            : m.varianceTone === 'negative'
                            ? isDark
                              ? 'text-rose-400'
                              : 'text-rose-700'
                            : isDark
                            ? 'text-slate-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {m.varianceFormatted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Editable Improvement Hints by 5 Touch-Points */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h4
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  improvement hints by touch-point (editable)
                </h4>
                <p
                  className={`text-[12px] mt-0.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {touchPointMeta.description}
                </p>
              </div>
            </div>

            {/* 5 Touch-Point Underline Tabs */}
            <div
              className={`flex items-center gap-5 border-b overflow-x-auto ${
                isDark ? 'border-[#1E293B]' : 'border-slate-200'
              }`}
            >
              {TOUCH_POINTS.map((tp) => {
                const isActive = activeTouchPoint === tp.key;
                const count = leaderHints?.[tp.key]?.length ?? 0;
                return (
                  <button
                    key={tp.key}
                    type="button"
                    onClick={() => setActiveTouchPoint(tp.key)}
                    className={`pb-2.5 text-[12.5px] font-semibold lowercase whitespace-nowrap transition-colors border-b-2 -mb-px cursor-pointer ${
                      isActive
                        ? 'border-[#00A3E0] text-[#00A3E0]'
                        : isDark
                        ? 'border-transparent text-slate-400 hover:text-slate-200'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tp.label}{' '}
                    <span
                      className={`text-[11px] tabular-nums ml-1 ${
                        isActive
                          ? 'text-[#00A3E0]'
                          : isDark
                          ? 'text-slate-500'
                          : 'text-slate-400'
                      }`}
                    >
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Add New Hint Input Row */}
            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={newHintText}
                onChange={(e) => setNewHintText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleAddHint();
                  }
                }}
                placeholder={`add a new ${activeTouchPoint} hint for ${leaderMeta.label}...`}
                className={`flex-1 px-3 py-2 text-[12.5px] rounded-lg border outline-none transition-colors ${
                  isDark
                    ? 'bg-[#0B1220] border-[#334155] text-slate-100 placeholder:text-slate-500 focus:border-[#00A3E0]'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#00A3E0]'
                }`}
              />
              <button
                type="button"
                onClick={() => void handleAddHint()}
                disabled={!newHintText.trim()}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-[#00A3E0] text-slate-950 hover:bg-[#38BDF8]'
                    : 'bg-[#00A3E0] text-white hover:bg-[#0284C7]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                add hint
              </button>
            </div>

            {/* Hint List */}
            <div className="mt-3 space-y-2">
              {currentHints.length === 0 ? (
                <div
                  className={`py-8 px-4 text-center rounded-lg border border-dashed text-[12.5px] ${
                    isDark
                      ? 'border-[#334155] text-slate-400'
                      : 'border-slate-300 text-slate-500'
                  }`}
                >
                  no hints added yet for <span className="font-semibold">{leaderMeta.label}</span> ·{' '}
                  <span className="font-semibold">{activeTouchPoint}</span>. add your first hint above.
                </div>
              ) : (
                currentHints.map((hint, idx) => {
                  const isEditing = editingHintId === hint.id;
                  const isConfirmingDelete = confirmDeleteId === hint.id;
                  const isJustAdded = addedHintId === hint.id;

                  return (
                    <div
                      key={hint.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        isDark
                          ? 'bg-[#111C2E]/70 border-[#1E293B] hover:border-[#334155]'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                void handleSaveEdit(hint.id);
                              } else if (e.key === 'Escape') {
                                setEditingHintId(null);
                              }
                            }}
                            autoFocus
                            className={`flex-1 px-2.5 py-1.5 text-[12.5px] rounded-md border outline-none ${
                              isDark
                                ? 'bg-[#0B1220] border-[#00A3E0] text-slate-100'
                                : 'bg-white border-[#00A3E0] text-slate-900'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => void handleSaveEdit(hint.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11.5px] font-semibold bg-[#00A3E0] text-white hover:bg-[#0284C7] cursor-pointer whitespace-nowrap"
                          >
                            <Check className="w-3.5 h-3.5" />
                            save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingHintId(null)}
                            className={`px-2.5 py-1.5 rounded-md text-[11.5px] font-semibold cursor-pointer whitespace-nowrap ${
                              isDark
                                ? 'text-slate-300 hover:bg-[#1E293B]'
                                : 'text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span
                              className={`text-[11px] font-bold tabular-nums mt-0.5 shrink-0 ${
                                isDark ? 'text-slate-500' : 'text-slate-400'
                              }`}
                            >
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <p className="text-[12.5px] leading-relaxed">{hint.text}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isConfirmingDelete ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteHint(hint.id)}
                                  className="px-2 py-1 rounded text-[11px] font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer whitespace-nowrap"
                                >
                                  confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer whitespace-nowrap ${
                                    isDark
                                      ? 'text-slate-300 hover:bg-[#1E293B]'
                                      : 'text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleQuickCreateAction(hint.id, hint.text)}
                                  title="Add this hint directly to the Programme of Actions"
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                                    isJustAdded
                                      ? isDark
                                        ? 'text-emerald-400'
                                        : 'text-emerald-700'
                                      : isDark
                                      ? 'text-[#38BDF8] hover:bg-[#1E293B]'
                                      : 'text-[#0284C7] hover:bg-sky-50'
                                  }`}
                                >
                                  {isJustAdded ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      added
                                    </>
                                  ) : (
                                    <>
                                      <ArrowRight className="w-3 h-3" />
                                      to action
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingHintId(hint.id);
                                    setEditingText(hint.text);
                                    setConfirmDeleteId(null);
                                  }}
                                  aria-label="Edit hint"
                                  className={`p-1 rounded transition-colors cursor-pointer ${
                                    isDark
                                      ? 'text-slate-400 hover:text-slate-100 hover:bg-[#1E293B]'
                                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                                  }`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(hint.id)}
                                  aria-label="Delete hint"
                                  className={`p-1 rounded transition-colors cursor-pointer ${
                                    isDark
                                      ? 'text-slate-400 hover:text-rose-400 hover:bg-[#1E293B]'
                                      : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t flex flex-wrap items-center justify-between gap-3 text-[11.5px] ${
            isDark
              ? 'border-[#1E293B] bg-[#0B1220] text-slate-400'
              : 'border-slate-200 bg-slate-50/70 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-3">
            <span>
              {syncStatus === 'saving'
                ? 'saving hints...'
                : syncStatus === 'synced'
                ? 'hints synced to cloud'
                : syncStatus === 'local'
                ? 'saved locally'
                : 'editable hints directory'}
            </span>
            <span>·</span>
            {confirmReset ? (
              <span className="inline-flex items-center gap-1.5">
                <span className={isDark ? 'text-rose-400' : 'text-rose-600'}>
                  restore default hints?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmReset(false);
                    void onResetHints();
                  }}
                  className="font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  yes, reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="font-semibold hover:underline cursor-pointer"
                >
                  cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1 hover:text-[#00A3E0] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                reset default hints
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-colors ${
              isDark
                ? 'bg-[#1E293B] text-slate-100 hover:bg-[#334155]'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            done
          </button>
        </div>
      </div>
    </div>
  );
};
