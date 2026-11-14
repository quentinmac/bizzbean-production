import React, { useState, useMemo } from 'react';
import { BizzPlanData, BizzModelData } from '../../../types';
import { Download, Printer, Activity } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ScorecardTable, ScorecardActions } from './ScorecardReport';
import AssumptionsReport from './AssumptionsReport';
import { getYearlyFinancialValues } from '../utils/simAdapter';

interface PrintReviewProps {
  planData: BizzPlanData;
  modelData: BizzModelData | null;
  activeSectionId?: string;
  theme?: 'light' | 'dark';
}

const formatValue = (num: number, isPercent: boolean = false) => {
  if (isPercent) return `${num.toFixed(2)}%`;
  return new Intl.NumberFormat('en-ZA', {
    maximumFractionDigits: 0,
  }).format(num);
};

const FinancialTableRow = ({
  label,
  values,
  isTotal,
  isPercent,
  isNegativeRow,
  isAlt,
}: {
  label: string;
  values: number[];
  isTotal?: boolean;
  isPercent?: boolean;
  isNegativeRow?: boolean;
  isAlt?: boolean;
}) => (
  <tr
    className={`${
      isTotal
        ? 'bg-[#FAF9F6] border-t border-[#D8CEBC] font-bold'
        : isAlt
        ? 'bg-[#FCFBF8]'
        : 'bg-white'
    }`}
  >
    <td
      className={`py-0.5 px-2.5 border-r border-[#ECE7DE] lowercase min-w-[140px] text-[9px] leading-[16px] ${
        isTotal ? 'text-[#182234] font-bold' : 'text-[#3C4655] font-normal'
      }`}
    >
      {label}
    </td>
    {values.map((v, i) => {
      const neg = isNegativeRow || v < 0;
      return (
        <td
          key={i}
          className={`py-0.5 px-2 text-right tabular-nums text-[9px] leading-[16px] ${
            isTotal
              ? 'text-[#2E5E88] font-bold'
              : neg
              ? 'text-[#E12D4B] font-normal'
              : 'text-[#141E2D] font-normal'
          }`}
        >
          {formatValue(v, isPercent)}
        </td>
      );
    })}
  </tr>
);

const ReportCard = ({
  businessName,
  cardTitle,
  badge,
  children,
  className = '',
}: {
  businessName: string;
  cardTitle: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`border border-[#D8CEBC] rounded-lg bg-white overflow-hidden break-inside-avoid print:break-inside-avoid ${className}`}>
    <div className="px-3 py-1.5 bg-[#FAF9F6] border-b border-[#D8CEBC] flex items-center justify-between gap-2 break-after-avoid print:break-after-avoid">
      <span className="text-[9px] leading-[16px] font-bold lowercase text-[#182234] truncate">
        {businessName}: {cardTitle}
      </span>
      {badge && (
        <span className="text-[9px] leading-[16px] font-bold lowercase text-[#2E5E88] shrink-0">
          {badge}
        </span>
      )}
    </div>
    {children}
  </div>
);

const A4Page = ({
  children,
  id,
  businessName,
  startDateLabel,
  generatedDate,
  pageNumber,
  totalPages,
}: {
  children: React.ReactNode;
  id?: string;
  businessName: string;
  startDateLabel: string;
  generatedDate: string;
  pageNumber: number;
  totalPages: number;
}) => (
  <div
    id={id}
    className="a4-page-container bg-white shadow-lg border border-[#D8CEBC] mx-auto mb-8 text-[#141E2D] font-mono relative print:shadow-none print:border-none print:mb-0 print:break-before-page print:w-[210mm] print:min-h-[297mm] w-full max-w-[210mm] min-h-[297mm] flex flex-col justify-between overflow-hidden print:overflow-visible"
  >
    {/* BizzCalc-Matched Top Header Banner */}
    <div className="bg-[#F8F6F2] border-b border-[#D8CEBC] px-6 py-3 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 rounded-md overflow-hidden border border-[#D8CEBC] bg-white shrink-0">
          <img
            src="/bizzbean-favicon.jpg"
            alt="bizzplan"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] leading-[16px] font-bold lowercase text-[#2E5E88] tracking-tight">
            bizzplan
          </div>
          <div className="text-[9px] leading-[16px] text-[#6E7887] lowercase truncate">
            business name: {businessName}  ·  start: {startDateLabel}
          </div>
        </div>
      </div>

      <div className="text-right text-[9px] leading-[16px] text-[#505A69] lowercase shrink-0">
        <div>generated: {generatedDate}</div>
        <div>document: business plan (a4)</div>
      </div>
    </div>

    {/* Main Page Content (9px / 16px standardized spacing) */}
    <div className="flex-1 px-6 py-5 text-[9px] leading-[16px] text-[#3C4655]">
      {children}
    </div>

    {/* BizzCalc-Matched Footer Banner */}
    <div className="mx-6 mb-4 pt-2 border-t border-[#DCD7CD] flex items-center justify-between gap-4 text-[9px] leading-[16px] text-[#788291] lowercase shrink-0">
      <span className="truncate">{businessName}  ·  data integrated from bizzmodel</span>
      <span className="shrink-0 tabular-nums">
        page {pageNumber} of {totalPages}
      </span>
    </div>
  </div>
);

const replaceOklchInString = (str: string): string => {
  if (!str) return '';
  return str
    .replace(
      /oklch\(\s*([\d.%]+)\s+([\d.%]+)\s+([\d.%]+)(?:\s*\/\s*([\d.%]+))?\s*\)/gi,
      (_match, lStr, cStr, _hStr, aStr) => {
        let l = parseFloat(lStr);
        if (lStr.includes('%')) l = l / 100;

        let c = parseFloat(cStr);
        if (cStr.includes('%')) c = c / 100;

        let a = 1;
        if (aStr !== undefined) {
          a = parseFloat(aStr);
          if (aStr.includes('%')) a = a / 100;
        }

        if (c < 0.03) {
          if (l >= 0.92) return `rgba(255, 255, 255, ${a})`;
          if (l >= 0.8) return `rgba(248, 246, 242, ${a})`;
          if (l >= 0.6) return `rgba(216, 206, 188, ${a})`;
          if (l <= 0.35) return `rgba(24, 34, 52, ${a})`;
          return `rgba(110, 120, 135, ${a})`;
        }

        if (l > 0.85) return `rgba(227, 237, 246, ${a})`;
        return `rgba(46, 94, 136, ${a})`;
      }
    )
    .replace(/oklab\([^)]+\)/gi, 'rgba(46, 94, 136, 1)')
    .replace(/color-mix\([^)]+\)/gi, 'rgba(46, 94, 136, 0.1)')
    .replace(/light-dark\([^)]+\)/gi, 'rgba(46, 94, 136, 1)');
};

export default function PrintReview({
  planData,
  modelData,
  activeSectionId = 'formation',
  theme = 'light',
}: PrintReviewProps) {
  const isDark = theme === 'dark';
  const getSection = (id: string) => planData.sections.find((s) => s.id === id);

  const years = [1, 2, 3, 4, 5];

  const getYearlyValues = (mode: string) => {
    return getYearlyFinancialValues(modelData, mode);
  };

  const [displayScope, setDisplayScope] = useState<'section' | 'all'>('section');
  const [forceRenderAll, setForceRenderAll] = useState(false);

  React.useEffect(() => {
    if (displayScope === 'all' && activeSectionId) {
      const element = document.getElementById(`print-section-${activeSectionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [activeSectionId, displayScope]);

  const [isExporting, setIsExporting] = useState(false);

  const businessDisplayName =
    planData.coverPage?.companyName ||
    planData.businessName ||
    modelData?.company?.name ||
    'untitled business';
  const businessDisplayLower = businessDisplayName.toLowerCase();

  const rawStartDate =
    modelData?.company?.startDate ||
    planData.governance?.corporate?.startDate ||
    new Date().toISOString().slice(0, 7);
  const startDateLabel = rawStartDate.length >= 7 ? rawStartDate.slice(0, 7) : rawStartDate;

  const generatedDate = useMemo(
    () =>
      new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    []
  );

  const showPageFor = (sectionKey: string) =>
    forceRenderAll || displayScope === 'all' || activeSectionId === sectionKey;

  const pageVisibilityClass = (sectionKey: string) =>
    showPageFor(sectionKey) ? 'block' : 'hidden print:block';

  const handleDownloadFullPDF = async () => {
    setIsExporting(true);
    setForceRenderAll(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 140));
      const pages = document.querySelectorAll('.a4-page-container');
      if (!pages || pages.length === 0) return;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1280,
          onclone: (clonedDoc) => {
            try {
              const styleEls = clonedDoc.querySelectorAll('style');
              styleEls.forEach((style) => {
                if (style.textContent) {
                  style.textContent = replaceOklchInString(style.textContent);
                }
              });

              const allElements = clonedDoc.querySelectorAll('*');
              allElements.forEach((el) => {
                const htmlEl = el as HTMLElement;
                if (htmlEl.getAttribute) {
                  const styleAttr = htmlEl.getAttribute('style');
                  if (styleAttr) {
                    htmlEl.setAttribute('style', replaceOklchInString(styleAttr));
                  }
                }
              });
            } catch (e) {
              console.warn('Sanitization warning:', e);
            }
          },
        });

        const imgData = canvas.toDataURL('image/png');

        if (i > 0) {
          pdf.addPage('a4', 'p');
        }

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      const cleanName = (businessDisplayName || 'bizzplan_business_plan')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_');
      const fileName = `${cleanName}_business_plan.pdf`;

      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating full document PDF:', err);
    } finally {
      setForceRenderAll(false);
      setIsExporting(false);
    }
  };

  // Helper to render a touch-point category in BizzCalc executive report card style (9px / 16px)
  const renderCategory = (cat: any, i: number) => {
    const catScore = cat.items.reduce((s: number, item: any) => s + (item.score || 0), 0);
    return (
      <ReportCard
        key={i}
        businessName={businessDisplayLower}
        cardTitle={cat.title}
        badge={`score: ${catScore}`}
        className="break-inside-avoid print:break-inside-avoid"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#F2EEE6] border-b border-[#D8CEBC]">
              <th className="text-left py-1 px-2.5 text-[9px] leading-[16px] font-bold lowercase text-[#505A69] border-r border-[#ECE7DE]">
                touch-point element
              </th>
              <th className="w-24 text-center py-1 px-2 text-[9px] leading-[16px] font-bold lowercase text-[#505A69] border-r border-[#ECE7DE]">
                answer
              </th>
              <th className="w-14 text-right py-1 px-2.5 text-[9px] leading-[16px] font-bold lowercase text-[#505A69]">
                score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECE7DE]">
            {cat.items.map((item: any, idx: number) => (
              <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#FCFBF8]' : 'bg-white'}>
                <td className="py-0.5 px-2.5 text-[9px] leading-[16px] font-normal text-[#3C4655] border-r border-[#ECE7DE]">
                  {item.item}
                </td>
                <td className="py-0.5 px-2 text-center text-[9px] leading-[16px] font-normal text-[#141E2D] lowercase border-r border-[#ECE7DE]">
                  {item.answer === 'n/a' ? 'not applicable' : item.answer}
                </td>
                <td
                  className={`py-0.5 px-2.5 text-right tabular-nums text-[9px] leading-[16px] font-normal ${
                    (item.score || 0) < 0
                      ? 'text-[#E12D4B]'
                      : (item.score || 0) > 0
                      ? 'text-[#2E5E88]'
                      : 'text-[#141E2D]'
                  }`}
                >
                  {item.score || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportCard>
    );
  };

  const renderTouchpointSummary = (section: any) => (
    <ReportCard
      businessName={businessDisplayLower}
      cardTitle={`${section.title} narrative & summary`}
      className="break-inside-avoid print:break-inside-avoid"
    >
      <div className="p-3 text-[9px] leading-[16px] text-[#3C4655] whitespace-pre-wrap">
        {section.content || `Business plan and operational planning for ${section.title} focus areas.`}
      </div>
    </ReportCard>
  );

  // Build sequential ordered list of A4 pages so dynamic "page X of Y" matches across all views
  type PageDescriptor = {
    id: string;
    sectionKey: string;
    content: React.ReactNode;
  };

  const orderedPages: PageDescriptor[] = [];

  // 1. Cover Page (formation)
  orderedPages.push({
    id: 'print-section-formation',
    sectionKey: 'formation',
    content: (
      <div className="space-y-4">
        <ReportCard businessName={businessDisplayLower} cardTitle="cover page & business identity">
          <div className="p-5 flex flex-col items-center text-center space-y-4">
            {planData.coverPage?.companyLogo && (
              <img
                src={planData.coverPage.companyLogo}
                alt="Company Logo"
                className="max-h-20 object-contain mx-auto"
              />
            )}

            <div className="space-y-1">
              <div className="text-[14px] leading-[20px] font-bold lowercase text-[#2E5E88]">
                {businessDisplayLower}
              </div>
              <div className="w-16 h-0.5 bg-[#D8CEBC] mx-auto" />
              <div className="text-[10px] leading-[16px] lowercase tracking-widest text-[#6E7887]">
                business plan
              </div>
            </div>

            <div className="w-full pt-3 border-t border-[#ECE7DE] grid grid-cols-2 gap-x-6 gap-y-2 text-left">
              {[
                { label: 'business type', value: planData.coverPage?.businessType },
                { label: 'location', value: planData.coverPage?.businessLocation },
                { label: 'prepared by', value: planData.coverPage?.preparationPrincipal },
                {
                  label: 'date',
                  value: planData.coverPage?.preparationDate || generatedDate,
                },
                { label: 'email', value: planData.coverPage?.principalEmail },
                { label: 'mobile', value: planData.coverPage?.principalMobile },
              ]
                .filter((d) => d.value)
                .map((d) => (
                  <div key={d.label} className="py-1 border-b border-[#ECE7DE]">
                    <div className="text-[9px] leading-[16px] lowercase text-[#6E7887]">
                      {d.label}
                    </div>
                    <div className="text-[9px] leading-[16px] font-bold lowercase text-[#141E2D]">
                      {d.value}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </ReportCard>

        {(planData.vision || planData.mission) && (
          <ReportCard businessName={businessDisplayLower} cardTitle="vision & mission">
            <div className="divide-y divide-[#ECE7DE]">
              {planData.vision && (
                <div className="p-3">
                  <div className="text-[9px] leading-[16px] font-bold lowercase text-[#2E5E88]">
                    vision statement
                  </div>
                  <p className="text-[9px] leading-[16px] text-[#3C4655]">{planData.vision}</p>
                </div>
              )}
              {planData.mission && (
                <div className="p-3 bg-[#FCFBF8]">
                  <div className="text-[9px] leading-[16px] font-bold lowercase text-[#2E5E88]">
                    mission statement
                  </div>
                  <p className="text-[9px] leading-[16px] text-[#3C4655]">{planData.mission}</p>
                </div>
              )}
            </div>
          </ReportCard>
        )}

        <ReportCard businessName={businessDisplayLower} cardTitle="executive overview">
          <div className="p-3 text-[9px] leading-[16px] text-[#3C4655] whitespace-pre-wrap">
            {getSection('formation')?.content ||
              'Initial overview and strategic narrative for the business venture.'}
          </div>
        </ReportCard>
      </div>
    ),
  });

  // 2. Investor Pitch
  orderedPages.push({
    id: 'print-section-pitch',
    sectionKey: 'pitch',
    content: (
      <div className="space-y-4">
        <ReportCard businessName={businessDisplayLower} cardTitle="elevator pitch narrative">
          <div className="p-3 text-[9px] leading-[16px] text-[#3C4655] whitespace-pre-wrap">
            {planData.pitch?.elevatorPitch ||
              getSection('pitch')?.content ||
              'No narrative content recorded for this section.'}
          </div>
        </ReportCard>

        <ReportCard businessName={businessDisplayLower} cardTitle="investor pitch pillars">
          <div className="p-3 grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { title: 'value offer', points: planData.pitch?.valueOffer },
              { title: 'revenue model', points: planData.pitch?.revenueModel },
              { title: 'financial outlook', points: planData.pitch?.financialOutlook },
              { title: 'competitor landscape', points: planData.pitch?.competitorLandscape },
              { title: 'get to market', points: planData.pitch?.getToMarket },
              { title: 'growth lever funding', points: planData.pitch?.growthLeverFunding },
              { title: 'funding deal', points: planData.pitch?.fundingDeal },
            ]
              .filter((s) => s.points && s.points.some((p) => p.trim()))
              .map((section, idx) => (
                <div key={idx} className="space-y-1">
                  <h3 className="text-[9px] leading-[16px] font-bold lowercase text-[#2E5E88] border-b border-[#D8CEBC] pb-0.5">
                    {section.title}
                  </h3>
                  <ul className="space-y-0.5">
                    {section.points
                      ?.filter((p) => p.trim())
                      .map((point, pIdx) => (
                        <li
                          key={pIdx}
                          className="text-[9px] leading-[16px] font-normal flex gap-1.5 text-[#3C4655]"
                        >
                          <span className="text-[#2E5E88] shrink-0">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
          </div>
        </ReportCard>
      </div>
    ),
  });

  // 3. Governance
  orderedPages.push({
    id: 'print-section-governance',
    sectionKey: 'governance',
    content: (
      <div className="space-y-4">
        {planData.governance && (
          <>
            <ReportCard businessName={businessDisplayLower} cardTitle="corporate governance structure">
              <div className="p-3 grid grid-cols-4 gap-3">
                {[
                  { label: 'legal form', value: planData.governance.corporate?.legalForm },
                  { label: 'start date', value: planData.governance.corporate?.startDate },
                  { label: 'financial month', value: planData.governance.corporate?.financialMonthEnd },
                  { label: 'board size', value: planData.governance.corporate?.boardSize },
                  { label: 'board quorum', value: planData.governance.corporate?.boardQuorum },
                  { label: 'meeting freq', value: planData.governance.corporate?.boardMeetingFrequency },
                  { label: 'reporting', value: planData.governance.corporate?.financialReportingFrequency },
                  { label: 'agreement', value: planData.governance.corporate?.shareholdersAgreement },
                ]
                  .filter((d) => d.value)
                  .map((d) => (
                    <div key={d.label} className="border-b border-[#ECE7DE] pb-1">
                      <div className="text-[9px] leading-[16px] lowercase text-[#6E7887]">
                        {d.label}
                      </div>
                      <div className="text-[9px] leading-[16px] font-bold lowercase text-[#141E2D]">
                        {d.value}
                      </div>
                    </div>
                  ))}
              </div>
            </ReportCard>

            {planData.governance.boardMembers?.some((m) => m.name) && (
              <ReportCard businessName={businessDisplayLower} cardTitle="board interest">
                <div className="divide-y divide-[#ECE7DE]">
                  {planData.governance.boardMembers
                    .filter((m) => m.name)
                    .map((m, i) => (
                      <div
                        key={i}
                        className={`flex justify-between py-1 px-3 ${
                          i % 2 === 1 ? 'bg-[#FCFBF8]' : 'bg-white'
                        }`}
                      >
                        <span className="text-[9px] leading-[16px] lowercase text-[#3C4655]">
                          {m.name}
                        </span>
                        <span className="text-[9px] leading-[16px] tabular-nums text-[#2E5E88] font-bold">
                          {m.shareholding}
                        </span>
                      </div>
                    ))}
                </div>
              </ReportCard>
            )}

            {planData.governance.keyPersonnel?.some((p) => p.name) && (
              <ReportCard businessName={businessDisplayLower} cardTitle="key personnel">
                <div className="divide-y divide-[#ECE7DE]">
                  {planData.governance.keyPersonnel
                    .filter((p) => p.name)
                    .map((p, i) => (
                      <div
                        key={i}
                        className={`flex justify-between py-1 px-3 ${
                          i % 2 === 1 ? 'bg-[#FCFBF8]' : 'bg-white'
                        }`}
                      >
                        <span className="text-[9px] leading-[16px] lowercase text-[#3C4655]">
                          {p.name}
                        </span>
                        <span className="text-[9px] leading-[16px] lowercase text-[#141E2D]">
                          {p.position}
                        </span>
                      </div>
                    ))}
                </div>
              </ReportCard>
            )}

            {planData.governance.professionalSupport?.some((s) => s.name) && (
              <ReportCard businessName={businessDisplayLower} cardTitle="professional support">
                <div className="divide-y divide-[#ECE7DE]">
                  {planData.governance.professionalSupport
                    .filter((s) => s.name)
                    .map((s, i) => (
                      <div
                        key={i}
                        className={`flex justify-between py-1 px-3 ${
                          i % 2 === 1 ? 'bg-[#FCFBF8]' : 'bg-white'
                        }`}
                      >
                        <span className="text-[9px] leading-[16px] lowercase text-[#3C4655]">
                          {s.name}
                        </span>
                        <span className="text-[9px] leading-[16px] lowercase text-[#141E2D]">
                          {s.serviceType}
                        </span>
                      </div>
                    ))}
                </div>
              </ReportCard>
            )}
          </>
        )}
      </div>
    ),
  });

  // 4. Assumptions
  orderedPages.push({
    id: 'print-section-assumptions',
    sectionKey: 'assumptions',
    content: (
      <AssumptionsReport
        planData={planData}
        modelData={modelData}
        activeSectionId="assumptions"
        variant="print"
      />
    ),
  });

  // 5. Financial Reports
  orderedPages.push({
    id: 'print-section-financial_reports',
    sectionKey: 'financial_reports',
    content: (
      <div className="space-y-3">
        {[
          {
            title: 'income statement',
            rows: [
              { label: 'total revenue', mode: 'rev' },
              { label: 'cost of sales', mode: 'cos', isNegativeRow: true },
              { label: 'gross profit', mode: 'gp', isTotal: true },
              { label: 'operating expenses', mode: 'opex', isNegativeRow: true },
              { label: 'net operating profit', mode: 'nop', isTotal: true },
              { label: 'taxation', mode: 'tax', isNegativeRow: true },
              { label: 'net profit', mode: 'np', isTotal: true },
            ],
          },
          {
            title: 'key ratios',
            rows: [
              { label: 'gross profit margin', mode: 'gp-margin', isPercent: true },
              { label: 'return on assets', mode: 'roa', isPercent: true },
              { label: 'debt:equity ratio', mode: 'debt-equity' },
            ],
          },
          {
            title: 'balance sheet',
            rows: [
              { label: 'total assets', mode: 'assets', isTotal: true },
              { label: 'total liabilities', mode: 'liabilities' },
              { label: 'total equity', mode: 'equity', isTotal: true },
              { label: 'bank balance', mode: 'bank', isTotal: true },
            ],
          },
          {
            title: 'cash flow statement',
            rows: [
              { label: 'cash from operations', mode: 'cash-ops', isTotal: true },
              { label: 'cash from investment', mode: 'cash-inv' },
              { label: 'cash from financing', mode: 'cash-fin' },
              { label: 'closing bank balance', mode: 'bank', isTotal: true },
            ],
          },
        ].map((report, idx) => (
          <ReportCard
            key={idx}
            businessName={businessDisplayLower}
            cardTitle={report.title}
          >
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#D8CEBC] bg-[#F2EEE6]">
                  <th className="py-1 px-2.5 text-left font-bold text-[#505A69] lowercase text-[9px] leading-[16px] w-1/3 border-r border-[#ECE7DE]">
                    consolidated figures
                  </th>
                  {years.map((y) => (
                    <th
                      key={y}
                      className="py-1 px-2 text-right font-bold text-[#505A69] lowercase text-[9px] leading-[16px]"
                    >
                      yr {y}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE7DE]">
                {report.rows.map((rowRef: any, rIdx: number) => (
                  <FinancialTableRow
                    key={rIdx}
                    label={rowRef.label}
                    values={getYearlyValues(rowRef.mode)}
                    isTotal={rowRef.isTotal}
                    isPercent={rowRef.isPercent}
                    isNegativeRow={rowRef.isNegativeRow}
                    isAlt={rIdx % 2 === 1}
                  />
                ))}
              </tbody>
            </table>
          </ReportCard>
        ))}
      </div>
    ),
  });

  // 6. Strategic Touchpoints with "Keep With Next" A4 Page Packing
  const PAGE_HEIGHT_BUDGET = 840;
  const CARD_GAP = 12;

  const estimateCategoryHeight = (cat: any): number => {
    let height = 64; // card header + table header + vertical border buffer
    for (const item of cat.items || []) {
      const len = (item.item || '').length;
      const lines = Math.max(1, Math.ceil(len / 72));
      height += lines * 16 + 5;
    }
    return height;
  };

  const estimateSummaryHeight = (text: string): number => {
    const paragraphs = (text || '').split('\n');
    let lines = 0;
    for (const p of paragraphs) {
      lines += Math.max(1, Math.ceil(p.length / 82));
    }
    return 54 + Math.max(2, lines) * 16;
  };

  ['environment', 'products', 'customers', 'suppliers', 'employees', 'infrastructure', 'systems'].forEach(
    (sectionId) => {
      const section = getSection(sectionId);
      if (!section) return;

      const allCategories = section.categories || [];
      const summaryText =
        section.content ||
        `Business plan and operational planning for ${section.title} focus areas.`;
      const summaryHeight = estimateSummaryHeight(summaryText);

      // Group categories atomically so each sub-header + table stays together ("keep with next")
      const pagesCats: Array<{ cats: any[]; includeSummary: boolean }> = [];
      let currentCats: any[] = [];
      let currentHeight = 0;

      allCategories.forEach((cat) => {
        const catHeight = estimateCategoryHeight(cat);
        const gap = currentCats.length > 0 ? CARD_GAP : 0;

        if (currentCats.length > 0 && currentHeight + gap + catHeight > PAGE_HEIGHT_BUDGET) {
          pagesCats.push({ cats: currentCats, includeSummary: false });
          currentCats = [cat];
          currentHeight = catHeight;
        } else {
          currentCats.push(cat);
          currentHeight += gap + catHeight;
        }
      });

      if (currentCats.length > 0) {
        if (currentHeight + CARD_GAP + summaryHeight <= PAGE_HEIGHT_BUDGET) {
          pagesCats.push({ cats: currentCats, includeSummary: true });
        } else {
          pagesCats.push({ cats: currentCats, includeSummary: false });
          pagesCats.push({ cats: [], includeSummary: true });
        }
      } else {
        pagesCats.push({ cats: [], includeSummary: true });
      }

      pagesCats.forEach((pageGroup, pageIdx) => {
        orderedPages.push({
          id:
            pageIdx === 0
              ? `print-section-${sectionId}`
              : `print-section-${sectionId}_p${pageIdx + 1}`,
          sectionKey: sectionId,
          content: (
            <div className="space-y-3">
              {pageGroup.cats.map((cat, i) => renderCategory(cat, i))}
              {pageGroup.includeSummary && renderTouchpointSummary(section)}
            </div>
          ),
        });
      });
    }
  );

  // 7. Viability Scorecard
  orderedPages.push({
    id: 'print-section-viability_scorecard',
    sectionKey: 'viability_scorecard',
    content: <ScorecardTable data={planData} variant="print" />,
  });

  orderedPages.push({
    id: 'print-section-viability_scorecard_2',
    sectionKey: 'viability_scorecard',
    content: <ScorecardActions data={planData} variant="print" />,
  });

  const totalPages = orderedPages.length;

  return (
    <div className="min-h-full flex flex-col relative">
      {/* Sticky Right-Pane Print Controls Toolbar */}
      <div
        className={`sticky top-0 z-20 px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 no-print font-mono ${
          isDark
            ? 'bg-[#101626]/95 border-[#222F4C] text-slate-200 backdrop-blur-xs'
            : 'bg-[#FAF8F5]/95 border-[#D8CEBC] text-slate-700 backdrop-blur-xs'
        }`}
      >
        <div className="flex items-center gap-1 p-0.5 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] bg-white dark:bg-[#161C30]">
          <button
            type="button"
            onClick={() => setDisplayScope('section')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold lowercase transition-colors cursor-pointer ${
              displayScope === 'section'
                ? 'bg-[#2E5E88] text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            active page
          </button>
          <button
            type="button"
            onClick={() => setDisplayScope('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold lowercase transition-colors cursor-pointer ${
              displayScope === 'all'
                ? 'bg-[#2E5E88] text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            full document ({totalPages})
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleDownloadFullPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E5E88] hover:bg-[#244c70] text-white text-[10px] font-bold lowercase transition-colors cursor-pointer disabled:opacity-50"
            title="Download full business plan as A4 PDF"
          >
            {isExporting ? <Activity size={13} className="animate-spin" /> : <Download size={13} />}
            <span>{isExporting ? 'generating pdf...' : 'download pdf'}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold lowercase transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#161C30] border-[#252E4A] text-slate-200 hover:border-[#5584B4]'
                : 'bg-white border-[#D8CEBC] text-[#2E5E88] hover:border-[#2E5E88]'
            }`}
            title="Print full document"
          >
            <Printer size={13} />
            <span>print</span>
          </button>
        </div>
      </div>

      <div className="py-5 px-3 sm:px-5 print:p-0 print:bg-white flex flex-col items-center">
        {orderedPages.map((page, idx) => (
          <div key={page.id} className={`w-full ${pageVisibilityClass(page.sectionKey)}`}>
            <A4Page
              id={page.id}
              businessName={businessDisplayLower}
              startDateLabel={startDateLabel}
              generatedDate={generatedDate}
              pageNumber={idx + 1}
              totalPages={totalPages}
            >
              {page.content}
            </A4Page>
          </div>
        ))}
      </div>
    </div>
  );
}
