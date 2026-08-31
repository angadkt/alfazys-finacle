import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dbService } from '../services/db';
import type { Customer } from '../services/db';

const getInitials = (name: string) => {
  const val = name || 'Anonymous';
  return val.split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase();
};

export default function CustomerViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Clock ticks every second in IST
  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(new Date());
      
      let day = '';
      let month = '';
      let year = '';
      let hour = '';
      let minute = '';
      let second = '';
      let dayPeriod = '';

      parts.forEach(part => {
        if (part.type === 'day') day = part.value;
        if (part.type === 'month') month = part.value;
        if (part.type === 'year') year = part.value;
        if (part.type === 'hour') hour = part.value;
        if (part.type === 'minute') minute = part.value;
        if (part.type === 'second') second = part.value;
        if (part.type === 'dayPeriod') dayPeriod = part.value;
      });

      setCurrentTimeStr(`IST ${day} ${month} ${year} ${hour}:${minute}:${second} ${dayPeriod}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Access Control Guard & Data Loader
  useEffect(() => {
    const user = dbService.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!id) {
      navigate('/customers');
      return;
    }

    const all = dbService.getCustomers();
    const found = all.find(c => c.id === id);
    if (!found) {
      navigate('/customers');
      return;
    }

    setCustomer(found);
    setLoading(false);
  }, [id, navigate]);

  if (loading || !customer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-[#9e0248] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Retrieving customer record...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased selection:bg-[#9e0248]/10 selection:text-[#9e0248] p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
        
        {/* Banner Header Style matching design */}
        <div className="bg-[#9e0248] text-white rounded-t-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm select-none gap-2">
          <div className="flex items-center">
            <button 
              type="button"
              onClick={() => navigate('/customers')}
              className="mr-3.5 hover:text-white/80 transition flex items-center gap-1.5 text-white font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <span>Back</span>
            </button>
            <span className="text-sm font-black uppercase tracking-wider font-montserrat">
              Customer Registry Detailed Code Card
            </span>
          </div>
          <span className="text-xs font-bold text-white/90 tracking-wide bg-white/10 px-3 py-1 rounded">
            {currentTimeStr}
          </span>
        </div>

        {/* Form Container Card matching design */}
        <div className="bg-white border border-slate-200 shadow-md p-6 md:p-10 rounded-b-xl flex flex-col gap-8">
          
          {/* Waiting for verification banner if pending */}
          {customer.status === 'pending' && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 font-bold px-5 py-4 rounded-xl text-xs flex items-center gap-2.5 animate-pulse">
              <svg className="w-5 h-5 text-amber-600 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span className="uppercase tracking-wider font-montserrat font-black">Waiting for verification</span>
            </div>
          )}

          {/* Profile Initials Banner */}
          <div className="flex items-center gap-5 border-b border-slate-100 pb-6">
            <div className="text-[#9e0248] bg-[#9e0248]/10 border border-[#9e0248]/20 w-16 h-16 flex items-center justify-center font-bold text-2xl uppercase rounded-full">
              {getInitials(customer.name)}
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-800 leading-tight">{customer.name}</span>
              <span className="text-xs text-slate-450 font-bold mt-1.5">{customer.email}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            
            {/* Customer ID */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Customer ID
              </label>
              <input
                type="text"
                readOnly
                value={customer.id}
                className="bg-slate-50 border border-slate-200 text-[#9e0248] font-bold p-3.5 rounded-xl text-xs outline-none select-all"
              />
            </div>

            {/* Customer Name */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Customer Name
              </label>
              <input
                type="text"
                readOnly
                value={customer.name}
                className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-xl text-xs outline-none select-all"
              />
            </div>

            {/* Short Name */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Short Name
              </label>
              <input
                type="text"
                readOnly
                value={customer.shortName || ''}
                placeholder="-"
                className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-xl text-xs outline-none select-all"
              />
            </div>

            {/* Phone No */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Phone No
              </label>
              <input
                type="text"
                readOnly
                value={customer.phone}
                className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-xl text-xs outline-none select-all"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Email
              </label>
              <input
                type="email"
                readOnly
                value={customer.email}
                className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-xl text-xs outline-none select-all"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Address
              </label>
              <input
                type="text"
                readOnly
                value={customer.address || ''}
                placeholder="-"
                className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-xl text-xs outline-none select-all"
              />
            </div>

            {/* City */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                City
              </label>
              <input
                type="text"
                readOnly
                value={customer.city || ''}
                placeholder="-"
                className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-xl text-xs outline-none select-all"
              />
            </div>

            {/* Emirates */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Emirates
              </label>
              <input
                type="text"
                readOnly
                value={customer.emirates || customer.country}
                className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-xl text-xs outline-none select-all"
              />
            </div>

            {/* Submitted Date */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Submitted Date
              </label>
              <input
                type="text"
                readOnly
                value={customer.joinedDate}
                className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-xl text-xs outline-none select-all"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Status
              </label>
              <div className="flex items-center h-full">
                <span className={`inline-flex px-3.5 py-1.5 text-[9px] font-black uppercase tracking-wider leading-none rounded-full border ${
                  customer.status === 'approved'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15'
                    : customer.status === 'rejected'
                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/15'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/15'
                }`}>
                  {customer.status}
                </span>
              </div>
            </div>

          </div>

          {/* Action Buttons Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3.5 border-t border-slate-100 pt-8 mt-4">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="w-full sm:w-auto border border-slate-300 hover:bg-slate-50 text-slate-700 font-black px-6 py-3.5 rounded-xl text-xs tracking-wider uppercase cursor-pointer transition select-none text-center"
            >
              Return to Customers
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
