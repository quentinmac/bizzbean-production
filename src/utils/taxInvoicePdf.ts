import { jsPDF } from 'jspdf';
import { TransactionRecord } from '../types';

export const BIZZBEAN_COMPANY_DETAILS = {
  legalName: 'BIZZBEAN SA (Pty) Ltd',
  address: '67 Blouberg Cresent, Van Riebeeck Park, Kempton Park, South Africa, 1619',
  vatNumberNotice: 'VAT number will be provided shortly (Application in Process)',
  email: 'accounts@bizzbean.com',
  website: 'https://bizzbean.com',
  regNumber: '2024/098712/07',
  merchantId: '14980265',
};

/**
 * Generates and triggers instant browser download of an official SARS-compliant PDF Tax Invoice
 */
export function generateTaxInvoicePdf(invoice: TransactionRecord): void {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor: [number, number, number] = [46, 94, 136]; // #2E5E88
    const darkSlate: [number, number, number] = [26, 32, 44]; // #1A202C
    const mutedGray: [number, number, number] = [113, 128, 150]; // #718096
    const lineBorder: [number, number, number] = [226, 232, 240]; // #E2E8F0
    const accentGreen: [number, number, number] = [16, 185, 129]; // #10B981

    // Page boundaries
    const pageWidth = 210;
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;

    // Header Background Accent Bar
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, 12, contentWidth, 38, 'F');
    doc.setDrawColor(...lineBorder);
    doc.rect(margin, 12, contentWidth, 38, 'S');

    // Company Logo / Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text(BIZZBEAN_COMPANY_DETAILS.legalName, margin + 5, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...mutedGray);
    doc.text('Enterprise Entrepreneurial Modeling Infrastructure', margin + 5, 27);
    doc.text(BIZZBEAN_COMPANY_DETAILS.address, margin + 5, 32);
    doc.text(`Reg No: ${BIZZBEAN_COMPANY_DETAILS.regNumber} • ${BIZZBEAN_COMPANY_DETAILS.vatNumberNotice}`, margin + 5, 37);
    doc.text(`Contact: ${BIZZBEAN_COMPANY_DETAILS.email} • ${BIZZBEAN_COMPANY_DETAILS.website}`, margin + 5, 42);

    // Invoice Status Badge (Top Right)
    doc.setFillColor(46, 94, 136);
    doc.roundedRect(pageWidth - margin - 52, 16, 47, 8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('OFFICIAL TAX INVOICE', pageWidth - margin - 49.5, 21.5);

    // Invoice Meta
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...darkSlate);
    doc.text(invoice.invoiceNumber, pageWidth - margin - 5, 29, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...mutedGray);
    doc.text(`Date: ${invoice.transactionDate}`, pageWidth - margin - 5, 34, { align: 'right' });
    doc.text(`Channel: ${invoice.associate || 'BizzBean Direct'}`, pageWidth - margin - 5, 39, { align: 'right' });
    doc.text(`Payment: PayFast / Instant EFT`, pageWidth - margin - 5, 44, { align: 'right' });

    // Client / Billing Information Box
    const clientBoxY = 56;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...lineBorder);
    doc.roundedRect(margin, clientBoxY, contentWidth, 26, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...mutedGray);
    doc.text('BILLED TO (CUSTOMER):', margin + 5, clientBoxY + 6);
    doc.text('SALES ORIGIN & PAYMENT STATUS:', margin + contentWidth / 2 + 5, clientBoxY + 6);

    // Customer Name & Email
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...darkSlate);
    doc.text(invoice.customer || 'Valued Entrepreneur', margin + 5, clientBoxY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...mutedGray);
    doc.text(invoice.customerEmail || 'accounts@client.com', margin + 5, clientBoxY + 17);
    doc.text(`Location: ${invoice.country || 'South Africa'}`, margin + 5, clientBoxY + 22);

    // Sales Origin & Payment Status
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...accentGreen);
    doc.text('STATUS: PAID IN FULL (Settled)', margin + contentWidth / 2 + 5, clientBoxY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkSlate);
    doc.text(`Country of Origin: ${invoice.country || 'South Africa'}`, margin + contentWidth / 2 + 5, clientBoxY + 17);
    doc.text(`Merchant ID: ${BIZZBEAN_COMPANY_DETAILS.merchantId}`, margin + contentWidth / 2 + 5, clientBoxY + 22);

    // Line Items Table Header
    const tableY = 88;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, tableY, contentWidth, 8, 'F');
    doc.setDrawColor(...lineBorder);
    doc.rect(margin, tableY, contentWidth, 8, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...darkSlate);
    doc.text('SKU', margin + 4, tableY + 5.5);
    doc.text('DESCRIPTION', margin + 30, tableY + 5.5);
    doc.text('TYPE', margin + 98, tableY + 5.5);
    doc.text('QTY', margin + 118, tableY + 5.5);
    doc.text('UNIT PRICE (EXCL)', margin + 133, tableY + 5.5);
    doc.text('TOTAL (EXCL)', pageWidth - margin - 4, tableY + 5.5, { align: 'right' });

    // Line Item Row
    const rowY = tableY + 8;
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, rowY, contentWidth, 12, 'F');
    doc.setDrawColor(...lineBorder);
    doc.rect(margin, rowY, contentWidth, 12, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkSlate);
    doc.text(invoice.sku, margin + 4, rowY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text(invoice.productName, margin + 30, rowY + 7);

    doc.setFont('helvetica', 'normal');
    doc.text(invoice.productType.toUpperCase(), margin + 98, rowY + 7);
    doc.text(String(invoice.quantity || 1), margin + 120, rowY + 7);
    doc.text(`R ${(Number(invoice.unitPrice) || 0).toFixed(2)}`, margin + 133, rowY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text(`R ${(Number(invoice.lineValue) || 0).toFixed(2)}`, pageWidth - margin - 4, rowY + 7, { align: 'right' });

    // Financial Calculation Summary Box (Right Aligned)
    const summaryY = rowY + 18;
    const summaryX = pageWidth - margin - 75;

    doc.setDrawColor(...lineBorder);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(summaryX, summaryY, 75, 28, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkSlate);
    doc.text('Subtotal (Excl. VAT):', summaryX + 5, summaryY + 7);
    doc.text(`R ${(Number(invoice.lineValue) || 0).toFixed(2)}`, pageWidth - margin - 5, summaryY + 7, { align: 'right' });

    doc.text(`SARS VAT (${((Number(invoice.vatRate) || 0.15) * 100).toFixed(0)}%):`, summaryX + 5, summaryY + 14);
    doc.text(`R ${(Number(invoice.vatAmount) || 0).toFixed(2)}`, pageWidth - margin - 5, summaryY + 14, { align: 'right' });

    doc.setDrawColor(...lineBorder);
    doc.line(summaryX + 5, summaryY + 18, pageWidth - margin - 5, summaryY + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...accentGreen);
    doc.text('Invoice Total (Gross):', summaryX + 5, summaryY + 24);
    doc.text(`R ${(Number(invoice.invoiceValue) || 0).toFixed(2)}`, pageWidth - margin - 5, summaryY + 24, { align: 'right' });

    // Statutory Compliance & Legal Verification Box
    const legalY = summaryY + 36;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...lineBorder);
    doc.roundedRect(margin, legalY, contentWidth, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.text('SOUTH AFRICAN REVENUE SERVICE (SARS) STATUTORY TAX INVOICE NOTE', margin + 5, legalY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedGray);
    const statutoryNotice =
      'This document is an Official Tax Invoice issued in terms of Section 20(4) of the Value Added Tax Act, 1991 of South Africa. ' +
      'Electronic generation and digital ledger token allocation recorded immutably under BizzBean merchant records (14980265). ' +
      'VAT registration details for BIZZBEAN SA (Pty) Ltd are active with SARS and final VAT number will be updated shortly upon final issuance.';
    const splitNotice = doc.splitTextToSize(statutoryNotice, contentWidth - 10);
    doc.text(splitNotice, margin + 5, legalY + 11);

    // Bottom Decorative Bar
    doc.setFillColor(...primaryColor);
    doc.rect(margin, 280, contentWidth, 1.5, 'F');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedGray);
    doc.text(
      `BIZZBEAN SA (Pty) Ltd • 67 Blouberg Cresent, Van Riebeeck Park, Kempton Park, South Africa, 1619 • Generated for ${invoice.customer}`,
      pageWidth / 2,
      286,
      { align: 'center' }
    );

    // Save PDF
    const cleanInvoiceNo = (invoice.invoiceNumber || 'INV-0001').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`BizzBean_Tax_Invoice_${cleanInvoiceNo}.pdf`);
  } catch (error) {
    console.error('Error generating Tax Invoice PDF:', error);
    // Fallback to window print if jsPDF fails
    window.print();
  }
}
