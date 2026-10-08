import { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { Customer } from '../services/db';

export default function OrderEntryForm() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState('A-ADD');
  const [currency] = useState('INR');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currentAccount, setCurrentAccount] = useState({
    clientName: '',
    accountNumber: '',
    orderAmount: '',
    confirmOrderAmount: '',
    ifscCode: '',
    bankName: '',
    branchName: ''
  });

  const handleCurrentAccountChange = (field: keyof typeof currentAccount, value: string) => {
    const updated = { ...currentAccount, [field]: value };
    if (field === 'ifscCode') {
      if (value.length >= 4) {
        updated.bankName = 'STATE BANK OF INDIA';
        updated.branchName = 'MUMBAI MAIN BRANCH';
      } else {
        updated.bankName = '';
        updated.branchName = '';
      }
    }
    setCurrentAccount(updated);
  };

  const addAccount = () => {
    if (!currentAccount.clientName.trim() || !currentAccount.orderAmount) {
      alert("Please fill in Client Name and Order Amount before adding.");
      return;
    }
    setAccounts([...accounts, currentAccount]);
    setCurrentAccount({
      clientName: '',
      accountNumber: '',
      orderAmount: '',
      confirmOrderAmount: '',
      ifscCode: '',
      bankName: '',
      branchName: ''
    });
  };

  const removeAccount = (index: number) => {
    const newAccounts = [...accounts];
    newAccounts.splice(index, 1);
    setAccounts(newAccounts);
  };

  const editAccount = (index: number) => {
    const accToEdit = accounts[index];
    setCurrentAccount(accToEdit);
    removeAccount(index);
  };
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [agentOrCustomer, setAgentOrCustomer] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    setCustomers(dbService.getCustomers());
  }, []);

  const handleGo = () => {
    if (accounts.length === 0) {
      alert('Please add at least one account detail.');
      return;
    }
    const ref = `ORD-${Date.now().toString().slice(-6)}`;
    setOrderRef(ref);
    setIsSubmitted(true);
  };

  const handleClear = () => {
    setAccounts([]);
    setCurrentAccount({
      clientName: '',
      accountNumber: '',
      orderAmount: '',
      confirmOrderAmount: '',
      ifscCode: '',
      bankName: '',
      branchName: ''
    });
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
      <div className="flex-1 bg-white border border-[#a0a0a0] m-1 pr-3 pb-3 flex flex-col overflow-auto">
        
        {/* Navigator Bar */}
        <div className="flex items-center gap-2 px-2 py-1 bg-[#f8f9fa] border-y border-[#a0a0a0] text-[#1e4676] font-bold text-[11px] w-fit">
          <span className="cursor-pointer text-[14px] leading-none hover:text-[#0a244d]">↗</span>
          <div className="border-l-[2px] border-dotted border-[#8f8f9d] h-3"></div>
          <span 
            className="cursor-pointer hover:underline tracking-wide"
            onClick={() => setIsFormModalOpen(true)}
          >
            Add Order Entry
          </span>
          <div className="border-l-[2px] border-dotted border-[#8f8f9d] h-3"></div>
          <span className="cursor-pointer hover:underline tracking-wide">View Orders</span>
        </div>

        {isFormModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
            <div className="bg-white border-2 border-[#104080] shadow-2xl flex flex-col max-h-[90vh] max-w-5xl w-full">
              <div className="bg-[#eaf0f8] px-3 py-2 font-bold text-[#104080] border-b border-[#a2b5cd] text-[12px] flex items-center justify-between">
                <span>Custom Order Entry Form</span>
                <button onClick={() => setIsFormModalOpen(false)} className="text-red-600 font-bold hover:underline cursor-pointer">
                  Close (X)
                </button>
              </div>
              <div className="p-4 overflow-auto">

        {/* Function Box */}
        <div className="p-4 bg-[#eaf0f8] mb-4 w-fit min-w-[800px] text-[11px] ml-4">
          <div className="grid grid-cols-[170px_1fr_170px_1fr] gap-x-4 gap-y-3 items-center">
            
            <div className="font-bold text-black">
              Function Code <span className="text-red-600">*</span>
            </div>
            <div className="col-span-3">
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
              Value Execution Date
            </div>
            <div>
              <input 
                type="date" 
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-[240px] border border-[#7f9db9] h-[24px] px-1 text-[11px] focus:outline-none"
              />
            </div>

            <div className="font-bold text-black pl-4">
              Agent / Customer
            </div>
            <div>
              <input 
                type="text" 
                list="agent-customer-list"
                value={agentOrCustomer}
                onChange={(e) => setAgentOrCustomer(e.target.value)}
                placeholder="Select Agent or Customer"
                className="w-[320px] border border-[#7f9db9] h-[24px] px-1 text-[11px] uppercase focus:outline-none"
              />
              <datalist id="agent-customer-list">
                {customers.map((c) => (
                  <option key={c.id} value={`${c.name} (${c.id})`} />
                ))}
              </datalist>
            </div>

            <div className="font-bold text-black">
              Client / Beneficiary Name <span className="text-red-600">*</span>
            </div>
            <div>
              <input 
                type="text" 
                value={currentAccount.clientName}
                onChange={(e) => handleCurrentAccountChange('clientName', e.target.value)}
                placeholder="Enter client name"
                className="w-[320px] border border-[#7f9db9] h-[24px] px-1 text-[11px] uppercase focus:outline-none"
              />
            </div>

            <div className="font-bold text-black pl-4">
              Account Number <span className="text-red-600">*</span>
            </div>
            <div>
              <input 
                type="text" 
                value={currentAccount.accountNumber}
                onChange={(e) => handleCurrentAccountChange('accountNumber', e.target.value)}
                placeholder="Enter Account Number"
                className="w-[320px] border border-[#7f9db9] h-[24px] px-1 text-[11px] uppercase focus:outline-none"
              />
            </div>

            <div className="font-bold text-black">
              IFSC Code <span className="text-red-600">*</span>
            </div>
            <div>
              <input 
                type="text" 
                value={currentAccount.ifscCode}
                onChange={(e) => handleCurrentAccountChange('ifscCode', e.target.value)}
                placeholder="e.g. SBIN0000001"
                className="w-[200px] border border-[#7f9db9] h-[24px] px-1 text-[11px] uppercase focus:outline-none"
              />
            </div>

            <div className="font-bold text-black pl-4">
              Bank Name
            </div>
            <div>
              <input 
                type="text" 
                value={currentAccount.bankName}
                readOnly
                placeholder="Auto-filled Bank Name"
                className="w-[320px] border border-[#7f9db9] h-[24px] px-1 text-[11px] bg-[#f0f0f0] uppercase focus:outline-none"
              />
            </div>

            <div className="font-bold text-black">
              Branch Name
            </div>
            <div className="col-span-3">
              <input 
                type="text" 
                value={currentAccount.branchName}
                readOnly
                placeholder="Auto-filled Branch Name"
                className="w-[320px] border border-[#7f9db9] h-[24px] px-1 text-[11px] bg-[#f0f0f0] uppercase focus:outline-none"
              />
            </div>

            <div className="font-bold text-black">
              Order Amount (INR) <span className="text-red-600">*</span>
            </div>
            <div>
              <input 
                type="number" 
                value={currentAccount.orderAmount}
                onChange={(e) => handleCurrentAccountChange('orderAmount', e.target.value)}
                placeholder="Order Amount (₹)"
                className="w-[200px] border border-[#7f9db9] h-[24px] px-2 text-[12px] font-bold text-[#1e4676] focus:outline-none"
              />
            </div>
            
            <div className="font-bold text-black pl-4">
              Confirm Order Amount (INR) <span className="text-red-600">*</span>
            </div>
            <div>
              <input 
                type="number" 
                value={currentAccount.confirmOrderAmount}
                onChange={(e) => handleCurrentAccountChange('confirmOrderAmount', e.target.value)}
                placeholder="Confirm Order Amount (₹)"
                className="w-[200px] border border-[#7f9db9] h-[24px] px-2 text-[12px] font-bold text-[#1e4676] focus:outline-none"
              />
            </div>

            <div className="col-span-4 flex mt-2">
              <button 
                type="button" 
                onClick={addAccount}
                className="bg-[#eaf0f8] border-2 border-[#316ac5] hover:bg-[#d4e4fc] px-4 py-1 text-xs text-black font-bold active:bg-[#c4d4ec]"
              >
                + Add Account
              </button>
            </div>

            {accounts.length > 0 && (
              <div className="col-span-4 mt-4">
                <div className="font-bold text-[#1e4676] mb-2">Added Accounts ({accounts.length})</div>
                <div className="border border-[#7f9db9] overflow-hidden">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-[#f0f0f5] border-b border-[#7f9db9]">
                      <tr>
                        <th className="p-1.5 border-r border-[#7f9db9]">Client Name</th>
                        <th className="p-1.5 border-r border-[#7f9db9]">Account Number</th>
                        <th className="p-1.5 border-r border-[#7f9db9]">Amount</th>
                        <th className="p-1.5 border-r border-[#7f9db9]">Bank (IFSC)</th>
                        <th className="p-1.5 border-r border-[#7f9db9]">Branch</th>
                        <th className="p-1.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((acc, idx) => (
                        <tr key={idx} className="border-b border-[#e4e4e4] last:border-0 hover:bg-[#fafafa] bg-white">
                          <td className="p-1.5 border-r border-[#e4e4e4]">{acc.clientName}</td>
                          <td className="p-1.5 border-r border-[#e4e4e4]">{acc.accountNumber}</td>
                          <td className="p-1.5 border-r border-[#e4e4e4]">₹{acc.orderAmount}</td>
                          <td className="p-1.5 border-r border-[#e4e4e4]">{acc.bankName} ({acc.ifscCode})</td>
                          <td className="p-1.5 border-r border-[#e4e4e4]">{acc.branchName}</td>
                          <td className="p-1.5 text-center flex items-center justify-center gap-3">
                            <button 
                              type="button" 
                              onClick={() => editAccount(idx)} 
                              className="text-[#316ac5] hover:underline font-bold"
                            >
                              Edit
                            </button>
                            <button 
                              type="button" 
                              onClick={() => removeAccount(idx)} 
                              className="text-red-600 hover:underline font-bold"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mb-4 ml-4">
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
              </div>
            </div>
          </div>
        )}


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
                  <div>Client: <strong>{accounts[0]?.clientName}</strong> | Amount: {currency} {accounts[0]?.orderAmount}</div>
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
