import { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import api from '../services/api';
import { exportCifsToExcel, exportCifsToPdf } from '../utils/exportCif';

export default function ViewRetailCif() {
  const [verifiedCifs, setVerifiedCifs] = useState<any[]>([]);
  const [selectedCif, setSelectedCif] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; label: string; isPdf?: boolean } | null>(null);

  const activeRole = localStorage.getItem('infazys_finacle_active_role');
  const isAdmin = activeRole === 'super_admin' || activeRole === 'admin';
  const [deleteCifTarget, setDeleteCifTarget] = useState<any | null>(null);
  const [isDeletingCif, setIsDeletingCif] = useState(false);

  const handleConfirmDeleteCif = async () => {
    if (!deleteCifTarget) return;
    setIsDeletingCif(true);
    try {
      await api.delete(`/records/parties/${deleteCifTarget.id}`);
      await loadVerifiedCifs();
      if (selectedCif?.id === deleteCifTarget.id) {
        setSelectedCif(null);
      }
      setDeleteCifTarget(null);
    } catch (err: any) {
      alert('Failed to delete CIF: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsDeletingCif(false);
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

  useEffect(() => {
    loadVerifiedCifs();
  }, []);

  const loadVerifiedCifs = async () => {
    try {
      const res = await api.get('/records/parties');
      const verified = res.data.records.filter((c: any) => c.status === 'verified');
      setVerifiedCifs(verified);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCifClick = async (id: string) => {
    try {
      setLoadingDetails(true);
      const res = await api.get(`/cif/${id}`);
      setSelectedCif(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch CIF details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredCifs = verifiedCifs.filter((cif) => {
    const term = searchTerm.toLowerCase();
    const cifId = cif.cif_no || cif.id?.toString() || '';
    const name = `${cif.first_name} ${cif.last_name}`;
    const email = cif.email || '';
    const phone = cif.contact_number || '';
    
    return cifId.toLowerCase().includes(term) ||
           name.toLowerCase().includes(term) ||
           email.toLowerCase().includes(term) ||
           phone.toLowerCase().includes(term);
  });

  const handleExportExcel = () => {
    if (filteredCifs.length === 0) {
      alert('No CIF records available to export.');
      return;
    }
    setIsExporting('excel');
    try {
      exportCifsToExcel(filteredCifs, { searchQuery: searchTerm });
    } catch (err: any) {
      alert('Failed to export Excel: ' + err.message);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = () => {
    if (filteredCifs.length === 0) {
      alert('No CIF records available to export.');
      return;
    }
    setIsExporting('pdf');
    try {
      exportCifsToPdf(filteredCifs, { searchQuery: searchTerm });
    } catch (err: any) {
      alert('Failed to export PDF: ' + err.message);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#e4e4e4]" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <div className="bg-white px-3 py-2.5 border-b border-[#a0a0a0]">
        <h4 className="text-[15px] font-extrabold text-[#1e4676] m-0 capitalize tracking-wide">view retail cif</h4>
      </div>
      <div className="flex-1 flex flex-col p-4 relative overflow-hidden">
      
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-[18px] font-bold text-[#1e4676] m-0">View Verified Retail CIFs</h2>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-[12px] font-semibold text-[#1e4676]">Search:</label>
            <input 
              type="text" 
              placeholder="Search by ID, Name, Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-[#a0a0a0] px-2 py-1 text-[12px] w-64 focus:outline-none focus:border-[#1e4676]"
            />
          </div>

          <div className="flex items-center gap-1.5 border-l border-[#c4d4ec] pl-2">
            <button 
              onClick={handleExportExcel}
              disabled={isExporting !== null || filteredCifs.length === 0}
              className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-2 py-1 text-[11px] font-bold text-[#1e6e38] flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Export Verified CIFs to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#2e7d32]" />
              <span>{isExporting === 'excel' ? 'Exporting...' : 'Excel'}</span>
            </button>
            <button 
              onClick={handleExportPdf}
              disabled={isExporting !== null || filteredCifs.length === 0}
              className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-2 py-1 text-[11px] font-bold text-[#b91c1c] flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Export Verified CIFs to PDF"
            >
              <FileText className="w-3.5 h-3.5 text-[#d32f2f]" />
              <span>{isExporting === 'pdf' ? 'Generating...' : 'PDF'}</span>
            </button>
          </div>
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
              {isAdmin && (
                <th className="p-2 border-r border-[#a0a0a0] text-center">Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredCifs.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="p-4 text-center text-[12px] text-gray-500">
                  {verifiedCifs.length === 0 ? 'No verified CIFs found.' : 'No CIFs match your search.'}
                </td>
              </tr>
            ) : (
              filteredCifs.map((cif) => (
                <tr key={cif.id} className="border-b border-[#e4e4e4] text-[12px] hover:bg-[#f0f0f5]">
                  <td 
                    className="p-2 border-r border-[#e4e4e4] font-semibold text-[#1e4676] cursor-pointer hover:underline"
                    onClick={() => handleCifClick(cif.id)}
                  >
                    {loadingDetails ? '...' : (cif.cif_no || cif.id)}
                  </td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.first_name} {cif.last_name}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.email || '-'}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.contact_number || '-'}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.created_by_name || '-'}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.verified_by_name || '-'}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">
                    <span className="text-green-600 font-semibold uppercase">Verified</span>
                  </td>
                  {isAdmin && (
                    <td className="p-2 border-r border-[#e4e4e4] text-center">
                      <button
                        type="button"
                        onClick={() => setDeleteCifTarget(cif)}
                        className="bg-white border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-600 font-bold px-2.5 py-0.5 rounded text-[11px] cursor-pointer shadow-2xs"
                        title="Delete CIF Record"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* CIF Details Modal */}
      {selectedCif && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedCif(null)}></div>
          <div className="absolute inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-[#e4e4e4] border-2 border-[#a0a0a0] w-[650px] shadow-2xl flex flex-col font-sans max-h-[calc(100%-2rem)] mt-2">
            <div className="bg-[#1e4676] text-white px-3 py-2 flex justify-between items-center">
              <h3 className="text-sm font-bold m-0 tracking-wide">CIF Details - {selectedCif.cif_no || selectedCif.id}</h3>
              <button onClick={() => setSelectedCif(null)} className="text-white hover:text-gray-300 text-lg leading-none font-bold">&times;</button>
            </div>
            
            <div className="p-4 bg-white m-1.5 border border-[#a0a0a0] overflow-y-auto">
              <h4 className="text-[#1e4676] font-bold border-b border-[#e4e4e4] pb-1 mb-3 text-[13px] uppercase">Basic Information</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12px] mb-6">
                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">Title:</span><span>{selectedCif.title || '-'}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">First Name:</span><span>{selectedCif.first_name || '-'}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">Last Name:</span><span>{selectedCif.last_name || '-'}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">Short Name:</span><span>{selectedCif.short_name || '-'}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">Gender:</span><span>{selectedCif.gender || '-'}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">Nationality:</span><span>{selectedCif.nationality || '-'}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">Branch ID:</span><span>{selectedCif.branch_id || '-'}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">CIF Type ID:</span><span>{selectedCif.cif_type_id || '-'}</span></div>
              </div>

              <h4 className="text-[#1e4676] font-bold border-b border-[#e4e4e4] pb-1 mb-3 text-[13px] uppercase">Contact & Address</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12px] mb-6">
                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">Contact No:</span><span>{selectedCif.contact_number || '-'}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">Email:</span><span>{selectedCif.email || '-'}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">CCY:</span><span>{selectedCif.ccy || '-'}</span></div>
                
                {selectedCif._profile?.city && (
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">City:</span><span>{selectedCif._profile.city}</span></div>
                )}
                {selectedCif._profile?.country && (
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">Country:</span><span>{selectedCif._profile.country}</span></div>
                )}
                {selectedCif._profile?.uaeNo && (
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">UAE Phone:</span><span>{selectedCif._profile.uaeNo}</span></div>
                )}
                {selectedCif._profile?.indianNo && (
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="font-bold text-gray-600">Indian Phone:</span><span>{selectedCif._profile.indianNo}</span></div>
                )}
              </div>

              <h4 className="text-[#1e4676] font-bold border-b border-[#e4e4e4] pb-1 mb-3 text-[13px] uppercase">Uploaded Documents</h4>
              {(!selectedCif.documents || selectedCif.documents.length === 0) ? (
                <div className="text-[12px] text-gray-500 italic p-2 bg-gray-50 text-center border border-dashed border-gray-300">
                  No documents uploaded for this CIF.
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#e4e4e4]">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-[#f0f0f5] border-b border-[#e4e4e4] text-left text-gray-600">
                        <th className="p-2 font-bold">Doc Type</th>
                        <th className="p-2 font-bold">Document Name</th>
                        <th className="p-2 font-bold">Uploaded At</th>
                        <th className="p-2 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCif.documents.map((doc: any) => (
                        <tr key={doc.id} className="border-b border-[#e4e4e4] last:border-0 hover:bg-gray-50">
                          <td className="p-2 font-semibold text-[#1e4676] capitalize">
                            {doc.doc_type ? doc.doc_type.replace(/_/g, ' ') : '-'}
                          </td>
                          <td className="p-2 text-gray-700 truncate max-w-[160px]">
                            {doc.file_name || `${doc.doc_type || 'document'}`}
                          </td>
                          <td className="p-2 text-gray-500">
                            {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handlePreviewDoc(selectedCif.id, doc)}
                                className="bg-[#1e4676] hover:bg-[#163459] text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
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
            
            <div className="bg-[#d4d0c8] border-t border-[#a0a0a0] p-2 flex justify-end">
              <button 
                onClick={() => setSelectedCif(null)}
                className="bg-gray-100 border border-gray-400 px-6 py-1 text-[12px] hover:bg-gray-200 font-bold text-[#1e4676] cursor-pointer"
              >
                Close
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
          <div className="bg-white border-2 border-[#104080] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-[#eaf0f8] px-3 py-2 font-bold text-[#104080] border-b border-[#a2b5cd] flex justify-between items-center">
              <span>Document Preview - {previewDoc.label.replace(/_/g, ' ').toUpperCase()}</span>
              <button 
                onClick={() => setPreviewDoc(null)} 
                className="text-red-600 font-bold hover:underline cursor-pointer px-2"
              >
                Close (X)
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

      {/* Confirm Delete CIF Modal (Admin/Super Admin only) */}
      {deleteCifTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
            onClick={() => !isDeletingCif && setDeleteCifTarget(null)}
          ></div>
          <div className="bg-white border-2 border-[#1e4676] rounded-md shadow-2xl z-10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
            {/* Modal Title Bar */}
            <div className="bg-[#1e4676] text-white px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm tracking-wide">
                <span>⚠️</span>
                <span>Confirm CIF Deletion</span>
              </div>
              <button 
                type="button"
                onClick={() => !isDeletingCif && setDeleteCifTarget(null)}
                className="text-white hover:text-red-300 text-lg font-bold leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 text-xs text-gray-700 space-y-4">
              <p className="text-[13px] text-gray-800">
                Are you sure you want to permanently delete CIF <strong className="text-[#1e4676] font-bold">{deleteCifTarget.cif_no || deleteCifTarget.id}</strong>?
              </p>

              {/* Summary Card */}
              <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded p-3 space-y-2">
                <div className="flex justify-between border-b border-[#e2e8f0] pb-1.5">
                  <span className="text-gray-500 font-medium">CIF ID:</span>
                  <span className="font-bold text-[#1e4676]">{deleteCifTarget.cif_no || deleteCifTarget.id}</span>
                </div>
                <div className="flex justify-between border-b border-[#e2e8f0] pb-1.5">
                  <span className="text-gray-500 font-medium">Customer / Agent Name:</span>
                  <span className="font-bold text-gray-900">{deleteCifTarget.first_name} {deleteCifTarget.last_name}</span>
                </div>
                <div className="flex justify-between border-b border-[#e2e8f0] pb-1.5">
                  <span className="text-gray-500 font-medium">Phone:</span>
                  <span className="font-mono font-bold text-gray-900">{deleteCifTarget.contact_number || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Email:</span>
                  <span className="font-semibold text-gray-700">{deleteCifTarget.email || '-'}</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded text-[11px] leading-relaxed">
                <strong>Notice:</strong> This action permanently removes this customer/agent profile from the database.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#f1f5f9] border-t border-[#cbd5e1] px-4 py-3 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingCif}
                onClick={() => setDeleteCifTarget(null)}
                className="px-4 py-1.5 bg-white border border-[#cbd5e1] text-gray-700 hover:bg-gray-100 rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingCif}
                onClick={handleConfirmDeleteCif}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {isDeletingCif ? 'Deleting...' : 'Yes, Delete CIF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
