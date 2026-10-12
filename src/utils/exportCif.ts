import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface CifFilterMeta {
  searchQuery?: string;
}

export const exportCifsToExcel = (cifs: any[], meta?: CifFilterMeta) => {
  if (!cifs || cifs.length === 0) {
    alert('No CIF records available to export.');
    return;
  }

  const rows: any[][] = [
    ['INFAZYS FINACLE - RETAIL CIF MODULE'],
    ['VERIFIED RETAIL CIF REGISTER'],
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
    rows.push([
      c.cif_no || c.id || '',
      `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      c.email || '',
      c.contact_number || '',
      c.created_by_name || 'Staff',
      c.verified_by_name || 'Admin',
      (c.status || 'verified').toUpperCase(),
      (c.created_at || '').split('T')[0]
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Verified CIFs');
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Finacle_Verified_CIFs_${today}.xlsx`);
};

export const exportCifsToPdf = (cifs: any[], meta?: CifFilterMeta) => {
  if (!cifs || cifs.length === 0) {
    alert('No CIF records available to export.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  const today = new Date().toISOString().split('T')[0];

  doc.setFontSize(15);
  doc.setTextColor(30, 70, 118);
  doc.setFont('helvetica', 'bold');
  doc.text('INFAZYS FINACLE CORE BANKING PLATFORM', 14, 13);

  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.text('VERIFIED RETAIL CIF CUSTOMER DIRECTORY', 14, 19);

  doc.setFillColor(243, 246, 251);
  doc.setDrawColor(196, 212, 236);
  doc.rect(14, 22, 269, 10, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(50, 60, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`Search Criteria: ${meta?.searchQuery ? `"${meta.searchQuery}"` : 'All Verified CIFs'}   |   Total Verified CIFs: ${cifs.length}`, 17, 27);
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

  const body = cifs.map((c) => [
    c.cif_no || c.id || '',
    `${c.first_name || ''} ${c.last_name || ''}`.trim(),
    c.email || '-',
    c.contact_number || '-',
    c.created_by_name || 'Staff',
    c.verified_by_name || 'Admin',
    (c.status || 'VERIFIED').toUpperCase()
  ]);

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

  doc.save(`Finacle_Verified_CIFs_${today}.pdf`);
};
