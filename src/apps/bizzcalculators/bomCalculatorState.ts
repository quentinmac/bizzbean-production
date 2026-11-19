import {
  BomComponent,
  BomSummaryResult,
  PackagingLevel,
  PackagingSummaryResult,
  ProductionSummaryResult,
  ProductionVariableCostItem,
  UnitCostDynamicsOverrides,
  UnitCostDynamicsResult,
  VariableCostSummaryResult,
} from '../bizzmodel/components/modelsets/modelSetTypes';
import {
  calculateBillOfMaterials,
  calculatePackagingCosts,
  calculateProductionVariableCosts,
} from '../bizzmodel/components/modelsets/batchLotsEngine';

export interface BomProductEntry {
  id: string;
  name: string;
  unitsPerBatch: number;
  batchesPerDay: number;
  bomComponents: BomComponent[];
  packagingLevels: PackagingLevel[];
  variableCosts: ProductionVariableCostItem[];
  dynamicsOverrides: UnitCostDynamicsOverrides;
}

export interface BomCalculatorWorkbook {
  activeProductId: string;
  products: BomProductEntry[];
}

export interface BomProductComputedResult {
  productionBridge: ProductionSummaryResult;
  bom: BomSummaryResult;
  packaging: PackagingSummaryResult;
  variableCosts: VariableCostSummaryResult;
  dynamics: UnitCostDynamicsResult;
  dailyUnits: number;
  batchTotalCost: number;
  dailyTotalCost: number;
}

export const BOM_STORAGE_KEY = 'bizzcalculators_bom_workbook_v1';

const safeNum = (val: unknown, fallback = 0): number => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Computes full 4-module Product Costing (BOM + Packaging + Variable Costs + Unit Cost Dynamics)
 * using the exact calculation engine shared with bizzmodel.
 */
export function calculateBomProductSummary(
  product: BomProductEntry
): BomProductComputedResult {
  const unitsPerBatch = Math.max(0, safeNum(product.unitsPerBatch, 0));
  const batchesPerDay = Math.max(0, safeNum(product.batchesPerDay, 0));
  const dailyUnits = unitsPerBatch * batchesPerDay;

  const productionBridge: ProductionSummaryResult = {
    processes: [],
    bottleneckDailyCapacity: dailyUnits,
    bottleneckProcessIds: [],
    bottleneckProcessNames: ['Direct Batch'],
    bottleneckCyclesPerDay: batchesPerDay,
    bottleneckUnitsPerBatch: unitsPerBatch,
    monthlyCapacity: Math.round(dailyUnits * 22),
    annualCapacity: Math.round(dailyUnits * 264),
    totalEmployeesStandard: 0,
    productionDaysPerMonth: 22,
    productionDaysPerAnnum: 264,
  };

  const bom = calculateBillOfMaterials(product.bomComponents, productionBridge);
  const packaging = calculatePackagingCosts(product.packagingLevels);
  const variableCosts = calculateProductionVariableCosts(
    product.variableCosts,
    productionBridge,
    product.dynamicsOverrides?.referenceBatchSizeOverride
  );

  const materialsUnitCost = bom.totalMaterialsUnitCost;
  const packagingUnitCost = packaging.totalPackagingUnitCost;
  const productionVariableUnitCost = variableCosts.totalVariableUnitCost;
  const calculatedUnitCost =
    materialsUnitCost + packagingUnitCost + productionVariableUnitCost;

  const estimatedUnitCost = Math.max(
    0,
    safeNum(product.dynamicsOverrides?.estimatedUnitCost, 0)
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
    dailyCapacity: dailyUnits,
    monthlyCapacity: productionBridge.monthlyCapacity,
    employeesIndicated: 0,
  };

  const batchTotalCost = modeledUnitCost * unitsPerBatch;
  const dailyTotalCost = modeledUnitCost * dailyUnits;

  return {
    productionBridge,
    bom,
    packaging,
    variableCosts,
    dynamics,
    dailyUnits,
    batchTotalCost,
    dailyTotalCost,
  };
}

/**
 * Starter multi-product workbook tailored for mobile operators (e.g., food truck menu items)
 * so users immediately see real-world multi-product cost tracking out of the box.
 */
export function createDefaultBomWorkbook(): BomCalculatorWorkbook {
  return {
    activeProductId: 'ft-burger',
    products: [
      {
        id: 'ft-burger',
        name: 'Signature Smash Burger',
        unitsPerBatch: 10,
        batchesPerDay: 8,
        bomComponents: [
          {
            id: 'bom-beef',
            name: 'Beef Patty Mince',
            unitOfMeasure: 'kg',
            unitsRequiredPerBatch: 1.8,
            unitDivider: 1,
            packSizeUnits: 10,
            packCost: 650,
            batchConsumablesCost: 4,
            surplusWasted: false,
          },
          {
            id: 'bom-buns',
            name: 'Brioche Burger Buns',
            unitOfMeasure: 'pcs',
            unitsRequiredPerBatch: 10,
            unitDivider: 1,
            packSizeUnits: 24,
            packCost: 120,
            batchConsumablesCost: 0,
            surplusWasted: false,
          },
          {
            id: 'bom-garnish',
            name: 'Cheddar, Sauce & Greens',
            unitOfMeasure: 'kg',
            unitsRequiredPerBatch: 0.9,
            unitDivider: 1,
            packSizeUnits: 5,
            packCost: 240,
            batchConsumablesCost: 3,
            surplusWasted: true,
          },
        ],
        packagingLevels: [
          {
            id: 'pkg-wrap',
            name: 'Waxed Wrap & Clamshell Box',
            containsCount: 1,
            componentCost: 2.2,
            wastePct: 0,
          },
          {
            id: 'pkg-bag',
            name: 'Kraft Carrier Bag & Napkin',
            containsCount: 1,
            componentCost: 0.95,
            wastePct: 0,
          },
        ],
        variableCosts: [
          {
            id: 'var-gas',
            name: 'LP Gas (Griddle)',
            basis: 'per_batch',
            usage: 0.8,
            usageUnit: 'kg',
            unitRate: 28,
          },
          {
            id: 'var-gen',
            name: 'Generator Fuel',
            basis: 'per_batch',
            usage: 0.5,
            usageUnit: 'L',
            unitRate: 22,
          },
          {
            id: 'var-oil',
            name: 'Cooking Oil & Cleaning',
            basis: 'per_batch',
            usage: 1,
            usageUnit: 'batch',
            unitRate: 8.5,
          },
        ],
        dynamicsOverrides: {
          estimatedUnitCost: 0,
          referenceBatchSizeOverride: 0,
        },
      },
      {
        id: 'ft-tacos',
        name: 'Pulled Pork Street Tacos',
        unitsPerBatch: 10,
        batchesPerDay: 6,
        bomComponents: [
          {
            id: 'bom-pork',
            name: 'Slow-Braised Pork Shoulder',
            unitOfMeasure: 'kg',
            unitsRequiredPerBatch: 1.6,
            unitDivider: 1,
            packSizeUnits: 8,
            packCost: 520,
            batchConsumablesCost: 6,
            surplusWasted: false,
          },
          {
            id: 'bom-tortilla',
            name: 'Corn Tortillas (2 per serving)',
            unitOfMeasure: 'pcs',
            unitsRequiredPerBatch: 20,
            unitDivider: 1,
            packSizeUnits: 50,
            packCost: 95,
            batchConsumablesCost: 0,
            surplusWasted: false,
          },
          {
            id: 'bom-slaw',
            name: 'Fresh Slaw, Lime & Crema',
            unitOfMeasure: 'kg',
            unitsRequiredPerBatch: 0.8,
            unitDivider: 1,
            packSizeUnits: 4,
            packCost: 160,
            batchConsumablesCost: 2,
            surplusWasted: true,
          },
        ],
        packagingLevels: [
          {
            id: 'pkg-tray',
            name: 'Kraft Food Boat & Liner',
            containsCount: 1,
            componentCost: 1.75,
            wastePct: 0,
          },
          {
            id: 'pkg-utensil',
            name: 'Napkins & Wooden Fork',
            containsCount: 1,
            componentCost: 0.65,
            wastePct: 0,
          },
        ],
        variableCosts: [
          {
            id: 'var-taco-gas',
            name: 'LP Gas (Prep & Warmers)',
            basis: 'per_batch',
            usage: 0.6,
            usageUnit: 'kg',
            unitRate: 28,
          },
          {
            id: 'var-taco-gen',
            name: 'Generator Fuel',
            basis: 'per_batch',
            usage: 0.4,
            usageUnit: 'L',
            unitRate: 22,
          },
        ],
        dynamicsOverrides: {
          estimatedUnitCost: 0,
          referenceBatchSizeOverride: 0,
        },
      },
      {
        id: 'ft-coffee',
        name: 'Artisan Iced Coffee',
        unitsPerBatch: 12,
        batchesPerDay: 5,
        bomComponents: [
          {
            id: 'bom-beans',
            name: 'Espresso Coffee Beans',
            unitOfMeasure: 'kg',
            unitsRequiredPerBatch: 0.24,
            unitDivider: 1,
            packSizeUnits: 1,
            packCost: 280,
            batchConsumablesCost: 0,
            surplusWasted: false,
          },
          {
            id: 'bom-milk',
            name: 'Full-Cream / Barista Milk',
            unitOfMeasure: 'L',
            unitsRequiredPerBatch: 2.4,
            unitDivider: 1,
            packSizeUnits: 6,
            packCost: 132,
            batchConsumablesCost: 0,
            surplusWasted: false,
          },
          {
            id: 'bom-syrup',
            name: 'Ice & Vanilla Syrup',
            unitOfMeasure: 'L',
            unitsRequiredPerBatch: 0.3,
            unitDivider: 1,
            packSizeUnits: 1,
            packCost: 110,
            batchConsumablesCost: 4,
            surplusWasted: false,
          },
        ],
        packagingLevels: [
          {
            id: 'pkg-cup',
            name: 'Clear Cup, Dome Lid & Straw',
            containsCount: 1,
            componentCost: 2.1,
            wastePct: 0,
          },
        ],
        variableCosts: [
          {
            id: 'var-coffee-pwr',
            name: 'Espresso Power / Generator',
            basis: 'per_batch',
            usage: 0.35,
            usageUnit: 'L',
            unitRate: 22,
          },
        ],
        dynamicsOverrides: {
          estimatedUnitCost: 0,
          referenceBatchSizeOverride: 0,
        },
      },
    ],
  };
}

export function createNewBomProduct(indexNumber: number): BomProductEntry {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id: `prod-${uid}`,
    name: `Menu Item ${indexNumber}`,
    unitsPerBatch: 10,
    batchesPerDay: 5,
    bomComponents: [
      {
        id: `bom-${uid}-1`,
        name: 'Primary Ingredient',
        unitOfMeasure: 'kg',
        unitsRequiredPerBatch: 1,
        unitDivider: 1,
        packSizeUnits: 5,
        packCost: 250,
        batchConsumablesCost: 0,
        surplusWasted: false,
      },
    ],
    packagingLevels: [
      {
        id: `pkg-${uid}-1`,
        name: 'Primary Unit Pack',
        containsCount: 1,
        componentCost: 1.5,
        wastePct: 0,
      },
    ],
    variableCosts: [
      {
        id: `var-${uid}-1`,
        name: 'Gas / Power',
        basis: 'per_batch',
        usage: 1,
        usageUnit: 'batch',
        unitRate: 15,
      },
    ],
    dynamicsOverrides: {
      estimatedUnitCost: 0,
      referenceBatchSizeOverride: 0,
    },
  };
}

export function duplicateBomProduct(source: BomProductEntry): BomProductEntry {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    ...source,
    id: `prod-${uid}`,
    name: `${source.name} (Copy)`,
    bomComponents: source.bomComponents.map((c, idx) => ({
      ...c,
      id: `bom-${uid}-${idx}`,
    })),
    packagingLevels: source.packagingLevels.map((p, idx) => ({
      ...p,
      id: `pkg-${uid}-${idx}`,
    })),
    variableCosts: source.variableCosts.map((v, idx) => ({
      ...v,
      id: `var-${uid}-${idx}`,
    })),
    dynamicsOverrides: { ...source.dynamicsOverrides },
  };
}

export function zeroBomProductValues(product: BomProductEntry): BomProductEntry {
  return {
    ...product,
    unitsPerBatch: 0,
    batchesPerDay: 0,
    bomComponents: product.bomComponents.map((c) => ({
      ...c,
      unitsRequiredPerBatch: 0,
      packCost: 0,
      batchConsumablesCost: 0,
    })),
    packagingLevels: product.packagingLevels.map((p) => ({
      ...p,
      componentCost: 0,
      wastePct: 0,
    })),
    variableCosts: product.variableCosts.map((v) => ({
      ...v,
      usage: 0,
      unitRate: 0,
    })),
    dynamicsOverrides: {
      estimatedUnitCost: 0,
      referenceBatchSizeOverride: 0,
    },
  };
}

export function loadBomWorkbook(): BomCalculatorWorkbook {
  const defaults = createDefaultBomWorkbook();
  try {
    const raw = localStorage.getItem(BOM_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<BomCalculatorWorkbook>;
    if (Array.isArray(parsed.products) && parsed.products.length > 0) {
      const validActive = parsed.products.some(
        (p) => p.id === parsed.activeProductId
      )
        ? (parsed.activeProductId as string)
        : parsed.products[0].id;
      return {
        activeProductId: validActive,
        products: parsed.products,
      };
    }
  } catch {
    // Fallback to clean defaults
  }
  return defaults;
}

export function saveBomWorkbook(workbook: BomCalculatorWorkbook): void {
  try {
    localStorage.setItem(BOM_STORAGE_KEY, JSON.stringify(workbook));
  } catch {
    // Ignore storage quota issues
  }
}
