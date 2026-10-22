import { jsPDF } from 'jspdf';
import { BIZZBEAN_FAVICON_DATA_URL } from './faviconBase64';

export interface BizzCalcPdfReportData {
  businessName: string;
  scenario: string;
  startDate: string;
  annualRevenue: number;
  annualGrossProfit: number;
  annualEmployment: number;
  annualOpex: number;
  fixedAssetsMetrics: {
    balanceSheetValue: number;
    totalDepreciation: number;
    totalOriginalCost: number;
  };
  fundingMetrics: {
    yearendInventory: number;
    yearendReceivables: number;
    yearendOtherAssets: number;
    yearendPayables: number;
  };
  reportMetrics: {
    totalNop: number;
    yearendNetOperatingAssets: number;
    retainedEarnings: number;
    closingBankBalance: number;
    capitalEmployed: number;
    annualNetCashFlow: number;
    cashFlowMonths: Array<{
      month: string | number;
      nop: number;
      applied: number;
      bankBalance: number;
    }>;
  };
  opexItemTotals: Record<string, number>;
  standardOpexNames: readonly string[];
}

export function generateBizzCalcPdf(data: BizzCalcPdfReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm
  const businessName = (data.businessName || 'business name').toLowerCase();
  const scenario = (data.scenario || 'learn').toLowerCase();
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const drawPageShell = (pageNum: number) => {
    // Top banner
    doc.setFillColor(248, 246, 242);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setDrawColor(216, 206, 188);
    doc.setLineWidth(0.4);
    doc.line(0, 20, pageWidth, 20);

    // Replace bizzbean name with bizzbean-favicon.jpg housed in public directory
    try {
      doc.addImage(BIZZBEAN_FAVICON_DATA_URL, 'JPEG', marginX, 4.5, 11, 11);
    } catch {
      // Graceful fallback
    }

    doc.setFont('courier', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(46, 94, 136); // #2E5E88
    doc.text('bizzcalc', marginX + 13.5, 9.5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110, 120, 135);
    doc.text(`scenario: ${scenario}  ·  start: ${data.startDate || '2026-03'}`, marginX + 13.5, 15.5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 90, 105);
    doc.text(`generated: ${dateStr}`, pageWidth - marginX, 10, { align: 'right' });
    doc.text(`document: financial reports (a4)`, pageWidth - marginX, 15.5, { align: 'right' });

    // Footer banner
    doc.setDrawColor(220, 215, 205);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 145);
    doc.text(`${businessName}  ·  bizzcalc authentic executive reports`, marginX, pageHeight - 7);
    doc.text(`page ${pageNum} of 4`, pageWidth - marginX, pageHeight - 7, { align: 'right' });
  };

  const drawCardHeader = (title: string, yPos: number): number => {
    doc.setFillColor(250, 249, 246);
    doc.roundedRect(marginX, yPos, contentWidth, 8, 1.5, 1.5, 'F');
    doc.setDrawColor(216, 206, 188);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, yPos, contentWidth, 8, 1.5, 1.5, 'S');

    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(24, 34, 52);
    // Align header strictly to the left of the report panel
    doc.text(title, marginX + 3.5, yPos + 5.5);
    return yPos + 11;
  };

  const drawRow = (
    label: string,
    value: string,
    yPos: number,
    opts?: { isNegative?: boolean; isHighlight?: boolean; isBold?: boolean; isMuted?: boolean; topBorder?: boolean }
  ): number => {
    if (opts?.topBorder) {
      doc.setDrawColor(230, 225, 218);
      doc.setLineWidth(0.2);
      doc.line(marginX + 3, yPos - 1.2, marginX + contentWidth - 3, yPos - 1.2);
    }

    doc.setFont('courier', opts?.isBold || opts?.isHighlight ? 'bold' : 'normal');
    doc.setFontSize(8.5);

    if (opts?.isMuted) {
      doc.setTextColor(130, 140, 155);
    } else {
      doc.setTextColor(60, 70, 85);
    }
    doc.text(label, marginX + 4, yPos + 3);

    if (opts?.isNegative) {
      doc.setTextColor(225, 45, 75); // Rose/Red for negatives
    } else if (opts?.isHighlight) {
      doc.setTextColor(46, 94, 136); // #2E5E88
    } else {
      doc.setTextColor(20, 30, 45);
    }
    doc.text(value, marginX + contentWidth - 4, yPos + 3, { align: 'right' });

    return yPos + 5.6;
  };

  // =========================================================================
  // PAGE 1: INCOME STATEMENT AND BALANCE SHEET
  // =========================================================================
  drawPageShell(1);

  let currentY = 26;

  // 1. Income Statement
  const isBoxTop = currentY;
  currentY = drawCardHeader(`${businessName}: income statement`, currentY);

  const costOfSales = data.annualRevenue - data.annualGrossProfit;
  const totalExpenses = data.annualEmployment + data.annualOpex + data.fixedAssetsMetrics.totalDepreciation;

  currentY = drawRow('revenue', data.annualRevenue.toLocaleString(), currentY);
  currentY = drawRow('cost of sales', `-${costOfSales.toLocaleString()}`, currentY, { isNegative: true });
  currentY = drawRow('gross profit', data.annualGrossProfit.toLocaleString(), currentY, { isBold: true, topBorder: true });
  currentY = drawRow('employment expenses', `-${data.annualEmployment.toLocaleString()}`, currentY, { isNegative: true });
  currentY = drawRow('operating expenses', `-${data.annualOpex.toLocaleString()}`, currentY, { isNegative: true });
  currentY = drawRow('depreciation expenses', `-${data.fixedAssetsMetrics.totalDepreciation.toLocaleString()}`, currentY, { isNegative: true });
  currentY = drawRow('total expenses', `-${totalExpenses.toLocaleString()}`, currentY, { isNegative: true, topBorder: true });
  currentY = drawRow('net operating profit', data.reportMetrics.totalNop.toLocaleString(), currentY, { isHighlight: true, isBold: true, topBorder: true });

  // Border for Card 1
  const isBoxHeight = currentY - isBoxTop + 3;
  doc.setDrawColor(216, 206, 188);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, isBoxTop, contentWidth, isBoxHeight, 2, 2, 'S');

  currentY += 8;

  // 2. Balance Sheet
  const bsBoxTop = currentY;
  currentY = drawCardHeader(`${businessName}: balance sheet`, currentY);

  const currentAssets = data.fundingMetrics.yearendInventory + data.fundingMetrics.yearendReceivables + data.fundingMetrics.yearendOtherAssets;
  const totalAssets = data.fixedAssetsMetrics.balanceSheetValue + currentAssets;

  currentY = drawRow('fixed assets', data.fixedAssetsMetrics.balanceSheetValue.toLocaleString(), currentY);
  currentY = drawRow('inventory', data.fundingMetrics.yearendInventory.toLocaleString(), currentY);
  currentY = drawRow('accounts receivables', data.fundingMetrics.yearendReceivables.toLocaleString(), currentY);
  currentY = drawRow('other assets', data.fundingMetrics.yearendOtherAssets.toLocaleString(), currentY);
  currentY = drawRow('current assets', currentAssets.toLocaleString(), currentY, { topBorder: true });
  currentY = drawRow('total assets', totalAssets.toLocaleString(), currentY, { isBold: true, topBorder: true });
  currentY = drawRow('accounts payable', `-${data.fundingMetrics.yearendPayables.toLocaleString()}`, currentY, { isNegative: true });
  currentY = drawRow('net operating assets', data.reportMetrics.yearendNetOperatingAssets.toLocaleString(), currentY, { isHighlight: true, isBold: true, topBorder: true });

  currentY += 1.5;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130, 140, 155);
  doc.text('financed by:', marginX + 4, currentY + 2.5);
  currentY += 4.5;

  currentY = drawRow('retained earnings', data.reportMetrics.retainedEarnings.toLocaleString(), currentY);
  const closingBank = Math.round(data.reportMetrics.closingBankBalance);
  currentY = drawRow('bank account', closingBank.toLocaleString(), currentY, { isNegative: closingBank < 0 });
  currentY = drawRow('capital employed', data.reportMetrics.capitalEmployed.toLocaleString(), currentY, { isHighlight: true, isBold: true, topBorder: true });

  const bsBoxHeight = currentY - bsBoxTop + 3;
  doc.setDrawColor(216, 206, 188);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, bsBoxTop, contentWidth, bsBoxHeight, 2, 2, 'S');

  // =========================================================================
  // PAGE 2: CASHFLOW - MONTHLY AND CASHFLOW – ANNUAL
  // =========================================================================
  doc.addPage();
  drawPageShell(2);

  currentY = 26;

  // 1. Cashflow - Monthly
  const cfmBoxTop = currentY;
  currentY = drawCardHeader(`${businessName}: cashflow - monthly`, currentY);

  // Table header
  doc.setFillColor(242, 238, 230);
  doc.rect(marginX + 2, currentY, contentWidth - 4, 6, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(80, 90, 105);
  doc.text('mth', marginX + 5, currentY + 4.2);
  doc.text('nop', marginX + 60, currentY + 4.2, { align: 'right' });
  doc.text('applied', marginX + 115, currentY + 4.2, { align: 'right' });
  doc.text('bank balance', marginX + contentWidth - 5, currentY + 4.2, { align: 'right' });
  currentY += 7.5;

  data.reportMetrics.cashFlowMonths.forEach((c, idx) => {
    const isAlt = idx % 2 === 1;
    if (isAlt) {
      doc.setFillColor(252, 250, 247);
      doc.rect(marginX + 2, currentY - 1, contentWidth - 4, 5.2, 'F');
    }

    const roundedApplied = Math.round(c.applied);
    const appliedStr =
      roundedApplied === 0
        ? '0'
        : roundedApplied < 0
        ? `-${Math.abs(roundedApplied).toLocaleString()}`
        : roundedApplied.toLocaleString();

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110, 120, 135);
    doc.text(String(c.month), marginX + 5, currentY + 2.8);

    doc.setTextColor(40, 50, 65);
    doc.text(Math.round(c.nop).toLocaleString(), marginX + 60, currentY + 2.8, { align: 'right' });

    if (roundedApplied < 0) {
      doc.setTextColor(225, 45, 75);
    } else if (roundedApplied > 0) {
      doc.setTextColor(34, 150, 95);
    } else {
      doc.setTextColor(120, 130, 145);
    }
    doc.text(appliedStr, marginX + 115, currentY + 2.8, { align: 'right' });

    const balanceVal = Math.round(c.bankBalance);
    if (balanceVal >= 0) {
      doc.setTextColor(34, 150, 95);
    } else {
      doc.setTextColor(215, 110, 80);
    }
    doc.text(balanceVal.toLocaleString(), marginX + contentWidth - 5, currentY + 2.8, { align: 'right' });

    currentY += 5.2;
  });

  const cfmBoxHeight = currentY - cfmBoxTop + 2;
  doc.setDrawColor(216, 206, 188);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, cfmBoxTop, contentWidth, cfmBoxHeight, 2, 2, 'S');

  currentY += 8;

  // 2. Cashflow - Annual
  const cfaBoxTop = currentY;
  currentY = drawCardHeader(`${businessName}: cashflow - annual`, currentY);

  const wcVal =
    data.fundingMetrics.yearendInventory +
    data.fundingMetrics.yearendReceivables -
    data.fundingMetrics.yearendPayables;

  const wcStr =
    wcVal === 0
      ? '0'
      : wcVal > 0
      ? `-${Math.abs(wcVal).toLocaleString()}`
      : `+${Math.abs(wcVal).toLocaleString()}`;

  const fixedAppStr =
    data.fixedAssetsMetrics.totalOriginalCost === 0
      ? '0'
      : `-${Math.abs(data.fixedAssetsMetrics.totalOriginalCost).toLocaleString()}`;

  const totalAppStr =
    data.reportMetrics.yearendNetOperatingAssets === 0
      ? '0'
      : `-${Math.abs(data.reportMetrics.yearendNetOperatingAssets).toLocaleString()}`;

  currentY = drawRow('opening bank balance', '0', currentY);
  currentY = drawRow('net operating profit', data.reportMetrics.totalNop.toLocaleString(), currentY);
  currentY = drawRow('application to fixed assets', fixedAppStr, currentY, { isNegative: data.fixedAssetsMetrics.totalOriginalCost > 0 });
  currentY = drawRow('depreciation add back', `+${data.fixedAssetsMetrics.totalDepreciation.toLocaleString()}`, currentY);
  currentY = drawRow('application to working capital', wcStr, currentY, { isNegative: wcVal > 0 });
  currentY = drawRow('total applications', totalAppStr, currentY, { isNegative: data.reportMetrics.yearendNetOperatingAssets > 0, topBorder: true });
  currentY = drawRow('cash flow', Math.round(data.reportMetrics.annualNetCashFlow).toLocaleString(), currentY);
  currentY = drawRow('closing bank balance', Math.round(data.reportMetrics.closingBankBalance).toLocaleString(), currentY, { isHighlight: true, isBold: true, topBorder: true });

  const cfaBoxHeight = currentY - cfaBoxTop + 3;
  doc.setDrawColor(216, 206, 188);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, cfaBoxTop, contentWidth, cfaBoxHeight, 2, 2, 'S');

  // =========================================================================
  // PAGE 3: CASHFLOW CHART
  // =========================================================================
  doc.addPage();
  drawPageShell(3);

  currentY = 26;
  const chartBoxTop = currentY;
  currentY = drawCardHeader(`${businessName}: cashflow chart`, currentY);

  // Subtitle
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 110, 125);
  doc.text('monthly cash flow profile (bank balance vs applied) · 12-month trajectory', marginX + 4, currentY + 1.5);
  currentY += 6;

  // Chart canvas area
  const chartHeight = 115;
  const chartWidth = contentWidth - 10;
  const chartX = marginX + 5;
  const chartY = currentY + 8;

  // Background grid panel
  doc.setFillColor(252, 250, 246);
  doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 2, 2, 'F');
  doc.setDrawColor(226, 218, 206);
  doc.setLineWidth(0.25);
  doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 2, 2, 'S');

  const balances = data.reportMetrics.cashFlowMonths.map((c) => c.bankBalance);
  const maxVal = Math.max(...balances.map((b) => Math.abs(b)), 1000);
  const zeroY = chartY + chartHeight * 0.58; // Zero line positioned nicely

  // Zero axis line
  doc.setDrawColor(180, 170, 155);
  doc.setLineWidth(0.5);
  doc.line(chartX + 4, zeroY, chartX + chartWidth - 4, zeroY);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(140, 130, 120);
  doc.text('0', chartX + 1.5, zeroY + 1);

  // Top and bottom grid reference lines
  doc.setDrawColor(235, 228, 218);
  doc.setLineWidth(0.2);
  doc.line(chartX + 4, chartY + 10, chartX + chartWidth - 4, chartY + 10);
  doc.line(chartX + 4, chartY + chartHeight - 12, chartX + chartWidth - 4, chartY + chartHeight - 12);

  // Draw 12 Bars
  const numBars = 12;
  const colSlot = (chartWidth - 10) / numBars;
  const barWidth = Math.min(8.5, colSlot * 0.65);

  data.reportMetrics.cashFlowMonths.forEach((c, idx) => {
    const xCenter = chartX + 6 + idx * colSlot + colSlot / 2;
    const balance = c.bankBalance;
    const isSurplus = balance >= 0;

    const barPixelHeight = Math.max(2, (Math.abs(balance) / maxVal) * (chartHeight * 0.42));

    const barLeft = xCenter - barWidth / 2;
    const barTop = isSurplus ? zeroY - barPixelHeight : zeroY;

    if (isSurplus) {
      doc.setFillColor(85, 132, 180); // #5584B4 Surplus blue
    } else {
      doc.setFillColor(217, 119, 87); // #D97757 Overdraft coral
    }

    doc.rect(barLeft, barTop, barWidth, barPixelHeight, 'F');

    // Value label
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.8);
    const labelVal = `${Math.round(balance / 1000)}k`;
    const labelY = isSurplus ? barTop - 1.8 : barTop + barPixelHeight + 3.2;

    if (isSurplus) {
      doc.setTextColor(46, 94, 136);
    } else {
      doc.setTextColor(200, 75, 45);
    }
    doc.text(labelVal, xCenter, labelY, { align: 'center' });

    // Month label at bottom axis
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 110, 120);
    doc.text(String(c.month), xCenter, chartY + chartHeight - 3, { align: 'center' });
  });

  currentY = chartY + chartHeight + 6;

  // Legend
  doc.setFillColor(85, 132, 180);
  doc.rect(marginX + 20, currentY, 4, 3, 'F');
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 70, 85);
  doc.text('surplus bank balance', marginX + 26, currentY + 2.5);

  doc.setFillColor(217, 119, 87);
  doc.rect(marginX + 105, currentY, 4, 3, 'F');
  doc.text('overdraft / deficit', marginX + 111, currentY + 2.5);

  currentY += 10;

  // Summary Metrics Box
  doc.setFillColor(248, 246, 240);
  doc.roundedRect(marginX + 4, currentY, contentWidth - 8, 38, 2, 2, 'F');
  doc.setDrawColor(216, 206, 188);
  doc.roundedRect(marginX + 4, currentY, contentWidth - 8, 38, 2, 2, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(46, 94, 136);
  doc.text('cash profile executive summary', marginX + 8, currentY + 6);

  const peakBalance = Math.max(...balances);
  const minBalance = Math.min(...balances);
  const closingBalance = Math.round(data.reportMetrics.closingBankBalance);

  let sumY = currentY + 11;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 80, 95);

  doc.text('• peak bank balance reached:', marginX + 8, sumY);
  doc.setTextColor(34, 150, 95);
  doc.text(`${Math.round(peakBalance).toLocaleString()} zar`, marginX + contentWidth - 10, sumY, { align: 'right' });
  sumY += 5.5;

  doc.setTextColor(70, 80, 95);
  doc.text('• minimum bank balance / max trough:', marginX + 8, sumY);
  doc.setTextColor(minBalance < 0 ? 217 : 34, minBalance < 0 ? 119 : 150, minBalance < 0 ? 87 : 95);
  doc.text(`${Math.round(minBalance).toLocaleString()} zar`, marginX + contentWidth - 10, sumY, { align: 'right' });
  sumY += 5.5;

  doc.setTextColor(70, 80, 95);
  doc.text('• year-end closing bank balance:', marginX + 8, sumY);
  doc.setTextColor(closingBalance >= 0 ? 46 : 217, closingBalance >= 0 ? 94 : 119, closingBalance >= 0 ? 136 : 87);
  doc.text(`${closingBalance.toLocaleString()} zar`, marginX + contentWidth - 10, sumY, { align: 'right' });
  sumY += 5.5;

  doc.setTextColor(70, 80, 95);
  doc.text('• annual net cash flow generated:', marginX + 8, sumY);
  doc.text(`${Math.round(data.reportMetrics.annualNetCashFlow).toLocaleString()} zar`, marginX + contentWidth - 10, sumY, { align: 'right' });

  const totalChartBoxHeight = sumY - chartBoxTop + 8;
  doc.setDrawColor(216, 206, 188);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, chartBoxTop, contentWidth, totalChartBoxHeight, 2, 2, 'S');

  // =========================================================================
  // PAGE 4: SCHEDULE OF EXPENSES
  // =========================================================================
  doc.addPage();
  drawPageShell(4);

  currentY = 26;
  const expBoxTop = currentY;
  currentY = drawCardHeader(`${businessName}: schedule of expenses`, currentY);

  currentY = drawRow('employment', data.annualEmployment.toLocaleString(), currentY);
  currentY = drawRow('depreciation', data.fixedAssetsMetrics.totalDepreciation.toLocaleString(), currentY);
  currentY = drawRow('operating expenses', data.annualOpex.toLocaleString(), currentY);
  currentY = drawRow('total expenses', (data.annualEmployment + data.fixedAssetsMetrics.totalDepreciation + data.annualOpex).toLocaleString(), currentY, { isHighlight: true, isBold: true, topBorder: true });

  currentY += 4;
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 90, 105);
  doc.text('analysis of operating expenses (line-item allocation):', marginX + 4, currentY + 2);
  currentY += 6;

  // Table header for OPEX
  doc.setFillColor(242, 238, 230);
  doc.rect(marginX + 2, currentY, contentWidth - 4, 6, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 90, 105);
  doc.text('line item', marginX + 5, currentY + 4.2);
  doc.text('monthly average', marginX + 115, currentY + 4.2, { align: 'right' });
  doc.text('annual total (zar)', marginX + contentWidth - 5, currentY + 4.2, { align: 'right' });
  currentY += 7.2;

  // List all 27 standard OPEX items cleanly
  data.standardOpexNames.forEach((name, idx) => {
    const total = data.opexItemTotals[name] || 0;
    const isAlt = idx % 2 === 1;

    if (isAlt) {
      doc.setFillColor(252, 250, 247);
      doc.rect(marginX + 2, currentY - 1, contentWidth - 4, 5, 'F');
    }

    doc.setFont('courier', total > 0 ? 'normal' : 'normal');
    doc.setFontSize(7.5);

    if (total > 0) {
      doc.setTextColor(30, 40, 55);
    } else {
      doc.setTextColor(150, 160, 170);
    }
    doc.text(name, marginX + 5, currentY + 2.6);

    const monthlyAvg = Math.round(total / 12);
    doc.text(total > 0 ? monthlyAvg.toLocaleString() : '-', marginX + 115, currentY + 2.6, { align: 'right' });

    if (total > 0) {
      doc.setTextColor(20, 30, 45);
    } else {
      doc.setTextColor(170, 175, 185);
    }
    doc.text(total > 0 ? total.toLocaleString() : '0', marginX + contentWidth - 5, currentY + 2.6, { align: 'right' });

    currentY += 5;
  });

  // Total OPEX row at bottom of table
  doc.setDrawColor(216, 206, 188);
  doc.setLineWidth(0.3);
  doc.line(marginX + 2, currentY, marginX + contentWidth - 2, currentY);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(46, 94, 136);
  doc.text('total operating expenses', marginX + 5, currentY + 4);
  doc.text(data.annualOpex.toLocaleString(), marginX + contentWidth - 5, currentY + 4, { align: 'right' });
  currentY += 7;

  const expBoxHeight = currentY - expBoxTop + 2;
  doc.setDrawColor(216, 206, 188);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, expBoxTop, contentWidth, expBoxHeight, 2, 2, 'S');

  // Trigger browser download of PDF
  const cleanFilename = businessName.replace(/[^a-z0-9_-]/gi, '_') || 'bizzcalc';
  doc.save(`${cleanFilename}_bizzcalc_reports.pdf`);
}
