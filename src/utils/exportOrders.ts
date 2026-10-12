import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportFilterMeta {
  filterDate?: string;
  filterAgent?: string;
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

export const exportOrdersToExcel = (orders: any[], _meta?: ExportFilterMeta) => {
  if (!orders || orders.length === 0) {
    alert('No orders available to export.');
    return;
  }

  const rows: any[] = [];

  orders.forEach((o) => {
    const recs = parseReceivers(o);
    const hasMultiple = recs.length > 0;

    if (hasMultiple) {
      recs.forEach((acc: any, idx: number) => {
        const aed = acc.orderAmount && acc.confirmOrderAmount
          ? (parseFloat(acc.orderAmount) / parseFloat(acc.confirmOrderAmount)).toFixed(2)
          : (idx === 0 && o.aed_amount ? parseFloat(o.aed_amount).toFixed(2) : '-');

        rows.push({
          'Order No': idx === 0 ? o.order_no : `${o.order_no} (#${idx + 1})`,
          'Date': (o.order_date || '').split('T')[0],
          'Agent / Customer': o.party_name || (o.party_id ? `CIF: ${o.party_id}` : 'N/A'),
          'Beneficiary Name': acc.clientName || o.receiver_name || '-',
          'Beneficiary Account': acc.accountNumber || o.receiver_account || '-',
          'Bank Name': acc.bankName || o.receiver_bank || 'N/A',
          'IFSC Code': acc.ifscCode || o.receiver_ifsc || '-',
          'Sale Rate': acc.confirmOrderAmount || o.sale_rate || '-',
          'AED Amount': aed,
          'INR Value': acc.orderAmount || (idx === 0 ? o.inr_value : '-'),
          'Txn Through': o.transaction_through || '-',
          'Issued By': o.created_by_name || 'Admin',
          'Verified By': o.verified_by_name || (o.status === 'verified' ? 'Admin' : '-'),
          'Verification Status': (o.status || 'pending').toUpperCase(),
          'Payment Status': o.payment_status || 'Pending'
        });
      });
    } else {
      rows.push({
        'Order No': o.order_no,
        'Date': (o.order_date || '').split('T')[0],
        'Agent / Customer': o.party_name || (o.party_id ? `CIF: ${o.party_id}` : 'N/A'),
        'Beneficiary Name': o.receiver_name || '-',
        'Beneficiary Account': o.receiver_account || '-',
        'Bank Name': o.receiver_bank || 'N/A',
        'IFSC Code': o.receiver_ifsc || '-',
        'Sale Rate': o.sale_rate || '-',
        'AED Amount': o.aed_amount ? parseFloat(o.aed_amount).toFixed(2) : '-',
        'INR Value': o.inr_value || '-',
        'Txn Through': o.transaction_through || '-',
        'Issued By': o.created_by_name || 'Admin',
        'Verified By': o.verified_by_name || (o.status === 'verified' ? 'Admin' : '-'),
        'Verification Status': (o.status || 'pending').toUpperCase(),
        'Payment Status': o.payment_status || 'Pending'
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 14 }, // Order No
    { wch: 12 }, // Date
    { wch: 24 }, // Agent / Customer
    { wch: 22 }, // Beneficiary Name
    { wch: 20 }, // Beneficiary Account
    { wch: 20 }, // Bank Name
    { wch: 14 }, // IFSC Code
    { wch: 12 }, // Sale Rate
    { wch: 14 }, // AED Amount
    { wch: 14 }, // INR Value
    { wch: 14 }, // Txn Through
    { wch: 14 }, // Issued By
    { wch: 14 }, // Verified By
    { wch: 18 }, // Verification Status
    { wch: 16 }  // Payment Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Finacle_Orders_${today}.xlsx`);
};

export const exportOrdersToPdf = (orders: any[], meta?: ExportFilterMeta) => {
  if (!orders || orders.length === 0) {
    alert('No orders available to export.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  const today = new Date().toISOString().split('T')[0];

  // Header Title
  doc.setFontSize(15);
  doc.setTextColor(30, 70, 118); // #1e4676
  doc.setFont('helvetica', 'bold');
  doc.text('FINCORE Universal Settlement Module', 14, 14);

  // Subtitle
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.setFont('helvetica', 'normal');
  let subText = `Fetched Orders Report  •  Generated: ${new Date().toLocaleString()}`;
  if (meta?.filterDate) subText += `  •  Date Filter: ${meta.filterDate}`;
  if (meta?.filterAgent) subText += `  •  Agent Filter: ${meta.filterAgent}`;
  if (meta?.searchQuery) subText += `  •  Search: "${meta.searchQuery}"`;
  doc.text(subText, 14, 20);

  const head = [[
    'Order No',
    'Date',
    'Agent / Customer',
    'Beneficiary Name',
    'Beneficiary Account',
    'Sale Rate',
    'AED Amount',
    'INR Value',
    'Txn Mode',
    'Status',
    'Payment'
  ]];

  const body = orders.map((o) => {
    const recs = parseReceivers(o);
    const hasMultiple = recs.length > 0;

    let benName = o.receiver_name || '-';
    let benAcc = `${o.receiver_account || '-'}${o.receiver_bank ? ` (${o.receiver_bank})` : ''}`;
    let saleRate = String(o.sale_rate || '-');
    let aedAmt = o.aed_amount ? parseFloat(o.aed_amount).toFixed(2) : '-';
    let inrVal = o.inr_value ? `₹ ${o.inr_value}` : '-';

    if (hasMultiple) {
      benName = recs.map((r: any) => r.clientName || '-').join('\n');
      benAcc = recs.map((r: any) => `${r.accountNumber || '-'}${r.bankName ? ` (${r.bankName})` : ''}`).join('\n');
      saleRate = recs.map((r: any) => r.confirmOrderAmount || o.sale_rate || '-').join('\n');
      if (recs.length > 1) {
        aedAmt = `Total: ${aedAmt}\n` + recs.map((r: any) => {
          return r.orderAmount && r.confirmOrderAmount
            ? (parseFloat(r.orderAmount) / parseFloat(r.confirmOrderAmount)).toFixed(2)
            : '-';
        }).join('\n');
        inrVal = `Total: ${inrVal}\n` + recs.map((r: any) => `₹ ${r.orderAmount || '-'}`).join('\n');
      }
    }

    return [
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
    ];
  });

  autoTable(doc, {
    head,
    body,
    startY: 24,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [196, 212, 236],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [30, 70, 118],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [245, 248, 252]
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(130, 130, 130);
      const pageHeight = doc.internal.pageSize.height;
      doc.text(
        `Confidential - Finacle Banking Platform  •  Page ${data.pageNumber} of ${pageCount}`,
        14,
        pageHeight - 6
      );
    }
  });

  doc.save(`Finacle_Orders_${today}.pdf`);
};
