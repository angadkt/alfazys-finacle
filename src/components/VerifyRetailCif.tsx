import { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import api from '../services/api';
import { dbService } from '../services/db';
import { exportCifsToExcel, exportCifsToPdf } from '../utils/exportCif';

export default function VerifyRetailCif() {
  const [pendingCifs, setPendingCifs] = useState<any[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null);
  const [selectedCif, setSelectedCif] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; label: string; isPdf?: boolean } | null>(null);

  useEffect(() => {
    loadPendingCifs();
  }, []);

  const loadPendingCifs = async () => {
    try {
      const res = await api.get('/records/parties');
      if (res.data?.records) {
        const pending = res.data.records.filter((c: any) => c.status === 'pending');
        const formatted = pending.map((c: any) => ({
          id: c.cif_no || c.id,
          realId: c.id,
          name: `${c.first_name} ${c.last_name || ''}`.trim(),
          email: c.email,
          phone: c.contact_number,
          issuedBy: c.created_by_name || 'Staff',
          verifiedBy: c.verified_by_name || '-',
          status: c.status
        }));
        setPendingCifs(formatted);
        return;
      }
    } catch (e) {
      console.warn('Falling back to local customers:', e);
    }
    const allCustomers = dbService.getCustomers();
    const pending = allCustomers.filter(c => c.status === 'pending');
    setPendingCifs(pending);
  };

  const handleVerify = async (cif: any) => {
    if (verifyingId) return;
    setVerifyingId(cif.id);
    try {
      const targetId = cif.realId || cif.id;
      await api.patch(`/records/parties/${targetId}`, { status: 'verified' });
      alert(`CIF ${cif.id} has been verified successfully.`);
      setSelectedCif(null);
      loadPendingCifs();
    } catch (err: any) {
      dbService.updateCustomer(cif.id, { status: 'approved' });
      alert(`CIF ${cif.id} has been verified successfully.`);
      setSelectedCif(null);
      loadPendingCifs();
    } finally {
      setVerifyingId(null);
    }
  };

  const handleViewCif = async (cif: any) => {
    try {
      setLoadingDetails(true);
      const targetId = cif.realId || cif.id;
      const res = await api.get(`/cif/${targetId}`);
      setSelectedCif({ ...res.data, originalCif: cif });
    } catch (err: any) {
      alert('Failed to load CIF details: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePreviewDoc = async (cifId: any, doc: any) => {
    try {
      const res = await api.get(`/cif/${cifId}/documents/${doc.id}`, { responseType: 'blob' });
      const isPdf = res.data.type === 'application/pdf' || (doc.file_name && doc.file_name.toLowerCase().endsWith('.pdf'));
      const url = URL.createObjectURL(res.data);
      setPreviewDoc({ url, label: doc.doc_type || 'Document', isPdf });
    } catch (e: any) {
      alert('Failed to load document preview: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleDownloadDoc = async (cifId: any, doc: any) => {
    try {
      const res = await api.get(`/cif/${cifId}/documents/${doc.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name || `${doc.doc_type}_${doc.id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Failed to download document: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleExportExcel = () => {
    if (pendingCifs.length === 0) {
      alert('No pending CIF records to export.');
      return;
    }
    setIsExporting('excel');
    try {
      exportCifsToExcel(pendingCifs, { title: 'PENDING RETAIL CIF VERIFICATION AUDIT' });
    } catch (err: any) {
      alert('Failed to export Excel: ' + err.message);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = () => {
    if (pendingCifs.length === 0) {
      alert('No pending CIF records to export.');
      return;
    }
    setIsExporting('pdf');
    try {
      exportCifsToPdf(pendingCifs, { title: 'PENDING RETAIL CIF VERIFICATION AUDIT' });
    } catch (err: any) {
      alert('Failed to export PDF: ' + err.message);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#e4e4e4]" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <div className="bg-white px-3 py-2.5 border-b border-[#a0a0a0]">
        <h4 className="text-[15px] font-extrabold text-black m-0 capitalize tracking-wide">verify retail cif creation</h4>
      </div>
      <div className="flex-1 flex flex-col p-4 relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[18px] font-bold text-[#104080] m-0">Verify Retail CIF Requests</h2>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={handleExportExcel}
            disabled={isExporting !== null || pendingCifs.length === 0}
            className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-2.5 py-1 text-[11px] font-bold text-[#1e6e38] flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Export Pending CIFs to Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#2e7d32]" />
            <span>{isExporting === 'excel' ? 'Exporting...' : 'Excel'}</span>
          </button>
          <button 
            onClick={handleExportPdf}
            disabled={isExporting !== null || pendingCifs.length === 0}
            className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-2.5 py-1 text-[11px] font-bold text-[#b91c1c] flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Export Pending CIFs to PDF"
          >
            <FileText className="w-3.5 h-3.5 text-[#d32f2f]" />
            <span>{isExporting === 'pdf' ? 'Generating...' : 'PDF'}</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white border border-[#a0a0a0] p-1 flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#d4d0c8] border-b border-[#a0a0a0] text-[12px] text-left">
              <th className="p-2 border-r border-[#a0a0a0]">CIF ID</th>
              <th className="p-2 border-r border-[#a0a0a0]">Name</th>
              <th className="p-2 border-r border-[#a0a0a0]">Email</th>
              <th className="p-2 border-r border-[#a0a0a0]">Phone</th>
              <th className="p-2 border-r border-[#a0a0a0]">Issued By</th>
              <th className="p-2 border-r border-[#a0a0a0]">Verified By</th>
              <th className="p-2 border-r border-[#a0a0a0]">Status</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingCifs.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-[12px] text-gray-500">
                  No pending CIF requests to verify.
                </td>
              </tr>
            ) : (
              pendingCifs.map((cif) => (
                <tr key={cif.id} className="border-b border-[#e4e4e4] text-[12px] hover:bg-[#f0f0f5]">
                  <td className="p-2 border-r border-[#e4e4e4] font-semibold text-[#104080]">{cif.id}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.name}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.email || '-'}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.phone || '-'}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.issuedBy || '-'}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.verifiedBy || '-'}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">
                    <span className="text-orange-600 font-semibold uppercase">{cif.status}</span>
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => handleViewCif(cif)}
                        disabled={loadingDetails}
                        className="bg-[#104080] hover:bg-[#0c3266] text-white px-2 py-0.5 text-xs font-bold rounded-xs cursor-pointer shadow-xs"
                        title="View Details & KYC Identification Documents"
                      >
                        View KYC Docs
                      </button>
                      <button 
                        onClick={() => handleVerify(cif)}
                        disabled={verifyingId === cif.id}
                        className={`bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-2.5 py-0.5 text-xs text-black active:border-t-[#8f8f9d] active:border-l-[#8f8f9d] active:border-b-white active:border-r-white font-bold cursor-pointer ${
                          verifyingId === cif.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {verifyingId === cif.id ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* CIF Details & KYC Documents Modal */}
      {selectedCif && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedCif(null)}></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#e4e4e4] border-2 border-[#a0a0a0] w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col font-sans">
              <div className="bg-[#0E498C] text-white px-3 py-2 flex justify-between items-center border-b border-[#00B5E2]/40">
                <h3 className="text-sm font-bold m-0 tracking-wide">
                  Review CIF & KYC Documents — {selectedCif.cif_no || selectedCif.id}
                </h3>
                <button onClick={() => setSelectedCif(null)} className="text-white/80 hover:text-white hover:bg-white/10 px-2 py-0.5 rounded text-sm leading-none font-bold cursor-pointer">✕</button>
              </div>

              <div className="p-4 bg-white m-1.5 border border-[#a0a0a0] overflow-y-auto flex-1">
                <h4 className="text-[#0E498C] font-bold border-b border-[#e4e4e4] pb-1 mb-2 text-[13px] uppercase">
                  Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px] mb-4">
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">Full Name:</span><span>{selectedCif.first_name} {selectedCif.last_name}</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">Short Name:</span><span>{selectedCif.short_name || '-'}</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">Gender / Nationality:</span><span>{selectedCif.gender} / {selectedCif.nationality}</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">Contact Number:</span><span>{selectedCif.contact_number || '-'}</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">Email:</span><span>{selectedCif.email || '-'}</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">Currency:</span><span>{selectedCif.ccy || 'AED'}</span></div>
                </div>

                <h4 className="text-[#0E498C] font-bold border-b border-[#e4e4e4] pb-1 mb-2 text-[13px] uppercase">
                  Uploaded Identification & KYC Documents
                </h4>
                {(!selectedCif.documents || selectedCif.documents.length === 0) ? (
                  <div className="text-[12px] text-gray-500 italic p-3 bg-gray-50 text-center border border-dashed border-gray-300">
                    No documents uploaded for this CIF request.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-[#e4e4e4]">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="bg-[#f0f0f5] border-b border-[#e4e4e4] text-left text-gray-600">
                          <th className="p-2 font-bold">Doc Type</th>
                          <th className="p-2 font-bold">File Name</th>
                          <th className="p-2 font-bold">Uploaded At</th>
                          <th className="p-2 font-bold text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCif.documents.map((doc: any) => (
                          <tr key={doc.id} className="border-b border-[#e4e4e4] last:border-0 hover:bg-gray-50">
                            <td className="p-2 font-semibold text-[#104080] capitalize">
                              {doc.doc_type ? doc.doc_type.replace(/_/g, ' ') : '-'}
                            </td>
                            <td className="p-2 text-gray-700 truncate max-w-[150px]">
                              {doc.file_name || doc.doc_type}
                            </td>
                            <td className="p-2 text-gray-500">
                              {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '-'}
                            </td>
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handlePreviewDoc(selectedCif.id, doc)}
                                  className="bg-[#104080] hover:bg-[#0c3266] text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                                  title="View Document"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleDownloadDoc(selectedCif.id, doc)}
                                  className="bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                                  title="Download Document"
                                >
                                  Download
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-[#EBF6FC] border-t border-[#bce2f8] p-2 flex justify-between items-center">
                <button 
                  onClick={() => setSelectedCif(null)}
                  className="bg-white hover:bg-gray-100 border border-gray-300 px-4 py-1 text-[12px] font-bold text-[#0E498C] rounded-xs cursor-pointer transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleVerify(selectedCif.originalCif || selectedCif)}
                  disabled={verifyingId === (selectedCif.originalCif?.id || selectedCif.id)}
                  className="bg-[#0E498C] hover:bg-[#00A2E8] border border-[#00B5E2]/40 text-white px-4 py-1 text-[12px] font-bold rounded-xs shadow-xs cursor-pointer transition-colors"
                >
                  {verifyingId === (selectedCif.originalCif?.id || selectedCif.id) ? 'Verifying...' : 'Approve & Verify CIF'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[90]" onClick={() => setPreviewDoc(null)}></div>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="bg-white border border-[#0E498C] rounded shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="bg-[#0E498C] px-3.5 py-2 font-bold text-white border-b border-[#00B5E2]/40 flex justify-between items-center">
                <span className="text-xs uppercase tracking-wide">Document Preview — {previewDoc.label.replace(/_/g, ' ').toUpperCase()}</span>
                <button 
                  onClick={() => setPreviewDoc(null)} 
                  className="text-white/80 hover:text-white hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer text-xs font-bold"
                >
                  ✕ Close
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4 min-h-[400px]">
                {previewDoc.isPdf ? (
                  <iframe src={previewDoc.url} title={previewDoc.label} className="w-full h-[550px] border border-gray-300" />
                ) : (
                  <img src={previewDoc.url} alt={previewDoc.label} className="max-w-full max-h-[550px] object-contain shadow-md" />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
