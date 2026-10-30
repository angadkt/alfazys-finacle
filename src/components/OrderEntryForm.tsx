import FinacleDatePicker from './FinacleDatePicker';
import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { FileSpreadsheet, FileText, Landmark, Plus, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { exportOrdersToExcel, exportOrdersToPdf } from '../utils/exportOrders';
import CostRateModal from './CostRateModal';
import FinacleSelect from './FinacleSelect';

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

  // Delete Individual Receiver State
  const [deleteReceiverTarget, setDeleteReceiverTarget] = useState<{
    orderId: string;
    orderNo: string;
    receiverIndex: number;
    clientName: string;
    accountNumber: string;
    inrAmount: string | number;
    aedAmount: string | number;
  } | null>(null);
  const [isDeletingReceiver, setIsDeletingReceiver] = useState(false);

  // View Orders State
  const [fetchedOrders, setFetchedOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [orderExecutionDate, setOrderExecutionDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [existingDailyOrder, setExistingDailyOrder] = useState<any | null>(null);

  const dateDisplayLabel = useMemo(() => {
    if (filterFromDate && filterToDate) {
      if (filterFromDate === filterToDate) {
        return filterFromDate;
      }
      return `${filterFromDate} to ${filterToDate}`;
    }
    if (filterFromDate) return `From ${filterFromDate}`;
    if (filterToDate) return `Up to ${filterToDate}`;
    return 'All dates';
  }, [filterFromDate, filterToDate]);

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
  const [editingReceivedAedId, setEditingReceivedAedId] = useState<number | null>(null);
  const [receivedAedAmount, setReceivedAedAmount] = useState('');
  const [modeOfTransaction, setModeOfTransaction] = useState('');
  const [collectionStaff, setCollectionStaff] = useState('');
  const [remainingAed, setRemainingAed] = useState('');
  const [receivedAedAgent, setReceivedAedAgent] = useState('');
  const [receivedAedUtrNo, setReceivedAedUtrNo] = useState('');
  const [receivedAedDescription, setReceivedAedDescription] = useState('');
  const [receivedAedBalanceInfo, setReceivedAedBalanceInfo] = useState<{
    booked_aed: number;
    already_received_aed: number;
    pending_aed: number;
  } | null>(null);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isCostRateModalOpen, setIsCostRateModalOpen] = useState(false);
  const [currentCostRate, setCurrentCostRate] = useState<number | null>(null);

  // Option A: Auto-fetch agent balance on receivedAedAgent, entryDate, or modal open
  useEffect(() => {
    if (!isReceivedAedModalOpen || !receivedAedAgent.trim()) {
      setReceivedAedBalanceInfo(null);
      return;
    }

    let active = true;
    const fetchBalance = async () => {
      try {
        const res = await api.get('/records/received-aed/agent-balance', {
          params: {
            agent: receivedAedAgent.trim(),
            date: entryDate,
            exclude_id: editingReceivedAedId || undefined,
          },
        });
        if (active && res.data) {
          const info = {
            booked_aed: parseFloat(res.data.booked_aed) || 0,
            already_received_aed: parseFloat(res.data.already_received_aed) || 0,
            pending_aed: parseFloat(res.data.pending_aed) || 0,
          };
          setReceivedAedBalanceInfo(info);

          // Option A: Remaining AED = max(0, pending_aed - current aedAmount)
          const currentAed = parseFloat(receivedAedAmount) || 0;
          const rem = Math.max(0, Math.round((info.pending_aed - currentAed) * 100) / 100);
          setRemainingAed(rem > 0 ? rem.toFixed(2) : '0.00');
        }
      } catch {
        /* silent */
      }
    };

    fetchBalance();
    return () => {
      active = false;
    };
  }, [isReceivedAedModalOpen, receivedAedAgent, entryDate, editingReceivedAedId]);

  const handleOrderReceivedAedAmountChange = (val: string) => {
    setReceivedAedAmount(val);
    if (receivedAedBalanceInfo) {
      const num = parseFloat(val) || 0;
      const rem = Math.max(0, Math.round((receivedAedBalanceInfo.pending_aed - num) * 100) / 100);
      setRemainingAed(rem > 0 ? rem.toFixed(2) : '0.00');
    }
  };

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
    const d = filterToDate || filterFromDate || new Date().toISOString().slice(0, 10);
    fetchCostRate(d);
  }, [filterFromDate, filterToDate]);

  const handleCostRateSaved = (_date: string, rate: number) => {
    setCurrentCostRate(rate);
  };

  const [receivedAedTotalSum, setReceivedAedTotalSum] = useState<number>(0);

  const fetchReceivedAedSummary = async (date = (filterToDate || filterFromDate), agentId = filterAgent) => {
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
    fetchReceivedAedSummary(filterToDate || filterFromDate, filterAgent);
  }, [filterFromDate, filterToDate, filterAgent, customers]);

  // View Received AED
  const [isViewReceivedAedOpen, setIsViewReceivedAedOpen] = useState(false);
  const [receivedAedRecords, setReceivedAedRecords] = useState<any[]>([]);
  const [receivedAedTotal, setReceivedAedTotal] = useState(0);
  const [receivedAedPage, setReceivedAedPage] = useState(1);
  const [receivedAedLoading, setReceivedAedLoading] = useState(false);
  const [viewDateFilter, setViewDateFilter] = useState('');
  const [viewModeFilter, setViewModeFilter] = useState('');

  const handleEditReceivedAed = (rec: any) => {
    setEditingReceivedAedId(rec.id);
    setEntryDate(rec.entry_date ? String(rec.entry_date).slice(0, 10) : new Date().toISOString().slice(0, 10));
    setReceivedAedAgent(rec.agent_customer || "");
    setReceivedAedAmount(String(rec.aed_amount || ''));
    setModeOfTransaction(rec.mode_of_txn || '');
    setCollectionStaff(rec.cash_staff || '');
    setRemainingAed(rec.remaining_amount != null ? String(rec.remaining_amount) : '');
    setReceivedAedUtrNo(rec.utr_no || '');
    setReceivedAedDescription(rec.description || '');
    setIsReceivedAedModalOpen(true);
  };

  const handleDeleteReceivedAed = async (id: number) => {
    if (!confirm('Are you sure you want to delete this Received AED entry?')) return;
    try {
      await api.delete(`/records/received-aed/${id}`);
      fetchReceivedAed(receivedAedPage, viewDateFilter, viewModeFilter);
      fetchReceivedAedSummary(filterToDate || filterFromDate, filterAgent);
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
      setReceivedAedRecords(res.data?.records || []);
      setReceivedAedTotal(res.data?.total || 0);
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
    fromDate = filterFromDate,
    toDate = filterToDate,
    agent = filterAgent
  ) => {
    setLoadingOrders(true);
    try {
      let url = `/records/orders?page=${page}&limit=20&search=${encodeURIComponent(search)}`;
      if (fromDate) url += `&from_date=${encodeURIComponent(fromDate)}`;
      if (toDate) url += `&to_date=${encodeURIComponent(toDate)}`;
      if (agent) url += `&party_id=${encodeURIComponent(agent)}`;

      const res = await api.get(url);
      let records = res.data.records || [];

      // Fallback client-side filter
      if (fromDate || toDate) {
        records = records.filter((o: any) => {
          const od = (o.order_date || '').slice(0, 10);
          if (fromDate && od < fromDate) return false;
          if (toDate && od > toDate) return false;
          return true;
        });
      }
      if (agent) {
        records = records.filter((o: any) => String(o.party_id) === String(agent));
      }

      setFetchedOrders(records);
      setCurrentPage(res.data.page || 1);
      setTotalPages(Math.ceil((res.data.total || 0) / (res.data.limit || 20)) || 1);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setFetchedOrders([]);
      setCurrentPage(1);
      setTotalPages(1);
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
        const verified = (res.data?.records || []).filter((c: any) => c.status === 'verified');
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
      fetchOrders(currentPage, searchQuery, filterFromDate, filterToDate, filterAgent);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery, filterFromDate, filterToDate, filterAgent, currentPage]);

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

  const handleConfirmDeleteReceiver = async () => {
    if (!deleteReceiverTarget) return;
    const { orderId, receiverIndex } = deleteReceiverTarget;
    const order = fetchedOrders.find(o => String(o.id) === String(orderId));
    if (!order) return;

    let recs = order.receivers_data;
    if (typeof recs === 'string') {
      try { recs = JSON.parse(recs); } catch { recs = []; }
    }
    if (!Array.isArray(recs)) return;

    const remainingAccounts = recs.filter((_, idx) => idx !== receiverIndex);

    setIsDeletingReceiver(true);
    try {
      const apiPayload = {
        party_id: order.party_id || null,
        buyer_id: order.buyer_id || null,
        txn: order.txn || "gateway",
        order_date: order.order_date ? order.order_date.split('T')[0] : new Date().toLocaleDateString('en-CA'),
        account_id: order.account_id || null,
        transaction_through: order.transaction_through || null,
        payment_status: order.payment_status || "Pending",
        accounts: remainingAccounts,
        note: order.note || "Order marking the sale yet to happen"
      };

      const res = await api.put(`/records/orders/${orderId}`, apiPayload);
      const updatedRecord = res.data?.record;
      if (updatedRecord) {
        setFetchedOrders(prev => prev.map(item =>
          String(item.id) === String(orderId) ? { ...item, ...updatedRecord } : item
        ));
      }
      fetchOrders(currentPage, searchQuery, filterFromDate, filterToDate, filterAgent);
      setDeleteReceiverTarget(null);
    } catch (err: any) {
      alert('Failed to delete receiver: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsDeletingReceiver(false);
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
        const execDate = orderExecutionDate || new Date().toLocaleDateString('en-CA');
        const isOutOfRange = (filterFromDate && execDate < filterFromDate) || (filterToDate && execDate > filterToDate);
        if (isOutOfRange) {
          setFilterFromDate('');
          setFilterToDate('');
          fetchOrders(1, searchQuery, '', '', filterAgent);
        } else {
          fetchOrders(1, searchQuery, filterFromDate, filterToDate, filterAgent);
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
        if (filterFromDate) url += `&from_date=${encodeURIComponent(filterFromDate)}`;
        if (filterToDate) url += `&to_date=${encodeURIComponent(filterToDate)}`;
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
      if (filterFromDate || filterToDate) {
        allRecords = allRecords.filter((o: any) => {
          const od = (o.order_date || '').slice(0, 10);
          if (filterFromDate && od < filterFromDate) return false;
          if (filterToDate && od > filterToDate) return false;
          return true;
        });
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

  const fetchReceivedEntriesForExport = async (agentName: string) => {
    try {
      const params: any = { limit: 200 };
      if (filterFromDate) params.from_date = filterFromDate;
      if (filterToDate) params.to_date = filterToDate;
      if (agentName && agentName !== 'ALL AGENTS') {
        params.agent_customer = agentName;
      }
      const res = await api.get('/records/received-aed', { params });
      return res.data?.records || [];
    } catch {
      return [];
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
      const selectedCustomer = customers.find(c => String(c.internal_id) === String(filterAgent) || c.id === filterAgent);
      const agentCleanName = selectedCustomer ? selectedCustomer.name : (filterAgent ? filterAgent : 'ALL AGENTS');
      const receivedEntries = await fetchReceivedEntriesForExport(agentCleanName);

      const effectiveRecAed = receivedAedTotalSum || receivedEntries.reduce((s: number, r: any) => s + parseFloat(r.aed_amount || 0), 0);

      exportOrdersToExcel(orders, {
        filterDate: dateDisplayLabel,
        filterAgent: selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.id})` : filterAgent,
        agentName: agentCleanName,
        dateRangeLabel: dateDisplayLabel,
        receivedEntries,
        summaryMetrics: {
          totalAed,
          receivedAed: effectiveRecAed,
          balanceAed: totalAed - effectiveRecAed,
          transferredInr,
          commissionRate: 0,
          commissionAmount: 0
        },
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
      const selectedCustomer = customers.find(c => String(c.internal_id) === String(filterAgent) || c.id === filterAgent);
      const agentCleanName = selectedCustomer ? selectedCustomer.name : (filterAgent ? filterAgent : 'ALL AGENTS');
      const receivedEntries = await fetchReceivedEntriesForExport(agentCleanName);

      const effectiveRecAed = receivedAedTotalSum || receivedEntries.reduce((s: number, r: any) => s + parseFloat(r.aed_amount || 0), 0);

      exportOrdersToPdf(orders, {
        filterDate: dateDisplayLabel,
        filterAgent: selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.id})` : filterAgent,
        agentName: agentCleanName,
        dateRangeLabel: dateDisplayLabel,
        receivedEntries,
        summaryMetrics: {
          totalAed,
          receivedAed: effectiveRecAed,
          balanceAed: totalAed - effectiveRecAed,
          transferredInr,
          commissionRate: 0,
          commissionAmount: 0
        },
        searchQuery
      });
    } catch (err: any) {
      alert('Failed to generate PDF file: ' + err.message);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden text-xs select-none">
      
      {/* 1. Header Bar */}
      <div className="bg-white px-5 md:px-8 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#0E498C] text-white flex items-center justify-center shadow-xs">
            <Landmark className="w-5 h-5 text-[#FFB800]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
                Order Entry Management
              </h1>
              <span className="bg-[#FFB800] text-black font-extrabold text-[10px] px-2 py-0.5 rounded shadow-2xs tracking-wider">
                ORDER-ENTRY
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              FINCORE Universal Settlement Module • Order Booking &amp; Trade Remittance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#f0f4f8] border border-[#c4d4ec] px-2.5 py-1 rounded">
            <span className="font-bold text-[#0E498C] text-[11px] shrink-0">Function:</span>
            <FinacleSelect 
              value={selectedFunction} 
              onChange={(e) => setSelectedFunction(e.target.value)}
              options={[
                { value: "A-ADD", label: "A-ADD (Create New Order)" },
                { value: "V-VIEW", label: "V-VIEW (Inquire Orders)" },
                { value: "M-MODIFY", label: "M-MODIFY (Update Order)" },
                { value: "X-CANCEL", label: "X-CANCEL (Void Order)" },
              ]}
              triggerClassName="border border-[#c4d4ec] bg-white text-gray-800 px-2 h-[26px] text-xs min-w-[170px] rounded"
            />
          </div>

          <button
            type="button"
            onClick={() => { fetchOrders(currentPage, searchQuery); }}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors border border-gray-300 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => { setIsFormModalOpen(true); }}
            className="flex items-center gap-1.5 bg-[#0E498C] hover:bg-[#00A2E8] border border-[#00B5E2]/40 text-white px-3.5 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#FFB800]" />
            <span>Add Order Entry</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area under Header Bar */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        {/* Main Workspace */}
        <div className="flex-1 overflow-y-auto p-4 md:px-8 custom-scrollbar bg-slate-50 flex flex-col">
          <div className="bg-white border border-[#c4d4ec] rounded shadow-2xs overflow-hidden flex flex-col flex-1 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-bold text-[#104080] text-sm tracking-wide">Fetched Orders List</h3>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Date Filter (Option A: From & To Range with Single-Day / Today Shortcut) */}
                <div className="flex items-center gap-1.5 bg-[#f0f4f8] border border-[#c4d4ec] px-2 py-1 rounded">
                  <span className="text-[#104080] font-bold text-[11px]">From:</span>
                  <FinacleDatePicker
                    value={filterFromDate}
                    onChange={(e) => {
                      setFilterFromDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-[#c4d4ec] rounded px-1.5 py-0.5 text-xs text-gray-700 min-w-[115px] h-[26px]"
                  />

                  <span className="text-[#104080] font-bold text-[11px] ml-0.5">To:</span>
                  <FinacleDatePicker
                    value={filterToDate}
                    onChange={(e) => {
                      setFilterToDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-[#c4d4ec] rounded px-1.5 py-0.5 text-xs text-gray-700 min-w-[115px] h-[26px]"
                  />

                  {/* Quick Shortcut Buttons */}
                  <div className="flex items-center gap-1 ml-0.5 border-l border-[#c4d4ec] pl-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const todayStr = new Date().toLocaleDateString('en-CA');
                        setFilterFromDate(todayStr);
                        setFilterToDate(todayStr);
                        setCurrentPage(1);
                        fetchOrders(1, searchQuery, todayStr, todayStr, filterAgent);
                      }}
                      className="bg-[#104080] hover:bg-[#0c3266] text-white px-2 py-0.5 text-[10px] font-bold rounded shadow-2xs cursor-pointer transition-colors"
                      title="Filter for Today's Orders (Single Day)"
                    >
                      Today
                    </button>

                    {(filterFromDate || filterToDate) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterFromDate('');
                          setFilterToDate('');
                          setCurrentPage(1);
                          fetchOrders(1, searchQuery, '', '', filterAgent);
                        }}
                        className="text-gray-400 hover:text-red-600 font-bold text-xs px-1 cursor-pointer"
                        title="Clear Date Filter (Show All Dates)"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>

                {/* Agent / Customer Filter */}
                <div className="flex items-center gap-1.5 bg-[#f0f4f8] border border-[#c4d4ec] px-2 py-0.5 rounded">
                  <span className="text-[#104080] font-bold text-[11px] whitespace-nowrap">Agent:</span>
                  <FinacleSelect
                    value={filterAgent}
                    onChange={(e) => {
                      setFilterAgent(e.target.value);
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: "", label: "All Agents / Customers" },
                      ...customers.map((c) => ({
                        value: String(c.internal_id),
                        label: `${c.name} (${c.id})`,
                      })),
                    ]}
                    triggerClassName="bg-white border border-[#c4d4ec] rounded px-1.5 py-0.5 text-xs text-gray-700 min-w-[150px] max-w-[200px] h-[26px]"
                  />
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
                    className="border border-[#c4d4ec] pl-3 pr-6 py-1 rounded text-xs focus:outline-none focus:border-[#104080] w-64 sm:w-72"
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
                {(filterFromDate !== '' || filterToDate !== '' || filterAgent || searchQuery) && (
                  <button
                    onClick={() => {
                      setFilterFromDate('');
                      setFilterToDate('');
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
                      <span className="font-semibold text-gray-600">{dateDisplayLabel}</span>
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
                <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#104080] mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#104080]"></span>
                  INR Remittances (Beneficiary Payouts)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {/* 4. Total INR */}
                  <div className="bg-[#f8f9fc] border border-[#c4d4ec] rounded-sm px-2.5 py-1.5 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#104080]">Total INR Amount</span>
                        <span className="text-[9px] font-bold text-[#104080] bg-[#eef3fb] border border-[#c4d4ec] px-1.5 py-0.2 rounded-full">
                          Total Obligation
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[10px] font-bold text-[#104080]">INR</span>
                        <span className="text-[15px] font-extrabold text-[#104080] tracking-tight font-mono">
                          ₹ {totalInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="text-[9px] text-gray-500 mt-1.5 pt-1 border-t border-[#d8e2ef] flex items-center justify-between">
                      <span>Remittance Volume</span>
                      <span className="font-semibold text-gray-600">{dateDisplayLabel}</span>
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
                  <tr className="bg-[#0E498C] text-white">
                    <th className="p-2 border border-[#00B5E2]/30 w-6"></th>
                    <th className="p-2 border border-[#00B5E2]/30">Order No</th>
                    <th className="p-2 border border-[#00B5E2]/30">Date</th>
                    <th className="p-2 border border-[#00B5E2]/30">Agent/Customer</th>
                    <th className="p-2 border border-[#00B5E2]/30">Receivers</th>
                    <th className="p-2 border border-[#00B5E2]/30">AED Total</th>
                    <th className="p-2 border border-[#00B5E2]/30">INR Total</th>
                    <th className="p-2 border border-[#00B5E2]/30">Txn Through</th>
                    <th className="p-2 border border-[#00B5E2]/30">Issued By</th>
                    <th className="p-2 border border-[#00B5E2]/30">Verified By</th>
                    <th className="p-2 border border-[#00B5E2]/30">Verification</th>
                    <th className="p-2 border border-[#00B5E2]/30">Payment</th>
                    <th className="p-2 border border-[#00B5E2]/30">Action</th>
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
                            isExpanded ? 'bg-[#EBF6FC] border-l-4 border-l-[#0E498C]' : 'hover:bg-[#EBF6FC]'
                          }`}
                          onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                        >
                          {/* Expand toggle */}
                          <td className="p-2 border border-[#c4d4ec] text-center text-[#0E498C] font-bold select-none">
                            {isExpanded ? '▾' : '▸'}
                          </td>
                          <td className="p-2 border border-[#c4d4ec] font-bold text-blue-800 whitespace-nowrap">{o.order_no}</td>
                          <td className="p-2 border border-[#c4d4ec] font-bold whitespace-nowrap">{(o.order_date || '').split('T')[0]}</td>
                          <td className="p-2 border border-[#c4d4ec] font-bold text-gray-900">{o.party_name || o.party_id || 'N/A'}</td>
                          <td className="p-2 border border-[#c4d4ec]">
                            <span className="bg-[#e8eef8] text-[#104080] border border-[#c4d4ec] text-[10px] font-bold px-2 py-0.5 rounded-full">
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
                                <div className="text-[11px] font-extrabold text-[#104080] uppercase tracking-wider mb-2">
                                  Receiver Payment Details — {o.order_no}
                                </div>
                                {recs.length === 0 ? (
                                  <div className="text-[11px] text-gray-400 italic">No receiver data stored.</div>
                                ) : (
                                  <table className="w-full text-left border-collapse text-[11px]">
                                    <thead>
                                      <tr className="bg-[#dce6f7] text-[#104080]">
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
                                        {isAdmin && (
                                          <th className="p-1.5 border border-[#c4d4ec] font-bold text-center">Action</th>
                                        )}
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
                                              <div onClick={(e) => e.stopPropagation()}>
                                                <FinacleSelect
                                                  value={recStatus}
                                                  onChange={async (e) => {
                                                    await handleReceiverPaymentStatus(o.id, idx, e.target.value);
                                                  }}
                                                  options={[
                                                    { value: "Pending", label: "Pending" },
                                                    { value: "Paid", label: "Paid" },
                                                    { value: "Partial", label: "Partial" },
                                                    { value: "Cancelled", label: "Cancelled" },
                                                  ]}
                                                  triggerClassName={`text-[11px] font-bold rounded px-1.5 py-0.5 border h-[24px] w-full ${recColor}`}
                                                />
                                              </div>
                                              {recStatus.toLowerCase() === 'partial' && (
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReceiverPaymentStatus(o.id, idx, 'Partial');
                                                  }}
                                                  className="text-[9.5px] text-[#104080] hover:underline font-semibold block mt-1"
                                                  title="Click to edit transferred amount"
                                                >
                                                  Edit Paid: ₹{(parseFloat(rec.paid_amount) || 0).toLocaleString('en-IN')}
                                                </button>
                                              )}
                                            </td>
                                            {isAdmin && (
                                              <td className="p-1.5 border border-[#c4d4ec] text-center" onClick={e => e.stopPropagation()}>
                                                <button
                                                  type="button"
                                                  onClick={() => setDeleteReceiverTarget({
                                                    orderId: String(o.id),
                                                    orderNo: o.order_no || `OR-${o.id}`,
                                                    receiverIndex: idx,
                                                    clientName: rec.clientName || 'Beneficiary',
                                                    accountNumber: rec.accountNumber || '-',
                                                    inrAmount: rec.orderAmount || 0,
                                                    aedAmount: recAed
                                                  })}
                                                  className="bg-white border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-600 font-bold px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer shadow-2xs"
                                                  title="Delete this beneficiary from order"
                                                >
                                                  Delete
                                                </button>
                                              </td>
                                            )}
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
                <div className="flex items-center justify-end gap-4 mt-4 text-[12px] text-[#104080]">
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
              <div className="bg-[#0E498C] px-6 py-4 font-bold text-white border-b border-[#00B5E2]/40 text-[16px] flex items-center justify-between">
                <span>Custom Order Entry Form</span>
                <button onClick={() => setIsFormModalOpen(false)} className="text-white/80 hover:text-white hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer text-xs font-bold">
                  ✕ Close
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
                      <FinacleSelect 
                        value={selectedFunction}
                        onChange={(e) => setSelectedFunction(e.target.value)}
                        options={[
                          { value: "A-ADD", label: "A-ADD (New Order Booking)" },
                          { value: "V-VIEW", label: "V-VIEW (Order Inquiry)" },
                          { value: "M-MODIFY", label: "M-MODIFY (Amend Order)" },
                          { value: "X-CANCEL", label: "X-CANCEL (Cancel Order)" },
                        ]}
                        triggerClassName="w-[240px] border border-[#c4d4ec] bg-white text-black rounded-md h-[36px] px-2 text-xs"
                      />
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
                      <FinacleSelect 
                        value={transactionThrough}
                        onChange={(e) => setTransactionThrough(e.target.value)}
                        placeholder="Select Mode..."
                        options={[
                          { value: "", label: "-- None --" },
                          { value: "CDM", label: "CDM" },
                          { value: "BNK SLP", label: "BNK SLP" },
                          { value: "FINAC", label: "FINAC" },
                          { value: "BY CASH", label: "BY CASH" },
                          { value: "MOB TRF", label: "MOB TRF" },
                          { value: "UPI", label: "UPI" },
                          { value: "COR NET", label: "COR NET" },
                        ]}
                        triggerClassName="w-[240px] border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase text-xs"
                      />
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
                      <div className="font-medium text-[#104080] mb-2 text-[14px]">Added Accounts ({accounts.length})</div>
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
                                  <td className="p-3 border-r border-[#e4e4e4] font-medium text-[#104080]">
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
                              <td colSpan={4} className="p-3 text-right text-[#104080] uppercase tracking-wider text-[12px] border-r border-[#c4d4ec]">
                                Total:
                              </td>
                              <td className="p-3 text-[#104080] border-r border-[#c4d4ec]">
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
                    <div className="font-bold text-[#104080]">{existingDailyOrder ? `Accounts Appended to Order ${orderRef} Successfully.` : `Order ${orderRef} Registered Successfully.`}</div>
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
              <div className="bg-[#0E498C] px-6 py-4 font-bold text-white border-b border-[#00B5E2]/40 text-[16px] flex items-center justify-between">
                <span>{editingReceivedAedId ? 'Edit Received AED Entry' : 'Received AED Entry'}</span>
                <button
                  onClick={() => {
                    setIsReceivedAedModalOpen(false);
                    setEditingReceivedAedId(null);
                    setReceivedAedAmount('');
                    setModeOfTransaction('');
                    setCollectionStaff('');
                    setRemainingAed('');
                    setReceivedAedAgent('');
                    setReceivedAedUtrNo('');
                    setReceivedAedDescription('');
                    setReceivedAedBalanceInfo(null);
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
                      className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none focus:border-[#104080] w-full text-xs"
                    />
                    <datalist id="received-aed-agent-list">
                      {customers.map((c) => (
                        <option key={c.id} value={`${c.name} (${c.id})`} />
                      ))}
                    </datalist>
                  </div>

                  {/* Option A Calculation Info Banner */}
                  {receivedAedBalanceInfo && (
                    <div className="col-span-2 -my-1 p-2.5 bg-[#e2ebf6] rounded border border-[#b6cded] text-[11px] text-[#104080] flex flex-wrap items-center justify-between gap-2 shadow-xs">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>Booked: <strong>{receivedAedBalanceInfo.booked_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong></span>
                        <span className="text-gray-400">•</span>
                        <span>Already Received: <strong>{receivedAedBalanceInfo.already_received_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong></span>
                        <span className="text-gray-400">•</span>
                        <span className="text-[#0d6e5a]">Pending: <strong>{receivedAedBalanceInfo.pending_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong></span>
                      </div>
                      <span className="bg-[#104080] text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">
                        OPTION A AUTO-CALCULATED
                      </span>
                    </div>
                  )}

                  {/* AED Amount Received */}
                  <label className="font-medium text-black whitespace-nowrap">
                    AED Amount Received <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={receivedAedAmount}
                    onChange={(e) => handleOrderReceivedAedAmountChange(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white focus:outline-none focus:border-[#104080] w-full font-bold"
                  />

                  {/* Mode of Transaction */}
                  <label className="font-medium text-black whitespace-nowrap">
                    Mode of Transaction <span className="text-red-600">*</span>
                  </label>
                  <FinacleSelect
                    value={modeOfTransaction}
                    onChange={(e) => {
                      setModeOfTransaction(e.target.value);
                      if (e.target.value !== 'BY CASH') setCollectionStaff('');
                    }}
                    placeholder="Select Mode..."
                    options={[
                      { value: "CDM", label: "CDM" },
                      { value: "BNK SLP", label: "BNK SLP" },
                      { value: "FINAC", label: "FINAC" },
                      { value: "BY CASH", label: "BY CASH" },
                      { value: "MOB TRF", label: "MOB TRF" },
                      { value: "UPI", label: "UPI" },
                      { value: "COR NET", label: "COR NET" },
                    ]}
                    triggerClassName="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase w-full"
                  />

                  {/* UTR / Reference No */}
                  <label className="font-medium text-black whitespace-nowrap">
                    UTR / Reference No
                  </label>
                  <input
                    type="text"
                    value={receivedAedUtrNo}
                    onChange={(e) => setReceivedAedUtrNo(e.target.value)}
                    placeholder="e.g. UTR / Bank Reference No"
                    className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none focus:border-[#104080] w-full text-xs"
                  />

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
                        className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none focus:border-[#104080] w-full"
                      />
                    </>
                  )}

                  {/* Remaining Amount AED */}
                  <label className="font-medium text-black whitespace-nowrap">
                    Remaining Amount AED
                  </label>
                  <div className="w-full">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={remainingAed}
                      onChange={(e) => setRemainingAed(e.target.value)}
                      placeholder="0.00"
                      className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white focus:outline-none focus:border-[#104080] w-full"
                    />
                    <span className="text-[10px] text-gray-500 italic mt-0.5 block">
                      Auto-calculated from Booked AED − Received AED − This Entry. Editable if manual override is needed.
                    </span>
                  </div>

                  {/* Description */}
                  <label className="font-medium text-black whitespace-nowrap">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={receivedAedDescription}
                    onChange={(e) => setReceivedAedDescription(e.target.value)}
                    placeholder="Enter remarks or description..."
                    className="border border-[#c4d4ec] rounded-md p-2 bg-white focus:outline-none focus:border-[#104080] w-full text-xs"
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
                        const payload = {
                          aed_amount: parseFloat(receivedAedAmount),
                          mode_of_txn: modeOfTransaction,
                          cash_staff: modeOfTransaction === 'BY CASH' ? collectionStaff.trim() : undefined,
                          remaining_amount: remainingAed ? parseFloat(remainingAed) : undefined,
                          entry_date: entryDate,
                          agent_customer: receivedAedAgent.trim() || undefined,
                          utr_no: receivedAedUtrNo.trim() || undefined,
                          description: receivedAedDescription.trim() || undefined,
                        };

                        if (editingReceivedAedId) {
                          await api.put(`/records/received-aed/${editingReceivedAedId}`, payload);
                          fetchReceivedAed(receivedAedPage, viewDateFilter, viewModeFilter);
                          fetchReceivedAedSummary(filterToDate || filterFromDate, filterAgent);
                        } else {
                          await api.post('/records/received-aed', payload);
                          if (isViewReceivedAedOpen) {
                            fetchReceivedAed(receivedAedPage, viewDateFilter, viewModeFilter);
                          }
                          fetchReceivedAedSummary(filterToDate || filterFromDate, filterAgent);
                        }
                        setIsReceivedAedModalOpen(false);
                        setEditingReceivedAedId(null);
                        setReceivedAedAmount('');
                        setModeOfTransaction('');
                        setCollectionStaff('');
                        setRemainingAed('');
                        setReceivedAedAgent('');
                        setReceivedAedUtrNo('');
                        setReceivedAedDescription('');
                        setReceivedAedBalanceInfo(null);
                        setEntryDate(new Date().toISOString().slice(0, 10));
                      } catch (err: any) {
                        alert(err?.response?.data?.error || 'Failed to save. Please try again.');
                      }
                    }}
                    className="bg-[#1a4a8c] text-white rounded-md px-6 py-2 shadow-sm font-medium hover:bg-[#153970] text-[13px] cursor-pointer"
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
                      setReceivedAedUtrNo('');
                      setReceivedAedDescription('');
                      setReceivedAedBalanceInfo(null);
                      setEntryDate(new Date().toISOString().slice(0, 10));
                    }}
                    className="bg-white border border-[#c4d4ec] text-[#1a4a8c] rounded-md px-6 py-2 font-medium shadow-sm hover:bg-[#f4f7fb] text-[13px] cursor-pointer"
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
              <div className="bg-[#0E498C] px-6 py-3 font-bold text-white border-b border-[#00B5E2]/40 text-[15px] flex items-center justify-between shrink-0">
                <span>Received AED Records</span>
                <button onClick={() => setIsViewReceivedAedOpen(false)} className="text-white/80 hover:text-white hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer text-xs font-bold">
                  ✕ Close
                </button>
              </div>

              {/* Filters */}
              <div className="px-5 py-3 bg-[#f4f7fb] border-b border-[#c4d4ec] flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 bg-white border border-[#c4d4ec] px-2.5 py-1 rounded">
                  <span className="text-[#104080] font-bold text-[11px]">Date:</span>
                  <FinacleDatePicker
                    value={viewDateFilter}
                    onChange={(e) => { setViewDateFilter(e.target.value); fetchReceivedAed(1, e.target.value, viewModeFilter); }}
                    className="bg-white border border-[#c4d4ec] rounded px-2 py-0.5 text-xs text-gray-700 min-w-[125px] h-[26px]"
                  />
                  {viewDateFilter && (
                    <button onClick={() => { setViewDateFilter(''); fetchReceivedAed(1, '', viewModeFilter); }} className="text-gray-400 hover:text-red-500 cursor-pointer">
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-[#c4d4ec] px-2 py-0.5 rounded">
                  <span className="text-[#104080] font-bold text-[11px] whitespace-nowrap">Mode:</span>
                  <FinacleSelect
                    value={viewModeFilter}
                    onChange={(e) => { setViewModeFilter(e.target.value); fetchReceivedAed(1, viewDateFilter, e.target.value); }}
                    options={[
                      { value: "", label: "All Modes" },
                      { value: "CDM", label: "CDM" },
                      { value: "BNK SLP", label: "BNK SLP" },
                      { value: "FINAC", label: "FINAC" },
                      { value: "BY CASH", label: "BY CASH" },
                      { value: "MOB TRF", label: "MOB TRF" },
                      { value: "UPI", label: "UPI" },
                      { value: "COR NET", label: "COR NET" },
                    ]}
                    triggerClassName="bg-white border border-[#c4d4ec] rounded px-1.5 py-0.5 text-xs text-gray-700 min-w-[120px] h-[26px]"
                  />
                  {viewModeFilter && (
                    <button onClick={() => { setViewModeFilter(''); fetchReceivedAed(1, viewDateFilter, ''); }} className="text-gray-400 hover:text-red-500 cursor-pointer">
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
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
                      <tr className="bg-[#104080] text-white text-left">
                        <th className="px-3 py-2 font-semibold border-r border-[#20549c] whitespace-nowrap">#</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#20549c] whitespace-nowrap">Date</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#20549c] whitespace-nowrap">Agent / Customer</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#20549c] whitespace-nowrap">AED Amount</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#20549c] whitespace-nowrap">Mode</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#20549c] whitespace-nowrap">UTR / Ref</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#20549c] whitespace-nowrap">Cash Staff</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#20549c] whitespace-nowrap">Remaining AED</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#20549c] whitespace-nowrap">Description</th>
                        <th className="px-3 py-2 font-semibold border-r border-[#20549c] whitespace-nowrap">Created By</th>
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
                          <td className="px-3 py-2 border-r border-[#e4e4e4] font-semibold text-gray-800">
                            {rec.agent_customer || <span className="text-gray-400 italic font-normal">—</span>}
                          </td>
                          <td className="px-3 py-2 border-r border-[#e4e4e4] font-bold text-[#0f5132] whitespace-nowrap">
                            {parseFloat(rec.aed_amount).toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                          </td>
                          <td className="px-3 py-2 border-r border-[#e4e4e4]">
                            <span className="bg-[#e8f0fb] text-[#104080] px-2 py-0.5 rounded font-medium">{rec.mode_of_txn}</span>
                          </td>
                          <td className="px-3 py-2 border-r border-[#e4e4e4] font-mono text-gray-700 text-xs">
                            {rec.utr_no || <span className="text-gray-400 font-sans">—</span>}
                          </td>
                          <td className="px-3 py-2 border-r border-[#e4e4e4]">{rec.cash_staff || <span className="text-gray-400">—</span>}</td>
                          <td className="px-3 py-2 border-r border-[#e4e4e4] whitespace-nowrap font-bold text-[#b45309]">
                            {rec.remaining_amount != null
                              ? parseFloat(rec.remaining_amount).toLocaleString('en-AE', { minimumFractionDigits: 2 }) + ' AED'
                              : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-3 py-2 border-r border-[#e4e4e4] text-gray-600 text-xs max-w-[180px] truncate" title={rec.description || ''}>
                            {rec.description || <span className="text-gray-400">—</span>}
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
                      <tr className="bg-[#eef2f9] font-bold text-[#104080] border-t-2 border-[#c4d4ec]">
                        <td className="px-3 py-2 border-r border-[#c4d4ec]" colSpan={3}>Total ({receivedAedRecords.length} shown)</td>
                        <td className="px-3 py-2 border-r border-[#c4d4ec] whitespace-nowrap text-[#0f5132]">
                          {receivedAedRecords.reduce((s, r) => s + parseFloat(r.aed_amount || 0), 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                        </td>
                        <td className="px-3 py-2 border-r border-[#c4d4ec]" colSpan={3}></td>
                        <td className="px-3 py-2 border-r border-[#c4d4ec] whitespace-nowrap text-[#b45309]">
                          {receivedAedRecords.reduce((s, r) => s + (r.remaining_amount != null ? parseFloat(r.remaining_amount || 0) : 0), 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                        </td>
                        <td className="px-3 py-2" colSpan={3}></td>
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
        initialDate={(filterToDate || filterFromDate) || new Date().toISOString().slice(0, 10)}
        onRateSaved={handleCostRateSaved}
      />

      {/* Confirm Delete Receiver Modal (Admin/Super Admin only) */}
      {deleteReceiverTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
            onClick={() => !isDeletingReceiver && setDeleteReceiverTarget(null)}
          ></div>
          <div className="bg-white border border-[#0E498C] rounded-md shadow-2xl z-10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Title Bar */}
            <div className="bg-[#0E498C] text-white px-4 py-2 flex items-center justify-between border-b border-[#00B5E2]/40">
              <div className="flex items-center gap-2 font-bold text-sm tracking-wide">
                <AlertTriangle className="w-4 h-4 text-[#FFB800]" />
                <span>Confirm Beneficiary Deletion</span>
              </div>
              <button 
                type="button"
                onClick={() => !isDeletingReceiver && setDeleteReceiverTarget(null)}
                className="text-white/80 hover:text-white hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer text-xs font-bold leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 text-xs text-gray-700 space-y-4">
              <p className="text-[13px] text-gray-800">
                Are you sure you want to permanently delete this beneficiary from Order <strong className="text-[#104080] font-bold">{deleteReceiverTarget.orderNo}</strong>?
              </p>

              {/* Summary Card */}
              <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded p-3 space-y-2">
                <div className="flex justify-between border-b border-[#e2e8f0] pb-1.5">
                  <span className="text-gray-500 font-medium">Client / Beneficiary:</span>
                  <span className="font-bold text-gray-900">{deleteReceiverTarget.clientName}</span>
                </div>
                <div className="flex justify-between border-b border-[#e2e8f0] pb-1.5">
                  <span className="text-gray-500 font-medium">Account Number:</span>
                  <span className="font-mono font-bold text-gray-900">{deleteReceiverTarget.accountNumber}</span>
                </div>
                <div className="flex justify-between border-b border-[#e2e8f0] pb-1.5">
                  <span className="text-gray-500 font-medium">INR Amount:</span>
                  <span className="font-bold text-black">₹{parseFloat(String(deleteReceiverTarget.inrAmount).replace(/,/g, '') || '0').toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">AED Amount:</span>
                  <span className="font-bold text-emerald-700">{deleteReceiverTarget.aedAmount} AED</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded text-[11px] leading-relaxed">
                <strong>Notice:</strong> This action permanently removes this entry from the database. The order's total INR, AED, and receiver count will automatically recalculate.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#f1f5f9] border-t border-[#cbd5e1] px-4 py-3 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingReceiver}
                onClick={() => setDeleteReceiverTarget(null)}
                className="px-4 py-1.5 bg-white border border-[#cbd5e1] text-gray-700 hover:bg-gray-100 rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingReceiver}
                onClick={handleConfirmDeleteReceiver}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {isDeletingReceiver ? 'Deleting...' : 'Yes, Delete Beneficiary'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
