import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Sliders,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Percent,
  DollarSign,
  Volume2,
  Info,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { AssumptionRateItem } from '../types';
import { interpretVoiceCommand, playChime } from '../utils/voiceInterpreter';

interface BaseRateAdjustmentToolProps {
  theme?: 'light' | 'dark';
  item: AssumptionRateItem;
  onUpdateMonthlyValues: (itemId: string, updatedValues: number[]) => void;
  onUpdateBaseRate?: (itemId: string, newBaseRate: number) => void;
  onChangeTypeToggle?: (itemId: string, newType: 'percentage' | 'value') => void;
  onClose?: () => void;
}

export const BaseRateAdjustmentTool: React.FC<BaseRateAdjustmentToolProps> = ({
  theme = 'light',
  item,
  onUpdateMonthlyValues,
  onUpdateBaseRate,
  onChangeTypeToggle,
  onClose,
}) => {
  const isDark = theme === 'dark';

  // 1. Year Slider State (1 to 5)
  const [activeYear, setActiveYear] = useState<number>(1);

  // 2. Change Type: 'percentage' | 'value'
  const [changeType, setChangeType] = useState<'percentage' | 'value'>(item.changeType || 'percentage');

  // 3. Cascade to subsequent months toggle:
  // When a rate changes (e.g. +1.00%), subsequent months inherit the rate (e.g. 10% + 1% = 11% for following months)
  const [cascadeToSubsequentMonths, setCascadeToSubsequentMonths] = useState<boolean>(true);

  // 4. Voice Prompt State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [showVoiceHelp, setShowVoiceHelp] = useState<boolean>(false);
  const [showFormulaExplanation, setShowFormulaExplanation] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Ensure 60 months of values exist: effectiveRate = baseRate + changeRate
  const monthlyValues = React.useMemo(() => {
    if (item.monthlyValues && item.monthlyValues.length === 60) {
      return item.monthlyValues;
    }
    const arr = new Array(60).fill(item.baseRate);
    if (item.monthlyValues) {
      item.monthlyValues.forEach((v, idx) => {
        if (idx < 60) arr[idx] = v;
      });
    }
    return arr;
  }, [item.monthlyValues, item.baseRate]);

  // Determine months for active year (12 months per year)
  // Year 1: Months 1 to 12 (indices 0 to 11)
  // Year 2: Months 13 to 24 (indices 12 to 23), etc.
  const startMonthIndex = (activeYear - 1) * 12;

  const currentYearMonths = Array.from({ length: 12 }, (_, i) => {
    const idx = startMonthIndex + i;
    const effectiveValue = monthlyValues[idx] ?? item.baseRate;
    // Formula: changeRate = effectiveRate - baseRate
    const changeRate = Number((effectiveValue - item.baseRate).toFixed(4));
    return {
      relativeMonth: i + 1,
      absoluteMonth: idx + 1,
      index: idx,
      effectiveValue,
      changeRate,
      isModified: Math.abs(changeRate) > 0.0001,
    };
  });

  // Handler: When user edits the CHANGE RATE (Δ) directly
  // Formula: resulting rate = (base + change rate)
  // Negative changes are fully allowed: e.g. -1.00% => base 10% + (-1%) = 9%
  const handleDeltaChange = (index: number, rawVal: string) => {
    const delta = parseFloat(rawVal);
    const validDelta = isNaN(delta) ? 0 : delta;
    const newEffectiveRate = Number((item.baseRate + validDelta).toFixed(4));

    const updated = [...monthlyValues];
    if (cascadeToSubsequentMonths) {
      for (let i = index; i < 60; i++) {
        updated[i] = newEffectiveRate;
      }
    } else {
      updated[index] = newEffectiveRate;
    }
    onUpdateMonthlyValues(item.id, updated);
  };

  // Handler: When user edits the RESULTING RATE directly
  // Automatically derives changeRate = newRate - baseRate
  const handleEffectiveRateChange = (index: number, rawVal: string) => {
    const rate = parseFloat(rawVal);
    const validRate = isNaN(rate) ? item.baseRate : rate;

    const updated = [...monthlyValues];
    if (cascadeToSubsequentMonths) {
      for (let i = index; i < 60; i++) {
        updated[i] = validRate;
      }
    } else {
      updated[index] = validRate;
    }
    onUpdateMonthlyValues(item.id, updated);
  };

  // Quick Action: Apply relative delta to entire active year or all following months
  const handleApplyQuickDelta = (delta: number) => {
    const updated = [...monthlyValues];
    const targetRate = Number((item.baseRate + delta).toFixed(4));
    const startIdx = cascadeToSubsequentMonths ? startMonthIndex : startMonthIndex;
    const endIdx = cascadeToSubsequentMonths ? 60 : startMonthIndex + 12;

    for (let i = startIdx; i < endIdx; i++) {
      updated[i] = targetRate;
    }
    onUpdateMonthlyValues(item.id, updated);
    playChime(true);
    setVoiceFeedback(
      `Applied ${delta >= 0 ? '+' : ''}${delta.toFixed(2)}${item.unit === '%' ? '%' : ''} change rate → Rate: ${targetRate.toFixed(2)}% ${
        cascadeToSubsequentMonths ? `(Months ${startIdx + 1}–60)` : `(Year ${activeYear})`
      }`
    );
  };

  // Quick Action: Reset entire item back to baseRate (0.00% change rate)
  const handleResetItem = () => {
    const updated = new Array(60).fill(item.baseRate);
    onUpdateMonthlyValues(item.id, updated);
    playChime(true);
    setVoiceFeedback(`Reset all 60 months to base rate (${item.baseRate.toFixed(2)}${item.unit === '%' ? '%' : ''})`);
  };

  // Toggle Percentage vs Value
  const handleToggleChangeType = (type: 'percentage' | 'value') => {
    setChangeType(type);
    if (onChangeTypeToggle) {
      onChangeTypeToggle(item.id, type);
    }
  };

  // Voice Recognition setup
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceFeedback('Listening... Say e.g. "increase by 1%", "decrease by 0.5%", or "set month 3 to 11%"');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(`"${transcript}"`);
        handleExecuteVoiceText(transcript);
      };

      recognition.onerror = (e: any) => {
        setIsListening(false);
        playChime(false);
        setVoiceFeedback(`Voice recognition error: ${e.error || 'could not capture speech'}`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [activeYear, item.baseRate, monthlyValues, cascadeToSubsequentMonths]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setShowVoiceHelp(true);
      setVoiceFeedback('Speech recognition not directly supported by browser. Try clicking the quick voice prompt chips below!');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        setVoiceFeedback('Microphone permission needed or already active.');
      }
    }
  };

  // Execute voice string (from real speech or simulated prompt chips)
  const handleExecuteVoiceText = (text: string) => {
    const res = interpretVoiceCommand(text, activeYear, item.baseRate, monthlyValues);
    if (res) {
      onUpdateMonthlyValues(item.id, res.updatedValues);
      playChime(true);
      setVoiceFeedback(res.result.feedbackMessage);
      setVoiceTranscript(`"${text}"`);
    } else {
      playChime(false);
      setVoiceFeedback(`Could not understand "${text}". Try: "increase by 1%" or "set month 4 to 11%"`);
    }
  };

  // Calculate modifications count (where changeRate != 0)
  const modifiedCount = monthlyValues.filter((v) => Math.abs(v - item.baseRate) > 0.0001).length;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-md font-mono ${
        isDark ? 'bg-[#0E1424] border-[#2E5E88]/60 text-slate-100' : 'bg-white border-[#2E5E88]/50 text-slate-900'
      }`}
    >
      {/* ===================================================================== */}
      {/* 1. TOOL HEADER BAR: ITEM BEING CHANGED + BASE RATE + FORMULA STATUS    */}
      {/* ===================================================================== */}
      <div
        className={`px-4 sm:px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#121A2F] border-[#222F4C]' : 'bg-[#F4EFE6] border-[#D8CEBC]'
        }`}
      >
        {/* Left: Item being changed badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            ITEM BEING CHANGED:
          </span>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#2E5E88] text-white shadow-xs lowercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{item.name}</span>
            </span>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>base rate:</span>
              {onUpdateBaseRate ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={item.baseRate}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) {
                        onUpdateBaseRate(item.id, v);
                      }
                    }}
                    className="w-18 px-1.5 py-0.5 rounded-lg border text-xs font-bold text-[#2E5E88] dark:text-[#5584B4] bg-white dark:bg-[#0E1424] border-slate-300 dark:border-slate-700 text-center"
                    title="Change base rate"
                  />
                  <span className="font-bold text-slate-400">{item.unit === '%' ? '%' : ''}</span>
                </div>
              ) : (
                <strong className="text-[#2E5E88] dark:text-[#5584B4]">
                  {item.baseRate.toFixed(2)}{item.unit === '%' ? '%' : ''}
                </strong>
              )}
            </div>

            {modifiedCount > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 font-bold">
                {modifiedCount} dynamic {modifiedCount === 1 ? 'override' : 'overrides'}
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-bold">
                flat baseline
              </span>
            )}
          </div>
        </div>

        {/* Right: Cascade Toggle + Mic + Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Subsequent Months Cascade Toggle */}
          <button
            type="button"
            onClick={() => setCascadeToSubsequentMonths(!cascadeToSubsequentMonths)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              cascadeToSubsequentMonths
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
            }`}
            title="When active: setting Month X carries forward to following months (Mx → M60)"
          >
            <ArrowRight className="h-3 w-3" />
            <span className="text-[11px] lowercase">
              {cascadeToSubsequentMonths ? 'cascade forward active' : 'single month mode'}
            </span>
          </button>

          {/* Voice Prompt Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs ${
              isListening
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                : 'bg-[#2E5E88]/10 hover:bg-[#2E5E88]/20 border-[#2E5E88]/30 text-[#2E5E88] dark:text-[#5584B4]'
            }`}
            title="Speak a change: e.g. 'increase by 1%' or 'set month 3 to 11%'"
          >
            {isListening ? <Mic className="h-3.5 w-3.5 animate-bounce" /> : <Mic className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isListening ? 'listening...' : 'voice prompt'}</span>
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetItem}
            className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset all 60 months to base rate (0.00% change)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* FORMULA CALLOUT BANNER: Rate = (base + change rate)                   */}
      {/* ===================================================================== */}
      {showFormulaExplanation && (
        <div className="px-4 py-2 border-b bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-700 dark:text-emerald-300 lowercase flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>formula: rate = (base + change rate)</span>
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-sans">
                e.g. base {item.baseRate.toFixed(2)}% + change 1.00% = {(item.baseRate + 1).toFixed(2)}% · negative changes allowed: base {item.baseRate.toFixed(2)}% + change (-1.00%) = {(item.baseRate - 1).toFixed(2)}%
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
              additive calculation active
            </span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VOICE ASSISTANT / FEEDBACK BANNER (IF ACTIVE)                          */}
      {/* ===================================================================== */}
      {(voiceFeedback || isListening) && (
        <div
          className={`px-4 sm:px-5 py-2.5 border-b text-xs flex flex-wrap items-center justify-between gap-2 ${
            isListening
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
              : 'bg-blue-500/10 border-blue-500/20 text-[#2E5E88] dark:text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 shrink-0" />
            <span className="font-bold">{voiceFeedback || 'Voice control active'}</span>
            {voiceTranscript && (
              <span className="italic text-slate-500 dark:text-slate-400">{voiceTranscript}</span>
            )}
          </div>

          {/* Quick test prompt chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Try prompt:</span>
            {[
              `increase by 1%`,
              `decrease by 1%`,
              `set month ${startMonthIndex + 2} to ${(item.baseRate + 1).toFixed(1)}%`,
              'reset to base',
            ].map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleExecuteVoiceText(prompt)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-[#2E5E88] text-slate-700 dark:text-slate-300 transition-colors"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. YEAR 1 – 5 SLIDER (PROMINENTLY FEATURED ABOVE MONTH MATRIX)          */}
      {/* ===================================================================== */}
      <div className="p-4 sm:p-5 border-b space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
            <span className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200">
              5-YEAR HORIZON · YEAR {activeYear} (MONTHS {startMonthIndex + 1}–{startMonthIndex + 12})
            </span>
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setActiveYear(yr)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  activeYear === yr
                    ? 'bg-[#2E5E88] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-[#161F38] text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                year {yr}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Year Range Slider */}
        <div className="relative pt-1 pb-1">
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={activeYear}
            onChange={(e) => setActiveYear(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#2E5E88]"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-bold">
            <span>Year 1 (M1–M12)</span>
            <span>Year 2 (M13–M24)</span>
            <span>Year 3 (M25–M36)</span>
            <span>Year 4 (M37–M48)</span>
            <span>Year 5 (M49–M60)</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. 12-MONTH RATE & DELTA GRID (Rate = Base + Change Rate)              */}
      {/* ===================================================================== */}
      <div className="p-4 sm:p-5 overflow-x-auto">
        <table className="w-full border-collapse text-center">
          <thead>
            {/* ROW 1: YEAR NUMBER (MONTH 1 - 12) */}
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="py-2.5 px-3 text-left text-xs font-bold uppercase text-slate-400 w-44 whitespace-nowrap">
                year number
              </th>
              {currentYearMonths.map((m) => (
                <th key={m.index} className="py-2.5 px-1 sm:px-1.5 min-w-[62px]">
                  <div className="p-1 rounded-lg bg-slate-100 dark:bg-[#161F38] border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                      {m.relativeMonth}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-normal">
                      M{m.absoluteMonth}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* ROW 2: CHANGE RATE (Δ) - NEGATIVE & POSITIVE ALLOWED */}
            <tr className="border-b border-slate-100 dark:border-slate-800/60">
              <td className="py-3 px-3 text-left text-xs font-bold uppercase text-slate-500 whitespace-nowrap">
                <div>
                  <span className="text-[#2E5E88] dark:text-[#5584B4] block">change rate (Δ)</span>
                  <span className="text-[9px] font-normal text-slate-400 lowercase block font-sans">
                    + / - {item.unit === '%' ? '%' : 'value'} vs base
                  </span>
                </div>
              </td>
              {currentYearMonths.map((m) => (
                <td key={m.index} className="py-2.5 px-1 sm:px-1.5">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={m.changeRate === 0 ? '' : m.changeRate}
                      placeholder="0.00"
                      onChange={(e) => handleDeltaChange(m.index, e.target.value)}
                      className={`w-full py-1.5 px-1 rounded-lg text-xs font-bold text-center border transition-all ${
                        m.isModified
                          ? m.changeRate > 0
                            ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30'
                            : 'bg-indigo-500/15 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/30'
                          : isDark
                          ? 'bg-[#121A2F] border-[#222F4C] text-slate-400 focus:border-[#2E5E88]'
                          : 'bg-white border-[#D8CEBC] text-slate-400 focus:border-[#2E5E88]'
                      }`}
                      title={`Change rate for Month ${m.absoluteMonth}: Enter positive or negative (e.g. +1.00 or -1.00)`}
                    />
                    <span className="absolute right-1 top-2 text-[9px] text-slate-400 pointer-events-none hidden sm:inline">
                      %
                    </span>
                  </div>
                </td>
              ))}
            </tr>

            {/* ROW 3: RESULTING RATE = (BASE + CHANGE RATE) */}
            <tr>
              <td className="py-3 px-3 text-left text-xs font-bold uppercase text-slate-700 dark:text-slate-200 whitespace-nowrap">
                <div>
                  <span className="text-slate-900 dark:text-white font-bold block">
                    rate = (base + change)
                  </span>
                  <span className="text-[9px] font-normal text-slate-400 lowercase block font-sans">
                    effective monthly rate
                  </span>
                </div>
              </td>
              {currentYearMonths.map((m) => (
                <td key={m.index} className="py-2.5 px-1 sm:px-1.5">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={m.effectiveValue}
                      onChange={(e) => handleEffectiveRateChange(m.index, e.target.value)}
                      className={`w-full py-1.5 px-1 rounded-lg text-xs font-bold text-center border transition-all ${
                        m.isModified
                          ? 'bg-[#2E5E88]/15 border-[#2E5E88] text-[#2E5E88] dark:text-[#5584B4] ring-1 ring-[#2E5E88]/40'
                          : isDark
                          ? 'bg-[#121A2F] border-[#222F4C] text-slate-200'
                          : 'bg-white border-[#D8CEBC] text-slate-800'
                      }`}
                      title={`Resulting rate for Month ${m.absoluteMonth} = Base (${item.baseRate}%) + Change (${m.changeRate}%)`}
                    />
                    <span className="absolute right-1 top-2 text-[9px] text-slate-400 pointer-events-none hidden sm:inline">
                      %
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Bottom Helper Bar for Quick Delta Adjustments */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-[11px] uppercase font-bold mr-1">
              Quick change rate:
            </span>
            <button
              type="button"
              onClick={() => handleApplyQuickDelta(1.0)}
              className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20 transition-colors flex items-center gap-0.5"
            >
              <TrendingUp className="h-3 w-3" />
              <span>+1.00%</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyQuickDelta(0.5)}
              className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20 transition-colors flex items-center gap-0.5"
            >
              <TrendingUp className="h-3 w-3" />
              <span>+0.50%</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyQuickDelta(-1.0)}
              className="px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] border border-indigo-500/20 transition-colors flex items-center gap-0.5"
            >
              <TrendingDown className="h-3 w-3" />
              <span>-1.00%</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyQuickDelta(-0.5)}
              className="px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] border border-indigo-500/20 transition-colors flex items-center gap-0.5"
            >
              <TrendingDown className="h-3 w-3" />
              <span>-0.50%</span>
            </button>
            <button
              type="button"
              onClick={handleResetItem}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 font-bold text-[11px] transition-colors"
            >
              Reset to Base (0.00%)
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Cascade forward: {cascadeToSubsequentMonths ? 'Enabled (subsequent months follow)' : 'Disabled'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaseRateAdjustmentTool;
