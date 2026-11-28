import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ArrowRight,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Box,
} from 'lucide-react';
import {
  BizzBoxEntry,
  BIZZBOX_CATEGORIES,
  BIZZBOX_MODEL_CATALOG,
  BIZZBOX_MODEL_DESCRIPTION_MAP,
  BIZZBOX_MODEL_ID_MAP,
} from '../data/bizzboxSeedData';
import { ALL_MODEL_SETS, PlatformForecastAppId } from '../constants';
import {
  loadBizzBoxLocal,
  syncBizzBoxFromCloud,
  saveBizzBoxDirectory,
  resetBizzBoxDirectory,
} from '../../../services/bizzboxService';

interface BizzBoxPanelProps {
  theme?: 'light' | 'dark';
  mode: PlatformForecastAppId;
  activeModelSet: string;
  onApplyModelSet: (modelSetId: string) => void;
}

type LookupView = 'business-to-model' | 'model-to-business';
type AvailabilityFilter = 'all' | 'available';
type SortField = 'businessType' | 'category' | 'modelSet';

export const BizzBoxPanel: React.FC<BizzBoxPanelProps> = ({
  theme = 'light',
  mode,
  activeModelSet,
  onApplyModelSet,
}) => {
  const isDark = theme === 'dark';

  // Build set of currently runnable model-set IDs in BizzModel
  const liveModelSetIds = useMemo(() => {
    const live = new Set<string>();
    for (const cat of ALL_MODEL_SETS) {
      for (const ms of cat.modelSets) {
        if (
          ms.isAvailable &&
          (ms.id === 'unit-sales' || mode === 'bizzmodel' || mode === 'bizzforecasta' || mode === 'bizzbudget')
        ) {
          live.add(ms.id);
        }
      }
    }
    return live;
  }, [mode]);

  // Persistent directory state
  const [entries, setEntries] = useState<BizzBoxEntry[]>(() => loadBizzBoxLocal().entries);
  const [modelDescriptions, setModelDescriptions] = useState<Record<string, string>>(
    () => loadBizzBoxLocal().customModelDescriptions
  );
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'saved' | 'local'>('idle');

  // View & filters
  const [view, setView] = useState<LookupView>('business-to-model');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [sortField, setSortField] = useState<SortField>('businessType');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Add new entry form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newBusinessType, setNewBusinessType] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>(BIZZBOX_CATEGORIES[0] || 'trading');
  const [newCustomCategory, setNewCustomCategory] = useState<string>('');
  const [newModelSet, setNewModelSet] = useState<string>('unit sales');
  const [newCustomModelSet, setNewCustomModelSet] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [addError, setAddError] = useState<string>('');

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBusinessType, setEditBusinessType] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editModelSet, setEditModelSet] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Inline 2-step delete & reset confirmation (zero window.confirm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  // Expanded cards in Model -> Business Types view
  const [collapsedModels, setCollapsedModels] = useState<Record<string, boolean>>({});

  // Sync from Cloud Firestore on mount
  useEffect(() => {
    let active = true;
    syncBizzBoxFromCloud().then((cloud) => {
      if (active && cloud) {
        setEntries(cloud.entries);
        setModelDescriptions(cloud.customModelDescriptions);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Helper: resolve whether a model name maps to a currently live BizzModel calculator
  const getLiveModelSetId = (modelSetName: string): string | null => {
    const mappedId = BIZZBOX_MODEL_ID_MAP[modelSetName.trim().toLowerCase()];
    if (mappedId && liveModelSetIds.has(mappedId)) {
      return mappedId;
    }
    return null;
  };

  // Persist helper
  const persistChanges = async (
    nextEntries: BizzBoxEntry[],
    nextDescriptions: Record<string, string> = modelDescriptions
  ) => {
    setEntries(nextEntries);
    setModelDescriptions(nextDescriptions);
    setSyncState('saving');
    const result = await saveBizzBoxDirectory(nextEntries, nextDescriptions);
    setSyncState(result.syncedToCloud ? 'saved' : 'local');
  };

  // Dynamic list of all categories (seed + any custom categories added by user)
  const allCategories = useMemo(() => {
    const set = new Set<string>(BIZZBOX_CATEGORIES);
    entries.forEach((e) => {
      if (e.category.trim()) set.add(e.category.trim());
    });
    return Array.from(set);
  }, [entries]);

  // Dynamic list of all model-set names (seed + any custom models), optionally filtered by category
  const allModelNames = useMemo(() => {
    const map = new Map<string, { name: string; category: string }>();
    for (const m of BIZZBOX_MODEL_CATALOG) {
      map.set(m.name.toLowerCase(), { name: m.name, category: m.category });
    }
    for (const e of entries) {
      const key = e.modelSet.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, { name: e.modelSet.trim(), category: e.category.trim() });
      }
    }
    return Array.from(map.values());
  }, [entries]);

  const filterableModels = useMemo(() => {
    if (selectedCategory === 'all') return allModelNames;
    return allModelNames.filter(
      (m) => m.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [allModelNames, selectedCategory]);

  // Models suggested for the currently chosen category inside the Add form
  const addFormModels = useMemo(() => {
    const cat = newCategory === '__custom__' ? newCustomCategory.trim() : newCategory;
    const matching = allModelNames.filter(
      (m) => !cat || m.category.toLowerCase() === cat.toLowerCase()
    );
    return matching.length > 0 ? matching : allModelNames;
  }, [allModelNames, newCategory, newCustomCategory]);

  // Filtered & sorted entries
  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = entries.filter((item) => {
      if (
        selectedCategory !== 'all' &&
        item.category.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }
      if (
        selectedModelFilter !== 'all' &&
        item.modelSet.toLowerCase() !== selectedModelFilter.toLowerCase()
      ) {
        return false;
      }
      if (availabilityFilter === 'available' && !getLiveModelSetId(item.modelSet)) {
        return false;
      }
      if (q) {
        const desc = (modelDescriptions[item.modelSet.toLowerCase()] || '').toLowerCase();
        const hay = `${item.businessType} ${item.category} ${item.modelSet} ${item.notes || ''} ${desc}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      const cmp = a[sortField].localeCompare(b[sortField], undefined, { sensitivity: 'base' });
      if (cmp !== 0) return sortAsc ? cmp : -cmp;
      return a.businessType.localeCompare(b.businessType, undefined, { sensitivity: 'base' });
    });

    return list;
  }, [
    entries,
    searchQuery,
    selectedCategory,
    selectedModelFilter,
    availabilityFilter,
    sortField,
    sortAsc,
    modelDescriptions,
    liveModelSetIds,
  ]);

  // Grouped structure for Model -> Business Types view
  const groupedByModel = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        category: string;
        modelSet: string;
        description: string;
        liveModelSetId: string | null;
        items: BizzBoxEntry[];
      }
    >();

    // Seed with catalog models when no search query excludes them so empty models remain discoverable
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      for (const m of BIZZBOX_MODEL_CATALOG) {
        if (
          selectedCategory !== 'all' &&
          m.category.toLowerCase() !== selectedCategory.toLowerCase()
        ) {
          continue;
        }
        if (
          selectedModelFilter !== 'all' &&
          m.name.toLowerCase() !== selectedModelFilter.toLowerCase()
        ) {
          continue;
        }
        const liveId = getLiveModelSetId(m.name);
        if (availabilityFilter === 'available' && !liveId) {
          continue;
        }
        const key = `${m.category.toLowerCase()}::${m.name.toLowerCase()}`;
        groups.set(key, {
          key,
          category: m.category,
          modelSet: m.name,
          description: modelDescriptions[m.name.toLowerCase()] || m.description || '',
          liveModelSetId: liveId,
          items: [],
        });
      }
    }

    for (const item of filteredEntries) {
      const key = `${item.category.toLowerCase()}::${item.modelSet.toLowerCase()}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          category: item.category,
          modelSet: item.modelSet,
          description:
            modelDescriptions[item.modelSet.toLowerCase()] ||
            BIZZBOX_MODEL_DESCRIPTION_MAP[item.modelSet.toLowerCase()] ||
            '',
          liveModelSetId: getLiveModelSetId(item.modelSet),
          items: [],
        });
      }
      groups.get(key)!.items.push(item);
    }

    // Order by category order in BIZZBOX_CATEGORIES, then live models first, then name
    const catRank = (cat: string) => {
      const i = BIZZBOX_CATEGORIES.findIndex((c) => c.toLowerCase() === cat.toLowerCase());
      return i === -1 ? 999 : i;
    };

    return Array.from(groups.values()).sort((a, b) => {
      const cr = catRank(a.category) - catRank(b.category);
      if (cr !== 0) return cr;
      if (Boolean(a.liveModelSetId) !== Boolean(b.liveModelSetId)) {
        return a.liveModelSetId ? -1 : 1;
      }
      return a.modelSet.localeCompare(b.modelSet, undefined, { sensitivity: 'base' });
    });
  }, [
    filteredEntries,
    searchQuery,
    selectedCategory,
    selectedModelFilter,
    availabilityFilter,
    modelDescriptions,
    liveModelSetIds,
  ]);

  // Summary counts
  const availableEntryCount = useMemo(
    () => entries.filter((e) => Boolean(getLiveModelSetId(e.modelSet))).length,
    [entries, liveModelSetIds]
  );

  // Handlers
  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const openAddFormForModel = (category: string, modelSet: string) => {
    setNewCategory(allCategories.includes(category) ? category : '__custom__');
    if (!allCategories.includes(category)) setNewCustomCategory(category);
    setNewModelSet(modelSet);
    setNewCustomModelSet('');
    setNewBusinessType('');
    setNewNotes('');
    setAddError('');
    setShowAddForm(true);
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const bType = newBusinessType.trim();
    const cat = (newCategory === '__custom__' ? newCustomCategory : newCategory).trim();
    const mSet = (newModelSet === '__custom__' ? newCustomModelSet : newModelSet).trim();
    const notes = newNotes.trim();

    if (!bType) {
      setAddError('Enter a business type name.');
      return;
    }
    if (!cat) {
      setAddError('Select or enter a category.');
      return;
    }
    if (!mSet) {
      setAddError('Select or enter a model-set.');
      return;
    }

    const exists = entries.some(
      (x) =>
        x.businessType.toLowerCase() === bType.toLowerCase() &&
        x.category.toLowerCase() === cat.toLowerCase() &&
        x.modelSet.toLowerCase() === mSet.toLowerCase()
    );
    if (exists) {
      setAddError('This exact business type and model-set mapping already exists.');
      return;
    }

    const created: BizzBoxEntry = {
      id: `bb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      businessType: bType,
      category: cat,
      modelSet: mSet,
      ...(notes ? { notes } : {}),
    };

    await persistChanges([created, ...entries]);
    setNewBusinessType('');
    setNewNotes('');
    setAddError('');
    setShowAddForm(false);
  };

  const startEditing = (item: BizzBoxEntry) => {
    setConfirmDeleteId(null);
    setEditingId(item.id);
    setEditBusinessType(item.businessType);
    setEditCategory(item.category);
    setEditModelSet(item.modelSet);
    setEditNotes(item.notes || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    const bType = editBusinessType.trim();
    const cat = editCategory.trim();
    const mSet = editModelSet.trim();
    const notes = editNotes.trim();
    if (!bType || !cat || !mSet) return;

    const updated = entries.map((item) =>
      item.id === id
        ? {
            ...item,
            businessType: bType,
            category: cat,
            modelSet: mSet,
            ...(notes ? { notes } : { notes: undefined }),
          }
        : item
    );
    setEditingId(null);
    await persistChanges(updated);
  };

  const confirmAndDelete = async (id: string) => {
    const updated = entries.filter((item) => item.id !== id);
    setConfirmDeleteId(null);
    if (editingId === id) setEditingId(null);
    await persistChanges(updated);
  };

  const handleResetDefaults = async () => {
    setSyncState('saving');
    const restored = await resetBizzBoxDirectory();
    setEntries(restored.entries);
    setModelDescriptions(restored.customModelDescriptions);
    setConfirmReset(false);
    setEditingId(null);
    setConfirmDeleteId(null);
    setSyncState('saved');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedModelFilter('all');
    setAvailabilityFilter('all');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedModelFilter !== 'all' ||
    availabilityFilter !== 'all';

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* =================================================================== */}
      {/* 1. HEADER BAR & VIEW SWITCHER                                       */}
      {/* =================================================================== */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-[#2E5E88] dark:text-[#6CA2D6] shrink-0" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                BIZZBOX — BUSINESS TYPE &amp; MODEL-SET DIRECTORY
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              <span>{entries.length} business types</span>
              <span className="mx-1.5 text-slate-300 dark:text-slate-700">&middot;</span>
              <span>{allModelNames.length} model-sets</span>
              <span className="mx-1.5 text-slate-300 dark:text-slate-700">&middot;</span>
              <span>{allCategories.length} categories</span>
              <span className="mx-1.5 text-slate-300 dark:text-slate-700">&middot;</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                {availableEntryCount} ready to model now
              </span>
              {syncState !== 'idle' && (
                <>
                  <span className="mx-1.5 text-slate-300 dark:text-slate-700">&middot;</span>
                  <span className="text-slate-400 lowercase">
                    {syncState === 'saving'
                      ? 'saving...'
                      : syncState === 'saved'
                      ? 'changes synced'
                      : 'saved locally'}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAddError('');
                setShowAddForm((prev) => !prev);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold lowercase bg-[#2E5E88] hover:bg-[#244D70] text-white transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{showAddForm ? 'close form' : 'add entry'}</span>
            </button>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                title="Restore original bizzbox.xlsx seed directory"
                className={`px-3 py-2 rounded-xl text-xs font-bold lowercase border transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isDark
                    ? 'bg-[#0E1322] border-[#222F4C] text-slate-300 hover:text-white hover:border-slate-500'
                    : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-600 hover:text-slate-900 hover:border-slate-400'
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>reset defaults</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3 py-2 rounded-xl text-xs font-bold lowercase bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  confirm reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold lowercase border cursor-pointer whitespace-nowrap ${
                    isDark
                      ? 'bg-[#0E1322] border-[#222F4C] text-slate-300'
                      : 'bg-white border-[#D8CEBC] text-slate-600'
                  }`}
                >
                  cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lookup Direction Switcher + Search & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Segmented Lookup Direction Tabs */}
          <div
            className={`inline-flex p-1 rounded-xl border self-start ${
              isDark ? 'bg-[#0A0D14] border-[#222F4C]' : 'bg-[#F4EFE6] border-[#D8CEBC]'
            }`}
          >
            <button
              type="button"
              onClick={() => setView('business-to-model')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap ${
                view === 'business-to-model'
                  ? 'bg-[#2E5E88] text-white'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              business type &rarr; model
            </button>
            <button
              type="button"
              onClick={() => setView('model-to-business')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap ${
                view === 'model-to-business'
                  ? 'bg-[#2E5E88] text-white'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              model &rarr; business types
            </button>
          </div>

          {/* Availability Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex p-1 rounded-xl border ${
                isDark ? 'bg-[#0A0D14] border-[#222F4C]' : 'bg-[#F4EFE6] border-[#D8CEBC]'
              }`}
            >
              <button
                type="button"
                onClick={() => setAvailabilityFilter('all')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold lowercase transition-colors cursor-pointer whitespace-nowrap ${
                  availabilityFilter === 'all'
                    ? isDark
                      ? 'bg-[#1C2642] text-white'
                      : 'bg-white text-slate-900'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                all models
              </button>
              <button
                type="button"
                onClick={() => setAvailabilityFilter('available')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold lowercase transition-colors cursor-pointer whitespace-nowrap ${
                  availabilityFilter === 'available'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                available now ({liveModelSetIds.size})
              </button>
            </div>
          </div>
        </div>

        {/* Search + Category + Model Dropdown Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-6">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="search business type, model-set, or category..."
              className={`w-full pl-9 pr-8 py-2 rounded-xl border text-xs outline-none transition-colors ${
                isDark
                  ? 'bg-[#0E1322] border-[#222F4C] text-white placeholder:text-slate-500 focus:border-[#5584B4]'
                  : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#2E5E88]'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedModelFilter('all');
              }}
              aria-label="Filter by category"
              className={`w-full px-3 py-2 rounded-xl border text-xs font-bold capitalize cursor-pointer outline-none ${
                isDark
                  ? 'bg-[#0E1322] border-[#222F4C] text-white focus:border-[#5584B4]'
                  : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#2E5E88]'
              }`}
            >
              <option value="all">All Categories ({allCategories.length})</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedModelFilter}
              onChange={(e) => setSelectedModelFilter(e.target.value)}
              aria-label="Filter by model-set"
              className={`w-full px-3 py-2 rounded-xl border text-xs font-bold capitalize cursor-pointer outline-none ${
                isDark
                  ? 'bg-[#0E1322] border-[#222F4C] text-white focus:border-[#5584B4]'
                  : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#2E5E88]'
              }`}
            >
              <option value="all">All Model-Sets ({filterableModels.length})</option>
              {filterableModels.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} {getLiveModelSetId(m.name) ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filter readout */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span className="tabular-nums">
              Showing <strong className="text-slate-900 dark:text-white">{filteredEntries.length}</strong> of{' '}
              {entries.length} entries
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-[#2E5E88] dark:text-[#6CA2D6] font-bold hover:underline cursor-pointer lowercase"
            >
              clear filters
            </button>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 2. INLINE ADD ENTRY FORM                                            */}
      {/* =================================================================== */}
      {showAddForm && (
        <form
          onSubmit={handleAddEntry}
          className={`p-5 rounded-2xl border space-y-4 ${
            isDark
              ? 'bg-[#121A2E] border-[#2E5E88]/60'
              : 'bg-[#F8F5EE] border-[#2E5E88]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              ADD NEW BUSINESS TYPE MAPPING
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4 space-y-1">
              <label className="text-[11px] font-bold text-slate-500 lowercase block">
                business type *
              </label>
              <input
                type="text"
                value={newBusinessType}
                onChange={(e) => {
                  setNewBusinessType(e.target.value);
                  setAddError('');
                }}
                placeholder="e.g. Solar Panel Installer"
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                  isDark
                    ? 'bg-[#0A0D14] border-[#222F4C] text-white'
                    : 'bg-white border-[#D8CEBC] text-slate-900'
                }`}
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-bold text-slate-500 lowercase block">
                category *
              </label>
              <select
                value={newCategory}
                onChange={(e) => {
                  const nextCat = e.target.value;
                  setNewCategory(nextCat);
                  if (nextCat !== '__custom__') {
                    const firstForCat = allModelNames.find(
                      (m) => m.category.toLowerCase() === nextCat.toLowerCase()
                    );
                    if (firstForCat) setNewModelSet(firstForCat.name);
                  }
                }}
                className={`w-full px-3 py-2 rounded-xl border text-xs capitalize cursor-pointer outline-none ${
                  isDark
                    ? 'bg-[#0A0D14] border-[#222F4C] text-white'
                    : 'bg-white border-[#D8CEBC] text-slate-900'
                }`}
              >
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__custom__">+ custom category...</option>
              </select>
              {newCategory === '__custom__' && (
                <input
                  type="text"
                  value={newCustomCategory}
                  onChange={(e) => setNewCustomCategory(e.target.value)}
                  placeholder="enter category name"
                  className={`w-full mt-1.5 px-3 py-1.5 rounded-xl border text-xs outline-none ${
                    isDark
                      ? 'bg-[#0A0D14] border-[#222F4C] text-white'
                      : 'bg-white border-[#D8CEBC] text-slate-900'
                  }`}
                />
              )}
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-bold text-slate-500 lowercase block">
                model-set *
              </label>
              <select
                value={newModelSet}
                onChange={(e) => setNewModelSet(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs capitalize cursor-pointer outline-none ${
                  isDark
                    ? 'bg-[#0A0D14] border-[#222F4C] text-white'
                    : 'bg-white border-[#D8CEBC] text-slate-900'
                }`}
              >
                {addFormModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
                <option value="__custom__">+ custom model-set...</option>
              </select>
              {newModelSet === '__custom__' && (
                <input
                  type="text"
                  value={newCustomModelSet}
                  onChange={(e) => setNewCustomModelSet(e.target.value)}
                  placeholder="enter model-set name"
                  className={`w-full mt-1.5 px-3 py-1.5 rounded-xl border text-xs outline-none ${
                    isDark
                      ? 'bg-[#0A0D14] border-[#222F4C] text-white'
                      : 'bg-white border-[#D8CEBC] text-slate-900'
                  }`}
                />
              )}
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-slate-500 lowercase block">
                notes (optional)
              </label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="optional note"
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                  isDark
                    ? 'bg-[#0A0D14] border-[#222F4C] text-white'
                    : 'bg-white border-[#D8CEBC] text-slate-900'
                }`}
              />
            </div>
          </div>

          {addError && (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{addError}</p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold lowercase border cursor-pointer ${
                isDark
                  ? 'bg-[#0E1322] border-[#222F4C] text-slate-300'
                  : 'bg-white border-[#D8CEBC] text-slate-600'
              }`}
            >
              cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl text-xs font-bold lowercase bg-[#2E5E88] hover:bg-[#244D70] text-white transition-colors cursor-pointer"
            >
              save entry
            </button>
          </div>
        </form>
      )}

      {/* =================================================================== */}
      {/* 3A. VIEW 1: BUSINESS TYPE -> MODEL TABLE                            */}
      {/* =================================================================== */}
      {view === 'business-to-model' && (
        <div
          className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                    isDark
                      ? 'bg-[#0D1220] border-[#222F4C] text-slate-400'
                      : 'bg-[#F4EFE6]/70 border-[#D8CEBC] text-slate-600'
                  }`}
                >
                  <th className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleSort('businessType')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      <span>business type</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => handleToggleSort('category')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      <span>category</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => handleToggleSort('modelSet')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      <span>bizzmodel set</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </button>
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/80">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 px-4 text-center text-xs text-slate-500 dark:text-slate-400"
                    >
                      No business types match your current filter. Try clearing the search or add a new entry above.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((item) => {
                    const isEditing = editingId === item.id;
                    const isConfirmingDelete = confirmDeleteId === item.id;
                    const liveId = getLiveModelSetId(item.modelSet);
                    const isActiveModel = liveId && activeModelSet === liveId;
                    const desc = modelDescriptions[item.modelSet.toLowerCase()];

                    if (isEditing) {
                      return (
                        <tr
                          key={item.id}
                          className={isDark ? 'bg-[#162038]' : 'bg-[#F4EFE6]/60'}
                        >
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              value={editBusinessType}
                              onChange={(e) => setEditBusinessType(e.target.value)}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${
                                isDark
                                  ? 'bg-[#0A0D14] border-[#222F4C] text-white'
                                  : 'bg-white border-[#D8CEBC] text-slate-900'
                              }`}
                            />
                            <input
                              type="text"
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="optional notes..."
                              className={`w-full mt-1 px-2.5 py-1 rounded-lg border text-[11px] outline-none ${
                                isDark
                                  ? 'bg-[#0A0D14] border-[#222F4C] text-slate-300'
                                  : 'bg-white border-[#D8CEBC] text-slate-600'
                              }`}
                            />
                          </td>
                          <td className="py-2.5 px-3 align-top">
                            <input
                              type="text"
                              list="bizzbox-categories-datalist"
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs capitalize outline-none ${
                                isDark
                                  ? 'bg-[#0A0D14] border-[#222F4C] text-white'
                                  : 'bg-white border-[#D8CEBC] text-slate-900'
                              }`}
                            />
                          </td>
                          <td className="py-2.5 px-3 align-top">
                            <input
                              type="text"
                              list="bizzbox-models-datalist"
                              value={editModelSet}
                              onChange={(e) => setEditModelSet(e.target.value)}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs capitalize outline-none ${
                                isDark
                                  ? 'bg-[#0A0D14] border-[#222F4C] text-white'
                                  : 'bg-white border-[#D8CEBC] text-slate-900'
                              }`}
                            />
                          </td>
                          <td className="py-2.5 px-3 align-top text-[11px] text-slate-400">
                            editing
                          </td>
                          <td className="py-2.5 px-4 align-top text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => saveEdit(item.id)}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold lowercase bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="h-3 w-3" />
                                <span>save</span>
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditing}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold lowercase border cursor-pointer ${
                                  isDark
                                    ? 'bg-[#0E1322] border-[#222F4C] text-slate-300'
                                    : 'bg-white border-[#D8CEBC] text-slate-600'
                                }`}
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
                        key={item.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-[#141D33]' : 'hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {item.businessType}
                          </div>
                          {item.notes && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 capitalize text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {item.category}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold capitalize text-[#2E5E88] dark:text-[#6CA2D6]">
                            {item.modelSet}
                          </div>
                          {desc && (
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 max-w-md">
                              {desc}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {liveId ? (
                            <span className="text-[11px] font-bold lowercase text-emerald-700 dark:text-emerald-400">
                              {isActiveModel ? 'active' : 'available'}
                            </span>
                          ) : (
                            <span className="text-[11px] lowercase text-slate-400 dark:text-slate-500">
                              coming soon
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {liveId && (
                              <button
                                type="button"
                                onClick={() => onApplyModelSet(liveId)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold lowercase transition-colors inline-flex items-center gap-1 cursor-pointer ${
                                  isActiveModel
                                    ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/25'
                                    : 'bg-[#2E5E88] hover:bg-[#244D70] text-white'
                                }`}
                              >
                                <span>{isActiveModel ? 'open model' : 'use model'}</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}

                            {!isConfirmingDelete ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEditing(item)}
                                  title="Edit entry"
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    isDark
                                      ? 'border-[#222F4C] text-slate-400 hover:text-white hover:border-slate-500'
                                      : 'border-[#E5DEC9] text-slate-500 hover:text-slate-900 hover:border-slate-400'
                                  }`}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(item.id)}
                                  title="Delete entry"
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    isDark
                                      ? 'border-[#222F4C] text-slate-400 hover:text-rose-400 hover:border-rose-500/50'
                                      : 'border-[#E5DEC9] text-slate-500 hover:text-rose-600 hover:border-rose-300'
                                  }`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => confirmAndDelete(item.id)}
                                  className="px-2 py-1 rounded-lg text-[11px] font-bold lowercase bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                                >
                                  delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold lowercase border cursor-pointer ${
                                    isDark
                                      ? 'border-[#222F4C] text-slate-300'
                                      : 'border-[#D8CEBC] text-slate-600'
                                  }`}
                                >
                                  cancel
                                </button>
                              </div>
                            )}
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

      {/* =================================================================== */}
      {/* 3B. VIEW 2: MODEL -> BUSINESS TYPES DIRECTORY                       */}
      {/* =================================================================== */}
      {view === 'model-to-business' && (
        <div className="space-y-3">
          {groupedByModel.length === 0 ? (
            <div
              className={`p-10 rounded-2xl border text-center text-xs text-slate-500 ${
                isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
              }`}
            >
              No model-sets match your current filter.
            </div>
          ) : (
            groupedByModel.map((group) => {
              const isCollapsed = Boolean(collapsedModels[group.key]);
              const isActiveModel =
                group.liveModelSetId && activeModelSet === group.liveModelSetId;

              return (
                <div
                  key={group.key}
                  className={`rounded-2xl border overflow-hidden ${
                    isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                  }`}
                >
                  {/* Group Header */}
                  <div
                    className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b ${
                      isDark
                        ? 'bg-[#0D1220] border-[#222F4C]'
                        : 'bg-[#F8F5EE] border-[#E5DEC9]'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-bold capitalize text-slate-900 dark:text-white">
                          {group.modelSet}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">&middot;</span>
                        <span className="text-xs capitalize text-slate-500 dark:text-slate-400">
                          {group.category}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">&middot;</span>
                        <span className="text-xs tabular-nums font-bold text-slate-600 dark:text-slate-300">
                          {group.items.length}{' '}
                          {group.items.length === 1 ? 'business type' : 'business types'}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">&middot;</span>
                        {group.liveModelSetId ? (
                          <span className="text-xs font-bold lowercase text-emerald-700 dark:text-emerald-400">
                            {isActiveModel ? 'active in revenue calculator' : 'available'}
                          </span>
                        ) : (
                          <span className="text-xs lowercase text-slate-400">coming soon</span>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">
                          {group.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {group.liveModelSetId && (
                        <button
                          type="button"
                          onClick={() => onApplyModelSet(group.liveModelSetId!)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold lowercase inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                            isActiveModel
                              ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/25'
                              : 'bg-[#2E5E88] hover:bg-[#244D70] text-white'
                          }`}
                        >
                          <span>{isActiveModel ? 'open model' : 'use model'}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openAddFormForModel(group.category, group.modelSet)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold lowercase border inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                          isDark
                            ? 'bg-[#101626] border-[#222F4C] text-slate-300 hover:text-white hover:border-slate-500'
                            : 'bg-white border-[#D8CEBC] text-slate-700 hover:text-slate-900 hover:border-slate-400'
                        }`}
                      >
                        <Plus className="h-3 w-3" />
                        <span>add type</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedModels((prev) => ({
                            ...prev,
                            [group.key]: !prev[group.key],
                          }))
                        }
                        aria-label={isCollapsed ? 'Expand business types' : 'Collapse business types'}
                        className={`p-1.5 rounded-xl border cursor-pointer ${
                          isDark
                            ? 'bg-[#101626] border-[#222F4C] text-slate-400 hover:text-white'
                            : 'bg-white border-[#D8CEBC] text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {isCollapsed ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronUp className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Mapped Business Types List */}
                  {!isCollapsed && (
                    <div className="p-4">
                      {group.items.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No business types mapped to this model-set yet. Click &ldquo;add type&rdquo; to assign one.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {group.items.map((item) => {
                            const isEditing = editingId === item.id;
                            const isConfirmingDelete = confirmDeleteId === item.id;

                            if (isEditing) {
                              return (
                                <div
                                  key={item.id}
                                  className={`p-3 rounded-xl border space-y-2 col-span-1 sm:col-span-2 lg:col-span-3 ${
                                    isDark
                                      ? 'bg-[#162038] border-[#2E5E88]'
                                      : 'bg-[#F4EFE6] border-[#2E5E88]/60'
                                  }`}
                                >
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <input
                                      type="text"
                                      value={editBusinessType}
                                      onChange={(e) => setEditBusinessType(e.target.value)}
                                      placeholder="business type"
                                      className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none ${
                                        isDark
                                          ? 'bg-[#0A0D14] border-[#222F4C] text-white'
                                          : 'bg-white border-[#D8CEBC] text-slate-900'
                                      }`}
                                    />
                                    <input
                                      type="text"
                                      list="bizzbox-categories-datalist"
                                      value={editCategory}
                                      onChange={(e) => setEditCategory(e.target.value)}
                                      placeholder="category"
                                      className={`px-2.5 py-1.5 rounded-lg border text-xs capitalize outline-none ${
                                        isDark
                                          ? 'bg-[#0A0D14] border-[#222F4C] text-white'
                                          : 'bg-white border-[#D8CEBC] text-slate-900'
                                      }`}
                                    />
                                    <input
                                      type="text"
                                      list="bizzbox-models-datalist"
                                      value={editModelSet}
                                      onChange={(e) => setEditModelSet(e.target.value)}
                                      placeholder="model-set"
                                      className={`px-2.5 py-1.5 rounded-lg border text-xs capitalize outline-none ${
                                        isDark
                                          ? 'bg-[#0A0D14] border-[#222F4C] text-white'
                                          : 'bg-white border-[#D8CEBC] text-slate-900'
                                      }`}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <input
                                      type="text"
                                      value={editNotes}
                                      onChange={(e) => setEditNotes(e.target.value)}
                                      placeholder="optional notes..."
                                      className={`flex-1 px-2.5 py-1 rounded-lg border text-[11px] outline-none ${
                                        isDark
                                          ? 'bg-[#0A0D14] border-[#222F4C] text-slate-300'
                                          : 'bg-white border-[#D8CEBC] text-slate-600'
                                      }`}
                                    />
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => saveEdit(item.id)}
                                        className="px-3 py-1 rounded-lg text-[11px] font-bold lowercase bg-emerald-600 text-white cursor-pointer"
                                      >
                                        save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={cancelEditing}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold lowercase border cursor-pointer ${
                                          isDark
                                            ? 'border-[#222F4C] text-slate-300'
                                            : 'border-[#D8CEBC] text-slate-600'
                                        }`}
                                      >
                                        cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={item.id}
                                className={`group px-3 py-2 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                                  isDark
                                    ? 'bg-[#0E1322] border-[#1E2A45] hover:border-[#344A75]'
                                    : 'bg-[#FAF8F5] border-[#EAE3D2] hover:border-[#C8BC9F]'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">
                                    {item.businessType}
                                  </div>
                                  {item.notes && (
                                    <div className="text-[10px] text-slate-400 truncate">
                                      {item.notes}
                                    </div>
                                  )}
                                </div>

                                {!isConfirmingDelete ? (
                                  <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => startEditing(item)}
                                      title="Edit"
                                      className="p-1 rounded-md text-slate-400 hover:text-[#2E5E88] dark:hover:text-[#6CA2D6] cursor-pointer"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(item.id)}
                                      title="Delete"
                                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => confirmAndDelete(item.id)}
                                      className="px-1.5 py-0.5 rounded text-[10px] font-bold lowercase bg-rose-600 text-white cursor-pointer"
                                    >
                                      del
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-1.5 py-0.5 rounded text-[10px] font-bold lowercase text-slate-500 cursor-pointer"
                                    >
                                      no
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Shared HTML datalists for flexible inline editing */}
      <datalist id="bizzbox-categories-datalist">
        {allCategories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="bizzbox-models-datalist">
        {allModelNames.map((m) => (
          <option key={m.name} value={m.name} />
        ))}
      </datalist>
    </div>
  );
};

export default BizzBoxPanel;
