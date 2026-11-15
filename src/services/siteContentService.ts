import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirestoreQuotaExceeded } from '../lib/firebase';
import {
  DEFAULT_WHO_ARE_WE,
  DEFAULT_WHAT_WE_DO,
  DEFAULT_WHERE_ARE_WE_GOING,
  DEFAULT_HOW_SOLUTIONS_ENABLE_GROWTH,
} from '../data/aboutDefaults';

export interface AboutBizzbeanContent {
  whoAreWe: string;
  whatWeDoPanel: string;
  whatWeDo?: string;
  whereAreWeGoing: string;
  howSolutionsEnableGrowth: string;
  socialMissionEquation?: string;
  socialMissionSubtext?: string;
  updatedAt?: string;
}

export type AboutContent = AboutBizzbeanContent;

export const DEFAULT_MISSION_EQUATION =
  'SCALING ENTREPRENEURSHIP THROUGH REAL INTELLIGENCE';
export const DEFAULT_MISSION_SUBTEXT =
  'bizzbean is a high-scale virtual and financial calibration platform that bridges the gap between ambitions founders and traditional capital providers. We replace spreadsheet guessing with scientific, advanced financial modelling and tailored education roadmaps.';

const STORAGE_KEY = 'bizzbean_about_content_v2';
const FIRESTORE_DOC_PATH = 'site_content';
const FIRESTORE_DOC_ID = 'about_bizzbean';

export function getCachedAboutContent(): AboutBizzbeanContent {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return {
            whoAreWe: parsed.whoAreWe || DEFAULT_WHO_ARE_WE,
            whatWeDoPanel: parsed.whatWeDoPanel || DEFAULT_WHAT_WE_DO,
            whereAreWeGoing: parsed.whereAreWeGoing || DEFAULT_WHERE_ARE_WE_GOING,
            howSolutionsEnableGrowth: parsed.howSolutionsEnableGrowth || DEFAULT_HOW_SOLUTIONS_ENABLE_GROWTH,
            socialMissionEquation: parsed.socialMissionEquation || DEFAULT_MISSION_EQUATION,
            socialMissionSubtext: parsed.socialMissionSubtext || DEFAULT_MISSION_SUBTEXT,
            updatedAt: parsed.updatedAt,
          };
        }
      }
    }
  } catch (e) {
    console.warn('Error reading cached about content:', e);
  }

  return {
    whoAreWe: DEFAULT_WHO_ARE_WE,
    whatWeDoPanel: DEFAULT_WHAT_WE_DO,
    whereAreWeGoing: DEFAULT_WHERE_ARE_WE_GOING,
    howSolutionsEnableGrowth: DEFAULT_HOW_SOLUTIONS_ENABLE_GROWTH,
    socialMissionEquation: DEFAULT_MISSION_EQUATION,
    socialMissionSubtext: DEFAULT_MISSION_SUBTEXT,
  };
}

export async function fetchAboutContentFromCloud(): Promise<AboutBizzbeanContent> {
  const cached = getCachedAboutContent();
  try {
    if (!isFirestoreQuotaExceeded()) {
      const docRef = doc(db, FIRESTORE_DOC_PATH, FIRESTORE_DOC_ID);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as Partial<AboutBizzbeanContent>;
        const merged: AboutBizzbeanContent = {
          whoAreWe: data.whoAreWe || cached.whoAreWe,
          whatWeDoPanel: data.whatWeDoPanel || cached.whatWeDoPanel,
          whereAreWeGoing: data.whereAreWeGoing || cached.whereAreWeGoing,
          howSolutionsEnableGrowth: data.howSolutionsEnableGrowth || cached.howSolutionsEnableGrowth,
          socialMissionEquation: data.socialMissionEquation || cached.socialMissionEquation,
          socialMissionSubtext: data.socialMissionSubtext || cached.socialMissionSubtext,
          updatedAt: data.updatedAt,
        };
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          }
        } catch {}
        return merged;
      }
    }
  } catch (err) {
    console.warn('Could not fetch about content from Firestore (using cached/defaults):', err);
  }
  return cached;
}

export async function saveAboutContentToCloud(content: AboutBizzbeanContent): Promise<void> {
  const payload: AboutBizzbeanContent = {
    ...content,
    updatedAt: new Date().toISOString(),
  };

  // 1. Save locally for instant responsiveness
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('bizzbean_about_content_updated', { detail: payload }));
    }
  } catch {}

  // 2. Persist to Firestore cloud database so all domains (bizzbean.com, preview, devices) share it
  try {
    if (!isFirestoreQuotaExceeded()) {
      const docRef = doc(db, FIRESTORE_DOC_PATH, FIRESTORE_DOC_ID);
      const cleanPayload = JSON.parse(JSON.stringify(payload));
      await setDoc(docRef, cleanPayload, { merge: true });
    }
  } catch (err) {
    console.warn('Could not save about content to Firestore:', err);
  }
}
