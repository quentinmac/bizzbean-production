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

export type VariableCostBasis = 'per_batch' | 'per_day' | 'per_hour' | 'per_unit';

export interface ProductionVariableCostItem {
  id: string;
  name: string;                   // e.g. 'Electricity', 'Gas', 'Fuel', 'Water', 'Maintenance'
  basis: VariableCostBasis;       // 'per_batch' | 'per_day' | 'per_hour' | 'per_unit'
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

// ============================================================================
// MANUFACTURING: CONTINUOUS PRODUCTION MODEL-SET TYPES
// ============================================================================

export interface ContinuousProductionProcess {
  id: string;
  name: string;
  numberOfWorkstreams: number;    // Excel R26: number of workstreams / production lines
  employeesPerWorkstream: number; // Excel R28: productive employees per workstream
  shiftHours: number;             // Excel R29: shift length in hours (e.g. 8 = 08:00)
  shiftsPerDay: number;           // Excel R30: number of shifts per day (e.g. 2)
  unitCapacityPerHour: number;    // Excel R33: gross unit capacity per hour
  timeAllocationPct: number;      // Excel R34: % of line time allocated to this product (0 or 100 = 100%)
  shrinkagePct: number;           // Excel R37: spoilage / shrinkage % deducted from daily output
}

export interface ContinuousBomComponent {
  id: string;
  name: string;
  unitOfMeasure: string;          // e.g. 'kg', 'g', 'L', 'ml', 'pcs'
  unitsRequiredPerItem: number;   // Excel R55: material units required per manufactured item
  unitDivider: number;            // Conversion divider between item unit and pack unit (default 1)
  packSizeUnits: number;          // Excel R57: purchase pack size (in pack units)
  packCost: number;               // Excel R60: purchase cost per pack
  consumablesCostPerHour: number; // Excel R63: direct consumables cost per operating hour
  surplusWasted: boolean;         // Excel R68: if true, unused partial-pack surplus is absorbed into unit cost
}

export interface ContinuousProductionProductConfig {
  processes: ContinuousProductionProcess[];
  employeeAssumptions: EmployeeCalcAssumptions;
  bomComponents: ContinuousBomComponent[];
  packagingLevels: PackagingLevel[];
  variableCosts: ProductionVariableCostItem[];
  dynamicsOverrides: UnitCostDynamicsOverrides;
}

export interface ContinuousProcessResult {
  id: string;
  name: string;
  hoursAvailablePerDay: number;   // Excel R32: numberOfWorkstreams * shiftHours * shiftsPerDay
  allocatedUnitsPerHour: number;  // Excel R35: unitCapacityPerHour * (timeAllocationPct / 100)
  grossDailyUnits: number;        // Excel R36: allocatedUnitsPerHour * hoursAvailablePerDay
  netDailyCapacity: number;       // Excel R38: floor(grossDailyUnits * (1 - shrinkagePct/100))
  monthlyCapacity: number;        // Excel R39: productionDaysPerMonth * netDailyCapacity
  annualCapacity: number;
  employeesRequiredStandard: number; // Excel R40: numberOfWorkstreams * employeesPerWorkstream * shiftsPerDay
  isBottleneck: boolean;
  spareDailyUnits: number;
}

export interface ContinuousProductionSummaryResult {
  processes: ContinuousProcessResult[];
  bottleneckDailyCapacity: number;     // MIN net daily capacity across active processes
  bottleneckGrossDailyUnits: number;   // Gross daily units of the constraining process (Excel E36 / E56 / E80)
  bottleneckHoursPerDay: number;       // Operating hours/day of the constraining process (Excel F32)
  bottleneckUnitsPerHour: number;      // Allocated units/hour of the constraining process (Excel F35)
  bottleneckProcessIds: string[];
  bottleneckProcessNames: string[];
  monthlyCapacity: number;
  annualCapacity: number;
  totalEmployeesStandard: number;
  productionDaysPerMonth: number;
  productionDaysPerAnnum: number;
}

export interface ContinuousProductionFullResult {
  continuousProduction: ContinuousProductionSummaryResult;
  productionBridge: ProductionSummaryResult; // Adapter so shared Employee / Variable / Dynamics panels work natively
  employees: EmployeeCalcResult;
  bom: BomSummaryResult;
  packaging: PackagingSummaryResult;
  variableCosts: VariableCostSummaryResult;
  dynamics: UnitCostDynamicsResult;
}

// ============================================================================
// MANUFACTURING: FABRICATION MODEL-SET TYPES
// ============================================================================

export interface FabricationProcess {
  id: string;
  name: string;
  numberOfWorkstreams: number;    // Excel R26: number of workstreams / fabrication bays
  employeesPerLine: number;       // Excel R28: employees per production line / bay
  shiftHours: number;             // Excel R29: shift length in hours (e.g. 8 = 08:00)
  shiftsPerDay: number;           // Excel R30: shifts per day (e.g. 1)
  unitsPerBatch: number;          // Excel R33: finished units fabricated per batch
  daysPerBatch: number;           // Excel R34: production days required per batch (e.g. 2)
  timeAllocationPct: number;      // Optional % of bay capacity allocated to this product (default 100)
  shrinkagePct: number;           // Optional spoilage / rework % deducted from daily output (default 0)
}

export interface FabricationProductConfig {
  processes: FabricationProcess[];
  employeeAssumptions: EmployeeCalcAssumptions;
  bomComponents: BomComponent[];
  packagingLevels: PackagingLevel[];
  variableCosts: ProductionVariableCostItem[];
  dynamicsOverrides: UnitCostDynamicsOverrides;
}

export interface FabricationProcessResult {
  id: string;
  name: string;
  productionHoursPerDay: number;  // Excel R32: numberOfWorkstreams * shiftHours * shiftsPerDay
  allocatedUnitsPerBatch: number; // unitsPerBatch * (timeAllocationPct / 100)
  daysPerBatch: number;           // Excel R34
  hoursPerBatch: number;          // Excel R35: shiftHours * daysPerBatch
  batchesPerDay: number;          // productionHoursPerDay / hoursPerBatch (can be < 1 for multi-day jobs)
  grossDailyUnits: number;        // batchesPerDay * allocatedUnitsPerBatch
  netDailyCapacity: number;       // Excel R36: production per day (preserves fractional units/day e.g. 0.5)
  monthlyCapacity: number;        // Excel R37: productionDaysPerMonth * netDailyCapacity
  annualCapacity: number;
  employeesRequiredStandard: number; // Excel R38: numberOfWorkstreams * employeesPerLine * shiftsPerDay
  isBottleneck: boolean;
  spareDailyUnits: number;
}

export interface FabricationProductionSummaryResult {
  processes: FabricationProcessResult[];
  bottleneckDailyCapacity: number;     // MIN net daily capacity across active processes (can be fractional)
  bottleneckUnitsPerBatch: number;     // Allocated units per batch of constraining process (Excel E33 / E53)
  bottleneckDaysPerBatch: number;      // Days per batch of constraining process (Excel E34)
  bottleneckHoursPerBatch: number;     // Hours per batch of constraining process (Excel F35)
  bottleneckBatchesPerDay: number;     // Batches completed per day on constraining process
  bottleneckShrinkagePct: number;      // Shrinkage % of constraining process
  bottleneckProcessIds: string[];
  bottleneckProcessNames: string[];
  monthlyCapacity: number;
  annualCapacity: number;
  totalEmployeesStandard: number;
  productionDaysPerMonth: number;
  productionDaysPerAnnum: number;
}

export interface FabricationFullResult {
  fabricationProduction: FabricationProductionSummaryResult;
  productionBridge: ProductionSummaryResult; // Adapter so shared Employee / BOM / Variable / Dynamics panels work natively
  employees: EmployeeCalcResult;
  bom: BomSummaryResult;
  packaging: PackagingSummaryResult;
  variableCosts: VariableCostSummaryResult;
  dynamics: UnitCostDynamicsResult;
}

// ============================================================================
// TRADING: VALUE SALES MODEL-SET TYPES
// ============================================================================

export interface ValueSalesCategory {
  id: string;
  name: string;
  grossProfitMarginPct: number; // Governs GP margin % for all products in this category (e.g. 20.00%)
  description?: string;
}

export interface ValueSalesProductConfig {
  categoryId: string;
  dailyValueSalesBase: number;         // Base value sales per working day (e.g. 20,000)
  dailyValueSalesMonthly: number[];    // 60-month daily value sales series (adjusted via slider)
  commissionOnSalesPct: number;        // Base commission % on sales (e.g. 1.00%)
  otherIncomeMonthlyBase: number;      // Base monthly other income (e.g. 10,000)
}

export interface ValueSalesMonthResult {
  monthNum: number;                    // 1..12 within active year
  absMonth: number;                    // 1..60
  daysWorked: number;
  isLaunched: boolean;
  dailyValueSales: number;             // 0 before startMonth
  dailyValueSalesGrowthPct: number;    // MoM % growth vs previous active month
  valueSales: number;                  // daysWorked * dailyValueSales
  costOfSalesPct: number;              // 100 - gpMarginPct
  costOfSales: number;                 // negative (e.g. -288,000)
  grossProfit: number;                 // valueSales + costOfSales
  grossProfitMarginPct: number;        // governed by Product Category
  commissionOnSalesPct: number;
  grossProfitAdjustments: number;      // negative (-valueSales * commissionOnSalesPct / 100)
  otherIncome: number;                 // applies across all months (per value sales.PNG)
  otherIncomeAdjustmentPct: number;    // MoM % change in other income
}

export interface ValueSalesYearGridResult {
  categoryName: string;
  categoryGpMarginPct: number;
  months: ValueSalesMonthResult[];
  totals: {
    totalDaysWorked: number;
    avgDailyValueSales: number;
    sumValueSales: number;
    sumCostOfSales: number;
    sumGrossProfit: number;
    effectiveGpMarginPct: number;
    avgCommissionPct: number;
    sumGrossProfitAdjustments: number;
    sumOtherIncome: number;
  };
}

export interface ValueSalesCategorySummary {
  category: ValueSalesCategory;
  productCount: number;
  yearValueSales: number;
  yearCostOfSales: number;
  yearGrossProfit: number;
  yearGpAdjustments: number;
  yearOtherIncome: number;
  revenueSharePct: number;
}

// ============================================================================
// TRADING: COMMISSION MODEL-SET TYPES
// ============================================================================

export interface CommissionCategory {
  id: string;
  name: string;
  commissionRatePct: number; // Governs commission % earned on principal revenue for all products/services in this category (e.g. 10.00%)
  description?: string;
}

export interface CommissionProductConfig {
  categoryId: string;
  dailyPrincipalSalesBase: number;       // Base third-party principal value sales per working day (e.g. 20,000)
  dailyPrincipalSalesMonthly: number[];  // 60-month daily principal sales series (adjusted via slider)
  commissionOnSalesPct: number;          // GP adjustment % paid on principal value sales (e.g. 1.00%)
  otherIncomeMonthlyBase: number;        // Base monthly other income (e.g. 10,000)
}

export interface CommissionMonthResult {
  monthNum: number;                      // 1..12 within active year
  absMonth: number;                      // 1..60
  daysWorked: number;
  isLaunched: boolean;
  dailyPrincipalSales: number;           // 0 before startMonth
  dailyPrincipalSalesGrowthPct: number;  // MoM % growth vs previous active month
  principalValueSales: number;           // daysWorked * dailyPrincipalSales
  commissionRatePct: number;             // governed by Product Category (e.g. 10.00%)
  commissionRevenue: number;             // principalValueSales * (commissionRatePct / 100) -> transferred to Trading Account Revenue (0 COS)
  commissionOnSalesPct: number;          // e.g. 1.00%
  grossProfitAdjustments: number;        // negative (-principalValueSales * commissionOnSalesPct / 100)
  otherIncome: number;                   // applies across all months (per commission.PNG)
  otherIncomeAdjustmentPct: number;      // MoM % change in other income
}

export interface CommissionYearGridResult {
  categoryName: string;
  categoryCommissionRatePct: number;
  months: CommissionMonthResult[];
  totals: {
    totalDaysWorked: number;
    avgDailyPrincipalSales: number;
    sumPrincipalValueSales: number;
    sumCommissionRevenue: number;
    effectiveCommissionRatePct: number;
    avgCommissionOnSalesPct: number;
    sumGrossProfitAdjustments: number;
    sumOtherIncome: number;
  };
}

export interface CommissionCategorySummary {
  category: CommissionCategory;
  productCount: number;
  yearPrincipalSales: number;
  yearCommissionRevenue: number;
  yearGpAdjustments: number;
  yearOtherIncome: number;
  revenueSharePct: number;
}

// ============================================================================
// TRADING: REVENUE SHARE MODEL-SET TYPES
// ============================================================================

export interface RevenueShareExpenseItem {
  id: string;
  name: string;         // e.g. 'royalties', 'administration', 'hosting services', 'payment gateway', 'other'
  sharePct: number;     // % of product revenue shared with this service provider / partner (e.g. 2.00)
}

export interface RevenueShareCosCategory {
  id: string;
  name: string;         // e.g. 'Platform & Administration', 'Marketing & Digital', 'Fulfilment & Logistics'
  items: RevenueShareExpenseItem[];
}

export interface RevenueShareCategory {
  id: string;
  name: string;         // Product Category name (governs all products listed within it)
  description?: string;
  cosCategories: RevenueShareCosCategory[];
}

export interface RevenueShareProductConfig {
  categoryId: string;
  dailyValueSalesBase: number;        // Base value sales per working day (e.g. 20,000)
  dailyValueSalesMonthly: number[];   // 60-month daily value sales series (adjusted via slider)
  otherIncomeMonthlyBase: number;     // Base monthly other income (e.g. 10,000)
}

export interface RevenueShareComputedExpenseRow {
  id: string;
  name: string;
  sharePct: number;
  monthlyAmounts: number[];           // 12 months, negative (cost of sales outflow)
  yearTotal: number;                  // negative
}

export interface RevenueShareComputedCosCategory {
  id: string;
  name: string;
  subtotalPct: number;
  items: RevenueShareComputedExpenseRow[];
  monthlySubtotals: number[];         // 12 months, negative
  yearSubtotal: number;               // negative
}

export interface RevenueShareMonthResult {
  monthNum: number;                   // 1..12 within active year
  absMonth: number;                   // 1..60
  daysWorked: number;
  isLaunched: boolean;
  dailyValueSales: number;            // 0 before startMonth
  dailyValueSalesGrowthPct: number;   // MoM % growth vs previous active month
  valueSales: number;                 // daysWorked * dailyValueSales
  totalRevenueSharePct: number;       // aggregate % across all Cost of Sales categories
  totalCostOfSales: number;           // negative aggregate of all revenue share partner expenses
  grossProfit: number;                // valueSales + totalCostOfSales
  grossMarginPct: number;             // retained GP % (100 - totalRevenueSharePct)
  otherIncome: number;                // applies across all months (per revenue share.PNG)
  otherIncomeAdjustmentPct: number;   // MoM % change in other income
}

export interface RevenueShareYearGridResult {
  categoryName: string;
  totalRevenueSharePct: number;
  retainedGrossMarginPct: number;
  cosCategories: RevenueShareComputedCosCategory[];
  months: RevenueShareMonthResult[];
  totals: {
    totalDaysWorked: number;
    avgDailyValueSales: number;
    sumValueSales: number;
    sumCostOfSales: number;           // negative
    effectiveRevenueSharePct: number;
    sumGrossProfit: number;
    effectiveGrossMarginPct: number;
    sumOtherIncome: number;
  };
}

export interface RevenueShareCategorySummary {
  category: RevenueShareCategory;
  totalRevenueSharePct: number;
  retainedGrossMarginPct: number;
  productCount: number;
  yearRevenue: number;
  yearCostOfSales: number;            // negative
  yearGrossProfit: number;
  yearOtherIncome: number;
  revenueShareOfPortfolioPct: number;
}


