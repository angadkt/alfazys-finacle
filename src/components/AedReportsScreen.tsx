import FinacleDatePicker from './FinacleDatePicker';
import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import CostRateModal from './CostRateModal';

interface Customer {
  id: string;
  name: string;
  internal_id?: string;
}

export default function AedReportsScreen() {
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [filterAgent, setFilterAgent] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [receivedAedTotalSum, setReceivedAedTotalSum] = useState<number>(0);
  const [currentCostRate, setCurrentCostRate] = useState<number | null>(null);
  const [isCostRateModalOpen, setIsCostRateModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch Customers list
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/records/parties');
        const list = (res.data?.records || []).map((c: any) => ({
          id: c.cif_no || c.id,
          internal_id: String(c.id),
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.short_name || c.cif_no || 'Unknown',
        }));
        setCustomers(list);
      } catch {
        /* silent */
      }
    };
    fetchCustomers();
  }, []);

  // Fetch Cost Rate
  const fetchCostRate = async () => {
    try {
      const dateParam = filterDate || new Date().toISOString().slice(0, 10);
      const res = await api.get(`/records/cost-rate?date=${encodeURIComponent(dateParam)}`);
      if (res.data?.cost_rate !== null && res.data?.cost_rate !== undefined) {
        setCurrentCostRate(parseFloat(res.data.cost_rate));
      } else {
        setCurrentCostRate(null);
      }
    } catch {
      setCurrentCostRate(null);
    }
  };

  useEffect(() => {
    fetchCostRate();
  }, [filterDate]);

  const handleCostRateSaved = (_date: string, rate: number) => {
    setCurrentCostRate(rate);
  };

  // Fetch Orders and Received AED data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders for calculations
      let ordersUrl = `/records/orders?page=1&limit=200`;
      if (filterDate) ordersUrl += `&date=${encodeURIComponent(filterDate)}`;
      if (filterAgent) ordersUrl += `&party_id=${encodeURIComponent(filterAgent)}`;
      const ordersRes = await api.get(ordersUrl);
      setOrders(ordersRes.data?.records || []);

      // 2. Fetch Received AED total sum
      let aedSumUrl = `/records/received-aed/summary?`;
      if (filterDate) aedSumUrl += `&date=${encodeURIComponent(filterDate)}`;
      if (filterAgent) {
        const selectedCust = customers.find(c => String(c.internal_id) === String(filterAgent) || c.id === filterAgent);
        if (selectedCust) {
          aedSumUrl += `&agent=${encodeURIComponent(selectedCust.name)}`;
        }
      }
      const aedSumRes = await api.get(aedSumUrl);
      setReceivedAedTotalSum(parseFloat(aedSumRes.data?.totalAedSum || 0));
    } catch (err) {
      console.error('Failed to load AED report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterDate, filterAgent, customers]);

  // Exact calculations from OrderEntryForm
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
    partialOrdersCount,
    totalProfitAed,
    marginPct,
  } = useMemo(() => {
    let aedSum = 0;
    let inrSum = 0;
    let transferredInrSum = 0;

    let paidOrdersCount = 0;
    let partialOrdersCount = 0;
    let pendingOrdersCount = 0;

    for (const o of orders) {
      if (!o) continue;

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

    const recAed = receivedAedTotalSum || 0;
    const pendAed = Math.max(0, Math.round((aedSum - recAed) * 100) / 100);
    const aedPct = aedSum > 0 ? Math.min(100, (recAed / aedSum) * 100) : 0;

    const unclrInr = Math.max(0, Math.round((inrSum - transferredInrSum) * 100) / 100);
    const inrPct = inrSum > 0 ? Math.min(100, (transferredInrSum / inrSum) * 100) : 0;

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
      orderCount: orders.length,
      paidOrdersCount,
      partialOrdersCount,
      pendingOrdersCount,
      totalCostAed,
      totalProfitAed,
      marginPct,
      hasCostRate,
    };
  }, [orders, currentCostRate, receivedAedTotalSum]);

  // Top Agents / Counterparties Leaderboard by Volume
  const agentLeaderboard = useMemo(() => {
    const map: Record<string, { name: string; aed: number; inr: number; count: number }> = {};
    for (const o of orders) {
      if (!o) continue;
      let name = (o.party_name || o.agent_customer || '').trim();
      if (!name && o.party_id) {
        const match = customers.find(c => String(c.internal_id) === String(o.party_id) || c.id === o.party_id);
        name = match ? match.name : `CIF: ${o.party_id}`;
      }
      if (!name) name = 'Direct / Counter Client';

      // Calculate order AED
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

      // Calculate order INR
      let inr = 0;
      if (o.inr_value !== undefined && o.inr_value !== null && o.inr_value !== '') {
        const parsed = typeof o.inr_value === 'number' ? o.inr_value : parseFloat(String(o.inr_value).replace(/,/g, ''));
        if (!isNaN(parsed) && isFinite(parsed)) inr = parsed;
      } else if (o.receivers_data) {
        let recs = o.receivers_data;
        if (typeof recs === 'string') {
          try { recs = JSON.parse(recs); } catch { recs = []; }
        }
        if (Array.isArray(recs)) {
          inr = recs.reduce((sum: number, acc: any) => {
            const amt = parseFloat(String(acc?.orderAmount || '').replace(/,/g, ''));
            return !isNaN(amt) ? sum + amt : sum;
          }, 0);
        }
      }

      if (!map[name]) {
        map[name] = { name, aed: 0, inr: 0, count: 0 };
      }
      map[name].aed += aed;
      map[name].inr += inr;
      map[name].count += 1;
    }

    return Object.values(map).sort((a, b) => b.aed - a.aed);
  }, [orders, customers]);

  return (
    <div className="flex-1 bg-[#d4d0c8] flex flex-col h-full overflow-hidden select-none" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Title Bar */}
      <div className="bg-[#e4e4e4] border-b border-[#a0a0a0] px-3 py-2 flex items-center justify-between shadow-xs">
        <div>
          <h4 className="text-[15px] font-extrabold text-black m-0 capitalize tracking-wide">
            AED Collection & Financial Summary Report
          </h4>
          <span className="text-[11px] text-gray-600">
            FINCORE Universal Settlement Module • Real-Time Daily Financial Yield & Remittance Audit
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-[#eaf0f8] border border-[#a2b5cd] text-[#1e4676] font-bold px-2.5 py-1 rounded">
            Filtered Date: {filterDate ? filterDate : 'All Available Dates'}
          </span>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 bg-white border border-[#a0a0a0] m-1 flex flex-col overflow-y-auto">
        {/* Date Filter & Control Toolbar */}
        <div className="p-3 bg-[#f8f9fa] border-b border-[#a0a0a0] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick date pills */}
            <div className="flex items-center border border-[#c4d4ec] rounded overflow-hidden text-xs bg-white">
              <button
                onClick={() => setFilterDate(new Date().toISOString().slice(0, 10))}
                className={`px-3 py-1 font-bold cursor-pointer ${
                  filterDate === new Date().toISOString().slice(0, 10)
                    ? 'bg-[#1e4676] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => {
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  setFilterDate(y.toISOString().slice(0, 10));
                }}
                className="px-3 py-1 font-medium text-gray-700 hover:bg-gray-100 cursor-pointer border-l border-[#c4d4ec]"
              >
                Yesterday
              </button>
              <button
                onClick={() => setFilterDate('')}
                className={`px-3 py-1 font-bold cursor-pointer border-l border-[#c4d4ec] ${
                  !filterDate ? 'bg-[#1e4676] text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Time
              </button>
            </div>

            {/* Custom Date Input */}
            <div className="flex items-center gap-1.5 bg-white border border-[#c4d4ec] px-2.5 py-1 rounded">
              <span className="text-[#1e4676] font-bold text-[11px]">Select Date:</span>
              <FinacleDatePicker
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent text-xs text-gray-700 min-w-[110px]"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="text-gray-400 hover:text-red-500 font-bold text-xs"
                  title="Clear Date"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Agent / Customer Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-[#c4d4ec] px-2.5 py-1 rounded">
              <span className="text-[#1e4676] font-bold text-[11px]">Agent/Customer:</span>
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="bg-transparent text-xs text-gray-700 focus:outline-none max-w-[200px]"
              >
                <option value="">All Parties</option>
                {customers.map((c) => (
                  <option key={c.internal_id || c.id} value={c.internal_id || c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
              {filterAgent && (
                <button
                  onClick={() => setFilterAgent('')}
                  className="text-gray-400 hover:text-red-500 font-bold text-xs"
                  title="Clear Agent"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={fetchData}
              className="bg-[#1e4676] text-white text-[11px] font-bold px-3 py-1 rounded hover:bg-[#15345b] cursor-pointer"
            >
              Refresh Report
            </button>
          </div>

          <div className="text-xs text-gray-500">
            {loading ? 'Fetching summary...' : `${orderCount} order${orderCount !== 1 ? 's' : ''} in report`}
          </div>
        </div>

        {/* SUMMARY CARDS SECTION — Ultra-Compact Slim Mode matching OrderEntryForm */}
        <div className="p-3 space-y-2.5">
          {/* ── Group 1: AED Collections (3 Cards) ── */}
          <div className="mb-2">
            <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#104080] mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#104080]"></span>
              AED Collections (Agent Receivables)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* 1. Total AED */}
              <div className="bg-[#f4f7fb] border border-[#a2b5cd] rounded-sm px-2.5 py-1.5 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#104080]">Total AED Amount</span>
                    <span className="text-[9px] font-bold text-[#104080] bg-[#eaf0f8] border border-[#a2b5cd] px-1.5 py-0.2 rounded-full">
                      {orderCount} Order{orderCount !== 1 ? 's' : ''}
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
                  <span>Gross Order Value</span>
                  <span className="font-semibold text-gray-600">{filterDate ? filterDate : 'All dates'}</span>
                </div>
              </div>

              {/* 2. Received AED */}
              <div className="bg-[#f0fbf4] border border-[#7ec89b] rounded-sm px-2.5 py-1.5 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#0f5132]">Received AED</span>
                    <span className="text-[9px] font-bold text-[#0f5132] bg-[#dcf5e3] border border-[#9ed9b4] px-1.5 py-0.2 rounded-full">
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
          <div className="mb-2">
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
                <div className="text-[9px] text-[#854d0e] mt-1.5 pt-1 border-t border-[#fae6b2] flex items-center justify-between">
                  <span>Pending Beneficiary Payouts</span>
                  <span className="font-semibold text-gray-700">
                    {unclearedInr === 0 ? "All Beneficiaries Paid" : "Awaiting Bank Settlement"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Group 3: Financial Yield & Profit Analysis ── */}
          <div className="bg-[#f8f9fa] border-2 border-[#1e4676] rounded-sm p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-[#c4d4ec] pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1e4676]"></span>
                <span className="text-[13px] font-extrabold text-[#1e4676] uppercase tracking-wider">
                  Net Profit & Forex Yield Audit
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>Current Cost Rate:</span>
                {currentCostRate ? (
                  <button
                    type="button"
                    onClick={() => setIsCostRateModalOpen(true)}
                    className="font-bold text-[#0d6e5a] bg-[#d6f5e8] border border-[#a2e8c8] hover:bg-[#bbf0d8] px-2.5 py-0.5 rounded-full transition-colors cursor-pointer text-xs"
                    title="Click to view or edit cost rate"
                  >
                    Cost: {currentCostRate.toFixed(4)}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCostRateModalOpen(true)}
                    className="font-bold text-[#104080] bg-[#eaf0f8] border border-[#a2b5cd] hover:bg-[#dbe8f9] px-2.5 py-0.5 rounded-full transition-colors cursor-pointer text-xs"
                    title="Click to set daily cost rate"
                  >
                    Set Rate
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Est Profit AED */}
              <div className="bg-white border border-[#c4d4ec] p-3 rounded">
                <span className="text-[10.5px] font-bold text-gray-500 uppercase block mb-1">
                  Estimated Profit (AED)
                </span>
                <span className={`text-[22px] font-extrabold font-mono ${totalProfitAed >= 0 ? 'text-[#0f5132]' : 'text-red-600'}`}>
                  {totalProfitAed >= 0 ? '+' : ''}{totalProfitAed.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
                </span>
                <span className="text-[10px] text-gray-400 block mt-1">Based on Gross AED minus Cost AED</span>
              </div>

              {/* Est Profit INR */}
              <div className="bg-white border border-[#c4d4ec] p-3 rounded">
                <span className="text-[10.5px] font-bold text-gray-500 uppercase block mb-1">
                  Estimated Profit (INR)
                </span>
                <span className={`text-[22px] font-extrabold font-mono ${totalProfitAed >= 0 ? 'text-[#0f5132]' : 'text-red-600'}`}>
                  ₹ {(totalProfitAed * (currentCostRate || 23)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-gray-400 block mt-1">Converted at baseline rate</span>
              </div>

              {/* Yield Margin % */}
              <div className="bg-white border border-[#c4d4ec] p-3 rounded">
                <span className="text-[10.5px] font-bold text-gray-500 uppercase block mb-1">
                  Forex Margin %
                </span>
                <span className={`text-[22px] font-extrabold font-mono ${marginPct >= 0 ? 'text-[#1e4676]' : 'text-red-600'}`}>
                  {marginPct.toFixed(2)}%
                </span>
                <span className="text-[10px] text-gray-400 block mt-1">Net profit margin over gross AED</span>
              </div>

              {/* Clearance Ratio */}
              <div className="bg-white border border-[#c4d4ec] p-3 rounded">
                <span className="text-[10.5px] font-bold text-gray-500 uppercase block mb-1">
                  Order Clearance Ratio
                </span>
                <span className="text-[22px] font-extrabold font-mono text-[#0d6e5a]">
                  {orderCount > 0 ? Math.round((paidOrdersCount / orderCount) * 100) : 100}%
                </span>
                <span className="text-[10px] text-gray-400 block mt-1">
                  {paidOrdersCount} of {orderCount} fully completed
                </span>
              </div>
            </div>
          </div>

          {/* ── VISUAL ANALYTICS & GRAPH SECTION ── */}
          <div className="border border-[#c4d4ec] bg-white rounded-sm p-4 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-[#e4e4e4] pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-extrabold text-[#1e4676] uppercase tracking-wide">
                  Financial Volume & Collection Breakdown Graph
                </span>
              </div>
              <span className="text-[11px] text-gray-500">Live Visual Comparison</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Comparison Bar Graph */}
              <div className="lg:col-span-2 flex flex-col justify-center">
                <span className="text-[11px] font-bold text-gray-600 mb-3">Order vs Collection vs Remaining Liquidity (AED)</span>
                
                {/* Visual Comparative Bars */}
                <div className="space-y-4">
                  {/* Total Order AED Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#104080] mb-1">
                      <span>Total Booked Order Volume</span>
                      <span>{totalAed.toLocaleString('en-US', { minimumFractionDigits: 2 })} AED</span>
                    </div>
                    <div className="w-full bg-gray-100 h-6 rounded border border-[#a2b5cd] overflow-hidden">
                      <div className="bg-[#104080] h-full rounded transition-all duration-500" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  {/* Received AED Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#0f5132] mb-1">
                      <span>Received & Confirmed Collection</span>
                      <span>{receivedAed.toLocaleString('en-US', { minimumFractionDigits: 2 })} AED ({aedCollectionPct.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-6 rounded border border-[#7ec89b] overflow-hidden">
                      <div 
                        className="bg-[#0f5132] h-full rounded transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(2, aedCollectionPct))}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Pending AED Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#92400e] mb-1">
                      <span>Outstanding / Pending Collection</span>
                      <span>{pendingAed.toLocaleString('en-US', { minimumFractionDigits: 2 })} AED</span>
                    </div>
                    <div className="w-full bg-gray-100 h-6 rounded border border-[#fae29c] overflow-hidden">
                      <div 
                        className="bg-[#b45309] h-full rounded transition-all duration-500" 
                        style={{ width: `${totalAed > 0 ? Math.min(100, (pendingAed / totalAed) * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Profit Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#1e4676] mb-1">
                      <span>Estimated Profit Yield</span>
                      <span>{totalProfitAed.toLocaleString('en-US', { minimumFractionDigits: 2 })} AED ({marginPct.toFixed(1)}% margin)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-6 rounded border border-[#c4d4ec] overflow-hidden">
                      <div 
                        className="bg-[#316ac5] h-full rounded transition-all duration-500" 
                        style={{ width: `${Math.max(2, Math.min(100, Math.abs(marginPct) * 3))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Agents / Counterparties Leaderboard Card */}
              <div className="bg-[#f8f9fa] border border-[#c4d4ec] rounded p-3 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-2 border-b border-[#e4e4e4] pb-1.5">
                    <span className="text-[11px] font-bold text-[#1e4676] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#1e4676]"></span>
                      Top Agents by Volume
                    </span>
                    <span className="text-[10px] text-gray-500 font-semibold">
                      {agentLeaderboard.length} {agentLeaderboard.length === 1 ? 'Counterparty' : 'Counterparties'}
                    </span>
                  </div>

                  {agentLeaderboard.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs">No orders recorded for this filter.</div>
                  ) : (
                    <div className="space-y-2 max-h-[225px] overflow-y-auto pr-0.5 custom-scrollbar">
                      {agentLeaderboard.slice(0, 5).map((item, idx) => {
                        const pct = totalAed > 0 ? ((item.aed / totalAed) * 100).toFixed(1) : '0';
                        const rankColors = [
                          'bg-[#d97706] text-white', // Gold #1
                          'bg-[#64748b] text-white', // Silver #2
                          'bg-[#b45309] text-white', // Bronze #3
                          'bg-[#2563eb] text-white', // Blue #4
                          'bg-[#475569] text-white'  // Slate #5
                        ];
                        const badgeColor = rankColors[idx] || 'bg-[#64748b] text-white';

                        return (
                          <div key={item.name} className="bg-white border border-[#e2e8f0] p-2 rounded hover:border-[#a2b5cd] transition-all">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${badgeColor} shrink-0`}>
                                  #{idx + 1}
                                </span>
                                <span className="text-xs font-bold text-[#1e4676] truncate" title={item.name}>
                                  {item.name}
                                </span>
                              </div>
                              <span className="text-[10px] bg-[#f0f4f8] text-[#1e4676] font-semibold px-1.5 py-0.2 rounded border border-[#d2dfec] shrink-0">
                                {item.count} {item.count === 1 ? 'order' : 'orders'}
                              </span>
                            </div>

                            <div className="flex justify-between items-baseline text-xs mb-1">
                              <span className="text-[10px] text-gray-500">
                                Vol: ₹{item.inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </span>
                              <span className="font-bold text-gray-800">
                                {item.aed.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
                              </span>
                            </div>

                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#1e4676] h-full rounded-full transition-all duration-300" 
                                style={{ width: `${Math.min(100, Math.max(2, parseFloat(pct)))}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center text-[9px] text-gray-400 mt-0.5">
                              <span>Share of turnover</span>
                              <span className="font-semibold text-gray-600">{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#e4e4e4] text-[10px] text-gray-500 flex justify-between items-center">
                  <span>Source: Booked Orders Ledger</span>
                  <span className="font-semibold text-[#1e4676]">
                    {agentLeaderboard.length > 5 ? `Top 5 of ${agentLeaderboard.length} shown` : 'Live Order Ranking'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CostRateModal
        isOpen={isCostRateModalOpen}
        onClose={() => setIsCostRateModalOpen(false)}
        initialDate={filterDate || new Date().toISOString().slice(0, 10)}
        onRateSaved={handleCostRateSaved}
      />
    </div>
  );
}
