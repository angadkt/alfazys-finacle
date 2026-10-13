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
  let totalReceiversCount = 0;

  // 1. Build Header Metadata rows
  const filterDesc = [
    meta?.filterDate ? `Date: ${meta.filterDate}` : 'Date: All',
    meta?.filterAgent ? `Agent: ${meta.filterAgent}` : 'Agent: All',
    meta?.filterPaymentStatus && meta.filterPaymentStatus !== 'All' ? `Payment: ${meta.filterPaymentStatus}` : 'Payment: All',
    meta?.filterStatus && meta.filterStatus !== 'All' ? `Status: ${meta.filterStatus}` : 'Status: All',
    meta?.searchQuery ? `Search: "${meta.searchQuery}"` : 'Search: None'
  ].join('  |  ');

  const rows: any[][] = [
    ['INFAZYS FINACLE CORE BANKING PLATFORM - UNIVERSAL SETTLEMENT MODULE'],
    ['ORDER TRANSACTION AUDIT & BENEFICIARY SETTLEMENT REGISTER'],
    [`Applied Filters: ${filterDesc}`],
    [`Generated On: ${new Date().toLocaleString()}  |  Total Orders: ${orders.length}`],
    [], // empty spacer row
    [
      'Order No',
      'Date',
      'Agent / Customer',
      'Ben #',
      'Beneficiary Name',
      'Account Number',
      'Bank Name',
      'Branch Name',
      'IFSC Code',
      'Sale Rate',
      'AED Amount',
      'INR Value',
      'Txn Through',
      'Servicer',
      'Issued By',
      'Verified By',
      'Verification Status',
      'Beneficiary Payment',
      'Order Payment Status'
    ]
  ];

  // 2. Build Data Rows
  orders.forEach((o) => {
    let recs = parseReceivers(o);
    if (recs.length === 0) {
      // Fallback single receiver
      recs = [{
        clientName: o.receiver_name || '-',
        accountNumber: o.receiver_account || '-',
        bankName: o.receiver_bank || 'N/A',
        branchName: '',
        ifscCode: o.receiver_ifsc || '-',
        orderAmount: o.inr_value || 0,
        confirmOrderAmount: o.sale_rate || 0,
        servicer: o.servicer || '-',
        payment_status: o.payment_status || 'Pending'
      }];
    }

    recs.forEach((acc: any, idx: number) => {
      totalReceiversCount++;
      const inrNum = parseFloat(acc.orderAmount) || 0;
      const rateNum = parseFloat(acc.confirmOrderAmount) || parseFloat(o.sale_rate) || 0;
      const aedVal = rateNum > 0 ? (inrNum / rateNum) : (parseFloat(acc.aedAmount) || 0);

      grandTotalAed += aedVal;
      grandTotalInr += inrNum;

      rows.push([
        o.order_no,
        (o.order_date || '').split('T')[0],
        o.party_name || (o.party_id ? `CIF: ${o.party_id}` : 'N/A'),
        idx + 1,
        acc.clientName || o.receiver_name || '-',
        acc.accountNumber || o.receiver_account || '-',
        acc.bankName || o.receiver_bank || 'N/A',
        acc.branchName || '',
        acc.ifscCode || o.receiver_ifsc || '-',
        rateNum > 0 ? Number(rateNum.toFixed(2)) : (o.sale_rate || '-'),
        aedVal > 0 ? Number(aedVal.toFixed(2)) : 0,
        inrNum > 0 ? Number(inrNum.toFixed(2)) : 0,
        o.transaction_through || '-',
        acc.servicer || o.servicer || '-',
        o.created_by_name || 'Admin',
        o.verified_by_name || (o.status === 'verified' ? 'Admin' : '-'),
        (o.status || 'pending').toUpperCase(),
        (acc.payment_status || o.payment_status || 'Pending').toUpperCase(),
        (o.payment_status || 'Pending').toUpperCase()
      ]);
    });
  });

  // 3. Grand Total Row
  rows.push([]);
  rows.push([
    'GRAND TOTAL',
    `${orders.length} Orders`,
    `${totalReceiversCount} Beneficiaries`,
    '',
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
    '',
    '',
    ''
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 15 }, // Order No
    { wch: 12 }, // Date
    { wch: 25 }, // Agent / Customer
    { wch: 7 },  // Ben #
    { wch: 22 }, // Beneficiary Name
    { wch: 20 }, // Account Number
    { wch: 20 }, // Bank Name
    { wch: 18 }, // Branch Name
    { wch: 14 }, // IFSC Code
    { wch: 11 }, // Sale Rate
    { wch: 15 }, // AED Amount
    { wch: 16 }, // INR Value
    { wch: 14 }, // Txn Through
    { wch: 12 }, // Servicer
    { wch: 14 }, // Issued By
    { wch: 14 }, // Verified By
    { wch: 18 }, // Verification Status
    { wch: 18 }, // Beneficiary Payment
    { wch: 18 }  // Order Payment Status
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

  let grandTotalAed = 0;
  let grandTotalInr = 0;
  let totalReceiversCount = 0;

  // Pre-calculate totals for summary card
  orders.forEach((o) => {
    let recs = parseReceivers(o);
    if (recs.length === 0) {
      recs = [{
        orderAmount: o.inr_value || 0,
        confirmOrderAmount: o.sale_rate || 0,
        aedAmount: o.aed_amount || 0
      }];
    }
    totalReceiversCount += recs.length;
    recs.forEach((r: any) => {
      const inr = parseFloat(r.orderAmount) || 0;
      const rate = parseFloat(r.confirmOrderAmount) || parseFloat(o.sale_rate) || 0;
      const aed = rate > 0 ? inr / rate : (parseFloat(r.aedAmount) || 0);
      grandTotalInr += inr;
      grandTotalAed += aed;
    });
  });

  // 1. Header & Platform Branding
  doc.setFontSize(14);
  doc.setTextColor(30, 70, 118); // #1e4676
  doc.setFont('helvetica', 'bold');
  doc.text('INFAZYS FINACLE CORE BANKING PLATFORM', 14, 12);

  doc.setFontSize(9.5);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.text('UNIVERSAL SETTLEMENT • ORDER TRANSACTION AUDIT REGISTER', 14, 17.5);

  // 2. Active Filters & Executive Summary Cards (Side by Side)
  // Left: Filter Criteria
  doc.setFillColor(245, 248, 253);
  doc.setDrawColor(196, 212, 236);
  doc.rect(14, 20.5, 165, 13, 'FD');

  const filterItems = [
    `Date: ${meta?.filterDate || 'All'}`,
    `Agent: ${meta?.filterAgent || 'All'}`,
    `Payment: ${meta?.filterPaymentStatus || 'All'}`,
    `Status: ${meta?.filterStatus || 'All'}`,
    meta?.searchQuery ? `Search: "${meta.searchQuery}"` : null
  ].filter(Boolean).join('   |   ');

  doc.setFontSize(7.5);
  doc.setTextColor(50, 60, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`Active Filters:  ${filterItems}`, 17, 25);
  doc.text(`Generated On: ${new Date().toLocaleString()}   •   Confidential Audit Export`, 17, 29.5);

  // Right: KPI Summary Badges Card
  doc.setFillColor(236, 243, 252);
  doc.setDrawColor(180, 204, 235);
  doc.rect(183, 20.5, 100, 13, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(30, 70, 118);
  doc.setFont('helvetica', 'bold');
  doc.text('AUDIT SUMMARY METRICS', 186, 24.5);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(`Total Orders: ${orders.length}    |    Total Beneficiaries: ${totalReceiversCount}`, 186, 28.5);
  doc.text(
    `AED Total: AED ${grandTotalAed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}    |    INR Total: INR ${grandTotalInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    186,
    31.5
  );

  // 3. Define Table Columns (Total width exactly matches 269mm on Landscape A4)
  const head = [[
    '#',
    'Client / Beneficiary',
    'Account Number',
    'Bank & Branch',
    'IFSC Code',
    'INR Amount',
    'Sale Rate',
    'AED Amount',
    'Servicer',
    'Payment Status'
  ]];

  const body: any[] = [];

  // 4. Build Structured Rows: Order Banner -> Receiver Rows -> Order Subtotal
  orders.forEach((o, oIdx) => {
    let recs = parseReceivers(o);
    if (recs.length === 0) {
      recs = [{
        clientName: o.receiver_name || '-',
        accountNumber: o.receiver_account || '-',
        bankName: o.receiver_bank || '-',
        branchName: '',
        ifscCode: o.receiver_ifsc || '-',
        orderAmount: o.inr_value || 0,
        confirmOrderAmount: o.sale_rate || 0,
        aedAmount: o.aed_amount || 0,
        servicer: o.servicer || '-',
        payment_status: o.payment_status || 'Pending'
      }];
    }

    let orderTotalAed = 0;
    let orderTotalInr = 0;

    recs.forEach((r: any) => {
      const inr = parseFloat(r.orderAmount) || 0;
      const rate = parseFloat(r.confirmOrderAmount) || parseFloat(o.sale_rate) || 0;
      const aed = rate > 0 ? inr / rate : (parseFloat(r.aedAmount) || 0);
      orderTotalInr += inr;
      orderTotalAed += aed;
    });

    const orderDate = (o.order_date || '').split('T')[0] || '-';
    const partyName = o.party_name || (o.party_id ? `CIF: ${o.party_id}` : 'N/A');
    const txnThrough = o.transaction_through || '-';
    const issuedBy = o.created_by_name || 'Admin';
    const verifiedBy = o.verified_by_name || (o.status === 'verified' ? 'Admin' : '-');
    const statusText = (o.status || 'pending').toUpperCase();
    const orderPayment = (o.payment_status || 'Pending').toUpperCase();

    // ── Row 1: Executive Order Header Banner ──
    body.push([
      {
        content: `ORDER: ${o.order_no}   •   DATE: ${orderDate}   •   AGENT / CUSTOMER: ${partyName}   •   TXN THROUGH: ${txnThrough}\nISSUED BY: ${issuedBy}   •   VERIFIED BY: ${verifiedBy}   •   STATUS: ${statusText}   •   ORDER PAYMENT: ${orderPayment}   •   BENEFICIARIES: ${recs.length}`,
        colSpan: 10,
        styles: {
          fillColor: [30, 70, 118], // #1e4676
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.6,
          cellPadding: { top: 2.4, bottom: 2.4, left: 3, right: 3 },
          lineColor: [180, 204, 235],
          lineWidth: 0.2
        }
      }
    ]);

    // ── Rows 2..N: Individual Receiver Details ──
    recs.forEach((rec: any, rIdx: number) => {
      const inrNum = parseFloat(rec.orderAmount) || 0;
      const rateNum = parseFloat(rec.confirmOrderAmount) || parseFloat(o.sale_rate) || 0;
      const aedVal = rateNum > 0 ? inrNum / rateNum : (parseFloat(rec.aedAmount) || 0);

      const bankInfo = [rec.bankName || o.receiver_bank || '', rec.branchName || ''].filter(Boolean).join(' - ') || '-';
      const ifsc = rec.ifscCode || o.receiver_ifsc || '-';
      const recStatus = (rec.payment_status || o.payment_status || 'Pending').trim();
      const recStatusUpper = recStatus.toUpperCase();

      // Colored status text
      let statusTextColor: [number, number, number] = [70, 70, 70];
      if (recStatusUpper === 'PAID') {
        statusTextColor = [16, 128, 64]; // Emerald green
      } else if (recStatusUpper === 'PENDING') {
        statusTextColor = [180, 105, 15]; // Amber
      } else if (recStatusUpper === 'PARTIAL') {
        statusTextColor = [24, 90, 180]; // Blue
      } else if (recStatusUpper === 'CANCELLED') {
        statusTextColor = [180, 30, 30]; // Red
      }

      body.push([
        { content: String(rIdx + 1), styles: { halign: 'center', textColor: [100, 100, 100] } },
        { content: (rec.clientName || o.receiver_name || '-').toUpperCase(), styles: { fontStyle: 'bold', textColor: [30, 30, 30] } },
        { content: rec.accountNumber || o.receiver_account || '-', styles: { fontStyle: 'bold', textColor: [40, 50, 70] } },
        { content: bankInfo, styles: { textColor: [60, 60, 60] } },
        { content: ifsc, styles: { halign: 'center', textColor: [80, 80, 80] } },
        { content: `INR ${inrNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, styles: { halign: 'right' as const, fontStyle: 'bold' as const, textColor: [20, 20, 20] } },
        { content: rateNum > 0 ? rateNum.toFixed(2) : (o.sale_rate || '-'), styles: { halign: 'right', textColor: [60, 60, 60] } },
        { content: `AED ${aedVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [16, 115, 65] } },
        { content: rec.servicer || o.servicer || '-', styles: { halign: 'center', textColor: [90, 90, 90] } },
        { content: recStatusUpper, styles: { halign: 'center', fontStyle: 'bold', textColor: statusTextColor } }
      ]);
    });

    // ── Row N+1: Order Subtotal Row ──
    body.push([
      {
        content: `SUBTOTAL — ${o.order_no}  (${recs.length} ${recs.length === 1 ? 'Beneficiary' : 'Beneficiaries'})`,
        colSpan: 5,
        styles: {
          fillColor: [238, 244, 252],
          textColor: [30, 70, 118],
          fontStyle: 'bold' as const,
          halign: 'right' as const,
          fontSize: 7.2,
          cellPadding: 1.8
        }
      },
      {
        content: `INR ${orderTotalInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        styles: {
          fillColor: [238, 244, 252],
          textColor: [20, 20, 20],
          fontStyle: 'bold' as const,
          halign: 'right' as const,
          fontSize: 7.2,
          cellPadding: 1.8
        }
      },
      {
        content: '',
        styles: { fillColor: [238, 244, 252] }
      },
      {
        content: `AED ${orderTotalAed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        styles: {
          fillColor: [238, 244, 252],
          textColor: [16, 115, 65],
          fontStyle: 'bold' as const,
          halign: 'right' as const,
          fontSize: 7.2,
          cellPadding: 1.8
        }
      },
      {
        content: '',
        colSpan: 2,
        styles: { fillColor: [238, 244, 252] }
      }
    ]);

    // ── Blank Spacer Row between different orders ──
    if (oIdx < orders.length - 1) {
      body.push([
        {
          content: '',
          colSpan: 10,
          styles: {
            fillColor: [255, 255, 255],
            cellPadding: { top: 1.2, bottom: 1.2 },
            lineColor: [255, 255, 255]
          }
        }
      ]);
    }
  });

  // 5. Grand Total Footer
  const foot: any[] = [[
    {
      content: `GRAND AUDIT TOTAL (${orders.length} Orders  •  ${totalReceiversCount} Beneficiaries)`,
      colSpan: 5,
      styles: {
        fontStyle: 'bold' as const,
        halign: 'right' as const,
        fillColor: [30, 70, 118],
        textColor: [255, 255, 255],
        fontSize: 7.6,
        cellPadding: 2.2
      }
    },
    {
      content: `INR ${grandTotalInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      styles: {
        fontStyle: 'bold' as const,
        halign: 'right' as const,
        fillColor: [30, 70, 118],
        textColor: [255, 255, 255],
        fontSize: 7.6,
        cellPadding: 2.2
      }
    },
    {
      content: '',
      styles: { fillColor: [30, 70, 118] }
    },
    {
      content: `AED ${grandTotalAed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      styles: {
        fontStyle: 'bold' as const,
        halign: 'right' as const,
        fillColor: [30, 70, 118],
        textColor: [255, 255, 255],
        fontSize: 7.6,
        cellPadding: 2.2
      }
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
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 42, halign: 'left' },
      2: { cellWidth: 30, halign: 'left' },
      3: { cellWidth: 44, halign: 'left' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 36, halign: 'right' },
      6: { cellWidth: 15, halign: 'right' },
      7: { cellWidth: 32, halign: 'right' },
      8: { cellWidth: 16, halign: 'center' },
      9: { cellWidth: 24, halign: 'center' }
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

  doc.save(`Finacle_Orders_Register_${today}.pdf`);
};
