import { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import api from '../services/api';
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

  const handleGo = async () => {
    if (accounts.length === 0) {
      alert('Please add at least one account detail.');
      return;
    }
    
    // Using the first account for the API call for simplicity since the API schema only supports one account_id
    const primaryAccount = accounts[0];
    
    const apiPayload = {
      buyer_id: agentOrCustomer || "Unknown",
      txn: "ORDER", 
      order_date: new Date().toISOString().split('T')[0],
      aed_amount: parseFloat(primaryAccount.orderAmount) || 0,
      account_id: primaryAccount.accountNumber,
      sale_rate: 1, // default
      cost_rate: 1, // default
      usdt_amount: 0, // default
      inr_per_usdt: 0, // default
      note: "Multiple accounts included"
    };

    try {
      await api.post('/records/orders', apiPayload);
      const ref = `ORD-${Date.now().toString().slice(-6)}`;
      setOrderRef(ref);
      setIsSubmitted(true);
    } catch (err: any) {
      alert('Error submitting order to server: ' + (err.response?.data?.message || err.message));
    }
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
          <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
            <div className="bg-white shadow-2xl flex flex-col max-h-[90vh] max-w-6xl w-full rounded-md overflow-hidden">
              <div className="bg-[#eef2f9] px-6 py-4 font-bold text-black border-b border-[#c4d4ec] text-[16px] flex items-center justify-between">
                <span>Custom Order Entry Form</span>
                <button onClick={() => setIsFormModalOpen(false)} className="text-[#a51a1a] font-bold hover:underline cursor-pointer text-[14px]">
                  Close (X)
                </button>
              </div>
              <div className="p-8 overflow-auto bg-white flex flex-col gap-6">

                <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-12 gap-y-0 text-[13px]">
                  
                  {/* First Box Section */}
                  <div className="col-span-4 grid grid-cols-subgrid gap-y-5 bg-[#eaf0f8] border border-[#c4d4ec] rounded-md py-6 px-6 -mx-6 mb-6">
                    
                    <div className="font-medium text-black whitespace-nowrap">
                      Function Code <span className="text-red-600">*</span>
                    </div>
                    <div className="col-span-3">
                      <select 
                        value={selectedFunction}
                        onChange={(e) => setSelectedFunction(e.target.value)}
                        className="w-[240px] border border-[#c4d4ec] bg-white text-black rounded-md focus:outline-none h-[36px] px-2"
                      >
                        <option value="A-ADD">A-ADD (New Order Booking)</option>
                        <option value="V-VIEW">V-VIEW (Order Inquiry)</option>
                        <option value="M-MODIFY">M-MODIFY (Amend Order)</option>
                        <option value="X-CANCEL">X-CANCEL (Cancel Order)</option>
                      </select>
                    </div>

                    <div className="font-medium text-black whitespace-nowrap">
                      Value Execution Date
                    </div>
                    <div>
                      <input 
                        type="date" 
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="w-[240px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white focus:outline-none"
                      />
                    </div>

                    <div className="font-medium text-black whitespace-nowrap">
                      Agent / Customer
                    </div>
                    <div>
                      <input 
                        type="text" 
                        list="agent-customer-list"
                        value={agentOrCustomer}
                        onChange={(e) => setAgentOrCustomer(e.target.value)}
                        placeholder="SELECT AGENT OR CUSTOMER"
                        className="w-[100%] max-w-[400px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none"
                      />
                      <datalist id="agent-customer-list">
                        {customers.map((c) => (
                          <option key={c.id} value={`${c.name} (${c.id})`} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Second Box Section */}
                  <div className="col-span-4 grid grid-cols-subgrid gap-y-5 bg-[#eaf0f8] border border-[#c4d4ec] rounded-md py-6 px-6 -mx-6 relative">
                    <div className="absolute top-[-1px] left-[-1px] bg-[#1a4a8c] text-white text-[11px] font-medium px-3 py-1 rounded-tl-md rounded-br-md">Beneficiary Bank Details</div>
                    
                    <div className="font-medium text-black whitespace-nowrap mt-4">
                      Client / Beneficiary Name <span className="text-red-600">*</span>
                    </div>
                    <div className="mt-4">
                      <input 
                        type="text" 
                        value={currentAccount.clientName}
                        onChange={(e) => handleCurrentAccountChange('clientName', e.target.value)}
                        placeholder="ENTER CLIENT NAME"
                        className="w-[100%] max-w-[400px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none"
                      />
                    </div>

                    <div className="font-medium text-black whitespace-nowrap mt-4">
                      Account Number <span className="text-red-600">*</span>
                    </div>
                    <div className="mt-4">
                      <input 
                        type="text" 
                        value={currentAccount.accountNumber}
                        onChange={(e) => handleCurrentAccountChange('accountNumber', e.target.value)}
                        placeholder="ENTER ACCOUNT NUMBER"
                        className="w-[100%] max-w-[400px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none"
                      />
                    </div>

                    <div className="font-medium text-black whitespace-nowrap">
                      IFSC Code <span className="text-red-600">*</span>
                    </div>
                    <div>
                      <input 
                        type="text" 
                        value={currentAccount.ifscCode}
                        onChange={(e) => handleCurrentAccountChange('ifscCode', e.target.value)}
                        placeholder="E.G. SBIN0000001"
                        className="w-[240px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none"
                      />
                    </div>

                    <div className="font-medium text-black whitespace-nowrap">
                      Bank Name
                    </div>
                    <div>
                      <input 
                        type="text" 
                        value={currentAccount.bankName}
                        readOnly
                        placeholder="AUTO-FILLED BANK NAME"
                        className="w-[100%] max-w-[400px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-[#ebe9e1] uppercase focus:outline-none"
                      />
                    </div>

                    <div className="font-medium text-black whitespace-nowrap">
                      Branch Name
                    </div>
                    <div className="col-span-3">
                      <input 
                        type="text" 
                        value={currentAccount.branchName}
                        readOnly
                        placeholder="AUTO-FILLED BRANCH NAME"
                        className="w-[100%] max-w-[400px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-[#ebe9e1] uppercase focus:outline-none"
                      />
                    </div>

                    <div className="font-medium text-black whitespace-nowrap">
                      Order Amount (INR) <span className="text-red-600">*</span>
                    </div>
                    <div>
                      <input 
                        type="number" 
                        value={currentAccount.orderAmount}
                        onChange={(e) => handleCurrentAccountChange('orderAmount', e.target.value)}
                        placeholder="Order Amount (₹)"
                        className="w-[240px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white focus:outline-none"
                      />
                    </div>
                    
                    <div className="font-medium text-black whitespace-nowrap">
                      Confirm Order Amount (INR) <span className="text-red-600">*</span>
                    </div>
                    <div>
                      <input 
                        type="number" 
                        value={currentAccount.confirmOrderAmount}
                        onChange={(e) => handleCurrentAccountChange('confirmOrderAmount', e.target.value)}
                        placeholder="Confirm Order Amount (₹)"
                        className="w-[240px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white focus:outline-none"
                      />
                    </div>

                    <div className="col-span-4 border-t border-[#c4d4ec] pt-6 flex mt-2">
                      <button 
                        type="button" 
                        onClick={addAccount}
                        className="bg-transparent border border-[#1a4a8c] text-[#1a4a8c] hover:bg-white px-4 py-2 rounded-md font-medium flex items-center gap-2"
                      >
                        + Add Account
                      </button>
                    </div>
                  </div>
                </div>

                {accounts.length > 0 && (
                  <div className="mt-2">
                    <div className="font-medium text-[#1e4676] mb-2 text-[14px]">Added Accounts ({accounts.length})</div>
                    <div className="border border-[#c4d4ec] rounded-md overflow-hidden">
                      <table className="w-full text-left text-[13px] border-collapse">
                        <thead className="bg-[#eef2f9] border-b border-[#c4d4ec]">
                          <tr>
                            <th className="p-3 font-medium text-black">Client Name</th>
                            <th className="p-3 font-medium text-black">Account Number</th>
                            <th className="p-3 font-medium text-black">Amount</th>
                            <th className="p-3 font-medium text-black">Bank (IFSC)</th>
                            <th className="p-3 font-medium text-black">Branch</th>
                            <th className="p-3 font-medium text-black text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.map((acc, idx) => (
                            <tr key={idx} className="border-b border-[#e4e4e4] last:border-0 hover:bg-[#f9fafc] bg-white">
                              <td className="p-3 border-r border-[#e4e4e4]">{acc.clientName}</td>
                              <td className="p-3 border-r border-[#e4e4e4]">{acc.accountNumber}</td>
                              <td className="p-3 border-r border-[#e4e4e4]">₹{acc.orderAmount}</td>
                              <td className="p-3 border-r border-[#e4e4e4]">{acc.bankName} ({acc.ifscCode})</td>
                              <td className="p-3 border-r border-[#e4e4e4]">{acc.branchName}</td>
                              <td className="p-3 text-center flex items-center justify-center gap-4">
                                <button 
                                  type="button" 
                                  onClick={() => editAccount(idx)} 
                                  className="text-[#1a4a8c] hover:underline font-medium"
                                >
                                  Edit
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => removeAccount(idx)} 
                                  className="text-red-600 hover:underline font-medium"
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

                {/* Buttons */}
                <div className="flex gap-4 mt-2">
                  <button 
                    onClick={handleGo}
                    className="bg-[#1a4a8c] text-white rounded-md px-6 py-2 shadow-sm font-medium hover:bg-[#153970]"
                  >
                    Create Order (Go)
                  </button>
                  <button 
                    onClick={handleClear}
                    className="bg-white border border-[#c4d4ec] text-[#1a4a8c] rounded-md px-6 py-2 font-medium shadow-sm hover:bg-[#f4f7fb]"
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
