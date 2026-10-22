export interface AssumptionRateItem {
  id: string;
  stepId: number; // 1 to 6
  stepName: string;
  name: string;
  description: string;
  baseRate: number;
  unit: '%' | 'currency' | 'number';
  changeType: 'percentage' | 'value';
  monthlyValues: number[]; // 60 values (Month 1 to Month 60)
  coaReference?: string;
}

export interface VoiceCommandResult {
  action: 'set_month' | 'set_year' | 'set_all' | 'adjust_all' | 'reset';
  targetMonth?: number; // 1-60
  targetYear?: number; // 1-5
  value?: number;
  delta?: number;
  rawTranscript: string;
  feedbackMessage: string;
}

export type BizzDynamicsTab = 'assumptions' | 'data entry' | 'results';

export interface BizzDynamicsStepDef {
  id: number;
  key: string;
  name: string;
  icon: string;
  description: string;
}
