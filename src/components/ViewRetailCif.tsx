import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  AlertTriangle, 
  X, 
  Eye, 
  Search, 
  CheckCircle2, 
  Download, 
  User, 
  Building2, 
  Trash2,
  ExternalLink
} from 'lucide-react';
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
      const verified = (res.data?.records || []).filter((c: any) => c.status === 'verified');
      setVerifiedCifs(verified);
    } catch (err) {
      console.error('Failed to load verified CIFs:', err);
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
    const name = `${cif.first_name || ''} ${cif.last_name || ''}`;
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
    <div className="flex-1 flex flex-col bg-[#f0f4f8] overflow-hidden select-none">
      
      {/* 1. Finacle Command Bar Header */}
      <div className="bg-[#104080] text-white px-5 py-2.5 flex items-center justify-between border-b border-[#0a2850] shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-amber-300" />
          <span className="font-bold tracking-wider text-sm uppercase font-sans">
            RETAIL CIF INQUIRY DESK (VCIF)
          </span>
          <span className="bg-blue-950/80 text-blue-200 border border-blue-600 px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-wide">
            INQUIRY: VCIF
          </span>
          <span className="bg-emerald-950/80 text-emerald-200 border border-emerald-600 px-2.5 py-0.5 rounded text-xs font-mono font-bold">
            {filteredCifs.length} {filteredCifs.length === 1 ? 'RECORD' : 'RECORDS'} VERIFIED
          </span>
        </div>
        <div className="text-xs text-blue-100 font-medium">
          Infosys Finacle Core Banking
        </div>
      </div>

      {/* 2. Sub-Ribbon & Toolbar */}
      <div className="bg-[#e6edf8] border-b border-[#c4d4ec] px-5 py-2.5 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2 text-[#104080] font-bold text-sm">
          <Building2 className="w-4 h-4" />
          <span>Verified Retail Customer Information File Directory (CRM-CIF)</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by CIF ID, Name, Phone, Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 border border-[#c4d4ec] pl-9 pr-8 py-2 text-sm rounded-md w-72 sm:w-84 focus:outline-none focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 bg-white shadow-2xs placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2 border-l border-[#c4d4ec] pl-3">
            <button 
              onClick={handleExportExcel}
              disabled={isExporting !== null || filteredCifs.length === 0}
              className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-2 rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
              title="Export Verified CIFs to Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{isExporting === 'excel' ? 'Exporting...' : 'Export Excel'}</span>
            </button>
            <button 
              onClick={handleExportPdf}
              disabled={isExporting !== null || filteredCifs.length === 0}
              className="bg-white hover:bg-red-50 text-red-800 border border-red-300 px-3.5 py-2 rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
              title="Export Verified CIFs to PDF"
            >
              <FileText className="w-4 h-4 text-red-600" />
              <span>{isExporting === 'pdf' ? 'Generating...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* 3. Main Data Grid Container */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white border border-[#c4d4ec] rounded-md shadow-xs overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#104080] text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4 border-r border-[#0a2850]">CIF ID</th>
                <th className="py-3 px-4 border-r border-[#0a2850]">Customer / Agent Name</th>
                <th className="py-3 px-4 border-r border-[#0a2850]">Email Address</th>
                <th className="py-3 px-4 border-r border-[#0a2850]">Phone Number</th>
                <th className="py-3 px-4 border-r border-[#0a2850]">Issued By</th>
                <th className="py-3 px-4 border-r border-[#0a2850]">Verified By</th>
                <th className="py-3 px-4 border-r border-[#0a2850]">Status</th>
                {isAdmin && (
                  <th className="py-3 px-4 text-center">Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredCifs.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-slate-500">
                    <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-sm text-slate-700">
                      {verifiedCifs.length === 0 ? 'No verified CIF records found.' : 'No customer records match your search criteria.'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {searchTerm ? 'Try adjusting your search terms or clearing the filter.' : 'Customers verified via the Maker-Checker workflow will appear here.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCifs.map((cif, idx) => (
                  <tr 
                    key={cif.id} 
                    className={`border-b border-[#e2e8f0] text-sm hover:bg-blue-50/70 transition-colors ${
                      idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                    }`}
                  >
                    <td className="py-3 px-4 border-r border-[#e2e8f0]">
                      <button 
                        type="button"
                        onClick={() => handleCifClick(cif.id)}
                        className="font-mono font-bold text-[#104080] hover:underline cursor-pointer flex items-center gap-1.5"
                        title="Click to view full CIF details"
                      >
                        <span>{loadingDetails ? '...' : (cif.cif_no || cif.id)}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#104080]/60" />
                      </button>
                    </td>
                    <td className="py-3 px-4 border-r border-[#e2e8f0] font-bold text-slate-900">
                      {cif.first_name} {cif.last_name}
                    </td>
                    <td className="py-3 px-4 border-r border-[#e2e8f0] text-slate-600">
                      {cif.email || '-'}
                    </td>
                    <td className="py-3 px-4 border-r border-[#e2e8f0] font-mono text-slate-700 font-medium">
                      {cif.contact_number || '-'}
                    </td>
                    <td className="py-3 px-4 border-r border-[#e2e8f0] text-slate-700 font-medium">
                      {cif.created_by_name || '-'}
                    </td>
                    <td className="py-3 px-4 border-r border-[#e2e8f0] text-slate-700 font-medium">
                      {cif.verified_by_name || '-'}
                    </td>
                    <td className="py-3 px-4 border-r border-[#e2e8f0]">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setDeleteCifTarget(cif)}
                          className="bg-white border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-600 font-bold px-3 py-1 rounded text-xs cursor-pointer shadow-2xs transition-colors inline-flex items-center gap-1"
                          title="Delete CIF Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
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

      {/* 4. CIF Details Modal (Spacious, High-Contrast max-w-4xl) */}
      {selectedCif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs overflow-y-auto">
          <div className="bg-white border-2 border-[#104080] rounded-lg shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#104080] text-white px-5 py-3 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-bold m-0 tracking-wide">
                  CIF Master Profile — {selectedCif.cif_no || selectedCif.id}
                </h3>
                <span className="bg-emerald-950/80 text-emerald-200 border border-emerald-600 px-2 py-0.5 rounded text-xs font-mono font-bold">
                  VERIFIED RECORD
                </span>
              </div>
              <button 
                onClick={() => setSelectedCif(null)} 
                className="text-white hover:text-red-300 font-bold p-1 cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              {/* Profile Summary Banner */}
              <div className="bg-[#e6edf8] border border-[#c4d4ec] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#104080] text-white flex items-center justify-center text-base font-bold shadow-xs">
                    {(selectedCif.first_name || 'C')[0]}
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-900">
                      {selectedCif.title ? `${selectedCif.title} ` : ''}{selectedCif.first_name} {selectedCif.last_name}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Alias: <b className="text-[#104080]">{selectedCif.short_name || '-'}</b> • Nationality: <b className="text-slate-800">{selectedCif.nationality || '-'}</b>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-white px-2.5 py-1 rounded border border-[#c4d4ec] font-mono font-bold text-[#104080]">
                    CIF: {selectedCif.cif_no || selectedCif.id}
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded border border-[#c4d4ec] font-bold text-slate-700">
                    CCY: {selectedCif.ccy || 'INR'}
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded border border-[#c4d4ec] font-bold text-slate-700">
                    Branch: {selectedCif.branch_id === 1 ? 'UAE (1)' : 'INDIA (2)'}
                  </span>
                </div>
              </div>

              {/* 2-Column Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Basic Demographics Card */}
                <div className="bg-[#f8fafc] border border-[#c4d4ec] rounded-md p-4 shadow-2xs">
                  <div className="font-bold text-[#104080] text-xs uppercase tracking-wide border-b border-[#c4d4ec] pb-2 mb-3">
                    Basic Demographic Data
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500 font-medium">Gender:</span>
                      <span className="font-semibold text-slate-900">{selectedCif.gender || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500 font-medium">Nationality:</span>
                      <span className="font-semibold text-slate-900">{selectedCif.nationality || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500 font-medium">CIF Type:</span>
                      <span className="font-semibold text-[#104080]">{selectedCif.cif_type_name || selectedCif.cif_type_id || 'Customer'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500 font-medium">Registered Currency:</span>
                      <span className="font-mono font-bold text-slate-900">{selectedCif.ccy || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Contact & Address Card */}
                <div className="bg-[#f8fafc] border border-[#c4d4ec] rounded-md p-4 shadow-2xs">
                  <div className="font-bold text-[#104080] text-xs uppercase tracking-wide border-b border-[#c4d4ec] pb-2 mb-3">
                    Contact & Address Profile
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500 font-medium">Primary Contact:</span>
                      <span className="font-mono font-bold text-slate-900">{selectedCif.contact_number || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500 font-medium">Email Address:</span>
                      <span className="font-semibold text-slate-900">{selectedCif.email || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500 font-medium">City:</span>
                      <span className="font-semibold text-slate-900">{selectedCif._profile?.city || selectedCif.city || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500 font-medium">Country:</span>
                      <span className="font-semibold text-slate-900">{selectedCif._profile?.country || selectedCif.country || '-'}</span>
                    </div>
                    {selectedCif._profile?.indianNo && (
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500 font-medium">Indian Phone:</span>
                        <span className="font-mono font-semibold text-slate-900">{selectedCif._profile.indianNo}</span>
                      </div>
                    )}
                    {selectedCif._profile?.uaeNo && (
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500 font-medium">UAE Phone:</span>
                        <span className="font-mono font-semibold text-slate-900">{selectedCif._profile.uaeNo}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Uploaded KYC Documents Section */}
              <div className="bg-[#f8fafc] border border-[#c4d4ec] rounded-md p-4 shadow-2xs">
                <div className="font-bold text-[#104080] text-xs uppercase tracking-wide border-b border-[#c4d4ec] pb-2 mb-3 flex items-center justify-between">
                  <span>Uploaded KYC Identification Records</span>
                  <span className="text-xs text-slate-600 font-normal">
                    {selectedCif.documents?.length || 0} Documents on File
                  </span>
                </div>

                {(!selectedCif.documents || selectedCif.documents.length === 0) ? (
                  <div className="text-sm text-slate-500 italic p-6 bg-white text-center border border-dashed border-[#c4d4ec] rounded-md">
                    No KYC identification documents uploaded for this CIF record.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-[#c4d4ec] rounded-md bg-white">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#e6edf8] text-[#104080] border-b border-[#c4d4ec] text-left text-xs font-bold uppercase">
                          <th className="py-2.5 px-3 font-bold">Doc Type</th>
                          <th className="py-2.5 px-3 font-bold">File Name</th>
                          <th className="py-2.5 px-3 font-bold">Uploaded At</th>
                          <th className="py-2.5 px-3 font-bold text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCif.documents.map((doc: any) => (
                          <tr key={doc.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-[#104080] capitalize">
                              {doc.doc_type ? doc.doc_type.replace(/_/g, ' ') : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 truncate max-w-[200px]">
                              {doc.file_name || `${doc.doc_type || 'document'}`}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-xs">
                              {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handlePreviewDoc(selectedCif.id, doc)}
                                  className="bg-[#104080] hover:bg-[#0a2850] text-white px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                                  title="View Document"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadDoc(selectedCif.id, doc)}
                                  className="bg-white border border-[#c4d4ec] hover:bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                                  title="Download Document"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
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
            </div>
            
            {/* Modal Footer */}
            <div className="bg-[#e6edf8] border-t border-[#c4d4ec] px-5 py-3 flex justify-end shrink-0">
              <button 
                type="button"
                onClick={() => setSelectedCif(null)}
                className="bg-[#104080] hover:bg-[#0a2850] text-white px-6 py-2 rounded-md text-sm font-bold cursor-pointer shadow-xs transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xs">
          <div className="bg-white border-2 border-[#104080] rounded-lg shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="bg-[#104080] text-white px-5 py-3 font-bold text-sm flex justify-between items-center">
              <span>KYC Document Preview — {previewDoc.label.replace(/_/g, ' ').toUpperCase()}</span>
              <button 
                onClick={() => setPreviewDoc(null)} 
                className="text-white hover:text-red-300 font-bold cursor-pointer p-1"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-[#1a1a1a] flex items-center justify-center p-6 min-h-[460px]">
              {previewDoc.isPdf ? (
                <iframe src={previewDoc.url} title={previewDoc.label} className="w-full h-[580px] border border-slate-600 rounded-md bg-white" />
              ) : (
                <img src={previewDoc.url} alt={previewDoc.label} className="max-w-full max-h-[580px] object-contain rounded-md shadow-lg bg-white" />
              )}
            </div>
            <div className="bg-[#e6edf8] px-5 py-2.5 border-t border-[#c4d4ec] flex items-center justify-between text-xs">
              <span className="text-slate-700">Document: <b>{previewDoc.label}</b></span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="bg-[#104080] hover:bg-[#0a2850] text-white px-4 py-1.5 rounded-md text-xs font-bold cursor-pointer shadow-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Confirm Delete CIF Modal (Admin/Super Admin only) */}
      {deleteCifTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white border-2 border-[#104080] rounded-lg shadow-2xl z-10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Title Bar */}
            <div className="bg-[#104080] text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm tracking-wide">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <span>Confirm CIF Deletion</span>
              </div>
              <button 
                type="button"
                onClick={() => !isDeletingCif && setDeleteCifTarget(null)}
                className="text-white hover:text-red-300 p-0.5 leading-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-sm text-slate-700 space-y-4">
              <p className="text-sm text-slate-800">
                Are you sure you want to permanently delete CIF <strong className="text-[#104080] font-bold font-mono">{deleteCifTarget.cif_no || deleteCifTarget.id}</strong>?
              </p>

              {/* Summary Card */}
              <div className="bg-[#f8fafc] border border-[#c4d4ec] rounded-md p-4 space-y-2.5 text-sm">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500 font-medium">CIF ID:</span>
                  <span className="font-mono font-bold text-[#104080]">{deleteCifTarget.cif_no || deleteCifTarget.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500 font-medium">Customer / Agent Name:</span>
                  <span className="font-bold text-slate-900">{deleteCifTarget.first_name} {deleteCifTarget.last_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500 font-medium">Phone:</span>
                  <span className="font-mono font-bold text-slate-900">{deleteCifTarget.contact_number || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="font-semibold text-slate-700">{deleteCifTarget.email || '-'}</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-2.5 rounded-md text-xs leading-relaxed flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Notice: This action permanently removes this customer profile from the repository.</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#f1f5f9] border-t border-[#c4d4ec] px-5 py-3 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeletingCif}
                onClick={() => setDeleteCifTarget(null)}
                className="px-4 py-2 bg-white border border-[#c4d4ec] text-slate-700 hover:bg-slate-100 rounded-md text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingCif}
                onClick={handleConfirmDeleteCif}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
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
