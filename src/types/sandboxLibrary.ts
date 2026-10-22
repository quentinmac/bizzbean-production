export type SandboxSourceType =
  | 'file_upload'
  | 'video_file'
  | 'video_url'
  | 'podcast_url'
  | 'book'
  | 'newsletter_email'
  | 'web_article'
  | 'financial_statement'
  | 'policy_governance'
  | 'market_research'
  | 'course_notes'
  | 'clipboard_clip'
  | 'voice_audio';

export type ReminderFrequency = 'one_off' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type ReminderLeadTime = 'none' | '1_hour' | '1_day' | '3_days' | '1_week' | '2_weeks';

export interface StashReminder {
  enabled: boolean;
  targetDate: string; // YYYY-MM-DD
  targetTime?: string; // e.g. "09:00"
  frequency: ReminderFrequency;
  leadTime: ReminderLeadTime;
  note?: string;
  status?: 'pending' | 'due' | 'completed' | 'dismissed';
  lastTriggered?: string;
}

export interface OperationsFocusTask {
  id: string;
  slot: 1 | 2 | 3;
  title: string;
  description?: string;
  targetCompletionDate?: string; // YYYY-MM-DD
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'critical' | 'high' | 'medium';
  category?: string;
  docIdRef?: string;
  updatedAt: string;
}

export interface JournalCategory {
  id: string;
  name: string;
  color?: string; // e.g. 'sky', 'emerald', 'amber', 'rose', 'purple', 'indigo', 'cyan', 'fuchsia'
  icon?: string;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface SandboxDocument {
  id: string;
  title: string;
  sourceType: SandboxSourceType;
  sourceName: string; // e.g. "SARS_VAT_Guide.pdf", "https://youtube.com/watch?v=..."
  category: string;
  content: string; // Text content used for semantic search & Gemini grounding
  summary?: string;
  whyItMatters: string; // "Why" stored in journal style
  actionStep: string;   // Actionable next step
  fileSizeKb: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  tokenCost: number;
  isPinned?: boolean;
  
  // Rich media extensions
  sourceUrl?: string;
  authorOrHost?: string;
  publicationOrShow?: string;
  duration?: string;
  videoEmbedId?: string; // YouTube Video ID

  // Reminder extensions
  reminder?: StashReminder;
}

export interface GroundedCitation {
  docId: string;
  docTitle: string;
  snippet: string;
  relevanceScore?: number;
}

export interface LibraryBriefing {
  id: string;
  title: string;
  type: 'executive_summary' | 'action_plan' | 'financial_risks' | 'market_strategy' | 'todo_extraction' | 'custom_qa';
  generatedAt: string;
  content: string;
  citations: GroundedCitation[];
  tokensUsed: number;
}

export interface SandboxLibrarySubscription {
  tierName: 'Starter Vault' | 'Growth Notebook' | 'Enterprise Knowledge Base';
  monthlyTokens: number;
  remainingTokens: number;
  storageMbLimit: number;
  storageMbUsed: number;
  costInTokens: number;
  firebaseHostingPortion: number; // 80% to Google Cloud / Firebase infrastructure
  bizzbeanCommissionPortion: number; // 20% BizzBean referral margin
  bizzbeanSharePortion?: number;
  activeUntil: string;
  isAutoRenew: boolean;
}
