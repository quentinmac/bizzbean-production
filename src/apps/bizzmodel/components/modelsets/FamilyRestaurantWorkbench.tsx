import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Lock,
  Trash2,
} from 'lucide-react';
import { FamilyRestaurantProductConfig } from './modelSetTypes';
import { calculateFamilyRestaurantFull } from './familyRestaurantEngine';
import { RestaurantProductionCalculatorPanel } from './RestaurantProductionCalculatorPanel';
import { BillOfMaterialsPanel } from './BillOfMaterialsPanel';
import { PackagingCostsPanel } from './PackagingCostsPanel';
import { ProductionVariableCostsPanel } from './ProductionVariableCostsPanel';
import { UnitCostDynamicsPanel } from './UnitCostDynamicsPanel';

export type FamilyRestaurantCalculatorTabId =
  | 'production'
  | 'bom'
  | 'packaging'
  | 'variable'
  | 'dynamics';

const RESTAURANT_CALCULATOR_STEPS: Array<{
  id: FamilyRestaurantCalculatorTabId;
  num: string;
  label: string;
}> = [
  { id: 'production', num: '01', label: 'production' },
  { id: 'bom', num: '02', label: 'bill of materials' },
  { id: 'packaging', num: '03', label: 'packaging' },
  { id: 'variable', num: '04', label: 'variable costs' },
  { id: 'dynamics', num: '05', label: 'unit cost dynamics' },
];

interface FamilyRestaurantWorkbenchProps {
  theme?: 'light' | 'dark';
  productId: string;
  productName: string;
  startMonth: number;
  isPredetermined: boolean;
  canRemove: boolean;
  defaultExpanded?: boolean;
  config: FamilyRestaurantProductConfig;
  productionDaysPerMonth: number;
  productionDaysPerAnnum: number;
  onChangeName: (name: string) => void;
  onChangeStartMonth: (month: number) => void;
  onChangeConfig: (
    updatedConfig: FamilyRestaurantProductConfig,
    derivedDynamics: { unitCost: number; dailyCapacity: number; expectedDailyGuests: number }
  ) => void;
  onRemove?: () => void;
  onOpenResultsTab?: () => void;
}

/**
 * Hospitality — Family Restaurant Model-Set Workbench
 * Reuses the identical calm tabbed design template as Manufacturing Batch Lots,
 * with a restaurant-adapted Production Calculator and 5 tabs (no Employee Calculator).
 */
export const FamilyRestaurantWorkbench: React.FC<FamilyRestaurantWorkbenchProps> = ({
  theme = 'light',
  productName,
  startMonth,
  isPredetermined,
  canRemove,
  defaultExpanded = true,
  config,
  productionDaysPerMonth,
  productionDaysPerAnnum,
  onChangeName,
  onChangeStartMonth,
  onChangeConfig,
  onRemove,
  onOpenResultsTab,
}) => {
  const isDark = theme === 'dark';
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [activeTab, setActiveTab] =
    useState<FamilyRestaurantCalculatorTabId>('production');

  const fullResult = useMemo(
    () =>
      calculateFamilyRestaurantFull(
        config,
        productionDaysPerMonth,
        productionDaysPerAnnum
      ),
    [config, productionDaysPerMonth, productionDaysPerAnnum]
  );

  const emitConfigUpdate = (nextConfig: FamilyRestaurantProductConfig) => {
    const nextResult = calculateFamilyRestaurantFull(
      nextConfig,
      productionDaysPerMonth,
      productionDaysPerAnnum
    );
    onChangeConfig(nextConfig, {
      unitCost: Number(nextResult.dynamics.modeledUnitCost.toFixed(4)),
      dailyCapacity: nextResult.dynamics.dailyCapacity,
      expectedDailyGuests: nextResult.restaurant.expectedDailyGuests,
    });
  };

  const tabValues: Record<FamilyRestaurantCalculatorTabId, string> = {
    production: `${fullResult.restaurant.effectiveDailyCapacity.toLocaleString()}/day`,
    bom: fullResult.bom.totalMaterialsUnitCost.toFixed(2),
    packaging: fullResult.packaging.totalPackagingUnitCost.toFixed(2),
    variable: fullResult.variableCosts.totalVariableUnitCost.toFixed(2),
    dynamics: `${fullResult.dynamics.modeledUnitCost.toFixed(2)}/u`,
  };

  const activeIdx = RESTAURANT_CALCULATOR_STEPS.findIndex((s) => s.id === activeTab);
  const prevStep = activeIdx > 0 ? RESTAURANT_CALCULATOR_STEPS[activeIdx - 1] : null;
  const nextStep =
    activeIdx < RESTAURANT_CALCULATOR_STEPS.length - 1
      ? RESTAURANT_CALCULATOR_STEPS[activeIdx + 1]
      : null;

  const capacitySubtitle = `${fullResult.restaurant.totalTables} tables · ${fullResult.restaurant.totalSeats} seats${
    fullResult.restaurant.salesMixPct < 100
      ? ` · ${fullResult.restaurant.salesMixPct}% mix share`
      : ''
  }`;

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-colors ${
        isDark
          ? 'bg-[#0E1322] border-[#222F4C]'
          : 'bg-white border-[#D8CEBC]'
      }`}
    >
      {/* Product / Menu Stream Header Strip */}
      <div
        className={`p-4 flex flex-wrap items-center justify-between gap-4 border-b ${
          isDark
            ? 'bg-[#121A2F]/70 border-[#222F4C]'
            : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        {/* Left: Stream Name & Start Month */}
        <div className="flex flex-wrap items-center gap-3 flex-grow min-w-[240px]">
          <div className="flex items-center gap-2 min-w-[200px] flex-grow max-w-xs">
            {isPredetermined ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold lowercase text-slate-900 dark:text-white">
                  {productName}
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span>predetermined</span>
                </span>
              </div>
            ) : (
              <input
                type="text"
                value={productName}
                onChange={(e) => onChangeName(e.target.value)}
                placeholder="Menu Category / Cover Name"
                aria-label="Product or menu category name"
                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold lowercase focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                  isDark
                    ? 'bg-[#0E1322] border-[#252E4A] text-white'
                    : 'bg-white border-[#D8CEBC] text-slate-900'
                }`}
              />
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#2E5E88] dark:text-[#6BA3D6] shrink-0" />
            <select
              value={startMonth || 1}
              onChange={(e) => onChangeStartMonth(Number(e.target.value))}
              aria-label="Start month"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                isDark
                  ? 'bg-[#0E1322] border-[#252E4A] text-white'
                  : 'bg-white border-[#D8CEBC] text-slate-900'
              }`}
            >
              {Array.from({ length: 12 }).map((_, mIdx) => (
                <option key={mIdx + 1} value={mIdx + 1}>
                  Start: Month {mIdx + 1} (M{mIdx + 1})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Clean Unboxed Live Readout + Expand / Delete */}
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <div className="flex items-center gap-3 text-xs tabular-nums">
            <span className="text-slate-500 dark:text-slate-400">
              unit cost:{' '}
              <strong className="text-[#2E5E88] dark:text-[#6BA3D6]">
                {fullResult.dynamics.modeledUnitCost.toFixed(2)}
              </strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              capacity:{' '}
              <strong className="text-slate-900 dark:text-white">
                {fullResult.dynamics.dailyCapacity.toLocaleString()} guests/d
              </strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              seats:{' '}
              <strong className="text-slate-900 dark:text-white">
                {fullResult.restaurant.totalSeats}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {canRemove && !isPredetermined && onRemove && (
              <button
                type="button"
                onClick={onRemove}
                title="Remove product"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap ${
                isDark
                  ? 'border-[#252E4A] text-slate-300 hover:bg-slate-800'
                  : 'border-[#D8CEBC] text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{isExpanded ? 'collapse' : 'configure'}</span>
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable 5-Calculator Workbench (No Employee Calculator) */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* 5-Calculator Segmented Stepper Navigation */}
          <div
            role="tablist"
            aria-label="Hospitality Family Restaurant Calculators"
            className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 p-1.5 rounded-xl border ${
              isDark
                ? 'bg-[#090D18] border-[#222F4C]'
                : 'bg-[#F5F2EC] border-[#D8CEBC]'
            }`}
          >
            {RESTAURANT_CALCULATOR_STEPS.map((step) => {
              const isActive = activeTab === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(step.id)}
                  className={`px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5E88] ${
                    isActive
                      ? 'bg-[#2E5E88] text-white shadow-xs'
                      : isDark
                      ? 'text-slate-300 hover:bg-[#141A2E]'
                      : 'text-slate-700 hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[10px] font-bold tabular-nums ${
                        isActive ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {step.num}
                    </span>
                    <span
                      className={`text-[11px] font-bold tabular-nums truncate ${
                        isActive
                          ? 'text-white'
                          : 'text-[#2E5E88] dark:text-[#6BA3D6]'
                      }`}
                    >
                      {tabValues[step.id]}
                    </span>
                  </div>
                  <span className="block text-[11px] font-bold lowercase truncate mt-0.5">
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Calculator Viewport */}
          <div className="pt-1">
            {activeTab === 'production' && (
              <RestaurantProductionCalculatorPanel
                theme={theme}
                config={config.restaurant}
                summary={fullResult.restaurant}
                onChange={(restaurant) =>
                  emitConfigUpdate({ ...config, restaurant })
                }
              />
            )}

            {activeTab === 'bom' && (
              <BillOfMaterialsPanel
                theme={theme}
                stepNumber={2}
                unitLabel="guests"
                components={config.bomComponents}
                summary={fullResult.bom}
                production={fullResult.productionBridge}
                onChange={(bomComponents) =>
                  emitConfigUpdate({ ...config, bomComponents })
                }
              />
            )}

            {activeTab === 'packaging' && (
              <PackagingCostsPanel
                theme={theme}
                stepNumber={3}
                levels={config.packagingLevels}
                summary={fullResult.packaging}
                onChange={(packagingLevels) =>
                  emitConfigUpdate({ ...config, packagingLevels })
                }
              />
            )}

            {activeTab === 'variable' && (
              <ProductionVariableCostsPanel
                theme={theme}
                stepNumber={4}
                batchSourceLabel="kitchen prep batch"
                items={config.variableCosts}
                summary={fullResult.variableCosts}
                production={fullResult.productionBridge}
                referenceBatchSizeOverride={
                  config.dynamicsOverrides?.referenceBatchSizeOverride ?? 0
                }
                onChange={(variableCosts) =>
                  emitConfigUpdate({ ...config, variableCosts })
                }
                onChangeReferenceBatchOverride={(referenceBatchSizeOverride) =>
                  emitConfigUpdate({
                    ...config,
                    dynamicsOverrides: {
                      ...config.dynamicsOverrides,
                      referenceBatchSizeOverride,
                    },
                  })
                }
              />
            )}

            {activeTab === 'dynamics' && (
              <UnitCostDynamicsPanel
                theme={theme}
                stepNumber={5}
                capacitySubtitle={capacitySubtitle}
                hideEmployeeMetric={true}
                productName={productName}
                fullResult={{
                  production: fullResult.productionBridge,
                  bom: fullResult.bom,
                  packaging: fullResult.packaging,
                  variableCosts: fullResult.variableCosts,
                  dynamics: fullResult.dynamics,
                }}
                overrides={config.dynamicsOverrides}
                onChangeOverrides={(dynamicsOverrides) =>
                  emitConfigUpdate({ ...config, dynamicsOverrides })
                }
                onJumpToCalculator={(tabId) => {
                  if (tabId !== 'employees') setActiveTab(tabId);
                }}
                onOpenResultsTab={onOpenResultsTab}
              />
            )}
          </div>

          {/* Stepper Footer Navigation */}
          <div className="pt-3 border-t border-slate-200 dark:border-[#222F4C] flex items-center justify-between gap-2">
            <div>
              {prevStep && (
                <button
                  type="button"
                  onClick={() => setActiveTab(prevStep.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap ${
                    isDark
                      ? 'border-[#252E4A] text-slate-300 hover:bg-slate-800'
                      : 'border-[#D8CEBC] text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>
                    {prevStep.num}. {prevStep.label}
                  </span>
                </button>
              )}
            </div>

            <div>
              {nextStep && (
                <button
                  type="button"
                  onClick={() => setActiveTab(nextStep.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>
                    next: {nextStep.num}. {nextStep.label}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
