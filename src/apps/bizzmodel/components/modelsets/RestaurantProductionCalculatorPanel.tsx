import React from 'react';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import {
  RestaurantDiningArea,
  RestaurantProductionConfig,
  RestaurantProductionSummaryResult,
} from './modelSetTypes';
import { formatMinutesAsHHMM } from './batchLotsEngine';

interface RestaurantProductionCalculatorPanelProps {
  theme?: 'light' | 'dark';
  config: RestaurantProductionConfig;
  summary: RestaurantProductionSummaryResult;
  onChange: (updated: RestaurantProductionConfig) => void;
}

const DEFAULT_AREA_NAMES = [
  'Main Dining Room',
  'Patio / Terrace',
  'Bar & Lounge',
  'Private Dining',
  'Take-Away Counter',
];

export const RestaurantProductionCalculatorPanel: React.FC<
  RestaurantProductionCalculatorPanelProps
> = ({ theme = 'light', config, summary, onChange }) => {
  const isDark = theme === 'dark';
  const areas = config.diningAreas || [];

  const handleAreaFieldChange = <K extends keyof RestaurantDiningArea>(
    areaId: string,
    field: K,
    value: RestaurantDiningArea[K]
  ) => {
    onChange({
      ...config,
      diningAreas: areas.map((a) =>
        a.id === areaId ? { ...a, [field]: value } : a
      ),
    });
  };

  const handleAddArea = () => {
    const nextName =
      DEFAULT_AREA_NAMES[areas.length] || `Dining Area ${areas.length + 1}`;
    const newArea: RestaurantDiningArea = {
      id: `area-${Date.now()}`,
      name: nextName,
      numberOfTables: 10,
      guestsPerTable: 4,
      shiftHours: 8,
      shiftsPerDay: 2,
      tableCycleTimeMinutes: 120,
    };
    onChange({
      ...config,
      diningAreas: [...areas, newArea],
    });
  };

  const handleRemoveArea = (areaId: string) => {
    if (areas.length <= 1) return;
    onChange({
      ...config,
      diningAreas: areas.filter((a) => a.id !== areaId),
    });
  };

  const handleClearAreas = () => {
    onChange({
      ...config,
      diningAreas: [
        {
          id: `area-${Date.now()}`,
          name: 'Main Dining Room',
          numberOfTables: 0,
          guestsPerTable: 4,
          shiftHours: 8,
          shiftsPerDay: 1,
          tableCycleTimeMinutes: 120,
        },
      ],
    });
  };

  const inputCls = `w-full px-2 py-1.5 rounded-lg border text-xs font-bold text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
    isDark
      ? 'bg-[#141A2E] border-[#252E4A] text-white'
      : 'bg-[#F0F5FA] border-[#C9D8E8] text-slate-900'
  }`;

  const resultMap = new Map(summary.areas.map((r) => [r.id, r]));

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            1. Production Calculator (Restaurant Seating &amp; Table Turnover)
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Calculates potential daily guest capacity from tables, seats per table, operating shifts, and table cycle time across one or more dining areas.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClearAreas}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap ${
              isDark
                ? 'border-[#252E4A] text-slate-300 hover:bg-slate-800'
                : 'border-[#D8CEBC] text-slate-600 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>clear</span>
          </button>
          <button
            type="button"
            onClick={handleAddArea}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white text-xs font-bold lowercase transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>add dining area</span>
          </button>
        </div>
      </div>

      {/* Restaurant Capacity Summary Strip */}
      <div
        className={`grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-xl border ${
          isDark
            ? 'bg-[#0C111E] border-[#222F4C]'
            : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
            guests per day — potential
          </span>
          <span className="text-base font-bold text-[#2E5E88] dark:text-[#6BA3D6] tabular-nums">
            {summary.effectiveDailyCapacity.toLocaleString()} guests/day
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
            total seating footprint
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums block mt-1">
            {summary.totalTables} tables · {summary.totalSeats} seats ({areas.length} {areas.length === 1 ? 'area' : 'areas'})
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
            monthly / annual capacity
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums block mt-1">
            {summary.effectiveMonthlyCapacity.toLocaleString()} / mo · {summary.effectiveAnnualCapacity.toLocaleString()} / yr
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase block">
            at {summary.expectedOccupancyPct}% reference occupancy
          </span>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums block mt-1">
            {summary.expectedDailyGuests.toLocaleString()} guests/day · {summary.expectedMonthlyPatrons.toLocaleString()} patrons/mo
          </span>
        </div>
      </div>

      {/* Restaurant Seating & Turnover Matrix (matching family restaurant.xlsx R23-R32) */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#222F4C]">
        <table className="w-full text-xs border-collapse min-w-[560px]">
          <thead>
            <tr
              className={`border-b ${
                isDark
                  ? 'bg-[#121A2F] border-[#222F4C]'
                  : 'bg-[#F5F2EC] border-[#D8CEBC]'
              }`}
            >
              <th className="py-2.5 px-3 text-left font-bold text-slate-700 dark:text-slate-300 w-60 min-w-[215px]">
                restaurant capacity parameter
              </th>
              <th className="py-2.5 px-3 text-right font-bold text-[#2E5E88] dark:text-[#6BA3D6] w-36 min-w-[130px] border-r border-slate-200 dark:border-[#222F4C]">
                venue total
              </th>
              {areas.map((area) => {
                const res = resultMap.get(area.id);
                return (
                  <th key={area.id} className="py-2 px-2.5 min-w-[165px] text-left align-top">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={area.name}
                        onChange={(e) =>
                          handleAreaFieldChange(area.id, 'name', e.target.value)
                        }
                        aria-label="Dining area name"
                        className={`w-full px-2 py-1 rounded-md border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                          isDark
                            ? 'bg-[#0E1322] border-[#252E4A] text-white'
                            : 'bg-white border-[#D8CEBC] text-slate-900'
                        }`}
                      />
                      {areas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveArea(area.id)}
                          title={`Remove ${area.name}`}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="mt-1 text-[10px] font-normal text-slate-500 dark:text-slate-400 tabular-nums">
                      {res?.totalSeats ?? 0} seats · {(res?.servingsPerTable ?? 0).toFixed(1)} turns/day
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {/* Production Days (from Setup) */}
            <tr className={isDark ? 'bg-[#0E1322]/40' : 'bg-slate-50/50'}>
              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                production days / month (setup)
              </td>
              <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-[#222F4C]">
                {summary.productionDaysPerMonth} d ({summary.productionDaysPerAnnum}/yr)
              </td>
              {areas.map((area) => (
                <td key={area.id} className="py-2 px-2.5 text-right tabular-nums text-slate-500 dark:text-slate-400">
                  {summary.productionDaysPerMonth} d
                </td>
              ))}
            </tr>

            {/* Number of Tables */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                number of tables
              </td>
              <td className="py-1.5 px-3 text-right font-bold tabular-nums text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-[#222F4C]">
                {summary.totalTables}
              </td>
              {areas.map((area) => (
                <td key={area.id} className="py-1.5 px-2.5">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={area.numberOfTables}
                    onChange={(e) =>
                      handleAreaFieldChange(
                        area.id,
                        'numberOfTables',
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* Guests per Table */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                guests per table
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-400 border-r border-slate-200 dark:border-[#222F4C]">
                {summary.totalSeats} seats
              </td>
              {areas.map((area) => (
                <td key={area.id} className="py-1.5 px-2.5">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={area.guestsPerTable}
                    onChange={(e) =>
                      handleAreaFieldChange(
                        area.id,
                        'guestsPerTable',
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* Shift Hours */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                shift hours (hrs/shift)
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-400 border-r border-slate-200 dark:border-[#222F4C]">
                —
              </td>
              {areas.map((area) => (
                <td key={area.id} className="py-1.5 px-2.5">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={area.shiftHours}
                    onChange={(e) =>
                      handleAreaFieldChange(
                        area.id,
                        'shiftHours',
                        Math.max(0, Math.min(24, Number(e.target.value) || 0))
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* Shifts per Day */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                shifts per day
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-400 border-r border-slate-200 dark:border-[#222F4C]">
                —
              </td>
              {areas.map((area) => (
                <td key={area.id} className="py-1.5 px-2.5">
                  <input
                    type="number"
                    min="0"
                    max="4"
                    step="1"
                    value={area.shiftsPerDay}
                    onChange={(e) =>
                      handleAreaFieldChange(
                        area.id,
                        'shiftsPerDay',
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className={inputCls}
                  />
                </td>
              ))}
            </tr>

            {/* Calculated: Hours per Day */}
            <tr className={isDark ? 'bg-[#0E1322]/40' : 'bg-slate-50/70'}>
              <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">
                hours per day
              </td>
              <td className="py-2 px-3 text-right tabular-nums text-slate-500 border-r border-slate-200 dark:border-[#222F4C]">
                —
              </td>
              {areas.map((area) => {
                const res = resultMap.get(area.id);
                return (
                  <td key={area.id} className="py-2 px-2.5 text-right font-bold tabular-nums text-slate-700 dark:text-slate-200">
                    {(res?.hoursPerDay ?? 0).toFixed(2)} h
                  </td>
                );
              })}
            </tr>

            {/* Table Cycle Time (minutes) */}
            <tr>
              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                table cycle time (mins)
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-400 border-r border-slate-200 dark:border-[#222F4C]">
                —
              </td>
              {areas.map((area) => (
                <td key={area.id} className="py-1.5 px-2.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={area.tableCycleTimeMinutes}
                      onChange={(e) =>
                        handleAreaFieldChange(
                          area.id,
                          'tableCycleTimeMinutes',
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      }
                      className={inputCls}
                    />
                    <span className="text-[10px] text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                      {formatMinutesAsHHMM(area.tableCycleTimeMinutes)}
                    </span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Calculated: Servings per Table */}
            <tr className={isDark ? 'bg-[#0E1322]/40' : 'bg-slate-50/70'}>
              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                servings per table (turns / day)
              </td>
              <td className="py-2 px-3 text-right tabular-nums text-slate-400 border-r border-slate-200 dark:border-[#222F4C]">
                —
              </td>
              {areas.map((area) => {
                const res = resultMap.get(area.id);
                return (
                  <td key={area.id} className="py-2 px-2.5 text-right font-bold tabular-nums text-slate-700 dark:text-slate-300">
                    {(res?.servingsPerTable ?? 0).toFixed(2)}
                  </td>
                );
              })}
            </tr>

            {/* HIGHLIGHTED RESULT: Guests per Day - Potential */}
            <tr
              className={`border-t-2 font-bold ${
                isDark
                  ? 'bg-[#2E5E88]/20 border-[#2E5E88]/50 text-white'
                  : 'bg-[#EEF4FA] border-[#2E5E88]/40 text-slate-900'
              }`}
            >
              <td className="py-2.5 px-3 text-[#2E5E88] dark:text-[#6BA3D6]">
                guests per day — potential
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums text-[#2E5E88] dark:text-[#6BA3D6] text-sm border-r border-slate-200 dark:border-[#222F4C]">
                {summary.totalGuestsPerDayPotential.toLocaleString()}
              </td>
              {areas.map((area) => {
                const res = resultMap.get(area.id);
                return (
                  <td key={area.id} className="py-2.5 px-2.5 text-right tabular-nums text-slate-900 dark:text-white">
                    {(res?.guestsPerDayPotential ?? 0).toLocaleString()}
                  </td>
                );
              })}
            </tr>

            {/* Guests per Month - Potential */}
            <tr className={isDark ? 'bg-[#0E1322]/40' : 'bg-slate-50/60'}>
              <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">
                guests per month — potential
              </td>
              <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-white border-r border-slate-200 dark:border-[#222F4C]">
                {Math.round(summary.totalGuestsPerDayPotential * summary.productionDaysPerMonth).toLocaleString()}
              </td>
              {areas.map((area) => {
                const res = resultMap.get(area.id);
                return (
                  <td key={area.id} className="py-2 px-2.5 text-right tabular-nums text-slate-600 dark:text-slate-400">
                    {(res?.guestsPerMonthPotential ?? 0).toLocaleString()}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Kitchen Batch Size, Category Mix & Reference Occupancy Controls */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border ${
          isDark
            ? 'bg-[#0C111E] border-[#222F4C]'
            : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block lowercase">
            kitchen prep batch (portions)
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={config.kitchenBatchPortions}
            onChange={(e) =>
              onChange({
                ...config,
                kitchenBatchPortions: Math.max(1, Number(e.target.value) || 1),
              })
            }
            className={inputCls}
          />
          <span className="text-[10px] text-slate-400 block">
            portions per recipe batch ({summary.kitchenBatchesPerDay.toFixed(1)} batches/day for BOM &amp; utilities)
          </span>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block lowercase">
            sales mix allocation %
          </label>
          <input
            type="number"
            min="1"
            max="100"
            step="5"
            value={config.salesMixPct}
            onChange={(e) =>
              onChange({
                ...config,
                salesMixPct: Math.max(1, Math.min(100, Number(e.target.value) || 100)),
              })
            }
            className={inputCls}
          />
          <span className="text-[10px] text-slate-400 block">
            100% for full venue cover, or split by category (e.g. 25% meals / beverages)
          </span>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block lowercase">
            reference occupancy %
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="5"
            value={config.expectedOccupancyPct}
            onChange={(e) =>
              onChange({
                ...config,
                expectedOccupancyPct: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
              })
            }
            className={inputCls}
          />
          <span className="text-[10px] text-slate-400 block">
            {summary.expectedDailyGuests.toLocaleString()} expected guests/day (actual sales adjusted on results tab)
          </span>
        </div>
      </div>
    </div>
  );
};
