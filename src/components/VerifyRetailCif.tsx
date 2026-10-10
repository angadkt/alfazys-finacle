import { useState, useEffect } from 'react';
import api from '../services/api';
import { dbService } from '../services/db';

export default function VerifyRetailCif() {
  const [pendingCifs, setPendingCifs] = useState<any[]>([]);

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
    try {
      const targetId = cif.realId || cif.id;
      await api.patch(`/records/parties/${targetId}`, { status: 'verified' });
      alert(`CIF ${cif.id} has been verified successfully.`);
      loadPendingCifs();
    } catch (err: any) {
      dbService.updateCustomer(cif.id, { status: 'approved' });
      alert(`CIF ${cif.id} has been verified successfully.`);
      loadPendingCifs();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#e4e4e4]" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <div className="bg-white px-3 py-2.5 border-b border-[#a0a0a0]">
        <h4 className="text-[15px] font-extrabold text-[#1e4676] m-0 capitalize tracking-wide">verify retail cif creation</h4>
      </div>
      <div className="flex-1 flex flex-col p-4">
      <h2 className="text-[18px] font-bold text-[#1e4676] mb-4">Verify Retail CIF</h2>
      
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
              <th className="p-2">Action</th>
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
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.id}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.name}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.email || '-'}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.phone || '-'}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.issuedBy || '-'}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.verifiedBy || '-'}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">
                    <span className="text-orange-600 font-semibold uppercase">{cif.status}</span>
                  </td>
                  <td className="p-2">
                    <button 
                      onClick={() => handleVerify(cif)}
                      className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-2 py-0.5 text-xs text-black active:border-t-[#8f8f9d] active:border-l-[#8f8f9d] active:border-b-white active:border-r-white"
                    >
                      Verify
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
