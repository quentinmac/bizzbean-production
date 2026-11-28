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
import { GuardingProductConfig } from './modelSetTypes';
import { calculateGuardingFull } from './guardingEngine';
import { GuardingProductionCalculatorPanel } from './GuardingProductionCalculatorPanel';
import { EmployeeCalculatorPanel } from './EmployeeCalculatorPanel';

export type GuardingCalculatorTabId = 'production' | 'employees' | 'trading';

const GUARDING_STEPS: Array<{
  id: GuardingCalculatorTabId;
  num: string;
  label: string;
}> = [
  { id: 'production', num: '01', label: 'production calculator' },
  { id: 'employees', num: '02', label: 'relief & employee calculator' },
  { id: 'trading', num: '03', label: 'pricing & trading' },
];

interface ServicesGuardingWorkbenchProps {
  theme?: 'light' | 'dark';
  productId: string;
  productName: string;
  startMonth: number;
  isPredetermined: boolean;
  canRemove: boolean;
  defaultExpanded?: boolean;
  config: GuardingProductConfig;
  productionDaysPerMonth: number;
  productionDaysPerAnnum: number;
  onChangeName: (name: string) => void;
  onChangeStartMonth: (month: number) => void;
  onChangeConfig: (
    updatedConfig: GuardingProductConfig,
    derived: {
      guardsPerWorkstream: number;
      baseWorkstreams: number;
      baseGuardsSold: number;
      guardSellingPriceBase: number;
      unitCostPerGuardBase: number;
      commissionOnSalesPct: number;
      otherIncomeMonthlyBase: number;
    }
  ) => void;
  onRemove?: () => void;
  onOpenResultsTab?: () => void;
}

/**
 * Services — Guarding Model-Set Workbench
 * Faithful to guarding.xlsx:
 * - 01 Production Calculator: site shift staffing (workstreams, guards/workstream, shift hours, shifts/day -> guards/day)
 * - 02 Relief & Employee Calculator: LIVE relief cover driver (efficiency & tolerance % -> adjusted guards/workstream)
 * - 03 Pricing & Trading: active workstreams/sites, guards sold, monthly billing price/guard, direct unit cost/guard, commission %, other income
 */
export const ServicesGuardingWorkbench: React.FC<
  ServicesGuardingWorkbenchProps
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
    useState<GuardingCalculatorTabId>('production');

  const fullResult = useMemo(
    () =>
      calculateGuardingFull(
        config,
        productionDaysPerMonth,
        productionDaysPerAnnum
      ),
    [config, productionDaysPerMonth, productionDaysPerAnnum]
  );

  const emitChange = (nextConfig: GuardingProductConfig) => {
    const nextFull = calculateGuardingFull(
      nextConfig,
      productionDaysPerMonth,
      productionDaysPerAnnum
    );
    onChangeConfig(nextConfig, {
      guardsPerWorkstream: nextFull.guardsPerWorkstreamAdjusted,
      baseWorkstreams: nextFull.baseWorkstreams,
      baseGuardsSold: nextFull.baseGuardsSold,
      guardSellingPriceBase: nextConfig.guardSellingPriceBase,
      unitCostPerGuardBase: nextConfig.unitCostPerGuardBase,
      commissionOnSalesPct: nextConfig.commissionOnSalesPct,
      otherIncomeMonthlyBase: nextConfig.otherIncomeMonthlyBase,
    });
  };

  const guardLabel = fullResult.production.guardLabel;
  const siteLabel = fullResult.production.siteLabel;
  const currentStepIdx = GUARDING_STEPS.findIndex((s) => s.id === activeTab);

  const inputCls = `w-full px-3 py-2 rounded-lg border text-xs font-bold text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
    isDark
      ? 'bg-[#141A2E] border-[#252E4A] text-white'
      : 'bg-[#F0F5FA] border-[#C9D8E8] text-slate-900'
  }`;

  const fmtRand = (n: number) =>
    `R ${Math.round(n).toLocaleString('en-ZA')}`;

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-colors ${
        isDark
          ? 'bg-[#0E1322] border-[#222F4C]'
          : 'bg-white border-[#D8CEBC] shadow-xs'
      }`}
    >
      {/* Top Bar: Service Name, Launch Month, KPI Chips, Expand Toggle */}
      <div
        className={`px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b ${
          isDark
            ? 'bg-[#121A2F]/80 border-[#222F4C]'
            : 'bg-[#FAF8F5] border-[#E6DFD3]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#252E4A] hover:bg-slate-100 dark:hover:bg-[#1B2542] text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse configurator' : 'Expand configurator'}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* Service Stream Name */}
          <div className="flex items-center gap-2">
            {isPredetermined ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#141A2E] border border-slate-200 dark:border-[#252E4A]">
                <Lock className="h-3 w-3 text-slate-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-white lowercase">
                  {productName}
                </span>
              </div>
            ) : (
              <input
                type="text"
                value={productName}
                onChange={(e) => onChangeName(e.target.value)}
                aria-label="Guarding service stream name"
                className={`px-2.5 py-1 rounded-lg border text-xs font-bold lowercase focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                  isDark
                    ? 'bg-[#141A2E] border-[#252E4A] text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            )}

            {/* Launch Month */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#252E4A] bg-white dark:bg-[#141A2E]">
              <Calendar className="h-3 w-3 text-[#2E5E88] dark:text-[#6BA3D6]" />
              <span className="text-[10px] font-bold uppercase text-slate-400">
                start mth
              </span>
              <input
                type="number"
                min="1"
                max="60"
                value={startMonth}
                onChange={(e) =>
                  onChangeStartMonth(
                    Math.min(60, Math.max(1, Number(e.target.value) || 1))
                  )
                }
                className="w-10 text-xs font-bold text-right tabular-nums bg-transparent text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live KPI Summary Chips & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0E1322] border border-slate-200 dark:border-[#222F4C] text-[11px]">
            <div>
              <span className="text-slate-400 lowercase mr-1">
                {guardLabel}/site:
              </span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                {fullResult.guardsPerWorkstreamAdjusted}
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div>
              <span className="text-slate-400 lowercase mr-1">
                {guardLabel} sold:
              </span>
              <span className="font-bold tabular-nums text-[#2E5E88] dark:text-[#6BA3D6]">
                {fullResult.baseGuardsSold.toLocaleString('en-ZA')}
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div>
              <span className="text-slate-400 lowercase mr-1">rev/mo:</span>
              <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {fmtRand(fullResult.baseMonthlyRevenue)}
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div>
              <span className="text-slate-400 lowercase mr-1">gp:</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                {fullResult.baseGrossProfitMarginPct.toFixed(1)}%
              </span>
            </div>
          </div>

          {onOpenResultsTab && (
            <button
              type="button"
              onClick={onOpenResultsTab}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white text-[11px] font-bold lowercase transition-colors cursor-pointer"
            >
              <span>results</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}

          {canRemove && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              title="Remove guarding service stream"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable 3-Tab Workbench Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* Sub-Step Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#222F4C] pb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {GUARDING_STEPS.map((step) => {
                const isActive = activeTab === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveTab(step.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold lowercase transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#2E5E88] text-white shadow-xs'
                        : isDark
                        ? 'bg-[#121A2F] text-slate-400 hover:text-white hover:bg-[#1B2542]'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-80">
                      {step.num}
                    </span>
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentStepIdx <= 0}
                onClick={() =>
                  currentStepIdx > 0 &&
                  setActiveTab(GUARDING_STEPS[currentStepIdx - 1].id)
                }
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#222F4C] text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                title="Previous tab"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={currentStepIdx >= GUARDING_STEPS.length - 1}
                onClick={() =>
                  currentStepIdx < GUARDING_STEPS.length - 1 &&
                  setActiveTab(GUARDING_STEPS[currentStepIdx + 1].id)
                }
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#222F4C] text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                title="Next tab"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* TAB 01: PRODUCTION CALCULATOR */}
          {activeTab === 'production' && (
            <GuardingProductionCalculatorPanel
              theme={theme}
              processes={config.processes}
              guardUnitLabel={guardLabel}
              siteUnitLabel={siteLabel}
              summary={fullResult.production}
              reliefGuardsPerWorkstream={fullResult.employees.employeesAdditional}
              guardsPerWorkstreamAdjusted={fullResult.guardsPerWorkstreamAdjusted}
              onChangeProcesses={(updatedProcs) =>
                emitChange({ ...config, processes: updatedProcs })
              }
              onChangeGuardUnitLabel={(nextLabel) =>
                emitChange({ ...config, guardUnitLabel: nextLabel })
              }
              onChangeSiteUnitLabel={(nextLabel) =>
                emitChange({ ...config, siteUnitLabel: nextLabel })
              }
            />
          )}

          {/* TAB 02: RELIEF & EMPLOYEE CALCULATOR (LIVE DRIVER FOR GUARDING) */}
          {activeTab === 'employees' && (
            <EmployeeCalculatorPanel
              theme={theme}
              mode="guarding-driver"
              assumptions={config.employeeCalc}
              result={fullResult.employees}
              production={fullResult.productionBridge}
              onChange={(updatedEmp) =>
                emitChange({ ...config, employeeCalc: updatedEmp })
              }
            />
          )}

          {/* TAB 03: PRICING & TRADING DYNAMICS */}
          {activeTab === 'trading' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  3. Pricing, Direct Guard Cost & Trading Dynamics
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure contracted {siteLabel}, monthly client tariff per {guardLabel.replace(/s$/, '')}, direct monthly employment cost per {guardLabel.replace(/s$/, '')} (Variable COS), sales commission %, and ancillary other income.
                </p>
              </div>

              {/* Notice on Direct Guard COS vs Fixed Employment */}
              <div
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-[11px] ${
                  isDark
                    ? 'bg-[#0C111E] border-[#222F4C] text-slate-300'
                    : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-700'
                }`}
              >
                <Info className="h-4 w-4 text-[#2E5E88] dark:text-[#6BA3D6] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">
                    Direct Guard Cost of Sales:
                  </strong>{' '}
                  Each deployed {guardLabel.replace(/s$/, '')} carries a direct
                  monthly variable cost (<strong>unit cost per guard</strong>),
                  transferred automatically to Trading Account{' '}
                  <em>Cost of Sales — Variable</em>. Enter control-room,
                  supervisory, and administrative personnel in the{' '}
                  <em>Employment</em> step (Fixed COS / OPEX).
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* Left: Trading Assumptions */}
                <div
                  className={`lg:col-span-6 p-4 rounded-xl border space-y-3.5 ${
                    isDark
                      ? 'bg-[#0C111E] border-[#222F4C]'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block pb-2 border-b border-slate-200 dark:border-[#222F4C]">
                    base monthly trading assumptions
                  </span>

                  {/* Active Workstreams / Sites (R43) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block lowercase">
                        active {siteLabel} (base)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={config.workstreamsBase}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          emitChange({
                            ...config,
                            workstreamsBase: val,
                            workstreamsMonthly: new Array(60).fill(val),
                          });
                        }}
                        className={inputCls}
                      />
                      <span className="text-[10px] text-slate-400 block">
                        adjustable across 60 months in Results
                      </span>
                    </div>

                    {/* Linked Guards per Workstream (R45 = R41) */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block lowercase">
                        {guardLabel} per {siteLabel.replace(/s$/, '')} (adjusted)
                      </label>
                      <div
                        className={`px-3 py-2 rounded-lg border text-xs font-bold text-right tabular-nums ${
                          isDark
                            ? 'bg-[#121A2F] border-[#222F4C] text-emerald-400'
                            : 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                        }`}
                      >
                        {fullResult.guardsPerWorkstreamAdjusted} ({fullResult.production.standardGuardsPerWorkstream} std + {fullResult.employees.employeesAdditional} relief)
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        linked live from Tabs 01 & 02
                      </span>
                    </div>
                  </div>

                  {/* Selling Price & Unit Cost per Guard (R47 & R49) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block lowercase">
                        {guardLabel.replace(/s$/, '')} selling price / mo (R)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={config.guardSellingPriceBase}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          emitChange({
                            ...config,
                            guardSellingPriceBase: val,
                            guardSellingPriceMonthly: new Array(60).fill(val),
                          });
                        }}
                        className={inputCls}
                      />
                      <span className="text-[10px] text-slate-400 block">
                        monthly client fee per deployed {guardLabel.replace(/s$/, '')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block lowercase">
                        unit cost per {guardLabel.replace(/s$/, '')} / mo (R)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={config.unitCostPerGuardBase}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          emitChange({
                            ...config,
                            unitCostPerGuardBase: val,
                            unitCostPerGuardMonthly: new Array(60).fill(val),
                          });
                        }}
                        className={inputCls}
                      />
                      <span className="text-[10px] text-slate-400 block">
                        direct monthly wage & gear cost (Variable COS)
                      </span>
                    </div>
                  </div>

                  {/* Commission % & Other Income (R53 & R56) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block lowercase">
                        commission on sales %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.25"
                        value={config.commissionOnSalesPct}
                        onChange={(e) =>
                          emitChange({
                            ...config,
                            commissionOnSalesPct: Math.max(
                              0,
                              Math.min(100, Number(e.target.value) || 0)
                            ),
                          })
                        }
                        className={inputCls}
                      />
                      <span className="text-[10px] text-slate-400 block">
                        transfers to gross profit adjustments
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block lowercase">
                        other income / month (R)
                      </label>
                      <input
                        type="number"
                        step="100"
                        value={config.otherIncomeMonthlyBase}
                        onChange={(e) =>
                          emitChange({
                            ...config,
                            otherIncomeMonthlyBase: Number(e.target.value) || 0,
                          })
                        }
                        className={inputCls}
                      />
                      <span className="text-[10px] text-slate-400 block">
                        e.g. alarm monitoring, panic response fees
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Live Base Trading Economics Ledger */}
                <div
                  className={`lg:col-span-6 p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                    isDark
                      ? 'bg-[#0C111E] border-[#222F4C]'
                      : 'bg-[#FAF8F5] border-[#D8CEBC]'
                  }`}
                >
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block pb-2 border-b border-slate-200 dark:border-[#222F4C]">
                      base monthly & annual economics preview
                    </span>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-slate-200/70 dark:border-[#1E2942]">
                        <span className="text-slate-600 dark:text-slate-400 lowercase">
                          {guardLabel} deployed & sold ({fullResult.baseWorkstreams} {siteLabel} × {fullResult.guardsPerWorkstreamAdjusted})
                        </span>
                        <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                          {fullResult.baseGuardsSold.toLocaleString('en-ZA')}{' '}
                          {guardLabel}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-slate-200/70 dark:border-[#1E2942]">
                        <span className="text-slate-600 dark:text-slate-400 lowercase">
                          unit gross profit per {guardLabel.replace(/s$/, '')}
                        </span>
                        <span
                          className={`font-bold tabular-nums ${
                            fullResult.baseUnitGrossProfit >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-500'
                          }`}
                        >
                          {fmtRand(fullResult.baseUnitGrossProfit)} (
                          {fullResult.baseGrossProfitMarginPct.toFixed(2)}%)
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-slate-200/70 dark:border-[#1E2942]">
                        <span className="font-bold text-slate-800 dark:text-slate-200 lowercase">
                          monthly revenue
                        </span>
                        <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {fmtRand(fullResult.baseMonthlyRevenue)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-slate-200/70 dark:border-[#1E2942]">
                        <span className="text-slate-600 dark:text-slate-400 lowercase">
                          cost of sales — variable ({guardLabel})
                        </span>
                        <span className="font-bold tabular-nums text-rose-600 dark:text-rose-400">
                          -{fmtRand(fullResult.baseMonthlyVariableCos)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-slate-200/70 dark:border-[#1E2942]">
                        <span className="font-bold text-slate-800 dark:text-slate-200 lowercase">
                          variable gross profit (before fixed COS)
                        </span>
                        <span className="font-bold tabular-nums text-[#2E5E88] dark:text-[#6BA3D6]">
                          {fmtRand(fullResult.baseMonthlyGrossProfit)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-slate-200/70 dark:border-[#1E2942]">
                        <span className="text-slate-600 dark:text-slate-400 lowercase">
                          sales commission ({config.commissionOnSalesPct.toFixed(2)}%)
                        </span>
                        <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
                          -{fmtRand(fullResult.baseMonthlyCommission)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600 dark:text-slate-400 lowercase">
                          other income
                        </span>
                        <span className="font-bold tabular-nums text-slate-700 dark:text-slate-200">
                          {fmtRand(fullResult.baseMonthlyOtherIncome)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Annualized Callout */}
                  <div
                    className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                      isDark
                        ? 'bg-[#121A2F] border-[#252E4A]'
                        : 'bg-white border-[#D8CEBC]'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        annualized revenue (at base sites)
                      </span>
                      <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {fmtRand(fullResult.baseMonthlyRevenue * 12)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        annualized variable guard COS
                      </span>
                      <span className="text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400">
                        -{fmtRand(fullResult.baseMonthlyVariableCos * 12)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
