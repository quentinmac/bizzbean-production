import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Lock,
  Trash2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { TimeSlotRentalsProductConfig } from './modelSetTypes';
import { calculateTimeSlotRentalsFull } from './timeSlotRentalsEngine';
import { TimeSlotRentalsProductionCalculatorPanel } from './TimeSlotRentalsProductionCalculatorPanel';
import { EmployeeCalculatorPanel } from './EmployeeCalculatorPanel';

export type TimeSlotRentalsCalculatorTabId = 'production' | 'employees' | 'trading';

const TIME_SLOT_RENTALS_STEPS: Array<{
  id: TimeSlotRentalsCalculatorTabId;
  num: string;
  label: string;
}> = [
  { id: 'production', num: '01', label: 'production calculator' },
  { id: 'employees', num: '02', label: 'employee calculator' },
  { id: 'trading', num: '03', label: 'pricing & trading' },
];

interface ServicesTimeSlotRentalsWorkbenchProps {
  theme?: 'light' | 'dark';
  productId: string;
  productName: string;
  startMonth: number;
  isPredetermined: boolean;
  canRemove: boolean;
  defaultExpanded?: boolean;
  config: TimeSlotRentalsProductConfig;
  productionDaysPerMonth: number;
  productionDaysPerAnnum: number;
  onChangeName: (name: string) => void;
  onChangeStartMonth: (month: number) => void;
  onChangeConfig: (
    updatedConfig: TimeSlotRentalsProductConfig,
    derived: {
      dailyCapacity: number;
      unitPrice: number;
      productionFactorPct: number;
      commissionOnSalesPct: number;
      otherIncomeMonthlyBase: number;
    }
  ) => void;
  onRemove?: () => void;
  onOpenResultsTab?: () => void;
}

/**
 * Services — Time Slot Rentals Model-Set Workbench
 * Faithful to time slot rentals.xlsx:
 * - 01 Production Calculator: multi-process workstreams, rental time, utilization % & rentals/day
 * - 02 Employee Calculator: strictly advisory staffing indicator (zero impact on production)
 * - 03 Pricing & Trading: rate per rental slot, production factor %, sales commission %, other income (0 variable COS)
 */
export const ServicesTimeSlotRentalsWorkbench: React.FC<
  ServicesTimeSlotRentalsWorkbenchProps
> = ({
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
    useState<TimeSlotRentalsCalculatorTabId>('production');

  const fullResult = useMemo(
    () =>
      calculateTimeSlotRentalsFull(
        config,
        productionDaysPerMonth,
        productionDaysPerAnnum
      ),
    [config, productionDaysPerMonth, productionDaysPerAnnum]
  );

  const unitLabel = fullResult.production.rentalLabel || 'rentals';
  const singularUnit = unitLabel.replace(/s$/, '') || 'rental';

  const emitConfigUpdate = (nextConfig: TimeSlotRentalsProductConfig) => {
    const nextResult = calculateTimeSlotRentalsFull(
      nextConfig,
      productionDaysPerMonth,
      productionDaysPerAnnum
    );
    onChangeConfig(nextConfig, {
      dailyCapacity: nextResult.production.dailyRentalsCapacity,
      unitPrice: nextConfig.unitSellingPriceBase,
      productionFactorPct: nextConfig.productionFactorBasePct,
      commissionOnSalesPct: nextConfig.commissionOnSalesPct,
      otherIncomeMonthlyBase: nextConfig.otherIncomeMonthlyBase,
    });
  };

  const fmtVal = (val: number) =>
    Number.isInteger(val)
      ? val.toLocaleString()
      : val.toLocaleString(undefined, { maximumFractionDigits: 1 });

  const tabValues: Record<TimeSlotRentalsCalculatorTabId, string> = {
    production: `${fmtVal(fullResult.production.dailyRentalsCapacity)} ${unitLabel}/d`,
    employees: `${fullResult.employees.employeesAdjusted} staff`,
    trading: `${config.unitSellingPriceBase.toFixed(2)}/${singularUnit}`,
  };

  const activeIdx = TIME_SLOT_RENTALS_STEPS.findIndex((s) => s.id === activeTab);
  const prevStep = activeIdx > 0 ? TIME_SLOT_RENTALS_STEPS[activeIdx - 1] : null;
  const nextStep =
    activeIdx < TIME_SLOT_RENTALS_STEPS.length - 1
      ? TIME_SLOT_RENTALS_STEPS[activeIdx + 1]
      : null;

  const monthlyBilledRentals = Number(
    (
      fullResult.production.monthlyRentalsCapacity *
      ((config.productionFactorBasePct ?? 100) / 100)
    ).toFixed(2)
  );
  const estMonthlyRevenue = Math.round(
    monthlyBilledRentals * (config.unitSellingPriceBase || 0)
  );

  const inputCls = `w-full px-3 py-2 rounded-lg border text-xs font-bold text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
    isDark
      ? 'bg-[#141A2E] border-[#252E4A] text-white'
      : 'bg-[#F0F5FA] border-[#C9D8E8] text-slate-900'
  }`;

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-colors ${
        isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
      }`}
    >
      {/* Product Header Strip */}
      <div
        className={`p-4 flex flex-wrap items-center justify-between gap-4 border-b ${
          isDark
            ? 'bg-[#121A2F]/70 border-[#222F4C]'
            : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        {/* Left: Service Name & Start Month */}
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
                placeholder="Rental Service Stream Title"
                aria-label="Time slot rental service name"
                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold lowercase focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                  isDark
                    ? 'bg-[#0E1322] border-[#252E4A] text-white'
                    : 'bg-white border-[#D8CEBC] text-slate-900'
                }`}
              />
            )}
          </div>

          {/* Launch Month Inline Selector */}
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
              capacity:{' '}
              <strong className="text-[#2E5E88] dark:text-[#6BA3D6]">
                {fmtVal(fullResult.production.dailyRentalsCapacity)} {unitLabel}/d
              </strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              rate:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {config.unitSellingPriceBase.toFixed(2)}/{singularUnit}
              </strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              util:{' '}
              <strong className="text-slate-900 dark:text-white">
                {fullResult.production.effectiveUtilizationPct.toFixed(0)}%
              </strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              staff:{' '}
              <strong className="text-slate-900 dark:text-white">
                {fullResult.employees.employeesAdjusted}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {canRemove && !isPredetermined && onRemove && (
              <button
                type="button"
                onClick={onRemove}
                title="Remove rental service line"
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

      {/* Expandable 3-Calculator Workbench */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* 3-Tab Segmented Stepper Navigation */}
          <div
            role="tablist"
            aria-label="Services Time Slot Rentals Calculators"
            className={`grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1.5 rounded-xl border ${
              isDark
                ? 'bg-[#090D18] border-[#222F4C]'
                : 'bg-[#F5F2EC] border-[#D8CEBC]'
            }`}
          >
            {TIME_SLOT_RENTALS_STEPS.map((step) => {
              const isActive = activeTab === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(step.id)}
                  className={`px-3 py-2 rounded-lg text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5E88] ${
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
              <TimeSlotRentalsProductionCalculatorPanel
                theme={theme}
                rentalLabel={config.rentalLabel ?? 'rentals'}
                processes={config.processes}
                capacityMode={config.capacityMode || 'sum'}
                summary={fullResult.production}
                onChangeRentalLabel={(rentalLabel) =>
                  emitConfigUpdate({ ...config, rentalLabel })
                }
                onChangeProcesses={(processes) =>
                  emitConfigUpdate({ ...config, processes })
                }
                onChangeCapacityMode={(capacityMode) =>
                  emitConfigUpdate({ ...config, capacityMode })
                }
              />
            )}

            {activeTab === 'employees' && (
              <EmployeeCalculatorPanel
                theme={theme}
                assumptions={config.employeeAssumptions}
                result={fullResult.employees}
                production={fullResult.productionBridge}
                onChange={(employeeAssumptions) =>
                  emitConfigUpdate({ ...config, employeeAssumptions })
                }
              />
            )}

            {activeTab === 'trading' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    3. Pricing &amp; Trading Dynamics (Time Slot Rentals)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Set the base selling price per {singularUnit}, initial production factor %, sales commission %, and monthly other income. Fine-tune 60-month growth and pricing adjustments on the Results tab.
                  </p>
                </div>

                {/* Zero Variable COS Notice */}
                <div
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-[11px] ${
                    isDark
                      ? 'bg-[#0C111E] border-[#222F4C] text-slate-300'
                      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-700'
                  }`}
                >
                  <Info className="h-4 w-4 text-[#2E5E88] dark:text-[#6BA3D6] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-slate-900 dark:text-white">Pure time-slot rental model:</strong>{' '}
                    Variable cost of sales is <strong>0.00</strong> per {singularUnit}. Direct staff, allocated overheads, station depreciation, and lease expenses flow automatically into Fixed Cost of Sales from the <em>Employment</em>, <em>Operating Expenses</em>, and <em>Fixed Assets</em> steps.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  {/* Left: Base Trading Inputs */}
                  <div
                    className={`lg:col-span-6 p-4 rounded-xl border space-y-3.5 ${
                      isDark
                        ? 'bg-[#0E1322] border-[#222F4C]'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block pb-2 border-b border-slate-200 dark:border-[#222F4C]">
                      base rental pricing &amp; trading assumptions
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block lowercase">
                          unit selling price (rate / {singularUnit})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={config.unitSellingPriceBase}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            emitConfigUpdate({
                              ...config,
                              unitSellingPriceBase: val,
                              unitSellingPriceMonthly: new Array(60).fill(val),
                            });
                          }}
                          className={inputCls}
                        />
                        <span className="text-[10px] text-slate-400 block">
                          tariff per rented time slot (Excel R52)
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block lowercase">
                          production factor % (base)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="200"
                          step="5"
                          value={config.productionFactorBasePct}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            emitConfigUpdate({
                              ...config,
                              productionFactorBasePct: val,
                              productionFactorMonthly: new Array(60).fill(val),
                            });
                          }}
                          className={inputCls}
                        />
                        <span className="text-[10px] text-slate-400 block">
                          % of effective capacity rented (100% = full)
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block lowercase">
                          commission on sales %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={config.commissionOnSalesPct}
                          onChange={(e) => {
                            const val = Math.max(
                              0,
                              Math.min(100, Number(e.target.value) || 0)
                            );
                            emitConfigUpdate({
                              ...config,
                              commissionOnSalesPct: val,
                            });
                          }}
                          className={inputCls}
                        />
                        <span className="text-[10px] text-slate-400 block">
                          gross profit adjustment % of revenue (Excel R57)
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block lowercase">
                          other income / month
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={config.otherIncomeMonthlyBase}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            emitConfigUpdate({
                              ...config,
                              otherIncomeMonthlyBase: val,
                            });
                          }}
                          className={inputCls}
                        />
                        <span className="text-[10px] text-slate-400 block">
                          ancillary monthly income stream (Excel R60)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Live Trading Readout */}
                  <div
                    className={`lg:col-span-6 p-4 rounded-xl border flex flex-col justify-between ${
                      isDark
                        ? 'bg-[#0E1322] border-[#222F4C]'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block pb-2 border-b border-slate-200 dark:border-[#222F4C]">
                        live monthly trading preview (based on setup calendar)
                      </span>
                      <table className="w-full text-xs mt-2">
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                          <tr>
                            <td className="py-2 text-slate-600 dark:text-slate-400">
                              effective daily capacity (from 01)
                            </td>
                            <td className="py-2 text-right font-bold tabular-nums text-slate-800 dark:text-slate-200">
                              {fmtVal(fullResult.production.dailyRentalsCapacity)} {unitLabel}/day
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-slate-600 dark:text-slate-400">
                              monthly capacity ({fullResult.production.productionDaysPerMonth} days/mo)
                            </td>
                            <td className="py-2 text-right font-bold tabular-nums text-slate-800 dark:text-slate-200">
                              {fmtVal(fullResult.production.monthlyRentalsCapacity)} {unitLabel}/mo
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-slate-600 dark:text-slate-400">
                              billed {unitLabel} ({config.productionFactorBasePct}% factor)
                            </td>
                            <td className="py-2 text-right font-bold tabular-nums text-[#2E5E88] dark:text-[#6BA3D6]">
                              {fmtVal(monthlyBilledRentals)} {unitLabel}/mo
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-slate-600 dark:text-slate-400">
                              unit selling price / variable unit cost
                            </td>
                            <td className="py-2 text-right font-bold tabular-nums text-slate-800 dark:text-slate-200">
                              {config.unitSellingPriceBase.toFixed(2)} / 0.00
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-slate-600 dark:text-slate-400">
                              advisory productive staff (from 02 · no production impact)
                            </td>
                            <td className="py-2 text-right font-bold tabular-nums text-slate-700 dark:text-slate-300">
                              {fullResult.employees.employeesAdjusted} staff ({fullResult.employees.employeesStandard} std + {fullResult.employees.employeesAdditional} relief)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div
                      className={`mt-4 p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                        isDark
                          ? 'bg-emerald-950/25 border-emerald-800/40'
                          : 'bg-emerald-50/70 border-emerald-200'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">
                          estimated monthly revenue
                        </span>
                        <span className="text-lg font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
                          {estMonthlyRevenue.toLocaleString()}
                        </span>
                      </div>
                      {onOpenResultsTab && (
                        <button
                          type="button"
                          onClick={onOpenResultsTab}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <span>open results &amp; 60-mo slider</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
              {nextStep ? (
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
              ) : (
                onOpenResultsTab && (
                  <button
                    type="button"
                    onClick={onOpenResultsTab}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>view 60-month results</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
