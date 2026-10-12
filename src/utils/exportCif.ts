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

  doc.setFontSize(15);
  doc.setTextColor(30, 70, 118);
  doc.setFont('helvetica', 'bold');
  doc.text('INFAZYS FINACLE CORE BANKING PLATFORM', 14, 13);

  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 14, 19);

  doc.setFillColor(243, 246, 251);
  doc.setDrawColor(196, 212, 236);
  doc.rect(14, 22, 269, 10, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(50, 60, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`Filter / Search: ${meta?.searchQuery ? `"${meta.searchQuery}"` : 'All Listed CIFs'}   |   Total CIFs: ${cifs.length}`, 17, 27);
  doc.text(`Generated On: ${new Date().toLocaleString()}`, 17, 30.5);

  const head = [[
    'CIF ID',
    'Customer Name',
    'Email Address',
    'Contact Number',
    'Issued By',
    'Verified By',
    'Status'
  ]];

  const body = cifs.map((c) => {
    const fullName = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'N/A';
    const phone = c.phone || c.contact_number || '-';
    const issued = c.issuedBy || c.created_by_name || 'Staff';
    const verified = c.verifiedBy || c.verified_by_name || '-';

    return [
      c.cif_no || c.id || '',
      fullName,
      c.email || '-',
      phone,
      issued,
      verified,
      (c.status || 'PENDING').toUpperCase()
    ];
  });

  autoTable(doc, {
    head,
    body,
    startY: 34,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [196, 212, 236],
      lineWidth: 0.15
    },
    headStyles: {
      fillColor: [30, 70, 118],
      textColor: 255,
      fontStyle: 'bold'
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

  const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  doc.save(`Finacle_${filename}_${today}.pdf`);
};
