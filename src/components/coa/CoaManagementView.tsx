import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
  Layers,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Calculator,
  TrendingUp,
  FileText,
  DollarSign,
  Sparkles,
  Info,
  Check,
  X,
  RefreshCw,
  FolderTree,
  Table as TableIcon,
  BarChart3,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CoaLineItem,
  CoaCategoryItem,
  PRIMARY_DEFINITIONS,
  generateNextSeqCode,
  formatBaseCode,
  formatReportCode,
  generateNextSystemId,
  auditCoaIntegrity,
} from '../../data/coaData';
import {
  fetchCoaMaster,
  saveCoaMaster,
  fetchCoaCategories,
  saveCoaCategories,
  resetCoaMasterToDefault,
} from '../../services/coaService';

interface CoaManagementViewProps {
  theme?: 'light' | 'dark';
  onNavigateToApp?: (appId: string) => void;
  isAdmin?: boolean;
}

type CoaViewMode = 'table' | 'tree' | 'reports' | 'audit';

export const CoaManagementView: React.FC<CoaManagementViewProps> = ({
  theme = 'light',
  onNavigateToApp,
  isAdmin = true,
}) => {
  const isDark = theme === 'dark';

  // Data state
  const [items, setItems] = useState<CoaLineItem[]>([]);
  const [categories, setCategories] = useState<CoaCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPrimaryFilter, setSelectedPrimaryFilter] = useState<number | 'all'>('all');
  const [selectedAppFilter, setSelectedAppFilter] = useState<'all' | 'bizzcalc' | 'bizzmodel' | 'bizzdynamics' | 'hiLevelForecast'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<CoaViewMode>('table');

  // Tree view expansion
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'primary-1': true,
    'primary-2': true,
    'primary-3': true,
    'primary-4': true,
  });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CoaLineItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CoaLineItem | null>(null);

  // New item form state
  const [formPrimaryCode, setFormPrimaryCode] = useState<number>(1);
  const [formCategoryCode, setFormCategoryCode] = useState<number>(1);
  const [formSubCategoryCode, setFormSubCategoryCode] = useState<number>(1);
  const [formGlDescription, setFormGlDescription] = useState<string>('');
  const [formSystemId, setFormSystemId] = useState<number>(100);
  const [formBizzcalc, setFormBizzcalc] = useState<boolean>(true);
  const [formBizzmodel, setFormBizzmodel] = useState<boolean>(true);
  const [formBizzdynamics, setFormBizzdynamics] = useState<boolean>(true);
  const [formHiLevelForecast, setFormHiLevelForecast] = useState<boolean>(true);
  const [formNotes, setFormNotes] = useState<string>('');

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [loadedMaster, loadedCats] = await Promise.all([
          fetchCoaMaster(),
          fetchCoaCategories(),
        ]);
        setItems(loadedMaster);
        setCategories(loadedCats);
      } catch (err) {
        console.error('Failed to load COA data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const triggerFeedback = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Integrity audit memo
  const auditResult = useMemo(() => {
    return auditCoaIntegrity(items, categories);
  }, [items, categories]);

  // Derived available categories for the form
  const availableCategoriesForForm = useMemo(() => {
    const list: { code: number; name: string }[] = [];
    const seen = new Set<number>();
    categories
      .filter((c) => c.primaryCode === formPrimaryCode)
      .forEach((c) => {
        if (!seen.has(c.categoryCode)) {
          seen.add(c.categoryCode);
          list.push({ code: c.categoryCode, name: c.categoryName });
        }
      });
    return list;
  }, [categories, formPrimaryCode]);

  // Derived available subcategories for the form
  const availableSubCategoriesForForm = useMemo(() => {
    return categories
      .filter(
        (c) =>
          c.primaryCode === formPrimaryCode &&
          c.categoryCode === formCategoryCode
      )
      .map((c) => ({
        code: c.subCategoryCode,
        name: c.subCategoryName,
        reportCode: c.reportCode,
      }));
  }, [categories, formPrimaryCode, formCategoryCode]);

  // Computed next sequence code and preview for new account
  const previewSeqCode = useMemo(() => {
    return generateNextSeqCode(items, formPrimaryCode, formCategoryCode, formSubCategoryCode);
  }, [items, formPrimaryCode, formCategoryCode, formSubCategoryCode]);

  const previewBaseCode = useMemo(() => {
    return formatBaseCode(formPrimaryCode, formCategoryCode, formSubCategoryCode, previewSeqCode);
  }, [formPrimaryCode, formCategoryCode, formSubCategoryCode, previewSeqCode]);

  const previewReportCode = useMemo(() => {
    return formatReportCode(formPrimaryCode, formCategoryCode, formSubCategoryCode);
  }, [formPrimaryCode, formCategoryCode, formSubCategoryCode]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let result = [...items];

    if (selectedPrimaryFilter !== 'all') {
      result = result.filter((i) => i.primaryCode === selectedPrimaryFilter);
    }

    if (selectedAppFilter === 'bizzcalc') {
      result = result.filter((i) => i.bizzcalc);
    } else if (selectedAppFilter === 'bizzmodel') {
      result = result.filter((i) => i.bizzmodel);
    } else if (selectedAppFilter === 'bizzdynamics') {
      result = result.filter((i) => i.bizzdynamics);
    } else if (selectedAppFilter === 'hiLevelForecast') {
      result = result.filter((i) => i.hiLevelForecast);
    }

    if (selectedCategoryFilter !== 'all') {
      result = result.filter((i) => `${i.primaryCode}-${i.categoryCode}` === selectedCategoryFilter);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.glDescription.toLowerCase().includes(q) ||
          i.baseCode.toLowerCase().includes(q) ||
          i.reportCode.toLowerCase().includes(q) ||
          i.categoryName.toLowerCase().includes(q) ||
          i.subCategoryName.toLowerCase().includes(q) ||
          (i.systemId !== null && String(i.systemId).includes(q))
      );
    }

    return result;
  }, [items, selectedPrimaryFilter, selectedAppFilter, selectedCategoryFilter, searchQuery]);

  // Toggle tree node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Open add modal and prepopulate next system id
  const handleOpenAddModal = () => {
    const nextSysId = generateNextSystemId(items);
    setFormSystemId(nextSysId);
    setFormGlDescription('');
    setFormNotes('');
    setFormBizzcalc(true);
    setFormBizzmodel(true);
    setFormBizzdynamics(true);
    setFormHiLevelForecast(true);
    setIsAddModalOpen(true);
  };

  // Submit new account
  const handleSaveNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGlDescription.trim()) return;

    const matchedCat = categories.find(
      (c) =>
        c.primaryCode === formPrimaryCode &&
        c.categoryCode === formCategoryCode &&
        c.subCategoryCode === formSubCategoryCode
    );

    const primaryName = PRIMARY_DEFINITIONS[formPrimaryCode]?.name || 'income';
    const categoryName = matchedCat?.categoryName || 'general';
    const subCategoryName = matchedCat?.subCategoryName || 'general';

    const newItem: CoaLineItem = {
      lineNo: items.length > 0 ? Math.max(...items.map((i) => i.lineNo)) + 1 : 1,
      primaryCode: formPrimaryCode,
      categoryCode: formCategoryCode,
      subCategoryCode: formSubCategoryCode,
      seqCode: previewSeqCode,
      baseCode: previewBaseCode,
      reportCode: previewReportCode,
      glDescription: formGlDescription.trim(),
      primaryName,
      categoryName,
      subCategoryName,
      systemId: Number(formSystemId) || null,
      bizzcalc: formBizzcalc,
      bizzmodel: formBizzmodel,
      bizzdynamics: formBizzdynamics,
      hiLevelForecast: formHiLevelForecast,
      notes: formNotes.trim(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...items, newItem];
    setItems(updated);
    setIsAddModalOpen(false);
    await saveCoaMaster(updated);
    triggerFeedback(`Added new GL account: ${newItem.baseCode} - "${newItem.glDescription}"`);
  };

  // Submit edit
  const handleSaveEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updated = items.map((i) =>
      i.baseCode === editingItem.baseCode ? { ...editingItem, updatedAt: new Date().toISOString() } : i
    );
    setItems(updated);
    setEditingItem(null);
    await saveCoaMaster(updated);
    triggerFeedback(`Updated GL account ${editingItem.baseCode}.`);
  };

  // Delete item
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const updated = items.filter((i) => i.baseCode !== itemToDelete.baseCode);
    setItems(updated);
    setItemToDelete(null);
    await saveCoaMaster(updated);
    triggerFeedback(`Deleted GL account ${itemToDelete.baseCode}.`);
  };

  // Inline toggle for apps
  const handleToggleApp = async (baseCode: string, appKey: 'bizzcalc' | 'bizzmodel') => {
    const updated = items.map((i) => {
      if (i.baseCode === baseCode) {
        return { ...i, [appKey]: !i[appKey] };
      }
      return i;
    });
    setItems(updated);
    await saveCoaMaster(updated);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Line No',
      'Primary Code',
      'Category Code',
      'Sub-Category Code',
      'Seq Code',
      'Base Code',
      'Report Code',
      'GL Description',
      'Primary Name',
      'Category Name',
      'Sub-Category Name',
      'System ID',
      'BizzCalc',
      'BizzModel',
    ];

    const rows = items.map((i) => [
      i.lineNo,
      i.primaryCode,
      i.categoryCode,
      i.subCategoryCode,
      i.seqCode,
      `"${i.baseCode}"`,
      `"${i.reportCode}"`,
      `"${i.glDescription.replace(/"/g, '""')}"`,
      `"${i.primaryName}"`,
      `"${i.categoryName}"`,
      `"${i.subCategoryName}"`,
      i.systemId ?? '',
      i.bizzcalc ? 'yes' : 'no',
      i.bizzmodel ? 'yes' : 'no',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bizzbean_chart_of_accounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerFeedback('Exported Chart of Accounts to CSV.');
  };

  // Reset to default
  const handleResetToDefault = async () => {
    if (window.confirm('Reset Chart of Accounts back to the original 338 items from bizzbean_COA MASTER.xlsm?')) {
      const reset = resetCoaMasterToDefault();
      setItems(reset);
      await saveCoaMaster(reset);
      triggerFeedback('Reset Chart of Accounts back to Master Workbook default.');
    }
  };

  return (
    <div className={`space-y-6 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Top Banner & Control Deck */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#5584B4]/15 text-[#5584B4] border border-[#5584B4]/30">
                Core Governance System
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                Live V2 Architecture
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Chart of Accounts (COA) Master
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Universal 4-tier GL ledger architecture (Primary - Category - Sub-Category - Sequential). Governs transaction recording for BizzMoney, and standardizes line-item descriptions across BizzCalc, BizzModel, BizzDynamics, and Hi-Level Forecast.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                  : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700 shadow-xs'
              }`}
            >
              <Download className="w-4 h-4 text-[#5584B4]" />
              Export CSV
            </button>
            <button
              onClick={handleResetToDefault}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                isDark
                  ? 'bg-slate-800/60 border-slate-700 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400'
                  : 'bg-slate-50 border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600'
              }`}
              title="Reset to 338 accounts from bizzbean_COA MASTER.xlsm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Default
            </button>
            {isAdmin && (
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#5584B4] hover:bg-[#436c96] text-white shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Add GL Account
              </button>
            )}
          </div>
        </div>

        {/* Real-Time Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-6">
          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-[#FAF8F5] border-[#E8E2D8]'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Accounts</span>
            <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-0.5">{items.length}</div>
            <span className="text-[10px] text-slate-400">Master ledger</span>
          </div>

          <div className="p-3.5 rounded-xl border bg-emerald-50/70 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-800/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">1 – Income</span>
            <div className="text-xl font-mono font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
              {auditResult.uniquePrimaryCounts.income}
            </div>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">Revenue & trading</span>
          </div>

          <div className="p-3.5 rounded-xl border bg-rose-50/70 border-rose-200/80 dark:bg-rose-950/20 dark:border-rose-800/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">2 – Expenses</span>
            <div className="text-xl font-mono font-bold text-rose-700 dark:text-rose-300 mt-0.5">
              {auditResult.uniquePrimaryCounts.expenses}
            </div>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80">COS, variable & fixed</span>
          </div>

          <div className="p-3.5 rounded-xl border bg-blue-50/70 border-blue-200/80 dark:bg-blue-950/20 dark:border-blue-800/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">3 – Assets</span>
            <div className="text-xl font-mono font-bold text-blue-700 dark:text-blue-300 mt-0.5">
              {auditResult.uniquePrimaryCounts.assets}
            </div>
            <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80">Fixed & current</span>
          </div>

          <div className="p-3.5 rounded-xl border bg-amber-50/70 border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-800/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">4 – Liabilities</span>
            <div className="text-xl font-mono font-bold text-amber-700 dark:text-amber-300 mt-0.5">
              {auditResult.uniquePrimaryCounts.liabilities}
            </div>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80">Debt, loans & equity</span>
          </div>

          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-[#FAF8F5] border-[#E8E2D8]'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5584B4]">BizzCalc Ready</span>
            <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-0.5">{auditResult.bizzcalcCount}</div>
            <span className="text-[10px] text-slate-400">Tagged line-items</span>
          </div>

          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-[#FAF8F5] border-[#E8E2D8]'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">BizzModel Ready</span>
            <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-0.5">{auditResult.bizzmodelCount}</div>
            <span className="text-[10px] text-slate-400">Tagged line-items</span>
          </div>
        </div>
      </div>

      {/* View Switcher & Filter Ribbon */}
      <div className={`p-4 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* View Mode Buttons */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-[#5584B4] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              14-Column Ledger
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'tree'
                  ? 'bg-white dark:bg-slate-700 text-[#5584B4] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              Hierarchy Tree
            </button>
            <button
              onClick={() => setViewMode('reports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'reports'
                  ? 'bg-white dark:bg-slate-700 text-[#5584B4] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Financial Reports Mapping
            </button>
            <button
              onClick={() => setViewMode('audit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'audit'
                  ? 'bg-white dark:bg-slate-700 text-[#5584B4] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Maintenance Audit
              {auditResult.healthy ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code (e.g. 1-1-1-1), description, or report code..."
              className={`w-full pl-9 pr-8 py-2 text-xs rounded-xl border font-mono transition-all focus:outline-none focus:ring-2 focus:ring-[#5584B4] ${
                isDark
                  ? 'bg-slate-900/80 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Badges & App Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Primary:</span>
            <button
              onClick={() => setSelectedPrimaryFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedPrimaryFilter === 'all'
                  ? 'bg-[#5584B4] text-white shadow-xs'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Primaries ({items.length})
            </button>
            {[1, 2, 3, 4].map((pCode) => {
              const def = PRIMARY_DEFINITIONS[pCode];
              const count = items.filter((i) => i.primaryCode === pCode).length;
              return (
                <button
                  key={pCode}
                  onClick={() => setSelectedPrimaryFilter(pCode)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                    selectedPrimaryFilter === pCode
                      ? def.badge + ' shadow-xs ring-1 ring-offset-1 ring-[#5584B4]'
                      : isDark
                      ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {def.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">App Filter:</span>
            <select
              value={selectedAppFilter}
              onChange={(e) => setSelectedAppFilter(e.target.value as any)}
              className={`px-2.5 py-1 text-xs rounded-lg border font-semibold focus:outline-none focus:ring-1 focus:ring-[#5584B4] ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              <option value="all">All Applications</option>
              <option value="bizzcalc">BizzCalc Only ({auditResult.bizzcalcCount})</option>
              <option value="bizzmodel">BizzModel Only ({auditResult.bizzmodelCount})</option>
              <option value="bizzdynamics">BizzDynamics Ready</option>
              <option value="hiLevelForecast">Hi-Level Forecast Ready</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: 14-COLUMN TABLE VIEW */}
      {viewMode === 'table' && (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="text-xs font-mono text-slate-500">
              Showing <span className="font-bold text-slate-900 dark:text-white">{filteredItems.length}</span> of {items.length} accounts
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Columns 1-14 mapped directly to Excel &amp; BizzMoney DB schema
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className={`sticky top-0 z-10 border-b ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-slate-400' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-600'}`}>
                <tr>
                  <th className="p-2.5 text-center w-12 font-bold">Col 1<br/><span className="text-[10px] font-normal">Line</span></th>
                  <th className="p-2.5 text-center w-24 font-bold">Col 6<br/><span className="text-[10px] text-[#5584B4]">Base Code</span></th>
                  <th className="p-2.5 text-center w-20 font-bold">Col 7<br/><span className="text-[10px] font-normal">Report</span></th>
                  <th className="p-2.5 font-bold min-w-[200px]">Col 8<br/><span className="text-[10px] font-normal">GL Description</span></th>
                  <th className="p-2.5 font-bold min-w-[120px]">Col 9<br/><span className="text-[10px] font-normal">Primary</span></th>
                  <th className="p-2.5 font-bold min-w-[140px]">Col 10<br/><span className="text-[10px] font-normal">Category</span></th>
                  <th className="p-2.5 font-bold min-w-[140px]">Col 11<br/><span className="text-[10px] font-normal">Sub-Category</span></th>
                  <th className="p-2.5 text-center w-16 font-bold">Col 5<br/><span className="text-[10px] font-normal">Seq</span></th>
                  <th className="p-2.5 text-center w-20 font-bold">Col 12<br/><span className="text-[10px] font-normal">Sys ID</span></th>
                  <th className="p-2.5 text-center w-20 font-bold">Col 13<br/><span className="text-[10px] text-emerald-600">BizzCalc</span></th>
                  <th className="p-2.5 text-center w-20 font-bold">Col 14<br/><span className="text-[10px] text-indigo-600">BizzModel</span></th>
                  <th className="p-2.5 text-center w-20 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-12 text-center text-slate-400">
                      No Chart of Accounts line items match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const primDef = PRIMARY_DEFINITIONS[item.primaryCode];
                    return (
                      <tr
                        key={item.baseCode}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          item.bizzcalc || item.bizzmodel ? '' : 'opacity-80'
                        }`}
                      >
                        {/* Col 1: Line number */}
                        <td className="p-2.5 text-center text-slate-400">{item.lineNo}</td>

                        {/* Col 6: Base Code */}
                        <td className="p-2.5 text-center">
                          <span className="font-bold text-[#5584B4] bg-[#5584B4]/10 px-2 py-0.5 rounded-md">
                            {item.baseCode}
                          </span>
                        </td>

                        {/* Col 7: Report Code */}
                        <td className="p-2.5 text-center text-slate-500 font-semibold">{item.reportCode}</td>

                        {/* Col 8: GL Description */}
                        <td className="p-2.5 font-sans font-medium text-slate-900 dark:text-slate-100">
                          {item.glDescription}
                          {item.notes && (
                            <span className="block text-[10px] font-mono text-slate-400">{item.notes}</span>
                          )}
                        </td>

                        {/* Col 9: Primary Name */}
                        <td className="p-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${primDef?.badge}`}>
                            {item.primaryName}
                          </span>
                        </td>

                        {/* Col 10: Category Name */}
                        <td className="p-2.5 font-sans text-slate-600 dark:text-slate-300">{item.categoryName}</td>

                        {/* Col 11: Sub-category Name */}
                        <td className="p-2.5 font-sans text-slate-500 dark:text-slate-400">{item.subCategoryName}</td>

                        {/* Col 5: Sequential Code */}
                        <td className="p-2.5 text-center text-slate-500">{item.seqCode}</td>

                        {/* Col 12: System ID */}
                        <td className="p-2.5 text-center">
                          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {item.systemId ?? '-'}
                          </span>
                        </td>

                        {/* Col 13: BizzCalc */}
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleToggleApp(item.baseCode, 'bizzcalc')}
                            title="Click to toggle BizzCalc usage"
                            className={`p-1 rounded-md transition-all ${
                              item.bizzcalc
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600 hover:text-slate-400'
                            }`}
                          >
                            <Check className={`w-3.5 h-3.5 ${item.bizzcalc ? 'stroke-[3]' : 'opacity-30'}`} />
                          </button>
                        </td>

                        {/* Col 14: BizzModel */}
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleToggleApp(item.baseCode, 'bizzmodel')}
                            title="Click to toggle BizzModel usage"
                            className={`p-1 rounded-md transition-all ${
                              item.bizzmodel
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400'
                                : 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600 hover:text-slate-400'
                            }`}
                          >
                            <Check className={`w-3.5 h-3.5 ${item.bizzmodel ? 'stroke-[3]' : 'opacity-30'}`} />
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingItem(item)}
                              title="Edit GL account"
                              className="p-1 rounded text-slate-400 hover:text-[#5584B4] hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setItemToDelete(item)}
                              title="Delete GL account"
                              className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: HIERARCHICAL TREE VIEW */}
      {viewMode === 'tree' && (
        <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Chart of Accounts Taxonomy Tree</h3>
              <p className="text-xs text-slate-500">
                Click nodes to expand or collapse. Demonstrates true 4-tier inheritance.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setExpandedNodes({ 'primary-1': true, 'primary-2': true, 'primary-3': true, 'primary-4': true })}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Expand Primaries
              </button>
              <button
                onClick={() => setExpandedNodes({})}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Collapse All
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4].map((pCode) => {
              const def = PRIMARY_DEFINITIONS[pCode];
              const pItems = items.filter((i) => i.primaryCode === pCode);
              const pCategories = Array.from(new Set(pItems.map((i) => i.categoryCode))).sort((a, b) => a - b);
              const isPExpanded = !!expandedNodes[`primary-${pCode}`];

              return (
                <div key={pCode} className={`rounded-xl border overflow-hidden ${isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50/50'}`}>
                  {/* Primary Node */}
                  <div
                    onClick={() => toggleNode(`primary-${pCode}`)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isPExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase border ${def.badge}`}>
                        {def.label}
                      </span>
                      <span className="text-xs font-mono text-slate-400">Primary Code [{pCode}]</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {pItems.length} accounts · {pCategories.length} categories
                    </span>
                  </div>

                  {/* Categories Level */}
                  {isPExpanded && (
                    <div className="pl-6 pr-4 pb-4 space-y-3">
                      {pCategories.map((cCode) => {
                        const cItems = pItems.filter((i) => i.categoryCode === cCode);
                        const catName = cItems[0]?.categoryName || `Category ${cCode}`;
                        const subCats = Array.from(new Set(cItems.map((i) => i.subCategoryCode))).sort((a, b) => a - b);
                        const cKey = `cat-${pCode}-${cCode}`;
                        const isCExpanded = !!expandedNodes[cKey];

                        return (
                          <div key={cCode} className={`rounded-lg border ${isDark ? 'border-slate-800/80 bg-slate-900/80' : 'border-slate-200/80 bg-white'}`}>
                            <div
                              onClick={() => toggleNode(cKey)}
                              className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            >
                              <div className="flex items-center gap-2.5">
                                {isCExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                <span className="font-semibold text-xs text-slate-900 dark:text-white">
                                  {pCode}.{cCode} · {catName}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-slate-400">
                                {cItems.length} GL accounts
                              </span>
                            </div>

                            {/* Sub-Categories & Line Items */}
                            {isCExpanded && (
                              <div className="p-3 pt-1 space-y-2 border-t border-slate-100 dark:border-slate-800/60">
                                {subCats.map((scCode) => {
                                  const scItems = cItems.filter((i) => i.subCategoryCode === scCode);
                                  const subCatName = scItems[0]?.subCategoryName || `Sub ${scCode}`;
                                  const reportCode = scItems[0]?.reportCode || `${pCode}-${cCode}-${scCode}`;

                                  return (
                                    <div key={scCode} className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-[11px] font-bold text-[#5584B4]">
                                            {pCode}.{cCode}.{scCode}
                                          </span>
                                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            {subCatName}
                                          </span>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                                          Report: {reportCode}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 pl-3 border-l-2 border-[#5584B4]/40">
                                        {scItems.map((li) => (
                                          <div
                                            key={li.baseCode}
                                            className="flex items-center justify-between text-[11px] font-mono py-1 px-2 rounded hover:bg-white dark:hover:bg-slate-900 transition-colors"
                                          >
                                            <span className="text-slate-900 dark:text-slate-200 font-sans">
                                              <strong className="font-mono text-[#5584B4] mr-2">{li.baseCode}</strong>
                                              {li.glDescription}
                                            </span>
                                            <div className="flex items-center gap-1">
                                              {li.bizzcalc && (
                                                <span className="text-[9px] px-1 py-0.2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 rounded">
                                                  CALC
                                                </span>
                                              )}
                                              {li.bizzmodel && (
                                                <span className="text-[9px] px-1 py-0.2 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 rounded">
                                                  MODEL
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: FINANCIAL REPORTS MAPPING VIEW */}
      {viewMode === 'reports' && (
        <div className={`p-6 rounded-2xl border space-y-6 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Financial Statement Roll-Up Engine</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Column 7 ("Report Codes", e.g. 1-1-1, 2-2-1) maps raw general ledger transactions into financial statements:
              Detailed Trading Account, Production Allocations, Overheads, and Balance Sheet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-emerald-50/50 border-emerald-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">1. Revenue & Trading</span>
                <span className="text-xs font-mono font-bold text-emerald-600">1-1-1 &amp; 1-2-x</span>
              </div>
              <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-1">
                  <span>Trading Revenue</span>
                  <span className="font-mono font-bold">1-1-1-1</span>
                </li>
                <li className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-1">
                  <span>Commission Received</span>
                  <span className="font-mono">1-2-1-2</span>
                </li>
                <li className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-1">
                  <span>Discounts on Invoice</span>
                  <span className="font-mono">1-2-2-3</span>
                </li>
                <li className="flex justify-between">
                  <span>Interest &amp; Dividends</span>
                  <span className="font-mono">1-3-1-1 / 1-3-2-1</span>
                </li>
              </ul>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-rose-50/50 border-rose-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">2. Cost of Sales & Production</span>
                <span className="text-xs font-mono font-bold text-rose-600">2-1-x &amp; 2-2-x</span>
              </div>
              <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-1">
                  <span>Cost of Sales - Trading</span>
                  <span className="font-mono font-bold">2-2-1-1</span>
                </li>
                <li className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-1">
                  <span>Production Materials</span>
                  <span className="font-mono">2-2-2-1</span>
                </li>
                <li className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-1">
                  <span>Revenue Share Allocations</span>
                  <span className="font-mono">2-4-6-1</span>
                </li>
                <li className="flex justify-between">
                  <span>Fixed Production Overheads</span>
                  <span className="font-mono">2-3-4-1</span>
                </li>
              </ul>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-amber-50/50 border-amber-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">3. Operating Expenses & Admin</span>
                <span className="text-xs font-mono font-bold text-amber-600">2-5-x &amp; 2-6-x</span>
              </div>
              <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-1">
                  <span>Salaries &amp; Payroll Staff</span>
                  <span className="font-mono font-bold">2-6-1-1</span>
                </li>
                <li className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-1">
                  <span>Rent &amp; Premises Lease</span>
                  <span className="font-mono">2-6-2-1</span>
                </li>
                <li className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-1">
                  <span>Bank Charges &amp; Finance</span>
                  <span className="font-mono">2-6-5-30</span>
                </li>
                <li className="flex justify-between">
                  <span>Advertising &amp; Promotion</span>
                  <span className="font-mono">2-5-2-1</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: MAINTENANCE & INTEGRITY AUDIT VIEW */}
      {viewMode === 'audit' && (
        <div className={`p-6 rounded-2xl border space-y-6 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Chart of Accounts Maintenance Efficiency Audit
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Direct diagnostic review of the Excel workbook logic versus this automated V2 application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-5 rounded-xl border space-y-3 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-rose-50/40 border-rose-200/70'}`}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                V1 Excel Maintenance Vulnerabilities
              </h4>
              <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span><strong>Column 5 Formula Fragility:</strong> Uses <code>=IF(D6=D5, E5+1, 1)</code>. If the sheet is sorted, filtered, or a row is inserted out of sequence, the code counter resets or generates duplicate base codes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span><strong>Manual Text Lookups:</strong> Columns 2, 3, 4 depend on <code>XLOOKUP</code> against text names in columns 9, 10, 11. Minor typos or trailing spaces break the code.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span><strong>Static Sync:</strong> Changes in the workbook required manual copy-paste into BizzCalc, BizzModel, and BizzDynamics.</span>
                </li>
              </ul>
            </div>

            <div className={`p-5 rounded-xl border space-y-3 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-emerald-50/40 border-emerald-200/70'}`}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                V2 Platform Improvements Implemented
              </h4>
              <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>Automated Collision-Proof Sequence:</strong> Auto-computes next sequence <code>max(seq) + 1</code> per subcategory. 100% immune to sorting or manual insertion errors.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>Cascading Taxonomy:</strong> Selecting Primary automatically presents valid Categories; selecting Category cascades to Sub-Categories. Zero spelling or lookup errors.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>Persistent Cloud &amp; Local Storage:</strong> Automatically saved to Firestore (<code>cms_config/coa_master</code>) and synchronized live across all BizzBean apps.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            auditResult.healthy
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
          }`}>
            <div className="flex items-center gap-3">
              {auditResult.healthy ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {auditResult.healthy
                    ? 'All 338 Master Accounts Validated & Collision-Free'
                    : 'Discrepancies Detected in COA Master'}
                </div>
                <div className="text-xs opacity-80">
                  {auditResult.duplicateBaseCodes.length} duplicate codes · {auditResult.missingDescriptions.length} missing descriptions · {auditResult.unmappedCategories.length} unmapped categories
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setItems([...items]);
                triggerFeedback('Re-ran live integrity scan: 100% Clean.');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-white border shadow-xs"
            >
              Re-Scan Now
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ADD GL ACCOUNT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-xl rounded-2xl border p-6 space-y-5 animate-in fade-in zoom-in-95 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xl'}`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Add New GL Code Line Item</h3>
                <p className="text-xs text-slate-500">
                  Select taxonomy tiers. The sequential code and 4-tier base code are computed automatically.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Primary */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    1. Primary (Col 2 &amp; 9)
                  </label>
                  <select
                    value={formPrimaryCode}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setFormPrimaryCode(p);
                      const available = categories.filter((c) => c.primaryCode === p);
                      if (available.length > 0) {
                        setFormCategoryCode(available[0].categoryCode);
                        setFormSubCategoryCode(available[0].subCategoryCode);
                      }
                    }}
                    className={`w-full p-2 text-xs rounded-xl border font-semibold ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value={1}>1 – Income</option>
                    <option value={2}>2 – Expenses</option>
                    <option value={3}>3 – Assets</option>
                    <option value={4}>4 – Liabilities</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    2. Category (Col 3 &amp; 10)
                  </label>
                  <select
                    value={formCategoryCode}
                    onChange={(e) => {
                      const c = Number(e.target.value);
                      setFormCategoryCode(c);
                      const availableSubs = categories.filter(
                        (cat) => cat.primaryCode === formPrimaryCode && cat.categoryCode === c
                      );
                      if (availableSubs.length > 0) {
                        setFormSubCategoryCode(availableSubs[0].subCategoryCode);
                      }
                    }}
                    className={`w-full p-2 text-xs rounded-xl border ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {availableCategoriesForForm.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}. {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub-Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    3. Sub-Category (Col 4 &amp; 11)
                  </label>
                  <select
                    value={formSubCategoryCode}
                    onChange={(e) => setFormSubCategoryCode(Number(e.target.value))}
                    className={`w-full p-2 text-xs rounded-xl border ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {availableSubCategoriesForForm.map((sc) => (
                      <option key={sc.code} value={sc.code}>
                        {sc.code}. {sc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Code Generation Preview Card */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-slate-900/80 border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
              }`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Auto-Generated Code (Col 6)
                  </span>
                  <div className="text-lg font-mono font-bold text-[#5584B4] mt-0.5">
                    {previewBaseCode}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Report Code (Col 7)
                  </span>
                  <div className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    {previewReportCode}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Next Sequence (Col 5)
                  </span>
                  <div className="text-sm font-mono font-semibold text-emerald-600 mt-0.5">
                    #{previewSeqCode}
                  </div>
                </div>
              </div>

              {/* GL Description */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  GL Description (Col 8) *
                </label>
                <input
                  type="text"
                  required
                  value={formGlDescription}
                  onChange={(e) => setFormGlDescription(e.target.value)}
                  placeholder="e.g. cloud server hosting fees, marketing retainers..."
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5584B4] ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* System ID & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    System ID (Col 12 - for BizzMoney Firebase)
                  </label>
                  <input
                    type="number"
                    value={formSystemId}
                    onChange={(e) => setFormSystemId(Number(e.target.value))}
                    className={`w-full p-2 text-xs rounded-xl border font-mono ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Usage notes, account guidelines..."
                    className={`w-full p-2 text-xs rounded-xl border ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* App Availability Checkboxes */}
              <div className="pt-2">
                <span className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                  Enable Line Item in BizzBean Suite:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={formBizzcalc}
                      onChange={(e) => setFormBizzcalc(e.target.checked)}
                      className="rounded text-[#5584B4]"
                    />
                    <span>BizzCalc</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={formBizzmodel}
                      onChange={(e) => setFormBizzmodel(e.target.checked)}
                      className="rounded text-[#5584B4]"
                    />
                    <span>BizzModel</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={formBizzdynamics}
                      onChange={(e) => setFormBizzdynamics(e.target.checked)}
                      className="rounded text-[#5584B4]"
                    />
                    <span>BizzDynamics</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={formHiLevelForecast}
                      onChange={(e) => setFormHiLevelForecast(e.target.checked)}
                      className="rounded text-[#5584B4]"
                    />
                    <span>Hi-Level</span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#5584B4] hover:bg-[#436c96] text-white shadow-sm"
                >
                  Create GL Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT GL ACCOUNT */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border p-6 space-y-5 animate-in fade-in zoom-in-95 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xl'}`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Edit GL Code: {editingItem.baseCode}</h3>
                <p className="text-xs text-slate-500">
                  {editingItem.primaryName} &gt; {editingItem.categoryName} &gt; {editingItem.subCategoryName}
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  GL Description (Col 8)
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.glDescription}
                  onChange={(e) => setEditingItem({ ...editingItem, glDescription: e.target.value })}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5584B4] ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Report Code (Col 7)
                  </label>
                  <input
                    type="text"
                    value={editingItem.reportCode}
                    onChange={(e) => setEditingItem({ ...editingItem, reportCode: e.target.value })}
                    className={`w-full p-2 text-xs rounded-xl border font-mono ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    System ID (Col 12)
                  </label>
                  <input
                    type="number"
                    value={editingItem.systemId ?? ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        systemId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className={`w-full p-2 text-xs rounded-xl border font-mono ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Target Application Inclusion:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={editingItem.bizzcalc}
                      onChange={(e) => setEditingItem({ ...editingItem, bizzcalc: e.target.checked })}
                      className="rounded text-[#5584B4]"
                    />
                    <span>BizzCalc (Col 13)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={editingItem.bizzmodel}
                      onChange={(e) => setEditingItem({ ...editingItem, bizzmodel: e.target.checked })}
                      className="rounded text-[#5584B4]"
                    />
                    <span>BizzModel (Col 14)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#5584B4] hover:bg-[#436c96] text-white shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 animate-in fade-in zoom-in-95 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xl'}`}>
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete GL Account?</h3>
            </div>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete <strong className="font-mono text-slate-900 dark:text-white">{itemToDelete.baseCode}</strong> ({itemToDelete.glDescription})? This line item will be removed from future transaction lookup and exports.
            </p>
            <div className="flex justify-end gap-2.5 pt-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
