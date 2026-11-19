import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Smartphone,
  Maximize2,
  RotateCcw,
  Eraser,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  CalculatorId,
  CalculatorRowFormat,
  CALCULATOR_DEFINITIONS,
  getCalculatorMeta,
  getAllDefaultInputs,
  getDefaultInputsForCalculator,
  getZeroInputsForCalculator,
  computeCalculator,
  formatCalcValue,
  formatInputDisplay,
} from './calculatorDefinitions';
import {
  BomCalculatorWorkbook,
  createDefaultBomWorkbook,
  loadBomWorkbook,
  saveBomWorkbook,
  zeroBomProductValues,
} from './bomCalculatorState';
import { BomCalculatorView } from './BomCalculatorView';

export type { CalculatorId };

interface CalcNumberInputProps {
  id: string;
  value: string;
  format?: CalculatorRowFormat;
  onChange: (rawValue: string) => void;
  className: string;
}

const CalcNumberInput: React.FC<CalcNumberInputProps> = ({
  id,
  value,
  format,
  onChange,
  className,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const rawEditable = String(value ?? '').replace(/[,%]/g, '');
  const displayValue = isFocused
    ? rawEditable
    : formatInputDisplay(rawEditable, format);

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onFocus={(e) => {
        setIsFocused(true);
        const inputEl = e.currentTarget;
        requestAnimationFrame(() => {
          inputEl.select();
        });
      }}
      onBlur={() => {
        setIsFocused(false);
        const cleaned = rawEditable.trim();
        if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === '-.') {
          onChange('0');
        }
      }}
      onChange={(e) => {
        const nextRaw = e.target.value.replace(/[,%]/g, '');
        if (nextRaw === '' || /^-?\d*\.?\d*$/.test(nextRaw)) {
          onChange(nextRaw);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      className={className}
    />
  );
};

export interface BizzCalculatorsProps {
  theme?: 'light' | 'dark';
  onClose: () => void;
  initialCalculatorId?: string;
  onSelectCalculator?: (id: string) => void;
  embedded?: boolean;
}

type ActiveView = 'home' | CalculatorId;

const STORAGE_KEY = 'bizzcalculators_v1_authentic_state';

export const BizzCalculators: React.FC<BizzCalculatorsProps> = ({
  theme = 'light',
  onClose,
  initialCalculatorId = 'breakeven',
  onSelectCalculator,
  embedded = false,
}) => {
  const isDark = theme === 'dark';

  const normalizedInitial: ActiveView =
    initialCalculatorId === 'home'
      ? 'home'
      : CALCULATOR_DEFINITIONS.some((c) => c.id === initialCalculatorId)
      ? (initialCalculatorId as CalculatorId)
      : 'breakeven';

  const [activeView, setActiveView] = useState<ActiveView>(normalizedInitial);
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showGotoMenu, setShowGotoMenu] = useState<boolean>(false);
  const gotoContainerRef = useRef<HTMLDivElement | null>(null);
  const carouselTouchStartXRef = useRef<number | null>(null);

  const [inputsByCalc, setInputsByCalc] = useState<
    Record<CalculatorId, Record<string, string>>
  >(() => {
    const defaults = getAllDefaultInputs();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<
          Record<CalculatorId, Record<string, string>>
        >;
        CALCULATOR_DEFINITIONS.forEach((def) => {
          if (parsed[def.id] && typeof parsed[def.id] === 'object') {
            defaults[def.id] = {
              ...defaults[def.id],
              ...parsed[def.id],
            };
          }
        });
        if (defaults.depreciation?.depRate === '0.2') {
          defaults.depreciation.depRate = '20';
        }
      }
    } catch {
      // use clean defaults
    }
    return defaults;
  });

  const [bomWorkbook, setBomWorkbook] = useState<BomCalculatorWorkbook>(() =>
    loadBomWorkbook()
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputsByCalc));
    } catch {
      // ignore storage quota errors
    }
  }, [inputsByCalc]);

  useEffect(() => {
    saveBomWorkbook(bomWorkbook);
  }, [bomWorkbook]);

  useEffect(() => {
    if (!initialCalculatorId) return;
    if (initialCalculatorId === 'home') {
      setActiveView('home');
    } else if (CALCULATOR_DEFINITIONS.some((c) => c.id === initialCalculatorId)) {
      setActiveView(initialCalculatorId as CalculatorId);
    }
  }, [initialCalculatorId]);

  useEffect(() => {
    if (!showGotoMenu) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        gotoContainerRef.current &&
        !gotoContainerRef.current.contains(e.target as Node)
      ) {
        setShowGotoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showGotoMenu]);

  // Keyboard-safe outside click handling completed above

  const selectView = (view: ActiveView) => {
    setActiveView(view);
    setShowGotoMenu(false);
    if (view !== 'home' && onSelectCalculator) {
      onSelectCalculator(view);
    }
  };

  const activeDef = useMemo(() => {
    if (activeView === 'home') return CALCULATOR_DEFINITIONS[0];
    return getCalculatorMeta(activeView);
  }, [activeView]);

  const activeInputs = useMemo(() => {
    if (activeView === 'home') return {};
    return inputsByCalc[activeView] || getDefaultInputsForCalculator(activeView);
  }, [activeView, inputsByCalc]);

  const calculatedValues = useMemo(() => {
    if (activeView === 'home') return {};
    return computeCalculator(activeView, activeInputs);
  }, [activeView, activeInputs]);

  const handleInputChange = (fieldId: string, rawValue: string) => {
    if (activeView === 'home') return;
    setInputsByCalc((prev) => ({
      ...prev,
      [activeView]: {
        ...(prev[activeView] || getDefaultInputsForCalculator(activeView)),
        [fieldId]: rawValue,
      },
    }));
  };

  const handleResetActive = () => {
    if (activeView === 'home') {
      setInputsByCalc(getAllDefaultInputs());
      setBomWorkbook(createDefaultBomWorkbook());
      return;
    }
    if (activeView === 'bill-of-materials') {
      setBomWorkbook(createDefaultBomWorkbook());
      return;
    }
    setInputsByCalc((prev) => ({
      ...prev,
      [activeView]: getDefaultInputsForCalculator(activeView),
    }));
  };

  const handleClearActive = () => {
    if (activeView === 'home') return;
    if (activeView === 'bill-of-materials') {
      setBomWorkbook((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.id === prev.activeProductId ? zeroBomProductValues(p) : p
        ),
      }));
      return;
    }
    setInputsByCalc((prev) => ({
      ...prev,
      [activeView]: getZeroInputsForCalculator(activeView),
    }));
  };

  const handlePushBomToMarginMarkup = (modeledUnitCost: number) => {
    const safeCost = Number.isFinite(modeledUnitCost) ? modeledUnitCost : 0;
    setInputsByCalc((prev) => ({
      ...prev,
      'margin-markup': {
        ...(prev['margin-markup'] || getDefaultInputsForCalculator('margin-markup')),
        itemCost: safeCost.toFixed(2),
      },
    }));
    selectView('margin-markup');
  };

  const handlePushBomToBreakeven = (
    materialsUnitCost: number,
    productionUnitCost: number
  ) => {
    const safeMat = Number.isFinite(materialsUnitCost) ? Math.abs(materialsUnitCost) : 0;
    const safeProd = Number.isFinite(productionUnitCost)
      ? Math.abs(productionUnitCost)
      : 0;
    setInputsByCalc((prev) => ({
      ...prev,
      breakeven: {
        ...(prev.breakeven || getDefaultInputsForCalculator('breakeven')),
        unitMaterial: (-safeMat).toFixed(2),
        unitProduction: (-safeProd).toFixed(2),
      },
    }));
    selectView('breakeven');
  };

  const totalCalculators = CALCULATOR_DEFINITIONS.length;

  // Surface tokens aligned with BizzBean architectural palette
  const shellBg = isDark ? 'bg-[#0A0D14] text-[#E2E8F0]' : 'bg-[#FAF8F5] text-slate-800';
  const frameBg = isDark ? 'bg-[#101626]' : 'bg-[#FAF8F5]';
  const headerBg = isDark
    ? 'bg-[#0E1322] border-[#222F4C]'
    : 'bg-[#FAF8F5] border-[#D8CEBC]';
  const subheaderBg = isDark
    ? 'bg-[#141A2E] border-[#222F4C]'
    : 'bg-[#F2EDE4] border-[#D8CEBC]';
  const sheetCardBg = isDark
    ? 'bg-[#101626] border-[#222F4C]'
    : 'bg-white border-[#D8CEBC] shadow-xs';
  const sidebarBg = isDark
    ? 'bg-[#0E1322] border-[#222F4C]'
    : 'bg-[#F2EDE4]/70 border-[#D8CEBC]';
  const sectionBarBg = isDark
    ? 'bg-[#141A2E] text-slate-200 border-[#222F4C]'
    : 'bg-[#F2EDE4] text-slate-800 border-[#D8CEBC]';
  const rowBorder = isDark ? 'border-[#1C2540]' : 'border-[#EAE4D8]';
  const inputBg = isDark
    ? 'bg-[#101626] text-white border-[#252E4A] focus:border-[#5584B4]'
    : 'bg-white text-slate-900 border-[#D8CEBC] focus:border-[#2E5E88]';
  const calcBg = isDark
    ? 'bg-[#161C30] text-slate-200 border-[#252E4A]'
    : 'bg-[#F4EFE6] text-slate-900 border-[#D8CEBC]';
  const emphCalcBg = isDark
    ? 'bg-[#1B233D] text-white border-[#252E4A] font-bold'
    : 'bg-[#EFE7DA] text-slate-900 border-[#D8CEBC] font-bold';
  const fieldShapeClass =
    'w-full px-3 py-1.5 rounded-md border text-right text-xs font-mono tabular-nums leading-5 transition-colors';

  return (
    <div
      className={`w-full max-w-full min-w-0 ${embedded ? 'min-h-[680px]' : 'h-full min-h-0'} flex flex-col font-mono transition-colors select-none overflow-hidden ${shellBg}`}
    >
      {/* Frame container: full workstation width or compact 480px mobile device preview */}
      <div
        className={`w-full max-w-full min-w-0 mx-auto flex flex-col flex-1 min-h-0 ${
          embedded ? '' : 'h-full'
        } transition-all overflow-hidden ${
          isPhoneFrame
            ? 'max-w-[480px] my-auto max-h-[96dvh] rounded-3xl border border-[#D8CEBC] dark:border-[#252E4A] shadow-2xl'
            : 'max-w-6xl border-x border-transparent sm:border-[#E8E2D8] dark:sm:border-[#1B2238]'
        } ${frameBg}`}
      >
        {/* ================================================================= */}
        {/* 1. COMPACT SINGLE TOP HEADER BAR (No subheader strip above app)   */}
        {/* ================================================================= */}
        <header
          className={`px-3 sm:px-4 py-2.5 sm:py-3 border-b flex items-center justify-between gap-2 sm:gap-3 shrink-0 min-w-0 max-w-full ${headerBg}`}
        >
          {/* Left: BizzBean Brand Emblem + Home Index Toggle + Mobile Preview Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center shadow-2xs bg-white border border-[#D8CEBC] dark:border-[#222F4C]">
              <img
                src="/bizzbean-favicon.jpg"
                alt="bizzbean"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.triedPng) {
                    target.dataset.triedPng = 'true';
                    target.src = '/bizzbean-favicon.png';
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => selectView(activeView === 'home' ? 'breakeven' : 'home')}
              className={`inline-flex items-center gap-1.5 text-[11px] px-2 sm:px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap lowercase ${
                activeView === 'home'
                  ? 'bg-[#2E5E88] text-white border-[#2E5E88] font-bold'
                  : isDark
                  ? 'border-[#252E4A] text-slate-300 hover:text-white hover:border-[#5584B4]'
                  : 'border-[#D8CEBC] text-slate-600 hover:text-slate-900 bg-white'
              }`}
              title={`all ${totalCalculators} calculators index`}
              aria-label={`all ${totalCalculators} calculators index`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">home</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPhoneFrame((prev) => !prev)}
              className={`hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap lowercase ${
                isDark
                  ? 'border-[#252E4A] text-slate-400 hover:text-white'
                  : 'border-[#D8CEBC] text-slate-500 hover:text-slate-900 bg-white'
              }`}
              title={
                isPhoneFrame ? 'expand to workstation layout' : 'preview 480px mobile frame'
              }
            >
              {isPhoneFrame ? (
                <Maximize2 className="h-3.5 w-3.5" />
              ) : (
                <Smartphone className="h-3.5 w-3.5" />
              )}
              <span>{isPhoneFrame ? 'desktop' : 'mobile'}</span>
            </button>
          </div>

          {/* Center: Title & Active Context */}
          <div className="text-center flex flex-col items-center min-w-0">
            <h1 className="text-xs sm:text-sm font-bold lowercase tracking-tight text-slate-900 dark:text-white truncate max-w-full">
              {activeView === 'home' ? 'bizzcalculator directory' : activeDef.title}
            </h1>
            <div className="text-[10px] sm:text-[11px] font-normal text-slate-500 dark:text-slate-400 lowercase flex items-center justify-center gap-1 sm:gap-1.5 truncate max-w-full">
              <span className="hidden sm:inline">bizzcalculators</span>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span className="text-[#2E5E88] dark:text-[#5584B4] font-medium whitespace-nowrap">
                {activeView === 'home'
                  ? `${totalCalculators} financial models`
                  : `calc ${activeDef.num} of ${totalCalculators}`}
              </span>
            </div>
          </div>

          {/* Right: Help Bulb / Desktop Reset & Clear / Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              title="calculator guide & notes"
              aria-label="calculator guide"
              className={`h-7 w-7 sm:h-7.5 sm:w-7.5 shrink-0 rounded-lg flex items-center justify-center border transition-all p-1 cursor-pointer ${
                showHelpModal
                  ? 'bg-[#2E5E88] border-[#2E5E88] shadow-2xs ring-1 ring-[#2E5E88]'
                  : isDark
                  ? 'bg-[#101626] border-[#222F4C] hover:border-slate-500'
                  : 'bg-white border-[#D8CEBC] hover:border-[#2E5E88]/60 shadow-2xs'
              }`}
            >
              <img
                src="/help.jpg"
                alt="help"
                className="w-full h-full object-contain mix-blend-multiply dark:bg-white dark:rounded-xs dark:p-0.5"
              />
            </button>

            <button
              type="button"
              onClick={handleResetActive}
              className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer lowercase ${
                isDark
                  ? 'border-[#252E4A] text-slate-300 hover:text-white hover:border-[#5584B4]'
                  : 'border-[#D8CEBC] bg-white text-slate-600 hover:text-[#2E5E88] hover:border-[#2E5E88]'
              }`}
              title={
                activeView === 'home'
                  ? 'reset all calculators to defaults'
                  : 'reset current calculator to defaults'
              }
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>reset</span>
            </button>

            {activeView !== 'home' && (
              <button
                type="button"
                onClick={handleClearActive}
                className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer lowercase ${
                  isDark
                    ? 'border-[#252E4A] text-slate-300 hover:text-rose-300 hover:border-rose-500/50'
                    : 'border-[#D8CEBC] bg-white text-slate-600 hover:text-rose-600 hover:border-rose-400'
                }`}
                title="clear all editable fields to 0"
              >
                <Eraser className="h-3.5 w-3.5" />
                <span>clear</span>
              </button>
            )}

            {!embedded && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="exit bizzcalculators"
                aria-label="close bizzcalculators"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </header>

        {/* ================================================================= */}
        {/* 3. WORKSPACE BODY: DESKTOP SIDEBAR + AUTHENTIC CALCULATOR SHEET   */}
        {/* ================================================================= */}
        <div className="flex-1 flex min-h-0 min-w-0 max-w-full overflow-hidden">
          {/* Desktop Left Directory Rail (hidden in 480px mobile frame) */}
          {!isPhoneFrame && (
            <aside
              className={`hidden md:flex w-64 shrink-0 border-r flex-col overflow-y-auto p-3 gap-1 ${sidebarBg}`}
            >
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {totalCalculators} calculators
              </div>
              <button
                type="button"
                onClick={() => selectView('home')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs lowercase flex items-center justify-between transition-colors cursor-pointer border ${
                  activeView === 'home'
                    ? 'bg-[#2E5E88] text-white border-[#2E5E88] font-bold'
                    : isDark
                    ? 'bg-[#101626] text-slate-300 border-[#222F4C] hover:border-[#5584B4]'
                    : 'bg-white text-slate-700 border-[#D8CEBC] hover:border-[#2E5E88]'
                }`}
              >
                <span>home · index</span>
                <LayoutGrid className="h-3.5 w-3.5 shrink-0 opacity-75" />
              </button>

              <div className="h-px my-1 bg-[#D8CEBC]/70 dark:bg-[#222F4C]" />

              {CALCULATOR_DEFINITIONS.map((calc) => {
                const isActive = activeView === calc.id;
                return (
                  <button
                    key={calc.id}
                    type="button"
                    onClick={() => selectView(calc.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs lowercase flex items-center justify-between gap-2 transition-colors cursor-pointer border ${
                      isActive
                        ? 'bg-[#2E5E88] text-white border-[#2E5E88] font-bold'
                        : isDark
                        ? 'bg-transparent text-slate-300 border-transparent hover:bg-[#101626] hover:border-[#222F4C]'
                        : 'bg-transparent text-slate-700 border-transparent hover:bg-white hover:border-[#D8CEBC]'
                    }`}
                  >
                    <span className="truncate">
                      <span className="opacity-60 mr-1.5 tabular-nums">{calc.num}</span>
                      {calc.title}
                    </span>
                    {isActive && <ArrowRight className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
            </aside>
          )}

          {/* Main Scrollable Stage */}
          <main className="flex-1 min-w-0 max-w-full overflow-y-auto overflow-x-hidden p-3 sm:p-5">
            {activeView === 'home' ? (
              <div className="max-w-3xl mx-auto space-y-4">
                <div
                  className={`p-4 rounded-xl border ${sheetCardBg}`}
                >
                  <div className="text-xs font-bold lowercase text-slate-900 dark:text-white">
                    bizzcalculator financial workbench
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed lowercase">
                    select any calculator below to model unit economics, asset financing, project viability, return on net operating assets, and working capital dynamics. white fields accept user entries; light tan cells calculate live.
                  </p>
                </div>

                <div
                  className={`grid gap-2.5 ${
                    isPhoneFrame ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {CALCULATOR_DEFINITIONS.map((calc) => {
                    const inputCount = calc.sections.reduce(
                      (acc, s) => acc + s.rows.filter((r) => r.kind === 'input').length,
                      0
                    );
                    const outputCount = calc.sections.reduce(
                      (acc, s) => acc + s.rows.filter((r) => r.kind === 'calc').length,
                      0
                    );

                    return (
                      <button
                        key={calc.id}
                        type="button"
                        onClick={() => selectView(calc.id)}
                        className={`text-left p-4 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between gap-2.5 ${
                          isDark
                            ? 'bg-[#101626] border-[#222F4C] hover:border-[#5584B4]'
                            : 'bg-white border-[#D8CEBC] hover:border-[#2E5E88] shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-[10px] text-[#2E5E88] dark:text-[#7FB0DF] tabular-nums font-bold">
                              {calc.num} / {totalCalculators}
                            </div>
                            <h2 className="text-sm font-bold lowercase text-slate-900 dark:text-white mt-0.5 group-hover:text-[#2E5E88] dark:group-hover:text-[#7FB0DF] transition-colors">
                              {calc.title}
                            </h2>
                          </div>
                          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#2E5E88] dark:group-hover:text-[#7FB0DF] transition-transform group-hover:translate-x-0.5 shrink-0 mt-1" />
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {calc.description}
                        </p>

                        <div className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums pt-2 border-t border-[#EAE4D8] dark:border-[#1E2945] flex items-center justify-between">
                          {calc.id === 'bill-of-materials' ? (
                            <>
                              <span>4 modules</span>
                              <span>multi-product costing</span>
                            </>
                          ) : (
                            <>
                              <span>{calc.sections.length} sections</span>
                              <span>
                                {inputCount} inputs · {outputCount} outputs
                              </span>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : activeView === 'bill-of-materials' ? (
              <div
                className={`mx-auto min-w-0 max-w-full ${
                  isPhoneFrame ? 'w-full' : 'max-w-5xl'
                }`}
              >
                <BomCalculatorView
                  workbook={bomWorkbook}
                  onChangeWorkbook={setBomWorkbook}
                  isDark={isDark}
                  isPhoneFrame={isPhoneFrame}
                  onPushToMarginMarkup={handlePushBomToMarginMarkup}
                  onPushToBreakeven={handlePushBomToBreakeven}
                />
              </div>
            ) : (
              /* Centered Calculator Worksheet matching V1 480px mobile width & 60/40 row geometry */
              <div
                className={`mx-auto min-w-0 max-w-full ${
                  isPhoneFrame ? 'w-full' : 'max-w-[540px]'
                }`}
              >
                <div className={`rounded-xl border overflow-hidden min-w-0 max-w-full ${sheetCardBg}`}>
                  {/* Subtle context strip above sections */}
                  <div
                    className={`px-3 sm:px-4 py-2.5 border-b flex items-center justify-between gap-2 sm:gap-3 text-[11px] min-w-0 ${
                      isDark
                        ? 'bg-[#0E1322] border-[#222F4C] text-slate-400'
                        : 'bg-[#FAF8F5] border-[#EAE4D8] text-slate-500'
                    }`}
                  >
                    <span className="truncate min-w-0 flex-1">{activeDef.description}</span>
                    <div className="flex items-center gap-2 shrink-0 text-[10px]">
                      <span className="inline-flex items-center gap-1">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-xs border ${
                            isDark
                              ? 'bg-[#101626] border-[#252E4A]'
                              : 'bg-white border-[#D8CEBC]'
                          }`}
                        />
                        <span>entry</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-xs border ${
                            isDark
                              ? 'bg-[#161C30] border-[#252E4A]'
                              : 'bg-[#F4EFE6] border-[#D8CEBC]'
                          }`}
                        />
                        <span>calc</span>
                      </span>
                    </div>
                  </div>

                  {/* Sections & 60% / 40% Calculator Rows */}
                  <div className="divide-y divide-[#EAE4D8] dark:divide-[#1C2540]">
                    {activeDef.sections.map((section) => (
                      <section key={section.title}>
                        <div
                          className={`px-3 sm:px-4 py-2 text-[11px] font-bold lowercase tracking-wide border-b ${sectionBarBg}`}
                        >
                          {section.title}
                        </div>

                        <div className={`divide-y ${rowBorder}`}>
                          {section.rows.map((row) => {
                            const isInput = row.kind === 'input';
                            const inputValue = activeInputs[row.id] ?? row.defaultValue ?? '0';
                            const calcVal = calculatedValues[row.id] ?? 0;

                            return (
                              <div
                                key={row.id}
                                className="flex items-center justify-between gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 text-xs min-w-0"
                              >
                                <label
                                  htmlFor={
                                    isInput ? `calc-input-${activeDef.id}-${row.id}` : undefined
                                  }
                                  className={`flex-1 min-w-0 pr-1 leading-snug lowercase break-words ${
                                    row.emphasize
                                      ? 'font-bold text-slate-900 dark:text-white'
                                      : isInput
                                      ? 'text-slate-700 dark:text-slate-200'
                                      : 'text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  {row.label}
                                </label>

                                <div className="w-[42%] sm:w-[40%] max-w-[175px] shrink-0">
                                  {isInput ? (
                                    <CalcNumberInput
                                      id={`calc-input-${activeDef.id}-${row.id}`}
                                      value={inputValue}
                                      format={row.format}
                                      onChange={(nextVal) =>
                                        handleInputChange(row.id, nextVal)
                                      }
                                      className={`${fieldShapeClass} focus:outline-none ${inputBg}`}
                                    />
                                  ) : (
                                    <div
                                      aria-readonly="true"
                                      className={`${fieldShapeClass} select-text ${
                                        row.emphasize ? emphCalcBg : calcBg
                                      }`}
                                    >
                                      {formatCalcValue(calcVal, row.format)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* ================================================================= */}
        {/* 3. FIXED BOTTOM NAVIGATION HOUSING: MOBILE CAROUSEL + GO TO / RESET / CLEAR */}
        {/* ================================================================= */}
        <footer
          className={`border-t flex flex-col shrink-0 ${subheaderBg}`}
        >
          {/* Single-Item Swipeable Calculator Carousel fixed at bottom on mobile / phone-frame */}
          {(() => {
            const carouselViews: ActiveView[] = [
              'home',
              ...CALCULATOR_DEFINITIONS.map((c) => c.id),
            ];
            const currentIdx = Math.max(0, carouselViews.indexOf(activeView));
            const handlePrevCalc = () =>
              selectView(
                carouselViews[
                  (currentIdx - 1 + carouselViews.length) % carouselViews.length
                ]
              );
            const handleNextCalc = () =>
              selectView(carouselViews[(currentIdx + 1) % carouselViews.length]);

            return (
              <div
                onTouchStart={(e) => {
                  carouselTouchStartXRef.current = e.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(e) => {
                  if (carouselTouchStartXRef.current === null) return;
                  const delta =
                    (e.changedTouches[0]?.clientX ?? 0) - carouselTouchStartXRef.current;
                  carouselTouchStartXRef.current = null;
                  if (Math.abs(delta) > 36) {
                    if (delta > 0) handlePrevCalc();
                    else handleNextCalc();
                  }
                }}
                className={`${
                  isPhoneFrame ? 'flex' : 'flex md:hidden'
                } items-center justify-between gap-2 px-2 py-1.5 border-b min-w-0 max-w-full ${
                  isDark ? 'border-[#222F4C] bg-[#0E1322]/90' : 'border-[#D8CEBC] bg-[#FAF8F5]'
                }`}
              >
                <button
                  type="button"
                  onClick={handlePrevCalc}
                  className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white shrink-0 cursor-pointer"
                  aria-label="Previous calculator"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex-1 min-w-0 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowGotoMenu((prev) => !prev)}
                    className="max-w-full py-1.5 px-3.5 rounded-lg text-[11px] text-center transition-all lowercase whitespace-nowrap border cursor-pointer inline-flex items-center justify-center gap-1.5 bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs font-bold truncate"
                    title="Tap to open calculator index menu"
                  >
                    {activeView === 'home' ? (
                      <>
                        <LayoutGrid className="h-3 w-3 shrink-0" />
                        <span className="truncate">home · {totalCalculators} calculators</span>
                      </>
                    ) : (
                      <span className="truncate">
                        {activeDef.num}. {activeDef.shortLabel}
                      </span>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleNextCalc}
                  className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white shrink-0 cursor-pointer"
                  aria-label="Next calculator"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            );
          })()}

          {/* Unified Drop-Up GO TO Menu + RESET / CLEAR Control Row (Mobile & Desktop) */}
          <div className="px-3 sm:px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-2">
            {/* GO TO selector drop-up */}
            <div className="relative" ref={gotoContainerRef}>
              <button
                type="button"
                onClick={() => setShowGotoMenu((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide cursor-pointer transition-colors ${
                  showGotoMenu
                    ? 'bg-[#2E5E88] text-white border-[#2E5E88]'
                    : isDark
                    ? 'bg-[#101626] text-slate-200 border-[#252E4A] hover:border-[#5584B4]'
                    : 'bg-white text-slate-800 border-[#D8CEBC] hover:border-[#2E5E88]'
                }`}
              >
                <span>GO TO</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    showGotoMenu ? '' : 'rotate-180'
                  }`}
                />
              </button>

              {showGotoMenu && (
                <div
                  className={`absolute bottom-full left-0 mb-2 w-64 max-h-80 overflow-y-auto rounded-xl border shadow-xl z-40 py-1 ${
                    isDark
                      ? 'bg-[#101626] border-[#252E4A] text-slate-200'
                      : 'bg-white border-[#D8CEBC] text-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectView('home')}
                    className={`w-full text-left px-3 py-2 text-xs lowercase flex items-center justify-between transition-colors cursor-pointer ${
                      activeView === 'home'
                        ? 'bg-[#2E5E88] text-white font-bold'
                        : 'hover:bg-[#F2EDE4] dark:hover:bg-[#1A243D]'
                    }`}
                  >
                    <span>home · index</span>
                    {activeView === 'home' && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <div className="h-px my-0.5 bg-[#EAE4D8] dark:bg-[#222F4C]" />
                  {CALCULATOR_DEFINITIONS.map((calc) => {
                    const selected = activeView === calc.id;
                    return (
                      <button
                        key={calc.id}
                        type="button"
                        onClick={() => selectView(calc.id)}
                        className={`w-full text-left px-3 py-2 text-xs lowercase flex items-center justify-between transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#2E5E88] text-white font-bold'
                            : 'hover:bg-[#F2EDE4] dark:hover:bg-[#1A243D]'
                        }`}
                      >
                        <span className="truncate">
                          <span className="opacity-60 mr-1.5 tabular-nums">{calc.num}</span>
                          {calc.title}
                        </span>
                        {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetActive}
                className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#101626] text-slate-200 border-[#252E4A] hover:border-[#5584B4]'
                    : 'bg-white text-slate-800 border-[#D8CEBC] hover:border-[#2E5E88]'
                }`}
              >
                RESET
              </button>
              <button
                type="button"
                onClick={handleClearActive}
                disabled={activeView === 'home'}
                className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide transition-colors ${
                  activeView === 'home'
                    ? 'opacity-40 cursor-not-allowed bg-transparent border-[#D8CEBC] dark:border-[#222F4C] text-slate-400'
                    : isDark
                    ? 'bg-[#101626] text-rose-300 border-[#252E4A] hover:border-rose-500/60 cursor-pointer'
                    : 'bg-white text-rose-600 border-[#D8CEBC] hover:border-rose-400 cursor-pointer'
                }`}
              >
                CLEAR
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* ================================================================= */}
      {/* 5. CALCULATOR HELP / DESCRIPTION MODAL                            */}
      {/* ================================================================= */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl space-y-4 ${
              isDark
                ? 'bg-[#101626] border-[#252E4A] text-slate-200'
                : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-800'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#D8CEBC] dark:border-[#222F4C]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-white border border-[#D8CEBC] p-1 flex items-center justify-center shrink-0">
                  <img
                    src="/help.jpg"
                    alt="help"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold lowercase text-slate-900 dark:text-white">
                    {activeView === 'home'
                      ? 'bizzcalculator guide'
                      : activeDef.title}
                  </h3>
                  <div className="text-[11px] text-[#2E5E88] dark:text-[#7FB0DF] lowercase">
                    bizzcalculators · reference note
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                aria-label="close guide"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {activeView === 'home'
                ? `Select any of the ${totalCalculators} specialized business calculators from the home grid or GO TO menu.`
                : activeDef.description}
            </p>

            <div
              className={`p-3 rounded-xl border text-[11px] space-y-1.5 leading-relaxed ${
                isDark
                  ? 'bg-[#0E1322] border-[#222F4C] text-slate-400'
                  : 'bg-white border-[#D8CEBC] text-slate-600'
              }`}
            >
              {activeView === 'bill-of-materials' ? (
                <>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">product cost book:</span>{' '}
                    maintain multiple products (e.g. food truck menu items) on your phone — every change saves automatically.
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">4-module flow:</span>{' '}
                    enter ingredients (bom), multi-level packaging, and variable costs to calculate your modeled unit cost, then send it straight to margin vs markup or breakeven point.
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">white entry fields:</span>{' '}
                    enter positive or negative numbers matching the row hint (for example{' '}
                    <code className="text-[#2E5E88] dark:text-[#7FB0DF]">("-")</code> denotes negative expense/liability entries). light tan cells calculate live.
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">reset / clear:</span>{' '}
                    RESET restores reference scenario numbers; CLEAR zeroes every entry field for fresh data input.
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#2E5E88] text-white text-xs font-bold lowercase hover:bg-[#23496B] transition-colors cursor-pointer"
              >
                close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BizzCalculators;
