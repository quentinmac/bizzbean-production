import React from 'react';
import { BizzPlanData } from '../../../types';
import { MessageSquare } from 'lucide-react';

interface ScorecardReportProps {
  data: BizzPlanData;
  variant?: 'editor' | 'print';
}

const CATEGORIES_MAP = [
  { id: 'environment', title: 'business environment' },
  { id: 'products', title: 'product category' },
  { id: 'customers', title: 'customers' },
  { id: 'suppliers', title: 'suppliers' },
  { id: 'employees', title: 'employees' },
  { id: 'infrastructure', title: 'infrastructure' },
  { id: 'systems', title: 'systems' },
];

export function ScorecardTable({ data, variant = 'editor' }: ScorecardReportProps) {
  const isPrint = variant === 'print';
  const businessName = (data.coverPage?.companyName || data.businessName || 'business name').toLowerCase();

  const getSubScores = (categoryId: string) => {
    const section = data.sections.find((s) => s.id === categoryId);
    if (!section || !section.categories) return [];

    return section.categories.map((cat) => ({
      title: cat.title,
      score: cat.items.reduce((sum, item) => sum + (item.score || 0), 0),
    }));
  };

  const grandTotal = CATEGORIES_MAP.reduce((acc, cat) => {
    const subs = getSubScores(cat.id);
    return acc + subs.reduce((sum, s) => sum + s.score, 0);
  }, 0);

  return (
    <div className="overflow-hidden border border-[#D8CEBC] font-mono rounded-lg bg-white">
      {isPrint && (
        <div className="px-3 py-1.5 bg-[#FAF9F6] border-b border-[#D8CEBC] flex items-center justify-between">
          <span className="text-[9px] leading-[16px] font-bold lowercase text-[#182234]">
            {businessName}: viability scorecard
          </span>
          <span className="text-[9px] leading-[16px] font-bold lowercase text-[#2E5E88]">
            total score: {grandTotal}
          </span>
        </div>
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[#D8CEBC] bg-[#F2EEE6]">
            <th className="text-left py-1 px-2.5 font-bold lowercase text-[9px] leading-[16px] text-[#505A69] border-r border-[#ECE7DE] w-[30%]">
              category
            </th>
            <th className="text-left py-1 px-2.5 font-bold lowercase text-[9px] leading-[16px] text-[#505A69] border-r border-[#ECE7DE] w-[52%]">
              touch-point elements
            </th>
            <th className="text-right py-1 px-2.5 font-bold lowercase text-[9px] leading-[16px] text-[#505A69] w-[18%]">
              score
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ECE7DE]">
          {CATEGORIES_MAP.map((cat) => {
            const subScores = getSubScores(cat.id);
            const catTotal = subScores.reduce((sum, s) => sum + s.score, 0);

            return (
              <React.Fragment key={cat.id}>
                <tr className="bg-[#FAF9F6] border-b border-[#D8CEBC]">
                  <td className="py-0.5 px-2.5 font-bold lowercase text-[9px] leading-[16px] text-[#2E5E88] border-r border-[#ECE7DE]">
                    {cat.title}
                  </td>
                  <td className="py-0.5 px-2.5 font-bold lowercase text-[9px] leading-[16px] text-[#6E7887] border-r border-[#ECE7DE]">
                    category total
                  </td>
                  <td className="py-0.5 px-2.5 text-right font-bold tabular-nums text-[9px] leading-[16px] text-[#2E5E88]">
                    {catTotal}
                  </td>
                </tr>

                {subScores.map((sub, sIdx) => (
                  <tr key={sIdx} className={sIdx % 2 === 1 ? 'bg-[#FCFBF8]' : 'bg-white'}>
                    <td className="py-0.5 px-2.5 border-r border-[#ECE7DE]" />
                    <td className="py-0.5 px-2.5 lowercase text-[9px] leading-[16px] text-[#3C4655] border-r border-[#ECE7DE]">
                      {sub.title}
                    </td>
                    <td className="py-0.5 px-2.5 text-right tabular-nums text-[9px] leading-[16px] text-[#141E2D]">
                      {sub.score}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-[#FAF9F6] border-t border-[#D8CEBC] font-bold">
            <td colSpan={2} className="py-1 px-2.5 lowercase text-[9px] leading-[16px] text-[#182234] border-r border-[#ECE7DE]">
              total scorecard score
            </td>
            <td className="py-1 px-2.5 text-right tabular-nums text-[9px] leading-[16px] text-[#2E5E88]">
              {grandTotal}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function ScorecardActions({ data, variant = 'editor' }: ScorecardReportProps) {
  const isPrint = variant === 'print';
  const businessName = (data.coverPage?.companyName || data.businessName || 'business name').toLowerCase();

  return (
    <div className="space-y-2.5 font-mono">
      <div className="border border-[#D8CEBC] rounded-lg overflow-hidden bg-white">
        <div className="px-3 py-1.5 bg-[#FAF9F6] border-b border-[#D8CEBC] flex items-center gap-1.5">
          <MessageSquare size={11} className="text-[#2E5E88]" />
          <span className="text-[9px] leading-[16px] font-bold lowercase text-[#182234]">
            {isPrint ? `${businessName}: scorecard action steps & commentary` : 'action steps & commentary'}
          </span>
        </div>
        <div className="divide-y divide-[#ECE7DE]">
          {CATEGORIES_MAP.map((cat, idx) => {
            const rawAction = data.scorecardActions?.[cat.id] || data.scorecardActions?.[cat.title];
            const actionText = Array.isArray(rawAction) ? rawAction.join('\n') : (rawAction || '');
            return (
              <div
                key={cat.id}
                className={`p-2.5 break-inside-avoid print:break-inside-avoid ${
                  idx % 2 === 1 ? 'bg-[#FCFBF8]' : 'bg-white'
                }`}
              >
                <div className="text-[9px] leading-[16px] font-bold lowercase text-[#2E5E88] mb-0.5">
                  {cat.title}
                </div>
                <p className="text-[9px] leading-[16px] font-normal text-[#3C4655] lowercase whitespace-pre-wrap">
                  {actionText || `no specific action steps logged for ${cat.title}.`}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ScorecardReport({ data, variant = 'editor' }: ScorecardReportProps) {
  return (
    <div className="space-y-6 font-mono">
      <ScorecardTable data={data} variant={variant} />
      <ScorecardActions data={data} variant={variant} />
    </div>
  );
}
