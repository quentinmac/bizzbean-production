import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Sparkles,
  Upload,
  Coins,
  Edit3,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  Undo2,
  Loader2,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import {
  BizzPlanData,
  BizzPlanSection,
  BizzForecastaCustomMetrics,
} from '../../../types';
import {
  BizzForecastaMetricsBundle,
  buildGeminiBusinessContext,
} from '../bizzforecastaConstants';
import { computeHistoricalYearMetrics } from '../../bizzmodel/components/HistoricalPerformanceTable';

interface ScriptedPlanPageEditorProps {
  section: BizzPlanSection;
  planData: BizzPlanData;
  metrics: BizzForecastaMetricsBundle;
  theme?: 'light' | 'dark';
  tokenBalance?: number;
  onUpdateSection: (patch: Partial<BizzPlanSection>) => void;
}

const GEMINI_WRITE_TOKEN_COST = 5;

const formatNum = (val: number | undefined) =>
  new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 }).format(Math.round(val || 0));

export const ScriptedPlanPageEditor: React.FC<ScriptedPlanPageEditorProps> = ({
  section,
  planData,
  metrics,
  theme = 'light',
  tokenBalance: tokenBalanceProp = 0,
  onUpdateSection,
}) => {
  const isDark = theme === 'dark';
  const [showHints, setShowHints] = useState(true);
  const [showGeminiPanel, setShowGeminiPanel] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previousContent, setPreviousContent] = useState<string | null>(null);
  const [liveTokens, setLiveTokens] = useState<number>(tokenBalanceProp);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLiveTokens(tokenBalanceProp);
  }, [tokenBalanceProp]);

  useEffect(() => {
    const handleBalanceUpdate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (typeof detail?.balance === 'number') {
        setLiveTokens(detail.balance);
      } else if (typeof detail === 'number') {
        setLiveTokens(detail);
      }
    };
    window.addEventListener('bizz-token-balance-updated', handleBalanceUpdate);
    return () => window.removeEventListener('bizz-token-balance-updated', handleBalanceUpdate);
  }, []);

  // Reset transient notices when switching pages
  useEffect(() => {
    setStatusMessage(null);
    setErrorMessage(null);
    setPreviousContent(null);
    setCustomInstruction('');
  }, [section.id]);

  const updateCustomMetric = (patch: Partial<BizzForecastaCustomMetrics>) => {
    onUpdateSection({
      customMetrics: {
        ...(section.customMetrics || {}),
        ...patch,
      },
    });
  };

  // =========================================================================
  // ELECTRONIC DOCUMENT IMPORT (.txt, .md, .csv, .xlsx, .xls, .pdf, .png/jpg)
  // =========================================================================
  const handleDocumentImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const lowerName = file.name.toLowerCase();
      let extractedText = '';

      if (
        lowerName.endsWith('.txt') ||
        lowerName.endsWith('.md') ||
        lowerName.endsWith('.csv') ||
        lowerName.endsWith('.json')
      ) {
        extractedText = (await file.text()).trim();
      } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const sheetBlocks: string[] = [];
        wb.SheetNames.slice(0, 4).forEach((sheetName) => {
          const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
            header: 1,
            defval: '',
          });
          const lines = rows
            .filter((r) => r.some((cell) => String(cell ?? '').trim() !== ''))
            .slice(0, 120)
            .map((r) => r.map((c) => String(c ?? '').trim()).filter(Boolean).join(' | '));
          if (lines.length > 0) {
            sheetBlocks.push(`[${sheetName}]\n${lines.join('\n')}`);
          }
        });
        extractedText = sheetBlocks.join('\n\n').trim();
      } else if (
        lowerName.endsWith('.pdf') ||
        lowerName.endsWith('.png') ||
        lowerName.endsWith('.jpg') ||
        lowerName.endsWith('.jpeg') ||
        lowerName.endsWith('.webp')
      ) {
        if (file.size > 9 * 1024 * 1024) {
          throw new Error('File exceeds the 9 MB document upload limit.');
        }
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = String(reader.result || '');
            const commaIdx = res.indexOf(',');
            resolve(commaIdx >= 0 ? res.slice(commaIdx + 1) : res);
          };
          reader.onerror = () => reject(new Error('Failed to read uploaded file.'));
          reader.readAsDataURL(file);
        });

        const mimeType =
          file.type ||
          (lowerName.endsWith('.pdf')
            ? 'application/pdf'
            : lowerName.endsWith('.png')
            ? 'image/png'
            : lowerName.endsWith('.webp')
            ? 'image/webp'
            : 'image/jpeg');

        const resp = await fetch('/api/gemini/bizzforecasta-parse-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            mimeType,
            base64Data,
            pageTitle: section.title,
            hints: section.hints || [],
          }),
        });
        const payload = await resp.json();
        if (!resp.ok) {
          throw new Error(payload?.error || 'Could not extract content from uploaded document.');
        }
        extractedText = String(payload.text || '').trim();
      } else {
        // Attempt plain text fallback for .rtf / .html / .doc-like text files
        const raw = await file.text();
        const stripped = raw
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+\n/g, '\n')
          .replace(/[ \t]{2,}/g, ' ')
          .trim();
        if (!stripped || stripped.length < 4) {
          throw new Error(
            'Unsupported binary format. Please save your document as PDF, TXT, MD, CSV, or XLSX and try again.'
          );
        }
        extractedText = stripped.slice(0, 25000);
      }

      if (!extractedText) {
        throw new Error('No readable text could be extracted from this file.');
      }

      setPreviousContent(section.content);
      const nextContent =
        importMode === 'replace' || !section.content.trim()
          ? extractedText
          : `${section.content.trim()}\n\n--- Imported from ${file.name} ---\n${extractedText}`;

      onUpdateSection({
        content: nextContent,
        importedDocName: file.name,
        isCompleted: nextContent.trim().length > 20,
      });
      setStatusMessage(`Imported content from "${file.name}" (${importMode}d).`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Document import failed.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // =========================================================================
  // GEMINI WRITING ASSISTANCE (TOKEN-POWERED)
  // =========================================================================
  const handleGeminiAssist = async (mode: 'draft' | 'improve' | 'expand') => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (liveTokens < GEMINI_WRITE_TOKEN_COST) {
      setErrorMessage(
        `You need ${GEMINI_WRITE_TOKEN_COST} tokens for Gemini writing assistance (current balance: ${liveTokens}). Use "Buy Tokens" in the top bar to top up.`
      );
      return;
    }

    if ((mode === 'improve' || mode === 'expand') && !section.content.trim()) {
      setErrorMessage('Write a brief draft first, or click "Draft Full Section" to have Gemini write from scratch.');
      return;
    }

    setIsGenerating(true);
    try {
      const businessContext = buildGeminiBusinessContext(planData, metrics);
      const resp = await fetch('/api/gemini/bizzforecasta-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: section.id,
          pageTitle: section.title,
          hints: section.hints || [],
          existingDraft: section.content,
          userPrompt: customInstruction.trim(),
          mode,
          businessContext,
        }),
      });
      const payload = await resp.json();
      if (!resp.ok || !payload?.text) {
        throw new Error(payload?.error || 'Gemini writing assistance failed.');
      }

      // Deduct tokens ONLY after confirmed Gemini response
      window.dispatchEvent(
        new CustomEvent('bizz-token-deduction', {
          detail: {
            amount: GEMINI_WRITE_TOKEN_COST,
            description: `bizzforecasta Gemini Writing Assist: ${section.title}`,
          },
        })
      );
      setLiveTokens((prev) => Math.max(0, prev - GEMINI_WRITE_TOKEN_COST));

      setPreviousContent(section.content);
      onUpdateSection({
        content: payload.text,
        isCompleted: true,
      });
      setStatusMessage(
        `Gemini ${mode === 'draft' ? 'drafted' : mode === 'improve' ? 'refined' : 'expanded'} "${section.title}" (${GEMINI_WRITE_TOKEN_COST} tokens used).`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to reach Gemini writing assistant.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUndo = () => {
    if (previousContent !== null) {
      onUpdateSection({ content: previousContent });
      setPreviousContent(null);
      setStatusMessage('Restored previous draft.');
    }
  };

  const wordCount = section.content.trim()
    ? section.content.trim().split(/\s+/).length
    : 0;

  const isIncluded = section.isIncluded !== false;
  const cm = section.customMetrics || {};
  const ltvCacRatio = cm.cac && cm.cac > 0 ? (cm.ltv || 0) / cm.cac : 0;

  const inputClass = `w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none transition-all ${
    isDark
      ? 'bg-[#0E1322] border-[#252E4A] text-white placeholder:text-slate-600 focus:border-[#5584B4]'
      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#2E5E88]'
  }`;

  return (
    <div className="space-y-5 font-mono">
      {/* 1. EDITABLE PAGE TITLE + OPTIONAL INCLUSION TOGGLE */}
      <div
        className={`p-4 rounded-xl border space-y-3 ${
          isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-[#2E5E88] dark:text-[#7FAADC]" />
            <span>page title (editable — updates plan & print preview)</span>
          </label>

          {section.isOptional && (
            <button
              type="button"
              onClick={() => onUpdateSection({ isIncluded: !isIncluded })}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold lowercase transition-colors cursor-pointer ${
                isIncluded
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-200/60 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
              }`}
              title="Toggle whether this optional guide page is included in the compiled A4 business plan"
            >
              {isIncluded ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{isIncluded ? 'included in compiled plan' : 'excluded (optional)'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdateSection({ title: e.target.value.slice(0, 140) })}
            placeholder="enter custom page title..."
            className={`${inputClass} font-bold text-sm`}
          />
          {section.defaultTitle && section.title !== section.defaultTitle && (
            <button
              type="button"
              onClick={() => onUpdateSection({ title: section.defaultTitle })}
              title="Reset to default page title"
              className={`px-2.5 py-2 rounded-xl border text-[10px] font-bold lowercase shrink-0 cursor-pointer flex items-center gap-1 ${
                isDark
                  ? 'bg-[#101626] border-[#252E4A] text-slate-300 hover:text-white'
                  : 'bg-white border-[#D8CEBC] text-slate-600 hover:text-[#2E5E88]'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. STRUCTURED WRITING GUIDE & HINTS */}
      {section.hints && section.hints.length > 0 && (
        <div
          className={`rounded-xl border overflow-hidden ${
            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
          }`}
        >
          <button
            type="button"
            onClick={() => setShowHints(!showHints)}
            className={`w-full px-4 py-2.5 flex items-center justify-between text-left cursor-pointer ${
              isDark ? 'bg-[#161C30]' : 'bg-[#F4EFE6]/80'
            }`}
          >
            <span className="flex items-center gap-2 text-[11px] font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC]">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>investor guide & writing hints ({section.hints.length} prompts)</span>
            </span>
            {showHints ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showHints && (
            <div className="p-4 space-y-2.5">
              {section.hints.map((hint, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs leading-relaxed ${
                    isDark
                      ? 'bg-[#141A2E]/80 border-[#222F4C] text-slate-300'
                      : 'bg-[#FAF8F5] border-[#ECE7DE] text-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="font-bold text-[#2E5E88] dark:text-[#7FAADC]">
                      • {hint.heading}:
                    </span>
                    {hint.autoSyncTag && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold lowercase">
                        {hint.autoSyncTag}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
                    {hint.detail}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. CONTEXT-SPECIFIC STRUCTURED METRICS & AUTO-SYNCED TABLES */}
      {/* 3A. Executive Summary & The Ask quick structured fields */}
      {section.id === 'exec_summary_ask' && (
        <div
          className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#2E5E88] dark:text-[#7FAADC]">
            capital ask summary (synced to print memorandum)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] lowercase font-bold text-slate-500 dark:text-slate-400">
                capital requested (r)
              </label>
              <input
                type="number"
                min="0"
                value={cm.capitalRequested || ''}
                placeholder={metrics.totalFundingConfigured > 0 ? String(Math.round(metrics.totalFundingConfigured)) : 'e.g. 5000000'}
                onChange={(e) => updateCustomMetric({ capitalRequested: Number(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] lowercase font-bold text-slate-500 dark:text-slate-400">
                instrument preference
              </label>
              <select
                value={cm.instrumentPreference || 'Equity'}
                onChange={(e) => updateCustomMetric({ instrumentPreference: e.target.value })}
                className={inputClass}
              >
                <option value="Equity">Equity</option>
                <option value="Debt">Debt / Term Facility</option>
                <option value="Mezzanine">Mezzanine / Convertible</option>
                <option value="Revenue-Based">Revenue-Based Finance</option>
                <option value="Blended Debt & Equity">Blended Debt & Equity</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] lowercase font-bold text-slate-500 dark:text-slate-400">
                target close timeline
              </label>
              <input
                type="text"
                value={cm.targetTimeline || ''}
                placeholder="e.g. Q3 2026 (90 days)"
                onChange={(e) => updateCustomMetric({ targetTimeline: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3B. Page 2: Proven Traction & Historical Performance auto-sync */}
      {section.autoSyncBlock === 'historical_traction' && (
        <div className="space-y-4">
          <div
            className={`rounded-xl border overflow-hidden ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div
              className={`px-4 py-2.5 border-b flex items-center justify-between ${
                isDark ? 'bg-[#161C30] border-[#222F4C]' : 'bg-[#F4EFE6]/80 border-[#D8CEBC]'
              }`}
            >
              <span className="text-[11px] font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>historical revenue & profit trajectory (auto-synced from bizzforecasta)</span>
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold lowercase">
                live sync
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono border-collapse">
                <thead>
                  <tr className={isDark ? 'bg-[#141A2E] text-slate-400' : 'bg-[#FAF8F5] text-slate-500'}>
                    <th className="py-2 px-3 text-left lowercase">metric</th>
                    {metrics.historicalYears.map((y) => (
                      <th key={y.id} className="py-2 px-3 text-right uppercase">
                        {y.yearLabel}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                  <tr>
                    <td className="py-1.5 px-3 text-left lowercase font-bold">revenue</td>
                    {metrics.historicalYears.map((y) => (
                      <td key={y.id} className="py-1.5 px-3 text-right tabular-nums">
                        {formatNum(y.revenue)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-left lowercase">gross profit</td>
                    {metrics.historicalYears.map((y) => (
                      <td key={y.id} className="py-1.5 px-3 text-right tabular-nums">
                        {formatNum(computeHistoricalYearMetrics(y).grossProfit)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-left lowercase">gross margin %</td>
                    {metrics.historicalYears.map((y) => (
                      <td key={y.id} className="py-1.5 px-3 text-right tabular-nums text-[#2E5E88] dark:text-[#7FAADC]">
                        {computeHistoricalYearMetrics(y).grossMarginPct.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-left lowercase font-bold">ebitda</td>
                    {metrics.historicalYears.map((y) => (
                      <td key={y.id} className="py-1.5 px-3 text-right tabular-nums font-bold">
                        {formatNum(computeHistoricalYearMetrics(y).ebitda)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-left lowercase">operating cash flow</td>
                    {metrics.historicalYears.map((y) => (
                      <td key={y.id} className="py-1.5 px-3 text-right tabular-nums">
                        {formatNum(y.operatingCashFlow)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            {!metrics.hasHistoricalData && (
              <div className="px-4 py-2 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border-t border-amber-500/20">
                Tip: Update your 3–5 year Historical Performance table in the Funding Calculator or Reports → Executive Summary step to populate these figures automatically.
              </div>
            )}
          </div>

          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#2E5E88] dark:text-[#7FAADC]">
              customer proof metrics (optional structured snapshot)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] lowercase font-bold text-slate-500 block mb-1">
                  retention %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={cm.retentionRatePct || ''}
                  placeholder="e.g. 92"
                  onChange={(e) => updateCustomMetric({ retentionRatePct: Number(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-[10px] lowercase font-bold text-slate-500 block mb-1">
                  annual churn %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={cm.churnRatePct || ''}
                  placeholder="e.g. 8"
                  onChange={(e) => updateCustomMetric({ churnRatePct: Number(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-[10px] lowercase font-bold text-slate-500 block mb-1">
                  net dollar retention %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={cm.netDollarRetentionPct || ''}
                  placeholder="e.g. 112"
                  onChange={(e) => updateCustomMetric({ netDollarRetentionPct: Number(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-[10px] lowercase font-bold text-slate-500 block mb-1">
                  contracted pipeline (r)
                </label>
                <input
                  type="number"
                  value={cm.contractedPipeline || ''}
                  placeholder="e.g. 3500000"
                  onChange={(e) => updateCustomMetric({ contractedPipeline: Number(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3C. Page 4: Quarterly Targets (Next 12–24 Months) auto-sync */}
      {section.autoSyncBlock === 'quarterly_kpis' && (
        <div
          className={`rounded-xl border overflow-hidden ${
            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
          }`}
        >
          <div
            className={`px-4 py-2.5 border-b flex items-center justify-between ${
              isDark ? 'bg-[#161C30] border-[#222F4C]' : 'bg-[#F4EFE6]/80 border-[#D8CEBC]'
            }`}
          >
            <span className="text-[11px] font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>quarterly targets (next 12–24 months · updated from bizzforecasta)</span>
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono border-collapse">
              <thead>
                <tr className={isDark ? 'bg-[#141A2E] text-slate-400' : 'bg-[#FAF8F5] text-slate-500'}>
                  <th className="py-2 px-3 text-left lowercase">quarter</th>
                  <th className="py-2 px-2 text-right lowercase">revenue</th>
                  <th className="py-2 px-2 text-right lowercase">gross profit</th>
                  <th className="py-2 px-2 text-right lowercase">gp %</th>
                  <th className="py-2 px-2 text-right lowercase">opex</th>
                  <th className="py-2 px-2 text-right lowercase">operating profit</th>
                  <th className="py-2 px-3 text-right lowercase">closing cash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {metrics.quarterlyTargets.map((q) => (
                  <tr key={q.quarterLabel}>
                    <td className="py-1.5 px-3 text-left font-bold whitespace-nowrap">
                      {q.quarterLabel}{' '}
                      <span className="text-[9px] text-slate-400 font-normal">({q.monthsRange})</span>
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{formatNum(q.revenue)}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{formatNum(q.grossProfit)}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{q.grossMarginPct.toFixed(1)}%</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{formatNum(q.opex)}</td>
                    <td
                      className={`py-1.5 px-2 text-right tabular-nums font-bold ${
                        q.operatingProfit < 0 ? 'text-rose-500' : 'text-[#2E5E88] dark:text-[#7FAADC]'
                      }`}
                    >
                      {formatNum(q.operatingProfit)}
                    </td>
                    <td
                      className={`py-1.5 px-3 text-right tabular-nums ${
                        q.closingCash < 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatNum(q.closingCash)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3D. Page 6: 3–5 Year Forecast, Unit Economics, Scenarios & Historical Performance */}
      {section.autoSyncBlock === 'financial_projections_unit_econ' && (
        <div className="space-y-4">
          {/* 3–5 Year Forecast */}
          <div
            className={`rounded-xl border overflow-hidden ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div
              className={`px-4 py-2.5 border-b flex items-center justify-between ${
                isDark ? 'bg-[#161C30] border-[#222F4C]' : 'bg-[#F4EFE6]/80 border-[#D8CEBC]'
              }`}
            >
              <span className="text-[11px] font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC]">
                3–5 year financial forecast (updated by bizzforecasta)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono border-collapse">
                <thead>
                  <tr className={isDark ? 'bg-[#141A2E] text-slate-400' : 'bg-[#FAF8F5] text-slate-500'}>
                    <th className="py-2 px-3 text-left lowercase">metric</th>
                    {metrics.yearlyForecast.map((y) => (
                      <th key={y.year} className="py-2 px-2 text-right lowercase">
                        {y.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                  {[
                    { label: 'revenue', fn: (y: any) => formatNum(y.revenue), bold: true },
                    { label: 'gross profit', fn: (y: any) => formatNum(y.grossProfit) },
                    { label: 'gross margin %', fn: (y: any) => `${y.grossMarginPct.toFixed(1)}%` },
                    { label: 'operating expenses', fn: (y: any) => formatNum(y.opex) },
                    { label: 'net operating profit', fn: (y: any) => formatNum(y.operatingProfit), bold: true },
                    { label: 'net profit after tax', fn: (y: any) => formatNum(y.netProfit) },
                    { label: 'operating cash flow', fn: (y: any) => formatNum(y.operatingCashFlow) },
                    { label: 'working capital needs', fn: (y: any) => formatNum(y.workingCapitalNeeds) },
                    { label: 'closing cash balance', fn: (y: any) => formatNum(y.closingCash), bold: true },
                  ].map((r) => (
                    <tr key={r.label} className={r.bold ? (isDark ? 'bg-[#141A2E]/60 font-bold' : 'bg-[#FAF8F5] font-bold') : ''}>
                      <td className="py-1.5 px-3 text-left lowercase">{r.label}</td>
                      {metrics.yearlyForecast.map((y) => (
                        <td key={y.year} className="py-1.5 px-2 text-right tabular-nums">
                          {r.fn(y)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Core Unit Economics Inputs */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#2E5E88] dark:text-[#7FAADC]">
                core unit economics (synced to print view)
              </span>
              {ltvCacRatio > 0 && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  LTV : CAC = {ltvCacRatio.toFixed(2)}x
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] lowercase font-bold text-slate-500 block mb-1">
                  cac (customer acq. cost)
                </label>
                <input
                  type="number"
                  value={cm.cac || ''}
                  placeholder="e.g. 2500"
                  onChange={(e) => updateCustomMetric({ cac: Number(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-[10px] lowercase font-bold text-slate-500 block mb-1">
                  ltv (lifetime value)
                </label>
                <input
                  type="number"
                  value={cm.ltv || ''}
                  placeholder="e.g. 12000"
                  onChange={(e) => updateCustomMetric({ ltv: Number(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-[10px] lowercase font-bold text-slate-500 block mb-1">
                  payback period (months)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={cm.paybackMonths || ''}
                  placeholder="e.g. 5.5"
                  onChange={(e) => updateCustomMetric({ paybackMonths: Number(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-[10px] lowercase font-bold text-slate-500 block mb-1">
                  contribution margin %
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={cm.contributionMarginPct || ''}
                  placeholder="e.g. 48"
                  onChange={(e) => updateCustomMetric({ contributionMarginPct: Number(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Scenario Sensitivities */}
          <div
            className={`rounded-xl border overflow-hidden ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div
              className={`px-4 py-2.5 border-b ${
                isDark ? 'bg-[#161C30] border-[#222F4C]' : 'bg-[#F4EFE6]/80 border-[#D8CEBC]'
              }`}
            >
              <span className="text-[11px] font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC]">
                scenario sensitivities (base · upside · downside cash flow resilience)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono border-collapse">
                <thead>
                  <tr className={isDark ? 'bg-[#141A2E] text-slate-400' : 'bg-[#FAF8F5] text-slate-500'}>
                    <th className="py-2 px-3 text-left lowercase">scenario</th>
                    <th className="py-2 px-2 text-right lowercase">yr 1 rev</th>
                    <th className="py-2 px-2 text-right lowercase">yr 3 rev</th>
                    <th className="py-2 px-2 text-right lowercase">yr 3 nop</th>
                    <th className="py-2 px-2 text-right lowercase">yr 3 cash</th>
                    <th className="py-2 px-3 text-right lowercase">yr 5 cash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                  {metrics.scenarios.map((s) => (
                    <tr key={s.scenario}>
                      <td className="py-1.5 px-3 text-left font-bold">{s.scenario}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{formatNum(s.yr1Revenue)}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{formatNum(s.yr3Revenue)}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{formatNum(s.yr3Nop)}</td>
                      <td
                        className={`py-1.5 px-2 text-right tabular-nums font-bold ${
                          s.yr3ClosingCash < 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatNum(s.yr3ClosingCash)}
                      </td>
                      <td
                        className={`py-1.5 px-3 text-right tabular-nums font-bold ${
                          s.yr5ClosingCash < 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatNum(s.yr5ClosingCash)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3–5 Year Historical Performance (IS / BS / CF) */}
          <div
            className={`rounded-xl border overflow-hidden ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div
              className={`px-4 py-2.5 border-b flex items-center justify-between ${
                isDark ? 'bg-[#161C30] border-[#222F4C]' : 'bg-[#F4EFE6]/80 border-[#D8CEBC]'
              }`}
            >
              <span className="text-[11px] font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC]">
                historical performance ({metrics.historicalYears.length}-year hi-level is · bs · cf — from bizzforecasta)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono border-collapse">
                <thead>
                  <tr className={isDark ? 'bg-[#141A2E] text-slate-400' : 'bg-[#FAF8F5] text-slate-500'}>
                    <th className="py-2 px-3 text-left lowercase">hi-level statement line</th>
                    {metrics.historicalYears.map((y) => (
                      <th key={y.id} className="py-2 px-3 text-right uppercase">
                        {y.yearLabel}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                  {[
                    { label: 'is · revenue', fn: (y: any) => formatNum(y.revenue), bold: true },
                    { label: 'is · gross profit', fn: (y: any) => formatNum(computeHistoricalYearMetrics(y).grossProfit) },
                    { label: 'is · ebitda', fn: (y: any) => formatNum(computeHistoricalYearMetrics(y).ebitda) },
                    { label: 'is · net profit after tax', fn: (y: any) => formatNum(computeHistoricalYearMetrics(y).netProfit), bold: true },
                    { label: 'bs · total assets', fn: (y: any) => formatNum(computeHistoricalYearMetrics(y).totalAssets) },
                    { label: 'bs · shareholders equity', fn: (y: any) => formatNum(y.equity) },
                    { label: 'bs · long-term debt', fn: (y: any) => formatNum(y.longTermDebt) },
                    { label: 'cf · operating cash flow', fn: (y: any) => formatNum(y.operatingCashFlow) },
                    { label: 'cf · investing cash flow', fn: (y: any) => formatNum(y.investingCashFlow) },
                    { label: 'cf · financing cash flow', fn: (y: any) => formatNum(y.financingCashFlow) },
                    { label: 'cf · closing cash balance', fn: (y: any) => formatNum(y.closingCashBalance), bold: true },
                  ].map((r) => (
                    <tr key={r.label} className={r.bold ? (isDark ? 'bg-[#141A2E]/60 font-bold' : 'bg-[#FAF8F5] font-bold') : ''}>
                      <td className="py-1.5 px-3 text-left lowercase">{r.label}</td>
                      {metrics.historicalYears.map((y) => (
                        <td key={y.id} className="py-1.5 px-3 text-right tabular-nums">
                          {r.fn(y)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!metrics.hasHistoricalData && (
              <div className="px-4 py-2 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border-t border-amber-500/20">
                Enter your 3–5 year Historical Performance in the Funding Calculator or Executive Summary Reports step to populate this schedule automatically.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. ACTION TOOLBAR: ELECTRONIC DOCUMENT IMPORT + GEMINI WRITING ASSIST */}
      <div
        className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 ${
          isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#F4EFE6]/75 border-[#D8CEBC]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.webp"
            onChange={handleDocumentImport}
            className="hidden"
          />
          <button
            type="button"
            disabled={isImporting}
            onClick={() => fileInputRef.current?.click()}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold lowercase transition-colors cursor-pointer disabled:opacity-50 ${
              isDark
                ? 'bg-[#101626] border-[#252E4A] text-slate-200 hover:border-[#5584B4]'
                : 'bg-white border-[#D8CEBC] text-[#2E5E88] hover:border-[#2E5E88]'
            }`}
          >
            {isImporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>{isImporting ? 'importing document...' : 'import from document'}</span>
          </button>

          <select
            value={importMode}
            onChange={(e) => setImportMode(e.target.value as 'append' | 'replace')}
            aria-label="Document import mode"
            className={`px-2 py-1.5 rounded-xl border text-[10px] font-bold lowercase cursor-pointer focus:outline-none ${
              isDark
                ? 'bg-[#101626] border-[#252E4A] text-slate-300'
                : 'bg-white border-[#D8CEBC] text-slate-600'
            }`}
          >
            <option value="append">append import</option>
            <option value="replace">replace draft</option>
          </select>

          <button
            type="button"
            onClick={() => setShowGeminiPanel(!showGeminiPanel)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold lowercase transition-colors cursor-pointer ${
              showGeminiPanel
                ? 'bg-[#2E5E88] text-white'
                : 'bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#7FAADC] hover:bg-[#2E5E88] hover:text-white border border-[#2E5E88]/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>gemini writing assist ({GEMINI_WRITE_TOKEN_COST} tokens)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
          {previousContent !== null && (
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#D8CEBC] dark:border-[#252E4A] hover:text-[#2E5E88] cursor-pointer font-bold lowercase"
            >
              <Undo2 className="w-3 h-3" />
              <span>undo</span>
            </button>
          )}
          <span className="inline-flex items-center gap-1 font-bold text-[#2E5E88] dark:text-[#7FAADC]">
            <Coins className="w-3 h-3" />
            <span>{liveTokens} tokens</span>
          </span>
        </div>
      </div>

      {/* 5. COLLAPSIBLE GEMINI WRITING ASSISTANT PANEL */}
      {showGeminiPanel && (
        <div
          className={`p-4 rounded-xl border space-y-3 ${
            isDark
              ? 'bg-[#0F172A] border-[#33507A]'
              : 'bg-white border-[#2E5E88]/40 shadow-2xs'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2E5E88] dark:text-[#7FAADC]" />
              <span className="text-xs font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC]">
                gemini investor writing assistant
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase">
              cost: {GEMINI_WRITE_TOKEN_COST} tokens per generation · uses live bizzforecasta financials
            </span>
          </div>

          <input
            type="text"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            placeholder="optional guidance for gemini (e.g. emphasize our 42% gross margin, focus on debt repayment certainty, highlight R5m capex expansion)..."
            className={inputClass}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleGeminiAssist('draft')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#244c70] text-white text-[11px] font-bold lowercase transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>draft full section ({GEMINI_WRITE_TOKEN_COST} tokens)</span>
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleGeminiAssist('improve')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[11px] font-bold lowercase transition-colors cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-[#141A2E] border-[#252E4A] text-slate-200 hover:border-[#5584B4]'
                  : 'bg-[#FAF8F5] border-[#D8CEBC] text-[#2E5E88] hover:border-[#2E5E88]'
              }`}
            >
              <span>refine & strengthen my draft</span>
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleGeminiAssist('expand')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[11px] font-bold lowercase transition-colors cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-[#141A2E] border-[#252E4A] text-slate-200 hover:border-[#5584B4]'
                  : 'bg-[#FAF8F5] border-[#D8CEBC] text-[#2E5E88] hover:border-[#2E5E88]'
              }`}
            >
              <span>expand with financial proof</span>
            </button>
          </div>
        </div>
      )}

      {/* Status & Error Notices */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 6. MAIN MOTIVATION & JUSTIFICATION NARRATIVE EDITOR */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#2E5E88]" />
            <span>your written motivation & investor justification</span>
          </label>
          <div className="flex items-center gap-3 text-[10px] text-slate-400 lowercase">
            {section.importedDocName && (
              <span className="text-[#2E5E88] dark:text-[#7FAADC] font-bold">
                source: {section.importedDocName}
              </span>
            )}
            <span>{wordCount} words</span>
          </div>
        </div>

        <textarea
          value={section.content}
          onChange={(e) =>
            onUpdateSection({
              content: e.target.value,
              isCompleted: e.target.value.trim().length > 20,
            })
          }
          placeholder={`Write your motivation and justification for "${section.title}", import from an electronic document (PDF, XLSX, CSV, TXT, MD), or use Gemini Writing Assist above...`}
          className={`w-full min-h-[280px] rounded-xl border p-4 text-xs font-mono leading-relaxed focus:outline-none resize-y transition-all ${
            isDark
              ? 'bg-[#0E1322] border-[#252E4A] text-white placeholder:text-slate-600 focus:border-[#5584B4]'
              : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#2E5E88]'
          }`}
        />
      </div>
    </div>
  );
};

export default ScriptedPlanPageEditor;
