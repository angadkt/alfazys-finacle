import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Customer } from '../services/db';

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const CrossIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const getInitials = (name: string) => {
  const val = name || 'Anonymous';
  return val.split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase();
};

interface CustomerTableProps {
  customers: Customer[];
  isAdmin: boolean;
  onApprove: (e: React.MouseEvent, id: string, name: string) => void;
  onReject: (e: React.MouseEvent, id: string, name: string) => void;
}

export default function CustomerTable({ customers, isAdmin, onApprove, onReject }: CustomerTableProps) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full border-collapse text-left bg-white">
        <thead>
          <tr className="bg-slate-50/80 border-y border-slate-200">
            <th className="text-slate-500 text-[10px] uppercase font-black tracking-widest py-4 px-6">Customer</th>
            <th className="text-slate-500 text-[10px] uppercase font-black tracking-widest py-4 px-6">Contact</th>
            <th className="text-slate-500 text-[10px] uppercase font-black tracking-widest py-4 px-6">Location</th>
            <th className="text-slate-500 text-[10px] uppercase font-black tracking-widest py-4 px-6">Status</th>
            <th className="text-slate-500 text-[10px] uppercase font-black tracking-widest py-4 px-6 text-center">
              {isAdmin ? 'Actions & Verification' : 'Actions'}
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.length > 0 ? (
            customers.map((cust) => {
              const isPending = cust.status === 'pending';
              
              // Location combination
              const locationParts = [];
              if (cust.address) locationParts.push(cust.address);
              if (cust.city) locationParts.push(cust.city);
              const addressLine = locationParts.join(', ');
              const emirate = cust.emirates || cust.country;

              return (
                <tr 
                  key={cust.id} 
                  onClick={() => navigate(`/customers/view/${cust.id}`)}
                  className="transition duration-150 border-b border-slate-100 hover:bg-[#9e0248]/5 cursor-pointer"
                >
                  <td className="py-4.5 px-6">
                    <div className="flex items-center gap-4">
                      <div className="text-[#9e0248] bg-[#9e0248]/10 border border-[#9e0248]/20 w-10 h-10 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 rounded-full">
                        {getInitials(cust.name)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 leading-tight">
                          {cust.name} {cust.shortName ? <span className="text-slate-400 font-semibold ml-1 text-xs">({cust.shortName})</span> : null}
                        </span>
                        <span className="text-xs text-slate-500 font-medium mt-0.5">{cust.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4.5 px-6">
                    <span className="text-xs font-semibold text-slate-700 tabular-nums font-inter">{cust.phone || '-'}</span>
                  </td>
                  <td className="py-4.5 px-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-700">{emirate || '-'}</span>
                      {addressLine && (
                        <span className="text-[10px] text-slate-500 mt-0.5 max-w-[200px] truncate">{addressLine}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4.5 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider leading-none rounded-md ${
                      cust.status === 'approved' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                        : cust.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        cust.status === 'approved' ? 'bg-emerald-500' :
                        cust.status === 'rejected' ? 'bg-rose-500' :
                        'bg-amber-500 animate-pulse'
                      }`} />
                      {cust.status}
                    </span>
                  </td>
                  <td className="py-4.5 px-6 text-center">
                    <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {isAdmin && isPending && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => onApprove(e, cust.id, cust.name)}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-lg transition shadow-sm cursor-pointer"
                            title="Approve Customer"
                          >
                            <CheckIcon />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => onReject(e, cust.id, cust.name)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 rounded-lg transition shadow-sm cursor-pointer"
                            title="Reject Customer"
                          >
                            <CrossIcon />
                          </button>
                        </>
                      )}
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customers/view/${cust.id}`);
                        }}
                        className="text-slate-400 hover:text-[#9e0248] p-1.5 hover:bg-[#9e0248]/10 rounded-lg transition cursor-pointer"
                        title={isAdmin && isPending ? "Review & Verify Details" : "View Customer Details"}
                      >
                        <EyeIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="py-24 text-center">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full border border-slate-100">
                    <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A2.25 2.25 0 0112.75 21.5h-1.5a2.25 2.25 0 01-2.25-2.263V19.13m5.75-.002a9.397 9.397 0 01-2.17.283 9.4 9.4 0 01-2.17-.283M8.25 19.128a9.38 9.38 0 01-2.625.372 9.337 9.337 0 01-4.121-.952 4.125 4.125 0 017.533-2.493M8.25 19.128v-.003c0-1.113.285-2.16.786-3.07M12 18.75c-3.12 0-5.84-1.632-7.38-4.088A9.37 9.37 0 0112 12.75c3.12 0 5.84 1.532 7.38 4.088A9.37 9.37 0 0112 18.75z" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-black text-slate-700">No Customers Found</span>
                    <span className="text-xs text-slate-500 font-medium max-w-xs mt-1">No customers match your current filters or selection.</span>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
