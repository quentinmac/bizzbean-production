import React from 'react';
import { Plus, Trash2, Truck, Clock } from 'lucide-react';
import {
  ProductionVariableCostItem,
  VariableCostSummaryResult,
  VehicleLogisticsConfig,
  VehicleLogisticsResult,
} from './modelSetTypes';
import { formatHoursAsHHMM } from './batchLotsEngine';
import { formatUnitCostValue } from './continuousProductionEngine';

interface VehicleLogisticsCostsPanelProps {
  theme?: 'light' | 'dark';
  stepNumber?: number;
  unitLabel?: string;                  // e.g. 'installation', 'trip', 'delivery', 'lesson'
  linkedDailyKm: number;               // Auto-linked daily km from Production Calculator
  config: VehicleLogisticsConfig;
  result: VehicleLogisticsResult;
  onChange: (updated: VehicleLogisticsConfig) => void;
  // Optional extra non-vehicle production variable costs (e.g. permits, site power, sub-services)
  extraVariableCosts?: ProductionVariableCostItem[];
  extraVariableSummary?: VariableCostSummaryResult;
  onChangeExtraVariableCosts?: (updated: ProductionVariableCostItem[]) => void;
}

/**
 * REUSABLE VEHICLE / LOGISTICS VARIABLE COSTS CALCULATOR PANEL
 * Faithfully models installations services.xlsx (Rows 75–101) and is built as a
 * self-contained reusable component for Services (Installation Services) as well
 * as upcoming Mobility / Logistics model-sets (Truck Operator, Taxi Operator,
 * Tractor Operator, Driving School, etc.).
 */
export const VehicleLogisticsCostsPanel: React.FC<
  VehicleLogisticsCostsPanelProps
> = ({
  theme = 'light',
  stepNumber = 5,
  unitLabel = 'installation',
  linkedDailyKm,
  config,
  result,
  onChange,
  extraVariableCosts = [],
  extraVariableSummary,
  onChangeExtraVariableCosts,
}) => {
  const isDark = theme === 'dark';

  const handleField = <K extends keyof VehicleLogisticsConfig>(
    field: K,
    value: VehicleLogisticsConfig[K]
  ) => {
    onChange({ ...config, [field]: value });
  };

  const handleAddExtraItem = () => {
    if (!onChangeExtraVariableCosts) return;
    const newItem: ProductionVariableCostItem = {
      id: `var-extra-${Date.now()}`,
      name: `Additional Variable Cost ${extraVariableCosts.length + 1}`,
      basis: 'per_unit',
      usage: 1,
      usageUnit: unitLabel,
      unitRate: 0,
    };
    onChangeExtraVariableCosts([...extraVariableCosts, newItem]);
  };

  const handleUpdateExtraItem = <K extends keyof ProductionVariableCostItem>(
    id: string,
    field: K,
    value: ProductionVariableCostItem[K]
  ) => {
    if (!onChangeExtraVariableCosts) return;
    onChangeExtraVariableCosts(
      extraVariableCosts.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveExtraItem = (id: string) => {
    if (!onChangeExtraVariableCosts) return;
    onChangeExtraVariableCosts(extraVariableCosts.filter((i) => i.id !== id));
  };

  const inputCls = `w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
    isDark
      ? 'bg-[#141A2E] border-[#252E4A] text-white'
      : 'bg-[#F0F5FA] border-[#C9D8E8] text-slate-900'
  }`;

  const textInputCls = `w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
    isDark
      ? 'bg-[#141A2E] border-[#252E4A] text-white'
      : 'bg-white border-[#D8CEBC] text-slate-900'
  }`;

  const extraUnitCost = extraVariableSummary?.totalVariableUnitCost ?? 0;
  const combinedUnitCost = result.costPerUnit + extraUnitCost;

  const perKmRows = [
    {
      label: 'per km — fuel costs',
      formula: `${config.fuelConsumptionPer100Km} L/100km × ${config.fuelCostPerLitre.toFixed(2)}/L`,
      value: result.fuelCostPerKm,
    },
    {
      label: 'per km — oil costs',
      formula: `${config.oilConsumptionPer1000Km} L/1,000km × ${config.oilCostPerLitre.toFixed(2)}/L`,
      value: result.oilCostPerKm,
    },
    {
      label: 'per km — parts, panel & sublets',
      formula: 'direct CPK allowance',
      value: result.partsPanelSubletsPerKm,
    },
    {
      label: 'per km — tyre costs',
      formula: `${config.tyreCostPerWheelCpk.toFixed(2)}/km × ${config.numberOfWheels} wheels`,
      value: result.tyreCostPerKm,
    },
    {
      label: 'per km — service costs',
      formula: `${config.serviceCostPerService.toLocaleString()} ÷ ${config.serviceIntervalKm.toLocaleString()} km`,
      value: result.serviceCostPerKm,
    },
  ];

  const extraResultMap = new Map(
    (extraVariableSummary?.items || []).map((r) => [r.id, r])
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-[#2E5E88] dark:text-[#6BA3D6]" />
            <span>
              {stepNumber}. Production Variable Costs — Logistics &amp; Vehicle Costing
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Calculates per-kilometre vehicle running costs (fuel, oil, parts/panel/sublets, tyres, scheduled servicing) and allocates monthly fleet mileage directly into variable cost per {unitLabel}.
          </p>
        </div>
      </div>

      {/* Main Split: Vehicle Inputs (Left) + Per-Km Breakdown & Summary Statistics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Vehicle Details & Running Cost Rates (Excel R76–R89) */}
        <div
          className={`lg:col-span-6 p-4 rounded-xl border space-y-3 ${
            isDark
              ? 'bg-[#0E1322] border-[#222F4C]'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#222F4C]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              vehicle details &amp; cpk parameters
            </span>
            <span className="text-[10px] text-slate-400">
              reusable logistics module
            </span>
          </div>

          {/* Vehicle Label */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 lowercase block">
              vehicle / fleet description
            </label>
            <input
              type="text"
              value={config.vehicleLabel || ''}
              onChange={(e) => handleField('vehicleLabel', e.target.value)}
              placeholder="e.g. Service / Installation Van"
              className={textInputCls}
            />
          </div>

          {/* Service & Wheel Specs (Excel R77–R79) */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 lowercase block">
                service interval (km)
              </label>
              <input
                type="number"
                min="100"
                step="1000"
                value={config.serviceIntervalKm}
                onChange={(e) =>
                  handleField('serviceIntervalKm', Math.max(0, Number(e.target.value) || 0))
                }
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 lowercase block">
                days per service
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={config.daysPerService}
                onChange={(e) =>
                  handleField('daysPerService', Math.max(0, Number(e.target.value) || 0))
                }
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 lowercase block">
                number of wheels
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={config.numberOfWheels}
                onChange={(e) =>
                  handleField('numberOfWheels', Math.max(0, Number(e.target.value) || 0))
                }
                className={inputCls}
              />
            </div>
          </div>

          {/* Fuel & Oil Prices & Consumption (Excel R80–R85) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 lowercase block">
                fuel — cost per litre
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={config.fuelCostPerLitre}
                onChange={(e) =>
                  handleField('fuelCostPerLitre', Math.max(0, Number(e.target.value) || 0))
                }
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 lowercase block">
                fuel consumption (L / 100 km)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={config.fuelConsumptionPer100Km}
                onChange={(e) =>
                  handleField('fuelConsumptionPer100Km', Math.max(0, Number(e.target.value) || 0))
                }
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 lowercase block">
                oil — cost per litre
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={config.oilCostPerLitre}
                onChange={(e) =>
                  handleField('oilCostPerLitre', Math.max(0, Number(e.target.value) || 0))
                }
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 lowercase block">
                oil consumption (L / 1,000 km)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={config.oilConsumptionPer1000Km}
                onChange={(e) =>
                  handleField('oilConsumptionPer1000Km', Math.max(0, Number(e.target.value) || 0))
                }
                className={inputCls}
              />
            </div>
          </div>

          {/* CPK & Service Cost Inputs (Excel R86–R88) */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 lowercase block">
                parts, panel &amp; sublets (cpk)
              </label>
              <input
                type="number"
                min="0"
                step="0.05"
                value={config.partsPanelSubletsCpk}
                onChange={(e) =>
                  handleField('partsPanelSubletsCpk', Math.max(0, Number(e.target.value) || 0))
                }
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 lowercase block">
                tyre cost / wheel (cpk)
              </label>
              <input
                type="number"
                min="0"
                step="0.05"
                value={config.tyreCostPerWheelCpk}
                onChange={(e) =>
                  handleField('tyreCostPerWheelCpk', Math.max(0, Number(e.target.value) || 0))
                }
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 lowercase block">
                service cost / service
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={config.serviceCostPerService}
                onChange={(e) =>
                  handleField('serviceCostPerService', Math.max(0, Number(e.target.value) || 0))
                }
                className={inputCls}
              />
            </div>
          </div>

          {/* Daily Kilometre Base Override (Excel R89) */}
          <div className="pt-2 border-t border-slate-200 dark:border-[#222F4C] flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 lowercase block">
                daily kilometre base override (optional)
              </span>
              <span className="text-[10px] text-slate-400 block">
                0 = auto-linked from production calculator ({linkedDailyKm.toLocaleString()} km/day)
              </span>
            </div>
            <input
              type="number"
              min="0"
              step="10"
              value={config.kilometerBaseOverride || ''}
              placeholder={`${linkedDailyKm} (auto)`}
              onChange={(e) =>
                handleField('kilometerBaseOverride', Math.max(0, Number(e.target.value) || 0))
              }
              className={`w-32 px-2.5 py-1.5 rounded-lg border text-xs font-bold text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                isDark
                  ? 'bg-[#141A2E] border-[#252E4A] text-white'
                  : 'bg-[#F0F5FA] border-[#C9D8E8] text-slate-900'
              }`}
            />
          </div>
        </div>

        {/* Right: Per-Km Cost Breakdown, Service Provision & Summary Statistics (Excel R90–R101) */}
        <div
          className={`lg:col-span-6 p-4 rounded-xl border flex flex-col justify-between space-y-4 ${
            isDark
              ? 'bg-[#0E1322] border-[#222F4C]'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#222F4C]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                per-kilometre cost breakdown
              </span>
              <span className="text-[10px] font-bold text-[#2E5E88] dark:text-[#6BA3D6] tabular-nums">
                {result.kilometerBaseDaily.toLocaleString()} km/day base
              </span>
            </div>

            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {perKmRows.map((row) => (
                  <tr key={row.label}>
                    <td className="py-1.5 pr-2">
                      <span className="font-bold text-slate-700 dark:text-slate-200 block">
                        {row.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{row.formula}</span>
                    </td>
                    <td className="py-1.5 pl-2 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatUnitCostValue(row.value)}
                    </td>
                  </tr>
                ))}
                <tr className={isDark ? 'bg-[#121A2F]/70' : 'bg-slate-50'}>
                  <td className="py-2 px-2 font-bold text-slate-900 dark:text-white">
                    per km — total cost
                  </td>
                  <td className="py-2 px-2 text-right font-bold tabular-nums text-sm text-[#2E5E88] dark:text-[#6BA3D6]">
                    {formatUnitCostValue(result.totalCostPerKm)} / km
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Vehicle Service Provision Hours (Excel R90–R91) */}
            <div
              className={`p-3 rounded-xl border grid grid-cols-2 gap-3 text-xs ${
                isDark
                  ? 'bg-[#0C111E] border-[#222F4C]'
                  : 'bg-[#FAF8F5] border-[#D8CEBC]'
              }`}
            >
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 lowercase">
                  <Clock className="h-3 w-3 text-[#2E5E88] dark:text-[#6BA3D6]" />
                  <span>provision for service (hrs/day)</span>
                </span>
                <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-white block mt-0.5">
                  {result.serviceProvisionHoursPerDay.toFixed(2)} hrs ({formatHoursAsHHMM(result.serviceProvisionHoursPerDay)})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
                  vehicle calculated hours / day
                </span>
                <span className="text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-400 block mt-0.5">
                  {result.calculatedVehicleHoursPerDay.toFixed(2)} hrs ({formatHoursAsHHMM(result.calculatedVehicleHoursPerDay)})
                </span>
              </div>
            </div>

            {/* Summary Vehicle Statistics (Excel R98–R101) */}
            <div className="space-y-1.5 text-xs pt-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  monthly kilometres travelled
                </span>
                <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">
                  {result.monthlyKmTravelled.toLocaleString()} km
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  monthly {unitLabel}s (capacity)
                </span>
                <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">
                  {result.monthlyOutputUnits.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  monthly vehicle running cost
                </span>
                <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">
                  {result.monthlyLogisticsCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Highlighted Cost per Installation / Unit Footer (Excel R101) */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
              isDark
                ? 'bg-[#2E5E88]/20 border-[#2E5E88]/40'
                : 'bg-[#EEF4FA] border-[#2E5E88]/30'
            }`}
          >
            <div>
              <span className="text-xs font-bold text-[#2E5E88] dark:text-[#6BA3D6] block">
                logistics cost per {unitLabel}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {formatUnitCostValue(result.totalCostPerKm)}/km × {result.monthlyKmTravelled.toLocaleString()} km ÷ {result.monthlyOutputUnits.toLocaleString()} {unitLabel}s
              </span>
            </div>
            <span className="text-xl font-bold tabular-nums text-[#2E5E88] dark:text-white">
              {formatUnitCostValue(result.costPerUnit)}
            </span>
          </div>
        </div>
      </div>

      {/* Optional Additional Production Variable Costs (non-vehicle direct job costs) */}
      {onChangeExtraVariableCosts && (
        <div
          className={`p-4 rounded-xl border space-y-3 ${
            isDark
              ? 'bg-[#0C111E] border-[#222F4C]'
              : 'bg-[#FAF8F5] border-[#D8CEBC]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                additional production variable costs (optional)
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Add any extra per-{unitLabel} variable expenses (e.g. site permits, toll fees, call-out testing, generator fuel) alongside vehicle logistics.
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddExtraItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>add variable cost</span>
            </button>
          </div>

          {extraVariableCosts.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#222F4C]">
              <table className="w-full text-xs border-collapse min-w-[580px]">
                <thead>
                  <tr
                    className={`border-b text-[11px] ${
                      isDark
                        ? 'bg-[#121A2F] border-[#222F4C] text-slate-300'
                        : 'bg-[#F5F2EC] border-[#D8CEBC] text-slate-700'
                    }`}
                  >
                    <th className="py-2 px-3 text-left font-bold min-w-[180px]">cost description</th>
                    <th className="py-2 px-2 text-right font-bold w-24">usage / {unitLabel}</th>
                    <th className="py-2 px-2 text-center font-bold w-24">unit</th>
                    <th className="py-2 px-2 text-right font-bold w-28">unit rate</th>
                    <th className="py-2 px-3 text-right font-bold w-28 text-[#2E5E88] dark:text-[#6BA3D6]">
                      cost / {unitLabel}
                    </th>
                    <th className="py-2 px-2 w-9"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {extraVariableCosts.map((item) => {
                    const res = extraResultMap.get(item.id);
                    return (
                      <tr key={item.id}>
                        <td className="py-1.5 px-3">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateExtraItem(item.id, 'name', e.target.value)}
                            className={textInputCls}
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.usage}
                            onChange={(e) =>
                              handleUpdateExtraItem(
                                item.id,
                                'usage',
                                Math.max(0, Number(e.target.value) || 0)
                              )
                            }
                            className={inputCls}
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={item.usageUnit}
                            onChange={(e) =>
                              handleUpdateExtraItem(item.id, 'usageUnit', e.target.value)
                            }
                            className={`w-full px-1.5 py-1.5 rounded-lg border text-xs text-center font-bold focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                              isDark
                                ? 'bg-[#141A2E] border-[#252E4A] text-white'
                                : 'bg-white border-[#D8CEBC] text-slate-800'
                            }`}
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.unitRate}
                            onChange={(e) =>
                              handleUpdateExtraItem(
                                item.id,
                                'unitRate',
                                Math.max(0, Number(e.target.value) || 0)
                              )
                            }
                            className={inputCls}
                          />
                        </td>
                        <td className="py-1.5 px-3 text-right font-bold tabular-nums text-[#2E5E88] dark:text-[#6BA3D6]">
                          {formatUnitCostValue(res?.unitCost ?? 0)}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraItem(item.id)}
                            title={`Remove ${item.name}`}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Combined Total Strip when extra costs exist */}
          {extraVariableCosts.length > 0 && (
            <div className="flex items-center justify-between pt-1 text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">
                total production variable cost (vehicle logistics + additional items)
              </span>
              <span className="text-sm tabular-nums text-[#2E5E88] dark:text-[#6BA3D6]">
                {formatUnitCostValue(combinedUnitCost)} / {unitLabel}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
