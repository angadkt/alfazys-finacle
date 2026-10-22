import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CreditEntry } from '../services/db';

export interface CreditFilterMeta {
  filterDate?: string;
  filterMode?: string;
  filterStatus?: string;
  searchQuery?: string;
}

export const exportCreditToExcel = (entries: CreditEntry[], meta?: CreditFilterMeta) => {
  if (!entries || entries.length === 0) {
    alert('No credit entries available to export.');
    return;
  }

  let grandTotalInr = 0;
  const dateRange = meta?.filterDate || 'All Dates';
  const generatedTime = new Date().toLocaleString('en-US');

  // 1. Clean Header Rows
  const rows: any[][] = [
    ['INFAZYS FINACLE'],
    ['Universal Banking Solutions from Infazys'],
    [],
    ['Credit Entry Audit & Settlement Register'],
    [`${dateRange}  •  Generated ${generatedTime}  •  ${entries.length} record(s)`],
    [], // empty spacer row
    [
      'Entry No',
      'Payment Date',
      'Beneficiary Name',
      'Account Number',
      'Bank Name',
      'IFSC Code',
      'Payment Mode',
      'Linked UTR(s)',
      'Total Amount (INR)',
      'Company Bank Account',
      'Status',
      'Issued By',
      'Verified By'
    ]
  ];

  // 2. Data Rows
  entries.forEach((e) => {
    const amt = typeof e.totalAmount === 'number' ? e.totalAmount : parseFloat(String(e.totalAmount)) || 0;
    grandTotalInr += amt;

    const utrStr = Array.isArray(e.utrItems)
      ? e.utrItems.map((u: any) => `${u.utrNumber} (INR ${u.amount})`).join('; ')
      : '';

    rows.push([
      e.id,
      e.paymentDate || '',
      e.beneficiaryName || '',
      e.accountNumber || '',
      e.bankName || '',
      e.ifscCode || '',
      e.paymentMode || '',
      utrStr,
      amt > 0 ? Number(amt.toFixed(2)) : 0,
      e.companyBankAccount || '',
      e.status || '',
      e.createdBy || '',
      e.verifiedBy || '-'
    ]);
  });

  // 3. Grand Total Row
  rows.push([]);
  rows.push([
    'GRAND TOTAL',
    `${entries.length} Entries`,
    '',
    '',
    '',
    '',
    '',
    '',
    Number(grandTotalInr.toFixed(2)),
    '',
    '',
    '',
    ''
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 14 }, // Entry No
    { wch: 13 }, // Payment Date
    { wch: 24 }, // Beneficiary Name
    { wch: 20 }, // Account Number
    { wch: 22 }, // Bank Name
    { wch: 14 }, // IFSC Code
    { wch: 16 }, // Payment Mode
    { wch: 30 }, // Linked UTR(s)
    { wch: 18 }, // Total Amount (INR)
    { wch: 32 }, // Company Bank Account
    { wch: 14 }, // Status
    { wch: 14 }, // Issued By
    { wch: 14 }  // Verified By
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Credit Entries');
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Finacle_Credit_Entries_${today}.xlsx`);
};

export const exportCreditToPdf = (entries: CreditEntry[], meta?: CreditFilterMeta) => {
  if (!entries || entries.length === 0) {
    alert('No credit entries available to export.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const today = new Date().toISOString().split('T')[0];

  let grandTotalInr = 0;
  entries.forEach((e) => {
    const amt = typeof e.totalAmount === 'number' ? e.totalAmount : parseFloat(String(e.totalAmount)) || 0;
    grandTotalInr += amt;
  });

  // 1. Top Executive Black Banner with Gold Branding
  doc.setFillColor(15, 15, 15); // #0f0f0f deep black
  doc.rect(0, 0, 297, 16.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(218, 175, 55); // #daaf37 Gold
  doc.text('INFAZYS FINACLE', 14, 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(215, 215, 215);
  doc.text('Universal Banking Solutions from Infazys', 14, 13);

  // 2. Title & Clean Subtitle (No clunky filter box)
  let cursorY = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 17, 17);
  doc.text('Credit Entry Audit & Settlement Register', 14, cursorY);

  cursorY += 4.5;
  const dateRange = meta?.filterDate || 'All Dates';
  const generatedTime = new Date().toLocaleString('en-US');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  doc.text(`${dateRange}  •  Generated ${generatedTime}  •  ${entries.length} record(s)`, 14, cursorY);

  // Gold accent divider line
  cursorY += 2.5;
  doc.setDrawColor(218, 175, 55);
  doc.setLineWidth(0.45);
  doc.line(14, cursorY, 283, cursorY);

  cursorY += 4;

  const head = [[
    'Entry No',
    'Date',
    'Beneficiary Name',
    'Account Number',
    'Bank & IFSC',
    'Payment Mode',
    'Linked UTR(s)',
    'Amount (INR)',
    'Status',
    'Issued By'
  ]];

  const body: any[] = entries.map((e) => {
    const amt = typeof e.totalAmount === 'number' ? e.totalAmount : parseFloat(String(e.totalAmount)) || 0;

    const utrLines = Array.isArray(e.utrItems) && e.utrItems.length > 0
      ? e.utrItems.map((u: any) => `${u.utrNumber} (INR ${Number(u.amount).toLocaleString('en-IN')})`).join('\n')
      : 'None';

    const statusUpper = (e.status || 'PENDING').toUpperCase();
    let statusTextColor: [number, number, number] = [70, 70, 70];
    if (statusUpper === 'VERIFIED') {
      statusTextColor = [16, 128, 64];
    } else if (statusUpper === 'PENDING') {
      statusTextColor = [180, 105, 15];
    } else if (statusUpper === 'REJECTED') {
      statusTextColor = [180, 30, 30];
    }

    return [
      { content: e.id, styles: { fontStyle: 'bold' as const, textColor: [17, 17, 17] } },
      { content: e.paymentDate || '-', styles: { textColor: [50, 50, 50] } },
      { content: (e.beneficiaryName || '').toUpperCase(), styles: { fontStyle: 'bold' as const, textColor: [30, 30, 30] } },
      { content: e.accountNumber || '-', styles: { fontStyle: 'bold' as const, textColor: [40, 50, 70] } },
      { content: [e.bankName, e.ifscCode].filter(Boolean).join('\n') || '-', styles: { textColor: [60, 60, 60] } },
      { content: e.paymentMode || '-', styles: { textColor: [60, 60, 60] } },
      { content: utrLines, styles: { textColor: [50, 50, 50], fontSize: 6.8 } },
      { content: `INR ${amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, styles: { halign: 'right' as const, fontStyle: 'bold' as const, textColor: [20, 20, 20] } },
      { content: statusUpper, styles: { halign: 'center' as const, fontStyle: 'bold' as const, textColor: statusTextColor } },
      { content: e.createdBy || '-', styles: { halign: 'center' as const, textColor: [80, 80, 80] } }
    ];
  });

  const foot: any[] = [[
    {
      content: `GRAND TOTAL (${entries.length} Entries)`,
      colSpan: 7,
      styles: { fontStyle: 'bold' as const, halign: 'right' as const, fillColor: [17, 17, 17], textColor: [255, 255, 255], fontSize: 7.6 }
    },
    {
      content: `INR ${grandTotalInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      styles: { fontStyle: 'bold' as const, halign: 'right' as const, fillColor: [17, 17, 17], textColor: [255, 255, 255], fontSize: 7.6 }
    },
    {
      content: '',
      colSpan: 2,
      styles: { fillColor: [17, 17, 17] }
    }
  ]];

  autoTable(doc, {
    head,
    body,
    foot,
    startY: cursorY,
    theme: 'grid',
    styles: {
      fontSize: 7.2,
      cellPadding: 1.8,
      lineColor: [225, 225, 225],
      lineWidth: 0.12,
      textColor: [30, 30, 30],
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [17, 17, 17], // Black header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      cellPadding: 2.2
    },
    footStyles: {
      fillColor: [17, 17, 17],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.8
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 18 },
      2: { cellWidth: 36 },
      3: { cellWidth: 28 },
      4: { cellWidth: 34 },
      5: { cellWidth: 22 },
      6: { cellWidth: 38 },
      7: { cellWidth: 35, halign: 'right' },
      8: { cellWidth: 19, halign: 'center' },
      9: { cellWidth: 19, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    didDrawPage: (data: any) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      const pageHeight = doc.internal.pageSize.height;
      doc.text(
        `Confidential • INFAZYS Internal • Page ${data.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    }
  });

  doc.save(`Finacle_Credit_Entries_${today}.pdf`);
};
