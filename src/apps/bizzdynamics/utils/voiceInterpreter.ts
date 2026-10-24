import { VoiceCommandResult } from '../types';

/**
 * Plays an authentic, non-intrusive Web Audio confirmation or warning chime.
 */
export function playChime(success: boolean = true) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    const now = ctx.currentTime;

    if (success) {
      // Pleasant two-tone ascending confirmation (D5 -> A5)
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    } else {
      // Gentle warning tone (E4 -> C4)
      osc.frequency.setValueAtTime(329.63, now);
      osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    }

    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    // Non-fatal if audio context is blocked
  }
}

/**
 * Interprets a spoken natural language command into structured monthly rate updates.
 */
export function interpretVoiceCommand(
  rawTranscript: string,
  activeYear: number,
  baseRate: number,
  currentValues: number[]
): { updatedValues: number[]; result: VoiceCommandResult } | null {
  const text = rawTranscript.trim().toLowerCase();
  const nextValues = [...currentValues];

  // 1. Reset command: "reset", "reset to base", "clear changes"
  if (text.includes('reset') || text.includes('clear') || text.includes('revert')) {
    if (text.includes('year')) {
      const yearMatch = text.match(/year\s*([1-5])/);
      const yr = yearMatch ? parseInt(yearMatch[1], 10) : activeYear;
      const startMo = (yr - 1) * 12;
      for (let i = 0; i < 12; i++) {
        nextValues[startMo + i] = baseRate;
      }
      return {
        updatedValues: nextValues,
        result: {
          action: 'reset',
          targetYear: yr,
          rawTranscript,
          feedbackMessage: `Reset Year ${yr} (Months ${startMo + 1}–${startMo + 12}) to base rate (${baseRate.toFixed(2)}%)`,
        },
      };
    }

    // Reset all 60 months
    for (let i = 0; i < 60; i++) {
      nextValues[i] = baseRate;
    }
    return {
      updatedValues: nextValues,
      result: {
        action: 'reset',
        rawTranscript,
        feedbackMessage: `Reset all 60 months to base rate (${baseRate.toFixed(2)}%)`,
      },
    };
  }

  // Helper to extract a number/percentage from the phrase
  const extractValue = (str: string): number | null => {
    // Matches e.g. "5.5 percent", "5.5%", "5 point 5", "5"
    const pctMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:%|percent|percentage)?/);
    if (pctMatch) {
      return parseFloat(pctMatch[1]);
    }
    return null;
  };

  // Helper to extract relative delta: "increase by 1%", "decrease by 0.5"
  const isIncrease = text.includes('increase') || text.includes('add') || text.includes('raise') || text.includes('plus');
  const isDecrease = text.includes('decrease') || text.includes('reduce') || text.includes('lower') || text.includes('minus');

  // 2. Specific Month: e.g. "set month 3 to 5.5%", "month 14 at 6 percent", "change month 6 to 4"
  const monthMatch = text.match(/(?:month|m)\s*([0-9]{1,2})/);
  if (monthMatch) {
    let targetMonth = parseInt(monthMatch[1], 10);
    // If user said month 1-12 and activeYear > 1, does user mean month of current year or global month?
    // If <= 12 and user said "in year X" or implied:
    const yearMatch = text.match(/year\s*([1-5])/);
    if (yearMatch) {
      const yr = parseInt(yearMatch[1], 10);
      if (targetMonth >= 1 && targetMonth <= 12) {
        targetMonth = (yr - 1) * 12 + targetMonth;
      }
    } else if (targetMonth >= 1 && targetMonth <= 12 && activeYear > 1 && !text.includes('global') && !text.includes('overall')) {
      // If user is currently looking at Year 2 and says "month 3", default to Year 2 Month 3 (Month 15)
      targetMonth = (activeYear - 1) * 12 + targetMonth;
    }

    if (targetMonth < 1) targetMonth = 1;
    if (targetMonth > 60) targetMonth = 60;

    // Now extract target rate
    // Remove the month part first so it doesn't match the month number as the value
    const remaining = text.replace(monthMatch[0], '');
    const val = extractValue(remaining);

    if (val !== null) {
      let finalVal = val;
      if (isIncrease) {
        finalVal = Number((nextValues[targetMonth - 1] + val).toFixed(2));
      } else if (isDecrease) {
        finalVal = Number((nextValues[targetMonth - 1] - val).toFixed(2));
      }

      // Check if user says "and following months" or "onwards" or by default cascades
      const shouldCascade = text.includes('following') || text.includes('onwards') || text.includes('after');
      if (shouldCascade) {
        for (let i = targetMonth - 1; i < 60; i++) {
          nextValues[i] = finalVal;
        }
      } else {
        nextValues[targetMonth - 1] = finalVal;
      }

      return {
        updatedValues: nextValues,
        result: {
          action: 'set_month',
          targetMonth,
          value: finalVal,
          rawTranscript,
          feedbackMessage: shouldCascade
            ? `Month ${targetMonth} and following months updated to ${finalVal.toFixed(2)}%`
            : `Month ${targetMonth} updated to ${finalVal.toFixed(2)}%`,
        },
      };
    }
  }

  // 3. Whole Year: e.g. "set year 2 to 6%", "change year 3 to 7 percent"
  const yearMatch = text.match(/year\s*([1-5])/);
  if (yearMatch) {
    const yr = parseInt(yearMatch[1], 10);
    const remaining = text.replace(yearMatch[0], '');
    const val = extractValue(remaining);
    if (val !== null) {
      const startMo = (yr - 1) * 12;
      for (let i = 0; i < 12; i++) {
        let finalVal = val;
        if (isIncrease) {
          finalVal = Number((nextValues[startMo + i] + val).toFixed(2));
        } else if (isDecrease) {
          finalVal = Number((nextValues[startMo + i] - val).toFixed(2));
        }
        nextValues[startMo + i] = finalVal;
      }
      return {
        updatedValues: nextValues,
        result: {
          action: 'set_year',
          targetYear: yr,
          value: val,
          rawTranscript,
          feedbackMessage: `Year ${yr} (Months ${startMo + 1}–${startMo + 12}) updated to ${val.toFixed(2)}%`,
        },
      };
    }
  }

  // 4. All Months: e.g. "set all months to 5%", "increase all by 1%", "all to 4.5"
  if (text.includes('all') || text.includes('every') || text.includes('entire')) {
    const val = extractValue(text);
    if (val !== null) {
      for (let i = 0; i < 60; i++) {
        let finalVal = val;
        if (isIncrease) {
          finalVal = Number((nextValues[i] + val).toFixed(2));
        } else if (isDecrease) {
          finalVal = Number((nextValues[i] - val).toFixed(2));
        }
        nextValues[i] = finalVal;
      }
      return {
        updatedValues: nextValues,
        result: {
          action: 'set_all',
          value: val,
          rawTranscript,
          feedbackMessage: `All 60 months updated to ${val.toFixed(2)}%`,
        },
      };
    }
  }

  // 5. Fallback: single number spoken when user is on a specific view -> applies to active year
  const simpleVal = extractValue(text);
  if (simpleVal !== null) {
    const startMo = (activeYear - 1) * 12;
    for (let i = 0; i < 12; i++) {
      nextValues[startMo + i] = simpleVal;
    }
    return {
      updatedValues: nextValues,
      result: {
        action: 'set_year',
        targetYear: activeYear,
        value: simpleVal,
        rawTranscript,
        feedbackMessage: `Year ${activeYear} (Months ${startMo + 1}–${startMo + 12}) set to ${simpleVal.toFixed(2)}%`,
      },
    };
  }

  return null;
}
