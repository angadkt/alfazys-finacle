import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { exportOrdersToExcel, exportOrdersToPdf } from '../utils/exportOrders';

export default function OrderEntryForm() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState('A-ADD');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currentAccount, setCurrentAccount] = useState({
    clientName: '',
    accountNumber: '',
    orderAmount: '',
    confirmOrderAmount: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    servicer: ''
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
      branchName: '',
      servicer: ''
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
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState('');
  const [agentOrCustomer, setAgentOrCustomer] = useState('');
  const [transactionThrough, setTransactionThrough] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);

  const activeRole = localStorage.getItem('infazys_finacle_active_role');
  const isAdmin = activeRole === 'super_admin' || activeRole === 'admin';

  // View Orders State
  const [fetchedOrders, setFetchedOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null);
  const [isReceivedAedModalOpen, setIsReceivedAedModalOpen] = useState(false);
  const [receivedAedAmount, setReceivedAedAmount] = useState('');
  const [collectedAed, setCollectedAed] = useState('');
  const [modeOfTransaction, setModeOfTransaction] = useState('');
  const [collectionStaff, setCollectionStaff] = useState('');
  const [remainingAed, setRemainingAed] = useState('');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));

  // View Received AED
  const [isViewReceivedAedOpen, setIsViewReceivedAedOpen] = useState(false);
  const [receivedAedRecords, setReceivedAedRecords] = useState<any[]>([]);
  const [receivedAedTotal, setReceivedAedTotal] = useState(0);
  const [receivedAedPage, setReceivedAedPage] = useState(1);
  const [receivedAedLoading, setReceivedAedLoading] = useState(false);
  const [viewDateFilter, setViewDateFilter] = useState('');
  const [viewModeFilter, setViewModeFilter] = useState('');

  const fetchReceivedAed = async (page = 1, date = viewDateFilter, mode = viewModeFilter) => {
    setReceivedAedLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 50 };
      if (date) params.date = date;
      if (mode) params.mode_of_txn = mode;
      const res = await api.get('/records/received-aed', { params });
      setReceivedAedRecords(res.data.records);
      setReceivedAedTotal(res.data.total);
      setReceivedAedPage(page);
    } catch { /* silent */ } finally {
      setReceivedAedLoading(false);
    }
  };

  // Dynamic summary calculations for filtered orders
  const { 
    totalAed, 
    clearedAed, 
    unclearedAed, 
    totalInr, 
    clearedInr, 
    unclearedInr, 
    orderCount,
    clearedOrderCount,
    unclearedOrderCount
  } = useMemo(() => {
    let aedSum = 0;
    let clearedAedSum = 0;
    let unclearedAedSum = 0;

    let inrSum = 0;
    let clearedInrSum = 0;
    let unclearedInrSum = 0;

    let clearedCount = 0;
    let unclearedCount = 0;

    for (const o of fetchedOrders) {
      if (!o) continue;

      const isPaid = (o.payment_status || '').toLowerCase() === 'paid';
      if (isPaid) {
        clearedCount++;
      } else {
        unclearedCount++;
      }

      // Safe numeric calculation for AED amount
      let aed = 0;
      if (o.aed_amount !== undefined && o.aed_amount !== null && o.aed_amount !== '') {
        const parsed = typeof o.aed_amount === 'number' ? o.aed_amount : parseFloat(String(o.aed_amount).replace(/,/g, ''));
        if (!isNaN(parsed) && isFinite(parsed)) {
          aed = parsed;
        }
      }
      if (aed === 0 && o.receivers_data) {
        let recs = o.receivers_data;
        if (typeof recs === 'string') {
          try { recs = JSON.parse(recs); } catch { recs = []; }
        }
        if (Array.isArray(recs) && recs.length > 0) {
          aed = recs.reduce((sum: number, acc: any) => {
            const amt = parseFloat(String(acc?.orderAmount || '').replace(/,/g, ''));
            const rate = parseFloat(String(acc?.confirmOrderAmount || '').replace(/,/g, ''));
            if (!isNaN(amt) && !isNaN(rate) && rate > 0) {
              return sum + (amt / rate);
            }
            return sum;
          }, 0);
        }
      }
      aedSum += aed;
      if (isPaid) {
        clearedAedSum += aed;
      } else {
        unclearedAedSum += aed;
      }

      // Safe numeric calculation for INR value
      let inr = 0;
      if (o.inr_value !== undefined && o.inr_value !== null && o.inr_value !== '') {
        const parsed = typeof o.inr_value === 'number' ? o.inr_value : parseFloat(String(o.inr_value).replace(/,/g, ''));
        if (!isNaN(parsed) && isFinite(parsed)) {
          inr = parsed;
        }
      }
      if (inr === 0 && o.receivers_data) {
        let recs = o.receivers_data;
        if (typeof recs === 'string') {
          try { recs = JSON.parse(recs); } catch { recs = []; }
        }
        if (Array.isArray(recs) && recs.length > 0) {
          inr = recs.reduce((sum: number, acc: any) => {
            const amt = parseFloat(String(acc?.orderAmount || '').replace(/,/g, ''));
            return !isNaN(amt) && isFinite(amt) ? sum + amt : sum;
          }, 0);
        }
      }
      inrSum += inr;
      if (isPaid) {
        clearedInrSum += inr;
      } else {
        unclearedInrSum += inr;
      }
    }

    return {
      totalAed: aedSum,
      clearedAed: clearedAedSum,
      unclearedAed: unclearedAedSum,
      totalInr: inrSum,
      clearedInr: clearedInrSum,
      unclearedInr: unclearedInrSum,
      orderCount: fetchedOrders.length,
      clearedOrderCount: clearedCount,
      unclearedOrderCount: unclearedCount
    };
  }, [fetchedOrders]);

  const fetchOrders = async (
    page = currentPage, 
    search = searchQuery,
    date = filterDate,
    agent = filterAgent
  ) => {
    setLoadingOrders(true);
    try {
      let url = `/records/orders?page=${page}&limit=20&search=${encodeURIComponent(search)}`;
      if (date) url += `&date=${encodeURIComponent(date)}`;
      if (agent) url += `&party_id=${encodeURIComponent(agent)}`;

      const res = await api.get(url);
      let records = res.data.records || [];

      // Fallback client-side filter
      if (date) {
        records = records.filter((o: any) => (o.order_date || '').startsWith(date));
      }
      if (agent) {
        records = records.filter((o: any) => String(o.party_id) === String(agent));
      }

      setFetchedOrders(records);
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
      fetchOrders(currentPage, searchQuery, filterDate, filterAgent);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery, filterDate, filterAgent, currentPage]);

  const handleReceiverPaymentStatus = async (orderId: string, receiverIndex: number, newStatus: string) => {
    try {
      const res = await api.patch(`/records/orders/${orderId}/receiver/${receiverIndex}`, { payment_status: newStatus });
      const updatedRecord = res.data.record;
      // Update local state with fresh record from server (includes updated receivers_data + aggregate payment_status)
      setFetchedOrders(prev => prev.map(item =>
        item.id === updatedRecord.id ? { ...item, ...updatedRecord } : item
      ));
    } catch (err: any) {
      alert('Failed to update receiver payment status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm(`Are you sure you want to permanently delete Order ${id}?`)) {
      try {
        await api.delete(`/records/orders/${id}`);
        fetchOrders(currentPage, searchQuery);
      } catch (err: any) {
        alert('Error deleting order: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleEditOrder = (o: any) => {
    setEditingOrderId(o.id);
    let recs = o.receivers_data;
    if (typeof recs === 'string') {
      try { recs = JSON.parse(recs); } catch { recs = []; }
    }
    setAccounts(Array.isArray(recs) ? recs : []);
    
    if (o.party_name && o.party_id) {
       setAgentOrCustomer(`${o.party_name} (${o.party_id})`);
    } else {
       setAgentOrCustomer(o.party_id ? String(o.party_id) : '');
    }
    
    setTransactionThrough(o.transaction_through || '');
    setSelectedFunction('A-ADD');
    setIsFormModalOpen(true);
  };

  const handleGo = async () => {
    if (isSubmitting) return;
    if (accounts.length === 0) {
      alert('Please add at least one account detail.');
      return;
    }
    
    const selectedCustomer = customers.find(c => `${c.name} (${c.id})` === agentOrCustomer);
    const party_id = selectedCustomer ? selectedCustomer.internal_id : parseInt(agentOrCustomer);

    const apiPayload = {
      party_id: party_id || null,
      buyer_id: null, 
      txn: "gateway", 
      order_date: new Date().toISOString().split('T')[0],
      account_id: null,
      transaction_through: transactionThrough.trim() || null,
      payment_status: "Pending",
      accounts: accounts,
      note: "Order marking the sale yet to happen"
    };

    setIsSubmitting(true);
    try {
      if (editingOrderId) {
        await api.put(`/records/orders/${editingOrderId}`, apiPayload);
        setEditingOrderId(null);
        fetchOrders(currentPage, searchQuery);
        setIsFormModalOpen(false);
      } else {
        await api.post('/records/orders', apiPayload);
        const ref = `ORD-${Date.now().toString().slice(-6)}`;
        setOrderRef(ref);
        setIsFormModalOpen(false);
        setIsSubmitted(true);
        fetchOrders(1, searchQuery);
      }
    } catch (err: any) {
      alert('Error submitting order to server: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
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
      branchName: '',
      servicer: ''
    });
    setTransactionThrough('');
    setSelectedFunction('A-ADD');
    setEditingOrderId(null);
  };

  const getOrdersForExport = async () => {
    try {
      let page = 1;
      let allRecords: any[] = [];
      let totalRecords = 0;
      let calculatedTotalPages = 1;

      do {
        let url = `/records/orders?page=${page}&limit=100&export=true&search=${encodeURIComponent(searchQuery)}`;
        if (filterDate) url += `&date=${encodeURIComponent(filterDate)}`;
        if (filterAgent) url += `&party_id=${encodeURIComponent(filterAgent)}`;

        const res = await api.get(url);
        const batch = res.data.records || [];
        totalRecords = res.data.total || batch.length;
        calculatedTotalPages = Math.ceil(totalRecords / (res.data.limit || 100)) || 1;

        allRecords.push(...batch);
        page++;
      } while (page <= calculatedTotalPages && allRecords.length < totalRecords);

      if (allRecords.length === 0 && fetchedOrders.length > 0) {
        return fetchedOrders;
      }

      // Ensure active date and agent filters are matched
      if (filterDate) {
        allRecords = allRecords.filter((o: any) => (o.order_date || '').startsWith(filterDate));
      }
      if (filterAgent) {
        allRecords = allRecords.filter((o: any) => String(o.party_id) === String(filterAgent));
      }

      return allRecords.length > 0 ? allRecords : fetchedOrders;
    } catch (err) {
      console.error('Export fetch error, using current view:', err);
      return fetchedOrders;
    }
  };

  const handleDownloadExcel = async () => {
    if (fetchedOrders.length === 0) {
      alert('No orders available to export.');
      return;
    }
    setIsExporting('excel');
    try {
      const orders = await getOrdersForExport();
      const selectedCustomer = customers.find(c => String(c.internal_id) === String(filterAgent));
      exportOrdersToExcel(orders, {
        filterDate,
        filterAgent: selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.id})` : filterAgent,
        searchQuery
      });
    } catch (err: any) {
      alert('Failed to generate Excel file: ' + err.message);
    } finally {
      setIsExporting(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (fetchedOrders.length === 0) {
      alert('No orders available to export.');
      return;
    }
    setIsExporting('pdf');
    try {
      const orders = await getOrdersForExport();
      const selectedCustomer = customers.find(c => String(c.internal_id) === String(filterAgent));
      exportOrdersToPdf(orders, {
        filterDate,
        filterAgent: selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.id})` : filterAgent,
        searchQuery
      });
    } catch (err: any) {
      alert('Failed to generate PDF file: ' + err.message);
    } finally {
      setIsExporting(null);
    }
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
            className="border border-[#7f9db9] bg-white text-black px-1 pr-6 h-[22px] text-[11px]"
          >
            <option value="A-ADD">A-ADD (Create New Order)</option>
            <option value="V-VIEW">V-VIEW (Inquire Orders)</option>
            <option value="M-MODIFY">M-MODIFY (Update Order)</option>
            <option value="X-CANCEL">X-CANCEL (Void Order)</option>
          </select>
        </div>
      </div>

      {/* Main Workspace Area under Header Bar */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
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
          <div className="border-l-[2px] border-dotted border-[#8f8f9d] h-3"></div>
          <span
            className="cursor-pointer hover:underline tracking-wide"
            onClick={() => setIsReceivedAedModalOpen(true)}
          >
            Received AED
          </span>
          <div className="border-l-[2px] border-dotted border-[#8f8f9d] h-3"></div>
          <span
            className="cursor-pointer hover:underline tracking-wide"
            onClick={() => { setIsViewReceivedAedOpen(true); fetchReceivedAed(1, viewDateFilter, viewModeFilter); }}
          >
            View Received AED
          </span>
        </div>

        <div className="p-4 bg-white overflow-auto flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-bold text-[#1e4676] text-sm tracking-wide">Fetched Orders List</h3>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Date Filter */}
                <div className="flex items-center gap-1.5 bg-[#f0f4f8] border border-[#c4d4ec] px-2.5 py-1 rounded">
                  <span className="text-[#1e4676] font-bold text-[11px]">Date:</span>
                  <input 
                    type="date"
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-[#c4d4ec] rounded px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none focus:border-[#1e4676]"
                  />
                  {filterDate && (
                    <button 
                      onClick={() => { setFilterDate(''); setCurrentPage(1); }}
                      className="text-gray-400 hover:text-red-500 font-bold text-xs ml-0.5"
                      title="Clear Date"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Agent / Customer Filter */}
                <div className="flex items-center gap-1.5 bg-[#f0f4f8] border border-[#c4d4ec] px-2.5 py-1 rounded">
                  <span className="text-[#1e4676] font-bold text-[11px]">Agent:</span>
                  <select
                    value={filterAgent}
                    onChange={(e) => {
                      setFilterAgent(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-[#c4d4ec] rounded px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none focus:border-[#1e4676] max-w-[180px]"
                  >
                    <option value="">All Agents / Customers</option>
                    {customers.map((c) => (
                      <option key={c.internal_id} value={c.internal_id}>
                        {c.name} ({c.id})
                      </option>
                    ))}
                  </select>
                  {filterAgent && (
                    <button 
                      onClick={() => { setFilterAgent(''); setCurrentPage(1); }}
                      className="text-gray-400 hover:text-red-500 font-bold text-xs ml-0.5"
                      title="Clear Agent Filter"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Search input */}
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search orders by ID, Agent, Client or Account..." 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border border-[#c4d4ec] pl-3 pr-6 py-1 rounded text-xs focus:outline-none focus:border-[#1e4676] w-64 sm:w-72"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                      title="Clear Search"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Reset Filters */}
                {(filterDate || filterAgent || searchQuery) && (
                  <button
                    onClick={() => {
                      setFilterDate('');
                      setFilterAgent('');
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="border border-[#c4d4ec] bg-white hover:bg-[#f0f4f8] text-[#1a4a8c] hover:text-[#133564] px-2.5 py-1 rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}

                {/* Export Options */}
                <div className="flex items-center gap-1.5 border-l border-[#c4d4ec] pl-2 ml-0.5">
                  <button
                    onClick={handleDownloadExcel}
                    disabled={isExporting !== null || loadingOrders || fetchedOrders.length === 0}
                    className="flex items-center gap-1.5 border border-[#c4d4ec] bg-white hover:bg-[#edf7ed] text-[#1e6e38] disabled:opacity-50 disabled:cursor-not-allowed px-2.5 py-1 rounded text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    title="Download Orders as Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#2e7d32]" />
                    <span>{isExporting === 'excel' ? 'Exporting...' : 'Excel'}</span>
                  </button>

                  <button
                    onClick={handleDownloadPdf}
                    disabled={isExporting !== null || loadingOrders || fetchedOrders.length === 0}
                    className="flex items-center gap-1.5 border border-[#c4d4ec] bg-white hover:bg-[#fdf2f2] text-[#b91c1c] disabled:opacity-50 disabled:cursor-not-allowed px-2.5 py-1 rounded text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    title="Download Orders as PDF (.pdf)"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#d32f2f]" />
                    <span>{isExporting === 'pdf' ? 'Generating...' : 'PDF'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Unified Summary Card (6 Cards Container) */}
            <div className="bg-[#f8fafc] border border-[#c4d4ec] rounded-md p-3 mb-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-[#d8e2ef]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#1e4676]"></span>
                  <span className="text-[11px] font-extrabold text-[#1e4676] uppercase tracking-wider">
                    Order Settlement & Clearance Overview
                  </span>
                  <span className="text-[10.5px] text-gray-500 hidden sm:inline">
                    • Dynamic AED & INR reconciliation
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10.5px]">
                  <span className="bg-[#f0f4f9] text-[#1e4676] border border-[#c4d4ec] font-bold px-2 py-0.5 rounded">
                    Total: {orderCount}
                  </span>
                  <span className="bg-[#edf7ed] text-[#1e6e38] border border-[#c3e6cb] font-bold px-2 py-0.5 rounded">
                    Cleared: {clearedOrderCount}
                  </span>
                  <span className="bg-[#fff8ee] text-[#b45309] border border-[#fde68a] font-bold px-2 py-0.5 rounded">
                    Uncleared: {unclearedOrderCount}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {/* 1. Total AED */}
                <div className="bg-[#f4f9f5] border border-[#b7dfbe] rounded-md p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1e7e34]"></span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#1e6e38]">Total AED</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#1e6e38] bg-[#e1f3e4] border border-[#c3e6cb] px-2 py-0.5 rounded-full">
                      {orderCount} {orderCount === 1 ? 'Order' : 'Orders'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[12px] font-bold text-[#145523]">AED</span>
                    <span className="text-[20px] font-extrabold text-[#145523] tracking-tight font-mono">
                      {totalAed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#285e33] mt-1 font-medium">
                    Combined AED volume across {orderCount} {orderCount === 1 ? 'order' : 'orders'}
                  </div>
                </div>

                {/* 2. Cleared AED */}
                <div className="bg-[#edf7ed] border border-[#a3d9a5] rounded-md p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0f5132]"></span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0f5132]">Cleared AED</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#0f5132] bg-[#d1e7dd] border border-[#badbcc] px-2 py-0.5 rounded-full">
                      {clearedOrderCount} Paid
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[12px] font-bold text-[#0f5132]">AED</span>
                    <span className="text-[20px] font-extrabold text-[#0f5132] tracking-tight font-mono">
                      {clearedAed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#0f5132] mt-1 font-medium">
                    Paid & settled AED amount
                  </div>
                </div>

                {/* 3. Uncleared AED */}
                <div className="bg-[#fef9ec] border border-[#fae29c] rounded-md p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#b45309]"></span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#b45309]">Uncleared AED</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#b45309] bg-[#fef3c7] border border-[#fde68a] px-2 py-0.5 rounded-full">
                      {unclearedOrderCount} Pending
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[12px] font-bold text-[#92400e]">AED</span>
                    <span className="text-[20px] font-extrabold text-[#92400e] tracking-tight font-mono">
                      {unclearedAed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#92400e] mt-1 font-medium">
                    Pending / partial AED payment
                  </div>
                </div>

                {/* 4. Total INR */}
                <div className="bg-[#f0f4f9] border border-[#c4d4ec] rounded-md p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1e4676]"></span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#1e4676]">Total INR</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#1e4676] bg-[#e0ebf7] border border-[#bcd2ee] px-2 py-0.5 rounded-full">
                      {orderCount} {orderCount === 1 ? 'Order' : 'Orders'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[13px] font-bold text-[#0d2a4a]">₹</span>
                    <span className="text-[20px] font-extrabold text-[#0d2a4a] tracking-tight font-mono">
                      {totalInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#2c5282] mt-1 font-medium">
                    Combined INR value across {orderCount} {orderCount === 1 ? 'order' : 'orders'}
                  </div>
                </div>

                {/* 5. Cleared INR */}
                <div className="bg-[#eaf1fb] border border-[#abc6ea] rounded-md p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1a4a8c]"></span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a4a8c]">Cleared INR</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#1a4a8c] bg-[#dbe8f9] border border-[#b8d4f6] px-2 py-0.5 rounded-full">
                      {clearedOrderCount} Paid
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[13px] font-bold text-[#103567]">₹</span>
                    <span className="text-[20px] font-extrabold text-[#103567] tracking-tight font-mono">
                      {clearedInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#1a4a8c] mt-1 font-medium">
                    Paid & settled INR value
                  </div>
                </div>

                {/* 6. Uncleared INR */}
                <div className="bg-[#fef7ee] border border-[#fed7aa] rounded-md p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#c2410c]"></span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#c2410c]">Uncleared INR</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#c2410c] bg-[#ffedd5] border border-[#fed7aa] px-2 py-0.5 rounded-full">
                      {unclearedOrderCount} Pending
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[13px] font-bold text-[#9a3412]">₹</span>
                    <span className="text-[20px] font-extrabold text-[#9a3412] tracking-tight font-mono">
                      {unclearedInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#9a3412] mt-1 font-medium">
                    Pending / partial INR payment
                  </div>
                </div>
              </div>
            </div>
            {loadingOrders ? (
              <div className="text-gray-500">Loading orders...</div>
            ) : (
              <>
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#1e4676] text-white">
                    <th className="p-2 border border-[#a0a0a0] w-6"></th>
                    <th className="p-2 border border-[#a0a0a0]">Order No</th>
                    <th className="p-2 border border-[#a0a0a0]">Date</th>
                    <th className="p-2 border border-[#a0a0a0]">Agent/Customer</th>
                    <th className="p-2 border border-[#a0a0a0]">Receivers</th>
                    <th className="p-2 border border-[#a0a0a0]">AED Total</th>
                    <th className="p-2 border border-[#a0a0a0]">INR Total</th>
                    <th className="p-2 border border-[#a0a0a0]">Txn Through</th>
                    <th className="p-2 border border-[#a0a0a0]">Issued By</th>
                    <th className="p-2 border border-[#a0a0a0]">Verified By</th>
                    <th className="p-2 border border-[#a0a0a0]">Verification</th>
                    <th className="p-2 border border-[#a0a0a0]">Payment</th>
                    <th className="p-2 border border-[#a0a0a0]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fetchedOrders.length > 0 ? fetchedOrders.map((o: any) => {
                    let recs: any[] = o.receivers_data;
                    if (typeof recs === 'string') {
                      try { recs = JSON.parse(recs); } catch { recs = []; }
                    }
                    if (!Array.isArray(recs)) recs = [];
                    const isExpanded = expandedOrderId === o.id;
                    const aggStatus = (o.payment_status || 'Pending');
                    const aggColor = aggStatus.toLowerCase() === 'paid'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : aggStatus.toLowerCase() === 'partial'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : aggStatus.toLowerCase() === 'cancelled'
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300';

                    return (
                      <>
                        {/* ── Order summary row ── */}
                        <tr
                          key={o.id}
                          className={`cursor-pointer transition-colors ${
                            isExpanded ? 'bg-[#eef3fb] border-l-4 border-l-[#1e4676]' : 'hover:bg-[#f5f8fc]'
                          }`}
                          onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                        >
                          {/* Expand toggle */}
                          <td className="p-2 border border-[#c4d4ec] text-center text-[#1e4676] font-bold select-none">
                            {isExpanded ? '▾' : '▸'}
                          </td>
                          <td className="p-2 border border-[#c4d4ec] font-bold text-blue-800 whitespace-nowrap">{o.order_no}</td>
                          <td className="p-2 border border-[#c4d4ec] whitespace-nowrap">{(o.order_date || '').split('T')[0]}</td>
                          <td className="p-2 border border-[#c4d4ec]">{o.party_name || o.party_id || 'N/A'}</td>
                          <td className="p-2 border border-[#c4d4ec]">
                            <span className="bg-[#e8eef8] text-[#1e4676] border border-[#c4d4ec] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {recs.length} {recs.length === 1 ? 'receiver' : 'receivers'}
                            </span>
                          </td>
                          <td className="p-2 border border-[#c4d4ec] font-semibold text-emerald-700 whitespace-nowrap">
                            {o.aed_amount ? `AED ${parseFloat(o.aed_amount).toFixed(2)}` : '-'}
                          </td>
                          <td className="p-2 border border-[#c4d4ec] font-semibold whitespace-nowrap">
                            {o.inr_value ? `₹ ${o.inr_value}` : '-'}
                          </td>
                          <td className="p-2 border border-[#c4d4ec] text-[11px] font-semibold text-gray-700">{o.transaction_through || '-'}</td>
                          <td className="p-2 border border-[#c4d4ec]">{o.created_by_name || 'Admin'}</td>
                          <td className="p-2 border border-[#c4d4ec]">{o.verified_by_name || (o.status === 'verified' ? 'Admin' : '-')}</td>
                          <td className="p-2 border border-[#c4d4ec]">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              o.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="p-2 border border-[#c4d4ec]" onClick={e => e.stopPropagation()}>
                            <span className={`text-[11px] font-bold rounded px-2 py-1 border ${aggColor}`}>
                              {aggStatus}
                            </span>
                          </td>
                          <td className="p-2 border border-[#c4d4ec] text-center" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              {isAdmin && o.status === 'pending' && (
                                <button
                                  disabled={verifyingOrderId === o.id}
                                  onClick={async () => {
                                    if (confirm(`Verify order ${o.order_no}?`)) {
                                      setVerifyingOrderId(o.id);
                                      try {
                                        await api.patch(`/records/orders/${o.id}`, { status: 'verified' });
                                        fetchOrders(currentPage, searchQuery);
                                      } catch (err: any) {
                                        alert('Failed to verify order: ' + (err.response?.data?.message || err.message));
                                      } finally {
                                        setVerifyingOrderId(null);
                                      }
                                    }
                                  }}
                                  className={`bg-[#1a4a8c] hover:bg-[#153970] text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-sm ${
                                    verifyingOrderId === o.id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  {verifyingOrderId === o.id ? 'Verifying...' : 'Verify'}
                                </button>
                              )}
                              <button
                                onClick={() => handleEditOrder(o)}
                                className="text-[#1a4a8c] hover:underline font-bold text-[11px]"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(o.id)}
                                className="text-red-600 hover:underline font-bold text-[11px]"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ── Expanded sub-table (one row per receiver) ── */}
                        {isExpanded && (
                          <tr key={`${o.id}-detail`}>
                            <td colSpan={13} className="p-0 border-x border-b border-[#c4d4ec] bg-[#f5f8ff]">
                              <div className="px-6 py-3">
                                <div className="text-[11px] font-extrabold text-[#1e4676] uppercase tracking-wider mb-2">
                                  Receiver Payment Details — {o.order_no}
                                </div>
                                {recs.length === 0 ? (
                                  <div className="text-[11px] text-gray-400 italic">No receiver data stored.</div>
                                ) : (
                                  <table className="w-full text-left border-collapse text-[11px]">
                                    <thead>
                                      <tr className="bg-[#dce6f7] text-[#1e4676]">
                                        <th className="p-1.5 border border-[#c4d4ec] font-bold">#</th>
                                        <th className="p-1.5 border border-[#c4d4ec] font-bold">Client / Beneficiary</th>
                                        <th className="p-1.5 border border-[#c4d4ec] font-bold">Account Number</th>
                                        <th className="p-1.5 border border-[#c4d4ec] font-bold">Bank / Branch</th>
                                        <th className="p-1.5 border border-[#c4d4ec] font-bold">IFSC Code</th>
                                        <th className="p-1.5 border border-[#c4d4ec] font-bold">INR Amount</th>
                                        <th className="p-1.5 border border-[#c4d4ec] font-bold">Sale Rate</th>
                                        <th className="p-1.5 border border-[#c4d4ec] font-bold">AED Amount</th>
                                        <th className="p-1.5 border border-[#c4d4ec] font-bold">Servicer</th>
                                        <th className="p-1.5 border border-[#c4d4ec] font-bold">Payment Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {recs.map((rec: any, idx: number) => {
                                        const recAed = rec.orderAmount && rec.confirmOrderAmount && parseFloat(rec.confirmOrderAmount) > 0
                                          ? (parseFloat(rec.orderAmount) / parseFloat(rec.confirmOrderAmount)).toFixed(2)
                                          : '-';
                                        const recStatus = rec.payment_status || 'Pending';
                                        const recColor = recStatus.toLowerCase() === 'paid'
                                          ? 'bg-green-100 text-green-800 border-green-300'
                                          : recStatus.toLowerCase() === 'partial'
                                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                                            : recStatus.toLowerCase() === 'cancelled'
                                              ? 'bg-red-100 text-red-800 border-red-300'
                                              : 'bg-amber-100 text-amber-800 border-amber-300';
                                        return (
                                          <tr key={idx} className="hover:bg-[#eef3fb] bg-white">
                                            <td className="p-1.5 border border-[#c4d4ec] text-gray-500">{idx + 1}</td>
                                            <td className="p-1.5 border border-[#c4d4ec] font-medium">{rec.clientName || '-'}</td>
                                            <td className="p-1.5 border border-[#c4d4ec] font-mono">{rec.accountNumber || '-'}</td>
                                            <td className="p-1.5 border border-[#c4d4ec] text-gray-700">
                                              <div className="font-medium">{rec.bankName || '-'}</div>
                                              {rec.branchName && <div className="text-gray-400 text-[10px]">{rec.branchName}</div>}
                                            </td>
                                            <td className="p-1.5 border border-[#c4d4ec] font-mono text-gray-600">{rec.ifscCode || '-'}</td>
                                            <td className="p-1.5 border border-[#c4d4ec] font-semibold">₹ {rec.orderAmount || '-'}</td>
                                            <td className="p-1.5 border border-[#c4d4ec]">{rec.confirmOrderAmount || '-'}</td>
                                            <td className="p-1.5 border border-[#c4d4ec] font-semibold text-emerald-700">AED {recAed}</td>
                                            <td className="p-1.5 border border-[#c4d4ec] text-gray-700">{rec.servicer || '-'}</td>
                                            <td className="p-1.5 border border-[#c4d4ec]">
                                              <select
                                                value={recStatus}
                                                onChange={async (e) => {
                                                  e.stopPropagation();
                                                  await handleReceiverPaymentStatus(o.id, idx, e.target.value);
                                                }}
                                                className={`text-[11px] font-bold rounded px-2 py-0.5 border cursor-pointer focus:outline-none w-full ${recColor}`}
                                                onClick={e => e.stopPropagation()}
                                              >
                                                <option value="Pending">Pending</option>
                                                <option value="Paid">Paid</option>
                                                <option value="Partial">Partial</option>
                                                <option value="Cancelled">Cancelled</option>
                                              </select>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  }) : (
                    <tr>
                      <td colSpan={13} className="p-4 text-center text-gray-500 italic border border-[#c4d4ec]">No orders found.</td>
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
          <>
            <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setIsFormModalOpen(false)}></div>
            <div className="absolute inset-0 z-40 flex items-start justify-center p-2 sm:p-3 overflow-y-auto">
              <div className="bg-white shadow-2xl flex flex-col max-h-[calc(100%-1rem)] max-w-4xl w-full rounded-md overflow-hidden mt-1">
              <div className="bg-[#eef2f9] px-6 py-4 font-bold text-black border-b border-[#c4d4ec] text-[16px] flex items-center justify-between">
                <span>Custom Order Entry Form</span>
                <button onClick={() => setIsFormModalOpen(false)} className="text-[#a51a1a] font-bold hover:underline cursor-pointer text-[14px]">
                  Close (X)
                </button>
              </div>
              <div className="p-6 overflow-auto bg-white flex flex-col gap-6">

                <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-6 gap-y-0 text-[13px]">
                  
                  {/* First Box Section */}
                  <div className="col-span-4 grid grid-cols-subgrid gap-y-3 bg-[#eaf0f8] border border-[#c4d4ec] rounded-md py-4 px-6 -mx-6 mb-4">
                    
                    <div className="font-medium text-black whitespace-nowrap">
                      Function Code <span className="text-red-600">*</span>
                    </div>
                    <div className="col-span-3">
                      <select 
                        value={selectedFunction}
                        onChange={(e) => setSelectedFunction(e.target.value)}
                        className="w-[240px] border border-[#c4d4ec] bg-white text-black rounded-md focus:outline-none h-[36px] px-2 pr-8"
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
                        className="w-[100%] max-w-[400px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none"
                      />
                      <datalist id="agent-customer-list">
                        {customers.map((c) => (
                          <option key={c.id} value={`${c.name} (${c.id})`} />
                        ))}
                      </datalist>
                    </div>

                    <div className="font-medium text-black whitespace-nowrap">
                      Transaction Through
                    </div>
                    <div>
                      <select 
                        value={transactionThrough}
                        onChange={(e) => setTransactionThrough(e.target.value)}
                        className="w-[240px] border border-[#c4d4ec] rounded-md h-[36px] px-2 pr-8 bg-white uppercase focus:outline-none"
                      >
                        <option value=""></option>
                        <option value="CDM">CDM</option>
                        <option value="BNK SLP">BNK SLP</option>
                        <option value="FINAC">FINAC</option>
                        <option value="BY CASH">BY CASH</option>
                        <option value="MOB TRF">MOB TRF</option>
                        <option value="UPI">UPI</option>
                        <option value="COR NET">COR NET</option>
                      </select>
                    </div>
                  </div>

                  {/* Second Box Section */}
                  <div className="col-span-4 grid grid-cols-subgrid gap-y-3 bg-[#eaf0f8] border border-[#c4d4ec] rounded-md py-4 px-6 -mx-6 relative">
                    <div className="absolute top-[-1px] left-[-1px] bg-[#1a4a8c] text-white text-[11px] font-medium px-3 py-1 rounded-tl-md rounded-br-md">Beneficiary Bank Details</div>
                    
                    <div className="font-medium text-black whitespace-nowrap mt-2">
                      Client / Beneficiary Name <span className="text-red-600">*</span>
                    </div>
                    <div className="mt-2">
                      <input 
                        type="text" 
                        value={currentAccount.clientName}
                        onChange={(e) => handleCurrentAccountChange('clientName', e.target.value)}
                        className="w-[100%] max-w-[400px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none"
                      />
                    </div>

                    <div className="font-medium text-black whitespace-nowrap mt-2">
                      Account Number <span className="text-red-600">*</span>
                    </div>
                    <div className="mt-2">
                      <input 
                        type="text" 
                        value={currentAccount.accountNumber}
                        onChange={(e) => handleCurrentAccountChange('accountNumber', e.target.value)}
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
                        className="w-[240px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white focus:outline-none"
                      />
                    </div>

                    <div className="font-medium text-black whitespace-nowrap">
                      Servicer
                    </div>
                    <div>
                      <input 
                        type="text" 
                        value={currentAccount.servicer}
                        onChange={(e) => handleCurrentAccountChange('servicer', e.target.value)}
                        placeholder="Servicer name"
                        className="w-[240px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none"
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
                    disabled={isSubmitting}
                    className={`bg-[#1a4a8c] text-white rounded-md px-6 py-2 shadow-sm font-medium hover:bg-[#153970] transition-opacity ${
                      isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (editingOrderId ? 'Updating...' : 'Processing...') : (editingOrderId ? 'Update Order' : 'Create Order (Go)')}
                  </button>
                  <button 
                    onClick={handleClear}
                    disabled={isSubmitting}
                    className="bg-white border border-[#c4d4ec] text-[#1a4a8c] rounded-md px-6 py-2 font-medium shadow-sm hover:bg-[#f4f7fb] disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      </div>

        {/* Success Modal */}
        {isSubmitted && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40"></div>
            <div className="absolute inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
              <div className="bg-white p-4 shadow-2xl w-full max-w-lg flex flex-col mt-4" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              <div className="border border-[#8f8f9d] p-[2px] bg-[#f0f0f5]">
                <div className="border border-[#8f8f9d] bg-white p-4 flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-b from-[#4facfe] to-[#00f2fe] flex items-center justify-center text-white font-serif italic font-bold text-base shadow-sm border border-[#00a8ff]">
                    i
                  </div>
                  <div className="text-[12px] text-black">
                    <div className="font-bold text-[#1e4676]">Order {orderRef} Registered Successfully.</div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsSubmitted(false);
                  setIsFormModalOpen(false);
                  handleClear();
                }}
                className="mt-3 self-start bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-4 py-1 text-xs font-bold text-black"
              >
                Ok
              </button>
            </div>
          </div>
        </>
      )}

      </div>

      {/* Received AED Modal */}
      {isReceivedAedModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setIsReceivedAedModalOpen(false)}></div>
          <div className="absolute inset-0 z-40 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white shadow-2xl flex flex-col max-h-[calc(100%-1rem)] max-w-xl w-full rounded-md overflow-hidden mt-1">
              {/* Header */}
              <div className="bg-[#eef2f9] px-6 py-4 font-bold text-black border-b border-[#c4d4ec] text-[16px] flex items-center justify-between">
                <span>Received AED Entry</span>
                <button
                  onClick={() => setIsReceivedAedModalOpen(false)}
                  className="text-[#a51a1a] font-bold hover:underline cursor-pointer text-[14px]"
                >
                  Close (X)
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-auto bg-white flex flex-col gap-6">
                <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-4 text-[13px] items-center bg-[#eaf0f8] border border-[#c4d4ec] rounded-md py-5 px-6">

                  {/* Entry Date */}
                  <label className="font-medium text-black whitespace-nowrap">
                    Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white focus:outline-none focus:border-[#1e4676] w-full"
                  />

                  {/* AED Amount Received */}
                  <label className="font-medium text-black whitespace-nowrap">
                    AED Amount Received <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={receivedAedAmount}
                    onChange={(e) => setReceivedAedAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white focus:outline-none focus:border-[#1e4676] w-full"
                  />

                  {/* Mode of Transaction */}
                  <label className="font-medium text-black whitespace-nowrap">
                    Mode of Transaction <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={modeOfTransaction}
                    onChange={(e) => {
                      setModeOfTransaction(e.target.value);
                      if (e.target.value !== 'BY CASH') setCollectionStaff('');
                    }}
                    className="border border-[#c4d4ec] rounded-md h-[36px] px-2 pr-8 bg-white uppercase focus:outline-none focus:border-[#1e4676] w-full"
                  >
                    <option value=""></option>
                    <option value="CDM">CDM</option>
                    <option value="BNK SLP">BNK SLP</option>
                    <option value="FINAC">FINAC</option>
                    <option value="BY CASH">BY CASH</option>
                    <option value="MOB TRF">MOB TRF</option>
                    <option value="UPI">UPI</option>
                    <option value="COR NET">COR NET</option>
                  </select>

                  {/* Collection Staff — only when BY CASH */}
                  {modeOfTransaction === 'BY CASH' && (
                    <>
                      <label className="font-medium text-black whitespace-nowrap">
                        Collection Staff <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={collectionStaff}
                        onChange={(e) => setCollectionStaff(e.target.value)}
                        placeholder="Staff name"
                        className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none focus:border-[#1e4676] w-full"
                      />
                    </>
                  )}

                  {/* Remaining Amount AED */}
                  <label className="font-medium text-black whitespace-nowrap">Remaining Amount AED</label>
                  <input
                    type="text"
                    value={remainingAed}
                    onChange={(e) => setRemainingAed(e.target.value)}
                    placeholder="0.00"
                    className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white focus:outline-none focus:border-[#1e4676] w-full"
                  />

                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={async () => {
                      if (!receivedAedAmount || parseFloat(receivedAedAmount) <= 0) {
                        alert('Please enter a valid AED amount received.');
                        return;
                      }
                      if (!modeOfTransaction) {
                        alert('Please select a mode of transaction.');
                        return;
                      }
                      if (modeOfTransaction === 'BY CASH' && !collectionStaff.trim()) {
                        alert('Please enter the cash collection staff name.');
                        return;
                      }
                      try {
                        await api.post('/records/received-aed', {
                          aed_amount: parseFloat(receivedAedAmount),
                          mode_of_txn: modeOfTransaction,
                          cash_staff: modeOfTransaction === 'BY CASH' ? collectionStaff.trim() : undefined,
                          remaining_amount: remainingAed ? parseFloat(remainingAed) : undefined,
                          entry_date: entryDate,
                        });
                        setIsReceivedAedModalOpen(false);
                        setReceivedAedAmount('');
                        setCollectedAed('');
                        setModeOfTransaction('');
                        setCollectionStaff('');
                        setRemainingAed('');
                        setEntryDate(new Date().toISOString().slice(0, 10));
                      } catch (err: any) {
                        alert(err?.response?.data?.error || 'Failed to save. Please try again.');
                      }
                    }}
                    className="bg-[#1a4a8c] text-white rounded-md px-6 py-2 shadow-sm font-medium hover:bg-[#153970] text-[13px]"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => {
                      setIsReceivedAedModalOpen(false);
                      setReceivedAedAmount('');
                      setCollectedAed('');
                      setModeOfTransaction('');
                      setCollectionStaff('');
                      setRemainingAed('');
                      setEntryDate(new Date().toISOString().slice(0, 10));
                    }}
                    className="bg-white border border-[#c4d4ec] text-[#1a4a8c] rounded-md px-6 py-2 font-medium shadow-sm hover:bg-[#f4f7fb] text-[13px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View Received AED Modal */}
      {isViewReceivedAedOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setIsViewReceivedAedOpen(false)}></div>
          <div className="absolute inset-0 z-40 flex items-start justify-center p-2 overflow-y-auto">
            <div className="bg-white shadow-2xl flex flex-col w-full max-w-5xl rounded-md overflow-hidden mt-2 mb-4">

              {/* Header */}
              <div className="bg-[#eef2f9] px-6 py-3 font-bold text-black border-b border-[#c4d4ec] text-[15px] flex items-center justify-between">
                <span>Received AED Records</span>
                <button onClick={() => setIsViewReceivedAedOpen(false)} className="text-[#a51a1a] font-bold hover:underline text-[13px]">
                  Close (X)
                </button>
              </div>

              {/* Filters */}
              <div className="px-5 py-3 bg-[#f4f7fb] border-b border-[#c4d4ec] flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-white border border-[#c4d4ec] px-2.5 py-1 rounded">
                  <span className="text-[#1e4676] font-bold text-[11px]">Date:</span>
                  <input
                    type="date"
                    value={viewDateFilter}
                    onChange={(e) => { setViewDateFilter(e.target.value); fetchReceivedAed(1, e.target.value, viewModeFilter); }}
                    className="bg-white border border-[#c4d4ec] rounded px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none focus:border-[#1e4676]"
                  />
                  {viewDateFilter && (
                    <button onClick={() => { setViewDateFilter(''); fetchReceivedAed(1, '', viewModeFilter); }} className="text-gray-400 hover:text-red-500 font-bold text-xs">✕</button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-[#c4d4ec] px-2.5 py-1 rounded">
                  <span className="text-[#1e4676] font-bold text-[11px]">Mode:</span>
                  <select
                    value={viewModeFilter}
                    onChange={(e) => { setViewModeFilter(e.target.value); fetchReceivedAed(1, viewDateFilter, e.target.value); }}
                    className="bg-white border border-[#c4d4ec] rounded px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none focus:border-[#1e4676]"
                  >
                    <option value="">All Modes</option>
                    <option value="CDM">CDM</option>
                    <option value="BNK SLP">BNK SLP</option>
                    <option value="FINAC">FINAC</option>
                    <option value="BY CASH">BY CASH</option>
                    <option value="MOB TRF">MOB TRF</option>
                    <option value="UPI">UPI</option>
                    <option value="COR NET">COR NET</option>
                  </select>
                  {viewModeFilter && (
                    <button onClick={() => { setViewModeFilter(''); fetchReceivedAed(1, viewDateFilter, ''); }} className="text-gray-400 hover:text-red-500 font-bold text-xs">✕</button>
                  )}
                </div>
                <button
                  onClick={() => fetchReceivedAed(1, viewDateFilter, viewModeFilter)}
                  className="bg-[#1a4a8c] text-white text-[11px] font-bold px-3 py-1 rounded hover:bg-[#153970]"
                >
                  Refresh
                </button>
                <span className="text-[11px] text-gray-500 ml-auto">{receivedAedTotal} record{receivedAedTotal !== 1 ? 's' : ''}</span>
              </div>

              {/* Table */}
              <div className="overflow-auto flex-1">
                {receivedAedLoading ? (
                  <div className="flex items-center justify-center py-12 text-gray-400 text-sm">Loading…</div>
                ) : receivedAedRecords.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-gray-400 text-sm">No records found</div>
                ) : (
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-[#1e4676] text-white text-left">
                        <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">#</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">Date</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">AED Amount</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">Mode</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">Cash Staff</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">Remaining AED</th>
                        <th className="px-3 py-2 font-semibold whitespace-nowrap">Created By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receivedAedRecords.map((rec, i) => (
                        <tr key={rec.id} className={`border-b border-[#e4e4e4] hover:bg-[#f0f5ff] ${i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}`}>
                          <td className="px-3 py-2 border-r border-[#e4e4e4] text-gray-500">{(receivedAedPage - 1) * 50 + i + 1}</td>
                          <td className="px-3 py-2 border-r border-[#e4e4e4] whitespace-nowrap">
                            {rec.entry_date ? new Date(rec.entry_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-3 py-2 border-r border-[#e4e4e4] font-semibold text-[#1e4676] whitespace-nowrap">
                            {parseFloat(rec.aed_amount).toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                          </td>
                          <td className="px-3 py-2 border-r border-[#e4e4e4]">
                            <span className="bg-[#e8f0fb] text-[#1e4676] px-2 py-0.5 rounded font-medium">{rec.mode_of_txn}</span>
                          </td>
                          <td className="px-3 py-2 border-r border-[#e4e4e4]">{rec.cash_staff || <span className="text-gray-400">—</span>}</td>
                          <td className="px-3 py-2 border-r border-[#e4e4e4] whitespace-nowrap">
                            {rec.remaining_amount != null
                              ? parseFloat(rec.remaining_amount).toLocaleString('en-AE', { minimumFractionDigits: 2 }) + ' AED'
                              : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{rec.created_by_name || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#eef2f9] font-bold text-[#1e4676] border-t-2 border-[#c4d4ec]">
                        <td className="px-3 py-2 border-r border-[#c4d4ec]" colSpan={2}>Total ({receivedAedRecords.length} shown)</td>
                        <td className="px-3 py-2 border-r border-[#c4d4ec] whitespace-nowrap">
                          {receivedAedRecords.reduce((s, r) => s + parseFloat(r.aed_amount || 0), 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                        </td>
                        <td className="px-3 py-2 border-r border-[#c4d4ec]" colSpan={4}></td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {receivedAedTotal > 50 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-[#c4d4ec] bg-[#f4f7fb]">
                  <span className="text-[11px] text-gray-500">Page {receivedAedPage} of {Math.ceil(receivedAedTotal / 50)}</span>
                  <div className="flex gap-2">
                    <button disabled={receivedAedPage <= 1} onClick={() => fetchReceivedAed(receivedAedPage - 1)}
                      className="px-3 py-1 text-xs border border-[#c4d4ec] rounded disabled:opacity-40 hover:bg-white">← Prev</button>
                    <button disabled={receivedAedPage >= Math.ceil(receivedAedTotal / 50)} onClick={() => fetchReceivedAed(receivedAedPage + 1)}
                      className="px-3 py-1 text-xs border border-[#c4d4ec] rounded disabled:opacity-40 hover:bg-white">Next →</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </>
      )}

    </div>
  );
}
