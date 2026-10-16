import FinacleDatePicker from './FinacleDatePicker';
import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { exportOrdersToExcel, exportOrdersToPdf } from '../utils/exportOrders';
import CostRateModal from './CostRateModal';

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
  const [agentOrCustomer, setAgentOrCustomer] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [savedBeneficiaries, setSavedBeneficiaries] = useState<any[]>([]);

  const selectedPartyId = useMemo(() => {
    const selected = customers.find(c => `${c.name} (${c.id})` === agentOrCustomer);
    return selected ? String(selected.internal_id) : null;
  }, [agentOrCustomer, customers]);

  const sortedBeneficiaries = useMemo(() => {
    if (!savedBeneficiaries || savedBeneficiaries.length === 0) return [];
    return [...savedBeneficiaries].sort((a, b) => {
      const aMatch = selectedPartyId && String(a.party_id) === String(selectedPartyId) ? 1 : 0;
      const bMatch = selectedPartyId && String(b.party_id) === String(selectedPartyId) ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return (a.client_name || '').localeCompare(b.client_name || '');
    });
  }, [savedBeneficiaries, selectedPartyId]);

  const uniqueClientOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    sortedBeneficiaries.forEach(b => {
      const key = `${(b.client_name || '').toUpperCase()}__${(b.account_number || '').trim()}`;
      if (b.client_name && !seen.has(key)) {
        seen.add(key);
        list.push(b);
      }
    });
    return list;
  }, [sortedBeneficiaries]);

  const uniqueAccountOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    sortedBeneficiaries.forEach(b => {
      const key = (b.account_number || '').trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push(b);
      }
    });
    return list;
  }, [sortedBeneficiaries]);

  const uniqueIfscOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    sortedBeneficiaries.forEach(b => {
      const key = (b.ifsc_code || '').toUpperCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push(b);
      }
    });
    return list;
  }, [sortedBeneficiaries]);

  const handleCurrentAccountChange = async (field: keyof typeof currentAccount, value: string) => {
    let updated = { ...currentAccount, [field]: value };
    
    if (field === 'clientName') {
      const trimmed = value.trim().toUpperCase();
      if (trimmed) {
        const match = sortedBeneficiaries.find(b => (b.client_name || '').toUpperCase() === trimmed);
        if (match) {
          if (match.account_number) updated.accountNumber = match.account_number;
          if (match.ifsc_code) {
            updated.ifscCode = match.ifsc_code;
            updated.bankName = match.bank_name || '';
            updated.branchName = match.branch_name || '';
          }
          if (match.servicer && !updated.servicer) updated.servicer = match.servicer;
        }
      }
    } else if (field === 'accountNumber') {
      const trimmed = value.trim();
      if (trimmed) {
        const match = sortedBeneficiaries.find(b => (b.account_number || '').trim() === trimmed);
        if (match) {
          if (match.client_name) updated.clientName = match.client_name;
          if (match.ifsc_code) {
            updated.ifscCode = match.ifsc_code;
            updated.bankName = match.bank_name || '';
            updated.branchName = match.branch_name || '';
          }
          if (match.servicer && !updated.servicer) updated.servicer = match.servicer;
        }
      }
    } else if (field === 'ifscCode') {
      const trimmed = value.trim().toUpperCase();
      updated.ifscCode = trimmed;
      const match = sortedBeneficiaries.find(b => (b.ifsc_code || '').toUpperCase() === trimmed && b.bank_name);
      if (match && match.bank_name) {
        updated.bankName = match.bank_name;
        updated.branchName = match.branch_name || '';
      } else if (trimmed.length === 11) {
        try {
          const res = await fetch(`https://ifsc.razorpay.com/${trimmed}`);
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
    if (currentAccount.clientName.trim()) {
      setSavedBeneficiaries(prev => [
        {
          client_name: currentAccount.clientName.trim(),
          account_number: currentAccount.accountNumber.trim(),
          ifsc_code: currentAccount.ifscCode.trim().toUpperCase(),
          bank_name: currentAccount.bankName,
          branch_name: currentAccount.branchName,
          servicer: currentAccount.servicer,
          party_id: selectedPartyId
        },
        ...prev
      ]);
    }
    const lastSaleRate = currentAccount.confirmOrderAmount;
    setCurrentAccount({
      clientName: '',
      accountNumber: '',
      orderAmount: '',
      confirmOrderAmount: lastSaleRate,
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
  const [transactionThrough, setTransactionThrough] = useState('');

  const activeRole = localStorage.getItem('infazys_finacle_active_role');
  const isAdmin = activeRole === 'super_admin' || activeRole === 'admin';

  // View Orders State
  const [fetchedOrders, setFetchedOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [orderExecutionDate, setOrderExecutionDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [existingDailyOrder, setExistingDailyOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!selectedPartyId || !orderExecutionDate) {
      setExistingDailyOrder(null);
      return;
    }
    const checkOrder = async () => {
      try {
        const res = await api.get(`/records/orders?party_id=${selectedPartyId}&date=${orderExecutionDate}&limit=1`);
        const rec = res.data?.records?.[0];
        if (rec && rec.status !== 'cancelled') {
          setExistingDailyOrder(rec);
        } else {
          setExistingDailyOrder(null);
        }
      } catch {
        setExistingDailyOrder(null);
      }
    };
    checkOrder();
  }, [selectedPartyId, orderExecutionDate]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null);
  const [isReceivedAedModalOpen, setIsReceivedAedModalOpen] = useState(false);
  const [receivedAedAmount, setReceivedAedAmount] = useState('');
  const [modeOfTransaction, setModeOfTransaction] = useState('');
  const [collectionStaff, setCollectionStaff] = useState('');
  const [remainingAed, setRemainingAed] = useState('');
  const [receivedAedAgent, setReceivedAedAgent] = useState('');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isCostRateModalOpen, setIsCostRateModalOpen] = useState(false);
  const [currentCostRate, setCurrentCostRate] = useState<number | null>(null);

  const fetchCostRate = async (date: string) => {
    if (!date) {
      setCurrentCostRate(null);
      return;
    }
    try {
      const res = await api.get(`/records/cost-rate?date=${encodeURIComponent(date)}`);
      if (res.data?.cost_rate !== null && res.data?.cost_rate !== undefined) {
        setCurrentCostRate(Number(res.data.cost_rate));
      } else {
        setCurrentCostRate(null);
      }
    } catch {
      setCurrentCostRate(null);
    }
  };

  useEffect(() => {
    const d = filterDate || new Date().toISOString().slice(0, 10);
    fetchCostRate(d);
  }, [filterDate]);

  const handleCostRateSaved = (_date: string, rate: number) => {
    setCurrentCostRate(rate);
  };

  const [receivedAedTotalSum, setReceivedAedTotalSum] = useState<number>(0);

  const fetchReceivedAedSummary = async (date = filterDate, agentId = filterAgent) => {
    try {
      let url = `/records/received-aed?limit=1`;
      if (date) url += `&date=${encodeURIComponent(date)}`;
      if (agentId) {
        const selectedCust = customers.find(c => String(c.internal_id) === String(agentId));
        if (selectedCust) {
          url += `&agent=${encodeURIComponent(selectedCust.name)}`;
        }
      }
      const res = await api.get(url);
      setReceivedAedTotalSum(parseFloat(res.data?.totalAedSum || 0));
    } catch (err) {
      console.error("Failed to fetch received aed summary:", err);
    }
  };

  useEffect(() => {
    fetchReceivedAedSummary(filterDate, filterAgent);
  }, [filterDate, filterAgent, customers]);

  // View Received AED
  const [isViewReceivedAedOpen, setIsViewReceivedAedOpen] = useState(false);
  const [receivedAedRecords, setReceivedAedRecords] = useState<any[]>([]);
  const [receivedAedTotal, setReceivedAedTotal] = useState(0);
  const [receivedAedPage, setReceivedAedPage] = useState(1);
  const [receivedAedLoading, setReceivedAedLoading] = useState(false);
  const [viewDateFilter, setViewDateFilter] = useState('');
  const [viewModeFilter, setViewModeFilter] = useState('');
  const [editingReceivedAedId, setEditingReceivedAedId] = useState<number | null>(null);

  const handleEditReceivedAed = (rec: any) => {
    setEditingReceivedAedId(rec.id);
    setEntryDate(rec.entry_date ? String(rec.entry_date).slice(0, 10) : new Date().toISOString().slice(0, 10));
    setReceivedAedAgent(rec.agent_customer || "");
    setReceivedAedAmount(String(rec.aed_amount || ''));
    setModeOfTransaction(rec.mode_of_txn || '');
    setCollectionStaff(rec.cash_staff || '');
    setRemainingAed(rec.remaining_amount != null ? String(rec.remaining_amount) : '');
    setIsReceivedAedModalOpen(true);
  };

  const handleDeleteReceivedAed = async (id: number) => {
    if (!confirm('Are you sure you want to delete this Received AED entry?')) return;
    try {
      await api.delete(`/records/received-aed/${id}`);
      fetchReceivedAed(receivedAedPage, viewDateFilter, viewModeFilter);
      fetchReceivedAedSummary(filterDate, filterAgent);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete record.');
    }
  };

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
    receivedAed,
    pendingAed,
    aedCollectionPct,
    totalInr,
    transferredInr,
    unclearedInr,
    inrTransferPct,
    orderCount,
    paidOrdersCount,
    partialOrdersCount
  } = useMemo(() => {
    let aedSum = 0;
    let inrSum = 0;
    let transferredInrSum = 0;

    let paidOrdersCount = 0;
    let partialOrdersCount = 0;
    let pendingOrdersCount = 0;

    for (const o of fetchedOrders) {
      if (!o) continue;

      // 1. Calculate AED for this order
      let aed = 0;
      if (o.aed_amount !== undefined && o.aed_amount !== null && o.aed_amount !== '') {
        const parsed = typeof o.aed_amount === 'number' ? o.aed_amount : parseFloat(String(o.aed_amount).replace(/,/g, ''));
        if (!isNaN(parsed) && isFinite(parsed)) aed = parsed;
      }
      if (aed === 0 && o.receivers_data) {
        let recs = o.receivers_data;
        if (typeof recs === 'string') {
          try { recs = JSON.parse(recs); } catch { recs = []; }
        }
        if (Array.isArray(recs)) {
          aed = recs.reduce((sum: number, acc: any) => {
            const amt = parseFloat(String(acc?.orderAmount || '').replace(/,/g, ''));
            const rate = parseFloat(String(acc?.confirmOrderAmount || '').replace(/,/g, ''));
            return (!isNaN(amt) && !isNaN(rate) && rate > 0) ? sum + (amt / rate) : sum;
          }, 0);
        }
      }
      aedSum += aed;

      // 2. Calculate INR and Transferred INR for this order
      let orderInr = 0;
      let orderTransferred = 0;
      let recs = o.receivers_data;
      if (typeof recs === 'string') {
        try { recs = JSON.parse(recs); } catch { recs = []; }
      }

      if (Array.isArray(recs) && recs.length > 0) {
        for (const rec of recs) {
          const recAmt = parseFloat(String(rec?.orderAmount || 0).replace(/,/g, '')) || 0;
          orderInr += recAmt;
          const status = (rec?.payment_status || 'Pending').toLowerCase();
          if (status === 'paid') {
            orderTransferred += recAmt;
          } else if (status === 'partial') {
            const partialAmt = parseFloat(String(rec?.paid_amount || 0).replace(/,/g, '')) || 0;
            orderTransferred += Math.min(recAmt, partialAmt);
          }
        }
      } else {
        if (o.inr_value !== undefined && o.inr_value !== null && o.inr_value !== '') {
          const parsed = typeof o.inr_value === 'number' ? o.inr_value : parseFloat(String(o.inr_value).replace(/,/g, ''));
          if (!isNaN(parsed) && isFinite(parsed)) orderInr = parsed;
        }
        const status = (o.payment_status || 'Pending').toLowerCase();
        if (status === 'paid') {
          orderTransferred = orderInr;
        }
      }

      inrSum += orderInr;
      transferredInrSum += orderTransferred;

      const orderStatus = (o.payment_status || 'Pending').toLowerCase();
      if (orderStatus === 'paid') paidOrdersCount++;
      else if (orderStatus === 'partial') partialOrdersCount++;
      else pendingOrdersCount++;
    }

    // AED Section (Agent collections vs Received AED modal)
    const recAed = receivedAedTotalSum || 0;
    const pendAed = Math.max(0, Math.round((aedSum - recAed) * 100) / 100);
    const aedPct = aedSum > 0 ? Math.min(100, (recAed / aedSum) * 100) : 0;

    // INR Section (Remittances vs Beneficiary transfers)
    const unclrInr = Math.max(0, Math.round((inrSum - transferredInrSum) * 100) / 100);
    const inrPct = inrSum > 0 ? Math.min(100, (transferredInrSum / inrSum) * 100) : 0;

    // Profit Section
    const hasCostRate = Boolean(currentCostRate && currentCostRate > 0);
    let totalCostAed = 0;
    let totalProfitAed = 0;
    if (hasCostRate && currentCostRate) {
      totalCostAed = inrSum / currentCostRate;
      totalProfitAed = aedSum - totalCostAed;
    }
    const marginPct = (aedSum > 0 && totalProfitAed !== 0) ? ((totalProfitAed / aedSum) * 100) : 0;

    return {
      totalAed: aedSum,
      receivedAed: recAed,
      pendingAed: pendAed,
      aedCollectionPct: aedPct,
      totalInr: inrSum,
      transferredInr: transferredInrSum,
      unclearedInr: unclrInr,
      inrTransferPct: inrPct,
      orderCount: fetchedOrders.length,
      paidOrdersCount,
      partialOrdersCount,
      pendingOrdersCount,
      totalCostAed,
      totalProfitAed,
      marginPct,
      hasCostRate
    };
  }, [fetchedOrders, currentCostRate, receivedAedTotalSum]);

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

  const fetchBeneficiaries = async () => {
    try {
      const res = await api.get('/records/beneficiaries');
      if (res.data?.beneficiaries && Array.isArray(res.data.beneficiaries)) {
        setSavedBeneficiaries(res.data.beneficiaries);
      }
    } catch (err) {
      console.warn('Failed to load beneficiaries:', err);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

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

  const handleReceiverPaymentStatus = async (orderId: string, receiverIndex: number, newStatus: string, customPaidAmount?: number) => {
    let paidAmount = customPaidAmount;

    if (newStatus === 'Partial' && paidAmount === undefined) {
      const order = fetchedOrders.find(o => String(o.id) === String(orderId));
      let recs = order?.receivers_data;
      if (typeof recs === 'string') {
        try { recs = JSON.parse(recs); } catch { recs = []; }
      }
      const currentRec = Array.isArray(recs) ? recs[receiverIndex] : null;
      const totalAmt = parseFloat(String(currentRec?.orderAmount || 0).replace(/,/g, '')) || 0;
      const currentPaid = parseFloat(String(currentRec?.paid_amount || 0).replace(/,/g, '')) || 0;

      const input = window.prompt(
        `Enter Transferred INR Amount for this receiver (Total: ₹${totalAmt.toLocaleString('en-IN')}):`,
        currentPaid > 0 ? String(currentPaid) : ''
      );

      if (input === null) {
        // Cancelled by user, do not change status
        return;
      }
      const parsed = parseFloat(input.replace(/,/g, ''));
      if (isNaN(parsed) || parsed < 0) {
        alert('Please enter a valid positive number for partial paid amount.');
        return;
      }
      paidAmount = Math.min(totalAmt, parsed);
    }

    try {
      const payload: any = { payment_status: newStatus };
      if (paidAmount !== undefined) {
        payload.paid_amount = paidAmount;
      }
      const res = await api.patch(`/records/orders/${orderId}/receiver/${receiverIndex}`, payload);
      const updatedRecord = res.data.record;
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
    setOrderExecutionDate(o.order_date ? o.order_date.split('T')[0] : new Date().toLocaleDateString('en-CA'));
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
      order_date: orderExecutionDate || new Date().toLocaleDateString('en-CA'),
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
        const res = await api.post('/records/orders', apiPayload);
        const ref = res.data?.record?.order_no || `ORD-${Date.now().toString().slice(-6)}`;
        setOrderRef(ref);
        setIsFormModalOpen(false);
        setIsSubmitted(true);
        fetchBeneficiaries();
        if (filterDate && filterDate !== (orderExecutionDate || new Date().toLocaleDateString('en-CA'))) {
          setFilterDate('');
          fetchOrders(1, searchQuery, '', filterAgent);
        } else {
          fetchOrders(1, searchQuery, filterDate, filterAgent);
        }
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
    setOrderExecutionDate(new Date().toLocaleDateString('en-CA'));
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

        </div>

        <div className="p-4 bg-white overflow-auto flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-bold text-[#1e4676] text-sm tracking-wide">Fetched Orders List</h3>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Date Filter */}
                <div className="flex items-center gap-1.5 bg-[#f0f4f8] border border-[#c4d4ec] px-2.5 py-1 rounded">
                  <span className="text-[#1e4676] font-bold text-[11px]">Date:</span>
                  <FinacleDatePicker
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-[#c4d4ec] rounded px-2 py-0.5 text-xs text-gray-700 min-w-[125px] h-[26px]"
                  />
                  {filterDate ? (
                    <button 
                      onClick={() => { setFilterDate(''); setCurrentPage(1); }}
                      className="text-gray-400 hover:text-red-500 font-bold text-xs ml-0.5"
                      title="Clear Date (Show All Dates)"
                    >
                      &times;
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setFilterDate(new Date().toLocaleDateString('en-CA')); setCurrentPage(1); }}
                      className="text-[10px] text-[#1a4a8c] hover:underline font-semibold ml-0.5 cursor-pointer"
                      title="Filter for today's orders"
                    >
                      Today
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
                {(filterDate !== '' || filterAgent || searchQuery) && (
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

            {/* ── Executive Dashboard (6 Cards: 3 AED, 3 INR) - Ultra-Compact Slim Mode ── */}
            <div className="mb-2.5 bg-white border border-[#c4d4ec] rounded-md px-3 py-2 shadow-2xs">


              {/* ── Group 1: AED Collections (3 Cards) ── */}
              <div className="mb-2">
                <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#104080] mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#104080]"></span>
                  AED Collections (Agent / Customer)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {/* 1. Total AED Amount */}
                  <div className="bg-[#f4f7fc] border border-[#a2b5cd] rounded-sm px-2.5 py-1.5 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#104080]">Total AED Amount</span>
                        <span className="text-[9px] font-bold text-[#104080] bg-[#eaf0f8] border border-[#a2b5cd] px-1.5 py-0.2 rounded-full">
                          {orderCount} {orderCount === 1 ? 'Order' : 'Orders'}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[10px] font-bold text-[#104080]">AED</span>
                        <span className="text-[15px] font-extrabold text-[#104080] tracking-tight font-mono">
                          {totalAed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="text-[9px] text-gray-500 mt-1.5 pt-1 border-t border-[#d0dbe8] flex items-center justify-between">
                      <span>Total Booked</span>
                      <span className="font-semibold text-gray-600">{filterDate ? filterDate : 'All dates'}</span>
                    </div>
                  </div>

                  {/* 2. Received AED */}
                  <div className="bg-[#f2f9f4] border border-[#8ce0b0] rounded-sm px-2.5 py-1.5 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#0f5132]">Received AED</span>
                        <span className="text-[9px] font-bold text-[#0f5132] bg-[#d1e7dd] border border-[#badbcc] px-1.5 py-0.2 rounded-full">
                          {aedCollectionPct.toFixed(1)}% Collected
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[10px] font-bold text-[#0f5132]">AED</span>
                        <span className="text-[15px] font-extrabold text-[#0f5132] tracking-tight font-mono">
                          {receivedAed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 pt-1 border-t border-[#c6e6cf]">
                      <div className="flex items-center justify-between text-[9px] text-[#0f5132] font-semibold mb-0.5">
                        <span>Collection Progress</span>
                        <span>{aedCollectionPct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-[#d5ecd9] h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#0f5132] h-full rounded-full transition-all duration-300"
                          style={{ width: `${aedCollectionPct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Pending AED */}
                  <div className="bg-[#fef9ec] border border-[#fae29c] rounded-sm px-2.5 py-1.5 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#92400e]">Pending AED</span>
                        <span className="text-[9px] font-bold text-[#b45309] bg-[#fef3c7] border border-[#fde68a] px-1.5 py-0.2 rounded-full">
                          {pendingAed === 0 ? "Fully Cleared" : "Awaiting Receipt"}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[10px] font-bold text-[#92400e]">AED</span>
                        <span className="text-[15px] font-extrabold text-[#92400e] tracking-tight font-mono">
                          {pendingAed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="text-[9px] text-[#92400e] mt-1.5 pt-1 border-t border-[#fae6b2] flex items-center justify-between">
                      <span>Outstanding Balance</span>
                      <span className="font-semibold">{pendingAed === 0 ? "All Collected" : "Pending from Agents"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Group 2: INR Remittances (3 Cards) ── */}
              <div>
                <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#1e4676] mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1e4676]"></span>
                  INR Remittances (Beneficiary Payouts)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {/* 4. Total INR */}
                  <div className="bg-[#f8f9fc] border border-[#c4d4ec] rounded-sm px-2.5 py-1.5 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#1e4676]">Total INR Amount</span>
                        <span className="text-[9px] font-bold text-[#1e4676] bg-[#eef3fb] border border-[#c4d4ec] px-1.5 py-0.2 rounded-full">
                          Total Obligation
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[10px] font-bold text-[#1e4676]">INR</span>
                        <span className="text-[15px] font-extrabold text-[#1e4676] tracking-tight font-mono">
                          ₹ {totalInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="text-[9px] text-gray-500 mt-1.5 pt-1 border-t border-[#d8e2ef] flex items-center justify-between">
                      <span>Remittance Volume</span>
                      <span className="font-semibold text-gray-600">{filterDate ? filterDate : 'All dates'}</span>
                    </div>
                  </div>

                  {/* 5. Transferred INR */}
                  <div className="bg-[#f0fbf6] border border-[#7ed8a7] rounded-sm px-2.5 py-1.5 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#0d6e5a]">Transferred INR</span>
                        <span className="text-[9px] font-bold text-[#0d6e5a] bg-[#d6f5e8] border border-[#a2e8c8] px-1.5 py-0.2 rounded-full">
                          {inrTransferPct.toFixed(1)}% Dispatched
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[10px] font-bold text-[#0d6e5a]">INR</span>
                        <span className="text-[15px] font-extrabold text-[#0d6e5a] tracking-tight font-mono">
                          ₹ {transferredInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 pt-1 border-t border-[#bce8d2]">
                      <div className="flex items-center justify-between text-[9px] text-[#0d6e5a] font-semibold mb-0.5">
                        <span>Payout Progress ({paidOrdersCount} Paid{partialOrdersCount > 0 ? `, ${partialOrdersCount} Partial` : ''})</span>
                        <span>{inrTransferPct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-[#d0f0e0] h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#0d6e5a] h-full rounded-full transition-all duration-300"
                          style={{ width: `${inrTransferPct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* 6. Uncleared INR */}
                  <div className="bg-[#fffbf2] border border-[#f5d58f] rounded-sm px-2.5 py-1.5 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#854d0e]">Uncleared INR</span>
                        <span className="text-[9px] font-bold text-[#854d0e] bg-[#fef3c7] border border-[#fde68a] px-1.5 py-0.2 rounded-full">
                          {unclearedInr === 0 ? "All Paid" : "Remaining to Pay"}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[10px] font-bold text-[#854d0e]">INR</span>
                        <span className="text-[15px] font-extrabold text-[#854d0e] tracking-tight font-mono">
                          ₹ {unclearedInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="text-[9px] text-[#854d0e] mt-1.5 pt-1 border-t border-[#fae2ab] flex items-center justify-between">
                      <span>Pending Payout</span>
                      <span className="font-semibold">{unclearedInr === 0 ? "Zero Balance" : "Pending Beneficiary Transfer"}</span>
                    </div>
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
                          <td className="p-2 border border-[#c4d4ec] font-bold whitespace-nowrap">{(o.order_date || '').split('T')[0]}</td>
                          <td className="p-2 border border-[#c4d4ec] font-bold text-gray-900">{o.party_name || o.party_id || 'N/A'}</td>
                          <td className="p-2 border border-[#c4d4ec]">
                            <span className="bg-[#e8eef8] text-[#1e4676] border border-[#c4d4ec] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {recs.length} {recs.length === 1 ? 'receiver' : 'receivers'}
                            </span>
                          </td>
                          <td className="p-2 border border-[#c4d4ec] font-bold text-emerald-700 whitespace-nowrap">
                            {o.aed_amount ? `AED ${parseFloat(o.aed_amount).toFixed(2)}` : '-'}
                          </td>
                          <td className="p-2 border border-[#c4d4ec] font-bold text-black whitespace-nowrap">
                            {o.inr_value ? `₹ ${o.inr_value}` : '-'}
                          </td>
                          <td className="p-2 border border-[#c4d4ec] text-[11px] font-bold text-gray-800">{o.transaction_through || '-'}</td>
                          <td className="p-2 border border-[#c4d4ec] font-bold text-gray-800">{o.created_by_name || 'Admin'}</td>
                          <td className="p-2 border border-[#c4d4ec] font-bold text-gray-800">{o.verified_by_name || (o.status === 'verified' ? 'Admin' : '-')}</td>
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
                                        <th className="p-1.5 border border-[#c4d4ec] font-bold">IFSC Code</th>
                                        <th className="p-1.5 border border-[#c4d4ec] font-bold">Bank / Branch</th>
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
                                            <td className="p-1.5 border border-[#c4d4ec] font-bold text-gray-600">{idx + 1}</td>
                                            <td className="p-1.5 border border-[#c4d4ec] font-bold text-gray-900">{rec.clientName || '-'}</td>
                                            <td className="p-1.5 border border-[#c4d4ec] font-bold font-mono text-gray-900">{rec.accountNumber || '-'}</td>
                                            <td className="p-1.5 border border-[#c4d4ec] font-bold font-mono text-gray-700">{rec.ifscCode || '-'}</td>
                                            <td className="p-1.5 border border-[#c4d4ec] text-gray-800">
                                              <div className="font-bold">{rec.bankName || '-'}</div>
                                              {rec.branchName && <div className="text-gray-600 font-bold text-[10px]">{rec.branchName}</div>}
                                            </td>
                                            <td className="p-1.5 border border-[#c4d4ec] font-bold text-black">
                                              <div>₹ {rec.orderAmount || '-'}</div>
                                              {recStatus.toLowerCase() === 'partial' && (
                                                <div className="text-[9.5px] font-bold text-blue-700 mt-0.5">
                                                  Paid: ₹{(parseFloat(rec.paid_amount) || 0).toLocaleString('en-IN')}
                                                </div>
                                              )}
                                            </td>
                                            <td className="p-1.5 border border-[#c4d4ec] font-bold text-gray-900">{rec.confirmOrderAmount || '-'}</td>
                                            <td className="p-1.5 border border-[#c4d4ec] font-bold text-emerald-700">AED {recAed}</td>
                                            <td className="p-1.5 border border-[#c4d4ec] font-bold text-gray-800">{rec.servicer || '-'}</td>
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
                                              {recStatus.toLowerCase() === 'partial' && (
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReceiverPaymentStatus(o.id, idx, 'Partial');
                                                  }}
                                                  className="text-[9.5px] text-[#1e4676] hover:underline font-semibold block mt-1"
                                                  title="Click to edit transferred amount"
                                                >
                                                  Edit Paid: ₹{(parseFloat(rec.paid_amount) || 0).toLocaleString('en-IN')}
                                                </button>
                                              )}
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
                      <FinacleDatePicker 
                        value={orderExecutionDate}
                        onChange={(e) => setOrderExecutionDate(e.target.value)}
                        className="w-[240px] border border-[#c4d4ec] rounded-md h-[36px] px-3 bg-white text-xs"
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
                        list="beneficiary-client-suggestions"
                        autoComplete="off"
                        value={currentAccount.clientName}
                        onChange={(e) => handleCurrentAccountChange('clientName', e.target.value)}
                        className="w-[100%] max-w-[400px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none"
                      />
                      <datalist id="beneficiary-client-suggestions">
                        {uniqueClientOptions.map((b, idx) => (
                          <option 
                            key={`client-${idx}-${b.account_number}`} 
                            value={b.client_name} 
                            label={`${b.account_number ? `A/C ${b.account_number}` : ''}${b.bank_name ? ` • ${b.bank_name}` : ''}`}
                          >
                            {b.account_number ? `A/C ${b.account_number}` : ''}{b.bank_name ? ` • ${b.bank_name}` : ''}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    <div className="font-medium text-black whitespace-nowrap mt-2">
                      Account Number <span className="text-red-600">*</span>
                    </div>
                    <div className="mt-2">
                      <input 
                        type="text" 
                        list="beneficiary-account-suggestions"
                        autoComplete="off"
                        value={currentAccount.accountNumber}
                        onChange={(e) => handleCurrentAccountChange('accountNumber', e.target.value)}
                        className="w-[100%] max-w-[400px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none"
                      />
                      <datalist id="beneficiary-account-suggestions">
                        {uniqueAccountOptions.map((b, idx) => (
                          <option 
                            key={`acc-${idx}-${b.account_number}`} 
                            value={b.account_number} 
                            label={`${b.client_name || ''}${b.bank_name ? ` • ${b.bank_name}` : ''}`}
                          >
                            {b.client_name || ''}{b.bank_name ? ` • ${b.bank_name}` : ''}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    <div className="font-medium text-black whitespace-nowrap">
                      IFSC Code <span className="text-red-600">*</span>
                    </div>
                    <div>
                      <input 
                        type="text" 
                        list="beneficiary-ifsc-suggestions"
                        autoComplete="off"
                        value={currentAccount.ifscCode}
                        onChange={(e) => handleCurrentAccountChange('ifscCode', e.target.value)}
                        className="w-[240px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none"
                      />
                      <datalist id="beneficiary-ifsc-suggestions">
                        {uniqueIfscOptions.map((b, idx) => (
                          <option 
                            key={`ifsc-${idx}-${b.ifsc_code}`} 
                            value={b.ifsc_code} 
                            label={`${b.bank_name || ''}${b.branch_name ? ` • ${b.branch_name}` : ''}`}
                          >
                            {b.bank_name || ''}{b.branch_name ? ` • ${b.branch_name}` : ''}
                          </option>
                        ))}
                      </datalist>
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

                {accounts.length > 0 && (() => {
                  let totalAddedInr = 0;
                  let totalAddedAed = 0;
                  for (const acc of accounts) {
                    const inr = parseFloat(String(acc.orderAmount || 0).replace(/,/g, '')) || 0;
                    const rate = parseFloat(String(acc.confirmOrderAmount || 0).replace(/,/g, '')) || 0;
                    const aed = rate > 0 ? (inr / rate) : (parseFloat(String((acc as any).aedAmount || 0).replace(/,/g, '')) || 0);
                    totalAddedInr += inr;
                    totalAddedAed += aed;
                  }

                  return (
                    <div className="mt-2">
                      <div className="font-medium text-[#1e4676] mb-2 text-[14px]">Added Accounts ({accounts.length})</div>
                      <div className="border border-[#c4d4ec] rounded-md overflow-hidden shadow-xs">
                        <table className="w-full text-left text-[13px] border-collapse">
                          <thead className="bg-[#eef2f9] border-b border-[#c4d4ec]">
                            <tr>
                              <th className="p-3 font-medium text-black">Client Name</th>
                              <th className="p-3 font-medium text-black">Account Number</th>
                              <th className="p-3 font-medium text-black">Bank (IFSC)</th>
                              <th className="p-3 font-medium text-black">Branch</th>
                              <th className="p-3 font-medium text-black">Amount</th>
                              <th className="p-3 font-medium text-black">AED</th>
                              <th className="p-3 font-medium text-black text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {accounts.map((acc, idx) => {
                              const inr = parseFloat(String(acc.orderAmount || 0).replace(/,/g, '')) || 0;
                              const rate = parseFloat(String(acc.confirmOrderAmount || 0).replace(/,/g, '')) || 0;
                              const aed = rate > 0 ? (inr / rate) : (parseFloat(String((acc as any).aedAmount || 0).replace(/,/g, '')) || 0);

                              return (
                                <tr key={idx} className="border-b border-[#e4e4e4] last:border-0 hover:bg-[#f9fafc] bg-white">
                                  <td className="p-3 border-r border-[#e4e4e4]">{acc.clientName}</td>
                                  <td className="p-3 border-r border-[#e4e4e4]">{acc.accountNumber}</td>
                                  <td className="p-3 border-r border-[#e4e4e4]">{acc.bankName} ({acc.ifscCode})</td>
                                  <td className="p-3 border-r border-[#e4e4e4]">{acc.branchName}</td>
                                  <td className="p-3 border-r border-[#e4e4e4] font-medium text-[#1e4676]">
                                    ₹{inr.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="p-3 border-r border-[#e4e4e4] font-semibold text-gray-800">
                                    {aed > 0 ? `${aed.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED` : '-'}
                                  </td>
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
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-[#eef2f9] border-t-2 border-[#c4d4ec] font-bold text-[13px]">
                            <tr>
                              <td colSpan={4} className="p-3 text-right text-[#1e4676] uppercase tracking-wider text-[12px] border-r border-[#c4d4ec]">
                                Total:
                              </td>
                              <td className="p-3 text-[#1e4676] border-r border-[#c4d4ec]">
                                ₹{totalAddedInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-[#0f5132] border-r border-[#c4d4ec]">
                                {totalAddedAed.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
                              </td>
                              <td className="p-3 text-center text-gray-500 text-[11px] font-normal italic">
                                ({accounts.length} {accounts.length === 1 ? 'account' : 'accounts'})
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* Buttons */}
                <div className="flex gap-4 mt-2">
                  <button 
                    onClick={handleGo}
                    disabled={isSubmitting}
                    className={`bg-[#1a4a8c] text-white rounded-md px-6 py-2 shadow-sm font-medium hover:bg-[#153970] transition-opacity ${
                      isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (editingOrderId ? 'Updating...' : 'Processing...') : (editingOrderId ? 'Update Order' : existingDailyOrder ? `Append to ${existingDailyOrder.order_no || 'Order'} (Go)` : 'Create Order (Go)')}
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
                    <div className="font-bold text-[#1e4676]">{existingDailyOrder ? `Accounts Appended to Order ${orderRef} Successfully.` : `Order ${orderRef} Registered Successfully.`}</div>
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
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsReceivedAedModalOpen(false)}></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white shadow-2xl flex flex-col max-h-[90vh] max-w-xl w-full rounded-md overflow-hidden pointer-events-auto border border-[#c4d4ec]">
              {/* Header */}
              <div className="bg-[#eef2f9] px-6 py-4 font-bold text-black border-b border-[#c4d4ec] text-[16px] flex items-center justify-between">
                <span>{editingReceivedAedId ? 'Edit Received AED Entry' : 'Received AED Entry'}</span>
                <button
                  onClick={() => {
                    setIsReceivedAedModalOpen(false);
                    setEditingReceivedAedId(null);
                    setReceivedAedAmount('');
                    setModeOfTransaction('');
                    setCollectionStaff('');
                    setRemainingAed('');
                    setEntryDate(new Date().toISOString().slice(0, 10));
                  }}
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
                  <FinacleDatePicker
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="border border-[#c4d4ec] rounded-md h-[36px] px-3 bg-white w-full text-xs"
                  />

                  {/* Agent / Customer */}
                  <label className="font-medium text-black whitespace-nowrap">
                    Agent / Customer
                  </label>
                  <div className="w-full">
                    <input
                      list="received-aed-agent-list"
                      type="text"
                      placeholder="Search or enter Agent / Customer..."
                      autoComplete="off"
                      value={receivedAedAgent}
                      onChange={(e) => setReceivedAedAgent(e.target.value)}
                      className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none focus:border-[#1e4676] w-full text-xs"
                    />
                    <datalist id="received-aed-agent-list">
                      {customers.map((c) => (
                        <option key={c.id} value={`${c.name} (${c.id})`} />
                      ))}
                    </datalist>
                  </div>

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
                        if (editingReceivedAedId) {
                          await api.put(`/records/received-aed/${editingReceivedAedId}`, {
                            aed_amount: parseFloat(receivedAedAmount),
                            mode_of_txn: modeOfTransaction,
                            cash_staff: modeOfTransaction === 'BY CASH' ? collectionStaff.trim() : undefined,
                            remaining_amount: remainingAed ? parseFloat(remainingAed) : undefined,
                            entry_date: entryDate,
                            agent_customer: receivedAedAgent.trim() || undefined,
                          });
                          fetchReceivedAed(receivedAedPage, viewDateFilter, viewModeFilter);
                          fetchReceivedAedSummary(filterDate, filterAgent);
                        } else {
                          await api.post('/records/received-aed', {
                            aed_amount: parseFloat(receivedAedAmount),
                            mode_of_txn: modeOfTransaction,
                            cash_staff: modeOfTransaction === 'BY CASH' ? collectionStaff.trim() : undefined,
                            remaining_amount: remainingAed ? parseFloat(remainingAed) : undefined,
                            entry_date: entryDate,
                            agent_customer: receivedAedAgent.trim() || undefined,
                          });
                          if (isViewReceivedAedOpen) {
                            fetchReceivedAed(receivedAedPage, viewDateFilter, viewModeFilter);
                          }
                          fetchReceivedAedSummary(filterDate, filterAgent);
                        }
                        setIsReceivedAedModalOpen(false);
                        setEditingReceivedAedId(null);
                        setReceivedAedAmount('');
                        setModeOfTransaction('');
                        setCollectionStaff('');
                        setRemainingAed('');
                        setReceivedAedAgent('');
                        setEntryDate(new Date().toISOString().slice(0, 10));
                      } catch (err: any) {
                        alert(err?.response?.data?.error || 'Failed to save. Please try again.');
                      }
                    }}
                    className="bg-[#1a4a8c] text-white rounded-md px-6 py-2 shadow-sm font-medium hover:bg-[#153970] text-[13px]"
                  >
                    {editingReceivedAedId ? 'Update' : 'Submit'}
                  </button>
                  <button
                    onClick={() => {
                      setIsReceivedAedModalOpen(false);
                      setEditingReceivedAedId(null);
                      setReceivedAedAmount('');
                      setModeOfTransaction('');
                      setCollectionStaff('');
                      setRemainingAed('');
                      setReceivedAedAgent('');
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
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsViewReceivedAedOpen(false)}></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white shadow-2xl flex flex-col w-full max-w-5xl max-h-[85vh] rounded-md overflow-hidden pointer-events-auto border border-[#c4d4ec]">

              {/* Header */}
              <div className="bg-[#eef2f9] px-6 py-3 font-bold text-black border-b border-[#c4d4ec] text-[15px] flex items-center justify-between shrink-0">
                <span>Received AED Records</span>
                <button onClick={() => setIsViewReceivedAedOpen(false)} className="text-[#a51a1a] font-bold hover:underline text-[13px]">
                  Close (X)
                </button>
              </div>

              {/* Filters */}
              <div className="px-5 py-3 bg-[#f4f7fb] border-b border-[#c4d4ec] flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 bg-white border border-[#c4d4ec] px-2.5 py-1 rounded">
                  <span className="text-[#1e4676] font-bold text-[11px]">Date:</span>
                  <FinacleDatePicker
                    value={viewDateFilter}
                    onChange={(e) => { setViewDateFilter(e.target.value); fetchReceivedAed(1, e.target.value, viewModeFilter); }}
                    className="bg-white border border-[#c4d4ec] rounded px-2 py-0.5 text-xs text-gray-700 min-w-[125px] h-[26px]"
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
                        <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">Agent / Customer</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">AED Amount</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">Mode</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">Cash Staff</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">Remaining AED</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">Created By</th>
                        <th className="px-3 py-2 font-semibold whitespace-nowrap text-center">Action</th>
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
                          <td className="px-3 py-2 border-r border-[#e4e4e4] text-gray-600">{rec.created_by_name || '—'}</td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditReceivedAed(rec)}
                                className="text-[#1a4a8c] hover:underline font-bold text-[11px] cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteReceivedAed(rec.id)}
                                className="text-red-600 hover:underline font-bold text-[11px] cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#eef2f9] font-bold text-[#1e4676] border-t-2 border-[#c4d4ec]">
                        <td className="px-3 py-2 border-r border-[#c4d4ec]" colSpan={3}>Total ({receivedAedRecords.length} shown)</td>
                        <td className="px-3 py-2 border-r border-[#c4d4ec] whitespace-nowrap">
                          {receivedAedRecords.reduce((s, r) => s + parseFloat(r.aed_amount || 0), 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                        </td>
                        <td className="px-3 py-2 border-r border-[#c4d4ec]" colSpan={2}></td>
                        <td className="px-3 py-2 border-r border-[#c4d4ec] whitespace-nowrap">
                          {receivedAedRecords.reduce((s, r) => s + (r.remaining_amount != null ? parseFloat(r.remaining_amount || 0) : 0), 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                        </td>
                        <td className="px-3 py-2" colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {receivedAedTotal > 50 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-[#c4d4ec] bg-[#f4f7fb] shrink-0">
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

      <CostRateModal
        isOpen={isCostRateModalOpen}
        onClose={() => setIsCostRateModalOpen(false)}
        initialDate={filterDate || new Date().toISOString().slice(0, 10)}
        onRateSaved={handleCostRateSaved}
      />

    </div>
  );
}
