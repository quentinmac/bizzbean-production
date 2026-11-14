import React from 'react';
import { BizzModelData, BizzPlanData } from '../../../types';
import { Info, MessageSquare } from 'lucide-react';

interface AssumptionsReportProps {
  planData: BizzPlanData;
  modelData: BizzModelData | null;
  activeSectionId: string;
  variant?: 'editor' | 'print';
}

export default function AssumptionsReport({
  planData,
  modelData,
  variant = 'editor',
}: AssumptionsReportProps) {
  const section = planData.sections.find((s) => s.id === 'assumptions');
  const businessName = (
    planData.coverPage?.companyName ||
    planData.businessName ||
    modelData?.company?.name ||
    'business name'
  ).toLowerCase();

  if (!modelData) {
    return (
      <div className="p-6 text-center border border-dashed border-[#D8CEBC] rounded-xl bg-[#FAF9F6] font-mono">
        <Info size={24} className="mx-auto mb-2 text-[#2E5E88]/40" />
        <h4 className="text-[10px] leading-[16px] font-bold lowercase text-[#2E5E88]">
          no simulator data found
        </h4>
        <p className="text-[9px] leading-[16px] text-[#6E7887] mt-1">
          Open BizzModel to populate your live assumptions report.
        </p>
      </div>
    );
  }

  const formatPercent = (val: number) => {
    return Number(val).toFixed(2) + '%';
  };

  const isHoliday = (year: number, month: number, day: number, holidays: any[]) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.some((h) => {
      if (!h.from || !h.to) return false;
      if (!h.recurring) {
        return dateStr >= h.from && dateStr <= h.to;
      } else {
        const origStart = new Date(h.from + 'T00:00:00');
        const yearOrig = origStart.getFullYear();
        const yearDiff = year - yearOrig;
        const nextStart = new Date(origStart);
        nextStart.setFullYear(yearOrig + yearDiff);
        const origEnd = new Date(h.to + 'T00:00:00');
        const nextEnd = new Date(origEnd);
        nextEnd.setFullYear(yearOrig + yearDiff);

        const format = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return dateStr >= format(nextStart) && dateStr <= format(nextEnd);
      }
    });
  };

  const isWorkingDay = (year: number, month: number, day: number, workingDays: string[]) => {
    const dayIndex = new Date(year, month, day).getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return workingDays.includes(dayNames[dayIndex]);
  };

  const getYearlyWorkingDays = (yearIndex: number) => {
    const startDate = modelData.company?.startDate ? new Date(modelData.company.startDate + 'T00:00:00') : new Date(2026, 0, 1);
    const startMonth = startDate.getMonth();
    const startYear = startDate.getFullYear();
    const workingDays = modelData.company?.workingDays || [];
    const holidays = modelData.company?.holidays || [];

    let total = 0;
    for (let m = 0; m < 12; m++) {
      const targetYear = startYear + Math.floor((startMonth + yearIndex * 12 + m) / 12);
      const targetMonth = (startMonth + yearIndex * 12 + m) % 12;
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        if (isWorkingDay(targetYear, targetMonth, d, workingDays) && !isHoliday(targetYear, targetMonth, d, holidays)) {
          total++;
        }
      }
    }
    return total;
  };

  const workingDaysPerYear = [0, 1, 2, 3, 4].map((y) => getYearlyWorkingDays(y));

  const assump = modelData.company?.assumptions || {
    bankInterestRate: 0,
    overdraftInterestRate: 0,
    vatRate: 0,
    taxRate: 0,
  };

  const assetCats = modelData.company?.assetCategories || {};

  const getYearlyWC = (arr: number[] | undefined, yIdx: number) => {
    if (!arr || arr.length === 0) return '0.00';
    const start = yIdx * 12;
    const slice = arr.slice(start, start + 12);
    if (slice.length === 0) return '0.00';
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    return Number(avg).toFixed(2);
  };

  const assumptionsRows = [
    { label: 'working days per annum', values: workingDaysPerYear.map((v) => String(v)) },
    { label: 'bank interest rate', values: [0, 1, 2, 3, 4].map(() => formatPercent(assump.bankInterestRate)) },
    { label: 'overdraft interest rate', values: [0, 1, 2, 3, 4].map(() => formatPercent(assump.overdraftInterestRate)) },
    { label: 'vat rate', values: [0, 1, 2, 3, 4].map(() => formatPercent(assump.vatRate)) },
    { label: 'tax rate', values: [0, 1, 2, 3, 4].map(() => formatPercent(assump.taxRate)) },
    { label: 'inventory days', values: [0, 1, 2, 3, 4].map((y) => getYearlyWC(modelData.workingCapital?.inventoryDays, y)) },
    { label: 'debtors days', values: [0, 1, 2, 3, 4].map((y) => getYearlyWC(modelData.workingCapital?.debtorsDays, y)) },
    { label: 'creditors days', values: [0, 1, 2, 3, 4].map((y) => getYearlyWC(modelData.workingCapital?.creditorsDays, y)) },
    { label: 'commercial vehicles depreciation rate', values: [0, 1, 2, 3, 4].map(() => formatPercent(assetCats['commercial vehicles'] ?? 20)) },
    { label: 'computer hardware depreciation rate', values: [0, 1, 2, 3, 4].map(() => formatPercent(assetCats['computer hardware'] ?? 33.33)) },
    { label: 'computer software depreciation rate', values: [0, 1, 2, 3, 4].map(() => formatPercent(assetCats['computer software'] ?? 33.33)) },
    { label: 'furniture and fittings depreciation rate', values: [0, 1, 2, 3, 4].map(() => formatPercent(assetCats['furniture & fittings'] ?? assetCats['furniture and fittings'] ?? 16.67)) },
    { label: 'handling equipment depreciation rate', values: [0, 1, 2, 3, 4].map(() => formatPercent(assetCats['handling equipment'] ?? 25)) },
    { label: 'office equipment depreciation rate', values: [0, 1, 2, 3, 4].map(() => formatPercent(assetCats['office equipment'] ?? 16.67)) },
    { label: 'passenger vehicles depreciation rate', values: [0, 1, 2, 3, 4].map(() => formatPercent(assetCats['passenger vehicles'] ?? 20)) },
    { label: 'plant and equipment depreciation rate', values: [0, 1, 2, 3, 4].map(() => formatPercent(assetCats['plant & equipment'] ?? assetCats['plat and equipment'] ?? 16.67)) },
    { label: 'security equipment depreciation rate', values: [0, 1, 2, 3, 4].map(() => formatPercent(assetCats['security equipment'] ?? 20)) },
    { label: 'workshop equipment depreciation rate', values: [0, 1, 2, 3, 4].map(() => formatPercent(assetCats['workshop equipment'] ?? 20)) },
  ];

  const isPrint = variant === 'print';

  return (
    <div className="space-y-3 font-mono">
      <div className="overflow-hidden border border-[#D8CEBC] rounded-lg bg-white">
        {isPrint && (
          <div className="px-3 py-1.5 bg-[#FAF9F6] border-b border-[#D8CEBC]">
            <span className="text-[9px] leading-[16px] font-bold lowercase text-[#182234]">
              {businessName}: model assumptions
            </span>
          </div>
        )}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#D8CEBC] bg-[#F2EEE6]">
              <th
                className={`py-1 px-2.5 text-left font-bold lowercase text-[#505A69] border-r border-[#ECE7DE] w-[42%] ${
                  isPrint ? 'text-[9px] leading-[16px]' : 'text-[10px] leading-[16px]'
                }`}
              >
                parameter / assumption
              </th>
              {[1, 2, 3, 4, 5].map((y) => (
                <th
                  key={y}
                  className={`py-1 px-2 text-right font-bold lowercase text-[#505A69] ${
                    isPrint ? 'text-[9px] leading-[16px]' : 'text-[10px] leading-[16px]'
                  }`}
                >
                  yr {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECE7DE]">
            {assumptionsRows.map((row, idx) => (
              <tr
                key={idx}
                className={idx % 2 === 1 ? 'bg-[#FCFBF8]' : 'bg-white'}
              >
                <td
                  className={`py-0.5 px-2.5 lowercase text-[#3C4655] border-r border-[#ECE7DE] ${
                    isPrint ? 'text-[9px] leading-[16px]' : 'text-[11px] leading-[18px]'
                  }`}
                >
                  {row.label}
                </td>
                {row.values.map((val, vIdx) => (
                  <td
                    key={vIdx}
                    className={`py-0.5 px-2 text-right tabular-nums text-[#141E2D] ${
                      isPrint ? 'text-[9px] leading-[16px]' : 'text-[11px] leading-[18px]'
                    }`}
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {section?.content && (
        <div className="border border-[#D8CEBC] rounded-lg overflow-hidden bg-white">
          <div className="px-3 py-1 bg-[#FAF9F6] border-b border-[#D8CEBC] flex items-center gap-1.5">
            <MessageSquare size={11} className="text-[#2E5E88]" />
            <span className="text-[9px] leading-[16px] font-bold lowercase text-[#182234]">
              {businessName}: economic & operational notes
            </span>
          </div>
          <div className="p-2.5">
            <p className="text-[9px] leading-[16px] text-[#3C4655] whitespace-pre-wrap">
              {section.content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
