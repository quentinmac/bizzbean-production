import React, { useState, useEffect, useMemo, useCallback } from 'react';
import jsPDF from 'jspdf';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Presentation,
  Sparkles,
  Coins,
  Download,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Check,
  Copy,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import { BizzPlanData, BizzModelData } from '../../../types';
import { BizzModelState } from '../../bizzmodel/constants';
import { sanitizeBizzModelData } from '../../bizzmodel/BizzModel';
import { INITIAL_PLAN_DATA } from '../constants';
import { getYearlyFinancialValues } from '../utils/simAdapter';

const DECK_TOKEN_COST = 150;

export type PitchDeckAudience = 'investor' | 'lender' | 'executive';

export interface PitchDeckSlide {
  slideNumber: number;
  kicker: string;
  title: string;
  keyTakeaway: string;
  layout: 'hero' | 'split' | 'metrics' | 'financials' | 'ask' | string;
  bullets: string[];
  highlightMetric?: {
    label: string;
    value: string;
    context: string;
  };
  speakerNotes: string;
}

export interface GeneratedPitchDeck {
  deckTitle: string;
  deckSubtitle: string;
  executiveBrief: string;
  slides: PitchDeckSlide[];
  generatedAt?: string;
  audience?: PitchDeckAudience;
}

interface PitchDeckStudioProps {
  theme?: 'light' | 'dark';
  bizzModelState?: BizzModelState;
  onBackToStep?: () => void;
  backLabel?: string;
}

const AUDIENCE_OPTIONS: Array<{
  id: PitchDeckAudience;
  label: string;
  subtitle: string;
}> = [
  {
    id: 'investor',
    label: 'equity investors',
    subtitle: 'angel, vc & private equity thesis with growth moat',
  },
  {
    id: 'lender',
    label: 'bank / dfi lenders',
    subtitle: 'cash-flow coverage, collateral & repayment resilience',
  },
  {
    id: 'executive',
    label: 'executive board',
    subtitle: 'operational execution, kpi governance & 5-yr milestones',
  },
];

const readTokenBalance = (): number => {
  try {
    const saved = localStorage.getItem('bizzdesk_token_balance_v1');
    if (saved) {
      const n = parseInt(saved, 10);
      if (!isNaN(n)) return n;
    }
  } catch {}
  return 250;
};

const formatCompactCurrency = (num: number, currency = 'R'): string => {
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${currency}${(abs / 1_000_000).toFixed(2)}m`;
  if (abs >= 1_000) return `${sign}${currency}${(abs / 1_000).toFixed(0)}k`;
  return `${sign}${currency}${Math.round(abs).toLocaleString()}`;
};

export default function PitchDeckStudio({
  theme = 'light',
  bizzModelState,
  onBackToStep,
  backLabel = 'back to model',
}: PitchDeckStudioProps) {
  const isDark = theme === 'dark';

  const [tokenBalance, setTokenBalance] = useState<number>(() => readTokenBalance());
  const [audience, setAudience] = useState<PitchDeckAudience>('investor');
  const [slideStyle, setSlideStyle] = useState<'ivory' | 'navy'>('ivory');
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isEditingSlide, setIsEditingSlide] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedNotes, setCopiedNotes] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Sync token balance in real time with App.tsx header
  useEffect(() => {
    const onBalanceEvent = (e: Event) => {
      const val = Number((e as CustomEvent).detail);
      if (!isNaN(val)) setTokenBalance(val);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'bizzdesk_token_balance_v1' && e.newValue) {
        const val = parseInt(e.newValue, 10);
        if (!isNaN(val)) setTokenBalance(val);
      }
    };
    window.addEventListener('bizz-token-balance-updated', onBalanceEvent);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('bizz-token-balance-updated', onBalanceEvent);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Load synced BizzPlan & BizzModel data
  const planData: BizzPlanData = useMemo(() => {
    try {
      const saved = localStorage.getItem('bizzplan_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_PLAN_DATA,
          ...parsed,
          coverPage: { ...INITIAL_PLAN_DATA.coverPage, ...(parsed.coverPage || {}) },
          pitch: { ...INITIAL_PLAN_DATA.pitch, ...(parsed.pitch || {}) },
        };
      }
    } catch {}
    return INITIAL_PLAN_DATA;
  }, [bizzModelState]);

  const modelData: BizzModelData | null = useMemo(() => {
    try {
      if (bizzModelState) return sanitizeBizzModelData(bizzModelState);
      const candidates = [
        localStorage.getItem('bizzmodel_platform_data'),
        localStorage.getItem('bizzdynamics_platform_data'),
        localStorage.getItem('bizzmodel_data'),
      ];
      for (const raw of candidates) {
        if (raw) return sanitizeBizzModelData(JSON.parse(raw));
      }
    } catch {}
    return null;
  }, [bizzModelState]);

  const ventureName =
    planData.coverPage?.companyName ||
    planData.businessName ||
    modelData?.company?.name ||
    bizzModelState?.businessDetails?.businessName ||
    'Your Venture';

  const ventureType =
    planData.coverPage?.businessType ||
    modelData?.setup?.businessType ||
    'Private Enterprise';

  const deckStorageKey = useMemo(() => {
    const slug = ventureName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48) || 'venture';
    return `bizzplan_pitch_deck_v1_${slug}`;
  }, [ventureName]);

  const [deck, setDeck] = useState<GeneratedPitchDeck | null>(() => {
    try {
      const saved = localStorage.getItem(deckStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(deckStorageKey);
      setDeck(saved ? JSON.parse(saved) : null);
      setActiveSlideIdx(0);
    } catch {}
  }, [deckStorageKey]);

  const persistDeck = useCallback(
    (nextDeck: GeneratedPitchDeck | null) => {
      setDeck(nextDeck);
      try {
        if (nextDeck) {
          localStorage.setItem(deckStorageKey, JSON.stringify(nextDeck));
        } else {
          localStorage.removeItem(deckStorageKey);
        }
      } catch {}
    },
    [deckStorageKey]
  );

  // Extract real 5-year simulation metrics
  const financialSeries = useMemo(() => {
    const rev = getYearlyFinancialValues(modelData, 'rev');
    const gp = getYearlyFinancialValues(modelData, 'gp');
    const np = getYearlyFinancialValues(modelData, 'np');
    const bank = getYearlyFinancialValues(modelData, 'bank');
    const gpMargin = getYearlyFinancialValues(modelData, 'gp-margin');

    return {
      rev,
      gp,
      np,
      bank,
      gpMargin,
      chartRows: [1, 2, 3, 4, 5].map((yr, idx) => ({
        year: `Yr ${yr}`,
        revenue: Math.round(rev[idx] || 0),
        grossProfit: Math.round(gp[idx] || 0),
        netProfit: Math.round(np[idx] || 0),
      })),
    };
  }, [modelData]);

  const completedSectionsCount = useMemo(
    () => (planData.sections || []).filter((s) => s.isCompleted).length,
    [planData.sections]
  );

  const handleOpenBuyTokens = () => {
    window.dispatchEvent(new CustomEvent('bizz-open-buy-tokens'));
  };

  const handleGenerateDeck = async () => {
    setErrorMsg('');
    if (tokenBalance < DECK_TOKEN_COST) {
      setErrorMsg(
        `Insufficient tokens: generating an AI pitch deck requires ${DECK_TOKEN_COST} tokens (current balance: ${tokenBalance}).`
      );
      return;
    }

    setIsGenerating(true);
    try {
      const sectionsSummary: Record<string, string> = {};
      (planData.sections || []).forEach((s) => {
        if (s.content && s.content.trim()) {
          sectionsSummary[s.id] = s.content.trim().slice(0, 500);
        }
      });

      const response = await fetch('/api/gemini/pitch-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: ventureName,
          businessType: ventureType,
          founderName: planData.coverPage?.preparationPrincipal || '',
          vision: planData.vision || '',
          mission: planData.mission || '',
          audience,
          pitch: planData.pitch || {},
          sectionsSummary,
          financialSummary: {
            currency: 'ZAR',
            revenue: financialSeries.rev,
            grossProfit: financialSeries.gp,
            netProfit: financialSeries.np,
            bankBalance: financialSeries.bank,
            gpMargin: financialSeries.gpMargin,
            founderEquity: bizzModelState?.funding?.founderEquity || modelData?._v2State?.funding?.founderEquity || 0,
            investorEquity: bizzModelState?.funding?.investorEquity || modelData?._v2State?.funding?.investorEquity || 0,
            bankLoanAmount: bizzModelState?.funding?.bankLoanAmount || modelData?._v2State?.funding?.bankLoanAmount || 0,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.deck?.slides?.length) {
        throw new Error(result?.error || 'Could not synthesize pitch deck.');
      }

      // Deduct tokens ONLY after successful synthesis
      window.dispatchEvent(
        new CustomEvent('bizz-token-deduction', {
          detail: {
            amount: DECK_TOKEN_COST,
            description: `AI Pitch Deck Synthesis (${audience}): ${ventureName}`,
          },
        })
      );

      const enrichedDeck: GeneratedPitchDeck = {
        ...result.deck,
        generatedAt: new Date().toISOString(),
        audience,
      };
      persistDeck(enrichedDeck);
      setActiveSlideIdx(0);
      setIsEditingSlide(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to generate pitch deck right now. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Keyboard navigation in slideshow
  useEffect(() => {
    if (!deck?.slides?.length) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (e.key === 'ArrowRight') {
        setActiveSlideIdx((prev) => Math.min(deck.slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setActiveSlideIdx((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deck, isFullscreen]);

  const activeSlide = deck?.slides?.[activeSlideIdx] || null;

  const updateActiveSlide = (patch: Partial<PitchDeckSlide>) => {
    if (!deck || !activeSlide) return;
    const updatedSlides = deck.slides.map((s, idx) =>
      idx === activeSlideIdx ? { ...s, ...patch } : s
    );
    persistDeck({ ...deck, slides: updatedSlides });
  };

  const handleCopySpeakerNotes = () => {
    if (!deck) return;
    const text = activeSlide
      ? `${activeSlide.kicker} — ${activeSlide.title}\n\n${activeSlide.speakerNotes}`
      : deck.slides
          .map((s) => `${s.kicker}: ${s.title}\n${s.speakerNotes}`)
          .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 1800);
  };

  const handleDownloadPdf = async () => {
    if (!deck?.slides?.length) return;
    setIsExportingPdf(true);
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [297, 167.0625], // Crisp 16:9 widescreen presentation format
      });

      const isNavy = slideStyle === 'navy';
      const bgRgb: [number, number, number] = isNavy ? [16, 22, 38] : [250, 248, 245];
      const surfaceRgb: [number, number, number] = isNavy ? [22, 28, 48] : [255, 255, 255];
      const borderRgb: [number, number, number] = isNavy ? [37, 46, 74] : [216, 206, 188];
      const accentRgb: [number, number, number] = isNavy ? [127, 170, 220] : [46, 94, 136];
      const textRgb: [number, number, number] = isNavy ? [241, 245, 249] : [24, 34, 52];
      const mutedRgb: [number, number, number] = isNavy ? [148, 163, 184] : [80, 90, 105];

      deck.slides.forEach((slide, i) => {
        if (i > 0) pdf.addPage([297, 167.0625], 'landscape');

        // Background canvas
        pdf.setFillColor(...bgRgb);
        pdf.rect(0, 0, 297, 167.0625, 'F');

        // Top hairline metadata bar
        pdf.setDrawColor(...borderRgb);
        pdf.setLineWidth(0.35);
        pdf.line(16, 17, 281, 17);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(...accentRgb);
        pdf.text((slide.kicker || `0${i + 1}.`).toUpperCase(), 16, 13);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(...mutedRgb);
        pdf.text(
          `${ventureName.toLowerCase()}  ·  slide ${String(i + 1).padStart(2, '0')} of ${String(deck.slides.length).padStart(2, '0')}`,
          281,
          13,
          { align: 'right' }
        );

        // Title
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.setTextColor(...textRgb);
        const titleLines = pdf.splitTextToSize(slide.title, 265);
        pdf.text(titleLines, 16, 29);

        const afterTitleY = 29 + titleLines.length * 8.5 + 2;

        // Key takeaway band
        pdf.setFillColor(...surfaceRgb);
        pdf.setDrawColor(...borderRgb);
        pdf.roundedRect(16, afterTitleY, 265, 17, 2.5, 2.5, 'FD');

        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(10.5);
        pdf.setTextColor(...accentRgb);
        const takeawayLines = pdf.splitTextToSize(slide.keyTakeaway || '', 253);
        pdf.text(takeawayLines.slice(0, 2), 22, afterTitleY + 7);

        const bodyTopY = afterTitleY + 24;

        // Left column: Bullets
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(...textRgb);

        let bulletY = bodyTopY + 5;
        (slide.bullets || []).slice(0, 4).forEach((b) => {
          pdf.setTextColor(...accentRgb);
          pdf.text('•', 16, bulletY);
          pdf.setTextColor(...textRgb);
          const wrapped = pdf.splitTextToSize(b, 162);
          pdf.text(wrapped, 22, bulletY);
          bulletY += wrapped.length * 5.8 + 4.5;
        });

        // Right column: Highlight Metric Card (or 5-Year mini table on slide 7)
        pdf.setFillColor(...surfaceRgb);
        pdf.setDrawColor(...borderRgb);
        pdf.roundedRect(196, bodyTopY, 85, 68, 3, 3, 'FD');

        if (slide.layout === 'financials') {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.setTextColor(...accentRgb);
          pdf.text('5-YEAR MODEL SNAPSHOT', 203, bodyTopY + 9);

          let rowY = bodyTopY + 18;
          pdf.setFontSize(8.5);
          financialSeries.chartRows.forEach((r) => {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...mutedRgb);
            pdf.text(r.year, 203, rowY);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...textRgb);
            pdf.text(`Rev: ${formatCompactCurrency(r.revenue)}`, 220, rowY);
            pdf.text(`NP: ${formatCompactCurrency(r.netProfit)}`, 274, rowY, { align: 'right' });
            rowY += 9.5;
          });
        } else if (slide.highlightMetric) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.setTextColor(...mutedRgb);
          pdf.text((slide.highlightMetric.label || '').toUpperCase(), 203, bodyTopY + 12);

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(22);
          pdf.setTextColor(...accentRgb);
          const metricValLines = pdf.splitTextToSize(slide.highlightMetric.value || '—', 71);
          pdf.text(metricValLines.slice(0, 2), 203, bodyTopY + 26);

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(...mutedRgb);
          const ctxLines = pdf.splitTextToSize(slide.highlightMetric.context || '', 71);
          pdf.text(ctxLines.slice(0, 4), 203, bodyTopY + 42);
        }

        // Bottom footer
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(...mutedRgb);
        pdf.text('prepared inside bizzplan · institutional venture synthesis', 16, 159);
      });

      const cleanSlug = ventureName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      pdf.save(`${cleanSlug}-pitch-deck.pdf`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const slideIsNavy = slideStyle === 'navy';

  return (
    <div
      className={`font-mono transition-colors ${
        isFullscreen
          ? 'fixed inset-0 z-50 flex flex-col p-4 sm:p-8 overflow-y-auto bg-[#0A0D14] text-slate-100'
          : 'space-y-5'
      }`}
    >
      {/* Top Studio Header Bar */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 ${
          isFullscreen || isDark
            ? 'bg-[#101626] border-[#222F4C] text-slate-100'
            : 'bg-white border-[#D8CEBC] text-slate-900 shadow-2xs'
        }`}
      >
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-bold lowercase text-slate-500 dark:text-slate-400">
            <Presentation size={14} className="text-[#2E5E88] dark:text-[#7FAADC] shrink-0" />
            <span>ai pitch deck studio</span>
            <span aria-hidden="true">·</span>
            <span className="truncate text-[#2E5E88] dark:text-[#7FAADC]">{ventureName.toLowerCase()}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{tokenBalance} tokens available</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold lowercase tracking-tight text-[#2E5E88] dark:text-[#7FAADC]">
            {deck ? deck.deckTitle.toLowerCase() : 'client presentation & investor deck builder'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!isFullscreen && onBackToStep && (
            <button
              type="button"
              onClick={onBackToStep}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isDark
                  ? 'bg-[#161C30] border-[#252E4A] text-slate-200 hover:border-[#5584B4]'
                  : 'bg-[#FAF8F5] border-[#D8CEBC] text-[#2E5E88] hover:border-[#2E5E88]'
              }`}
            >
              <ArrowLeft size={13} />
              <span>{backLabel}</span>
            </button>
          )}

          {deck && (
            <>
              <button
                type="button"
                onClick={() => setSlideStyle((s) => (s === 'ivory' ? 'navy' : 'ivory'))}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isFullscreen || isDark
                    ? 'bg-[#161C30] border-[#252E4A] text-slate-200 hover:border-[#5584B4]'
                    : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-700 hover:border-[#2E5E88]'
                }`}
              >
                theme: {slideStyle}
              </button>

              {!isFullscreen && (
                <button
                  type="button"
                  onClick={() => setIsEditingSlide((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isEditingSlide
                      ? 'bg-[#2E5E88] border-[#2E5E88] text-white'
                      : isDark
                      ? 'bg-[#161C30] border-[#252E4A] text-slate-200 hover:border-[#5584B4]'
                      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-700 hover:border-[#2E5E88]'
                  }`}
                >
                  <Edit3 size={13} />
                  <span>{isEditingSlide ? 'done editing' : 'edit slide'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 ${
                  isFullscreen || isDark
                    ? 'bg-[#161C30] border-[#252E4A] text-slate-200 hover:border-[#5584B4]'
                    : 'bg-[#FAF8F5] border-[#D8CEBC] text-[#2E5E88] hover:border-[#2E5E88]'
                }`}
              >
                <Download size={13} />
                <span>{isExportingPdf ? 'exporting...' : 'export 16:9 pdf'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen((f) => !f)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E5E88] hover:bg-[#244c70] text-white text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span>{isFullscreen ? 'exit present' : 'present'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Audience & Synthesis Bar (hidden in fullscreen presentation mode) */}
      {!isFullscreen && (
        <div
          className={`rounded-2xl border p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 ${
            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-2xs'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold lowercase text-slate-500 dark:text-slate-400 mr-1">
              target audience:
            </span>
            {AUDIENCE_OPTIONS.map((opt) => {
              const active = audience === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAudience(opt.id)}
                  title={opt.subtitle}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold lowercase transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#2E5E88] border-[#2E5E88] text-white shadow-2xs'
                      : isDark
                      ? 'bg-[#141A2E] border-[#252E4A] text-slate-300 hover:border-[#5584B4]'
                      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-700 hover:border-[#2E5E88]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {tokenBalance < DECK_TOKEN_COST && (
              <button
                type="button"
                onClick={handleOpenBuyTokens}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold lowercase hover:bg-amber-500/20 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Coins size={13} />
                <span>buy tokens ({tokenBalance} left)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleGenerateDeck}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#244c70] text-white text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60 shadow-2xs"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>synthesizing 10 slides...</span>
                </>
              ) : (
                <>
                  {deck ? <RefreshCw size={13} /> : <Sparkles size={13} />}
                  <span>
                    {deck
                      ? `regenerate deck (${DECK_TOKEN_COST} tokens)`
                      : `generate 10-slide pitch deck (${DECK_TOKEN_COST} tokens)`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
          {tokenBalance < DECK_TOKEN_COST && (
            <button
              type="button"
              onClick={handleOpenBuyTokens}
              className="px-3 py-1 rounded-xl bg-[#2E5E88] text-white font-bold lowercase cursor-pointer whitespace-nowrap shrink-0"
            >
              buy tokens
            </button>
          )}
        </div>
      )}

      {/* Empty / Ready State before first generation */}
      {!deck && (
        <div
          className={`rounded-2xl border p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch ${
            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-2xs'
          }`}
        >
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-[11px] font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC] flex items-center gap-2">
                <Sparkles size={13} />
                <span>notebook-style executive synthesis · {ventureName.toLowerCase()}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold lowercase text-slate-900 dark:text-white leading-snug">
                transform your bizzmodel numbers &amp; bizzplan strategy into a 10-slide presentation deck.
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                gemini reads your cover identity, vision, pitch thesis, section touchpoint insights, and live 5-year 3-statement financial projections to compose an institutional slide deck with speaker notes and a 16:9 widescreen pdf download.
              </p>
            </div>

            <div
              className={`rounded-xl border p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 ${
                isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
              }`}
            >
              <div>
                <div className="text-[10px] lowercase text-slate-500 dark:text-slate-400">
                  yr 1 → yr 5 revenue
                </div>
                <div className="text-sm font-bold text-[#2E5E88] dark:text-[#7FAADC] mt-0.5 tabular-nums">
                  {formatCompactCurrency(financialSeries.rev[0] || 0)} →{' '}
                  {formatCompactCurrency(financialSeries.rev[4] || 0)}
                </div>
              </div>
              <div>
                <div className="text-[10px] lowercase text-slate-500 dark:text-slate-400">
                  yr 5 net profit
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                  {formatCompactCurrency(financialSeries.np[4] || 0)}
                </div>
              </div>
              <div>
                <div className="text-[10px] lowercase text-slate-500 dark:text-slate-400">
                  bizzplan readiness
                </div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                  {completedSectionsCount} / {planData.sections.length} sections
                </div>
              </div>
            </div>
          </div>

          <div
            className={`lg:col-span-5 rounded-xl border p-5 flex flex-col justify-between gap-4 ${
              isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold lowercase text-slate-900 dark:text-white">
                <FileText size={14} className="text-[#2E5E88] dark:text-[#7FAADC]" />
                <span>included 10-slide architecture</span>
              </div>
              <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 tabular-nums">
                <li>01. venture thesis &amp; cover positioning</li>
                <li>02. market problem &amp; customer friction</li>
                <li>03. value offer &amp; product advantage</li>
                <li>04. go-to-market &amp; distribution engine</li>
                <li>05. revenue model &amp; pricing mechanics</li>
                <li>06. competitive landscape &amp; moat</li>
                <li>07. 5-year quantitative financial outlook</li>
                <li>08. team, systems &amp; governance controls</li>
                <li>09. capital deployment &amp; growth levers</li>
                <li>10. the ask, deal terms &amp; milestones</li>
              </ol>
            </div>

            <div className="pt-3 border-t border-[#D8CEBC] dark:border-[#252E4A] flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>edits &amp; pdf exports after build: free</span>
              <span className="font-bold text-[#2E5E88] dark:text-[#7FAADC] tabular-nums">
                {DECK_TOKEN_COST} tokens
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active 16:9 Pitch Deck Stage */}
      {deck && activeSlide && (
        <div className="space-y-4">
          <div
            className={`rounded-2xl border overflow-hidden transition-colors ${
              slideIsNavy
                ? 'bg-[#101626] border-[#222F4C] text-slate-100'
                : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 shadow-sm'
            }`}
          >
            {/* Slide Top Chrome */}
            <div
              className={`px-5 sm:px-8 py-3 border-b flex items-center justify-between gap-3 text-[11px] ${
                slideIsNavy
                  ? 'border-[#222F4C] bg-[#161C30] text-slate-300'
                  : 'border-[#D8CEBC] bg-[#F2EDE4] text-slate-600'
              }`}
            >
              <span className="font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC]">
                {activeSlide.kicker}
              </span>
              <div className="flex items-center gap-3 tabular-nums">
                <span>{ventureName.toLowerCase()}</span>
                <span aria-hidden="true">·</span>
                <span className="font-bold">
                  slide {String(activeSlideIdx + 1).padStart(2, '0')} of{' '}
                  {String(deck.slides.length).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Slide 16:9 Canvas */}
            <div className="p-6 sm:p-10 lg:p-12 min-h-[420px] flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <h3
                  className={`text-2xl sm:text-3xl font-bold lowercase leading-tight max-w-4xl ${
                    slideIsNavy ? 'text-white' : 'text-[#182234]'
                  }`}
                >
                  {activeSlide.title}
                </h3>

                <div
                  className={`rounded-xl border px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    slideIsNavy
                      ? 'bg-[#161C30] border-[#252E4A] text-[#7FAADC]'
                      : 'bg-white border-[#D8CEBC] text-[#2E5E88]'
                  }`}
                >
                  {activeSlide.keyTakeaway}
                </div>
              </div>

              {/* Split Content: Left Bullets + Right Quantitative Proof / Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-7 flex flex-col justify-center space-y-3">
                  {(activeSlide.bullets || []).map((bullet, bIdx) => (
                    <div
                      key={bIdx}
                      className={`rounded-xl border px-4 py-3 text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 ${
                        slideIsNavy
                          ? 'bg-[#141A2E] border-[#252E4A] text-slate-200'
                          : 'bg-white border-[#D8CEBC] text-slate-800'
                      }`}
                    >
                      <span className="font-bold text-[#2E5E88] dark:text-[#7FAADC] shrink-0">
                        0{bIdx + 1}
                      </span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>

                <div
                  className={`lg:col-span-5 rounded-xl border p-5 flex flex-col justify-between ${
                    slideIsNavy
                      ? 'bg-[#141A2E] border-[#252E4A]'
                      : 'bg-white border-[#D8CEBC]'
                  }`}
                >
                  {activeSlide.layout === 'financials' ? (
                    <div className="space-y-3 h-full flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          5-year revenue &amp; net profit trajectory
                        </div>
                        <div className="text-xs font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC] mt-0.5 tabular-nums">
                          yr 5 net profit: {formatCompactCurrency(financialSeries.np[4] || 0)}
                        </div>
                      </div>
                      <div className="w-full h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={financialSeries.chartRows} margin={{ top: 6, right: 6, left: -12, bottom: 0 }}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={slideIsNavy ? '#252E4A' : '#ECE7DE'}
                            />
                            <XAxis
                              dataKey="year"
                              tick={{ fontSize: 10, fill: slideIsNavy ? '#94A3B8' : '#64748B' }}
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: slideIsNavy ? '#94A3B8' : '#64748B' }}
                              tickFormatter={(v) => formatCompactCurrency(Number(v), '')}
                            />
                            <Tooltip
                              formatter={(value: any) => formatCompactCurrency(Number(value || 0))}
                              contentStyle={{
                                backgroundColor: slideIsNavy ? '#101626' : '#FFFFFF',
                                borderColor: slideIsNavy ? '#252E4A' : '#D8CEBC',
                                fontSize: '11px',
                                borderRadius: '8px',
                              }}
                            />
                            <Bar dataKey="revenue" name="Revenue" fill="#2E5E88" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="netProfit" name="Net Profit" fill="#16A34A" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 my-auto">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {activeSlide.highlightMetric?.label || 'key highlight'}
                      </div>
                      <div
                        className={`text-2xl sm:text-3xl font-bold tabular-nums ${
                          slideIsNavy ? 'text-[#7FAADC]' : 'text-[#2E5E88]'
                        }`}
                      >
                        {activeSlide.highlightMetric?.value || '—'}
                      </div>
                      <p
                        className={`text-xs leading-relaxed ${
                          slideIsNavy ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {activeSlide.highlightMetric?.context}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Slide Navigation Footer */}
            <div
              className={`px-5 sm:px-8 py-3 border-t flex flex-wrap items-center justify-between gap-3 ${
                slideIsNavy ? 'border-[#222F4C] bg-[#161C30]' : 'border-[#D8CEBC] bg-[#F2EDE4]'
              }`}
            >
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {deck.slides.map((s, idx) => (
                  <button
                    key={s.slideNumber || idx}
                    type="button"
                    onClick={() => setActiveSlideIdx(idx)}
                    title={s.kicker}
                    className={`h-7 min-w-[28px] px-2 rounded-lg border text-[11px] font-bold tabular-nums transition-all cursor-pointer shrink-0 ${
                      idx === activeSlideIdx
                        ? 'bg-[#2E5E88] border-[#2E5E88] text-white'
                        : slideIsNavy
                        ? 'bg-[#101626] border-[#252E4A] text-slate-400 hover:text-white'
                        : 'bg-white border-[#D8CEBC] text-slate-600 hover:border-[#2E5E88]'
                    }`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveSlideIdx((p) => Math.max(0, p - 1))}
                  disabled={activeSlideIdx <= 0}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold lowercase cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                    slideIsNavy
                      ? 'bg-[#101626] border-[#252E4A] text-slate-200'
                      : 'bg-white border-[#D8CEBC] text-[#2E5E88]'
                  }`}
                >
                  <ChevronLeft size={14} />
                  <span>prev</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlideIdx((p) => Math.min(deck.slides.length - 1, p + 1))}
                  disabled={activeSlideIdx >= deck.slides.length - 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold lowercase cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                    slideIsNavy
                      ? 'bg-[#101626] border-[#252E4A] text-slate-200'
                      : 'bg-white border-[#D8CEBC] text-[#2E5E88]'
                  }`}
                >
                  <span>next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Inline Slide Editor (Zero Extra Token Cost) */}
          {isEditingSlide && !isFullscreen && (
            <div
              className={`rounded-2xl border p-5 space-y-4 ${
                isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-2xs'
              }`}
            >
              <div className="text-xs font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC]">
                edit slide {String(activeSlideIdx + 1).padStart(2, '0')} (no extra tokens)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    headline
                  </label>
                  <input
                    type="text"
                    value={activeSlide.title}
                    onChange={(e) => updateActiveSlide({ title: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none ${
                      isDark
                        ? 'bg-[#141A2E] border-[#252E4A] text-white'
                        : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    key metric value
                  </label>
                  <input
                    type="text"
                    value={activeSlide.highlightMetric?.value || ''}
                    onChange={(e) =>
                      updateActiveSlide({
                        highlightMetric: {
                          label: activeSlide.highlightMetric?.label || 'Key Metric',
                          value: e.target.value,
                          context: activeSlide.highlightMetric?.context || '',
                        },
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none ${
                      isDark
                        ? 'bg-[#141A2E] border-[#252E4A] text-white'
                        : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                    }`}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  key takeaway sentence
                </label>
                <input
                  type="text"
                  value={activeSlide.keyTakeaway}
                  onChange={(e) => updateActiveSlide({ keyTakeaway: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none ${
                    isDark
                      ? 'bg-[#141A2E] border-[#252E4A] text-white'
                      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                  }`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  slide bullets (one per line)
                </label>
                <textarea
                  rows={4}
                  value={(activeSlide.bullets || []).join('\n')}
                  onChange={(e) =>
                    updateActiveSlide({
                      bullets: e.target.value.split('\n').filter((line) => line.length > 0),
                    })
                  }
                  className={`w-full p-3 rounded-xl border text-xs font-mono focus:outline-none resize-y ${
                    isDark
                      ? 'bg-[#141A2E] border-[#252E4A] text-white'
                      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                  }`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  presenter speaker notes
                </label>
                <textarea
                  rows={2}
                  value={activeSlide.speakerNotes}
                  onChange={(e) => updateActiveSlide({ speakerNotes: e.target.value })}
                  className={`w-full p-3 rounded-xl border text-xs font-mono focus:outline-none resize-y ${
                    isDark
                      ? 'bg-[#141A2E] border-[#252E4A] text-white'
                      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Presenter Speaker Notes Panel */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 flex flex-wrap items-start justify-between gap-4 ${
              isFullscreen || isDark
                ? 'bg-[#101626] border-[#222F4C] text-slate-200'
                : 'bg-white border-[#D8CEBC] text-slate-700 shadow-2xs'
            }`}
          >
            <div className="space-y-1 flex-1 min-w-[240px]">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                speaker notes · {activeSlide.kicker}
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">{activeSlide.speakerNotes}</p>
            </div>
            <button
              type="button"
              onClick={handleCopySpeakerNotes}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold lowercase cursor-pointer shrink-0 whitespace-nowrap ${
                isFullscreen || isDark
                  ? 'bg-[#161C30] border-[#252E4A] text-slate-200 hover:border-[#5584B4]'
                  : 'bg-[#FAF8F5] border-[#D8CEBC] text-[#2E5E88] hover:border-[#2E5E88]'
              }`}
            >
              {copiedNotes ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copiedNotes ? 'copied' : 'copy speaker notes'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
