export interface ProductionProcess {
  id: string;
  name: string;
  numberOfLines: number;          // Number of production lines / workstreams
  employeesPerLine: number;       // Productive employees per production line
  shiftHours: number;             // Shift length in hours (e.g. 8 = 08:00)
  shiftsPerDay: number;           // Number of shifts per day
  timeAllocationPct: number;      // % of line time allocated to this product (0 or 100 = 100%)
  unitsPerBatch: number;          // Gross units produced per batch cycle
  batchRunTimeMinutes: number;    // Active machine/process run time per batch (minutes)
  batchSetupTimeMinutes: number;  // Setup / changeover time per batch (minutes)
  shrinkagePct: number;           // Spoilage / shrinkage % deducted from daily output
}

export interface EmployeeCalcAssumptions {
  hoursPaidPerDay: number;        // Paid hours per shift per employee (defaults to 8)
  labourEfficiencyPct: number;    // Productive efficiency % (e.g. 85% or 100%)
  tolerancePct: number;           // Deficit % tolerated before adding relief staff (e.g. 5%)
}

export interface BomComponent {
  id: string;
  name: string;
  unitOfMeasure: string;          // e.g. 'kg', 'g', 'L', 'ml', 'pcs'
  unitsRequiredPerBatch: number;  // Quantity required per single batch
  unitDivider: number;            // Conversion divider between batch unit and pack unit (default 1)
  packSizeUnits: number;          // Purchase pack size (in pack units)
  packCost: number;               // Purchase cost per pack
  batchConsumablesCost: number;   // Direct consumables cost per batch cycle
  surplusWasted: boolean;         // If true, unused partial-pack surplus is absorbed into unit cost
}

export interface PackagingLevel {
  id: string;
  name: string;                   // e.g. 'Primary Unit Pack', 'Inner Case', 'Outer Carton', 'Pallet'
  containsCount: number;          // Number of previous-level units contained in 1 unit of this level
  componentCost: number;          // Packaging material cost for 1 unit at this level
  wastePct?: number;              // Optional packaging wastage % (default 0)
}

export type VariableCostBasis = 'per_batch' | 'per_unit';

export interface ProductionVariableCostItem {
  id: string;
  name: string;                   // e.g. 'Electricity', 'Gas', 'Fuel', 'Water', 'Maintenance'
  basis: VariableCostBasis;       // 'per_batch' (divided by batch size) or 'per_unit' (direct)
  usage: number;                  // Consumption qty (per batch or per unit)
  usageUnit: string;              // e.g. 'kWh', 'kg', 'litres', 'batch'
  unitRate: number;               // Cost per usage unit
}

export interface UnitCostDynamicsOverrides {
  estimatedUnitCost: number;      // Optional manual benchmark/override (0 = use calculated cost)
  referenceBatchSizeOverride?: number; // Optional override for variable-cost batch divisor (0 = bottleneck batch size)
}

export interface BatchLotsProductConfig {
  processes: ProductionProcess[];
  employeeAssumptions: EmployeeCalcAssumptions;
  bomComponents: BomComponent[];
  packagingLevels: PackagingLevel[];
  variableCosts: ProductionVariableCostItem[];
  dynamicsOverrides: UnitCostDynamicsOverrides;
}

// ============================================================================
// COMPUTED RESULT TYPES
// ============================================================================

export interface ProcessResult {
  id: string;
  name: string;
  productionHoursPerDay: number;
  allocatedUnitsPerBatch: number;
  batchTotalTimeMinutes: number;
  batchTotalTimeHours: number;
  cyclesPerDay: number;
  grossDailyUnits: number;
  netDailyCapacity: number;
  monthlyCapacity: number;
  annualCapacity: number;
  employeesRequiredStandard: number;
  isBottleneck: boolean;
  spareDailyUnits: number;        // Excess capacity above the bottleneck
}

export interface ProductionSummaryResult {
  processes: ProcessResult[];
  bottleneckDailyCapacity: number;
  bottleneckProcessIds: string[];
  bottleneckProcessNames: string[];
  bottleneckCyclesPerDay: number;
  bottleneckUnitsPerBatch: number;
  monthlyCapacity: number;
  annualCapacity: number;
  totalEmployeesStandard: number;
  productionDaysPerMonth: number;
  productionDaysPerAnnum: number;
}

export interface EmployeeCalcResult {
  productionDays: number;
  hoursPaidPerDay: number;
  hoursBoughtPerEmployee: number;
  totalHoursBought: number;
  labourEfficiencyPct: number;
  hoursForSale: number;
  hoursRequired: number;
  varianceHours: number;
  variancePct: number;
  tolerancePct: number;
  employeesStandard: number;
  employeesAdditional: number;
  employeesAdjusted: number;
}

export interface BomComponentResult {
  id: string;
  name: string;
  unitOfMeasure: string;
  cyclesPerDay: number;
  dailyUnitsRequired: number;
  packsRequiredPerDay: number;
  dailyPurchaseCost: number;
  dailyConsumablesCost: number;
  dailyTotalCost: number;
  effectiveDailyCost: number;     // Adjusted if surplus is NOT wasted
  quantityAvailable: number;
  surplusQuantity: number;
  surplusWasted: boolean;
  unitCost: number;               // Cost per finished product unit
  batchCost: number;              // Cost per batch
}

export interface BomSummaryResult {
  items: BomComponentResult[];
  totalDailyMaterialsCost: number;
  totalBatchMaterialsCost: number;
  totalMaterialsUnitCost: number;
}

export interface PackagingLevelResult {
  id: string;
  levelNumber: number;
  name: string;
  containsCount: number;
  cumulativeUnitsPacked: number;  // Finished product units inside 1 pack of this level
  componentCost: number;
  wastePct: number;
  effectiveComponentCost: number;
  unitCostContribution: number;   // Cost per finished product unit
}

export interface PackagingSummaryResult {
  levels: PackagingLevelResult[];
  topLevelUnitsPacked: number;
  totalTopLevelPackCost: number;
  totalPackagingUnitCost: number;
}

export interface VariableCostItemResult {
  id: string;
  name: string;
  basis: VariableCostBasis;
  usage: number;
  usageUnit: string;
  unitRate: number;
  batchCost: number;
  unitCost: number;
}

export interface VariableCostSummaryResult {
  referenceBatchUnits: number;
  items: VariableCostItemResult[];
  totalBatchVariableCost: number;
  totalVariableUnitCost: number;
}

export interface UnitCostDynamicsResult {
  materialsUnitCost: number;
  packagingUnitCost: number;
  productionVariableUnitCost: number;
  calculatedUnitCost: number;
  estimatedUnitCost: number;
  modeledUnitCost: number;
  isUsingEstimatedOverride: boolean;
  materialsSharePct: number;
  packagingSharePct: number;
  variableSharePct: number;
  dailyCapacity: number;
  monthlyCapacity: number;
  employeesIndicated: number;
}

export interface BatchLotsFullResult {
  production: ProductionSummaryResult;
  employees: EmployeeCalcResult;
  bom: BomSummaryResult;
  packaging: PackagingSummaryResult;
  variableCosts: VariableCostSummaryResult;
  dynamics: UnitCostDynamicsResult;
}

// ============================================================================
// HOSPITALITY: FAMILY RESTAURANT MODEL-SET TYPES
// ============================================================================

export interface RestaurantDiningArea {
  id: string;
  name: string;                   // e.g. 'Main Dining Room', 'Patio / Terrace'
  numberOfTables: number;         // Excel R24: number of tables
  guestsPerTable: number;         // Excel R26: guests per table
  shiftHours: number;             // Excel R27: shift hours (e.g. 8 = 08:00)
  shiftsPerDay: number;           // Excel R28: shifts per day (e.g. 2)
  tableCycleTimeMinutes: number;  // Excel R30: table cycle time in minutes (e.g. 120 = 02:00)
}

export interface RestaurantProductionConfig {
  diningAreas: RestaurantDiningArea[];
  kitchenBatchPortions: number;   // Excel R35 / R59: portions per kitchen prep batch (e.g. 10)
  salesMixPct: number;            // Excel R95-R100: category distribution % (100% for full cover, or e.g. 25% for Meals)
  expectedOccupancyPct: number;   // Excel R92: reference occupancy % for expected daily patrons
}

export interface FamilyRestaurantProductConfig {
  restaurant: RestaurantProductionConfig;
  bomComponents: BomComponent[];
  packagingLevels: PackagingLevel[];
  variableCosts: ProductionVariableCostItem[];
  dynamicsOverrides: UnitCostDynamicsOverrides;
}

export interface RestaurantAreaResult {
  id: string;
  name: string;
  totalSeats: number;             // numberOfTables * guestsPerTable
  hoursPerDay: number;            // Excel R29: shiftHours * shiftsPerDay
  servingsPerTable: number;       // Excel R31: hoursPerDay / (tableCycleTimeMinutes / 60)
  guestsPerDayPotential: number;  // Excel R32: numberOfTables * guestsPerTable * servingsPerTable
  guestsPerMonthPotential: number;
  guestsPerYearPotential: number;
}

export interface RestaurantProductionSummaryResult {
  areas: RestaurantAreaResult[];
  totalTables: number;
  totalSeats: number;
  totalGuestsPerDayPotential: number;      // Sum of all dining areas (full venue)
  salesMixPct: number;
  effectiveDailyCapacity: number;          // Potential guests/day * salesMixPct (transferred to Results Line 2)
  effectiveMonthlyCapacity: number;
  effectiveAnnualCapacity: number;
  expectedOccupancyPct: number;
  expectedDailyGuests: number;             // Excel R91: effectiveDailyCapacity * occupancy%
  expectedMonthlyPatrons: number;          // Excel R94: productionDays * expectedDailyGuests
  kitchenBatchPortions: number;
  kitchenBatchesPerDay: number;
  productionDaysPerMonth: number;
  productionDaysPerAnnum: number;
}

export interface FamilyRestaurantFullResult {
  restaurant: RestaurantProductionSummaryResult;
  productionBridge: ProductionSummaryResult; // Adapter so shared BOM / Variable / Dynamics panels work natively
  bom: BomSummaryResult;
  packaging: PackagingSummaryResult;
  variableCosts: VariableCostSummaryResult;
  dynamics: UnitCostDynamicsResult;
}

