import React, { useState, useRef } from 'react';
import { BizzPlanData, BizzModelData } from '../../../types';
import {
  Download,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Info,
  ArrowUpRight,
  DollarSign,
  Target,
  Calculator,
  FileText,
} from 'lucide-react';
import { getYearlyFinancialValues } from '../utils/simAdapter';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart as RechartsPie,
  Pie,
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface FinancialReportsProps {
  data: BizzPlanData;
  modelData: BizzModelData | null;
  theme?: 'light' | 'dark';
}

const formatValue = (num: number, isPercent: boolean = false) => {
  if (isPercent) return `${num.toFixed(2)}%`;
  return new Intl.NumberFormat('en-ZA', {
    maximumFractionDigits: 0,
  }).format(num);
};

const formatShortCurrency = (num: number) => {
  if (Math.abs(num) >= 1000000) return `R ${(num / 1000000).toFixed(1)}M`;
  if (Math.abs(num) >= 1000) return `R ${(num / 1000).toFixed(0)}K`;
  return `R ${Math.round(num)}`;
};

const FinancialTableRow = ({
  label,
  values,
  isTotal,
  isPercent,
  isDark,
}: {
  label: string;
  values: number[];
  isTotal?: boolean;
  isPercent?: boolean;
  isDark?: boolean;
}) => (
  <tr
    className={`transition-colors ${
      isTotal
        ? isDark
          ? 'bg-[#161C30] font-bold text-[#7FAADC]'
          : 'bg-[#FAF8F5] font-bold text-[#2E5E88]'
        : isDark
        ? 'text-slate-300 hover:bg-[#161C30]/60'
        : 'text-slate-700 hover:bg-[#FAF8F5]'
    }`}
  >
    <td
      className={`p-3.5 border-r lowercase font-medium min-w-[200px] ${
        isDark ? 'border-[#222F4C]' : 'border-[#ECE7DE]'
      }`}
    >
      {label}
    </td>
    {values.map((v, i) => (
      <td key={i} className="p-3.5 text-right tabular-nums">
        {formatValue(v, isPercent)}
      </td>
    ))}
  </tr>
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
          if (l >= 0.80) return `rgba(250, 248, 245, ${a})`;
          if (l >= 0.60) return `rgba(216, 206, 188, ${a})`;
          if (l <= 0.35) return `rgba(20, 26, 46, ${a})`;
          return `rgba(100, 116, 139, ${a})`;
        }
        if (l > 0.85) return `rgba(242, 238, 230, ${a})`;
        return `rgba(46, 94, 136, ${a})`;
      }
    )
    .replace(/oklab\([^)]+\)/gi, 'rgba(46, 94, 136, 1)')
    .replace(/color-mix\([^)]+\)/gi, 'rgba(46, 94, 136, 0.1)')
    .replace(/light-dark\([^)]+\)/gi, 'rgba(46, 94, 136, 1)');
};

export default function FinancialReports({ data, modelData, theme = 'light' }: FinancialReportsProps) {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'summary' | 'analysis' | 'statements'>('summary');
  const [isExporting, setIsExporting] = useState(false);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  const years = [1, 2, 3, 4, 5];

  const revValues = getYearlyFinancialValues(modelData, 'rev');
  const cosValues = getYearlyFinancialValues(modelData, 'cos');
  const gpValues = getYearlyFinancialValues(modelData, 'gp');
  const opexValues = getYearlyFinancialValues(modelData, 'opex');
  const nopValues = getYearlyFinancialValues(modelData, 'nop');
  const taxValues = getYearlyFinancialValues(modelData, 'tax');
  const npValues = getYearlyFinancialValues(modelData, 'np');
  const bankValues = getYearlyFinancialValues(modelData, 'bank');
  const assetsValues = getYearlyFinancialValues(modelData, 'assets');
  const liabValues = getYearlyFinancialValues(modelData, 'liabilities');
  const eqValues = getYearlyFinancialValues(modelData, 'equity');
  const cashOpsValues = getYearlyFinancialValues(modelData, 'cash-ops');
  const cashInvValues = getYearlyFinancialValues(modelData, 'cash-inv');
  const cashFinValues = getYearlyFinancialValues(modelData, 'cash-fin');
  const cashFlowValues = getYearlyFinancialValues(modelData, 'cash-flow');
  const gpMarginValues = getYearlyFinancialValues(modelData, 'gp-margin');
  const roaValues = getYearlyFinancialValues(modelData, 'roa');
  const debtEqValues = getYearlyFinancialValues(modelData, 'debt-equity');

  const chartData = years.map((y, idx) => ({
    name: `year ${y}`,
    revenue: Math.round(revValues[idx] || 0),
    netProfit: Math.round(npValues[idx] || 0),
    cash: Math.round(bankValues[idx] || 0),
  }));

  const breakevenData = [
    {
      units: 0,
      revenue: 0,
      fixedCost: Math.round((opexValues[0] || 300000) / 12),
      totalCost: Math.round((opexValues[0] || 300000) / 12),
    },
    {
      units: 250,
      revenue: Math.round((revValues[0] || 1200000) * 0.25),
      fixedCost: Math.round((opexValues[0] || 300000) / 12),
      totalCost: Math.round((opexValues[0] || 300000) / 12 + (cosValues[0] || 600000) * 0.25),
    },
    {
      units: 500,
      revenue: Math.round((revValues[0] || 1200000) * 0.5),
      fixedCost: Math.round((opexValues[0] || 300000) / 12),
      totalCost: Math.round((opexValues[0] || 300000) / 12 + (cosValues[0] || 600000) * 0.5),
    },
    {
      units: 750,
      revenue: Math.round((revValues[0] || 1200000) * 0.75),
      fixedCost: Math.round((opexValues[0] || 300000) / 12),
      totalCost: Math.round((opexValues[0] || 300000) / 12 + (cosValues[0] || 600000) * 0.75),
    },
    {
      units: 1000,
      revenue: Math.round(revValues[0] || 1200000),
      fixedCost: Math.round((opexValues[0] || 300000) / 12),
      totalCost: Math.round((opexValues[0] || 300000) / 12 + (cosValues[0] || 600000)),
    },
  ];

  const handleExportPDF = async () => {
    if (!reportContainerRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportContainerRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: isDark ? '#101626' : '#ffffff',
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll('style').forEach((style) => {
            if (style.textContent) style.textContent = replaceOklchInString(style.textContent);
          });
          clonedDoc.querySelectorAll('*').forEach((el) => {
            const s = el.getAttribute('style');
            if (s) el.setAttribute('style', replaceOklchInString(s));
          });
        },
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()));
      const cleanName = (data.coverPage?.companyName || data.businessName || 'bizzplan')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_');
      pdf.save(`${cleanName}_financial_report.pdf`);
    } catch (err) {
      console.error('Error generating financial PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const cardSurface = isDark
    ? 'bg-[#141A2E] border-[#252E4A]'
    : 'bg-[#FAF8F5] border-[#D8CEBC]';

  const axisColor = isDark ? '#94A3B8' : '#2E5E88';
  const gridColor = isDark ? '#252E4A' : '#D8CEBC';
  const primaryBarColor = isDark ? '#5584B4' : '#2E5E88';
  const secondaryBarColor = isDark ? '#7FAADC' : '#8BAFD4';

  return (
    <div ref={reportContainerRef} className="space-y-6 font-mono">
      {/* Header Controls */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border rounded-xl p-3 ${cardSurface}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'summary', label: 'executive summary', icon: TrendingUp },
            { id: 'analysis', label: 'ratio & breakeven analysis', icon: PieChart },
            { id: 'statements', label: '5-year financial statements', icon: FileText },
          ].map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as 'summary' | 'analysis' | 'statements')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold lowercase transition-all border ${
                  isActive
                    ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-xs'
                    : isDark
                    ? 'bg-[#101626] text-slate-300 border-[#252E4A] hover:text-white hover:border-[#5584B4]'
                    : 'bg-white text-slate-600 border-[#D8CEBC] hover:text-[#2E5E88] hover:border-[#2E5E88]'
                }`}
              >
                <t.icon size={13} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleExportPDF}
          disabled={isExporting}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-[10px] font-bold lowercase transition-all disabled:opacity-50 ${
            isDark
              ? 'bg-[#101626] hover:bg-[#2E5E88] text-[#7FAADC] hover:text-white border-[#252E4A]'
              : 'bg-white hover:bg-[#2E5E88] text-[#2E5E88] hover:text-white border-[#D8CEBC]'
          }`}
        >
          {isExporting ? <Activity size={13} className="animate-spin" /> : <Download size={13} />}
          <span>{isExporting ? 'exporting...' : 'export pdf'}</span>
        </button>
      </div>

      {/* 1. Executive Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className={`border rounded-xl p-4 ${cardSurface}`}>
              <div
                className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-widest ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <span>5-yr total revenue</span>
                <DollarSign size={13} />
              </div>
              <div
                className={`text-xl font-black mt-2 tabular-nums ${
                  isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'
                }`}
              >
                {formatShortCurrency(revValues.reduce((a, b) => a + b, 0))}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
                <ArrowUpRight size={11} /> 5-year trajectory
              </div>
            </div>

            <div className={`border rounded-xl p-4 ${cardSurface}`}>
              <div
                className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-widest ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <span>5-yr net profit</span>
                <TrendingUp size={13} />
              </div>
              <div
                className={`text-xl font-black mt-2 tabular-nums ${
                  isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'
                }`}
              >
                {formatShortCurrency(npValues.reduce((a, b) => a + b, 0))}
              </div>
              <div className={`text-[10px] mt-1 lowercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                after corporate tax
              </div>
            </div>

            <div className={`border rounded-xl p-4 ${cardSurface}`}>
              <div
                className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-widest ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <span>year 5 cash</span>
                <Activity size={13} />
              </div>
              <div
                className={`text-xl font-black mt-2 tabular-nums ${
                  isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'
                }`}
              >
                {formatShortCurrency(bankValues[4] || 0)}
              </div>
              <div className={`text-[10px] mt-1 lowercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                closing liquidity
              </div>
            </div>

            <div className={`border rounded-xl p-4 ${cardSurface}`}>
              <div
                className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-widest ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <span>avg gross margin</span>
                <Target size={13} />
              </div>
              <div
                className={`text-xl font-black mt-2 tabular-nums ${
                  isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'
                }`}
              >
                {(gpMarginValues.reduce((a, b) => a + b, 0) / 5).toFixed(1)}%
              </div>
              <div className={`text-[10px] mt-1 lowercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                unit economic health
              </div>
            </div>
          </div>

          <div className={`border rounded-xl p-5 ${cardSurface}`}>
            <h4
              className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${
                isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'
              }`}
            >
              <BarChart3 size={14} /> 5-year revenue vs net profit vs closing cash
            </h4>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
                  <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 10 }} />
                  <YAxis tick={{ fill: axisColor, fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#101626' : '#ffffff',
                      borderColor: isDark ? '#252E4A' : '#D8CEBC',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill={primaryBarColor} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netProfit" name="Net Profit" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cash" name="Closing Cash" fill={secondaryBarColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 2. Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className={`border rounded-xl p-5 ${cardSurface}`}>
            <h4
              className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${
                isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'
              }`}
            >
              <PieChart size={14} /> year 1 cost & profit distribution
            </h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={[
                      { name: 'Cost of Sales', value: Math.max(0, cosValues[0] || 1) },
                      { name: 'Operating Expenses', value: Math.max(0, opexValues[0] || 1) },
                      { name: 'Net Profit', value: Math.max(0, npValues[0] || 1) },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    <Cell fill={primaryBarColor} />
                    <Cell fill="#94a3b8" />
                    <Cell fill="#10B981" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#101626' : '#ffffff',
                      borderColor: isDark ? '#252E4A' : '#D8CEBC',
                      fontSize: '11px',
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`border rounded-xl p-5 ${cardSurface}`}>
            <h4
              className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${
                isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'
              }`}
            >
              <Activity size={14} /> breakeven trajectory
            </h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={breakevenData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
                  <XAxis dataKey="units" tick={{ fill: axisColor, fontSize: 10 }} />
                  <YAxis tick={{ fill: axisColor, fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#101626' : '#ffffff',
                      borderColor: isDark ? '#252E4A' : '#D8CEBC',
                      fontSize: '11px',
                    }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke={primaryBarColor} strokeWidth={2.5} name="Revenue" />
                  <Line type="monotone" dataKey="totalCost" stroke="#ef4444" strokeWidth={2} name="Total Cost" />
                  <Line type="monotone" dataKey="fixedCost" stroke="#94a3b8" strokeDasharray="4 4" name="Fixed Cost" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            className={`lg:col-span-2 border rounded-xl overflow-hidden ${
              isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
            }`}
          >
            <div
              className={`p-3.5 border-b flex items-center gap-2 ${
                isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
              }`}
            >
              <Target size={14} className={isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'} />
              <h4
                className={`text-xs font-bold uppercase tracking-widest ${
                  isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'
                }`}
              >
                key financial ratios
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark ? 'border-[#252E4A] bg-[#101626]' : 'border-[#D8CEBC] bg-[#F2EEE6]'
                    }`}
                  >
                    <th
                      className={`p-3.5 text-left uppercase tracking-widest text-[10px] border-r ${
                        isDark ? 'text-slate-300 border-[#222F4C]' : 'text-[#505A69] border-[#ECE7DE]'
                      }`}
                    >
                      ratio
                    </th>
                    {years.map((y) => (
                      <th
                        key={y}
                        className={`p-3.5 text-right uppercase tracking-widest text-[10px] ${
                          isDark ? 'text-slate-300' : 'text-[#505A69]'
                        }`}
                      >
                        year {y}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#222F4C]' : 'divide-[#ECE7DE]'}`}>
                  <FinancialTableRow label="gross profit margin %" values={gpMarginValues} isPercent isDark={isDark} />
                  <FinancialTableRow label="return on assets (roa) %" values={roaValues} isPercent isDark={isDark} />
                  <FinancialTableRow
                    label="debt to equity ratio"
                    values={debtEqValues.map((v) => Number(v.toFixed(2)))}
                    isDark={isDark}
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Full Statements Tab */}
      {activeTab === 'statements' && (
        <div className="space-y-6">
          {[
            {
              title: 'income statement (5-year forecast)',
              icon: Calculator,
              rows: [
                { label: 'total revenue', values: revValues },
                { label: 'cost of sales', values: cosValues },
                { label: 'gross profit', values: gpValues, isTotal: true },
                { label: 'operating expenses', values: opexValues },
                { label: 'net operating profit', values: nopValues, isTotal: true },
                { label: 'taxation', values: taxValues },
                { label: 'net profit', values: npValues, isTotal: true },
              ],
            },
            {
              title: 'balance sheet summary',
              icon: FileText,
              rows: [
                { label: 'total assets', values: assetsValues, isTotal: true },
                { label: 'total liabilities', values: liabValues, isTotal: true },
                { label: 'total equity', values: eqValues, isTotal: true },
                { label: 'closing bank balance', values: bankValues, isTotal: true },
              ],
            },
            {
              title: 'cash flow statement summary',
              icon: Activity,
              rows: [
                { label: 'cash from operations', values: cashOpsValues, isTotal: true },
                { label: 'cash from investment', values: cashInvValues },
                { label: 'cash from financing', values: cashFinValues },
                { label: 'net annual cash flow', values: cashFlowValues, isTotal: true },
              ],
            },
          ].map((block, idx) => (
            <div
              key={idx}
              className={`border rounded-xl overflow-hidden ${
                isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
              }`}
            >
              <div
                className={`p-3.5 border-b flex items-center gap-2 ${
                  isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                }`}
              >
                <block.icon size={14} className={isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'} />
                <h4
                  className={`text-xs font-bold uppercase tracking-widest ${
                    isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'
                  }`}
                >
                  {block.title}
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr
                      className={`border-b ${
                        isDark ? 'border-[#252E4A] bg-[#101626]' : 'border-[#D8CEBC] bg-[#F2EEE6]'
                      }`}
                    >
                      <th
                        className={`p-3.5 text-left uppercase tracking-widest text-[10px] border-r ${
                          isDark ? 'text-slate-300 border-[#222F4C]' : 'text-[#505A69] border-[#ECE7DE]'
                        }`}
                      >
                        consolidated figures
                      </th>
                      {years.map((y) => (
                        <th
                          key={y}
                          className={`p-3.5 text-right uppercase tracking-widest text-[10px] ${
                            isDark ? 'text-slate-300' : 'text-[#505A69]'
                          }`}
                        >
                          year {y}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[#222F4C]' : 'divide-[#ECE7DE]'}`}>
                    {block.rows.map((r, rIdx) => (
                      <FinancialTableRow
                        key={rIdx}
                        label={r.label}
                        values={r.values}
                        isTotal={r.isTotal}
                        isDark={isDark}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {!modelData && (
            <div
              className={`p-4 border rounded-xl flex items-center gap-3 text-xs ${
                isDark
                  ? 'bg-[#141A2E] border-[#252E4A] text-slate-300'
                  : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-700'
              }`}
            >
              <Info size={16} className={`shrink-0 ${isDark ? 'text-[#7FAADC]' : 'text-[#2E5E88]'}`} />
              <span>
                Displaying baseline institutional projections. Configure BizzModel or BizzDynamics to sync your live figures.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
