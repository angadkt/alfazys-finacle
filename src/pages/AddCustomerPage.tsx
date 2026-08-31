import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/db';
import { useToast } from '../contexts/ToastContext';

export default function AddCustomerPage() {
  const navigate = useNavigate();
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

  // Live IST Clock
  const [currentTimeStr, setCurrentTimeStr] = useState('');

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
        if (part.type === 'dayPeriod') dayPeriod = part.value.toUpperCase();
      });

      // Output format: IST 22 Aug 2026 10:43:34 PM
      setCurrentTimeStr(`IST ${day} ${month} ${year} ${hour}:${minute}:${second} ${dayPeriod}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
      dbService.addCustomer({
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
        toast.success(`Customer "${customerName}" submitted for approval!`);
        navigate('/customers');
      }, 800);
    } catch (err) {
      setLoading(false);
      setError('Failed to add customer. Please try again.');
      toast.error('Failed to add customer. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased selection:bg-[#9e0248]/10 selection:text-[#9e0248] p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl w-full mx-auto flex flex-col gap-6">
        
        {/* Banner Header Style matching screenshot */}
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
              Customer Code Creation - Retail
            </span>
          </div>
          <span className="text-xs font-bold text-white/90 tracking-wide bg-white/10 px-3 py-1 rounded">
            {currentTimeStr}
          </span>
        </div>

        {/* Form Container Card matching screenshot style */}
        <div className="bg-white border border-slate-200 shadow-md p-6 md:p-10 rounded-b-xl flex flex-col gap-8">
          
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              
              {/* Left Column */}
              <div className="flex flex-col gap-6">
                
                {/* Customer Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 text-left">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter customer full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border border-slate-200 px-4 py-2.5 outline-none focus:border-[#9e0248] text-sm text-slate-800 font-medium rounded-xl transition"
                  />
                </div>

                {/* Short Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 text-left">
                    Short Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter short code/alias"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    className="w-full border border-slate-200 px-4 py-2.5 outline-none focus:border-[#9e0248] text-sm text-slate-800 font-medium rounded-xl transition"
                  />
                </div>

                {/* Phone No */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 text-left">
                    Phone No
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +971 50 123 4567"
                    value={phoneNo}
                    onChange={(e) => setPhoneNo(e.target.value)}
                    className="w-full border border-slate-200 px-4 py-2.5 outline-none focus:border-[#9e0248] text-sm text-slate-800 font-medium rounded-xl transition"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 text-left">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-200 px-4 py-2.5 outline-none focus:border-[#9e0248] text-sm text-slate-800 font-medium rounded-xl transition"
                  />
                </div>

              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-6">
                
                {/* Address */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 text-left">
                    Address
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter physical address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-slate-200 px-4 py-2.5 outline-none focus:border-[#9e0248] text-sm text-slate-800 font-medium rounded-xl transition"
                  />
                </div>

                {/* City */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 text-left">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dubai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-slate-200 px-4 py-2.5 outline-none focus:border-[#9e0248] text-sm text-slate-800 font-medium rounded-xl transition"
                  />
                </div>

                {/* Emirates Select */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 text-left">
                    Emirates (Select)
                  </label>
                  <select
                    required
                    value={emirates}
                    onChange={(e) => setEmirates(e.target.value)}
                    className="w-full border border-slate-200 px-4 py-2.5 outline-none focus:border-[#9e0248] text-sm text-slate-800 font-medium rounded-xl transition bg-white"
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
            <div className="flex items-center justify-start border-t border-slate-100 pt-6 gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#9e0248] hover:bg-[#85013c] text-white font-bold py-3 px-8 rounded-xl transition cursor-pointer text-xs uppercase tracking-wider shadow-md shadow-[#9e0248]/15 disabled:opacity-75"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3 px-8 rounded-xl transition cursor-pointer text-xs uppercase tracking-wider border border-slate-200"
              >
                Cancel
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
