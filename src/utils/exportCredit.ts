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

  // 1. Header & Title Block
  doc.setFontSize(15);
  doc.setTextColor(30, 70, 118); // #1e4676
  doc.setFont('helvetica', 'bold');
  doc.text('INFAZYS FINACLE CORE BANKING PLATFORM', 14, 13);

  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.text('CREDIT ENTRY AUDIT & SETTLEMENT REGISTER', 14, 19);

  // 2. Active Filter Summary Card
  doc.setFillColor(243, 246, 251);
  doc.setDrawColor(196, 212, 236);
  doc.rect(14, 22, 269, 10, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(50, 60, 80);
  doc.setFont('helvetica', 'normal');

  const filterItems = [
    `Date: ${meta?.filterDate || 'All'}`,
    `Mode: ${meta?.filterMode || 'All'}`,
    `Status: ${meta?.filterStatus || 'All'}`,
    meta?.searchQuery ? `Search: "${meta.searchQuery}"` : null
  ].filter(Boolean).join('   |   ');

  doc.text(`Active Filters:  ${filterItems}`, 17, 27);
  doc.text(`Generated: ${new Date().toLocaleString()}   |   Total Entries: ${entries.length}`, 17, 30.5);

  let grandTotalInr = 0;

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

  const body = entries.map((e) => {
    const amt = typeof e.totalAmount === 'number' ? e.totalAmount : parseFloat(String(e.totalAmount)) || 0;
    grandTotalInr += amt;

    const utrLines = Array.isArray(e.utrItems) && e.utrItems.length > 0
      ? e.utrItems.map((u: any) => `${u.utrNumber} (₹${Number(u.amount).toLocaleString('en-IN')})`).join('\n')
      : 'None';

    return [
      e.id,
      e.paymentDate || '',
      (e.beneficiaryName || '').toUpperCase(),
      e.accountNumber || '',
      `${e.bankName || ''}\n${e.ifscCode || ''}`,
      e.paymentMode || '',
      utrLines,
      `₹ ${amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      (e.status || 'PENDING').toUpperCase(),
      e.createdBy || '-'
    ];
  });

  const foot = [[
    'GRAND TOTAL',
    `${entries.length} entries`,
    '',
    '',
    '',
    '',
    '',
    `₹ ${grandTotalInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    '',
    ''
  ]];

  autoTable(doc, {
    head,
    body,
    foot,
    startY: 34,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [196, 212, 236],
      lineWidth: 0.15,
      textColor: [30, 30, 30]
    },
    headStyles: {
      fillColor: [30, 70, 118],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8
    },
    footStyles: {
      fillColor: [30, 70, 118],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 20 },
      2: { cellWidth: 40 },
      3: { cellWidth: 30 },
      4: { cellWidth: 35 },
      5: { cellWidth: 24 },
      6: { cellWidth: 38 },
      7: { cellWidth: 28, halign: 'right' },
      8: { cellWidth: 20, halign: 'center' },
      9: { cellWidth: 20, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [247, 250, 254]
    },
    didDrawPage: (data: any) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      const pageHeight = doc.internal.pageSize.height;
      doc.text(
        `Confidential - Finacle Banking Platform  •  Page ${data.pageNumber} of ${pageCount}  •  Exported on ${new Date().toLocaleString()}`,
        14,
        pageHeight - 6
      );
    }
  });

  doc.save(`Finacle_Credit_Entries_${today}.pdf`);
};
