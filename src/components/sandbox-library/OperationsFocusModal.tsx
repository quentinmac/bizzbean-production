import React, { useState } from 'react';
import { Target, CheckCircle2, Circle, Calendar, Edit3, X } from 'lucide-react';
import { OperationsFocusTask } from '../../types/sandboxLibrary';

interface OperationsFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: OperationsFocusTask[];
  onSaveTasks: (tasks: OperationsFocusTask[]) => void;
  theme?: 'light' | 'dark';
}

export default function OperationsFocusModal({
  isOpen,
  onClose,
  tasks,
  onSaveTasks,
  theme = 'dark'
}: OperationsFocusModalProps) {
  const isDark = theme === 'dark';
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('Operations');
  const [editPriority, setEditPriority] = useState<'critical' | 'high' | 'medium'>('high');

  if (!isOpen) return null;

  const handleStartEdit = (task: OperationsFocusTask) => {
    setEditingSlot(task.slot);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditDate(task.targetCompletionDate || '');
    setEditCategory(task.category || 'Operations');
    setEditPriority(task.priority || 'high');
  };

  const handleSaveSlot = (slotNumber: 1 | 2 | 3) => {
    const updated = [...tasks];
    const index = updated.findIndex(t => t.slot === slotNumber);
    const newTask: OperationsFocusTask = {
      id: index >= 0 ? updated[index].id : `optask-${slotNumber}-${Date.now()}`,
      slot: slotNumber,
      title: editTitle.trim() || `Focus Item ${slotNumber}`,
      description: editDesc.trim(),
      targetCompletionDate: editDate || undefined,
      status: index >= 0 ? updated[index].status : 'pending',
      priority: editPriority,
      category: editCategory,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      updated[index] = newTask;
    } else {
      updated.push(newTask);
    }

    onSaveTasks(updated);
    setEditingSlot(null);
  };

  const handleToggleStatus = (slotNumber: number) => {
    const updated = tasks.map(t => {
      if (t.slot === slotNumber) {
        return {
          ...t,
          status: (t.status === 'completed' ? 'pending' : 'completed') as OperationsFocusTask['status'],
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
    onSaveTasks(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className={`relative w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-8 border ${
          isDark
            ? 'bg-[#101424] border-[#252E4A] text-slate-100'
            : 'bg-white border-[#E8E2D8] text-slate-900'
        }`}
      >
        <div className={`flex items-center justify-between pb-4 border-b ${
          isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C59B63]/20 text-[#C59B63] flex items-center justify-center border border-[#C59B63]/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-black tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                3-Slot Operations Focus
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Anchor your top 3 daily operational priorities with grounded citations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-[#161C30]' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 my-6">
          {([1, 2, 3] as const).map(slot => {
            const task = tasks.find(t => t.slot === slot);
            const isEditing = editingSlot === slot;

            if (isEditing) {
              return (
                <div
                  key={slot}
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDark
                      ? 'bg-[#161C30] border-[#C59B63]/50'
                      : 'bg-[#FAF8F5] border-[#C59B63]/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#C59B63] tracking-wider">
                      Editing Slot {slot}
                    </span>
                    <button
                      onClick={() => setEditingSlot(null)}
                      className={`text-xs cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Focus task title..."
                    className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#C59B63] ${
                      isDark
                        ? 'bg-[#101424] text-slate-100 border-[#252E4A]'
                        : 'bg-white text-slate-900 border-[#E8E2D8]'
                    }`}
                  />
                  <textarea
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    placeholder="Why this matters & operational context..."
                    rows={2}
                    className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#C59B63] resize-none ${
                      isDark
                        ? 'bg-[#101424] text-slate-100 border-[#252E4A]'
                        : 'bg-white text-slate-900 border-[#E8E2D8]'
                    }`}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="date"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                      className={`text-xs px-3 py-1.5 rounded-xl border ${
                        isDark
                          ? 'bg-[#101424] text-slate-100 border-[#252E4A]'
                          : 'bg-white text-slate-900 border-[#E8E2D8]'
                      }`}
                    />
                    <button
                      onClick={() => handleSaveSlot(slot)}
                      className="px-4 py-2 bg-[#C59B63] hover:bg-[#D4A373] text-[#12172A] font-bold font-mono text-xs rounded-xl cursor-pointer transition-colors shadow-xs"
                    >
                      Save Slot {slot}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={slot}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  task?.status === 'completed'
                    ? isDark
                      ? 'bg-[#161C30]/40 border-[#252E4A]/60 opacity-60'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                    : isDark
                    ? 'bg-[#161C30]/80 border-[#252E4A] hover:border-[#5584B4]'
                    : 'bg-[#FAF8F5] border-[#E8E2D8] hover:border-[#C59B63]'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => handleToggleStatus(slot)}
                    className="mt-0.5 text-slate-400 hover:text-[#C59B63] cursor-pointer"
                  >
                    {task?.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-[#C59B63]" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Slot {slot}
                      </span>
                      {task?.category && (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          isDark
                            ? 'bg-[#101424] text-[#D4A373] border-[#252E4A]'
                            : 'bg-white text-[#C59B63] border-[#E8E2D8]'
                        }`}>
                          {task.category}
                        </span>
                      )}
                    </div>
                    <h4 className={`text-sm font-bold ${
                      task?.status === 'completed'
                        ? 'line-through text-slate-500'
                        : isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}>
                      {task?.title || `Slot ${slot}: Empty`}
                    </h4>
                    {task?.description && (
                      <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {task.description}
                      </p>
                    )}
                    {task?.targetCompletionDate && (
                      <div className={`flex items-center gap-1.5 text-[10px] mt-2 font-mono ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        <Calendar className="w-3 h-3 text-[#C59B63]" />
                        <span>Target: {task.targetCompletionDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleStartEdit(task || { id: '', slot, title: '', status: 'pending', updatedAt: '' })}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-[#101424]' : 'text-slate-400 hover:text-slate-800 hover:bg-white'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className={`flex justify-end pt-4 border-t ${
          isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
        }`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 font-bold font-mono text-xs rounded-xl cursor-pointer transition-colors border ${
              isDark
                ? 'bg-[#161C30] hover:bg-[#1E2548] text-white border-[#252E4A]'
                : 'bg-[#12172A] hover:bg-[#1E2548] text-white border-[#12172A]'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
