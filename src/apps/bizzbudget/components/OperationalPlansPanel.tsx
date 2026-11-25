import React, { useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  FolderPlus,
  Tag,
} from 'lucide-react';
import {
  EffectivenessArea,
  OperationalActionStatus,
  OperationalPlanActionItem,
  OperationalPlansState,
} from '../types';

interface OperationalPlansPanelProps {
  branchName: string;
  plans: OperationalPlansState;
  onUpdatePlans: (updater: (prev: OperationalPlansState) => OperationalPlansState) => void;
  theme?: 'light' | 'dark';
}

const STATUS_OPTIONS: Array<{ value: OperationalActionStatus; label: string }> = [
  { value: 'planned', label: 'planned' },
  { value: 'in-progress', label: 'in progress' },
  { value: 'completed', label: 'completed' },
];

export const OperationalPlansPanel: React.FC<OperationalPlansPanelProps> = ({
  branchName,
  plans,
  onUpdatePlans,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  const areas = plans.effectivenessAreas || [];
  const actions = plans.actions || [];

  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<OperationalActionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Effectiveness Area management (user-defined names)
  const [newAreaName, setNewAreaName] = useState('');
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editingAreaName, setEditingAreaName] = useState('');
  const [showManageAreas, setShowManageAreas] = useState(false);

  // Add Action form
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formAreaId, setFormAreaId] = useState<string>(areas[0]?.id || '');
  const [formTitle, setFormTitle] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formTargetDate, setFormTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [formStatus, setFormStatus] = useState<OperationalActionStatus>('planned');
  const [formNotes, setFormNotes] = useState('');

  // Inline Edit & Delete Action
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<OperationalPlanActionItem | null>(null);
  const [confirmDeleteActionId, setConfirmDeleteActionId] = useState<string | null>(null);

  const selectedAreaObj = useMemo(
    () => (selectedAreaFilter === 'all' ? null : areas.find((a) => a.id === selectedAreaFilter) || null),
    [areas, selectedAreaFilter]
  );

  const filteredActions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return actions.filter((act) => {
      if (selectedAreaFilter !== 'all' && act.areaId !== selectedAreaFilter) return false;
      if (statusFilter !== 'all' && act.status !== statusFilter) return false;
      if (q) {
        const areaName = (areas.find((a) => a.id === act.areaId)?.name || '').toLowerCase();
        const hay = `${act.title} ${act.assignedTo} ${act.notes || ''} ${areaName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [actions, areas, selectedAreaFilter, statusFilter, searchQuery]);

  const handleAddArea = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newAreaName.trim();
    if (!clean) return;
    const newId = `area-${Date.now()}`;
    const newArea: EffectivenessArea = { id: newId, name: clean };
    onUpdatePlans((prev) => ({
      ...prev,
      effectivenessAreas: [...(prev.effectivenessAreas || []), newArea],
    }));
    setNewAreaName('');
    setSelectedAreaFilter(newId);
    setFormAreaId(newId);
  };

  const handleSaveRenameArea = (areaId: string) => {
    const clean = editingAreaName.trim();
    if (!clean) return;
    onUpdatePlans((prev) => ({
      ...prev,
      effectivenessAreas: (prev.effectivenessAreas || []).map((a) =>
        a.id === areaId ? { ...a, name: clean } : a
      ),
    }));
    setEditingAreaId(null);
    setEditingAreaName('');
  };

  const handleDeleteArea = (areaId: string) => {
    if (areas.length <= 1) return;
    const fallbackId = areas.find((a) => a.id !== areaId)?.id || '';
    onUpdatePlans((prev) => ({
      effectivenessAreas: (prev.effectivenessAreas || []).filter((a) => a.id !== areaId),
      actions: (prev.actions || []).map((act) =>
        act.areaId === areaId ? { ...act, areaId: fallbackId } : act
      ),
    }));
    if (selectedAreaFilter === areaId) setSelectedAreaFilter('all');
    if (formAreaId === areaId) setFormAreaId(fallbackId);
  };

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    const effectiveAreaId =
      formAreaId || (selectedAreaFilter !== 'all' ? selectedAreaFilter : areas[0]?.id || 'area-default');
    const newItem: OperationalPlanActionItem = {
      id: `op-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      areaId: effectiveAreaId,
      title: formTitle.trim(),
      assignedTo: formAssignedTo.trim() || 'Department Head',
      targetDate: formTargetDate,
      status: formStatus,
      notes: formNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    onUpdatePlans((prev) => ({
      ...prev,
      actions: [newItem, ...(prev.actions || [])],
    }));
    setFormTitle('');
    setFormNotes('');
    setIsAddFormOpen(false);
  };

  const handleSaveEditAction = () => {
    if (!editDraft || !editDraft.title.trim()) return;
    onUpdatePlans((prev) => ({
      ...prev,
      actions: (prev.actions || []).map((a) => (a.id === editDraft.id ? { ...editDraft, title: editDraft.title.trim() } : a)),
    }));
    setEditingActionId(null);
    setEditDraft(null);
  };

  const handleDeleteAction = (id: string) => {
    onUpdatePlans((prev) => ({
      ...prev,
      actions: (prev.actions || []).filter((a) => a.id !== id),
    }));
    setConfirmDeleteActionId(null);
  };

  const cardSurface = isDark
    ? 'bg-[#101626] border-[#222F4C]'
    : 'bg-white border-[#D8CEBC]';
  const inputSurface = isDark
    ? 'bg-[#0A0F1D] border-[#2B3759] text-slate-100 placeholder-slate-500'
    : 'bg-white border-[#D8CEBC] text-slate-900 placeholder-slate-400';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';

  const statusBadge = (status: OperationalActionStatus) => {
    if (status === 'completed') {
      return isDark
        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (status === 'in-progress') {
      return isDark
        ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
        : 'bg-sky-50 text-sky-700 border-sky-200';
    }
    return isDark
      ? 'bg-slate-800 text-slate-300 border-slate-700'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Main Operational Plans Card — adapted per operational plans.PNG */}
      <div className={`rounded-2xl border p-4 sm:p-5 shadow-xs ${cardSurface}`}>
        {/* Top Row: "effectiveness area · <user-defined name>" + Filters + Add Action */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-200/70 dark:border-[#1E293B]">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white lowercase">
                effectiveness area
                <span className="mx-1.5 text-slate-400">·</span>
                <span className="text-[#00A3E0]">
                  {selectedAreaObj ? selectedAreaObj.name : 'all areas'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowManageAreas((v) => !v)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer lowercase ${
                  showManageAreas
                    ? 'bg-[#2E5E88] text-white border-[#2E5E88]'
                    : isDark
                    ? 'bg-[#161F36] text-slate-300 border-[#2B3759] hover:border-[#00A3E0]'
                    : 'bg-[#FAF8F5] text-slate-700 border-[#D8CEBC] hover:border-[#2E5E88]'
                }`}
                title="Create or rename user-defined effectiveness areas"
              >
                <Tag className="w-3 h-3" />
                <span>{showManageAreas ? 'done naming areas' : 'name / manage areas'}</span>
              </button>
            </div>
            <p className={`text-[11.5px] ${mutedText}`}>
              {filteredActions.length} operational {filteredActions.length === 1 ? 'action' : 'actions'} shown for{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{branchName}</span> · assign owners, target dates, and track progress notes
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="search actions..."
                className={`pl-8 pr-2.5 py-1.5 text-xs rounded-lg border outline-none w-44 ${inputSurface}`}
              />
            </div>

            {/* Effectiveness Area Filter */}
            <select
              value={selectedAreaFilter}
              onChange={(e) => {
                setSelectedAreaFilter(e.target.value);
                if (e.target.value !== 'all') setFormAreaId(e.target.value);
              }}
              className={`px-2.5 py-1.5 text-xs rounded-lg border outline-none lowercase cursor-pointer ${inputSurface}`}
            >
              <option value="all">all effectiveness areas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OperationalActionStatus | 'all')}
              className={`px-2.5 py-1.5 text-xs rounded-lg border outline-none lowercase cursor-pointer ${inputSurface}`}
            >
              <option value="all">all statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* + Add Action */}
            <button
              type="button"
              onClick={() => {
                if (selectedAreaFilter !== 'all') setFormAreaId(selectedAreaFilter);
                else if (!formAreaId && areas[0]) setFormAreaId(areas[0].id);
                setIsAddFormOpen((v) => !v);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#00A3E0] hover:bg-[#0284C7] text-white shadow-xs transition-colors cursor-pointer lowercase"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>add action</span>
            </button>
          </div>
        </div>

        {/* User-Defined Effectiveness Areas Manager Drawer */}
        {showManageAreas && (
          <div
            className={`mt-4 p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#0B1020] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white lowercase">
                  user-defined effectiveness areas
                </div>
                <div className={`text-[11px] ${mutedText}`}>
                  add, rename, or remove effectiveness areas tailored to this branch&apos;s operational plan.
                </div>
              </div>
              <form onSubmit={handleAddArea} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  placeholder="new effectiveness area name..."
                  className={`px-3 py-1.5 text-xs rounded-lg border outline-none w-56 ${inputSurface}`}
                />
                <button
                  type="submit"
                  disabled={!newAreaName.trim()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#2E5E88] hover:bg-[#234A6C] text-white disabled:opacity-40 cursor-pointer lowercase"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>add area</span>
                </button>
              </form>
            </div>

            <div className="flex flex-wrap gap-2">
              {areas.map((area) => {
                const count = actions.filter((a) => a.areaId === area.id).length;
                const isEditing = editingAreaId === area.id;
                return (
                  <div
                    key={area.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
                      selectedAreaFilter === area.id
                        ? 'border-[#00A3E0] bg-[#00A3E0]/10 text-[#00A3E0]'
                        : isDark
                        ? 'bg-[#141A2E] border-[#252E4A] text-slate-200'
                        : 'bg-white border-[#D8CEBC] text-slate-800'
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editingAreaName}
                          onChange={(e) => setEditingAreaName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRenameArea(area.id);
                            if (e.key === 'Escape') setEditingAreaId(null);
                          }}
                          autoFocus
                          className={`px-2 py-0.5 text-xs rounded border outline-none w-40 ${inputSurface}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRenameArea(area.id)}
                          className="p-0.5 text-emerald-500 hover:text-emerald-400 cursor-pointer"
                          title="Save area name"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAreaId(null)}
                          className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedAreaFilter((prev) => (prev === area.id ? 'all' : area.id))
                          }
                          className="font-semibold lowercase cursor-pointer"
                        >
                          {area.name}
                        </button>
                        <span className={`text-[10px] tabular-nums ${mutedText}`}>({count})</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAreaId(area.id);
                            setEditingAreaName(area.name);
                          }}
                          className="p-0.5 text-slate-400 hover:text-[#00A3E0] cursor-pointer"
                          title="Rename effectiveness area"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        {areas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteArea(area.id)}
                            className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                            title="Delete effectiveness area"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Area Filter Strip (always 1-click switchable) */}
        {!showManageAreas && areas.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3">
            <button
              type="button"
              onClick={() => setSelectedAreaFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold lowercase border transition-colors cursor-pointer ${
                selectedAreaFilter === 'all'
                  ? 'bg-[#2E5E88] text-white border-[#2E5E88]'
                  : isDark
                  ? 'bg-[#141A2E] text-slate-300 border-[#252E4A] hover:border-[#00A3E0]'
                  : 'bg-[#FAF8F5] text-slate-600 border-[#D8CEBC] hover:border-[#2E5E88]'
              }`}
            >
              all ({actions.length})
            </button>
            {areas.map((area) => {
              const count = actions.filter((a) => a.areaId === area.id).length;
              const active = selectedAreaFilter === area.id;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => {
                    setSelectedAreaFilter(area.id);
                    setFormAreaId(area.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold lowercase border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#00A3E0] text-white border-[#00A3E0]'
                      : isDark
                      ? 'bg-[#141A2E] text-slate-300 border-[#252E4A] hover:border-[#00A3E0]'
                      : 'bg-white text-slate-700 border-[#D8CEBC] hover:border-[#00A3E0]'
                  }`}
                >
                  {area.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Add Action Form */}
        {isAddFormOpen && (
          <form
            onSubmit={handleAddAction}
            className={`mt-4 p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#0B1020] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-3">
                <label className={`block text-[11px] font-semibold mb-1 lowercase ${mutedText}`}>
                  effectiveness area
                </label>
                <select
                  value={formAreaId || areas[0]?.id || ''}
                  onChange={(e) => setFormAreaId(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none lowercase ${inputSurface}`}
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-5">
                <label className={`block text-[11px] font-semibold mb-1 lowercase ${mutedText}`}>
                  action / activity
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. renegotiate bulk packaging supplier terms by 4%"
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none ${inputSurface}`}
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block text-[11px] font-semibold mb-1 lowercase ${mutedText}`}>
                  assigned to
                </label>
                <input
                  type="text"
                  value={formAssignedTo}
                  onChange={(e) => setFormAssignedTo(e.target.value)}
                  placeholder="owner / dept head"
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none ${inputSurface}`}
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block text-[11px] font-semibold mb-1 lowercase ${mutedText}`}>
                  target date
                </label>
                <input
                  type="date"
                  value={formTargetDate}
                  onChange={(e) => setFormTargetDate(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none tabular-nums ${inputSurface}`}
                />
              </div>

              <div className="md:col-span-3">
                <label className={`block text-[11px] font-semibold mb-1 lowercase ${mutedText}`}>
                  status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as OperationalActionStatus)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none lowercase ${inputSurface}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-9">
                <label className={`block text-[11px] font-semibold mb-1 lowercase ${mutedText}`}>
                  progress notes / milestone
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="target KPI, deliverable, or review milestone..."
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none ${inputSurface}`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer lowercase ${
                  isDark ? 'text-slate-300 hover:bg-[#1E293B]' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                cancel
              </button>
              <button
                type="submit"
                disabled={!formTitle.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-[#00A3E0] hover:bg-[#0284C7] text-white disabled:opacity-40 cursor-pointer lowercase"
              >
                <Check className="w-3.5 h-3.5" />
                <span>save action</span>
              </button>
            </div>
          </form>
        )}

        {/* Operational Plans Actions Table */}
        <div className="mt-4 overflow-x-auto">
          {filteredActions.length === 0 ? (
            <div
              className={`py-10 px-4 text-center rounded-xl border border-dashed text-xs ${
                isDark ? 'border-[#334155] text-slate-400' : 'border-slate-300 text-slate-500'
              }`}
            >
              {actions.length === 0 ? (
                <>
                  no operational plan actions added yet. click{' '}
                  <button
                    type="button"
                    onClick={() => setIsAddFormOpen(true)}
                    className="font-bold text-[#00A3E0] hover:underline cursor-pointer"
                  >
                    + add action
                  </button>{' '}
                  to create your first action step.
                </>
              ) : (
                'no actions match your current filter.'
              )}
            </div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr
                  className={`border-b text-[10.5px] font-bold uppercase tracking-wider ${
                    isDark ? 'border-[#1E293B] text-slate-400' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  <th className="py-2.5 px-3 text-left whitespace-nowrap">effectiveness area</th>
                  <th className="py-2.5 px-3 text-left">action / activity</th>
                  <th className="py-2.5 px-3 text-left whitespace-nowrap">assigned to</th>
                  <th className="py-2.5 px-3 text-left whitespace-nowrap">target date</th>
                  <th className="py-2.5 px-3 text-left whitespace-nowrap">status</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-[#1E293B]">
                {filteredActions.map((action) => {
                  const isEditing = editingActionId === action.id && editDraft;
                  const isConfirmDelete = confirmDeleteActionId === action.id;
                  const areaLabel = areas.find((a) => a.id === action.areaId)?.name || 'general';

                  if (isEditing && editDraft) {
                    return (
                      <tr key={action.id} className={isDark ? 'bg-[#111C2E]' : 'bg-sky-50/50'}>
                        <td className="py-2.5 px-3 align-top">
                          <select
                            value={editDraft.areaId}
                            onChange={(e) => setEditDraft({ ...editDraft, areaId: e.target.value })}
                            className={`w-full px-2 py-1 text-xs rounded border outline-none lowercase ${inputSurface}`}
                          >
                            {areas.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3 align-top space-y-1.5">
                          <input
                            type="text"
                            value={editDraft.title}
                            onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                            className={`w-full px-2 py-1 text-xs rounded border outline-none ${inputSurface}`}
                          />
                          <input
                            type="text"
                            value={editDraft.notes || ''}
                            onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
                            placeholder="progress notes..."
                            className={`w-full px-2 py-1 text-[11px] rounded border outline-none ${inputSurface}`}
                          />
                        </td>
                        <td className="py-2.5 px-3 align-top">
                          <input
                            type="text"
                            value={editDraft.assignedTo}
                            onChange={(e) => setEditDraft({ ...editDraft, assignedTo: e.target.value })}
                            className={`w-full px-2 py-1 text-xs rounded border outline-none ${inputSurface}`}
                          />
                        </td>
                        <td className="py-2.5 px-3 align-top">
                          <input
                            type="date"
                            value={editDraft.targetDate}
                            onChange={(e) => setEditDraft({ ...editDraft, targetDate: e.target.value })}
                            className={`w-full px-2 py-1 text-xs rounded border outline-none tabular-nums ${inputSurface}`}
                          />
                        </td>
                        <td className="py-2.5 px-3 align-top">
                          <select
                            value={editDraft.status}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                status: e.target.value as OperationalActionStatus,
                              })
                            }
                            className={`w-full px-2 py-1 text-xs rounded border outline-none lowercase ${inputSurface}`}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3 align-top text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleSaveEditAction}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#00A3E0] text-white text-[11px] font-bold hover:bg-[#0284C7] cursor-pointer lowercase"
                            >
                              <Check className="w-3 h-3" />
                              save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingActionId(null);
                                setEditDraft(null);
                              }}
                              className="px-2 py-1 rounded text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer lowercase"
                            >
                              cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={action.id}
                      className={isDark ? 'hover:bg-[#141D32]/70' : 'hover:bg-[#FAF8F5]'}
                    >
                      <td className="py-2.5 px-3 align-top font-bold text-[#00A3E0] lowercase whitespace-nowrap">
                        {areaLabel}
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {action.title}
                        </div>
                        {action.notes && (
                          <div className={`text-[11px] mt-0.5 ${mutedText}`}>{action.notes}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 align-top text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {action.assignedTo}
                      </td>
                      <td className="py-2.5 px-3 align-top tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {action.targetDate || '—'}
                      </td>
                      <td className="py-2.5 px-3 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border lowercase ${statusBadge(
                            action.status
                          )}`}
                        >
                          <span>•</span>
                          <span>{action.status === 'in-progress' ? 'in progress' : action.status}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 align-top text-right whitespace-nowrap">
                        {isConfirmDelete ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteAction(action.id)}
                              className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-bold cursor-pointer lowercase"
                            >
                              delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteActionId(null)}
                              className="px-1.5 py-0.5 rounded text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer lowercase"
                            >
                              no
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingActionId(action.id);
                                setEditDraft({ ...action });
                              }}
                              className="p-1.5 rounded text-slate-400 hover:text-[#00A3E0] hover:bg-slate-100 dark:hover:bg-[#1E293B] cursor-pointer"
                              title="Edit action"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteActionId(action.id)}
                              className="p-1.5 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-[#1E293B] cursor-pointer"
                              title="Delete action"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
