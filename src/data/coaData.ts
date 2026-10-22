import coaCategoriesJson from './coaCategories.json';
import coaMasterJson from './coaMaster.json';

export interface CoaCategoryItem {
  primaryCode: number;
  primaryName: string; // 'income' | 'expenses' | 'assets' | 'liabilities'
  categoryCode: number;
  categoryName: string;
  subCategoryCode: number;
  subCategoryName: string;
  reportCode: string;
}

export interface CoaLineItem {
  lineNo: number;
  primaryCode: number; // 1, 2, 3, 4
  categoryCode: number;
  subCategoryCode: number;
  seqCode: number;
  baseCode: string; // e.g. "1-1-1-1", "2-2-1-1"
  reportCode: string; // e.g. "1-1-1", "2-2-1"
  glDescription: string;
  primaryName: string; // "income" | "expenses" | "assets" | "liabilities"
  categoryName: string;
  subCategoryName: string;
  systemId: number | null;
  bizzcalc: boolean;
  bizzmodel: boolean;
  bizzdynamics?: boolean;
  hiLevelForecast?: boolean;
  notes?: string;
  updatedAt?: string;
}

export const INITIAL_COA_CATEGORIES: CoaCategoryItem[] = coaCategoriesJson as CoaCategoryItem[];

export const INITIAL_COA_MASTER: CoaLineItem[] = (coaMasterJson as any[]).map((item) => ({
  ...item,
  bizzdynamics: item.bizzcalc || item.bizzmodel,
  hiLevelForecast: item.bizzcalc,
}));

export const PRIMARY_DEFINITIONS: Record<number, { name: string; label: string; color: string; badge: string }> = {
  1: { name: 'income', label: '1 – Income', color: 'emerald', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' },
  2: { name: 'expenses', label: '2 – Expenses', color: 'rose', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800' },
  3: { name: 'assets', label: '3 – Assets', color: 'blue', badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800' },
  4: { name: 'liabilities', label: '4 – Liabilities', color: 'amber', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' },
};

/**
 * Automatically computes the next sequential code for a given primary, category, and subcategory.
 * Guarantees zero duplicate codes and maintenance efficiency.
 */
export function generateNextSeqCode(
  items: CoaLineItem[],
  primaryCode: number,
  categoryCode: number,
  subCategoryCode: number
): number {
  const existingForSubcat = items.filter(
    (i) =>
      i.primaryCode === primaryCode &&
      i.categoryCode === categoryCode &&
      i.subCategoryCode === subCategoryCode
  );
  if (existingForSubcat.length === 0) return 1;
  const maxSeq = Math.max(...existingForSubcat.map((i) => i.seqCode || 0));
  return maxSeq + 1;
}

/**
 * Formats the standard 4-numeric base code: Primary-Category-Subcategory-Sequential
 * e.g. "1-1-1-1" or "2-6-5-30"
 */
export function formatBaseCode(
  primaryCode: number,
  categoryCode: number,
  subCategoryCode: number,
  seqCode: number
): string {
  return `${primaryCode}-${categoryCode}-${subCategoryCode}-${seqCode}`;
}

/**
 * Formats the 3-tier report code: Primary-Category-Subcategory
 * e.g. "1-1-1" or "2-6-5"
 */
export function formatReportCode(
  primaryCode: number,
  categoryCode: number,
  subCategoryCode: number
): string {
  return `${primaryCode}-${categoryCode}-${subCategoryCode}`;
}

/**
 * Computes next available system ID
 */
export function generateNextSystemId(items: CoaLineItem[]): number {
  const ids = items.map((i) => i.systemId || 0).filter((id) => id > 0);
  if (ids.length === 0) return 100;
  return Math.max(...ids) + 1;
}

/**
 * Automated Audit and Integrity Check for Chart of Accounts
 */
export interface CoaAuditResult {
  totalItems: number;
  duplicateBaseCodes: { code: string; count: number }[];
  missingDescriptions: number[];
  unmappedCategories: string[];
  maxLineNo: number;
  uniquePrimaryCounts: Record<string, number>;
  bizzcalcCount: number;
  bizzmodelCount: number;
  healthy: boolean;
}

export function auditCoaIntegrity(items: CoaLineItem[], categories: CoaCategoryItem[]): CoaAuditResult {
  const codeMap = new Map<string, number>();
  const missingDesc: number[] = [];
  const primaryCounts: Record<string, number> = { income: 0, expenses: 0, assets: 0, liabilities: 0 };
  let bizzcalcCount = 0;
  let bizzmodelCount = 0;
  let maxLineNo = 0;

  items.forEach((item) => {
    codeMap.set(item.baseCode, (codeMap.get(item.baseCode) || 0) + 1);
    if (!item.glDescription || item.glDescription.trim() === '') {
      missingDesc.push(item.lineNo);
    }
    const pName = (item.primaryName || '').toLowerCase();
    if (primaryCounts[pName] !== undefined) {
      primaryCounts[pName]++;
    }
    if (item.bizzcalc) bizzcalcCount++;
    if (item.bizzmodel) bizzmodelCount++;
    if (item.lineNo > maxLineNo) maxLineNo = item.lineNo;
  });

  const duplicateBaseCodes: { code: string; count: number }[] = [];
  codeMap.forEach((count, code) => {
    if (count > 1) {
      duplicateBaseCodes.push({ code, count });
    }
  });

  const categoryKeys = new Set(
    categories.map((c) => `${c.primaryCode}-${c.categoryCode}-${c.subCategoryCode}`)
  );
  const unmapped: Set<string> = new Set();
  items.forEach((item) => {
    const key = `${item.primaryCode}-${item.categoryCode}-${item.subCategoryCode}`;
    if (!categoryKeys.has(key)) {
      unmapped.add(`${key} (${item.primaryName} > ${item.categoryName} > ${item.subCategoryName})`);
    }
  });

  const healthy = duplicateBaseCodes.length === 0 && missingDesc.length === 0;

  return {
    totalItems: items.length,
    duplicateBaseCodes,
    missingDescriptions: missingDesc,
    unmappedCategories: Array.from(unmapped),
    maxLineNo,
    uniquePrimaryCounts: primaryCounts,
    bizzcalcCount,
    bizzmodelCount,
    healthy,
  };
}
