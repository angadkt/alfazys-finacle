import React, { useState } from 'react';

export default function OrderEntryForm() {
  const [selectedFunction, setSelectedFunction] = useState('A-ADD');
  const [orderType, setOrderType] = useState('REMITTANCE');
  const [currency, setCurrency] = useState('INR');
  const [orderAmount, setOrderAmount] = useState('');
  const [clientName, setClientName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderRef, setOrderRef] = useState('');

  const handleGo = () => {
    if (!clientName.trim() || !orderAmount) {
      alert('Please fill Client Name and Order Amount.');
      return;
    }
    const ref = `ORD-${Date.now().toString().slice(-6)}`;
    setOrderRef(ref);
    setIsSubmitted(true);
  };

  const handleClear = () => {
    setClientName('');
    setOrderAmount('');
    setSelectedFunction('A-ADD');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#e4e4e4] overflow-hidden" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      
      {/* 1. Header Bar */}
      <div className="bg-white px-3 py-2 border-b border-[#a0a0a0] flex items-center justify-between">
        <div>
          <h4 className="text-[15px] font-extrabold text-[#1e4676] m-0 capitalize tracking-wide">
            Order Entry Management
          </h4>
          <span className="text-[11px] text-gray-600">
            FINCORE Universal Settlement Module • Order Booking & Trade Remittance
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-bold text-[#1e4676]">Function:</span>
          <select 
            value={selectedFunction} 
            onChange={(e) => setSelectedFunction(e.target.value)}
            className="border border-[#7f9db9] bg-white text-black px-1 h-[22px] text-[11px]"
          >
            <option value="A-ADD">A-ADD (Create New Order)</option>
            <option value="V-VIEW">V-VIEW (Inquire Orders)</option>
            <option value="M-MODIFY">M-MODIFY (Update Order)</option>
            <option value="X-CANCEL">X-CANCEL (Void Order)</option>
          </select>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 bg-white border border-[#a0a0a0] m-1 p-3 flex flex-col overflow-auto">
        
        <div className="bg-[#eaf0f8] px-2 py-1 font-bold text-[#104080] border-y border-[#a2b5cd] mb-3 text-[12px] flex items-center justify-between">
          <span>Custom Order Entry Form (2004 Finacle Model)</span>
          <span className="text-[10px] bg-[#1e4676] text-white px-2 py-0.5">READY FOR CLIENT SPECIFICATIONS</span>
        </div>

        {/* Function Box */}
        <div className="border-2 border-[#a0a0a0] p-4 bg-white mb-4 max-w-4xl text-[11px]">
          <div className="grid grid-cols-[160px_1fr] gap-y-3 items-center">
            
            <div className="font-bold text-black">
              Function Code <span className="text-red-600">*</span>
            </div>
            <div>
              <select 
                value={selectedFunction}
                onChange={(e) => setSelectedFunction(e.target.value)}
                className="w-[240px] border border-[#7f9db9] bg-[#00a2e8] text-white focus:outline-none h-[24px] text-[11px] px-1 font-bold"
              >
                <option value="A-ADD" className="bg-white text-black">A-ADD (New Order Booking)</option>
                <option value="V-VIEW" className="bg-white text-black">V-VIEW (Order Inquiry)</option>
                <option value="M-MODIFY" className="bg-white text-black">M-MODIFY (Amend Order)</option>
                <option value="X-CANCEL" className="bg-white text-black">X-CANCEL (Cancel Order)</option>
              </select>
            </div>

            <div className="font-bold text-black">
              Order Type <span className="text-red-600">*</span>
            </div>
            <div>
              <select 
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="w-[240px] border border-[#7f9db9] bg-white text-black focus:outline-none h-[24px] text-[11px] px-1"
              >
                <option value="REMITTANCE">REMITTANCE ORDER (AED → INR)</option>
                <option value="FX_CONVERSION">FX SPOT CONVERSION</option>
                <option value="COMMERCIAL_PAYOUT">COMMERCIAL PAYOUT ORDER</option>
                <option value="COLLECTION_ORDER">AGENT COLLECTION ORDER</option>
              </select>
            </div>

            <div className="font-bold text-black">
              Client / Beneficiary Name <span className="text-red-600">*</span>
            </div>
            <div>
              <input 
                type="text" 
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                className="w-[320px] border border-[#7f9db9] h-[24px] px-1 text-[11px] uppercase focus:outline-none"
              />
            </div>

            <div className="font-bold text-black">
              Order Amount & CCY <span className="text-red-600">*</span>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="border border-[#7f9db9] bg-white h-[24px] px-1 text-[11px] font-bold"
              >
                <option value="INR">INR (₹)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="USD">USD ($)</option>
              </select>
              <input 
                type="number" 
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                placeholder="Order Amount"
                className="w-[200px] border border-[#7f9db9] h-[24px] px-2 text-[12px] font-bold text-[#1e4676] focus:outline-none"
              />
            </div>

            <div className="font-bold text-black">
              Value Execution Date
            </div>
            <div>
              <input 
                type="date" 
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-[240px] border border-[#7f9db9] h-[24px] px-1 text-[11px] focus:outline-none"
              />
            </div>

            <div className="font-bold text-black">
              Order Notes / Instructions
            </div>
            <div>
              <input 
                type="text" 
                placeholder="Special settlement remarks"
                className="w-[450px] border border-[#7f9db9] h-[24px] px-1 text-[11px] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mb-4">
          <button 
            onClick={handleGo}
            className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-4 py-1 text-xs text-black font-bold active:border-t-[#8f8f9d] active:border-l-[#8f8f9d]"
          >
            Create Order (Go)
          </button>
          <button 
            onClick={handleClear}
            className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-4 py-1 text-xs text-black active:border-t-[#8f8f9d] active:border-l-[#8f8f9d]"
          >
            Clear
          </button>
        </div>

        {/* Sample Orders Queue */}
        <div className="border border-[#a0a0a0] flex-1 overflow-auto">
          <div className="bg-[#d4d0c8] px-2 py-1 font-bold text-black border-b border-[#a0a0a0] text-[11px]">
            Pending / Active Settlement Orders Queue
          </div>
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-[#f0f0f5] border-b border-[#a0a0a0] text-left">
                <th className="p-1.5 border-r border-[#a0a0a0]">Order Ref</th>
                <th className="p-1.5 border-r border-[#a0a0a0]">Order Type</th>
                <th className="p-1.5 border-r border-[#a0a0a0]">Client Name</th>
                <th className="p-1.5 border-r border-[#a0a0a0]">Currency</th>
                <th className="p-1.5 border-r border-[#a0a0a0]">Amount</th>
                <th className="p-1.5 border-r border-[#a0a0a0]">Value Date</th>
                <th className="p-1.5">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#e4e4e4] hover:bg-[#fafafa]">
                <td className="p-1.5 border-r border-[#e4e4e4] font-bold text-[#1e4676]">ORD-084201</td>
                <td className="p-1.5 border-r border-[#e4e4e4]">REMITTANCE ORDER</td>
                <td className="p-1.5 border-r border-[#e4e4e4] font-bold">IBRAHIM KALEEL N A</td>
                <td className="p-1.5 border-r border-[#e4e4e4] font-bold">INR</td>
                <td className="p-1.5 border-r border-[#e4e4e4] font-mono font-bold text-[#1e4676]">₹ 44,000.00</td>
                <td className="p-1.5 border-r border-[#e4e4e4]">2026-10-07</td>
                <td className="p-1.5 font-bold text-green-700">COMPLETED 👍</td>
              </tr>
              <tr className="border-b border-[#e4e4e4] hover:bg-[#fafafa]">
                <td className="p-1.5 border-r border-[#e4e4e4] font-bold text-[#1e4676]">ORD-084198</td>
                <td className="p-1.5 border-r border-[#e4e4e4]">AGENT COLLECTION</td>
                <td className="p-1.5 border-r border-[#e4e4e4] font-bold">AL-ANSARI EXCHANGE UAE</td>
                <td className="p-1.5 border-r border-[#e4e4e4] font-bold">AED</td>
                <td className="p-1.5 border-r border-[#e4e4e4] font-mono font-bold">12,500.00</td>
                <td className="p-1.5 border-r border-[#e4e4e4]">2026-10-06</td>
                <td className="p-1.5 font-bold text-blue-700">VERIFIED</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      {/* Success Modal */}
      {isSubmitted && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 shadow-2xl w-full max-w-lg flex flex-col" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            <div className="border border-[#8f8f9d] p-[2px] bg-[#f0f0f5]">
              <div className="border border-[#8f8f9d] bg-white p-4 flex items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-gradient-to-b from-[#4facfe] to-[#00f2fe] flex items-center justify-center text-white font-serif italic font-bold text-base shadow-sm border border-[#00a8ff]">
                  i
                </div>
                <div className="text-[12px] text-black">
                  <div className="font-bold text-[#1e4676]">Order {orderRef} Registered Successfully.</div>
                  <div>Client: <strong>{clientName}</strong> | Amount: {currency} {orderAmount}</div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                setIsSubmitted(false);
                handleClear();
              }}
              className="mt-3 self-start bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-4 py-1 text-xs font-bold text-black"
            >
              Ok
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
