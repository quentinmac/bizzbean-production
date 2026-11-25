import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Plus,
  Trash2,
  Copy,
  Settings2,
  X,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import {
  BizzBudgetWorkspaceState,
  BudgetBranch,
  BudgetRegion,
  BudgetStructureMode,
} from '../types';
import { createBranchModelState, createDefaultOperationalPlans } from '../defaultBudgetData';

interface BranchRegionManagerBarProps {
  workspace: BizzBudgetWorkspaceState;
  onUpdateWorkspace: (updater: (prev: BizzBudgetWorkspaceState) => BizzBudgetWorkspaceState) => void;
  theme?: 'light' | 'dark';
}

export const BranchRegionManagerBar: React.FC<BranchRegionManagerBarProps> = ({
  workspace,
  onUpdateWorkspace,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add Region form
  const [newRegionName, setNewRegionName] = useState('');
  const [newRegionCode, setNewRegionCode] = useState('');

  // Add Branch form
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchRegionId, setNewBranchRegionId] = useState(workspace.regions[0]?.id || 'reg-gp');
  const [newBranchEqPct, setNewBranchEqPct] = useState(40);

  const activeBranch =
    workspace.branches.find((b) => b.id === workspace.activeBranchId) || workspace.branches[0];
  const activeRegion = workspace.regions.find((r) => r.id === activeBranch?.regionId);

  const handleToggleStructureMode = (nextMode: BudgetStructureMode) => {
    onUpdateWorkspace((prev) => {
      let nextActiveId = prev.activeBranchId;
      if (nextMode === 'standalone') {
        // Default to first operating branch (or first branch) in standalone mode
        const opBranch = prev.branches.find((b) => !b.isHoldingCompany) || prev.branches[0];
        if (opBranch) nextActiveId = opBranch.id;
      }
      return {
        ...prev,
        structureMode: nextMode,
        activeBranchId: nextActiveId,
        consolidationLevel: nextMode === 'standalone' ? 'branch' : prev.consolidationLevel,
        selectedReportBranchId: nextActiveId,
      };
    });
  };

  const handleAddRegion = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newRegionName.trim();
    if (!cleanName) return;
    const cleanCode =
      newRegionCode.trim().toUpperCase() ||
      cleanName
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 4);
    const region: BudgetRegion = {
      id: `reg-${Date.now()}`,
      name: cleanName,
      code: cleanCode || 'REG',
    };
    onUpdateWorkspace((prev) => ({
      ...prev,
      regions: [...prev.regions, region],
    }));
    setNewRegionName('');
    setNewRegionCode('');
    setNewBranchRegionId(region.id);
  };

  const handleDeleteRegion = (regionId: string) => {
    if (workspace.regions.length <= 1) return;
    const fallback = workspace.regions.find((r) => r.id !== regionId);
    onUpdateWorkspace((prev) => ({
      ...prev,
      regions: prev.regions.filter((r) => r.id !== regionId),
      branches: prev.branches.map((b) =>
        b.regionId === regionId && fallback ? { ...b, regionId: fallback.id } : b
      ),
      selectedRegionId:
        prev.selectedRegionId === regionId && fallback ? fallback.id : prev.selectedRegionId,
    }));
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newBranchName.trim();
    if (!cleanName) return;
    const cleanCode =
      newBranchCode.trim().toUpperCase() || `BR-${workspace.branches.length + 1}`;
    const targetRegion = newBranchRegionId || workspace.regions[0]?.id || 'reg-gp';
    const newBranch: BudgetBranch = {
      id: `br-${Date.now()}`,
      name: cleanName,
      code: cleanCode,
      regionId: targetRegion,
      isHoldingCompany: false,
      equityLoanPctOfTotalAssets: Math.max(0, Math.min(100, Number(newBranchEqPct) || 40)),
      directInvestmentAmount: 0,
      state: createBranchModelState({
        name: cleanName,
        isHoldingCompany: false,
        scaleFactor: 1,
      }),
      execAdjustments: {},
      operationalPlans: createDefaultOperationalPlans(cleanName),
    };
    onUpdateWorkspace((prev) => ({
      ...prev,
      branches: [...prev.branches, newBranch],
      activeBranchId: newBranch.id,
      selectedReportBranchId: newBranch.id,
    }));
    setNewBranchName('');
    setNewBranchCode('');
  };

  const handleDuplicateBranch = (source: BudgetBranch) => {
    if (source.isHoldingCompany) return;
    const copyName = `${source.name} (Copy)`;
    const cloned: BudgetBranch = {
      ...JSON.parse(JSON.stringify(source)),
      id: `br-${Date.now()}`,
      name: copyName,
      code: `${source.code}-2`,
    };
    cloned.state.businessDetails.businessName = copyName;
    onUpdateWorkspace((prev) => ({
      ...prev,
      branches: [...prev.branches, cloned],
      activeBranchId: cloned.id,
    }));
  };

  const handleDeleteBranch = (branchId: string) => {
    const target = workspace.branches.find((b) => b.id === branchId);
    if (!target || target.isHoldingCompany) return;
    const operatingBranches = workspace.branches.filter((b) => !b.isHoldingCompany);
    if (operatingBranches.length <= 1) return;

    onUpdateWorkspace((prev) => {
      const remaining = prev.branches.filter((b) => b.id !== branchId);
      const nextActive =
        prev.activeBranchId === branchId
          ? remaining.find((b) => !b.isHoldingCompany)?.id || remaining[0]?.id || ''
          : prev.activeBranchId;
      return {
        ...prev,
        branches: remaining,
        activeBranchId: nextActive,
        selectedReportBranchId:
          prev.selectedReportBranchId === branchId ? nextActive : prev.selectedReportBranchId,
      };
    });
  };

  const handlePatchBranch = (branchId: string, patch: Partial<BudgetBranch>) => {
    onUpdateWorkspace((prev) => ({
      ...prev,
      branches: prev.branches.map((b) => {
        if (b.id !== branchId) return b;
        const updated = { ...b, ...patch };
        if (patch.name) {
          updated.state = {
            ...updated.state,
            businessDetails: {
              ...updated.state.businessDetails,
              businessName: patch.name,
            },
          };
        }
        return updated;
      }),
    }));
  };

  const visibleBranches =
    workspace.structureMode === 'standalone'
      ? workspace.branches.filter((b) => !b.isHoldingCompany).slice(0, 1)
      : workspace.branches;

  const inputSurface = isDark
    ? 'bg-[#0A0F1D] border-[#2B3759] text-slate-100'
    : 'bg-white border-[#D8CEBC] text-slate-900';

  return (
    <>
      {/* Compact Entity & Structure Bar */}
      <div
        className={`px-4 sm:px-6 py-2 border-b flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono shrink-0 ${
          isDark
            ? 'bg-[#0E1424] border-[#222F4C] text-slate-200'
            : 'bg-white/95 border-[#D8CEBC] text-slate-800'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Horizon Badge */}
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#9FC754]/20 text-[#4E6E1A] dark:text-[#9FC754] border border-[#9FC754]/40">
            12-month budget
          </span>

          {/* Standalone vs Multi-Branch Switch */}
          <div
            className={`inline-flex p-0.5 rounded-lg border ${
              isDark ? 'bg-[#0A0D14] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
            }`}
          >
            <button
              type="button"
              onClick={() => handleToggleStructureMode('standalone')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold lowercase transition-colors cursor-pointer ${
                workspace.structureMode === 'standalone'
                  ? 'bg-[#2E5E88] text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              stand-alone branch
            </button>
            <button
              type="button"
              onClick={() => handleToggleStructureMode('multi-branch')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold lowercase transition-colors cursor-pointer ${
                workspace.structureMode === 'multi-branch'
                  ? 'bg-[#2E5E88] text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              multi-branch group
            </button>
          </div>

          {/* Active Branch Selector */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#5584B4] shrink-0" />
            <span className="text-[11px] text-slate-500 hidden sm:inline">editing:</span>
            <select
              value={activeBranch?.id || ''}
              onChange={(e) =>
                onUpdateWorkspace((prev) => ({
                  ...prev,
                  activeBranchId: e.target.value,
                  selectedReportBranchId: e.target.value,
                }))
              }
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold outline-none cursor-pointer ${inputSurface}`}
            >
              {visibleBranches.map((br) => {
                const reg = workspace.regions.find((r) => r.id === br.regionId);
                return (
                  <option key={br.id} value={br.id}>
                    {br.isHoldingCompany
                      ? `★ ${br.name} [Holding Co · 100%]`
                      : `${br.name}${workspace.structureMode === 'multi-branch' && reg ? ` · ${reg.name}` : ''}`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Quick Region & Equity Loan Indicator */}
          {activeBranch && workspace.structureMode === 'multi-branch' && (
            <div className="hidden md:flex items-center gap-2 text-[11px]">
              {activeBranch.isHoldingCompany ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  100% owner · investment 3-2-1-29
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#161F36] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#252E4A]">
                    <MapPin className="w-3 h-3 text-[#5584B4]" />
                    {activeRegion?.name || 'Unassigned'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2E5E88]/10 text-[#2E5E88] dark:text-[#7EB2E2] border border-[#2E5E88]/25 font-semibold tabular-nums">
                    equity loan: -{activeBranch.equityLoanPctOfTotalAssets}% of total assets
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Manage Branches & Regions button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] font-bold lowercase transition-colors cursor-pointer ${
            isDark
              ? 'bg-[#161F36] border-[#2B3759] text-slate-200 hover:border-[#00A3E0]'
              : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-700 hover:border-[#2E5E88]'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5 text-[#5584B4]" />
          <span>
            {workspace.structureMode === 'multi-branch'
              ? `branches & regions (${workspace.branches.length})`
              : 'branch settings'}
          </span>
        </button>
      </div>

      {/* Branches & Regions Setup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-4xl max-h-[88vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden font-mono ${
              isDark
                ? 'bg-[#0F1526] border-[#222F4C] text-slate-100'
                : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`px-5 py-4 border-b flex items-center justify-between ${
                isDark ? 'bg-[#151D33] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
              }`}
            >
              <div>
                <h3 className="text-sm sm:text-base font-bold lowercase flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#5584B4]" />
                  <span>bizzbudget · group, regions &amp; branches setup</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  configure standalone or multi-branch group hierarchy, 100% holding ownership (3-2-1-29), and branch equity loan % of total assets.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Group Name & Mode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 lowercase">
                    group / company name
                  </label>
                  <input
                    type="text"
                    value={workspace.groupName}
                    onChange={(e) =>
                      onUpdateWorkspace((prev) => ({ ...prev, groupName: e.target.value }))
                    }
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${inputSurface}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 lowercase">
                    budget period label (12 months)
                  </label>
                  <input
                    type="text"
                    value={workspace.budgetYearLabel}
                    onChange={(e) =>
                      onUpdateWorkspace((prev) => ({ ...prev, budgetYearLabel: e.target.value }))
                    }
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${inputSurface}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 lowercase">
                    structure mode
                  </label>
                  <select
                    value={workspace.structureMode}
                    onChange={(e) =>
                      handleToggleStructureMode(e.target.value as BudgetStructureMode)
                    }
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none cursor-pointer ${inputSurface}`}
                  >
                    <option value="multi-branch">Multi-Branch Group (Holding Co + Regions)</option>
                    <option value="standalone">Stand-Alone Branch</option>
                  </select>
                </div>
              </div>

              {/* Regions Section (Multi-Branch) */}
              {workspace.structureMode === 'multi-branch' && (
                <div
                  className={`rounded-xl border p-4 space-y-3 ${
                    isDark ? 'bg-[#121A2E] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#2E5E88] dark:text-[#7EB2E2]">
                      1. Regions ({workspace.regions.length})
                    </div>
                    <form onSubmit={handleAddRegion} className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={newRegionName}
                        onChange={(e) => setNewRegionName(e.target.value)}
                        placeholder="region name (e.g. KwaZulu-Natal)"
                        className={`px-2.5 py-1 text-xs rounded-lg border outline-none w-48 ${inputSurface}`}
                      />
                      <input
                        type="text"
                        value={newRegionCode}
                        onChange={(e) => setNewRegionCode(e.target.value)}
                        placeholder="code (KZN)"
                        className={`px-2.5 py-1 text-xs rounded-lg border outline-none w-24 uppercase ${inputSurface}`}
                      />
                      <button
                        type="submit"
                        disabled={!newRegionName.trim()}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#2E5E88] text-white text-xs font-bold disabled:opacity-40 cursor-pointer lowercase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>add region</span>
                      </button>
                    </form>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {workspace.regions.map((reg) => {
                      const brCount = workspace.branches.filter(
                        (b) => !b.isHoldingCompany && b.regionId === reg.id
                      ).length;
                      return (
                        <div
                          key={reg.id}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
                            isDark
                              ? 'bg-[#0C1222] border-[#252E4A]'
                              : 'bg-[#FAF8F5] border-[#D8CEBC]'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#5584B4]" />
                          <span className="font-bold">{reg.name}</span>
                          <span className="text-[10px] text-slate-400">
                            [{reg.code}] · {brCount} {brCount === 1 ? 'branch' : 'branches'}
                          </span>
                          {workspace.regions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRegion(reg.id)}
                              className="text-slate-400 hover:text-rose-500 cursor-pointer"
                              title="Delete region"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Branches Table */}
              <div
                className={`rounded-xl border p-4 space-y-3 ${
                  isDark ? 'bg-[#121A2E] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-[#2E5E88] dark:text-[#7EB2E2]">
                  {workspace.structureMode === 'multi-branch'
                    ? `2. Holding Company & Operating Branches (${workspace.branches.length})`
                    : 'Branch Configuration'}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-[#222F4C] text-[10px] uppercase text-slate-500">
                        <th className="py-2 px-2 text-left">entity / branch name</th>
                        <th className="py-2 px-2 text-left">code</th>
                        {workspace.structureMode === 'multi-branch' && (
                          <th className="py-2 px-2 text-left">region</th>
                        )}
                        <th className="py-2 px-2 text-right">equity loan (% assets)</th>
                        <th className="py-2 px-2 text-right">direct inv. (3-2-1-29)</th>
                        <th className="py-2 px-2 text-right">actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-[#1E293B]">
                      {visibleBranches.map((br) => (
                        <tr key={br.id}>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={br.name}
                              onChange={(e) => handlePatchBranch(br.id, { name: e.target.value })}
                              className={`w-full px-2 py-1 rounded border text-xs font-semibold outline-none ${inputSurface}`}
                            />
                            {br.isHoldingCompany && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                Holding Company · 100% owns all operating branches (Share Capital sits here)
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={br.code}
                              onChange={(e) =>
                                handlePatchBranch(br.id, { code: e.target.value.toUpperCase() })
                              }
                              className={`w-20 px-2 py-1 rounded border text-xs uppercase outline-none ${inputSurface}`}
                            />
                          </td>
                          {workspace.structureMode === 'multi-branch' && (
                            <td className="py-2 px-2">
                              {br.isHoldingCompany ? (
                                <span className="text-[11px] text-slate-400">Group Parent</span>
                              ) : (
                                <select
                                  value={br.regionId}
                                  onChange={(e) =>
                                    handlePatchBranch(br.id, { regionId: e.target.value })
                                  }
                                  className={`px-2 py-1 rounded border text-xs outline-none ${inputSurface}`}
                                >
                                  {workspace.regions.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                          )}
                          <td className="py-2 px-2 text-right">
                            {br.isHoldingCompany ? (
                              <span className="text-[10.5px] text-slate-400">
                                auto debit = Σ branches
                              </span>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                <span className="text-rose-500 font-bold">-</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={br.equityLoanPctOfTotalAssets}
                                  onChange={(e) =>
                                    handlePatchBranch(br.id, {
                                      equityLoanPctOfTotalAssets: Math.max(
                                        0,
                                        Math.min(100, Number(e.target.value) || 0)
                                      ),
                                    })
                                  }
                                  className={`w-16 px-2 py-1 rounded border text-xs text-right tabular-nums outline-none ${inputSurface}`}
                                />
                                <span className="text-slate-400">%</span>
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min={0}
                              step={10000}
                              value={br.directInvestmentAmount || 0}
                              onChange={(e) =>
                                handlePatchBranch(br.id, {
                                  directInvestmentAmount: Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                              className={`w-28 px-2 py-1 rounded border text-xs text-right tabular-nums outline-none ${inputSurface}`}
                            />
                          </td>
                          <td className="py-2 px-2 text-right whitespace-nowrap">
                            {!br.isHoldingCompany && workspace.structureMode === 'multi-branch' && (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateBranch(br)}
                                  className="p-1 rounded text-slate-400 hover:text-[#00A3E0] cursor-pointer"
                                  title="Duplicate branch"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBranch(br.id)}
                                  disabled={
                                    workspace.branches.filter((b) => !b.isHoldingCompany).length <= 1
                                  }
                                  className="p-1 rounded text-slate-400 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                                  title="Delete branch"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add New Operating Branch Form (Multi-Branch mode) */}
                {workspace.structureMode === 'multi-branch' && (
                  <form
                    onSubmit={handleAddBranch}
                    className={`pt-3 mt-2 border-t flex flex-wrap items-end gap-2 ${
                      isDark ? 'border-[#222F4C]' : 'border-[#E5DEC9]'
                    }`}
                  >
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">new branch name</label>
                      <input
                        type="text"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        placeholder="e.g. Durban Umhlanga Branch"
                        className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none w-52 ${inputSurface}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">code</label>
                      <input
                        type="text"
                        value={newBranchCode}
                        onChange={(e) => setNewBranchCode(e.target.value)}
                        placeholder="DBN-01"
                        className={`px-2.5 py-1.5 rounded-lg border text-xs uppercase outline-none w-24 ${inputSurface}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">region</label>
                      <select
                        value={newBranchRegionId}
                        onChange={(e) => setNewBranchRegionId(e.target.value)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none ${inputSurface}`}
                      >
                        {workspace.regions.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">equity loan %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={newBranchEqPct}
                        onChange={(e) => setNewBranchEqPct(Number(e.target.value) || 0)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs text-right tabular-nums outline-none w-20 ${inputSurface}`}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newBranchName.trim()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00A3E0] hover:bg-[#0284C7] text-white text-xs font-bold disabled:opacity-40 cursor-pointer lowercase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>add operating branch</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`px-5 py-3 border-t flex justify-end ${
                isDark ? 'bg-[#151D33] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-[#2E5E88] hover:bg-[#234A6C] text-white text-xs font-bold cursor-pointer lowercase"
              >
                done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
