import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sliders,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Percent,
  DollarSign,
  ChevronRight,
  Info,
  Volume2,
} from 'lucide-react';
import { AssumptionRateItem } from '../types';
import { interpretVoiceCommand, playChime } from '../utils/voiceInterpreter';

interface BaseRateAdjustmentToolProps {
  theme?: 'light' | 'dark';
  item: AssumptionRateItem;
  onUpdateMonthlyValues: (itemId: string, updatedValues: number[]) => void;
  onChangeTypeToggle?: (itemId: string, newType: 'percentage' | 'value') => void;
  onClose?: () => void;
}

export const BaseRateAdjustmentTool: React.FC<BaseRateAdjustmentToolProps> = ({
  theme = 'light',
  item,
  onUpdateMonthlyValues,
  onChangeTypeToggle,
  onClose,
}) => {
  const isDark = theme === 'dark';

  // 1. Year Slider State (1 to 5)
  const [activeYear, setActiveYear] = useState<number>(1);

  // 2. Change Type: 'percentage' | 'value'
  const [changeType, setChangeType] = useState<'percentage' | 'value'>(item.changeType || 'percentage');

  // 3. Voice Prompt State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [showVoiceHelp, setShowVoiceHelp] = useState<boolean>(false);
  const [showV1Comparison, setShowV1Comparison] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Ensure 60 months of values exist
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
  const currentYearMonths = Array.from({ length: 12 }, (_, i) => ({
    relativeMonth: i + 1,
    absoluteMonth: startMonthIndex + i + 1,
    index: startMonthIndex + i,
    value: monthlyValues[startMonthIndex + i] ?? item.baseRate,
  }));

  // Update a single month value
  const handleMonthValueChange = (index: number, rawVal: string) => {
    const val = parseFloat(rawVal);
    const updated = [...monthlyValues];
    updated[index] = isNaN(val) ? 0 : val;
    onUpdateMonthlyValues(item.id, updated);
  };

  // Quick action: Fill entire active year with a value
  const handleFillYear = (val: number) => {
    const updated = [...monthlyValues];
    for (let i = 0; i < 12; i++) {
      updated[startMonthIndex + i] = val;
    }
    onUpdateMonthlyValues(item.id, updated);
    playChime(true);
    setVoiceFeedback(`Applied ${val.toFixed(2)}${changeType === 'percentage' ? '%' : ''} to Year ${activeYear}`);
  };

  // Quick action: Reset entire item back to baseRate
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
        setVoiceFeedback('Listening... Say e.g. "set month 3 to 5%" or "year 2 to 6%"');
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
  }, [activeYear, item.baseRate, monthlyValues]);

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
      setVoiceFeedback(`Could not understand "${text}". Try: "set month 4 to 5%" or "increase all by 1%"`);
    }
  };

  // Calculate modifications count
  const modifiedCount = monthlyValues.filter((v) => Math.abs(v - item.baseRate) > 0.0001).length;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-md font-mono ${
        isDark ? 'bg-[#0E1424] border-[#2E5E88]/60 text-slate-100' : 'bg-white border-[#2E5E88]/50 text-slate-900'
      }`}
    >
      {/* ===================================================================== */}
      {/* 1. TOOL HEADER BAR: ITEM BEING CHANGED + STATUS + VOICE CONTROLS       */}
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

            <span className="text-xs text-slate-500 font-medium">
              base rate: <strong className="text-[#2E5E88] dark:text-[#5584B4]">{item.baseRate.toFixed(2)}{item.unit === '%' ? '%' : ''}</strong>
            </span>

            {modifiedCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 font-bold">
                {modifiedCount} monthly {modifiedCount === 1 ? 'override' : 'overrides'}
              </span>
            )}
          </div>
        </div>

        {/* Right: Change Type Toggle + Voice Mic Button + Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Percentage vs Value Toggle */}
          <div className="flex items-center p-0.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F1C] text-xs">
            <button
              type="button"
              onClick={() => handleToggleChangeType('percentage')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                changeType === 'percentage'
                  ? 'bg-[#2E5E88] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Percent className="h-3 w-3" />
              <span>percentage (%)</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleChangeType('value')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                changeType === 'value'
                  ? 'bg-[#2E5E88] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <DollarSign className="h-3 w-3" />
              <span>value (R)</span>
            </button>
          </div>

          {/* Voice Prompt Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs ${
              isListening
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                : 'bg-[#2E5E88]/10 hover:bg-[#2E5E88]/20 border-[#2E5E88]/30 text-[#2E5E88] dark:text-[#5584B4]'
            }`}
            title="Speak a change: e.g. 'set month 3 to 5%'"
          >
            {isListening ? <Mic className="h-3.5 w-3.5 animate-bounce" /> : <Mic className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isListening ? 'listening...' : 'voice prompt'}</span>
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetItem}
            className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset all 60 months to base rate"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* V1 Comparison Toggle */}
          <button
            type="button"
            onClick={() => setShowV1Comparison(!showV1Comparison)}
            className={`p-1.5 rounded-xl border text-xs font-bold transition-colors ${
              showV1Comparison
                ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                : 'border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white'
            }`}
            title="Compare with V1 4-year review month tool"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VOICE ASSISTANT / FEEDBACK BANNER (IF ACTIVE)                          */}
      {/* ===================================================================== */}
      {(voiceFeedback || isListening || showVoiceHelp) && (
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

          {/* Example prompt pills for quick 1-click test */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Try prompt:</span>
            {[
              `set month ${startMonthIndex + 3} to 5.5%`,
              `set year ${activeYear} to 6%`,
              `increase all by 1%`,
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
      {/* V1 COMPARISON CALLOUT (USER REQUEST REFERENCE)                         */}
      {/* ===================================================================== */}
      {showV1Comparison && (
        <div className="p-4 border-b bg-amber-500/5 border-amber-500/20 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="font-bold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1.5">
                <Info className="h-4 w-4" />
                <span>Replacement of V1 Process</span>
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                In V1, base rate changes were governed by a 4-year review month table:
                <code className="mx-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-300 font-bold">
                  Year 1 [Month 1] · Year 2 [Month 13] · Year 3 [Month 25] · Year 4 [Month 37]
                </code>
                . This new tool allows <strong>any month in the entire 5-year forecast (Months 1 to 60)</strong> to be independently modified via slider, numeric entry, or natural voice prompts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowV1Comparison(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
            >
              close
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. YEAR 1 – 5 SLIDER (PROMINENTLY FEATURED ABOVE MONTH MATRIX)          */}
      {/* ===================================================================== */}
      <div className="p-4 sm:p-5 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#2E5E88] dark:text-[#5584B4]" />
            <span className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200">
              5-YEAR TIMELINE HORIZON · YEAR {activeYear} (MONTHS {startMonthIndex + 1}–{startMonthIndex + 12})
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
      {/* 3. 12-MONTH RATE EDITING GRID (DIRECTLY REPLICATING PDF PAGE 2 LAYOUT) */}
      {/* ===================================================================== */}
      <div className="p-4 sm:p-5 overflow-x-auto">
        <table className="w-full border-collapse text-center">
          <thead>
            {/* ROW 1: YEAR NUMBER (MONTH 1 - 12) */}
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="py-2.5 px-3 text-left text-xs font-bold uppercase text-slate-400 w-36 whitespace-nowrap">
                year number
              </th>
              {currentYearMonths.map((m) => (
                <th key={m.index} className="py-2.5 px-1 sm:px-1.5 min-w-[58px]">
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
            {/* ROW 2: CHANGE TYPE (PERCENTAGE / VALUE EDIT CELLS) */}
            <tr>
              <td className="py-3 px-3 text-left text-xs font-bold uppercase text-slate-500 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <span>change type</span>
                  <span className="text-[10px] font-normal text-slate-400">
                    ({changeType === 'percentage' ? '%' : 'R'})
                  </span>
                </div>
              </td>
              {currentYearMonths.map((m) => {
                const isOverridden = Math.abs(m.value - item.baseRate) > 0.0001;
                return (
                  <td key={m.index} className="py-3 px-1 sm:px-1.5">
                    <div className="relative">
                      <input
                        type="number"
                        step={changeType === 'percentage' ? '0.01' : '1'}
                        value={m.value}
                        onChange={(e) => handleMonthValueChange(m.index, e.target.value)}
                        className={`w-full py-1.5 px-1 rounded-lg text-xs font-bold text-center border transition-all ${
                          isOverridden
                            ? 'bg-[#2E5E88]/15 border-[#2E5E88] text-[#2E5E88] dark:text-[#5584B4] ring-1 ring-[#2E5E88]/40'
                            : isDark
                            ? 'bg-[#121A2F] border-[#222F4C] text-slate-300 focus:border-[#2E5E88]'
                            : 'bg-white border-[#D8CEBC] text-slate-800 focus:border-[#2E5E88]'
                        }`}
                      />
                      {changeType === 'percentage' && (
                        <span className="absolute right-1 top-2 text-[9px] text-slate-400 pointer-events-none hidden sm:inline">
                          %
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>

        {/* Bottom Helper Bar for Quick Adjustments */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Quick actions for Year {activeYear}:</span>
            <button
              type="button"
              onClick={() => handleFillYear(currentYearMonths[0].value)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-colors"
            >
              Fill all months with M{startMonthIndex + 1} ({currentYearMonths[0].value}{changeType === 'percentage' ? '%' : ''})
            </button>
            <button
              type="button"
              onClick={() => handleFillYear(item.baseRate)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 font-bold text-[11px] transition-colors"
            >
              Reset Year {activeYear} to base ({item.baseRate.toFixed(2)}{item.unit === '%' ? '%' : ''})
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Values automatically update financial projections & reports</span>
          </div>
        </div>
      </div>
    </div>
  );
};
