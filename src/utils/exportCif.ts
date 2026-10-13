import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface CifFilterMeta {
  searchQuery?: string;
  title?: string;
}

export const exportCifsToExcel = (cifs: any[], meta?: CifFilterMeta) => {
  if (!cifs || cifs.length === 0) {
    alert('No CIF records available to export.');
    return;
  }

  const title = meta?.title || 'VERIFIED RETAIL CIF REGISTER';

  const rows: any[][] = [
    ['INFAZYS FINACLE - RETAIL CIF MODULE'],
    [title.toUpperCase()],
    [`Search Query: "${meta?.searchQuery || 'None'}"  |  Total Matching CIFs: ${cifs.length}`],
    [`Generated On: ${new Date().toLocaleString()}`],
    [],
    [
      'CIF ID',
      'Full Name',
      'Email',
      'Contact Number',
      'Issued By',
      'Verified By',
      'Status',
      'Created Date'
    ]
  ];

  cifs.forEach((c) => {
    const fullName = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'N/A';
    const phone = c.phone || c.contact_number || '-';
    const issued = c.issuedBy || c.created_by_name || 'Staff';
    const verified = c.verifiedBy || c.verified_by_name || '-';
    const date = (c.created_at || '').split('T')[0] || '-';

    rows.push([
      c.cif_no || c.id || '',
      fullName,
      c.email || '-',
      phone,
      issued,
      verified,
      (c.status || 'PENDING').toUpperCase(),
      date
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 16 }, // CIF ID
    { wch: 28 }, // Full Name
    { wch: 28 }, // Email
    { wch: 18 }, // Contact Number
    { wch: 16 }, // Issued By
    { wch: 16 }, // Verified By
    { wch: 14 }, // Status
    { wch: 14 }  // Created Date
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Retail CIFs');
  const today = new Date().toISOString().split('T')[0];
  const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  XLSX.writeFile(workbook, `Finacle_${filename}_${today}.xlsx`);
};

export const exportCifsToPdf = (cifs: any[], meta?: CifFilterMeta) => {
  if (!cifs || cifs.length === 0) {
    alert('No CIF records available to export.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  const today = new Date().toISOString().split('T')[0];
  const title = meta?.title || 'VERIFIED RETAIL CIF CUSTOMER DIRECTORY';

  // 1. Header & Platform Branding
  doc.setFontSize(14);
  doc.setTextColor(30, 70, 118);
  doc.setFont('helvetica', 'bold');
  doc.text('INFAZYS FINACLE CORE BANKING PLATFORM', 14, 12);

  doc.setFontSize(9.5);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.text(`RETAIL CIF MODULE • ${title.toUpperCase()}`, 14, 17.5);

  // 2. Filter & KPI Summary Cards (Side by Side)
  doc.setFillColor(245, 248, 253);
  doc.setDrawColor(196, 212, 236);
  doc.rect(14, 20.5, 165, 13, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(50, 60, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`Filter / Search: ${meta?.searchQuery ? `"${meta.searchQuery}"` : 'All Listed CIF Records'}`, 17, 25);
  doc.text(`Generated On: ${new Date().toLocaleString()}   •   Confidential Audit Export`, 17, 29.5);

  // Right: KPI Card
  doc.setFillColor(236, 243, 252);
  doc.setDrawColor(180, 204, 235);
  doc.rect(183, 20.5, 100, 13, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(30, 70, 118);
  doc.setFont('helvetica', 'bold');
  doc.text('DIRECTORY SUMMARY', 186, 24.5);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(`Total Customers Listed: ${cifs.length}`, 186, 28.5);
  doc.text(`Status Scope: Verified & Active Records`, 186, 31.5);

  const head = [[
    'CIF ID',
    'Customer Name',
    'Email Address',
    'Contact Number',
    'Issued By',
    'Verified By',
    'Status'
  ]];

  const body: any[] = cifs.map((c) => {
    const fullName = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'N/A';
    const phone = c.phone || c.contact_number || '-';
    const issued = c.issuedBy || c.created_by_name || 'Staff';
    const verified = c.verifiedBy || c.verified_by_name || '-';
    const statusUpper = (c.status || 'PENDING').toUpperCase();

    let statusTextColor: [number, number, number] = [70, 70, 70];
    if (statusUpper === 'VERIFIED') {
      statusTextColor = [16, 128, 64];
    } else if (statusUpper === 'PENDING') {
      statusTextColor = [180, 105, 15];
    } else if (statusUpper === 'REJECTED') {
      statusTextColor = [180, 30, 30];
    }

    return [
      { content: c.cif_no || c.id || '-', styles: { fontStyle: 'bold' as const, textColor: [30, 70, 118] } },
      { content: fullName.toUpperCase(), styles: { fontStyle: 'bold' as const, textColor: [30, 30, 30] } },
      { content: c.email || '-', styles: { textColor: [50, 50, 50] } },
      { content: phone, styles: { textColor: [50, 50, 50] } },
      { content: issued, styles: { halign: 'center' as const, textColor: [70, 70, 70] } },
      { content: verified, styles: { halign: 'center' as const, textColor: [70, 70, 70] } },
      { content: statusUpper, styles: { halign: 'center' as const, fontStyle: 'bold' as const, textColor: statusTextColor } }
    ];
  });

  autoTable(doc, {
    head,
    body,
    startY: 36,
    theme: 'grid',
    styles: {
      fontSize: 7.4,
      cellPadding: 2,
      lineColor: [200, 215, 235],
      lineWidth: 0.15,
      textColor: [30, 30, 30]
    },
    headStyles: {
      fillColor: [30, 70, 118],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.8,
      halign: 'center',
      cellPadding: 2.2
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 50 },
      2: { cellWidth: 52 },
      3: { cellWidth: 35 },
      4: { cellWidth: 34, halign: 'center' },
      5: { cellWidth: 34, halign: 'center' },
      6: { cellWidth: 38, halign: 'center' }
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

  const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  doc.save(`Finacle_${filename}_${today}.pdf`);
};
