import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dbService } from '../services/db';
import type { Customer } from '../services/db';
import { useToast } from '../contexts/ToastContext';

const getInitials = (name: string) => {
  const val = name || 'Anonymous';
  return val.split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase();
};

export default function CustomerViewPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Active Role
  const activeRole = dbService.getUserRole();
  const isAdmin = activeRole === 'super_admin';

  // Editable customer states (for Admin verification)
  const [customerName, setCustomerName] = useState('');
  const [shortName, setShortName] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [emirates, setEmirates] = useState('');

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

  // Data Loader
  useEffect(() => {
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
    setCustomerName(found.name || '');
    setShortName(found.shortName || '');
    setPhoneNo(found.phone || '');
    setEmail(found.email || '');
    setAddress(found.address || '');
    setCity(found.city || '');
    setEmirates(found.emirates || found.country || 'Dubai');
    setLoading(false);
  }, [id, navigate]);

  // Admin Actions
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
    toast.success(`Customer "${customerName}" has been APPROVED successfully!`);
    navigate('/customers');
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
    toast.error(`Customer "${customerName}" registration was rejected.`);
    navigate('/customers');
  };

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

  const isPending = customer.status === 'pending';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased selection:bg-[#9e0248]/10 selection:text-[#9e0248] p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider -mb-2">
          <span>Home</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          <span>Customers</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          <span className="text-slate-800">Customer Details</span>
        </div>

        {/* Banner Header Style */}
        <div className="bg-[#9e0248] text-white rounded-t-lg px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm select-none gap-2">
          <div className="flex items-center">
            <button 
              type="button"
              onClick={() => navigate('/customers')}
              className="mr-3.5 hover:text-white/80 transition flex items-center gap-1.5 text-white font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <span>Back</span>
            </button>
            <span className="text-sm font-black uppercase tracking-wider font-montserrat">
              {isAdmin && isPending 
                ? 'Customer Verification & Admin Approval' 
                : 'Customer Detailed Code Card'}
            </span>
          </div>
          <span className="text-xs font-bold text-white/90 tracking-wide bg-white/10 px-3 py-1 rounded">
            {currentTimeStr}
          </span>
        </div>

        {/* Form Container Card */}
        <div className="bg-white border border-slate-200 shadow-md p-6 md:p-10 rounded-b-lg flex flex-col gap-8">
          
          {/* Waiting for verification banner if pending for staff/agent */}
          {!isAdmin && isPending && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 font-bold px-5 py-4 rounded-md text-xs flex items-center gap-2.5 animate-pulse">
              <svg className="w-5 h-5 text-amber-600 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span className="uppercase tracking-wider font-montserrat font-black">Waiting for admin verification & approval</span>
            </div>
          )}

          {/* Admin Verification Notice */}
          {isAdmin && isPending && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 font-semibold px-5 py-4 rounded-md text-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0" />
                <span><strong>Admin Review:</strong> Verify customer details and choose to approve or reject this onboarding request.</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-2.5 py-1 rounded-md">
                Action Required
              </span>
            </div>
          )}

          {/* Profile Initials Banner */}
          <div className="flex items-center gap-5 border-b border-slate-100 pb-6">
            <div className="text-[#9e0248] bg-[#9e0248]/10 border border-[#9e0248]/20 w-16 h-16 flex items-center justify-center font-bold text-2xl uppercase rounded-full">
              {getInitials(customer.name)}
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-800 leading-tight">{customer.name}</span>
              <span className="text-xs text-slate-400 font-bold mt-1.5">{customer.email}</span>
            </div>
            <div className="ml-auto">
              <span className={`inline-flex px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider leading-none rounded-full border ${
                customer.status === 'approved'
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : customer.status === 'rejected'
                  ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
              }`}>
                {customer.status}
              </span>
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
                className="bg-slate-50 border border-slate-200 text-[#9e0248] font-bold p-3.5 rounded-md text-xs outline-none select-all"
              />
            </div>

            {/* Customer Name */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Customer Name
              </label>
              {isAdmin && isPending ? (
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 font-bold p-3.5 rounded-md text-xs outline-none focus:border-[#9e0248] transition"
                />
              ) : (
                <input
                  type="text"
                  readOnly
                  value={customer.name}
                  className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-md text-xs outline-none select-all"
                />
              )}
            </div>

            {/* Short Name */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Short Name
              </label>
              {isAdmin && isPending ? (
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="-"
                  className="bg-white border border-slate-200 text-slate-800 font-bold p-3.5 rounded-md text-xs outline-none focus:border-[#9e0248] transition"
                />
              ) : (
                <input
                  type="text"
                  readOnly
                  value={customer.shortName || ''}
                  placeholder="-"
                  className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-md text-xs outline-none select-all"
                />
              )}
            </div>

            {/* Phone No */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Phone No
              </label>
              {isAdmin && isPending ? (
                <input
                  type="text"
                  value={phoneNo}
                  onChange={(e) => setPhoneNo(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 font-bold p-3.5 rounded-md text-xs outline-none focus:border-[#9e0248] transition"
                />
              ) : (
                <input
                  type="text"
                  readOnly
                  value={customer.phone}
                  className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-md text-xs outline-none select-all"
                />
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Email
              </label>
              {isAdmin && isPending ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 font-bold p-3.5 rounded-md text-xs outline-none focus:border-[#9e0248] transition"
                />
              ) : (
                <input
                  type="email"
                  readOnly
                  value={customer.email}
                  className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-md text-xs outline-none select-all"
                />
              )}
            </div>

            {/* Address */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Address
              </label>
              {isAdmin && isPending ? (
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="-"
                  className="bg-white border border-slate-200 text-slate-800 font-bold p-3.5 rounded-md text-xs outline-none focus:border-[#9e0248] transition"
                />
              ) : (
                <input
                  type="text"
                  readOnly
                  value={customer.address || ''}
                  placeholder="-"
                  className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-md text-xs outline-none select-all"
                />
              )}
            </div>

            {/* City */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                City
              </label>
              {isAdmin && isPending ? (
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="-"
                  className="bg-white border border-slate-200 text-slate-800 font-bold p-3.5 rounded-md text-xs outline-none focus:border-[#9e0248] transition"
                />
              ) : (
                <input
                  type="text"
                  readOnly
                  value={customer.city || ''}
                  placeholder="-"
                  className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-md text-xs outline-none select-all"
                />
              )}
            </div>

            {/* Emirates */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Emirates
              </label>
              {isAdmin && isPending ? (
                <select
                  value={emirates}
                  onChange={(e) => setEmirates(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 font-bold p-3.5 rounded-md text-xs outline-none focus:border-[#9e0248] transition"
                >
                  <option value="Abu Dhabi">Abu Dhabi</option>
                  <option value="Dubai">Dubai</option>
                  <option value="Sharjah">Sharjah</option>
                  <option value="Ajman">Ajman</option>
                  <option value="Umm Al Quwain">Umm Al Quwain</option>
                  <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                  <option value="Fujairah">Fujairah</option>
                </select>
              ) : (
                <input
                  type="text"
                  readOnly
                  value={customer.emirates || customer.country}
                  className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-md text-xs outline-none select-all"
                />
              )}
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
                className="bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3.5 rounded-md text-xs outline-none select-all"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-montserrat">
                Current Verification Status
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
            
            {/* If Admin and Customer is Pending: Show Reject and Approve Buttons */}
            {isAdmin && isPending ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/customers')}
                  className="w-full sm:w-auto border border-slate-300 hover:bg-slate-50 text-slate-700 font-black px-6 py-3.5 rounded-md text-xs tracking-wider uppercase cursor-pointer transition select-none text-center"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleReject}
                  className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-black px-6 py-3.5 rounded-md text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition shadow-sm select-none"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject Customer
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3.5 rounded-md text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition shadow-sm select-none"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Approve Customer
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="w-full sm:w-auto bg-[#9e0248] hover:bg-[#85013c] text-white font-black px-6 py-3.5 rounded-md text-xs tracking-wider uppercase cursor-pointer transition select-none text-center shadow-md"
              >
                Return to Customers Registry
              </button>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
