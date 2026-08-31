import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dbService } from '../services/db';
import type { Customer } from '../services/db';
import { useToast } from '../contexts/ToastContext';

const getInitials = (name: string) => {
  const val = name || 'Anonymous';
  return val.split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase();
};

export default function AdminCustomerDetailPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Editable customer states
  const [customerName, setCustomerName] = useState('');
  const [shortName, setShortName] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [emirates, setEmirates] = useState('');

  // Clock ticks every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Access Control Guard & Data Loader
  useEffect(() => {
    const role = dbService.getUserRole();
    if (role !== 'super_admin') {
      navigate('/dashboard');
      return;
    }

    if (!id) {
      navigate('/admin-panel');
      return;
    }

    const all = dbService.getCustomers();
    const found = all.find(c => c.id === id);
    if (!found) {
      navigate('/admin-panel');
      return;
    }

    setCustomer(found);
    setCustomerName(found.name || '');
    setShortName(found.shortName || '');
    setPhoneNo(found.phone || '');
    setEmail(found.email || '');
    setAddress(found.address || '');
    setCity(found.city || '');
    setEmirates(found.emirates || '');
    setLoading(false);
  }, [id, navigate]);

  const handleApprove = () => {
    if (!customer) return;
    dbService.updateCustomer(customer.id, {
      name: customerName,
      shortName: shortName,
      phone: phoneNo,
      email: email,
      address: address,
      city: city,
      emirates: emirates,
      status: 'approved'
    });
    toast.success(`Customer "${customerName}" approved successfully!`);
    navigate('/admin-panel');
  };

  const handleReject = () => {
    if (!customer) return;
    dbService.updateCustomer(customer.id, {
      name: customerName,
      shortName: shortName,
      phone: phoneNo,
      email: email,
      address: address,
      city: city,
      emirates: emirates,
      status: 'rejected'
    });
    toast.error(`Customer "${customerName}" has been rejected.`);
    navigate('/admin-panel');
  };

  if (loading || !customer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-[#9e0248] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Retrieving record details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased selection:bg-[#9e0248]/10 selection:text-[#9e0248] p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
        
        {/* Banner Header Style matching screenshot */}
        <div className="bg-[#9e0248] text-white rounded-t-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm select-none gap-2">
          <div className="flex items-center">
            <button 
              type="button"
              onClick={() => navigate('/admin-panel')}
              className="mr-3.5 hover:text-white/80 transition flex items-center gap-1.5 text-white font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <span>Back</span>
            </button>
            <span className="text-sm font-black uppercase tracking-wider font-montserrat">
              Customer Creation Pending For Approval
            </span>
          </div>
          <span className="text-xs font-bold text-white/90 tracking-wide bg-white/10 px-3 py-1 rounded">
            {currentTimeStr}
          </span>
        </div>

        {/* Form Container Card matching screenshot style */}
        <div className="bg-white border border-slate-200 shadow-md p-6 md:p-10 rounded-b-xl flex flex-col gap-8">
          
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
            
            {/* Customer Name */}
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
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 font-bold p-3.5 rounded-xl text-xs outline-none focus:border-[#9e0248] transition-all duration-200"
              />
            </div>

            {/* Short Name */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Short Name
              </label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="-"
                className="bg-white border border-slate-200 text-slate-800 font-bold p-3.5 rounded-xl text-xs outline-none focus:border-[#9e0248] transition-all duration-200"
              />
            </div>

            {/* Phone No */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Phone No
              </label>
              <input
                type="text"
                value={phoneNo}
                onChange={(e) => setPhoneNo(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 font-bold p-3.5 rounded-xl text-xs outline-none focus:border-[#9e0248] transition-all duration-200"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 font-bold p-3.5 rounded-xl text-xs outline-none focus:border-[#9e0248] transition-all duration-200"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="-"
                className="bg-white border border-slate-200 text-slate-800 font-bold p-3.5 rounded-xl text-xs outline-none focus:border-[#9e0248] transition-all duration-200"
              />
            </div>

            {/* City */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="-"
                className="bg-white border border-slate-200 text-slate-800 font-bold p-3.5 rounded-xl text-xs outline-none focus:border-[#9e0248] transition-all duration-200"
              />
            </div>

            {/* Emirates */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Emirates
              </label>
              <select
                value={emirates}
                onChange={(e) => setEmirates(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 font-bold p-3.5 rounded-xl text-xs outline-none focus:border-[#9e0248] transition-all duration-200 bg-white"
              >
                <option value="Abu Dhabi">Abu Dhabi</option>
                <option value="Dubai">Dubai</option>
                <option value="Sharjah">Sharjah</option>
                <option value="Ajman">Ajman</option>
                <option value="Umm Al Quwain">Umm Al Quwain</option>
                <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                <option value="Fujairah">Fujairah</option>
              </select>
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
                className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-xl text-xs outline-none focus:border-[#9e0248] transition-all duration-200 select-all"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Status
              </label>
              <div className="flex items-center h-full">
                <span className="inline-flex px-3.5 py-1.5 text-[9px] font-black uppercase tracking-wider leading-none rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/15">
                  {customer.status}
                </span>
              </div>
            </div>

          </div>

          {/* Action Buttons Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3.5 border-t border-slate-100 pt-8 mt-4">
            
            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => navigate('/admin-panel')}
              className="w-full sm:w-auto border border-slate-300 hover:bg-slate-50 text-slate-700 font-black px-6 py-3.5 rounded-xl text-xs tracking-wider uppercase cursor-pointer transition select-none text-center"
            >
              Cancel
            </button>

            {/* Reject Button */}
            <button
              type="button"
              onClick={handleReject}
              className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition shadow-sm select-none"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject Customer
            </button>

            {/* Approve Button */}
            <button
              type="button"
              onClick={handleApprove}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition shadow-sm select-none"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Approve Customer
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}
