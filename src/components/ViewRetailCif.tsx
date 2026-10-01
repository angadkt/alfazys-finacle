import { useState, useEffect } from 'react';
import { dbService } from '../services/db';

export default function ViewRetailCif() {
  const [verifiedCifs, setVerifiedCifs] = useState<any[]>([]);

  useEffect(() => {
    loadVerifiedCifs();
  }, []);

  const loadVerifiedCifs = () => {
    const allCustomers = dbService.getCustomers();
    // 'approved' means verified in our DB schema
    const verified = allCustomers.filter(c => c.status === 'approved');
    setVerifiedCifs(verified);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#e4e4e4] p-4 font-sans" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <h2 className="text-[18px] font-bold text-[#1e4676] mb-4">View Verified Retail CIFs</h2>
      
      <div className="bg-white border border-[#a0a0a0] p-1 flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#d4d0c8] border-b border-[#a0a0a0] text-[12px] text-left">
              <th className="p-2 border-r border-[#a0a0a0]">CIF ID</th>
              <th className="p-2 border-r border-[#a0a0a0]">Name</th>
              <th className="p-2 border-r border-[#a0a0a0]">Email</th>
              <th className="p-2 border-r border-[#a0a0a0]">Phone</th>
              <th className="p-2 border-r border-[#a0a0a0]">Status</th>
            </tr>
          </thead>
          <tbody>
            {verifiedCifs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-[12px] text-gray-500">
                  No verified CIFs found.
                </td>
              </tr>
            ) : (
              verifiedCifs.map((cif) => (
                <tr key={cif.id} className="border-b border-[#e4e4e4] text-[12px] hover:bg-[#f0f0f5]">
                  <td className="p-2 border-r border-[#e4e4e4] font-semibold text-[#1e4676]">{cif.id}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.name}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.email || '-'}</td>
                  <td className="p-2 border-r border-[#e4e4e4]">{cif.phone || '-'}</td>
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
  );
}
