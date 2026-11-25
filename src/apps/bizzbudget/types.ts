import { BizzModelState } from '../bizzmodel/constants';

export type BudgetStructureMode = 'standalone' | 'multi-branch';

export type ConsolidationLevel = 'branch' | 'region' | 'group';

export type OperationalActionStatus = 'planned' | 'in-progress' | 'completed';

export interface EffectivenessArea {
  id: string;
  name: string;
  description?: string;
}

export interface OperationalPlanActionItem {
  id: string;
  areaId: string;
  title: string;
  assignedTo: string;
  targetDate: string; // YYYY-MM-DD
  status: OperationalActionStatus;
  notes?: string;
  createdAt: string;
}

export interface OperationalPlansState {
  effectivenessAreas: EffectivenessArea[];
  actions: OperationalPlanActionItem[];
}

export interface BudgetRegion {
  id: string;
  name: string;
  code: string;
}

export interface BudgetBranch {
  id: string;
  name: string;
  code: string;
  regionId: string; // Holding company can reference 'holding' or a region
  isHoldingCompany: boolean;
  /**
   * Branch-level Equity Loan formula driver:
   * % of total assets calculated as a negative (credit) balance on the branch Balance Sheet.
   * Branches in multi-branch mode do not carry Share Capital — instead financed via Holding Co Equity Loan.
   */
  equityLoanPctOfTotalAssets: number;
  /**
   * External / direct investment carried on COA 3-2-1-29 (positioned immediately after Fixed Assets).
   * For the Holding Company in multi-branch mode, intercompany 100% ownership investment
   * (= aggregate branch equity loans) is automatically added on top of any external investment.
   */
  directInvestmentAmount: number;
  /**
   * Complete 12-month financial model state (reuses bizzmodel engine + preceding-year hiLevelActuals).
   */
  state: BizzModelState;
  /**
   * Executive Summary Column 2 adjustments keyed by line item ID (e.g. 'ta_revenue', 'bs_inventory').
   * Positive adds to Current Year-End Forecast; negative deducts.
   */
  execAdjustments: Record<string, number>;
  /**
   * Adapted Programme of Actions -> Operational Plans with user-defined Effectiveness Areas.
   */
  operationalPlans: OperationalPlansState;
}

export interface BizzBudgetWorkspaceState {
  version: number;
  groupName: string;
  budgetYearLabel: string;
  structureMode: BudgetStructureMode;
  regions: BudgetRegion[];
  branches: BudgetBranch[];
  activeBranchId: string;
  consolidationLevel: ConsolidationLevel;
  selectedRegionId: string;
  selectedReportBranchId: string;
}
