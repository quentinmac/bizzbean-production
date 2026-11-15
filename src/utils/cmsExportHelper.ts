import {
  CmsProduct,
  CmsVideo,
  CmsArticle,
  CmsBookBundle,
  CmsInquiry,
  CmsAssociateImport,
  CmsSponsorAccount,
  CmsTransactionRecord,
  CmsPolicyRegistryItem,
  CmsBizzyTooltip,
  CmsPromotionEmail,
  CmsPromotionSection,
  TransactionRecord,
  ClientProfile,
  ClientNotification,
  INITIAL_CMS_BOOK_BUNDLE,
  INITIAL_CMS_PROMOTION_EMAILS,
  INITIAL_CMS_INQUIRIES,
  INITIAL_CMS_ASSOCIATE_BATCHES,
  INITIAL_CMS_SPONSORS,
  INITIAL_CMS_TRANSACTIONS,
  INITIAL_V1_TRANSACTIONS,
  INITIAL_CLIENT_PROFILES,
  INITIAL_CLIENT_NOTIFICATIONS,
  INITIAL_CMS_POLICIES,
  INITIAL_CMS_TOOLTIPS,
} from '../data/cmsConsoleData';

export interface CmsExportPayload {
  products: CmsProduct[];
  promotions: CmsPromotionSection[];
  videos?: CmsVideo[];
  articles?: CmsArticle[];
  bookBundle?: CmsBookBundle;
  promotionEmails?: CmsPromotionEmail[];
  inquiries?: CmsInquiry[];
  associateBatches?: CmsAssociateImport[];
  sponsors?: CmsSponsorAccount[];
  transactions?: CmsTransactionRecord[];
  v1Transactions?: TransactionRecord[];
  clientProfiles?: ClientProfile[];
  clientNotifications?: ClientNotification[];
  policies?: CmsPolicyRegistryItem[];
  tooltips?: CmsBizzyTooltip[];
}

/**
 * Serializes all CMS data into a complete, pristine, syntactically valid TypeScript
 * file that perfectly replaces src/data/cmsConsoleData.ts in GitHub repositories.
 */
export function generateCmsConsoleDataTs(payload: CmsExportPayload): string {
  const products = payload.products || [];
  const promotions = payload.promotions || [];
  const videos = payload.videos || [];
  const articles = payload.articles || [];
  const bookBundle = payload.bookBundle || INITIAL_CMS_BOOK_BUNDLE;
  const promotionEmails = payload.promotionEmails || INITIAL_CMS_PROMOTION_EMAILS;
  const inquiries = payload.inquiries || INITIAL_CMS_INQUIRIES;
  const associateBatches = payload.associateBatches || INITIAL_CMS_ASSOCIATE_BATCHES;
  const sponsors = payload.sponsors || INITIAL_CMS_SPONSORS;
  const transactions = payload.transactions || INITIAL_CMS_TRANSACTIONS;
  const v1Transactions = payload.v1Transactions || INITIAL_V1_TRANSACTIONS;
  const clientProfiles = payload.clientProfiles || INITIAL_CLIENT_PROFILES;
  const clientNotifications = payload.clientNotifications || INITIAL_CLIENT_NOTIFICATIONS;
  const policies = payload.policies || INITIAL_CMS_POLICIES;
  const tooltips = payload.tooltips || INITIAL_CMS_TOOLTIPS;

  const timestamp = new Date().toISOString();

  return `// =============================================================================
// BIZZBEAN CMS MASTER REPOSITORY DATA (AUTO-GENERATED VIA CMS CONSOLE EXPORT)
// Generated at: ${timestamp}
//
// INSTRUCTIONS FOR GITHUB DEPLOYMENT:
// 1. Commit/upload this file directly to: src/data/cmsConsoleData.ts
// 2. Commit changes to main branch.
// 3. Your production build (GitHub Pages / Vercel / Netlify) will immediately
//    deploy with all updated images, pricing formulas, currencies, and content.
// =============================================================================

import { TransactionRecord, ClientProfile, ClientNotification } from '../types';

export const CMS_BUNDLE_GENERATED_AT = '${timestamp}';

export interface CmsCourseLesson {
  id: string;
  name: string;
  youtubeUrl: string;
  duration: string;
}

export interface CmsProduct {
  id: string;
  seq: number;
  type: 'app' | 'course';
  stage: 'vi-ability' | 'fund-ability' | 'sustain-ability' | 'invest-ability' | 'operations' | 'growth' | 'education' | 'personal-sandbox' | 'operations-sandbox';
  sku: string;
  name: string;
  subtitle: string;
  description: string;
  purpose: string;
  billingModel?: 'once-off' | 'monthly subscription';
  exclusivePriceZAR: number;
  vatZAR: number;
  sellingPriceZAR: number;
  tokensAllocated: number;
  ticketPriceZAR: number;
  isPurchased: boolean;
  activeInSync: boolean;
  canonicalCoverUrl?: string | null;
  youtubeDemoUrl?: string | null;
  assignedStep?: string;
  journeyMilestone?: string;
  modules?: string[];
  syllabusLessonsCount?: number;
  lessonTitles?: string[];
  courseLessons?: CmsCourseLesson[];
  coursePromoVideoUrl?: string | null;
  companionMaterialFilename?: string;
  targetProfile?: string;
  challengeText?: string;
  whatYouGet?: string[];
  deliverables?: string[];
  engineSteps?: Array<{
    step: number;
    title: string;
    desc: string;
    inputs: string[];
    outputs: string[];
    logic?: string;
  }>;
}

export interface CmsVideo {
  id: string;
  title: string;
  author: string;
  duration: string;
  youtubeUrl: string;
  isMustWatch: boolean;
  category: string;
  linked: boolean;
}

export interface CmsArticle {
  id: string;
  seq?: number;
  title: string;
  summary: string;
  author: string;
  readTime: string;
  isMustRead: boolean;
  category: string;
  imageUrl?: string;
  content?: string;
  publishedDate?: string;
}

export interface CmsBookBundle {
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  youtubeVideoUrl: string;
  workbookFilename: string;
  isActive: boolean;
}

// ADMINISTRATION CENTRE DATA STRUCTURES
export interface CmsInquiry {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  date: string;
  status: 'new' | 'reviewed' | 'resolved';
}

export interface CmsAssociateImport {
  id: string;
  batchName: string;
  organization: string;
  candidateCount: number;
  tokensPerAccount: number;
  date: string;
  status: 'provisioned' | 'pending';
}

export interface CmsSponsorAccount {
  id: string;
  sponsorName: string;
  tier: 'Enterprise' | 'Accelerator' | 'Govt Development Agency';
  sponsoredSeats: number;
  contactPerson: string;
  status: 'active' | 'renewal';
}

export type { TransactionRecord, ClientProfile, ClientNotification } from '../types';

export interface CmsTransactionRecord {
  id: string;
  timestamp: string;
  userEmail: string;
  action: 'unlock_solution' | 'token_grant' | 'subscription' | 'export';
  solutionName: string;
  tokensUsed: number;
  amountZAR: number;
}

export interface CmsPolicyRegistryItem {
  id: string;
  title: string;
  category: 'POPIA & Privacy' | 'Terms of Service' | 'Tokenomics Governance' | 'VDR Security Protocol';
  version: string;
  lastUpdated: string;
  status: 'active' | 'draft';
}

export interface CmsBizzyTooltip {
  id: string;
  pageRoute: string;
  elementSelector: string;
  headline: string;
  promptGuidance: string;
}

export interface CmsPromotionEmail {
  id: string;
  campaignName: string;
  targetSegment: string;
  subject: string;
  previewHeader: string;
  headline: string;
  bodyText: string;
  highlightedSolution: string;
  ctaLabel: string;
  ctaUrl: string;
  tokensIncluded: number;
  senderPersona: string;
  status: 'ready' | 'draft' | 'dispatched';
  sentCount: number;
  openRate: string;
  clickRate: string;
  lastDispatched: string;
}

export interface CmsStageStory {
  narrative?: string;
  stageChallenge?: string;
  milestone?: string;
  keyDeliverable?: string;
}

export interface CmsPromotionSection {
  id: string;
  name: string;
  displayName: string;
  tagline: string;
  targetType: 'solution' | 'knowledge-base';
  targetId: string;
  targetTab?: 'dialogue' | 'search' | 'library' | null;
  buttonText: string;
  imageUrl?: string | null;
  isActive: boolean;
  stageStory?: CmsStageStory | null;
}

// =============================================================================
// MASTER PRODUCTS & CURRICULA REPOSITORY
// =============================================================================
export const INITIAL_CMS_PRODUCTS: CmsProduct[] = ${JSON.stringify(products, null, 2)};

// =============================================================================
// EDUCATIONAL VIDEOS REPOSITORY
// =============================================================================
export const INITIAL_CMS_VIDEOS: CmsVideo[] = ${JSON.stringify(videos, null, 2)};

// =============================================================================
// ARTICLES & ANALYSIS REPOSITORY
// =============================================================================
export const INITIAL_CMS_ARTICLES: CmsArticle[] = ${JSON.stringify(articles, null, 2)};

// =============================================================================
// BOOK & WORKBOOK BUNDLE
// =============================================================================
export const INITIAL_CMS_BOOK_BUNDLE: CmsBookBundle = ${JSON.stringify(bookBundle, null, 2)};

// =============================================================================
// PROMOTION EMAILS REPOSITORY
// =============================================================================
export const INITIAL_CMS_PROMOTION_EMAILS: CmsPromotionEmail[] = ${JSON.stringify(promotionEmails, null, 2)};

// =============================================================================
// INQUIRIES REPOSITORY
// =============================================================================
export const INITIAL_CMS_INQUIRIES: CmsInquiry[] = ${JSON.stringify(inquiries, null, 2)};

// =============================================================================
// ASSOCIATE BATCHES REPOSITORY
// =============================================================================
export const INITIAL_CMS_ASSOCIATE_BATCHES: CmsAssociateImport[] = ${JSON.stringify(associateBatches, null, 2)};

// =============================================================================
// SPONSOR ACCOUNTS REPOSITORY
// =============================================================================
export const INITIAL_CMS_SPONSORS: CmsSponsorAccount[] = ${JSON.stringify(sponsors, null, 2)};

// =============================================================================
// TRANSACTION AUDIT LOG REPOSITORIES
// =============================================================================
export const INITIAL_CMS_TRANSACTIONS: CmsTransactionRecord[] = ${JSON.stringify(transactions, null, 2)};

export const INITIAL_V1_TRANSACTIONS: TransactionRecord[] = ${JSON.stringify(v1Transactions, null, 2)};

// =============================================================================
// CLIENT PROFILES & NOTIFICATIONS
// =============================================================================
export const INITIAL_CLIENT_PROFILES: ClientProfile[] = ${JSON.stringify(clientProfiles, null, 2)};

export const INITIAL_CLIENT_NOTIFICATIONS: ClientNotification[] = ${JSON.stringify(clientNotifications, null, 2)};

// =============================================================================
// POLICIES & BIZZY TOOLTIPS
// =============================================================================
export const INITIAL_CMS_POLICIES: CmsPolicyRegistryItem[] = ${JSON.stringify(policies, null, 2)};

export const INITIAL_CMS_TOOLTIPS: CmsBizzyTooltip[] = ${JSON.stringify(tooltips, null, 2)};

// =============================================================================
// PROMOTIONAL BILLBOARDS & STAGE STORIES (HERO SCREENS)
// =============================================================================
export const INITIAL_CMS_PROMOTIONS: CmsPromotionSection[] = ${JSON.stringify(promotions, null, 2)};
`;
}

/**
 * Triggers a file download in the browser with the exact file name.
 */
export function downloadCmsDataFile(content: string, filename: string = 'cmsConsoleData.ts'): void {
  const blob = new Blob([content], { type: 'text/typescript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

/**
 * Sends the generated content to the backend server to sync /src/data/cmsConsoleData.ts and /src/data/cmsBackup.json on disk.
 */
export async function syncCmsDataToServer(content: string, jsonPayload?: any): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('/api/cms/save-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileContent: content, jsonPayload }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.warn(`Server file save returned status ${res.status}`);
      return false;
    }
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.warn('Backend server file write unavailable or timed out:', err);
    return false;
  }
}
