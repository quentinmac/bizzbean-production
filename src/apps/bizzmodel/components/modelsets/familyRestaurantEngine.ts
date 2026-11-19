import {
  FamilyRestaurantFullResult,
  FamilyRestaurantProductConfig,
  ProductionSummaryResult,
  RestaurantAreaResult,
  RestaurantProductionConfig,
  RestaurantProductionSummaryResult,
  UnitCostDynamicsResult,
} from './modelSetTypes';
import {
  calculateBillOfMaterials,
  calculatePackagingCosts,
  calculateProductionVariableCosts,
} from './batchLotsEngine';

const safeNum = (val: unknown, fallback = 0): number => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * 1. RESTAURANT PRODUCTION CALCULATOR (Seating & Table Turnover Capacity)
 * Faithful to family restaurant.xlsx (R22-R32 & R91-R100):
 * - hoursPerDay = shiftHours * shiftsPerDay (R29)
 * - servingsPerTable = hoursPerDay / (tableCycleTimeMinutes / 60) (R31)
 * - guestsPerDayPotential = numberOfTables * guestsPerTable * servingsPerTable (R32)
 * Multiple dining areas sum together for full venue seating capacity.
 */
export function calculateRestaurantProductionSummary(
  config: RestaurantProductionConfig,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): RestaurantProductionSummaryResult {
  const daysMonth = Math.max(1, safeNum(productionDaysPerMonth, 21));
  const daysYear = Math.max(1, safeNum(productionDaysPerAnnum, daysMonth * 12));

  const areas: RestaurantAreaResult[] = (config.diningAreas || []).map((area) => {
    const tables = Math.max(0, safeNum(area.numberOfTables, 0));
    const guestsPerTable = Math.max(0, safeNum(area.guestsPerTable, 0));
    const shiftHours = Math.max(0, safeNum(area.shiftHours, 0));
    const shiftsPerDay = Math.max(0, safeNum(area.shiftsPerDay, 0));
    const cycleMins = Math.max(0, safeNum(area.tableCycleTimeMinutes, 0));

    const totalSeats = Math.round(tables * guestsPerTable);

    // Excel R29: =F27*F28
    const hoursPerDay = shiftHours * shiftsPerDay;

    // Excel R31: =F29/F30
    const cycleHours = cycleMins / 60;
    const servingsPerTable = cycleHours > 0 ? hoursPerDay / cycleHours : 0;

    // Excel R32: =F24*F26*F31
    const guestsPerDayPotential = Math.floor(tables * guestsPerTable * servingsPerTable);
    const guestsPerMonthPotential = Math.round(guestsPerDayPotential * daysMonth);
    const guestsPerYearPotential = Math.round(guestsPerDayPotential * daysYear);

    return {
      id: area.id,
      name: area.name || 'Dining Area',
      totalSeats,
      hoursPerDay,
      servingsPerTable,
      guestsPerDayPotential,
      guestsPerMonthPotential,
      guestsPerYearPotential,
    };
  });

  const totalTables = areas.reduce(
    (sum, a, idx) => sum + Math.max(0, safeNum(config.diningAreas[idx]?.numberOfTables, 0)),
    0
  );
  const totalSeats = areas.reduce((sum, a) => sum + a.totalSeats, 0);
  const totalGuestsPerDayPotential = areas.reduce(
    (sum, a) => sum + a.guestsPerDayPotential,
    0
  );

  // Sales mix share % (R95-R100): 100% for full venue cover, or e.g. 25% per category
  const rawMix = safeNum(config.salesMixPct, 100);
  const salesMixPct = rawMix <= 0 ? 100 : Math.min(100, rawMix);
  const effectiveDailyCapacity = Math.floor(
    totalGuestsPerDayPotential * (salesMixPct / 100)
  );
  const effectiveMonthlyCapacity = Math.round(effectiveDailyCapacity * daysMonth);
  const effectiveAnnualCapacity = Math.round(effectiveDailyCapacity * daysYear);

  // Reference occupancy % (Excel R91-R94)
  const expectedOccupancyPct = Math.min(
    100,
    Math.max(0, safeNum(config.expectedOccupancyPct, 20))
  );
  const expectedDailyGuests = Math.round(
    effectiveDailyCapacity * (expectedOccupancyPct / 100)
  );
  const expectedMonthlyPatrons = Math.round(expectedDailyGuests * daysMonth);

  // Kitchen prep batch portions (Excel R35 & R59)
  const kitchenBatchPortions = Math.max(1, safeNum(config.kitchenBatchPortions, 10));
  const kitchenBatchesPerDay =
    kitchenBatchPortions > 0 ? effectiveDailyCapacity / kitchenBatchPortions : 0;

  return {
    areas,
    totalTables,
    totalSeats,
    totalGuestsPerDayPotential,
    salesMixPct,
    effectiveDailyCapacity,
    effectiveMonthlyCapacity,
    effectiveAnnualCapacity,
    expectedOccupancyPct,
    expectedDailyGuests,
    expectedMonthlyPatrons,
    kitchenBatchPortions,
    kitchenBatchesPerDay,
    productionDaysPerMonth: daysMonth,
    productionDaysPerAnnum: daysYear,
  };
}

/**
 * Full Hospitality — Family Restaurant calculation engine.
 * Reuses the shared BOM, Multi-Level Packaging, and Production Variable Costs engines
 * (no Employee Calculator per user specification).
 */
export function calculateFamilyRestaurantFull(
  config: FamilyRestaurantProductConfig,
  productionDaysPerMonth: number,
  productionDaysPerAnnum: number
): FamilyRestaurantFullResult {
  const restaurant = calculateRestaurantProductionSummary(
    config.restaurant,
    productionDaysPerMonth,
    productionDaysPerAnnum
  );

  // Bridge summary so shared BOM & Variable Costs panels reuse exact same math & props
  const productionBridge: ProductionSummaryResult = {
    processes: [],
    bottleneckDailyCapacity: restaurant.effectiveDailyCapacity,
    bottleneckProcessIds: [],
    bottleneckProcessNames: restaurant.areas.map((a) => a.name),
    bottleneckCyclesPerDay: restaurant.kitchenBatchesPerDay,
    bottleneckUnitsPerBatch: restaurant.kitchenBatchPortions,
    monthlyCapacity: restaurant.effectiveMonthlyCapacity,
    annualCapacity: restaurant.effectiveAnnualCapacity,
    totalEmployeesStandard: 0,
    productionDaysPerMonth: restaurant.productionDaysPerMonth,
    productionDaysPerAnnum: restaurant.productionDaysPerAnnum,
  };

  const bom = calculateBillOfMaterials(config.bomComponents, productionBridge);
  const packaging = calculatePackagingCosts(config.packagingLevels);
  const variableCosts = calculateProductionVariableCosts(
    config.variableCosts,
    productionBridge,
    config.dynamicsOverrides?.referenceBatchSizeOverride
  );

  const materialsUnitCost = bom.totalMaterialsUnitCost;
  const packagingUnitCost = packaging.totalPackagingUnitCost;
  const productionVariableUnitCost = variableCosts.totalVariableUnitCost;

  // Excel R86: =F81+F83+F85
  const calculatedUnitCost =
    materialsUnitCost + packagingUnitCost + productionVariableUnitCost;

  // Excel R87 & R89: =IF(F87=0, F86, F87)
  const estimatedUnitCost = Math.max(
    0,
    safeNum(config.dynamicsOverrides?.estimatedUnitCost, 0)
  );
  const isUsingEstimatedOverride = estimatedUnitCost > 0;
  const modeledUnitCost = isUsingEstimatedOverride
    ? estimatedUnitCost
    : calculatedUnitCost;

  const denom = calculatedUnitCost > 0 ? calculatedUnitCost : 1;
  const materialsSharePct =
    calculatedUnitCost > 0 ? (materialsUnitCost / denom) * 100 : 0;
  const packagingSharePct =
    calculatedUnitCost > 0 ? (packagingUnitCost / denom) * 100 : 0;
  const variableSharePct =
    calculatedUnitCost > 0 ? (productionVariableUnitCost / denom) * 100 : 0;

  const dynamics: UnitCostDynamicsResult = {
    materialsUnitCost,
    packagingUnitCost,
    productionVariableUnitCost,
    calculatedUnitCost,
    estimatedUnitCost,
    modeledUnitCost,
    isUsingEstimatedOverride,
    materialsSharePct,
    packagingSharePct,
    variableSharePct,
    dailyCapacity: restaurant.effectiveDailyCapacity,
    monthlyCapacity: restaurant.effectiveMonthlyCapacity,
    employeesIndicated: 0,
  };

  return {
    restaurant,
    productionBridge,
    bom,
    packaging,
    variableCosts,
    dynamics,
  };
}

/**
 * Default starter configuration modelled directly on family restaurant.xlsx:
 * 20 tables × 4 guests × 8 servings/day (2 shifts × 8h ÷ 2h cycle) = 640 potential guests/day,
 * 20% initial occupancy (128 guests/day), 10-portion kitchen prep batch,
 * starter ingredients, take-away/service packaging, and kitchen utilities.
 */
export function createDefaultFamilyRestaurantConfig(): FamilyRestaurantProductConfig {
  return {
    restaurant: {
      diningAreas: [
        {
          id: 'area-main',
          name: 'Main Dining Room',
          numberOfTables: 20,
          guestsPerTable: 4,
          shiftHours: 8,
          shiftsPerDay: 2,
          tableCycleTimeMinutes: 120,
        },
      ],
      kitchenBatchPortions: 10,
      salesMixPct: 100,
      expectedOccupancyPct: 20,
    },
    bomComponents: [
      {
        id: 'rest-bom-1',
        name: 'Primary Protein / Main',
        unitOfMeasure: 'kg',
        unitsRequiredPerBatch: 2.5,
        unitDivider: 1,
        packSizeUnits: 10,
        packCost: 650,
        batchConsumablesCost: 5,
        surplusWasted: false,
      },
      {
        id: 'rest-bom-2',
        name: 'Fresh Produce & Sides',
        unitOfMeasure: 'kg',
        unitsRequiredPerBatch: 3,
        unitDivider: 1,
        packSizeUnits: 15,
        packCost: 270,
        batchConsumablesCost: 3,
        surplusWasted: true,
      },
      {
        id: 'rest-bom-3',
        name: 'Sauces, Oils & Seasoning',
        unitOfMeasure: 'L',
        unitsRequiredPerBatch: 0.8,
        unitDivider: 1,
        packSizeUnits: 5,
        packCost: 185,
        batchConsumablesCost: 2,
        surplusWasted: false,
      },
    ],
    packagingLevels: [
      {
        id: 'rest-pkg-1',
        name: 'Primary Service / Take-Away Box',
        containsCount: 1,
        componentCost: 1.50,
        wastePct: 0,
      },
      {
        id: 'rest-pkg-2',
        name: 'Carry Bag & Napkin Set',
        containsCount: 2,
        componentCost: 1.00,
        wastePct: 0,
      },
    ],
    variableCosts: [
      {
        id: 'rest-var-elec',
        name: 'Kitchen Electricity',
        basis: 'per_batch',
        usage: 4,
        usageUnit: 'kWh',
        unitRate: 3.50,
      },
      {
        id: 'rest-var-gas',
        name: 'Cooking Gas',
        basis: 'per_batch',
        usage: 1.5,
        usageUnit: 'kg',
        unitRate: 11.00,
      },
      {
        id: 'rest-var-water',
        name: 'Water & Dishwashing',
        basis: 'per_batch',
        usage: 0.25,
        usageUnit: 'kL',
        unitRate: 24.00,
      },
      {
        id: 'rest-var-maint',
        name: 'Kitchen Equipment Maintenance',
        basis: 'per_batch',
        usage: 1,
        usageUnit: 'batch',
        unitRate: 6.50,
      },
    ],
    dynamicsOverrides: {
      estimatedUnitCost: 0,
      referenceBatchSizeOverride: 0,
    },
  };
}
