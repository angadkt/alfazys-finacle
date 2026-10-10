import { useState, useEffect } from 'react';
import api from '../services/api';

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

  const handleCurrentAccountChange = async (field: keyof typeof currentAccount, value: string) => {
    let updated = { ...currentAccount, [field]: value };
    
    if (field === 'ifscCode') {
      // IFSC is always 11 characters long
      if (value.length === 11) {
        try {
          const res = await fetch(`https://ifsc.razorpay.com/${value}`);
          if (res.ok) {
            const data = await res.json();
            updated = {
              ...updated,
              bankName: data.BANK || 'UNKNOWN BANK',
              branchName: data.BRANCH || 'UNKNOWN BRANCH'
            };
          } else {
            updated = { ...updated, bankName: 'INVALID IFSC', branchName: 'INVALID IFSC' };
          }
        } catch (e) {
          console.error(e);
          updated = { ...updated, bankName: 'ERROR FETCHING', branchName: 'ERROR FETCHING' };
        }
      } else {
        updated = { ...updated, bankName: '', branchName: '' };
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
  const [customers, setCustomers] = useState<any[]>([]);

  // View Orders State
  const [fetchedOrders, setFetchedOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async (page = currentPage, search = searchQuery) => {
    setLoadingOrders(true);
    try {
      const res = await api.get(`/records/orders?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
      setFetchedOrders(res.data.records || []);
      setCurrentPage(res.data.page || 1);
      setTotalPages(Math.ceil((res.data.total || 0) / (res.data.limit || 20)) || 1);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await api.get('/records/parties');
        const verified = res.data.records.filter((c: any) => c.status === 'verified');
        const formatted = verified.map((c: any) => ({
          id: c.cif_no || c.id,
          internal_id: c.id,
          name: `${c.first_name} ${c.last_name}`.trim() || 'UNKNOWN'
        }));
        setCustomers(formatted);
      } catch (err) {
        console.error('Failed to load customers:', err);
      }
    };
    loadCustomers();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchOrders(currentPage, searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery, currentPage]);

  const handleGo = async () => {
    if (accounts.length === 0) {
      alert('Please add at least one account detail.');
      return;
    }
    
    const selectedCustomer = customers.find(c => `${c.name} (${c.id})` === agentOrCustomer);
    const party_id = selectedCustomer ? selectedCustomer.internal_id : parseInt(agentOrCustomer);

    const apiPayload = {
      party_id: party_id || null,
      buyer_id: null, // Servicer is unassigned initially 
      txn: "gateway", 
      order_date: new Date().toISOString().split('T')[0],
      account_id: null,
      accounts: accounts, // Send all beneficiary accounts array!
      note: "Order marking the sale yet to happen"
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
            onClick={() => { setIsFormModalOpen(true); }}
          >
            Add Order Entry
          </span>
          <div className="border-l-[2px] border-dotted border-[#8f8f9d] h-3"></div>
          <span 
            className="cursor-pointer hover:underline tracking-wide"
            onClick={() => { fetchOrders(currentPage, searchQuery); }}
          >
            Refresh Orders
          </span>
        </div>

        <div className="p-4 bg-white overflow-auto flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#1e4676]">Fetched Orders List</h3>
              <input 
                type="text" 
                placeholder="Search orders by ID, Agent, Client or Account..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-[#c4d4ec] px-3 py-1 rounded-md text-xs focus:outline-none focus:border-[#1e4676] w-72"
              />
            </div>
            {loadingOrders ? (
              <div className="text-gray-500">Loading orders...</div>
            ) : (
              <>
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#1e4676] text-white">
                    <th className="p-2 border border-[#a0a0a0]">Order No</th>
                    <th className="p-2 border border-[#a0a0a0]">Date</th>
                    <th className="p-2 border border-[#a0a0a0]">Agent/Customer</th>
                    <th className="p-2 border border-[#a0a0a0]">Beneficiary Name</th>
                    <th className="p-2 border border-[#a0a0a0]">Beneficiary Account</th>
                    <th className="p-2 border border-[#a0a0a0]">Sale Rate</th>
                    <th className="p-2 border border-[#a0a0a0]">AED Amount</th>
                    <th className="p-2 border border-[#a0a0a0]">INR Value</th>
                    <th className="p-2 border border-[#a0a0a0]">Issued By</th>
                    <th className="p-2 border border-[#a0a0a0]">Verified By</th>
                    <th className="p-2 border border-[#a0a0a0]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fetchedOrders.length > 0 ? fetchedOrders.map((o: any) => {
                    let recs = o.receivers_data;
                    if (typeof recs === 'string') {
                      try { recs = JSON.parse(recs); } catch { recs = []; }
                    }
                    const hasMultiple = Array.isArray(recs) && recs.length > 0;
                    
                    return (
                      <tr key={o.id} className="hover:bg-[#f0f4f8]">
                        <td className="p-2 border border-[#c4d4ec] font-bold text-blue-800">{o.order_no}</td>
                        <td className="p-2 border border-[#c4d4ec]">{(o.order_date || '').split('T')[0]}</td>
                        <td className="p-2 border border-[#c4d4ec]">{o.party_name || o.party_id || 'N/A'}</td>
                        <td className="p-2 border border-[#c4d4ec]">
                          {hasMultiple ? recs.map((acc: any, idx: number) => (
                            <div key={idx} className={idx > 0 ? "border-t border-dashed border-[#c4d4ec] mt-1 pt-1" : ""}>
                              {acc.clientName || '-'}
                            </div>
                          )) : o.receiver_name}
                        </td>
                        <td className="p-2 border border-[#c4d4ec]">
                          {hasMultiple ? recs.map((acc: any, idx: number) => (
                            <div key={idx} className={idx > 0 ? "border-t border-dashed border-[#c4d4ec] mt-1 pt-1" : ""}>
                              {acc.accountNumber || '-'} <span className="text-gray-500 text-[10px]">({acc.bankName || 'N/A'})</span>
                            </div>
                          )) : o.receiver_account}
                        </td>
                        <td className="p-2 border border-[#c4d4ec]">
                          {hasMultiple ? recs.map((acc: any, idx: number) => (
                            <div key={idx} className={idx > 0 ? "border-t border-dashed border-[#c4d4ec] mt-1 pt-1" : ""}>
                              {acc.confirmOrderAmount || o.sale_rate || '-'}
                            </div>
                          )) : (o.sale_rate || '-')}
                        </td>
                        <td className="p-2 border border-[#c4d4ec] font-medium text-emerald-700">
                          {hasMultiple && recs.length > 1 ? (
                            <>
                              <div className="font-bold text-emerald-800 mb-1">Total: {o.aed_amount ? parseFloat(o.aed_amount).toFixed(2) : '-'}</div>
                              {recs.map((acc: any, idx: number) => {
                                const aed = acc.orderAmount && acc.confirmOrderAmount 
                                  ? (parseFloat(acc.orderAmount) / parseFloat(acc.confirmOrderAmount)).toFixed(2)
                                  : '-';
                                return (
                                  <div key={idx} className="text-emerald-700 text-[10px] border-t border-dashed border-[#c4d4ec] pt-1 mt-1">
                                    {aed}
                                  </div>
                                );
                              })}
                            </>
                          ) : (
                            <>{o.aed_amount ? parseFloat(o.aed_amount).toFixed(2) : '-'}</>
                          )}
                        </td>
                        <td className="p-2 border border-[#c4d4ec] font-medium">
                          {hasMultiple && recs.length > 1 ? (
                            <>
                              <div className="font-bold text-black mb-1">Total: ₹ {o.inr_value}</div>
                              {recs.map((acc: any, idx: number) => (
                                <div key={idx} className="text-gray-600 text-[10px] border-t border-dashed border-[#c4d4ec] pt-1 mt-1">
                                  ₹ {acc.orderAmount}
                                </div>
                              ))}
                            </>
                          ) : (
                            <>₹ {o.inr_value}</>
                          )}
                        </td>
                        <td className="p-2 border border-[#c4d4ec]">{o.created_by_name || '-'}</td>
                        <td className="p-2 border border-[#c4d4ec]">{o.verified_by_name || '-'}</td>
                        <td className="p-2 border border-[#c4d4ec]">
                          <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${
                            o.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={11} className="p-4 text-center text-gray-500 italic border border-[#c4d4ec]">No orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {!loadingOrders && totalPages > 1 && (
                <div className="flex items-center justify-end gap-4 mt-4 text-[12px] text-[#1e4676]">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="disabled:opacity-50 hover:underline font-bold"
                  >
                    &laquo; Previous
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => Math.max(1, Math.min(totalPages, p + 1)))}
                    className="disabled:opacity-50 hover:underline font-bold"
                  >
                    Next &raquo;
                  </button>
                </div>
              )}
              </>
            )}
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
                        autoComplete="off"
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
                      Confirmed INR <span className="text-red-600">*</span>
                    </div>
                    <div>
                      <input 
                        type="number" 
                        value={currentAccount.orderAmount}
                        onChange={(e) => handleCurrentAccountChange('orderAmount', e.target.value)}
                        placeholder="Confirmed INR"
                        className="w-[240px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white focus:outline-none"
                      />
                    </div>
                    
                    <div className="font-medium text-black whitespace-nowrap">
                      Sale Rate (AED) <span className="text-red-600">*</span>
                    </div>
                    <div>
                      <input 
                        type="number" 
                        value={currentAccount.confirmOrderAmount}
                        onChange={(e) => handleCurrentAccountChange('confirmOrderAmount', e.target.value)}
                        placeholder="Sale Rate (AED)"
                        className="w-[240px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white focus:outline-none"
                      />
                    </div>

                    <div className="font-medium text-black whitespace-nowrap">
                      Confirmed AED
                    </div>
                    <div>
                      <input 
                        type="text" 
                        value={
                          currentAccount.orderAmount && currentAccount.confirmOrderAmount && parseFloat(currentAccount.confirmOrderAmount) !== 0
                            ? (parseFloat(currentAccount.orderAmount) / parseFloat(currentAccount.confirmOrderAmount)).toFixed(2)
                            : ''
                        }
                        readOnly
                        placeholder="Confirmed AED"
                        className="w-[240px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-[#ebe9e1] focus:outline-none"
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
