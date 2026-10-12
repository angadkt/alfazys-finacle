import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportFilterMeta {
  filterDate?: string;
  filterAgent?: string;
  filterPaymentStatus?: string;
  filterStatus?: string;
  searchQuery?: string;
}

const parseReceivers = (order: any) => {
  let recs = order.receivers_data;
  if (typeof recs === 'string') {
    try {
      recs = JSON.parse(recs);
    } catch {
      recs = [];
    }
  }
  return Array.isArray(recs) ? recs : [];
};

export const exportOrdersToExcel = (orders: any[], meta?: ExportFilterMeta) => {
  if (!orders || orders.length === 0) {
    alert('No orders available to export.');
    return;
  }

  let grandTotalAed = 0;
  let grandTotalInr = 0;

  // 1. Build Header Metadata rows
  const filterDesc = [
    meta?.filterDate ? `Date: ${meta.filterDate}` : 'Date: All',
    meta?.filterAgent ? `Agent: ${meta.filterAgent}` : 'Agent: All',
    meta?.filterPaymentStatus && meta.filterPaymentStatus !== 'All' ? `Payment: ${meta.filterPaymentStatus}` : 'Payment: All',
    meta?.filterStatus && meta.filterStatus !== 'All' ? `Status: ${meta.filterStatus}` : 'Status: All',
    meta?.searchQuery ? `Search: "${meta.searchQuery}"` : 'Search: None'
  ].join('  |  ');

  const rows: any[][] = [
    ['INFAZYS FINACLE - UNIVERSAL SETTLEMENT MODULE'],
    ['ORDER TRANSACTION AUDIT REGISTER'],
    [`Applied Filters: ${filterDesc}`],
    [`Generated On: ${new Date().toLocaleString()}  |  Total Matching Records: ${orders.length}`],
    [], // empty spacer row
    [
      'Order No',
      'Date',
      'Agent / Customer',
      'Beneficiary Name',
      'Beneficiary Account',
      'Bank Name',
      'IFSC Code',
      'Sale Rate',
      'AED Amount',
      'INR Value',
      'Txn Through',
      'Issued By',
      'Verified By',
      'Verification Status',
      'Payment Status'
    ]
  ];

  // 2. Build Data Rows
  orders.forEach((o) => {
    const recs = parseReceivers(o);
    const hasMultiple = recs.length > 0;

    if (hasMultiple) {
      recs.forEach((acc: any, idx: number) => {
        const inrNum = parseFloat(acc.orderAmount) || 0;
        const rateNum = parseFloat(acc.confirmOrderAmount) || 0;
        const aedVal = rateNum > 0 ? (inrNum / rateNum) : 0;

        grandTotalAed += aedVal;
        grandTotalInr += inrNum;

        rows.push([
          idx === 0 ? o.order_no : `${o.order_no} (#${idx + 1})`,
          (o.order_date || '').split('T')[0],
          o.party_name || (o.party_id ? `CIF: ${o.party_id}` : 'N/A'),
          acc.clientName || o.receiver_name || '-',
          acc.accountNumber || o.receiver_account || '-',
          acc.bankName || o.receiver_bank || 'N/A',
          acc.ifscCode || o.receiver_ifsc || '-',
          rateNum > 0 ? rateNum.toFixed(2) : (o.sale_rate || '-'),
          aedVal > 0 ? Number(aedVal.toFixed(2)) : '-',
          inrNum > 0 ? Number(inrNum.toFixed(2)) : '-',
          o.transaction_through || '-',
          o.created_by_name || 'Admin',
          o.verified_by_name || (o.status === 'verified' ? 'Admin' : '-'),
          (o.status || 'pending').toUpperCase(),
          o.payment_status || 'Pending'
        ]);
      });
    } else {
      const inrNum = parseFloat(o.inr_value) || 0;
      const aedNum = parseFloat(o.aed_amount) || 0;

      grandTotalAed += aedNum;
      grandTotalInr += inrNum;

      rows.push([
        o.order_no,
        (o.order_date || '').split('T')[0],
        o.party_name || (o.party_id ? `CIF: ${o.party_id}` : 'N/A'),
        o.receiver_name || '-',
        o.receiver_account || '-',
        o.receiver_bank || 'N/A',
        o.receiver_ifsc || '-',
        o.sale_rate || '-',
        aedNum > 0 ? Number(aedNum.toFixed(2)) : '-',
        inrNum > 0 ? Number(inrNum.toFixed(2)) : '-',
        o.transaction_through || '-',
        o.created_by_name || 'Admin',
        o.verified_by_name || (o.status === 'verified' ? 'Admin' : '-'),
        (o.status || 'pending').toUpperCase(),
        o.payment_status || 'Pending'
      ]);
    }
  });

  // 3. Grand Total Row
  rows.push([]);
  rows.push([
    'GRAND TOTAL',
    `${orders.length} Orders`,
    '',
    '',
    '',
    '',
    '',
    '',
    Number(grandTotalAed.toFixed(2)),
    Number(grandTotalInr.toFixed(2)),
    '',
    '',
    '',
    '',
    ''
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 16 }, // Order No
    { wch: 13 }, // Date
    { wch: 25 }, // Agent / Customer
    { wch: 22 }, // Beneficiary Name
    { wch: 22 }, // Beneficiary Account
    { wch: 20 }, // Bank Name
    { wch: 14 }, // IFSC Code
    { wch: 12 }, // Sale Rate
    { wch: 16 }, // AED Amount
    { wch: 16 }, // INR Value
    { wch: 16 }, // Txn Through
    { wch: 14 }, // Issued By
    { wch: 14 }, // Verified By
    { wch: 18 }, // Verification Status
    { wch: 16 }  // Payment Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders Audit');
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Finacle_Orders_Register_${today}.xlsx`);
};

export const exportOrdersToPdf = (orders: any[], meta?: ExportFilterMeta) => {
  if (!orders || orders.length === 0) {
    alert('No orders available to export.');
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
  doc.text('UNIVERSAL SETTLEMENT - ORDER TRANSACTION AUDIT REGISTER', 14, 19);

  // 2. Active Filter Summary Card
  doc.setFillColor(243, 246, 251);
  doc.setDrawColor(196, 212, 236);
  doc.rect(14, 22, 269, 10, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(50, 60, 80);
  doc.setFont('helvetica', 'normal');

  const filterItems = [
    `Date: ${meta?.filterDate || 'All'}`,
    `Agent: ${meta?.filterAgent || 'All'}`,
    `Payment: ${meta?.filterPaymentStatus || 'All'}`,
    `Status: ${meta?.filterStatus || 'All'}`,
    meta?.searchQuery ? `Search: "${meta.searchQuery}"` : null
  ].filter(Boolean).join('   |   ');

  doc.text(`Active Filters:  ${filterItems}`, 17, 27);
  doc.text(`Generated: ${new Date().toLocaleString()}   |   Total Orders: ${orders.length}`, 17, 30.5);

  let grandTotalAed = 0;
  let grandTotalInr = 0;

  const head = [[
    'Order No',
    'Date',
    'Agent / Customer',
    'Beneficiary Name',
    'Beneficiary Account & Bank',
    'Sale Rate',
    'AED Amount',
    'INR Value',
    'Txn Through',
    'Status',
    'Payment'
  ]];

  const body: any[] = [];

  orders.forEach((o) => {
    const recs = parseReceivers(o);
    const hasMultiple = recs.length > 0;

    let benName = o.receiver_name || '-';
    let benAcc = `${o.receiver_account || '-'}${o.receiver_bank ? `\n(${o.receiver_bank})` : ''}`;
    let saleRate = String(o.sale_rate || '-');
    let aedAmt = o.aed_amount ? parseFloat(o.aed_amount).toFixed(2) : '-';
    let inrVal = o.inr_value ? parseFloat(o.inr_value).toFixed(2) : '-';

    if (hasMultiple) {
      benName = recs.map((r: any) => r.clientName || '-').join('\n');
      benAcc = recs.map((r: any) => `${r.accountNumber || '-'}${r.bankName ? ` (${r.bankName})` : ''}`).join('\n');
      saleRate = recs.map((r: any) => r.confirmOrderAmount || o.sale_rate || '-').join('\n');

      let itemTotalAed = 0;
      let itemTotalInr = 0;
      const aedLines: string[] = [];
      const inrLines: string[] = [];

      recs.forEach((r: any) => {
        const inr = parseFloat(r.orderAmount) || 0;
        const rate = parseFloat(r.confirmOrderAmount) || 0;
        const aed = rate > 0 ? inr / rate : 0;
        itemTotalAed += aed;
        itemTotalInr += inr;
        aedLines.push(aed > 0 ? aed.toFixed(2) : '-');
        inrLines.push(inr > 0 ? inr.toFixed(2) : '-');
      });

      grandTotalAed += itemTotalAed;
      grandTotalInr += itemTotalInr;

      if (recs.length > 1) {
        aedAmt = `Tot: ${itemTotalAed.toFixed(2)}\n` + aedLines.join('\n');
        inrVal = `Tot: ${itemTotalInr.toFixed(2)}\n` + inrLines.join('\n');
      } else {
        aedAmt = itemTotalAed.toFixed(2);
        inrVal = itemTotalInr.toFixed(2);
      }
    } else {
      const inrNum = parseFloat(o.inr_value) || 0;
      const aedNum = parseFloat(o.aed_amount) || 0;
      grandTotalAed += aedNum;
      grandTotalInr += inrNum;
    }

    body.push([
      o.order_no,
      (o.order_date || '').split('T')[0],
      o.party_name || (o.party_id ? `CIF: ${o.party_id}` : 'N/A'),
      benName,
      benAcc,
      saleRate,
      aedAmt,
      inrVal,
      o.transaction_through || '-',
      (o.status || 'pending').toUpperCase(),
      o.payment_status || 'Pending'
    ]);
  });

  const foot = [[
    'GRAND TOTAL',
    `${orders.length} orders`,
    '',
    '',
    '',
    '',
    grandTotalAed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    grandTotalInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    '',
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
      fontSize: 7.2,
      cellPadding: 2,
      lineColor: [196, 212, 236],
      lineWidth: 0.15,
      textColor: [30, 30, 30]
    },
    headStyles: {
      fillColor: [30, 70, 118],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.8
    },
    footStyles: {
      fillColor: [30, 70, 118],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 18 },
      2: { cellWidth: 32 },
      3: { cellWidth: 30 },
      4: { cellWidth: 34 },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 24, halign: 'right' },
      8: { cellWidth: 22 },
      9: { cellWidth: 19, halign: 'center' },
      10: { cellWidth: 20, halign: 'center' }
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

  doc.save(`Finacle_Orders_Register_${today}.pdf`);
};
