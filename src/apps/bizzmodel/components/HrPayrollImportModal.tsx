import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Users,
} from 'lucide-react';
import {
  EmploymentCategory,
  EmploymentImportMeta,
  EmploymentItem,
} from '../constants';
import {
  ParsedHrImportResult,
  buildEmploymentItemsFromImport,
  downloadHrEmploymentTemplate,
  parseHrSpreadsheetFile,
} from '../utils/hrSpreadsheetUtils';

interface HrPayrollImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  entityName: string;
  categories: EmploymentCategory[];
  availableDepartments: string[];
  existingEmployees: EmploymentItem[];
  isPrivacyCurrentlyActive: boolean;
  onConfirmImport: (payload: {
    items: EmploymentItem[];
    newCategories: EmploymentCategory[];
    replaceExisting: boolean;
    enablePrivacyMode: boolean;
    meta: EmploymentImportMeta;
  }) => void;
}

export const HrPayrollImportModal: React.FC<HrPayrollImportModalProps> = ({
  isOpen,
  onClose,
  theme = 'light',
  entityName,
  categories,
  availableDepartments,
  existingEmployees,
  isPrivacyCurrentlyActive,
  onConfirmImport,
}) => {
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [privacyMode, setPrivacyMode] = useState<'aggregated' | 'masked'>('aggregated');
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedResult, setParsedResult] = useState<ParsedHrImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const previewItems = useMemo(() => {
    if (!parsedResult || parsedResult.errors.length > 0) return [];
    return buildEmploymentItemsFromImport(parsedResult, privacyMode);
  }, [parsedResult, privacyMode]);

  const allCategoryLookup = useMemo(() => {
    const map = new Map<string, EmploymentCategory>();
    categories.forEach((c) => map.set(c.id, c));
    parsedResult?.newCategoriesToCreate.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories, parsedResult]);

  if (!isOpen) return null;

  const handleFileSelected = async (file: File | undefined | null) => {
    if (!file) return;
    setParseError(null);
    setIsParsing(true);
    try {
      const result = await parseHrSpreadsheetFile(file, categories, availableDepartments);
      setParsedResult(result);
      if (result.errors.length > 0) {
        setParseError(result.errors.join(' '));
      }
    } catch (err) {
      setParseError(
        err instanceof Error
          ? `Could not read spreadsheet: ${err.message}`
          : 'Could not read spreadsheet. Please verify it is a valid .xlsx, .xls, or .csv file.'
      );
      setParsedResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirm = () => {
    if (!parsedResult || parsedResult.errors.length > 0 || previewItems.length === 0) return;

    const meta: EmploymentImportMeta = {
      fileName: parsedResult.fileName,
      importedAt: new Date().toISOString(),
      privacyMode,
      sourceRowCount: parsedResult.summary.sourceRowCount,
      importedLineCount: previewItems.length,
      totalHeadcount: parsedResult.summary.totalHeadcount,
    };

    onConfirmImport({
      items: previewItems,
      newCategories: parsedResult.newCategoriesToCreate,
      replaceExisting,
      enablePrivacyMode: true,
      meta,
    });

    setParsedResult(null);
    setParseError(null);
    onClose();
  };

  const handleResetFile = () => {
    setParsedResult(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatMoney = (val: number) => `R ${Math.round(val).toLocaleString()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs font-mono animate-in fade-in duration-150">
      <div
        className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-[#0E1424] border-[#222F4C] text-slate-100' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${
            isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2E5E88] text-white flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                HR PAYROLL SPREADSHEET IMPORT & PRIVACY
              </h2>
              <p className="text-[11px] text-slate-500">
                Entity: <span className="font-bold text-[#2E5E88] dark:text-[#7EB2E2]">{entityName}</span> · Download the HR upload pack or import payroll privately
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Step 1: Download HR Document Pack */}
          <div
            className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
              isDark ? 'bg-[#101A30] border-[#253B66]' : 'bg-[#EEF5FC] border-[#BDD4EB]'
            }`}
          >
            <div className="flex items-start gap-3 max-w-xl">
              <div className="w-8 h-8 rounded-lg bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#7EB2E2] flex items-center justify-center shrink-0 mt-0.5">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                  1. Download Document for HR Department
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  Send this 2-sheet Excel workbook to HR. It includes the formatted <strong>Employee Import</strong> sheet plus an <strong>HR Instructions & Reference</strong> sheet pre-loaded with this entity&apos;s exact Category Bands and Departments.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  downloadHrEmploymentTemplate({
                    entityName,
                    categories,
                    departments: availableDepartments,
                    includeExistingRoster: false,
                  })
                }
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold uppercase shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download HR Template (.xlsx)</span>
              </button>

              {!isPrivacyCurrentlyActive && existingEmployees.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    downloadHrEmploymentTemplate({
                      entityName,
                      categories,
                      departments: availableDepartments,
                      existingEmployees,
                      includeExistingRoster: true,
                    })
                  }
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold uppercase transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#0E1424] border-[#2E5E88] text-[#7EB2E2] hover:bg-[#17233D]'
                      : 'bg-white border-[#2E5E88] text-[#2E5E88] hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Current List</span>
                </button>
              )}
            </div>
          </div>

          {/* Step 2: Earnings Privacy & Import Options */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>2. Employee Earnings Privacy Setting</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Option A: Confidential Band Roll-Up */}
              <button
                type="button"
                onClick={() => setPrivacyMode('aggregated')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  privacyMode === 'aggregated'
                    ? isDark
                      ? 'bg-[#10221C] border-emerald-500 ring-1 ring-emerald-500/40'
                      : 'bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-600/30'
                    : isDark
                    ? 'bg-[#101626] border-[#222F4C] hover:border-slate-600'
                    : 'bg-white border-[#D8CEBC] hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold uppercase flex items-center gap-1.5 text-slate-900 dark:text-white">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Confidential Band Roll-Up</span>
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-600 text-white">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Automatically combines individual HR rows by <strong>Category Band, Department, Allocation & Schedule</strong> before saving. Individual names and salaries are <strong>never stored or shown</strong> — payroll totals remain 100% exact.
                </p>
              </button>

              {/* Option B: Detailed Roles with Screen Privacy Mask */}
              <button
                type="button"
                onClick={() => setPrivacyMode('masked')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  privacyMode === 'masked'
                    ? isDark
                      ? 'bg-[#121D35] border-[#5584B4] ring-1 ring-[#5584B4]/40'
                      : 'bg-[#EEF5FC] border-[#2E5E88] ring-1 ring-[#2E5E88]/30'
                    : isDark
                    ? 'bg-[#101626] border-[#222F4C] hover:border-slate-600'
                    : 'bg-white border-[#D8CEBC] hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold uppercase flex items-center gap-1.5 text-slate-900 dark:text-white">
                    <EyeOff className="w-3.5 h-3.5 text-[#2E5E88] dark:text-[#7EB2E2]" />
                    <span>Detailed Roles (Screen Masked)</span>
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    Editable
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Imports each role line individually for granular planning and automatically activates the <strong>Earnings Privacy Shield</strong> so individual earnings stay hidden on screen until explicitly unlocked.
                </p>
              </button>
            </div>

            {/* Replace vs Append Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-500">
                Import behaviour for <strong className="text-slate-700 dark:text-slate-200">{entityName}</strong>:
              </span>
              <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setReplaceExisting(true)}
                  className={`px-3 py-1.5 transition-colors cursor-pointer ${
                    replaceExisting
                      ? 'bg-[#2E5E88] text-white'
                      : isDark
                      ? 'bg-[#101626] text-slate-400 hover:text-white'
                      : 'bg-white text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Replace Current Listing
                </button>
                <button
                  type="button"
                  onClick={() => setReplaceExisting(false)}
                  className={`px-3 py-1.5 transition-colors cursor-pointer ${
                    !replaceExisting
                      ? 'bg-[#2E5E88] text-white'
                      : isDark
                      ? 'bg-[#101626] text-slate-400 hover:text-white'
                      : 'bg-white text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Append to Existing
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Upload Zone OR Validation Preview */}
          {!parsedResult || parsedResult.errors.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-[#2E5E88] dark:text-[#7EB2E2]" />
                <span>3. Upload Completed HR Spreadsheet (.xlsx, .xls, or .csv)</span>
              </h3>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const droppedFile = e.dataTransfer.files?.[0];
                  handleFileSelected(droppedFile);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#2E5E88] bg-[#2E5E88]/10'
                    : isDark
                    ? 'border-[#2B3B5E] bg-[#101626] hover:border-[#5584B4]'
                    : 'border-[#C9BEA9] bg-white hover:border-[#2E5E88]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => handleFileSelected(e.target.files?.[0])}
                />
                <div className="w-12 h-12 rounded-2xl bg-[#2E5E88]/10 text-[#2E5E88] dark:text-[#7EB2E2] flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">
                  {isParsing
                    ? 'Reading spreadsheet privately in your browser...'
                    : 'Click to select HR spreadsheet or drag & drop here'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Processed 100% locally in your browser — raw HR files are never uploaded to external servers.
                </p>
              </div>

              {parseError && (
                <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Unable to import spreadsheet</span>
                    <span>{parseError}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Parsed File Header */}
              <div
                className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                  isDark ? 'bg-[#10221C] border-emerald-800' : 'bg-emerald-50/70 border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Ready to Import: {parsedResult.fileName}{' '}
                      <span className="text-[11px] font-normal text-slate-500">
                        (Sheet: {parsedResult.sheetName})
                      </span>
                    </p>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      {parsedResult.summary.sourceRowCount} HR row{parsedResult.summary.sourceRowCount === 1 ? '' : 's'} validated →{' '}
                      {privacyMode === 'aggregated'
                        ? `aggregated into ${previewItems.length} confidential band ${previewItems.length === 1 ? 'summary' : 'summaries'} (zero individual salaries stored)`
                        : `${previewItems.length} role lines (screen privacy mask will be active)`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetFile}
                  className="text-[11px] font-bold underline text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Choose another file
                </button>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Headcount</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <Users className="w-3.5 h-3.5 text-[#2E5E88]" />
                    {parsedResult.summary.totalHeadcount} FTEs
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Monthly Base Payroll</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {formatMoney(parsedResult.summary.totalBaseMonthly)}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Cost of Sales / Mo</span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                    {formatMoney(parsedResult.summary.cosMonthly)}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Opex Payroll / Mo</span>
                  <span className="text-sm font-bold text-[#2E5E88] dark:text-[#7EB2E2] mt-0.5 block">
                    {formatMoney(parsedResult.summary.opexMonthly)}
                  </span>
                </div>
              </div>

              {/* New Categories Notice */}
              {parsedResult.newCategoriesToCreate.length > 0 && (
                <div
                  className={`p-3 rounded-xl border text-[11px] flex items-start gap-2.5 ${
                    isDark ? 'bg-[#101A30] border-[#253B66] text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-900'
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
                  <div>
                    <span className="font-bold">
                      {parsedResult.newCategoriesToCreate.length} new Category Band
                      {parsedResult.newCategoriesToCreate.length === 1 ? '' : 's'} detected:
                    </span>{' '}
                    {parsedResult.newCategoriesToCreate.map((c) => `${c.name} (${c.onCostPct}% on-cost)`).join(', ')}.
                    These will be added automatically and can be adjusted in Category Bands.
                  </div>
                </div>
              )}

              {/* Warnings */}
              {parsedResult.warnings.length > 0 && (
                <div
                  className={`p-3 rounded-xl border text-[11px] space-y-1 ${
                    isDark ? 'bg-amber-950/30 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Import Notes ({parsedResult.warnings.length})
                  </span>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {parsedResult.warnings.slice(0, 5).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {parsedResult.warnings.length > 5 && (
                      <li>…and {parsedResult.warnings.length - 5} more notes.</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Privacy-Safe Preview Table */}
              <div
                className={`rounded-2xl border overflow-hidden ${
                  isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                }`}
              >
                <div
                  className={`px-4 py-2.5 border-b flex items-center justify-between text-[11px] font-bold uppercase ${
                    isDark ? 'bg-[#0E1322] border-[#222F4C] text-slate-300' : 'bg-slate-50 border-[#D8CEBC] text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    {privacyMode === 'aggregated'
                      ? 'Confidential Band Summary Preview (Individual Salaries Omitted)'
                      : 'Detailed Role Preview (Individual Salaries Masked)'}
                  </span>
                  <span>{previewItems.length} lines</span>
                </div>

                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className={`border-b text-[10px] uppercase text-slate-500 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                        <th className="py-2 px-3">Band / Line</th>
                        <th className="py-2 px-3">Department</th>
                        <th className="py-2 px-3">Allocation</th>
                        <th className="py-2 px-3 text-center">FTEs</th>
                        <th className="py-2 px-3">Schedule</th>
                        <th className="py-2 px-3 text-right">
                          {privacyMode === 'aggregated' ? 'Band Total / Mo (incl. on-cost)' : 'Individual Salary'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                      {previewItems.map((item) => {
                        const cat = allCategoryLookup.get(item.categoryId);
                        const onCost = cat ? cat.onCostPct : (item.onCostPct ?? 0);
                        const bandTotal = item.baseRateMonthly * item.numEmployees * (1 + onCost / 100);
                        return (
                          <tr key={item.id}>
                            <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-100">
                              {item.title}
                            </td>
                            <td className="py-2 px-3 capitalize text-slate-600 dark:text-slate-300">
                              {item.department}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                                  item.allocation === 'cost_of_sales'
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#7EB2E2]'
                                }`}
                              >
                                {item.allocation === 'cost_of_sales' ? 'Cost of Sales' : 'Opex'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center font-bold">{item.numEmployees}</td>
                            <td className="py-2 px-3 text-[11px] text-slate-500">
                              {item.employmentType === 'seasonal'
                                ? `Seasonal (M${item.seasonalStartMonth ?? 6}–M${item.seasonalEndMonth ?? 9})`
                                : `Permanent (M${item.startMonth || 1}+)`}
                            </td>
                            <td className="py-2 px-3 text-right font-bold">
                              {privacyMode === 'aggregated' ? (
                                <span className="text-[#2E5E88] dark:text-[#7EB2E2]">
                                  {formatMoney(bandTotal)}
                                </span>
                              ) : (
                                <span className="text-slate-400 tracking-widest">R ••••••</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3.5 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
            isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#F4EFE6] border-[#D8CEBC]'
          }`}
        >
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            All spreadsheet processing happens privately in-browser
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!parsedResult || parsedResult.errors.length > 0 || previewItems.length === 0}
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#234E73] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold uppercase shadow-xs transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>
                {privacyMode === 'aggregated'
                  ? 'Import Confidential Bands'
                  : 'Import with Privacy Mask'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
