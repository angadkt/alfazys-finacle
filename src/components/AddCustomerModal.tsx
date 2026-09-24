import React, { useState, useEffect } from 'react';
import { dbService, type Customer } from '../services/db';
import { useToast } from '../contexts/ToastContext';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCustomerModal({ isOpen, onClose, onSuccess }: AddCustomerModalProps) {
  const toast = useToast();
  
  // Form states
  const [customerName, setCustomerName] = useState('');
  const [shortName, setShortName] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [emirates, setEmirates] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConfirmationMode, setIsConfirmationMode] = useState(false);
  const [createdCustomer, setCreatedCustomer] = useState<Customer | null>(null);

  // Live IST Clock
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    if (!isOpen) return;
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
        if (part.type === 'dayPeriod') dayPeriod = part.value.toUpperCase();
      });

      setCurrentTimeStr(`IST ${day} ${month} ${year} ${hour}:${minute}:${second} ${dayPeriod}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomerName('');
      setShortName('');
      setPhoneNo('');
      setEmail('');
      setAddress('');
      setCity('');
      setEmirates('');
      setError('');
      setCreatedCustomer(null);
      setIsConfirmationMode(false);
    }
  }, [isOpen]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim() || !shortName.trim() || !phoneNo.trim() || !email.trim() || !address.trim() || !city.trim() || !emirates) {
      setError('Please fill in all the details, including selecting an Emirate.');
      toast.error('Please fill in all the details, including selecting an Emirate.');
      return;
    }

    setLoading(true);

    try {
      const newCustomer = dbService.addCustomer({
        name: customerName,
        shortName: shortName,
        phone: phoneNo,
        email: email,
        address: address,
        city: city,
        emirates: emirates,
        country: 'United Arab Emirates',
        balance: 0,
        status: 'pending'
      });

      // Simulate a small network delay for smooth UX
      setTimeout(() => {
        setLoading(false);
        setCreatedCustomer(newCustomer);
        setIsConfirmationMode(true);
        toast.success(`Customer "${customerName}" submitted for approval!`);
        onSuccess();
      }, 800);
    } catch (err) {
      setLoading(false);
      setError('Failed to add customer. Please try again.');
      toast.error('Failed to add customer. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
      
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-xl flex flex-col relative my-auto animate-in zoom-in-95 duration-200">
        
        {/* Banner Header Style */}
        <div className="bg-[#9e0248] text-white rounded-t-xl px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm select-none gap-3">
          <div className="flex items-center">
            <button 
              type="button"
              onClick={onClose}
              className="mr-3.5 hover:text-white/80 transition flex items-center justify-center text-white bg-white/10 hover:bg-white/20 p-2 rounded-lg cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-sm font-black uppercase tracking-wider font-montserrat">
              {isConfirmationMode ? 'Customer Registration Confirmation' : 'Customer Code Creation - Retail'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-white/90 tracking-widest bg-white/10 px-3 py-1.5 rounded uppercase">
            {currentTimeStr}
          </span>
        </div>

        {/* Form Container */}
        <div className="p-5 sm:p-8 flex flex-col gap-6">
          
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-xs font-semibold animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {isConfirmationMode ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300">
              
              {/* Success Confirmation Banner */}
              <div className="bg-[#eef7ee] border-l-[5px] border-[#2e7d32] p-4 rounded-r-xl flex items-start gap-3.5 select-none">
                <span className="flex-shrink-0 bg-[#2e7d32] text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-slate-700 tracking-wide uppercase leading-none">Confirmation</span>
                  <span className="text-[11px] text-slate-500 font-bold mt-1 leading-normal">Customer registration request submitted successfully.</span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-7 text-left select-all bg-slate-50/50 p-5 rounded-lg border border-slate-100">
                
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-400 font-bold tracking-wide uppercase">Reference Number</span>
                  <span className="text-xs font-black text-slate-800">{createdCustomer?.id}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-400 font-bold tracking-wide uppercase">Status</span>
                  <span className="text-xs font-black text-amber-600">Pending for Approval</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-400 font-bold tracking-wide uppercase">Customer Name</span>
                  <span className="text-xs font-black text-slate-800">{createdCustomer?.name}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-400 font-bold tracking-wide uppercase">Short Name</span>
                  <span className="text-xs font-black text-slate-800">{createdCustomer?.shortName}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-400 font-bold tracking-wide uppercase">Phone No</span>
                  <span className="text-xs font-black text-slate-800">{createdCustomer?.phone}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-400 font-bold tracking-wide uppercase">Email</span>
                  <span className="text-xs font-black text-slate-800">{createdCustomer?.email}</span>
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-[11px] text-slate-400 font-bold tracking-wide uppercase">Address</span>
                  <span className="text-xs font-black text-slate-800">{createdCustomer?.address}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-400 font-bold tracking-wide uppercase">City</span>
                  <span className="text-xs font-black text-slate-800">{createdCustomer?.city}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-400 font-bold tracking-wide uppercase">Emirates</span>
                  <span className="text-xs font-black text-slate-800">{createdCustomer?.emirates}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-400 font-bold tracking-wide uppercase">Country</span>
                  <span className="text-xs font-black text-slate-800">United Arab Emirates</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-400 font-bold tracking-wide uppercase">Registration Date</span>
                  <span className="text-xs font-black text-slate-800">{formatDate(createdCustomer?.joinedDate || '')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end border-t border-slate-100 pt-6 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-2.5 px-6 rounded-md transition cursor-pointer text-xs uppercase tracking-wider border border-slate-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.821V21h10.56v-7.179m-10.56 0H19.5a2.25 2.25 0 0 0 2.25-2.25V9a2.25 2.25 0 0 0-2.25-2.25h-15A2.25 2.25 0 0 0 2.25 9v2.571a2.25 2.25 0 0 0 2.25 2.25h2.22m10.56 0h2.22M9.75 3h4.5M16.5 9h.008v.008H16.5V9Z" />
                  </svg>
                  Print
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#9e0248] hover:bg-[#85013c] text-white font-bold py-2.5 px-6 rounded-md transition cursor-pointer text-xs uppercase tracking-wider shadow-sm"
                >
                  Close & Continue
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                
                {/* Left Column */}
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Customer Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter customer full name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full border border-slate-200 px-3 py-2.5 outline-none focus:border-[#9e0248] text-sm text-slate-800 font-medium rounded-md transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Short Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter short code/alias"
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      className="w-full border border-slate-200 px-3 py-2.5 outline-none focus:border-[#9e0248] text-sm text-slate-800 font-medium rounded-md transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Phone No</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +971 50 123 4567"
                      value={phoneNo}
                      onChange={(e) => setPhoneNo(e.target.value)}
                      className="w-full border border-slate-200 px-3 py-2.5 outline-none focus:border-[#9e0248] text-sm text-slate-800 font-medium rounded-md transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-slate-200 px-3 py-2.5 outline-none focus:border-[#9e0248] text-sm text-slate-800 font-medium rounded-md transition"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Address</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter physical address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full border border-slate-200 px-3 py-2.5 outline-none focus:border-[#9e0248] text-sm text-slate-800 font-medium rounded-md transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">City</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dubai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full border border-slate-200 px-3 py-2.5 outline-none focus:border-[#9e0248] text-sm text-slate-800 font-medium rounded-md transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Emirates (Select)</label>
                    <select
                      required
                      value={emirates}
                      onChange={(e) => setEmirates(e.target.value)}
                      className="w-full border border-slate-200 px-3 py-2.5 outline-none focus:border-[#9e0248] text-sm text-slate-800 font-medium rounded-md transition bg-white cursor-pointer"
                    >
                      <option value="" disabled>Please Select</option>
                      <option value="Abu Dhabi">Abu Dhabi</option>
                      <option value="Dubai">Dubai</option>
                      <option value="Sharjah">Sharjah</option>
                      <option value="Ajman">Ajman</option>
                      <option value="Umm Al Quwain">Umm Al Quwain</option>
                      <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                      <option value="Fujairah">Fujairah</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Submit Action Buttons */}
              <div className="flex items-center justify-start border-t border-slate-100 pt-5 gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#9e0248] hover:bg-[#85013c] text-white font-bold py-3 px-6 rounded-md transition cursor-pointer text-xs uppercase tracking-wider shadow-sm disabled:opacity-75"
                >
                  Create Customer
                </button>
                
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3 px-6 rounded-md transition cursor-pointer text-xs uppercase tracking-wider border border-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
