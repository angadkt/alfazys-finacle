import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ViewRetailCif() {
  const [verifiedCifs, setVerifiedCifs] = useState<any[]>([]);
  const [selectedCif, setSelectedCif] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div className="flex-1 flex flex-col bg-[#e4e4e4]" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <div className="bg-white px-3 py-2.5 border-b border-[#a0a0a0]">
        <h4 className="text-[15px] font-extrabold text-[#1e4676] m-0 capitalize tracking-wide">view retail cif</h4>
      </div>
      <div className="flex-1 flex flex-col p-4">
      
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-[18px] font-bold text-[#1e4676] m-0">View Verified Retail CIFs</h2>
        
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
            </tr>
          </thead>
          <tbody>
            {filteredCifs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-[12px] text-gray-500">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* CIF Details Modal */}
      {selectedCif && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#e4e4e4] border-2 border-[#a0a0a0] w-[650px] shadow-2xl flex flex-col font-sans max-h-[90vh]">
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
                        <th className="p-2 font-bold">Last 4 Digits</th>
                        <th className="p-2 font-bold">Expiry Date</th>
                        <th className="p-2 font-bold">Uploaded At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCif.documents.map((doc: any) => (
                        <tr key={doc.id} className="border-b border-[#e4e4e4] last:border-0 hover:bg-gray-50">
                          <td className="p-2 font-semibold text-[#1e4676]">{doc.doc_type}</td>
                          <td className="p-2">***{doc.doc_number_last4 || 'N/A'}</td>
                          <td className="p-2">{doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : '-'}</td>
                          <td className="p-2">{new Date(doc.uploaded_at).toLocaleString()}</td>
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
                className="bg-gray-100 border border-gray-400 px-6 py-1 text-[12px] hover:bg-gray-200 font-bold text-[#1e4676]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
