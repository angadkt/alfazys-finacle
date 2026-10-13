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

  // 1. Filter Description
  const filterDesc = [
    meta?.filterDate ? `Date: ${meta.filterDate}` : 'Date: All',
    meta?.filterMode && meta.filterMode !== 'ALL' ? `Mode: ${meta.filterMode}` : 'Mode: All',
    meta?.filterStatus && meta.filterStatus !== 'ALL' ? `Status: ${meta.filterStatus}` : 'Status: All',
    meta?.searchQuery ? `Search: "${meta.searchQuery}"` : 'Search: None'
  ].join('  |  ');

  // 2. Header Rows
  const rows: any[][] = [
    ['INFAZYS FINACLE - UNIVERSAL SETTLEMENT MODULE'],
    ['CREDIT ENTRY AUDIT & SETTLEMENT REGISTER'],
    [`Applied Filters: ${filterDesc}`],
    [`Generated On: ${new Date().toLocaleString()}  |  Total Matching Records: ${entries.length}`],
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

  // 3. Data Rows
  entries.forEach((e) => {
    const amt = typeof e.totalAmount === 'number' ? e.totalAmount : parseFloat(String(e.totalAmount)) || 0;
    grandTotalInr += amt;

    const utrStr = Array.isArray(e.utrItems)
      ? e.utrItems.map((u: any) => `${u.utrNumber} (₹${u.amount})`).join('; ')
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

  // 4. Grand Total Row
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

  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  const today = new Date().toISOString().split('T')[0];

  let grandTotalInr = 0;
  entries.forEach((e) => {
    const amt = typeof e.totalAmount === 'number' ? e.totalAmount : parseFloat(String(e.totalAmount)) || 0;
    grandTotalInr += amt;
  });

  // 1. Header & Platform Branding
  doc.setFontSize(14);
  doc.setTextColor(30, 70, 118); // #1e4676
  doc.setFont('helvetica', 'bold');
  doc.text('INFAZYS FINACLE CORE BANKING PLATFORM', 14, 12);

  doc.setFontSize(9.5);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.text('UNIVERSAL SETTLEMENT • CREDIT ENTRY AUDIT & SETTLEMENT REGISTER', 14, 17.5);

  // 2. Active Filter & KPI Summary Cards (Side by Side)
  // Left: Filters
  doc.setFillColor(245, 248, 253);
  doc.setDrawColor(196, 212, 236);
  doc.rect(14, 20.5, 165, 13, 'FD');

  const filterItems = [
    `Date: ${meta?.filterDate || 'All'}`,
    `Mode: ${meta?.filterMode || 'All'}`,
    `Status: ${meta?.filterStatus || 'All'}`,
    meta?.searchQuery ? `Search: "${meta.searchQuery}"` : null
  ].filter(Boolean).join('   |   ');

  doc.setFontSize(7.5);
  doc.setTextColor(50, 60, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`Active Filters:  ${filterItems}`, 17, 25);
  doc.text(`Generated On: ${new Date().toLocaleString()}   •   Confidential Audit Export`, 17, 29.5);

  // Right: KPI Card
  doc.setFillColor(236, 243, 252);
  doc.setDrawColor(180, 204, 235);
  doc.rect(183, 20.5, 100, 13, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(30, 70, 118);
  doc.setFont('helvetica', 'bold');
  doc.text('SETTLEMENT AUDIT SUMMARY', 186, 24.5);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(`Total Entries: ${entries.length}`, 186, 28.5);
  doc.text(`Total Value: INR ${grandTotalInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 186, 31.5);

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
      { content: e.id, styles: { fontStyle: 'bold' as const, textColor: [30, 70, 118] } },
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
      styles: { fontStyle: 'bold' as const, halign: 'right' as const, fillColor: [30, 70, 118], textColor: 255, fontSize: 7.8 }
    },
    {
      content: `INR ${grandTotalInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      styles: { fontStyle: 'bold' as const, halign: 'right' as const, fillColor: [30, 70, 118], textColor: 255, fontSize: 7.8 }
    },
    {
      content: '',
      colSpan: 2,
      styles: { fillColor: [30, 70, 118] }
    }
  ]];

  autoTable(doc, {
    head,
    body,
    foot,
    startY: 36,
    theme: 'grid',
    styles: {
      fontSize: 7.2,
      cellPadding: 1.8,
      lineColor: [200, 215, 235],
      lineWidth: 0.15,
      textColor: [30, 30, 30],
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [30, 70, 118],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      cellPadding: 2.2
    },
    footStyles: {
      fillColor: [30, 70, 118],
      textColor: 255,
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
      fillColor: [250, 252, 255]
    },
    didDrawPage: (data: any) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7.2);
      doc.setTextColor(120, 120, 120);
      const pageHeight = doc.internal.pageSize.height;
      doc.text(
        `Confidential - Finacle Core Banking Platform  •  Page ${data.pageNumber} of ${pageCount}  •  Exported on ${new Date().toLocaleString()}`,
        14,
        pageHeight - 6
      );
    }
  });

  doc.save(`Finacle_Credit_Entries_${today}.pdf`);
};
