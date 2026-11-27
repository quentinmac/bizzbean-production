import { VehicleLogisticsConfig, VehicleLogisticsResult } from './modelSetTypes';

const safeNum = (val: unknown, fallback = 0): number => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * REUSABLE VEHICLE / LOGISTICS VARIABLE COST CALCULATOR
 * Faithful to installations services.xlsx (Rows 75–101).
 * Designed as a standalone pure calculation engine so Services (Installation Services)
 * and Mobility / Logistics model-sets (Truck Operator, Taxi Operator, Tractor Operator,
 * Driving School, etc.) share one single source of truth for per-km & per-unit costing.
 */
export function calculateVehicleLogisticsCost(
  config: VehicleLogisticsConfig,
  linkedDailyKm: number,
  dailyOutputUnits: number,
  productionDaysPerMonth: number,
  referenceShiftHours = 8
): VehicleLogisticsResult {
  const daysMonth = Math.max(1, safeNum(productionDaysPerMonth, 21));
  const shiftHours = Math.max(0, safeNum(referenceShiftHours, 8));

  const serviceIntervalKm = Math.max(0, safeNum(config.serviceIntervalKm, 10000));
  const daysPerService = Math.max(0, safeNum(config.daysPerService, 1));
  const numberOfWheels = Math.max(0, safeNum(config.numberOfWheels, 4));

  const fuelCostPerLitre = Math.max(0, safeNum(config.fuelCostPerLitre, 0));
  const oilCostPerLitre = Math.max(0, safeNum(config.oilCostPerLitre, 0));
  const fuelConsumptionPer100Km = Math.max(0, safeNum(config.fuelConsumptionPer100Km, 0));
  const oilConsumptionPer1000Km = Math.max(0, safeNum(config.oilConsumptionPer1000Km, 0));
  const partsPanelSubletsCpk = Math.max(0, safeNum(config.partsPanelSubletsCpk, 0));
  const tyreCostPerWheelCpk = Math.max(0, safeNum(config.tyreCostPerWheelCpk, 0));
  const serviceCostPerService = Math.max(0, safeNum(config.serviceCostPerService, 0));

  const kmOverride = Math.max(0, safeNum(config.kilometerBaseOverride, 0));
  const isUsingKmOverride = kmOverride > 0;
  // Excel R89: kilometer base (=F36 unless overridden)
  const kilometerBaseDaily = isUsingKmOverride
    ? kmOverride
    : Math.max(0, safeNum(linkedDailyKm, 0));

  // Excel R90: vehicle - provision for service (hrs) = IFERROR((kmBase / serviceIntervalKm) * shiftHours * daysPerService, 0)
  const serviceProvisionHoursPerDay =
    serviceIntervalKm > 0
      ? (kilometerBaseDaily / serviceIntervalKm) * shiftHours * daysPerService
      : 0;

  // Excel R91: vehicle - calculated hours per day = shiftHours - provisionForServiceHours
  const calculatedVehicleHoursPerDay = Math.max(
    0,
    shiftHours - serviceProvisionHoursPerDay
  );

  // Per-kilometre cost breakdown (Excel R92–R97)
  // R92: per km - fuel costs = (fuelConsumptionPer100Km / 100) * fuelCostPerLitre
  const fuelCostPerKm = (fuelConsumptionPer100Km / 100) * fuelCostPerLitre;

  // R93: per km - oil costs = (oilConsumptionPer1000Km / 1000) * oilCostPerLitre
  const oilCostPerKm = (oilConsumptionPer1000Km / 1000) * oilCostPerLitre;

  // R94: per km - parts, panel & sublets
  const partsPanelSubletsPerKm = partsPanelSubletsCpk;

  // R95: per km - tyre costs = tyreCostPerWheelCpk * numberOfWheels
  const tyreCostPerKm = tyreCostPerWheelCpk * numberOfWheels;

  // R96: per km - service costs = IFERROR(serviceCostPerService / serviceIntervalKm, 0)
  const serviceCostPerKm =
    serviceIntervalKm > 0 ? serviceCostPerService / serviceIntervalKm : 0;

  // R97: per km - total cost = SUM(R92:R96)
  const totalCostPerKm =
    fuelCostPerKm +
    oilCostPerKm +
    partsPanelSubletsPerKm +
    tyreCostPerKm +
    serviceCostPerKm;

  // Summary vehicle statistics (Excel R98–R101)
  const dailyLogisticsCost = totalCostPerKm * kilometerBaseDaily;
  const monthlyKmTravelled = kilometerBaseDaily * daysMonth;
  const safeDailyUnits = Math.max(0, safeNum(dailyOutputUnits, 0));
  const monthlyOutputUnits = safeDailyUnits * daysMonth;
  const monthlyLogisticsCost = totalCostPerKm * monthlyKmTravelled;

  // R101: cost per installation/unit = IFERROR((totalCostPerKm * monthlyKmTravelled) / monthlyOutputUnits, 0)
  const costPerUnit =
    monthlyOutputUnits > 0 ? monthlyLogisticsCost / monthlyOutputUnits : 0;

  return {
    kilometerBaseDaily,
    isUsingKmOverride,
    shiftHoursReference: shiftHours,
    serviceProvisionHoursPerDay,
    calculatedVehicleHoursPerDay,
    fuelCostPerKm,
    oilCostPerKm,
    partsPanelSubletsPerKm,
    tyreCostPerKm,
    serviceCostPerKm,
    totalCostPerKm,
    dailyLogisticsCost,
    monthlyKmTravelled,
    monthlyOutputUnits,
    monthlyLogisticsCost,
    costPerUnit,
  };
}

/**
 * Default Vehicle / Logistics starter configuration matching installations services.xlsx (R76–R88):
 * 10,000 km interval · 1 day/service · 4 wheels · R20/L fuel (13 L/100km) · R50/L oil (1 L/1000km) ·
 * R1/km parts · R1/km/tyre · R1,000 service => R7.75/km total => R775.00 per installation at 400 km/day & 4 jobs/day.
 */
export function createDefaultVehicleLogisticsConfig(
  vehicleLabel = 'Service / Installation Vehicle'
): VehicleLogisticsConfig {
  return {
    vehicleLabel,
    serviceIntervalKm: 10000,
    daysPerService: 1,
    numberOfWheels: 4,
    fuelCostPerLitre: 20,
    oilCostPerLitre: 50,
    fuelConsumptionPer100Km: 13,
    oilConsumptionPer1000Km: 1,
    partsPanelSubletsCpk: 1,
    tyreCostPerWheelCpk: 1,
    serviceCostPerService: 1000,
    kilometerBaseOverride: 0,
  };
}
