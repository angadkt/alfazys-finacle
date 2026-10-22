import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportFilterMeta {
  filterDate?: string;
  filterAgent?: string;
  filterPaymentStatus?: string;
  filterStatus?: string;
  searchQuery?: string;
  agentName?: string;
  dateRangeLabel?: string;
  receivedEntries?: any[];
  summaryMetrics?: {
    totalAed?: number;
    receivedAed?: number;
    balanceAed?: number;
    transferredInr?: number;
    commissionRate?: number;
    commissionAmount?: number;
  };
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

/**
 * Extracts and normalizes flat beneficiary / order transaction rows
 */
const buildTransactionRows = (orders: any[]) => {
  const rows: any[] = [];

  orders.forEach((o) => {
    let recs = parseReceivers(o);
    if (recs.length === 0) {
      recs = [{
        clientName: o.receiver_name || o.party_name || '-',
        accountNumber: o.receiver_account || '-',
        bankName: o.receiver_bank || 'N/A',
        branchName: '',
        ifscCode: o.receiver_ifsc || '-',
        orderAmount: o.inr_value || 0,
        confirmOrderAmount: o.sale_rate || 0,
        aedAmount: o.aed_amount || 0,
        servicer: o.servicer || '-',
        payment_status: o.payment_status || 'Pending'
      }];
    }

    const orderDate = (o.order_date || '').split('T')[0] || (o.date ? String(o.date).split('T')[0] : '-');

    recs.forEach((rec: any) => {
      const inrNum = parseFloat(rec.orderAmount) || 0;
      const rateNum = parseFloat(rec.confirmOrderAmount) || parseFloat(o.sale_rate) || 0;
      const aedVal = rateNum > 0 ? (inrNum / rateNum) : (parseFloat(rec.aedAmount) || 0);

      // Status mapping matching reference (lowercase e.g. "received", "cleared")
      const rawPaymentStatus = (rec.payment_status || o.payment_status || 'Pending').toLowerCase();
      const aedStatus = rawPaymentStatus === 'paid' ? 'received' : rawPaymentStatus;
      const inrStatus = (o.status || 'verified').toLowerCase() === 'verified' ? 'cleared' : (o.status || 'pending').toLowerCase();

      rows.push({
        date: orderDate,
        customer: (rec.clientName || o.receiver_name || o.party_name || '-').trim(),
        accountNo: (rec.accountNumber || o.receiver_account || '-').trim(),
        ifsc: (rec.ifscCode || o.receiver_ifsc || '-').trim(),
        confirmedInr: inrNum,
        rate: rateNum,
        aed: aedVal,
        receivedAed: 0.000,
        aedStatus,
        inrStatus,
        rawOrder: o
      });
    });
  });

  return rows;
};

/**
 * Resolves clean Agent / Counterparty title
 */
const resolveAgentTitle = (orders: any[], meta?: ExportFilterMeta) => {
  if (meta?.agentName && meta.agentName.trim() && meta.agentName !== 'ALL AGENTS') {
    return meta.agentName.trim().toUpperCase();
  }
  if (meta?.filterAgent && meta.filterAgent.trim() && meta.filterAgent !== 'ALL' && meta.filterAgent !== 'All') {
    // Clean "(CIF...)" suffix if present for title display
    const cleaned = meta.filterAgent.replace(/\s*\(CIF\d+\)/i, '').trim();
    if (cleaned) return cleaned.toUpperCase();
  }
  if (orders.length > 0 && orders[0].party_name) {
    const firstParty = orders[0].party_name.trim();
    const isSingleAgent = orders.every((o) => (o.party_name || '').trim() === firstParty);
    if (isSingleAgent && firstParty) {
      return firstParty.toUpperCase();
    }
  }
  return 'ALL COUNTERPARTIES';
};

/**
 * Export Agent Settlement Report to Excel (Matching Image 3 structure)
 */
export const exportOrdersToExcel = (orders: any[], meta?: ExportFilterMeta) => {
  if (!orders || orders.length === 0) {
    alert('No orders available to export.');
    return;
  }

  const txRows = buildTransactionRows(orders);
  const agentTitle = resolveAgentTitle(orders, meta);

  // Compute Totals
  const totalAed = txRows.reduce((sum, r) => sum + r.aed, 0);
  const totalInr = txRows.reduce((sum, r) => sum + r.confirmedInr, 0);

  const receivedEntries = meta?.receivedEntries || [];
  const totalReceivedAed = meta?.summaryMetrics?.receivedAed !== undefined
    ? meta.summaryMetrics.receivedAed
    : receivedEntries.reduce((sum, r) => sum + (parseFloat(r.aed_amount || 0)), 0);

  const balanceAed = meta?.summaryMetrics?.balanceAed !== undefined
    ? meta.summaryMetrics.balanceAed
    : (totalAed - totalReceivedAed);

  const transferredInr = meta?.summaryMetrics?.transferredInr !== undefined
    ? meta.summaryMetrics.transferredInr
    : totalInr;

  const commissionRate = meta?.summaryMetrics?.commissionRate || 0;
  const commissionAmount = meta?.summaryMetrics?.commissionAmount || 0;

  const dateRange = meta?.dateRangeLabel || meta?.filterDate || 'All Dates';
  const generatedTime = new Date().toLocaleString('en-US');

  // Build Sheet Rows
  const sheetRows: any[][] = [
    ['INFAZYS FINACLE'],
    ['Universal Banking Solutions from Infazys'],
    [],
    [`Sale Agent Report AED — ${agentTitle}`],
    [`${dateRange}  •  Generated ${generatedTime}  •  ${txRows.length} record(s)`],
    [], // Spacer
    // Table 1: Transactions Header
    [
      'Date',
      'Customer',
      'A/C No',
      'IFSC',
      'Confirmed INR',
      'Rate',
      'AED',
      'Received AED',
      'AED Status',
      'INR Status'
    ]
  ];

  // Table 1: Data Rows
  txRows.forEach((r) => {
    sheetRows.push([
      r.date,
      r.customer,
      r.accountNo,
      r.ifsc,
      Number(r.confirmedInr.toFixed(2)),
      Number(r.rate.toFixed(2)),
      Number(r.aed.toFixed(3)),
      Number(r.receivedAed.toFixed(3)),
      r.aedStatus,
      r.inrStatus
    ]);
  });

  // Table 2: Summary Block
  sheetRows.push([]);
  sheetRows.push(['Summary', 'Value']);
  sheetRows.push(['Total AED', Number(totalAed.toFixed(3))]);
  sheetRows.push(['Received AED', Number(totalReceivedAed.toFixed(3))]);
  sheetRows.push(['Balance AED', Number(balanceAed.toFixed(3))]);
  sheetRows.push(['Total Transferred INR', Number(transferredInr.toFixed(2))]);
  sheetRows.push([`Commission (${commissionRate}%)`, `AED ${commissionAmount.toFixed(3)}`]);

  // Table 3: Received AED — Credit Entries Summary
  sheetRows.push([]);
  sheetRows.push(['Received AED — Credit Entries Summary', '', '']);
  sheetRows.push(['Date', 'Received AED', 'Description']);

  if (receivedEntries.length > 0) {
    receivedEntries.forEach((re) => {
      const rDate = re.entry_date ? String(re.entry_date).slice(0, 10) : '-';
      const rAmt = parseFloat(re.aed_amount || 0);
      const desc = re.description || (re.mode_of_txn ? `${re.mode_of_txn} ${re.cash_staff || ''}` : '-');
      sheetRows.push([
        rDate,
        Number(rAmt.toFixed(3)),
        desc
      ]);
    });
  } else {
    sheetRows.push(['—', 0.000, 'No credit / cash entries recorded for this period']);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);

  worksheet['!cols'] = [
    { wch: 14 }, // Date
    { wch: 30 }, // Customer
    { wch: 22 }, // A/C No
    { wch: 16 }, // IFSC
    { wch: 18 }, // Confirmed INR
    { wch: 12 }, // Rate
    { wch: 16 }, // AED
    { wch: 16 }, // Received AED
    { wch: 14 }, // AED Status
    { wch: 14 }  // INR Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sale Agent Report');
  const fileDate = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Sale_Agent_Report_${agentTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${fileDate}.xlsx`);
};

/**
 * Export Agent Settlement Report to PDF (Exact Replica of Client Reference Image 3)
 */
export const exportOrdersToPdf = (orders: any[], meta?: ExportFilterMeta) => {
  if (!orders || orders.length === 0) {
    alert('No orders available to export.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const txRows = buildTransactionRows(orders);
  const agentTitle = resolveAgentTitle(orders, meta);

  // Totals & KPI Metrics
  const totalAed = txRows.reduce((sum, r) => sum + r.aed, 0);
  const totalInr = txRows.reduce((sum, r) => sum + r.confirmedInr, 0);

  const receivedEntries = meta?.receivedEntries || [];
  const totalReceivedAed = meta?.summaryMetrics?.receivedAed !== undefined
    ? meta.summaryMetrics.receivedAed
    : receivedEntries.reduce((sum, r) => sum + (parseFloat(r.aed_amount || 0)), 0);

  const balanceAed = meta?.summaryMetrics?.balanceAed !== undefined
    ? meta.summaryMetrics.balanceAed
    : (totalAed - totalReceivedAed);

  const transferredInr = meta?.summaryMetrics?.transferredInr !== undefined
    ? meta.summaryMetrics.transferredInr
    : totalInr;

  const commissionRate = meta?.summaryMetrics?.commissionRate || 0;
  const commissionAmount = meta?.summaryMetrics?.commissionAmount || 0;

  const dateRange = meta?.dateRangeLabel || meta?.filterDate || 'All Dates';
  const generatedTime = new Date().toLocaleString('en-US');

  // ── 1. Top Executive Black Banner with Gold Branding ──
  doc.setFillColor(15, 15, 15); // #0f0f0f deep black
  doc.rect(0, 0, 297, 16.5, 'F');

  // Gold Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(218, 175, 55); // #daaf37 Gold
  doc.text('INFAZYS FINACLE', 14, 8);

  // Sub-brand / tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(215, 215, 215);
  doc.text('Universal Banking Solutions from Infazys', 14, 13);

  // ── 2. Report Title & Clean Metadata Subtitle (No clunky filter box) ──
  let cursorY = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 17, 17); // Dark black
  doc.text(`Sale Agent Report AED — ${agentTitle}`, 14, cursorY);

  cursorY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  doc.text(`${dateRange}  •  Generated ${generatedTime}  •  ${txRows.length} record(s)`, 14, cursorY);

  // Thin Gold Accent Line below title
  cursorY += 2.5;
  doc.setDrawColor(218, 175, 55); // Gold line
  doc.setLineWidth(0.45);
  doc.line(14, cursorY, 283, cursorY);

  cursorY += 4;

  // ── 3. Table 1: Main Order / Counterparty Remittances Table ──
  const table1Head = [[
    'Date',
    'Customer',
    'A/C No',
    'IFSC',
    'Confirmed INR',
    'Rate',
    'AED',
    'Received AED',
    'AED Status',
    'INR Status'
  ]];

  const table1Body = txRows.map((r) => [
    r.date,
    r.customer,
    r.accountNo,
    r.ifsc,
    r.confirmedInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    r.rate > 0 ? r.rate.toFixed(2) : '-',
    r.aed.toFixed(3),
    r.receivedAed.toFixed(3),
    r.aedStatus,
    r.inrStatus
  ]);

  autoTable(doc, {
    head: table1Head,
    body: table1Body,
    startY: cursorY,
    theme: 'grid',
    styles: {
      fontSize: 7.2,
      cellPadding: 1.8,
      lineColor: [225, 225, 225],
      lineWidth: 0.12,
      textColor: [25, 25, 25],
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [17, 17, 17], // #111111 Black header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.4,
      halign: 'left',
      cellPadding: 2.2
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'left' },
      1: { cellWidth: 46, halign: 'left', fontStyle: 'bold' },
      2: { cellWidth: 34, halign: 'left' },
      3: { cellWidth: 26, halign: 'left' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 24, halign: 'right' },
      8: { cellWidth: 23, halign: 'center' },
      9: { cellWidth: 24, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    }
  });

  // Calculate position after Table 1
  let finalY = (doc as any).lastAutoTable?.finalY || cursorY + 40;

  // Check if we need a new page for Summary & Credit Entries tables
  if (finalY > 140) {
    doc.addPage();
    finalY = 20;
  } else {
    finalY += 6;
  }

  // ── 4. Table 2: Financial Summary Block (Left-Aligned, Exactly Matching Image 3) ──
  const summaryHead = [['Summary', 'Value']];
  const summaryBody = [
    ['Total AED', totalAed.toFixed(3)],
    ['Received AED', totalReceivedAed.toFixed(3)],
    ['Balance AED', balanceAed.toFixed(3)],
    ['Total Transferred INR', transferredInr.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })],
    [`Commission (${commissionRate}%)`, `AED ${commissionAmount.toFixed(3)}`]
  ];

  autoTable(doc, {
    head: summaryHead,
    body: summaryBody,
    startY: finalY,
    theme: 'grid',
    margin: { left: 14 },
    tableWidth: 110, // Compact 110mm width matching client reference
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [225, 225, 225],
      lineWidth: 0.12,
      textColor: [25, 25, 25],
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [17, 17, 17],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.6,
      cellPadding: 2.2
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', halign: 'left' },
      1: { cellWidth: 55, halign: 'right', fontStyle: 'bold' }
    }
  });

  finalY = (doc as any).lastAutoTable?.finalY || finalY + 35;

  // Check page overflow before Table 3
  if (finalY > 155) {
    doc.addPage();
    finalY = 20;
  } else {
    finalY += 6;
  }

  // ── 5. Table 3: "Received AED — Credit Entries Summary" (Matching Image 3) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(17, 17, 17);
  doc.text('Received AED — Credit Entries Summary', 14, finalY);

  finalY += 2.5;

  const creditEntriesHead = [['Date', 'Received AED', 'Description']];
  const creditEntriesBody = receivedEntries.length > 0
    ? receivedEntries.map((re) => {
        const rDate = re.entry_date ? String(re.entry_date).slice(0, 10) : '-';
        const rAmt = parseFloat(re.aed_amount || 0);
        const desc = re.description || (re.mode_of_txn ? `${re.mode_of_txn} ${re.cash_staff || ''}` : '-');
        return [
          rDate,
          rAmt.toFixed(3),
          desc.toUpperCase()
        ];
      })
    : [['—', '0.000', 'No credit / cash entries recorded for this period']];

  autoTable(doc, {
    head: creditEntriesHead,
    body: creditEntriesBody,
    startY: finalY,
    theme: 'grid',
    margin: { left: 14, right: 14 },
    styles: {
      fontSize: 7.2,
      cellPadding: 1.8,
      lineColor: [225, 225, 225],
      lineWidth: 0.12,
      textColor: [25, 25, 25],
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [17, 17, 17],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.4,
      cellPadding: 2.2
    },
    columnStyles: {
      0: { cellWidth: 35, halign: 'left' },
      1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 'auto', halign: 'left' }
    }
  });

  // ── 6. Page Numbers & Confidential Footer on All Pages ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 130);
    doc.text(
      `Confidential • INFAZYS Internal • Page ${i}`,
      doc.internal.pageSize.width / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const fileDate = new Date().toISOString().split('T')[0];
  doc.save(`Sale_Agent_Report_${agentTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${fileDate}.pdf`);
};
